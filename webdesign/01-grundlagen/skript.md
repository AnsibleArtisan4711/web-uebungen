# Modul 1: Webdesign Grundlagen und Web-Standards

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 24 h \| **Priorität:** 1 \| **Lerneinheiten:** 21

## Lerneinheiten laut Lehrplan

| **Lerneinheit**               | **Dauer (h)** | **Prio** |
|:------------------------------|--------------:|---------:|
| Webplattform und Standards    |             1 |        1 |
| Rollen im Webprojekt          |             1 |        1 |
| Projektphasen                 |           1,5 |        1 |
| Zielgruppenanalyse            |             1 |        1 |
| Browser und Devices           |             1 |        1 |
| Design-Briefing               |           1,5 |        2 |
| Qualitätskriterien            |             1 |        2 |
| Dokumentation                 |             1 |        2 |
| HTML Zweck und Einordnung     |             1 |        1 |
| HTML Living Standard          |             1 |        1 |
| Grundstruktur eines Dokuments |           1,5 |        1 |
| DOCTYPE und html-Element      |             1 |        1 |
| head und body                 |             1 |        1 |
| Browser Parsing               |           1,5 |        2 |
| Projektstruktur               |             1 |        2 |
| CSS-Syntax                    |             1 |        1 |
| Einbindung in HTML            |           1,5 |        1 |
| DOM und CSSOM                 |             1 |        1 |
| Browser-Rendering             |             1 |        1 |
| Dateistruktur                 |           1,5 |        2 |
| DevTools Einstieg             |             1 |        2 |
| **Summe**                     |        **24** |          |

## Überblick

Dieses Modul legt das Fundament: Was ist die Webplattform, wer arbeitet in einem Webprojekt woran, wie läuft ein Projekt ab, und wie macht ein Browser aus einer Textdatei eine bedienbare Oberfläche. Wer die Begriffe und den Rendering-Weg versteht, findet Fehler in HTML und CSS deutlich schneller.

> **Merke**
>
> Die Webplattform besteht aus drei Schichten mit klarer Aufgabentrennung: **HTML** = Struktur und Bedeutung, **CSS** = Darstellung, **JavaScript** = Verhalten. Der Browser verbindet alle drei zur gerenderten Seite.

## Webplattform und Standards

**Bausteine:** HTML, CSS, JavaScript, der Browser (Rendering-Engine, JavaScript-Engine, Netzwerk-Stack) und die *Web-APIs* (DOM, Fetch, Storage, Geolocation, Canvas, Web Audio usw.). Dazu kommen Übertragungsprotokolle (HTTP/1.1, HTTP/2, HTTP/3, TLS) und Formate (JSON, SVG, WebP, AVIF, WOFF2).

**Wer macht die Standards?**

- **WHATWG**: pflegt den *HTML Living Standard*, DOM, Fetch, URL. Es gibt keine nummerierten Versionen mehr, der Standard wird laufend aktualisiert.

- **W3C**: pflegt CSS (über die CSS Working Group), WCAG, ARIA, viele Web-APIs. Spezifikationen durchlaufen Stufen (Working Draft, Candidate Recommendation, Recommendation).

- **Ecma TC39**: standardisiert JavaScript (ECMAScript, jährliche Ausgaben).

- **IETF**: HTTP, TLS, URI-Syntax (RFCs).

**Warum Standards?** Sie sichern *Interoperabilität* (dieselbe Seite funktioniert in Chrome, Firefox und Safari), *Sicherheit* (definierte Sicherheitsmodelle wie Same-Origin-Policy) und *Wartbarkeit* (Code bleibt über Jahre lauffähig, Abwärtskompatibilität ist ein Kernprinzip des Webs).

