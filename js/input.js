// Taps, swipes, keyboard, app switching and phone rotation, translated into actions.
import {TIMING} from './config.js';

const LANDSCAPE_PHONE = '(orientation: landscape) and (max-height: 500px) and (pointer: coarse)';

export function attachInput({root, game, act, onTeamName}){
  root.addEventListener('click', e => {
    const el = e.target.closest('[data-a]');
    if (!el || !root.contains(el) || el.disabled) return;
    act(el.dataset.a, el.dataset);
  });
  root.addEventListener('input', e => {
    const i = e.target.dataset && e.target.dataset.team;
    if (i != null) onTeamName(Number(i), e.target.value);
  });
  root.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('input[data-team]')) e.target.blur();
  });

  // Swipe the card: up — guessed, down — skip. The card follows the finger and shows a coloured tint.
  let drag = null;
  root.addEventListener('pointerdown', e => {
    const card = e.target.closest('.card');
    if (!card || !game.canAnswer) return;
    drag = {y0: e.clientY, card, id: e.pointerId, dy: 0};
    try { card.setPointerCapture(e.pointerId); } catch { /* capture is optional */ }
    card.style.transition = 'none';
  });
  root.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.y0;
    drag.dy = dy;
    if (Math.abs(dy) < TIMING.DRAG_TAP_PX) return;
    drag.card.style.transform = `translateY(${dy}px) rotate(${dy * .04}deg)`;
    const tint = drag.card.querySelector('.tint');
    const threshold = game.params.SWIPE_THRESHOLD_PX;
    tint.style.opacity = (Math.min(1, Math.abs(dy) / threshold) * .9).toFixed(2);
    tint.className = 'tint ' + (dy < 0 ? 'up' : 'down');
    tint.textContent = dy < 0 ? 'Угадали' : (game.state.screen === 'last' || game.solo ? 'Не угадали' : 'Пропуск');
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const {dy, card} = drag;
    drag = null;
    const threshold = game.params.SWIPE_THRESHOLD_PX;
    card.style.transition = '';
    if (dy <= -threshold) act('ok');
    else if (dy >= threshold) act('skip');
    else {
      card.style.transform = '';
      const tint = card.querySelector('.tint');
      if (tint) tint.style.opacity = 0;
    }
  };
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);

  // Keyboard, for playing on a computer.
  document.addEventListener('keydown', e => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape'){ act(game.state.overlay === 'pause' ? 'resume' : 'pause'); return; }
    if (!game.playing || game.state.overlay) return;
    if (!['ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(e.key)) return;
    if ((e.key === ' ' || e.key === 'Enter') && tag === 'BUTTON') return;
    e.preventDefault();
    if (game.canFlip) act('flip');
    else if (e.key === 'ArrowUp' || e.key === ' ') act('ok');
    else if (e.key === 'ArrowDown') act('skip');
  });

  // Leaving Safari pauses the turn; the page may be killed afterwards, so save on the way out.
  document.addEventListener('visibilitychange', () => { if (document.hidden){ act('pause'); act('persist'); } });
  window.addEventListener('pagehide', () => act('persist'));

  const landscape = matchMedia(LANDSCAPE_PHONE);
  const onRotate = () => game.setRotated(landscape.matches);
  landscape.addEventListener('change', onRotate);
  onRotate();
}
