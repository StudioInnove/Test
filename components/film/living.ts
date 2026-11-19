/*
 * Living light: drawn over a room's still, never instead of it, so the photo stays perfectly sharp.
 *   - the city lights in the windows glitter now and then, like the lights in the footer
 *   - lamps breathe very slowly
 *   - a few specks of dust drift in the lamp light
 * Everything is additive light on a transparent canvas, kept subtle.
 */
import lightsData from "./lights.json";
import { GLOWS, type StillId } from "./timeline";

type Light = { u: number; v: number; r: number; c: [number, number, number]; level: number; target: number; base: number };
type Mote = { u: number; v: number; vu: number; vv: number; a: number; ph: number };

const LIGHTS = lightsData as Record<string, { lights: number[][] }>;

/** A soft round sprite, tinted later by drawing it with a colour filter. */
function sprite(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.18, "rgba(255,255,255,0.7)");
  grd.addColorStop(0.45, "rgba(255,255,255,0.18)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

export class LivingLight {
  private ctx: CanvasRenderingContext2D;
  private still: StillId | null = null;
  private lights: Light[] = [];
  private motes: Mote[] = [];
  private tints = new Map<string, HTMLCanvasElement>();
  private base: HTMLCanvasElement;
  private w = 1;
  private h = 1;
  private dpr = 1;
  /** 0..1, how present the living light is (fades in after arriving, out when moving) */
  amount = 0;

  constructor(private canvas: HTMLCanvasElement, private touch: boolean) {
    this.ctx = canvas.getContext("2d")!;
    this.base = sprite(64);
  }

  resize(w: number, h: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, this.touch ? 1.5 : 2);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
  }

  private tinted(r: number, g: number, b: number) {
    // a few colour buckets are enough
    const k = `${r >> 4},${g >> 4},${b >> 4}`;
    let c = this.tints.get(k);
    if (!c) {
      c = document.createElement("canvas");
      c.width = c.height = 64;
      const x = c.getContext("2d")!;
      x.drawImage(this.base, 0, 0);
      x.globalCompositeOperation = "source-in";
      x.fillStyle = `rgb(${(r >> 4) * 16 + 8},${(g >> 4) * 16 + 8},${(b >> 4) * 16 + 8})`;
      x.fillRect(0, 0, 64, 64);
      this.tints.set(k, c);
    }
    return c;
  }

  setStill(still: StillId | null) {
    if (still === this.still) return;
    this.still = still;
    const pts = still ? LIGHTS[still]?.lights ?? [] : [];
    // phones get fewer lights: less to draw, same feeling
    const keep = this.touch ? pts.filter((_, i) => i % 2 === 0) : pts;
    this.lights = keep.map(([u, v, r, R, G, B]) => ({ u, v, r, c: [R, G, B], level: 0, target: 0, base: 0 }));
    const glows = still ? GLOWS[still] ?? [] : [];
    this.motes = [];
    if (glows.length && !this.touch) {
      const [gu, gv, gr] = glows[0];
      for (let i = 0; i < 14; i++) {
        this.motes.push({ u: gu + (Math.random() - 0.5) * gr * 1.2, v: gv + Math.random() * gr * 1.4, vu: (Math.random() - 0.5) * 0.0018, vv: (Math.random() - 0.3) * 0.0012, a: 0.25 + Math.random() * 0.5, ph: Math.random() * 6.28 });
      }
    }
  }

  /**
   * Draw one frame. `map` turns a point on the full still into screen pixels; `scale` is how many
   * screen pixels one still-width is (it grows when the camera steps closer).
   */
  draw(t: number, map: (u: number, v: number) => [number, number], scale: number, reduce: boolean) {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    if (!this.still || this.amount <= 0.001) return;
    const A = this.amount;
    c.globalCompositeOperation = "lighter";

    // lamps breathing
    for (const [u, v, r, s] of GLOWS[this.still] ?? []) {
      const [x, y] = map(u, v);
      const breath = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.55 + u * 9);
      const rad = r * scale;
      const g = c.createRadialGradient(x, y, 0, x, y, rad);
      const a = s * (0.55 + 0.45 * breath) * A;
      g.addColorStop(0, `rgba(255,190,120,${a})`);
      g.addColorStop(0.5, `rgba(255,160,90,${a * 0.35})`);
      g.addColorStop(1, "rgba(255,150,80,0)");
      c.fillStyle = g;
      c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }

    // window lights: a few sparkle up and settle, as in the footer
    if (!reduce) {
      for (let k = 0; k < 2; k++) {
        const L = this.lights[(Math.random() * this.lights.length) | 0];
        if (L && L.target === L.base) L.target = 0.55 + Math.random() * 0.45;
      }
    }
    for (const L of this.lights) {
      L.level += (L.target - L.level) * (L.target > L.level ? 0.12 : 0.035);
      if (Math.abs(L.target - L.level) < 0.02 && L.target !== L.base) L.target = L.base;
      if (L.level < 0.02) continue;
      const [x, y] = map(L.u, L.v);
      if (x < -40 || y < -40 || x > this.w + 40 || y > this.h + 40) continue;
      const rad = Math.max(3, L.r * scale * 3.2);
      c.globalAlpha = Math.min(1, L.level * 0.9 * A);
      const [R, G, B] = L.c;
      c.drawImage(this.tinted(Math.min(255, R + 30), Math.min(255, G + 20), B), x - rad, y - rad, rad * 2, rad * 2);
    }
    c.globalAlpha = 1;

    // dust in the lamp light
    for (const m of this.motes) {
      // each speck floats in a slow loop around where it started
      const k = reduce ? 0 : t;
      const [x, y] = map(m.u + Math.sin(k * 0.13 + m.ph) * m.vu * 9, m.v + Math.sin(k * 0.09 + m.ph * 1.7) * m.vv * 12 - ((k * 0.002 + m.ph) % 0.03));
      const tw = 0.5 + 0.5 * Math.sin(t * 1.3 + m.ph);
      c.fillStyle = `rgba(255,225,190,${m.a * tw * 0.5 * A})`;
      c.beginPath();
      c.arc(x, y, 1.1, 0, 6.283);
      c.fill();
    }
    c.globalCompositeOperation = "source-over";
  }
}
