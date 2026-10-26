"use client";
import {useEffect,useRef,useState} from "react";
import type {RoomAudio,SongState} from "./world/audio";
import styles from "./CozyPortfolio.module.css";

type Track={title:string;src:string};
/** Where the record player sits in the study (world coordinates): in the room, the music plays from here. */
const RECORD_PLAYER={x:11.82,y:.82,z:5.2};
const SPOTIFY="https://open.spotify.com/embed/playlist/2mwxl3mZFXZ2qkTynAe3VY?utm_source=generator&theme=0";
const clock=(s:number)=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;

// The record player: your own songs from public/music (sound1, sound2, …) with a live spectrum, seeking,
// shuffle and repeat, and a choice of where the music lives: in the room (it fades as you walk away and is
// muffled through walls) or in your headphones (it follows you). Spotify is the second tab.
export default function MusicPlayer({getAudio,onClose}:{getAudio:()=>RoomAudio;onClose:()=>void}){
 const [tab,setTab]=useState<"folder"|"spotify">("folder"),[tracks,setTracks]=useState<Track[]|null>(null),[now,setNow]=useState<SongState|null>(null),[scrub,setScrub]=useState<number|null>(null);
 const bars=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{let cancelled=false;fetch("/api/music").then(r=>r.json()).then((d:{tracks:Track[]})=>{if(cancelled)return;setTracks(d.tracks);if(!d.tracks.length)setTab("spotify");}).catch(()=>{if(!cancelled){setTracks([]);setTab("spotify");}});return()=>{cancelled=true;};},[]);
 useEffect(()=>getAudio().subscribeSong(setNow),[getAudio]);
 // The spectrum: 32 warm bars drawn from the record player's analyser while the panel is open.
 useEffect(()=>{
  const canvas=bars.current;if(!canvas||tab!=="folder")return;const g=canvas.getContext("2d")!,data=new Uint8Array(128);let frame=0;
  const draw=()=>{frame=requestAnimationFrame(draw);getAudio().spectrum(data);const w=canvas.width,h=canvas.height,n=32,gap=3,bw=(w-gap*(n-1))/n;g.clearRect(0,0,w,h);
   for(let i=0;i<n;i++){const v=data[Math.floor(Math.pow(i/n,1.6)*100)+1]/255,bh=Math.max(2,v*h);g.fillStyle=`rgba(224,165,38,${.35+v*.65})`;g.beginPath();g.roundRect(i*(bw+gap),h-bh,bw,bh,2);g.fill();}};
  draw();return()=>cancelAnimationFrame(frame);
 },[getAudio,tab]);
 async function play(index=0){if(!tracks?.length)return;await getAudio().playFolder(tracks,RECORD_PLAYER,index);}
 const audio=getAudio(),time=scrub??now?.time??0,duration=now?.duration??0;
 return <aside className={styles.spotify} aria-label="Record player">
  <header><span>ON THE RECORD PLAYER</span><button onClick={onClose} aria-label="Close the record player">×</button></header>
  <div className={styles.musicTabs} role="tablist"><button role="tab" aria-selected={tab==="folder"} onClick={()=>setTab("folder")}>Your music{tracks?.length?` · ${tracks.length}`:""}</button><button role="tab" aria-selected={tab==="spotify"} onClick={()=>setTab("spotify")}>Spotify</button></div>
  {tab==="folder"?<div className={styles.folder}>
   {tracks===null?<p>Looking in the music folder…</p>:!tracks.length?<p>No songs yet. Put files named <code>sound1.mp3</code>, <code>sound2.mp3</code>, … in <code>public/music</code> and they will play from here.</p>:<>
    <canvas ref={bars} className={styles.spectrum} width={320} height={56} aria-hidden="true"/>
    <strong>{now?.title??"Ready to play"}</strong><small>{now?`Track ${now.index+1} of ${now.count}`:`${tracks.length} songs`} · {now?.spatial===false?"in your headphones: it follows you":"from the record player: walk away and it fades"}</small>
    <div className={styles.seek}><span>{clock(time)}</span><input type="range" min={0} max={Math.max(1,duration)} step={.1} value={Math.min(time,duration||1)} disabled={!now||!duration} aria-label="Seek" onChange={e=>setScrub(Number(e.target.value))} onPointerUp={()=>{if(scrub!==null){audio.seek(scrub);setScrub(null);}}} onKeyUp={()=>{if(scrub!==null){audio.seek(scrub);setScrub(null);}}}/><span>{clock(duration)}</span></div>
    <div className={styles.transport}>
     <button aria-label="Shuffle" aria-pressed={now?.shuffle??false} className={styles.mode} onClick={()=>audio.setSong({shuffle:!(now?.shuffle??false)})}>⤨</button>
     <button aria-label="Previous song" onClick={()=>now?audio.skip(-1):void play(tracks.length-1)}>⏮</button>
     <button className={styles.playButton} aria-label={now?.playing?"Pause":"Play"} onClick={()=>now?audio.pauseSong():void play(0)}>{now?.playing?"❚❚":"▶"}</button>
     <button aria-label="Next song" onClick={()=>now?audio.skip(1):void play(1)}>⏭</button>
     <button aria-label={`Repeat: ${now?.repeat??"all"}`} aria-pressed={(now?.repeat??"all")!=="off"} className={styles.mode} onClick={()=>audio.setSong({repeat:now?.repeat==="all"?"one":now?.repeat==="one"?"off":"all"})}>{now?.repeat==="one"?"↻1":"↻"}</button>
    </div>
    <label className={styles.volume}><span>Volume</span><input type="range" min={0} max={1} step={.01} defaultValue={now?.volume??.9} onChange={e=>audio.setSong({volume:Number(e.target.value)})}/></label>
    <div className={styles.where} role="radiogroup" aria-label="Where the music plays"><button role="radio" aria-checked={now?.spatial!==false} onClick={()=>audio.setSong({spatial:true})}>In the room</button><button role="radio" aria-checked={now?.spatial===false} onClick={()=>audio.setSong({spatial:false})}>In my headphones</button></div>
    <ol>{tracks.map((t,i)=><li key={t.src}><button aria-current={now?.index===i} onClick={()=>void play(i)}>{now?.index===i&&now.playing?"♪ ":""}{t.title}</button></li>)}</ol>
   </>}
  </div>:<><iframe title="Deepanshu's playlist on Spotify" src={SPOTIFY} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"/><small>Spotify plays at its own volume: its player can’t be placed in the room.</small></>}
 </aside>;
}
