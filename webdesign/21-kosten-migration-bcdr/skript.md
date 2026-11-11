# Modul 21: Kosten, Migration, Governance und BCDR

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 20 h \| **Priorität:** 3 \| **Lerneinheiten:** 18

## Lerneinheiten laut Lehrplan

| **Lerneinheit**             | **Dauer (h)** | **Prio** |
|:----------------------------|--------------:|---------:|
| Projektkosten               |             1 |        3 |
| Relaunch-Planung            |             1 |        3 |
| Migration von Inhalten      |           1,5 |        3 |
| Design Governance           |             1 |        3 |
| Dokumentation und Ownership |             1 |        3 |
| Backup und Restore          |           1,5 |        3 |
| BCDR                        |             1 |        3 |
| Roadmap                     |             1 |        3 |
| Legacy-Markup               |             1 |        3 |
| Relaunch-Migration          |             1 |        3 |
| CMS-Templates               |           1,5 |        3 |
| Governance-Regeln           |             1 |        3 |
| Kosten und Aufwand          |             1 |        3 |
| CSS Security Risks          |             1 |        3 |
| Third-Party CSS             |             1 |        3 |
| Browser-Kompatibilität      |           1,5 |        3 |
| Migration von Legacy CSS    |             1 |        3 |
| Kosten und Wartung          |             1 |        3 |
| **Summe**                   |        **20** |          |

## Überblick

Dieses Modul behandelt die betriebswirtschaftliche und organisatorische Seite: Was kostet ein Webprojekt, wie plant man einen Relaunch und eine Migration, wie hält man ein Designsystem unter Kontrolle (Governance) und wie bleibt man bei Ausfall, Datenverlust oder Angriff handlungsfähig (Backup, Restore, BCDR). Es ist niedrig priorisiert, aber für Projektleitung und Betrieb zentral.

## Projektkosten und Kosten und Aufwand

**Kostentreiber:** Umfang (Seitenanzahl, Seitentypen, Komponenten), Funktionen (Formulare, Shop, Login, Suche, Mehrsprachigkeit), Design (Standardtemplate vs. individuell), Inhalte (Texte, Fotos, Migration), Barrierefreiheit und Datenschutz, Integrationen (CRM, ERP, Zahlungsanbieter), Qualitätssicherung, Projektmanagement, Schulung.

| **Methode**        | **Beschreibung**                                                                                                                            |
|:-------------------|:--------------------------------------------------------------------------------------------------------------------------------------------|
| Bottom-up          | Aufgaben in Arbeitspakete zerlegen, Stunden schätzen (Konzeption, Design, Umsetzung, QS, Projektmanagement), mit Stundensatz multiplizieren |
| Analogie           | Vergleich mit ähnlichen früheren Projekten                                                                                                  |
| Dreipunktschätzung | (optimistisch + 4× wahrscheinlich + pessimistisch) / 6                                                                                      |

> **Praxisbeispiel: Kalkulation Firmenwebsite**
>
> Konzeption/IA 16 h, Design 32 h, Umsetzung 60 h, CMS und Inhalte 24 h, QS (Browser, Accessibility, Performance) 16 h, Projektmanagement 15 % auf die Summe. Summe ohne PM: 148 h; PM: 22,2 h; gesamt 170,2 h. Bei 90 €/h: 15.318 €; zuzüglich Risikopuffer (10–20 %) und Betriebskosten (Hosting, Domain, Wartung, Lizenzen).

**Laufende Kosten (TCO):** Hosting, Domain, Zertifikate, Wartung und Updates, Lizenzen (Plug-ins, Schriften, Stockfotos), Content-Pflege, Monitoring, Weiterentwicklung. Faustregel: Über die Lebensdauer übersteigen die Betriebskosten oft die Erstellungskosten. Angebote enthalten Leistungsumfang, Abnahmekriterien, Korrekturrunden, Änderungswunsch-Verfahren, Nutzungsrechte und Zahlungsplan (Teilzahlungen nach Meilensteinen).

## Relaunch-Planung und Roadmap

**Ablauf:**

1.  **Analyse:** Ziele, Probleme der alten Seite, Analytics, Content-Audit (behalten, überarbeiten, löschen), SEO-Bestandsaufnahme (Rankings, Backlinks, URL-Liste).

2.  **Konzept und Design:** neue Informationsarchitektur, Designsystem, Technologieentscheidung.

3.  **URL-Mapping und Weiterleitungen:** jede alte URL erhält ein Ziel (301-Weiterleitung), sonst droht Ranking- und Trafficverlust.

4.  **Umsetzung und Migration** auf einer Staging-Umgebung (mit `noindex`/Passwortschutz).

5.  **Tests:** Funktion, Redirects, Accessibility, Performance, Tracking, Formulare, Rechtstexte.

6.  **Go-live** mit Fenster, Rollback-Plan, anschließendem Monitoring (Search Console, 404-Berichte).

7.  **Hypercare** in den ersten Wochen.

