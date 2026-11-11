# Modul 14: Accessibility und inklusives Design

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 23 h \| **Priorität:** 1 \| **Lerneinheiten:** 20

## Lerneinheiten laut Lehrplan

| **Lerneinheit**          | **Dauer (h)** | **Prio** |
|:-------------------------|--------------:|---------:|
| WCAG-Prinzipien          |             1 |        1 |
| Semantisches HTML        |             1 |        1 |
| Tastaturbedienung        |           1,5 |        1 |
| Fokusmanagement          |             1 |        1 |
| Kontrast und Lesbarkeit  |             1 |        1 |
| Textalternativen         |           1,5 |        2 |
| Accessible Forms         |             1 |        2 |
| Accessibility Testing    |             1 |        2 |
| Accessibility-Grundlagen |             1 |        1 |
| Semantik vor ARIA        |             1 |        1 |
| ARIA Labels              |           1,5 |        1 |
| Skip Links               |             1 |        1 |
| Alternativtexte          |           1,5 |        2 |
| Screenreader-Test        |             1 |        2 |
| Fokusindikatoren         |             1 |        1 |
| Responsive Text          |           1,5 |        1 |
| Semantik unterstützen    |             1 |        1 |
| Form States              |             1 |        1 |
| High Contrast Mode       |           1,5 |        2 |
| Usability Review         |             1 |        2 |
| **Summe**                |        **23** |          |

## Überblick

Barrierefreiheit (Accessibility, a11y) bedeutet, dass Webangebote von allen Menschen genutzt werden können, auch mit Seh-, Hör-, motorischen oder kognitiven Einschränkungen, mit Assistenztechnik oder in schwierigen Situationen (Sonnenlicht, ein Arm im Gips, langsames Netz). Sie ist Qualitätsmerkmal, rechtliche Anforderung und verbessert Usability und SEO für alle.

## WCAG-Prinzipien (POUR)

Die *Web Content Accessibility Guidelines* (WCAG, aktuell Version 2.2) gliedern sich in vier Prinzipien:

- **Wahrnehmbar** (Perceivable): Informationen sind für Sinne zugänglich (Alternativtexte, Untertitel, Kontrast, Anpassbarkeit).

- **Bedienbar** (Operable): Bedienung per Tastatur, genug Zeit, keine Anfälle auslösenden Inhalte, Navigation, Eingabemodalitäten.

- **Verständlich** (Understandable): lesbare Sprache, vorhersehbares Verhalten, Eingabehilfe und Fehlerkorrektur.

- **Robust** (Robust): korrekt codiert, mit Assistenztechnik und künftigen Technologien kompatibel (Name, Rolle, Wert).

Konformitätsstufen: **A** (Minimum), **AA** (Standardziel, rechtlich gefordert), **AAA** (maximal, nicht für alles erreichbar).

> **Ergänzung aus der Nachrecherche: WCAG 2.2: neue Erfolgskriterien**
>
> WCAG 2.2 (W3C-Empfehlung, Oktober 2023) ergänzt neun Kriterien und entfernt 4.1.1 Parsing:
>
> | **Kriterium**                          | **Stufe** | **Inhalt**                                                                       |
> |:---------------------------------------|:---------:|:---------------------------------------------------------------------------------|
> | 2.4.11 Focus Not Obscured (Minimum)    |    AA     | Fokussiertes Element wird nicht vollständig verdeckt (z. B. durch Sticky-Header) |
> | 2.4.12 Focus Not Obscured (Enhanced)   |    AAA    | Fokus bleibt komplett sichtbar                                                   |
> | 2.4.13 Focus Appearance                |    AAA    | Mindestgröße und 3:1-Kontrast des Fokusindikators                                |
> | 2.5.7 Dragging Movements               |    AA     | Alternative zu Ziehen per einfachem Klick                                        |
> | 2.5.8 Target Size (Minimum)            |    AA     | Klickziele mind. 24×24 CSS-Pixel (oder ausreichend Abstand)                      |
> | 3.2.6 Consistent Help                  |     A     | Hilfe an gleichbleibender Stelle                                                 |
> | 3.3.7 Redundant Entry                  |     A     | Bereits eingegebene Daten nicht erneut verlangen                                 |
> | 3.3.8 Accessible Authentication (Min.) |    AA     | Anmeldung ohne kognitiven Test (Passwort-Manager, Einfügen erlauben)             |
> | 3.3.9 Accessible Authentication (Enh.) |    AAA    | Wie 3.3.8, ohne Ausnahmen                                                        |

> **Ergänzung aus der Nachrecherche: Rechtlicher Rahmen (Überblick, keine Rechtsberatung)**
>
> Die europäische Richtlinie (EU) 2019/882 („European Accessibility Act“) verpflichtet seit dem 28. 6. 2025 bestimmte Produkte und Dienstleistungen (z. B. Onlineshops, Bankdienste, E-Books, Personenverkehr) zur Barrierefreiheit; in Österreich ist sie durch das Barrierefreiheitsgesetz (BaFG) umgesetzt, in Deutschland durch das BFSG. Für öffentliche Stellen gilt das Web-Zugänglichkeits-Gesetz (WZG) bzw. die Richtlinie (EU) 2016/2102. Technische Grundlage ist die Norm EN 301 549, die sich auf WCAG 2.1 Level AA bezieht; WCAG 2.2 AA gilt als sinnvolle Zielmarke. Ausnahmen (z. B. Kleinstunternehmen bei Dienstleistungen) bitte im Einzelfall prüfen.

