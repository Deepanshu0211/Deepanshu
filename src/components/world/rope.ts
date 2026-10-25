import * as T from "three";

/**
 * Position-based Verlet physics for ropes and things hung from them. Particles carry an inverse
 * mass (0 = pinned); distance constraints are relaxed a few times per step, so ropes are
 * inextensible but bend freely, heavy attachments pull them taut, and wind ripples them.
 */
export class Verlet {
  pos: T.Vector3[] = []; prev: T.Vector3[] = []; inv: number[] = []; links: [number, number, number][] = [];
  gravity = new T.Vector3(0, -9.81, 0); damping = .992; iterations = 14;
  private delta = new T.Vector3();
  add(p: T.Vector3, invMass = 1) { this.pos.push(p.clone()); this.prev.push(p.clone()); this.inv.push(invMass); return this.pos.length - 1; }
  link(a: number, b: number, rest = this.pos[a].distanceTo(this.pos[b])) { this.links.push([a, b, rest]); }
  /** A rope of `segments` links from particle `a` to `b`, `slack` times longer than the gap. Returns its particle indices. */
  rope(a: number, b: number, segments: number, slack = 1) {
    const ids = [a], rest = this.pos[a].distanceTo(this.pos[b]) * slack / segments;
    for (let i = 1; i < segments; i++) ids.push(this.add(this.pos[a].clone().lerp(this.pos[b], i / segments)));
    ids.push(b); for (let i = 0; i < segments; i++) this.link(ids[i], ids[i + 1], rest); return ids;
  }
  /** Nudge particles (impulse as a velocity change in m/s). */
  push(ids: number[], velocity: T.Vector3, dt = 1 / 60) { for (const i of ids) if (this.inv[i]) this.prev[i].addScaledVector(velocity, -dt); }
  step(dt: number, wind?: (p: T.Vector3, i: number) => T.Vector3 | null) {
    for (let i = 0; i < this.pos.length; i++) {
      if (!this.inv[i]) continue; const p = this.pos[i], q = this.prev[i];
      this.delta.subVectors(p, q).multiplyScalar(this.damping).addScaledVector(this.gravity, dt * dt);
      const w = wind?.(p, i); if (w) this.delta.addScaledVector(w, dt * dt * this.inv[i]);
      q.copy(p); p.add(this.delta);
    }
    for (let k = 0; k < this.iterations; k++) for (const [a, b, rest] of this.links) {
      const wa = this.inv[a], wb = this.inv[b], sum = wa + wb; if (!sum) continue;
      this.delta.subVectors(this.pos[b], this.pos[a]); const d = this.delta.length() || 1e-6, diff = (d - rest) / (d * sum);
      this.pos[a].addScaledVector(this.delta, diff * wa); this.pos[b].addScaledVector(this.delta, -diff * wb);
    }
  }
  /** Run silently until the system rests, so ropes start sagged rather than straight. */
  settle(steps = 240) { for (let i = 0; i < steps; i++) this.step(1 / 60); for (let i = 0; i < this.pos.length; i++) this.prev[i].copy(this.pos[i]); }
}

/** Draws chains of particles as rope: one instanced cylinder per segment, with knots at the joints. */
export class RopeView {
  mesh: T.InstancedMesh; private chains: number[][]; private m = new T.Matrix4(); private q = new T.Quaternion(); private s = new T.Vector3(); private mid = new T.Vector3(); private dir = new T.Vector3(); private up = new T.Vector3(0, 1, 0);
  constructor(private sim: Verlet, chains: number[][], radius: number, material: T.Material) {
    this.chains = chains; const count = chains.reduce((n, c) => n + c.length - 1, 0);
    this.mesh = new T.InstancedMesh(new T.CylinderGeometry(radius, radius, 1, 7, 1, true), material, count);
    this.mesh.castShadow = true; this.mesh.frustumCulled = false; this.mesh.userData.dynamic = true; this.update();
  }
  update() {
    let k = 0; const p = this.sim.pos;
    for (const chain of this.chains) for (let i = 0; i < chain.length - 1; i++) {
      const a = p[chain[i]], b = p[chain[i + 1]]; this.dir.subVectors(b, a); const len = this.dir.length() || 1e-4;
      this.mid.addVectors(a, b).multiplyScalar(.5); this.q.setFromUnitVectors(this.up, this.dir.divideScalar(len)); this.s.set(1, len * 1.04, 1);
      this.mesh.setMatrixAt(k++, this.m.compose(this.mid, this.q, this.s));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
