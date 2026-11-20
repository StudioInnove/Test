"use client";

/*
 * What we build, told one at a time, and drawn from idea to screen. The section holds still while you
 * scroll. The three lines turn past a reading line like the drum of a rolodex: the one you are on is sharp
 * and bright; the last one lifts away, smaller and out of focus, as the next one rises into place.
 * Beside it, the app is drawn the way a designer works: faint layout guides, then the boxes, then the
 * details, a few handwritten notes with arrows and a dab of amber highlighter, with the pencil's point
 * moving along each stroke. The colour fills in box by box behind the pencil, the whole screen settles,
 * and the pencil lifts away. From idea to launch, in one moment. Everything is scrubbed by GSAP ScrollTrigger, so it
 * happens at your pace, on a computer and a phone alike.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { asset } from "@/lib/content";
import { sketch, SKETCH_SIZE, FILL_ALL, PENCIL_OUT, type SketchKind, type Sketch } from "./sketches";

type Item = { title: string; phrase: string; line: string; image?: string; sketch?: string };

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
  const empty: Sketch = { strokes: [], fills: [], notes: [], size: 20 };
  const drawings = useMemo(() => items.map((it) => (it.sketch ? sketch(it.sketch as SketchKind) : empty)), [items]); // eslint-disable-line react-hooks/exhaustive-deps

  useIso(() => {
    const { gsap } = getGsap();
    const root = ref.current;
    if (!root) return;
    const state = { t: 0 };
    let last = -1;
    // what each frame holds, looked up once
    const parts = frames.current.map((el, i) => {
      if (!el) return null;
      // with no screen to reveal (your idea), the pencil's drawing stays on the page
      const keep = !items[i]?.image;
      const strokes = Array.from(el.querySelectorAll<SVGPathElement>("[data-stroke]")).map((p) => ({ p, s: +p.dataset.s!, e: +p.dataset.e!, len: p.getTotalLength() }));
      return {
        strokes,
        fills: Array.from(el.querySelectorAll<SVGRectElement>("[data-fill]")).map((r) => ({ r, s: +r.dataset.s!, e: +r.dataset.e! })),
        notes: Array.from(el.querySelectorAll<SVGTextElement>("[data-note]")).map((n) => ({ n, s: +n.dataset.s!, e: +n.dataset.e! })),
        all: el.querySelector<SVGRectElement>("[data-fill-all]"),
        pencil: el.querySelector<SVGGElement>("[data-pencil]"),
        keep,
        ink: el.querySelector<SVGGElement>("[data-ink]"),
      };
    });
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
        const pt = parts[i];
        if (!pt) return;
        // the pencil draws, stroke after stroke; its point rides the stroke being drawn
        let tip: { x: number; y: number } | null = null, tipAt = -1;
        pt.strokes.forEach(({ p, s, e, len }) => {
          const k = clamp((local - s) / (e - s));
          p.style.strokeDashoffset = String(1 - smooth(k));
          if (k > 0 && k < 1 && s > tipAt) {
            const q = p.getPointAtLength(len * smooth(k));
            tip = { x: q.x, y: q.y };
            tipAt = s;
          }
        });
        // the colour follows the pencil, box by box, then the whole screen settles
        pt.fills.forEach(({ r, s, e }) => r.setAttribute("opacity", String(ease(clamp((local - s) / (e - s))))));
        pt.all?.setAttribute("opacity", String(ease(clamp((local - FILL_ALL[0]) / (FILL_ALL[1] - FILL_ALL[0])))));
        // the handwriting
        const lifted = ease(clamp((local - PENCIL_OUT[0]) / (PENCIL_OUT[1] - PENCIL_OUT[0])));
        const lift = pt.keep ? 0 : lifted;
        pt.notes.forEach(({ n, s, e }) => {
          const k = ease(clamp((local - s) / (e - s)));
          n.style.opacity = String(k * (1 - lift));
          n.style.clipPath = `inset(-20% ${(1 - k) * 100}% -20% -4%)`;
        });
        if (pt.ink) pt.ink.style.opacity = String(1 - lift);
        if (pt.pencil) {
          const t0 = tip as { x: number; y: number } | null;
          pt.pencil.style.opacity = t0 && lifted < 1 ? "1" : "0";
          if (t0) pt.pencil.setAttribute("transform", `translate(${t0.x.toFixed(1)} ${t0.y.toFixed(1)})`);
        }
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
              key={it.title + i}
              ref={(el) => { frames.current[i] = el; }}
              className={`sketch-paper col-start-1 row-start-1 relative overflow-hidden border border-paper/12 ${web ? "rounded-[14px]" : "rounded-[34px]"}`}
              style={{ aspectRatio: `${vw} / ${vh}`, opacity: i === 0 ? 1 : 0 }}
            >
              <svg role="img" aria-label={it.image ? `${it.title}: an example screen, drawn first as a sketch` : "A blank page with a pencil sketch, waiting for your idea"} viewBox={`0 0 ${vw} ${vh}`} className="absolute inset-0 h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  {/* the colour comes in where the pencil has been */}
                  <mask id={`si-m-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width={vw} height={vh}>
                    <rect data-fill-all x="0" y="0" width={vw} height={vh} fill="#fff" opacity="0" />
                    {drawings[i].fills.map((fl, k) => (
                      <rect key={k} data-fill data-s={fl.s} data-e={fl.e} x={fl.x} y={fl.y} width={fl.w} height={fl.h} rx={fl.r} fill="#fff" opacity="0" />
                    ))}
                  </mask>
                  {/* a little tooth to the graphite */}
                  <filter id={`si-g-${i}`} x="-2%" y="-2%" width="104%" height="104%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed={i + 3} />
                    <feDisplacementMap in="SourceGraphic" scale={web ? 2.2 : 1.4} />
                  </filter>
                </defs>
                {it.image && <image href={asset(it.image)} x="0" y="0" width={vw} height={vh} preserveAspectRatio="xMidYMid slice" mask={`url(#si-m-${i})`} />}
                <g data-ink>
                  <g className="sketch-grain" style={{ ["--grain" as string]: `url(#si-g-${i})` }}>
                    {drawings[i].strokes.map((st, k) => (
                      <path key={k} data-stroke data-s={st.s} data-e={st.e} d={st.d} pathLength={1} stroke={st.amber ? "rgb(232 161 90)" : "rgb(239 233 224)"} strokeOpacity={st.o} strokeWidth={st.w} style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
                    ))}
                  </g>
                  {drawings[i].notes.map((nt, k) => (
                    <text key={k} data-note data-s={nt.s} data-e={nt.e} x={nt.x} y={nt.y} textAnchor={nt.anchor ?? "start"} transform={`rotate(${nt.rot} ${nt.x} ${nt.y})`} className="sketch-note" fontSize={drawings[i].size} style={{ opacity: 0 }}>
                      {nt.t}
                    </text>
                  ))}
                </g>
                {/* the pencil's point */}
                <g data-pencil style={{ opacity: 0 }}>
                  <circle r={web ? 14 : 9} fill="rgb(239 233 224 / 0.08)" />
                  <circle r={web ? 3.2 : 2.2} fill="rgb(239 233 224 / 0.95)" />
                </g>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
