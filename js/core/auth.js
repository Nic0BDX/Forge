/* FORGE — Comptes locaux, connexion et indicateur de préparation (sans biométrie). */
let authReadIssue=false,authSessionChanged=false;
function loadAuth(){try{const accounts=JSON.parse(localStorage.getItem('forge_accounts_v1')||'{}');if(!plainRecord(accounts))throw new Error('accounts');authReadIssue=false;return accounts}catch{authReadIssue=true;return {}}}
function authFailure(key){const error=new Error(t(key));error.forgeAuth=true;return error}
function resolveAuthKey(value,accounts=AUTH){const raw=String(value||'').trim();if(Object.hasOwn(accounts,raw))return raw;const normalized=raw.toLowerCase(),matches=Object.keys(accounts).filter(key=>key.trim().toLowerCase()===normalized||String(accounts[key]?.email||'').trim().toLowerCase()===normalized);return matches.length===1?matches[0]:''}
function storedAccountData(value){const normalized=String(value||'').trim().toLowerCase();for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('forge_data_')&&key.slice(11).trim().toLowerCase()===normalized)return key}return ''}
async function saveAuth(key,change=AUTH[key],initialDB=null){
 const write=()=>{const accounts=loadAuth();if(authReadIssue)throw authFailure('Les comptes locaux ne peuvent pas être lus. Aucune donnée n’a été remplacée.');
  if(initialDB){if(resolveAuthKey(key,accounts))throw authFailure('Un compte existe déjà avec cet email. Connecte-toi.');if(storedAccountData(key))throw authFailure('Un carnet existe déjà pour cet email. Aucune donnée n’a été remplacée.');localStorage.setItem('forge_data_'+key,JSON.stringify(initialDB))}
  const merged={...accounts,[key]:{...accounts[key],...change}};localStorage.setItem('forge_accounts_v1',JSON.stringify(merged));AUTH=merged;
 };
 return navigator.locks?.request?navigator.locks.request('forge-accounts-v1',write):write();
}
function currentEmail(){const value=localStorage.getItem('forge_session_v1')||'';return resolveAuthKey(value)||value.trim()}
function isLogged(){const key=currentEmail();return !authReadIssue&&!authSessionChanged&&!!key&&Object.hasOwn(AUTH,key)&&(!storageDBOwner||storageDBOwner===key)}
window.addEventListener('storage',event=>{
 if(event.key!=='forge_accounts_v1'&&event.key!=='forge_session_v1')return;
 AUTH=loadAuth();
 if(authReadIssue||(event.key==='forge_session_v1'&&currentEmail()!==storageDBOwner)||(storageDBOwner&&!Object.hasOwn(AUTH,storageDBOwner))){
  authSessionChanged=true;if(typeof stopWorkoutRuntime==='function')stopWorkoutRuntime();authMode='login';authStep='form';render();setAuthError(t(authReadIssue?'Les comptes locaux ne peuvent pas être lus. Aucune donnée n’a été remplacée.':'La session a changé dans un autre onglet. Reconnecte-toi pour continuer.'));
 }
});
function hashPassword(password,salt){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+'::'+password)).then(b=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''))}
function makeSalt(){return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(x=>x.toString(16).padStart(2,'0')).join('')}
function setAuthError(msg){const el=document.getElementById('authError');if(el)el.textContent=msg||''}
function avatarStyle(url){const safe=String(url||'');return /^(data:image\/|https?:\/\/|assets\/)/.test(safe)?`background-image:url('${esc(safe)}')`:''}

