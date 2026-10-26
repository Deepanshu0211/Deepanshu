"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {gsap} from "gsap";
import styles from "./SecretDoor.module.css";

/** The brass button behind the study shelf: members sign in, and the server checks them (see /api/members). */
export default function SecretDoor({motion,onClose,onUnlock}:{motion:boolean;onClose:()=>void;onUnlock:(name:string)=>void}){
 const dialog=useRef<HTMLDialogElement>(null),card=useRef<HTMLFormElement>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{const d=dialog.current;if(!d)return;d.showModal();if(motion&&card.current)gsap.fromTo(card.current,{y:30,opacity:0,scale:.98},{y:0,opacity:1,scale:1,duration:.7,ease:"expo.out",clearProps:"transform,opacity"});return()=>{if(d.open)d.close();};},[motion]);
 // A wrong answer shakes the card, as a locked door rattles.
 function refuse(message:string){setError(message);if(motion&&card.current)gsap.fromTo(card.current,{x:-10},{x:0,duration:.5,ease:"elastic.out(1.2,.3)",clearProps:"transform"});}
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;const form=new FormData(e.currentTarget),username=String(form.get("username")??"").trim(),password=String(form.get("password")??"");
  if(!username||!password){refuse("Enter your name and password.");return;}
  setBusy(true);setError("");
  try{const r=await fetch("/api/members",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});const result=await r.json().catch(()=>({})) as {ok?:boolean;name?:string;error?:string};
   if(r.ok&&result.ok){onUnlock(result.name??username);return;}refuse(result.error??"That name and password don’t match.");}
  catch{refuse("The door can’t reach the server. Try again in a moment.");}
  finally{setBusy(false);}
 }
 return <dialog ref={dialog} className={styles.dialog} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-labelledby="secret-title">
  <form ref={card} className={styles.card} onSubmit={submit} noValidate>
   <div className={styles.top}><span>D/Y — BEHIND THE SHELF</span><button type="button" aria-label="Close" onClick={onClose}>×</button></div>
   <span className={styles.eyebrow}>MEMBERS ONLY</span>
   <h2 id="secret-title">Something clicks.<em>Who goes there?</em></h2>
   <p>The button gives under your thumb. Members, say who you are and the shelf will let you through.</p>
   <label><span>Name</span><input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={64} required autoFocus/></label>
   <label><span>Password</span><input name="password" type="password" autoComplete="current-password" maxLength={256} required/></label>
   <p className={styles.error} role="alert">{error}</p>
   <button className={styles.submit} disabled={busy}><span>{busy?"Checking…":"Open the shelf"}</span><i aria-hidden="true">→</i></button>
  </form>
 </dialog>;
}
