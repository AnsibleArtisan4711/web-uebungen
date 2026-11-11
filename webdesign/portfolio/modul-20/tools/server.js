// Kleiner Testserver ohne Abhängigkeiten.   Start im Ordner modul-19:   node tools/server.js [Port] [Ordner]
// Ohne Ordner wird das Projekt selbst ausgeliefert, mit `dist` das Ergebnis von `npm run build`.
// Zweck: Antwort-Header (Caching, Kompression, Sicherheit) und Ladeverhalten lokal untersuchen.
//  - Sicherheits-Header: nosniff, Referrer-Policy, Permissions-Policy überall; Content-Security-Policy außer unter /experimente/
//    (HSTS fehlt absichtlich: Browser ignorieren ihn über http, er gehört nur auf HTTPS-Server)
//  - Testrouten: /echo-referer (zeigt den Referer-Header), /cookie-setzen und /cookie-lesen (HttpOnly-Cookie),
//    POST auf /kontakt/danke/ (serverseitige Validierung, Honeypot, Rate-Limit)
//  - Testhilfe ?csp=enforce oder ?csp=report-only an einer HTML-Adresse: setzt eine strenge Testrichtlinie als Header
//  - Kompression: Brotli oder gzip, je nach Accept-Encoding des Browsers (nur Text-Dateien)
//  - Caching: Dateien mit Hash im Namen (z. B. app.3fa9c1.js) bekommen "immutable", alles andere "no-cache" + ETag
//  - Testhilfe: Mit ?delay=1500 an einer beliebigen Adresse antwortet der Server verzögert (in Millisekunden)
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..", process.argv[3] || ".");
const port = Number(process.argv[2]) || 8080;
const TYPEN = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
  ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml", ".ico": "image/x-icon", ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg", ".vtt": "text/vtt" };
// Richtlinie für alle Seiten außerhalb von /experimente/. Dieselbe steht per <meta> in den Seiten (Übung 18.3).
const CSP_SEITEN = "default-src 'self'; script-src 'self' 'sha256-qOhFsq0QMV2REqNwk5hGH5bZE9SkX6gt6yeyKdYPv+U='; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
const CSP_TEST = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'";
const SICHER = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)" };

const maskiere = (t) => String(t).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[z]));
const versuche = new Map();   // Rate-Limit: Adresse -> Zeitstempel der letzten Versuche
function zuVieleVersuche(adresse) {
  const jetzt = Date.now();
  const liste = (versuche.get(adresse) || []).filter((t) => jetzt - t < 60000);
  liste.push(jetzt);
  versuche.set(adresse, liste);
  return liste.length > 5;
}

