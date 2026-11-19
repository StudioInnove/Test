"use client";
/*
 * GSAP, registered once. ScrollTrigger measures where sections start; if anything above them changes
 * height after that (fonts, images, a line wrapping differently), it measures again.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let ready = false;
export function getGsap() {
  if (ready || typeof window === "undefined") return { gsap, ScrollTrigger };
  ready = true;
  gsap.registerPlugin(ScrollTrigger);
  let h = 0, t = 0;
  const ro = new ResizeObserver(() => {
    const nh = document.documentElement.scrollHeight;
    if (Math.abs(nh - h) < 2) return;
    h = nh;
    clearTimeout(t);
    t = window.setTimeout(() => ScrollTrigger.refresh(), 120);
  });
  ro.observe(document.body);
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  return { gsap, ScrollTrigger };
}
