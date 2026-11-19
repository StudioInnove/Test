"use client";

import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import { asset, content, href } from "@/lib/content";
import { quadMatrix } from "@/lib/quad";
import { Soundscape } from "@/lib/sound";
import { BookCall } from "../BookCall";
import { Words } from "../Words";
import { BuildScreen, BUILD_SIZE } from "../apps/BuildScreen";
import { Dashboard, DASH_SIZE } from "../apps/Dashboard";
import { PhoneApps, PHONE_SIZE } from "../apps/PhoneApps";
import { FilmEngine, type Manifest, type Shot, type Single } from "./engine";
import { LivingLight } from "./living";
import { SCENES, sceneIndex, type SceneKey } from "./scenes";
import { SCREENS, SPOTS, type ClipId, type Spot, type WorldId } from "./timeline";
import { World } from "./World";

/*
 * How the film moves
 * ------------------
 * The film has a position measured in scenes (0 = outside … 6 = sunrise). A scroll gesture sets the next
 * scene as the target and the position glides there with constant, gentle acceleration and braking.
 * Scrolling more while it moves pushes it faster, and scrolling back reverses it smoothly from wherever
 * it is. At rest a scene sits on its crisp still; over it, in code, the room's light lives (the city
 * twinkles, lamps breathe) and its screen works. Things in a room can be stepped into: a full-screen world.
 */
const BASE_V = 0.48; // scenes per second when it glides on its own
const BOOST_V = 0.85; // extra speed while the visitor keeps scrolling
const FLY_V = 2.4; // flying through several rooms at once
const ACC = 0.85; // scenes per second², speeding up and braking
const TEXT_AT = 0.16; // text starts to appear this far (in scenes) before arrival
const LOOP_S = 5; // length of the seamless loop clip, seconds
const DAY_S = 40; // the hero: night slowly becomes sunrise and back, once every 40 seconds
const LAST = SCENES.length - 1;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const segShot = (k: number, t: number): Single => ({ kind: "clip", clip: SCENES[k + 1].enter!, from: SCENES[k].still, to: SCENES[k + 1].still, t });

