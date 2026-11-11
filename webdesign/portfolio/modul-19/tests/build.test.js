// Prüft den Build (tools/dist-bauen.js): Verweise stimmen, Source Maps sind in Ordnung, der Build ist reproduzierbar.
// Der Test baut nach dist/; das ist ein Build-Ergebnis und steht in .gitignore.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const wurzel = path.join(__dirname, "..");
const dist = path.join(wurzel, "dist");
const bauen = () => execFileSync("node", [path.join(wurzel, "tools", "dist-bauen.js")], { cwd: wurzel, encoding: "utf8" });
const dateien = (ordner) => fs.readdirSync(ordner, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? dateien(path.join(ordner, e.name)) : [path.join(ordner, e.name)]);
const pruefsumme = () => crypto.createHash("sha256")
  .update(dateien(dist).sort().map((f) => path.relative(dist, f) + fs.readFileSync(f).toString("base64")).join("\n")).digest("hex");

test("Build ist reproduzierbar: zweimal bauen ergibt dieselben Dateien", () => {
  bauen();
  const erste = pruefsumme();
  bauen();
  assert.equal(pruefsumme(), erste);
});

test("jede gebaute CSS-Datei hat genau eine Source-Map-Angabe, und die Map-Datei existiert", () => {
  bauen();
  for (const f of dateien(path.join(dist, "css")).filter((d) => d.endsWith(".css"))) {
    const text = fs.readFileSync(f, "utf8");
    const treffer = text.match(/sourceMappingURL=([^\s*]+)/g) || [];
    assert.equal(treffer.length, 1, `${path.basename(f)}: ${treffer.length} Angaben`);
    assert.ok(fs.existsSync(path.join(path.dirname(f), treffer[0].split("=")[1])));
  }
});

test("alle Seiten verweisen auf vorhandene CSS- und JS-Dateien mit Hash im Namen", () => {
  bauen();
  for (const seite of dateien(dist).filter((d) => d.endsWith(".html"))) {
    const html = fs.readFileSync(seite, "utf8");
    for (const m of html.matchAll(/(?:href|src)="([^"]*\b(?:css|js)\/[^"]+\.(?:css|js))"/g)) {
      assert.match(m[1], /\.[0-9a-f]{8}\.(css|js)$/, `${path.relative(dist, seite)}: ${m[1]} ohne Hash`);
      assert.ok(fs.existsSync(path.resolve(path.dirname(seite), m[1])), `${path.relative(dist, seite)}: ${m[1]} fehlt`);
    }
  }
});

test("dist enthält weder Werkzeuge noch Tests noch Experimente", () => {
  bauen();
  for (const verboten of ["tools", "tests", "experimente", "docs", "node_modules", "package.json"]) {
    assert.ok(!fs.existsSync(path.join(dist, verboten)), `${verboten} liegt in dist/`);
  }
});
