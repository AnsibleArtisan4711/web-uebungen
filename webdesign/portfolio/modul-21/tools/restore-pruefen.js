// Wiederherstellungstest (Übung 21.6): Ein Backup, das nie zurückgespielt wurde, ist nur eine Hoffnung.
// Aufruf:   node tools/restore-pruefen.js ARCHIV ZIELORDNER [VERGLEICHSORDNER]
//   prüft die Prüfsumme der Archivdatei (falls .sha256 daneben liegt), entschlüsselt (BACKUP_PASSPHRASE), prüft jede Datei gegen ihre
//   gespeicherte SHA-256-Summe, schreibt sie in ZIELORDNER und vergleicht optional mit VERGLEICHSORDNER (zum Beispiel dist).
//   Gibt die gemessene Dauer aus: das ist ein Messwert für die Wiederherstellungszeit (RTO), nicht das ganze RTO (Menschen, Hosting, DNS fehlen).
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { entschluesseln, auspacken, sammle } = require("./backup.js");

const [archiv, ziel, vergleich] = process.argv.slice(2);
if (!archiv || !ziel) { console.error("Aufruf: node tools/restore-pruefen.js ARCHIV ZIELORDNER [VERGLEICHSORDNER]"); process.exit(2); }
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const fehler = [];
const t0 = Date.now();
try {
  const buf = fs.readFileSync(archiv);
  if (fs.existsSync(`${archiv}.sha256`)) {
    const soll = fs.readFileSync(`${archiv}.sha256`, "utf8").split(/\s+/)[0];
    if (soll !== sha(buf)) throw new Error("Prüfsumme der Archivdatei stimmt nicht (Datei beschädigt oder verändert)");
    console.log("Prüfsumme der Archivdatei: ok");
  } else console.log("Hinweis: keine .sha256-Datei neben dem Archiv, Archivprüfsumme übersprungen");
  const verschluesselt = buf.subarray(0, 4).toString() === "SBK1";
  if (verschluesselt && !process.env.BACKUP_PASSPHRASE) throw new Error("Archiv ist verschlüsselt, BACKUP_PASSPHRASE ist nicht gesetzt");
  const eintraege = auspacken(verschluesselt ? entschluesseln(buf, process.env.BACKUP_PASSPHRASE) : buf);
  for (const e of eintraege) {
    if (sha(e.inhalt) !== e.sha256) { fehler.push(`Prüfsumme falsch: ${e.pfad}`); continue; }
    const z = path.join(ziel, e.pfad);
    if (!path.resolve(z).startsWith(path.resolve(ziel) + path.sep)) { fehler.push(`Unzulässiger Pfad im Archiv: ${e.pfad}`); continue; }
    fs.mkdirSync(path.dirname(z), { recursive: true });
    fs.writeFileSync(z, e.inhalt);
  }
  console.log(`${eintraege.length} Dateien wiederhergestellt nach ${ziel}`);
  if (vergleich) {
    const a = sammle(vergleich).sort(), b = sammle(ziel).sort();
    if (a.join("\n") !== b.join("\n")) fehler.push(`Dateiliste weicht ab (${a.length} im Vergleich, ${b.length} wiederhergestellt)`);
    else for (const p of a) if (sha(fs.readFileSync(path.join(vergleich, p))) !== sha(fs.readFileSync(path.join(ziel, p)))) fehler.push(`Inhalt weicht ab: ${p}`);
    if (!fehler.length) console.log(`Vergleich mit ${vergleich}: ${a.length} Dateien identisch`);
  }
} catch (e) { fehler.push(e.message); }
const ms = Date.now() - t0;
if (fehler.length) { fehler.forEach((f) => console.log("FEHLER   " + f)); console.log(`Wiederherstellung fehlgeschlagen (${ms} ms).`); process.exit(1); }
console.log(`Wiederherstellung erfolgreich in ${ms} ms.`);
