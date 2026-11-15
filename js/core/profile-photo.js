/* DB.profile.avatar remains the only profile image source. */
let profilePhotoSequence=0;
function profileAvatar(className=''){
 const value=String(DB.profile.avatar||''),name=String(DB.profile.name||'Champion');
 const initial=Array.from(name.trim())[0]||'C';
 const image=/^(data:image\/|https?:\/\/|assets\/)/.test(value);
 return `<span class="forge-avatar ${className}" data-profile-avatar data-avatar-class="${esc(className)}" role="img" aria-label="${esc(t('Photo de profil')+' '+name)}"><span aria-hidden="true">${esc(initial)}</span>${image?`<img src="${esc(value)}" alt="" decoding="async" onerror="this.remove()">`:''}</span>`;
}
function profilePhotoControls(id,withPreview=true){return `<div class="forge-photo-controls">${withPreview?profileAvatar('profile-photo'):''}<div class="forge-photo-actions"><input id="${id}-gallery" type="file" accept="image/*" hidden onchange="changeProfilePhoto(this.files[0]);this.value=''" aria-label="${t('Choisir une photo')}"><input id="${id}-camera" type="file" accept="image/*" capture="user" hidden onchange="changeProfilePhoto(this.files[0]);this.value=''" aria-label="${t('Prendre une photo')}"><button type="button" class="btn small" onclick="document.getElementById('${id}-gallery').click()">${t('Choisir une photo')}</button><button type="button" class="btn small" onclick="document.getElementById('${id}-camera').click()">${t('Prendre une photo')}</button><button type="button" class="btn small" onclick="removeProfilePhoto()">${t('Supprimer')}</button></div></div>`}
function refreshProfileAvatars(){document.querySelectorAll('[data-profile-avatar]').forEach(el=>{el.outerHTML=profileAvatar(el.dataset.avatarClass||'')})}
async function changeProfilePhoto(file){
 if(!file)return;
 const sequence=++profilePhotoSequence,owner=currentEmail();
 const active=()=>sequence===profilePhotoSequence&&owner===currentEmail()&&isLogged();
 if(!/^image\//i.test(file.type))return toast(t('Choisis un fichier image valide.'));
 if(file.size>8*1024*1024)return toast(t('Photo trop volumineuse (8 Mo maximum).'));
 let url,avatar;
 try{
  url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();
  const width=image.naturalWidth,height=image.naturalHeight;
  if(!width||!height||width*height>40000000)throw new Error('image');
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const context=canvas.getContext('2d'),side=Math.min(width,height);
  context.fillStyle='#140c11';context.fillRect(0,0,256,256);
  context.drawImage(image,(width-side)/2,(height-side)/2,side,side,0,0,256,256);
  avatar=canvas.toDataURL('image/jpeg',.8);
 }catch{if(active())toast(t('Choisis un fichier image valide.'));return}
 finally{if(url)URL.revokeObjectURL(url)}
 if(!active())return;
 try{ensureWritableDB();const next=JSON.parse(JSON.stringify(DB));next.profile.avatar=avatar;commitUserDB(validateBackup(next),owner)}
 catch{return toast(t('Photo non enregistrée. Vérifie le stockage disponible.'))}
 refreshProfileAvatars();toast(t('Photo de profil enregistrée.'));
}
function removeProfilePhoto(){
 ++profilePhotoSequence;
 try{ensureWritableDB();const next=JSON.parse(JSON.stringify(DB));next.profile.avatar='';commitUserDB(validateBackup(next))}
 catch{return toast(t('Photo non enregistrée. Vérifie le stockage disponible.'))}
 refreshProfileAvatars();toast(t('Photo de profil supprimée.'));
}
