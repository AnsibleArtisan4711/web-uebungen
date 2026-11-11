# Modul 13: SEO, Content-Strategie und technische Qualität

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 15,5 h \| **Priorität:** 1 \| **Lerneinheiten:** 14

## Lerneinheiten laut Lehrplan

| **Lerneinheit**            | **Dauer (h)** | **Prio** |
|:---------------------------|--------------:|---------:|
| Keyword- und Suchintention |             1 |        2 |
| Metadaten                  |             1 |        2 |
| Headings und Content       |           1,5 |        2 |
| Interne Verlinkung         |             1 |        2 |
| Strukturierte Daten        |             1 |        2 |
| Indexierbarkeit            |           1,5 |        3 |
| Content Governance         |             1 |        3 |
| SEO-Audits                 |             1 |        3 |
| title und description      |             1 |        1 |
| Meta Charset               |             1 |        1 |
| Viewport                   |           1,5 |        1 |
| Canonical Links            |             1 |        1 |
| Open Graph                 |             1 |        1 |
| Favicons und Manifest      |             1 |        2 |
| **Summe**                  |      **15,5** |          |

## Überblick

Suchmaschinenoptimierung (SEO) sorgt dafür, dass Inhalte gefunden werden: durch *relevante Inhalte* (Content), *saubere Technik* (Crawlbarkeit, Geschwindigkeit, Struktur) und *Vertrauen* (Verlinkung, Autorität). Gutes semantisches HTML (Modul 2), Performance (Modul 16) und Barrierefreiheit (Modul 14) sind gleichzeitig die beste technische SEO-Basis.

## Keyword, Suchintention, Headings und Content

**Suchintention** (Search Intent) bestimmt, welche Seite zur Suche passt:

| **Intention**         | **Beispielsuche**           | **Passender Inhalt**          |
|:----------------------|:----------------------------|:------------------------------|
| Informational         | „wie funktioniert CSS Grid“ | Ratgeber, Anleitung           |
| Navigational          | „Beispiel GmbH Kontakt“     | Kontakt-/Markenseite          |
| Transaktional         | „Webdesign Angebot Wien“    | Leistungsseite mit klarem CTA |
| Kommerziell/Vergleich | „bestes CMS für KMU“        | Vergleich, Testbericht        |

**Vorgehen:** Keywords recherchieren (Suchbegriffe der Zielgruppe, Google Search Console, Suggest, Keyword-Tools), pro Seite *ein Hauptthema* mit Haupt-Keyword und verwandten Begriffen planen, Inhalte für Menschen schreiben (keine Keyword-Häufung). **Headings und Content:** Haupt-Keyword natürlich in `h1`, `title`, URL und Einleitung; `h2`/`h3` gliedern Unterthemen und beantworten konkrete Fragen; Absätze kurz und klar; Mehrwert statt Füllmaterial.

## Metadaten im Head: title, description, charset, viewport

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CSS Grid lernen: Anleitung mit Beispielen | Beispiel GmbH</title>
  <meta name="description" content="CSS Grid Schritt für Schritt: Tracks, Areas und responsive Layouts mit praxisnahen Beispielen.">
  <link rel="canonical" href="https://www.beispiel.at/css-grid/">
  <meta name="robots" content="index, follow">
</head>
```

- **title:** eindeutig pro Seite, ca. 50–60 Zeichen (Anzeige kürzt nach Pixelbreite), wichtigstes zuerst, Marke am Ende.

- **description:** ca. 120–160 Zeichen, nutzenorientierte Zusammenfassung mit Handlungsaufforderung; kein Rankingfaktor, aber beeinflusst Klickrate; Google darf sie ersetzen.

- **charset:** `utf-8` in den ersten 1024 Byte; **viewport:** Voraussetzung für mobile Darstellung (Modul 7); **lang** am `html`-Element.

## Canonical, Indexierbarkeit, Interne Verlinkung

- **Canonical Link:** nennt die bevorzugte URL bei Duplikaten (z. B. mit/ohne Parameter, `www` und ohne `www`); jede Seite verweist per *selbstreferenzierendem* Canonical auf sich.

- **Indexierbarkeit:** `robots.txt` steuert das *Crawling* (nicht die Indexierung!); `noindex` (Meta-Tag oder HTTP-Header `X-Robots-Tag`) verhindert die *Indexierung* und funktioniert nur, wenn die Seite crawlbar ist. `sitemap.xml` listet wichtige URLs; Einreichen in der Search Console.

- **HTTP-Statuscodes:** 200 OK, 301 permanente Weiterleitung, 302 temporär, 404 nicht gefunden (hilfreiche Fehlerseite), 410 gelöscht, 5xx Serverfehler.

- **Interne Verlinkung:** wichtige Seiten von vielen Stellen *sprechend* verlinken (Ankertext = Thema), flache Hierarchie, Breadcrumbs, keine Waisenseiten (Seiten ohne eingehende Links), echte `<a href>`-Links (keine Klicks nur per JavaScript).

```text
# robots.txt (Ausschnitt)
User-agent: *
Disallow: /intern/
Sitemap: https://www.beispiel.at/sitemap.xml
```

## Open Graph, Favicons und Manifest

```html
<!-- Social Sharing -->
<meta property="og:type" content="website">
<meta property="og:title" content="CSS Grid lernen">
<meta property="og:description" content="Tracks, Areas und responsive Layouts.">
<meta property="og:url" content="https://www.beispiel.at/css-grid/">
<meta property="og:image" content="https://www.beispiel.at/img/og-css-grid.jpg">   <!-- ca. 1200x630 -->
<meta name="twitter:card" content="summary_large_image">

