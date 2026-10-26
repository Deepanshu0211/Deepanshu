import * as T from "three";
import type { WorldOptions } from "./objects";

// Curtains as real cloth. A panel's own vertices are the particles (Verlet integration), joined to their neighbours
// along, down, across and two apart (so it folds rather than crumples) and pinned along the rod. Each panel hangs in
// its pleats, stirs in the breeze (more in rain, more with the fan on), and parts around anyone who walks into it,
// then falls back into its folds. A fixed 60 Hz step, run only while its room is in view.
const STEP = 1 / 60, BODY = .3;
export class Cloth {
  private pos: Float32Array; private prev: Float32Array; private rest: Float32Array; private free: Uint8Array;
  private links: Int32Array; private lengths: Float32Array; private carry = 0; private clock = 0; private frame = 0;
  private top = -Infinity; private height = 1; private inverse = new T.Matrix4(); private here: T.Vector3[] = [];
  constructor(private mesh: T.Mesh, cols: number, rows: number) {
    const attribute = mesh.geometry.attributes.position as T.BufferAttribute, w = cols + 1, n = attribute.count;
    this.pos = attribute.array as Float32Array; this.prev = this.pos.slice(); this.rest = this.pos.slice(); this.free = new Uint8Array(n);
    let bottom = Infinity; for (let i = 0; i < n; i++) { const y = this.pos[i * 3 + 1]; this.top = Math.max(this.top, y); bottom = Math.min(bottom, y); }
    this.height = Math.max(.1, this.top - bottom);
    for (let i = 0; i < n; i++) this.free[i] = this.pos[i * 3 + 1] < this.top - 1e-4 ? 1 : 0; // the top row hangs on the rod
    const pairs: number[] = [];
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
      const i = r * w + c;
      if (c < cols) pairs.push(i, i + 1); if (r < rows) pairs.push(i, i + w);
      if (c < cols - 1) pairs.push(i, i + 2); if (r < rows - 1) pairs.push(i, i + 2 * w);
      if (c < cols && r < rows) pairs.push(i, i + w + 1, i + 1, i + w);
    }
    this.links = Int32Array.from(pairs); this.lengths = new Float32Array(pairs.length / 2);
    for (let k = 0; k < this.lengths.length; k++) { const a = pairs[k * 2] * 3, b = pairs[k * 2 + 1] * 3; this.lengths[k] = Math.hypot(this.rest[b] - this.rest[a], this.rest[b + 1] - this.rest[a + 1], this.rest[b + 2] - this.rest[a + 2]); }
    mesh.userData.dynamic = true; mesh.castShadow = false; // a cloth that never rests would keep the cached shadow map redrawing
  }
  step(delta: number, options: WorldOptions) {
    if (!options.motion) return;
    // Who could walk into it, in the panel's own space (one vertical cylinder per person).
    this.mesh.updateWorldMatrix(true, false); this.inverse.copy(this.mesh.matrixWorld).invert();
    const bodies = options.bodies ?? []; while (this.here.length < bodies.length) this.here.push(new T.Vector3());
    for (let b = 0; b < bodies.length; b++) this.here[b].copy(bodies[b]).applyMatrix4(this.inverse);
    const wind = ({ rain: 2.2, day: 1, sunset: .9, night: .6 }[options.weather]) * .5 + (options.fan ?? 1) * .35;
    const p = this.pos, q = this.prev, r = this.rest, free = this.free, n = free.length;
    this.carry = Math.min(this.carry + delta, .05);
    while (this.carry >= STEP) {
      this.carry -= STEP; const t = this.clock += STEP;
      for (let i = 0; i < n; i++) {
        if (!free[i]) continue; const o = i * 3, x = p[o], y = p[o + 1], z = p[o + 2], hang = (this.top - r[o + 1]) / this.height;
        const gust = wind * hang * (.6 * Math.sin(t * .9 + r[o] * 3 + r[o + 1] * .8) + .4 * Math.sin(t * 2.3 + r[o] * 7)) * .9;
        // Verlet: keep most of last step's motion, add the breeze and a little gravity, and lean back toward the pleats.
        p[o] += (x - q[o]) * .97 + (r[o] - x) * .015;
        p[o + 1] += (y - q[o + 1]) * .97 + (r[o + 1] - y) * .015 - 4 * STEP * STEP;
        p[o + 2] += (z - q[o + 2]) * .97 + (r[o + 2] - z) * .015 + gust * STEP * STEP;
        q[o] = x; q[o + 1] = y; q[o + 2] = z;
      }
      for (let pass = 0; pass < 3; pass++) {
        for (let k = 0; k < this.lengths.length; k++) {
          const a = this.links[k * 2], b = this.links[k * 2 + 1], ao = a * 3, bo = b * 3;
          const dx = p[bo] - p[ao], dy = p[bo + 1] - p[ao + 1], dz = p[bo + 2] - p[ao + 2], d = Math.hypot(dx, dy, dz) || 1e-6;
          const wa = free[a], wb = free[b], sum = wa + wb; if (!sum) continue; const f = (d - this.lengths[k]) / d / sum;
          if (wa) { p[ao] += dx * f; p[ao + 1] += dy * f; p[ao + 2] += dz * f; }
          if (wb) { p[bo] -= dx * f; p[bo + 1] -= dy * f; p[bo + 2] -= dz * f; }
        }
        // People are cylinders the cloth slides around.
        for (let b = 0; b < bodies.length; b++) {
          const h = this.here[b];
          for (let i = 0; i < n; i++) {
            if (!free[i]) continue; const o = i * 3, dx = p[o] - h.x, dz = p[o + 2] - h.z, d = Math.hypot(dx, dz);
            if (d >= BODY || p[o + 1] < h.y - .1 || p[o + 1] > h.y + 1.9) continue;
            const k = d > 1e-4 ? BODY / d : 0; p[o] = h.x + (k ? dx * k : 0); p[o + 2] = h.z + (k ? dz * k : BODY);
          }
        }
      }
    }
    const geometry = this.mesh.geometry; geometry.attributes.position.needsUpdate = true;
    if (++this.frame % 2 === 0) geometry.computeVertexNormals();
  }
}
