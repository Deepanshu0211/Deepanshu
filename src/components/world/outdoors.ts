import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { box, cylinder, sphere, group, plant, batchScenery, canvasTexture, disposeObject, type Weather, type WorldOptions } from "./objects";
import { facade, asphalt, grass, mottle, projected, metal, emissive } from "./materials";
import { rod, lathe } from "./furniture";
import { makePerson, makeDog, walk, sit, type Person } from "./people";

// The neighbourhood around the flat, four floors up. Static scenery is batched; people, traffic,
// birds and rain are the only things that move. Ground level is GROUND.
export const GROUND = -11.5;
const G = GROUND;

function glowTexture() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128; const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,210,150,.75)"); g.addColorStop(1, "rgba(255,210,150,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new T.CanvasTexture(canvas); t.colorSpace = T.SRGBColorSpace; return t;
}
function shopSign(text: string, background: string, ink: string) {
  return canvasTexture(ctx => { ctx.fillStyle = background; ctx.fillRect(0, 0, 1024, 192); ctx.fillStyle = ink; ctx.font = "700 92px Helvetica, Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 512, 100, 960); ctx.fillRect(40, 168, 944, 6); }, 1024, 192);
}

export function createOutdoors() {
  const root = new T.Group(), dynamic = new T.Group(); root.add(dynamic); dynamic.userData.dynamic = true;
  const paints = ["#e3dccb", "#e8cfc0", "#cfdad6", "#e6d7a9", "#d9c7d6"].map(color => {
    const m = projected(new T.MeshStandardMaterial({ color, map: facade(), roughness: .9, emissive: "#ffffff", emissiveMap: facade(true), emissiveIntensity: 0 }), 12); return m;
  });
  const roofMat = new T.MeshStandardMaterial({ color: "#8f8a80", roughness: 1, bumpMap: mottle(), bumpScale: 1 });
  const tank = new T.MeshStandardMaterial({ color: "#1c1d1d", roughness: .6 });
  function block(x: number, z: number, w: number, d: number, floors: number, paint = 0, tanks = true) {
    const h = floors * 3, top = G + h;
    box(root, [w, h, d], [x, G + h / 2, z], paints[paint % paints.length], 0);
    box(root, [w + .3, .5, d + .3], [x, top + .2, z], roofMat, 0);
    if (tanks) for (let i = 0; i < (w > 14 ? 3 : 2); i++) { const tx = x - w / 2 + 2 + i * 3.4, tz = z + (i % 2 ? 1 : -1) * Math.min(1.5, d / 4); cylinder(root, .7, .75, 1.5, [tx, top + 1.2, tz], tank, 20); cylinder(root, .3, .3, .12, [tx, top + 2, tz], tank, 12); }
    if (floors > 5) rod(root, [x + w / 2 - 1, top + .4, z], [x + w / 2 - 1, top + 3.4, z], .04, metal("#6b6f6c", .5), 6);
  }
  // Our own building below the flat, with a slab line at our floor.
  box(root, [24.6, -G - .15, 6.8], [8, G / 2 - .08, 0], paints[0], 0); box(root, [16.45, -G - .15, 6.65], [12.08, G / 2 - .08, 6.58], paints[0], 0);
  box(root, [24.8, .3, 7], [8, -.3, 0], roofMat, 0); box(root, [16.6, .3, 6.8], [12.08, -.3, 6.58], roofMat, 0);
  box(root, [24.8, .4, 7], [8, 4.7, 0], roofMat, 0); box(root, [8.3, .4, 6.8], [8, 4.7, 6.55], roofMat, 0);
  for (const [tx, tz] of [[0, -1], [3, 1]]) cylinder(root, .8, .85, 1.6, [tx, 5.7, tz], tank, 24);
  // Ground: earth, the compound's paving, the park lawn, roads and footpaths.
  box(root, [420, .2, 420], [10, G - .1, 0], new T.MeshStandardMaterial({ color: "#7a7062", roughness: 1, bumpMap: mottle(), bumpScale: 1 }), 0);
  const paving = projected(new T.MeshStandardMaterial({ color: "#a9a397", roughness: .9, bumpMap: mottle(), bumpScale: 1.4 }), 3);
  box(root, [32, .06, 22], [6, G + .03, 1], paving, 0);
  const lawn = projected(new T.MeshStandardMaterial({ map: grass(), roughness: 1 }), 4); box(root, [28, .08, 24], [38, G + .04, 0], lawn, 0);
  const path = new T.Mesh(new T.RingGeometry(9.6, 11, 96, 1), new T.MeshStandardMaterial({ color: "#c2ae8a", roughness: 1, bumpMap: mottle(), bumpScale: 1.5 })); path.rotation.x = -Math.PI / 2; path.scale.set(1, .78, 1); path.position.set(38, G + .09, 0); root.add(path);
  const road = projected(new T.MeshStandardMaterial({ map: asphalt(), roughness: .92 }), 6); box(root, [300, .06, 7], [10, G + .03, 19.5], road, 0);
  const kerb = new T.MeshStandardMaterial({ color: "#bdb7aa", roughness: .9 }), footpath = projected(new T.MeshStandardMaterial({ color: "#9e968a", roughness: .9, bumpMap: mottle(), bumpScale: 1.2 }), 2);
  for (const z of [14.1, 24.8]) { box(root, [300, .16, 3.8], [10, G + .08, z], footpath, 0); box(root, [300, .18, .2], [10, G + .09, z < 19 ? 16.05 : 22.95], kerb, 0); }
  const paint = new T.MeshStandardMaterial({ color: "#efece2", roughness: .7 });
  for (let x = -130; x < 150; x += 6) box(root, [3, .015, .14], [x, G + .065, 19.5], paint, 0);
  for (let i = 0; i < 8; i++) box(root, [.5, .015, 6.4], [6.5 + i * .9, G + .066, 19.5], paint, 0);
  // Compound wall with a gate, and the park's railing.
  const wallPaint = new T.MeshStandardMaterial({ color: "#e2d6bd", roughness: .95, bumpMap: mottle(), bumpScale: 1.2 });
  for (const [a, b] of [[-10, 5.5], [10.5, 22]]) box(root, [b - a, 1.7, .22], [(a + b) / 2, G + .85, 12], wallPaint, 0);
  box(root, [.22, 1.7, 22], [-10, G + .85, 1], wallPaint, 0); box(root, [.22, 1.7, 22], [22, G + .85, 1], wallPaint, 0); box(root, [32, 1.7, .22], [6, G + .85, -10], wallPaint, 0);
  for (const x of [5.5, 10.5]) box(root, [.5, 2.1, .5], [x, G + 1.05, 12], wallPaint, .02);
  const gate = metal("#2a2622", .5); for (let x = 5.9; x < 10.2; x += .18) rod(root, [x, G + .1, 12.05], [x, G + 1.6, 12.05], .015, gate, 6); box(root, [4.5, .06, .06], [8, G + 1.6, 12.05], gate, 0); box(root, [4.5, .06, .06], [8, G + .3, 12.05], gate, 0);
  for (let x = 24.2; x < 52; x += .4) rod(root, [x, G, 12], [x, G + .9, 12], .015, gate, 6); box(root, [28, .05, .05], [38, G + .9, 12], gate, 0);
  // Neighbours: apartment blocks on every side, shops across the road.
  [[-14, -20, 18, 10, 6, 1], [6, -22, 20, 12, 8, 2], [28, -21, 16, 10, 5, 3], [46, -24, 14, 12, 9, 4], [-34, -6, 12, 18, 7, 2], [-30, 18, 14, 12, 5, 0], [64, -4, 12, 20, 8, 1], [66, 22, 14, 14, 6, 3], [-60, -30, 20, 14, 10, 4], [22, -48, 30, 14, 12, 0], [90, 10, 18, 26, 11, 2], [-70, 20, 16, 18, 9, 1]]
    .forEach(([x, z, w, d, f, p]) => block(x, z, w, d, f, p));
  // The wider city out to the haze, so there is never an empty edge to the world.
  let s = 91; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 150; i++) {
    const a = i / 150 * Math.PI * 2 + rnd() * .03, dist = 78 + rnd() * 95; const x = 10 + Math.cos(a) * dist, z = Math.sin(a) * dist;
    if (Math.abs(z - 19.5) < 9) continue;
    block(x, z, 10 + rnd() * 14, 10 + rnd() * 14, 4 + Math.floor(rnd() * 11), i, rnd() > .55);
  }
  const shops = [["SHARMA GENERAL STORE", "#c0392b", "#fff5e0"], ["CHAI · SAMOSA", "#2f6b4f", "#fff5e0"], ["MEDICAL", "#1f6fb2", "#ffffff"], ["NEW STYLE TAILORS", "#e3b448", "#2b2016"], ["MOBILE REPAIRING", "#6b3fa0", "#ffffff"], ["SWEETS & BAKERY", "#d9622b", "#fff5e0"]];
  shops.forEach(([name, bg, ink], i) => {
    const x = -22 + i * 11, z = 33; block(x, z, 10.4, 12, 3 + (i * 7) % 4, i, i % 2 === 0);
    const sign = new T.Mesh(new T.PlaneGeometry(9, 1.1), new T.MeshStandardMaterial({ map: shopSign(name, bg, ink), roughness: .6, emissive: "#ffffff", emissiveMap: shopSign(name, bg, ink), emissiveIntensity: .25 })); sign.position.set(x, G + 3.3, z - 6.06); sign.rotation.y = Math.PI; root.add(sign);
    const shutter = projected(new T.MeshStandardMaterial({ color: "#8c9190", metalness: .5, roughness: .5, bumpMap: mottle() }), 1); box(root, [8.6, 2.6, .05], [x, G + 1.3, z - 5.98], i % 3 === 1 ? new T.MeshStandardMaterial({ color: "#3a2a1c", roughness: .8 }) : shutter, 0);
    box(root, [10.4, .12, 1.4], [x, G + 2.75, z - 6.7], new T.MeshStandardMaterial({ color: ["#b5352a", "#2f6b4f", "#1f6fb2"][i % 3], roughness: .8 }), 0);
  });
  // Chai stall by the road.
  const stall = group(root, [-11, G, 25.4]); box(stall, [2.2, 1, .9], [0, .5, 0], new T.MeshStandardMaterial({ color: "#2f6b4f", roughness: .7 }), .02); box(stall, [2.6, .06, 1.4], [0, 2.3, .1], new T.MeshStandardMaterial({ color: "#d9622b", roughness: .8 }), 0);
  for (const x of [-1.2, 1.2]) rod(stall, [x, 1, -.4], [x, 2.3, -.4], .03, gate, 8);
  lathe(stall, [[0, 0], [.14, 0], [.15, .18], [.08, .26], [0, .27]], [-.5, 1, 0], metal("#c9ccc8", .25), 24); cylinder(stall, .16, .16, .05, [-.5, 1.03, 0], new T.MeshStandardMaterial({ color: "#1b1b1b" }), 16);
  // Trees: lumpy canopies on bark trunks, along the footpaths and around the park.
  const bark = new T.MeshStandardMaterial({ color: "#5a4636", roughness: 1, bumpMap: mottle(), bumpScale: 2 });
  const leaves = ["#4c6b35", "#5d7d3f", "#3f5c2c"].map(color => new T.MeshStandardMaterial({ color, roughness: .9, bumpMap: mottle(), bumpScale: 3 }));
  function tree(x: number, z: number, s = 1) {
    const t = group(root, [x, G, z]); t.scale.setScalar(s); lathe(t, [[0, 0], [.32, 0], [.22, .4], [.18, 2.6], [0, 2.7]], [0, 0, 0], bark, 12);
    for (let i = 0; i < 6; i++) {
      const g = new T.IcosahedronGeometry(1.1 + (i % 3) * .3, 2), a = g.attributes.position;
      for (let k = 0; k < a.count; k++) { const v = new T.Vector3().fromBufferAttribute(a, k), n = 1 + Math.sin(v.x * 3.1 + i) * .12 + Math.cos(v.y * 2.7 + v.z * 2.3) * .1; a.setXYZ(k, v.x * n, v.y * n * .85, v.z * n); }
      g.computeVertexNormals(); const m = new T.Mesh(g, leaves[(i + Math.round(x)) % 3]); const ang = i * 1.1; m.position.set(Math.cos(ang) * (i ? 1.1 : 0), 3.2 + (i % 2) * .7 + (i ? 0 : .5), Math.sin(ang) * (i ? 1.1 : 0)); t.add(m);
    }
  }
  for (let x = -40; x < 70; x += 13) tree(x + (x % 3), 13.4, .9 + (Math.abs(x) % 4) * .08);
  for (let x = -36; x < 70; x += 15) tree(x, 25.6, .85);
  for (const [x, z, s] of [[26, -10, 1.2], [50, -10, 1.1], [50, 9, 1.25], [26, 9, 1], [33, -11, .9], [44, 11, 1], [-6, -8, 1.1], [18, 9.5, .9], [-8, 9, 1]]) tree(x, z, s);
  for (const [x, z] of [[24.6, -2], [24.6, 4], [51.4, 1], [38, 11.5]]) plant(root, [x, G, z], 2.4);
  // Park furniture: swings, slide and benches.
  const red = new T.MeshPhysicalMaterial({ color: "#c0392b", roughness: .4, clearcoat: .6 }), yellow = new T.MeshPhysicalMaterial({ color: "#e3b448", roughness: .4, clearcoat: .6 }), wood = new T.MeshStandardMaterial({ color: "#9a4522", roughness: .8 });
  for (const x of [26.5, 30.5]) { rod(root, [x, G, -8], [x + .3, G + 2.6, -7], .05, red); rod(root, [x, G, -6], [x + .3, G + 2.6, -7], .05, red); }
  rod(root, [26.8, G + 2.6, -7], [30.8, G + 2.6, -7], .05, red);
  const swingSeats: T.Group[] = [];
  for (const x of [27.8, 29.5]) { const s = group(dynamic, [x, G + 2.55, -7]); for (const dx of [-.22, .22]) rod(s, [dx, 0, 0], [dx, -1.95, 0], .008, metal("#9b9b95", .4), 6); box(s, [.55, .05, .22], [0, -2, 0], wood, .01); swingSeats.push(s); }
  const slide = group(root, [33.5, G, -8.5]); for (const x of [-.3, .3]) { rod(slide, [x, 0, -1.2], [x, 2, -1.2], .04, yellow); rod(slide, [x, 0, -1.6], [x, 2, -1.2], .04, yellow); }
  box(slide, [.7, .05, .7], [0, 2, -1.3], yellow, .01); const chute = box(slide, [.6, .04, 3.1], [0, 1.05, .2], red, .02); chute.rotation.x = .62;
  const benches: [number, number, number][] = [[40, -9.6, 0], [47, 6.8, Math.PI * 1.25], [14, 15, Math.PI]];
  for (const [x, z, turn] of benches) { const b = group(root, [x, G, z]); b.rotation.y = turn; box(b, [1.8, .06, .45], [0, .45, 0], wood, .01); box(b, [1.8, .4, .05], [0, .72, -.22], wood, .01); for (const dx of [-.8, .8]) box(b, [.06, .45, .45], [dx, .22, 0], metal("#2a2622", .5), .01); }
  // Streetlights with pools of light on the ground at night.
  const glowMat = new T.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 });
  const bulbs: T.Mesh[] = [], pools: T.Mesh[] = [];
  for (let x = -60; x < 90; x += 16) for (const z of [16.3, 22.7]) {
    const side = z < 19 ? 1 : -1; rod(root, [x, G, z - side * .5], [x, G + 6.2, z - side * .5], .07, gate, 10); rod(root, [x, G + 6.2, z - side * .5], [x, G + 6.3, z + side * .7], .04, gate, 8);
    box(root, [.5, .12, .25], [x, G + 6.25, z + side * .8], gate, .02); const bulb = new T.Mesh(new T.BoxGeometry(.4, .03, .18), emissive("#ffd9a0", .3)); bulb.position.set(x, G + 6.18, z + side * .8); dynamic.add(bulb); bulbs.push(bulb);
    const pool = new T.Mesh(new T.PlaneGeometry(9, 9), glowMat); pool.rotation.x = -Math.PI / 2; pool.position.set(x, G + .1, z + side * .8); dynamic.add(pool); pools.push(pool);
  }
  // Vegetable cart near the gate.
  const cart = group(root, [2.5, G, 14.6]); box(cart, [2, .1, 1], [0, .85, 0], wood, .01); for (const x of [-.8, .8]) { const w = cylinder(cart, .38, .38, .06, [x, .38, .52], new T.MeshStandardMaterial({ color: "#2b2b2b" }), 20); w.rotation.x = Math.PI / 2; }
  const veg = ["#d9822b", "#c2402b", "#6b8a3a", "#e3b448", "#7b3f6b"]; for (let i = 0; i < 60; i++) sphere(cart, [.06, .06, .06], [-.9 + (i % 12) * .16, .95 + Math.floor(i / 12) * .03, -.4 + Math.floor(i / 12) * .2], new T.MeshStandardMaterial({ color: veg[Math.floor(i / 12)], roughness: .5 }), 8);
  rod(cart, [0, .9, 0], [0, 2.5, 0], .03, gate, 6); const shade = new T.Mesh(new T.ConeGeometry(1.4, .5, 8, 1, true), new T.MeshStandardMaterial({ color: "#2f6fb5", roughness: .8, side: T.DoubleSide })); shade.position.set(0, 2.5, 0); cart.add(shade);
  // Parked in the compound.
  const cars: { root: T.Group; lane: number; speed: number; lights: T.Mesh[] }[] = [];
  const put = (parent: T.Object3D, m: T.Mesh, x: number, y: number, z: number) => { m.position.set(x, y, z); parent.add(m); return m; };
  function vehicle(color: string, auto = false) {
    const v = new T.Group(), paint = new T.MeshPhysicalMaterial({ color, roughness: .28, metalness: .4, clearcoat: 1, clearcoatRoughness: .08 }), glass = new T.MeshPhysicalMaterial({ color: "#1a2428", roughness: .05, metalness: .3, clearcoat: 1 }), tyre = new T.MeshStandardMaterial({ color: "#181818", roughness: .8 });
    const lights: T.Mesh[] = [];
    if (auto) {
      put(v, new T.Mesh(new RoundedBoxGeometry(2.6, .9, 1.3, 3, .2), new T.MeshPhysicalMaterial({ color: "#e3c235", roughness: .35, clearcoat: .8 })), 0, .75, 0);
      put(v, new T.Mesh(new RoundedBoxGeometry(2.2, .8, 1.35, 3, .25), new T.MeshStandardMaterial({ color: "#1d1f1c", roughness: .7 })), -.2, 1.55, 0);
      put(v, new T.Mesh(new RoundedBoxGeometry(.6, .6, 1.2, 3, .1), new T.MeshPhysicalMaterial({ color: "#2f6b4f", roughness: .35, clearcoat: .8 })), 1.1, .55, 0);
      for (const [x, z] of [[1.2, 0], [-.9, .6], [-.9, -.6]]) { const w = new T.Mesh(new T.CylinderGeometry(.25, .25, .15, 16), tyre); w.rotation.x = Math.PI / 2; w.position.set(x, .25, z); v.add(w); }
      const head = new T.Mesh(new T.SphereGeometry(.09, 10, 8), emissive("#fff3d6", .4)); head.position.set(1.42, .85, 0); v.add(head); lights.push(head);
    } else {
      put(v, new T.Mesh(new RoundedBoxGeometry(4.2, .7, 1.8, 4, .25), paint), 0, .6, 0);
      put(v, new T.Mesh(new RoundedBoxGeometry(2.3, .6, 1.6, 4, .25), glass), -.25, 1.18, 0);
      put(v, new T.Mesh(new RoundedBoxGeometry(2.1, .1, 1.62, 3, .04), paint), -.25, 1.47, 0);
      for (const x of [1.35, -1.3]) for (const z of [.85, -.85]) { const w = new T.Mesh(new T.CylinderGeometry(.34, .34, .24, 20), tyre); w.rotation.x = Math.PI / 2; w.position.set(x, .34, z); v.add(w); const rim = new T.Mesh(new T.CylinderGeometry(.2, .2, .25, 16), metal("#c9ccc8", .25)); rim.rotation.x = Math.PI / 2; rim.position.copy(w.position); v.add(rim); }
      for (const z of [.6, -.6]) { const h = new T.Mesh(new T.BoxGeometry(.05, .14, .36), emissive("#fff3d6", .4)); h.position.set(2.1, .7, z); v.add(h); lights.push(h); const t = new T.Mesh(new T.BoxGeometry(.05, .12, .4), emissive("#d12a2a", .6)); t.position.set(-2.1, .72, z); v.add(t); lights.push(t); }
    }
    return { v, lights };
  }
  for (const [x, z, color, turn] of [[-4, 7, "#b8bdc0", Math.PI / 2], [-.5, 7, "#7a1f22", Math.PI / 2]] as [number, number, string, number][]) { const { v } = vehicle(color); v.position.set(x, G + .06, z); v.rotation.y = turn; root.add(v); }
  [["#e9e6de", 18.2, 9], ["#2f4a6b", 18.2, 7], ["#c0392b", 20.8, -8], ["#3d3d3d", 20.8, -10], ["auto", 18.2, 6], ["#e0a526", 20.8, -6.5]].forEach(([color, lane, speed], i) => {
    const { v, lights } = vehicle(color === "auto" ? "#e3c235" : color as string, color === "auto"); v.position.set(-100 + i * 47, G + .06, lane as number); if ((speed as number) < 0) v.rotation.y = Math.PI; dynamic.add(v); cars.push({ root: v, lane: lane as number, speed: speed as number, lights });
  });
  // People.
  const skin = ["#8d5a3b", "#a86b45", "#b4532a", "#7a4a2f", "#b47a52"];
  const agents: { update: (t: number, dt: number, w: Weather) => void }[] = [];
  function addPerson(look: Parameters<typeof makePerson>[0]) { const p = makePerson(look); dynamic.add(p.root); return p; }
  function umbrella(p: Person, color: string) {
    const u = new T.Group(); p.hands[1].add(u); u.rotation.x = -.3;
    rod(u, [0, 0, 0], [0, .95, 0], .01, metal("#2a2a2a", .5), 6); const canopy = new T.Mesh(new T.ConeGeometry(.55, .3, 10, 1, true), new T.MeshStandardMaterial({ color, roughness: .6, side: T.DoubleSide })); canopy.position.y = 1.05; u.add(canopy);
    return u;
  }
  // Aunties on their evening walk round the park, umbrellas up when it rains.
  [["#c0392b", "#7a1f22", 0, 1], ["#2f6b4f", "#1f4535", Math.PI, .9], ["#6b3fa0", "#3f2266", 2.2, 1.05]].forEach(([saree, top, start, pace], i) => {
    const p = addPerson({ skin: skin[i + 1], top: top as string, bottom: top as string, hair: "#1b1512", saree: saree as string, longHair: true, height: 1.55 + i * .03 });
    const u = umbrella(p, ["#1f2f4f", "#5a2b4a", "#2b4a3a"][i]); let a = start as number, phase = i;
    p.shoulders[1].rotation.z = 0;
    agents.push({ update(t, dt, w) {
      a += dt * .11 * (pace as number); phase += dt * 5.2 * (pace as number);
      const x = 38 + Math.cos(a) * 10.3, z = Math.sin(a) * 10.3 * .78; p.root.position.set(x, G + .09, z); p.root.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a) * .78);
      walk(p, phase, 1); u.visible = w === "rain"; if (u.visible) { p.shoulders[1].rotation.x = -.9; p.elbows[1].rotation.x = -1.1; }
    } });
  });
  // A dog trotting beside the first walker.
  const dog = makeDog(); dynamic.add(dog.root); let dogPhase = 0;
  agents.push({ update(t, dt) { const a = (t * .11) % (Math.PI * 2) + .12; dogPhase += dt * 11; dog.root.position.set(38 + Math.cos(a) * 9.2, G + .09, Math.sin(a) * 9.2 * .78); dog.root.rotation.y = Math.atan2(-Math.cos(a) * .78, -Math.sin(a)); dog.legs.forEach((l, i) => l.rotation.z = Math.sin(dogPhase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * .5); dog.tail.rotation.x = Math.sin(t * 9) * .4; } });
  // Uncle on the bench with the newspaper.
  const uncle = addPerson({ skin: skin[3], top: "#e9e6de", bottom: "#6b5a44", hair: "#bdb6aa", height: 1.7 });
  sit(uncle); uncle.root.position.set(40, G + .02, -9.5); uncle.root.rotation.y = 0;
  for (const s of uncle.shoulders) s.rotation.x = -1.1; for (const e of uncle.elbows) e.rotation.x = -.9; uncle.shoulders[0].rotation.z = -.25; uncle.shoulders[1].rotation.z = .25;
  const paper = new T.Mesh(new T.PlaneGeometry(.75, .5), new T.MeshStandardMaterial({ map: canvasTexture(ctx => { ctx.fillStyle = "#e8e2d2"; ctx.fillRect(0, 0, 512, 340); ctx.fillStyle = "#2a2a2a"; ctx.font = "700 44px Georgia"; ctx.fillText("THE DAILY NEWS", 30, 60); for (let i = 0; i < 18; i++) ctx.fillRect(30 + (i % 3) * 160, 90 + Math.floor(i / 3) * 40, 140, 6); }, 512, 340), side: T.DoubleSide, roughness: .9 }));
  paper.position.set(0, 1.0, .5); paper.rotation.x = -.15; uncle.root.add(paper);
  agents.push({ update(t) { uncle.head.rotation.y = Math.sin(t * .3) * .25; paper.rotation.y = Math.sin(t * .2) * .05; } });
  // Kids: cricket on the lawn, one on the swing.
  const batter = addPerson({ skin: skin[0], top: "#1f6fb2", bottom: "#2b2b2b", hair: "#15110f", height: 1.25 });
  const bowler = addPerson({ skin: skin[2], top: "#e3b448", bottom: "#3a3a3a", hair: "#15110f", height: 1.2 });
  const fielder = addPerson({ skin: skin[4], top: "#c0392b", bottom: "#2b3a4a", hair: "#15110f", height: 1.15 });
  const keeper = addPerson({ skin: skin[1], top: "#2f6b4f", bottom: "#2b2b2b", hair: "#15110f", height: 1.1, longHair: true });
  const bat = new T.Group(); batter.hands[0].add(bat); box(bat, [.09, .55, .03], [0, -.3, 0], new T.MeshStandardMaterial({ color: "#d9b77a", roughness: .7 }), .01);
  const stumps = group(dynamic, [33.6, G, 1.5]); for (const dz of [-.1, 0, .1]) rod(stumps, [0, 0, dz], [0, .7, dz], .016, new T.MeshStandardMaterial({ color: "#e8e1cf" }), 8);
  const ball = new T.Mesh(new T.SphereGeometry(.05, 12, 8), new T.MeshPhysicalMaterial({ color: "#b5352a", roughness: .3, clearcoat: .8 })); dynamic.add(ball);
  const swinger = addPerson({ skin: skin[2], top: "#d9622b", bottom: "#2b3a4a", hair: "#15110f", height: 1.05, longHair: true }); sit(swinger);
  const v3 = (x: number, y: number, z: number) => new T.Vector3(x, G + y, z);
  const arc = (a: T.Vector3, b: T.Vector3, t: number, h: number) => a.clone().lerp(b, t).setY(a.y + (b.y - a.y) * t + Math.sin(Math.PI * t) * h);
  let fielderX = 31, fielderZ = 9;
  agents.push({ update(t, dt) {
    const c = t % 8;
    // Bowler: run-up, delivery, walk back.
    const runT = Math.min(1, c / 1.6), bx = c < 1.8 ? 44 - runT * 4 : c < 5.5 ? 40 : 40 + (c - 5.5) / 2.5 * 4;
    bowler.root.position.set(bx, G + .09, 1.5); bowler.root.rotation.y = c < 1.8 ? -Math.PI / 2 : c < 5.5 ? -Math.PI / 2 : Math.PI / 2;
    if (c < 1.6) walk(bowler, c * 12, 1.7); else if (c < 2) { walk(bowler, 0, 0); bowler.shoulders[1].rotation.x = -Math.PI * 2 * ((c - 1.6) / .4) - .5; } else walk(bowler, c * 7, c > 5.5 ? 1 : 0);
    // Batter: stance, swing on arrival.
    batter.root.position.set(34.2, G + .09, 1.35); batter.root.rotation.y = Math.PI / 2; walk(batter, 0, 0);
    const swing = c > 2.25 && c < 2.7 ? (c - 2.25) / .45 : 0; batter.shoulders[0].rotation.x = -1.2 + swing * 2.2; batter.shoulders[1].rotation.x = -1.1 + swing * 2.2; batter.elbows[0].rotation.x = batter.elbows[1].rotation.x = -.5; batter.body.rotation.y = -.5 + swing * 1.2;
    keeper.root.position.set(33, G + .09, 1.5); keeper.root.rotation.y = Math.PI / 2; walk(keeper, 0, 0); keeper.knees[0].rotation.x = keeper.knees[1].rotation.x = .9; keeper.hips[0].rotation.x = keeper.hips[1].rotation.x = -.7; keeper.body.position.y = -.12;
    // Ball: delivery with a bounce, the hit, the catch, the throw back.
    const hand = v3(40, 2, 1.5), pitch = v3(35.4, .05, 1.45), bat0 = v3(34.4, .5, 1.4), land = v3(fielderX, 1, fielderZ);
    if (c < 1.8) ball.position.copy(hand).setX(bx).setY(G + 1);
    else if (c < 2.15) ball.position.copy(hand.clone().lerp(pitch, (c - 1.8) / .35));
    else if (c < 2.45) ball.position.copy(arc(pitch, bat0, (c - 2.15) / .3, .3));
    else if (c < 4.2) ball.position.copy(arc(bat0, land, (c - 2.45) / 1.75, 6));
    else if (c < 5) ball.position.copy(land);
    else if (c < 6.1) ball.position.copy(arc(land, v3(40, 1.2, 1.5), (c - 5) / 1.1, 2.5));
    else ball.position.set(40, G + 1, 1.5);
    // Fielder runs to the catch and throws.
    const goal = c > 2.45 && c < 4.2 ? 1 : 0; const fx = 31 + goal * 0, fz = 9; fielderX += (fx - fielderX) * dt; fielderZ += (fz - fielderZ) * dt;
    fielder.root.position.set(fielderX - (c > 2.6 && c < 4.2 ? (4.2 - c) * .6 : 0), G + .09, fielderZ); fielder.root.rotation.y = Math.atan2(40 - fielderX, 1.5 - fielderZ);
    if (c > 2.6 && c < 4.2) walk(fielder, c * 13, 1.6); else { walk(fielder, 0, 0); if (c >= 4.2 && c < 5) { fielder.shoulders[0].rotation.x = fielder.shoulders[1].rotation.x = -2.6; } else if (c >= 5 && c < 5.3) fielder.shoulders[1].rotation.x = -3 + (c - 5) * 10; }
    // Swing: a pendulum with legs that pump.
    const sw = Math.sin(t * 2.1) * .55; swingSeats[0].rotation.x = sw; swingSeats[1].rotation.x = Math.sin(t * 1.3 + 1) * .08;
    swinger.root.position.set(27.8, G + 2.55, -7); swinger.root.rotation.set(sw, Math.PI, 0); swinger.body.position.y = -1.97 - .92 * (1.05 / 1.65); for (const k of swinger.knees) k.rotation.x = Math.PI / 2 - sw * .9; for (const s of swinger.shoulders) s.rotation.x = -2.6;
  } });
  // A jogger on the footpath, and two men at the chai stall.
  const jogger = addPerson({ skin: skin[1], top: "#1d1f22", bottom: "#4a4e55", hair: "#15110f", height: 1.75 }); let jx = -40, jdir = 1, jphase = 0;
  agents.push({ update(t, dt) { jx += jdir * dt * 3.2; if (jx > 70 || jx < -50) jdir *= -1; jphase += dt * 10; jogger.root.position.set(jx, G + .17, 13.4 + (jdir > 0 ? 0 : 1.2)); jogger.root.rotation.y = jdir > 0 ? Math.PI / 2 : -Math.PI / 2; walk(jogger, jphase, 1.7); } });
  const chat = [addPerson({ skin: skin[3], top: "#e8dcc0", bottom: "#4a4e55", hair: "#15110f", height: 1.72 }), addPerson({ skin: skin[0], top: "#5a6b7a", bottom: "#2b2b2b", hair: "#2a2420", height: 1.68 })];
  chat[0].root.position.set(-12, G + .17, 24.1); chat[0].root.rotation.y = .9; chat[1].root.position.set(-10.6, G + .17, 24.3); chat[1].root.rotation.y = -1.9;
  const vendor = addPerson({ skin: skin[3], top: "#d9c7a0", bottom: "#e8e2d2", hair: "#2a2420", height: 1.66 }); vendor.root.position.set(1.2, G + .17, 14.2); vendor.root.rotation.y = Math.PI / 2;
  agents.push({ update(t) {
    for (const [i, p] of chat.entries()) { walk(p, 0, 0); p.shoulders[1].rotation.x = -1.3 + Math.sin(t * 2 + i * 2) * .25; p.elbows[1].rotation.x = -1.4; p.head.rotation.y = Math.sin(t * .7 + i) * .3; }
    walk(vendor, 0, 0); vendor.shoulders[0].rotation.x = Math.sin(t * .9) * .4 - .2; vendor.head.rotation.y = Math.sin(t * .4) * .5;
  } });
  // Birds circling over the park.
  const birdMat = new T.MeshStandardMaterial({ color: "#2b2b2b", roughness: .8, side: T.DoubleSide });
  const birds = Array.from({ length: 9 }, (_, i) => { const b = new T.Group(); for (const s of [-1, 1]) { const wing = new T.Mesh(new T.PlaneGeometry(.35, .12), birdMat); wing.position.x = s * .17; const pivot = new T.Group(); pivot.add(wing); b.add(pivot); } b.add(new T.Mesh(new T.CapsuleGeometry(.04, .14, 3, 6), birdMat)); b.children[2].rotation.x = Math.PI / 2; b.userData.seed = i; dynamic.add(b); return b; });
  // Rain: streaks around the camera, never inside the flat.
  const drops = 2200, rainPositions = new Float32Array(drops * 6), speeds = new Float32Array(drops), rainGeometry = new T.BufferGeometry(); rainGeometry.setAttribute("position", new T.BufferAttribute(rainPositions, 3));
  for (let i = 0; i < drops; i++) { speeds[i] = 14 + (i % 7); const x = (Math.random() - .5) * 44, y = Math.random() * 30 - 14, z = (Math.random() - .5) * 44; rainPositions.set([x, y, z, x + .03, y - .4, z + .02], i * 6); }
  const rain = new T.LineSegments(rainGeometry, new T.LineBasicMaterial({ color: "#c9d8dc", transparent: true, opacity: .35, depthWrite: false })); rain.frustumCulled = false; dynamic.add(rain);
  const indoors = (x: number, y: number, z: number) => y > -.3 && y < 4.6 && ((x > -4.2 && x < 20.2 && z > -3.4 && z < 3.35) || (x > -4.15 && x < 12.15 && z > 3.2 && z < 9.9));
  batchScenery(root);
  const mood = { rain: .55, day: 0, sunset: .45, night: 1.5 };
  let lit = 0;
  let life = true;
  return {
    root,
    /** People, traffic and birds on or off. */
    setLife(on: boolean) { life = on; for (const o of dynamic.children) if (o !== rain && !bulbs.includes(o as T.Mesh) && !pools.includes(o as T.Mesh)) o.visible = on; },
    update(camera: T.Camera, time: number, delta: number, options: WorldOptions) {
      const w = options.weather, k = options.motion ? 1 - Math.exp(-delta * 2) : 1, night = w === "night" ? 1 : w === "rain" ? .7 : w === "sunset" ? .5 : 0;
      lit += (mood[w] - lit) * k; for (const m of paints) m.emissiveIntensity = lit;
      for (const b of bulbs) (b.material as T.MeshBasicMaterial).color.set("#ffd9a0").multiplyScalar(.3 + night * 3);
      glowMat.opacity = night * .55;
      const dt = options.motion ? delta : 0, t = options.motion ? time : 0;
      for (const car of cars) { car.root.position.x += car.speed * dt; if (car.root.position.x > 150) car.root.position.x = -130; if (car.root.position.x < -130) car.root.position.x = 150; for (const l of car.lights) (l.material as T.MeshBasicMaterial).color.set(l.position.x > 0 ? "#fff3d6" : "#d12a2a").multiplyScalar(.4 + night * 2.6); }
      const kidsOut = w !== "night" && life; for (const p of [batter, bowler, fielder, keeper, swinger]) p.root.visible = kidsOut; ball.visible = stumps.visible = kidsOut;
      if (life) for (const a of agents) a.update(t, dt, w);
      birds.forEach((b, i) => { b.visible = life && (w === "day" || w === "sunset"); const a = t * .25 + i * .7, r = 9 + (i % 3) * 3; b.position.set(38 + Math.cos(a) * r, G + 16 + Math.sin(t * .6 + i) * 1.5 + i * .4, Math.sin(a) * r); b.rotation.y = -a; const flap = Math.sin(t * 9 + i) * .6; (b.children[0] as T.Group).rotation.z = flap; (b.children[1] as T.Group).rotation.z = -flap; });
      rain.visible = w === "rain";
      if (rain.visible && options.motion) {
        const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z, count = options.quality === "low" ? 900 : drops;
        rainGeometry.setDrawRange(0, count * 2);
        for (let i = 0; i < count; i++) {
          const o = i * 6; let x = rainPositions[o], y = rainPositions[o + 1] - speeds[i] * delta, z = rainPositions[o + 2];
          if (y < Math.max(G, cy - 16) || Math.abs(x - cx) > 22 || Math.abs(z - cz) > 22) { x = cx + (Math.random() - .5) * 44; z = cz + (Math.random() - .5) * 44; y = cy + 12 + Math.random() * 4; }
          const hide = indoors(x, y, z) ? 1000 : 0;
          rainPositions[o] = x; rainPositions[o + 1] = y; rainPositions[o + 2] = z;
          rainPositions[o + 3] = x + .03; rainPositions[o + 4] = y - .45 - hide; rainPositions[o + 5] = z + .02;
          if (hide) { rainPositions[o + 4] = y; rainPositions[o + 3] = x; rainPositions[o + 5] = z; }
        }
        rainGeometry.attributes.position.needsUpdate = true;
      }
    },
    dispose() { disposeObject(root); },
  };
}
