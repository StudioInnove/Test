"use client";

import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import { asset, content } from "@/lib/content";
import { Soundscape } from "@/lib/sound";
import { BookCall } from "../BookCall";
import { StatusTrack, WaitlistForm } from "../Originals";
import { ArrowLink } from "../ui/ArrowLink";
import { Words } from "../Words";
import { FilmEngine, type Manifest, type Shot } from "./engine";
import { SEGMENTS, STARTS, TOTAL, WINDOWS, locate, sceneStart, type ClipId, type SceneId } from "./timeline";

const FADE = 0.22;
const AUTOPLAY_S = 10;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

export function FilmStage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<Soundscape | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canvasOn, setCanvasOn] = useState(false);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const track = trackRef.current!;
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const curtain = curtainRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width: 899px)").matches;
    const mode: "d" | "m" = narrow ? "m" : "d";
    let engine: FilmEngine | null = null;
    let raf = 0;
    let alive = true;
    let autoStart = -1;
    let shown = 0; // the film position actually drawn, eased toward the scroll position
    let last = performance.now();
    let lastClipKey = "";
    let lastScene = "";
    let jumping = false;
    const loadedRef = { current: false };

    const lenis = reduce ? null : new Lenis({ lerp: 0.06, wheelMultiplier: 0.85, touchMultiplier: 1.1, smoothWheel: true });

    const overlays = Array.from(stage.querySelectorAll<HTMLElement>("[data-scene]"));
    const steps = Array.from(stage.querySelectorAll<HTMLElement>("[data-step]"));
    const stepBar = stage.querySelector<HTMLElement>("[data-stepbar]");
    const onState = new Map<HTMLElement, boolean>();

    const span = () => track.offsetHeight - stage.offsetHeight;
    const position = () => clamp(-track.getBoundingClientRect().top / Math.max(1, span())) * TOTAL;

    const resize = () => engine?.resize(stage.clientWidth, stage.clientHeight, Math.min(window.devicePixelRatio || 1, 2));
    window.addEventListener("resize", resize);

    // Nav links fade to black, cut to the scene, then fade back in.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const raw = a.getAttribute("href") || "";
      const id = raw.startsWith("#") ? raw.slice(1) : raw.startsWith("/#") ? raw.slice(2) : "";
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      if (jumping) return;
      jumping = true;
      const y = target.getBoundingClientRect().top + window.scrollY;
      curtain.style.transition = "opacity 520ms cubic-bezier(0.77,0,0.175,1)";
      curtain.style.opacity = "1";
      setTimeout(() => {
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
        shown = position();
        history.replaceState(null, "", `#${id}`);
        setTimeout(() => {
          curtain.style.transition = "opacity 1100ms cubic-bezier(0.22,0.61,0.36,1)";
          curtain.style.opacity = "0";
          setTimeout(() => (jumping = false), 1100);
        }, 120);
      }, 560);
    };
    document.addEventListener("click", onClick, true);

    const shotAt = (pos: number, auto: number): { shot: Shot; clip?: ClipId } => {
      const { index, local } = locate(pos);
      const seg = SEGMENTS[index];
      if (seg.kind === "clip") {
        const t = seg.id === "c0" ? Math.max(local, auto) : local;
        return { shot: { kind: "clip", clip: seg.id, from: seg.from, to: seg.to, t: clamp(t) }, clip: seg.id };
      }
      return { shot: { kind: "hold", still: seg.still, rest: 0 } };
    };

    const setOverlay = (el: HTMLElement, vis: number) => {
      el.style.opacity = String(vis);
      el.style.visibility = vis < 0.01 ? "hidden" : "visible";
      el.style.pointerEvents = vis > 0.6 ? "auto" : "none";
      const on = vis > 0.3;
      if (onState.get(el) !== on) {
        onState.set(el, on);
        el.classList.toggle("on", on);
      }
    };

    const tick = (now: number) => {
      if (!alive) return;
      lenis?.raf(now);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = position();
      // critically damped follow: cinematic, never jumpy
      shown += (target - shown) * (1 - Math.exp(-dt * (reduce ? 60 : 7)));
      if (Math.abs(target - shown) < 0.0005) shown = target;
      const pos = shown;
      const time = now / 1000;
      const auto = autoStart >= 0 ? easeInOut(clamp((time - autoStart) / AUTOPLAY_S)) : 0;

      if (engine?.ready) {
        const { shot, clip } = shotAt(pos, auto);
        engine.paint(shot, { time, mouse: [0, 0], pointer: [0.5, 0.5], motion: 0 });
        const i = locate(pos).index;
        const key = clip ?? `h${i}`;
        if (key !== lastClipKey) {
          lastClipKey = key;
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

      for (const el of overlays) {
        const id = el.dataset.scene as SceneId;
        const [a, b] = WINDOWS[id];
        let vis = Math.min(clamp((pos - a) / FADE + 1), clamp((b - pos) / FADE));
        if (id === "hero") vis = loadedRef.current ? clamp((b - pos) / FADE) : 0;
        setOverlay(el, smooth(vis));
      }

      // process steps: brighten one by one across their hold
      const howStart = sceneStart("how");
      const howLen = SEGMENTS.find((s) => s.kind === "hold" && s.scene === "how")!.len;
      const hp = clamp((pos - howStart + 0.15) / (howLen * 0.85));
      const active = Math.min(steps.length - 1, Math.floor(hp * steps.length));
      steps.forEach((s, i) => (s.dataset.state = i <= active ? "on" : "off"));
      if (stepBar) stepBar.style.transform = `scaleX(${hp})`;

      // sound follows the camera inside, and marks each new scene softly
      let scene = "";
      for (const [id, [a]] of Object.entries(WINDOWS)) if (pos >= Math.max(0, a)) scene = id;
      if (scene !== lastScene) {
        if (lastScene) soundRef.current?.chime();
        lastScene = scene;
      }
      const inside = pos > STARTS[2] + SEGMENTS[2].len * 0.6 && pos < STARTS[12] + SEGMENTS[12].len * 0.5 ? 1 : 0;
      soundRef.current?.setPlace(inside);
      if (cueRef.current) cueRef.current.style.opacity = String(loadedRef.current ? clamp(1 - pos / 0.4) : 0);

      raf = requestAnimationFrame(tick);
    };

    fetch(asset("/film/manifest.json"))
      .then((r) => r.json())
      .then(async (m: Manifest) => {
        if (!alive) return;
        engine = new FilmEngine(canvas, m, mode);
        engine.onProgress = (p) => setProgress(p);
        resize();
        const t0 = performance.now();
        await engine.loadStills(["s1", "s1n", "s2"]);
        engine.prioritise(["c0", "c1"]);
        if (!alive) return;
        // let the loader breathe; it is part of the film
        const wait = Math.max(0, 2200 - (performance.now() - t0));
        setTimeout(() => {
          setCanvasOn(true);
          setLoaded(true);
          loadedRef.current = true;
          autoStart = performance.now() / 1000 + 1.4;
        }, wait);
      })
      .catch(() => {
        setLoaded(true);
        loadedRef.current = true;
      });

    const failsafe = window.setTimeout(() => {
      setLoaded(true);
      loadedRef.current = true;
      if (autoStart < 0) autoStart = performance.now() / 1000;
    }, 8000);

    shown = position();
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
      window.removeEventListener("resize", resize);
      document.removeEventListener("click", onClick, true);
      lenis?.destroy();
      engine?.destroy();
      soundRef.current?.destroy();
    };
  }, []);

  const toggleSound = async () => {
    if (!soundRef.current) soundRef.current = new Soundscape();
    const next = !sound;
    await soundRef.current.toggle(next);
    setSound(next);
  };

  const { hero, services, how, originals, close, studio } = content;
  const anchor = (id: string, scene: SceneId, off = 0.05) => (
    <span id={id} className="absolute left-0" style={{ top: `calc((100% - 100svh) * ${(sceneStart(scene) + off) / TOTAL})` }} />
  );

  return (
    <div ref={trackRef} className="relative" style={{ height: `${(TOTAL + 1) * 100}svh` }}>
      <span id="top" className="absolute left-0 top-0" />
      {anchor("services", "services")}
      {anchor("web", "web")}
      {anchor("how", "how")}
      {anchor("originals", "originals", 0.15)}
      {anchor("contact", "close", 0.15)}

      <div ref={stageRef} className="sticky top-0 h-svh w-full overflow-hidden bg-ink">
        <picture>
          <source media="(max-width: 899px)" srcSet={asset("/film/stills/s1-m.webp")} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/film/stills/s1-d.webp")} alt="A glass penthouse studio above a city at golden hour" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-[60%_55%]" />
        </picture>
        <canvas ref={canvasRef} aria-hidden className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${canvasOn ? "opacity-100" : "opacity-0"}`} />

        {/* ---------------- Scenes ---------------- */}

        <section data-scene="hero" aria-label="Introduction" className="reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[104px] md:pb-[12svh]" style={{ opacity: 0 }}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(10_10_11/0.82)_0%,rgb(10_10_11/0.35)_38%,transparent_62%)] md:[background:linear-gradient(20deg,rgb(10_10_11/0.85)_0%,rgb(10_10_11/0.45)_42%,transparent_66%)]" />
          <p className="rise t-small muted mb-5 flex items-center gap-2.5" style={{ ["--d" as string]: "200ms" }}>
            <span className="mark" /> {hero.eyebrow}
          </p>
          <h1 className="t-display max-w-[11ch]"><Words text={hero.headline} delay={300} /></h1>
          <p className="rise t-body muted mt-5 max-w-[36ch]" style={{ ["--d" as string]: "900ms" }}>{hero.line}</p>
          <div className="rise mt-8 flex flex-wrap items-center gap-6" style={{ ["--d" as string]: "1100ms" }}>
            <BookCall>{hero.primary}</BookCall>
            <ArrowLink href="#originals">{hero.secondary}</ArrowLink>
          </div>
        </section>

        <section data-scene="services" aria-label={services.intro} className="reveal absolute inset-0 isolate flex flex-col items-center justify-center px-[var(--gutter)] text-center" style={{ opacity: 0, visibility: "hidden" }}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:radial-gradient(75%_60%_at_50%_50%,rgb(10_10_11/0.72),rgb(10_10_11/0.25)_70%,transparent_100%)]" />
          <p className="rise t-small muted mb-6">{services.intro}</p>
          <h2 className="t-mono max-w-[14ch]">
            <span className="dim"><Words text={services.headline[0]} /></span>{" "}
            <Words text={services.headline[1]} delay={250} />{" "}
            <span className="dim"><Words text={services.headline[2]} delay={350} /></span>
          </h2>
        </section>

        {(["web", "mobile"] as const).map((k) => {
          const s = services[k];
          return (
            <section key={k} data-scene={k} aria-label={s.title} className="reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[96px] md:pb-[12svh]" style={{ opacity: 0, visibility: "hidden" }}>
              <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(10_10_11/0.85)_0%,rgb(10_10_11/0.4)_35%,transparent_60%)]" />
              <div className="max-w-[420px]">
                <p className="rise index mb-4">{s.index}</p>
                <h2 className="t-title"><Words text={s.title} /></h2>
                <p className="rise t-body muted mt-4" style={{ ["--d" as string]: "400ms" }}>{s.line}</p>
                <ul className="rise mt-6 flex flex-wrap gap-1.5" style={{ ["--d" as string]: "600ms" }}>
                  {s.tags.map((t) => <li key={t} className="pill">{t}</li>)}
                </ul>
                {k === "mobile" && (
                  <div className="rise mt-8" style={{ ["--d" as string]: "800ms" }}><BookCall size="sm">{services.cta}</BookCall></div>
                )}
              </div>
            </section>
          );
        })}

        <section data-scene="how" aria-label={how.heading} className="reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[96px] md:pb-[11svh]" style={{ opacity: 0, visibility: "hidden" }}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(10_10_11/0.9)_0%,rgb(10_10_11/0.5)_38%,transparent_68%)]" />
          <h2 className="t-title mb-10 md:mb-14"><Words text={how.heading} /></h2>
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-px bg-white/15" />
            <div data-stepbar className="absolute inset-x-0 top-0 h-px origin-left bg-paper" style={{ transform: "scaleX(0)" }} />
            <ol className="grid grid-cols-2 gap-x-6 gap-y-8 pt-6 md:grid-cols-4 md:gap-[34px]">
              {how.steps.map((s, i) => (
                <li key={s.title} data-step={i} data-state="off" className="transition-opacity duration-700 data-[state=off]:opacity-30">
                  <p className="index mb-3">0{i + 1}</p>
                  <p className="t-head">{s.title}</p>
                  <p className="t-body muted mt-2 max-w-[26ch] text-[15px]">{s.line}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section data-scene="originals" aria-label={originals.eyebrow} className="reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[88px] md:justify-center md:pb-0" style={{ opacity: 0, visibility: "hidden" }}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(10_10_11/0.9),rgb(10_10_11/0.45)_45%,transparent_75%)] md:[background:linear-gradient(90deg,rgb(10_10_11/0.85)_0%,rgb(10_10_11/0.55)_35%,transparent_60%)]" />
          <div className="max-w-[440px]">
            <p className="rise t-small mb-5 flex items-center gap-2.5"><span className="mark" />{originals.eyebrow}</p>
            <h2 className="t-title"><Words text={originals.heading} /></h2>
            <p className="rise t-body muted mt-4" style={{ ["--d" as string]: "400ms" }}>{originals.line}</p>
            <div className="rise mt-8" style={{ ["--d" as string]: "550ms" }}><StatusTrack /></div>
            <div className="rise mt-8" style={{ ["--d" as string]: "700ms" }}><WaitlistForm source="film" /></div>
          </div>
        </section>

        <section data-scene="close" aria-label={close.heading} className="reveal absolute inset-0 isolate flex flex-col items-center justify-start px-[var(--gutter)] pt-[20svh] text-center md:pt-[16svh]" style={{ opacity: 0, visibility: "hidden" }}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:radial-gradient(80%_60%_at_50%_30%,rgb(10_10_11/0.72),rgb(10_10_11/0.2)_70%,transparent_100%)]" />
          <h2 className="t-mono">
            <Words text={close.heading} />
            <br />
            <span className="dim"><Words text={close.sub} delay={300} /></span>
          </h2>
          <div className="rise mt-10 flex flex-col items-center gap-5" style={{ ["--d" as string]: "800ms" }}>
            <BookCall>{close.cta}</BookCall>
            <span className="t-small muted select-all">{studio.email}</span>
          </div>
        </section>

        {/* ---------------- Quiet controls ---------------- */}
        <div ref={cueRef} aria-hidden className="pointer-events-none absolute bottom-6 left-[var(--gutter)] flex h-10 w-[18px] items-center justify-center rounded-full bg-white/10" style={{ opacity: 0, transition: "opacity 600ms ease" }}>
          <svg width="7" height="9" viewBox="0 0 7 9" className="animate-[cue_2.4s_ease-in-out_infinite]"><path d="M3.5 0.5v7M1 5l2.5 2.5L6 5" fill="none" stroke="#f2f2f4" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={sound}
          aria-label={sound ? "Turn sound off" : "Turn sound on"}
          className="link absolute bottom-6 right-[var(--gutter)] z-10 flex h-10 items-center gap-2.5 text-[13px] text-paper/70"
        >
          <span aria-hidden className="flex h-2.5 items-end gap-[2px]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-px bg-current" style={{ height: sound ? undefined : "3px", animation: sound ? `eq 1.${i + 2}s ease-in-out ${i * 0.15}s infinite alternate` : "none" }} />
            ))}
          </span>
          Sound {sound ? "on" : "off"}
        </button>

        {/* ---------------- Loader: the city slowly surfacing from the dark ---------------- */}
        <div aria-hidden={loaded} className={`fixed inset-0 z-[60] overflow-hidden bg-ink transition-[opacity,visibility] duration-[1800ms] [transition-timing-function:var(--ease-film)] ${loaded ? "invisible opacity-0" : "opacity-100"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/film/stills/s1-m.webp")}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[60%_55%] transition-[opacity,filter,transform] duration-[1600ms] [transition-timing-function:var(--ease-film)]"
            style={{ opacity: 0.08 + progress * 0.32, filter: `blur(${18 - progress * 12}px) saturate(${0.4 + progress * 0.5})`, transform: `scale(${1.14 - progress * 0.06})` }}
          />
          <div className="absolute inset-0 [background:radial-gradient(80%_70%_at_50%_50%,transparent,rgb(10_10_11/0.9))]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/brand/logo.svg")} alt="" width={120} height={47} className="h-auto w-[120px] opacity-80" />
            <div className="mt-8 h-px w-[140px] overflow-hidden bg-white/15">
              <div className="h-full origin-left bg-paper/80 transition-transform duration-700 [transition-timing-function:var(--ease-out)]" style={{ transform: `scaleX(${progress})` }} />
            </div>
          </div>
          <div className="absolute inset-x-[var(--gutter)] bottom-6 flex items-end justify-between t-small text-paper/45">
            <span>Web and mobile apps</span>
            <span className="tabular-nums">{String(Math.round(progress * 100)).padStart(3, "0")}</span>
          </div>
        </div>

        {/* curtain for nav jumps */}
        <div ref={curtainRef} aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-ink" style={{ opacity: 0 }} />
      </div>
      <style>{`
        @keyframes cue { 0%, 100% { transform: translateY(-3px); opacity: .4; } 50% { transform: translateY(3px); opacity: 1; } }
        @keyframes eq { from { height: 3px; } to { height: 10px; } }
      `}</style>
    </div>
  );
}
