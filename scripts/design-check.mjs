import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile, mkdir} from 'node:fs/promises';
const browser = await chromium.launch({channel:'msedge',headless:true});
const context = await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
const page = await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const url=process.env.AMANO_URL || 'http://127.0.0.1:5183';
await mkdir('artifacts',{recursive:true});
try {
 await page.goto(url); await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(900);
 const firstPlace=await page.locator('.card-place').first().boundingBox();
 await page.screenshot({path:'artifacts/redesign-desktop.png'});
 assert(firstPlace && firstPlace.y+firstPlace.height<=900,'First recorded location must be visible at 1440 x 900');
 await page.screenshot({path:'artifacts/redesign-desktop.png'});
 const cdp=await context.newCDPSession(page);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.locator('.card-open-art').first().hover();
 await page.waitForTimeout(220);
 const hoverTransform=await page.locator('.object-body').first().evaluate(el=>getComputedStyle(el).transform);
 assert.notEqual(hoverTransform,'none');
 await page.screenshot({path:'artifacts/redesign-hover.png'});
 await page.locator('.category-filter').getByRole('button',{name:'Herramientas',exact:true}).click();
 await expect(page.locator('.card-title')).toHaveText(['Juego de llaves Allen','Cinta métrica de 5 metros','Kit de costura']);
 await page.waitForTimeout(500);
 await page.locator('.category-filter').getByRole('button',{name:'Todo',exact:true}).click();
 await expect(page.locator('.object-card')).toHaveCount(10);
 await page.waitForTimeout(500);
 await page.getByRole('button',{name:'Ver Adaptador USB-C a HDMI',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.waitForTimeout(300);
 await page.screenshot({path:'artifacts/redesign-detail.png'});
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.keyboard.press('Control+k');
 await expect(page.getByRole('searchbox')).toBeFocused();
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.reload(); await page.evaluate(()=>document.fonts.ready);
 const reducedAnimations=await page.evaluate(()=>document.getAnimations().length);
 assert.equal(reducedAnimations,0,'Reduced motion must disable initial animation');
 const layouts=[];
 for(const width of [375,390,768]) {
  await page.setViewportSize({width,height:844});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const layout=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,firstCardTop:document.querySelector('.object-card').getBoundingClientRect().y}));
  assert.equal(layout.width,layout.documentWidth);
  layouts.push(layout);
  await page.screenshot({path:`artifacts/redesign-${width}.png`});
  if(width===390){await page.locator('.object-grid').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/redesign-mobile-collection.png'});await page.evaluate(()=>scrollTo(0,0));}
 }
 assert.deepEqual(errors,[]);
 const result={time:new Date().toISOString(),status:'passed',url,firstPlaceBottom:firstPlace.y+firstPlace.height,hoverTransform,reducedAnimations,layouts,checks:['First object name and recorded location visible at 1440 x 900','Hover, filter, modal open/Escape close under 4x CPU throttling','Ctrl+K focus','No initial animations with reduced motion','No horizontal overflow at 375, 390 and 768'],errors,limits:['Headless desktop emulation, not a physical mobile or measured frame-rate benchmark']};
 await writeFile('artifacts/redesign-check.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
} finally { await browser.close(); }
