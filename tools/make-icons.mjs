// Draws the app icons from a deck character: npm run icons (needs Playwright with Chromium).
// Writes icons/icon-180.png (apple-touch-icon), icon-192.png, icon-512.png, icon-maskable-512.png and favicon.svg.
import {createRequire} from 'node:module';
import {writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {artSVG, INK} from '../js/art.js';
import {CARD} from '../js/cards.js';
import {SYSTEMS} from '../js/config.js';

const require = createRequire(import.meta.url);
const {chromium} = require('playwright');
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CHARACTER = 'runny';
const GOLD = '#FFC53D';

const card = CARD[CHARACTER];
const inner = artSVG(card).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

// maskable icons keep everything inside the central circle of 80% diameter
function iconSVG(size, {maskable = false} = {}){
  const k = maskable ? 1.7 : 2.2;
  const w = 200 * k, h = 180 * k;
  const x = (512 - w) / 2, y = (512 - h) / 2 + (maskable ? 14 : 22);
  const [bx, by, br] = maskable ? [352, 150, 44] : [410, 102, 58];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">` +
    `<rect width="512" height="512" fill="${SYSTEMS[card.sys].color}"/>` +
    `<g transform="translate(${x} ${y}) scale(${k})">${inner}</g>` +
    `<circle cx="${bx}" cy="${by}" r="${br}" fill="${GOLD}" stroke="${INK}" stroke-width="${br / 5.5}"/>` +
    `<text x="${bx}" y="${by + br * .42}" text-anchor="middle" font-family="Unbounded, 'Arial Black', sans-serif" font-weight="900" font-size="${br * 1.3}" fill="${INK}">?</text>` +
    '</svg>';
}

await mkdir(join(ROOT, 'icons'), {recursive: true});
await writeFile(join(ROOT, 'icons/favicon.svg'), iconSVG(512));

const fontsCSS = pathToFileURL(join(ROOT, 'css/fonts.css')).href;
const browser = await chromium.launch();
const page = await browser.newPage({deviceScaleFactor: 1});
for (const [file, size, opts] of [['icon-180.png', 180], ['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512, {maskable: true}]]){
  await page.setViewportSize({width: size, height: size});
  await page.setContent(`<!doctype html><link rel="stylesheet" href="${fontsCSS}"><style>html,body{margin:0}svg{display:block}</style>${iconSVG(size, opts)}`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('svg').first().screenshot({path: join(ROOT, 'icons', file)});
}
await browser.close();
console.log('icons written to icons/');
