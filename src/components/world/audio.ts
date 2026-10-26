// The flat's soundscape, synthesised on the device (no audio files). Every source sits at a real
// position behind an HRTF panner with distance roll-off, so things get louder as you approach.
// Indoor sources share a short room reverb; outdoor sources pass through a "walls and glass"
// low-pass that opens up when you step onto the balcony. Nothing plays until the sound toggle.
// Sound also travels like sound: every source belongs to a room, and reaches you along the best path through
// doorways (open or shut), window glass, the open balcony, or plain wall. Each hop muffles and quietens it, and
// through an open doorway it seems to come from the opening, the way sound bends around a corner. Each room
// has its own echo: short and soft in the bedroom, bright and ringing on the kitchen tiles, almost none outside.
import type { Location, Weather } from "./objects";
import type { DoorSound } from "./engine";
type Point = { x: number; y: number; z: number };
type Surface = "wood" | "tile";
type Room = Location | "outside";
type Spot = { at: Point; room: Room; panner: PannerNode; filter: BiquadFilterNode; level: GainNode };
type Reach = { trans: number; cutoff: number; via?: Point };
const surfaceOf: Record<Location, Surface> = { bedroom: "wood", archive: "wood", library: "wood", workshop: "tile", rooftop: "tile" };
/** Reverb by room: decay (s), wet level, brightness (0 dark … 1 bright), and early reflections (ms) from the nearest walls. */
const acoustics: Record<Location, { decay: number; wet: number; bright: number; early: number[] }> = {
  bedroom: { decay: .8, wet: .16, bright: .3, early: [9, 14, 21] }, // bed, rug and curtains soak it up
  archive: { decay: 1.3, wet: .22, bright: .5, early: [12, 19, 27] },
  library: { decay: 1, wet: .17, bright: .38, early: [11, 17, 24] }, // full shelves scatter and absorb
  workshop: { decay: 1.7, wet: .3, bright: .85, early: [8, 13, 18, 26] }, // tile and steel ring
  rooftop: { decay: .35, wet: .05, bright: .6, early: [6] }, // open air: one wall, then sky
};
function roomOf(p: Point): Room {
  if (p.y < -1 || p.x < -4.2 || p.x > 20.2 || p.z < -3.6 || p.z > 10) return "outside";
  if (p.x < 4) return "bedroom"; if (p.z > 3.25) return p.x < 12 ? "library" : "rooftop"; return p.x < 12 ? "archive" : "workshop";
}

export class RoomAudio {
  private ctx: AudioContext | null = null; private master!: GainNode; private indoor!: GainNode; private outdoor!: BiquadFilterNode; private outdoorGain!: GainNode;
  private noise: Record<"white" | "pink" | "brown", AudioBuffer> | null = null; private enabled = false; private lastStep = 0; private stepFoot = 0;
  private weather: Weather = "rain"; private fan = 1; private volume = .8; private location: Location = "bedroom";
  private fans: { lfo: OscillatorNode; air: GainNode; hum: GainNode }[] = []; private rainBeds: GainNode[] = []; private outsideRain!: GainNode; private birds = 0;
  private timers: number[] = []; private radio: { gain: GainNode; timer: number } | null = null; private kettle: GainNode | null = null;

