"use client";

/*
 * The hotel group's reservations, as a working little calendar: five evenings, half-hour rows.
 * Tap an empty slot to pencil in a booking; drag a booking to another time or evening; tap one to seat it.
 * Hit-testing goes through the DOM (elementFromPoint), so it works even when the screen sits in perspective.
 */
import { useEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";

const DAYS = ["Thu 12", "Fri 13", "Sat 14", "Sun 15", "Mon 16"];
const START = 17; // 17:00
const SLOTS = 12; // to 23:00, every half hour
const NAMES = ["Elena Rossi", "Tom Becker", "Aiko Mori", "Noah Clarke", "Inès Laurent", "Ravi Shah", "Mia Jensen", "Leo Duarte"];
const TINTS = [
  ["#fbe3cf", "#e8915f"],
  ["#e3e8fb", "#6f86d6"],
  ["#f9dcdc", "#d9726b"],
  ["#dff0ea", "#4f9a7c"],
];
type Bk = { id: number; day: number; slot: number; len: number; name: string; party: number; tint: number; seated: boolean };
const SEED: Bk[] = [
  { id: 1, day: 0, slot: 2, len: 3, name: "Amara Okafor", party: 2, tint: 0, seated: true },
  { id: 2, day: 0, slot: 6, len: 4, name: "Lindqvist party", party: 6, tint: 1, seated: false },
  { id: 3, day: 1, slot: 3, len: 3, name: "Kenji Watanabe", party: 4, tint: 2, seated: false },
  { id: 4, day: 2, slot: 1, len: 3, name: "Sofia Marchetti", party: 2, tint: 3, seated: false },
  { id: 5, day: 2, slot: 5, len: 4, name: "Wedding tasting", party: 8, tint: 0, seated: false },
  { id: 6, day: 3, slot: 4, len: 3, name: "Daniel Reyes", party: 3, tint: 1, seated: false },
  { id: 7, day: 4, slot: 7, len: 3, name: "Priya Nair", party: 2, tint: 2, seated: false },
];
const time = (slot: number) => `${START + Math.floor(slot / 2)}:${slot % 2 ? "30" : "00"}`;

export function CalendarView({ live }: { live: boolean }) {
  const [list, setList] = useState<Bk[]>(SEED);
  const [drag, setDrag] = useState<{ id: number; day: number; slot: number } | null>(null);
  const moved = useRef(false);
  const nextId = useRef(100);
  const root = useRef<HTMLDivElement>(null);

  // the week arrives: rows draw in, bookings drop into place
  useEffect(() => {
    const { gsap } = getGsap();
    const el = root.current!;
    const ctx = gsap.context(() => {
      gsap.from("[data-row]", { scaleX: 0, transformOrigin: "0 50%", duration: 0.9, ease: "power3.out", stagger: 0.03 });
      gsap.from("[data-bk]", { y: 14, opacity: 0, scale: 0.96, duration: 0.8, ease: "expo.out", stagger: 0.06, delay: 0.25 });
    }, el);
    return () => ctx.revert();
  }, []);

  const free = (day: number, slot: number, len: number, except = -1) =>
    slot >= 0 && slot + len <= SLOTS && !list.some((b) => b.id !== except && b.day === day && slot < b.slot + b.len && b.slot < slot + len);

  const add = (day: number, slot: number) => {
    if (!live) return;
    const len = Math.min(3, SLOTS - slot);
    if (!free(day, slot, len)) return;
    const id = nextId.current++;
    setList((l) => [...l, { id, day, slot, len, name: NAMES[id % NAMES.length], party: 2 + (id % 4), tint: id % TINTS.length, seated: false }]);
    requestAnimationFrame(() => {
      const el = root.current?.querySelector(`[data-bk="${id}"]`);
      if (el) getGsap().gsap.from(el, { scale: 0.7, opacity: 0, duration: 0.6, ease: "back.out(2.2)" });
    });
  };

  const slotAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-slot]");
    return el ? { day: +el.dataset.day!, slot: +el.dataset.slot! } : null;
  };
  const down = (e: React.PointerEvent, b: Bk) => {
    if (!live) return;
    e.stopPropagation();
    moved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ id: b.id, day: b.day, slot: b.slot });
  };
  const move = (e: React.PointerEvent, b: Bk) => {
    if (!drag || drag.id !== b.id) return;
    // look under the booking, not at it
    const el = e.currentTarget as HTMLElement;
    el.style.pointerEvents = "none";
    const at = slotAt(e.clientX, e.clientY);
    el.style.pointerEvents = "";
    if (!at) return;
    const slot = Math.min(SLOTS - b.len, at.slot);
    if ((at.day !== drag.day || slot !== drag.slot) && free(at.day, slot, b.len, b.id)) {
      moved.current = true;
      setDrag({ id: b.id, day: at.day, slot });
    }
  };
  const up = (b: Bk) => {
    if (!drag || drag.id !== b.id) return;
    const d = drag;
    setDrag(null);
    if (moved.current) setList((l) => l.map((x) => (x.id === b.id ? { ...x, day: d.day, slot: d.slot } : x)));
    else setList((l) => l.map((x) => (x.id === b.id ? { ...x, seated: !x.seated } : x)));
  };

  const guests = list.reduce((a, b) => a + b.party, 0);
  const seated = list.filter((b) => b.seated).length;

  return (
    <div ref={root} className="dash-view absolute bottom-[50px] left-[262px] right-[44px] top-[48px] flex flex-col rounded-[24px] bg-white/85 px-7 pb-6 pt-6 shadow-[0_8px_30px_rgb(120_80_50/0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[17px] font-[500]">Reservations</p>
          <p className="mt-0.5 text-[13px] text-[#2b2522]/50">{list.length} bookings · {guests} guests · {seated} seated</p>
        </div>
        <p className="rounded-full bg-[#2b2522]/[0.05] px-3 py-1.5 text-[12.5px] text-[#2b2522]/60">{live ? "Tap a slot to book · drag to move" : "This week"}</p>
      </div>
      <div className="mt-4 grid flex-1 grid-cols-[52px_repeat(5,1fr)] grid-rows-[28px_1fr] gap-x-2">
        <div />
        {DAYS.map((d, i) => (
          <p key={d} className={`text-[13px] ${i === 0 ? "font-[600] text-[#2b2522]" : "text-[#2b2522]/55"}`}>{d}{i === 0 && <span className="ml-1.5 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-[#e8915f]" />}</p>
        ))}
        {/* the hours */}
        <div className="relative" style={{ gridColumn: "1", gridRow: "2" }}>
          {Array.from({ length: SLOTS / 2 }, (_, h) => (
            <p key={h} className="absolute right-2 -translate-y-1/2 text-[11.5px] tabular-nums text-[#2b2522]/40" style={{ top: `${(h * 2 * 100) / SLOTS}%` }}>{START + h}:00</p>
          ))}
        </div>
        {DAYS.map((d, day) => (
          <div key={d} className="relative" style={{ gridColumn: String(day + 2), gridRow: "2" }}>
            {Array.from({ length: SLOTS }, (_, slot) => (
              <button
                key={slot}
                type="button"
                tabIndex={-1}
                data-slot={slot}
                data-day={day}
                onClick={() => add(day, slot)}
                className="cal-slot absolute inset-x-0 block"
                style={{ top: `${(slot * 100) / SLOTS}%`, height: `${100 / SLOTS}%` }}
              >
                <span data-row aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-px ${slot % 2 ? "bg-[#2b2522]/[0.04]" : "bg-[#2b2522]/[0.08]"}`} />
              </button>
            ))}
          </div>
        ))}
        {/* the bookings, in one layer over the week, so one can be carried from evening to evening */}
        <div className="pointer-events-none relative" style={{ gridColumn: "2 / 7", gridRow: "2" }}>
          {list.map((b) => {
            const day = drag?.id === b.id ? drag.day : b.day;
            const slot = drag?.id === b.id ? drag.slot : b.slot;
            const [bg, fg] = TINTS[b.tint];
            return (
              <div
                key={b.id}
                data-bk={b.id}
                onPointerDown={(e) => down(e, b)}
                onPointerMove={(e) => move(e, b)}
                onPointerUp={() => up(b)}
                onPointerCancel={() => setDrag(null)}
                className={`pointer-events-auto absolute z-10 overflow-hidden rounded-[12px] px-3 py-2 transition-[top,left,box-shadow,transform] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${live ? "cursor-grab active:cursor-grabbing" : ""} ${drag?.id === b.id ? "scale-[1.03] shadow-[0_12px_30px_rgb(80_50_30/0.22)]" : "shadow-[0_2px_8px_rgb(80_50_30/0.06)]"}`}
                style={{ left: `calc(${day} * ((100% - 32px) / 5 + 8px) + 2px)`, width: `calc((100% - 32px) / 5 - 4px)`, top: `calc(${(slot * 100) / SLOTS}% + 2px)`, height: `calc(${(b.len * 100) / SLOTS}% - 4px)`, background: bg, touchAction: "none" }}
              >
                <span className="absolute inset-y-2 left-0 w-[3px] rounded-full" style={{ background: fg }} />
                <p className="truncate text-[13.5px] font-[600] text-[#2b2522]">{b.name}</p>
                <p className="truncate text-[12px] text-[#2b2522]/55 tabular-nums">{time(slot)} · {b.party} guests</p>
                <span className={`absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[11px] font-[600] transition-all duration-300 ${b.seated ? "scale-100 opacity-100" : "scale-75 opacity-0"}`} style={{ background: fg, color: "#fff" }}>Seated</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
