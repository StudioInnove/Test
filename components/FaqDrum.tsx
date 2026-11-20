"use client";

/*
 * Questions, as a conversation with the studio. The section holds still while you scroll. Under a small
 * italic "You ask", a question types itself out letter by letter, with a fine caret; then "We answer"
 * appears and the reply comes up word by word, at your pace. Scroll on and the pair lifts away for the
 * next. Everything is scrubbed by GSAP ScrollTrigger. On a computer all the questions are listed down the
 * side: the one you're on is bright, and a click takes you straight to it.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { content } from "@/lib/content";
import { EmailPill } from "./ui/EmailPill";
import { Words } from "./Words";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
const clamp = (x: number) => Math.max(0, Math.min(1, x));

export function FaqDrum({ id, warm = 0.12 }: { id?: string; warm?: number }) {
  const { faq, studio } = content;
  const items = faq.items;
  const n = items.length;
  const ref = useRef<HTMLElement>(null);
  const pairs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const split = useMemo(() => items.map((it) => ({ q: Array.from(it.q), a: it.a.split(/\s+/) })), [items]);

  useIso(() => {
    const { gsap } = getGsap();
    const root = ref.current;
    if (!root) return;
    const state = { t: 0 };
    let last = -1;
    const apply = () => {
      const t = state.t;
      pairs.current.forEach((el, i) => {
        if (!el) return;
        const local = t - i;
        const lastOne = i === n - 1;
        // on stage from its start until it lifts away near the end of its stretch
        const leave = lastOne ? 0 : clamp((local - 0.86) / 0.14);
        const show = i === 0 ? 1 : clamp(local * 12);
        el.style.opacity = String(local < 0 && i > 0 ? 0 : show * (1 - leave));
        el.style.transform = `translate3d(0, ${-leave * 40}px, 0)`;
        el.style.visibility = local < -0.05 || leave >= 1 ? "hidden" : "visible";
        // the question types itself out
        const qs = el.querySelectorAll<HTMLElement>("[data-c]");
        const typed = clamp(local / 0.28) * qs.length;
        qs.forEach((c, k) => (c.style.opacity = k < typed ? "1" : "0"));
        const caret = el.querySelector<HTMLElement>("[data-caret]");
        if (caret) {
          const pos = Math.min(qs.length - 1, Math.floor(typed));
          const ch = qs[Math.max(0, pos)];
          caret.style.opacity = typed > 0 && typed < qs.length ? "1" : "0";
          if (ch) caret.style.transform = `translate3d(${ch.offsetLeft + (typed >= 1 ? ch.offsetWidth : 0)}px, ${ch.offsetTop}px, 0)`;
        }
        // then the reply
        const lab = el.querySelector<HTMLElement>("[data-we]");
        if (lab) lab.style.opacity = String(clamp((local - 0.3) / 0.06));
        const ws = el.querySelectorAll<HTMLElement>("[data-w]");
        const lit = clamp((local - 0.34) / 0.44) * ws.length;
        ws.forEach((w, k) => {
          const v = clamp(lit - k);
          w.style.opacity = String(0.1 + v * 0.9);
          w.style.transform = `translate3d(0, ${(1 - v) * 0.25}em, 0)`;
        });
      });
      const now = Math.min(n - 1, Math.floor(t));
      if (now !== last) {
        last = now;
        setActive(now);
      }
    };
    apply();
    const ctx = gsap.context(() => {
      gsap.to(state, { t: n - 0.1, ease: "none", onUpdate: apply, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.6 } });
    }, root);
    return () => ctx.revert();
  }, [n]);

  // a click on a question in the list takes you to it (once its answer has been read out)
  const go = (i: number) => {
    const root = ref.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const span = root.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * Math.min(1, (i + 0.8) / (n - 0.1)), behavior: "smooth" });
  };

  return (
    <section ref={ref} id={id} className="relative" style={{ height: `${n * 85 + 40}svh` }} aria-label={faq.heading.replace(/\*/g, "")}>
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-[var(--gutter)] pb-[7svh] pt-[max(96px,12svh)]">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[85%]" style={{ background: `radial-gradient(80% 60% at 70% 0%, rgb(244 170 110 / ${warm}), transparent 75%)` }} />

        <div className="relative grid flex-1 gap-8 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:gap-[7vw]">
          {/* the side: the heading, every question, and a way to ask your own */}
          <div className="flex flex-col">
            <h2 className="t-title"><Words text={faq.heading} /></h2>
            <ol className="mt-8 hidden flex-col gap-0.5 md:flex">
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

          {/* the conversation: one question and its answer at a time */}
          <div className="relative grid items-center">
            {split.map((s, i) => (
              <div key={items[i].q} ref={(el) => { pairs.current[i] = el; }} aria-hidden={i !== active} className="col-start-1 row-start-1 max-w-[720px] will-change-transform" style={{ opacity: i === 0 ? 1 : 0 }}>
                <p className="kicker">You ask</p>
                <h3 className="faq-q-size relative mt-3" aria-label={items[i].q}>
                  {s.q.map((c, k) => (
                    <span key={k} data-c aria-hidden style={{ opacity: 0 }}>{c}</span>
                  ))}
                  <span data-caret aria-hidden className="absolute left-0 top-0 h-[1.05em] w-[2px] bg-paper/80" style={{ opacity: 0 }} />
                </h3>
                <p data-we className="kicker mt-10" style={{ opacity: 0 }}>We answer</p>
                <p className="faq-a mt-3 max-w-[40ch]" aria-label={items[i].a}>
                  {s.a.map((w, k) => (
                    <span key={k} data-w aria-hidden className="inline-block" style={{ opacity: 0.1 }}>{w}&nbsp;</span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>
        {/* phones: where you are, and a way to ask your own */}
        <div className="relative mt-6 flex items-center justify-between gap-4 md:hidden">
          <div aria-hidden className="flex gap-2">
            {items.map((it, i) => (
              <span key={it.q} className={`h-[2px] rounded-full transition-all duration-700 ${i === active ? "w-8 bg-paper" : "w-3 bg-paper/25"}`} />
            ))}
          </div>
        </div>
        <div className="relative mt-4 md:hidden"><EmailPill email={studio.email} /></div>
      </div>
    </section>
  );
}
