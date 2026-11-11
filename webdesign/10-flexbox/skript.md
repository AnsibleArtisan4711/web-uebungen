# Modul 10: Flexbox und eindimensionale Layouts

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 9 h \| **Priorität:** 1 \| **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Lerneinheit**     | **Dauer (h)** | **Prio** |
|:--------------------|--------------:|---------:|
| Flex Container      |             1 |        1 |
| Flex Items          |             1 |        1 |
| Main und Cross Axis |           1,5 |        1 |
| Justify und Align   |             1 |        1 |
| Flex Basis und Grow |             1 |        1 |
| Wrapping            |           1,5 |        2 |
| Responsive Cards    |             1 |        2 |
| Flexbox Debugging   |             1 |        2 |
| **Summe**           |         **9** |          |

## Überblick

Flexbox (Flexible Box Layout) ordnet Elemente entlang *einer* Achse (Zeile oder Spalte) an, verteilt Platz, richtet aus und lässt Elemente umbrechen. Es ist das Mittel der Wahl für Komponenten: Navigationsleisten, Button-Gruppen, Karten, Formularzeilen, Zentrierung.

## Flex Container und Flex Items

```css
.leiste { display: flex; }   /* Kinder werden Flex Items */
```

Eigenschaften werden **getrennt** nach Zuständigkeit:

| **Am Container**             | **An den Items**                             |
|:-----------------------------|:---------------------------------------------|
| `display: flex|inline-flex`                      | `flex-grow`, `flex-shrink`, `flex-basis` (Kurzform `flex`) |
| `flex-direction`, `flex-wrap`, `flex-flow`    | `align-self`                                      |
| `justify-content`, `align-items`, `align-content`  | `order`                                     |
| `gap`, `row-gap`, `column-gap` | `margin: auto` (Rest-Platz einnehmen)              |

## Main und Cross Axis

- **Main Axis** (Hauptachse) = Richtung von `flex-direction` (`row`: waagrecht, `column`: senkrecht).

- **Cross Axis** (Querachse) steht senkrecht darauf.

- `justify-content` richtet entlang der *Main Axis* aus, `align-items` entlang der *Cross Axis*.

- Bei `flex-direction: column` vertauschen sich die Richtungen: `justify-content` wirkt dann senkrecht.

**Gedächtnisstütze:** *justify* = Hauptachse, *align* = Querachse.

## Justify und Align

```css
.container {
  display: flex;
  justify-content: space-between; /* flex-start | center | flex-end | space-around | space-evenly */
  align-items: center;            /* stretch (Standard) | flex-start | flex-end | baseline */
  gap: 1rem;
}
.zentriert { display: flex; justify-content: center; align-items: center; min-height: 100svh; }
/* Kurzform: display: grid; place-items: center; */
```

> **Praxisbeispiel: Navigationsleiste: Logo links, Links rechts**
>
> ```css
.header { display: flex; align-items: center; gap: 1rem; }
.header .logo { margin-right: auto; }   /* schiebt alle folgenden Items nach rechts */
```
>
> ```html
<header class="header"><a class="logo" href="/">Logo</a><a href="/a">A</a><a href="/b">B</a></header>
```

## Flex Basis, Grow und Shrink

- `flex-basis`: Ausgangsgröße des Items auf der Hauptachse (Standard `auto` = Inhalts- bzw. `width`-Größe).

- `flex-grow`: Anteil am *überschüssigen* Platz (Standard 0).

- `flex-shrink`: Anteil am *Fehlbetrag*, wenn der Platz nicht reicht (Standard 1).

```css
.item     { flex: 1; }          /* = 1 1 0 : gleich breite Spalten */
.sidebar  { flex: 0 0 16rem; }  /* feste Breite, waechst/schrumpft nicht */
.inhalt   { flex: 1 1 0; min-width: 0; }  /* min-width: 0 erlaubt Schrumpfen unter Inhaltsbreite */
```

> **Ergänzung aus der Nachrecherche: min-width: 0 und typische Flexbox-Fallen**
>
> Flex Items haben standardmäßig `min-width: auto`: Sie schrumpfen nicht unter ihre Inhaltsbreite. Lange Wörter, `pre`-Blöcke oder Bilder sprengen dann den Container. Abhilfe: `min-width: 0` (bzw. `min-height: 0` bei Spalten) und `overflow-wrap: anywhere`. Ein weiterer Klassiker: `flex: 1` und `flex: auto` verhalten sich verschieden (`1 1 0` vs. `1 1 auto`); bei Gleichverteilung `flex: 1` nutzen.

## Wrapping, Responsive Cards

```css
.karten { display: flex; flex-wrap: wrap; gap: 1rem; }
.karte  { flex: 1 1 16rem; }     /* mind. ca. 16rem, wachsen auf Restbreite */
```

Mit `flex-wrap: wrap` brechen Items in die nächste Zeile um, sobald `flex-basis` nicht mehr passt: ein responsives Raster *ohne Media Query*. Nachteil: Die letzte Zeile wächst auf volle Breite (unterschiedlich breite Karten). Für exakte Spalten ist Grid (Modul 11) besser.

```html
<div class="karten">
  <article class="karte"><h2>Titel</h2><p>Text</p></article>
  <article class="karte"><h2>Titel</h2><p>Text</p></article>
  <article class="karte"><h2>Titel</h2><p>Text</p></article>
</div>
```

**Karten mit unten ausgerichteten Buttons:** Karte als Spalte (`display: flex; flex-direction: column;`) und `margin-top: auto` auf dem Button.

## Flexbox Debugging

1.  DevTools: Element mit `display: flex` zeigt ein „flex“-Badge im DOM-Baum; Overlay zeigt Achsen, Lücken und Item-Größen.

2.  Verhält sich ein Kind nicht wie erwartet: Ist das *Elternelement* der Flex-Container? Nur direkte Kinder sind Items.

3.  Falsche Achse? `flex-direction` prüfen und `justify`/`align` vertauschen.

4.  Überlauf: `min-width: 0`, `flex-wrap`, `flex-shrink`.

5.  `height` auf Containern: `align-items: stretch` streckt Items nur, wenn der Container eine Höhe hat.

6.  Abstände mit `gap` statt Margins lösen.

## Übungen

1.  Zentriere ein Element horizontal und vertikal im Viewport (zwei Varianten).

2.  Baue eine Leiste: Logo links, drei Links rechts, vertikal mittig.

3.  Erstelle drei gleich breite Spalten, die unter 40 em untereinander stehen.

4.  Ein Item mit langem Wort sprengt den Flex Container. Warum und wie behebst du es?

5.  Was bedeutet `flex: 0 0 200px`?

## Lösungen

1.  `display: flex; justify-content: center; align-items: center; min-height: 100svh;` oder `display: grid; place-items: center;`.

2.  Siehe „Praxisbeispiel Navigationsleiste“ (`margin-right: auto` am Logo).

3.  `.reihe { display: flex; flex-direction: column; } .reihe > * { flex: 1; } @media (min-width: 40em) { .reihe { flex-direction: row; } }`.

4.  Wegen `min-width: auto` schrumpft das Item nicht unter die Wortbreite; `min-width: 0` und `overflow-wrap: anywhere` setzen.

5.  Weder wachsen (0) noch schrumpfen (0), Basisgröße 200 px: feste Breite.
