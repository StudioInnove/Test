/** The film's stills and clips, and where the subject sits in each still. */
export type StillId = "s1" | "s1n" | "s1d" | "s2" | "s3" | "s4" | "s5" | "s6";
export type ClipId = "c0" | "c1" | "c2" | "c3" | "c4" | "c5" | "c6" | "cl";

/** Where the subject sits in each still (0..1, x / y). Used to crop for tall screens. */
export const FOCUS: Record<StillId, [number, number]> = {
  s1: [0.6, 0.55],
  s1n: [0.6, 0.55],
  s1d: [0.6, 0.55],
  s2: [0.5, 0.5],
  s3: [0.5, 0.5],
  s4: [0.66, 0.6],
  s5: [0.42, 0.5],
  s6: [0.5, 0.5],
};

/** Phones: the horizontal centre of the portrait crop for each still. Keep in step with MFOCUS in scripts/film.py. */
export const MFOCUS: Partial<Record<StillId, number>> = { s1n: 0.62, s1d: 0.62, s2: 0.5, s3: 0.5, s4: 0.64, s5: 0.45, s6: 0.5 };

export type WorldId = "web" | "mobile" | "how" | "originals" | "think" | "world";

/**
 * Things in the rooms you can step into (u, v on the full 16:9 still). `area` is the object itself:
 * on a computer the cursor turns into "Open" over it. The first spot in a room is its main one.
 */
export type Spot = { id: WorldId; u: number; v: number; area: [number, number, number, number]; label: string; main?: boolean; /** where the marker sits on a phone, if different */ pm?: [number, number] };
export const SPOTS: Partial<Record<StillId, Spot[]>> = {
  s3: [
    { id: "web", u: 0.5, v: 0.6, area: [0.39, 0.49, 0.61, 0.72], label: "Look closer", main: true },
    { id: "think", u: 0.5, v: 0.27, area: [0.44, 0.17, 0.56, 0.32], label: "How we think" },
  ],
  s4: [
    { id: "mobile", u: 0.68, v: 0.71, area: [0.5, 0.62, 0.86, 0.82], label: "Look closer", main: true },
    { id: "world", u: 0.53, v: 0.33, area: [0.44, 0.15, 0.68, 0.5], label: "Worldwide" },
  ],
  s5: [{ id: "how", u: 0.33, v: 0.42, area: [0.02, 0.28, 0.58, 0.56], label: "Look closer", main: true }],
  s6: [{ id: "originals", u: 0.6, v: 0.62, area: [0.39, 0.42, 0.61, 0.64], label: "Look inside", main: true, pm: [0.45, 0.47] }],
};

/** Live screens fitted onto the stills: corners TL, TR, BR, BL (u, v on the full still). */
export type Quad = [[number, number], [number, number], [number, number], [number, number]];
export const SCREENS: Partial<Record<StillId, { app: "dash" | "phone" | "build"; quad: Quad }>> = {
  s3: { app: "dash", quad: [[0.3925, 0.5006], [0.6075, 0.5006], [0.6075, 0.697], [0.3925, 0.697]] },
  s4: { app: "phone", quad: [[0.5147, 0.6699], [0.6259, 0.6417], [0.8384, 0.7392], [0.7256, 0.7861]] },
  s6: { app: "build", quad: [[0.3963, 0.431], [0.607, 0.431], [0.607, 0.6288], [0.3963, 0.6288]] },
};

/** Lamps and lights that breathe slowly: u, v, radius (share of the still's width), strength. */
export const GLOWS: Partial<Record<StillId, [number, number, number, number][]>> = {
  s3: [[0.5, 0.3, 0.12, 0.22], [0.5, 0.36, 0.3, 0.07]],
  s4: [[0.92, 0.13, 0.13, 0.22]],
  s5: [[0.11, 0.13, 0.12, 0.14], [0.3, 0.2, 0.12, 0.13], [0.45, 0.27, 0.1, 0.12]],
  s6: [[0.5, 0.53, 0.2, 0.12]],
};
