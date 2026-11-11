# ADR 0003: Build nach dist/ mit PostCSS, esbuild und Hash-Dateinamen

- Status: angenommen (Kursannahme)
- Datum: 2026-11-07
- Beteiligte: Autor des Portfolios

## Kontext

Das Stylesheet hat 23 923 Byte, ausgeliefert werden sollen kleine Dateien mit langer Cache-Dauer. Ein Build, der aus demselben Stand immer dieselben Dateien erzeugt, macht Rollbacks verlässlich (Übung 19.5).

## Entscheidung

`npm run build` erzeugt `dist/` mit Autoprefixer und cssnano (PostCSS), esbuild für JavaScript und einem Hash im Dateinamen. Hash-Dateien werden ein Jahr gecacht (`immutable`), HTML-Seiten mit `no-cache`.

## Alternativen

- Lightning CSS: in der Messung 13 732 statt 13 855 Byte und etwa 0,9 statt 39 ms; nicht gewählt, weil die Zeit bei dieser Dateigröße keine Rolle spielt und PostCSS für Erweiterungen bekannter ist. (Das ist eine Abwägung, kein Beweis; Pixelvergleich nur für PostCSS.)
- Vite oder Webpack: für diese Seitenzahl überdimensioniert (nicht ausprobiert).
- Kein Build: einfacher, aber größere Dateien und kein Cache-Busting.

## Konsequenzen

- Zusätzliche Abhängigkeiten (Dev) und ein Build-Schritt vor der Veröffentlichung.
- `dist/` gehört nicht ins Repository, die CI baut es.
- Tests prüfen Reproduzierbarkeit und genau eine Source-Map-Angabe je CSS-Datei.
