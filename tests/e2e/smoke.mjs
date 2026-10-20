// Plays the game in Chromium at iPhone and desktop sizes; fails on console errors, overflow or broken rules.
// Run: npm run e2e (needs Playwright with Chromium installed). Screenshots go to tests/e2e/out/.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PARAMS, TIMING} from '../../js/config.js';

const require = createRequire(import.meta.url);
const {chromium} = require('playwright');

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = join(ROOT, 'tests/e2e/out');
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2'};
const PHONES = [
  {name: 'se-safari', width: 375, height: 548},
  {name: 'iphone17-safari', width: 402, height: 750},
  {name: 'promax', width: 440, height: 956},
];
const DESKTOP = {name: 'desktop', width: 1280, height: 800};

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(ROOT, path.endsWith('/') ? path + 'index.html' : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, {'content-type': TYPES[extname(file)] || 'application/octet-stream'});
    res.end(body);
  } catch {
    res.writeHead(404); res.end();
  }
});
await new Promise(r => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}/`;
await mkdir(OUT, {recursive: true});

// Game time is driven by page.clock; these follow js/config.js so the test survives retuning.
const ROUND_MS = PARAMS.ROUND_SECONDS * 1000;
const WARN_MS = PARAMS.WARNING_SECONDS * 1000;
const SWITCH_MS = PARAMS.CARD_SWITCH_MS + 50;
const FLIP_MS = PARAMS.FLIP_MS + 150;
const COUNTDOWN_MS = PARAMS.COUNTDOWN_SECONDS * 1000 + 200;

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };

async function open(browser, vp, {mobile = true} = {}){
  const ctx = await browser.newContext({viewport: {width: vp.width, height: vp.height}, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile});
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('request', r => { if (!r.url().startsWith(BASE)) page.errors.push('external request: ' + r.url()); });
  page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.clock.install();
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.scr.home');
  return {ctx, page};
}

// Everything on the current screen fits: no sideways scroll, nothing hangs below the screen.
async function fits(page, label){
  const r = await page.evaluate(() => {
    const scr = document.querySelector('.scr');
    const box = document.querySelector('.screen').getBoundingClientRect();
    const overflowX = document.documentElement.scrollWidth > innerWidth;
    const below = [...scr.children].filter(el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().bottom > box.bottom + 1)
      .map(el => el.className || el.tagName);
    return {overflowX, below};
  });
  check(!r.overflowX, `${label}: horizontal scroll`);
  check(!r.below.length, `${label}: below the screen: ${r.below.join(', ')}`);
}
// Every card name fits the real card on this screen: no word is cut in the middle (soft hyphens are fine).
// Solo mode: the complaints side of every card fits the card on this screen.
async function frontsFit(page, label){
  const bad = await page.evaluate(async () => {
    const {CARDS} = await import('./js/cards.js');
    const {soloCardHTML} = await import('./js/render.js');
    await document.fonts.ready;
    const wrap = document.querySelector('.cardwrap');
    const keep = wrap.innerHTML, out = [];
    for (const c of CARDS){
      wrap.innerHTML = soloCardHTML(c.id);
      const front = wrap.querySelector('.front');
      if (front.scrollHeight > front.clientHeight + 1) out.push(`${c.name} (+${front.scrollHeight - front.clientHeight}px)`);
    }
    wrap.innerHTML = keep;
    return out;
  });
  check(!bad.length, `${label}: solo fronts overflow: ${bad.join(', ')}`);
}

async function namesFit(page, label){
  const bad = await page.evaluate(async () => {
    const {CARDS} = await import('./js/cards.js');
    const {cardHTML} = await import('./js/render.js');
    await document.fonts.ready;
    const wrap = document.querySelector('.cardwrap');
    const keep = wrap.innerHTML, out = [];
    for (const c of CARDS){
      wrap.innerHTML = cardHTML(c.id);
      const name = wrap.querySelector('.name'), width = name.clientWidth;
      const probe = document.createElement('span');
      probe.style.cssText = `font:${getComputedStyle(name).font}; white-space:nowrap; position:absolute; visibility:hidden`;
      document.body.append(probe);
      for (const part of c.name.split(/[\s\u00AD]+/)){
        probe.textContent = part + '-';
        if (probe.getBoundingClientRect().width > width + 1) out.push(`${part} (${Math.round(probe.getBoundingClientRect().width)} > ${width})`);
      }
      probe.remove();
      if (parseFloat(getComputedStyle(name).fontSize) < 28) out.push(`${c.name}: font ${getComputedStyle(name).fontSize}`);
    }
    wrap.innerHTML = keep;
    return out;
  });
  check(!bad.length, `${label}: names do not fit: ${bad.join(', ')}`);
}
// Real-time pause before a tap, like a person: a tap right after a screen change at the same spot counts as a double tap.
async function tap(page, selector){
  await page.waitForTimeout(TIMING.SCREEN_GUARD_MS + 60);
  await page.click(selector);
}
const shot = (page, name) => page.screenshot({path: join(OUT, name + '.png')});
const text = (page, sel) => page.locator(sel).first().innerText();
async function countdown(page){ await page.clock.runFor(COUNTDOWN_MS); await page.waitForSelector('.scr.turn'); }

async function teamsGame(browser, vp, mobile){
  const {ctx, page} = await open(browser, vp, {mobile});
  const L = vp.name;
  await fits(page, `${L} home`); await shot(page, `${L}-1-home`);
  await tap(page, '[data-a="toSetup"]');
  await tap(page, '[data-a="addTeam"]');
  await tap(page, '[data-a="addTeam"]');
  await fits(page, `${L} setup 4 teams`); await shot(page, `${L}-2-setup`);
  await tap(page, '[data-a="rmTeam"][data-i="3"]');
  await tap(page, '[data-a="rmTeam"][data-i="2"]');
  // two quick taps on the same screen both count: the double-tap guard only acts across screens
  const fewer = page.locator('[data-a="step"][data-k="ROUNDS"][data-d="-1"]');
  await fewer.click(); await fewer.click();
  check(await page.locator('.opt .stepper output').nth(1).innerText() === '1', `${L}: two quick taps on «−» both count`);
  await tap(page, '[data-a="start"]');
  await fits(page, `${L} handoff`); await shot(page, `${L}-3-handoff`);

  await tap(page, '[data-a="startTurn"]');
  await countdown(page);
  await fits(page, `${L} turn`); await shot(page, `${L}-4-turn`);
  await namesFit(page, L);
  await tap(page, '[data-a="ok"]'); await page.clock.runFor(SWITCH_MS);
  await tap(page, '[data-a="skip"]'); await page.clock.runFor(SWITCH_MS);
  // swipe up
  const box = await page.locator('.card').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 120, {steps: 6});
  await page.mouse.up();
  await page.clock.runFor(SWITCH_MS);
  check(await text(page, '.runsum') === '+1', `${L}: turn score after ok, skip, swipe up should be +1`);
  await page.clock.runFor(ROUND_MS - WARN_MS + 500 - 3 * SWITCH_MS);
  check(await page.locator('.scr.turn.warn').count() === 1, `${L}: warning in the last seconds`);
  await page.clock.runFor(WARN_MS);
  await page.waitForSelector('.scr.last');
  await fits(page, `${L} last word`); await shot(page, `${L}-5-last`);
  check((await text(page, '.ans.skip')).includes('Не угадали'), `${L}: last word skip label`);
  await tap(page, '[data-a="skip"]'); await page.clock.runFor(SWITCH_MS);
  await page.waitForSelector('.scr.summary');
  await fits(page, `${L} summary`); await shot(page, `${L}-6-summary`);
  check(await text(page, '.sumhead .big') === '+1', `${L}: summary total`);
  await tap(page, '[data-a="toggle"][data-i="1"]');
  check(await text(page, '.sumhead .big') === '+3', `${L}: fixing a skip gives +3`);
  await tap(page, '[data-a="next"]');
  check(await page.locator('.board li.cur .tn').innerText() === 'Хирурги', `${L}: second team's turn`);

  await tap(page, '[data-a="startTurn"]');
  await countdown(page);
  await page.clock.runFor(ROUND_MS + 1000);
  await tap(page, '[data-a="ok"]'); await page.clock.runFor(SWITCH_MS);
  await tap(page, '[data-a="next"]');
  await page.waitForSelector('.scr.final');
  await page.clock.runFor(800);
  await fits(page, `${L} final`); await shot(page, `${L}-7-final`);
  check((await text(page, '.final h2')).includes('Терапевты'), `${L}: Терапевты win 3:1`);
  check(!page.errors.length, `${L}: console errors: ${page.errors.join(' | ')}`);
  await ctx.close();
}

