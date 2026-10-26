import * as T from "three";
import { skills, profile, experience } from "./content";
import { type Area, colors as c, box, sphere, cylinder, group, sign, plant, interactive, canvasTexture, batchScenery } from "./objects";
import { fabric, ceramic, metal, emissive, geoRug } from "./materials";
import { Cloth } from "./cloth";
import { table, chair, armchair, rug, curtains, pendant, frame, books, mug, place, mesh, lathe, rod, finishes } from "./furniture";

// A simple earth for the globe: ocean, soft continents, a graticule.
function earth() {
  return canvasTexture(ctx => {
    ctx.fillStyle = "#3c6e8a"; ctx.fillRect(0, 0, 1024, 512);
    const land = [[180, 150, 120, 80], [250, 330, 70, 110], [520, 140, 90, 70], [560, 280, 80, 110], [700, 160, 170, 90], [830, 360, 60, 40], [470, 90, 60, 40]];
    for (const [x, y, w, h] of land) { ctx.fillStyle = "#c9b98a"; ctx.beginPath(); for (let a = 0; a < 6.3; a += .3) { const r = 1 + Math.sin(a * 3 + x) * .22 + Math.cos(a * 5 + y) * .12; ctx.lineTo(x + Math.cos(a) * w * r, y + Math.sin(a) * h * r); } ctx.fill(); }
    ctx.strokeStyle = "rgba(255,255,255,.25)"; for (let x = 0; x < 1024; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke(); } for (let y = 0; y < 512; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }
  }, 1024, 512);
}

