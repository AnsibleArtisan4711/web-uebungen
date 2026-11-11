# Modul 17: Architektur, Methodik und Designsysteme

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 9 h \| **Priorität:** 2 \| **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Lerneinheit**    | **Dauer (h)** | **Prio** |
|:-------------------|--------------:|---------:|
| CSS-Architektur    |             1 |        2 |
| BEM                |             1 |        2 |
| ITCSS und Layering |           1,5 |        2 |
| Utility CSS        |             1 |        2 |
| Component Styling  |             1 |        2 |
| Cascade Layers     |           1,5 |        3 |
| Styleguide         |             1 |        3 |
| Refactoring        |             1 |        3 |
| **Summe**          |         **9** |          |

## Überblick

Mit wachsendem Projekt wird CSS unübersichtlich: überlange Selektoren, `!important`-Ketten, Duplikate, Angst vor Änderungen. CSS-Architektur sorgt mit Konventionen, Struktur und Prioritätsregeln dafür, dass Styles vorhersehbar, wiederverwendbar und für Teams wartbar bleiben.

## Ziele und Prinzipien der CSS-Architektur

- **Vorhersehbarkeit:** Änderung an einer Stelle hat keine unerwarteten Nebenwirkungen.

- **Geringe Spezifität:** flache Selektoren, überwiegend Klassen; keine IDs und keine tiefen Verschachtelungen.

- **Wiederverwendbarkeit:** Komponenten statt seitenspezifischer Sonderregeln.

- **Skalierbarkeit:** klare Ordnerstruktur, einheitliche Benennung, dokumentierte Entscheidungen.

- **Trennung von Zuständigkeiten:** Tokens, Basis, Layout, Komponenten, Hilfsklassen.

## BEM – Block, Element, Modifier

BEM ist eine Namenskonvention: `block__element–modifier`.

```html
<article class="karte karte--hervorgehoben">
  <img class="karte__bild" src="a.jpg" alt="">
  <h2 class="karte__titel">Titel</h2>
  <a class="karte__link button button--primary" href="/mehr/">Mehr</a>
</article>
```

```css
.karte { border: 1px solid #ddd; padding: 1rem; }
.karte__titel { font-size: 1.25rem; }
.karte--hervorgehoben { border-color: #1a3c6e; }
.button--primary { background: #1a3c6e; color: #fff; }
```

| **Teil**           | **Bedeutung**                                              |
|:-------------------|:-----------------------------------------------------------|
| Block              | Eigenständige Komponente (`.karte`, `.menu`)                |
| Element (`__`)     | Teil eines Blocks, nur im Block sinnvoll (`.karte__titel`) |
| Modifier (`--`) | Variante oder Zustand (`.karte--hervorgehoben`, `.button--gross`)                   |

**Vorteile:** jede Regel hat Spezifität (0,1,0), Zuständigkeit ist am Namen erkennbar, kein Kollisionsrisiko. **Regeln:** Elemente nicht verschachteln (`.karte__kopf__titel` vermeiden, stattdessen `.karte__titel`), Blöcke sind kontextunabhängig, Layout-Eigenschaften (Position, Außenabstand) besser vom Container steuern lassen.

## ITCSS und Layering

*Inverted Triangle CSS* ordnet CSS nach **wachsender Spezifität und sinkender Reichweite**:

1.  **Settings:** Tokens/Variablen.

2.  **Tools:** Mixins/Funktionen (bei Präprozessoren).

3.  **Generic:** Reset, `box-sizing`.

4.  **Elements:** Basis-Styles für HTML-Elemente (`h1`, `a`).

5.  **Objects:** layoutbezogene, gestaltungsfreie Muster (`.o-container`, `.o-stack`).

6.  **Components:** Komponenten (`.c-karte`).

7.  **Utilities/Trumps:** Hilfsklassen, dürfen alles überschreiben (`.u-hidden`).

```text
css/
  main.css            (importiert alle Teile in dieser Reihenfolge)
  01-settings/tokens.css
  02-generic/reset.css
  03-elements/typografie.css
  04-objects/container.css
  05-components/karte.css  button.css  navigation.css
  06-utilities/utilities.css
```

