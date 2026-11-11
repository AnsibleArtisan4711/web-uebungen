// Bindet fremd/lib.js zweimal ein, mit passendem und mit falschem integrity-Hash, und beobachtet load/error.
const RICHTIG = "sha384-mwSPrnYzHZbYU2nTBxxsFvq5zWUZB2FChJ5kjRblcQcLNDScPd0bx0ITCaxh+5IS";
const FALSCH = "sha384-" + "A".repeat(64);
const ergebnis = [];
function einbinden(name, hash) {
  return new Promise((fertig) => {
    const s = document.createElement("script");
    s.src = "fremd/lib.js?" + name; s.integrity = hash; s.crossOrigin = "anonymous";
    s.onload = () => { ergebnis.push({ name, geladen: true }); fertig(); };
    s.onerror = () => { ergebnis.push({ name, geladen: false }); fertig(); };
    document.head.append(s);
  });
}
(async () => {
  await einbinden("richtig", RICHTIG);
  await einbinden("falsch", FALSCH);
  window.ERGEBNIS = { ergebnis, libZaehler: window.LIB };
  document.getElementById("tabelle").innerHTML = ergebnis.map((r) =>
    `<tr><td>Hash ${r.name}</td><td>${r.geladen ? "geladen und ausgeführt" : "vom Browser blockiert"}</td></tr>`).join("");
})();
