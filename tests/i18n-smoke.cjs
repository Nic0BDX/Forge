const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.FORGE_PLAYWRIGHT||'playwright');
const workspace=process.cwd();
const accountCheck=require('node:child_process').spawnSync(process.execPath,['tests/account-storage-smoke.cjs'],{stdio:'inherit',env:process.env});assert.equal(accountCheck.status,0,'Account edits, reloads and legacy account regression');
(async()=>{
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(workspace,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(workspace+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{res.statusCode=err?404:200;res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');res.end(err?'missing':data)});
 }).listen(0,'127.0.0.1');
 await new Promise(resolve=>server.on('listening',resolve));
 let browser;
 try{
  const chrome=process.env.FORGE_BROWSER||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
  browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url())});
  const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base);await page.locator('.ea-weights svg').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),'fr');
  assert.equal(await page.locator('.ea img').count(),0);
  await page.evaluate(()=>goAuth('login'));
  async function languageLayout(id,adjacent,label){for(const width of [390,1920]){await page.setViewportSize({width,height:width===390?844:1080});const button=page.locator('#'+id),rect=await button.boundingBox(),other=await page.locator(adjacent).boundingBox();assert.ok(rect.width>=44&&rect.height>=44);assert.ok(rect.x>=0&&rect.x+rect.width<=width);if(other)assert.ok(rect.x+rect.width<=other.x||other.x+other.width<=rect.x||rect.y+rect.height<=other.y||other.y+other.height<=rect.y,label+' overlap');assert.equal(await page.locator('#'+id+' .forge-language-icon').evaluate(el=>getComputedStyle(el).width),'26px');await button.click();assert.equal(await button.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await button.getAttribute('aria-expanded'),'false');await page.screenshot({path:path.join(require('node:os').tmpdir(),`forge-${label}-${width}.png`)});}await page.setViewportSize({width:390,height:844})}
  await languageLayout('authLanguage','.ea-form-brand','language-auth');
  await page.locator('#authLanguage').click();await page.keyboard.press('ArrowDown');assert.equal(await page.locator(':focus').getAttribute('data-forge-language'),'en');await page.keyboard.press('Enter');assert.equal(await page.locator('html').getAttribute('lang'),'en');await page.evaluate(()=>setLanguage('fr'));await page.locator('#authLanguage').click();await page.mouse.click(2,2);assert.equal(await page.locator('#authLanguage').getAttribute('aria-expanded'),'false');
  await page.locator('#authEmail').fill('i18n-test@forge.example');await page.locator('#authPass').fill('ForgeTest123');
  await page.locator('#authLanguage').click();await page.locator('[data-forge-language="en"]').click();
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
  assert.equal(await page.evaluate(()=>DB.profile.avatar),'','Signup photo is optional');
  await page.waitForTimeout(800);await page.evaluate(()=>{closeModal();DB.profile.setup=true;save();nav('home')});
  assert.equal(await page.locator('.vf-nav button').first().innerText(),'Home');
  assert.match(await page.locator('.vf-hero h1').innerText(),/Overview/);
  assert.equal(await page.locator('.vf-sleep h2').innerText(),'Sleep tracking');
  await languageLayout('appLanguage','#vf-avatar-button','language-app');
  const name=await page.evaluate(()=>DB.profile.name);
  await page.evaluate(()=>nav('settings'));
  if(await page.locator('#appLanguage').count()){
   assert.equal(await page.locator('h1').innerText(),'Settings');
   await page.locator('#sn').fill('Brouillon conservé');await page.locator('#appLanguage').click();await page.locator('#appLanguage-menu [data-forge-language="fr"]').click();
   assert.equal(await page.locator('#sn').inputValue(),'Brouillon conservé');assert.equal(await page.locator('h1').innerText(),'Paramètres');
   assert.equal(await page.evaluate(()=>DB.profile.name),name);await page.locator('#appLanguage').click();await page.locator('#appLanguage-menu [data-forge-language="en"]').click();
  }
  for(const route of ['home','program','nutrition','sleep','health','progress','memories','beforeafter','coach','calendar','profile','premium','settings','exercises','habits','goals','history','routine','community','workouts','meals','nutriai','weekly']){
   await page.evaluate(route=>nav(route),route);assert.equal(await page.locator('#main-content').count(),1,route);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow');
  }
  for(const open of ['openActivityModal','openSleepModal','openWeightModal','openGoalModal','openHabitModal','openMealModal','vfOpenSteps','vfOpenPulse','openProgramModal']){
   await page.evaluate(name=>window[name](),open);assert.ok(await page.locator('#modalbox').innerText(),open);await page.evaluate(()=>closeModal());
  }
  assert.match(await page.evaluate(()=>{try{validateBackup({})}catch(error){return error.message}}),/^This backup/);
  await page.evaluate(()=>openMealModal());assert.equal(await page.locator('#mealType').inputValue(),'Petit-déjeuner');assert.equal(await page.locator('#mealType option').first().innerText(),'Breakfast');await page.evaluate(()=>closeModal());
  await page.evaluate(()=>openGoalModal());assert.equal(await page.locator('#goalType option').nth(1).getAttribute('value'),'Poids');assert.equal(await page.locator('#goalType option').nth(1).innerText(),'Weight');await page.evaluate(()=>closeModal());
  await page.evaluate(()=>{installTemplate('push');const p=DB.programs.at(-1);startWorkout(p.id,0)});
  assert.equal(await page.locator('.es-ex-h b').first().innerText(),'Développé couché');
  await page.evaluate(()=>{updateWorkoutField(0,0,'weight','30');updateWorkoutField(0,0,'reps','8');toggleSet(0,0)});
  await page.reload();await page.evaluate(()=>resumeWorkout());
  assert.equal(await page.locator('.es-ex-h b').first().innerText(),'Développé couché');
  await page.evaluate(()=>finishWorkout());assert.equal(await page.evaluate(()=>view),'summary');
  assert.equal(await page.evaluate(()=>DB.sessions[0].exercises[0].name),'Développé couché');
  assert.equal(await page.evaluate(()=>DB.sessions[0].volume),240);
  await page.evaluate(()=>{const data='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=';DB.photos=[{id:'photo-before',date:'2026-01-01',data,caption:'Début français',pose:'Face'},{id:'photo-after',date:'2026-01-08',data,caption:'Fin française',pose:'Profil'}];save();nav('beforeafter')});
  assert.equal(await page.locator('#beforePhoto').inputValue(),'photo-before');
  const photos=await page.evaluate(()=>JSON.stringify(DB.photos));await page.evaluate(()=>{setLanguage('fr');setLanguage('en')});assert.equal(await page.evaluate(()=>JSON.stringify(DB.photos)),photos);
  await page.emulateMedia({reducedMotion:'reduce'});
  const atlasName=await page.evaluate(()=>{const e=atlasRecords.find(x=>x.instructionsEn?.length);openExerciseModal(e.id);return e.name});
  assert.equal(await page.locator('#ax-detail-title').innerText(),atlasName);assert.equal(await page.locator('.ax-instructions').getAttribute('lang'),'en');await page.evaluate(()=>closeModal());
  await page.evaluate(()=>logout());await page.evaluate(()=>goAuth('login'));
  await page.locator('#authEmail').fill('i18n-test@forge.example');await page.locator('#authPass').fill('ForgeTest123');await page.evaluate(()=>loginAccount());await page.waitForTimeout(800);
  assert.equal(await page.evaluate(()=>isLogged()),true);
  await page.evaluate(()=>logout());await page.evaluate(()=>goForgot());
  await page.locator('#authEmail').fill('i18n-test@forge.example');await page.locator('#recCode').fill(recovery);await page.locator('#authPass').fill('ForgeTest456');await page.evaluate(()=>resetPassword());
  assert.equal(await page.locator('#authSubmit').innerText(),'Log in');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.ea-bar').evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.setViewportSize({width:1280,height:805});assert.ok(await page.locator('#authEmail').isVisible());
  await page.goto(base+'/preview/demo.html');await page.locator('.vf-dashboard').waitFor();
  assert.deepEqual(errors,[]);console.log('PASS: FR/EN, persistence, fields, auth/recovery, 23 routes, 9 modals, workout/resume/save, Atlas names preserved, mobile/desktop, reduced motion, preview; no console errors');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
