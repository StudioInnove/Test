"use client";

/*
 * The phone in the studio: three small example apps you can swipe between.
 *   Tonight  — an events app in the spirit of Luma: big colourful covers, one tap to say you're going.
 *   Table    — book a table: pick a day and a time, done.
 *   Lights   — a little game: catch the city's lights before they fade (first, so it's what you meet).
 * In the room it rests on the first app and now and then a notification lights it up; up close it's yours to use.
 */
import { useEffect, useRef, useState } from "react";
import { LightsGame } from "./LightsGame";
import { asset } from "@/lib/content";

const W = 390, H = 844;
const ink = "#231d1a";

const EVENTS = [
  { t: "Wheel-throwing night", w: "Tonight · 19:00", p: "Kiln & Co. studio", img: "ceramics", pos: "60% 55%", n: 18 },
  { t: "Sunset at the lake house", w: "Sat · 18:30", p: "Kestrel House", img: "house", pos: "70% 50%", n: 46 },
  { t: "Open studio: The Reading Room", w: "Sun · 11:00", p: "Atelier Nord", img: "int3", pos: "50% 60%", n: 23 },
];

function Tonight({ live }: { live: boolean }) {
  const [going, setGoing] = useState<Record<number, boolean>>({});
  return (
    <div className="flex h-full flex-col px-5 pt-16">
      <div className="flex items-center justify-between">
        <p className="text-[32px] font-[600] tracking-[-0.045em]">Tonight</p>
        <span className="flex gap-[2px] rounded-full bg-white p-1 text-[12.5px] shadow-[0_0_0_1px_rgb(0_0_0/0.05)]"><span className="rounded-full bg-[#1d1b18] px-3 py-1 text-white">Near</span><span className="px-3 py-1 text-black/55">All</span></span>
      </div>
      <p className="mt-1 text-[14px] text-black/45">Things worth leaving the house for</p>
      <div className="mt-5 flex flex-col gap-4">
        {EVENTS.map((e, i) => (
          <div key={e.t} className="overflow-hidden rounded-[22px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_6px_20px_rgb(80_50_30/0.06)]">
            <div className="relative h-[118px] overflow-hidden bg-[#e9e1d6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(`/sites/img/${e.img}.webp`)} alt="" className="h-full w-full object-cover" style={{ objectPosition: e.pos }} />
              <div className="absolute inset-0 [background:linear-gradient(180deg,transparent_45%,rgb(0_0_0/0.35))]" />
              <span className="absolute bottom-3 left-4 flex -space-x-2">
                {["#f3b38e", "#c9c4ee", "#e8a6b4"].map((c) => <i key={c} className="block h-6 w-6 rounded-full border-2 border-white" style={{ background: c }} />)}
              </span>
            </div>
            <div className="flex items-end justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-[12px] text-black/45">{e.w}</p>
                <p className="truncate text-[17px] font-[600] tracking-[-0.03em]">{e.t}</p>
                <p className="text-[13px] text-black/45">{e.p} · {e.n + (going[i] ? 1 : 0)} going</p>
              </div>
              <button
                type="button"
                tabIndex={live ? 0 : -1}
                onClick={() => setGoing((g) => ({ ...g, [i]: !g[i] }))}
                className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-[500] transition-[background-color,color,transform] duration-300 active:scale-[0.96] ${going[i] ? "bg-[#e0835f] text-white" : "bg-[#1d1b18] text-white"}`}
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
      <p className="text-[14px] text-black/45">Maison Ora · Oslo</p>
      <p className="text-[32px] font-[600] tracking-[-0.045em]">Book a table</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/sites/img/int2.webp")} alt="" className="mt-5 h-[150px] w-full rounded-[22px] object-cover" style={{ objectPosition: "50% 60%" }} />
      <p className="mt-6 text-[13px] text-black/45">Day</p>
      <div className="mt-2 flex gap-2">
        {days.map((x, i) => (
          <button key={x} type="button" tabIndex={live ? 0 : -1} onClick={() => { setD(i); setBooked(false); }} className={`flex-1 rounded-full py-3 text-[14px] transition-colors duration-300 ${d === i ? "bg-[#1d1b18] text-white" : "bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06)]"}`}>
            {x}
          </button>
        ))}
      </div>
      <p className="mt-5 text-[13px] text-black/45">Time · for 2</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {times.map((x, i) => (
          <button key={x} type="button" tabIndex={live ? 0 : -1} onClick={() => { setT(i); setBooked(false); }} className={`rounded-full py-3 text-[14px] tabular-nums transition-colors duration-300 ${t === i ? "bg-[#e0835f] text-white" : "bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06)]"}`}>
            {x}
          </button>
        ))}
      </div>
      <button type="button" tabIndex={live ? 0 : -1} onClick={() => t !== null && setBooked(true)} className={`mt-auto mb-12 h-14 rounded-full text-[16px] font-[500] transition-[background-color,transform] duration-500 active:scale-[0.98] ${booked ? "bg-[#e0835f] text-white" : "bg-[#1d1b18] text-white"}`}>
        {booked ? `Booked · ${days[d]} ${t !== null ? times[t] : ""} ✓` : "Reserve"}
      </button>
    </div>
  );
}

const APPS = ["Lights", "Tonight", "Table"] as const;

export function PhoneApps({ interactive = false, notify = false, page: controlled }: { interactive?: boolean; notify?: boolean; page?: number }) {
  const [own, setPage] = useState(0);
  const page = controlled ?? own;
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
        <div style={{ width: W }} className="h-full shrink-0"><LightsGame live={interactive} active={page === 0} /></div>
        <div style={{ width: W }} className="h-full shrink-0"><Tonight live={interactive} /></div>
        <div style={{ width: W }} className="h-full shrink-0"><Table live={interactive} /></div>
      </div>

      {/* status bar and page dots */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 flex h-12 items-center justify-between px-8 text-[14px] font-[600] ${page === 0 ? "text-white" : ""}`}>
        <span>21:47</span>
        <span className="h-3 w-6 rounded-[4px] border border-current opacity-70" />
      </div>
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {APPS.map((a, i) => (
          <button key={a} type="button" tabIndex={interactive ? 0 : -1} aria-label={`Show ${a}`} onClick={() => go(i)} className={`h-1.5 rounded-full transition-all duration-500 ${page === i ? "w-6" : "w-1.5"} ${page === 0 ? "bg-white" : "bg-black"} ${page === i ? "opacity-80" : "opacity-25"}`} />
        ))}
      </div>

      {/* the notification */}
      <div className={`pointer-events-none absolute inset-x-3 top-3 rounded-[22px] bg-white/90 p-4 shadow-[0_10px_30px_rgb(0_0_0/0.15)] transition-all duration-700 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${ping ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0"}`}>
        <p className="text-[13px] font-[600]">Tonight</p>
        <p className="text-[14px] text-black/70">Wheel-throwing night starts in an hour.</p>
      </div>
      <div className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-700 ${ping ? "opacity-[0.12]" : "opacity-0"}`} />
    </div>
  );
}

export const PHONE_SIZE = { w: W, h: H };
