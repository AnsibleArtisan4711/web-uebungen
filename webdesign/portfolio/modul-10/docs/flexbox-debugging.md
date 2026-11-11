# Flexbox-Debugging: Checkliste und Befunde

## Checkliste

1. Ist das Elternelement wirklich der Flex-Container (`display: flex`)? Nur **direkte** Kinder sind Flex Items.
2. Falsche Achse? `flex-direction` prüfen. Bei `column` wirkt `justify-content` senkrecht.
3. Überlauf? `min-width: 0` am Item, `flex-wrap: wrap` am Container, `overflow-wrap: anywhere` für lange Wörter.
4. Wird nicht gestreckt? `align-items: stretch` streckt nur, wenn der Container Höhe hat (oder durch ein anderes Item hoch wird).
5. Abstände mit `gap` statt mit Margins lösen.
6. In den DevTools: Badge „flex“ im DOM-Baum anklicken, Overlay zeigt Achsen, Lücken und Item-Größen.

## Befunde aus dem Experiment (Chromium, Viewport 800 px)

| Fehlerbild | Messung | Ursache | Behebung |
|---|---|---|---|
| Item sprengt den Container (`experimente/ueberlauf.html`) | Container 320 px, Inhalt 488 px, Item 1 = 371 px, Item 2 auf 93 px gequetscht | `min-width: auto` verhindert das Schrumpfen unter die Wortbreite | `min-width: 0` und `overflow-wrap: anywhere`: beide Items 144 px, kein Überlauf |
| Drei Spalten ungleich breit | `flex: auto`: 115 / 333 / 160 px | `auto` nimmt die Inhaltsbreite als Ausgangsgröße | `flex: 1`: 203 / 203 / 203 px |
| Letzte Kartenzeile breiter als die anderen (`experimente/karten-wrap.html`, 1000 px) | Flex: 3 × 312 px, dann 2 × 476 px; Grid: 5 × 312 px | `flex-grow` verteilt den Rest der Zeile | Für exakte Spalten Grid verwenden (Modul 11) |

## Befund im Portfolio

Projektkarten: Der Link-Button stand zuerst direkt unter dem Text, bei ungleich langen Texten also in verschiedenen Höhen. Mit `.karte__text { display: flex; flex-direction: column }` und `.karte__aktion { margin-block-start: auto }` liegen beide Buttons bei 768 und 1280 px auf einer Linie (Unterkanten 650 px und 650 px bzw. 519 px und 519 px). Bei 360 px stehen die Karten untereinander, dort ist die Ausrichtung nicht relevant.
