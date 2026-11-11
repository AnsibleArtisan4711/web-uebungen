# Modul 10: Flexbox und eindimensionale Layouts

Etappe im Portfolio: Navigation, Kopf, Fußzeile, Button-Gruppen und Projektkarten mit Flexbox.

Lehrplan: 9 Stunden, Priorität 1. Pro Unterkapitel gibt es eine Übung.

Das zugehörige Kapitel des Skripts: [skript.md](skript.md) (aus LaTeX umgewandelt).

## Übungen

| Nr | Übung | Lehrplan | Zeit |
|---|---|---|---|
| 10.1 | [Flex Container und Flex Items](10.1-flex-container-und-flex-items.md) | 10.2 | 45 Min |
| 10.2 | [Main und Cross Axis](10.2-main-und-cross-axis.md) | 10.3 | 60 Min |
| 10.3 | [Justify und Align](10.3-justify-und-align.md) | 10.4 | 75 Min |
| 10.4 | [Flex Basis, Grow und Shrink](10.4-flex-basis-grow-und-shrink.md) | 10.5 | 75 Min |
| 10.5 | [Wrapping und Responsive Cards](10.5-wrapping-und-responsive-cards.md) | 10.6 | 75 Min |
| 10.6 | [Flexbox Debugging](10.6-flexbox-debugging.md) | 10.7 | 60 Min |

Die Nummern der Übungen zählen nur die Inhalts-Unterkapitel (der Lehrplan-Abschnitt „Überblick“ hat keine Übung).

## Fertiger Stand

[`../portfolio/modul-10/`](../portfolio/modul-10/)

## Etappen-Abnahme

Das Modul ist abgeschlossen, wenn Folgendes zutrifft:

- [ ] Kopf und Fußzeile sind Flex-Container und brechen auf schmalen Bildschirmen um
- [ ] Das Logo steht links, die Navigation rechts (`margin-inline-end: auto`)
- [ ] Die Buttons der Projektkarten stehen unten auf einer Linie
- [ ] Kein Überlauf durch lange Wörter (`min-width: 0`, `overflow-wrap`)
- [ ] Abstände mit `gap` statt mit Margins
- [ ] `docs/flexbox-debugging.md` enthält die Checkliste und eigene Befunde

Weiter mit Modul 11: CSS Grid und zweidimensionale Layouts.
