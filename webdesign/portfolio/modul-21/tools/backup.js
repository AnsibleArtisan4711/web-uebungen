// Sicherung einer statischen Seite (Übung 21.6): ein Archiv mit Prüfsummen, optional verschlüsselt.
// Aufruf:   node tools/backup.js [QUELLE] [ZIEL]       Standard: QUELLE=dist, ZIEL=backups
// Passwort:  Umgebungsvariable BACKUP_PASSPHRASE (nie als Argument, sonst steht es im Verlauf der Shell).
//            Ohne Passwort entsteht ein unverschlüsseltes Archiv und eine Warnung.
// Format (keine Fremdprogramme nötig, läuft unter Windows, macOS, Linux gleich):
//   Klartext = gzip( 4 Byte Länge L, L Byte JSON-Verzeichnis [{pfad, groesse, sha256}], danach die Dateiinhalte hintereinander )
//   Verschlüsselt = "SBK1" + 16 Byte Salz + 12 Byte IV + AES-256-GCM(Klartext) + 16 Byte Tag, Schlüssel per scrypt aus dem Passwort
// Daneben liegt <name>.sha256 mit der Prüfsumme der Archivdatei (Transport- und Ablagekontrolle).
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const crypto = require("node:crypto");

const MAGIE = Buffer.from("SBK1");

function sammle(wurzel, rel = "") {
  return fs.readdirSync(path.join(wurzel, rel), { withFileTypes: true }).flatMap((e) => {
    const r = rel ? `${rel}/${e.name}` : e.name;
    return e.isDirectory() ? sammle(wurzel, r) : [r];
  });
}
const schluessel = (pass, salz) => crypto.scryptSync(pass, salz, 32);

function packen(quelle) {
  const dateien = sammle(quelle).sort();
  const daten = dateien.map((p) => fs.readFileSync(path.join(quelle, p)));
  const verzeichnis = dateien.map((p, i) => ({ pfad: p, groesse: daten[i].length, sha256: crypto.createHash("sha256").update(daten[i]).digest("hex") }));
  const kopf = Buffer.from(JSON.stringify(verzeichnis));
  const laenge = Buffer.alloc(4); laenge.writeUInt32BE(kopf.length);
  return { roh: zlib.gzipSync(Buffer.concat([laenge, kopf, ...daten])), anzahl: dateien.length };
}
function verschluesseln(roh, pass) {
  const salz = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", schluessel(pass, salz), iv);
  const chiffre = Buffer.concat([c.update(roh), c.final()]);
  return Buffer.concat([MAGIE, salz, iv, chiffre, c.getAuthTag()]);
}
function entschluesseln(buf, pass) {
  if (!buf.subarray(0, 4).equals(MAGIE)) throw new Error("Kein verschlüsseltes Archiv (Kennung SBK1 fehlt)");
  const salz = buf.subarray(4, 20), iv = buf.subarray(20, 32), tag = buf.subarray(buf.length - 16), chiffre = buf.subarray(32, buf.length - 16);
  const d = crypto.createDecipheriv("aes-256-gcm", schluessel(pass, salz), iv);
  d.setAuthTag(tag);
  try { return Buffer.concat([d.update(chiffre), d.final()]); }
  catch { throw new Error("Entschlüsselung fehlgeschlagen: falsches Passwort oder Archiv verändert"); }
}
function auspacken(roh) {
  const klar = zlib.gunzipSync(roh);
  const l = klar.readUInt32BE(0);
  const verzeichnis = JSON.parse(klar.subarray(4, 4 + l).toString());
  let pos = 4 + l;
  return verzeichnis.map((e) => { const inhalt = klar.subarray(pos, pos + e.groesse); pos += e.groesse; return { ...e, inhalt }; });
}

module.exports = { packen, verschluesseln, entschluesseln, auspacken, sammle };

if (require.main === module) {
  const quelle = path.resolve(process.argv[2] || "dist");
  const ziel = path.resolve(process.argv[3] || "backups");
  if (!fs.existsSync(quelle)) { console.error(`Quelle ${quelle} existiert nicht (zuerst npm run build?)`); process.exit(2); }
  const pass = process.env.BACKUP_PASSPHRASE;
  const t0 = Date.now();
  const { roh, anzahl } = packen(quelle);
  const ausgabe = pass ? verschluesseln(roh, pass) : roh;
  fs.mkdirSync(ziel, { recursive: true });
  const stempel = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
  const name = path.join(ziel, `sicherung-${stempel}${pass ? ".sbk" : ".unverschluesselt.sbk"}`);
  fs.writeFileSync(name, ausgabe);
  const pruef = crypto.createHash("sha256").update(ausgabe).digest("hex");
  fs.writeFileSync(`${name}.sha256`, `${pruef}  ${path.basename(name)}\n`);
  console.log(`${anzahl} Dateien -> ${path.relative(process.cwd(), name)} (${ausgabe.length} Byte, ${pass ? "verschlüsselt mit AES-256-GCM" : "UNVERSCHLÜSSELT, BACKUP_PASSPHRASE nicht gesetzt"}), ${Date.now() - t0} ms`);
  console.log(`SHA-256 ${pruef}`);
}
