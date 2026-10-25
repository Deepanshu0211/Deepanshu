import * as T from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

// Film finish: a soft vignette and fine grain, applied after tone mapping so it reads like a lens, not a filter.
const FinishShader = {
  name: "FinishShader",
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, grain: { value: .028 }, vignette: { value: .32 } },
  vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
  fragmentShader: `uniform sampler2D tDiffuse;uniform float time;uniform float grain;uniform float vignette;varying vec2 vUv;
  float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 d=(vUv-.5)*vec2(1.15,1.);float v=smoothstep(.95,.25,length(d));
  c.rgb*=mix(1.-vignette,1.,v);c.rgb+=(hash(gl_FragCoord.xy*.73+fract(time)*91.)-.5)*grain;gl_FragColor=c;}`,
};

/**
 * Post stack for the room: ambient occlusion grounds every object, a restrained bloom lets the lamp,
 * bulbs and screens breathe, and an outline traces whatever the visitor can interact with.
 */
export function createPost(renderer: T.WebGLRenderer, scene: T.Scene, camera: T.PerspectiveCamera) {
  const size = renderer.getSize(new T.Vector2());
  const target = new T.WebGLRenderTarget(size.x, size.y, { type: T.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, size.x, size.y);
  ao.updateGtaoMaterial({ radius: .32, distanceExponent: 1.4, thickness: 1.2, scale: 1.15, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 12 });
  ao.blendIntensity = .95; composer.addPass(ao);
  const bloom = new UnrealBloomPass(new T.Vector2(size.x, size.y), .34, .62, .9); composer.addPass(bloom);
  const outline = new OutlinePass(new T.Vector2(size.x, size.y), scene, camera);
  outline.edgeStrength = 3.2; outline.edgeGlow = .35; outline.edgeThickness = 1.1; outline.visibleEdgeColor.set("#f6e6c2"); outline.hiddenEdgeColor.set("#3b3426"); outline.enabled = false; composer.addPass(outline);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FinishShader); composer.addPass(finish);
  return {
    composer, ao, bloom, outline,
    setSize(width: number, height: number, ratio: number) { composer.setPixelRatio(ratio); composer.setSize(width, height); },
    grain(on: boolean) { finish.uniforms.grain.value = on ? .028 : 0; finish.uniforms.vignette.value = on ? .32 : .22; },
    highlight(object: T.Object3D | null) { outline.selectedObjects = object ? [object] : []; outline.enabled = Boolean(object); },
    render(time: number, motion: boolean) { if (motion) finish.uniforms.time.value = time; composer.render(); },
    dispose() { composer.passes.forEach(pass => pass.dispose()); composer.dispose(); target.dispose(); },
  };
}
export type Post = ReturnType<typeof createPost>;
