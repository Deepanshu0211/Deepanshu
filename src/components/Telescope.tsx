"use client";
import {useEffect,useRef,useState} from "react";
import * as T from "three";
import {gsap} from "gsap";
import {moonTextureAsync,moonPhase} from "./world/sky";
import styles from "./Telescope.module.css";

type Target="moon"|"jupiter"|"saturn"|"mars";
const targets:Record<Target,{name:string;kicker:string;facts:string[]}>={
 moon:{name:"The Moon",kicker:"OUR NEAREST NEIGHBOUR",facts:["384,400 km away on average","3,474 km across","Light from it reaches you in about 1.3 seconds"]},
 jupiter:{name:"Jupiter",kicker:"THE GAS GIANT",facts:["139,820 km across, about 11 Earths wide","The Great Red Spot is a storm larger than Earth","Those four points are Io, Europa, Ganymede and Callisto"]},
 saturn:{name:"Saturn",kicker:"THE RINGED PLANET",facts:["116,460 km across","Its rings span roughly 280,000 km but are mostly tens of metres thick","The dark gap in the rings is the Cassini Division"]},
 mars:{name:"Mars",kicker:"THE RED PLANET",facts:["6,779 km across, about half of Earth","Its day lasts 24 hours 37 minutes","The white cap is frozen water and carbon dioxide"]},
};
const order:Target[]=["moon","jupiter","saturn","mars"];

