"use client";

import Lenis from "lenis";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { asset, content, href } from "@/lib/content";
import { Soundscape } from "@/lib/sound";
import { BookCall } from "../BookCall";
import { LaunchTrack, WaitlistForm } from "../Originals";
import { Words } from "../Words";
import { FilmEngine, type Manifest, type Shot, type Single } from "./engine";
import { SCENES, sceneIndex, type SceneKey } from "./scenes";
import { SPOTS, type ClipId } from "./timeline";

/*
 * How the film moves
 * ------------------
 * The film has a position measured in scenes (0 = hero … 6 = close). A scroll gesture sets the next
 * scene as the target and the position glides there with constant, gentle acceleration and braking.
 * Scrolling more while it moves pushes it faster — the video follows the scroll — and scrolling back
 * reverses it smoothly from wherever it is. At rest a scene sits on its crisp still (outside, on the
 * hero and the close, a living seamless loop of the city when it is available).
 */
const BASE_V = 0.48; // scenes per second when it glides on its own
const BOOST_V = 0.85; // extra speed while the visitor keeps scrolling
const ACC = 0.85; // scenes per second², speeding up and braking
const TEXT_AT = 0.16; // text starts to appear this far (in scenes) before arrival
const LOOP_S = 5; // length of the seamless loop clip, seconds
const LAST = SCENES.length - 1;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const segShot = (k: number, t: number): Single => ({ kind: "clip", clip: SCENES[k + 1].enter!, from: SCENES[k].still, to: SCENES[k + 1].still, t });

