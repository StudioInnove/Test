"""Find the small bright lights in each room's windows, so the site can make them twinkle in place.
Writes components/film/lights.json: { still: { lights: [[u, v, r, R, G, B], ...] } } (u, v on the full 16:9 still, r in still widths)."""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

# window areas per still (u0, v0, u1, v1), and things to leave out (screens, lamps)
REGIONS = {
    "s3": dict(win=[(0.19, 0.08, 0.83, 0.86)], skip=[(0.385, 0.49, 0.615, 0.77), (0.44, 0.15, 0.56, 0.33)], max=170, bokeh=False),
    "s4": dict(win=[(0.19, 0.0, 0.70, 0.62)], skip=[(0.56, 0.0, 0.74, 0.1), (0.27, 0.04, 0.33, 0.42)], max=60, bokeh=True),
    "s5": dict(win=[(0.67, 0.2, 1.0, 0.74)], skip=[(0.71, 0.5, 0.96, 0.66)], max=110, bokeh=False),
    "s6": dict(win=[(0.10, 0.10, 0.89, 0.50)], skip=[(0.38, 0.41, 0.62, 0.66), (0.48, 0.1, 0.52, 0.45)], max=70, bokeh=True),
    # the terrace: the city either side of the pavilion, and the string lights along the deck
    "s2": dict(win=[(0.0, 0.28, 0.35, 0.62), (0.82, 0.33, 1.0, 0.6), (0.08, 0.66, 0.45, 0.82), (0.7, 0.8, 0.98, 0.97)], skip=[], max=120, bokeh=False),
    # sunrise: the windows still lit in the towers
    "s1d": dict(win=[(0.0, 0.45, 1.0, 1.0)], skip=[(0.86, 0.3, 1.0, 0.5)], max=90, bokeh=False, thr=0.5),
    # the close-ups
    "w-web": dict(win=[(0.0, 0.15, 0.25, 0.8), (0.72, 0.2, 0.87, 0.75)], skip=[(0.24, 0.4, 0.74, 0.86)], max=90, bokeh=False, src="public/worlds/web-d.webp"),
    "w-mobile": dict(win=[(0.05, 0.3, 0.85, 0.6)], skip=[(0.33, 0.33, 0.86, 0.9), (0.0, 0.45, 0.4, 0.9)], max=40, bokeh=True, src="public/worlds/mobile-d.webp"),
    "w-orig": dict(win=[(0.0, 0.0, 1.0, 0.24), (0.0, 0.0, 0.2, 0.6), (0.82, 0.0, 1.0, 0.6)], skip=[(0.42, 0.0, 0.52, 0.26), (0.3, 0.0, 0.37, 0.24)], max=50, bokeh=True, src="public/worlds/originals-d.webp"),
}

out = {}
for still, cfg in REGIONS.items():
    im = Image.open(cfg.get("src", f"public/film/stills/{still}-d.webp")).convert("RGB")
    W, H = im.size
    a = np.asarray(im).astype(np.float32) / 255
    lum = a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11
    mask = np.zeros_like(lum, bool)
    for u0, v0, u1, v1 in cfg["win"]:
        mask[int(v0 * H):int(v1 * H), int(u0 * W):int(u1 * W)] = True
    for u0, v0, u1, v1 in cfg["skip"]:
        mask[int(v0 * H):int(v1 * H), int(u0 * W):int(u1 * W)] = False
    size = 41 if cfg["bokeh"] else 9
    blur = ndimage.gaussian_filter(lum, 6 if cfg["bokeh"] else 1.2)
    local = ndimage.maximum_filter(blur, size=size)
    # a light: brighter than its surroundings, and bright in absolute terms
    bg = ndimage.uniform_filter(blur, size=size * 4)
    peaks = (blur == local) & mask & (blur > cfg.get("thr", 0.42)) & (blur - bg > (0.08 if cfg["bokeh"] else 0.12))
    ys, xs = np.nonzero(peaks)
    score = (blur - bg)[ys, xs]
    order = np.argsort(-score)
    pts = []
    taken = []
    for k in order:
        x, y = xs[k], ys[k]
        if any((x - tx) ** 2 + (y - ty) ** 2 < (size * 1.2) ** 2 for tx, ty in taken):
            continue
        taken.append((x, y))
        # radius: how far the light reaches above half its peak
        pk = blur[y, x]
        r = 1
        while r < (60 if cfg["bokeh"] else 8) and x + r < W and blur[y, x + r] > pk * 0.6:
            r += 1
        c = a[max(0, y - 1):y + 2, max(0, x - 1):x + 2].reshape(-1, 3).mean(0)
        pts.append([round(x / W, 5), round(y / H, 5), round(max(r, 1.5) / W, 5), *[int(v * 255) for v in c]])
        if len(pts) >= cfg["max"]:
            break
    out[still] = {"lights": pts}
    print(still, len(pts))
json.dump(out, open("components/film/lights.json", "w"), separators=(",", ":"))
