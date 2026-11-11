# Einleitung

> **Hinweis:** Teil des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt. Die Kapitel zu den Modulen stehen als `skript.md` in den Modulordnern.

Dieses Skript begleitet den Lehrplan „Webserver Apache HTTP Server und Nginx“ und ist so geschrieben, dass man das Thema von Grund auf verstehen kann, ohne weitere Quellen zu brauchen. Jede Lerneinheit aus dem Blatt „Lehrplan in Details“ hat einen eigenen Abschnitt, in der Reihenfolge des Lehrplans. Jeder Abschnitt erklärt in zusammenhängender Prosa, was etwas ist, wozu man es braucht und wie es funktioniert, zeigt mindestens ein lauffähiges Beispiel, nennt typische Fehler mit einem Gegenbeispiel und schließt mit einem Praxisbezug. Am Ende jedes Moduls stehen Übungsaufgaben mit steigender Schwierigkeit, deren Lösungen mit Erklärung getrennt dahinter folgen.

### Aufbau der Module.

Jedes Modul beginnt mit Dauer, Priorität und der Tabelle seiner Lerneinheiten aus dem Lehrplan; die Stundensummen wurden gegen die Excel-Datei geprüft. Wo der Lehrplan sich überschneidet (zum Beispiel beim Request Processing von Apache und Nginx), wird das Thema dort ausführlich erklärt, wo es inhaltlich hingehört, und an der anderen Stelle darauf verwiesen.

### Farbige Boxen.

Drei Boxen ergänzen den Fließtext, ersetzen ihn aber nie. Die Box *Merke* fasst eine Kernaussage zusammen, die *grüne* Box *Ergänzung aus der Nachrecherche* kennzeichnet Inhalte, die über den knappen Lehrplan hinausgehen und aus Webrecherche oder eigenen Versuchen stammen, und die Box *Praxisbeispiel* zeigt, wo das Thema im echten Projekt begegnet.

### Testumgebung und Belege.

Alle Konfigurations- und Codebeispiele wurden in einer Linux-Umgebung (Ubuntu 24.04 mit Apache 2.4.58 und Nginx 1.24.0) tatsächlich ausgeführt; wo im Text „in der Testumgebung“ steht, handelt es sich um beobachtete Ausgaben. Nicht getestet wurden Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt; solche Stellen sind im Text als nicht getestet gekennzeichnet. Aktuelle Versionsangaben (Stand 31.10.2026) stammen aus den im Quellenverzeichnis als „tatsächlich abgerufen“ genannten Seiten.

> **Ergänzung aus der Nachrecherche: Grundlage dieses Skripts**
>
> Es lagen keine eigenen Kursunterlagen (.tex) vor. Der Inhalt beruht daher auf den Einträgen des Lehrplans, auf eigenen Versuchen und auf der Recherche in den genannten Dokumentationsseiten. Viele Lehrplaneinträge sind Platzhalter; die fachlich dazugehörenden Inhalte wurden aus dem Titel der Lerneinheit erschlossen.

### Stand.

Dieses Dokument enthält nach der fünften und letzten Etappe alle 14 Module des Lehrplans.
