# Modul 06 - TLS, HTTP-2 und sichere Transportkonfiguration

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (6.1 bis 6.10), danach folgen „Übungsaufgaben“ (10) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 11 h | **Priorität:** 1 | **Lerneinheiten:** 10

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**     | **Dauer (h)** | **Prio** |
|--------:|:--------------------|--------------:|---------:|
|     6.1 | mod_ssl Grundlagen  |             1 |        1 |
|     6.2 | Zertifikate         |             1 |        1 |
|     6.3 | TLS-Protokolle      |           1,5 |        1 |
|     6.4 | Cipher Suites       |             1 |        1 |
|     6.5 | OCSP Stapling       |             1 |        1 |
|     6.6 | HSTS                |           1,5 |        2 |
|     6.7 | HTTP/2              |             1 |        2 |
|     6.8 | TLS Troubleshooting |             1 |        2 |
|     6.9 | ssl_protocols       |             1 |        1 |
|    6.10 | HTTP/3 und QUIC     |             1 |        2 |
|         | **Summe**           |        **11** |          |

## Überblick und Lernweg

Dieses Modul behandelt den Transport: wie eine Verbindung zwischen Browser und Server verschlüsselt, der Server als echt erkannt und die Übertragung dabei schnell gehalten wird. Das Verfahren heißt *TLS* (*Transport Layer Security*), seine Verwendung für Webseiten *HTTPS*. Der ältere Name *SSL* lebt in den Direktiven fort (`mod_ssl`, `ssl_certificate`), obwohl SSL selbst seit Jahren nicht mehr verwendet werden darf. Wer HTTPS betreibt, muss vier Dinge im Griff haben: das *Zertifikat* samt privatem Schlüssel und Kette, die erlaubten *Protokollversionen*, die erlaubten *Verschlüsselungsverfahren* (Cipher Suites) und das Verhalten *drumherum*: Weiterleitung von HTTP, HSTS, Zertifikatsstatus (OCSP) und die schnelleren Protokolle HTTP/2 und HTTP/3.

Die Einheiten 6.1 bis 6.5 legen das Fundament mit Schwerpunkt Apache (`mod_ssl`) und stellen die Nginx-Entsprechungen daneben, 6.6 bis 6.8 behandeln HSTS, HTTP/2 und die Fehlersuche für beide Server, 6.9 vertieft `ssl_protocols` bei Nginx (die Protokollversionen als Konzept stehen in 6.3), und 6.10 ordnet HTTP/3 und QUIC ein. Die automatische Ausstellung von Zertifikaten (ACME, Let’s Encrypt) und das Erneuern gehören zur Automatisierung (Modul 12); hier geht es um den Betrieb.

> **Merke**
>
> Alle Beispiele wurden mit Apache 2.4.58, Nginx 1.24.0 und OpenSSL 3.0.13 ausgeführt. Zertifikate in den Tests stammen von einer selbst erzeugten Test-CA und sind für den Internetbetrieb wertlos. Nginx 1.24.0 kennt weder die Direktive `http2 on` noch QUIC; zu beidem siehe die Hinweise in 6.7 und 6.10.

## 6.1 mod_ssl Grundlagen

Das Modul `mod_ssl` gibt dem Apache HTTP Server die Fähigkeit, TLS zu sprechen, und stützt sich auf die Bibliothek OpenSSL. Es ist ein ladbares Modul (Einheit 4.1), und ohne es versteht der Server die `SSL`-Direktiven nicht. Auf Debian aktiviert man es mit `a2enmod ssl`, auf RHEL-artigen Systemen mit dem Paket `mod_ssl`. Für HTTPS braucht ein Virtual Host mindestens drei Dinge: `SSLEngine on`, ein Zertifikat (`SSLCertificateFile`) und den privaten Schlüssel dazu (`SSLCertificateKeyFile`). Der Port 443 ist die Voreinstellung für HTTPS, der Server muss aber ausdrücklich darauf lauschen (`Listen 443`).

Wie funktioniert der Verbindungsaufbau? Bevor eine einzige HTTP-Zeile fließt, führen Browser und Server einen *Handshake* durch. Der Browser nennt die unterstützten Protokollversionen und Verfahren sowie den gewünschten Hostnamen (die Erweiterung *SNI*, *Server Name Indication*). Der Server wählt Version und Verfahren, schickt sein Zertifikat samt Kette, und beide einigen sich auf einen gemeinsamen Sitzungsschlüssel. Erst dann wird verschlüsselt HTTP gesprochen. SNI ist der Grund, warum mehrere HTTPS-Websites sich eine IP-Adresse teilen können: Der Server liest den Namen aus dem Handshake und wählt das passende Zertifikat, noch bevor der `Host`-Header sichtbar ist (Einheit 3.4).

Das folgende Beispiel zeigt eine vollständige, geprüfte Mindestkonfiguration. Der Test lieferte mit `curl --cacert ca.crt` den Text `AP-TLS` und mit `--http2` eine Antwort über HTTP/2:

```apache
LoadModule ssl_module            modules/mod_ssl.so
LoadModule socache_shmcb_module  modules/mod_socache_shmcb.so
Listen 443

SSLSessionCache "shmcb:/var/run/apache2/ssl_scache(512000)"

<VirtualHost *:443>
    ServerName test.example
    DocumentRoot "/var/www/test"
    SSLEngine on
    SSLCertificateFile    "/etc/ssl/certs/test.example.crt"
    SSLCertificateKeyFile "/etc/ssl/private/test.example.key"
</VirtualHost>
```

Die ersten beiden Zeilen laden `mod_ssl` und das Modul für den gemeinsamen Speicher der Sitzungen. `SSLSessionCache` legt einen Zwischenspeicher an, in dem Arbeitsprozesse die Sitzungsdaten teilen; Kunden, die wiederkommen, können den Handshake abkürzen (Wiederaufnahme). In der Testumgebung zeigte `openssl s_client` mit `-sess_out` und `-sess_in` bei Nginx `Reused, TLSv1.2`: die Sitzung wurde wiederverwendet. Die `VirtualHost`-Adresse `*:443` gilt für alle Adressen; da HTTPS auf Port 443 und HTTP auf Port 80 getrennte Sockets sind, braucht man für jede Website zwei Blöcke, einen für HTTP (meist nur eine Weiterleitung) und einen für HTTPS.

Nginx nennt den entsprechenden Teil nicht Modul, sondern Parameter und Direktiven. Die Bedeutung ist dieselbe: `listen 443 ssl;` öffnet einen TLS-Port, `ssl_certificate` und `ssl_certificate_key` nennen die Dateien, und `ssl_session_cache` entspricht `SSLSessionCache`. Das geprüfte Gegenstück:

```nginx
server {
    listen 443 ssl;
    server_name test.example;
    root /var/www/test;

    ssl_certificate     /etc/ssl/certs/test.example.crt;
    ssl_certificate_key /etc/ssl/private/test.example.key;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
}
```

Der Cache `shared:SSL:10m` ist 10 Megabyte groß, der Name `SSL` frei wählbar; nach der Dokumentation von Nginx passen in 1 MB rund 4000 Sitzungen (Wert nicht neu geprüft). Der Fehlerfall `listen ... ssl` ohne Zertifikat liefert bei Nginx sofort beim Test `no "ssl_certificate" is defined for the "listen ... ssl" directive`. Bei Apache dagegen meldet `apachectl configtest` in derselben Lage „Syntax OK“, und erst der *Start* bricht ab: `AH02572: Failed to configure at least one certificate and key for test.example:443` und `AH02312: Fatal error initialising mod_ssl, exiting.` Wer bei Apache nur den Test nutzt, übersieht also Fehler in der TLS-Konfiguration; ein Probestart auf einer Ersatzinstanz mit einem anderen Port gehört deshalb in die Routine.

### Typische Fehler.

Der häufigste Anfängerfehler ist `SSLEngine on` ohne `Listen 443`: Der Server startet, aber der Port bleibt zu. Der zweite ist, HTTP und HTTPS in einen gemeinsamen Block zu mischen. Der dritte ist, den Dienst mit einem Zertifikat zu starten, dessen privater Schlüssel durch ein Passwort geschützt ist: Der Start wartet dann auf eine Eingabe, die niemand macht. Für Dienste gehört der Schlüssel ohne Passphrase auf eine Platte mit strengen Rechten (Einheit 2.8), oder der Dienst liest ihn über ein Programm (`SSLPassPhraseDialog exec:...`).

```apache
# falsch: HTTPS-Direktiven im HTTP-Block, kein Listen 443
<VirtualHost *:80>
    SSLEngine on
    SSLCertificateFile "/etc/ssl/certs/test.example.crt"
</VirtualHost>
# richtig: getrennte Blöcke, HTTP nur mit Weiterleitung
Listen 443
<VirtualHost *:80>
    ServerName test.example
    Redirect permanent "/" "https://test.example/"
</VirtualHost>
<VirtualHost *:443>
    ServerName test.example
    SSLEngine on
    SSLCertificateFile    "/etc/ssl/certs/test.example.crt"
    SSLCertificateKeyFile "/etc/ssl/private/test.example.key"
</VirtualHost>
```

> **Praxisbeispiel: Der erste Test**
>
> Nach jeder Änderung prüft man von außen, nicht vom Server aus: `curl -vI https://www.example.org/` zeigt Protokoll, Zertifikat und Statuscode, und `openssl s_client -connect www.example.org:443 -servername www.example.org` zeigt die Kette. Eine Browserprüfung allein genügt nicht, weil Browser fehlende Zwischenzertifikate oft nachladen und Fehler so verbergen (Einheit 6.2).

## 6.2 Zertifikate

