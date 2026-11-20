/*
 * Pencil wireframes of the six demo apps, in the hand of the sketches on the studio's design wall: each
 * box is four slightly wobbly strokes that overshoot their corners, image boxes get a cross, avatars are
 * loose circles. Drawn from a layout of each real screen, so the sketch resolves exactly into the app.
 * Deterministic (seeded), so it looks the same every time.
 */

export type SketchKind = "web-platforms" | "web-dashboards" | "web-tools" | "mobile-events" | "mobile-bookings" | "mobile-play";

/** viewBox sizes: the real screens are 1200×720 (web) and 390×844 (phone) */
export const SKETCH_SIZE = { web: [1200, 720], mobile: [390, 844] } as const;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function sketch(kind: SketchKind): string[] {
  const r = rng(kind.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const j = (amt: number) => (r() - 0.5) * 2 * amt;
  const paths: string[] = [];
  const f = (n: number) => n.toFixed(1);

  const line = (x1: number, y1: number, x2: number, y2: number, wob = 1) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const a = Math.max(0.6, len * 0.006) * wob;
    const ox = ((x2 - x1) / (len || 1)) * (2 + r() * 4), oy = ((y2 - y1) / (len || 1)) * (2 + r() * 4);
    const mx = (x1 + x2) / 2 + j(a * 1.6), my = (y1 + y2) / 2 + j(a * 1.6);
    paths.push(`M${f(x1 - ox * 0.6 + j(a))} ${f(y1 - oy * 0.6 + j(a))} Q${f(mx)} ${f(my)} ${f(x2 + ox + j(a))} ${f(y2 + oy + j(a))}`);
  };
  const rect = (x: number, y: number, w: number, h: number) => {
    line(x, y, x + w, y);
    line(x + w, y, x + w, y + h);
    line(x + w, y + h, x, y + h);
    line(x, y + h, x, y);
  };
  const cross = (x: number, y: number, w: number, h: number) => {
    rect(x, y, w, h);
    line(x, y, x + w, y + h, 1.5);
    line(x + w, y, x, y + h, 1.5);
  };
  const circle = (cx: number, cy: number, rad: number) => {
    const k = 0.5523 * rad;
    const p = (dx: number, dy: number) => `${f(cx + dx + j(rad * 0.05))} ${f(cy + dy + j(rad * 0.05))}`;
    paths.push(`M${p(rad, 0)} C${p(rad, k)} ${p(k, rad)} ${p(0, rad)} C${p(-k, rad)} ${p(-rad, k)} ${p(-rad, 0)} C${p(-rad, -k)} ${p(-k, -rad)} ${p(0, -rad)} C${p(k, -rad)} ${p(rad + rad * 0.1, -k)} ${p(rad * 1.04, rad * 0.12)}`);
  };
  const text = (x: number, y: number, w: number) => line(x, y, x + w, y, 0.6);
  const sidebar = () => {
    [170, 213, 259, 302].forEach((y) => {
      circle(48, y, 7);
      text(66, y, 70 + r() * 30);
    });
  };

  switch (kind) {
    case "web-platforms":
      sidebar();
      [[262, 48], [567, 48], [873, 48], [262, 370], [567, 370], [873, 370]].forEach(([x, y]) => {
        rect(x, y, 282, 298);
        circle(x + 52, y + 52, 26);
        text(x + 26, y + 240, 120);
        text(x + 26, y + 266, 64);
      });
      break;
    case "web-dashboards":
      sidebar();
      [[262, 47], [451, 47], [642, 47]].forEach(([x, y]) => {
        rect(x, y, 170, 144);
        rect(x + 22, y + 22, 34, 34);
        text(x + 22, y + 92, 80);
        text(x + 22, y + 118, 56);
      });
      rect(262, 262, 556, 407);
      text(292, 312, 140);
      paths.push((() => {
        // the revenue line, wandering upwards
        const pts: string[] = [];
        for (let i = 0; i <= 12; i++) {
          const x = 300 + i * 40;
          const y = 600 - i * 14 - Math.sin(i * 1.3) * 26 + j(6);
          pts.push(`${i ? "L" : "M"}${f(x)} ${f(y)}`);
        }
        return pts.join(" ");
      })());
      line(300, 625, 790, 625, 0.5);
      rect(857, 47, 299, 299);
      text(885, 290, 130);
      rect(857, 370, 299, 299);
      text(885, 610, 160);
      break;
    case "web-tools":
      sidebar();
      rect(260, 48, 894, 621);
      text(292, 90, 70);
      text(1040, 90, 90);
      [142, 195, 251, 307, 360, 416].forEach((y) => {
        text(292, y, 36);
        text(352, y, 120 + r() * 60);
        text(900, y, 52);
        rect(1000, y - 11, 64, 22);
        line(292, y + 26, 1124, y + 26, 0.4);
      });
      break;
    case "mobile-events":
      text(32, 24, 36);
      text(20, 82, 96);
      rect(283, 68, 87, 28);
      text(20, 112, 216);
      [141, 357, 574].forEach((y) => {
        rect(20, y, 350, 200);
        cross(20, y, 350, 118);
        circle(56, y + 86, 18);
        text(36, y + 141, 78);
        text(36, y + 158, 190 - r() * 40);
        text(36, y + 176, 150);
        rect(295, y + 151, 59, 32);
      });
      break;
    case "mobile-bookings":
      text(32, 24, 36);
      text(20, 72, 72);
      text(20, 100, 158);
      cross(20, 137, 350, 150);
      text(20, 318, 30);
      [20, 92, 163, 235, 306].forEach((x) => rect(x, 334, 64, 40));
      text(20, 402, 70);
      [[20, 419], [139, 419], [259, 419], [20, 468], [139, 468], [259, 468]].forEach(([x, y]) => rect(x, y, 111, 40));
      rect(20, 740, 350, 56);
      text(160, 768, 70);
      break;
    case "mobile-play":
      text(32, 24, 36);
      text(20, 83, 79);
      text(20, 112, 235);
      text(20, 145, 49);
      for (let i = 0; i < 14; i++) circle(50 + r() * 290, 220 + r() * 440, 5 + r() * 10);
      rect(20, 732, 350, 56);
      text(150, 760, 90);
      break;
  }
  return paths;
}
