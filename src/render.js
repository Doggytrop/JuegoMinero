import { TILE, COLS, ROWS, SURFACE, CHUNK_ROWS, T, TILE_INFO, ZONES, zoneOf, isPassable } from './config.js';
import { drawUI } from './ui.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// Hash entero determinista: textura "aleatoria" estable para cada bloque
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

const SPECIAL_COLORS = {
  [T.GRANITE]: ['#5a4650', '#3e3038'],
  [T.BEDROCK]: ['#24212b', '#18161d'],
  [T.MAGMA]: ['#b8321a', '#7a1c0e'],
};

export class Renderer {
  constructor(w, h) {
    this.w = w; this.h = h;
    // 1) BACK BUFFER: el frame completo se compone aquí y se copia una vez a pantalla
    this.back = makeCanvas(w, h);
    this.b = this.back.getContext('2d');
    // 2) LIGHT BUFFER: capa de oscuridad perforada por la lámpara y el magma
    this.light = makeCanvas(w, h);
    this.l = this.light.getContext('2d');
    // 3) BLOOM BUFFER: brillos a 1/4 de resolución; al escalarlo se difumina solo
    this.bloomScale = 4;
    this.bloom = makeCanvas(Math.ceil(w / 4), Math.ceil(h / 4));
    this.bl = this.bloom.getContext('2d');
    this.bloomOn = true;
    this.hasFilter = 'filter' in this.b;
    // 4) CHUNK CACHE: el mapa se pre-dibuja en trozos; solo se redibuja lo modificado
    this.chunks = [];
    this.chunkWorld = null;
    // 5) MINIMAPA en caché (ImageData de 1 px por bloque)
    this.mini = makeCanvas(COLS, ROWS);
    this.mctx = this.mini.getContext('2d');
    this.miniData = this.mctx.createImageData(COLS, ROWS);
    this.miniVer = -1; this.miniT = 0;
    this.tmp = [];
    this.glows = [];
    this.stats = { chunkRedraws: 0, visibleWisps: 0, visibleChunks: 0, glows: 0 };
  }

  ensureChunks(world) {
    if (this.chunkWorld === world) return;
    this.chunkWorld = world;
    this.chunks = [];
    this.miniVer = -1;
    const n = Math.ceil(ROWS / CHUNK_ROWS);
    for (let i = 0; i < n; i++) this.chunks.push({ canvas: makeCanvas(COLS * TILE, CHUNK_ROWS * TILE), ver: -1 });
  }