Ein *Zertifikat* ist eine Beglaubigung: Eine vertrauenswürdige Stelle, die *Zertifizierungsstelle* (CA, *Certificate Authority*), bestätigt mit ihrer digitalen Signatur, dass ein bestimmter öffentlicher Schlüssel zu einem bestimmten Namen gehört. Der Browser prüft die Signatur, den Namen, den Gültigkeitszeitraum und die Kette bis zu einer Wurzel-CA, die er kennt. Das Zertifikat enthält nur öffentliche Angaben; das Gegenstück, der *private Schlüssel*, verlässt den Server nie und ist das eigentliche Geheimnis. Wer ihn besitzt, kann sich als der Server ausgeben.

Der Weg zum Zertifikat läuft in drei Schritten. Erstens erzeugt man ein Schlüsselpaar (privat und öffentlich). Zweitens bildet man daraus eine *Zertifikatsanforderung* (CSR, *Certificate Signing Request*), die den öffentlichen Schlüssel und die gewünschten Namen enthält. Drittens signiert die CA die Anforderung und liefert das Zertifikat. Für Tests und interne Zwecke kann man die CA selbst spielen; die folgenden Befehle wurden in der Testumgebung genau so ausgeführt:

```bash
# 1. Test-CA anlegen (eigener Schlüssel, selbstsigniert, 30 Tage)
openssl req -x509 -newkey rsa:2048 -nodes -keyout ca.key -out ca.crt \
    -days 30 -subj "/CN=Test CA"

# 2. Schlüssel und CSR für den Server, Namen als SAN
openssl req -newkey rsa:2048 -nodes -keyout srv.key -out srv.csr \
    -subj "/CN=test.example" \
    -addext "subjectAltName=DNS:test.example,DNS:www.test.example"

# 3. CSR mit der Test-CA signieren
printf "subjectAltName=DNS:test.example,DNS:www.test.example\nextendedKeyUsage=serverAuth\n" > ext.cnf
openssl x509 -req -in srv.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out srv.crt -days 30 -extfile ext.cnf
```

Der erste Befehl erzeugt in einem Schritt Schlüssel und selbstsigniertes CA-Zertifikat. Beim zweiten steht der Name nicht nur im Feld `CN` (*Common Name*), sondern auch in der Erweiterung `subjectAltName` (SAN). Das ist wesentlich: Moderne Browser prüfen *nur noch* das SAN und ignorieren den `CN`; ein Zertifikat ohne passenden SAN-Eintrag führt zu einer Fehlermeldung, auch wenn der `CN` stimmt. Der dritte Schritt signiert mit der Test-CA. Das Ergebnis lässt sich mit `openssl x509 -in srv.crt -noout -subject -issuer -dates -ext subjectAltName` lesen; es zeigte Betreff `CN = test.example`, Aussteller `CN = Test CA`, Gültigkeit 30 Tage und die beiden Namen.

Für den Server ist die *Kette* entscheidend. Eine öffentliche CA signiert Server-Zertifikate meist nicht mit ihrer Wurzel, sondern über ein *Zwischenzertifikat*. Der Browser kennt die Wurzel, nicht aber das Zwischenzertifikat; deshalb muss der Server es mitschicken. Bei Nginx hängt man das Zwischenzertifikat an die Datei des Server-Zertifikats an (`cat srv.crt ca.crt > chain.crt`), bei Apache steht es seit Version 2.4.8 nach dem Kenntnisstand des Autors ebenfalls in der Datei `SSLCertificateFile` (die ältere Direktive `SSLCertificateChainFile` wird nicht mehr empfohlen; die Seite der Dokumentation wurde nicht abgerufen). Was ein fehlendes Zwischenzertifikat bewirkt, zeigt der Test mit Nginx:

```text
# nur srv.crt, ohne Kette:
$ openssl s_client -connect 127.0.0.1:8445 -servername test.example
verify error:num=20:unable to get local issuer certificate
Certificate chain
 0 s:CN = test.example
   i:CN = Test CA
Verification error: unable to verify the first certificate

# mit chain.crt (Zertifikat + CA):
Certificate chain
 0 s:CN = test.example
   i:CN = Test CA
 1 s:CN = Test CA
   i:CN = Test CA
Verification: OK
```

Ohne Kette liefert der Server nur die Ebene 0, und ein Client, der die CA nicht schon hat, kann die Kette nicht schließen. Mit der Kette erscheinen beide Ebenen, und die Prüfung gelingt (hier gegen die Datei `ca.crt` als vertrauenswürdige Wurzel). Weitere Prüfungen, die man in der Praxis oft braucht: Ob Zertifikat und Schlüssel zusammengehören, entscheidet beim Start der Server (Nginx schon beim Test, Apache erst beim Start, `AH02565: Certificate and private key ... do not match`). Ob ein Zertifikat abgelaufen ist, prüft `openssl verify`: Mit `-attime` lässt sich ein Zeitpunkt in der Zukunft simulieren, und der Test meldete `error 10 at 0 depth lookup: certificate has expired`.

Zur Praxis zählen noch drei Begriffe. Ein *Wildcard-Zertifikat* (`*.example.org`) deckt alle Namen einer Ebene ab, aber nicht `example.org` selbst und nicht tiefere Ebenen. Ein *SAN-Zertifikat* nennt mehrere Namen. Bei der *Schlüsselart* stehen RSA (2048 Bit oder mehr) und elliptische Kurven (ECDSA, meist P-256) zur Wahl; ECDSA ist bei gleicher Sicherheit kleiner und schneller, RSA ist breiter kompatibel.

> **Ergänzung aus der Nachrecherche: Laufzeit von Zertifikaten wird kürzer**
>
> Öffentliche Zertifikate sind in den letzten Jahren stetig kürzer gültig geworden; Let’s Encrypt etwa stellt Zertifikate mit nur 90 Tagen Laufzeit aus und setzt auf automatische Erneuerung. Wegen der Verkürzung sind manuelle Abläufe nicht mehr tragbar: Der Ablauf eines Zertifikats ist eine der häufigsten Ursachen für Ausfälle. Der konkrete Fahrplan der Branche für die Höchstlaufzeit wurde in dieser Arbeit nicht abgerufen; die aktuellen Vorgaben stehen in den Richtlinien der Zertifizierungsstellen und Browserhersteller. Betrieblich folgt daraus: Erneuerung automatisieren (Modul 12) und Ablaufdaten überwachen (Modul 9).

### Typische Fehler.

Der häufigste Fehler ist, das Zwischenzertifikat zu vergessen: Der Browser am Arbeitsplatz zeigt keinen Fehler (er lädt oder hat es gespeichert), ein Programm oder Handy meldet dagegen „unbekannte Zertifizierungsstelle“. Ein zweiter ist ein Zertifikat, dessen SAN den aufgerufenen Namen nicht enthält; der Test mit `curl https://localhost:8443/` gegen ein Zertifikat für `test.example` ergab `no alternative certificate subject name matches target host name 'localhost'`. Ein dritter ist der Schlüssel mit falschen Rechten: Ist er für alle lesbar, ist er als kompromittiert zu behandeln.

```bash
# falsch: Schlüssel für alle lesbar, neben dem Zertifikat abgelegt
chmod 644 /etc/ssl/private/test.example.key
# richtig: nur root (und der Dienst beim Start) darf lesen
chown root:root /etc/ssl/private/test.example.key
chmod 600 /etc/ssl/private/test.example.key
```

> **Praxisbeispiel: Ablaufdaten im Blick**
>
> Mit `openssl x509 -in cert.pem -noout -enddate` liest man das Ablaufdatum aus; `openssl s_client -connect host:443 -servername host 2>/dev/null | openssl x509 -noout -enddate` fragt das *ausgelieferte* Zertifikat ab. Das ist der Befehl für die Überwachung: Er prüft, was Kunden tatsächlich sehen, und nicht, was in einer Datei liegt.

## 6.3 TLS-Protokolle

TLS gibt es in mehreren Versionen, und die Wahl der erlaubten Versionen ist eine Sicherheitsentscheidung. Die Vorgänger SSL 2.0 und 3.0 sind seit Langem unsicher und abgeschaltet. TLS 1.0 und 1.1 gelten nach der Standardisierung durch die IETF (RFC 8996, nach dem Wissensstand des Autors) als veraltet und werden von aktuellen Browsern nicht mehr benutzt. Heute sind *TLS 1.2* und *TLS 1.3* die Versionen, die ein Server anbieten soll. TLS 1.3 ist die neueste und schnellste: Der Handshake braucht eine Runde weniger, und unsichere Verfahren sind aus dem Standard entfernt. TLS 1.2 bleibt wegen älterer Clients wichtig.

Bei Apache steuert die Direktive `SSLProtocol` die Versionen. Die Schreibweise ist eine Liste mit `+` (aktivieren) und `-` (entfernen). Die sauberste Form nennt ausdrücklich, was erlaubt ist, statt zu streichen, was nicht erlaubt ist:

```apache
# erlaubt nur TLS 1.2 und 1.3 (geprüft: Syntax OK, Verbindung mit 1.2 und 1.3)
SSLProtocol -all +TLSv1.2 +TLSv1.3
# anfällig für Veränderungen: alles ausser SSLv3
# SSLProtocol all -SSLv3
```

`-all +TLSv1.2 +TLSv1.3` beginnt mit „nichts“ und fügt zwei Versionen hinzu. Dagegen bedeutet `all -SSLv3` „alles, was die Bibliothek kennt, außer SSLv3“: Je nach Version von Apache und OpenSSL kann `all` dann Versionen umfassen, die man nicht mehr will. Die Testumgebung stützt diesen Rat: Mit `SSLProtocol -all +TLSv1.2 +TLSv1.3` meldete der Server auf Anfrage `ALPN protocol: h2` und lieferte über TLS 1.3 die Seite, und eine Anfrage mit `openssl s_client -tls1_1` schlug schon beim Client fehl, weil die Bibliothek der Testmaschine TLS 1.1 gar nicht mehr anbietet. Das zeigt, dass auch das Betriebssystem Grenzen setzt: Debian und Ubuntu setzen über OpenSSL eine Mindest-Sicherheitsstufe, die alte Versionen auch dann sperrt, wenn die Webserver-Konfiguration sie erlauben würde.

