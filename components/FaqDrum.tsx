"use client";

/*
 * Questions, as a conversation with the studio. The section holds still while you scroll. Under a small
 * italic "You ask", a question surfaces the way every heading on the site does, word by word, rising a
 * little out of the dark; then "We answer" appears and the reply comes up slowly, at your pace. Scroll on
 * and the pair lifts gently away for the next. Everything is scrubbed by GSAP ScrollTrigger with a soft
 * lag. On a computer all the questions are listed down the side: the one you're on is bright, and a click
 * takes you straight to it. Anyone who'd rather not read them all can skip straight past.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { content } from "@/lib/content";
import { EmailPill } from "./ui/EmailPill";
import { Words } from "./Words";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - x, 3);

type QA = { q: string; a: string };

/** Each page has its own questions; the home page has the general ones. */
export function FaqDrum({ id, warm = 0.12, set }: { id?: string; warm?: number; set?: "web" | "mobile" | "sites" }) {
  const { faq, studio } = content;
  const items: QA[] = set ? (faq as unknown as Record<string, QA[]>)[set] : faq.items;
  const n = items.length;
  const ref = useRef<HTMLElement>(null);
  const pairs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const split = useMemo(
    () => items.map((it) => ({ q: it.q.split(/\s+/).map((w) => ({ t: w.replace(/\*/g, ""), a: /^\*.*\*[.,!?]?$/.test(w) })), a: it.a.split(/\s+/) })),
    [items],
  );
  const plain = (q: string) => q.replace(/\*/g, "");

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
        const leave = lastOne ? 0 : ease(clamp((local - 0.84) / 0.16));
        const show = i === 0 ? 1 : clamp(local * 8);
        el.style.opacity = String(local < 0 && i > 0 ? 0 : show * (1 - leave));
        el.style.transform = `translate3d(0, ${-leave * 48}px, 0)`;
        el.style.visibility = local < -0.05 || leave >= 1 ? "hidden" : "visible";
        // "You ask", then the question surfaces word by word, a soft front moving through it
        const ask = el.querySelector<HTMLElement>("[data-ask]");
        if (ask) ask.style.opacity = String(i === 0 ? 1 : ease(clamp(local / 0.06)));
        const qs = el.querySelectorAll<HTMLElement>("[data-q]");
        const qf = clamp(local / 0.26) * (qs.length + 2.5);
        qs.forEach((w, k) => {
          const v = ease(clamp((qf - k) / 2.5));
          w.style.opacity = String(v);
          w.style.transform = `translate3d(0, ${(1 - v) * 0.32}em, 0)`;
        });
        // then "We answer", and the reply, slowly
        const lab = el.querySelector<HTMLElement>("[data-we]");
        if (lab) lab.style.opacity = String(ease(clamp((local - 0.3) / 0.08)));
        const ws = el.querySelectorAll<HTMLElement>("[data-w]");
        const af = clamp((local - 0.34) / 0.46) * (ws.length + 4);
        ws.forEach((w, k) => {
          const v = ease(clamp((af - k) / 4));
          w.style.opacity = String(0.08 + v * 0.92);
          w.style.transform = `translate3d(0, ${(1 - v) * 0.22}em, 0)`;
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
      gsap.to(state, { t: n - 0.1, ease: "none", onUpdate: apply, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 1.4 } });
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

  // past the questions altogether
  const skip = () => {
    const root = ref.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + window.scrollY + root.offsetHeight;
    const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o?: object) => void } }).__lenis;
    if (lenis) lenis.scrollTo(top, { duration: 1.6 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section ref={ref} id={id} className="relative" style={{ height: `${n * 95 + 40}svh` }} aria-label={faq.heading.replace(/\*/g, "")}>
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
                    {plain(it.q)}
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
                <p data-ask className="kicker flex items-baseline gap-4">You ask<span className="text-[0.8em] text-paper/40">{i + 1} of {n}</span></p>
                <h3 className="faq-q-size relative mt-3" aria-label={plain(items[i].q)}>
                  {s.q.map((w, k) => (
                    <span key={k} data-q aria-hidden className={`inline-block ${w.a ? "accent" : ""}`} style={{ opacity: 0 }}>{w.t}{k < s.q.length - 1 ? "\u00a0" : ""}</span>
                  ))}
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
        {/* computers: past the questions, at the other side from the list */}
        <button type="button" onClick={skip} className="faq-skip absolute bottom-[7svh] right-[var(--gutter)] hidden md:inline-flex">Skip the questions<span aria-hidden>↓</span></button>
        {/* phones: where you are, and a way to ask your own */}
        <div className="relative mt-6 flex items-center justify-between gap-4 md:hidden">
          <div aria-hidden className="flex gap-2">
            {items.map((it, i) => (
              <span key={it.q} className={`h-[2px] rounded-full transition-all duration-700 ${i === active ? "w-8 bg-paper" : "w-3 bg-paper/25"}`} />
            ))}
          </div>
          <button type="button" onClick={skip} className="faq-skip">Skip<span aria-hidden>↓</span></button>
        </div>
        <div className="relative mt-4 md:hidden"><EmailPill email={studio.email} /></div>
      </div>
    </section>
  );
}
