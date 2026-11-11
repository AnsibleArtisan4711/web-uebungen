// Empfänger für das Experiment css-exfiltration.html (Übung 21.5): zeichnet auf, welche Anfragen ankommen.
// Start:  node experimente/leak-empfaenger.js [Port]      Standard 8140. Hört nur auf localhost.
"use strict";
const http = require("node:http");
const port = Number(process.argv[2]) || 8140;
http.createServer((req, res) => {
  console.log(new Date().toISOString().slice(11, 19), req.method, req.url);
  res.writeHead(204).end();
}).listen(port, "127.0.0.1", () => console.log(`Empfänger wartet auf http://localhost:${port}/ (Strg+C beendet)`));
