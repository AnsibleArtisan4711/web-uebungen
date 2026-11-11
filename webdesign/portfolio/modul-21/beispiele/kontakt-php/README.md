# Beispiel: Kontaktformular mit PHP, ohne Datenbank

Ein kleines Skript, das die Eingaben des Kontaktformulars prüft und als E-Mail an dich weiterleitet. Es speichert und protokolliert **nichts**. Gedacht für ein klassisches Webhosting mit PHP und Mailversand (zum Beispiel ein IONOS-Webhosting, ob dein Tarif beides enthält, musst du selbst prüfen).

**Status:** lokal getestet mit PHP 8.3 und dem eingebauten Server (`php -S`), siehe `tests/kontakt-php.test.js`. **Nicht getestet** sind der echte Mailversand mit `mail()`, ein echter Hoster und alle Mailserver-Eigenheiten (Zustellbarkeit, Spam-Ordner, SPF/DKIM).

## Dateien

| Datei | Zweck |
|---|---|
| `kontakt.php` | der Handler (Ziel des Formulars) |
| `config.beispiel.php` | Vorlage für die Einstellungen; Kopie `config.php` anlegen |

`config.php` enthält deine echte Adresse und steht in der `.gitignore`. Sie darf nie ins Repository.

## Einrichtung (Überblick)

1. `config.beispiel.php` nach `config.php` kopieren, `empfaenger`, `absender` und `danke_url` eintragen. Der Absender muss eine Adresse deiner **eigenen Domain** sein, sonst lehnen viele Mailserver die Mail ab.
2. Beide Dateien in dasselbe Verzeichnis auf dem Webspace hochladen. Besser wäre ein Verzeichnis, das nicht öffentlich ausgeliefert wird, für `config.php`; das hängt vom Hoster ab.
3. Im Formular `action="kontakt.php"` (mit passendem Pfad) setzen. Die Content Security Policy der Seite erlaubt mit `form-action 'self'` genau das eigene Verzeichnis.
4. `testmodus` muss in der echten `config.php` auf `false` stehen.
5. Mit einer Testnachricht prüfen, ob sie ankommt (auch im Spam-Ordner nachsehen).

## Was das Skript tut

- Es akzeptiert nur POST (sonst 405).
- Das versteckte Feld `website` ist eine Falle für Roboter: Ist es ausgefüllt, antwortet das Skript wie bei Erfolg, versendet aber nichts.
- Es prüft Name, E-Mail (`FILTER_VALIDATE_EMAIL`, lässt keine Zeilenumbrüche zu), Betreff (feste Auswahl), Rolle (feste Auswahl), Nachrichtenlänge und die Zustimmung zum Datenschutz. Das verhindert, dass jemand zusätzliche Mail-Kopfzeilen einschleust (Header Injection).
- Es begrenzt die Zahl der Nachrichten insgesamt pro Stunde (Standard 20). Gezählt wird ohne IP-Adressen, es entstehen also keine personenbezogenen Daten. Nachteil: Ein Angreifer kann damit auch echte Nachrichten blockieren.
- Bei Erfolg antwortet es mit 303 auf die Danke-Seite; ein Neuladen sendet das Formular nicht erneut.
- Antworten tragen Sicherheits-Header (`nosniff`, `no-store`, `frame-ancestors 'none'`).

## Datenschutz

Die Nachricht landet als E-Mail in deinem Postfach. Das ist eine Verarbeitung personenbezogener Daten und gehört in die Datenschutzerklärung (Zweck: Beantwortung der Anfrage, Speicherdauer deiner Mails, Hosting- und Mailanbieter). Im Formular sollte ein Hinweis mit Link stehen; das Beispiel-Formular hat ihn. Das ist keine Rechtsberatung.

## Grenzen

- **Kein CSRF-Schutz:** Auf einer statischen Seite gibt es keine Sitzung, an die ein Token gebunden werden könnte. Für ein Kontaktformular ist das meist hinnehmbar, weil das Skript nur eine Mail an dich sendet und nichts verändert.
- Die Falle und der Grenzwert halten einfache Roboter ab, aber keine gezielten Angriffe. Wenn viel Spam ankommt, braucht es mehr (zum Beispiel ein Captcha ohne Tracking, das habe ich nicht geprüft).
- `mail()` ist die einfachste, aber nicht die zuverlässigste Art zu senden. Manche Hoster verlangen den Versand über ihren SMTP-Server.
- Anforderung: PHP 8.1 oder neuer (das Skript verwendet den Rückgabetyp `never`).

## Lokal ausprobieren

```
cd beispiele/kontakt-php
copy config.beispiel.php config.php      (Windows; sonst cp)
php -S localhost:8000
```

Setze in der lokalen `config.php` `'testmodus' => true`, dann schreibt das Skript die Nachrichten in die Datei `testdatei` (siehe Konfiguration), statt zu senden. Die Tests laufen mit `npm test`, wenn PHP installiert ist; sonst werden sie übersprungen.
