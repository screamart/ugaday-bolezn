import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game, shuffle, freeTeamName} from '../js/game.js';
import {PARAMS} from '../js/config.js';

const IDS = Array.from({length: 12}, (_, i) => 'c' + i);

function make(opts = {}){
  const events = [];
  const g = new Game({cardIds: IDS, params: {...PARAMS, ...opts.params}, played: opts.played, record: opts.record,
    rng: () => 0.42, emit: (type, payload) => events.push([type, payload])});
  g.events = events;
  g.has = (type, payload) => events.some(([t, p]) => t === type && (payload === undefined || p === payload));
  return g;
}
function playTurn(g, names = ['A', 'B']){
  if (g.state.screen === 'home') g.startGame(names);
  g.startTurn();
  g.tick(PARAMS.COUNTDOWN_SECONDS * 1000);
  assert.equal(g.state.screen, 'turn');
}
const settle = g => g.tick(PARAMS.CARD_SWITCH_MS);

test('guessed is +1, skip is −1, and the penalty can be turned off', () => {
  const g = make();
  playTurn(g);
  g.answer('ok'); settle(g);
  g.answer('skip'); settle(g);
  g.answer('ok'); settle(g);
  assert.equal(g.points(), 1);
  g.params.SKIP_PENALTY = 0;
  assert.equal(g.points(), 2);
});

test('score can go negative', () => {
  const g = make();
  playTurn(g);
  for (let i = 0; i < 3; i++){ g.answer('skip'); settle(g); }
  assert.equal(g.points(), -3);
});

test('countdown leads into the turn and draws a card', () => {
  const g = make();
  g.startGame(['A', 'B']);
  g.startTurn();
  assert.equal(g.state.screen, 'countdown');
  g.tick(PARAMS.COUNTDOWN_SECONDS * 1000 - 1);
  assert.equal(g.state.screen, 'countdown');
  g.tick(1);
  assert.equal(g.state.screen, 'turn');
  assert.ok(g.state.current);
  assert.ok(g.has('wake', true));
});

test('without countdown the turn starts at once', () => {
  const g = make({params: {COUNTDOWN_SECONDS: 0}});
  g.startGame(['A']);
  g.startTurn();
  assert.equal(g.state.screen, 'turn');
});

test('input during the card switch is ignored (spam protection)', () => {
  const g = make();
  playTurn(g);
  assert.equal(g.answer('ok'), 'ok');
  for (let i = 0; i < 9; i++) assert.equal(g.answer('ok'), null);
  settle(g);
  assert.equal(g.state.turnCards.length, 1);
  assert.equal(g.answer('ok'), 'ok');
});

test('time out gives a last word; not guessed there is 0 and ends the turn', () => {
  const g = make();
  playTurn(g);
  g.tick(PARAMS.ROUND_SECONDS * 1000);
  assert.equal(g.state.screen, 'last');
  assert.ok(g.has('sound', 'buzz'));
  assert.equal(g.answer('skip'), 'miss');
  settle(g);
  assert.equal(g.state.screen, 'summary');
  assert.equal(g.points(), 0);
  assert.ok(g.has('wake', false));
});

test('time cannot run out during a card switch', () => {
  const g = make();
  playTurn(g);
  g.tick(PARAMS.ROUND_SECONDS * 1000 - 100);
  g.answer('ok');
  g.tick(150);
  assert.equal(g.state.screen, 'turn');
  g.tick(PARAMS.CARD_SWITCH_MS);
  assert.equal(g.state.screen, 'last');
  assert.ok(g.state.current, 'the new card becomes the last word');
});

test('warning ticks in the last seconds', () => {
  const g = make();
  playTurn(g);
  g.tick((PARAMS.ROUND_SECONDS - PARAMS.WARNING_SECONDS) * 1000 + 10);
  assert.ok(g.warning);
  const ticks = () => g.events.filter(([t, p]) => t === 'sound' && p === 'tick').length;
  const before = ticks();
  g.tick(1000);
  assert.equal(ticks(), before + 1);
});

test('solo: cannot answer before the flip; time stands while the card is face up', () => {
  const g = make();
  playTurn(g, ['Мы']);
  assert.ok(g.solo);
  assert.equal(g.answer('ok'), null);
  g.tick(5000);
  const t = g.state.timeLeft;
  assert.ok(g.flip());
  assert.ok(g.held);
  g.tick(10_000);
  assert.equal(g.state.timeLeft, t, 'timer stands while face up');
  assert.equal(g.answer('skip'), 'skip');
  settle(g);
  assert.equal(g.state.flipped, false, 'next card comes face down');
  assert.equal(g.state.timeLeft, t - PARAMS.CARD_SWITCH_MS, 'timer runs again right after the answer');
  assert.equal(g.points(), -1);
});

