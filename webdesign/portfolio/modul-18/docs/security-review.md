# Security-Review (Vorlage)

Projekt: ______________  Datum: ______________  Geprüft von: ______________  Stand (Commit): ______________

Trage bei jedem Punkt ein, **wie** du geprüft hast (Befehl, Werkzeug, Messwert). „Sieht gut aus“ zählt nicht. Was du nicht prüfen konntest, schreibst du als „nicht geprüft“ hin.

| # | Prüfpunkt | Ergebnis (ok / offen / nicht geprüft) | Beleg (Befehl, Messwert, Link) |
|---|---|---|---|
| 1 | HTTPS überall, HSTS aktiv, keine Mixed-Content-Warnungen | | |
| 2 | Header: CSP, Referrer-Policy, Permissions-Policy, `nosniff`, `frame-ancestors` | | |
| 3 | Kein `innerHTML`, `eval`, `document.write` mit Fremddaten (`npm run security`) | | |
| 4 | Formulare: Server-Validierung, Rate-Limit, Honeypot, CSRF-Schutz (falls Sitzung) | | |
| 5 | Cookies: `Secure`, `HttpOnly`, `SameSite`; Einwilligung vor nicht notwendigen Cookies | | |
| 6 | Drittanbieter minimiert; `sandbox`, SRI, `referrerpolicy` gesetzt | | |
| 7 | Abhängigkeiten geprüft (`npm audit`, Lockfile), Fehlerseiten ohne technische Details | | |
| 8 | Impressum und Datenschutzerklärung von jeder Seite erreichbar | | |

## Gefundene Probleme

| Nr | Problem | Schwere (hoch / mittel / niedrig) | Maßnahme | Verantwortlich | Frist |
|---|---|---|---|---|---|
| | | | | | |

## Nicht geprüft

- 

## Beispiel: Dependabot-Konfiguration (nicht getestet)

Lege sie in einem GitHub-Repository als `.github/dependabot.yml` ab. Sie lässt Dependabot wöchentlich nach veralteten npm-Paketen suchen.

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```
