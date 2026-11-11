# Modul 4: Box Model, Sizing und visuelles Formatting

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 9 h \| **Priorität:** 1 \| **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Lerneinheit**      | **Dauer (h)** | **Prio** |
|:---------------------|--------------:|---------:|
| Box Model            |             1 |        1 |
| box-sizing           |             1 |        1 |
| Display-Werte        |           1,5 |        1 |
| Margin und Padding   |             1 |        1 |
| Borders und Outlines |             1 |        1 |
| Overflow             |           1,5 |        2 |
| Positioning          |             1 |        2 |
| Stacking Context     |             1 |        2 |
| **Summe**            |         **9** |          |

## Überblick

Jedes sichtbare Element ist für den Browser eine rechteckige *Box*. Wie groß sie ist, wie sie sich zu Nachbarn verhält und was über was liegt, bestimmen Box Model, `display`, `position` und der Stacking Context. Die meisten „unerklärlichen“ Layoutfehler lassen sich damit erklären.

## Box Model und box-sizing

Von innen nach außen: **Content** → **Padding** (Innenabstand) → **Border** (Rahmen) → **Margin** (Außenabstand, transparent).

```css
.box { width: 300px; padding: 20px; border: 5px solid #333; margin: 10px; }
/* content-box (Standard): Gesamtbreite = 300 + 2*20 + 2*5 = 350px */
/* border-box:             Gesamtbreite = 300px (Padding und Border sind enthalten) */
```

**Empfehlung** (Standard in fast jedem Projekt):

```css
*, *::before, *::after { box-sizing: border-box; }
```

Dann bedeutet `width: 50%` wirklich die Hälfte, unabhängig von Padding/Border.

**Kurzschreibweisen:** `margin: 10px 20px;` (oben/unten, links/rechts); `margin: 10px 20px 30px 40px;` (im Uhrzeigersinn: oben, rechts, unten, links); `padding: 1rem 2rem 3rem;` (oben, links/rechts, unten).

> **Ergänzung aus der Nachrecherche: Margin Collapsing**
>
> Vertikale Außenabstände *benachbarter* Blockelemente verschmelzen: Es gilt der *größere* Wert, nicht die Summe (`margin-bottom: 30px` auf Element A und `margin-top: 20px` auf B ergeben 30 px). Dasselbe passiert zwischen Eltern und erstem/letztem Kind, wenn kein Padding, Border oder neuer Formatierungskontext dazwischen liegt. Kein Collapsing gibt es bei Flex- und Grid-Items sowie bei `overflow` ungleich `visible`, `display: flow-root` und `position: absolute`. Praxis-Tipp: Abstände konsequent in *eine* Richtung setzen (z. B. nur `margin-bottom` oder `gap`) und mit `display: flow-root` ein Container-Collapsing verhindern.

## Display-Werte

| **Wert**            | **Verhalten**                                                                                          |
|:--------------------|:-------------------------------------------------------------------------------------------------------|
| `block`            | Neue Zeile, füllt die Breite, Breite/Höhe/Margin wirken voll (`div`, `p`, `h1`)            |
| `inline`            | Fließt im Text, `width`/`height` wirken nicht, vertikale Margins nicht (`span`, `a`)           |
| `inline-block`            | Fließt wie Text, aber Box-Eigenschaften wirken                                                         |
| `none`            | Element wird nicht gerendert (auch nicht für Screenreader)                                             |
| `flex` / `grid` | Neuer Layout-Kontext für Kinder (Modul 10 und 11)                                                      |
| `contents`            | Box entfällt, Kinder verhalten sich wie direkte Kinder des Elternelements (Vorsicht bei Accessibility) |
| `flow-root`            | Block, der einen neuen Formatierungskontext bildet (Floats einschließen, Margin-Collapsing verhindern) |

**Wichtig:** `display: none` und das Attribut `hidden` verbergen auch für Screenreader. `visibility: hidden` behält den Platz. Nur visuell verbergen (aber vorlesen lassen) geht mit einer `.visually-hidden`-Klasse (Modul 14).

## Margin, Padding, Borders, Outlines, Größen

- **Border:** `border: 1px solid #ccc;`, `border-radius`, einzelne Seiten (`border-bottom`).

- **Outline** liegt *außerhalb* der Box, beansprucht keinen Platz und ändert das Layout nicht. Es ist das Mittel für Fokus-Anzeigen (`outline-offset` für Abstand). Niemals pauschal `outline: none`.

- **Größen:** `min-width`/`max-width`, `min-height`/`max-height`; `width: min(100%, 60rem)`; `aspect-ratio: 16 / 9`.

- **Einheiten:** `px` (absolut), `rem` (relativ zur Wurzelschrift, bevorzugt für Abstände und Schrift), `em` (relativ zum Element), `%`, `vw`/`vh`, `ch` (Zeichenbreite, ideal für Textbreite: `max-width: 65ch`), `dvh`/`svh` (dynamische/kleine Viewport-Höhe auf Mobilgeräten).

