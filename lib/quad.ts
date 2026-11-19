/**
 * CSS matrix3d that maps a w×h element (transform-origin 0 0) onto four screen points
 * (top-left, top-right, bottom-right, bottom-left), so a live screen sits exactly on a screen in a photo.
 */
export function quadMatrix(w: number, h: number, p: [number, number][]): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let a, b, c, d, e, f, g, hh;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) {
    a = x1 - x0; b = x2 - x1; c = x0; d = y1 - y0; e = y2 - y1; f = y0; g = 0; hh = 0;
  } else {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    hh = (dx1 * dy3 - dx3 * dy1) / den;
    a = x1 - x0 + g * x1; b = x3 - x0 + hh * x3; c = x0;
    d = y1 - y0 + g * y1; e = y3 - y0 + hh * y3; f = y0;
  }
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(8)).join(",")})`;
}

/** Where a point of an image drawn with object-fit: cover lands in its box (both in pixels). */
export function coverPoint(u: number, v: number, iw: number, ih: number, bw: number, bh: number, fx = 0.5, fy = 0.5): [number, number] {
  const s = Math.max(bw / iw, bh / ih);
  const dw = iw * s, dh = ih * s;
  const ox = (bw - dw) * fx, oy = (bh - dh) * fy;
  return [ox + u * dw, oy + v * dh];
}
