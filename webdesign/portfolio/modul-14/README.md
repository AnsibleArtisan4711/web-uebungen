# Portfolio: Stand nach Modul 14

Neu: Skip Link über dem Kopf, Skip-Ziel `main[tabindex="-1"]`, größere Checkboxen (24 px, schrumpfen nicht mehr), größere Links in Überschriften, Kontrastmodus (`forced-colors`), `prefers-contrast`, `.visually-hidden`, `experimente/dialog.html` und `medien.html`, Prüfprotokolle.

## Prüfen

Tastaturtest: `docs/tastaturtest.md`. Screenreader: `docs/screenreader-test.md` (nicht von mir durchgeführt). Review: `docs/a11y-audit.md`. Weiterhin `npm test` und `node tools/seo-check.js`.

## Struktur

```
modul-14/
  index.html, lebenslauf/, projekte/, blog/, kontakt/, styleguide/, 404.html
  css/main.css            Skip-Link-z-index, forced-colors, prefers-contrast
  docs/                   tastaturtest, screenreader-test, a11y-audit
  experimente/dialog.html natives Dialogfenster mit Fokusrückgabe
  experimente/medien.html Video mit Untertiteln, Audio mit Transkript (lokaler Server nötig)
```