export function createStudy(): Area {
  const root = new T.Group(); let alive = true, open = 0, opening = 0;
  const walnut = finishes.walnut(), oak = finishes.oak();
  rug(root, [0, 0, -.2], [2.8, 3.4], "#ffffff", geoRug("#235f68", "#d6a640", "#d4673a", "#8fbfc4"));
  // Built-in library wall. Two eye-level shelves hold the skills, labelled on their spines. The middle two bays are
  // sliding panels: when a member signs in they part from the centre to either side, showing the hidden door.
  const shelf = place(root, [-3.7, 0, 0], Math.PI / 2), loose: T.Object3D[] = [];
  const levels = [.08, .52, .96, 1.4, 1.84, 2.28, 2.6];
  const leaves = [-1, 1].map(side => {
    box(shelf, [1.45, 2.6, .04], [side * 2.175, 1.3, -.17], walnut, 0);
    for (const x of [1.45, 2.9]) box(shelf, [.04, 2.6, .38], [side * x, 1.3, 0], walnut, .006);
    for (const y of levels) box(shelf, [1.47, .035, .38], [side * 2.185, y, 0], walnut, .006);
    // The panel, from its outer front corner: a back, a stile where the two meet, and its own boards.
    const leaf = group(shelf, [side * 1.45, 0, .19]); leaf.userData.noCollide = true;
    box(leaf, [1.41, 2.6, .04], [-side * .725, 1.3, -.36], walnut, 0); box(leaf, [.02, 2.6, .38], [-side * 1.44, 1.3, -.19], walnut, .004);
    for (const y of levels) box(leaf, [1.39, .035, .38], [-side * .735, y, -.19], walnut, .006);
    return leaf;
  });
  // A small brass button on the inside of the right-hand wall, at hand height, where only someone who knows would look.
  const button = interactive(group(shelf, [2.88, levels[2] + .2, .07]), "secret", "A small brass button");
  box(button, [.008, .13, .09], [-.004, 0, 0], finishes.brass(), .003); cylinder(button, .018, .02, .016, [-.012, 0, 0], metal("#c9a45c", .25), 24).rotation.z = Math.PI / 2;
  const skillPalette = [c.rust, "#2f4f43", "#c9a75a", "#4a5a7a", "#6d7b55", "#e2d6bd", "#7a4b3a"];
  skills.forEach((skill, i) => {
    const row = i < 7 ? 3 : 4, slot = i % 7, x = -2.75 + slot * .78, h = .32 + (i % 3) * .03;
    const b = interactive(group(shelf, [x, levels[row] + .018 + h / 2, .02]), `skill:${skill}`, skill); loose.push(b);
    const cover = skillPalette[i % skillPalette.length]; box(b, [.075, h, .24], [0, 0, 0], new T.MeshStandardMaterial({ color: cover, roughness: .65 }), .006);
    sign(b, skill, [0, 0, .121], .2, .045, cover, i % 7 === 5 ? c.edge : c.cream).rotation.z = Math.PI / 2;
    box(b, [.068, .004, .22], [0, h / 2 + .002, -.004], new T.MeshStandardMaterial({ color: "#efe7d4" }), 0);
    loose.push(...books(shelf, [x + .05, levels[row] + .018, .02], .62, i));
  });
  for (const [row, seed] of [[0, 2], [1, 5], [2, 8], [5, 11]]) for (let bay = 0; bay < 4; bay++) loose.push(...books(shelf, [-2.86 + bay * 1.45, levels[row] + .018, .02], bay === 1 && row === 2 ? .7 : bay === 3 && row === 2 ? 1 : 1.36, seed + bay));
  loose.push(plant(shelf, [-.7, levels[4] + .02, .1], .45)); sphere(shelf, [.07, .07, .07], [2.2, levels[4] + .09, 0], ceramic("#e0a526", .25), 24);
  // Whatever stands in the middle bays rides on its panel; each panel's scenery is merged before it is marked as moving.
  root.updateMatrixWorld(true); const spot = new T.Vector3();
  // Books straddling the seam or a panel's outer edge would poke out of an open panel, so they come off the shelf (never drawn, nothing to free).
  for (const item of loose) {
    shelf.worldToLocal(item.getWorldPosition(spot)); const x = Math.abs(spot.x);
    if (x < .06 || (x > 1.39 && x < 1.51)) item.removeFromParent(); else if (x < 1.45) leaves[spot.x < 0 ? 0 : 1].attach(item);
  }
  for (const leaf of leaves) { batchScenery(leaf); leaf.userData.dynamic = true; }
  // Writing desk under the window: open laptop, the journal, a letter, a lamp.
  table(root, [0, 0, 2.85], [1.6, .76, .7], oak, walnut);
  const perches: NonNullable<Area["perches"]> = [{ id: "study-desk", group: "study-desk", at: group(interactive(chair(root, [0, 0, 2.2], 0, oak, fabric("#2f4f43", .9)), "sit:study-desk", "Sit at the writing desk"), [0, .5, .02]) }];
  const laptop = interactive(place(root, [.05, .76, 2.85], Math.PI), "laptop", "Sit down and use the laptop"); const alu = metal("#b9bcb8", .3);
  box(laptop, [.34, .012, .24], [0, .006, 0], alu, .006); const lid = group(laptop, [0, .012, -.12]); lid.rotation.x = -.35; box(lid, [.34, .24, .008], [0, .12, 0], alu, .006);
  const code = canvasTexture(ctx => { ctx.fillStyle = "#1e1a17"; ctx.fillRect(0, 0, 512, 360); ctx.font = "16px monospace"; ["export function Home() {", "  return <World", "    rooms={5}", "    weather=\"rain\"", "    curious", "  />;", "}", "", "// keep making things_"].forEach((line, i) => { ctx.fillStyle = i > 7 ? "#d6ae73" : "#e3d6bc"; ctx.fillText(line, 24, 40 + i * 30); }); }, 512, 360);
  const screen = new T.Mesh(new T.PlaneGeometry(.31, .21), new T.MeshBasicMaterial({ map: code, color: new T.Color(1.1, 1.1, 1.1) })); screen.position.set(0, .12, .005); lid.add(screen);
  const journal = interactive(place(root, [-.5, .76, 2.75], .25), "experience", "Read the journal · experience");
  box(journal, [.24, .03, .32], [0, .015, 0], fabric(c.rust, .9), .006); box(journal, [.22, .025, .3], [.006, .013, 0], fabric("#efe7d4", .95), 0); sign(journal, "FIELD NOTES", [0, .031, 0], .2, .05, c.rust, c.cream).rotation.x = -Math.PI / 2;
  const letter = interactive(place(root, [.5, .762, 2.7], -.3), "about", "A letter from Deepanshu");
  box(letter, [.22, .003, .3], [0, 0, 0], fabric("#f4ecd8", 1), 0); sign(letter, "hello, world", [0, .003, -.05], .18, .05, "#f4ecd8", "#5a5040").rotation.x = -Math.PI / 2;
  mug(root, [.65, .76, 3.0]);
  const pens = place(root, [-.68, .76, 3.02]); lathe(pens, [[0, 0], [.04, 0], [.04, .1], [.036, .1], [.036, .006], [0, .006]], [0, 0, 0], ceramic("#2f4f43", .4), 24); for (let i = 0; i < 4; i++) rod(pens, [0, .02, 0], [Math.cos(i * 1.6) * .03, .16 + i * .01, Math.sin(i * 1.6) * .03], .004, new T.MeshStandardMaterial({ color: ["#b4532a", "#222", "#e0a526", "#7c90a8"][i] }), 8);
  const deskLamp = place(root, [.72, .76, 3.05]); cylinder(deskLamp, .07, .08, .02, [0, .01, 0], finishes.brass(), 24); rod(deskLamp, [0, .02, 0], [0, .38, 0], .008, finishes.brass());
  lathe(deskLamp, [[.02, 0], [.06, -.01], [.1, -.12]], [0, .42, 0], new T.MeshPhysicalMaterial({ color: "#2f4f43", roughness: .35, clearcoat: .6, side: T.DoubleSide }), 32);
  const deskBulb = sphere(deskLamp, [.03, .03, .03], [0, .36, 0], emissive(c.amber, 3), 16);
  const drapes = curtains(root, [0, 1.98, 3.08], 2.8, 2.5, Math.PI, "#8fb3a3").map(panel => new Cloth(panel, 28, 14));
  // Reading corner: armchair, side table, a lamp and a stack of books.
  perches.push({ id: "study-armchair", group: "study-armchair", at: group(interactive(armchair(root, [2.9, 0, -2.2], -.75, "#9cbcae"), "sit:study-armchair", "Sink into the reading chair"), [0, .5, .06]) }); // sage velvet
  table(root, [2.2, 0, -2.85], [.45, .55, .45], walnut, walnut, true);
  books(root, [2.07, .55, -2.85], .25, 3).forEach(b => { b.rotation.z = Math.PI / 2; b.position.y = .03 + (b.position.x - .02) * .0; });
  const reading = place(root, [3.5, 0, -2.85]); cylinder(reading, .14, .15, .03, [0, .015, 0], metal("#2a2622", .45), 32); rod(reading, [0, .03, 0], [0, 1.45, 0], .012, metal("#2a2622", .45));
  const drum = finishes.linen("#efe2c4"); drum.side = T.DoubleSide; drum.emissive = new T.Color("#ffb766"); drum.emissiveIntensity = .4; cylinder(reading, .2, .22, .28, [0, 1.5, 0], drum, 40).castShadow = false;
  // Record player on a sideboard; click to play.
  const sideboard = place(root, [3.72, 0, -1.3], -Math.PI / 2);
  box(sideboard, [1.0, .62, .44], [0, .36, 0], walnut, .015); for (const x of [-.25, .25]) box(sideboard, [.48, .54, .01], [x, .36, .225], oak, .006); for (const x of [-.45, .45]) for (const z of [-.18, .18]) rod(sideboard, [x, 0, z], [x, .05, z], .015, finishes.brass());
  const player = interactive(place(sideboard, [.1, .67, 0]), "record", "Play the record player · Spotify");
  box(player, [.44, .09, .34], [0, .045, 0], oak, .015);
  const platter = group(player, [-.05, .095, 0]); platter.userData.dynamic = true; cylinder(platter, .15, .15, .01, [0, 0, 0], new T.MeshPhysicalMaterial({ color: "#151515", roughness: .25, clearcoat: 1 }), 48);
  cylinder(platter, .05, .05, .012, [0, .001, 0], ceramic(c.rust, .5), 32);
  const arm = group(player, [.16, .1, -.12]); rod(arm, [0, .03, 0], [-.12, .03, .14], .004, metal("#d6d8d6", .2)); cylinder(arm, .02, .02, .04, [0, .01, 0], metal("#d6d8d6", .2), 16);
  for (let i = 0; i < 4; i++) { const sleeve = box(sideboard, [.3, .3, .006], [-.35 + i * .02, .82, -.05 - i * .012], new T.MeshStandardMaterial({ color: ["#e0a526", "#2f4f43", "#b4532a", "#e2d6bd"][i], roughness: .7 }), .002); sleeve.rotation.x = -.15; }
  // Globe on a stand, turning slowly.
  const globe = interactive(place(root, [3.3, 0, 2.7]), "globe", "Spin the globe");
  cylinder(globe, .15, .17, .03, [0, .015, 0], walnut, 32); rod(globe, [0, .03, 0], [0, .62, 0], .015, finishes.brass());
  const meridian = mesh(globe, new T.TorusGeometry(.2, .008, 8, 48, Math.PI * 1.2), [0, .82, 0], finishes.brass()); meridian.rotation.set(0, Math.PI / 2, -.6);
  const world = sphere(globe, [.18, .18, .18], [0, .82, 0], new T.MeshPhysicalMaterial({ map: earth(), roughness: .4, clearcoat: .8 }), 40); world.rotation.z = .41; world.userData.dynamic = true;
  // Wall art and light.
  const art = frame(root, [-1.9, 2.0, -3.12], 0, 1.3, .9, "#8c8070");
  // A pair of brass picture sconces either side of it.
  for (const x of [-2.82, -.98]) { const sconce = place(root, [x, 2.05, -3.1]); cylinder(sconce, .09, .09, .02, [0, 0, 0], finishes.brass(), 32).rotation.x = Math.PI / 2; rod(sconce, [0, 0, .01], [0, 0, .07], .008, finishes.brass()); sphere(sconce, [.035, .035, .035], [0, 0, .09], emissive(c.amber, 2.6), 16); }
  new T.TextureLoader().load("/images/hero-anime.jpg", map => { if (!alive) { map.dispose(); return; } map.colorSpace = T.SRGBColorSpace; const m = art.picture.material as T.MeshStandardMaterial; m.map = map; m.color.set("#fff"); m.needsUpdate = true; });
  // The profile wall: a framed profile card, three certificates and a GitHub card. Each opens the full profile.
  const card = canvasTexture(ctx => {
    ctx.fillStyle = "#f7f5f0"; ctx.fillRect(0, 0, 800, 1000); const g = ctx.createLinearGradient(0, 0, 800, 220); g.addColorStop(0, "#2d3a6b"); g.addColorStop(1, "#3f4e86"); ctx.fillStyle = g; ctx.fillRect(0, 0, 800, 220);
    ctx.fillStyle = "#f1eadb"; ctx.beginPath(); ctx.arc(130, 220, 86, 0, 7); ctx.fill(); ctx.fillStyle = "#2d3a6b"; ctx.font = "700 70px Helvetica, Arial"; ctx.textAlign = "center"; ctx.fillText("DY", 130, 245); ctx.textAlign = "left";
    ctx.fillStyle = "#1f1a17"; ctx.font = "600 54px Helvetica, Arial"; ctx.fillText(profile.name, 50, 380);
    ctx.font = "400 27px Helvetica, Arial"; ctx.fillStyle = "#4a3e34"; ctx.fillText("Frontend & Full-Stack Developer", 50, 428); ctx.fillText("B.Tech IT · Chandigarh University", 50, 466);
    ctx.fillStyle = "#6b5a4a"; ctx.font = "400 22px Helvetica, Arial"; ctx.fillText("India · linkedin.com/in/deepanshuyad", 50, 510);
    ctx.fillStyle = "#d9d2c3"; ctx.fillRect(50, 545, 700, 2);
    ctx.fillStyle = "#9a4522"; ctx.font = "600 20px monospace"; ctx.fillText("EXPERIENCE", 50, 600);
    experience.forEach((e, i) => { ctx.fillStyle = "#1f1a17"; ctx.font = "600 26px Helvetica, Arial"; ctx.fillText(e.company, 50, 645 + i * 76); ctx.fillStyle = "#5e5044"; ctx.font = "400 21px Helvetica, Arial"; ctx.fillText(`${e.role} · ${e.dates}`, 50, 676 + i * 76); });
    ctx.fillStyle = "#2d3a6b"; ctx.fillRect(50, 905, 250, 54); ctx.fillStyle = "#f1eadb"; ctx.font = "600 22px Helvetica, Arial"; ctx.fillText("View profile ↗", 82, 940);
  }, 800, 1000);
  const profileFrame = interactive(place(root, [2.35, 1.95, -3.12]), "profile", "Deepanshu's profile · LinkedIn"); frame(profileFrame, [0, 0, 0], 0, .86, 1.06, card, walnut);
  profile.certifications.forEach((cert, i) => {
    const art = canvasTexture(ctx => {
      ctx.fillStyle = "#fbf7ec"; ctx.fillRect(0, 0, 1000, 720); ctx.strokeStyle = "#b89a5e"; ctx.lineWidth = 10; ctx.strokeRect(28, 28, 944, 664); ctx.lineWidth = 2; ctx.strokeRect(48, 48, 904, 624);
      ctx.textAlign = "center"; ctx.fillStyle = "#8a7448"; ctx.font = "600 26px Georgia, serif"; ctx.fillText("CERTIFICATE", 500, 140);
      ctx.fillStyle = "#2b2a26"; ctx.font = "italic 30px Georgia, serif"; ctx.fillText("awarded to", 500, 210); ctx.font = "600 58px Georgia, serif"; ctx.fillText(profile.name, 500, 290);
      ctx.font = "400 30px Georgia, serif"; ctx.fillStyle = "#3a3833"; const words = cert.title.split(" "); let line = "", y = 380; for (const w of words) { if ((line + w).length > 34) { ctx.fillText(line, 500, y); line = ""; y += 42; } line += w + " "; } ctx.fillText(line, 500, y);
      ctx.font = "400 24px Helvetica, Arial"; ctx.fillStyle = "#6b665a"; ctx.fillText(`${cert.issuer} · ${cert.date}`, 500, 560); if (cert.credential) ctx.fillText(`Credential ${cert.credential}`, 500, 600);
      ctx.fillStyle = "#b5352a"; ctx.beginPath(); ctx.arc(860, 590, 52, 0, 7); ctx.fill(); ctx.fillStyle = "#d9b84a"; ctx.beginPath(); ctx.arc(860, 590, 36, 0, 7); ctx.fill();
    }, 1000, 720);
    const [x, y] = [[-2.45, 2.15], [2.45, 2.15], [-2.45, 1.45]][i];
    const hang = interactive(place(root, [x, y, 3.12], Math.PI), "profile", `${cert.title} · ${cert.issuer}`); frame(hang, [0, 0, 0], 0, .72, .54, art, finishes.oak());
  });
  const gh = canvasTexture(ctx => {
    ctx.fillStyle = "#0d1117"; ctx.fillRect(0, 0, 720, 540); ctx.fillStyle = "#e6edf3"; ctx.font = "600 40px Helvetica, Arial"; ctx.fillText(`@${profile.github.handle}`, 44, 90);
    ctx.fillStyle = "#8b949e"; ctx.font = "400 22px Helvetica, Arial"; const bio = profile.github.bio; ctx.fillText(bio.slice(0, 44), 44, 140); ctx.fillText(bio.slice(44, 92), 44, 172); ctx.fillText(bio.slice(92), 44, 204);
    ctx.fillStyle = "#e6edf3"; ctx.font = "600 30px Helvetica, Arial"; ctx.fillText(`${profile.github.repos} repositories · ${profile.github.followers} followers`, 44, 270);
    profile.github.top.forEach(([name, stars], i) => { ctx.fillStyle = "#161b22"; ctx.fillRect(44, 300 + i * 66, 632, 54); ctx.fillStyle = "#58a6ff"; ctx.font = "600 24px Helvetica, Arial"; ctx.fillText(name, 64, 335 + i * 66); ctx.fillStyle = "#8b949e"; ctx.fillText(`★ ${stars}`, 580, 335 + i * 66); });
  }, 720, 540);
  const ghFrame = interactive(place(root, [2.45, 1.45, 3.12], Math.PI), "profile", "GitHub · Deepanshu0211"); frame(ghFrame, [0, 0, 0], 0, .72, .54, gh, finishes.walnut());
  pendant(root, [0, 4.36, 2.4], 1.55, "#c99a3c");
  plant(root, [-2.9, 0, 2.85], 1.5);
  let spin = 0;
  return {
    root, camera: [0, 1.65, 0], target: [0, 1, 0], anchors: [], perches, seats: [{ id: "laptop", eye: place(root, [.05, 1.17, 2.32]), screen }],
    movers: leaves.map((hinge, i) => ({ hinge, size: [1.43, 2.6, .38], center: [(i ? -1 : 1) * .725, 1.3, -.19] })),
    interact(action) { if (action === "globe") spin = 6; },
    reveal() { opening = 1; },
    conceal() { opening = 0; },
    busy: () => open !== opening,
    update(time, delta, options) {
      for (const d of drapes) d.step(delta, options);
      const playing = options.music === true; // the platter turns while a song really plays
      if (options.motion) { if (playing) platter.rotation.y -= delta * 3.5; spin = Math.max(0, spin - delta * 2); world.rotation.y += delta * (.12 + spin); }
      arm.rotation.y = playing ? -.25 : 0;
      // The panels ease out of the wall, then slide apart along it, each coming to rest in front of its outer bay;
      // closing runs the same path backwards.
      if (open !== opening) {
        open = !options.motion ? opening : opening > open ? Math.min(opening, open + delta * .4) : Math.max(opening, open - delta * .4);
        const ease = (t: number) => t * t * (3 - 2 * t), out = ease(Math.min(1, open / .3)), apart = ease(Math.max(0, (open - .3) / .7));
        leaves.forEach((leaf, i) => { leaf.position.set((i ? 1 : -1) * 1.45 * (1 + apart), 0, .19 + out * .42); });
      }
      (deskBulb.material as T.MeshBasicMaterial).color.set(c.amber).multiplyScalar(options.weather === "day" ? 1.4 : 3);
      drum.emissiveIntensity = options.weather === "day" ? .15 : .45;
    },
    dispose() { alive = false; },
  };
}
