// =========================================================
//  AYAN KHAN'S BIRTHDAY WEBSITE - INTERACTIVE SCRIPT
//  Sound Effects (Web Audio Synth), AI Gate, Animations,
//  Candle Blowing, Gift Unwrapping & info.txt parser.
// =========================================================

// --- Sound & Audio State ---
let audioCtx = null;
let sfxEnabled = true;
let musicPlaying = false;
let musicTimer = null;
let currentNoteIndex = 0;

// Happy Birthday melody notes (Note name to frequency in Hz)
const NOTES = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33
};

// Birthday tune melody sequence: [note, duration in seconds]
const BIRTHDAY_TUNE = [
  ['C4', 0.35], ['C4', 0.25], ['D4', 0.6], ['C4', 0.6], ['F4', 0.6], ['E4', 1.0],
  ['C4', 0.35], ['C4', 0.25], ['D4', 0.6], ['C4', 0.6], ['G4', 0.6], ['F4', 1.0],
  ['C4', 0.35], ['C4', 0.25], ['C5', 0.6], ['A4', 0.6], ['F4', 0.6], ['E4', 0.6], ['D4', 0.8],
  ['Bb4', 0.35], ['Bb4', 0.25], ['A4', 0.6], ['F4', 0.6], ['G4', 0.6], ['F4', 1.2]
];

