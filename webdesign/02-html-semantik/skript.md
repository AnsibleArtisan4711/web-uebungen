# Modul 2: HTML, Semantik und Informationsarchitektur

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 18 h \| **Priorität:** 1 \| **Lerneinheiten:** 16

## Lerneinheiten laut Lehrplan

| **Lerneinheit**           | **Dauer (h)** | **Prio** |
|:--------------------------|--------------:|---------:|
| HTML-Dokumentstruktur     |             1 |        1 |
| Semantische Elemente      |             1 |        1 |
| Navigation und Landmarken |           1,5 |        1 |
| Content-Hierarchie        |             1 |        1 |
| Formulare                 |             1 |        1 |
| Bilder und Medien         |           1,5 |        2 |
| SEO-Basisstruktur         |             1 |        2 |
| HTML-Validierung          |             1 |        2 |
| Semantisches HTML         |             1 |        1 |
| Landmark-Elemente         |             1 |        1 |
| Heading-Hierarchie        |           1,5 |        1 |
| section und article       |             1 |        1 |
| aside und footer          |             1 |        1 |
| main und nav              |           1,5 |        2 |
| Content-Modell            |             1 |        2 |
| Strukturreview            |             1 |        2 |
| **Summe**                 |        **18** |          |

## Überblick

Semantisches HTML wählt Elemente nach ihrer *Bedeutung*, nicht nach ihrem Aussehen. Das nützt Screenreadern und Tastaturnutzern (Orientierung), Suchmaschinen (Verständnis der Inhalte), der Wartbarkeit (lesbarer Code) und dem Browser (eingebaute Funktionen wie Fokus und Tastatursteuerung). *Informationsarchitektur* (IA) ist die Planung dahinter: Wie werden Inhalte gruppiert, benannt und auffindbar gemacht?

> **Merke**
>
> Frage bei jedem Element: **„Was ist das?“**, nicht „Wie soll es aussehen?“. Das Aussehen steuert CSS. `<div>` und `<span>` sind nur die Notlösung, wenn kein passendes Element existiert.

## Dokumentstruktur und semantische Elemente

```html
<body>
  <a class="skip-link" href="#inhalt">Zum Inhalt springen</a>
  <header>
    <a href="/" aria-label="Startseite"><img src="logo.svg" alt="Beispiel GmbH"></a>
    <nav aria-label="Hauptnavigation">
      <ul>
        <li><a href="/leistungen/" aria-current="page">Leistungen</a></li>
        <li><a href="/kontakt/">Kontakt</a></li>
      </ul>
    </nav>
  </header>
  <main id="inhalt">
    <h1>Leistungen</h1>
    <article>
      <h2>Webdesign</h2>
      <p>Wir gestalten responsive Websites.</p>
    </article>
    <aside aria-label="Hinweis"><p>Beratung jeden Dienstag.</p></aside>
  </main>
  <footer><p>&copy; 2026 Beispiel GmbH</p></footer>
</body>
```

| **Element** | **Einsatz**                                                                                      |
|:------------|:-------------------------------------------------------------------------------------------------|
| `<header>`     | Einleitender Bereich einer Seite oder eines `article`/`section` (Logo, Titel, Navigation)            |
| `<nav>`     | Hauptnavigationsblöcke (nicht jede Linkliste!)                                                   |
| `<main>`     | Hauptinhalt, **genau einmal** pro Seite, nicht in `article`/`aside`/`header`/`footer`               |
| `<article>`    | In sich abgeschlossener, eigenständig verwendbarer Inhalt (Blogbeitrag, Produktkarte, Kommentar) |
| `<section>`    | Thematischer Abschnitt *mit Überschrift*                                                         |
| `<aside>`    | Ergänzende, nebensächliche Inhalte (Randspalte, Infobox)                                         |
| `<footer>`    | Abschluss einer Seite oder eines Abschnitts (Kontakt, Impressum, Autor)                          |
| `<search>`    | Bereich mit Suchfunktion (neues Landmark-Element)                                                |

> **Ergänzung aus der Nachrecherche: section oder div? article oder section?**
>
> **Entscheidungshilfe:** (1) Würde der Inhalt allein, z. B. in einem Feed-Reader, Sinn ergeben? → `article`. (2) Ist es ein thematisch zusammengehöriger Abschnitt, der eine Überschrift verdient? → `section`. (3) Dient die Box nur dem Layout oder dem Styling? → `div`. Eine `section` ohne Überschrift ist meist ein `div`. Zusätzlich: `<section>` mit einem zugänglichen Namen (`aria-labelledby`) wird als Landmark (`region`) ausgegeben, ohne Namen nicht.

## Landmarken und Navigation

**Landmarken** (Landmark Regions) sind Orientierungspunkte, zu denen Screenreader-Nutzer per Tastenkürzel springen. Implizite Rollen: `header` (banner), `nav` (navigation), `main` (main), `aside` (complementary), `footer` (contentinfo), `form` mit Namen (form), `search` (search).

**Regeln:**

- Mehrere `nav`-Elemente unterscheidbar benennen: `aria-label="Hauptnavigation"`, `aria-label="Fußnavigation"`.

- `header`/`footer` sind nur dann Landmarken (banner/contentinfo), wenn sie direkt im `body` liegen; innerhalb von `article`/`section` nicht.

- Aktuelle Seite in der Navigation mit `aria-current="page"` markieren.

- Ein „Skip-Link“ ganz am Anfang erlaubt, die Navigation zu überspringen (siehe Modul 14).