> **Ergänzung aus der Nachrecherche: Baseline und Browser-Support**
>
> Ob eine Funktion produktiv einsetzbar ist, klärt man heute über *Baseline*. **Newly available**: das Feature läuft in den aktuellen Versionen von Chrome, Edge, Firefox und Safari. **Widely available**: das gilt seit mindestens 30 Monaten, ältere Installationen sind dann kaum noch relevant. Nachschlagewerke: MDN Web Docs (Kompatibilitätstabellen), caniuse.com, webstatus.dev. Faustregel: Kernfunktionen nur mit *Widely available* bauen, neuere Features als Verbesserung (Progressive Enhancement, siehe Modul 12) einsetzen.

## Rollen im Webprojekt

| **Rolle**                      | **Typische Aufgaben**                                      |
|:-------------------------------|:-----------------------------------------------------------|
| Projektleitung / Product Owner | Ziele, Budget, Termine, Priorisierung, Abnahme             |
| UX-Research / Konzeption       | Zielgruppen, Personas, User Flows, Informationsarchitektur |
| UI-/Webdesign                  | Layout, Typografie, Farben, Komponenten, Prototypen        |
| Frontend-Entwicklung           | HTML, CSS, JavaScript, Barrierefreiheit, Performance       |
| Backend-Entwicklung            | Server, Datenbank, APIs, Authentifizierung                 |
| Content / Redaktion / SEO      | Texte, Medien, Keywords, Pflege im CMS                     |
| QA / Test                      | Funktions-, Browser-, Accessibility- und Regressionstests  |
| DevOps / Betrieb               | Hosting, Deployment, Monitoring, Backups                   |

In kleinen Projekten vereint eine Person mehrere Rollen. Wichtig ist, dass *alle* Anforderungen abgedeckt sind: Design (wirkt die Seite stimmig?), Code (ist sie sauber gebaut?), Test (funktioniert sie überall?) und Betrieb (bleibt sie sicher und schnell?).

## Projektphasen

1.  **Discovery / Briefing**: Ziele, Zielgruppe, Rahmenbedingungen, Wettbewerb.

2.  **Konzeption**: Sitemap, User Flows, Wireframes, Content-Struktur.

3.  **Design**: Styleguide, Komponenten, Mockups, Prototyp.

4.  **Umsetzung**: HTML/CSS/JS, CMS-Integration, Inhalte einpflegen.

5.  **Test und Abnahme**: Browser/Geräte, Accessibility, Performance, Security.

6.  **Launch**: Go-live, Weiterleitungen, Monitoring.

7.  **Betrieb und Weiterentwicklung**: Updates, Backups, Optimierung.

**Wasserfall** arbeitet die Phasen nacheinander ab (planbar, aber änderungsscheu). **Agil** (Scrum, Kanban) liefert in kurzen Iterationen und passt Anforderungen laufend an. In der Praxis sind Mischformen üblich: Konzeption vorab, Umsetzung iterativ.

## Zielgruppenanalyse, Browser und Devices

**Zielgruppe** heißt: Wer nutzt die Seite, mit welchem Ziel, auf welchem Gerät, in welcher Situation, mit welchen Einschränkungen? Methoden: Interviews, Umfragen, Analytics-Daten, *Personas* (typische fiktive Nutzer) und *Jobs-to-be-done* („Wenn ich …, möchte ich …, damit …“).

> **Praxisbeispiel: Mini-Persona**
>
> **Maria, 58, Büroangestellte**: liest Nachrichten am Tablet, trägt Gleitsichtbrille, ist bei kleinen Schaltflächen unsicher. *Konsequenz:* Basis-Schriftgröße mindestens 16 px, hoher Kontrast, große Klickflächen, klare Beschriftungen statt Icons.

**Browser und Devices:** Die drei Rendering-Engines sind *Blink* (Chrome, Edge, Opera, Samsung Internet), *WebKit* (Safari, alle Browser unter iOS) und *Gecko* (Firefox). Aus den Analytics-Daten (nicht aus Bauchgefühl) wird eine *Testmatrix* abgeleitet: z. B. aktuelle Chrome/Edge, Firefox, Safari (macOS und iOS), Chrome auf Android, dazu 3–4 Viewportbreiten.

## Design-Briefing, Qualitätskriterien, Dokumentation

