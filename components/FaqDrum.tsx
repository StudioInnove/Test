"use client";

/*
 * Questions, kept short. The section holds still while you scroll; each question takes its turn. It arrives
 * the way every heading on the site does (a slow, soft surfacing from a light blur), its one-line answer
 * follows a moment later, and when you scroll on the pair fades away for the next. The moments are timed,
 * not scrubbed, so they always move at the site's calm pace however fast you scroll. GSAP ScrollTrigger
 * only decides which question is on. On a computer all the questions are listed down the side; a click
 * takes you to one. You can skip past them, and from the last one go back to the top.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { content } from "@/lib/content";
import { EmailPill } from "./ui/EmailPill";
import { Words } from "./Words";
import { HazeLayer } from "./page/Haze";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
type QA = { q: string; a: string };
const lenisTo = (y: number) => {
  const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(y, { duration: 1.6 });
  else window.scrollTo({ top: y, behavior: "smooth" });
};

/** Each page has its own questions; the home page has the general ones. */
export function FaqDrum({ id, warm = 0.12, set, haze = false }: { id?: string; warm?: number; set?: "web" | "mobile" | "sites"; haze?: boolean }) {
  const { faq, studio } = content;
  const items: QA[] = set ? (faq as unknown as Record<string, QA[]>)[set] : faq.items;
  const n = items.length;
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState(false);
  const plain = (q: string) => q.replace(/\*/g, "");

  useIso(() => {
    const { ScrollTrigger } = getGsap();
    const root = ref.current;
    if (!root) return;
    let last = 0;
    const seenAt = ScrollTrigger.create({ trigger: root, start: "top 60%", once: true, onEnter: () => setSeen(true) });
    const st = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => {
        // which question is on, with a little give so it never flickers between two
        const f = s.progress * n;
        const i = Math.min(n - 1, Math.floor(f));
        if (i !== last && Math.abs(f - (last + 0.5)) > 0.6) {
          last = i;
          setActive(i);
        }
      },
    });
    return () => {
      st.kill();
      seenAt.kill();
    };
  }, [n]);

  // the scroll position where question i is on
  const go = (i: number) => {
    const root = ref.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const span = root.offsetHeight - window.innerHeight;
    lenisTo(top + span * Math.min(1, (i + 0.4) / n));
  };
  const skip = () => {
    const root = ref.current;
    if (root) lenisTo(root.getBoundingClientRect().top + window.scrollY + root.offsetHeight);
  };
  // back to the top: on the home page the film flies back to its start
  const top = () => {
    if (document.querySelector("[data-scene]")) window.dispatchEvent(new CustomEvent("film:goto", { detail: 0 }));
    else lenisTo(0);
  };
  const lastOne = active === n - 1;

  return (
    <section ref={ref} id={id} className="relative" style={{ height: `${n * 70 + 60}svh` }} aria-label={faq.heading.replace(/\*/g, "")}>
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-[var(--gutter)] pb-[7svh] pt-[max(96px,12svh)]">
        {haze && <HazeLayer />}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[85%]" style={{ background: `radial-gradient(80% 60% at 70% 0%, rgb(244 170 110 / ${haze ? warm * 0.4 : warm}), transparent 75%)` }} />

        <div className="relative grid flex-1 gap-8 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:gap-[7vw]">
          {/* the side: the heading, every question, and a way to ask your own */}
          <div className={`reveal flex flex-col ${seen ? "on" : ""}`}>
            <h2 className="t-title"><Words text={faq.heading} /></h2>
            <ol className="mt-8 hidden flex-col gap-0.5 md:flex">
              {items.map((it, i) => (
                <li key={it.q}>
                  <button type="button" onClick={() => go(i)} className={`flex items-center gap-3 py-1.5 text-left text-[15px] transition-colors duration-700 ${i === active ? "text-paper" : "text-paper/40 hover:text-paper/75"}`}>
                    <span aria-hidden className={`h-px bg-paper transition-all duration-1000 [transition-timing-function:var(--ease-out)] ${i === active ? "w-6 opacity-100" : "w-2 opacity-40"}`} />
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

          {/* one question and its answer at a time, surfacing slowly */}
          <div className="relative grid items-center">
            {items.map((it, i) => (
              <div key={it.q} aria-hidden={i !== active} className={`reveal col-start-1 row-start-1 max-w-[720px] ${seen && i === active ? "on" : ""}`}>
                <h3 className="faq-q-size"><Words text={it.q} /></h3>
                <p className="rise faq-a mt-6 max-w-[36ch]" style={{ ["--d" as string]: "700ms" }}>{it.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* computers: past the questions, or from the last one back to the top */}
        <div className="absolute bottom-[7svh] right-[var(--gutter)] hidden md:block">
          <button type="button" onClick={lastOne ? top : skip} className="faq-skip">
            {lastOne ? "Back to the top" : "Skip the questions"}<span aria-hidden>{lastOne ? "↑" : "↓"}</span>
          </button>
        </div>
        {/* phones: where you are, and the same way past or back */}
        <div className="relative mt-6 flex items-center justify-between gap-4 md:hidden">
          <div aria-hidden className="flex gap-2">
            {items.map((it, i) => (
              <span key={it.q} className={`h-[2px] rounded-full transition-all duration-1000 ${i === active ? "w-8 bg-paper" : "w-3 bg-paper/25"}`} />
            ))}
          </div>
          <button type="button" onClick={lastOne ? top : skip} className="faq-skip">{lastOne ? "Top" : "Skip"}<span aria-hidden>{lastOne ? "↑" : "↓"}</span></button>
        </div>
        <div className="relative mt-4 md:hidden"><EmailPill email={studio.email} /></div>
      </div>
    </section>
  );
}
