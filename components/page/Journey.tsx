"use client";

/*
 * From idea to launch, as a walk along the studio's design wall (after Era Residence's sideways chapters).
 * The section stays put while the wall slides by, driven by GSAP ScrollTrigger with a little smoothing,
 * so the picture moves on the compositor and never redraws. One caption at a time, like an exhibition
 * label: a word in the italic serif (first, then, next, finally), a title, a line. A fine thread, pinned
 * from one group of sketches to the next, is drawn along the wall as you walk.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { asset } from "@/lib/content";
import { MaskText } from "../ui/MaskText";

type Step = { title: string; line: string };

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Where the thread runs on the wall (a share of its height), and its path: pin to pin with a soft sag. */
const THREAD_Y = 0.255;
function thread(at: number[], w: number, h: number) {
  const y = h * THREAD_Y;
  let d = `M ${at[0] * w} ${y}`;
  for (let i = 1; i < at.length; i++) {
    const x0 = at[i - 1] * w, x1 = at[i] * w;
    const sag = h * 0.05;
    d += ` C ${x0 + (x1 - x0) * 0.3} ${y + sag} ${x0 + (x1 - x0) * 0.7} ${y + sag} ${x1} ${y}`;
  }
  return d;
}

export function Journey({ heading, steps, titles, order, image, aspect, at }: { heading: string; steps: Step[]; titles?: string[]; order?: string[]; image: string; aspect: number; at: number[] }) {
  const ref = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<SVGPathElement>(null);
  const [active, setActive] = useState(0);
  const [dims, setDims] = useState({ w: 2400, h: 900 });

  useIso(() => {
    const { gsap } = getGsap();
    const sec = ref.current, box = boxRef.current, track = trackRef.current, bar = barRef.current;
    if (!sec || !box || !track || !bar) return;
    let last = 0;
    const ctx = gsap.context(() => {
      // the wall is as tall as the view and as wide as its picture makes it
      const size = () => {
        const w = box.clientWidth, h = box.clientHeight;
        track.style.width = `${Math.max(w * 1.6, h * aspect)}px`;
        setDims({ w: Math.max(w * 1.6, h * aspect), h });
        return Math.max(w * 1.6, h * aspect) - w;
      };
      size();
      gsap.fromTo(track, { x: 0 }, {
        x: () => -size(),
        ease: "none",
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (st) => {
            const p = st.progress;
            // the thread is drawn a little ahead of you, so it reaches each group as you do
            bar.style.strokeDashoffset = String(1 - Math.min(1, p * 1.04));
            // which step you're on, with a little give so it never flickers between two
            const f = p * (steps.length - 1);
            const near = Math.round(f);
            if (near !== last && Math.abs(f - near) < 0.38) {
              last = near;
              setActive(near);
            }
          },
        },
      });
    }, sec);
    return () => ctx.revert();
  }, [aspect, steps.length]);

  return (
    <section ref={ref} className="relative" style={{ height: "420svh" }}>
      <div ref={boxRef} className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={trackRef} className="absolute inset-y-0 left-0 will-change-transform" style={{ width: "160vw" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(image)} alt="Sketches for every screen, pinned along the studio wall" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          {/* a fine thread pinned from one group of sketches to the next, sagging a little between pins */}
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${dims.w} ${dims.h}`}>
            <path
              ref={barRef}
              d={thread(at, dims.w, dims.h)}
              pathLength={1}
              fill="none"
              stroke="rgb(239 233 224 / 0.7)"
              strokeWidth={1.4}
              strokeLinecap="round"
              style={{ strokeDasharray: 1, strokeDashoffset: 1, filter: "drop-shadow(0 2px 2px rgb(0 0 0 / 0.45))" }}
            />
            {at.map((a, i) => (
              <circle key={i} cx={a * dims.w} cy={dims.h * THREAD_Y} r={4} fill="#efe9e0" style={{ opacity: i <= active ? 0.95 : 0, transition: "opacity 600ms ease", filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.6))" }} />
            ))}
          </svg>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 [background:linear-gradient(0deg,rgb(7_10_18/0.94)_0%,rgb(7_10_18/0.55)_30%,transparent_55%),linear-gradient(180deg,rgb(7_10_18/0.6)_0%,transparent_26%)]" />

        {/* the heading stays */}
        <div className="absolute left-[var(--gutter)] top-[max(104px,14svh)]">
          <MaskText className="t-title" text={heading} />
        </div>

        {/* one caption at a time */}
        <div className="absolute bottom-[calc(10svh+40px)] left-[var(--gutter)] right-[var(--gutter)] grid">
          {steps.map((s, i) => {
            const on = i === active;
            return (
              <div key={s.title} aria-hidden={!on} className="col-start-1 row-start-1 max-w-[560px]" style={{ pointerEvents: on ? "auto" : "none" }}>
                <p className="kicker transition-[opacity,filter] duration-[1200ms]" style={{ opacity: on ? 1 : 0, filter: on ? "none" : "blur(6px)" }}>{order?.[i] ?? s.title}</p>
                <MaskText as="h3" className="journey-title mt-2" text={titles?.[i] ?? s.title} play={on} delay={80} />
                <p className="t-lead mt-4 max-w-[36ch] transition-[opacity,transform,filter] duration-[1400ms] [transition-timing-function:var(--ease-out)]" style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(8px)", filter: on ? "none" : "blur(6px)", transitionDelay: on ? "550ms" : "0ms" }}>
                  {s.line}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