// Serverseitige Prüfung des Kontaktformulars. Gibt eine Liste von Fehlern zurück (leer = alles gültig).
function pruefeFormular(f) {
  const fehler = [];
  const name = (f.get("name") || "").trim(), mail = (f.get("mail") || "").trim(), text = (f.get("nachricht") || "").trim();
  if (!/^[\p{L}\p{M}' .-]{1,80}$/u.test(name)) fehler.push("name");
  if (mail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) fehler.push("mail");
  if (!["frage", "projekt", "sonstiges"].includes(f.get("betreff"))) fehler.push("betreff");
  if (text.length < 10 || text.length > 1000) fehler.push("nachricht");
  if (f.get("datenschutz") !== "ja") fehler.push("datenschutz");
  return fehler;
}

function formularAntwort(req, res) {
  const kopf = { ...SICHER, "Content-Type": TYPEN[".html"] };
  if (!String(req.headers["content-type"] || "").startsWith("application/x-www-form-urlencoded")) { res.writeHead(415, kopf).end("<h1>415</h1>"); return; }
  if (zuVieleVersuche(req.socket.remoteAddress)) { res.writeHead(429, { ...kopf, "Retry-After": "60" }).end("<h1>Zu viele Anfragen</h1>"); return; }
  let menge = 0; const teile = [];
  req.on("data", (d) => { menge += d.length; if (menge > 10 * 1024) { res.writeHead(413, kopf).end("<h1>413</h1>"); req.destroy(); } else teile.push(d); });
  req.on("end", () => {
    if (menge > 10 * 1024) return;
    const f = new URLSearchParams(Buffer.concat(teile).toString("utf8"));
    if ((f.get("website") || "") !== "") {      // Honeypot: ein Mensch füllt das versteckte Feld nicht aus
      res.writeHead(200, { ...kopf, "X-Verarbeitet": "nein" }).end("<h1>Danke</h1>"); return;
    }
    const fehler = pruefeFormular(f);
    if (fehler.length) { res.writeHead(400, kopf).end("<h1>Eingabe ungültig</h1><p>Prüfe: " + fehler.map(maskiere).join(", ") + "</p>"); return; }
    // Ausgabe wird kodiert (maskiere), nichts wird gespeichert
    res.writeHead(200, { ...kopf, "X-Verarbeitet": "ja" }).end("<!DOCTYPE html><meta charset=utf-8><title>Danke</title><h1>Danke, " + maskiere(f.get("name").trim()) + "!</h1>");
  });
}

const KOMPRIMIERBAR = new Set([".html", ".css", ".js", ".mjs", ".json", ".webmanifest", ".svg", ".txt", ".xml", ".vtt"]);

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "POST" && /^\/kontakt\/danke\/(index\.html)?$/.test(url.pathname)) { formularAntwort(req, res); return; }
  if (url.pathname === "/echo-referer") {
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" })
      .end(JSON.stringify({ referer: req.headers.referer || null })); return;
  }
  if (url.pathname === "/cookie-setzen") {
    res.writeHead(200, { "Set-Cookie": ["sitzung=geheim123; Path=/; HttpOnly; SameSite=Lax", "anzeige=hell; Path=/; SameSite=Lax"], "Content-Type": "text/plain", "Cache-Control": "no-store" }).end("gesetzt"); return;
  }
  if (url.pathname === "/cookie-lesen") {
    res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" }).end(req.headers.cookie || ""); return;
  }
  let datei = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
  if (!datei.startsWith(root)) { res.writeHead(403, { ...SICHER, "Content-Type": "text/plain; charset=utf-8" }).end("Verboten"); return; }
  if (fs.existsSync(datei) && fs.statSync(datei).isDirectory()) datei = path.join(datei, "index.html");
  const senden = () => {
    if (!fs.existsSync(datei)) {   // Auch Fehlerseiten tragen die Sicherheits-Header (Übung 19.6 hat das gefunden)
      const seite404 = path.join(root, "404.html");
      res.writeHead(404, { ...SICHER, "Content-Security-Policy": CSP_SEITEN, "Content-Type": TYPEN[".html"] })
        .end(fs.existsSync(seite404) ? fs.readFileSync(seite404) : "<h1>404</h1>");
      return;
    }
    const ext = path.extname(datei).toLowerCase();
    let body = fs.readFileSync(datei);
    const etag = '"' + crypto.createHash("sha1").update(body).digest("hex").slice(0, 16) + '"';
    const mitHash = /[.-][0-9a-f]{6,}\.[a-z0-9]+$/i.test(path.basename(datei));
    const kopf = { "Content-Type": TYPEN[ext] || "application/octet-stream", ETag: etag, Vary: "Accept-Encoding",
      "Cache-Control": mitHash ? "public, max-age=31536000, immutable" : "no-cache", ...SICHER };
    if (ext === ".html") {
      const modus = url.searchParams.get("csp");
      if (modus === "enforce") kopf["Content-Security-Policy"] = CSP_TEST;
      else if (modus === "report-only") kopf["Content-Security-Policy-Report-Only"] = CSP_TEST;
      else if (!url.pathname.startsWith("/experimente/")) kopf["Content-Security-Policy"] = CSP_SEITEN;
    }
    if (req.headers["if-none-match"] === etag) { res.writeHead(304, kopf).end(); return; }
    const ae = String(req.headers["accept-encoding"] || "");
    if (KOMPRIMIERBAR.has(ext)) {
      if (ae.includes("br")) { body = zlib.brotliCompressSync(body); kopf["Content-Encoding"] = "br"; }
      else if (ae.includes("gzip")) { body = zlib.gzipSync(body); kopf["Content-Encoding"] = "gzip"; }
    }
    kopf["Content-Length"] = body.length;
    res.writeHead(200, kopf).end(body);
  };
  const delay = Number(url.searchParams.get("delay")) || 0;
  delay ? setTimeout(senden, delay) : senden();
}).listen(port, () => console.log(`http://localhost:${port}/  (Strg+C beendet)`));
