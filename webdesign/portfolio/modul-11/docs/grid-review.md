# Grid-Review (Stand Modul 11)

Geprüft: `blog/index.html` (Blog-Layout), `lebenslauf/index.html` (Lebenslauf-Raster), `projekte/index.html` (Projektraster). Messungen mit Chromium (Playwright).

| Nr | Prüfpunkt | Ergebnis |
|---|---|---|
| 1 | Quelltextreihenfolge logisch? | Ja. Blog: Liste, dann Seitenleiste. Lebenslauf: Stationen, Kenntnisse, Ausbildung, das entspricht auch der sichtbaren Reihenfolge (links, rechts, darunter). Es gibt kein `order` und kein `dense`. |
| 2 | Kein Überlauf bei schmalen Viewports? | Alle 8 Seiten bei 320, 360, 768, 1024 und 1280 px: `scrollWidth` = Fensterbreite. |
| 3 | `minmax(0, 1fr)` statt `1fr`? | Ja, bei allen Seiten-Rastern (`blog-layout`, `lebenslauf-raster`). Tabellen im Wrapper können dadurch die Spalte nicht aufblähen. |
| 4 | `gap` statt Margin? | Ja, überall `gap`. |
| 5 | Grid-Overlay in den DevTools kontrolliert? | Offen, manuell zu prüfen. |

## Messwerte

| Viewport | Blog: Liste / Seitenleiste | Lebenslauf: Stationen / Kenntnisse |
|---|---|---|
| 360 px | 328 px / 328 px (untereinander) | 328 px / 328 px (untereinander) |
| 768 px | 736 px / 736 px (untereinander) | 736 px / 736 px (untereinander) |
| 1024 px | 704 px / 256 px (nebeneinander) | 480 px / 480 px (nebeneinander) |
| 1280 px | 736 px / 256 px (nebeneinander) | 496 px / 496 px (nebeneinander) |

Die zweispaltigen Layouts greifen ab `60em` (960 px).

## Befund beim Bau

Die Tabelle „Kenntnisse“ ist mindestens 498 px breit. In der Spalte (496 px bei 1280 px) scrollte sie deshalb um 2 px. Behoben, indem das Zellen-Padding der Tabellen von `0.75rem` auf `0.5rem` sank: danach scrollt der Wrapper bei 1024 und 1280 px nicht mehr.
