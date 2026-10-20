// Values approved in the prototype (phase 2); see .claude/features/guess-the-disease.md.

export const PARAMS = Object.freeze({
  ROUND_SECONDS: 60,
  ROUNDS: 3,
  SKIP_PENALTY: 1,
  WARNING_SECONDS: 5,
  COUNTDOWN_SECONDS: 3,
  SWIPE_THRESHOLD_PX: 60,
  CARD_SWITCH_MS: 250,
  FLIP_MS: 450,
});

// Settings the players can change on the setup screen.
export const LIMITS = Object.freeze({
  ROUND_SECONDS: {min: 30, max: 90, step: 10},
  ROUNDS: {min: 1, max: 5, step: 1},
  SKIP_PENALTY: {min: 0, max: 1, step: 1},
});

export const TIMING = Object.freeze({
  CARD_ENTER_MS: 220,
  POP_MS: 700,
  STAMP_MS: 350,
  TOAST_MS: 2200,
  CONFETTI_MS: 4500,
  MAX_FRAME_MS: 100,
  DRAG_TAP_PX: 8,
});

export const DEFAULT_TEAMS = 2;
export const MAX_TEAMS = 4;
export const TEAM_NAME_MAX = 16;
export const TEAM_NAMES = Object.freeze(['Терапевты', 'Хирурги', 'Лоры', 'Санитары']);
export const TEAM_COLORS = Object.freeze(['#FF6B57', '#46B3EE', '#FFC53D', '#9D7DFF']);

export const SYSTEMS = Object.freeze({
  gut:   {name: 'Живот',        color: '#FF6B57'},
  lor:   {name: 'Нос и горло',  color: '#46B3EE'},
  skin:  {name: 'Кожа',         color: '#FFC53D'},
  head:  {name: 'Голова и сон', color: '#9D7DFF'},
  face:  {name: 'Глаза и зубы', color: '#35C9AE'},
  bones: {name: 'Спина и ноги', color: '#FF9A3D'},
  misc:  {name: 'Всякое',       color: '#FF7DB2'},
});

export const STORAGE_KEY = 'ugaday-v1';
export const STORAGE_SCHEMA = 1;
