// Dieselbe Arbeit (feste Zahl von Rechenschritten) auf zwei Arten. "Lange Aufgabe" (Long Task) heißt: Der Hauptthread ist über 50 ms blockiert.
// Die Messung läuft über PerformanceObserver("longtask") und steht in window.ERGEBNIS.
const SCHRITTE = 80000000;
const ergebnisFeld = document.getElementById("ergebnis");
const langeAufgaben = [];
new PerformanceObserver((liste) => { for (const e of liste.getEntries()) langeAufgaben.push(Math.round(e.duration)); }).observe({ type: "longtask", buffered: true });

function rechne(von, bis) {
  let s = 0;
  for (let i = von; i < bis; i++) s += Math.sqrt(i);
  return s;
}
function ausgabe(art, start) {
  // kurz warten, damit der Observer die Einträge sicher geliefert hat
  setTimeout(() => {
    const gesamt = Math.round(performance.now() - start);
    window.ERGEBNIS = { art, gesamtMs: gesamt, langeAufgaben: [...langeAufgaben] };
    ergebnisFeld.textContent = `${art}: ${gesamt} ms gesamt, lange Aufgaben: ${langeAufgaben.length ? langeAufgaben.join(", ") + " ms" : "keine"}`;
  }, 200);
}
document.getElementById("am-stueck").addEventListener("click", () => {
  langeAufgaben.length = 0;
  const start = performance.now();
  rechne(0, SCHRITTE);
  ausgabe("am Stück", start);
});
document.getElementById("haeppchen").addEventListener("click", () => {
  langeAufgaben.length = 0;
  const start = performance.now();
  const HAPPEN = 2000000;   // kleine Portion je Durchgang; dazwischen darf der Browser zeichnen und Eingaben verarbeiten
  let i = 0;
  (function weiter() {
    rechne(i, Math.min(i + HAPPEN, SCHRITTE));
    i += HAPPEN;
    if (i < SCHRITTE) setTimeout(weiter, 0); else ausgabe("in Häppchen", start);
  })();
});
