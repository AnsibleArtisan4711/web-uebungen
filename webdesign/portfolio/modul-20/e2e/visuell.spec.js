// Visuelle Regressionstests: Screenshot jeder wichtigen Seite je Breite mit einer gespeicherten Baseline vergleichen.
// Erster Lauf (Baseline anlegen):   npm run e2e:baseline
// Danach jeder Lauf:                npm run e2e      -> schlägt fehl, wenn sich ein Pixel ändert
const { test, expect } = require("@playwright/test");

const seiten = [
  ["start", "/"],
  ["projekte", "/projekte/"],
  ["lebenslauf", "/lebenslauf/"],
  ["blog", "/blog/"],
  ["kontakt", "/kontakt/"],
  ["styleguide", "/styleguide/"],
];

for (const [name, pfad] of seiten) {
  test(`Aussehen: ${name}`, async ({ page }) => {
    await page.goto(pfad);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
