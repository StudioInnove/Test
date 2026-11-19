"use client";

/*
 * From idea to launch, as a walk along the studio's design wall (after Era Residence's sideways chapters).
 * The section stays put while the wall slides by, driven by GSAP ScrollTrigger with a little smoothing,
 * so the picture moves on the compositor and never redraws. One caption at a time, like an exhibition
 * label: a number, a title with an italic word, a line. Small numbered pins mark each step on the wall.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { asset } from "@/lib/content";
import { MaskText } from "../ui/MaskText";

type Step = { title: string; line: string };

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Journey({ heading, steps, titles, image, aspect, at }: { heading: string; steps: Step[]; titles?: string[]; image: string; aspect: number; at: number[] }) {
  const ref = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

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
            bar.style.transform = `scaleX(${p})`;
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
          {/* a numbered pin under each part of the wall */}
          {steps.map((s, i) => (
            <div key={s.title} aria-hidden className="absolute top-[64%] -translate-x-1/2" style={{ left: `${at[i] * 100}%` }}>
              <span className={`flex h-9 w-9 items-center justify-center rounded-full border text-[12px] font-medium tabular-nums backdrop-blur-md transition-[background-color,color,border-color] duration-500 ${i === active ? "border-paper bg-paper text-ink" : "border-paper/30 bg-ink/30 text-paper"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
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
                <p className="t-label tabular-nums transition-opacity duration-500" style={{ opacity: on ? 1 : 0 }}>
                  <span className="text-paper">{String(i + 1).padStart(2, "0")}</span> / {String(steps.length).padStart(2, "0")} · {s.title}
                </p>
                <MaskText as="h3" className="journey-title mt-3" text={titles?.[i] ?? s.title} play={on} stagger={70} />
                <p className="t-lead mt-4 max-w-[36ch] transition-[opacity,transform] duration-700 [transition-timing-function:var(--ease-out)]" style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(8px)", transitionDelay: on ? "200ms" : "0ms" }}>
                  {s.line}
                </p>
              </div>
            );
          })}
        </div>

        {/* the four steps as a quiet ruler, filling as you walk */}
        <div aria-hidden className="absolute inset-x-[var(--gutter)] bottom-8">
          <div className="relative h-px bg-paper/15"><div ref={barRef} className="absolute inset-0 origin-left bg-paper/80" style={{ transform: "scaleX(0)" }} /></div>
          <div className="mt-3 hidden justify-between md:flex">
            {steps.map((s, i) => (
              <span key={s.title} className={`text-[12px] font-medium transition-colors duration-500 ${i <= active ? "text-paper" : "text-paper/35"}`}>{s.title}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
