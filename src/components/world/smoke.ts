import * as T from "three";

// Soft smoke for the smoking gesture: a small pool of camera-facing puffs that drift up, spread and fade.
// Wisps rise from a cigarette's tip; a breath out sends a handful forward from the mouth.
// `layer` should be one ambient occlusion skips: its normal pass would draw these soft sprites as black squares.
export function createSmoke(scene: T.Scene, layer: number, count = 48) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64;
  const g = canvas.getContext("2d")!, r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,.9)"); r.addColorStop(.45, "rgba(255,255,255,.35)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const map = new T.CanvasTexture(canvas);
  const pool = Array.from({ length: count }, () => {
    const sprite = new T.Sprite(new T.SpriteMaterial({ map, color: "#dcd8d2", transparent: true, depthWrite: false, opacity: 0 }));
    sprite.visible = false; sprite.frustumCulled = false; sprite.layers.set(layer); scene.add(sprite);
    return { sprite, velocity: new T.Vector3(), age: 0, life: 1, size: .03 };
  });
  let next = 0;
  return {
    /** One puff at `at`, carried along `push` (a breath) if given. */
    emit(at: T.Vector3, size: number, life: number, push?: T.Vector3) {
      const p = pool[next++ % pool.length]; p.sprite.position.copy(at); p.age = 0; p.life = life; p.size = size; p.sprite.visible = true;
      p.velocity.set((Math.random() - .5) * .05, .1 + Math.random() * .06, (Math.random() - .5) * .05); if (push) p.velocity.addScaledVector(push, .3 + Math.random() * .2);
    },
    update(dt: number) {
      for (const p of pool) {
        if (!p.sprite.visible) continue; p.age += dt; const k = p.age / p.life; if (k >= 1) { p.sprite.visible = false; continue; }
        p.sprite.position.addScaledVector(p.velocity, dt); p.velocity.multiplyScalar(1 - dt * .7); p.velocity.y += dt * .03; // slows, then lifts
        const s = p.size * (1 + k * 3.5); p.sprite.scale.set(s, s, 1); (p.sprite.material as T.SpriteMaterial).opacity = .32 * (1 - k) * Math.min(1, k * 10);
      }
    },
    get active() { return pool.some(p => p.sprite.visible); },
    /** Draw one (invisible) puff so its shader compiles behind the loading screen. */
    warm(on: boolean) { pool[0].sprite.visible = on; },
    dispose() { for (const p of pool) { scene.remove(p.sprite); p.sprite.material.dispose(); } map.dispose(); },
  };
}
