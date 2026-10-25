import * as T from "three";
import { type Area, colors as c, box, cylinder, group, sign, plant, interactive, sphere, tube } from "./objects";
export function createRooftop(): Area {
  const root=new T.Group();box(root,[8,.4,6.5],[0,-.1,0],c.edge);box(root,[7.8,.06,6.3],[0,.14,0],"#8e8170");
  for(let i=0;i<12;i++)box(root,[7.7,.012,.018],[0,.179,-2.9+i*.53],"#6a6559",0);
  for(const x of [3.85]){box(root,[.17,.62,6.35],[x,.5,0],c.wall);for(let z=-3;z<3;z+=.7)cylinder(root,.018,.018,.55,[x,1.01,z],c.dark);box(root,[.06,.045,6.4],[x,1.29,0],c.dark);}
  box(root,[7.8,.65,.16],[0,.5,-3.1],c.wall);box(root,[7.9,.05,.05],[0,1.3,-3.1],c.dark);for(let x=-3.8;x<4;x+=.7)cylinder(root,.018,.018,.55,[x,1,-3.1],c.dark);
  const doorway=interactive(group(root,[-2.75,0,1.4]),"about","Back to the person behind this place");box(doorway,[1.5,2.6,1.2],[0,1.4,0],c.wall);box(doorway,[.85,1.95,.055],[0,1.13,.64],c.wood);sign(doorway,"D / Y",[0,1.75,.68],.5,.17,c.wood,c.cream);sphere(doorway,[.045,.045,.045],[.28,1,.7],c.cream);
  const bench=group(root,[.1,0,.4]);box(bench,[2.5,.13,.72],[0,.64,0],c.wood);box(bench,[2.5,.7,.11],[0,1.02,-.32],c.wood);for(const x of [-1,1])box(bench,[.08,.61,.58],[x,.33,0],c.dark);box(bench,[.7,.08,.65],[-.55,.75,.01],c.rust,.04);
  const scope=interactive(group(root,[2.35,.2,-1.22]),"lab","Look into the orbit experiment");for(let i=0;i<3;i++){const a=i*Math.PI*2/3;tube(scope,[[Math.sin(a)*.53,0,Math.cos(a)*.53],[0,1.25,0]],.027,c.dark);}const barrel=cylinder(scope,.15,.19,1.05,[0,1.4,0],c.cream);barrel.rotation.z=-.85;const lens=cylinder(scope,.15,.15,.035,[.39,1.75,0],c.teal);lens.rotation.z=-.85;
  plant(root,[-3.2,.2,-2.2],1.8);plant(root,[3.1,.2,2.1],1.3);plant(root,[-1.8,.2,-2.5],1.1);
  const lightWire=[[-3.8,2.95,-2.6],[-1.7,2.35,-2.6],[1.2,2.36,-2.6],[3.8,2.95,-2.6]];tube(root,lightWire,.016,c.dark);
  for(const x of [-3.8,3.8])cylinder(root,.025,.025,2.8,[x,1.6,-2.6],c.dark);
  const bulbs:T.Mesh[]=[];for(let i=0;i<11;i++){const x=-3.5+i*.7,y=2.28+(x*x)*.045;const bulb=new T.Mesh(new T.SphereGeometry(.062,10,8),new T.MeshBasicMaterial({color:c.amber}));bulb.position.set(x,y,-2.6);root.add(bulb);bulbs.push(bulb);}
  const glow=new T.PointLight(c.amber,8,8,2);glow.position.set(0,2.2,-1.5);root.add(glow);
  const skyline=group(root,[0,-.7,-7]);for(let i=0;i<15;i++){const x=-10+i*1.4,h=.7+(i*13%7)*.42;box(skyline,[.96,h,.8],[x,h/2,0],i%2?"#3d5552":"#4a6059",0);for(let j=0;j<3;j++)box(skyline,[.11,.16,.015],[x-.2,.3+j*.55,.41],new T.MeshBasicMaterial({color:c.amber}),0);}
  const starPositions=new Float32Array(90*3);for(let i=0;i<90;i++){starPositions[i*3]=-14+(i*.618%1)*28;starPositions[i*3+1]=3+(i*.317%1)*8;starPositions[i*3+2]=-12+(i*.719%1)*5;}
  const stars=new T.Points(new T.BufferGeometry().setAttribute("position",new T.BufferAttribute(starPositions,3)),new T.PointsMaterial({color:c.cream,size:.035,transparent:true,opacity:.75}));root.add(stars);
  const postcard=interactive(group(root,[.55,.75,.42]),"contact","Send a note from the rooftop");box(postcard,[.5,.016,.29],[0,0,0],c.cream);sign(postcard,"SAY HELLO",[0,.01,0],.43,.14).rotation.x=-Math.PI/2;
  return {root,camera:[9,7,11],target:[0,1.2,0],anchors:[{name:"A quiet hello",action:"contact",point:new T.Vector3(.55,1.35,.4)},{name:"Orbit experiment",action:"lab",point:new T.Vector3(2.35,2.3,-1.2)}],update(time,delta,options){stars.visible=options.weather!=="day";stars.material.opacity=options.motion?.65+Math.sin(time*.3)*.12:.7;glow.intensity=options.weather==="day"?1:8;}};
}