**Ein gutes Briefing enthält:** Projektziel und KPIs (z. B. Anfragen pro Monat), Zielgruppe(n), Inhalte und Funktionen, Wettbewerb und Vorbilder, Corporate Design (Logo, Farben, Schriften), Technik (CMS, Hosting, Browser-Support), Budget, Termine, Verantwortliche.

**Qualitätskriterien** (messbar formulieren): valides, semantisches HTML; WCAG 2.2 Level AA; Core Web Vitals im grünen Bereich; Funktion in der Testmatrix; HTTPS; DSGVO-konforme Einbindung von Drittanbietern; wartbare Code-Struktur.

**Dokumentation:** README (Setup, Build, Deployment), Styleguide/Komponentenbibliothek, Entscheidungsprotokoll (warum so gebaut?), Übergabe an Betrieb/Redaktion. Dokumentation ist Teil der Lieferung, nicht Zusatz.

## HTML: Zweck, Living Standard, Grundstruktur

**HTML** (HyperText Markup Language) beschreibt *Struktur und Bedeutung* von Inhalten: Überschriften, Absätze, Listen, Links, Bilder, Formulare. Es ist keine Programmier- und keine Layoutsprache. Abgrenzung: Aussehen → CSS; Verhalten → JavaScript.

**HTML Living Standard:** Der aktuelle Standard der WHATWG unter html.spec.whatwg.org. „HTML5“ ist ein historischer Begriff; heute gibt es keine Versionsnummern. Maßgeblich sind Spezifikation, MDN und der Validator.

**Minimales, valides Dokument:**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Startseite | Beispiel GmbH</title>
</head>
<body>
  <h1>Willkommen</h1>
  <p>Dies ist ein Absatz.</p>
</body>
</html>
```

- `<!DOCTYPE html>` schaltet den *Standards Mode* ein. Fehlt er, rendert der Browser im *Quirks Mode* (historisches Verhalten, z. B. anderes Box-Modell-Verhalten) – eine häufige Fehlerquelle.

- `lang="de"` steuert Aussprache bei Screenreadern, Silbentrennung (`hyphens: auto`) und Übersetzungsangebote.

- `charset="utf-8"` muss in den ersten 1024 Byte stehen; sonst drohen kaputte Umlaute.

- `viewport` ist Voraussetzung für Responsive Design (Modul 7).

- `<head>` enthält Metadaten, die nicht angezeigt werden; `<body>` enthält die sichtbaren Inhalte.

## Browser Parsing, DOM, CSSOM und Rendering

Der Browser verarbeitet HTML nicht als Text, sondern als Datenstruktur:

1.  **Parsing:** Bytes → Zeichen → Tokens → Knoten → **DOM** (Document Object Model, Baum der Elemente). Der HTML-Parser ist *fehlertolerant*: falsch geschachtelte Tags werden repariert, es gibt keinen Syntaxfehler wie in Programmiersprachen.

2.  **CSSOM:** Aus allen Stylesheets entsteht das CSS Object Model. CSS ist *rendering-blockierend*: ohne CSSOM wird nicht gezeichnet.

3.  **Render Tree:** DOM + CSSOM, ohne unsichtbare Elemente (`display: none`).

4.  **Layout:** Position und Größe jeder Box berechnen.

5.  **Paint:** Pixel zeichnen (Farben, Text, Schatten).

6.  **Composite:** Ebenen zusammensetzen (GPU).

Ein klassisches `<script>` ohne `defer` blockiert den Parser (Modul 12). Der *Preload-Scanner* liest das Dokument voraus und startet Downloads früh – auch deshalb sind früh sichtbare `<link>`-Tags im Quelltext vorteilhaft.

> **Ergänzung aus der Nachrecherche: Reflow und Repaint**
>
> Ändert JavaScript Größen oder Positionen (z. B. `width`, `top`), muss der Browser das *Layout* neu berechnen (Reflow, teuer). Ändern sich nur Farben, genügt ein *Repaint*. Änderungen an `transform` und `opacity` laufen oft nur im Composite-Schritt und sind am günstigsten (siehe Modul 15).

## CSS: Zweck, Syntax, Einbindung

**CSS** (Cascading Style Sheets) beschreibt die Darstellung von HTML- (und XML-)Dokumenten.

**Syntax:** Eine *Regel* besteht aus Selektor und Deklarationsblock; jede *Deklaration* aus Property, Doppelpunkt, Wert und Semikolon.

```css
/* Selektor        Property: Wert; */
h1 {
  color: #1a3c6e;
  font-size: 2rem;
}
.button:hover { background: rgb(0 90 160); }
@media (min-width: 48em) { .button { padding: 1rem 2rem; } }  /* At-Regel */
```

**Drei Wege der Einbindung:**

```html
<!-- 1. Externes Stylesheet (Standard, cachebar) -->
<link rel="stylesheet" href="css/main.css">

