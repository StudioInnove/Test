"use client";

/*
 * Questions, told like a conversation. The section holds still while you scroll. Each question turns into
 * place on the same drum as "What we build" (the last one lifts away, out of focus), and then its answer
 * is read out word by word: the words light up as you scroll, at your pace, like the statement at the top
 * of the page. On a computer the questions are listed down the side; the one you're on is bright, and a
 * click takes you straight to it. Everything follows the scroll exactly (GSAP ScrollTrigger).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { content } from "@/lib/content";
import { EmailPill } from "./ui/EmailPill";
import { MaskText } from "./ui/MaskText";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function FaqDrum({ id, warm = 0.12 }: { id?: string; warm?: number }) {
  const { faq, studio } = content;
  const items = faq.items;
  const n = items.length;
  const ref = useRef<HTMLElement>(null);
  const qs = useRef<(HTMLDivElement | null)[]>([]);
  const as = useRef<(HTMLParagraphElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const words = useMemo(() => items.map((it) => it.a.split(/\s+/)), [items]);

  useIso(() => {
    const { gsap } = getGsap();
    const root = ref.current;
    if (!root) return;
    const state = { t: 0 };
    let last = -1;
    const apply = () => {
      // t runs 0..n: the whole part is the question, the fraction is how far its answer has been read
      const t = state.t;
      const pos = Math.min(n - 1, Math.max(0, t - 0.5 > 0 ? Math.floor(t) + Math.max(0, Math.min(1, (t - Math.floor(t) - 0.82) / 0.18)) : 0));
      qs.current.forEach((el, i) => {
        if (!el) return;
        const d = i - pos;
        const a = Math.min(1, Math.abs(d));
        el.style.transform = `translate3d(0, ${d * 90}%, 0) scale(${1 - a * 0.25})`;
        el.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 1.2));
        el.style.filter = a > 0.02 ? `blur(${a * 6}px)` : "none";
      });
      as.current.forEach((el, i) => {
        if (!el) return;
        const d = i - pos;
        el.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 1.6));
        el.style.transform = `translate3d(0, ${d * 24}px, 0)`;
        // the answer lights up word by word through the first part of its stretch
        const read = Math.max(0, Math.min(1, (t - i) / 0.72));
        const spans = el.children;
        const lit = read * spans.length;
        for (let k = 0; k < spans.length; k++) {
          const v = Math.max(0, Math.min(1, lit - k));
          (spans[k] as HTMLElement).style.opacity = String(0.16 + v * 0.84);
        }
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
        t: n,
        ease: "none",
        onUpdate: apply,
        scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.7 },
      });
    }, root);
    return () => ctx.revert();
  }, [n]);

  // a click on a question in the list takes you to it
  const go = (i: number) => {
    const root = ref.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const span = root.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * ((i + 0.75) / n), behavior: "smooth" });
  };

  return (
    <section ref={ref} id={id} className="relative" style={{ height: `${n * 70 + 50}svh` }} aria-label={faq.heading.replace(/\*/g, "")}>
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-[var(--gutter)] pb-[8svh] pt-[max(96px,12svh)]">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[85%]" style={{ background: `radial-gradient(80% 60% at 70% 0%, rgb(244 170 110 / ${warm}), transparent 75%)` }} />

        <div className="relative grid flex-1 gap-10 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-[6vw]">
          {/* the side: the heading, every question, and a way to ask your own */}
          <div className="flex flex-col">
            <MaskText className="t-title" text={faq.heading} />
            <ol className="mt-8 hidden flex-col gap-1 md:flex">
              {items.map((it, i) => (
                <li key={it.q}>
                  <button type="button" onClick={() => go(i)} className={`flex items-center gap-3 py-1.5 text-left text-[15px] transition-colors duration-500 ${i === active ? "text-paper" : "text-paper/40 hover:text-paper/75"}`}>
                    <span aria-hidden className={`h-px bg-paper transition-all duration-700 [transition-timing-function:var(--ease-out)] ${i === active ? "w-6 opacity-100" : "w-2 opacity-40"}`} />
                    {it.q}
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-auto hidden md:block">
              <p className="t-body max-w-[30ch]">{faq.line} {studio.replyPromise}</p>
              <div className="mt-5"><EmailPill email={studio.email} /></div>
            </div>
          </div>

          {/* the conversation */}
          <div className="relative flex flex-col justify-center">
            <div className="relative h-[2.4em] faq-q-size">
              {items.map((it, i) => (
                <div key={it.q} ref={(el) => { qs.current[i] = el; }} aria-hidden={i !== active} className="absolute inset-x-0 bottom-0 origin-bottom-left will-change-transform">
                  <h3 className="leading-[1.04]">{it.q}</h3>
                </div>
              ))}
            </div>
            <div className="relative mt-8 grid md:mt-10">
              {items.map((it, i) => (
                <p key={it.q} ref={(el) => { as.current[i] = el; }} aria-label={it.a} className="faq-a col-start-1 row-start-1 max-w-[40ch]" style={{ pointerEvents: i === active ? "auto" : "none" }}>
                  {words[i].map((w, k) => (
                    <span key={k} aria-hidden className="transition-opacity duration-200">{w}{" "}</span>
                  ))}
                </p>
              ))}
            </div>
            <div aria-hidden className="mt-10 flex gap-2 md:hidden">
              {items.map((it, i) => (
                <span key={it.q} className={`h-[2px] rounded-full transition-all duration-700 ${i === active ? "w-8 bg-paper" : "w-3 bg-paper/25"}`} />
              ))}
            </div>
          </div>
        </div>
        {/* phones: a way to ask your own, at the foot */}
        <div className="relative mt-6 md:hidden"><EmailPill email={studio.email} /></div>
      </div>
    </section>
  );
}
