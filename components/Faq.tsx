"use client";

/*
 * Questions on fine rules, set large like an editorial index.
 * The open question stays bright, the others step back; a thin plus turns into a minus. A finer line
 * draws itself under the question you are on, and an answer settles in from a soft blur.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { content } from "@/lib/content";

const ease = [0.23, 1, 0.32, 1] as const;

export function Faq({ items = content.faq.items }: { items?: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion() ?? false;
  return (
    <ul className="border-t border-paper/15">
      {items.map((it, i) => {
        const isOpen = open === i;
        const dim = open !== null && !isOpen;
        return (
          <li key={it.q} className="faq-row rise relative border-b border-paper/15" data-open={isOpen || undefined} style={{ ["--d" as string]: `${200 + i * 70}ms` }}>
            <span aria-hidden className="faq-line" />
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center justify-between gap-6 py-6 text-left outline-none focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-paper/70 md:py-7"
              >
                <span className={`faq-q t-head font-normal transition-[color,transform] duration-700 [transition-timing-function:var(--ease-out)] ${dim ? "text-paper/45 group-hover:text-paper/80" : "text-paper"}`}>{it.q}</span>
                <span aria-hidden className="relative h-3.5 w-3.5 shrink-0">
                  <span className="absolute left-0 top-1/2 h-px w-3.5 -translate-y-1/2 bg-paper/80" />
                  <span className={`absolute left-1/2 top-0 h-3.5 w-px -translate-x-1/2 bg-paper/80 transition-transform duration-500 [transition-timing-function:var(--ease-out)] ${isOpen ? "scale-y-0" : ""}`} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-${i}`}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { height: { duration: 0.55, ease }, opacity: { duration: 0.4, delay: 0.1 } }}
                  className="overflow-hidden"
                >
                  <motion.p
                    className="t-body max-w-[56ch] pb-8 pr-10"
                    initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.1, ease, delay: 0.12 }}
                  >
                    {it.a}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
