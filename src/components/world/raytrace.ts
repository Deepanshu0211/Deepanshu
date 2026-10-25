import * as T from "three";
import type { WebGLPathTracer } from "three-gpu-pathtracer";

/**
 * "RTX" photo mode: a progressive GPU path tracer (three-gpu-pathtracer) that takes over while the
 * camera is still. Browsers expose no ray-tracing hardware, so this traces in shaders: true bounce
 * light, soft shadows and reflections, converging over a few seconds. Only the room you are in is
 * traced. The tracing shader is large; on Windows its first compile can take a minute or two, during
 * which the normal renderer keeps drawing (the browser caches the compiled shader afterwards).
 */
export async function createRaytracer(renderer: T.WebGLRenderer, scene: T.Scene, camera: T.PerspectiveCamera, raster: () => void) {
  const { WebGLPathTracer: Tracer, GradientEquirectTexture } = await import("three-gpu-pathtracer");
  const tracer: WebGLPathTracer = new Tracer(renderer);
  tracer.multipleImportanceSampling = false; // a smaller shader compiles noticeably faster
  tracer.bounces = 5; tracer.transmissiveBounces = 3; tracer.filterGlossyFactor = .6; tracer.tiles.set(2, 2);
  tracer.minSamples = 2; tracer.fadeDuration = 700; tracer.renderDelay = 0; tracer.dynamicLowRes = false; tracer.renderScale = .75;
  tracer.rasterizeScene = true; tracer.rasterizeSceneCallback = raster;
  // The BVH builds on the main thread: bundling three-mesh-bvh's worker hangs the production build.
  const sky = new GradientEquirectTexture();
  let building = false, ready = false, key = "";
  return {
    get samples() { return ready ? tracer.samples : 0; },
    get busy() { return building || (ready && Boolean((tracer as unknown as { isCompiling: boolean }).isCompiling)); },
    get ready() { return ready; },
    /** Build the BVH for the room in view; `hidden` objects (outdoors, sky, other rooms) are left out. */
    async prepare(sceneKey: string, hidden: T.Object3D[], skyTop: T.Color, skyBottom: T.Color) {
      if (building || sceneKey === key) return; building = true; ready = false;
      const restore = hidden.map(o => [o, o.visible] as const); hidden.forEach(o => { o.visible = false; });
      const environment = scene.environment;
      sky.topColor.copy(skyTop); sky.bottomColor.copy(skyBottom); sky.update(); scene.environment = sky;
      try { await tracer.setSceneAsync(scene, camera); key = sceneKey; ready = true; }
      catch (error) { console.warn("Path tracer could not build this room", error); }
      finally { restore.forEach(([o, v]) => { o.visible = v; }); scene.environment = environment; building = false; }
    },
    reset() { if (ready) { tracer.updateCamera(); tracer.reset(); } },
    /** One progressive sample (or the raster fallback while compiling / fading in). */
    render() { if (!ready) return false; tracer.renderSample(); return true; },
    dispose() { tracer.dispose(); sky.dispose(); },
  };
}
export type Raytracer = Awaited<ReturnType<typeof createRaytracer>>;
