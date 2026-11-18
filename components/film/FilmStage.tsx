"use client";

import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import { asset, content } from "@/lib/content";
import { Soundscape } from "@/lib/sound";
import { BookCall } from "../BookCall";
import { StatusTrack, WaitlistForm } from "../Originals";
import { ArrowLink } from "../ui/ArrowLink";
import { Words } from "../Words";
import { FilmEngine, type Manifest } from "./engine";
import { SCENES, sceneIndex, type SceneKey } from "./scenes";
import type { ClipId } from "./timeline";

const TRANSITION_S = 3.4; // one clip, played at a calm, even pace
const SETTLE_S = 0.45; // the idle loop eases back to its end frame before a transition
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

type Move = { from: number; to: number; start: number; settleFrom: number } | null;

export function FilmStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<Soundscape | null>(null);
  const goRef = useRef<(i: number, cut?: boolean) => void>(() => {});
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false); // assets ready: show Enter
  const [entered, setEntered] = useState(false);
  const [scene, setScene] = useState(0);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const curtain = curtainRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mode: "d" | "m" = window.matchMedia("(max-width: 899px)").matches ? "m" : "d";
    let engine: FilmEngine | null = null;
    let raf = 0;
    let alive = true;
    let current = 0;
    let move: Move = null;
    let idleStart = performance.now() / 1000;
    let idleT = 1;
    let filmMode = true;
    let lockUntil = 0;
    let wheelAcc = 0;
    let lastWheel = 0;
    let touchY: number | null = null;

    const lenis = new Lenis({ lerp: reduce ? 1 : 0.075, smoothWheel: !reduce });
    lenis.stop();

    const overlays = Array.from(stage.querySelectorAll<HTMLElement>("[data-scene]"));
    const resize = () => engine?.resize(stage.clientWidth, stage.clientHeight, Math.min(window.devicePixelRatio || 1, 2));
    window.addEventListener("resize", resize);

    const showText = (i: number | null) => {
      overlays.forEach((el) => {
        const on = i !== null && el.dataset.scene === SCENES[i].key;
        el.classList.toggle("on", on);
        el.style.opacity = on ? "1" : "0";
        el.style.visibility = on ? "visible" : "hidden";
        el.style.pointerEvents = on ? "auto" : "none";
        if (on) el.querySelectorAll<HTMLElement>("[data-scramble]").forEach(scramble);
      });
    };

    const scramble = (el: HTMLElement) => {
      const final = el.dataset.scramble || "";
      const t0 = performance.now();
      const step = () => {
        const p = clamp((performance.now() - t0) / 1400);
        const shown = Math.floor(p * final.length);
        el.textContent = final
          .split("")
          .map((c, k) => (k < shown || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join("");
        if (p < 1 && alive) requestAnimationFrame(step);
      };
      setTimeout(step, 500);
    };

    const preload = (i: number) => {
      if (!engine) return;
      const want: ClipId[] = [];
      const add = (c: ClipId | null | undefined) => c && !want.includes(c) && want.push(c);
      add(SCENES[i].idle.clip);
      add(SCENES[i + 1]?.enter);
      add(SCENES[i].enter);
      for (let r = 2; r < SCENES.length; r++) add(SCENES[i + r]?.enter);
      engine.prioritise(want);
    };

    // Move to scene i: play the clip between, or cut under a curtain for long jumps.
    const go = (i: number, cut = false) => {
      if (i < 0 || i >= SCENES.length || i === current || move) return;
      const now = performance.now() / 1000;
      if (cut || Math.abs(i - current) > 1 || reduce) {
        curtain.style.transition = "opacity 520ms cubic-bezier(0.77,0,0.175,1)";
        curtain.style.opacity = "1";
        showText(null);
        lockUntil = now + 2;
        setTimeout(() => {
          current = i;
          setScene(i);
          idleStart = performance.now() / 1000;
          preload(i);
          curtain.style.transition = "opacity 1200ms cubic-bezier(0.22,0.61,0.36,1)";
          curtain.style.opacity = "0";
          setTimeout(() => showText(i), 500);
        }, 560);
        return;
      }
      showText(null);
      move = { from: current, to: i, start: now, settleFrom: idleT };
      lockUntil = now + SETTLE_S + TRANSITION_S;
      setScene(i);
      preload(i);
    };
    goRef.current = go;

    const exitFilm = () => {
      filmMode = false;
      lenis.start();
      const faq = document.getElementById("faq");
      if (faq) lenis.scrollTo(faq, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    };

    const step = (dir: 1 | -1) => {
      const now = performance.now() / 1000;
      if (!filmMode || move || now < lockUntil) return;
      if (dir > 0 && current === SCENES.length - 1) return exitFilm();
      go(current + dir);
    };

    const onWheel = (e: WheelEvent) => {
      if (!filmMode) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastWheel > 220) wheelAcc = 0; // a new gesture
      lastWheel = now;
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) > 40) {
        step(wheelAcc > 0 ? 1 : -1);
        wheelAcc = -9999 * Math.sign(wheelAcc); // swallow the rest of this gesture's momentum
      }
    };
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (!filmMode || touchY === null) return;
      e.preventDefault();
      const dy = touchY - e.touches[0].clientY;
      if (Math.abs(dy) > 46) {
        step(dy > 0 ? 1 : -1);
        touchY = null;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (!filmMode || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); step(1); }
      if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); step(-1); }
    };
    // Back at the very top of the page: hand control back to the film.
    lenis.on("scroll", ({ scroll, direction }: { scroll: number; direction: number }) => {
      if (!filmMode && scroll <= 1 && direction <= 0) {
        filmMode = true;
        lenis.stop();
        lockUntil = performance.now() / 1000 + 0.6;
      }
    });

    // Nav links: film scenes cut under a curtain; FAQ leaves the film.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const raw = a.getAttribute("href") || "";
      const id = raw.startsWith("#") ? raw.slice(1) : raw.startsWith("/#") ? raw.slice(2) : "";
      if (!id) return;
      const map: Record<string, SceneKey> = { top: "hero", services: "services", web: "web", how: "how", originals: "originals", contact: "close" };
      if (map[id] !== undefined) {
        e.preventDefault();
        const target = sceneIndex(map[id]);
        if (!filmMode) {
          curtain.style.transition = "opacity 520ms cubic-bezier(0.77,0,0.175,1)";
          curtain.style.opacity = "1";
          setTimeout(() => {
            lenis.scrollTo(0, { immediate: true, force: true });
            filmMode = true;
            lenis.stop();
            current = -1;
            go(target, true);
          }, 560);
        } else go(target, true);
      } else if (id === "faq") {
        e.preventDefault();
        if (filmMode) exitFilm();
        else lenis.scrollTo("#faq", { duration: 1.6 });
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);

    const tick = (nowMs: number) => {
      if (!alive) return;
      lenis.raf(nowMs);
      const now = nowMs / 1000;
      if (engine?.ready) {
        if (move) {
          const el = now - move.start;
          if (el < SETTLE_S) {
            // ease the idle loop back to its end frame so the clip starts exactly where we are
            const idle = SCENES[move.from].idle;
            const t = move.settleFrom + (1 - move.settleFrom) * easeInOut(el / SETTLE_S);
            engine.paint({ kind: "clip", clip: idle.clip, from: SCENES[move.from].still, to: SCENES[move.from].still, t }, { time: now, mouse: [0, 0], pointer: [0.5, 0.5], motion: 0 });
          } else {
            const p = clamp((el - SETTLE_S) / TRANSITION_S);
            const forward = move.to > move.from;
            const clip = (forward ? SCENES[move.to].enter : SCENES[move.from].enter)!;
            const a = forward ? SCENES[move.from].still : SCENES[move.to].still;
            const b = forward ? SCENES[move.to].still : SCENES[move.from].still;
            const e = easeInOut(p);
            engine.paint({ kind: "clip", clip, from: a, to: b, t: forward ? e : 1 - e }, { time: now, mouse: [0, 0], pointer: [0.5, 0.5], motion: 0 });
            if (p >= 1) {
              current = move.to;
              move = null;
              idleStart = now;
              idleT = 1;
              showText(current);
            }
          }
        } else if (current >= 0) {
          const s = SCENES[current];
          const ph = reduce ? 0 : (now - idleStart) / s.idle.period;
          const w = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2); // 0 → 1 → 0, slowing at each end
          idleT = s.idle.to - (s.idle.to - s.idle.from) * w;
          engine.paint({ kind: "clip", clip: s.idle.clip, from: s.still, to: s.still, t: idleT }, { time: now, mouse: [0, 0], pointer: [0.5, 0.5], motion: 0 });
        }
        soundRef.current?.setPlace(current >= 2 && current <= 5 ? 1 : 0);
      }
      raf = requestAnimationFrame(tick);
    };

    fetch(asset("/film/manifest.json"))
      .then((r) => r.json())
      .then(async (m: Manifest) => {
        if (!alive) return;
        engine = new FilmEngine(canvas, m, mode);
        engine.onProgress = (p) => setProgress(p * 0.6);
        resize();
        await engine.loadStills(["s1n", "s2"]);
        preload(0);
        // wait until the hero loop and the first transition can play, then offer Enter
        const t0 = performance.now();
        const wait = () => {
          const have = engine!.loadedRatio(["c0", "c1"]);
          setProgress(0.6 + have * 0.4);
          if ((have > 0.97 && performance.now() - t0 > 600) || performance.now() - t0 > 9000) setReady(true);
          else if (alive) setTimeout(wait, 120);
        };
        wait();
      })
      .catch(() => setReady(true));

    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      lenis.destroy();
      engine?.destroy();
      soundRef.current?.destroy();
    };
  }, []);

  const enter = async (withSound: boolean) => {
    setEntered(true);
    if (withSound) {
      soundRef.current = soundRef.current ?? new Soundscape();
      await soundRef.current.toggle(true);
      setSound(true);
    }
    const map: Record<string, number> = { services: 1, web: 2, how: 4, originals: 5, contact: 6 };
    const fromHash = map[window.location.hash.slice(1)];
    if (fromHash) return setTimeout(() => goRef.current(fromHash, true), 300);
    setTimeout(() => {
      const el = stageRef.current?.querySelector<HTMLElement>('[data-scene="hero"]');
      if (el) { el.classList.add("on"); el.style.opacity = "1"; el.style.visibility = "visible"; el.style.pointerEvents = "auto"; }
    }, 900);
  };

  const toggleSound = async () => {
    soundRef.current = soundRef.current ?? new Soundscape();
    const next = !sound;
    await soundRef.current.toggle(next);
    setSound(next);
  };

  const { hero, services, how, originals, close, studio } = content;
  const enterCopy = (content as unknown as { enter: { cta: string; quiet: string; hint: string } }).enter;
  const sceneStyle = { opacity: 0, visibility: "hidden" as const, transition: "opacity 900ms cubic-bezier(0.22,0.61,0.36,1), visibility 900ms" };

  return (
    <div id="top" className="relative h-svh">
      <div ref={stageRef} className="relative h-svh w-full overflow-hidden bg-ink" style={{ touchAction: "pan-x" }}>
        <picture>
          <source media="(max-width: 899px)" srcSet={asset("/film/stills/s1n-m.webp")} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/film/stills/s1n-d.webp")} alt="A glass penthouse studio above a city at night" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-[60%_55%]" />
        </picture>
        <canvas ref={canvasRef} aria-hidden className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} />

        {/* ---------------- Scenes ---------------- */}
        <section data-scene="hero" aria-label="Introduction" className="reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[108px] md:pb-[13svh]" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(10_10_11/0.85)_0%,rgb(10_10_11/0.4)_40%,transparent_65%)] md:[background:linear-gradient(20deg,rgb(10_10_11/0.85)_0%,rgb(10_10_11/0.45)_42%,transparent_66%)]" />
          <h1 className="t-display max-w-[11ch]"><Words text={hero.headline} delay={100} /></h1>
          <p className="rise t-body mt-5 max-w-[36ch] text-paper/80" style={{ ["--d" as string]: "700ms" }}>{hero.line}</p>
          <div className="rise mt-8 flex flex-wrap items-center gap-6" style={{ ["--d" as string]: "900ms" }}>
            <BookCall>{hero.primary}</BookCall>
            <ArrowLink href="#originals">{hero.secondary}</ArrowLink>
          </div>
        </section>

        <section data-scene="services" aria-label={services.intro} className="reveal absolute inset-0 isolate flex flex-col items-center justify-center px-[var(--gutter)] text-center" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:radial-gradient(80%_65%_at_50%_50%,rgb(10_10_11/0.78),rgb(10_10_11/0.35)_70%,rgb(10_10_11/0.15)_100%)]" />
          <p className="rise t-small mb-6 text-paper/70">{services.intro}</p>
          <h2 className="t-mono max-w-[16ch] text-[clamp(44px,7.4vw,112px)]">
            <Words text={services.headline[0]} />
            <br />
            <span className="text-paper/60"><Words text={services.headline[1]} delay={350} /></span>
          </h2>
        </section>

        {(["web", "mobile"] as const).map((k) => {
          const s = services[k];
          return (
            <section key={k} data-scene={k} aria-label={s.title} className="reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[100px] md:pb-[13svh]" style={sceneStyle}>
              <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(10_10_11/0.88)_0%,rgb(10_10_11/0.45)_38%,transparent_62%)]" />
              <div className="max-w-[440px]">
                <p className="rise index mb-4">{s.index}</p>
                <h2 className="t-title"><Words text={s.title} /></h2>
                <p className="rise t-body mt-4 text-paper/80" style={{ ["--d" as string]: "400ms" }}>{s.line}</p>
                <ul className="rise mt-6 flex flex-wrap gap-1.5" style={{ ["--d" as string]: "600ms" }}>
                  {s.tags.map((t) => <li key={t} className="pill">{t}</li>)}
                </ul>
              </div>
            </section>
          );
        })}

        <section data-scene="how" aria-label={how.heading} className="reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[100px] md:pb-[12svh]" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(10_10_11/0.92)_0%,rgb(10_10_11/0.55)_40%,transparent_70%)]" />
          <h2 className="t-title mb-10 md:mb-14"><Words text={how.heading} /></h2>
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-px bg-white/15" />
            <div className="steps-bar absolute inset-x-0 top-0 h-px origin-left bg-paper" />
            <ol className="grid grid-cols-2 gap-x-6 gap-y-8 pt-6 md:grid-cols-4 md:gap-[34px]">
              {how.steps.map((s, i) => (
                <li key={s.title} className="rise" style={{ ["--d" as string]: `${400 + i * 450}ms` }}>
                  <p className="index mb-3">0{i + 1}</p>
                  <p className="t-head">{s.title}</p>
                  <p className="t-body mt-2 max-w-[26ch] text-[15px] text-paper/75">{s.line}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section data-scene="originals" aria-label={originals.eyebrow} className="reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[92px] md:justify-center md:pb-0" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(10_10_11/0.92),rgb(10_10_11/0.5)_45%,transparent_75%)] md:[background:linear-gradient(90deg,rgb(10_10_11/0.9)_0%,rgb(10_10_11/0.6)_38%,transparent_62%)]" />
          <div className="max-w-[460px]">
            <p className="rise t-small mb-6 flex items-center gap-3 text-paper/70">
              <span>{originals.eyebrow}</span>
              <span className="h-px w-6 bg-white/30" />
              <span className="tabular-nums tracking-[0.08em]" data-scramble={(originals as unknown as { code: string }).code}>{(originals as unknown as { code: string }).code}</span>
            </p>
            <h2 className="t-title"><Words text={originals.heading} /></h2>
            <p className="rise t-body mt-4 text-paper/80" style={{ ["--d" as string]: "500ms" }}>{originals.line}</p>
            <div className="rise mt-8" style={{ ["--d" as string]: "700ms" }}><StatusTrack /></div>
            <div className="rise mt-8" style={{ ["--d" as string]: "850ms" }}><WaitlistForm source="film" /></div>
          </div>
        </section>

        <section data-scene="close" aria-label={close.heading} className="reveal absolute inset-0 isolate flex flex-col items-center justify-start px-[var(--gutter)] pt-[20svh] text-center md:pt-[16svh]" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:radial-gradient(85%_60%_at_50%_30%,rgb(10_10_11/0.75),rgb(10_10_11/0.2)_75%,transparent_100%)]" />
          <h2 className="t-mono text-[clamp(44px,7.4vw,112px)]">
            <Words text={close.heading} />
            <br />
            <span className="text-paper/60"><Words text={close.sub} delay={300} /></span>
          </h2>
          <div className="rise mt-10 flex flex-col items-center gap-5" style={{ ["--d" as string]: "800ms" }}>
            <BookCall>{close.cta}</BookCall>
            <span className="t-small select-all text-paper/60">{studio.email}</span>
          </div>
        </section>

        {/* ---------------- Quiet controls ---------------- */}
        <div className={`pointer-events-none absolute inset-x-[var(--gutter)] bottom-6 z-10 flex items-center justify-between transition-opacity duration-700 ${entered ? "opacity-100" : "opacity-0"}`}>
          <div className="pointer-events-auto flex items-center gap-3">
            {SCENES.map((s, i) => (
              <button key={s.key} type="button" aria-label={`Go to ${s.key}`} onClick={() => goRef.current(i, Math.abs(i - scene) > 1)} className="group flex h-6 items-center">
                <span className={`block h-px transition-all duration-700 [transition-timing-function:var(--ease-out)] ${i === scene ? "w-8 bg-paper" : "w-3 bg-white/30 group-hover:bg-white/60"}`} />
              </button>
            ))}
          </div>
          <button type="button" onClick={toggleSound} aria-pressed={sound} className="link pointer-events-auto flex h-8 items-center gap-2.5 text-[13px] text-paper/70">
            <span aria-hidden className="flex h-2.5 items-end gap-[2px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-px bg-current" style={{ height: sound ? undefined : "3px", animation: sound ? `eq 1.${i + 2}s ease-in-out ${i * 0.15}s infinite alternate` : "none" }} />
              ))}
            </span>
            Sound {sound ? "on" : "off"}
          </button>
        </div>

        {/* ---------------- Loader → Enter ---------------- */}
        <div className={`fixed inset-0 z-[60] overflow-hidden bg-ink transition-[opacity,visibility] duration-[1600ms] [transition-timing-function:var(--ease-film)] ${entered ? "invisible opacity-0" : "opacity-100"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/film/stills/s1n-m.webp")}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[60%_55%] transition-[opacity,filter,transform] duration-[1600ms] [transition-timing-function:var(--ease-film)]"
            style={{ opacity: 0.1 + progress * 0.35, filter: `blur(${16 - progress * 10}px)`, transform: `scale(${1.12 - progress * 0.06})` }}
          />
          <div className="absolute inset-0 [background:radial-gradient(80%_70%_at_50%_50%,rgb(10_10_11/0.2),rgb(10_10_11/0.92))]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/brand/logo.svg")} alt="Studio Innové" width={72} height={28} className="h-auto w-[72px] opacity-85" />
            <div className="relative mt-10 flex h-10 items-center justify-center">
              <div className={`h-px w-[120px] overflow-hidden bg-white/15 transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}>
                <div className="h-full origin-left bg-paper/80 transition-transform duration-500" style={{ transform: `scaleX(${progress})` }} />
              </div>
              <div className={`absolute flex flex-col items-center gap-4 transition-[opacity,transform] duration-1000 [transition-timing-function:var(--ease-film)] ${ready ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}>
                <button type="button" onClick={() => enter(true)} className="btn btn-ghost min-w-[120px]">{enterCopy.cta}</button>
                <button type="button" onClick={() => enter(false)} className="link t-small text-paper/50">{enterCopy.quiet}</button>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-[var(--gutter)] bottom-6 flex items-end justify-between t-small text-paper/40">
            <span>{enterCopy.hint}</span>
            <span className="tabular-nums">{String(Math.round(progress * 100)).padStart(3, "0")}</span>
          </div>
        </div>

        <div ref={curtainRef} aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-ink" style={{ opacity: 0 }} />
      </div>
      <style>{`
        @keyframes eq { from { height: 3px; } to { height: 10px; } }
        .steps-bar { transform: scaleX(0); transition: transform 2400ms cubic-bezier(0.22,0.61,0.36,1) 300ms; }
        .on .steps-bar { transform: scaleX(1); }
      `}</style>
    </div>
  );
}
