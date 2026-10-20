// Entry point: loads saved settings and the game in progress, wires game events to the screen, runs the frame loop.
import {PARAMS, LIMITS, TIMING, DEFAULT_TEAMS, MAX_TEAMS, TEAM_NAMES, TEAM_NAME_MAX} from './config.js';
import {CARDS} from './cards.js';
import {INK} from './art.js';
import {Game} from './game.js';
import * as storage from './storage.js';
import * as sound from './sound.js';
import {renderScreen, updateTimer, turnHint, confetti, sign} from './render.js';
import {attachInput} from './input.js';

const root = document.getElementById('content');
const pops = document.getElementById('pops');
const toastEl = document.getElementById('toast');

function clampSetting(key, value){
  const {min, max} = LIMITS[key];
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : PARAMS[key];
}

const saved = storage.load();
const settings = saved.settings || {};
const params = {...PARAMS};
for (const key of Object.keys(LIMITS)) params[key] = clampSetting(key, settings[key]);
const ui = {
  soundOn: settings.sound !== false,
  setupTeams: Array.isArray(settings.teams) && settings.teams.length
    ? settings.teams.slice(0, MAX_TEAMS).map(n => String(n).slice(0, TEAM_NAME_MAX))
    : TEAM_NAMES.slice(0, DEFAULT_TEAMS),
};

const game = new Game({
  cardIds: CARDS.map(c => c.id), params,
  played: Array.isArray(saved.played) ? saved.played : [],
  record: Number(saved.record) || 0,
  emit: onEvent,
});
const restored = game.restore(saved.game);

function persist(){
  storage.save({
    settings: {ROUND_SECONDS: params.ROUND_SECONDS, ROUNDS: params.ROUNDS, SKIP_PENALTY: params.SKIP_PENALTY, sound: ui.soundOn, teams: ui.setupTeams},
    game: game.serialize(),
    played: [...game.played],
    record: game.record,
  });
}

function render(){
  root.innerHTML = renderScreen(game, ui);
  game.state.enter = false;
}

let toastTimer = 0;
function toast(message){
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastEl.style.animation = 'none';
  void toastEl.offsetWidth;
  toastEl.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, TIMING.TOAST_MS);
}

function cardAway({kind, res, points}){
  const card = root.querySelector('.card');
  if (card) card.classList.add(kind === 'ok' ? 'away-up' : 'away-down');
  const text = res === 'ok' ? '+1' : res === 'skip' && params.SKIP_PENALTY ? '−1' : '0';
  pops.innerHTML = `<span class="pop ${res}">${text}</span>`;
  const runsum = root.querySelector('.runsum');
  if (runsum) runsum.textContent = sign(points);
}

function showAnswer(){
  const card = root.querySelector('.card.flip');
  if (card){
    card.classList.add('is-flipped');
    ['data-a', 'role', 'aria-label'].forEach(a => card.removeAttribute(a));
  }
  root.querySelectorAll('.ans').forEach(b => { b.disabled = false; });
  const hint = root.querySelector('.hint');
  if (hint) hint.textContent = turnHint(game);
  updateTimer(root, game);
}

// Keeps the screen on during a turn where Safari allows it; a refusal is fine.
const wake = {
  lock: null,
  async hold(){
    try {
      if (!('wakeLock' in navigator) || this.lock) return;
      this.lock = await navigator.wakeLock.request('screen');
      this.lock.addEventListener('release', () => { this.lock = null; });
    } catch {
      this.lock = null;
    }
  },
  release(){
    try { if (this.lock) this.lock.release(); } catch { /* already released */ }
    this.lock = null;
  },
};

function onEvent(type, payload){
  switch (type){
    case 'change': render(); break;
    case 'tick': updateTimer(root, game); break;
    case 'sound': if (ui.soundOn) sound.play(payload); break;
    case 'toast': toast(payload); break;
    case 'answered': cardAway(payload); break;
    case 'flipped': showAnswer(); break;
    case 'wake': if (payload) wake.hold(); else wake.release(); break;
    case 'final': {
      const canvas = root.querySelector('.confetti');
      if (canvas) confetti(canvas, INK, TIMING.CONFETTI_MS);
      break;
    }
    case 'save': persist(); break;
  }
}

const ACTIONS = {
  toSetup: () => game.show('setup'),
  toRules: () => game.show('rules'),
  home: () => game.home(),
  toggleSound(){
    ui.soundOn = !ui.soundOn;
    if (ui.soundOn) sound.unlock();
    render(); persist();
  },
  addTeam(){
    if (ui.setupTeams.length >= MAX_TEAMS) return;
    ui.setupTeams.push(TEAM_NAMES[ui.setupTeams.length]);
    render(); persist();
  },
  rmTeam(d){
    if (ui.setupTeams.length <= 1) return;
    ui.setupTeams.splice(Number(d.i), 1);
    render(); persist();
  },
  step(d){
    params[d.k] = clampSetting(d.k, params[d.k] + Number(d.d));
    render(); persist();
  },
  toggleSkip(){
    params.SKIP_PENALTY = params.SKIP_PENALTY ? 0 : 1;
    render(); persist();
  },
  start: () => game.startGame(ui.setupTeams),
  startTurn: () => game.startTurn(),
  flip: () => game.flip(),
  ok: () => game.answer('ok'),
  skip: () => game.answer('skip'),
  pause: () => game.pause(),
  resume: () => game.resume(),
  askExit: () => game.askExit(),
  cancelExit: () => game.cancelExit(),
  exit: () => game.home(),
  toggle: d => game.toggleResult(Number(d.i)),
  next: () => game.nextTurn(),
  again: () => game.startGame(game.state.teams.map(t => t.name)),
  persist,
};

const css = document.documentElement.style;
css.setProperty('--switch-ms', params.CARD_SWITCH_MS + 'ms');
css.setProperty('--flip-ms', params.FLIP_MS + 'ms');
css.setProperty('--enter-ms', TIMING.CARD_ENTER_MS + 'ms');
css.setProperty('--pop-ms', TIMING.POP_MS + 'ms');
css.setProperty('--stamp-ms', TIMING.STAMP_MS + 'ms');
css.setProperty('--toast-ms', TIMING.TOAST_MS + 'ms');

document.addEventListener('pointerdown', sound.unlock, true);
document.addEventListener('keydown', sound.unlock, true);
attachInput({
  root, game,
  act: (name, data) => { const fn = ACTIONS[name]; if (fn) fn(data || {}); },
  onTeamName: (i, value) => { ui.setupTeams[i] = value.slice(0, TEAM_NAME_MAX); persist(); },
});

render();
if (restored) toast('Партия восстановлена');

let lastFrame = performance.now();
requestAnimationFrame(function frame(now){
  game.tick(Math.min(TIMING.MAX_FRAME_MS, now - lastFrame));
  lastFrame = now;
  requestAnimationFrame(frame);
});
