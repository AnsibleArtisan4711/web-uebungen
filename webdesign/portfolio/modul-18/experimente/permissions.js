// Fragt ab, welche Browserfunktionen die Permissions-Policy dieser Seite erlaubt. Nur in Chromium verfügbar.
const richtlinie = document.featurePolicy ?? document.permissionsPolicy;
const funktionen = ["camera", "microphone", "geolocation", "fullscreen", "payment"];
const ergebnis = funktionen.map((f) => ({ funktion: f, erlaubt: richtlinie ? richtlinie.allowsFeature(f) : null }));
window.ERGEBNIS = ergebnis;
document.getElementById("tabelle").innerHTML = ergebnis.map((r) =>
  `<tr><td><code>${r.funktion}</code></td><td>${r.erlaubt === null ? "nicht prüfbar" : r.erlaubt ? "ja" : "nein"}</td></tr>`).join("");