// Helper to get or create Web Audio Context
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ---------------------------------------------------------
//  WEB AUDIO SYNTHESIZER SOUND EFFECTS
// ---------------------------------------------------------
function playTone(freq, type = 'sine', duration = 0.2, gainLevel = 0.15) {
  if (!sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// 1. Balloon Pop Sound
function playPop() {
  if (!sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(450, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

// 2. Fanfare Celebration Chord
function playFanfare() {
  if (!sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const chord = [261.63, 329.63, 392.00, 523.25]; // C major
  chord.forEach((freq, idx) => {
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }, idx * 100);
  });
}

// 3. Candle Blow / Whoosh Sound
function playCandleBlow() {
  if (!sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Filtered white noise puff
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.35);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  whiteNoise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  whiteNoise.start();
}

// 4. Cheering Sparkles Sound
function playCheer() {
  if (!sfxEnabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'sine', 0.3, 0.12), i * 90);
  });
}

// 5. Gift Box Unwrap Sound
function playGiftUnwrap() {
  if (!sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Glissando up then fanfare
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.35);

  setTimeout(playFanfare, 280);
}

// ---------------------------------------------------------
//  BACKGROUND BIRTHDAY MUSIC SYNTHESIZER
// ---------------------------------------------------------
function playNextMusicNote() {
  if (!musicPlaying) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const [noteName, duration] = BIRTHDAY_TUNE[currentNoteIndex];
  const freq = NOTES[noteName] || 440;

  // Music-box bell tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration * 0.95);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);

  currentNoteIndex = (currentNoteIndex + 1) % BIRTHDAY_TUNE.length;
  musicTimer = setTimeout(playNextMusicNote, duration * 1000);
}

window.toggleBirthdayMusic = function () {
  getAudioContext();
  musicPlaying = !musicPlaying;

  const btn = document.getElementById('btn-toggle-music');
  const icon = document.getElementById('music-icon');
  const txt = document.getElementById('music-text');

  if (musicPlaying) {
    btn?.classList.add('playing');
    if (icon) icon.textContent = '⏸️';
    if (txt) txt.textContent = 'Pause Tune';
    currentNoteIndex = 0;
    playNextMusicNote();
  } else {
    btn?.classList.remove('playing');
    if (icon) icon.textContent = '🎵';
    if (txt) txt.textContent = 'Birthday Tune';
    clearTimeout(musicTimer);
  }
};

window.toggleSfx = function () {
  sfxEnabled = !sfxEnabled;
  const icon = document.getElementById('sfx-icon');
  const txt = document.getElementById('sfx-text');
  if (sfxEnabled) {
    if (icon) icon.textContent = '🔊';
    if (txt) txt.textContent = 'SFX: ON';
    playTone(587.33, 'sine', 0.2, 0.2);
  } else {
    if (icon) icon.textContent = '🔇';
    if (txt) txt.textContent = 'SFX: OFF';
  }
};

// ---------------------------------------------------------
//  FIRST SCREEN: AI GATE ENTRY
// ---------------------------------------------------------
window.enterCelebration = function () {
  getAudioContext();
  const gate = document.getElementById('ai-gate');

  // Trigger celebration explosion
  playFanfare();
  launchFireworksBurst(window.innerWidth / 2, window.innerHeight / 2);
  launchConfetti();

  if (gate) {
    gate.classList.add('gate-closing');
    setTimeout(() => {
      gate.style.display = 'none';
    }, 800);
  }

  // Auto-start birthday melody after 800ms
  setTimeout(() => {
    if (!musicPlaying) toggleBirthdayMusic();
  }, 900);
};

// ---------------------------------------------------------
//  INTERACTIVE CANDLE BLOWING
// ---------------------------------------------------------
let candleBlown = false;
window.blowCandle = function () {
  const container = document.querySelector('.interactive-cake-container');
  const hint = document.getElementById('cake-hint');
  if (!container) return;

  if (!candleBlown) {
    candleBlown = true;
    container.classList.add('blown');
    playCandleBlow();
    setTimeout(() => {
      playCheer();
      launchConfetti();
      launchFireworksBurst(window.innerWidth / 2, window.innerHeight * 0.4);
    }, 200);

    if (hint) {
      hint.innerHTML = '🎉 WISH GRANTED! Happy Birthday Ayan Bhai! 🌟 <small style="opacity:0.8">(Tap to relight)</small>';
      hint.style.color = '#10b981';
    }
  } else {
    // Relight
    candleBlown = false;
    container.classList.remove('blown');
    playTone(880, 'sine', 0.2, 0.2);
    if (hint) {
      hint.innerHTML = '🕯️ Click candle to make a wish & blow!';
      hint.style.color = 'var(--secondary)';
    }
  }
};

// ---------------------------------------------------------
//  MYSTERY GIFT BOX
// ---------------------------------------------------------
let giftOpened = false;
window.unwrapGift = function () {
  if (giftOpened) return;
  giftOpened = true;

  const box = document.getElementById('gift-box');
  const card = document.getElementById('gift-reveal-card');
  const inst = document.getElementById('gift-instruction');

  box?.classList.add('opened');
  playGiftUnwrap();
  launchConfetti();
  launchFireworksBurst(window.innerWidth / 2, window.innerHeight * 0.6);

  if (inst) inst.style.display = 'none';
  if (card) {
    card.style.display = 'block';
  }
};

window.repackGift = function () {
  giftOpened = false;
  const box = document.getElementById('gift-box');
  const card = document.getElementById('gift-reveal-card');
  const inst = document.getElementById('gift-instruction');

  box?.classList.remove('opened');
  playTone(400, 'sine', 0.15, 0.15);
  if (inst) inst.style.display = 'block';
  if (card) card.style.display = 'none';
};

// ---------------------------------------------------------
//  BURST CELEBRATION BUTTON
// ---------------------------------------------------------
window.celebrateBurst = function () {
  playFanfare();
  launchConfetti();
  launchFireworksBurst(window.innerWidth * 0.3, window.innerHeight * 0.4);
  launchFireworksBurst(window.innerWidth * 0.7, window.innerHeight * 0.4);
};

// ---------------------------------------------------------
//  PARSE info.txt
// ---------------------------------------------------------
async function loadConfig() {
  try {
    const res = await fetch('info.txt?' + Date.now());
    const text = await res.text();
    return parseConfig(text);
  } catch (e) {
    console.warn('Could not load info.txt, using defaults.', e);
    return {};
  }
}

function parseConfig(raw) {
  const cfg = {
    birthday_person_name: 'Ayan Khan',
    your_name: 'Awan',
    age: '',
    birthday_date: '',
    birth_date: '',
    disclaimer: 'This webiste is generated by AI so if any lines are heart touching Keep in mind these lines are said by AI not Awan :)',
    message: '',
    gift_surprise: '',
    fun_facts: [],
    photos: [],
    wishes: [],
    youtube_song: '',
    theme: 'purple',
  };

  const lines = raw.split('\n');
  let currentKey = null;
  let multilineBuffer = [];

  const flushMultiline = () => {
    if (!currentKey) return;
    const values = multilineBuffer
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));

    if (['fun_facts', 'photos', 'wishes'].includes(currentKey)) {
      cfg[currentKey] = values
        .filter(l => l.startsWith('-'))
        .map(l => l.slice(1).trim());
    } else if (['message', 'gift_surprise'].includes(currentKey)) {
      cfg[currentKey] = values.join('\n').trim();
    }
    multilineBuffer = [];
    currentKey = null;
  };

  for (let raw_line of lines) {
    const line = raw_line;
    if (line.trimStart().startsWith('#') && !currentKey) continue;

    const kv = line.match(/^([a-z_]+)\s*=\s*(.*)/);
    if (kv) {
      flushMultiline();
      const key = kv[1].trim();
      const val = kv[2].trim();

      if (['fun_facts', 'photos', 'wishes', 'message', 'gift_surprise'].includes(key)) {
        currentKey = key;
        if (val && !val.startsWith('#')) multilineBuffer.push(val);
      } else {
        if (key in cfg && val && !val.startsWith('#')) {
          cfg[key] = val;
        }
      }
      continue;
    }

    if (currentKey) {
      multilineBuffer.push(line);
    }
  }
  flushMultiline();

  return cfg;
}

