"use client";

/*
 * One website, three looks. The same page dresses as an architecture studio, a ceramics shop or an app
 * launch. Pick a look and every piece travels to its new place, size and colour together (GSAP), while the
 * words soften for a moment and come back in their new typeface. On the monitor in the film it changes look
 * by itself every few seconds; to try it, it's yours.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { useLive } from "@/lib/useLive";
import { asset } from "@/lib/content";

const W = 1200, H = 720, BAR = 34;
export const SITE_LOOKS_SIZE = { w: W, h: H };

type Box = { x: number; y: number; w?: number; h?: number; r?: number; size?: number; bg?: string; color?: string; o?: number; ls?: number; lh?: number; weight?: number; border?: string };
type Look = {
  name: string;
  page: string; ink: string; serif: boolean;
  text: Record<"logo" | "kicker" | "h1" | "sub" | "cta" | "navCta", string>;
  links: string[];
  imgs: [string, string, string];
  cards: { t: string; s: string; img?: string }[];
  center: boolean;
  el: Record<string, Box>;
};

const LOOKS: Look[] = [
  {
    name: "Studio",
    page: "#151412", ink: "#efe9e0", serif: true, center: false,
    text: { logo: "Atelier Nord", kicker: "Architecture · Oslo", h1: "Buildings that hold the light.", sub: "Homes, studios and quiet public rooms, drawn around the way light moves through them.", cta: "See the work", navCta: "Contact" },
    links: ["Work", "Studio", "Journal"],
    imgs: ["house", "int1", "int3"],
    cards: [{ t: "Kestrel House", s: "Oslo, 2024" }, { t: "Harbour Studio", s: "Bergen, 2023" }, { t: "The Reading Room", s: "Lund, 2022" }],
    el: {
      logo: { x: 56, y: 30, size: 22 },
      links: { x: 700, y: 34, size: 14, o: 0.7 },
      navCta: { x: 1048, y: 24, w: 100, h: 38, r: 19, bg: "rgba(239,233,224,0)", color: "#efe9e0", border: "rgba(239,233,224,0.35)" },
      kicker: { x: 56, y: 212, w: 240, h: 24, size: 13, o: 0.6, ls: 0.12 },
      h1: { x: 56, y: 246, w: 470, size: 66, lh: 1.0, weight: 400 },
      sub: { x: 56, y: 420, w: 400, size: 16, o: 0.7, lh: 1.55 },
      cta: { x: 56, y: 506, w: 150, h: 48, r: 24, bg: "#efe9e0", color: "#151412" },
      imgA: { x: 600, y: 0, w: 600, h: 686, r: 0 },
      imgB: { x: 56, y: 590, w: 124, h: 72, r: 4 },
      imgC: { x: 192, y: 590, w: 124, h: 72, r: 4 },
      card0: { x: 56, y: 760, w: 340, h: 120, r: 12, o: 0, bg: "rgba(255,255,255,0.04)" },
      card1: { x: 410, y: 760, w: 340, h: 120, r: 12, o: 0, bg: "rgba(255,255,255,0.04)" },
      card2: { x: 764, y: 760, w: 340, h: 120, r: 12, o: 0, bg: "rgba(255,255,255,0.04)" },
    },
  },
  {
    name: "Shop",
    page: "#f3eee7", ink: "#151412", serif: false, center: false,
    text: { logo: "Kiln & Co.", kicker: "New this week", h1: "Pieces for slow mornings.", sub: "Hand-thrown stoneware, made in small batches.", cta: "Shop the collection", navCta: "Bag · 2" },
    links: ["Shop", "Makers", "Journal"],
    imgs: ["ceramics", "prod1", "prod2"],
    cards: [{ t: "Morning cup", s: "£28", img: "prod3" }, { t: "Pour-over set", s: "£64", img: "prod4" }, { t: "Serving bowl", s: "£52", img: "prod2" }],
    el: {
      logo: { x: 56, y: 32, size: 20, weight: 700 },
      links: { x: 470, y: 36, size: 14, o: 0.65 },
      navCta: { x: 1040, y: 24, w: 104, h: 40, r: 20, bg: "#151412", color: "#ffffff", border: "rgba(0,0,0,0)" },
      kicker: { x: 56, y: 106, w: 200, h: 24, size: 13, o: 0.55, ls: 0.02 },
      h1: { x: 56, y: 136, w: 500, size: 54, lh: 1.02, weight: 600, ls: -0.03 },
      sub: { x: 56, y: 270, w: 420, size: 16, o: 0.6, lh: 1.5 },
      cta: { x: 56, y: 330, w: 200, h: 48, r: 24, bg: "#151412", color: "#ffffff" },
      imgA: { x: 610, y: 100, w: 534, h: 290, r: 22 },
      imgB: { x: 980, y: 760, w: 80, h: 80, r: 12, o: 0 },
      imgC: { x: 1070, y: 760, w: 80, h: 80, r: 12, o: 0 },
      card0: { x: 56, y: 424, w: 352, h: 240, r: 18, o: 1, bg: "#ffffff" },
      card1: { x: 424, y: 424, w: 352, h: 240, r: 18, o: 1, bg: "#ffffff" },
      card2: { x: 792, y: 424, w: 352, h: 240, r: 18, o: 1, bg: "#ffffff" },
    },
  },
  {
    name: "Launch",
    page: "#fbfaf8", ink: "#1d1b18", serif: false, center: true,
    text: { logo: "Lumen", kicker: "Now in beta", h1: "Your evenings, finally planned.", sub: "Dinners, films and friends, planned around the time you actually have.", cta: "Join the beta", navCta: "Get early access" },
    links: ["Product", "Pricing", "Changelog"],
    imgs: ["int2", "int1", "int3"],
    cards: [{ t: "Plans itself", s: "Around your week" }, { t: "Shared", s: "With the people you choose" }, { t: "Private", s: "Nothing leaves your phone" }],
    el: {
      logo: { x: 56, y: 32, size: 20, weight: 600 },
      links: { x: 480, y: 36, size: 14, o: 0.6 },
      navCta: { x: 994, y: 24, w: 150, h: 40, r: 20, bg: "#e0835f", color: "#ffffff", border: "rgba(0,0,0,0)" },
      kicker: { x: 545, y: 112, w: 110, h: 30, size: 13, o: 0.75, bg: "rgba(224,131,95,0.12)", r: 15 },
      h1: { x: 220, y: 160, w: 760, size: 64, lh: 1.02, weight: 600, ls: -0.035 },
      sub: { x: 330, y: 312, w: 540, size: 17, o: 0.6, lh: 1.5 },
      cta: { x: 520, y: 382, w: 160, h: 50, r: 25, bg: "#1d1b18", color: "#ffffff" },
      imgA: { x: 200, y: 470, w: 800, h: 300, r: 22 },
      imgB: { x: 120, y: 540, w: 120, h: 150, r: 18, o: 0 },
      imgC: { x: 960, y: 540, w: 120, h: 150, r: 18, o: 0 },
      card0: { x: 56, y: 760, w: 340, h: 120, r: 12, o: 0, bg: "#ffffff" },
      card1: { x: 410, y: 760, w: 340, h: 120, r: 12, o: 0, bg: "#ffffff" },
      card2: { x: 764, y: 760, w: 340, h: 120, r: 12, o: 0, bg: "#ffffff" },
    },
  },
];

const KEYS = ["logo", "links", "navCta", "kicker", "h1", "sub", "cta", "imgA", "imgB", "imgC", "card0", "card1", "card2"];

function vars(b: Box, ink: string) {
  const v: Record<string, unknown> = { left: b.x, top: b.y, opacity: b.o ?? 1 };
  if (b.w !== undefined) v.width = b.w;
  if (b.h !== undefined) v.height = b.h;
  if (b.r !== undefined) v.borderRadius = b.r;
  if (b.size !== undefined) v.fontSize = b.size;
  if (b.lh !== undefined) v.lineHeight = b.lh;
  if (b.weight !== undefined) v.fontWeight = b.weight;
  if (b.ls !== undefined) v.letterSpacing = `${b.ls}em`;
  v.backgroundColor = b.bg ?? "rgba(0,0,0,0)";
  v.color = b.color ?? ink;
  if (b.border) v.boxShadow = `inset 0 0 0 1px ${b.border}`;
  return v;
}

export function SiteLooks({ interactive = false, look: controlled, accent = null }: { interactive?: boolean; look?: number; accent?: string | null }) {
  const [own, setLook] = useState(controlled ?? 0);
  void interactive;
  const look = controlled ?? own;
  const [text, setText] = useState(look); // the words change halfway through the move
  const root = useRef<HTMLDivElement>(null);
  const els = useRef<Record<string, HTMLElement | null>>({});
  const first = useRef(true);
  const seen = useLive(root);

  const apply = useCallback((i: number, dur: number, tint: string | null) => {
    const { gsap } = getGsap();
    const L = LOOKS[i];
    // your colour, on the buttons and the small label
    const v = (k: string) => {
      const out = vars(L.el[k], L.ink);
      if (tint && (k === "cta" || k === "navCta")) Object.assign(out, { backgroundColor: tint, color: "#ffffff", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0)" });
      if (tint && k === "kicker") Object.assign(out, { color: tint, opacity: 1 });
      return out;
    };
    const page = root.current!.querySelector<HTMLElement>("[data-page]");
    const words = KEYS.filter((k) => !k.startsWith("img")).map((k) => els.current[k]).filter(Boolean);
    if (!dur) {
      gsap.set(page, { backgroundColor: L.page, color: L.ink });
      KEYS.forEach((k) => gsap.set(els.current[k], v(k)));
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
    tl.to(words, { filter: "blur(8px)", duration: 0.32, ease: "power2.in" }, 0);
    tl.call(() => setText(i), [], 0.34);
    tl.to(page, { backgroundColor: L.page, color: L.ink, duration: dur }, 0);
    KEYS.forEach((k, n) => tl.to(els.current[k], { ...v(k), duration: dur }, n * 0.02));
    tl.to(words, { filter: "blur(0px)", duration: 0.5, ease: "power2.out", stagger: 0.03 }, 0.42);
  }, []);

  const lastLook = useRef(look);
  useLayoutEffect(() => {
    if (first.current) apply(look, 0, accent);
    else if (lastLook.current !== look) apply(look, 1.05, accent);
    else {
      // only the colour changed: it washes over the buttons
      const { gsap } = getGsap();
      ["cta", "navCta", "kicker"].forEach((k) => {
        const L = LOOKS[look], out = vars(L.el[k], L.ink);
        if (accent && k !== "kicker") Object.assign(out, { backgroundColor: accent, color: "#ffffff" });
        if (accent && k === "kicker") Object.assign(out, { color: accent, opacity: 1 });
        gsap.to(els.current[k], { backgroundColor: out.backgroundColor as string, color: out.color as string, opacity: out.opacity as number, duration: 0.6, ease: "power2.out" });
        if (k === "cta") gsap.fromTo(els.current[k], { scale: 0.92 }, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.45)" });
      });
    }
    first.current = false;
    lastLook.current = look;
  }, [look, accent, apply]);

  // in the film, it changes by itself
  useEffect(() => {
    if (interactive || controlled !== undefined) return;
    const id = window.setInterval(() => seen() && setLook((l) => (l + 1) % LOOKS.length), 4600);
    return () => clearInterval(id);
  }, [interactive, controlled]); // eslint-disable-line react-hooks/exhaustive-deps

  const T = LOOKS[text];
  const font = T.serif ? "var(--font-serif)" : "var(--font-sans)";
  const ref = (k: string) => (el: HTMLElement | null) => { els.current[k] = el; };

  return (
    <div ref={root} className="relative select-none overflow-hidden rounded-[0px] bg-[#e9e6e1]" style={{ width: W, height: H, fontFamily: "var(--font-sans)" }} aria-hidden={!interactive}>
      {/* the browser */}
      <div className="flex items-center gap-2 bg-[#e9e6e1] px-4" style={{ height: BAR }}>
        {["#ec6a5e", "#f4bf4f", "#61c554"].map((c) => <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />)}
        <span className="mx-auto flex h-[22px] w-[360px] items-center justify-center rounded-[6px] bg-white/80 text-[12px] text-black/50">{T.text.logo.toLowerCase().replace(/[^a-z]/g, "")}.com</span>
      </div>

      <div data-page className="relative overflow-hidden" style={{ height: H - BAR }}>
        <span ref={ref("logo")} className="absolute whitespace-nowrap" style={{ fontFamily: font, fontStyle: T.serif ? "italic" : "normal" }}>{T.text.logo}</span>
        <span ref={ref("links")} className="absolute flex gap-8 whitespace-nowrap">{T.links.map((l) => <span key={l}>{l}</span>)}</span>
        <span ref={ref("navCta")} className="absolute grid place-items-center whitespace-nowrap text-[14px] font-[500]">{T.text.navCta}</span>
        <span ref={ref("kicker")} className={`absolute grid items-center whitespace-nowrap ${T.serif ? "uppercase" : ""}`} style={{ justifyItems: T.center ? "center" : "start" }}>{T.text.kicker}</span>
        <h5 ref={ref("h1")} className="absolute" style={{ fontFamily: font, textAlign: T.center ? "center" : "left", textWrap: "balance" }}>{T.text.h1}</h5>
        <p ref={ref("sub")} className="absolute" style={{ textAlign: T.center ? "center" : "left" }}>{T.text.sub}</p>
        <span ref={ref("cta")} className="absolute grid place-items-center whitespace-nowrap text-[15px] font-[500]">{T.text.cta}</span>
        {(["imgA", "imgB", "imgC"] as const).map((k, i) => (
          <div key={k} ref={ref(k)} className="absolute overflow-hidden">
            {LOOKS.map((L, li) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={li} src={asset(`/sites/img/${L.imgs[i]}.webp`)} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700" style={{ opacity: li === text ? 1 : 0 }} />
            ))}
          </div>
        ))}
        {[0, 1, 2].map((n) => {
          const c = T.cards[n];
          return (
            <div key={n} ref={ref(`card${n}`)} className="absolute overflow-hidden">
              {c.img ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(`/sites/img/${c.img}.webp`)} alt="" draggable={false} className="h-[180px] w-full object-cover" />
                  <div className="flex items-center justify-between px-4 pt-3 text-[15px]"><span className="font-[500]">{c.t}</span><span className="opacity-60">{c.s}</span></div>
                </>
              ) : (
                <div className="p-5"><p className="text-[16px] font-[500]">{c.t}</p><p className="mt-1 text-[14px] opacity-60">{c.s}</p></div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}

/** the look picker that sits under the laptop when you can try it */
export const ACCENTS = [null, "#e0835f", "#3f6b5c", "#3d5a9e", "#b0413e"] as const;

export function LookPicker({ look, onLook, accent, onAccent }: { look: number; onLook: (i: number) => void; accent: string | null; onAccent: (c: string | null) => void }) {
  const pill = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const btn = box.current?.querySelector<HTMLElement>(`[data-look="${look}"]`);
    if (btn && pill.current) getGsap().gsap.to(pill.current, { x: btn.offsetLeft - 6, width: btn.offsetWidth, duration: 0.6, ease: "power3.inOut" });
  }, [look]);
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
    <div ref={box} role="group" aria-label="Pick a look" className="relative flex w-max items-center gap-1 rounded-full bg-paper/[0.07] p-1.5 text-[15px] shadow-[inset_0_0_0_1px_rgb(239_233_224/0.1)]">
      <span ref={pill} aria-hidden className="absolute left-1.5 top-1.5 h-10 rounded-full bg-paper" style={{ width: 90 }} />
      {LOOKS.map((L, i) => (
        <button key={L.name} type="button" data-look={i} aria-pressed={look === i} onClick={() => onLook(i)} className={`relative z-10 h-10 rounded-full px-6 transition-colors duration-500 ${look === i ? "text-[#0b0e16]" : "text-paper/70 hover:text-paper"}`}>
          {L.name}
        </button>
      ))}
    </div>
    <div role="group" aria-label="Pick a colour" className="flex items-center gap-2 rounded-full bg-paper/[0.07] p-2 shadow-[inset_0_0_0_1px_rgb(239_233_224/0.1)]">
      {ACCENTS.map((c) => (
        <button key={c ?? "none"} type="button" aria-label={c ? `Colour ${c}` : "Original colours"} aria-pressed={accent === c} onClick={() => onAccent(c)} className="grid h-8 w-8 place-items-center rounded-full transition-transform duration-300 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] hover:scale-110 active:scale-95" style={{ boxShadow: accent === c ? "0 0 0 2px #efe9e0" : "none" }}>
          <span className="block h-6 w-6 rounded-full" style={{ background: c ?? "conic-gradient(#efe9e0 0 50%, #151412 0 100%)" }} />
        </button>
      ))}
    </div>
    </div>
  );
}
