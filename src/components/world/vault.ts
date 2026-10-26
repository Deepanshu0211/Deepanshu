import * as T from "three";
import { type Area, colors as c, box, cylinder, group, sign, interactive, canvasTexture } from "./objects";
import { fabric, metal, emissive } from "./materials";
import { table, chair, armchair, rug, pendant, frame, books, mug, place, rod, lathe, finishes } from "./furniture";

// The hidden room behind the study bookshelf: a small members' den, reached through the locked door on its east wall.
// Local space: x -2..2, z -3.25..3.25 between wall centres (inner faces at ±1.91 and ±3.16); the door at x = 2 swings in
// over x .5..2, z -.9..-.6 (keep that clear).
export function createVault(): Area {
  const root = new T.Group(), walnut = finishes.walnut(), oak = finishes.oak();
  rug(root, [-.4, 0, .1], [2.2, 3.2], "#c9a27a");
  // A painted board on the far wall, the first thing you see from the door.
  const board = canvasTexture(ctx => {
    ctx.fillStyle = "#24392f"; ctx.fillRect(0, 0, 900, 560); ctx.strokeStyle = "#c9a45c"; ctx.lineWidth = 6; ctx.strokeRect(26, 26, 848, 508);
    ctx.textAlign = "center"; ctx.fillStyle = "#e9d9b0"; ctx.font = "600 30px monospace"; ctx.fillText("— MEMBERS ONLY —", 450, 130);
    ctx.font = "600 84px Georgia, serif"; ctx.fillText("The Hidden Room", 450, 260);
    ctx.font = "italic 32px Georgia, serif"; ctx.fillStyle = "#cdbb90"; ctx.fillText("You found the door. Pull up a chair.", 450, 340);
    ctx.font = "400 22px monospace"; ctx.fillText("what is said behind the shelf, stays behind the shelf", 450, 450);
  }, 900, 560);
  frame(root, [-1.88, 1.85, 0], Math.PI / 2, 1.6, 1, board, walnut);
  // Writing desk on the north wall: the members' log, a lamp, a mug.
  table(root, [-.6, 0, 2.85], [1.4, .76, .62], walnut, walnut);
  chair(root, [-.6, 0, 2.25], 0, oak, fabric("#7a4b3a", .9));
  const log = place(root, [-.75, .76, 2.8], .15);
  box(log, [.3, .04, .38], [0, .02, 0], fabric("#24392f", .9), .006); box(log, [.28, .035, .36], [.006, .018, 0], fabric("#efe7d4", .95), 0);
  sign(log, "MEMBERS' LOG", [0, .041, 0], .24, .05, "#24392f", "#e9d9b0").rotation.x = -Math.PI / 2;
  mug(root, [-1.15, .76, 2.95]);
  const lamp = place(root, [-.05, .76, 3]); cylinder(lamp, .07, .08, .02, [0, .01, 0], finishes.brass(), 24); rod(lamp, [0, .02, 0], [0, .38, 0], .008, finishes.brass());
  lathe(lamp, [[.02, 0], [.06, -.01], [.1, -.12]], [0, .42, 0], new T.MeshPhysicalMaterial({ color: "#24392f", roughness: .35, clearcoat: .6, side: T.DoubleSide }), 32);
  cylinder(lamp, .03, .03, .04, [0, .36, 0], emissive(c.amber, 3), 16);
  // Two armchairs facing over a round table.
  armchair(root, [-1.5, 0, -2.2], Math.PI / 2, "#2f4f43"); armchair(root, [.4, 0, -2.2], -Math.PI / 2, "#7a4b3a");
  table(root, [-.55, 0, -2.2], [.5, .5, .5], walnut, walnut, true);
  const chess = place(root, [-.55, .5, -2.2], .3); box(chess, [.3, .02, .3], [0, .01, 0], new T.MeshStandardMaterial({ color: "#e2d6bd", roughness: .6 }), .004);
  for (let i = 0; i < 6; i++) cylinder(chess, .012, .016, .05, [-.1 + (i % 3) * .1, .045, i < 3 ? -.1 : .1], new T.MeshStandardMaterial({ color: i < 3 ? "#1f1a17" : "#f1eadb", roughness: .4 }), 12);
  // A low cabinet of books on the south wall, clear of the door's swing.
  box(root, [1.3, .9, .4], [1.2, .45, -2.95], walnut, .015); for (const x of [.88, 1.52]) box(root, [.6, .8, .01], [x, .45, -2.745], oak, .006);
  books(root, [.6, .9, -2.95], 1.2, 21);
  pendant(root, [-.6, 4.36, 0], 1.6, "#24392f");
  // The way out: a brass button on the wall beside the door's latch side opens the shelf and the door from inside.
  const exit = interactive(group(root, [1.9, 1.2, 1.1]), "exit", "Brass button · open the bookshelf");
  box(exit, [.008, .13, .09], [-.004, 0, 0], finishes.brass(), .003); cylinder(exit, .018, .02, .016, [-.012, 0, 0], metal("#c9a45c", .25), 24).rotation.z = Math.PI / 2;
  // Lamplight, dark until a member opens the door. Lights are kept to the west half so little reaches the rooms next door.
  const glow = [new T.PointLight("#ffc98a", 0, 4.5, 2), new T.PointLight("#ffb766", 0, 2.5, 2)];
  glow[0].position.set(-.6, 2.55, 0); glow[1].position.set(-.05, 1.15, 2.95); root.add(...glow);
  let lit = 0, goal = 0;
  return {
    root, camera: [0, 1.65, 0], target: [0, 1, 0], anchors: [],
    reveal() { goal = 1; },
    update(time, delta, options) {
      if (lit === goal) return; lit = options.motion ? Math.min(goal, lit + delta * .8) : goal;
      glow[0].intensity = lit * 3.2; glow[1].intensity = lit * 1.6;
    },
  };
}
