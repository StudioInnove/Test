/**
 * The film's running order. One "unit" is one screen-height of scrolling.
 * A clip plays from one still to the next; a hold rests on a still while its text is on screen.
 */
export type StillId = "s1" | "s1n" | "s2" | "s3" | "s4" | "s5" | "s6";
export type ClipId = "c0" | "c1" | "c2" | "c3" | "c4" | "c5" | "c6";

export type Segment =
  | { kind: "clip"; id: ClipId; from: StillId; to: StillId; len: number }
  | { kind: "hold"; still: StillId; len: number; scene: SceneId };

export type SceneId = "hero" | "services" | "web" | "mobile" | "how" | "originals" | "close";

export const SEGMENTS: Segment[] = [
  { kind: "clip", id: "c0", from: "s1", to: "s1n", len: 1.1 },
  { kind: "hold", still: "s1n", len: 0.45, scene: "hero" },
  { kind: "clip", id: "c1", from: "s1n", to: "s2", len: 1.5 },
  { kind: "hold", still: "s2", len: 0.85, scene: "services" },
  { kind: "clip", id: "c2", from: "s2", to: "s3", len: 1.2 },
  { kind: "hold", still: "s3", len: 1.0, scene: "web" },
  { kind: "clip", id: "c3", from: "s3", to: "s4", len: 1.1 },
  { kind: "hold", still: "s4", len: 1.0, scene: "mobile" },
  { kind: "clip", id: "c4", from: "s4", to: "s5", len: 1.1 },
  { kind: "hold", still: "s5", len: 1.7, scene: "how" },
  { kind: "clip", id: "c5", from: "s5", to: "s6", len: 1.1 },
  { kind: "hold", still: "s6", len: 1.7, scene: "originals" },
  { kind: "clip", id: "c6", from: "s6", to: "s1n", len: 1.5 },
  { kind: "hold", still: "s1n", len: 1.1, scene: "close" },
];

export const SCENES: SceneId[] = ["hero", "services", "web", "mobile", "how", "originals", "close"];

/** Where the subject sits in each still (0..1, x). Used to crop for tall screens. */
export const FOCUS: Record<StillId, [number, number]> = {
  s1: [0.6, 0.55],
  s1n: [0.6, 0.55],
  s2: [0.5, 0.5],
  s3: [0.5, 0.5],
  s4: [0.66, 0.6],
  s5: [0.42, 0.5],
  s6: [0.5, 0.5],
};

export const TOTAL = SEGMENTS.reduce((a, s) => a + s.len, 0);

export const STARTS: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (const s of SEGMENTS) {
    out.push(acc);
    acc += s.len;
  }
  return out;
})();

/** Text windows (in units) for each scene. Hero is visible from the very top. */
export const WINDOWS: Record<SceneId, [number, number]> = (() => {
  const w = {} as Record<SceneId, [number, number]>;
  SEGMENTS.forEach((s, i) => {
    if (s.kind !== "hold") return;
    const start = STARTS[i];
    w[s.scene] = [start - 0.12, start + s.len + 0.1];
  });
  w.hero = [-1, STARTS[1] + SEGMENTS[1].len + 0.15];
  return w;
})();

export function sceneStart(scene: SceneId): number {
  const i = SEGMENTS.findIndex((s) => s.kind === "hold" && s.scene === scene);
  if (scene === "hero") return 0;
  return STARTS[i];
}

export function locate(pos: number): { index: number; local: number } {
  const p = Math.max(0, Math.min(TOTAL - 1e-6, pos));
  for (let i = SEGMENTS.length - 1; i >= 0; i--) {
    if (p >= STARTS[i]) return { index: i, local: (p - STARTS[i]) / SEGMENTS[i].len };
  }
  return { index: 0, local: 0 };
}