```css
.container { width: min(100% - 2rem, 70rem); margin-inline: auto; }
.lesetext  { max-width: 65ch; }
.hero      { min-height: 100svh; }
```

## Overflow

Wenn Inhalt größer als die Box ist: `overflow: visible` (Standard, ragt heraus), `hidden` (abschneiden), `scroll`, `auto` (Scrollbalken nur bei Bedarf), `clip`. Separat: `overflow-x`/`overflow-y`. Hinweise: `overflow: hidden` erzeugt einen neuen Formatierungskontext und verhindert `position: sticky` im Kindelement; Text kürzen mit `text-overflow: ellipsis` (braucht `white-space: nowrap` und `overflow: hidden`); lange Wörter mit `overflow-wrap: anywhere` umbrechen. Häufigster Mobilfehler: ungewollter *horizontaler* Scrollbalken, meist durch zu breite Elemente (feste `width`, `100vw` mit vertikalem Scrollbalken, große Bilder ohne `max-width: 100%`).

## Positioning

| **position** | **Verhalten**                                                                              |
|:-------------|:-------------------------------------------------------------------------------------------|
| `static`     | Normalfluss (Standard); `top/left` ohne Wirkung                                              |
| `relative`     | Normalfluss, aber verschiebbar; bildet Bezugspunkt für absolut positionierte Kinder        |
| `absolute`     | Aus dem Fluss, relativ zum nächsten positionierten Vorfahren                               |
| `fixed`     | Relativ zum Viewport, bleibt beim Scrollen (z. B. feste Kopfzeile)                         |
| `sticky`     | Normalfluss, bleibt beim Scrollen „haften“, bis die Grenze des Elternelements erreicht ist |

```css
.karte { position: relative; }
.karte .badge { position: absolute; top: .5rem; right: .5rem; }
.kopf  { position: sticky; top: 0; }          /* haftet oben */
.abdeckung { position: absolute; inset: 0; }   /* inset = top/right/bottom/left */
```

**Faustregel:** Positionierung für Überlagerungen und Ausnahmen; das Grund-Layout machen Flexbox und Grid.

## Stacking Context und z-index

`z-index` wirkt nur bei positionierten Elementen (und Flex-/Grid-Items). Entscheidend ist der *Stacking Context*: Ein z-index ist nur *innerhalb* seines Kontextes vergleichbar. Ein Kind mit `z-index: 9999` kann nie über einem Element außerhalb seines Kontextes liegen, wenn dessen Kontext-Wurzel darunter liegt.

**Erzeugen einen neuen Stacking Context:** Wurzelelement, `position` mit gesetztem `z-index`, `position: fixed/sticky`, `opacity` kleiner 1, `transform`, `filter`, `isolation: isolate`, `will-change`, Flex-/Grid-Items mit `z-index`.

```css
.dropdown-wrapper { isolation: isolate; }  /* eigener Kontext, kein z-index-Krieg */
.modal            { position: fixed; inset: 0; z-index: 100; }
```

> **Ergänzung aus der Nachrecherche: z-index-Ordnung statt Zahlenrennen**
>
> Statt `9999` zentrale Custom Properties nutzen: `--z-dropdown: 10; --z-sticky: 20; --z-modal: 100; --z-toast: 200;`. Für Dialoge besser das native `<dialog>` mit `showModal()` verwenden: Es landet automatisch in der *Top Layer* und braucht keinen z-index.

## Übungen

1.  Ein Element hat `width: 400px; padding: 30px; border: 10px solid;`. Wie breit ist es bei `content-box` und bei `border-box`?

2.  Zwei Absätze haben `margin-bottom: 40px` und `margin-top: 25px`. Wie groß ist der Abstand?

3.  Warum wirkt `width` nicht auf ein `<span>`? Zwei Lösungen.

4.  Platziere ein Badge in der oberen rechten Ecke einer Karte.

5.  Ein Overlay mit `z-index: 9999` liegt trotzdem hinter einer Seitenleiste. Nenne eine plausible Ursache.

## Lösungen

1.  content-box: 400 + 60 + 20 = 480 px; border-box: 400 px.

2.  40 px (Margin Collapsing, der größere Wert gewinnt).

3.  `span` ist `inline`. Lösung: `display: inline-block` oder `block` (bzw. `flex`/`grid` auf dem Elternelement).

4.  Karte `position: relative`, Badge `position: absolute; top: 0; right: 0`.

5.  Das Overlay liegt in einem anderen Stacking Context, dessen Wurzel unterhalb der Seitenleiste liegt (z. B. Elternteil mit `transform` oder `opacity`). Abhilfe: Overlay im `body` rendern, `isolation`/Kontextstruktur prüfen oder `<dialog>` verwenden.
