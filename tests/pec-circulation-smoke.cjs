const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.FORGE_PLAYWRIGHT||'playwright');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(error,data)=>{res.statusCode=error?404:200;res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');res.end(error?'missing':data)})}).listen(0,'127.0.0.1');
 await new Promise(resolve=>server.on('listening',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.FORGE_BROWSER||process.platform==='win32'?{executablePath:process.env.FORGE_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
  for(const viewport of [{width:390,height:844},{width:1920,height:1080}]){
   const page=await browser.newPage({viewport,reducedMotion:'no-preference'}),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
   await page.goto('http://127.0.0.1:'+server.address().port);
   assert.equal(await page.locator('link[rel="icon"][sizes="any"]').getAttribute('href'),'/favicon.ico');assert.equal(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'),'/assets/icons/apple-touch-icon.png');
   const response=await page.request.get('http://127.0.0.1:'+server.address().port+'/manifest.webmanifest');assert.ok(response.ok());assert.match(response.headers()['content-type'],/^application\/manifest\+json/);assert.equal((await response.json()).name,'FORGE');
   await page.evaluate(()=>{const email='pec-test@forge.example';AUTH[email]={email,name:'Test'};localStorage.setItem('forge_accounts_v1',JSON.stringify(AUTH));localStorage.setItem('forge_session_v1',email);DB=defaultDB();DB.profile.setup=true;DB.profile.name='Test';save();nav('home')});
   await page.waitForFunction(()=>{const el=document.querySelector('.vf-body-hero');return el&&!el.classList.contains('is-paused')});
   assert.equal(await page.locator('.vf-body-hero .vf-vein-track').count(),12);
   const head=page.locator('.vf-body-hero .vf-vein-head').first();await page.waitForFunction(()=>document.querySelector('.vf-body-hero .vf-vein-head')?.getAnimations()[0]?.currentTime>0);const before=await head.evaluate(el=>getComputedStyle(el).strokeDashoffset);await page.waitForTimeout(200);assert.notEqual(await head.evaluate(el=>getComputedStyle(el).strokeDashoffset),before);
   const timing=await page.locator('.vf-body-hero .vf-vein-head').evaluateAll(elements=>elements.map(el=>({duration:parseFloat(getComputedStyle(el).animationDuration),delay:getComputedStyle(el).animationDelay})));assert.ok(timing.every(row=>row.duration>=2.5&&row.duration<=4));assert.ok(new Set(timing.map(row=>row.delay)).size>4);
   const colors=[];for(const accent of ['lime','red','orange','cyan','blue','violet','pink']){await page.evaluate(accent=>vfSelectAccent(accent),accent);colors.push(await page.locator('.vf-body-hero .vf-vein-track').first().evaluate(el=>getComputedStyle(el).stroke));assert.equal(await page.locator('.vf-body-hero stop').first().evaluate(el=>getComputedStyle(el).stopColor),colors.at(-1))}assert.equal(new Set(colors).size,7);
   await page.evaluate(()=>forgeToggleBodyMotion());assert.equal(await head.evaluate(el=>getComputedStyle(el).animationPlayState),'paused');await page.evaluate(()=>forgeToggleBodyMotion());
   await page.evaluate(()=>{const spacer=document.createElement('div');spacer.id='pec-test-space';spacer.style.height=innerHeight+'px';document.body.append(spacer);window.scrollTo({top:document.querySelector('.vf-body-hero').getBoundingClientRect().bottom+scrollY+150,behavior:'instant'})});
   await page.waitForFunction(()=>document.querySelector('.vf-body-hero').classList.contains('is-paused'));await page.locator('.vf-body-motivation').scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('.vf-body-motivation').classList.contains('is-paused'));
   await page.locator('.vf-body-hero').scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('.vf-body-hero').classList.contains('is-paused'));await page.evaluate(()=>document.getElementById('pec-test-space').remove());
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await head.evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
   await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>!document.querySelector('.vf-body-hero').classList.contains('is-paused'));
   const properties=await page.locator('.vf-body-hero .vf-body-glow').evaluate(el=>[...new Set(el.getAnimations({subtree:true}).flatMap(animation=>animation.effect.getKeyframes().flatMap(frame=>Object.keys(frame))))]);assert.ok(properties.every(key=>['offset','computedOffset','easing','composite','opacity','strokeDashoffset'].includes(key)));
   await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await head.evaluate(el=>getComputedStyle(el).animationName),'none');assert.ok(await head.evaluate(el=>Number(getComputedStyle(el).opacity)>0));
   await page.evaluate(()=>{nav('profile');nav('home')});await page.waitForFunction(()=>forgeObservedBodies.size===document.querySelectorAll('.vf-body-mount').length);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await page.close();
   console.log(`PASS: pec circulation ${viewport.width}x${viewport.height}, 12 branches, offset-only flow, 7 accents, toggle/offscreen/hidden pause, static reduced motion, observer cleanup; no console errors`);
  }
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
