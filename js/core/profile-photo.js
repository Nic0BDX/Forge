/* DB.profile.avatar remains the only profile image source. */
let profilePhotoSequence=0;
let signupAvatar='';
function profileAvatar(className=''){
 const value=String(DB.profile.avatar||''),name=String(DB.profile.name||'Champion');
 const initial=Array.from(name.trim())[0]||'C';
 const image=!AVATARS.includes(value)&&/^(data:image\/|https?:\/\/|assets\/)/.test(value);
 return `<span class="forge-avatar ${className}" data-profile-avatar data-avatar-class="${esc(className)}" role="img" aria-label="${esc(t('Photo de profil')+' '+name)}"><span aria-hidden="true">${esc(initial)}</span>${image?`<img src="${esc(value)}" alt="" decoding="async" onerror="this.remove()">`:''}</span>`;
}
function profilePhotoControls(id,withPreview=true){return `<div class="forge-photo-controls">${withPreview?profileAvatar('profile-photo'):''}<div class="forge-photo-actions"><input id="${id}-gallery" type="file" accept="image/*" hidden onchange="changeProfilePhoto(this.files[0]);this.value=''" aria-label="${t('Choisir une photo')}"><input id="${id}-camera" type="file" accept="image/*" capture="user" hidden onchange="changeProfilePhoto(this.files[0]);this.value=''" aria-label="${t('Prendre une photo')}"><button type="button" class="btn small" onclick="document.getElementById('${id}-gallery').click()">${t('Choisir une photo')}</button><button type="button" class="btn small" onclick="document.getElementById('${id}-camera').click()">${t('Prendre une photo')}</button><button type="button" class="btn small" onclick="removeProfilePhoto()">${t('Supprimer')}</button></div></div>`}
function refreshProfileAvatars(){document.querySelectorAll('[data-profile-avatar]').forEach(el=>{el.outerHTML=profileAvatar(el.dataset.avatarClass||'')})}
function cropProfilePhoto(image,active){return new Promise(resolve=>{
 const overlay=document.createElement('section');overlay.className='forge-crop';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','forge-crop-title');
 overlay.innerHTML=`<div class="forge-crop-dialog"><h2 id="forge-crop-title">${t('Recadrer la photo')}</h2><p>${t('Fais glisser la photo pour la centrer, puis ajuste le zoom.')}</p><div class="forge-crop-preview"><canvas width="256" height="256" role="img" aria-label="${t('Aperçu du recadrage')}"></canvas></div><label for="forge-crop-zoom">${t('Zoom')}</label><input id="forge-crop-zoom" type="range" min="1" max="3" step=".01" value="1"><label for="forge-crop-x">${t('Position horizontale')}</label><input id="forge-crop-x" type="range" min="-100" max="100" step="1" value="0"><label for="forge-crop-y">${t('Position verticale')}</label><input id="forge-crop-y" type="range" min="-100" max="100" step="1" value="0"><div class="forge-crop-actions"><button type="button" class="btn" data-crop-reset>${t('Recentrer')}</button><button type="button" class="btn" data-crop-cancel>${t('Annuler')}</button><button type="button" class="btn primary" data-crop-save>${t('Utiliser cette photo')}</button></div></div>`;
 const focus=document.activeElement,overflow=document.body.style.overflow,inert=[document.getElementById('root'),document.getElementById('modal')].filter(Boolean).map(el=>({el,value:el.inert}));
 document.body.append(overlay);document.body.style.overflow='hidden';inert.forEach(({el})=>el.inert=true);
 const canvas=overlay.querySelector('canvas'),context=canvas.getContext('2d'),zoom=overlay.querySelector('#forge-crop-zoom'),horizontal=overlay.querySelector('#forge-crop-x'),vertical=overlay.querySelector('#forge-crop-y');
 const width=image.naturalWidth,height=image.naturalHeight;let cx=width/2,cy=height/2,drag=null,closed=false;
 const side=()=>Math.min(width,height)/Number(zoom.value);
 function draw(){const size=side();cx=Math.max(size/2,Math.min(width-size/2,cx));cy=Math.max(size/2,Math.min(height-size/2,cy));context.fillStyle='#140c11';context.fillRect(0,0,256,256);context.drawImage(image,cx-size/2,cy-size/2,size,size,0,0,256,256);horizontal.disabled=width<=size;vertical.disabled=height<=size;horizontal.value=width>size?((cx-size/2)/(width-size)*200-100):0;vertical.value=height>size?((cy-size/2)/(height-size)*200-100):0}
 function finish(save=false){if(closed)return;closed=true;let result=null;try{if(save&&active())result=canvas.toDataURL('image/jpeg',.8)}catch{toast(t('Choisis un fichier image valide.'))}window.removeEventListener('keydown',keyboard,true);overlay.remove();inert.forEach(({el,value})=>el.inert=value);document.body.style.overflow=overflow;if(focus?.isConnected)focus.focus({preventScroll:true});resolve(result)}
 function keyboard(event){if(event.key==='Escape'){event.preventDefault();finish()}else if(event.key==='Tab'){const controls=[...overlay.querySelectorAll('button:not(:disabled),input:not(:disabled)')],first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}}
 zoom.addEventListener('input',draw);
 horizontal.addEventListener('input',()=>{const size=side();cx=size/2+(width-size)*(Number(horizontal.value)+100)/200;draw()});
 vertical.addEventListener('input',()=>{const size=side();cy=size/2+(height-size)*(Number(vertical.value)+100)/200;draw()});
 canvas.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId)});
 canvas.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const scale=side()/canvas.getBoundingClientRect().width;cx-=(event.clientX-drag.x)*scale;cy-=(event.clientY-drag.y)*scale;drag.x=event.clientX;drag.y=event.clientY;draw()});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{drag=null});
 overlay.querySelector('[data-crop-reset]').addEventListener('click',()=>{zoom.value='1';cx=width/2;cy=height/2;draw()});
 overlay.querySelector('[data-crop-cancel]').addEventListener('click',()=>finish());overlay.querySelector('[data-crop-save]').addEventListener('click',()=>finish(true));
 window.addEventListener('keydown',keyboard,true);draw();zoom.focus();
})}
async function prepareProfilePhoto(file,active){
 if(!file)return;
 if(!/^image\//i.test(file.type))return toast(t('Choisis un fichier image valide.'));
 if(file.size>8*1024*1024)return toast(t('Photo trop volumineuse (8 Mo maximum).'));
 let url,avatar;
 try{
  url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();
  const width=image.naturalWidth,height=image.naturalHeight;
  if(!width||!height||width*height>40000000)throw new Error('image');
  if(!active())return;
  avatar=await cropProfilePhoto(image,active);
 }catch{if(active())toast(t('Choisis un fichier image valide.'));return}
 finally{if(url)URL.revokeObjectURL(url)}
 return avatar;
}
async function changeProfilePhoto(file){
 const sequence=++profilePhotoSequence,owner=currentEmail();
 const active=()=>sequence===profilePhotoSequence&&owner===currentEmail()&&isLogged();
 const avatar=await prepareProfilePhoto(file,active);
 if(!avatar||!active())return;
 try{ensureWritableDB();const next=JSON.parse(JSON.stringify(DB));next.profile.avatar=avatar;commitUserDB(validateBackup(next),owner)}
 catch{return toast(t('Photo non enregistrée. Vérifie le stockage disponible.'))}
 refreshProfileAvatars();toast(t('Photo de profil enregistrée.'));
}
function signupPhotoControls(){return `<div class="forge-photo-controls"><span class="forge-avatar profile-photo" id="signup-avatar-preview"><span>C</span>${signupAvatar?`<img src="${esc(signupAvatar)}" alt="">`:''}</span><div class="forge-photo-actions"><input id="signup-photo-gallery" type="file" accept="image/*" hidden onchange="changeSignupPhoto(this.files[0]);this.value=''" aria-label="${t('Ajouter ma photo')}"><input id="signup-photo-camera" type="file" accept="image/*" capture="user" hidden onchange="changeSignupPhoto(this.files[0]);this.value=''" aria-label="${t('Prendre une photo')}"><button type="button" class="btn small" onclick="document.getElementById('signup-photo-gallery').click()">${t('Ajouter ma photo')}</button><button type="button" class="btn small" onclick="document.getElementById('signup-photo-camera').click()">${t('Prendre une photo')}</button><button type="button" class="btn small" onclick="signupAvatar='';++profilePhotoSequence;refreshSignupPhoto()">${t('Supprimer')}</button></div></div>`}
function refreshSignupPhoto(){const preview=document.getElementById('signup-avatar-preview');if(!preview)return;const name=document.getElementById('regName')?.value.trim()||'Champion';preview.replaceChildren();const initial=document.createElement('span');initial.textContent=Array.from(name)[0]||'C';preview.append(initial);if(signupAvatar){const image=document.createElement('img');image.src=signupAvatar;image.alt='';preview.append(image)}}
async function changeSignupPhoto(file){const sequence=++profilePhotoSequence,active=()=>sequence===profilePhotoSequence&&!isLogged()&&authMode==='register';const avatar=await prepareProfilePhoto(file,active);if(avatar&&active()){signupAvatar=avatar;refreshSignupPhoto()}}
document.addEventListener('input',event=>{if(event.target.id==='regName')refreshSignupPhoto()});
function removeProfilePhoto(){
 ++profilePhotoSequence;
 try{ensureWritableDB();const next=JSON.parse(JSON.stringify(DB));next.profile.avatar='';commitUserDB(validateBackup(next))}
 catch{return toast(t('Photo non enregistrée. Vérifie le stockage disponible.'))}
 refreshProfileAvatars();toast(t('Photo de profil supprimée.'));
}
