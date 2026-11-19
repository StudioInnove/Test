import { FOCUS, type ClipId, type StillId } from "./timeline";
import { asset } from "@/lib/content";

type FrameSet = { path: string; frames: number; w?: number; h?: number };
export type Manifest = {
  fps: number;
  /** frames per file: a file holds `sheet` frames stacked top to bottom */
  sheet?: number;
  /** phone frames are pre-cropped to this width/height and already centred on the subject */
  mAspect?: number;
  stills: Partial<Record<StillId, { d: string; m?: string; depth?: string }>>;
  clips: Partial<Record<ClipId, { from: StillId; to: StillId; fps?: number; d?: FrameSet; m?: FrameSet }>>;
};

export type Single =
  | { kind: "hold"; still: StillId; rest: number }
  | { kind: "clip"; clip: ClipId; from: StillId; to: StillId; t: number };
/** A crossfade between two single shots (each drawn from its nearest frame). */
export type Shot = Single | { kind: "mix"; a: Single; b: Single; mix: number };

type Bitmap = ImageBitmap | HTMLImageElement;

const VERT = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = vec2(aPos.x*0.5+0.5, 0.5-aPos.y*0.5); gl_Position = vec4(aPos,0.,1.); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uA, uB;
uniform float uMix, uZoomA, uZoomB;
uniform vec2 uScaleA, uScaleB, uCenterA, uCenterB;
vec2 cover(vec2 uv, vec2 s, vec2 c, float z){ return c + (uv-0.5)*s/z; }
void main(){
  vec3 a = texture(uA, clamp(cover(vUv, uScaleA, uCenterA, uZoomA), 0.0005, 0.9995)).rgb;
  vec3 b = texture(uB, clamp(cover(vUv, uScaleB, uCenterB, uZoomB), 0.0005, 0.9995)).rgb;
  o = vec4(mix(a, b, uMix), 1.0);
}`;

/** Loads and paints the film. Frames stay compressed in memory and are decoded on demand. */
export class FilmEngine {
  private gl: WebGL2RenderingContext | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private prog: WebGLProgram | null = null;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private texA: WebGLTexture | null = null;
  private texB: WebGLTexture | null = null;
  private texD: WebGLTexture | null = null;
  private texAKey = "";
  private texBKey = "";
  private texDKey = "";
  private stillTex = new Map<string, WebGLTexture>();
  private stills = new Map<string, Bitmap>();
  private depths = new Map<string, Bitmap>();
  private blobs = new Map<string, Blob>();
  private decoded = new Map<string, ImageBitmap>();
  private decoding = new Set<string>();
  private queue: string[] = [];
  private inflight = 0;
  private aborted = false;
  private size = { w: 1, h: 1 };
  mode: "d" | "m";
  ready = false;
  onProgress?: (p: number) => void;

  constructor(private canvas: HTMLCanvasElement, private manifest: Manifest, mode: "d" | "m") {
    this.mode = mode;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" });
    if (gl) {
      this.gl = gl;
      this.initGL();
    } else {
      this.ctx2d = canvas.getContext("2d");
    }
  }

  // ---------- GL setup ----------
  private initGL() {
    const gl = this.gl!;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(p);
    gl.useProgram(p);
    this.prog = p;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, "aPos");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (const n of ["uA", "uB", "uD", "uMix", "uZoomA", "uZoomB", "uRest", "uTime", "uHasDepth", "uDepthAmt", "uGrain", "uMotion", "uScaleA", "uScaleB", "uCenterA", "uCenterB", "uMouse", "uPointer", "uRes"]) {
      this.loc[n] = gl.getUniformLocation(p, n);
    }
    gl.uniform1i(this.loc.uA, 0);
    gl.uniform1i(this.loc.uB, 1);
    gl.uniform1i(this.loc.uD, 2);
    this.texA = this.makeTex();
    this.texB = this.makeTex();
    this.texD = this.makeTex();
  }

  private makeTex() {
    const gl = this.gl!;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 11, 13, 255]));
    return t;
  }

  private upload(tex: WebGLTexture, img: Bitmap) {
    const gl = this.gl!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  }

  resize(w: number, h: number, dpr: number) {
    const W = Math.max(1, Math.round(w * dpr));
    const H = Math.max(1, Math.round(h * dpr));
    if (this.canvas.width !== W || this.canvas.height !== H) {
      this.canvas.width = W;
      this.canvas.height = H;
    }
    this.size = { w: W, h: H };
    this.gl?.viewport(0, 0, W, H);
  }

  // ---------- Loading ----------
  private async fetchImage(url: string): Promise<Bitmap> {
    const res = await fetch(url);
    const blob = await res.blob();
    if ("createImageBitmap" in window) return createImageBitmap(blob);
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await img.decode();
    return img;
  }

  /** Stills (and depth maps) first: enough to show the whole film as crossfades. */
  async loadStills(first: StillId[]) {
    const ids = Object.keys(this.manifest.stills) as StillId[];
    const order = [...first, ...ids.filter((i) => !first.includes(i))];
    let done = 0;
    const total = order.length;
    const one = async (id: StillId) => {
      const s = this.manifest.stills[id];
      if (!s) return;
      try {
        this.stills.set(id, await this.fetchImage(asset(s[this.mode] ?? s.d)));
      } catch {}
      done++;
      this.onProgress?.(done / total);
    };
    await one(order[0]);
    await Promise.all(order.slice(1).map(one));
    this.ready = true;

  }

  hasStill(id: StillId) {
    return this.stills.has(id);
  }

  private clipSet(clip: ClipId) {
    const c = this.manifest.clips[clip];
    return c?.[this.mode] ?? c?.d ?? c?.m;
  }

  private get per() {
    return this.manifest.sheet ?? 1;
  }

  /** The file that holds frame i. */
  private sheetUrl(clip: ClipId, i: number) {
    const c = this.clipSet(clip);
    if (!c) return "";
    return asset(`${c.path}${String(Math.floor(i / this.per) + 1).padStart(3, "0")}.webp`);
  }

  /** A key for one frame: its file, and its place in that file. */
  private frameUrl(clip: ClipId, i: number) {
    return `${this.sheetUrl(clip, i)}#${i % this.per}`;
  }

  /** Where the subject sits: phone frames are already cropped around it. */
  private focusOf(s: StillId): [number, number] {
    return this.cropped ? [0.5, FOCUS[s][1]] : FOCUS[s];
  }

  private get cropped() {
    return this.mode === "m" && !!this.manifest.mAspect && !!this.manifest.clips.c1?.m;
  }

  /** Share of the given clips' frames already downloaded (0..1). */
  loadedRatio(clips: ClipId[]) {
    let have = 0, total = 0;
    for (const c of clips) {
      const n = this.frames(c);
      total += n;
      for (let i = 0; i < n; i++) if (this.blobs.has(this.sheetUrl(c, i))) have++;
    }
    return total ? have / total : 1;
  }

  frames(clip: ClipId) {
    return this.clipSet(clip)?.frames ?? 0;
  }

  /** Queue clip frames, nearest clips first, coarse-to-fine inside each clip. */
  prioritise(clips: ClipId[]) {
    const q: string[] = [];
    for (const c of clips) {
      const n = this.frames(c);
      if (!n) continue;
      const per = this.per;
      const steps = per > 1 ? [per * 2, per] : [8, 4, 2, 1];
      for (const step of steps) {
        for (let i = 0; i < n; i += step) {
          const u = this.sheetUrl(c, i);
          if (!this.blobs.has(u) && !q.includes(u)) q.push(u);
        }
      }
    }
    this.queue = q;
    this.pump();
  }

  private pump() {
    const max = this.mode === "m" ? 3 : 6;
    while (this.inflight < max && this.queue.length && !this.aborted) {
      const u = this.queue.shift()!;
      if (this.blobs.has(u)) continue;
      this.inflight++;
      fetch(u)
        .then((r) => (r.ok ? r.blob() : Promise.reject()))
        .then((b) => this.blobs.set(u, b))
        .catch(() => {})
        .finally(() => {
          this.inflight--;
          this.pump();
        });
    }
  }

  /** Decode the file that holds frame u, and cut it into its frames. */
  private requestDecode(u: string) {
    const sheet = u.split("#")[0];
    if (this.decoded.has(u) || this.decoding.has(sheet)) return;
    const b = this.blobs.get(sheet);
    if (!b) return;
    this.decoding.add(sheet);
    const keep = this.mode === "m" ? 16 : 28;
    createImageBitmap(b)
      .then(async (all) => {
        const per = this.per;
        // every frame has the same shape; the last file of a clip may hold fewer of them
        const set = this.clipSet("c1");
        const h = set?.w && set?.h ? Math.round((all.width * set.h) / set.w) : Math.round(all.height / per);
        const count = Math.max(1, Math.min(per, Math.round(all.height / h)));
        for (let j = 0; j < count; j++) {
          const key = `${sheet}#${j}`;
          if (this.decoded.has(key)) continue;
          const bm = per > 1 ? await createImageBitmap(all, 0, j * h, all.width, h) : all;
          this.decoded.set(key, bm);
        }
        if (per > 1) all.close();
        while (this.decoded.size > keep) {
          const k = this.decoded.keys().next().value as string;
          if (k === this.texAKey || k === this.texBKey) {
            // still on screen: move it to the back of the queue
            const v = this.decoded.get(k)!;
            this.decoded.delete(k);
            this.decoded.set(k, v);
            if (this.decoded.size <= keep + 2) break;
            continue;
          }
          this.decoded.get(k)?.close();
          this.decoded.delete(k);
        }
      })
      .catch(() => {})
      .finally(() => this.decoding.delete(sheet));
  }

  /** Best decoded frame near index i (searching outwards), or null. */
  private nearestFrame(clip: ClipId, i: number, n: number): { url: string; bm: ImageBitmap } | null {
    for (let r = 0; r < n; r++) {
      for (const j of r === 0 ? [i] : [i - r, i + r]) {
        if (j < 0 || j >= n) continue;
        const u = this.frameUrl(clip, j);
        const bm = this.decoded.get(u);
        if (bm) return { url: u, bm };
        if (r < 3) this.requestDecode(u);
      }
      if (r > 6) break;
    }
    return null;
  }

  /** One bitmap for a single shot: the nearest decoded frame, or the still. */
  private single(shot: Single): { bm: Bitmap; key: string; focus: [number, number] } | null {
    if (shot.kind === "hold") {
      const bm = this.stills.get(shot.still);
      return bm ? { bm, key: "still:" + shot.still, focus: this.focusOf(shot.still) } : null;
    }
    const n = this.frames(shot.clip);
    const fa = this.focusOf(shot.from), fb = this.focusOf(shot.to);
    const focus: [number, number] = [fa[0] + (fb[0] - fa[0]) * shot.t, fa[1] + (fb[1] - fa[1]) * shot.t];
    if (n > 1) {
      const f = this.nearestFrame(shot.clip, Math.round(shot.t * (n - 1)), n);
      if (f) return { bm: f.bm, key: f.url, focus };
    }
    const still = shot.t < 0.5 ? shot.from : shot.to;
    const bm = this.stills.get(still);
    return bm ? { bm, key: "still:" + still, focus: this.focusOf(still) } : null;
  }

  // ---------- Painting ----------
  private coverScale(img: Bitmap | undefined): [number, number] {
    const iw = img ? ("width" in img ? img.width : 16) : 16;
    const ih = img ? ("height" in img ? img.height : 9) : 9;
    const ca = this.size.w / this.size.h;
    const ia = iw / ih;
    return ca > ia ? [1, ia / ca] : [ca / ia, 1];
  }

  private center(scale: [number, number], f: [number, number]): [number, number] {
    const cx = Math.min(1 - scale[0] / 2, Math.max(scale[0] / 2, f[0]));
    const cy = Math.min(1 - scale[1] / 2, Math.max(scale[1] / 2, f[1]));
    return [cx, cy];
  }

  paint(shot: Shot, opts: { time: number; mouse: [number, number]; pointer: [number, number]; motion: number }) {
    let A: Bitmap | undefined, B: Bitmap | undefined;
    let aKey = "", bKey = "";
    let mix = 0, zoomA = 1, zoomB = 1, rest = 0;
    let focusA: [number, number] = [0.5, 0.5], focusB: [number, number] = [0.5, 0.5];
    let depthKey = "";

    if (shot.kind === "mix") {
      const a = this.single(shot.a), b = this.single(shot.b);
      if (!a && !b) return;
      const ra = a ?? b!, rb = b ?? a!;
      A = ra.bm; aKey = ra.key; B = rb.bm; bKey = rb.key;
      mix = Math.min(1, Math.max(0, shot.mix));
      focusA = ra.focus; focusB = rb.focus;
    } else if (shot.kind === "hold") {
      A = this.stills.get(shot.still);
      aKey = "still:" + shot.still;
      B = A;
      bKey = aKey;
      rest = shot.rest;
      focusA = focusB = this.focusOf(shot.still);
      depthKey = shot.still;
    } else {
      const n = this.frames(shot.clip);
      const fa = this.focusOf(shot.from), fb = this.focusOf(shot.to);
      const e = shot.t;
      const f: [number, number] = [fa[0] + (fb[0] - fa[0]) * e, fa[1] + (fb[1] - fa[1]) * e];
      let used = false;
      if (n > 1) {
        const x = shot.t * (n - 1);
        const i = Math.floor(x);
        const a = this.nearestFrame(shot.clip, i, n);
        if (a) {
          const b = this.nearestFrame(shot.clip, Math.min(n - 1, i + 1), n) ?? a;
          A = a.bm; aKey = a.url; B = b.bm; bKey = b.url;
          mix = b.url === a.url ? 0 : x - i;
          focusA = focusB = f;
          // pre-decode ahead and behind
          for (const k of [i + 2, i + 3, i - 1, i - 2]) if (k >= 0 && k < n) this.requestDecode(this.frameUrl(shot.clip, k));
          used = true;
        }
      }
      if (!used) {
        // Stills-only fallback: a camera push from one still that dissolves into the next.
        A = this.stills.get(shot.from); aKey = "still:" + shot.from;
        B = this.stills.get(shot.to); bKey = "still:" + shot.to;
        const t = shot.t;
        const s = t * t * (3 - 2 * t);
        mix = Math.min(1, Math.max(0, (t - 0.3) / 0.45));
        mix = mix * mix * (3 - 2 * mix);
        zoomA = 1 + 0.22 * s;
        zoomB = 1.12 - 0.12 * s;
        focusA = fa; focusB = fb;
        if (shot.from === shot.to) { zoomA = 1; zoomB = 1; }
      }
    }

    if (this.gl) this.paintGL({ A, B, aKey, bKey, mix, zoomA, zoomB, rest, focusA, focusB, depthKey }, opts);
    else this.paint2D({ A, B, mix, zoomA, zoomB, focusA, focusB });
  }

  private paintGL(
    s: { A?: Bitmap; B?: Bitmap; aKey: string; bKey: string; mix: number; zoomA: number; zoomB: number; rest: number; focusA: [number, number]; focusB: [number, number]; depthKey: string },
    o: { time: number; mouse: [number, number]; pointer: [number, number]; motion: number },
  ) {
    const gl = this.gl!;
    const L = this.loc;
    const texFor = (key: string, img: Bitmap | undefined, slot: "A" | "B") => {
      if (!img) return slot === "A" ? this.texA! : this.texB!;
      if (key.startsWith("still:")) {
        let t = this.stillTex.get(key);
        if (!t) {
          t = this.makeTex();
          this.upload(t, img);
          this.stillTex.set(key, t);
        }
        return t;
      }
      const tex = slot === "A" ? this.texA! : this.texB!;
      const cur = slot === "A" ? this.texAKey : this.texBKey;
      if (cur !== key) {
        this.upload(tex, img);
        if (slot === "A") this.texAKey = key;
        else this.texBKey = key;
      }
      return tex;
    };
    const ta = texFor(s.aKey, s.A, "A");
    const tb = texFor(s.bKey, s.B, "B");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ta);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tb);
    const depth = s.depthKey ? this.depths.get(s.depthKey) : undefined;
    gl.activeTexture(gl.TEXTURE2);
    if (depth && this.texDKey !== s.depthKey) {
      this.upload(this.texD!, depth);
      this.texDKey = s.depthKey;
    } else gl.bindTexture(gl.TEXTURE_2D, this.texD);
    const scA = this.coverScale(s.A);
    const scB = this.coverScale(s.B);
    const cA = this.center(scA, s.focusA);
    const cB = this.center(scB, s.focusB);
    gl.uniform1f(L.uMix, s.mix);
    gl.uniform1f(L.uZoomA, s.zoomA);
    gl.uniform1f(L.uZoomB, s.zoomB);
    gl.uniform1f(L.uRest, s.rest);
    gl.uniform1f(L.uTime, o.time);
    gl.uniform1f(L.uHasDepth, depth && this.texDKey === s.depthKey ? 1 : 0);
    gl.uniform1f(L.uDepthAmt, depth ? 0.035 : 0.012);
    gl.uniform1f(L.uGrain, 0.05);
    gl.uniform1f(L.uMotion, o.motion);
    gl.uniform2f(L.uScaleA, scA[0], scA[1]);
    gl.uniform2f(L.uScaleB, scB[0], scB[1]);
    gl.uniform2f(L.uCenterA, cA[0], cA[1]);
    gl.uniform2f(L.uCenterB, cB[0], cB[1]);
    gl.uniform2f(L.uMouse, o.mouse[0], o.mouse[1]);
    gl.uniform2f(L.uPointer, o.pointer[0], o.pointer[1]);
    gl.uniform2f(L.uRes, this.size.w, this.size.h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private paint2D(s: { A?: Bitmap; B?: Bitmap; mix: number; zoomA: number; zoomB: number; focusA: [number, number]; focusB: [number, number] }) {
    const c = this.ctx2d;
    if (!c) return;
    const { w, h } = this.size;
    c.fillStyle = "#0a0b0d";
    c.fillRect(0, 0, w, h);
    const draw = (img: Bitmap | undefined, zoom: number, f: [number, number], alpha: number) => {
      if (!img || alpha <= 0) return;
      const iw = img.width, ih = img.height;
      const sc = Math.max(w / iw, h / ih) * zoom;
      const dw = iw * sc, dh = ih * sc;
      const x = Math.min(0, Math.max(w - dw, w / 2 - f[0] * dw));
      const y = Math.min(0, Math.max(h - dh, h / 2 - f[1] * dh));
      c.globalAlpha = alpha;
      c.drawImage(img, x, y, dw, dh);
    };
    draw(s.A, s.zoomA, s.focusA, 1);
    draw(s.B, s.zoomB, s.focusB, s.mix);
    c.globalAlpha = 1;
  }

  destroy() {
    this.aborted = true;
    this.decoded.forEach((b) => b.close());
    this.decoded.clear();
  }
}
