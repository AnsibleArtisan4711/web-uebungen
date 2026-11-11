const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { berechne, stundenVon } = require("../tools/kosten.js");

const lade = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "kosten", n), "utf8"));

test("Praxisbeispiel Firmenwebsite aus dem Lehrplan: 148 h, 22,2 h PM, 170,2 h, 15.318 €", () => {
  const e = berechne(lade("firmenwebsite.json"));
  assert.strictEqual(e.ohnePm, 148);
  assert.strictEqual(e.pmStunden, 22.2);
  assert.strictEqual(e.gesamt, 170.2);
  assert.strictEqual(e.eurCentGesamt, 1531800);
});

test("Aufgabe 1: 120 h, 85 €/h, 15 % PM, 10 % Puffer ergibt 12.903 €", () => {
  const e = berechne(lade("aufgabe-1.json"));
  assert.strictEqual(e.mitPm, 138);
  assert.strictEqual(e.gesamt, 151.8);
  assert.strictEqual(e.eurCentGesamt, 1290300);
});

test("Dreipunktschätzung: (o + 4w + p) / 6", () => {
  assert.strictEqual(stundenVon({ name: "x", o: 8, w: 10, p: 18 }), 11);
  assert.strictEqual(stundenVon({ name: "y", stunden: 5 }), 5);
});

test("Dreipunktbeispiel rundet ohne Gleitkommafehler: 156 h, 179,4 h, 16.146 €", () => {
  const e = berechne(lade("beispiel-dreipunkt.json"));
  assert.strictEqual(e.ohnePm, 156);
  assert.strictEqual(e.mitPm, 179.4);
  assert.strictEqual(e.eurCentMitPm, 1614600);
});

test("ungültige Eingaben werden abgelehnt", () => {
  assert.throws(() => berechne({ satz: 0, pakete: [] }), /satz/);
  assert.throws(() => stundenVon({ name: "z" }), /entweder/);
});
