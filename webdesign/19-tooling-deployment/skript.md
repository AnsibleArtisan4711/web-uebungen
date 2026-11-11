# Modul 19: Tooling, Deployment und Wartung

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 17 h \| **Priorität:** 2 \| **Lerneinheiten:** 15

## Lerneinheiten laut Lehrplan

| **Lerneinheit**      | **Dauer (h)** | **Prio** |
|:---------------------|--------------:|---------:|
| Git Workflow         |             1 |        2 |
| Build Tools          |             1 |        2 |
| CMS-Grundlagen       |           1,5 |        2 |
| Hosting              |             1 |        2 |
| CI/CD                |             1 |        2 |
| Release Management   |           1,5 |        3 |
| Monitoring           |             1 |        3 |
| Wartungsplan         |             1 |        3 |
| Critical CSS         |             1 |        2 |
| Render Blocking      |             1 |        2 |
| Minification         |           1,5 |        2 |
| PostCSS              |             1 |        2 |
| Autoprefixing        |             1 |        2 |
| CSS Linting          |           1,5 |        3 |
| DevTools Performance |             1 |        3 |
| **Summe**            |        **17** |          |

## Überblick

Professionelle Webprojekte werden nicht per FTP-Upload einzelner Dateien betrieben, sondern mit Versionsverwaltung, automatisierten Builds, reproduzierbarem Deployment und laufender Überwachung. Das Ziel: Änderungen schnell, sicher und rückholbar ausliefern.

## Git Workflow

*Git* speichert den Verlauf jeder Änderung und ermöglicht paralleles Arbeiten.

```bash
git clone https://git.beispiel.at/web/projekt.git
git switch -c feature/kontaktformular        # Branch anlegen
git add -A && git commit -m "feat: Kontaktformular mit Validierung"
git push -u origin feature/kontaktformular   # dann Pull Request / Merge Request oeffnen
git switch main && git pull                  # aktuellen Stand holen
git revert <commit>                          # Aenderung sauber zurueckrollen
```

- **Branching:** `main` ist immer lauffähig; neue Arbeit in kurzlebigen Feature-Branches (GitHub Flow) oder *Trunk-Based Development* mit kleinen, häufigen Merges.

- **Commits:** klein, thematisch, mit aussagekräftiger Nachricht (z. B. *Conventional Commits*: `feat:`, `fix:`, `docs:`).

- **Pull Requests und Reviews:** Vier-Augen-Prinzip, automatische Prüfungen (CI) vor dem Merge.

- `.gitignore` für `node_modules/`, Build-Ausgaben, lokale Konfiguration; **keine Geheimnisse** (Passwörter, API-Keys) committen.

- Releases mit Tags (`v1.4.0`, Semantic Versioning); Rollback durch Zurücksetzen auf den letzten guten Tag.

## Build Tools, PostCSS, Autoprefixing, Minification

**Package Manager und Bundler:** `npm`/`pnpm` verwalten Abhängigkeiten (`package.json`, Lockfile), **Vite**, esbuild, Webpack oder Rollup bündeln, minifizieren und transformieren.

```bash
npm create vite@latest meine-seite
cd meine-seite && npm install
npm run dev        # lokaler Entwicklungsserver mit Hot Reload
npm run build      # optimierte Dateien in dist/
```

- **PostCSS:** verarbeitet CSS mit Plug-ins (Autoprefixer, `postcss-preset-env`, `cssnano`).

- **Autoprefixing:** ergänzt automatisch Herstellerpräfixe *anhand der Browserliste*: `"browserslist": ["> 0.5%", "last 2 versions", "not dead"]`. Heute selten noch nötig, aber bequem.

- **Minification:** entfernt Leerraum und Kommentare, kürzt Namen (CSS, JS, HTML, SVG): oft 20–60 % weniger Bytes; zusammen mit Brotli noch kleiner. Source Maps erhalten Debugbarkeit.

- Moderne Alternative: **Lightning CSS** (sehr schnell, Nesting/Prefixing/Minify in einem).

```javascript
// postcss.config.js
export default { plugins: { autoprefixer: {}, cssnano: { preset: "default" } } };
```

## Critical CSS und Render Blocking

CSS blockiert das Rendering. **Critical CSS** ist der Teil, der für den sichtbaren Bereich („above the fold“) nötig ist; er wird inline im `<head>` ausgeliefert, der Rest nicht-blockierend nachgeladen.

```html
<style>/* Critical CSS: Header, Hero, Basis-Typografie */ body{margin:0;font:1rem/1.5 system-ui}</style>
<link rel="preload" href="/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/css/main.css"></noscript>
```

Werkzeuge generieren Critical CSS automatisiert (z. B. das npm-Paket `critical`, Plug-ins für Vite/Webpack). Bei kleinem Gesamt-CSS (unter ca. 20–30 KB) genügt oft ein einziges, gecachtes Stylesheet. Weitere Maßnahmen gegen Blockierung: `media`-Attribut für Teilstylesheets (`media="print"`), JavaScript mit `defer`, Drittanbieter spät laden.

## CMS-Grundlagen, Hosting

