"""Pixelvergleich zweier Stände des Portfolios (Hilfsmittel für Refactoring, optional).

Aufruf:   python3 tools/pixelvergleich.py ORDNER_VORHER ORDNER_NACHHER

Das Skript startet für beide Ordner einen kleinen Webserver, macht von jeder Seite Screenshots
(zwei Breiten, helles und dunkles Farbschema, "Bewegung reduzieren") und meldet jeden Unterschied.
Außerdem werden Zustände geprüft: Menü offen, Filter gewählt, Suche ohne Treffer, Formular mit Fehlern, Tastaturfokus.

Voraussetzungen (nicht Teil des Portfolios):   pip install playwright pillow    und    playwright install chromium
Ausgabe "0 Unterschiede" heißt: Das Aussehen ist in diesen Fällen pixelgleich geblieben. Es beweist nicht,
dass nichts anders ist, nur dass hier nichts auffiel.
"""
import io
import subprocess
import sys
import time

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

if len(sys.argv) != 3:
    sys.exit(__doc__)
VORHER, NACHHER = sys.argv[1], sys.argv[2]
SEITEN = ["index.html", "projekte/index.html", "blog/index.html", "blog/erster-beitrag/index.html",
          "kontakt/index.html", "kontakt/danke/index.html", "lebenslauf/index.html", "styleguide/index.html", "404.html"]
BREITEN = (360, 1280)
ZUSTAENDE = ("-", "menue", "filter", "suche", "fehler", "fokus")


def aufnahme(seite, port, pfad, zustand):
    seite.goto(f"http://127.0.0.1:{port}/{pfad}")
    seite.wait_for_load_state("load")
    seite.wait_for_timeout(250)
    if zustand == "menue" and seite.locator(".menue-knopf").count() and seite.locator(".menue-knopf").is_visible():
        seite.click(".menue-knopf")
    elif zustand == "filter" and seite.locator(".chip").count() > 1:
        seite.locator(".chip").nth(1).click()
    elif zustand == "suche" and seite.locator("#blog-suche").count():
        seite.fill("#blog-suche", "zzz")
    elif zustand == "fehler" and seite.locator("form.js-formular, form.formular").count():
        seite.locator("form.js-formular [type=submit], form.formular [type=submit]").first.click()
    elif zustand == "fokus":
        for _ in range(3):
            seite.keyboard.press("Tab")
    seite.wait_for_timeout(150)
    return Image.open(io.BytesIO(seite.screenshot(full_page=True))).convert("RGB")


server = [subprocess.Popen(["python3", "-m", "http.server", str(port), "-d", ordner, "--bind", "127.0.0.1"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
          for port, ordner in ((8101, VORHER), (8102, NACHHER))]
time.sleep(1)
vergleiche = unterschiede = 0
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for schema in ("light", "dark"):
            for breite in BREITEN:
                kontext = browser.new_context(viewport={"width": breite, "height": 800}, color_scheme=schema, reduced_motion="reduce")
                for pfad in SEITEN:
                    for zustand in ZUSTAENDE:
                        bilder = []
                        for port in (8101, 8102):
                            seite = kontext.new_page()
                            try:
                                bilder.append(aufnahme(seite, port, pfad, zustand))
                            finally:
                                seite.close()
                        vergleiche += 1
                        gleich_gross = bilder[0].size == bilder[1].size
                        if not gleich_gross or ImageChops.difference(*bilder).getbbox():
                            unterschiede += 1
                            print("UNTERSCHIED", schema, breite, pfad, zustand, bilder[0].size, bilder[1].size)
                kontext.close()
finally:
    for s in server:
        s.terminate()
print(f"{vergleiche} Vergleiche, {unterschiede} Unterschiede")
