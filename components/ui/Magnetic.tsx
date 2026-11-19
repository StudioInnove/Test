"use client";

import { useEffect } from "react";

/**
 * On a computer, buttons lean a little toward the cursor as it comes close, then settle back.
 * One listener for the whole page; touch screens are left alone.
 */
export function Magnetic() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let lit: HTMLElement | null = null;
    const reset = (el: HTMLElement) => {
      el.style.transform = "";
      el.style.transition = "transform 500ms cubic-bezier(0.23, 1, 0.32, 1)";
    };
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = (e.target as HTMLElement)?.closest?.<HTMLElement>(".btn-primary");
        if (lit && lit !== el) reset(lit);
        lit = el;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transition = "transform 160ms cubic-bezier(0.23, 1, 0.32, 1)";
        el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
      });
    };
    const onDown = () => lit && (lit.style.transform += " scale(0.97)");
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onDown);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
