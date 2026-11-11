// Baut css/main.css aus den Quelldateien in css/src/.
//   node tools/css-bauen.js            schreibt css/main.css
//   node tools/css-bauen.js --pruefen  schreibt nichts, endet mit Fehler, wenn css/main.css veraltet ist
//
// Jede Gruppe wird in einen @layer eingepackt. Die Reihenfolge der Gruppen entspricht dem ITCSS-Dreieck:
// weit reichend und unspezifisch zuerst, spezifisch und überschreibend zuletzt.
// Innerhalb der Gruppe "components" gilt die alphabetische Reihenfolge der Dateien.
const fs = require("fs");
const path = require("path");

const QUELLE = path.join(__dirname, "..", "css", "src");
const ZIEL = path.join(__dirname, "..", "css", "main.css");

const GRUPPEN = [
  ["reset",      ["01-reset.css"]],
  ["tokens",     ["02-tokens.css"]],
  ["base",       ["03-base.css"]],
  ["objects",    ["04-objects.css"]],
  ["components", fs.readdirSync(path.join(QUELLE, "05-components")).filter((d) => d.endsWith(".css")).sort().map((d) => "05-components/" + d)],
  ["utilities",  ["06-utilities.css", "07-kontrast.css", "08-druck.css", "09-reduzierte-bewegung.css"]],
];

function einruecken(text) {
  return text.split("\n").map((z) => (z.trim() === "" ? "" : "  " + z)).join("\n");
}

let ausgabe = "/* GENERIERT von tools/css-bauen.js – nicht von Hand ändern. Quelle: css/src/ */\n";
ausgabe += fs.readFileSync(path.join(QUELLE, "00-layers.css"), "utf8").trim() + "\n";
for (const [name, dateien] of GRUPPEN) {
  ausgabe += `\n@layer ${name} {\n`;
  ausgabe += dateien
    .map((d) => `  /* --- ${d} --- */\n` + einruecken(fs.readFileSync(path.join(QUELLE, d), "utf8").trim()))
    .join("\n\n");
  ausgabe += "\n}\n";
}

if (process.argv.includes("--pruefen")) {
  const aktuell = fs.existsSync(ZIEL) ? fs.readFileSync(ZIEL, "utf8") : "";
  if (aktuell !== ausgabe) {
    console.error("css/main.css ist veraltet. Bitte `node tools/css-bauen.js` ausführen.");
    process.exit(1);
  }
  console.log("css/main.css ist aktuell.");
} else {
  fs.writeFileSync(ZIEL, ausgabe);
  console.log(`css/main.css geschrieben (${Buffer.byteLength(ausgabe)} Byte aus ${GRUPPEN.reduce((n, g) => n + g[1].length, 1)} Dateien).`);
}
