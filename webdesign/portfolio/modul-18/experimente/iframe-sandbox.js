// Baut vier iframes, sammelt die Meldungen und prüft zusätzlich, ob die Elternseite in das iframe schauen kann.
const varianten = [
  ["ohne sandbox", null],
  ["sandbox=\"\"", ""],
  ["allow-scripts", "allow-scripts"],
  ["allow-scripts allow-same-origin", "allow-scripts allow-same-origin"],
];
const meldungen = {};
window.addEventListener("message", (e) => { if (e.data?.widget) meldungen[e.data.name] = e.data; });
const rahmen = document.getElementById("rahmen");
varianten.forEach(([name, sandbox], i) => {
  const f = document.createElement("iframe");
  f.name = name; f.title = "Widget: " + name;
  if (sandbox !== null) f.setAttribute("sandbox", sandbox);
  f.src = "fremd/widget.html";
  rahmen.append(f);
});
setTimeout(() => {
  const ergebnis = varianten.map(([name], i) => {
    const f = rahmen.children[i];
    let sichtbar = "ja"; try { sichtbar = f.contentDocument ? "ja" : "nein"; } catch { sichtbar = "nein"; }
    const m = meldungen[name];
    return { name, skript: !!m, localStorage: m?.localStorage ?? "-", elternZugriff: m?.elternZugriff ?? "-", sichtbar };
  });
  window.ERGEBNIS = ergebnis;
  document.getElementById("tabelle").innerHTML = ergebnis.map((r) =>
    `<tr><td><code>${r.name}</code></td><td>${r.skript ? "läuft" : "blockiert"}</td><td>${r.localStorage}</td><td>${r.elternZugriff}</td><td>${r.sichtbar}</td></tr>`).join("");
}, 800);
