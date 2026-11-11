// Prüft das PHP-Beispiel beispiele/kontakt-php/kontakt.php mit dem eingebauten PHP-Server (php -S).
// Läuft nur, wenn PHP 8.1 oder neuer installiert ist; sonst werden die Tests übersprungen.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const ordner = path.join(__dirname, "..", "beispiele", "kontakt-php");
const version = spawnSync("php", ["-r", "echo PHP_VERSION_ID;"], { encoding: "utf8" });
const phpDa = version.status === 0 && Number(version.stdout) >= 80100;
const port = 8161;

const gueltig = { name: "Erika Muster", mail: "erika@example.org", betreff: "frage", rolle: "sonstige", nachricht: "Das ist eine ausreichend lange Nachricht.", datenschutz: "ja", website: "" };
const senden = (daten) => fetch(`http://127.0.0.1:${port}/kontakt.php`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(daten) });

test("kontakt.php", { skip: phpDa ? false : "PHP 8.1 oder neuer nicht gefunden" }, async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kontakt-"));
  const postfach = path.join(tmp, "post.txt");
  const konfig = path.join(tmp, "config.php");
  fs.writeFileSync(konfig, `<?php return ['empfaenger'=>'ziel@example.com','absender'=>'form@example.com','danke_url'=>'/kontakt/danke/','max_pro_stunde'=>3,'zustand_datei'=>${JSON.stringify(path.join(tmp, "zustand.json"))},'testmodus'=>true,'testdatei'=>${JSON.stringify(postfach)}];`);
  const server = spawn("php", ["-S", `127.0.0.1:${port}`, "-t", ordner], { env: { ...process.env, KONTAKT_KONFIG: konfig }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 800));
  const mails = () => (fs.existsSync(postfach) ? fs.readFileSync(postfach, "utf8").split("----\n").length - 1 : 0);
  try {
    await t.test("GET ist nicht erlaubt (405 mit Allow: POST)", async () => {
      const r = await fetch(`http://127.0.0.1:${port}/kontakt.php`);
      assert.strictEqual(r.status, 405);
      assert.strictEqual(r.headers.get("allow"), "POST");
    });
    await t.test("falsche Eingaben: 400 und keine Mail, auch bei eingeschleusten Zeilenumbrüchen", async () => {
      for (const aenderung of [{ mail: "" }, { datenschutz: "" }, { betreff: "hacken" }, { nachricht: "kurz" }, { name: "Max\r\nBcc: boese@example.net" }, { mail: "a@example.org\r\nBcc: boese@example.net" }]) {
        const r = await senden({ ...gueltig, ...aenderung });
        assert.strictEqual(r.status, 400, JSON.stringify(aenderung));
      }
      assert.strictEqual(mails(), 0);
    });
    await t.test("Honigtopf: Antwort wie bei Erfolg, aber keine Mail", async () => {
      const r = await senden({ ...gueltig, website: "http://spam.example" });
      assert.strictEqual(r.status, 303);
      assert.strictEqual(mails(), 0);
    });
    await t.test("gültige Eingabe: 303 auf die Danke-Seite, genau eine Mail mit den Angaben, Sicherheits-Header", async () => {
      const r = await senden(gueltig);
      assert.strictEqual(r.status, 303);
      assert.strictEqual(r.headers.get("location"), "/kontakt/danke/");
      assert.strictEqual(mails(), 1);
      const text = fs.readFileSync(postfach, "utf8");
      assert.match(text, /An: ziel@example.com/);
      assert.match(text, /Reply-To: erika@example.org/);
      assert.match(text, /Betreff: Kontaktformular: Allgemeine Frage/);
      assert.match(text, /ausreichend lange Nachricht/);
      const fehler = await senden({ ...gueltig, mail: "" });
      assert.strictEqual(fehler.headers.get("x-content-type-options"), "nosniff");
      assert.match(fehler.headers.get("content-security-policy"), /frame-ancestors 'none'/);
    });
    await t.test("Grenzwert: nach 3 Nachrichten in der Stunde antwortet der Server mit 429", async () => {
      assert.strictEqual((await senden(gueltig)).status, 303);
      assert.strictEqual((await senden(gueltig)).status, 303);
      const r = await senden(gueltig);
      assert.strictEqual(r.status, 429);
      assert.strictEqual(r.headers.get("retry-after"), "3600");
      assert.strictEqual(mails(), 3);
    });
  } finally {
    server.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
