# Zahlenfreunde

**Zahlenfreunde** ist eine vollständig spielbare, werbefreie Zahlen-App für Kinder von ca. **2 bis 5 Jahren** – aus der Sammlung **„Tick, Trick & Track“**. Kinder brauchen weder Konto noch Lesekenntnisse. Die App hat keine Zeitlimits, keine Punkte und keine Bestrafung bei Fehlern.

Die App besteht nur aus **HTML, CSS und Vanilla JavaScript**. Es gibt keine Frameworks, keinen Build-Prozess, keine CDNs, keine Tracker, keine Cookies und keine externen Dienste für die Spielmechanik.

## Inhalt

- **Zahlen entdecken:** Zahlen von 1 bis 10 antippen, vorlesen lassen und Gegenstände einzeln mitzählen.
- **Wie viele sind das?:** 1 bis 10 Gegenstände zählen und aus drei großen Zahlen auswählen. Sanfte Hinweise, beliebig viele Versuche und positives Feedback.
- **Zahlen sortieren:** Durcheinandergewürfelte Zahlen in aufsteigender Reihenfolge antippen. Per Schaltfläche von 3 auf 4 bzw. 5 Zahlen wechseln.
- **Zähl mit!:** Kleine Szenen mit Schmetterlingen, Enten, Pilzen, Blumen, Marienkäfern oder Fröschen. Die Gegenstände einzeln oder über „Weiterzählen“ markieren und zählen.

Alle Spiele funktionieren mit Maus, Touch und Tastatur. Bei aktivierter, vorhandener deutscher Browser-Stimme werden Zahlen vorgelesen. Über den großen Lautsprecherknopf kann der Ton jederzeit ausgeschaltet werden.

## Projektstruktur

```text
zahlenfreunde/
├── index.html                 Startseite und App-Rahmen
├── manifest.webmanifest       PWA-Metadaten
├── sw.js                      Service Worker / Offline-Cache
├── .nojekyll                  GitHub Pages ohne Jekyll-Verarbeitung
├── css/
│   └── styles.css             Layout, Farben, Animationen, Responsive-Design
├── js/
│   ├── config.js              Zentrale Konfiguration
│   ├── audio.js               Austauschbare Sprachausgabe und Klänge
│   └── app.js                 Spielzustände, vier Modi, Interaktionen
├── assets/
│   ├── favicon.svg
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

## Lokal starten

1. ZIP-Datei entpacken.
2. Für einen ersten Funktionstest `index.html` in einem Browser öffnen. Die Spiele funktionieren bereits so.
3. **Für PWA und Offline-Modus** die Dateien über `localhost` oder HTTPS aufrufen. Beispielsweise im Ordner `zahlenfreunde`:

   ```bash
   python3 -m http.server 8000
   ```

4. Im Browser `http://localhost:8000/` aufrufen. Nach dem ersten vollständigen Laden und der Installation des Service Workers kann die Anwendung ohne Netzverbindung erneut geöffnet werden.

Auch `npx serve` oder ein anderer lokaler statischer Webserver ist möglich, aber **nicht erforderlich**. Der Befehl mit Python startet nur einen lokalen Server; die App selbst hat keine Python-Abhängigkeit.

> **Hinweis:** Browser dürfen Service Worker aus Sicherheitsgründen nicht unter `file://` registrieren. Das betrifft nur die Installierbarkeit/Offline-Speicherung, nicht die vier Spielmodi.

## GitHub Pages: Schritt für Schritt

1. Bei GitHub anmelden und ein neues öffentliches Repository erstellen, z. B. `zahlenfreunde`.
2. Den **Inhalt** des Projektordners in das Repository-Stammverzeichnis hochladen. Wichtig: `index.html` soll direkt im Repository-Hauptverzeichnis liegen, nicht in einem zusätzlichen Unterordner `zahlenfreunde`.
3. Änderungen auf dem Branch `main` speichern (committen).
4. Im Repository **Settings → Pages → Build and deployment** öffnen.
5. Unter **Source** `Deploy from a branch` wählen; als **Branch** `main` und als **Folder** `/ (root)` festlegen, dann **Save**.
6. Sobald die Veröffentlichung abgeschlossen ist, die angezeigte URL öffnen, normalerweise:

   `https://BENUTZERNAME.github.io/zahlenfreunde/`

7. Die Seite einmal vollständig online laden. Danach ist die App über ihren Service Worker offline nutzbar. Auf unterstützten Smartphones kann sie über das Browsermenü **Zum Startbildschirm hinzufügen** / **App installieren** installiert werden.

Alle Dateipfade sind relativ (`./...`) – deshalb funktioniert die App auch in einem GitHub-Pages-Unterverzeichnis. Ein eigener Server, API-Key oder Build-Schritt ist nicht nötig.

### Änderungen veröffentlichen

Bei jeder Änderung an Dateien im Offline-Cache in `sw.js` die Cache-Version erhöhen, z. B. von `zahlenfreunde-v1` auf `zahlenfreunde-v2`, und die neuen Dateien auf GitHub hochladen. Beim nächsten Online-Aufruf installiert der Browser die aktuelle Version. Für einen kontrollierten Test nach dem Update kann man die Seite neu laden. Keine Cache-Einstellungen im Repository nötig.

## Zentral konfigurieren

Alle zentralen Einstellungen stehen in **`js/config.js`**:

