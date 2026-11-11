// Läuft im iframe. Prüft, was das Widget darf, und meldet es per postMessage an die Elternseite.
const bericht = { skript: true, localStorage: "", cookie: "", elternZugriff: "" };
try { localStorage.setItem("test", "1"); bericht.localStorage = "ok"; } catch (e) { bericht.localStorage = e.name; }
try { document.cookie = "t=1"; bericht.cookie = "ok"; } catch (e) { bericht.cookie = e.name; }
try { bericht.elternZugriff = parent.document.title ? "ok" : "leer"; } catch (e) { bericht.elternZugriff = e.name; }
document.getElementById("status").textContent = "Skript läuft. localStorage: " + bericht.localStorage;
parent.postMessage({ widget: true, name: window.name, ...bericht }, "*");
