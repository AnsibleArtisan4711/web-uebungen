# Modul 5: CSS Grundlagen, Layout und Designsysteme

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 18 h \| **Priorität:** 1 \| **Lerneinheiten:** 16

## Lerneinheiten laut Lehrplan

| **Lerneinheit**         | **Dauer (h)** | **Prio** |
|:------------------------|--------------:|---------:|
| CSS Box Model           |             1 |        1 |
| Cascade und Specificity |             1 |        1 |
| Typografie              |           1,5 |        1 |
| Farben und Tokens       |             1 |        1 |
| Flexbox                 |             1 |        1 |
| CSS Grid                |           1,5 |        2 |
| Komponenten             |             1 |        2 |
| Designsystem-Grundlagen |             1 |        2 |
| Webfonts                |             1 |        1 |
| Text Styling            |             1 |        1 |
| Fluid Typography        |           1,5 |        1 |
| Color Syntax            |             1 |        1 |
| Kontrast                |             1 |        1 |
| Custom Properties       |           1,5 |        2 |
| Design Tokens           |             1 |        2 |
| Theming                 |             1 |        2 |
| **Summe**               |        **18** |          |

## Überblick

Dieses Modul bündelt die gestalterische Seite von CSS: Typografie, Farben, Custom Properties, Design Tokens, Theming und den Aufbau wiederverwendbarer Komponenten in einem Designsystem. Die Layout-Grundlagen (Box Model, Cascade, Flexbox, Grid) werden hier nur wiederholt und dorthin verwiesen, wo sie ausführlich behandelt sind: Box Model → Modul 4, Cascade und Specificity → Modul 3, Flexbox → Modul 10, Grid → Modul 11.

## Wiederholung: Box Model, Cascade, Flexbox, Grid

- **Box Model:** `box-sizing: border-box` global setzen; Abstände mit `rem` oder Tokens, nicht mit „magischen“ Pixelwerten.

- **Cascade:** Quelle → Layer → Spezifität → Reihenfolge. Konflikte durch flache Selektoren lösen.

- **Flexbox** für Komponenten in einer Richtung (Navigation, Button-Gruppen, Karten-Innenleben); **Grid** für Seiten- und Rasterlayouts in zwei Richtungen.

```css
.nav   { display: flex; gap: 1rem; align-items: center; }
.seite { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
@media (min-width: 60em) { .seite { grid-template-columns: 18rem 1fr; } }
```

## Typografie und Text Styling

**Wichtige Eigenschaften:**

- `font-family`: immer mit Fallback-Stack, z. B. `font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;`

- `font-size`: Basis 100 % (meist 16 px); Größen in `rem`, damit Nutzereinstellungen respektiert werden.

- `line-height`: einheitenlos (`1.5` für Fließtext, `1.1--1.3` für Überschriften).

- `font-weight`, `font-style`, `letter-spacing`, `text-transform`, `text-align`, `text-decoration`, `text-indent`.

- `max-width: 65ch` für angenehme Zeilenlänge (ca. 45–75 Zeichen).

- `text-wrap: balance` für ausgewogene Überschriften, `text-wrap: pretty` gegen einzelne Wörter in der letzten Zeile (Firefox-Unterstützung prüfen).

- `hyphens: auto` (mit `lang="de"`) für Silbentrennung; `overflow-wrap: anywhere` für lange Wörter und URLs.

```css
:root { font-family: system-ui, sans-serif; line-height: 1.5; }
body  { font-size: 1rem; color: #222; }
h1, h2, h3 { line-height: 1.2; text-wrap: balance; }
p     { max-width: 65ch; hyphens: auto; }
```

