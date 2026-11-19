"use client";

/*
 * What we build, as a typographic index (the way studios like Off+Brand and Rejouice list their work):
 * three very large lines in the light display type, each with a few words in the italic serif, divided by
 * hairlines. On a computer, resting on a line brings up a photograph of that kind of app in use; it trails
 * the cursor a little behind, like a print held up to the light. On a phone, each photograph opens inline
 * from a thin slit as it scrolls into view, and drifts slightly slower than the page.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { asset } from "@/lib/content";
import { InView } from "../InView";

type Item = { title: string; phrase: string; line: string; image: string };

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ServiceIndex({ kicker, items }: { kicker: string; items: Item[] }) {
  const ref = useRef<HTMLElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  // the floating photograph follows the cursor, a little behind it
  useIso(() => {
    if (!fine) return;
    const { gsap } = getGsap();
    const root = ref.current, fl = floatRef.current;
    if (!root || !fl) return;
    const qx = gsap.quickTo(fl, "x", { duration: 0.9, ease: "power3" });
    const qy = gsap.quickTo(fl, "y", { duration: 0.9, ease: "power3" });
    const qr = gsap.quickTo(fl, "rotation", { duration: 1.2, ease: "power3" });
    let lx = 0;
    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      qx(x - fl.offsetWidth / 2);
      qy(y - fl.offsetHeight / 2);
      // it leans a touch into the direction you move
      qr(Math.max(-3, Math.min(3, (e.clientX - lx) * 0.15)));
      lx = e.clientX;
    };
    root.addEventListener("pointermove", move);
    return () => root.removeEventListener("pointermove", move);
  }, [fine]);

  // phones: each photograph opens from a slit, then drifts as you scroll
  useIso(() => {
    if (fine) return;
    const { gsap } = getGsap();
    const root = ref.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".si-photo", root).forEach((el) => {
        const img = el.querySelector("img");
        gsap.fromTo(el, { clipPath: "inset(48% 0% 48% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
        if (img) gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, [fine]);

  return (
    <section ref={ref} className="relative px-[var(--gutter)] py-28 md:py-40" onPointerLeave={() => setHover(null)}>
      <InView threshold={0.05}>
      <p className="rise kicker">{kicker}</p>
      <ul className="mt-8 border-t border-paper/12 md:mt-12">
        {items.map((it, i) => {
          const dim = hover !== null && hover !== i;
          return (
            <li key={it.title} className="rise border-b border-paper/12" style={{ ["--d" as string]: `${150 + i * 180}ms` }} onPointerEnter={() => fine && setHover(i)}>
              <div className="grid gap-6 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:items-end md:gap-10 md:py-12">
                <h3 className="si-title transition-opacity duration-700" style={{ opacity: dim ? 0.22 : 1 }}>
                  {it.title} <span className="si-phrase">{it.phrase}</span>
                </h3>
                <p className="t-body max-w-[32ch] pb-2 transition-opacity duration-700 md:justify-self-end" style={{ opacity: dim ? 0.3 : 1 }}>{it.line}</p>
              </div>
              {/* phones: the photograph sits under its line */}
              {!fine && (
                <div className="si-photo relative mb-10 aspect-[4/5] w-[78%] overflow-hidden rounded-[6px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(it.image)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      </InView>

      {/* computers: one photograph, following the cursor; the picture changes with the line you rest on */}
      {fine && (
        <div ref={floatRef} aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 w-[min(23vw,360px)]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] transition-[opacity,transform] duration-700 [transition-timing-function:var(--ease-out)]" style={{ opacity: hover === null ? 0 : 1, transform: hover === null ? "scale(0.86)" : "scale(1)" }}>
            {items.map((it, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={it.image + i}
                src={asset(it.image)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  clipPath: hover === i ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
                  transform: hover === i ? "scale(1)" : "scale(1.15)",
                  transition: "clip-path 900ms cubic-bezier(0.77,0,0.175,1), transform 1400ms cubic-bezier(0.22,0.61,0.36,1)",
                  zIndex: hover === i ? 2 : 1,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
