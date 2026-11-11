// Prüft Dateigrößen gegen das Performance-Budget aus docs/performance-budget.md.
// Aufruf im Ordner modul-16:  node tools/budget-check.js
// Gemessen wird die komprimierte Größe (gzip, Stufe 9) – das ist näherungsweise, was über das Netz geht.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Budget in Byte (komprimiert für Text, roh für Bilder)
const BUDGET = [
  { muster: /^css\/.*\.css$/,            max: 10 * 1024, art: "gzip" },
  { muster: /^js\/.*\.js$/,              max: 6 * 1024,  art: "gzip" },
  { muster: /\.html$/,                   max: 6 * 1024,  art: "gzip" },
  { muster: /^img\/(?!og-bild).*\.(png|webp|avif)$/, max: 20 * 1024, art: "roh" },  // og-bild.png wird nur von Link-Vorschauen geladen, nicht von der Seite
];
const IGNORIEREN = ["node_modules", "experimente", "tests", "tools", "docs", ".git"];

function dateien(ordner, rel = "") {
  let liste = [];
  for (const eintrag of fs.readdirSync(path.join(ordner, rel), { withFileTypes: true })) {
    const r = path.posix.join(rel, eintrag.name);
    if (eintrag.isDirectory()) {
      if (!IGNORIEREN.includes(eintrag.name)) liste = liste.concat(dateien(ordner, r));
    } else liste.push(r);
  }
  return liste;
}

let fehler = 0;
for (const datei of dateien(".")) {
  const regel = BUDGET.find((b) => b.muster.test(datei));
  if (!regel) continue;
  const inhalt = fs.readFileSync(datei);
  const groesse = regel.art === "gzip" ? zlib.gzipSync(inhalt, { level: 9 }).length : inhalt.length;
  const ok = groesse <= regel.max;
  if (!ok) fehler += 1;
  console.log(`${ok ? "ok  " : "ZU GROSS"}  ${datei}  ${groesse} B (${regel.art}, Budget ${regel.max} B)`);
}
console.log(fehler === 0 ? "\nBudget eingehalten." : `\n${fehler} Datei(en) über Budget.`);
process.exit(fehler === 0 ? 0 : 1);
