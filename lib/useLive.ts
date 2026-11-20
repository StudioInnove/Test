"use client";
/*
 * Is this demo being seen right now? True only while it is on screen and, when it sits on a screen in the
 * film, while that screen is showing. Demos check it before each tick, so the ones out of sight cost nothing.
 */
import { useEffect, useRef, type RefObject } from "react";

export function useLive(ref: RefObject<HTMLElement | null>) {
  const seen = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (seen.current = e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return () => {
    if (!seen.current || document.hidden) return false;
    const scr = ref.current?.closest<HTMLElement>(".room-screen");
    return !scr || parseFloat(scr.style.opacity || "1") > 0.02;
  };
}
