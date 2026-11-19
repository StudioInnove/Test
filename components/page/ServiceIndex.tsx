"use client";

/*
 * What we build, told one at a time. The section holds still while you scroll, and the three lines turn
 * past a reading line like the drum of a rolodex: the one you are on is sharp and bright; the last one
 * lifts away, smaller and out of focus, as the next one rises into place. Beside it, its photograph is uncovered
 * from the bottom as you arrive, and settles. Everything follows the scroll exactly (GSAP ScrollTrigger),
 * so it reads at your pace, on a computer and a phone alike.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { asset } from "@/lib/content";

type Item = { title: string; phrase: string; line: string; image: string };

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ServiceIndex({ kicker, items }: { kicker: string; items: Item[] }) {
  const ref = useRef<HTMLElement>(null);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const photos = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const n = items.length;

  useIso(() => {
    const { gsap } = getGsap();
    const root = ref.current;
    if (!root) return;
    const state = { pos: 0 };
    let last = 0;
    const apply = () => {
      const pos = state.pos;
      rows.current.forEach((el, i) => {
        if (!el) return;
        const d = i - pos;
        const a = Math.min(1, Math.abs(d));
        el.style.transform = `translate3d(0, ${d * 92}%, 0) scale(${1 - a * 0.3})`;
        el.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 1.15));
        el.style.filter = a > 0.02 ? `blur(${a * 5}px)` : "none";
      });
      photos.current.forEach((el, i) => {
        if (!el) return;
        // each photograph is uncovered from the bottom as you arrive at its line
        const r = i === 0 ? 1 : Math.min(1, Math.max(0, pos - (i - 1)));
        const e = r * r * (3 - 2 * r);
        el.style.clipPath = `inset(${(1 - e) * 100}% 0% 0% 0%)`;
        const img = el.firstElementChild as HTMLElement | null;
        if (img) img.style.transform = `scale(${1.18 - e * 0.18})`;
      });
      const near = Math.round(pos);
      if (near !== last) {
        last = near;
        setActive(near);
      }
    };
    apply();
    const ctx = gsap.context(() => {
      gsap.to(state, {
        pos: n - 1,
        ease: "none",
        onUpdate: apply,
        scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.8 },
      });
    }, root);
    return () => ctx.revert();
  }, [n]);

  return (
    <section ref={ref} className="relative" style={{ height: `${n * 85 + 40}svh` }} aria-label={kicker}>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center gap-8 overflow-hidden px-[var(--gutter)] md:grid md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-center md:gap-[6vw]">
        {/* the words */}
        <div className="relative max-md:pt-16">
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
                className="t-lead col-start-1 row-start-1 max-w-[34ch] transition-[opacity,transform,filter] duration-[900ms] [transition-timing-function:var(--ease-out)]"
                style={{ opacity: i === active ? 1 : 0, transform: i === active ? "none" : "translateY(10px)", filter: i === active ? "none" : "blur(6px)" }}
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

        {/* the photographs, one uncovering the next */}
        <div className="relative mx-auto aspect-[4/5] w-[min(52vw,300px)] overflow-hidden rounded-[6px] md:mx-0 md:w-full md:max-w-[440px] md:justify-self-end">
          {items.map((it, i) => (
            <div key={it.image + i} ref={(el) => { photos.current[i] = el; }} className="absolute inset-0 overflow-hidden" style={{ zIndex: i + 1, clipPath: i === 0 ? "none" : "inset(100% 0% 0% 0%)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(it.image)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover will-change-transform" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
