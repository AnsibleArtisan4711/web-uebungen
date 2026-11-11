# Komponenten-Markup: Projektkarte (`karte`)

Beispiel für die Dokumentation einer Komponente. Jede Komponente bekommt Struktur, Varianten, Zustände und Hinweise zur Barrierefreiheit an einer Stelle. Die lebende Fassung steht im Styleguide (`styleguide/index.html`), diese Datei erklärt die Entscheidungen.

## Struktur

```html
<ul class="karten">
  <li class="karten__eintrag" data-kategorien="Webdesign">
    <article class="karte karte--projekt">
      <picture> … <img src="…" width="800" height="450" alt="…"> </picture>
      <div class="karte__text">
        <h2>Titel</h2>
        <p>Kurzbeschreibung</p>
        <p class="karte__aktion"><a class="btn btn--secondary" href="…">Aussagekräftiger Linktext</a></p>
      </div>
    </article>
  </li>
</ul>
```

Quelle: [`projekte/index.html`](../projekte/index.html). Die Datei [`css/src/05-components/karten.css`](../css/src/05-components/karten.css) enthält die Regeln.

## Varianten und Zustände

| Name | Bedeutung | Wo im CSS |
|---|---|---|
| `karte` | Grundform, ohne Besonderheiten | `karte.css` |
| `karte--projekt` | Bild und Text; im breiten Container nebeneinander (`@container karte (min-width: 30rem)`) | `karten.css` |
| `:hover` (nur Geräte mit Hover) | Karte hebt sich um 4 px an | `karten.css` |
| `:focus-within` | Karte hebt sich um 4 px an, wenn der Link darin Fokus hat (gleiche Rückmeldung wie bei Hover für Tastaturnutzer) | `karten.css` |

## Barrierefreiheit

- `article` in `li`: Jede Karte ist ein eigenständiger Inhalt; die Liste sagt Hilfstechnik, wie viele es sind.
- Überschrift pro Karte (`h2`), damit man per Überschriftennavigation springen kann.
- Bild mit `alt`, `width` und `height` (verhindert Layoutverschiebungen).
- Linktext benennt das Ziel („Beispielprojekt A auf GitHub ansehen“) statt „Mehr“.
- Tastaturfokus: `:focus-within` gibt dieselbe Rückmeldung wie Hover. Der Fokusring des Links selbst wird nicht überschrieben; das ist per Sichtprüfung und axe zu belegen (hier nicht Teil dieser Datei).

## Regeln für Änderungen

- Neue Variante: Modifier `karte--name`, im Styleguide ergänzen, Review-Checkliste anwenden.
- Keine Elemente verschachteln (`karte__text__titel` ist falsch, `karte__titel` richtig).
- Eigene Komponenten mit Bedienlogik (z. B. das Menü mit `aria-expanded`, siehe `js/main.js`) kapseln die Barrierefreiheit einmal und werden überall gleich verwendet.
