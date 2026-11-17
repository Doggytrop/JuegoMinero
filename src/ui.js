import { TILE, COLS, ROWS, SURFACE, CHUNK_ROWS, DEBT, TILE_INFO, ZONES, BARRIERS, zoneOf } from './config.js';
import { JOURNALS, ACHIEVEMENTS } from './story.js';

// Divide un texto en líneas que quepan en maxW (respeta saltos de línea \n)
export function wrap(ctx, text, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    if (!para) { out.push(''); continue; }
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}

function panel(b, x, y, w, h, alpha = 0.72) {
  b.fillStyle = `rgba(10,6,4,${alpha})`; b.fillRect(x, y, w, h);
  b.strokeStyle = '#8a5a2b'; b.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function bar(b, x, y, w, h, ratio, color) {
  b.fillStyle = '#2a2420'; b.fillRect(x, y, w, h);
  b.fillStyle = color; b.fillRect(x, y, Math.max(0, Math.min(1, ratio)) * w, h);
}

export function drawUI(b, r, game, camX, camY, grid, debug, fps) {
  const w = r.w, h = r.h;
  b.imageSmoothingEnabled = false;
  b.textAlign = 'left';
  if (game.mode !== 'title') drawHUD(b, r, game, w, h);
  if (debug) drawDebug(b, r, game, camX, camY, grid, fps, w, h);
  switch (game.mode) {
    case 'title': drawTitle(b, game, w, h); break;
    case 'dialog': drawDialog(b, game, w, h); break;
    case 'shop': drawShop(b, game, w, h); break;
    case 'pause': drawPause(b, game, w, h); break;
    case 'ending': drawEnding(b, game, w, h); break;
  }
}

function drawHUD(b, r, game, w, h) {
  const p = game.p, d = game.d;
  // Panel de estado
  panel(b, 4, 4, 172, 58);
  b.font = 'bold 8px monospace';
  b.fillStyle = '#ff8a8a'; b.fillText('SALUD', 8, 13);
  bar(b, 46, 7, 126, 6, p.health / game.maxHealth, '#e04848');
  const br = p.battery / game.maxBattery;
  b.fillStyle = '#c8ff9a'; b.fillText('LUZ', 8, 23);
  bar(b, 46, 17, 126, 6, br, br < 0.2 ? (Math.floor(game.t * 4) % 2 ? '#ff4d4d' : '#802020') : '#a8e060');
  b.fillStyle = '#fff';
  const zoneName = p.ty >= SURFACE ? ZONES[zoneOf(p.ty - SURFACE)].name : 'San Isidro';
  b.fillText(`${game.depth} m · ${zoneName}`, 8, 34);
  b.fillText(`Carga ${p.cargo.length}/${game.cap}`, 8, 45);
  b.fillStyle = '#ffd23f'; b.fillText(`$${d.money}`, 100, 45);
  b.fillStyle = '#e9d8a6';
  b.fillText(`Escaleras ${d.items.ladders} · Dinam ${d.items.dynamite} · Radio ${d.items.radio}`, 8, 56);

  // Objetivo principal (arriba al centro)
  const ox = 182, ow = w - ox - (game.showMinimap ? 68 : 6);
  panel(b, ox, 4, ow, 22);
  b.font = 'bold 7px monospace'; b.fillStyle = '#e9d8a6';
  b.fillText(`Deuda de San Isidro $${d.debtPaid}/${DEBT}`, ox + 4, 12);
  bar(b, ox + 4, 15, ow - 8, 4, d.debtPaid / DEBT, '#ffd23f');
  b.textAlign = 'right';
  b.fillText(`Bitác. ${d.journals.filter(Boolean).length}/${JOURNALS.length} · ${d.heart ? 'Corazón ✔' : 'Corazón ?'}`, ox + ow - 4, 12);
  b.textAlign = 'left';

  // Encargo activo
  const q = d.quest;
  if (q && game.mode === 'play') {
    const txt = `Encargo · ${q.npc}: ${q.got}/${q.n} ${TILE_INFO[q.ore].name} para ${q.reason} → $${q.reward}`;
    b.font = '7px monospace';
    const tw = Math.min(w - 8, b.measureText(txt).width + 10);
    panel(b, 4, h - (game.atSurfaceRow ? 32 : 15), tw, 11, 0.6);
    b.fillStyle = '#9fe0ff'; b.fillText(txt, 8, h - (game.atSurfaceRow ? 24 : 7));
  }
  if (game.mode === 'play' && game.atSurfaceRow) {
    panel(b, 4, h - 16, w - 8, 12, 0.7);
    b.font = 'bold 7px monospace'; b.fillStyle = '#ffd27a';
    b.fillText('[ENTER] Tienda y deuda · Baja con ↓ · [P] Pausa y objetivos', 9, h - 7);
  }

  if (game.showMinimap) drawMinimap(b, r, game, w);

  if (game.mode !== 'play' && game.mode !== 'shop') return;
  // Mensaje central
  if (game.msgT > 0) {
    b.font = 'bold 8px monospace'; b.textAlign = 'center';
    const tw = b.measureText(game.msg).width + 12;
    b.globalAlpha = Math.min(1, game.msgT * 3);
    panel(b, w / 2 - tw / 2, 68, tw, 13, 0.7);
    b.fillStyle = '#fff'; b.fillText(game.msg, w / 2, 78);
    b.globalAlpha = 1; b.textAlign = 'left';
  }

  // Avisos de logros/encargos
  game.toasts.forEach((t, i) => {
    const y = 88 + i * 26;
    b.globalAlpha = Math.min(1, t.life * 2);
    panel(b, 4, y, 150, 22, 0.8);
    b.font = 'bold 7px monospace'; b.fillStyle = '#ffd23f'; b.fillText(t.title, 8, y + 9);
    b.fillStyle = '#fff'; b.fillText(t.text.slice(0, 34), 8, y + 18);
    b.globalAlpha = 1;
  });

  // Letrero de zona nueva
  if (game.banner && game.mode === 'play') {
    const a = Math.min(1, game.banner.life, 3.5 - game.banner.life + 0.2);
    b.globalAlpha = Math.max(0, a); b.textAlign = 'center';
    b.fillStyle = 'rgba(0,0,0,.5)'; b.fillRect(0, h / 2 - 30, w, 46);
    b.font = 'bold 10px monospace'; b.fillStyle = '#e9d8a6'; b.fillText(game.banner.title, w / 2, h / 2 - 14);
    b.font = 'bold 18px monospace'; b.fillStyle = '#ffd23f'; b.fillText(game.banner.sub.toUpperCase(), w / 2, h / 2 + 6);
    b.globalAlpha = 1; b.textAlign = 'left';
  }
}

function drawMinimap(b, r, game, w) {
  const p = game.p, VIEW = 110;
  const x = w - 52, y = 4;
  // Ventana del minimapa centrada en el minero (110 filas de las 228)
  const start = Math.max(SURFACE, Math.min(ROWS - VIEW, p.ty - 55));
  panel(b, x - 11, y - 1, 62, VIEW + 4, 0.8);
  b.drawImage(r.mini, 0, start, COLS, VIEW, x, y + 1, COLS, VIEW);
  b.fillStyle = 'rgba(255,140,200,.6)';
  for (const br of BARRIERS) {
    const yy = br + SURFACE - start;
    if (yy >= 0 && yy < VIEW) b.fillRect(x, y + 1 + yy, COLS, 2);
  }
  // Radar de minerales (ventaja de la escuela)
  if (game.radar) {
    for (let yy = p.ty - 14; yy <= p.ty + 14; yy++) for (let xx = p.tx - 14; xx <= p.tx + 14; xx++) {
      const info = TILE_INFO[game.world.get(xx, yy)];
      const my = yy - start;
      if (info && (info.value || info.glow) && yy >= SURFACE && my >= 0 && my < VIEW) { b.fillStyle = info.ore || info.glow; b.fillRect(x + xx, y + 1 + my, 1, 1); }
    }
  }
  if (Math.floor(game.t * 4) % 2) { b.fillStyle = '#ff3030'; b.fillRect(x + p.tx - 1, y + Math.max(0, p.ty - start), 3, 3); }
  // Medidor de profundidad total con las 4 zonas
  const gx = x - 8, total = ROWS - SURFACE;
  const zc = ['#7a4a2a', '#3f5866', '#b8321a', '#5a3a7a'];
  const bounds = [0, 47, 102, 162, total];
  for (let i = 0; i < 4; i++) {
    b.fillStyle = zc[i];
    b.fillRect(gx, y + 1 + (bounds[i] / total) * VIEW, 4, ((bounds[i + 1] - bounds[i]) / total) * VIEW);
  }
  b.fillStyle = '#ffe060'; b.fillRect(gx - 1, y + VIEW - 2, 6, 2);
  b.fillStyle = '#fff'; b.fillRect(gx - 2, y + 1 + (Math.max(0, p.ty - SURFACE) / total) * VIEW - 1, 8, 2);
}

function drawDebug(b, r, game, camX, camY, grid, fps, w, h) {
  b.strokeStyle = 'rgba(0,200,255,.6)'; b.fillStyle = 'rgba(0,200,255,.9)'; b.font = '7px monospace';
  for (const c of grid.occupied()) {
    const x = c.cx * grid.cs - camX, y = c.cy * grid.cs - camY;
    if (x > w || y > h || x < -grid.cs || y < -grid.cs) continue;
    b.strokeRect(x + 0.5, y + 0.5, grid.cs, grid.cs); b.fillText(String(c.n), x + 3, y + 10);
  }
  b.strokeStyle = 'rgba(255,0,200,.6)';
  for (let i = 0; i < r.chunks.length; i++) {
    const y = i * CHUNK_ROWS * TILE - camY;
    if (y >= 0 && y < h) { b.beginPath(); b.moveTo(0, y + 0.5); b.lineTo(w, y + 0.5); b.stroke(); }
  }
  panel(b, 180, h - 84, 150, 66, 0.85);
  b.fillStyle = '#0ff'; b.font = 'bold 7px monospace';
  const s = r.stats;
  [`FPS: ${fps}`, `Chunks visibles: ${s.visibleChunks}`, `Redibujos de chunk: ${s.chunkRedraws}`,
    `Grisú visibles/total: ${s.visibleWisps}/${game.wisps.length}`, `Fuentes de brillo: ${s.glows}`,
    `Partículas vivas: ${game.particles.alive}`, `Bloom: ${r.bloomOn ? 'ON' : 'OFF'}`]
    .forEach((t, i) => b.fillText(t, 184, h - 75 + i * 8.5));
}

function overlay(b, w, h, a = 0.6) { b.fillStyle = `rgba(0,0,0,${a})`; b.fillRect(0, 0, w, h); }

function drawTitle(b, game, w, h) {
  overlay(b, w, h, 0.55);
  b.textAlign = 'center';
  b.fillStyle = '#f5c26b'; b.font = 'bold 32px monospace'; b.fillText('VETA SONORA', w / 2, 82);
  b.fillStyle = '#ff9a5a'; b.font = 'bold 11px monospace'; b.fillText('— El Corazón de la Sierra —', w / 2, 100);
  b.fillStyle = '#fff'; b.font = '8px monospace';
  b.fillText('Salva al pueblo minero de San Isidro y descubre qué pasó con tu abuelo.', w / 2, 122);
  b.font = 'bold 10px monospace';
  const blink = Math.floor(game.t * 2) % 2;
  if (game.hasSave) {
    b.fillStyle = blink ? '#7cfc7c' : '#4a9a4a'; b.fillText('ENTER · Continuar campaña', w / 2, 152);
    b.fillStyle = '#e9d8a6'; b.font = '8px monospace'; b.fillText('R · Nueva partida (borra el progreso)', w / 2, 166);
    const d = game.d;
    b.fillStyle = '#aaa';
    b.fillText(`Deuda $${d.debtPaid}/${DEBT} · Bitácoras ${d.journals.filter(Boolean).length}/8 · Logros ${Object.keys(d.ach).length}/${ACHIEVEMENTS.length} · Récord ${d.stats.maxDepth} m`, w / 2, 182);
  } else {
    b.fillStyle = blink ? '#7cfc7c' : '#4a9a4a'; b.fillText('ENTER o toca para empezar', w / 2, 158);
  }
  b.fillStyle = '#999'; b.font = '7px monospace';
  b.fillText('Flechas/WASD: mover, excavar y subir con escaleras · Espacio: dinamita · E: radio', w / 2, 214);
  b.fillText('Enter: tienda (en superficie) · P: pausa · M: sonido · N: música · Tab: minimapa · G: debug', w / 2, 226);
  b.textAlign = 'left';
}

function drawDialog(b, game, w, h) {
  const dlg = game.dlg; if (!dlg) return;
  const page = dlg.pages[dlg.i];
  overlay(b, w, h, 0.45);
  const bw = 400, bx = (w - bw) / 2;
  b.font = '9px monospace';
  const lines = wrap(b, page.text, bw - 24);
  const bh = 40 + lines.length * 12;
  const by = h - bh - 14;
  panel(b, bx, by, bw, bh, 0.92);
  b.fillStyle = '#ffd23f'; b.font = 'bold 10px monospace'; b.fillText(page.title, bx + 12, by + 16);
  b.fillStyle = '#f2e6c8'; b.font = '9px monospace';
  lines.forEach((ln, i) => b.fillText(ln, bx + 12, by + 32 + i * 12));
  b.textAlign = 'right'; b.fillStyle = Math.floor(game.t * 2) % 2 ? '#7cfc7c' : '#4a9a4a'; b.font = 'bold 8px monospace';
  b.fillText(`ENTER ▶  ${dlg.i + 1}/${dlg.pages.length}`, bx + bw - 10, by + bh - 7);
  b.textAlign = 'left';
}

function drawShop(b, game, w, h) {
  overlay(b, w, h, 0.5);
  const entries = game.shopEntries();
  const bw = 400, bx = (w - bw) / 2, by = 22, bh = 228;
  panel(b, bx, by, bw, bh, 0.94);
  b.font = 'bold 11px monospace'; b.fillStyle = '#ffd23f'; b.fillText('TIENDA DEL GÜERO', bx + 12, by + 17);
  b.textAlign = 'right'; b.fillText(`$${game.d.money}`, bx + bw - 12, by + 17);
  if (game.discount < 1) { b.font = '7px monospace'; b.fillStyle = '#7cfc7c'; b.fillText('-20% gracias a la campana', bx + bw - 12, by + 27); }
  b.textAlign = 'left';
  b.font = '8px monospace';
  entries.forEach((e, i) => {
    const y = by + 38 + i * 15;
    if (i === game.shopSel) { b.fillStyle = 'rgba(255,210,63,.18)'; b.fillRect(bx + 6, y - 9, bw - 12, 13); b.fillStyle = '#ffd23f'; b.fillText('▶', bx + 9, y); }
    if (e.type === 'up' && i === 0 || e.type === 'item' && entries[i - 1].type === 'up' || e.type === 'debt') {
      b.fillStyle = 'rgba(138,90,43,.6)'; b.fillRect(bx + 6, y - 11, bw - 12, 1);
    }
    b.fillStyle = e.type === 'debt' ? '#ffd27a' : '#f2e6c8'; b.fillText(e.label, bx + 20, y);
    b.textAlign = 'right';
    if (e.type === 'exit') { /* sin precio */ }
    else if (e.cost == null) { b.fillStyle = '#888'; b.fillText(e.type === 'debt' ? '✔' : 'MAX', bx + bw - 12, y); }
    else { b.fillStyle = game.d.money >= e.cost && e.cost > 0 ? '#7cfc7c' : '#ff7a7a'; b.fillText(e.type === 'debt' ? `abonar $${e.cost}` : `$${e.cost}`, bx + bw - 12, y); }
    b.textAlign = 'left';
  });
  const sel = entries[game.shopSel];
  b.fillStyle = 'rgba(138,90,43,.6)'; b.fillRect(bx + 6, by + bh - 34, bw - 12, 1);
  b.fillStyle = '#9fe0ff'; b.font = '8px monospace';
  wrap(b, sel.desc, bw - 24).slice(0, 2).forEach((ln, i) => b.fillText(ln, bx + 12, by + bh - 22 + i * 10));
  b.textAlign = 'center'; b.fillStyle = '#888'; b.font = '7px monospace';
  b.fillText('↑↓ elegir · ENTER comprar · ESC salir', w / 2, by + bh + 12);
  b.textAlign = 'left';
}

function drawPause(b, game, w, h) {
  overlay(b, w, h, 0.93);
  const d = game.d;
  b.textAlign = 'center'; b.fillStyle = '#ffd23f'; b.font = 'bold 16px monospace'; b.fillText('PAUSA', w / 2, 26);
  b.textAlign = 'left'; b.font = 'bold 9px monospace'; b.fillStyle = '#e9d8a6';
  b.fillText('OBJETIVOS', 20, 46);
  b.font = '8px monospace';
  const objs = [
    [d.debtPaid >= DEBT, `Pagar la deuda de San Isidro ($${d.debtPaid}/${DEBT})`],
    [d.journals.every(Boolean), `Encontrar las bitácoras de Don Chuy (${d.journals.filter(Boolean).length}/8)`],
    [d.heart, 'Llegar al Corazón de la Sierra (+200 m)'],
  ];
  objs.forEach(([ok, t], i) => { b.fillStyle = ok ? '#7cfc7c' : '#fff'; b.fillText(`${ok ? '■' : '□'} ${t}`, 20, 60 + i * 11); });
  b.fillStyle = '#aaa';
  const s = d.stats;
  b.fillText(`Prof. máx ${s.maxDepth} m · Bloques ${s.dug} · Ganado $${s.earned} · Encargos ${s.quests} · Rescates ${s.rescues} · ${Math.floor(s.time / 60)} min`, 20, 100);
  b.font = 'bold 9px monospace'; b.fillStyle = '#e9d8a6';
  b.fillText(`LOGROS (${Object.keys(d.ach).length}/${ACHIEVEMENTS.length})`, 20, 120);
  b.font = '7px monospace';
  ACHIEVEMENTS.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 20 + col * 225, y = 130 + row * 16;
    const ok = d.ach[a.id];
    b.fillStyle = ok ? '#ffd23f' : '#666'; b.fillText(`${ok ? '★' : '☆'} ${a.name}`, x, y);
    b.fillStyle = ok ? '#ccc' : '#555'; b.fillText(a.desc, x + 10, y + 8);
  });
  b.textAlign = 'center'; b.fillStyle = '#7cfc7c'; b.font = 'bold 8px monospace';
  b.fillText('P / ESC / ENTER para continuar', w / 2, h - 8);
  b.textAlign = 'left';
}

