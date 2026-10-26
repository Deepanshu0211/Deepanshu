import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { Capsule } from "three/addons/math/Capsule.js";
import { createBedroom } from "./bedroom";
import { type Action,type Area,type Location,type WorldOptions,type Weather,disposeObject,batchScenery,collidersFrom,freezeStatic,shadowProxy } from "./objects";
import { createBuilding,rooms } from "./building";
import { Walker } from "./controller";
import { createPost,FAR_LAYER,type Post } from "./post";
import { GESTURES,type Gesture } from "./gestures";
import { wind } from "./materials";
import { makePerson,walk as stride,sit as sitPose,type Person } from "./people";
import { loadAvatar,makeAvatar,dressAvatar,type Outfit } from "./avatar";
import { loadCat } from "./cat";
import type { PlayerState } from "./net";
import { computeBoundsTree,acceleratedRaycast } from "three-mesh-bvh";
// BVH-accelerated picking: rays test a few dozen triangles instead of every triangle in a room.
T.BufferGeometry.prototype.computeBoundsTree=computeBoundsTree;T.Mesh.prototype.raycast=acceleratedRaycast;
function buildBVH(root:T.Object3D){root.traverse(o=>{if(o instanceof T.Mesh&&!(o instanceof T.InstancedMesh)&&!o.geometry.boundsTree&&!o.userData.shadowProxy){const g=o.geometry as T.BufferGeometry,tris=(g.index?g.index.count:g.attributes.position.count)/3;if(tris>200)g.computeBoundsTree();}});}
// Windows are portals to the outside: the city and sky are drawn only when one is in view.
const windows:Partial<Record<Location,T.Box3>>={
 bedroom:new T.Box3(new T.Vector3(-3.65,1.1,-3.5),new T.Vector3(-.25,3.9,-3)),archive:new T.Box3(new T.Vector3(6.35,.8,-3.5),new T.Vector3(9.65,3.35,-3)),
 workshop:new T.Box3(new T.Vector3(15.2,1.25,-3.5),new T.Vector3(17.6,3.15,-3)),library:new T.Box3(new T.Vector3(6.55,.9,9.5),new T.Vector3(9.45,3.05,10)),
};
/** A doorway as sound sees it: the two rooms it joins, how open it is (0..1), and where the opening is. */
export interface DoorSound { rooms:[Location,Location]; open:number; x:number; y:number; z:number; }
export interface WorldCallbacks {
 action:(action:Action,position:T.Vector3)=>void;
 target:(name:string,action:string)=>void;
 ready:()=>void; fail:()=>void;
 /** Walking or not; `byUser` is true when the visitor paused (Escape or the Pause button). */
 active:(active:boolean,byUser?:boolean)=>void;
 /** Loading progress, 0..1, with what is happening (downloading, building, compiling shaders). */
 progress?:(fraction:number,label:string)=>void;
 /** Twice a second: frames per second, average frame time, and the dynamic resolution scale. */
 stats?:(fps:number,ms:number,scale:number)=>void;
 location:(location:Location)=>void; notice:(text:string)=>void;
 listener:(position:T.Vector3,forward:T.Vector3,moving:boolean,location:Location,doors:DoorSound[])=>void;
 /** While seated at a screen: its rectangle in page pixels, or null once you stand up. */
 /** Movement and hover cues for sound: jumps, landings, and pointing at something you can use. */
 cue?:(kind:"jump"|"land"|"hover",at:T.Vector3)=>void;
 /** You opened or closed a door (shared with friends in the room). */
 door?:(id:string,open:boolean)=>void;
 /** You made a gesture (shared with friends in the room). */
 gesture?:(kind:Gesture)=>void;
 screen?:(seat:{id:"computer"|"laptop"|"tv";x:number;y:number;w:number;h:number}|null)=>void;
}
// Per-weather light: window key colour and strength, sky fill, and the world beyond the glass.
// `fill` is the soft sky ambient, kept low so light visibly comes from the windows; `win` is the daylight through each
// window opening; `room` the ceiling fittings, which are off in daylight like a real home.
const climate:Record<Weather,{sky:string;fillSky:string;key:string;keyI:number;fill:number;win:number;ground:string;room:number;exposure:number;pos:[number,number,number]}>={
 rain:{sky:"#273c43",fillSky:"#cbd6d2",key:"#b9d2d4",keyI:1.35,fill:.2,win:2.6,ground:"#4d453b",room:4,exposure:1,pos:[-1.4,7,-10]},
 day:{sky:"#9fbdb9",fillSky:"#fff4e2",key:"#fff1da",keyI:3.4,fill:.38,win:5.5,ground:"#6d5f4c",room:0,exposure:1.05,pos:[-2.6,8,-9]},
 sunset:{sky:"#9c776b",fillSky:"#ffc49c",key:"#ffad73",keyI:3,fill:.26,win:3.2,ground:"#5a4334",room:2.4,exposure:1.08,pos:[-6.5,4.2,-9]},
 night:{sky:"#17262f",fillSky:"#7a8cb0",key:"#8fa6c9",keyI:.4,fill:.12,win:.35,ground:"#2b2a2a",room:3.2,exposure:1.12,pos:[-1,8,-9]},
};
export function createWorld(container:HTMLElement,callbacks:WorldCallbacks,initial:WorldOptions){
 let destroyed=false,options={...initial},mode:"pointer"|"drag"|"touch"="pointer",dragging=false,elapsed=0,last=0,lastRender=0,areaId:Location="bedroom",slow=0,low=innerWidth<700||matchMedia("(pointer: coarse)").matches,aoOff=false;
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
 // Low-end detection: software rendering goes straight to the light path; integrated GPUs and small CPUs
 // start at a lower internal resolution without ambient occlusion. Dynamic resolution then adapts either way.
 const gpu=(()=>{try{const gl=renderer.getContext(),info=gl.getExtension("WEBGL_debug_renderer_info");return info?String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)):"";}catch{return "";}})();
 if(/swiftshader|llvmpipe|basic render|software/i.test(gpu))low=true;
 const modest=/intel|hd graphics|uhd|iris|mali|adreno|powervr|vivante/i.test(gpu)||(navigator.hardwareConcurrency??8)<=4||((navigator as {deviceMemory?:number}).deviceMemory??8)<=4;
 let renderScale=modest?.75:1;if(modest)aoOff=true;
 // Reading every shader's compile log forces synchronous compiles; production skips it (dev keeps errors visible).
 renderer.debug.checkShaderErrors=process.env.NODE_ENV!=="production";renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=!low;renderer.shadowMap.type=T.PCFShadowMap;renderer.info.autoReset=false;
 const canvas=renderer.domElement;canvas.setAttribute("aria-label","First-person explorable world. Hover and click objects, or enter to walk with WASD, look with the mouse, E to interact, Escape to pause.");canvas.tabIndex=0;container.prepend(canvas);
 const scene=new T.Scene();scene.background=new T.Color(climate[options.weather].sky);scene.fog=new T.FogExp2(climate[options.weather].sky,.013);
 // Image-based lighting: soft reflections on varnish, metal, ceramic and glass.
 const pmrem=new T.PMREMGenerator(renderer);const environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment,.04).texture;scene.environmentIntensity=.2;environment.dispose();pmrem.dispose();
 const building=createBuilding();scene.add(building.root);const camera=new T.PerspectiveCamera(68,1,.045,420);const player=new Walker(camera,building);
 const areas=new Map<Location,Area>();const pending=new Map<Location,Promise<void>>();const bedroom=createBedroom();const bedroomParts=collidersFrom(bedroom.root);batchScenery(bedroom.root);freezeStatic(bedroom.root);freezeStatic(building.root);castProxies(bedroom.root);castProxies(building.root);scene.add(bedroom.root);areas.set("bedroom",bedroom);
 const pickables:T.Object3D[]=[building.root,bedroom.root],hits:T.Intersection[]=[];
 // Daylight through each window: a soft area light filling the opening, facing into the room. No shadows,
 // like real skylight; the sun's own patch and shadows come from the key light through the same opening.
 RectAreaLightUniformsLib.init();
 const windowLights=Object.values(windows).map(box=>{const size=box.getSize(new T.Vector3()),centre=box.getCenter(new T.Vector3()),inward=centre.z<0?1:-1;
  const area=new T.RectAreaLight(climate[options.weather].fillSky,0,size.x*.96,size.y*.96);area.position.set(centre.x,centre.y,centre.z+inward*.3);area.lookAt(centre.x,centre.y-.35,centre.z+inward*4);scene.add(area);return area;});
 const ambient=new T.HemisphereLight("#e7dcc4",climate[options.weather].ground,climate[options.weather].fill);scene.add(ambient);
 // Key light enters through the bedroom window, so mullions throw a real pattern across the floor.
 const light=new T.DirectionalLight(climate[options.weather].key,climate[options.weather].keyI);light.position.set(...climate[options.weather].pos);light.target.position.set(.2,0,.8);scene.add(light.target);
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;camera.layers.enable(FAR_LAYER);light.shadow.camera.layers.enable(FAR_LAYER);
 light.castShadow=true;light.shadow.mapSize.set(low||modest?1024:2048,low||modest?1024:2048);Object.assign(light.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:1,far:30});light.shadow.radius=3;light.shadow.bias=-.0004;light.shadow.normalBias=.03;scene.add(light);
 let post:Post|null=null;
 // The neighbourhood and sky arrive after the first frame, so the room opens as fast as before.
 let outdoors:ReturnType<typeof import("./outdoors").createOutdoors>|null=null,heavens:ReturnType<typeof import("./sky").createSky>|null=null;
 const keyTarget=new T.Vector3(.2,0,.8),roomCenter=new T.Vector3();
 // Dust in the air: a few hundred motes drifting around the camera, catching the light.
 const moteCount=320,motePositions=new Float32Array(moteCount*3),moteGeometry=new T.BufferGeometry();for(let i=0;i<moteCount;i++)motePositions.set([(Math.random()-.5)*6,Math.random()*3.6+.2,(Math.random()-.5)*6],i*3);
 moteGeometry.setAttribute("position",new T.BufferAttribute(motePositions,3));const moteDot=document.createElement("canvas");moteDot.width=moteDot.height=32;{const g=moteDot.getContext("2d")!,r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,"#fff");r.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=r;g.fillRect(0,0,32,32);}
 const moteMaterial=new T.PointsMaterial({color:"#fff1d6",map:new T.CanvasTexture(moteDot),size:.014,transparent:true,opacity:.4,depthWrite:false,blending:T.AdditiveBlending});
 const motes=new T.Points(moteGeometry,moteMaterial);motes.frustumCulled=false;scene.add(motes);
 // Your own body, seen when you look down: it walks and runs with you and tucks its legs in a jump.
 // The head and neck are left out so the camera never sees the inside of them.
 // The visitor's own character model, rigged on load (avatar.ts). Its head is folded away so the camera never sits inside it.
 let avatarFailed=false;const avatarReady=loadAvatar().catch(error=>{avatarFailed=true;console.warn("Character model unavailable",error);}),catReady=loadCat().catch(error=>console.warn("Cat model unavailable",error));
 const self=makeAvatar();self.head.scale.setScalar(.001);
 self.root.visible=false;scene.add(self.root);let gait=0,myGesture:{kind:Gesture;start:number}|null=null,figuresMoved=false;
 // Characters cast real sun shadows (avatar.ts), and a soft contact shadow sits under each one's feet. Your own head is
 // folded away for the camera, so a head that only exists in shadow maps stands in for it: your shadow has a head.
 const blobMaterial=new T.MeshBasicMaterial({map:(()=>{const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d")!,r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,"rgba(0,0,0,.5)");r.addColorStop(.5,"rgba(0,0,0,.26)");r.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=r;g.fillRect(0,0,64,64);return new T.CanvasTexture(c);})(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
 const blobGeometry=new T.PlaneGeometry(.72,.72).rotateX(-Math.PI/2);
 function blob(){const m=new T.Mesh(blobGeometry,blobMaterial);m.renderOrder=1;m.userData.ground=0;scene.add(m);return m;}
 /** Under the feet; while airborne it stays on the last floor and shrinks with height. */
 function placeBlob(m:T.Mesh,x:number,feet:number,z:number,grounded:boolean,shown:boolean){m.visible=shown;if(!shown)return;if(grounded)m.userData.ground=feet;const h=Math.max(0,feet-m.userData.ground),k=1/(1+h*2.2);m.position.set(x,m.userData.ground+.014,z);m.scale.set(k,1,k);}
 const selfBlob=blob();
 const shadowHead=new T.Mesh(new T.SphereGeometry(.11,12,10),new T.MeshBasicMaterial());shadowHead.scale.set(.9,1.12,1);shadowHead.position.y=1.6;shadowHead.castShadow=true;self.body.add(shadowHead);
 shadowHead.layers.test=()=>{const rt=renderer.getRenderTarget();if(!rt)return false;if(rt===light.shadow.map)return true;for(const l of shadowLights)if(l.shadow.map===rt)return true;return false;};
 /** Pose a gesture over the walk or seat pose; false once it is over (a dance also ends when they walk off). */
 function gesturePose(p:Person,g:{kind:Gesture;start:number},now:number,pitch:number,moving:boolean){
  const t=(now-g.start)/1000,{dur}=GESTURES[g.kind];if(t>dur||(g.kind==="dance"&&moving&&t>.6))return false;
  const w=Math.max(0,Math.min(1,t/.25,(dur-t)/.3)),to=(e:T.Euler,axis:"x"|"y"|"z",v:number)=>{e[axis]+=(v-e[axis])*w;};
  const [rs,ls]=p.shoulders,[re,le]=p.elbows;
  if(g.kind==="wave"){to(rs.rotation,"z",-2.5+Math.sin(t*9)*.28);to(rs.rotation,"x",-.2);to(re.rotation,"x",-.5);}
  else if(g.kind==="point"){to(rs.rotation,"x",-Math.PI/2-pitch*.9);to(rs.rotation,"z",.08);to(re.rotation,"x",0);}
  else if(g.kind==="thumbs"){to(rs.rotation,"x",-.75);to(re.rotation,"x",-1.45);to(rs.rotation,"z",.12);}
  else if(g.kind==="clap"){[[rs,re,-1],[ls,le,1]].forEach(([sh,el,side])=>{const sb=sh as T.Object3D,eb=el as T.Object3D,sd=side as number;to(sb.rotation,"x",-1.1);to(sb.rotation,"z",-sd*(.36+.14*Math.sin(t*14)));to(eb.rotation,"x",-.95);});}
  else{[[rs,re,-1,0],[ls,le,1,Math.PI]].forEach(([sh,el,side,phase])=>{const sb=sh as T.Object3D,eb=el as T.Object3D;to(sb.rotation,"z",(side as number)*(1.5+.8*Math.sin(t*6+(phase as number))));to(eb.rotation,"x",-.6);});
   p.body.position.y+=Math.abs(Math.sin(t*6))*.05*w;to(p.body.rotation,"z",Math.sin(t*3)*.12);for(const k of p.knees)to(k.rotation,"x",.25+.25*Math.sin(t*6));for(const h of p.hips)to(h.rotation,"x",-.12);}
  return true;
 }
 /** Lying down (the bed): the body flat on its back along the perch, head at the perch, feet toward where it faces. */
 function liePose(p:Person,at:T.Vector3,fwd:T.Vector3){p.root.position.set(at.x+fwd.x*1.62,at.y+.06,at.z+fwd.z*1.62);p.root.rotation.y=Math.atan2(fwd.x,fwd.z);stride(p,0,0);p.body.position.y=0;p.body.rotation.x=-Math.PI/2;}
 function startGesture(kind:Gesture){myGesture={kind,start:performance.now()};callbacks.gesture?.(kind);lastRender=0;}
 // Friends in the room (net.ts): each one is an articulated person easing toward their latest pose, walking at
 // the speed they really walk, with a name tag that lights up green while they talk.
 type Remote={person:ReturnType<typeof makePerson>;tag:T.Sprite;canvas:HTMLCanvasElement;texture:T.CanvasTexture;name:string;color:string;outfit:string;talking:boolean;goal:PlayerState|null;gait:number;placed:boolean;blob:T.Mesh;gesture:{kind:Gesture;start:number}|null;last:T.Vector3};
 const remotes=new Map<string,Remote>(),skins=["#8d5a3b","#b9825c","#c99a76","#6f4630","#d8ab84"];
 function drawTag(r:Remote){const g=r.canvas.getContext("2d")!;g.clearRect(0,0,512,128);g.fillStyle="rgba(31,26,23,.72)";g.beginPath();g.roundRect(8,24,496,80,40);g.fill();
  g.fillStyle=r.talking?"#8fd19e":r.color;g.beginPath();g.arc(62,64,r.talking?20:15,0,Math.PI*2);g.fill();if(r.talking){g.strokeStyle="#8fd19e88";g.lineWidth=6;g.beginPath();g.arc(62,64,30,0,Math.PI*2);g.stroke();}
  g.fillStyle="#f1eadb";g.font="600 44px system-ui, sans-serif";g.textBaseline="middle";g.fillText(r.name.slice(0,16)+(r.gesture?"  "+GESTURES[r.gesture.kind].emoji:""),104,66);r.texture.needsUpdate=true;}
 function makeRemote(id:string,name:string,color:string,outfit?:Outfit):Remote{
  let hash=0;for(const ch of id)hash=(hash*31+ch.charCodeAt(0))|0;
  const person=avatarFailed?makePerson({skin:skins[Math.abs(hash)%skins.length],top:outfit?.top??color,bottom:outfit?.bottom??"#2d3a6b",hair:outfit?.hair??"#1f1a17",longHair:Math.abs(hash)%3===0}):makeAvatar(outfit);person.root.visible=false;scene.add(person.root);
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=128;const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const tag=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));tag.scale.set(.72,.18,1);tag.position.y=2.02;person.root.add(tag);
  const r:Remote={person,tag,canvas,texture,name,color,outfit:JSON.stringify(outfit??null),talking:false,goal:null,gait:0,placed:false,blob:blob(),gesture:null,last:new T.Vector3()};drawTag(r);return r;}
 function dropRemote(id:string){const r=remotes.get(id);if(!r)return;remotes.delete(id);scene.remove(r.person.root);scene.remove(r.blob);r.person.root.traverse(o=>{if(o instanceof T.Mesh&&!o.userData.shared)o.geometry.dispose();});r.texture.dispose();(r.tag.material as T.SpriteMaterial).dispose();}
 function updateRemotes(dt:number){const k=1-Math.exp(-dt*12);for(const r of remotes.values()){const g=r.goal;if(!g)continue;const root=r.person.root;
  if(!r.placed){r.placed=true;root.position.set(g.x,g.y,g.z);root.rotation.y=g.yaw+Math.PI;}
  root.position.x+=(g.x-root.position.x)*k;root.position.y+=(g.y-root.position.y)*k;root.position.z+=(g.z-root.position.z)*k;
  // Looking around turns the head first; the body follows only when walking or once the head can turn no further.
  const turn=Math.atan2(Math.sin(g.yaw+Math.PI-root.rotation.y),Math.cos(g.yaw+Math.PI-root.rotation.y));
  if(g.speed>.3||Math.abs(turn)>1.05||root.userData.turning){root.userData.turning=Math.abs(turn)>.12;root.rotation.y+=turn*(g.speed>.3?k:k*.45);}
  const perch=g.seat?perchById(g.seat):null;
  r.person.body.rotation.x=0;r.person.body.rotation.z=0;
  if(perch){perch.at.getWorldPosition(seatAt);perch.at.getWorldDirection(seatFwd);if(perch.pose==="lie")liePose(r.person,seatAt,seatFwd);else{root.position.set(seatAt.x,seatAt.y-SEAT_DROP,seatAt.z);root.rotation.y=Math.atan2(seatFwd.x,seatFwd.z);stride(r.person,0,0);sitPose(r.person);}}
  else{r.gait+=dt*g.speed*3.4;stride(r.person,r.gait,options.motion?Math.min(1.6,g.speed/2.35):0);if(!g.grounded&&options.motion){for(const kn of r.person.knees)kn.rotation.x=.75;for(const h of r.person.hips)h.rotation.x=-.5;}}
  // The head turns left and right and tilts up and down to wherever they are looking (as far as a neck goes).
  { const look=Math.atan2(Math.sin(g.yaw+Math.PI-root.rotation.y),Math.cos(g.yaw+Math.PI-root.rotation.y)),head=r.person.head.rotation,hk=1-Math.exp(-dt*14);
    head.y+=(T.MathUtils.clamp(look,-1.2,1.2)-head.y)*hk;head.x+=(T.MathUtils.clamp(-g.pitch*.8,-.75,.6)-head.x)*hk; }
  if(r.gesture&&!gesturePose(r.person,r.gesture,performance.now(),g.pitch,g.speed>.3)){r.gesture=null;drawTag(r);}
  // Standing where you stand (everyone arrives at the same spot): hidden until they step out of your eyes.
  r.person.root.visible=Math.hypot(root.position.x-camera.position.x,root.position.z-camera.position.z)>.55;
  placeBlob(r.blob,root.position.x,root.position.y,root.position.z,g.grounded||Boolean(perch),r.person.root.visible&&perch?.pose!=="lie");
  // Their shadow moves with them, so the cached shadow map is refreshed while anyone is moving or gesturing.
  if(r.last.distanceToSquared(root.position)>1e-6||r.gesture){figuresMoved=true;r.last.copy(root.position);}}}
 // Seats people share (the sofa, the conference chairs): a click takes the nearest free one, and a friend's seat is
 // taken. While seated the walker stays on the seat and you can still look around; a movement key stands you up.
 const SEAT_DROP=.45,seatAt=new T.Vector3(),seatFwd=new T.Vector3();let perched:{id:string;at:T.Object3D;pose?:"lie"}|null=null;
 function perchById(id:string){for(const a of areas.values())for(const p of a.perches??[])if(p.id===id)return p;return null;}
 function seatTaken(id:string){for(const r of remotes.values())if(r.goal?.seat===id)return true;return false;}
 function sitDown(group:string,point:T.Vector3){
  let best:{id:string;at:T.Object3D;pose?:"lie"}|null=null,bd=Infinity;
  for(const a of areas.values())for(const p of a.perches??[]){if(p.group!==group||p.id===perched?.id||seatTaken(p.id))continue;p.at.getWorldPosition(seatAt);const d=seatAt.distanceToSquared(point);if(d<bd){bd=d;best=p;}}
  if(!best){callbacks.notice("Every seat here is taken.");return;}
  perched=best;best.at.getWorldPosition(seatAt);best.at.getWorldDirection(seatFwd);
  const lying=best.pose==="lie";player.clear();player.seated={x:seatAt.x,z:seatAt.z,eye:seatAt.y+(lying?.3:.68)};player.face(Math.atan2(-seatFwd.x,-seatFwd.z));if(lying)player.aim(1.05);
  callbacks.notice(lying?"Lying down. Press W, A, S, D or Space to get up.":"Press W, A, S, D or Space to stand up.");lastRender=0;
 }
 // Standing up lands where you fit: behind the seat (pushing a chair back), else in front, else to a side. A chair faces
 // a table, and standing inside the table pushed you down through the floor.
 function standUp(){if(!perched)return;perched.at.getWorldPosition(seatAt);perched.at.getWorldDirection(seatFwd);perched=null;player.seated=null;
  const f=seatFwd,[x,z]=clearSpot(seatAt.x,seatAt.z,[[-f.x*.65,-f.z*.65],[f.x*.65,f.z*.65],[f.z*.65,-f.x*.65],[-f.z*.65,f.x*.65]]);player.place(x,z,player.yaw,player.pitch);lastRender=0;}
 // Whether the walker's capsule can stand at a spot without touching walls, furniture, doors or the moving shelf.
 const probe=new Capsule(new T.Vector3(),new T.Vector3(),.24);
 function fits(x:number,z:number){probe.start.set(x,.3,z);probe.end.set(x,1.52,z);if(building.tree.capsuleIntersect(probe))return false;for(const f of building.furniture)if(f.capsuleIntersect(probe))return false;for(const d of building.doors)if(building.doorCollision(d,probe))return false;for(const m of building.movers)if(building.doorCollision(m,probe))return false;return true;}
 /** The first preferred offset that fits, else the nearest clear spot in widening rings. */
 function clearSpot(x:number,z:number,prefer:[number,number][]):[number,number]{
  for(const [dx,dz] of prefer)if(fits(x+dx,z+dz))return [x+dx,z+dz];
  for(let r=.3;r<=3;r+=.3)for(let a=0;a<16;a++){const px=x+Math.cos(a*Math.PI/8)*r,pz=z+Math.sin(a*Math.PI/8)*r;if(fits(px,pz))return [px,pz];}
  return [x,z];
 }
 // Doorways for the sound engine: where each opening is, refreshed with how open the door is.
 const doorSounds:DoorSound[]=building.doors.map(d=>{const c=d.portal.getCenter(new T.Vector3());return {rooms:d.rooms,open:0,x:c.x,y:c.y,z:c.z};});
 // Seated mode: the camera eases from the walker into a chair and squares up to a screen.
 type Seat=NonNullable<Area["seats"]>[number];let seat:Seat|null=null,leaving:Seat|null=null,seatBlend=0,lastRect="";
 const seatPos=new T.Vector3(),seatLook=new T.Vector3(),walkPos=new T.Vector3(),walkQuat=new T.Quaternion(),seatQuat=new T.Quaternion(),lookMatrix=new T.Matrix4(),corner=new T.Vector3();
 // Right mouse held: a smooth zoom, with look speed scaled down to match.
 let zoomHeld=false,baseFov=68;
 function context(e:Event){e.preventDefault();}
 let bakeSoon=0,bakedWeather="";
 function bakeReflections(){const shown=[outdoors?.root,heavens?.root].filter(Boolean) as T.Object3D[],was=shown.map(o=>o.visible),body=self.root.visible;shown.forEach(o=>{o.visible=true;});self.root.visible=false;scene.updateMatrixWorld();for(const area of areas.values())area.bake?.(renderer,scene);shown.forEach((o,i)=>{o.visible=was[i];});self.root.visible=body;}
 function raster(){const effects=ensurePost();if(effects)effects.render(elapsed,options.motion);else renderer.render(scene,camera);}
 function sit(id:string){for(const area of areas.values()){const found=area.seats?.find(s=>s.id===id);if(found){seat=found;leaving=null;pause();hasPointer=false;player.drift.set(0,0);canvas.style.cursor="";post?.highlight(null);highlighted=null;lastRender=0;return;}}}
 function stand(){if(!seat)return;leaving=seat;seat=null;lastRect="";callbacks.screen?.(null);lastRender=0;}
 function screenRect(s:Seat){const box=s.screen.geometry.boundingBox??(s.screen.geometry.computeBoundingBox(),s.screen.geometry.boundingBox!);const rect=canvas.getBoundingClientRect();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const [x,y] of [[box.min.x,box.min.y],[box.max.x,box.min.y],[box.min.x,box.max.y],[box.max.x,box.max.y]]){corner.set(x,y,0).applyMatrix4(s.screen.matrixWorld).project(camera);const px=rect.left+(corner.x+1)/2*rect.width,py=rect.top+(1-corner.y)/2*rect.height;x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px);y1=Math.max(y1,py);}
  return {id:s.id,x:x0,y:y0,w:x1-x0,h:y1-y0};}
 function postWanted(){return !low&&options.quality!=="low";}
 function ensurePost(){if(postWanted()&&!post){try{post=createPost(renderer,scene,camera);sizePost();post.ao.enabled=options.ao!==false&&!aoOff;post.bloom.enabled=options.bloom!==false;post.grain(options.grain!==false);}catch(error){console.warn(error);low=true;}}return postWanted()?post:null;}
 const bodies:T.Vector3[]=[],you=new T.Vector3(),lastLightPos=new T.Vector3(),frameOptions:WorldOptions={...initial};let shadowFrame=0,lastStats=0;
 const sky=new T.Color(),keyColor=new T.Color(),groundColor=new T.Color(),fillColor=new T.Color(),keyPosition=new T.Vector3();
 const ray=new T.Raycaster();const center=new T.Vector2(),pointer=new T.Vector2();let hasPointer=false,pointerMoved=0,selected:T.Object3D|null=null,lastLabel="",highlighted:T.Object3D|null=null;const selectedPoint=new T.Vector3(),forward=new T.Vector3();
 const downloads=new Map<Location,Promise<()=>Area>>();
 function download(id:Location){let d=downloads.get(id);if(!d){d=id==="archive"?import("./living").then(m=>m.createLiving):id==="rooftop"?import("./balcony").then(m=>m.createBalcony):id==="library"?import("./study").then(m=>m.createStudy):id==="vault"?import("./vault").then(m=>m.createVault):import("./kitchen").then(m=>m.createKitchen);downloads.set(id,d);}return d;}
 const breathe=()=>new Promise<void>(r=>setTimeout(r,0)); // let the loading screen paint between heavy steps
 /** Build a room: geometry, batching, collision and picking trees, then add it. During loading, shaders compile once everything is in. */
 async function load(id:Location,report?:(label:string)=>void){
   if(areas.has(id))return;if(pending.has(id))return pending.get(id);
   const name=rooms[id].label.replace(/^The /,"the ");
   const task=(async()=>{try{
     const make=await download(id);report?.(`Downloaded ${name}`);await breathe();
     const area=make();
     if(destroyed){area.dispose?.();disposeObject(area.root);return;}
     const [x,z]=rooms[id].center;area.root.position.set(x,0,z);const parts=collidersFrom(area.root);batchScenery(area.root);freezeStatic(area.root);castProxies(area.root);report?.(`Built ${name}`);await breathe();
     building.addFurniture(parts);for(const m of area.movers??[])building.addMover(m.hinge,m.size,m.center);if(id==="rooftop")building.addFurniture(balconyGuard());buildBVH(area.root);pinLights(area.root);
     if(!report){await prewarm(area.root);if(destroyed)return;}
     scene.add(area.root);areas.set(id,area);pickables.push(area.root);indexShadows(area.root);bakeSoon=performance.now()+600;renderer.shadowMap.needsUpdate=true;report?.(`Collisions ready in ${name}`);
   }catch{callbacks.notice("That room could not load. Please try its door again.");}finally{pending.delete(id);}})();pending.set(id,task);return task;
 }
 // The balcony's open edges get a tall invisible wall above the railing, so nobody climbs or jumps over.
 function balconyGuard(){const g=new T.Group(),[cx,cz]=rooms.rooftop.center;for(const [w,d,x,z] of [[.3,7,cx+3.95,cz],[8.2,.3,cx,cz+3.2]]){const wall=new T.Mesh(new T.BoxGeometry(w,4,d));wall.position.set(x,2,z);g.add(wall);}return g;}
 // Shadow proxies (objects.ts) must reach shadow maps and nothing else. three.js tests layers against the
 // viewing camera even inside the shadow pass, so each proxy answers "visible" only while a shadow map is
 // the render target: never in the main view, ambient occlusion, reflections or picking.
 function castProxies(root:T.Object3D){shadowProxy(root);root.traverse(o=>{if(o.userData.shadowProxy)o.layers.test=()=>{const rt=renderer.getRenderTarget();if(!rt)return false;if(rt===light.shadow.map)return true;for(const l of shadowLights)if(l.shadow.map===rt)return true;return false;};});}
 // Static lights move to an always-visible rig, so hiding a room never changes the light count, which in
 // three.js would recompile every lit shader (a hitch each time you walked through a door).
 const lightRig=new T.Group();scene.add(lightRig);
 // Lights that live on something interactive (a lamp you can switch) leave an anchor behind and follow it each frame.
 const followers:{light:T.Light;anchor:T.Object3D}[]=[],anchorScale=new T.Vector3();
 function pinLights(root:T.Object3D){const found:T.Light[]=[];root.traverse(o=>{if(o instanceof T.Light&&o.parent!==lightRig)found.push(o);});
  for(const l of found){const frozen=!l.matrixWorldAutoUpdate,parent=l.parent!;delete (l as {updateMatrixWorld?:unknown}).updateMatrixWorld;l.matrixAutoUpdate=true;l.matrixWorldAutoUpdate=true;
   if(!frozen){const anchor=new T.Object3D();anchor.position.copy(l.position);anchor.quaternion.copy(l.quaternion);parent.add(anchor);followers.push({light:l,anchor});}
   lightRig.attach(l);}}
 function follow(){for(const f of followers){f.anchor.matrixWorld.decompose(f.light.position,f.light.quaternion,anchorScale);f.light.updateMatrixWorld();}}
 // Compile shaders and upload textures before something first appears, so it never hitches on screen.
 async function prewarm(root:T.Object3D){const textures=new Set<T.Texture>();root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points)for(const m of Array.isArray(o.material)?o.material:[o.material])for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);});textures.forEach(t=>renderer.initTexture(t));
  // Shaders depend on the render target (post-processing renders to a linear buffer, the screen gets tone mapping), so compile for the real one.
  const previous=renderer.getRenderTarget();renderer.setRenderTarget(post?post.composer.readBuffer:null);try{await renderer.compileAsync(root,camera,scene);}catch{/* compiled on first draw instead */}finally{renderer.setRenderTarget(previous);}}
 // Portal culling: the room you are in, rooms seen through open doors in view, and the outside through windows.
 const frustum=new T.Frustum(),viewProjection=new T.Matrix4(),visibleRooms=new Set<Location>();let outsideVisible=true,visibilityKey="";
 function cull(){
  viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(viewProjection);visibleRooms.clear();outsideVisible=false;
  portals.length=0;portalAll=areaId==="rooftop";
  const visit=(room:Location,depth:number)=>{if(visibleRooms.has(room))return;visibleRooms.add(room);const win=windows[room];if(room==="rooftop")outsideVisible=true;else if(win&&frustum.intersectsBox(win)){outsideVisible=true;portals.push(win);}
   if(depth>=3)return;for(const door of building.doors){const [a,b]=door.rooms;if(a!==room&&b!==room)continue;if(Math.abs(door.angle)<.02&&Math.abs(door.target)<.02)continue;if(!frustum.intersectsBox(door.portal))continue;const next=a===room?b:a;if(next==="rooftop")portals.push(door.portal);visit(next,depth+1);}};
  visit(areaId,0);
 }
 // From indoors the street is seen only through window and balcony-door openings. Each opening is projected
 // to a screen rectangle, and outdoor objects outside it are skipped for this frame: they are behind a wall.
 // Shadow casters are never skipped, so cached shadows stay whole.
 type OutsidePart={o:T.Object3D;center:T.Vector3;radius:number;moving:boolean};
 const portals:T.Box3[]=[],outsideParts:OutsidePart[]=[],skipped:T.Object3D[]=[],portalRect=new T.Box2(),flat=new T.Vector2(),edge=new T.Vector3(),portalMatrix=new T.Matrix4(),portalFrustum=new T.Frustum(),bound=new T.Sphere();let portalAll=true;
 function indexOutside(root:T.Object3D){
  const box=new T.Box3(),ball=new T.Sphere(),casts=(o:T.Object3D)=>{let c=false;o.traverse(m=>{if((m as T.Mesh).castShadow)c=true;});return c;};
  const add=(o:T.Object3D,moving:boolean)=>{if(casts(o)||(o as T.Mesh).frustumCulled===false)return;box.setFromObject(o);if(box.isEmpty())return;box.getBoundingSphere(ball);const at=o.getWorldPosition(new T.Vector3());
   outsideParts.push(moving?{o,center:at,radius:ball.center.distanceTo(at)+ball.radius+.6,moving}:{o,center:ball.center.clone(),radius:ball.radius,moving});};
  for(const child of root.children){if(child.userData.dynamic)for(const c of child.children)add(c,true);else add(child,false);}
 }
 function portalFrame(){
  if(portalAll||!portals.length)return false;portalRect.makeEmpty();
  for(const box of portals)for(let i=0;i<8;i++){edge.set(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).applyMatrix4(camera.matrixWorldInverse);if(edge.z>-camera.near)return false;edge.applyMatrix4(camera.projectionMatrix);portalRect.expandByPoint(flat.set(edge.x,edge.y));}
  const x0=Math.max(-1,portalRect.min.x),x1=Math.min(1,portalRect.max.x),y0=Math.max(-1,portalRect.min.y),y1=Math.min(1,portalRect.max.y);if(x1<=x0||y1<=y0)return false;
  portalMatrix.set(2/(x1-x0),0,0,-(x1+x0)/(x1-x0),0,2/(y1-y0),0,-(y1+y0)/(y1-y0),0,0,1,0,0,0,0,1).multiply(viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));portalFrustum.setFromProjectionMatrix(portalMatrix);return true;
 }
 function skipBehindWalls(){
  skipped.length=0;if(!outdoors?.root.visible||!portalFrame())return;
  for(const p of outsideParts){if(!p.o.visible)continue;if(p.moving)bound.center.copy(p.o.position).applyMatrix4(p.o.parent!.matrixWorld);else bound.center.copy(p.center);bound.radius=p.radius;if(!portalFrustum.intersectsSphere(bound)){p.o.visible=false;skipped.push(p.o);}}
 }
 function restoreSkipped(){for(const o of skipped)o.visible=true;skipped.length=0;}
 // Shadow casters that can move (anything not frozen as scenery), with their last pose, and the lamps with shadow maps.
 type Mover={o:T.Mesh;pose:T.Matrix4;version:number;shown:boolean};
 const movers:Mover[]=[],shadowLights:(T.SpotLight|T.PointLight|T.DirectionalLight)[]=[];let castersDirty=true;
 const versionOf=(m:T.Mesh)=>((m.geometry.attributes.position as T.BufferAttribute|undefined)?.version??0)+((m as T.InstancedMesh).instanceMatrix?.version??0);
 function indexShadows(root:T.Object3D){root.traverse(o=>{if(o instanceof T.Mesh&&o.castShadow&&o.matrixWorldAutoUpdate)movers.push({o,pose:o.matrixWorld.clone(),version:versionOf(o),shown:o.visible});
  else if((o instanceof T.SpotLight||o instanceof T.PointLight||o instanceof T.DirectionalLight)&&o!==light&&o.castShadow&&!shadowLights.includes(o)){o.shadow.autoUpdate=false;shadowLights.push(o);}});castersDirty=true;}
 // A mover only matters when it is (or just was) inside some light's shadow volume: the playground swing far down
 // the street changes nothing in a shadow map centred on the room you are in.
 const lightVolumes:T.Frustum[]=[],moverBound=new T.Sphere();
 function inShadowVolume(m:T.Mesh,pose:T.Matrix4){const g=m.geometry;if(!g.boundingSphere)g.computeBoundingSphere();moverBound.copy(g.boundingSphere!).applyMatrix4(pose);for(const f of lightVolumes)if(f.intersectsSphere(moverBound))return true;return false;}
 function castersMoved(){
  lightVolumes.length=0;for(const l of [light,...shadowLights]){if(l!==light&&!visibleRooms.has(locationAt(l.matrixWorld.elements[12],l.matrixWorld.elements[14])))continue;l.shadow.updateMatrices(l);lightVolumes.push(l.shadow.getFrustum());}
  let moved=false;for(const m of movers){const v=versionOf(m.o);if(m.o.visible!==m.shown||v!==m.version||!m.o.matrixWorld.equals(m.pose)){if(!moved&&(inShadowVolume(m.o,m.o.matrixWorld)||inShadowVolume(m.o,m.pose)))moved=true;m.shown=m.o.visible;m.version=v;m.pose.copy(m.o.matrixWorld);}}return moved;
 }
 function locationAt(x:number,z:number):Location{if(x<4)return z>3.25?"vault":"bedroom";if(z>3.25)return x<12?"library":"rooftop";return x<12?"archive":"workshop";}
 // The secret passage: a member's sign-in (or the button inside the hidden room) parts the study shelf and unlocks
 // the door; ten seconds later it closes and locks again, waiting while anyone stands where the shelf or door moves.
 let secretCloseAt=0;const secretDoor=building.doors.find(d=>d.id==="library-vault")!,secretAt=secretDoor.portal.getCenter(new T.Vector3());
 function openSecret(openDoor:boolean){secretDoor.locked=false;for(const area of areas.values())area.reveal?.();if(openDoor&&Math.abs(secretDoor.target)<.3)building.toggle(secretDoor.id);secretCloseAt=performance.now()+10000;lastRender=0;return secretAt.clone();}
 function closeSecret(now:number){
  const {x,z}=player.capsule.start;if(x>2.4&&x<5.4&&z>4.9&&z<8.1){secretCloseAt=now+1000;return;}
  secretCloseAt=0;if(Math.abs(secretDoor.target)>.3)building.toggle(secretDoor.id);secretDoor.locked=true;for(const area of areas.values())area.conceal?.();
  callbacks.action("shelf",secretAt.clone());callbacks.notice(locationAt(x,z)==="vault"?"The shelf slides shut. The brass button by the door opens it again.":"The bookshelf slides back into place.");
 }
 async function activate(object:T.Object3D|null,point:T.Vector3){
  if(!object)return;const action=object.userData.action as Action;
  if(action.startsWith("sit:")){sitDown(action.slice(4),point);for(const area of areas.values())if(isDescendant(object,area.root))area.interact?.(action);callbacks.action(action,point.clone());return;}
  if(action==="exit"){callbacks.action(action,point.clone());callbacks.action("shelf",openSecret(true));return;}
  if(action==="computer"||action==="laptop"||action==="tv"){sit(action);callbacks.action(action,point.clone());return;}
  if(action.startsWith("door:")){
    const door=building.doors.find(d=>d.id===action.slice(5));if(!door||door.locked)return;
    const opposite=door.id==="bedroom-archive"?"bedroom":door.id==="archive-workshop"?"archive":door.id==="archive-library"?"archive":"library";
    await load(door.destination);if(opposite!=="bedroom")await load(opposite);
    if(!areas.has(door.destination))return;building.toggle(door.id);callbacks.door?.(door.id,Math.abs(door.target)>.3);callbacks.action(action,point.clone());return;
  }
  for(const area of areas.values()){if(isDescendant(object,area.root)){area.interact?.(action);break;}}
  if(["projects","skills","about","experience","contact","lab","telescope","profile","secret"].includes(action)||action.startsWith("project:")||action.startsWith("skill:"))pause();
  callbacks.action(action,point.clone());
 }
 function interact(){if(player.active)return activate(selected,selectedPoint);}
 function isDescendant(obj:T.Object3D,parent:T.Object3D){let p:T.Object3D|null=obj;while(p){if(p===parent)return true;p=p.parent;}return false;}
 function pause(byUser=false){const was=player.active;player.active=false;player.clear();dragging=false;if(document.pointerLockElement===canvas)document.exitPointerLock();if(was||byUser)callbacks.active(false,byUser);}
 async function enter(next:"pointer"|"drag"|"touch"="pointer"){
  if(seat)stand();
  mode=next;if(next==="pointer"){
   // Right after the window regains focus (alt+tab) the browser may refuse the capture or never answer, so wait
   // briefly at most and fall back to drag-to-look: walking always resumes. A late lock still takes over (lockChange).
   const locked=await Promise.race([Promise.resolve(canvas.requestPointerLock()).then(()=>true,()=>false),new Promise<boolean>(r=>setTimeout(()=>r(false),800))]);
   if(!locked&&document.pointerLockElement!==canvas){mode="drag";callbacks.notice("Mouse capture is unavailable here. Drag to look, or use the arrow keys.");}
  }
  if(destroyed)return;hasPointer=false;player.active=true;canvas.style.cursor="";canvas.focus({preventScroll:true});callbacks.active(true);
 }
 // Losing pointer lock while walking, with the page still focused, means the browser handled Escape.
 function lockChange(){if(document.pointerLockElement===canvas){player.active=true;callbacks.active(true);}else if(mode==="pointer"&&player.active){player.active=false;player.clear();callbacks.active(false,document.hasFocus());}}
 function keyDown(e:KeyboardEvent){if(!player.active||e.target instanceof HTMLInputElement)return;if(e.code==="Escape"){pause(true);return;}
  const gesture=(Object.keys(GESTURES) as Gesture[]).find(k=>e.code==="Digit"+GESTURES[k].key);if(gesture){if(!e.repeat)startGesture(gesture);return;}
  if(perched&&["KeyW","KeyA","KeyS","KeyD","Space"].includes(e.code)){e.preventDefault();standUp();return;}if(["KeyW","KeyA","KeyS","KeyD","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space","KeyE","ShiftLeft","ShiftRight"].includes(e.code)){e.preventDefault();if(e.code==="KeyE"){if(!e.repeat)void interact();}else player.keys.add(e.code);}}
 function keyUp(e:KeyboardEvent){player.keys.delete(e.code);}
 let pointerId:number|null=null,previousX=0,previousY=0,pressX=0,pressY=0;
 function down(e:PointerEvent){if(e.button===2){zoomHeld=true;lastRender=0;return;}pressX=e.clientX;pressY=e.clientY;if(!player.active||mode==="pointer")return;pointerId=e.pointerId;previousX=e.clientX;previousY=e.clientY;dragging=true;canvas.setPointerCapture(e.pointerId);}
 function move(e:PointerEvent){
  if(!player.active){ // Before entering, the room answers the cursor: a gentle look-around and hover picking.
   const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
   if(seat)return;hasPointer=e.pointerType!=="touch";pointerMoved=performance.now();player.drift.set(pointer.x,pointer.y);return;
  }
  const speed=(options.sensitivity??1)*camera.fov/baseFov;
  if(document.pointerLockElement===canvas){player.look(e.movementX*speed,e.movementY*speed);}else if(dragging&&e.pointerId===pointerId){player.look((e.clientX-previousX)*1.4*speed,(e.clientY-previousY)*1.4*speed);previousX=e.clientX;previousY=e.clientY;}
 }
 function up(e:PointerEvent){if(e.button===2){zoomHeld=false;return;}if(e.pointerId===pointerId){dragging=false;pointerId=null;}}
 function mouseUp(e:MouseEvent){if(e.button===2)zoomHeld=false;}
 function leave(){hasPointer=false;player.drift.set(0,0);}
 // Click or tap before entering: pick exactly under the pointer, so touch works without hover.
 function click(e:MouseEvent){
  if(player.active||seat||Math.hypot(e.clientX-pressX,e.clientY-pressY)>6)return;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
  ray.far=7.5;ray.setFromCamera(pointer,camera);hits.length=0;ray.firstHitOnly=true;for(const p of pickables)if(p.visible)ray.intersectObject(p,true,hits);hits.sort((a,b)=>a.distance-b.distance);const hit=hits[0];let object:T.Object3D|null=hit?.object??null;while(object&&!object.userData.action)object=object.parent;
  if(object&&hit)void activate(object,hit.point);
 }
 function sizePost(){const {width,height}=container.getBoundingClientRect();if(post&&width&&height)post.setSize(width,height,renderer.getPixelRatio());}
 function ratio(){return Math.min(devicePixelRatio,low||options.quality==="low"?1:post?1.25:1.5)*renderScale;}
 const resize=new ResizeObserver(()=>{const {width,height}=container.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;baseFov=(options.fov??68)+(width/height<.8?10:0);camera.fov=baseFov;camera.updateProjectionMatrix();renderer.setPixelRatio(ratio());renderer.setSize(width,height);sizePost();lastRender=0;});resize.observe(container);
 function lost(e:Event){e.preventDefault();pause();renderer.setAnimationLoop(null);callbacks.fail();}
 function blurred(){pause();}
 function visibility(){player.clear();last=0;renderer.setAnimationLoop(document.hidden?null:frame);if(document.hidden)pause();}
 document.addEventListener("pointerlockchange",lockChange);document.addEventListener("keydown",keyDown);document.addEventListener("keyup",keyUp);document.addEventListener("visibilitychange",visibility);window.addEventListener("blur",blurred);
 canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);canvas.addEventListener("pointerleave",leave);canvas.addEventListener("click",click);canvas.addEventListener("webglcontextlost",lost);canvas.addEventListener("contextmenu",context);document.addEventListener("mouseup",mouseUp);
 // Development benchmark: per-frame CPU time, full frame time (GPU synced), draws and triangles.
 let benchOn=false;const bench={frames:0,cpu:0,full:0,calls:0,tris:0};
 let lastFrameAt=0,frameEMA=16.7,struggle=0,comfort=0,comfortNeed=240,steppedUp=false,statFrames=0,statCpu=0,statsAt=0;
 function frame(now:number){
  if(destroyed)return;if(benchOn)pointerMoved=now;
  const fovGoal=zoomHeld?baseFov*.4:baseFov;
  const lively=Math.abs(camera.fov-fovGoal)>.05||player.active||now-pointerMoved<1600||player.settling||(seat?seatBlend<.999:seatBlend>0);
  // Moving: render every display refresh (a fixed 60 fps cap drops frames whenever vsync timing jitters).
  // Idle: 30 fps, or 4 fps with motion off, with slack so jitter never skips a frame.
  const interval=lively?0:options.motion?1000/30:250;if(now-lastRender<interval-2)return;if(!lively)lastFrameAt=0;
  const dt=Math.min((now-(last||now))/1000,.05);last=lastRender=now;const start=performance.now();if(options.motion)elapsed+=dt;renderer.info.reset();
  const wasGrounded=player.grounded,fallSpeed=player.velocity.y;
  if(secretCloseAt&&now>secretCloseAt)closeSecret(now);
  building.update(dt,player.capsule,options.motion);player.update(dt,options.motion);
  // Safety net: anyone who ever ends up below the floor is set back on their feet in the room they were in.
  if(player.capsule.start.y<-3){const [cx,cz]=rooms[areaId].center,[x,z]=clearSpot(cx,cz,[[0,0]]);player.place(x,z,player.yaw,player.pitch);}
  updateRemotes(dt);
  const speed=Math.hypot(player.velocity.x,player.velocity.z);self.root.visible=(player.active||Boolean(perched))&&!seat&&seatBlend===0;
  self.body.rotation.x=0;self.body.rotation.z=0;
  // A seat that moves (the swing) carries you with it.
  if(perched){perched.at.getWorldPosition(seatAt);perched.at.getWorldDirection(seatFwd);player.seated={x:seatAt.x,z:seatAt.z,eye:seatAt.y+(perched.pose==="lie"?.3:.68)};}
  if(self.root.visible&&perched){if(perched.pose==="lie")liePose(self,seatAt,seatFwd);else{self.root.position.set(seatAt.x,seatAt.y-SEAT_DROP,seatAt.z);self.root.rotation.y=Math.atan2(seatFwd.x,seatFwd.z);stride(self,0,0);sitPose(self);}}
  else if(self.root.visible){gait+=dt*speed*3.4;stride(self,gait,options.motion?Math.min(1.6,speed/2.35):0);if(!player.grounded&&options.motion){for(const k of self.knees)k.rotation.x=.75;for(const h of self.hips)h.rotation.x=-.5;}
   self.root.position.set(player.capsule.start.x+Math.sin(player.yaw)*.16,player.capsule.start.y-.24,player.capsule.start.z+Math.cos(player.yaw)*.16);self.root.rotation.y=player.yaw+Math.PI;}
  if(myGesture&&!(self.root.visible&&gesturePose(self,myGesture,performance.now(),player.pitch,speed>.3)))myGesture=null;
  placeBlob(selfBlob,player.capsule.start.x,player.capsule.start.y-.24,player.capsule.start.z,player.grounded,self.root.visible&&perched?.pose!=="lie");
  if(self.root.visible&&(speed>.05||!player.grounded||myGesture||perched))figuresMoved=true;
  if(player.active){if(wasGrounded&&player.velocity.y>2.5)callbacks.cue?.("jump",camera.position);else if(!wasGrounded&&player.grounded&&fallSpeed<-1.5)callbacks.cue?.("land",player.capsule.start);}
  if(Math.abs(camera.fov-fovGoal)>.01){camera.fov+=(fovGoal-camera.fov)*(options.motion?1-Math.exp(-dt*10):1);camera.updateProjectionMatrix();}
  const id=locationAt(camera.position.x,camera.position.z);if(id!==areaId){areaId=id;callbacks.location(id);}
  // Blend between the walker's view and the seat, then report where the screen sits on the page.
  const goal=seat?1:0;seatBlend+=(goal-seatBlend)*(options.motion?1-Math.exp(-dt*3.4):1);if(Math.abs(goal-seatBlend)<.002){seatBlend=goal;if(!seat)leaving=null;}
  const using=seat??leaving;
  if(using&&seatBlend>0){scene.updateMatrixWorld();using.eye.getWorldPosition(seatPos);using.screen.getWorldPosition(seatLook);lookMatrix.lookAt(seatPos,seatLook,camera.up);seatQuat.setFromRotationMatrix(lookMatrix);walkPos.copy(camera.position);walkQuat.copy(camera.quaternion);const e=seatBlend*seatBlend*(3-2*seatBlend);camera.position.lerpVectors(walkPos,seatPos,e);camera.quaternion.slerpQuaternions(walkQuat,seatQuat,e);}
  camera.updateMatrixWorld();
  // Visibility first; then only rooms you can see animate and draw (plus any mid-move, like the shelf closing behind you).
  cull();frameOptions.motion=options.motion;frameOptions.weather=options.weather;frameOptions.lamp=options.lamp;frameOptions.fan=options.fan;frameOptions.bodies=bodies;bodies.length=0;bodies.push(you.set(player.capsule.start.x,player.capsule.start.y-.24,player.capsule.start.z));for(const r of remotes.values())if(r.placed)bodies.push(r.person.root.position);frameOptions.music=options.music;frameOptions.quality=low?"low":options.quality;
  for(const [room,area] of areas){const shown=visibleRooms.has(room);area.root.visible=shown;if(shown||area.busy?.())area.update?.(elapsed,dt,frameOptions);}
  if(outdoors)outdoors.root.visible=outsideVisible;if(heavens)heavens.root.visible=outsideVisible;
  scene.updateMatrixWorld();follow();
  if(seat&&seatBlend>.985){const r=screenRect(seat),key=[r.x,r.y,r.w,r.h].map(Math.round).join();if(key!==lastRect){lastRect=key;callbacks.screen?.(r);}}
  const picking=(player.active||hasPointer)&&!using;ray.far=player.active?2.65:7.5;ray.setFromCamera(player.active?center:pointer,camera);
  hits.length=0;if(picking){ray.firstHitOnly=true;for(const p of pickables)if(p.visible)ray.intersectObject(p,true,hits);hits.sort((a,b)=>a.distance-b.distance);}selected=null;
  if(hits.length){let object:T.Object3D|null=hits[0].object;while(object&&!object.userData.action)object=object.parent;selected=object;selectedPoint.copy(hits[0].point);}
  const label=selected?.userData.label??"";if(label!==lastLabel){lastLabel=label;if(label)callbacks.cue?.("hover",selectedPoint);callbacks.target(label,selected?.userData.action??"");if(!player.active)canvas.style.cursor=selected?"pointer":"";}
  const outlined=selected?(selected.userData.outline as T.Object3D|undefined)??selected:null;if(outlined!==highlighted){highlighted=outlined;post?.highlight(outlined);}
  camera.getWorldDirection(forward);building.doors.forEach((d,i)=>{doorSounds[i].open=Math.min(1,Math.abs(d.angle)/(Math.PI*.5));});callbacks.listener(camera.position,forward,player.active&&player.grounded&&speed>.35,id,doorSounds);
  // Weather eases between states instead of snapping.
  const mood=climate[options.weather],k=options.motion?1-Math.exp(-dt*2.2):1;
  wind.windTime.value=elapsed;wind.windStrength.value+=(({rain:2.2,day:1,sunset:.9,night:.7})[options.weather]-wind.windStrength.value)*k;
  (scene.background as T.Color).lerp(sky.set(mood.sky),k);scene.fog!.color.copy(scene.background as T.Color);
  light.color.lerp(keyColor.set(mood.key),k);light.intensity+=(mood.keyI-light.intensity)*k;roomCenter.set(rooms[id].center[0],0,rooms[id].center[1]);light.target.position.lerp(keyTarget.set(.2,0,.8).add(roomCenter),k);light.position.lerp(keyPosition.set(...mood.pos).add(roomCenter),k);(scene.fog as T.FogExp2).density+=({rain:.016,day:.0065,sunset:.009,night:.011}[options.weather]-(scene.fog as T.FogExp2).density)*k;
  motes.position.set(Math.round(camera.position.x/6)*6,0,Math.round(camera.position.z/6)*6);moteMaterial.opacity+=(({rain:.22,day:.55,sunset:.6,night:.12}[options.weather])-moteMaterial.opacity)*k;motes.visible=options.motion&&!seat;
  if(motes.visible){for(let i=0;i<moteCount;i++){const o=i*3;motePositions[o]+=Math.sin(elapsed*.3+i)*.0009;motePositions[o+1]+=Math.sin(elapsed*.2+i*1.7)*.0006-.0002;motePositions[o+2]+=Math.cos(elapsed*.25+i)*.0009;if(motePositions[o+1]<.1)motePositions[o+1]=3.8;}moteGeometry.attributes.position.needsUpdate=true;}
  if(outsideVisible){heavens?.update(camera,elapsed,dt,options.weather,options.motion);outdoors?.update(camera,elapsed,dt,frameOptions);}
  ambient.groundColor.lerp(groundColor.set(mood.ground),k);ambient.color.lerp(fillColor.set(mood.fillSky),k);for(const lamp of building.lights)lamp.intensity+=(mood.room*(options.lights??1)-lamp.intensity)*k;ambient.intensity+=(mood.fill-ambient.intensity)*k;for(const w of windowLights){w.color.lerp(fillColor,k);w.intensity+=(mood.win-w.intensity)*k;}renderer.toneMappingExposure+=(mood.exposure-renderer.toneMappingExposure)*k;
  renderer.shadowMap.enabled=!low&&options.quality!=="low";
  // Shadow maps are cached: re-render when the light has moved more than a centimetre, a door swings, what is visible
  // changes, or a shadow-casting object actually moved (checked on a steady cadence; every frame on the balcony).
  // A lamp's own shadow map is redrawn only while its room can be seen.
  const vis=[...visibleRooms].join()+"|"+outsideVisible;shadowFrame++;castersDirty=castersMoved()||castersDirty||figuresMoved;figuresMoved=false;
  if(light.position.distanceToSquared(lastLightPos)>1e-4||vis!==visibilityKey||building.doors.some(d=>Math.abs(d.angle-d.target)>.001)||(castersDirty&&options.motion&&shadowFrame%(areaId==="rooftop"?1:3)===0)){
   renderer.shadowMap.needsUpdate=true;lastLightPos.copy(light.position);visibilityKey=vis;castersDirty=false;
   for(const l of shadowLights)l.shadow.needsUpdate=visibleRooms.has(locationAt(l.matrixWorld.elements[12],l.matrixWorld.elements[14]));
  }
  if(options.weather!==bakedWeather){bakedWeather=options.weather;bakeSoon=now+2200;}if(bakeSoon&&now>bakeSoon){bakeSoon=0;bakeReflections();}
  const effects=ensurePost();skipBehindWalls();raster();restoreSkipped();
  if(benchOn){const cpu=performance.now()-start;renderer.getContext().finish();bench.frames++;bench.cpu+=cpu;bench.full+=performance.now()-start;bench.calls+=renderer.info.render.calls;bench.tris+=renderer.info.render.triangles;}
  if(now-lastStats>250){lastStats=now;canvas.dataset.location=id;canvas.dataset.weather=options.weather;canvas.dataset.quality=effects?(aoOff?"medium":"high"):"low";canvas.dataset.position=[camera.position.x,camera.position.y,camera.position.z].map(n=>n.toFixed(3)).join(",");canvas.dataset.rotation=[player.yaw,player.pitch].map(n=>n.toFixed(3)).join(",");canvas.dataset.grounded=String(player.grounded);canvas.dataset.target=selected?.userData.action??"";canvas.dataset.active=String(player.active);canvas.dataset.mode=mode;canvas.dataset.doors=building.doors.map(d=>`${d.id}:${d.angle.toFixed(2)}`).join(",");canvas.dataset.drawer=String(bedroom.root.userData.drawerZ??0);canvas.dataset.calls=String(renderer.info.render.calls);canvas.dataset.triangles=String(renderer.info.render.triangles);canvas.dataset.geometries=String(renderer.info.memory.geometries);canvas.dataset.textures=String(renderer.info.memory.textures);canvas.dataset.loaded=Array.from(areas.keys()).join(",");}
  // Adaptive quality: drop ambient occlusion first, then the whole post stack, before frames suffer.
  if(performance.now()-start>(lively?24:40))slow++;else slow=Math.max(0,slow-1);
  if(slow>30&&post&&!aoOff){aoOff=true;post.ao.enabled=false;slow=0;}
  else if(slow>40&&!low&&renderScale<=.56){low=true;post?.dispose();post=null;renderer.setPixelRatio(ratio());}
  // Dynamic resolution: under ~50 fps the internal resolution steps down 10%; after a stretch of steady
  // headroom it steps back up (waiting longer each time it had to come down again, so it never oscillates).
  if(lively){if(lastFrameAt)frameEMA+=((now-lastFrameAt)-frameEMA)*.08;lastFrameAt=now;
   if(frameEMA>20){struggle++;comfort=0;}else if(frameEMA<17.6){comfort++;struggle=Math.max(0,struggle-2);}else struggle=Math.max(0,struggle-1);
   if(struggle>45&&renderScale>.55){renderScale=Math.max(.55,Math.round(renderScale*10-1)/10);struggle=0;if(steppedUp)comfortNeed=Math.min(comfortNeed*2,3600);steppedUp=false;renderer.setPixelRatio(ratio());sizePost();}
   else if(comfort>comfortNeed&&renderScale<1){renderScale=Math.min(1,Math.round(renderScale*10+1)/10);comfort=0;steppedUp=true;renderer.setPixelRatio(ratio());sizePost();}}
  statFrames++;statCpu+=performance.now()-start;if(now-statsAt>=500){callbacks.stats?.(Math.round(statFrames*1000/(now-statsAt)),statCpu/statFrames,renderScale);statFrames=0;statCpu=0;statsAt=now;}
 }
 // Pipeline pre-warm before the first frame: scene and post-processing shaders compile in parallel
 // (KHR_parallel_shader_compile) behind the loading screen, instead of freezing the first frame.
 async function prewarmPost(){const effects=ensurePost();if(!effects)return;const materials=new Set<T.Material>();for(const pass of effects.composer.passes)for(const value of Object.values(pass)){if(value instanceof T.Material)materials.add(value);else if(Array.isArray(value))for(const v of value)if(v instanceof T.Material)materials.add(v);}
  const stage=new T.Scene(),plane=new T.PlaneGeometry();materials.forEach(m=>stage.add(new T.Mesh(plane,m)));try{await renderer.compileAsync(stage,camera);}catch{/* compiled on first use */}plane.dispose();}
 indexShadows(building.root);indexShadows(bedroom.root);
 player.update(.016,options.motion);
 // Loading, behind the progress bar: downloads run in parallel while rooms are built one at a time, then
 // every shader compiles once, after all rooms and lights exist, so nothing ever compiles mid-walk.
 const ROOMS:Location[]=["archive","workshop","library","rooftop","vault"],COMPILES=ROOMS.length+4,STEPS=1+ROOMS.length*3+4+COMPILES;let stepsDone=0;
 const step=(label:string)=>{stepsDone++;callbacks.progress?.(Math.min(.99,stepsDone/STEPS),label);};
 void (async()=>{
  callbacks.progress?.(0,"Downloading the flat");ROOMS.forEach(id=>void download(id));const outdoorsModule=import("./outdoors"),skyModule=import("./sky");
  camera.aspect=Math.max(.1,container.clientWidth/Math.max(1,container.clientHeight));camera.updateProjectionMatrix();
  pinLights(bedroom.root);pinLights(building.root);building.addFurniture(bedroomParts);buildBVH(building.root);buildBVH(bedroom.root);step("Built the bedroom");await breathe();
  for(const id of ROOMS){await load(id,step);if(destroyed)return;}
  try{const m=await outdoorsModule;step("Downloaded the neighbourhood");await breathe();if(destroyed)return;
   const created=m.createOutdoors();created.setLife(options.life!==false);created.root.traverse(o=>o.layers.set(FAR_LAYER));freezeStatic(created.root);castProxies(created.root);indexOutside(created.root);pinLights(created.root);
   outdoors=created;scene.add(created.root);indexShadows(created.root);step("Built the neighbourhood");}
  catch(error){console.error(error);callbacks.notice("The neighbourhood could not load. The flat still works.");}
  await breathe();
  try{const m=await skyModule;step("Downloaded the sky");await breathe();if(destroyed)return;const created=m.createSky();created.root.traverse(o=>o.layers.set(FAR_LAYER));heavens=created;scene.add(created.root);step("Built the sky");}catch{/* the flat works without its sky */}
  callbacks.progress?.(Math.min(.99,stepsDone/STEPS),"Dressing your character");await avatarReady;await catReady;if(destroyed)return;
  indexShadows(lightRig);ensurePost();scene.updateMatrixWorld();let compiled=0;
  const compile=async(root:T.Object3D|undefined,label:string)=>{callbacks.progress?.(Math.min(.99,stepsDone/STEPS),`Compiling shaders · ${label} (${++compiled} of ${COMPILES})`);if(root)await prewarm(root);step(`Compiled ${label}`);};
  await compile(scene.children.includes(bedroom.root)?bedroom.root:undefined,"the bedroom");await compile(building.root,"walls and doors");
  for(const id of ROOMS)await compile(areas.get(id)?.root,rooms[id].label.replace(/^The /,"the "));
  await compile(outdoors?.root,"the neighbourhood");await compile(heavens?.root,"the sky");
  callbacks.progress?.(Math.min(.99,stepsDone/STEPS),"Compiling shaders · lighting and lenses");await prewarmPost();
  // Warm-up frame: draw everything once with culling off (shadow maps, ambient occlusion, bloom, reflections),
  // so the variants only a real frame creates are compiled here, not on your first step.
  callbacks.progress?.(.99,"Warming up the renderer");await breathe();if(destroyed)return;
  const warmTag=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(document.createElement("canvas")),transparent:true,depthWrite:false}));scene.add(warmTag);
  const culled:T.Object3D[]=[];scene.traverse(o=>{if(o.frustumCulled){o.frustumCulled=false;culled.push(o);}});
  renderer.shadowMap.needsUpdate=true;for(const l of shadowLights)l.shadow.needsUpdate=true;
  self.root.visible=true;selfBlob.visible=true; // so the character's skinned and shadow shaders compile here too
  try{raster();bakeReflections();}catch(error){console.warn(error);}finally{for(const o of culled)o.frustumCulled=true;self.root.visible=false;scene.remove(warmTag);warmTag.material.map?.dispose();warmTag.material.dispose();}
  if(destroyed)return;renderer.shadowMap.needsUpdate=true;bakeSoon=performance.now()+300;callbacks.progress?.(1,"Ready");callbacks.ready();renderer.setAnimationLoop(frame);
 })();
 return {enter,pause,interact,sit,stand,setStick(x:number,y:number){player.stick.set(x,y);},
 /** A member signed in: the bookshelf opens and the hidden door can be used. Returns where it happens, for sound. */
 unlock(){return openSecret(false);},
 /** Where you are, for friends in the room. */
 localState():PlayerState{const c=player.capsule.start;return {x:c.x,y:c.y-.24,z:c.z,yaw:player.yaw,pitch:player.pitch,speed:Math.hypot(player.velocity.x,player.velocity.z),grounded:player.grounded,room:areaId,seat:perched?.id};},
 /** Add or refresh a friend: name, shirt colour, and whether they are talking. */
 /** Your outfit for this visit (a fresh random one each time you join a room). */
 dress(outfit:Outfit){dressAvatar(self,outfit);},
 friend(id:string,name:string,color:string,talking:boolean,outfit?:Outfit){let r=remotes.get(id);if(r&&(r.color!==color||r.outfit!==JSON.stringify(outfit??null))){dropRemote(id);r=undefined;}if(!r){r=makeRemote(id,name,color,outfit);remotes.set(id,r);}if(r.name!==name||r.talking!==talking){r.name=name;r.talking=talking;drawTag(r);}lastRender=0;},
 /** A song is playing on the record player (the platter turns). Cheap: no renderer changes. */
 setMusic(on:boolean){options.music=on;},
 /** Make a gesture yourself (keys 1 to 5 do the same). */
 gesture(kind:Gesture){startGesture(kind);},
 /** A friend made a gesture. */
 friendGesture(id:string,kind:Gesture){const r=remotes.get(id);if(!r||!GESTURES[kind])return;r.gesture={kind,start:performance.now()};drawTag(r);lastRender=0;},
 moveFriend(id:string,state:PlayerState){const r=remotes.get(id);if(r)r.goal=state;},
 dropFriend(id:string){dropRemote(id);},
 /** A friend opened or closed a door. */
 setDoor(id:string,open:boolean){const door=building.doors.find(d=>d.id===id);if(door&&(Math.abs(door.target)>.3)!==open)building.toggle(id);lastRender=0;},
 debugScene(){return scene;},debugRenderer(){return renderer;},benchmark(on:boolean){if(on){benchOn=true;Object.assign(bench,{frames:0,cpu:0,full:0,calls:0,tris:0});return null;}benchOn=false;const n=Math.max(1,bench.frames);return {frames:bench.frames,cpuMs:+(bench.cpu/n).toFixed(2),frameMs:+(bench.full/n).toFixed(2),calls:Math.round(bench.calls/n),tris:Math.round(bench.tris/n)};},
 // Development aid for visual QA: jump to a spot, loading whatever rooms are near it.
 async teleport(x:number,z:number,yaw:number,pitch=-.05){perched=null;player.seated=null;for(const id of Object.keys(rooms) as Location[])if(Math.hypot(rooms[id].center[0]-x,rooms[id].center[1]-z)<9)await load(id);for(const door of building.doors)if(!door.locked)door.target=Math.PI*.53*door.swing;player.place(x,z,yaw,pitch);lastRender=0;},setOptions(next:WorldOptions){options={...next};baseFov=(options.fov??68)+(camera.aspect<.8?10:0);if(post){post.ao.enabled=options.ao!==false&&!aoOff;post.bloom.enabled=options.bloom!==false;post.grain(options.grain!==false);}if(outdoors)outdoors.setLife(options.life!==false);if(!postWanted()&&post){post.dispose();post=null;}renderer.setPixelRatio(ratio());sizePost();lastRender=0;},
 dispose(){destroyed=true;pause();renderer.setAnimationLoop(null);resize.disconnect();document.removeEventListener("pointerlockchange",lockChange);document.removeEventListener("keydown",keyDown);document.removeEventListener("keyup",keyUp);document.removeEventListener("visibilitychange",visibility);window.removeEventListener("blur",blurred);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);canvas.removeEventListener("pointerleave",leave);canvas.removeEventListener("click",click);canvas.removeEventListener("webglcontextlost",lost);canvas.removeEventListener("contextmenu",context);document.removeEventListener("mouseup",mouseUp);for(const area of areas.values())area.dispose?.();for(const id of Array.from(remotes.keys()))dropRemote(id);post?.dispose();scene.environment?.dispose();disposeObject(scene);light.shadow.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}
 };
}
export type WorldEngine=ReturnType<typeof createWorld>;
