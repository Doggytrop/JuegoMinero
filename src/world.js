import { COLS, ROWS, SURFACE, T, CHUNK_ROWS, zoneOf, isBarrierRow } from './config.js';
import { JOURNALS } from './story.js';

// Generador pseudoaleatorio con semilla (mismo mapa para la misma semilla)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Probabilidades de mineral por zona (acumulativas en generate)
const ORE_TABLE = [
  [[T.SILVER, 0.025, 25], [T.COPPER, 0.09, 2]],
  [[T.TURQ, 0.035], [T.SILVER, 0.06], [T.COPPER, 0.04]],
  [[T.GOLD, 0.045], [T.TURQ, 0.03], [T.SILVER, 0.03]],
  [[T.OPAL, 0.03], [T.GOLD, 0.05], [T.TURQ, 0.02]],
];

export class World {
  constructor(seed, tiles = null, seen = null) {
    this.seed = seed;
    // Uint8Array: 1 byte por bloque, memoria contigua y rápida de recorrer
    this.tiles = tiles || new Uint8Array(COLS * ROWS);
    this.seen = seen || new Uint8Array(COLS * ROWS); // "niebla de guerra" del minimapa
    this.chunkVer = new Uint32Array(Math.ceil(ROWS / CHUNK_ROWS)); // dirty flags por chunk
    this.version = 1;
    if (!tiles) this.generate();
  }

  generate() {
    const r = mulberry32(this.seed);
    const tiles = this.tiles;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const d = y - SURFACE;
        let t;
        if (y < SURFACE) t = T.AIR;
        else if (x === 0 || x === COLS - 1 || y === ROWS - 1) t = T.BEDROCK;
        else if (d === 0) t = T.GRASS;
        else if (isBarrierRow(d)) t = T.GRANITE;
        else {
          const z = zoneOf(d);
          const stoneP = [Math.min(0.5, d / 90), 0.55, 0.6, 0.65][z];
          t = r() < stoneP ? T.STONE : T.DIRT;
          const o = r();
          let acc = 0;
          for (const [ore, p, minD = 0] of ORE_TABLE[z]) {
            acc += p;
            if (o < acc) { if (d >= minD) t = ore; break; }
          }
          if (t === T.STONE || t === T.DIRT) {
            const q = r();
            if (z >= 1 && q < 0.05) t = T.LOOSE;
            else if (z === 2 && q < 0.075) t = T.MAGMA;
            else if (z === 3 && q < 0.065) t = T.MAGMA;
          }
          if (d > 8 && r() < 0.02) t = T.AIR;
        }
        tiles[y * COLS + x] = t;
      }
    }
    // Cuevas naturales con "random walk" (más en zonas profundas)
    for (let k = 0; k < 40; k++) {
      let x = 2 + Math.floor(r() * (COLS - 4));
      let y = SURFACE + 12 + Math.floor(r() * (ROWS - SURFACE - 30));
      const len = 20 + Math.floor(r() * 50);
      for (let i = 0; i < len; i++) {
        const t = this.get(x, y);
        if (t !== T.BEDROCK && t !== T.GRANITE) tiles[y * COLS + x] = T.AIR;
        const dir = Math.floor(r() * 4);
        x += dir === 0 ? 1 : dir === 1 ? -1 : 0;
        y += dir === 2 ? 1 : dir === 3 ? -1 : 0;
        x = Math.max(1, Math.min(COLS - 2, x));
        y = Math.max(SURFACE + 8, Math.min(ROWS - 12, y));
      }
    }
    // Ríos de magma en El Infierno
    for (let k = 0; k < 14; k++) {
      const y = SURFACE + 104 + Math.floor(r() * 54);
      const x0 = 2 + Math.floor(r() * (COLS - 10));
      const len = 3 + Math.floor(r() * 5);
      for (let x = x0; x < x0 + len; x++) if (!isBarrierRow(y - SURFACE)) tiles[y * COLS + x] = T.MAGMA;
    }
    // Bitácoras del abuelo (lejos del magma)
    for (const j of JOURNALS) {
      const y = SURFACE + j.d;
      const x = 3 + Math.floor(r() * (COLS - 6));
      for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) {
        if (this.get(xx, yy) === T.MAGMA) tiles[yy * COLS + xx] = T.STONE;
      }
      tiles[y * COLS + x] = T.JOURNAL;
    }
    // Cámara final: el Corazón de la Sierra
    const cy = SURFACE + 220, cx = COLS / 2;
    for (let y = cy - 5; y <= cy + 4; y++) {
      for (let x = cx - 11; x <= cx + 11; x++) {
        const nx = (x - cx) / 11, ny = (y - cy) / 5;
        const k = nx * nx + ny * ny;
        if (k <= 1) tiles[y * COLS + x] = T.AIR;
        else if (k <= 1.5 && this.get(x, y) !== T.BEDROCK) tiles[y * COLS + x] = r() < 0.5 ? T.OPAL : T.GOLD;
      }
    }
    tiles[(cy + 4) * COLS + cx] = T.HEART;
    tiles[(cy + 5) * COLS + cx] = T.STONE;
  }

  get(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return T.BEDROCK;
    return this.tiles[y * COLS + x];
  }

  set(x, y, v) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    this.tiles[y * COLS + x] = v;
    this.version++;
    const c = (y / CHUNK_ROWS) | 0;
    this.chunkVer[c]++;
    // la sombra del túnel depende del bloque de arriba: marcar también el chunk inferior
    const c2 = ((y + 1) / CHUNK_ROWS) | 0;
    if (c2 !== c && c2 < this.chunkVer.length) this.chunkVer[c2]++;
  }

  reveal(cx, cy, r) {
    for (let y = cy - r; y <= cy + r; y++) {
      if (y < 0 || y >= ROWS) continue;
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 0 || x >= COLS) continue;
        const i = y * COLS + x;
        if (!this.seen[i]) { this.seen[i] = 1; this.version++; }
      }
    }
  }
}