## Semantisches HTML, Semantik vor ARIA

**Erste Regel von ARIA:** Wenn es ein natives HTML-Element mit passender Semantik und Verhalten gibt, *dieses verwenden*. Ein `<button>` bringt Rolle, Fokus, Tastatur (Enter/Leertaste) und Zustand mit, ein `<div role="button">` muss alles nachbauen.

```html
<!-- schlecht -->  <div class="btn" onclick="senden()">Senden</div>
<!-- gut -->       <button type="button" class="btn">Senden</button>
```

Wichtige native Elemente: `button`, `a`, `label`, `fieldset/legend`, `details/summary`, `dialog`, `nav`/`main`/`header`/`footer`, `h1--h6`, `ul/ol`, `table`-Elemente.

## ARIA-Grundlagen und ARIA Labels

*ARIA* (Accessible Rich Internet Applications) ergänzt Rollen, Zustände und Eigenschaften, *ändert aber kein Verhalten*.

| **Attribut**        | **Zweck**                                                         |
|:--------------------|:------------------------------------------------------------------|
| `role`            | Rolle (z. B. `role="alert"`, `role="tablist"`)                                  |
| `aria-label`            | Unsichtbarer Name (z. B. Icon-Button)                             |
| `aria-labelledby`            | Name aus anderem sichtbaren Element (per `id`)                |
| `aria-describedby`            | Zusatzbeschreibung (Hinweis, Fehlermeldung)                       |
| `aria-expanded` / `aria-controls` | Auf-/zugeklappt und das gesteuerte Element                        |
| `aria-current="page"`            | Aktuelle Seite in der Navigation                                  |
| `aria-live="polite"` / `role="status"` | Dynamische Änderung ankündigen                                    |
| `aria-hidden="true"`            | Aus Assistenztechnik ausblenden (nie auf fokussierbare Elemente!) |
| `aria-invalid`, `aria-required`  | Zustände von Formularfeldern                                      |

```html
<button type="button" aria-label="Menü schließen"><svg aria-hidden="true" focusable="false">...</svg></button>
<h2 id="news">Neuigkeiten</h2>
<section aria-labelledby="news">...</section>
<div id="status" role="status" aria-live="polite"></div>   <!-- Text per JS einfügen -->
```

**Typische Fehler:** `role="button"` auf Links, `aria-label` auf `div` ohne Rolle, doppelte Beschriftung, `aria-hidden` auf Fokussierbarem, ARIA-Rollen ohne die zugehörige Tastatursteuerung. *Kein ARIA ist besser als schlechtes ARIA.*

## Tastaturbedienung, Fokusmanagement, Skip Links

Alle Funktionen müssen *ohne Maus* nutzbar sein (WCAG 2.1.1): Tab/Shift+Tab (vor/zurück), Enter (Link/Button), Leertaste (Button/Checkbox), Pfeiltasten (Radio, Auswahl, Tabs), Esc (Dialog schließen).

- **Tab-Reihenfolge** folgt der Quelltextreihenfolge; `tabindex="0"` nimmt ein Element in die Tab-Reihenfolge auf, `tabindex="-1"` macht es nur per Skript fokussierbar, **nie positive Werte**.

- **Fokusmanagement** bei dynamischen Änderungen: Beim Öffnen eines Dialogs den Fokus hineinsetzen und im Dialog halten (nativ mit `<dialog>` und `showModal()`), beim Schließen zum Auslöser zurückgeben; nach Seitenwechsel in SPA den Fokus auf die neue Überschrift setzen.

- **Skip Link:** erster fokussierbarer Link „Zum Inhalt springen“.

```css
.skip-link { position: absolute; inset-inline-start: 0; inset-block-start: -4rem; padding: .75rem 1rem;
             background: #000; color: #fff; z-index: 1000; }
.skip-link:focus { inset-block-start: 0; }          /* nur bei Fokus sichtbar */
main:focus { outline: none; }                        /* Ziel mit tabindex="-1" */
.visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
                   overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
```

## Fokusindikatoren, Kontrast und Lesbarkeit

```css
:focus-visible { outline: 3px solid #1a73e8; outline-offset: 2px; }   /* nie outline: none ohne Ersatz */
a { text-decoration: underline; text-underline-offset: .15em; }
html { scroll-padding-top: 5rem; }   /* Sticky-Header darf Fokus nicht verdecken (WCAG 2.4.11) */
```

- **Kontrast:** Text 4,5:1 (groß 3:1); UI-Komponenten, Fokus und Piktogramme 3:1.