function canvasTexture(w:number,h:number,draw:(ctx:CanvasRenderingContext2D)=>void){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d")!);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
function rand(seed:number){let s=seed;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function bands(colors:string[],seed:number,storm=false){
 return canvasTexture(2048,1024,ctx=>{const r=rand(seed);let y=0;while(y<1024){const h=12+r()*70;ctx.fillStyle=colors[Math.floor(r()*colors.length)];ctx.fillRect(0,y,2048,h+2);y+=h;}
  ctx.globalAlpha=.25;for(let i=0;i<500;i++){const yy=r()*1024;ctx.strokeStyle=colors[Math.floor(r()*colors.length)];ctx.lineWidth=2+r()*8;ctx.beginPath();ctx.moveTo(0,yy);for(let x=0;x<=2048;x+=64)ctx.lineTo(x,yy+Math.sin(x/120+i)*6*r());ctx.stroke();}
  ctx.globalAlpha=1;if(storm){const g=ctx.createRadialGradient(1300,640,4,1300,640,70);g.addColorStop(0,"#b5523a");g.addColorStop(.7,"#c9785a");g.addColorStop(1,"rgba(200,140,110,0)");ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(1300,640,110,55,0,0,7);ctx.fill();}
  const v=ctx.createLinearGradient(0,0,0,1024);v.addColorStop(0,"rgba(0,0,0,.25)");v.addColorStop(.15,"rgba(0,0,0,0)");v.addColorStop(.85,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(0,0,0,.25)");ctx.fillStyle=v;ctx.fillRect(0,0,2048,1024);});
}
function marsTexture(){return canvasTexture(2048,1024,ctx=>{const r=rand(4);ctx.fillStyle="#b5603a";ctx.fillRect(0,0,2048,1024);for(let i=0;i<220;i++){ctx.fillStyle=`rgba(${r()>.5?90:200},${r()>.5?40:110},${r()>.5?25:70},${.08+r()*.18})`;ctx.beginPath();ctx.ellipse(r()*2048,150+r()*724,40+r()*220,20+r()*90,r()*3,0,7);ctx.fill();}const cap=ctx.createLinearGradient(0,0,0,130);cap.addColorStop(0,"#f4efe6");cap.addColorStop(1,"rgba(244,239,230,0)");ctx.fillStyle=cap;ctx.fillRect(0,0,2048,130);});}
function ringTexture(){return canvasTexture(1024,8,ctx=>{for(let x=0;x<1024;x++){const t=x/1024;let a=.15+.6*Math.abs(Math.sin(t*41))*.5+.35*Math.sin(t*9)**2;if(t>.62&&t<.67)a=.04;if(t<.08)a*=t/.08;if(t>.95)a*=(1-t)/.05;const c=200+Math.sin(t*30)*25;ctx.fillStyle=`rgba(${c},${c*.9},${c*.72},${Math.max(0,Math.min(1,a))})`;ctx.fillRect(x,0,1,8);}});}

export default function Telescope({onClose,motion}:{onClose:()=>void;motion:boolean}){
 const mount=useRef<HTMLDivElement>(null),card=useRef<HTMLDivElement>(null),api=useRef<{show:(t:Target)=>void;zoom:(d:number)=>void}|null>(null);
 const [target,setTarget]=useState<Target>("moon"),[focus,setFocus]=useState(motion?7:0);
 const [phase]=useState(()=>moonPhase()),illumination=Math.round((1-Math.cos(phase*Math.PI*2))/2*100);
 const phaseName=phase<.03||phase>.97?"New moon":phase<.22?"Waxing crescent":phase<.28?"First quarter":phase<.47?"Waxing gibbous":phase<.53?"Full moon":phase<.72?"Waning gibbous":phase<.78?"Last quarter":"Waning crescent";
 useEffect(()=>{
  const el=mount.current;if(!el)return;
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;el.appendChild(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color("#010205");const camera=new T.PerspectiveCamera(4,1,.1,2000);camera.position.set(0,0,60);
  scene.add(new T.AmbientLight("#9fb2d6",.04));const sun=new T.DirectionalLight("#fff8ee",3.4);scene.add(sun);
  // Background stars.
  const r=rand(9),positions=new Float32Array(2400*3);for(let i=0;i<2400;i++)positions.set([(r()-.5)*400,(r()-.5)*400,-300-r()*200],i*3);
  const starGeometry=new T.BufferGeometry();starGeometry.setAttribute("position",new T.BufferAttribute(positions,3));scene.add(new T.Points(starGeometry,new T.PointsMaterial({color:"#dfe6ff",size:1.2,sizeAttenuation:false,transparent:true,opacity:.8})));
  const bodies:Record<Target,T.Object3D>={moon:new T.Group(),jupiter:new T.Group(),saturn:new T.Group(),mars:new T.Group()};
  const lunar=new T.MeshStandardMaterial({color:"#a8a59e",roughness:1});const moon=new T.Mesh(new T.SphereGeometry(1.7,128,64),lunar);moon.rotation.y=-Math.PI/2;bodies.moon.add(moon);
  void Promise.all([moonTextureAsync(),moonTextureAsync(true)]).then(([map,bump])=>{lunar.map=map;lunar.bumpMap=bump;lunar.bumpScale=1.1;lunar.color.set("#ffffff");lunar.needsUpdate=true;});
  const jupiter=new T.Mesh(new T.SphereGeometry(1.55,96,64),new T.MeshStandardMaterial({map:bands(["#d8c3a5","#b88e6a","#e9dccb","#a5765a","#cdb08e"],3,true),roughness:.9}));jupiter.scale.y=.935;bodies.jupiter.add(jupiter);
  for(const [x,s] of [[-3.2,.06],[-4.6,.05],[2.9,.07],[4.4,.065]]){const m=new T.Mesh(new T.SphereGeometry(s,16,12),new T.MeshStandardMaterial({color:"#e9e4da",roughness:.8}));m.position.set(x,x*.03,0);bodies.jupiter.add(m);}
  const saturn=new T.Group();saturn.rotation.set(.45,0,.18);bodies.saturn.add(saturn);
  {const globe=new T.Mesh(new T.SphereGeometry(1.1,96,64),new T.MeshStandardMaterial({map:bands(["#e6d4a8","#cdb488","#efe2c0","#bfa47a"],5),roughness:.9}));globe.scale.y=.9;saturn.add(globe);}
  const ringGeometry=new T.RingGeometry(1.45,2.55,160,1);const uv=ringGeometry.attributes.uv,p=ringGeometry.attributes.position;for(let i=0;i<p.count;i++){const d=Math.hypot(p.getX(i),p.getY(i));uv.setXY(i,(d-1.45)/1.1,.5);}
  const ring=new T.Mesh(ringGeometry,new T.MeshStandardMaterial({map:ringTexture(),transparent:true,side:T.DoubleSide,roughness:1,depthWrite:false}));ring.rotation.x=-Math.PI/2;saturn.add(ring);
  const mars=new T.Mesh(new T.SphereGeometry(1.2,96,64),new T.MeshStandardMaterial({map:marsTexture(),roughness:1}));bodies.mars.add(mars);
  order.forEach(k=>{bodies[k].visible=false;scene.add(bodies[k]);});
  let current:Target="moon";bodies.moon.visible=true;
  // Tonight's phase: the sun sits at the phase angle around the moon.
  function light(k:Target){if(k==="moon"){const a=phase*Math.PI*2;sun.position.set(Math.sin(a)*10,1,-Math.cos(a)*10);}else sun.position.set(-4,1.5,9);}
  light("moon");
  let fov=4,panX=0,panY=0,drag:{x:number;y:number}|null=null,raf=0;const t0=performance.now();
  function size(){const w=el!.clientWidth,h=el!.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
  size();const ro=new ResizeObserver(size);ro.observe(el);
  function frame(now:number){
   const t=(now-t0)/1000;
   // Atmospheric seeing: a faint, slow shimmer of the image.
   const shimmer=motion?.0025:0;camera.position.x=panX+Math.sin(t*3.1)*shimmer+Math.sin(t*7.3)*shimmer*.4;camera.position.y=panY+Math.cos(t*2.7)*shimmer;
   camera.fov+=(fov-camera.fov)*.12;camera.updateProjectionMatrix();
   if(motion){moon.rotation.y+=.00004;jupiter.rotation.y+=.0009;saturn.children[0].rotation.y+=.0006;mars.rotation.y+=.0005;}
   renderer.render(scene,camera);raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  function show(k:Target){if(k===current)return;const from=bodies[current],to=bodies[k];current=k;
   if(!motion){from.visible=false;to.visible=true;light(k);panX=panY=0;return;}
   gsap.to(from.position,{x:-8,duration:.55,ease:"power2.in",onComplete:()=>{from.visible=false;from.position.x=0;light(k);to.position.x=8;to.visible=true;gsap.to(to.position,{x:0,duration:.9,ease:"expo.out"});}});panX=panY=0;}
  function zoom(d:number){fov=Math.min(6.5,Math.max(1.6,fov*(d>0?1.12:.89)));}
  api.current={show,zoom};
  const wheel=(e:WheelEvent)=>{e.preventDefault();zoom(e.deltaY);};
  const down=(e:PointerEvent)=>{drag={x:e.clientX,y:e.clientY};el.setPointerCapture(e.pointerId);};
  const move=(e:PointerEvent)=>{if(!drag)return;const s=camera.fov/400;panX=Math.max(-2,Math.min(2,panX-(e.clientX-drag.x)*s));panY=Math.max(-2,Math.min(2,panY+(e.clientY-drag.y)*s));drag={x:e.clientX,y:e.clientY};};
  const up=()=>{drag=null;};
  el.addEventListener("wheel",wheel,{passive:false});el.addEventListener("pointerdown",down);el.addEventListener("pointermove",move);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
  return()=>{cancelAnimationFrame(raf);ro.disconnect();el.removeEventListener("wheel",wheel);el.removeEventListener("pointerdown",down);el.removeEventListener("pointermove",move);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",up);
   scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points){o.geometry.dispose();const m=o.material as T.MeshStandardMaterial;if(m.map&&m!==lunar)m.map.dispose();m.dispose();}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 },[motion,phase]);
 // Settle into focus once the eyepiece opens.
 useEffect(()=>{if(!motion)return;const state={v:7};const tween=gsap.to(state,{v:0,duration:1.8,delay:.25,ease:"power3.out",onUpdate:()=>setFocus(state.v)});return()=>{tween.kill();};},[motion]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();if(e.key==="ArrowRight"||e.key==="ArrowLeft"){const i=(order.indexOf(target)+(e.key==="ArrowRight"?1:3))%4;choose(order[i]);}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);});
 function choose(k:Target){setTarget(k);api.current?.show(k);if(motion&&card.current)gsap.fromTo(card.current.children,{y:14,opacity:0},{y:0,opacity:1,duration:.7,stagger:.06,ease:"power3.out",clearProps:"all"});}
 const info=targets[target];
 return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`Telescope view: ${info.name}`}>
  <div className={styles.eyepiece}><div className={styles.view} ref={mount} style={{filter:`blur(${focus.toFixed(2)}px)`}}/><div className={styles.reticle} aria-hidden="true"/><div className={styles.vignette} aria-hidden="true"/></div>
  <div className={styles.card} ref={card} aria-live="polite"><span>{info.kicker}</span><h2>{info.name}</h2>{target==="moon"&&<p className={styles.live}>Tonight: {phaseName} · {illumination}% lit</p>}<ul>{info.facts.map(f=><li key={f}>{f}</li>)}</ul></div>
  <nav className={styles.targets} aria-label="Choose a target">{order.map(k=><button key={k} aria-pressed={k===target} onClick={()=>choose(k)}>{targets[k].name.replace("The ","")}</button>)}</nav>
  <div className={styles.controls}><label>Focus<input type="range" min="0" max="8" step=".1" value={focus} onChange={e=>setFocus(Number(e.target.value))}/></label><div><button onClick={()=>api.current?.zoom(-1)} aria-label="Zoom in">+</button><button onClick={()=>api.current?.zoom(1)} aria-label="Zoom out">−</button></div><span>Drag to nudge · scroll to zoom · ← → to switch</span></div>
  <button className={styles.close} onClick={onClose}>Step back <span aria-hidden="true">×</span></button>
 </div>;
}
