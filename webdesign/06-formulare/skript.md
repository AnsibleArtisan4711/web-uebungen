# Modul 6: Formulare, Eingaben und Validierung

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 9 h \| **Priorität:** 1 \| **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Lerneinheit**     | **Dauer (h)** | **Prio** |
|:--------------------|--------------:|---------:|
| form-Element        |             1 |        1 |
| Labels              |             1 |        1 |
| Input-Typen         |           1,5 |        1 |
| Textarea und Select |             1 |        1 |
| Fieldset und Legend |             1 |        1 |
| HTML-Validierung    |           1,5 |        2 |
| Fehlermeldungen     |             1 |        2 |
| Formular-UX         |             1 |        2 |
| **Summe**           |         **9** |          |

## Überblick

Formulare sind der wichtigste Interaktionspunkt vieler Websites (Kontakt, Anmeldung, Kauf). Native HTML-Controls bringen Tastaturbedienung, Zugänglichkeit und Validierung mit. Aufgabe des Webdesigns: richtige Controls wählen, sauber beschriften, gruppieren, nutzerfreundliche Fehlermeldungen liefern.

## Das form-Element

```html
<form action="/kontakt/senden" method="post">
  <!-- Controls -->
  <button type="submit">Absenden</button>
</form>
```

- `action`: Ziel-URL; `method`: `get` (Daten in der URL, für Suche/Filter) oder `post` (Daten im Body, für Änderungen und sensible Daten).

- `name`-Attribut der Controls bestimmt den Schlüssel der übertragenen Daten; ohne `name` wird ein Feld nicht gesendet.

- `enctype="multipart/form-data"` bei Dateiuploads.

- `novalidate` schaltet die Browser-Validierung ab (z. B. bei eigener JS-Validierung).

- Ein `<button>` in einem Formular ist standardmäßig ein Submit-Button; für andere Zwecke `type="button"`.

## Labels

**Jedes Control braucht einen zugänglichen Namen.** Standard ist das `<label>`:

```html
<!-- explizit (empfohlen): for = id -->
<label for="email">E-Mail-Adresse</label>
<input id="email" name="email" type="email" autocomplete="email" required>

<!-- implizit: Control im Label -->
<label>Newsletter <input type="checkbox" name="newsletter"></label>
```

Vorteile: Screenreader lesen den Namen vor; Klick auf das Label aktiviert das Feld (große Klickfläche, besonders bei Checkbox/Radio). **Platzhalter ersetzen kein Label** (verschwinden beim Tippen, geringer Kontrast, werden nicht zuverlässig vorgelesen).

## Input-Typen und weitere Controls

| **Typ**                                          | **Wirkung**                                                             |
|:-------------------------------------------------|:------------------------------------------------------------------------|
| `text`, `search`                               | Freitext, Suchfeld                                                      |
| `email`, `url`, `tel`                     | Passende Tastatur auf Mobilgeräten, E-Mail/URL-Prüfung                  |
| `password`                                         | Maskierte Eingabe (Passwortmanager nutzen `autocomplete`)                     |
| `number`, `range`                               | Zahl mit `min`/`max`/`step`, Schieberegler                      |
| `date`, `time`, `datetime-local`, `month`, `week` | Native Datums-/Zeitwähler                                               |
| `checkbox`, `radio`                               | Mehrfach- bzw. Einfachauswahl (Radios mit gleichem `name` gruppieren) |
| `file`, `color`, `hidden`                     | Datei, Farbe, verborgener Wert                                          |

```html
<label for="nachricht">Nachricht</label>
<textarea id="nachricht" name="nachricht" rows="5" maxlength="1000"></textarea>

<label for="land">Land</label>
<select id="land" name="land">
  <option value="">Bitte wählen</option>
  <option value="at">Österreich</option>
  <option value="de">Deutschland</option>
</select>

<label for="stadt">Stadt</label>
<input id="stadt" name="stadt" list="staedte">
<datalist id="staedte"><option value="Wien"><option value="Graz"></datalist>
```

> **Ergänzung aus der Nachrecherche: autocomplete, inputmode und enterkeyhint**
>
> `autocomplete` mit standardisierten Tokens (`given-name`, `family-name`, `email`, `tel`, `street-address`, `postal-code`, `one-time-code`, `new-password`, `current-password`) füllt Felder automatisch aus. Das erfüllt WCAG 1.3.5 (Zweck der Eingabe bestimmen) und senkt den Aufwand erheblich. `inputmode="numeric"` öffnet die Zahlentastatur ohne die Nachteile von `type="number"` (z. B. für Postleitzahl, Kartennummer); `enterkeyhint="search|send|next"` beschriftet die Enter-Taste.