function authWeights(){return `<div class="ea-photo ea-weights" aria-hidden="true"><svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" focusable="false"><defs><linearGradient id="weight-metal" x2="1" y2="1"><stop stop-color="#050405"/><stop offset=".48" stop-color="#12080c"/><stop offset=".54" stop-color="#702036"/><stop offset=".62" stop-color="#19090e"/><stop offset="1" stop-color="#030304"/></linearGradient></defs><g fill="url(#weight-metal)" stroke="#7d243a" stroke-width="2"><g class="ea-bar"><rect x="100" y="278" width="600" height="16" rx="8"/><rect x="160" y="208" width="34" height="156" rx="9"/><rect x="199" y="188" width="48" height="196" rx="12"/><rect x="553" y="188" width="48" height="196" rx="12"/><rect x="606" y="208" width="34" height="156" rx="9"/></g><g class="ea-disc"><circle cx="190" cy="465" r="76"/><circle cx="190" cy="465" r="55" fill="none"/><circle cx="190" cy="465" r="12" fill="#050405"/><path d="M190 408v22m0 70v22m-57-57h22m70 0h22"/></g><g class="ea-bell"><path d="M579 427c-40-58 64-58 24 0" fill="none" stroke-width="15"/><path d="M565 425q-53 91 26 92t26-92Z"/></g></g><g class="ea-dust" fill="#bd5266"><circle cx="290" cy="190" r="2"/><circle cx="480" cy="390" r="2"/><circle cx="670" cy="130" r="1.5"/><circle cx="110" cy="350" r="1.5"/><circle cx="380" cy="500" r="1"/></g></svg></div>`}
function authPage(){
 if(authMode==='forgot')return forgotPage();
 const login=authMode==='login';
 return `<div class="ea" data-step="${authStep}">
 ${authWeights()}
 <div class="ea-copy"><div class="ea-brand"><span class="vf-auth-f">f</span> forge.<small>${t("LE RYTHME QUI TE RESSEMBLE")}</small></div><h1 class="ea-title">${t("Trouve ton")}<br><em>${t("rythme.")}</em></h1><p class="ea-lead">${t("Plus qu'une app, une discipline.")}</p><p class="ea-description">${t("Tes séances, tes repères, tes progrès. Un espace pour avancer à ton rythme.")}</p><div class="ea-pillars"><span>${t("Entraînement")}</span><span>${t("Nutrition")}</span><span>${t("Progression")}</span></div></div>
 <section class="ea-panel">${languageSelector('authLanguage')}
  <div class="ea-actions"><button class="ea-btn red" onclick="goAuth('register')">${t("Créer mon espace")} ${ico('chev')}</button><button class="ea-btn dark" onclick="goAuth('login')">${t("Me connecter")}</button><p class="ea-welcome-note">${t("Un peu chaque jour. Beaucoup pour toi.")}</p></div>
  <form class="ea-form" onsubmit="event.preventDefault();${login?'loginAccount()':'registerAccount()'}">
   <button class="ea-back" type="button" onclick="authStep='welcome';render()">${ico('back')} ${t("Retour")}</button>
   <div class="ea-form-brand"><span class="vf-auth-f">f</span> forge.</div>
   <div class="ea-tabs"><button class="${login?'active':''}" type="button" onclick="switchAuth('login')">${t("Connexion")}</button><button class="${!login?'active':''}" type="button" onclick="switchAuth('register')">${t("Créer un compte")}</button></div>
   <div class="ea-h">${login?t("Bon retour."):t("Ton prochain chapitre.")}</div><div class="ea-sub">${login?t("Retrouve ton programme et reprends à ton rythme."):t("Un profil pour retrouver tes séances et tes progrès sur cet appareil.")}</div>
   ${login?`<label for="authEmail">${t("Email")}</label><input id="authEmail" type="email" required autocomplete="username" data-i18n-data-i18n-placeholder="toi@email.com" placeholder="${t("toi@email.com")}" data-i18n-placeholder="toi@email.com" placeholder="${t("toi@email.com")}" value="${esc(currentEmail())}"><label for="authPass">${t("Mot de passe")}</label><div class="password-wrap"><input id="authPass" type="password" required minlength="8" autocomplete="current-password" placeholder="••••••••"><button class="eye" type="button" onclick="togglePass('authPass',this)" aria-label="${t("Afficher le mot de passe")}">◉</button></div>`:`<label for="regName">${t("Prénom / pseudo")}</label><input id="regName" autocomplete="name" data-i18n-data-i18n-placeholder="Ex. Lucas" placeholder="${t("Ex. Lucas")}" data-i18n-placeholder="Ex. Lucas" placeholder="${t("Ex. Lucas")}"><label for="authEmail">${t("Email")}</label><input id="authEmail" type="email" required autocomplete="username" data-i18n-data-i18n-placeholder="toi@email.com" placeholder="${t("toi@email.com")}" data-i18n-placeholder="toi@email.com" placeholder="${t("toi@email.com")}"><label for="authPass">${t("Mot de passe")}</label><div class="password-wrap"><input id="authPass" type="password" required minlength="8" autocomplete="new-password" data-i18n-data-i18n-placeholder="8 caractères minimum" placeholder="${t("8 caractères minimum")}" data-i18n-placeholder="8 caractères minimum" placeholder="${t("8 caractères minimum")}"><button class="eye" type="button" onclick="togglePass('authPass',this)" aria-label="${t("Afficher le mot de passe")}">◉</button></div>${bodyTypeCards('signup-space',true)}${signupPhotoControls()}`}
   ${login?`<div style="text-align:right;margin:-4px 0 4px"><button type="button" class="auth-link" onclick="goForgot()">${t("Mot de passe oublié ?")}</button></div>`:''}<div id="authError" class="auth-error" role="alert"></div><button id="authSubmit" type="submit" class="ea-btn red">${login?t("Me connecter"):t("Créer mon espace")}</button>
   <div class="auth-meta"><span>${t("Compte local à ce navigateur")}</span>${login?`<button type="button" class="auth-link" onclick="switchAuth('register')">${t("Nouveau ici ?")}</button>`:`<button type="button" class="auth-link" onclick="switchAuth('login')">${t("J’ai déjà un compte")}</button>`}</div>
   <div class="security-note">${t("Ton profil et tes données restent dans ce navigateur. Pense à les exporter pour les conserver.")}</div>
  </form>
 </section></div>`;
}
function goAuth(mode){authMode=mode;authStep='form';render()}
function switchAuth(mode){authMode=mode;authStep='form';setAuthError('');render()}
function pickAvatar(i){selectedAvatar=i;document.querySelectorAll('.avatar-option').forEach((button,index)=>{button.classList.toggle('selected',index===i);button.setAttribute('aria-pressed',String(index===i))})}
function togglePass(id,btn){const el=document.getElementById(id);if(!el)return;el.type=el.type==='password'?'text':'password';btn.textContent=el.type==='password'?'◉':'◌';btn.setAttribute('aria-label',t(el.type==='password'?'Afficher le mot de passe':'Masquer le mot de passe'))}
async function registerAccount(){
 const email=(document.getElementById('authEmail')?.value||'').trim().toLowerCase(),pass=document.getElementById('authPass')?.value||'',name=(document.getElementById('regName')?.value||'Champion').trim();
 if(!/^\S+@\S+\.\S+$/.test(email))return setAuthError(t("Entre une adresse email valide."));
 if(pass.length<8)return setAuthError(t("Le mot de passe doit contenir au moins 8 caractères."));
 if(name.length>150)return setAuthError(t("Le prénom ou pseudo doit contenir au maximum 150 caractères."));
 AUTH=loadAuth();if(authReadIssue)return setAuthError(t('Les comptes locaux ne peuvent pas être lus. Aucune donnée n’a été remplacée.'));
 if(resolveAuthKey(email))return setAuthError(t("Un compte existe déjà avec cet email. Connecte-toi."));
 if(storedAccountData(email))return setAuthError(t('Un carnet existe déjà pour cet email. Aucune donnée n’a été remplacée.'));
 const salt=makeSalt(),hash=await hashPassword(pass,salt);
 const rec=makeRecoveryCode(),recSalt=makeSalt(),recHash=await hashPassword(rec,recSalt);
 const account={email,name:name||'Champion',salt,hash,recSalt,recHash,createdAt:new Date().toISOString()},next=defaultDB();next.profile.setup=false;next.profile.bodyType=forgeSignupBodyType==='female'?'female':'male';next.profile.name=name||'Champion';next.profile.avatar=signupAvatar;
 await saveAuth(email,account,validateBackup(next));localStorage.setItem('forge_session_v1',email);DB=next;storageDBOwner=email;storageReadIssue=null;authSessionChanged=false;signupAvatar='';showFaceUnlock('register');showRecoveryCode(rec);
}
async function loginAccount(){
 const input=(document.getElementById('authEmail')?.value||'').trim(),pass=document.getElementById('authPass')?.value||'';
 AUTH=loadAuth();if(authReadIssue)return setAuthError(t('Les comptes locaux ne peuvent pas être lus. Aucune donnée n’a été remplacée.'));
 const email=resolveAuthKey(input),account=email?AUTH[email]:null;if(!account)return setAuthError(t(storedAccountData(input)?'Le carnet est présent, mais les identifiants locaux sont introuvables. Aucune donnée n’a été remplacée.':'Compte introuvable. Vérifie ton email ou crée un compte.'));
 const hash=await hashPassword(pass,account.salt);if(hash!==account.hash)return setAuthError(t("Mot de passe incorrect."));
 localStorage.setItem('forge_session_v1',email);authSessionChanged=false;DB=loadUserDB(email);if(!currentStorageIssue()){if(DB.profile.avatar==null)DB.profile.avatar=account.avatar;save()}showFaceUnlock('login');
}
function loadUserDB(email){return readStoredDB('forge_data_'+email,email)}
function saveUserDB(){ensureWritableDB();const e=currentEmail();if(e)return commitUserDB(DB,e)}
function logout(){if(!suspendWorkout())return;if(!currentStorageIssue())saveUserDB();localStorage.removeItem('forge_session_v1');try{sessionStorage.removeItem('forge_welcome_seen_v1')}catch{}storageReadIssue=null;view='home';authMode='login';authStep='welcome';render();toast(t("Déconnexion effectuée."))}
function showFaceUnlock(mode){const owner=currentEmail(),m=document.getElementById('faceModal');if(!m){document.body.insertAdjacentHTML('beforeend',faceModal());}const el=document.getElementById('faceModal');el.classList.add('show');el.classList.remove('success');document.getElementById('faceTitle').textContent=mode==='register'?t("Création de ton espace…"):t("Connexion à ton espace…");setTimeout(()=>{el.classList.add('success');document.getElementById('faceTitle').textContent=t("Ton espace est prêt");document.getElementById('faceSub').textContent=t("Bienvenue dans Forge");},350);setTimeout(()=>{el.classList.remove('show');if(owner!==currentEmail()||!isLogged())return;playWelcomeVideo(()=>{if(owner!==currentEmail()||!isLogged())return;DB=loadUserDB(owner);view=DB.profile.setup?'home':'setup';render()});},700)}
function faceModal(){return `<div id="faceModal" class="face-modal"><div class="face-box"><div class="face-scan"><div class="face-icon"><span class="face-emoji">◉</span><span class="checkmark">✓</span></div></div><div id="faceTitle" class="face-title">${t("Préparation de ton espace…")}</div><div id="faceSub" class="face-sub">${t("Tes repères, au même endroit")}</div></div></div>`}

