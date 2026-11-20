import type { ClipId, StillId } from "./timeline";

export type SceneKey = "hero" | "services" | "web" | "mobile" | "sites" | "how" | "originals" | "close";

/**
 * The film, scene by scene. Each scene rests on a crisp still (or, outside, a seamless living loop);
 * moving to the next scene plays the clip between them (`enter`), scrubbed by the scroll.
 */
export const SCENES: { key: SceneKey; still: StillId; enter: ClipId | null; loop?: ClipId }[] = [
  { key: "hero", still: "s1n", enter: null },
  { key: "services", still: "s2", enter: "c1" },
  { key: "web", still: "s3", enter: "c2" },
  { key: "mobile", still: "s4", enter: "c3" },
  { key: "sites", still: "s7", enter: "c7" },
  { key: "how", still: "s5", enter: "c8" },
  { key: "originals", still: "s6", enter: "c5" },
  { key: "close", still: "s1n", enter: "c6" },
];

export const sceneIndex = (k: SceneKey) => SCENES.findIndex((s) => s.key === k);
