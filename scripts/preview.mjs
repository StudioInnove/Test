// Turns the static export in out/ into a self-contained folder that works from any URL path.
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const f of walk(OUT)) {
  const ext = path.extname(f);
  if (![".html", ".js", ".css", ".txt"].includes(ext)) continue;
  let s = fs.readFileSync(f, "utf8");
  const before = s;
  if (ext === ".css") {
    s = s.replaceAll("/_next/static/media/", "../media/");
  } else if (ext === ".html" || ext === ".txt") {
    const depth = path.relative(OUT, path.dirname(f)).split(path.sep).filter(Boolean).length;
    const up = depth ? "../".repeat(depth) : "./";
    s = s.replaceAll('"/_next/', `"${up}_next/`).replaceAll("'/_next/", `'${up}_next/`);
  } else {
    // webpack runtime public path
    s = s.replaceAll('"/_next/"', '"./_next/"').replaceAll("\uFFFD", "\\uFFFD");
  }
  if (s !== before) fs.writeFileSync(f, s);
}
console.log("preview ready");

// Preview only: one frame set (desktop) keeps the file count small; phones fall back to it.
const mf = path.join(OUT, "film", "manifest.json");
if (fs.existsSync(mf)) {
  const m = JSON.parse(fs.readFileSync(mf, "utf8"));
  for (const [id, c] of Object.entries(m.clips)) {
    delete c.m;
    fs.rmSync(path.join(OUT, "film", id, "m"), { recursive: true, force: true });
  }
  fs.writeFileSync(mf, JSON.stringify(m));
}
