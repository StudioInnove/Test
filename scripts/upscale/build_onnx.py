"""Convert Real-ESRGAN realesr-general-x4v3 (SRVGGNetCompact) weights to ONNX without PyTorch."""
import pickle, zipfile, sys
import numpy as np
import onnx
from onnx import helper, TensorProto, numpy_helper

PTH = sys.argv[1]
OUT = sys.argv[2]

z = zipfile.ZipFile(PTH)
root = z.namelist()[0].split("/")[0]


class Storage:
    def __init__(self, key, dtype):
        self.key, self.dtype = key, dtype


DT = {"FloatStorage": np.float32, "HalfStorage": np.float16}


def rebuild_tensor(storage, offset, size, stride, *a):
    data = np.frombuffer(z.read(f"{root}/data/{storage.key}"), dtype=storage.dtype)
    if not size:
        return data[offset:offset + 1].reshape(())
    arr = np.lib.stride_tricks.as_strided(data[offset:], shape=size, strides=[s * data.itemsize for s in stride])
    return np.array(arr)


class U(pickle.Unpickler):
    def find_class(self, mod, name):
        if name == "_rebuild_tensor_v2":
            return rebuild_tensor
        if mod == "collections" and name == "OrderedDict":
            import collections
            return collections.OrderedDict
        if name in DT:
            return name
        return super().find_class(mod, name)

    def persistent_load(self, pid):
        _, stype, key, loc, n = pid
        return Storage(key, DT[stype])


sd = U(z.open(f"{root}/data.pkl")).load()
sd = sd.get("params", sd.get("params_ema", sd))
keys = sorted({int(k.split(".")[1]) for k in sd}, key=int)
print("layers", len(keys), "last", keys[-1])

nodes, inits = [], []
cur = "input"
for i in keys:
    w = sd[f"body.{i}.weight"].astype(np.float32)
    if w.ndim == 4:
        inits += [numpy_helper.from_array(w, f"w{i}"), numpy_helper.from_array(sd[f"body.{i}.bias"].astype(np.float32), f"b{i}")]
        nodes.append(helper.make_node("Conv", [cur, f"w{i}", f"b{i}"], [f"c{i}"], pads=[1, 1, 1, 1], kernel_shape=[3, 3]))
        cur = f"c{i}"
    else:  # PReLU, per-channel slope
        inits.append(numpy_helper.from_array(w.reshape(-1, 1, 1), f"w{i}"))
        nodes.append(helper.make_node("PRelu", [cur, f"w{i}"], [f"p{i}"]))
        cur = f"p{i}"
nodes.append(helper.make_node("DepthToSpace", [cur], ["ps"], blocksize=4, mode="CRD"))
inits.append(numpy_helper.from_array(np.array([1, 1, 4, 4], np.float32), "scales"))
nodes.append(helper.make_node("Resize", ["input", "", "scales"], ["up"], mode="nearest"))
nodes.append(helper.make_node("Add", ["ps", "up"], ["output"]))
g = helper.make_graph(nodes, "srvgg", [helper.make_tensor_value_info("input", TensorProto.FLOAT, [1, 3, None, None])],
                      [helper.make_tensor_value_info("output", TensorProto.FLOAT, [1, 3, None, None])], inits)
m = helper.make_model(g, opset_imports=[helper.make_opsetid("", 17)], ir_version=9)
onnx.checker.check_model(m)
onnx.save(m, OUT)
print("saved", OUT)
