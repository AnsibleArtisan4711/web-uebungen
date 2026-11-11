# Modul 18: Security, Datenschutz und Compliance im Webdesign

Etappe im Portfolio: Security und Datenschutz: sichere Header, XSS-Schutz, CSP, gehärtetes Formular, Impressum und Datenschutz als Vorlage, Security-Review.

Lehrplan: 14.5 Stunden, Priorität 1. Pro Unterkapitel gibt es eine Übung.

Das zugehörige Kapitel des Skripts: [skript.md](skript.md) (aus LaTeX umgewandelt).

## Übungen

| Nr | Übung | Lehrplan | Zeit |
|---|---|---|---|
| 18.1 | [HTTPS und sichere Defaults](18.1-https-und-sichere-defaults.md) | 18.2 | 75 Min |
| 18.2 | [XSS-Grundlagen und XSS-Risiken](18.2-xss-grundlagen-und-xss-risiken.md) | 18.3 | 90 Min |
| 18.3 | [Content Security Policy](18.3-content-security-policy.md) | 18.4 | 90 Min |
| 18.4 | [Sichere Formulare](18.4-sichere-formulare.md) | 18.5 | 90 Min |
| 18.5 | [iframe-Sandbox, Referrer-Policy und Permissions-Policy](18.5-iframe-sandbox-referrer-policy-permissions-policy.md) | 18.6 | 120 Min |
| 18.6 | [Cookies, Consent, DSGVO, Datenschutz im Markup und Abhängigkeiten](18.6-cookies-consent-dsgvo-datenschutz-im-markup-abhaengigkeiten.md) | 18.7 | 150 Min |
| 18.7 | [Security-Review](18.7-security-review.md) | 18.8 | 60 Min |

Die Nummern der Übungen zählen nur die Inhalts-Unterkapitel (der Lehrplan-Abschnitt „Überblick“ hat keine Übung).

## Fertiger Stand

[`../portfolio/modul-18/`](../portfolio/modul-18/)

## Etappen-Abnahme

Das Modul ist abgeschlossen, wenn Folgendes zutrifft:

- [ ] Alle Seiten enthalten eine CSP per `<meta>` und ein Referrer-Policy-Meta
- [ ] Der Testserver sendet Sicherheits-Header und prüft das Formular serverseitig
- [ ] Impressum und Datenschutz sind von jeder Seite erreichbar und als Vorlage gekennzeichnet
- [ ] `npm run security` meldet keine Probleme
- [ ] Die Experimente (XSS, CSP, Sandbox, Referrer, Permissions, Einwilligung, SRI) sind durchgespielt
- [ ] `docs/security-review.md` und `docs/datenschutz-checkliste.md` sind ausgefüllt, offene Punkte stehen als offen da

Weiter mit Modul 19: Tooling, Deployment und Wartung.
