// Tests für die CSS-Architektur: Build aktuell, keine IDs, !important nur an erlaubten Stellen.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const WURZEL = path.join(__dirname, "..");
const QUELLE = path.join(WURZEL, "css", "src");

function alleCssDateien(ordner) {
  return fs.readdirSync(ordner, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? alleCssDateien(path.join(ordner, e.name)) : e.name.endsWith(".css") ? [path.join(ordner, e.name)] : []);
}
// Kommentare entfernen, damit Text in Kommentaren nichts auslöst
const ohneKommentare = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "");

test("css/main.css ist aus css/src/ gebaut und aktuell", () => {
  const r = spawnSync(process.execPath, [path.join(WURZEL, "tools", "css-bauen.js"), "--pruefen"], { encoding: "utf8" });
  assert.strictEqual(r.status, 0, r.stderr);
});

test("keine ID-Selektoren im CSS", () => {
  for (const datei of alleCssDateien(QUELLE)) {
    // Farbwerte (#fff) stehen in Deklarationen, IDs vor einer öffnenden Klammer: Selektorteil = Text vor "{"
    const selektoren = ohneKommentare(fs.readFileSync(datei, "utf8")).split("{").slice(0, -1).map((t) => t.split(/[};]/).pop());
    for (const s of selektoren) assert.ok(!/#[A-Za-z_-]/.test(s), `${path.basename(datei)}: ID-Selektor in "${s.trim()}"`);
  }
});

test("!important nur im Reset und in der Reduced-Motion-Notbremse", () => {
  const erlaubt = new Set(["01-reset.css", "09-reduzierte-bewegung.css"]);
  for (const datei of alleCssDateien(QUELLE)) {
    const hat = /!important/.test(ohneKommentare(fs.readFileSync(datei, "utf8")));
    if (hat) assert.ok(erlaubt.has(path.basename(datei)), `${path.basename(datei)} enthält !important`);
  }
});
