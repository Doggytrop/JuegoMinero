import {
  TILE, VIEW_W, VIEW_H, COLS, ROWS, SURFACE, T, TILE_INFO, DEBT, HEART_REWARD,
  ZONES, UPGRADES, ITEMS, isPassable, zoneOf,
} from './config.js';
import { World } from './world.js';
import { INTRO, JOURNALS, ZONE_LINES, MILESTONES, HEART_TEXT, NPCS, ACHIEVEMENTS, ENDING } from './story.js';
import { saveGame, loadGame, clearSave, u8ToB64, b64ToU8 } from './save.js';

const ORE_ORDER = [T.COPPER, T.SILVER, T.TURQ, T.GOLD, T.OPAL];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class Game {
  constructor(sfx, particles, grid, keys) {
    Object.assign(this, { sfx, particles, grid, keys });
    this.near = [];
    this.t = 0;
    this.toasts = [];
    this.banner = null;
    this.msg = ''; this.msgT = 0;
    this.shake = 0; this.flash = 0;
    this.saveT = 0;
    this.shopSel = 0;
    this.showMinimap = true;
    this.ending = ENDING;
    const s = loadGame();
    this.hasSave = !!s;
    if (s) this.applySave(s); else this.fresh();
    this.mode = 'title';
  }

  // ---------------- Campaña / guardado ----------------
  fresh() {
    this.d = {
      seed: (Math.random() * 1e9) | 0, money: 0, debtPaid: 0, milestones: 0,
      upg: { drill: 1, battery: 0, cart: 0, helmet: 0, lamp: 0 },
      items: { ladders: 12, dynamite: 2, radio: 1 },
      journals: JOURNALS.map(() => false), heart: false, ended: false, quest: null, zones: 1, ach: {},
      stats: { maxDepth: 0, dug: 0, explosions: 0, wispsKilled: 0, quests: 0, rescues: 0, earned: 0, time: 0 },
    };
    this.world = new World(this.d.seed);
    this.d.quest = this.genQuest();
    this.resetEntities();
  }

  applySave(s) {
    const { tiles, seen, ...d } = s;
    this.d = d;
    this.world = new World(d.seed, b64ToU8(tiles), b64ToU8(seen));
    this.resetEntities();
  }

  save() {
    saveGame({ ...this.d, tiles: u8ToB64(this.world.tiles), seen: u8ToB64(this.world.seen) });
    this.hasSave = true;
  }

  resetEntities() {
    this.rocks = [];
    this.dyn = [];
    this.wisps = [];
    for (let i = 0; i < 70; i++) this.wisps.push(this.placeWisp({ ph: Math.random() * 6.28, r: 5, vx: 0, vy: 0 }, false));
    this.spawnPlayer();
    this.cam = { x: this.p.x - VIEW_W / 2, y: -110 };
  }

  // Punto seguro en la superficie (que no esté encima de un tiro excavado)
  safeX() {
    for (let k = 0; k < COLS; k++) {
      for (const x of [6 - k, 6 + k]) {
        if (x > 0 && x < COLS - 1 && !isPassable(this.world.get(x, SURFACE))) return x;
      }
    }
    return 6;
  }

  spawnPlayer() {
    const sx = this.safeX();
    this.p = {
      tx: sx, ty: SURFACE - 1, x: sx * TILE, y: (SURFACE - 1) * TILE, fromX: 0, fromY: 0,
      moving: false, moveT: 0, moveDur: 0.09, face: 1, digT: 0, digKey: -1, sndT: 0, bumpT: 0,
      inv: 0, fall: 0, cargo: [], radioT: 0, hotT: 0, warnT: 0, health: 0, battery: 0,
    };
    this.p.health = this.maxHealth;
    this.p.battery = this.maxBattery;
    this.world.reveal(sx, SURFACE, 4);
  }

  // Valores derivados de las mejoras
  get maxHealth() { return 100 + 25 * this.d.upg.helmet + (this.d.milestones >= 1 ? 25 : 0); }
  get maxBattery() { return 100 + 40 * this.d.upg.battery; }
  get cap() { return 10 + 6 * this.d.upg.cart; }
  get drill() { return this.d.upg.drill; }
  get discount() { return this.d.milestones >= 3 ? 0.8 : 1; }
  get radar() { return this.d.milestones >= 2; }
  get depth() { return Math.max(0, this.p.ty - SURFACE + 1); }
  get atSurfaceRow() { return this.p.ty === SURFACE - 1; }

  // ---------------- Modos: title, dialog, play, shop, pause, ending ----------------
  startFromTitle() {
    if (this.hasSave) { this.mode = 'play'; this.say('¡Bienvenido de vuelta a San Isidro!'); }
    else this.newGame();
  }

  newGame() {
    clearSave();
    this.fresh();
    this.save();
    this.dialog(INTRO, () => this.say('Excava hacia abajo con ↓'));
  }

  dialog(pages, onDone = null) {
    this.dlg = { pages, i: 0, onDone };
    this.mode = 'dialog';
    this.sfx.page();
  }

  onPress(a) {
    const m = this.mode;
    if (m === 'title') {
      if (a === 'ok') this.startFromTitle();
      else if (a === 'new') this.newGame();
    } else if (m === 'dialog') {
      if (a === 'ok' || a === 'dyn') {
        this.dlg.i++;
        if (this.dlg.i >= this.dlg.pages.length) {
          this.mode = 'play';
          const cb = this.dlg.onDone; this.dlg = null;
          if (cb) cb();
        } else this.sfx.page();
      }
    } else if (m === 'shop') {
      const n = this.shopEntries().length;
      if (a === 'up') { this.shopSel = (this.shopSel + n - 1) % n; this.sfx.beep(); }
      else if (a === 'down') { this.shopSel = (this.shopSel + 1) % n; this.sfx.beep(); }
      else if (a === 'ok' || a === 'dyn') this.buy(this.shopEntries()[this.shopSel]);
      else if (a === 'back' || a === 'shop' || a === 'pause') this.mode = 'play';
    } else if (m === 'pause') {
      if (a === 'pause' || a === 'back' || a === 'ok') this.mode = 'play';
    } else if (m === 'ending') {
      if (a === 'ok') { this.mode = 'play'; this.say('Modo libre: sigue explorando la sierra'); }
    } else if (m === 'play') {
      if (a === 'ok' || a === 'shop') {
        if (this.atSurfaceRow && !this.p.moving) { this.mode = 'shop'; this.shopSel = 0; this.sfx.page(); }
        else if (a === 'shop') this.say('La tienda está en la superficie');
      } else if (a === 'dyn') this.placeDynamite();
      else if (a === 'radio') this.useRadio();
      else if (a === 'pause' || a === 'back') this.mode = 'pause';
    }
  }

  // ---------------- Actualización ----------------
  update(dt) {
    this.t += dt;
    this.particles.update(dt);
    if (this.msgT > 0) this.msgT -= dt;
    this.shake = Math.max(0, this.shake - dt * 20);
    this.flash = Math.max(0, this.flash - dt * 2);
    for (const t of this.toasts) t.life -= dt;
    this.toasts = this.toasts.filter((t) => t.life > 0);
    if (this.banner && (this.banner.life -= dt) <= 0) this.banner = null;

    if (this.mode === 'play') {
      this.d.stats.time += dt;
      this.updatePlayer(dt);
      this.updateRocks(dt);
      this.updateDynamite(dt);
      this.updateWisps(dt, true);
      this.saveT += dt;
      if (this.saveT > 30) { this.saveT = 0; this.save(); }
    } else if (this.mode === 'title') {
      this.updateWisps(dt, false);
    }
    this.updateCamera(dt);
    this.sfx.setZone(this.p.ty >= SURFACE ? zoneOf(this.p.ty - SURFACE) : 0);
  }

  updatePlayer(dt) {
    const p = this.p;
    p.inv = Math.max(0, p.inv - dt);
    p.bumpT = Math.max(0, p.bumpT - dt);
    p.warnT = Math.max(0, p.warnT - dt);

    if (p.radioT > 0) {
      p.radioT -= dt;
      if (Math.floor(p.radioT * 4) !== Math.floor((p.radioT + dt) * 4)) this.sfx.radio();
      if (p.radioT <= 0) { this.teleportSurface(); return; }
    }

    if (p.moving) {
      p.moveT += dt / p.moveDur;
      const k = Math.min(1, p.moveT);
      p.x = p.fromX + (p.tx * TILE - p.fromX) * k;
      p.y = p.fromY + (p.ty * TILE - p.fromY) * k;
      if (k >= 1) { p.moving = false; this.afterMove(); }
    }
    if (!p.moving && this.mode === 'play') this.playerStep(dt);
    if (this.mode !== 'play') return;

    // Consumo de batería, calor del magma y oscuridad
    if (p.ty >= SURFACE) {
      const z = zoneOf(p.ty - SURFACE);
      p.battery -= dt * (0.8 + this.depth * 0.005) * ZONES[z].heat;
      const w = this.world;
      if (w.get(p.tx - 1, p.ty) === T.MAGMA || w.get(p.tx + 1, p.ty) === T.MAGMA ||
          w.get(p.tx, p.ty - 1) === T.MAGMA || w.get(p.tx, p.ty + 1) === T.MAGMA) {
        p.hotT -= dt;
        if (p.hotT <= 0) { this.sfx.sizzle(); p.hotT = 0.35; this.say('¡Te quemas! Aléjate del magma', 1); }
        this.damage(18 * dt, 'calor', true);
      }
      if (p.battery <= 0) {
        p.battery = 0;
        if (p.warnT <= 0) { this.say('¡Sin luz! Regresa ya o usa el radio [E]', 1.5); this.sfx.beep(); p.warnT = 1.5; }
        this.damage(7 * dt, 'oscuridad', true);
      } else if (p.battery < this.maxBattery * 0.2 && p.warnT <= 0) { this.sfx.beep(); p.warnT = 1; }
    }
  }

  playerStep(dt) {
    const p = this.p, w = this.world;
    if (!this.supported(p.tx, p.ty)) { this.moveTo(p.tx, p.ty + 1, 0.065); p.fall++; p.digKey = -1; return; }
    if (p.fall > 0) {
      if (p.fall >= 4) {
        this.sfx.thud();
        this.damage((p.fall - 3) * 10, 'una caída');
        if (p.fall >= 8 && p.health > 0) this.unlock('sobreviviente');
      } else if (p.fall >= 2) this.sfx.land();
      p.fall = 0;
      if (this.mode !== 'play') return;
    }
    const k = this.keys;
    let dx = 0, dy = 0;
    if (k.has('left')) dx = -1; else if (k.has('right')) dx = 1;
    else if (k.has('down')) dy = 1; else if (k.has('up')) dy = -1;
    if (!dx && !dy) { p.digKey = -1; p.digT = 0; return; }

    if (dx) { p.face = dx; this.tryMoveOrDig(p.tx + dx, p.ty, dt, 0.09); return; }
    if (dy === 1) { this.tryMoveOrDig(p.tx, p.ty + 1, dt, 0.09); return; }

    // Subir: requiere escalera en el bloque actual (se coloca automáticamente)
    const ny = p.ty - 1;
    if (ny < SURFACE - 1) { this.bump(); return; }
    const above = w.get(p.tx, ny);
    if (isPassable(above)) {
      if (this.rockAt(p.tx, ny)) { this.bump(); return; }
      if (w.get(p.tx, p.ty) !== T.LADDER) {
        if (this.d.items.ladders <= 0) {
          if (p.bumpT <= 0) { this.say('¡Sin escaleras! Usa el radio [E] o cómpralas'); this.sfx.bump(); p.bumpT = 1; }
          return;
        }
        w.set(p.tx, p.ty, T.LADDER);
        this.d.items.ladders--;
        this.sfx.ladder();
      }
      this.moveTo(p.tx, ny, 0.12);
    } else this.dig(p.tx, ny, above, dt);
  }

  supported(x, y) {
    const w = this.world;
    if (w.get(x, y) === T.LADDER) return true;
    const below = w.get(x, y + 1);
    if (below === T.AIR) return this.rockAt(x, y + 1);
    return true; // sólido o escalera debajo
  }

  tryMoveOrDig(nx, ny, dt, dur) {
    const t = this.world.get(nx, ny);
    if (isPassable(t)) {
      if (this.rockAt(nx, ny)) { this.bump(); return; }
      this.moveTo(nx, ny, dur);
      this.p.digKey = -1;
    } else this.dig(nx, ny, t, dt);
  }

  moveTo(x, y, dur) {
    const p = this.p;
    p.fromX = p.x; p.fromY = p.y; p.tx = x; p.ty = y;
    p.moveT = 0; p.moveDur = dur; p.moving = true;
  }

  bump(msg) {
    const p = this.p;
    p.digKey = -1;
    if (p.bumpT <= 0) { this.sfx.bump(); p.bumpT = 0.6; if (msg) this.say(msg); }
  }

  afterMove() {
    const p = this.p, d = this.d;
    this.world.reveal(p.tx, p.ty, 5);
    const depth = this.depth;
    if (depth > d.stats.maxDepth) {
      d.stats.maxDepth = depth;
      if (depth >= 50) this.unlock('m50');
      if (depth >= 100) this.unlock('m100');
      if (depth >= 150) this.unlock('m150');
    }
    if (p.ty >= SURFACE) {
      const z = zoneOf(p.ty - SURFACE);
      if (!(d.zones & (1 << z))) {
        d.zones |= 1 << z;
        this.banner = { title: `ZONA ${z + 1}`, sub: ZONES[z].name, life: 3.5 };
        this.sfx.zoneEnter();
        this.say(ZONE_LINES[z], 4);
      }
      // Roca suelta encima: empieza a temblar
      if (this.world.get(p.tx, p.ty - 1) === T.LOOSE) this.checkLoose(p.tx, p.ty);
    }
    if (this.atSurfaceRow) this.atSurface();
  }

  dig(nx, ny, t, dt) {
    const p = this.p, info = TILE_INFO[t];
    if (!info || info.hard === Infinity) { this.bump(t === T.MAGMA ? 'El magma no se puede excavar' : null); return; }
    if (info.granite) {
      const req = zoneOf(ny - SURFACE) + 2;
      if (this.drill < req) { this.bump(`Granito: necesitas Taladro nivel ${req}`); return; }
    }
    const key = ny * COLS + nx;
    if (p.digKey !== key) { p.digKey = key; p.digT = 0; }
    p.digT += dt * (0.7 + 0.35 * this.drill);
    const z = zoneOf(Math.max(0, ny - SURFACE));
    const need = info.hard * 0.14 * (1 + 0.2 * z);
    p.digNeed = need;
    const cx = ((p.tx + nx) / 2) * TILE + 8, cy = ((p.ty + ny) / 2) * TILE + 8;
    if (Math.random() < 0.4) this.particles.spawn(cx, cy, (Math.random() - 0.5) * 80, -Math.random() * 60, 0.4, '#8a6a50', 2);
    p.sndT -= dt;
    if (p.sndT <= 0) { this.sfx.dig(info.hard); p.sndT = 0.09; }
    if (p.digT >= need) {
      p.digKey = -1; p.digT = 0;
      p.battery -= info.hard * 0.4;
      this.breakTile(nx, ny);
    }
  }

  breakTile(x, y) {
    const t = this.world.get(x, y), info = TILE_INFO[t];
    this.world.set(x, y, T.AIR);
    this.d.stats.dug++;
    if (this.d.stats.dug === 1) this.unlock('primer');
    this.sfx.breakBlock();
    this.burst(x * TILE + 8, y * TILE + 8, 10, '#8a6a50', 110);
    if (info.value) this.collect(t, x, y);
    if (t === T.JOURNAL) this.readJournal(y);
    if (t === T.HEART) this.foundHeart();
    this.checkLoose(x, y);
  }

  collect(t, x, y) {
    const p = this.p, info = TILE_INFO[t];
    if (p.cargo.length >= this.cap) { this.say('Carretilla llena: regresa a la superficie'); this.sfx.beep(); return; }
    p.cargo.push(t);
    if (info.gem) this.sfx.gem(); else this.sfx.ore();
    this.burst(x * TILE + 8, y * TILE + 8, 14, info.glow, 120, true);
    this.say(`+ ${info.name} ($${info.value})`, 1.2);
    if (t === T.TURQ) this.unlock('turquesa');
    if (t === T.GOLD) this.unlock('oro');
    if (t === T.OPAL) this.unlock('opalo');
  }

  readJournal(y) {
    const i = JOURNALS.findIndex((j) => j.d === y - SURFACE);
    if (i < 0) return;
    this.d.journals[i] = true;
    const n = this.d.journals.filter(Boolean).length;
    if (n === JOURNALS.length) this.unlock('historiador');
    this.save();
    this.dialog([{ title: `Bitácora de Don Chuy (${n}/${JOURNALS.length})`, text: JOURNALS[i].text }]);
  }

  foundHeart() {
    const d = this.d;
    d.heart = true;
    d.money += HEART_REWARD; d.stats.earned += HEART_REWARD;
    this.unlock('corazon');
    this.flash = 1; this.shake = 8;
    this.sfx.victory();
    this.burst(this.p.x + 8, this.p.y + 8, 60, '#ffe060', 160, true);
    this.save();
    this.dialog([HEART_TEXT], () => {
      if (!this.checkEnding()) this.say(`Regresa y paga la deuda: faltan $${DEBT - d.debtPaid}`, 4);
    });
  }

  checkEnding() {
    const d = this.d;
    if (d.debtPaid >= DEBT && d.heart && !d.ended) {
      d.ended = true; this.save();
      this.mode = 'ending'; this.sfx.victory();
      return true;
    }
    return false;
  }

  damage(n, src, continuous = false) {
    const p = this.p;
    if (!continuous && p.inv > 0) return;
    p.health -= n * (1 - 0.1 * this.d.upg.helmet);
    if (!continuous) { p.inv = 0.8; this.shake = 6; this.sfx.hurt(); }
    if (p.health <= 0) this.rescue(src);
  }

  rescue(src) {
    const d = this.d, lost = this.p.cargo.length;
    const fee = Math.floor(d.money * 0.15);
    d.money -= fee; d.stats.rescues++;
    this.dyn = []; this.rocks = [];
    this.spawnPlayer();
    this.save();
    this.sfx.over();
    this.dialog([{ title: 'Te rescataron', text: `Te desmayaste por ${src}. Los mineros de San Isidro bajaron por ti.\n\nPerdiste ${lost} minerales de la carretilla y pagaste $${fee} por el rescate. La mina sigue como la dejaste.` }]);
  }

  atSurface() {
    const p = this.p, d = this.d, msgs = [];
    // 1) Encargo del pueblo
    const q = d.quest;
    if (q) {
      const have = p.cargo.filter((t) => t === q.ore).length;
      const take = Math.min(have, q.n - q.got);
      if (take > 0) {
        let left = take;
        p.cargo = p.cargo.filter((t) => !(t === q.ore && left-- > 0));
        q.got += take;
        if (q.got >= q.n) {
          d.money += q.reward; d.stats.earned += q.reward; d.stats.quests++;
          this.toast('Encargo cumplido', `${q.npc}: ¡Gracias! +$${q.reward}`);
          this.sfx.quest();
          if (d.stats.quests >= 5) this.unlock('vecino');
          d.quest = this.genQuest();
        } else msgs.push(`Entregaste ${take} de ${TILE_INFO[q.ore].name} a ${q.npc}`);
      }
    }
    // 2) Vender el resto
    const value = p.cargo.reduce((a, t) => a + TILE_INFO[t].value, 0);
    if (value > 0) {
      d.money += value; d.stats.earned += value; p.cargo = [];
      this.sfx.sell(); msgs.push(`Vendiste $${value}`);
      this.burst(p.x + 8, p.y, 24, '#ffd23f', 120, true);
    }
    // 3) Recargar
    if (p.battery < this.maxBattery || p.health < this.maxHealth) {
      p.battery = this.maxBattery; p.health = this.maxHealth;
      msgs.push('Salud y batería recargadas');
    }
    if (msgs.length) { this.say(msgs.join(' · '), 2.5); this.save(); }
  }

  genQuest() {
    const md = this.d.stats.maxDepth;
    const pool = [T.COPPER];
    if (md > 20) pool.push(T.SILVER);
    if (md > 47) pool.push(T.TURQ);
    if (md > 102) pool.push(T.GOLD);
    if (md > 162) pool.push(T.OPAL);
    const ore = pick(pool.slice(-2));
    const n = rnd(3, 7);
    const npc = pick(NPCS);
    const reward = Math.round((n * TILE_INFO[ore].value * 1.8 + 40) / 10) * 10;
    return { npc: npc.name, reason: pick(npc.reasons), ore, n, got: 0, reward };
  }

  // ---------------- Tienda ----------------
  shopEntries() {
    const d = this.d, e = [];
    for (const u of UPGRADES) {
      const lvl = d.upg[u.id];
      const idx = u.id === 'drill' ? lvl - 1 : lvl;
      const c = u.costs[idx];
      e.push({ type: 'up', ref: u, label: `${u.name} (Nv ${lvl})`, cost: c == null ? null : Math.round(c * this.discount), desc: u.desc });
    }
    for (const it of ITEMS) e.push({ type: 'item', ref: it, label: `${it.name}  [tienes ${d.items[it.id]}]`, cost: Math.round(it.cost * this.discount), desc: it.desc });
    const rem = DEBT - d.debtPaid;
    e.push({ type: 'debt', label: rem > 0 ? `Abonar a la deuda del pueblo (faltan $${rem})` : 'Deuda pagada ✔', cost: rem > 0 ? Math.min(rem, d.money) : null, desc: 'Cada 25% pagado reabre un lugar del pueblo y te da una ventaja.' });
    e.push({ type: 'exit', label: 'Salir', cost: null, desc: 'Regresar a la mina.' });
    return e;
  }

  buy(e) {
    const d = this.d;
    if (e.type === 'exit') { this.mode = 'play'; return; }
    if (e.type === 'debt') {
      const rem = DEBT - d.debtPaid;
      if (rem <= 0 || d.money <= 0) { this.say(rem <= 0 ? 'La deuda ya está pagada' : 'No tienes dinero'); this.sfx.beep(); return; }
      const amt = Math.min(rem, d.money);
      d.money -= amt; d.debtPaid += amt;
      this.sfx.sell();
      this.say(`Abonaste $${amt} a la deuda`);
      this.checkMilestones();
      this.save();
      return;
    }
    if (e.cost == null) { this.say('Nivel máximo'); this.sfx.beep(); return; }
    if (d.money < e.cost) { this.say(`Te faltan $${e.cost - d.money}`); this.sfx.beep(); return; }
    d.money -= e.cost;
    if (e.type === 'up') {
      d.upg[e.ref.id]++;
      if (e.ref.id === 'battery') this.p.battery = this.maxBattery;
      if (e.ref.id === 'helmet') this.p.health = this.maxHealth;
      this.say(`${e.ref.name} mejorado a nivel ${d.upg[e.ref.id]}`);
    } else {
      d.items[e.ref.id] += e.ref.qty;
      this.say(`Compraste ${e.ref.name}`);
    }
    this.sfx.upgrade();
    this.save();
  }

  checkMilestones() {
    const d = this.d;
    const reached = Math.min(4, Math.floor((d.debtPaid / DEBT) * 4 + 1e-9));
    const pages = [];
    while (d.milestones < reached) { pages.push({ ...MILESTONES[d.milestones] }); d.milestones++; }
    if (!pages.length) return;
    if (d.milestones >= 4) {
      this.unlock('salvador');
      if (!d.heart) pages[pages.length - 1].text += '\n\nSolo falta una cosa: llegar al Corazón de la Sierra, a más de 200 m.';
    }
    this.p.health = this.maxHealth;
    this.sfx.achievement();
    this.dialog(pages, () => this.checkEnding());
  }

  // ---------------- Herramientas ----------------
  placeDynamite() {
    const p = this.p, d = this.d;
    if (d.items.dynamite <= 0) { this.say('Sin dinamita: cómprala en la tienda'); this.sfx.beep(); return; }
    if (p.ty < SURFACE) { this.say('Aquí no: el pueblo está cerca'); this.sfx.beep(); return; }
    d.items.dynamite--;
    this.dyn.push({ x: p.tx, y: p.ty, t: 2 });
    this.sfx.fuse();
    this.say('¡Dinamita encendida! Aléjate', 1.5);
  }

  updateDynamite(dt) {
    for (let i = this.dyn.length - 1; i >= 0; i--) {
      const o = this.dyn[i];
      o.t -= dt;
      if (Math.random() < 0.6) this.particles.spawn(o.x * TILE + 10, o.y * TILE + 6, (Math.random() - 0.5) * 40, -30 - Math.random() * 30, 0.3, '#ffd23f', 1, true, 0.3);
      if (o.t <= 0) { this.dyn.splice(i, 1); this.explode(o.x, o.y); }
    }
  }

  explode(cx, cy) {
    const w = this.world, d = this.d, R = 2.4;
    const cleared = [];
    let lost = 0, kills = 0;
    for (let y = cy - 3; y <= cy + 3; y++) {
      for (let x = cx - 3; x <= cx + 3; x++) {
        if (Math.hypot(x - cx, y - cy) > R) continue;
        const t = w.get(x, y);
        if (t === T.AIR || t === T.BEDROCK || t === T.GRANITE || t === T.MAGMA || t === T.HEART) continue;
        if (t === T.JOURNAL) { this.breakTile(x, y); continue; }
        if (TILE_INFO[t] && TILE_INFO[t].value) lost++;
        w.set(x, y, T.AIR);
        cleared.push([x, y]);
        this.burst(x * TILE + 8, y * TILE + 8, 4, '#6a4a3a', 160);
      }
    }
    for (const [x, y] of cleared) this.checkLoose(x, y);
    const p = this.p;
    if (Math.hypot(p.tx - cx, p.ty - cy) <= R + 0.6) { p.inv = 0; this.damage(35, 'una explosión'); }
    const px = cx * TILE + 8, py = cy * TILE + 8, rr = R * TILE * 1.5;
    for (const o of this.grid.query(px, py, rr, this.near)) {
      if (Math.hypot(o.x - px, o.y - py) < rr) { this.placeWisp(o, true); kills++; }
    }
    d.stats.explosions++; d.stats.wispsKilled += kills;
    if (d.stats.explosions >= 10) this.unlock('dinamitero');
    if (d.stats.wispsKilled >= 5) this.unlock('cazagrisu');
    this.shake = 10; this.flash = 1;
    this.sfx.explode();
    this.burst(px, py, 40, '#ff9a2a', 220, true, 0.4);
    if (kills) this.say(`¡Dispersaste ${kills} nube${kills > 1 ? 's' : ''} de grisú!`);
    else if (lost) this.say(`La explosión destruyó ${lost} mineral${lost > 1 ? 'es' : ''}`);
  }

  useRadio() {
    const p = this.p, d = this.d;
    if (p.ty < SURFACE) { this.say('Ya estás en la superficie'); return; }
    if (p.radioT > 0) return;
    if (d.items.radio <= 0) { this.say('No tienes radio: cómpralo en la tienda'); this.sfx.beep(); return; }
    d.items.radio--;
    p.radioT = 2;
    this.say('Llamando al malacate… ¡aguanta!', 2);
  }

  teleportSurface() {
    const p = this.p, sx = this.safeX();
    p.tx = sx; p.ty = SURFACE - 1; p.x = sx * TILE; p.y = p.ty * TILE;
    p.moving = false; p.fall = 0; p.digKey = -1; p.radioT = 0;
    this.sfx.upgrade();
    this.burst(p.x + 8, p.y + 8, 20, '#fff2b0', 100, true);
    this.atSurface();
  }

  // ---------------- Derrumbes (roca suelta) ----------------
  checkLoose(x, y) {
    if (this.world.get(x, y - 1) !== T.LOOSE) return;
    this.world.set(x, y - 1, T.AIR);
    this.rocks.push({ tx: x, y: (y - 1) * TILE, vy: 0, warn: 0.6 });
    this.sfx.rumble();
  }

  rockAt(x, y) {
    for (const r of this.rocks) if (r.tx === x && Math.floor((r.y + 8) / TILE) === y) return true;
    return false;
  }

  updateRocks(dt) {
    const w = this.world, p = this.p;
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      if (r.warn > 0) {
        r.warn -= dt;
        if (r.warn <= 0) this.checkLoose(r.tx, Math.round(r.y / TILE)); // reacción en cadena
        continue;
      }
      r.vy = Math.min(320, r.vy + 700 * dt);
      r.y += r.vy * dt;
      if (Math.abs(p.x - r.tx * TILE) < 12 && Math.abs(p.y - r.y) < 13) {
        this.rocks.splice(i, 1);
        this.burst(r.tx * TILE + 8, r.y + 8, 16, '#7a7a80', 140);
        this.sfx.thud();
        this.damage(30, 'un derrumbe');
        continue;
      }
      const row = Math.floor(r.y / TILE), below = w.get(r.tx, row + 1);
      if (below === T.LADDER) { w.set(r.tx, row + 1, T.AIR); this.burst(r.tx * TILE + 8, (row + 1) * TILE + 8, 6, '#8a5a2b', 80); }
      else if (!isPassable(below)) {
        if (isPassable(w.get(r.tx, row))) w.set(r.tx, row, T.LOOSE);
        this.rocks.splice(i, 1);
        this.sfx.thud(); this.shake = Math.max(this.shake, 3);
        this.burst(r.tx * TILE + 8, row * TILE + 14, 10, '#9a8a7a', 90);
      }
    }
  }

  // ---------------- Grisú (enemigos) + SpatialGrid ----------------
  placeWisp(o, far) {
    for (let tries = 0; tries < 12; tries++) {
      o.x = (1 + Math.random() * (COLS - 2)) * TILE;
      o.y = (SURFACE + 25 + Math.random() ** 0.8 * (ROWS - SURFACE - 30)) * TILE;
      if (!far || Math.hypot(o.x - this.p.x, o.y - this.p.y) > 14 * TILE) break;
    }
    o.vx = 0; o.vy = 0;
    return o;
  }

  updateWisps(dt, active) {
    this.grid.clear();
    const p = this.p, px = p.x + 8, py = p.y + 8;
    const R2 = (7 * TILE) ** 2;
    for (const o of this.wisps) {
      o.ph += dt * 2;
      let ax = Math.cos(o.ph * 0.7) * 10, ay = Math.sin(o.ph) * 10;
      const dx = px - o.x, dy = py - o.y, d2 = dx * dx + dy * dy;
      if (active && d2 < R2 && p.ty >= SURFACE) {
        const dd = Math.sqrt(d2) || 1, sp = 36 + (o.y / TILE) * 0.12;
        ax += (dx / dd) * sp; ay += (dy / dd) * sp;
      }
      o.vx += (ax - o.vx) * dt * 1.5;
      o.vy += (ay - o.vy) * dt * 1.5;
      o.x = Math.max(TILE, Math.min((COLS - 1) * TILE, o.x + o.vx * dt));
      o.y = Math.max((SURFACE + 8) * TILE, Math.min((ROWS - 2) * TILE, o.y + o.vy * dt));
      this.grid.insert(o);
    }
    // Colisión: solo se revisan los grisú de las celdas vecinas
    if (active && p.inv <= 0) {
      for (const o of this.grid.query(px, py, TILE, this.near)) {
        const dx = px - o.x, dy = py - o.y;
        if (dx * dx + dy * dy < (o.r + 6) ** 2) {
          p.battery = Math.max(0, p.battery - 10);
          this.say('¡Grisú! −salud −batería', 1.5);
          this.burst(o.x, o.y, 18, '#9dffb0', 100, true, 0.2);
          this.placeWisp(o, true);
          this.damage(15, 'el grisú');
          break;
        }
      }
    }
  }

  updateCamera(dt) {
    const p = this.p;
    const tx = Math.max(0, Math.min(COLS * TILE - VIEW_W, p.x + 8 - VIEW_W / 2));
    const ty = Math.max(-110, Math.min(ROWS * TILE - VIEW_H, p.y + 8 - VIEW_H / 2));
    const k = Math.min(1, dt * 8);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
  }

  // ---------------- Utilidades ----------------
  say(msg, t = 2) { this.msg = msg; this.msgT = t; }

  toast(title, text) { this.toasts.push({ title, text, life: 4 }); if (this.toasts.length > 3) this.toasts.shift(); }

  unlock(id) {
    if (this.d.ach[id]) return;
    this.d.ach[id] = true;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    this.toast('¡Logro desbloqueado!', a.name);
    this.sfx.achievement();
  }

  burst(x, y, n, color, speed, glow = false, grav = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.6);
      this.particles.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s - speed * 0.3, 0.4 + Math.random() * 0.4, color, 2, glow, grav);
    }
  }
}

export { ORE_ORDER };
