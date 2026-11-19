"use client";

/*
 * A close-up picture brought to life: the photo itself is untouched; over it its screen works (fitted to
 * the screen in the photo), its lights glint and its lamps breathe, faintly, and on a computer the whole
 * view drifts a little with the cursor. Used inside the rooms you step into and on the pages.
 */
import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { asset } from "@/lib/content";
import { coverPoint, quadMatrix } from "@/lib/quad";
import { Dashboard, DASH_SIZE } from "../apps/Dashboard";
import { LivingLight } from "./living";
import type { Quad, WorldId } from "./timeline";

const film = [0.22, 0.61, 0.36, 1] as const;

export type Bg = {
  d: string;
  m: string;
  /** natural size of the desktop picture */
  iw: number;
  ih: number;
  /** the phone picture is a crop starting at mx0 (share of the full width), mw wide, mi = its size */
  mx0: number;
  mw: number;
  mi: [number, number];
  /** object-position (vertical) on desktop */
  fy: number;
  /** desktop: the picture is drawn this much wider than the screen, pushed left, to make room on the right */
  shift?: number;
  /** a still from the film, zoomed in on a point (u, v) */
  zoom?: { s: number; u: number; v: number };
  screen?: { app: "dash"; quad: Quad };
  /** the glowing screen in the Originals close-up */
  glow?: Quad;
  dim?: number;
  /** which picture's lights to bring to life */
  live: string;
};

export const BG: Record<WorldId, Bg> = {
  web: { d: "/worlds/web-d.webp", m: "/worlds/web-m.webp", iw: 2400, ih: 1792, mx0: 0.2079, mw: 0.56, mi: [1080, 1440], fy: 0.62, shift: 0.3, live: "w-web", screen: { app: "dash", quad: [[0.2583, 0.4234], [0.7184, 0.4404], [0.7184, 0.748], [0.2593, 0.8104]] } },
  mobile: { d: "/worlds/mobile-d.webp", m: "/worlds/mobile-m.webp", iw: 2400, ih: 1792, mx0: 0.14, mw: 0.56, mi: [1080, 1440], fy: 0.5, dim: 0.12, live: "w-mobile" },
  how: { d: "/worlds/how-d.webp", m: "/worlds/how-m.webp", iw: 2400, ih: 1792, mx0: 0.22, mw: 0.56, mi: [1080, 1440], fy: 0.45, live: "w-how" },
  originals: { d: "/worlds/originals-d.webp", m: "/worlds/originals-m.webp", iw: 2400, ih: 1340, mx0: 0.2906, mw: 0.4185, mi: [1080, 1440], fy: 0.5, live: "w-orig", glow: [[0.2232, 0.2484], [0.792, 0.2484], [0.792, 0.7977], [0.2232, 0.7977]] },
  think: { d: "/film/stills/s3-d.webp", m: "/film/stills/s3-m.webp", iw: 3200, ih: 1786, mx0: 0.299, mw: 0.4019, mi: [1152, 1600], fy: 0.3, zoom: { s: 1.45, u: 0.5, v: 0.32 }, dim: 0.22, live: "s3" },
  world: { d: "/film/stills/s4-d.webp", m: "/film/stills/s4-m.webp", iw: 3200, ih: 1786, mx0: 0.439, mw: 0.4019, mi: [1152, 1600], fy: 0.35, zoom: { s: 1.3, u: 0.45, v: 0.32 }, dim: 0.22, live: "s4" },
};

