"use client";

/*
 * The dashboard on the studio monitor. A real, working little web app for an imaginary hotel group,
 * laid out like the screen in the film (a sidebar, three figures, a chart, two cards on the right) so it
 * can sit on that screen without a seam. In the room it just lives; up close you can use it.
 */
import { useEffect, useMemo, useState } from "react";

const W = 1200, H = 720;

const SERIES: Record<string, { label: string; pts: number[]; ticks: string[] }> = {
  Week: { label: "Bookings this week", pts: [42, 51, 47, 63, 58, 79, 88], ticks: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  Month: { label: "Revenue this month", pts: [18, 26, 23, 35, 31, 44, 52, 49, 61, 58, 70, 76], ticks: ["1", "", "", "8", "", "", "15", "", "", "22", "", "30"] },
  Year: { label: "Revenue this year", pts: [22, 30, 27, 38, 36, 49, 64, 57, 48, 55, 69, 81], ticks: ["Jan", "", "Mar", "", "May", "", "Jul", "", "Sep", "", "Nov", ""] },
};

function path(pts: number[], w: number, h: number) {
  const max = 100;
  const xy = pts.map((p, i) => [(i / (pts.length - 1)) * w, h - (p / max) * h] as const);
  // smooth curve through the points
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1], [x1, y1] = xy[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return { d, xy };
}

export function Dashboard({ interactive = false }: { interactive?: boolean }) {
  const [tab, setTab] = useState<keyof typeof SERIES>("Year");
  const [view, setView] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [seated, setSeated] = useState(14);

  // the numbers keep moving, gently
  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      if (Math.random() < 0.35) setSeated((s) => Math.max(9, Math.min(22, s + (Math.random() < 0.55 ? 1 : -1))));
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const s = SERIES[tab];
  const cw = 560, ch = 230;
  const { d, xy } = useMemo(() => path(s.pts, cw, ch), [s]);
  const bookings = 128 + (tick % 7);
  const revenue = (18.4 + (tick % 5) * 0.1).toFixed(1);

  const nav = ["Overview", "Bookings", "Guests", "Reports"];
  const stats = [
    { k: "Bookings today", v: String(bookings), c: "from-[#f6c27a] to-[#f19a62]" },
    { k: "Revenue", v: `$${revenue}k`, c: "from-[#f3a28d] to-[#ea7d6e]" },
    { k: "Occupancy", v: "92%", c: "from-[#a8b8ef] to-[#7f95dd]" },
  ];

  return (
    <div
      className="app-dash relative select-none overflow-hidden text-[#2b2522]"
      style={{ width: W, height: H, background: "linear-gradient(115deg,#f4ede8 0%,#f7ebe1 38%,#f9e3d3 70%,#f7d6c8 100%)", fontFamily: "var(--font-sans)" }}
      aria-hidden={!interactive}
    >
      {/* warm wash, like the screen in the photo */}
      <div className="absolute inset-0 [background:radial-gradient(60%_80%_at_0%_100%,rgb(246_190_120/0.55),transparent_70%)]" />

      {/* sidebar */}
      <div className="absolute left-0 top-0 flex h-full w-[220px] flex-col gap-1 px-7 pt-[150px]">
        {nav.map((n, i) => (
          <button
            key={n}
            type="button"
            tabIndex={interactive ? 0 : -1}
            onClick={() => interactive && setView(i)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[17px] transition-colors duration-300 ${view === i ? "bg-white/70 text-[#2b2522] shadow-[0_2px_10px_rgb(120_80_50/0.08)]" : "text-[#2b2522]/55 hover:text-[#2b2522]/80"}`}
          >
            <span className={`h-4 w-4 rounded-full border-[2px] ${view === i ? "border-[#2b2522]/70" : "border-[#2b2522]/35"}`} />
            {n}
          </button>
        ))}
      </div>

      {/* three figures */}
      <div className="absolute left-[262px] top-[48px] flex gap-[22px]">
        {stats.map((st, i) => (
          <div key={st.k} className="w-[170px] rounded-[22px] bg-white/75 p-5 shadow-[0_6px_24px_rgb(120_80_50/0.08)]" style={{ width: i === 0 ? 166 : 170 }}>
            <div className={`mb-4 h-10 w-10 rounded-[11px] bg-gradient-to-br ${st.c}`} />
            <p className="text-[13px] text-[#2b2522]/55">{st.k}</p>
            <p className="mt-0.5 text-[26px] font-[500] tabular-nums tracking-[-0.02em]">{st.v}</p>
          </div>
        ))}
      </div>

      {/* the chart */}
      <div className="absolute left-[262px] top-[262px] h-[408px] w-[555px] rounded-[24px] bg-white/80 p-7 shadow-[0_8px_30px_rgb(120_80_50/0.08)]">
        <div className="flex items-center justify-between">
          <p className="text-[17px] font-[500]">{s.label}</p>
          <div className="flex gap-1 rounded-full bg-[#2b2522]/[0.05] p-1">
            {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map((t) => (
              <button key={t} type="button" tabIndex={interactive ? 0 : -1} onClick={() => interactive && setTab(t)} className={`rounded-full px-3 py-1 text-[13px] transition-colors duration-300 ${tab === t ? "bg-white text-[#2b2522] shadow-sm" : "text-[#2b2522]/50"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <svg viewBox={`-6 -10 ${cw + 12} ${ch + 40}`} className="mt-6 h-[300px] w-full overflow-visible" onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="dash-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#f2a56a" stopOpacity="0.35" />
              <stop offset="1" stopColor="#f2a56a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="dash-line" x1="0" x2="1">
              <stop offset="0" stopColor="#d9705d" />
              <stop offset="0.6" stopColor="#6b4a5a" />
              <stop offset="1" stopColor="#ef9b52" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <line key={g} x1="0" x2={cw} y1={ch * g} y2={ch * g} stroke="#2b2522" strokeOpacity="0.07" />
          ))}
          <path key={tab + "f"} d={`${d} L${cw},${ch} L0,${ch} Z`} fill="url(#dash-fill)" className="dash-fade" />
          <path key={tab} d={d} fill="none" stroke="url(#dash-line)" strokeWidth="3" strokeLinecap="round" className="dash-draw" pathLength={1} />
          {s.ticks.map((t, i) => (
            <text key={i} x={(i / (s.ticks.length - 1)) * cw} y={ch + 28} textAnchor="middle" fontSize="12" fill="#2b2522" fillOpacity="0.4">{t}</text>
          ))}
          {interactive &&
            xy.map(([x, y], i) => (
              <g key={i} onMouseEnter={() => setHover(i)}>
                <rect x={x - cw / s.pts.length / 2} y={-10} width={cw / s.pts.length} height={ch + 10} fill="transparent" />
                {hover === i && (
                  <>
                    <line x1={x} x2={x} y1={0} y2={ch} stroke="#2b2522" strokeOpacity="0.15" strokeDasharray="3 4" />
                    <circle cx={x} cy={y} r="6" fill="#fff" stroke="#e0835f" strokeWidth="3" />
                    <g transform={`translate(${Math.min(cw - 70, Math.max(0, x - 35))},${Math.max(-6, y - 46)})`}>
                      <rect width="70" height="30" rx="9" fill="#2b2522" />
                      <text x="35" y="20" textAnchor="middle" fontSize="13" fill="#fff">{s.pts[i]}{tab === "Week" ? "" : "k"}</text>
                    </g>
                  </>
                )}
              </g>
            ))}
        </svg>
      </div>

      {/* two cards on the right */}
      <div className="absolute right-[44px] top-[48px] flex h-[300px] w-[300px] flex-col justify-end rounded-[26px] bg-gradient-to-br from-[#f8c98a] via-[#f3a07f] to-[#ec8576] p-6 text-white shadow-[0_10px_30px_rgb(200_100_80/0.2)]">
        <span className="dash-live mb-auto inline-flex w-max items-center gap-2 rounded-full bg-white/25 px-3 py-1 text-[13px]"><i className="h-2 w-2 rounded-full bg-white" />Live</span>
        <p className="text-[15px] text-white/85">Tables seated now</p>
        <p className="text-[44px] font-[500] tabular-nums leading-none tracking-[-0.03em]">{seated}</p>
      </div>
      <div className="absolute bottom-[50px] right-[44px] flex h-[300px] w-[300px] flex-col justify-end rounded-[26px] bg-gradient-to-br from-[#bfe0e2] via-[#a9bdeb] to-[#8798e0] p-6 text-white shadow-[0_10px_30px_rgb(90_110_200/0.2)]">
        <p className="text-[15px] text-white/85">Next arrival</p>
        <p className="text-[30px] font-[500] leading-tight tracking-[-0.02em]">18:30 · Party of 6</p>
        <p className="mt-2 text-[14px] text-white/80">Window table, anniversary</p>
      </div>
    </div>
  );
}

export const DASH_SIZE = { w: W, h: H };
