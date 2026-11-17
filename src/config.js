// Configuración global de "Veta Sonora: El Corazón de la Sierra"
export const TILE = 16;          // tamaño de cada bloque en píxeles
export const VIEW_W = 480;       // resolución interna (se escala con CSS, pixel-art)
export const VIEW_H = 270;
export const COLS = 48;          // ancho del mundo en bloques
export const ROWS = 232;         // profundidad del mundo en bloques
export const SURFACE = 4;        // fila donde empieza el suelo
export const CHUNK_ROWS = 16;    // filas por "chunk" de caché
export const STEP = 1 / 60;      // paso fijo de simulación
export const DEBT = 5000;        // deuda del pueblo
export const HEART_REWARD = 2500;

export const T = {
  AIR: 0, DIRT: 1, STONE: 2, COPPER: 3, SILVER: 4, TURQ: 5, GOLD: 6, OPAL: 7,
  BEDROCK: 8, GRASS: 9, GRANITE: 10, LOOSE: 11, MAGMA: 12, LADDER: 13, JOURNAL: 14, HEART: 15,
};

// kind: qué paleta de la zona usa como fondo (tierra o roca)
export const TILE_INFO = {
  [T.DIRT]: { name: 'Tierra', hard: 1, kind: 'dirt' },
  [T.STONE]: { name: 'Roca', hard: 2.5, kind: 'stone' },
  [T.COPPER]: { name: 'Cobre', hard: 2, kind: 'dirt', ore: '#e07a3a', glow: '#ff8a3d', value: 8 },
  [T.SILVER]: { name: 'Plata', hard: 2.5, kind: 'stone', ore: '#dfe8f2', glow: '#cfe6ff', value: 20 },
  [T.TURQ]: { name: 'Turquesa', hard: 3, kind: 'stone', ore: '#3fe0c8', glow: '#40ffe0', value: 40, gem: true },
  [T.GOLD]: { name: 'Oro', hard: 3.5, kind: 'stone', ore: '#ffd23f', glow: '#ffcf33', value: 75 },
  [T.OPAL]: { name: 'Ópalo de fuego', hard: 4, kind: 'stone', ore: '#ff5a2a', glow: '#ff6a3a', value: 160, gem: true },
  [T.BEDROCK]: { name: 'Roca madre', hard: Infinity },
  [T.GRASS]: { name: 'Pasto', hard: 1, kind: 'dirt' },
  [T.GRANITE]: { name: 'Granito', hard: 4, granite: true },
  [T.LOOSE]: { name: 'Roca suelta', hard: 1.5, kind: 'stone' },
  [T.MAGMA]: { name: 'Magma', hard: Infinity, glow: '#ff4a10' },
  [T.JOURNAL]: { name: 'Bitácora', hard: 0.6, kind: 'stone', glow: '#fff1b8' },
  [T.HEART]: { name: 'Veta Madre', hard: 6, kind: 'stone', glow: '#ffe060' },
};

export const isPassable = (t) => t === T.AIR || t === T.LADDER;

// Zonas de la mina (d = profundidad en filas bajo el pasto)
export const ZONES = [
  { name: 'Las Galerías', tunnel: '#17110d', dirt: ['#7a4a2a', '#5e3820'], stone: ['#6b6b73', '#4f4f57'], heat: 1, dark: 12 },
  { name: 'Cuevas de Cristal', tunnel: '#0c1418', dirt: ['#4a5a6a', '#36444f'], stone: ['#3f5866', '#2c3f4a'], heat: 1.15, dark: 9 },
  { name: 'El Infierno', tunnel: '#1c0b07', dirt: ['#6a3326', '#4d241b'], stone: ['#4b3a3a', '#362828'], heat: 1.7, dark: 9 },
  { name: 'Corazón de la Sierra', tunnel: '#140d1c', dirt: ['#4b3a5e', '#372a46'], stone: ['#3a3550', '#2a263b'], heat: 1.35, dark: 8 },
];
export const BARRIERS = [45, 100, 160]; // filas de granito (2 de grosor) que separan zonas
export function zoneOf(d) { return d < 47 ? 0 : d < 102 ? 1 : d < 162 ? 2 : 3; }
export function isBarrierRow(d) { return BARRIERS.some((b) => d === b || d === b + 1); }

// Tienda
export const UPGRADES = [
  { id: 'drill', name: 'Taladro', desc: 'Excava más rápido. Nv 2, 3 y 4 rompen el granito de cada zona.', costs: [250, 700, 1600, 3000] },
  { id: 'battery', name: 'Batería', desc: '+40 de carga para la lámpara (más tiempo bajo tierra).', costs: [120, 350, 800, 1500] },
  { id: 'cart', name: 'Carretilla', desc: '+6 espacios para minerales.', costs: [100, 300, 700, 1400] },
  { id: 'helmet', name: 'Casco', desc: '+25 de salud máxima y −10% de daño.', costs: [150, 450, 1000] },
  { id: 'lamp', name: 'Lámpara', desc: 'Ilumina más lejos.', costs: [80, 250, 600] },
];
export const ITEMS = [
  { id: 'ladders', name: 'Escaleras x10', qty: 10, cost: 40, desc: 'Mantén ↑ en un túnel para colocarlas y subir. ¡Sin ellas no regresas!' },
  { id: 'dynamite', name: 'Dinamita x3', qty: 3, cost: 90, desc: '[Espacio] Explota en 2 s: abre túneles y dispersa grisú, pero destruye minerales.' },
  { id: 'radio', name: 'Radio al malacate', qty: 1, cost: 120, desc: '[E] Llama al malacate y te sube a la superficie con tu carga.' },
];
