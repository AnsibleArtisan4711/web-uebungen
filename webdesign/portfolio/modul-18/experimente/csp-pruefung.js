// Prüft, was eine Content Security Policy zulässt. Ergebnis steht in window.ERGEBNIS und in der Tabelle.
const verstoesse = [];
document.addEventListener("securitypolicyviolation", (e) => {
  verstoesse.push({ direktive: e.violatedDirective, art: e.disposition, ziel: e.blockedURI });
});

let evalGelaufen = false;
try { eval("evalGelaufen = true"); } catch { /* von der CSP blockiert */ }

// Das Bild wird auf den "anderen" Ursprung gelegt: localhost und 127.0.0.1 gelten als verschiedene Ursprünge.
document.addEventListener("DOMContentLoaded", () => {
  const anderer = location.protocol + "//" + (location.hostname === "localhost" ? "127.0.0.1" : "localhost") + ":" + location.port;
  document.getElementById("fremdbild").src = anderer + "/img/avatar.png";
});

window.addEventListener("load", () => setTimeout(() => {
  const rot = getComputedStyle(document.getElementById("stil")).color === "rgb(255, 0, 0)";
  const bild = document.getElementById("fremdbild");
  const ergebnis = {
    inlineSkript: window.INLINE_SKRIPT === true,
    inlineHandler: window.INLINE_HANDLER === true,
    eval: evalGelaufen,
    styleAttribut: rot,
    fremdbild: bild.complete && bild.naturalWidth > 0,
    verstoesse,
  };
  window.ERGEBNIS = ergebnis;
  const zeilen = [
    ["Inline-<script>", ergebnis.inlineSkript],
    ["Inline-Event-Handler (onerror)", ergebnis.inlineHandler],
    ["eval()", ergebnis.eval],
    ["style-Attribut", ergebnis.styleAttribut],
    ["Bild von fremdem Ursprung", ergebnis.fremdbild],
  ];
  document.getElementById("tabelle").innerHTML = zeilen
    .map(([n, ok]) => `<tr><td>${n}</td><td>${ok ? "lief / geladen" : "blockiert"}</td></tr>`).join("");
  document.getElementById("anzahl").textContent = verstoesse.length + " Verstöße gemeldet";
}, 600));