<!-- Icons und Manifest -->
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#1a3c6e">
```

Open Graph steuert Vorschau (Titel, Bild, Text) beim Teilen in sozialen Netzwerken und Messengern; das Bild braucht absolute URLs. Das *Web App Manifest* (JSON) beschreibt Name, Icons, Farben und Startseite für „Zum Startbildschirm hinzufügen“/PWA.

## Strukturierte Daten

*Strukturierte Daten* beschreiben Inhalte maschinenlesbar (Schema.org-Vokabular), meist als **JSON-LD**. Ermöglichen Rich Results (Sterne, FAQ, Breadcrumbs, Veranstaltungen, Produkte), garantieren sie aber nicht.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Beispiel GmbH",
  "url": "https://www.beispiel.at/",
  "telephone": "+43 1 555 1234",
  "address": { "@type": "PostalAddress", "streetAddress": "Hauptstraße 1",
               "postalCode": "1010", "addressLocality": "Wien", "addressCountry": "AT" },
  "openingHours": "Mo-Fr 08:00-17:00"
}
</script>
```

**Wichtig:** Angaben müssen mit dem sichtbaren Inhalt übereinstimmen. Test mit dem Rich-Results-Test von Google und dem Schema-Markup-Validator.

## Content Governance, SEO-Audits

**Content Governance:** Wer darf Inhalte erstellen, prüfen, veröffentlichen? Redaktionsplan, Styleguide für Texte (Ton, Terminologie), Verantwortliche je Bereich, regelmäßige Aktualisierung/Archivierung veralteter Inhalte, Vermeidung von Duplicate Content.

**SEO-Audit (Ablauf):** (1) Crawl mit Tool (z. B. Screaming Frog), (2) Indexierung und Fehler in der Search Console, (3) Titel/Descriptions/Überschriften je Seite, (4) Statuscodes und Weiterleitungsketten, (5) Core Web Vitals (Modul 16), (6) Mobile Nutzbarkeit, (7) strukturierte Daten, (8) interne Links und Waisenseiten, (9) Duplikate/Canonical, (10) Priorisierte Maßnahmenliste.

> **Ergänzung aus der Nachrecherche: Technische Qualität als Rankingbasis**
>
> Google bewertet u. a. Page Experience (Core Web Vitals, HTTPS, mobile Nutzbarkeit), und indexiert primär die *mobile* Version (Mobile-First-Indexing): Inhalte, die nur in der Desktop-Version stehen, zählen nicht. Inhalte, die erst per JavaScript erzeugt werden, werden zwar gerendert, aber verzögert und fehleranfälliger; wichtige Inhalte und Links also im initialen HTML liefern (Server-Side Rendering bzw. statische Generierung). Für Mehrsprachigkeit `hreflang`-Links verwenden.

## Übungen

1.  Schreibe `title` und `meta description` für eine Seite „Barrierefreie Webseiten Wien“.

2.  Was ist der Unterschied zwischen `robots.txt`-Sperre und `noindex`?

3.  Wofür dient der Canonical-Link? Nenne ein Beispiel.

4.  Welche Open-Graph-Angaben braucht eine gut teilbare Seite mindestens?

5.  Warum sollten Inhalte und Links im initialen HTML stehen?

## Lösungen

1.  z. B. `<title>Barrierefreie Webseiten in Wien | Beispiel GmbH</title>` und Description mit Nutzen/CTA (ca. 140 Zeichen).

2.  `robots.txt` verbietet das Crawlen (die URL kann trotzdem indexiert werden, wenn verlinkt); `noindex` verhindert die Indexierung, setzt aber Crawlbarkeit voraus.

3.  Er nennt die bevorzugte URL bei Duplikaten: `/produkt?farbe=rot` und `/produkt` mit Canonical auf `/produkt`.

4.  `og:title`, `og:description`, `og:image` (absolute URL, ca. 1200×630), `og:url`, `og:type`.

5.  Crawler rendern JavaScript verzögert und unvollständig; Inhalte im HTML werden sicher und schnell erfasst (auch von Assistenztechnik und bei JavaScript-Fehlern).
