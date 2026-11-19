"use client";

/*
 * What we build, told the Apple way: the device stays in the middle of the screen while you scroll, and
 * its screen changes to match each thing on the list. The device works: you can use it as it changes.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dashboard, DASH_SIZE } from "../apps/Dashboard";
import { PhoneApps, PHONE_SIZE } from "../apps/PhoneApps";
import { useProgress } from "./useProgress";

type Item = { title: string; line: string };

/** Scales a fixed-size app to fill the width of its frame. */
function Fit({ w, children }: { w: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setK(el.clientWidth / w));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} className="absolute inset-0">
      <div className="origin-top-left" style={{ width: w, transform: `scale(${k})` }}>{children}</div>
    </div>
  );
}

export function Showcase({ kind, heading, items, views }: { kind: "web" | "mobile"; heading: string; items: Item[]; views: number[] }) {
  const ref = useRef<HTMLElement>(null);
  const p = useProgress(ref);
  const n = items.length;
  const at = Math.min(n - 1, Math.floor(p * n * 0.999));
  const web = kind === "web";
  return (
    <section ref={ref} className="relative" style={{ height: `${n * 100 + 40}svh` }}>
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-[var(--gutter)] max-md:pt-24 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:gap-[5vw]">
        {/* the list: the one you're on is bright, its line opens under it */}
        <div className="order-2 md:order-1">
          <h2 className="sr-only">{heading}</h2>
          <ol className="border-t border-paper/15">
            {items.map((it, i) => {
              const on = i === at;
              return (
                <li key={it.title} className="border-b border-paper/15 py-5 md:py-7">
                  <p className={`t-title transition-colors duration-700 ${on ? "text-paper" : "text-paper/25"}`}>{it.title}</p>
                  <div className={`grid transition-[grid-template-rows,opacity] duration-700 [transition-timing-function:var(--ease-out)] ${on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <p className="t-lead overflow-hidden pt-3">{it.line}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        {/* the device */}
        <div className="order-1 flex flex-1 items-center justify-center md:order-2 max-md:mb-6 max-md:max-h-[46svh]">
          {web ? (
            <div className="showcase-device relative w-full" style={{ aspectRatio: `${DASH_SIZE.w} / ${DASH_SIZE.h}` }}>
              <div className="absolute inset-0 overflow-hidden rounded-[18px] shadow-[0_50px_120px_-40px_rgb(0_0_0/0.9),0_0_0_10px_#0c0d12,0_0_0_11px_rgb(255_255_255/0.1)]">
                <Fit w={DASH_SIZE.w}><Dashboard interactive view={views[at]} /></Fit>
              </div>
              <div aria-hidden className="absolute -inset-[12%] -z-10 [background:radial-gradient(closest-side,rgb(244_170_110/0.18),transparent)]" />
            </div>
          ) : (
            <div className="relative h-[44svh] md:h-[74svh]" style={{ aspectRatio: `${PHONE_SIZE.w} / ${PHONE_SIZE.h}` }}>
              <div className="absolute inset-0 overflow-hidden rounded-[48px] shadow-[0_50px_120px_-40px_rgb(0_0_0/0.9),0_0_0_9px_#15161b,0_0_0_10px_rgb(255_255_255/0.12)]">
                <Fit w={PHONE_SIZE.w}><PhoneApps interactive page={views[at]} /></Fit>
              </div>
              <div aria-hidden className="absolute -inset-[30%] -z-10 [background:radial-gradient(closest-side,rgb(244_170_110/0.18),transparent)]" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
