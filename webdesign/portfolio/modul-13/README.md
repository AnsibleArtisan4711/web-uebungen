# Portfolio: Stand nach Modul 13

Neu: eindeutige Titel und Beschreibungen, Canonical, Open Graph, Favicons und Manifest, JSON-LD, `robots.txt`, `sitemap.xml`, Brotkrumen, `404.html`, `tools/seo-check.js`.

**Wichtig:** Die Adresse `https://example.com/portfolio/` ist ein Platzhalter. Ersetze sie vor dem Veröffentlichen überall (Modul 19).

## Prüfen

```
node tools/seo-check.js      # Node ab 20, keine Abhängigkeiten
npm test
```

## Struktur

```
modul-13/
  index.html, lebenslauf/, projekte/, blog/, kontakt/, styleguide/, 404.html
  robots.txt, sitemap.xml, manifest.webmanifest, favicon.ico, icon.svg, apple-touch-icon.png
  img/og-bild.png, img/icon-192.png, img/icon-512.png
  tools/seo-check.js
  docs/seo-audit.md
```