**Webfonts:** Schriften per `@font-face` laden, bevorzugt *WOFF2*, am besten selbst gehostet (Performance und Datenschutz, siehe Modul 16 und 18).

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-var.woff2") format("woff2");
  font-weight: 100 900;          /* Variable Font: ganzer Gewichtsbereich */
  font-style: normal;
  font-display: swap;            /* Fallback sofort zeigen, Webfont tauschen */
}
```

> **Ergänzung aus der Nachrecherche: Variable Fonts, font-display und Fallback-Metriken**
>
> Eine *Variable Font* enthält viele Schnitte in einer Datei (Achsen wie Gewicht `wght` und Breite `wdth`) und spart Anfragen. `font-display: swap` vermeidet unsichtbaren Text (FOIT), kann aber beim Tausch Layoutverschiebungen (CLS) verursachen. Abhilfe: Fallback-Schrift mit `size-adjust`, `ascent-override` und `descent-override` an die Webfont angleichen, wichtige Schrift per `<link rel="preload" as="font" type="font/woff2" crossorigin>` vorladen und nur benötigte Zeichen (Subsetting) laden.

**Fluid Typography** lässt die Schrift zwischen Minimal- und Maximalgröße stufenlos mitwachsen:

```css
h1 { font-size: clamp(1.75rem, 1.2rem + 2.5vw, 3rem); }
/* min 1.75rem, mittlerer Wert waechst mit der Viewportbreite, max 3rem */
```

> **Merke**
>
> Reine `vw`-Schrift lässt sich nicht zoomen und verletzt WCAG 1.4.4 (Textgröße ändern). Immer eine `rem`-Komponente einmischen (`1.2rem + 2.5vw`), damit Browser-Zoom und Nutzer-Schriftgröße wirken.

## Farben, Color Syntax und Kontrast

**Farbnotationen:**

```css
color: red;                      /* Name */
color: #1a3c6e;                  /* Hex (#rgb, #rrggbb, #rrggbbaa) */
color: rgb(26 60 110);           /* RGB (moderne Leerzeichen-Syntax) */
color: rgb(26 60 110 / 50%);     /* mit Alpha */
color: hsl(215 62% 26%);         /* Farbton, Saettigung, Helligkeit */
color: oklch(0.35 0.09 255);     /* wahrnehmungsgleich: Helligkeit, Chroma, Farbton */
background: color-mix(in oklch, #1a3c6e 70%, white);
```

> **Ergänzung aus der Nachrecherche: Farbräume: sRGB, Display-P3, OKLCH**
>
> Klassische Notationen (Hex, `rgb`, `hsl`) beschreiben den Farbraum *sRGB*. Moderne Displays können mehr (*Display-P3*). `oklch()` ist wahrnehmungsorientiert: gleiche Helligkeits-Schritte *wirken* gleich hell, deshalb eignet es sich gut für Farbpaletten, Hover-Zustände (`color-mix`) und Kontrastplanung. Nach der Nachrecherche (flaviocopes.com, Stand 9/2026) sind `oklch()` und `color-mix()` *widely available*. Dennoch sRGB-Fallback bei kritischen Werten bereitstellen.

**Kontrast (WCAG 1.4.3 / 1.4.11):** Normaler Text mindestens **4,5:1**, großer Text (ab 24 px oder 18,66 px fett) mindestens **3:1**; Bedienelemente, Rahmen und Icons mindestens **3:1**. Prüfen mit den DevTools (Farbwähler zeigt Kontrast), WebAIM Contrast Checker oder Stark. Information niemals *nur* über Farbe vermitteln (WCAG 1.4.1): Fehler zusätzlich mit Icon und Text kennzeichnen.

## Custom Properties, Design Tokens und Theming

**Custom Properties** („CSS-Variablen“) beginnen mit `--`, sind vererbbar, zur Laufzeit änderbar (auch per JavaScript) und mit `var()` nutzbar:

```css
:root {
  --color-primary: #1a3c6e;
  --color-bg: #ffffff;
  --color-text: #1b1b1b;
  --space-1: .25rem; --space-2: .5rem; --space-3: 1rem; --space-4: 2rem;
  --radius: .5rem;
  --font-body: system-ui, sans-serif;
}
.button {
  background: var(--color-primary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  color: var(--btn-text, #fff);       /* zweiter Wert = Fallback */
}
```

**Design Tokens** sind benannte, plattformunabhängige Entscheidungen (Farbe, Abstand, Typografie, Radius, Schatten). Zwei Ebenen bewähren sich:

1.  **Primitive/Referenz-Tokens:** `–blue-700: #1a3c6e;` (Rohwerte, reine Palette).

2.  **Semantische Tokens:** `--color-primary: var(--blue-700);` (Bedeutung/Zweck). Komponenten verwenden *nur* semantische Tokens.

Dadurch lässt sich das Erscheinungsbild an einer Stelle ändern. Für den Austausch zwischen Design-Tool (z. B. Figma) und Code gibt es das *Design Tokens Community Group*-Format (JSON) und Werkzeuge wie Style Dictionary.

**Theming:**

```css
:root { color-scheme: light dark; }
:root { --bg: #fff; --text: #1b1b1b; }
@media (prefers-color-scheme: dark) { :root { --bg: #121212; --text: #eee; } }
[data-theme="dark"] { --bg: #121212; --text: #eee; }   /* manueller Umschalter */
body { background: var(--bg); color: var(--text); }
/* Kurzform: */  body { background: light-dark(#fff, #121212); }
```

> **Ergänzung aus der Nachrecherche: @property: typisierte Variablen**
>
> Mit `@property –winkel { syntax: "<angle>"; inherits: false; initial-value: 0deg; }` werden Custom Properties typisiert, haben Standardwerte und lassen sich animieren (z. B. Farbverläufe oder Winkel). Wertvoll für Theming und Animationen (Modul 15).

## Komponenten und Designsystem-Grundlagen

Eine *Komponente* ist ein wiederverwendbarer UI-Baustein mit definierter Struktur, Varianten und Zuständen (Button, Karte, Formularfeld, Navigation, Modal). Ein **Designsystem** ist die Summe aus: Tokens (Grundwerte), Komponentenbibliothek (Code), Mustern (Patterns, z. B. Formularlayout), Richtlinien (Voice & Tone, Accessibility) und Governance (Wer darf ändern? Wie wird versioniert?).

> **Praxisbeispiel: Button-Komponente mit Varianten und Zuständen**
>
> ```css
.btn {
  --btn-bg: var(--color-primary);
  --btn-fg: #fff;
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  min-height: 2.75rem;                        /* grosse Klickflaeche */
  border: 2px solid var(--btn-bg);
  border-radius: var(--radius);
  background: var(--btn-bg); color: var(--btn-fg);
  font: inherit; cursor: pointer;
}
.btn:hover        { background: color-mix(in oklch, var(--btn-bg), black 15%); }
.btn:focus-visible{ outline: 3px solid var(--color-focus); outline-offset: 2px; }
.btn:disabled     { opacity: .5; cursor: not-allowed; }
.btn--secondary   { --btn-bg: transparent; --btn-fg: var(--color-primary); }
```
>
> ```html
<button class="btn">Speichern</button>
<button class="btn btn--secondary">Abbrechen</button>
```

## Übungen

1.  Schreibe ein Typografie-Grundgerüst: Schriftstack, `rem`-Basis, Zeilenhöhe, Textbreite.

2.  Erstelle für eine Überschrift eine fluide Schriftgröße zwischen 28 und 48 px (Viewport 320 bis 1280 px) mit `clamp()`.

3.  Welche Kontrastverhältnisse verlangt WCAG AA für normalen Text und für UI-Elemente?

4.  Definiere Tokens für Primärfarbe, Hintergrund, Text und einen Dark Mode, der über `prefers-color-scheme` umgeschaltet wird.

5.  Erkläre den Unterschied zwischen primitiven und semantischen Tokens an einem Beispiel.

## Lösungen

1.  Siehe Beispiel „Text Styling“ (`system-ui`-Stack, `line-height: 1.5`, `max-width: 65ch`).

2.  z. B. `font-size: clamp(1.75rem, 1.4rem + 1.5vw, 3rem);` (28 px = 1,75 rem; 48 px = 3 rem). Der mittlere Term mit `rem` sichert die Zoombarkeit.

3.  4,5:1 für normalen Text, 3:1 für großen Text und für Bedienelemente/Grafikobjekte (1.4.11).

4.  Siehe Beispiel „Theming“; die Tokens liegen auf `:root`, der Dark Mode überschreibt sie in `@media (prefers-color-scheme: dark)`.

5.  Primitiv: `–blue-700: #1a3c6e` (nur ein Wert). Semantisch: `--color-primary: var(--blue-700)` (Zweck). Ändert man das Branding, tauscht man nur das primitive Token aus.
