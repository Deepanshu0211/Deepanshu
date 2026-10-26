import * as T from "three";
import { type Area, colors as c, box, cylinder, group, sign, plant, interactive, canvasTexture } from "./objects";
import { fabric, metal, emissive, geoRug } from "./materials";
import { table, chair, armchair, rug, pendant, frame, books, mug, place, rod, lathe, finishes } from "./furniture";

// The hidden room behind the study bookshelf: the members' conference room, reached through the locked door on its east
// wall. Local space: x -4..4, z -3.25..3.25 between wall centres (inner faces at ±3.91 and ±3.16); the door at x = 4
// swings in over x 2.5..4, z -.9..-.6 (keep that clear).
export function createVault(): Area {
  const root = new T.Group(), walnut = finishes.walnut(), oak = finishes.oak();
  rug(root, [-.6, 0, 0], [5, 3.4], "#ffffff", geoRug("#2a4a3c", "#c9a43a", "#b8232a", "#7fa694"));
  // A painted board on the far wall, the first thing you see from the door.
  const board = canvasTexture(ctx => {
    ctx.fillStyle = "#24392f"; ctx.fillRect(0, 0, 900, 560); ctx.strokeStyle = "#c9a45c"; ctx.lineWidth = 6; ctx.strokeRect(26, 26, 848, 508);
    ctx.textAlign = "center"; ctx.fillStyle = "#e9d9b0"; ctx.font = "600 30px monospace"; ctx.fillText("— MEMBERS ONLY —", 450, 130);
    ctx.font = "600 84px Georgia, serif"; ctx.fillText("The Hidden Room", 450, 260);
    ctx.font = "italic 32px Georgia, serif"; ctx.fillStyle = "#cdbb90"; ctx.fillText("You found the door. Pull up a chair.", 450, 340);
    ctx.font = "400 22px monospace"; ctx.fillText("what is said behind the shelf, stays behind the shelf", 450, 450);
  }, 900, 560);
  frame(root, [-3.88, 1.85, 0], Math.PI / 2, 2, 1.25, board, walnut);
  // The conference table: long walnut under two pendants, ten chairs round it. Every chair is a shared seat.
  table(root, [-.6, 0, 0], [3.4, .76, 1.2], walnut, walnut);
  const log = place(root, [-.6, .76, .05], .1);
  box(log, [.3, .04, .38], [0, .02, 0], fabric("#24392f", .9), .006); box(log, [.28, .035, .36], [.006, .018, 0], fabric("#efe7d4", .95), 0);
  sign(log, "MEMBERS' LOG", [0, .041, 0], .24, .05, "#24392f", "#e9d9b0").rotation.x = -Math.PI / 2;
  mug(root, [.5, .76, -.3]); mug(root, [-1.7, .76, .32]);
  for (const [x, z] of [[-1.2, -.35], [.1, .35]]) { const pad = box(root, [.21, .006, .29], [x, .763, z], fabric("#f4ecd8", 1), 0); pad.rotation.y = x * .2; }
  const seat = fabric("#7a4b3a", .9), perches: NonNullable<Area["perches"]> = [];
  const places: [number, number, number][] = [[-1.9, -1, 0], [-1.05, -1, 0], [-.2, -1, 0], [.65, -1, 0], [-1.9, 1, Math.PI], [-1.05, 1, Math.PI], [-.2, 1, Math.PI], [.65, 1, Math.PI], [-2.75, 0, Math.PI / 2], [1.55, 0, -Math.PI / 2]];
  places.forEach(([x, z, turn], i) => {
    const g = interactive(chair(root, [x, 0, z], turn, oak, seat), "sit:conference", "Take a seat at the table");
    perches.push({ id: `conference-${i}`, group: "conference", at: group(g, [0, .5, .02]) });
  });
  for (const x of [-1.5, .3]) pendant(root, [x, 4.36, 0], 1.9, "#24392f");
  // A credenza on the north wall with a desk lamp and books.
  box(root, [2.4, .8, .45], [-.6, .4, 2.93], walnut, .015); for (const x of [-1.2, 0]) box(root, [1.16, .7, .01], [x, .4, 2.705], oak, .006);
  books(root, [-1.65, .8, 2.93], .8, 14);
  const lamp = place(root, [.3, .8, 2.95]); cylinder(lamp, .07, .08, .02, [0, .01, 0], finishes.brass(), 24); rod(lamp, [0, .02, 0], [0, .38, 0], .008, finishes.brass());
  lathe(lamp, [[.02, 0], [.06, -.01], [.1, -.12]], [0, .42, 0], new T.MeshPhysicalMaterial({ color: "#24392f", roughness: .35, clearcoat: .6, side: T.DoubleSide }), 32);
  cylinder(lamp, .03, .03, .04, [0, .36, 0], emissive(c.amber, 3), 16);
  // A reading corner by the door: two armchairs and a cabinet of books, clear of the door's swing.
  armchair(root, [2.5, 0, -2.4], .5, "#c4a13f"); armchair(root, [3.35, 0, -1.7], -1.2, "#a4502b");
  box(root, [1.6, .9, .4], [-2.4, .45, -2.95], walnut, .015); for (const x of [-2.8, -2]) box(root, [.76, .8, .01], [x, .45, -2.745], oak, .006);
  books(root, [-3.1, .9, -2.95], 1.4, 21);
  plant(root, [-3.5, 0, 2.75], 1.4); plant(root, [-3.5, 0, -2.75], 1.2);
  // The way out: a brass button on the wall beside the door's latch side opens the shelf and the door from inside.
  const exit = interactive(group(root, [3.9, 1.2, 1.1]), "exit", "Brass button · open the bookshelf");
  box(exit, [.008, .13, .09], [-.004, 0, 0], finishes.brass(), .003); cylinder(exit, .018, .02, .016, [-.012, 0, 0], metal("#c9a45c", .25), 24).rotation.z = Math.PI / 2;
  // Lamplight over the table, dark until a member opens the door. Short reach, so little passes into the rooms next door.
  const glow = [-1.5, .3].map(x => { const l = new T.PointLight("#ffc98a", 0, 3.4, 2); l.position.set(x, 2.25, 0); root.add(l); return l; });
  let lit = 0, goal = 0;
  return {
    root, camera: [0, 1.65, 0], target: [0, 1, 0], anchors: [], perches,
    reveal() { goal = 1; },
    update(time, delta, options) {
      if (lit === goal) return; lit = options.motion ? Math.min(goal, lit + delta * .8) : goal;
      for (const l of glow) l.intensity = lit * 6; // bright enough against the dark emerald walls
    },
  };
}
