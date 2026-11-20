"use client";

/*
 * The ground behind the explore pages: the studio's dark shader (see lib/haze), fixed behind the page,
 * with a plain dark fill underneath in case WebGL2 isn't there.
 */
import { useEffect, useRef } from "react";
import { INK, runHaze } from "@/lib/haze";

export function Haze() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => runHaze(ref.current!), []);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={{ background: INK }}>
      <canvas ref={ref} className="block h-full w-full transition-opacity duration-1000" style={{ opacity: 0 }} />
    </div>
  );
}

/** The same shader, filling its section (not fixed): it only runs while the section is on screen. */
export function HazeLayer() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    let stop: (() => void) | null = null;
    // only while some of it is really on screen (the home page's film sits right above it)
    const io = new IntersectionObserver(([e]) => {
      const on = e.isIntersecting && e.intersectionRatio > 0.02;
      if (on && !stop) stop = runHaze(cv);
      else if (!on && stop) {
        stop();
        stop = null;
        cv.style.opacity = "0";
      }
    }, { threshold: [0, 0.02, 0.1] });
    io.observe(cv);
    return () => {
      io.disconnect();
      stop?.();
    };
  }, []);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: INK }}>
      <canvas ref={ref} className="block h-full w-full transition-opacity duration-1000" style={{ opacity: 0 }} />
    </div>
  );
}
