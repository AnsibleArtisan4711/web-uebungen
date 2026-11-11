// Einfacher SEO-Check ohne Abhängigkeiten.  Aufruf im Ordner modul-13:  node tools/seo-check.js
// Prüft pro HTML-Seite: title, description, h1, canonical, lang, Open Graph, JSON-LD, Bilder ohne alt,
// und findet Waisenseiten (Seiten ohne eingehenden Link). Experimente und 404.html werden übersprungen.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

function dateien(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ["node_modules", "experimente", "tools", "tests"].includes(e.name) ? [] : dateien(p);
    return e.name.endsWith(".html") && e.name !== "404.html" ? [p] : [];
  });
}
const seiten = dateien(root);
const eingehend = new Map(seiten.map((s) => [s, 0]));
let probleme = 0;
const melde = (s, text) => { probleme++; console.log("  PROBLEM " + text); };

for (const s of seiten) {
  const rel = path.relative(root, s).split(path.sep).join("/");
  const h = fs.readFileSync(s, "utf8");
  console.log(rel);
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!title) melde(s, "title fehlt"); else if (title.length > 60) melde(s, `title ${title.length} Zeichen (>60)`);
  if (!desc) melde(s, "description fehlt"); else if (desc.length < 110 || desc.length > 165) melde(s, `description ${desc.length} Zeichen (110 bis 165 erwartet)`);
  if ((h.match(/<h1[ >]/g) || []).length !== 1) melde(s, "genau eine h1 erwartet");
  if (!/<html lang="/.test(h)) melde(s, "lang am html-Element fehlt");
  if (!/<link rel="canonical" href="https:\/\//.test(h)) melde(s, "canonical (absolut) fehlt");
  for (const og of ["og:title", "og:description", "og:image", "og:url"]) if (!h.includes(`property="${og}"`)) melde(s, og + " fehlt");
  for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) melde(s, "img ohne alt: " + m[0].slice(0, 60));
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { melde(s, "JSON-LD ist kein gültiges JSON"); }
  }
  for (const m of h.matchAll(/<(?:a|form)\b[^>]*(?:href|action)="([^"#?]+)"/g)) {   // Formular-Ziele zählen als Verweis
    if (/^[a-z]+:/i.test(m[1])) continue;
    const ziel = path.resolve(path.dirname(s), m[1]);
    if (eingehend.has(ziel) && ziel !== s) eingehend.set(ziel, eingehend.get(ziel) + 1);
  }
}
console.log("\nWaisenseiten (keine eingehenden Links):");
let waisen = 0;
for (const [s, n] of eingehend) if (n === 0 && path.relative(root, s) !== "index.html") { waisen++; console.log("  " + path.relative(root, s).split(path.sep).join("/")); }
if (!waisen) console.log("  keine");
console.log(`\n${seiten.length} Seiten, ${probleme} Probleme, ${waisen} Waisenseiten`);
process.exitCode = probleme || waisen ? 1 : 0;