## Heading-Hierarchie und Content-Hierarchie

`<h1>` bis `<h6>` bilden die *Gliederung* der Seite. Screenreader-Nutzer navigieren überwiegend per Überschriftenliste.

- Pro Seite **eine** `h1` (Seitenthema), danach `h2` für Hauptabschnitte, `h3` darunter usw.

- **Keine Ebenen überspringen** (kein `h2` direkt auf `h4`).

- Überschriftenebene folgt der Struktur, nicht der Schriftgröße: Größe über CSS regeln.

- Keine Überschriften für reinen Zierrat; keine fetten Absätze als Pseudo-Überschrift.

> **Ergänzung aus der Nachrecherche: Der HTML-Outline-Algorithmus existiert nicht**
>
> Die Spezifikation beschrieb früher einen Outline-Algorithmus, nach dem `h1` in jeder `section` „neu anfängt“. Kein Browser und kein Screenreader hat ihn je implementiert; er wurde entfernt. Daher gilt: Ebenen explizit und manuell korrekt vergeben. Prüfen mit der Browser-Erweiterung „HeadingsMap“ oder den Accessibility-Tools der DevTools.

## Informationsarchitektur

**Methoden:** Content-Inventar (Was gibt es?), *Card Sorting* (Nutzer gruppieren Karten, so entstehen verständliche Kategorien), *Tree Testing* (findet man Inhalte in der geplanten Struktur?), Sitemap, Navigationskonzept.

**Grundsätze:** Begriffe der Zielgruppe statt interner Fachsprache; flache, klare Hierarchien (nicht mehr als etwa 7 Hauptpunkte); wichtige Ziele (Kontakt, Preise) auf höchster Ebene; Breadcrumbs bei tiefer Struktur; sprechende URLs, die die Hierarchie abbilden (`/leistungen/webdesign/`). Die „3-Klick-Regel“ gilt als Mythos: Entscheidend ist, dass jeder Klick eindeutig und nachvollziehbar ist.

## Content-Modell, Formulare, Medien, SEO-Basis

**Content-Modell:** Die Spezifikation ordnet jedes Element Kategorien zu (*flow*, *phrasing*, *heading*, *sectioning*, *interactive*, *embedded*). Das Modell legt fest, was in was stehen darf. Beispiele: Ein `<p>` darf nur *phrasing content* enthalten (also kein `<div>`); ein `<a>` darf keine weiteren interaktiven Elemente (z. B. `<button>`) enthalten; `<ul>` darf direkt nur `<li>` enthalten. Verstöße zeigt der Validator.

**Formulare, Bilder und Medien** im Überblick (Details in Modul 6 und 7): Jedes Control braucht ein `<label>`; Bilder brauchen ein sinnvolles `alt`; Bildunterschriften gehören in `<figure>` mit `<figcaption>`.

**SEO-Basisstruktur:** eindeutiger `<title>`, `meta description`, genau eine `h1` mit dem Hauptthema, saubere Überschriftenhierarchie, aussagekräftige Linktexte (nicht „hier klicken“), `alt`-Texte, `lang`-Attribut.

## HTML-Validierung und Strukturreview

Validatoren prüfen gegen den Standard: *W3C Nu HTML Checker* (validator.w3.org/nu), lokal `html-validate`. Typische Fehler: nicht geschlossene Elemente, doppelte `id`, `<div>` in `<p>`, fehlendes `alt`, Block-in-Inline-Verstöße.

**Checkliste Strukturreview:**

1.  Genau ein `main`, eine `h1`, Überschriften lückenlos?

2.  Landmarken vorhanden und bei Mehrfachnutzung benannt?

3.  Richtige Elemente (Liste = `ul`/`ol`, Schaltfläche = `button`, Link = `a`)?

4.  Klick-Elemente nicht als `div` gebaut?

5.  Validator ohne Fehler? Tab-Reihenfolge logisch?

6.  Seite ohne CSS lesbar und sinnvoll gegliedert (Test: Styles in den DevTools abschalten)?

## Übungen

1.  Welches Element nimmst du für: (a) die Hauptnavigation, (b) einen Blogbeitrag in einer Übersicht, (c) eine Infobox am Rand, (d) eine reine Layout-Box?

2.  Was ist an dieser Gliederung falsch? `h1, h3, h2, h4`

3.  Warum sollte ein Button kein `<div onclick>` sein? Nenne drei Nachteile.

4.  Baue die Grundstruktur einer Seite mit Kopf, Navigation, Hauptinhalt mit zwei Abschnitten und Fußbereich.

5.  Warum ist `<p><div>Text</div></p>` ungültig und was macht der Browser daraus?

## Lösungen

1.  \(a\) `nav`, (b) `article`, (c) `aside`, (d) `div`.

2.  Die Ebene springt von `h1` auf `h3`, und danach folgt wieder `h2`. Richtig: `h1, h2, h3, h2, h3` (Ebenen nur um eins tiefer).

3.  Kein Tastaturfokus (nicht per Tab erreichbar), keine Aktivierung per Enter/Leertaste, keine Rolle „Schaltfläche“ für Screenreader; außerdem fehlen Disabled-Zustand und Formularverhalten.

4.  Siehe Beispiel „Dokumentstruktur“; mit `header`, `nav`, `main` (zwei `section` mit je `h2`) und `footer`.

5.  `p` erlaubt nur phrasing content, ein `div` ist flow content. Der Parser schließt das `p` implizit vor dem `div`; das DOM weicht damit vom Quelltext ab (leeres `p`, `div` daneben).
