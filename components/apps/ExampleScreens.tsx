"use client";

/*
 * The screens behind "Anything you can imagine": a learning platform, a sales dashboard, and the screen
 * that turns your own idea into the first screen of an app or a site as you type it.
 * Every piece is marked data-b so the page can build the screen in front of you (see ServiceIndex);
 * charts carry data-draw (drawn on) and numbers data-count (counted up).
 */
import { useLayoutEffect, useRef } from "react";
import { getGsap } from "@/lib/gsap";
import { asset } from "@/lib/content";

const ACCENT = "#e0835f";
const ink = "#1d1b18";

/* ——— a learning platform ——— */
export function PlatformScreen() {
  const courses = [
    { t: "Drawing with light", n: "12 lessons", img: "int1", p: 0.4 },
    { t: "Small spaces, well planned", n: "9 lessons", img: "int3", p: 0.1 },
    { t: "Materials that last", n: "15 lessons", img: "house", p: 0 },
  ];
  return (
    <div className="flex h-full" style={{ width: 1200, height: 720, background: "#f8f6f3", color: ink, fontFamily: "var(--font-sans)" }}>
      <aside className="flex w-[220px] flex-col gap-1 px-5 pt-7" style={{ background: "#f0ede8" }}>
        <p data-b className="mb-6 flex items-center gap-2 text-[17px] font-[600]"><span className="h-6 w-6 rounded-[7px]" style={{ background: ACCENT }} />Fieldnotes</p>
        {["Home", "Courses", "Community", "Certificates"].map((n, i) => (
          <span data-b key={n} className="flex h-10 items-center rounded-[10px] px-3 text-[14px]" style={{ background: i === 0 ? "#fff" : "transparent", fontWeight: i === 0 ? 500 : 400, color: i === 0 ? ink : "#6f6a63" }}>{n}</span>
        ))}
      </aside>
      <main className="flex-1 p-7">
        <div className="flex items-center justify-between">
          <p data-b className="text-[26px] font-[600] tracking-[-0.02em]">Welcome back, Amara</p>
          <span data-b className="h-10 w-64 rounded-full bg-black/[0.05]" />
        </div>
        <div className="mt-6 grid grid-cols-[1fr_300px] gap-5">
          <div data-b className="flex overflow-hidden rounded-[20px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/sites/img/int2.webp")} alt="" className="h-[230px] w-[300px] object-cover" />
            <div className="flex flex-1 flex-col p-6">
              <p className="text-[13px] text-black/50">Continue learning</p>
              <p className="mt-1 text-[22px] font-[600] tracking-[-0.02em]">Drawing with light</p>
              <p className="mt-1 text-[14px] text-black/55">Lesson 5 · Morning sun</p>
              <div className="mt-auto flex items-center gap-3">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]"><span data-grow className="block h-full w-[62%] rounded-full" style={{ background: ACCENT }} /></span>
                <span className="text-[13px] tabular-nums">62%</span>
              </div>
              <span className="mt-4 grid h-10 w-36 place-items-center rounded-full text-[14px] font-[500] text-white" style={{ background: ink }}>Resume</span>
            </div>
          </div>
          <div data-b className="rounded-[20px] p-5 text-white" style={{ background: ink }}>
            <p className="text-[13px] text-white/60">Live today</p>
            <p className="mt-1 text-[20px] font-[600]">Q&amp;A with the tutors</p>
            <p className="mt-1 text-[14px] text-white/60">18:00 · 48 going</p>
            <div className="mt-6 flex -space-x-2">{["#e0835f", "#7c8fb3", "#8ea887", "#c9a25f"].map((c) => <span key={c} className="h-8 w-8 rounded-full ring-2 ring-[#1d1b18]" style={{ background: c }} />)}</div>
            <span className="mt-6 grid h-10 place-items-center rounded-full text-[14px] font-[500]" style={{ background: ACCENT }}>Save my seat</span>
          </div>
        </div>
        <p data-b className="mt-7 text-[16px] font-[600]">For you</p>
        <div className="mt-3 grid grid-cols-3 gap-5">
          {courses.map((c) => (
            <div data-b key={c.t} className="overflow-hidden rounded-[18px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(`/sites/img/${c.img}.webp`)} alt="" className="h-[130px] w-full object-cover" />
              <div className="p-4">
                <p className="text-[15px] font-[600]">{c.t}</p>
                <p className="mt-0.5 text-[13px] text-black/50">{c.n}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ——— a sales dashboard ——— */
const SALES = [22, 28, 25, 34, 31, 42, 39, 47, 52, 49, 58, 64];
export function AnalyticsScreen() {
  const cw = 640, ch = 260;
  const pts = SALES.map((v, i) => [(i * cw) / (SALES.length - 1), ch - (v / 70) * ch] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const kpi = [
    { k: "Revenue", v: 48210, pre: "£", d: "+18%" },
    { k: "Orders", v: 1284, pre: "", d: "+9%" },
    { k: "Returning", v: 38, pre: "", post: "%", d: "+4%" },
  ];
  const rows = [
    { t: "Morning cup", n: 412, img: "prod3" },
    { t: "Pour-over set", n: 268, img: "prod4" },
    { t: "Serving bowl", n: 197, img: "prod2" },
    { t: "Stoneware plate", n: 153, img: "prod1" },
  ];
  return (
    <div className="h-full p-7" style={{ width: 1200, height: 720, background: "#141518", color: "#ecebe8", fontFamily: "var(--font-sans)" }}>
      <div className="flex items-center justify-between">
        <p data-b className="text-[24px] font-[600] tracking-[-0.02em]">This month</p>
        <div data-b className="flex gap-1 rounded-full bg-white/[0.06] p-1 text-[13px]">{["Week", "Month", "Year"].map((x, i) => <span key={x} className="rounded-full px-3.5 py-1.5" style={{ background: i === 1 ? "#ecebe8" : "transparent", color: i === 1 ? "#141518" : "#8f8c87" }}>{x}</span>)}</div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-5">
        {kpi.map((x) => (
          <div data-b key={x.k} className="rounded-[18px] bg-white/[0.04] p-5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <p className="text-[13px] text-white/50">{x.k}</p>
            <p className="mt-2 flex items-baseline gap-2 text-[36px] font-[600] leading-none tracking-[-0.02em] tabular-nums">
              <span>{x.pre}<span data-count={x.v}>{x.v.toLocaleString("en-GB")}</span>{x.post}</span>
              <span className="rounded-full px-2 py-0.5 text-[12px] font-[500]" style={{ background: "rgb(142 168 135 / 0.18)", color: "#a9c2a2" }}>{x.d}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-[1fr_340px] gap-5">
        <div data-b className="rounded-[18px] bg-white/[0.04] p-5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <p className="text-[15px] font-[500]">Revenue, day by day</p>
          <svg viewBox={`0 -10 ${cw} ${ch + 20}`} className="mt-4 w-full" aria-hidden>
            <defs><linearGradient id="ex-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={ACCENT} stopOpacity="0.35" /><stop offset="1" stopColor={ACCENT} stopOpacity="0" /></linearGradient></defs>
            {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2={cw} y1={ch * g} y2={ch * g} stroke="rgb(255 255 255 / 0.06)" />)}
            <path data-fade d={`${line} L${cw} ${ch} L0 ${ch} Z`} fill="url(#ex-a)" />
            <path data-draw d={line} fill="none" stroke={ACCENT} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="6" fill="#141518" stroke={ACCENT} strokeWidth="3" />
          </svg>
        </div>
        <div data-b className="rounded-[18px] bg-white/[0.04] p-5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <p className="text-[15px] font-[500]">Best sellers</p>
          <ul className="mt-4 flex flex-col gap-3.5">
            {rows.map((r) => (
              <li key={r.t} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(`/sites/img/${r.img}.webp`)} alt="" className="h-11 w-11 rounded-[10px] object-cover" />
                <span className="flex-1 text-[14px]">{r.t}</span>
                <span className="text-[14px] tabular-nums text-white/60">{r.n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ——— your idea, as a first screen ——— */
const SETS: [RegExp, string[], string][] = [
  [/book|class|appoint|reserv|salon|clinic|lesson/i, ["Book a session", "Your schedule", "Payments"], "Book in seconds"],
  [/shop|store|sell|product|brand|fashion|cloth/i, ["New in", "Your basket", "Orders"], "Shop the collection"],
  [/learn|course|school|teach|tutor/i, ["Lessons", "Your progress", "Certificates"], "Start learning"],
  [/fit|gym|run|yoga|health|train|sport/i, ["Today's workout", "Progress", "Classes"], "Start today"],
  [/food|restaurant|cafe|coffee|menu|bakery|bar/i, ["Menu", "Order ahead", "Rewards"], "Order now"],
  [/event|ticket|festival|club|gig|concert/i, ["What's on", "Your tickets", "Friends going"], "Get tickets"],
  [/team|project|task|work|crm|client/i, ["Projects", "Your tasks", "Reports"], "Get started"],
];

/** "a booking app for my yoga studio" → "Yoga Studio" */
export function ideaName(idea: string) {
  const s = idea.trim().replace(/[.!?]+$/, "");
  if (!s) return "";
  const m = s.match(/\b(?:for|called|named)\s+(?:my|our|a|an|the|people\s+who)?\s*(.+)$/i);
  const core = (m ? m[1] : s.replace(/^(?:an?|the|my|our)\s+/i, "")).split(/\s+/).slice(0, 3).join(" ");
  return core.replace(/\b\w/g, (c) => c.toUpperCase());
}
function parts(idea: string) {
  const hit = SETS.find(([re]) => re.test(idea));
  return hit ? { tiles: hit[1], cta: hit[2] } : { tiles: ["Home", "Explore", "Your space"], cta: "Get started" };
}

/** the screen fades its words through a light blur whenever they change */
function useSoft(dep: string) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    getGsap().gsap.fromTo(ref.current.querySelectorAll("[data-soft]"), { filter: "blur(6px)", opacity: 0.3 }, { filter: "blur(0px)", opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.03, overwrite: true });
  }, [dep]);
  return ref;
}

export function IdeaScreen({ idea, kind }: { idea: string; kind: "web" | "site" }) {
  const name = ideaName(idea) || "Your idea";
  const { tiles, cta } = parts(idea);
  const ref = useSoft(name + tiles[0]);
  const empty = !idea.trim();
  if (kind === "site") {
    return (
      <div ref={ref} className="relative h-full overflow-hidden" style={{ width: 1200, height: 720, background: "#fbfaf8", color: ink, fontFamily: "var(--font-sans)" }}>
        <div className="flex items-center justify-between px-14 pt-8">
          <p data-b data-soft className="text-[20px] font-[600]">{name}</p>
          <div data-b className="flex gap-8 text-[14px] text-black/55">{tiles.map((t) => <span key={t} data-soft>{t}</span>)}</div>
          <span data-b data-soft className="grid h-10 place-items-center rounded-full px-5 text-[14px] text-white" style={{ background: ACCENT }}>{cta}</span>
        </div>
        <div className="mx-auto mt-24 max-w-[820px] text-center">
          <p data-b data-soft className="text-[68px] font-[600] leading-[1.02] tracking-[-0.035em]" style={{ opacity: empty ? 0.25 : 1 }}>{empty ? "Your idea, here." : `${name}.`}</p>
          <p data-b data-soft className="mx-auto mt-6 max-w-[540px] text-[18px] text-black/55">{empty ? "Type it in, and watch the first page appear." : idea}</p>
          <span data-b data-soft className="mx-auto mt-9 grid h-[52px] w-max place-items-center rounded-full px-8 text-[15px] font-[500] text-white" style={{ background: ink }}>{cta}</span>
        </div>
        <div data-b className="absolute inset-x-[160px] bottom-[-90px] h-[220px] rounded-[24px] bg-gradient-to-br from-[#f4b478]/40 via-[#e0835f]/25 to-[#7c8fb3]/25" />
      </div>
    );
  }
  return (
    <div ref={ref} className="flex h-full" style={{ width: 1200, height: 720, background: "#f8f6f3", color: ink, fontFamily: "var(--font-sans)" }}>
      <aside className="flex w-[220px] flex-col gap-1 px-5 pt-7" style={{ background: "#f0ede8" }}>
        <p data-b data-soft className="mb-6 flex items-center gap-2 truncate text-[17px] font-[600]"><span className="h-6 w-6 shrink-0 rounded-[7px]" style={{ background: ACCENT }} />{name}</p>
        {tiles.map((n, i) => (
          <span data-b data-soft key={n} className="flex h-10 items-center rounded-[10px] px-3 text-[14px]" style={{ background: i === 0 ? "#fff" : "transparent", fontWeight: i === 0 ? 500 : 400 }}>{n}</span>
        ))}
      </aside>
      <main className="flex-1 p-8">
        <p data-b data-soft className="text-[30px] font-[600] tracking-[-0.02em]" style={{ opacity: empty ? 0.3 : 1 }}>{empty ? "Your idea, here." : `Welcome to ${name}`}</p>
        <p data-b data-soft className="mt-1 text-[15px] text-black/50">{empty ? "Type it in, and watch the first screen appear." : idea}</p>
        <div className="mt-7 grid grid-cols-3 gap-5">
          {tiles.map((t, i) => (
            <div data-b key={t} className="h-[170px] rounded-[20px] p-5" style={{ background: i === 0 ? ink : "#fff", color: i === 0 ? "#fff" : ink, boxShadow: i ? "0 0 0 1px rgb(0 0 0 / 0.06)" : "none" }}>
              <p data-soft className="text-[17px] font-[600]">{t}</p>
              <span className="mt-4 block h-2 w-24 rounded-full" style={{ background: i === 0 ? ACCENT : "rgb(0 0 0 / 0.08)" }} />
              <span className="mt-2 block h-2 w-16 rounded-full" style={{ background: i === 0 ? "rgb(255 255 255 / 0.25)" : "rgb(0 0 0 / 0.06)" }} />
            </div>
          ))}
        </div>
        <div data-b className="mt-5 grid h-[220px] grid-cols-[1fr_1fr] gap-5">
          <div className="rounded-[20px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06)]" />
          <div className="rounded-[20px] shadow-[0_0_0_1px_rgb(0_0_0/0.06)]" style={{ background: "linear-gradient(135deg, rgb(244 180 120 / 0.35), rgb(224 131 95 / 0.15))" }} />
        </div>
      </main>
    </div>
  );
}

export function PhoneIdea({ idea }: { idea: string }) {
  const name = ideaName(idea) || "Your idea";
  const { tiles, cta } = parts(idea);
  const ref = useSoft(name + tiles[0]);
  const empty = !idea.trim();
  return (
    <div ref={ref} className="relative h-full px-6 pt-[72px]" style={{ width: 390, height: 844, background: "#f6f2ec", color: ink, fontFamily: "var(--font-sans)" }}>
      <p data-b data-soft className="text-[13px] font-[500] uppercase tracking-[0.08em] text-black/45">{empty ? "Your app" : "Welcome to"}</p>
      <p data-b data-soft className="text-[34px] font-[600] leading-[1.05] tracking-[-0.03em]" style={{ opacity: empty ? 0.3 : 1 }}>{empty ? "Your idea, here." : name}</p>
      <div data-b className="mt-6 h-[220px] rounded-[28px] p-5 text-white" style={{ background: `linear-gradient(140deg, ${ACCENT}, #c9a25f)` }}>
        <p data-soft className="text-[22px] font-[600] leading-tight">{tiles[0]}</p>
        <span data-soft className="mt-28 inline-grid h-10 place-items-center rounded-full bg-white px-5 text-[14px] font-[600] text-[#1d1b18]">{cta}</span>
      </div>
      {tiles.slice(1).map((t) => (
        <div data-b key={t} className="mt-3 flex h-[76px] items-center gap-4 rounded-[22px] bg-white px-4 shadow-[0_2px_10px_rgb(0_0_0/0.04)]">
          <span className="h-11 w-11 rounded-[14px] bg-black/[0.05]" />
          <span data-soft className="text-[16px] font-[600]">{t}</span>
          <span className="ml-auto text-black/30">›</span>
        </div>
      ))}
      <div data-b className="absolute inset-x-6 bottom-9 flex h-16 items-center justify-around rounded-[24px] bg-white shadow-[0_8px_24px_rgb(0_0_0/0.08)]">
        {[0, 1, 2, 3].map((i) => <span key={i} className="h-6 w-6 rounded-[8px]" style={{ background: i === 0 ? ACCENT : "rgb(0 0 0 / 0.1)" }} />)}
      </div>
    </div>
  );
}
