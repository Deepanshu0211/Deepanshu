import * as T from "three";
import { type Area, colors as c, box, sphere, cylinder, group, sign, plant, interactive, leafGeometry } from "./objects";
import { fabric, ceramic, metal, emissive, surface, mottle, leafTexture, weave, windify } from "./materials";
import { chair, table, chaiGlass, place, mesh, lathe, rod, cushion, finishes } from "./furniture";
import { Verlet, RopeView } from "./rope";
import { MOON_DIRECTION } from "./sky";

// The balcony is open to the sky on two sides: parapet and railing, a pergola with a creeper and a swing,
// chai for two, washing on the line, the tulsi, and a telescope already pointed at the moon.
export function createBalcony(): Area {
  const root = new T.Group();
  const concrete = new T.MeshStandardMaterial({ color: "#d6cfbf", roughness: .9, bumpMap: mottle(), bumpScale: 1.2 }); concrete.userData.project = 1.2;
  const coping = new T.MeshStandardMaterial({ color: "#bdb6a6", roughness: .7, bumpMap: mottle(), bumpScale: .6 });
  const rail = metal("#2a2622", .5);
  // Parapet with an MS railing: east and south edges.
  for (const [len, pos, alongZ] of [[6.5, [3.92, 0, 0], true], [7.84, [0, 0, 3.17], false]] as [number, number[], boolean][]) {
    const edge = place(root, pos, alongZ ? Math.PI / 2 : 0);
    box(edge, [len, .82, .16], [0, .41, 0], concrete, .01); box(edge, [len + .1, .06, .26], [0, .85, 0], coping, .01);
    box(edge, [len, .04, .04], [0, 1.24, 0], rail, .01); box(edge, [len, .025, .025], [0, .98, 0], rail, .005);
    for (let x = -len / 2 + .06; x < len / 2; x += .14) rod(edge, [x, .88, 0], [x, 1.22, 0], .007, rail, 8);
  }
  // Pergola: two posts, a ledger on the house wall, rafters, a creeper with a few flowers.
  const pergolaWood = surface("#7b4a2b");
  for (const z of [-3, 3]) box(root, [.14, 2.95, .14], [-.2, 1.47, z], pergolaWood, .01);
  box(root, [.12, .2, 6.4], [-.2, 2.95, 0], pergolaWood, .01); box(root, [.12, .2, 6.4], [-3.86, 2.95, 0], pergolaWood, .01);
  for (let z = -3; z <= 3.01; z += .5) box(root, [3.9, .14, .07], [-2.05, 3.1, z], pergolaWood, .008);
  const vine = ["#4f6b38", "#6b8a47"].map(color => windify(new T.MeshStandardMaterial({ color, map: leafTexture(), roughness: .55, side: T.DoubleSide }), { kind: "flutter", amp: .018 }));
  const bloom = new T.MeshStandardMaterial({ color: "#d23f86", roughness: .6 });
  for (let i = 0; i < 140; i++) {
    const t = i / 140, x = -3.8 + ((i * 37) % 100) / 100 * 3.7, z = -3 + ((i * 61) % 100) / 100 * 6, y = 3.18 + ((i * 13) % 7) * .012;
    const leaf = new T.Mesh(leafGeometry(.13, .06, .5), vine[i % 2]); leaf.position.set(x, y, z); leaf.rotation.set(Math.PI / 2 + Math.sin(i) * .6, i * 2.4, 0); leaf.castShadow = true; root.add(leaf);
    if (i % 5 === 0) sphere(root, [.03, .025, .03], [x + .05, y + .02, z], bloom, 8);
    if (t < .2) { const hang = new T.Mesh(leafGeometry(.12, .05, .3), vine[i % 2]); hang.position.set(-.2, 2.9 - t * 9, -3 + (i % 2) * .08); hang.rotation.set(Math.PI, i, 0); root.add(hang); }
  }
  // Jhoola: a teak seat on four jute ropes, simulated (rope.ts) so it sways, twists and settles like the real thing.
  const sim = new Verlet(), jute = new T.MeshStandardMaterial({ color: "#a8834f", roughness: .95, bumpMap: weave(), bumpScale: 1.5 });
  const seatCorners = [[-.55, -.2], [.55, -.2], [-.55, .2], [.55, .2]].map(([x, z]) => sim.add(new T.Vector3(-2 + x, .8, -2.05 + z), .2));
  for (const [a, b] of [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]]) sim.link(seatCorners[a], seatCorners[b]);
  const swingRopes = seatCorners.map((id, i) => sim.rope(sim.add(new T.Vector3(-2 + (i % 2 ? .55 : -.55), 3.03, -2.05 + (i < 2 ? -.07 : .07)), 0), id, 12));
  const seat = interactive(group(root, [0, 0, 0]), "swing", "Give the swing a push"); seat.matrixAutoUpdate = false; seat.userData.noCollide = true;
  box(seat, [1.2, .06, .5], [0, -.3, 0], pergolaWood, .01); box(seat, [1.2, .45, .05], [0, -.05, -.24], pergolaWood, .01); for (const x of [-.58, .58]) box(seat, [.05, .3, .5], [x, -.13, 0], pergolaWood, .01);
  mesh(seat, cushion(1.05, .08, .42, .5, .004, .04), [0, -.23, .02], fabric("#b4532a", .95)); mesh(seat, cushion(.36, .3, .1, .8, 0, .05), [-.3, -.08, -.17], fabric("#e0a526", .95)).rotation.x = -.15;
  // Chai for two, and the postcard that says hello.
  table(root, [-.8, 0, .1], [.62, .55, .62], finishes.walnut(), finishes.walnut(), true);
  const cane = new T.MeshStandardMaterial({ color: "#b48a55", roughness: .8 });
  chair(root, [-1.5, 0, .05], Math.PI / 2, cane, fabric("#2f4f43", .9)); chair(root, [-.8, 0, .85], Math.PI, cane, fabric(c.rust, .9));
  chaiGlass(root, [-.9, .55, .0]); chaiGlass(root, [-.68, .55, .2]);
  lathe(root, [[0, 0], [.1, 0], [.11, .012], [0, .006]], [-.72, .55, -.05], ceramic("#f1ece1", .25), 32);
  for (let i = 0; i < 4; i++) cylinder(root, .025, .025, .008, [-.72 + Math.cos(i * 1.6) * .05, .565 + (i % 2) * .008, -.05 + Math.sin(i * 1.6) * .05], new T.MeshStandardMaterial({ color: "#d1a15b", roughness: .9 }), 16);
  const postcard = interactive(place(root, [-.95, .552, .28], .3), "contact", "A postcard: say hello");
  box(postcard, [.2, .004, .13], [0, 0, 0], fabric("#f2e6c8", 1), 0); sign(postcard, "SAY HELLO", [0, .003, 0], .17, .05, "#f2e6c8", c.edge).rotation.x = -Math.PI / 2;
  // Tulsi in a painted planter.
  const tulsi = place(root, [1, 0, 2.75]); box(tulsi, [.5, .55, .5], [0, .275, 0], new T.MeshStandardMaterial({ color: "#c77d4f", roughness: .8, bumpMap: mottle(), bumpScale: .8 }), .02); box(tulsi, [.42, .02, .42], [0, .56, 0], new T.MeshStandardMaterial({ color: "#2e2219", roughness: 1 }), 0);
  for (const s of [[0, 0], [.08, .07], [-.07, -.05]]) plant(tulsi, [s[0], .3, s[1]], .55);
  // Pots along the coping and on the floor.
  for (const z of [-2.2, -1.2, .2, 1.4]) plant(root, [3.92, .88, z], .45);
  plant(root, [3.4, 0, -2.85], 1.6); plant(root, [-3.5, 0, 2.7], 1.4);
  // Washing line: a rope that sags under the clothes pegged to it and moves with the wind.
  const pole = metal("#d0d0cc", .3); for (const x of [.5, 3.5]) rod(root, [x, 0, -2.5], [x, 1.95, -2.5], .02, pole);
  const line = sim.rope(sim.add(new T.Vector3(.5, 1.9, -2.5), 0), sim.add(new T.Vector3(3.5, 1.9, -2.5), 0), 30, 1.025);
  const washing: { piece: T.Mesh; a: number; b: number; pins: T.Mesh[] }[] = [];
  const pinMats = ["#d23f3f", "#2d3a6b", "#e0a526"].map(color => new T.MeshStandardMaterial({ color, roughness: .5 }));
  [["#b4532a", .45, .7], ["#f2efe8", .55, .45], ["#2d3a6b", .4, .75], ["#e0a526", .7, .35], ["#2f4f43", .35, .55]].forEach(([color, w, h], i) => {
    const geometry = new T.PlaneGeometry(w as number, h as number, 8, 8); geometry.translate(0, -(h as number) / 2, 0); const a = geometry.attributes.position; for (let k = 0; k < a.count; k++) a.setZ(k, Math.sin(a.getX(k) * 9) * .015);
    geometry.computeVertexNormals(); const cloth = windify(fabric(color as string, .95), { kind: "cloth", top: 0, height: h as number, amp: .035 }); cloth.side = T.DoubleSide;
    const piece = new T.Mesh(geometry, cloth); piece.castShadow = true; piece.userData.dynamic = true; root.add(piece);
    const start = 3 + i * 5, span = Math.max(2, Math.round((w as number) / .103)), ia = line[start], ib = line[Math.min(line.length - 2, start + span)];
    sim.inv[ia] = sim.inv[ib] = .35;
    const pins = [0, 1].map(() => { const pin = new T.Mesh(new T.BoxGeometry(.015, .05, .02), pinMats[i % 3]); pin.userData.dynamic = true; root.add(pin); return pin; });
    washing.push({ piece, a: ia, b: ib, pins });
  });
  // Bucket and mug by the tap.
  const bucket = place(root, [3.4, 0, -1.4]); lathe(bucket, [[0, 0], [.17, 0], [.2, .34], [.21, .35], [.19, .35], [.16, .02], [0, .02]], [0, 0, 0], new T.MeshPhysicalMaterial({ color: "#2f6fb5", roughness: .4, clearcoat: .5 }), 32);
  cylinder(bucket, .175, .175, .005, [0, .26, 0], new T.MeshPhysicalMaterial({ color: "#7fa9b5", transparent: true, opacity: .6, roughness: .05 }), 32);
  box(root, [.1, .12, .06], [3.6, .5, -3.14], metal("#d6d8d6", .2), .01);
  // Telescope on its tripod, aimed at the moon.
  const scope = interactive(place(root, [3, 0, 2.2]), "telescope", "Look through the telescope");
  const tripod = finishes.blackMetal(); for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; rod(scope, [Math.sin(a) * .42, 0, Math.cos(a) * .42], [0, 1.05, 0], .014, tripod); }
  cylinder(scope, .05, .05, .1, [0, 1.08, 0], tripod, 20);
  const aim = new T.Vector3(...MOON_DIRECTION).normalize(); const tube = group(scope, [0, 1.16, 0]); tube.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), aim);
  const white = new T.MeshPhysicalMaterial({ color: "#f1efe9", roughness: .35, clearcoat: .7 });
  cylinder(tube, .07, .07, .95, [0, .1, 0], white, 32); cylinder(tube, .085, .085, .14, [0, .58, 0], tripod, 32); cylinder(tube, .03, .03, .1, [0, -.42, 0], tripod, 16);
  const lens = cylinder(tube, .068, .068, .005, [0, .652, 0], new T.MeshPhysicalMaterial({ color: "#1b2a3a", metalness: .2, roughness: .02, clearcoat: 1 }), 32); lens.castShadow = false;
  cylinder(tube, .02, .02, .22, [.09, .2, 0], tripod, 12);
  // String lights hang in real catenaries from the pergola, bulbs riding on the cord.
  const bulbs: { mesh: T.Mesh; id: number }[] = [], cords: number[][] = [];
  for (const z of [-3, 3]) {
    const cord = sim.rope(sim.add(new T.Vector3(-3.8, 2.92, z), 0), sim.add(new T.Vector3(-.25, 2.92, z), 0), 18, 1.035); cords.push(cord);
    for (let i = 2; i < cord.length - 1; i += 2) { const b = new T.Mesh(new T.SphereGeometry(.035, 12, 8), emissive(c.amber, 2.4)); b.userData.dynamic = true; root.add(b); bulbs.push({ mesh: b, id: cord[i] }); sim.inv[cord[i]] = .7; }
  }
  sim.settle();
  const ropes = new RopeView(sim, swingRopes, .012, jute), lines = new RopeView(sim, [line, ...cords], .004, new T.MeshStandardMaterial({ color: "#2a2622", roughness: .7 }));
  root.add(ropes.mesh, lines.mesh);
  const basis = new T.Matrix4(), ax = new T.Vector3(), ay = new T.Vector3(), az = new T.Vector3(), centre = new T.Vector3(), gust = new T.Vector3();
  let wind = 1, clock = 0, carry = 0;
  const breeze = (p: T.Vector3, i: number) => gust.set(Math.sin(clock * 1.3 + p.x * 1.7 + i * .3) * 1.4 + .6, Math.sin(clock * 2.1 + i) * .3, Math.cos(clock * .9 + p.z * 2) * .9).multiplyScalar(wind);
  const wallLamp = place(root, [0, 2.6, -3.15]); box(wallLamp, [.14, .2, .06], [0, 0, 0], tripod, .01); const lampGlass = sphere(wallLamp, [.07, .09, .07], [0, -.02, .08], emissive("#fff1d6", 1.8), 20);
  return {
    root, camera: [9, 7, 11], target: [0, 1.2, 0], anchors: [{ name: "A quiet hello", action: "contact", point: new T.Vector3(-.95, 1.2, .3) }, { name: "Telescope", action: "telescope", point: new T.Vector3(3, 2.2, 2.2) }],
    interact(action) { if (action === "swing") sim.push(seatCorners, new T.Vector3(0, .15, 1.9)); },
    update(time, delta, options) {
      // Fixed 60 Hz physics steps; with motion off the ropes stay at rest.
      wind = options.weather === "rain" ? 2.4 : options.weather === "night" ? .6 : 1.1;
      if (options.motion) { carry = Math.min(carry + delta, .1); while (carry >= 1 / 60) { clock += 1 / 60; sim.step(1 / 60, breeze); carry -= 1 / 60; } }
      ropes.update(); lines.update();
      const [c0, c1, c2, c3] = seatCorners.map(i => sim.pos[i]);
      ax.subVectors(c1, c0).add(c3).sub(c2).normalize(); az.subVectors(c2, c0).add(c3).sub(c1).normalize(); ay.crossVectors(az, ax).normalize(); az.crossVectors(ax, ay);
      centre.copy(c0).add(c1).add(c2).add(c3).multiplyScalar(.25); seat.matrix.copy(basis.makeBasis(ax, ay, az).setPosition(centre)); seat.matrixWorldNeedsUpdate = true;
      washing.forEach(({ piece, a, b, pins }, i) => {
        const pa = sim.pos[a], pb = sim.pos[b]; ax.subVectors(pb, pa).normalize(); ay.set(0, 1, 0); az.crossVectors(ax, ay).normalize(); ay.crossVectors(az, ax);
        piece.position.addVectors(pa, pb).multiplyScalar(.5); piece.quaternion.setFromRotationMatrix(basis.makeBasis(ax, ay, az)); piece.rotateX(options.motion ? (Math.sin(clock * 1.7 * wind + i * .9) * .1 + .06) * wind : 0);
        pins[0].position.copy(pa); pins[1].position.copy(pb);
      });
      for (const b of bulbs) b.mesh.position.copy(sim.pos[b.id]).y -= .045;
      const night = options.weather === "night" || options.weather === "sunset";
      bulbs.forEach(({ mesh: b }, i) => (b.material as T.MeshBasicMaterial).color.set(c.amber).multiplyScalar(night ? 2.6 + (options.motion ? Math.sin(time * 2 + i) * .3 : 0) : .7));
      (lampGlass.material as T.MeshBasicMaterial).color.set("#fff1d6").multiplyScalar(options.weather === "day" ? .8 : 2);
    },
  };
}
