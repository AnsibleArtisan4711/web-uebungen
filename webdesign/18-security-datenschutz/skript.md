# Modul 18: Security, Datenschutz und Compliance im Webdesign

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 14,5 h \| **Priorität:** 1 \| **Lerneinheiten:** 13

## Lerneinheiten laut Lehrplan

| **Lerneinheit**            | **Dauer (h)** | **Prio** |
|:---------------------------|--------------:|---------:|
| HTTPS und sichere Defaults |             1 |        1 |
| XSS-Grundlagen             |             1 |        1 |
| Content Security Policy    |           1,5 |        1 |
| Cookies und Consent        |             1 |        1 |
| DSGVO-Basis                |             1 |        1 |
| Sichere Formulare          |           1,5 |        2 |
| Abhängigkeiten             |             1 |        2 |
| Security Review            |             1 |        2 |
| XSS-Risiken                |             1 |        1 |
| iframe Sandbox             |             1 |        1 |
| Referrer Policy            |             1 |        1 |
| Permissions Policy         |           1,5 |        2 |
| Datenschutz im Markup      |             1 |        2 |
| **Summe**                  |      **14,5** |          |

## Überblick

Webseiten laufen im Browser fremder Menschen, verarbeiten Eingaben und binden Dritte ein. Daraus entstehen Sicherheitsrisiken (XSS, manipulierte Skripte, Datenabfluss) und rechtliche Pflichten (DSGVO, Einwilligung). Prinzipien: *Defense in Depth* (mehrere Schutzschichten), *Least Privilege* (nur nötige Rechte), *Privacy by Design* (Datenschutz von Anfang an), *Secure by Default*.

## HTTPS und sichere Defaults

**HTTPS** (HTTP über TLS) verschlüsselt Übertragung, sichert Integrität und Authentizität. Es ist Voraussetzung für moderne Browser-APIs (Service Worker, Geolocation, Kamera) und wirkt auf SEO.

- Zertifikat (z. B. Let’s Encrypt, automatische Erneuerung), HTTP → HTTPS per 301 umleiten.

- **HSTS** (`Strict-Transport-Security: max-age=31536000; includeSubDomains`) erzwingt HTTPS im Browser.

- **Mixed Content** vermeiden (HTTP-Ressourcen auf HTTPS-Seiten werden blockiert).

- **Cookies** mit `Secure`, `HttpOnly`, `SameSite=Lax/Strict` setzen.

- Weitere Header: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`, Clickjacking-Schutz mit `frame-ancestors`.

## XSS-Grundlagen und XSS-Risiken

**Cross-Site Scripting (XSS):** Angreifer schleust JavaScript in eine Seite ein, das im Namen des Nutzers läuft (Sessiondiebstahl, Formulare manipulieren, Weiterleitungen).

| **Art**   | **Beschreibung**                                                              |
|:----------|:------------------------------------------------------------------------------|
| Reflected | Schadcode steckt in der URL/Anfrage und wird sofort in die Antwort übernommen |
| Stored    | Schadcode wird gespeichert (Kommentar, Profil) und trifft alle Besucher       |
| DOM-based | Clientseitiges Skript schreibt unsicher in das DOM (`innerHTML`)                  |

```javascript
// UNSICHER: Eingabe wird als HTML interpretiert
element.innerHTML = new URLSearchParams(location.search).get("name");
// SICHER: als Text behandeln
element.textContent = new URLSearchParams(location.search).get("name");
```

**Abwehr:**

1.  **Ausgabe kontextabhängig kodieren** (HTML, Attribut, URL, JavaScript, CSS): Template-Engines mit Auto-Escaping nutzen.

2.  Eingaben *validieren* (Allow-List), aber nicht allein darauf vertrauen.

3.  Gefährliche APIs meiden: `innerHTML`, `outerHTML`, `document.write`, `eval`, `insertAdjacentHTML` mit Fremddaten; wo HTML nötig ist, mit einem Sanitizer (z. B. DOMPurify) bereinigen.

4.  **Content Security Policy** als zweite Schutzschicht.

5.  Cookies mit `HttpOnly` schützen Sessiontokens vor Skriptzugriff.

## Content Security Policy (CSP)

Die CSP legt per HTTP-Header oder Meta-Tag fest, *woher* Ressourcen geladen werden dürfen:

```text
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-r4nd0m123';
  style-src 'self';
  img-src 'self' data: https://cdn.beispiel.at;
  font-src 'self';
  connect-src 'self' https://api.beispiel.at;
  frame-src https://www.youtube-nocookie.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
