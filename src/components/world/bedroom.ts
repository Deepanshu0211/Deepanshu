import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { cushion, mesh, lathe, rod, ceilingFan } from "./furniture";
import { projects, skills } from "./content";
import { type Area, colors as c, box, sphere, cylinder, tube, group, sign, plant, interactive, canvasTexture, disposeObject } from "./objects";
import { fabric, ceramic, metal, emissive, floorboards, rugTexture, weave, windify } from "./materials";


export function createBedroom(): Area {
  const root=new T.Group(); let chairTurn=0; let alive=true, drawerOpen=false, petUntil=0, typingUntil=0;
  const plastic=new T.MeshPhysicalMaterial({color:"#1f1a17",roughness:.42,clearcoat:.3,clearcoatRoughness:.35});
  const aluminium=metal("#b3b6b2",.32), brass=metal("#a88a5c",.34), chrome=metal("#d6d8d6",.18);
  box(root,[8.3,.34,6.8],[0,-.2,0],c.edge,.1);
  // Oiled oak floorboards, staggered and bevelled, under a light clear finish.
  const floor=new T.MeshPhysicalMaterial({color:"#c09a76",map:floorboards(),bumpMap:floorboards(),bumpScale:1.4,roughness:.55,clearcoat:.22,clearcoatRoughness:.45});floor.userData.project=2.4;
  box(root,[7.92,.06,6.5],[0,.015,0],floor,0);
  box(root,[.16,4.4,6.6],[-4,2.15,0],c.wall);
  // A real opening in the back wall, with three-dimensional mullions and city beyond it.
  box(root,[8,1.2,.17],[0,.58,-3.25],c.wall);
  box(root,[8,.57,.17],[0,4.04,-3.25],c.wall);
  box(root,[.42,2.95,.17],[-3.79,2.44,-3.25],c.wall);
  box(root,[4.3,2.95,.17],[1.86,2.44,-3.25],c.wall);
  box(root,[.12,.15,6.5],[-3.88,.18,0],c.cream);
  box(root,[8,.15,.12],[0,.18,-3.12],c.cream);
  box(root,[.21,.15,6.7],[-4,4.36,0],c.edge);
  box(root,[8.2,.15,.24],[0,4.36,-3.25],c.edge);
  const windowGroup=interactive(group(root,[-1.94,2.48,-3.18]),"weather","Change the weather");
  const glassMat=new T.MeshPhysicalMaterial({color:"#d6e6e4",transparent:true,opacity:.16,roughness:.03,depthWrite:false,specularIntensity:1});
  box(windowGroup,[3.28,2.42,.025],[0,0,-.02],glassMat,0).castShadow=false;
  for(const x of [-1.68,0,1.68])box(windowGroup,[.095,2.68,.18],[x,0,0],c.edge);
  for(const y of [-1.34,0,1.34])box(windowGroup,[3.45,.085,.18],[0,y,0],c.edge);
  box(windowGroup,[3.7,.14,.54],[0,-1.37,.12],c.cream);
  const curtainMaterial=windify(fabric("#dccfb4",.95),{kind:"cloth",top:1.35,height:2.7,amp:.012});curtainMaterial.side=T.DoubleSide;
  const curtains:T.Mesh[]=[];
  for(const x of [-3.46,-.42]) {const geometry=new T.PlaneGeometry(.42,2.7,28,14);const a=geometry.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,Math.sin(a.getX(i)*52)*.042+Math.sin(a.getX(i)*17+a.getY(i)*.8)*.012);geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,curtainMaterial);mesh.position.set(x,2.46,-2.99);mesh.castShadow=true;mesh.userData.dynamic=true;root.add(mesh);curtains.push(mesh);}
  cylinder(root,.022,.022,3.72,[-1.94,3.9,-2.97],brass).rotation.z=Math.PI/2;
  for(const x of [-3.82,-.06])sphere(root,[.04,.04,.04],[x,3.9,-2.97],brass);
  // Workstation: oiled wooden top, powder-coated legs, working drawers, and a two-screen workspace.
  const desk=group(root,[1.25,0,-1.93]); desk.scale.y=.7;
  const top=group(root,[1.25,1.057,-1.93]); // unscaled props that stand on the desk
  box(desk,[4.2,.16,1.44],[0,1.43,0],c.wood,.05);
  for(const x of [-1.87,1.87])for(const z of [-.52,.52])box(desk,[.09,1.34,.09],[x,.71,z],c.dark);
  box(desk,[1.01,1.23,1.13],[1.22,.7,0],c.cream);
  for(let i=0;i<2;i++){box(desk,[.95,.32,.035],[1.22,.29+i*.36,.59],c.wood);box(desk,[.24,.028,.055],[1.22,.29+i*.36,.63],aluminium);}
  const drawer=interactive(group(desk,[1.22,1.1,0]),"drawer","Open the secret drawer");
  box(drawer,[.95,.32,.055],[0,0,.61],c.wood);box(drawer,[.25,.025,.08],[0,0,.66],aluminium);box(drawer,[.86,.035,1.04],[0,-.13,0],c.edge);
  sign(drawer,"KEEP MAKING",[0,-.095,.09],.65,.24).rotation.x=-Math.PI/2;
  const note=interactive(group(desk,[-1.35,1.54,.38]),"about","A note from Deepanshu"); const paper=box(note,[.4,.009,.36],[0,0,0],"#d8bd73",0);paper.rotation.y=-.12;const noteText=sign(note,"hello, world",[0,.012,0],.38,.23,"#d8bd73");noteText.rotation.x=-Math.PI/2;
  const screenTexture=canvasTexture(ctx=>{
    ctx.fillStyle="#1e1a17";ctx.fillRect(0,0,768,440);ctx.fillStyle="#2e2722";ctx.fillRect(0,0,768,47);ctx.fillStyle="#e3d6bc";ctx.font="20px monospace";ctx.fillText("deepanshu / workspace",25,31);
    for(const [i,color] of ["#c97b5b","#d7b46a","#88a77d"].entries()){ctx.fillStyle=color;ctx.beginPath();ctx.arc(700+i*20,24,6,0,7);ctx.fill();}
    ctx.fillStyle="#e0a526";ctx.font="22px monospace";ctx.fillText("~/ selected-work",30,89);
    projects.forEach((p,i)=>{const y=123+i*69;ctx.fillStyle=i%2?"#29231f":"#25201c";ctx.fillRect(24,y,720,56);ctx.fillStyle="#e3d6bc";ctx.font="23px monospace";ctx.fillText("0"+(i+1)+"  "+p.name,42,y+35);ctx.fillStyle="#c2b191";ctx.font="15px monospace";ctx.fillText(p.stack.slice(0,2).join(" / "),365,y+35);});
    ctx.fillStyle="#c2b191";ctx.font="15px monospace";ctx.fillText("click to sit down and use the computer",30,423);
  },768,440);
  const monitor=interactive(group(desk,[-.35,1.52,-.3]),"computer","Sit down and use the computer");
  box(monitor,[.55,.04,.36],[0,0,.02],aluminium,.02);box(monitor,[.09,.4,.04],[0,.18,-.08],aluminium,.015);box(monitor,[1.75,1.1,.07],[0,.83,0],plastic,.03);box(monitor,[.6,.4,.06],[0,.83,-.06],plastic,.03);
  const screen=new T.Mesh(new T.PlaneGeometry(1.67,.99),new T.MeshBasicMaterial({map:screenTexture,color:new T.Color(1.2,1.2,1.2)}));screen.position.set(0,.85,.037);monitor.add(screen);
  const deskEye=group(root,[.9,1.5,-1.38]);
  const code=canvasTexture(ctx=>{ctx.fillStyle="#211c19";ctx.fillRect(0,0,360,480);ctx.font="19px monospace";["// a little corner", "// of the internet.","", "const developer = {", "  name: 'Deepanshu',", "  builds: [", "    'web',", "    'mobile',", "    'desktop'", "  ],", "  curiosity: true", "};", "", "> keep making things_"].forEach((line,i)=>{ctx.fillStyle=i<2?"#9c8b76":i>12?"#d6ae73":"#e3d6bc";ctx.fillText(line,18,36+i*29);});},360,480);
  const second=interactive(group(desk,[-1.63,1.55,-.28]),"lab","A small coding experiment");second.rotation.y=.25;box(second,[.75,1.05,.06],[0,.74,0],plastic,.025);box(second,[.07,.4,.04],[0,.2,-.04],aluminium,.015);box(second,[.42,.035,.3],[0,0,0],aluminium,.015);const coding=new T.Mesh(new T.PlaneGeometry(.71,.99),new T.MeshBasicMaterial({map:code,color:new T.Color(1.15,1.15,1.15)}));coding.position.set(0,.74,.032);second.add(coding);
  const keyboard=interactive(group(desk,[-.34,1.56,.43]),"keyboard","Type a little hello");box(keyboard,[1.12,.055,.4],[0,0,0],metal("#8f938f",.38),.02);
  const keys=new T.InstancedMesh(new RoundedBoxGeometry(.071,.037,.062,2,.01),new T.MeshStandardMaterial({color:"#ffffff",roughness:.55}),52);keys.castShadow=true;keyboard.add(keys);
  function keyMatrix(i:number,down=0){const col=i%13,row=Math.floor(i/13);return new T.Matrix4().makeTranslation(-.49+col*.081,.048-down,-.14+row*.087);}
  for(let i=0;i<52;i++){keys.setMatrixAt(i,keyMatrix(i));keys.setColorAt(i,new T.Color(i===0?c.rust:i%13===12?c.sage:c.cream));}
  box(desk,[.5,.012,.52],[.52,1.53,.4],fabric("#2a231e",.95),.01);sphere(desk,[.06,.048,.1],[.5,1.59,.4],new T.MeshPhysicalMaterial({color:"#e9e4d8",roughness:.35,clearcoat:.6}));
  tube(desk,[[-.4,1.54,.15],[-.7,1.55,-.1],[-.85,1.52,-.7],[-.85,.1,-.75]],.01,plastic);
  // Architect's lamp: weighted base, twin spring arms, a spun-metal shade and a real spot of warm light.
  const lamp=interactive(group(top,[1.58,0,-.31]),"lamp","Switch the desk lamp");const lampPaint=new T.MeshPhysicalMaterial({color:c.sage,roughness:.45,clearcoat:.5,clearcoatRoughness:.3});
  lathe(lamp,[[0,0],[.12,0],[.125,.012],[.11,.032],[.03,.04],[0,.04]],[0,0,0],lampPaint);
  const elbow=[.07,.5,0],head=[-.32,.66,0];
  for(const z of [-.014,.014]){rod(lamp,[0,.04,z],[elbow[0],elbow[1],z],.007,chrome);rod(lamp,[elbow[0],elbow[1],z],[head[0],head[1],z],.007,chrome);}
  for(const p of [[0,.045,0],elbow,head])cylinder(lamp,.018,.018,.05,p,lampPaint,20).rotation.x=Math.PI/2;
  tube(lamp,[[.012,.12,.02],[.05,.3,.02],[.065,.46,.02]],.004,brass);
  const shade=group(lamp,[head[0],head[1],0]);shade.rotation.z=.55;
  lathe(shade,[[.035,.02],[.05,0],[.09,-.07],[.16,-.2],[.165,-.205]],[0,0,0],lampPaint);
  const shadeInner=new T.MeshStandardMaterial({color:"#f3e7cf",emissive:"#ffc77d",emissiveIntensity:.9,side:T.BackSide,roughness:.6});lathe(shade,[[.034,.016],[.048,-.004],[.088,-.072],[.158,-.2]],[0,0,0],shadeInner);
  const bulb=new T.Mesh(new T.SphereGeometry(.05,20,14),emissive(c.amber,3.2));bulb.position.set(0,-.1,0);shade.add(bulb);
  const lampLight=new T.SpotLight(c.amber,9,5,.85,.65,2);lampLight.position.set(0,-.1,0);shade.add(lampLight);lampLight.target.position.set(-.22,-.9,0);shade.add(lampLight.target);
  lampLight.castShadow=true;lampLight.shadow.mapSize.set(512,512);lampLight.shadow.bias=-.0006;lampLight.shadow.radius=4;
  const lampFill=new T.PointLight(c.amber,2.2,3.2,2);lampFill.position.set(head[0],head[1]-.12,.05);lamp.add(lampFill);
  // Glazed stoneware mug with a coffee surface and a pulled handle.
  const cup=group(top,[.86,0,.29]);const glaze=ceramic(c.cream,.28);
  lathe(cup,[[0,0],[.075,0],[.085,.01],[.09,.15],[.094,.155],[.084,.157],[.08,.012],[0,.012]],[0,0,0],glaze);
  cylinder(cup,.078,.078,.004,[0,.125,0],new T.MeshPhysicalMaterial({color:"#2b1a10",roughness:.15,clearcoat:1}));
  const handle=mesh(cup,new T.TorusGeometry(.045,.012,12,24,Math.PI*1.25),[.095,.08,0],glaze);handle.rotation.z=-Math.PI*.62;
  // Over-ear headphones resting on their cups.
  const headphones=interactive(group(top,[.99,0,-.3]),"sound","Toggle quiet rain audio");const matte=new T.MeshStandardMaterial({color:"#24201c",roughness:.55});const leather=new T.MeshPhysicalMaterial({color:"#2b2622",roughness:.6,sheen:.6,sheenColor:"#6b6b66"});
  for(const x of [-.16,.16]){const cupMesh=cylinder(headphones,.075,.075,.045,[x,.08,0],matte,32);cupMesh.rotation.z=Math.PI/2;const pad=mesh(headphones,new T.TorusGeometry(.058,.02,14,32),[x*.83,.08,0],leather);pad.rotation.y=Math.PI/2;}
  const band=mesh(headphones,new T.TorusGeometry(.17,.012,12,40,Math.PI),[0,.1,0],matte);band.scale.y=1.1;
  for(const x of [-.17,.17])rod(headphones,[x,.08,0],[x,.13,0],.006,aluminium);
  // Original sleepy companion: a little seed spirit with leaf ears and terracotta feet.
  const velvet=(color:string)=>new T.MeshPhysicalMaterial({color,roughness:.88,sheen:1,sheenRoughness:.45,sheenColor:new T.Color(color).multiplyScalar(1.5)});
  const pet=interactive(group(desk,[-.92,1.61,.38]),"pet","Say hello to Pip");sphere(pet,[.16,.12,.13],[0,.06,0],velvet("#d0ba8b"));sphere(pet,[.105,.1,.1],[.1,.11,.015],velvet("#e7d4a6"));
  for(const x of [.045,.14]){const ear=sphere(pet,[.033,.085,.021],[x,.24,.005],velvet(c.sage));ear.rotation.z=x<.1?.3:-.3;}
  const eye=new T.MeshPhysicalMaterial({color:"#1d1a17",roughness:.1,clearcoat:1});for(const x of [.07,.145])sphere(pet,[.012,.018,.008],[x,.12,.108],eye,12);
  sphere(pet,[.044,.026,.05],[-.06,-.025,.08],ceramic(c.rust,.5));sphere(pet,[.044,.026,.05],[.06,-.025,.08],ceramic(c.rust,.5));
  // Seat, rug and bedding add tactile softness to the cutaway.
  cylinder(root,.035,.035,.52,[.6,.45,-.2],chrome);
  const chair=interactive(group(root,[.6,0,-.2]),"chair","Turn the desk chair");chair.scale.y=.8;const upholstery=fabric(c.rust,.9);
  mesh(chair,cushion(.83,.17,.74,.35,0,.07),[0,.8,0],upholstery);mesh(chair,cushion(.84,.78,.16,.12,0,.07),[0,1.22,.37],upholstery).rotation.x=-.06;
  box(chair,[.5,.05,.4],[0,.69,0],plastic,.02);rod(chair,[0,.95,.3],[0,.72,.12],.025,plastic);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;tube(chair,[[0,.23,0],[Math.sin(a)*.42,.14,Math.cos(a)*.42]],.03,chrome);sphere(chair,[.055,.055,.04],[Math.sin(a)*.42,.11,Math.cos(a)*.42],plastic);}
  const rug=new T.MeshStandardMaterial({map:rugTexture(),bumpMap:rugTexture(),bumpScale:2.2,roughness:1});
  box(root,[3.6,.018,2.36],[.23,.087,.92],rug,.008);
  const tassel=fabric(c.cream,1);for(let i=0;i<28;i++)for(const z of [-.29,2.12])box(root,[.018,.006,.11],[-1.45+i*.12,.083,z],tassel,0);
  const bed=group(root,[-2.79,0,.65]);box(bed,[1.92,.39,3.5],[0,.39,0],c.wood,.05);
  mesh(bed,cushion(1.78,.25,3.38,.12,0,.09),[0,.7,0],fabric("#f1eadb",.95));
  mesh(bed,cushion(1.86,.2,2.22,.42,.011,.09),[0,.89,.56],fabric("#34467a",.92));
  box(bed,[1.96,1.15,.13],[0,.63,-1.78],c.wood,.05);
  const pillow=mesh(bed,cushion(1.2,.17,.6,.95,.004,.08),[0,.94,-1.12],fabric("#e3d6bc",.95));pillow.rotation.x=-.12;
  mesh(bed,cushion(.62,.12,.42,.9,0,.06),[.35,.99,-.84],fabric(c.sage,.92)).rotation.set(-.25,.18,.06);
  mesh(bed,cushion(1.9,.07,.52,.3,.006,.03),[0,1.0,1.32],fabric(c.rust,.92));
  // Floating knowledge shelf: every spine is a discoverable technology.
  const shelf=group(root,[1.95,2.38,-3]);
  for(const y of [0,.76]){box(shelf,[3.55,.07,.42],[0,y,0],c.wood,.015);for(const x of [-1.42,1.42])box(shelf,[.035,.22,.32],[x,y-.15,0],c.dark,.008);}
  const pages=fabric("#efe7d4",.95);
  skills.slice(0,8).forEach((skill,i)=>{const x=-1.5+i*.22;const b=interactive(group(shelf,[x,.24,.01]),`skill:${skill}`,skill);const h=.37+(i%3)*.06;b.position.y=.035+h/2;if(i===5)b.rotation.z=-.06;const cover=[c.rust,c.cream,c.sage,c.teal][i%4];box(b,[.16,h,.3],[0,0,0],cover,.012);box(b,[.13,.006,.27],[0,h/2+.001,-.005],pages,0);sign(b,skill,[0,0,.152],.13,.033,cover,i%4===1?c.edge:c.cream);box(b,[.13,.012,.004],[0,-h/2+.05,.153],brass,0);});
  plant(shelf,[1.32,.035,0],.7);plant(shelf,[-1.4,.795,0],.55);
  const notebook=interactive(group(root,[2.82,1.078,-1.54]),"experience","Open the field notes");box(notebook,[.45,.04,.55],[0,0,0],c.rust,.01);box(notebook,[.43,.03,.53],[.006,-.002,0],pages,0);const nt=sign(notebook,"FIELD NOTES",[0,.022,0],.4,.12,c.rust,c.cream);nt.rotation.x=-Math.PI/2;
  sign(shelf,"THINGS I AM LEARNING",[.32,.92,.08],1.55,.18,c.cream,c.edge);
  const duck=interactive(group(shelf,[.88,.79,0]),"duck","Rubber-duck debugging");
  const substitute=group(duck,[0,0,0]);sphere(substitute,[.18,.13,.13],[0,.12,0],ceramic("#daba62",.3));sphere(substitute,[.09,.09,.09],[.11,.26,0],ceramic("#daba62",.3));box(substitute,[.11,.04,.08],[.2,.25,.03],ceramic(c.rust,.4));
  const duckTimer=window.setTimeout(()=>new GLTFLoader().load("/models/duck.glb",gltf=>{if(!alive){disposeObject(gltf.scene);return;}const bounds=new T.Box3().setFromObject(gltf.scene);const size=bounds.getSize(new T.Vector3());gltf.scene.scale.setScalar(.4/Math.max(size.x,size.y,size.z));gltf.scene.rotation.y=.6;gltf.scene.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;}});duck.remove(substitute);disposeObject(substitute);duck.add(gltf.scene);},undefined,()=>{/* The procedural duck remains available. */}),700);
  // Personal memory corner: a framed print behind glass, with a hand-lettered caption on the mount.
  const frame=interactive(group(root,[-3.84,2.56,.42]),"about","The person behind the pixels");frame.rotation.y=Math.PI/2;
  box(frame,[1.18,1.44,.05],[0,0,0],c.edge,.012);box(frame,[1.06,1.32,.02],[0,0,.03],fabric("#ece3cf",1),0);
  const print=new T.Mesh(new T.PlaneGeometry(.86,.86),new T.MeshStandardMaterial({color:"#b8a98e",roughness:.75}));print.position.set(0,.13,.042);frame.add(print);
  sign(frame,"STAY CURIOUS  ·  KEEP BUILDING",[0,-.46,.042],.86,.07,"#ece3cf",c.edge);
  const pane=new T.Mesh(new T.PlaneGeometry(1.06,1.32),new T.MeshPhysicalMaterial({color:"#ffffff",transparent:true,opacity:.07,roughness:.02,depthWrite:false}));pane.position.z=.052;frame.add(pane);
  const printTimer=window.setTimeout(()=>new T.TextureLoader().load("/images/polaroid-sunset.jpg",map=>{if(!alive){map.dispose();return;}map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;const m=print.material as T.MeshStandardMaterial;m.map=map;m.color.set("#ffffff");m.needsUpdate=true;}),900);
  const envelope=interactive(group(root,[-3.79,1.86,1.87]),"contact","Leave a message");envelope.rotation.y=Math.PI/2;box(envelope,[.65,.42,.03],[0,0,0],fabric("#efe6d2",1),.006);sign(envelope,"SAY HELLO",[0,0,.017],.56,.13,"#efe6d2");
  plant(root,[3.22,.1,1.95],1.8);
  // Everyday things: a steel almirah, a slow ceiling fan, slippers by the bed and a cane laundry basket.
  const almirah=group(root,[3.6,0,-.45]);almirah.rotation.y=-Math.PI/2;const enamel=new T.MeshPhysicalMaterial({color:"#b8b39d",roughness:.38,metalness:.35,clearcoat:.7,clearcoatRoughness:.25});
  box(almirah,[1.15,2.05,.58],[0,1.07,0],enamel,.02);box(almirah,[1.17,.06,.6],[0,.03,0],metal("#3a3d3b",.4),.01);
  for(const x of [-.285,.285])box(almirah,[.555,1.92,.012],[x,1.08,.292],enamel,.008);
  for(const x of [-.035,.035])box(almirah,[.02,.32,.03],[x,1.12,.31],chrome,.008);sphere(almirah,[.03,.03,.012],[.08,1.32,.302],chrome,16);
  box(almirah,[.9,.16,.4],[0,2.2,0],fabric("#6d7b55",.95),.04);box(almirah,[.5,.12,.35],[.15,2.34,0],fabric(c.rust,.95),.03);
  const fan=ceilingFan(root,[-1.2,4.36,.6]);
  const slipper=fabric("#2d3a6b",.9);for(const [x,a] of [[-1.62,.2],[-1.42,-.15]] as [number,number][]){const s=box(root,[.11,.035,.27],[x,.06,2.6],slipper,.03);s.rotation.y=a;}
  const cane=new T.MeshStandardMaterial({color:"#b48a55",map:weave(),bumpMap:weave(),bumpScale:2,roughness:.85});cane.userData.project=.25;lathe(root,[[0,0],[.2,0],[.24,.52],[.25,.55],[.23,.55],[.19,.04],[0,.04]],[-3.45,.05,-2.6],cane,32);
  const clock=group(root,[2.75,2.78,-3.07]);box(clock,[.66,.27,.06],[0,0,-.035],plastic,.02);const clockFace=new T.Mesh(new T.PlaneGeometry(.58,.21),new T.MeshBasicMaterial({map:canvasTexture(()=>{},512,128),color:new T.Color(1.6,1.6,1.6)}));clock.add(clockFace);let clockMinute="";
  // A linen-shaded floor lamp and a small book pile beside the bed.
  lathe(root,[[0,0],[.25,0],[.27,.02],[.24,.06],[.03,.07],[0,.07]],[-1.58,.08,2.15],brass);rod(root,[-1.58,.15,2.15],[-1.58,1.45,2.15],.016,brass);
  const linen=fabric("#e8dcc0",1);linen.side=T.DoubleSide;linen.emissive=new T.Color("#ffb766");linen.emissiveIntensity=.35;
  lathe(root,[[.26,0],[.4,-.4]],[-1.58,1.81,2.15],linen,48);
  const floorGlow=new T.PointLight("#ffd09a",3.5,3.5,2);floorGlow.position.set(-1.58,1.5,2.15);root.add(floorGlow);
  for(let i=0;i<3;i++){const tilt=(i-1)*.12;const b=box(root,[.57,.09,.42],[-1.55,.175+i*.095,1.29],[c.rust,c.sage,c.teal][i],.012);b.rotation.y=tilt;const p=box(root,[.54,.07,.4],[-1.53,.175+i*.095,1.29],pages,0);p.rotation.y=tilt;}
  const anchors=[{name:"The workstation",action:"projects" as const,point:new T.Vector3(.9,2.91,-1.95)},{name:"Knowledge shelf",action:"skills" as const,point:new T.Vector3(2.15,3.58,-2.78)},{name:"A little about me",action:"about" as const,point:new T.Vector3(-3.25,2.95,.56)}];
  return {root,camera:[10,8.3,12],target:[0,1.45,0],anchors,seats:[{id:"computer",eye:deskEye,screen}],
    interact(action){if(action==="chair")chairTurn+=Math.PI/2;if(action==="drawer")drawerOpen=!drawerOpen;if(action==="pet")petUntil=performance.now()+2800;if(action==="keyboard")typingUntil=performance.now()+1500;},
    update(time,delta,options){
      chair.rotation.y=options.motion?T.MathUtils.damp(chair.rotation.y,chairTurn,7,delta):chairTurn;
      root.userData.drawerOpen=drawerOpen;root.userData.drawerZ=drawer.position.z;
      const on=options.lamp?1:0,k=options.motion?1-Math.exp(-delta*9):1;
      lampLight.intensity+=(9*on-lampLight.intensity)*k;lampFill.intensity+=(2.2*on-lampFill.intensity)*k;shadeInner.emissiveIntensity+=(.9*on+.02-shadeInner.emissiveIntensity)*k;bulb.visible=options.lamp;
      floorGlow.intensity=options.weather==="day"?1:3.5;linen.emissiveIntensity=options.weather==="day"?.12:.35;
      if(options.motion)fan.blades.rotation.y-=delta*4.2*(options.fan??1);
      const open=drawerOpen?.62:0;drawer.position.z=options.motion?T.MathUtils.damp(drawer.position.z,open,9,delta):open;
      pet.scale.y=options.motion?1+Math.sin(time*1.4)*.035:1;pet.rotation.y=options.motion&&performance.now()<petUntil?Math.sin(time*3)*.24:0;
      curtains.forEach((mesh,i)=>mesh.rotation.y=options.motion?Math.sin(time*.6+i)*.05:0);
      if(performance.now()<typingUntil&&options.motion){for(let i=0;i<52;i++)keys.setMatrixAt(i,keyMatrix(i,Math.sin(time*20+i)> .75?.023:0));keys.instanceMatrix.needsUpdate=true;}else if(typingUntil){for(let i=0;i<52;i++)keys.setMatrixAt(i,keyMatrix(i));keys.instanceMatrix.needsUpdate=true;typingUntil=0;}
      const now=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});if(now!==clockMinute){clockMinute=now;const map=clockFace.material.map!;const ctx=(map.image as HTMLCanvasElement).getContext("2d")!;ctx.fillStyle=c.dark;ctx.fillRect(0,0,512,128);ctx.fillStyle=c.amber;ctx.font="65px monospace";ctx.textAlign="center";ctx.fillText(now,256,87);map.needsUpdate=true;}
    },dispose(){alive=false;clearTimeout(duckTimer);clearTimeout(printTimer);}
  };
}
