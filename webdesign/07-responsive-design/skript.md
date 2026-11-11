# Modul 7: Responsive Design und Mobile First

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 21 h \| **Priorität:** 1 \| **Lerneinheiten:** 19

## Lerneinheiten laut Lehrplan

| **Lerneinheit**       | **Dauer (h)** | **Prio** |
|:----------------------|--------------:|---------:|
| Mobile First          |             1 |        1 |
| Viewport Meta         |             1 |        1 |
| Media Queries         |           1,5 |        1 |
| Fluid Grids           |             1 |        1 |
| Flexible Medien       |             1 |        1 |
| Responsive Navigation |           1,5 |        2 |
| Breakpoints           |             1 |        2 |
| Device Testing        |             1 |        2 |
| Textauszeichnung      |             1 |        1 |
| Links und Navigation  |             1 |        1 |
| Listen                |           1,5 |        1 |
| Bilder mit alt        |             1 |        1 |
| Audio und Video       |             1 |        1 |
| Responsive Images     |           1,5 |        2 |
| Figures und Captions  |             1 |        2 |
| Medien-Fallbacks      |             1 |        2 |
| Container Queries     |             1 |        1 |
| Fluid Layouts         |             1 |        1 |
| Logical Properties    |             1 |        2 |
| **Summe**             |        **21** |          |

## Überblick

Responsive Design lässt eine Website auf jeder Bildschirmgröße und in jeder Nutzungssituation funktionieren. Die drei klassischen Zutaten (Ethan Marcotte): **fluide Raster**, **flexible Medien** und **Media Queries**. Dazu kommt heute **Container Queries**. Dieses Modul enthält außerdem die semantischen Grundlagen für Text, Links, Listen, Bilder, Audio und Video, weil sie Voraussetzung für responsive Inhalte sind.

## Mobile First und Viewport

**Mobile First:** Das Basis-CSS gestaltet die *kleine* Ansicht; größere Viewports ergänzen per `min-width`-Media-Queries. Vorteile: weniger Overrides, leichter Code für schwache Geräte, Fokus auf das Wesentliche (Content first).

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

Ohne dieses Meta-Tag rendern Mobilbrowser die Seite auf ca. 980 px virtueller Breite und verkleinern sie. **Nicht** `user-scalable=no` oder `maximum-scale=1` setzen: Das verhindert Zoom und verstößt gegen WCAG 1.4.4.

## Media Queries und Breakpoints

```css
.raster { display: grid; gap: 1rem; grid-template-columns: 1fr; }   /* Basis: Mobil */

@media (min-width: 40em)  { .raster { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 64em)  { .raster { grid-template-columns: repeat(3, 1fr); } }

/* Nutzereinstellungen und Ausgabemedien */
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
@media (prefers-color-scheme: dark)     { :root { --bg: #121212; } }
@media (hover: hover) and (pointer: fine) { .menu a:hover { text-decoration: underline; } }
@media (orientation: landscape) { }
@media print { nav, footer { display: none; } }
@media (width >= 40em) { }      /* moderne Range-Syntax */
```

**Breakpoints inhaltlich setzen:** Fenster langsam aufziehen und dort umbrechen, wo das Layout nicht mehr gut aussieht (Zeilenlänge, Umbrüche), nicht bei „iPhone“ oder „iPad“. Einheit `em` in Media Queries berücksichtigt Nutzer-Schriftgröße. Typische Orientierung: ca. 40 em (640 px), 48 em (768 px), 64 em (1024 px), 80 em (1280 px).

## Fluid Grids, Fluid Layouts, Responsive Navigation

```css
.container { width: min(100% - 2rem, 72rem); margin-inline: auto; }    /* fluid mit Maximalbreite */

/* Automatisch umbrechendes Raster ohne Media Query */
.karten { display: grid; gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
```

**Responsive Navigation** (Muster): wenige Punkte → umbrechende Linkliste; viele Punkte → ausklappbares Menü. Beim „Hamburger“-Menü zwingend ein echtes `<button>` mit `aria-expanded` und `aria-controls` verwenden (Details Modul 14), und das Menü ohne JavaScript nutzbar halten, wo möglich.

```html
<button class="menu-toggle" aria-expanded="false" aria-controls="menu">Menü</button>
<nav id="menu" aria-label="Hauptnavigation">...</nav>
```

## Container Queries und Logical Properties

**Container Queries** richten Komponenten nach der Breite ihres *Containers* aus, nicht nach dem Viewport. So funktioniert dieselbe Karte in Hauptspalte und Seitenleiste.

