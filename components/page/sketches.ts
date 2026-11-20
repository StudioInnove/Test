/*
 * A designer's working sketch of each demo app, drawn the way a designer actually works: faint layout
 * guides first, then the boxes, then the details, then a few handwritten notes with arrows, a spacing
 * mark and a dab of amber highlighter on the thing that matters. Strokes vary in weight and pressure,
 * some are gone over twice, and every box overshoots its corners a little. Each box is traced from the
 * real screen, so the colour can fill in exactly where the pencil has drawn.
 * Deterministic (seeded), so it looks the same every time.
 *
 * Every mark carries the moment it is drawn: [start, end] within its item's stretch of scroll (0..1).
 */

import SITES from "./site-layouts.json";

export type SketchKind = "web-platforms" | "web-dashboards" | "web-tools" | "mobile-events" | "mobile-bookings" | "mobile-play" | "web-landing" | "web-brand" | "web-shop";

/** The website screens were laid out in HTML; their boxes and lines of text were measured from it. */
type SiteEl = { t: string; x: number; y: number; w: number; h: number; r: number; amber: boolean; size?: number; lines?: { x: number; y: number; w: number }[] };

/** viewBox sizes: the real screens are 1200×720 (web) and 390×844 (phone) */
export const SKETCH_SIZE = { web: [1200, 720], mobile: [390, 844] } as const;

export type Stroke = { d: string; w: number; o: number; s: number; e: number; amber?: boolean };
export type Fill = { x: number; y: number; w: number; h: number; r: number; s: number; e: number };
export type Note = { x: number; y: number; t: string; s: number; e: number; rot: number; anchor?: "start" | "end" };
export type Sketch = { strokes: Stroke[]; fills: Fill[]; notes: Note[]; size: number };

