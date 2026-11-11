/* Verbesserungen per JavaScript (Progressive Enhancement):
   Ohne dieses Skript funktioniert jede Seite weiterhin (Navigation sichtbar, alle Projekte und Beiträge sichtbar,
   Formular mit Browser-Validierung). Das Skript ergänzt nur. */
(function () {
  "use strict";

  const L = window.PortfolioLogik;

  /* ---------- Menü-Knopf (nur schmale Bildschirme) ---------- */
  function initMenue() {
    const nav = document.querySelector(".site-header .nav");
    if (!nav) return;
    const liste = nav.querySelector("ul");
    liste.id = liste.id || "hauptmenue";

    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "menue-knopf";
    knopf.textContent = "Menü";
    knopf.setAttribute("aria-expanded", "false");
    knopf.setAttribute("aria-controls", liste.id);
    nav.before(knopf);

    function setze(offen) {
      knopf.setAttribute("aria-expanded", String(offen));
      nav.classList.toggle("nav--offen", offen);
    }

    knopf.addEventListener("click", () => {
      setze(knopf.getAttribute("aria-expanded") !== "true");
    });

    // Escape schließt das Menü und gibt den Fokus an den Knopf zurück
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && knopf.getAttribute("aria-expanded") === "true") {
        setze(false);
        knopf.focus();
      }
    });
  }

  /* ---------- Projekte nach Thema filtern ---------- */
  function initProjektFilter() {
    const liste = document.querySelector("ul.karten");
    if (!liste) return;
    const eintraege = Array.from(liste.children);
    const kategorien = new Set();
    eintraege.forEach((li) => L.leseKategorien(li.dataset.kategorien).forEach((k) => kategorien.add(k)));
    if (kategorien.size === 0) return;

    const gruppe = document.createElement("div");
    gruppe.className = "filter";
    gruppe.setAttribute("role", "group");
    gruppe.setAttribute("aria-label", "Projekte nach Thema filtern");

    const status = document.createElement("p");
    status.className = "filter__status text-klein";
    status.setAttribute("role", "status");

    function waehle(gewaehlt) {
      let sichtbar = 0;
      eintraege.forEach((li) => {
        const passt = L.passtZuKategorie(L.leseKategorien(li.dataset.kategorien), gewaehlt);
        li.hidden = !passt;
        if (passt) sichtbar += 1;
      });
      gruppe.querySelectorAll("button").forEach((b) => {
        b.setAttribute("aria-pressed", String(b.dataset.kategorie === gewaehlt));
      });
      status.textContent = L.statusText(sichtbar, eintraege.length, "Projekten");
    }

    ["alle", ...kategorien].forEach((k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.dataset.kategorie = k;
      b.textContent = k === "alle" ? "Alle" : k;
      b.setAttribute("aria-pressed", "false");
      gruppe.append(b);
    });

    // Event-Delegation: ein Listener für alle Knöpfe
    gruppe.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) waehle(b.dataset.kategorie);
    });

    const slot = document.querySelector("[data-slot=filter]");
    if (slot) slot.append(gruppe, status);
    else liste.before(gruppe, status);
    waehle("alle");
  }

  /* ---------- Blog durchsuchen ---------- */
  function initBlogSuche() {
    const bereich = document.querySelector(".blog-layout__liste");
    if (!bereich) return;
    const beitraege = Array.from(bereich.querySelectorAll("article"));

    const form = document.createElement("form");
    form.className = "suche";
    form.setAttribute("role", "search");
    const label = document.createElement("label");
    label.htmlFor = "blog-suche";
    label.textContent = "Beiträge durchsuchen";
    const eingabe = document.createElement("input");
    eingabe.type = "search";
    eingabe.id = "blog-suche";
    eingabe.name = "suche";
    eingabe.autocomplete = "off";
    form.append(label, eingabe);

    const status = document.createElement("p");
    status.className = "text-klein";
    status.setAttribute("role", "status");

    form.addEventListener("submit", (e) => e.preventDefault()); // kein Seitenwechsel
    eingabe.addEventListener("input", () => {
      let treffer = 0;
      beitraege.forEach((a) => {
        const passt = L.passtZuSuche(a.textContent, eingabe.value);
        a.hidden = !passt;
        if (passt) treffer += 1;
      });
      status.textContent =
        treffer === 0 ? "Keine Beiträge gefunden." : L.statusText(treffer, beitraege.length, "Beiträgen");
    });

    const slot = bereich.querySelector("[data-slot=suche]");
    if (slot) slot.append(form, status);
    else bereich.prepend(form, status);
  }

  /* ---------- Kontaktformular: verständliche Fehler mit Zusammenfassung ---------- */
  const MELDUNGEN = {
    name: "Bitte gib deinen Namen ein.",
    mail: "Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.at.",
    betreff: "Bitte wähle einen Betreff aus.",
    nachricht: "Bitte schreibe eine Nachricht mit mindestens 10 Zeichen.",
    datenschutz: "Bitte bestätige die Hinweise zum Datenschutz.",
  };

  function initKontaktFormular() {
    const form = document.querySelector("form.formular");
    if (!form) return;
    form.noValidate = true; // Wir zeigen die Meldungen selbst an. Die Regeln (required, type, minlength) bleiben im HTML.

    const zusammenfassung = document.createElement("div");
    zusammenfassung.className = "fehlerliste";
    zusammenfassung.tabIndex = -1;
    zusammenfassung.setAttribute("role", "alert");
    zusammenfassung.hidden = true;
    form.prepend(zusammenfassung);

    function meldungFuer(feld) {
      return MELDUNGEN[feld.name] || feld.validationMessage;
    }

    function zeigeFehler(feld) {
      let p = document.getElementById(feld.id + "-fehler");
      if (!p) {
        p = document.createElement("p");
        p.id = feld.id + "-fehler";
        p.className = "fehlermeldung";
        feld.closest(".feld, .auswahl, div, p, fieldset").append(p);
        const alt = feld.getAttribute("aria-describedby");
        feld.setAttribute("aria-describedby", (alt ? alt + " " : "") + p.id);
      }
      p.textContent = meldungFuer(feld);
      feld.setAttribute("aria-invalid", "true");
    }

    function entferneFehler(feld) {
      const p = document.getElementById(feld.id + "-fehler");
      if (p) p.remove();
      feld.removeAttribute("aria-invalid");
      const alt = (feld.getAttribute("aria-describedby") || "").split(" ").filter((id) => id !== feld.id + "-fehler");
      if (alt.length) feld.setAttribute("aria-describedby", alt.join(" "));
      else feld.removeAttribute("aria-describedby");
    }

    form.addEventListener("submit", (e) => {
      const ungueltig = Array.from(form.elements).filter((f) => f.willValidate && !f.checkValidity());
      Array.from(form.elements).forEach((f) => {
        if (f.id && f.checkValidity()) entferneFehler(f);
      });
      if (ungueltig.length === 0) {
        zusammenfassung.hidden = true;
        return;
      }

      e.preventDefault();
      ungueltig.forEach(zeigeFehler);
      zusammenfassung.replaceChildren();
      const titel = document.createElement("p");
      titel.textContent =
        ungueltig.length === 1 ? "Bitte korrigiere 1 Eingabe:" : "Bitte korrigiere " + ungueltig.length + " Eingaben:";
      const ul = document.createElement("ul");
      ungueltig.forEach((f) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#" + f.id;
        a.textContent = meldungFuer(f);
        a.addEventListener("click", (ev) => {
          ev.preventDefault();
          f.focus();
        });
        li.append(a);
        ul.append(li);
      });
      zusammenfassung.append(titel, ul);
      zusammenfassung.hidden = false;
      zusammenfassung.focus();
    });

    // Fehler verschwindet, sobald die Eingabe wieder gültig ist
    form.addEventListener("input", (e) => {
      const f = e.target;
      if (f.id && f.checkValidity()) entferneFehler(f);
    });
  }

  initMenue();
  initProjektFilter();
  initBlogSuche();
  initKontaktFormular();
})();
