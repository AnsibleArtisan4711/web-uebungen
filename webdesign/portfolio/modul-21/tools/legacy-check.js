// Sucht veraltete Muster in HTML- und CSS-Dateien (Übung 21.3, Migration).
// Aufruf:   node tools/legacy-check.js DATEI_ODER_ORDNER [...]
// Es ist eine Mustersuche mit regulären Ausdrücken und kein HTML-Parser: Treffer sind Hinweise, die man ansehen muss
// (zum Beispiel ist eine Tabelle für echte Daten korrekt). Rückgabewert 1, wenn etwas gefunden wurde.
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const HTML_REGELN = [
  { id: "font-tag", text: "<font> ist veraltet, Schrift gehört ins CSS", muster: /<\/?font\b/gi },
  { id: "center-tag", text: "<center> ist veraltet, zentrieren per CSS", muster: /<\/?center\b/gi },
  { id: "darstellungs-attribut", text: "Darstellungsattribut (bgcolor, valign, cellpadding, align ...) gehört ins CSS", muster: /\s(bgcolor|valign|cellpadding|cellspacing|align|background)=/gi },
  { id: "b-i-tag", text: "<b>/<i>: prüfen, ob <strong>/<em> (Bedeutung) oder CSS (nur Optik) gemeint ist", muster: /<\/?(b|i)\b(?=[\s>])/gi },
  { id: "br-kette", text: "mehrere <br> hintereinander erzeugen Abstand, dafür gibt es margin", muster: /(<br\s*\/?>\s*){2,}/gi },
  { id: "leerer-absatz", text: "leerer Absatz als Abstandshalter", muster: /<p>\s*(&nbsp;)?\s*<\/p>/gi },
  { id: "inline-style", text: "style-Attribut: Optik gehört in die CSS-Datei (und passt nicht zur strengen CSP)", muster: /<[a-z][^>]*\sstyle="/gi },
  { id: "layout-tabelle", text: "Tabelle mit Breiten-Attribut: vermutlich Layout-Tabelle, Daten-Tabellen brauchen <th>", muster: /<table\b[^>]*\swidth=/gi },
  { id: "img-ohne-alt", text: "Bild ohne alt-Attribut", muster: /<img\b(?![^>]*\balt=)[^>]*>/gi },
  { id: "leeres-clear-div", text: "leeres Div nur zum Float-Aufräumen", muster: /<div class="clear(fix)?">\s*<\/div>/gi },
];
const CSS_REGELN = [
  { id: "float-layout", text: "float als Layout-Technik: Flexbox oder Grid verwenden", muster: /\bfloat\s*:\s*(left|right)/gi },
  { id: "clearfix", text: "clear/clearfix wird mit Flexbox/Grid überflüssig", muster: /\bclear\s*:\s*both|\.clearfix|\*zoom/gi },
  { id: "ie-filter", text: "Internet-Explorer-Filter (filter: alpha, progid:) wird nicht mehr unterstützt", muster: /filter\s*:\s*(alpha|progid)/gi },
  { id: "alter-prefix", text: "Hersteller-Präfix: Autoprefixer erzeugt nötige Präfixe selbst, handgeschriebene entfernen", muster: /-(webkit|moz|ms|o)-(box-shadow|border-radius|transition|transform|box)\b/gi },
  { id: "important", text: "!important überschreibt die Kaskade und erschwert Wartung", muster: /!important/gi },
  { id: "px-schrift", text: "Schriftgröße in px verhindert die Skalierung nach Nutzereinstellung (rem verwenden)", muster: /font-size\s*:\s*\d+px/gi },
  { id: "schrift-ohne-fallback", text: "font-family ohne generische Familie (serif, sans-serif ...)", muster: /font-family\s*:\s*(?!var\()[^;,}\s][^;,}]*(?=;|})/gi },
];

function zeileVon(text, index) { return text.slice(0, index).split("\n").length; }

function pruefe(datei) {
  const text = fs.readFileSync(datei, "utf8");
  const funde = [];
  const regeln = datei.endsWith(".css") ? CSS_REGELN : HTML_REGELN;
  for (const r of regeln) for (const m of text.matchAll(r.muster)) funde.push({ id: r.id, zeile: zeileVon(text, m.index), text: r.text });
  if (datei.endsWith(".html")) {
    if (!/<!doctype html>/i.test(text)) funde.push({ id: "kein-doctype", zeile: 1, text: "<!DOCTYPE html> fehlt (Quirks-Modus)" });
    if (!/<html[^>]*\blang=/i.test(text)) funde.push({ id: "kein-lang", zeile: 1, text: "lang-Attribut am <html> fehlt" });
    if (!/<meta[^>]*charset=/i.test(text)) funde.push({ id: "kein-charset", zeile: 1, text: "meta charset fehlt" });
    if (!/<meta[^>]*name="viewport"/i.test(text)) funde.push({ id: "kein-viewport", zeile: 1, text: "meta viewport fehlt (kein responsives Verhalten)" });
    const ids = new Map();
    for (const m of text.matchAll(/\sid="([^"]+)"/g)) ids.set(m[1], [...(ids.get(m[1]) || []), zeileVon(text, m.index)]);
    for (const [id, zeilen] of ids) if (zeilen.length > 1) funde.push({ id: "doppelte-id", zeile: zeilen[1], text: `id="${id}" kommt mehrfach vor (Zeilen ${zeilen.join(", ")})` });
  }
  return funde;
}

function sammle(ziel, liste) {
  const st = fs.statSync(ziel);
  if (st.isDirectory()) { for (const n of fs.readdirSync(ziel)) if (n !== "node_modules" && n !== "dist") sammle(path.join(ziel, n), liste); }
  else if (/\.(html|css)$/.test(ziel)) liste.push(ziel);
  return liste;
}

const ziele = process.argv.slice(2);
if (!ziele.length) { console.error("Aufruf: node tools/legacy-check.js DATEI_ODER_ORDNER [...]"); process.exit(2); }
const dateien = ziele.flatMap((z) => sammle(z, []));
let gesamt = 0;
const zaehler = {};
for (const d of dateien) {
  for (const f of pruefe(d)) {
    console.log(`${path.relative(process.cwd(), d)}:${f.zeile}  [${f.id}] ${f.text}`);
    gesamt++;
    zaehler[f.id] = (zaehler[f.id] || 0) + 1;
  }
}
const zusammen = Object.entries(zaehler).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ");
console.log(`\n${dateien.length} Dateien geprüft, ${gesamt} Hinweise${gesamt ? ` (${zusammen})` : ""}.`);
process.exit(gesamt > 0 ? 1 : 0);
