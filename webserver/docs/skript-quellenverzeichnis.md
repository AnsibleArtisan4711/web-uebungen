# Quellenverzeichnis

> **Hinweis:** Teil des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt. Die Kapitel zu den Modulen stehen als `skript.md` in den Modulordnern.

Stand der Abrufe: 31.10.2026. Rechtliche Hinweise (keine Rechtsberatung) sind nur dort enthalten, wo Rechtliches vorkommt, etwa Datenschutz bei Client-Adressen in Modul 07; sobald Rechtliches vorkommt (etwa Datenschutz bei Logdateien), steht dort der Hinweis „keine Rechtsberatung“.

## Tatsächlich abgerufen

- Apache HTTP Server 2.4, Ankündigung (Spiegel): <https://apache.cs.utah.edu/httpd/Announcement2.4.html>. Aktuelle Version 2.4.69, veröffentlicht am 1.10.2026.

- nginx news 2026: <https://nginx.org/2026.html>. Stable 1.30.6 (14.10.2026) und Mainline 1.31.8 (21.10.2026).

- Apache event MPM: <https://httpd.apache.org/docs/mod/event.html>.

- Apache Multi-Processing Modules: <https://httpd.apache.org/docs/mpm.html>.

- Apache Dynamic Shared Objects: <https://httpd.apache.org/docs-2.4/dso.html>.

- Apache Kompilieren und Installieren: <https://httpd.apache.org/docs/install.html>.

- Apache .htaccess-Howto: <https://httpd.apache.org/docs-2.4/howto/htaccess.html>.

- Apache namensbasierte Virtual Hosts: <https://httpd.apache.org/docs/vhosts/name-based.html>.

- Nginx Beginner’s Guide: <https://nginx.org/docs/beginners_guide.html>.

- Nginx, wie Anfragen bearbeitet werden: <https://nginx.org/docs/http/request_processing.html>.

- F5 NGINX Plus, Modellvergleich: <https://www.f5.com/products/nginx/nginx-plus/compare-models>.

- NGINX Open Source installieren: <https://docs.nginx.com/nginx/admin-guide/installing-nginx/installing-nginx-open-source/> (nur die ersten 100 000 von 103 713 Zeichen gelesen).

- Let’s Encrypt, Ende von OCSP: <https://letsencrypt.org/2024/12/05/ending-ocsp/>.

- Nginx QUIC und HTTP/3: <https://nginx.org/docs/quic.html> und <https://nginx.org/docs/http/ngx_http_v3_module.html>.

- Nginx HTTP/2-Modul: <https://nginx.org/docs/http/ngx_http_v2_module.html>.

- Apache HTTP/2-Howto: <https://httpd.apache.org/docs/current/howto/http2.html>.

- Mozilla Server Side TLS 4.0 (archiviert 2019, veraltet): <https://wiki.mozilla.org/Security/Archive/Server_Side_TLS_4.0>; die aktuelle Wiki-Seite verweist nur auf docs.tlsref.org, das nicht abrufbar war.

- Eigene Testläufe zu Modul 04 bis 07 (Apache 2.4.58, Nginx 1.24.0, OpenSSL 3.0.13, PHP 8.3.6 mit php-cgi statt php-fpm).

- Apache HTTP Server 2.4 Vulnerabilities: <https://httpd.apache.org/security/vulnerabilities_24.html> (die letzten 2 061 von 102 061 Zeichen nicht gelesen).

- OWASP HTTP Security Response Headers Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet>.

- README des nginx-prometheus-exporter: <https://github.com/nginxinc/nginx-prometheus-exporter/blob/main/README.md>.

- Eigene Testläufe zu Modul 08 bis 10 (Apache 2.4.58, Nginx 1.24.0; lokale Testserver und Test-Backends; Änderungsprotokolle der Ubuntu-Pakete `apache2` und `nginx`; für Modul 09 ein künstlich erzeugtes Zugriffsprotokoll).

- Eigene Testläufe Etappe 1 (Apache 2.4.58, Nginx 1.24.0 unter Ubuntu 24.04) sowie die Quelltext-Pakete beider Programme aus den Ubuntu-Paketquellen.

