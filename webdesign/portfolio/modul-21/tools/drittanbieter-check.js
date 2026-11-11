// Inventar externer Ressourcen (Übung 21.5, Third-Party CSS).
// Aufruf:   node tools/drittanbieter-check.js DATEI_ODER_ORDNER [...]
// Findet in HTML und CSS Ladevorgänge von fremden Adressen und prüft bei Stylesheets und Skripten
//   - Subresource Integrity (integrity="sha384-...") und crossorigin
//   - feste Version in der Adresse (kein "latest")
//   - @import und url(...) auf fremde Server in CSS
// SRI wird nur auf Form geprüft (sha256/384/512-Präfix), nicht auf den richtigen Hash: den prüft der Browser.
// Nicht gezählt werden Namensraum-Adressen (w3.org/2000/svg), Links (<a href>) und die eigene Adresse aus EIGENE (Standard: example.com).
// Mustersuche, kein Parser. Rückgabewert 1, wenn Funde vorliegen.
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const EIGENE = (process.env.EIGENE || "example.com").split(",");
const fremd = (u) => /^(https?:)?\/\//i.test(u) && !EIGENE.some((e) => u.includes("//" + e)) && !/w3\.org\/(2000|1999)/.test(u);
const zeileVon = (t, i) => t.slice(0, i).split("\n").length;

function pruefeHtml(text, funde) {
  for (const m of text.matchAll(/<(link|script|img|iframe|source|video|audio)\b[^>]*>/gi)) {
    const tag = m[0];
    const url = (tag.match(/\s(?:href|src)="([^"]+)"/i) || [])[1];
    if (!url || !fremd(url)) continue;
    if (/^<link/i.test(tag) && !/rel="(stylesheet|preload|modulepreload)"/i.test(tag)) continue; // canonical, alternate usw. laden nichts
    const art = m[1].toLowerCase();
    const mitSri = /\sintegrity="sha(256|384|512)-/i.test(tag);
    const mitCors = /\scrossorigin/i.test(tag);
    const problem = [];
    if ((art === "script" || (art === "link" && /stylesheet/i.test(tag))) && !mitSri) problem.push("ohne Integritätsprüfung (SRI)");
    if (mitSri && !mitCors) problem.push("integrity ohne crossorigin");
    if (/@latest|\/latest\/|[?&]version=latest/i.test(url)) problem.push("keine feste Version");
    if (art !== "script" && !(art === "link" && /stylesheet/i.test(tag))) problem.push("fremder Server wird beim Laden kontaktiert (Datenschutz, Ausfall)");
    funde.push({ zeile: zeileVon(text, m.index), art, url, problem });
  }
}
function pruefeCss(text, funde) {
  for (const m of text.matchAll(/@import\s+(?:url\()?["']?([^"')\s;]+)/gi)) if (fremd(m[1])) funde.push({ zeile: zeileVon(text, m.index), art: "@import", url: m[1], problem: ["blockiert das Rendern, besser <link> oder lokal"] });
  for (const m of text.matchAll(/(?<!@import\s+)url\(\s*["']?([^"')]+)/gi)) if (fremd(m[1])) funde.push({ zeile: zeileVon(text, m.index), art: "url()", url: m[1], problem: ["fremder Server wird beim Rendern kontaktiert (Datenschutz, Ausfall, Datenabfluss)"] });
}
function sammle(z, l) {
  if (fs.statSync(z).isDirectory()) { for (const n of fs.readdirSync(z)) if (!["node_modules", "dist", ".git"].includes(n)) sammle(path.join(z, n), l); }
  else if (/\.(html|css)$/.test(z)) l.push(z);
  return l;
}
const ziele = process.argv.slice(2);
if (!ziele.length) { console.error("Aufruf: node tools/drittanbieter-check.js DATEI_ODER_ORDNER [...]"); process.exit(2); }
const dateien = ziele.flatMap((z) => sammle(z, []));
let n = 0, mitProblem = 0;
for (const d of dateien) {
  const funde = [];
  const t = fs.readFileSync(d, "utf8");
  (d.endsWith(".css") ? pruefeCss : pruefeHtml)(t, funde);
  for (const f of funde) {
    n++;
    if (f.problem.length) mitProblem++;
    console.log(`${path.relative(process.cwd(), d)}:${f.zeile}  ${f.art}  ${f.url}  ${f.problem.length ? "-> " + f.problem.join("; ") : "(kein Befund)"}`);
  }
}
console.log(`\n${dateien.length} Dateien geprüft, ${n} externe Ressourcen, ${mitProblem} mit Befund.`);
process.exit(n > 0 ? 1 : 0);
