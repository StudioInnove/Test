"use client";

/*
 * Questions as quiet rows. The open one lifts onto a soft pane of glass, its number warms to amber
 * and the plus turns into a cross. Opening one question closes the last.
 * After the 21st.dev "Accordion Active Background" (uiable), rebuilt in our palette.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { content } from "@/lib/content";

const ease = [0.23, 1, 0.32, 1] as const;

export function Faq({ items = content.faq.items }: { items?: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion() ?? false;
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <li key={it.q} className="rise relative" style={{ ["--d" as string]: `${200 + i * 80}ms` }}>
            {/* the pane of glass behind the open question */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  aria-hidden
                  layoutId="faq-pane"
                  className="faq-pane absolute inset-0 rounded-[20px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.5, ease }}
                />
              )}
            </AnimatePresence>
            <h3 className="relative">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group grid w-full grid-cols-[34px_1fr_28px] items-center gap-3 rounded-[20px] px-5 py-5 text-left outline-none focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-paper/70 sm:grid-cols-[48px_1fr_28px] sm:px-6 sm:py-6"
              >
                <span className={`text-[13px] tabular-nums transition-colors duration-500 ${isOpen ? "text-signal" : "text-paper/35"}`}>0{i + 1}</span>
                <span className={`text-[19px] leading-snug tracking-[-0.02em] transition-colors duration-300 sm:text-[22px] ${isOpen ? "text-paper" : "text-paper/75 group-hover:text-paper"}`}>{it.q}</span>
                <span
                  aria-hidden
                  className={`relative flex h-7 w-7 items-center justify-center justify-self-end rounded-full transition-[background-color,transform] duration-500 [transition-timing-function:var(--ease-out)] ${isOpen ? "rotate-45 bg-white/[0.09]" : "bg-white/[0.04] group-hover:bg-white/[0.08]"}`}
                >
                  <span className="absolute h-px w-2.5 bg-paper/80" />
                  <span className="absolute h-2.5 w-px bg-paper/80" />
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
                  transition={reduce ? { duration: 0 } : { height: { duration: 0.5, ease }, opacity: { duration: 0.35, delay: 0.08 } }}
                  className="relative overflow-hidden"
                >
                  <p className="t-body max-w-[54ch] pb-6 pl-[66px] pr-6 text-[16px] text-paper/65 sm:pl-[84px] sm:pr-16">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
