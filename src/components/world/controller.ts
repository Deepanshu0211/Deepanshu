import * as T from "three";
import { Capsule } from "three/addons/math/Capsule.js";
import type { Building } from "./building";

// A 0.48 m wide capsule, 1.7 m tall; eye height 1.65 m. Physics uses bounded 120 Hz substeps.
export class Walker {
 capsule=new Capsule(new T.Vector3(1.3,.3,2.15),new T.Vector3(1.3,1.52,2.15),.24);
 velocity=new T.Vector3();keys=new Set<string>();
 /** Sitting: the walker stays put on the seat (no physics) with the eye at this height; looking around still works. */
 seated:{x:number;z:number;eye:number}|null=null;stick=new T.Vector2();yaw=.07;pitch=-.02;grounded=false;active=false;
 // Idle presentation: cursor drift (-1..1) and an opening dolly that settles to zero.
 drift=new T.Vector2();intro=1;settling=true;private driftNow=new T.Vector2();
 private yawGoal=this.yaw;private pitchGoal=this.pitch;private direction=new T.Vector3();private translation=new T.Vector3();
 constructor(private camera:T.PerspectiveCamera,private building:Building){}
 look(dx:number,dy:number){this.yawGoal-=dx*.0022;this.pitchGoal=T.MathUtils.clamp(this.pitchGoal-dy*.0022,-1.46,1.46);}
 /** Out of a door or swinging shelf, keeping only the velocity along it. */
 private push(part:Building["movers"][number]){const hit=this.building.doorCollision(part,this.capsule);if(hit){this.capsule.translate(this.translation.copy(hit.normal).multiplyScalar(hit.depth+.0001));const into=this.velocity.dot(hit.normal);if(into<0)this.velocity.addScaledVector(hit.normal,-into);}}
 face(yaw:number){this.yaw=this.yawGoal=yaw;}
 clear(){this.keys.clear();this.stick.set(0,0);this.velocity.set(0,0,0);}
 place(x:number,z:number,yaw:number,pitch=-.05){const dy=this.capsule.end.y-this.capsule.start.y;this.capsule.start.set(x,.3,z);this.capsule.end.set(x,.3+dy,z);this.yaw=this.yawGoal=yaw;this.pitch=this.pitchGoal=pitch;this.velocity.set(0,0,0);this.intro=0;}
 update(dt:number,motion:boolean){
   this.yaw=motion?T.MathUtils.damp(this.yaw,this.yawGoal,35,dt):this.yawGoal;this.pitch=motion?T.MathUtils.damp(this.pitch,this.pitchGoal,35,dt):this.pitchGoal;
   const forward=(this.keys.has("KeyW")?1:0)-(this.keys.has("KeyS")?1:0)-this.stick.y;
   const strafe=(this.keys.has("KeyD")?1:0)-(this.keys.has("KeyA")?1:0)+this.stick.x;
   if(this.active){if(this.keys.has("ArrowLeft"))this.yawGoal+=dt*1.4;if(this.keys.has("ArrowRight"))this.yawGoal-=dt*1.4;if(this.keys.has("ArrowUp"))this.pitchGoal=Math.min(1.46,this.pitchGoal+dt);if(this.keys.has("ArrowDown"))this.pitchGoal=Math.max(-1.46,this.pitchGoal-dt);}
   this.direction.set(strafe,0,-forward);if(this.direction.lengthSq()>1)this.direction.normalize();this.direction.applyAxisAngle(T.Object3D.DEFAULT_UP,this.yaw);
   const steps=Math.max(1,Math.ceil(dt/(1/120))),step=dt/steps;
   if(this.seated){const s=this.seated,dy=this.capsule.end.y-this.capsule.start.y;this.velocity.set(0,0,0);this.capsule.end.set(s.x,s.eye-.13,s.z);this.capsule.start.set(s.x,s.eye-.13-dy,s.z);this.grounded=true;}
   else for(let i=0;i<steps;i++){
     const sprint=this.keys.has("ShiftLeft")||this.keys.has("ShiftRight"),speed=this.active?(sprint&&forward>0?3.6:2.35):0;this.velocity.x=T.MathUtils.damp(this.velocity.x,this.direction.x*speed,12,step);this.velocity.z=T.MathUtils.damp(this.velocity.z,this.direction.z*speed,12,step);
     if(this.active&&this.keys.has("Space")&&this.grounded){this.velocity.y=4.2;this.grounded=false;this.keys.delete("Space");}
     this.velocity.y-=14*step;this.capsule.translate(this.translation.copy(this.velocity).multiplyScalar(step));this.grounded=false;
     for(let j=0;j<4;j++){let hit=this.building.tree.capsuleIntersect(this.capsule);for(const extra of this.building.furniture){if(hit)break;hit=extra.capsuleIntersect(this.capsule);}if(!hit)break;this.capsule.translate(this.translation.copy(hit.normal).multiplyScalar(hit.depth+.00001));if(hit.normal.y>.5)this.grounded=true;const into=this.velocity.dot(hit.normal);if(into<0)this.velocity.addScaledVector(hit.normal,-into);}
     for(const door of this.building.doors)this.push(door);for(const mover of this.building.movers)this.push(mover);
   }
   const calm=this.active?0:1;this.driftNow.x=motion?T.MathUtils.damp(this.driftNow.x,this.drift.x*calm,3.2,dt):0;this.driftNow.y=motion?T.MathUtils.damp(this.driftNow.y,this.drift.y*calm,3.2,dt):0;
   this.intro=motion?T.MathUtils.damp(this.intro,0,1.15,dt):0;if(this.intro<.002)this.intro=0;
   this.settling=this.intro>0||Math.abs(this.driftNow.x-this.drift.x*calm)+Math.abs(this.driftNow.y-this.drift.y*calm)>.004;
   const ease=this.intro*this.intro*(3-2*this.intro),sin=Math.sin(this.yaw),cos=Math.cos(this.yaw);
   this.camera.position.copy(this.capsule.end);this.camera.position.y+=.13+ease*.32+this.driftNow.y*.035;
   this.camera.position.x+=cos*this.driftNow.x*.07+sin*ease*.85;this.camera.position.z+=-sin*this.driftNow.x*.07+cos*ease*.85;
   this.camera.rotation.set(this.pitch-ease*.09+this.driftNow.y*.045,this.yaw-this.driftNow.x*.075+ease*.05,0,"YXZ");
 }
}