// ---------------------------------------------------------
//  POPULATE PAGE
// ---------------------------------------------------------
function populate(cfg) {
  // Theme
  if (cfg.theme && cfg.theme !== 'purple') {
    document.documentElement.setAttribute('data-theme', cfg.theme);
  }

  // AI Disclaimer First Screen
  if (cfg.disclaimer) {
    setText('disclaimer-quote', `"${cfg.disclaimer.replace(/^"|"$/g, '')}"`);
  }
  setText('gate-person-name', cfg.birthday_person_name || 'Ayan Khan');
  setText('gate-sender-name', cfg.your_name || 'Awan');

  // Hero Section
  setText('hero-from-name', cfg.your_name || 'Awan');
  setText('hero-name', cfg.birthday_person_name || 'Ayan Khan');
  setText('hero-date', cfg.birthday_date ? `🗓️ ${cfg.birthday_date}` : '');

  const ageBadge = document.getElementById('hero-age-badge');
  if (cfg.age && cfg.age.trim()) {
    ageBadge.textContent = `🎂 Turning ${cfg.age}!`;
    ageBadge.style.display = 'inline-block';
  } else {
    ageBadge.style.display = 'none';
  }

  // Document Title
  document.title = `Happy Birthday, ${cfg.birthday_person_name || 'Ayan Khan'}! 🎉`;

  // Message Section
  const msgEl = document.getElementById('message-text');
  if (msgEl) {
    msgEl.textContent = cfg.message ||
      `Wishing you all the happiness in the world today and always!\nYou are not just my cousin, you are my brother.\nLove you loads, bhai!`;
  }
  setText('message-signature', `— with love, ${cfg.your_name || 'Awan'} 💜`);

  // Mystery Gift Message
  setText('gift-message-text', cfg.gift_surprise ||
    `🏆 The "Best Elder Brother in the World" Award!\nGranted exclusively to Ayan Khan.\nPerks included: Lifetime free biryani treatments & 24/7 tech support on demand from Awan! 😉🎉`);

  // Footer
  setText('footer-name', cfg.birthday_person_name || 'Ayan Khan');
  setText('footer-from', cfg.your_name || 'Awan');

  // Fun Facts
  buildFacts(cfg.fun_facts);

  // Wishes Carousel
  buildWishes(cfg.wishes);

  // Photo Gallery
  buildGallery(cfg.photos, cfg.birthday_person_name);

  // YouTube Anthem
  buildMusic(cfg.youtube_song);

  // Real-Time Milestone Counter ("Legend Since...")
  startMilestoneCounter(cfg);
}

// ---------------------------------------------------------
//  REAL-TIME MILESTONE COUNTER ("LEGEND SINCE...")
// ---------------------------------------------------------
let milestoneInterval = null;

