import {test} from 'node:test';
import assert from 'node:assert/strict';
import {artSVG} from '../js/art.js';
import {CARDS} from '../js/cards.js';

test('every card renders a complete SVG', () => {
  for (const card of CARDS){
    const svg = artSVG(card);
    assert.match(svg, /^<svg viewBox="0 0 200 180"/, card.id);
    assert.ok(svg.endsWith('</svg>'), card.id);
    assert.doesNotMatch(svg, /undefined|NaN|null/, card.id);
  }
});

test('art is cached per card', () => {
  assert.equal(artSVG(CARDS[0]), artSVG(CARDS[0]));
});
