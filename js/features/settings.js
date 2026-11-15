/* FORGE — Paramètres, export / import */
function settings(){
 return `<div class="row"><div><div class="eyebrow">${t("PARAMÈTRES")}</div><h1>${t("Paramètres")}</h1></div>${languageSelector('settingsLanguage')}</div>
 <section class="card theme-switch-card" style="margin-top:16px"><div><h2>${t("Apparence")}</h2><p class="sub">${t("Thème")} ${DB.settings.theme==='dark'?t("sombre"):t("clair")}</p></div><button class="btn" onclick="toggleTheme()">${ico(DB.settings.theme==='dark'?'sun':'moon')} ${t("Changer de thème")}</button></section><div class="grid g2" style="margin-top:16px"><div class="card"><h2>${t("Profil")}</h2><label>${t("Nom")}</label><input id="sn" value="${esc(DB.profile.name)}"><label>${t("Avatar")}</label><input id="sa" value="${esc(DB.profile.avatar)}"><label>${t("Bio")}</label><textarea id="sb">${esc(DB.profile.bio)}</textarea><label>${t("Objectif")}</label><input id="sg" value="${esc(DB.profile.goal)}"><button class="btn primary wide" onclick="saveSettings()">${t("Enregistrer")}</button></div>
 <div class="card"><h2>${t("Objectifs quotidiens")}</h2><p class="sub">${t("Ces valeurs de départ sont à adapter à tes besoins. Forge ne les calcule pas à partir de ton profil.")}</p><label>${t("Calories")}</label><input id="scal" type="number" value="${DB.settings.calories}"><label>${t("Protéines (g)")}</label><input id="spr" type="number" value="${DB.settings.protein}"><label>${t("Glucides (g)")}</label><input id="scb" type="number" value="${DB.settings.carbs}"><label>${t("Lipides (g)")}</label><input id="sfa" type="number" value="${DB.settings.fat}"><label>${t("Eau (ml)")}</label><input id="swa" type="number" value="${DB.settings.water}"><button class="btn primary wide" onclick="saveTargets()">${t("Enregistrer")}</button></div></div>
 <div class="card" style="margin-top:14px"><h2>${t("Compte")}</h2><div class="row wrap"><div><b>${esc(currentEmail())}</b><div class="sub">${t("Compte local FORGE")}</div></div><button class="btn danger" onclick="logout()">${t("Se déconnecter")}</button></div></div><div class="card" style="margin-top:14px"><h2>${t("Données")}</h2><div class="row wrap"><button class="btn" onclick="exportData()">${t("Exporter JSON")}</button><button class="btn" onclick="document.getElementById('importFile').click()">${t("Importer JSON")}</button><input id="importFile" type="file" accept=".json,application/json" style="display:none" onchange="importData(this.files[0]);this.value=''"><button class="btn danger" onclick="wipe()">${t("Effacer le carnet de ce compte")}</button></div><p class="sub">${t("Le fichier exporté contient ton carnet, pas ton mot de passe ni ton code de récupération. La séance en cours est conservée séparément dans ce navigateur et n’est pas incluse dans le fichier. Pour la sauvegarder dans ton historique, termine-la avant l’export.")}</p></div>`;
}
function saveSettings(){
 const next=JSON.parse(JSON.stringify(DB));next.profile.name=document.getElementById('sn').value.trim()||'Champion';next.profile.avatar=document.getElementById('sa').value||'🏋️';next.profile.bio=document.getElementById('sb').value;next.profile.goal=document.getElementById('sg').value;
 try{const validated=validateBackup(next);commitUserDB(validated)}catch(error){return toast(t("Profil non enregistré. ")+t(error.message==='Cette sauvegarde ne correspond pas au format Forge.'?'Vérifie les valeurs saisies.':error.message))}
 toast(t("Profil enregistré"));render();
}
function saveTargets(){
 const next=JSON.parse(JSON.stringify(DB));
 for(const [field,input] of [['calories','scal'],['protein','spr'],['carbs','scb'],['fat','sfa'],['water','swa']]){
  const value=Number(document.getElementById(input).value);if(!Number.isFinite(value)||value<=0)return toast(t("Chaque objectif doit être un nombre supérieur à 0."));next.settings[field]=value;
 }
 try{commitUserDB(validateBackup(next))}catch{return toast(t("Objectifs non enregistrés. Vérifie que le stockage est disponible."))}
 toast(t("Objectifs enregistrés"));render();
}
let pendingBackupImport=null,backupImportSequence=0;
function downloadCarnet(text,name){const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function exportData(){
 if(currentStorageIssue())return exportRecoveryData();
 const backup={...DB,_forgeBackup:{format:'forge-carnet',version:FORGE_BACKUP_VERSION,exportedAt:new Date().toISOString()}};
 downloadCarnet(JSON.stringify(backup,null,2),`forge-backup-${today()}.json`);toast(t("Copie de ton carnet exportée."));
}
function exportRecoveryData(){
 const issue=currentStorageIssue();if(!issue)return;
 try{const raw=localStorage.getItem(issue.key);if(raw===null)throw new Error('Carnet absent');downloadCarnet(raw,`forge-recuperation-${today()}.json`)}catch{toast(t("Le fichier local ne peut pas être lu. Aucun carnet n’a été remplacé."))}
}
function storageRecoveryPage(){
 const issue=currentStorageIssue();
 return `<main class="setup storage-recovery"><section class="setupbox card"><div class="eyebrow">${t("RÉCUPÉRATION DU CARNET")}</div><h1>${t("Ton carnet a besoin d’attention")}</h1><p class="sub">${t("Le carnet de")} ${esc(currentEmail())} ${t("n’a pas pu être ouvert. Le fichier enregistré est conservé : aucune nouvelle donnée ne le remplace automatiquement.")}</p><p role="alert">${esc(issue?.message||t("Le format de ce carnet ne peut pas être lu."))}</p><p class="sub">${t("Exporte d’abord le fichier de secours pour en garder une copie. Tu peux ensuite importer une sauvegarde valide, ou choisir d’effacer uniquement le carnet de ce compte.")}</p><div class="grid" style="gap:12px"><button class="btn primary wide" onclick="exportRecoveryData()">${t("Exporter le fichier de secours")}</button><button class="btn wide" onclick="document.getElementById('importFile').click()">${t("Importer une sauvegarde")}</button><input id="importFile" type="file" accept=".json,application/json" style="display:none" onchange="importData(this.files[0]);this.value=''"><button class="btn danger wide" onclick="wipe()">${t("Effacer le carnet de ce compte")}</button><button class="btn ghost wide" onclick="logout()">${t("Se déconnecter")}</button></div></section></main>`;
}
function cancelBackupImport(){pendingBackupImport=null;closeModal()}
function importData(file){
 if(!file)return;
 pendingBackupImport=null;
 const sequence=++backupImportSequence,owner=currentEmail();
 if(!owner||!AUTH[owner])return toast(t("Connecte-toi au compte dont tu veux remplacer le carnet."));
 if(file.size>FORGE_BACKUP_MAX_BYTES)return toast(t("Ce fichier dépasse la taille maximale de 16 Mo."));
 const reader=new FileReader();
 reader.onerror=()=>toast(t("Ce fichier n’a pas pu être lu. Ton carnet n’a pas été modifié."));
 reader.onload=()=>{
  if(sequence!==backupImportSequence)return;
  if(owner!==currentEmail())return toast(t("Le compte a changé. Recommence l’import depuis le compte souhaité."));
  let source,staged;
  try{source=JSON.parse(reader.result)}catch{return toast(t("Ce fichier n’est pas un fichier JSON lisible."))}
  try{staged=validateBackup(source)}catch(error){return toast(error.message)}
  pendingBackupImport={owner,staged,sequence};
  const unknown=Object.keys(staged).filter(key=>!(key in defaultDB())&&!['photoNotice','workoutDraftResetAt'].includes(key)).length;
  const hasDraft=!!session||!!readWorkoutDraft();
  document.getElementById('modalbox').innerHTML=`<div class="backup-preview"><div class="eyebrow">${t("IMPORTER UNE SAUVEGARDE")}</div><h2>${t("Vérifie ta sauvegarde")}</h2><p class="sub">${t("Cette sauvegarde remplacera le carnet de ce compte dans ce navigateur. Exporte ton carnet actuel si tu veux le conserver.")}</p><p><b>${t("Compte :")}</b> ${esc(owner)}</p><div class="grid g3" style="margin:18px 0"><div class="stat"><b>${staged.sessions.length}</b><small>${t("Séances")}</small></div><div class="stat"><b>${staged.meals.length}</b><small>${t("Repas")}</small></div><div class="stat"><b>${staged.photos.length}</b><small>${t("Photos")}</small></div></div><p class="sub">${staged.programs.length} ${t("programme")}${staged.programs.length>1?'s':''} · ${staged.habits.length} ${t("habitude")}${staged.habits.length===1?'':'s'} · ${t("profil")} ${esc(staged.profile.name||t("sans prénom"))}</p>${source._forgeBackup?'':`<p class="sub">${t("Sauvegarde ancienne reconnue : les réglages manquants seront complétés.")}</p>`}${source.activeProgram&&staged.activeProgram===null?`<p class="sub">${t("Le programme actif n’existe plus dans ce fichier. Les programmes présents sont conservés ; tu pourras en activer un.")}</p>`:''}${unknown?`<p class="sub">${unknown} ${t("champ")}${unknown>1?'s':''} ${t("supplémentaire")}${unknown>1?'s':''} ${t("conservé")}${unknown>1?'s':''} ${t("dans le carnet.")}</p>`:''}${hasDraft?`<p>${t("Ta séance en cours sera abandonnée seulement si le remplacement réussit.")}</p>`:''}<p class="sub">${t("Ton compte, ton mot de passe et les autres profils ne seront pas modifiés.")}</p><div class="row gap wrap" style="margin-top:18px"><button class="btn primary" onclick="confirmBackupImport()">${t("Remplacer mon carnet")}</button><button class="btn" onclick="cancelBackupImport()">${t("Annuler")}</button></div></div>`;
  openModal();
 };
 reader.readAsText(file);
}
function confirmBackupImport(){
 const pending=pendingBackupImport;if(!pending)return;
 if(pending.owner!==currentEmail()||!AUTH[pending.owner]){pendingBackupImport=null;closeModal();return toast(t("Le compte a changé. Recommence l’import depuis le compte souhaité."))}
 const next={...pending.staged,workoutDraftResetAt:Date.now()};
 try{commitUserDB(next,pending.owner)}catch{return toast(t("Le carnet n’a pas pu être enregistré. Tes données précédentes sont conservées."))}
 pendingBackupImport=null;clearWorkoutDraft(pending.owner);stopWorkoutRuntime();window.lastSummary=null;
 closeModal();view=DB.profile.setup?'home':'setup';render();toast(t("Sauvegarde importée. Ton carnet est prêt."));
}
function wipe(){
 const owner=currentEmail();
 if(!confirm(t("Effacer le carnet de ce compte ? Séances, repas, photos et séance en cours seront supprimés de ce navigateur. Le compte et les autres profils seront conservés.")))return;
 const next={...defaultDB(),workoutDraftResetAt:Date.now()};
 try{commitUserDB(next,owner)}catch{return toast(t("Le carnet n’a pas pu être effacé. Tes données précédentes sont conservées."))}
 pendingBackupImport=null;clearWorkoutDraft(owner);stopWorkoutRuntime();window.lastSummary=null;closeModal();view='setup';render();toast(t("Le carnet de ce compte a été effacé."));
}
