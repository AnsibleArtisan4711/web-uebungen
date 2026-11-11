// Misst nach dem Laden den First Contentful Paint und ob die Hauptdatei css/main.css angewendet ist.
// Ergebnis steht in window.ERGEBNIS und im Absatz #ergebnis.
window.addEventListener("load", () => setTimeout(() => {
  const fcp = performance.getEntriesByName("first-contentful-paint")[0];
  // main.css definiert Design-Tokens (--color-bg); ohne die Datei ist die Variable leer
  const hauptCssAktiv = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim() !== "";
  const ergebnis = { fcpMs: fcp ? Math.round(fcp.startTime) : null, hauptCssAktiv };
  window.ERGEBNIS = ergebnis;
  document.getElementById("ergebnis").textContent = `FCP: ${ergebnis.fcpMs} ms · main.css angewendet: ${hauptCssAktiv ? "ja" : "nein"}`;
}, 1500));
