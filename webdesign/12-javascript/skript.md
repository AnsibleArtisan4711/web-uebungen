# Modul 12: JavaScript für interaktive Webseiten

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 16,5 h \| **Priorität:** 2 \| **Lerneinheiten:** 15

## Lerneinheiten laut Lehrplan

| **Lerneinheit**           | **Dauer (h)** | **Prio** |
|:--------------------------|--------------:|---------:|
| DOM-Grundlagen            |             1 |        2 |
| Events                    |             1 |        2 |
| Formularvalidierung       |           1,5 |        2 |
| Fetch und APIs            |             1 |        2 |
| Komponentenlogik          |             1 |        2 |
| Progressive Enhancement   |           1,5 |        3 |
| Fehlerbehandlung          |             1 |        3 |
| JavaScript Testing        |             1 |        3 |
| CSS einbinden             |             1 |        2 |
| Script einbinden          |             1 |        2 |
| defer und async           |           1,5 |        2 |
| ES Modules                |             1 |        2 |
| DOM-Schnittstelle         |             1 |        2 |
| Noscript und Fallbacks    |             1 |        3 |
| Web Components Grundlagen |             1 |        3 |
| **Summe**                 |      **16,5** |          |

## Überblick

JavaScript macht Seiten interaktiv: Es liest und ändert das DOM, reagiert auf Ereignisse, validiert Eingaben und lädt Daten nach. Leitprinzip im Webdesign ist **Progressive Enhancement**: Die Seite funktioniert mit HTML und CSS als Basis, JavaScript verbessert sie. So bleibt sie robust, schnell und zugänglich.

## Einbindung: Script, defer, async, Module, CSS

```html
<link rel="stylesheet" href="css/main.css">          <!-- im head -->

<script src="js/app.js" defer></script>               <!-- lädt parallel, läuft nach dem Parsen, in Reihenfolge -->
<script src="js/analytics.js" async></script>         <!-- läuft sofort nach dem Laden, Reihenfolge unbestimmt -->
<script type="module" src="js/main.js"></script>      <!-- ES Module: automatisch defer, eigener Scope -->
<script nomodule src="js/legacy.js"></script>         <!-- nur sehr alte Browser (selten nötig) -->
```

| **Variante**  | **Ladeverhalten**                                                       | **Einsatz**                     |
|:--------------|:------------------------------------------------------------------------|:--------------------------------|
| ohne Attribut | Blockiert den HTML-Parser (Download + Ausführung)                       | Vermeiden                       |
| `defer`       | Parallel laden, nach vollständigem Parsen ausführen, Reihenfolge bleibt | Eigene Skripte (Standard)       |
| `async`       | Parallel laden, sofort ausführen, Reihenfolge unbestimmt                | Unabhängige Skripte (Statistik) |
| `type="module"`       | Wie `defer`, Modul-Scope, `import`/`export`                               | Moderner Code                   |

> **Ergänzung aus der Nachrecherche: Warum defer im head die beste Standardlösung ist**
>
> Ein `<script>` ohne Attribut stoppt den Parser, weil es das DOM verändern könnte (`document.write`). Mit `defer` startet der Download früh (Preload-Scanner), die Ausführung erfolgt nach dem Parsen, aber *vor* `DOMContentLoaded`. Das ist besser als „Skript vor `</body>`“, weil der Download früher beginnt. `async`-Skripte, die voneinander oder vom DOM abhängen, erzeugen Race Conditions.

**ES Modules** bringen Dateistruktur und Kapselung:

```javascript
// js/format.js
export function euro(betrag) {
  return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(betrag);
}
// js/main.js
import { euro } from "./format.js";
document.querySelector("#preis").textContent = euro(1234.5);   // 1.234,50 EUR
```

## DOM-Grundlagen und DOM-Schnittstelle

Das **DOM** stellt das Dokument als Baum von Knoten dar, den JavaScript lesen und verändern kann.

