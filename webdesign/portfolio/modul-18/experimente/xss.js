// Gemeinsames Skript für die XSS-Experimente. Der Modus steht im Attribut data-modus des <script>-Elements.
const modus = document.currentScript.dataset.modus;
const name = new URLSearchParams(location.search).get("name") ?? "Gast";
const ziel = document.getElementById("gruss");
const verstoesse = [];
document.addEventListener("securitypolicyviolation", (e) => verstoesse.push(e.violatedDirective));

if (modus === "unsicher") ziel.innerHTML = "Hallo " + name;      // UNSICHER: Eingabe wird als HTML gelesen
else ziel.textContent = "Hallo " + name;                         // SICHER: Eingabe bleibt Text

// Der Schadcode im Beispiel setzt nur ein Attribut am <body>. Wir prüfen, ob das passiert ist.
setTimeout(() => {
  const gelaufen = document.body.dataset.xss === "ausgefuehrt";
  document.getElementById("status").textContent =
    (gelaufen ? "Schadcode wurde AUSGEFÜHRT." : "Schadcode wurde nicht ausgeführt.") +
    (verstoesse.length ? " Die CSP hat " + verstoesse.length + " Verstoß gemeldet (" + verstoesse[0] + ")." : "");
  window.ERGEBNIS = { gelaufen, verstoesse, html: ziel.innerHTML };
}, 400);
