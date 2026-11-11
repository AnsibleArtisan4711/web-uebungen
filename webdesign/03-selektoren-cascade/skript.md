# Modul 3: Selektoren, Cascade und Specificity

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 9 h \| **Priorität:** 1 \| **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Lerneinheit**                 | **Dauer (h)** | **Prio** |
|:--------------------------------|--------------:|---------:|
| Type-, Class- und ID-Selektoren |             1 |        1 |
| Attributselektoren              |             1 |        1 |
| Pseudo-Klassen                  |           1,5 |        1 |
| Pseudo-Elemente                 |             1 |        1 |
| Combinators                     |             1 |        1 |
| Specificity                     |           1,5 |        2 |
| Inheritance und Cascade         |             1 |        2 |
| Cascade Layers und Scope        |             1 |        2 |
| **Summe**                       |         **9** |          |

## Überblick

CSS-Regeln konkurrieren: Mehrere Selektoren treffen dasselbe Element, mehrere Deklarationen setzen dieselbe Eigenschaft. Die *Cascade* entscheidet deterministisch, welche gewinnt. Wer Selektoren, Specificity und Cascade versteht, muss kaum mit `!important` arbeiten.

## Grundselektoren und Attributselektoren

```css
p            { }  /* Typ-Selektor: alle <p> */
.karte       { }  /* Klassen-Selektor: class="karte" */
```

```css
/* ID-Selektor: id="kopf" (einmalig pro Seite) */
#kopf        { }
*            { }  /* Universalselektor */
a[href]      { }  /* hat Attribut */
a[href^="https"] { }  /* beginnt mit */
a[href$=".pdf"]  { }  /* endet mit */
a[href*="beispiel"] { }  /* enthält */
input[type="email"] { }
[data-state="open"] { }
a[target="_blank" i] { }  /* Wert ohne Gross-/Kleinschreibung */
```

**Empfehlung:** Für Styling Klassen verwenden (`.karte`); IDs sind wegen hoher Spezifität unflexibel und eher für Anker und Label-Verknüpfungen gedacht. Typ-Selektoren eignen sich für Basis-Styles (`body`, `a`, `h1`).

## Pseudo-Klassen und Pseudo-Elemente

**Pseudo-Klassen** beschreiben einen *Zustand* oder eine *Position* (ein Doppelpunkt).

```css
a:hover        { }  /* Maus darueber */
a:focus-visible { outline: 3px solid #1a73e8; }  /* Tastaturfokus */
input:disabled { }
input:checked + label { }
li:first-child, li:last-child { }
li:nth-child(odd) { }       /* Zebra */
li:nth-child(3n + 1) { }    /* jedes dritte ab dem ersten */
input:user-invalid { }      /* erst nach Eingabe ungueltig */
:not(.aktiv)   { }
:is(h1, h2, h3) a { }       /* Gruppierung, Spezifitaet = hoechster */
:where(ul, ol) li { }       /* wie :is, Spezifitaet 0 */
.karte:has(img) { }         /* Elternselektor */
```

**Pseudo-Elemente** erzeugen oder adressieren *Teile* eines Elements (zwei Doppelpunkte): `::before`, `::after` (mit `content`), `::first-line`, `::first-letter`, `::placeholder`, `::marker`, `::selection`, `::backdrop`.

```css
a[href^="http"]::after { content: " \2197"; }  /* Pfeil nach externen Links */
```

> **Ergänzung aus der Nachrecherche: :has(), :is() und :focus-visible**
>
> `:has()` (der „Elternselektor“) ist inzwischen in allen großen Browsern verfügbar (laut MDN/Baseline Stand 2026 *widely available*) und ersetzt viel JavaScript, z. B. `form:has(:invalid) button { opacity: .5 }`. `:focus-visible` zeigt den Fokus nur bei Tastaturbedienung und ist der empfohlene Weg, Fokus-Styles zu setzen, statt `outline: none` zu verwenden (Modul 14). `:is()` und `:where()` verkürzen Selektorlisten; `:where()` hat die Spezifität 0 und ist ideal für überschreibbare Basis-Styles.

## Combinators

| **Schreibweise** | **Name**    | **Wirkung**                              |
|:-----------------|:------------|:-----------------------------------------|
| `A B`         | Nachfahre   | B irgendwo innerhalb von A               |
| `A > B`         | Kind        | B direktes Kind von A                    |
| `A + B`         | Nachbar     | B folgt direkt auf A (gleiche Ebene)     |
| `A ~ B`         | Geschwister | B folgt irgendwann auf A (gleiche Ebene) |

```css
nav a { }            /* alle Links in nav */
ul > li { }          /* nur direkte li-Kinder */
h2 + p { margin-top: 0; }
.stack > * + * { margin-top: 1rem; }  /* "lobotomized owl": Abstand zwischen Geschwistern */
```

## Specificity

Die Spezifität wird als Tripel **(A, B, C)** verglichen (von links nach rechts):

- **A** = Anzahl ID-Selektoren,

- **B** = Anzahl Klassen, Attribute und Pseudo-Klassen,

- **C** = Anzahl Typ-Selektoren und Pseudo-Elemente.

Inline-Styles schlagen alle Selektoren; `*` und Combinators zählen 0; `:where()` zählt 0; `:is()`/`:not()`/`:has()` zählen wie ihr spezifischstes Argument.

| **Selektor**  | **(A,B,C)** | **Anmerkung**                    |
|:--------------|:-----------:|:---------------------------------|
| `p`      |   (0,0,1)   |                                  |
| `.karte p`      |   (0,1,1)   |                                  |
| `nav a:hover`      |   (0,1,2)   | Pseudo-Klasse zählt in B         |
| `ul li.aktiv a`      |   (0,1,3)   |                                  |
| `#kopf .logo` |   (1,1,0)   | schlägt jede Klassen-Kombination |
| `a::after`      |   (0,0,2)   | Pseudo-Element zählt in C        |

