import * as T from "three";
import { type Area, colors as c, box, sphere, cylinder, group, sign, plant, interactive, tube, canvasTexture } from "./objects";
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
  // Four seats round the table: a click sits you on the nearest free one.
  const perches: NonNullable<Area["perches"]> = [];
  [[-.25, .55, 0], [.65, .55, 0], [-.25, 1.85, Math.PI], [.65, 1.85, Math.PI]].forEach(([x, z, turn], i) => perches.push({ id: `kitchen-${i}`, group: "kitchen", at: group(interactive(chair(root, [x, 0, z], turn, oak, fabric("#e0a526", .9)), "sit:kitchen", "Pull up a chair"), [0, .5, .02]) }));
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
  // ── The renovation ───────────────────────────────────────────────────────────────────────────────────────────
  // A mural over the dining table: an original anime-style twilight, painted in flat cel shading on the south wall.
  const mural = canvasTexture(ctx => {
    const W = 2048, H = 1024, rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#1b1f4a"); sky.addColorStop(.38, "#5a3a7a"); sky.addColorStop(.62, "#e0617a"); sky.addColorStop(.8, "#ffae6b"); sky.addColorStop(1, "#ffd9a0");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(255,255,240,${.3 + rnd() * .6})`; ctx.fillRect(rnd() * W, rnd() * H * .35, 2, 2); }
    // The comet, splitting in two, with long soft tails.
    for (const [dx, a] of [[0, .9], [40, .6]] as [number, number][]) { const g = ctx.createLinearGradient(380 + dx, 60, 980 + dx, 330); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, `rgba(220,240,255,${a})`); ctx.strokeStyle = g; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(380 + dx, 60); ctx.quadraticCurveTo(700 + dx, 160, 980 + dx, 330); ctx.stroke(); ctx.fillStyle = "#f4fbff"; ctx.beginPath(); ctx.arc(980 + dx, 330, 7, 0, Math.PI * 2); ctx.fill(); }
    // Towering cumulus with a lit rim and a shadow side: two flat tones, the way cel animation paints them.
    const cloud = (x: number, y: number, s: number) => { for (const [tone, off] of [["#f7b98a", 0], ["#c2758f", .22]] as [string, number][]) { ctx.fillStyle = tone; ctx.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI, r = s * (.45 + .25 * Math.sin(k * 2.3)); ctx.moveTo(x + Math.cos(a) * s * .9 + r, y - Math.sin(a) * s * .35 + off * s); ctx.arc(x + Math.cos(a) * s * .9, y - Math.sin(a) * s * .35 + off * s, r, 0, Math.PI * 2); } ctx.fill(); } };
    cloud(1500, 420, 260); cloud(300, 470, 170); cloud(1900, 500, 140);
    // City skyline with lit windows, a water tank and a passing train on the viaduct.
    const city = (base: number, tone: string, lit: number) => { let x = 0; while (x < W) { const w = 60 + rnd() * 120, h = 120 + rnd() * 260; ctx.fillStyle = tone; ctx.fillRect(x, base - h, w, h + 400); for (let wy = base - h + 16; wy < base - 10; wy += 22) for (let wx = x + 10; wx < x + w - 12; wx += 18) if (rnd() < lit) { ctx.fillStyle = rnd() < .5 ? "#ffd27a" : "#fff0c2"; ctx.fillRect(wx, wy, 8, 11); } if (rnd() < .2) { ctx.fillStyle = tone; ctx.fillRect(x + w * .3, base - h - 40, 34, 40); } x += w + 4; } };
    city(840, "#3a2a55", .18); city(930, "#22183a", .32);
    ctx.fillStyle = "#170f28"; ctx.fillRect(0, 900, W, 26); for (let x = 30; x < W; x += 160) ctx.fillRect(x, 926, 20, 100);
    ctx.fillStyle = "#e8e2d8"; ctx.fillRect(1180, 868, 520, 32); ctx.fillStyle = "#ffd27a"; for (let x = 1196; x < 1690; x += 40) ctx.fillRect(x, 876, 26, 12); ctx.fillStyle = "#b8232a"; ctx.fillRect(1180, 894, 520, 5);
    // Power lines: the poles and the sagging wires every summer evening has.
    ctx.strokeStyle = "#120a1f"; ctx.lineWidth = 5; for (const x of [140, 1820]) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x, 330); ctx.stroke(); ctx.fillStyle = "#120a1f"; ctx.fillRect(x - 70, 360, 140, 8); ctx.fillRect(x - 50, 400, 100, 6); }
    ctx.lineWidth = 2.5; for (const y of [364, 372, 402]) { ctx.beginPath(); ctx.moveTo(140, y); ctx.quadraticCurveTo(980, y + 120, 1820, y); ctx.stroke(); }
    // Foreground rooftop: a railing, the girl looking up at the comet (hair and scarf in the wind), and her cat.
    ctx.fillStyle = "#120a1f"; ctx.fillRect(0, 960, W, 64); for (let x = 1000; x < 1700; x += 44) ctx.fillRect(x, 880, 6, 90); ctx.fillRect(990, 878, 720, 8);
    ctx.save(); ctx.translate(1340, 960); ctx.fillStyle = "#120a1f";
    ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-18, -120); ctx.lineTo(-30, -150); ctx.lineTo(-26, -235); ctx.quadraticCurveTo(0, -260, 26, -235); ctx.lineTo(30, -150); ctx.lineTo(18, -120); ctx.lineTo(22, 0); ctx.closePath(); ctx.fill(); // body and skirt
    ctx.beginPath(); ctx.ellipse(0, -270, 26, 30, -.2, 0, Math.PI * 2); ctx.fill(); // head, tilted up
    ctx.beginPath(); ctx.moveTo(-14, -292); ctx.bezierCurveTo(-90, -300, -150, -250, -190, -210); ctx.bezierCurveTo(-130, -235, -80, -250, -18, -255); ctx.fill(); // hair streaming in the wind
    ctx.beginPath(); ctx.moveTo(-10, -238); ctx.bezierCurveTo(-60, -230, -110, -200, -150, -175); ctx.lineTo(-140, -165); ctx.bezierCurveTo(-100, -190, -60, -212, -8, -225); ctx.fill(); // scarf
    ctx.beginPath(); ctx.moveTo(24, -225); ctx.lineTo(70, -300); ctx.lineTo(80, -296); ctx.lineTo(36, -215); ctx.fill(); // arm raised, pointing at the comet
    ctx.translate(90, 0); ctx.beginPath(); ctx.ellipse(0, -18, 26, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(24, -40, 13, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(16, -50); ctx.lineTo(20, -64); ctx.lineTo(26, -52); ctx.moveTo(28, -52); ctx.lineTo(34, -64); ctx.lineTo(36, -50); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = "#120a1f"; ctx.beginPath(); ctx.moveTo(-24, -14); ctx.quadraticCurveTo(-52, -40, -40, -66); ctx.stroke();
    ctx.restore();
    // Cherry blossom: a branch reaching in from the top left, and petals drifting across.
    ctx.strokeStyle = "#3a1e2a"; ctx.lineWidth = 16; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-20, 120); ctx.quadraticCurveTo(220, 140, 420, 250); ctx.stroke(); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(200, 140); ctx.quadraticCurveTo(260, 60, 360, 40); ctx.stroke();
    for (let i = 0; i < 140; i++) { const t = rnd(), x = -20 + t * 440 + (rnd() - .5) * 110, y = 120 + t * 130 - (rnd() - .2) * 90; ctx.fillStyle = rnd() < .5 ? "#ffc4d6" : "#ff9fbf"; ctx.beginPath(); ctx.arc(x, y, 9 + rnd() * 9, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 60; i++) { ctx.fillStyle = "rgba(255,190,210,.85)"; ctx.beginPath(); ctx.ellipse(rnd() * W, rnd() * H * .9, 7, 4, rnd() * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "rgba(255,240,220,.9)"; ctx.font = "600 34px serif"; ctx.textAlign = "right"; ctx.fillText("ほうき星の夜 · the night of the comet", 2000, 1000);
  }, 2048, 1024);
  mural.colorSpace = T.SRGBColorSpace; mural.anisotropy = 8;
  const muralWall = new T.Mesh(new T.PlaneGeometry(4.3, 2.15), new T.MeshStandardMaterial({ map: mural, roughness: .82 }));
  muralWall.position.set(-.9, 2.25, 3.13); muralWall.rotation.y = Math.PI; muralWall.receiveShadow = true; root.add(muralWall);
  box(root, [4.4, .03, .05], [-.9, 3.4, 3.12], metal("#2a2622", .45), .01); box(root, [3.4, .025, .04], [-.9, 3.37, 3.08], emissive("#ffe2b8", 1.6), 0); // picture light
  // Small appliances on the counter: a microwave, a toaster and the mixer-grinder.
  const microwave = place(root, [-.8, .92, -2.9]); box(microwave, [.5, .3, .36], [0, .15, 0], new T.MeshPhysicalMaterial({ color: "#2a2826", roughness: .35, clearcoat: .6 }), .02);
  box(microwave, [.32, .22, .01], [-.06, .16, .181], new T.MeshPhysicalMaterial({ color: "#0d0f10", roughness: .05, clearcoat: 1 }), .006); box(microwave, [.08, .2, .01], [.18, .16, .181], metal("#9ea3a1", .25), .004);
  const clockText = new T.Mesh(new T.PlaneGeometry(.06, .025), emissive("#7fe0a0", 1.4)); clockText.position.set(.18, .24, .187); microwave.add(clockText);
  const toaster = place(root, [1.65, .92, -2.95]); box(toaster, [.26, .18, .16], [0, .09, 0], metal("#c9ccc8", .2), .03); for (const x of [-.05, .05]) box(toaster, [.03, .01, .11], [x, .181, 0], new T.MeshStandardMaterial({ color: "#151515" }), .002);
  const mixie = place(root, [-1.95, .92, -2.95]); box(mixie, [.2, .14, .2], [0, .07, 0], new T.MeshPhysicalMaterial({ color: "#f1ece1", roughness: .4, clearcoat: .5 }), .03);
  cylinder(mixie, .07, .085, .2, [0, .24, 0], new T.MeshPhysicalMaterial({ color: "#c9d6d8", transparent: true, opacity: .45, roughness: .08 }), 24); cylinder(mixie, .075, .075, .03, [0, .355, 0], new T.MeshStandardMaterial({ color: "#2a2826" }), 24);
  // Warm LED strips under the upper cabinets light the counter.
  for (let i = 0; i < 4; i++) { const x = -3.55 + i * .66; if (Math.abs(x + 2.6) < .5) continue; box(root, [.56, .012, .025], [x, 2.045, -2.88], emissive("#ffd9a0", 2), 0); }
  // Chalkboard menu by the fridge, and a runner rug along the counter.
  const menu = canvasTexture(ctx => { ctx.fillStyle = "#26302b"; ctx.fillRect(0, 0, 512, 640); ctx.strokeStyle = "#7b4a2b"; ctx.lineWidth = 22; ctx.strokeRect(0, 0, 512, 640); ctx.fillStyle = "#f1eadb"; ctx.textAlign = "center";
    ctx.font = "italic 600 52px Georgia, serif"; ctx.fillText("Aaj ka menu", 256, 96); ctx.font = "400 34px Georgia, serif"; ["masala chai", "poha with sev", "aloo paratha", "maggi (after midnight)", "mango, if lucky"].forEach((l, i) => ctx.fillText(l, 256, 190 + i * 70));
    ctx.font = "400 26px monospace"; ctx.fillStyle = "#e0a526"; ctx.fillText("~ ship it, then snack ~", 256, 590); }, 512, 640);
  const board = new T.Mesh(new T.PlaneGeometry(.62, .78), new T.MeshStandardMaterial({ map: menu, roughness: .9 })); board.position.set(3.88, 1.62, -1.25); board.rotation.y = -Math.PI / 2; root.add(board);
  box(root, [3.6, .008, .7], [-1.3, .006, -2.15], fabric("#9a4522", 1), .002); for (const z of [-2.45, -1.85]) box(root, [3.6, .009, .05], [-1.3, .007, z], fabric("#e0a526", 1), .002);
  // A wall clock over the doorway side.
  const wallClock = place(root, [-3.88, 2.75, -1.2], Math.PI / 2); cylinder(wallClock, .2, .2, .04, [0, 0, 0], new T.MeshStandardMaterial({ color: "#f1eadb", roughness: .5 }), 40).rotation.x = Math.PI / 2;
  mesh(wallClock, new T.TorusGeometry(.2, .018, 10, 48), [0, 0, .01], metal("#b4532a", .4));
  const hourHand = group(wallClock, [0, 0, .026]), minuteHand = group(wallClock, [0, 0, .028]); hourHand.userData.dynamic = minuteHand.userData.dynamic = true;
  box(hourHand, [.016, .11, .004], [0, .045, 0], new T.MeshStandardMaterial({ color: "#1f1a17" }), 0); box(minuteHand, [.01, .16, .004], [0, .07, 0], new T.MeshStandardMaterial({ color: "#1f1a17" }), 0);
  return {
    root, camera: [0, 1.65, 0], target: [0, 1, 0], anchors: [], perches,
    interact(action) { if (action === "radio") radioOn = !radioOn; if (action === "kettle") kettleUntil = performance.now() + 9000; },
    update(time, delta, options) {
      if (options.motion) orbit.rotation.y = time * .7;
      { const now = new Date(), m = now.getMinutes() + now.getSeconds() / 60; minuteHand.rotation.z = -m / 60 * Math.PI * 2; hourHand.rotation.z = -((now.getHours() % 12) + m / 60) / 12 * Math.PI * 2; } // real time
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
