/* FORGE PROJECT — Série de connexion quotidienne (flammes), paliers et badges */
const STREAK_STEPS=[3,7,14,30,60,100];
const STREAK_LABELS={3:'Premier élan',7:'Une semaine de feu',14:'Deux semaines solides',30:'Régularité exceptionnelle',60:'Discipline de fer',100:'Légende FORGE'};
function isoDay(d){return d.toISOString().slice(0,10)}
function loginStreak(){
 const set=new Set(DB.visits||[]);let d=new Date(),k=today();
 if(!set.has(k)){d.setDate(d.getDate()-1);k=isoDay(d);if(!set.has(k))return 0}
 let n=0;while(set.has(k)){n++;d.setDate(d.getDate()-1);k=isoDay(d)}return n;
}
function flame(size){return `<span class="flame" style="--s:${size||1}" aria-hidden="true">${ico('flame')}</span>`}
function recordVisit(){
 if(!isLogged()||!DB||!DB.profile)return;
 DB.visits=DB.visits||[];const t=today();if(DB.visits.includes(t))return;
 const prevBest=DB.visitBest||0;
 DB.visits.push(t);if(DB.visits.length>800)DB.visits.shift();
 const n=loginStreak();DB.visitBest=Math.max(prevBest,n);
 DB.visitMilestones=DB.visitMilestones||[];
 const fresh=STREAK_STEPS.filter(s=>n>=s&&!DB.visitMilestones.includes(s));
 DB.visitMilestones.push(...fresh);
 const record=n>1&&n>prevBest;
 save();
 setTimeout(()=>celebrateStreak(n,fresh.at(-1),record),700);
}
function celebrateStreak(n,step,record){
 if(!step&&!record){toast(`${n} ${t("jour")}${n>1?'s':''} ${t("de présence d’affilée")}`);return}
 const title=step?STREAK_LABELS[step]:t("Nouveau record de régularité");
 document.getElementById('modalbox').innerHTML=`<div class="cele"><div class="cele-flame">${flame(3)}</div><div class="cele-n">${n}</div><div class="cele-u">${t("jour")}${n>1?'s':''} ${t("de présence d’affilée")}</div><h2>${esc(t(title))}</h2><p class="sub">${step?`${t("Palier de")} ${step} ${t("jours débloqué. Le badge est dans ton tableau de bord.")}`:`${t("Ton meilleur score de régularité passe à")} ${n} ${t("jours.")}`}</p><button class="ea-btn red" onclick="closeModal()">${t("Continuer")}</button></div>`;
 openModal();
}
function streakCalendar(){
 const set=new Set(DB.visits||[]),now=new Date(),y=now.getFullYear(),m=now.getMonth();
 const first=new Date(y,m,1),lead=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),tk=today();
 let cells=forgeWeekdays().map(x=>`<span class="sc-h">${x}</span>`).join('')+'<span></span>'.repeat(lead);
 for(let d=1;d<=days;d++){const k=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;cells+=`<span class="sc-d ${set.has(k)?'on':''} ${k===tk?'today':''}" ${set.has(k)?'title="Présence enregistrée"':''}>${d}</span>`}
 return `<div class="sc-grid" role="img" aria-label="${t("Jours de présence ce mois-ci :")} ${[...set].filter(k=>k.startsWith(`${y}-${String(m+1).padStart(2,'0')}`)).length}">${cells}</div>`;
}
function streakCard(){
 const n=loginStreak(),best=Math.max(DB.visitBest||0,n),next=STREAK_STEPS.find(s=>s>n),prevStep=[...STREAK_STEPS].reverse().find(s=>s<=n)||0;
 const pct=next?Math.round((n-prevStep)/(next-prevStep)*100):100;
 const month=new Date().toLocaleDateString(forgeLocale(),{month:'long',year:'numeric'});
 return `<section class="eh-card eh-streakcard rise" style="--i:3"><div class="eh-card-h"><b>${t("Jours de présence")}</b></div><p class="sub">${t("Jours consécutifs où tu ouvres Forge.")}</p>
  <div class="sk-main"><div class="sk-count">${flame(2)}<b>${n}</b><span>${t("jour")}${n>1?'s':''}<br><small>${t("Record :")} ${best}</small></span></div>
   <div class="sk-next"><small>${next?`${t("Prochain palier :")} ${next} ${t("jours")}`:t("Tous les paliers sont débloqués")}</small><div class="progress"><i style="width:${pct}%"></i></div></div>
   <div class="sk-badges">${STREAK_STEPS.map(s=>`<div class="sk-badge ${(DB.visitMilestones||[]).includes(s)?'on':''}" title="${esc(t(STREAK_LABELS[s]))}"><span>${ico('flame')}</span><b>${s}</b></div>`).join('')}</div></div>
  <div class="sk-cal"><small>${month}</small>${streakCalendar()}</div>
 </section>`;
}

function showNotifs(){const n=(DB.notifications||[]).slice(0,8);document.getElementById('modalbox').innerHTML=`<div class="cele"><h2>${t("Notifications")}</h2>${n.length?`<div class="eh-list" style="text-align:left;margin:14px 0">${n.map(x=>`<div class="eh-row"><div><b>${esc(x.title||x.text||String(x))}</b></div></div>`).join('')}</div>`:`<p class="sub">${t("Rien de nouveau pour l’instant.")}</p>`}<button class="ea-btn red" onclick="closeModal()">${t("Fermer")}</button></div>`;openModal()}
