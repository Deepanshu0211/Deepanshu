"use client";
import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type ReactNode} from "react";
import {gsap} from "gsap";
import {projects,experience,skills,contact,profile} from "./world/content";
import styles from "./Computer.module.css";

// A small, working desktop that appears on the monitor (or the laptop) when you sit down.
// Everything here is real: windows drag and stack, the terminal takes commands, the browser loads pages.
type App="projects"|"terminal"|"browser"|"notes"|"mail"|"resume"|"photos"|"music";
interface Win{id:number;app:App;x:number;y:number;w:number;h:number;z:number;arg?:string}
const apps:Record<App,{title:string;icon:string;w:number;h:number}>={
 projects:{title:"Projects",icon:"▦",w:760,h:470},terminal:{title:"Terminal",icon:">_",w:620,h:380},browser:{title:"Browser",icon:"◎",w:900,h:540},
 notes:{title:"About me",icon:"✎",w:520,h:460},music:{title:"Music",icon:"♫",w:420,h:480},mail:{title:"Say hello",icon:"✉",w:520,h:400},resume:{title:"Résumé.pdf",icon:"▤",w:640,h:560},photos:{title:"Photos",icon:"▣",w:640,h:440},
};
const dock:App[]=["projects","terminal","browser","music","notes","photos","resume","mail"];
const photos=["/images/polaroid-sunset.jpg","/images/hero-anime.jpg","/images/about-anime.jpg","/images/impact-hub.jpg","/images/neatify.jpg","/images/suzu.jpg"];

