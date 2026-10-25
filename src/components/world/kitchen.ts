import * as T from "three";
import { type Area, colors as c, box, sphere, cylinder, group, sign, plant, interactive, tube } from "./objects";
import { fabric, ceramic, metal, emissive, granite, tiles, projected } from "./materials";
import { table, chair, pendant, bowlOfFruit, mug, place, mesh, lathe, rod, finishes } from "./furniture";

// Soft steam: a few billboards with a radial falloff that rise, swell and fade.
function steamTexture() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64; const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  const t = new T.CanvasTexture(canvas); t.colorSpace = T.SRGBColorSpace; return t;
}

export function createKitchen(): Area {
  const root = new T.Group(); let radioOn = false, kettleUntil = 0;
  const steel = finishes.steel(), oak = finishes.oak();
  const cabinet = new T.MeshPhysicalMaterial({ color: "#2f4f43", roughness: .5, clearcoat: .45, clearcoatRoughness: .35 });
  const top = projected(new T.MeshPhysicalMaterial({ map: granite(), roughness: .25, clearcoat: 1, clearcoatRoughness: .08 }), .8);
  // Base cabinets along the north wall, a granite top, shaker doors with brass pulls.
  const run = group(root, [-.4, 0, -2.85]);
  box(run, [6.6, .1, .56], [0, .05, .03], metal("#2a2622", .5), .01);
  box(run, [6.6, .78, .6], [0, .49, 0], cabinet, .01);
  for (let i = 0; i < 11; i++) { const x = -3.0 + i * .6; box(run, [.56, .7, .02], [x, .48, .305], cabinet, .012); box(run, [.4, .54, .01], [x, .48, .318], cabinet, .01); box(run, [.12, .018, .02], [x, .78, .33], finishes.brass(), .006); }
  box(run, [6.66, .04, .66], [0, .9, .02], top, .006);
  // Backsplash: subway tile below and beside the window.
  const subway = projected(new T.MeshPhysicalMaterial({ map: tiles("subway"), roughness: .2, clearcoat: .9, clearcoatRoughness: .1 }), .6);
  box(root, [6.6, .38, .02], [-.4, 1.11, -3.15], subway, 0); box(root, [2.85, .7, .02], [-2.28, 1.65, -3.15], subway, 0); box(root, [1.3, .62, .02], [2.25, 1.61, -3.15], subway, 0);
  // Sink under the window with a gooseneck tap.
  const sink = place(root, [.4, .92, -2.85]);
  box(sink, [.82, .02, .48], [0, 0, 0], steel, .01); box(sink, [.7, .18, .38], [0, -.09, 0], metal("#9ea3a1", .18), .02);
  tube(sink, [[0, 0, -.2], [0, .3, -.2], [0, .38, -.12], [0, .32, -.02]], .014, metal("#e4e6e4", .1));
  box(sink, [.04, .05, .04], [.12, .03, -.2], metal("#e4e6e4", .1), .01);
  lathe(sink, [[0, 0], [.035, 0], [.04, .14], [.03, .17], [0, .17]], [-.32, .01, -.16], new T.MeshPhysicalMaterial({ color: "#5a8f6a", roughness: .2, clearcoat: 1, transparent: true, opacity: .8 }), 20);
  // Gas stove, pressure cooker and the kettle that steams when you click it.
  const stove = place(root, [-2.6, .92, -2.82]);
  box(stove, [.72, .06, .5], [0, .03, 0], steel, .015);
  for (const x of [-.18, .18]) { cylinder(stove, .085, .09, .02, [x, .07, 0], metal("#1d1d1d", .5), 32); cylinder(stove, .045, .045, .02, [x, .085, 0], finishes.brass(), 24); }
  for (const x of [-.18, .18]) { const knob = cylinder(stove, .025, .025, .03, [x, .03, .26], metal("#1d1d1d", .4), 16); knob.rotation.x = Math.PI / 2; }
  const cooker = place(stove, [-.18, .1, 0]); lathe(cooker, [[0, 0], [.12, 0], [.125, .16], [.11, .17], [0, .17]], [0, 0, 0], metal("#c8ccca", .25), 32); cylinder(cooker, .02, .02, .05, [0, .19, 0], metal("#1d1d1d", .4), 12); box(cooker, [.24, .02, .03], [.2, .15, 0], metal("#1d1d1d", .4), .008);
  const kettle = interactive(place(stove, [.18, .1, 0]), "kettle", "Put the kettle on");
  lathe(kettle, [[0, 0], [.1, 0], [.11, .04], [.1, .13], [.05, .17], [.02, .18], [0, .18]], [0, 0, 0], new T.MeshPhysicalMaterial({ color: "#b4532a", roughness: .3, clearcoat: .9 }), 32);
  tube(kettle, [[.08, .06, 0], [.15, .12, 0], [.18, .17, 0]], .012, new T.MeshPhysicalMaterial({ color: "#b4532a", roughness: .3, clearcoat: .9 }));
  mesh(kettle, new T.TorusGeometry(.07, .01, 8, 24, Math.PI), [0, .17, 0], metal("#2a2622", .4));
  const steamMat = new T.SpriteMaterial({ map: steamTexture(), transparent: true, depthWrite: false, opacity: 0 });
  const puffs = Array.from({ length: 9 }, (_, i) => { const s = new T.Sprite(steamMat.clone()); s.position.set(.19, .2, 0); s.userData.seed = i / 9; kettle.add(s); return s; });
  // Chimney hood and upper cabinets; an open shelf of jars on the other side of the window.
  const hood = place(root, [-2.6, 0, -2.95]); box(hood, [.8, .14, .5], [0, 2.02, 0], steel, .02); box(hood, [.3, 1.6, .25], [0, 2.9, -.1], steel, .01);
  for (let i = 0; i < 4; i++) { const x = -3.55 + i * .66; if (Math.abs(x + 2.6) < .5) continue; box(root, [.64, .74, .35], [x, 2.42, -3.0], cabinet, .012); box(root, [.12, .016, .02], [x, 2.1, -2.82], finishes.brass(), .006); }
  for (const y of [1.88, 2.32]) box(root, [1.2, .035, .26], [2.3, y, -3.02], oak, .006);
  const jarGlass = new T.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: .3, roughness: .05 });
  [["#d9a441", .12], ["#7a4b2a", .1], ["#e8e1cf", .14], ["#b5352a", .09], ["#556b2f", .11]].forEach(([color, h], i) => { const jar = place(root, [1.85 + i * .22, i < 3 ? 1.9 : 2.34, -3.0]); cylinder(jar, .05, .05, h as number, [0, (h as number) / 2, 0], jarGlass, 20); cylinder(jar, .046, .046, (h as number) * .7, [0, (h as number) * .35, 0], new T.MeshStandardMaterial({ color: color as string, roughness: .9 }), 16); cylinder(jar, .052, .052, .02, [0, (h as number) + .01, 0], oak, 20); });
  box(root, [2.2, .018, .02], [-2.2, 1.72, -3.11], metal("#d6d8d6", .2), .008);
  for (let i = 0; i < 5; i++) { const x = -3.1 + i * .38; rod(root, [x, 1.72, -3.1], [x, 1.62, -3.08], .003, metal("#d6d8d6", .2)); if (i % 2) cylinder(root, .06, .06, .012, [x, 1.5, -3.06], metal("#c9ccc8", .2), 24).rotation.x = Math.PI / 2; else box(root, [.05, .2, .006], [x, 1.5, -3.07], oak, .004); }
  // Radio on the counter and a little herb pot by the sink.
  const radio = interactive(place(root, [2.35, .92, -2.88], -.15), "radio", "Turn on the radio");
  box(radio, [.32, .18, .12], [0, .09, 0], new T.MeshPhysicalMaterial({ color: "#d8cdb5", roughness: .4, clearcoat: .6 }), .03);
  const grille = mesh(radio, new T.CircleGeometry(.055, 32), [-.07, .09, .061], metal("#3a3d3b", .5)); grille.castShadow = false; box(radio, [.1, .05, .004], [.08, .11, .062], new T.MeshStandardMaterial({ color: "#2b2b2b" }), 0);
  const dial = new T.Mesh(new T.PlaneGeometry(.09, .04), emissive("#ffb86b", 1)); dial.position.set(.08, .11, .065); radio.add(dial);
  rod(radio, [.12, .18, 0], [.2, .45, -.04], .003, metal("#d6d8d6", .2));
  plant(root, [1.1, .92, -2.95], .5);
  bowlOfFruit(root, [-1.4, .92, -2.75]);
  // Fridge with magnets and a note.
  const fridge = place(root, [3.45, 0, -2.8]);
  const enamel = new T.MeshPhysicalMaterial({ color: "#e9e6de", roughness: .3, clearcoat: .8, clearcoatRoughness: .15 });
  box(fridge, [.74, 1.84, .68], [0, .93, 0], enamel, .04); box(fridge, [.7, .015, .02], [0, 1.28, .345], metal("#bdbab2", .3), 0);
  for (const y of [.75, 1.55]) box(fridge, [.03, .3, .04], [-.28, y, .36], metal("#cfd1cf", .2), .01);
  [["#b4532a", .1, 1.6], ["#2f4f43", .2, 1.42], ["#e0a526", -.05, 1.12], ["#7c90a8", .18, .95]].forEach(([color, x, y]) => box(fridge, [.05, .05, .015], [x as number, y as number, .348], ceramic(color as string, .3), .008));
  const note = interactive(place(fridge, [.08, 1.48, .346]), "contact", "A note on the fridge: say hello");
  box(note, [.18, .22, .003], [0, 0, 0], fabric("#f2e6b8", 1), 0); sign(note, "SAY HELLO", [0, .03, .003], .16, .045, "#f2e6b8", c.edge); sign(note, "dy3239073", [0, -.04, .003], .16, .03, "#f2e6b8", "#5a5040");
  // Dining set under two pendants.
  table(root, [.2, 0, 1.2], [1.4, .76, .85], oak, oak);
  for (const [x, z, turn] of [[-.25, .55, 0], [.65, .55, 0], [-.25, 1.85, Math.PI], [.65, 1.85, Math.PI]] as number[][]) chair(root, [x, 0, z], turn, oak, fabric("#e0a526", .9));
  for (const x of [-.25, .65]) { box(root, [.34, .004, .26], [x, .765, 1.2 + (x < 0 ? -.2 : .2)], fabric("#b4532a", .95), .001); lathe(root, [[0, 0], [.1, 0], [.12, .02], [0, .012]], [x, .768, 1.2 + (x < 0 ? -.2 : .2)], ceramic("#f1ece1", .25), 32); }
  lathe(root, [[0, 0], [.06, 0], [.07, .16], [.04, .22], [.045, .25], [0, .25]], [.2, .762, 1.2], new T.MeshPhysicalMaterial({ color: "#d9ecef", transparent: true, opacity: .35, roughness: .04 }), 32);
  mug(root, [.85, .762, 1.0], c.sage);
  for (const x of [-.1, .5]) pendant(root, [x, 4.36, 1.2], 1.55, "#2f4f43");
  // Tinkering bench: the orbit experiment lives here now, under a pegboard of tools.
  const bench = place(root, [3.6, 0, 1.9], -Math.PI / 2);
  box(bench, [.95, .05, .55], [0, .88, 0], oak, .01); for (const x of [-.42, .42]) for (const z of [-.22, .22]) rod(bench, [x, 0, z], [x, .86, z], .022, metal("#2a2622", .45));
  box(bench, [.85, .03, .45], [0, .3, 0], oak, .006);
  box(bench, [1.0, .7, .02], [0, 1.55, -.27], fabric("#d8cdb5", 1), 0);
  for (let i = 0; i < 6; i++) { const x = -.38 + i * .15; rod(bench, [x, 1.75, -.25], [x, 1.62 - (i % 3) * .06, -.24], .006, metal(i % 2 ? "#b4532a" : "#2a2622", .4)); }
  const experiment = interactive(place(bench, [0, .91, 0]), "lab", "Run the orbit experiment");
  cylinder(experiment, .2, .22, .05, [0, .025, 0], metal("#2a2622", .4), 40); rod(experiment, [0, .05, 0], [0, .3, 0], .008, finishes.brass());
  const sun = sphere(experiment, [.07, .07, .07], [0, .32, 0], emissive(c.amber, 2.2), 24);
  const orbit = group(experiment, [0, .32, 0]); orbit.userData.dynamic = true; mesh(orbit, new T.TorusGeometry(.18, .003, 8, 64), [0, 0, 0], finishes.brass()).rotation.x = Math.PI / 2;
  sphere(orbit, [.025, .025, .025], [.18, 0, 0], ceramic("#2d3a6b", .3), 16);
  box(bench, [.25, .04, .18], [-.3, .92, .1], fabric("#2f4f43", .9), .01); sign(bench, "EXPERIMENT 001", [-.3, .943, .1], .22, .05, "#2f4f43", c.cream).rotation.x = -Math.PI / 2;
  // Window blind and a mat by the sink.
  box(root, [2.2, .9, .02], [.4, 2.62, -3.06], fabric("#efe6d0", .95), 0); cylinder(root, .025, .025, 2.3, [.4, 3.08, -3.06], fabric("#efe6d0", .95), 16).rotation.z = Math.PI / 2;
  box(root, [.9, .012, .5], [.4, .03, -2.2], fabric("#6d7b55", 1), .004);
  return {
    root, camera: [0, 1.65, 0], target: [0, 1, 0], anchors: [],
    interact(action) { if (action === "radio") radioOn = !radioOn; if (action === "kettle") kettleUntil = performance.now() + 9000; },
    update(time, delta, options) {
      if (options.motion) orbit.rotation.y = time * .7;
      (dial.material as T.MeshBasicMaterial).color.setScalar(radioOn ? 2.2 : .25);
      (sun.material as T.MeshBasicMaterial).color.set(c.amber).multiplyScalar(options.motion ? 2 + Math.sin(time * 2) * .2 : 2);
      const steaming = options.motion && (performance.now() < kettleUntil || options.weather !== "day");
      for (const s of puffs) {
        const m = s.material as T.SpriteMaterial, life = (time * .35 + s.userData.seed) % 1;
        s.position.set(.19 + Math.sin(life * 6 + s.userData.seed * 9) * .03, .2 + life * .55, Math.cos(life * 5) * .02); s.scale.setScalar(.05 + life * .22);
        m.opacity = steaming ? Math.sin(life * Math.PI) * .38 : 0;
      }
    },
  };
}
