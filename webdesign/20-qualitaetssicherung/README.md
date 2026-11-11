# Modul 20: Qualitätssicherung, Validierung und Wartbarkeit

Etappe im Portfolio: Qualitätssicherung: Validatoren, Review-Material, Namens-Check, Browser-Tests und Dokumentationsstandards im Portfolio.

Lehrplan: 9 Stunden, Priorität 2. Pro Unterkapitel gibt es eine Übung.

Das zugehörige Kapitel des Skripts: [skript.md](skript.md) (aus LaTeX umgewandelt).

## Übungen

| Nr | Übung | Lehrplan | Zeit |
|---|---|---|---|
| 20.1 | [HTML-Validatoren und Linting](20.1-html-validatoren-und-linting.md) | 20.2 | 60 Min |
| 20.2 | [Code Reviews](20.2-code-reviews.md) | 20.3 | 90 Min |
| 20.3 | [Komponenten-Markup, Naming und Konventionen](20.3-komponenten-markup-naming-und-konventionen.md) | 20.4 | 75 Min |
| 20.4 | [Regressionstests, Browser- und Geräteprüfung](20.4-regressionstests-browser-und-geraetepruefung.md) | 20.5 | 120 Min |
| 20.5 | [Dokumentationsstandards und Wartungsplan](20.5-dokumentationsstandards-und-wartungsplan.md) | 20.6 | 75 Min |

Die Nummern der Übungen zählen nur die Inhalts-Unterkapitel (der Lehrplan-Abschnitt „Überblick“ hat keine Übung).

## Fertiger Stand

[`../portfolio/modul-20/`](../portfolio/modul-20/)

## Etappen-Abnahme

Das Modul ist abgeschlossen, wenn Folgendes zutrifft:

- [ ] `npm run validate:html` und `npm run validate:w3c` laufen ohne Fehler und Warnungen
- [ ] `npm run namen` und `npm run doku` laufen ohne Verstöße
- [ ] `npm run e2e` besteht, nachdem du die Baseline auf deinem Rechner angelegt hast
- [ ] `npm run lint`, `npm run format:pruefen` und `npm test` laufen ohne Befund
- [ ] Die Review-Checkliste, die Pull-Request-Vorlage und `CONTRIBUTING.md` sind auf dein Projekt angepasst
- [ ] Mindestens ein ADR und das Betriebshandbuch sind ausgefüllt (ohne Geheimnisse)
- [ ] Der Testplan nennt ehrlich, was nicht getestet wurde (Firefox, Safari, reale Geräte, Bildschirmleser)

Weiter mit Modul 21: Kosten, Migration, Governance und BCDR.