async function soloGame(browser, vp){
  const {ctx, page} = await open(browser, vp);
  const L = vp.name + '-solo';
  await tap(page, '[data-a="toSetup"]');
  await tap(page, '[data-a="rmTeam"][data-i="1"]');
  await tap(page, '[data-a="step"][data-k="ROUNDS"][data-d="-1"]');
  await tap(page, '[data-a="step"][data-k="ROUNDS"][data-d="-1"]');
  await tap(page, '[data-a="start"]');
  await tap(page, '[data-a="startTurn"]');
  await countdown(page);
  await fits(page, `${L} front`); await shot(page, `${L}-1-front`);
  await frontsFit(page, L);
  check(await page.locator('.ans.ok').isDisabled(), `${L}: answers disabled before the flip`);
  await tap(page, '.card.flip');
  await page.clock.runFor(FLIP_MS);
  await fits(page, `${L} back`); await shot(page, `${L}-2-back`);
  const t1 = await text(page, '.tsec');
  await page.clock.runFor(5000);
  check(await text(page, '.tsec') === t1, `${L}: timer stands while the answer is shown`);
  check(await page.locator('.scr.turn.held').count() === 1, `${L}: held state shown`);
  await tap(page, '[data-a="ok"]'); await page.clock.runFor(SWITCH_MS);
  check(await page.locator('.card.flip:not(.is-flipped)').count() === 1, `${L}: next card comes face down`);
  await page.clock.runFor(ROUND_MS + 1000);
  await page.waitForSelector('.scr.last');
  await tap(page, '.card.flip'); await page.clock.runFor(FLIP_MS);
  await tap(page, '[data-a="skip"]'); await page.clock.runFor(SWITCH_MS);
  await tap(page, '[data-a="next"]');
  await page.waitForSelector('.scr.final');
  await page.clock.runFor(800);
  await fits(page, `${L} final`); await shot(page, `${L}-3-final`);
  check(await text(page, '.recnum') === '1', `${L}: solo result is 1`);
  check((await text(page, '.final')).includes('Новый рекорд'), `${L}: first result is a record`);
  check(!page.errors.length, `${L}: console errors: ${page.errors.join(' | ')}`);
  await ctx.close();
}

