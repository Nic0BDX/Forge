let forgeSignupBodyType='male';
function forgeBodyType(){return DB.profile.bodyType==='female'?'female':'male'}
function forgeBodySource(){const type=forgeBodyType();return window.__forgePreviewImages?.[type==='female'?'body-female':'forge-body']||(type==='female'?'assets/body-female.png':'assets/images/forge-body.png')}
function bodyTypeCards(id,signup=false){const value=signup?forgeSignupBodyType:forgeBodyType();return `<fieldset class="forge-space"><legend>${t('Choisis ton espace')}</legend><div>${[['male','Homme'],['female','Femme']].map(([type,label])=>`<label><input id="${id}-${type}" name="${id}-body-type" type="radio" value="${type}" data-body-choice ${value===type?'checked':''} onchange="${signup?'forgeSignupBodyType=this.value':'setProfileBodyType(this.value)'}"><span>${t(label)}</span></label>`).join('')}</div></fieldset>`}
function setProfileBodyType(value){
 if(!['male','female'].includes(value))return;
 try{ensureWritableDB();const next=JSON.parse(JSON.stringify(DB));next.profile.bodyType=value;commitUserDB(validateBackup(next))}
 catch{document.querySelectorAll('input[data-body-choice]').forEach(el=>el.checked=el.value===forgeBodyType());toast(t('Choix non enregistré. Vérifie le stockage disponible.'));return}
 document.querySelectorAll('input[data-body-choice]').forEach(el=>el.checked=el.value===value);
 if(typeof forgeBody==='function'){document.querySelectorAll('.vf-body-mount').forEach(el=>{el.outerHTML=forgeBody(el.dataset.bodyKind||'hero')});if(typeof forgeApplyBodyMotion==='function')forgeApplyBodyMotion()}
}
function forgeBodyFallback(image){image.onerror=null;image.src='assets/body-neutral.svg';image.closest('.vf-body-mount')?.classList.add('is-neutral')}
function forgeBodyLoaded(image){if(!image.src.endsWith('body-neutral.svg')&&(image.naturalWidth!==1024||image.naturalHeight!==1536))forgeBodyFallback(image)}
