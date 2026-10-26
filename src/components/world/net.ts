// Multiplayer for the den: friends who type the same room code share this world, peer to peer.
//
// Every visitor gets a personal WebRTC peer (PeerJS, brokered by its free public server, so there is no game
// server to run). The room code is hashed into a meeting-point id: whoever holds it (the "keeper") only hands
// newcomers the list of members; everyone then connects to everyone (a mesh, fine for a handful of friends).
// If the keeper leaves, the others race to take the meeting point over, so the room keeps working.
// Movement goes out ~15 times a second; voice is a WebRTC audio call between each pair, placed in 3D by audio.ts.
import type { DataConnection, MediaConnection, Peer as PeerType } from "peerjs";
import type { Location } from "./objects";
import type { Outfit } from "./avatar";

export const MAX_PLAYERS = 8;
export interface PlayerState { x: number; y: number; z: number; yaw: number; pitch: number; speed: number; grounded: boolean; room: Location; /** The seat they are sitting on (a perch id), if any. */ seat?: string }
export interface Player { id: string; name: string; color: string; talking: boolean; mic: boolean; state: PlayerState | null; outfit?: Outfit }
type Message =
  | { t: "hello"; name: string; color: string; mic: boolean; outfit?: Outfit }
  | { t: "roster"; ids: string[] }
  | ({ t: "s" } & PlayerState)
  | { t: "talk"; on: boolean }
  | { t: "door"; id: string; open: boolean }
  | { t: "gesture"; g: string }
  | { t: "bye" }
  | { t: "music"; i: number; time: number; playing: boolean; sent: number };
export interface LobbyEvents {
  /** Connection status for the UI. */
  status: (phase: "idle" | "connecting" | "in-room" | "error", text: string) => void;
  /** The roster changed (someone joined, left, renamed, started or stopped talking). */
  roster: (players: Player[]) => void;
  move: (id: string, state: PlayerState) => void;
  leave: (id: string) => void;
  voice: (id: string, stream: MediaStream) => void;
  door: (id: string, open: boolean) => void;
  /** A friend waved, pointed, gave a thumbs up, clapped or danced. */
  gesture: (id: string, kind: string) => void;
  /** A friend played, paused, skipped or seeked on the record player (or it is the steady keep-in-step beat). */
  music: (id: string, song: { index: number; time: number; playing: boolean; sent: number }) => void;
}
// Across different networks a direct connection often fails, so a TURN relay is added when the site has one
// (see app/api/turn). Fetched fresh for each join: relay credentials are short-lived.
const STUN_ONLY: RTCConfiguration = { iceServers: [{ urls: ["stun:stun.cloudflare.com:3478", "stun:stun.l.google.com:19302"] }] };
function iceConfig(): Promise<{ relay: boolean; config: RTCConfiguration }> {
  return fetch("/api/turn", { cache: "no-store" }).then(r => r.json()).then((d: { relay: boolean; iceServers: RTCIceServer[] }) => ({ relay: Boolean(d.relay), config: { iceServers: d.iceServers } })).catch(() => ({ relay: false, config: STUN_ONLY }));
}
const NO_RELAY = "Couldn’t connect to the room. Players on different networks (say Wi-Fi and mobile data) need a relay server, which this site hasn’t set up yet. On the same Wi-Fi it works.";

/** Room codes: letters, digits and dashes, 3 to 24 long, case-insensitive. */
export function cleanCode(code: string) { return code.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24); }
export function randomCode() { const words = ["chai", "mango", "monsoon", "kite", "lassi", "jhoola", "neem", "tabla", "diya", "rickshaw"]; return `${words[Math.floor(Math.random() * words.length)]}-${Math.floor(10 + Math.random() * 90)}`; }
async function meetingPoint(code: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("dy-den/" + code)));
  return "dyden-" + Array.from(bytes.slice(0, 10), b => b.toString(16).padStart(2, "0")).join("");
}

export class Lobby {
  private Peer: typeof PeerType | null = null; private me: PeerType | null = null; private keeper: PeerType | null = null; private point = "";
  private links = new Map<string, { data: DataConnection; call?: MediaConnection; player: Player }>();
  // Heartbeat: friends send their position many times a second, so one silent for 20 s has gone (a crash, a dropped
  // network, a closed laptop) even if the connection never said so.
  private seen = new Map<string, number>(); private watchdog = 0;
  private config: RTCConfiguration = STUN_ONLY; private relay = false;
  private mic: MediaStream | null = null; private self: { name: string; color: string; mic: boolean; outfit?: Outfit } = { name: "", color: "", mic: false }; private left = false;
  constructor(private events: LobbyEvents) {}
  get id() { return this.me?.id ?? ""; }
  get players() { return Array.from(this.links.values(), l => l.player); }
  get micStream() { return this.mic; }