export default function Computer({seat,motion,onExit}:{seat:{id:"computer"|"laptop";x:number;y:number;w:number;h:number};motion:boolean;onExit:()=>void}){
 const [wins,setWins]=useState<Win[]>([]),[booted,setBooted]=useState(!motion),[clock,setClock]=useState("");
 const root=useRef<HTMLDivElement>(null),z=useRef(10),nextId=useRef(1);
 // Fit a virtual 1440-wide desktop into the projected screen; on small viewports use the whole screen.
 const small=typeof window!=="undefined"&&window.innerWidth<820;
 const rect=small?{x:8,y:8,w:window.innerWidth-16,h:window.innerHeight-16}:seat;
 const virtualW=small?Math.max(rect.w,360):1440,scale=rect.w/virtualW,virtualH=rect.h/scale;
 useEffect(()=>{const tick=()=>setClock(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));tick();const t=setInterval(tick,15000);return()=>clearInterval(t);},[]);
 useEffect(()=>{if(booted)return;const t=setTimeout(()=>setBooted(true),1300);return()=>clearTimeout(t);},[booted]);
 useEffect(()=>{if(booted&&!wins.length)open("projects");},[booted]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();onExit();}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[onExit]);
 function open(app:App,arg?:string){
  setWins(list=>{const existing=list.find(w=>w.app===app);z.current++;if(existing)return list.map(w=>w===existing?{...w,z:z.current,arg:arg??w.arg}:w);
   const a=apps[app],n=list.length,w=Math.min(a.w,virtualW-40),h=Math.min(a.h,virtualH-110);
   return [...list,{id:nextId.current++,app,arg,w,h,x:Math.max(20,Math.min(virtualW-w-20,(virtualW-w)/2+(n-1)*36)),y:Math.max(44,Math.min(virtualH-h-80,(virtualH-h)/2-30+n*28)),z:z.current}];});
 }
 function close(id:number){setWins(list=>list.filter(w=>w.id!==id));}
 function focus(id:number){z.current++;setWins(list=>list.map(w=>w.id===id?{...w,z:z.current}:w));}
 function drag(id:number,e:ReactPointerEvent){
  focus(id);const start={x:e.clientX,y:e.clientY},win=wins.find(w=>w.id===id);if(!win)return;const origin={x:win.x,y:win.y};
  const move=(ev:PointerEvent)=>setWins(list=>list.map(w=>w.id===id?{...w,x:origin.x+(ev.clientX-start.x)/scale,y:Math.max(32,origin.y+(ev.clientY-start.y)/scale)}:w));
  const up=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);};
  window.addEventListener("pointermove",move);window.addEventListener("pointerup",up);
 }
 useEffect(()=>{if(!motion||!root.current)return;gsap.fromTo(root.current,{opacity:0,filter:"brightness(2.2) blur(6px)"},{opacity:1,filter:"brightness(1) blur(0px)",duration:.7,ease:"power2.out"});},[motion]);
 const top=[...wins].sort((a,b)=>b.z-a.z)[0];
 return <div className={styles.frame} style={{left:rect.x,top:rect.y,width:rect.w,height:rect.h,borderRadius:small?14:seat.id==="laptop"?4:2}} data-device={seat.id}>
  <div ref={root} className={styles.screen} style={{width:virtualW,height:virtualH,transform:`scale(${scale})`}} data-wallpaper={seat.id}>
   {!booted?<div className={styles.boot}><strong>DY</strong><span>Welcome back, {profile.name.split(" ")[0]}</span><i/></div>:<>
   <header className={styles.menubar}><b>DY OS</b><span>{top?apps[top.app].title:"Finder"}</span><nav><button onClick={()=>open("projects")}>Projects</button><button onClick={()=>open("terminal")}>Terminal</button><button onClick={()=>open("mail")}>Contact</button></nav><span className={styles.status}>◔ 82% · {clock}</span><button className={styles.standUp} onClick={onExit}>Stand up ⎋</button></header>
   <div className={styles.icons}>{(["projects","resume","notes","terminal"] as App[]).map(a=><button key={a} onDoubleClick={()=>open(a)} onClick={e=>{if(e.detail===0)open(a);}} onKeyDown={e=>{if(e.key==="Enter")open(a);}}><i>{apps[a].icon}</i><span>{a==="resume"?"Résumé.pdf":apps[a].title}</span></button>)}</div>
   {wins.map(w=><section key={w.id} className={styles.window} style={{left:w.x,top:w.y,width:w.w,height:w.h,zIndex:w.z}} onPointerDown={()=>focus(w.id)} data-focused={w===top} aria-label={apps[w.app].title}>
    <div className={styles.titlebar} onPointerDown={e=>drag(w.id,e)}><span className={styles.lights}><button aria-label="Close" onClick={()=>close(w.id)}/><button aria-label="Minimise" onClick={()=>close(w.id)}/><button aria-label="Zoom" onClick={()=>setWins(l=>l.map(x=>x.id===w.id?{...x,x:16,y:40,w:virtualW-32,h:virtualH-120}:x))}/></span><b>{apps[w.app].title}</b></div>
    <div className={styles.body}>{render(w)}</div>
   </section>)}
   <footer className={styles.dock}>{dock.map(a=><button key={a} onClick={()=>open(a)} aria-label={apps[a].title} data-open={wins.some(w=>w.app===a)}><i>{apps[a].icon}</i><span>{apps[a].title}</span></button>)}</footer>
   </>}
  </div>
 </div>;
 function render(w:Win):ReactNode{
  if(w.app==="projects")return <ProjectsApp onOpen={path=>open("browser",path)}/>;
  if(w.app==="terminal")return <Terminal onOpen={open} onExit={onExit}/>;
  if(w.app==="browser")return <Browser key={w.arg??"start"} start={w.arg??"start"}/>;
  if(w.app==="notes")return <Notes/>;
  if(w.app==="mail")return <Mail/>;
  if(w.app==="music")return <iframe className={styles.frameDoc} title="Deepanshu's playlist on Spotify" src="https://open.spotify.com/embed/playlist/2mwxl3mZFXZ2qkTynAe3VY?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"/>;
  if(w.app==="resume")return <iframe className={styles.frameDoc} src={contact.resume} title="Résumé"/>;
  return <Photos/>;
 }
}

