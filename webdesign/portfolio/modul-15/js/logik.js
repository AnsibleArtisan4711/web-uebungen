/* Reine Logik ohne DOM-Zugriff: lässt sich im Browser und mit Node testen (siehe tests/). */
(function (root) {
  "use strict";

  // Kleinschreibung, ohne Akzente und Umlaut-Zeichen (ä -> a), damit "Gerat" auch "Gerät" findet.
  function normalisiere(text) {
    return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim();
  }

  // Leere Suche passt immer. Sonst muss der Suchtext im Text vorkommen.
  function passtZuSuche(text, suche) {
    const s = normalisiere(suche);
    return s === "" || normalisiere(text).includes(s);
  }

  // "alle" passt immer. Sonst muss die gewählte Kategorie in der Liste stehen.
  function passtZuKategorie(kategorien, gewaehlt) {
    return gewaehlt === "alle" || kategorien.includes(gewaehlt);
  }

  // Kategorien aus einem Attributwert wie "Webdesign, Netzwerktechnik" lesen.
  function leseKategorien(wert) {
    return String(wert || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }

  function statusText(sichtbar, gesamt, einheit) {
    return sichtbar + " von " + gesamt + " " + einheit + " angezeigt";
  }

  const api = { normalisiere, passtZuSuche, passtZuKategorie, leseKategorien, statusText };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;          // Node (Tests)
  } else {
    root.PortfolioLogik = api;     // Browser
  }
})(typeof window !== "undefined" ? window : globalThis);
