"use client";

/*
 * Frosted glass panel with a refractive rim and a cursor-tracked highlight.
 * Adapted from "Glass Card" (21st.dev, educalvolpz), tuned for text over the film.
 */
import { motion, useReducedMotion, useSpring } from "motion/react";
import { type CSSProperties, type ReactNode, type PointerEvent as RPE, useCallback, useEffect, useId, useState } from "react";

const SPRING = { damping: 34, mass: 0.5, stiffness: 250 } as const;
const SPEC = 280;

const ringMask = (w: number): CSSProperties => ({
  boxSizing: "border-box",
  padding: w,
  maskClip: "content-box, border-box",
  maskComposite: "exclude",
  maskImage: "linear-gradient(#000,#000), linear-gradient(#000,#000)",
  WebkitMaskClip: "content-box, border-box",
  WebkitMaskComposite: "xor",
  WebkitMaskImage: "linear-gradient(#000,#000), linear-gradient(#000,#000)",
});

export function GlassCard({
  children,
  className = "",
  radius = 28,
  blur = 16,
  rim = 10,
  refraction = 22,
  tint = "rgb(14 12 10 / 0.32)",
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
  blur?: number;
  rim?: number;
  refraction?: number;
  tint?: string;
}) {
  const reduce = useReducedMotion();
  const raw = useId();
  const fid = `glass-${raw.replace(/:/g, "")}`;
  const [hover, setHover] = useState(false);
  const [canBend, setCanBend] = useState(false);
  const sx = useSpring(0, SPRING);
  const sy = useSpring(0, SPRING);
  const rx = useSpring(0, SPRING);
  const ry = useSpring(0, SPRING);

  useEffect(() => {
    const q = window.matchMedia("(hover: hover) and (pointer: fine)");
    setHover(q.matches);
    const probe = `url(#${fid}) blur(2px)`;
    setCanBend(CSS.supports("backdrop-filter", probe) || CSS.supports("-webkit-backdrop-filter", probe));
  }, [fid]);

  const track = hover && !reduce;
  const move = useCallback(
    (e: RPE<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      sx.set(x - r.width * 0.3);
      sy.set(y - r.height * 0.28);
      rx.set((x / r.width - 0.5) * 6);
      ry.set((y / r.height - 0.5) * 6);
    },
    [sx, sy, rx, ry],
  );
  const leave = useCallback(() => [sx, sy, rx, ry].forEach((v) => v.set(0)), [sx, sy, rx, ry]);

  const body = `blur(${blur}px) saturate(150%)`;
  const rimF = `blur(1px) saturate(170%) brightness(1.08)`;
  const bends = refraction > 0 && canBend;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onPointerMove={track ? move : undefined}
      onPointerLeave={track ? leave : undefined}
      style={{ borderRadius: radius, boxShadow: "0 30px 70px -30px rgb(0 0 0 / 0.7), 0 10px 26px -18px rgb(0 0 0 / 0.5)" }}
    >
      {bends && (
        <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
          <filter id={fid}>
            <feTurbulence baseFrequency="0.016 0.024" numOctaves={2} seed={7} type="fractalNoise" result="n" />
            <feGaussianBlur in="n" stdDeviation={1.4} result="s" />
            <feDisplacementMap in="SourceGraphic" in2="s" scale={refraction} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <div
        aria-hidden
        className="absolute"
        style={{
          inset: rim,
          borderRadius: Math.max(radius - rim, 6),
          backgroundColor: tint,
          backdropFilter: body,
          WebkitBackdropFilter: body,
          boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.18), inset 0 0 0 1px rgb(255 255 255 / 0.06)",
        }}
      />
      <div aria-hidden className="absolute inset-0 rounded-[inherit]" style={{ ...ringMask(rim), backdropFilter: bends ? `url(#${fid}) ${rimF}` : rimF, WebkitBackdropFilter: bends ? `url(#${fid}) ${rimF}` : rimF }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 isolate overflow-hidden rounded-[inherit]">
        <motion.div
          className="absolute inset-0 rounded-[inherit]"
          style={{ ...ringMask(rim), backgroundImage: "linear-gradient(125deg, rgb(255 214 170 / 0.35) 0%, transparent 38%, transparent 62%, rgb(150 190 255 / 0.25) 100%)", mixBlendMode: "plus-lighter", x: rx, y: ry }}
        />
        <motion.div
          className="absolute"
          style={{
            width: SPEC, height: SPEC, left: "30%", top: "28%", marginLeft: -SPEC / 2, marginTop: -SPEC / 2,
            backgroundImage: "radial-gradient(closest-side, rgb(255 236 210 / 0.22), rgb(255 255 255 / 0.05) 48%, transparent 74%)",
            mixBlendMode: "plus-lighter", x: sx, y: sy,
          }}
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.45), inset 0 0 0 1px rgb(255 255 255 / 0.12)" }} />
      <div className="relative" style={{ padding: Math.max(22, rim + 14) }}>
        {children}
      </div>
    </div>
  );
}
