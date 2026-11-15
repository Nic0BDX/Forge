const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.FORGE_PLAYWRIGHT||'playwright');
const workspace=process.cwd();
(async()=>{
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(workspace,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(workspace+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{res.statusCode=err?404:200;res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(err?'missing':data)});
 }).listen(0,'127.0.0.1');
 await new Promise(resolve=>server.on('listening',resolve));
 let browser;
 try{
  const chrome=process.env.FORGE_BROWSER||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
  browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url())});
  const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base);await page.locator('.ea-weights svg').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),'fr');
  assert.equal(await page.locator('.ea img').count(),0);
  await page.evaluate(()=>goAuth('login'));
  await page.locator('#authEmail').fill('i18n-test@forge.example');await page.locator('#authPass').fill('ForgeTest123');
  await page.locator('#authLanguage').selectOption('en');
  assert.equal(await page.locator('#authEmail').inputValue(),'i18n-test@forge.example');
  assert.equal(await page.locator('#authPass').inputValue(),'ForgeTest123');
  assert.equal(await page.locator('#authSubmit').innerText(),'Log in');
  assert.equal(await page.locator('#authEmail').getAttribute('placeholder'),'you@email.com');
  await page.evaluate(()=>loginAccount());assert.match(await page.locator('#authError').innerText(),/Account not found/);
  await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'en');
  await page.evaluate(()=>goAuth('register'));
  await page.locator('#regName').fill('Utilisateur test');await page.locator('#authEmail').fill('i18n-test@forge.example');await page.locator('#authPass').fill('ForgeTest123');
  await page.evaluate(()=>registerAccount());const recovery=await page.locator('.rec-code').innerText();
  assert.match(recovery,/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  await page.waitForTimeout(800);await page.evaluate(()=>{closeModal();DB.profile.setup=true;save();nav('home')});
  assert.equal(await page.locator('.vf-nav button').first().innerText(),'Home');
  const name=await page.evaluate(()=>DB.profile.name);
  await page.evaluate(()=>nav('settings'));
  if(await page.locator('#settingsLanguage').count()){
   assert.equal(await page.locator('h1').innerText(),'Settings');
   await page.locator('#sn').fill('Brouillon conservé');await page.locator('#settingsLanguage').selectOption('fr');
   assert.equal(await page.locator('#sn').inputValue(),'Brouillon conservé');assert.equal(await page.locator('h1').innerText(),'Paramètres');
   assert.equal(await page.evaluate(()=>DB.profile.name),name);await page.locator('#settingsLanguage').selectOption('en');
  }
  for(const route of ['home','program','nutrition','sleep','health','progress','memories','beforeafter','coach','calendar','profile','premium','settings','exercises','habits','goals','history','routine','community']){
   await page.evaluate(route=>nav(route),route);assert.equal(await page.locator('#main-content').count(),1,route);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow');
  }
  await page.evaluate(()=>logout());await page.evaluate(()=>goAuth('login'));
  await page.locator('#authEmail').fill('i18n-test@forge.example');await page.locator('#authPass').fill('ForgeTest123');await page.evaluate(()=>loginAccount());await page.waitForTimeout(800);
  assert.equal(await page.evaluate(()=>isLogged()),true);
  await page.evaluate(()=>logout());await page.evaluate(()=>goForgot());
  await page.locator('#authEmail').fill('i18n-test@forge.example');await page.locator('#recCode').fill(recovery);await page.locator('#authPass').fill('ForgeTest456');await page.evaluate(()=>resetPassword());
  assert.equal(await page.locator('#authSubmit').innerText(),'Log in');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.ea-bar').evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.setViewportSize({width:1280,height:805});assert.ok(await page.locator('#authEmail').isVisible());
  await page.goto(base+'/preview/demo.html');await page.locator('.vf-dashboard').waitFor();
  assert.deepEqual(errors,[]);console.log('PASS: FR/EN, persistence, fields, registration/login/recovery, 19 routes, mobile/desktop, reduced motion, preview; no console errors');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
