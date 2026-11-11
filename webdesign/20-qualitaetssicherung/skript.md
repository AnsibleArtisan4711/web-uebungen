# Modul 20: Qualitätssicherung, Validierung und Wartbarkeit

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 9 h \| **Priorität:** 2 \| **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Lerneinheit**         | **Dauer (h)** | **Prio** |
|:------------------------|--------------:|---------:|
| HTML-Validatoren        |             1 |        2 |
| Linting                 |             1 |        2 |
| Code Reviews            |           1,5 |        2 |
| Komponenten-Markup      |             1 |        2 |
| Naming und Konventionen |             1 |        2 |
| Regressionstests        |           1,5 |        3 |
| Dokumentationsstandards |             1 |        3 |
| Wartungsplan            |             1 |        3 |
| **Summe**               |         **9** |          |

## Überblick

Qualitätssicherung (QS) macht Qualität *messbar und wiederholbar*. Statt „sieht gut aus“ prüft man automatisiert gegen Standards (Validierung, Linting), manuell (Reviews, Tests) und dokumentiert Entscheidungen. Je früher Fehler gefunden werden, desto günstiger sind sie zu beheben.

## HTML-Validatoren und Linting

**Validierung:** Der *W3C Nu HTML Checker* (validator.w3.org/nu, auch als Datei-Upload, per URL oder lokal als JAR/Docker) prüft gegen den HTML Living Standard. Für CSS: *W3C CSS Validator* (jigsaw.w3.org/css-validator); Hinweis: neue Features zeigt er teils als Fehler.

```bash
npx html-validate "dist/**/*.html"       # lokal, in CI integrierbar
npx stylelint "src/**/*.css"
npx eslint "src/**/*.js"
```

**Typische HTML-Fehler:** doppelte `id`, nicht geschlossene oder falsch verschachtelte Elemente, `<div>` in `<p>`, fehlende `alt`-Attribute, ungültige Attributwerte, veraltete Elemente (`<center>`, `<font>`), fehlendes `lang`.

**Linting** prüft automatisch Stil und Fehlermuster:

| **Werkzeug**                | **Prüft**                                                       |
|:----------------------------|:----------------------------------------------------------------|
| html-validate, HTMLHint     | HTML-Struktur und Regeln                                        |
| Stylelint                   | CSS (Reihenfolge, Duplikate, ungültige Werte, Namenskonvention) |
| ESLint                      | JavaScript (Fehler, Stil, Accessibility-Plugin `jsx-a11y`)         |
| Prettier / EditorConfig     | Einheitliche Formatierung                                       |
| axe-core, pa11y, Lighthouse | Accessibility, Performance, SEO, Best Practices                 |

Einbindung: im Editor (Live-Feedback), als Pre-Commit-Hook und in der CI-Pipeline; ein fehlschlagender Check blockiert den Merge.

## Code Reviews

Ein *Review* prüft Änderungen vor dem Merge (Pull Request). Ziele: Fehler finden, Wissen teilen, Konventionen sichern. **Checkliste für Frontend-Reviews:**

1.  Erfüllt die Änderung die Anforderung/das Ticket? Nebenwirkungen?

2.  HTML semantisch, valide, zugänglich (Labels, Überschriften, Landmarken, Fokus)?

3.  CSS: Tokens statt „Magic Numbers“, niedrige Spezifität, keine `!important`-Neuzugänge, Mobile First, passende Breakpoints?

4.  JavaScript: kein `innerHTML` mit Fremddaten, Fehlerbehandlung, kein unnötiger Code?

5.  Performance: Bildgrößen, neue Abhängigkeiten, Layoutverschiebungen?

6.  Tests und Dokumentation angepasst?

7.  Browser-/Geräteprüfung und Screenshots im PR?

**Kultur:** konstruktiv und konkret („Vorschlag: … weil …“), klein halten (PR unter ca. 400 Zeilen), Autor*in* und Reviewer*in* haben dasselbe Ziel; Stilfragen automatisieren, damit Reviews über Inhalte statt Einrückung sprechen.

## Komponenten-Markup, Naming und Konventionen

