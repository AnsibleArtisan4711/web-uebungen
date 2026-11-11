# Browser-Support-Policy (Beispiel)

Eine Policy beantwortet vorab: **Welche Browser müssen funktionieren, welche nur lesbar bleiben, welche ignorieren wir?**

## Festlegung

| Stufe | Browser | Erwartung |
|---|---|---|
| A (voll unterstützt) | jeweils die 2 neuesten Versionen von Chrome, Edge, Firefox, Safari und iOS Safari | alle Funktionen, Layout wie entworfen |
| B (lesbar) | ältere Versionen innerhalb der Autoprefixer-Abfrage `> 0.5%, last 2 versions, not dead` (siehe `package.json`) | Inhalt les- und bedienbar, Layout darf einfacher sein |
| C (nicht unterstützt) | Internet Explorer, Opera Mini im Extremmodus u. a. | wird nicht getestet |

Die zwei Abfragen sind **verschieden gewollt**: Autoprefixer soll großzügig Präfixe ergänzen (Stufe B), die Funktionsprüfung gilt der Stufe A (`.stylelintrc.browser.json`). Die Browserliste ändert sich mit jeder Version der Datenbank `caniuse-lite`; die Policy nennt deshalb Regeln statt fester Versionsnummern.

## Technik: Progressive Enhancement mit `@supports`

Neue Eigenschaften werden so eingesetzt, dass ein Browser ohne Unterstützung eine brauchbare Grundfassung zeigt:

```css
.karten { display: flex; flex-wrap: wrap; gap: 1rem; }      /* Grundfassung */
@supports (display: grid) {
  .karten { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); }
}
```

## Prüfung

`npm run css:browser` (Stylelint-Plug-in `stylelint-no-unsupported-browser-features` mit den Browsern der Stufe A). Gemessen auf dieser Seite: **5 Warnungen, 0 Fehler**:

| Fundstelle | Meldung | Einschätzung |
|---|---|---|
| `03-base.css` `::selection` | „css-selection“ in iOS Safari nicht unterstützt | harmlos: Auswahlfarbe ist reine Zierde |
| `06-utilities.css` `clip-path: inset(50%)` | teilweise unterstützt | harmlos: Teil des `visually-hidden`-Musters, wirkt in allen aktuellen Browsern |
| `button.css` `cursor: not-allowed` | in iOS Safari nicht unterstützt | harmlos: Touch-Geräte haben keinen Mauszeiger |
| `kopf.css` `column-gap` | „multicolumn“ teilweise | **vermutlich Fehlalarm**: `column-gap` wird dort in Flexbox/Grid genutzt, das Plug-in ordnet es der Mehrspaltigkeit zu |
| `tabelle.css` `break-inside: avoid` | „multicolumn“ teilweise | harmlos: nur für den Druck |

Mit der Abfrage aus `package.json` (`> 0.5%, last 2 versions, not dead`) meldete dasselbe Plug-in **379 Warnungen**, überwiegend wegen „Opera Mini all“ (zum Beispiel „calc“ und CSS-Variablen). Eine zu breite Browserliste macht das Werkzeug unbrauchbar: Die Policy muss festlegen, **wofür** geprüft wird.

Echte Geräte und Browser wurden **nicht** getestet (siehe Testplan).