test('solo: time runs out only while the card is face down; the last word can be flipped', () => {
  const g = make();
  playTurn(g, ['Мы']);
  g.tick(PARAMS.ROUND_SECONDS * 1000);
  assert.equal(g.state.screen, 'last');
  assert.ok(g.flip());
  assert.equal(g.answer('skip'), 'miss');
});

test('rounds pass from team to team and end in the final', () => {
  const g = make({params: {ROUNDS: 2}});
  g.startGame(['A', 'B']);
  const order = [];
  while (g.state.screen !== 'final'){
    order.push(`${g.state.round}:${g.state.turnTeam}`);
    g.startTurn(); g.tick(PARAMS.COUNTDOWN_SECONDS * 1000);
    g.answer('ok'); settle(g);
    g.tick(PARAMS.ROUND_SECONDS * 1000);
    g.answer('ok'); settle(g);
    g.nextTurn();
  }
  assert.deepEqual(order, ['1:0', '1:1', '2:0', '2:1']);
  assert.deepEqual(g.state.teams.map(t => t.score), [4, 4]);
  const st = g.standings();
  assert.equal(st.winners.length, 2, 'a tie has two winners');
  assert.deepEqual(st.sorted.map(t => t.place), [1, 1]);
  assert.ok(g.has('final'));
});

test('fixing an answer on the summary changes the score', () => {
  const g = make();
  playTurn(g);
  g.answer('skip'); settle(g);
  g.tick(PARAMS.ROUND_SECONDS * 1000);
  g.answer('skip'); settle(g);
  assert.equal(g.points(), -1);
  g.toggleResult(0);
  g.toggleResult(1);
  assert.deepEqual(g.state.turnCards.map(c => c.res), ['ok', 'ok']);
  assert.equal(g.points(), 2);
  g.toggleResult(1);
  assert.equal(g.state.turnCards[1].res, 'miss', 'the last word toggles between ok and 0');
});

test('solo record is kept and flagged when beaten', () => {
  const g = make({params: {ROUNDS: 1}, record: 1});
  g.startGame(['Мы']);
  g.startTurn(); g.tick(PARAMS.COUNTDOWN_SECONDS * 1000);
  for (let i = 0; i < 2; i++){ g.flip(); g.answer('ok'); settle(g); }
  g.tick(PARAMS.ROUND_SECONDS * 1000);
  g.flip(); g.answer('skip'); settle(g);
  g.nextTurn();
  assert.equal(g.state.screen, 'final');
  assert.equal(g.record, 2);
  assert.ok(g.state.newRecord);
});

test('pause stops time; resume continues', () => {
  const g = make();
  playTurn(g);
  g.tick(1000);
  assert.ok(g.pause());
  const t = g.state.timeLeft;
  g.tick(5000);
  assert.equal(g.state.timeLeft, t);
  assert.equal(g.answer('ok'), null, 'no answers on pause');
  g.resume();
  g.tick(1000);
  assert.equal(g.state.timeLeft, t - 1000);
});

test('rotated phone stops time', () => {
  const g = make();
  playTurn(g);
  g.setRotated(true);
  const t = g.state.timeLeft;
  g.tick(3000);
  assert.equal(g.state.timeLeft, t);
  g.setRotated(false);
  g.tick(1000);
  assert.equal(g.state.timeLeft, t - 1000);
});

test('exit asks first; cancel returns to the previous overlay', () => {
  const g = make();
  playTurn(g);
  g.pause();
  g.askExit();
  assert.equal(g.state.overlay, 'confirm');
  g.cancelExit();
  assert.equal(g.state.overlay, 'pause');
  g.askExit();
  g.home();
  assert.equal(g.state.screen, 'home');
  assert.equal(g.state.teams.length, 0);
});

test('cards do not repeat until the deck is used up, across games', () => {
  const g = make();
  const seen = new Set();
  g.startGame(['A']);
  for (let k = 0; k < IDS.length; k++){
    const id = g.draw();
    assert.ok(!seen.has(id), 'no repeats');
    seen.add(id);
    if (k === 5){ g.startGame(['A']); }
  }
  assert.equal(seen.size, IDS.length);
  const g2 = make({played: [...g.played].slice(0, 10)});
  g2.startGame(['A']);
  assert.equal(g2.state.deck.length, 2, 'played cards are left out of a new game');
});

test('when the deck runs out it reshuffles without the cards of this turn', () => {
  const g = make();
  playTurn(g);
  const first = g.state.current;
  g.state.deck = [];
  g.answer('ok'); settle(g);
  assert.ok(g.has('toast', 'Колода перемешана'));
  assert.notEqual(g.state.current, first);
  assert.ok(!g.state.deck.includes(first));
});

