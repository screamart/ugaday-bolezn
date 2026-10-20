// SVG characters built from parts: body + limbs + face + props, on a card-coloured background.
import {SYSTEMS} from './config.js';

export const INK = '#24193B';

function blobD(cx, cy, r, lobes, wob, ph){
  let d = ''; const n = 72;
  for (let i = 0; i <= n; i++){
    const a = i / n * Math.PI * 2, rr = r * (1 + wob * Math.sin(lobes * a + ph));
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
  }
  return d + 'Z';
}
function union(parts, fill, w = 5){
  const under = parts.map(p => p.replace('{S}', `fill="${INK}" stroke="${INK}" stroke-width="${w * 2}" stroke-linejoin="round"`)).join('');
  const over = parts.map(p => p.replace('{S}', `fill="${fill}"`)).join('');
  return under + over;
}
const OL = `stroke="${INK}" stroke-width="5" stroke-linejoin="round"`;
const shine = (cx, cy, r) => `<path d="M${cx - r * .66} ${cy - r * .16} A${r * .72} ${r * .72} 0 0 1 ${cx - r * .2} ${cy - r * .64}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>`;
const line = (d, c = INK, w = 5) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const BODY = {
  stomach(a){
    const f = a.color || '#FF9DB0';
    const d = 'M80 34 C66 34 62 52 66 68 C70 84 58 104 68 122 C82 148 136 152 154 124 C168 102 158 78 134 80 C116 82 104 74 102 58 C100 44 94 34 80 34 Z';
    return {fill:f, svg:`<path d="${d}" fill="${f}" ${OL}/>` + line('M76 52 C72 66 70 80 72 92', '#fff', 5).replace('/>', ' opacity=".5"/>'),
      face:{x:116, y:108, s:1}, arms:[[68,108],[156,102]], legs:[[98,144],[132,138]], top:[84,32], ground:170};
  },
  gut(a){
    const f = a.color || '#FF9AAE', dk = '#D25A77';
    const coils = line('M60 70 q10 -14 22 -2 t22 -2 t22 -2 t20 4', dk) + line('M56 128 q10 12 22 0 t22 2 t22 -2 t22 2', dk) + line('M52 92 q-4 10 4 18', dk) + line('M148 90 q6 10 -2 20', dk);
    return {fill:f, svg:`<path d="${blobD(100, 98, 58, 9, .07, 0)}" fill="${f}" ${OL}/>` + coils,
      face:{x:100, y:98, s:1}, arms:[[48,104],[152,104]], legs:[[84,148],[116,148]], top:[100,40], ground:174};
  },
  blob(a){
    const f = a.color || '#FFC2D1', r = a.r || 54, cy = 94;
    return {fill:f, svg:`<path d="${blobD(100, cy, r, 5, .045, .6)}" fill="${f}" ${OL}/>` + shine(100, cy, r),
      face:{x:100, y:cy - 2, s:1}, arms:[[100 - r + 8, cy + 10],[100 + r - 8, cy + 10]], legs:[[84, cy + r - 10],[116, cy + r - 10]], top:[100, cy - r], ground:cy + r + 14};
  },
  virus(a){
    const f = a.color || '#9BE36B'; let sp = '';
    for (let k = 0; k < 11; k++){
      const ang = k / 11 * Math.PI * 2 - Math.PI / 2;
      if (Math.sin(ang) > .8) continue;
      const x2 = 100 + Math.cos(ang) * 68, y2 = 92 + Math.sin(ang) * 68;
      sp += line(`M${(100 + Math.cos(ang) * 44).toFixed(1)} ${(92 + Math.sin(ang) * 44).toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`) +
            `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="8" fill="${f}" stroke="${INK}" stroke-width="4"/>`;
    }
    const spots = [[72,70,6],[132,120,5],[128,62,4],[66,112,4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${a.spot || '#6FC447'}"/>`).join('');
    return {fill:f, svg:sp + `<circle cx="100" cy="92" r="50" fill="${f}" ${OL}/>` + spots + shine(100, 92, 50),
      face:{x:100, y:92, s:1}, arms:null, legs:[[86,136],[114,136]], top:[100,26], ground:164};
  },
  head(a){
    const f = a.color || '#FFD2B0';
    return {fill:f, svg:`<circle cx="46" cy="96" r="13" fill="${f}" ${OL}/><circle cx="154" cy="96" r="13" fill="${f}" ${OL}/><circle cx="100" cy="92" r="56" fill="${f}" ${OL}/>` + shine(100, 92, 56),
      face:{x:100, y:96, s:1.05}, arms:[[54,124],[146,124]], legs:[[86,142],[114,142]], top:[100,36], ground:168};
  },
  brain(a){
    const f = a.color || '#FFB3C7', dk = '#DE7896';
    const cs = [[68,78,28],[100,64,32],[134,76,28],[148,104,24],[124,124,26],[78,124,26],[54,104,24],[100,98,40]];
    const lines = line('M100 36 C96 46 104 54 100 62', dk, 4.5) + line('M58 84 q10 -12 22 0', dk, 4.5) + line('M122 64 q12 -6 20 6', dk, 4.5) + line('M136 118 q8 8 18 -2', dk, 4.5) + line('M62 120 q10 8 20 -2', dk, 4.5);
    return {fill:f, svg:union(cs.map(c => `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}" {S}/>`), f) + lines,
      face:{x:100, y:100, s:.95}, arms:[[52,112],[148,112]], legs:[[86,144],[114,144]], top:[100,32], ground:170};
  },
  nose(a){
    const f = a.color || '#FFC4A3';
    const d = 'M94 30 C88 58 72 88 62 110 C52 134 70 152 90 146 C98 158 110 158 116 148 C138 154 154 136 142 114 C130 92 116 60 110 30 C106 24 98 24 94 30 Z';
    return {fill:f, svg:`<path d="${d}" fill="${f}" ${OL}/><ellipse cx="86" cy="134" rx="7" ry="5" fill="#8C3A3A"/><ellipse cx="118" cy="134" rx="7" ry="5" fill="#8C3A3A"/>` + line('M98 44 C96 56 93 64 90 70', '#fff', 5).replace('/>', ' opacity=".5"/>'),
      face:{x:103, y:84, s:.8}, arms:[[72,112],[136,112]], legs:[[92,148],[114,148]], top:[102,26], ground:174, nostril:[86,140]};
  },
  ear(a){
    const f = a.color || '#FFC4A3';
    const d = 'M112 26 C70 22 50 60 56 96 C60 120 76 124 82 140 C88 160 116 162 124 142 C130 126 150 112 152 80 C154 46 138 28 112 26 Z';
    return {fill:f, svg:`<path d="${d}" fill="${f}" ${OL}/>` + line('M84 54 C68 70 70 96 84 106 C92 112 98 102 92 94', '#E0957A', 6),
      face:{x:118, y:78, s:.82}, arms:[[60,100],[150,96]], legs:[[96,150],[118,148]], top:[110,24], ground:176};
  },
  eye(a){
    const skin = '#FFD2B0', ir = a.iris || '#4FA3E8';
    let s = `<circle cx="100" cy="92" r="56" fill="#fff" ${OL}/>`;
    if ((a.props || []).includes('veins')){
      const v = '#E5484D';
      s += line('M50 104 q8 -6 14 0 t12 2', v, 2.6) + line('M150 104 q-8 -6 -14 0 t-12 2', v, 2.6) + line('M62 130 q8 -2 12 -9', v, 2.6) + line('M138 130 q-8 -2 -12 -9', v, 2.6) + line('M58 76 q8 2 12 8', v, 2.6) + line('M142 76 q-8 2 -12 8', v, 2.6);
    }
    s += `<circle cx="100" cy="98" r="25" fill="${ir}" stroke="${INK}" stroke-width="4"/><circle cx="100" cy="98" r="11" fill="${INK}"/><circle cx="92" cy="90" r="5" fill="#fff"/>`;
    if (a.lid === 'half' || a.lid === 'low'){
      const q = a.lid === 'half' ? 66 : 112;
      s += `<path d="M44 92 A56 56 0 0 1 156 92 Q100 ${q} 44 92 Z" fill="${skin}" ${OL}/>`;
      const ey = a.lid === 'half' ? 79 : 102;
      s += line(`M72 ${ey - 2} l-4 9 M100 ${ey + 1} l0 10 M128 ${ey - 2} l4 9`, INK, 4);
    } else {
      s += line('M64 30 q36 -16 72 0', INK, 5);
    }
    return {fill:'#fff', svg:s, face:null, arms:[[48,104],[152,104]], legs:[[84,144],[116,144]], top:[100,36], ground:170};
  },
  tooth(a){
    const d = 'M58 62 C56 38 76 32 90 38 C96 41 104 41 110 38 C124 32 144 38 142 62 C141 84 134 100 130 118 C126 140 122 156 112 156 C102 156 104 128 100 122 C96 128 98 156 88 156 C78 156 74 140 70 118 C66 100 59 84 58 62 Z';
    return {fill:'#FFFFFF', svg:`<path d="${d}" fill="#fff" ${OL}/>` + line('M70 52 C68 62 68 72 70 80', '#CFE3F1', 5),
      face:{x:100, y:80, s:.95}, arms:[[62,88],[138,88]], legs:null, top:[100,36], ground:162};
  },
  person(a){
    const f = a.color || '#FFD2B0';
    const parts = ['<circle cx="100" cy="56" r="32" {S}/>', '<rect x="66" y="80" width="68" height="66" rx="30" {S}/>'];
    return {fill:f, svg:union(parts, f),
      face:{x:100, y:58, s:.78}, arms:[[70,100],[130,100]], legs:[[86,140],[114,140]], top:[100,24], ground:166,
      spots:[[84,104],[112,112],[96,130],[120,92],[78,124],[88,38],[118,72],[106,96]]};
  },
  foot(a){
    const f = a.color || '#FFC4A3';
    const TOES = [[72,58,13],[92,46,11],[110,44,10],[126,48,9],[139,58,8]];
    const toes = TOES.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i === 0 && a.bigToe || f}" ${OL}/>`).join('');
    const nails = a.nails ? TOES.map(([x, y, r]) => `<ellipse cx="${x}" cy="${y - r * .35}" rx="${r * .55}" ry="${r * .4}" fill="${a.nails}" stroke="${INK}" stroke-width="2"/>`).join('') : '';
    const sole = `<path d="M62 76 C62 58 138 56 142 76 C146 104 138 130 126 148 C114 162 88 162 80 148 C68 128 62 104 62 76 Z" fill="${f}" ${OL}/>`;
    return {fill:f, svg:toes + nails + sole, face:{x:102, y:102, s:.95}, arms:[[66,106],[138,106]], legs:null, top:[100,32], ground:164};
  },
  lungs(a){
    const f = a.color || '#FF9DB0', dk = '#D9607C';
    // two lobes joined at the top by the bronchi, apart at the bottom
    const parts = ['<rect x="94" y="20" width="12" height="40" rx="6" {S}/>', '<rect x="86" y="52" width="28" height="56" rx="10" {S}/>',
      '<path d="M92 58 C70 44 46 64 42 98 C38 132 50 156 74 156 C88 156 94 146 94 128 L94 96 Z" {S}/>',
      '<path d="M108 58 C130 44 154 64 158 98 C162 132 150 156 126 156 C112 156 106 146 106 128 L106 96 Z" {S}/>'];
    return {fill:f, svg:union(parts, f) + line('M100 54 L80 74 M100 54 L120 74 M80 74 L70 92 M120 74 L130 92', dk, 4) + line('M54 92 C52 104 52 116 55 126', '#fff', 5).replace('/>', ' opacity=".5"/>'),
      face:{x:100, y:86, s:.85}, arms:[[46,112],[154,112]], legs:[[78,150],[122,150]], top:[100,20], ground:178};
  },
  leg(a){
    const f = a.color || '#FFD2B0';
    const d = 'M80 20 L122 20 C126 58 128 90 122 116 C120 126 120 134 124 140 L152 144 C166 146 166 168 150 168 L86 168 C74 168 70 160 74 148 C80 128 70 100 72 70 C73 50 76 34 80 20 Z';
    return {fill:f, svg:`<path d="${d}" fill="${f}" ${OL}/>` + line('M84 30 C82 50 82 64 84 76', '#fff', 5).replace('/>', ' opacity=".5"/>'),
      face:{x:100, y:62, s:.82}, arms:[[76,82],[124,82]], legs:null, top:[100,20], ground:172, calf:[84,104]};
  },
  bladder(a){
    const f = a.color || '#FFD36E';
    const d = 'M100 32 C140 32 158 64 156 96 C154 124 132 140 112 144 L112 160 L88 160 L88 144 C68 140 46 124 44 96 C42 64 60 32 100 32 Z';
    return {fill:f, svg:`<path d="${d}" fill="${f}" ${OL}/>` + shine(100, 92, 54),
      face:{x:100, y:90, s:1}, arms:[[48,104],[152,104]], legs:null, top:[100,32], ground:166};
  },
  liver(a){
    const f = a.color || '#D9607A';
    const d = 'M36 98 C34 64 98 50 160 62 C176 66 176 86 162 100 C136 126 84 146 56 134 C42 128 36 114 36 98 Z';
    return {fill:f, svg:`<path d="${d}" fill="${f}" ${OL}/>` + line('M114 60 C110 76 112 92 120 108', '#B4475F', 4.5) + line('M50 92 C52 80 60 72 72 68', '#fff', 5).replace('/>', ' opacity=".4"/>'),
      face:{x:86, y:94, s:.95}, arms:[[42,104],[160,90]], legs:[[74,132],[110,128]], top:[96,56], ground:158};
  },
  bone(a){
    const f = a.color || '#FFF2D8';
    const parts = ['<rect x="78" y="44" width="44" height="100" rx="12" {S}/>', '<circle cx="80" cy="44" r="18" {S}/>', '<circle cx="120" cy="44" r="18" {S}/>', '<circle cx="80" cy="144" r="18" {S}/>', '<circle cx="120" cy="144" r="18" {S}/>'];
    return {fill:f, svg:union(parts, f), face:{x:100, y:80, s:.72}, arms:[[82,106],[118,106]], legs:null, top:[100,24], ground:172};
  },
  ring(a, bg){
    const f = a.color || '#7FD0FF';
    const s = `<ellipse cx="100" cy="108" rx="76" ry="46" fill="${f}" ${OL}/>` + line('M36 92 Q44 76 62 70', '#fff', 9) + line('M138 70 Q156 76 164 92', '#fff', 9) +
              `<ellipse cx="100" cy="90" rx="28" ry="11" fill="${bg}" stroke="${INK}" stroke-width="4"/>`;
    return {fill:f, svg:s, face:{x:100, y:122, s:.82}, arms:[[30,110],[170,110]], legs:null, top:[100,62], ground:160};
  },
};

function eye(ex, ey, r, type, sd, fill){
  const W = `fill="#fff" stroke="${INK}" stroke-width="3.5"`;
  const pupil = (dx, dy, k) => `<circle cx="${ex + dx}" cy="${ey + dy}" r="${r * k}" fill="${INK}"/>`;
  switch (type){
    case 'wide': return `<circle cx="${ex}" cy="${ey}" r="${r * 1.2}" ${W}/>` + pupil(0, 0, .38);
    case 'tired': return `<circle cx="${ex}" cy="${ey}" r="${r}" ${W}/>` + pupil(0, r * .32, .46) + `<path d="M${ex - r - 1} ${ey} A${r + 1} ${r + 1} 0 0 1 ${ex + r + 1} ${ey} Z" fill="${fill}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
    case 'squeeze': return line(`M${ex + sd * r * .7} ${ey - r * .7} L${ex - sd * r * .7} ${ey} L${ex + sd * r * .7} ${ey + r * .7}`, INK, 4);
    case 'closed': return line(`M${ex - r} ${ey} Q${ex} ${ey + r * .9} ${ex + r} ${ey}`, INK, 4);
    case 'dizzy': { const k = r / 10.5; return `<circle cx="${ex}" cy="${ey}" r="${r}" ${W}/>` + line(`M${ex} ${ey} m${-1.5 * k} 0 a${1.5 * k} ${1.5 * k} 0 1 1 ${3 * k} 0 a${3.5 * k} ${3.5 * k} 0 1 1 ${-7 * k} 0 a${5.5 * k} ${5.5 * k} 0 1 1 ${11 * k} 0`, INK, 2.4); }
    case 'winkR':
      if (sd < 0) return `<circle cx="${ex}" cy="${ey}" r="${r}" ${W}/>` + pupil(1.5, 1, .5);
      return line(`M${ex - r} ${ey} Q${ex} ${ey + r * .9} ${ex + r} ${ey}`, INK, 4) + line(`M${ex + r + 4} ${ey - r} l6 -4 M${ex + r + 6} ${ey + 2} l8 0 M${ex + r + 4} ${ey + r} l6 4`, INK, 2.6);
    case 'teary': return `<circle cx="${ex}" cy="${ey}" r="${r}" ${W}/>` + pupil(-sd * 1.2, 1, .5) + `<circle cx="${ex - sd * 3}" cy="${ey - 3}" r="${r * .17}" fill="#fff"/>` + drop(ex + sd * r * .7, ey + r + 7, '#8FD8FF', .8);
    default: return `<circle cx="${ex}" cy="${ey}" r="${r}" ${W}/>` + pupil(-sd * 1.5, 1, .5) + `<circle cx="${ex - sd * 3.5}" cy="${ey - 2}" r="${r * .17}" fill="#fff"/>`;
  }
}
function mouth(x, y, s, type){
  const k = n => n * s;
  switch (type){
    case 'smile': return line(`M${x - k(11)} ${y - k(2)} Q${x} ${y + k(10)} ${x + k(11)} ${y - k(2)}`, INK, 4);
    case 'frown': return line(`M${x - k(10)} ${y + k(5)} Q${x} ${y - k(5)} ${x + k(10)} ${y + k(5)}`, INK, 4);
    case 'wavy': return line(`M${x - k(14)} ${y} q${k(3.5)} ${k(-5)} ${k(7)} 0 t${k(7)} 0 t${k(7)} 0 t${k(7)} 0`, INK, 4);
    case 'o': return `<ellipse cx="${x}" cy="${y + k(2)}" rx="${k(6)}" ry="${k(7.5)}" fill="#7A2238" stroke="${INK}" stroke-width="3.5"/>`;
    case 'grimace': return `<rect x="${x - k(14)}" y="${y - k(6)}" width="${k(28)}" height="${k(12)}" rx="${k(5)}" fill="#fff" stroke="${INK}" stroke-width="3.5"/>` + line(`M${x - k(14)} ${y} H${x + k(14)} M${x - k(5)} ${y - k(6)} V${y + k(6)} M${x + k(5)} ${y - k(6)} V${y + k(6)}`, INK, 2);
    case 'grin': return `<path d="M${x - k(17)} ${y - k(5)} Q${x} ${y + k(18)} ${x + k(17)} ${y - k(5)} Q${x} ${y + k(3)} ${x - k(17)} ${y - k(5)} Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` + line(`M${x - k(6)} ${y + k(1)} V${y + k(7)} M${x + k(6)} ${y + k(1)} V${y + k(7)}`, INK, 2);
    case 'zip': return line(`M${x - k(15)} ${y} H${x + k(15)}`, INK, 4) + line(Array.from({length: 7}, (_, i) => `M${x - k(12) + i * k(4)} ${y - k(3)} v${k(6)}`).join(' '), INK, 2) +
      `<rect x="${x + k(12)}" y="${y - k(2)}" width="${k(6)}" height="${k(11)}" rx="${k(2)}" fill="#C9D6E2" stroke="${INK}" stroke-width="2.5"/>`;
    case 'ouch': return `<ellipse cx="${x}" cy="${y + k(3)}" rx="${k(13)}" ry="${k(10)}" fill="#7A2238" stroke="${INK}" stroke-width="3.5"/>` +
      `<path d="M${x - k(8)} ${y + k(9)} Q${x} ${y + k(2)} ${x + k(8)} ${y + k(9)}" fill="#FF8FA3"/>` +
      `<circle cx="${x - k(6)}" cy="${y}" r="${k(2.4)}" fill="#fff"/><circle cx="${x + k(6)}" cy="${y + k(1)}" r="${k(2)}" fill="#fff"/>`;
    case 'thermo': return `<ellipse cx="${x}" cy="${y + k(2)}" rx="${k(5)}" ry="${k(6)}" fill="#7A2238" stroke="${INK}" stroke-width="3"/>` +
      line(`M${x + k(2)} ${y + k(1)} L${x + k(44)} ${y - k(14)}`, INK, 11) + line(`M${x + k(2)} ${y + k(1)} L${x + k(44)} ${y - k(14)}`, '#fff', 6) + line(`M${x + k(4)} ${y} L${x + k(24)} ${y - k(7)}`, '#E5372F', 3);
    default: return '';
  }
}
function face(F, a, fill){
  const {x, y, s} = F; let o = '';
  const dx = 17 * s, r = 10.5 * s;
  if (a.blush !== false) o += [-1, 1].map(sd => `<ellipse cx="${x + sd * 30 * s}" cy="${y + 14 * s}" rx="${7 * s}" ry="${4.5 * s}" fill="#FF6F8E" opacity=".45"/>`).join('');
  for (const sd of [-1, 1]) o += eye(x + sd * dx, y, r, a.eyes, sd, fill);
  const brows = a.brows || (['squeeze', 'teary', 'tired'].includes(a.eyes) ? 'worried' : '');
  for (const sd of [-1, 1]){
    const ex = x + sd * dx;
    if (brows === 'worried') o += line(`M${ex + sd * 8 * s} ${y - 15 * s} L${ex - sd * 7 * s} ${y - 21 * s}`, INK, 4);
    if (brows === 'evil') o += line(`M${ex + sd * 9 * s} ${y - 22 * s} L${ex - sd * 7 * s} ${y - 14 * s}`, INK, 4.5);
  }
  return o + mouth(x, y + 22 * s, s, a.mouth);
}
function limbs(B, pose){
  let o = ''; const hands = [];
  if (B.legs) B.legs.forEach(([x, y], i) => {
    const sd = i ? 1 : -1;
    o += line(`M${x} ${y} L${x + sd * 3} ${y + 20}`) + `<ellipse cx="${x + sd * 8}" cy="${y + 22}" rx="11" ry="6.5" fill="${INK}"/>`;
  });
  if (B.arms && pose !== 'none') B.arms.forEach(([x, y], i) => {
    const sd = i ? 1 : -1; let ex, ey, cx, cy;
    if (pose === 'up'){ ex = x + sd * 20; ey = y - 34; cx = x + sd * 32; cy = y - 2; }
    else if (pose === 'out'){ ex = x + sd * 36; ey = y - 6; cx = x + sd * 18; cy = y - 8; }
    else { ex = x + sd * 22; ey = y + 28; cx = x + sd * 28; cy = y + 2; }
    hands.push([ex, ey]);
    o += line(`M${x} ${y} Q${cx} ${cy} ${ex} ${ey}`) + `<circle cx="${ex}" cy="${ey}" r="7.5" fill="#fff" stroke="${INK}" stroke-width="4"/>`;
  });
  return {o, hands};
}
const drop = (x, y, c, k = 1) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 -10 C6 -2 7 4 0 7 C-7 4 -6 -2 0 -10 Z" fill="${c}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
const flame = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 -26 C14 -10 16 6 0 12 C-16 6 -14 -10 0 -26 Z" fill="#FF8A1F" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M0 -10 C7 -2 7 6 0 8 C-7 6 -7 -2 0 -10 Z" fill="#FFE14D"/></g>`;
const star = (x, y, r) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="#fff"/>`;
const bolt = (x, y) => `<path transform="translate(${x} ${y})" d="M4 -20 L-11 4 L0 4 L-6 24 L13 -4 L2 -4 L8 -20 Z" fill="#FFE14D" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
const icepack = (x, y) => `<g transform="translate(${x} ${y - 4}) rotate(-10)"><path d="M-34 6 C-34 -12 34 -16 34 4 C34 14 -34 16 -34 6 Z" fill="#8FD4FF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><rect x="26" y="-13" width="14" height="12" rx="3" fill="#5B7CFF" stroke="${INK}" stroke-width="3.5"/><rect x="-18" y="-4" width="8" height="8" rx="2" fill="#fff" opacity=".7"/><rect x="-4" y="-6" width="8" height="8" rx="2" fill="#fff" opacity=".7"/></g>`;

const bubble = (text) => `<path d="M124 40 C124 16 192 16 192 40 C192 58 150 60 142 58 L128 70 L132 55 C127 52 124 46 124 40 Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
  `<text x="158" y="46" text-anchor="middle" font-family="Unbounded, Arial Black, sans-serif" font-weight="900" font-size="${text.length > 4 ? 12 : 16}" fill="${INK}">${text}</text>`;
const cloud = (x, y, k, fill) => `<g transform="translate(${x} ${y}) scale(${k})">` + union(['<circle cx="-14" cy="2" r="10" {S}/>', '<circle cx="0" cy="-6" r="13" {S}/>', '<circle cx="15" cy="1" r="10" {S}/>', '<rect x="-22" y="0" width="44" height="12" rx="6" {S}/>'], fill, 3.5) + '</g>';
const heart = (x, y, k, fill) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 8 C-14 -2 -14 -14 -6 -14 C-2 -14 0 -10 0 -8 C0 -10 2 -14 6 -14 C14 -14 14 -2 0 8 Z" fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
const snowflake = (x, y, r) => `<g transform="translate(${x} ${y})">` + line(`M0 ${-r} V${r} M${-r * .87} ${-r / 2} L${r * .87} ${r / 2} M${-r * .87} ${r / 2} L${r * .87} ${-r / 2}`, INK, 5) + line(`M0 ${-r} V${r} M${-r * .87} ${-r / 2} L${r * .87} ${r / 2} M${-r * .87} ${r / 2} L${r * .87} ${-r / 2}`, '#fff', 2.5) + '</g>';
const capsule = (x, y, rot, c, letter) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-15" y="-7" width="30" height="14" rx="7" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M0 -7 H8 A7 7 0 0 1 8 7 H0 Z" fill="${c}"/><rect x="-15" y="-7" width="30" height="14" rx="7" fill="none" stroke="${INK}" stroke-width="3"/>` +
  `<text x="-7" y="4" text-anchor="middle" font-family="Unbounded, Arial Black, sans-serif" font-weight="900" font-size="10" fill="${INK}">${letter}</text></g>`;

// Props are drawn in three layers: back (behind everything), mid (on the body, under the face) and front.
function props(a, B, hands, bg){
  let back = '', mid = '', front = '';
  const [tx, ty] = B.top; const F = B.face || {x:100, y:92, s:1};
  const [lx, ly] = hands[0] || [40, 120], [rx, ry] = hands[1] || [160, 120];
  for (const p of a.props || []){
    switch (p){
      case 'flame': front += flame(tx - 18, ty + 2, 1) + flame(tx + 6, ty + 10, .6); break;
      case 'sweat': front += drop(F.x + 44 * F.s, F.y - 28 * F.s, '#8FD8FF', 1.1) + drop(F.x + 56 * F.s, F.y - 8 * F.s, '#8FD8FF', .8); break;
      case 'tp': { const [hx, hy] = hands[1] || [160, 120];
        front += line(`M${hx + 6} ${hy + 4} C${hx + 22} ${hy + 18} ${hx + 6} ${hy + 34} ${hx + 20} ${hy + 50}`, INK, 12) + line(`M${hx + 6} ${hy + 4} C${hx + 22} ${hy + 18} ${hx + 6} ${hy + 34} ${hx + 20} ${hy + 50}`, '#fff', 7) +
          `<g transform="translate(${hx + 4} ${hy - 4}) rotate(-12)"><rect x="-12" y="-14" width="24" height="28" rx="4" fill="#fff" stroke="${INK}" stroke-width="3.5"/><ellipse cx="0" cy="-14" rx="12" ry="5" fill="#fff" stroke="${INK}" stroke-width="3.5"/><ellipse cx="0" cy="-14" rx="4" ry="2" fill="#C9B79C"/></g>`; break; }
      case 'clock': back += `<circle cx="152" cy="18" r="5" fill="#FFE14D" stroke="${INK}" stroke-width="3"/><circle cx="176" cy="18" r="5" fill="#FFE14D" stroke="${INK}" stroke-width="3"/><circle cx="164" cy="32" r="16" fill="#fff" stroke="${INK}" stroke-width="4"/>` + line('M164 23 V32 L171 36', INK, 3); break;
      case 'puffs': front += union(['<circle cx="150" cy="150" r="9" {S}/>','<circle cx="160" cy="143" r="11" {S}/>','<circle cx="171" cy="150" r="9" {S}/>','<circle cx="179" cy="128" r="7" {S}/>','<circle cx="186" cy="122" r="8" {S}/>'], '#D9F2C4', 3.5); break;
      case 'icepack': front += icepack(tx, ty); break;
      case 'bubble': front += bubble(a.bubble); break;
      case 'drip': front += drop(B.nostril[0], B.nostril[1] + 10, '#B6F0FF', 1.2); break;
      case 'tissue': { const [hx, hy] = hands[0] || [40, 120]; front += `<path d="M${hx - 14} ${hy - 10} L${hx + 6} ${hy - 16} L${hx + 14} ${hy + 2} L${hx + 2} ${hy + 14} L${hx - 16} ${hy + 8} Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` + line(`M${hx - 6} ${hy - 8} L${hx} ${hy + 6}`, '#C9D6E2', 2.5); break; }
      case 'scarf': front += `<path d="M50 128 Q100 152 150 128 L153 143 Q100 168 47 143 Z" fill="#FF5A5A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M116 148 L130 178 L114 182 L104 152 Z" fill="#FF5A5A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` + line('M70 140 L72 152 M90 145 L91 158 M112 146 L111 158 M132 141 L130 152', '#fff', 4); break;
      case 'zzz': back += ['z|150|44|15', 'Z|163|30|20', 'Z|180|14|25'].map(t => { const [ch, x, y, fs] = t.split('|'); return `<text x="${x}" y="${y}" font-family="Unbounded, Arial Black, sans-serif" font-weight="900" font-size="${fs}" fill="#fff" stroke="${INK}" stroke-width="3.5" paint-order="stroke">${ch}</text>`; }).join(''); break;
      case 'nightcap': front += `<path d="M118 40 C146 26 168 40 174 74 L158 70 C154 56 144 48 128 54 Z" fill="#5B7CFF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M48 68 C50 30 150 30 152 68 Z" fill="#5B7CFF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` + line('M48 68 C80 76 120 76 152 68', INK, 13) + line('M48 68 C80 76 120 76 152 68', '#fff', 7) + `<circle cx="172" cy="78" r="9" fill="#fff" stroke="${INK}" stroke-width="4"/>` + star(82, 50, 5) + star(118, 46, 4); break;
      case 'bolt': { const [bx, by] = a.boltAt || [tx + 46, ty - 2]; front += bolt(bx, by); break; }
      case 'spots': front += (B.spots || []).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 4.5 : 6}" fill="#2FCB6B" stroke="${INK}" stroke-width="2.5"/>`).join(''); break;
      case 'sun': back += Array.from({length:8}, (_, i) => { const an = i / 8 * Math.PI * 2; return line(`M${(34 + Math.cos(an) * 21).toFixed(1)} ${(34 + Math.sin(an) * 21).toFixed(1)} L${(34 + Math.cos(an) * 29).toFixed(1)} ${(34 + Math.sin(an) * 29).toFixed(1)}`, INK, 3.5); }).join('') + `<circle cx="34" cy="34" r="15" fill="#FFF4B8" stroke="${INK}" stroke-width="4"/>`; break;
      case 'peel': front += [[84,112],[114,124],[110,92]].map(([x, y]) => `<path d="M${x} ${y} l7 -3 l4 6 l-6 4 z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`).join(''); break;
      case 'flakes': front += [[60,40],[138,34],[156,62],[42,70],[64,156],[136,158],[100,28],[160,130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#fff" stroke="${INK}" stroke-width="2"/>`).join(''); break;
      case 'hair': front += line(`M86 ${ty + 4} q2 -16 12 -8 q2 -16 14 -4`, INK, 4.5); break;
      case 'plaster': front += `<g transform="translate(84 70) rotate(-20)"><rect x="-24" y="-9" width="48" height="18" rx="9" fill="#F2C08F" stroke="${INK}" stroke-width="3.5"/><rect x="-8" y="-7" width="16" height="14" rx="3" fill="#E3A56E"/></g>`; break;
      case 'wave': front += `<path d="M-4 152 q14 -12 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 V184 H-4 Z" fill="#3FA9F5" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` + line('M20 166 q8 -5 16 0 M110 170 q8 -5 16 0', '#fff', 3); break;
      case 'moon': back += `<path d="M168 19.2 A16 16 0 1 0 172 46.5 A14 14 0 0 1 168 19.2 Z" fill="#FFE97A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` + star(30, 30, 6) + star(46, 52, 4) + star(182, 66, 4); break;
      case 'bump': front += `<circle cx="126" cy="80" r="10" fill="#FF6B6B" stroke="${INK}" stroke-width="3.5"/><circle cx="123" cy="77" r="3" fill="#fff" opacity=".7"/>`; break;
      case 'hole': front += `<path d="M120 98 C128 92 138 98 135 106 C132 114 120 114 118 108 C116 104 116 101 120 98 Z" fill="#5A3A2E" stroke="${INK}" stroke-width="2.5"/>` + line('M135 100 l6 -4 M134 110 l6 3', INK, 2.5); break;
      case 'tears': front += line('M64 128 q-6 16 0 30', '#8FD8FF', 7) + line('M136 128 q6 16 0 30', '#8FD8FF', 7) + drop(62, 166, '#8FD8FF', .8) + drop(138, 166, '#8FD8FF', .8); break;
      case 'belt': front += `<rect x="64" y="98" width="72" height="24" rx="9" fill="#A9774F" stroke="${INK}" stroke-width="4"/>` + line('M72 104 l4 6 M84 104 l4 6 M96 104 l4 6 M108 104 l4 6 M120 104 l4 6 M78 114 l4 4 M102 114 l4 4 M126 114 l4 4', '#D0A47A', 2.5); break;
      case 'bandage': front += `<path d="M62 126 L140 116 L142 136 L66 146 Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` + line('M84 124 L86 142 M104 121 L106 139 M124 119 L126 136', '#C9D6E2', 3); break;
      case 'cat': front += `<g transform="translate(160 146)"><path d="M-17 -6 L-14 -27 L-3 -15 Z M17 -6 L14 -27 L3 -15 Z" fill="#FF9A3D" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle r="18" fill="#FF9A3D" stroke="${INK}" stroke-width="3.5"/>` + line('M-11 -2 q4 -6 8 0 M3 -2 q4 -6 8 0', INK, 2.6) + line('M-3 7 q3 3 6 0', INK, 2.2) + line('M-20 3 h-10 M-20 8 h-9 M20 3 h10 M20 8 h9', INK, 2) + `<ellipse cx="0" cy="4" rx="2.6" ry="1.8" fill="#E0567A"/></g>`; break;
      case 'fishbone': front += `<g transform="translate(${rx - 8} ${ry - 26}) rotate(-60)">` + line('M-14 0 H16', INK, 3) + line('M-6 -7 L-2 0 L-6 7 M2 -8 L6 0 L2 8 M10 -7 L14 0 L10 7', INK, 2.5) +
        `<path d="M16 0 L27 -9 L27 9 Z" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="-19" cy="0" r="7" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="-21" cy="-1" r="1.8" fill="${INK}"/></g>`; break;
      case 'bowl': front += `<g transform="translate(${lx - 4} ${ry + 4})">` + line('M6 -6 L18 -22', INK, 4) + `<path d="M-20 -4 Q0 22 20 -4 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="0" cy="-4" rx="20" ry="5" fill="#F3E2B8" stroke="${INK}" stroke-width="3"/></g>`; break;
      case 'fork': front += `<g transform="translate(${rx + 2} ${ry - 4}) rotate(18)">` + line('M0 0 V-30', INK, 7) + line('M0 0 V-30', '#D7DEE8', 3) + line('M-6 -30 H6 M-6 -30 V-44 M0 -30 V-44 M6 -30 V-44', INK, 3) + `<circle cx="0" cy="-50" r="6" fill="#7BC96F" stroke="${INK}" stroke-width="2.5"/></g>`; break;
      case 'popbutton': front += `<circle cx="160" cy="112" r="7" fill="#C9A26B" stroke="${INK}" stroke-width="3"/><circle cx="158" cy="110" r="1.4" fill="${INK}"/><circle cx="162" cy="114" r="1.4" fill="${INK}"/>` + line('M168 104 l10 -6 M170 114 l12 0 M168 122 l10 6', INK, 2.5); break;
      case 'worm': front += line('M138 66 C150 46 168 52 170 34', INK, 17) + line('M138 66 C150 46 168 52 170 34', '#FFB0C8', 10) + `<circle cx="170" cy="30" r="10" fill="#FFB0C8" stroke="${INK}" stroke-width="3.5"/><circle cx="167" cy="28" r="1.8" fill="${INK}"/><circle cx="174" cy="28" r="1.8" fill="${INK}"/>` + line('M166 33 q4 3 8 0', INK, 2); break;
      case 'netipot': front += `<g transform="translate(${rx + 6} ${ry - 4})"><path d="M-10 -10 L10 -10 L13 10 L-13 10 Z" fill="#7FC8FF" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` + line('M-10 -6 L-24 -14', INK, 6) + line('M-10 -6 L-24 -14', '#7FC8FF', 2.5) + line('M10 -4 C20 -4 20 8 10 6', INK, 3) + '</g>' + drop(rx - 22, ry - 6, '#B6F0FF', .7); break;
      case 'thermometer': front += `<g transform="translate(26 76) rotate(-12)"><rect x="-7" y="-42" width="14" height="80" rx="7" fill="#fff" stroke="${INK}" stroke-width="4"/><rect x="-3" y="-30" width="6" height="62" rx="3" fill="#E5372F"/><circle cx="0" cy="44" r="12" fill="#E5372F" stroke="${INK}" stroke-width="4"/>` + line('M7 -26 h5 M7 -14 h5 M7 -2 h5 M7 10 h5', INK, 2) + '</g>'; break;
      case 'flower': front += `<g transform="translate(${rx + 4} ${ry - 22})">` + line('M0 8 V30', '#3E9B4F', 4) + [0, 72, 144, 216, 288].map(d => `<ellipse cx="0" cy="-9" rx="6" ry="9" transform="rotate(${d})" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`).join('') + `<circle r="6" fill="#FFC53D" stroke="${INK}" stroke-width="2.5"/></g>`; break;
      case 'pollen': front += [[150, 52], [164, 70], [138, 34], [176, 46], [128, 22], [58, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#FFE14D" stroke="${INK}" stroke-width="1.6"/>`).join(''); break;
      case 'pimples': mid += [[-30, -14], [26, -26], [34, 30], [-18, 36], [4, -40]].map(([dx, dy]) => `<circle cx="${F.x + dx * F.s}" cy="${F.y + dy * F.s}" r="5" fill="#FF6B6B" stroke="${INK}" stroke-width="2"/><circle cx="${F.x + dx * F.s - 1}" cy="${F.y + dy * F.s - 1.5}" r="1.6" fill="#fff"/>`).join(''); break;
      case 'wart': mid += `<circle cx="132" cy="64" r="9" fill="#B98A5E" stroke="${INK}" stroke-width="3"/><circle cx="129" cy="62" r="1.6" fill="#8A6040"/><circle cx="134" cy="66" r="1.4" fill="#8A6040"/>` + line('M132 55 l2 -6', INK, 2); break;
      case 'frog': front += `<g transform="translate(34 150)"><ellipse rx="20" ry="13" fill="#6FC447" stroke="${INK}" stroke-width="3.5"/><circle cx="-9" cy="-12" r="7" fill="#6FC447" stroke="${INK}" stroke-width="3"/><circle cx="9" cy="-12" r="7" fill="#6FC447" stroke="${INK}" stroke-width="3"/><circle cx="-9" cy="-12" r="2.6" fill="${INK}"/><circle cx="9" cy="-12" r="2.6" fill="${INK}"/>` + line('M-9 2 q9 6 18 0', INK, 2.5) + '</g>'; break;
      case 'mushroom': front += `<g transform="translate(166 150)"><rect x="-6" y="-6" width="12" height="18" rx="5" fill="#FFF4DE" stroke="${INK}" stroke-width="3"/><path d="M-18 -4 C-18 -24 18 -24 18 -4 Z" fill="#E5484D" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="-7" cy="-12" r="3" fill="#fff"/><circle cx="6" cy="-15" r="2.4" fill="#fff"/><circle cx="2" cy="-7" r="2" fill="#fff"/></g>`; break;
      case 'pits': mid += (B.arms || []).map(([x, y]) => `<ellipse cx="${x + (x < 100 ? 7 : -7)}" cy="${y + 4}" rx="8" ry="10" fill="#8FD8FF" stroke="${INK}" stroke-width="2"/>`).join(''); break;
      case 'welts': mid += (B.spots || []).map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${i % 2 ? 6 : 8}" ry="${i % 2 ? 4.5 : 6}" fill="#FF8FA3" stroke="${INK}" stroke-width="2"/>`).join(''); break;
      case 'strawberry': front += `<g transform="translate(${lx - 2} ${ly + 6})"><path d="M0 14 C-14 6 -14 -8 -8 -10 C-4 -11 4 -11 8 -10 C14 -8 14 6 0 14 Z" fill="#E5484D" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-8 -10 L-3 -15 L0 -10 L4 -15 L8 -10 Z" fill="#3E9B4F" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle cx="-4" cy="-2" r="1.2" fill="#FFE14D"/><circle cx="4" cy="1" r="1.2" fill="#FFE14D"/><circle cx="0" cy="6" r="1.2" fill="#FFE14D"/></g>`; break;
      case 'coldsore': front += [[0, 0, 3.6], [6, 3, 3], [2, 7, 2.6]].map(([dx, dy, r]) => `<circle cx="${F.x + 15 * F.s + dx}" cy="${F.y + 24 * F.s + dy}" r="${r}" fill="#FFC2C2" stroke="${INK}" stroke-width="1.8"/>`).join(''); break;
      case 'brokenheart': front += heart(162, 36, 1.5, '#FF5A6E') + line('M162 18 l-3 7 l5 5 l-4 8', '#fff', 2.5); break;
      case 'stars': front += `<ellipse cx="${tx}" cy="${ty + 4}" rx="48" ry="11" fill="none" stroke="#FFE14D" stroke-width="3" stroke-dasharray="6 6"/>` + [[tx - 40, ty + 8], [tx + 6, ty - 7], [tx + 44, ty + 6]].map(([x, y]) => `<path transform="translate(${x} ${y})" d="M0 -9 L2.6 -3 L9 -2.6 L4 1.8 L5.6 8 L0 4.6 L-5.6 8 L-4 1.8 L-9 -2.6 L-2.6 -3 Z" fill="#FFE14D" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`).join(''); break;
      case 'raincloud': front += line('M114 40 l-4 10 M130 42 l-4 10 M146 40 l-4 10 M122 54 l-3 8 M138 54 l-3 8', '#3F8FE0', 3) + cloud(132, 24, 1, '#C9D6E8'); break;
      case 'coffee': front += `<g transform="translate(${rx + 6} ${ry - 8})"><path d="M-10 -10 H10 L8 10 H-8 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` + line('M10 -5 C18 -5 18 5 9 5', INK, 3) + line('M-4 -14 q-3 -5 0 -9 M3 -14 q-3 -5 0 -9', '#fff', 2.5) + `<rect x="-8" y="-4" width="16" height="5" fill="#8A5A3C"/></g>`; break;
      case 'battery': front += `<g transform="translate(160 26)"><rect x="-17" y="-9" width="32" height="18" rx="4" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="15" y="-4" width="4" height="8" rx="1.5" fill="${INK}"/><rect x="-13" y="-5" width="7" height="10" rx="1.5" fill="#E5484D"/></g>`; break;
      case 'glasses': { const s = F.s, r = 15 * s, dx = 17 * s;
        front += [-1, 1].map(sd => `<circle cx="${F.x + sd * dx}" cy="${F.y}" r="${r}" fill="#fff" fill-opacity=".25" stroke="${INK}" stroke-width="4"/>`).join('') +
          line(`M${F.x - dx + r} ${F.y - 2} Q${F.x} ${F.y - 8} ${F.x + dx - r} ${F.y - 2} M${F.x - dx - r} ${F.y - 2} L${F.x - dx - r - 12} ${F.y - 6} M${F.x + dx + r} ${F.y - 2} L${F.x + dx + r + 12} ${F.y - 6}`, INK, 3.5); break; }
      case 'jawwrap': front += line('M56 62 C50 118 78 150 100 150 C122 150 150 118 144 62 C140 40 118 32 100 34 C82 32 60 40 56 62', INK, 18) + line('M56 62 C50 118 78 150 100 150 C122 150 150 118 144 62 C140 40 118 32 100 34 C82 32 60 40 56 62', '#fff', 12) +
          `<ellipse cx="90" cy="22" rx="7" ry="13" transform="rotate(-25 90 22)" fill="#fff" stroke="${INK}" stroke-width="3"/><ellipse cx="110" cy="22" rx="7" ry="13" transform="rotate(25 110 22)" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="100" cy="32" r="6" fill="#fff" stroke="${INK}" stroke-width="3"/>`; break;
      case 'swollen': mid += `<circle cx="140" cy="112" r="22" fill="${B.fill}" stroke="${INK}" stroke-width="5"/><circle cx="140" cy="112" r="17" fill="${B.fill}"/><ellipse cx="140" cy="116" rx="9" ry="6" fill="#FF6F8E" opacity=".55"/>`; break;
      case 'lemon': front += `<g transform="translate(${lx - 4} ${ly + 4}) rotate(-20)"><path d="M-16 0 C-16 -12 16 -12 16 0 C16 12 -16 12 -16 0 Z" fill="#FFE14D" stroke="${INK}" stroke-width="3"/><circle cx="-18" cy="0" r="3" fill="#FFE14D" stroke="${INK}" stroke-width="2.5"/><circle cx="18" cy="0" r="3" fill="#FFE14D" stroke="${INK}" stroke-width="2.5"/>` + line('M-8 -4 q6 -4 12 0', '#fff', 2.5) + '</g>'; break;
      case 'icecream': front += `<g transform="translate(${rx + 4} ${ry - 14}) rotate(12)"><path d="M-9 0 L9 0 L0 26 Z" fill="#E8B072" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` + line('M-5 6 L4 14 M5 6 L-3 16', '#C98A4E', 2) + `<circle cx="0" cy="-6" r="11" fill="#FFB0C8" stroke="${INK}" stroke-width="3"/><circle cx="-4" cy="-10" r="2.5" fill="#fff" opacity=".7"/></g>`; break;
      case 'shiver': front += line('M38 70 q-6 6 0 12 t0 12 M30 76 q-6 6 0 12 M162 70 q6 6 0 12 t0 12 M170 76 q6 6 0 12', '#3F8FE0', 3); break;
      case 'insole': back += `<path d="M58 160 C58 150 142 150 146 160 C146 170 58 170 58 160 Z" fill="#7FD0FF" stroke="${INK}" stroke-width="3.5"/>`; break;
      case 'crown': front += `<path transform="translate(${tx - 30} ${ty - 6})" d="M-14 8 L-16 -10 L-7 -2 L0 -14 L7 -2 L16 -10 L14 8 Z" fill="#FFC53D" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="${tx - 30}" cy="${ty - 18}" r="2.6" fill="#E5484D" stroke="${INK}" stroke-width="1.5"/>`; break;
      case 'cramp': { const [cx, cy] = B.calf || [84, 104]; front += line(`M${cx - 10} ${cy - 14} l6 5 l-6 5 l6 5 l-6 5 l6 5`, '#E5372F', 3.5) + bolt(cx - 26, cy - 4); break; }
      case 'bruise': mid += `<ellipse cx="126" cy="82" rx="12" ry="9" fill="#8E6BD8" stroke="${INK}" stroke-width="2.5"/><ellipse cx="124" cy="80" rx="5" ry="3.6" fill="#C9B4F2"/>`; break;
      case 'nightstand': back += `<rect x="158" y="96" width="44" height="74" rx="4" fill="#C98A4E" stroke="${INK}" stroke-width="4"/>` + line('M158 120 H202 M158 146 H202', INK, 3) + `<circle cx="170" cy="108" r="3" fill="${INK}"/><circle cx="170" cy="133" r="3" fill="${INK}"/>`; break;
      case 'veinsblue': mid += line('M86 96 q6 8 0 16 t2 16 M112 74 q-6 10 0 20 t-2 18 M96 122 q8 6 4 14', '#4A78D8', 3); break;
      case 'milk': front += `<g transform="translate(${rx + 6} ${ry - 12}) rotate(8)"><path d="M-11 -6 L0 -16 L11 -6 V18 H-11 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><rect x="-11" y="2" width="22" height="9" fill="#5BA8F0"/>` + line('M-11 -6 H11', INK, 2.5) + `<path d="M-11 -6 L0 -16 L11 -6 V18 H-11 Z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>`; break;
      case 'pills': front += capsule(150, 26, -20, '#FF7DB2', 'A') + capsule(176, 52, 25, '#46B3EE', 'B') + capsule(36, 36, 15, '#FFC53D', 'C'); break;
      case 'snowflakes': back += snowflake(30, 30, 11) + snowflake(170, 26, 9) + snowflake(178, 96, 7) + snowflake(22, 104, 7) + snowflake(150, 160, 6); break;
      case 'icecube': back += `<rect x="62" y="152" width="76" height="22" rx="5" fill="#BFE6FF" stroke="${INK}" stroke-width="4"/>` + line('M70 158 h14 M118 166 h12', '#fff', 3); break;
    }
  }
  return {back, mid, front};
}
function decor(){
  return `<circle cx="100" cy="96" r="80" fill="#fff" opacity=".2"/>` +
    [[22,26],[180,30],[16,142],[184,152],[150,170],[46,172]].map(([x, y]) => line(`M${x - 5} ${y}h10M${x} ${y - 5}v10`, '#fff', 3.5).replace('/>', ' opacity=".55"/>')).join('');
}
const ART = {};
export function artSVG(c){
  if (ART[c.id]) return ART[c.id];
  const a = c.art, bg = SYSTEMS[c.sys].color;
  const B = BODY[a.body](a, bg);
  const L = limbs(B, a.arms || 'down');
  const pr = props(a, B, L.hands, bg);
  let s = `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`;
  s += decor() + pr.back + `<ellipse cx="100" cy="${B.ground}" rx="50" ry="7" fill="${INK}" opacity=".16"/>`;
  s += L.o + B.svg + pr.mid;
  if (B.face) s += face(B.face, a, B.fill);
  s += pr.front + '</svg>';
  return (ART[c.id] = s);
}