```javascript
const titel = document.querySelector("h1");              // erstes Element, CSS-Selektor
const karten = document.querySelectorAll(".karte");      // NodeList aller Treffer
titel.textContent = "Neuer Titel";                       // Text setzen (sicher)
titel.classList.add("aktiv");                            // Klasse setzen/entfernen/toggle
titel.setAttribute("aria-live", "polite");

const li = document.createElement("li");                 // Element erzeugen
li.textContent = "Neuer Eintrag";
document.querySelector("ul").append(li);
```

> **Merke**
>
> Für Texte immer `textContent` verwenden, nicht `innerHTML`. `innerHTML` mit Nutzereingaben ermöglicht XSS (Modul 18). Zum Ändern von Aussehen Klassen toggeln (`classList`), nicht einzelne Styles setzen.

**Weitere Web-APIs:** `fetch`, `localStorage`, `IntersectionObserver` (Lazy Loading, Scroll-Effekte), `matchMedia`, `ResizeObserver`, `URLSearchParams`, `History API`, `Clipboard`, `<dialog>` (`showModal()`), Popover-API.

## Events

```javascript
const button = document.querySelector("#menu-button");
button.addEventListener("click", (event) => {
  const offen = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!offen));
  document.querySelector("#menu").hidden = offen;
});

// Event-Delegation: ein Listener für viele Kinder
document.querySelector(".liste").addEventListener("click", (e) => {
  const eintrag = e.target.closest("li");
  if (eintrag) eintrag.classList.toggle("erledigt");
});
```

Wichtige Ereignisse: `click`, `input`, `change`, `submit`, `keydown`/`keyup`, `focus`/`blur`, `DOMContentLoaded`, `load`, `resize`, `scroll` (mit `passive`). Wichtige Methoden: `preventDefault()`, `stopPropagation()`. **Tastatur beachten**: Interaktive Elemente als `<button>`/`<a>` bauen, dann funktionieren Enter/Leertaste ohne Zusatzcode.

## Formularvalidierung mit JavaScript

```javascript
const form = document.querySelector("form");
form.addEventListener("submit", (e) => {
  const mail = form.elements.mail;
  if (!mail.checkValidity()) {                      // nutzt HTML-Constraints
    e.preventDefault();
    mail.setCustomValidity("Bitte eine gültige E-Mail-Adresse eingeben.");
    mail.reportValidity();                          // zeigt Browser-Meldung
    return;
  }
  mail.setCustomValidity("");
});
```

Empfehlung: HTML-Attribute (`required`, `type`, `pattern`) als Basis, JavaScript nur für zusätzliche Regeln (z. B. „Passwörter stimmen überein“), verständliche Meldungen mit `aria-describedby`, Serverprüfung bleibt Pflicht (Modul 6 und 18).

## Fetch und APIs, Fehlerbehandlung

```javascript
async function ladeProdukte() {
  try {
    const antwort = await fetch("/api/produkte", { headers: { Accept: "application/json" } });
    if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);   // fetch wirft NICHT bei 404/500
    const daten = await antwort.json();
    render(daten);
  } catch (fehler) {
    console.error(fehler);
    zeigeMeldung("Produkte konnten nicht geladen werden. Bitte später erneut versuchen.");
  }
}
```

> **Ergänzung aus der Nachrecherche: Fehlerbehandlung und Ladezustände**
>
> Zu jeder Anfrage gehören Ladezustand (Spinner, `aria-busy="true"`), Erfolgsfall, Leerzustand und *Fehlerzustand* mit verständlicher Meldung und Wiederholungsmöglichkeit. Wichtig: `fetch` wirft nur bei Netzwerkfehlern, *nicht* bei HTTP-Fehlercodes: `antwort.ok` prüfen. Dynamische Meldungen per `role="status"` bzw. `aria-live="polite"` (bei Fehlern `role="alert"`) ankündigen. Timeouts via `AbortController`/`AbortSignal.timeout()`. Globale Fehler mit `window.addEventListener("error", ...)` und `unhandledrejection` protokollieren (Monitoring, Modul 19).

