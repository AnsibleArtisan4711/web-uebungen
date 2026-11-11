// Kostenrechner für Webprojekte (Übung 21.1).
// Aufruf:   node tools/kosten.js docs/kosten/firmenwebsite.json
// Eingabe (JSON): { "satz": 90, "pm": 0.15, "puffer": 0.10, "pakete": [ { "name": "Design", "stunden": 32 } | { "name": "…", "o": 8, "w": 10, "p": 18 } ],
//                   "betrieb": [ { "name": "Hosting", "proJahr": 120 } ] }
// Regeln dieser Rechnung (so festgelegt, weil der Lehrplan sie nicht eindeutig vorschreibt):
//  - Dreipunktschätzung je Paket: (optimistisch + 4 × wahrscheinlich + pessimistisch) / 6
//  - Projektmanagement (pm) wird auf die Summe der Pakete ohne PM gerechnet
//  - Risikopuffer (puffer) wird auf die Summe inklusive PM gerechnet, in Stunden und in Euro gleich
//  - Euro-Beträge werden in Cent gerechnet und auf ganze Cent gerundet (keine Gleitkommafehler in der Ausgabe)
"use strict";
const fs = require("node:fs");

const rund = (x, stellen = 2) => Math.round((x + Number.EPSILON) * 10 ** stellen) / 10 ** stellen;

function stundenVon(paket) {
  if (typeof paket.stunden === "number") return paket.stunden;
  if ([paket.o, paket.w, paket.p].every((z) => typeof z === "number")) return (paket.o + 4 * paket.w + paket.p) / 6;
  throw new Error(`Paket „${paket.name}“: entweder "stunden" oder "o", "w" und "p" angeben`);
}

function berechne(eingabe) {
  const satz = eingabe.satz;
  if (!(satz > 0)) throw new Error('"satz" muss größer als 0 sein');
  const pm = eingabe.pm ?? 0;
  const puffer = eingabe.puffer ?? 0;
  const pakete = eingabe.pakete.map((p) => ({ name: p.name, stunden: stundenVon(p) }));
  const ohnePm = rund(pakete.reduce((s, p) => s + p.stunden, 0), 6);
  const pmStunden = rund(ohnePm * pm, 6);
  const mitPm = rund(ohnePm + pmStunden, 6);
  const pufferStunden = rund(mitPm * puffer, 6);
  const gesamt = rund(mitPm + pufferStunden, 6);
  const cent = (stunden) => Math.round(stunden * satz * 100);
  const betrieb = (eingabe.betrieb ?? []).map((b) => ({ name: b.name, proJahrCent: Math.round(b.proJahr * 100) }));
  return {
    pakete, ohnePm, pmStunden, mitPm, pufferStunden, gesamt,
    eurCentMitPm: cent(mitPm), eurCentPuffer: cent(pufferStunden), eurCentGesamt: cent(gesamt),
    betrieb, betriebProJahrCent: betrieb.reduce((s, b) => s + b.proJahrCent, 0),
  };
}

const eur = (cent) => (cent / 100).toLocaleString("de-AT", { style: "currency", currency: "EUR" });
const std = (h) => `${rund(h, 2).toLocaleString("de-AT", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h`;

function bericht(e, erg) {
  const zeilen = [];
  for (const p of erg.pakete) zeilen.push(`  ${p.name.padEnd(42)} ${std(p.stunden).padStart(10)}`);
  zeilen.push(`  ${"Summe ohne Projektmanagement".padEnd(42)} ${std(erg.ohnePm).padStart(10)}`);
  zeilen.push(`  ${("Projektmanagement " + rund((e.pm ?? 0) * 100, 1) + " %").padEnd(42)} ${std(erg.pmStunden).padStart(10)}`);
  zeilen.push(`  ${"Summe mit Projektmanagement".padEnd(42)} ${std(erg.mitPm).padStart(10)}   ${eur(erg.eurCentMitPm)}`);
  zeilen.push(`  ${("Risikopuffer " + rund((e.puffer ?? 0) * 100, 1) + " %").padEnd(42)} ${std(erg.pufferStunden).padStart(10)}   ${eur(erg.eurCentPuffer)}`);
  zeilen.push(`  ${"Gesamt".padEnd(42)} ${std(erg.gesamt).padStart(10)}   ${eur(erg.eurCentGesamt)}   (Stundensatz ${eur(Math.round(e.satz * 100))})`);
  if (erg.betrieb.length) {
    zeilen.push("", "  Laufende Kosten pro Jahr:");
    for (const b of erg.betrieb) zeilen.push(`    ${b.name.padEnd(26)} ${eur(b.proJahrCent).padStart(12)}`);
    zeilen.push(`    ${"Summe pro Jahr".padEnd(26)} ${eur(erg.betriebProJahrCent).padStart(12)}`);
  }
  return zeilen.join("\n");
}

module.exports = { berechne, stundenVon };

if (require.main === module) {
  const datei = process.argv[2];
  if (!datei) { console.error("Aufruf: node tools/kosten.js datei.json"); process.exit(2); }
  const eingabe = JSON.parse(fs.readFileSync(datei, "utf8"));
  console.log(bericht(eingabe, berechne(eingabe)));
}