```js
window.ZAHLENFREUNDE_CONFIG = {
  appTitle: 'Zahlenfreunde',
  brand: {
    name: 'Tick, Trick & Track',
    tagline: 'Kleine Spiele, großes Staunen'
  },
  colors: {
    primary: '#6BAA86',
    primaryDark: '#36765B',
    background: '#F4F9F1',
    ink: '#29483C',
    peach: '#FFE2CC',
    lavender: '#E9E0FA',
    sky: '#DEF0FF',
    yellow: '#FFF1BE'
  },
  numbers: { min: 1, max: 10 },
  difficulty: { sortingInitial: 3, sortingMax: 5 },
  audio: {
    muted: false,
    language: 'de-DE',
    rate: 0.88,
    pitch: 1.04,
    volume: 0.95,
    recordings: {}
  }
};
```

**Branding ändern:** Für „Mama, Kind 1 & Kind 2“ genügt die Änderung von `brand.name` in `js/config.js`. Kopfzeile, Seitentitel und Fußzeile übernehmen den neuen Namen automatisch. Für einen anderen App-Titel `appTitle` ändern; falls dieser Titel auch unter dem installierten App-Symbol angezeigt werden soll, zusätzlich `name` und `short_name` in `manifest.webmanifest` sowie den statischen `apple-mobile-web-app-title` in `index.html` anpassen.

**Zahlenbereich ändern:** `numbers.min` und `numbers.max` anpassen. Für die gewünschte Zielgruppe sind 1 bis 10 voreingestellt. Bei einem Bereich mit weniger als drei Zahlen zeigt das Ratespiel entsprechend weniger Antwortmöglichkeiten. Die Sortierstufen werden an den verfügbaren Bereich angepasst.

**Schwierigkeit ändern:** `difficulty.sortingInitial` definiert die Anfangszahl der Sortierkacheln; `difficulty.sortingMax` die höchste auswählbare Stufe. Voreinstellung 3 bis 5. Die Kinder können die Stufe selbst ändern.

**Farben ändern:** Werte im Abschnitt `colors` als Hexfarben angeben. Sie werden beim Start als CSS-Variablen gesetzt.

**Ton ausschalten:** `audio.muted: true` stellt die App initial stumm. Das Kind kann den Ton im Spiel selbst umschalten. Es wird keine Einstellung im Browser gespeichert.

## Eigene Sprachaufnahmen ergänzen

Die Audio-Schicht in `js/audio.js` unterstützt bereits lokale Aufnahmen. Beispielsweise:

1. MP3-Dateien nach `assets/audio/` legen.
2. `recordings` in `js/config.js` ergänzen:

   ```js
   recordings: {
     'number-1': './assets/audio/eins.mp3',
     'number-2': './assets/audio/zwei.mp3',
     'number-3': './assets/audio/drei.mp3'
   }
   ```

3. Damit **neue** Aufnahmen direkt nach der ersten Installation offline sind, diese Dateien auch in der Liste `APP_FILES` in `sw.js` ergänzen und die Cache-Version erhöhen. Andernfalls werden sie erst nach dem ersten Abspielen zwischengespeichert.

Die Schlüssel `number-1` bis `number-10` (bzw. darüber hinaus bei größerem Zahlenbereich) werden von allen Spielmodi genutzt. Ist eine Datei nicht konfiguriert oder lässt sie sich nicht abspielen, wird die Web Speech API verwendet. **Externe Audio-URLs werden bewusst nicht unterstützt.**

Die Web Speech API ist abhängig von Browser, Betriebssystem und installierten Stimmen. Manche Geräte bieten keine deutsche Offline-Stimme oder verwenden für die Synthese einen Online-Dienst des Systems. Die **Spiele selbst bleiben offline ohne Tonausgabe spielbar**. Für garantiertes, geräteunabhängiges Offline-Audio sollten eigene lokale Sprachdateien für alle gewünschten Zahlen hinterlegt und in `APP_FILES` aufgenommen werden. Es wird kein Ton automatisch beim Seitenaufruf abgespielt.

## Datenschutz & kindgerechtes Verhalten

- Keine Werbung, Analytics, Tracker, Konten, Cookies oder externen API-Aufrufe durch den App-Code.
- Keine personenbezogenen Daten, kein lokales Speichern des Spielstands oder von Einstellungen.
- Keine Zeitlimits, Erfolgsserien, Punkte, Strafsounds oder aufdringlichen Dialoge.
- Beim schnellen Tippen stoppt die Audio-Schicht laufende Ansagen/Klänge, bevor neue beginnen.
- Große Bedienelemente, gut sichtbarer Zurück-Button, beschriftete native Buttons und ein Modus für reduzierte Animationen (`prefers-reduced-motion`).
- Die Emoji-Darstellung hängt von den auf dem Gerät installierten System-Schriften ab; es werden keine Online-Bilder geladen.

## Manuell prüfen

1. **Entdecken:** Alle Zahlen 1–10 öffnen, Vorlesen starten, jedes Objekt einzeln tippen, zur Zahlenübersicht und Startseite zurückkehren.
2. **Rate-Spiel:** Falsche Antwort auswählen, sanften Hinweis sehen, danach richtig antworten und eine neue Runde starten.
3. **Sortieren:** Bei 3, 4 und 5 Zahlen eine falsche und danach die richtige Reihenfolge antippen.
4. **Zähl mit!:** Szeneobjekte einzeln und über „Weiterzählen“ zählen; danach „Neue Szene“.
5. **Ton:** Während einer Ansage stummschalten und schnell hintereinander tippen.
6. **Mobile:** Bei 320–430 px Bildschirmbreite testen, auch im Querformat.
7. **Offline:** Auf `localhost` oder HTTPS laden, warten bis im Fußbereich „Auch offline spielbar“ erscheint, Netzwerk im Browser deaktivieren und Seite neu laden.

## Lizenzhinweis

Es werden ausschließlich selbst erstellter Quellcode, systemeigene Emoji und selbst erzeugte App-Symbole verwendet. Es werden keine fremden Schrift-, Audio-, Bild- oder JavaScript-Dateien eingebunden.
