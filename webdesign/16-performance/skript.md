# Modul 16: Performance, Core Web Vitals und Medienoptimierung

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 17 h \| **Priorität:** 1 \| **Lerneinheiten:** 15

## Lerneinheiten laut Lehrplan

| **Lerneinheit**         | **Dauer (h)** | **Prio** |
|:------------------------|--------------:|---------:|
| Performance-Budget      |             1 |        1 |
| Bildoptimierung         |             1 |        1 |
| Font-Optimierung        |           1,5 |        1 |
| CSS und JS Optimierung  |             1 |        1 |
| Caching                 |             1 |        1 |
| Core Web Vitals         |           1,5 |        2 |
| Lighthouse              |             1 |        2 |
| Monitoring              |             1 |        2 |
| Ressourcenpriorisierung |             1 |        2 |
| preload und preconnect  |             1 |        2 |
| Lazy Loading            |           1,5 |        2 |
| Bildformate             |             1 |        2 |
| Script-Ladeverhalten    |             1 |        2 |
| Render Blocking         |           1,5 |        3 |
| HTML-Minimierung        |             1 |        3 |
| **Summe**               |        **17** |          |

## Überblick

Schnelle Seiten werden häufiger genutzt, konvertieren besser, ranken besser und verbrauchen weniger Daten und Energie. Performance ist ein *Gestaltungsmerkmal*: Sie wird durch Designentscheidungen (Bildgrößen, Schriften, Effekte, Drittanbieter) maßgeblich bestimmt.

## Core Web Vitals

Google misst Nutzererfahrung mit drei Kennzahlen, bewertet am 75. Perzentil realer Besuche (Feld-Daten, z. B. CrUX):

| **Metrik**                        | **Was wird gemessen?**                                                                                 | **„Gut“** |
|:----------------------------------|:-------------------------------------------------------------------------------------------------------|:----------|
| **LCP** Largest Contentful Paint  | Ladezeit: wann das größte sichtbare Element (Bild/Textblock) gerendert ist                             | \< 2,5 s  |
| **INP** Interaction to Next Paint | Reaktionsfähigkeit: Zeit von Klick/Tipp/Taste bis zur nächsten Darstellung (löste FID im März 2024 ab) | \< 200 ms |
| **CLS** Cumulative Layout Shift   | Visuelle Stabilität: ungewollte Layoutverschiebungen                                                   | \< 0,1    |

(Quelle: corewebvitals.io, abgerufen 23. 10. 2026; Schwellenwerte entsprechen den Angaben von web.dev.)

**Typische Ursachen und Gegenmaßnahmen:**

- **LCP schlecht:** großes Hero-Bild unkomprimiert, spät entdeckt, `loading="lazy"` fälschlich auf dem LCP-Bild, langsamer Server (TTFB), renderblockierendes CSS/JS, Webfont blockiert Text. Abhilfe: Bild optimieren, `fetchpriority="high"` setzen, nicht lazy laden, ggf. preload, Server/CDN/Caching, Critical CSS.

- **INP schlecht:** lange JavaScript-Tasks auf dem Hauptthread, schwere Event-Handler, große DOM-Bäume. Abhilfe: Code splitten, Arbeit in kleine Teile zerlegen (`scheduler.yield()`, Debounce), unnötige Skripte (Tracking) entfernen.

- **CLS schlecht:** Bilder ohne `width`/`height`, nachgeladene Werbung/Einbettungen, Webfont-Tausch, Banner, die Inhalt nach unten schieben. Abhilfe: `width`/`height` oder `aspect-ratio`, Platz reservieren, Fallback-Fonts angleichen, Banner einplanen.

## Performance-Budget, Monitoring, Lighthouse

Ein **Performance-Budget** legt Grenzen fest, z. B. „Startseite max. 1 MB über das Netz, LCP unter 2,5 s, JavaScript max. 170 KB komprimiert, max. 2 Webfont-Dateien“. Es wird im Briefing vereinbart und im Build geprüft (Lighthouse CI, bundlesize).