function ProjectsApp({onOpen}:{onOpen:(path:string)=>void}){
 const [i,setI]=useState(0),p=projects[i];
 const image=p.type==="impact"?"/images/impact-hub.jpg":p.type==="neatify"?"/images/neatify.jpg":null;
 return <div className={styles.finder}><aside>{projects.map((x,k)=><button key={x.type} aria-pressed={k===i} onClick={()=>setI(k)}><span>0{k+1}</span>{x.name}<small>{x.category}</small></button>)}</aside>
  <article key={p.type}><span className={styles.kicker}>{p.category}</span><h3>{p.name}</h3><p className={styles.tag}>{p.tagline}</p>{image?<img src={image} alt={`${p.name} preview`}/>:<div className={styles.placeholder}>{p.name}</div>}<p>{p.description}</p>
   <div className={styles.chips}>{p.stack.map(s=><span key={s}>{s}</span>)}</div>
   <div className={styles.actions}><button onClick={()=>onOpen(`/work/${p.type}`)}>Open case study</button><a href={p.github} target="_blank" rel="noreferrer">Source ↗</a>{p.live&&<a href={p.live} target="_blank" rel="noreferrer">Live ↗</a>}</div></article></div>;
}

function Terminal({onOpen,onExit}:{onOpen:(a:App,arg?:string)=>void;onExit:()=>void}){
 const [lines,setLines]=useState<string[]>(["DY OS terminal — type `help` to see what I can do."]),[input,setInput]=useState(""),[history,setHistory]=useState<string[]>([]),[cursor,setCursor]=useState(-1);
 const out=useRef<HTMLDivElement>(null),field=useRef<HTMLInputElement>(null);
 useEffect(()=>{out.current?.scrollTo(0,1e6);},[lines]);useEffect(()=>{field.current?.focus();},[]);
 function run(raw:string){
  const [cmd,...rest]=raw.trim().split(/\s+/),arg=rest.join(" ").toLowerCase();let res:string[]=[];
  switch((cmd||"").toLowerCase()){
   case "":break;
   case "help":res=["whoami        who is this","neofetch      the system, briefly","projects      list my work      open <name>   open a case study","skills        what I build with","experience    where I have worked","education     where I study","certs         certificates","contact       how to reach me","github · linkedin · resume · music","date · clear · exit"];break;
   case "whoami":res=[`${profile.name} — ${profile.headline}`,profile.about];break;
   case "neofetch":res=["   ____  __  __     deepanshu@dy-os","  |  _ \\ \\ \\/ /     ---------------","  | | | | \\  /      OS: DY OS (a browser, really)","  | |_| | /  \\      Host: a fourth-floor flat, India",`  |____/ /_/\\_\\     Shell: curiosity · Role: ${experience[0].role}`,`                     Projects: ${projects.length} · Repos: ${profile.github.repos} · Followers: ${profile.github.followers}`];break;
   case "projects":case "ls":res=projects.map((p,i)=>`0${i+1}  ${p.name.padEnd(10)} ${p.stack.join(", ")}`);break;
   case "open":{const p=projects.find(x=>x.name.toLowerCase()===arg||x.type===arg);if(p){onOpen("browser",`/work/${p.type}`);res=[`opening ${p.name}…`];}else res=[`no project called "${arg}". try: ${projects.map(p=>p.name.toLowerCase()).join(", ")}`];break;}
   case "skills":res=profile.skillGroups.map(([k,v])=>`${k.padEnd(16)} ${v}`);break;
   case "experience":res=experience.flatMap(e=>[`${e.company} — ${e.role} (${e.dates})`,`  ${e.detail}`]);break;
   case "education":res=profile.education.map(e=>`${e.school} — ${e.degree} · ${e.dates}`);break;
   case "certs":res=profile.certifications.map(c=>`✓ ${c.title} · ${c.issuer}, ${c.date}${c.credential?` · ${c.credential}`:""}`);break;
   case "contact":res=[`email     ${contact.email}`,`github    ${contact.github}`,`linkedin  ${contact.linkedin}`];onOpen("mail");break;
   case "github":window.open(contact.github,"_blank","noopener");res=["opening GitHub in a new tab…"];break;
   case "linkedin":window.open(contact.linkedin,"_blank","noopener");res=["opening LinkedIn in a new tab…"];break;
   case "resume":onOpen("resume");res=["opening Résumé.pdf…"];break;
   case "music":case "spotify":onOpen("music");res=["opening the playlist…"];break;
   case "date":res=[new Date().toLocaleString()];break;
   case "clear":setLines([]);return;
   case "exit":onExit();return;
   case "sudo":res=["nice try."];break;
   default:res=[`command not found: ${cmd}. type \`help\`.`];
  }
  setLines(l=>[...l,`➜ ~ ${raw}`,...res]);
 }
 return <div className={styles.terminal} onClick={()=>field.current?.focus()}><div ref={out}>{lines.map((l,i)=><pre key={i} data-prompt={l.startsWith("➜")}>{l}</pre>)}</div>
  <form onSubmit={e=>{e.preventDefault();run(input);if(input.trim())setHistory(h=>[input,...h]);setInput("");setCursor(-1);}}><span>➜ ~</span><input ref={field} value={input} onChange={e=>setInput(e.target.value)} aria-label="Terminal command" spellCheck={false} autoComplete="off"
   onKeyDown={e=>{if(e.key==="ArrowUp"){e.preventDefault();const c=Math.min(history.length-1,cursor+1);setCursor(c);setInput(history[c]??"");}if(e.key==="ArrowDown"){e.preventDefault();const c=Math.max(-1,cursor-1);setCursor(c);setInput(c<0?"":history[c]);}}}/></form></div>;
}

