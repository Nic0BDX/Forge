const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.FORGE_PLAYWRIGHT||'playwright');
const workspace=process.cwd();
(async()=>{
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(workspace,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(workspace+path.sep)){res.writeHead(403).end();return}
  fs.stat(file,(error,stat)=>{
   if(error||!stat.isFile()){res.writeHead(404).end();return}
   const type=({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.mp4':'video/mp4'})[path.extname(file)]||'application/octet-stream';
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
  await page.locator('#profile-photo-gallery').setInputFiles(photo);await page.waitForFunction(()=>DB.profile.avatar.startsWith('data:image/jpeg;'));
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
  await page.locator('#settings-photo-gallery').setInputFiles(photo);assert.equal(await page.locator('#sn').inputValue(),'Nicolas modifié');
  await page.evaluate(()=>saveSettings());assert.equal(await page.locator('.forge-bar-name').innerText(),'Nicolas modifié');assert.equal(await page.evaluate(()=>DB.profile.avatar),avatar);
  const exported=await page.evaluate(()=>{const original=downloadCarnet;let result;downloadCarnet=text=>{result=text};try{exportData()}finally{downloadCarnet=original}return result});
  assert.equal(JSON.parse(exported).profile.avatar,avatar);
  await page.evaluate(text=>importData(new File([text],'forge-test.json',{type:'application/json'})),exported);
  await page.locator('.backup-preview').waitFor();await page.evaluate(()=>confirmBackupImport());assert.equal(await page.evaluate(()=>DB.profile.avatar),avatar);
  await page.evaluate(async()=>{await changeProfilePhoto(new File(['x'],'bad.txt',{type:'text/plain'}))});assert.match(await page.locator('#toast').innerText(),/image valide/);
  await page.evaluate(async()=>{await changeProfilePhoto(new File(['bad image'],'bad.png',{type:'image/png'}))});assert.equal(await page.evaluate(()=>DB.profile.avatar),avatar);
  await page.evaluate(async()=>{await changeProfilePhoto(new File([new Uint8Array(8*1024*1024+1)],'huge.png',{type:'image/png'}))});assert.match(await page.locator('#toast').innerText(),/8 Mo/);
  const beforeQuota=await page.evaluate(()=>JSON.stringify(DB));
  await page.evaluate(async source=>{const blob=await(await fetch(source)).blob(),original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('forge_data_'))throw new DOMException('Full','QuotaExceededError');return original.call(this,key,value)};try{await changeProfilePhoto(new File([blob],'photo.png',{type:'image/png'}));removeProfilePhoto()}finally{Storage.prototype.setItem=original}},source);
  assert.equal(await page.evaluate(()=>JSON.stringify(DB)),beforeQuota);assert.match(await page.locator('#toast').innerText(),/stockage/);
  await page.evaluate(()=>removeProfilePhoto());assert.equal(await page.evaluate(()=>DB.profile.avatar),'');assert.equal(await page.locator('#vf-avatar-button img').count(),0);assert.equal(await page.locator('#vf-avatar-button [data-profile-avatar]').innerText(),'N');
  await page.evaluate(()=>logout());await page.evaluate(()=>goAuth('login'));await page.locator('#authEmail').fill('profile-test@forge.example');await page.locator('#authPass').fill('ForgeTest123');await page.evaluate(()=>loginAccount());await page.waitForFunction(()=>isLogged()&&document.querySelector('.vf-app'));
  assert.equal(await page.evaluate(()=>DB.profile.avatar),'');assert.equal(await page.evaluate(()=>DB.profile.name),'Nicolas modifié');assert.deepEqual(errors,[]);
  console.log('PASS: avatar crop/256px/JPEG, live display, initial, gallery/capture, invalid/large files, quota rollback, export/import, rename, re-login; 390x844 and 1920x1080; no page errors');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