**Messen:** *Labordaten* (Lighthouse, WebPageTest, DevTools: reproduzierbar, gut zum Debuggen) und *Felddaten* (Chrome UX Report, Search Console „Core Web Vitals“, eigene Messung mit der `web-vitals`-Bibliothek: echte Nutzer, maßgeblich für Google). **Lighthouse** prüft Performance, Accessibility, Best Practices und SEO; Ergebnisse (Score, „Opportunities“, „Diagnostics“) in konkrete Aufgaben übersetzen. Kontinuierliches **Monitoring** (RUM, Synthetic Tests, Alarme bei Regression) sichert den Zustand nach dem Launch.

```javascript
import { onLCP, onINP, onCLS } from "web-vitals";
const senden = (m) => navigator.sendBeacon("/api/vitals", JSON.stringify(m));
onLCP(senden); onINP(senden); onCLS(senden);
```

## Bildoptimierung, Bildformate, Lazy Loading

| **Format** | **Einsatz**                                                                        |
|:-----------|:-----------------------------------------------------------------------------------|
| AVIF       | Sehr gute Kompression für Fotos (meist kleinste Dateien), breit unterstützt        |
| WebP       | Gute Kompression, sehr breite Unterstützung, ideal als Fallback zu AVIF            |
| JPEG       | Universeller Fallback für Fotos                                                    |
| PNG        | Verlustfrei, Screenshots/Grafiken mit Transparenz (WebP/AVIF oft kleiner)          |
| SVG        | Vektorgrafik: Logos, Icons, Illustrationen (skalierbar, klein, per CSS gestaltbar) |

**Maßnahmen:** richtige Pixelgröße (nicht 4000 px für 400 px Anzeige), Kompression (Qualität 70–85), moderne Formate mit Fallback (`<picture>`), `srcset`/`sizes` (Modul 7), `width`/`height`, CDN/Bildservice, Metadaten entfernen.

```html
<!-- LCP-Bild: früh, hoch priorisiert, NICHT lazy -->
<img src="hero-1200.avif" width="1200" height="600" alt="..." fetchpriority="high">

<!-- Alles unterhalb des sichtbaren Bereichs: lazy -->
<img src="galerie-1.jpg" width="600" height="400" alt="..." loading="lazy" decoding="async">
<iframe src="https://www.example.org/karte" loading="lazy" title="Anfahrtskarte" width="600" height="400"></iframe>
```

> **Merke**
>
> `loading="lazy"` gilt für Bilder und iframes *außerhalb* des ersten Viewports. Auf dem LCP-Bild verzögert es das Laden und verschlechtert den LCP.

## Font-Optimierung

- **WOFF2** verwenden (beste Kompression), selbst hosten (weniger Verbindungen, DSGVO, Modul 18).

- Nur benötigte Schnitte/Gewichte laden; *Variable Fonts* bündeln mehrere Schnitte; **Subsetting** auf benötigte Zeichen (z. B. Latin).

- `font-display: swap` (oder `optional`) setzt Text sofort mit Fallback.

- Wichtigste Schrift per `preload` vorladen, `crossorigin` nicht vergessen.

- Fallback-Schrift in den Metriken angleichen (`size-adjust`, `ascent-override`) gegen CLS.

- Zur Not: Systemschriften (`system-ui`) – null Ladekosten.

```html
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
```

## Ressourcenpriorisierung: preload, preconnect, Script-Ladeverhalten, Render Blocking

```html
<link rel="preconnect" href="https://cdn.beispiel.at" crossorigin>    <!-- Verbindung früh aufbauen -->
<link rel="dns-prefetch" href="https://stats.beispiel.at">             <!-- nur DNS -->
<link rel="preload" href="/css/kritisch.css" as="style">                <!-- sicher benötigte Ressource früh laden -->
<link rel="prefetch" href="/naechste-seite/">                           <!-- wahrscheinlich nächste Seite, niedrige Prio -->
<script src="/js/app.js" defer></script>
```

