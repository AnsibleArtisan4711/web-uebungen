<?php
// Kontaktformular-Handler (Beispiel zu Übung 21.7, siehe README.md in diesem Ordner).
// Aufgabe: Eingaben prüfen und als E-Mail an eine feste Adresse senden. Es wird NICHTS gespeichert und NICHTS protokolliert.
// Gedacht für ein Webhosting mit PHP und Mailversand. Auf einem echten Hoster ist dieses Skript NICHT getestet.
declare(strict_types=1);

$konfigDatei = getenv('KONTAKT_KONFIG') ?: __DIR__ . '/config.php';
if (!is_file($konfigDatei)) {
    antwort(500, 'Konfiguration fehlt. Kopiere config.beispiel.php nach config.php.');
}
$k = require $konfigDatei;

// --- Antwort-Helfer ---------------------------------------------------------------------------
function antwort(int $status, string $text, array $kopf = []): never
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    foreach ($kopf as $name => $wert) {
        header("$name: $wert");
    }
    $sicher = htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo "<!DOCTYPE html><html lang=\"de\"><meta charset=\"utf-8\"><title>Kontakt</title><p>$sicher</p>";
    exit;
}

function weiter(string $ziel): never
{
    // 303: Der Browser lädt das Ziel per GET. Ein Neuladen der Seite sendet das Formular nicht erneut.
    http_response_code(303);
    header("Location: $ziel");
    header('Cache-Control: no-store');
    exit;
}

// --- Grenzwert: höchstens N Nachrichten je Stunde insgesamt (ohne IP-Adressen, also ohne personenbezogene Daten) ---
function zuVieleNachrichten(string $datei, int $max): bool
{
    $f = fopen($datei, 'c+');
    if ($f === false) {
        return false; // Ohne Zustandsdatei lieber senden als alles blockieren
    }
    flock($f, LOCK_EX);
    $inhalt = json_decode((string) stream_get_contents($f), true);
    $stunde = intdiv(time(), 3600);
    if (!is_array($inhalt) || ($inhalt['stunde'] ?? null) !== $stunde) {
        $inhalt = ['stunde' => $stunde, 'anzahl' => 0];
    }
    $zuViele = $inhalt['anzahl'] >= $max;
    if (!$zuViele) {
        $inhalt['anzahl']++;
    }
    ftruncate($f, 0);
    rewind($f);
    fwrite($f, json_encode($inhalt));
    flock($f, LOCK_UN);
    fclose($f);
    return $zuViele;
}

// --- Versand ------------------------------------------------------------------------------------
function senden(array $k, string $betreff, string $text, string $antwortAn): bool
{
    if (!empty($k['testmodus'])) {
        // Nur für lokale Tests: schreibt die Nachricht in eine Datei statt sie zu versenden. Im Betrieb auf false lassen.
        return file_put_contents($k['testdatei'], "An: {$k['empfaenger']}\nReply-To: $antwortAn\nBetreff: $betreff\n\n$text\n----\n", FILE_APPEND) !== false;
    }
    $kopf = [
        'From' => $k['absender'],            // Adresse der eigenen Domain, sonst lehnen Mailserver die Mail oft ab
        'Reply-To' => $antwortAn,            // bereits geprüft, enthält garantiert keine Zeilenumbrüche
        'Content-Type' => 'text/plain; charset=UTF-8',
        'MIME-Version' => '1.0',
    ];
    return mail($k['empfaenger'], mb_encode_mimeheader($betreff, 'UTF-8'), $text, $kopf);
}

// --- Ablauf -------------------------------------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    antwort(405, 'Nur POST ist erlaubt.', ['Allow' => 'POST']);
}

// Falle für Roboter: Menschen sehen das Feld nicht und lassen es leer. Roboter bekommen dieselbe Antwort wie alle anderen.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    weiter($k['danke_url']);
}

$name = trim((string) ($_POST['name'] ?? ''));
$mail = trim((string) ($_POST['mail'] ?? ''));
$betreffSchluessel = (string) ($_POST['betreff'] ?? '');
$rolle = (string) ($_POST['rolle'] ?? 'sonstige');
$nachricht = trim(str_replace("\r\n", "\n", (string) ($_POST['nachricht'] ?? '')));

$betreffe = ['frage' => 'Allgemeine Frage', 'projekt' => 'Projektanfrage', 'sonstiges' => 'Sonstiges'];
$rollen = ['recruiter', 'ausbildung', 'sonstige'];

$fehler = [];
if (preg_match('/^[\p{L}\p{M}\' .-]{1,80}$/u', $name) !== 1) {
    $fehler[] = 'name';
}
// FILTER_VALIDATE_EMAIL lässt keine Zeilenumbrüche zu; das verhindert das Einschleusen zusätzlicher Mail-Kopfzeilen.
if (strlen($mail) > 254 || filter_var($mail, FILTER_VALIDATE_EMAIL) === false) {
    $fehler[] = 'mail';
}
if (!isset($betreffe[$betreffSchluessel])) {
    $fehler[] = 'betreff';
}
if (!in_array($rolle, $rollen, true)) {
    $fehler[] = 'rolle';
}
$laenge = mb_strlen($nachricht, 'UTF-8');
if ($laenge < 10 || $laenge > 1000) {
    $fehler[] = 'nachricht';
}
if (($_POST['datenschutz'] ?? '') !== 'ja') {
    $fehler[] = 'datenschutz';
}
if ($fehler) {
    antwort(400, 'Bitte prüfe diese Angaben: ' . implode(', ', $fehler));
}

if (zuVieleNachrichten($k['zustand_datei'], (int) $k['max_pro_stunde'])) {
    antwort(429, 'Gerade sind zu viele Nachrichten eingegangen. Bitte versuche es später noch einmal.', ['Retry-After' => '3600']);
}

$text = "Name: $name\nE-Mail: $mail\nRolle: $rolle\n\n$nachricht\n";
if (!senden($k, 'Kontaktformular: ' . $betreffe[$betreffSchluessel], $text, $mail)) {
    antwort(500, 'Die Nachricht konnte nicht gesendet werden. Bitte versuche es später noch einmal.');
}
weiter($k['danke_url']);
