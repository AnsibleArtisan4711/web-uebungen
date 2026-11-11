// Einfacher Verfügbarkeits-Check für eine Adresse (Übung 19.6).
//   node tools/gesundheitscheck.js http://localhost:8080/
//   node tools/gesundheitscheck.js https://beispiel.at/ --tage 21
// Prüft: Statuscode 200, Antwortzeit, die Sicherheits-Header aus Modul 18 und bei https die Restlaufzeit des Zertifikats.
// Endet mit Code 1, wenn etwas nicht stimmt. So lässt sich der Check in einen Zeitplan (cron, GitHub Actions) einhängen.
// Grenzen: Ein einzelner Aufruf von einem einzigen Ort. Ein echter Überwachungsdienst prüft regelmäßig, von mehreren Orten, und alarmiert.
const tls = require("node:tls");

const adresse = process.argv[2];
if (!adresse) { console.error("Aufruf: node tools/gesundheitscheck.js ADRESSE [--tage N]"); process.exit(2); }
const minTage = Number(process.argv[process.argv.indexOf("--tage") + 1]) || 14;
const ERWARTET = ["content-security-policy", "x-content-type-options", "referrer-policy", "permissions-policy"];
const probleme = [];

function zertifikat(host, port) {
  return new Promise((ok, fehler) => {
    const s = tls.connect({ host, port, servername: host }, () => {
      const z = s.getPeerCertificate();
      s.end();
      ok(Math.floor((new Date(z.valid_to) - Date.now()) / 86400000));
    });
    s.on("error", fehler);
  });
}

(async () => {
  const url = new URL(adresse);
  const start = performance.now();
  let antwort;
  try { antwort = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10000) }); }
  catch (f) { console.log(`FEHLER   nicht erreichbar: ${f.cause?.code || f.cause?.message || f.message}`); process.exit(1); }
  const ms = Math.round(performance.now() - start);
  console.log(`${antwort.status === 200 ? "OK      " : "FEHLER  "} Status ${antwort.status} in ${ms} ms`);
  if (antwort.status !== 200) probleme.push("Status");
  for (const h of ERWARTET) {
    const da = antwort.headers.has(h);
    console.log(`${da ? "OK      " : "FEHLT   "} ${h}`);
    if (!da) probleme.push(h);
  }
  if (url.protocol === "https:") {
    try {
      const tage = await zertifikat(url.hostname, Number(url.port) || 443);
      console.log(`${tage >= minTage ? "OK      " : "WARNUNG "} Zertifikat läuft in ${tage} Tagen ab (Grenze: ${minTage})`);
      if (tage < minTage) probleme.push("Zertifikat");
    } catch (f) { console.log(`FEHLER   TLS: ${f.code || f.message}`); probleme.push("TLS"); }
  } else console.log("HINWEIS  kein https: Zertifikat nicht geprüft");
  console.log(probleme.length ? `\n${probleme.length} Problem(e): ${probleme.join(", ")}` : "\nAlles in Ordnung.");
  process.exit(probleme.length ? 1 : 0);
})();
