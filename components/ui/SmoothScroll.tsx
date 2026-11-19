"use client";

/* The pages scroll with the same soft glide as the film (Lenis), kept in step with GSAP's ScrollTrigger. */
import { useEffect } from "react";
import Lenis from "lenis";
import { getGsap } from "@/lib/gsap";

export function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { gsap, ScrollTrigger } = getGsap();
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
