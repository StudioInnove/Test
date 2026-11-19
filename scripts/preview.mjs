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
    if (depth && ext === ".html") {
      // files from /public (film, brand) live at the root of the preview
      s = s.replaceAll('"./film/', `"${up}film/`).replaceAll('"./brand/', `"${up}brand/`).replaceAll('srcSet="./', `srcSet="${up}`);
      s = s.replace("<head>", `<head><script>window.__B=${JSON.stringify(up)}</script>`);
    }
  } else {
    // webpack runtime public path
    s = s.replaceAll('"/_next/"', '"./_next/"').replaceAll("\uFFFD", "\\uFFFD");
  }
  if (s !== before) fs.writeFileSync(f, s);
}
console.log("preview ready");
