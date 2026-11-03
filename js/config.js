/**
 * Zentrale Konfiguration. Hier lassen sich Name, Branding, Farben,
 * Zahlenbereich, Schwierigkeitsgrad und Ton an einer Stelle ändern.
 * Keine Abhängigkeiten, kein Build-Schritt.
 */
window.ZAHLENFREUNDE_CONFIG = {
  appTitle: 'Zahlenfreunde',
  brand: {
    name: 'Tick, Trick & Track', // z. B. 'Mama, Kind 1 & Kind 2'
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
  numbers: {
    min: 1,
    max: 10
  },
  difficulty: {
    sortingInitial: 3,
    sortingMax: 5
  },
  audio: {
    muted: false,
    language: 'de-DE',
    rate: 0.88,
    pitch: 1.04,
    volume: 0.95,
    /*
     * Optional später durch lokale Dateien ergänzen, beispielsweise:
     * recordings: { 'number-1': './assets/audio/eins.mp3' }
     * Bleibt ein Eintrag leer, übernimmt die Web Speech API.
     */
    recordings: {}
  }
};
