"use client";
import {useEffect,type RefObject} from "react";
import type {RoomAudio} from "./world/audio";

// One listener for every control on the page: buttons and links click, switches and pressed
// buttons toggle, sliders tick, and typing clicks like keys. The first gesture anywhere starts the
// soundscape (unless the visitor switched sound off before), since browsers need a gesture for audio.
export function useInterfaceSounds(audio:RefObject<RoomAudio|null>,start:()=>void){
 useEffect(()=>{
  let lastSlide=0,started=false;
  function click(e:MouseEvent){
   const el=(e.target as Element|null)?.closest("button,a,summary,[role=switch],[role=radio],label");if(!el||!audio.current?.on)return;
   audio.current.ui(el.getAttribute("role")==="switch"||el.hasAttribute("aria-pressed")||el.getAttribute("role")==="radio"?"toggle":"click");
  }
  function input(e:Event){const t=e.target as HTMLInputElement;if(t.type==="range"&&performance.now()-lastSlide>45){lastSlide=performance.now();audio.current?.ui("slide");}}
  function key(e:KeyboardEvent){const t=e.target as HTMLElement|null;if(t?.matches("input:not([type=range]),textarea")&&(e.key.length===1||e.key==="Backspace"||e.key==="Enter"))audio.current?.ui("key");}
  function first(e:Event){
   if(started)return;started=true;const t=e.target as Element|null;
   let off=false;try{off=localStorage.getItem("dy-world-sound")==="off";}catch{}
   if(!off&&!t?.closest("[data-sound-toggle]")&&!audio.current?.on)start();
  }
  document.addEventListener("click",click,true);document.addEventListener("input",input,true);document.addEventListener("keydown",key,true);
  document.addEventListener("pointerdown",first,true);document.addEventListener("keydown",first,true);
  return()=>{document.removeEventListener("click",click,true);document.removeEventListener("input",input,true);document.removeEventListener("keydown",key,true);document.removeEventListener("pointerdown",first,true);document.removeEventListener("keydown",first,true);};
 },[audio,start]);
}