**Roadmap:** zeitlich gestaffelte Planung (MVP → Erweiterungen), Meilensteine, Abhängigkeiten, Verantwortliche, Review-Zyklen; priorisiert nach Nutzen und Aufwand (z. B. MoSCoW: Must/Should/Could/Won’t).

## Migration von Inhalten, Legacy-Markup, CMS-Templates, Legacy CSS

**Content-Migration:** Inventar (Seiten, Medien, Metadaten), Zielstruktur, Mapping Altfeld → Neufeld, automatisiert (Skripte, Importer) oder manuell, Bereinigung (Formatierung, defekte Links, Bilder), Qualitätsprüfung per Stichprobe und Linkchecker.

**Legacy-Markup erkennen:** Layout-Tabellen, `<font>`, `<center>`, `<b>`/`<i>` nur für Optik, Inline-Styles in Massen, `<br>`-Ketten als Abstand, leere Absätze, `<div>`-Suppe ohne Semantik, fehlendes `lang`, `id`-Duplikate, Frames, Flash-Reste.

```html
<!-- Legacy -->
<table width="100%"><tr><td><font size="5"><b>Willkommen</b></font><br><br>Text...</td></tr></table>

<!-- Migriert: semantisch + CSS -->
<section><h1>Willkommen</h1><p>Text...</p></section>
```

**Migration von Legacy-CSS:** Bestandsaufnahme (Coverage, Spezifitätsanalyse), Tokens extrahieren, Dopplungen entfernen, Komponenten neu schneiden (BEM/Layer, Modul 17), alte Layout-Hacks (Floats, Clearfix, `inline-block`-Gitter) durch Flexbox/Grid ersetzen, `px`-Layouts durch fluide Einheiten, schrittweise und mit visuellen Regressionstests (Modul 20).

**CMS-Templates:** Templates strukturieren Ausgabe (z. B. WordPress-Theme, TYPO3-Fluid, Twig/Blade). Bei Migration: Template-Hierarchie dokumentieren, Wiederverwendung über Partials/Komponenten, Redakteursfelder statt Freitext-HTML, Barrierefreiheit im Template verankern, Child-Themes/Overrides statt Kernänderungen, Versionierung in Git.

## Governance: Design Governance, Ownership, Regeln

**Design Governance** regelt, wie ein Designsystem und ein einheitlicher Auftritt gepflegt werden:

- **Ownership:** benannte Verantwortliche für Designsystem, Komponenten, Inhalte, Betrieb, Datenschutz, Barrierefreiheit (z. B. RACI-Matrix: Responsible, Accountable, Consulted, Informed).

- **Prozess für Änderungen:** Vorschlag → Review (Design, Entwicklung, Accessibility) → Aufnahme in die Bibliothek → Dokumentation → Versionierung (Semantic Versioning) und Changelog.

- **Governance-Regeln:** verbindliche Tokens und Komponenten, Pflicht-Checks (Linting, WCAG AA, Performance-Budget), Ausnahmeprozess („Wann darf abgewichen werden?“), Deprecation-Policy, Browser-Support-Policy.

- **Dokumentation und Ownership:** Wer kennt Zugänge, Hosting, DNS, Lizenzen? Passwort-Manager, Übergabedokumentation, Bus-Faktor \> 1.

## CSS-Sicherheitsrisiken, Third-Party CSS, Browser-Kompatibilität

**CSS Security Risks:** CSS kann Informationen preisgeben und manipulieren.

- *CSS Exfiltration:* Attributselektoren mit externen `background-image`-URLs können Eingabewerte oder Tokens zeichenweise an Fremdserver melden (z. B. `input[value^="a"]` zusammen mit einer externen `background`-URL). Voraussetzung: Angreifer kann CSS einschleusen.

- *UI-Redressing/Clickjacking* durch überlagerte Frames; Gegenmittel `frame-ancestors`/`X-Frame-Options`.

- *Link-Verlauf-Leaks* (`:visited`) wurden durch Browser stark eingeschränkt.

Gegenmaßnahmen: Content Security Policy (`style-src`, `img-src`, `font-src` auf vertrauenswürdige Quellen begrenzen, Modul 18), keine Nutzer-CSS ungeprüft ausgeben, Sanitizing, Referrer-Policy.

**Third-Party CSS** (Bibliotheken, Widgets, Fonts, Cookie-Banner, CDN): Risiken sind Supply-Chain-Angriffe, Ausfall, Datenschutz (IP-Übermittlung), Performance (Render Blocking) und Überschreib-Konflikte. Maßnahmen: selbst hosten, Version fixieren, SRI, Auswahl nach Pflege und Lizenz, `@layer vendor` niedrig priorisieren (Modul 17), Inventar aller Drittanbieter mit Zweck und Verantwortlichem, regelmäßiger Review.

**Browser-Kompatibilität:** Support-Policy festlegen (z. B. „aktuelle und vorletzte Version von Chrome, Edge, Firefox, Safari; iOS-Safari ab Version X“) auf Basis von Analytics; Features über *Baseline*, caniuse und MDN bewerten; *Progressive Enhancement* und `@supports` für neue Features; Autoprefixer/Browserslist; Tests in Matrix und auf echten Geräten (Modul 7 und 19). Dokumentiere bewusste Einschränkungen („Subgrid-Fallback ohne Zeilenausrichtung“).

