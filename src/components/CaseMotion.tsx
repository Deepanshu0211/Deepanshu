"use client";
import {useEffect} from "react";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";

// Case-study choreography: title letters rise, the cover unmasks and drifts with scroll and tilts
// toward the cursor, and each later section settles in as it reaches the reader.
export default function CaseMotion(){
 useEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  const mm=gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)",()=>{
   const intro=gsap.timeline({defaults:{ease:"expo.out"}});
   intro.from(".case-page > .eyebrow",{y:14,opacity:0,duration:.9})
    .from("[data-case-letter]",{yPercent:110,duration:1.25,stagger:.035},.08)
    .from(".case-tagline",{y:24,opacity:0,duration:1.1},.45)
    .fromTo(".case-cover",{y:70,opacity:0,clipPath:"inset(14% 8% 0% 8%)"},{y:0,opacity:1,clipPath:"inset(0% 0% 0% 0%)",duration:1.5,clearProps:"clipPath,opacity"},.55);
   gsap.utils.toArray<HTMLElement>("[data-case-reveal]").forEach(section=>{
    gsap.from(section.children,{y:40,opacity:0,duration:1.1,ease:"expo.out",stagger:.09,scrollTrigger:{trigger:section,start:"clamp(top bottom-=80)",once:true}});
   });
   gsap.fromTo(".case-cover svg, .case-cover img",{yPercent:-6},{yPercent:6,ease:"none",scrollTrigger:{trigger:".case-cover",start:"top bottom",end:"bottom top",scrub:.6}});
   const refresh=()=>ScrollTrigger.refresh();if(document.readyState!=="complete")window.addEventListener("load",refresh,{once:true});
   return()=>window.removeEventListener("load",refresh);
  });
  mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)",()=>{
   const cover=document.querySelector<HTMLElement>(".case-cover");if(!cover)return;
   gsap.set(cover,{transformPerspective:1400});
   const rx=gsap.quickTo(cover,"rotationX",{duration:.8,ease:"power3.out"}),ry=gsap.quickTo(cover,"rotationY",{duration:.8,ease:"power3.out"});
   function move(e:PointerEvent){const r=cover!.getBoundingClientRect();rx(((e.clientY-r.top)/r.height-.5)*-5);ry(((e.clientX-r.left)/r.width-.5)*7);cover!.style.setProperty("--glare-x",`${(e.clientX-r.left)/r.width*100}%`);cover!.style.setProperty("--glare-y",`${(e.clientY-r.top)/r.height*100}%`);}
   function leave(){rx(0);ry(0);}
   cover.addEventListener("pointermove",move);cover.addEventListener("pointerleave",leave);
   return()=>{cover.removeEventListener("pointermove",move);cover.removeEventListener("pointerleave",leave);};
  });
  return()=>mm.revert();
 },[]);
 return null;
}
