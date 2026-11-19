"use client";

/*
 * What we build, as full-screen cards that stack (after Shopify Editions and gsap.com's showcase): each card
 * slides up over the last, which sinks back and dims. A card is one idea: a number, a headline with an
 * italic word, one line, three tags, and a real, working device on a warm glow. GSAP ScrollTrigger scrubs
 * the stacking, so it follows the scroll exactly and costs nothing between frames.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { getGsap } from "@/lib/gsap";
import { Dashboard, DASH_SIZE } from "../apps/Dashboard";
import { PhoneApps } from "../apps/PhoneApps";
import { FRAME_SIZE, PhoneFrame } from "../ui/PhoneFrame";
import { MaskText } from "../ui/MaskText";

type Item = { title: string; headline?: string; line: string; tags?: string[] };

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
const GLOWS = ["rgb(244 170 110 / 0.30)", "rgb(140 160 255 / 0.24)", "rgb(240 128 110 / 0.26)"];

/** Scales a fixed-size thing to fit its box (width, and height if given). */
function Fit({ w, h, children }: { w: number; h?: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = ref.current!;
    const f = () => setK(Math.min(el.clientWidth / w, h ? el.clientHeight / h : Infinity));
    f();
    const ro = new ResizeObserver(f);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);
  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center">
      <div className="shrink-0" style={{ width: w * k, height: (h ?? 0) * k || undefined }}>
        <div className="origin-top-left" style={{ width: w, transform: `scale(${k})`, opacity: k ? 1 : 0 }}>{children}</div>
      </div>
    </div>
  );
}

export function Showcase({ kind, heading, items, views }: { kind: "web" | "mobile"; heading: string; items: Item[]; views: number[] }) {
  const ref = useRef<HTMLElement>(null);
  const web = kind === "web";
  const n = items.length;

  useIso(() => {
    const { gsap } = getGsap();
    const root = ref.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".sc-card", root);
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const inner = card.querySelector(".sc-inner");
        const shade = card.querySelector(".sc-shade");
        // as the next card rises, this one sinks back and dims
        const st = { trigger: next, start: "top bottom", end: "top top", scrub: true };
        gsap.to(inner, { scale: 0.9, y: "-2svh", ease: "none", scrollTrigger: st });
        gsap.to(shade, { opacity: 0.7, ease: "none", scrollTrigger: { ...st } });
      });
    }, root);
    return () => ctx.revert();
  }, [n]);

  return (
    <section ref={ref} className="relative" aria-label={heading}>
      <h2 className="sr-only">{heading}</h2>
      {items.map((it, i) => [
        // a pause after each card, so it is read before the next one rises
        i > 0 && <div key={`gap${i}`} aria-hidden className="h-[55svh]" />,
        <div key={it.title} className="sc-card sticky top-0 h-[100svh] overflow-hidden">
          <div className="sc-inner absolute inset-0 origin-top p-3 will-change-transform md:p-5">
            <article className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#0b0f1b] md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:rounded-[36px]">
              {/* the warm light the device sits in */}
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 70% at ${web ? "72%" : "70%"} 55%, ${GLOWS[i % GLOWS.length]}, transparent 70%)` }} />
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence baseFrequency=%220.9%22/></filter><rect width=%22100%%22 height=%22100%%22 filter=%22url(%23n)%22/></svg>')]" />

              {/* the words */}
              <div className="relative z-10 px-6 pt-8 md:px-[clamp(32px,5vw,88px)] md:pt-0">
                <p className="t-label tabular-nums">
                  <span className="text-paper">{String(i + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")} · {it.title}
                </p>
                <MaskText as="h3" className="sc-title mt-4" text={it.headline ?? it.title} />
                <p className="t-lead mt-5 max-w-[34ch]">{it.line}</p>
                {it.tags && (
                  <ul className="mt-7 flex flex-wrap gap-2">
                    {it.tags.map((t) => (
                      <li key={t} className="rounded-full border border-paper/15 bg-white/[0.03] px-3.5 py-1.5 text-[13px] font-medium text-paper/85">{t}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* the device, working */}
              <div className="relative min-h-0 flex-1 md:h-full">
                <div className={`absolute ${web ? "inset-x-5 inset-y-6 md:inset-y-[12%] md:left-0 md:right-[6%]" : "inset-x-5 inset-y-5 md:inset-y-[7%]"}`}>
                  {web ? (
                    <Fit w={DASH_SIZE.w + 24} h={DASH_SIZE.h + 24}>
                      <div className="rounded-[22px] bg-[#0c0d12] p-3 shadow-[0_60px_120px_-40px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.08)]">
                        <div className="overflow-hidden rounded-[12px]" style={{ width: DASH_SIZE.w, height: DASH_SIZE.h }}>
                          <Dashboard interactive view={views[i]} />
                        </div>
                      </div>
                    </Fit>
                  ) : (
                    <Fit w={FRAME_SIZE.w} h={FRAME_SIZE.h}>
                      <PhoneFrame tone={i === 1 ? "graphite" : "titanium"}>
                        <PhoneApps interactive page={views[i]} />
                      </PhoneFrame>
                    </Fit>
                  )}
                </div>
              </div>
              <div aria-hidden className="sc-shade pointer-events-none absolute inset-0 z-20 bg-ink opacity-0" />
            </article>
          </div>
        </div>,
      ])}
    </section>
  );
}
