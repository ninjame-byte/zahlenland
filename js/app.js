/**
 * Zahlenfreunde – vier vollständig spielbare, rein lokale Spielmodi.
 * Bedienung über native Buttons (Touch, Maus, Tastatur, Screenreader).
 */
(function () {
  'use strict';

  const config = window.ZAHLENFREUNDE_CONFIG;
  if (!config || !window.ZahlenAudio) {
    document.getElementById('app').textContent = 'Das Spiel konnte leider nicht geladen werden.';
    return;
  }

  const audio = new window.ZahlenAudio(config.audio);
  const app = document.getElementById('app');
  const soundToggle = document.getElementById('sound-toggle');
  const soundLabel = document.getElementById('sound-label');
  const min = Math.max(1, Math.round(Number(config.numbers.min) || 1));
  const max = Math.max(min, Math.round(Number(config.numbers.max) || 10));
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const maxSortLevel = Math.min(numbers.length, clamp(Number(config.difficulty.sortingMax) || 5, 3, 5));
  const minSortLevel = Math.min(3, maxSortLevel);

  const objects = [
    { emoji: '🍎', singular: 'Apfel', plural: 'Äpfel' },
    { emoji: '🐥', singular: 'Küken', plural: 'Küken' },
    { emoji: '🍓', singular: 'Erdbeere', plural: 'Erdbeeren' },
    { emoji: '🌼', singular: 'Blume', plural: 'Blumen' },
    { emoji: '🦋', singular: 'Schmetterling', plural: 'Schmetterlinge' },
    { emoji: '🍐', singular: 'Birne', plural: 'Birnen' },
    { emoji: '🐞', singular: 'Marienkäfer', plural: 'Marienkäfer' },
    { emoji: '⭐', singular: 'Stern', plural: 'Sterne' },
    { emoji: '🐸', singular: 'Frosch', plural: 'Frösche' },
    { emoji: '🧸', singular: 'Teddy', plural: 'Teddys' }
  ];

  const scenes = [
    { id: 'meadow', title: 'Auf der Blumenwiese', emoji: '🦋', singular: 'Schmetterling', plural: 'Schmetterlinge', count: 5 },
    { id: 'pond', title: 'Am kleinen Teich', emoji: '🦆', singular: 'Ente', plural: 'Enten', count: 4 },
    { id: 'forest', title: 'Im Zauberwald', emoji: '🍄', singular: 'Pilz', plural: 'Pilze', count: 7 },
    { id: 'garden', title: 'Im Sonnengarten', emoji: '🌻', singular: 'Blume', plural: 'Blumen', count: 8 },
    { id: 'meadow', title: 'Auf der grünen Wiese', emoji: '🐞', singular: 'Marienkäfer', plural: 'Marienkäfer', count: 6 },
    { id: 'pond', title: 'Am Seerosenteich', emoji: '🐸', singular: 'Frosch', plural: 'Frösche', count: 3 }
  ];

  const state = {
    screen: 'home',
    discover: { selected: null, touched: new Set() },
    quiz: { target: null, options: [], object: objects[0], solved: false, hint: false },
    sort: {
      level: clamp(Math.round(Number(config.difficulty.sortingInitial) || 3), minSortLevel, maxSortLevel),
      pool: [], picked: [], hint: false, completedRounds: 0
    },
    count: { scene: null, touched: new Set() }
  };

  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function randomInteger(low, high) { return Math.floor(Math.random() * (high - low + 1)) + low; }
  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = randomInteger(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  function a11yNumber(n) {
    const words = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'];
    return words[n] || String(n);
  }
  function colorSlot(n) { return ((n - 1) % 5) + 1; }
  function icon(name, size = 22) {
    const paths = {
      back: '<path d="M15 18l-6-6 6-6"/><path d="M9 12h12"/>',
      arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
      volume: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
      muted: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/>',
      refresh: '<path d="M20 7v5h-5"/><path d="M4.8 9A8 8 0 0 1 19 7l1 5M4 17v-5h5"/><path d="M19.2 15A8 8 0 0 1 5 17l-1-5"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      hand: '<path d="M8 13V6a2 2 0 0 1 4 0v5-1a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v4a5 5 0 0 1-5 5h-3a6 6 0 0 1-5-3L4 14a2 2 0 0 1 4-1Z"/>'
    };
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
  }

  function buddy(number, extraClass = '') {
    return `<span class="number-buddy ${extraClass} ${number >= 10 ? 'buddy-double' : ''} buddy-tone-${colorSlot(number)}" aria-hidden="true">
      <span class="buddy-digit">${number}</span>
      <span class="buddy-face"><span class="buddy-eye"></span><span class="buddy-eye"></span><span class="buddy-smile"></span></span>
    </span>`;
  }

  function initializeBrand() {
    const brand = config.brand || {};
    document.title = `${config.appTitle} | ${brand.name || ''}`;
    document.getElementById('brand-name').textContent = brand.name || '';
    document.getElementById('brand-tagline').textContent = brand.tagline || '';
    document.getElementById('footer-brand').textContent = `Ein Spiel von ${brand.name || config.appTitle}`;
    const keys = {
      primary: '--primary', primaryDark: '--primary-dark', background: '--page-bg', ink: '--ink',
      peach: '--peach', lavender: '--lavender', sky: '--sky', yellow: '--yellow'
    };
    Object.entries(keys).forEach(([key, variable]) => {
      const value = config.colors?.[key];
      if (typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value)) {
        document.documentElement.style.setProperty(variable, value);
      }
    });
    renderSoundButton();
  }

  function renderSoundButton() {
    const muted = audio.muted;
    soundToggle.setAttribute('aria-label', muted ? 'Ton einschalten' : 'Ton ausschalten');
    soundToggle.setAttribute('title', muted ? 'Ton einschalten' : 'Ton ausschalten');
    soundToggle.setAttribute('aria-pressed', String(muted));
    soundToggle.querySelector('svg').outerHTML = icon(muted ? 'muted' : 'volume', 26);
    soundLabel.textContent = muted ? 'Ton aus' : 'Ton an';
    soundToggle.classList.toggle('is-muted', muted);
  }

  function screenHeading(title, subtitle, backAction = 'home', decoration = '✦') {
    return `<div class="screen-heading">
      <button class="back-button" data-action="${backAction}" type="button">${icon('back', 25)}<span>Zurück</span></button>
      <div class="screen-title-area"><span class="section-sparkle" aria-hidden="true">${decoration}</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div>
      <span class="screen-heading-spacer" aria-hidden="true"></span>
    </div>`;
  }

  function renderHome() {
    const modes = [
      { action: 'discover', theme: 'mint', icon: '🔢', title: 'Zahlen entdecken', detail: 'Lerne 1 bis 10 kennen', pill: '1 2 3' },
      { action: 'quiz', theme: 'lilac', icon: '🍎', title: 'Wie viele sind das?', detail: 'Schau hin und zähle', pill: '? ? ?' },
      { action: 'sort', theme: 'peach', icon: '🧩', title: 'Zahlen sortieren', detail: 'Bring sie in die Reihe', pill: '1 → 2 → 3' },
      { action: 'count', theme: 'blue', icon: '🐞', title: 'Zähl mit!', detail: 'Entdecke kleine Welten', pill: '🌼 🌼 🌼' }
    ];
    return `<section class="hero" aria-labelledby="welcome-title">
      <div class="hero-copy">
        <span class="eyebrow"><span aria-hidden="true">✦</span> SPIELEND ZAHLEN LERNEN</span>
        <h1 id="welcome-title">Hallo, kleine <span>${escapeHtml(config.appTitle)}!</span></h1>
        <p>Hier macht Zählen richtig Spaß.</p>
        <span class="hero-chips" aria-label="Zahlen von eins bis zehn"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>…</span><span>10</span></span>
      </div>
      <div class="hero-illustration" aria-hidden="true">
        <span class="hero-star star-a">✦</span><span class="hero-star star-b">✧</span><span class="hero-star star-c">✦</span>
        <span class="hero-blob"></span>
        ${buddy(1, 'hero-buddy hero-buddy--one')}
        ${buddy(2, 'hero-buddy hero-buddy--two')}
        ${buddy(3, 'hero-buddy hero-buddy--three')}
        <span class="hero-ground"></span>
      </div>
    </section>
    <section class="mode-section" aria-labelledby="mode-title">
      <div class="mode-section-heading"><div><span class="mini-kicker">4 KLEINE ABENTEUER</span><h2 id="mode-title">Was spielen wir heute?</h2></div><span class="little-sun" aria-hidden="true">☀</span></div>
      <div class="mode-grid">${modes.map((mode) => `<button type="button" class="mode-card mode-card--${mode.theme}" data-action="open-mode" data-mode="${mode.action}" aria-label="${escapeHtml(mode.title)}. ${escapeHtml(mode.detail)}">
        <span class="mode-art" aria-hidden="true">${mode.icon}<span class="mode-art-sparkle">✦</span></span>
        <span class="mode-info"><span class="mode-title">${escapeHtml(mode.title)}</span><span class="mode-description">${escapeHtml(mode.detail)}</span><span class="mode-pill" aria-hidden="true">${mode.pill}</span></span>
        <span class="mode-arrow" aria-hidden="true">${icon('arrow', 24)}</span>
      </button>`).join('')}</div>
    </section>
    <p class="home-note"><span aria-hidden="true">♡</span> Ohne Zeitdruck. In deinem Tempo.</p>`;
  }

  function renderDiscover() {
    const n = state.discover.selected;
    if (n === null) {
      return `${screenHeading('Zahlen entdecken', 'Such dir eine Zahl aus!', 'home', '✿')}
        <section class="play-card numbers-overview" aria-label="Zahlen auswählen">
          <p class="card-eyebrow">TIPPE AUF EINE ZAHL</p>
          <div class="number-grid">${numbers.map((number) => `<button type="button" class="number-tile tile-tone-${colorSlot(number)}" data-action="select-number" data-number="${number}" aria-label="Zahl ${number} entdecken">${buddy(number, 'tile-buddy')}</button>`).join('')}</div>
        </section>`;
    }

    const item = objects[(n - 1) % objects.length];
    const touchedCount = state.discover.touched.size;
    const finished = touchedCount === n;
    return `${screenHeading('Zahlen entdecken', 'Tippe die Bilder einzeln an.', 'discover-list', '✿')}
      <section class="play-card discover-detail" aria-label="Die Zahl ${n} entdecken">
        <div class="discover-number-panel">
          <p class="card-eyebrow">DAS IST DIE ZAHL</p>
          ${buddy(n, 'discover-buddy')}
          <button class="speak-button" data-action="speak-current" type="button" aria-label="Zahl ${n} noch einmal anhören">${icon('volume', 27)}<span>Noch mal hören</span></button>
        </div>
        <div class="discover-objects-panel">
          <div class="object-heading"><div><span class="mini-kicker">ZÄHL MAL MIT</span><h2>${n} ${escapeHtml(n === 1 ? item.singular : item.plural)}</h2></div><span class="count-badge" aria-label="${touchedCount} von ${n} gezählt">${touchedCount} / ${n}</span></div>
          <div class="objects-grid objects-grid--discover">${Array.from({ length: n }, (_, index) => {
            const counted = state.discover.touched.has(index);
            return `<button type="button" data-action="count-discover" data-index="${index}" class="object-button ${counted ? 'is-counted' : ''}" aria-label="${escapeHtml(item.singular)} ${index + 1} ${counted ? 'bereits gezählt' : 'zählen'}" aria-pressed="${counted}"><span class="object-emoji" aria-hidden="true">${item.emoji}</span>${counted ? `<span class="object-check" aria-hidden="true">${icon('check', 17)}</span>` : ''}</button>`;
          }).join('')}</div>
          <p class="gentle-feedback ${finished ? 'finished' : ''}" role="status" aria-live="polite">${finished ? `✦ Hurra, alle ${n} gezählt!` : touchedCount ? `Du hast schon ${touchedCount} gezählt!` : 'Tippe auf jedes Bild und zähle mit.'}</p>
        </div>
      </section>
      <div class="navigation-bar">
        ${n > min ? `<button class="nav-number" data-action="select-number" data-number="${n - 1}" type="button">${icon('back', 20)} <span>${n - 1}</span></button>` : '<span></span>'}
        <button class="soft-button" data-action="discover-list" type="button">Alle Zahlen</button>
        ${n < max ? `<button class="nav-number" data-action="select-number" data-number="${n + 1}" type="button"><span>${n + 1}</span> ${icon('arrow', 20)}</button>` : '<span></span>'}
      </div>`;
  }

  function newQuiz() {
    const previous = state.quiz.target;
    const available = numbers.filter((n) => n !== previous);
    const target = available.length ? available[randomInteger(0, available.length - 1)] : numbers[0];
    const competitors = shuffle(numbers.filter((n) => n !== target)).sort((a, b) => {
      const distance = Math.abs(a - target) - Math.abs(b - target);
      return distance || 0;
    }).slice(0, 2);
    state.quiz = {
      target,
      options: shuffle([target, ...competitors]),
      object: objects[randomInteger(0, objects.length - 1)],
      solved: false,
      hint: false
    };
  }

  function confetti() {
    const colors = ['#86C7A2', '#E2B9E9', '#FFC69F', '#F7D77A', '#A8D9EE'];
    return `<div class="confetti" aria-hidden="true">${Array.from({ length: 22 }, (_, i) => `<span style="--i:${i};--x:${(i * 43) % 100}%;--delay:${(i % 7) * 0.08}s;--confetti-color:${colors[i % colors.length]}"></span>`).join('')}</div>`;
  }

  function renderQuiz() {
    const quiz = state.quiz;
    return `${screenHeading('Wie viele sind das?', 'Schau genau hin und tippe auf die Zahl.', 'home', '✦')}
      <section class="play-card quiz-card ${quiz.solved ? 'is-solved' : ''}" aria-label="Zählspiel">
        ${quiz.solved ? confetti() : ''}
        <div class="quiz-question"><span class="question-face" aria-hidden="true">🤔</span><div><span class="mini-kicker">SCHAU MAL GENAU</span><h2>Wie viele sind das?</h2></div></div>
        <div class="quiz-objects" role="img" aria-label="${quiz.target} ${escapeHtml(quiz.target === 1 ? quiz.object.singular : quiz.object.plural)}">${Array.from({ length: quiz.target }, () => `<span class="quiz-object" aria-hidden="true">${quiz.object.emoji}</span>`).join('')}</div>
        <p class="choice-title">Tippe auf die richtige Zahl:</p>
        <div class="answer-grid">${quiz.options.map((n) => `<button type="button" class="answer-button tile-tone-${colorSlot(n)} ${quiz.solved && n === quiz.target ? 'answer-correct' : ''}" data-action="quiz-answer" data-number="${n}" ${quiz.solved ? 'disabled' : ''} aria-label="Antwort ${n}"><span>${n}</span>${quiz.solved && n === quiz.target ? `<span class="answer-check" aria-hidden="true">${icon('check', 23)}</span>` : ''}</button>`).join('')}</div>
        <div class="quiz-feedback" role="status" aria-live="polite">${quiz.solved ? '<span class="success-face" aria-hidden="true">🌟</span><strong>Ja, wunderbar gezählt!</strong>' : quiz.hint ? '<span aria-hidden="true">🌼</span> Zähl die Bilder noch einmal.' : '<span aria-hidden="true">👆</span> Du kannst dir Zeit lassen.'}</div>
        ${quiz.solved ? `<button class="primary-button next-button" data-action="next-quiz" type="button">Weiter spielen ${icon('arrow', 25)}</button>` : ''}
      </section>`;
  }

  function newSortRound() {
    const amount = state.sort.level;
    const offset = randomInteger(0, Math.max(0, numbers.length - amount));
    const ordered = numbers.slice(offset, offset + amount);
    let scrambled = shuffle(ordered);
    if (ordered.length > 1 && scrambled.every((n, i) => n === ordered[i])) {
      scrambled = [scrambled[1], scrambled[0], ...scrambled.slice(2)];
    }
    state.sort.pool = scrambled;
    state.sort.picked = [];
    state.sort.hint = false;
  }

  function renderSort() {
    const sort = state.sort;
    const complete = sort.picked.length === sort.pool.length;
    const availableLevels = Array.from({ length: Math.max(1, maxSortLevel - minSortLevel + 1) }, (_, i) => minSortLevel + i);
    return `${screenHeading('Zahlen sortieren', 'Tippe die Zahlen der Reihe nach an.', 'home', '✳')}
      <section class="play-card sort-card ${complete ? 'is-solved' : ''}" aria-label="Zahlen der Reihe nach sortieren">
        <div class="sort-topline"><div><span class="mini-kicker">WIE VIELE ZAHLEN?</span><h2>Von klein nach groß</h2></div>
          <div class="level-switch" role="group" aria-label="Schwierigkeitsgrad wählen">${availableLevels.map((level) => `<button class="level-button ${sort.level === level ? 'active' : ''}" type="button" data-action="sort-level" data-level="${level}" aria-label="Mit ${level} Zahlen spielen" aria-pressed="${sort.level === level}">${level}</button>`).join('')}</div>
        </div>
        <div class="sort-instruction"><span aria-hidden="true">👆</span> Welche Zahl kommt zuerst?</div>
        <div class="sort-source" aria-label="Unsortierte Zahlen">${sort.pool.map((n) => {
          const taken = sort.picked.includes(n);
          return `<button type="button" class="sort-tile tile-tone-${colorSlot(n)} ${taken ? 'is-taken' : ''}" data-action="sort-pick" data-number="${n}" ${taken ? 'disabled' : ''} aria-label="Zahl ${n} ${taken ? 'bereits eingeordnet' : 'auswählen'}">${taken ? icon('check', 32) : n}</button>`;
        }).join('')}</div>
        <div class="sort-track" aria-label="Deine Zahlenreihe">${Array.from({ length: sort.level }, (_, i) => `<span class="sort-slot ${sort.picked[i] !== undefined ? 'filled' : ''}" aria-label="Platz ${i + 1}: ${sort.picked[i] ?? 'leer'}">${sort.picked[i] !== undefined ? sort.picked[i] : '<span class="empty-slot-dot">·</span>'}</span>`).join('<span class="sort-chevron" aria-hidden="true">›</span>')}</div>
        <div class="sort-feedback" role="status" aria-live="polite">${complete ? '<span aria-hidden="true">🌟</span><strong>Toll! Alles in der richtigen Reihe!</strong>' : sort.hint ? '<span aria-hidden="true">🌷</span> Suche die kleinste übrige Zahl.' : '<span aria-hidden="true">✨</span> Eine Zahl nach der anderen.'}</div>
        ${complete ? `<button class="primary-button next-button" type="button" data-action="sort-next">Noch eine Runde ${icon('arrow', 24)}</button>` : ''}
      </section>`;
  }

  function availableScenes() {
    const valid = scenes.filter((scene) => scene.count >= min && scene.count <= max);
    // Auch bei angepasstem Zahlenbereich stehen spielbare Szenen zur Verfügung.
    if (valid.length) return valid;
    return [{ ...scenes[0], count: min }];
  }

  function newScene() {
    const candidates = availableScenes();
    const others = candidates.filter((scene) => scene !== state.count.scene);
    const chosen = (others.length ? others : candidates)[randomInteger(0, (others.length ? others : candidates).length - 1)];
    state.count.scene = chosen;
    state.count.touched = new Set();
  }

  function renderCount() {
    const { scene, touched } = state.count;
    const complete = touched.size === scene.count;
    return `${screenHeading('Zähl mit!', 'Tippe die kleinen Freunde an.', 'home', '✿')}
      <section class="play-card count-card" aria-label="Zählen in einer kleinen Szene">
        <div class="scene-title"><div><span class="mini-kicker">EINE KLEINE ENTDECKUNGSREISE</span><h2>${escapeHtml(scene.title)}</h2></div><span class="count-badge" aria-label="${touched.size} von ${scene.count} gezählt">${touched.size} / ${scene.count}</span></div>
        <div class="scene scene--${scene.id}">
          <span class="scene-sun" aria-hidden="true"></span><span class="scene-cloud scene-cloud--one" aria-hidden="true"></span><span class="scene-cloud scene-cloud--two" aria-hidden="true"></span>
          <span class="scene-hill scene-hill--back" aria-hidden="true"></span><span class="scene-hill scene-hill--front" aria-hidden="true"></span>
          <div class="scene-items">${Array.from({ length: scene.count }, (_, i) => {
            const counted = touched.has(i);
            const countNumber = counted ? [...touched].indexOf(i) + 1 : null;
            return `<button type="button" class="scene-item ${counted ? 'is-counted' : ''}" data-action="count-scene-item" data-index="${i}" aria-pressed="${counted}" aria-label="${escapeHtml(scene.singular)} ${i + 1}, ${counted ? `als ${countNumber} gezählt` : 'zählen'}" style="--item:${i}"><span class="scene-emoji" aria-hidden="true">${scene.emoji}</span>${counted ? `<span class="scene-count-label" aria-hidden="true">${countNumber}</span>` : ''}</button>`;
          }).join('')}</div>
        </div>
        <div class="scene-bottom">
          <p class="scene-feedback" role="status" aria-live="polite">${complete ? `🌟 Alle ${scene.count} ${escapeHtml(scene.plural)} gezählt!` : touched.size ? `Schon ${touched.size} gezählt!` : `Wo sind die ${escapeHtml(scene.plural)}?`}</p>
          ${complete ? `<button class="primary-button" type="button" data-action="new-scene">Neue Szene ${icon('arrow', 24)}</button>` : `<button class="primary-button" type="button" data-action="count-next">${icon('hand', 24)} Weiterzählen</button>`}
        </div>
      </section>`;
  }

  function render({ toTop = false, focus = false } = {}) {
    const views = { home: renderHome, discover: renderDiscover, quiz: renderQuiz, sort: renderSort, count: renderCount };
    app.innerHTML = (views[state.screen] || renderHome)();
    document.body.dataset.screen = state.screen;
    if (toTop) window.scrollTo({ top: 0, behavior: 'instant' });
    if (focus) app.focus({ preventScroll: true });
  }

  function openScreen(screen) {
    audio.stop();
    state.screen = screen;
    if (screen === 'discover') {
      state.discover.selected = null;
      state.discover.touched = new Set();
    }
    if (screen === 'quiz') newQuiz();
    if (screen === 'sort') newSortRound();
    if (screen === 'count') newScene();
    render({ toTop: true, focus: true });
  }

  function countDiscover(index) {
    const n = state.discover.selected;
    if (index < 0 || index >= n) return;
    if (!state.discover.touched.has(index)) {
      state.discover.touched.add(index);
      audio.speakNumber(state.discover.touched.size);
    }
    render();
  }

  function answerQuiz(answer) {
    if (state.quiz.solved) return;
    if (answer === state.quiz.target) {
      state.quiz.solved = true;
      state.quiz.hint = false;
      audio.celebrate();
    } else {
      state.quiz.hint = true;
    }
    render();
  }

  function chooseSortNumber(number) {
    const sort = state.sort;
    if (sort.picked.includes(number)) return;
    const correctOrder = [...sort.pool].sort((a, b) => a - b);
    if (number === correctOrder[sort.picked.length]) {
      sort.picked.push(number);
      sort.hint = false;
      if (sort.picked.length === sort.pool.length) {
        sort.completedRounds++;
        audio.celebrate();
      } else {
        audio.speakNumber(number);
      }
    } else {
      sort.hint = true;
    }
    render();
  }

  function countSceneItem(index) {
    const { scene, touched } = state.count;
    if (index < 0 || index >= scene.count) return;
    if (!touched.has(index)) {
      touched.add(index);
      audio.speakNumber(touched.size);
    }
    render();
  }

  app.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button || !app.contains(button)) return;
    const action = button.dataset.action;
    const number = Number(button.dataset.number);
    const index = Number(button.dataset.index);

    switch (action) {
      case 'home': openScreen('home'); break;
      case 'open-mode': openScreen(button.dataset.mode); break;
      case 'discover-list':
        audio.stop();
        state.discover.selected = null;
        state.discover.touched = new Set();
        render({ focus: true });
        break;
      case 'select-number':
        if (!numbers.includes(number)) return;
        state.discover.selected = number;
        state.discover.touched = new Set();
        audio.speakNumber(number);
        render({ toTop: true });
        break;
      case 'speak-current': audio.speakNumber(state.discover.selected); break;
      case 'count-discover': countDiscover(index); break;
      case 'quiz-answer': answerQuiz(number); break;
      case 'next-quiz': newQuiz(); render(); break;
      case 'sort-level':
        state.sort.level = clamp(Number(button.dataset.level), minSortLevel, maxSortLevel);
        audio.stop();
        newSortRound();
        render();
        break;
      case 'sort-pick': chooseSortNumber(number); break;
      case 'sort-next': newSortRound(); render(); break;
      case 'count-scene-item': countSceneItem(index); break;
      case 'count-next': {
        const { scene, touched } = state.count;
        const next = Array.from({ length: scene.count }, (_, i) => i).find((i) => !touched.has(i));
        if (next !== undefined) countSceneItem(next);
        break;
      }
      case 'new-scene': audio.stop(); newScene(); render(); break;
      default: break;
    }
  });

  soundToggle.addEventListener('click', () => {
    audio.setMuted(!audio.muted);
    renderSoundButton();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.stop();
  });
  window.addEventListener('pagehide', () => audio.stop());

  initializeBrand();
  render();

  // Alle PWA-Dateien sind relativ zum GitHub-Pages-Unterverzeichnis adressiert.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', async () => {
      try {
        await navigator.serviceWorker.register('./sw.js', { scope: './' });
        await navigator.serviceWorker.ready;
        document.getElementById('offline-status').textContent = '✓ Auch offline spielbar';
      } catch (_) {
        // Ohne Service Worker bleibt die App online vollständig nutzbar.
      }
    });
  }
})();
