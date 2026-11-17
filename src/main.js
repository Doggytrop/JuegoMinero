import { VIEW_W, VIEW_H, STEP } from './config.js';
import { SpatialGrid } from './spatialGrid.js';
import { ParticlePool } from './particles.js';
import { Sfx } from './audio.js';
import { Renderer } from './render.js';
import { Game } from './game.js';

const screen = document.getElementById('game');
const sctx = screen.getContext('2d');
screen.width = VIEW_W; screen.height = VIEW_H;

const renderer = new Renderer(VIEW_W, VIEW_H);
const sfx = new Sfx();
const grid = new SpatialGrid(64);
const particles = new ParticlePool(500);
const keys = new Set();
const game = new Game(sfx, particles, grid, keys);
let debug = false;

// ---------------- Entrada ----------------
// Teclas "mantenidas" (movimiento) y teclas de "acción" (un solo disparo)
const HOLD = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
const ACTION = { Enter: 'ok', NumpadEnter: 'ok', Space: 'dyn', KeyX: 'dyn', KeyE: 'radio', KeyT: 'shop', KeyP: 'pause', Escape: 'back', KeyR: 'new' };

addEventListener('keydown', (e) => {
  sfx.unlock();
  const k = HOLD[e.code];
  if (k) { keys.add(k); e.preventDefault(); if (!e.repeat) game.onPress(k); }
  const a = ACTION[e.code];
  if (a && !e.repeat) {
    e.preventDefault();
    if (a !== 'new' || game.mode === 'title') game.onPress(a);
  }
  if (e.repeat) return;
  if (e.code === 'KeyG') debug = !debug;
  if (e.code === 'KeyB') renderer.bloomOn = !renderer.bloomOn;
  if (e.code === 'KeyM') game.say(sfx.toggle() ? 'Sonido activado' : 'Sonido desactivado');
  if (e.code === 'KeyN') game.say(sfx.toggleMusic() ? 'Música activada' : 'Música desactivada');
  if (e.code === 'Tab') { e.preventDefault(); game.showMinimap = !game.showMinimap; }
});
addEventListener('keyup', (e) => { const k = HOLD[e.code]; if (k) keys.delete(k); });
addEventListener('blur', () => keys.clear());

// Controles táctiles
for (const el of document.querySelectorAll('[data-key]')) {
  const k = el.dataset.key;
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); sfx.unlock(); keys.add(k); game.onPress(k); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(ev, () => keys.delete(k));
}
for (const el of document.querySelectorAll('[data-action]')) {
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); sfx.unlock(); game.onPress(el.dataset.action); });
}
screen.addEventListener('pointerdown', () => {
  sfx.unlock();
  if (game.mode === 'title' || game.mode === 'dialog' || game.mode === 'ending') game.onPress('ok');
});

// Guardar al cerrar o cambiar de pestaña
addEventListener('visibilitychange', () => { if (document.hidden && game.mode !== 'title') game.save(); });

// ---------------- Bucle principal: paso fijo + requestAnimationFrame ----------------
let last = performance.now(), acc = 0, fps = 60, fpsAcc = 0, fpsFrames = 0;
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now; acc += dt;
  while (acc >= STEP) { game.update(STEP); acc -= STEP; }
  fpsAcc += dt; fpsFrames++;
  if (fpsAcc >= 0.5) { fps = Math.round(fpsFrames / fpsAcc); fpsAcc = 0; fpsFrames = 0; }
  // Double buffering: el frame ya está completo en el back buffer; una sola copia a pantalla
  sctx.drawImage(renderer.draw(game, particles, grid, debug, fps, dt), 0, 0);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__veta = game; // para pruebas desde la consola
