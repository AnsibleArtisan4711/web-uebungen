# Portfolio: Stand nach Modul 21

Ein persönliches Portfolio mit Platzhalterinhalten: Startseite, Lebenslauf, Projekte, Blog, Kontakt, Styleguide, Impressum und Datenschutz (Vorlagen, keine Rechtsberatung). Dieser Stand ergänzt Modul 20 um den Blick auf Betrieb und Projekt: Kostenrechner, Umleitungsprüfung für einen Relaunch, Suche nach veraltetem Markup, Inventar externer Ressourcen, Governance-Regeln als automatische Tests, ein verschlüsseltes Backup mit Wiederherstellungstest und eine Notfallseite (Wartungsmodus des Testservers).

## Zweck

Lernprojekt aus der Webdesign-Übungsreihe. Inhalte sind Platzhalter; es gehören keine echten Namen, Adressen oder Zugangsdaten ins Repository.

## Voraussetzungen

- Node.js 22 oder neuer (`node -v`)
- Für `npm run validate:w3c`: Java (`java -version`)
- Für `npm run e2e` und `tools/pixelvergleich.py` : ein Playwright-Browser (`npx playwright install chromium`)

## Installation

```
npm ci            Abhängigkeiten genau nach package-lock.json installieren
npm run build     dist/ erzeugen
npm run serve     Testserver auf http://localhost:8080 (npm run serve:dist für den Build)
```

Im Hauptordner des Repositories einmalig: `git config core.hooksPath .githooks`.

## Befehle

```
npm run lint            Stylelint und ESLint
npm run format:pruefen  Prettier prüft die Formatierung
npm run validate:html   html-validate über alle Seiten
npm run validate:w3c    W3C Nu Html Checker (lokal, braucht Java); Standard: dist/
npm run namen           Dateinamen und Klassennamen prüfen
npm run doku            Pflichtteile der Dokumentation und Verweise prüfen
npm run css             css/main.css aus css/src/ bauen
npm run css:pruefen     prüfen, ob css/main.css aktuell ist
npm test                Tests (Logik, CSS-Regeln, Build)
npm run security        statische Sicherheitsprüfung
npm run build           dist/ bauen
npm run links           interne Links prüfen (npm run links -- dist für den Build)
npm run budget          Größenbudget (npm run budget -- dist für den Build)
npm run e2e:baseline    Baseline-Screenshots auf diesem Rechner anlegen
npm run e2e             Browser-Tests (Ablauf und Aussehen); vorher npm run build
npm run css:browser     Funktionsprüfung gegen die Browser der Support-Policy (Warnungen)
npm run kosten -- docs/kosten/firmenwebsite.json   Kostenkalkulation
npm run redirects       Umleitungstabelle prüfen (docs/relaunch/)
npm run legacy -- DATEI veraltetes Markup und CSS suchen
npm run drittanbieter   externe Ressourcen auflisten
npm run backup          dist/ als Archiv sichern (verschlüsselt, wenn BACKUP_PASSPHRASE gesetzt ist)
npm run restore:pruefen -- ARCHIV ZIEL [VERGLEICH]   Wiederherstellung testen
```

Betriebsmodi des Testservers (Umgebungsvariablen):

```
UMLEITUNGEN=docs/relaunch/url-mapping.csv node tools/server.js 8080 dist   alte Adressen antworten 301/410
WARTUNG=1 node tools/server.js 8080                                        jede Adresse antwortet 503 mit wartung.html
```

Unter Windows gilt diese Schreibweise nicht: In der Eingabeaufforderung `set WARTUNG=1` und danach `node tools/server.js 8080`, in PowerShell `$env:WARTUNG = "1"` und danach `node tools/server.js 8080`. Die Windows-Schreibweise wurde nicht getestet.

## Struktur

```
css/src/        CSS-Quellen (Ebenen), css/main.css ist daraus gebaut
js/             Skripte (logik.js, main.js)
tools/          Prüf- und Bauwerkzeuge (Server, Build, Checks)
tests/          Unit-Tests;  e2e/  Browser-Tests mit Playwright
docs/           Review-Checkliste, ADRs, Betriebshandbuch, Testplan, Wartungsplan, Kosten, Relaunch, Migration,
                Governance, Drittanbieter, Browser-Policy, Backup-Konzept, Notfallplan, Vorlagen
experimente/    Experiment zum Datenabfluss per CSS (nur lokal, nicht Teil des Builds)
beispiele/      Beispielcode für den Betrieb, zum Beispiel kontakt-php (Kontaktformular mit PHP, nicht Teil des Builds)
wartung.html    statische Notfallseite
CONTRIBUTING.md Konventionen
```

## Veröffentlichung

Noch offen. Entscheidungsgrundlage und Release-Checkliste mit Rollback stehen in `docs/hosting-entscheidung.md` und `docs/release-checkliste.md`. Ein Beispiel-Workflow für GitHub Pages liegt unter `docs/beispiel-deploy.yml` und wurde nicht ausgeführt.

## Konventionen

Siehe [`CONTRIBUTING.md`](CONTRIBUTING.md): Namen, Formatierung, Ablauf einer Änderung, Review mit [`docs/review-checkliste.md`](docs/review-checkliste.md).

## Ansprechpersonen

Rollen statt Namen: Technik und Inhalte. Eintragen, sobald das Projekt einen Betreiber hat (siehe `docs/betriebshandbuch.md`).

## Hinweise

- `dist/`, `node_modules/`, `backups/` und die Baseline-Bilder (`e2e/__baseline__/`) gehören nicht ins Repository (`.gitignore` im Hauptordner).
- Die CI-Datei liegt als `ci-workflow/ci.yml` im Hauptordner und muss vor dem ersten Push nach `.github/workflows/ci.yml` verschoben werden. Sie wurde auf GitHub nicht ausgeführt.
- Getestet wurde nur in Chromium. Firefox, Safari, reale Geräte und Bildschirmleser sind nicht geprüft.
- Die Beispiel-Domain `https://example.com/portfolio/` in Sitemap und Metadaten ist ein Platzhalter.
