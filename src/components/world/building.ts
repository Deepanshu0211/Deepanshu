import * as T from "three";
import { Octree } from "three/addons/math/Octree.js";
import { Capsule } from "three/addons/math/Capsule.js";
import { box, group, sign, colors as c, interactive, batchScenery, type Location } from "./objects";
import { surface, tiles, projected, metal, herringbone, weave } from "./materials";

// A fourth-floor flat: bedroom, living room, kitchen, study and an open balcony. Room ids are stable
// (they key lazy loading and saved state); the labels are what a visitor sees.
export const rooms: Record<Location,{center:[number,number];label:string}> = {
 bedroom:{center:[0,0],label:"The bedroom"}, archive:{center:[8,0],label:"The living room"},
 workshop:{center:[16,0],label:"The kitchen"},library:{center:[8,6.5],label:"The study"},rooftop:{center:[16,6.5],label:"The balcony"},
 vault:{center:[0,6.5],label:"The hidden room"}
};
export interface Door { id:string; hinge:T.Group; leaf:T.Mesh; angle:number; target:number; base:number; destination:Location; tree:Octree; /** The opening, for portal culling. */ portal:T.Box3; rooms:[Location,Location]; /** Which way it opens (+1 or -1). */ swing:number; /** Members only: no one can open it until it is unlocked. */ locked:boolean; }
type Opening=[from:number,to:number,bottom:number,top:number];
export function createBuilding(){
 const root=new T.Group(),colliders=new T.Group();const doors:Door[]=[];const lights:T.PointLight[]=[];
 const solid=(size:number[],pos:number[])=>{const mesh=new T.Mesh(new T.BoxGeometry(size[0],size[1],size[2]));mesh.position.set(pos[0],pos[1],pos[2]);colliders.add(mesh);return mesh;};
 const doorWood=surface("#8a5a36"),panelWood=surface("#7b4a2b"),brass=metal("#b0925f",.3),frameWood=surface("#3e2618");
 const glass=new T.MeshPhysicalMaterial({color:"#dfeceb",transparent:true,opacity:.14,roughness:.03,depthWrite:false});
 // Every room has its own paint (jewel tones after the reference rooms), so a wall shared by two rooms is drawn as
 // two half-thickness skins, each painted for the room on its side. Collision stays one solid box.
 const paint:Record<Location|"outside",T.Material>={
  bedroom:surface("#5b6370",.9,"plaster"),archive:surface("#1f4a5b",.9,"plaster"),workshop:surface("#a9bfb3",.9,"plaster"),
  library:projected(new T.MeshStandardMaterial({color:"#1d6a6c",bumpMap:weave(),bumpScale:2.2,roughness:.92}),.35), // grasscloth
  rooftop:surface(c.wall),vault:surface("#22473a",.9,"plaster"),outside:surface(c.wall)};
 const roomAt=(x:number,z:number):Location|"outside"=>x<-4||x>20||z<-3.25||z>9.75?"outside":x<4?(z<3.25?"bedroom":"vault"):z>3.25?(x<12?"library":"rooftop"):x<12?"archive":"workshop";
 function skin(size:number[],pos:number[]){
  const across=size[0]<=.2?0:size[2]<=.2?2:-1;if(across<0){box(root,size,pos,c.wall,0);return;}
  for(const side of [-1,1]){const s=[...size],p=[...pos],probe=[...pos];s[across]/=2;p[across]+=side*size[across]/4;probe[across]+=side*.4;box(root,s,p,paint[roomAt(probe[0],probe[2])],0);}
 }
 function wall(size:number[],pos:number[],color?:string){if(color)box(root,size,pos,color,0);else skin(size,pos);solid(size,pos);}
 // A wall with real window openings: plaster pieces around each hole, a timber frame, glass and a sill. Collision stays whole.
 function windowWall(axis:"x"|"z",fixed:number,from:number,to:number,openings:Opening[]){
  const seg=(a:number,b:number,y0:number,y1:number)=>{if(b-a<.01||y1-y0<.01)return;const mid=(a+b)/2,y=(y0+y1)/2;skin(axis==="z"?[b-a,y1-y0,.18]:[.18,y1-y0,b-a],axis==="z"?[mid,y,fixed]:[fixed,y,mid]);};
  let cursor=from;
  for(const [a,b,y0,y1] of openings){
   seg(cursor,a,0,4.4);seg(a,b,0,y0);seg(a,b,y1,4.4);cursor=b;
   const g=group(root,axis==="z"?[(a+b)/2,(y0+y1)/2,fixed]:[fixed,(y0+y1)/2,(a+b)/2]);if(axis==="x")g.rotation.y=Math.PI/2;
   const w=b-a,h=y1-y0;
   for(const x of [-w/2+.025,w/2-.025])box(g,[.07,h+.06,.24],[x,0,0],frameWood,.01);for(const y of [-h/2+.025,h/2-.025])box(g,[w+.02,.07,.24],[0,y,0],frameWood,.01);
   box(g,[.05,h,.12],[0,0,0],frameWood,.008);box(g,[w,.045,.1],[0,h*.18,0],frameWood,.008);
   const pane=box(g,[w,h,.012],[0,0,0],glass,0);pane.castShadow=false;
   box(g,[w+.3,.06,.34],[0,-h/2-.03,0],c.cream,.01);
  }
  seg(cursor,to,0,4.4);
  solid(axis==="z"?[to-from,4.4,.18]:[.18,4.4,to-from],axis==="z"?[(from+to)/2,2.2,fixed]:[fixed,2.2,(from+to)/2]);
 }
 function doorway(axis:"x"|"z",fixed:number,from:number,to:number,center:number,id:string,destination:Location,swing=axis==="x"?1:-1,locked=false){
   const width=1.5,low=center-width/2,high=center+width/2;
   if(axis==="x"){wall([.18,4.4,low-from],[fixed,2.2,(from+low)/2]);wall([.18,4.4,to-high],[fixed,2.2,(high+to)/2]);wall([.18,1.84,width],[fixed,3.48,center]);}
   else{wall([low-from,4.4,.18],[(from+low)/2,2.2,fixed]);wall([to-high,4.4,.18],[(high+to)/2,2.2,fixed]);wall([width,1.84,.18],[center,3.48,fixed]);}
   const hinge=group(root,axis==="x"?[fixed,0,low]:[low,0,fixed]);const base=axis==="x"?-Math.PI/2:0;hinge.rotation.y=base;interactive(hinge,`door:${id}`,`Open door · ${rooms[destination].label}`);
   // Four-panel timber door: recessed panels on both faces, lever handles and hinges.
   const leaf=box(hinge,[width-.04,2.52,.05],[width/2,1.28,0],doorWood,.012);
   for(const z of [-.027,.027])for(const [px,py,pw,ph] of [[.42,1.86,.5,.98],[1.08,1.86,.5,.98],[.42,.66,.5,.98],[1.08,.66,.5,.98]])box(hinge,[pw,ph,.012],[px,py,z],panelWood,.01);
   for(const z of [-.05,.05]){const lever=group(hinge,[1.32,1.02,z]);box(lever,[.05,.16,.012],[0,0,0],brass,.004);box(lever,[.13,.022,.022],[-.05,.04,z>0?.02:-.02],brass,.008);}
   for(const y of [.3,1.28,2.26])box(hinge,[.03,.1,.06],[.01,y,0],brass,.004);
   const frame=group(root,axis==="x"?[fixed,0,center]:[center,0,fixed]);frame.rotation.y=base;// Architraves sit just inside the opening so no face is coplanar with the plaster (that flickered).
   for(const x of [-.78,.78])box(frame,[.07,2.6,.26],[x,1.3,0],frameWood,.012);box(frame,[1.63,.1,.26],[0,2.57,0],frameWood,.012);
   const collision=new T.Mesh(new T.BoxGeometry(width,2.56,.085));collision.position.set(width/2,1.28,0);collision.updateMatrixWorld();const tree=new Octree().fromGraphNode(collision);collision.geometry.dispose();(collision.material as T.Material).dispose();
   const portal=axis==="x"?new T.Box3(new T.Vector3(fixed-.25,0,low),new T.Vector3(fixed+.25,2.6,high)):new T.Box3(new T.Vector3(low,0,fixed-.25),new T.Vector3(high,2.6,fixed+.25));
   const door={id,hinge,leaf,base,angle:0,target:0,destination,tree,portal,rooms:id.split("-") as [Location,Location],swing,locked};doors.push(door);
 }
 solid([40,.2,30],[7,-.12,3]);
 // Bedroom: its window wall is modelled in the bedroom itself.
 wall([.18,4.4,6.5],[-4,2.2,0]);solid([8,4.4,.18],[0,2.2,-3.25]);wall([8,4.4,.18],[0,2.2,3.25]);
 doorway("x",4,-3.25,3.25,1.1,"bedroom-archive","archive");
 // North facade: a wide living-room window and a window over the kitchen sink.
 windowWall("z",-3.25,4,20,[[6.4,9.6,.85,3.3],[15.25,17.55,1.3,3.1]]);
 wall([.18,4.4,6.5],[20,2.2,0]);
 doorway("x",12,-3.25,3.25,1.1,"archive-workshop","workshop");
 doorway("z",3.25,4,12,8,"archive-library","library");
 wall([8,4.4,.18],[16,2.2,3.25]);
 // Behind the study bookshelf: a locked door into the hidden room, which only members can open. It swings into the hidden room.
 doorway("x",4,3.25,9.75,6.5,"library-vault","vault",-1,true);
 // A framed photo of the members on its study face (the hinge's -z side), captioned underneath.
 {const art=group(doors[doors.length-1].hinge,[.75,0,-.045]);art.rotation.y=Math.PI;const photo=new T.TextureLoader().load("/images/global-friends.webp");photo.colorSpace=T.SRGBColorSpace;
  box(art,[.86,.86,.02],[0,1.6,0],frameWood,.006);const picture=new T.Mesh(new T.PlaneGeometry(.78,.78),new T.MeshStandardMaterial({map:photo,roughness:.6}));picture.position.set(0,1.6,.011);art.add(picture);
  sign(art,"Global friends",[0,1.07,.003],.7,.13,"#efe7d4",c.edge);}wall([.18,4.4,6.5],[-4,2.2,6.5]);wall([8,4.4,.18],[0,2.2,9.75]); // the hidden room runs the width of the bedroom
 windowWall("z",9.75,4,12,[[6.6,9.4,.95,3.0]]);
 doorway("x",12,3.25,9.75,7.2,"library-rooftop","rooftop");
 const floors:Record<Location,T.Material>={
  bedroom:doorWood,
  // Herringbone parquet in the living rooms, as in the reference.
  archive:projected(new T.MeshPhysicalMaterial({color:"#a87a52",map:herringbone(),bumpMap:herringbone(),bumpScale:1.2,roughness:.5,clearcoat:.3,clearcoatRoughness:.4}),1.8),
  workshop:projected(new T.MeshPhysicalMaterial({map:tiles("cement"),roughness:.55,clearcoat:.35,clearcoatRoughness:.3}),1),
  library:projected(new T.MeshPhysicalMaterial({color:"#8a5f3e",map:herringbone(),bumpMap:herringbone(),bumpScale:1.2,roughness:.5,clearcoat:.3,clearcoatRoughness:.4}),1.8),
  rooftop:projected(new T.MeshPhysicalMaterial({map:tiles("kota"),bumpMap:tiles("kota"),bumpScale:.6,roughness:.62,clearcoat:.15}),2.4),
  vault:projected(new T.MeshPhysicalMaterial({color:"#6e4b35",map:herringbone(),bumpMap:herringbone(),bumpScale:1.2,roughness:.5,clearcoat:.3,clearcoatRoughness:.4}),1.8),
 };
 // Every room light hangs from a visible fitting: a flush-mount opal dome on a brass rim.
 const lamps:Record<Exclude<Location,"vault">,[number,number,number]>={bedroom:[1.5,4.05,.4],archive:[6.6,4.05,1.2],workshop:[16,4.05,-1.3],library:[8,4.05,5.6],rooftop:[16,2.6,3.5]};
 const opal=new T.MeshBasicMaterial({color:new T.Color("#fff1d8").multiplyScalar(1.7)});
 for(const [name,room] of Object.entries(rooms) as [Location,typeof rooms[Location]][]){
   const [x,z]=room.center,w=8;
   if(name!=="bedroom")box(root,[w-.05,.045,6.45],[x,0,z],floors[name],0);
   // The hidden room has no ceiling fitting: its own lamps stay on (vault.ts).
   if(name==="vault"){wall([w,.16,6.5],[x,4.44,z],"#f2efe8");continue;}
   const light=new T.PointLight("#ffd3a0",8,name==="rooftop"?7:9,2);light.position.set(...lamps[name]);root.add(light);lights.push(light);
   if(name==="rooftop")continue;
   const [lx,,lz]=lamps[name];const dome=new T.Mesh(new T.SphereGeometry(.24,32,12,0,Math.PI*2,Math.PI/2,Math.PI/2),opal);dome.scale.y=.45;dome.position.set(lx,4.36,lz);root.add(dome);
   const rim=new T.Mesh(new T.TorusGeometry(.245,.012,8,48),brass);rim.rotation.x=Math.PI/2;rim.position.set(lx,4.355,lz);root.add(rim);
   wall([8,.16,6.5],[x,4.44,z],name==="archive"?"#1f4a5b":"#f2efe8"); // the living room's ceiling is painted with its walls
   if(name==="bedroom")for(const bx of [-3.2,0,3.2])box(root,[.14,.16,6.5],[x+bx,4.28,z],c.edge);
   else for(const [sx,sz,px,pz] of [[7.8,.08,0,-3.12],[7.8,.08,0,3.12],[.08,6.3,-3.92,0],[.08,6.3,3.92,0]])box(root,[sx,.1,sz],[x+px,4.31,z+pz],"#f2efe8",.02); // white cornice
 }
 // Balcony parapet and railing are real barriers; the balcony draws them.
 solid([.2,1.4,6.6],[20,.7,6.5]);solid([8.2,1.4,.2],[16,.7,9.75]);
 // Furniture collision is built from each room's own meshes when it loads (see collidersFrom).
 root.updateMatrixWorld(true);colliders.updateMatrixWorld(true);const tree=new Octree().fromGraphNode(colliders);
 colliders.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});
 batchScenery(root);
 const local=new Capsule(),inverse=new T.Matrix4();
 function doorCollision(door:{hinge:T.Object3D;tree:Octree},capsule:Capsule){door.hinge.updateMatrixWorld(true);inverse.copy(door.hinge.matrixWorld).invert();local.copy(capsule);local.start.applyMatrix4(inverse);local.end.applyMatrix4(inverse);const hit=door.tree.capsuleIntersect(local);if(hit)hit.normal.transformDirection(door.hinge.matrixWorld);return hit;}
 const furniture:Octree[]=[];
 /** Add a room's furniture collision, built from its meshes. */
 function addFurniture(parts:T.Group){parts.updateMatrixWorld(true);if(parts.children.length)furniture.push(new Octree().fromGraphNode(parts));parts.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});}
 // Swinging furniture (the bookshelf doors): collision is one box in the pivot's own space, tested like a door.
 const movers:{hinge:T.Object3D;tree:Octree}[]=[];
 function addMover(hinge:T.Object3D,size:[number,number,number],center:[number,number,number]){const box=new T.Mesh(new T.BoxGeometry(...size));box.position.set(...center);box.updateMatrixWorld();movers.push({hinge,tree:new Octree().fromGraphNode(box)});box.geometry.dispose();(box.material as T.Material).dispose();}
 return {root,tree,doors,lights,furniture,addFurniture,movers,addMover,doorCollision,update(dt:number,player:Capsule,motion:boolean){
   for(const door of doors){const old=door.angle;const next=motion?T.MathUtils.damp(old,door.target,7,dt):door.target;if(Math.abs(old-next)<.0001)continue;
     door.angle=next;door.hinge.rotation.y=door.base+next;const hit=doorCollision(door,player);
     if(hit&&hit.depth>.035){door.angle=old;door.hinge.rotation.y=door.base+old;door.target=old;}
   }
 },toggle(id:string){const door=doors.find(d=>d.id===id);if(!door)return;door.target=Math.abs(door.target)<.3?door.swing*Math.PI*.53:0;door.hinge.userData.label=`${Math.abs(door.target)>.3?"Close":"Open"} door · ${rooms[door.destination].label}`;return door;}};
}
export type Building=ReturnType<typeof createBuilding>;