```css
.karten-slot { container-type: inline-size; container-name: karte; }

.karte { display: grid; gap: 1rem; }
@container karte (min-width: 30rem) {
  .karte { grid-template-columns: 12rem 1fr; }   /* Bild links, Text rechts */
}
.titel { font-size: clamp(1rem, 4cqi, 1.5rem); }  /* cqi = 1% der Container-Breite */
```

> **Ergänzung aus der Nachrecherche: Verfügbarkeit**
>
> Größenbasierte Container Queries und die `cq*`-Einheiten sind nach Baseline-Angaben (flaviocopes.com, Stand 9/2026) seit August 2025 *widely available*, also produktiv einsetzbar. Style Queries (`@container style(...)`) sind dagegen noch weniger verbreitet und nur ergänzend zu nutzen.

**Logical Properties** ersetzen physische Richtungen (`left`/`right`) durch *Schreibrichtungen*, damit Layouts in RTL-Sprachen (Arabisch, Hebräisch) und vertikaler Schrift funktionieren:

```css
margin-left  --> margin-inline-start      padding-top  --> padding-block-start
width        --> inline-size              height       --> block-size
margin: 0 auto --> margin-inline: auto    border-left  --> border-inline-start
text-align: left --> text-align: start    inset: 0     (gilt weiterhin)
```

## Textauszeichnung, Links und Listen

**Textauszeichnung nach Bedeutung:**

| **Element**                  | **Bedeutung**                                                                   |
|:-----------------------------|:--------------------------------------------------------------------------------|
| `<p>`, `<br>`           | Absatz; Zeilenumbruch nur in Adressen/Gedichten                                 |
| `<strong>` / `<em>`          | Starke Wichtigkeit / betonte Aussprache (nicht `<b>`/`<i>` für Bedeutung) |
| `<mark>`, `<abbr>`, `<time>` | Hervorhebung, Abkürzung mit `title`, Datum maschinenlesbar                     |
| `<code>`, `<pre>`, `<kbd>` | Code, vorformatierter Text, Tastatureingabe                                     |
| `<blockquote>`, `<q>`, `<cite>` | Längeres/kurzes Zitat, Quellenangabe                                            |
| `<address>`                     | Kontaktinformation zum nächsten `article`/`body`                               |

**Links und Navigation:**

```html
<a href="/kontakt/">Kontakt aufnehmen</a>                      <!-- sprechender Linktext -->
<a href="https://beispiel.at" target="_blank" rel="noopener">Extern (neuer Tab)</a>
<a href="/preise.pdf" download>Preisliste (PDF, 240 KB)</a>
<a href="#faq">Zur FAQ</a>   <a href="mailto:info@beispiel.at">E-Mail</a>   <a href="tel:+4315551234">Anrufen</a>
```

Linktexte müssen für sich verständlich sein („Preisliste herunterladen“, nicht „hier“). Links sind für Navigation, Buttons für Aktionen. Links im Fließtext nicht nur über Farbe erkennbar machen (Unterstreichung).

**Listen:** `<ul>` (ungeordnet), `<ol>` (geordnet, `start`, `reversed`), `<dl>` mit `<dt>`/`<dd>` (Begriff und Beschreibung). Navigationen sind semantisch Listen von Links (`nav > ul > li > a`).

## Bilder, Alternativtexte, Figures

```html
<figure>
  <img src="team-800.jpg" alt="Das Team der Beispiel GmbH vor dem Bürogebäude"
       width="800" height="533">
  <figcaption>Unser Team 2026</figcaption>
</figure>
<img src="trennlinie.svg" alt="">   <!-- dekorativ: leeres alt -->
```

**Alt-Texte:** informative Bilder beschreiben, was *wichtig* ist („Balkendiagramm: Umsatz steigt von 2022 bis 2025 um 40 %“); dekorative Bilder erhalten `alt=""`; Bilder in Links beschreiben das *Ziel*; Text im Bild im `alt` wiederholen; keine Floskeln wie „Bild von“. `width` und `height` immer angeben (verhindert Layoutsprünge, CLS).

## Responsive Images, Flexible Medien, Audio und Video

