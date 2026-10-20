import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CARDS} from '../js/cards.js';
import {SYSTEMS} from '../js/config.js';

const norm = s => s.toLowerCase().replace(/ё/g, 'е');
const words = s => norm(s).match(/[а-я]+/g) || [];

test('the deck has 60 cards with unique ids and names', () => {
  assert.equal(CARDS.length, 60);
  assert.equal(new Set(CARDS.map(c => c.id)).size, 60);
  assert.equal(new Set(CARDS.map(c => norm(c.name))).size, 60);
});

test('every card has a known organ system and 2–3 hints', () => {
  for (const c of CARDS){
    assert.ok(SYSTEMS[c.sys], `${c.id}: unknown system ${c.sys}`);
    assert.ok(c.hints.length >= 2 && c.hints.length <= 3, `${c.id}: ${c.hints.length} hints`);
    for (const h of c.hints) assert.ok(h.trim().length > 2, `${c.id}: empty hint`);
  }
});

// Catches the obvious cases only: a hint word that starts with the stem of a name word.
test('hints do not give away the name', () => {
  for (const c of CARDS){
    const stems = words(c.name).filter(w => w.length >= 4).map(w => w.slice(0, Math.max(4, Math.ceil(w.length * .6))));
    for (const h of c.hints){
      for (const w of words(h)){
        const hit = stems.find(st => w.startsWith(st));
        assert.ok(!hit, `${c.name}: hint "${h}" shares a root with the name`);
      }
    }
  }
});

// 11 letters of Unbounded at 32px fit the narrowest card (iPhone SE); longer words need a soft hyphen.
test('no unbreakable part of a name is longer than 11 letters', () => {
  for (const c of CARDS){
    for (const part of c.name.split(/[\s\u00AD]+/)) assert.ok(part.length <= 11, `${c.name}: "${part}" needs a soft hyphen`);
  }
});

test('every organ system has cards', () => {
  for (const key of Object.keys(SYSTEMS)) assert.ok(CARDS.some(c => c.sys === key), key);
});
