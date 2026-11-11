# CSS-Konventionen des Portfolios

1. **Layer-Reihenfolge:** `reset, base, components, utilities`. Spätere Layer gewinnen, unabhängig von der Spezifität.
2. **Klassen für Styling**, Typ-Selektoren nur für Basis-Styles. Keine IDs im CSS (IDs dienen Ankern und Label-Verknüpfungen).
3. **Flache Selektoren:** höchstens zwei Teile, keine tiefen Verschachtelungen.
4. **Kein `!important`.** Wird es nötig, ist die Layer-Struktur oder der Selektor zu ändern.
5. **Fokus:** `:focus-visible` mit sichtbarem Rahmen, niemals `outline: none` ohne Ersatz.
6. **`:where()`** für Basis-Styles, die leicht überschreibbar sein sollen.
7. Alle Regeln liegen in einem Layer. Ungelayerte Regeln würden alle Layer schlagen.