```css
.karten { display: flex; flex-wrap: wrap; gap: 1rem; }          /* Basis fuer alle */
@supports (grid-template-rows: subgrid) {
  .karten { display: grid; grid-template-columns: repeat(3, 1fr); }
  .karte  { display: grid; grid-template-rows: subgrid; grid-row: span 3; }
}
```

## Backup, Restore und BCDR

**Begriffe:** *BCDR* = Business Continuity and Disaster Recovery: Geschäftsbetrieb aufrechterhalten (Continuity) und nach Ausfällen wiederherstellen (Recovery). **RPO** (Recovery Point Objective) = maximal tolerierter Datenverlust (Zeitspanne), **RTO** (Recovery Time Objective) = maximal tolerierte Ausfallzeit.

- **3-2-1-Regel:** mindestens 3 Kopien der Daten, auf 2 verschiedenen Medien, 1 Kopie extern (offsite, idealerweise unveränderlich/offline). Moderne Erweiterung: 3-2-1-1-0 (1 unveränderliche Kopie, 0 Fehler beim Restore-Test).

- **Was sichern?** Dateien (Code, Uploads, Medien), Datenbank, Konfiguration, DNS-Einträge, Zertifikate, Zugangsdaten (im Passwort-Manager), Infrastruktur als Code. Code liegt zusätzlich in Git.

- **Arten:** Voll-, inkrementelle und differenzielle Sicherung; Snapshots; automatisiert und zeitlich gestaffelt (täglich/wöchentlich/monatlich) mit Aufbewahrungsfrist.

- **Restore-Test:** Ein Backup ist erst gültig, wenn die Wiederherstellung erprobt ist (regelmäßig, protokolliert, mit gemessener Dauer gegenüber RTO).

- **Sicherheit:** Backups verschlüsseln, Zugriff trennen (Schutz vor Ransomware), DSGVO: Aufbewahrungsfristen und Löschkonzept auch für Backups.

**Notfallplanung (Disaster-Recovery-Plan):** Szenarien (Serverausfall, Datenverlust, Hackerangriff, Anbieterausfall, Domainverlust, menschlicher Fehler), Kontaktliste und Eskalation, Priorisierung der Wiederherstellung, Schritt-für-Schritt-Runbooks, Kommunikationsplan (Kundschaft, Statusseite, Behörden bei Datenschutzverletzung: Meldung binnen 72 Stunden nach Art. 33 DSGVO), Wartungsseite/Fallback (statische Notfallseite), regelmäßige Übungen.

> **Praxisbeispiel: Restore-Anforderung**
>
> Shop mit RPO 1 h und RTO 4 h: Datenbank-Backups stündlich plus Binärlog, Dateien täglich, Offsite-Kopie, dokumentiertes Runbook und halbjährlicher Restore-Test auf einer Staging-Instanz. Bei Ausfall: Umschalten auf Wartungsseite, Wiederherstellung nach Runbook, Funktionstest, Freigabe, Kommunikation.

## Übungen

1.  Kalkuliere ein Projekt mit 120 Stunden, 85 €/h, 15 % Projektmanagement auf die Stunden und 10 % Risikopuffer auf die Summe.

2.  Welche Schritte sind bei einem Relaunch für das SEO-Ranking entscheidend?

3.  Nenne vier Merkmale von Legacy-Markup und die moderne Entsprechung.

4.  Erkläre RPO und RTO und die 3-2-1-Regel.

5.  Wie reduzierst du Risiken durch Third-Party-CSS?

6.  Welche Regelungen gehören in Design Governance?

## Lösungen

1.  PM: 120 × 0,15 = 18 h; gesamt 138 h × 85 = 11.730 €; +10 % = 12.903 €.

2.  URL-Mapping und 301-Weiterleitungen, Beibehaltung guter Inhalte/Titel/Überschriften, Staging mit `noindex`, XML-Sitemap und Search-Console-Einreichung, Monitoring von 404 und Rankings nach dem Start.

3.  Layout-Tabellen → CSS Grid/Flexbox; `<font>`/`<center>` → CSS; `<b>`/`<i>` für Optik → `<strong>`/`<em>` bzw. CSS; `<br>`-Ketten → Margins/Absätze; `div`-Suppe → semantische Elemente.

4.  RPO = max. tolerierter Datenverlust, RTO = max. tolerierte Ausfallzeit; 3 Kopien, 2 Medien, 1 extern.

5.  Selbst hosten, Version fixieren, SRI, CSP, Layer, Inventar und Review, Alternativen prüfen.

6.  Ownership/RACI, Änderungsprozess, Pflichtprüfungen (WCAG, Performance, Lint), Versionierung und Deprecation, Browser-Support-Policy, Ausnahmeregelung, Dokumentation.