## Komponentenlogik und Web Components

Kleine Komponenten kapseln Markup, Zustand und Verhalten. Bewährt: Zustand in `data-`Attributen/Klassen, Logik in Funktionen, Initialisierung für alle Vorkommen per `querySelectorAll`.

```html
<div class="accordion">
  <button aria-expanded="false" aria-controls="p1">Frage 1</button>
  <div id="p1" hidden>Antwort 1</div>
</div>
```

```javascript
document.querySelectorAll(".accordion button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    panel.hidden = open;
  });
});
```

> **Ergänzung aus der Nachrecherche: Native Alternativen vor eigenem JavaScript**
>
> Viele Komponenten brauchen kein JavaScript mehr: `<details>`/`<summary>` (Accordion, mit `name` für exklusive Gruppen), `<dialog>` (Modal), `popover` (Popups, Menüs), `:target`, `:has()`, CSS `scroll-snap`. Zuerst native Lösung prüfen: besser zugänglich, weniger Code, schneller.

**Web Components** (Custom Elements, Shadow DOM, Templates) bilden wiederverwendbare, gekapselte Elemente:

```javascript
class MeinBadge extends HTMLElement {
  connectedCallback() {
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>span{padding:.25rem .5rem;background:#1a3c6e;color:#fff}</style>
                      <span><slot></slot></span>`;
  }
}
customElements.define("mein-badge", MeinBadge);   // Name enthält Bindestrich: <mein-badge>Neu</mein-badge>
```

## Progressive Enhancement, Noscript und Fallbacks, Testing

- **Ebene 1:** Inhalte und Grundfunktion in semantischem HTML (Formular sendet per POST, Links führen zu echten Seiten).

- **Ebene 2:** Gestaltung mit CSS.

- **Ebene 3:** JavaScript ergänzt (Validierung ohne Reload, Live-Filter).

- **Feature Detection** statt Browser-Erkennung: `if ("IntersectionObserver" in window) { ... }`, CSS `@supports (display: grid)`.

- `<noscript>` nur für sinnvolle Alternativen (Hinweis, Link), nicht als Ersatz für Progressive Enhancement.

- Fallbacks: Inhalte nicht per JavaScript verstecken, die ohne JS nicht mehr erreichbar wären.

**JavaScript Testing (Überblick):** Unit-Tests (Vitest/Jest) für Logik, Komponententests, End-to-End mit Playwright oder Cypress (echte Browser, Formularabläufe), Accessibility-Automatisierung mit axe. In der Konsole: ESLint für Fehler und Stil.

## Übungen

1.  Welche Einbindung wählst du für: (a) die eigene `app.js`, (b) ein Statistik-Skript, (c) ein ES-Modul?

2.  Warum `textContent` statt `innerHTML`?

3.  Schreibe einen Event-Listener, der ein Menü per Button öffnet und `aria-expanded` aktualisiert.

4.  Was ist falsch an `const r = await fetch(url); const d = await r.json();` ohne weitere Prüfung?

5.  Nenne zwei native HTML-Alternativen zu selbstgebauten Komponenten.

## Lösungen

1.  \(a\) `defer`; (b) `async`; (c) `type="module"` (ist automatisch deferred).

2.  `innerHTML` interpretiert Eingaben als HTML und öffnet XSS-Lücken; `textContent` behandelt alles als reinen Text.

3.  Siehe Abschnitt „Events“ (Button-Listener mit `aria-expanded` und `hidden`).

4.  `fetch` wirft bei 404/500 nicht; `antwort.ok` fehlt, der Netzwerkfehler wird nicht abgefangen (`try/catch`), und es gibt keine Fehlermeldung für den Nutzer.

5.  `<details>/<summary>` für Akkordeons; `<dialog>` für Modale; auch `popover`.
