"use client";

/*
 * Questions on fine rules, set large like an editorial index.
 * The open question stays bright, the others step back; a thin plus turns into a minus.
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
          <li key={it.q} className="rise border-b border-paper/15" style={{ ["--d" as string]: `${200 + i * 70}ms` }}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center justify-between gap-6 py-6 text-left outline-none focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-paper/70 md:py-7"
              >
                <span className={`text-[clamp(20px,2.2vw,28px)] leading-[1.2] tracking-[-0.025em] transition-colors duration-500 ${dim ? "text-paper/40 group-hover:text-paper/80" : "text-paper"}`}>{it.q}</span>
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
                  <p className="max-w-[56ch] pb-8 pr-10 text-[17px] leading-[1.55] tracking-[-0.01em] text-paper/65">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
