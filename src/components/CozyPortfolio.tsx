"use client";
import {Fragment,useCallback,useEffect,useRef,useState,useSyncExternalStore,type CSSProperties,type PointerEvent as ReactPointerEvent} from "react";
import Image from "next/image";
import Link from "next/link";
import {gsap} from "gsap";
import dynamic from "next/dynamic";
import Magnetic from "./Magnetic";
import ControlCentre,{defaultPrefs,type Prefs} from "./ControlCentre";
import MusicPlayer from "./MusicPlayer";
import Multiplayer,{netBus} from "./Multiplayer";
import {GESTURES,type Gesture} from "./world/gestures";
import {useInterfaceSounds} from "./useInterfaceSounds";
import {liveConditions,timeOfDay,type Live} from "./world/live";
const Telescope=dynamic(()=>import("./Telescope"),{ssr:false});
const Computer=dynamic(()=>import("./Computer"),{ssr:false});
const TheaterScreen=dynamic(()=>import("./TheaterScreen"),{ssr:false});
const SecretDoor=dynamic(()=>import("./SecretDoor"),{ssr:false});
import {projects,experience,skills,contact,profile} from "./world/content";
import type {Action,Location,Weather,WorldOptions} from "./world/objects";
import type {WorldEngine} from "./world/engine";
import {RoomAudio} from "./world/audio";
import styles from "./CozyPortfolio.module.css";
type Panel="projects"|"skills"|"about"|"experience"|"contact"|"lab"|"credits"|"profile"|`project:${string}`|`skill:${string}`;
const roomNames:Record<Location,string>={bedroom:"The bedroom",archive:"The living room",workshop:"The kitchen",library:"The study",rooftop:"The balcony",vault:"The hidden room"};
const deepLinks:Record<string,Panel>={"#work":"projects","#projects":"projects","#hello":"contact","#contact":"contact","#person":"about","#about":"about","#experience":"experience","#skills":"skills"};
const coarse=()=>matchMedia("(pointer: coarse)").matches,noSubscribe=()=>()=>{};
function Words({text}:{text:string}){return <>{text.split(" ").map((word,i)=><Fragment key={i}>{i>0&&" "}<span className={styles.word} data-word><span>{word}</span></span></Fragment>)}</>;}
export default function CozyPortfolio(){
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[active,setActive]=useState(false),[entered,setEntered]=useState(false),[classic,setClassic]=useState(false),[paused,setPaused]=useState(false),[progress,setProgress]=useState({value:0,label:"Opening the door"});
 const lastMode=useRef<"pointer"|"drag"|"touch">("pointer");
 const touch=useSyncExternalStore(noSubscribe,coarse,()=>false);
 const [panel,setPanel]=useState<Panel|null>(null),[location,setLocation]=useState<Location>("bedroom"),[target,setTarget]=useState(""),[toast,setToast]=useState(""),[sound,setSound]=useState(false),[motion,setMotion]=useState(true),[weather,setWeather]=useState<Weather>("rain"),[lamp,setLamp]=useState(true),[quality,setQuality]=useState<"auto"|"low">("auto"),[stick,setStick]=useState({x:0,y:0}),[scope,setScope]=useState(false),[weatherMode,setWeatherMode]=useState<"live"|"manual">("live"),[live,setLive]=useState<Live|null>(null),[precise,setPrecise]=useState<{lat:number;lon:number}|null>(null),[spotify,setSpotify]=useState(false),[controls,setControls]=useState(false),[prefs,setPrefs]=useState<Prefs>(defaultPrefs),[sitting,setSitting]=useState(false),[seat,setSeat]=useState<{id:"computer"|"laptop"|"tv";x:number;y:number;w:number;h:number}|null>(null),[secret,setSecret]=useState(false),[netOpen,setNetOpen]=useState(false),[joinCode,setJoinCode]=useState(""),[member,setMember]=useState<string|null>(null);
 const container=useRef<HTMLDivElement>(null),engine=useRef<WorldEngine|null>(null),audio=useRef<RoomAudio|null>(null),dialog=useRef<HTMLDialogElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),actionRef=useRef<(action:Action)=>void>(()=>{}),options=useRef<WorldOptions>({motion:true,weather:"rain",lamp:true,quality:"auto"});
 const paper=useRef<HTMLDivElement>(null),entry=useRef<HTMLDivElement>(null),chip=useRef<HTMLDivElement>(null),chipMove=useRef<(x:number,y:number)=>void>(()=>{}),closing=useRef(false);
 const visible=!classic&&!failed;
 function announce(message:string){setToast(message);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setToast(""),4500);}
 function open(section:Panel){engine.current?.pause();setPanel(section);}
 // Closing plays the paper out first; reduced motion closes at once.
 // Back to walking right away when a click closed it (pointer capture needs that click); otherwise the
 // small "click to keep exploring" hint waits. The big entry screen is only for a real pause (Escape).
 function resume(){if(entered&&!paused&&!touch&&navigator.userActivation?.isActive!==false)void engine.current?.enter(lastMode.current);}
 function close(){
  const sheet=paper.current;if(!panel||closing.current)return;audio.current?.ui("close");resume();
  if(!motion||!sheet){setPanel(null);return;}
  closing.current=true;dialog.current?.setAttribute("data-state","closing");
  gsap.to(sheet,{y:26,opacity:0,scale:.985,duration:.32,ease:"power2.in",onComplete:()=>{closing.current=false;setPanel(null);}});
 }
 function act(action:Action){
  if(action.startsWith("door:"))return;
  if(action==="lamp"){setLamp(v=>!v);return;}
  if(action==="weather"){setWeatherMode("manual");setWeather(w=>(["rain","day","sunset","night"] as Weather[])[(["rain","day","sunset","night"].indexOf(w)+1)%4]);return;}
  if(action==="sound"){void toggleSound();return;}
  if(action==="drawer"){announce("Inside the drawer: keep making things, even the small ones.");return;}
  if(action==="pet"){announce("Pip stretches, says hello, and settles back down.");return;}
  if(action==="keyboard"){announce("hello, world_  — one small keystroke at a time.");return;}
  if(action==="duck"){announce("Tell the duck what’s broken. Sometimes saying it out loud helps.");return;}
  if(action==="chair")return;
  if(action==="computer"||action==="laptop"||action==="tv"){setSitting(true);return;}
  if(action==="telescope"){engine.current?.pause();setScope(true);audio.current?.ui("lens");return;}
  if(action==="multiplayer"){engine.current?.pause();setNetOpen(true);audio.current?.ui("boot");return;}
  // A member who signed in this visit is let straight through; it resets on reload.
  if(action==="secret"){if(member)letIn(`Welcome back, ${member}.`);else setSecret(true);return;}
  if(action==="exit"||action==="shelf"||action.startsWith("sit:"))return; // the engine moves the shelf; the sound already played
  if(action==="cat"){announce("Mishti stretches, purrs once, and goes straight back to sleep.");return;}
  if(action==="radio"){if(!sound)announce("Turn sound on to hear the radio — it plays from the counter, so walk closer.");else announce("The radio crackles on. Walk away and it fades.");return;}
  if(action==="record"){setSpotify(true);return;}
  if(action==="kettle"){announce("Chai’s on. Give it a minute.");return;}
  if(action==="globe"){announce("Somewhere on this globe is the next thing worth building. Let’s talk.");return;}
  if(action==="swing"){announce("The jhoola creaks and sways. Sit for a while.");return;}
  open(action as Panel);
 }
 async function toggleSound(){try{const on=await getAudio().toggle();setSound(on);try{localStorage.setItem("dy-world-sound",on?"on":"off");}catch{}}catch{announce("Audio isn’t available in this browser. You can still explore.");}}
 useEffect(()=>{actionRef.current=act;});
 // One audio engine for the whole page, created on first use; the record player can start it too.
 const getAudio=useCallback(()=>{if(!audio.current){audio.current=new RoomAudio();audio.current.setOptions({weather:options.current.weather,fan:options.current.fan,volume:options.current.volume});audio.current.subscribeSong(song=>engine.current?.setMusic(Boolean(song?.playing)));if(process.env.NODE_ENV!=="production")(window as unknown as {__audio?:RoomAudio}).__audio=audio.current;}return audio.current;},[]);
 const getEngine=useCallback(()=>engine.current,[]);
 const startRef=useRef(()=>{});useEffect(()=>{startRef.current=()=>{void toggleSound();};});
 useInterfaceSounds(audio,useCallback(()=>startRef.current(),[]));
 // Live mode follows the visitor's own clock and local weather; picking a weather by hand switches to manual.
 useEffect(()=>{try{if(localStorage.getItem("dy-world-weather")==="manual")setTimeout(()=>setWeatherMode("manual"));}catch{}},[]);
 useEffect(()=>{
  try{localStorage.setItem("dy-world-weather",weatherMode);}catch{}
  if(weatherMode!=="live")return;let cancelled=false,last:Live|null=null;
  const refresh=()=>liveConditions(precise??undefined).then(l=>{if(cancelled)return;last=l;setLive(l);setWeather(l.weather);});
  void refresh();const slow=window.setInterval(()=>void refresh(),10*60*1000);
  const clock=window.setInterval(()=>{if(last&&last.weather!=="rain"){const w=timeOfDay();if(w!==last.weather){last={...last,weather:w};setWeather(w);}}},60*1000);
  return()=>{cancelled=true;clearInterval(slow);clearInterval(clock);};
 },[weatherMode,precise]);
 function chooseWeather(w:Weather|"live"){if(w==="live"){setWeatherMode("live");return;}setWeatherMode("manual");setWeather(w);}
 function usePreciseLocation(){if(!navigator.geolocation){announce("This browser can’t share a location.");return;}navigator.geolocation.getCurrentPosition(p=>{setPrecise({lat:p.coords.latitude,lon:p.coords.longitude});setWeatherMode("live");announce("Now using the weather where you are.");},()=>announce("Location wasn’t shared, so the weather follows your time zone."),{maximumAge:30*60*1000,timeout:10000});}
 useEffect(()=>{options.current={motion,weather,lamp,quality,...prefs};engine.current?.setOptions(options.current);audio.current?.setOptions({weather,fan:prefs.fan,volume:prefs.volume});},[motion,weather,lamp,quality,prefs]);
 // Preferences persist per browser; storage can be unavailable, so every access is guarded.
 useEffect(()=>{const frame=requestAnimationFrame(()=>{try{const saved=JSON.parse(localStorage.getItem("dy-world-prefs")??"null");if(saved)setPrefs(p=>({...p,...saved}));}catch{}});return()=>cancelAnimationFrame(frame);},[]);
 function setPref<K extends keyof Prefs>(key:K,value:Prefs[K]){setPrefs(p=>{const next={...p,[key]:value};try{localStorage.setItem("dy-world-prefs",JSON.stringify(next));}catch{}return next;});}
 function go(where:string){setControls(false);if(where==="spotify"){setSpotify(true);return;}if(where==="friends"){setNetOpen(true);return;}if(where==="computer"){setSitting(true);engine.current?.sit("computer");return;}if(where==="telescope"){engine.current?.pause();setScope(true);return;}if(where==="reading"){reading();return;}open(where as Panel);}
 useEffect(()=>{const query=matchMedia("(prefers-reduced-motion: reduce)");function sync(){setMotion(!query.matches);}query.addEventListener("change",sync);const frame=requestAnimationFrame(()=>{sync();const linked=deepLinks[window.location.hash];if(linked)setPanel(linked);const invite=/^#join=([a-z0-9-]{3,24})$/i.exec(window.location.hash);if(invite){setJoinCode(invite[1].toLowerCase());setNetOpen(true);}});function visibility(){audio.current?.visibility();}document.addEventListener("visibilitychange",visibility);return()=>{cancelAnimationFrame(frame);query.removeEventListener("change",sync);document.removeEventListener("visibilitychange",visibility);audio.current?.dispose();if(timer.current)clearTimeout(timer.current);};},[]);
 useEffect(()=>{
  if(!visible||!container.current)return;let cancelled=false,instance:WorldEngine|null=null;
  import("./world/engine").then(({createWorld})=>{if(cancelled||!container.current)return;try{instance=createWorld(container.current,{action:(action,point)=>{audio.current?.tick(point,action);actionRef.current(action);},target:name=>setTarget(name),ready:()=>setReady(true),fail:()=>setFailed(true),active:(on,byUser)=>{setActive(on);if(on)setPaused(false);else if(byUser)setPaused(true);},progress:(value,label)=>setProgress({value,label}),stats:(fps,ms,scale)=>statsBus.dispatchEvent(new CustomEvent("stats",{detail:{fps,ms,scale}})),door:(id,isOpen)=>netBus.dispatchEvent(new CustomEvent("door",{detail:{id,open:isOpen}})),gesture:kind=>netBus.dispatchEvent(new CustomEvent("gesture",{detail:kind})),location:setLocation,notice:announce,listener:(p,f,moving,where,doors)=>audio.current?.listener(p,f,moving,where,doors),screen:s=>{if(s)audio.current?.ui("boot");setSeat(s);if(!s)setSitting(false);},cue:(kind,at)=>{if(kind==="hover")audio.current?.ui("hover");else audio.current?.cue(kind,at);}},options.current);engine.current=instance;if(process.env.NODE_ENV!=="production")(window as unknown as {__world?:WorldEngine}).__world=instance;}catch(error){console.error(error);setFailed(true);}}).catch(()=>{if(!cancelled)setFailed(true);});
  return()=>{cancelled=true;instance?.dispose();engine.current=null;};
 },[visible]);
 // The paper rises in, then its contents settle line by line; switching sections restaggers the new content.
 useEffect(()=>{
  const d=dialog.current,sheet=paper.current;if(!d)return;
  if(panel){
   const first=!d.open;if(first){d.removeAttribute("data-state");d.showModal();audio.current?.ui("open");}
   if(sheet&&!first)sheet.scrollTop=0;
   if(motion&&sheet){
    if(first)gsap.fromTo(sheet,{y:48,opacity:0,scale:.98},{y:0,opacity:1,scale:1,duration:.8,ease:"expo.out",clearProps:"transform,opacity"});
    gsap.fromTo(sheet.querySelectorAll("[data-panel] > *"),{y:18,opacity:0},{y:0,opacity:1,duration:.65,ease:"power3.out",stagger:.045,delay:first?.12:0,clearProps:"transform,opacity"});
   }
  }else if(d.open)d.close();
 },[panel,motion]);
 const idle=visible&&ready&&!active&&!panel&&!scope&&!sitting&&!secret&&!netOpen&&(!entered||paused);
 const resting=visible&&ready&&entered&&!paused&&!active&&!panel&&!scope&&!sitting&&!secret&&!controls&&!spotify&&!netOpen;
 // Back from another window (alt+tab) or a pause: a movement key, or a click on empty room, walks on again.
 const resumable=visible&&ready&&entered&&!active&&!panel&&!scope&&!sitting&&!secret&&!controls&&!spotify&&!netOpen;
 const walkOn=useRef(()=>{});useEffect(()=>{walkOn.current=()=>void enter(lastMode.current==="drag");});
 useEffect(()=>{
  if(!resumable||touch)return;
  function key(e:KeyboardEvent){const t=e.target as HTMLElement|null;if(t?.closest?.("input,textarea,select,[contenteditable]")||(e.code==="Space"&&t?.closest?.("button")))return;
   if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)){e.preventDefault();walkOn.current();}}
  document.addEventListener("keydown",key);return()=>document.removeEventListener("keydown",key);
 },[resumable,touch]);
 // Entry choreography: words rise from their baseline, then the supporting lines follow.
 useEffect(()=>{
  const el=entry.current;if(!el||!idle||!motion)return;
  const tl=gsap.timeline({defaults:{ease:"expo.out"}});
  tl.fromTo(el.querySelectorAll("[data-word] > span"),{yPercent:110,rotate:4},{yPercent:0,rotate:0,duration:1.1,stagger:.07},.15)
    .fromTo(el.querySelectorAll("[data-in]"),{y:22,opacity:0},{y:0,opacity:1,duration:.9,stagger:.08,clearProps:"transform,opacity"},.35);
  return()=>{tl.kill();};
 },[idle,entered,motion]);
 useEffect(()=>{const el=chip.current;if(!el)return;const x=gsap.quickTo(el,"x",{duration:.38,ease:"power3.out"}),y=gsap.quickTo(el,"y",{duration:.38,ease:"power3.out"});chipMove.current=(cx,cy)=>{x(cx);y(cy);};},[]);
 async function enter(drag=false){setEntered(true);setPaused(false);audio.current?.ui("enter");lastMode.current=touch?"touch":drag?"drag":"pointer";await engine.current?.enter(lastMode.current);}
 function letIn(greeting:string){const at=engine.current?.unlock();if(at)audio.current?.tick(at,"shelf");announce(`${greeting} The shelf slides open.`);resume();}
 function reading(){engine.current?.pause();setClassic(true);}
 function world(){setFailed(false);setClassic(false);setReady(false);setActive(false);setEntered(false);}
 function joystick(e:ReactPointerEvent<HTMLDivElement>){const rect=e.currentTarget.getBoundingClientRect();const dx=(e.clientX-rect.left-rect.width/2)/42,dy=(e.clientY-rect.top-rect.height/2)/42,length=Math.max(1,Math.hypot(dx,dy));engine.current?.setStick(dx/length,dy/length);setStick({x:dx/length*33,y:dy/length*33});}
 return <div className={styles.world} data-mode={visible?"world":"classic"} data-motion={motion?"on":"off"} data-active={active} onPointerMove={e=>{if(e.pointerType==="mouse")chipMove.current(e.clientX,e.clientY);}}>
  <a href="#portfolio-content" className={styles.skip} onClick={reading}>Skip to accessible portfolio</a>
  {visible&&<div className={styles.scene} ref={container} onClick={()=>{if(resumable&&!touch&&!target)walkOn.current();}}/>}
  {visible&&<div className={styles.scrim} data-hidden={active||Boolean(panel)} aria-hidden="true"/>}
  <header className={styles.header}><Link href="/" className={styles.signature}>DY<span>/</span></Link><div className={styles.location}><span>DEEPANSHU’S WORLD</span><strong key={location}>{roomNames[location]}</strong></div><nav aria-label="Portfolio shortcuts"><button onClick={()=>open("projects")}>Portfolio index <span aria-hidden="true">↗</span></button><button onClick={()=>open("contact")}>Contact</button><button onClick={()=>{engine.current?.pause(true);}} className={styles.pause} disabled={!active}>Pause</button></nav></header>
  {visible&&<main className={styles.exploration}>
   {!ready&&<div className={styles.loading} role="status" aria-live="polite"><span>Opening the door…</span><div className={styles.progress} role="progressbar" aria-label="Loading the world" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.value*100)}><i style={{transform:`scaleX(${progress.value})`}}/></div><span className={styles.progressLabel}><b>{String(Math.round(progress.value*100)).padStart(2,"0")}%</b>{progress.label}</span><small>Your portfolio is already available in the index.</small></div>}
   {resting&&<button className={styles.resume} onClick={()=>void enter(lastMode.current==="drag")}><span>Click to keep exploring</span><small>Esc pauses</small></button>}
   {idle&&<div className={styles.entry} ref={entry}><span className={styles.eyebrow} data-in>{entered?"TAKE YOUR TIME":"A PLACE TO GET A LITTLE LOST"}</span><h1><Words text={entered?"Make yourself at home.":"Come on in."}/></h1><p data-in>{entered?"Your world is right where you left it.":"A quiet room. A few unfinished ideas. A whole world to explore."}</p><div className={styles.entryActions} data-in><Magnetic><button className={styles.enterButton} onClick={()=>void enter()}><span>{entered?"Continue exploring":"Enter my world"}</span><i aria-hidden="true"><b>→</b><b>→</b></i></button></Magnetic><div className={styles.entryLinks}>{!touch&&<button onClick={()=>void enter(true)}>Explore without mouse capture</button>}<button onClick={reading}>Read the portfolio instead</button></div></div><div className={styles.instructions} data-in>{touch?<><span>Tap anything in the room</span><span>Enter to walk with the joystick</span></>:<><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk</span><span><kbd>E</kbd> interact</span><span><kbd>Space</kbd> jump</span><span><kbd>Esc</kbd> pause</span></>}</div></div>}
   {idle&&!touch&&<div className={styles.hoverHint} aria-hidden="true"><i/>Hover the room · click anything that lights up</div>}
   {active&&<><span className={styles.crosshair} data-target={Boolean(target)} aria-hidden="true"/><div className={styles.interaction} aria-live="polite">{target&&<><kbd>E</kbd><span>{target}</span></>}</div><div className={styles.controlHint}>{touch?"Drag to look around":"WASD · walk     E · interact     1–6 · gestures     Esc · pause"}</div>
   {!touch&&<div className={styles.gestureBar} aria-hidden="true">{(Object.keys(GESTURES) as Gesture[]).map(g=><span key={g}><kbd>{GESTURES[g].key}</kbd>{GESTURES[g].emoji}</span>)}</div>}</>}
   {active&&touch&&<div className={styles.touchControls}><div role="group" aria-label="Movement joystick" className={styles.joystick} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);joystick(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))joystick(e);}} onPointerUp={()=>{engine.current?.setStick(0,0);setStick({x:0,y:0});}} onPointerCancel={()=>{engine.current?.setStick(0,0);setStick({x:0,y:0});}}><span style={{transform:`translate(${stick.x}px,${stick.y}px)`}}/></div><button className={styles.touchInteract} disabled={!target} onClick={()=>void engine.current?.interact()} aria-label="Interact with nearby object">E</button><div className={styles.touchGestures}>{(Object.keys(GESTURES) as Gesture[]).map(g=><button key={g} onClick={()=>engine.current?.gesture(g)} aria-label={GESTURES[g].label}>{GESTURES[g].emoji}</button>)}</div></div>}
  </main>}
  <div className={styles.chip} ref={chip} data-visible={idle&&Boolean(target)} aria-hidden="true"><span>{target}</span><b>↗</b></div>
  {visible&&ready&&prefs.fps&&<FpsMeter/>}
  {!active&&<aside className={styles.utilities}><button onClick={toggleSound} aria-pressed={sound} data-sound-toggle><i className={styles.meter} data-on={sound} aria-hidden="true"><b/><b/><b/></i>Sound {sound?"on":"off"}</button><button onClick={()=>{setControls(true);audio.current?.ui("sheet");}} aria-expanded={controls} className={styles.controlsButton}><i aria-hidden="true"><b/><b/><b/></i>Controls</button></aside>}
  <section id="portfolio-content" className={styles.classic}><span className={styles.eyebrow}>DEEPANSHU YADAV / PORTFOLIO</span><h1>Useful things.<br/>Thoughtfully built.</h1>{failed&&<p>The 3D world couldn’t open on this device. All of my work is available here.</p>}<Content section="about"/><Content section="projects"/><Content section="skills"/><Content section="experience"/><Content section="profile"/><Content section="contact"/><button className={styles.enterButton} onClick={world}><span>Try the world again</span><i aria-hidden="true"><b>↗</b><b>↗</b></i></button></section>
  <div className={styles.toast} role="status" data-visible={Boolean(toast)}>{toast}</div>
  <dialog className={styles.dialog} ref={dialog} onCancel={e=>{e.preventDefault();close();}} onClose={()=>setPanel(null)} onClick={e=>{if(e.target===e.currentTarget)close();}} aria-labelledby="panel-title"><div className={styles.paper} ref={paper}><div className={styles.paperTop}><span>D/Y — WORKSPACE / {panel?.startsWith("project")?"PROJECT TERMINAL":"FIELD NOTES"}</span><button aria-label="Close information panel" onClick={close}>×</button></div>{panel&&<Content key={panel} section={panel} onSelect={setPanel} motion={motion}/>}<div className={styles.paperBottom}><button onClick={close}>Back to the world <span aria-hidden="true">↗</span></button></div></div></dialog>
  <ControlCentre open={controls} onClose={()=>setControls(false)} prefs={prefs} setPref={setPref} weather={weather} setWeather={chooseWeather} weatherMode={weatherMode} live={live} usePrecise={usePreciseLocation} precise={Boolean(precise)} lamp={lamp} setLamp={setLamp} motion={motion} setMotion={setMotion} quality={quality} setQuality={setQuality} sound={sound} toggleSound={()=>void toggleSound()} go={go} touch={touch}/>
  {spotify&&<MusicPlayer getAudio={getAudio} onClose={()=>setSpotify(false)}/>}
  {visible&&<Multiplayer open={netOpen} onClose={()=>{setNetOpen(false);resume();}} onJoined={walk=>{setNetOpen(false);if(walk)void enter(lastMode.current==="drag");else{setEntered(true);setPaused(false);}}} onTrouble={()=>setNetOpen(true)} getEngine={getEngine} getAudio={getAudio} initialCode={joinCode} touch={touch}/>}
  {secret&&<SecretDoor motion={motion} onClose={()=>{setSecret(false);resume();}} onUnlock={name=>{setSecret(false);setMember(name);letIn(`Welcome, ${name}.`);}}/>}
  {scope&&<Telescope motion={motion} onClose={()=>{setScope(false);resume();}}/>}
  {seat&&seat.id!=="tv"&&<Computer seat={seat as {id:"computer"|"laptop";x:number;y:number;w:number;h:number}} motion={motion} onExit={()=>{engine.current?.stand();resume();}}/>}
  {seat?.id==="tv"&&<TheaterScreen seat={seat} onExit={()=>{engine.current?.stand();resume();}}/>}
  <noscript><style>{`.${styles.classic}{display:block!important}.${styles.exploration},.${styles.utilities},.${styles.scrim}{display:none!important}`}</style></noscript>
 </div>;
}
/** Frame rate, frame time and the dynamic resolution scale, updated twice a second outside React's main tree. */
const statsBus=new EventTarget();
function FpsMeter(){
 const [s,setS]=useState<{fps:number;ms:number;scale:number}|null>(null);
 useEffect(()=>{const on=(e:Event)=>setS((e as CustomEvent).detail);statsBus.addEventListener("stats",on);return()=>statsBus.removeEventListener("stats",on);},[]);
 if(!s)return null;
 return <div className={styles.fps} data-tone={s.fps>=50?"good":s.fps>=30?"ok":"low"} aria-hidden="true"><b>{s.fps}</b> FPS<span>{s.ms.toFixed(1)} ms</span><span>{Math.round(s.scale*100)}% res</span></div>;
}
function Content({section,onSelect,motion=true}:{section:Panel;onSelect?:(panel:Panel)=>void;motion?:boolean}){
  const titleId=onSelect?"panel-title":`content-${section}`;
  const selected=section.startsWith("project:")?projects.find(p=>p.type===section.slice(8)):null;
  const technology=section.startsWith("skill:")?section.slice(6):null;
  if(selected)return <article className={styles.content} data-panel><span className={styles.eyebrow}>{selected.category}</span><h2 id={titleId}>{selected.name}<em> {selected.tagline}</em></h2>{["impact","neatify"].includes(selected.type)&&<Image className={styles.projectImage} src={selected.type==="impact"?"/images/impact-hub.jpg":"/images/neatify.jpg"} alt={`${selected.name} project preview`} width={900} height={520}/>}<p>{selected.description}</p><div className={styles.tags}>{selected.stack.map(s=><span key={s}>{s}</span>)}</div><div className={styles.links}><a href={`/work/${selected.type}`}>Read the case study ↗</a><a href={selected.github} target="_blank" rel="noreferrer">GitHub ↗</a>{selected.live&&<a href={selected.live} target="_blank" rel="noreferrer">Live project ↗</a>}</div><button className={styles.back} onClick={()=>onSelect?.("projects")}>← All projects</button></article>;
  if(technology)return <article className={styles.content} data-panel><span className={styles.eyebrow}>FROM THE KNOWLEDGE SHELF</span><h2 id={titleId}>{technology}</h2><p>A tool from my development practice. Here’s where it appears in my work.</p>{projects.filter(p=>p.stack.includes(technology)).map(p=><a className={styles.related} key={p.type} href={`/work/${p.type}`}><strong>{p.name} ↗</strong><span>{p.description}</span></a>)}{!projects.some(p=>p.stack.includes(technology))&&<p>{["Node.js","MongoDB"].includes(technology)?"Used during my full-stack internship at Ethixweb, working on web applications, REST APIs, and database performance.":"Part of my toolkit for building interfaces and interactive experiences."}</p>}<button className={styles.back} onClick={()=>onSelect?.("skills")}>← The complete shelf</button></article>;
  return <article className={styles.content} data-panel>
    {section==="about"&&<><span className={styles.eyebrow}>THE PERSON BEHIND THE DESK</span><h2 id={titleId}>Hi, I’m Deepanshu.<em>I make things for the web. And beyond.</em></h2><p>I’m an Information Technology student at Chandigarh University, building across web, mobile, and desktop.</p><p>Right now, I’m contributing to IIT Mandi’s AcadLMS. Before that, I worked on full-stack products at Ethixweb and an AI-driven research platform at QSentia.</p><p>I care about the moment a useful idea becomes something people enjoy using — the rhythm of a page, the response of a button, the details that make it feel considered.</p><div className={styles.links}><a href={contact.resume} target="_blank" rel="noreferrer">My résumé ↗</a><a href={contact.github} target="_blank" rel="noreferrer">GitHub ↗</a></div></>}
    {section==="projects"&&<><span className={styles.eyebrow}>THE PROJECT ARCHIVE / 04 ENTRIES</span><h2 id={titleId}>Made with intention.<em>Some things I’ve built.</em></h2><div className={styles.projectList}>{projects.map((p,i)=><div key={p.type}><span className={styles.projectNumber}>0{i+1}</span><div><span className={styles.eyebrow}>{p.category}</span><h3>{onSelect?<button onClick={()=>onSelect(`project:${p.type}`)}>{p.name} <span>↗</span></button>:<a href={`/work/${p.type}`}>{p.name} ↗</a>}</h3><p>{p.description}</p><div className={styles.tags}>{p.stack.map(s=><span key={s}>{s}</span>)}</div><div className={styles.projectLinks}><a href={`/work/${p.type}`}>Case study ↗</a><a href={p.github} target="_blank" rel="noreferrer">Source ↗</a>{p.live&&<a href={p.live} target="_blank" rel="noreferrer">Live ↗</a>}</div></div></div>)}</div></>}
    {section==="skills"&&<><span className={styles.eyebrow}>THE KNOWLEDGE SHELF</span><h2 id={titleId}>Always learning.<em>Tools I reach for.</em></h2><p>Web interfaces, mobile applications, desktop tools, and the systems underneath them.</p><div className={styles.skillList}>{skills.map((s,i)=>onSelect?<button key={s} onClick={()=>onSelect(`skill:${s}`)}><span>{String(i+1).padStart(2,"0")}</span>{s}<b>↗</b></button>:<span key={s}>{s}</span>)}</div></>}
    {section==="experience"&&<><span className={styles.eyebrow}>FIELD NOTES / EXPERIENCE</span><h2 id={titleId}>Learning by doing.<em>A few stops along the way.</em></h2><div className={styles.timeline}>{experience.map(e=><section key={e.company}><span className={styles.eyebrow}>{e.dates}</span><h3>{e.company}</h3><strong>{e.role}</strong><p>{e.detail}</p></section>)}</div><h3>Chandigarh University</h3><p>Information Technology student.</p><div className={styles.links}><a href={contact.resume} target="_blank" rel="noreferrer">View my résumé ↗</a></div></>}
    {section==="contact"&&<><span className={styles.eyebrow}>THE DOOR IS OPEN</span><h2 id={titleId}>Have something in mind?<em>Let’s make it real.</em></h2><p>An idea, a collaboration, or just a hello — I’d love to hear from you.</p><a className={styles.email} href={`mailto:${contact.email}`}>{contact.email} ↗</a><div className={styles.links}><a href={contact.github} target="_blank" rel="noreferrer">GitHub ↗</a><a href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a><a href={contact.resume} target="_blank" rel="noreferrer">Résumé ↗</a></div></>}
    {section==="profile"&&<><span className={styles.eyebrow}>THE PROFILE WALL</span><h2 id={titleId}>{profile.name}<em>{profile.headline}</em></h2><p>{profile.about}</p><div className={styles.timeline}>{experience.map(e=><section key={e.company}><span className={styles.eyebrow}>{e.dates}</span><h3>{e.company}</h3><strong>{e.role}</strong></section>)}</div><h3>Education</h3>{profile.education.map(e=><p key={e.school}><strong>{e.school}</strong> — {e.degree} · {e.dates}</p>)}<h3>Certifications</h3>{profile.certifications.map(c=><p key={c.title}><strong>{c.title}</strong> — {c.issuer}, {c.date}{c.credential?` · Credential ${c.credential}`:""}</p>)}<h3>Skills</h3>{profile.skillGroups.map(([k,v])=><p key={k}><strong>{k}:</strong> {v}</p>)}<div className={styles.links}><a href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a><a href={contact.github} target="_blank" rel="noreferrer">GitHub · {profile.github.repos} repositories ↗</a><a href={contact.resume} target="_blank" rel="noreferrer">Résumé ↗</a></div></>}
    {section==="lab"&&<><span className={styles.eyebrow}>EXPERIMENT 001 / ORBIT STUDY</span><h2 id={titleId}>A little gravity.<em>A small, playable sketch.</em></h2><p>A circular-orbit sketch: change the radius and watch the orbital speed respond. This is a creative coding experiment inside the portfolio.</p><OrbitLab motion={motion}/></>}
    {section==="credits"&&<><span className={styles.eyebrow}>ABOUT THIS LITTLE WORLD</span><h2 id={titleId}>Built in the browser.<em>One small detail at a time.</em></h2><p>This is a real Three.js scene: procedural furniture, live lighting, interactive geometry, and original little Pip. The archive and rooftop load when you visit. Rain and interaction sounds are synthesized on your device.</p><p>The optional rubber duck model is © 2006 Sony, provided through Khronos glTF Sample Assets under the SCEA Shared Source License 1.0.</p><div className={styles.links}><a href="/models/SCEA-LICENSE.txt" target="_blank" rel="noreferrer">Asset license ↗</a><a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Duck" target="_blank" rel="noreferrer">Model source ↗</a></div><p>Motion follows your device preference by default. Use Settings for a quieter scene or switch to the reading room for the complete portfolio without 3D.</p></>}
  </article>;
}
function OrbitLab({motion}:{motion:boolean}){const [radius,setRadius]=useState(80),[playing,setPlaying]=useState(true);const seconds=6*Math.pow(radius/80,1.5);return <div className={styles.lab}><svg viewBox="0 0 400 280" role="img" aria-label={`Orbit radius ${radius}, period ${seconds.toFixed(1)} seconds`}><defs><pattern id="lab-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#8a7560"/></pattern></defs><rect width="400" height="280" fill="url(#lab-grid)"/><circle cx="200" cy="140" r={radius} fill="none" stroke="#c2b191" strokeDasharray="3 5"/><circle cx="200" cy="140" r="17" fill="#e0a526"/><g className={styles.orbit} style={{animationDuration:`${seconds}s`,animationPlayState:motion&&playing?"running":"paused"} as CSSProperties}><circle cx={200+radius} cy="140" r="7" fill="#f1eadb"/></g></svg><label>Orbit radius <input type="range" min="42" max="112" value={radius} onChange={e=>setRadius(Number(e.target.value))}/><output>{radius}</output></label><div><button onClick={()=>setPlaying(v=>!v)} disabled={!motion}>{!motion?"Motion is disabled":playing?"Pause orbit":"Resume orbit"}</button><span>Period {seconds.toFixed(1)}s · T ∝ r³⁄²</span></div></div>;}

