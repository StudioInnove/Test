import type { ClipId, StillId } from "./timeline";

export type SceneKey = "hero" | "services" | "web" | "mobile" | "how" | "originals" | "close";

/**
 * The film as a sequence of scenes. Each scene rests on a slow loop (`idle`) taken from
 * the end of a clip; moving to the next scene plays the clip between them (`enter`).
 */
export const SCENES: { key: SceneKey; still: StillId; enter: ClipId | null; idle: { clip: ClipId; from: number; to: number; period: number } }[] = [
  { key: "hero", still: "s1n", enter: null, idle: { clip: "c0", from: 0.78, to: 1, period: 11 } },
  { key: "services", still: "s2", enter: "c1", idle: { clip: "c1", from: 0.9, to: 1, period: 9 } },
  { key: "web", still: "s3", enter: "c2", idle: { clip: "c2", from: 0.9, to: 1, period: 9 } },
  { key: "mobile", still: "s4", enter: "c3", idle: { clip: "c3", from: 0.9, to: 1, period: 9 } },
  { key: "how", still: "s5", enter: "c4", idle: { clip: "c4", from: 0.9, to: 1, period: 9 } },
  { key: "originals", still: "s6", enter: "c5", idle: { clip: "c5", from: 0.9, to: 1, period: 9 } },
  { key: "close", still: "s1n", enter: "c6", idle: { clip: "c0", from: 0.78, to: 1, period: 11 } },
];

export const sceneIndex = (k: string) => SCENES.findIndex((s) => s.key === k);
