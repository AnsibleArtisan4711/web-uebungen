// ESLint (Flachkonfiguration). Bewusst klein: nur Regeln, die echte Fehler und Sicherheitsrisiken finden.
const browser = ["window", "document", "location", "history", "localStorage", "console", "setTimeout", "clearTimeout", "URLSearchParams",
  "matchMedia", "requestAnimationFrame", "CSS", "Event", "HTMLElement", "fetch", "navigator", "IntersectionObserver"];
const node = ["require", "module", "exports", "process", "__dirname", "console", "Buffer", "URL", "performance", "fetch", "AbortSignal", "setTimeout", "URLSearchParams"];
const alsGlobals = (namen) => Object.fromEntries(namen.map((n) => [n, "readonly"]));

const regeln = {
  "no-undef": "error",
  "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  "prefer-const": "error",
  eqeqeq: ["error", "always"],
  "no-eval": "error",
  "no-implied-eval": "error",
  "no-new-func": "error",
};

module.exports = [
  { ignores: ["dist/**", "node_modules/**", "experimente/**"] },
  { files: ["js/**/*.js"], languageOptions: { ecmaVersion: 2022, sourceType: "script", globals: { ...alsGlobals(browser), module: "writable", PortfolioLogik: "readonly" } }, rules: regeln },
  { files: ["tools/**/*.js", "tests/**/*.js", "eslint.config.js"], languageOptions: { ecmaVersion: 2022, sourceType: "commonjs", globals: alsGlobals(node) }, rules: regeln },
];