function startMilestoneCounter(cfg) {
  if (milestoneInterval) clearInterval(milestoneInterval);

  let birthDate = null;

  // 1. Check explicit birth_date from info.txt (e.g. 2007-11-12)
  if (cfg.birth_date && !isNaN(new Date(cfg.birth_date).getTime())) {
    birthDate = new Date(cfg.birth_date);
  }
  // 2. Infer from age and birthday_date (e.g. age=19, birthday_date=November 12)
  else if (cfg.age) {
    const ageNum = parseInt(cfg.age, 10);
    const now = new Date();
    let birthYear = now.getFullYear() - ageNum;

    if (cfg.birthday_date) {
      const parsed = new Date(`${cfg.birthday_date}, ${birthYear} 00:00:00`);
      if (!isNaN(parsed.getTime())) {
        const thisYearBday = new Date(`${cfg.birthday_date}, ${now.getFullYear()} 00:00:00`);
        if (now < thisYearBday) {
          birthYear = now.getFullYear() - ageNum;
        }
        birthDate = new Date(`${cfg.birthday_date}, ${birthYear} 00:00:00`);
      }
    }

    if (!birthDate) {
      birthDate = new Date(birthYear, 10, 12, 0, 0, 0);
    }
  } else {
    // Default fallback: 19 years ago
    birthDate = new Date(new Date().getFullYear() - 19, 10, 12, 0, 0, 0);
  }

  function tick() {
    const now = new Date();
    const diffMs = now.getTime() - birthDate.getTime();
    if (diffMs <= 0) return;

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalDays = Math.floor(totalSeconds / 86400);

    // Calculate years and anniversary
    let years = now.getFullYear() - birthDate.getFullYear();
    let birthdayThisYear = new Date(birthDate);
    birthdayThisYear.setFullYear(now.getFullYear());
    if (now < birthdayThisYear) {
      years--;
      birthdayThisYear.setFullYear(now.getFullYear() - 1);
    }

    const remainderMs = Math.max(0, now - birthdayThisYear);
    const remainderSec = Math.floor(remainderMs / 1000);
    const days = Math.floor(remainderSec / 86400);
    const hours = Math.floor((remainderSec % 86400) / 3600);
    const minutes = Math.floor((remainderSec % 3600) / 60);
    const seconds = remainderSec % 60;

    setText('time-years', String(years).padStart(2, '0'));
    setText('time-days', String(days).padStart(3, '0'));
    setText('time-hours', String(hours).padStart(2, '0'));
    setText('time-minutes', String(minutes).padStart(2, '0'));
    setText('time-seconds', String(seconds).padStart(2, '0'));

    // Lifetime brotherly stats
    const chai = Math.floor(totalDays * 1.8).toLocaleString();
    const heartbeats = (totalDays * 24 * 60 * 75 / 1000000).toFixed(1) + 'M+';
    const sleepHours = Math.floor(totalDays * 8.2).toLocaleString() + ' hrs';

    setText('stat-chai', `${chai}+`);
    setText('stat-heartbeats', heartbeats);
    setText('stat-sleep', `${sleepHours}`);
  }

  tick();
  milestoneInterval = setInterval(tick, 1000);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined) el.textContent = value;
}

const ICON_POOL = ['🌟', '🎯', '💡', '🎸', '🏆', '❤️', '🚀', '😄', '🌙', '🎨', '👑', '🔥'];

function buildFacts(facts) {
  const grid = document.getElementById('facts-grid');
  if (!grid) return;

  const list = facts && facts.length
    ? facts
    : [
        'Always the life of every party 🎉',
        'Has the best advice for everything',
        'The coolest older bhai anyone could ask for',
        'King of good vibes and unforgettable memories'
      ];

  grid.innerHTML = list.map((f, i) => `
    <div class="fact-card" style="animation-delay:${i * 0.1}s">
      <span class="fact-icon">${ICON_POOL[i % ICON_POOL.length]}</span>
      <span class="fact-text">${escHtml(f)}</span>
    </div>`).join('');
}

