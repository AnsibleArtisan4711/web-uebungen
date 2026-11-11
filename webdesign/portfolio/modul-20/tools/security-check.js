// Einfache statische Sicherheitsprüfung der Seiten (keine Ersatz für einen echten Security-Test).
//   node tools/security-check.js [ordner]
// Prüft je HTML-Seite (außer experimente/): CSP per <meta>, Hashes für Inline-Skripte, Inline-Event-Handler,
// style-Attribute, javascript:-URLs, Fremd-Ressourcen (Mixed Content / Datenschutz), target=_blank ohne noopener,
// Formulare, Referrer-Meta, Links zu Impressum und Datenschutz. Dazu: gefährliche APIs in js/.
// Das Skript liest den Text mit regulären Ausdrücken, es versteht kein HTML wie ein Browser.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const wurzel = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const SKIP = new Set(["node_modules", "dist", "experimente", "tests", "tools", "docs", ".git"]);

function dateien(ordner, endung, liste = []) {
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) dateien(path.join(ordner, e.name), endung, liste); }
    else if (e.name.endsWith(endung)) liste.push(path.join(ordner, e.name));
  }
  return liste;
}

let probleme = 0;
const melde = (datei, text) => { probleme += 1; console.log(`PROBLEM  ${path.relative(wurzel, datei)}: ${text}`); };

for (const datei of dateien(wurzel, ".html")) {
  const html = fs.readFileSync(datei, "utf8");
  const csp = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i.exec(html);
  if (!csp) melde(datei, "keine Content-Security-Policy per <meta>");
  if (!/<meta\s+name="referrer"/i.test(html)) melde(datei, "kein Referrer-Policy-Meta");

  // Inline-Skripte (ohne src, nicht als Daten wie application/ld+json) brauchen einen Hash in der CSP
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/type="application\/ld\+json"/i.test(m[1])) continue;
    const hash = "sha256-" + crypto.createHash("sha256").update(m[2], "utf8").digest("base64");
    if (!csp || !csp[1].includes(`'${hash}'`)) melde(datei, `Inline-Skript ohne passenden Hash in der CSP (${hash})`);
  }
  if (/\son[a-z]+\s*=\s*["']/i.test(html)) melde(datei, "Inline-Event-Handler (onclick= o. ä.)");
  if (/<[a-z][^>]*\sstyle\s*=\s*["']/i.test(html)) melde(datei, "style-Attribut (wird von style-src 'self' blockiert)");
  if (/(?:href|src|action)\s*=\s*["']\s*javascript:/i.test(html)) melde(datei, "javascript:-URL");

  // Fremd-Ressourcen: Skripte, Stylesheets, Bilder, Frames mit http(s)://
  for (const m of html.matchAll(/<(script|link|img|iframe|source|video|audio|form)\b[^>]*?\b(?:src|href|action|srcset)\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>/gi)) {
    const rel = /\brel="(?:canonical|alternate)"/i.test(m[0]);
    if (m[1].toLowerCase() === "link" && rel) continue;
    if (/^http:\/\//i.test(m[2])) melde(datei, `unverschlüsselte Ressource (Mixed Content): ${m[2]}`);
    else melde(datei, `Ressource von fremdem Server: ${m[2]}`);
  }
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
    if (!/rel="[^"]*noopener/i.test(m[0])) melde(datei, 'target="_blank" ohne rel="noopener"');
  }
  for (const m of html.matchAll(/<form\b[^>]*>/gi)) {
    if (!/method="post"/i.test(m[0])) melde(datei, "Formular ohne method=\"post\"");
  }
  if (!/impressum\/index\.html/.test(html) || !/datenschutz\/index\.html/.test(html)) melde(datei, "Impressum oder Datenschutz nicht verlinkt");
}

const GEFAEHRLICH = [/\.innerHTML\s*=/, /\.outerHTML\s*=/, /insertAdjacentHTML\s*\(/, /document\.write\s*\(/, /\beval\s*\(/, /new\s+Function\s*\(/];
for (const datei of dateien(path.join(wurzel, "js"), ".js")) {
  const code = fs.readFileSync(datei, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  for (const muster of GEFAEHRLICH) if (muster.test(code)) melde(datei, `gefährliche API: ${muster}`);
}

console.log(probleme === 0 ? "\nKeine Probleme gefunden." : `\n${probleme} Problem(e) gefunden.`);
process.exit(probleme === 0 ? 0 : 1);