- Etappe 4 (Modul 11 bis 13), abgerufen am 31.10.2026: RFC 9111, HTTP Caching (<https://www.rfc-editor.org/rfc/rfc9111>; Abschnitte 3.5 und 7.3); Nginx-Dokumentation zum Modul `proxy` (nginx.org); Apache `mod_cache` (nur als japanische Übersetzung der Dokumentation); Apache MPM `event` (nur über eine Spiegelkopie einer Universität, daher mit Vorbehalt); Docker-Hub-Seite des offiziellen Nginx-Abbilds; README des `nginx-prometheus-exporter`; Kubernetes-Mitteilung vom 29.01.2026 zur Einstellung von Ingress NGINX; Google Open Source Blog (Februar 2026) zum selben Thema; Apache `upgrading.html` (httpd.apache.org/docs/current/); Nginx `control.html` (Signale, Binärwechsel); Nginx-Modul `http_v2` (`http2 on` ab 1.25.1); `nginx.org/2026.html` (Versionen) und die Schwachstellenübersicht des Apache-Projekts (Version 2.4.69).

- Eigene Testläufe zu Modul 11 bis 13 (Apache 2.4.58, Nginx 1.24.0, `ansible-core`, `ansible-lint`, `yamllint`, `gixy-ng`, `age`, `kubernetes-validate`). Nicht getestet: Docker-Build (kein Dienst), echtes CI-System, Kubernetes-Cluster, `worker_rlimit_nofile` (Sandbox). Die Nginx-Seite zu `mirror` war nicht abrufbar; die Aussagen dazu beruhen auf eigenem Test und Kenntnisstand.

- Etappe 5 (Modul 14), abgerufen am 31.10.2026: Ubuntu-Veröffentlichungszyklus (<https://ubuntu.com/about/release-cycle>; Supportzeiträume Ubuntu 24.04 LTS und 26.04 LTS); e-recht24.de, Seite zu Server-Logdateien (<https://www.e-recht24.de/dsg/12725-server-log-dateien.html>, Stand der Seite 24.03.2022; kommerzielles Informationsangebot, nur als Beispiel für einen Richtwert zur Speicherdauer, keine Rechtsberatung). Dazu die bereits oben genannten Seiten zu Kubernetes/Ingress NGINX und den Versionsständen.

- Eigene Testläufe zu Modul 14 (Apache 2.4.58 mit event und prefork, Nginx 1.24.0, `logrotate` 3.21.0, `tar`, `sha256sum`, `htpasswd`). Nicht getestet: verschlüsselte Sicherung, Apache-Neuöffnen der Protokolle, Anonymisierung bei Apache, IPv6 (Testumgebung ohne IPv6; die `map` wurde mit einem Kopf als Eingabe geprüft).

## Weiterführend (nicht abgerufen)

- Apache HTTP Server Dokumentation 2.4: <https://httpd.apache.org/docs/2.4/>.

- Nginx Dokumentation: <https://nginx.org/en/docs/>; darin die Seiten zu Steuerung und Signalen (<https://nginx.org/en/docs/control.html>) und zu `add_header` (<https://nginx.org/en/docs/http/ngx_http_headers_module.html>).

- RFC 9110, HTTP Semantics: <https://www.rfc-editor.org/rfc/rfc9110>.

- Nginx `mod_headers`-Gegenstück `add_header`, Apache `mod_dir` (FallbackResource), `mod_brotli`, `mod_proxy`-Dokumentation, Can I use, HSTS-Preload-Liste (hstspreload.org), RFC 8996, RFC 9113, RFC 6797, RFC 7239.

- Nginx Security Advisories: <https://nginx.org/en/security_advisories.html>; abgerufen wurde nur eine Spiegelkopie auf einer fremden Domain, daher hier nur als Hinweis. Ebenso nicht abgerufen: Apache-Exporter für Prometheus, Herstellerdokumentation zu NGINX Plus (health_check, sticky, slow_start), `mod_auth_openidc`, `mod_qos`, `mod_evasive`, fail2ban, unattended-upgrades; entsprechende Aussagen im Text beruhen auf dem Kenntnisstand des Autors und sind dort gekennzeichnet.

- Nicht verwendet: testssl.sh. Nicht ausgeführt: HTTP/3, Nginx `http2 on`, gRPC gegen echtes Backend.

- CIS Benchmarks (Härtungsleitfäden), <https://www.cisecurity.org/cis-benchmarks>.

- Etappe 4: Ansible-Dokumentation zu Rollen und Tresor, Kubernetes-Seite „Good practices for Secrets“, Gateway API, Open Policy Agent/Conftest, gitleaks, Trivy sowie die Debian-/Ubuntu-Dokumentation zu `apt` und Paketrückstufung. Alle nicht abgerufen; Aussagen dazu sind im Text als Kenntnisstand des Autors gekennzeichnet. Rechtliches (DSGVO bei gespiegelten Daten, Nachweispflichten): keine Rechtsberatung.

- Etappe 5: BSI IT-Grundschutz-Kompendium, Baustein APP.3.2 Webserver (<https://www.bsi.bund.de>), CIS Benchmarks für Apache und Nginx, ein Urteil des Bundesgerichtshofs zu Webserver-Logdateien (die Fundstelle war nicht abrufbar und wird nicht zitiert). Alle nicht abgerufen; Aussagen dazu sind im Text als Kenntnisstand des Autors gekennzeichnet. Rechtliches zu Protokollen und IP-Adressen: keine Rechtsberatung.
