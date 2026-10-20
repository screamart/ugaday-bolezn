// Screen templates and in-place DOM updates. Templates read the game and the ui settings; they never change state.
import {SYSTEMS, LIMITS, TIMING, TEAM_COLORS, MAX_TEAMS, TEAM_NAME_MAX} from './config.js';
import {CARD} from './cards.js';
import {artSVG} from './art.js';
import {ICON} from './icons.js';

const HOME_FAN = [['diarrhea', -13, -92], ['runny', 12, 92], ['caries', 0, 0]];

export const esc = s => String(s).replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));
export const sign = n => n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0';
export function plural(n, forms){
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}
const rounds = n => `${n} ${plural(n, ['круг', 'круга', 'кругов'])}`;
const diagnoses = n => plural(n, ['диагноз', 'диагноза', 'диагнозов']);

// Longest part of the name that cannot break; .name in game.css shrinks the font only if it does not fit.
const nameLen = name => Math.max(...name.split(/[\s\u00AD]+/).map(w => w.length));
const nameHTML = name => `<p class="name" style="--len:${nameLen(name)}">${name}</p>`;

export function cardHTML(id, cls = ''){
  const c = CARD[id], sys = SYSTEMS[c.sys];
  return `<div class="card ${cls}" style="--sys:${sys.color}"><div class="art">${artSVG(c)}<span class="chip">${sys.name}</span></div>` +
    `<div class="info">${nameHTML(c.name)}<div class="lbl">Жалобы:</div><ul>${c.hints.map(h => `<li>${h}</li>`).join('')}</ul></div><div class="tint"></div></div>`;
}

// Solo mode: complaints on the front, picture and name on the back.
export function soloCardHTML(id, cls = '', flipped = false){
  const c = CARD[id], sys = SYSTEMS[c.sys];
  return `<div class="card flip ${flipped ? 'is-flipped' : ''} ${cls}" style="--sys:${sys.color}"${flipped ? '' : ' data-a="flip" role="button" aria-label="Перевернуть карточку"'}><div class="flipper">` +
    `<div class="face front"><div class="fq"><span class="qmark">?</span>Что за болезнь?</div><div class="lbl">Жалобы:</div><ul>${c.hints.map(h => `<li>${h}</li>`).join('')}</ul><span class="taphint">${ICON.flip}Нажмите, чтобы проверить</span></div>` +
    `<div class="face back"><div class="art">${artSVG(c)}<span class="chip">${sys.name}</span></div><div class="info">${nameHTML(c.name)}</div></div>` +
    `</div><div class="tint"></div></div>`;
}

function mini(id, r, x){
  const c = CARD[id];
  return `<div class="mini" style="--r:${r}deg; --x:${x}px; --sys:${SYSTEMS[c.sys].color}"><div class="art">${artSVG(c)}</div><div class="mn">${c.name}</div></div>`;
}

export function turnHint(g){
  const last = g.state.screen === 'last';
  if (g.solo && !g.state.flipped) return last ? 'Время вышло: переверните последнюю карточку' : 'Назовите болезнь, потом нажмите на карточку';
  if (last) return g.solo ? 'Последнее слово: угадали — +1, нет — 0' : 'Время вышло: угадают эту карточку — +1, нет — 0';
  return g.solo ? 'Таймер стоит, пока не ответите. Свайп вверх — угадали, вниз — нет' : 'Свайп вверх — угадали, вниз — пропуск';
}

const topbar = (left, mid) => `<div class="topbar">${left}<span class="g-eyebrow">${mid}</span><span class="spacer"></span></div>`;
const backBtn = `<button class="iconbtn" data-a="home" aria-label="Назад">${ICON.back}</button>`;

function scrHome(g, ui){
  return `<div class="scr home">
    <div class="fan">${HOME_FAN.map(([id, r, x]) => mini(id, r, x)).join('')}</div>
    <h1 class="title"><span class="t1">Угадай</span><span class="t2">болезнь</span></h1>
    <p class="tag">Объясняй симптомы, команда ставит диагноз. Кто поставит больше?</p>
    <div class="grow"></div>
    <button class="btn big" data-a="toSetup">Играть</button>
    <button class="btn ghost" data-a="toRules">Как играть</button>
    <div class="foot"><span>Игра шуточная, не медицинский справочник.</span><button class="iconbtn" data-a="toggleSound" aria-label="${ui.soundOn ? 'Выключить звук' : 'Включить звук'}">${ui.soundOn ? ICON.sound : ICON.mute}</button></div>
  </div>`;
}