```

- `default-src 'self'`: Grundregel; weitere Direktiven spezialisieren.

- Inline-Skripte werden blockiert; statt `'unsafe-inline'` besser **Nonce** (pro Antwort zufällig) oder **Hash**; Skripte in Dateien auslagern.

- Erst im Modus `Content-Security-Policy-Report-Only` testen, Verstöße über `report-to` auswerten, dann scharf schalten.

- Ziel: keine `'unsafe-inline'`/`'unsafe-eval'` für Skripte; `'strict-dynamic'` mit Nonces für moderne Setups.

> **Ergänzung aus der Nachrecherche: Subresource Integrity (SRI)**
>
> Bei Skripten oder Stylesheets von Fremdservern sichert ein Hash, dass die Datei unverändert ist: `<script src="https://cdn.example/lib.js" integrity="sha384-..." crossorigin="anonymous"></script>`. Wird die Datei manipuliert, blockiert der Browser sie. Besser: Bibliotheken selbst hosten und Abhängigkeiten pflegen.

## Sichere Formulare

- **Serverseitige Validierung** jeder Eingabe (Typ, Länge, Format) und Bereinigung bei Ausgabe.

- **CSRF-Schutz:** Token pro Formular/Sitzung und `SameSite`-Cookies.

- `method="post"` für Änderungen; keine sensiblen Daten in URLs (GET).

- Passwörter: `type="password"`, `autocomplete="new-password"`/`"current-password"`, serverseitig mit modernem Hash (Argon2, bcrypt) speichern, Einfügen erlauben (Passwort-Manager).

- Spamschutz: Honeypot-Feld, Rate-Limiting, datenschutzfreundliche Captcha-Alternativen.

- Datei-Uploads: Typ und Größe serverseitig prüfen, außerhalb des Webroots speichern, nicht ausführbar machen.

- Nur HTTPS-Ziele im `action`; Datenschutzhinweis und ggf. Einwilligungs-Checkbox am Formular.

## iframe Sandbox, Referrer Policy, Permissions Policy

```html
<iframe src="https://widget.example.org" sandbox="allow-scripts allow-same-origin"
        referrerpolicy="strict-origin-when-cross-origin" loading="lazy" title="Terminbuchung"></iframe>
