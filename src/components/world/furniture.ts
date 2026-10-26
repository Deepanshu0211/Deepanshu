import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { colors as c, box, cylinder, sphere, group, tube, arcSegments } from "./objects";
import { fabric, ceramic, metal, emissive, surface, rugTexture, weave, windify } from "./materials";

// Shared furniture kit. Every piece is built around its floor footprint, facing +z, so rooms place
// furniture with a position and a turn. Proportions follow real furniture in metres.

/** Soft furnishing block: faces puff outward, optional creases across the top. */
export function cushion(w: number, h: number, d: number, puff = .25, crease = 0, radius = .08) {
  const g = new RoundedBoxGeometry(w, h, d, 6, Math.min(radius, h / 2.2, w / 3, d / 3)); const a = g.attributes.position;
  for (let i = 0; i < a.count; i++) {
    const x = a.getX(i), y = a.getY(i), z = a.getZ(i), nx = x / (w / 2), nz = z / (d / 2), bulge = Math.max(0, 1 - nx * nx) * Math.max(0, 1 - nz * nz);
    a.setY(i, y + Math.sign(y) * puff * h * bulge * .5 + (y > 0 ? crease * Math.sin(x * 19 + z * 5) * Math.sin(z * 13 - x * 3) : 0));
  }
  g.computeVertexNormals(); return g;
}
export function mesh(parent: T.Object3D, geometry: T.BufferGeometry, pos: number[], mat: T.Material) { const m = new T.Mesh(geometry, mat); m.position.set(pos[0], pos[1], pos[2]); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
export function lathe(parent: T.Object3D, points: number[][], pos: number[], mat: T.Material, segments = arcSegments(Math.max(...points.map(p => p[0])), 12, 48)) { return mesh(parent, new T.LatheGeometry(points.map(([x, y]) => new T.Vector2(x, y)), segments), pos, mat); }
export function rod(parent: T.Object3D, a: number[], b: number[], r: number, mat: T.Material, sides = arcSegments(r, 5, 16)) {
  const A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]);
  const m = mesh(parent, new T.CylinderGeometry(r, r, A.distanceTo(B), sides), [0, 0, 0], mat); m.position.copy(A).add(B).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.sub(A).normalize()); return m;
}
export function place(parent: T.Object3D, pos: number[], turn = 0) { const g = group(parent, pos); g.rotation.y = turn; return g; }

export const finishes = {
  oak: () => surface("#7b4a2b"), walnut: () => surface("#3e2618"), blackMetal: () => metal("#2a2622", .45), brass: () => metal("#a88a5c", .34), steel: () => metal("#c9ccc8", .22),
  linen: (color = "#e8dcc0") => fabric(color, .95), glass: () => new T.MeshPhysicalMaterial({ color: "#e8f0ee", transparent: true, opacity: .18, roughness: .04, depthWrite: false }),
};

