// Synthesized sounds. Safari only starts audio after a user gesture, so unlock() runs on the first touch.
// On iPhone the ring/silent switch mutes Web Audio; the timer pulses anyway.

let ctx = null;

export function unlock(){
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq, dur, type = 'sine', vol = .15, slideTo = null, delay = 0){
  if (!ctx) return;
  try {
    const t = ctx.currentTime + delay, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + .03);
  } catch {
    // A failed sound must never break the game.
  }
}

export function play(name){
  switch (name){
    case 'ok': tone(660, .12, 'triangle', .2); tone(990, .16, 'triangle', .2, null, .1); break;
    case 'skip': tone(330, .2, 'sawtooth', .08, 170); break;
    case 'miss': tone(300, .22, 'triangle', .12, 220); break;
    case 'tick': tone(1250, .045, 'square', .05); break;
    case 'buzz': tone(150, .7, 'sawtooth', .14, 105); break;
    case 'count': tone(520, .1, 'triangle', .16); break;
    case 'go': tone(880, .25, 'triangle', .18); break;
    case 'flip': tone(380, .18, 'sine', .1, 760); break;
    case 'fanfare': [523, 659, 784, 1046].forEach((f, i) => tone(f, .24, 'triangle', .16, null, i * .12)); break;
  }
}
