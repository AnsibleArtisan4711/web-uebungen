# Kostenkalkulation (Vorlage und Beispiel)

Rechenwerkzeug: [`tools/kosten.js`](../tools/kosten.js) (`npm run kosten -- docs/kosten/firmenwebsite.json`). Alle Zahlen sind **ausgedachte Platzhalter**.

## Rechenregeln (so im Werkzeug umgesetzt)

1. Arbeitspakete in Stunden addieren (Summe ohne Projektmanagement).
2. Projektmanagement (PM) als Prozentsatz auf die Summe **ohne** PM.
3. Puffer als Prozentsatz auf die Summe **mit** PM.
4. Euro = Stunden × Stundensatz, in Cent gerechnet und erst am Ende gerundet (ein Paket einzeln zu runden kann Cent-Abweichungen erzeugen).
5. Betriebskosten (Hosting, Domain, Wartung) getrennt ausweisen: Einmalkosten und laufende Kosten sind verschiedene Zahlen (Gesamtkosten über die Nutzungsdauer = TCO).

## Methoden

| Methode | Ablauf | Stärke | Schwäche |
|---|---|---|---|
| Bottom-up | Arbeitspakete einzeln schätzen und addieren | nachvollziehbar, deckt Lücken auf | aufwendig, vergessene Pakete fehlen in der Summe |
| Analogie | Vergleich mit einem früheren, ähnlichen Projekt | schnell | nur so gut wie die Ähnlichkeit |
| Dreipunkt | optimistisch, wahrscheinlich, pessimistisch; Erwartungswert (O + 4W + P) / 6 | macht Unsicherheit sichtbar | Zahlen sind selbst Schätzungen |

## Gemessene Beispiele (aus den JSON-Dateien in `docs/kosten/`)

| Datei | Summe ohne PM | PM | Puffer | Gesamt | Euro |
|---|---|---|---|---|---|
| `firmenwebsite.json` (Praxisbeispiel Lehrplan) | 148 h | 15 % = 22,2 h | 0 % | 170,2 h | 15.318,00 € bei 90 €/h |
| `aufgabe-1.json` (Lehrplan-Aufgabe 21.8.1) | 120 h | 15 % = 18 h (Zwischensumme 138 h) | 10 % = 13,8 h | 151,8 h | 12.903,00 € bei 85 €/h |
| `beispiel-dreipunkt.json` | 156 h | 15 % = 23,4 h | 15 % = 26,91 h | 206,31 h | 18.567,90 € bei 90 €/h, dazu laufend 1.575 €/Jahr |

Hinweis zu `aufgabe-1.json`: Der Lehrplan nennt 120 h Arbeit, 85 €/h, 15 % PM und 10 % Puffer, aber nicht, worauf sich der Puffer bezieht. Das Werkzeug rechnet den Puffer auf die Summe **mit** PM (138 h → 13,8 h). Bezöge man ihn auf die 120 h ohne PM, wären es 12 h und das Ergebnis läge niedriger. Die Basis muss deshalb in jedem Angebot genannt werden. Das ist eine Annahme von mir, keine Vorgabe aus dem Lehrplan.

## Was eine Kalkulation nicht enthält

- Änderungswünsche nach der Abnahme (eigener Änderungsprozess, siehe [Governance](governance.md)).
- Inhalte, die der Auftraggeber liefern muss (Texte, Bilder): Verzögerung ist ein Risiko, keine Stunde.
- Lizenzen, Schriften, Stockfotos.