export function FilmStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const markRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const openRef = useRef<(k: number) => void>(() => {});
  const closeRef = useRef<() => void>(() => {});
  const soundRef = useRef<Soundscape | null>(null);
  const cutRef = useRef<(i: number) => void>(() => {});
  const [world, setWorld] = useState<WorldId | null>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [skipEntrance, setSkipEntrance] = useState(false);
  const [howStep, setHowStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [scene, setScene] = useState(0);
  const [canSwipe, setCanSwipe] = useState(false);

  useEffect(() => {
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const curtain = curtainRef.current!;
    const line = lineRef.current;
    let lineAt = -1;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mode: "d" | "m" = window.matchMedia("(max-width: 899px)").matches ? "m" : "d";
    // phones and tablets scroll natively (smooth-scroll libraries fight the finger and stall)
    const touchUI = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const fine = !touchUI && window.matchMedia("(pointer: fine)").matches;
    setCanSwipe(touchUI);
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    let engine: FilmEngine | null = null;
    const living = liveRef.current ? new LivingLight(liveRef.current, touchUI) : null;
    let raf = 0;
    let alive = true;
    let started = false;

    // film state
    let pos = 0; // where the film is, in scenes
    let vel = 0;
    let target = 0;
    let current = 0; // the scene we last came to rest on
    let moving = false;
    let flying = false;
    let headDir = 1; // which way the current glide is going
    let boost = 0;
    let shown: number | null = null;
    let arrivedAt = 0;
    let held = false; // just arrived: ignore the tail of the same scroll gesture
    let arriveShot: Single | null = null; // the last clip frame we arrived on, faded into the crisp still
    let departShot: Single | null = null; // the frame we left from, faded into the clip
    let departPos = 0;
    let lastShot: Single | null = null;
    let lastTick = performance.now();
    let dawnCued = false;
    let day = 0; // 0 night … 1 sunrise, on the hero

    // page state
    let filmMode = true;
    let exiting = false;
    let lastWheel = 0;
    let gestureAt = 0;
    let touchY0: number | null = null;
    let touchT0 = 0;
    let swiped = false;

    // Page scrolling: Lenis on desktop, the browser's own on touch screens.
    const lenis = touchUI ? null : new Lenis({ lerp: reduce ? 1 : 0.085, smoothWheel: !reduce });
    const root = document.documentElement;
    const lock = () => {
      lenis?.stop();
      root.classList.add("film-lock");
    };
    const unlock = () => {
      root.classList.remove("film-lock");
      lenis?.start();
    };
    const scrollY = () => (lenis ? lenis.scroll : window.scrollY);
    lock();
    window.scrollTo(0, 0);

    const overlays = Array.from(stage.querySelectorAll<HTMLElement>("[data-scene]"));
    let lastW = 0, lastH = 0;
    let lastKey = "";
    // desktop: the camera drifts a little toward the cursor, slowly
    const look = { tx: 0, ty: 0, x: 0, y: 0 };
    const lookOn = fine && !reduce;
    // the pointer, for the "Open" cursor over things you can step into
    const ptr = { x: -1e4, y: -1e4, cx: -1e4, cy: -1e4, on: false };
    const onPointer = (e: PointerEvent) => {
      look.tx = (e.clientX / window.innerWidth) * 2 - 1;
      look.ty = (e.clientY / window.innerHeight) * 2 - 1;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
    };
    if (fine) window.addEventListener("pointermove", onPointer, { passive: true });

    // stepping into something in a room
    let peekTarget = 0;
    let peekZ = 0;
    let peekIdx = 0;
    let worldOpen = false;
    let spotsShown: boolean[] = [];
    let bloomed = -1;
    let hover = -1;
    // where each thing you can step into sits on screen right now (px, in the film frame)
    let areas: { x0: number; y0: number; x1: number; y1: number }[] = [];

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      // the phone's address bar sliding in and out changes only the height a little: ignore it
      if (touchUI && w === lastW && Math.abs(h - lastH) < 140 && lastH) return;
      lastW = w;
      lastH = h;
      engine?.resize(w, h, Math.min(window.devicePixelRatio || 1, touchUI ? 1.5 : 2));
      living?.resize(w, h);
      lastKey = "";
    };
    window.addEventListener("resize", resize);

    const scramble = (el: HTMLElement) => {
      const final = el.dataset.scramble || "";
      const t0 = performance.now() + 200;
      const step = () => {
        const p = clamp((performance.now() - t0) / 1100);
        const n = Math.floor(p * final.length);
        el.textContent = final.split("").map((c, k) => (k < n || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
        if (p < 1 && alive) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const showText = (i: number | null) => {
      if (shown === i) return;
      shown = i;
      overlays.forEach((el) => {
        const on = i !== null && el.dataset.scene === SCENES[i].key;
        el.classList.toggle("on", on);
        el.style.opacity = on ? "1" : "0";
        el.style.visibility = on ? "visible" : "hidden";
        el.style.pointerEvents = on ? "auto" : "none";
        if (on) el.querySelectorAll<HTMLElement>("[data-scramble]").forEach(scramble);
      });
    };

    const hasLoop = (i: number) => {
      const l = SCENES[i]?.loop;
      return !!(l && engine && engine.frames(l) > 1 && !reduce && engine.loadedRatio([l]) >= 1);
    };

    const preload = (i: number, from = current) => {
      if (!engine) return;
      const want: ClipId[] = [];
      const add = (c: ClipId | null | undefined) => c && engine!.frames(c) > 0 && !want.includes(c) && want.push(c);
      // everything on the way there first (a long flight passes through several rooms)
      for (let k = Math.min(from, i) + 1; k <= Math.max(from, i); k++) add(SCENES[k].enter);
      add(SCENES[i + 1]?.enter);
      add(SCENES[i].enter);
      add(SCENES[i].loop);
      for (let r = 2; r < SCENES.length; r++) add(SCENES[i + r]?.enter);
      engine.prioritise(want);
    };

    const restShot = (i: number, now: number): Single => {
      if (hasLoop(i)) {
        let t = ((((now - arrivedAt) / LOOP_S) % 1) + 1) % 1;
        // phones: 30 steps a second is plenty for a slow city loop, and halves the work
        if (touchUI) t = Math.floor(t * LOOP_S * 30) / (LOOP_S * 30);
        return { kind: "clip", clip: SCENES[i].loop!, from: SCENES[i].still, to: SCENES[i].still, t };
      }
      return { kind: "hold", still: SCENES[i].still, rest: 1 };
    };

    const clipShot = (p: number) => {
      const k = Math.min(LAST - 1, Math.max(0, Math.floor(p)));
      return segShot(k, clamp(p - k));
    };

    // ---------- the process strip: scrolling moves it sideways while you're on that scene ----------
    const strip = stage.querySelector<HTMLElement>("[data-hscroll]");
    let stripTarget = 0;
    let stripAnim = false;
    let stripMovedAt = 0;
    const stripMax = () => (strip ? Math.max(0, strip.scrollWidth - strip.clientWidth) : 0);
    strip?.addEventListener("scroll", () => {
      // a finger moved it natively: follow it
      if (!stripAnim && !dragging) stripTarget = strip.scrollLeft;
      // the strip is only the hand that turns the steps: show the one it has reached
      const max = stripMax();
      setHowStep(max ? Math.round((strip.scrollLeft / max) * (how.steps.length - 1)) : 0);
    }, { passive: true });
    const cardW = () => (strip?.querySelector("li") as HTMLElement | null)?.offsetWidth ?? 300;

    // Start gliding towards scene i.
    const head = (i: number, fly = false) => {
      i = Math.max(0, Math.min(LAST, i));
      if (worldOpen) closeWorld();
      if (i === target && moving) return;
      if (!moving) {
        departShot = lastShot;
        departPos = pos;
        moving = true;
      }
      flying = fly;
      headDir = Math.sign(i - pos) || headDir;
      preload(i);
      target = i;
      setScene(i);
    };

    // Jump straight to scene i under a soft curtain (nav links, long jumps).
    const cut = (i: number) => {
      if (worldOpen) closeWorld();
      curtain.style.transition = "opacity 480ms cubic-bezier(0.77,0,0.175,1)";
      curtain.style.opacity = "1";
      showText(null);
      setTimeout(() => {
        pos = target = current = i;
        vel = 0;
        moving = false;
        arriveShot = null;
        departShot = null;
        arrivedAt = performance.now() / 1000;
        held = true;
        dawnCued = false;
        setScene(i);
        preload(i);
        if (strip) stripTarget = strip.scrollLeft = 0;
        curtain.style.transition = "opacity 1000ms cubic-bezier(0.22,0.61,0.36,1)";
        curtain.style.opacity = "0";
        setTimeout(() => showText(i), 250);
      }, 520);
    };

    const exitFilm = () => {
      filmMode = false;
      window.dispatchEvent(new CustomEvent("film:scene", { detail: "faq" }));
      exiting = true;
      unlock();
      const faq = document.getElementById("faq");
      const done = () => (exiting = false);
      if (faq && lenis) lenis.scrollTo(faq, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), onComplete: done });
      else if (faq) window.scrollTo({ top: faq.getBoundingClientRect().top + window.scrollY, behavior: reduce ? "auto" : "smooth" });
      setTimeout(done, 1900);
    };

    const enterFilm = () => {
      filmMode = true;
      window.dispatchEvent(new CustomEvent("film:scene", { detail: SCENES[target].key }));
      lock();
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
      held = true;
      arrivedAt = performance.now() / 1000;
    };

    cutRef.current = (i: number) => {
      if (!filmMode) {
        curtain.style.transition = "opacity 480ms cubic-bezier(0.77,0,0.175,1)";
        curtain.style.opacity = "1";
        setTimeout(() => {
          enterFilm();
          cut(i);
        }, 500);
      } else if (!reduce && Math.abs(i - (moving ? target : current)) === 1) head(i);
      else if (i !== current || moving) cut(i);
    };

    // ---------- stepping into things ----------
    const spotsHere = (): Spot[] => SPOTS[SCENES[current].still] ?? [];
    const openWorld = (k: number) => {
      const s = spotsHere()[k];
      if (!s || moving || worldOpen || !started) return;
      worldOpen = true;
      peekIdx = k;
      peekTarget = 1;
      stage.classList.add("peeking");
      soundRef.current?.cue("open");
      window.dispatchEvent(new CustomEvent("film:world", { detail: true }));
      setTimeout(() => worldOpen && setWorld(s.id), reduce ? 0 : 420);
    };
    const closeWorld = () => {
      if (!worldOpen) return;
      worldOpen = false;
      setWorld(null);
      soundRef.current?.cue("close");
      window.dispatchEvent(new CustomEvent("film:world", { detail: false }));
      held = true;
      arrivedAt = performance.now() / 1000 - 1.2;
      setTimeout(() => {
        peekTarget = 0;
        stage.classList.remove("peeking");
      }, 250);
    };
    openRef.current = openWorld;
    closeRef.current = closeWorld;

    /** One unit of scroll intent. dy in pixels (+ = forward); fresh = the start of a new gesture. */
    const input = (dy: number, fresh: boolean, touch = false) => {
      if (!started || !dy || worldOpen) return;
      const now = performance.now() / 1000;
      const dir = Math.sign(dy);
      if (!moving && held) {
        // let the visitor read: the rest of the same gesture is ignored
        if (fresh || (now - arrivedAt > 1.6 && Math.abs(dy) > 24)) held = false;
        else return;
      }
      // on the process scene the steps move sideways first
      if (!moving && strip && SCENES[current].key === "how") {
        const max = stripMax();
        if (max > 4) {
          const at = stripTarget;
          if ((dir > 0 && at < max - 2) || (dir < 0 && at > 2)) {
            // one gesture, one step
            if (stripMovedAt >= gestureAt && !fresh) return;
            const stepW = max / (how.steps.length - 1);
            stripTarget = clamp((Math.round(at / stepW) + dir) * stepW, 0, max);
            stripAnim = true;
            stripMovedAt = performance.now();
            return;
          }
          // at the end of the steps: the same gesture stops here; a new one moves on
          if (stripMovedAt >= gestureAt && !fresh) return;
        }
      }
      boost = Math.min(1, boost + Math.abs(dy) / 900);
      if (!moving) {
        if (dir > 0 && current === LAST) return exitFilm();
        if (current + dir < 0) return;
        head(current + dir);
      } else if (dir !== Math.sign(target - pos)) {
        // changed their mind: glide back the way we came
        head(dir > 0 ? Math.ceil(pos) : Math.floor(pos));
      } else if (fresh && Math.abs(target - pos) < 0.5 && target + dir >= 0 && target + dir <= LAST) {
        // a new gesture near the end of a glide carries on to the scene after
        head(target + dir);
      }
    };

    const onWheel = (e: WheelEvent) => {
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      const nowMs = performance.now();
      const fresh = nowMs - lastWheel > 180;
      if (fresh) gestureAt = nowMs;
      lastWheel = nowMs;
      if (!filmMode) {
        // at the very top of the page, scrolling up hands control back to the film
        if (!exiting && dy < 0 && scrollY() <= 1 && window.scrollY <= 1) {
          e.preventDefault();
          enterFilm();
        }
        return;
      }
      if ((e.target as HTMLElement)?.closest?.("[data-panel]")) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && (e.target as HTMLElement)?.closest?.("[data-hscroll]")) {
        if (strip) stripTarget = clamp(stripTarget + e.deltaX, 0, stripMax());
        e.preventDefault();
        return;
      }
      e.preventDefault();
      if (Math.abs(dy) < 1) return;
      input(dy, fresh);
    };
    // On a touch screen one swipe is one scene: the swipe's speed sets how briskly the film glides.
    let touchX0 = 0;
    let sideways = false;
    const onTouchStart = (e: TouchEvent) => {
      touchY0 = e.touches[0].clientY;
      touchX0 = e.touches[0].clientX;
      sideways = false;
      touchT0 = performance.now();
      gestureAt = touchT0;
      swiped = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY0 === null) return;
      const d = touchY0 - e.touches[0].clientY;
      if (!filmMode) {
        if (!exiting && d < -14 && window.scrollY <= 1) {
          e.preventDefault();
          enterFilm();
          touchY0 = null;
        }
        return;
      }
      if ((e.target as HTMLElement)?.closest?.("[data-panel]")) return;
      // a sideways drag inside the process strip scrolls the strip, not the film
      const dx = touchX0 - e.touches[0].clientX;
      if (sideways || (Math.abs(dx) > Math.abs(d) && Math.abs(dx) > 6 && (e.target as HTMLElement)?.closest?.("[data-hscroll]"))) {
        sideways = true;
        stripAnim = false;
        return;
      }
      e.preventDefault();
      if (swiped || Math.abs(d) < 34) return;
      swiped = true;
      const speed = Math.abs(d) / Math.max(16, performance.now() - touchT0); // px per ms
      input(Math.sign(d) * (260 + Math.min(1.6, speed) * 380), true, true);
    };
    const onTouchEnd = () => {
      touchY0 = null;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && worldOpen) return closeWorld();
      if (!filmMode || worldOpen || ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); input(300, true); }
      if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); input(-300, true); }
    };

    // Nav links: the next scene glides, far ones cut; FAQ leaves the film. A "fly" link glides through every room on the way.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const raw = a.getAttribute("href") || "";
      const id = raw.startsWith("#") ? raw.slice(1) : raw.startsWith("/#") ? raw.slice(2) : "";
      if (!id) return;
      const map: Record<string, SceneKey> = { top: "hero", services: "services", web: "web", mobile: "mobile", how: "how", originals: "originals", contact: "close" };
      if (map[id] !== undefined) {
        e.preventDefault();
        const i = sceneIndex(map[id]);
        if (a.hasAttribute("data-fly") && filmMode && !moving && !reduce && i !== current) head(i, true);
        else cutRef.current(i);
      } else if (id === "faq") {
        e.preventDefault();
        if (worldOpen) closeWorld();
        if (filmMode) exitFilm();
        else if (lenis) lenis.scrollTo("#faq", { duration: 1.4 });
        else document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
      }
    };

    // Clicking (or tapping) a thing in the room steps into it.
    const hitAt = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      const x = clientX - r.left, y = clientY - r.top;
      return areas.findIndex((a) => x >= a.x0 && x <= a.x1 && y >= a.y0 && y <= a.y1);
    };
    const onStageClick = (e: MouseEvent) => {
      if (!filmMode || moving || worldOpen) return;
      if ((e.target as HTMLElement).closest("a,button,input,label,form,[data-hscroll]")) return;
      const k = hitAt(e.clientX, e.clientY);
      if (k >= 0) openWorld(k);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    stage.addEventListener("click", onStageClick);
    // other parts of the page (the footer's "back to the top", the map) can send the film to a scene
    const onGoto = (e: Event) => {
      const i = Number((e as CustomEvent).detail) || 0;
      if (worldOpen) closeWorld();
      if (filmMode) return cutRef.current(i);
      // from below the film: glide up to it first, then let it take over
      exiting = true;
      if (lenis) lenis.scrollTo(0, { duration: 1.3, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      setTimeout(() => {
        exiting = false;
        enterFilm();
        if (i !== current) cut(i);
      }, reduce ? 50 : 1350);
    };
    window.addEventListener("film:goto", onGoto);

    // with a mouse, the process strip can be dragged sideways
    let dragX: number | null = null;
    let dragging = false;
    const sDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !strip || e.button !== 0) return;
      dragX = e.clientX;
      dragging = true;
      stripAnim = false;
      strip.setPointerCapture(e.pointerId);
      strip.classList.add("dragging");
    };
    const sMove = (e: PointerEvent) => {
      if (dragX === null || !strip) return;
      stripTarget = clamp(stripTarget - (e.clientX - dragX), 0, stripMax());
      strip.scrollLeft = stripTarget;
      dragX = e.clientX;
    };
    const sUp = () => {
      if (dragX === null || !strip) return;
      dragX = null;
      dragging = false;
      strip.classList.remove("dragging");
    };
    strip?.addEventListener("pointerdown", sDown);
    strip?.addEventListener("pointermove", sMove);
    strip?.addEventListener("pointerup", sUp);
    strip?.addEventListener("pointercancel", sUp);

    const opts = { mouse: [0, 0] as [number, number], pointer: [0.5, 0.5] as [number, number], motion: 0 };
    let liveAt = 0;
    let screenKey = "";

    const tick = (nowMs: number) => {
      if (!alive) return;
      lenis?.raf(nowMs);
      const now = nowMs / 1000;
      const dt = Math.min(0.05, (nowMs - lastTick) / 1000);
      lastTick = nowMs;
      boost *= Math.exp(-dt / 0.45);
      peekZ += (peekTarget - peekZ) * Math.min(1, dt * (peekTarget ? 3.2 : 3.4));
      if (lookOn) {
        const k = Math.min(1, dt * 1.6);
        look.x += (look.tx - look.x) * k;
        look.y += (look.ty - look.y) * k;
      }
      if (Math.abs(peekTarget - peekZ) < 0.001) peekZ = peekTarget;

      if (moving) {
        const d = target - pos;
        const vmax = flying ? FLY_V : BASE_V + BOOST_V * boost;
        const want = Math.sign(d) * Math.min(vmax, Math.sqrt(2 * ACC * (flying ? 1.6 : 1) * Math.abs(d)));
        const a = (vel !== 0 && Math.sign(want) !== Math.sign(vel) ? ACC * 2.6 : ACC) * (flying ? 1.6 : 1);
        vel += clamp(want - vel, -a * dt, a * dt);
        const dir = Math.sign(vel) || Math.sign(d) || 1;
        pos = clamp(pos + vel * dt, 0, LAST);
        // text: hide as soon as we leave a scene, show just before we arrive
        if (shown !== null && Math.abs(pos - shown) > 0.02) showText(null);
        if (Math.abs(target - pos) < TEXT_AT) showText(target);
        if (reduce || (Math.abs(target - pos) < 0.002 && Math.abs(vel) < 0.06)) {
          pos = current = target;
          vel = 0;
          moving = false;
          flying = false;
          arrivedAt = now;
          held = true;
          dawnCued = false;
          departShot = null;
          arriveShot = reduce ? null : (headDir || dir) > 0 ? segShot(target - 1, 1) : segShot(target, 0);
          showText(target);
          // arriving at the steps from the room after them: they wait at their end
          if (strip && SCENES[current].key === "how") stripTarget = strip.scrollLeft = headDir < 0 ? stripMax() : 0;
          if (current > 0 && current < LAST) soundRef.current?.cue("room");
        }
      }

      // the steps glide to where the scroll sent them
      if (strip && stripAnim && !dragging) {
        const d = stripTarget - strip.scrollLeft;
        if (Math.abs(d) < 0.6) {
          strip.scrollLeft = stripTarget;
          stripAnim = false;
        } else strip.scrollLeft += d * Math.min(1, dt * 7);
      }

      // below the film (FAQ, footer) there's nothing to draw: leave the GPU free for scrolling
      const visible = filmMode || window.scrollY < stage.clientHeight;
      if (engine?.ready && visible) {
        let shot: Single;
        let painted = false;
        // paint only when the picture would actually change
        const keyOf = (s: Single) => (s.kind === "hold" ? `h${s.still}` : `c${s.clip}${s.t.toFixed(4)}`);
        const still = SCENES[current].still;
        const spots = !moving ? spotsHere() : [];
        const peekSpot = spots[peekIdx];
        const spotAt = peekSpot ? engine.stillPoint(still, peekSpot.u, peekSpot.v) : null;
        const pz = smooth(peekZ);
        const dx = lookOn ? Math.round(look.x * 400) / 400 : 0, dy = lookOn ? Math.round(look.y * 400) / 400 : 0;
        const draw = (s: Shot) => {
          const k = (s.kind === "mix" ? `m${keyOf(s.a)}${keyOf(s.b)}${s.mix.toFixed(3)}` : keyOf(s)) + "v" + engine!.version + "p" + pz.toFixed(3) + "d" + dx + "," + dy;
          if (k === lastKey) return;
          lastKey = k;
          painted = true;
          engine!.paint(s, { time: now, ...opts, peek: spotAt && pz > 0 ? { z: pz, f: spotAt } : undefined, drift: lookOn ? [dx * (1 - pz), dy * (1 - pz)] : undefined });
        };
        if (!moving) {
          shot = restShot(current, now);
          const f = arriveShot ? smooth(clamp((now - arrivedAt) / 0.8)) : 1;
          // the hero: night slowly becomes sunrise and back again while you read
          const since = now - arrivedAt - 2.5;
          day = current === 0 && !reduce && engine.hasStill("s1d") && since > 0 ? smooth(0.5 - 0.5 * Math.cos((since / DAY_S) * Math.PI * 2)) : 0;
          if (day > 0.35 && !dawnCued) {
            dawnCued = true;
            soundRef.current?.cue("dawn");
          }
          if (f < 1) draw({ kind: "mix", a: arriveShot!, b: shot, mix: f });
          else if (day > 0.001) {
            arriveShot = null;
            const sun: Single = { kind: "hold", still: "s1d", rest: 1 };
            draw(day < 0.999 ? { kind: "mix", a: shot, b: sun, mix: day } : sun);
            if (day > 0.5) shot = sun;
          } else {
            arriveShot = null;
            draw(shot);
          }
          stage.classList.toggle("day", day > 0.4);
          root.classList.toggle("hero-day", day > 0.4);
        } else {
          shot = clipShot(pos);
          const f = departShot ? smooth(clamp(Math.abs(pos - departPos) / (departShot.kind === "hold" && departShot.still === "s1d" ? 0.35 : 0.07))) : 1;
          if (f < 1) draw({ kind: "mix", a: departShot!, b: shot, mix: f });
          else draw(shot);
          if (stage.classList.contains("day") && pos > 0.3) {
            stage.classList.remove("day");
            root.classList.remove("hero-day");
          }
        }
        lastShot = shot;

        const W = canvas.clientWidth, H = canvas.clientHeight;
        const map = (u: number, v: number): [number, number] => {
          const p = engine!.toScreen(engine!.stillPoint(still, u, v));
          return [p[0] * W, p[1] * H];
        };

        // the room's living light, once we've arrived
        const settled = !moving && shown === current && now - arrivedAt > 0.35;
        if (living) {
          living.setStill(settled || peekZ > 0 || living.amount > 0.01 ? (still === "s1n" && day > 0.5 ? "s1d" : still) : null);
          const want = settled ? 1 : 0;
          living.amount += (want - living.amount) * Math.min(1, dt * (want ? 0.9 : 6));
          if (living.amount < 0.004 && !want) living.amount = 0;
          // about 30 frames a second is plenty for slow light
          if (nowMs - liveAt > 33 && (living.amount > 0 || painted)) {
            liveAt = nowMs;
            const [x0] = map(0, 0.5), [x1] = map(1, 0.5);
            living.draw(now, map, x1 - x0, reduce);
          }
        }

        // the room's screen, fitted onto the screen in the photo
        const scr = SCREENS[still];
        const el = screenRef.current;
        if (el) {
          const amt = scr && settled ? 1 : 0;
          const cur = Number(el.dataset.amt || 0);
          const next = cur + (amt - cur) * Math.min(1, dt * (amt ? 1.4 : 7));
          if (Math.abs(next - cur) > 0.001 || painted) {
            el.dataset.amt = String(next < 0.003 && !amt ? 0 : next);
            el.style.opacity = String(next * 0.97);
            if (scr && (painted || screenKey !== still)) {
              screenKey = still;
              const size = scr.app === "dash" ? DASH_SIZE : scr.app === "phone" ? PHONE_SIZE : BUILD_SIZE;
              el.style.width = size.w + "px";
              el.style.height = size.h + "px";
              el.style.transform = quadMatrix(size.w, size.h, scr.quad.map(([u, v]) => map(u, v)));
            }
          }
        }

        // the markers sit on the things you can step into, once the scene has settled
        const showMarks = !!spots.length && !moving && shown === current && peekTarget === 0 && now - arrivedAt > 0.9;
        areas = showMarks || peekTarget ? spots.map((s) => {
          const [ax, ay] = map(s.area[0], s.area[1]);
          const [bx, by] = map(s.area[2], s.area[3]);
          return { x0: ax, y0: ay, x1: bx, y1: by };
        }) : [];
        markRefs.current.forEach((m, k) => {
          if (!m) return;
          const s = spots[k];
          let show = showMarks && !!s;
          if (show) {
            const [x, y] = mode === "m" && s.pm ? map(s.pm[0], s.pm[1]) : map(s.u, s.v);
            show = x > W * 0.03 && x < W * 0.97 && y > 60 && y < H - 40;
            if (show) {
              // near the right edge the name goes on the left of the dot
              const flip = x > W * 0.66;
              m.classList.toggle("flip", flip);
              m.style.transform = `translate3d(${flip ? x - m.offsetWidth + 44 : x}px, ${y}px, 0)`;
            }
          }
          if (show !== !!spotsShown[k]) {
            spotsShown[k] = show;
            m.classList.toggle("on", show);
            // the first time you arrive in a room, its marker blooms once
            if (show && bloomed !== current) {
              m.classList.remove("bloom");
              void m.offsetWidth;
              m.classList.add("bloom");
            }
          }
        });
        if (showMarks) bloomed = current;

        // the "Open" cursor over things you can step into
        if (fine && cursorRef.current) {
          const r = canvas.getBoundingClientRect();
          const k = showMarks ? areas.findIndex((a) => ptr.x - r.left >= a.x0 && ptr.x - r.left <= a.x1 && ptr.y - r.top >= a.y0 && ptr.y - r.top <= a.y1) : -1;
          const overText = (document.elementFromPoint(ptr.x, ptr.y) as HTMLElement | null)?.closest?.("a,button,input,label,form,[data-hscroll],nav");
          const on = k >= 0 && !overText;
          if (on !== ptr.on || k !== hover) {
            ptr.on = on;
            hover = k;
            cursorRef.current.classList.toggle("on", on);
            stage.classList.toggle("over-spot", on);
          }
          ptr.cx += (ptr.x - ptr.cx) * Math.min(1, dt * 14);
          ptr.cy += (ptr.y - ptr.cy) * Math.min(1, dt * 14);
          if (ptr.cx < -1000) { ptr.cx = ptr.x; ptr.cy = ptr.y; }
          cursorRef.current.style.transform = `translate3d(${ptr.cx}px, ${ptr.cy}px, 0)`;
        }

        // the thin line along the bottom: how far through the film we are
        const at = Math.round((pos / LAST) * 1000) / 1000;
        if (line && at !== lineAt) {
          lineAt = at;
          line.style.transform = `scaleX(${at})`;
        }
        const inside = smooth(clamp((pos - 1.2) / 0.8)) * (1 - smooth(clamp((pos - 5.1) / 0.8)));
        soundRef.current?.setPlace(inside);
      }
      raf = requestAnimationFrame(tick);
    };

    const begin = (withSound?: boolean, gesture = false) => {
      if (started || !alive) return;
      started = true;
      setReady(true);
      arrivedAt = performance.now() / 1000;
      // sound: the choice made at the entrance, remembered for next time
      let pref = "on";
      try { pref = localStorage.getItem("si-sound") || "on"; } catch {}
      if (withSound !== undefined) {
        pref = withSound ? "on" : "off";
        try { localStorage.setItem("si-sound", pref); } catch {}
      }
      const s = (soundRef.current = new Soundscape());
      s.onChange = () => {};
      if (pref !== "off") {
        s.start(true);
        if (gesture) s.unlock();
      }
      const hash = window.location.hash.slice(1);
      const map: Record<string, number> = { services: 1, web: 2, mobile: 3, how: 4, originals: 5, contact: 6 };
      if (hash === "faq") return void setTimeout(exitFilm, 600);
      if (map[hash]) return void setTimeout(() => cut(map[hash]), 200);
      setTimeout(() => showText(0), 550);
    };
    // the entrance: once a visit, you choose to come in with sound or quietly
    // (remembered for the visit: in the tab, and when you come back from another page of the site)
    let entered = /si-entered/.test(window.name) || /[?&]in=1/.test(location.search);
    try { entered = entered || sessionStorage.getItem("si-entered") === "1"; } catch {}
    try { if (document.referrer && new URL(document.referrer).origin === location.origin) entered = true; } catch {}
    try { entered = entered || Date.now() - Number(localStorage.getItem("si-entered-at") || 0) < 2 * 3600e3; } catch {}
    const remember = () => {
      try { sessionStorage.setItem("si-entered", "1"); } catch {}
      try { localStorage.setItem("si-entered-at", String(Date.now())); } catch {}
      if (!/si-entered/.test(window.name)) window.name = (window.name ? window.name + " " : "") + "si-entered";
    };
    // returning within the visit: no entrance at all
    // no loading screen: the film simply fades up from black once it is ready
    setSkipEntrance(true);

    fetch(asset("/film/manifest.json"))
      .then((r) => r.json())
      .then(async (m: Manifest) => {
        if (!alive) return;
        engine = new FilmEngine(canvas, m, mode);
        engine.onProgress = (p) => setProgress((v) => Math.max(v, Math.min(0.5, p * 0.5)));
        resize();
        await engine.loadStills(["s1n", "s2"]);
        preload(0);
        // in as soon as the first move can play (its frames load coarse-to-fine); the night loop
        // streams in behind and takes over from the still when it's complete
        const t0 = performance.now();
        const need: ClipId[] = ["c1"];
        const wait = () => {
          if (!alive) return;
          const have = Math.min(1, engine!.loadedRatio(need) / 0.6);
          setProgress(0.5 + have * 0.5);
          if ((have >= 1 && performance.now() - t0 > (entered ? 400 : 1200)) || performance.now() - t0 > 7000) {
            setLoaded(true);
            remember();
            begin();
          } else setTimeout(wait, 100);
        };
        wait();
      })
      .catch(() => {
        setLoaded(true);
        begin();
      });

    // the first click, tap or key press anywhere lets the sound begin
    const unlockSound = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.("[data-sound-toggle]")) return;
      soundRef.current?.unlock();
    };
    const gestures = ["pointerdown", "keydown", "touchend"];
    gestures.forEach((ev) => window.addEventListener(ev, unlockSound, { capture: true }));
    // a tap on things you can click: the softest sound
    const onTap = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest?.(".spot, .scene-dot, [data-app] button")) soundRef.current?.cue("tap");
    };
    window.addEventListener("pointerdown", onTap);

    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      stage.removeEventListener("click", onStageClick);
      window.removeEventListener("film:goto", onGoto);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onTap);
      strip?.removeEventListener("pointerdown", sDown);
      strip?.removeEventListener("pointermove", sMove);
      strip?.removeEventListener("pointerup", sUp);
      strip?.removeEventListener("pointercancel", sUp);
      gestures.forEach((ev) => window.removeEventListener(ev, unlockSound, { capture: true }));
      lenis?.destroy();
      root.classList.remove("film-lock");
      engine?.destroy();
      soundRef.current?.destroy();
    };
  }, []);

  // tell the navigation where we are
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("film:scene", { detail: SCENES[scene].key }));
  }, [scene]);


  const { hero, services, how, originals, close, studio, entrance } = content;
  const rooms = content.rooms;
  const sceneStyle = { opacity: 0, visibility: "hidden" as const, transition: "opacity 600ms cubic-bezier(0.22,0.61,0.36,1), visibility 600ms" };
  const still = SCENES[scene].still;
  const spots = SPOTS[still] ?? [];
  const screen = SCREENS[still];

  return (
    <div id="top" className="relative h-svh">
      <div ref={stageRef} className="film-stage relative h-svh w-full overflow-hidden bg-ink" style={{ touchAction: "pan-x" }}>
        <div className="film-frame absolute inset-x-0 top-0">
          <picture>
            <source media="(max-width: 899px)" srcSet={asset("/film/stills/s1n-m.webp")} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/film/stills/s1n-d.webp")} alt="A glass penthouse studio above a city at night" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-[60%_55%] max-md:object-center" />
          </picture>
          <canvas ref={canvasRef} aria-hidden className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />
          {/* the room's screen, live, fitted onto the screen in the photo */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div ref={screenRef} className={`room-screen absolute left-0 top-0 origin-top-left ${screen?.app === "phone" ? "is-phone" : ""}`} style={{ opacity: 0 }}>
              {screen?.app === "dash" && <Dashboard />}
              {screen?.app === "phone" && <PhoneApps notify />}
              {screen?.app === "build" && <BuildScreen />}
              <div className="absolute inset-0 [background:linear-gradient(115deg,rgb(255_255_255/0.1),transparent_45%)]" />
            </div>
          </div>
          {/* the room's living light */}
          <canvas ref={liveRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[38%] [background:linear-gradient(180deg,transparent,rgb(7_10_18/0.55)_45%,#070a12)] md:hidden" />
        </div>

        {/* ---------------- Scenes ----------------
            Every scene's words are one block (title, lead, actions) set to the same system.
            What changes from scene to scene is the room, the camera and how the words arrive. */}
        <section data-scene="hero" aria-label="Introduction" className="scene-text reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[96px] md:pb-[12svh]" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(7_10_18/0.9)_0%,rgb(7_10_18/0.5)_36%,transparent_60%)] md:[background:linear-gradient(15deg,rgb(7_10_18/0.92)_0%,rgb(7_10_18/0.55)_36%,transparent_62%)]" />
          <div className="stack max-w-[640px]">
            <h1 className="t-display"><Words text={hero.headline} /></h1>
            <p className="rise t-lead max-w-[38ch]" style={{ ["--d" as string]: "300ms" }}>{hero.line}</p>
            <div className="rise actions" style={{ ["--d" as string]: "420ms" }}>
              <BookCall>{hero.primary}</BookCall>
            </div>
          </div>
        </section>

        <section data-scene="services" aria-label="What we do" className="scene-text reveal absolute inset-0 isolate flex flex-col items-center justify-center px-[var(--gutter)] text-center" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:radial-gradient(80%_65%_at_50%_50%,rgb(7_10_18/0.78),rgb(7_10_18/0.35)_70%,rgb(7_10_18/0.15)_100%)]" />
          <h2 className="t-mono max-w-[16ch] text-[clamp(44px,7.4vw,112px)]">
            <Words text={services.headline[0]} />
            <br />
            <span className="text-paper/60"><Words text={services.headline[1]} delay={180} /></span>
          </h2>
        </section>

        {(["web", "mobile"] as const).map((k, n) => {
          const sv = services[k];
          return (
            <section key={k} data-scene={k} aria-label={sv.title} className="scene-text reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[96px] md:pb-[12svh]" style={sceneStyle}>
              <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(7_10_18/0.9)_0%,rgb(7_10_18/0.45)_34%,transparent_58%)]" />
              <div className="stack">
                <p className="rise kicker" style={{ ["--d" as string]: "0ms" }}>{sv.kicker}</p>
                <h2 className="scene-title"><Words text={sv.heading} delay={120} /></h2>
                <p className="rise t-lead" style={{ ["--d" as string]: "250ms" }}>{sv.line}</p>
                <div className="rise actions" style={{ ["--d" as string]: "380ms" }}>
                  <a href={href(sv.more.href)} className="more">{sv.more.link}</a>
                </div>
              </div>
            </section>
          );
        })}

        {/* Process: the steps arrive from the side; scrolling moves them sideways */}
        <section data-scene="how" aria-label={how.heading.replace(/\*/g, "")} className="scene-text reveal absolute inset-0 isolate flex flex-col justify-end pb-[86px] md:pb-[10svh]" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(7_10_18/0.94)_0%,rgb(7_10_18/0.6)_42%,transparent_72%)]" />
          {/* the chapter's name, up in the corner */}
          <div className="stack absolute left-[var(--gutter)] top-[max(92px,13svh)]">
            <p className="rise kicker" style={{ ["--d" as string]: "0ms" }}>{how.kicker}</p>
            <h2 className="scene-title"><Words text={how.heading} delay={120} /></h2>
          </div>
          {/* one step at a time, like the close-ups: a title with an italic word, one plain line */}
          <div className="relative grid px-[var(--gutter)]">
            {how.steps.map((st, i) => {
              const on = i === howStep;
              return (
                <div key={st.title} aria-hidden={!on} className="col-start-1 row-start-1 max-w-[520px] transition-[opacity,transform,filter] duration-[900ms] [transition-timing-function:var(--ease-out)]" style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(10px)", filter: on ? "none" : "blur(8px)", transitionDelay: on ? "120ms" : "0ms" }}>
                  <h3 className="t-title"><Words text={how.walk[i]} /></h3>
                  <p className="t-lead mt-4">{st.line}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-10 flex items-center gap-4 px-[var(--gutter)] md:mt-12">
            <div aria-hidden className="flex gap-2">
              {how.steps.map((st, i) => (
                <span key={st.title} className={`h-[2px] rounded-full transition-all duration-700 [transition-timing-function:var(--ease-out)] ${i === howStep ? "w-8 bg-paper" : "w-3 bg-paper/30"}`} />
              ))}
            </div>
            <p className="t-label strip-hint">{canSwipe ? how.swipe : how.drag}</p>
          </div>
          {/* the strip itself is invisible: scrolling, swiping or dragging moves it, and it turns the steps */}
          <div data-hscroll aria-hidden className="hstrip absolute inset-x-0 bottom-0 h-[46%] overflow-x-auto overscroll-x-contain opacity-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ol className="flex h-full w-max">
              {how.steps.map((st) => (
                <li key={st.title} className="h-full w-[60vw] shrink-0 md:w-[30vw]" />
              ))}
              <li className="h-full w-[10vw] shrink-0" />
            </ol>
          </div>
        </section>

        <section data-scene="originals" aria-label={originals.eyebrow} className="scene-text reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[92px] md:justify-center md:pb-0" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,#070a12_0%,rgb(7_10_18/0.94)_52%,rgb(7_10_18/0.55)_72%,transparent_88%)] md:[background:linear-gradient(90deg,rgb(7_10_18/0.9)_0%,rgb(7_10_18/0.6)_38%,transparent_62%)]" />
          <div className="stack max-w-[460px]">
            <h2 className="t-title"><Words text={originals.heading} /></h2>
            <p className="rise t-lead" style={{ ["--d" as string]: "250ms" }}>{originals.line}</p>
            <div className="rise actions" style={{ ["--d" as string]: "380ms" }}>
              <button type="button" onClick={() => openRef.current(0)} className="btn btn-primary">{originals.cta}</button>
              <button type="button" onClick={() => openRef.current(0)} className="more">{originals.inside}</button>
            </div>
          </div>
        </section>

        <section data-scene="close" aria-label={close.heading.replace(/\*/g, "")} className="scene-text reveal absolute inset-0 isolate flex flex-col items-center justify-center px-[var(--gutter)]" style={sceneStyle}>
          <div aria-hidden className="close-shade absolute inset-0 -z-10" />
          <div className="stack center">
            <h2 className="t-display"><Words text={close.heading} /></h2>
            <p className="rise t-lead max-w-[34ch]" style={{ ["--d" as string]: "250ms" }}>{close.line}</p>
            <div className="rise actions" style={{ ["--d" as string]: "380ms" }}>
              <BookCall>{close.cta}</BookCall>
              <a href={`mailto:${studio.email}`} className="more">{close.email}</a>
            </div>
          </div>
        </section>

        {/* ---------------- Things to step into: a marker on each ---------------- */}
        <div className="film-frame pointer-events-none absolute inset-x-0 top-0 z-20">
          {[0, 1].map((k) => {
            const s = spots[k];
            return (
              <button
                key={k}
                ref={(el) => { markRefs.current[k] = el; }}
                type="button"
                tabIndex={s ? 0 : -1}
                onClick={() => openRef.current(k)}
                aria-label={s ? `${s.label}: ${rooms[scene] ?? ""}` : undefined}
                className={`spot pointer-events-auto absolute left-0 top-0 ${s?.main ? "main" : "minor"} ${s ? "" : "hidden"}`}
              >
                <span aria-hidden className="spot-dot" />
                <span aria-hidden className="spot-line" />
                <span className="spot-label">{s?.label}<span aria-hidden className="spot-plus">+</span></span>
              </button>
            );
          })}
        </div>

        {/* ---------------- Quiet controls ---------------- */}
        <div className={`pointer-events-none absolute inset-x-[var(--gutter)] bottom-5 z-10 flex items-center justify-between transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
          <div className="pointer-events-auto -ml-2 hidden items-center md:flex">
            {SCENES.map((s, i) => (
              <button key={s.key} type="button" aria-label={`Go to ${rooms[i]}`} aria-current={i === scene ? "true" : undefined} onClick={() => cutRef.current(i)} className="scene-dot group relative flex h-10 items-center px-2">
                <span className={`block h-[2px] rounded-full transition-all duration-700 [transition-timing-function:var(--ease-out)] ${i === scene ? "w-9 bg-paper" : "w-4 bg-white/30 group-hover:bg-white/70"}`} />
                <span className="scene-dot-name">{rooms[i]}</span>
              </button>
            ))}
          </div>

        </div>

        {/* ---------------- Entrance: the city surfaces, the world's clocks tick, then you come in ---------------- */}
        {/* once you choose, it opens from the middle, like blinds parting on the city */}
        <div aria-hidden={ready} className={`entrance-wrap fixed inset-0 z-[60] overflow-hidden bg-ink transition-[clip-path,visibility,opacity] duration-[1500ms] [transition-timing-function:cubic-bezier(0.77,0,0.175,1)] ${ready ? "invisible" : ""}`} style={skipEntrance ? { opacity: ready ? 0 : 1 } : { clipPath: ready ? "inset(50% 0 50% 0)" : "inset(0 0 0 0)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/film/stills/s1n-m.webp")}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[60%_55%] transition-[opacity,filter,transform] duration-[1400ms] [transition-timing-function:var(--ease-film)]"
            style={{ opacity: 0.1 + progress * 0.35, filter: `blur(${16 - progress * 10}px)`, transform: `scale(${1.12 - progress * 0.08})` }}
          />
          <div className="absolute inset-0 [background:radial-gradient(80%_70%_at_50%_50%,rgb(7_10_18/0.35),rgb(7_10_18/0.94))]" />
          <div className={`entrance absolute inset-0 flex flex-col items-center justify-center px-[var(--gutter)] text-center ${skipEntrance ? "invisible" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/brand/logo.svg")} alt={studio.name} width={64} height={25} className="h-auto w-[84px] opacity-90" />
            <div className="relative mt-10 h-px w-[120px] overflow-hidden bg-white/15">
              <div className="h-full origin-left bg-paper/80 transition-transform duration-500" style={{ transform: `scaleX(${progress})` }} />
            </div>
          </div>
        </div>

        <div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-white/[0.06] transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
          <div ref={lineRef} className="h-full origin-left bg-gradient-to-r from-paper/10 via-paper/50 to-signal shadow-[0_0_8px_rgb(232_161_90/0.5)]" style={{ transform: "scaleX(0)" }} />
        </div>
        <div ref={curtainRef} aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-ink" style={{ opacity: 0 }} />
      </div>

      {/* the cursor over things you can step into */}
      <div ref={cursorRef} aria-hidden className="open-cursor pointer-events-none fixed left-0 top-0 z-[45]">
        <span>Open</span>
      </div>

      <World id={world} onClose={() => closeRef.current()} cue={(k) => soundRef.current?.cue(k)} />

      <style>{`
        @keyframes eq { from { height: 3px; } to { height: 10px; } }
        .steps-bar { transform: scaleX(0); transition: transform 1500ms cubic-bezier(0.22,0.61,0.36,1) 100ms; }
        .on .steps-bar { transform: scaleX(1); }
      `}</style>
    </div>
  );
}
