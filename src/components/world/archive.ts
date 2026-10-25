import * as T from "three";
import { projects } from "./content";
import { type Area, colors as c, box, cylinder, group, sign, plant, interactive, sphere, tube } from "./objects";

export function createArchive(): Area {
  const root=new T.Group();box(root,[8.5,.3,6.8],[0,-.15,0],c.edge);box(root,[8.3,.07,6.6],[0,.045,0],c.wood);
  
  sign(root,"THE PROJECT ARCHIVE",[0,3.5,-3.15],4,.4,c.wall,c.cream);
  sign(root,"SMALL IDEAS. REAL-WORLD WORK.",[0,3.02,-3.14],3,.18,c.wall,c.cream);
  const anchors:Area["anchors"]=[]; const rotators:T.Group[]=[];
  projects.forEach((project,i)=>{
    const x=i%2===0?-2:1.75,z=i<2?-1.8:1.32;
    const display=interactive(group(root,[x,0,z]),`project:${project.type}`,`Explore ${project.name}`);
    box(display,[2.35,.95,1.72],[0,.55,0],i%2?"#2f4f43":"#8a5a36",.06);
    box(display,[2.5,.12,1.87],[0,1.08,0],c.cream);
    sign(display,project.name,[0,.7,.869],1.8,.22,i%2?"#2f4f43":"#8a5a36",c.cream);
    sign(display,"0"+(i+1)+" / OPEN PROJECT",[0,.37,.87],1.75,.12,i%2?"#2f4f43":"#8a5a36",c.cream);
    const miniature=group(display,[0,1.17,0]);
    if(i===0){
      box(miniature,[1.72,.08,1.14],[0,.04,0],c.sage);
      for(let j=0;j<6;j++){const h=.2+(j%3)*.16;box(miniature,[.22,h,.24],[-.6+(j%3)*.52,h/2+.08,-.29+Math.floor(j/3)*.55],j%2?c.cream:c.rust);}
      tube(miniature,[[-.8,.1,0],[0,.1,-.1],[.8,.1,.1]],.028,c.teal);
      const beacon=cylinder(miniature,.025,.025,.9,[0,.53,0],c.rust);sphere(beacon,[.14,.14,.14],[0,.49,0],c.rust);
    }else if(i===1){
      for(let j=0;j<3;j++){const folder=group(miniature,[-.45+j*.45,.3,j*.07]);box(folder,[.47,.6,.1],[0,0,0],[c.rust,c.sage,c.teal][j]);box(folder,[.22,.1,.1],[-.11,.33,0],[c.rust,c.sage,c.teal][j]);sign(folder,["IMG","DOC","CODE"][j],[0,0,.055],.36,.1,[c.rust,c.sage,c.teal][j],c.cream);}
    }else if(i===2){
      box(miniature,[1.46,.55,.73],[0,.3,0],c.cream);box(miniature,[1.64,.12,.9],[0,.64,0],c.rust);box(miniature,[.27,.43,.04],[0,.24,.39],c.teal);for(const x of [-.5,.5])box(miniature,[.22,.22,.04],[x,.36,.39],c.teal);
      const roof=new T.Mesh(new T.ConeGeometry(.56,.4,4),new T.MeshStandardMaterial({color:c.rust}));roof.rotation.y=Math.PI/4;roof.position.y=.88;miniature.add(roof);
    }else{
      const sculpture=group(miniature,[0,.6,0]);const knot=new T.Mesh(new T.TorusKnotGeometry(.37,.095,72,10),new T.MeshStandardMaterial({color:c.teal,metalness:.25,roughness:.36}));sculpture.add(knot);rotators.push(sculpture);cylinder(miniature,.47,.48,.09,[0,.04,0],c.dark);
    }
    anchors.push({name:project.name,action:`project:${project.type}`,point:new T.Vector3(x,2.05,z)});
  });
  plant(root,[3.35,.08,-2.4],1.5);
  const lab=interactive(group(root,[-3.99,2,.25]),"lab","Play with the orbit experiment");lab.rotation.y=Math.PI/2;box(lab,[1.3,.95,.08],[0,0,0],c.edge);sign(lab,"EXPERIMENT 001",[0,.19,.06],1.12,.18,c.dark,c.cream);sign(lab,"ORBITS IN MOTION",[0,-.19,.06],1.12,.13,c.dark,c.sage);
  return {root,camera:[9,7.8,11],target:[0,1.2,0],anchors,update(time,delta,options){rotators.forEach(g=>g.rotation.y=options.motion?time*.28:0);}};
}
