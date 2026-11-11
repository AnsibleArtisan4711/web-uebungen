# User Flows

Mermaid-Diagramme werden von GitHub direkt gerendert. Im Editor siehst du sie je nach Vorschau nur als Text.

## Flow 1: Kontakt aufnehmen

```mermaid
flowchart TD
    A([Einstieg: Startseite]) --> B[Navigation: Kontakt]
    B --> C[Formular ausfüllen]
    C --> D{Eingaben gültig?}
    D -- nein --> E[Fehlermeldung am Feld]
    E --> C
    D -- ja --> F[Absenden]
    F --> G([Bestätigungsseite])
    C -. Abbruch .-> H([Zurück zur Startseite])
```

Fehlerfälle: ungültige E-Mail, leere Pflichtfelder, Abbruch. Die Eingaben bleiben beim Fehler erhalten.

## Flow 2: Projekt ansehen

```mermaid
flowchart TD
    A([Einstieg: Startseite]) --> B[Alle Projekte ansehen]
    B --> C[Projektkarte lesen]
    C --> D{Interessant?}
    D -- ja --> E[Zum Repository auf GitHub]
    D -- nein --> F[Nächste Karte]
    F --> C
    E --> G([Ziel erreicht])
```

## Flow 3: Blogbeitrag lesen

```mermaid
flowchart TD
    A([Einstieg: Suchmaschine oder Blogübersicht]) --> B[Beitrag öffnen]
    B --> C[Lesen]
    C --> D{Weitere Beiträge?}
    D -- ja --> E[Zurück zur Übersicht]
    E --> B
    D -- nein --> F([Ziel erreicht])
```

Sackgassen gibt es nur dann nicht, wenn jeder Beitrag einen Link zurück zur Übersicht hat.
