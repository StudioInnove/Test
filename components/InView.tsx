"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/** Adds `on` the first time the block scrolls into view, so its text fades in once. */
export function InView({ as: Tag = "div", className = "", children, threshold = 0.2 }: { as?: ElementType; className?: string; children: ReactNode; threshold?: number }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("on");
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return (
    <Tag ref={ref} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}
