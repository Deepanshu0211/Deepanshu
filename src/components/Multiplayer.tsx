"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {RECORD_PLAYER} from "./MusicPlayer";
import type {WorldEngine} from "./world/engine";
import {GESTURES,type Gesture} from "./world/gestures";
import type {RoomAudio} from "./world/audio";
import {Lobby,cleanCode,randomCode,type Player} from "./world/net";
import {randomOutfit} from "./world/avatar";
import styles from "./Multiplayer.module.css";

const SWATCHES=["#2f4f43","#b4532a","#2d3a6b","#e0a526","#7a4b3a","#8a3b6b"];
type Phase="idle"|"connecting"|"in-room"|"error";
/** Doors you open travel to friends through this bus (CozyPortfolio passes the engine's door events in). */
export const netBus=new EventTarget();

// Play with friends: the same room code puts you in the same world. Movement, doors and voices are shared
// peer to peer (world/net.ts); voices come out of each friend's avatar, muffled by walls (world/audio.ts).
export default function Multiplayer({open,onClose,onJoined,onTrouble,getEngine,getAudio,initialCode,touch}:{open:boolean;onClose:()=>void;onJoined:(walk:boolean)=>void;onTrouble:()=>void;getEngine:()=>WorldEngine|null;getAudio:()=>RoomAudio;initialCode:string;touch:boolean}){
 const trouble=useRef(onTrouble);useEffect(()=>{trouble.current=onTrouble;});
 // Music in sync: whoever last pressed play, pause, skip or seek leads; everyone else follows (tracks come from the
 // site's music folder, so everyone has the same files).
 const leading=useRef(false),following=useRef(0),trackList=useRef<Promise<{title:string;src:string}[]>|null>(null);
 const songs=useCallback(()=>trackList.current??=fetch("/api/music").then(r=>r.json()).then((d:{tracks:{title:string;src:string}[]})=>d.tracks).catch(()=>[]),[]);
 const lobby=useRef<Lobby|null>(null),friends=useRef(new Map<string,Player>()),talking=useRef({me:false,friends:new Map<string,boolean>()});
 const [phase,setPhase]=useState<Phase>("idle"),[status,setStatus]=useState(""),[players,setPlayers]=useState<Player[]>([]),[room,setRoom]=useState("");
 const [code,setCode]=useState(initialCode),[name,setName]=useState(""),[color,setColor]=useState(SWATCHES[0]),[mic,setMic]=useState(true),[muted,setMuted]=useState(false),[ptt,setPtt]=useState(false),[meTalking,setMeTalking]=useState(false),[copied,setCopied]=useState(false),[hasMic,setHasMic]=useState(false);
 // Remembered per browser (storage can be unavailable, so it is guarded).
 useEffect(()=>{const frame=requestAnimationFrame(()=>{try{setName(localStorage.getItem("dy-world-name")??`Guest ${Math.floor(100+Math.random()*900)}`);const c=localStorage.getItem("dy-world-color");if(c&&SWATCHES.includes(c))setColor(c);}catch{setName(`Guest ${Math.floor(100+Math.random()*900)}`);}});return()=>cancelAnimationFrame(frame);},[]);
 useEffect(()=>{if(initialCode){const frame=requestAnimationFrame(()=>setCode(initialCode));return()=>cancelAnimationFrame(frame);}},[initialCode]);
 // The lobby, wired to the world and the sound.
 useEffect(()=>{
  const l=new Lobby({
   status:(p,text)=>{setPhase(p);setStatus(text);if(p==="error")trouble.current();},
   roster:list=>{const seen=new Set(list.map(p=>p.id));for(const id of friends.current.keys())if(!seen.has(id))friends.current.delete(id);for(const p of list){friends.current.set(p.id,p);getEngine()?.friend(p.id,p.name,p.color,talking.current.friends.get(p.id)??false,p.outfit);}setPlayers(list);},
   move:(id,s)=>{getEngine()?.moveFriend(id,s);getAudio().moveVoice(id,s.x,s.y+1.55,s.z);},
   leave:id=>{getEngine()?.dropFriend(id);getAudio().dropVoice(id);talking.current.friends.delete(id);},
   voice:(id,stream)=>{const s=friends.current.get(id)?.state;void getAudio().voice(id,stream,{x:s?.x??0,y:(s?.y??0)+1.55,z:s?.z??0});},
   door:(id,isOpen)=>getEngine()?.setDoor(id,isOpen),
   gesture:(id,kind)=>{if(kind in GESTURES)getEngine()?.friendGesture(id,kind as Gesture);},
   // A friend's record player: follow it (latency compensated) and let them lead until someone else presses a control.
   music:(_id,m)=>{leading.current=false;following.current=performance.now()+1500;const time=m.time+(m.playing?Math.max(0,Math.min(5,(Date.now()-m.sent)/1000)):0);void songs().then(list=>getAudio().followSong(list,RECORD_PLAYER,m.index,time,m.playing));},
  });
  lobby.current=l;const door=(e:Event)=>{const {id,open:o}=(e as CustomEvent<{id:string;open:boolean}>).detail;l.door(id,o);};netBus.addEventListener("door",door);const gesture=(e:Event)=>l.gesture((e as CustomEvent<string>).detail);netBus.addEventListener("gesture",gesture);
  // Closing or leaving the page disconnects straight away (friends see you go at once).
  const bye=()=>l.leave();window.addEventListener("pagehide",bye);window.addEventListener("beforeunload",bye);
  return()=>{window.removeEventListener("pagehide",bye);window.removeEventListener("beforeunload",bye);netBus.removeEventListener("door",door);netBus.removeEventListener("gesture",gesture);l.leave();lobby.current=null;};
 },[getEngine,getAudio,songs]);
 // In a room: send where you are ~15 times a second, and watch who is talking (for tags and the music ducking).
 useEffect(()=>{
  if(phase!=="in-room")return;let tick=0;
  const timer=window.setInterval(()=>{const l=lobby.current,e=getEngine();if(!l||!e)return;l.send(e.localState());
   if(++tick%2)return;const levels=getAudio().levels(),me=levels.me>.07;if(me!==talking.current.me){talking.current.me=me;setMeTalking(me);l.talking(me);}
   for(const [id,level] of levels.friends){const on=level>.06;if(on!==(talking.current.friends.get(id)??false)){talking.current.friends.set(id,on);const p=friends.current.get(id);if(p)e.friend(id,p.name,p.color,on,p.outfit);setPlayers(list=>list.map(q=>q.id===id?{...q,talking:on}:q));}}
  },66);
  return()=>clearInterval(timer);
 },[phase,getEngine,getAudio]);
 // Your record player: a press of play, pause, skip or seek goes to everyone; while you lead, a beat every 4 s keeps
 // them in step (and brings late joiners in). Changes that came from a friend are not sent back.
 useEffect(()=>{
  if(phase!=="in-room")return;const audio=getAudio();let last:{index:number;playing:boolean;time:number;at:number}|null=null,now:{index:number;playing:boolean;time:number}|null=null;
  const unsubscribe=audio.subscribeSong(st=>{if(!st)return;const t=performance.now(),expected=last?last.time+(last.playing?(t-last.at)/1000:0):0,changed=!last||st.index!==last.index||st.playing!==last.playing||Math.abs(st.time-expected)>1.5;
   last={index:st.index,playing:st.playing,time:st.time,at:t};now=st;if(changed&&t>following.current){leading.current=true;lobby.current?.music(st.index,st.time,st.playing);}});
  const beat=window.setInterval(()=>{if(leading.current&&now)lobby.current?.music(now.index,now.time,now.playing);},4000);
  return()=>{unsubscribe();clearInterval(beat);};
 },[phase,getAudio]);
 // M mutes, and with push-to-talk on, holding V talks. Typing in a field never triggers them.
 useEffect(()=>{
  if(phase!=="in-room")return;const live=(m:boolean)=>lobby.current?.setMuted(m);live(ptt?true:muted);
  const typing=(e:KeyboardEvent)=>(e.target as HTMLElement|null)?.closest?.("input,textarea,select,[contenteditable]");
  const down=(e:KeyboardEvent)=>{if(typing(e))return;if(e.code==="KeyM"&&!e.repeat&&!ptt)setMuted(v=>!v);if(e.code==="KeyV"&&ptt)live(false);};
  const up=(e:KeyboardEvent)=>{if(e.code==="KeyV"&&ptt)live(true);};
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
 },[phase,muted,ptt]);
 async function join(){
  const room=cleanCode(code);if(room.length<3){setPhase("error");setStatus("Room codes are 3 to 24 letters, numbers or dashes.");return;}
  const who=name.trim().slice(0,24)||"Guest";try{localStorage.setItem("dy-world-name",who);localStorage.setItem("dy-world-color",color);}catch{}
  // Straight back to walking while the room connects (the status chip shows how it goes). If the browser still has to
  // ask about the microphone, that prompt would break mouse capture, so walking starts with a click after it.
  const asked=!mic||await navigator.permissions?.query({name:"microphone" as PermissionName}).then(p=>p.state==="granted").catch(()=>false);
  onJoined(Boolean(asked));
  setRoom(room);const audio=getAudio();if(!audio.on)await audio.toggle();
  // A fresh random outfit every time you join, so friends in the room look different from each other.
  const outfit=randomOutfit();getEngine()?.dress(outfit);
  await lobby.current?.join(room,who,color,mic,outfit);const stream=lobby.current?.micStream??null;audio.setMic(stream);setHasMic(Boolean(stream));
 }
 function leave(){lobby.current?.leave();getAudio().setMic(null);for(const id of friends.current.keys()){getEngine()?.dropFriend(id);getAudio().dropVoice(id);}friends.current.clear();setRoom("");setHasMic(false);}
 async function copy(){try{await navigator.clipboard.writeText(`${location.origin}${location.pathname}#join=${room}`);setCopied(true);setTimeout(()=>setCopied(false),1800);}catch{setStatus("Copy didn’t work here. Share the code instead.");}}
 const inRoom=phase==="in-room"||(phase==="connecting"&&Boolean(room));
 return <>
  {room&&phase!=="idle"&&<div className={styles.chip} data-phase={phase} role="status" aria-live="polite"><i data-talking={meTalking&&!muted}/><b>{room}</b><span>{players.length+1} here</span><span>{!hasMic?"listening":ptt?"hold V to talk":muted?"muted · M":"mic on · M"}</span></div>}
  {open&&<aside className={styles.panel} aria-label="Play with friends">
   <header><span>NETLINK · PLAY WITH FRIENDS</span><button onClick={onClose} aria-label="Close">×</button></header>
   {!inRoom?<form className={styles.form} onSubmit={e=>{e.preventDefault();void join();}}>
    <h2>Same code, <em>same world.</em></h2>
    <p>Type a room code and share it. Everyone who types it walks in here with you, and you’ll hear each other from where you stand. Walls muffle, open doors carry.</p>
    <label><span>Room code</span><div className={styles.code}><input value={code} onChange={e=>setCode(cleanCode(e.target.value))} placeholder="chai-42" autoCapitalize="none" spellCheck={false} maxLength={24} required/><button type="button" onClick={()=>setCode(randomCode())} aria-label="Make up a code">🎲</button></div></label>
    <label><span>Your name</span><input value={name} onChange={e=>setName(e.target.value.slice(0,24))} maxLength={24}/></label>
    <div className={styles.swatches} role="radiogroup" aria-label="Shirt colour">{SWATCHES.map(s=><button key={s} type="button" role="radio" aria-checked={color===s} aria-label={`Colour ${s}`} style={{background:s}} onClick={()=>setColor(s)}/>)}</div>
    <label className={styles.check}><input type="checkbox" checked={mic} onChange={e=>setMic(e.target.checked)}/><span>Talk with my microphone <small>headphones stop echo</small></span></label>
    {phase==="error"&&<p className={styles.error} role="alert">{status}</p>}
    <button className={styles.join} disabled={phase==="connecting"}><span>{phase==="connecting"?"Dialling…":"Join the room"}</span><i aria-hidden="true">→</i></button>
    <small className={styles.fine}>Peer to peer: movement and voice go straight between browsers (PeerJS helps them find each other). Up to 8 people.</small>
   </form>:<div className={styles.room}>
    <h2><span>ROOM</span>{room}</h2>
    <p className={styles.status}>{status}</p>
    <ul className={styles.roster}>
     <li data-talking={meTalking&&!muted}><i style={{background:color}}/>{name||"You"} <small>you</small></li>
     {players.map(p=><li key={p.id} data-talking={p.talking}><i style={{background:p.color}}/>{p.name}<small>{p.mic?(p.talking?"talking":"mic on"):"listening"}{p.state?` · ${p.state.room==="vault"?"hidden room":p.state.room==="archive"?"living room":p.state.room==="workshop"?"kitchen":p.state.room==="library"?"study":p.state.room==="rooftop"?"balcony":"bedroom"}`:""}</small></li>)}
    </ul>
    <div className={styles.controls}>
     {hasMic&&<><button onClick={()=>setMuted(v=>!v)} aria-pressed={muted} disabled={ptt}>{muted?"Unmute":"Mute"} <kbd>M</kbd></button><button onClick={()=>setPtt(v=>!v)} aria-pressed={ptt}>Push to talk <kbd>V</kbd></button></>}
     <button onClick={()=>void copy()}>{copied?"Link copied":"Copy invite link"}</button>
     <button className={styles.leave} onClick={leave}>Leave</button>
    </div>
    {!touch&&<small className={styles.fine}>Walk around: your friends see you move and hear you from where you stand.</small>}
   </div>}
  </aside>}
 </>;
}
