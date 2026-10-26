import * as T from "three";
import { projects } from "./content";
import { type Area, colors as c, box, sphere, cylinder, group, sign, plant, interactive, canvasTexture } from "./objects";
import { fabric, ceramic, metal, emissive, surface, geoRug } from "./materials";
import { sofa, armchair, table, rug, arcLamp, ceilingFan, frame, curtains, mug, bowlOfFruit, vase, books, place, mesh, lathe, cushion, finishes } from "./furniture";

// Project posters drawn as typographic prints, so every project has artwork even without a screenshot.
function poster(name: string, tagline: string, category: string, background: string, ink: string, accent: string) {
  return canvasTexture(ctx => {
    ctx.fillStyle = background; ctx.fillRect(0, 0, 600, 800);
    ctx.strokeStyle = accent; ctx.globalAlpha = .55; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(380, 330, 60 + i * 34, 30 + i * 22, -.5, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(380, 330, 26, 0, 7); ctx.fill();
    ctx.fillStyle = ink; ctx.font = "500 22px Helvetica, Arial"; ctx.fillText(category, 44, 70);
    ctx.font = "700 92px Helvetica, Arial"; ctx.fillText(name, 40, 640, 520);
    ctx.font = "400 26px Helvetica, Arial"; ctx.fillText(tagline, 44, 700, 520);
    ctx.fillRect(44, 740, 80, 4);
  }, 600, 800);
}

export function createLiving(): Area {
  const root = new T.Group(); let alive = true, catUntil = 0, clockAt = 0;
  const oak = finishes.oak(), walnut = finishes.walnut();
  rug(root, [1.0, 0, -1.5], [3.2, 2.5], "#ffffff", geoRug("#1d5566", "#d8a93a", "#d0602f", "#5f9fae"));
  // The sofa seats three, friends included: a click sits you on the nearest free cushion.
  const couch = interactive(sofa(root, [-.4, 0, -1.5], Math.PI / 2, "#2d3a6b", 2.4), "sit:sofa", "Sit on the sofa");
  const perches = [-.68, 0, .68].map((x, i) => ({ id: `sofa-${i}`, group: "sofa", at: group(couch, [x, .52, .12]) }));
  const throwBlanket = mesh(root, cushion(.5, .035, .55, .25, .006, .015), [-.2, .585, -2.2], fabric("#c9a43a", .95)); throwBlanket.rotation.y = .18;
  // Jewel-toned cushions against the navy: emerald, coral and lacquer red.
  for (const [z, color] of [[-2.35, "#1f6b4a"], [-1.5, "#d9786a"], [-.7, "#b8232a"]] as [number, string][]) mesh(root, cushion(.42, .14, .42, .95, 0, .05), [-.55, .74, z], fabric(color, .95)).rotation.set(0, z < -1 ? .2 : -.15, Math.PI / 2 + .32);
  // Coffee table with an everyday clutter of magazines, a mug, fruit and the portfolio book.
  table(root, [1.4, 0, -1.5], [.62, .42, 1.12], oak, walnut);
  const book = interactive(place(root, [1.35, .42, -1.85], .2), "projects", "Flip through the portfolio book");
  box(book, [.24, .035, .32], [0, .018, 0], fabric("#2f4f43", .9), .006); box(book, [.22, .03, .3], [.006, .016, 0], fabric("#efe7d4", .95), 0); sign(book, "SELECTED WORK", [0, .037, 0], .2, .05, "#2f4f43", c.cream).rotation.x = -Math.PI / 2;
  for (let i = 0; i < 3; i++) { const m = box(root, [.22, .008, .29], [1.48, .425 + i * .009, -1.15], fabric(["#e0a526", "#e2d6bd", "#7c90a8"][i], .9), .003); m.rotation.y = .3 - i * .25; }
  mug(root, [1.55, .42, -1.45]); bowlOfFruit(root, [1.3, .42, -1.2]);
  box(root, [.05, .015, .16], [1.55, .43, -2.05], new T.MeshStandardMaterial({ color: "#1d1f1f", roughness: .5 }), .008);
  // Media wall: a low walnut console and a TV that cycles through the projects.
  const tvUnit = place(root, [3.75, 0, -1.5], -Math.PI / 2);
  box(tvUnit, [2.4, .42, .45], [0, .3, 0], walnut, .02); for (const x of [-.6, .6]) box(tvUnit, [1.16, .38, .01], [x, .3, .226], surface("#5a3c2c"), .006);
  for (const x of [-1.1, 1.1]) for (const z of [-.18, .18]) cylinder(tvUnit, .02, .015, .09, [x, .045, z], metal("#2a2622", .45), 12);
  const tv = interactive(place(tvUnit, [0, 1.25, -.12]), "projects", "Watch the project reel");
  box(tv, [1.42, .82, .035], [0, 0, 0], new T.MeshPhysicalMaterial({ color: "#121414", roughness: .3, clearcoat: .8 }), .01);
  let reelIndex = -1, reelAt = 0;
  const reel = canvasTexture(() => { }, 1024, 576);
  const screen = new T.Mesh(new T.PlaneGeometry(1.38, .78), new T.MeshBasicMaterial({ map: reel, color: new T.Color(1.15, 1.15, 1.15) })); screen.position.z = .019; tv.add(screen);
  function drawReel(i: number) {
    const p = projects[i], ctx = (reel.image as HTMLCanvasElement).getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 1024, 576); g.addColorStop(0, ["#1d2b28", "#2b2620", "#1f2633", "#2a1f22"][i % 4]); g.addColorStop(1, "#0f1513"); ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 576);
    ctx.strokeStyle = "rgba(229,214,184,.18)"; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(760, 260, 60 + k * 40, 0, 7); ctx.stroke(); }
    ctx.fillStyle = "#c2b191"; ctx.font = "500 22px monospace"; ctx.fillText(`0${i + 1} / 04  ·  ${p.category}`, 60, 80);
    ctx.fillStyle = "#f1eadb"; ctx.font = "600 96px Helvetica, Arial"; ctx.fillText(p.name, 56, 330);
    ctx.font = "400 30px Helvetica, Arial"; ctx.fillStyle = "#d8ccb5"; ctx.fillText(p.tagline, 60, 390, 880);
    ctx.font = "500 20px monospace"; ctx.fillStyle = "#e0a526"; ctx.fillText(p.stack.join("  ·  "), 60, 470);
    ctx.fillStyle = "rgba(240,234,220,.5)"; ctx.fillRect(60, 520, 904, 3); ctx.fillStyle = "#e0a526"; ctx.fillRect(60, 520, 904 * ((i + 1) / projects.length), 3);
    reel.needsUpdate = true;
  }
  box(tvUnit, [.9, .07, .1], [0, .56, .1], new T.MeshStandardMaterial({ color: "#1b1d1d", roughness: .5 }), .02);
  plant(tvUnit, [-1.0, .51, 0], .7); vase(tvUnit, [.95, .51, .05], "#c8bfae");
  books(tvUnit, [.45, .51, .02], .32, 4).forEach(b => { b.rotation.z = Math.PI / 2; b.position.y = .04; });
  // Reading corner and the household cat, asleep where the afternoon light lands.
  armchair(root, [-2.9, 0, -2.4], 1.04, "#a4502b"); // cognac
  const cat = interactive(place(root, [-2.88, .54, -2.35], .6), "cat", "Pet Mishti, the cat");
  const fur = new T.MeshPhysicalMaterial({ color: "#c98a4b", roughness: .9, sheen: 1, sheenColor: "#f3cf9a", sheenRoughness: .5 });
  const body = sphere(cat, [.2, .1, .15], [0, .09, 0], fur); sphere(cat, [.085, .075, .08], [.17, .1, .06], fur);
  for (const z of [.02, .1]) { const ear = mesh(cat, new T.ConeGeometry(.03, .05, 4), [.19, .17, z], fur); ear.rotation.z = -.2; }
  const tail = mesh(cat, new T.TorusGeometry(.14, .022, 8, 24, Math.PI * 1.1), [-.02, .04, .02], fur); tail.rotation.set(Math.PI / 2, 0, 1.2);
  for (const z of [.035, .085]) box(cat, [.012, .004, .02], [.245, .11, z], new T.MeshStandardMaterial({ color: "#2a1d14" }), 0);
  // Entry console: mirror, keys and a framed photo.
  const consoleTable = place(root, [-3.78, 0, -1.4], Math.PI / 2);
  box(consoleTable, [1.2, .04, .34], [0, .8, 0], oak, .01); for (const x of [-.55, .55]) for (const z of [-.13, .13]) cylinder(consoleTable, .015, .015, .78, [x, .39, z], metal("#2a2622", .45), 10); box(consoleTable, [1.1, .02, .3], [0, .2, 0], oak, .005);
  const mirrorTarget = new T.WebGLCubeRenderTarget(256, { type: T.HalfFloatType }), mirrorCamera = new T.CubeCamera(.05, 30, mirrorTarget); mirrorCamera.children.forEach(c => c.layers.enable(1));
  const mirror = mesh(consoleTable, new T.CircleGeometry(.42, 48), [0, 1.55, -.11], new T.MeshPhysicalMaterial({ color: "#ffffff", metalness: 1, roughness: .04, envMapIntensity: 2.6 })); mirror.castShadow = false;
  mesh(consoleTable, new T.TorusGeometry(.43, .018, 12, 64), [0, 1.55, -.11], finishes.brass());
  lathe(consoleTable, [[0, 0], [.1, 0], [.12, .04], [.1, .045], [.0, .02]], [-.35, .82, 0], ceramic("#2f4f43", .3));
  for (const x of [-.33, -.37]) box(consoleTable, [.05, .004, .02], [x, .86, .01], finishes.brass(), .002);
  // A red lacquer gourd lamp under an emerald drum shade.
  lathe(consoleTable, [[0, 0], [.07, 0], [.08, .03], [.05, .08], [.09, .16], [.06, .26], [.1, .34], [.04, .44], [.015, .47], [0, .47]], [-.02, .82, .02], ceramic("#b8232a", .18), 32);
  const shade = fabric("#1f6b4a", .9); shade.side = T.DoubleSide; shade.emissive = new T.Color("#ffb766"); shade.emissiveIntensity = .25; cylinder(consoleTable, .13, .17, .22, [-.02, 1.39, .02], shade, 40).castShadow = false;
  const photo = interactive(place(consoleTable, [.3, .82, -.04], -.2), "about", "A family photo");
  const snapshot = frame(photo, [0, .12, 0], 0, .2, .26, "#9a8a70", walnut); snapshot.group.rotation.x = -.12;
  new T.TextureLoader().load("/images/about-anime.jpg", map => { if (!alive) { map.dispose(); return; } map.colorSpace = T.SRGBColorSpace; const m = snapshot.picture.material as T.MeshStandardMaterial; m.map = map; m.color.set("#fff"); m.needsUpdate = true; });
  for (const z of [-.12, .05]) { const shoe = box(consoleTable, [.11, .07, .27], [.2 + z, .25, .02], fabric(z < 0 ? "#3b3f3c" : "#e6e1d6", .9), .03); shoe.rotation.y = z * 2; }
  // Gallery wall: one framed poster per project. Each opens that project.
  const art = [
    poster("ImpactHub", "Technology that shows up when it matters.", "FULL-STACK / AI", "#2d3a6b", "#f1eadb", "#e0a526"),
    poster("Neatify", "Less searching. More doing.", "DESKTOP / AUTOMATION", "#e3d6bc", "#1f1a17", "#2f4f43"),
    poster("Gurukul", "A little more connected.", "MOBILE / EDUCATION", "#efe4cf", "#3a2d22", "#b4532a"),
    poster("Demox", "Motion with a point of view.", "CREATIVE DEV / 3D", "#1f1a17", "#f1eadb", "#e0a526"),
  ];
  projects.forEach((p, i) => {
    const x = [3.0, 1.75, -1.75, -3.0][i];
    const hang = interactive(place(root, [x, 1.85, 3.12], Math.PI), `project:${p.type}`, `${p.name} · open the project`);
    frame(hang, [0, 0, 0], 0, .86, 1.16, art[i], i % 2 ? oak : walnut);
    box(hang, [.36, .025, .05], [0, .66, .06], finishes.brass(), .008);
    const glow = new T.Mesh(new T.PlaneGeometry(.7, .14), emissive("#ffd9a0", .6)); glow.position.set(0, .64, .085); glow.rotation.x = .5; glow.visible = false; hang.add(glow);
  });
  // Window dressing, light and air.
  const drapes = curtains(root, [0, 2.07, -3.02], 3.2, 2.7, 0, "#c4a13f"); // mustard
  const fan = ceilingFan(root, [.6, 4.36, -1.0]);
  // The arc lamp stands at the sofa's end and throws a real pool of light over the seat.
  const lamp = arcLamp(root, [-.35, 0, -.02], Math.PI / 2);
  const reading = new T.PointLight(c.amber, 2.4, 3.2, 2); reading.position.set(-.25, 1.62, -1.22); root.add(reading);
  plant(root, [2.3, 0, -2.85], 1.9); plant(root, [-3.4, 0, 2.75], 1.6);
  const clock = place(root, [2.75, 2.75, -3.13]); cylinder(clock, .23, .23, .03, [0, 0, 0], new T.MeshStandardMaterial({ color: "#f2ede2", roughness: .6 }), 48).rotation.x = Math.PI / 2; mesh(clock, new T.TorusGeometry(.23, .015, 10, 48), [0, 0, 0], walnut);
  const hourHand = box(clock, [.012, .1, .004], [0, .04, .02], new T.MeshStandardMaterial({ color: "#222" }), 0), minuteHand = box(clock, [.008, .16, .004], [0, .07, .024], new T.MeshStandardMaterial({ color: "#222" }), 0);
  for (const hand of [hourHand, minuteHand]) { hand.geometry.translate(0, hand.position.y, 0); hand.position.y = 0; hand.userData.dynamic = true; }
  return {
    root, camera: [9, 7.8, 11], target: [0, 1.2, 0], anchors: [], perches,
    interact(action) { if (action === "cat") catUntil = performance.now() + 2600; },
    update(time, delta, options) {
      if (options.motion) fan.blades.rotation.y -= delta * 4.4 * (options.fan ?? 1);
      body.scale.y = .1 * (1 + (options.motion ? Math.sin(time * 1.6) * .05 : 0)); const flick = Math.sin(time * .7) > .97; tail.rotation.z = 1.2 + (options.motion && (performance.now() < catUntil || flick) ? Math.sin(time * 8) * .25 : 0);
      drapes.forEach((m, i) => m.rotation.y = options.motion ? Math.sin(time * .5 + i) * .04 : 0);
      (lamp.bulb.material as T.MeshBasicMaterial).color.setScalar(options.weather === "day" ? 1.2 : 2.6); reading.intensity = options.weather === "day" ? .8 : 2.4;
      if (time - reelAt > 4.5 || reelIndex < 0) { reelAt = time; reelIndex = (reelIndex + 1) % projects.length; drawReel(reelIndex); }
      if (time - clockAt < 1 && clockAt) return; clockAt = time || .001;
      const now = new Date();
      minuteHand.rotation.z = -now.getMinutes() / 60 * Math.PI * 2; hourHand.rotation.z = -(now.getHours() % 12 + now.getMinutes() / 60) / 12 * Math.PI * 2;
    },
    // The mirror reflects the real room: a cube camera captures it from the mirror's position.
    bake(renderer, scene) { mirror.visible = false; mirror.getWorldPosition(mirrorCamera.position); mirrorCamera.position.x += .2; mirrorCamera.update(renderer, scene); mirror.visible = true; const m = mirror.material as T.MeshPhysicalMaterial; m.envMap = mirrorTarget.texture; m.envMapIntensity = 1; m.needsUpdate = true; },
    dispose() { alive = false; mirrorTarget.dispose(); },
  };
}
