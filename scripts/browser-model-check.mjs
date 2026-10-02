import {chromium, expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('artifacts',{recursive:true});
const context=await chromium.launchPersistentContext('.cache/isolated-model-test',{channel:'msedge',headless:true,viewport:{width:1440,height:1050},reducedMotion:'reduce'});
const page=context.pages()[0];
const requests=[],errors=[];
context.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});
page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERROR',m.text().slice(0,500))});
page.on('requestfailed',r=>console.log('REQUEST FAILED',r.url(),r.failure()?.errorText));
try{
 await page.goto(process.env.AMANO_URL || 'http://127.0.0.1:5183');
 await page.getByRole('button',{name:'Explorar demo',exact:true}).click();
 const start=Date.now();
 await page.getByRole('button',{name:'Activar',exact:true}).click();
 await expect(page.locator('.semantic-copy strong')).toHaveText('También entiende cómo lo describes',{timeout:180000});
 const loadedMs=Date.now()-start; console.log('MODEL READY',loadedMs);
 const search=page.getByRole('searchbox'); const cases=[];
 for(const query of ['quiero mostrar la pantalla del computador en el televisor','estuche gris','pasaporte AMANO_PRIVATE_SYNTHETIC_8491']){
  await search.fill(query);
  await expect(page.locator('.results-explanation')).toContainText('sugerencias por significado',{timeout:30000});
  cases.push({query,titles:await page.locator('.card-title').allTextContents()});
 }
 assert(cases[0].titles.includes('Adaptador USB-C a HDMI'));
 assert(cases[1].titles.includes('Adaptador USB-C a HDMI'));
 assert.equal(cases[2].titles.length,0);
 await search.fill('lluvia'); await search.fill('');
 await expect(page.locator('.semantic-copy strong')).toHaveText('También entiende cómo lo describes');
 await context.setOffline(true);
 await search.fill('arreglar un botón de mi camisa');
 await expect(page.locator('.results-explanation')).toContainText('sugerencias por significado',{timeout:30000});
 const offline=await page.locator('.card-title').allTextContents();
 assert(offline.includes('Kit de costura'));await context.setOffline(false);
 await page.screenshot({path:'artifacts/browser-ai-result.png',fullPage:true});
 assert(!requests.some(r=>`${r.url} ${r.body}`.includes('AMANO_PRIVATE_SYNTHETIC_8491')));
 assert.equal(errors.length,0,errors.join(';'));
 await writeFile('artifacts/browser-model-check.json',JSON.stringify({time:new Date().toISOString(),status:'passed',runtime:'ONNX WASM / isolated headless Edge',loadedMs,cases,offlineSessionResults:offline,networkSentinelAbsent:true,requests:requests.map(({url,method})=>({url:new URL(url).origin+new URL(url).pathname,method})),errors,limits:['Only synthetic data and desktop browser; no physical mobile benchmark.','Offline inference in an already-loaded session, not offline page reload.']},null,2));
 console.log('BROWSER MODEL CHECKS PASSED',JSON.stringify({loadedMs,cases,offline}));
}catch(e){
 await page.screenshot({path:'artifacts/model-failure.png',fullPage:true}).catch(()=>{});
 await writeFile('artifacts/model-failure.json',JSON.stringify({error:String(e),text:await page.locator('.semantic-panel').innerText().catch(()=>''),errors,requests},null,2));throw e;
}finally{await context.close()}
