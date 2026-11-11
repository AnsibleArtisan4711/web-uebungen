// Prüft, ob die Pflichtteile der Dokumentation vorhanden sind (Übung 20.5).
//  - README.md enthält Abschnitte zu Zweck, Voraussetzungen, Installation, Befehlen, Struktur, Veröffentlichung, Konventionen, Kontakt
//  - CONTRIBUTING.md und docs/betriebshandbuch.md existieren; das Betriebshandbuch hat Zugänge, Backups und Notfallkontakte
//  - jede ADR (docs/adr/0*.md) hat Status, Kontext, Entscheidung, Alternativen, Konsequenzen
//  - relative Verweise in allen Markdown-Dateien führen zu vorhandenen Dateien (Verweise außerhalb des Projektordners werden übersprungen)
// Aufruf: node tools/doku-check.js      Rückgabewert 1 bei Mängeln.
// Grenze: Der Check prüft nur, ob etwas da ist, nicht ob es stimmt oder verständlich ist. Das bleibt Aufgabe des Reviews.
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const wurzel = path.resolve(__dirname, "..");
const lies = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
let probleme = 0;
const melde = (text) => {
  console.log("PROBLEM  " + text);
  probleme++;
};
const ueberschriften = (t) => [...t.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1].toLowerCase());

// README
const readme = lies(path.join(wurzel, "README.md"));
if (readme === null) melde("README.md fehlt");
else {
  const h = ueberschriften(readme);
  const pflicht = [
    ["Zweck", /zweck|über dieses|ansehen/],
    ["Voraussetzungen", /voraussetzung/],
    ["Installation", /installation|erste schritte|einrichten/],
    ["Befehle", /befehle/],
    ["Struktur", /struktur|aufbau|ordner/],
    ["Veröffentlichung", /veröffentlich|deploy|bereitstell/],
    ["Konventionen", /konvention|mitarbeiten|contributing/],
    ["Ansprechpersonen", /kontakt|ansprech/],
  ];
  for (const [name, re] of pflicht) if (!h.some((x) => re.test(x))) melde(`README.md: Abschnitt „${name}“ fehlt`);
}

// weitere Pflichtdateien
if (lies(path.join(wurzel, "CONTRIBUTING.md")) === null) melde("CONTRIBUTING.md fehlt");
const handbuch = lies(path.join(wurzel, "docs", "betriebshandbuch.md"));
if (handbuch === null) melde("docs/betriebshandbuch.md fehlt");
else {
  const h = ueberschriften(handbuch);
  for (const teil of ["zugänge", "backups", "notfallkontakte"])
    if (!h.some((x) => x.includes(teil))) melde(`docs/betriebshandbuch.md: Abschnitt „${teil}“ fehlt`);
}

// ADRs
const adrOrdner = path.join(wurzel, "docs", "adr");
let adrs = 0;
if (fs.existsSync(adrOrdner)) {
  for (const n of fs.readdirSync(adrOrdner).filter((f) => /^0\d{3}-.*\.md$/.test(f))) {
    adrs++;
    const t = lies(path.join(adrOrdner, n));
    const h = ueberschriften(t);
    if (!/^- Status:/m.test(t)) melde(`docs/adr/${n}: Zeile „Status“ fehlt`);
    for (const teil of ["kontext", "entscheidung", "alternativen", "konsequenzen"])
      if (!h.includes(teil)) melde(`docs/adr/${n}: Abschnitt „${teil}“ fehlt`);
  }
}
if (adrs === 0) melde("docs/adr: keine Entscheidung festgehalten (Dateien 0001-….md)");

// Verweise
function md(ordner, liste = []) {
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", "test-results"].includes(e.name)) continue;
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) md(p, liste);
    else if (p.endsWith(".md")) liste.push(p);
  }
  return liste;
}
let verweise = 0;
for (const datei of md(wurzel)) {
  const text = fs.readFileSync(datei, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const ziel = m[1].split("#")[0];
    if (!ziel || /^[a-z]+:/i.test(ziel)) continue;
    const abs = path.resolve(path.dirname(datei), ziel);
    if (path.relative(wurzel, abs).startsWith("..")) continue;
    verweise++;
    if (!fs.existsSync(abs)) melde(`${path.relative(wurzel, datei)}: Verweis auf fehlende Datei „${ziel}“`);
  }
}
console.log(`Dokumentation: ${probleme} Probleme (${adrs} ADRs, ${verweise} Verweise geprüft).`);
process.exit(probleme > 0 ? 1 : 0);
