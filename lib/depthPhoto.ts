/*
 * A photograph with depth. Each still has a depth map (worked out offline: near is bright), and a tiny
 * WebGL shader moves near things more than far ones as the view shifts, so the photo reads as a real
 * place you are looking into. The shift is small and eased; nothing is warped enough to notice.
 */

const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `precision mediump float;
varying vec2 v;
uniform sampler2D img, dep;
uniform vec2 off, sc;
uniform float focus;
void main(){
  vec2 uv = 0.5 + (vec2(v.x, 1.0 - v.y) - 0.5) * sc;
  float d = texture2D(dep, uv).r;
  vec2 q = uv + off * (d - focus);
  d = texture2D(dep, q).r;
  q = uv + off * (d - focus);
  gl_FragColor = texture2D(img, q);
}`;

const load = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

export class DepthPhoto {
  private gl: WebGLRenderingContext;
  private prog!: WebGLProgram;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private ia = 1;
  ready = false;
  /** the shift, in a share of the picture (x, y) */
  off = [0, 0];
  /** the depth that stays still (the thing you are looking at) */
  focus = 0.5;
  /** a slight zoom so the edges never show */
  zoom = 0.955;
  private w = 1;
  private h = 1;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false, alpha: true });
    if (!gl) throw new Error("no webgl");
    this.gl = gl;
  }

  async load(imgSrc: string, depthSrc: string) {
    const [img, dep] = await Promise.all([load(imgSrc), load(depthSrc)]);
    const gl = this.gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("shader");
    gl.useProgram(prog);
    this.prog = prog;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const tex = (unit: number, el: HTMLImageElement) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);
    };
    tex(0, img);
    tex(1, dep);
    for (const n of ["img", "dep", "off", "sc", "focus"]) this.loc[n] = gl.getUniformLocation(prog, n);
    gl.uniform1i(this.loc.img, 0);
    gl.uniform1i(this.loc.dep, 1);
    this.ia = img.naturalWidth / img.naturalHeight;
    this.ready = true;
  }

  resize(w: number, h: number) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /** How much of the picture shows across and down (object-fit: cover, then the zoom). */
  scale(): [number, number] {
    const ba = this.w / this.h;
    return [Math.min(1, ba / this.ia) * this.zoom, Math.min(1, this.ia / ba) * this.zoom];
  }

  /** Where something at depth d appears to move, in pixels, for the current shift. */
  shiftAt(d: number): [number, number] {
    const [sx, sy] = this.scale();
    return [(-this.off[0] * (d - this.focus) * this.w) / sx, (-this.off[1] * (d - this.focus) * this.h) / sy];
  }

  draw() {
    if (!this.ready) return;
    const gl = this.gl;
    const [sx, sy] = this.scale();
    gl.uniform2f(this.loc.sc, sx, sy);
    gl.uniform2f(this.loc.off, this.off[0], this.off[1]);
    gl.uniform1f(this.loc.focus, this.focus);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
