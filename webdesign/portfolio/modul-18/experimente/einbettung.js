// Zwei-Klick-Einbettung: erst nach Einwilligung wird das iframe erzeugt. Die Einwilligung merkt sich localStorage.
const FREMD = location.protocol + "//" + (location.hostname === "localhost" ? "127.0.0.1" : "localhost") + ":" + location.port + "/experimente/fremd/widget.html";
const SCHLUESSEL = "einwilligung-widget";
const ziel = document.getElementById("ziel");
const laden = document.getElementById("laden");
const widerruf = document.getElementById("widerruf");
const meldung = document.getElementById("meldung");
const merken = (wert) => { try { wert ? localStorage.setItem(SCHLUESSEL, "ja") : localStorage.removeItem(SCHLUESSEL); } catch { /* Speicher gesperrt: Einwilligung gilt nur für diesen Besuch */ } };
const gemerkt = () => { try { return localStorage.getItem(SCHLUESSEL) === "ja"; } catch { return false; } };

function einbetten() {
  const f = document.createElement("iframe");
  f.title = "Eingebetteter Inhalt"; f.setAttribute("sandbox", "allow-scripts"); f.src = FREMD;
  ziel.replaceChildren(f);
  laden.hidden = true; widerruf.hidden = false;
  meldung.textContent = "Inhalt geladen. Du hast eingewilligt.";
}
function entfernen() {
  ziel.replaceChildren();
  laden.hidden = false; widerruf.hidden = true;
  meldung.textContent = "Einwilligung widerrufen. Der Inhalt ist entfernt.";
}
laden.addEventListener("click", () => { merken(true); einbetten(); });
widerruf.addEventListener("click", () => { merken(false); entfernen(); });
if (gemerkt()) einbetten();
