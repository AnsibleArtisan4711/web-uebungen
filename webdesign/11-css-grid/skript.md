# Modul 11: CSS Grid und zweidimensionale Layouts

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 9 h \| **Priorität:** 1 \| **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Lerneinheit**    | **Dauer (h)** | **Prio** |
|:-------------------|--------------:|---------:|
| Grid Container     |             1 |        1 |
| Tracks und Units   |             1 |        1 |
| Grid Lines         |           1,5 |        1 |
| Grid Areas         |             1 |        1 |
| Auto Placement     |             1 |        1 |
| minmax und repeat  |           1,5 |        2 |
| Subgrid            |             1 |        2 |
| Grid Layout Review |             1 |        2 |
| **Summe**          |         **9** |          |

## Überblick

CSS Grid ist das Layoutsystem für *zwei Dimensionen*: Zeilen und Spalten gleichzeitig. Es eignet sich für Seitenlayouts, Rastergalerien und Komponenten, bei denen Elemente an Zeilen *und* Spalten ausgerichtet werden müssen. Flexbox arbeitet vom Inhalt aus, Grid vom Layout aus.

## Grid Container, Tracks und Units

```css
.raster {
  display: grid;
  grid-template-columns: 200px 1fr 2fr;   /* 3 Spalten: fix, 1 Anteil, 2 Anteile */
  grid-template-rows: auto 1fr auto;
  gap: 1rem;                              /* Spalten- und Zeilenabstand */
}
```

- **Track** = Spalte oder Zeile. **Cell** = Schnittpunkt. **Area** = rechteckiger Bereich aus Zellen.

- **fr** (Fractional Unit) verteilt den *Restplatz* proportional. Weitere Größen: `px`, `rem`, `%`, `auto`, `min-content`, `max-content`, `fit-content()`.

- **Explizites** Grid: durch `grid-template-*` definiert. **Implizites** Grid: vom Browser angelegte Zusatz-Tracks (steuerbar mit `grid-auto-rows`, `grid-auto-columns`).

## minmax, repeat, auto-fit und auto-fill

```css
grid-template-columns: repeat(3, 1fr);                 /* 3 gleiche Spalten */
grid-template-columns: repeat(3, minmax(0, 1fr));      /* verhindert Aufblaehen durch Inhalt */
grid-template-rows: minmax(100px, auto);               /* mind. 100px, waechst mit Inhalt */

/* Responsives Raster ohne Media Query */
.karten { display: grid; gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
```

> **Ergänzung aus der Nachrecherche: auto-fit vs. auto-fill**
>
> Beide erzeugen so viele Spalten, wie in den Container passen. `auto-fill` *behält* leere Tracks bei (Raster bleibt gleichmäßig, auch wenn nur wenige Items vorhanden sind); `auto-fit` *kollabiert* leere Tracks und lässt die vorhandenen Items den Platz einnehmen. Die Form `minmax(min(100%, 16rem), 1fr)` verhindert Überlauf auf sehr schmalen Displays (unter 16 rem).

## Grid Lines und Platzierung

Zwischen den Tracks liegen nummerierte *Linien* (1 bis n+1; negative Zahlen zählen von hinten, `-1` = letzte Linie).

```css
.hero    { grid-column: 1 / -1; }          /* ueber alle Spalten */
.seitenleiste { grid-column: 1 / 2; grid-row: 2 / 4; }
.breit   { grid-column: span 2; }           /* 2 Spalten breit, Startposition automatisch */
.hinten  { grid-column: 2 / span 3; }
/* benannte Linien */
.seite   { grid-template-columns: [voll-start] 1fr [inhalt-start] minmax(0, 60rem) [inhalt-ende] 1fr [voll-ende]; }
.bild    { grid-column: voll-start / voll-ende; }
.text    { grid-column: inhalt-start / inhalt-ende; }
```

## Grid Areas

```css
.seite {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas:
    "kopf"
    "navi"
    "inhalt"
    "fuss";
}
@media (min-width: 60em) {
  .seite {
    grid-template-columns: 16rem 1fr;
    grid-template-areas:
      "kopf   kopf"
      "navi   inhalt"
      "fuss   fuss";
  }
}
.kopf { grid-area: kopf; } .navi { grid-area: navi; }
.inhalt { grid-area: inhalt; } .fuss { grid-area: fuss; }
```

