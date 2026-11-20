"use client";

/*
 * What we build, told one at a time, and drawn from idea to screen. The section holds still while you
 * scroll. The three lines turn past a reading line like the drum of a rolodex: the one you are on is sharp
 * and bright; the last one lifts away, smaller and out of focus, as the next one rises into place.
 * Beside it, the app is drawn: a pencil wireframe sketches itself stroke by stroke, in the hand of the
 * sketches on the studio's wall, then the real, finished screen resolves underneath it and the pencil
 * fades away. From idea to launch, in one moment. Everything is scrubbed by GSAP ScrollTrigger, so it
 * happens at your pace, on a computer and a phone alike.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { asset } from "@/lib/content";
import { sketch, SKETCH_SIZE, type SketchKind } from "./sketches";

type Item = { title: string; phrase: string; line: string; image: string; sketch?: string };

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const smooth = (x: number) => x * x * (3 - 2 * x);

export function ServiceIndex({ kicker, items }: { kicker: string; items: Item[] }) {
  const ref = useRef<HTMLElement>(null);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const frames = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const n = items.length;
  const web = (items[0]?.sketch ?? "web").startsWith("web");
  const [vw, vh] = web ? SKETCH_SIZE.web : SKETCH_SIZE.mobile;
  const drawings = useMemo(() => items.map((it) => (it.sketch ? sketch(it.sketch as SketchKind) : [])), [items]);

  useIso(() => {
    const { gsap } = getGsap();
    const root = ref.current;
    if (!root) return;
    const state = { t: 0 };
    let last = -1;
    const apply = () => {
      const t = state.t;
      // the drum turns near the end of each item's stretch
      const fl = Math.min(n - 1, Math.floor(t));
      const pos = Math.min(n - 1, fl + smooth(clamp((t - fl - 0.8) / 0.2)));
      rows.current.forEach((el, i) => {
        if (!el) return;
        const d = i - pos;
        const a = Math.min(1, Math.abs(d));
        el.style.transform = `translate3d(0, ${d * 92}%, 0) scale(${1 - a * 0.3})`;
        el.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 1.15));
        el.style.filter = a > 0.02 ? `blur(${a * 5}px)` : "none";
      });
      frames.current.forEach((el, i) => {
        if (!el) return;
        const local = t - i;
        // in view from the start of its stretch until the drum turns past it
        const out = i === n - 1 ? 0 : smooth(clamp((local - 0.82) / 0.16));
        const into = i === 0 ? 1 : smooth(clamp((local + 0.06) / 0.1));
        el.style.opacity = String(into * (1 - out));
        el.style.transform = `translate3d(0, ${(1 - into) * 24 - out * 24}px, 0)`;
        el.style.visibility = into <= 0 || out >= 1 ? "hidden" : "visible";
        // the pencil draws, stroke after stroke
        const strokes = el.querySelectorAll<SVGPathElement>("path");
        const drawn = clamp(local / 0.42) * (strokes.length + 6);
        strokes.forEach((p, k) => (p.style.strokeDashoffset = String(1 - ease(clamp((drawn - k) / 6)))));
        // then the finished screen comes through, and the pencil lifts away
        const done = ease(clamp((local - 0.4) / 0.26));
        const scr = el.querySelector<HTMLElement>("[data-screen]");
        if (scr) {
          scr.style.opacity = String(done);
          scr.style.clipPath = `inset(0% 0% ${(1 - done) * 100}% 0%)`;
        }
        const svg = el.querySelector<SVGElement>("svg");
        if (svg) svg.style.opacity = String(1 - done * 0.92);
      });
      if (fl !== last) {
        last = fl;
        setActive(Math.round(pos));
      }
    };
    apply();
    const ctx = gsap.context(() => {
      gsap.to(state, { t: n - 0.08, ease: "none", onUpdate: apply, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 1 } });
    }, root);
    return () => ctx.revert();
  }, [n]);

  return (
    <section ref={ref} className="relative" style={{ height: `${n * 110 + 40}svh` }} aria-label={kicker}>
      <div className={`sticky top-0 flex h-[100svh] flex-col justify-center gap-8 overflow-hidden px-[var(--gutter)] md:grid md:content-center md:items-center md:justify-center md:gap-[5vw] ${web ? "md:grid-cols-[minmax(0,520px)_minmax(0,600px)]" : "md:grid-cols-[minmax(0,560px)_minmax(0,320px)]"}`}>
        {/* the words */}
        <div className="relative max-md:pt-14">
          <p className="kicker">{kicker}</p>
          {/* the drum: one line in focus, its neighbours above and below */}
          <div className="relative mt-6 h-[1.9em] si-title md:mt-10">
            {items.map((it, i) => (
              <div key={it.title} ref={(el) => { rows.current[i] = el; }} aria-hidden={i !== active} className="absolute inset-x-0 top-0 origin-left will-change-transform">
                <h3 className="leading-[0.95]">{it.title}</h3>
                <p className="si-phrase mt-[0.12em]">{it.phrase}</p>
              </div>
            ))}
          </div>
          {/* what it is, for the one in focus */}
          <div className="relative mt-8 grid md:mt-12">
            {items.map((it, i) => (
              <p
                key={it.title}
                className="t-lead col-start-1 row-start-1 max-w-[34ch] transition-[opacity,transform] duration-[900ms] [transition-timing-function:var(--ease-out)]"
                style={{ opacity: i === active ? 1 : 0, transform: i === active ? "none" : "translateY(10px)" }}
              >
                {it.line}
              </p>
            ))}
          </div>
          {/* where you are, quietly */}
          <div aria-hidden className="mt-10 flex gap-2">
            {items.map((it, i) => (
              <span key={it.title} className={`h-[2px] rounded-full transition-all duration-700 [transition-timing-function:var(--ease-out)] ${i === active ? "w-8 bg-paper" : "w-3 bg-paper/25"}`} />
            ))}
          </div>
        </div>

        {/* the drawing: pencil first, then the real screen */}
        <div className={`relative mx-auto grid w-full md:mx-0 ${web ? "max-w-[600px] max-md:w-[88%]" : "max-w-[300px] max-md:w-[46%]"}`}>
          {items.map((it, i) => (
            <div
              key={it.image + i}
              ref={(el) => { frames.current[i] = el; }}
              className={`col-start-1 row-start-1 relative overflow-hidden border border-paper/12 bg-[#0b0f1a] ${web ? "rounded-[14px]" : "rounded-[34px]"}`}
              style={{ aspectRatio: `${vw} / ${vh}`, opacity: i === 0 ? 1 : 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img data-screen src={asset(it.image)} alt={`${it.title}: a working screen we built`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0 }} />
              <svg aria-hidden viewBox={`0 0 ${vw} ${vh}`} className="absolute inset-0 h-full w-full" fill="none" stroke="rgb(239 233 224 / 0.78)" strokeWidth={web ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                {drawings[i].map((d, k) => (
                  <path key={k} d={d} pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
                ))}
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