```

- **`sandbox`** (ohne Werte) sperrt fast alles; nur nötige Rechte mit `allow-*` öffnen. `allow-scripts` und `allow-same-origin` *gleichzeitig* auf derselben Origin heben die Sandbox praktisch auf.

- **Referrer-Policy:** steuert, wie viel von der URL beim Navigieren/Laden übermittelt wird. Empfehlung: `strict-origin-when-cross-origin` (Browser-Standard); bei Datenschutzbedarf `no-referrer`. Auch per Header setzbar.

- **Permissions Policy:** beschränkt Browserfunktionen für Seite und eingebettete Frames: `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`; bei iframes mit `allow="..."`.

- `rel="noopener"` bei `target="_blank"` (moderne Browser setzen es implizit), `rel="noreferrer"` unterdrückt den Referrer.

## Cookies, Consent, DSGVO-Basis, Datenschutz im Markup

> **Ergänzung aus der Nachrecherche: Rechtlicher Überblick (keine Rechtsberatung)**
>
> Die **DSGVO** gilt für personenbezogene Daten, dazu zählen auch IP-Adressen, Cookie-IDs und Geräte-Kennungen. Wichtige Grundsätze: Rechtmäßigkeit (Art. 6: z. B. Einwilligung, Vertrag, berechtigtes Interesse), Transparenz (Art. 13: Datenschutzerklärung), Zweckbindung, Datenminimierung, Speicherbegrenzung, Integrität und Vertraulichkeit (Art. 32). Für nicht notwendige Cookies/Tracking ist in Österreich nach dem Telekommunikationsgesetz (§ 165 TKG 2021) und in Deutschland nach dem TDDDG grundsätzlich eine *vorherige Einwilligung* nötig; die Einwilligung muss freiwillig, informiert, spezifisch und widerrufbar sein (Art. 7). Das Landgericht München I hat 2022 entschieden, dass das dynamische Einbinden von Google Fonts ohne Einwilligung unzulässig sein kann (IP-Übermittlung): Schriften daher selbst hosten.

**Technisch:**

- **Cookie-/Consent-Banner** (Consent Management Platform): „Ablehnen“ so einfach wie „Akzeptieren“, keine vorausgewählten Häkchen, Skripte *erst nach Einwilligung* laden, Widerruf jederzeit möglich, Einwilligung protokollieren.

- **Notwendige Cookies** (Session, Warenkorb, Consent-Speicher) brauchen keine Einwilligung.

- **Drittanbieter-Einbettungen** (Karten, Videos, Social-Media): Zwei-Klick-Lösung/Platzhalter, `youtube-nocookie.com`, lokale Hosts, Auftragsverarbeitungsvertrag prüfen.

- **Datenschutz im Markup:** keine personenbezogenen Daten in URLs/Ids, `autocomplete` bewusst setzen, `referrerpolicy`, Tracking-Pixel nur nach Einwilligung, Impressum und Datenschutzerklärung von jeder Seite erreichbar (in Österreich: Impressumspflicht nach ECG/MedienG).

- **Abhängigkeiten** (npm, CDN-Bibliotheken): regelmäßig prüfen (`npm audit`, Dependabot/Renovate), Lockfile nutzen, wenige und gepflegte Pakete, Schutz vor Supply-Chain-Angriffen.

## Security Review (Checkliste)

1.  HTTPS überall, HSTS aktiv, keine Mixed-Content-Warnungen?

2.  Sicherheits-Header gesetzt (CSP, Referrer-Policy, Permissions-Policy, nosniff, frame-ancestors)? Test z. B. mit securityheaders.com.

3.  Kein `innerHTML`/`eval` mit Fremddaten? Auto-Escaping im Template?

4.  Formulare: Server-Validierung, CSRF-Token, Rate-Limit, Upload-Prüfung?

5.  Cookies mit `Secure`/`HttpOnly`/`SameSite`? Consent vor Tracking?

6.  Drittanbieter minimiert, `sandbox`/SRI/`referrerpolicy` gesetzt?

7.  Abhängigkeiten aktuell und geprüft? Fehlerseiten ohne technische Details?

## Übungen

1.  Erkläre den Unterschied zwischen Reflected, Stored und DOM-based XSS.

2.  Schreibe eine CSP, die nur eigene Skripte und Bilder von `cdn.beispiel.at` erlaubt.

3.  Warum ist `element.innerHTML = benutzerEingabe` gefährlich? Was ist die sichere Alternative?

4.  Was bewirkt `sandbox` bei iframes, und welche Kombination ist problematisch?

5.  Darf ein Statistik-Skript beim ersten Seitenaufruf geladen werden? Begründe.

## Lösungen

1.  Reflected: Schadcode aus der Anfrage wird sofort gespiegelt; Stored: dauerhaft gespeichert, trifft viele Nutzer; DOM-based: entsteht im Browser durch unsicheres DOM-Schreiben ohne Serverbeteiligung.

2.  `default-src 'self'; img-src 'self' https://cdn.beispiel.at; script-src 'self'; object-src 'none'`.

3.  Die Eingabe wird als HTML/Skript interpretiert (XSS). Sicher: `textContent` bzw. bereinigen mit Sanitizer.

4.  Beschränkt Rechte des eingebetteten Inhalts (keine Skripte, Formulare, Popups, …). Problematisch: `allow-scripts` + `allow-same-origin` bei gleicher Origin.

5.  Nein, sofern es Tracking/nicht notwendige Cookies setzt oder personenbezogene Daten überträgt: Erst nach informierter Einwilligung laden (außer es handelt sich um ein anonymisiertes, rechtlich geprüftes, einwilligungsfreies Verfahren).
