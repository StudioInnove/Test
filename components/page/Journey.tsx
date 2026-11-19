"use client";

/*
 * From idea to launch, as a walk along the studio's design wall (after Era Residence's sideways chapters):
 * the page scrolls down, the wall slides by, and each step appears beside the part of the wall it belongs to.
 */
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/content";
import { useProgress } from "./useProgress";
import { MaskText } from "../ui/MaskText";

type Step = { title: string; line: string };

export function Journey({ heading, steps, image, aspect, at }: { heading: string; steps: Step[]; image: string; aspect: number; at: number[] }) {
  const ref = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const p = useProgress(ref);
  const [size, setSize] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const f = () => setSize({ w: window.innerWidth, h: boxRef.current?.clientHeight || window.innerHeight });
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  // the wall is as tall as the view and as wide as its picture makes it
  const trackW = Math.max(size.w * 1.6, size.h * aspect);
  const x = -p * (trackW - size.w);
  // which step you're on follows the scroll: the first at the start, the last at the end
  const active = Math.min(steps.length - 1, Math.round(p * (steps.length - 1)));
  return (
    <section ref={ref} className="relative" style={{ height: "420svh" }}>
      <div ref={boxRef} className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-y-0 left-0 will-change-transform" style={{ width: trackW, transform: `translate3d(${x}px,0,0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(image)} alt="Sketches for every screen, pinned along the studio wall" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-0 [background:linear-gradient(0deg,rgb(7_10_18/0.92)_0%,rgb(7_10_18/0.4)_38%,transparent_62%)]" />
          {/* each step sits under its part of the wall */}
          {steps.map((s, i) => {
            const near = i === active;
            return (
              <div key={s.title} className="absolute bottom-[12svh] w-[min(380px,80vw)] transition-[opacity,transform] duration-700 [transition-timing-function:var(--ease-out)]" style={{ left: `calc(${at[i] * 100}% - min(190px, 40vw))`, opacity: near ? 1 : 0.18, transform: near ? "none" : "translateY(10px)" }}>
                <div className="mb-5 h-px w-full bg-paper/20"><div className="h-px origin-left bg-paper transition-transform duration-1000" style={{ transform: `scaleX(${near ? 1 : 0})` }} /></div>
                <h3 className="t-title">{s.title}</h3>
                <p className="t-lead mt-4">{s.line}</p>
              </div>
            );
          })}
        </div>
        {/* the heading stays, and a fine line shows how far along the wall you are */}
        <div className="absolute left-[var(--gutter)] top-[max(96px,14svh)]"><MaskText className="t-title" text={heading} /></div>
        <div aria-hidden className="absolute inset-x-[var(--gutter)] bottom-8 h-px bg-paper/15"><div className="h-px origin-left bg-paper/70" style={{ transform: `scaleX(${p})` }} /></div>
      </div>
    </section>
  );
}