async function pauseAndRestore(browser){
  const {ctx, page} = await open(browser, PHONES[1]);
  await tap(page, '[data-a="toSetup"]');
  await tap(page, '[data-a="start"]');
  await tap(page, '[data-a="startTurn"]');
  await countdown(page);
  await page.clock.runFor(10_000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {value: true, configurable: true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  check(await page.locator('.ov .sheet h3').innerText() === 'Пауза', 'leaving Safari pauses the turn');
  const t = await text(page, '.tsec');
  await page.clock.runFor(5000);
  check(await text(page, '.tsec') === t, 'timer stands on pause');
  await page.reload();
  await page.waitForSelector('.scr.turn');
  check(await page.locator('.ov .sheet h3').innerText() === 'Пауза', 'reload restores the turn paused');
  check(await text(page, '.tsec') === t, 'reload keeps the time left');
  check(!(await page.locator('#toast').isHidden()), 'restored game shows a toast');
  await tap(page, '[data-a="resume"]');
  await page.clock.runFor(2000);
  check(Number(await text(page, '.tsec')) < Number(t), 'timer runs after resume');
  await tap(page, '[data-a="pause"]');
  await page.waitForTimeout(TIMING.SCREEN_GUARD_MS + 60);
  const exitBox = await page.locator('.ov [data-a="askExit"]').boundingBox();
  await page.mouse.click(exitBox.x + exitBox.width / 2, exitBox.y + exitBox.height / 2);
  await page.mouse.click(exitBox.x + exitBox.width / 2, exitBox.y + exitBox.height / 2);
  const confirmShown = await page.locator('.ov .sheet h3', {hasText: 'Закончить игру?'}).count() === 1;
  check(confirmShown, 'a double tap on «Закончить игру» stops at the confirmation');
  if (confirmShown) await tap(page, '[data-a="exit"]');
  await page.waitForSelector('.scr.home');
  check(!page.errors.length, `pause: console errors: ${page.errors.join(' | ')}`);
  await ctx.close();
}

// Second visit without network: the service worker serves the whole game, fonts included.
async function offline(browser){
  const ctx = await browser.newContext({viewport: {width: 402, height: 750}, isMobile: true, hasTouch: true});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE);
  await page.waitForSelector('.scr.home');
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, {timeout: 10_000});
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('.scr.home');
  await page.evaluate(() => document.fonts.ready);
  check(await page.evaluate(() => document.fonts.check('800 32px Unbounded', 'Угадай') && document.fonts.check('700 18px Nunito', 'Объясняй')), 'offline: fonts load from the cache');
  await tap(page, '[data-a="toSetup"]');
  await tap(page, '[data-a="start"]');
  await tap(page, '[data-a="startTurn"]');
  await page.waitForSelector('.scr.turn', {timeout: 6000});
  check(await page.locator('.card .art svg').count() === 1, 'offline: a card is drawn');
  check(!errors.length, `offline: console errors: ${errors.join(' | ')}`);
  await page.screenshot({path: join(OUT, 'offline-turn.png')});
  await ctx.close();
}

