"use client";

/*
 * The handover from a page's opening photograph to the page: as you start to scroll, the photo draws back
 * into a rounded frame and dims while its words drift up and away, so the room recedes behind the story
 * instead of being cut off. Scrubbed by GSAP ScrollTrigger.
 */
import { useEffect } from "react";
import { getGsap } from "@/lib/gsap";

export function HeroScroll() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { gsap } = getGsap();
    const media = hero.querySelector<HTMLElement>("[data-hero-media]");
    const words = hero.querySelector<HTMLElement>("[data-hero-words]");
    const ctx = gsap.context(() => {
      const st = { trigger: hero, start: "top top", end: "bottom top", scrub: 0.5 };
      if (media) gsap.to(media, { scale: 0.88, borderRadius: 28, opacity: 0.35, ease: "none", scrollTrigger: st });
      if (words) gsap.to(words, { yPercent: -40, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "60% top" } });
    }, hero);
    return () => ctx.revert();
  }, []);
  return null;
}
