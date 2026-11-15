/* FORGE — Assistant de première configuration */
function setupPage(){return `<div class="setup"><div class="setupbox">
<div class="card hero"><div class="eyebrow">${t("TON ESPACE, TON RYTHME")}</div><h1 style="font-size:42px;margin-top:8px">FORGE.</h1><p class="sub">${t("Ton entraînement, ta nutrition, tes habitudes et ta progression dans un seul espace.")}</p>
<label>${t("Prénom / pseudo")}</label><input id="setupName" placeholder="${t("Ex. Camille")}" value="${esc(DB.profile.name||AUTH[currentEmail()]?.name||'')}"><label>${t("Objectif")}</label><select id="setupGoal"><option value="Prise de masse">${t("Prise de masse")}</option><option value="Perte de poids">${t("Perte de poids")}</option><option selected value="Recomposition">${t("Recomposition")}</option><option value="Force">${t("Force")}</option><option value="Maintien">${t("Maintien")}</option></select>
<label>${t("Niveau")}</label><select id="setupLevel"><option value="Débutant">${t("Débutant")}</option><option selected value="Intermédiaire">${t("Intermédiaire")}</option><option value="Avancé">${t("Avancé")}</option></select><label>${t("Séances / semaine")}</label><input id="setupFreq" type="number" min="1" max="7" value="4">
<button class="btn primary wide" onclick="finishSetup()">${t("Créer mon espace →")}</button></div>
<p class="sub" style="text-align:center;margin-top:12px">${t("100% local au départ · tes données restent dans ce navigateur.")}</p></div></div>`}
function finishSetup(){
 const next=JSON.parse(JSON.stringify(DB));next.profile.setup=true;next.profile.name=document.getElementById('setupName').value.trim()||'Champion';next.profile.goal=document.getElementById('setupGoal').value;next.profile.level=document.getElementById('setupLevel').value;next.profile.perWeek=Math.max(1,Math.min(7,Math.round(+document.getElementById('setupFreq').value)||4));
 try{commitUserDB(validateBackup(next))}catch(error){return toast((t("Configuration non enregistrée.")+" ")+error.message.replace(t('Cette sauvegarde ne correspond pas au format Forge.'),t("Vérifie les valeurs saisies.")))}
 award(100,'Bienvenue dans FORGE');nav('home');
}