/** When each phase of the drawing happens, as a share of the item's stretch. */
const PHASE = { guide: [0.02, 0.09], box: [0.06, 0.3], detail: [0.22, 0.4], note: [0.34, 0.5] } as const;
/** The colour comes in box by box, in the order they were drawn, then the whole screen settles; the pencil lifts as it does. */
const FILLS: [number, number] = [0.5, 0.62];
export const FILL_ALL: [number, number] = [0.55, 0.67];
export const PENCIL_OUT: [number, number] = [0.52, 0.66];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function sketch(kind: SketchKind): Sketch {
  const web = kind.startsWith("web");
  const r = rng(kind.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const j = (amt: number) => (r() - 0.5) * 2 * amt;
  const f = (n: number) => n.toFixed(1);
  const unit = web ? 1.6 : 1; // the web screen is shown at about half size, so its pencil is heavier
  const size = web ? 34 : 19; // handwriting, in screen units

  type Mark = { d: string; w: number; o: number; amber?: boolean };
  const phases: Record<keyof typeof PHASE, Mark[][]> = { guide: [], box: [], detail: [], note: [] };
  const fillsAt: { x: number; y: number; w: number; h: number; r: number; box: number }[] = [];
  const notes: { x: number; y: number; t: string; rot: number; anchor?: "start" | "end"; g: number }[] = [];

  // one pencil line: a slightly bowed stroke that starts a touch early and overshoots its end
  const line = (x1: number, y1: number, x2: number, y2: number, wob = 1) => {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const a = Math.max(0.6, len * 0.006) * wob;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const o1 = 1 + r() * 3, o2 = 2 + r() * 5;
    const mx = (x1 + x2) / 2 + j(a * 1.6), my = (y1 + y2) / 2 + j(a * 1.6);
    return `M${f(x1 - ux * o1 + j(a))} ${f(y1 - uy * o1 + j(a))} Q${f(mx)} ${f(my)} ${f(x2 + ux * o2 + j(a))} ${f(y2 + uy * o2 + j(a))}`;
  };
  // a group of marks drawn together in one phase
  const group = (phase: keyof typeof PHASE, marks: Mark[]) => {
    phases[phase].push(marks);
    return phases[phase].length - 1;
  };
  const press = (base: number) => (base + j(base * 0.22)) * unit;

  const guideV = (x: number, h: number) => group("guide", [{ d: line(x, -8, x, h + 8, 0.3), w: 0.8 * unit, o: 0.22 }]);
  const guideH = (y: number, w: number) => group("guide", [{ d: line(-8, y, w + 8, y, 0.3), w: 0.8 * unit, o: 0.22 }]);

  /** a box: four strokes, some gone over twice; returns its group so the colour can follow it */
  const box = (x: number, y: number, w: number, h: number, rad = 0, fill = true) => {
    const sides: [number, number, number, number][] = [[x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]];
    const marks: Mark[] = [];
    sides.forEach(([a, b, c, d]) => {
      marks.push({ d: line(a, b, c, d), w: press(2.1), o: 0.82 });
      if (r() < 0.32) marks.push({ d: line(a, b, c, d, 1.6), w: press(1.1), o: 0.35 });
    });
    const g = group("box", marks);
    if (fill) fillsAt.push({ x, y, w, h, r: rad, box: g });
    return g;
  };
  /** an image area: a box with a few loose hatching strokes instead of a cross */
  const picture = (x: number, y: number, w: number, h: number, rad = 0) => {
    const g = box(x, y, w, h, rad);
    const marks: Mark[] = [];
    const n = Math.max(3, Math.round(w / (web ? 60 : 46)));
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1);
      const x0 = x + w * t - h * 0.25, x1 = x + w * t + h * 0.25;
      marks.push({ d: line(Math.max(x + 6, x0), y + h - 8, Math.min(x + w - 6, x1), y + 8, 0.8), w: press(0.9), o: 0.3 });
    }
    group("detail", marks);
    return g;
  };
  const text = (x: number, y: number, w: number, strong = false, heavy = 0) =>
    group("detail", [
      { d: line(x, y, x + w, y + j(1.2), 0.6), w: press(heavy || (strong ? 1.9 : 1.3)), o: strong ? 0.8 : 0.55 },
      // a headline is gone over again, the way you'd block in big type
      ...(heavy ? [{ d: line(x + 4, y + heavy * 1.6, x + w - 10, y + heavy * 1.6 + j(2), 0.8), w: press(heavy * 0.7), o: 0.5 }] : []),
    ]);
  const circle = (cx: number, cy: number, rad: number) => {
    const k = 0.5523 * rad;
    const p = (dx: number, dy: number) => `${f(cx + dx + j(rad * 0.05))} ${f(cy + dy + j(rad * 0.05))}`;
    return group("detail", [{ d: `M${p(rad, 0)} C${p(rad, k)} ${p(k, rad)} ${p(0, rad)} C${p(-k, rad)} ${p(-rad, k)} ${p(-rad, 0)} C${p(-rad, -k)} ${p(-k, -rad)} ${p(0, -rad)} C${p(k, -rad)} ${p(rad * 1.1, -k)} ${p(rad * 1.04, rad * 0.14)}`, w: press(1.5), o: 0.7 }]);
  };
  /** a handwritten note with a curved arrow to what it's about */
  const note = (tx: number, ty: number, t: string, toX: number, toY: number, anchor: "start" | "end" = "start") => {
    notes.push({ x: tx, y: ty, t, rot: j(2.5), anchor, g: phases.note.length });
    // the arrow leaves from whichever end of the words is nearer what it points at
    const tw = t.length * size * 0.4;
    const x0 = anchor === "end" ? tx - tw : tx, x1 = anchor === "end" ? tx : tx + tw;
    const fromLeft = toX < x0 + tw * 0.3;
    const sx = fromLeft ? x0 - 6 * unit : x1 + 6 * unit, sy = ty - size * 0.32;
    const bend = (toX - sx) * 0.15 + 22 * unit * (r() > 0.5 ? 1 : -1);
    const cx = (sx + toX) / 2 - bend * 0.4, cy = (sy + toY) / 2 - Math.abs(bend);
    const ang = Math.atan2(toY - cy, toX - cx), hl = 11 * unit;
    const head = (da: number) => `M${f(toX)} ${f(toY)} L${f(toX - Math.cos(ang + da) * hl)} ${f(toY - Math.sin(ang + da) * hl)}`;
    group("note", [
      { d: `M${f(sx)} ${f(sy)} Q${f(cx)} ${f(cy)} ${f(toX)} ${f(toY)}`, w: press(1.3), o: 0.7 },
      { d: head(0.45), w: press(1.3), o: 0.7 },
      { d: head(-0.45), w: press(1.3), o: 0.7 },
    ]);
  };
  /** a spacing mark, drawn upright between two rows, its number written beside it */
  const spaceV = (x: number, y1: number, y2: number, label: string) => {
    const h = 7 * unit;
    group("note", [
      { d: line(x - h, y1, x + h, y1, 0.3), w: press(1), o: 0.55 },
      { d: line(x - h, y2, x + h, y2, 0.3), w: press(1), o: 0.55 },
      { d: line(x, y1 + 2, x, y2 - 2, 0.3), w: press(0.9), o: 0.5 },
    ]);
    notes.push({ x: x + 12 * unit, y: (y1 + y2) / 2 + size * 0.3, t: label, rot: 0, anchor: "start", g: phases.note.length - 1 });
  };
  /** a dab of amber highlighter: a few broad, loose strokes */
  const amber = (x: number, y: number, w: number, h: number) => {
    const marks: Mark[] = [];
    const rows = Math.max(2, Math.round(h / (web ? 12 : 9)));
    for (let i = 0; i < rows; i++) {
      const yy = y + (h * (i + 0.5)) / rows;
      marks.push({ d: line(x + j(4), yy + j(2), x + w + j(4), yy + j(2), 0.5), w: (web ? 13 : 9) + j(2), o: 0.26, amber: true });
    }
    group("note", marks);
  };

  const sidebar = (active: number) => {
    [170, 213, 259, 302].forEach((y, i) => {
      circle(48, y, 7);
      text(66, y, i === active ? 64 : 50 + r() * 22, i === active);
    });
    const ay = [170, 213, 259, 302][active];
    box(28, ay - 20, 164, 40, 10);
  };

  /** a website, from its measured layout */
  const site = (els: SiteEl[]) => {
    guideV(48, 720); guideV(1152, 720);
    els.forEach((e) => {
      const rad = Math.min(e.r, e.h / 2, e.w / 2); // a pill stays a pill, not an ellipse
      if (e.t === "box") box(e.x, e.y, e.w, e.h, rad);
      else if (e.t === "picture") picture(e.x, e.y, e.w, e.h, rad);
      else if (e.t === "circle") {
        circle(e.x + e.w / 2, e.y + e.h / 2, e.w / 2);
        fillsAt.push({ x: e.x, y: e.y, w: e.w, h: e.h, r: e.w / 2, box: Math.max(0, phases.box.length - 1) });
      } else if (e.t === "text") {
        const big = (e.size ?? 14) >= 40;
        (e.lines ?? []).forEach((l) => text(l.x, l.y, l.w, (e.size ?? 14) >= 18, big ? 3.2 : 0));
      }
      if (e.amber) amber(e.x - 6, e.y + e.h * 0.2, e.w + 12, e.h * 0.6);
    });
  };

  const [W, H] = web ? SKETCH_SIZE.web : SKETCH_SIZE.mobile;
  switch (kind) {
    case "web-landing":
      site(SITES.landing as SiteEl[]);
      spaceV(30, 66, 132, "64");
      note(232, 578, "one clear action", 196, 520);
      break;
    case "web-brand":
      site(SITES.brand as SiteEl[]);
      note(48, 252, "let the light do the talking", 650, 220);
      break;
    case "web-shop":
      site(SITES.shop as SiteEl[]);
      note(292, 300, "straight to the shop", 264, 292);
      break;
    case "web-platforms": {
      guideV(262, H); guideV(1156, H); guideH(48, W); guideH(668, W);
      sidebar(2);
      const cards = [[262, 48], [567, 48], [873, 48], [262, 370], [567, 370], [873, 370]];
      cards.forEach(([x, y]) => {
        box(x, y, 282, 298, 16);
        circle(x + 52, y + 52, 26);
      });
      cards.forEach(([x, y]) => {
        text(x + 26, y + 240, 116, true);
        text(x + 26, y + 266, 52);
      });
      note(40, 520, "your members", 258, 470);
      spaceV(1172, 346, 370, "24");
      amber(36, 247, 120, 24);
      break;
    }
    case "web-dashboards": {
      guideV(262, H); guideV(816, H); guideV(856, H); guideH(48, W); guideH(262, W);
      sidebar(0);
      [[262, 48, 166], [450, 48, 170], [642, 48, 168]].forEach(([x, y, w]) => {
        box(x, y, w, 144, 16);
        box(x + 20, y + 20, 40, 40, 10, false);
        text(x + 20, y + 84, 90);
        text(x + 20, y + 110, 60, true);
      });
      box(262, 262, 554, 407, 16);
      text(290, 306, 136, true);
      box(606, 292, 180, 28, 14, false);
      group("detail", [{
        d: (() => {
          const pts = [[295, 543], [340, 527], [385, 532], [420, 512], [470, 514], [505, 490], [560, 460], [600, 472], [650, 490], [700, 476], [740, 450], [783, 425]];
          return pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x + j(2))} ${f(y + j(3))}`).join(" ");
        })(),
        w: press(1.8), o: 0.8,
      }]);
      text(292, 608, 460);
      box(856, 48, 300, 300, 22);
      text(880, 270, 120); text(880, 302, 40, true);
      box(856, 370, 300, 300, 22);
      text(880, 574, 80); text(880, 603, 210, true);
      note(330, 236, "one calm number each", 330, 166, "start");
      note(540, 420, "trend, not noise", 700, 470, "end");
      amber(735, 420, 56, 32);
      break;
    }
    case "web-tools": {
      guideV(262, H); guideV(1156, H); guideH(48, W); guideH(668, W);
      sidebar(1);
      box(262, 50, 894, 620, 18);
      text(290, 86, 58, true);
      text(998, 86, 130);
      [142, 197, 252, 306, 361, 416].forEach((y) => {
        text(290, y, 40);
        text(380, y, 100 + r() * 60, true);
        text(918, y, 58);
        box(1008, y - 12, 82, 24, 12, false);
        group("detail", [{ d: line(290, y + 28, 1128, y + 28, 0.3), w: press(0.8), o: 0.3 }]);
      });
      note(700, 520, "the night, in one list", 700, 430, "start");
      note(940, 560, "status you can read across the room", 1050, 440, "end");
      amber(1006, 294, 74, 24);
      break;
    }
    case "mobile-events": {
      guideV(20, H); guideV(370, H);
      text(32, 24, 36);
      text(20, 82, 96, true);
      box(283, 68, 87, 28, 14, false);
      text(20, 112, 216);
      [141, 357, 574].forEach((y) => {
        box(20, y, 350, 200, 18);
        picture(20, y, 350, 118);
        circle(56, y + 86, 18);
        text(36, y + 141, 78);
        text(36, y + 158, 190 - r() * 40, true);
        text(36, y + 176, 150);
        box(295, y + 151, 59, 32, 16, false);
      });
      note(250, 40, "tonight, first", 140, 80, "end");
      amber(292, 296, 64, 26);
      break;
    }
    case "mobile-bookings": {
      guideV(20, H); guideV(370, H);
      text(32, 24, 36);
      text(20, 72, 72);
      text(20, 100, 158, true);
      picture(20, 137, 350, 150, 18);
      text(20, 318, 30);
      [20, 92, 163, 235, 306].forEach((x) => box(x, 334, 64, 40, 18, false));
      text(20, 402, 70);
      [[20, 419], [139, 419], [259, 419], [20, 468], [139, 468], [259, 468]].forEach(([x, y]) => box(x, y, 111, 40, 18, false));
      box(20, 740, 350, 56, 28);
      text(160, 768, 70, true);
      note(150, 620, "one big thumb target", 190, 732, "start");
      amber(262, 424, 104, 30);
      break;
    }
    case "mobile-play": {
      guideV(20, H); guideV(370, H);
      text(32, 24, 36);
      text(20, 83, 79, true);
      text(20, 112, 235);
      text(20, 145, 49);
      for (let i = 0; i < 12; i++) circle(50 + r() * 290, 220 + r() * 440, 5 + r() * 10);
      box(20, 732, 350, 56, 28);
      text(150, 760, 90, true);
      note(170, 690, "fifteen seconds, no more", 220, 726, "start");
      amber(60, 300, 40, 26);
      break;
    }
  }

  // timing: spread each phase's groups across its window, overlapping a little like a moving hand
  const strokes: Stroke[] = [];
  const timeOf: Record<string, [number, number][]> = {};
  (Object.keys(PHASE) as (keyof typeof PHASE)[]).forEach((ph) => {
    const [a, b] = PHASE[ph];
    const gs = phases[ph];
    const n = gs.length || 1;
    const step = (b - a) / n;
    timeOf[ph] = [];
    gs.forEach((marks, gi) => {
      const s = a + gi * step;
      const e = Math.min(b, s + step * 2.2);
      timeOf[ph].push([s, e]);
      const per = (e - s) / marks.length;
      marks.forEach((m, mi) => strokes.push({ ...m, s: s + mi * per * 0.75, e: Math.min(e, s + (mi + 1) * per * 1.2) }));
    });
  });
  // the colour follows the pencil: each box fills in a little after it is finished
  const fills: Fill[] = fillsAt.map((fl, i) => {
    const s = FILLS[0] + (i / Math.max(1, fillsAt.length)) * (FILLS[1] - FILLS[0]);
    return { x: fl.x, y: fl.y, w: fl.w, h: fl.h, r: fl.r, s, e: s + 0.07 };
  });
  // notes are written as their arrows are drawn
  const noteTimes = timeOf.note;
  const out: Note[] = notes.map(({ g, ...nt }) => {
    const [s] = noteTimes[g] ?? PHASE.note;
    return { ...nt, s, e: s + 0.07 };
  });
  return { strokes, fills, notes: out, size };
}