- **preload** nur für wirklich kritische, *später entdeckte* Ressourcen (Schrift, Hintergrundbild aus CSS, LCP-Bild); zu viele Preloads verdrängen sich gegenseitig.

- **preconnect** sparsam (maximal wenige kritische Fremd-Origins).

- **Render Blocking:** CSS blockiert das Rendering, synchrones JS blockiert zusätzlich den Parser. Maßnahmen: CSS klein halten, Critical CSS inline, Rest nicht-blockierend nachladen (Modul 19), Skripte mit `defer`, Drittanbieter spät laden.

- `fetchpriority="high|low"` beeinflusst die Priorität einzelner Ressourcen.

## CSS- und JS-Optimierung, HTML-Minimierung, Caching

- **Minifizierung und Kompression:** CSS/JS/HTML minifizieren, mit **Brotli** (oder gzip) komprimieren.

- **Ungenutzten Code** entfernen (Coverage-Tab in den DevTools), Tree Shaking, Code Splitting, keine Riesen-Bibliotheken für Kleinigkeiten.

- **HTML:** schlanker Quelltext, keine verschachtelten Wrapper-Orgien, kleines DOM (idealerweise unter ca. 1500 Knoten), kritische Inhalte früh.

- **Caching:** `Cache-Control: public, max-age=31536000, immutable` für Dateien mit Hash im Namen (`app.3fa9c1.js`); `no-cache` bzw. kurze Zeit mit `ETag` für HTML; CDN nutzen; HTTP/2 oder HTTP/3.

```text
# Beispiel Antwort-Header fuer versionierte Assets
Cache-Control: public, max-age=31536000, immutable
Content-Encoding: br

# HTML-Dokument
Cache-Control: no-cache          # immer revalidieren (ETag), aber Cache nutzbar
```

> **Ergänzung aus der Nachrecherche: Messung vor Optimierung**
>
> Erst messen, dann optimieren: Das Netzwerk-Wasserfalldiagramm (DevTools *Network*) zeigt Reihenfolge und Blockaden, *Performance* zeigt lange Tasks. Typisch größte Hebel: (1) Bilder, (2) Drittanbieter-Skripte, (3) Schriften, (4) JavaScript-Größe, (5) Serverantwortzeit. Drosselung auf „Slow 4G“ und CPU 4× langsamer simuliert Mittelklasse-Smartphones.

## Übungen

1.  Nenne die drei Core Web Vitals samt „guten“ Grenzwerten.

2.  Ein Hero-Bild hat `loading="lazy"`. Welches Problem entsteht und wie behebst du es?

3.  Wie verhinderst du Layoutverschiebungen durch Bilder und Schriften?

4.  Welche Cache-Strategie nutzt du für `app.3fa9c1.js` und welche für `index.html`?

5.  Wann ist `preload` sinnvoll und wann schädlich?

## Lösungen

1.  LCP \< 2,5 s, INP \< 200 ms, CLS \< 0,1 (jeweils am 75. Perzentil).

2.  Das LCP-Bild lädt verspätet, der LCP verschlechtert sich. Entfernen von `loading="lazy"` und `fetchpriority="high"` setzen.

3.  Bilder mit `width`/`height` oder `aspect-ratio`, Platz für Einbettungen reservieren; Fonts mit `font-display`, angepassten Fallback-Metriken und Preload.

4.  JS mit Hash: `max-age=31536000, immutable`. HTML: `no-cache` (Revalidierung) oder kurze Lebensdauer.

5.  Sinnvoll für kritische Ressourcen, die der Browser spät entdeckt (Schrift, LCP-Hintergrundbild). Schädlich bei vielen oder unwichtigen Preloads: Sie konkurrieren um Bandbreite und verzögern Wichtigeres.
