"use client";

/*
 * A picture that opens as you come to it: it starts as a narrow band of light across the middle of the
 * screen, like a blind being raised at dawn, and widens to fill the view as the section scrolls into place
 * (GSAP ScrollTrigger, scrubbed). Used for the sunrise at the end of every page.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { getGsap } from "@/lib/gsap";

export function Opening({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { gsap } = getGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { clipPath: "inset(34% 10% 34% 10% round 28px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top 95%", end: "top 10%", scrub: 0.8 } },
      );
      gsap.fromTo(el.firstElementChild, { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top 95%", end: "top top", scrub: 0.8 } });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} className="absolute inset-0">
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}
