"use client";

import { useState, type FormEvent } from "react";
import { content } from "@/lib/content";

export function StatusTrack({ compact = false }: { compact?: boolean }) {
  const { stages, current, statusLabel } = content.originals;
  return (
    <div>
      <p className="eyebrow mb-3">{statusLabel}</p>
      <ol className="relative flex items-center justify-between gap-1" aria-label={`${statusLabel}: ${stages[current]}`}>
        <span aria-hidden className="absolute inset-x-2 top-[7px] h-px bg-white/15" />
        <span
          aria-hidden
          className="absolute left-2 top-[7px] h-px bg-gradient-to-r from-amber/30 to-amber"
          style={{ width: `calc(${(current / (stages.length - 1)) * 100}% - 16px)` }}
        />
        {stages.map((s, i) => {
          const done = i < current, now = i === current;
          return (
            <li key={s} className="relative z-10 flex flex-col items-center gap-2" aria-current={now ? "step" : undefined}>
              <span className="relative flex h-[15px] w-[15px] items-center justify-center">
                {now && <span className="absolute inset-0 animate-ping rounded-full bg-amber/50 [animation-duration:2.4s]" />}
                <span
                  className={`h-[9px] w-[9px] rounded-full ${now ? "bg-amber shadow-[0_0_14px_3px_rgb(232_161_90/0.6)]" : done ? "bg-amber/60" : "bg-white/20 ring-1 ring-white/25"}`}
                />
              </span>
              <span className={`${compact ? "text-[11px]" : "text-[12px]"} font-medium tracking-wide ${now ? "text-amber" : done ? "text-paper/70" : "text-paper/40"}`}>{s}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function WaitlistForm({ source = "home" }: { source?: string }) {
  const o = content.originals;
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [email, setEmail] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("sending");
    try {
      const r = await fetch(content.studio.waitlistEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, list: "Studio Originals waitlist", source }),
      });
      setState(r.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="flex h-[52px] items-center gap-3 text-[15px] text-paper">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber text-ink">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2.5 6.2 5 8.5 9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        {o.success}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label className="sr-only" htmlFor={`wl-${source}`}>{o.placeholder}</label>
        <input
          id={`wl-${source}`}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={o.placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field w-full min-w-0 sm:flex-1"
        />
        <button type="submit" disabled={state === "sending"} className="btn btn-amber disabled:opacity-70">
          {state === "sending" ? "Joining…" : o.cta}
        </button>
      </div>
      <p className={`mt-3 text-[12.5px] ${state === "error" ? "text-amber" : "text-paper/55"}`} role={state === "error" ? "alert" : undefined}>
        {state === "error" ? o.error : o.privacy}
      </p>
    </form>
  );
}

export function BuildLog() {
  const o = content.originals;
  return (
    <div>
      <p className="eyebrow mb-3">{o.logHeading}</p>
      <ul className="space-y-2">
        {o.log.map((l, i) => (
          <li key={i} className="flex gap-4 text-[13.5px]">
            <span className="w-16 shrink-0 tabular-nums text-paper/45">{l.date}</span>
            <span className="text-paper/80">{l.entry}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