function scrRules(g){
  return `<div class="scr rules">
    ${topbar(backBtn, 'Правила')}
    <h2 class="g-h">Как играть</h2>
    <ol class="steps">
      <li>Разбейтесь на команды. Если команда одна, это игра на рекорд: на карточке только жалобы, а ответ открывается по нажатию.</li>
      <li>Объясняющий описывает болезнь, не называя её и однокоренные слова.</li>
      <li>Угадали — «Угадали» или свайп вверх. Не получается — «Пропуск» или свайп вниз, это −1.</li>
      <li>Время вышло — последнее слово. Потом телефон переходит следующей команде.</li>
    </ol>
    <p class="goal">Побеждает команда, которая поставит больше диагнозов за ${rounds(g.params.ROUNDS)}.</p>
    <div class="grow"></div>
    <button class="btn big" data-a="toSetup">Понятно, играем</button>
  </div>`;
}

function stepper(key, label, value){
  const {min, max, step} = LIMITS[key], cur = value;
  return `<div class="opt"><span>${label}</span><span class="stepper">` +
    `<button data-a="step" data-k="${key}" data-d="${-step}" aria-label="Меньше"${cur <= min ? ' disabled' : ''}>−</button>` +
    `<output>${cur}${key === 'ROUND_SECONDS' ? ' с' : ''}</output>` +
    `<button data-a="step" data-k="${key}" data-d="${step}" aria-label="Больше"${cur >= max ? ' disabled' : ''}>+</button></span></div>`;
}

function scrSetup(g, ui){
  const teams = ui.setupTeams, P = g.params;
  const rows = teams.map((name, i) => `<div class="team"><span class="dot" style="background:${TEAM_COLORS[i]}"></span>` +
    `<input id="team-${i}" data-team="${i}" value="${esc(name)}" maxlength="${TEAM_NAME_MAX}" aria-label="Название команды ${i + 1}" autocomplete="off" enterkeyhint="done">` +
    (teams.length > 1 ? `<button class="rm" data-a="rmTeam" data-i="${i}" aria-label="Убрать команду">${ICON.x}</button>` : '') + '</div>').join('');
  return `<div class="scr setup">
    ${topbar(backBtn, 'Новая игра')}
    <div class="scroll">
      <div class="sect"><h3>Команды${teams.length === 1 ? ' · игра на рекорд' : ''}</h3>${rows}
        ${teams.length === 1 ? '<p class="solonote">Одна команда: на карточке только жалобы, ответ открывается по нажатию.</p>' : ''}
        ${teams.length < MAX_TEAMS ? '<button class="addteam" data-a="addTeam">+ Добавить команду</button>' : ''}</div>
      <div class="sect"><h3>Правила</h3>
        ${stepper('ROUND_SECONDS', 'Время хода', P.ROUND_SECONDS)}
        ${stepper('ROUNDS', 'Кругов', P.ROUNDS)}
        <div class="opt"><span>Штраф за пропуск<small>${P.SKIP_PENALTY ? 'Пропуск отнимает очко' : 'Пропуск бесплатный'}</small></span><button class="switch" role="switch" aria-checked="${!!P.SKIP_PENALTY}" data-a="toggleSkip" aria-label="Штраф за пропуск"></button></div>
        <div class="opt"><span>Звук</span><button class="switch" role="switch" aria-checked="${ui.soundOn}" data-a="toggleSound" aria-label="Звук"></button></div>
      </div>
    </div>
    <button class="btn big" data-a="start">Поехали</button>
  </div>`;
}

function scrHandoff(g){
  const s = g.state, t = g.team;
  return `<div class="scr handoff">
    ${topbar(`<button class="iconbtn" data-a="askExit" aria-label="Закончить игру">${ICON.x}</button>`, `Круг ${s.round} из ${g.params.ROUNDS}`)}
    <div class="ticket" style="--tc:${t.color}"><span class="tk-l">${g.solo ? 'Ваш ход' : 'Ход команды'}</span><span class="tk-n">${esc(t.name)}</span></div>
    <p class="say">${g.solo ? 'Читайте жалобы и называйте болезнь. Чтобы проверить ответ, нажмите на карточку.' : 'Передайте телефон тому, кто объясняет. Остальным не подглядывать!'}</p>
    <ul class="board">${s.teams.map((x, i) => `<li class="${i === s.turnTeam ? 'cur' : ''}"><span class="dot" style="background:${x.color}"></span><span class="tn">${esc(x.name)}</span><span class="sc">${x.score}</span></li>`).join('')}</ul>
    <div class="grow"></div>
    <button class="btn big" data-a="startTurn">Начать ход · ${g.params.ROUND_SECONDS} с</button>
  </div>`;
}

