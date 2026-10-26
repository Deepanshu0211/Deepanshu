import * as T from "three";
import { type Area, colors as c, box, cylinder, group, sign, interactive, canvasTexture } from "./objects";
import { fabric, metal, emissive, geoRug } from "./materials";
import { table, chair, armchair, rug, pendant, frame, books, mug, place, rod, lathe, finishes } from "./furniture";

// The hidden room behind the study bookshelf: a small members' den, reached through the locked door on its east wall.
// Local space: x -2..2, z -3.25..3.25 between wall centres (inner faces at ±1.91 and ±3.16); the door at x = 2 swings in
// over x .5..2, z -.9..-.6 (keep that clear).
export function createVault(): Area {
  const root = new T.Group(), walnut = finishes.walnut(), oak = finishes.oak();
  rug(root, [-.4, 0, .1], [2.2, 3.2], "#ffffff", geoRug("#2a4a3c", "#c9a43a", "#b8232a", "#7fa694"));
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
  armchair(root, [-1.5, 0, -2.2], Math.PI / 2, "#c4a13f"); armchair(root, [.4, 0, -2.2], -Math.PI / 2, "#a4502b");
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
  // The netlink terminal on a console in the north-east corner: type a room code here and friends who type the
  // same code walk into this world with you (net.ts). Its amber screen glows even with the lamps off.
  const consoleTable = place(root, [1.4, 0, 2.55], -Math.PI / 2);
  table(consoleTable, [0, 0, 0], [.8, .76, .5], walnut, finishes.blackMetal());
  const terminal = interactive(group(consoleTable, [0, .76, -.02]), "multiplayer", "Netlink terminal · play with friends using a room code");
  box(terminal, [.5, .4, .36], [0, .25, -.04], "#d8cfb8", .035); box(terminal, [.28, .04, .22], [0, .02, -.02], "#c9bfa6", .02);
  const screenTexture = canvasTexture(ctx => {
    ctx.fillStyle = "#120c06"; ctx.fillRect(0, 0, 512, 384); ctx.fillStyle = "#ffb347"; ctx.shadowColor = "#ff9a2a"; ctx.shadowBlur = 8;
    ctx.font = "600 34px monospace"; ctx.fillText("NETLINK // ROOM CODE", 30, 70); ctx.font = "500 26px monospace";
    ["ROOM CODE ▸ _ _ _ _", "", "same code, same world.", "voices carry, walls muffle.", "", "press E to dial in"].forEach((line, i) => ctx.fillText(line, 30, 140 + i * 38));
    for (let y = 0; y < 384; y += 3) { ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(0, y, 512, 1); } // scanlines
  }, 512, 384);
  const screen = new T.Mesh(new T.PlaneGeometry(.42, .31), new T.MeshBasicMaterial({ map: screenTexture, color: new T.Color(1.25, 1.25, 1.25) })); screen.position.set(0, .27, .141); terminal.add(screen);
  const cursor = new T.Mesh(new T.PlaneGeometry(.018, .026), emissive("#ffb347", 2)); cursor.position.set(.058, .298, .142); cursor.userData.dynamic = true; terminal.add(cursor);
  box(terminal, [.42, .022, .15], [0, .011, .21], "#cfc5ac", .01);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 10; k++) box(terminal, [.03, .011, .026], [-.18 + k * .04, .026, .155 + r * .031], "#b9ae95", .004);
  // Lamplight, dark until a member opens the door. Lights are kept to the west half so little reaches the rooms next door.
  const glow = [new T.PointLight("#ffc98a", 0, 4.5, 2), new T.PointLight("#ffb766", 0, 2.5, 2)];
  glow[0].position.set(-.6, 2.55, 0); glow[1].position.set(-.05, 1.15, 2.95); root.add(...glow);
  let lit = 0, goal = 0;
  return {
    root, camera: [0, 1.65, 0], target: [0, 1, 0], anchors: [{ name: "Netlink terminal", action: "multiplayer", point: new T.Vector3(1.4, 1.3, 2.55) }],
    reveal() { goal = 1; },
    update(time, delta, options) {
      cursor.visible = !options.motion || Math.floor(time * 1.6) % 2 === 0; // the terminal cursor blinks
      if (lit === goal) return; lit = options.motion ? Math.min(goal, lit + delta * .8) : goal;
      glow[0].intensity = lit * 5; glow[1].intensity = lit * 2.2; // brighter against the dark emerald walls
    },
  };
}
