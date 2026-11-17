// Object Pool de partículas: se crean una sola vez y se reciclan.
// Evita "new" en cada explosión de polvo => sin picos del recolector de basura.
export class ParticlePool {
  constructor(n) {
    this.items = Array.from({ length: n }, () => ({
      alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, color: '#fff', size: 2, glow: false, grav: 1,
    }));
    this.cursor = 0;
    this.alive = 0;
  }

  spawn(x, y, vx, vy, life, color, size = 2, glow = false, grav = 1) {
    const n = this.items.length;
    let p = null;
    for (let i = 0; i < n; i++) {
      const c = this.items[(this.cursor + i) % n];
      if (!c.alive) { p = c; this.cursor = (this.cursor + i + 1) % n; break; }
    }
    if (!p) { p = this.items[this.cursor]; this.cursor = (this.cursor + 1) % n; } // reciclar la más vieja
    p.alive = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = p.max = life; p.color = color; p.size = size; p.glow = glow; p.grav = grav;
  }

  update(dt) {
    let a = 0;
    for (const p of this.items) {
      if (!p.alive) continue;
      p.vy += 320 * p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) p.alive = false; else a++;
    }
    this.alive = a;
  }

  draw(ctx, camX, camY) {
    for (const p of this.items) {
      if (!p.alive) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  drawGlow(ctx, camX, camY, s) {
    for (const p of this.items) {
      if (!p.alive || !p.glow) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.8;
      ctx.fillStyle = p.color;
      ctx.fillRect((p.x - camX) * s - 1, (p.y - camY) * s - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}