function scrCount(g){
  return `<div class="scr count"><p class="g-eyebrow">${esc(g.team.name)}</p><div class="num">${Math.max(1, Math.ceil(g.state.countLeft / 1000))}</div><p class="say">Приготовились!</p></div>`;
}

function scrTurn(g){
  const s = g.state, t = g.team, last = s.screen === 'last';
  const closed = g.solo && !s.flipped;
  const pct = s.turnTotal ? s.timeLeft / s.turnTotal * 100 : 100;
  const card = s.current ? (g.solo ? soloCardHTML(s.current, s.enter ? 'enter' : '', s.flipped) : cardHTML(s.current, s.enter ? 'enter' : '')) : '';
  const skipLabel = last || g.solo ? 'Не угадали' : 'Пропуск';
  return `<div class="scr turn ${g.warning ? 'warn' : ''} ${last ? 'last' : ''} ${g.held ? 'held' : ''}">
    <div class="topbar"><div class="teamtag"><span class="dot" style="background:${t.color}"></span><span class="nm">${esc(t.name)}</span><span class="runsum">${sign(g.points())}</span></div><button class="iconbtn" data-a="pause" aria-label="Пауза">${ICON.pause}</button></div>
    <div class="thermo" style="--seg:${Math.max(1, Math.round(s.turnTotal / 1000 / TIMING.THERMO_TICK_SECONDS))}" role="timer" aria-label="Осталось секунд"><div class="bulb"><span class="tsec">${g.secondsLeft}</span></div><div class="tube"><div class="merc" style="width:${pct.toFixed(2)}%"></div><div class="ticks"></div><span class="hold">${ICON.pauseSm}пауза</span></div></div>
    <div class="cardwrap">${card}${last ? '<div class="lastbanner">Последнее слово!</div>' : ''}</div>
    <p class="hint">${turnHint(g)}</p>
    <div class="answers">
      <button class="ans skip" data-a="skip"${closed ? ' disabled' : ''}><span class="l">${ICON.cross}${skipLabel}</span><small>${last ? '0' : (g.params.SKIP_PENALTY ? '−1' : '0')}</small></button>
      <button class="ans ok" data-a="ok"${closed ? ' disabled' : ''}><span class="l">${ICON.check}Угадали</span><small>+1</small></button>
    </div>
  </div>`;
}

function resChip(c, penalty){
  if (c.res === 'ok') return `<span class="res ok">${ICON.check}+1</span>`;
  if (c.res === 'skip') return `<span class="res skip">${ICON.cross}${penalty ? '−1' : '0'}</span>`;
  return `<span class="res miss">${ICON.cross}0</span>`;
}

function scrSummary(g){
  const s = g.state, pts = g.points(), n = g.next();
  const ok = s.turnCards.filter(c => c.res === 'ok').length, miss = s.turnCards.length - ok;
  const nextLabel = n.final ? 'К результатам' : g.solo ? 'Следующий ход' : `Дальше: ${esc(s.teams[n.team].name)}`;
  const rows = s.turnCards.map((c, i) => {
    const k = CARD[c.id];
    return `<li><button class="srow" data-a="toggle" data-i="${i}" aria-label="${k.name}: изменить ответ"><span class="sart" style="--sys:${SYSTEMS[k.sys].color}">${artSVG(k)}</span>` +
      `<span class="sname">${k.name}${c.last ? '<small>последнее слово</small>' : ''}</span>${resChip(c, g.params.SKIP_PENALTY)}</button></li>`;
  }).join('');
  return `<div class="scr summary">
    ${topbar(`<button class="iconbtn" data-a="askExit" aria-label="Закончить игру">${ICON.x}</button>`, `Итоги хода · ${esc(g.team.name)}`)}
    <div class="sumhead"><span class="big">${sign(pts)}</span><span class="sumsub">${ok} ${plural(ok, ['угадана', 'угаданы', 'угадано'])}, ${miss} мимо</span></div>
    <ul class="slist">${rows}</ul>
    <p class="hint">Ошиблись с ответом? Нажмите на строку, чтобы исправить</p>
    <button class="btn big" data-a="next">${nextLabel}</button>
  </div>`;
}

