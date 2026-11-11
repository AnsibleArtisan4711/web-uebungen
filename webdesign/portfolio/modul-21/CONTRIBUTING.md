# Mitarbeiten am Portfolio

Dieser Leitfaden hält die Konventionen fest. Was eine Maschine prüfen kann, prüft sie (Spalte „Durchsetzung“). Alles andere gilt durch Review.

## Einrichten

```
npm ci
git config core.hooksPath .githooks     (im Hauptordner des Repositories, einmalig)
npm run build
```

## Namen

| Gegenstand | Regel | Beispiel | Durchsetzung |
|---|---|---|---|
| Dateien und Ordner | Kleinbuchstaben, Ziffern, Bindestrich, keine Leerzeichen und Umlaute (Ausnahme: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`) | `projekt-a-400.webp` | `npm run namen` |
| CSS-Klassen | BEM: `block`, `block__element`, `block--modifier`; Elemente nicht verschachteln | `karte__text`, `btn--secondary` | Stylelint (`selector-class-pattern`) und `npm run namen` |
| Klassen für JavaScript | Präfix `js-`, ohne CSS-Regel | `js-formular` | `npm run namen` (erlaubt `js-` ohne CSS) |
| Benennung | nach Bedeutung, nicht nach Aussehen (`hinweis`, nicht `rot`) | `fehlermeldung` | Review |
| Sprache | deutsche Begriffe für Inhalte und Komponenten, englische Fachwörter nur, wo üblich (`btn`, `stack`) | | Review |
| Commits | Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:` | `fix: Fokus im Menü sichtbar` | Review |
| Branches | `feature/kurzer-name`, `fix/kurzer-name` | `feature/impressum-text` | Review |

## Formatierung und Schreibweise

- Einrückung, Zeilenenden, Anführungszeichen: Prettier und `.editorconfig` (`npm run format:pruefen`).
- HTML: Attributwerte in doppelten Anführungszeichen, `lang` am `html`-Element, Prüfung mit `npm run validate:html` und `npm run validate:w3c`.
- CSS: Werte aus den Tokens in `css/src/02-tokens.css`; keine ID-Selektoren, kein `!important` (Ausnahmen: Reset und Reduced-Motion), Mobile First (`min-width`).
- Reihenfolge der CSS-Eigenschaften (Layout → Box → Typografie → Optik) wird **nicht** automatisch geprüft. Dafür gibt es Plug-ins für Stylelint, die dieses Projekt nicht einsetzt.
- Kommentare im CSS und JS erklären das **Warum**, nicht das Was.

## Ablauf einer Änderung

1. Branch anlegen, kleine Commits schreiben.
2. Vor dem Push: `npm run lint`, `npm test`, `npm run build`, `npm run validate:html`.
3. Pull Request mit Vorlage ([`docs/pull-request-vorlage.md`](docs/pull-request-vorlage.md)), Prüfung mit [`docs/review-checkliste.md`](docs/review-checkliste.md).
4. Merge nur, wenn die automatischen Prüfungen bestehen.

## Ansprechpersonen

Platzhalter: `<Name der Maintainerin>` (Technik), `<Name des Inhabers>` (Inhalte). Hier keine echten Namen oder Adressen eintragen, solange das Repository öffentlich ist.