Vorteil: Das *Layout* steht im CSS lesbar als „Karte“, die Quelltext-Reihenfolge (und damit Tab-Reihenfolge) bleibt logisch. Nicht benutzte Zellen mit Punkt (`.`) kennzeichnen.

> **Merke**
>
> Visuelle Umordnung per Grid (`order`, `grid-area`) ändert *nicht* die Tab- und Leserreihenfolge. Quelltextreihenfolge muss die logische Reihenfolge bleiben (WCAG 1.3.2 und 2.4.3).

## Auto Placement und Ausrichtung

Items ohne explizite Platzierung füllt der Browser Zeile für Zeile (`grid-auto-flow: row`, Standard). `grid-auto-flow: dense` füllt Lücken (kann Reihenfolge verändern: Vorsicht bei Barrierefreiheit).

```css
.galerie { display: grid; grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
           grid-auto-rows: 10rem; grid-auto-flow: dense; gap: .5rem; }
.galerie .gross { grid-column: span 2; grid-row: span 2; }
```

**Ausrichtung:** `justify-items`/`align-items` (Items in ihrer Zelle), `justify-content`/`align-content` (gesamtes Raster im Container), `justify-self`/`align-self` (einzelnes Item), Kurzform `place-items`, `place-content`, `place-self`.

## Subgrid und Layout Reviews

**Subgrid** lässt verschachtelte Elemente die Tracks des *Eltern-Grids* übernehmen. Klassischer Anwendungsfall: Karten, deren Titel, Text und Button *über alle Karten hinweg* auf gleicher Höhe stehen.

```css
.karten { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.karte  { display: grid; grid-template-rows: subgrid; grid-row: span 3; }
/* Titel, Text, Button = 3 Zeilen, die sich nach der hoechsten Karte richten */
```

> **Ergänzung aus der Nachrecherche: Verfügbarkeit von Subgrid**
>
> Subgrid ist nach Baseline-Angaben (flaviocopes.com, Stand 9/2026) seit März 2026 *widely available*. Für ältere Browser funktioniert die Karte weiterhin mit eigenem Grid; Titel und Button stehen nur nicht auf einer Linie (sauberer Fallback).

**Grid vs. Flexbox – Entscheidungshilfe:**

| **Flexbox**                           | **Grid**                       |
|:--------------------------------------|:-------------------------------|
| Eine Dimension (Reihe *oder* Spalte)  | Zwei Dimensionen               |
| Inhalt bestimmt die Größe             | Layout bestimmt die Größe      |
| Navigation, Buttonreihen, Zentrierung | Seitenlayout, Galerien, Raster |

Beide lassen sich kombinieren: Seite mit Grid, Komponenten mit Flexbox.

**Review-Checkliste:** Quelltextreihenfolge logisch? Kein Überlauf bei schmalen Viewports (`minmax(min(100%, X), 1fr)`)? `minmax(0, 1fr)` statt `1fr`, wenn Inhalt aufbläht? `gap` statt Margin? DevTools-Grid-Overlay kontrolliert?

## Übungen

1.  Erstelle das klassische Seitenlayout (Header, Navi, Inhalt, Footer) mit `grid-template-areas`, mobil einspaltig.

2.  Baue ein Raster, das so viele Spalten à mindestens 14 rem zeigt, wie passen.

3.  Was ist der Unterschied zwischen `auto-fit` und `auto-fill`?

4.  Platziere ein Element über alle Spalten eines 4-spaltigen Grids (zwei Schreibweisen).

5.  Wofür nutzt man Subgrid?

## Lösungen

1.  Siehe Beispiel „Grid Areas“ (mobil: 4 Zeilen; ab 60 em zweispaltig).

2.  `grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));`

3.  `auto-fill` behält leere Tracks (gleichmäßiges Raster), `auto-fit` kollabiert sie, vorhandene Items wachsen.

4.  `grid-column: 1 / -1;` oder `grid-column: 1 / 5;` (bzw. `span 4`).

5.  Damit verschachtelte Elemente (z. B. Karteninhalt) an den Tracks des Eltern-Grids ausgerichtet bleiben, z. B. gleich hohe Titel/Textbereiche über mehrere Karten.
