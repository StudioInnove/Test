"use client";

/*
 * Stack: a little game for the phone. A block glides back and forth; tap to drop it on the tower. Whatever
 * hangs over the edge breaks off and falls away, so the next block is only as wide as what you landed.
 * Land it almost exactly and it counts as perfect: the block keeps its width and the tower glows.
 * The sky deepens as you climb. Everything moves with GSAP.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";

const W = 390, H = 844, BH = 34, BASE_W = 210, FLOOR = 640;
type Block = { x: number; w: number };
// warm clay and amber tones that drift as the tower grows
const hue = (i: number) => `hsl(${(20 + 18 * Math.sin(i * 0.55)).toFixed(0)} ${(58 + 10 * Math.cos(i * 0.4)).toFixed(0)}% ${(64 + 8 * Math.sin(i * 0.8)).toFixed(0)}%)`;

export function StackGame({ live, active }: { live: boolean; active: boolean }) {
  const [state, setState] = useState<"title" | "play" | "over">("title");
  const [tower, setTower] = useState<Block[]>([{ x: (W - BASE_W) / 2, w: BASE_W }]);
  const [best, setBest] = useState(0);
  const [perfect, setPerfect] = useState(0);
  const mover = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const self = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0 });
  const tween = useRef<gsap.core.Tween | null>(null);
  const level = tower.length;
  const top = tower[tower.length - 1];

  // the next block glides from side to side, a little faster each level
  const glide = useCallback((w: number, lvl: number) => {
    const { gsap } = getGsap();
    tween.current?.kill();
    // it always stays partly over the tower's reach, so a drop is never hopeless
    const from = lvl % 2 ? -w * 0.55 : W - w * 0.45;
    const to = lvl % 2 ? W - w * 0.45 : -w * 0.55;
    pos.current.x = from;
    tween.current = gsap.fromTo(pos.current, { x: from }, {
      x: to, duration: Math.max(0.9, 2.1 - lvl * 0.06), ease: "sine.inOut", repeat: -1, yoyo: true,
      onUpdate: () => { if (mover.current) mover.current.style.transform = `translateX(${pos.current.x}px)`; },
    });
  }, []);

  useEffect(() => {
    if (state !== "play" || !active) { tween.current?.pause(); return; }
    tween.current?.resume();
  }, [state, active]);
  useEffect(() => () => { tween.current?.kill(); }, []);

  // the camera rises with the tower
  useLayoutEffect(() => {
    const lift = Math.max(0, level - 9) * BH;
    getGsap().gsap.to(world.current, { y: lift, duration: 0.6, ease: "power3.out" });
  }, [level]);

  const start = () => {
    const first = [{ x: (W - BASE_W) / 2, w: BASE_W }];
    setTower(first);
    setPerfect(0);
    setState("play");
    requestAnimationFrame(() => glide(BASE_W, 1));
  };

  const drop = () => {
    if (!live) return;
    if (state !== "play") return;
    const { gsap } = getGsap();
    const x = pos.current.x, w = top.w;
    const l = Math.max(x, top.x), r = Math.min(x + w, top.x + top.w);
    const over = r - l;
    if (over <= 0) {
      // missed completely: it falls, and that's the game
      tween.current?.kill();
      const el = mover.current!;
      gsap.to(el, { y: 500, rotation: x < top.x ? -40 : 40, duration: 0.9, ease: "power2.in" });
      setBest((b) => Math.max(b, level - 1));
      window.setTimeout(() => setState("over"), 700);
      return;
    }
    let nx = l, nw = over;
    const exact = Math.abs(x - top.x) < 5;
    if (exact) {
      nx = top.x; nw = top.w;
      setPerfect((p) => p + 1);
    } else {
      // the piece hanging over breaks off and falls away
      const cut = document.createElement("div");
      const cx = x < top.x ? x : r, cw = w - over;
      const y = FLOOR - level * BH;
      cut.style.cssText = `position:absolute;left:${cx}px;top:${y}px;width:${cw}px;height:${BH}px;border-radius:8px;background:${hue(level)};z-index:2`;
      world.current!.appendChild(cut);
      gsap.to(cut, { y: 520, rotation: x < top.x ? -35 : 35, opacity: 0.2, duration: 1.1, ease: "power2.in", onComplete: () => cut.remove() });
    }
    const next = [...tower, { x: nx, w: nw }];
    setTower(next);
    // the new block lands with a little settle; a perfect one glows
    requestAnimationFrame(() => {
      const placed = world.current?.querySelector(`[data-level="${next.length - 1}"]`);
      if (placed) gsap.fromTo(placed, { scaleY: 0.82, y: -6 }, { scaleY: 1, y: 0, duration: 0.45, ease: "back.out(3)", transformOrigin: "50% 100%" });
      if (exact && placed) gsap.fromTo(placed, { boxShadow: "0 0 0 0 rgba(255,220,180,0.9)" }, { boxShadow: "0 0 0 14px rgba(255,220,180,0)", duration: 0.7 });
    });
    glide(nw, next.length);
  };

  const score = level - 1;
  const sky = Math.min(1, score / 30);
  return (
    <div
      ref={self}
      onPointerUp={drop}
      className="relative h-full overflow-hidden"
      style={{ width: W, height: H, background: `linear-gradient(180deg, hsl(${225 + sky * 5} ${28 + sky * 20}% ${88 - sky * 72}%) 0%, hsl(${(24 - sky * 124 + 360) % 360} ${55 - sky * 15}% ${88 - sky * 62}%) 100%)`, transition: "background 1200ms ease", fontFamily: "var(--font-sans)", color: sky > 0.45 ? "#fff" : "#1d1b18" }}
    >
      {/* score */}
      <div className="pointer-events-none absolute inset-x-0 top-[96px] z-10 text-center">
        <p className="text-[64px] font-[600] leading-none tabular-nums tracking-[-0.04em]" style={{ opacity: state === "play" ? 1 : 0, transition: "opacity 400ms" }}>{score}</p>
        {perfect > 0 && state === "play" && <p className="mt-2 text-[13px] font-[500] opacity-60">{perfect} perfect</p>}
      </div>

      {/* the tower */}
      <div ref={world} className="absolute inset-0">
        {tower.map((b, i) => (
          <div key={i} data-level={i} className="absolute rounded-[8px]" style={{ left: b.x, top: FLOOR - i * BH, width: b.w, height: BH, background: hue(i), boxShadow: "inset 0 -3px 0 rgb(0 0 0 / 0.08), inset 0 2px 0 rgb(255 255 255 / 0.35)" }} />
        ))}
        {state === "play" && (
          <div ref={mover} className="absolute rounded-[8px]" style={{ left: 0, top: FLOOR - level * BH, width: top.w, height: BH, background: hue(level), boxShadow: "inset 0 -3px 0 rgb(0 0 0 / 0.08), inset 0 2px 0 rgb(255 255 255 / 0.35), 0 10px 24px -8px rgb(0 0 0 / 0.25)" }} />
        )}
        <div className="absolute inset-x-0 rounded-t-[30px]" style={{ top: FLOOR + BH, height: 400, background: "rgb(29 27 24 / 0.08)" }} />
      </div>

      {state !== "play" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-10 text-center" style={{ background: "rgb(246 242 236 / 0.55)", backdropFilter: "blur(6px)", color: "#1d1b18" }}>
          {state === "title" ? (
            <>
              <p className="text-[12px] font-[600] uppercase tracking-[0.22em] text-black/45">A little game</p>
              <p className="mt-2 text-[64px] font-[600] leading-none tracking-[-0.04em]">Stack</p>
              <p className="mt-4 text-[16px] text-black/60">Tap to drop each block. Line them up to keep them wide.</p>
            </>
          ) : (
            <>
              <p className="text-[12px] font-[600] uppercase tracking-[0.22em] text-black/45">Your tower</p>
              <p className="mt-2 text-[72px] font-[600] leading-none tabular-nums tracking-[-0.04em]">{Math.max(0, level - 1)}</p>
              <p className="mt-3 text-[15px] text-black/55">Best {best}</p>
            </>
          )}
          <button type="button" tabIndex={live ? 0 : -1} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); start(); }} className="mt-9 h-14 rounded-full bg-[#1d1b18] px-10 text-[16px] font-[600] text-white transition-transform duration-150 active:scale-95">
            {state === "title" ? "Play" : "Play again"}
          </button>
        </div>
      )}
    </div>
  );
}
