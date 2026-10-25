import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.WORLD_TEST_URL || 'http://localhost:3100';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
await fs.mkdir('.next/world-qa',{recursive:true});
const canvas=page.locator('canvas');
const check=(name,details)=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details||{}));};
async function settle(){await page.waitForTimeout(900);}
try{
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForSelector('canvas[data-location="bedroom"]',{timeout:30000});await settle();
  const initial=await canvas.evaluate(el=>({...el.dataset}));assert(Number(initial.triangles)>10000);check('real WebGL bedroom',initial);
  await page.screenshot({path:'.next/world-qa/bedroom-1440.png'});
  // Exercise mesh raycasting, not the DOM annotations.
  await page.mouse.move(952,394);await page.waitForTimeout(200);
  const pointerLabel=await page.locator('span[aria-hidden="true"]').filter({hasText:/project|ImpactHub|Neatify|Gurukul|Demox/i}).allTextContents();
  await page.mouse.click(952,394);await page.waitForSelector('dialog[open]');
  assert.match(await page.locator('dialog').innerText(),/ImpactHub|Neatify|Gurukul|Demox|Made with intention/);check('raycast monitor opens real portfolio',{pointerLabel});
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
  await page.getByRole('button',{name:'Work 04',exact:true}).click();
  for(const name of ['ImpactHub','Neatify','Gurukul','Demox'])assert.match(await page.locator('dialog').innerText(),new RegExp(name));
  await page.getByRole('button',{name:'Neatify ↗',exact:true}).click();assert.equal(await page.locator('dialog a').filter({hasText:'GitHub'}).getAttribute('href'),'https://github.com/Deepanshu0211/Neatify');
  await page.screenshot({path:'.next/world-qa/project-panel.png'});await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.trim()),'Work 04');check('project details, source link, Escape and focus restoration');
  await page.getByRole('button',{name:'Say hello',exact:false}).first().click();assert.equal(await page.locator('dialog a[href^="mailto:"]').getAttribute('href'),'mailto:dy3239073@gmail.com');await page.keyboard.press('Escape');check('contact is immediately accessible');
  await page.getByTitle('Change the weather').click();assert.equal(await page.locator('[data-weather]').getAttribute('data-weather'),'day');await settle();await page.screenshot({path:'.next/world-qa/daylight.png'});check('weather changes');
  await page.getByRole('button',{name:'Sound off',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Sound on',exact:true}).getAttribute('aria-pressed'),'true');await page.getByRole('button',{name:'Sound on',exact:true}).click();check('audio starts on gesture and mutes');
  await page.getByLabel('Open accessibility and room settings').click();
  await page.getByRole('button',{name:'Open / close drawer'}).click();assert.match(await page.locator('[role="status"]').last().innerText(),/keep making/);
  await page.getByRole('button',{name:'Say hello to Pip'}).click();assert.match(await page.locator('[role="status"]').last().innerText(),/Pip/);
  await page.getByRole('button',{name:'Focus on the desk'}).click();await settle();await page.getByRole('button',{name:'Return to room'}).click();
  await page.getByRole('button',{name:'Desk lamp On',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Desk lamp Off',exact:true}).getAttribute('aria-pressed'),'false');
  await page.getByRole('button',{name:'Try the keyboard'}).click();assert.match(await page.locator('[role="status"]').last().innerText(),/hello, world/);
  await page.getByLabel('Open accessibility and room settings').click();check('drawer, companion, lamp, typing and camera controls');
  const nav=page.getByRole('navigation',{name:'World locations'});
  await nav.getByRole('button',{name:/Project archive/}).click();await page.waitForSelector('canvas[data-location="archive"]');await settle();await page.screenshot({path:'.next/world-qa/archive.png'});
  await page.getByRole('button',{name:'+ ImpactHub',exact:true}).click();assert.match(await page.locator('dialog').innerText(),/disaster-response/);await page.keyboard.press('Escape');check('lazy archive and project installations');
  await nav.getByRole('button',{name:/The rooftop/}).click();await page.waitForSelector('canvas[data-location="rooftop"]');await settle();await page.screenshot({path:'.next/world-qa/rooftop.png'});
  await page.getByRole('button',{name:'+ Orbit experiment',exact:true}).click();const range=page.getByRole('slider');await range.fill('112');assert.match(await page.locator('dialog').innerText(),/9.9s/);await page.keyboard.press('Escape');check('lazy rooftop and working orbital experiment');
  const roomStats=[];
  for(let i=0;i<3;i++){await nav.getByRole('button',{name:/The bedroom/}).click();await page.waitForSelector('canvas[data-location="bedroom"]');await page.waitForTimeout(1200);roomStats.push(await canvas.evaluate(el=>({geometries:Number(el.dataset.geometries),textures:Number(el.dataset.textures)})));await nav.getByRole('button',{name:/The rooftop/}).click();await page.waitForSelector('canvas[data-location="rooftop"]');}
  assert(roomStats.every(s=>s.geometries===roomStats[0].geometries&&s.textures===roomStats[0].textures));check('scene resources stable across repeated transitions',{roomStats});
  await nav.getByRole('button',{name:/The bedroom/}).click();await page.waitForSelector('canvas[data-location="bedroom"]');
  for(const [width,height] of [[1920,1080],[1280,900],[768,1024],[390,844],[320,740]]){
    await page.setViewportSize({width,height});await settle();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`.next/world-qa/bedroom-${width}.png`});
    await page.getByRole('button',{name:'Work 04',exact:true}).click();assert(await page.getByRole('button',{name:'Close information panel'}).isVisible());await page.keyboard.press('Escape');check(`responsive viewport ${width}`);
  }
  await page.getByRole('button',{name:'Prefer a simple portfolio?'}).click();assert.equal(await canvas.count(),0);assert(await page.locator('#portfolio-content').isVisible());assert.equal(await page.locator('#portfolio-content a[href^="/work/"]').count(),8);await page.reload();assert(await page.locator('#portfolio-content').isVisible());check('accessible mode disposes WebGL and persists');
  for(const route of ['/work/impact','/work/neatify','/work/gurukul','/work/demox','/Deepanshu-Yadav-Resume.pdf','/models/duck.glb','/robots.txt','/sitemap.xml']){const response=await context.request.get(base+route);assert.equal(response.status(),200,route);}
  check('all case study routes, résumé, model and SEO routes respond');
  const reduced=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});const quiet=await reduced.newPage();await quiet.goto(base);await quiet.waitForSelector('canvas[data-location]');assert.equal(await quiet.locator('[data-motion]').getAttribute('data-motion'),'off');await reduced.close();check('system reduced motion honored');
  const noGL=await browser.newContext();await noGL.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:original.call(this,type,...args);};});const fallback=await noGL.newPage();await fallback.goto(base);await fallback.getByText('The 3D room couldn’t open on this device.',{exact:false}).waitFor();assert(await fallback.locator('#portfolio-content').isVisible());await fallback.screenshot({path:'.next/world-qa/webgl-fallback.png'});await noGL.close();check('WebGL failure exposes complete content');
  const noJS=await browser.newContext({javaScriptEnabled:false});const staticPage=await noJS.newPage();await staticPage.goto(base);assert(await staticPage.locator('#portfolio-content').isVisible());assert(await staticPage.locator('a[href="mailto:dy3239073@gmail.com"]').isVisible());await noJS.close();check('JavaScript-disabled fallback');
  assert.deepEqual(errors,[]);check('no browser console or runtime errors');
}finally{await fs.writeFile('.next/world-qa/results.json',JSON.stringify({checks,errors},null,2));await browser.close();}
