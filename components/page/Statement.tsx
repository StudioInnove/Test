"use client";

/*
 * A large statement that lights up word by word as you scroll through it (after Mont-fort's big
 * statements and the 21st.dev "Reading Text Reveal"). Words in *asterisks* are set in the italic accent.
 */
import { useMemo, useRef } from "react";
import { useProgress } from "./useProgress";

export function Statement({ text }: { text: string }) {
  const ref = useRef<HTMLElement>(null);
  const p = useProgress(ref);
  const ws = useMemo(() => text.split(/\s+/).map((raw) => ({ t: raw.replace(/\*/g, ""), a: /^\*.*\*[.,!?—]?$/.test(raw) })), [text]);
  // the words light up across the middle of the scroll
  const lit = Math.max(0, Math.min(1, (p - 0.08) / 0.7)) * ws.length;
  return (
    <section ref={ref} className="relative" style={{ height: "200svh" }}>
      <div className="sticky top-0 flex h-[100svh] items-center px-[var(--gutter)]">
        <p className="t-display max-w-[20ch] !leading-[1.06]" aria-label={text.replace(/\*/g, "")}>
          {ws.map((w, i) => (
            <span key={i} aria-hidden className={`transition-colors duration-500 ${w.a ? "accent" : ""}`} style={{ color: i < lit ? "rgb(239 233 224)" : "rgb(239 233 224 / 0.16)" }}>
              {w.t}{i < ws.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
