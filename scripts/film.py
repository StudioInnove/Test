#!/usr/bin/env python3
"""Turn the film sources into web assets.

Usage:  python3 scripts/film.py <source-folder> [<upscaled-folder>]

The optional upscaled folder holds AI-upscaled masters (Real-ESRGAN, see scripts/upscale/):
  stills/s1n.png ...          stills, used instead of the originals
  frames/c1/001.png ...       clip frames at the clip's fps, used instead of the .mp4

The source folder may contain (any missing file is skipped):
  s1n.png s2.png ... s6.png   stills (16:9)
  c1.mp4 ... c6.mp4 cl.mp4    clips (start/end on the stills; cl is the seamless night loop)

Two sets are written:
  d  desktop: the full 16:9 frame
  m  phones:  a portrait crop that follows the subject (MFOCUS), sharp on a tall screen
Clip frames are packed SHEET to a file, stacked top to bottom, so a clip is a handful of
downloads instead of dozens; the site cuts them apart after decoding.

Writes public/film/** and public/film/manifest.json, which the site reads.
"""
import json, os, subprocess, sys, shutil, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "film")
STILLS = ["s1n", "s2", "s3", "s4", "s7", "s5", "s6", "s1d"]  # s1d: the sunrise at the end
CLIPS = {  # clip -> (from still, to still)
    "c1": ("s1n", "s2"), "c2": ("s2", "s3"), "c3": ("s3", "s4"),
    "c4": ("s4", "s5"), "c7": ("s4", "s7"), "c8": ("s7", "s5"), "c5": ("s5", "s6"), "c6": ("s6", "s1n"),
    "cl": ("s1n", "s1n"),  # seamless night loop: plays in real time on the hero and the close
}
FPS = 12                 # frames are blended in the shader, so 12 fps scrubs smoothly
CLIP_FPS = {"cl": 15}    # the loop plays in real time, so it gets a few more frames
SHEET = 4                # frames per file
D_W = {"clip": 2400, "still": 3200}   # desktop widths (upscaled sources)
M_ASPECT = 0.72          # phone crop, width / height (screens are taller: the crop leaves room to pan)
M_H = {"clip": 1200, "still": 1600}   # phone heights

# Where the subject sits horizontally on a phone (0..1); the phone frames are cropped around it.
MFOCUS = {"s1n": 0.62, "s1d": 0.62, "s2": 0.5, "s3": 0.5, "s4": 0.64, "s5": 0.45, "s6": 0.5, "s7": 0.49}


def crop_m(im, fx, h_out):
    W, H = im.size
    cw = round(H * M_ASPECT)
    x0 = min(max(0, round(fx * W - cw / 2)), W - cw)
    return im.crop((x0, 0, x0 + cw, H)).resize((round(h_out * M_ASPECT), h_out), Image.LANCZOS)


def fit_w(im, w):
    return im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)


def frames_of(c, src, up):
    """The clip's frames as a sorted list of PNG paths (upscaled, or extracted from the mp4)."""
    fdir = os.path.join(up, "frames", c) if up else ""
    if fdir and os.path.isdir(fdir) and len([f for f in os.listdir(fdir) if f.endswith(".png")]) > 1:
        return sorted(os.path.join(fdir, f) for f in os.listdir(fdir) if f.endswith(".png") and ".tmp" not in f)
    p = os.path.join(src, c + ".mp4")
    if not os.path.exists(p):
        return []
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", p, "-vf", f"fps={CLIP_FPS.get(c, FPS)}",
                    os.path.join(tmp, "%03d.png")], check=True)
    return sorted(os.path.join(tmp, f) for f in os.listdir(tmp))


def main(src, up=None):
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(os.path.join(OUT, "stills"))
    manifest = {"fps": FPS, "sheet": SHEET, "mAspect": M_ASPECT, "stills": {}, "clips": {}}

    for s in STILLS:
        p = os.path.join(up, "stills", s + ".png") if up else ""
        if not (p and os.path.exists(p)):
            p = os.path.join(src, s + ".png")
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert("RGB")
        fit_w(im, min(D_W["still"], max(2400, im.width))).save(os.path.join(OUT, "stills", f"{s}-d.webp"), "WEBP", quality=80, method=6)
        crop_m(im, MFOCUS[s], M_H["still"]).save(os.path.join(OUT, "stills", f"{s}-m.webp"), "WEBP", quality=78, method=6)
        manifest["stills"][s] = {"d": f"/film/stills/{s}-d.webp", "m": f"/film/stills/{s}-m.webp"}

    skip = set(filter(None, os.environ.get("SKIP", "").split(",")))
    for c, (a, b) in CLIPS.items():
        if c in skip:
            continue
        files = frames_of(c, src, up)
        n = len(files)
        if n < 2:
            continue
        entry = {"from": a, "to": b, "fps": CLIP_FPS.get(c, FPS)}
        for k in ("d", "m"):
            os.makedirs(os.path.join(OUT, c, k))
        for si in range(0, n, SHEET):
            group = []
            for i in range(si, min(n, si + SHEET)):
                im = Image.open(files[i]).convert("RGB")
                t = i / (n - 1)
                fx = MFOCUS[a] + (MFOCUS[b] - MFOCUS[a]) * t
                group.append((fit_w(im, D_W["clip"]), crop_m(im, fx, M_H["clip"])))
            for k, idx in (("d", 0), ("m", 1)):
                fr = [g[idx] for g in group]
                w, h = fr[0].size
                sheet = Image.new("RGB", (w, h * len(fr)))
                for j, f in enumerate(fr):
                    sheet.paste(f, (0, j * h))
                sheet.save(os.path.join(OUT, c, k, f"{si // SHEET + 1:03d}.webp"), "WEBP", quality=80 if k == "d" else 76, method=4)
        w_d, h_d = group[0][0].size
        w_m, h_m = group[0][1].size
        entry["d"] = {"path": f"/film/{c}/d/", "frames": n, "w": w_d, "h": h_d}
        entry["m"] = {"path": f"/film/{c}/m/", "frames": n, "w": w_m, "h": h_m}
        manifest["clips"][c] = entry
        print(c, n, "frames", flush=True)

    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
