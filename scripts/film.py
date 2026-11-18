#!/usr/bin/env python3
"""Turn the film sources into web assets.

Usage:  python3 scripts/film.py <source-folder>

The source folder may contain (any missing file is skipped):
  s1.png s1n.png s2.png s3.png s4.png s5.png s6.png   stills (16:9)
  d1.png d1n.png d2.png ... d6.png                    depth maps (white = near)
  c0.mp4 ... c6.mp4                                   clips (start/end on the stills)

Writes public/film/** and public/film/manifest.json, which the site reads.
"""
import json, os, subprocess, sys, shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "film")
STILLS = ["s1", "s1n", "s2", "s3", "s4", "s5", "s6"]
CLIPS = {  # clip -> (from still, to still)
    "c0": ("s1", "s1n"), "c1": ("s1n", "s2"), "c2": ("s2", "s3"), "c3": ("s3", "s4"),
    "c4": ("s4", "s5"), "c5": ("s5", "s6"), "c6": ("s6", "s1n"),
}
SIZES = {"d": 1928, "m": 1080}   # desktop, mobile widths
FPS = 12                          # frames are blended in the shader, so 12 fps scrubs smoothly


def save_webp(im, path, width, q):
    h = round(width * im.height / im.width)
    im.convert("RGB").resize((width, h), Image.LANCZOS).save(path, "WEBP", quality=q, method=6)


def main(src):
    os.makedirs(OUT, exist_ok=True)
    manifest = {"fps": FPS, "stills": {}, "clips": {}}
    for s in STILLS:
        p = os.path.join(src, s + ".png")
        if not os.path.exists(p):
            continue
        im = Image.open(p)
        entry = {}
        for k, w in {"d": 2400, "m": 1280}.items():
            rel = f"stills/{s}-{k}.webp"
            os.makedirs(os.path.join(OUT, "stills"), exist_ok=True)
            save_webp(im, os.path.join(OUT, rel), w, 80 if k == "d" else 76)
            entry[k] = "/film/" + rel
        dp = os.path.join(src, "d" + s[1:] + ".png")
        if os.path.exists(dp):
            rel = f"stills/{s}-depth.webp"
            save_webp(Image.open(dp).convert("L"), os.path.join(OUT, rel), 960, 85)
            entry["depth"] = "/film/" + rel
        manifest["stills"][s] = entry
    for c, (a, b) in CLIPS.items():
        p = os.path.join(src, c + ".mp4")
        if not os.path.exists(p):
            continue
        entry = {"from": a, "to": b}
        for k, w in SIZES.items():
            d = os.path.join(OUT, c, k)
            shutil.rmtree(d, ignore_errors=True)
            os.makedirs(d)
            q = 80 if k == "d" else 74
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", p,
                            "-vf", f"fps={FPS},scale={w}:-2:flags=lanczos,unsharp=5:5:0.45:5:5:0",
                            "-c:v", "libwebp", "-quality", str(q), "-compression_level", "6",
                            os.path.join(d, "%03d.webp")], check=True)
            n = len([f for f in os.listdir(d) if f.endswith(".webp")])
            entry[k] = {"path": f"/film/{c}/{k}/", "frames": n}
        manifest["clips"][c] = entry
    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main(sys.argv[1])
