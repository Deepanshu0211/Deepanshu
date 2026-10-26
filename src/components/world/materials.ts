import * as T from "three";

// Procedural PBR surfaces. Every texture is drawn once on a canvas and shared; materials stay
// per-mesh so batching and disposal keep working exactly as before.

const cache = new Map<string, T.Texture>();
function seeded(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function texture(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, rand: () => number) => void, color = true, seed = key.length * 7919) {
  const hit = cache.get(key); if (hit) return hit;
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!; draw(ctx, seeded(seed + size));
  const map = new T.CanvasTexture(canvas); map.wrapS = map.wrapT = T.RepeatWrapping; map.anisotropy = 8;
  if (color) map.colorSpace = T.SRGBColorSpace; cache.set(key, map); return map;
}

// Long, slightly wavering grain lines with occasional darker figure. Greyscale: the material colour tints it.
export function woodGrain() {
  return texture("wood", 1024, (ctx, r) => {
    ctx.fillStyle = "#e4e4e4"; ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 9; i++) { // broad figure bands under the fine grain
      const y = r() * 1024, g = ctx.createLinearGradient(0, y - 90, 0, y + 90); g.addColorStop(0, "rgba(70,50,35,0)"); g.addColorStop(.5, `rgba(70,50,35,${.05 + r() * .07})`); g.addColorStop(1, "rgba(70,50,35,0)");
      ctx.fillStyle = g; ctx.fillRect(0, y - 90, 1024, 180);
    }
    for (let i = 0; i < 420; i++) {
      const y = r() * 1024, amp = 3 + r() * 12, phase = r() * 6.28, shade = r();
      ctx.strokeStyle = shade > .85 ? `rgba(40,30,22,${.08 + r() * .1})` : `rgba(60,48,38,${.025 + r() * .05})`;
      ctx.lineWidth = 1 + r() * (shade > .85 ? 3 : 2); ctx.beginPath();
      for (let x = -10; x <= 1034; x += 32) { const yy = y + Math.sin(x / 140 + phase) * amp + Math.sin(x / 31 + phase * 2) * .8; if (x < 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke();
    }
    for (let k = 0; k < 4; k++) { // a few soft knots
      const x = r() * 1024, y = r() * 1024, g = ctx.createRadialGradient(x, y, 0, x, y, 26 + r() * 20);
      g.addColorStop(0, "rgba(45,30,20,.45)"); g.addColorStop(.4, "rgba(60,45,32,.16)"); g.addColorStop(1, "rgba(60,45,32,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 60, 16, 0, 0, 7); ctx.fill();
    }
    const fade = ctx.createLinearGradient(0, 0, 0, 1024); // gentle board-to-board tone drift
    fade.addColorStop(0, "rgba(255,255,255,.06)"); fade.addColorStop(.5, "rgba(0,0,0,.05)"); fade.addColorStop(1, "rgba(255,255,255,.06)");
    ctx.fillStyle = fade; ctx.fillRect(0, 0, 1024, 1024);
  });
}
// Fine mottled noise for plaster, painted metal and ceramics.
export function mottle() {
  return texture("mottle", 512, (ctx, r) => {
    ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) {
      const x = r() * 512, y = r() * 512, s = 2 + r() * 22, v = Math.round(100 + r() * 60);
      ctx.fillStyle = `rgba(${v},${v},${v},${.04 + r() * .08})`; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
      for (const [dx, dy] of [[512, 0], [-512, 0], [0, 512], [0, -512]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, s, 0, 7); ctx.fill(); }
    }
    const data = ctx.getImageData(0, 0, 512, 512); for (let i = 0; i < data.data.length; i += 4) { const n = (r() - .5) * 26; data.data[i] += n; data.data[i + 1] += n; data.data[i + 2] += n; }
    ctx.putImageData(data, 0, 0);
  }, false);
}
// Plain weave: alternating over/under threads with fibre noise.
export function weave() {
  return texture("weave", 256, (ctx, r) => {
    ctx.fillStyle = "#d8d8d8"; ctx.fillRect(0, 0, 256, 256);
    const step = 8;
    for (let y = 0; y < 256; y += step) for (let x = 0; x < 256; x += step) {
      const over = ((x + y) / step) % 2 === 0, g = ctx.createLinearGradient(x, y, over ? x + step : x, over ? y : y + step);
      g.addColorStop(0, "#a8a8a8"); g.addColorStop(.5, "#f4f4f4"); g.addColorStop(1, "#a8a8a8"); ctx.fillStyle = g; ctx.fillRect(x + .5, y + .5, step - 1, step - 1);
    }
    for (let i = 0; i < 1400; i++) { ctx.strokeStyle = `rgba(${r() > .5 ? 255 : 60},${r() > .5 ? 255 : 60},${r() > .5 ? 255 : 60},.06)`; ctx.beginPath(); const x = r() * 256, y = r() * 256; ctx.moveTo(x, y); ctx.lineTo(x + r() * 10 - 5, y + r() * 3); ctx.stroke(); }
  });
}
// Hand-woven rug: wool body, a fringe-side border and a quiet geometric band.
export function rugTexture() {
  return texture("rug", 1024, (ctx, r) => {
    ctx.fillStyle = "#a64b2e"; ctx.fillRect(0, 0, 1024, 1024);
    for (let y = 0; y < 1024; y += 3) { ctx.fillStyle = `rgba(${r() > .5 ? 255 : 40},${r() > .5 ? 230 : 30},${r() > .5 ? 200 : 20},${.03 + r() * .05})`; ctx.fillRect(0, y, 1024, 2); }
    ctx.strokeStyle = "#e8dcc2"; ctx.lineWidth = 14; ctx.strokeRect(46, 46, 932, 932); ctx.lineWidth = 4; ctx.strokeRect(80, 80, 864, 864);
    ctx.fillStyle = "#9a4522"; for (let x = 110; x < 920; x += 46) { ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x + 23, 100); ctx.lineTo(x + 46, 120); ctx.lineTo(x + 23, 140); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, 904); ctx.lineTo(x + 23, 884); ctx.lineTo(x + 46, 904); ctx.lineTo(x + 23, 924); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = "rgba(240,224,190,.55)"; ctx.lineWidth = 3; for (let y = 300; y < 760; y += 70) { ctx.beginPath(); ctx.moveTo(180, y); ctx.lineTo(844, y); ctx.stroke(); }
    const data = ctx.getImageData(0, 0, 1024, 1024); for (let i = 0; i < data.data.length; i += 4) { const n = (r() - .5) * 30; data.data[i] += n; data.data[i + 1] += n; data.data[i + 2] += n; }
    ctx.putImageData(data, 0, 0);
  });
}
// Brushed metal: fine directional streaks, used as a roughness map.
export function brushed() {
  return texture("brushed", 512, (ctx, r) => {
    ctx.fillStyle = "#777"; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2400; i++) { const y = r() * 512, v = Math.round(90 + r() * 90); ctx.fillStyle = `rgba(${v},${v},${v},.25)`; ctx.fillRect(0, y, 512, .6 + r()); }
  }, false);
}
// A leaf with a midrib and soft lateral veins.
export function leafTexture() {
  return texture("leaf", 256, ctx => {
    const g = ctx.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, "#c9c9c9"); g.addColorStop(.5, "#ffffff"); g.addColorStop(1, "#c9c9c9");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(255,255,230,.8)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(128, 0); ctx.lineTo(128, 256); ctx.stroke();
    ctx.strokeStyle = "rgba(70,90,50,.25)"; ctx.lineWidth = 2;
    for (let y = 18; y < 256; y += 22) { ctx.beginPath(); ctx.moveTo(128, y); ctx.quadraticCurveTo(70, y - 8, 10, y - 30); ctx.moveTo(128, y); ctx.quadraticCurveTo(186, y - 8, 246, y - 30); ctx.stroke(); }
  });
}

