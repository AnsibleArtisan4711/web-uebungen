<?php
// Vorlage für die Einstellungen. Kopiere diese Datei nach config.php und passe sie an.
// config.php enthält deine echte Adresse und gehört NICHT ins Repository (steht in der .gitignore).
declare(strict_types=1);

return [
    'empfaenger' => 'kontakt@example.com',   // Hierhin gehen die Nachrichten (Platzhalter!)
    'absender' => 'formular@example.com',    // Adresse deiner eigenen Domain (Platzhalter!)
    'danke_url' => '/kontakt/danke/',        // Hierhin geht es nach erfolgreichem Senden
    'max_pro_stunde' => 20,                  // Grenzwert gegen Missbrauch, insgesamt und ohne IP-Adressen
    'zustand_datei' => sys_get_temp_dir() . '/kontakt-zustand.json',
    'testmodus' => false,                    // true nur lokal: schreibt in testdatei statt zu senden
    'testdatei' => sys_get_temp_dir() . '/kontakt-test-postfach.txt',
];