Wie prüft man, welche Version ein Server tatsächlich spricht? Der Handshake lässt sich gezielt erzwingen. Die Nginx-Testkonfiguration auf Port 8444 erlaubte nur TLS 1.3; ein Versuch mit `openssl s_client -tls1_2` endete mit `tlsv1 alert protocol version`, ein Versuch mit `-tls1_3` mit `Protocol : TLSv1.3`. Mit curl beendete `--tls-max 1.2` den Versuch mit Exit-Status 35 und der Meldung `tlsv1 alert protocol version`. Auf Port 8443 (TLS 1.2 und 1.3 erlaubt) lieferte derselbe Aufruf dagegen `TLSv1.2` und eine Antwort. Diese drei Einzeiler (`openssl s_client -tlsX`, `curl --tlsv1.X` und `--tls-max`) sind das Standardwerkzeug, um eine Versionseinstellung zu beweisen.

> **Ergänzung aus der Nachrecherche: Archivierte Empfehlungen veralten**
>
> Die frühere Mozilla-Empfehlung „Server Side TLS 4.0“ (Stand Juni 2019, ausdrücklich als veraltet gekennzeichnet) nannte für die Stufe „Intermediate“ noch die Protokolle TLS 1.0, 1.1 und 1.2 und für „Modern“ nur TLS 1.2. Das zeigt, wie schnell Empfehlungen altern: Wer Konfigurationsbeispiele aus dem Internet übernimmt, muss ihr Datum prüfen. Die aktuelle Fassung der Empfehlungen ist laut der Mozilla-Wiki-Seite (abgerufen am 31.10.2026) an die Seite `docs.tlsref.org` verschoben worden, die in dieser Arbeit nicht abgerufen werden konnte. Vor dem Übernehmen einer Konfiguration sollte man daher den aktuellen Konfigurationsgenerator oder die aktuelle Empfehlung nutzen.

### Typische Fehler.

Der häufigste Fehler ist `SSLProtocol all`, das mit der Zeit mehr zulässt als gedacht. Der zweite ist, TLS 1.3 zu vergessen (ältere Konfigurationen enthalten nur `+TLSv1.2`); dann bleibt der Server langsamer als nötig. Der dritte ist, ein Protokoll zu streichen, das noch Kunden nutzen, ohne vorher in den Logs nachzusehen: Gerade eingebettete Geräte und alte Dienstprogramme sprechen oft nur TLS 1.2 oder älter (Modul 9 zeigt, wie man die Version im Zugriffslog mitschreibt).

```apache
# falsch: alte Beispielkonfiguration, erlaubt TLS 1.0 und 1.1
SSLProtocol all -SSLv3
# richtig: ausdrückliche Liste
SSLProtocol -all +TLSv1.2 +TLSv1.3
```

> **Praxisbeispiel: Vor dem Abschalten messen**
>
> Bevor man eine Version abschaltet, protokolliert man ein paar Tage mit, welche Version Clients benutzen (Apache: `%{SSL_PROTOCOL}x` im `LogFormat`, Nginx: `$ssl_protocol`). Erst wenn kaum noch Anfragen mit der alten Version eintreffen, schaltet man sie ab und kündigt die Änderung an.

## 6.4 Cipher Suites

Eine *Cipher Suite* ist ein Paket von Verfahren, auf die sich Client und Server im Handshake einigen: Wie wird der Sitzungsschlüssel ausgehandelt (Schlüsselaustausch), wie wird der Server beglaubigt (Signatur), wie werden die Daten verschlüsselt (Chiffre) und wie werden sie gegen Veränderung gesichert? Ein Name wie `ECDHE-RSA-AES256-GCM-SHA384` liest sich von links nach rechts: Schlüsselaustausch mit elliptischen Kurven (`ECDHE`, mit *Forward Secrecy*), Signatur mit `RSA`, Chiffre `AES` mit 256 Bit im Modus `GCM` und Hash `SHA384`.

*Forward Secrecy* („vorwärts gerichtete Geheimhaltung“) verdient besondere Aufmerksamkeit. Dabei wird für jede Sitzung ein neuer, flüchtiger Schlüssel ausgehandelt. Selbst wenn jemand später den privaten Schlüssel des Servers erbeutet, kann er aufgezeichnete Sitzungen von früher nicht entschlüsseln. Alle empfohlenen Suiten nutzen deshalb `ECDHE` oder `DHE`.

Bei TLS 1.3 vereinfacht sich das Bild: Es gibt nur fünf Suiten, alle sicher, und sie sind nicht über die klassischen Direktiven einstellbar. `SSLCipherSuite` (Apache) und `ssl_ciphers` (Nginx) betreffen *nur TLS 1.2 und älter*. Bei Apache stellt man TLS-1.3-Suiten mit einer eigenen Direktive ein (`SSLCipherSuite TLSv1.3 ...`, nur in neueren 2.4er-Versionen, nicht geprüft); in der Regel belässt man die Voreinstellung. Beide Server nehmen die Liste im Format von OpenSSL entgegen, und man kann sie vorab prüfen. Die Ausgabe (hier die ersten sechs Zeilen, Leerraum gekürzt) listet zuerst die TLS-1.3-Suiten, die `openssl ciphers` immer mit ausgibt, und danach die TLS-1.2-Suiten, die die Zeichenkette tatsächlich ausgewählt hat:

```bash
$ openssl ciphers -v 'ECDHE+AESGCM:ECDHE+CHACHA20' | head -6
TLS_AES_256_GCM_SHA384         TLSv1.3 Kx=any   Au=any   Enc=AESGCM(256)  Mac=AEAD
TLS_CHACHA20_POLY1305_SHA256   TLSv1.3 Kx=any   Au=any   Enc=CHACHA20/POLY1305(256) Mac=AEAD
TLS_AES_128_GCM_SHA256         TLSv1.3 Kx=any   Au=any   Enc=AESGCM(128)  Mac=AEAD
ECDHE-ECDSA-AES256-GCM-SHA384  TLSv1.2 Kx=ECDH  Au=ECDSA Enc=AESGCM(256)  Mac=AEAD
ECDHE-RSA-AES256-GCM-SHA384    TLSv1.2 Kx=ECDH  Au=RSA   Enc=AESGCM(256)  Mac=AEAD
ECDHE-ECDSA-AES128-GCM-SHA256  TLSv1.2 Kx=ECDH  Au=ECDSA Enc=AESGCM(128)  Mac=AEAD
```

```apache
SSLProtocol -all +TLSv1.2 +TLSv1.3
SSLCipherSuite ECDHE+AESGCM:ECDHE+CHACHA20
SSLHonorCipherOrder off
```

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE+AESGCM:ECDHE+CHACHA20;
ssl_prefer_server_ciphers off;
```

Die Angabe `ECDHE+AESGCM:ECDHE+CHACHA20` bedeutet „alle Suiten mit ECDHE-Schlüsselaustausch und AES-GCM, dazu alle mit ECDHE und ChaCha20“; das Pluszeichen ist ein UND, der Doppelpunkt trennt Alternativen. Mit `openssl ciphers -v` prüft man, was die Zeichenkette tatsächlich ergibt, bevor man sie in die Konfiguration schreibt. `SSLHonorCipherOrder off` bzw. `ssl_prefer_server_ciphers off` überlässt die Auswahl dem Client; das ist heute üblich, weil moderne Clients je nach Hardware (mit oder ohne AES-Beschleunigung) die beste Wahl treffen. In der Testumgebung verhandelte Nginx mit TLS 1.3 die Suite `TLS_AES_256_GCM_SHA384` und mit TLS 1.2 `ECDHE-RSA-AES256-GCM-SHA384`. Ein Client, der nur eine nicht erlaubte Suite anbot (`-cipher AES128-SHA`), scheiterte mit `sslv3 alert handshake failure`.

### Typische Fehler.

Typisch ist eine *zu restriktive* Liste: Nennt man nur Suiten für ECDSA-Zertifikate, aber der Server hat ein RSA-Zertifikat, bleibt keine gemeinsame Suite, und alle Handshakes scheitern. Ebenso typisch ist eine *zu lockere* Liste mit Altlasten (RC4, 3DES, Export-Suiten), die Prüfwerkzeuge sofort bemängeln. Und es gibt die Annahme, die Liste beeinflusse TLS 1.3; sie tut es nicht. Gefährlich ist auch, eine lange Liste aus einer Anleitung zu kopieren, ohne sie mit `openssl ciphers -v` auf die gewünschte Wirkung zu prüfen.

```nginx
# falsch: veraltete Suiten ohne Forward Secrecy zugelassen
ssl_ciphers HIGH:RC4:3DES:!aNULL;
# richtig: nur ECDHE mit AEAD-Chiffren (siehe openssl ciphers -v)
ssl_ciphers ECDHE+AESGCM:ECDHE+CHACHA20;
```

> **Praxisbeispiel: Prüfwerkzeuge**
>
> Externe Prüfdienste und Werkzeuge wie `testssl.sh` oder `sslscan` zählen alle angebotenen Suiten auf und bewerten sie. Sie wurden in dieser Arbeit nicht eingesetzt; als einfache Eigenprüfung genügt `openssl s_client -cipher '...'` gegen den eigenen Server, um zu belegen, dass eine unerwünschte Suite abgelehnt wird.

## 6.5 OCSP Stapling

Ein Zertifikat kann vor seinem Ablauf ungültig werden, etwa weil der private Schlüssel gestohlen wurde. Dann muss die CA es *widerrufen*, und ein Client müsste bei jedem Verbindungsaufbau nachsehen können, ob das Zertifikat noch gilt. Das klassische Verfahren dafür ist *OCSP* (*Online Certificate Status Protocol*): Der Client fragt bei der CA nach. Das ist langsam, verrät der CA, welche Websites der Nutzer besucht, und scheitert, wenn die CA nicht erreichbar ist.

*OCSP Stapling* dreht den Weg um: Der *Server* holt sich selbst von der CA eine signierte, zeitlich begrenzte Statusantwort und „heftet“ (*staple*) sie an den Handshake. Der Client bekommt den Beweis direkt mit und muss die CA nicht fragen. Voraussetzung ist, dass das Zertifikat die Adresse eines OCSP-Responders enthält und der Server ihn erreichen kann. Die Konfiguration bei Nginx und Apache:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/ssl/certs/ca-chain.pem;
resolver 1.1.1.1 9.9.9.9 valid=300s;
```

