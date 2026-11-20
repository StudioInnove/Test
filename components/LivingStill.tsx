"use client";

/*
 * A still from the film at the top of a page, alive the same way the rooms are: its city lights
 * twinkle, its lamp breathes, and its screen works. With WebGL it is also a photo with depth: as the
 * mouse moves (or the page scrolls, on a phone) near things shift a little more than far ones, around
 * the thing in focus, so the room reads as a real space. Its screen and lights move with it.
 */
import { useEffect, useRef } from "react";
import { asset } from "@/lib/content";
import { coverPoint, quadMatrix } from "@/lib/quad";
import { BuildScreen, BUILD_SIZE } from "./apps/BuildScreen";
import { Dashboard, DASH_SIZE } from "./apps/Dashboard";
import { PhoneApps, PHONE_SIZE } from "./apps/PhoneApps";
import { SiteScreen, SITE_SIZE } from "./apps/SiteScreen";
import { LivingLight } from "./film/living";
import { DepthPhoto } from "@/lib/depthPhoto";
import { MFOCUS, SCREENS, type StillId } from "./film/timeline";

const FULL = 3200 / 1786;
const M_ASPECT = 0.72;
/** The photo is drawn a touch larger than its frame, so the depth shift never shows an edge. */
const ZOOM = 1 / 0.955;

export function LivingStill({ still, alt }: { still: StillId; alt: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const scrWrapRef = useRef<HTMLDivElement>(null);
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
        const size = scr.app === "dash" ? DASH_SIZE : scr.app === "phone" ? PHONE_SIZE : scr.app === "site" ? SITE_SIZE : BUILD_SIZE;
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
      if (screenRef.current) screenRef.current.style.opacity = String(Math.min(scr?.app === "site" ? 1 : 0.97, Math.max(0, (now - t0 - 600) / 1400)));
      const [x0] = map(0, 0.5), [x1] = map(1, 0.5);
      living.draw(now / 1000, map, x1 - x0, reduce);
    };
    raf = requestAnimationFrame(loop);

    // the photo with depth
    let depth: DepthPhoto | null = null;
    let cornerD: number[] | null = null;
    let dRaf = 0;
    const tgt = [0, 0];
    const onPointer = (e: PointerEvent) => {
      tgt[0] = -(e.clientX / window.innerWidth - 0.5) * 0.028;
      tgt[1] = -(e.clientY / window.innerHeight - 0.5) * 0.02;
    };
    if (!reduce) {
      try {
        const phoneCrop = window.matchMedia("(max-width: 899px)").matches;
        const d = new DepthPhoto(depthRef.current!);
        depth = d;
        const sfx = phoneCrop ? "m" : "d";
        // the depth of the thing in focus (the screen, if there is one) stays still
        const probe = new Image();
        probe.src = asset(`/film/depth/${still}-d.webp`);
        probe.onload = () => {
          if (!scr) return;
          const c = document.createElement("canvas");
          c.width = 256;
          c.height = 144;
          const x = c.getContext("2d");
          if (!x) return;
          x.drawImage(probe, 0, 0, 256, 144);
          const at = (u: number, v: number) => x.getImageData(Math.min(255, Math.round(u * 256)), Math.min(143, Math.round(v * 144)), 1, 1).data[0] / 255;
          const u = scr.quad.reduce((a, q) => a + q[0], 0) / 4, v = scr.quad.reduce((a, q) => a + q[1], 0) / 4;
          d.focus = at(u, v);
          // the depth at each corner of the screen (read a little inside, where it's surely the screen, and carried
          // out to the corner), so the screen moves with the photo as it shifts, and never seems to lift off it
          cornerD = scr.quad.map(([qu, qv]) => {
            const inner = at(u + (qu - u) * 0.85, v + (qv - v) * 0.85);
            return d.focus + (inner - d.focus) / 0.85;
          });
        };
        d.load(asset(`/film/stills/${still}-${sfx}.webp`), asset(`/film/depth/${still}-${sfx}.webp`)).then(() => {
          d.resize(box.clientWidth, box.clientHeight);
          if (depthRef.current) depthRef.current.style.opacity = "1";
        }).catch(() => (depth = null));
        const dro = new ResizeObserver(() => d.resize(box.clientWidth, box.clientHeight));
        dro.observe(box);
        if (!touch) window.addEventListener("pointermove", onPointer, { passive: true });
        const inv = 1 / d.zoom;
        const size = scr ? (scr.app === "dash" ? DASH_SIZE : scr.app === "phone" ? PHONE_SIZE : scr.app === "site" ? SITE_SIZE : BUILD_SIZE) : null;
        const tick = (now: number) => {
          dRaf = requestAnimationFrame(tick);
          if (!visible || !d.ready) return;
          if (touch) {
            // phones: the room drifts with the scroll, and sways a little on its own
            tgt[0] = Math.sin(now / 3200) * 0.006;
            tgt[1] = Math.min(1, window.scrollY / window.innerHeight) * 0.03;
          }
          d.off[0] += (tgt[0] - d.off[0]) * 0.06;
          d.off[1] += (tgt[1] - d.off[1]) * 0.06;
          d.draw();
          // what sits on the photo moves with what it sits on
          const [lx, ly] = d.shiftAt(0.12);
          if (lightRef.current) lightRef.current.style.transform = `translate3d(${lx}px,${ly}px,0) scale(${inv})`;
          // ...the screen too, corner by corner
          if (scr && size && cornerD && screenRef.current) {
            screenRef.current.style.transform = quadMatrix(size.w, size.h, scr.quad.map(([qu, qv], k) => {
              const [px, py] = map(qu, qv);
              const [sx, sy] = d.shiftAt(cornerD![k]);
              return [px + sx / ZOOM, py + sy / ZOOM];
            }));
          }
        };
        dRaf = requestAnimationFrame(tick);
        const stop = () => {
          cancelAnimationFrame(dRaf);
          dro.disconnect();
          window.removeEventListener("pointermove", onPointer);
        };
        (box as unknown as { _stopDepth?: () => void })._stopDepth = stop;
      } catch {
        depth = null;
      }
    }
    return () => {
      (box as unknown as { _stopDepth?: () => void })._stopDepth?.();
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [still, scr]);

  return (
    <div ref={boxRef} className="page-still absolute inset-0">
      <div ref={stageRef} className="absolute inset-0" style={{ transform: `scale(${ZOOM})` }}>
        <picture>
          <source media="(max-width: 899px)" srcSet={asset(`/film/stills/${still}-m.webp`)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(`/film/stills/${still}-d.webp`)} alt={alt} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        </picture>
      </div>
      <canvas ref={depthRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-700" style={{ opacity: 0 }} />
      {scr && (
        <div ref={scrWrapRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ transform: `scale(${ZOOM})` }}>
          <div ref={screenRef} className={`room-screen absolute left-0 top-0 origin-top-left ${scr.app === "phone" ? "is-phone" : ""}`} style={{ opacity: 0 }}>
            {scr.app === "dash" && <Dashboard />}
            {scr.app === "phone" && <PhoneApps notify />}
            {scr.app === "build" && <BuildScreen />}
            {scr.app === "site" && <SiteScreen />}
            <div className="absolute inset-0 [background:linear-gradient(115deg,rgb(255_255_255/0.1),transparent_45%)]" />
          </div>
        </div>
      )}
      <div ref={lightRef} aria-hidden className="pointer-events-none absolute inset-0" style={{ transform: `scale(${ZOOM})` }}>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}
