// Konfiguration für die Browser-Tests (Übung 20.4). Start: npm run e2e
// Die Tests laufen gegen den gebauten Stand (dist) über den mitgelieferten Testserver.
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "e2e",
  // Screenshots (Baseline) liegen neben den Tests. Sie sind vom Betriebssystem abhängig und werden nicht ins Repository gelegt.
  snapshotPathTemplate: "{testDir}/__baseline__/{projectName}/{testFilePath}/{arg}{ext}",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:8123", colorScheme: "light", reducedMotion: "reduce" },
  expect: { toHaveScreenshot: { threshold: 0, maxDiffPixelRatio: 0, animations: "disabled" } },
  webServer: {
    command: "node tools/server.js 8123 dist",
    url: "http://localhost:8123/",
    reuseExistingServer: false,
  },
  projects: [
    { name: "mobil", use: { viewport: { width: 375, height: 800 } } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
});
