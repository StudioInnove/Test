"use client";

/*
 * The phone in the studio: three demo apps you can swipe between, each with the gestures you'd expect
 * from a real one (GSAP for the motion).
 *   Ember — order coffee ahead: tap + and the cup flies into the basket; open the basket as a sheet,
 *           drag it down to close, place the order and watch it brew.
 *   Pulse — fitness: three rings that fill as they arrive, a streak, and a slider you swipe to log a workout.
 *   Tide  — music: a library with a mini-player that opens into the full player; scrub, play, skip.
 * In the room it rests on the first app and now and then a notification lights it up; up close it's yours.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { useLive } from "@/lib/useLive";
import { StackGame } from "./StackGame";
import { Coach } from "./ProjectApp";

const W = 390, H = 844;
export const PHONE_SIZE = { w: W, h: H };
const APPS = ["Ember", "Pulse", "Tide", "Stack"] as const;
const ACCENT = "#e0835f";

/** how big the phone is drawn on screen, so pointer moves can be turned into its own pixels */
const scaleOf = (el: HTMLElement | null) => (el ? el.getBoundingClientRect().width / W || 1 : 1);

export function PhoneApps({ interactive = false, notify = false, page: controlled }: { interactive?: boolean; notify?: boolean; page?: number }) {
  const [own, setPage] = useState(0);
  const page = controlled ?? own;
  const [ping, setPing] = useState(false);
  const drag = useRef<{ x: number; y: number; dx: number; on: boolean } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const live = useLive(rootRef);
  const [coached, setCoached] = useState(false);

  // in the room: now and then a notification lights the phone up
  useEffect(() => {
    if (!notify) return;
    let t2 = 0;
    const show = () => { if (!live()) return; setPing(true); t2 = window.setTimeout(() => setPing(false), 3600); };
    const id = window.setInterval(show, 9000);
    const first = window.setTimeout(show, 1800);
    return () => { clearInterval(id); clearTimeout(first); clearTimeout(t2); };
  }, [notify]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (p: number) => setPage(Math.max(0, Math.min(APPS.length - 1, p)));

  // swiping sideways between apps (anything that has its own gesture opts out with data-nodrag)
  const onDown = (e: React.PointerEvent) => {
    if (!interactive || (e.target as HTMLElement).closest("button, [data-nodrag]")) return;
    drag.current = { x: e.clientX, y: e.clientY, dx: 0, on: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !trackRef.current) return;
    const k = scaleOf(rootRef.current);
    const dx = (e.clientX - d.x) / k, dy = (e.clientY - d.y) / k;
    if (!d.on) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      d.on = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    d.dx = dx;
    const edge = (page === 0 && dx > 0) || (page === APPS.length - 1 && dx < 0) ? 0.35 : 1;
    trackRef.current.style.transition = "none";
    trackRef.current.style.transform = `translateX(${-page * W + dx * edge}px)`;
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.on || !trackRef.current) return;
    trackRef.current.style.transition = "";
    trackRef.current.style.transform = "";
    if (Math.abs(d.dx) > 60) go(page + (d.dx < 0 ? 1 : -1));
  };

  const darkTop = page === 2;
  return (
    <div
      ref={rootRef}
      className="app-phone relative select-none overflow-hidden"
      style={{ width: W, height: H, color: "#1d1b18", background: "#f6f2ec", fontFamily: "var(--font-sans)", touchAction: interactive ? "pan-y" : undefined }}
      onPointerDown={onDown}
      onPointerDownCapture={() => !coached && setCoached(true)}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      aria-hidden={!interactive}
    >
      <div ref={trackRef} className="flex h-full transition-transform duration-700 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]" style={{ width: W * APPS.length, transform: `translateX(${-page * W}px)` }}>
        <div style={{ width: W }} className="relative h-full shrink-0"><Ember live={interactive} root={rootRef} /></div>
        <div style={{ width: W }} className="relative h-full shrink-0"><Pulse live={interactive} active={page === 1} root={rootRef} /></div>
        <div style={{ width: W }} className="relative h-full shrink-0"><Tide live={interactive} root={rootRef} /></div>
        <div style={{ width: W }} className="relative h-full shrink-0"><StackGame live={interactive} active={page === 3} /></div>
      </div>

      {interactive && !coached && page === 0 && <Coach root={rootRef} from='button[aria-label="Add Flat white"]' label="Tap + to order" w={W} tap />}

      {/* status bar and page dots */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex h-[54px] items-center justify-between px-8 pt-1 text-[15px] font-[600] transition-colors duration-500 ${darkTop ? "text-white" : "text-[#1d1b18]"}`}>
        <span>9:41</span>
        <span className="flex items-center gap-1.5">
          <svg width="17" height="11" viewBox="0 0 17 11" aria-hidden fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
          <span className="relative h-[12px] w-[25px] rounded-[4px] border border-current opacity-80"><span className="absolute inset-[1.5px] right-[5px] rounded-[2px] bg-current" /></span>
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-[10px] z-30 flex justify-center gap-2">
        {APPS.map((a, i) => (
          <button key={a} type="button" tabIndex={interactive ? 0 : -1} aria-label={`Show ${a}`} onClick={() => go(i)} className={`h-[6px] rounded-full transition-all duration-500 ${page === i ? "w-6" : "w-[6px]"} ${darkTop ? "bg-white" : "bg-black"} ${page === i ? "opacity-80" : "opacity-25"}`} />
        ))}
      </div>

      {/* the notification */}
      <div className={`pointer-events-none absolute inset-x-3 top-3 z-40 flex items-center gap-3 rounded-[22px] bg-white/90 p-3.5 shadow-[0_10px_30px_rgb(0_0_0/0.15)] backdrop-blur transition-all duration-700 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${ping ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0"}`}>
        <span className="grid h-10 w-10 place-items-center rounded-[11px]" style={{ background: "#2a1f1a" }}><Cup size={26} tone={0} /></span>
        <span>
          <p className="text-[14px] font-[600]">Ember</p>
          <p className="text-[14px] text-black/70">Your oat flat white is ready.</p>
        </span>
      </div>
    </div>
  );
}

/* ——— Ember: order coffee ahead ——— */

const DRINKS = [
  { n: "Flat white", d: "Double shot, silky milk", p: 3.4, tone: 0 },
  { n: "Oat latte", d: "Smooth, a little sweet", p: 3.8, tone: 1 },
  { n: "Cortado", d: "Equal parts, short", p: 3.1, tone: 2 },
  { n: "Iced mocha", d: "Dark chocolate, cold milk", p: 4.2, tone: 3 },
];
const TONES = [
  ["#6b4430", "#c99a74", "#f2dfc8"],
  ["#7a5236", "#d8b08a", "#f7ead8"],
  ["#4e3022", "#a8754f", "#e8cba8"],
  ["#3b261c", "#8b5a3c", "#d9b28e"],
];
const TILE = ["#efe4d8", "#ece6dc", "#e9e1d7", "#e6e2dc"];

/** a cup seen from above: saucer, rim, coffee and a little latte art */
function Cup({ size = 96, tone = 0 }: { size?: number; tone?: number }) {
  const [dark, mid, foam] = TONES[tone % TONES.length];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="52" r="46" fill="rgb(0 0 0 / 0.08)" />
      <circle cx="50" cy="50" r="46" fill="#fbf8f4" />
      <circle cx="50" cy="50" r="34" fill="#fff" stroke="rgb(0 0 0 / 0.06)" />
      <circle cx="50" cy="50" r="29" fill={dark} />
      <circle cx="50" cy="50" r="27" fill={mid} />
      <path d="M50 33c9 0 15 7 15 14 0 9-8 13-15 21-7-8-15-12-15-21 0-7 6-14 15-14z" fill={foam} opacity="0.95" />
      <path d="M50 40c5 0 8 4 8 8 0 5-4 7-8 12-4-5-8-7-8-12 0-4 3-8 8-8z" fill={mid} opacity="0.55" />
      <rect x="82" y="44" width="14" height="12" rx="6" fill="#fff" stroke="rgb(0 0 0 / 0.06)" />
    </svg>
  );
}

function Ember({ live, root }: { live: boolean; root: React.RefObject<HTMLDivElement | null> }) {
  const [cat, setCat] = useState(0);
  const [bag, setBag] = useState<number[]>([]);
  const [sheet, setSheet] = useState(false);
  const [stage, setStage] = useState<"browse" | "brewing" | "ready">("browse");
  const self = useRef<HTMLDivElement>(null);
  const basket = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const cats = ["Coffee", "Tea", "Bakery", "Cold"];

  // the category pill slides to the one you pick
  useLayoutEffect(() => {
    const el = self.current?.querySelector<HTMLElement>(`[data-cat="${cat}"]`);
    if (!el || !pill.current) return;
    getGsap().gsap.to(pill.current, { x: el.offsetLeft, width: el.offsetWidth, duration: 0.5, ease: "power3.out" });
  }, [cat]);

  const add = (i: number, from: HTMLElement) => {
    if (!live) return;
    const { gsap } = getGsap();
    const k = scaleOf(root.current);
    const box = self.current!.getBoundingClientRect();
    const a = from.getBoundingClientRect(), b = basket.current!.getBoundingClientRect();
    const fly = document.createElement("div");
    fly.style.cssText = `position:absolute;left:${(a.left - box.left) / k}px;top:${(a.top - box.top) / k}px;width:${a.width / k}px;height:${a.height / k}px;z-index:50;pointer-events:none`;
    fly.innerHTML = from.innerHTML;
    self.current!.appendChild(fly);
    const tx = (b.left + b.width / 2 - (a.left + a.width / 2)) / k, ty = (b.top + b.height / 2 - (a.top + a.height / 2)) / k;
    // an arc: across steadily, up and then down
    gsap.to(fly, { x: tx, duration: 0.75, ease: "power1.inOut" });
    gsap.to(fly, { y: ty, duration: 0.75, ease: "back.in(1.6)" });
    gsap.to(fly, { scale: 0.22, rotation: 200, duration: 0.75, ease: "power2.in", onComplete: () => {
      fly.remove();
      setBag((l) => [...l, i]);
      gsap.fromTo(basket.current, { scale: 1.18 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    } });
  };

  // the basket opens as a sheet; drag it down to close
  useLayoutEffect(() => {
    if (!sheet || !sheetRef.current) return;
    getGsap().gsap.fromTo(sheetRef.current, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: "power3.out" });
  }, [sheet]);
  const closeSheet = () => {
    if (!sheetRef.current) return setSheet(false);
    getGsap().gsap.to(sheetRef.current, { yPercent: 100, duration: 0.4, ease: "power3.in", onComplete: () => setSheet(false) });
  };
  const sd = useRef<{ y: number; dy: number; t: number } | null>(null);
  const sDown = (e: React.PointerEvent) => { sd.current = { y: e.clientY, dy: 0, t: performance.now() }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const sMove = (e: React.PointerEvent) => {
    if (!sd.current || !sheetRef.current) return;
    const dy = Math.max(-20, (e.clientY - sd.current.y) / scaleOf(root.current));
    sd.current.dy = dy;
    sheetRef.current.style.transform = `translateY(${dy < 0 ? dy * 0.3 : dy}px)`;
  };
  const sUp = () => {
    const d = sd.current;
    sd.current = null;
    if (!d || !sheetRef.current) return;
    const v = d.dy / (performance.now() - d.t);
    if (d.dy > 140 || v > 0.6) closeSheet();
    else getGsap().gsap.to(sheetRef.current, { y: 0, yPercent: 0, duration: 0.45, ease: "back.out(1.4)", clearProps: "transform" });
  };

  const total = bag.reduce((a, i) => a + DRINKS[i].p, 0);
  const order = () => {
    closeSheet();
    setStage("brewing");
    window.setTimeout(() => setStage("ready"), 4200);
  };

  return (
    <div ref={self} className="relative h-full px-5 pt-[66px]" style={{ background: "#f6f1ea" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-black/50">Pick up at</p>
          <p className="text-[17px] font-[600]">Ember, Canal Street ▾</p>
        </div>
        <button ref={basket} type="button" tabIndex={live ? 0 : -1} aria-label={`Basket, ${bag.length} items`} onClick={() => bag.length && setSheet(true)} className="relative grid h-12 w-12 place-items-center rounded-full bg-[#1d1b18] text-white">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden><path d="M4 7h12l-1 10H5L4 7z M7 7V5.5a3 3 0 0 1 6 0V7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          {bag.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-[700]" style={{ background: ACCENT }}>{bag.length}</span>}
        </button>
      </div>

      {stage !== "browse" ? (
        <OrderStatus stage={stage} onDone={() => { setStage("browse"); setBag([]); }} live={live} />
      ) : (
        <>
          <h4 data-b className="mt-6 text-[34px] font-[600] leading-[1.05] tracking-[-0.03em]">Good morning.<br /><span className="text-black/40">What can we make you?</span></h4>
          <div data-nodrag data-b className="relative mt-5 flex gap-1 rounded-full bg-black/[0.05] p-1 text-[14px]">
            <span ref={pill} aria-hidden className="absolute left-0 top-1 h-[34px] rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.1)]" style={{ width: 70 }} />
            {cats.map((c, i) => (
              <button key={c} type="button" data-cat={i} tabIndex={live ? 0 : -1} onClick={() => setCat(i)} className={`relative z-10 h-[34px] flex-1 rounded-full transition-colors duration-300 ${cat === i ? "font-[600]" : "text-black/55"}`}>{c}</button>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {DRINKS.map((d, i) => (
              <div key={d.n} data-b className="relative rounded-[24px] p-3 pb-4" style={{ background: TILE[i] }}>
                <div data-cup className="mx-auto w-max transition-transform duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]"><Cup size={128} tone={d.tone} /></div>
                <p className="mt-2 text-[15px] font-[600]">{d.n}</p>
                <p className="text-[12px] text-black/50">{d.d}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[15px] font-[600] tabular-nums">£{d.p.toFixed(2)}</span>
                  <button type="button" tabIndex={live ? 0 : -1} aria-label={`Add ${d.n}`} onClick={(e) => add(i, (e.currentTarget.closest("div.relative") as HTMLElement).querySelector("[data-cup]")!)} className="grid h-9 w-9 place-items-center rounded-full bg-[#1d1b18] text-[20px] leading-none text-white transition-transform duration-150 active:scale-90">+</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {sheet && (
        <div className="absolute inset-0 z-40" onPointerDown={(e) => e.target === e.currentTarget && closeSheet()} style={{ background: "rgb(0 0 0 / 0.25)" }}>
          <div ref={sheetRef} data-nodrag className="absolute inset-x-0 bottom-0 rounded-t-[32px] bg-white px-6 pb-12 pt-3 shadow-[0_-20px_50px_rgb(0_0_0/0.15)]">
            <div onPointerDown={sDown} onPointerMove={sMove} onPointerUp={sUp} onPointerCancel={sUp} className="-mx-6 cursor-grab px-6 pb-3 pt-1 touch-none">
              <span className="mx-auto block h-[5px] w-10 rounded-full bg-black/15" />
              <p className="mt-4 text-[22px] font-[600] tracking-[-0.02em]">Your order</p>
            </div>
            <ul className="mt-2 flex flex-col gap-3">
              {Array.from(new Set(bag)).map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="rounded-full" style={{ background: TILE[i] }}><Cup size={48} tone={DRINKS[i].tone} /></span>
                  <span className="flex-1 text-[15px]">{DRINKS[i].n} <span className="text-black/45">× {bag.filter((x) => x === i).length}</span></span>
                  <span className="text-[15px] tabular-nums">£{(DRINKS[i].p * bag.filter((x) => x === i).length).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-between border-t border-black/[0.06] pt-4 text-[16px] font-[600]"><span>Total</span><span className="tabular-nums">£{total.toFixed(2)}</span></div>
            <button type="button" onClick={order} className="mt-5 h-14 w-full rounded-full bg-[#1d1b18] text-[16px] font-[600] text-white transition-transform duration-150 active:scale-[0.98]">Place order · Ready in 4 min</button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderStatus({ stage, onDone, live }: { stage: "brewing" | "ready"; onDone: () => void; live: boolean }) {
  const ring = useRef<SVGCircleElement>(null);
  useLayoutEffect(() => {
    if (stage !== "brewing") return;
    getGsap().gsap.fromTo(ring.current, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 4.2, ease: "none" });
  }, [stage]);
  return (
    <div className="flex h-[620px] flex-col items-center justify-center text-center">
      <div className="relative">
        <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden className="-rotate-90">
          <circle cx="110" cy="110" r="100" fill="none" stroke="rgb(0 0 0 / 0.06)" strokeWidth="8" />
          <circle ref={ring} cx="110" cy="110" r="100" fill="none" stroke={ACCENT} strokeWidth="8" strokeLinecap="round" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: stage === "ready" ? 0 : 1 }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center"><div className={stage === "brewing" ? "animate-[spin_6s_linear_infinite]" : ""}><Cup size={150} tone={0} /></div></div>
      </div>
      <p className="mt-8 text-[28px] font-[600] tracking-[-0.02em]">{stage === "brewing" ? "Brewing now…" : "Ready when you are."}</p>
      <p className="mt-2 text-[15px] text-black/55">{stage === "brewing" ? "We'll let you know the moment it's done." : "It's waiting at the counter, under your name."}</p>
      {stage === "ready" && <button type="button" tabIndex={live ? 0 : -1} onClick={onDone} className="mt-8 h-12 rounded-full bg-[#1d1b18] px-7 text-[15px] font-[600] text-white">Order again</button>}
    </div>
  );
}

/* ——— Pulse: fitness ——— */

const RINGS = [
  { k: "Move", v: 0.72, c: "#e0835f", r: 104, u: "480 / 650 kcal" },
  { k: "Exercise", v: 0.55, c: "#c9a25f", r: 80, u: "22 / 40 min" },
  { k: "Stand", v: 0.83, c: "#8ea887", r: 56, u: "10 / 12 hrs" },
];

function Pulse({ live, active, root }: { live: boolean; active: boolean; root: React.RefObject<HTMLDivElement | null> }) {
  const [vals, setVals] = useState(RINGS.map((r) => r.v));
  const [logged, setLogged] = useState(false);
  const [focus, setFocus] = useState(0);
  const self = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  // the rings fill as you arrive
  useLayoutEffect(() => {
    if (!active && live) return;
    const { gsap } = getGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-ring]", { strokeDashoffset: 1 }, { strokeDashoffset: (i: number) => 1 - vals[i], duration: 1.6, ease: "power3.out", stagger: 0.12 });
      gsap.from("[data-pop]", { y: 16, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.07, delay: 0.2 });
    }, self);
    return () => ctx.revert();
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  // swipe to log a workout
  const sw = useRef<{ x: number; max: number } | null>(null);
  const down = (e: React.PointerEvent) => {
    if (!live || logged) return;
    sw.current = { x: e.clientX, max: track.current!.offsetWidth - knob.current!.offsetWidth - 8 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moveK = (e: React.PointerEvent) => {
    const s = sw.current;
    if (!s) return;
    const x = Math.max(0, Math.min(s.max, (e.clientX - s.x) / scaleOf(root.current)));
    knob.current!.style.transform = `translateX(${x}px)`;
    track.current!.style.setProperty("--p", String(x / s.max));
  };
  const up = () => {
    const s = sw.current;
    sw.current = null;
    if (!s) return;
    const { gsap } = getGsap();
    const p = +(track.current!.style.getPropertyValue("--p") || 0);
    if (p > 0.82) {
      gsap.to(knob.current, { x: s.max, duration: 0.2 });
      setLogged(true);
      const next = vals.map((v, i) => Math.min(1, v + [0.18, 0.4, 0.08][i]));
      setVals(next);
      gsap.to(self.current!.querySelectorAll("[data-ring]"), { strokeDashoffset: (i: number) => 1 - next[i], duration: 1.2, ease: "elastic.out(1, 0.6)", stagger: 0.08 });
      gsap.fromTo(self.current!.querySelector("[data-rings]"), { scale: 0.94 }, { scale: 1, duration: 0.9, ease: "elastic.out(1, 0.4)" });
      // a little celebration from the rings
      const box = self.current!, ring = box.querySelector("[data-rings]") as HTMLElement;
      const cx = ring.offsetLeft + ring.offsetWidth / 2, cy = ring.offsetTop + ring.offsetHeight / 2;
      for (let i = 0; i < 26; i++) {
        const d = document.createElement("span");
        const sz = 5 + Math.random() * 6;
        d.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;border-radius:99px;background:${RINGS[i % 3].c};pointer-events:none;z-index:5`;
        box.appendChild(d);
        const a = Math.random() * Math.PI * 2, dist = 110 + Math.random() * 70;
        gsap.timeline({ onComplete: () => d.remove() })
          .to(d, { x: Math.cos(a) * dist, y: Math.sin(a) * dist, duration: 0.6, ease: "power3.out", delay: 0.15 })
          .to(d, { y: "+=90", opacity: 0, scale: 0.4, duration: 0.7, ease: "power1.in" });
      }
    } else {
      gsap.to(knob.current, { x: 0, duration: 0.5, ease: "back.out(1.6)", clearProps: "transform" });
      track.current!.style.setProperty("--p", "0");
    }
  };

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div ref={self} className="relative h-full px-6 pt-[70px]" style={{ background: "#f7f3ee" }}>
      <p data-pop className="text-[13px] font-[500] uppercase tracking-[0.08em] text-black/45">Thursday</p>
      <h4 data-pop className="text-[34px] font-[600] tracking-[-0.03em]">Today</h4>

      <div data-rings className="relative mx-auto mt-4 h-[236px] w-[236px]">
        <svg viewBox="0 0 236 236" className="h-full w-full -rotate-90" aria-hidden>
          {RINGS.map((r, i) => (
            <g key={r.k}>
              <circle cx="118" cy="118" r={r.r} fill="none" stroke={r.c} strokeOpacity="0.16" strokeWidth="20" />
              <circle data-ring cx="118" cy="118" r={r.r} fill="none" stroke={r.c} strokeWidth="20" strokeLinecap="round" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: 1 - vals[i] }} />
            </g>
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[30px] font-[600] leading-none tabular-nums tracking-[-0.02em]">{Math.round(vals[focus] * 100)}%</p>
            <p className="mt-1 text-[12px] text-black/50">{RINGS[focus].k}</p>
          </div>
        </div>
      </div>

      <div data-nodrag className="mt-5 grid grid-cols-3 gap-2">
        {RINGS.map((r, i) => (
          <button key={r.k} data-pop type="button" tabIndex={live ? 0 : -1} onClick={() => setFocus(i)} className="rounded-[18px] p-3 text-left transition-[background-color,box-shadow] duration-300" style={{ background: focus === i ? "#fff" : "rgb(0 0 0 / 0.035)", boxShadow: focus === i ? "0 4px 14px rgb(0 0 0 / 0.06)" : "none" }}>
            <span className="flex items-center gap-1.5 text-[12px] text-black/55"><i className="h-2 w-2 rounded-full" style={{ background: r.c }} />{r.k}</span>
            <span className="mt-1 block text-[13px] font-[600]">{r.u}</span>
          </button>
        ))}
      </div>

      <div data-pop className="mt-5 rounded-[22px] bg-white p-4 shadow-[0_4px_14px_rgb(0_0_0/0.05)]">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-[600]">{logged ? "13-day streak" : "12-day streak"}</p>
          <p className="text-[13px] text-black/45">Keep it going</p>
        </div>
        <div className="mt-3 flex justify-between">
          {days.map((d, i) => {
            const on = i < 3 || (i === 3 && logged);
            return (
              <span key={i} className="flex flex-col items-center gap-1.5 text-[11px] text-black/45">
                <span className="grid h-8 w-8 place-items-center rounded-full transition-all duration-500" style={{ background: on ? ACCENT : "rgb(0 0 0 / 0.05)", transform: i === 3 && logged ? "scale(1.12)" : "none" }}>
                  {on && <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M3 6.2l2 2 4-4.4" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
                {d}
              </span>
            );
          })}
        </div>
      </div>

      <div ref={track} data-nodrag data-pop className="relative mt-5 h-16 overflow-hidden rounded-full p-1" style={{ background: logged ? "#8ea887" : "#1d1b18", transition: "background-color 500ms ease" }}>
        <span aria-hidden className="absolute inset-y-0 left-0 rounded-full" style={{ width: "calc(var(--p, 0) * 100% + 56px)", background: "rgb(255 255 255 / 0.08)" }} />
        <span className="absolute inset-0 grid place-items-center pl-10 text-[15px] font-[500] text-white/80">{logged ? "Workout logged" : "Swipe to log a 30-min run"}</span>
        <div ref={knob} onPointerDown={down} onPointerMove={moveK} onPointerUp={up} onPointerCancel={up} className="relative z-10 grid h-14 w-14 cursor-grab touch-none place-items-center rounded-full bg-white" role="slider" aria-label="Swipe to log a workout" aria-valuemin={0} aria-valuemax={1} aria-valuenow={logged ? 1 : 0}>
          {logged ? (
            <svg width="18" height="18" viewBox="0 0 12 12" aria-hidden><path d="M3 6.2l2 2 4-4.4" fill="none" stroke="#8ea887" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M6 4l5 5-5 5" fill="none" stroke="#1d1b18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </div>
      </div>
    </div>
  );
}

/* ——— Tide: music ——— */

const TRACKS = [
  { t: "Low Tide", a: "Mara Lune", len: 214, art: ["#f4b478", "#e0835f", "#5b3a5e", "#1d2340"] },
  { t: "Night Bus", a: "Ochre", len: 188, art: ["#9fb7d8", "#5d6fa3", "#2c2f55", "#0f1122"] },
  { t: "Glasshouse", a: "June Avenue", len: 241, art: ["#cfe0b8", "#8ea887", "#3f5a4a", "#16211c"] },
  { t: "Paper Moons", a: "Halden", len: 199, art: ["#f2d8c2", "#c99a74", "#7a4f3a", "#2a1a14"] },
];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function Art({ c, className = "", style }: { c: string[]; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ ...style, background: `radial-gradient(60% 60% at 25% 25%, ${c[0]} 0%, transparent 70%), radial-gradient(70% 70% at 80% 30%, ${c[1]} 0%, transparent 70%), radial-gradient(80% 80% at 60% 90%, ${c[2]} 0%, transparent 75%), ${c[3]}` }}>
      <svg viewBox="0 0 100 100" className="h-full w-full opacity-40 mix-blend-overlay" aria-hidden preserveAspectRatio="none"><circle cx="70" cy="70" r="38" fill="none" stroke="#fff" strokeWidth="0.6" /><circle cx="70" cy="70" r="26" fill="none" stroke="#fff" strokeWidth="0.6" /><circle cx="70" cy="70" r="14" fill="none" stroke="#fff" strokeWidth="0.6" /></svg>
    </div>
  );
}

function Tide({ live, root }: { live: boolean; root: React.RefObject<HTMLDivElement | null> }) {
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(!live);
  const [pos, setPos] = useState(64);
  const [open, setOpen] = useState(false);
  const self = useRef<HTMLDivElement>(null);
  const full = useRef<HTMLDivElement>(null);
  const tr = TRACKS[cur];
  const seen = useLive(self);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => seen() && setPos((p) => { if (p + 1 >= tr.len) { setCur((c) => (c + 1) % TRACKS.length); return 0; } return p + 1; }), 1000);
    return () => clearInterval(id);
  }, [playing, tr.len]);

  // the mini-player opens into the full player: its cover grows into the big one (GSAP Flip)
  const flip = useRef<unknown>(null);
  const toggle = (v: boolean) => {
    const { Flip } = getGsap();
    flip.current = Flip.getState(self.current!.querySelectorAll("[data-flip-id]"));
    setOpen(v);
  };
  useLayoutEffect(() => {
    const st = flip.current;
    if (!st) return;
    flip.current = null;
    const { Flip, gsap } = getGsap();
    Flip.from(st as Parameters<typeof Flip.from>[0], { duration: 0.6, ease: "power3.inOut", absolute: true });
    if (open && full.current) gsap.fromTo(full.current.querySelectorAll("[data-fade]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.25, stagger: 0.05, ease: "power3.out" });
  }, [open]);

  const skip = (d: number) => {
    const { gsap } = getGsap();
    const art = self.current!.querySelector("[data-flip-id='art']");
    gsap.fromTo(art, { x: d * 40, opacity: 0, scale: 0.94 }, { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" });
    setCur((c) => (c + d + TRACKS.length) % TRACKS.length);
    setPos(0);
  };

  // scrubbing
  const sc = useRef<DOMRect | null>(null);
  const scrub = (e: React.PointerEvent) => {
    const r = sc.current ?? (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos(Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * tr.len));
  };

  // closing the player: drag it down
  const cd = useRef<{ y: number; dy: number } | null>(null);
  const cDown = (e: React.PointerEvent) => { if ((e.target as HTMLElement).closest("button, [data-scrub]")) return; cd.current = { y: e.clientY, dy: 0 }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const cMove = (e: React.PointerEvent) => { if (!cd.current || !full.current) return; cd.current.dy = Math.max(0, (e.clientY - cd.current.y) / scaleOf(root.current)); full.current.style.transform = `translateY(${cd.current.dy}px)`; };
  const cUp = () => { const d = cd.current; cd.current = null; if (!d || !full.current) return; full.current.style.transform = ""; if (d.dy > 120) toggle(false); };

  return (
    <div ref={self} className="relative h-full text-white" style={{ background: "#0e0f14" }}>
      {/* the library */}
      <div className="px-5 pt-[70px]">
        <h4 data-b className="text-[34px] font-[600] tracking-[-0.03em]">Listen now</h4>
        <p className="mt-1 text-[14px] text-white/50">Picked for a quiet evening</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {TRACKS.map((t, i) => (
            <button key={t.t} data-b type="button" tabIndex={live ? 0 : -1} onClick={() => { setCur(i); setPos(0); setPlaying(true); toggle(true); }} className="text-left">
              <Art c={t.art} className="aspect-square w-full rounded-[18px]" />
              <p className="mt-2 text-[14px] font-[600]">{t.t}</p>
              <p className="text-[12px] text-white/50">{t.a}</p>
            </button>
          ))}
        </div>
      </div>

      {/* the mini-player */}
      {!open && (
        <button type="button" tabIndex={live ? 0 : -1} onClick={() => toggle(true)} data-flip-id="panel" className="absolute inset-x-3 bottom-8 flex items-center gap-3 rounded-[20px] bg-white/[0.1] p-2.5 pr-4 text-left backdrop-blur-xl" style={{ boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.08)" }}>
          <div data-flip-id="art"><Art c={tr.art} className="h-12 w-12 rounded-[12px]" /></div>
          <span className="flex-1">
            <span className="flex items-center gap-2 text-[14px] font-[600]">{tr.t}<Eq on={playing} /></span>
            <span className="block text-[12px] text-white/55">{tr.a}</span>
          </span>
          <span role="button" tabIndex={live ? 0 : -1} aria-label={playing ? "Pause" : "Play"} onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); }} className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#0e0f14]"><PlayIcon playing={playing} size={16} /></span>
          <span aria-hidden className="absolute inset-x-4 bottom-1 h-[2px] overflow-hidden rounded-full bg-white/10"><span className="block h-full bg-white/70" style={{ width: `${(pos / tr.len) * 100}%` }} /></span>
        </button>
      )}

      {/* the full player */}
      {open && (
        <div ref={full} data-flip-id="panel" data-nodrag onPointerDown={cDown} onPointerMove={cMove} onPointerUp={cUp} onPointerCancel={cUp} className="absolute inset-0 z-20 flex flex-col px-7 pt-[64px] transition-[background] duration-700" style={{ background: `linear-gradient(180deg, ${tr.art[2]} 0%, ${tr.art[3]} 70%)` }}>
          <button data-fade type="button" onClick={() => toggle(false)} aria-label="Close player" className="mx-auto block h-[5px] w-10 rounded-full bg-white/30" />
          <div data-flip-id="art" className="mt-8"><Art c={tr.art} className="aspect-square w-full rounded-[22px] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)]" /></div>
          <div data-fade className="mt-8 flex items-end justify-between">
            <div>
              <p className="flex items-center gap-3 text-[24px] font-[600] tracking-[-0.02em]">{tr.t}<Eq on={playing} /></p>
              <p className="text-[16px] text-white/60">{tr.a}</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-hidden>♡</span>
          </div>
          <div data-fade data-scrub className="mt-7 cursor-pointer touch-none py-3" onPointerDown={(e) => { sc.current = (e.currentTarget as HTMLElement).getBoundingClientRect(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); scrub(e); }} onPointerMove={(e) => sc.current && scrub(e)} onPointerUp={() => (sc.current = null)}>
            <div className="relative h-[5px] rounded-full bg-white/20">
              <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${(pos / tr.len) * 100}%` }} />
              <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: `${(pos / tr.len) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[12px] tabular-nums text-white/55"><span>{fmt(pos)}</span><span>-{fmt(tr.len - pos)}</span></div>
          </div>
          <div data-fade className="mt-4 flex items-center justify-between px-6">
            <button type="button" aria-label="Previous" onClick={() => skip(-1)} className="grid h-14 w-14 place-items-center rounded-full active:scale-90 transition-transform"><SkipIcon dir={-1} /></button>
            <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)} className="grid h-20 w-20 place-items-center rounded-full bg-white text-[#0e0f14] transition-transform duration-150 active:scale-90"><PlayIcon playing={playing} size={28} /></button>
            <button type="button" aria-label="Next" onClick={() => skip(1)} className="grid h-14 w-14 place-items-center rounded-full active:scale-90 transition-transform"><SkipIcon dir={1} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayIcon({ playing, size }: { playing: boolean; size: number }) {
  return playing ? (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden fill="currentColor"><rect x="3.5" y="2.5" width="3.2" height="11" rx="1" /><rect x="9.3" y="2.5" width="3.2" height="11" rx="1" /></svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden fill="currentColor"><path d="M4.5 2.8v10.4c0 .6.7 1 1.2.7l8-5.2c.5-.3.5-1 0-1.4l-8-5.2c-.5-.3-1.2 0-1.2.7z" /></svg>
  );
}
function SkipIcon({ dir }: { dir: 1 | -1 }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden fill="currentColor" style={{ transform: dir < 0 ? "scaleX(-1)" : undefined }}>
      <path d="M3 6.5v11c0 .7.8 1.1 1.3.7L11 13v4.5c0 .7.8 1.1 1.3.7l7.5-5.5c.5-.4.5-1.1 0-1.4L12.3 5.8c-.5-.4-1.3 0-1.3.7V11L4.3 5.8C3.8 5.4 3 5.8 3 6.5z" />
    </svg>
  );
}

/** four bars that dance while it plays */
function Eq({ on }: { on: boolean }) {
  return (
    <span aria-hidden className="inline-flex h-3.5 items-end gap-[2px]">
      {[0, 1, 2, 3].map((i) => <span key={i} className={`tide-eq w-[3px] rounded-full bg-current ${on ? "" : "is-off"}`} style={{ animationDelay: `${i * -0.23}s` }} />)}
    </span>
  );
}
