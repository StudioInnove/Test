"""Tile-based x4 Real-ESRGAN upscale on CPU, then a high-quality resize to the target width.
usage: upscale.py model.onnx out_width in1.png [in2.png ...] --out DIR
"""
import sys, os, time
import numpy as np
import onnxruntime as ort
from PIL import Image

args = sys.argv[1:]
out_dir = args[args.index("--out") + 1]
args = args[: args.index("--out")]
model, width, files = args[0], int(args[1]), args[2:]
os.makedirs(out_dir, exist_ok=True)

so = ort.SessionOptions()
so.intra_op_num_threads = os.cpu_count() or 2
so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
sess = ort.InferenceSession(model, so, providers=["CPUExecutionProvider"])

TILE, PAD, S = 384, 12, 4


def sr(img: np.ndarray) -> np.ndarray:
    h, w, _ = img.shape
    out = np.zeros((h * S, w * S, 3), np.float32)
    for y in range(0, h, TILE):
        for x in range(0, w, TILE):
            y0, x0 = max(0, y - PAD), max(0, x - PAD)
            y1, x1 = min(h, y + TILE + PAD), min(w, x + TILE + PAD)
            t = img[y0:y1, x0:x1].transpose(2, 0, 1)[None]
            r = sess.run(None, {"input": t})[0][0].transpose(1, 2, 0)
            ty, tx = (y - y0) * S, (x - x0) * S
            hh, ww = min(TILE, h - y) * S, min(TILE, w - x) * S
            out[y * S:y * S + hh, x * S:x * S + ww] = r[ty:ty + hh, tx:tx + ww]
    return out


for f in files:
    dst = os.path.join(out_dir, os.path.splitext(os.path.basename(f))[0] + ".png")
    if os.path.exists(dst):
        continue  # resume: already done
    t0 = time.time()
    im = Image.open(f).convert("RGB")
    a = np.asarray(im, np.float32) / 255.0
    o = np.clip(sr(a), 0, 1)
    big = Image.fromarray((o * 255 + 0.5).astype(np.uint8))
    h = round(width * big.height / big.width)
    # keep a little of the original's natural texture so nothing looks plastic
    sharp = big.resize((width, h), Image.LANCZOS)
    plain = im.resize((width, h), Image.LANCZOS)
    Image.blend(plain, sharp, 0.8).save(dst + ".tmp.png")
    os.replace(dst + ".tmp.png", dst)
    print(f"{os.path.basename(f)} {im.size} -> {width}x{h} in {time.time() - t0:.1f}s", flush=True)
