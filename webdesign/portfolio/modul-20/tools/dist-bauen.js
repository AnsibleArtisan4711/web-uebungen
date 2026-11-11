// Baut die auslieferbare Fassung der Seite nach dist/ (Übung 19.2 und 19.5).
//   node tools/dist-bauen.js
// Schritte: dist/ leeren, Seiten und Dateien kopieren, CSS mit PostCSS (Autoprefixer, cssnano) verkleinern,
// JavaScript mit esbuild verkleinern, Dateien mit Inhalts-Hash im Namen versehen und die Verweise in den HTML-Seiten anpassen.
// Der Build ist reproduzierbar: gleiche Eingabe ergibt gleiche Ausgabe (keine Zeitstempel).
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const crypto = require("node:crypto");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const esbuild = require("esbuild");

const wurzel = path.resolve(__dirname, "..");
const ziel = path.join(wurzel, "dist");
// Alles, was nicht zur Seite gehört, bleibt draußen.
const AUSSCHLUSS = new Set(["node_modules", "dist", "experimente", "docs", "tests", "tools", ".git", "css", "js"]);
const AUSSCHLUSS_DATEIEN = new Set(["package.json", "package-lock.json", "README.md", "eslint.config.js", ".stylelintrc.json", ".prettierrc.json", ".prettierignore"]);

const hash = (inhalt) => crypto.createHash("sha256").update(inhalt).digest("hex").slice(0, 8);
const gz = (b) => zlib.gzipSync(b, { level: 9 }).length;
const br = (b) => zlib.brotliCompressSync(b, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;

function kopiere(von, nach) {
  fs.mkdirSync(nach, { recursive: true });
  for (const e of fs.readdirSync(von, { withFileTypes: true })) {
    if (AUSSCHLUSS.has(e.name) || AUSSCHLUSS_DATEIEN.has(e.name) || (e.name.startsWith(".") && von === wurzel)) continue;
    const a = path.join(von, e.name), b = path.join(nach, e.name);
    if (e.isDirectory()) kopiere(a, b); else fs.copyFileSync(a, b);
  }
}
function htmlDateien(ordner) {
  return fs.readdirSync(ordner, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? htmlDateien(path.join(ordner, e.name)) : e.name.endsWith(".html") ? [path.join(ordner, e.name)] : []);
}

(async () => {
  fs.rmSync(ziel, { recursive: true, force: true });
  kopiere(wurzel, ziel);

  const tabelle = [];
  const ersetzungen = {};   // "css/main.css" -> "css/main.1a2b3c4d.css"

  // CSS: PostCSS mit Autoprefixer (Browserliste aus package.json) und cssnano
  const cssQuelle = fs.readFileSync(path.join(wurzel, "css", "main.css"), "utf8");
  const css = await postcss([autoprefixer, cssnano({ preset: "default" })]).process(cssQuelle, { from: "css/main.css", to: "css/main.min.css", map: { inline: false, annotation: false } });
  const cssName = `main.${hash(css.css)}.css`;
  fs.mkdirSync(path.join(ziel, "css"), { recursive: true });
  fs.writeFileSync(path.join(ziel, "css", cssName), css.css + `\n/*# sourceMappingURL=${cssName}.map */\n`);
  fs.writeFileSync(path.join(ziel, "css", cssName + ".map"), css.map.toString());
  ersetzungen["css/main.css"] = "css/" + cssName;
  tabelle.push(["css/main.css", Buffer.byteLength(cssQuelle), Buffer.byteLength(css.css), gz(css.css), br(css.css)]);

  // JavaScript: esbuild verkleinert jede Datei einzeln (die Skripte sind klassische Skripte, keine Module)
  fs.mkdirSync(path.join(ziel, "js"), { recursive: true });
  for (const datei of ["logik.js", "main.js"]) {
    const quelle = fs.readFileSync(path.join(wurzel, "js", datei), "utf8");
    const aus = await esbuild.transform(quelle, { minify: true, target: "es2020", legalComments: "none" });
    const name = datei.replace(/\.js$/, `.${hash(aus.code)}.js`);
    fs.writeFileSync(path.join(ziel, "js", name), aus.code);
    ersetzungen["js/" + datei] = "js/" + name;
    tabelle.push(["js/" + datei, Buffer.byteLength(quelle), Buffer.byteLength(aus.code), gz(aus.code), br(aus.code)]);
  }

  // Verweise in den Seiten anpassen: href="../css/main.css" -> href="../css/main.1a2b3c4d.css"
  let angepasst = 0;
  for (const seite of htmlDateien(ziel)) {
    const h = fs.readFileSync(seite, "utf8");
    const neu = h.replace(/((?:href|src)=")((?:\.\.\/)*)((?:css|js)\/[a-z]+\.(?:css|js))(")/g,
      (m, a, pfad, datei, z) => ersetzungen[datei] ? a + pfad + ersetzungen[datei] + z : m);
    if (neu !== h) { fs.writeFileSync(seite, neu); angepasst++; }
  }

  console.log("Datei".padEnd(16) + "roh".padStart(8) + "minimiert".padStart(11) + "gzip".padStart(8) + "brotli".padStart(8));
  for (const [n, r, m, g, b] of tabelle) console.log(n.padEnd(16) + String(r).padStart(8) + String(m).padStart(11) + String(g).padStart(8) + String(b).padStart(8));
  console.log(`\n${angepasst} Seiten angepasst. Ergebnis: dist/ (CSS: ${ersetzungen["css/main.css"]})`);
})().catch((f) => { console.error(f); process.exit(1); });
