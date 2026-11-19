"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

/**
 * The studio's email as one glass pill: the address opens your mail app, and the end of the pill
 * copies it — the label turns into a drawn tick for a moment.
 */
export function EmailPill({ email, className = "" }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const timer = useRef(0);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // clipboard refused (some embedded views): select the address so it can be copied by hand
      const sel = window.getSelection();
      const r = document.createRange();
      if (textRef.current && sel) {
        r.selectNodeContents(textRef.current);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`glass email-pill inline-flex h-12 max-w-full items-center rounded-full p-1 ${className}`}>
      <a href={`mailto:${email}`} className="group flex min-w-0 items-center gap-3 rounded-full pl-4 pr-3 text-[15px] tracking-[-0.01em] text-paper/90 transition-colors hover:text-paper">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0 text-paper/55 transition-colors group-hover:text-signal">
          <rect x="1.5" y="3.5" width="13" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M2.5 4.8 8 9l5.5-4.2" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
        <span ref={textRef} className="truncate">{email}</span>
      </a>
      <span aria-hidden className="h-5 w-px shrink-0 bg-white/12" />
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Email copied" : "Copy email"}
        className="relative flex h-full w-[76px] shrink-0 items-center justify-center rounded-full text-[13px] text-paper/70 transition-colors hover:bg-white/[0.06] hover:text-paper active:scale-[0.97]"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span key="ok" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="flex items-center gap-1.5 text-signal">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <motion.path d="M2.5 6.3l2.2 2.2L9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} />
              </svg>
              Copied
            </motion.span>
          ) : (
            <motion.span key="copy" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              Copy
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