test('restore: a running turn comes back paused, a countdown goes back to hand-off', () => {
  const g = make();
  playTurn(g);
  g.tick(2000);
  const saved = JSON.parse(JSON.stringify(g.serialize()));
  const g2 = make();
  assert.ok(g2.restore(saved));
  assert.equal(g2.state.screen, 'turn');
  assert.equal(g2.state.overlay, 'pause');
  assert.equal(g2.state.timeLeft, g.state.timeLeft);

  const g3 = make();
  g3.startGame(['A', 'B']); g3.startTurn();
  const g4 = make();
  g4.restore(JSON.parse(JSON.stringify(g3.serialize())));
  assert.equal(g4.state.screen, 'handoff');

  assert.equal(make().restore({screen: 'setup'}), false);
});

test('empty team names fall back to defaults; at most 4 teams', () => {
  const g = make();
  g.startGame(['', '  ', 'Мы', 'Они', 'Лишние']);
  assert.deepEqual(g.state.teams.map(t => t.name), ['Терапевты', 'Хирурги', 'Мы', 'Они']);
});

test('restore drops what an older release or a damaged store left behind', () => {
  const g = make();
  playTurn(g);
  const saved = JSON.parse(JSON.stringify(g.serialize()));
  saved.current = 'gone';
  saved.deck = ['gone', ...saved.deck];
  saved.turnCards = [{id: 'gone', res: 'ok'}, {id: IDS[0], res: 'ok'}, {id: IDS[1], res: '??'}];
  saved.turnTeam = 7;
  const g2 = make();
  assert.ok(g2.restore(saved));
  assert.ok(IDS.includes(g2.state.current), 'an unknown card is replaced');
  assert.ok(g2.state.deck.every(id => IDS.includes(id)));
  assert.deepEqual(g2.state.turnCards.map(c => c.id), [IDS[0]]);
  assert.equal(g2.state.turnTeam, 0);
  const g3 = make();
  assert.ok(g3.restore({...saved, screen: 'handoff', overlay: 'nonsense'}));
  assert.equal(g3.state.overlay, null, 'an unknown overlay is dropped');
  assert.equal(make().restore({screen: 'turn', teams: 'x'}), false);
  assert.equal(make().restore({screen: 'nowhere', teams: [{name: 'A'}]}), false);
  assert.ok(make({played: ['gone', IDS[0]]}).played.size === 1, 'unknown played cards are forgotten');
});

test('solo: a face-up card that left the deck comes back as a new face-down card', () => {
  const g = make();
  playTurn(g, ['Мы']);
  g.flip();
  const saved = {...JSON.parse(JSON.stringify(g.serialize())), current: 'gone'};
  const g2 = make();
  g2.restore(saved);
  assert.equal(g2.state.flipped, false);
  assert.equal(g2.held, false);
});

test('a last word answered just before the app was closed restores to a clean summary', () => {
  const g = make();
  playTurn(g);
  g.tick(PARAMS.ROUND_SECONDS * 1000);
  g.answer('ok');
  g.pause();
  const g2 = make();
  g2.restore(JSON.parse(JSON.stringify(g.serialize())));
  assert.equal(g2.state.screen, 'summary');
  assert.equal(g2.state.overlay, null);
});

test('a finished game is not restored', () => {
  const g = make({params: {ROUNDS: 1}});
  g.startGame(['Мы']); g.startTurn(); g.tick(PARAMS.COUNTDOWN_SECONDS * 1000);
  g.tick(PARAMS.ROUND_SECONDS * 1000); g.flip(); g.answer('ok'); settle(g); g.nextTurn();
  assert.equal(g.state.screen, 'final');
  assert.equal(make().restore(JSON.parse(JSON.stringify(g.serialize()))), false);
});

test('pausing during the last answer does not leave the pause over the summary', () => {
  const g = make();
  playTurn(g);
  g.tick(PARAMS.ROUND_SECONDS * 1000);
  g.answer('ok');
  assert.ok(g.pause());
  settle(g);
  assert.equal(g.state.screen, 'summary');
  assert.equal(g.state.overlay, null);
});

test('a record that is not beaten is not flagged as new', () => {
  const g = make({params: {ROUNDS: 1}, record: 5});
  g.startGame(['Мы']); g.startTurn(); g.tick(PARAMS.COUNTDOWN_SECONDS * 1000);
  g.tick(PARAMS.ROUND_SECONDS * 1000); g.flip(); g.answer('ok'); settle(g); g.nextTurn();
  assert.equal(g.state.newRecord, false);
  assert.equal(g.record, 5);
});

test('a new team gets a default name nobody uses yet', () => {
  assert.equal(freeTeamName(['Хирурги']), 'Терапевты');
  assert.equal(freeTeamName(['Терапевты', 'Хирурги']), 'Лоры');
  assert.equal(freeTeamName(['Хирурги', 'Лоры', 'Мы']), 'Терапевты');
});

test('shuffle keeps every item', () => {
  assert.deepEqual(shuffle(IDS).sort(), IDS.slice().sort());
});
