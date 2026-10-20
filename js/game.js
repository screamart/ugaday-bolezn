// Game rules and state, free of DOM. Side effects go out through emit(type, payload):
//   change   — state changed structurally, re-render the screen
//   tick     — only the timer moved
//   sound    — name of a sound to play
//   toast    — short message
//   answered — {kind, res, points}: animate the current card away
//   flipped  — solo card turned face up
//   wake     — true/false: hold or release the screen wake lock
//   final    — the final screen is shown
//   save     — persist state now
import {PARAMS, TEAM_NAMES, TEAM_COLORS, MAX_TEAMS} from './config.js';

const PLAYING = ['turn', 'last'];
const PAUSABLE = ['turn', 'last', 'countdown'];
// A finished game is not brought back: the next launch starts from the home screen.
const RESTORABLE = ['handoff', 'countdown', 'turn', 'last', 'summary'];

export function freshState(){
  return {
    screen: 'home', overlay: null, prevOverlay: null, rotated: false,
    teams: [], turnTeam: 0, round: 1,
    timeLeft: 0, turnTotal: 0, countLeft: 0,
    turnCards: [], current: null, flipped: false,
    deck: [], switching: 0, enter: false, newRecord: false,
  };
}

export function shuffle(list, rng = Math.random){
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The first default name nobody uses yet, so adding a team never repeats a name.
export function freeTeamName(names){
  return TEAM_NAMES.find(n => !names.includes(n)) || TEAM_NAMES[names.length % TEAM_NAMES.length];
}

export class Game {
  constructor({cardIds, params = {...PARAMS}, played = [], record = 0, rng = Math.random, emit = () => {}}){
    this.cardIds = cardIds;
    this.params = params;
    this.played = new Set(played.filter(id => cardIds.includes(id)));
    this.record = record;
    this.rng = rng;
    this.emit = emit;
    this.state = freshState();
  }

  get solo(){ return this.state.teams.length === 1; }
  get playing(){ return PLAYING.includes(this.state.screen); }
  get team(){ return this.state.teams[this.state.turnTeam]; }
  // Solo mode: the timer stands still while the answer is face up.
  get held(){ return this.state.screen === 'turn' && this.solo && this.state.flipped; }
  get secondsLeft(){ return Math.ceil(this.state.timeLeft / 1000); }
  get warning(){
    const s = this.state;
    return s.screen === 'turn' && !this.held && s.timeLeft > 0 && s.timeLeft <= this.params.WARNING_SECONDS * 1000;
  }
  get canFlip(){
    const s = this.state;
    return this.playing && this.solo && !s.flipped && !s.overlay && !s.rotated && !s.switching && !!s.current;
  }
  get canAnswer(){
    const s = this.state;
    return this.playing && !s.overlay && !s.rotated && !s.switching && !!s.current && (!this.solo || s.flipped);
  }
  points(cards = this.state.turnCards){
    return cards.reduce((sum, c) => sum + (c.res === 'ok' ? 1 : c.res === 'skip' ? -this.params.SKIP_PENALTY : 0), 0);
  }
  // Where the game goes after the current turn: {team, round, final}.
  next(){
    const s = this.state;
    let team = s.turnTeam + 1, round = s.round;
    if (team >= s.teams.length){ team = 0; round++; }
    return {team, round, final: round > this.params.ROUNDS};
  }

  changed(){ this.emit('change'); this.emit('save'); }

  show(screen){ this.state.screen = screen; this.changed(); }

  home(){
    this.state = freshState();
    this.emit('wake', false);
    this.changed();
  }

  startGame(names){
    const s = this.state = freshState();
    s.teams = names.slice(0, MAX_TEAMS).map((n, i) => ({
      name: String(n || '').trim() || TEAM_NAMES[i], color: TEAM_COLORS[i], score: 0,
    }));
    s.deck = this.buildDeck();
    s.screen = 'handoff';
    this.changed();
  }

  startTurn(){
    const s = this.state;
    s.turnCards = []; s.current = null; s.flipped = false;
    s.timeLeft = s.turnTotal = this.params.ROUND_SECONDS * 1000;
    if (this.params.COUNTDOWN_SECONDS > 0){
      s.screen = 'countdown';
      s.countLeft = this.params.COUNTDOWN_SECONDS * 1000;
      this.emit('sound', 'count');
      this.changed();
    } else this.beginTurn();
  }

  beginTurn(){
    const s = this.state;
    s.screen = 'turn';
    s.current = this.draw();
    s.flipped = false;
    s.enter = true;
    this.emit('sound', 'go');
    this.emit('wake', true);
    this.changed();
  }

  flip(){
    if (!this.canFlip) return false;
    this.state.flipped = true;
    this.emit('sound', 'flip');
    this.emit('flipped');
    this.emit('save');
    return true;
  }

  answer(kind){
    if (!this.canAnswer) return null;
    const s = this.state;
    const last = s.screen === 'last';
    const res = kind === 'ok' ? 'ok' : last ? 'miss' : 'skip';
    s.turnCards.push({id: s.current, res, last});
    s.switching = this.params.CARD_SWITCH_MS;
    s.current = last ? null : this.draw();
    s.flipped = false;
    this.emit('sound', res);
    this.emit('answered', {kind, res, points: this.points()});
    this.emit('save');
    return res;
  }

  tick(dt){
    const s = this.state;
    // The card switch is an animation: it finishes in real time, even on pause.
    if (s.switching > 0){
      s.switching = Math.max(0, s.switching - dt);
      if (!s.switching){
        if (s.screen === 'last' && !s.current) this.endTurn();
        else if (this.playing){ s.enter = true; this.changed(); }
      }
    }
    if (s.overlay || s.rotated) return;
    if (s.screen === 'countdown'){
      const before = Math.ceil(s.countLeft / 1000);
      s.countLeft -= dt;
      if (s.countLeft <= 0) this.beginTurn();
      else if (Math.ceil(s.countLeft / 1000) !== before){ this.emit('sound', 'count'); this.emit('change'); }
    } else if (s.screen === 'turn' && !this.held){
      const before = Math.ceil(s.timeLeft / 1000);
      s.timeLeft = Math.max(0, s.timeLeft - dt);
      const after = Math.ceil(s.timeLeft / 1000);
      if (after !== before && after > 0 && after <= this.params.WARNING_SECONDS) this.emit('sound', 'tick');
      // Time cannot run out in the middle of a card switch: the next card must be on screen first.
      if (s.timeLeft <= 0 && !s.switching) this.goLast();
      else this.emit('tick');
    }
  }

  goLast(){
    this.state.screen = 'last';
    this.emit('sound', 'buzz');
    this.changed();
  }

  endTurn(){
    const s = this.state;
    s.screen = 'summary';
    s.overlay = null; s.prevOverlay = null;
    this.emit('wake', false);
    this.changed();
  }

  toggleResult(i){
    const c = this.state.turnCards[i];
    if (!c || this.state.screen !== 'summary') return;
    c.res = c.last ? (c.res === 'ok' ? 'miss' : 'ok') : (c.res === 'ok' ? 'skip' : 'ok');
    this.changed();
  }

  nextTurn(){
    const s = this.state;
    if (s.screen !== 'summary') return;
    this.team.score += this.points();
    const n = this.next();
    s.turnTeam = n.team; s.round = n.round;
    s.turnCards = []; s.current = null; s.flipped = false;
    if (n.final) this.toFinal();
    else { s.screen = 'handoff'; this.changed(); }
  }

  toFinal(){
    const s = this.state;
    s.screen = 'final'; s.overlay = null; s.newRecord = false;
    if (this.solo && s.teams[0].score > this.record){
      this.record = s.teams[0].score;
      s.newRecord = true;
    }
    this.emit('sound', 'fanfare');
    this.changed();
    this.emit('final');
  }

  // Final standings: teams sorted by score, tied teams share a place.
  standings(){
    const sorted = this.state.teams.map((t, i) => ({...t, i})).sort((a, b) => b.score - a.score);
    let place = 0, prev = null;
    sorted.forEach((t, idx) => { if (t.score !== prev){ place = idx + 1; prev = t.score; } t.place = place; });
    const top = sorted.length ? sorted[0].score : 0;
    return {sorted, top, winners: sorted.filter(t => t.score === top)};
  }

  pause(){
    const s = this.state;
    if (!PAUSABLE.includes(s.screen) || s.overlay) return false;
    s.overlay = 'pause';
    this.emit('wake', false);
    this.changed();
    return true;
  }

  resume(){
    const s = this.state;
    if (s.overlay !== 'pause') return;
    s.overlay = null;
    if (this.playing) this.emit('wake', true);
    this.changed();
  }

  askExit(){
    const s = this.state;
    s.prevOverlay = s.overlay;
    s.overlay = 'confirm';
    this.changed();
  }

  cancelExit(){
    const s = this.state;
    s.overlay = s.prevOverlay;
    s.prevOverlay = null;
    this.changed();
  }

  setRotated(on){
    if (this.state.rotated === on) return;
    this.state.rotated = on;
    this.changed();
  }

  /* deck: cards do not repeat until the whole deck has been played, across games */
  buildDeck(){
    let ids = this.cardIds.filter(id => !this.played.has(id));
    if (!ids.length){ this.played.clear(); ids = this.cardIds.slice(); }
    return shuffle(ids, this.rng);
  }

  draw(){
    const s = this.state;
    if (!s.deck.length) this.reshuffle();
    const id = s.deck.pop();
    this.played.add(id);
    return id;
  }

  reshuffle(){
    const s = this.state;
    const exclude = new Set(s.turnCards.map(c => c.id));
    if (s.current) exclude.add(s.current);
    let rest = this.cardIds.filter(id => !exclude.has(id));
    if (!rest.length) rest = this.cardIds.filter(id => id !== s.current);
    this.played = new Set(exclude);
    s.deck = shuffle(rest, this.rng);
    this.emit('toast', 'Колода перемешана');
  }

  /* persistence */
  serialize(){
    return {...this.state, switching: 0, enter: false};
  }

  // A restored turn comes back paused; a countdown goes back to the hand-off screen.
  // Saved data comes from an older release or a damaged store: anything that does not fit is dropped.
  restore(saved){
    if (!saved || !RESTORABLE.includes(saved.screen)) return false;
    if (!Array.isArray(saved.teams) || !saved.teams.length || saved.teams.length > MAX_TEAMS) return false;
    const known = id => this.cardIds.includes(id);
    const s = this.state = Object.assign(freshState(), saved, {switching: 0, enter: false, rotated: false, prevOverlay: null});
    s.teams = saved.teams.map((t, i) => ({
      name: String(t && t.name || '').trim() || TEAM_NAMES[i], color: TEAM_COLORS[i], score: Number(t && t.score) || 0,
    }));
    s.turnTeam = Number.isInteger(s.turnTeam) && s.turnTeam >= 0 && s.turnTeam < s.teams.length ? s.turnTeam : 0;
    s.round = Number.isInteger(s.round) && s.round >= 1 ? s.round : 1;
    s.deck = Array.isArray(s.deck) ? s.deck.filter(known) : [];
    s.turnCards = Array.isArray(s.turnCards) ? s.turnCards.filter(c => c && known(c.id) && ['ok', 'skip', 'miss'].includes(c.res)) : [];
    if (!known(s.current)){ s.current = null; s.flipped = false; }
    if (!['pause', 'confirm'].includes(s.overlay)) s.overlay = null;
    if (s.screen === 'countdown'){ s.screen = 'handoff'; s.overlay = null; }
    if (s.screen === 'summary') s.overlay = null;
    if (this.playing){
      if (s.screen === 'turn' && !s.current) s.current = this.draw();
      if (s.screen === 'last' && !s.current){ s.screen = 'summary'; s.overlay = null; }
      else s.overlay = 'pause';
    }
    return true;
  }
}
