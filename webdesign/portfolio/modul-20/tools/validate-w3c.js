// Prüft die HTML-Seiten mit dem offiziellen W3C-Validator (Nu Html Checker, lokal als JAR).
// Aufruf:   node tools/validate-w3c.js [Ordner ...]      (Standard: dist, falls vorhanden, sonst die Seitenordner)
//           node tools/validate-w3c.js --streng           Warnungen zählen auch als Fehler
// Voraussetzung: Java (java -version) und `npm ci` (Paket vnu-jar).
//
// Hinweis zu den Warnungen "Resource violates Content Security Policy (meta tag)":
// Der Validator wertet die CSP aus <meta> aus, wenn er eine Datei (file:-Adresse) prüft. 'self' trifft auf file: nicht zu,
// deshalb meldet er für jede Datei CSS und JS als "blockiert". Das ist kein Fehler der Seite (im Browser unter http
// gibt es 0 CSP-Verstöße, siehe tools/server.js und Modul 18). Diese Hinweise werden gezählt, aber nicht ausgegeben.
"use strict";
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const streng = args.includes("--streng");
let ziele = args.filter((a) => !a.startsWith("--"));
const wurzel = path.resolve(__dirname, "..");
if (ziele.length === 0) {
  ziele = fs.existsSync(path.join(wurzel, "dist"))
    ? ["dist"]
    : fs
        .readdirSync(wurzel)
        .filter(
          (n) =>
            /\.html$/.test(n) ||
            (fs.statSync(path.join(wurzel, n)).isDirectory() &&
              !/^(node_modules|dist|css|js|img|media|data|docs|tests|tools|e2e|\..*)$/.test(n)),
        );
}

const jar = path.join(wurzel, "node_modules", "vnu-jar", "build", "dist", "vnu.jar");
if (!fs.existsSync(jar)) {
  console.error("vnu.jar fehlt. Zuerst 'npm ci' ausführen.");
  process.exit(2);
}
const r = spawnSync("java", ["-jar", jar, "--format", "json", "--skip-non-html", ...ziele], {
  cwd: wurzel,
  encoding: "utf8",
});
if (r.error) {
  console.error("Java konnte nicht gestartet werden:", r.error.message);
  process.exit(2);
}
// Der Validator schreibt das Ergebnis auf stderr; davor kann eine Zeile von JAVA_TOOL_OPTIONS stehen.
const text = (r.stderr + r.stdout)
  .split("\n")
  .filter((z) => z.trim().startsWith("{"))
  .join("\n");
let meldungen;
try {
  meldungen = JSON.parse(text).messages;
} catch {
  console.error("Ausgabe des Validators nicht lesbar:\n" + (r.stderr + r.stdout).slice(0, 500));
  process.exit(2);
}
const csp = (m) => /Content Security Policy/.test(m.message);
const fehler = meldungen.filter((m) => m.type === "error");
const warnungen = meldungen.filter((m) => m.type !== "error" && !csp(m));
const cspHinweise = meldungen.filter((m) => m.type !== "error" && csp(m));
const ort = (m) => `${path.relative(wurzel, (m.url || "").replace(/^file:/, ""))}:${m.lastLine ?? "?"}`;
for (const m of fehler) console.log(`FEHLER  ${ort(m)}  ${m.message}`);
for (const m of warnungen) console.log(`WARNUNG ${ort(m)}  ${m.message}`);
console.log(
  `W3C-Validator: ${fehler.length} Fehler, ${warnungen.length} Warnungen ` +
    `(dazu ${cspHinweise.length} CSP-Hinweise für file:-Adressen, nicht ausgegeben). Geprüft: ${ziele.join(", ")}`,
);
process.exit(fehler.length > 0 || (streng && warnungen.length > 0) ? 1 : 0);