function Browser({start}:{start:string}){
 const [url,setUrl]=useState(start),[draft,setDraft]=useState(start==="start"?"":start),[stack,setStack]=useState<string[]>([start]);
 function go(next:string){const clean=next.trim()||"start";setUrl(clean);setDraft(clean==="start"?"":clean);setStack(s=>[...s,clean]);}
 const external=/^https?:/.test(url);
 return <div className={styles.browser}><form onSubmit={e=>{e.preventDefault();go(draft.startsWith("/")||/^https?:/.test(draft)?draft:`/${draft}`);}}>
   <button type="button" aria-label="Back" onClick={()=>{if(stack.length>1){const s=stack.slice(0,-1);setStack(s);setUrl(s[s.length-1]);setDraft(s[s.length-1]==="start"?"":s[s.length-1]);}}}>←</button><button type="button" aria-label="Home" onClick={()=>go("start")}>⌂</button>
   <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="deepanshuyad.in" aria-label="Address"/></form>
  {url==="start"?<div className={styles.startPage}><h4>Good to see you.</h4><p>Bookmarks</p><div>{projects.map(p=><button key={p.type} onClick={()=>go(`/work/${p.type}`)}><b>{p.name}</b><span>Case study</span></button>)}<button onClick={()=>go(contact.resume)}><b>Résumé</b><span>PDF</span></button><a href={contact.github} target="_blank" rel="noreferrer"><b>GitHub</b><span>opens a new tab ↗</span></a><a href={contact.linkedin} target="_blank" rel="noreferrer"><b>LinkedIn</b><span>opens a new tab ↗</span></a></div></div>
  :external?<div className={styles.startPage}><h4>That site opens in its own tab.</h4><a href={url} target="_blank" rel="noreferrer">{url} ↗</a></div>
  :<iframe className={styles.frameDoc} src={url} title="Browser"/>}</div>;
}

function Notes(){
 return <div className={styles.notes}><h3>{profile.name}</h3><p className={styles.tag}>{profile.headline}</p><p>{profile.about}</p>
  <h4>Education</h4>{profile.education.map(e=><p key={e.school}><b>{e.school}</b><br/>{e.degree} · {e.dates}</p>)}
  <h4>Certifications</h4>{profile.certifications.map(c=><p key={c.title}><b>{c.title}</b><br/>{c.issuer} · {c.date}</p>)}
  <h4>Tools I reach for</h4><p>{skills.join(" · ")}</p></div>;
}
function Mail(){
 const [subject,setSubject]=useState("Hello from your portfolio"),[body,setBody]=useState("");
 return <form className={styles.mail} action={`mailto:${contact.email}`} onSubmit={e=>{e.preventDefault();window.location.href=`mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;}}>
  <label>To<input value={contact.email} readOnly/></label><label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)}/></label><textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="An idea, a collaboration, or just a hello…" aria-label="Message"/><button>Open in my mail app ↗</button></form>;
}
function Photos(){
 const [big,setBig]=useState<string|null>(null);
 return <div className={styles.photos}>{big?<button className={styles.bigPhoto} onClick={()=>setBig(null)}><img src={big} alt=""/></button>:photos.map(src=><button key={src} onClick={()=>setBig(src)}><img src={src} alt=""/></button>)}</div>;
}
