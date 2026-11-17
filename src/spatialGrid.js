// SpatialGrid (rejilla espacial / spatial hash)
// En lugar de comparar cada entidad contra todas (O(n²)), se agrupan por celdas
// y solo se consultan las celdas cercanas al punto de interés.
// Se usa para: colisiones jugador-grisú y para dibujar solo lo visible (culling).
export class SpatialGrid {
  constructor(cellSize) {
    this.cs = cellSize;
    this.cells = new Map();
  }

  key(cx, cy) { return (cy + 2048) * 4096 + (cx + 2048); }

  // Reutiliza los arreglos existentes: evita crear basura cada frame (menos pausas de GC)
  clear() {
    for (const arr of this.cells.values()) arr.length = 0;
  }

  insert(obj) {
    const k = this.key(Math.floor(obj.x / this.cs), Math.floor(obj.y / this.cs));
    let arr = this.cells.get(k);
    if (!arr) { arr = []; this.cells.set(k, arr); }
    arr.push(obj);
  }

  queryRect(x0, y0, x1, y1, out) {
    out.length = 0;
    const cx0 = Math.floor(x0 / this.cs), cx1 = Math.floor(x1 / this.cs);
    const cy0 = Math.floor(y0 / this.cs), cy1 = Math.floor(y1 / this.cs);
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const arr = this.cells.get(this.key(cx, cy));
        if (arr) for (let i = 0; i < arr.length; i++) out.push(arr[i]);
      }
    }
    return out;
  }

  query(x, y, r, out) { return this.queryRect(x - r, y - r, x + r, y + r, out); }

  // Para el modo debug: celdas ocupadas
  *occupied() {
    for (const [k, arr] of this.cells) {
      if (arr.length) yield { cx: (k % 4096) - 2048, cy: Math.floor(k / 4096) - 2048, n: arr.length };
    }
  }
}