export function FilmStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLButtonElement>(null);
  const peekRef = useRef<(open: boolean) => void>(() => {});
  const [panel, setPanel] = useState<"web" | "mobile" | "how" | null>(null);
  const soundRef = useRef<Soundscape | null>(null);
  const cutRef = useRef<(i: number) => void>(() => {});
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [scene, setScene] = useState(0);
  const [audible, setAudible] = useState(false);
  const [soundPref, setSoundPref] = useState(true);

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
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    let engine: FilmEngine | null = null;
    let raf = 0;
    let alive = true;
    let started = false;

    // film state
    let pos = 0; // where the film is, in scenes
    let vel = 0;
    let target = 0;
    let current = 0; // the scene we last came to rest on
    let moving = false;
    let boost = 0;
    let shown: number | null = null;
    let arrivedAt = 0;
    let held = false; // just arrived: ignore the tail of the same scroll gesture
    let arriveShot: Single | null = null; // the last clip frame we arrived on, faded into the crisp still
    let departShot: Single | null = null; // the frame we left from, faded into the clip
    let departPos = 0;
    let lastShot: Single | null = null;
    let lastTick = performance.now();

    // page state
    let filmMode = true;
    let exiting = false;
    let lastWheel = 0;
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
    // stepping closer to something in a room (the monitor, the phone)
    // desktop: the camera drifts a little toward the cursor, slowly
    const look = { tx: 0, ty: 0, x: 0, y: 0 };
    const lookOn = !touchUI && !reduce && window.matchMedia("(pointer: fine)").matches;
    const onLook = (e: PointerEvent) => {
      look.tx = (e.clientX / window.innerWidth) * 2 - 1;
      look.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (lookOn) window.addEventListener("pointermove", onLook, { passive: true });
    let peekTarget = 0;
    let peekZ = 0;
    let spotShown = false;
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      // the phone's address bar sliding in and out changes only the height a little: ignore it
      if (touchUI && w === lastW && Math.abs(h - lastH) < 140 && lastH) return;
      lastW = w;
      lastH = h;
      engine?.resize(w, h, Math.min(window.devicePixelRatio || 1, touchUI ? 1.5 : 2));
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

    const preload = (i: number) => {
      if (!engine) return;
      const want: ClipId[] = [];
      const add = (c: ClipId | null | undefined) => c && engine!.frames(c) > 0 && !want.includes(c) && want.push(c);
      add(SCENES[i + 1]?.enter);
      add(SCENES[i].enter);
      add(SCENES[i].loop);
      for (let r = 2; r < SCENES.length; r++) add(SCENES[i + r]?.enter);
      add("cl");
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

    // Start gliding towards scene i.
    const head = (i: number) => {
      i = Math.max(0, Math.min(LAST, i));
      if (peekTarget) setPeek(false);
      if (i === target && moving) return;
      if (!moving) {
        departShot = lastShot;
        departPos = pos;
        moving = true;
      }
      target = i;
      setScene(i);
      preload(i);
    };

    // Jump straight to scene i under a soft curtain (nav links, long jumps).
    const cut = (i: number) => {
      if (peekTarget) setPeek(false);
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
        setScene(i);
        preload(i);
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

    const setPeek = (open: boolean) => {
      const spot = SPOTS[SCENES[current].still];
      if (open && (!spot || moving)) return;
      peekTarget = open ? 1 : 0;
      stage.classList.toggle("peeking", open);
      setPanel(open && spot ? (spot.id as "web" | "mobile" | "how") : null);
    };
    peekRef.current = setPeek;

    /** One unit of scroll intent. dy in pixels (+ = forward); fresh = the start of a new gesture. */
    const input = (dy: number, fresh: boolean) => {
      if (!started || !dy) return;
      // looking closer at something: the first scroll steps back out
      if (peekTarget) {
        if (fresh) setPeek(false);
        return;
      }
      const now = performance.now() / 1000;
      const dir = Math.sign(dy);
      if (!moving && held) {
        // let the visitor read: the rest of the same gesture is ignored
        if (fresh || (now - arrivedAt > 1.6 && Math.abs(dy) > 24)) held = false;
        else return;
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
      lastWheel = nowMs;
      if (!filmMode) {
        // at the very top of the page, scrolling up hands control back to the film
        if (!exiting && dy < 0 && scrollY() <= 1 && window.scrollY <= 1) {
          e.preventDefault();
          enterFilm();
        }
        return;
      }
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && (e.target as HTMLElement)?.closest?.("[data-hscroll]")) return;
      if ((e.target as HTMLElement)?.closest?.("[data-panel]")) return;
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
        return;
      }
      e.preventDefault();
      if (swiped || Math.abs(d) < 34) return;
      swiped = true;
      const speed = Math.abs(d) / Math.max(16, performance.now() - touchT0); // px per ms
      input(Math.sign(d) * (260 + Math.min(1.6, speed) * 380), true);
    };
    const onTouchEnd = () => {
      touchY0 = null;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && peekTarget) return setPeek(false);
      if (!filmMode || ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); input(300, true); }
      if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); input(-300, true); }
    };

    // Nav links: the next scene glides, far ones cut; FAQ leaves the film.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const raw = a.getAttribute("href") || "";
      const id = raw.startsWith("#") ? raw.slice(1) : raw.startsWith("/#") ? raw.slice(2) : "";
      if (!id) return;
      const map: Record<string, SceneKey> = { top: "hero", services: "services", web: "web", how: "how", originals: "originals", contact: "close" };
      if (map[id] !== undefined) {
        e.preventDefault();
        cutRef.current(sceneIndex(map[id]));
      } else if (id === "faq") {
        e.preventDefault();
        if (filmMode) exitFilm();
        else if (lenis) lenis.scrollTo("#faq", { duration: 1.4 });
        else document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    // other parts of the page (the footer's "back to the top") can send the film to a scene
    const onGoto = (e: Event) => {
      const i = Number((e as CustomEvent).detail) || 0;
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
    const strip = stage.querySelector<HTMLElement>("[data-hscroll]");
    let dragX: number | null = null;
    const sDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !strip) return;
      dragX = e.clientX;
      strip.style.scrollSnapType = "none";
      strip.style.cursor = "grabbing";
    };
    const sMove = (e: PointerEvent) => {
      if (dragX === null || !strip) return;
      strip.scrollLeft -= e.clientX - dragX;
      dragX = e.clientX;
    };
    const sUp = () => {
      if (dragX === null || !strip) return;
      dragX = null;
      strip.style.cursor = "";
      strip.style.scrollSnapType = "";
    };
    strip?.addEventListener("pointerdown", sDown);
    window.addEventListener("pointermove", sMove);
    window.addEventListener("pointerup", sUp);

    const opts = { mouse: [0, 0] as [number, number], pointer: [0.5, 0.5] as [number, number], motion: 0 };

    const tick = (nowMs: number) => {
      if (!alive) return;
      lenis?.raf(nowMs);
      const now = nowMs / 1000;
      const dt = Math.min(0.05, (nowMs - lastTick) / 1000);
      lastTick = nowMs;
      boost *= Math.exp(-dt / 0.45);
      peekZ += (peekTarget - peekZ) * Math.min(1, dt * (peekTarget ? 2.6 : 3.4));
      if (lookOn) {
        const k = Math.min(1, dt * 1.6);
        look.x += (look.tx - look.x) * k;
        look.y += (look.ty - look.y) * k;
      }
      if (Math.abs(peekTarget - peekZ) < 0.001) peekZ = peekTarget;

      if (moving) {
        const d = target - pos;
        const vmax = BASE_V + BOOST_V * boost;
        const want = Math.sign(d) * Math.min(vmax, Math.sqrt(2 * ACC * Math.abs(d)));
        const a = vel !== 0 && Math.sign(want) !== Math.sign(vel) ? ACC * 2.6 : ACC;
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
          arrivedAt = now;
          held = true;
          departShot = null;
          arriveShot = reduce ? null : dir > 0 ? segShot(target - 1, 1) : segShot(target, 0);
          showText(target);
        }
      }

      // below the film (FAQ, footer) there's nothing to draw: leave the GPU free for scrolling
      const visible = filmMode || window.scrollY < stage.clientHeight;
      if (engine?.ready && visible) {
        let shot: Single;
        // paint only when the picture would actually change
        const keyOf = (s: Single) => (s.kind === "hold" ? `h${s.still}` : `c${s.clip}${s.t.toFixed(4)}`);
        const spot = !moving ? SPOTS[SCENES[current].still] : undefined;
        const spotAt = spot ? engine.stillPoint(SCENES[current].still, spot.u, spot.v) : null;
        const pz = smooth(peekZ);
        const draw = (s: Shot) => {
          const dx = lookOn ? Math.round(look.x * 400) / 400 : 0, dy = lookOn ? Math.round(look.y * 400) / 400 : 0;
          const k = (s.kind === "mix" ? `m${keyOf(s.a)}${keyOf(s.b)}${s.mix.toFixed(3)}` : keyOf(s)) + "v" + engine!.version + "p" + pz.toFixed(3) + "d" + dx + "," + dy;
          if (k === lastKey) return;
          lastKey = k;
          engine!.paint(s, { time: now, ...opts, peek: spotAt && pz > 0 ? { z: pz, f: spotAt } : undefined, drift: lookOn ? [dx * (1 - pz), dy * (1 - pz)] : undefined });
        };
        if (!moving) {
          shot = restShot(current, now);
          const f = arriveShot ? smooth(clamp((now - arrivedAt) / 0.8)) : 1;
          if (f < 1) draw({ kind: "mix", a: arriveShot!, b: shot, mix: f });
          else {
            arriveShot = null;
            draw(shot);
          }
        } else {
          shot = clipShot(pos);
          const f = departShot ? smooth(clamp(Math.abs(pos - departPos) / 0.07)) : 1;
          if (f < 1) draw({ kind: "mix", a: departShot!, b: shot, mix: f });
          else draw(shot);
        }
        lastShot = shot;
        // the "look closer" marker sits on the object, once the scene has settled
        const mark = spotRef.current;
        if (mark) {
          const show = !!spotAt && !moving && shown === current && peekTarget === 0 && now - arrivedAt > 0.9;
          if (show) {
            const p = engine.toScreen(spotAt!);
            mark.style.transform = `translate3d(${p[0] * canvas.clientWidth}px, ${p[1] * canvas.clientHeight}px, 0)`;
          }
          if (show !== spotShown) {
            spotShown = show;
            mark.classList.toggle("on", show);
          }
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

    const begin = () => {
      if (started || !alive) return;
      started = true;
      setReady(true);
      arrivedAt = performance.now() / 1000;
      // sound is on by default; it begins on the first click, tap or key press the browser allows
      let pref = "on";
      try { pref = localStorage.getItem("si-sound") || "on"; } catch {}
      const s = (soundRef.current = new Soundscape());
      s.onChange = setAudible;
      setSoundPref(pref !== "off");
      if (pref !== "off") s.start(true);
      const hash = window.location.hash.slice(1);
      const map: Record<string, number> = { services: 1, web: 2, mobile: 3, how: 4, originals: 5, contact: 6 };
      if (hash === "faq") return void setTimeout(exitFilm, 600);
      if (map[hash]) return void setTimeout(() => cut(map[hash]), 200);
      setTimeout(() => showText(0), 550);
    };

    fetch(asset("/film/manifest.json"))
      .then((r) => r.json())
      .then(async (m: Manifest) => {
        if (!alive) return;
        engine = new FilmEngine(canvas, m, mode);
        engine.onProgress = (p) => setProgress(p * 0.5);
        resize();
        await engine.loadStills(["s1n", "s2"]);
        preload(0);
        // in as soon as the hero and the first transition can play
        const t0 = performance.now();
        // in as soon as the first move can play (its frames load coarse-to-fine); the night loop
        // streams in behind and takes over from the still when it's complete
        const need: ClipId[] = ["c1"];
        const wait = () => {
          if (!alive) return;
          const have = Math.min(1, engine!.loadedRatio(need) / 0.6);
          setProgress(0.5 + have * 0.5);
          if ((have >= 1 && performance.now() - t0 > 500) || performance.now() - t0 > 7000) begin();
          else setTimeout(wait, 100);
        };
        wait();
      })
      .catch(() => begin());

    // the first click, tap or key press anywhere lets the sound begin
    const unlockSound = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.("[data-sound-toggle]")) return;
      soundRef.current?.unlock();
    };
    const gestures = ["pointerdown", "keydown", "touchend"];
    gestures.forEach((ev) => window.addEventListener(ev, unlockSound, { capture: true }));

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
      window.removeEventListener("film:goto", onGoto);
      window.removeEventListener("pointermove", onLook);
      strip?.removeEventListener("pointerdown", sDown);
      window.removeEventListener("pointermove", sMove);
      window.removeEventListener("pointerup", sUp);
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

  const toggleSound = async () => {
    const s = (soundRef.current = soundRef.current ?? new Soundscape());
    s.onChange = setAudible;
    const next = !s.audible;
    try { localStorage.setItem("si-sound", next ? "on" : "off"); } catch {}
    setSoundPref(next);
    await s.start(next);
    if (next) s.unlock();
  };

  const { hero, services, how, originals, close, studio } = content;
  const pd = panel ? (panel === "how" ? how.more : services[panel].more) : null;
  const sceneStyle = { opacity: 0, visibility: "hidden" as const, transition: "opacity 600ms cubic-bezier(0.22,0.61,0.36,1), visibility 600ms" };

  return (
    <div id="top" className="relative h-svh">
      <div ref={stageRef} className="relative h-svh w-full overflow-hidden bg-ink" style={{ touchAction: "pan-x" }}>
        <div className="film-frame absolute inset-x-0 top-0">
          <picture>
            <source media="(max-width: 899px)" srcSet={asset("/film/stills/s1n-m.webp")} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/film/stills/s1n-d.webp")} alt="A glass penthouse studio above a city at night" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-[60%_55%] max-md:object-center" />
          </picture>
          <canvas ref={canvasRef} aria-hidden className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[38%] [background:linear-gradient(180deg,transparent,rgb(7_10_18/0.55)_45%,#070a12)] md:hidden" />
        </div>

        {/* ---------------- Scenes ----------------
            Every scene's words are one block (label, title, lead, actions) set to the same system.
            What changes from scene to scene is the room, the camera and how the words arrive. */}
        <section data-scene="hero" aria-label="Introduction" className="scene-text reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[96px] md:pb-[12svh]" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(7_10_18/0.9)_0%,rgb(7_10_18/0.5)_36%,transparent_60%)] md:[background:linear-gradient(15deg,rgb(7_10_18/0.92)_0%,rgb(7_10_18/0.55)_36%,transparent_62%)]" />
          <div className="stack max-w-[640px]">
            <h1 className="t-display"><Words text={hero.headline} /></h1>
            <p className="rise t-lead max-w-[38ch]" style={{ ["--d" as string]: "300ms" }}>{hero.line}</p>
            <div className="rise actions" style={{ ["--d" as string]: "420ms" }}>
              <BookCall>{hero.primary}</BookCall>
              <a href="#originals" className="more">{hero.secondary}</a>
            </div>
          </div>
        </section>

        <section data-scene="services" aria-label={services.intro} className="scene-text reveal absolute inset-0 isolate flex flex-col items-center justify-center px-[var(--gutter)] text-center" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:radial-gradient(80%_65%_at_50%_50%,rgb(7_10_18/0.78),rgb(7_10_18/0.35)_70%,rgb(7_10_18/0.15)_100%)]" />
          <p className="rise t-small mb-6 text-paper/70">{services.intro}</p>
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
                <h2 className={`t-title ${n ? "wipe" : ""}`}><Words text={sv.title} /></h2>
                <p className="rise t-lead" style={{ ["--d" as string]: "250ms" }}>{sv.line}</p>
                <div className="rise actions" style={{ ["--d" as string]: "380ms" }}>
                  <button type="button" onClick={() => peekRef.current(true)} className="more">{sv.more.spot}</button>
                  <a href={href(sv.more.href)} className="more">{sv.more.link}</a>
                </div>
              </div>
            </section>
          );
        })}

        {/* Process: the steps arrive from the side and can be dragged */}
        <section data-scene="how" aria-label={how.heading} className="scene-text reveal absolute inset-0 isolate flex flex-col justify-end pb-[86px] md:pb-[10svh]" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(7_10_18/0.94)_0%,rgb(7_10_18/0.6)_42%,transparent_72%)]" />
          <div className="mb-10 flex items-end justify-between gap-6 px-[var(--gutter)] md:mb-14">
            <div className="stack">
              <h2 className="t-title"><Words text={how.heading} /></h2>
            </div>
            <p className="rise t-label hidden sm:block" style={{ ["--d" as string]: "500ms" }}>{how.drag} →</p>
          </div>
          <div data-hscroll className="hstrip slide relative overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ol className="flex w-max snap-x snap-mandatory px-[var(--gutter)]">
              {how.steps.map((st, i) => (
                <li key={st.title} className="relative w-[78vw] max-w-[360px] shrink-0 snap-start pr-10 sm:w-[44vw] md:w-[28vw]">
                  <div className="mb-6 h-px w-full bg-paper/15">
                    <div className="steps-bar h-px origin-left bg-paper" style={{ transitionDelay: `${400 + i * 240}ms` }} />
                  </div>
                  <h3 className="t-title">{st.title}</h3>
                  <p className="t-body mt-4 max-w-[30ch]">{st.line}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section data-scene="originals" aria-label={originals.eyebrow} className="scene-text reveal absolute inset-0 isolate flex flex-col justify-end px-[var(--gutter)] pb-[92px] md:justify-center md:pb-0" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:linear-gradient(0deg,rgb(7_10_18/0.92),rgb(7_10_18/0.5)_45%,transparent_75%)] md:[background:linear-gradient(90deg,rgb(7_10_18/0.9)_0%,rgb(7_10_18/0.6)_38%,transparent_62%)]" />
          <div className="stack max-w-[460px]">
            <h2 className="t-title wipe"><Words text={originals.heading} /></h2>
            <p className="rise t-lead" style={{ ["--d" as string]: "250ms" }}>{originals.line}</p>
            <div className="rise mt-10 w-full" style={{ ["--d" as string]: "380ms" }}><LaunchTrack /></div>
            <div className="rise mt-8 w-full" style={{ ["--d" as string]: "480ms" }}><WaitlistForm source="film" /></div>
          </div>
        </section>

        <section data-scene="close" aria-label={close.heading} className="scene-text reveal absolute inset-0 isolate flex flex-col items-center justify-center px-[var(--gutter)]" style={sceneStyle}>
          <div aria-hidden className="absolute inset-0 -z-10 [background:radial-gradient(70%_60%_at_50%_50%,rgb(7_10_18/0.82),rgb(7_10_18/0.35)_72%,rgb(7_10_18/0.1)_100%)]" />
          <div className="stack center">
            <h2 className="t-display wipe"><Words text={close.heading} /></h2>
            <p className="rise t-lead max-w-[34ch]" style={{ ["--d" as string]: "250ms" }}>{close.line}</p>
            <div className="rise actions" style={{ ["--d" as string]: "380ms" }}>
              <BookCall>{close.cta}</BookCall>
              <a href={`mailto:${studio.email}`} className="more">{close.email}</a>
            </div>
          </div>
        </section>

        {/* ---------------- Look closer: a marker on the object, and the panel it opens ---------------- */}
        <div className="film-frame pointer-events-none absolute inset-x-0 top-0 z-20">
          <button ref={spotRef} type="button" onClick={() => peekRef.current(true)} aria-label="Look closer" className="spot pointer-events-auto absolute left-0 top-0 -ml-6 -mt-6 flex h-12 items-center gap-3 pl-6 pr-3">
            <span aria-hidden className="spot-dot relative -ml-[5px] block h-2.5 w-2.5 rounded-full bg-paper" />
            <span className="spot-label text-[13px] text-paper">{services.web.more.spot}</span>
          </button>
        </div>
        <AnimatePresence>
          {panel && (
            <motion.aside
              key={panel}
              data-panel
              role="dialog"
              aria-label={pd!.title}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30, transition: { duration: 0.3 } }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.25 }}
              className="panel absolute z-40 flex flex-col bg-ink-2 max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[72%] max-md:rounded-t-[22px] max-md:border-t max-md:border-paper/10 md:inset-y-0 md:right-0 md:w-[min(460px,40vw)] md:border-l md:border-paper/10"
            >
              <div className="flex items-center justify-between px-7 pb-2 pt-6 md:px-10 md:pt-24">
                <p className="t-label">{pd!.title}</p>
                <button type="button" onClick={() => peekRef.current(false)} className="-mr-2 px-2 py-2 text-[13px] text-paper/70 underline decoration-paper/25 underline-offset-4 hover:text-paper">Close</button>
              </div>
              <div className="overflow-y-auto px-7 pb-[max(28px,env(safe-area-inset-bottom))] md:px-10">
                {pd!.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset(pd!.image)} alt="" className="mb-8 mt-4 aspect-[4/3] w-full object-cover" />
                )}
                <p className="t-head mt-4">{pd!.line}</p>
                <ul className="mt-8 border-t border-paper/12">
                  {pd!.items.map((it, i) => (
                    <motion.li key={it} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.45 + i * 0.07 }} className="t-body border-b border-paper/12 py-4 !text-paper/85">
                      {it}
                    </motion.li>
                  ))}
                </ul>
                <div className="actions mt-8">
                  <BookCall>{services.cta}</BookCall>
                  <a href={href(pd!.href)} className="more">{pd!.link}</a>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ---------------- Quiet controls ---------------- */}
        <div className={`pointer-events-none absolute inset-x-[var(--gutter)] bottom-6 z-10 flex items-center justify-between transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
          <div className="pointer-events-auto flex items-center gap-3">
            {SCENES.map((s, i) => (
              <button key={s.key} type="button" aria-label={`Go to ${s.key}`} onClick={() => cutRef.current(i)} className="group flex h-6 items-center">
                <span className={`block h-px transition-all duration-700 [transition-timing-function:var(--ease-out)] ${i === scene ? "w-8 bg-paper" : "w-3 bg-white/30 group-hover:bg-white/60"}`} />
              </button>
            ))}
          </div>
          <button type="button" data-sound-toggle onClick={toggleSound} aria-pressed={audible} className="link pointer-events-auto flex h-8 items-center gap-2.5 text-[13px] text-paper/70">
            <span aria-hidden className="flex h-2.5 items-end gap-[2px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-px bg-current" style={{ height: audible ? undefined : "3px", animation: audible ? `eq 1.${i + 2}s ease-in-out ${i * 0.15}s infinite alternate` : "none" }} />
              ))}
            </span>
            {audible ? "Sound on" : soundPref ? "Turn sound on" : "Sound off"}
          </button>
        </div>

        {/* ---------------- Loader: the city surfaces, then lets you straight in ---------------- */}
        {/* when ready it opens from the middle, like blinds parting on the city */}
        <div aria-hidden={ready} className={`fixed inset-0 z-[60] overflow-hidden bg-ink transition-[clip-path,visibility] duration-[1500ms] [transition-timing-function:cubic-bezier(0.77,0,0.175,1)] ${ready ? "invisible" : ""}`} style={{ clipPath: ready ? "inset(50% 0 50% 0)" : "inset(0 0 0 0)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/film/stills/s1n-m.webp")}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[60%_55%] transition-[opacity,filter,transform] duration-[1400ms] [transition-timing-function:var(--ease-film)]"
            style={{ opacity: 0.1 + progress * 0.4, filter: `blur(${16 - progress * 12}px)`, transform: `scale(${1.12 - progress * 0.08})` }}
          />
          <div className="absolute inset-0 [background:radial-gradient(80%_70%_at_50%_50%,rgb(7_10_18/0.2),rgb(7_10_18/0.92))]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/brand/logo.svg")} alt="" width={64} height={25} className="h-auto w-[64px] opacity-85" />
            <div className="mt-9 h-px w-[96px] overflow-hidden bg-white/15">
              <div className="h-full origin-left bg-paper/80 transition-transform duration-500" style={{ transform: `scaleX(${progress})` }} />
            </div>
          </div>
          <div className="absolute inset-x-[var(--gutter)] bottom-6 flex justify-end t-small text-paper/40">
            <span className="tabular-nums">{String(Math.round(progress * 100)).padStart(3, "0")}</span>
          </div>
        </div>

        <div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-white/[0.06] transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
          <div ref={lineRef} className="h-full origin-left bg-gradient-to-r from-paper/10 via-paper/50 to-signal shadow-[0_0_8px_rgb(232_161_90/0.5)]" style={{ transform: "scaleX(0)" }} />
        </div>
        <div ref={curtainRef} aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-ink" style={{ opacity: 0 }} />
      </div>
      <style>{`
        @keyframes eq { from { height: 3px; } to { height: 10px; } }
        .steps-bar { transform: scaleX(0); transition: transform 1500ms cubic-bezier(0.22,0.61,0.36,1) 100ms; }
        .on .steps-bar { transform: scaleX(1); }
      `}</style>
    </div>
  );
}