- **Lesbarkeit:** Schrift in `rem`, Zeilenhöhe mind. 1,5, Zeilenlänge `max-width: 65ch`, linksbündig statt Blocksatz, kein reiner Großbuchstabentext, Text bis 200 % zoombar ohne Verlust, Reflow bei 320 px Breite ohne horizontales Scrollen (WCAG 1.4.10), Textabstände dürfen verändert werden (1.4.12).

- **Responsive Text:** `clamp()` mit `rem`-Anteil (Modul 5), keine fixen Höhen für Textcontainer.

- **Mindestgröße für Klickziele:** 24×24 px (AA), besser 44×44 px.

## Textalternativen und Medien

**Alternativtexte** sind nach Zweck zu verfassen (Modul 7): informativ, funktional (Linkziel), dekorativ (`alt=""`), komplex (Kurz-`alt` + ausführliche Beschreibung/Datentabelle im Text). **Medien:** Videos mit Untertiteln und ggf. Audiodeskription, Audio mit Transkript, keine automatisch startende Wiedergabe, kein Blinken mehr als dreimal pro Sekunde. Icons: dekorativ `aria-hidden`, funktional mit zugänglichem Namen.

## Accessible Forms, Form States, High Contrast Mode

- Jedes Control mit `<label>`, Gruppen mit `fieldset/legend`, Hinweise per `aria-describedby`, `autocomplete` für bekannte Felder (Modul 6).

- Fehler: Text am Feld, `aria-invalid="true"`, Zusammenfassung mit Fokus, nicht nur Farbe (WCAG 3.3.1, 3.3.3).

- **Form States in CSS:** `:hover`, `:focus-visible`, `:disabled`, `:user-invalid`, `:required`, `:checked`, jeweils mit ausreichendem Kontrast und *nicht nur über Farbe*.

**High Contrast Mode (Windows „Kontrastdesigns“):** Der Browser ersetzt Farben durch Systemfarben (`forced-colors: active`). Eigene Hintergrundfarben und Schatten verschwinden; deshalb für Grenzen `border`/`outline` statt Schatten und Hintergrund verwenden, Systemfarben (`CanvasText`, `Highlight`) nutzen und mit `@media (forced-colors: active)` gezielt nachbessern. Weitere Medienfunktionen: `prefers-contrast: more`, `prefers-reduced-motion`, `prefers-color-scheme`.

## Accessibility Testing, Screenreader-Test, Usability Review

**Testebenen:**

1.  **Automatisiert** (findet nur einen Teil der Probleme, grob ein Drittel bis die Hälfte): Lighthouse, axe DevTools, WAVE, pa11y, Integration in CI.

2.  **Manuell:** nur mit Tastatur bedienen (Tab-Reihenfolge, sichtbarer Fokus, keine Fokusfallen), Zoom 200 % und 400 %, Kontrastprüfung, Überschriften- und Landmarkenübersicht.

3.  **Screenreader:** NVDA (Windows, kostenlos), JAWS, VoiceOver (macOS/iOS), TalkBack (Android). Kurztest: Seite per Überschriften/Landmarken navigieren, Formular ausfüllen, Dialog bedienen.

4.  **Nutzertests** mit Menschen mit Behinderungen.

**Usability Review:** Prüfliste aus WCAG-AA-Kriterien, Heuristiken (Modul 8) und Befunden; Ergebnisse nach Schwere (blockierend, hoch, mittel, gering) priorisieren; Barrierefreiheitserklärung führen.

## Übungen

1.  Nenne die vier WCAG-Prinzipien und je ein Beispiel.

2.  Warum `<button>` statt `<div role="button">`? Drei Gründe.

3.  Schreibe einen Skip Link samt CSS, der nur bei Fokus sichtbar ist.

4.  Welche Kontrastwerte gelten für Text und für UI-Elemente?

5.  Was ändert sich mit WCAG 2.2 für Sticky-Header und Klickziele?

6.  Beschreibe einen 5-Minuten-Tastaturtest.

## Lösungen

1.  Wahrnehmbar (Alt-Text), Bedienbar (Tastatur), Verständlich (klare Fehlermeldungen), Robust (gültiges Markup, ARIA korrekt).

2.  Natives Verhalten (Fokus, Enter/Leertaste), korrekte Rolle/Zustand ohne Zusatzcode, weniger Code und weniger Fehler.

3.  Siehe Abschnitt „Skip Links“ (Link zu `#inhalt`, `.skip-link:focus` blendet ein).

4.  Text 4,5:1 (groß 3:1); UI-Komponenten, Fokus und Grafikobjekte 3:1.

5.  Fokus darf nicht komplett verdeckt werden (2.4.11, `scroll-padding`); Klickziele mindestens 24×24 px (2.5.8).

6.  Maus weglegen, mit Tab durch die Seite: Reihenfolge logisch? Fokus immer sichtbar? Alle Funktionen (Menü, Dialog, Formular) bedienbar? Keine Fokusfalle? Esc schließt Dialoge? Skip Link vorhanden?