async function deckPage(browser){
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE + 'deck.html');
  await page.waitForSelector('.dcard');
  check(await page.locator('.dcard').count() === 60, 'deck page shows 60 cards');
  check(!errors.length, `deck page errors: ${errors.join(' | ')}`);
  await page.screenshot({path: join(OUT, 'deck.png'), fullPage: true});
  await ctx.close();
}

// Playing on a computer: ↑/space — guessed, ↓ — skip, Esc — pause; in solo mode the first key flips the card.
async function keyboard(browser){
  const {ctx, page} = await open(browser, DESKTOP, {mobile: false});
  await tap(page, '[data-a="toSetup"]');
  await tap(page, '[data-a="start"]');
  await tap(page, '[data-a="startTurn"]');
  await countdown(page);
  await page.keyboard.press('ArrowUp'); await page.clock.runFor(SWITCH_MS);
  await page.keyboard.press(' '); await page.clock.runFor(SWITCH_MS);
  await page.keyboard.press('ArrowDown'); await page.clock.runFor(SWITCH_MS);
  check(await text(page, '.runsum') === '+1', 'keyboard: ↑, space, ↓ give +1');
  await page.keyboard.press('Escape');
  check(await page.locator('.ov .sheet h3').innerText() === 'Пауза', 'keyboard: Esc pauses');
  await page.keyboard.press('Escape');
  check(await page.locator('.ov').count() === 0, 'keyboard: Esc resumes');
  await tap(page, '[data-a="pause"]');
  await tap(page, '.ov [data-a="askExit"]');
  await tap(page, '[data-a="exit"]');
  await tap(page, '[data-a="toSetup"]');
  await tap(page, '[data-a="rmTeam"][data-i="1"]');
  await tap(page, '[data-a="start"]');
  await tap(page, '[data-a="startTurn"]');
  await countdown(page);
  await page.keyboard.press('ArrowUp'); await page.clock.runFor(FLIP_MS);
  check(await page.locator('.card.is-flipped').count() === 1 && await text(page, '.runsum') === '0', 'keyboard: in solo the first key flips, not answers');
  await page.keyboard.press('ArrowUp'); await page.clock.runFor(SWITCH_MS);
  check(await text(page, '.runsum') === '+1', 'keyboard: in solo the second key answers');
  check(!page.errors.length, `keyboard: console errors: ${page.errors.join(' | ')}`);
  await ctx.close();
}

async function rotation(browser){
  const {ctx, page} = await open(browser, {width: 750, height: 402});
  check(await page.locator('.ov.rot').count() === 1, 'landscape phone shows the rotate hint');
  await page.setViewportSize({width: 402, height: 750});
  const gone = await page.waitForSelector('.ov.rot', {state: 'detached', timeout: 3000}).then(() => true, () => false);
  check(gone, 'back to portrait hides the rotate hint');
  await page.setViewportSize({width: 750, height: 402});
  await shot(page, 'landscape');
  await ctx.close();
}

const browser = await chromium.launch();
try {
  for (const vp of PHONES){ await teamsGame(browser, vp, true); await soloGame(browser, vp); }
  await teamsGame(browser, DESKTOP, false);
  await pauseAndRestore(browser);
  await keyboard(browser);
  await rotation(browser);
  await offline(browser);
  await deckPage(browser);
} catch (e) {
  failures.push('crashed: ' + (e.stack || e.message));
} finally {
  await browser.close();
  server.close();
}
if (failures.length){
  console.error('E2E FAILED\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log(`E2E passed: ${PHONES.length} phone sizes + desktop, all card names and solo fronts fit, solo, pause/restore, double tap, keyboard, rotation, offline, deck page. Screenshots: tests/e2e/out/`);
