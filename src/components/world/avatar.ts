import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Person } from "./people";

// The visitor's character (public/models/character.glb): a static T-pose from Blender with no skeleton. It is rigged
// here when it loads, so the shared gait in people.ts drives it like every other person: hips, knees, shoulders and
// elbows become bones, and each vertex follows the nearest limb, blended across the joint.

type Part = { geometry: T.BufferGeometry; material: T.Material; name: string };
let parts: Part[] | null = null, loading: Promise<void> | null = null;
const pending = new Set<() => void>();

// Joints measured from the model (metres, Y up, facing +z). Arms run out along x at shoulder height.
const HIP = .9, KNEE = .48, SHOULDER = 1.31, NECK = 1.47, HIP_X = .09, SHOULDER_X = .18, ELBOW_X = .45;
const HANG = Math.PI / 2 - .12; // T-pose arms lowered to the sides, a little away from the body
// Bone order: pelvis, then per side (left, right) hip, knee, shoulder, hang, elbow frame, elbow, forearm; then head.
const PELVIS = 0, HEAD = 15, SIDE = [1, 8];

function weigh(x: number, y: number): [number[], number[]] {
  const s = SIDE[x < 0 ? 0 : 1], ax = Math.abs(x), ramp = (a: number, b: number, v: number) => T.MathUtils.smoothstep(v, a, b);
  if (y > 1.08 && y < 1.46 && ax > .1) { const arm = ramp(.1, .27, ax), fore = ramp(.41, .49, ax); return [[PELVIS, s + 3, s + 6, 0], [1 - arm, arm * (1 - fore), arm * fore, 0]]; }
  if (y < .95) { const leg = 1 - ramp(.85, .95, y), shin = 1 - ramp(.43, .53, y); return [[PELVIS, s, s + 1, 0], [1 - leg, leg * (1 - shin), leg * shin, 0]]; }
  const head = ramp(NECK - .05, NECK + .03, y); return [[PELVIS, HEAD, 0, 0], [1 - head, head, 0, 0]];
}

/** Clothes and hair colours. Each player gets a fresh random set when they join a room, so friends look different. */
export interface Outfit { top: string; bottom: string; shoes: string; hair: string }
const WARDROBE: Record<keyof Outfit, string[]> = {
  top: ["#2f4f43", "#b4532a", "#2d3a6b", "#c9a43a", "#7a4b3a", "#8a3b6b", "#1f6b4a", "#b8232a", "#d9786a", "#4a5a7a", "#e2d6bd", "#1d6a6c"],
  bottom: ["#1f1f24", "#2d3a6b", "#3b3f3c", "#6b5a44", "#c8bfae", "#4a3a2a", "#1d2b28", "#5b6370"],
  shoes: ["#f1eadb", "#1f1a17", "#7a4b3a", "#b8232a", "#2d3a6b", "#c9a43a"],
  hair: ["#1f1a17", "#3a2418", "#5a3b22", "#8a5a2b", "#b88a4a", "#2a2a30"],
};
export function randomOutfit(): Outfit { const pick = (k: keyof Outfit) => WARDROBE[k][Math.floor(Math.random() * WARDROBE[k].length)]; return { top: pick("top"), bottom: pick("bottom"), shoes: pick("shoes"), hair: pick("hair") }; }
const SLOTS: [RegExp, keyof Outfit][] = [[/jumper/i, "top"], [/trous/i, "bottom"], [/shoe/i, "shoes"], [/^hair/i, "hair"]];
/** Recolour a character's clothes and hair; before the model has loaded, it is applied as soon as it arrives. */
export function dressAvatar(person: Person, outfit: Outfit) {
  person.root.userData.outfit = outfit;
  person.root.traverse(o => {
    if (!(o instanceof T.SkinnedMesh)) return; const slot = SLOTS.find(([re]) => re.test((o.material as T.Material).name)); if (!slot) return;
    if (!o.userData.ownMaterial) { o.material = (o.material as T.Material).clone(); o.userData.ownMaterial = true; } // the template stays as modelled
    (o.material as T.MeshStandardMaterial).color.set(outfit[slot[1]]);
  });
}