> **Merke**
>
> Zehn Klassen schlagen *keine* ID: Die Werte werden nicht addiert wie Dezimalzahlen, sondern spaltenweise verglichen. (0,10,0) ist kleiner als (1,0,0).

## Vererbung und Cascade

**Vererbung (Inheritance):** Manche Eigenschaften erben vom Elternelement (v. a. Text: `color`, `font-*`, `line-height`, `text-align`), andere nicht (Box: `margin`, `padding`, `border`, `background`). Steuerung: `inherit`, `initial`, `unset`, `revert`.

**Reihenfolge der Cascade** (Entscheidung von oben nach unten, die erste Stufe mit Unterschied gewinnt):

1.  **Herkunft und Wichtigkeit** (Origin und Importance): Browser-Standard, Nutzer-Styles, Autor-Styles; `!important` dreht die Reihenfolge um (Transitions/Animationen haben eigene Stufen).

2.  **Cascade Layers** (`@layer`): ein später deklarierter Layer gewinnt; für `!important` umgekehrt.

3.  **Spezifität.**

4.  **Reihenfolge im Quelltext** (spätere Regel gewinnt).

> **Praxisbeispiel: Welche Farbe hat der Link?**
>
> ```css
a            { color: black; }   /* (0,0,1) */
.menu a      { color: blue;  }   /* (0,1,1) */
a:hover      { color: red;   }   /* (0,1,1) */
```
>
> Bei Hover treffen die zweite und dritte Regel mit gleicher Spezifität zu: die spätere (`a:hover`) gewinnt, der Link wird rot. Würde `a:hover` *vor* `.menu a` stehen, bliebe er blau.

## Cascade Layers und Scope

**Cascade Layers** geben Entwicklern Kontrolle über die Priorität *unabhängig von der Spezifität*:

```css
@layer reset, base, components, utilities;   /* Reihenfolge festlegen */

@layer reset      { * { margin: 0; } }
@layer base       { a { color: #1a3c6e; } }
@layer components { .nav a { color: #fff; } }
@layer utilities  { .text-red { color: red; } }   /* gewinnt, egal wie spezifisch die Layer davor sind */
```

Styles *ohne* Layer gewinnen gegen alle Layer. Ideal, um Drittanbieter-CSS (z. B. Bibliotheken) in einen niedrigen Layer zu verschieben.

**Scope (`@scope`):** begrenzt Regeln auf einen Teilbaum, mit optionaler Untergrenze („Donut“).

```css
@scope (.karte) to (.karte-inhalt) {
  img { border-radius: 8px; }   /* nur im Bereich zwischen .karte und .karte-inhalt */
}
```

> **Ergänzung aus der Nachrecherche: Verfügbarkeit von @scope und Nesting**
>
> Nach dem Stand der Nachrecherche (Quelle flaviocopes.com, 21. 9. 2026) ist natives CSS-Nesting und `@layer` *widely available*, `@scope` seit März 2026 *newly available*. `@scope` daher noch als Verbesserung einsetzen oder gegen Zielbrowser testen.

```css
.karte {
  padding: 1rem;
  & h2 { font-size: 1.25rem; }        /* natives Nesting */
  &:hover { box-shadow: 0 2px 8px #0003; }
}
```

## Debugging von CSS-Konflikten

1.  Element in den DevTools untersuchen (*Elements*/*Styles*): durchgestrichene Deklarationen verlieren, Filter „Computed“ zeigt den berechneten Wert samt Herkunftsregel.

2.  Prüfen: Selektor trifft überhaupt? (Tippfehler, falsche Verschachtelung, Stylesheet geladen?)

3.  Spezifität und Reihenfolge vergleichen; im Zweifel Selektor *vereinfachen* statt `!important` zu nutzen.

4.  Layer-Reihenfolge und `@media`-Bedingungen prüfen.

5.  Fehlerhafte Werte (ungültige Deklaration) werden vom Browser stillschweigend verworfen und erscheinen als Warnung in den DevTools.

## Übungen

1.  Berechne die Spezifität: (a) `ul.menu li a:hover`, (b) `#nav a`, (c) `:where(.a, .b) p`, (d) `a::before`.

2.  Welche Farbe erhält der Absatz? `p.info {color: green}` und `.box p {color: blue}` bei `<div class="box"><p class="info">`.

3.  Wähle alle externen Links per Attributselektor aus.

4.  Formuliere einen Selektor für „jede zweite Tabellenzeile“ und für „Eingabefeld, das nach der Eingabe ungültig ist“.

5.  Warum ist ein `!important` meist ein Zeichen für ein Architekturproblem? Wie löst man es mit Layern?

## Lösungen

1.  \(a\) (0,2,3) \[1 Klasse + 1 Pseudo-Klasse = 2 in B; `ul, li, a` = 3 Typen\]; (b) (1,0,1); (c) (0,0,1) \[`:where` zählt 0; nur `p`\]; (d) (0,0,2).

2.  Beide Regeln: `p.info` = (0,1,1), `.box p` = (0,1,1), also gleich. Die spätere im Quelltext gewinnt; steht `.box p` unten, ist der Text blau.

3.  `a[href^="http"]` bzw. genauer mit `:not([href*="meine-domain.at"])`.

4.  `tr:nth-child(even)`, bzw. `input:user-invalid`.

5.  Es wird eingesetzt, weil die Spezifitäten eskaliert sind. Besser: Struktur mit `@layer` (Reihenfolge entscheidet statt Spezifität), flache Selektoren (BEM, Modul 17) und `:where()` für Basis-Styles.
