import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createBedroom } from "./bedroom";
import { type Action,type Area,type Location,type WorldOptions,type Weather,disposeObject,batchScenery,collidersFrom } from "./objects";
import { createBuilding,rooms } from "./building";
import { Walker } from "./controller";
import { createPost,type Post } from "./post";
export interface WorldCallbacks {
 action:(action:Action,position:T.Vector3)=>void;
 target:(name:string,action:string)=>void;
 ready:()=>void; fail:()=>void; active:(active:boolean)=>void;
 location:(location:Location)=>void; notice:(text:string)=>void;
 listener:(position:T.Vector3,forward:T.Vector3,moving:boolean,location:Location)=>void;
 /** While seated at a screen: its rectangle in page pixels, or null once you stand up. */
 /** Movement and hover cues for sound: jumps, landings, and pointing at something you can use. */
 cue?:(kind:"jump"|"land"|"hover",at:T.Vector3)=>void;
 /** Path-traced photo mode: accumulated samples, or 0 when the rasteriser is drawing. */
 rtx?:(samples:number)=>void;
 screen?:(seat:{id:"computer"|"laptop";x:number;y:number;w:number;h:number}|null)=>void;
}
// Per-weather light: window key colour and strength, sky fill, and the world beyond the glass.
const climate:Record<Weather,{sky:string;fillSky:string;key:string;keyI:number;fill:number;ground:string;room:number;exposure:number;pos:[number,number,number]}>={
 rain:{sky:"#273c43",fillSky:"#cbd6d2",key:"#b9d2d4",keyI:1.35,fill:.34,ground:"#4d453b",room:5,exposure:1,pos:[-1.4,7,-10]},
 day:{sky:"#9fbdb9",fillSky:"#fff4e2",key:"#fff1da",keyI:3.4,fill:.9,ground:"#6d5f4c",room:1.5,exposure:1.05,pos:[-2.6,8,-9]},
 sunset:{sky:"#9c776b",fillSky:"#ffc49c",key:"#ffad73",keyI:3,fill:.5,ground:"#5a4334",room:3,exposure:1.08,pos:[-6.5,4.2,-9]},
 night:{sky:"#17262f",fillSky:"#7a8cb0",key:"#8fa6c9",keyI:.4,fill:.16,ground:"#2b2a2a",room:3.2,exposure:1.12,pos:[-1,8,-9]},
};
export function createWorld(container:HTMLElement,callbacks:WorldCallbacks,initial:WorldOptions){
 let destroyed=false,options={...initial},mode:"pointer"|"drag"|"touch"="pointer",dragging=false,elapsed=0,last=0,lastRender=0,areaId:Location="bedroom",slow=0,low=innerWidth<700||matchMedia("(pointer: coarse)").matches,aoOff=false;
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=!low;renderer.shadowMap.type=T.PCFShadowMap;renderer.info.autoReset=false;
 const canvas=renderer.domElement;canvas.setAttribute("aria-label","First-person explorable world. Hover and click objects, or enter to walk with WASD, look with the mouse, E to interact, Escape to pause.");canvas.tabIndex=0;container.prepend(canvas);
 const scene=new T.Scene();scene.background=new T.Color(climate[options.weather].sky);scene.fog=new T.FogExp2(climate[options.weather].sky,.013);
 // Image-based lighting: soft reflections on varnish, metal, ceramic and glass.
 const pmrem=new T.PMREMGenerator(renderer);const environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment,.04).texture;scene.environmentIntensity=.3;environment.dispose();pmrem.dispose();
 const building=createBuilding();scene.add(building.root);const camera=new T.PerspectiveCamera(68,1,.045,420);const player=new Walker(camera,building);
 const areas=new Map<Location,Area>();const pending=new Map<Location,Promise<void>>();const bedroom=createBedroom();building.addFurniture(collidersFrom(bedroom.root));batchScenery(bedroom.root);scene.add(bedroom.root);areas.set("bedroom",bedroom);
 const ambient=new T.HemisphereLight("#e7dcc4",climate[options.weather].ground,climate[options.weather].fill);scene.add(ambient);
 // Key light enters through the bedroom window, so mullions throw a real pattern across the floor.
 const light=new T.DirectionalLight(climate[options.weather].key,climate[options.weather].keyI);light.position.set(...climate[options.weather].pos);light.target.position.set(.2,0,.8);scene.add(light.target);
 light.castShadow=true;light.shadow.mapSize.set(low?1024:2048,low?1024:2048);Object.assign(light.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:1,far:30});light.shadow.radius=3;light.shadow.bias=-.0004;light.shadow.normalBias=.03;scene.add(light);
 let post:Post|null=null;
 // The neighbourhood and sky arrive after the first frame, so the room opens as fast as before.
 let outdoors:ReturnType<typeof import("./outdoors").createOutdoors>|null=null,heavens:ReturnType<typeof import("./sky").createSky>|null=null;
 const keyTarget=new T.Vector3(.2,0,.8),roomCenter=new T.Vector3();
 // Dust in the air: a few hundred motes drifting around the camera, catching the light.
 const moteCount=320,motePositions=new Float32Array(moteCount*3),moteGeometry=new T.BufferGeometry();for(let i=0;i<moteCount;i++)motePositions.set([(Math.random()-.5)*6,Math.random()*3.6+.2,(Math.random()-.5)*6],i*3);
 moteGeometry.setAttribute("position",new T.BufferAttribute(motePositions,3));const moteDot=document.createElement("canvas");moteDot.width=moteDot.height=32;{const g=moteDot.getContext("2d")!,r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,"#fff");r.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=r;g.fillRect(0,0,32,32);}
 const moteMaterial=new T.PointsMaterial({color:"#fff1d6",map:new T.CanvasTexture(moteDot),size:.014,transparent:true,opacity:.4,depthWrite:false,blending:T.AdditiveBlending});
 const motes=new T.Points(moteGeometry,moteMaterial);motes.frustumCulled=false;scene.add(motes);
 // Seated mode: the camera eases from the walker into a chair and squares up to a screen.
 type Seat=NonNullable<Area["seats"]>[number];let seat:Seat|null=null,leaving:Seat|null=null,seatBlend=0,lastRect="";
 const seatPos=new T.Vector3(),seatLook=new T.Vector3(),walkPos=new T.Vector3(),walkQuat=new T.Quaternion(),seatQuat=new T.Quaternion(),lookMatrix=new T.Matrix4(),corner=new T.Vector3();
 // Ray-traced photo mode while the camera is still (see raytrace.ts).
 let rt:import("./raytrace").Raytracer|null=null,rtLoading=false,tracing=false,lastSamples=-1;const rtTop=new T.Color(),rtBottom=new T.Color();
 // Right mouse held: a smooth zoom, with look speed scaled down to match.
 let zoomHeld=false,baseFov=68;
 function context(e:Event){e.preventDefault();}
 function stillness(now:number){return !player.active&&!seat&&seatBlend===0&&now-pointerMoved>1400&&!player.settling&&building.doors.every(d=>Math.abs(d.angle-d.target)<.002);}
 function trace(now:number){
  if(!options.rtx||!postWanted()||!stillness(now)){if(tracing){tracing=false;}return false;}
  if(!rt){if(!rtLoading){rtLoading=true;import("./raytrace").then(m=>m.createRaytracer(renderer,scene,camera,raster)).then(r=>{if(destroyed){r.dispose();return;}rt=r;lastRender=0;}).catch(error=>{console.warn("Ray tracing unavailable",error);options.rtx=false;});}return false;}
  const hidden=[outdoors?.root,heavens?.root,...Array.from(areas.entries()).filter(([id])=>id!==areaId).map(([,a])=>a.root)].filter(Boolean) as T.Object3D[];
  const key=`${areaId}|${options.weather}|${options.lamp}|${Array.from(areas.keys()).join()}`;
  rtTop.set(climate[options.weather].fillSky);rtBottom.set(climate[options.weather].ground);void rt.prepare(key,hidden,rtTop,rtBottom);
  if(!rt.ready)return false;
  if(!tracing){tracing=true;rt.reset();}
  return rt.render();
 }
 let bakeSoon=0,bakedWeather="";
 function bakeReflections(){scene.updateMatrixWorld();for(const area of areas.values())area.bake?.(renderer,scene);}
 function raster(){const effects=ensurePost();if(effects)effects.render(elapsed,options.motion);else renderer.render(scene,camera);}
 function sit(id:string){for(const area of areas.values()){const found=area.seats?.find(s=>s.id===id);if(found){seat=found;leaving=null;pause();hasPointer=false;player.drift.set(0,0);canvas.style.cursor="";post?.highlight(null);highlighted=null;lastRender=0;return;}}}
 function stand(){if(!seat)return;leaving=seat;seat=null;lastRect="";callbacks.screen?.(null);lastRender=0;}
 function screenRect(s:Seat){const box=s.screen.geometry.boundingBox??(s.screen.geometry.computeBoundingBox(),s.screen.geometry.boundingBox!);const rect=canvas.getBoundingClientRect();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const [x,y] of [[box.min.x,box.min.y],[box.max.x,box.min.y],[box.min.x,box.max.y],[box.max.x,box.max.y]]){corner.set(x,y,0).applyMatrix4(s.screen.matrixWorld).project(camera);const px=rect.left+(corner.x+1)/2*rect.width,py=rect.top+(1-corner.y)/2*rect.height;x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px);y1=Math.max(y1,py);}
  return {id:s.id,x:x0,y:y0,w:x1-x0,h:y1-y0};}
 void import("./sky").then(m=>{if(destroyed)return;heavens=m.createSky();scene.add(heavens.root);lastRender=0;}).catch(()=>{});
 void import("./outdoors").then(m=>{if(destroyed)return;outdoors=m.createOutdoors();outdoors.setLife(options.life!==false);scene.add(outdoors.root);bakeSoon=performance.now()+400;lastRender=0;}).catch(error=>{console.error(error);callbacks.notice("The neighbourhood could not load. The flat still works.");});
 function postWanted(){return !low&&options.quality!=="low";}
 function ensurePost(){if(postWanted()&&!post){try{post=createPost(renderer,scene,camera);sizePost();post.ao.enabled=options.ao!==false&&!aoOff;post.bloom.enabled=options.bloom!==false;post.grain(options.grain!==false);}catch(error){console.warn(error);low=true;}}return postWanted()?post:null;}
 const sky=new T.Color(),keyColor=new T.Color(),groundColor=new T.Color(),fillColor=new T.Color(),keyPosition=new T.Vector3();
 const ray=new T.Raycaster();const center=new T.Vector2(),pointer=new T.Vector2();let hasPointer=false,pointerMoved=0,selected:T.Object3D|null=null,lastLabel="",highlighted:T.Object3D|null=null;const selectedPoint=new T.Vector3(),forward=new T.Vector3();
 async function load(id:Location){
   if(areas.has(id))return;if(pending.has(id))return pending.get(id);
   const task=(async()=>{try{
     const area=id==="archive"?(await import("./living")).createLiving():id==="rooftop"?(await import("./balcony")).createBalcony():id==="library"?(await import("./study")).createStudy():(await import("./kitchen")).createKitchen();
     if(destroyed){area.dispose?.();disposeObject(area.root);return;}
     const [x,z]=rooms[id].center;area.root.position.set(x,0,z);building.addFurniture(collidersFrom(area.root));batchScenery(area.root);scene.add(area.root);areas.set(id,area);bakeSoon=performance.now()+600;
   }catch{callbacks.notice("That room could not load. Please try its door again.");}finally{pending.delete(id);}})();pending.set(id,task);return task;
 }
 function locationAt(x:number,z:number):Location{if(x<4)return"bedroom";if(z>3.25)return x<12?"library":"rooftop";return x<12?"archive":"workshop";}
 async function activate(object:T.Object3D|null,point:T.Vector3){
  if(!object)return;const action=object.userData.action as Action;
  if(action==="computer"||action==="laptop"){sit(action);callbacks.action(action,point.clone());return;}
  if(action.startsWith("door:")){
    const door=building.doors.find(d=>d.id===action.slice(5));if(!door)return;
    const opposite=door.id==="bedroom-archive"?"bedroom":door.id==="archive-workshop"?"archive":door.id==="archive-library"?"archive":"library";
    await load(door.destination);if(opposite!=="bedroom")await load(opposite);
    if(!areas.has(door.destination))return;building.toggle(door.id);callbacks.action(action,point.clone());return;
  }
  for(const area of areas.values()){if(isDescendant(object,area.root)){area.interact?.(action);break;}}
  if(["projects","skills","about","experience","contact","lab","telescope","profile"].includes(action)||action.startsWith("project:")||action.startsWith("skill:"))pause();
  callbacks.action(action,point.clone());
 }
 function interact(){if(player.active)return activate(selected,selectedPoint);}
 function isDescendant(obj:T.Object3D,parent:T.Object3D){let p:T.Object3D|null=obj;while(p){if(p===parent)return true;p=p.parent;}return false;}
 function pause(){player.active=false;player.clear();dragging=false;if(document.pointerLockElement===canvas)document.exitPointerLock();callbacks.active(false);}
 async function enter(next:"pointer"|"drag"|"touch"="pointer"){
  if(seat)stand();
  mode=next;if(next==="pointer"){
   try{await canvas.requestPointerLock();}catch{mode="drag";callbacks.notice("Mouse capture is unavailable here. Drag to look, or use the arrow keys.");}
  }
  if(destroyed)return;hasPointer=false;player.active=true;canvas.style.cursor="";canvas.focus({preventScroll:true});callbacks.active(true);
 }
 function lockChange(){if(document.pointerLockElement===canvas){player.active=true;callbacks.active(true);}else if(mode==="pointer"){player.active=false;player.clear();callbacks.active(false);}}
 function keyDown(e:KeyboardEvent){if(!player.active||e.target instanceof HTMLInputElement)return;if(e.code==="Escape"){pause();return;}if(["KeyW","KeyA","KeyS","KeyD","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space","KeyE"].includes(e.code)){e.preventDefault();if(e.code==="KeyE"){if(!e.repeat)void interact();}else player.keys.add(e.code);}}
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
  ray.far=7.5;ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects([building.root,...Array.from(areas.values(),a=>a.root)],true)[0];let object:T.Object3D|null=hit?.object??null;while(object&&!object.userData.action)object=object.parent;
  if(object&&hit)void activate(object,hit.point);
 }
 function sizePost(){const {width,height}=container.getBoundingClientRect();if(post&&width&&height)post.setSize(width,height,renderer.getPixelRatio());}
 function ratio(){return Math.min(devicePixelRatio,low||options.quality==="low"?1:post?1.25:1.5);}
 const resize=new ResizeObserver(()=>{const {width,height}=container.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;baseFov=(options.fov??68)+(width/height<.8?10:0);camera.fov=baseFov;camera.updateProjectionMatrix();renderer.setPixelRatio(ratio());renderer.setSize(width,height);sizePost();lastRender=0;});resize.observe(container);
 function lost(e:Event){e.preventDefault();pause();renderer.setAnimationLoop(null);callbacks.fail();}
 function visibility(){player.clear();last=0;renderer.setAnimationLoop(document.hidden?null:frame);if(document.hidden)pause();}
 document.addEventListener("pointerlockchange",lockChange);document.addEventListener("keydown",keyDown);document.addEventListener("keyup",keyUp);document.addEventListener("visibilitychange",visibility);window.addEventListener("blur",pause);
 canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);canvas.addEventListener("pointerleave",leave);canvas.addEventListener("click",click);canvas.addEventListener("webglcontextlost",lost);canvas.addEventListener("contextmenu",context);document.addEventListener("mouseup",mouseUp);
 function frame(now:number){
  if(destroyed)return;
  const fovGoal=zoomHeld?baseFov*.4:baseFov;
  const lively=Math.abs(camera.fov-fovGoal)>.05||player.active||now-pointerMoved<1600||player.settling||(seat?seatBlend<.999:seatBlend>0)||tracing;
  const interval=lively?1000/60:options.motion?1000/30:250;if(now-lastRender<interval)return;
  const dt=Math.min((now-(last||now))/1000,.05);last=lastRender=now;const start=performance.now();if(options.motion)elapsed+=dt;renderer.info.reset();
  const wasGrounded=player.grounded,fallSpeed=player.velocity.y;
  building.update(dt,player.capsule,options.motion);player.update(dt,options.motion);
  if(player.active){if(wasGrounded&&player.velocity.y>2.5)callbacks.cue?.("jump",camera.position);else if(!wasGrounded&&player.grounded&&fallSpeed<-1.5)callbacks.cue?.("land",player.capsule.start);}
  if(Math.abs(camera.fov-fovGoal)>.01){camera.fov+=(fovGoal-camera.fov)*(options.motion?1-Math.exp(-dt*10):1);camera.updateProjectionMatrix();}
  const id=locationAt(camera.position.x,camera.position.z);if(id!==areaId){areaId=id;callbacks.location(id);}
  for(const [id,area] of areas){const [x,z]=rooms[id].center;const near=Math.hypot(camera.position.x-x,camera.position.z-z)<15;area.root.visible=near;if(near)area.update?.(elapsed,dt,{...options,quality:low?"low":options.quality});}
  for(const door of building.doors){if(camera.position.distanceTo(door.hinge.getWorldPosition(new T.Vector3()))<3.5)void load(door.destination);}
  // Blend between the walker's view and the seat, then report where the screen sits on the page.
  const goal=seat?1:0;seatBlend+=(goal-seatBlend)*(options.motion?1-Math.exp(-dt*3.4):1);if(Math.abs(goal-seatBlend)<.002){seatBlend=goal;if(!seat)leaving=null;}
  const using=seat??leaving;
  if(using&&seatBlend>0){scene.updateMatrixWorld();using.eye.getWorldPosition(seatPos);using.screen.getWorldPosition(seatLook);lookMatrix.lookAt(seatPos,seatLook,camera.up);seatQuat.setFromRotationMatrix(lookMatrix);walkPos.copy(camera.position);walkQuat.copy(camera.quaternion);const e=seatBlend*seatBlend*(3-2*seatBlend);camera.position.lerpVectors(walkPos,seatPos,e);camera.quaternion.slerpQuaternions(walkQuat,seatQuat,e);}
  camera.updateMatrixWorld();scene.updateMatrixWorld();
  if(seat&&seatBlend>.985){const r=screenRect(seat),key=[r.x,r.y,r.w,r.h].map(Math.round).join();if(key!==lastRect){lastRect=key;callbacks.screen?.(r);}}
  const picking=(player.active||hasPointer)&&!using;ray.far=player.active?2.65:7.5;ray.setFromCamera(player.active?center:pointer,camera);
  const hits=picking?ray.intersectObjects([building.root,...Array.from(areas.values(),a=>a.root)],true):[];selected=null;
  if(hits.length){let object:T.Object3D|null=hits[0].object;while(object&&!object.userData.action)object=object.parent;selected=object;selectedPoint.copy(hits[0].point);}
  const label=selected?.userData.label??"";if(label!==lastLabel){lastLabel=label;if(label)callbacks.cue?.("hover",selectedPoint);callbacks.target(label,selected?.userData.action??"");if(!player.active)canvas.style.cursor=selected?"pointer":"";}
  const outlined=selected?(selected.userData.outline as T.Object3D|undefined)??selected:null;if(outlined!==highlighted){highlighted=outlined;post?.highlight(outlined);}
  camera.getWorldDirection(forward);callbacks.listener(camera.position,forward,player.active&&player.grounded&&Math.hypot(player.velocity.x,player.velocity.z)>.35,id);
  // Weather eases between states instead of snapping.
  const mood=climate[options.weather],k=options.motion?1-Math.exp(-dt*2.2):1;
  (scene.background as T.Color).lerp(sky.set(mood.sky),k);scene.fog!.color.copy(scene.background as T.Color);
  light.color.lerp(keyColor.set(mood.key),k);light.intensity+=(mood.keyI-light.intensity)*k;roomCenter.set(rooms[id].center[0],0,rooms[id].center[1]);light.target.position.lerp(keyTarget.set(.2,0,.8).add(roomCenter),k);light.position.lerp(keyPosition.set(...mood.pos).add(roomCenter),k);(scene.fog as T.FogExp2).density+=({rain:.016,day:.0065,sunset:.009,night:.011}[options.weather]-(scene.fog as T.FogExp2).density)*k;
  motes.position.set(Math.round(camera.position.x/6)*6,0,Math.round(camera.position.z/6)*6);moteMaterial.opacity+=(({rain:.22,day:.55,sunset:.6,night:.12}[options.weather])-moteMaterial.opacity)*k;motes.visible=options.motion&&!seat;
  if(motes.visible){for(let i=0;i<moteCount;i++){const o=i*3;motePositions[o]+=Math.sin(elapsed*.3+i)*.0009;motePositions[o+1]+=Math.sin(elapsed*.2+i*1.7)*.0006-.0002;motePositions[o+2]+=Math.cos(elapsed*.25+i)*.0009;if(motePositions[o+1]<.1)motePositions[o+1]=3.8;}moteGeometry.attributes.position.needsUpdate=true;}
  heavens?.update(camera,elapsed,dt,options.weather,options.motion);outdoors?.update(camera,elapsed,dt,{...options,quality:low?"low":options.quality});
  ambient.groundColor.lerp(groundColor.set(mood.ground),k);ambient.color.lerp(fillColor.set(mood.fillSky),k);for(const lamp of building.lights)lamp.intensity+=(mood.room*(options.lights??1)-lamp.intensity)*k;ambient.intensity+=(mood.fill-ambient.intensity)*k;renderer.toneMappingExposure+=(mood.exposure-renderer.toneMappingExposure)*k;
  renderer.shadowMap.enabled=!low&&options.quality!=="low";
  if(options.weather!==bakedWeather){bakedWeather=options.weather;bakeSoon=now+2200;}if(bakeSoon&&now>bakeSoon){bakeSoon=0;bakeReflections();}
  const traced=trace(now);const raw=traced&&rt?(rt.busy?-1:Math.floor(rt.samples)):options.rtx&&rt?.busy?-1:0,samples=raw<16?raw:raw-raw%16;if(samples!==lastSamples){lastSamples=samples;callbacks.rtx?.(samples);}
  const effects=traced?null:ensurePost();if(!traced)raster();
  canvas.dataset.location=id;canvas.dataset.weather=options.weather;canvas.dataset.samples=String(raw);canvas.dataset.quality=effects?(aoOff?"medium":"high"):"low";canvas.dataset.position=[camera.position.x,camera.position.y,camera.position.z].map(n=>n.toFixed(3)).join(",");canvas.dataset.rotation=[player.yaw,player.pitch].map(n=>n.toFixed(3)).join(",");canvas.dataset.grounded=String(player.grounded);canvas.dataset.target=selected?.userData.action??"";canvas.dataset.active=String(player.active);canvas.dataset.mode=mode;canvas.dataset.doors=building.doors.map(d=>`${d.id}:${d.angle.toFixed(2)}`).join(",");canvas.dataset.drawer=String(bedroom.root.userData.drawerZ??0);canvas.dataset.calls=String(renderer.info.render.calls);canvas.dataset.triangles=String(renderer.info.render.triangles);canvas.dataset.geometries=String(renderer.info.memory.geometries);canvas.dataset.textures=String(renderer.info.memory.textures);canvas.dataset.loaded=Array.from(areas.keys()).join(",");
  // Adaptive quality: drop ambient occlusion first, then the whole post stack, before frames suffer.
  if(traced||rt?.busy)slow=0;else if(performance.now()-start>(lively?24:40))slow++;else slow=Math.max(0,slow-1);
  if(slow>30&&post&&!aoOff){aoOff=true;post.ao.enabled=false;slow=0;}
  else if(slow>40&&!low){low=true;post?.dispose();post=null;renderer.setPixelRatio(1);}
 }
 player.update(.016,options.motion);callbacks.ready();renderer.setAnimationLoop(frame);
 return {enter,pause,interact,sit,stand,setStick(x:number,y:number){player.stick.set(x,y);},
 // Development aid for visual QA: jump to a spot, loading whatever rooms are near it.
 async teleport(x:number,z:number,yaw:number,pitch=-.05){for(const id of Object.keys(rooms) as Location[])if(Math.hypot(rooms[id].center[0]-x,rooms[id].center[1]-z)<9)await load(id);for(const door of building.doors)door.target=Math.PI*.53*(door.base<0?1:-1);player.place(x,z,yaw,pitch);lastRender=0;},setOptions(next:WorldOptions){options={...next};tracing=false;baseFov=(options.fov??68)+(camera.aspect<.8?10:0);if(post){post.ao.enabled=options.ao!==false&&!aoOff;post.bloom.enabled=options.bloom!==false;post.grain(options.grain!==false);}if(outdoors)outdoors.setLife(options.life!==false);if(!postWanted()&&post){post.dispose();post=null;}renderer.setPixelRatio(ratio());sizePost();lastRender=0;},
 dispose(){destroyed=true;pause();renderer.setAnimationLoop(null);resize.disconnect();document.removeEventListener("pointerlockchange",lockChange);document.removeEventListener("keydown",keyDown);document.removeEventListener("keyup",keyUp);document.removeEventListener("visibilitychange",visibility);window.removeEventListener("blur",pause);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);canvas.removeEventListener("pointerleave",leave);canvas.removeEventListener("click",click);canvas.removeEventListener("webglcontextlost",lost);canvas.removeEventListener("contextmenu",context);document.removeEventListener("mouseup",mouseUp);for(const area of areas.values())area.dispose?.();post?.dispose();rt?.dispose();scene.environment?.dispose();disposeObject(scene);light.shadow.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}
 };
}
export type WorldEngine=ReturnType<typeof createWorld>;