```apache
SSLStaplingCache "shmcb:/var/run/apache2/stapling(128000)"
SSLUseStapling on
```

Bei Nginx braucht es zusätzlich einen `resolver`, weil der Server den Namen des Responders selbst auflösen muss, und `ssl_trusted_certificate`, mit dem er die Antwort prüft. Apache benötigt einen Zwischenspeicher für die Antworten. Die Testzertifikate haben *keine* OCSP-Adresse, und genau dieser Fall wurde geprüft: Nginx meldet beim Start im Fehlerlog `[warn] "ssl_stapling" ignored, no OCSP responder URL in the certificate` und arbeitet ohne Stapling weiter; der Test selbst besteht, die Warnung erscheint erst beim Start. Apache schreibt `AH02218: ssl_stapling_init_cert: no OCSP URI in certificate and no SSLStaplingForceURL set` sowie `AH02604: Unable to configure certificate ... for stapling`; `openssl s_client -status` zeigte `OCSP response: no response sent`.

> **Ergänzung aus der Nachrecherche: Let’s Encrypt hat OCSP eingestellt**
>
> Nach der Ankündigung von Let’s Encrypt vom 5. 12. 2024 (abgerufen am 31.10.2026) wurde die Unterstützung für OCSP schrittweise beendet: Seit dem 30. 1. 2025 schlugen Anträge mit der Erweiterung *Must-Staple* fehl, ab dem 7. 5. 2025 wurden OCSP-Adressen nicht mehr in Zertifikate geschrieben, und am 6. 8. 2025 wurden die OCSP-Responder abgeschaltet. Als Ersatz dienen Sperrlisten (*CRLs*), die Let’s Encrypt seit 2022 unterstützt. Als Gründe nennt der Betreiber unter anderem den Datenschutz, denn bei OCSP kann die CA erfahren, welche Websites ein Besucher aufruft. Für den Betrieb heißt das: Bei Zertifikaten von Let’s Encrypt gibt es kein OCSP-Stapling mehr (der Text der Ankündigung bestätigt dies nicht ausdrücklich, folgert es aber aus der Abschaltung); die Direktiven sind dann wirkungslos und erzeugen, wie im Test, nur Warnungen. Wer Zertifikate anderer Zertifizierungsstellen einsetzt, prüft mit `openssl x509 -noout -ocsp_uri -in cert.pem`, ob das Zertifikat überhaupt eine OCSP-Adresse trägt. Aktuelle Pläne anderer Zertifizierungsstellen wurden nicht recherchiert.

### Typische Fehler.

Ein häufiger Fehler ist, Stapling zu aktivieren, ohne zu prüfen, ob es wirkt; die Warnung im Log wird nicht gelesen. Ein zweiter ist ein fehlender `resolver` bei Nginx, der zu Zeitüberschreitungen führt. Ein dritter ist *Must-Staple*: Das Zertifikat verlangt, dass der Server eine Statusantwort mitschickt; fällt der Responder aus, können Besucher die Website nicht erreichen. Die Erweiterung ist deshalb riskant und wurde, wie oben beschrieben, von Let’s Encrypt eingestellt.

```bash
# falsch: Stapling "auf gut Glück" aktiviert, nie geprüft
# richtig: prüfen, ob eine Statusantwort mitgeschickt wird
$ openssl s_client -connect www.example.org:443 -servername www.example.org -status 2>&1 | grep -i "OCSP response"
OCSP response: no response sent
```

> **Praxisbeispiel: Prüfung vor der Abschaltung**
>
> Vor einem Umzug auf ein anderes Zertifikat (oder eine andere CA) prüft man, ob OCSP-Stapling überhaupt vorgesehen ist. Ist es das nicht, entfernt man die Direktiven, damit das Fehlerlog frei von Dauerwarnungen bleibt und echte Meldungen nicht untergehen.

## 6.6 HSTS

*HSTS* (*HTTP Strict Transport Security*) ist eine Anweisung des Servers an den Browser: „Sprich mit dieser Website in Zukunft nur noch über HTTPS.“ Sie wird als Antwortkopf `Strict-Transport-Security` übertragen und von dem Browser für die angegebene Zeit gespeichert. Der Nutzen liegt im Schutz vor dem ersten, unverschlüsselten Zugriff: Tippt ein Besucher nur `beispiel.at` in die Adresszeile, versucht der Browser zuerst HTTP, und ein Angreifer im selben Netz (etwa einem öffentlichen WLAN) könnte diese erste Anfrage abfangen und manipulieren, bevor die Weiterleitung auf HTTPS greift. Hat der Browser HSTS gespeichert, geht er *gar nicht erst* über HTTP, sondern stellt die Anfrage intern auf HTTPS um.

Der Header besteht aus der Laufzeit `max-age` in Sekunden und optionalen Zusätzen: `includeSubDomains` dehnt die Regel auf alle Unterdomänen aus, `preload` zeigt an, dass man die Domain in die fest eingebauten Listen der Browser aufnehmen lassen möchte. Die Konfiguration ist eine Zeile; sie muss in der HTTPS-Antwort stehen (über HTTP gesendet, ignorieren Browser sie) und mit `always` auch bei Fehlerantworten gesendet werden:

```apache
<VirtualHost *:443>
    ...
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</VirtualHost>
```

```nginx
server {
    listen 443 ssl;
    ...
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

In der Testumgebung lieferten beide Server über HTTP/2 den Header `strict-transport-security: max-age=31536000; includeSubDomains` (31 536 000 Sekunden sind ein Jahr). Bei Nginx gilt die Vererbungsregel der `add_header`-Direktive (Einheit 3.9): Setzt ein `location` eigene Header, geht HSTS dort verloren. Bei Apache braucht man `mod_headers`.

Zu HSTS gehört die Weiterleitung von HTTP auf HTTPS. Sie ist der Weg, auf dem Besucher den Header erst bekommen, und der Rückfall für Browser, die ihn noch nicht kennen. Die Testumgebung prüfte die Nginx-Variante: `return 301 https://$host:8443$request_uri;` lieferte für `/pfad?x=1` die Antwort `301` mit `Location: https://test.example:8443/pfad?x=1`. In der Produktion fällt die Portangabe weg, weil HTTPS auf Port 443 liegt. Die Apache-Fassung in Einheit 6.1 verwendet `Redirect permanent`.

> **Ergänzung aus der Nachrecherche: HSTS ist schwer zurückzunehmen**
>
> Die Empfehlung der früheren Mozilla-Richtlinie (archivierter Stand 2019, abgerufen am 31.10.2026) lautete, HSTS nur zu aktivieren, wenn HTTPS für die gesamte Laufzeit von `max-age` ununterbrochen verfügbar sein wird, weil man HTTPS erst abschalten kann, wenn die Einträge in allen Browsern abgelaufen sind. Dasselbe gilt in verschärfter Form für `includeSubDomains` und `preload`: Ein Eintrag in den Browserlisten lässt sich nur mit großer Verzögerung wieder entfernen. Die Voraussetzungen und die Funktionsweise der Preload-Liste sind in dieser Arbeit nicht abgerufen worden; man prüft sie auf der Seite des Listenbetreibers, bevor man `preload` setzt. Üblich ist ein schrittweises Vorgehen: erst wenige Minuten, dann Tage, dann Monate.

### Typische Fehler.

Der häufigste Fehler ist, HSTS mit einer langen Laufzeit einzuführen, bevor alle Unterdomänen HTTPS können, und dadurch eine interne Website (`intern.beispiel.at`) auszusperren, deren Zertifikat fehlt. Der zweite ist, den Header nur im `location` zu setzen und an anderen Stellen zu verlieren. Der dritte ist ein Zertifikatsfehler bei aktivem HSTS: Normalerweise kann der Benutzer eine Warnung wegklicken, bei HSTS *nicht*, die Website ist dann bis zur Behebung unerreichbar.

```nginx
# falsch: gleich ein Jahr plus Subdomains, ohne Test
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
# richtig: zuerst kurz testen (5 Minuten), dann schrittweise verlängern
add_header Strict-Transport-Security "max-age=300" always;
```

> **Praxisbeispiel: Einführung in Stufen**
>
> Ein Projekt beginnt mit `max-age=300`, beobachtet einen Tag lang die Fehlermeldungen und Zugriffe, erhöht auf einen Tag, dann auf eine Woche, dann auf ein Jahr. Erst danach folgt, falls überhaupt gewünscht, `includeSubDomains`, wenn eine Bestandsaufnahme aller Unterdomänen zeigt, dass alle HTTPS beherrschen.

## 6.7 HTTP/2

*HTTP/2* ist die zweite Hauptversion des Protokolls. Sie ändert nicht die Bedeutung von HTTP (Methoden, Statuscodes, Header bleiben), aber die Art der Übertragung: Statt Textzeilen sendet sie ein *binäres* Format, und vor allem erlaubt sie, *mehrere Anfragen gleichzeitig über eine einzige Verbindung* zu schicken (*Multiplexing*). Bei HTTP/1.1 öffnet ein Browser mehrere Verbindungen oder wartet, bis eine Antwort fertig ist, bevor die nächste Datei kommt; bei HTTP/2 laufen CSS, Skripte und Bilder gleichzeitig über dieselbe Verbindung, und die Header werden komprimiert. Für eine Seite mit vielen kleinen Dateien bringt das spürbar kürzere Ladezeiten, Zahlen hängen aber stark von der Seite ab und werden hier nicht angegeben.