export function usePhone() {
  const [phone, setPhone] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const f = () => setPhone(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return phone;
}

export function Scenery({ bg, phone, interactive = false, glowOn = false, enter = true, className = "absolute inset-0" }: { bg: Bg; phone: boolean; interactive?: boolean; glowOn?: boolean; enter?: boolean; className?: string; children?: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const moveRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = boxRef.current!;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const shift = phone ? 0 : bg.shift ?? 0;
  const iw = phone ? bg.mi[0] : bg.iw, ih = phone ? bg.mi[1] : bg.ih;
  const fy = phone ? 0.5 : bg.fy;
  const z = bg.zoom;
  // a point on the full picture, in the box (before any zoom)
  const flat = (u: number, v: number, b = box): [number, number] => {
    if (!b) return [0, 0];
    const uu = phone ? (u - bg.mx0) / bg.mw : u;
    return coverPoint(uu, v, iw, ih, b.w, b.h, 0.5, fy);
  };
  const origin = z && box ? flat(z.u, z.v) : null;
  // …and after the zoom
  const toBox = (u: number, v: number, b = box): [number, number] => {
    const p = flat(u, v, b);
    if (!z || !b) return p;
    const o = flat(z.u, z.v, b);
    return [o[0] + (p[0] - o[0]) * z.s, o[1] + (p[1] - o[1]) * z.s];
  };

  // the faint living light, and the slow drift with the cursor
  useEffect(() => {
    const el = boxRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce;
    const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const living = new LivingLight(canvasRef.current!, touch);
    living.setStill(bg.live);
    let raf = 0, last = 0, tx = 0, ty = 0, x = 0, y = 0, visible = true;
    const t0 = performance.now();
    const size = () => living.resize(el.clientWidth, el.clientHeight);
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (fine && moveRef.current) {
        x += (tx - x) * 0.04;
        y += (ty - y) * 0.04;
        moveRef.current.style.transform = `translate3d(${(-x * 12).toFixed(2)}px, ${(-y * 8).toFixed(2)}px, 0) scale(1.03)`;
      }
      if (now - last < 33) return;
      last = now;
      living.amount = Math.min(1, Math.max(0, (now - t0 - 800) / 1800));
      const b = { w: el.clientWidth, h: el.clientHeight };
      const map = (u: number, v: number) => toBox(u, v, b);
      const [x0] = map(0, 0.5), [x1] = map(1, 0.5);
      living.draw(now / 1000, map, x1 - x0, reduce);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg, phone]);

  let screen: ReactNode = null;
  if (bg.screen && box) {
    const m = quadMatrix(DASH_SIZE.w, DASH_SIZE.h, bg.screen.quad.map(([u, v]) => toBox(u, v)));
    screen = (
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: DASH_SIZE.w, height: DASH_SIZE.h, transform: m }}>
        <motion.div className="h-full w-full" initial={enter ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.5 }} data-app>
          <Dashboard interactive={interactive && !phone} />
          <div aria-hidden className="pointer-events-none absolute inset-0 [background:linear-gradient(115deg,rgb(255_255_255/0.08),transparent_40%)]" />
        </motion.div>
      </div>
    );
  }
  let glow: ReactNode = null;
  if (bg.glow && box) {
    const [a, , c] = bg.glow.map(([u, v]) => toBox(u, v));
    glow = (
      <div aria-hidden className="pointer-events-none absolute" style={{ left: a[0], top: a[1], width: c[0] - a[0], height: c[1] - a[1] }}>
        <div className="screen-breathe absolute inset-0 rounded-[2%] bg-[#ffd8a8] mix-blend-soft-light" />
        <div className={`absolute -inset-[10%] transition-opacity duration-[1600ms] [background:radial-gradient(closest-side,rgb(255_196_130/0.4),transparent)] ${glowOn ? "opacity-100" : "opacity-0"}`} />
      </div>
    );
  }

  return (
    <div className={`${className} overflow-hidden`}>
      <div ref={boxRef} className="absolute inset-y-0" style={{ left: `${-shift * 100}%`, width: `${(1 + shift) * 100}%` }}>
        <motion.div className="absolute inset-0" initial={enter ? { opacity: 0, scale: 1.06 } : false} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.45 } }} transition={{ duration: 1.5, ease: film }}>
          <div ref={moveRef} className="absolute inset-0 will-change-transform">
            <div className="absolute inset-0" style={z && origin ? { transform: `scale(${z.s})`, transformOrigin: `${origin[0]}px ${origin[1]}px` } : undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(phone ? bg.m : bg.d)} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `50% ${fy * 100}%` }} />
            </div>
            {glow}
            {screen}
            <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
          </div>
        </motion.div>
        {bg.dim ? <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: bg.dim }} /> : null}
      </div>
    </div>
  );
}
