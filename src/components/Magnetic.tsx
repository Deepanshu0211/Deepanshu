"use client";
import {useEffect,useRef,type ReactNode} from "react";
import {gsap} from "gsap";

// Pulls its child gently toward the cursor and springs back on leave. Fine pointers only; inert with reduced motion.
export default function Magnetic({children,strength=.32,disabled=false,className}:{children:ReactNode;strength?:number;disabled?:boolean;className?:string}){
 const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  const el=ref.current;if(!el||disabled||!matchMedia("(pointer: fine)").matches||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const x=gsap.quickTo(el,"x",{duration:.5,ease:"power3.out"}),y=gsap.quickTo(el,"y",{duration:.5,ease:"power3.out"});
  function move(e:PointerEvent){const r=el!.getBoundingClientRect();x((e.clientX-r.left-r.width/2)*strength);y((e.clientY-r.top-r.height/2)*strength);}
  function leave(){gsap.to(el,{x:0,y:0,duration:.9,ease:"elastic.out(1,.45)"});}
  el.addEventListener("pointermove",move);el.addEventListener("pointerleave",leave);
  return()=>{el.removeEventListener("pointermove",move);el.removeEventListener("pointerleave",leave);gsap.killTweensOf(el);gsap.set(el,{x:0,y:0});};
 },[strength,disabled]);
 return <span ref={ref} className={className} style={{display:"inline-flex",willChange:"transform"}}>{children}</span>;
}