Browser sprechen HTTP/2 nur über TLS. Ausgehandelt wird es im Handshake über die Erweiterung *ALPN* (*Application-Layer Protocol Negotiation*): Der Client nennt die gewünschten Protokolle (`h2`, `http/1.1`), der Server wählt eines. Die Testumgebung zeigte es mit `openssl s_client -alpn h2,http/1.1`: Die Antwort lautete `ALPN protocol: h2`. Bei Apache braucht man das Modul `mod_http2` und die Direktive `Protocols`:

```apache
LoadModule http2_module modules/mod_http2.so
Protocols h2 http/1.1
```

`Protocols h2 http/1.1` nennt die erlaubten Protokolle in der Reihenfolge der Vorliebe des Servers. Die Dokumentation von Apache (abgerufen am 31.10.2026) weist darauf hin, dass die Reihenfolge wichtig ist: `Protocols h2 h2c http/1.1` ist richtig, `http/1.1 h2` dagegen wählt immer HTTP/1.1, solange der Client auch das kann. `h2c` ist HTTP/2 ohne TLS, das Browser nicht nutzen. Die Direktive darf global oder je Virtual Host stehen. Das MPM spielt eine Rolle: Die Dokumentation empfiehlt das *event*-MPM; unter *prefork* funktioniert HTTP/2 nur mit starken Einschränkungen, weil `mod_http2` dort pro Verbindung nur eine Anfrage gleichzeitig bearbeitet und langsame Anfragen die übrigen aufhalten. Das ist ein weiterer Grund für den Wechsel auf event (Einheit 4.4).

Bei Nginx 1.24.0, der Version der Testumgebung, steht HTTP/2 als Parameter an `listen`; das Modul muss einkompiliert sein (`nginx -V` zeigt `--with-http_v2_module`, bei Distributionspaketen der Regelfall):

```nginx
server {
    listen 443 ssl http2;
    server_name test.example;
    ssl_certificate     /etc/ssl/certs/test.example.crt;
    ssl_certificate_key /etc/ssl/private/test.example.key;
}
```

Der Test ergab mit `curl --http2` die Antwort `HTTP/2 200`, mit `curl --http1.1` dagegen `HTTP/1.1 200 OK`; die Variable `$server_protocol` lieferte `HTTP/2.0`. Der Server bietet also beide Protokolle an, und der Client wählt.

> **Ergänzung aus der Nachrecherche: Seit Nginx 1.25.1: http2 als eigene Direktive**
>
> Nach der Dokumentation des Moduls `ngx_http_v2_module` (abgerufen am 31.10.2026) gibt es seit Version 1.25.1 die Direktive `http2 on;` (Kontext `http` und `server`), die HTTP/2 einschaltet; der Beispielblock der Seite enthält `listen 443 ssl;` und `http2 on;` in getrennten Zeilen. Die Seite sagt nicht, was mit dem Parameter `http2` an `listen` geschieht; nach dem Kenntnisstand des Autors gilt er in neueren Versionen als veraltet, was man in der Beschreibung von `listen` nachprüfen sollte. Die Dokumentation nennt außerdem: HTTP/2 Server Push (`http2_push`, `http2_push_preload`, `http2_max_concurrent_pushes`) ist seit 1.25.1 überholt; als Ersatz für `http2_push` wird `early_hints` genannt. Dazu passt die Angabe der Apache-Dokumentation: Server Push ist in RFC 9113 als veraltet eingestuft, und Chrome und Edge ab Version 106 unterstützen es nicht mehr. Neue Konfigurationen sollten Push nicht einsetzen.

### Typische Fehler.

Ein häufiger Fehler ist, `Protocols` zu setzen, aber das Modul `mod_http2` nicht zu laden: Es erscheint keine Fehlermeldung beim Test, die Website bleibt bei HTTP/1.1. Ein zweiter ist, HTTP/2 zusammen mit `prefork` und `mod_php` zu betreiben. Ein dritter ist, den Erfolg nur im Browser zu prüfen; `curl -I --http2 https://...` und die Ausgabe der ersten Zeile (`HTTP/2 200`) sind eindeutiger. Ein vierter ist eine Cipher-Liste, die Verfahren der „Sperrliste“ von HTTP/2 enthält: Dann lehnen Browser HTTP/2 ab und fallen zurück auf HTTP/1.1, ohne dass ein Fehler zu sehen ist (so die Apache-Dokumentation, die auf RFC 9113, Abschnitt 9.2.2, verweist).

```apache
# falsch: Protokoll ohne Modul, bleibt unbemerkt bei HTTP/1.1
Protocols h2 http/1.1
# richtig: Modul laden, event-MPM, danach per curl prüfen
LoadModule http2_module modules/mod_http2.so
Protocols h2 http/1.1
# curl -sI --http2 https://test.example/ | head -1   ->  HTTP/2 200
```

> **Praxisbeispiel: Auswirkung auf den Betrieb**
>
> Weil HTTP/2 viele Anfragen über eine Verbindung bündelt, ändert sich das Lastbild: weniger Verbindungen, aber mehr gleichzeitige Anfragen pro Verbindung. Parameter wie Keep-Alive-Zeiten und die Begrenzung gleichzeitiger Streams gehören dann zur Auslegung (Modul 11). Beim Debuggen hilft, dass HTTP/2 binär ist: Man liest es nicht mit einem Texteditor im Mitschnitt, sondern mit `curl -v`, `nghttp` oder Wireshark.

## 6.8 TLS Troubleshooting

TLS-Fehler zeigen sich dem Anwender meist nur als „Verbindung nicht sicher“, dem Betreiber aber lässt sich fast jeder Fall mit wenigen Werkzeugen eingrenzen. Das Vorgehen folgt der Reihenfolge des Handshakes: Erreicht man den Port überhaupt? Einigen sich beide auf Protokoll und Suite? Ist das Zertifikat gültig, vollständig und für den Namen ausgestellt? Und erst danach: Was antwortet die Anwendung?

Das wichtigste Werkzeug ist `openssl s_client`. Es baut eine TLS-Verbindung auf und zeigt Kette, Prüfergebnis, Version und Suite. Mit `-servername` setzt man den SNI-Namen (ohne ihn bekommt man bei mehreren Websites das Standardzertifikat), mit `-tls1_2` oder `-tls1_3` erzwingt man eine Version, mit `-CAfile` gibt man die vertrauenswürdige Wurzel an, mit `-showcerts` zeigt man die ganze Kette. `curl -v` erledigt vieles davon aus Sicht eines Clients, und seine Fehlernummern sind aussagekräftig. Die Testumgebung lieferte folgende typische Fälle:

| **Meldung (gekürzt)**         | **Ursache und Abhilfe**                                                        |
|:------------------------------|:-------------------------------------------------------------------------------|
| curl 60: `self-signed certificate in certificate chain`            | Die CA ist dem Client unbekannt; bei Tests `--cacert`, sonst echte CA verwenden |
| curl 60: `no alternative certificate subject name matches target host name`            | Name nicht im SAN; Zertifikat neu ausstellen                                   |
| curl 35 / s_client: `tlsv1 alert protocol version` | Client und Server haben keine gemeinsame Protokollversion                      |
| s_client: `sslv3 alert handshake failure`           | Keine gemeinsame Cipher Suite                                                  |
| s_client: `unable to verify the first certificate`           | Zwischenzertifikat fehlt in der Serverkette                                    |
| openssl verify: `certificate has expired`     | Zertifikat abgelaufen                                                          |
| Nginx: `key values mismatch`              | Schlüssel gehört nicht zum Zertifikat                                          |
| Nginx: `cannot load certificate ... No such file or directory`              | Datei fehlt oder falscher Pfad                                                 |
| Apache: `AH02565: Certificate and private key ... do not match`             | Schlüssel passt nicht (erst beim Start sichtbar)                               |
| Apache: `SSLCertificateFile: file '...' does not exist or is empty`             | Datei fehlt (schon beim Test sichtbar)                                         |
| Apache: `AH01909: ... server certificate does NOT include an ID which matches the server name`             | Zertifikat passt nicht zum `ServerName`                                           |

Die Tabelle enthält eine wichtige Unterscheidung zwischen den Servern: Nginx entdeckt einen unpassenden Schlüssel schon beim Test (`nginx -t` bricht ab), Apache dagegen erst beim Start; der `configtest` meldete in der Testumgebung „Syntax OK“, obwohl Zertifikat und Schlüssel nicht zusammenpassten, und erst `apachectl start` scheiterte mit `AH00016: Configuration Failed`. Bei einem *Neuladen* (`graceful`) dagegen läuft der alte Prozess weiter, wenn die neue Konfiguration scheitert; ein Neustart eines Dienstes mit unpassendem Schlüssel legt die Website lahm. Prüfen Sie Schlüssel und Zertifikat deshalb vorab: Die Modulus-Werte beider Dateien müssen übereinstimmen (`openssl x509 -noout -modulus -in cert.crt | openssl md5` und `openssl rsa -noout -modulus -in key.key | openssl md5` müssen denselben Wert liefern; das gilt für RSA-Schlüssel).

Aus diesen Bausteinen entsteht ein kleines Prüfwerkzeug, das in der Testumgebung gegen den Nginx-Server auf Port 8443 lief. Es gibt Protokoll, Suite, Prüfergebnis und die Restlaufzeit des Zertifikats aus und warnt bei weniger als 14 Tagen:

```bash
#!/bin/bash
# tls-check.sh -- prüft einen TLS-Endpunkt: Version, Suite, Kette, Ablauf
HOST="${1:?Aufruf: $0 host [port] [cafile]}"; PORT="${2:-443}"; CA="${3:-}"
OPT=(-connect "$HOST:$PORT" -servername "$HOST")
[ -n "$CA" ] && OPT+=(-CAfile "$CA")
out=$(echo | openssl s_client "${OPT[@]}" 2>&1)
proto=$(echo "$out" | grep -m1 '^New,' | awk -F', ' '{print $2}')
suite=$(echo "$out" | grep -m1 '^New,' | sed 's/.*Cipher is //')
verif=$(echo "$out" | grep -E "Verification" | head -1)
ende=$(echo "$out" | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
echo "Protokoll: ${proto:-keine Verbindung}"
echo "Suite:     ${suite:--}"
echo "Prüfung:  ${verif:-nicht ermittelt}"
if [ -n "$ende" ]; then
    tage=$(( ( $(date -d "$ende" +%s) - $(date +%s) ) / 86400 ))
    echo "Ablauf:    $ende (noch $tage Tage)"
    if [ "$tage" -lt 14 ]; then echo "WARNUNG: Zertifikat läuft bald ab"; exit 2; fi
fi
exit 0
```

Das Skript fragt den Endpunkt mit SNI ab und wertet die Zeile `New, TLSv1.3, Cipher is ...` aus, die `openssl s_client` beim Handshake schreibt, sowie die Prüfzeile `Verification: ...`. Das Ablaufdatum liest es aus dem gelieferten Zertifikat (`openssl x509 -noout -enddate`) und rechnet die Tage bis dahin aus. Ausgabe der Testumgebung mit der Test-CA: `Protokoll: TLSv1.3`, `Suite: TLS_AES_256_GCM_SHA384`, `Pruefung: Verification: OK`, `Ablauf: Nov 30 21:18:19 2026 GMT (noch 29 Tage)`. Ohne `CAfile` stand statt `OK` die Meldung `Verification error: self-signed certificate in certificate chain`. Bei einem nicht erreichbaren Port steht `keine Verbindung`. Das Skript lässt sich so für Überwachung und Abnahme einsetzen (Modul 9 und 12).

### Typische Fehler.

Der erste Fehler ist, nur im Browser zu testen: Browser laden fehlende Zwischenzertifikate nach, verwenden zwischengespeicherte Antworten und verbergen so Fehler, die andere Clients sehen. Der zweite ist, ohne `-servername` zu testen und das Standardzertifikat des Servers zu prüfen statt das der Website. Der dritte ist, ein Problem an der falschen Stelle zu suchen: Ein TLS-Fehler erscheint *vor* jeder HTTP-Zeile, im Zugriffslog findet man nichts, im Fehlerlog dagegen oft die Ursache.

```bash
# falsch: ohne SNI zeigt s_client das falsche Zertifikat (bei mehreren Websites)
openssl s_client -connect 203.0.113.10:443
# richtig: SNI mitgeben, CA angeben, Ergebnis lesen
openssl s_client -connect 203.0.113.10:443 -servername shop.example.org \
    -CAfile /etc/ssl/certs/ca-certificates.crt </dev/null 2>&1 | grep -E "Verification|subject"
```

> **Praxisbeispiel: Reihenfolge der Fehlersuche**
>
> Bei einer Störungsmeldung „HTTPS geht nicht“ läuft die Prüfung immer gleich ab: erst `curl -vI https://...` von außen (welche Fehlernummer?), dann `openssl s_client` mit SNI (Kette, Name, Ablauf), dann das Fehlerlog des Servers (Rechte, Pfade, Schlüssel), zuletzt die Konfiguration. Wer in dieser Reihenfolge arbeitet, findet die Ursache meist in wenigen Minuten.

## 6.9 ssl_protocols

Die Direktive `ssl_protocols` ist das Nginx-Gegenstück zu `SSLProtocol` aus Einheit 6.3. Sie nimmt eine Liste erlaubter Versionen entgegen: `SSLv2`, `SSLv3`, `TLSv1`, `TLSv1.1`, `TLSv1.2` und `TLSv1.3`. Anders als bei Apache gibt es kein `+` und `-`: Man *nennt* schlicht, was erlaubt ist. Die Standardwerte haben sich über die Zeit verschärft; nach dem Kenntnisstand des Autors gilt seit Version 1.23.4 die Voreinstellung `TLSv1.2 TLSv1.3`, vorher waren ältere Versionen mit eingeschlossen. Weil Voreinstellungen sich mit dem Release ändern können, schreibt man die Liste ausdrücklich in die Konfiguration.

Die Syntax ist streng. Ein ungültiger Name bricht den Test ab: `ssl_protocols TLSv1.4;` lieferte in der Testumgebung `invalid value "TLSv1.4"` mit Datei und Zeile. Die Direktive darf im `http`- und im `server`-Kontext stehen. Eine Besonderheit, die man leicht übersieht, betrifft mehrere Websites auf derselben Adresse und demselben Port: Weil die Wahl der Protokollversion *vor* dem Austausch des Namens (SNI) und damit vor der Wahl des `server`-Blocks festgelegt wird, gilt für alle Websites auf dem Port die Einstellung des *Standardservers*. Der Test bestätigt das: Zwei Server teilten sich Port 8447, der Standardserver `a.example` erlaubte nur TLS 1.3, `b.example` erlaubte 1.2 und 1.3. Ein Handshake mit `-tls1_2` schlug für *beide* Namen mit `tlsv1 alert protocol version` fehl, auch für `b.example`, dessen eigene Konfiguration 1.2 erlaubte.

```nginx
http {
    # gilt für alle Server, die nichts Eigenes festlegen
    ssl_protocols TLSv1.2 TLSv1.3;

    server {
        listen 443 ssl default_server;
        server_name a.example;
        ...
    }
    server {
        listen 443 ssl;
        server_name b.example;
        ...        # erbt dieselbe Einstellung, braucht keine eigene Zeile
    }
}
```

Die Lehre: Protokollversionen legt man im `http`-Block fest, einheitlich für alle Websites, und überschreibt sie nicht in einzelnen Blöcken, deren Wirkung vom Standardserver abhängt. Ähnliches gilt für andere Parameter, die vor SNI wirken. Gleiche Sorgfalt braucht der Zusammenhang mit `ssl_ciphers` (Einheit 6.4) und mit den Zertifikaten: Für RSA- und ECDSA-Zertifikate gleichzeitig kann man `ssl_certificate` mehrfach angeben (jeweils mit eigenem Schlüssel); Nginx wählt je nach Fähigkeit des Clients. Das wurde hier nicht getestet.

### Typische Fehler.

Der erste Fehler ist die Annahme, jeder `server`-Block habe seine eigene Versionsliste. Der zweite ist, `TLSv1.3` wegzulassen, wenn die Bibliothek es kann; die Website bleibt dann auf 1.2. Der dritte ist, auf einer Nginx-Version zu arbeiten, deren OpenSSL kein TLS 1.3 beherrscht, und die Direktive trotzdem zu setzen; `nginx -V` zeigt die Bibliothek (`built with OpenSSL ...`).

```nginx
# falsch: veraltete Versionen im Standardserver, wirkt auf alle Websites
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
# richtig: ausdrückliche, moderne Liste im http-Block
ssl_protocols TLSv1.2 TLSv1.3;
```

> **Praxisbeispiel: Ein Satz Konfiguration für alle**
>
> In Teams legt man TLS-Grundeinstellungen (Protokolle, Suiten, Sitzungs-Cache, HSTS-Snippet) in eine gemeinsame Datei (`snippets/tls.conf`) und bindet sie per `include` ein. So gilt auf jedem Server dieselbe Basis, Änderungen erfolgen an einer Stelle, und ein Review (Einheit 3.8) prüft nur Abweichungen.

## 6.10 HTTP/3 und QUIC

*HTTP/3* ist die dritte Hauptversion des Protokolls und läuft nicht mehr über TCP, sondern über *QUIC*, ein auf UDP aufgesetztes, immer verschlüsseltes Transportprotokoll. Der Hintergrund: Bei HTTP/2 teilen sich alle Datenströme eine TCP-Verbindung, und geht ein einziges Paket verloren, warten alle Ströme, bis es nachgeliefert ist (*Head-of-Line-Blocking* auf Transportebene). QUIC behandelt Ströme unabhängig, baut Verbindungen schneller auf (Transport und TLS 1.3 in einem Handshake) und übersteht den Wechsel des Netzes, etwa vom WLAN ins Mobilfunknetz, ohne die Verbindung neu aufzubauen. QUIC setzt TLS 1.3 voraus; ältere Versionen sind dort nicht möglich.

Wie erfährt ein Browser, dass ein Server HTTP/3 kann? Er kann UDP nicht einfach „auf Verdacht“ probieren. Deshalb funktioniert der Einstieg über eine normale HTTPS-Verbindung: Der Server schickt den Antwortkopf `Alt-Svc` (*Alternative Service*), etwa `h3=":443"; ma=86400`, der sagt: „Diese Website ist auch per HTTP/3 auf UDP-Port 443 erreichbar, und diese Angabe gilt einen Tag.“ Der Browser merkt sich das und nutzt beim nächsten Besuch HTTP/3, mit Rückfall auf HTTP/2, wenn es nicht klappt.

Nach der Nginx-Dokumentation (abgerufen am 31.10.2026) wurde die Unterstützung für QUIC und HTTP/3 in Version 1.25.0 eingeführt und ist in den Linux-Binärpaketen enthalten. Beim Selbstbau braucht man `--with-http_v3_module` und eine SSL-Bibliothek mit QUIC-Unterstützung (empfohlen wird OpenSSL 3.5.1 oder neuer; ältere OpenSSL-Versionen nutzen eine Kompatibilitätsschicht ohne Unterstützung für *Early Data*; BoringSSL, LibreSSL und QuicTLS werden ebenfalls unterstützt). Die Seite zum HTTP/3-Modul beschreibt das Modul als experimentell. Das Beispiel der Dokumentation für einen Server, der beides anbietet:

```nginx
server {
    listen 8443 quic reuseport;    # UDP: HTTP/3
    listen 8443 ssl;               # TCP: HTTP/1.1 und HTTP/2

    ssl_certificate     certs/example.com.crt;
    ssl_certificate_key certs/example.com.key;

    location / {
        # Browser über HTTP/3 informieren
        add_header Alt-Svc 'h3=":8443"; ma=86400';
    }
}
```

Die erste `listen`-Zeile öffnet einen UDP-Port für QUIC (`reuseport` wird laut Dokumentation für das richtige Verhalten mit mehreren Arbeitsprozessen empfohlen), die zweite den gewohnten TCP-Port für HTTP/1.1 und HTTP/2. Dieselbe Portnummer für beide wird ausdrücklich empfohlen, weil es die Kompatibilität verbessert. Der `Alt-Svc`-Header weist auf HTTP/3 hin; die Variable `$http3` liefert `h3` für HTTP/3-Anfragen und eignet sich für das Zugriffslog. Die Direktive `http3` (Standard `on`) steuert die Aushandlung, `quic_retry on;` schaltet die Adressprüfung ein, `ssl_early_data on;` erlaubt 0-RTT, und `quic_gso on;` nutzt Segmentierungsauslagerung der Netzkarte, sofern sie das unterstützt.

Für die Testumgebung (Nginx 1.24.0) gilt: Diese Version enthält weder das Modul noch die `quic`-Parameter, die Beispiele dieser Einheit wurden daher *nicht ausgeführt*. Für Apache fehlt in der Testumgebung jede HTTP/3-Möglichkeit: Die abgerufene Dokumentation von `mod_http2` behandelt nur HTTP/2, und eine HTTP/3-Unterstützung des Apache HTTP Servers wurde in dieser Arbeit nicht recherchiert. Wer HTTP/3 mit Apache betreiben will, stellt ihn üblicherweise hinter einen Proxy oder ein CDN, das HTTP/3 beherrscht (Modul 7).

Zwei betriebliche Folgen verdienen Erwähnung. Erstens muss die Firewall *UDP*-Port 443 freigeben, nicht nur TCP; ein häufiger Grund, warum HTTP/3 „nicht funktioniert“ (Einheit 2.11 behandelt Ports und Firewall). Zweitens bleibt HTTP/2 der Rückfall: Netze, die UDP blockieren, laufen ohne Fehler weiter über TCP. HTTP/3 ist daher eine Beschleunigung, kein Ersatz, und eine fehlerhafte QUIC-Konfiguration führt meist nur zum stillen Rückfall, was sie schwer erkennbar macht.

### Typische Fehler.

Der erste Fehler ist, `listen ... quic` zu setzen und den `Alt-Svc`-Header zu vergessen; der Server kann HTTP/3, aber kein Browser erfährt es. Der zweite ist, UDP 443 nicht freizugeben. Der dritte ist, `ssl_protocols` ohne TLS 1.3 zu betreiben: QUIC setzt es voraus.

```nginx
# falsch: QUIC-Port ohne Hinweis für Browser, TLS 1.3 gesperrt
listen 443 quic reuseport;
ssl_protocols TLSv1.2;
# richtig: TLS 1.3 erlaubt, Alt-Svc im Header, UDP 443 in der Firewall frei
listen 443 quic reuseport;
listen 443 ssl;
ssl_protocols TLSv1.2 TLSv1.3;
add_header Alt-Svc 'h3=":443"; ma=86400' always;
```

> **Praxisbeispiel: Einführen und messen**
>
> HTTP/3 führt man schrittweise ein: erst in einer Testumgebung, dann mit kurzer `ma`-Zeit im `Alt-Svc`-Header, damit man bei Problemen schnell zurückkann. Wirkung und Fehlerquote beobachtet man im Zugriffslog (`$http3`). Ob sich der Aufwand lohnt, hängt stark vom Publikum ab; mobile Nutzer und Netze mit Paketverlusten profitieren am meisten.

## Übungsaufgaben

Die Aufgaben steigen im Schwierigkeitsgrad. Die Aufgaben 6 bis 9 sind praktische Aufgaben, die Sie in einer Testumgebung (virtuelle Maschine oder Container, nicht auf einem Produktivsystem) nachbauen sollten. Die Lösungen mit Erklärung folgen im nächsten Abschnitt.

**Aufgabe 1 (leicht).** Erklären Sie in je ein bis zwei Sätzen: Was ist ein Zertifikat, was ist der private Schlüssel, was ist eine Zertifizierungsstelle? Welche der drei Dateien darf niemals den Server verlassen?

**Aufgabe 2 (leicht).** Lesen Sie den Namen `ECDHE-RSA-AES128-GCM-SHA256` von links nach rechts und nennen Sie, was jeder Teil bedeutet. Warum ist `ECDHE` im Namen für die Sicherheit wichtig?

**Aufgabe 3 (leicht).** Welche zwei Protokollversionen sollte ein Server heute anbieten? Schreiben Sie die passende Zeile für Apache und für Nginx.

**Aufgabe 4 (mittel).** Ein Browser am Arbeitsplatz öffnet Ihre Website ohne Warnung, ein Programm eines Kunden meldet „unable to verify the first certificate“. Nennen Sie die wahrscheinliche Ursache, erklären Sie, warum der Browser keinen Fehler zeigt, und beschreiben Sie die Korrektur für Nginx und für Apache.

**Aufgabe 5 (mittel).** Bei einer Nginx-Website mit einem Zertifikat von Let’s Encrypt steht im Fehlerlog immer wieder `"ssl_stapling" ignored, no OCSP responder URL in the certificate`. Was bedeutet das, ist es ein Fehler, und was tun Sie?

**Aufgabe 6 (praktisch).** Erzeugen Sie mit `openssl` eine Test-CA und ein Server-Zertifikat für `test.example` und `www.test.example` (mit SAN, 30 Tage). Prüfen Sie Betreff, Aussteller, Gültigkeit und Namen mit `openssl x509`, und prüfen Sie mit `openssl verify`, dass die Kette stimmt und dass das Zertifikat zu einem Zeitpunkt in der Zukunft als abgelaufen gemeldet wird.

**Aufgabe 7 (praktisch).** Richten Sie eine Nginx-Testinstanz auf Port 8443 mit HTTPS ein: Zertifikat samt Kette, nur TLS 1.2 und 1.3, eine ECDHE-Cipher-Liste, HSTS, Session-Cache und `http2`. Beweisen Sie mit `curl` das HTTPS-Ergebnis, die Protokollversion HTTP/2, den HSTS-Header und mit `openssl s_client -tls1_2` und `-tls1_3` die beiden Versionen.

**Aufgabe 8 (praktisch).** Richten Sie dieselbe Website mit Apache (Port 8446) ein. Prüfen Sie, wie sich `apachectl -t` verhält, wenn der private Schlüssel nicht zum Zertifikat passt, und vergleichen Sie es mit dem Verhalten von Nginx.

**Aufgabe 9 (praktisch).** Schreiben Sie ein Skript, das für eine Liste von Hosts (eine Datei mit `host:port` je Zeile) die Restlaufzeit der Zertifikate in Tagen ausgibt und mit Exit-Status 2 endet, wenn eines unter 14 Tagen liegt. Hosts, die nicht antworten, sollen als Fehler gemeldet werden, ohne das Skript abzubrechen.

**Aufgabe 10 (schwer).** Ein Nginx-Server bedient `a.example` (Standardserver) und `b.example` auf demselben Port 443. In `a.example` steht `ssl_protocols TLSv1.3;`, in `b.example` `ssl_protocols TLSv1.2 TLSv1.3;`. Ein Altgerät, das nur TLS 1.2 kann, soll `b.example` erreichen, scheitert aber. (a) Erklären Sie das Verhalten. (b) Entwerfen Sie zwei Lösungen. (c) Sie sollen zusätzlich HTTP/3 einführen: Nennen Sie die nötigen Konfigurationsteile, die Voraussetzungen an Nginx und die Firewall und beschreiben Sie, woran Sie im Betrieb erkennen, ob Besucher HTTP/3 nutzen.

## Lösungen und Erklärungen

### Lösung zu Aufgabe 1.

Ein Zertifikat ist eine von einer Zertifizierungsstelle signierte Bestätigung, dass ein öffentlicher Schlüssel zu einem bestimmten Namen gehört. Der private Schlüssel ist das geheime Gegenstück zum öffentlichen; wer ihn besitzt, kann sich als der Server ausgeben. Die Zertifizierungsstelle (CA) ist die vertrauenswürdige Stelle, die die Zertifikate signiert und deren Wurzel der Browser kennt. Der *private Schlüssel* darf den Server nie verlassen und braucht Rechte, die nur dem Besitzer (und dem Dienst beim Start) den Zugriff erlauben (`chmod 600`).

### Lösung zu Aufgabe 2.

`ECDHE` ist der Schlüsselaustausch mit elliptischen Kurven und flüchtigen Schlüsseln, `RSA` die Signatur des Servers (Art des Zertifikats), `AES128` die Chiffre mit 128 Bit, `GCM` der Betriebsmodus mit Authentisierung, `SHA256` der Hash (bei GCM für die Schlüsselableitung). `ECDHE` sorgt für *Forward Secrecy*: Jede Sitzung bekommt einen neuen Schlüssel, und selbst wenn später der private Serverschlüssel in fremde Hände gerät, lassen sich aufgezeichnete Sitzungen nicht entschlüsseln.

### Lösung zu Aufgabe 3.

TLS 1.2 und TLS 1.3. Apache: `SSLProtocol -all +TLSv1.2 +TLSv1.3`. Nginx: `ssl_protocols TLSv1.2 TLSv1.3;`. Beide Zeilen wurden in der Testumgebung geprüft. Die ausdrückliche Liste ist besser als `SSLProtocol all -SSLv3`, weil `all` je nach Version mehr zulässt als gewünscht.

