"use client";

/*
 * A still from the film at the top of a page, alive the same way the rooms are: its city lights
 * twinkle, its lamp breathes, and its screen works. The photo itself is never touched.
 */
import { useEffect, useRef } from "react";
import { asset } from "@/lib/content";
import { coverPoint, quadMatrix } from "@/lib/quad";
import { BuildScreen, BUILD_SIZE } from "./apps/BuildScreen";
import { Dashboard, DASH_SIZE } from "./apps/Dashboard";
import { PhoneApps, PHONE_SIZE } from "./apps/PhoneApps";
import { LivingLight } from "./film/living";
import { MFOCUS, SCREENS, type StillId } from "./film/timeline";

const FULL = 3200 / 1786;
const M_ASPECT = 0.72;

export function LivingStill({ still, alt }: { still: StillId; alt: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const scr = SCREENS[still];

  useEffect(() => {
    const box = boxRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const living = new LivingLight(canvasRef.current!, touch);
    living.setStill(still);
    let raf = 0, last = 0, visible = true;
    const t0 = performance.now();

    const map = (u: number, v: number): [number, number] => {
      const w = box.clientWidth, h = box.clientHeight;
      const phone = window.matchMedia("(max-width: 899px)").matches;
      if (!phone) return coverPoint(u, v, 3200, 1786, w, h);
      // phones show a portrait crop of the still
      const cw = M_ASPECT / FULL;
      const x0 = Math.min(Math.max(0, (MFOCUS[still] ?? 0.5) - cw / 2), 1 - cw);
      return coverPoint((u - x0) / cw, v, 1152, 1600, w, h);
    };
    const place = () => {
      living.resize(box.clientWidth, box.clientHeight);
      const el = screenRef.current;
      if (el && scr) {
        const size = scr.app === "dash" ? DASH_SIZE : scr.app === "phone" ? PHONE_SIZE : BUILD_SIZE;
        el.style.transform = quadMatrix(size.w, size.h, scr.quad.map(([u, v]) => map(u, v)));
      }
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(box);

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || now - last < 33) return;
      last = now;
      // the light comes up as the photo settles in
      living.amount = Math.min(1, Math.max(0, (now - t0 - 900) / 1600));
      if (screenRef.current) screenRef.current.style.opacity = String(Math.min(0.97, Math.max(0, (now - t0 - 600) / 1400)));
      const [x0] = map(0, 0.5), [x1] = map(1, 0.5);
      living.draw(now / 1000, map, x1 - x0, reduce);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [still, scr]);

  return (
    <div ref={boxRef} className="page-still absolute inset-0">
      <picture>
        <source media="(max-width: 899px)" srcSet={asset(`/film/stills/${still}-m.webp`)} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(`/film/stills/${still}-d.webp`)} alt={alt} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
      </picture>
      {scr && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div ref={screenRef} className={`room-screen absolute left-0 top-0 origin-top-left ${scr.app === "phone" ? "is-phone" : ""}`} style={{ opacity: 0 }}>
            {scr.app === "dash" && <Dashboard />}
            {scr.app === "phone" && <PhoneApps notify />}
            {scr.app === "build" && <BuildScreen />}
            <div className="absolute inset-0 [background:linear-gradient(115deg,rgb(255_255_255/0.1),transparent_45%)]" />
          </div>
        </div>
      )}
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
