"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { content } from "@/lib/content";

/** FAQ accordion: one open at a time, spring reveal, plus that turns into a cross. */
export function Faq({ items = content.faq.items }: { items?: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();
  return (
    <ul className="divide-y divide-white/10 border-y border-white/10">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <li key={it.q}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center justify-between gap-6 py-6 text-left outline-none focus-visible:text-amber"
              >
                <span className="text-[19px] font-medium tracking-[-0.01em] text-paper sm:text-[21px]">{it.q}</span>
                <span
                  aria-hidden
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 transition-[background-color,transform] duration-300 [transition-timing-function:var(--ease-out)] ${isOpen ? "rotate-45 bg-amber/15 ring-amber/50" : "ring-white/15 group-hover:bg-white/5"}`}
                >
                  <span className={`absolute h-[1.5px] w-3.5 rounded ${isOpen ? "bg-amber" : "bg-paper"}`} />
                  <span className={`absolute h-3.5 w-[1.5px] rounded ${isOpen ? "bg-amber" : "bg-paper"}`} />
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
                  transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.45, bounce: 0 }}
                  className="overflow-hidden"
                >
                  <p className="max-w-[60ch] pb-7 pr-12 text-[16.5px] leading-relaxed text-paper/70">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
