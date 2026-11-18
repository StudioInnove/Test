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
