import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { surface, leafTexture, mottle, projectSurfaces } from "./materials";

export type Action = "projects" | "skills" | "about" | "experience" | "contact" | "lamp" | "weather" | "sound" | "keyboard" | "drawer" | "pet" | "duck" | "lab" | "chair" | "cat" | "telescope" | "computer" | "laptop" | "profile" | "record" | "radio" | "fridge" | "kettle" | "globe" | "swing" | `door:${string}` | `project:${string}` | `skill:${string}`;
export type Weather = "rain" | "day" | "sunset" | "night";
export type Location = "bedroom" | "archive" | "rooftop" | "workshop" | "library";
export interface WorldOptions { motion: boolean; weather: Weather; lamp: boolean; quality: "auto" | "low"; rtx?: boolean; fov?: number; sensitivity?: number; lights?: number; fan?: number; life?: boolean; ao?: boolean; bloom?: boolean; grain?: boolean; volume?: number; }
export interface Area {
  root: T.Group;
  camera: [number, number, number];
  target: [number, number, number];
  anchors: { name: string; action: Action; point: T.Vector3 }[];
  update?: (time: number, delta: number, options: WorldOptions) => void;
  interact?: (action: Action) => void;
  dispose?: () => void;
  /** Places to sit and use a screen: the eye position and the screen the camera lines up with. */
  seats?: { id: "computer" | "laptop"; eye: T.Object3D; screen: T.Mesh }[];
  /** Capture reflections (mirrors) from the finished scene; called after loading and when the light changes. */
  bake?: (renderer: T.WebGLRenderer, scene: T.Scene) => void;
}
export const colors = { wood: "#7b4a2b", edge: "#3e2618", wall: "#e8dfcd", cream: "#e3d6bc", sage: "#2f4f43", rust: "#b4532a", dark: "#221c18", amber: "#ffcc83", teal: "#2d3a6b" };
export function material(color: string, roughness?: number) { return surface(color, roughness); }
export function box(parent: T.Object3D, size: number[], pos: number[], color: string | T.Material, radius = .035) {
  const mesh = new T.Mesh(radius ? new RoundedBoxGeometry(size[0], size[1], size[2], 3, Math.min(radius, ...size.map(n => n / 3))) : new T.BoxGeometry(...size as [number, number, number]), typeof color === "string" ? material(color) : color);
  mesh.position.set(...pos as [number, number, number]); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function sphere(parent: T.Object3D, scale: number[], pos: number[], color: string | T.Material, segments = 24) {
  const mesh = new T.Mesh(new T.SphereGeometry(1, segments, Math.round(segments * .75)), typeof color === "string" ? material(color) : color); mesh.scale.set(...scale as [number, number, number]); mesh.position.set(...pos as [number, number, number]); mesh.castShadow = true; parent.add(mesh); return mesh;
}
export function cylinder(parent: T.Object3D, top: number, bottom: number, height: number, pos: number[], color: string | T.Material, segments = 32) {
  const mesh = new T.Mesh(new T.CylinderGeometry(top, bottom, height, segments), typeof color === "string" ? material(color) : color); mesh.position.set(...pos as [number, number, number]); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function tube(parent: T.Object3D, points: number[][], radius: number, color: string | T.Material) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p as [number, number, number])));
  const mesh = new T.Mesh(new T.TubeGeometry(curve, 40, radius, 12, false), typeof color === "string" ? material(color) : color); mesh.castShadow = true; parent.add(mesh); return mesh;
}
export function interactive<TObject extends T.Object3D>(object: TObject, action: Action, label: string): TObject { object.userData.action = action; object.userData.label = label; return object; }
export function group(parent: T.Object3D, pos: number[]) { const g = new T.Group(); g.position.set(...pos as [number, number, number]); parent.add(g); return g; }
export function canvasTexture(draw: (ctx: CanvasRenderingContext2D) => void, w = 512, h = 256) {
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h; const ctx = canvas.getContext("2d")!; draw(ctx); const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; return texture;
}
export function sign(parent: T.Object3D, text: string, pos: number[], width = 1, height = .24, background = colors.cream, ink = colors.edge) {
  const map = canvasTexture(ctx => { ctx.fillStyle = background; ctx.fillRect(0,0,512,128); ctx.fillStyle = ink; ctx.font = "500 42px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text,256,64,480); },512,128);
  // Printed, not glowing: lit like paper, with a faint self-light so labels stay legible at night.
  const mesh = new T.Mesh(new T.PlaneGeometry(width,height), new T.MeshStandardMaterial({map,roughness:.82,emissive:"#ffffff",emissiveMap:map,emissiveIntensity:.12})); mesh.position.set(...pos as [number, number, number]); parent.add(mesh); return mesh;
}
// A potted plant: thrown terracotta pot, dark soil, and arching veined leaves on thin stems.
export function leafGeometry(length: number, width: number, curl: number) {
  const geometry = new T.PlaneGeometry(1, 1, 4, 10); const a = geometry.attributes.position;
  for (let i = 0; i < a.count; i++) {
    const t = a.getY(i) + .5, x = a.getX(i), w = width * Math.sin(Math.PI * Math.pow(t, .75)) * (1 - t * .15);
    a.setXYZ(i, x * w, t * length * (1 - curl * t * .35), curl * t * t * length + Math.abs(x) * w * .45);
  }
  geometry.computeVertexNormals(); return geometry;
}
export function plant(parent: T.Object3D, pos: number[], scale = 1) {
  const g = group(parent,pos); g.scale.setScalar(scale);
  const terracotta = new T.MeshStandardMaterial({ color: "#a8613f", roughness: .86, bumpMap: mottle(), bumpScale: .8 });
  const profile = [[0,0],[.15,0],[.165,.012],[.2,.34],[.228,.355],[.232,.4],[.214,.405],[.2,.37],[.186,.36]].map(([x,y])=>new T.Vector2(x,y));
  const pot = new T.Mesh(new T.LatheGeometry(profile, 40), terracotta); pot.castShadow = pot.receiveShadow = true; g.add(pot);
  cylinder(g,.19,.19,.012,[0,.355,0],new T.MeshStandardMaterial({ color: "#2e2219", roughness: 1, bumpMap: mottle(), bumpScale: 2 }));
  const greens = ["#56703f", "#6f8a4f", "#4a6236"].map(color => new T.MeshStandardMaterial({ color, map: leafTexture(), roughness: .52, side: T.DoubleSide }));
  const stem = new T.MeshStandardMaterial({ color: "#647a46", roughness: .7 });
  const seed = Math.abs(Math.round(pos[0] * 13 + pos[2] * 7));
  for (let i = 0; i < 11; i++) {
    const a = i * 2.39996 + seed, rise = .3 + (i % 4) * .09, lean = .35 + (i % 3) * .16, reach = .08 + lean * .12;
    const tip = [Math.sin(a) * reach, .36 + rise, Math.cos(a) * reach];
    tube(g, [[Math.sin(a) * .04, .36, Math.cos(a) * .04], [tip[0] * .6, .36 + rise * .6, tip[2] * .6], tip], .0035, stem);
    const leaf = new T.Mesh(leafGeometry(.3 + (i % 3) * .05, .11 + (i % 2) * .02, .55 + (i % 3) * .2), greens[i % 3]);
    leaf.position.set(tip[0], tip[1], tip[2]); leaf.rotation.set(0, a, 0, "YXZ"); leaf.rotateX(lean - .2); leaf.castShadow = true; g.add(leaf);
  }
  return g;
}
export function disposeObject(root: T.Object3D) {
  const geometries=new Set<T.BufferGeometry>(), materials=new Set<T.Material>(), textures=new Set<T.Texture>();
  root.traverse(object=>{if(object instanceof T.Mesh || object instanceof T.Points || object instanceof T.LineSegments){geometries.add(object.geometry); for(const m of Array.isArray(object.material)?object.material:[object.material]) { materials.add(m); for(const value of Object.values(m)) if(value instanceof T.Texture) textures.add(value); }}});
  textures.forEach(t=>t.dispose()); geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
}

// Batch only immutable, untextured scenery. Interactive or animated parents keep their meshes.
export function batchScenery(root: T.Group) {
  projectSurfaces(root);
  const batches=new Map<string,T.Mesh[]>();
  root.traverse(object=>{
    if(!(object instanceof T.Mesh)||!object.visible||object instanceof T.InstancedMesh||!(object.material instanceof T.MeshStandardMaterial)||object.material.transparent)return;
    let parent:T.Object3D|null=object;
    while(parent){if(parent.userData.action||parent.userData.dynamic)return;parent=parent.parent;}
    const m=object.material;
    const physical=m instanceof T.MeshPhysicalMaterial?[m.clearcoat,m.sheen,m.sheenColor.getHexString()]:[];
    const key=[m.type,m.color.getHexString(),m.roughness,m.metalness,m.side,m.map?.uuid,m.bumpMap?.uuid,m.bumpScale,m.roughnessMap?.uuid,...physical,object.castShadow,object.receiveShadow].join(":");
    const list=batches.get(key)||[];list.push(object);batches.set(key,list);
  });
  const originals=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
  // Bake relative to the root: the merged mesh is re-parented under it, so world space would apply the root's offset twice.
  const toRoot=root.matrixWorld.clone().invert(),relative=new T.Matrix4();
  for(const meshes of batches.values()){
    if(meshes.length<2)continue;
    const geometries=meshes.map(mesh=>{const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();geometry.applyMatrix4(relative.multiplyMatrices(toRoot,mesh.matrixWorld));return geometry;});
    const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!merged)continue;
    const result=new T.Mesh(merged,(meshes[0].material as T.Material).clone());result.castShadow=meshes[0].castShadow;result.receiveShadow=meshes[0].receiveShadow;root.add(result);
    meshes.forEach(mesh=>{mesh.removeFromParent();originals.add(mesh.geometry);materials.add(mesh.material as T.Material);});
  }
  originals.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}

/**
 * Collision that follows the furniture itself: one oriented box per mesh part (legs, seats, tops),
 * so the walker bumps into objects where they really are. Floor-flat things, overhead fittings,
 * foliage, glass and cloth are left out.
 */
export function collidersFrom(root: T.Object3D) {
  root.updateMatrixWorld(true);
  const parts = new T.Group(), world = new T.Box3(), size = new T.Vector3(), centre = new T.Vector3();
  root.traverse(object => {
    if (!(object instanceof T.Mesh) || object instanceof T.InstancedMesh || !object.visible) return;
    const material = object.material as T.Material; if (material.transparent || material.side === T.DoubleSide) return;
    let parent: T.Object3D | null = object; while (parent) { if (parent.userData.noCollide) return; parent = parent.parent; }
    const geometry = object.geometry as T.BufferGeometry; geometry.computeBoundingBox(); const local = geometry.boundingBox!;
    world.copy(local).applyMatrix4(object.matrixWorld); world.getSize(size);
    if (world.min.y > 1.9 || world.max.y < .1 || Math.max(size.x, size.y, size.z) < .06) return;
    local.getSize(size); local.getCenter(centre);
    const box = new T.Mesh(new T.BoxGeometry(Math.max(size.x, .01), Math.max(size.y, .01), Math.max(size.z, .01)));
    box.geometry.translate(centre.x, centre.y, centre.z); box.applyMatrix4(object.matrixWorld); parts.add(box);
  });
  return parts;
}
