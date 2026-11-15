const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.FORGE_PLAYWRIGHT||'playwright');
const workspace=process.cwd();
(async()=>{
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(workspace,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(workspace+path.sep)){res.writeHead(403).end();return}
  fs.stat(file,(error,stat)=>{
   if(error||!stat.isFile()){res.writeHead(404).end();return}
   const type=({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.mp4':'video/mp4'})[path.extname(file)]||'application/octet-stream';
   const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/),start=range?Number(range[1]):0,end=range&&range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;
   res.writeHead(range?206:200,{'Content-Type':type,'Content-Length':end-start+1,'Accept-Ranges':'bytes',...(range?{'Content-Range':`bytes ${start}-${end}/${stat.size}`}:{})});fs.createReadStream(file,{start,end}).pipe(res);
  });
 }).listen(0,'127.0.0.1');
 await new Promise(resolve=>server.on('listening',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.FORGE_BROWSER||process.platform==='win32'?{executablePath:process.env.FORGE_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
  const base='http://127.0.0.1:'+server.address().port,page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);await page.evaluate(()=>goAuth('register'));
  await page.locator('#regName').fill('Nicolas');await page.locator('#authEmail').fill('profile-test@forge.example');await page.locator('#authPass').fill('ForgeTest123');
  await page.evaluate(()=>registerAccount());await page.waitForFunction(()=>view==='setup'&&!document.querySelector('#faceModal.show'));await page.evaluate(()=>{closeModal();DB.profile.setup=true;save();nav('profile')});
  const originalName=await page.evaluate(()=>DB.profile.name);assert.equal(originalName,'Nicolas');
  const source=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,640,320);ctx.fillStyle='#00a000';ctx.fillRect(160,0,320,320);return canvas.toDataURL('image/png')});
  const photo={name:'test-profile.png',mimeType:'image/png',buffer:Buffer.from(source.split(',')[1],'base64')};
  assert.equal(await page.locator('#profile-photo-camera').getAttribute('capture'),'user');
  const initialAvatar=await page.evaluate(()=>DB.profile.avatar);
  await page.locator('#profile-photo-gallery').setInputFiles(photo);await page.locator('.forge-crop canvas').waitFor();
  assert.equal(await page.evaluate(()=>DB.profile.avatar),initialAvatar);
  await page.locator('#forge-crop-zoom').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#forge-crop-x').evaluate(el=>{el.value='100';el.dispatchEvent(new Event('input',{bubbles:true}))});
  const moved=await page.locator('.forge-crop canvas').evaluate(el=>[...el.getContext('2d').getImageData(128,128,1,1).data]);assert.ok(moved[0]>moved[1]+80,'manual crop changes selected area');
  const box=await page.locator('.forge-crop canvas').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+60,box.y+box.height/2);await page.mouse.up();assert.ok(Number(await page.locator('#forge-crop-x').inputValue())<100,'drag repositions photo');
  await page.locator('[data-crop-reset]').click();assert.equal(await page.locator('#forge-crop-zoom').inputValue(),'1');
  await page.locator('[data-crop-save]').click();await page.waitForFunction(()=>DB.profile.avatar.startsWith('data:image/jpeg;'));
  const avatar=await page.evaluate(()=>DB.profile.avatar);
  assert.ok(avatar.length<100000);
  const crop=await page.evaluate(async()=>{const image=new Image();image.src=DB.profile.avatar;await image.decode();const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return {width:image.naturalWidth,height:image.naturalHeight,pixel:[...ctx.getImageData(0,128,1,1).data]}});
  assert.equal(crop.width,256);assert.equal(crop.height,256);assert.ok(crop.pixel[1]>crop.pixel[0]+80,'centred square crop');
  for(const width of [390,1920]){
   await page.setViewportSize({width,height:width===390?844:1080});await page.evaluate(()=>nav('profile'));
   assert.equal(await page.locator('.profile-photo img').getAttribute('src'),avatar);assert.equal(await page.locator('#vf-avatar-button img').getAttribute('src'),avatar);
   await page.locator('#vf-avatar-button').click();assert.equal(await page.locator('.vf-menu-person img').getAttribute('src'),avatar);await page.keyboard.press('Escape');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.evaluate(()=>nav('settings'));await page.locator('#sn').fill('Nicolas modifié');
  await page.locator('#settings-photo-gallery').setInputFiles(photo);await page.locator('.forge-crop').waitFor();await page.locator('[data-crop-cancel]').click();assert.equal(await page.evaluate(()=>DB.profile.avatar),avatar);
  await page.locator('#settings-photo-gallery').setInputFiles(photo);await page.locator('.forge-crop').waitFor();await page.locator('[data-crop-save]').click();assert.equal(await page.locator('#sn').inputValue(),'Nicolas modifié');
  await page.evaluate(()=>saveSettings());assert.equal(await page.locator('.forge-bar-name').innerText(),'Nicolas modifié');assert.equal(await page.evaluate(()=>DB.profile.avatar),avatar);
  const exported=await page.evaluate(()=>{const original=downloadCarnet;let result;downloadCarnet=text=>{result=text};try{exportData()}finally{downloadCarnet=original}return result});
  assert.equal(JSON.parse(exported).profile.avatar,avatar);
  await page.evaluate(text=>importData(new File([text],'forge-test.json',{type:'application/json'})),exported);
  await page.locator('.backup-preview').waitFor();await page.evaluate(()=>confirmBackupImport());assert.equal(await page.evaluate(()=>DB.profile.avatar),avatar);
  await page.evaluate(async()=>{await changeProfilePhoto(new File(['x'],'bad.txt',{type:'text/plain'}))});assert.match(await page.locator('#toast').innerText(),/image valide/);
  await page.evaluate(async()=>{await changeProfilePhoto(new File(['bad image'],'bad.png',{type:'image/png'}))});assert.equal(await page.evaluate(()=>DB.profile.avatar),avatar);
  await page.evaluate(async()=>{await changeProfilePhoto(new File([new Uint8Array(8*1024*1024+1)],'huge.png',{type:'image/png'}))});assert.match(await page.locator('#toast').innerText(),/8 Mo/);
  const beforeQuota=await page.evaluate(()=>JSON.stringify(DB));
  await page.evaluate(async source=>{const blob=await(await fetch(source)).blob();window.photoStorageOriginal=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('forge_data_'))throw new DOMException('Full','QuotaExceededError');return window.photoStorageOriginal.call(this,key,value)};void changeProfilePhoto(new File([blob],'photo.png',{type:'image/png'}))},source);
  await page.locator('.forge-crop').waitFor();await page.locator('[data-crop-save]').click();await page.evaluate(()=>{try{removeProfilePhoto()}finally{Storage.prototype.setItem=window.photoStorageOriginal;delete window.photoStorageOriginal}});
  assert.equal(await page.evaluate(()=>JSON.stringify(DB)),beforeQuota);assert.match(await page.locator('#toast').innerText(),/stockage/);
  await page.evaluate(()=>removeProfilePhoto());assert.equal(await page.evaluate(()=>DB.profile.avatar),'');assert.equal(await page.locator('#vf-avatar-button img').count(),0);assert.equal(await page.locator('#vf-avatar-button [data-profile-avatar]').innerText(),'N');
  await page.evaluate(()=>logout());await page.evaluate(()=>goAuth('login'));await page.locator('#authEmail').fill('profile-test@forge.example');await page.locator('#authPass').fill('ForgeTest123');await page.evaluate(()=>loginAccount());await page.waitForFunction(()=>isLogged()&&document.querySelector('.vf-app'));
  assert.equal(await page.evaluate(()=>DB.profile.avatar),'');assert.equal(await page.evaluate(()=>DB.profile.name),'Nicolas modifié');assert.deepEqual(errors,[]);
  console.log('PASS: avatar crop/256px/JPEG, live display, initial, gallery/capture, invalid/large files, quota rollback, export/import, rename, re-login; 390x844 and 1920x1080; no page errors');
  await page.close();
  for(const viewport of [{width:390,height:844},{width:1920,height:1080}]){
   const welcome=await browser.newPage({viewport,reducedMotion:'no-preference'}),pageErrors=[],consoleErrors=[];
   welcome.on('pageerror',error=>pageErrors.push(error.message));welcome.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});
   const email='welcome-'+viewport.width+'@forge.example';
   async function login(){await welcome.evaluate(()=>goAuth('login'));await welcome.locator('#authEmail').fill(email);await welcome.locator('#authPass').fill('ForgeTest123');await welcome.evaluate(()=>loginAccount())}
   async function seek(time){await welcome.locator('.forge-welcome video').evaluate((video,time)=>{video.pause();video.currentTime=time},time);await welcome.waitForFunction(time=>{const v=document.querySelector('.forge-welcome video');return v&&!v.seeking&&Math.abs(v.currentTime-time)<.1},time);await welcome.waitForTimeout(80)}
   await welcome.goto(base);await welcome.evaluate(()=>goAuth('register'));await welcome.locator('#regName').fill('Nicolas');await welcome.locator('#authEmail').fill(email);await welcome.locator('#authPass').fill('ForgeTest123');await welcome.evaluate(()=>registerAccount());
   await welcome.locator('.forge-welcome').waitFor({timeout:5000});
   await welcome.waitForFunction(()=>document.querySelector('.forge-welcome video')?.currentTime>0,null,{timeout:5000});
   const metadata=await welcome.locator('.forge-welcome video').evaluate(video=>({width:video.videoWidth,height:video.videoHeight,duration:video.duration,muted:video.muted,volume:video.volume,inline:video.playsInline}));
   assert.equal(metadata.width,720);assert.equal(metadata.height,1560);assert.ok(metadata.duration>=13.4&&metadata.duration<14);assert.ok(metadata.muted&&metadata.inline);assert.equal(metadata.volume,0);
   const frame=await welcome.locator('.forge-welcome-frame').boundingBox();assert.ok(Math.abs(frame.height-viewport.height)<2);assert.ok(Math.abs(frame.x+frame.width/2-viewport.width/2)<2);
   assert.ok(Math.abs(frame.width-(viewport.width===390?390:1080*720/1560))<2);
   await seek(1.6);assert.equal(await welcome.locator('.forge-welcome-title').innerText(),'Bonjour Nicolas,');assert.equal(await welcome.locator('.forge-welcome-name').innerText(),'Nicolas');
   assert.ok(!(await welcome.locator('.forge-welcome-title').innerText()).includes('Alex'));assert.equal(await welcome.locator('.forge-welcome-name').evaluate(el=>getComputedStyle(el).color),'rgb(225, 29, 42)');
   const normalSize=await welcome.locator('.forge-welcome-title').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
   await seek(3.8);assert.equal(await welcome.locator('.forge-welcome-subtitle').innerText(),'Bonne séance à toi !');
   await seek(4.5);assert.equal(await welcome.locator('.forge-welcome-title').innerText(),'');
   await seek(7.8);assert.equal(await welcome.locator('.forge-welcome-title').innerText(),'Welcome Nicolas,');assert.equal(await welcome.locator('.forge-welcome-subtitle').innerText(),'Have a great workout!');
   await seek(12.8);assert.equal(await welcome.locator('.forge-welcome-title').innerText(),'¡Hola, Nicolas!');assert.equal(await welcome.locator('.forge-welcome-subtitle').innerText(),'¡Que tengas una buena sesión!');
   await seek(2);assert.equal(await welcome.locator('.forge-welcome-title').innerText(),'Bonjour Nicolas,');
   await welcome.locator('.forge-welcome video').evaluate(video=>{video.currentTime=video.duration-.08;return video.play()});
   await welcome.waitForFunction(()=>!document.querySelector('.forge-welcome'),null,{timeout:3000});assert.equal(await welcome.evaluate(()=>view),'setup');assert.ok(await welcome.locator('.rec-code').isVisible());assert.equal(await welcome.locator('#setupName').inputValue(),'Nicolas');
   await welcome.evaluate(()=>{closeModal();finishSetup();nav('settings')});
   const changedName=viewport.width===390?'nicolas':'nicolasWWWWWWWWWWWWWWWWWWWW';
   await welcome.locator('#sn').fill(changedName);await welcome.evaluate(()=>{saveSettings();setLanguage('en')});assert.equal(await welcome.locator('.forge-bar-name').innerText(),changedName);
   await welcome.evaluate(()=>logout());await login();await welcome.locator('.forge-welcome').waitFor({timeout:5000});await welcome.waitForFunction(()=>document.querySelector('.forge-welcome video')?.currentTime>0,null,{timeout:5000});
   await seek(2.8);assert.equal(await welcome.locator('.forge-welcome-name').innerText(),Array.from(changedName).slice(0,20).join(''));assert.equal(await welcome.locator('.forge-welcome button').count(),0);
   if(viewport.width===1920)assert.ok(await welcome.locator('.forge-welcome-title').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))<normalSize);
   await welcome.keyboard.press('Escape');assert.equal(await welcome.locator('.forge-welcome').count(),1);await welcome.keyboard.press('Tab');assert.ok(await welcome.locator('.forge-welcome').evaluate(el=>el===document.activeElement));
   await welcome.locator('.forge-welcome video').evaluate(video=>{video.currentTime=video.duration-.08;return video.play()});await welcome.waitForFunction(()=>!document.querySelector('.forge-welcome'));
   assert.equal(await welcome.evaluate(()=>view),'home');assert.equal(await welcome.evaluate(()=>DB.profile.name),changedName);
   await welcome.reload();await welcome.locator('.vf-app').waitFor();assert.equal(await welcome.locator('.forge-welcome').count(),0);assert.equal(await welcome.evaluate(()=>sessionStorage.getItem('forge_welcome_seen_v1')),'1');
   await welcome.emulateMedia({reducedMotion:'reduce'});await welcome.evaluate(()=>logout());await login();await welcome.locator('.vf-app').waitFor();assert.equal(await welcome.locator('.forge-welcome').count(),0);
   assert.deepEqual(consoleErrors,[]);assert.deepEqual(pageErrors,[]);
   if(viewport.width===390){
    await welcome.emulateMedia({reducedMotion:'no-preference'});await welcome.route('**/assets/forge_welcome_clean.mp4',route=>route.abort());
    await welcome.evaluate(()=>logout());await login();await welcome.locator('.vf-app').waitFor({timeout:5000});assert.equal(await welcome.locator('.forge-welcome').count(),0);await welcome.unroute('**/assets/forge_welcome_clean.mp4');
    let stalled;await welcome.route('**/assets/forge_welcome_clean.mp4',route=>{stalled=route});
    await welcome.evaluate(()=>logout());await login();const started=Date.now();await welcome.locator('.vf-app').waitFor({timeout:5000});assert.ok(Date.now()-started<4000);assert.equal(await welcome.locator('.forge-welcome').count(),0);if(stalled)await stalled.abort();await welcome.unroute('**/assets/forge_welcome_clean.mp4');
    await welcome.evaluate(()=>{window.originalMediaPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('Blocked','NotAllowedError'));logout()});await login();await welcome.locator('.vf-app').waitFor({timeout:5000});assert.equal(await welcome.locator('.forge-welcome').count(),0);await welcome.evaluate(()=>{HTMLMediaElement.prototype.play=window.originalMediaPlay});
    assert.deepEqual(pageErrors,[]);
   }
   await welcome.close();
   console.log(`PASS: welcome ${viewport.width}x${viewport.height}, actual MP4/muted, Nicolas/rename/no Alex, FR/EN/ES media time, frame layout, long name, no skip button, fade/arrival/recovery, no replay, reduced motion; no unexpected console errors`);
  }
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
