"use client";

import { useRef, useState } from "react";

/**
 * The studio's email, set large: the address opens your mail app (its underline draws in on hover),
 * and a small "Copy" beside it copies it.
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
      if (textRef.current && sel) {
        const r = document.createRange();
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
    <div className={`min-w-0 ${className}`}>
      <p className="t-label mb-3">Email</p>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <a href={`mailto:${email}`} className="email-link min-w-0 break-all text-[clamp(17px,1.3vw,19px)] leading-tight tracking-[-0.012em] text-paper">
          <span ref={textRef}>{email}</span>
        </a>
        <button type="button" onClick={copy} className="text-[13px] text-paper/55 underline decoration-paper/25 underline-offset-4 transition-colors hover:text-paper" aria-live="polite">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