function buildWishes(wishes) {
  const container = document.getElementById('wishes-container');
  const dotsEl    = document.getElementById('wish-dots');
  if (!container) return;

  const list = wishes && wishes.length
    ? wishes
    : [
        'May every day bring you joy, health, and limitless laughter! ✨',
        'Here\'s to another year of great memories and bigger wins! 🚀',
        'You deserve every ounce of success that comes your way, bhai! 🌟',
      ];

  container.innerHTML = list.map((w, i) => `
    <div class="wish-card${i === 0 ? ' active' : ''}" data-idx="${i}">
      ${escHtml(w)}
    </div>`).join('');

  if (dotsEl) {
    dotsEl.innerHTML = list.map((_, i) => `
      <span class="wish-dot${i === 0 ? ' active' : ''}" data-idx="${i}"></span>`).join('');
  }

  dotsEl?.querySelectorAll('.wish-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      playTone(600, 'sine', 0.1, 0.1);
      showWish(+dot.dataset.idx);
    });
  });

  if (list.length > 1) {
    setInterval(() => {
      const active = container.querySelector('.wish-card.active');
      const next = (+active.dataset.idx + 1) % list.length;
      showWish(next);
    }, 4500);
  }
}

function showWish(idx) {
  document.querySelectorAll('.wish-card').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.wish-dot').forEach(d => d.classList.remove('active'));
  document.querySelector(`.wish-card[data-idx="${idx}"]`)?.classList.add('active');
  document.querySelector(`.wish-dot[data-idx="${idx}"]`)?.classList.add('active');
}

window.prevWish = function () {
  playTone(500, 'sine', 0.1, 0.1);
  const cards = document.querySelectorAll('.wish-card');
  const active = document.querySelector('.wish-card.active');
  const idx = +active?.dataset.idx || 0;
  showWish((idx - 1 + cards.length) % cards.length);
};

window.nextWish = function () {
  playTone(650, 'sine', 0.1, 0.1);
  const cards = document.querySelectorAll('.wish-card');
  const active = document.querySelector('.wish-card.active');
  const idx = +active?.dataset.idx || 0;
  showWish((idx + 1) % cards.length);
};

function buildGallery(photos, name) {
  const section = document.getElementById('gallery-section');
  const grid = document.getElementById('gallery-grid');
  if (!section || !grid) return;

  // If no photos specified, completely hide the section (no placeholder box!)
  if (!photos || !photos.length) {
    section.style.display = 'none';
    grid.innerHTML = '';
    return;
  }

  section.style.display = '';
  grid.innerHTML = photos.map(src => `
    <div class="gallery-item" onclick="openLightbox('${escHtml(src)}')">
      <img src="${escHtml(src)}" alt="Photo of ${escHtml(name || 'Ayan')}"
           onerror="this.parentElement.style.display='none'">
    </div>`).join('');
}

function buildMusic(url) {
  const section = document.getElementById('music-section');
  if (!section) return;

  if (!url || !url.trim()) {
    section.style.display = 'none';
    return;
  }

  let embedUrl = url.trim();
  // Support youtu.be, watch?v=, embed/, shorts/, etc.
  const ytMatch = embedUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  } else if (embedUrl.includes('watch?v=')) {
    embedUrl = embedUrl.replace('watch?v=', 'embed/');
  }

  const frame = document.getElementById('youtube-frame');
  if (frame) {
    frame.src = embedUrl;
  }
  section.style.display = '';
}

// ---------------------------------------------------------
//  LIGHTBOX
// ---------------------------------------------------------
window.openLightbox = function (src) {
  playTone(700, 'sine', 0.15, 0.15);
  const lb = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = src;
  lb.classList.add('open');
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('lightbox')?.addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox') || e.target.id === 'lightbox-close') {
      document.getElementById('lightbox').classList.remove('open');
    }
  });
});

// ---------------------------------------------------------
//  CONFETTI & FIREWORKS SYSTEM
// ---------------------------------------------------------
let fireworks = [];
let confettiPieces = [];

function initConfettiSystem() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw confetti
    confettiPieces.forEach((p, index) => {
      ctx.beginPath();
      ctx.lineWidth = p.r / 2;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r * 2);
      ctx.stroke();

      p.tiltAngle += p.tiltSpeed;
      p.y += p.speed;
      p.x += Math.sin(p.tiltAngle) * 0.8;
      p.tilt = Math.sin(p.tiltAngle) * 15;

      if (p.y > canvas.height + 20) {
        confettiPieces.splice(index, 1);
      }
    });

    // Update and draw fireworks
    fireworks.forEach((fw, fIndex) => {
      fw.sparks.forEach((s, sIndex) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.04; // gravity
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          fw.sparks.splice(sIndex, 1);
        }
      });

      if (fw.sparks.length === 0) {
        fireworks.splice(fIndex, 1);
      }
    });

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

