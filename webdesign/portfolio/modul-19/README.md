# Portfolio: Stand nach Modul 19

Neu: Build nach `dist/` (PostCSS, Autoprefixer, cssnano, esbuild, Hash-Dateinamen, Source Map), Lint-Kette (Stylelint mit `stylelint-config-standard`, ESLint, Prettier), `package-lock.json`, Werkzeuge `linkcheck.js`, `gesundheitscheck.js`, `css-abdeckung.py`, Build-Tests, Experimente zu Render-Blocking und langen Aufgaben, Vorlagen für Git-Workflow, Hosting, Release und Wartung. Der Testserver liefert Fehlerseiten jetzt mit Sicherheits-Headern. Nur Platzhalterinhalte.

Im **Hauptordner des Repositories** (zwei Ebenen höher) liegen neu: `.gitignore`, `.gitattributes`, `.editorconfig`, `.githooks/pre-commit`, `.github/workflows/ci.yml` und `CHANGELOG.md`.

**Wichtig:** Der Workflow wird aus Sicherheitsgründen nicht direkt nach `.github/workflows/` geschrieben. Die Datei liegt als `ci-workflow/ci.yml` im Hauptordner. Vor dem ersten Push verschieben: `mkdir .github\workflows` und `move ci-workflow\ci.yml .github\workflows\ci.yml` (Windows) bzw. `mkdir -p .github/workflows && mv ci-workflow/ci.yml .github/workflows/`.

## Ansehen

`index.html` im Browser öffnen. Für Header, Experimente und den gebauten Stand braucht es den Testserver (`npm run serve`, bzw. `npm run serve:dist` nach `npm run build`).

## Erste Schritte

```
npm ci            Abhängigkeiten genau nach package-lock.json installieren (Node 22 oder neuer)
npm run build     dist/ erzeugen
npm run serve:dist
```

## Befehle

```
npm run lint            Stylelint und ESLint
npm run format:pruefen  Prettier prüft die Formatierung
npm run css             css/main.css aus css/src/ bauen
npm run css:pruefen     prüfen, ob css/main.css aktuell ist
npm test                Tests (Logik, CSS-Regeln, Build)
npm run security        statische Sicherheitsprüfung
npm run build           dist/ bauen
npm run links           interne Links prüfen (npm run links -- dist für den Build)
npm run budget          Größenbudget (npm run budget -- dist für den Build)
npm run serve           Testserver auf Port 8080
node tools/gesundheitscheck.js ADRESSE
python3 tools/css-abdeckung.py       (optional, Playwright nötig)
python3 tools/pixelvergleich.py ORDNER_VORHER ORDNER_NACHHER   (optional)
```

## Hinweise

- `dist/` und `node_modules/` gehören nicht ins Repository (`.gitignore`).
- Der CI-Workflow ist nicht auf GitHub ausgeführt worden. Die Action-Versionen (`@v4`) stammen aus dem Lehrplan; vor dem Einsatz prüfen.
- Die Beispiel-Domain `https://example.com/portfolio/` in Sitemap und Metadaten bleibt ein Platzhalter (siehe Modul 20/21).
