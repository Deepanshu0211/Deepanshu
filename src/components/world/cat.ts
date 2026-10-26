import * as T from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { wind } from "./materials";

// Mishti, the household cat: a low-poly model (public/models/cat/cat.obj, made from the Cat_LP3 source with its display
// platform removed) with base-colour, roughness and normal maps (1024 px WebP copies of the originals in textures/).
// She stands about 27 cm to the ear tips, facing +z. She breathes in the vertex shader rather than by scaling the mesh,
// so the cached shadow map is not redrawn every frame just because a cat is alive.
const HEIGHT = .27, FEET = -.8965, TOP = 2.0128;
let model: T.Group | null = null, loading: Promise<void> | null = null;
const pending = new Set<(g: T.Group) => void>();

function breathe(material: T.MeshStandardMaterial) {
  material.onBeforeCompile = shader => {
    shader.uniforms.windTime = wind.windTime;
    shader.vertexShader = "uniform float windTime;\n" + shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      { float chest = smoothstep(-.6, .1, transformed.y) * (1.0 - smoothstep(.7, 1.3, transformed.y)) * smoothstep(-1.0, .2, transformed.z);
        float swell = 1.0 + sin(windTime * 1.7) * .022 * chest; transformed.x *= swell; transformed.y += (swell - 1.0) * .6; }`);
  };
  material.customProgramCacheKey = () => "cat-breath";
  return material;
}

/** Download the cat once; cats placed before it arrives are filled in when it does. */
export function loadCat() {
  return loading ??= (async () => {
    const textures = new T.TextureLoader();
    const [obj, base, rough, normal] = await Promise.all([new OBJLoader().loadAsync("/models/cat/cat.obj"), textures.loadAsync("/models/cat/cat-base.webp"), textures.loadAsync("/models/cat/cat-rough.webp"), textures.loadAsync("/models/cat/cat-normal.webp")]);
    base.colorSpace = T.SRGBColorSpace; for (const t of [base, rough, normal]) t.anisotropy = 4;
    const fur = breathe(new T.MeshStandardMaterial({ map: base, roughnessMap: rough, normalMap: normal, roughness: 1 }));
    const eyes = breathe(new T.MeshPhysicalMaterial({ color: "#2b1a08", roughness: .08, clearcoat: 1, clearcoatRoughness: .05 }));
    const whiskers = breathe(new T.MeshStandardMaterial({ color: "#f1ece2", roughness: .6 }));
    const g = new T.Group(), scale = HEIGHT / (TOP - FEET);
    obj.traverse(o => {
      if (!(o instanceof T.Mesh) || /Plateau/i.test(o.name)) return;
      const mesh = new T.Mesh(o.geometry as T.BufferGeometry, /Eyes/i.test(o.name) ? eyes : /Whisker/i.test(o.name) ? whiskers : fur);
      mesh.name = o.name; mesh.castShadow = !/Whisker/i.test(o.name); mesh.receiveShadow = true;
      (mesh.geometry as T.BufferGeometry & { computeBoundsTree?: () => void }).computeBoundsTree?.(); // fast picking (three-mesh-bvh)
      g.add(mesh);
    });
    g.scale.setScalar(scale); g.position.y = -FEET * scale;
    model = g; pending.forEach(fill => fill(g)); pending.clear();
  })();
}

/** A cat on `parent` (at its origin, facing its +z), filled in as soon as the model has loaded. */
export function placeCat(parent: T.Object3D) {
  const fill = (g: T.Group) => parent.add(g.clone());
  if (model) fill(model); else pending.add(fill);
}
