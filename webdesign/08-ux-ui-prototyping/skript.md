# Modul 8: UX/UI Design, Wireframes und Prototyping

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 9 h \| **Priorität:** 1 \| **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Lerneinheit**       | **Dauer (h)** | **Prio** |
|:----------------------|--------------:|---------:|
| User Needs            |             1 |        1 |
| User Flows            |             1 |        1 |
| Wireframes            |           1,5 |        1 |
| Prototyping           |             1 |        1 |
| Interaktionsdesign    |             1 |        1 |
| Usability-Heuristiken |           1,5 |        2 |
| Design Review         |             1 |        2 |
| Stakeholder-Abnahme   |             1 |        2 |
| **Summe**             |         **9** |          |

## Überblick

UX (User Experience) umfasst das gesamte Erleben eines Produkts, UI (User Interface) die gestaltete Oberfläche. Gutes Webdesign beginnt nicht mit Farben, sondern mit der Frage: Was will der Nutzer erreichen? Methoden wie User Flows, Wireframes und Prototypen machen Entscheidungen früh sichtbar und testbar, bevor teuer programmiert wird.

> **Merke**
>
> Der typische Ablauf: **Verstehen** (User Needs) → **Strukturieren** (User Flows, Informationsarchitektur) → **Skizzieren** (Wireframes) → **Simulieren** (Prototyp) → **Testen** → **Verbessern**. Der Kreislauf wiederholt sich.

## User Needs

**User Needs** sind die tatsächlichen Ziele und Probleme der Nutzer, nicht Wünsche an Funktionen. Ermittlung: Interviews, Umfragen, Beobachtung, Support-Anfragen, Analytics, Suchbegriffe. Dokumentation als:

- **Personas** (typische Nutzer mit Zielen, Kontext, Hindernissen),

- **User Stories**: „Als *Rolle* möchte ich *Ziel*, damit *Nutzen*.“ Beispiel: „Als Kundin möchte ich Öffnungszeiten sofort sehen, damit ich nicht vergeblich anreise.“

- **Jobs-to-be-done** und **Empathy Maps** (denkt, fühlt, sagt, tut).

## User Flows

Ein *User Flow* zeigt den Weg eines Nutzers zu einem Ziel (Einstieg, Entscheidungen, Aktionen, Ziel, Fehlerfälle). Notation: Rechtecke = Schritte/Seiten, Rauten = Entscheidungen, Pfeile = Wege.

> **Praxisbeispiel: User Flow „Termin buchen“**
>
> Startseite → Leistung wählen → Termin wählen → \[Angemeldet?\] *ja:* Daten bestätigen / *nein:* Gastdaten eingeben → Bestätigung → E-Mail mit Termin. *Fehlerfälle:* Termin nicht mehr frei, ungültige E-Mail, Abbruch (Warenkorb/Daten bleiben erhalten). Ziel: möglichst wenige Schritte und keine Sackgassen.

## Wireframes

Ein *Wireframe* ist ein reduzierter Layoutentwurf ohne Farben, Bilder und Schmuck. Er klärt: Welche Inhalte gibt es? In welcher Rangfolge? Wo stehen Navigation und Handlungsaufforderungen (Call to Action)?

- **Low Fidelity:** Papierskizze, Whiteboard, grobe Boxen: schnell, billig, Diskussion über Struktur.

- **Mid/High Fidelity:** echte Texte, Raster, Abstände: Übergang zum Design.

- **Mobile First skizzieren:** zuerst die kleine Ansicht, dann Erweiterungen für große Viewports.

- **Werkzeuge:** Figma, Penpot (Open Source), Balsamiq, Whimsical, Miro, Papier und Stift.

## Prototyping, Interaktionsdesign

Ein *Prototyp* simuliert Bedienung (klickbare Verknüpfungen, Übergänge, Zustände) und eignet sich für Nutzertests und Abnahme. Varianten: klickbares Figma-Prototyping, HTML/CSS-Prototyp (realistisches Verhalten, direkt wiederverwendbar). Teste immer mit echten Inhalten, nicht mit „Lorem ipsum“, sonst bleiben Längen- und Umbruchprobleme verborgen.

**Interaktionsdesign** legt fest, wie Elemente auf Eingaben reagieren. Bausteine:

- **Zustände** jedes Elements: normal, hover, fokussiert, aktiv, deaktiviert, Lade-, Fehler- und Leerzustand.

