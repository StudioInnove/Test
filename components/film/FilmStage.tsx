"use client";

import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import { content } from "@/lib/content";
import { Soundscape } from "@/lib/sound";
import { BookCall } from "../BookCall";
import { GlassCard } from "../GlassCard";
import { BuildLog, StatusTrack, WaitlistForm } from "../Originals";
import { Words } from "../Words";
import { FilmEngine, type Manifest, type Shot } from "./engine";
import { SCENES, SEGMENTS, STARTS, TOTAL, WINDOWS, locate, sceneStart, type ClipId, type SceneId } from "./timeline";

const FADE = 0.16;
const AUTOPLAY_S = 9;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

export function FilmStage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<Soundscape | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canvasOn, setCanvasOn] = useState(false);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const track = trackRef.current!;
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    const mode: "d" | "m" = window.innerWidth < 900 || isMobile ? "m" : "d";
    let engine: FilmEngine | null = null;
    let raf = 0;
    let alive = true;
    let lenis: Lenis | null = null;
    let autoStart = -1;
    let auto = 0;
    let lastScene = -1;
    let lastClipKey = "";
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, px: 0.5, py: 0.5, tpx: 0.5, tpy: 0.5 };

    const overlays = Array.from(stage.querySelectorAll<HTMLElement>("[data-scene]"));
    const steps = Array.from(stage.querySelectorAll<HTMLElement>("[data-step]"));
    const onState = new Map<HTMLElement, boolean>();

    if (!reduce) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true, anchors: true, syncTouch: false });
    }

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
      mouse.tpx = e.clientX / window.innerWidth;
      mouse.tpy = e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const resize = () => {
      if (!engine) return;
      const dpr = Math.min(window.devicePixelRatio || 1, mode === "m" ? 2 : 1.5);
      engine.resize(stage.clientWidth, stage.clientHeight, dpr);
    };
    window.addEventListener("resize", resize);

    const position = () => {
      const r = track.getBoundingClientRect();
      const span = track.offsetHeight - stage.offsetHeight;
      return clamp(-r.top / Math.max(1, span)) * TOTAL;
    };

    const shotAt = (pos: number): { shot: Shot; clip?: ClipId } => {
      const { index, local } = locate(pos);
      const seg = SEGMENTS[index];
      if (seg.kind === "clip") {
        let t = local;
        if (seg.id === "c0") t = Math.max(local, auto);
        return { shot: { kind: "clip", clip: seg.id, from: seg.from, to: seg.to, t: clamp(t) }, clip: seg.id };
      }
      const rest = smooth(clamp(local / 0.25)) * smooth(clamp((1 - local) / 0.15));
      // At the very top, before the time-lapse has finished, keep showing c0.
      return { shot: { kind: "hold", still: seg.still, rest: reduce ? 0 : rest } };
    };

    const setOverlay = (el: HTMLElement, vis: number) => {
      el.style.opacity = String(vis);
      el.style.visibility = vis < 0.01 ? "hidden" : "visible";
      el.style.pointerEvents = vis > 0.6 ? "auto" : "none";
      const on = vis > 0.35;
      if (onState.get(el) !== on) {
        onState.set(el, on);
        el.classList.toggle("on", on);
      }
    };

    const tick = (now: number) => {
      if (!alive) return;
      lenis?.raf(now);
      const pos = position();
      const time = now / 1000;
      if (autoStart >= 0) auto = clamp((time - autoStart) / AUTOPLAY_S);
      const autoEase = auto < 0.5 ? 4 * auto ** 3 : 1 - (-2 * auto + 2) ** 3 / 2;
      auto = autoStart >= 0 ? autoEase : 0;

      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      mouse.px += (mouse.tpx - mouse.px) * 0.08;
      mouse.py += (mouse.tpy - mouse.py) * 0.08;

      if (engine?.ready) {
        const { shot, clip } = shotAt(pos);
        engine.paint(shot, { time, mouse: [mouse.x, mouse.y], pointer: [mouse.px, mouse.py], motion: reduce ? 0 : 1 });
        // keep the nearest clips loading first
        const key = clip ?? `h${locate(pos).index}`;
        if (key !== lastClipKey) {
          lastClipKey = key;
          const i = locate(pos).index;
          const order: ClipId[] = [];
          for (let r = 0; r < SEGMENTS.length; r++) {
            for (const j of [i + r, i - r]) {
              const s = SEGMENTS[j];
              if (s && s.kind === "clip" && !order.includes(s.id)) order.push(s.id);
            }
          }
          engine.prioritise(order);
        }
      }

      // text
      for (const el of overlays) {
        const id = el.dataset.scene as SceneId;
        const [a, b] = WINDOWS[id];
        let vis = Math.min(clamp((pos - a) / FADE + 1), clamp((b - pos) / FADE));
        if (id === "hero") vis = clamp((b - pos) / FADE);
        if (id === "hero" && !loadedRef.current) vis = 0;
        setOverlay(el, smooth(vis));
      }
      // how-it-works steps light up across their hold
      const howStart = sceneStart("how");
      const howLen = SEGMENTS.find((s) => s.kind === "hold" && s.scene === "how")!.len;
      const hp = clamp((pos - howStart) / (howLen * 0.8));
      const active = Math.min(steps.length - 1, Math.floor(hp * steps.length));
      steps.forEach((s, i) => (s.dataset.state = i < active ? "done" : i === active ? "now" : "next"));

      // scrim behind the hero text
      if (scrimRef.current) scrimRef.current.style.opacity = String(clamp(1 - pos / 1.8) * 0.95 + 0.05);

      // HUD
      let scene = 0;
      SCENES.forEach((s, i) => {
        if (pos >= (s === "hero" ? 0 : WINDOWS[s][0] - 0.4)) scene = i;
      });
      const p = pos / TOTAL;
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(100 - p * 100);
      if (scene !== lastScene) {
        if (countRef.current) countRef.current.textContent = String(scene + 1).padStart(2, "0");
        if (lastScene !== -1) soundRef.current?.chime();
        lastScene = scene;
      }
      const inside = pos > STARTS[2] + SEGMENTS[2].len * 0.6 && pos < STARTS[12] + SEGMENTS[12].len * 0.5 ? 1 : 0;
      soundRef.current?.setPlace(inside);
      if (cueRef.current) cueRef.current.style.opacity = String(clamp(1 - pos / 0.35) * (loadedRef.current ? 1 : 0));

      raf = requestAnimationFrame(tick);
    };

    const loadedRef = { current: false };

    fetch("/film/manifest.json")
      .then((r) => r.json())
      .then(async (m: Manifest) => {
        if (!alive) return;
        engine = new FilmEngine(canvas, m, mode);
        engine.onProgress = (p) => setProgress(p);
        resize();
        const t0 = performance.now();
        await engine.loadStills(["s1", "s1n", "s2"]);
        if (!alive) return;
        const wait = Math.max(0, 700 - (performance.now() - t0));
        setTimeout(() => {
          setCanvasOn(true);
          setLoaded(true);
          loadedRef.current = true;
          autoStart = performance.now() / 1000 + 0.6;
        }, wait);
      })
      .catch(() => {
        setLoaded(true);
        loadedRef.current = true;
      });

    // never hold visitors on the loader for long
    const failsafe = window.setTimeout(() => {
      setLoaded(true);
      loadedRef.current = true;
      if (autoStart < 0) autoStart = performance.now() / 1000;
    }, 6000);

    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      lenis?.destroy();
      engine?.destroy();
    };
  }, []);

  // restore the visitor's sound choice (it only starts after they interact)
  useEffect(() => {
    return () => soundRef.current?.destroy();
  }, []);

  const toggleSound = async () => {
    if (!soundRef.current) soundRef.current = new Soundscape();
    const next = !sound;
    await soundRef.current.toggle(next);
    setSound(next);
    try {
      localStorage.setItem("si-sound", next ? "1" : "0");
    } catch {}
  };

  const { hero, services, how, originals, close, studio } = content;

  return (
    <div ref={trackRef} className="relative" style={{ height: `${(TOTAL + 1) * 100}svh` }}>
      {/* anchors for the nav */}
      <span id="top" className="absolute left-0 top-0" />
      <span id="services" className="absolute left-0" style={{ top: `calc((100% - 100svh) * ${sceneStart("services") / TOTAL})` }} />
      <span id="web" className="absolute left-0" style={{ top: `calc((100% - 100svh) * ${sceneStart("web") / TOTAL})` }} />
      <span id="how" className="absolute left-0" style={{ top: `calc((100% - 100svh) * ${sceneStart("how") / TOTAL})` }} />
      <span id="originals" className="absolute left-0" style={{ top: `calc((100% - 100svh) * ${(sceneStart("originals") + 0.1) / TOTAL})` }} />
      <span id="contact" className="absolute left-0" style={{ top: `calc((100% - 100svh) * ${(sceneStart("close") + 0.1) / TOTAL})` }} />

      <div ref={stageRef} className="sticky top-0 h-svh w-full overflow-hidden bg-ink">
        {/* First paint: the golden-hour still, before any script runs */}
        <picture>
          <source media="(max-width: 899px)" srcSet="/film/stills/s1-m.webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/film/stills/s1-d.webp"
            alt="A glass penthouse studio above a city at golden hour"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[60%_50%]"
          />
        </picture>
        <canvas
          ref={canvasRef}
          aria-hidden
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${canvasOn ? "opacity-100" : "opacity-0"}`}
        />

        {/* scrims for legibility */}
        <div ref={scrimRef} aria-hidden className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_85%_at_0%_0%,rgb(10_11_13/0.72),rgb(10_11_13/0.35)_42%,transparent_70%)] max-md:[background:linear-gradient(180deg,rgb(10_11_13/0.65),transparent_38%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-ink/80 via-ink/25 to-transparent md:h-[28%] md:from-ink/55" />

        {/* ---------- Scenes ---------- */}
        <section data-scene="hero" aria-label="Introduction" className="reveal absolute inset-0 isolate flex flex-col justify-end px-6 pb-[16svh] sm:px-10 md:justify-start md:px-[6vw] md:pb-0 md:pt-[24svh]" style={{ opacity: 0 }}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(10_11_13/0.85),rgb(10_11_13/0.35)_45%,transparent_70%)] md:[background:linear-gradient(90deg,rgb(10_11_13/0.55),rgb(10_11_13/0.2)_45%,transparent_65%)]" />
          <h1 className="display legible max-w-[12.5ch] text-[clamp(44px,6.6vw,108px)] text-paper">
            <Words text={hero.headline} />
          </h1>
          <p className="lede legible rise mt-6 max-w-[28ch] text-[clamp(18px,1.5vw,22px)]" style={{ ["--d" as string]: "650ms" }}>{hero.line}</p>
          <div className="rise mt-9 flex flex-wrap gap-3" style={{ ["--d" as string]: "800ms" }}>
            <BookCall>{hero.primary}</BookCall>
            <a href="#originals" className="btn btn-ghost">{hero.secondary}</a>
          </div>
        </section>

        <section data-scene="services" aria-label={services.heading} className="reveal absolute inset-0 flex items-center justify-center px-6 text-center" style={{ opacity: 0, visibility: "hidden" }}>
          <h2 className="display legible text-[clamp(44px,8vw,132px)]"><Words text={services.heading} /></h2>
        </section>

        <section data-scene="web" aria-label={services.web.title} className="absolute inset-0 flex items-end px-4 pb-6 sm:px-10 md:items-center md:px-[6vw] md:pb-0" style={{ opacity: 0, visibility: "hidden" }}>
          <div className="rise w-full md:w-[440px]">
            <GlassCard>
              <p className="eyebrow mb-3">01 — Services</p>
              <h2 className="display text-[clamp(38px,4vw,56px)]">{services.web.title}</h2>
              <p className="lede mt-4 text-[17px] leading-relaxed">{services.web.line}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {services.web.tags.map((t) => (
                  <li key={t} className="rounded-full bg-white/8 px-3.5 py-1.5 text-[13px] text-paper/85 ring-1 ring-white/12">{t}</li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </section>

        <section data-scene="mobile" aria-label={services.mobile.title} className="absolute inset-0 flex items-end px-4 pb-6 sm:px-10 md:items-center md:px-[6vw] md:pb-0" style={{ opacity: 0, visibility: "hidden" }}>
          <div className="rise w-full md:w-[440px]">
            <GlassCard>
              <p className="eyebrow mb-3">02 — Services</p>
              <h2 className="display text-[clamp(38px,4vw,56px)]">{services.mobile.title}</h2>
              <p className="lede mt-4 text-[17px] leading-relaxed">{services.mobile.line}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {services.mobile.tags.map((t) => (
                  <li key={t} className="rounded-full bg-white/8 px-3.5 py-1.5 text-[13px] text-paper/85 ring-1 ring-white/12">{t}</li>
                ))}
              </ul>
              <div className="mt-7"><BookCall size="sm">{services.cta}</BookCall></div>
            </GlassCard>
          </div>
        </section>

        <section data-scene="how" aria-label={how.heading} className="reveal absolute inset-0 isolate flex flex-col justify-end px-6 pb-[13svh] sm:px-10 md:px-[6vw] md:pb-[12svh]" style={{ opacity: 0, visibility: "hidden" }}>
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/45 to-transparent" />
          <h2 className="display legible mb-8 text-[clamp(38px,5vw,76px)] md:mb-12"><Words text={how.heading} /></h2>
          <ol className="relative grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4 md:gap-10">
            <span aria-hidden className="absolute inset-x-0 top-[5px] hidden h-px bg-white/15 md:block" />
            {how.steps.map((s, i) => (
              <li key={s.title} data-step={i} data-state="next" className="group relative pt-6 transition-opacity duration-500 data-[state=next]:opacity-45">
                <span aria-hidden className="absolute left-0 top-0 h-[11px] w-[11px] rounded-full bg-white/25 ring-4 ring-ink/40 transition-all duration-500 group-data-[state=done]:bg-amber/70 group-data-[state=now]:bg-amber group-data-[state=now]:shadow-[0_0_16px_4px_rgb(232_161_90/0.55)]" />
                <p className="eyebrow mb-2 text-paper/55">0{i + 1}</p>
                <p className="legible text-[22px] font-semibold tracking-[-0.02em] md:text-[26px]">{s.title}</p>
                <p className="legible mt-1.5 max-w-[24ch] text-[15px] leading-snug text-paper/75">{s.line}</p>
              </li>
            ))}
          </ol>
        </section>

        <section data-scene="originals" aria-label={originals.eyebrow} className="absolute inset-0 flex items-end px-4 pb-5 sm:px-10 md:items-center md:px-[6vw] md:pb-0" style={{ opacity: 0, visibility: "hidden" }}>
          <div className="rise w-full md:w-[480px]">
            <GlassCard tint="rgb(10 9 8 / 0.42)">
              <p className="eyebrow mb-3 text-amber/90">{originals.eyebrow}</p>
              <h2 className="display text-[clamp(32px,3.4vw,48px)]">{originals.heading}</h2>
              <div className="mt-7"><StatusTrack /></div>
              <div className="mt-7"><WaitlistForm source="film" /></div>
              <div className="mt-6 hidden border-t border-white/10 pt-5 sm:block"><BuildLog /></div>
            </GlassCard>
          </div>
        </section>

        <section data-scene="close" aria-label={close.heading} className="reveal absolute inset-0 isolate flex flex-col items-center justify-start px-6 pt-[22svh] text-center md:pt-[17svh]" style={{ opacity: 0, visibility: "hidden" }}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:radial-gradient(70%_55%_at_50%_30%,rgb(10_11_13/0.6),transparent_75%)]" />
          <h2 className="display legible max-w-[14ch] text-[clamp(44px,7vw,120px)]"><Words text={close.heading} /></h2>
          <div className="rise mt-10 flex flex-col items-center gap-5" style={{ ["--d" as string]: "500ms" }}>
            <BookCall>{close.cta}</BookCall>
            <a href={`mailto:${studio.email}`} className="rounded-full bg-black/30 px-4 py-2 text-[14px] text-paper/85 ring-1 ring-white/10 backdrop-blur-md transition-colors hover:text-paper">{studio.email}</a>
          </div>
        </section>

        {/* ---------- HUD ---------- */}
        <div ref={cueRef} aria-hidden className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-paper/70" style={{ opacity: 0 }}>
          {hero.scrollCue}
          <span className="relative h-9 w-px overflow-hidden bg-white/20">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.8s_cubic-bezier(0.77,0,0.175,1)_infinite] bg-paper" />
          </span>
        </div>

        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={sound}
          aria-label={sound ? "Turn sound off" : "Turn sound on"}
          className="absolute bottom-5 left-5 z-10 flex h-10 items-center gap-2.5 rounded-full bg-black/25 px-4 text-[12px] font-medium uppercase tracking-[0.16em] text-paper/80 ring-1 ring-white/12 backdrop-blur-md transition-colors hover:text-paper sm:bottom-6 sm:left-6"
        >
          <span aria-hidden className="flex h-3 items-end gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-[2px] rounded-full bg-current"
                style={{ height: sound ? undefined : "3px", animation: sound ? `eq 1.${i + 1}s ease-in-out ${i * 0.12}s infinite alternate` : "none" }}
              />
            ))}
          </span>
          Sound
        </button>

        <div aria-hidden className="absolute bottom-5 right-5 z-10 flex items-center gap-3 sm:bottom-6 sm:right-6">
          <span className="text-[12px] font-medium tabular-nums tracking-[0.12em] text-paper/75">
            <span ref={countRef}>01</span>
            <span className="text-paper/40"> / {String(SCENES.length).padStart(2, "0")}</span>
          </span>
          <svg width="34" height="34" viewBox="0 0 36 36" className="-rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="1.5" className="ring-track" />
            <circle ref={ringRef} cx="18" cy="18" r="15.9" fill="none" strokeWidth="1.5" pathLength={100} strokeDasharray="100" strokeDashoffset="100" strokeLinecap="round" className="ring-fill" style={{ transition: "none" }} />
          </svg>
        </div>

        {/* ---------- Loader ---------- */}
        <div
          aria-hidden={loaded}
          className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink transition-[opacity,visibility] duration-1000 [transition-timing-function:var(--ease-out)] ${loaded ? "invisible opacity-0" : "opacity-100"}`}
        >
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r="46" fill="none" strokeWidth="1" className="ring-track" />
              <circle cx="50" cy="50" r="46" fill="none" strokeWidth="1.5" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - progress * 100} strokeLinecap="round" className="ring-fill" />
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wordmark.png" alt="" width={62} height={26} className="h-[26px] w-auto opacity-90" />
          </div>
          <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-paper/45 tabular-nums">{Math.round(progress * 100)}%</p>
        </div>
      </div>
      <style>{`
        @keyframes cue { 0% { transform: translateY(-100%); } 100% { transform: translateY(200%); } }
        @keyframes eq { from { height: 3px; } to { height: 12px; } }
      `}</style>
    </div>
  );
}
