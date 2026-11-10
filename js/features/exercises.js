/* FORGE — Bibliothèque d’exercices */
function installTemplate(id){const t=workoutTemplates.find(x=>x.id===id);if(!t)return;const p={id:uid(),name:t.name,days:[{id:uid(),name:t.tag,exercises:t.ex.map(e=>({id:uid(),name:e[0],sets:e[1],repsMin:e[2],repsMax:e[3],rest:e[4]}))}],next:0};DB.programs.push(p);DB.activeProgram=p.id;save();toast('Séance ajoutée à ton programme ⚡');nav('program')}
/* Bibliothèque et démonstrations : exercise-atlas.js. */
