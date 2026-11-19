"use client";

/*
 * Live clocks for five cities. The one closest to the visitor's own time glows softly.
 */
import { useEffect, useState } from "react";

export const CITIES = [
  { name: "New York", tz: "America/New_York" },
  { name: "London", tz: "Europe/London" },
  { name: "Dubai", tz: "Asia/Dubai" },
  { name: "Singapore", tz: "Asia/Singapore" },
  { name: "Tokyo", tz: "Asia/Tokyo" },
];

/** Minutes east of UTC for a time zone, right now. */
function offsetOf(tz: string, now: Date) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(now);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
    return Math.round((asUTC - now.getTime()) / 60000);
  } catch {
    return 0;
  }
}

export function nearestCity(now = new Date()) {
  const mine = -now.getTimezoneOffset();
  let best = 0, gap = Infinity;
  CITIES.forEach((c, i) => {
    let d = Math.abs(offsetOf(c.tz, now) - mine);
    d = Math.min(d, 1440 - d);
    if (d < gap) { gap = d; best = i; }
  });
  return best;
}

export function WorldClocks({ size = "md", className = "" }: { size?: "md" | "lg"; className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const here = now ? nearestCity(now) : -1;
  const fmt = (tz: string) => (now ? new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(now) : "--:--");
  const blink = now ? now.getSeconds() % 2 === 0 : true;
  return (
    <ul className={`clocks grid grid-cols-5 gap-x-4 gap-y-3 max-sm:grid-cols-3 ${className}`}>
      {CITIES.map((c, i) => (
        <li key={c.name} className={`transition-colors duration-700 ${i === here ? "text-paper" : "text-paper/45"}`}>
          <span className={`block tabular-nums tracking-[-0.02em] ${size === "lg" ? "text-[clamp(26px,2.6vw,36px)] font-[320]" : "text-[20px] font-[340]"}`}>
            {fmt(c.tz).slice(0, 2)}
            <span style={{ opacity: blink ? 1 : 0.35 }} className="transition-opacity duration-300">:</span>
            {fmt(c.tz).slice(3)}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[13px]">
            {i === here && <i aria-hidden className="mark !h-[5px] !w-[5px] shadow-[0_0_8px_2px_rgb(232_161_90/0.6)]" />}
            {c.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
