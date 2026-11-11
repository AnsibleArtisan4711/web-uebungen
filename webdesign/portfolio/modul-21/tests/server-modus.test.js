// Prüft die zwei Betriebsmodi des Testservers: Umleitungen (Übung 21.2) und Wartungsmodus (Übung 21.6).
const test = require("node:test");
const assert = require("node:assert");
const { spawn } = require("node:child_process");
const path = require("node:path");

const wurzel = path.join(__dirname, "..");
function startServer(port, env) {
  const kind = spawn(process.execPath, ["tools/server.js", String(port), "."], { cwd: wurzel, env: { ...process.env, ...env } });
  return new Promise((ok, fail) => {
    kind.stdout.on("data", () => ok(kind));
    kind.on("error", fail);
  });
}
const hole = (port, pfad) => fetch(`http://localhost:${port}${pfad}`, { redirect: "manual" });

test("Umleitungsmodus: 301 mit Location, 410 ohne Ziel, unbekannt bleibt 404", async () => {
  const s = await startServer(8151, { UMLEITUNGEN: "docs/relaunch/url-mapping.csv" });
  try {
    const a = await hole(8151, "/index.php?id=2");
    assert.strictEqual(a.status, 301);
    assert.strictEqual(new URL(a.headers.get("location"), "http://localhost:8151").pathname, "/lebenslauf/");
    const b = await hole(8151, "/downloads/lebenslauf.pdf");
    assert.strictEqual(b.status, 410);
    assert.strictEqual(b.headers.get("location"), null);
    assert.strictEqual((await hole(8151, "/gibt-es-nicht")).status, 404);
  } finally { s.kill(); }
});

test("Wartungsmodus: jede Adresse antwortet 503 mit Retry-After und ohne Zwischenspeicherung", async () => {
  const s = await startServer(8152, { WARTUNG: "1" });
  try {
    for (const pfad of ["/", "/projekte/", "/gibt-es-nicht"]) {
      const r = await hole(8152, pfad);
      assert.strictEqual(r.status, 503, pfad);
      assert.strictEqual(r.headers.get("retry-after"), "3600");
      assert.strictEqual(r.headers.get("cache-control"), "no-store");
      assert.match(await r.text(), /Wartungsarbeiten/);
    }
  } finally { s.kill(); }
});
