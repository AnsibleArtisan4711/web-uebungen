# Modul 15: Animationen, Transitions und Interaktionsstates

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 9 h \| **Priorität:** 2 \| **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Lerneinheit**        | **Dauer (h)** | **Prio** |
|:-----------------------|--------------:|---------:|
| Transitions            |             1 |        2 |
| Keyframe Animation     |             1 |        2 |
| Transform              |           1,5 |        2 |
| Timing Functions       |             1 |        2 |
| Hover und Focus States |             1 |        2 |
| Reduced Motion         |           1,5 |        3 |
| Animation Performance  |             1 |        3 |
| Interaction QA         |             1 |        3 |
| **Summe**              |         **9** |          |

## Überblick

Bewegung erklärt Zustandswechsel, lenkt Aufmerksamkeit und gibt Feedback. Sie kann aber ablenken, Übelkeit auslösen und Performance kosten. Ziel: wenige, zweckgebundene, schnelle und abschaltbare Animationen.

## Transitions und Interaktionsstates

Transitions überblenden den Wechsel *zwischen zwei Zuständen* (Hover, Fokus, Klasse).

```css
.button {
  background: #1a3c6e;
  transition: background-color .2s ease, transform .2s ease;   /* Property Dauer Timing [Verzoegerung] */
}
.button:hover, .button:focus-visible { background: #24539a; transform: translateY(-2px); }
.button:active { transform: translateY(0); }
```

Eigenschaften: `transition-property`, `-duration`, `-timing-function`, `-delay`. Nicht `transition: all` (unvorhersehbar, teuer), sondern Eigenschaften benennen. **Hover und Focus States** gemeinsam gestalten: Wer per Tastatur navigiert, braucht dasselbe Feedback wie bei der Maus; Hover darf keine einzige Funktionsquelle sein (Touch hat kein Hover: `@media (hover: hover)`).

## Transform und Timing Functions

```css
.karte:hover { transform: translate(0, -4px) scale(1.02) rotate(1deg); }
.drehen { transform-origin: center; }
```

`transform` (`translate`, `scale`, `rotate`, `skew`) verändert die Darstellung, *nicht das Layout*: Nachbarn verschieben sich nicht, und die Änderung läuft meist auf der GPU. Einzeleigenschaften `translate`, `scale`, `rotate` existieren ebenfalls separat.

**Timing Functions:** `linear`, `ease` (Standard), `ease-in` (langsam starten, für Ausblenden), `ease-out` (langsam enden, für Einblenden), `ease-in-out`, `cubic-bezier(x1, y1, x2, y2)` und `steps(n)` (sprunghaft, z. B. Sprites). Neuere Form: `linear(0, 0.25, 1, ...)` für federnde Kurven. **Richtwerte:** Mikro-Interaktionen 100–200 ms, Übergänge 200–400 ms, nichts über ca. 500 ms ohne Grund.

## Keyframe-Animationen

```css
@keyframes einblenden {
  from { opacity: 0; transform: translateY(1rem); }
  to   { opacity: 1; transform: translateY(0); }
}
.karte { animation: einblenden .4s ease-out both; }   /* Name Dauer Timing Fill-Mode */

@keyframes puls { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
.badge { animation: puls 2s ease-in-out 3; }          /* 3 Wiederholungen statt infinite */
```

Eigenschaften: `animation-name`, `-duration`, `-timing-function`, `-delay`, `-iteration-count` (`infinite`), `-direction`, `-fill-mode` (`both`), `-play-state`. **Transition vs. Animation:** Transition = Zustand A → B (ausgelöst), Animation = mehrstufig/automatisch/wiederholbar.

> **Ergänzung aus der Nachrecherche: Moderne Features: @starting-style, View Transitions, Scroll-driven Animations**
>
> `@starting-style` definiert den Ausgangszustand für Übergänge beim Einfügen eines Elements bzw. bei `display: none` → `block` (Popover, Dialog); laut Baseline-Stand (flaviocopes.com, 9/2026) *newly available*, in Firefox ist das Animieren von `display` noch eingeschränkt. *Scroll-driven Animations* (`animation-timeline: scroll()/view()`) sind *nicht* Baseline (Chrome und Safari ja, Firefox nur hinter Flag): ausschließlich als Verbesserung ohne Funktionsverlust einsetzen. Die View-Transitions-API ermöglicht animierte Seitenwechsel; Unterstützung vor Einsatz auf caniuse/MDN prüfen.

## Reduced Motion (Barrierefreiheit)

Menschen mit Vestibularstörungen, Migräne oder ADHS können durch Bewegung beeinträchtigt werden. Betriebssysteme bieten „Bewegung reduzieren“; CSS reagiert darauf:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
/* Alternativ: Bewegung nur auf Wunsch */
@media (prefers-reduced-motion: no-preference) { .hero { animation: einblenden .6s both; } }
```

WCAG: 2.2.2 (Pause, Stopp, Ausblenden für bewegte Inhalte über 5 s), 2.3.1 (nicht öfter als dreimal pro Sekunde blitzen), 2.3.3 (Animation aus Interaktion abschaltbar, AAA). Karussells und Autoplay mit Pause-Schaltfläche versehen. Wesentliche Information niemals nur über Animation vermitteln.

## Animation Performance und Interaction QA

- **Nur `transform` und `opacity` animieren:** laufen im Compositor, ohne Layout und Paint. `width`, `height`, `top`, `left`, `margin` lösen Reflow aus (ruckelt).

- `will-change: transform` nur gezielt und kurz vor der Animation setzen (belegt Speicher, erzeugt Stacking Context).

- 60 fps = 16,7 ms pro Frame. Messen mit DevTools *Performance* (Frames, Layout-Shifts) und Rendering-Overlay „Paint flashing“.

- Animation darf Core Web Vitals nicht verschlechtern: keine Layoutverschiebungen (CLS), keine blockierende Hauptthread-Arbeit (INP).

**Interaction QA (Checkliste):** Jede Animation hat Zweck? Dauer angemessen? `prefers-reduced-motion` getestet? Tastatur- und Touch-Zustände vorhanden? Kein Inhalt unerreichbar während der Animation? Auf schwachen Geräten (CPU-Drosselung 4× in DevTools) flüssig? Kein Layoutsprung?

## Übungen

1.  Schreibe einen Button mit sanftem Hover-/Fokus-Übergang (0,2 s) für Hintergrund und Verschiebung.

2.  Erstelle eine `@keyframes`-Animation, die ein Element einblendet und von unten hereinschiebt.

3.  Warum sollte man `left`/`top` nicht animieren? Was nimmt man stattdessen?

4.  Wie berücksichtigst du Nutzer mit „Bewegung reduzieren“?

5.  Was bedeutet `will-change` und wann ist es sinnvoll?

## Lösungen

1.  Siehe Abschnitt „Transitions“ (`transition: background-color .2s, transform .2s` mit `:hover` und `:focus-visible`).

2.  Siehe Beispiel „einblenden“ (`opacity` und `translateY`).

3.  `left`/`top` lösen Layout-Berechnung aus (Reflow, ruckelt). Stattdessen `transform: translate(...)`.

4.  Mit `@media (prefers-reduced-motion: reduce)` Animationen und Übergänge deaktivieren oder stark vereinfachen; Autoplay vermeiden.

5.  Es kündigt dem Browser an, welche Eigenschaft sich ändern wird (Ebene vorbereiten). Nur sparsam und kurzzeitig verwenden, da es Speicher kostet.
