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
