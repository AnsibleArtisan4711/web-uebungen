# Gerätetest Modul 07

Gemessen mit Chromium (Playwright) im Emulationsmodus, nicht auf echten Geräten. Echte Geräte, Safari und Firefox testest du selbst (Übung 07.8).

## Viewports

| Breite | Entspricht ungefähr |
|---|---|
| 320 px | kleines Handy, Mindestbreite nach WCAG 1.4.10 |
| 360 px | gängiges Android-Handy |
| 768 px | Tablet hochkant |
| 1280 px | Laptop |

## Ergebnis: horizontales Scrollen

Alle 7 Seiten bei allen 4 Breiten: `scrollWidth` = Fensterbreite, also **kein horizontales Scrollen**.

## Ergebnis: Tippflächen

| Befund | Wert vorher | Maßnahme | Wert nachher |
|---|---|---|---|
| Link „AnsibleArtisan4711“ im Kopf | 150 × 20 px | `display: inline-flex; min-block-size: 2.75rem` | Höhe 44 px |
| Radio-Buttons und Checkbox im Kontaktformular | 20 × 20 px bzw. 13 × 20 px | keine, das ganze Label (≥ 44 px hoch) ist klickbar | ok |
| Links im Fließtext (z. B. Blog-Titel 23 px, E-Mail-Adresse 20 px) | 20 bis 23 px | keine, Links im Fließtext sind von WCAG 2.5.8 ausgenommen | ok |
| Hauptnavigation | 44 px hoch, 34 bis 38 px breit | keine, ≥ 24 px ist erfüllt | ok |

## Offene Punkte

- Zoom auf 200 % und Textvergrößerung: manuell prüfen.
- Echte Geräte, Safari (iOS) und Firefox: manuell prüfen.
- Netzwerk-Drosselung (Slow 4G) und Lighthouse: Aufgabe in Modul 16.