export function sofa(parent: T.Object3D, pos: number[], turn: number, color: string, length = 2.3) {
  const g = place(parent, pos, turn), cloth = fabric(color, .92), legs = finishes.walnut();
  box(g, [length, .2, .9], [0, .28, 0], cloth, .06);
  const seats = Math.round(length / .75);
  for (let i = 0; i < seats; i++) { const w = (length - .36) / seats; mesh(g, cushion(w - .02, .16, .62, .35, .004, .06), [-length / 2 + .18 + w * (i + .5), .46, .08], cloth); mesh(g, cushion(w - .04, .5, .2, .4, 0, .08), [-length / 2 + .18 + w * (i + .5), .74, -.3], cloth).rotation.x = -.14; }
  for (const x of [-1, 1]) mesh(g, cushion(.18, .32, .9, .2, 0, .07), [x * (length / 2 - .09), .54, 0], cloth);
  mesh(g, cushion(length, .44, .16, .1, 0, .06), [0, .62, -.38], cloth);
  for (const x of [-1, 1]) for (const z of [-1, 1]) cylinder(g, .022, .016, .18, [x * (length / 2 - .1), .09, z * .36], legs, 12);
  return g;
}
export function armchair(parent: T.Object3D, pos: number[], turn: number, color: string) {
  const g = place(parent, pos, turn), cloth = fabric(color, .9), legs = finishes.walnut();
  mesh(g, cushion(.62, .16, .62, .4, .003, .06), [0, .44, .04], cloth); mesh(g, cushion(.66, .62, .16, .25, 0, .08), [0, .74, -.3], cloth).rotation.x = -.18;
  for (const x of [-1, 1]) mesh(g, cushion(.12, .26, .7, .2, 0, .05), [x * .37, .52, 0], cloth);
  box(g, [.82, .12, .74], [0, .3, 0], cloth, .04);
  for (const x of [-1, 1]) for (const z of [-1, 1]) rod(g, [x * .34, 0, z * .3], [x * .32, .25, z * .28], .018, legs);
  return g;
}
export function chair(parent: T.Object3D, pos: number[], turn: number, wood = finishes.oak(), seat: T.Material = fabric("#b4532a", .9)) {
  const g = place(parent, pos, turn);
  mesh(g, cushion(.44, .06, .42, .4, 0, .03), [0, .47, 0], seat); box(g, [.44, .035, .42], [0, .43, 0], wood, .01);
  for (const x of [-.19, .19]) { for (const z of [-.18, .18]) rod(g, [x, 0, z], [x, .43, z], .018, wood); rod(g, [x, .43, -.19], [x * .95, .9, -.23], .016, wood); }
  for (const y of [.62, .78]) box(g, [.42, .05, .02], [0, y, -.22], wood, .01);
  return g;
}
export function table(parent: T.Object3D, pos: number[], size: number[], top: T.Material = finishes.oak(), legs: T.Material = finishes.oak(), round = false) {
  const [w, h, d] = size, g = place(parent, pos);
  if (round) { cylinder(g, w / 2, w / 2, .04, [0, h - .02, 0], top, 48); rod(g, [0, 0, 0], [0, h - .04, 0], .04, legs); cylinder(g, .26, .3, .03, [0, .015, 0], legs, 32); return g; }
  box(g, [w, .045, d], [0, h - .022, 0], top, .012);
  for (const x of [-1, 1]) for (const z of [-1, 1]) rod(g, [x * (w / 2 - .06), 0, z * (d / 2 - .06)], [x * (w / 2 - .07), h - .045, z * (d / 2 - .07)], .022, legs);
  box(g, [w - .16, .06, .02], [0, h - .08, d / 2 - .07], legs, .005); box(g, [w - .16, .06, .02], [0, h - .08, -d / 2 + .07], legs, .005);
  return g;
}
export function rug(parent: T.Object3D, pos: number[], size: number[], tint = "#ffffff", art: T.Texture = rugTexture()) {
  return box(parent, [size[0], .014, size[1]], [pos[0], (pos[1] ?? 0) + .03, pos[2]], new T.MeshStandardMaterial({ color: tint, map: art, bumpMap: rugTexture(), bumpScale: 2, roughness: 1 }), .006);
}
export function arcLamp(parent: T.Object3D, pos: number[], turn: number) {
  const g = place(parent, pos, turn), steel = finishes.steel();
  cylinder(g, .17, .18, .05, [0, .025, 0], new T.MeshStandardMaterial({ color: "#d9d4cb", roughness: .3 }), 40);
  tube(g, [[0, .05, 0], [0, 1.2, 0], [.25, 1.85, .05], [.8, 1.98, .1], [1.2, 1.8, .1]], .014, steel);
  const shade = lathe(g, [[.02, .06], [.1, .04], [.18, -.06], [.2, -.1]], [1.22, 1.78, .1], new T.MeshPhysicalMaterial({ color: "#2a2622", roughness: .35, clearcoat: .6, side: T.DoubleSide }), 40);
  const bulb = new T.Mesh(new T.SphereGeometry(.045, 16, 12), emissive(c.amber, 2.6)); bulb.position.set(1.22, 1.72, .1); g.add(bulb);
  return { group: g, shade, bulb };
}
/** Ceiling fan on a downrod; rotate `blades` each frame. */
export function ceilingFan(parent: T.Object3D, pos: number[]) {
  const g = place(parent, pos), white = new T.MeshPhysicalMaterial({ color: "#ece6da", roughness: .45, clearcoat: .4 });
  rod(g, [0, 0, 0], [0, -.42, 0], .016, white); lathe(g, [[0, .02], [.1, .0], [.13, -.08], [.1, -.14], [0, -.15]], [0, -.42, 0], white, 40);
  const blades = group(g, [0, -.5, 0]); blades.userData.dynamic = true;
  for (let i = 0; i < 3; i++) { const arm = group(blades, [0, 0, 0]); arm.rotation.y = i * Math.PI * 2 / 3; const blade = box(arm, [.13, .012, .62], [0, 0, .44], white, .006); blade.rotation.x = .1; box(arm, [.05, .02, .14], [0, .01, .12], metal("#b9b4a8", .3), .005); }
  const light = new T.Mesh(new T.SphereGeometry(.08, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), emissive("#fff1d6", 1.6)); light.position.y = -.55; g.add(light);
  return { group: g, blades };
}
export function pendant(parent: T.Object3D, pos: number[], drop = .9, color = "#2a2622") {
  const g = place(parent, pos); rod(g, [0, 0, 0], [0, -drop, 0], .004, new T.MeshStandardMaterial({ color: "#1b1b1b" }), 6);
  lathe(g, [[.015, 0], [.05, -.01], [.12, -.12], [.19, -.24]], [0, -drop, 0], new T.MeshPhysicalMaterial({ color, roughness: .35, clearcoat: .6, side: T.DoubleSide }), 40);
  const bulb = new T.Mesh(new T.SphereGeometry(.05, 16, 12), emissive(c.amber, 3)); bulb.position.y = -drop - .14; g.add(bulb);
  return g;
}
/** Framed artwork with a mount; `art` is a texture or a colour. Faces +z. */
export function frame(parent: T.Object3D, pos: number[], turn: number, w: number, h: number, art: T.Texture | string, moulding: T.Material = finishes.walnut()) {
  const g = place(parent, pos, turn);
  box(g, [w, h, .04], [0, 0, 0], moulding, .008); box(g, [w - .06, h - .06, .01], [0, 0, .021], new T.MeshStandardMaterial({ color: "#efe8d8", roughness: .9 }), 0);
  const mount = Math.min(.1, w * .14), picture = new T.Mesh(new T.PlaneGeometry(w - mount * 2, h - mount * 2), new T.MeshStandardMaterial(typeof art === "string" ? { color: art, roughness: .8 } : { map: art, roughness: .7 })); picture.position.z = .027; g.add(picture);
  const pane = new T.Mesh(new T.PlaneGeometry(w - .06, h - .06), new T.MeshPhysicalMaterial({ color: "#fff", transparent: true, opacity: .06, roughness: .03, depthWrite: false })); pane.position.z = .03; g.add(pane);
  return { group: g, picture };
}
/** A pair of pleated linen curtains on a brass rod. Returns the panels so rooms can sway them. */
export function curtains(parent: T.Object3D, center: number[], span: number, height: number, turn = 0, color = "#dccfb4") {
  const g = place(parent, center, turn), cloth = windify(fabric(color, .95), { kind: "cloth", top: height / 2, height, amp: .012 }); cloth.side = T.DoubleSide; const panels: T.Mesh[] = [];
  rod(g, [-span / 2 - .15, height / 2 + .08, 0], [span / 2 + .15, height / 2 + .08, 0], .016, finishes.brass());
  for (const x of [-1, 1]) {
    const geometry = new T.PlaneGeometry(.46, height, 28, 14), a = geometry.attributes.position;
    for (let i = 0; i < a.count; i++) a.setZ(i, Math.sin(a.getX(i) * 52) * .042 + Math.sin(a.getX(i) * 17 + a.getY(i) * .8) * .012);
    geometry.computeVertexNormals(); const panel = mesh(g, geometry, [x * (span / 2 - .05), 0, .06], cloth); panel.userData.dynamic = true; panels.push(panel);
  }
  return panels;
}
export function mug(parent: T.Object3D, pos: number[], color = c.cream) {
  const g = place(parent, pos), glaze = ceramic(color, .28);
  lathe(g, [[0, 0], [.04, 0], [.045, .005], [.047, .09], [.05, .093], [.044, .094], [.042, .008], [0, .008]], [0, 0, 0], glaze, 32);
  cylinder(g, .041, .041, .003, [0, .07, 0], new T.MeshPhysicalMaterial({ color: "#2b1a10", roughness: .15, clearcoat: 1 }), 24);
  mesh(g, new T.TorusGeometry(.026, .007, 10, 20, Math.PI * 1.25), [.05, .05, 0], glaze).rotation.z = -Math.PI * .62; return g;
}
/** Cutting chai: a ribbed tea glass, half full. */
export function chaiGlass(parent: T.Object3D, pos: number[]) {
  const g = place(parent, pos);
  lathe(g, [[0, 0], [.026, 0], [.034, .085], [.032, .086], [.024, .002]], [0, 0, 0], new T.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: .35, roughness: .05 }), 12);
  lathe(g, [[0, .004], [.025, .004], [.03, .06], [0, .06]], [0, 0, 0], new T.MeshPhysicalMaterial({ color: "#a8652d", roughness: .2, clearcoat: 1 }), 16); return g;
}
export function bowlOfFruit(parent: T.Object3D, pos: number[]) {
  const g = place(parent, pos); lathe(g, [[0, 0], [.08, 0], [.15, .06], [.16, .075], [.15, .075], [.07, .012], [0, .012]], [0, 0, 0], ceramic("#e8e1d2", .3), 40);
  const fruit: [string, number][] = [["#d9822b", .045], ["#c2402b", .043], ["#d9b43a", .04], ["#8aa84a", .04], ["#d9822b", .044]];
  fruit.forEach(([color, r], i) => sphere(g, [r, r * .95, r], [Math.cos(i * 1.3) * .06, .06 + (i > 2 ? .04 : 0), Math.sin(i * 1.3) * .06], new T.MeshPhysicalMaterial({ color, roughness: .35, clearcoat: .5 }), 18));
  return g;
}
export function vase(parent: T.Object3D, pos: number[], color = "#d9d1bf") {
  const g = place(parent, pos); lathe(g, [[0, 0], [.06, 0], [.09, .08], [.08, .2], [.04, .28], [.045, .32], [.035, .32], [.03, .02]], [0, 0, 0], ceramic(color, .4), 40);
  const stem = new T.MeshStandardMaterial({ color: "#7b6a4a", roughness: .8 });
  for (let i = 0; i < 5; i++) { const a = i * 1.26; tube(g, [[0, .3, 0], [Math.cos(a) * .06, .5, Math.sin(a) * .06], [Math.cos(a) * .14, .66 + (i % 2) * .08, Math.sin(a) * .14]], .004, stem); sphere(g, [.02, .03, .02], [Math.cos(a) * .14, .68 + (i % 2) * .08, Math.sin(a) * .14], new T.MeshStandardMaterial({ color: "#d8cdb0", roughness: .9 }), 10); }
  return g;
}
/** Stacked books for shelves and tables; returns the books so a room can make some interactive. */
export function books(parent: T.Object3D, start: number[], length: number, seed = 1, palette = ["#8a3b2e", "#2f4f43", "#c9a75a", "#4a5a7a", "#6d7b55", "#e2d6bd", "#7a4b3a"]) {
  const g = place(parent, start), list: T.Group[] = [], pages = new T.MeshStandardMaterial({ color: "#efe7d4", roughness: .95, bumpMap: weave(), bumpScale: .3 });
  let x = 0, i = 0;
  while (x < length - .05) {
    const k = (i * 7 + seed * 13) % 17, w = .035 + (k % 4) * .012, h = .2 + (k % 5) * .025, d = .17 + (k % 3) * .02;
    if (x + w > length) break;
    const b = group(g, [x + w / 2, h / 2, 0]); if (k % 11 === 0) { b.rotation.z = -.12; b.position.x += .01; }
    box(b, [w, h, d], [0, 0, 0], new T.MeshStandardMaterial({ color: palette[k % palette.length], roughness: .7 }), .004);
    box(b, [w - .004, .003, d - .01], [0, h / 2 + .001, -.003], pages, 0);
    if (k % 3 === 0) box(b, [w + .001, .012, .004], [0, h / 2 - .04, d / 2 + .002], finishes.brass(), 0);
    list.push(b); x += w + .004; i++;
  }
  return list;
}