## Cascade Layers als Architektur-Werkzeug

`@layer` setzt das ITCSS-Prinzip *technisch* durch, ohne Spezifitätswettlauf:

```css
@layer settings, generic, elements, objects, components, utilities;

@import url("tokens.css") layer(settings);          /* Dateien in Layer laden */
@layer components { .karte { padding: 1rem; } }
@layer utilities  { .u-mt-0 { margin-top: 0; } }     /* gewinnt immer gegen components */
```

Drittanbieter-CSS in einen frühen Layer (`@layer vendor`) legen: Eigener Code gewinnt automatisch, ohne `!important`. Hinweis: ungelayerte Styles gewinnen gegen alle Layer.

## Utility CSS und Component Styling

**Utility-first** (z. B. Tailwind CSS): viele kleine Einzweck-Klassen direkt im HTML (`class="flex gap-4 p-4"`).

| **Vorteile**                                                                                | **Nachteile**                                                                                                 |
|:--------------------------------------------------------------------------------------------|:--------------------------------------------------------------------------------------------------------------|
| Schnelle Entwicklung, kein Benennen, kleines CSS durch Wiederverwendung, konsistente Tokens | Langer, schwer lesbarer Klassen-Code im Markup, Disziplin bei Wiederverwendung (Komponenten) nötig, Lernkurve |

**Praxis:** Auch ohne Framework sind wenige Utilities sinnvoll (`.visually-hidden`, `.stack`, `.cluster`). **Component Styling** kann per BEM-CSS, CSS Modules, `@scope`, Shadow DOM (Web Components) oder Utilities erfolgen; entscheidend ist *ein* im Team vereinbarter Weg. Varianten per Modifier-Klasse oder Custom Property (`--btn-bg`) abbilden.

```css
/* Layout-Primitive "Stack": vertikaler Rhythmus ohne Margin-Wildwuchs */
.stack { display: flex; flex-direction: column; gap: var(--stack-gap, 1rem); }
```

## Styleguide und Refactoring

**Styleguide** (lebende Dokumentation): Tokens, Komponenten mit Varianten und Zuständen, Code-Snippets, Do/Don’t, Accessibility-Hinweise. Werkzeuge: Storybook, Pattern Lab, Zeroheight, eigene Seite im Projekt.

**Refactoring-Vorgehen:** (1) Bestandsaufnahme (CSS-Statistiken, Coverage, Duplikate, Spezifitätsgraph), (2) Tokens extrahieren (Farben, Abstände, Schriften), (3) Komponenten identifizieren und umbenennen (BEM), (4) Spezifität senken, `!important` abbauen, (5) in Layer ordnen, (6) schrittweise migrieren (Strangler-Muster: neue Komponenten sauber, alte Stück für Stück ersetzen), (7) *visuelle Regressionstests* sichern jede Etappe, (8) Linting-Regeln erzwingen (Stylelint).

## Übungen

1.  Benenne die BEM-Klassen für eine Karte mit Titel, Bild und hervorgehobener Variante.

2.  Warum ist eine flache Spezifität wünschenswert?

3.  Ordne `reset`, `.u-hidden`, `.c-karte`, Tokens, `h1`-Styles in ITCSS-Reihenfolge.

4.  Wie lagerst du Bibliotheks-CSS aus, damit dein CSS immer gewinnt?

5.  Nenne je zwei Vor- und Nachteile von Utility-CSS.

## Lösungen

1.  `.karte`, `.karte__titel`, `.karte__bild`, `.karte--hervorgehoben`.

2.  Weniger Überschreibungskonflikte, einfachere Wartung, kein `!important`-Wettrüsten, Wiederverwendbarkeit.

3.  Tokens → Reset → `h1`-Styles → `.c-karte` → `.u-hidden`.

4.  In einen niedrigen `@layer vendor` legen, eigene Layer danach (oder ungelayert).

5.  Vorteile: Geschwindigkeit, Konsistenz. Nachteile: lange Klassenlisten im Markup, Disziplin für Komponenten.
