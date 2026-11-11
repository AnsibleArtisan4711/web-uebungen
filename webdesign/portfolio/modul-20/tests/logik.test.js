// Ausführen im Ordner modul-12:  node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../js/logik.js");

test("normalisiere entfernt Akzente und Großschreibung", () => {
  assert.equal(L.normalisiere("  Gerät É "), "gerat e");
});

test("passtZuSuche: leere Suche passt immer", () => {
  assert.equal(L.passtZuSuche("irgendein Text", ""), true);
  assert.equal(L.passtZuSuche("irgendein Text", "   "), true);
});

test("passtZuSuche: findet unabhängig von Groß-/Kleinschreibung und Umlauten", () => {
  assert.equal(L.passtZuSuche("Flexbox und Grid", "FLEX"), true);
  assert.equal(L.passtZuSuche("Gerätetest", "gerate"), true);
  assert.equal(L.passtZuSuche("Flexbox", "grid"), false);
});

test("passtZuKategorie", () => {
  assert.equal(L.passtZuKategorie(["Webdesign"], "alle"), true);
  assert.equal(L.passtZuKategorie(["Webdesign"], "Webdesign"), true);
  assert.equal(L.passtZuKategorie(["Webdesign"], "Netzwerktechnik"), false);
  assert.equal(L.passtZuKategorie([], "Webdesign"), false);
});

test("leseKategorien", () => {
  assert.deepEqual(L.leseKategorien("Webdesign, Netzwerktechnik"), ["Webdesign", "Netzwerktechnik"]);
  assert.deepEqual(L.leseKategorien(""), []);
  assert.deepEqual(L.leseKategorien(null), []);
  assert.deepEqual(L.leseKategorien("a,, b ,"), ["a", "b"]);
});

test("statusText", () => {
  assert.equal(L.statusText(2, 3, "Projekten"), "2 von 3 Projekten angezeigt");
});
