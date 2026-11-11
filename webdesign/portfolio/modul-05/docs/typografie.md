# Typografie und Webfonts

## Entscheidung

Das Portfolio nutzt vorerst den **System-Schriftstack** (`system-ui, -apple-system, "Segoe UI", sans-serif`). Vorteile: keine Ladezeit, keine Datenschutzfrage durch externe Schrift-Server, gute Lesbarkeit.

## Regeln

- Schrift und Abstände in `rem`, damit die Einstellung der Nutzenden wirkt
- Zeilenhöhe einheitenlos: 1,5 im Fließtext, 1,2 in Überschriften
- Zeilenlänge höchstens `65ch`
- Fluide Überschriften mit `clamp()` und einer `rem`-Komponente (reine `vw`-Schrift lässt sich nicht zoomen, Verstoß gegen WCAG 1.4.4)
- `text-wrap: balance` für Überschriften, `text-wrap: pretty` für Absätze
- `hyphens: auto` mit `lang="de"`

## Webfont einbinden (Vorlage, noch nicht aktiv)

```css
@font-face {
  font-family: "Inter";
  src: url("../fonts/inter-var.woff2") format("woff2");
  font-weight: 100 900;      /* Variable Font */
  font-style: normal;
  font-display: swap;
}
```

Bei einem späteren Wechsel: nur selbst gehostete WOFF2-Dateien (Datenschutz und Performance, siehe Modul 16 und 18), die Lizenz der Schrift prüfen und eine Fallback-Schrift mit angepassten Metriken definieren.
