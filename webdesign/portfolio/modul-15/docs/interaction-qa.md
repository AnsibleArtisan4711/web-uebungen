# Interaction-QA (Modul 15)

Gehe jede Animation und jeden Interaktionszustand durch.

| Prüfpunkt | Ja/Nein | Notiz |
|---|---|---|
| Jede Animation hat einen Zweck (Feedback, Orientierung), nichts ist nur Dekoration | | |
| Dauer: Mikro-Interaktion 100 bis 200 ms, Übergang 200 bis 400 ms | | |
| Es wird nur `transform` und `opacity` animiert | | |
| Kein `transition: all` | | |
| Hover, Tastaturfokus und Touch haben gleichwertiges Feedback (`@media (hover: hover)`) | | |
| `prefers-reduced-motion: reduce` getestet (DevTools: Rendering, Emulation) | | |
| Bewegung über 5 s oder Endlosbewegung hat eine Pause-Schaltfläche | | |
| Kein Inhalt ist während oder nach der Animation unerreichbar | | |
| Kein Layoutsprung (CLS) durch Animationen | | |
| Bei 4-fach gedrosselter CPU (DevTools Performance) noch flüssig | | |
| Automatische Tests (axe) laufen nach Ende der Animationen | | |

Nicht von mir geprüft: Flüssigkeit auf echten, schwachen Geräten und das echte Betriebssystem-Setting „Bewegung reduzieren“.
