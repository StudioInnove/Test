// Turns the static export in out/ into a self-contained folder that works from any URL path.
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
// a version for this build: links carry it so browsers never show an old copy of a page
const V = Date.now().toString(36);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const f of walk(OUT)) {
  const ext = path.extname(f);
  if (![".html", ".js", ".css", ".txt"].includes(ext)) continue;
  let s = fs.readFileSync(f, "utf8");
  const before = s;
  if (ext === ".css") {
    s = s.replaceAll("/_next/static/media/", "../media/");
  } else if (ext === ".html" || ext === ".txt") {
    if (ext === ".html") s = s.replace("<head>", `<head><script>window.__V=${JSON.stringify(V)}</script>`);
    const depth = path.relative(OUT, path.dirname(f)).split(path.sep).filter(Boolean).length;
    const up = depth ? "../".repeat(depth) : "./";
    s = s.replaceAll('"/_next/', `"${up}_next/`).replaceAll("'/_next/", `'${up}_next/`);
    if (depth && ext === ".html") {
      // files from /public (film, brand) live at the root of the preview
      s = s.replaceAll('"./film/', `"${up}film/`).replaceAll('"./brand/', `"${up}brand/`).replaceAll('"./worlds/', `"${up}worlds/`).replaceAll('"./closeups/', `"${up}closeups/`).replaceAll('"./services/', `"${up}services/`).replaceAll('"./sites/', `"${up}sites/`).replaceAll('srcSet="./', `srcSet="${up}`);
      s = s.replace("<head>", `<head><script>window.__B=${JSON.stringify(up)}</script>`);
      // links between pages: from one folder down, "./x/" and "#faq" must go up first
      s = s.replace(/href="(\.\/[^"]*|#[^"]*)"/g, (m, h) => `href="${h.startsWith("#") ? up + h : up + h.slice(2)}"`);
    }
  } else {
    // webpack runtime public path
    s = s.replaceAll('"/_next/"', '"./_next/"').replaceAll("\uFFFD", "\\uFFFD");
  }
  if (ext === ".html") {
    // links to pages of the site: the newest version, and "you came from inside" (no entrance again)
    // name the page file itself (a folder link can be redirected, losing what follows the "?")
    s = s.replace(/href="((?:\.\.\/|\.\/)+)([a-z0-9-]*\/)?(?:index\.html)?(?:\?in=1(?:&amp;|&)?(?:v=[a-z0-9]*)?)?(#[^"]*)?"/g, (m, up, page, hash) => `href="${up}${page || ""}index.html?in=1&v=${V}${hash || ""}"`);
  }
  if (s !== before) fs.writeFileSync(f, s);
}
console.log("preview ready", V);
