"use client";

/*
 * The websites room's display: three of the studio's sites, live, in a quiet browser window. Someone is
 * browsing: each site arrives (its headline rising out of a mask), the page scrolls on to show more, the
 * pointer lingers on a project, adds a vase to the bag, watches a booking come in; then the next site opens.
 * One GSAP timeline, looping; it rests when the screen is out of view.
 */
import { useEffect, useRef } from "react";
import { asset } from "@/lib/content";
import { getGsap } from "@/lib/gsap";

const W = 1200, H = 720, BAR = 32;
const img = (n: string) => asset(`/sites/img/${n}.webp`);
const serif = { fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 } as const;

function Chrome({ dark }: { dark?: boolean }) {
  const fg = dark ? "255,255,255" : "0,0,0";
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center" style={{ height: BAR, background: dark ? "#1c1e26" : "#ece8e2", borderBottom: `1px solid ${dark ? "#000" : "#d6d1ca"}` }}>
      <div className="ml-[13px] flex gap-[8px]">
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => <i key={c} className="block h-[10px] w-[10px] rounded-full" style={{ background: c }} />)}
      </div>
      <div className="absolute left-1/2 top-1/2 flex h-[21px] w-[352px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 rounded-[7px]" style={{ background: `rgba(${fg},0.08)` }}>
        <i className="block h-[7px] w-[8px] rounded-[2px]" style={{ background: `rgba(${fg},0.45)` }} />
        <i className="block h-[4px] w-[72px] rounded-full" style={{ background: `rgba(${fg},0.3)` }} />
      </div>
    </div>
  );
}

function Mask({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`block overflow-hidden pb-[0.06em] ${className}`}>
      <span data-rise className="block will-change-transform">{children}</span>
    </span>
  );
}

