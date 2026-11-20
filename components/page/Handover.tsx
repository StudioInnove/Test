"use client";

/*
 * The seam between two chapters of a page: a fine hairline that draws itself across from the left as the
 * next chapter comes up, scrubbed by scroll (GSAP ScrollTrigger), with a small italic word at its start.
 * It marks the handover without a hard edge.
 */
import { useEffect, useRef } from "react";
import { getGsap } from "@/lib/gsap";

export function Handover({ label }: { label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { gsap } = getGsap();
    const line = el.querySelector("[data-line]"), word = el.querySelector("[data-word]");
    const ctx = gsap.context(() => {
      gsap.timeline({ scrollTrigger: { trigger: el, start: "top 96%", end: "top 55%", scrub: 0.8 } })
        .fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: "none" })
        .fromTo(word, { opacity: 0, y: 6 }, { opacity: 1, y: 0, ease: "none", duration: 0.4 }, 0.2);
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} aria-hidden className="relative z-[1] flex items-center gap-4 px-[var(--gutter)] py-1">
      {label && <span data-word className="kicker shrink-0">{label}</span>}
      <span data-line className="block h-px flex-1 origin-left bg-paper/15" />
    </div>
  );
}