- **Feedback:** sofortige, verständliche Reaktion (Button-Zustand, Fortschrittsanzeige, Bestätigung).

- **Affordance und Signifier:** Aussehen verrät Bedienbarkeit (Button wirkt klickbar; Link erkennbar).

- **Konsistenz:** gleiche Muster für gleiche Aufgaben.

- **Fehlertoleranz:** Rückgängig machen, Bestätigung bei destruktiven Aktionen.

## Usability-Heuristiken

> **Ergänzung aus der Nachrecherche: Die 10 Heuristiken nach Nielsen**
>
> 1.  Sichtbarkeit des Systemstatus (Ladeanzeigen, Fortschritt).
>
> 2.  Übereinstimmung zwischen System und realer Welt (Sprache der Nutzer).
>
> 3.  Nutzerkontrolle und Freiheit (Abbrechen, Rückgängig).
>
> 4.  Konsistenz und Standards.
>
> 5.  Fehlervermeidung (Hinweise, Voreinstellungen, Bestätigung).
>
> 6.  Wiedererkennen statt Erinnern (Optionen sichtbar).
>
> 7.  Flexibilität und Effizienz (Shortcuts, Filter).
>
> 8.  Ästhetisches und minimalistisches Design (keine irrelevanten Informationen).
>
> 9.  Hilfe beim Erkennen, Diagnostizieren und Beheben von Fehlern (klare Fehlermeldungen).
>
> 10. Hilfe und Dokumentation.
>
> Einsatz: *Heuristische Evaluation* – mehrere Prüfer bewerten unabhängig anhand der Liste und gewichten Befunde nach Schwere. Ergänzend: Usability-Test mit 5 Personen deckt erfahrungsgemäß die meisten Hauptprobleme auf.

Ergänzende Gesetzmäßigkeiten: *Hick* (mehr Optionen = längere Entscheidung), *Fitts* (große, nahe Ziele sind schneller zu treffen), *Miller* (begrenzte Merkfähigkeit), visuelle Hierarchie (Größe, Kontrast, Abstand, Gruppierung/Nähe).

## Design Review und Stakeholder-Abnahme

**Design Review:** strukturierte Besprechung des Entwurfs anhand Zielen, Briefing, Heuristiken, Accessibility und Machbarkeit. Feedback beschreibt *Wirkung und Problem*, nicht Geschmack („Der Kontrast der Zeile ist zu gering für Maria“ statt „gefällt mir nicht“).

**Stakeholder-Abnahme:** Auftraggeber, Fachabteilung, ggf. Recht/Datenschutz prüfen an definierten Meilensteinen (Konzept, Design, Umsetzung). Gute Praxis: Abnahmekriterien vorab schriftlich festhalten, Änderungswünsche versioniert sammeln, Freigaben dokumentieren (Protokoll, Ticket), Rundenanzahl für Korrekturen im Angebot regeln.

## Übungen

1.  Formuliere drei User Stories für einen Online-Shop in der Form „Als … möchte ich …, damit …“.

2.  Skizziere (Text/Papier) einen Wireframe für eine Startseite, Mobile First: Header, Hero mit Call to Action, drei Leistungen, Kontakt.

3.  Welche Zustände braucht ein Formularfeld? (mindestens fünf)

4.  Ordne zu: „Ladebalken beim Upload“ und „Rückgängig-Button“ zu je einer Heuristik.

5.  Was unterscheidet Wireframe, Mockup und Prototyp?

## Lösungen

1.  z. B. „Als Kundin möchte ich nach Größe filtern, damit ich nur passende Artikel sehe.“; „Als Käufer möchte ich als Gast bestellen, damit ich kein Konto anlegen muss.“; „Als Nutzer möchte ich Lieferkosten vor der Kasse sehen, damit es keine Überraschung gibt.“

2.  Siehe Struktur: Logo+Menü-Button, Hero mit Überschrift und CTA-Button, drei gestapelte Leistungs-Karten, Kontaktblock, Footer; ab Tablet nebeneinander.

3.  Normal, Hover, Fokus, Ausgefüllt, Deaktiviert, Fehler, Erfolg, Schreibgeschützt, Leer (Placeholder).

4.  Ladebalken = Sichtbarkeit des Systemstatus; Rückgängig = Nutzerkontrolle und Freiheit.

5.  Wireframe = strukturelle Skizze ohne Gestaltung; Mockup = visuell ausgearbeiteter statischer Entwurf; Prototyp = interaktive Simulation der Bedienung.
