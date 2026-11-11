// Sendet Anfragen mit verschiedenen Referrer-Policies und zeigt, welchen Referer der Server sieht.
const policies = ["no-referrer", "origin", "same-origin", "strict-origin-when-cross-origin", "unsafe-url"];
document.getElementById("adresse").textContent = location.href;
const eigener = location.origin + "/echo-referer";
const fremd = location.protocol + "//" + (location.hostname === "localhost" ? "127.0.0.1" : "localhost") + ":" + location.port + "/echo-referer";
const holen = async (url, referrerPolicy) => (await (await fetch(url, { referrerPolicy, cache: "no-store" })).json()).referer;
(async () => {
  const ergebnis = [];
  for (const p of policies) ergebnis.push({ policy: p, gleich: await holen(eigener, p), fremd: await holen(fremd, p) });
  window.ERGEBNIS = ergebnis;
  document.getElementById("tabelle").innerHTML = ergebnis.map((r) =>
    `<tr><td><code>${r.policy}</code></td><td>${r.gleich ?? "(kein Referer)"}</td><td>${r.fremd ?? "(kein Referer)"}</td></tr>`).join("");
})();
