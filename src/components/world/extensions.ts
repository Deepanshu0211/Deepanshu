import * as T from "three";
import { skills } from "./content";
import { type Area, colors as c, box, cylinder, group, sign, plant, interactive, sphere, tube } from "./objects";
export function createLibrary():Area{
 const root=new T.Group();
 for(const [x,z,length] of [[-3.55,0,5.2],[3.55,-1.7,2.1]] as number[][]){
  const shelf=group(root,[x,0,z]);shelf.rotation.y=x<0?Math.PI/2:-Math.PI/2;
  box(shelf,[length,2.85,.55],[0,1.45,0],c.edge);
  for(const y of [.25,.9,1.55,2.2,2.85])box(shelf,[length+.1,.07,.7],[0,y,.06],c.wood);
  for(let row=0;row<4;row++)for(let i=0;i<Math.floor(length/.22);i++){
   const skill=skills[(row*7+i)%skills.length];const book=interactive(group(shelf,[-length/2+.15+i*.22,.56+row*.65,.25]),`skill:${skill}`,`Read · ${skill}`);
   box(book,[.17,.48,.28],[0,0,0],[c.sage,c.cream,c.rust,c.teal][(i+row)%4]);
   sign(book,skill,[0,.07,.147],.145,.06,[c.sage,c.cream,c.rust,c.teal][(i+row)%4],c.edge);
  }
 }
 const table=group(root,[0,0,.3]);box(table,[2.5,.12,1.6],[0,.9,0],c.wood);for(const x of [-1,1])for(const z of [-.6,.6])box(table,[.08,.85,.08],[x,.44,z],c.edge);
 const journal=interactive(group(table,[0,1,.1]),"experience","Read field notes · experience");box(journal,[.64,.07,.8],[0,0,0],c.rust);sign(journal,"FIELD NOTES",[0,.041,0],.55,.2,c.rust,c.cream).rotation.x=-Math.PI/2;
 const letter=interactive(group(table,[-.7,.99,-.2]),"about","Read a letter from Deepanshu");box(letter,[.5,.015,.65],[0,0,0],c.cream);sign(letter,"HELLO, WORLD",[0,.01,0],.45,.18).rotation.x=-Math.PI/2;
 plant(root,[2.7,0,2.5],1.8);sign(root,"THE KNOWLEDGE LIBRARY",[0,2.8,3.12],3.6,.32,c.wall,c.cream).rotation.y=Math.PI;
 return {root,camera:[0,1.65,0],target:[0,1,0],anchors:[]};
}
export function createWorkshop():Area{
 const root=new T.Group(),bench=group(root,[0,0,-2.25]);box(bench,[3.5,.12,1.2],[0,.94,0],c.wood);
 for(const x of [-1.5,1.5])box(bench,[.12,.88,.95],[x,.47,0],c.dark);
 const experiment=interactive(group(bench,[0,1.02,0]),"lab","Run the orbit experiment");cylinder(experiment,.5,.53,.12,[0,.06,0],c.dark);sphere(experiment,[.16,.16,.16],[0,.5,0],c.amber);
 const orbit=group(experiment,[0,.5,0]);const ring=new T.Mesh(new T.TorusGeometry(.48,.014,8,64),new T.MeshStandardMaterial({color:c.cream}));ring.rotation.x=Math.PI/2;orbit.add(ring);sphere(orbit,[.065,.065,.065],[.48,0,0],c.teal);
 sign(root,"THE DEVELOPER WORKSHOP",[0,2.9,-3.12],3.8,.3,c.wall,c.cream);
 const pc=interactive(group(root,[1.5,.95,1.2]),"lab","Inspect the prototype workstation");box(root,[2.4,.1,1.5],[1.5,.92,1.2],c.wood);for(const x of [.5,2.5])box(root,[.1,.88,1.3],[x,.45,1.2],c.edge);
 box(pc,[.65,.86,.7],[0,.43,0],c.dark);const fan=group(pc,[0,.45,.36]);for(let i=0;i<5;i++){const blade=box(fan,[.1,.23,.018],[0,.1,0],c.sage);blade.rotation.z=i*Math.PI*2/5;}
 cylinder(pc,.045,.045,.03,[0,.45,.38],c.edge).rotation.x=Math.PI/2;
 for(let i=0;i<4;i++){const g=group(bench,[-1.2+i*.23,1.04,.2]);cylinder(g,.055,.055,.18,[0,.09,0],[c.teal,c.rust,c.sage,c.cream][i]);}
 tube(root,[[1.6,.97,1.1],[2.3,.98,1.5],[2.7,.7,1.6],[2.7,.06,.8]],.014,c.dark);plant(root,[-2.8,0,-2],1.5);
 return {root,camera:[0,1.65,0],target:[0,1,0],anchors:[],update(time,dt,options){if(options.motion){orbit.rotation.y=time*.6;fan.rotation.z=time*3;}}};
}
