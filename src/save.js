// Guardado de la campaña en localStorage (el mapa se guarda comprimido en Base64)
const KEY = 'veta-sonora-save-v2';

export function saveGame(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* sin almacenamiento */ }
}
export function loadGame() {
  try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* nada */ }
}
export function u8ToB64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
export function b64ToU8(b64) {
  const s = atob(b64);
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}
