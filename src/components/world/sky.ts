import * as T from "three";
import { skyline } from "./materials";
import type { Weather } from "./objects";

/** Where the moon hangs: south-east and high, framed by the balcony. Shared with the telescope. */
export const MOON_DIRECTION: [number, number, number] = [.62, .58, .53];

/** Moon phase for a date: 0 new, .25 first quarter, .5 full, .75 last quarter. */
export function moonPhase(date = new Date()) {
  const synodic = 29.530588853, reference = Date.UTC(2000, 0, 6, 18, 14);
  return (((date.getTime() - reference) / 86400000 / synodic) % 1 + 1) % 1;
}

function seeded(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const lunar = new Map<string, T.CanvasTexture>();
/** Lunar surface from a simulated heightfield: bowl craters with raised rims, soft maria and ray systems. `bump` returns the height map. */
/** The lunar heightfield as a resumable job, so it can run in small slices instead of one long freeze. */
function* lunarWork(): Generator<void, void, void> {
  const W = 1024, H = 512, r = seeded(7);
    // Periodic value noise so the texture wraps around the sphere without a seam.
    const lattice = new Float32Array(256 * 256).map(() => r());
    const noise = (x: number, y: number, period: number) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const at = (a: number, b: number) => lattice[(((a % period) + period) % period) * 256 % 65536 + (b & 255)];
      return (at(xi, yi) * (1 - sx) + at(xi + 1, yi) * sx) * (1 - sy) + (at(xi, yi + 1) * (1 - sx) + at(xi + 1, yi + 1) * sx) * sy; };
    const fbm = (u: number, v: number, base: number, octaves: number) => { let s = 0, a = .5, f = base; for (let o = 0; o < octaves; o++) { s += a * noise(u * f, v * f, f); a *= .5; f *= 2; } return s; };
    const height = new Float32Array(W * H), albedo = new Float32Array(W * H);
    for (let y = 0; y < H; y++) { if (y % 8 === 7) yield; for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H, i = y * W + x;
      const mare = Math.max(0, Math.min(1, (fbm(u, v * .5, 3, 5) - .5) * 4.5 + .4 - Math.abs(v - .45) * 1.4));
      const grain = fbm(u, v * .5, 64, 3);
      albedo[i] = .7 - mare * .36 + (grain - .5) * .1 + (fbm(u, v * .5, 16, 4) - .5) * .12;
      height[i] = (grain - .5) * .25 - mare * .15;
    } }
    // Craters: power-law sizes, bowl + rim + faint ejecta; a few young ones get bright rays.
    for (let c = 0; c < 1100; c++) {
      if (c % 60 === 59) yield;
      const R = Math.max(1.5, Math.pow(r(), 5) * 42), cx = r() * W, cy = 20 + r() * (H - 40), young = R > 14 && r() > .82;
      const reach = Math.ceil(R * (young ? 6 : 2));
      for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) {
        const yy = Math.round(cy + dy); if (yy < 0 || yy >= H) continue; const xx = ((Math.round(cx + dx) % W) + W) % W, i = yy * W + xx, d = Math.hypot(dx, dy) / R;
        const depth = Math.min(R, 14) * .035;
        if (d < 1) { height[i] -= (1 - d * d) * depth; albedo[i] -= .02 * (1 - d); }
        else if (d < 1.6) { const rim = Math.exp(-Math.pow((d - 1.05) / .22, 2)); height[i] += rim * depth * .6; albedo[i] += rim * .025; }
        if (young && d > 1 && d < 6) { const ray = Math.pow(Math.max(0, Math.sin(Math.atan2(dy, dx) * 5 + c)), 40); albedo[i] += ray * .06 * (1 - d / 6); }
        if (young && d < 1.3) albedo[i] += .025;
      }
    }
    lunarField = { height, albedo };
}
let lunarJob: Generator<void, void, void> | null = null;
function ensureLunarField() { if (lunarField) return; lunarJob ??= lunarWork(); while (!lunarJob.next().done) { /* finish synchronously */ } }
/** Build the moon in ~6 ms slices between frames, then hand back the texture. */
export function moonTextureAsync(bump = false): Promise<T.CanvasTexture> {
  return new Promise(resolve => {
    if (lunarField) { resolve(moonTexture(bump)); return; }
    lunarJob ??= lunarWork();
    const step = () => { const t = performance.now(); while (performance.now() - t < 6) { if (lunarJob!.next().done || lunarField) { resolve(moonTexture(bump)); return; } } setTimeout(step, 0); };
    setTimeout(step, 0);
  });
}
export function moonTexture(bump = false) {
  const key = bump ? "bump" : "albedo"; const hit = lunar.get(key); if (hit) return hit;
  const W = 1024, H = 512;
  ensureLunarField();
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H; const ctx = canvas.getContext("2d")!, image = ctx.createImageData(W, H);
  const field = bump ? lunarField!.height : lunarField!.albedo;
  for (let i = 0; i < W * H; i++) {
    const value = bump ? Math.max(0, Math.min(255, 128 + field[i] * 90)) : Math.max(0, Math.min(255, field[i] * 255));
    image.data[i * 4] = value; image.data[i * 4 + 1] = value * (bump ? 1 : .985); image.data[i * 4 + 2] = value * (bump ? 1 : .96); image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = bump ? T.NoColorSpace : T.SRGBColorSpace; texture.anisotropy = 8; texture.wrapS = T.RepeatWrapping; lunar.set(key, texture); return texture;
}
let lunarField: { height: Float32Array; albedo: Float32Array } | null = null;

const palettes: Record<Weather, { top: string; horizon: string; cloud: string; cover: number; stars: number; moon: number; glow: string }> = {
  rain: { top: "#2a3c44", horizon: "#6f8389", cloud: "#8b999b", cover: .92, stars: 0, moon: .08, glow: "#000000" },
  day: { top: "#4f93bd", horizon: "#cfe1e6", cloud: "#ffffff", cover: .38, stars: 0, moon: .32, glow: "#fff4d8" },
  sunset: { top: "#34466f", horizon: "#f09a6a", cloud: "#f4b48c", cover: .45, stars: .25, moon: .9, glow: "#ff9a55" },
  night: { top: "#050a16", horizon: "#16243a", cloud: "#26303f", cover: .22, stars: 1, moon: 1.5, glow: "#000000" },
};

/** Sky dome, clouds, stars, moon and planets, plus a distant skyline ring. Everything follows the camera, so it reads as infinitely far. */
export function createSky() {
  const root = new T.Group(); root.renderOrder = -10;
  const uniforms = { top: { value: new T.Color(palettes.rain.top) }, horizon: { value: new T.Color(palettes.rain.horizon) }, cloud: { value: new T.Color(palettes.rain.cloud) }, cover: { value: palettes.rain.cover }, time: { value: 0 }, glow: { value: new T.Color() }, sun: { value: new T.Vector3(-.8, .08, -.2).normalize() }, moonDir: { value: new T.Vector3(...MOON_DIRECTION).normalize() }, moonGlow: { value: 0 } };
  const dome = new T.Mesh(new T.SphereGeometry(190, 48, 24), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false, uniforms,
    vertexShader: "varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `uniform vec3 top,horizon,cloud,glow,sun,moonDir;uniform float cover,time,moonGlow;varying vec3 vDir;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
    void main(){vec3 d=normalize(vDir);float y=max(d.y,0.);vec3 col=mix(horizon,top,pow(y,.55));
      col+=glow*pow(max(dot(d,sun),0.),6.)*.9+glow*pow(max(dot(d,sun),0.),60.)*.6;
      col+=vec3(.75,.8,.9)*pow(max(dot(d,moonDir),0.),180.)*moonGlow;
      if(d.y>.01){vec2 uv=d.xz/(d.y+.12)*.9+vec2(time*.006,time*.002);float c=smoothstep(1.-cover,1.,fbm(uv)+cover*.35);col=mix(col,cloud*(.82+.25*fbm(uv*2.3)),c*smoothstep(.0,.25,d.y)*.9);}
      col=mix(col,horizon*.92,smoothstep(.02,-.08,d.y));gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  }));
  dome.renderOrder = -10; root.add(dome);
  // Stars: a fixed field above the horizon with a gentle twinkle.
  const r = seeded(11), count = 1800, positions = new Float32Array(count * 3), sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) { const u = r() * 2 - 1, a = r() * Math.PI * 2, y = Math.abs(u) * .96 + .04, s = Math.sqrt(1 - y * y); positions.set([Math.cos(a) * s * 180, y * 180, Math.sin(a) * s * 180], i * 3); sizes[i] = Math.pow(r(), 6) * 3.5 + .8; }
  const starGeometry = new T.BufferGeometry(); starGeometry.setAttribute("position", new T.BufferAttribute(positions, 3)); starGeometry.setAttribute("size", new T.BufferAttribute(sizes, 1));
  const starMaterial = new T.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: { opacity: { value: 0 }, time: { value: 0 } },
    vertexShader: "attribute float size;uniform float time;varying float vTw;void main(){vTw=.7+.3*sin(time*2.+position.x*.37+position.z*.21);gl_PointSize=size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: "uniform float opacity;varying float vTw;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.97,.92),smoothstep(.5,.0,d)*opacity*vTw);}" });
  const stars = new T.Points(starGeometry, starMaterial); stars.renderOrder = -9; root.add(stars);
  // Planets as bright, slightly coloured points along a line through the sky.
  const planets = new T.Group(); root.add(planets);
  for (const [dir, color, size] of [[[.3, .45, .84], "#ffe7b8", 2.6], [[-.1, .38, .92], "#f2e3c4", 2], [[.75, .3, .55], "#ff9a6a", 1.6]] as [number[], string, number][]) {
    const s = new T.Sprite(new T.SpriteMaterial({ color: new T.Color(color).multiplyScalar(2), transparent: true, depthWrite: false, fog: false, opacity: 0 })); s.position.set(dir[0], dir[1], dir[2]).normalize().multiplyScalar(175); s.scale.setScalar(size); planets.add(s);
  }
  // The moon, lit for tonight's phase.
  const moonPivot = new T.Group(); root.add(moonPivot);
  const placeholder = new T.DataTexture(new Uint8Array([168, 165, 158, 255]), 1, 1); placeholder.needsUpdate = true;
  const moonUniforms = { map: { value: placeholder as T.Texture }, sunDir: { value: new T.Vector3() }, brightness: { value: 1 }, earthshine: { value: .04 } };
  // Lit only by its own sun direction, so the terminator matches tonight's phase whatever the room lights do.
  const moon = new T.Mesh(new T.SphereGeometry(5.2, 64, 32), new T.ShaderMaterial({ uniforms: moonUniforms, fog: false, transparent: true, depthWrite: false,
    vertexShader: "varying vec2 vUv;varying vec3 vN;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `uniform sampler2D map;uniform vec3 sunDir;uniform float brightness,earthshine;varying vec2 vUv;varying vec3 vN;void main(){vec3 c=texture2D(map,vUv).rgb;float l=smoothstep(-.05,.25,dot(normalize(vN),sunDir));gl_FragColor=vec4(c*(l*brightness+earthshine),1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}` }));
  moon.position.copy(new T.Vector3(...MOON_DIRECTION).normalize().multiplyScalar(170)); moon.lookAt(0, 0, 0); moon.renderOrder = -8; moonPivot.add(moon);
  const halo = new T.Sprite(new T.SpriteMaterial({ map: haloTexture(), color: "#cfd8ea", transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending, opacity: 0 })); halo.position.copy(moon.position); halo.scale.setScalar(24); moonPivot.add(halo);
  // Sun direction relative to the moon gives the phase: lit side faces the sun.
  const phase = moonPhase(), toMoon = moon.position.clone().normalize(), side = new T.Vector3(0, 1, 0).cross(toMoon).normalize(), angle = phase * Math.PI * 2;
  const sunForMoon = toMoon.clone().multiplyScalar(Math.cos(angle)).add(side.multiplyScalar(-Math.sin(angle))).normalize();
  moonUniforms.sunDir.value.copy(sunForMoon);
  // The surface is generated in slices after the first frames; a flat tone stands in until then.
  void moonTextureAsync().then(map => { moonUniforms.map.value = map; });
  // Distant city: a skyline ring and its lit windows.
  const ringGeometry = new T.CylinderGeometry(178, 178, 40, 96, 1, true);
  const far = skyline("far").clone(); far.wrapS = T.RepeatWrapping; far.repeat.set(12, 1); far.needsUpdate = true;
  const farLit = skyline("far", true).clone(); farLit.wrapS = T.RepeatWrapping; farLit.repeat.set(12, 1); farLit.needsUpdate = true;
  const ring = new T.Mesh(ringGeometry, new T.MeshBasicMaterial({ map: far, transparent: true, side: T.BackSide, depthWrite: false, fog: false })); ring.position.y = 6; ring.renderOrder = -8; root.add(ring);
  const ringLights = new T.Mesh(ringGeometry, new T.MeshBasicMaterial({ map: farLit, transparent: true, side: T.BackSide, depthWrite: false, fog: false, blending: T.AdditiveBlending, opacity: 0 })); ringLights.position.y = 6; ringLights.renderOrder = -7; root.add(ringLights);
  const target = { top: new T.Color(), horizon: new T.Color(), cloud: new T.Color(), glow: new T.Color() };
  return {
    root, moon,
    update(camera: T.Camera, time: number, delta: number, weather: Weather, motion: boolean) {
      root.position.copy(camera.position);
      const p = palettes[weather], k = motion ? 1 - Math.exp(-delta * 2.2) : 1;
      uniforms.top.value.lerp(target.top.set(p.top), k); uniforms.horizon.value.lerp(target.horizon.set(p.horizon), k); uniforms.cloud.value.lerp(target.cloud.set(p.cloud), k); uniforms.glow.value.lerp(target.glow.set(p.glow), k);
      uniforms.cover.value += (p.cover - uniforms.cover.value) * k; uniforms.moonGlow.value += ((weather === "night" ? .9 : weather === "sunset" ? .3 : 0) - uniforms.moonGlow.value) * k;
      if (motion) { uniforms.time.value = time; starMaterial.uniforms.time.value = time; }
      starMaterial.uniforms.opacity.value += (p.stars - starMaterial.uniforms.opacity.value) * k;
      planets.children.forEach(s => { const m = (s as T.Sprite).material; m.opacity += (p.stars - m.opacity) * k; });
      moonUniforms.brightness.value += (p.moon - moonUniforms.brightness.value) * k;
      moon.visible = weather !== "rain"; (halo.material as T.SpriteMaterial).opacity += ((weather === "night" ? .22 : weather === "sunset" ? .08 : 0) - (halo.material as T.SpriteMaterial).opacity) * k;
      (ring.material as T.MeshBasicMaterial).color.copy(uniforms.horizon.value).multiplyScalar(.88); (ring.material as T.MeshBasicMaterial).opacity = .6;
      const lit = ringLights.material as T.MeshBasicMaterial; lit.opacity += ({ rain: .55, day: 0, sunset: .35, night: .9 }[weather] - lit.opacity) * k;
    },
    dispose() { root.traverse(o => { if (o instanceof T.Mesh || o instanceof T.Points || o instanceof T.Sprite) { o.geometry.dispose(); (o.material as T.Material).dispose(); } }); far.dispose(); farLit.dispose(); },
  };
}
function haloTexture() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128; const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64); g.addColorStop(0, "rgba(255,255,255,.6)"); g.addColorStop(.25, "rgba(255,255,255,.18)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new T.CanvasTexture(canvas); t.colorSpace = T.SRGBColorSpace; return t;
}
