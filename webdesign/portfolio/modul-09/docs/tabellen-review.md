# Tabellen-Review: Lebenslauf (Stand Modul 09)

Geprüft: `lebenslauf/index.html` (zwei Tabellen). Messungen mit Chromium (Playwright) und `html-validate`; ein Test mit echtem Screenreader (NVDA, VoiceOver) steht **noch aus**.

| Nr | Prüfpunkt | Ergebnis |
|---|---|---|
| 1 | Echte Daten? | Ja: Stationen (Zeitraum, Rolle, Schwerpunkt) und Kenntnisse (Niveau, Jahr) haben Beziehungen zwischen Zeilen und Spalten. |
| 2 | `caption` vorhanden? | Ja, beide. Die Überschrift davor wiederholt teilweise den Text. Das ist ok, die `caption` benennt zusätzlich „Beispielinhalt“. |
| 3 | `th` mit `scope`? | Ja: `scope="col"` im Kopf, `scope="row"` in der ersten Spalte. |
| 4 | `thead` / `tbody` / `tfoot`? | `thead` und `tbody` ja. `tfoot` nicht nötig (keine Summenzeile). |
| 5 | Verbundene oder leere Zellen? | Keine. |
| 6 | Mobil benutzbar? | Ja. Bei 320 px bleibt die Seite ohne horizontales Scrollen, die Tabellen scrollen im Wrapper (Stationen 351 px breit in 288 px, Kenntnisse 498 px in 288 px). Der Wrapper ist per Tab fokussierbar. |
| 7 | Kontrast, Zeilenabstand, Zahlen? | Text auf Zebra-Zeile: hell 16,3 : 1 / 15,6 : 1, dunkel 13,4 : 1 / 11,9 : 1. Jahreszahlen rechtsbündig mit `tabular-nums`. |
| 8 | Validator, Screenreader? | `html-validate`: keine Fehler. Accessibility-Baum in Chromium: `columnheader` und `rowheader` korrekt. Screenreader-Kurztest: offen. |

## Offene Punkte

- Kein sichtbarer Hinweis, dass die Tabelle seitwärts scrollt (z. B. Schatten am Rand). Als Erweiterung in 09.3.
- Der Wrapper ist ein `section` mit `aria-labelledby` (Rolle `region`). Das ist gleichwertig zu `div role="region"` aus dem Lehrplan, aber vom Validator bevorzugt.
