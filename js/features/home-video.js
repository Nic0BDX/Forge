/* Accueil Forge : composition de la vidéo, données du carnet et lumière décorative. */
const forgeCounterFrames=new WeakMap();
const forgeVisibleBodies=new WeakMap(),forgeObservedBodies=new Set();
let forgeBodyObserver;
function forgeObserveBodies(){
 if(!forgeBodyObserver&&typeof IntersectionObserver!=='undefined')forgeBodyObserver=new IntersectionObserver(entries=>{for(const entry of entries)forgeVisibleBodies.set(entry.target,entry.isIntersecting&&entry.intersectionRatio>0);forgeApplyBodyMotion(false)},{threshold:[0,.01]});
 for(const el of forgeObservedBodies)if(!el.isConnected){forgeBodyObserver?.unobserve(el);forgeObservedBodies.delete(el)}
 document.querySelectorAll('.vf-body-mount').forEach(el=>{if(!forgeObservedBodies.has(el)){forgeObservedBodies.add(el);forgeVisibleBodies.set(el,!forgeBodyObserver);forgeBodyObserver?.observe(el)}});
}
Object.assign(IC,{heart:'<path d="M20.4 5.6a5 5 0 0 0-7.1 0L12 6.9l-1.3-1.3a5 5 0 0 0-7.1 7.1L12 21l8.4-8.3a5 5 0 0 0 0-7.1Z"/>',walk:'<circle cx="13" cy="4" r="2"/><path d="m7 12 3-5 4 1 3 5 4 1M10 8l1 7-5 6M11 15l5 6M5 7l4 1"/>',stand:'<circle cx="12" cy="4" r="2"/><path d="M8 22V11M16 22V11M6 14V9c0-3 12-3 12 0v5M12 14v8"/>'});
function forgeToggleBodyMotion(){
 const previous=DB.settings.bodyMotion;DB.settings.bodyMotion=previous===false;
 try{save()}catch{DB.settings.bodyMotion=previous;return toast(t("Le réglage d’animation n’a pas pu être enregistré."))}
 forgeApplyBodyMotion();
}
function forgeApplyBodyMotion(observe=true){
 if(observe)forgeObserveBodies();
 const on=DB.settings.bodyMotion!==false;
 document.querySelectorAll('.vf-body-mount').forEach(el=>el.classList.toggle('is-paused',!on||document.hidden||!forgeVisibleBodies.get(el)));
 document.querySelectorAll('.vf-motion-toggle').forEach(el=>{el.setAttribute('aria-pressed',String(on));el.setAttribute('aria-label',on?t("Mettre en pause l’animation du corps"):t("Animer le corps"));el.innerHTML=on?ico('pause'):ico('play')});
}
function forgeBody(kind='hero'){
 const src=forgeBodySource();
 return `<div class="vf-body-mount ${DB.settings.bodyMotion===false?'is-paused':''} vf-body-${kind}" data-body-kind="${kind}" data-body-type="${forgeBodyType()}" aria-hidden="true"><img class="vf-body-image" src="${src}" onerror="forgeBodyFallback(this)" onload="forgeBodyLoaded(this)" alt="" width="1024" height="1536" decoding="async" ${kind==='hero'?'fetchpriority="high"':'loading="lazy"'}>${forgeBodyOverlay()}</div>`;
}
function forgeBodyOverlay(){const mask=new URL('assets/veins-'+forgeBodyType()+'.png',document.baseURI).href;return `<div class="vf-body-glow vf-vein-map" style="--vein-mask:url('${mask}')"><span class="vf-vein-base"></span><span class="vf-vein-pulse vf-vein-a"></span><span class="vf-vein-pulse vf-vein-b"></span><span class="vf-vein-pulse vf-vein-c"></span></div>`}
function forgeActivityMetric(label,value,unit,goal,icon){
 return `<div class="vf-stat">${vfIcon(icon)}<span>${label}</span><b>${value===null?'—':vfCount(value,value%1?1:0)}<small>${unit}</small></b><em>/ ${vfNumber(goal)}</em></div>`;
}
vfRings=function(values,label=t("Progression des calories actives, des minutes d’exercice et des heures debout")){
 return `<div class="vf-rings"><svg viewBox="0 0 200 200" role="img" aria-label="${esc(label)}">${[80,64,48].map((r,i)=>`<circle class="vf-ring-track" cx="100" cy="100" r="${r}"/><circle class="vf-ring-value ring-${i}" cx="100" cy="100" r="${r}" pathLength="100" style="--ring:${Math.max(0,Math.min(100,values[i]||0))}" transform="rotate(-90 100 100)"/>`).join('')}</svg><span>${ico('walk')}</span></div>`;
};
vfActivityCard=function(){
 const activity=forgeActivitySummary(vfActivityPeriod),days=activity.days,goals=[DB.settings.activityCalories*days,DB.settings.exerciseMinutes*days,DB.settings.standHours*days],values=[activity.activeCalories,activity.exerciseMinutes,activity.standHours];
 return `<section class="vf-card vf-activity">${vfCardHead(t("Mon activité"),vfPeriod('vf-activite',vfActivityPeriod,'vfActivityRange'))}${vfRings(values.map((v,i)=>(v||0)/Math.max(1,goals[i])*100))}<div class="vf-ring-stats">${forgeActivityMetric(t("Bouger"),values[0],'kcal',goals[0],'flame')}${forgeActivityMetric(t("Exercice"),values[1],'min',goals[1],'train')}${forgeActivityMetric(t("Debout"),values[2],'h',goals[2],'stand')}</div><button class="vf-activity-entry" onclick="openActivityModal()" aria-label="${t("Ajouter mes relevés d’activité")}">${t("Ajouter mes relevés")} ${ico('plus')}</button></section>`;
};
function forgeStepsSpark(){
 const dates=Array.from({length:7},(_,i)=>vfDateAgo(6-i)),values=dates.map(date=>DB.steps[date]??null),known=values.filter(v=>v!==null),max=Math.max(1,...known),min=Math.min(0,...known);let line='',connected=false;
 const x=i=>5+i*17,y=value=>40-(value-min)/Math.max(1,max-min)*32;
 values.forEach((value,i)=>{if(value===null){connected=false;return}line+=(connected?'L':'M')+x(i)+' '+y(value)+' ';connected=true});
 return `<svg class="vf-steps-spark" viewBox="0 0 114 46" role="img" aria-label="${t("Pas enregistrés sur les sept derniers jours")}">${line?`<path class="vf-chart-line" pathLength="1" d="${line}"/>`:''}${values.map((value,i)=>value===null?'':`<circle cx="${x(i)}" cy="${y(value)}" r="2.5" class="vf-chart-point"><title>${fmtDate(dates[i])} : ${vfNumber(value)} ${t("pas")}</title></circle>`).join('')}</svg>`;
}
vfStepsCard=function(){
 const count=DB.steps[vfDateAgo(0)]??null,goal=DB.settings.steps||8000,activity=forgeActivityDay(),percent=count===null?null:Math.round(count/goal*100);
 return `<section id="vf-daily-steps" class="vf-card vf-week-volume vf-daily-steps">${vfCardHead(t("Pas du jour"),`<button class="vf-text-link" onclick="vfOpenSteps()">${t("Ajouter")} `+ico('plus')+'</button>','trend')}<div class="vf-steps-summary"><strong>${count===null?'—':vfCount(count)}<small> / ${vfNumber(goal)} ${t("pas")}</small></strong>${forgeStepsSpark()}</div><div class="vf-steps-progress"><div class="vf-progress-track"><i style="--progress:${Math.min(100,percent||0)}%"></i></div><span>${percent===null?t("À renseigner"):percent+' %'}</span></div><div class="vf-volume-details"><div><span>${t("Distance")}</span><b>${activity.distanceKm===null?'—':vfCount(activity.distanceKm,1)}<small> km</small></b></div><div><span>${t("Calories actives")}</span><b>${activity.activeCalories===null?'—':vfCount(activity.activeCalories)}<small> kcal</small></b></div><div><span>${t("Étages")}</span><b>${activity.floors===null?'—':vfCount(activity.floors)}</b></div></div><button class="vf-text-link vf-steps-entry" onclick="openActivityModal()">${t("Compléter mes relevés")} ${ico('chev')}</button></section>`;
};
function forgeHomeDashboard(){
 const pulse=vfPulseRecords().filter(p=>p.date<=vfDateAgo(0)).sort((a,b)=>a.date.localeCompare(b.date)).at(-1)?.value??'—',day=forgeActivityDay();
 return `<div class="vf-dashboard eh"><div class="vf-top-grid"><section class="vf-card vf-hero vf-overview"><div class="vf-hero-copy eh-head"><p>${t("Bonjour,")} ${esc(DB.profile.name||t("Membre Forge"))}</p><h1>${t("Vue d’ensemble")} ${ico('bolt')}</h1><p>${t("Plus qu’une app, une discipline.")}<br>${t("Un peu plus loin, chaque jour.")}</p></div>${forgeBody()}<div class="vf-hero-stats">${vfStat(t("Pouls"),pulse,'BPM','heart',pulse==='—'?t("À renseigner"):t("Dernier relevé"))}${vfStat(t("Énergie"),day.energy??'—','%','bolt',day.energy===null?t("À renseigner"):t("Ressentie"))}${vfStat(t("Récupération"),day.recovery??'—','%','flame',day.recovery===null?t("À renseigner"):t("Ressentie"))}</div><button class="vf-hero-edit" onclick="openActivityModal()" aria-label="${t("Renseigner mon énergie et ma récupération")}" title="${t("Renseigner mon ressenti")}">${ico('plus')}</button><button class="vf-motion-toggle" onclick="forgeToggleBodyMotion()" aria-pressed="${DB.settings.bodyMotion!==false}" aria-label="${DB.settings.bodyMotion!==false?t("Mettre en pause l’animation du corps"):t("Animer le corps")}">${DB.settings.bodyMotion!==false?ico('pause'):ico('play')}</button></section><nav class="vf-home-jumps" aria-label="${t("Accès rapide au dashboard")}"><a href="#vf-daily-steps">${ico('trend')} ${t("Pas du jour")}</a><button onclick="openActivityModal()">${ico('plus')} ${t("Mes relevés")}</button></nav>${vfActivityCard()}${vfMacroCard()}</div><div class="vf-mid-grid">${vfSleepCard()}${vfPulseCard()}${vfUpcoming()}</div><div class="vf-bottom-grid">${vfStepsCard()}<section class="vf-card vf-motivation"><div><span class="vf-kicker">${t("UN PEU PLUS LOIN, CHAQUE JOUR")}</span><h2>${t("Ta discipline.")}<br>${t("Ta progression.")} <em>Forge.</em></h2><p>${t("Retrouve ton programme et construis la suite.")}</p><button class="btn primary eh-go" onclick="nav('program')">${t("Voir mon programme")} ${ico('chev')}</button></div>${forgeBody('motivation')}</section></div><section class="vf-home-tools"><button class="btn" onclick="openMealModal()">${ico('plus')} ${t("Ajouter un repas")}</button><button class="btn" onclick="nav('habits')">${ico('habit')} ${t("Mes habitudes")}</button><button class="btn" onclick="nav('goals')">${ico('goals')} ${t("Mes objectifs")}</button><button class="btn" onclick="nav('history')">${ico('clock')} ${t("Historique")}</button><button class="btn" onclick="nav('exercises')">${ico('book')} ${t("Exercices")}</button></section></div>`;
}
pages.home=forgeHomeDashboard;
vfAnimate=function(){
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.querySelectorAll('#root [data-vf-count]').forEach(el=>{
  const old=forgeCounterFrames.get(el);if(old)cancelAnimationFrame(old);
  const value=Number(el.dataset.vfCount),places=Number(el.dataset.decimals)||0;
  if(reduce){el.textContent=vfNumber(value,places);forgeCounterFrames.delete(el);return}
  const start=performance.now();
  function step(now){if(!el.isConnected){forgeCounterFrames.delete(el);return}const progress=Math.min(1,(now-start)/850);el.textContent=vfNumber(value*(1-Math.pow(1-progress,3)),places);if(progress<1)forgeCounterFrames.set(el,requestAnimationFrame(step));else forgeCounterFrames.delete(el)}
  forgeCounterFrames.set(el,requestAnimationFrame(step));
 });
 forgeApplyBodyMotion();
};
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>vfAnimate());
document.addEventListener('visibilitychange',()=>forgeApplyBodyMotion());

const forgeOriginalUpcoming=vfUpcoming;
vfUpcoming=function(){const src=forgeBodySource();return forgeOriginalUpcoming().replaceAll('<span class="vf-workout-thumb">'+ico('train')+'</span>','<span class="vf-workout-thumb"><img src="'+src+'" onerror="forgeBodyFallback(this)" onload="forgeBodyLoaded(this)" alt="" loading="lazy" width="45" height="45"></span>')};