  async toggle() {
    if (!this.ctx) this.build(); await this.ctx!.resume(); this.enabled = !this.enabled;
    this.master.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx!.currentTime, .3); if (this.enabled) this.ui("on"); return this.enabled;
  }
  get on() { return this.enabled; }
  /** Weather, fan speed and master volume from the control centre. */
  setOptions(o: { weather: Weather; fan?: number; volume?: number }) {
    this.weather = o.weather; this.fan = o.fan ?? 1; this.volume = o.volume ?? .8; if (!this.ctx) return; const t = this.ctx.currentTime;
    if (this.enabled) this.master.gain.setTargetAtTime(this.volume, t, .2);
    const rain = o.weather === "rain" ? 1 : 0; for (const g of this.rainBeds) g.gain.setTargetAtTime(.05 * rain, t, 1.2); this.outsideRain.gain.setTargetAtTime(.12 * rain, t, 1.2);
    for (const f of this.fans) { f.lfo.frequency.setTargetAtTime(Math.max(.01, 2 * this.fan), t, .8); f.air.gain.setTargetAtTime(.05 * Math.min(1.4, this.fan), t, .8); f.hum.gain.setTargetAtTime(this.fan > 0 ? .004 : 0, t, .8); }
  }
  listener(p: Point, forward: Point, moving: boolean, location?: Location, doors?: DoorSound[]) {
    if (!this.enabled || !this.ctx) return; const l = this.ctx.listener, t = this.ctx.currentTime;
    l.positionX.setTargetAtTime(p.x, t, .05); l.positionY.setTargetAtTime(p.y, t, .05); l.positionZ.setTargetAtTime(p.z, t, .05);
    l.forwardX.setTargetAtTime(forward.x, t, .05); l.forwardY.setTargetAtTime(forward.y, t, .05); l.forwardZ.setTargetAtTime(forward.z, t, .05); l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    this.here.x = p.x; this.here.y = p.y; this.here.z = p.z; if (doors) this.doors = doors;
    if (location && location !== this.location) { this.location = location; this.echo(location); }
    if (performance.now() - this.lastPropagation > 80) { this.lastPropagation = performance.now(); this.propagate(); }
    if (moving && performance.now() - this.lastStep > 500) { this.lastStep = performance.now(); this.footstep({ x: p.x, y: 0, z: p.z }, surfaceOf[this.location]); }
  }
  // ── propagation ──────────────────────────────────────────────────────────────
  private spots = new Set<Spot>(); private doors: DoorSound[] = []; private here: Point = { x: 1.3, y: 1.6, z: 2.1 }; private lastPropagation = 0; private reach = new Map<Room, Reach>();
  private verbs: Partial<Record<Location, { send: GainNode; wet: GainNode }>> = {}; private echoRoom: Location | null = null;
  /** How well sound gets from the listener's room to every other room: transmission, the muffling cutoff, and the first doorway it bends through. */
  private paths() {
    const from = roomOf(this.here), reach = this.reach; reach.clear(); reach.set(from, { trans: 1, cutoff: 20000 });
    const edges: [Room, Room, number, number, Point?][] = [];
    for (const d of this.doors) { const o = d.open; edges.push([d.rooms[0], d.rooms[1], .16 + .84 * o, 450 + 15500 * o * o, o > .12 ? d : undefined]); }
    for (const r of ["bedroom", "archive", "workshop", "library"] as Room[]) edges.push([r, "outside", .3, 700]); // through closed glass
    edges.push(["rooftop", "outside", 1, 20000], ["workshop", "rooftop", .06, 260]); // open air; a solid wall
    for (let pass = 0; pass < 5; pass++) for (const [a, b, trans, cutoff, via] of edges) for (const [x, y] of [[a, b], [b, a]] as [Room, Room][]) {
      const known = reach.get(x); if (!known) continue; const t = known.trans * trans, current = reach.get(y);
      if (!current || t > current.trans + 1e-4) reach.set(y, { trans: t, cutoff: Math.min(known.cutoff, cutoff), via: known.via ?? (x === from ? via : undefined) });
    }
    return from;
  }
  private propagate() { if (!this.ctx) return; const from = this.paths(); for (const s of this.spots) this.place(s, from); }
  /** Muffle and quieten a source by its path, and hear it from the doorway when it comes round a corner. */
  private place(s: Spot, from = roomOf(this.here), immediate = false) {
    const t = this.ctx!.currentTime, tau = immediate ? 0 : .12, r = this.reach.get(s.room) ?? { trans: .03, cutoff: 220 }; let x = s.at.x, y = s.at.y, z = s.at.z;
    if (r.via && s.room !== from) { const h = this.here, v = r.via, dx = v.x - h.x, dy = v.y - h.y, dz = v.z - h.z, near = Math.hypot(dx, dy, dz) || 1, far = Math.hypot(s.at.x - v.x, s.at.y - v.y, s.at.z - v.z), k = (near + far) / near; x = h.x + dx * k; y = h.y + dy * k; z = h.z + dz * k; }
    if (!tau) { s.level.gain.value = r.trans; s.filter.frequency.value = r.cutoff; s.panner.positionX.value = x; s.panner.positionY.value = y; s.panner.positionZ.value = z; return; }
    s.level.gain.setTargetAtTime(r.trans, t, tau); s.filter.frequency.setTargetAtTime(r.cutoff, t, tau);
    s.panner.positionX.setTargetAtTime(x, t, tau); s.panner.positionY.setTargetAtTime(y, t, tau); s.panner.positionZ.setTargetAtTime(z, t, tau);
  }
  /** Crossfade to the listener's room echo; only that room's reverb stays connected, so idle ones cost nothing. */
  private echo(room: Location) {
    if (!this.ctx || room === this.echoRoom) return; const ctx = this.ctx, t = ctx.currentTime, a = acoustics[room];
    let v = this.verbs[room];
    if (!v) { const verb = ctx.createConvolver(); verb.buffer = this.impulse(a.decay, a.bright, a.early); const send = ctx.createGain(), wet = ctx.createGain(); wet.gain.value = 0; send.connect(verb).connect(wet).connect(this.master); v = this.verbs[room] = { send, wet }; }
    if (!this.echoing.has(room)) { this.indoor.connect(v.send); this.echoing.add(room); } v.wet.gain.setTargetAtTime(a.wet, t, .25);
    for (const r of this.echoing) if (r !== room) this.verbs[r]!.wet.gain.setTargetAtTime(0, t, .25);
    this.echoRoom = room;
    this.later(1500, () => { for (const r of this.echoing) if (r !== this.echoRoom) { this.indoor.disconnect(this.verbs[r]!.send); this.echoing.delete(r); } });
  }
  private echoing = new Set<Location>();
  /** One-shot sounds for interactions, placed where they happen. */
  tick(at: Point = { x: 0, y: 1, z: 0 }, kind = "click") {
    if (!this.enabled || !this.ctx || document.hidden) return;
    if (kind.startsWith("door:")) return this.door(at);
    switch (kind) {
      case "lamp": return this.click(at, 2400, .05);
      case "drawer": return this.slide(at, .5);
      case "keyboard": for (let i = 0; i < 14; i++) this.later(i * 70 + Math.random() * 40, () => this.click(at, 3200 + Math.random() * 900, .025)); return;
      case "kettle": for (let i = 0; i < 3; i++) this.later(i * 140, () => this.click(at, 3600, .05)); this.later(450, () => this.slide(at, .6, 500)); return this.whistle(at);
      case "cat": return this.purr(at);
      case "duck": return this.squeak(at);
      case "swing": for (let i = 0; i < 6; i++) this.later(i * 1450, () => this.creak(at, .05 * (1 - i / 7))); return;
      case "radio": return this.toggleRadio(at);
      case "globe": return this.slide(at, .9, 900);
      case "chair": case "computer": case "laptop": return this.creak(at, .04);
      case "pet": return this.chirp(at);
      case "weather": this.click(at, 1400, .06); return this.slide(at, 1.4, 300);
      case "lab": return this.burst(at, { freq: 140, to: 420, type: "sawtooth", filter: ["lowpass", 900, 2], gain: .025, attack: .1, decay: .9 });
      case "telescope": this.click(at, 2600, .05); return this.later(160, () => this.slide(at, .5, 1400));
      case "record": this.click(at, 900, .06); return this.later(250, () => this.burst(at, { noise: "white", filter: ["highpass", 3000, .5], gain: .03, attack: .02, decay: 1.2 }));
      case "profile": case "about": this.click(at, 1100, .05); return this.rustle(at);
      case "contact": return this.burst(at, { noise: "pink", filter: ["bandpass", 2400, 1], gain: .06, attack: .08, decay: .45 });
      case "sound": return;
      default:
        if (kind.startsWith("skill:")) { this.slide(at, .25, 700); return this.later(230, () => this.burst(at, { freq: 140, to: 80, gain: .05, decay: .08 })); }
        if (kind.startsWith("project:")) { this.click(at, 1500, .05); return this.rustle(at); }
        return this.rustle(at);
    }
  }
  /** Interface sounds: quiet, close to the listener, never spatialised. */
  ui(kind: "click" | "toggle" | "slide" | "open" | "close" | "sheet" | "boot" | "key" | "lens" | "hover" | "on" | "enter") {
    if (!this.enabled || !this.ctx || document.hidden) return; const near = this.near();
    switch (kind) {
      case "click": return this.click(near, 2800, .035, this.master);
      case "toggle": this.click(near, 2200, .04, this.master); return this.later(45, () => this.click(near, 3200, .025, this.master));
      case "slide": return this.click(near, 4200, .012, this.master);
      case "key": return this.click(near, 3000 + Math.random() * 1200, .03, this.master);
      case "hover": return this.click(near, 5200, .006, this.master);
      case "open": return this.burst(near, { noise: "pink", filter: ["bandpass", 2600, .9], gain: .07, attack: .06, decay: .35, bus: this.master });
      case "close": return this.burst(near, { noise: "pink", filter: ["bandpass", 1700, .9], gain: .06, attack: .01, decay: .22, bus: this.master });
      case "sheet": return this.burst(near, { noise: "pink", filter: ["bandpass", 900, .7], gain: .05, attack: .12, decay: .5, bus: this.master });
      case "lens": return this.burst(near, { noise: "white", filter: ["bandpass", 1600, 4], gain: .03, attack: .05, decay: .35, bus: this.master });
      case "boot": [523.3, 659.3, 784, 1046.5].forEach((f, i) => this.later(i * 110, () => this.burst(near, { freq: f, gain: .03, attack: .02, decay: .9, bus: this.master }))); return;
      case "on": [392, 587.3].forEach((f, i) => this.later(i * 90, () => this.burst(near, { freq: f, gain: .03, decay: .4, bus: this.master }))); return;
      case "enter": this.door(this.near()); return;
    }
  }
  /** Movement cues from the walker: jumps and landings. */
  cue(kind: "jump" | "land", at: Point) {
    if (!this.enabled || !this.ctx) return;
    if (kind === "jump") return this.burst(at, { noise: "pink", filter: ["bandpass", 700, .8], gain: .04, attack: .02, decay: .2 });
    this.footstep(at, surfaceOf[this.location]); this.later(40, () => this.footstep(at, surfaceOf[this.location]));
  }
  // ── your music folder, played from the record player ─────────────────────────
  private song: { el: HTMLAudioElement; gain: GainNode; tracks: { title: string; src: string }[]; index: number } | null = null;
  private songListeners = new Set<(state: { title: string; index: number; count: number; playing: boolean } | null) => void>();
  /** Follow what the record player is playing; returns an unsubscribe function. */
  subscribeSong(fn: (state: { title: string; index: number; count: number; playing: boolean } | null) => void) { this.songListeners.add(fn); return () => { this.songListeners.delete(fn); }; }
  /** Play public/music tracks from a point in the room (louder close, fainter far). */
  async playFolder(tracks: { title: string; src: string }[], at: Point, index = 0) {
    if (!tracks.length) return false; if (!this.ctx) this.build(); if (!this.enabled) await this.toggle(); await this.ctx!.resume();
    if (!this.song) {
      const el = new Audio(); el.preload = "auto"; const gain = this.ctx!.createGain(); gain.gain.value = .9;
      this.ctx!.createMediaElementSource(el).connect(gain).connect(this.panner(at, 1.4, 1.5)).connect(this.indoor);
      el.addEventListener("ended", () => this.skip(1)); el.addEventListener("play", () => this.report()); el.addEventListener("pause", () => this.report());
      this.song = { el, gain, tracks, index };
    }
    this.song.tracks = tracks; this.load(index); return true;
  }
  private load(index: number) { const s = this.song!; s.index = (index + s.tracks.length) % s.tracks.length; s.el.src = s.tracks[s.index].src; void s.el.play().catch(() => this.report()); this.report(); }
  skip(step: number) { if (this.song) this.load(this.song.index + step); }
  pauseSong() { const s = this.song; if (!s) return; if (s.el.paused) void s.el.play(); else s.el.pause(); }
  stopSong() { const s = this.song; if (!s) return; s.el.pause(); this.songListeners.forEach(fn => fn(null)); }
  private report() { const s = this.song; if (!s) return; const state = { title: s.tracks[s.index].title, index: s.index, count: s.tracks.length, playing: !s.el.paused }; this.songListeners.forEach(fn => fn(state)); }
  private near(): Point { const l = this.ctx!.listener; return { x: l.positionX.value, y: l.positionY.value, z: l.positionZ.value + .3 }; }
  visibility() { if (!this.ctx) return; if (document.hidden) void this.ctx.suspend(); else if (this.enabled) void this.ctx.resume(); }
  dispose() { this.song?.el.pause(); this.timers.forEach(t => clearTimeout(t)); if (this.radio) clearInterval(this.radio.timer); void this.ctx?.close(); }

  // ── construction ─────────────────────────────────────────────────────────────
  private build() {
    const ctx = this.ctx = new AudioContext(); this.noise = { white: this.buffer("white"), pink: this.buffer("pink"), brown: this.buffer("brown") };
    this.master = ctx.createGain(); this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; this.master.connect(comp).connect(ctx.destination);
    // Indoor bus, with the echo of whichever room you are standing in.
    this.indoor = ctx.createGain(); this.indoor.connect(this.master); this.echo(this.location);
    // Outdoor bus: each outdoor source is muffled by its own path (glass, or the open balcony), so the bus stays open.
    this.outdoor = ctx.createBiquadFilter(); this.outdoor.type = "lowpass"; this.outdoor.frequency.value = 20000; this.outdoorGain = ctx.createGain(); this.outdoorGain.gain.value = 1; this.outdoor.connect(this.outdoorGain).connect(this.master);
    // Ceiling fans: blade-rate swish over a motor hum.
    for (const at of [{ x: -1.2, y: 3.9, z: .6 }, { x: 8.6, y: 3.9, z: -1 }]) {
      const air = ctx.createGain(); air.gain.value = .05; const swish = ctx.createGain(); swish.gain.value = .6; const lfo = ctx.createOscillator(); lfo.frequency.value = 2; const depth = ctx.createGain(); depth.gain.value = .4; lfo.connect(depth).connect(swish.gain); lfo.start();
      this.loop("pink", [this.filter("bandpass", 420, .8)], swish); swish.connect(air).connect(this.panner(at, 1.2, 1.8)).connect(this.indoor);
      const hum = ctx.createGain(); hum.gain.value = .004; this.tone(100, "sine", hum); hum.connect(this.panner(at, 1, 2)).connect(this.indoor);
      this.fans.push({ lfo, air, hum });
    }
    // The desk computer: fan hiss and a faint electrical hum.
    const pc = ctx.createGain(); pc.gain.value = .02; this.loop("white", [this.filter("lowpass", 900, .7)], pc); const coil = ctx.createGain(); coil.gain.value = .0015; this.tone(120, "sine", coil); coil.connect(pc); pc.connect(this.panner({ x: 1.6, y: .5, z: -2.3 }, .6, 2.2)).connect(this.indoor);
    // Fridge compressor that cycles on and off.
    const fridge = ctx.createGain(); fridge.gain.value = 0; const motor = ctx.createGain(); motor.gain.value = .5; this.tone(50, "sawtooth", motor); motor.connect(this.filter("lowpass", 160, 1)).connect(fridge); fridge.connect(this.panner({ x: 19.45, y: .6, z: -2.8 }, .8, 2)).connect(this.indoor);
    const cycle = (on: boolean) => { fridge.gain.setTargetAtTime(on ? .05 : 0, ctx.currentTime, 1.5); this.later(on ? 26000 : 19000, () => cycle(!on)); }; cycle(true);
    // Living-room clock.
    const tickTock = () => { this.click({ x: 10.75, y: 2.75, z: -3.1 }, 4200, .012, this.indoor); this.later(1000, tickTock); }; tickTock();
    // Rain on each window, and the open-air rain bed outside.
    for (const at of [{ x: -1.9, y: 2.4, z: -3.4 }, { x: 8, y: 2, z: -3.4 }, { x: 16.4, y: 2.2, z: -3.4 }, { x: 8, y: 2, z: 9.9 }]) { const g = ctx.createGain(); g.gain.value = .05; this.loop("pink", [this.filter("highpass", 900, .5), this.filter("lowpass", 6000, .5)], g); g.connect(this.panner(at, 1, 1.6)).connect(this.master); this.rainBeds.push(g); }
    this.outsideRain = ctx.createGain(); this.outsideRain.gain.value = .12; this.loop("pink", [this.filter("lowpass", 7000, .5)], this.outsideRain); this.outsideRain.connect(this.panner({ x: 18, y: 1, z: 8 }, 6, .6)).connect(this.outdoor);
    // The street: traffic rumble, horns now and then, and a neighbour's pressure cooker.
    const traffic = ctx.createGain(); traffic.gain.value = .09; this.loop("brown", [this.filter("lowpass", 380, .6)], traffic); traffic.connect(this.panner({ x: 10, y: -11, z: 19.5 }, 10, .8)).connect(this.outdoor);
    const horn = () => { const x = -40 + Math.random() * 100, at = { x, y: -10.5, z: 18 + Math.random() * 3 }, pair = Math.random() > .5; this.honk(at, pair); this.later(5000 + Math.random() * 14000, horn); }; this.later(4000, horn);
    const cooker = () => { this.cookerWhistle({ x: -14, y: -4, z: -15 }); this.later(70000 + Math.random() * 60000, cooker); }; this.later(25000, cooker);
    // Birds over the park in daylight.
    const birds = () => { if (this.weather === "day" || this.weather === "sunset") { this.birds++; this.chirp({ x: 30 + Math.random() * 16, y: 4 + Math.random() * 6, z: -8 + Math.random() * 16 }, this.outdoor); } this.later(900 + Math.random() * 2600, birds); }; birds();
    this.setOptions({ weather: this.weather, fan: this.fan, volume: this.volume });
  }

  // ── helpers ──────────────────────────────────────────────────────────────────
  private later(ms: number, fn: () => void) { const id = window.setTimeout(() => { this.timers = this.timers.filter(t => t !== id); fn(); }, ms); this.timers.push(id); }
  private buffer(kind: "white" | "pink" | "brown") {
    const ctx = this.ctx!, data = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = data.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1;
      if (kind === "white") d[i] = w * .5; else if (kind === "brown") { last = (last + .02 * w) / 1.02; d[i] = last * 3.2; } else { b0 = .99765 * b0 + w * .099; b1 = .963 * b1 + w * .2965; b2 = .57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * .1848) * .18; } }
    return data;
  }
  /** A room's echo: a few early reflections off the nearest walls, then a diffuse tail that darkens as it decays. */
  private impulse(seconds: number, bright = .6, early: number[] = []) {
    const ctx = this.ctx!, rate = ctx.sampleRate, len = Math.floor(rate * seconds), b = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c); let low = 0;
      for (let i = 0; i < len; i++) { const k = i / len, smooth = .15 + .8 * (1 - bright) * (.4 + k); low += (Math.random() * 2 - 1 - low) * (1 - smooth); d[i] = low * Math.pow(1 - k, 3.2); }
      early.forEach((ms, j) => { const at = Math.floor((ms + c * 1.3 + j * .7) * rate / 1000); if (at < len) d[at] += (j % 2 ? -.55 : .7) * Math.pow(.72, j); });
    }
    return b;
  }
  private filter(type: BiquadFilterType, frequency: number, q: number) { const f = this.ctx!.createBiquadFilter(); f.type = type; f.frequency.value = frequency; f.Q.value = q; return f; }
  private loop(kind: "white" | "pink" | "brown", chain: AudioNode[], out: AudioNode) { const s = this.ctx!.createBufferSource(); s.buffer = this.noise![kind]; s.loop = true; s.loopStart = Math.random(); let node: AudioNode = s; for (const n of chain) node = node.connect(n); node.connect(out); s.start(0, Math.random() * 3); return s; }
  private tone(freq: number, type: OscillatorType, out: AudioNode) { const o = this.ctx!.createOscillator(); o.type = type; o.frequency.value = freq; o.connect(out); o.start(); return o; }
  /** A placed source. Callers connect into the panner as before; what they connect onward leaves after the path's muffling. */
  private panner(p: Point, ref = 1.5, rolloff = 1.4) {
    const n = this.ctx!.createPanner(); n.panningModel = "HRTF"; n.distanceModel = "inverse"; n.refDistance = ref; n.maxDistance = 60; n.rolloffFactor = rolloff; n.positionX.value = p.x; n.positionY.value = p.y; n.positionZ.value = p.z;
    const filter = this.filter("lowpass", 20000, .5), level = this.ctx!.createGain(), spot: Spot = { at: p, room: roomOf(p), panner: n, filter, level };
    n.connect(filter).connect(level);
    const nativeDisconnect = n.disconnect.bind(n) as () => void;
    Object.assign(n, { connect: (destination: AudioNode) => level.connect(destination), disconnect: () => { nativeDisconnect(); filter.disconnect(); level.disconnect(); this.spots.delete(spot); } });
    if (!this.reach.size) this.paths(); this.place(spot, roomOf(this.here), true); this.spots.add(spot); return n;
  }
  /** A short burst: noise or tone through a filter and an envelope, at a place, then cleaned up. */
  private burst(at: Point, o: { noise?: "white" | "pink" | "brown"; freq?: number; to?: number; type?: OscillatorType; filter?: [BiquadFilterType, number, number]; gain: number; attack?: number; decay: number; bus?: AudioNode; ref?: number }) {
    const ctx = this.ctx!, t = ctx.currentTime, g = ctx.createGain(), p = this.panner(at, o.ref ?? 1.2, 1.5);
    let src: AudioScheduledSourceNode;
    if (o.noise) { const s = ctx.createBufferSource(); s.buffer = this.noise![o.noise]; src = s; s.start(t, Math.random() * 3, o.decay + .1); }
    else { const osc = ctx.createOscillator(); osc.type = o.type ?? "sine"; osc.frequency.setValueAtTime(o.freq ?? 440, t); if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.decay); src = osc; osc.start(t); osc.stop(t + o.decay + .1); }
    let node: AudioNode = src; if (o.filter) node = node.connect(this.filter(...o.filter));
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.gain, t + (o.attack ?? .004)); g.gain.exponentialRampToValueAtTime(.0001, t + o.decay);
    node.connect(g).connect(p).connect(o.bus ?? this.indoor); src.onended = () => { src.disconnect(); g.disconnect(); p.disconnect(); };
  }
  private footstep(at: Point, surface: Surface) {
    this.stepFoot ^= 1; const v = .85 + Math.random() * .3;
    if (surface === "wood") { this.burst(at, { noise: "brown", filter: ["lowpass", 420 * v, 1], gain: .16, decay: .12 }); this.burst(at, { freq: 75 * v, to: 45, gain: .08, decay: .09 }); if (Math.random() > .86) this.creak(at, .015); }
    else { this.burst(at, { noise: "white", filter: ["bandpass", 2600 * v, 1.4], gain: .07, decay: .05 }); this.burst(at, { freq: 110 * v, to: 60, gain: .05, decay: .06 }); }
  }
  private click(at: Point, freq: number, gain: number, bus?: AudioNode) { this.burst(at, { noise: "white", filter: ["bandpass", freq, 6], gain, decay: .03, bus }); }
  private creak(at: Point, gain: number) { this.burst(at, { freq: 190 + Math.random() * 60, to: 120, type: "sawtooth", filter: ["bandpass", 900, 9], gain, attack: .08, decay: .55 }); }
  private door(at: Point) { this.creak(at, .06); this.later(380, () => this.click(at, 1800, .08)); }
  private slide(at: Point, seconds: number, freq = 600) { this.burst(at, { noise: "pink", filter: ["bandpass", freq, 2], gain: .08, attack: .05, decay: seconds }); }
  private rustle(at: Point) { this.burst(at, { noise: "white", filter: ["bandpass", 3200, 1.2], gain: .05, attack: .02, decay: .25 }); }
  private squeak(at: Point) { this.burst(at, { freq: 1200, to: 1900, type: "square", filter: ["lowpass", 3000, 1], gain: .03, decay: .18 }); this.later(200, () => this.burst(at, { freq: 1500, to: 1100, type: "square", filter: ["lowpass", 3000, 1], gain: .025, decay: .15 })); }
  private chirp(at: Point, bus?: AudioNode) { const base = 2400 + Math.random() * 1600; for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) this.later(i * 120, () => this.burst(at, { freq: base, to: base * (1.3 + Math.random() * .4), gain: .02, decay: .09, bus, ref: 3 })); }
  private purr(at: Point) { const ctx = this.ctx!, g = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain(), p = this.panner(at, .8, 1.6); g.gain.value = 0; lfo.frequency.value = 24; depth.gain.value = .05; lfo.connect(depth).connect(g.gain); lfo.start();
    const s = this.loop("brown", [this.filter("lowpass", 260, 1)], g); g.connect(p).connect(this.indoor); this.later(2600, () => { s.stop(); lfo.stop(); g.disconnect(); p.disconnect(); }); }
  private whistle(at: Point) {
    if (this.kettle) return; const ctx = this.ctx!, g = ctx.createGain(), o = ctx.createOscillator(), vib = ctx.createOscillator(), vd = ctx.createGain(), p = this.panner(at, 1, 1.5);
    o.frequency.value = 1750; vib.frequency.value = 6; vd.gain.value = 18; vib.connect(vd).connect(o.frequency); g.gain.value = 0; g.gain.setTargetAtTime(.035, ctx.currentTime + 3, 1.5);
    o.connect(g).connect(p).connect(this.indoor); o.start(); vib.start(); this.kettle = g;
    this.later(9000, () => { g.gain.setTargetAtTime(0, ctx.currentTime, .3); this.later(1200, () => { o.stop(); vib.stop(); g.disconnect(); p.disconnect(); this.kettle = null; }); });
  }
  private honk(at: Point, pair: boolean) { const tone = (d: number) => { this.burst(at, { freq: 420, type: "square", filter: ["lowpass", 1800, 1], gain: .05, attack: .01, decay: .28, bus: this.outdoor, ref: 6 }); this.burst(at, { freq: 528, type: "square", filter: ["lowpass", 1800, 1], gain: .04, attack: .01, decay: .28, bus: this.outdoor, ref: 6 }); void d; }; tone(0); if (pair) this.later(340, () => tone(1)); }
  private cookerWhistle(at: Point) { this.burst(at, { noise: "white", filter: ["bandpass", 2100, 8], gain: .09, attack: .25, decay: 1.6, bus: this.outdoor, ref: 8 }); }
  /** Kitchen radio: a slow lo-fi loop (keys, bass, soft drums, crackle) through a small speaker, placed at the radio. */
  private toggleRadio(at: Point) {
    const ctx = this.ctx!; if (this.radio) { const r = this.radio; clearInterval(r.timer); r.gain.gain.setTargetAtTime(0, ctx.currentTime, .2); this.later(800, () => r.gain.disconnect()); this.radio = null; return; }
    const gain = ctx.createGain(); gain.gain.value = 0; gain.gain.setTargetAtTime(.5, ctx.currentTime, .4); const speaker = this.filter("bandpass", 1100, .45); gain.connect(speaker).connect(this.panner(at, 1, 1.7)).connect(this.indoor);
    const crackle = ctx.createGain(); crackle.gain.value = .02; this.loop("white", [this.filter("highpass", 3000, .5)], crackle).playbackRate.value = .3; crackle.connect(gain);
    const chords = [[220, 261.6, 329.6, 392], [146.8, 174.6, 220, 261.6], [196, 246.9, 293.7, 349.2], [130.8, 164.8, 196, 246.9]], beat = 60 / 72; let step = 0, next = ctx.currentTime + .1;
    const voice = (f: number, t: number, len: number, type: OscillatorType, level: number) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + len); o.connect(g).connect(gain); o.start(t); o.stop(t + len + .05); o.onended = () => { o.disconnect(); g.disconnect(); }; };
    const noiseHit = (t: number, f: number, len: number, level: number) => { const s = ctx.createBufferSource(), g = ctx.createGain(), fl = this.filter("bandpass", f, 1); s.buffer = this.noise!.white; g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(.0001, t + len); s.connect(fl).connect(g).connect(gain); s.start(t, Math.random(), len + .05); s.onended = () => { s.disconnect(); g.disconnect(); }; };
    const schedule = () => {
      while (next < ctx.currentTime + .4) {
        const bar = Math.floor(step / 8) % 4, eighth = step % 8, chord = chords[bar], t = next;
        if (eighth === 0) { chord.forEach(f => { voice(f, t, beat * 3.6, "triangle", .028); voice(f * 1.003, t, beat * 3.6, "sine", .02); }); voice(chord[0] / 2, t, beat * 1.8, "sine", .09); }
        if (eighth === 4) voice(chord[0] / 2, t, beat * 1.6, "sine", .07);
        if (eighth === 0 || eighth === 5) voice(110, t, .25, "sine", .12); // soft kick
        if (eighth === 2 || eighth === 6) noiseHit(t, 1800, .18, .06); // brushed snare
        noiseHit(t, 8000, .04, .015); // hat
        if (Math.random() > .7) voice(chord[(eighth + bar) % 4] * 2, t, beat * .8, "sine", .018);
        step++; next += beat / 2;
      }
    };
    schedule(); this.radio = { gain, timer: window.setInterval(schedule, 120) };
  }
}
