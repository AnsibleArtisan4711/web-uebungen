# Modul 16: Performance, Core Web Vitals und Medienoptimierung

Etappe im Portfolio: Core Web Vitals, Budget, Lighthouse, Bilder, Schriften, Ladepriorität und Auslieferung; das Portfolio wird gemessen und verbessert.

Lehrplan: 17 Stunden, Priorität 1. Pro Unterkapitel gibt es eine Übung.

Das zugehörige Kapitel des Skripts: [skript.md](skript.md) (aus LaTeX umgewandelt).

## Übungen

| Nr | Übung | Lehrplan | Zeit |
|---|---|---|---|
| 16.1 | [Core Web Vitals](16.1-core-web-vitals.md) | 16.2 | 75 Min |
| 16.2 | [Performance-Budget, Monitoring und Lighthouse](16.2-performance-budget-monitoring-lighthouse.md) | 16.3 | 90 Min |
| 16.3 | [Bildoptimierung, Bildformate und Lazy Loading](16.3-bildoptimierung-bildformate-lazy-loading.md) | 16.4 | 90 Min |
| 16.4 | [Font-Optimierung](16.4-font-optimierung.md) | 16.5 | 75 Min |
| 16.5 | [Ressourcenpriorisierung, preload und Render Blocking](16.5-ressourcenpriorisierung-preload-render-blocking.md) | 16.6 | 90 Min |
| 16.6 | [CSS- und JS-Optimierung, HTML-Minimierung und Caching](16.6-css-js-optimierung-html-minimierung-caching.md) | 16.7 | 90 Min |

Die Nummern der Übungen zählen nur die Inhalts-Unterkapitel (der Lehrplan-Abschnitt „Überblick“ hat keine Übung).

## Fertiger Stand

[`../portfolio/modul-16/`](../portfolio/modul-16/)

## Etappen-Abnahme

Das Modul ist abgeschlossen, wenn Folgendes zutrifft:

- [ ] Das Budget steht in `docs/performance-budget.md` und wird mit `npm run budget` geprüft
- [ ] Das LCP-Bild jeder Seite ist nicht `lazy` und hat `fetchpriority="high"`
- [ ] Bilder haben `width`/`height` und moderne Formate mit Fallback
- [ ] Per JavaScript eingefügte Elemente haben reservierten Platz (kein Layoutsprung)
- [ ] Der Lighthouse-Bericht ist mit Werten ausgefüllt
- [ ] Die Cache-Strategie für gehashte Dateien und HTML ist begründet

Weiter mit Modul 17: Architektur, Methodik und Designsysteme.
