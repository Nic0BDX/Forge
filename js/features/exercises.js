/* FORGE — Bibliothèque d’exercices */
function installTemplate(id){const template=workoutTemplates.find(x=>x.id===id);if(!template)return;const p={id:uid(),name:template.name,days:[{id:uid(),name:template.tag,exercises:template.ex.map(e=>({id:uid(),name:e[0],sets:e[1],repsMin:e[2],repsMax:e[3],rest:e[4]}))}],next:0};DB.programs.push(p);DB.activeProgram=p.id;save();toast(t("Séance ajoutée à ton programme ⚡"));nav('program')}
/* Bibliothèque et démonstrations : exercise-atlas.js. */