<!-- 2. Internes Stylesheet (z.B. Critical CSS) -->
<style> body { margin: 0; } </style>

<!-- 3. Inline-Style (nur Ausnahme: hohe Spezifität, schlecht wartbar) -->
<p style="color: red">Warnung</p>
```

`@import` in CSS lädt Dateien nacheinander und verzögert das Rendering; mehrere `<link>`-Tags oder ein Build-Schritt sind besser.

## Projektstruktur, Dateistruktur, DevTools

```text
projekt/
  index.html
  ueber-uns/index.html
  kontakt/index.html
  css/
    main.css
  js/
    main.js
  img/
    logo.svg
    hero-1200.avif
  fonts/
    inter-var.woff2
```

**Konventionen:** Dateinamen klein, mit Bindestrich, ohne Leerzeichen und Umlaute (`ueber-uns`, nicht `Über uns`); sprechende URLs (`/kontakt/` statt `kontakt.html`); Startdatei heißt `index.html`; relative Pfade innerhalb des Projekts.

**DevTools-Einstieg** (F12): *Elements* (DOM und angewandte CSS-Regeln, Live-Bearbeitung), *Console* (Fehler, Logs), *Network* (Ladereihenfolge, Größen, Statuscodes), *Lighthouse* (Audit), *Device Toolbar* (Responsive-Test). Wichtigste Übung: ein Element rechtsklicken → „Untersuchen“ und im Reiter *Styles* nachvollziehen, welche Regel gewinnt und welche durchgestrichen ist.

## Übungen

1.  Nenne die drei Kernsprachen der Webplattform und ordne jeweils eine Aufgabe zu.

2.  Warum ist der DOCTYPE wichtig? Was passiert ohne ihn?

3.  Schreibe ein minimales valides HTML-Dokument mit deutscher Sprache, UTF-8, Viewport, Titel und einer Überschrift.

4.  Ordne in die richtige Reihenfolge: Layout, DOM+CSSOM, Parsing, Paint, Composite.

5.  Welche der drei CSS-Einbindungsarten ist für große Projekte am besten und warum?

6.  Erstelle für eine Vereinswebsite eine Mini-Persona und leite zwei Designentscheidungen ab.

## Lösungen

1.  HTML = Struktur/Bedeutung, CSS = Darstellung, JavaScript = Verhalten/Interaktion.

2.  Er aktiviert den Standards Mode. Ohne ihn greift der Quirks Mode mit historischem Verhalten, wodurch Layouts in verschiedenen Browsern abweichen können.

3.  Siehe Beispiel im Abschnitt „Grundstruktur“; mit `lang="de"`, `charset="utf-8"`, viewport-Meta, `<title>` und `<h1>`.

4.  Parsing → DOM+CSSOM → Layout → Paint → Composite.

5.  Das externe Stylesheet: wird gecacht, ist zentral wartbar und trennt Struktur von Darstellung. Inline-Styles sind schwer überschreibbar und nicht wiederverwendbar.

6.  Individuell; z. B. Persona „Vereinsmitglied 65+“ → große Schrift (mind. 16 px) und hoher Kontrast; Kontaktdaten direkt im Header.
