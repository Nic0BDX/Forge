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
 const src=window.__forgePreviewImages?.['forge-body']||'assets/images/forge-body.png';
 return `<div class="vf-body-mount ${DB.settings.bodyMotion===false?'is-paused':''} vf-body-${kind}" aria-hidden="true"><img class="vf-body-image" src="${src}" alt="" width="1024" height="1536" decoding="async" ${kind==='hero'?'fetchpriority="high"':'loading="lazy"'}>${forgeBodyOverlay(kind)}</div>`;
}
const FORGE_PEC_VEINS=[
 ['left-main','M588 262C558 287 543 317 509 339S432 378 358 397',3.1,-.8],
 ['left-upper','M554 294C515 277 469 263 418 277S361 304 330 333',3.7,-2.1],
 ['left-middle','M510 339C473 321 433 317 390 336S347 355 316 363',2.8,-1.4],
 ['left-lower','M470 359C466 390 436 416 399 433',3.4,-2.8],
 ['left-inner','M548 305C561 351 547 391 514 420S475 440 456 444',4,-.3],
 ['left-branch','M396 334C392 311 381 302 365 300',2.5,-1.8],
 ['right-main','M642 268C667 296 675 324 701 352S758 404 801 432',3.3,-1.3],
 ['right-upper','M664 294C706 281 739 290 769 319S793 349 806 363',3.9,-2.6],
 ['right-middle','M690 337C724 329 757 342 777 364S795 388 808 398',2.7,-.5],
 ['right-lower','M716 367C704 398 715 423 745 446',3.6,-2.2],
 ['right-inner','M673 306C647 336 646 373 666 411S697 446 713 455',3,-1.7],
 ['right-branch','M754 344C758 323 749 311 737 304',2.6,-.9]
];
function forgePecVeins(){return FORGE_PEC_VEINS.map(([id,d,duration,delay])=>`<g style="--flow-time:${duration}s;--flow-delay:${delay}s"><path id="__BODY_ID__-vein-${id}" class="vf-vein-track" d="${d}" pathLength="100"/>${['tail','mid','head'].map(part=>`<path class="vf-vein-pulse vf-vein-${part}" d="${d}" pathLength="100"/>`).join('')}</g>`).join('')}
const FORGE_BODY_OVERLAY=`<svg class="vf-body-glow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536" fill="none" aria-hidden="true">
  <defs>
    <radialGradient id="__BODY_ID__-pec-halo-left" gradientUnits="userSpaceOnUse" cx="469" cy="319" r="191" gradientTransform="translate(0 76) scale(1 .76)">
      <stop offset="0" stop-color="currentColor" stop-opacity=".61"/>
      <stop offset=".5" stop-color="currentColor" stop-opacity=".35"/>
      <stop offset="1" stop-color="currentColor" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="__BODY_ID__-pec-halo-right" gradientUnits="userSpaceOnUse" cx="724" cy="346" r="151" gradientTransform="translate(0 -28) scale(1 1.08)">
      <stop offset="0" stop-color="currentColor" stop-opacity=".6"/>
      <stop offset=".5" stop-color="currentColor" stop-opacity=".32"/>
      <stop offset="1" stop-color="currentColor" stop-opacity="0"/>
    </radialGradient>
    <filter id="__BODY_ID__-pec-soft-glow" x="-25%" y="-30%" width="150%" height="160%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
    <linearGradient id="__BODY_ID__-vein-flow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".25"/><stop offset=".55" stop-color="currentColor" stop-opacity=".65"/><stop offset="1" stop-color="currentColor"/></linearGradient>
    <clipPath id="__BODY_ID__-pec-clip"><path fill="currentColor" d="M288 348C304 292 356 244 421 222C479 203 537 215 574 251C597 277 606 313 614 355C623 394 608 430 571 449C527 468 455 467 399 454C345 441 304 408 290 372C286 363 286 356 288 348ZM611 249C649 218 702 225 749 254C792 281 820 319 829 362C840 407 826 451 798 472C777 486 741 481 705 467C660 451 636 425 629 389C620 342 630 300 611 249Z"/></clipPath>
  </defs>
  <g class="vf-body-anatomy" stroke-linecap="round" stroke-linejoin="round">
    <g class="vf-pec-veins" clip-path="url(#__BODY_ID__-pec-clip)" stroke="url(#__BODY_ID__-vein-flow)">${forgePecVeins()}</g>
    <path id="__BODY_ID__-pec-left-glow" class="vf-pec-glow" d="M288 348C304 292 356 244 421 222C479 203 537 215 574 251C597 277 606 313 614 355C623 394 608 430 571 449C527 468 455 467 399 454C345 441 304 408 290 372C286 363 286 356 288 348Z" fill="url(#__BODY_ID__-pec-halo-left)" filter="url(#__BODY_ID__-pec-soft-glow)"/>
    <path id="__BODY_ID__-pec-right-glow" class="vf-pec-glow" d="M611 249C649 218 702 225 749 254C792 281 820 319 829 362C840 407 826 451 798 472C777 486 741 481 705 467C660 451 636 425 629 389C620 342 630 300 611 249Z" fill="url(#__BODY_ID__-pec-halo-right)" filter="url(#__BODY_ID__-pec-soft-glow)"/>
    <path id="__BODY_ID__-pec-left" class="vf-pec-outline" d="M288 348C304 292 356 244 421 222C479 203 537 215 574 251C597 277 606 313 614 355C623 394 608 430 571 449C527 468 455 467 399 454C345 441 304 408 290 372C286 363 286 356 288 348Z" stroke="currentColor" stroke-width="3.5" opacity=".74"/>
    <path id="__BODY_ID__-pec-right" class="vf-pec-outline" d="M611 249C649 218 702 225 749 254C792 281 820 319 829 362C840 407 826 451 798 472C777 486 741 481 705 467C660 451 636 425 629 389C620 342 630 300 611 249Z" stroke="currentColor" stroke-width="3.5" opacity=".74"/>
    <path id="__BODY_ID__-shoulder-left" class="vf-body-contour" d="M410 207C357 170 279 168 223 187C159 207 115 248 104 306C96 341 100 375 113 400" stroke="currentColor" stroke-width="4" opacity=".54"/>
    <path id="__BODY_ID__-shoulder-right" class="vf-body-contour" d="M707 220C767 202 829 232 873 279C908 320 922 365 913 413C908 442 900 462 886 480" stroke="currentColor" stroke-width="4" opacity=".54"/>
    <path id="__BODY_ID__-arm-left" class="vf-body-contour" d="M111 396C79 442 58 493 53 551C49 591 50 619 43 650M244 425C238 483 224 540 202 586C186 621 171 646 159 667" stroke="currentColor" stroke-width="3.5" opacity=".38"/>
    <path id="__BODY_ID__-arm-right" class="vf-body-contour" d="M895 478C916 520 924 569 930 611C936 645 946 668 956 697M815 488C805 534 803 586 812 633C819 667 834 696 852 719" stroke="currentColor" stroke-width="3.5" opacity=".38"/>
  </g>
</svg>
`;
function forgeBodyOverlay(kind){return FORGE_BODY_OVERLAY.replaceAll('__BODY_ID__','forge-body-'+kind)}
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
vfUpcoming=function(){const src=window.__forgePreviewImages?.['forge-body']||'assets/images/forge-body.png';return forgeOriginalUpcoming().replaceAll('<span class="vf-workout-thumb">'+ico('train')+'</span>','<span class="vf-workout-thumb"><img src="'+src+'" alt="" loading="lazy" width="45" height="45"></span>')};