/** Download and rig the character once; avatars made before it arrives are filled in when it does. */
export function loadAvatar() {
  return loading ??= new GLTFLoader().loadAsync("/models/character.glb").then(gltf => {
    gltf.scene.updateMatrixWorld(true); const found: Part[] = [];
    gltf.scene.traverse(o => {
      if (!(o instanceof T.Mesh) || /^Platform/i.test(o.name)) return; // the display stand stays in Blender
      const geometry = (o.geometry as T.BufferGeometry).clone().applyMatrix4(o.matrixWorld), p = geometry.attributes.position, count = p.count;
      const index = new Uint16Array(count * 4), weight = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) { const [b, w] = weigh(p.getX(i), p.getY(i)); index.set(b, i * 4); weight.set(w, i * 4); }
      geometry.setAttribute("skinIndex", new T.Uint16BufferAttribute(index, 4)); geometry.setAttribute("skinWeight", new T.Float32BufferAttribute(weight, 4));
      found.push({ geometry, material: o.material as T.Material, name: o.name });
    });
    parts = found; pending.forEach(fill => fill()); pending.clear();
  });
}

/** A rigged copy of the character, optionally dressed in an outfit. */
export function makeAvatar(outfit?: Outfit): Person {
  const root = new T.Group(), body = new T.Group(); root.add(body);
  const bone = (parent: T.Object3D, x: number, y: number) => { const b = new T.Bone(); b.position.set(x, y, 0); parent.add(b); return b; };
  const pelvis = bone(body, 0, HIP), bones: T.Bone[] = [pelvis], arms: { side: number; hang: T.Bone; frame: T.Bone; fore: T.Bone }[] = [];
  const hips: T.Bone[] = [], knees: T.Bone[] = [], shoulders: T.Bone[] = [], elbows: T.Bone[] = [], hands: T.Bone[] = [];
  for (const side of [-1, 1]) {
    const hip = bone(pelvis, side * HIP_X, 0), knee = bone(hip, 0, KNEE - HIP);
    // The shoulder swings (walk sets its x); "hang" lowers the T-pose arm; the elbow frame turns back square to the body
    // so the elbow bends forward like a person's; "fore" lowers the forearm again.
    const shoulder = bone(pelvis, side * SHOULDER_X, SHOULDER - HIP), hang = bone(shoulder, 0, 0), frame = bone(hang, side * (ELBOW_X - SHOULDER_X), 0), elbow = bone(frame, 0, 0), fore = bone(elbow, 0, 0);
    bones.push(hip, knee, shoulder, hang, frame, elbow, fore); hips.push(hip); knees.push(knee); shoulders.push(shoulder); elbows.push(elbow); hands.push(fore); arms.push({ side, hang, frame, fore });
  }
  const head = bone(pelvis, 0, NECK - HIP); bones.push(head);
  const fill = () => {
    // Bind in the T-pose the vertices were weighted in, at full scale (a head folded away before the model arrived must
    // not be baked into the rest pose), then restore any scale and lower the arms.
    const scales = bones.map(b => b.scale.clone()); bones.forEach(b => { b.rotation.set(0, 0, 0); b.scale.setScalar(1); }); body.position.set(0, 0, 0); body.rotation.set(0, 0, 0); root.updateMatrixWorld(true);
    const skeleton = new T.Skeleton(bones);
    for (const part of parts!) {
      const mesh = new T.SkinnedMesh(part.geometry, part.material); mesh.name = part.name; mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = true; // characters cast real shadows mesh.userData.shared = true;
      body.add(mesh); mesh.updateMatrixWorld(true); mesh.bind(skeleton);
    }
    bones.forEach((b, i) => b.scale.copy(scales[i])); if (root.userData.outfit) dressAvatar(person, root.userData.outfit);
    for (const { side, hang, frame, fore } of arms) { hang.rotation.z = -side * HANG; frame.rotation.z = side * HANG; fore.rotation.z = -side * HANG; }
  };
  const person: Person = { root, body, hips, knees, shoulders, elbows, hands, head };
  if (outfit) root.userData.outfit = outfit;
  if (parts) fill(); else pending.add(fill);
  return person;
}
