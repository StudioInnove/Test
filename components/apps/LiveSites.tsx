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

/* ---------- Kiln & Co.: a ceramics shop ---------- */
function Shop() {
  const items = [
    ["prod1", "Ember vase", "£48"],
    ["prod2", "Morning bowl", "£36"],
    ["prod3", "Tide cup", "£22"],
    ["prod4", "Moon jar", "£64"],
  ];
  return (
    <div data-page="shop" className="absolute inset-0 overflow-hidden" style={{ background: "#f4eee6", color: "#1d1b18", opacity: 0 }}>
      <Chrome />
      <div data-scroll className="absolute inset-x-0 will-change-transform" style={{ top: BAR }}>
        <div className="flex h-[26px] items-center justify-center bg-[#1d1b18] text-[11.5px] tracking-[0.02em] text-[#efe7dc]">Free delivery on orders over £60</div>
        <div className="relative flex h-[62px] items-center justify-between px-12 text-[13px] text-[#5f5952]">
          <span className="flex gap-[26px]"><span>Shop</span><span>Collections</span><span>Journal</span></span>
          <span className="absolute left-1/2 -translate-x-1/2 text-[27px] text-[#1d1b18]" style={serif}>Kiln &amp; Co.</span>
          <span className="flex items-center gap-[26px]"><span>Search</span><span className="flex items-center gap-1.5">Bag <span data-bag className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#1d1b18] px-1.5 text-[11px] font-[600] text-white">2</span></span></span>
        </div>
        <div className="relative flex" style={{ height: 600 }}>
          <div className="relative w-[640px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img data-kb src={img("ceramics")} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "57% 50%" }} />
          </div>
          <div className="flex-1 px-12 pt-14">
            <p data-fade className="text-[11.5px] uppercase tracking-[0.05em] text-[#8a7f72]">Autumn collection</p>
            <h1 className="mt-3 text-[64px] font-[500] leading-[0.98] tracking-[-0.05em]">
              <Mask>Glazed slowly,</Mask>
              <Mask><em style={serif}>fired</em> by hand.</Mask>
            </h1>
            <p data-fade className="mt-6 max-w-[380px] text-[15px] leading-[1.5] text-[#5f5952]">Small batches from our studio in Devon. Each piece a little different.</p>
            <div data-fade className="mt-8 flex gap-3">
              <span data-cta className="inline-flex h-[46px] items-center rounded-full bg-[#1d1b18] px-6 text-[13.5px] font-[500] text-white">Shop the collection</span>
              <span className="inline-flex h-[46px] items-center rounded-full px-6 text-[13.5px] font-[500]" style={{ boxShadow: "inset 0 0 0 1px rgba(29,27,24,.18)" }}>Lookbook</span>
            </div>
          </div>
        </div>
        <div className="px-12 pt-[72px]">
          <div className="flex items-end justify-between">
            <p className="text-[44px] font-[500] leading-none tracking-[-0.045em]">New <em style={serif}>in</em></p>
            <p className="text-[13px] text-[#5f5952]">View all →</p>
          </div>
          <div className="mt-8 grid grid-cols-4 gap-5">
            {items.map(([i, n, p], k) => (
              <div key={n} data-card={k}>
                <div className="relative overflow-hidden rounded-[14px] bg-[#e9e1d6]" style={{ height: 300 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img data-zoom src={img(i)} alt="" className="h-full w-full object-cover will-change-transform" />
                  <span data-add className="absolute inset-x-3 bottom-3 flex h-[40px] items-center justify-center rounded-full bg-[#1d1b18] text-[13px] font-[500] text-white" style={{ opacity: 0, transform: "translateY(12px)" }}>Add to bag</span>
                </div>
                <div className="mt-3 flex justify-between text-[14px]"><span>{n}</span><span className="text-[#6b655d]">{p}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div data-toast className="absolute right-6 top-[96px] z-10 flex items-center gap-3 rounded-[14px] bg-[#1d1b18] px-4 py-3 text-[13px] text-white shadow-[0_14px_40px_rgba(0,0,0,.25)]" style={{ opacity: 0, transform: "translateY(-10px)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img("prod4")} alt="" className="h-9 w-9 rounded-[8px] object-cover" />
        <span>Moon jar · added to your bag</span>
      </div>
    </div>
  );
}

/* ---------- Lumen: a landing page for a booking tool ---------- */
function Landing() {
  const rows = [["#f3b38e", "Portrait session", "10:00"], ["#c9c4ee", "Studio hire, Nord", "13:30"], ["#e8a6b4", "Client review", "16:00"]];
  const feats = [["1,240", "bookings a month, on average"], ["4.9", "rating from 600 studios"], ["2 min", "to set up your first page"]];
  return (
    <div data-page="landing" className="absolute inset-0 overflow-hidden" style={{ background: "#f6f1ea", color: "#1b1916", opacity: 0 }}>
      <Chrome />
      <div data-scroll className="absolute inset-x-0 will-change-transform" style={{ top: BAR }}>
        <div className="flex h-[70px] items-center justify-between px-12 text-[13.5px] text-[#6b655d]">
          <span className="flex items-center gap-2 text-[19px] font-[600] tracking-[-0.035em] text-[#1b1916]"><i className="block h-4 w-4 rounded-full" style={{ background: "conic-gradient(#e9935a,#e8a6b4,#b6b3e6,#e9935a)" }} />Lumen</span>
          <span className="flex gap-[30px]"><span>Product</span><span>Pricing</span><span>Stories</span></span>
          <span className="flex items-center gap-5"><span>Sign in</span><span className="inline-flex h-[38px] items-center rounded-full bg-[#1b1916] px-5 font-[500] text-white">Start free</span></span>
        </div>
        <div className="text-center">
          <p data-fade className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12.5px] text-[#6b655d] shadow-[0_0_0_1px_rgba(0,0,0,.06)]"><i className="block h-1.5 w-1.5 rounded-full bg-[#e9935a]" />New · Lumen 2.0</p>
          <h1 className="mx-auto mt-5 w-[820px] text-[80px] font-[500] leading-[0.98] tracking-[-0.055em]">
            <Mask>The calm way to</Mask>
            <Mask>run your <em style={serif}>studio.</em></Mask>
          </h1>
          <p data-fade className="mt-5 text-[17px] text-[#6b655d]">Bookings, clients and payments in one quiet place.</p>
        </div>
        <div className="relative mx-12 mt-10 overflow-hidden rounded-[24px]" style={{ height: 420 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img data-kb src={img("studio")} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "50% 38%" }} />
          <div data-card="cal" className="absolute left-12 top-10 w-[300px] rounded-[18px] bg-white/95 p-[18px] shadow-[0_30px_60px_-24px_rgba(60,30,10,.45)]">
            <p className="mb-3.5 text-[12px] text-[#8a847b]">Today · Thursday</p>
            {rows.map(([c, n, t]) => (
              <div key={n} data-cal className="mb-2.5 flex items-center gap-[11px] text-[12.5px]"><b className="block h-[26px] w-[26px] rounded-[8px]" style={{ background: c }} /><span>{n}</span><small className="ml-auto text-[11.5px] text-[#8a847b]">{t}</small></div>
            ))}
          </div>
          <div data-paid className="absolute right-12 top-[150px] flex items-center gap-3 rounded-[14px] px-4 py-3 text-[12.5px] text-white" style={{ background: "rgba(27,25,22,.88)", backdropFilter: "blur(8px)", opacity: 0 }}>
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#7fbf8e] text-[12px]">✓</span>Paid · £240 · Nord
          </div>
        </div>
        <div className="mx-12 mt-16 grid grid-cols-3 gap-6 pb-24">
          {feats.map(([n, l]) => (
            <div key={l} data-feat className="rounded-[20px] bg-white p-7 shadow-[0_0_0_1px_rgba(0,0,0,.05)]">
              <p className="text-[48px] font-[500] leading-none tracking-[-0.05em]">{n}</p>
              <p className="mt-3 text-[14px] text-[#6b655d]">{l}</p>
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
      move(812, 470, 12.4, 1.4);
      click(14);
      tl.to(one("shop", "[data-scroll]"), { y: -662, duration: 1.7 }, 14.3);
      tl.from(q("shop", "[data-card]"), { y: 36, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08 }, 15);
      move(1010, 330, 15.8, 1.2);
      tl.to(q("shop", "[data-card='3'] [data-zoom]"), { scale: 1.06, duration: 1, ease: "power2.out" }, 16.8);
      tl.to(q("shop", "[data-card='3'] [data-add]"), { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 16.9);
      move(1010, 365, 17.5, 0.4);
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
      move(600, 560, 24.4, 1.4);
      tl.to(one("landing", "[data-scroll]"), { y: -560, duration: 1.8 }, 26);
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