function launchConfetti() {
  const colors = ['#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#f97316', '#ffffff'];
  const newPieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * 50,
    r: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.random() * 10 - 10,
    tiltAngle: Math.random() * Math.PI,
    tiltSpeed: Math.random() * 0.1 + 0.05,
    speed: Math.random() * 4 + 2,
  }));
  confettiPieces.push(...newPieces);
}

function launchFireworksBurst(originX, originY) {
  const colors = ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#60a5fa', '#fcd34d'];
  const sparkCount = 45;
  const sparks = [];

  for (let i = 0; i < sparkCount; i++) {
    const angle = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.2;
    const speed = Math.random() * 6 + 2;
    sparks.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 2.5 + 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.015 + 0.012
    });
  }

  fireworks.push({ sparks });
}

// ---------------------------------------------------------
//  INTERACTIVE POP-ABLE BALLOONS
// ---------------------------------------------------------
function spawnBalloon() {
  const colors = ['#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#3b82f6'];
  const container = document.getElementById('balloon-container');
  if (!container) return;

  const b = document.createElement('div');
  b.className = 'balloon';
  b.style.left = `${Math.random() * 92 + 2}vw`;
  b.style.background = colors[Math.floor(Math.random() * colors.length)];
  const duration = 9 + Math.random() * 7;
  b.style.animationDuration = `${duration}s`;
  b.style.width = `${45 + Math.random() * 20}px`;
  b.style.height = `${55 + Math.random() * 25}px`;

  // On balloon click/tap -> POP!
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    playPop();

    // Show floating score text
    const rect = b.getBoundingClientRect();
    showPopText(rect.left + rect.width / 2, rect.top, '+1 Bhai! 🎈');
    launchFireworksBurst(rect.left + rect.width / 2, rect.top);

    b.remove();
    setTimeout(spawnBalloon, 1500); // Respawn replacement
  });

  // When finishes floating off-screen
  b.addEventListener('animationend', () => {
    b.remove();
    spawnBalloon();
  });

  container.appendChild(b);
}

function launchBalloons() {
  for (let i = 0; i < 7; i++) {
    setTimeout(spawnBalloon, i * 1400);
  }
}

function showPopText(x, y, text) {
  const tag = document.createElement('div');
  tag.className = 'balloon-pop-text';
  tag.textContent = text;
  tag.style.left = `${x}px`;
  tag.style.top = `${y}px`;
  document.body.appendChild(tag);
  setTimeout(() => tag.remove(), 1000);
}

// ---------------------------------------------------------
//  MAGICAL SPARKLE CURSOR TRAIL
// ---------------------------------------------------------
let lastSparkleTime = 0;
const SPARKLE_ICONS = ['✨', '⭐', '💫', '🎉'];

function setupCursorTrail() {
  const addSparkle = (x, y) => {
    const now = Date.now();
    if (now - lastSparkleTime < 60) return; // throttle
    lastSparkleTime = now;

    const sp = document.createElement('span');
    sp.className = 'cursor-sparkle';
    sp.textContent = SPARKLE_ICONS[Math.floor(Math.random() * SPARKLE_ICONS.length)];
    sp.style.left = `${x}px`;
    sp.style.top = `${y}px`;
    document.body.appendChild(sp);

    setTimeout(() => sp.remove(), 700);
  };

  window.addEventListener('mousemove', e => addSparkle(e.clientX, e.clientY));
  window.addEventListener('touchmove', e => {
    if (e.touches && e.touches[0]) {
      addSparkle(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
}

// ---------------------------------------------------------
//  SCROLL REVEAL
// ---------------------------------------------------------
function setupReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ---------------------------------------------------------
//  HELPER
// ---------------------------------------------------------
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------
//  INIT
// ---------------------------------------------------------
(async () => {
  initConfettiSystem();
  setupCursorTrail();
  launchBalloons();
  setupReveal();

  const cfg = await loadConfig();
  populate(cfg);
})();
