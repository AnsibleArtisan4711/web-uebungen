// Ablauftests: Was ein Mensch tut, wird automatisch durchgespielt (keine Pixel, sondern Verhalten).
const { test, expect } = require("@playwright/test");

test("Kontaktformular: leeres Absenden zeigt Fehler und setzt den Fokus auf die Zusammenfassung", async ({ page }) => {
  await page.goto("/kontakt/");
  await page.getByRole("button", { name: "Nachricht senden" }).click();
  await expect(page).toHaveURL(/\/kontakt\/$/); // nicht abgeschickt
  const zusammenfassung = page.locator(".fehlerliste");
  await expect(zusammenfassung).toBeVisible();
  await expect(zusammenfassung.locator("a")).not.toHaveCount(0);
  await expect(zusammenfassung).toBeFocused();
});

test("Kontaktformular: gültige Eingaben führen zur Danke-Seite", async ({ page }) => {
  await page.goto("/kontakt/");
  await page.getByLabel("Name").fill("Beispiel Person");
  await page.getByLabel("E-Mail-Adresse").fill("person@beispiel.at");
  await page.getByLabel("Betreff").selectOption({ index: 1 });
  await page.getByLabel("Nachricht").fill("Das ist eine Testnachricht mit genug Zeichen.");
  await page.getByLabel(/Ich stimme zu/).check();
  await page.getByRole("button", { name: "Nachricht senden" }).click();
  await expect(page).toHaveURL(/\/kontakt\/danke\//);
});

test("Alle Seiten laden ohne Konsolenfehler", async ({ page }) => {
  const fehler = [];
  page.on("console", (m) => m.type() === "error" && fehler.push(m.text()));
  page.on("pageerror", (e) => fehler.push(String(e)));
  for (const pfad of [
    "/",
    "/projekte/",
    "/lebenslauf/",
    "/blog/",
    "/kontakt/",
    "/styleguide/",
    "/impressum/",
    "/datenschutz/",
  ]) {
    await page.goto(pfad);
  }
  expect(fehler).toEqual([]);
});