## Fieldset und Legend

`<fieldset>` gruppiert zusammengehörige Controls, `<legend>` liefert die Gruppenbezeichnung. Pflicht bei Radio-Gruppen und Checkbox-Gruppen, weil das einzelne Label nur die Option, die Legende aber die *Frage* benennt.

```html
<fieldset>
  <legend>Wie möchten Sie kontaktiert werden?</legend>
  <label><input type="radio" name="kontakt" value="mail" checked> E-Mail</label>
  <label><input type="radio" name="kontakt" value="tel"> Telefon</label>
</fieldset>
```

## HTML-Validierung

Eingebaute Constraint Validation über Attribute: `required`, `type`, `min`/`max`, `minlength`/`maxlength`, `pattern` (reguläre Ausdrücke), `step`.

```html
<label for="plz">Postleitzahl</label>
<input id="plz" name="plz" inputmode="numeric" pattern="[0-9]{4}" required
       title="Vierstellige Postleitzahl, z. B. 1010" autocomplete="postal-code">
```

```css
input:user-invalid { border-color: #b00020; }  /* nach Interaktion, nicht beim Laden */
input:focus-visible { outline: 3px solid #1a73e8; }
```

> **Merke**
>
> Clientseitige Validierung dient der *Bedienung*, nicht der *Sicherheit*. Sie lässt sich mit DevTools oder direkten Requests umgehen. Der Server muss *jede* Eingabe erneut prüfen und bereinigen (siehe Modul 18).

## Fehlermeldungen und Formular-UX

**Gute Fehlermeldungen** sind konkret („Bitte geben Sie eine gültige E-Mail-Adresse ein, z. B. name@beispiel.at“), stehen *am Feld*, nennen die Lösung, sind nicht nur farblich markiert und werden Assistenztechnik mitgeteilt:

```html
<label for="mail">E-Mail</label>
<input id="mail" type="email" name="mail" aria-invalid="true" aria-describedby="mail-fehler" required>
<p id="mail-fehler" class="fehler">Bitte geben Sie eine gültige E-Mail-Adresse ein.</p>

<!-- Fehlerübersicht oben, bekommt nach dem Absenden den Fokus -->
<div role="alert" tabindex="-1" id="fehlerliste">...</div>
```

**UX-Regeln:**

- Nur notwendige Felder abfragen; Pflicht- oder optionale Felder klar markieren („optional“ ist oft ehrlicher als Sternchen).

- Eine Spalte, Label *über* dem Feld; logische Reihenfolge; große Klickflächen (mind. 24 px, besser 44 px).

- Lange Formulare in Schritte teilen, Fortschritt zeigen, Eingaben nicht verlieren.

- Fehler erst nach der Eingabe (`:user-invalid`, bei `blur`) zeigen, nicht schon beim Tippen.

- Bereits gemachte Angaben nicht erneut verlangen (WCAG 3.3.7 Redundant Entry); Passwort-Einfügen und Passwortmanager nicht blockieren (WCAG 3.3.8).

- Bestätigungsseite/-meldung nach dem Absenden.

## Übungen

1.  Baue ein Kontaktformular mit Name, E-Mail, Betreff (Auswahl), Nachricht und Datenschutz-Checkbox. Alle Controls mit Label, E-Mail und Nachricht Pflicht.

2.  Warum reicht `placeholder` nicht als Label? Nenne zwei Gründe.

3.  Gruppiere eine Radio-Auswahl „Versandart“ semantisch richtig.

4.  Wie validierst du eine österreichische Postleitzahl (4 Ziffern) nativ?

5.  Warum darf die Serverprüfung trotz HTML-Validierung nicht entfallen?

## Lösungen

1.  Muster: `<label for>` + `id` je Feld, `type="email" required`, `<textarea required>`, `<select>` mit Leer-Option, Checkbox mit Label und Link zur Datenschutzerklärung, `<button type="submit">`.

2.  Placeholder verschwindet beim Tippen (Gedächtnisproblem), hat meist zu geringen Kontrast, wird nicht von allen Screenreadern als Name genutzt, vergrößert keine Klickfläche.

3.  `<fieldset><legend>Versandart</legend>` mit Radios gleichen `name`s, je mit eigenem Label.

4.  `pattern="[0-9]{4}"` (in HTML ohne Backslashes) mit `inputmode="numeric"` und `required`.

5.  Clientseitige Prüfungen lassen sich umgehen (DevTools, curl); der Server ist die einzige vertrauenswürdige Instanz (Sicherheit, Datenintegrität).
