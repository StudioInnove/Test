/** The film's stills and clips, and where the subject sits in each still. */
export type StillId = "s1" | "s1n" | "s2" | "s3" | "s4" | "s5" | "s6";
export type ClipId = "c0" | "c1" | "c2" | "c3" | "c4" | "c5" | "c6" | "cl";

/** Where the subject sits in each still (0..1, x / y). Used to crop for tall screens. */
export const FOCUS: Record<StillId, [number, number]> = {
  s1: [0.6, 0.55],
  s1n: [0.6, 0.55],
  s2: [0.5, 0.5],
  s3: [0.5, 0.5],
  s4: [0.66, 0.6],
  s5: [0.42, 0.5],
  s6: [0.5, 0.5],
};

/** Phones: the horizontal centre of the portrait crop for each still. Keep in step with MFOCUS in scripts/film.py. */
export const MFOCUS: Partial<Record<StillId, number>> = { s1n: 0.62, s2: 0.5, s3: 0.5, s4: 0.64, s5: 0.45, s6: 0.5 };

/** Things in the rooms you can step closer to (u, v on the full 16:9 still). */
export const SPOTS: Partial<Record<StillId, { id: string; u: number; v: number }>> = {
  s3: { id: "web", u: 0.5, v: 0.56 },
  s4: { id: "mobile", u: 0.66, v: 0.68 },
  s5: { id: "how", u: 0.36, v: 0.42 },
};
