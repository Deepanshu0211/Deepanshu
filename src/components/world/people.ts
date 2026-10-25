import * as T from "three";

// Articulated people for the neighbourhood: hips, knees, shoulders and elbows on pivots, so a single
// `pose` drives walking, running, sitting, bowling and batting. Built at real scale (adult ≈ 1.65 m).

export interface Look { height?: number; skin: string; top: string; bottom: string; hair: string; saree?: string; longHair?: boolean; }
export interface Person { root: T.Group; body: T.Group; hips: T.Group[]; knees: T.Group[]; shoulders: T.Group[]; elbows: T.Group[]; hands: T.Group[]; head: T.Mesh; }

const cache = new Map<string, T.Material>();
function mat(color: string, roughness = .8, sheen = false) {
  const key = color + roughness + sheen; let m = cache.get(key);
  if (!m) { m = sheen ? new T.MeshPhysicalMaterial({ color, roughness, sheen: .8, sheenColor: new T.Color(color).multiplyScalar(1.4) }) : new T.MeshStandardMaterial({ color, roughness }); cache.set(key, m); }
  return m;
}
function limb(parent: T.Object3D, radius: number, length: number, material: T.Material, end?: { radius: number; material: T.Material; forward?: number }) {
  const m = new T.Mesh(new T.CapsuleGeometry(radius, length, 4, 10), material); m.position.y = -length / 2; parent.add(m);
  if (end) { const e = new T.Mesh(new T.SphereGeometry(end.radius, 10, 8), end.material); e.position.set(0, -length - radius * .4, end.forward ?? 0); if (end.forward) e.scale.set(1, .55, 2.1); parent.add(e); }
  return m;
}
export function makePerson(look: Look): Person {
  const root = new T.Group(), body = new T.Group(); root.add(body); body.scale.setScalar((look.height ?? 1.65) / 1.65);
  const skin = mat(look.skin, .6, true), top = mat(look.top, .85, true), bottom = mat(look.bottom, .85, true), hair = mat(look.hair, .5), shoe = mat("#2a2523", .6);
  const pelvis = new T.Group(); pelvis.position.y = .92; body.add(pelvis);
  const torso = new T.Mesh(new T.CapsuleGeometry(.15, .3, 4, 12), top); torso.position.y = .28; torso.scale.set(1.15, 1, .72); pelvis.add(torso);
  const neck = new T.Mesh(new T.CylinderGeometry(.045, .05, .1, 10), skin); neck.position.y = .55; pelvis.add(neck);
  const head = new T.Mesh(new T.SphereGeometry(.105, 18, 14), skin); head.position.y = .67; head.scale.set(.92, 1.08, 1); pelvis.add(head);
  const cap = new T.Mesh(new T.SphereGeometry(.112, 18, 12, 0, Math.PI * 2, 0, Math.PI * .55), hair); cap.position.set(0, .685, -.012); cap.rotation.x = -.25; pelvis.add(cap);
  if (look.longHair) { const plait = new T.Mesh(new T.CapsuleGeometry(.035, .32, 4, 8), hair); plait.position.set(0, .45, -.11); plait.rotation.x = .12; pelvis.add(plait); }
  const hips: T.Group[] = [], knees: T.Group[] = [], shoulders: T.Group[] = [], elbows: T.Group[] = [], hands: T.Group[] = [];
  for (const side of [-1, 1]) {
    const hip = new T.Group(); hip.position.set(side * .085, 0, 0); pelvis.add(hip); limb(hip, .068, .34, look.saree ? skin : bottom);
    const knee = new T.Group(); knee.position.y = -.44; hip.add(knee); limb(knee, .052, .34, look.saree ? skin : bottom, { radius: .052, material: shoe, forward: .06 });
    const shoulder = new T.Group(); shoulder.position.set(side * .2, .45, 0); pelvis.add(shoulder); limb(shoulder, .046, .2, look.saree ? top : top);
    const elbow = new T.Group(); elbow.position.y = -.28; shoulder.add(elbow); limb(elbow, .04, .18, skin, { radius: .045, material: skin });
    const hand = new T.Group(); hand.position.y = -.27; elbow.add(hand);
    hips.push(hip); knees.push(knee); shoulders.push(shoulder); elbows.push(elbow); hands.push(hand);
  }
  if (look.saree) {
    const drape = mat(look.saree, .9, true);
    const skirt = new T.Mesh(new T.CylinderGeometry(.17, .3, .9, 20, 1, true), drape); skirt.position.y = -.43; pelvis.add(skirt);
    const pallu = new T.Mesh(new T.BoxGeometry(.14, .62, .2), drape); pallu.position.set(.02, .3, 0); pallu.rotation.z = .5; pelvis.add(pallu);
    const tail = new T.Mesh(new T.BoxGeometry(.2, .55, .02), drape); tail.position.set(-.16, .2, -.1); tail.rotation.x = .15; pelvis.add(tail);
    const border = new T.Mesh(new T.CylinderGeometry(.302, .302, .05, 20, 1, true), mat("#d6b048", .5)); border.position.y = -.86; pelvis.add(border);
  }
  root.traverse(o => { if (o instanceof T.Mesh) { o.castShadow = false; o.receiveShadow = false; } });
  return { root, body, hips, knees, shoulders, elbows, hands, head };
}
/** Gait: amount 0 stands, 1 walks, 1.7 runs. */
export function walk(p: Person, phase: number, amount: number) {
  const s = Math.sin(phase), run = Math.max(0, amount - 1);
  p.hips[0].rotation.x = -s * .42 * amount; p.hips[1].rotation.x = s * .42 * amount;
  p.knees[0].rotation.x = Math.max(0, Math.cos(phase)) * (.6 + run * .8) * amount; p.knees[1].rotation.x = Math.max(0, -Math.cos(phase)) * (.6 + run * .8) * amount;
  p.shoulders[0].rotation.x = s * .38 * amount; p.shoulders[1].rotation.x = -s * .38 * amount;
  p.elbows[0].rotation.x = p.elbows[1].rotation.x = -.25 - run * .9;
  p.shoulders[0].rotation.z = p.shoulders[1].rotation.z = 0;
  p.body.position.y = Math.abs(Math.cos(phase)) * .025 * amount; p.body.rotation.x = run * .12;
}
export function sit(p: Person) {
  for (const h of p.hips) h.rotation.x = -Math.PI / 2; for (const k of p.knees) k.rotation.x = Math.PI / 2;
  p.body.position.y = -.46; p.body.rotation.x = 0;
}
/** A dog: body, head, ears, tail and four legs that trot. */
export function makeDog(color = "#c8a070") {
  const root = new T.Group(), fur = mat(color, .9, true), dark = mat("#3a2a20", .7);
  const body = new T.Mesh(new T.CapsuleGeometry(.12, .38, 4, 10), fur); body.rotation.z = Math.PI / 2; body.position.y = .42; root.add(body);
  const head = new T.Mesh(new T.SphereGeometry(.1, 14, 10), fur); head.position.set(.3, .55, 0); root.add(head);
  const snout = new T.Mesh(new T.CapsuleGeometry(.045, .08, 4, 8), fur); snout.rotation.z = Math.PI / 2; snout.position.set(.4, .52, 0); root.add(snout);
  const nose = new T.Mesh(new T.SphereGeometry(.022, 8, 6), dark); nose.position.set(.47, .53, 0); root.add(nose);
  for (const z of [-.06, .06]) { const ear = new T.Mesh(new T.BoxGeometry(.04, .09, .05), dark); ear.position.set(.27, .6, z); ear.rotation.x = z > 0 ? .4 : -.4; root.add(ear); }
  const tail = new T.Group(); tail.position.set(-.3, .48, 0); root.add(tail); const t = new T.Mesh(new T.CapsuleGeometry(.025, .18, 4, 6), fur); t.position.y = .1; tail.add(t); tail.rotation.z = -.6;
  const legs: T.Group[] = [];
  for (const [x, z] of [[.18, .07], [.18, -.07], [-.2, .07], [-.2, -.07]]) { const leg = new T.Group(); leg.position.set(x, .38, z); root.add(leg); const m = new T.Mesh(new T.CapsuleGeometry(.03, .26, 4, 6), fur); m.position.y = -.17; leg.add(m); legs.push(leg); }
  return { root, legs, tail };
}
