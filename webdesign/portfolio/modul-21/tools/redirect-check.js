// Prüft eine Umleitungstabelle für einen Relaunch (Übung 21.2).
// Aufruf:   node tools/redirect-check.js TABELLE.csv [--alt alte-urls.txt] [--ziele ORDNER]
//   TABELLE.csv   Zeilen "alte-adresse;neue-adresse;status", Adressen mit führendem "/", Status 301/302/307/308 oder 410 (ohne Ziel)
//   --alt         Textdatei mit allen alten Adressen (eine pro Zeile): jede muss in der Tabelle vorkommen
//   --ziele       Ordner mit der neuen Seite (Standard: dist, falls vorhanden, sonst der Projektordner): jedes Ziel muss dort als Datei existieren
// Geprüft wird: doppelte Einträge, Umleitung auf sich selbst, Ketten und Schleifen, fehlende Ziele, nicht abgedeckte alte Adressen.
// Rückgabewert 1 bei Problemen.
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const wert = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const tabelle = args.find((a) => !a.startsWith("--") && a !== wert("--alt") && a !== wert("--ziele"));
if (!tabelle) { console.error("Aufruf: node tools/redirect-check.js TABELLE.csv [--alt datei] [--ziele ordner]"); process.exit(2); }
const wurzel = path.resolve(__dirname, "..");
const zielOrdner = path.resolve(wert("--ziele") || (fs.existsSync(path.join(wurzel, "dist")) ? path.join(wurzel, "dist") : wurzel));

let probleme = 0;
const melde = (z) => { console.log("PROBLEM  " + z); probleme++; };

const eintraege = new Map();
fs.readFileSync(tabelle, "utf8").split(/\r?\n/).forEach((zeile, i) => {
  if (!zeile.trim() || zeile.trim().startsWith("#")) return;
  const [alt, neu = "", status = ""] = zeile.split(";").map((t) => t.trim());
  const ort = `Zeile ${i + 1}`;
  if (!alt.startsWith("/")) return melde(`${ort}: alte Adresse muss mit / beginnen („${alt}“)`);
  if (eintraege.has(alt)) return melde(`${ort}: ${alt} kommt doppelt vor`);
  const code = Number(status);
  if (code === 410) {
    if (neu) melde(`${ort}: ${alt} hat Status 410, darf aber kein Ziel haben`);
  } else if (![301, 302, 307, 308].includes(code)) {
    melde(`${ort}: ${alt} hat ungültigen Status „${status}“`);
  } else if (!neu.startsWith("/")) {
    melde(`${ort}: ${alt} braucht ein Ziel mit führendem /`);
  }
  eintraege.set(alt, { neu, code, ort });
});

function dateiFuer(adresse) {
  const pfad = decodeURIComponent(adresse.split("#")[0].split("?")[0]);
  const kandidat = path.join(zielOrdner, pfad);
  if (pfad.endsWith("/")) return path.join(kandidat, "index.html");
  return fs.existsSync(kandidat) && fs.statSync(kandidat).isDirectory() ? path.join(kandidat, "index.html") : kandidat;
}

for (const [alt, e] of eintraege) {
  if (e.code === 410 || !e.neu) continue;
  if (e.neu === alt) { melde(`${e.ort}: ${alt} leitet auf sich selbst um`); continue; }
  // Ketten und Schleifen: folge dem Ziel, solange es selbst eine alte Adresse ist
  const besucht = [alt];
  let aktuell = e.neu;
  while (eintraege.has(aktuell) && eintraege.get(aktuell).code !== 410 && !besucht.includes(aktuell)) {
    besucht.push(aktuell);
    aktuell = eintraege.get(aktuell).neu;
  }
  if (besucht.includes(aktuell)) melde(`${e.ort}: Schleife ${[...besucht, aktuell].join(" -> ")}`);
  else if (besucht.length > 1) melde(`${e.ort}: Kette ${[...besucht, aktuell].join(" -> ")} (direkt auf ${aktuell} umleiten)`);
  else if (!fs.existsSync(dateiFuer(e.neu))) melde(`${e.ort}: Ziel ${e.neu} existiert nicht in ${path.relative(wurzel, zielOrdner) || "."}`);
}

const altDatei = wert("--alt");
let geprueft = 0;
if (altDatei) {
  for (const zeile of fs.readFileSync(altDatei, "utf8").split(/\r?\n/).map((z) => z.trim()).filter((z) => z && !z.startsWith("#"))) {
    geprueft++;
    if (!eintraege.has(zeile)) melde(`alte Adresse ${zeile} hat kein Ziel in der Tabelle`);
  }
}
console.log(`Umleitungen: ${eintraege.size} Einträge${altDatei ? `, ${geprueft} alte Adressen abgeglichen` : ""}, ${probleme} Probleme.`);
process.exit(probleme > 0 ? 1 : 0);
