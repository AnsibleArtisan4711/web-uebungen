// Kleiner Testserver ohne Abhängigkeiten.   Start im Ordner modul-16:   node tools/server.js [Port]
// Zweck: Antwort-Header (Caching, Kompression) und Ladeverhalten lokal untersuchen.
//  - Kompression: Brotli oder gzip, je nach Accept-Encoding des Browsers (nur Text-Dateien)
//  - Caching: Dateien mit Hash im Namen (z. B. app.3fa9c1.js) bekommen "immutable", alles andere "no-cache" + ETag
//  - Testhilfe: Mit ?delay=1500 an einer beliebigen Adresse antwortet der Server verzögert (in Millisekunden)
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
const port = Number(process.argv[2]) || 8080;
const TYPEN = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
  ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml", ".ico": "image/x-icon", ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg", ".vtt": "text/vtt" };
const KOMPRIMIERBAR = new Set([".html", ".css", ".js", ".mjs", ".json", ".webmanifest", ".svg", ".txt", ".xml", ".vtt"]);

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let datei = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
  if (!datei.startsWith(root)) { res.writeHead(403).end("Verboten"); return; }
  if (fs.existsSync(datei) && fs.statSync(datei).isDirectory()) datei = path.join(datei, "index.html");
  const senden = () => {
    if (!fs.existsSync(datei)) { res.writeHead(404, { "Content-Type": TYPEN[".html"] }).end("<h1>404</h1>"); return; }
    const ext = path.extname(datei).toLowerCase();
    let body = fs.readFileSync(datei);
    const etag = '"' + crypto.createHash("sha1").update(body).digest("hex").slice(0, 16) + '"';
    const mitHash = /[.-][0-9a-f]{6,}\.[a-z0-9]+$/i.test(path.basename(datei));
    const kopf = { "Content-Type": TYPEN[ext] || "application/octet-stream", ETag: etag, Vary: "Accept-Encoding",
      "Cache-Control": mitHash ? "public, max-age=31536000, immutable" : "no-cache" };
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