- **Komponenten-Markup:** jede Komponente hat eine definierte HTML-Struktur, Varianten und Zustände, dokumentiert im Styleguide (Modul 17). Eigene Komponenten kapseln Barrierefreiheit (z. B. Accordion mit `aria-expanded`), damit sie einmal korrekt gebaut und überall wiederverwendet werden.

- **Naming:** einheitliche Klassennamen (BEM), Dateinamen in Kleinbuchstaben mit Bindestrich, englische oder deutsche Begriffe *konsequent*, sprechende Namen nach Bedeutung statt Aussehen (`.warnung`, nicht `.rot`).

- **Konventionen:** Einrückung, Attribute in Anführungszeichen, Reihenfolge der CSS-Eigenschaften (z. B. Layout → Box → Typografie → Optik), Kommentarstil, Commit-Nachrichten. Festgehalten in einer `CONTRIBUTING.md` bzw. im Styleguide, durchgesetzt per Linter.

## Tests: Regressionstests, Browser- und Geräteprüfung

**Teststufen:** Unit-Tests (Logik), Komponententests, End-to-End-Tests (Nutzerabläufe, z. B. mit Playwright), Accessibility-Tests (axe), Performance-Budgets. **Regressionstests** stellen sicher, dass Änderungen bestehendes Verhalten nicht beschädigen. Im Frontend besonders hilfreich: *Visuelle Regressionstests* (Screenshot-Vergleich je Breakpoint, z. B. Playwright, Percy, BackstopJS).

```javascript
// Playwright: Screenshot-Vergleich der Startseite in Mobilbreite
import { test, expect } from "@playwright/test";
test("Startseite mobil", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await expect(page).toHaveScreenshot("start-mobil.png");
});
```

**Testplan:** Browser-/Geräte-Matrix (Modul 1), Testfälle je Seitentyp (Formular senden, Menü bedienen, Warenkorb), Akzeptanzkriterien aus dem Briefing, Fehlerklassifikation (blockierend, hoch, mittel, gering), Retests nach Korrektur.

## Dokumentationsstandards und Wartungsplan

- **README:** Zweck, Voraussetzungen, Installation, Befehle (`dev`, `build`, `test`), Deployment, Ansprechpersonen.

- **Entscheidungsprotokoll (ADR):** Kontext, Entscheidung, Alternativen, Konsequenzen.

- **Styleguide/Komponentenkatalog** (Modul 17), **Changelog** (Keep a Changelog), **Barrierefreiheitserklärung**, Betriebshandbuch (Backups, Zugänge, Notfallkontakte).

- **Wartungsplan:** wiederkehrende Aufgaben mit Intervall und Verantwortlichen (Updates, Linkcheck, Audits, Zertifikate, Backups); in QS-Checklisten pro Release verankert (Modul 19).

## Übungen

1.  Nenne fünf häufige Fehler, die der HTML-Validator findet.

2.  Wie integrierst du Validierung und Linting in den Entwicklungsprozess?

3.  Erstelle eine Review-Checkliste mit mindestens fünf Punkten für einen CSS-Pull-Request.

4.  Was ist ein visueller Regressionstest und wann ist er sinnvoll?

5.  Welche Inhalte gehören in eine README?

## Lösungen

1.  Doppelte `id`s, nicht geschlossene Tags, falsche Verschachtelung (z. B. `div` in `p`), fehlendes `alt`, ungültige Attributwerte/veraltete Elemente.

2.  Im Editor, per Pre-Commit-Hook und als Pflichtschritt in der CI (Merge nur bei bestandenen Prüfungen).

3.  Siehe Checkliste im Abschnitt „Code Reviews“ (Tokens, Spezifität, Mobile First, `!important`, Fokus-Styles, Kontrast).

4.  Er vergleicht Screenshots vor und nach einer Änderung pro Viewport und meldet Abweichungen; sinnvoll bei Refactorings, Designsystem-Änderungen und vielen Komponenten.

5.  Zweck, Setup, Build/Test-Befehle, Struktur, Deployment, Konventionen, Kontakt.
