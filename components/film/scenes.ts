import type { ClipId, StillId } from "./timeline";

export type SceneKey = "hero" | "services" | "web" | "mobile" | "how" | "originals" | "close";

/**
 * The film, scene by scene. Each scene rests on a crisp still (or, outside, a seamless living loop);
 * moving to the next scene plays the clip between them (`enter`), scrubbed by the scroll.
 */
export const SCENES: { key: SceneKey; still: StillId; enter: ClipId | null; loop?: ClipId }[] = [
  { key: "hero", still: "s1n", enter: null, loop: "cl" },
  { key: "services", still: "s2", enter: "c1" },
  { key: "web", still: "s3", enter: "c2" },
  { key: "mobile", still: "s4", enter: "c3" },
  { key: "how", still: "s5", enter: "c4" },
  { key: "originals", still: "s6", enter: "c5" },
  { key: "close", still: "s1n", enter: "c6", loop: "cl" },
];

export const sceneIndex = (k: SceneKey) => SCENES.findIndex((s) => s.key === k);
