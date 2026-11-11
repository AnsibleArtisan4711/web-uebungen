// Prüft Namenskonventionen (Übung 20.3):
//  1. Dateinamen: Kleinbuchstaben, Ziffern, Bindestrich, Punkt; keine Leerzeichen/Umlaute (Ausnahmen: README.md, CHANGELOG.md, ...)
//  2. Klassennamen in den HTML-Seiten folgen dem BEM-Muster (gleiches Muster wie in .stylelintrc.json)
//  3. Klassen, die in HTML vorkommen, aber im CSS fehlen ("undefiniert"; Ausnahme: Präfix js- für reine JavaScript-Haken), und umgekehrt ("ungenutzt")
// Aufruf: node tools/naming-check.js [Ordner]     Rückgabewert 1, wenn Verstöße gegen 1. oder 2. oder undefinierte Klassen gefunden werden.
// Grenzen: Klassen, die nur aus zusammengesetzten Zeichenketten im JavaScript entstehen, sieht der Check nicht.
// "Ungenutzt" ist nur ein Hinweis (Zustandsklassen setzt oft JavaScript), kein Fehler.
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const wurzel = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const IGNORIERT = new Set(["node_modules", "dist", ".git", "docs", "tests", "e2e", "test-results", "playwright-report"]);
const ERLAUBT_GROSS = /^(README|CHANGELOG|CONTRIBUTING|LICENSE|CODEOWNERS)(\.md)?$/;
const BEM = /^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$/;

function dateien(ordner, liste = []) {
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    if (IGNORIERT.has(e.name)) continue;
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) dateien(p, liste);
    else liste.push(p);
  }
  return liste;
}
const alle = dateien(wurzel);
const rel = (p) => path.relative(wurzel, p).split(path.sep).join("/");
let verstoesse = 0;

// 1. Dateinamen (Ordnernamen werden mit geprüft, weil sie Teil des Pfads sind)
const schlechtePfade = new Set();
for (const p of alle) {
  for (const teil of rel(p).split("/")) {
    if (teil.startsWith(".") || ERLAUBT_GROSS.test(teil)) continue;
    if (!/^[a-z0-9][a-z0-9.-]*$/.test(teil)) schlechtePfade.add(`${rel(p)}  (${teil})`);
  }
}
for (const s of schlechtePfade) console.log("DATEINAME  " + s);
verstoesse += schlechtePfade.size;

// 2./3. Klassen
const html = alle.filter((p) => p.endsWith(".html"));
const css = alle.filter((p) => p.endsWith(".css") && rel(p).startsWith("css/src/"));
const js = alle.filter((p) => p.endsWith(".js") && rel(p).startsWith("js/"));
const inHtml = new Map();
for (const p of html) {
  const t = fs.readFileSync(p, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  for (const m of t.matchAll(/\sclass="([^"]*)"/g))
    for (const k of m[1].split(/\s+/).filter(Boolean)) {
      if (!inHtml.has(k)) inHtml.set(k, new Set());
      inHtml.get(k).add(rel(p));
    }
}
const imCss = new Set();
for (const p of css) {
  const t = fs.readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of t.matchAll(/\.([a-zA-Z_][\w-]*)/g)) imCss.add(m[1]);
}
const imJs = new Set();
for (const p of html)
  for (const m of fs.readFileSync(p, "utf8").matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g))
    for (const w of m[1].matchAll(/["'`.\s]([a-z][a-z0-9_-]*)(?=["'`\s,)])/g)) imJs.add(w[1]);
for (const p of js) for (const m of fs.readFileSync(p, "utf8").matchAll(/["'`.\s]([a-z][a-z0-9_-]*)(?=["'`\s,)])/g)) imJs.add(m[1]);

let bemFehler = 0;
for (const k of [...inHtml.keys()].sort()) {
  if (!BEM.test(k)) { console.log(`KLASSE     "${k}" folgt nicht dem BEM-Muster (${[...inHtml.get(k)][0]})`); bemFehler++; }
}
verstoesse += bemFehler;
// Konvention: Klassen mit Präfix "js-" sind reine Haken für JavaScript und brauchen kein CSS.
const undefiniert = [...inHtml.keys()].filter((k) => !imCss.has(k) && !k.startsWith("js-")).sort();
for (const k of undefiniert) console.log(`UNDEFINIERT "${k}" steht in ${[...inHtml.get(k)][0]}, aber nicht im CSS`);
verstoesse += undefiniert.length;
const ungenutzt = [...imCss].filter((k) => !inHtml.has(k) && !imJs.has(k)).sort();
for (const k of ungenutzt) console.log(`UNGENUTZT  ".${k}" steht im CSS, kommt aber weder im HTML noch im JavaScript vor (Hinweis)`);

console.log(
  `Namen: ${alle.length} Dateien, ${inHtml.size} Klassen im HTML, ${imCss.size} im CSS. ` +
    `Verstöße: ${verstoesse} (Dateinamen ${schlechtePfade.size}, BEM ${bemFehler}, undefiniert ${undefiniert.length}); Hinweise: ${ungenutzt.length} ungenutzte CSS-Klassen.`,
);
process.exit(verstoesse > 0 ? 1 : 0);
