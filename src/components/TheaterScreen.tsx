"use client";
import {useEffect,useState} from "react";
import styles from "./TheaterScreen.module.css";

/** What plays on the living-room big screen. */
export const THEATER_URL="https://yapgrid.com/";

// The home theatre: while you sit facing the big screen, the site plays inside the TV itself. The world reports where
// the screen sits on the page and the frame is laid exactly over it, so it reads as the picture on the TV.
export default function TheaterScreen({seat,onExit}:{seat:{x:number;y:number;w:number;h:number};onExit:()=>void}){
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();onExit();}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[onExit]);
 return <div className={styles.theater} style={{left:seat.x,top:seat.y,width:seat.w,height:seat.h}}>
  <iframe title="yapgrid on the big screen" src={THEATER_URL} allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" onLoad={()=>setLoaded(true)} data-loaded={loaded}/>
  {!loaded&&<span className={styles.tuning}>Tuning in…</span>}
  <div className={styles.bar}><a href={THEATER_URL} target="_blank" rel="noreferrer">Open yapgrid ↗</a><button onClick={onExit}>Get up <kbd>Esc</kbd></button></div>
 </div>;
}