function scrFinal(g){
  const s = g.state;
  const buttons = `<div class="grow"></div><button class="btn big" data-a="again">Ещё раз</button><button class="btn ghost" data-a="home">На главную</button>`;
  if (g.solo){
    const sc = s.teams[0].score;
    return `<div class="scr final"><canvas class="confetti"></canvas>
      <p class="hand">Выписка</p>
      <h2>Ваш результат</h2>
      <p class="recnum">${sc}</p>
      <p class="sub">${diagnoses(sc)} за ${rounds(g.params.ROUNDS)}</p>
      <p class="sub">${s.newRecord ? 'Новый рекорд!' : `Рекорд: ${g.record}`}</p>
      ${buttons}
    </div>`;
  }
  const {sorted, top, winners} = g.standings();
  const title = winners.length > 1 ? 'Ничья!' : `Победа: ${esc(winners[0].name)}`;
  const sub = winners.length > 1 ? `Победили все: ${winners.map(w => esc(w.name)).join(' и ')}` : `${top} ${diagnoses(top)}`;
  return `<div class="scr final"><canvas class="confetti"></canvas>
    <p class="hand">Выписка</p>
    <h2>${title}</h2>
    <p class="sub">${sub}</p>
    <ol class="rank">${sorted.map(t => `<li class="${t.score === top ? 'win' : ''}"><span class="place">${t.place}</span><span class="dot" style="background:${t.color}"></span><span class="tn">${esc(t.name)}</span><span class="sc">${t.score}</span></li>`).join('')}</ol>
    ${buttons}
  </div>`;
}

const SCREENS = {home: scrHome, rules: scrRules, setup: scrSetup, handoff: scrHandoff, countdown: scrCount, turn: scrTurn, last: scrTurn, summary: scrSummary, final: scrFinal};

export function renderScreen(g, ui){
  const s = g.state;
  let h = SCREENS[s.screen](g, ui);
  if (s.overlay === 'pause') h += `<div class="ov" role="dialog" aria-modal="true" aria-label="Пауза"><div class="sheet"><h3>Пауза</h3><p>${s.screen === 'countdown' ? 'Ход ещё не начался.' : `Таймер стоит на ${g.secondsLeft} с.`}</p><button class="btn big" data-a="resume">Продолжить</button><button class="btn ghost" data-a="askExit">Закончить игру</button></div></div>`;
  if (s.overlay === 'confirm') h += `<div class="ov" role="dialog" aria-modal="true" aria-label="Закончить игру"><div class="sheet"><h3>Закончить игру?</h3><p>Счёт этой партии пропадёт.</p><button class="btn big" data-a="cancelExit">Продолжить игру</button><button class="btn danger" data-a="exit">Закончить</button></div></div>`;
  if (s.rotated) h += `<div class="ov rot" role="dialog" aria-modal="true"><div class="rotbox">${ICON.phone}</div><p>Поверните телефон вертикально</p></div>`;
  return h;
}

// Called every frame during a turn: touches only the timer, never rebuilds the screen.
export function updateTimer(root, g){
  const scr = root.querySelector('.scr.turn');
  if (!scr) return;
  const s = g.state;
  scr.querySelector('.tsec').textContent = g.secondsLeft;
  scr.querySelector('.merc').style.width = (s.turnTotal ? s.timeLeft / s.turnTotal * 100 : 0).toFixed(2) + '%';
  scr.classList.toggle('held', g.held);
  scr.classList.toggle('warn', g.warning);
}

export function confetti(canvas, ink, durationMs){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c2d = canvas.getContext('2d');
  const W = canvas.width = (canvas.clientWidth || 400) * 2, H = canvas.height = (canvas.clientHeight || 800) * 2;
  const colors = Object.values(SYSTEMS).map(s => s.color).concat(['#FFFFFF']);
  const bits = Array.from({length: 150}, () => ({
    x: Math.random() * W, y: -Math.random() * H * .6, vx: (Math.random() - .5) * 5, vy: 3 + Math.random() * 6,
    r: Math.random() * 6, vr: (Math.random() - .5) * .3, w: 14 + Math.random() * 12, h: 8 + Math.random() * 8,
    c: colors[Math.floor(Math.random() * colors.length)], cross: Math.random() < .3,
  }));
  const start = performance.now();
  (function frame(now){
    if (!canvas.isConnected) return;
    c2d.clearRect(0, 0, W, H);
    for (const b of bits){
      b.x += b.vx; b.y += b.vy; b.vy += .06; b.r += b.vr;
      c2d.save(); c2d.translate(b.x, b.y); c2d.rotate(b.r);
      c2d.fillStyle = b.c; c2d.strokeStyle = ink; c2d.lineWidth = 2;
      if (b.cross){ c2d.fillRect(-b.w / 2, -3.5, b.w, 7); c2d.fillRect(-3.5, -b.w / 2, 7, b.w); }
      else { c2d.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); c2d.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h); }
      c2d.restore();
    }
    if (now - start < durationMs) requestAnimationFrame(frame);
    else c2d.clearRect(0, 0, W, H);
  })(start);
}
