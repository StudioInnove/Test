"use client";

import { useState, type FormEvent } from "react";
import { content } from "@/lib/content";

/** Five stages in a row; the current one is lit, the rest wait. */
export function StatusTrack() {
  const { stages, current, statusLabel } = content.originals;
  return (
    <div>
      <p className="index mb-3">{statusLabel}</p>
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label={`${statusLabel}: ${stages[current]}`}>
        {stages.map((s, i) => (
          <li key={s} aria-current={i === current ? "step" : undefined} className={`t-small flex items-center gap-2 ${i === current ? "text-paper" : i < current ? "text-paper/55" : "text-paper/30"}`}>
            {i === current && <span className="mark animate-[pulse_2.4s_ease-in-out_infinite]" />}
            {s}
          </li>
        ))}
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
    return <p role="status" className="t-body flex h-9 items-center gap-2.5"><span className="mark" />{o.success}</p>;
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex gap-1.5">
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
          className="field min-w-0 flex-1"
        />
        <button type="submit" disabled={state === "sending"} className="btn btn-primary disabled:opacity-60">
          {state === "sending" ? "Joining…" : o.cta}
        </button>
      </div>
      <p className={`t-small mt-3 ${state === "error" ? "text-signal" : "text-paper/40"}`} role={state === "error" ? "alert" : undefined}>
        {state === "error" ? o.error : o.privacy}
      </p>
    </form>
  );
}