### Lösung zu Aufgabe 4.

Wahrscheinliche Ursache: Das Zwischenzertifikat fehlt in der Kette, die der Server mitschickt. Der Browser am Arbeitsplatz hat es entweder gespeichert oder lädt es über die Angabe im Zertifikat selbst nach; das Programm des Kunden tut das nicht und kann die Kette zur Wurzel nicht schließen (Meldung `unable to verify the first certificate`). Korrektur Nginx: Zwischenzertifikat hinter das Server-Zertifikat in dieselbe Datei kopieren (`cat server.crt zwischen.crt > chain.crt`) und diese Datei bei `ssl_certificate` angeben, dann `nginx -t` und `nginx -s reload`. Korrektur Apache: Das Zwischenzertifikat steht nach dem Kenntnisstand des Autors ab Version 2.4.8 ebenfalls in `SSLCertificateFile` hinter dem Server-Zertifikat (ältere Versionen kennen die Direktive `SSLCertificateChainFile`). Prüfung: `openssl s_client -connect host:443 -servername host` muss in der Kette beide Ebenen zeigen und mit der richtigen CA `Verification: OK` melden. In der Testumgebung zeigte die Kette ohne `ca.crt` nur Ebene 0 und den Fehler `unable to verify the first certificate`.

### Lösung zu Aufgabe 5.

Die Meldung heißt, dass das Zertifikat keine Adresse eines OCSP-Responders enthält, und Nginx deshalb das Stapling nicht benutzt. Das ist kein Fehler im Betrieb: Die Website läuft, nur ohne gestapelte Statusantwort. Hintergrund: Let’s Encrypt hat laut seiner Ankündigung vom 5. 12. 2024 die OCSP-Unterstützung beendet (OCSP-Adressen entfielen ab dem 7. 5. 2025 aus den Zertifikaten, die Responder wurden am 6. 8. 2025 abgeschaltet; Sperrinformationen laufen über CRLs). Konsequenz: Die Direktiven `ssl_stapling on;`, `ssl_stapling_verify on;` und `resolver` entfernen (oder bewusst belassen und die Warnung ausfiltern), damit das Fehlerlog frei von Dauerwarnungen bleibt. Das Ergebnis lässt sich mit `openssl x509 -noout -ocsp_uri -in cert.pem` prüfen: Eine leere Ausgabe bestätigt, dass das Zertifikat keine OCSP-Adresse trägt.

### Lösung zu Aufgabe 6.

Befehle (in der Testumgebung ausgeführt):

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout ca.key -out ca.crt \
    -days 30 -subj "/CN=Test CA"
openssl req -newkey rsa:2048 -nodes -keyout srv.key -out srv.csr \
    -subj "/CN=test.example" \
    -addext "subjectAltName=DNS:test.example,DNS:www.test.example"
printf "subjectAltName=DNS:test.example,DNS:www.test.example\nextendedKeyUsage=serverAuth\n" > ext.cnf
openssl x509 -req -in srv.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out srv.crt -days 30 -extfile ext.cnf

openssl x509 -in srv.crt -noout -subject -issuer -dates -ext subjectAltName
openssl verify -CAfile ca.crt srv.crt
openssl verify -CAfile ca.crt -attime 4102444800 srv.crt
```

Die Anzeige liefert Betreff `CN = test.example`, Aussteller `CN = Test CA`, die Gültigkeit und beide Namen im SAN. `openssl verify` meldet `srv.crt: OK`; mit `-attime 4102444800` (ein Zeitpunkt im Jahr 2100) lautet die Meldung `error 10 at 0 depth lookup: certificate has expired`. Wichtig: Der Name muss im SAN stehen, nicht nur im `CN`, weil Browser nur das SAN prüfen.

### Lösung zu Aufgabe 7.

Konfiguration (geprüft, Nginx 1.24.0):

```nginx
events {}
http {
    server {
        listen 8443 ssl http2;
        server_name test.example;
        ssl_certificate     /tmp/m6/chain.crt;
        ssl_certificate_key /tmp/m6/srv.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE+AESGCM:ECDHE+CHACHA20;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        location / { return 200 "TLS ok $ssl_protocol $ssl_cipher $server_protocol\n"; }
    }
}
```

Prüfung: `curl --cacert ca.crt --resolve test.example:8443:127.0.0.1 https://test.example:8443/` liefert `TLS ok TLSv1.3 TLS_AES_256_GCM_SHA384 HTTP/2.0`. Mit `curl -I --http2 ...` erscheinen `HTTP/2 200` und `strict-transport-security: max-age=31536000; includeSubDomains`. `openssl s_client -connect 127.0.0.1:8443 -tls1_2` und `-tls1_3` verbinden beide (`ECDHE-RSA-AES256-GCM-SHA384` bei 1.2). Hinweis: Befindet sich in Ihrer Umgebung ein Proxy, fügen Sie `--noproxy '*'` bei curl hinzu, sonst läuft die Anfrage nicht über die lokale Adresse.

### Lösung zu Aufgabe 8.

Die Apache-Konfiguration entspricht dem Beispiel aus Einheit 6.1, ergänzt um `Protocols h2 http/1.1`, `SSLProtocol -all +TLSv1.2 +TLSv1.3`, `SSLCipherSuite ECDHE+AESGCM:ECDHE+CHACHA20` und den `Header always set`-Eintrag. Passt der Schlüssel nicht zum Zertifikat (hier `other.key` statt `srv.key`), meldet `apache2 -t` dennoch `Syntax OK`; erst der Start scheitert mit `AH02565: Certificate and private key test.example:443:0 from ... and ... do not match` und `AH00016: Configuration Failed`. Fehlt die Zertifikatsdatei, meldet schon der Test `SSLCertificateFile: file '...' does not exist or is empty`. Nginx dagegen entdeckt den unpassenden Schlüssel schon beim Test (`nginx -t`: `SSL_CTX_use_PrivateKey(...) failed (SSL: error:05800074:x509 certificate routines::key values mismatch)`). Folge für Apache: Vor einem Neustart immer auf einer Ersatzinstanz probestarten oder Zertifikat und Schlüssel mit den Modulus-Werten vergleichen.

### Lösung zu Aufgabe 9.

Eine mögliche Lösung:

```bash
#!/bin/bash
# zert-laufzeit.sh -- Restlaufzeit der Zertifikate aus einer Hostliste
LISTE="${1:?Aufruf: $0 hostliste.txt}"
rc=0
while IFS=: read -r host port; do
    [ -z "$host" ] && continue
    port="${port:-443}"
    ende=$(echo | timeout 10 openssl s_client -connect "$host:$port" \
        -servername "$host" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    if [ -z "$ende" ]; then
        echo "FEHLER  $host:$port  keine Antwort"; [ "$rc" -lt 1 ] && rc=1; continue
    fi
    tage=$(( ( $(date -d "$ende" +%s) - $(date +%s) ) / 86400 ))
    if [ "$tage" -lt 14 ]; then echo "WARNUNG $host:$port  noch $tage Tage"; rc=2
    else echo "ok      $host:$port  noch $tage Tage"; fi
done < "$LISTE"
exit $rc
```

Die Schleife liest `host:port` zeilenweise (`IFS=:`); ein fehlender Port wird zu 443. `timeout 10` verhindert, dass ein nicht antwortender Host das Skript blockiert. Fehlt ein Ablaufdatum, wird der Host als FEHLER gemeldet, und die Schleife geht weiter (`continue`). Der Rückgabewert 2 (Ablauf nahe) hat Vorrang vor 1 (Fehler); die Zeile `[ "$rc" -lt 1 ] && rc=1` sorgt dafür, dass ein späterer Fehler einen früheren Rückgabewert 2 nicht überschreibt. Das entspricht der Logik von `tls-check.sh` aus Einheit 6.8, erweitert auf mehrere Hosts. Geprüft wurden im Test nur die Bausteine (Abfrage von `enddate` und Tagesrechnung), nicht die gesamte Schleife.

### Lösung zu Aufgabe 10.

\(a\) Die Protokollversion wird im Handshake ausgehandelt, bevor der Server den Namen aus SNI zuordnet. Nginx liest die Einstellung deshalb vom *Standardserver* der Adresse und des Ports; `ssl_protocols` in `b.example` wirkt nicht. In der Testumgebung scheiterte `-tls1_2` mit `tlsv1 alert protocol version` für beide Namen, auch für `b.example`. (b) Lösung 1: einheitlich TLS 1.2 und 1.3 im `http`-Block erlauben und `TLSv1.3`-Einschränkungen entfernen (das Altgerät kann dann beide Websites erreichen; es gilt aber auch für `a.example`). Lösung 2: `b.example` auf eine andere IP-Adresse oder einen anderen Port legen (`listen 192.0.2.20:443 ssl;`), damit es einen eigenen Standardserver mit eigener Protokollliste bekommt. Welche Lösung passt, ist eine Sicherheitsabwägung: Lösung 1 senkt die Anforderung für beide, Lösung 2 trennt sie auf. (c) HTTP/3 braucht (nach der Nginx-Dokumentation, abgerufen am 31.10.2026) Nginx ab 1.25.0 mit `--with-http_v3_module` (in den Linux-Binärpaketen enthalten) und eine SSL-Bibliothek mit QUIC-Unterstützung, außerdem TLS 1.3. Konfiguration: `listen 443 quic reuseport;` neben `listen 443 ssl;` und der Header `Alt-Svc 'h3=":443"; ma=86400'` (zu Beginn mit kurzer `ma`-Zeit). Die Firewall muss UDP 443 freigeben. Erkennbar ist die Nutzung an der Variablen `$http3` im Zugriffslog (`h3` bei HTTP/3, sonst leer) und an Browser-Entwicklerwerkzeugen, die das Protokoll `h3` anzeigen. Das Beispiel wurde nicht ausgeführt, weil die Testumgebung mit Nginx 1.24.0 QUIC nicht kennt.
