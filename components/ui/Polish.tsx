"use client";

/*
 * Small touches for a mouse: the main buttons lean gently towards the cursor as it comes near and
 * settle back when it leaves (a "magnetic" button). Nothing happens on touch screens.
 */
import { useEffect } from "react";
import { getGsap } from "@/lib/gsap";

export function Polish() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { gsap } = getGsap();
    const movers = new Map<HTMLElement, { x: (v: number) => void; y: (v: number) => void }>();
    const get = (el: HTMLElement) => {
      let m = movers.get(el);
      if (!m) {
        m = { x: gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" }), y: gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" }) };
        movers.set(el, m);
      }
      return m;
    };
    let current: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.<HTMLElement>(".btn-primary");
      if (current && current !== el) {
        const m = get(current);
        m.x(0);
        m.y(0);
        current = null;
      }
      if (!el) return;
      current = el;
      const r = el.getBoundingClientRect();
      const m = get(el);
      m.x((e.clientX - (r.left + r.width / 2)) * 0.28);
      m.y((e.clientY - (r.top + r.height / 2)) * 0.35);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return null;
}
