# Testplan

Vorlage mit den tatsächlich vorhandenen Prüfungen. Die Spalte „Stand“ trägt ehrlich ein, was bisher wirklich gelaufen ist.

## Teststufen

| Stufe | Werkzeug | Befehl | Prüft |
|---|---|---|---|
| Unit | `node --test` | `npm test` | Logik (`js/logik.js`), CSS-Regeln, Build |
| Statische Prüfung | Stylelint, ESLint, Prettier | `npm run lint`, `npm run format:pruefen` | Stil und Fehlermuster |
| Validierung | html-validate, W3C Nu Checker | `npm run validate:html`, `npm run validate:w3c` | HTML nach Standard |
| Sicherheit | eigener Check | `npm run security` | gefährliche Muster (Modul 18) |
| Ablauf (End-to-End) | Playwright Test | `npm run e2e` | Formular, Seiten ohne Konsolenfehler |
| Visuelle Regression | Playwright, `toHaveScreenshot` | `npm run e2e` nach `npm run e2e:baseline` | Aussehen je Breite |
| Barrierefreiheit | axe-core | (Modul 14, nicht Teil von `npm test`) | automatisch prüfbare Regeln |
| Budget | eigener Check | `npm run budget -- dist` | Dateigrößen |

## Browser- und Geräte-Matrix

| Umgebung | Stand |
|---|---|
| Chromium (Playwright), 375 px und 1280 px, hell | automatisch getestet |
| Chromium, dunkles Farbschema | nur durch den Pixelvergleich (`tools/pixelvergleich.py`) |
| Firefox | nicht getestet |
| Safari (macOS/iOS) | nicht getestet |
| Android-Gerät, iPhone (real) | nicht getestet |
| Bildschirmleser (NVDA, VoiceOver) | nicht getestet |

## Testfälle je Seitentyp

| Seitentyp | Fall | Erwartet | Automatisiert |
|---|---|---|---|
| Kontakt | leer absenden | Fehlerzusammenfassung, Fokus darauf, nicht abgeschickt | `e2e/ablauf.spec.js` |
| Kontakt | gültig absenden | Weiterleitung zur Danke-Seite | `e2e/ablauf.spec.js` |
| alle | laden | keine Konsolenfehler | `e2e/ablauf.spec.js` |
| alle | Aussehen | unverändert zur Baseline | `e2e/visuell.spec.js` |
| Navigation | Menü per Tastatur öffnen/schließen (Escape) | `aria-expanded` wechselt, Fokus bleibt sinnvoll | manuell |
| Blog | Suche ohne Treffer | Hinweis „keine Treffer“ | manuell |

## Fehlerklassen

| Klasse | Bedeutung | Beispiel | Reaktion |
|---|---|---|---|
| blockierend | Kernfunktion kaputt, kein Release | Formular lässt sich nicht absenden | sofort beheben |
| hoch | wichtige Funktion eingeschränkt | Menü nicht per Tastatur bedienbar | vor dem Release beheben |
| mittel | stört, Umgehung möglich | Layout bricht bei 320 px | im nächsten Release |
| gering | kosmetisch | 2 px Abstand falsch | nach Bedarf |

Nach jeder Korrektur: Retest des Falls und der Fälle drumherum.

## Akzeptanzkriterien (aus dem Briefing des Portfolios)

- Alle Seiten sind valide, ohne axe-Verstöße und ohne CSP-Verstöße.
- Das Kontaktformular führt per Tastatur zum Ziel.
- Die Seite bleibt innerhalb des Größenbudgets (`tools/budget-check.js`).