  async join(code: string, name: string, color: string, wantMic: boolean, outfit?: Outfit) {
    clearInterval(this.watchdog); this.watchdog = window.setInterval(() => { const now = performance.now(); for (const id of Array.from(this.links.keys())) if (now - (this.seen.get(id) ?? now) > 20000) this.drop(id); }, 2000);
    this.leave(); this.left = false; this.self = { name, color, mic: false, outfit };
    this.events.status("connecting", "Finding your room…");
    if (wantMic) {
      try { this.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); this.self.mic = true; }
      catch { this.events.status("connecting", "No microphone, so you can listen but not talk. Finding your room…"); }
    }
    const [{ Peer }, ice] = await Promise.all([import("peerjs"), iceConfig()]); this.Peer = Peer; this.config = ice.config; this.relay = ice.relay; this.point = await meetingPoint(cleanCode(code));
    const me = this.me = new Peer({ config: this.config, debug: 0 });
    me.on("connection", data => this.accept(data));
    me.on("call", call => this.answer(call));
    me.on("error", error => { if (!this.left && ["network", "server-error", "socket-error", "socket-closed", "browser-incompatible"].includes(error.type)) this.events.status("error", "Couldn’t reach the matchmaking server. Check your connection and try again."); });
    me.on("disconnected", () => { if (!this.left) me.reconnect(); });
    await new Promise<void>((resolve, reject) => { me.once("open", () => resolve()); me.once("error", reject); }).catch(() => undefined);
    if (!me.open) return;
    await this.claim();
    if (!this.keeper) this.askKeeper();
    else this.events.status("in-room", "You’re the first one here. Share the code: friends who type it join you.");
  }
  /** Try to hold the meeting point. Only one peer can; the others get "unavailable-id". */
  private claim() {
    return new Promise<void>(resolve => {
      if (!this.Peer || this.left) { resolve(); return; }
      const keeper = new this.Peer(this.point, { config: this.config, debug: 0 }); let settled = false;
      const done = (ok: boolean) => { if (settled) return; settled = true; if (ok) { this.keeper = keeper; keeper.on("connection", c => c.on("open", () => { c.send({ t: "roster", ids: [this.id, ...this.links.keys()] } satisfies Message); setTimeout(() => c.close(), 4000); })); } else keeper.destroy(); resolve(); };
      keeper.once("open", () => done(true)); keeper.once("error", () => done(false)); setTimeout(() => done(false), 8000);
    });
  }
  private askKeeper() {
    const ask = this.me!.connect(this.point, { reliable: true });
    const timer = setTimeout(() => { ask.close(); this.events.status("error", this.relay ? "The room didn’t answer. Try the code again in a moment." : NO_RELAY); }, 15000);
    ask.on("data", raw => { const m = raw as Message; if (m.t !== "roster") return; clearTimeout(timer); ask.close();
      const others = m.ids.filter(id => id !== this.id).slice(0, MAX_PLAYERS - 1);
      for (const id of others) this.dial(id);
      this.events.status("in-room", others.length ? `Joining ${others.length === 1 ? "your friend" : `${others.length} friends`}…` : "You’re the first one here. Share the code: friends who type it join you."); });
  }
  private dial(id: string) { if (this.links.has(id) || id === this.id || !this.me) return; this.accept(this.me.connect(id, { reliable: true })); }
  private accept(data: DataConnection) {
    if (data.peer === this.point) return;
    if (this.links.size >= MAX_PLAYERS - 1) { data.on("open", () => data.close()); return; }
    const player: Player = { id: data.peer, name: "Friend", color: "#e0a526", talking: false, mic: false, state: null };
    this.links.set(data.peer, { data, player });
    // A friend whose connection never opens (blocked network, no relay) is dropped rather than left as a ghost.
    const giveUp = setTimeout(() => { if (data.open) return; this.drop(data.peer); if (!this.left && !this.relay) this.events.status("in-room", "A friend couldn’t connect: you’re likely on different networks, and this site has no relay server yet."); }, 15000);
    data.on("open", () => { clearTimeout(giveUp); data.send({ t: "hello", ...this.self } satisfies Message); });
    data.on("data", raw => this.receive(data.peer, raw as Message));
    const gone = () => this.drop(data.peer); data.on("close", gone); data.on("error", gone);
  }
  private receive(id: string, m: Message) {
    const link = this.links.get(id); if (!link) return; this.seen.set(id, performance.now());
    switch (m.t) {
      case "hello": link.player.name = m.name.slice(0, 24) || "Friend"; link.player.color = /^#[0-9a-f]{6}$/i.test(m.color) ? m.color : "#e0a526"; link.player.mic = m.mic;
        { const o = m.outfit, hex = (v: unknown) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v); link.player.outfit = o && hex(o.top) && hex(o.bottom) && hex(o.shoes) && hex(o.hair) ? { top: o.top, bottom: o.bottom, shoes: o.shoes, hair: o.hair } : undefined; }
        this.emitRoster(); this.callIfMine(id); this.events.status("in-room", `${this.links.size + 1} in the room`); break;
      case "s": { const { t: _t, ...state } = m; void _t; if (state.seat !== undefined && (typeof state.seat !== "string" || state.seat.length > 32)) delete state.seat; link.player.state = state; this.events.move(id, state); break; }
      case "talk": link.player.talking = m.on; this.emitRoster(); break;
      case "door": this.events.door(m.id, m.open); break;
      case "bye": this.drop(id); break; // left on purpose (or closed the tab): gone at once, not after a timeout
      case "music": if ([m.i, m.time, m.sent].every(n => typeof n === "number" && Number.isFinite(n)) && m.i >= 0 && m.i < 1000) this.events.music(id, { index: m.i, time: m.time, playing: Boolean(m.playing), sent: m.sent }); break;
      case "gesture": if (typeof m.g === "string" && m.g.length < 12) this.events.gesture(id, m.g); break;
    }
  }
  /** One call per pair: whoever has a microphone calls (both have one: the smaller id calls); the answer carries the other voice back. */
  private callIfMine(id: string) {
    const link = this.links.get(id); if (!link || link.call || !this.me || !this.mic) return;
    if (link.player.mic && this.id > id) return;
    const call = this.me.call(id, this.mic); this.wire(id, call);
  }
  private answer(call: MediaConnection) { if (!this.links.has(call.peer)) { call.close(); return; } call.answer(this.mic ?? undefined); this.wire(call.peer, call); }
  private wire(id: string, call: MediaConnection) {
    const link = this.links.get(id); if (!link) { call.close(); return; } link.call = call;
    call.on("stream", stream => this.events.voice(id, stream));
    call.on("close", () => { if (link.call === call) link.call = undefined; });
  }
  private drop(id: string) {
    const link = this.links.get(id); if (!link) return; this.links.delete(id); this.seen.delete(id); link.call?.close(); link.data.close();
    this.events.leave(id); this.emitRoster();
    if (!this.left) { this.events.status("in-room", this.links.size ? `${this.links.size + 1} in the room` : "Your friends left. The room stays open."); if (!this.keeper) setTimeout(() => { if (!this.keeper && !this.left) void this.claim(); }, 300 + Math.random() * 1500); }
  }
  private emitRoster() { this.events.roster(this.players); }
  private broadcast(m: Message) { for (const { data } of this.links.values()) if (data.open) data.send(m); }
  send(state: PlayerState) { this.broadcast({ t: "s", ...state }); }
  talking(on: boolean) { this.broadcast({ t: "talk", on }); }
  door(id: string, open: boolean) { this.broadcast({ t: "door", id, open }); }
  gesture(kind: string) { this.broadcast({ t: "gesture", g: kind }); }
  music(index: number, time: number, playing: boolean) { this.broadcast({ t: "music", i: index, time, playing, sent: Date.now() }); }
  /** Mute or unmute without renegotiating: the track keeps flowing, silent. */
  setMuted(muted: boolean) { this.mic?.getAudioTracks().forEach(t => { t.enabled = !muted; }); }
  leave() {
    if (this.links.size) this.broadcast({ t: "bye" }); clearInterval(this.watchdog);
    this.left = true; for (const id of Array.from(this.links.keys())) this.drop(id);
    this.keeper?.destroy(); this.keeper = null; this.me?.destroy(); this.me = null; this.mic?.getTracks().forEach(t => t.stop()); this.mic = null;
    this.events.status("idle", ""); this.events.roster([]);
  }
}
