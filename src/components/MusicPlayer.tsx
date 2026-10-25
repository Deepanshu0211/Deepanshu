"use client";
import {useEffect,useState} from "react";
import type {RoomAudio} from "./world/audio";
import styles from "./CozyPortfolio.module.css";

type Track={title:string;src:string};
type Now={title:string;index:number;count:number;playing:boolean}|null;
/** Where the record player sits in the study (world coordinates): the music plays from here. */
const RECORD_PLAYER={x:11.82,y:.82,z:5.2};
const SPOTIFY="https://open.spotify.com/embed/playlist/2mwxl3mZFXZ2qkTynAe3VY?utm_source=generator&theme=0";

// The record player: your own songs from public/music (sound1, sound2, …) played as positional
// audio in the study, with the Spotify playlist as a second tab.
export default function MusicPlayer({getAudio,onClose}:{getAudio:()=>RoomAudio;onClose:()=>void}){
 const [tab,setTab]=useState<"folder"|"spotify">("folder"),[tracks,setTracks]=useState<Track[]|null>(null),[now,setNow]=useState<Now>(null);
 useEffect(()=>{let cancelled=false;fetch("/api/music").then(r=>r.json()).then((d:{tracks:Track[]})=>{if(cancelled)return;setTracks(d.tracks);if(!d.tracks.length)setTab("spotify");}).catch(()=>{if(!cancelled){setTracks([]);setTab("spotify");}});return()=>{cancelled=true;};},[]);
 useEffect(()=>getAudio().subscribeSong(setNow),[getAudio]);
 async function play(index=0){if(!tracks?.length)return;await getAudio().playFolder(tracks,RECORD_PLAYER,index);}
 return <aside className={styles.spotify} aria-label="Record player">
  <header><span>ON THE RECORD PLAYER</span><button onClick={onClose} aria-label="Close the record player">×</button></header>
  <div className={styles.musicTabs} role="tablist"><button role="tab" aria-selected={tab==="folder"} onClick={()=>setTab("folder")}>Your music{tracks?.length?` · ${tracks.length}`:""}</button><button role="tab" aria-selected={tab==="spotify"} onClick={()=>setTab("spotify")}>Spotify</button></div>
  {tab==="folder"?<div className={styles.folder}>
   {tracks===null?<p>Looking in the music folder…</p>:!tracks.length?<p>No songs yet. Put files named <code>sound1.mp3</code>, <code>sound2.mp3</code>, … in <code>public/music</code> and they will play from here.</p>:<>
    <strong>{now?.title??"Ready to play"}</strong><small>{now?`Track ${now.index+1} of ${now.count}`:`${tracks.length} songs`} · plays from the record player: walk away and it fades</small>
    <div className={styles.transport}><button aria-label="Previous song" onClick={()=>now?getAudio().skip(-1):void play(tracks.length-1)}>⏮</button><button className={styles.playButton} aria-label={now?.playing?"Pause":"Play"} onClick={()=>now?getAudio().pauseSong():void play(0)}>{now?.playing?"❚❚":"▶"}</button><button aria-label="Next song" onClick={()=>now?getAudio().skip(1):void play(1)}>⏭</button></div>
    <ol>{tracks.map((t,i)=><li key={t.src}><button aria-current={now?.index===i} onClick={()=>void play(i)}>{t.title}</button></li>)}</ol>
   </>}
  </div>:<><iframe title="Deepanshu's playlist on Spotify" src={SPOTIFY} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"/><small>Spotify plays at its own volume: its player can’t be placed in the room.</small></>}
 </aside>;
}
