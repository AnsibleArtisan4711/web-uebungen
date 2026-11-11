# Modul 17: Architektur, Methodik und Designsysteme

Etappe im Portfolio: CSS-Architektur: BEM, ITCSS, Ebenen, Muster, Styleguide und Refactoring; das Stylesheet wird in Quelldateien zerlegt und ohne sichtbare Änderung umgebaut.

Lehrplan: 9 Stunden, Priorität 2. Pro Unterkapitel gibt es eine Übung.

Das zugehörige Kapitel des Skripts: [skript.md](skript.md) (aus LaTeX umgewandelt).

## Übungen

| Nr | Übung | Lehrplan | Zeit |
|---|---|---|---|
| 17.1 | [CSS-Architektur: Ziele und Prinzipien](17.1-css-architektur-ziele-und-prinzipien.md) | 17.2 | 75 Min |
| 17.2 | [BEM: Block, Element, Modifier](17.2-bem-block-element-modifier.md) | 17.3 | 75 Min |
| 17.3 | [ITCSS und Layering](17.3-itcss-und-layering.md) | 17.4 | 90 Min |
| 17.4 | [Cascade Layers als Architektur-Werkzeug](17.4-cascade-layers.md) | 17.5 | 75 Min |
| 17.5 | [Utility-CSS und Component Styling](17.5-utility-css-und-component-styling.md) | 17.6 | 90 Min |
| 17.6 | [Styleguide und Refactoring](17.6-styleguide-und-refactoring.md) | 17.7 | 90 Min |

Die Nummern der Übungen zählen nur die Inhalts-Unterkapitel (der Lehrplan-Abschnitt „Überblick“ hat keine Übung).

## Fertiger Stand

[`../portfolio/modul-17/`](../portfolio/modul-17/)

## Etappen-Abnahme

Das Modul ist abgeschlossen, wenn Folgendes zutrifft:

- [ ] `css/main.css` wird aus `css/src/` gebaut (`npm run css`) und ist aktuell (`npm run css:pruefen`)
- [ ] Klassen folgen BEM, Ausnahmen stehen in `docs/css-konventionen.md`
- [ ] Es gibt keine ID-Selektoren und `!important` nur an zwei begründeten Stellen
- [ ] Der Umbau wurde mit einem Pixelvergleich geprüft
- [ ] Der Styleguide zeigt Benennung und Layout-Muster
- [ ] `docs/css-audit.md` und `docs/refactoring-plan.md` sind ausgefüllt

Weiter mit Modul 18: Security, Datenschutz und Compliance im Webdesign.