| **Ansatz**            | **Beispiele**                        | **Merkmale**                                                                |
|:----------------------|:-------------------------------------|:----------------------------------------------------------------------------|
| Klassisches CMS       | WordPress, TYPO3, Joomla, Drupal     | Redaktion im Backend, Themes/Templates, Plug-ins; regelmäßige Updates nötig |
| Headless CMS          | Strapi, Contentful, Directus, Sanity | Inhalte per API, Frontend frei wählbar                                      |
| Static Site Generator | Eleventy, Astro, Hugo, Jekyll        | Vorab erzeugte HTML-Dateien: schnell, sicher, günstig                       |
| Website-Baukasten     | Wix, Squarespace, Webflow            | Schnell, geringe Kontrolle                                                  |

**Wahl nach:** Redaktionsbedarf, Budget, Wartungsaufwand, Skalierung, Sicherheit, Datenschutz (Serverstandort EU), vorhandenes Know-how. **Hosting:** Shared Hosting, VPS/Root-Server, Managed Hosting, Plattformen/Static Hosting (z. B. Netlify, Cloudflare Pages, GitHub Pages), Container/Cloud. Prüfpunkte: Standort/AVV (DSGVO), Backups, SLA, HTTP/2/3, Staging-Umgebung, SSH/Git-Deployment, Skalierung, Kosten.

## CI/CD, Release Management

*Continuous Integration* baut und testet jede Änderung automatisch, *Continuous Delivery/Deployment* liefert geprüfte Stände automatisch aus.

```yaml
# .github/workflows/ci.yml (Beispiel GitHub Actions)
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run lint          # Stylelint, ESLint, HTML-Validierung
      - run: npm test              # Unit-/Accessibility-Tests
      - run: npm run build
```

**Umgebungen:** Entwicklung → Staging (produktionsnah, Abnahme) → Produktion. **Release-Management:** Versionierung, Changelog, Freigabeprozess, Deployment-Zeitfenster, Rollback-Plan, *Feature Flags*, Blue-Green- oder Canary-Deployments, Cache-Invalidierung (Hash-Dateinamen). **Wichtig:** Deployments müssen *wiederholbar* und *rückgängig machbar* sein.

## Monitoring, Wartungsplan, DevTools Performance

- **Verfügbarkeit:** Uptime-Monitoring mit Alarmierung (z. B. UptimeRobot, Statuspage), TLS-Ablaufwarnung, Domain-Verlängerung.

- **Fehler:** Fehlerprotokolle serverseitig, JavaScript-Fehler-Tracking (z. B. Sentry), 404-/5xx-Auswertung.

- **Performance:** Real User Monitoring und Lab-Tests (Modul 16), Lighthouse CI mit Budgets.

- **Wartungsplan:** regelmäßig Updates (CMS, Plug-ins, Abhängigkeiten, PHP/Node), Sicherheitspatches, Backups prüfen (Restore-Test, Modul 21), Linkcheck, Content-Review, Accessibility-/SEO-Stichproben, Zertifikate und Domains. Zuständigkeiten und Intervalle festhalten (monatlich/quartalsweise/jährlich).

**DevTools Performance:** Aufnahme starten, Seite laden/interagieren, dann Flammendiagramm lesen: lange Tasks (rote Markierung über 50 ms), *Layout*-/*Paint*-Ereignisse, Skriptausführung, Layout-Shifts, Main-Thread-Auslastung. Mit CPU-Drosselung testen; *Coverage* zeigt ungenutztes CSS/JS.

## CSS Linting und Formatierung

**Stylelint** erzwingt Regeln (gültige Eigenschaften, keine Duplikate, Reihenfolge, Namenskonvention), **Prettier** formatiert einheitlich, **ESLint** prüft JavaScript; **EditorConfig** vereinheitlicht Editoreinstellungen. Einbindung als Pre-Commit-Hook (Husky/lint-staged) und in der CI.

```javascript
// .stylelintrc.json (vereinfacht, als JSON gedacht)
{ "extends": ["stylelint-config-standard"],
  "rules": { "selector-class-pattern": "^[a-z][a-z0-9]*(__[a-z0-9-]+)?(--[a-z0-9-]+)?$",
             "declaration-no-important": true } }
```

## Übungen

1.  Beschreibe einen Git-Ablauf von der Idee bis zum Merge in `main`.

2.  Was ist Critical CSS und wie wird der Rest geladen?

3.  Welche Hosting-/CMS-Variante passt für eine kleine Vereinswebsite mit seltenen Änderungen? Begründe.

4.  Nenne vier Schritte einer CI-Pipeline für ein Webprojekt.

5.  Erstelle einen Wartungsplan mit mindestens fünf Punkten und Intervallen.

## Lösungen

1.  Feature-Branch anlegen, committen, pushen, Pull Request, Review und automatische Checks, Merge in `main`, Tag/Deployment, bei Fehlern Revert.

2.  Kritische Styles des sichtbaren Bereichs inline im `head`; restliches CSS nicht-blockierend (preload mit `onload`) oder normal gecacht laden.

3.  Statische Seite (Static Site Generator/Static Hosting) oder einfaches Managed-WordPress: wenig Wartung, günstig, sicher, schnell; Headless/Enterprise-CMS wären überdimensioniert.

4.  Checkout, `npm ci`, Lint (Stylelint/ESLint/HTML-Validierung), Tests (inkl. Accessibility), Build, Deployment auf Staging/Produktion.

5.  z. B.: Updates monatlich, Backup-Restore-Test quartalsweise, Linkcheck monatlich, Zertifikats-/Domain-Check laufend, Accessibility- und SEO-Audit jährlich.
