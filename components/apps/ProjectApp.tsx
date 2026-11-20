"use client";

/*
 * Cadence: a team project tool, made as the studio's web-app demo. It is a real little app, drawn at
 * 1200×720 and scaled from outside.
 *
 * Board: drag a task to another column (or tap it to move it on). The other cards make room and settle
 * with GSAP Flip, the header's progress follows, and a toast confirms the move.
 * Insights: the numbers count up, the chart draws itself (DrawSVG), and dragging across it scrubs week by week.
 * ⌘K (or Ctrl K, or the search field): a command menu you can type into and use with the arrow keys.
 * Light and dark, from the moon in the corner.
 * Not interactive (on the monitor in the film): it quietly gets on with its week, one card at a time.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";

const W = 1200, H = 720;
export const PROJECT_SIZE = { w: W, h: H };

type Col = "backlog" | "doing" | "review" | "done";
type Tag = "Design" | "Build" | "Copy";
type Task = { id: number; title: string; tag: Tag; who: number; col: Col; due?: string; pri?: boolean };

const COLS: { id: Col; name: string }[] = [
  { id: "backlog", name: "Backlog" },
  { id: "doing", name: "In progress" },
  { id: "review", name: "Review" },
  { id: "done", name: "Done" },
];
const PEOPLE = [
  { n: "MK", c: "#e0835f" },
  { n: "SL", c: "#7c8fb3" },
  { n: "AR", c: "#8ea887" },
  { n: "JT", c: "#c9a25f" },
];
const SEED: Task[] = [
  { id: 1, title: "Write launch announcement", tag: "Copy", who: 1, col: "backlog", due: "Mon" },
  { id: 2, title: "Image optimisation", tag: "Build", who: 3, col: "backlog" },
  { id: 3, title: "FAQ answers", tag: "Copy", who: 1, col: "backlog", due: "Tue" },
  { id: 4, title: "Homepage hero animation", tag: "Design", who: 0, col: "doing", due: "Thu", pri: true },
  { id: 5, title: "Checkout flow", tag: "Build", who: 2, col: "doing", due: "Fri" },
  { id: 6, title: "Pricing page layout", tag: "Design", who: 0, col: "review", due: "Today", pri: true },
  { id: 7, title: "Accessibility pass", tag: "Build", who: 2, col: "review" },
  { id: 8, title: "Brand colour tokens", tag: "Design", who: 1, col: "done" },
  { id: 9, title: "Analytics events", tag: "Build", who: 3, col: "done" },
];
const NEW_TITLES = ["Social preview images", "404 page", "Newsletter sign-up", "Cookie banner copy", "Team page photos", "Search results page"];
const WEEKS = [6, 9, 8, 12, 11, 15, 14, 18];

const THEMES = {
  light: { bg: "#f8f6f3", side: "#f0ede8", card: "#ffffff", ink: "#1d1b18", sub: "#6f6a63", line: "rgb(29 27 24 / 0.08)", soft: "rgb(29 27 24 / 0.045)", col: "rgb(29 27 24 / 0.035)" },
  dark: { bg: "#141518", side: "#0f1012", card: "#1c1d21", ink: "#ecebe8", sub: "#8f8c87", line: "rgb(255 255 255 / 0.07)", soft: "rgb(255 255 255 / 0.05)", col: "rgb(255 255 255 / 0.025)" },
};
const TAGS: Record<Tag, string> = { Design: "#e0835f", Build: "#7c8fb3", Copy: "#8ea887" };
const ACCENT = "#e0835f";

export function ProjectApp({ interactive = false }: { interactive?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>(SEED);
  const [view, setView] = useState<"board" | "insights">("board");
  const [dark, setDark] = useState(false);
  const [filter, setFilter] = useState<Tag | null>(null);
  const [palette, setPalette] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [drag, setDrag] = useState<{ id: number; dx: number; dy: number; over: Col | null; at: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const flipState = useRef<unknown>(null);
  const nextId = useRef(100);
  const hovering = useRef(false);
  const t = dark ? THEMES.dark : THEMES.light;

  /** change the tasks, and let every card glide from where it was to where it lands */
  const change = useCallback((fn: (l: Task[]) => Task[]) => {
    const { Flip } = getGsap();
    // (a card just let go has already been measured where it was dropped)
    if (root.current && !flipState.current) flipState.current = Flip.getState(root.current.querySelectorAll("[data-card]"));
    setTasks(fn);
  }, []);
  useLayoutEffect(() => {
    const st = flipState.current;
    if (!st) return;
    flipState.current = null;
    const { Flip } = getGsap();
    Flip.from(st as Parameters<typeof Flip.from>[0], {
      duration: 0.6, ease: "power3.inOut", nested: true, prune: true,
      onEnter: (els) => getGsap().gsap.fromTo(els, { opacity: 0, scale: 0.92, y: -8 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" }),
    });
  }, [tasks]);

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((l) => [...l.slice(-2), { id, text }]);
    window.setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), 2600);
  }, []);

  const move = useCallback((id: number, col: Col, at = -1, quiet = false) => {
    change((l) => {
      const task = l.find((x) => x.id === id);
      if (!task) return l;
      const rest = l.filter((x) => x.id !== id);
      const moved = { ...task, col };
      const inCol = rest.filter((x) => x.col === col);
      const before = at < 0 || at >= inCol.length ? null : inCol[at];
      const idx = before ? rest.indexOf(before) : rest.length;
      return [...rest.slice(0, idx), moved, ...rest.slice(idx)];
    });
    const task = tasks.find((x) => x.id === id);
    if (!quiet && task && task.col !== col) toast(col === "done" ? `“${task.title}” is done` : `Moved to ${COLS.find((c) => c.id === col)!.name}`);
  }, [change, tasks, toast]);

  const advance = (id: number) => {
    const task = tasks.find((x) => x.id === id);
    if (!task) return;
    const i = COLS.findIndex((c) => c.id === task.col);
    move(id, COLS[(i + 1) % COLS.length].id);
  };
  const addTask = () => {
    const id = nextId.current++;
    const title = NEW_TITLES[id % NEW_TITLES.length];
    change((l) => [{ id, title, tag: (["Design", "Build", "Copy"] as Tag[])[id % 3], who: id % 4, col: "backlog", due: "Next week" }, ...l]);
    setView("board");
    toast("New task added");
  };

  // on the monitor in the film: the week gets on by itself
  useEffect(() => {
    if (interactive) return;
    const id = window.setInterval(() => {
      setTasks((l) => {
        const open = l.filter((x) => x.col !== "done");
        if (!open.length) return SEED;
        const pick = open[Math.floor(Math.random() * open.length)];
        const i = COLS.findIndex((c) => c.id === pick.col);
        if (root.current) flipState.current = getGsap().Flip.getState(root.current.querySelectorAll("[data-card]"));
        return l.map((x) => (x.id === pick.id ? { ...x, col: COLS[i + 1].id } : x));
      });
    }, 3200);
    return () => clearInterval(id);
  }, [interactive]);

  // ⌘K / Ctrl K while you're using it
  useEffect(() => {
    if (!interactive) return;
    const key = (e: KeyboardEvent) => {
      const inside = hovering.current || root.current?.contains(document.activeElement);
      if (!inside) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [interactive]);

  // dragging a card: it follows the pointer, the column under it lights up, the others make room on drop
  const dragInfo = useRef<{ id: number; x: number; y: number; k: number; moved: boolean } | null>(null);
  const colAt = (x: number, y: number, self: HTMLElement) => {
    self.style.pointerEvents = "none";
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-col]");
    self.style.pointerEvents = "";
    if (!el) return null;
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-card]")).filter((c) => c !== self);
    const at = cards.findIndex((c) => { const r = c.getBoundingClientRect(); return y < r.top + r.height / 2; });
    return { col: el.dataset.col as Col, at };
  };
  const onDown = (e: React.PointerEvent, task: Task) => {
    if (!interactive || e.button > 0) return;
    const k = root.current!.getBoundingClientRect().width / W;
    dragInfo.current = { id: task.id, x: e.clientX, y: e.clientY, k, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = dragInfo.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / d.k, dy = (e.clientY - d.y) / d.k;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    d.moved = true;
    const hit = colAt(e.clientX, e.clientY, e.currentTarget as HTMLElement);
    setDrag({ id: d.id, dx, dy, over: hit?.col ?? null, at: hit?.at ?? -1 });
  };
  const onUp = (e: React.PointerEvent) => {
    const d = dragInfo.current;
    dragInfo.current = null;
    if (!d) return;
    if (!d.moved) return advance(d.id);
    const hit = colAt(e.clientX, e.clientY, e.currentTarget as HTMLElement);
    // let go: the card is measured where it is under the pointer, then glides into its place
    const el = e.currentTarget as HTMLElement;
    if (root.current) flipState.current = getGsap().Flip.getState(root.current.querySelectorAll("[data-card]"));
    el.style.transform = "";
    setDrag(null);
    if (hit) move(d.id, hit.col, hit.at);
    else setTasks((l) => [...l]);
  };

  const shown = tasks.filter((x) => !filter || x.tag === filter);
  const done = tasks.filter((x) => x.col === "done").length;
  const pct = Math.round((done / tasks.length) * 100);

  // commands
  const commands = useMemo(() => [
    { k: "New task", hint: "Adds it to the backlog", run: addTask },
    { k: view === "board" ? "Go to Insights" : "Go to Board", hint: "Switch view", run: () => setView((v) => (v === "board" ? "insights" : "board")) },
    { k: dark ? "Switch to light" : "Switch to dark", hint: "Theme", run: () => setDark((x) => !x) },
    { k: "Move everything in Review to Done", hint: "Batch", run: () => { const ids = tasks.filter((x) => x.col === "review").map((x) => x.id); if (!ids.length) return toast("Nothing in Review"); change((l) => l.map((x) => (ids.includes(x.id) ? { ...x, col: "done" } : x))); setView("board"); toast(`${ids.length} tasks done`); } },
    { k: "Show only Design", hint: "Filter", run: () => { setFilter("Design"); setView("board"); } },
    { k: "Show only Build", hint: "Filter", run: () => { setFilter("Build"); setView("board"); } },
    { k: "Clear filter", hint: "Filter", run: () => setFilter(null) },
  ], [view, dark, tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={root}
      className="relative select-none overflow-hidden"
      style={{ width: W, height: H, background: t.bg, color: t.ink, fontFamily: "var(--font-sans)", transition: "background-color 500ms ease, color 500ms ease" }}
      aria-hidden={!interactive}
      onPointerEnter={() => (hovering.current = true)}
      onPointerLeave={() => (hovering.current = false)}
    >
      <div className="flex h-full">
        {/* sidebar */}
        <aside className="flex w-[232px] shrink-0 flex-col px-4 pb-4 pt-5" style={{ background: t.side, borderRight: `1px solid ${t.line}`, transition: "background-color 500ms ease" }}>
          <div className="flex items-center gap-2.5 px-2">
            <span className="grid h-7 w-7 place-items-center rounded-[8px]" style={{ background: t.ink }}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M2 9.5c2-5 8-5 10 0" fill="none" stroke={t.bg} strokeWidth="2" strokeLinecap="round" /><circle cx="7" cy="9.5" r="1.6" fill={ACCENT} /></svg>
            </span>
            <span className="text-[16px] font-[600] tracking-[-0.01em]">Cadence</span>
          </div>
          <button type="button" tabIndex={interactive ? 0 : -1} onClick={() => setPalette(true)} className="mt-5 flex h-9 items-center gap-2 rounded-[10px] px-3 text-left text-[14px]" style={{ background: t.soft, color: t.sub }}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M9.2 9.2L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Search or jump to…
            <span className="ml-auto rounded-[5px] px-1.5 py-0.5 text-[11px]" style={{ background: t.card, boxShadow: `0 0 0 1px ${t.line}` }}>⌘K</span>
          </button>
          <nav className="mt-6 flex flex-col gap-0.5 text-[14px]">
            {[["Inbox", "3"], ["My tasks", ""], ["Updates", ""]].map(([n, c]) => (
              <span key={n} className="flex h-9 items-center justify-between rounded-[10px] px-3" style={{ color: t.sub }}>{n}{c && <span className="rounded-full px-1.5 text-[11px] font-[600] text-white" style={{ background: ACCENT }}>{c}</span>}</span>
            ))}
          </nav>
          <p className="mt-6 px-3 text-[12px] font-[500] uppercase tracking-[0.06em]" style={{ color: t.sub }}>Projects</p>
          <div className="mt-2 flex flex-col gap-0.5 text-[14px]">
            {[["Website relaunch", ACCENT, true], ["Mobile app", "#7c8fb3", false], ["Brand refresh", "#8ea887", false]].map(([n, c, on]) => (
              <span key={n as string} className="flex h-9 items-center gap-2.5 rounded-[10px] px-3" style={{ background: on ? t.card : "transparent", boxShadow: on ? `0 0 0 1px ${t.line}` : "none", fontWeight: on ? 500 : 400 }}>
                <i className="h-2 w-2 rounded-full" style={{ background: c as string }} />{n as string}
              </span>
            ))}
          </div>
          <div className="mt-auto flex items-center justify-between px-2">
            <div className="flex -space-x-1.5">{PEOPLE.map((p) => <Avatar key={p.n} p={p} ring={t.side} />)}</div>
            <button type="button" tabIndex={interactive ? 0 : -1} aria-label={dark ? "Light mode" : "Dark mode"} onClick={() => setDark((x) => !x)} className="grid h-9 w-9 place-items-center rounded-full" style={{ background: t.soft }}>
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="3.2" fill="currentColor" />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} d="M8 1.6v1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" transform={`rotate(${a} 8 8)`} />)}</svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M13 9.6A5.5 5.5 0 0 1 6.4 3a5.5 5.5 0 1 0 6.6 6.6z" fill="currentColor" /></svg>
              )}
            </button>
          </div>
        </aside>

        {/* main */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          <header className="flex h-[68px] shrink-0 items-center gap-4 px-7" style={{ borderBottom: `1px solid ${t.line}` }}>
            <h3 className="text-[18px] font-[600] tracking-[-0.01em]">Website relaunch</h3>
            <div className="flex rounded-full p-1 text-[13px]" style={{ background: t.soft }}>
              {(["board", "insights"] as const).map((v) => (
                <button key={v} type="button" tabIndex={interactive ? 0 : -1} onClick={() => setView(v)} className="h-7 rounded-full px-3.5 capitalize" style={{ background: view === v ? t.card : "transparent", boxShadow: view === v ? `0 1px 2px rgb(0 0 0 / 0.08), 0 0 0 1px ${t.line}` : "none", color: view === v ? t.ink : t.sub, transition: "all 300ms ease" }}>{v}</button>
              ))}
            </div>
            {filter && (
              <button type="button" tabIndex={interactive ? 0 : -1} onClick={() => setFilter(null)} className="flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] text-white" style={{ background: TAGS[filter] }}>{filter} <span aria-hidden>×</span></button>
            )}
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2.5 text-[13px]" style={{ color: t.sub }}>
                <span className="relative h-1.5 w-28 overflow-hidden rounded-full" style={{ background: t.soft }}>
                  <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: ACCENT, transition: "width 700ms cubic-bezier(0.23,1,0.32,1)" }} />
                </span>
                <span className="tabular-nums" style={{ color: t.ink }}>{pct}%</span>
              </div>
              <button type="button" tabIndex={interactive ? 0 : -1} onClick={addTask} className="flex h-9 items-center gap-1.5 rounded-full px-4 text-[14px] font-[500]" style={{ background: t.ink, color: t.bg }}>
                <span aria-hidden className="text-[16px] leading-none">+</span> New task
              </button>
            </div>
          </header>

          {view === "board" ? (
            <div className="grid min-h-0 flex-1 grid-cols-4 gap-3 p-5">
              {COLS.map((c) => {
                const list = shown.filter((x) => x.col === c.id);
                const lit = drag?.over === c.id;
                return (
                  <section key={c.id} data-col={c.id} className="flex min-h-0 flex-col rounded-[16px] p-2.5" style={{ background: lit ? `${ACCENT}14` : t.col, boxShadow: lit ? `inset 0 0 0 1.5px ${ACCENT}66` : "none", transition: "background-color 250ms ease, box-shadow 250ms ease" }}>
                    <p className="flex items-center gap-2 px-1.5 pb-2.5 pt-1 text-[13px] font-[500]">
                      <StatusDot col={c.id} />
                      {c.name}
                      <span className="tabular-nums" style={{ color: t.sub }}>{list.length}</span>
                    </p>
                    <div className="flex flex-col gap-2">
                      {list.map((task) => {
                        const d = drag?.id === task.id ? drag : null;
                        return (
                          <article
                            key={task.id}
                            data-card
                            data-flip-id={`c${task.id}`}
                            onPointerDown={(e) => onDown(e, task)}
                            onPointerMove={onMove}
                            onPointerUp={onUp}
                            onPointerCancel={() => { dragInfo.current = null; setDrag(null); }}
                            className={`relative rounded-[12px] p-3.5 ${interactive ? "cursor-grab active:cursor-grabbing" : ""}`}
                            style={{
                              background: t.card,
                              boxShadow: d ? "0 24px 48px -12px rgb(0 0 0 / 0.28), 0 0 0 1px rgb(0 0 0 / 0.04)" : `0 1px 2px rgb(0 0 0 / 0.04), 0 0 0 1px ${t.line}`,
                              transform: d ? `translate(${d.dx}px, ${d.dy}px) rotate(${Math.max(-4, Math.min(4, d.dx * 0.02))}deg) scale(1.03)` : undefined,
                              zIndex: d ? 30 : undefined,
                              touchAction: interactive ? "none" : undefined,
                              transition: d ? "box-shadow 200ms ease" : "box-shadow 300ms ease, background-color 500ms ease",
                            }}
                          >
                            <p className="text-[15px] font-[500] leading-[1.35]" style={{ textDecoration: task.col === "done" ? "line-through" : "none", textDecorationColor: t.sub, color: task.col === "done" ? t.sub : t.ink }}>{task.title}</p>
                            <div className="mt-3 flex items-center gap-2 text-[12.5px]">
                              <span className="rounded-full px-2 py-0.5 font-[500]" style={{ background: `${TAGS[task.tag]}22`, color: TAGS[task.tag] }}>{task.tag}</span>
                              {task.pri && <span aria-label="Priority" className="font-[700]" style={{ color: ACCENT }}>!</span>}
                              {task.due && <span style={{ color: task.due === "Today" ? ACCENT : t.sub }}>{task.due}</span>}
                              <span className="ml-auto"><Avatar p={PEOPLE[task.who]} ring={t.card} small /></span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <Insights t={t} done={done} total={tasks.length} />
          )}

          {/* toasts */}
          <div className="pointer-events-none absolute bottom-5 right-5 z-40 flex flex-col items-end gap-2">
            {toasts.map((x) => <Toast key={x.id} text={x.text} dark={dark} />)}
          </div>

          {palette && <Palette t={t} commands={commands} onClose={() => setPalette(false)} />}
        </main>
      </div>
    </div>
  );
}

function Avatar({ p, ring, small }: { p: { n: string; c: string }; ring: string; small?: boolean }) {
  return (
    <span className={`grid place-items-center rounded-full font-[600] text-white ${small ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]"}`} style={{ background: p.c, boxShadow: `0 0 0 2px ${ring}` }}>{p.n}</span>
  );
}

function StatusDot({ col }: { col: Col }) {
  const k = { backlog: 0, doing: 0.5, review: 0.75, done: 1 }[col];
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <circle cx="7" cy="7" r="5.5" fill="none" stroke={col === "done" ? ACCENT : "currentColor"} strokeOpacity={col === "done" ? 1 : 0.35} strokeWidth="1.5" strokeDasharray={col === "backlog" ? "2 2" : undefined} />
      {k > 0 && k < 1 && <path d={`M7 7 L7 3 A4 4 0 ${k > 0.5 ? 1 : 0} 1 ${7 + 4 * Math.sin(k * 2 * Math.PI)} ${7 - 4 * Math.cos(k * 2 * Math.PI)} Z`} fill={ACCENT} />}
      {k === 1 && <path d="M4.6 7.2l1.6 1.6 3.2-3.4" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function Toast({ text, dark }: { text: string; dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    getGsap().gsap.fromTo(ref.current, { y: 14, opacity: 0, filter: "blur(6px)", scale: 0.96 }, { y: 0, opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.5, ease: "power3.out" });
  }, []);
  return (
    <div ref={ref} className="flex items-center gap-2.5 rounded-[12px] px-4 py-3 text-[14px]" style={{ background: dark ? "#ecebe8" : "#1d1b18", color: dark ? "#1d1b18" : "#fff", boxShadow: "0 16px 40px -12px rgb(0 0 0 / 0.35)" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><circle cx="7" cy="7" r="7" fill={ACCENT} /><path d="M4.2 7.2l1.8 1.8 3.8-4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {text}
    </div>
  );
}

type Theme = (typeof THEMES)["light"];

function Palette({ t, commands, onClose }: { t: Theme; commands: { k: string; hint: string; run: () => void }[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = commands.filter((c) => c.k.toLowerCase().includes(q.toLowerCase()));
  useLayoutEffect(() => {
    input.current?.focus({ preventScroll: true });
    getGsap().gsap.fromTo(box.current, { y: -10, opacity: 0, scale: 0.97, filter: "blur(6px)" }, { y: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "power3.out" });
  }, []);
  const run = (i: number) => {
    const c = list[i];
    if (!c) return;
    onClose();
    c.run();
  };
  return (
    <div className="absolute inset-0 z-50 flex justify-center pt-[90px]" style={{ background: "rgb(0 0 0 / 0.18)" }} onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className="h-max w-[540px] overflow-hidden rounded-[16px]" style={{ background: t.card, boxShadow: `0 30px 80px -20px rgb(0 0 0 / 0.45), 0 0 0 1px ${t.line}` }}>
        <div className="flex items-center gap-3 px-5" style={{ borderBottom: `1px solid ${t.line}` }}>
          <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden style={{ color: t.sub }}><circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M9.2 9.2L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(list.length - 1, s + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
              if (e.key === "Enter") { e.preventDefault(); run(sel); }
              if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
            }}
            placeholder="Type a command…"
            aria-label="Command"
            className="h-[54px] flex-1 bg-transparent text-[16px] outline-none"
            style={{ color: t.ink }}
          />
          <span className="rounded-[5px] px-1.5 py-0.5 text-[11px]" style={{ color: t.sub, boxShadow: `0 0 0 1px ${t.line}` }}>esc</span>
        </div>
        <ul className="p-2">
          {list.length === 0 && <li className="px-3 py-3 text-[14px]" style={{ color: t.sub }}>No commands match</li>}
          {list.map((c, i) => (
            <li key={c.k}>
              <button type="button" onPointerEnter={() => setSel(i)} onClick={() => run(i)} className="flex h-11 w-full items-center justify-between rounded-[10px] px-3 text-left text-[14px]" style={{ background: i === sel ? t.soft : "transparent", color: t.ink }}>
                {c.k}
                <span className="text-[12px]" style={{ color: t.sub }}>{c.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Insights({ t, done, total }: { t: Theme; done: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(WEEKS.length - 1);
  const cw = 620, ch = 250, pad = 14;
  const pts = WEEKS.map((v, i) => [pad + (i * (cw - pad * 2)) / (WEEKS.length - 1), ch - pad - (v / 20) * (ch - pad * 2)] as const);
  const line = pts.map(([x, y], i) => (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]} ${ch} L${pts[0][0]} ${ch} Z`;
  const stats = [
    { k: "Done this week", v: WEEKS[at], s: "" },
    { k: "Average cycle time", v: 2.4, s: " days" },
    { k: "Project complete", v: Math.round((done / total) * 100), s: "%" },
  ];

  useLayoutEffect(() => {
    const { gsap } = getGsap();
    const ctx = gsap.context(() => {
      gsap.from("[data-in]", { y: 14, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.06 });
      gsap.from("[data-line]", { drawSVG: "0%", duration: 1.4, ease: "power2.inOut", delay: 0.2 });
      gsap.from("[data-area]", { opacity: 0, duration: 1.2, delay: 0.6 });
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const end = +el.dataset.count!;
        const o = { v: 0 };
        gsap.to(o, { v: end, duration: 1.2, ease: "power2.out", delay: 0.15, onUpdate: () => { el.textContent = end % 1 ? o.v.toFixed(1) : String(Math.round(o.v)); } });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  const scrub = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * cw;
    setAt(Math.max(0, Math.min(WEEKS.length - 1, Math.round(((x - pad) / (cw - pad * 2)) * (WEEKS.length - 1)))));
  };
  const [px, py] = pts[at];

  return (
    <div ref={ref} className="grid min-h-0 flex-1 grid-cols-[1fr_300px] gap-4 p-5">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.k} data-in className="rounded-[16px] p-5" style={{ background: t.card, boxShadow: `0 0 0 1px ${t.line}` }}>
              <p className="text-[13px]" style={{ color: t.sub }}>{s.k}</p>
              <p className="mt-2 text-[32px] font-[600] leading-none tracking-[-0.02em] tabular-nums"><span data-count={s.v} key={`${s.k}${s.v}`}>{s.v}</span><span className="text-[16px] font-[500]" style={{ color: t.sub }}>{s.s}</span></p>
            </div>
          ))}
        </div>
        <div data-in className="flex-1 rounded-[16px] p-5" style={{ background: t.card, boxShadow: `0 0 0 1px ${t.line}` }}>
          <div className="flex items-baseline justify-between">
            <p className="text-[15px] font-[500]">Tasks finished, week by week</p>
            <p className="text-[13px]" style={{ color: t.sub }}>Drag across the chart</p>
          </div>
          <svg viewBox={`0 0 ${cw} ${ch}`} className="mt-3 w-full touch-none" style={{ cursor: "ew-resize" }} onPointerMove={scrub} onPointerDown={scrub}>
            <defs>
              <linearGradient id="cad-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={ACCENT} stopOpacity="0.28" /><stop offset="1" stopColor={ACCENT} stopOpacity="0" /></linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2={cw} y1={ch * g} y2={ch * g} stroke={t.line} />)}
            <path data-area d={area} fill="url(#cad-area)" />
            <path data-line d={line} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <line x1={px} x2={px} y1="0" y2={ch} stroke={t.sub} strokeOpacity="0.35" strokeDasharray="3 4" />
            <circle cx={px} cy={py} r="6" fill={t.card} stroke={ACCENT} strokeWidth="2.5" />
            <g transform={`translate(${Math.min(cw - 116, Math.max(4, px - 58))} ${Math.max(4, py - 52)})`}>
              <rect width="112" height="38" rx="10" fill={t.ink} />
              <text x="56" y="24" textAnchor="middle" fontSize="13" fill={t.bg} fontFamily="var(--font-sans)">Week {at + 1} · {WEEKS[at]} done</text>
            </g>
          </svg>
        </div>
      </div>
      <div data-in className="rounded-[16px] p-5" style={{ background: t.card, boxShadow: `0 0 0 1px ${t.line}` }}>
        <p className="text-[15px] font-[500]">Who&apos;s on what</p>
        <div className="mt-5 flex flex-col gap-5">
          {PEOPLE.map((p, i) => {
            const v = [5, 4, 6, 3][i];
            return (
              <div key={p.n} className="flex items-center gap-3">
                <Avatar p={p} ring={t.card} />
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full" style={{ background: t.soft }}>
                    <div data-in className="h-full rounded-full" style={{ width: `${v * 15}%`, background: p.c }} />
                  </div>
                </div>
                <span className="w-6 text-right text-[13px] tabular-nums" style={{ color: t.sub }}>{v}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-8 rounded-[12px] p-4 text-[13px] leading-[1.5]" style={{ background: t.soft, color: t.sub }}>
          On track to launch <span style={{ color: t.ink, fontWeight: 600 }}>Friday</span>. Two tasks need review.
        </div>
      </div>
    </div>
  );
}
