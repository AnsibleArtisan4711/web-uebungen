# Portfolio: Stand nach Modul 18

Neu: Content Security Policy und Referrer-Policy per `<meta>` auf allen Seiten, Sicherheits-Header im Testserver, gehärtetes Kontaktformular (serverseitige Prüfung, Honeypot, Rate-Limit), Seiten `impressum/` und `datenschutz/` als **Vorlage, keine Rechtsberatung**, Prüfwerkzeug `tools/security-check.js`, Experimente zu XSS, CSP, iframe-Sandbox, Referrer-Policy, Permissions-Policy, Einwilligung und SRI. Nur Platzhalterinhalte.

## Ansehen

`index.html` im Browser öffnen. Die Sicherheits-Header, das Formular und die Experimente brauchen den Testserver: `npm run serve`, dann `http://localhost:8080/`.

## Struktur

```
modul-18/
  impressum/, datenschutz/   Vorlagen mit Platzhaltern
  docs/                      security-review.md, datenschutz-checkliste.md (zum Ausfüllen)
  experimente/               xss-*.html, csp-test.html, iframe-sandbox.html, referrer.html,
                             permissions.html, einbettung.html, sri.html, fremd/
  tools/                     server.js (Header, Testrouten, Formular), security-check.js, weitere
```

## Befehle

```
npm run security      statische Sicherheitsprüfung der Seiten und von js/
npm test              Tests
npm run css:pruefen   prüfen, ob css/main.css aktuell ist
npm run budget        Größenbudget
npm run serve         Testserver auf Port 8080
```

## Hinweise

- Impressum und Datenschutz sind Vorlagen. Vor dem Echtbetrieb rechtlich prüfen lassen.
- Die Meta-CSP kann `frame-ancestors` und Report-Only nicht; dafür braucht es echte Header (Modul 19).
- CSRF-Schutz ist nicht umgesetzt (statische Seite ohne Sitzung).
