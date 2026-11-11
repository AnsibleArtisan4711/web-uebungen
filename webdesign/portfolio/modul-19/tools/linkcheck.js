// Prüft interne Verweise in HTML-Dateien: Gibt es das Ziel, und gibt es bei #anker die passende id?
//   node tools/linkcheck.js [Ordner]      (Standard: Projektordner; für den Build: node tools/linkcheck.js dist)
// Geprüft werden href, src, srcset (erster Eintrag je Kandidat) und poster. Externe Adressen (https:, mailto:, tel:, data:) werden übersprungen.
// Das ist eine statische Prüfung des Textes: Sie sieht keine Verweise, die erst JavaScript erzeugt.
const fs = require("node:fs");
const path = require("node:path");

const wurzel = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const IGNORIEREN = new Set(["node_modules", "dist", "experimente", "docs", ".git"]);

function html(ordner) {
  return fs.readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    if (IGNORIEREN.has(e.name)) return [];
    const p = path.join(ordner, e.name);
    return e.isDirectory() ? html(p) : e.name.endsWith(".html") ? [p] : [];
  });
}
const ids = new Map();
const idsVon = (datei) => {
  if (!ids.has(datei)) ids.set(datei, new Set([...fs.readFileSync(datei, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(datei);
};
function ziel(von, adresse) {
  const [pfad, anker] = adresse.split("#");
  let datei = pfad === "" ? von : path.resolve(path.dirname(von), decodeURIComponent(pfad.split("?")[0]));
  if (pfad.startsWith("/")) datei = path.join(wurzel, decodeURIComponent(pfad.split("?")[0]));
  if (fs.existsSync(datei) && fs.statSync(datei).isDirectory()) datei = path.join(datei, "index.html");
  return { datei, anker };
}

const probleme = [];
let geprueft = 0;
for (const seite of html(wurzel)) {
  const text = fs.readFileSync(seite, "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
  const adressen = [];
  for (const m of text.matchAll(/\s(?:href|src|poster)="([^"]*)"/g)) adressen.push(m[1]);
  for (const m of text.matchAll(/\ssrcset="([^"]*)"/g)) for (const kand of m[1].split(",")) adressen.push(kand.trim().split(/\s+/)[0]);
  for (const a of adressen) {
    if (a === "" || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(a)) continue;
    geprueft++;
    const { datei, anker } = ziel(seite, a);
    const rel = path.relative(wurzel, seite);
    if (!fs.existsSync(datei)) { probleme.push(`${rel}: Ziel fehlt: ${a}`); continue; }
    if (anker && datei.endsWith(".html") && !idsVon(datei).has(anker)) probleme.push(`${rel}: Anker fehlt: ${a}`);
  }
}
console.log(`${geprueft} interne Verweise in ${html(wurzel).length} Seiten geprüft.`);
if (probleme.length) { console.log(probleme.join("\n")); console.log(`\n${probleme.length} Problem(e) gefunden.`); process.exit(1); }
console.log("Keine Probleme gefunden.");