// Floorboards running along v: per-board tone, staggered butt joints, bevelled seams and grain.
export function floorboards() {
  return texture("floor", 1024, (ctx, r) => {
    const grain = woodGrain().image as HTMLCanvasElement, boards = 8, w = 1024 / boards;
    for (let b = 0; b < boards; b++) {
      let y = -r() * 700;
      while (y < 1024) {
        const length = 520 + r() * 520, tone = 150 + r() * 46;
        ctx.save(); ctx.beginPath(); ctx.rect(b * w, y, w, length); ctx.clip();
        ctx.translate(b * w + w / 2, y + length / 2); ctx.rotate(Math.PI / 2); ctx.drawImage(grain, -length / 2 - r() * 400, -w / 2 - r() * 600, 2048, 1024); ctx.restore();
        ctx.fillStyle = `rgba(${tone},${tone * .78},${tone * .6},.5)`; ctx.fillRect(b * w, y, w, length);
        ctx.fillStyle = "rgba(25,15,10,.55)"; ctx.fillRect(b * w, y, w, 2); y += length;
      }
      ctx.fillStyle = "rgba(20,12,8,.65)"; ctx.fillRect(b * w, 0, 2.5, 1024); ctx.fillStyle = "rgba(255,235,210,.12)"; ctx.fillRect(b * w + 2.5, 0, 1.5, 1024);
    }
  });
}
// Herringbone parquet: short planks at right angles in a zigzag, grain along each plank, every plank its own tone.
// Laid at 45° on lattice periods that divide the tile (64 px across, 256 px along), so it repeats without a seam.
export function herringbone() {
  return texture("herringbone", 1024, ctx => {
    const grain = woodGrain().image as HTMLCanvasElement, w = 64 / Math.SQRT2, L = 4 * w;
    const along = ctx.createPattern(grain, "repeat")!, across = ctx.createPattern(grain, "repeat")!; across.setTransform(new DOMMatrix().rotate(90));
    // Tone from the plank's place in one tile, so matching planks on opposite edges match.
    const tone = (s: number, n: number, k: number) => { const h = Math.sin((((s % 4) + 4) % 4) * 127.1 + (((n % 16) + 16) % 16) * 311.7 + k * 74.7) * 43758.5; return 150 + (h - Math.floor(h)) * 52; };
    const plank = (x: number, y: number, pw: number, ph: number, fill: CanvasPattern, t: number) => { ctx.fillStyle = fill; ctx.fillRect(x + 1, y + 1, pw - 2, ph - 2); ctx.fillStyle = `rgba(${t},${t * .74},${t * .52},.5)`; ctx.fillRect(x + 1, y + 1, pw - 2, ph - 2); };
    ctx.fillStyle = "#1a120c"; ctx.fillRect(0, 0, 1024, 1024); ctx.save(); ctx.translate(512, 512); ctx.rotate(Math.PI / 4);
    for (let s = -6; s <= 6; s++) for (let n = -20; n <= 20; n++) { const x = n * w + s * L, y = n * w - s * L; plank(x, y, L, w, along, tone(s, n, 0)); plank(x, y + w, w, L, across, tone(s, n, 1)); }
    ctx.restore();
  });
}
// A modern wool rug in the room's palette: a deep field, a soft circle and a bar of colour across a lighter band.
export function geoRug(field: string, circle: string, bar: string, band: string) {
  return texture(`georug-${field}-${circle}-${bar}-${band}`, 1024, (ctx, r) => {
    ctx.fillStyle = field; ctx.fillRect(0, 0, 1024, 1024); ctx.fillStyle = band; ctx.fillRect(0, 560, 1024, 180);
    ctx.fillStyle = circle; ctx.beginPath(); ctx.arc(600, 330, 230, 0, 7); ctx.fill();
    ctx.fillStyle = bar; ctx.fillRect(250, 640, 360, 150); ctx.fillStyle = field; ctx.fillRect(690, 300, 26, 470);
    for (let i = 0; i < 14000; i++) { const v = r() > .5 ? 255 : 0; ctx.fillStyle = `rgba(${v},${v},${v},.035)`; ctx.fillRect(r() * 1024, r() * 1024, 2, 3); }
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 18; ctx.strokeRect(9, 9, 1006, 1006);
  });
}
// The view beyond the window: a soft sky, two depths of skyline, and a separate layer of lit windows.
export function skyline(layer: "sky" | "far" | "near", lights = false) {
  // Lights share the building layer's seed, so every lit window sits on a real facade.
  return texture(`skyline-${layer}-${lights}`, 1024, (ctx, r) => {
    if (layer === "sky") { const g = ctx.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, "#d8dfe0"); g.addColorStop(.55, "#f4efe6"); g.addColorStop(1, "#fff6e6"); ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${.04 + r() * .07})`; ctx.beginPath(); ctx.ellipse(r() * 1024, 120 + r() * 420, 90 + r() * 200, 14 + r() * 26, 0, 0, 7); ctx.fill(); } return; }
    ctx.clearRect(0, 0, 1024, 1024); const near = layer === "near"; const rects: number[][] = [];
    for (let x = -20; x < 1044;) { const w = (near ? 70 : 38) + r() * (near ? 90 : 60), h = (near ? 260 : 300) + r() * (near ? 300 : 260); rects.push([x, 1024 - h, w, h]); x += w + (near ? r() * 30 : r() * 6); }
    for (const [x, y, w, h] of rects) {
      if (lights) { for (let wy = y + 18; wy < 1010; wy += near ? 30 : 20) for (let wx = x + 9; wx < x + w - 12; wx += near ? 18 : 12) if (r() > .72) { ctx.fillStyle = r() > .35 ? `rgba(255,${200 + r() * 30},${130 + r() * 40},${.55 + r() * .45})` : "rgba(190,215,225,.6)"; ctx.fillRect(wx, wy, near ? 8 : 5, near ? 12 : 7); } continue; }
      const g = ctx.createLinearGradient(0, y, 0, 1024); g.addColorStop(0, near ? "#55605f" : "#8d9897"); g.addColorStop(1, near ? "#3a4242" : "#6e7978"); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      if (near && r() > .5) { ctx.fillRect(x + w * .3, y - 26, 4, 26); ctx.fillRect(x + w * .55, y - 12, w * .25, 12); }
      ctx.fillStyle = near ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.05)"; ctx.fillRect(x, y, w * .35, h);
    }
  }, true, layer === "near" ? 31 : 17);
}

// Grouted tiles. "kota" is the honed limestone of Indian balconies; "cement" a patterned kitchen floor; "subway" a glazed backsplash.
export function tiles(kind: "kota" | "cement" | "subway") {
  return texture(`tiles-${kind}`, 1024, (ctx, r) => {
    const rows = kind === "subway" ? 8 : 4, w = kind === "subway" ? 256 : 256, h = 1024 / rows;
    for (let y = 0; y < rows; y++) for (let x = -1; x < 1024 / w; x++) {
      const px = x * w + (kind === "subway" && y % 2 ? w / 2 : 0), py = y * h;
      if (kind === "kota") { const v = 150 + r() * 30; ctx.fillStyle = `rgb(${v * .86},${v * .9},${v * .78})`; ctx.fillRect(px, py, w, h); for (let i = 0; i < 90; i++) { const m = r() > .5 ? 255 : 50; ctx.fillStyle = `rgba(${m},${m},${m * .94},.05)`; ctx.beginPath(); ctx.ellipse(px + r() * w, py + r() * h, 6 + r() * 40, 2 + r() * 8, r() * 3, 0, 7); ctx.fill(); } }
      else if (kind === "cement") { ctx.fillStyle = "#efe6d4"; ctx.fillRect(px, py, w, h); ctx.fillStyle = "#2d3a6b"; ctx.beginPath(); ctx.moveTo(px + w / 2, py + 18); ctx.lineTo(px + w - 18, py + h / 2); ctx.lineTo(px + w / 2, py + h - 18); ctx.lineTo(px + 18, py + h / 2); ctx.fill(); ctx.fillStyle = "#b4532a"; ctx.beginPath(); ctx.arc(px + w / 2, py + h / 2, w * .15, 0, 7); ctx.fill(); ctx.fillStyle = "#efe6d4"; ctx.beginPath(); ctx.arc(px + w / 2, py + h / 2, w * .06, 0, 7); ctx.fill(); for (const [cx, cy] of [[px, py], [px + w, py], [px, py + h], [px + w, py + h]]) { ctx.fillStyle = "#2f4f43"; ctx.beginPath(); ctx.arc(cx, cy, w * .14, 0, 7); ctx.fill(); } }
      else { const g = ctx.createLinearGradient(px, py, px, py + h); g.addColorStop(0, "#f6f3ea"); g.addColorStop(1, "#e2dccd"); ctx.fillStyle = g; ctx.fillRect(px, py, w, h); }
      ctx.strokeStyle = kind === "kota" ? "rgba(60,55,45,.45)" : "rgba(120,110,95,.75)"; ctx.lineWidth = kind === "kota" ? 2 : 5; ctx.strokeRect(px, py, w, h);
    }
  });
}
// Polished black granite with mica flecks.
export function granite() {
  return texture("granite", 512, (ctx, r) => { ctx.fillStyle = "#2a2a2a"; ctx.fillRect(0, 0, 512, 512); for (let i = 0; i < 9000; i++) { const v = r(); ctx.fillStyle = v > .97 ? "rgba(230,220,200,.8)" : v > .6 ? "rgba(90,85,80,.6)" : "rgba(10,10,10,.6)"; ctx.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 3); } });
}
// Apartment facade: four floors by four bays (one tile = 12 m). `lit` draws only the glow of occupied rooms, in the same layout.
export function facade(lit = false) {
  return texture(`facade-${lit}`, 1024, (ctx, r) => {
    if (lit) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 1024, 1024); }
    else { ctx.fillStyle = "#d9d2c3"; ctx.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 400; i++) { ctx.fillStyle = `rgba(80,70,55,${r() * .06})`; ctx.fillRect(r() * 1024, r() * 1024, 30 + r() * 120, 4 + r() * 60); } }
    for (let f = 0; f < 4; f++) for (let b = 0; b < 4; b++) {
      const x = b * 256 + 58, y = f * 256 + 60, on = r() > .45, warm = r() > .25, curtain = r() > .6, tint = Math.floor(r() * 4);
      if (lit) { if (on) { ctx.fillStyle = warm ? "rgb(255,205,140)" : "rgb(190,215,230)"; ctx.fillRect(x + 8, y + 8, 124, 130); } continue; }
      ctx.fillStyle = "#3a4446"; ctx.fillRect(x, y, 140, 146); ctx.fillStyle = "#56646a"; ctx.fillRect(x + 8, y + 8, 124, 130);
      ctx.fillStyle = "#c9c0ae"; ctx.fillRect(x - 10, y + 146, 160, 14); ctx.fillStyle = "#2f3a3b"; ctx.fillRect(x + 68, y + 8, 4, 130);
      if (curtain) { ctx.fillStyle = ["#b4532a", "#2f4f43", "#e0a526", "#7c90a8"][tint]; ctx.fillRect(x + 8, y + 8, 40, 130); }
      ctx.fillStyle = "#b9b1a0"; ctx.fillRect(x - 20, y - 26, 180, 10); // chhajja sunshade
    }
  }, true, 404);
}
export function asphalt() {
  return texture("asphalt", 512, (ctx, r) => { ctx.fillStyle = "#4b4c4c"; ctx.fillRect(0, 0, 512, 512); for (let i = 0; i < 7000; i++) { const v = 50 + r() * 60; ctx.fillStyle = `rgba(${v},${v},${v},.5)`; ctx.fillRect(r() * 512, r() * 512, 2, 2); } for (let i = 0; i < 12; i++) { ctx.fillStyle = "rgba(20,20,20,.12)"; ctx.beginPath(); ctx.ellipse(r() * 512, r() * 512, 30 + r() * 90, 10 + r() * 30, r() * 3, 0, 7); ctx.fill(); } });
}
export function grass() {
  return texture("grass", 512, (ctx, r) => { ctx.fillStyle = "#5d7a3e"; ctx.fillRect(0, 0, 512, 512); for (let i = 0; i < 9000; i++) { ctx.strokeStyle = `rgba(${60 + r() * 60},${100 + r() * 60},${30 + r() * 30},.55)`; const x = r() * 512, y = r() * 512; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r() * 4 - 2, y - 4 - r() * 8); ctx.stroke(); } for (let i = 0; i < 30; i++) { ctx.fillStyle = "rgba(120,100,60,.12)"; ctx.beginPath(); ctx.arc(r() * 512, r() * 512, 10 + r() * 40, 0, 7); ctx.fill(); } });
}
/** A material whose UVs are projected in world metres by projectSurfaces. */
export function projected<M extends T.Material>(m: M, metres: number) { m.userData.project = metres; return m; }

type Surface ="wood" | "darkwood" | "plaster" | "paint" | "metal" | "ceramic" | "fabric" | "plain";
// Palette colours keep their meaning; each one now resolves to a believable physical surface.
const palette: Record<string, Surface> = { "#7b4a2b": "wood", "#8a5a36": "wood", "#3e2618": "darkwood", "#e8dfcd": "plaster", "#e3d6bc": "paint", "#221c18": "metal", "#b4532a": "paint", "#2f4f43": "paint", "#2d3a6b": "paint" };

/** Physically based material for a palette colour. `project` marks it for world-space UV projection. */
export function surface(color: string, roughness?: number, kind?: Surface): T.MeshStandardMaterial {
  const type = kind ?? palette[color.toLowerCase()] ?? "plain";
  const project = (m: T.MeshStandardMaterial, scale: number) => { m.userData.project = scale; return m; };
  switch (type) {
    case "wood": { const m = new T.MeshPhysicalMaterial({ color: tone(color, 1.12), map: woodGrain(), bumpMap: woodGrain(), bumpScale: .45, roughness: roughness ?? .58, clearcoat: .35, clearcoatRoughness: .42 }); return project(m, 1.3); }
    case "darkwood": { const m = new T.MeshStandardMaterial({ color: tone(color, 1.2), map: woodGrain(), bumpMap: woodGrain(), bumpScale: .3, roughness: roughness ?? .58 }); return project(m, 1.6); }
    case "plaster": { const m = new T.MeshStandardMaterial({ color, bumpMap: mottle(), bumpScale: 1.4, roughnessMap: mottle(), roughness: roughness ?? .96 }); return project(m, .9); }
    case "paint": { const m = new T.MeshStandardMaterial({ color, bumpMap: mottle(), bumpScale: .35, roughness: roughness ?? .66 }); return project(m, 2.2); }
    case "metal": { const m = new T.MeshStandardMaterial({ color: "#2a2622", metalness: .72, roughness: roughness ?? .4, roughnessMap: brushed() }); return project(m, 3); }
    case "ceramic": return new T.MeshPhysicalMaterial({ color, roughness: roughness ?? .32, clearcoat: .8, clearcoatRoughness: .12 });
    case "fabric": { const m = new T.MeshPhysicalMaterial({ color, map: weave(), bumpMap: weave(), bumpScale: .8, roughness: roughness ?? .92, sheen: 1, sheenRoughness: .55, sheenColor: tone(color, 1.6) }); return project(m, .16); }
    default: return new T.MeshStandardMaterial({ color, roughness: roughness ?? .78 });
  }
}
export function fabric(color: string, roughness?: number) { return surface(color, roughness, "fabric"); }
export function ceramic(color: string, roughness?: number) { return surface(color, roughness, "ceramic"); }
export function metal(color = "#c9ccc8", roughness = .3) { const m = new T.MeshStandardMaterial({ color, metalness: 1, roughness, roughnessMap: brushed() }); m.userData.project = 3; return m; }
export function emissive(color: string, strength = 1) { return new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(strength), toneMapped: true }); }
function tone(color: string, factor: number) { return new T.Color(color).multiplyScalar(factor); }

const p = new T.Vector3(), n = new T.Vector3(), normalMatrix = new T.Matrix3(), bounds = new T.Box3(), size = new T.Vector3();
/**
 * Box-projected UVs in metres, in world space. Texture grain follows the longest edge of each
 * face, so a desk top, a table leg and a floor board all read as cut from real stock.
 */
export function projectSurfaces(root: T.Object3D) {
  root.updateMatrixWorld(true);
  root.traverse(object => {
    if (!(object instanceof T.Mesh) || object instanceof T.InstancedMesh || object.userData.projected) return;
    const material = object.material as T.Material; const scale = material?.userData?.project as number | undefined;
    const geometry = object.geometry as T.BufferGeometry; const uv = geometry.attributes.uv, pos = geometry.attributes.position, nor = geometry.attributes.normal;
    if (!scale || !uv || !nor) return;
    geometry.computeBoundingBox(); bounds.copy(geometry.boundingBox!).applyMatrix4(object.matrixWorld).getSize(size);
    normalMatrix.getNormalMatrix(object.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i).applyMatrix4(object.matrixWorld); n.fromBufferAttribute(nor, i).applyMatrix3(normalMatrix);
      const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
      let a: number, b: number, la: number, lb: number;
      if (ax >= ay && ax >= az) { a = p.z; b = p.y; la = size.z; lb = size.y; } else if (ay >= az) { a = p.x; b = p.z; la = size.x; lb = size.z; } else { a = p.x; b = p.y; la = size.x; lb = size.y; }
      if (lb > la) [a, b] = [b, a];
      uv.setXY(i, a / scale, b / scale);
    }
    uv.needsUpdate = true; object.userData.projected = true;
  });
}

/** Shared wind clock and gust strength (the engine advances them each frame). */
export const wind = { windTime: { value: 0 }, windStrength: { value: 1 } };
type WindShape = { kind: "leaf"; origin: T.Vector3 | (() => T.Vector3); reach: number; amp: number } | { kind: "flutter"; amp: number } | { kind: "cloth"; top: number; height: number; amp: number };
/**
 * Wind in the vertex shader, so it costs no draw calls and survives geometry batching:
 * leaves bend more the further they are from their pot, a vine flutters in place, and cloth
 * ripples along its surface, pinned at the top and freest at the hem.
 */
export function windify<M extends T.MeshStandardMaterial>(material: M, shape: WindShape): M {
  const own = { windAmp: { value: shape.amp }, windOrigin: { value: new T.Vector3() }, windReach: { value: shape.kind === "leaf" ? shape.reach : 1 }, windTop: { value: shape.kind === "cloth" ? shape.top : 0 }, windHeight: { value: shape.kind === "cloth" ? shape.height : 1 } };
  const motion = shape.kind === "cloth"
    ? `float pin = clamp((windTop - transformed.y) / windHeight, 0.0, 1.0);
       float ripple = sin(windTime * 2.6 + transformed.x * 7.0 - transformed.y * 3.0) * .6 + sin(windTime * 4.3 + transformed.x * 13.0 + transformed.y * 5.0) * .4;
       transformed += objectNormal * ripple * windAmp * pin * pin * windStrength;`
    : `vec3 wp = (modelMatrix * vec4(transformed, 1.0)).xyz;
       float reach = ${shape.kind === "leaf" ? "smoothstep(0.0, windReach, distance(wp, windOrigin))" : "1.0"};
       vec3 sway = vec3(sin(windTime * 1.3 + wp.x * 1.7 + wp.z * .9), 0.0, cos(windTime * 1.1 + wp.z * 1.9 + wp.x * .6)) * .6
                 + vec3(sin(windTime * 5.3 + wp.x * 11.0 + wp.y * 7.0), sin(windTime * 6.1 + wp.z * 9.0) * .5, cos(windTime * 4.7 + wp.y * 13.0)) * .4;
       transformed += sway * windAmp * reach * windStrength;`;
  material.onBeforeCompile = shader => {
    if (shape.kind === "leaf") own.windOrigin.value.copy(typeof shape.origin === "function" ? shape.origin() : shape.origin);
    Object.assign(shader.uniforms, wind, own);
    shader.vertexShader = "uniform float windTime, windStrength, windAmp, windReach, windTop, windHeight; uniform vec3 windOrigin;\n" + shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\n{ ${motion} }`);
  };
  material.customProgramCacheKey = () => "wind-" + shape.kind;
  return material;
}