```html
<!-- Auflösungswechsel: gleiches Motiv, verschiedene Dateigrößen -->
<img src="foto-800.jpg" width="800" height="450" alt="Strand bei Sonnenuntergang"
     srcset="foto-400.jpg 400w, foto-800.jpg 800w, foto-1600.jpg 1600w"
     sizes="(min-width: 64em) 50vw, 100vw">

<!-- Art Direction und Formate: anderer Bildausschnitt bzw. moderne Formate -->
<picture>
  <source media="(min-width: 48em)" srcset="hero-breit.avif" type="image/avif">
  <source media="(min-width: 48em)" srcset="hero-breit.webp" type="image/webp">
  <img src="hero-schmal.jpg" width="600" height="600" alt="Produkt auf Holztisch">
</picture>
```

```css
img, video, iframe { max-width: 100%; height: auto; }          /* flexibel */
.video-wrap { aspect-ratio: 16 / 9; }  img { object-fit: cover; }
```

> **Ergänzung aus der Nachrecherche: srcset: w-Deskriptor, sizes und Pixeldichte**
>
> Mit `w` nennt man die *Breite der Datei*; `sizes` sagt dem Browser, wie breit das Bild *im Layout* dargestellt wird. Aus Layoutbreite, Display-Pixeldichte (DPR) und `srcset` wählt der Browser die passende Datei. Für feste Größen genügt `srcset="logo.png 1x, logo@2x.png 2x"`. Ohne `sizes` nimmt der Browser 100 vw an und lädt oft zu große Dateien.

**Audio und Video:**

```html
<video controls preload="metadata" poster="vorschau.jpg" width="1280" height="720">
  <source src="film.webm" type="video/webm">
  <source src="film.mp4"  type="video/mp4">
  <track kind="captions" src="film.de.vtt" srclang="de" label="Deutsch" default>
  <p>Ihr Browser kann das Video nicht abspielen. <a href="film.mp4">Video herunterladen</a></p>
</video>
<audio controls src="podcast.mp3">Ihr Browser unterstützt kein Audio.</audio>
```

Barrierefreiheit: Untertitel (`captions`), Transkript, keine automatische Wiedergabe mit Ton, bedienbare Steuerung. Die Inhalte zwischen den Tags dienen als **Fallback**. Für Videohosting (YouTube/Vimeo) den datenschutzfreundlichen Einbettungsmodus bzw. eine Zwei-Klick-Lösung verwenden (Modul 18).

## Device Testing

Browser-DevTools (Device Toolbar) zum schnellen Test; zusätzlich *echte Geräte* (Touch, Performance, Tastaturen, Safari auf iOS ist eigene Engine); Netzwerk drosseln (Slow 4G); Zoom auf 200 % und große Schrift testen; Querformat und Landscape; Tools wie BrowserStack. Checkliste: kein horizontaler Scroll, Text lesbar ohne Zoom, Klickflächen groß genug (mind. 24 px, besser 44 px), Hover-Funktionen auch per Touch erreichbar, Bilder scharf.

## Übungen

1.  Warum ist `width=device-width, initial-scale=1` notwendig, und was darf man nicht setzen?

2.  Schreibe ein Mobile-First-Raster: 1 Spalte, ab 40 em 2 Spalten, ab 64 em 3 Spalten.

3.  Wann nimmt man Container Queries, wann Media Queries?

4.  Welches Bildmarkup nutzt du für: (a) ein Foto in 3 Auflösungen, (b) ein anderes Motiv auf Mobilgeräten, (c) ein reines Zierbild?

5.  Schreibe sinnvolle Alt-Texte für ein Firmenlogo im Link zur Startseite und ein Diagramm mit Umsatzentwicklung.

## Lösungen

1.  Das Tag verhindert die virtuelle Desktopbreite auf Mobilgeräten. Nicht `user-scalable=no`/`maximum-scale` setzen (Zoom blockiert, WCAG 1.4.4).

2.  Siehe Beispiel „Media Queries“ mit `min-width: 40em` und `64em` und `grid-template-columns: repeat(2, 1fr)` bzw. `repeat(3, 1fr)`.

3.  Media Queries für Seitenlayout und Nutzereinstellungen (global), Container Queries für wiederverwendbare Komponenten, deren Platz variiert.

4.  \(a\) `img` mit `srcset` und `sizes`; (b) `picture` mit `source media`; (c) `<img alt="">` (oder CSS-Hintergrund).

5.  Logo im Link: `alt="Beispiel GmbH, Startseite"` (Ziel nennen); Diagramm: `alt="Liniendiagramm: Umsatz wächst von 1,2 Mio. € (2022) auf 1,7 Mio. € (2025)"` plus Datentabelle als Alternative.
