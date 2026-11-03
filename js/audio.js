/**
 * Austauschbare Audio-Schicht für Zahlenfreunde.
 * - Standard: deutsche Browser-Sprachausgabe (wenn vorhanden).
 * - Optional: lokale Aufnahmen über config.audio.recordings.
 * - Klänge: lokal mit Web Audio erzeugt, ohne heruntergeladene Dateien.
 * - Bei jedem neuen Ton wird vorher alles Laufende beendet.
 */
(function () {
  'use strict';

  class ZahlenAudio {
    constructor(options) {
      this.options = options || {};
      this.muted = Boolean(this.options.muted);
      this.context = null;
      this.activeOscillators = [];
      this.activeRecording = null;
      this.voice = null;
      this.loadVoices();

      if ('speechSynthesis' in window) {
        window.speechSynthesis.addEventListener?.('voiceschanged', () => this.loadVoices());
      }
    }

    loadVoices() {
      if (!('speechSynthesis' in window)) return;
      const voices = window.speechSynthesis.getVoices();
      const language = String(this.options.language || 'de-DE').toLowerCase();
      const german = voices.filter((voice) => voice.lang.toLowerCase().startsWith('de'));
      // Eine passende, lokal vorhandene Stimme bevorzugen. Es wird nichts nachgeladen.
      this.voice = german.find((voice) => voice.lang.toLowerCase() === language && voice.localService)
        || german.find((voice) => voice.lang.toLowerCase() === language)
        || german.find((voice) => voice.localService)
        || german[0]
        || null;
    }

    setMuted(muted) {
      this.muted = Boolean(muted);
      if (this.muted) this.stop();
    }

    stop() {
      if (this.activeRecording) {
        this.activeRecording.pause();
        this.activeRecording.removeAttribute('src');
        this.activeRecording.load();
        this.activeRecording = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      this.activeOscillators.forEach((osc) => {
        try { osc.stop(); } catch (_) { /* bereits beendet */ }
        try { osc.disconnect(); } catch (_) { /* bereits getrennt */ }
      });
      this.activeOscillators = [];
    }

    speakNumber(number) {
      const words = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'];
      const text = words[number] || String(number);
      this.speak(text, `number-${number}`);
    }

    speak(text, recordingKey) {
      this.stop();
      if (this.muted) return;

      const recording = this.options.recordings?.[recordingKey];
      if (typeof recording === 'string' && recording.trim()) {
        // Erlaubt nur relative URLs derselben App: keine externen Audio-Dienste.
        try {
          const url = new URL(recording, document.baseURI);
          if (url.origin === window.location.origin) {
            const element = new Audio(url.href);
            this.activeRecording = element;
            element.onended = () => {
              if (this.activeRecording === element) this.activeRecording = null;
            };
            element.onerror = () => {
              if (this.activeRecording === element) {
                this.activeRecording = null;
                this.speakWithBrowser(text);
              }
            };
            const play = element.play();
            if (play?.catch) play.catch(() => {
              if (this.activeRecording === element) {
                this.activeRecording = null;
                this.speakWithBrowser(text);
              }
            });
            return;
          }
        } catch (_) { /* fehlerhafte Datei: Browser-Stimme als Ersatz */ }
      }
      this.speakWithBrowser(text);
    }

    speakWithBrowser(text) {
      if (this.muted || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
      // Auch bei schnellem Tippen darf kein zweiter Satz überlagert werden.
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.options.language || 'de-DE';
      if (!this.voice) this.loadVoices();
      if (this.voice) utterance.voice = this.voice;
      utterance.rate = Number(this.options.rate) || 0.88;
      utterance.pitch = Number(this.options.pitch) || 1.04;
      utterance.volume = Number.isFinite(this.options.volume) ? this.options.volume : 0.95;
      try { window.speechSynthesis.speak(utterance); } catch (_) { /* visuelles Spiel bleibt verfügbar */ }
    }

    celebrate() {
      this.stop();
      if (this.muted) return;
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      try {
        if (!this.context) this.context = new Context();
        if (this.context.state === 'suspended') this.context.resume().catch(() => {});
        const start = this.context.currentTime + 0.01;
        // Kurzer, leiser Zweiklang statt lauter Belohnungsgeräusche.
        [[523.25, 0], [659.25, 0.14], [783.99, 0.29]].forEach(([frequency, offset]) => {
          const osc = this.context.createOscillator();
          const gain = this.context.createGain();
          osc.type = 'sine';
          osc.frequency.value = frequency;
          gain.gain.setValueAtTime(0.0001, start + offset);
          gain.gain.exponentialRampToValueAtTime(0.055, start + offset + 0.035);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.25);
          osc.connect(gain);
          gain.connect(this.context.destination);
          osc.start(start + offset);
          osc.stop(start + offset + 0.26);
          this.activeOscillators.push(osc);
          osc.onended = () => {
            const index = this.activeOscillators.indexOf(osc);
            if (index !== -1) this.activeOscillators.splice(index, 1);
            osc.disconnect();
            gain.disconnect();
          };
        });
      } catch (_) { /* Ohne Web Audio bleiben alle Spiele bedienbar. */ }
    }
  }

  window.ZahlenAudio = ZahlenAudio;
})();
