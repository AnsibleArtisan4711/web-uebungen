"""Schätzt, wie viel von css/main.css auf den Seiten des Portfolios tatsächlich greift (Übung 19.6).

Aufruf:   python3 tools/css-abdeckung.py [ORDNER]      (Standard: Projektordner)

Das Skript startet einen kleinen Webserver und lädt jede Seite in zwei Breiten und beiden Farbschemata. In der Seite geht es
alle Style-Regeln von main.css durch (CSSOM) und prüft, ob die Media-Bedingung zutrifft und der Selektor mindestens ein Element
trifft. Eine Regel gilt als "genutzt", wenn das in irgendeiner Seite, Breite oder Farbvariante der Fall war.
Voraussetzungen (nicht Teil des Portfolios):   pip install playwright    und    playwright install chromium

Das ist eine Schätzung, kein Messwert wie die Coverage der Entwicklerwerkzeuge:
- Zustände (:hover, :focus, :active, geöffnetes Menü, Fehlermeldungen nach dem Absenden) greifen nach dem Laden nicht und zählen als ungenutzt.
- Regeln innerhalb von @container gelten als aktiv (die Bedingung wird nicht ausgewertet).
- Die Druckansicht (@media print) wird nicht ausgewertet und zählt als ungenutzt.
- Pseudo-Elemente (::before, ::after) werden vor der Prüfung aus dem Selektor entfernt.
Eine hohe Zahl ungenutzter Regeln heißt deshalb nicht automatisch "löschen", sondern "prüfen".
"""
import pathlib
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

ordner = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent).resolve()
SEITEN = ["index.html", "projekte/index.html", "blog/index.html", "blog/erster-beitrag/index.html", "kontakt/index.html",
          "kontakt/danke/index.html", "lebenslauf/index.html", "styleguide/index.html", "impressum/index.html",
          "datenschutz/index.html", "404.html"]
PORT = 8197

PRUEFUNG = """() => {
  const blatt = [...document.styleSheets].find((s) => s.href && /main(\\.[0-9a-f]+)?\\.css$/.test(s.href));
  const aus = [];
  const trifft = (sel) => {
    // Pseudo-Elemente entfernen; dabei entstandene leere Listenglieder (", ,") ebenfalls
    const ohnePseudo = sel.replace(/::[a-z-]+(\\([^)]*\\))?/g, "").replace(/,\\s*(?=,|$)/g, "").replace(/^\\s*,\\s*/, "").trim() || "*";
    try { return document.querySelector(ohnePseudo) !== null; } catch { return false; }
  };
  const gehe = (regeln, aktiv) => {
    for (const r of regeln) {
      if (r instanceof CSSStyleRule) {
        aus.push({ sel: r.selectorText, groesse: r.cssText.length, genutzt: aktiv && trifft(r.selectorText) });
        if (r.cssRules && r.cssRules.length) gehe(r.cssRules, aktiv);
      } else if (r instanceof CSSMediaRule) {
        gehe(r.cssRules, aktiv && matchMedia(r.media.mediaText).matches);
      } else if (r.cssRules) {
        gehe(r.cssRules, aktiv);
      }
    }
  };
  gehe(blatt.cssRules, true);
  return aus;
}"""

server = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", str(ordner), "--bind", "127.0.0.1"],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    regeln = None            # Liste aller Regeln (Selektor, Größe)
    genutzt = set()          # Indizes der Regeln, die irgendwo gegriffen haben
    je_seite = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for seite in SEITEN:
            if not (ordner / seite).exists():
                continue
            seite_genutzt = set()
            for breite in (360, 1024):
                for schema in ("light", "dark"):
                    ctx = browser.new_context(viewport={"width": breite, "height": 800}, color_scheme=schema)
                    pg = ctx.new_page()
                    pg.goto(f"http://127.0.0.1:{PORT}/{seite}")
                    pg.wait_for_timeout(300)
                    erg = pg.evaluate(PRUEFUNG)
                    if regeln is None:
                        regeln = [(r["sel"], r["groesse"]) for r in erg]
                    for i, r in enumerate(erg):
                        if r["genutzt"]:
                            seite_genutzt.add(i)
                            genutzt.add(i)
                    ctx.close()
            je_seite[seite] = seite_genutzt
        browser.close()
    gesamt = sum(g for _, g in regeln)
    n = sum(regeln[i][1] for i in genutzt)
    print(f"{len(regeln)} Style-Regeln, {len(genutzt)} davon in mindestens einer Seite angewendet ({100 * len(genutzt) / len(regeln):.0f} %)")
    print(f"Größe (Zeichen der Regeln): {n} von {gesamt} angewendet ({100 * n / gesamt:.0f} %)")
    print("\nJe Seite (Anteil der Regeln, beide Breiten und Farbschemata vereinigt):")
    for seite, s in je_seite.items():
        print(f"  {seite:34} {100 * len(s) / len(regeln):4.0f} %")
    print("\nNicht angewendete Regeln (Auswahl, größte zuerst):")
    for i in sorted((i for i in range(len(regeln)) if i not in genutzt), key=lambda i: -regeln[i][1])[:12]:
        print(f"  {regeln[i][1]:5} Zeichen  {regeln[i][0][:90]}")
finally:
    server.terminate()
