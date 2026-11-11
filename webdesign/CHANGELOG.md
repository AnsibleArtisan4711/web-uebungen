# Changelog

Alle nennenswerten Änderungen am Kurs-Repository. Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionen nach [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

### Hinzugefügt

- Kapitel des Skripts als Markdown: `skript.md` in jedem der 21 Modulordner, `docs/skript-einleitung.md` und `docs/skript-quellenverzeichnis.md` (aus der LaTeX-Quelle umgewandelt, 107 Codebeispiele zeichengleich geprüft)
- Beispiel `beispiele/kontakt-php/` (Kontaktformular mit PHP, ohne Datenbank) mit Tests; der Build schließt `beispiele/` aus und der Build-Test prüft jetzt auch `e2e/`, `CONTRIBUTING.md` und `playwright.config.js`
- Lizenzen: MIT für den Code (`LICENSE`), CC BY 4.0 für die Texte (`LICENSE-DOCS.md`); Abschnitt „Lizenz“ in der README

## [0.21.1]

### Behoben

- Die CI-Prüfung `npm run budget` schlug fehl: Alle Bilder (PNG, WebP, AVIF), die in dieses Repository übertragen wurden, tragen einen eingebetteten Herkunftsnachweis (C2PA, rund 5,7 KB je Datei). Beispiel `avatar.png`: 18 635 Byte vor, 24 405 Byte nach der Übertragung; `projekt-a-1600.png` 18 123 → 23 893 Byte. Drei PNG lagen dadurch über dem Budget von 20 KB.
- Das Budget für PNG-Ersatzformate liegt jetzt bei 26 KB; WebP und AVIF bleiben bei 20 KB. Der Herkunftsnachweis bleibt in den Bildern erhalten.

## [0.21.0]

### Hinzugefügt

- Modul 21: Kostenrechner (`kosten.js`), Umleitungsprüfung (`redirect-check.js`), Suche nach veraltetem Markup (`legacy-check.js`), Inventar externer Ressourcen (`drittanbieter-check.js`)
- Backup mit Verschlüsselung und Wiederherstellungstest (`backup.js`, `restore-pruefen.js`), Notfallseite `wartung.html`
- Testserver: Umleitungsmodus (`UMLEITUNGEN`) und Wartungsmodus (`WARTUNG`)
- Governance-Regeln als Tests, Browser-Funktionsprüfung (`npm run css:browser`, Stylelint-Plug-in), Experiment zum Datenabfluss per CSS
- Dokumente: Kosten, Relaunch-Checkliste, Roadmap, Migrations-Inventar, Governance, Drittanbieter, Browser-Policy, Backup-Konzept, Notfallplan

### Behoben

- `dist/` enthielt seit Modul 20 versehentlich `e2e/`, `CONTRIBUTING.md`, `playwright.config.js` und `.htmlvalidate.json`; der Build schließt sie jetzt aus (in Modul 20 selbst nicht korrigiert)

### Geändert

- Pre-commit-Hook und CI-Vorlage zeigen auf `portfolio/modul-21`; CI prüft zusätzlich die Umleitungstabelle

## [0.20.0]

### Hinzugefügt

- Modul 20: Validierung mit html-validate und dem W3C Nu Html Checker (lokal), `naming-check.js`, `doku-check.js`
- Browser-Tests mit Playwright Test (Ablauf und Aussehen), Testplan, Review-Checkliste, Pull-Request-Vorlage
- `CONTRIBUTING.md`, Entscheidungsprotokolle (ADRs), Betriebshandbuch als Vorlage

### Geändert

- Scroll-Wrapper um Tabellen: `section` zu `div role="region"` (W3C-Warnung „Section lacks heading“ beseitigt)
- Klasse `formular` zu `js-formular`; zwei tote CSS-Regeln entfernt (`main.css` 23 923 → 23 755 Byte)
- Pre-commit-Hook und CI-Vorlage zeigen auf `portfolio/modul-20` und prüfen zusätzlich HTML und Namen

## [0.19.0]

### Hinzugefügt

- Modul 19: Build nach `dist/` (PostCSS, Autoprefixer, cssnano, esbuild, Hash-Dateinamen)
- CI-Workflow `.github/workflows/ci.yml`, Pre-commit-Hook in `.githooks/`
- Werkzeuge `linkcheck.js` und `gesundheitscheck.js`
- Stylelint mit `stylelint-config-standard`, ESLint und Prettier

### Geändert

- Quelldateien mit Prettier formatiert und mit Stylelint bereinigt (das minimierte Ergebnis ist unverändert)
- Der Testserver liefert Fehlerseiten (404, 403) mit Sicherheits-Headern aus

## [0.18.0]

### Hinzugefügt

- Modul 18: Content Security Policy, gehärtetes Formular, Impressum und Datenschutz als Vorlage, `security-check.js`
