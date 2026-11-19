"use client";

/*
 * The penthouse, drawn in thin lines like an architect's plan: every room glows faintly, the one you're
 * in glows amber, and choosing one flies the film there. Outside the walls: the city, and the sunrise.
 */
import { content, href } from "@/lib/content";

const KEYS = ["hero", "services", "web", "mobile", "how", "originals", "close"] as const;

// x, y, w, h for each room, in a 640 × 400 drawing
const ROOMS: Record<number, [number, number, number, number]> = {
  2: [150, 96, 170, 112],
  3: [320, 96, 170, 112],
  4: [150, 208, 190, 100],
  5: [340, 208, 150, 100],
};

export function goToScene(i: number) {
  if (document.querySelector("[data-scene]")) window.dispatchEvent(new CustomEvent("film:goto", { detail: i }));
  else window.location.href = href(i === 0 ? "/" : `/#${["top", "services", "web", "mobile", "how", "originals", "contact"][i]}`);
}

export function FloorPlan({ current, onPick, compact = false }: { current: string | null; onPick?: () => void; compact?: boolean }) {
  const rooms = content.map.rooms;
  const at = KEYS.indexOf((current ?? "") as (typeof KEYS)[number]);
  const pick = (i: number) => {
    onPick?.();
    // let the sheet close first
    window.setTimeout(() => goToScene(i), 220);
  };
  const Room = ({ i }: { i: number }) => {
    const [x, y, w, h] = ROOMS[i];
    const on = i === at;
    return (
      <g className="plan-room" role="button" tabIndex={0} aria-label={rooms[i]} aria-current={on ? "true" : undefined} onClick={() => pick(i)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick(i))}>
        <rect x={x} y={y} width={w} height={h} className={on ? "plan-on" : ""} />
        <text x={x + 14} y={y + 26}>{rooms[i]}</text>
        {on && <circle cx={x + w - 18} cy={y + 20} r="4" className="plan-dot" />}
      </g>
    );
  };
  return (
    <svg viewBox="0 0 640 400" className={`floor-plan w-full ${compact ? "compact max-h-[240px]" : ""}`} role="group" aria-label="Map of the studio">
      {/* the city around the building */}
      {Array.from({ length: 70 }, (_, k) => {
        const x = (k * 97) % 640, y = (k * 53) % 400;
        const inside = x > 96 && x < 544 && y > 50 && y < 352;
        return inside ? null : <circle key={k} cx={x} cy={y} r={k % 5 ? 1 : 1.6} className="plan-city" />;
      })}
      {/* terrace: the band around the rooms */}
      <g className="plan-room" role="button" tabIndex={0} aria-label={rooms[1]} aria-current={at === 1 ? "true" : undefined} onClick={() => pick(1)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick(1))}>
        <rect x="110" y="60" width="420" height="282" className={`plan-terrace ${at === 1 ? "plan-on" : ""}`} />
        <text x="126" y="84">{rooms[1]}</text>
        {at === 1 && <circle cx="512" cy="78" r="4" className="plan-dot" />}
      </g>
      {[2, 3, 4, 5].map((i) => <Room key={i} i={i} />)}
      {/* outside, and the sunrise */}
      <g className="plan-room plan-out" role="button" tabIndex={0} aria-label={rooms[0]} onClick={() => pick(0)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick(0))}>
        <rect x="0" y="352" width="200" height="48" className="plan-hit" />
        <text x="16" y="384" className={at === 0 ? "plan-text-on" : ""}>{rooms[0]}</text>
        {at === 0 && <circle cx="8" cy="380" r="3.5" className="plan-dot" />}
      </g>
      <g className="plan-room plan-out" role="button" tabIndex={0} aria-label={rooms[6]} onClick={() => pick(6)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick(6))}>
        <rect x="520" y="0" width="120" height="50" className="plan-hit" />
        <circle cx="600" cy="26" r="9" className="plan-sun" />
        <text x="580" y="32" textAnchor="end" className={at === 6 ? "plan-text-on" : ""}>{rooms[6]}</text>
      </g>
    </svg>
  );
}
