"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { content } from "@/lib/content";

/** Ruled question rows: index, question, a thin plus that turns to a minus. */
export function Faq({ items = content.faq.items }: { items?: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion();
  return (
    <ul className="border-t-[0.5px] border-white/20">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <li key={it.q} className="rise border-b-[0.5px] border-white/20" style={{ ["--d" as string]: `${200 + i * 90}ms` }}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group grid w-full grid-cols-[44px_1fr_20px] items-baseline gap-2 py-7 text-left outline-none focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-paper/70 sm:grid-cols-[72px_1fr_20px]"
              >
                <span className="index">0{i + 1}</span>
                <span className={`t-head transition-opacity duration-300 ${open !== null && !isOpen ? "opacity-45" : ""} group-hover:opacity-100`}>{it.q}</span>
                <span aria-hidden className="relative h-3 w-3 self-center justify-self-end">
                  <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-paper" />
                  <span className={`absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-paper transition-transform duration-500 [transition-timing-function:var(--ease-out)] ${isOpen ? "scale-y-0" : ""}`} />
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
                  transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="t-body muted max-w-[52ch] pb-8 pl-[52px] pr-8 sm:pl-[80px]">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