function drawEnding(b, game, w, h) {
  overlay(b, w, h, 0.92);
  b.textAlign = 'center';
  b.fillStyle = '#ffd23f'; b.font = 'bold 24px monospace'; b.fillText(game.ending.title, w / 2, 50);
  b.font = '9px monospace'; b.fillStyle = '#f2e6c8';
  wrap(b, game.ending.text, 400).forEach((ln, i) => b.fillText(ln, w / 2, 76 + i * 12));
  const s = game.d.stats;
  b.fillStyle = '#9fe0ff'; b.font = 'bold 8px monospace';
  b.fillText(`Tiempo ${Math.floor(s.time / 60)} min · Bloques ${s.dug} · Ganado $${s.earned} · Rescates ${s.rescues} · Logros ${Object.keys(game.d.ach).length}/${ACHIEVEMENTS.length}`, w / 2, 190);
  b.fillStyle = '#aaa'; b.font = '8px monospace';
  b.fillText('Un juego de Luis Ángel Andrade Silva · UT Hermosillo', w / 2, 210);
  b.fillStyle = Math.floor(game.t * 2) % 2 ? '#7cfc7c' : '#4a9a4a'; b.font = 'bold 9px monospace';
  b.fillText('ENTER · Seguir explorando (modo libre)', w / 2, 240);
  b.textAlign = 'left';
}