  renderChunk(world, i, chunk) {
    const c = chunk.canvas.getContext('2d');
    c.clearRect(0, 0, chunk.canvas.width, chunk.canvas.height);
    const y0 = i * CHUNK_ROWS, y1 = Math.min(ROWS, y0 + CHUNK_ROWS);
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < COLS; x++) this.drawTile(c, world, x, y, x * TILE, (y - y0) * TILE);
    }
    chunk.ver = world.chunkVer[i];
    this.stats.chunkRedraws++;
  }

  drawTile(c, world, x, y, px, py) {
    const t = world.get(x, y);
    const Z = ZONES[zoneOf(Math.max(0, y - SURFACE))];
    if (isPassable(t)) {
      if (y >= SURFACE) {
        c.fillStyle = Z.tunnel; c.fillRect(px, py, TILE, TILE);
        if (!isPassable(world.get(x, y - 1)) && y > SURFACE) { c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(px, py, TILE, 3); }
      }
      if (t === T.LADDER) {
        c.fillStyle = '#8a5a2b'; c.fillRect(px + 3, py, 2, TILE); c.fillRect(px + 11, py, 2, TILE);
        c.fillStyle = '#c08a48'; for (let i = 2; i < TILE; i += 5) c.fillRect(px + 3, py + i, 10, 2);
      }
      return;
    }
    const info = TILE_INFO[t];
    const h = hash(x, y);
    const pal = SPECIAL_COLORS[t] || (info.kind === 'dirt' ? Z.dirt : Z.stone);
    c.fillStyle = pal[0]; c.fillRect(px, py, TILE, TILE);
    c.fillStyle = pal[1];
    for (let i = 0; i < 3; i++) c.fillRect(px + ((h >>> (i * 5)) % 14), py + ((h >>> (i * 5 + 3)) % 14), 2, 2);

    switch (t) {
      case T.GRASS:
        c.fillStyle = '#5aa04a'; c.fillRect(px, py, TILE, 4);
        c.fillStyle = '#3f7f36'; c.fillRect(px + (h % 12), py + 4, 2, 2);
        break;
      case T.GRANITE:
        c.fillStyle = '#9a7480';
        for (let i = 0; i < 4; i++) c.fillRect(px + ((h >>> (i * 3)) % 14), py + ((h >>> (i * 3 + 7)) % 14), 2, 1);
        c.fillStyle = '#2a2028'; c.fillRect(px, py + 15, TILE, 1);
        break;
      case T.LOOSE:
        c.fillStyle = pal[1];
        c.fillRect(px + 2, py + 7, 12, 1); c.fillRect(px + 7, py + 1, 1, 6); c.fillRect(px + 10, py + 8, 1, 6);
        c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(px + 1, py + 1, 5, 2);
        break;
      case T.MAGMA:
        c.fillStyle = '#ff8a1a';
        for (let i = 0; i < 3; i++) c.fillRect(px + 1 + ((h >>> (i * 4)) % 11), py + 1 + ((h >>> (i * 4 + 2)) % 11), 4, 3);
        c.fillStyle = '#ffd04a'; c.fillRect(px + (h % 13), py + ((h >>> 8) % 13), 2, 2);
        break;
      case T.BEDROCK:
        c.fillStyle = '#3a3642'; c.fillRect(px + 2, py + 2, 4, 4); c.fillRect(px + 9, py + 9, 5, 4);
        break;
      case T.JOURNAL:
        c.fillStyle = '#f1e3b5'; c.fillRect(px + 3, py + 4, 10, 9);
        c.fillStyle = '#8a7a5a'; c.fillRect(px + 5, py + 6, 6, 1); c.fillRect(px + 5, py + 8, 6, 1); c.fillRect(px + 5, py + 10, 4, 1);
        c.fillStyle = '#b03a2a'; c.fillRect(px + 3, py + 4, 1, 9);
        break;
      case T.HEART:
        c.fillStyle = '#ff9a2a';
        c.beginPath(); c.moveTo(px + 8, py); c.lineTo(px + 16, py + 8); c.lineTo(px + 8, py + 16); c.lineTo(px, py + 8); c.fill();
        c.fillStyle = '#ffd23f';
        c.beginPath(); c.moveTo(px + 8, py + 2); c.lineTo(px + 14, py + 8); c.lineTo(px + 8, py + 14); c.lineTo(px + 2, py + 8); c.fill();
        c.fillStyle = '#fff4b0'; c.fillRect(px + 6, py + 5, 3, 3);
        break;
      default:
        if (info.ore) {
          c.fillStyle = info.ore;
          for (let i = 0; i < 4; i++) c.fillRect(px + 2 + ((h >>> (i * 4)) % 10), py + 2 + ((h >>> (i * 4 + 2)) % 10), 3, 3);
          if (info.gem) { c.fillStyle = '#ffffff'; c.fillRect(px + 2 + (h % 10), py + 2 + ((h >>> 4) % 10), 1, 1); }
        }
    }
  }

  drawHills(b, off, baseY, color, amp, seed) {
    b.fillStyle = color;
    b.beginPath(); b.moveTo(0, baseY);
    for (let x = 0; x <= this.w; x += 8) {
      const y = baseY - amp * (0.6 + 0.4 * Math.sin((x + off) * 0.013 * seed + seed)) - amp * 0.3 * Math.sin((x + off) * 0.041 + seed * 2);
      b.lineTo(x, y);
    }
    b.lineTo(this.w, baseY); b.closePath(); b.fill();
  }

  drawBuilding(b, x, gy, w, h, wall, roof, label, lit, tower = false) {
    if (x > this.w + 20 || x + w < -20) return;
    b.fillStyle = lit ? wall : '#4a3e38'; b.fillRect(x, gy - h, w, h);
    b.fillStyle = lit ? roof : '#2e2622';
    b.beginPath(); b.moveTo(x - 4, gy - h); b.lineTo(x + w / 2, gy - h - 12); b.lineTo(x + w + 4, gy - h); b.fill();
    if (tower) {
      b.fillStyle = lit ? wall : '#4a3e38'; b.fillRect(x + w / 2 - 6, gy - h - 26, 12, 16);
      b.fillStyle = lit ? roof : '#2e2622'; b.beginPath(); b.moveTo(x + w / 2 - 8, gy - h - 26); b.lineTo(x + w / 2, gy - h - 36); b.lineTo(x + w / 2 + 8, gy - h - 26); b.fill();
      b.fillStyle = lit ? '#ffd27a' : '#1c1410'; b.fillRect(x + w / 2 - 2, gy - h - 22, 4, 6);
    }
    // ventanas: encendidas si el lugar ya reabrió, tapiadas si no
    for (let wx = x + 5; wx < x + w - 8; wx += 12) {
      b.fillStyle = lit ? '#ffd27a' : '#1c1410'; b.fillRect(wx, gy - h + 6, 6, 6);
      if (!lit) { b.fillStyle = '#6a4a2a'; b.fillRect(wx - 1, gy - h + 8, 8, 2); }
    }
    b.fillStyle = '#2b1a0e'; b.fillRect(x + w / 2 - 4, gy - 11, 8, 11);
    if (label) {
      b.font = 'bold 6px monospace'; b.textAlign = 'center';
      b.fillStyle = lit ? '#e9d8a6' : '#7a6a5a'; b.fillText(label, x + w / 2, gy - h - (tower ? 38 : 14));
      b.textAlign = 'left';
    }
  }

  drawSurface(b, game, camX, gy) {
    const ms = game.d.milestones;
    const g = b.createLinearGradient(0, gy - 240, 0, gy);
    // el cielo se aclara conforme el pueblo revive
    g.addColorStop(0, ['#1b2a4a', '#24406a', '#2e5a8a', '#3a78b0', '#4a90d0'][ms]);
    g.addColorStop(0.6, '#e0794a'); g.addColorStop(1, '#f5c26b');
    b.fillStyle = g; b.fillRect(0, 0, this.w, gy);
    b.fillStyle = '#ffe2a0'; b.beginPath(); b.arc(this.w * 0.78 - camX * 0.05, gy - 70, 14, 0, Math.PI * 2); b.fill();
    this.drawHills(b, camX * 0.3, gy, '#8a4b3a', 40, 1);
    this.drawHills(b, camX * 0.5, gy, '#5c3328', 24, 2);
    // pueblo de San Isidro
    this.drawBuilding(b, 1 * TILE - camX, gy, 46, 26, '#8b5a2b', '#4a2c17', 'TIENDA', true);
    this.drawBuilding(b, 11 * TILE - camX, gy, 44, 24, '#c96f4a', '#6a2e1e', 'FONDA', ms >= 1);
    this.drawBuilding(b, 17 * TILE - camX, gy, 30, 18, '#b88a5a', '#5a3a1e', null, ms >= 4);
    this.drawBuilding(b, 25 * TILE - camX, gy, 56, 26, '#d8c08a', '#7a4a2a', 'ESCUELA', ms >= 2);
    this.drawBuilding(b, 36 * TILE - camX, gy, 46, 30, '#e8dcc0', '#8a5a3a', 'IGLESIA', ms >= 3, true);
    this.drawBuilding(b, 43 * TILE - camX, gy, 30, 18, '#a87a5a', '#5a3a1e', null, ms >= 4);
    // castillo minero sobre el tiro
    const hx = 8 * TILE + 8 - camX;
    b.strokeStyle = '#3d3d46'; b.lineWidth = 2;
    b.beginPath(); b.moveTo(hx - 14, gy); b.lineTo(hx, gy - 46); b.lineTo(hx + 14, gy); b.moveTo(hx - 9, gy - 18); b.lineTo(hx + 9, gy - 18); b.stroke();
    b.beginPath(); b.arc(hx, gy - 46, 5, 0, Math.PI * 2); b.stroke();
    b.lineWidth = 1;
    // saguaros
    for (const tx of [15, 22, 32]) {
      const cx = tx * TILE - camX;
      b.fillStyle = '#2f6b3a'; b.fillRect(cx, gy - 22, 4, 22); b.fillRect(cx - 5, gy - 14, 3, 7); b.fillRect(cx - 5, gy - 9, 6, 3); b.fillRect(cx + 6, gy - 18, 3, 8); b.fillRect(cx + 3, gy - 12, 6, 3);
    }
  }

  drawPlayer(b, game, camX, camY) {
    const p = game.p;
    if (p.inv > 0 && Math.floor(game.t * 20) % 2) return;
    const x = Math.round(p.x - camX), y = Math.round(p.y - camY), f = p.face;
    b.fillStyle = '#2b3a55'; b.fillRect(x + 4, y + 12, 3, 4); b.fillRect(x + 9, y + 12, 3, 4);
    b.fillStyle = '#e8762c'; b.fillRect(x + 3, y + 7, 10, 6);
    b.fillStyle = '#f5f0a0'; b.fillRect(x + 3, y + 10, 10, 1);
    b.fillStyle = '#c68a5a'; b.fillRect(x + 5, y + 3, 6, 5);
    b.fillStyle = '#f2c230'; b.fillRect(x + 4, y + 1, 8, 3);
    b.fillStyle = p.battery > 0 ? '#fff7c0' : '#555'; b.fillRect(f > 0 ? x + 11 : x + 3, y + 2, 2, 2);
    if (p.digKey >= 0) {
      const tx = p.digKey % COLS, ty = Math.floor(p.digKey / COLS);
      const swing = Math.sin(game.t * 40) * 3;
      b.strokeStyle = '#b8b8c0'; b.lineWidth = 2; b.beginPath();
      b.moveTo(x + 8, y + 9); b.lineTo(x + 8 + (tx - p.tx) * 9 + swing, y + 9 + (ty - p.ty) * 9 - swing); b.stroke();
      b.lineWidth = 1;
    }
    if (p.radioT > 0) {
      b.strokeStyle = `rgba(255,242,176,${0.4 + 0.4 * Math.sin(game.t * 20)})`;
      b.beginPath(); b.arc(x + 8, y + 8, 8 + p.radioT * 8, 0, Math.PI * 2); b.stroke();
    }
  }

  updateMinimap(world, dt) {
    this.miniT -= dt;
    if (this.miniVer === world.version || this.miniT > 0) return;
    this.miniVer = world.version; this.miniT = 0.25;
    const d = this.miniData.data;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x, o = i * 4;
        if (y < SURFACE || !world.seen[i]) { d[o + 3] = 0; continue; }
        const t = world.tiles[i];
        let c;
        if (isPassable(t)) c = [110, 85, 65];
        else if (t === T.MAGMA) c = [255, 70, 20];
        else if (t === T.GRANITE) c = [130, 90, 110];
        else if (t === T.BEDROCK) c = [20, 18, 24];
        else if (t === T.JOURNAL) c = [255, 240, 180];
        else if (t === T.HEART) c = [255, 224, 96];
        else if (TILE_INFO[t].value) c = hexToRgb(TILE_INFO[t].ore);
        else c = [45, 34, 28];
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
    }
    this.mctx.putImageData(this.miniData, 0, 0);
  }

  draw(game, particles, grid, debug, fps, dt) {
    const b = this.b, w = this.w, h = this.h;
    const { world, p } = game;
    this.ensureChunks(world);
    this.updateMinimap(world, dt);
    const sx = (Math.random() - 0.5) * game.shake, sy = (Math.random() - 0.5) * game.shake;
    const camX = Math.round(game.cam.x + sx), camY = Math.round(game.cam.y + sy);

    b.fillStyle = '#120d0a'; b.fillRect(0, 0, w, h);
    const gy = SURFACE * TILE - camY;
    if (gy > 0) this.drawSurface(b, game, camX, gy);

    // --- Mapa: solo chunks visibles, redibujando solo los "sucios"
    const CH = CHUNK_ROWS * TILE;
    const c0 = Math.max(0, Math.floor(camY / CH)), c1 = Math.min(this.chunks.length - 1, Math.floor((camY + h) / CH));
    this.stats.visibleChunks = c1 - c0 + 1;
    for (let i = c0; i <= c1; i++) {
      const ch = this.chunks[i];
      if (ch.ver !== world.chunkVer[i]) this.renderChunk(world, i, ch);
      b.drawImage(ch.canvas, -camX, i * CH - camY);
    }

    // --- Grietas del bloque que se excava
    if (p.digKey >= 0 && p.digNeed) {
      const tx = p.digKey % COLS, ty = Math.floor(p.digKey / COLS);
      const k = Math.min(1, p.digT / p.digNeed);
      const x = tx * TILE - camX, y = ty * TILE - camY;
      b.fillStyle = `rgba(0,0,0,${k * 0.5})`; b.fillRect(x, y, TILE, TILE);
      b.strokeStyle = 'rgba(20,10,5,.9)'; b.beginPath();
      b.moveTo(x + 8, y + 8); b.lineTo(x + 8 - 7 * k, y + 2);
      b.moveTo(x + 8, y + 8); b.lineTo(x + 8 + 6 * k, y + 14);
      b.moveTo(x + 8, y + 8); b.lineTo(x + 14 * k, y + 9); b.stroke();
    }

    // --- Rocas cayendo (tiemblan antes de caer)
    for (const r of game.rocks) {
      const j = r.warn > 0 ? (Math.random() - 0.5) * 3 : 0;
      const x = r.tx * TILE - camX + j, y = r.y - camY;
      const Z = ZONES[zoneOf(Math.max(0, Math.floor(r.y / TILE) - SURFACE))];
      b.fillStyle = Z.stone[0]; b.fillRect(x + 1, y + 1, 14, 14);
      b.fillStyle = Z.stone[1]; b.fillRect(x + 3, y + 7, 10, 1); b.fillRect(x + 7, y + 2, 1, 5);
    }
    // --- Dinamita
    for (const o of game.dyn) {
      const x = o.x * TILE - camX, y = o.y * TILE - camY;
      b.fillStyle = '#c0281e'; b.fillRect(x + 5, y + 6, 6, 10);
      b.fillStyle = '#2a1a10'; b.fillRect(x + 5, y + 9, 6, 1); b.fillRect(x + 5, y + 13, 6, 1);
      b.fillStyle = Math.floor(game.t * 12) % 2 ? '#ffd23f' : '#ff6a2a'; b.fillRect(x + 9, y + 4, 2, 2);
    }

    particles.draw(b, camX, camY);

    // --- Grisú: culling con la SpatialGrid (solo los que están en pantalla)
    const vis = grid.queryRect(camX - 16, camY - 16, camX + w + 16, camY + h + 16, this.tmp);
    this.stats.visibleWisps = vis.length;
    for (const o of vis) {
      const r = o.r + Math.sin(o.ph * 3) * 1.5;
      b.fillStyle = 'rgba(120,255,150,.25)'; b.beginPath(); b.arc(o.x - camX, o.y - camY, r + 3, 0, Math.PI * 2); b.fill();
      b.fillStyle = '#9dffb0'; b.beginPath(); b.arc(o.x - camX, o.y - camY, r * 0.5, 0, Math.PI * 2); b.fill();
    }

    this.drawPlayer(b, game, camX, camY);

    // --- Recolectar fuentes de luz/brillo visibles (un solo recorrido)
    const glows = this.glows; glows.length = 0;
    const tx0 = Math.max(0, Math.floor(camX / TILE)), tx1 = Math.min(COLS - 1, Math.floor((camX + w) / TILE));
    const ty0 = Math.max(0, Math.floor(camY / TILE)), ty1 = Math.min(ROWS - 1, Math.floor((camY + h) / TILE));
    for (let y = ty0; y <= ty1; y++) {
      for (let x = tx0; x <= tx1; x++) {
        const t = world.get(x, y), info = TILE_INFO[t];
        // minerales y bitácoras solo brillan si ya los descubriste; magma y Veta Madre siempre
        if (info && info.glow && (t === T.MAGMA || t === T.HEART || world.seen[y * COLS + x])) glows.push(x, y, t);
      }
    }
    this.stats.glows = glows.length / 3;

    // --- Oscuridad (light buffer)
    const z = zoneOf(Math.max(0, p.ty - SURFACE));
    const dark = Math.max(0, Math.min(0.95, (p.y - SURFACE * TILE) / (TILE * ZONES[z].dark))) * (1 - game.flash * 0.7);
    if (dark > 0.01) {
      const l = this.l;
      l.globalCompositeOperation = 'source-over';
      l.clearRect(0, 0, w, h);
      l.fillStyle = `rgba(5,3,2,${dark})`; l.fillRect(0, 0, w, h);
      l.globalCompositeOperation = 'destination-out';
      const ratio = Math.max(0, p.battery / game.maxBattery);
      const R = p.battery > 0 ? 40 + 18 * game.d.upg.lamp + 70 * ratio : 22;
      this.hole(l, p.x + 8 - camX, p.y + 8 - camY, R);
      for (let i = 0; i < glows.length; i += 3) {
        const t = glows[i + 2];
        if (t === T.MAGMA || t === T.HEART) this.hole(l, glows[i] * TILE + 8 - camX, glows[i + 1] * TILE + 8 - camY, t === T.HEART ? 70 : 30);
      }
      l.globalCompositeOperation = 'source-over';
      b.drawImage(this.light, 0, 0);
    }

    // --- Bloom: brillos a baja resolución sumados con "lighter"
    if (this.bloomOn) {
      const bl = this.bl, s = 1 / this.bloomScale;
      bl.clearRect(0, 0, this.bloom.width, this.bloom.height);
      bl.globalCompositeOperation = 'lighter';
      for (let i = 0; i < glows.length; i += 3) {
        const x = glows[i], y = glows[i + 1], t = glows[i + 2], info = TILE_INFO[t];
        const big = t === T.HEART ? 7 : t === T.MAGMA ? 3.5 : t === T.JOURNAL ? 3 : 2.2;
        bl.globalAlpha = (t === T.MAGMA ? 0.5 : 0.45) + 0.2 * Math.sin(game.t * 3 + x * 1.7 + y);
        bl.fillStyle = info.glow;
        bl.beginPath(); bl.arc((x * TILE + 8 - camX) * s, (y * TILE + 8 - camY) * s, big, 0, Math.PI * 2); bl.fill();
      }
      bl.globalAlpha = 0.7; bl.fillStyle = '#7dff9a';
      for (const o of vis) { bl.beginPath(); bl.arc((o.x - camX) * s, (o.y - camY) * s, (o.r + 4) * s, 0, Math.PI * 2); bl.fill(); }
      if (p.battery > 0) {
        bl.globalAlpha = 0.5; bl.fillStyle = '#fff2b0';
        bl.beginPath(); bl.arc((p.x + (p.face > 0 ? 12 : 4) - camX) * s, (p.y + 3 - camY) * s, 3, 0, Math.PI * 2); bl.fill();
      }
      bl.globalAlpha = 1;
      particles.drawGlow(bl, camX, camY, s);
      if (game.flash > 0) { bl.globalAlpha = game.flash * 0.6; bl.fillStyle = '#ffd08a'; bl.fillRect(0, 0, this.bloom.width, this.bloom.height); bl.globalAlpha = 1; }
      bl.globalCompositeOperation = 'source-over';
      b.save();
      b.globalCompositeOperation = 'lighter';
      b.imageSmoothingEnabled = true;
      if (this.hasFilter) b.filter = 'blur(2px)';
      b.drawImage(this.bloom, 0, 0, w, h);
      b.restore();
    }

    drawUI(b, this, game, camX, camY, grid, debug, fps);
    return this.back;
  }

  hole(l, cx, cy, R) {
    const g = l.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g; l.fillRect(cx - R, cy - R, R * 2, R * 2);
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
