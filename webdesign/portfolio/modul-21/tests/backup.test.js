const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { packen, verschluesseln, entschluesseln, auspacken } = require("../tools/backup.js");

function mitBeispielordner(fn) {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), "bk-"));
  fs.mkdirSync(path.join(ordner, "unter"));
  fs.writeFileSync(path.join(ordner, "index.html"), "<h1>Hallo</h1>");
  fs.writeFileSync(path.join(ordner, "unter", "daten.txt"), "Umlaute: äöüß");
  try { return fn(ordner); } finally { fs.rmSync(ordner, { recursive: true, force: true }); }
}

test("packen und auspacken: gleiche Dateien, gleiche Inhalte", () => mitBeispielordner((o) => {
  const e = auspacken(packen(o).roh);
  assert.deepStrictEqual(e.map((x) => x.pfad), ["index.html", "unter/daten.txt"]);
  assert.strictEqual(e[1].inhalt.toString(), "Umlaute: äöüß");
}));
test("verschlüsseln und entschlüsseln: mit richtigem Passwort identisch", () => mitBeispielordner((o) => {
  const { roh } = packen(o);
  assert.ok(entschluesseln(verschluesseln(roh, "geheim"), "geheim").equals(roh));
}));
test("falsches Passwort wird erkannt", () => mitBeispielordner((o) => {
  const chiffre = verschluesseln(packen(o).roh, "geheim");
  assert.throws(() => entschluesseln(chiffre, "falsch"), /falsches Passwort/);
}));
test("verändertes Archiv wird erkannt (AES-GCM prüft die Echtheit)", () => mitBeispielordner((o) => {
  const chiffre = Buffer.from(verschluesseln(packen(o).roh, "geheim"));
  chiffre[40] ^= 1;
  assert.throws(() => entschluesseln(chiffre, "geheim"), /falsches Passwort oder Archiv verändert/);
}));
test("zwei Verschlüsselungen derselben Daten unterscheiden sich (Zufalls-Salz und -IV)", () => mitBeispielordner((o) => {
  const { roh } = packen(o);
  assert.ok(!verschluesseln(roh, "geheim").equals(verschluesseln(roh, "geheim")));
}));
