"use client";

/*
 * The display in the websites room: a website being made, over and over, the way the studio makes them.
 * On a blank page the pencil draws the layout (guides, boxes, details), the colour and photographs fill
 * in where it has drawn, the finished page holds for a while, then the page clears for the next one.
 * It takes turns between the three demo sites. Driven by its own clock (requestAnimationFrame), not the scroll.
 */
import { useEffect, useMemo, useRef } from "react";
import { asset } from "@/lib/content";
import { sketch, type SketchKind } from "../page/sketches";

const W = 1200, H = 720;
const SITES: { kind: SketchKind; image: string }[] = [
  { kind: "web-brand", image: "/services/screens/web-brand.webp" },
  { kind: "web-shop", image: "/services/screens/web-shop.webp" },
  { kind: "web-landing", image: "/services/screens/web-landing.webp" },
];
/** One site's turn, in seconds: drawing, colour, the finished page, clearing. */
const TURN = 11;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const smooth = (x: number) => x * x * (3 - 2 * x);

export function SiteScreen() {
  const ref = useRef<HTMLDivElement>(null);
  const drawings = useMemo(() => SITES.map((s) => sketch(s.kind)), []);

  useEffect(() => {
    const root = ref.current!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-site]")).map((el) => ({
      el,
      strokes: Array.from(el.querySelectorAll<SVGPathElement>("[data-stroke]")).map((p) => ({ p, s: +p.dataset.s!, e: +p.dataset.e! })),
      fills: Array.from(el.querySelectorAll<SVGRectElement>("[data-fill]")).map((r) => ({ r, s: +r.dataset.s!, e: +r.dataset.e! })),
      all: el.querySelector<SVGRectElement>("[data-fill-all]"),
      ink: el.querySelector<SVGGElement>("[data-ink]"),
    }));
    let raf = 0, last = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 33) return; // 30 fps is plenty for a pencil
      last = now;
      const t = reduce ? 0.8 * TURN : (now - t0) / 1000;
      const turn = Math.floor(t / TURN) % SITES.length;
      // the sketch's own timeline runs 0..0.72; then the page holds; then it clears
      const k = (t % TURN) / TURN;
      const local = Math.min(0.8, k * 1.25);
      const clear = smooth(clamp((k - 0.9) / 0.1));
      layers.forEach((L, i) => {
        const on = i === turn;
        L.el.style.opacity = on ? String(1 - clear) : "0";
        if (!on) return;
        L.strokes.forEach(({ p, s, e }) => (p.style.strokeDashoffset = String(1 - smooth(clamp((local - s) / (e - s))))));
        L.fills.forEach(({ r, s, e }) => r.setAttribute("opacity", String(ease(clamp((local - s) / (e - s))))));
        L.all?.setAttribute("opacity", String(ease(clamp((local - 0.55) / 0.12))));
        if (L.ink) L.ink.style.opacity = String(1 - ease(clamp((local - 0.52) / 0.14)));
      });
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} aria-hidden className="relative overflow-hidden" style={{ width: W, height: H, background: "#f3f1ec" }}>
      {SITES.map((s, i) => (
        <div key={s.kind} data-site className="absolute inset-0" style={{ opacity: i === 0 ? 1 : 0 }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <mask id={`ss-m-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
                <rect data-fill-all x="0" y="0" width={W} height={H} fill="#fff" opacity="0" />
                {drawings[i].fills.map((f, k) => (
                  <rect key={k} data-fill data-s={f.s} data-e={f.e} x={f.x} y={f.y} width={f.w} height={f.h} rx={Math.min(f.r, f.h / 2, f.w / 2)} fill="#fff" opacity="0" />
                ))}
              </mask>
            </defs>
            <image href={asset(s.image)} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid slice" mask={`url(#ss-m-${i})`} />
            <g data-ink>
              {drawings[i].strokes.map((st, k) => (
                <path key={k} data-stroke data-s={st.s} data-e={st.e} d={st.d} pathLength={1} stroke={st.amber ? "rgb(232 150 80)" : "rgb(52 49 45)"} strokeOpacity={st.amber ? st.o * 1.4 : st.o * 0.85} strokeWidth={st.w} style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
              ))}
            </g>
          </svg>
        </div>
      ))}
    </div>
  );
}

export const SITE_SIZE = { w: W, h: H };
