"use client";

/*
 * The phone in the studio: three small example apps you can swipe between.
 *   Tonight  — an events app in the spirit of Luma: big colourful covers, one tap to say you're going.
 *   Table    — book a table: pick a day and a time, done.
 *   Lights   — a tiny game: catch the city lights before they fade.
 * In the room it rests on the first app and now and then a notification lights it up; up close it's yours to use.
 */
import { useEffect, useRef, useState } from "react";

const W = 390, H = 844;
const ink = "#231d1a";

const EVENTS = [
  { t: "Rooftop listening session", w: "Tonight · 21:00", p: "The Glasshouse", g: "linear-gradient(135deg,#f9c58d 0%,#f08a7e 55%,#b86fb0 100%)", n: 48 },
  { t: "Founders' late breakfast", w: "Sat · 10:30", p: "Atelier Café", g: "linear-gradient(135deg,#bfe6d7 0%,#8fb8ea 60%,#7f86d8 100%)", n: 21 },
  { t: "Night market walk", w: "Sun · 19:00", p: "Riverside", g: "linear-gradient(135deg,#ffe29a 0%,#f7a76c 50%,#e4685f 100%)", n: 112 },
];

function Tonight({ live }: { live: boolean }) {
  const [going, setGoing] = useState<Record<number, boolean>>({});
  return (
    <div className="flex h-full flex-col px-5 pt-16">
      <div className="flex items-center justify-between">
        <p className="text-[30px] font-[600] tracking-[-0.03em]">Tonight</p>
        <span className="rounded-full bg-black/[0.06] px-3 py-1.5 text-[13px]">Worldwide</span>
      </div>
      <p className="mt-1 text-[14px] text-black/45">Things worth leaving the house for</p>
      <div className="mt-5 flex flex-col gap-4">
        {EVENTS.map((e, i) => (
          <div key={e.t} className="overflow-hidden rounded-[22px] bg-white shadow-[0_6px_20px_rgb(80_50_30/0.08)]">
            <div className="relative h-[118px]" style={{ background: e.g }}>
              <div className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/25 blur-[2px]" />
              <div className="absolute bottom-3 left-4 h-10 w-10 rounded-full border-2 border-white/70 bg-white/30" />
            </div>
            <div className="flex items-end justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-[12px] text-black/45">{e.w}</p>
                <p className="truncate text-[17px] font-[600] tracking-[-0.02em]">{e.t}</p>
                <p className="text-[13px] text-black/45">{e.p} · {e.n + (going[i] ? 1 : 0)} going</p>
              </div>
              <button
                type="button"
                tabIndex={live ? 0 : -1}
                onClick={() => setGoing((g) => ({ ...g, [i]: !g[i] }))}
                className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-[500] transition-colors duration-300 ${going[i] ? "bg-[#231d1a] text-white" : "bg-black/[0.06]"}`}
              >
                {going[i] ? "Going ✓" : "Join"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Table({ live }: { live: boolean }) {
  const days = ["Thu", "Fri", "Sat", "Sun", "Mon"];
  const times = ["18:00", "18:30", "19:15", "20:00", "20:45", "21:30"];
  const [d, setD] = useState(1);
  const [t, setT] = useState<number | null>(2);
  const [booked, setBooked] = useState(false);
  return (
    <div className="flex h-full flex-col px-5 pt-16">
      <p className="text-[14px] text-black/45">Maison Ora</p>
      <p className="text-[30px] font-[600] tracking-[-0.03em]">Book a table</p>
      <div className="mt-5 h-[150px] rounded-[22px]" style={{ background: "linear-gradient(140deg,#f6d2a8,#e99a7c 60%,#9a6a8a)" }} />
      <p className="mt-6 text-[13px] text-black/45">Day</p>
      <div className="mt-2 flex gap-2">
        {days.map((x, i) => (
          <button key={x} type="button" tabIndex={live ? 0 : -1} onClick={() => { setD(i); setBooked(false); }} className={`flex-1 rounded-2xl py-3 text-[14px] transition-colors duration-300 ${d === i ? "bg-[#231d1a] text-white" : "bg-black/[0.05]"}`}>
            {x}
          </button>
        ))}
      </div>
      <p className="mt-5 text-[13px] text-black/45">Time · for 2</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {times.map((x, i) => (
          <button key={x} type="button" tabIndex={live ? 0 : -1} onClick={() => { setT(i); setBooked(false); }} className={`rounded-2xl py-3 text-[14px] tabular-nums transition-colors duration-300 ${t === i ? "bg-[#f0a36b] text-white" : "bg-black/[0.05]"}`}>
            {x}
          </button>
        ))}
      </div>
      <button type="button" tabIndex={live ? 0 : -1} onClick={() => t !== null && setBooked(true)} className={`mt-auto mb-12 h-14 rounded-full text-[16px] font-[500] transition-colors duration-500 ${booked ? "bg-[#6aa77f] text-white" : "bg-[#231d1a] text-white"}`}>
        {booked ? `Booked · ${days[d]} ${t !== null ? times[t] : ""} ✓` : "Reserve"}
      </button>
    </div>
  );
}

/** Catch the lights: tap the warm dots before they fade. */
function Lights({ live, active }: { live: boolean; active: boolean }) {
  type Dot = { id: number; x: number; y: number; born: number; c: string };
  const [dots, setDots] = useState<Dot[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [left, setLeft] = useState(0);
  const idRef = useRef(0);
  const playing = left > 0;

  useEffect(() => {
    if (!playing || !active) return;
    const spawn = window.setInterval(() => {
      const now = performance.now();
      setDots((ds) => [
        ...ds.filter((d) => now - d.born < 1500),
        { id: idRef.current++, x: 30 + Math.random() * (W - 60), y: 210 + Math.random() * 470, born: now, c: Math.random() < 0.7 ? "#f0a36b" : "#8fa6e0" },
      ]);
    }, 520);
    const clock = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => {
      clearInterval(spawn);
      clearInterval(clock);
    };
  }, [playing, active]);

  useEffect(() => {
    if (left === 0 && score) setBest((b) => Math.max(b, score));
  }, [left, score]);

  return (
    <div className="relative flex h-full flex-col bg-[#14161f] px-5 pt-16 text-white">
      <p className="text-[30px] font-[600] tracking-[-0.03em]">Lights</p>
      <p className="mt-1 text-[14px] text-white/50">Catch the city lights before they fade.</p>
      <div className="mt-4 flex justify-between text-[14px] tabular-nums text-white/70">
        <span>Score {score}</span>
        <span>{playing ? `${left}s` : best ? `Best ${best}` : ""}</span>
      </div>
      {dots.map((d) => (
        <button
          key={d.id}
          type="button"
          tabIndex={-1}
          aria-label="Light"
          onPointerDown={() => {
            if (!live) return;
            setScore((s) => s + 1);
            setDots((ds) => ds.filter((x) => x.id !== d.id));
          }}
          className="lights-dot absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: d.x, top: d.y, background: `radial-gradient(circle, ${d.c} 0 22%, ${d.c}66 40%, transparent 70%)` }}
        />
      ))}
      {!playing && (
        <div className="absolute inset-x-5 bottom-14 flex flex-col items-center gap-3">
          <button type="button" tabIndex={live ? 0 : -1} onClick={() => { setScore(0); setDots([]); setLeft(15); }} className="h-14 w-full rounded-full bg-white text-[16px] font-[500] text-[#14161f]">
            {best ? "Play again" : "Play · 15 seconds"}
          </button>
        </div>
      )}
      {/* a sleeping skyline at the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-40 [background:linear-gradient(transparent,#0a0b10)]" />
    </div>
  );
}

const APPS = ["Tonight", "Table", "Lights"] as const;

export function PhoneApps({ interactive = false, notify = false }: { interactive?: boolean; notify?: boolean }) {
  const [page, setPage] = useState(0);
  const [ping, setPing] = useState(false);
  const drag = useRef<{ x: number; dx: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // in the room: now and then a notification lights the phone up
  useEffect(() => {
    if (!notify) return;
    let t2 = 0;
    const id = window.setInterval(() => {
      setPing(true);
      t2 = window.setTimeout(() => setPing(false), 3600);
    }, 9000);
    const first = window.setTimeout(() => {
      setPing(true);
      t2 = window.setTimeout(() => setPing(false), 3600);
    }, 1800);
    return () => {
      clearInterval(id);
      clearTimeout(first);
      clearTimeout(t2);
    };
  }, [notify]);

  const go = (p: number) => setPage(Math.max(0, Math.min(APPS.length - 1, p)));

  const onDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { x: e.clientX, dx: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !trackRef.current) return;
    drag.current.dx = e.clientX - drag.current.x;
    trackRef.current.style.transition = "none";
    trackRef.current.style.transform = `translateX(${-page * W + drag.current.dx}px)`;
  };
  const onUp = () => {
    if (!drag.current || !trackRef.current) return;
    const dx = drag.current.dx;
    drag.current = null;
    trackRef.current.style.transition = "";
    trackRef.current.style.transform = "";
    if (Math.abs(dx) > 50) go(page + (dx < 0 ? 1 : -1));
  };

  return (
    <div
      className="app-phone relative select-none overflow-hidden"
      style={{ width: W, height: H, color: ink, background: "#f5efe8", fontFamily: "var(--font-sans)", touchAction: interactive ? "pan-y" : undefined }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      aria-hidden={!interactive}
    >
      <div ref={trackRef} className="flex h-full transition-transform duration-700 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]" style={{ width: W * APPS.length, transform: `translateX(${-page * W}px)` }}>
        <div style={{ width: W }} className="h-full shrink-0"><Tonight live={interactive} /></div>
        <div style={{ width: W }} className="h-full shrink-0"><Table live={interactive} /></div>
        <div style={{ width: W }} className="h-full shrink-0"><Lights live={interactive} active={page === 2} /></div>
      </div>

      {/* status bar and page dots */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 flex h-12 items-center justify-between px-8 text-[14px] font-[600] ${page === 2 ? "text-white" : ""}`}>
        <span>21:47</span>
        <span className="h-3 w-6 rounded-[4px] border border-current opacity-70" />
      </div>
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {APPS.map((a, i) => (
          <button key={a} type="button" tabIndex={interactive ? 0 : -1} aria-label={`Show ${a}`} onClick={() => go(i)} className={`h-1.5 rounded-full transition-all duration-500 ${page === i ? "w-6" : "w-1.5"} ${page === 2 ? "bg-white" : "bg-black"} ${page === i ? "opacity-80" : "opacity-25"}`} />
        ))}
      </div>

      {/* the notification */}
      <div className={`pointer-events-none absolute inset-x-3 top-3 rounded-[22px] bg-white/90 p-4 shadow-[0_10px_30px_rgb(0_0_0/0.15)] transition-all duration-700 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${ping ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0"}`}>
        <p className="text-[13px] font-[600]">Tonight</p>
        <p className="text-[14px] text-black/70">Rooftop listening session starts in an hour.</p>
      </div>
      <div className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-700 ${ping ? "opacity-[0.12]" : "opacity-0"}`} />
    </div>
  );
}

export const PHONE_SIZE = { w: W, h: H };
