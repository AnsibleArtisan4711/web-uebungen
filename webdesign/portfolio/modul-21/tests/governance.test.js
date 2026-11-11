// Automatisierte Regeln aus docs/governance.md (Übung 21.4): was nicht geprüft wird, wird mit der Zeit nicht eingehalten.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const quelle = path.join(__dirname, "..", "css", "src");
function dateien(ordner) {
  return fs.readdirSync(ordner, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? dateien(path.join(ordner, e.name)) : e.name.endsWith(".css") ? [path.join(ordner, e.name)] : []));
}
const alle = dateien(quelle);
// Kommentare entfernen, Zeilenzahl erhalten
const ohneKommentare = (t) => t.replace(/\/\*[\s\S]*?\*\//g, (k) => k.replace(/[^\n]/g, " "));
function treffer(muster, ausnahmen = []) {
  const funde = [];
  for (const d of alle) {
    const name = path.relative(quelle, d).split(path.sep).join("/");
    if (ausnahmen.includes(name)) continue;
    ohneKommentare(fs.readFileSync(d, "utf8")).split("\n").forEach((z, i) => { if (muster.test(z)) funde.push(`${name}:${i + 1}  ${z.trim()}`); });
  }
  return funde;
}

test("Regel 1: Farbwerte (#hex, rgb, hsl) stehen nur in 02-tokens.css", () => {
  assert.deepStrictEqual(treffer(/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(/, ["02-tokens.css"]), [], "Farben außerhalb der Tokens");
});
test("Regel 1 (Ausnahmen): 02-tokens.css enthält die Farben tatsächlich", () => {
  const t = fs.readFileSync(path.join(quelle, "02-tokens.css"), "utf8");
  assert.ok(/#[0-9a-fA-F]{6}/.test(t));
});
test("Regel 2: z-index nur über Token (var(--z-...))", () => {
  assert.deepStrictEqual(treffer(/z-index\s*:(?!\s*var\(--z-)/), []);
});
test("Regel 3: !important nur in Reset und reduzierter Bewegung", () => {
  assert.deepStrictEqual(treffer(/!important/, ["01-reset.css", "09-reduzierte-bewegung.css"]), []);
});
test("Regel 4: keine ID-Selektoren im CSS", () => {
  assert.deepStrictEqual(treffer(/^[^{}\n]*#[a-zA-Z_-][\w-]*[^{}\n]*\{/), []);
});
test("Regel 5: Medienabfragen mit Mindestbreite (Mobile first), keine max-width", () => {
  // Dokumentierte Ausnahme (docs/governance.md): filter.css reserviert Platz für schmale Bildschirme (CLS), Messwerte stehen im Kommentar dort.
  assert.deepStrictEqual(treffer(/@media[^{]*\bmax-width\s*:/, ["05-components/filter.css"]), []);
});