/* ---------- Atelier Nord: an architecture studio ---------- */
function Brand() {
  const work = [
    ["int1", "Kestrel House", "Oslo, 2024"],
    ["int2", "Harbour Studio", "Bergen, 2023"],
    ["int3", "The Reading Room", "Lund, 2022"],
  ];
  const words = "We draw homes, studios and quiet public rooms around the light they get.".split(" ");
  return (
    <div data-page="brand" className="absolute inset-0 overflow-hidden" style={{ background: "#12141c", color: "#f6f1ea" }}>
      <Chrome dark />
      <div data-scroll className="absolute inset-x-0 will-change-transform" style={{ top: BAR }}>
        {/* the hero */}
        <div className="relative overflow-hidden" style={{ height: H - BAR }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img data-kb src={img("house")} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "68% 55%" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(12,14,24,.62),rgba(12,14,24,.1) 58%,transparent),linear-gradient(0deg,rgba(12,14,24,.6),transparent 45%),linear-gradient(180deg,rgba(12,14,24,.4),transparent 24%)" }} />
          <div className="absolute left-12 right-12 top-6 flex items-center justify-between text-[13.5px]">
            <span className="text-[18px] font-[500] tracking-[-0.02em]">Atelier Nord</span>
            <span className="flex gap-[30px] text-white/85"><span>Work<sup className="ml-0.5 text-[9px] opacity-60">12</sup></span><span>Studio</span><span>Journal</span><span>Contact</span></span>
          </div>
          <p data-fade className="absolute left-12 top-[364px] text-[12px] uppercase tracking-[0.04em] text-white/70">Architecture · Since 2009</p>
          <h1 className="absolute left-[44px] top-[392px] w-[760px] text-[94px] font-[400] leading-[0.94] tracking-[-0.055em]">
            <Mask>Buildings that <em style={serif}>hold</em></Mask>
            <Mask>the light.</Mask>
          </h1>
          <div data-fade className="absolute right-12 top-[524px] flex w-[316px] gap-[14px] rounded-[16px] p-[14px]" style={{ background: "rgba(20,22,32,.42)", backdropFilter: "blur(14px)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img("int1")} alt="" className="h-[88px] w-[118px] rounded-[10px] object-cover" />
            <div className="flex flex-col justify-center gap-1">
              <span className="text-[10.5px] uppercase tracking-[0.04em] text-white/70">Latest project</span>
              <span className="text-[16px]">Kestrel House</span>
              <span className="text-[13px] text-white/60">Oslo, 2024 · View →</span>
            </div>
          </div>
        </div>
        {/* selected work */}
        <div className="px-12 pt-[72px]">
          <div className="flex items-end justify-between">
            <p className="text-[52px] leading-none tracking-[-0.04em]">Selected <em style={serif}>work</em></p>
            <p className="pb-1 text-[13px] text-white/55">12 projects · 2009–2024</p>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {work.map(([i, n, w], k) => (
              <div key={n} data-card={k} className="group">
                <div className="overflow-hidden rounded-[14px]" style={{ height: 270 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img data-zoom src={img(i)} alt="" className="h-full w-full object-cover will-change-transform" />
                </div>
                <div className="mt-4 flex items-center justify-between text-[15px]">
                  <span>{n}</span>
                  <span className="text-white/50">{w} <span data-arrow className="inline-block">→</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* what they do */}
        <div className="px-12 pb-24 pt-[120px]">
          <p className="max-w-[980px] text-[50px] leading-[1.06] tracking-[-0.04em]">
            {words.map((w, i) => <span key={i} data-word className="inline-block" style={{ color: "rgba(246,241,234,.22)", marginRight: "0.24em" }}>{w}</span>)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Kiln & Co.: a ceramics shop. One grotesk, white pills, the photograph does the work ---------- */
function Pills({ items, dark = "#151412" }: { items: string[]; dark?: string }) {
  return (
    <span className="flex gap-[2px] rounded-full bg-white p-1 text-[13px] shadow-[0_0_0_1px_rgba(0,0,0,.05)]">
      {items.map((t, i) => <span key={t} className="rounded-full px-[14px] py-[7px]" style={i === 0 ? { background: dark, color: "#fff" } : { color: "#5f5b55" }}>{t}</span>)}
    </span>
  );
}

function Shop() {
  const items = [
    ["prod1", "Ember vase", "£48"],
    ["prod2", "Morning bowl", "£36"],
    ["prod3", "Tide cup", "£22"],
    ["prod4", "Moon jar", "£64"],
  ];
  return (
    <div data-page="shop" className="absolute inset-0 overflow-hidden" style={{ background: "#f2efe9", color: "#151412", opacity: 0, letterSpacing: "-0.01em" }}>
      <Chrome />
      <div data-scroll className="absolute inset-x-0 will-change-transform" style={{ top: BAR }}>
        <div className="relative flex h-[64px] items-center justify-between px-10">
          <span className="text-[20px] font-[600] tracking-[-0.045em]">Kiln&amp;Co.</span>
          <span className="absolute left-1/2 -translate-x-1/2"><Pills items={["Shop", "Collections", "Journal", "About"]} /></span>
          <span className="flex items-center gap-6 text-[13.5px] text-[#5f5b55]">Search<span className="inline-flex h-10 items-center gap-2 rounded-full bg-[#151412] px-5 text-[13px] font-[500] text-white">Bag <b data-bag className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[11px] text-[#151412]">2</b></span></span>
        </div>
        {/* the hero: one photograph, the words at its foot */}
        <div className="relative mx-6 overflow-hidden rounded-[22px]" style={{ height: 600 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img data-kb src={img("ceramics")} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "58% 50%" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(0deg,rgba(20,14,8,.55),rgba(20,14,8,.12) 45%,transparent 70%)" }} />
          <p data-fade className="absolute right-8 top-7 text-[12px] text-white/85">01 — 03</p>
          <div className="absolute bottom-8 left-10 text-white">
            <p data-fade className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[12.5px] text-[#151412]"><i className="block h-1.5 w-1.5 rounded-full bg-[#c8743f]" />Autumn collection · 24 pieces</p>
            <h1 className="mt-4 text-[66px] font-[500] leading-[0.98] tracking-[-0.05em]">
              <Mask>Glazed slowly,</Mask>
              <Mask>fired by hand.</Mask>
            </h1>
            <span data-fade data-cta className="mt-6 inline-flex h-11 items-center gap-3 rounded-full bg-white pl-5 pr-1.5 text-[14px] font-[500] text-[#151412]">Shop the collection <b className="flex h-8 w-8 items-center justify-center rounded-full bg-[#151412] text-white">→</b></span>
          </div>
          <div data-fade className="absolute bottom-8 right-8 flex items-center gap-3 rounded-[16px] bg-white/90 p-3 text-[13px] shadow-[0_20px_40px_-20px_rgba(0,0,0,.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img("prod4")} alt="" className="h-[72px] w-[72px] rounded-[10px] object-cover" />
            <span className="flex flex-col gap-1 pr-4"><span className="font-[500]">Moon jar</span><span className="text-[#77716a]">£64 · Add to bag</span></span>
          </div>
        </div>
        {/* new in */}
        <div className="px-10 pt-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[12px] text-[#77716a]">02 — New in</p>
              <p className="mt-2 text-[40px] font-[500] leading-none tracking-[-0.045em]">Pieces for slow mornings.</p>
            </div>
            <p className="text-[13px] text-[#5f5b55]">View all (24)</p>
          </div>
          <div className="mt-8 grid grid-cols-4 gap-5 pb-20">
            {items.map(([i, n, p], k) => (
              <div key={n} data-card={k}>
                <div className="relative overflow-hidden rounded-[16px] bg-[#e7e1d8]" style={{ height: 300 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img data-zoom src={img(i)} alt="" className="h-full w-full object-cover will-change-transform" />
                  <span data-add className="absolute inset-x-3 bottom-3 flex h-10 items-center justify-center rounded-full bg-[#151412] text-[13px] font-[500] text-white" style={{ opacity: 0, transform: "translateY(12px)" }}>Add to bag</span>
                </div>
                <div className="mt-3 flex justify-between text-[14px]"><span className="font-[500]">{n}</span><span className="text-[#77716a]">{p}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div data-toast className="absolute right-6 top-[100px] z-10 flex items-center gap-3 rounded-full bg-[#151412] py-2 pl-2 pr-5 text-[13px] text-white shadow-[0_14px_40px_rgba(0,0,0,.25)]" style={{ opacity: 0, transform: "translateY(-10px)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img("prod4")} alt="" className="h-8 w-8 rounded-full object-cover" />
        <span>Moon jar · added to your bag</span>
      </div>
    </div>
  );
}

/* ---------- Lumen: a landing page for a booking tool. Same grotesk, a split hero ---------- */
function Landing() {
  const rows = [["#f3b38e", "Portrait session", "10:00"], ["#c9c4ee", "Studio hire, Nord", "13:30"], ["#e8a6b4", "Client review", "16:00"]];
  const feats = [["01", "Bookings", "1,240", "a month, on average"], ["02", "Payments", "£48k", "taken last month"], ["03", "Clients", "4.9", "rating from 600 studios"]];
  return (
    <div data-page="landing" className="absolute inset-0 overflow-hidden" style={{ background: "#f5f3ee", color: "#121212", opacity: 0, letterSpacing: "-0.01em" }}>
      <Chrome />
      <div data-scroll className="absolute inset-x-0 will-change-transform" style={{ top: BAR }}>
        <div className="relative flex h-[64px] items-center justify-between px-10">
          <span className="flex items-center gap-2 text-[19px] font-[600] tracking-[-0.04em]"><i className="block h-4 w-4 rounded-full" style={{ background: "conic-gradient(#e9935a,#e8a6b4,#b6b3e6,#e9935a)" }} />Lumen</span>
          <span className="absolute left-1/2 -translate-x-1/2"><Pills items={["Product", "Pricing", "Stories", "Journal"]} dark="#121212" /></span>
          <span className="flex items-center gap-6 text-[13.5px] text-[#5c5a55]">Sign in<span className="inline-flex h-10 items-center rounded-full bg-[#121212] px-5 text-[14px] font-[500] text-white">Start free</span></span>
        </div>
        <div className="relative" style={{ height: 620 }}>
          <div className="absolute left-10 top-[86px] w-[600px]">
            <p data-fade className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12.5px] text-[#5c5a55] shadow-[0_0_0_1px_rgba(0,0,0,.06)]"><i className="block h-1.5 w-1.5 rounded-full bg-[#e9935a]" />New · Lumen 2.0</p>
            <h1 className="mt-5 text-[74px] font-[500] leading-[0.98] tracking-[-0.055em]">
              <Mask>The calm way to</Mask>
              <Mask>run your studio.</Mask>
            </h1>
            <p data-fade className="mt-6 w-[440px] text-[17px] leading-[1.45] text-[#6a6761]">Bookings, clients and payments in one quiet place. Set up in two minutes.</p>
            <div data-fade className="mt-8 flex gap-2.5">
              <span className="inline-flex h-[46px] items-center rounded-full bg-[#121212] px-6 text-[14px] font-[500] text-white">Start free</span>
              <span className="inline-flex h-[46px] items-center rounded-full bg-white px-6 text-[14px] font-[500] shadow-[0_0_0_1px_rgba(0,0,0,.08)]">See how it works</span>
            </div>
          </div>
          <p data-fade className="absolute bottom-6 left-10 text-[12px] text-[#8a867f]">600 studios · 4.9 average rating</p>
          <div className="absolute right-10 top-[20px] overflow-hidden rounded-[22px]" style={{ width: 496, height: 596 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img data-kb src={img("studio")} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "46% 40%" }} />
            <div data-paid className="absolute bottom-8 right-6 flex items-center gap-3 rounded-[14px] px-4 py-3 text-[12.5px] text-white" style={{ background: "rgba(18,18,18,.9)", opacity: 0 }}>
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#7fbf8e] text-[12px]">✓</span>Paid · £240 · Nord
            </div>
          </div>
          <div data-card="cal" className="absolute left-[604px] top-[266px] w-[290px] rounded-[18px] bg-white/[0.97] p-[18px] shadow-[0_30px_60px_-24px_rgba(40,25,10,.4)]">
            <p className="mb-3.5 text-[12px] text-[#8a867f]">Today · Thursday</p>
            {rows.map(([c, n, t]) => (
              <div key={n} data-cal className="mb-2.5 flex items-center gap-[11px] text-[12.5px]"><b className="block h-[26px] w-[26px] rounded-[8px]" style={{ background: c }} /><span>{n}</span><small className="ml-auto text-[11.5px] text-[#8a867f]">{t}</small></div>
            ))}
          </div>
        </div>
        <div className="mx-10 mt-14 grid grid-cols-3 gap-5 pb-24">
          {feats.map(([i, k, n, l]) => (
            <div key={k} data-feat className="rounded-[20px] bg-white p-7 shadow-[0_0_0_1px_rgba(0,0,0,.05)]">
              <p className="flex justify-between text-[12px] text-[#8a867f]"><span>{k}</span><span>{i}</span></p>
              <p className="mt-10 text-[52px] font-[500] leading-none tracking-[-0.05em]">{n}</p>
              <p className="mt-3 text-[14px] text-[#6a6761]">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LiveSites() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current!;
    const { gsap } = getGsap();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const q = (page: string, sel: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-page="${page}"] ${sel}`));
    const one = (page: string, sel: string) => q(page, sel)[0];
    const cursor = root.querySelector<HTMLElement>("[data-cursor]")!;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power3.inOut" } });
      // how a site arrives: its headline rises out of its mask, the rest settles in, the photo eases back
      const arrive = (page: string, at: number, first = false) => {
        if (first) return;
        tl.fromTo(q(page, "[data-rise]"), { yPercent: 108 }, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.09 }, at + 0.15);
        tl.fromTo(q(page, "[data-fade]"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: "power2.out", stagger: 0.08 }, at + 0.45);
      };
      const open = (from: string, to: string, at: number) => {
        tl.set(one(to, "[data-scroll]"), { y: 0 }, at);
        tl.to(`[data-page="${to}"]`, { opacity: 1, duration: 0.7, ease: "power2.inOut" }, at);
        tl.set(`[data-page="${from}"]`, { opacity: 0 }, at + 0.7);
        tl.set(`[data-page="${to}"]`, { zIndex: 2 }, at);
        tl.set(`[data-page="${from}"]`, { zIndex: 1 }, at);
      };
      const move = (x: number, y: number, at: number, d = 1.4) => tl.to(cursor, { x, y, duration: d, ease: "power2.inOut" }, at);
      const click = (at: number) => tl.to(cursor, { scale: 0.82, duration: 0.09, yoyo: true, repeat: 1, ease: "power1.inOut" }, at);
      const kb = (page: string, at: number, dur: number) => tl.fromTo(one(page, "[data-kb]"), { scale: 1.08 }, { scale: 1, duration: dur, ease: "none" }, at);

      /* Atelier Nord: 0 – 11.5 */
      tl.set(`[data-page="brand"]`, { opacity: 1, zIndex: 2 }, 0);
      kb("brand", 0, 11);
      arrive("brand", 0, true);
      move(930, 300, 0.8, 1.6);
      tl.to(one("brand", "[data-scroll]"), { y: -(H - BAR) + 40, duration: 1.8 }, 2.4);
      tl.from(q("brand", "[data-card]"), { y: 40, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.12 }, 3.3);
      move(250, 380, 4.4, 1.2);
      tl.to(q("brand", "[data-card='0'] [data-zoom]"), { scale: 1.06, duration: 1.2, ease: "power2.out" }, 5.2);
      tl.to(q("brand", "[data-card='0'] [data-arrow]"), { x: 6, duration: 0.6, ease: "power2.out" }, 5.2);
      tl.to(one("brand", "[data-scroll]"), { y: -930, duration: 1.8 }, 6.6);
      tl.to(q("brand", "[data-card='0'] [data-zoom]"), { scale: 1, duration: 0.8 }, 6.6);
      tl.to(q("brand", "[data-word]"), { color: "rgba(246,241,234,1)", duration: 0.5, stagger: 0.07, ease: "none" }, 7.6);
      tl.set(q("brand", "[data-word]"), { color: "rgba(246,241,234,.22)" }, 11.6);
      tl.set(q("brand", "[data-card='0'] [data-arrow]"), { x: 0 }, 11.6);

      /* Kiln & Co.: 11 – 22 */
      open("brand", "shop", 10.8);
      kb("shop", 10.8, 10);
      arrive("shop", 10.8);
      move(170, 642, 12.4, 1.4);
      click(14);
      tl.to(one("shop", "[data-scroll]"), { y: -650, duration: 1.7 }, 14.3);
      tl.from(q("shop", "[data-card]"), { y: 36, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08 }, 15);
      move(1027, 330, 15.8, 1.2);
      tl.to(q("shop", "[data-card='3'] [data-zoom]"), { scale: 1.06, duration: 1, ease: "power2.out" }, 16.8);
      tl.to(q("shop", "[data-card='3'] [data-add]"), { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 16.9);
      move(1027, 478, 17.5, 0.4);
      click(18.1);
      tl.to(one("shop", "[data-bag]"), { scale: 1.35, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }, 18.3);
      tl.call(() => { const b = one("shop", "[data-bag]"); if (b) b.textContent = "3"; }, undefined, 18.35);
      tl.to(one("shop", "[data-toast]"), { opacity: 1, y: 0, duration: 0.5, ease: "back.out(2)" }, 18.3);
      tl.to(one("shop", "[data-toast]"), { opacity: 0, y: -10, duration: 0.4 }, 20.4);
      tl.set(q("shop", "[data-card='3'] [data-zoom]"), { scale: 1 }, 22.6);
      tl.set(q("shop", "[data-card='3'] [data-add]"), { opacity: 0, y: 12 }, 22.6);
      tl.call(() => { const b = one("shop", "[data-bag]"); if (b) b.textContent = "2"; }, undefined, 22.6);

      /* Lumen: 21.6 – 32.4 */
      open("shop", "landing", 21.6);
      kb("landing", 21.6, 10.5);
      arrive("landing", 21.6);
      tl.from(q("landing", "[data-cal]"), { x: -14, opacity: 0, duration: 0.8, ease: "expo.out", stagger: 0.14 }, 23);
      tl.to(one("landing", "[data-paid]"), { opacity: 1, duration: 0.01 }, 24);
      tl.fromTo(one("landing", "[data-paid]"), { y: 16, scale: 0.94 }, { y: 0, scale: 1, duration: 0.7, ease: "back.out(1.8)" }, 24);
      move(540, 520, 24.4, 1.4);
      tl.to(one("landing", "[data-scroll]"), { y: -600, duration: 1.8 }, 26);
      tl.from(q("landing", "[data-feat]"), { y: 30, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.1 }, 26.9);
      move(1090, 70, 28.8, 1.3);
      tl.to(one("landing", "[data-scroll]"), { y: 0, duration: 1.6 }, 29.2);
      click(30.4);
      tl.set(one("landing", "[data-paid]"), { opacity: 0 }, 32.5);

      /* back to the first */
      tl.set(one("brand", "[data-scroll]"), { y: 0 }, 32.3);
      tl.to(`[data-page="brand"]`, { opacity: 1, duration: 0.7, ease: "power2.inOut" }, 32.4);
      tl.set(`[data-page="brand"]`, { zIndex: 3 }, 32.4);
      tl.set(`[data-page="landing"]`, { opacity: 0 }, 33.1);
      tl.set(`[data-page="brand"]`, { zIndex: 2 }, 33.1);
      tl.set(cursor, { x: 520, y: 640 }, 33.1);

      // rest when nobody can see it
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()));
      io.observe(root);
      return () => io.disconnect();
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} aria-hidden className="relative overflow-hidden" style={{ width: W, height: H, background: "#12141c", fontFamily: "var(--font-sans)" }}>
      <Brand />
      <Shop />
      <Landing />
      <svg data-cursor width="22" height="30" viewBox="0 0 22 30" className="pointer-events-none absolute left-0 top-0 z-30 origin-top-left" style={{ transform: "translate(520px, 640px)", filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.35))" }}>
        <path d="M2 2 L2 23 L7.4 18.2 L11 26.4 L14.6 24.8 L11.1 16.8 L18.4 16.6 Z" fill="#111" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export const LIVE_SITES_SIZE = { w: W, h: H };