function makeRecoveryCode(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',r=crypto.getRandomValues(new Uint8Array(12));const c=Array.from(r,x=>a[x%a.length]).join('');return c.slice(0,4)+'-'+c.slice(4,8)+'-'+c.slice(8,12)}
function showRecoveryCode(code){document.getElementById('modalbox').innerHTML=`<div class="cele"><h2>${t("Ton code de récupération")}</h2><p class="sub">${t("Note-le maintenant : il ne sera plus affiché. Il te permettra de redéfinir ton mot de passe si tu l’oublies.")}</p><div class="rec-code">${code}</div><button class="ea-btn red" onclick="closeModal()">${t("J’ai noté mon code")}</button></div>`;openModal()}
function goForgot(){authMode='forgot';authStep='form';render()}
function forgotPage(){
 return `<div class="ea" data-step="form">${authWeights()}
 <div class="ea-copy"><div class="ea-brand"><span class="vf-auth-f">f</span> forge.<small>${t("LE RYTHME QUI TE RESSEMBLE")}</small></div><h1 class="ea-title">${t("Trouve ton")}<br><em>${t("rythme.")}</em></h1></div>
 <section class="ea-panel">${languageSelector('authLanguage')}<div class="ea-form"><button class="ea-back" type="button" onclick="switchAuth('login')" style="display:flex">${ico('back')} ${t("Retour")}</button>
  <div class="ea-h">${t("Mot de passe oublié")}</div><div class="ea-sub">${t("Entre ton email, le code de récupération affiché lors de l’inscription et ton nouveau mot de passe.")}</div>
  <label for="authEmail">${t("Email")}</label><input id="authEmail" type="email" required autocomplete="username" data-i18n-data-i18n-placeholder="toi@email.com" placeholder="${t("toi@email.com")}" data-i18n-placeholder="toi@email.com" placeholder="${t("toi@email.com")}">
  <label>${t("Code de récupération")}</label><input id="recCode" autocomplete="off" autocapitalize="characters" placeholder="XXXX-XXXX-XXXX">
  <label>${t("Nouveau mot de passe")}</label><div class="password-wrap"><input id="authPass" type="password" required minlength="8" autocomplete="new-password" data-i18n-data-i18n-placeholder="8 caractères minimum" placeholder="${t("8 caractères minimum")}" data-i18n-placeholder="8 caractères minimum" placeholder="${t("8 caractères minimum")}"><button class="eye" type="button" onclick="togglePass('authPass',this)" aria-label="${t("Afficher le mot de passe")}">◉</button></div>
  <div id="authError" class="auth-error" role="alert"></div><button id="authSubmit" class="ea-btn red" onclick="resetPassword()">${t("Réinitialiser le mot de passe")}</button>
  <div class="security-note">${t("Les comptes sont stockés dans ce navigateur : sans code de récupération, un mot de passe oublié ne peut pas être réinitialisé pour les comptes créés avant cette version.")}</div></div></section></div>`}
async function resetPassword(){
 const input=(document.getElementById('authEmail')?.value||'').trim(),code=(document.getElementById('recCode')?.value||'').trim().toUpperCase(),pass=document.getElementById('authPass')?.value||'';
 AUTH=loadAuth();if(authReadIssue)return setAuthError(t('Les comptes locaux ne peuvent pas être lus. Aucune donnée n’a été remplacée.'));const email=resolveAuthKey(input);
 const a=AUTH[email];
 if(!/^\S+@\S+\.\S+$/.test(input))return setAuthError(t("Entre une adresse email valide."));
 if(!a)return setAuthError(t("Compte introuvable. Vérifie ton email."));
 if(!a.recHash)return setAuthError(t("Ce compte n’a pas de code de récupération. Connecte-toi avec ton mot de passe actuel."));
 if(pass.length<8)return setAuthError(t("Le nouveau mot de passe doit contenir au moins 8 caractères."));
 setAuthBusy(true,t("Vérification…"));
 const h=await hashPassword(code,a.recSalt);
 if(h!==a.recHash){setAuthBusy(false);return setAuthError(t("Code de récupération incorrect."))}
 const salt=makeSalt(),hash=await hashPassword(pass,salt);await saveAuth(email,{salt,hash});setAuthBusy(false);
 authMode='login';authStep='form';render();toast(t("Mot de passe mis à jour. Connecte-toi."));
}
function setAuthBusy(on,label){const b=document.getElementById('authSubmit');if(!b)return;if(on){b.dataset.label=b.textContent;b.textContent=label||t("Chargement…");b.disabled=true;b.classList.add('busy')}else{b.textContent=b.dataset.label||b.textContent;b.disabled=false;b.classList.remove('busy')}}
const _loginAccount=loginAccount,_registerAccount=registerAccount;
loginAccount=async function(){setAuthBusy(true,t("Connexion…"));try{await _loginAccount()}catch{setAuthError(t("Connexion impossible dans ce navigateur. Réessaie depuis une adresse HTTPS ou un serveur local."))}finally{setAuthBusy(false)}};
registerAccount=async function(){setAuthBusy(true,t("Création…"));try{await _registerAccount()}catch(error){setAuthError(error.forgeAuth?error.message:t(error.name==='QuotaExceededError'?'Enregistrement impossible : stockage insuffisant. Les données existantes sont conservées.':'Création impossible. Vérifie que le stockage est disponible et utilise HTTPS ou un serveur local.'))}finally{setAuthBusy(false)}};
