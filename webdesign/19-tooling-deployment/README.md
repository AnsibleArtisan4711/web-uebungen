# Modul 19: Tooling, Deployment und Wartung

Etappe im Portfolio: Tooling und Deployment: Build nach `dist/` mit PostCSS, Autoprefixer, cssnano und esbuild, Hash-Dateinamen, CI-Workflow, Git-Hook, Lint-Kette, Werkzeuge für Linkcheck und Gesundheitscheck, Wartungs- und Release-Vorlagen.

Lehrplan: 17 Stunden, Priorität 2. Pro Unterkapitel gibt es eine Übung.

Das zugehörige Kapitel des Skripts: [skript.md](skript.md) (aus LaTeX umgewandelt).

## Übungen

| Nr | Übung | Lehrplan | Zeit |
|---|---|---|---|
| 19.1 | [Git-Workflow](19.1-git-workflow.md) | 19.2 | 75 Min |
| 19.2 | [Build-Tools, PostCSS, Autoprefixing und Minification](19.2-build-tools-postcss-autoprefixing-minification.md) | 19.3 | 90 Min |
| 19.3 | [Critical CSS und Render-Blocking](19.3-critical-css-und-render-blocking.md) | 19.4 | 90 Min |
| 19.4 | [CMS-Grundlagen und Hosting](19.4-cms-grundlagen-und-hosting.md) | 19.5 | 75 Min |
| 19.5 | [CI/CD und Release-Management](19.5-ci-cd-und-release-management.md) | 19.6 | 120 Min |
| 19.6 | [Monitoring, Wartungsplan und DevTools Performance](19.6-monitoring-wartungsplan-devtools-performance.md) | 19.7 | 120 Min |
| 19.7 | [CSS-Linting und Formatierung](19.7-css-linting-und-formatierung.md) | 19.8 | 90 Min |

Die Nummern der Übungen zählen nur die Inhalts-Unterkapitel (der Lehrplan-Abschnitt „Überblick“ hat keine Übung).

## Fertiger Stand

[`../portfolio/modul-19/`](../portfolio/modul-19/)

## Etappen-Abnahme

Das Modul ist abgeschlossen, wenn Folgendes zutrifft:

- [ ] `npm ci` und `npm run build` laufen sauber durch; `dist/` enthält nur die Seite, mit Hash-Dateinamen
- [ ] `npm run lint`, `npm run format:pruefen`, `npm test` und `npm run security` laufen ohne Befund
- [ ] Das gebaute Ergebnis wurde mit dem Quellstand verglichen (Pixelvergleich, axe, CSP-Probe)
- [ ] Die Repository-Dateien `.gitignore`, `.gitattributes`, `.editorconfig`, `.githooks/pre-commit` und `.github/workflows/ci.yml` liegen im Hauptordner
- [ ] Die Vorlagen `docs/git-workflow.md`, `hosting-entscheidung.md`, `release-checkliste.md` und `wartungsplan.md` sind ausgefüllt, offene Punkte stehen als offen da
- [ ] Der CI-Workflow wurde auf GitHub einmal wirklich ausgeführt (das konnte ich nicht prüfen)

Weiter mit Modul 20: Qualitätssicherung, Validierung und Wartbarkeit.
