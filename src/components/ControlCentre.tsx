"use client";
import {useEffect,useRef,type ReactNode} from "react";
import {gsap} from "gsap";
import type {Weather} from "./world/objects";
import type {Live} from "./world/live";
import styles from "./ControlCentre.module.css";

export interface Prefs{fov:number;sensitivity:number;lights:number;fan:number;life:boolean;ao:boolean;bloom:boolean;grain:boolean;volume:number;fps:boolean}
export const defaultPrefs:Prefs={fov:68,sensitivity:1,lights:1,fan:1,life:true,ao:true,bloom:true,grain:true,volume:.8,fps:true};

function Row({label,hint,children}:{label:string;hint?:string;children:ReactNode}){return <div className={styles.row}><span>{label}{hint&&<small>{hint}</small>}</span>{children}</div>;}
function Toggle({on,onChange,label}:{on:boolean;onChange:(v:boolean)=>void;label:string}){return <button className={styles.toggle} role="switch" aria-checked={on} aria-label={label} onClick={()=>onChange(!on)}><i/></button>;}
function Slider({value,min,max,step,onChange,label,format}:{value:number;min:number;max:number;step:number;onChange:(v:number)=>void;label:string;format:(v:number)=>string}){return <label className={styles.slider}><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} aria-label={label}/><output>{format(value)}</output></label>;}

// Everything a visitor can tune, in one sheet: atmosphere, view, graphics, the neighbourhood, and shortcuts.
export default function ControlCentre(props:{open:boolean;onClose:()=>void;prefs:Prefs;setPref:<K extends keyof Prefs>(k:K,v:Prefs[K])=>void;weather:Weather;setWeather:(w:Weather|"live")=>void;weatherMode:"live"|"manual";live:Live|null;usePrecise:()=>void;precise:boolean;lamp:boolean;setLamp:(v:boolean)=>void;motion:boolean;setMotion:(v:boolean)=>void;quality:"auto"|"low";setQuality:(v:"auto"|"low")=>void;sound:boolean;toggleSound:()=>void;go:(where:string)=>void;touch:boolean}){
 const {open,onClose,prefs,setPref}=props,sheet=useRef<HTMLElement>(null);
 useEffect(()=>{if(!open)return;const key=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",key);
  if(props.motion&&sheet.current)gsap.fromTo(sheet.current.querySelectorAll("[data-group]"),{x:24,opacity:0},{x:0,opacity:1,duration:.6,stagger:.05,ease:"expo.out",clearProps:"all"});
  return()=>window.removeEventListener("keydown",key);},[open]);// eslint-disable-line react-hooks/exhaustive-deps
 const pct=(v:number)=>`${Math.round(v*100)}%`;
 return <>
  <div className={styles.scrim} data-open={open} onClick={onClose} aria-hidden="true"/>
  <aside ref={sheet} className={styles.sheet} data-open={open} aria-label="Control centre" aria-hidden={!open} inert={!open}>
   <header><div><span>CONTROL CENTRE</span><h2>Make it yours.</h2></div><button onClick={onClose} aria-label="Close control centre">×</button></header>
   <section data-group><h3>Atmosphere</h3>
    <div className={styles.segment} role="radiogroup" aria-label="Weather"><button role="radio" aria-checked={props.weatherMode==="live"} onClick={()=>props.setWeather("live")}>Live</button>{([["rain","Rain"],["day","Afternoon"],["sunset","Golden hour"],["night","Night"]] as [Weather,string][]).map(([w,l])=><button key={w} role="radio" aria-checked={props.weatherMode==="manual"&&props.weather===w} onClick={()=>props.setWeather(w)}>{l}</button>)}</div>
    {props.weatherMode==="live"&&<p className={styles.live}>{props.live?<>{props.live.summary}{props.live.temperature!==null?` · ${props.live.temperature}°C`:""} in {props.live.place} · {new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})} your time</>:"Checking your local time and weather…"}{!props.precise&&<button className={styles.inline} onClick={props.usePrecise}>Use my exact location</button>}</p>}
    <Row label="Room lights" hint="ceiling fittings"><Slider label="Room lights" value={prefs.lights} min={0} max={1.6} step={.05} onChange={v=>setPref("lights",v)} format={pct}/></Row>
    <Row label="Desk lamp"><Toggle label="Desk lamp" on={props.lamp} onChange={props.setLamp}/></Row>
    <Row label="Ceiling fans"><Slider label="Ceiling fan speed" value={prefs.fan} min={0} max={2.5} step={.1} onChange={v=>setPref("fan",v)} format={v=>v===0?"off":`${v.toFixed(1)}×`}/></Row>
   </section>
   <section data-group><h3>View</h3>
    <Row label="Field of view"><Slider label="Field of view" value={prefs.fov} min={50} max={90} step={1} onChange={v=>setPref("fov",v)} format={v=>`${v}°`}/></Row>
    <Row label="Look sensitivity"><Slider label="Look sensitivity" value={prefs.sensitivity} min={.3} max={2.5} step={.05} onChange={v=>setPref("sensitivity",v)} format={v=>`${v.toFixed(2)}×`}/></Row>
    <Row label="Ambient motion" hint="fans, rain, people"><Toggle label="Ambient motion" on={props.motion} onChange={props.setMotion}/></Row>
    {!props.touch&&<p className={styles.tip}>Hold the <kbd>right mouse button</kbd> to zoom in.</p>}
   </section>
   <section data-group><h3>Graphics</h3>
    <Row label="Quality"><div className={styles.segment}>{(["auto","low"] as const).map(q=><button key={q} role="radio" aria-checked={props.quality===q} onClick={()=>props.setQuality(q)}>{q==="auto"?"High":"Fast"}</button>)}</div></Row>
    <Row label="Ambient occlusion"><Toggle label="Ambient occlusion" on={prefs.ao} onChange={v=>setPref("ao",v)}/></Row>
    <Row label="Bloom"><Toggle label="Bloom" on={prefs.bloom} onChange={v=>setPref("bloom",v)}/></Row>
    <Row label="Film grain & vignette"><Toggle label="Film grain" on={prefs.grain} onChange={v=>setPref("grain",v)}/></Row>
    <Row label="FPS counter" hint="frame rate, frame time, resolution"><Toggle label="FPS counter" on={prefs.fps} onChange={v=>setPref("fps",v)}/></Row>
   </section>
   <section data-group><h3>World</h3>
    <Row label="Neighbourhood life" hint="people, traffic, birds"><Toggle label="Neighbourhood life" on={prefs.life} onChange={v=>setPref("life",v)}/></Row>
    <Row label="Sound" hint="fans, rain, street, footsteps"><span data-sound-toggle><Toggle label="Sound" on={props.sound} onChange={()=>props.toggleSound()}/></span></Row>
    <Row label="Volume"><Slider label="Volume" value={prefs.volume} min={0} max={1} step={.05} onChange={v=>setPref("volume",v)} format={pct}/></Row>
    <Row label="Record player" hint="your songs and Spotify"><button className={styles.inline} onClick={()=>props.go("spotify")}>Open ↗</button></Row>
   </section>
   <section data-group><h3>Go to</h3>
    <div className={styles.links}>{[["friends","Play with friends"],["computer","Sit at the computer"],["projects","All projects"],["profile","Profile & certificates"],["skills","Skills"],["experience","Experience"],["telescope","The telescope"],["contact","Say hello"],["credits","About this world"],["reading","Reading mode"]].map(([k,l])=><button key={k} onClick={()=>props.go(k)}>{l}<span aria-hidden="true">↗</span></button>)}</div>
   </section>
  </aside>
 </>;
}
