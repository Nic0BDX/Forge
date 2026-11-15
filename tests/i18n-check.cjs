const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/core/i18n.js','utf8');
const context={document:{documentElement:{},addEventListener(){}},localStorage:{getItem(){return null}}};
vm.createContext(context);vm.runInContext(source+';globalThis.translations=I18N;globalThis.entries=I18N_ENTRIES;',context);
const keys=Object.keys(context.translations.fr);
assert.equal(new Set(context.entries.map(([key])=>key)).size,context.entries.length,'Duplicate translation key');
for(const [lang,dict] of Object.entries(context.translations)){assert.deepEqual(Object.keys(dict).sort(),[...keys].sort(),lang+' missing keys');for(const value of Object.values(dict))assert.ok(typeof value==='string'&&value.length,'Empty translation')}
let count=0;
for(const dir of ['js/core','js/features'])for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.js')&&f!=='i18n.js')){
 const code=fs.readFileSync(dir+'/'+file,'utf8');
 for(const match of code.matchAll(/\bt\(('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\)/g)){const key=vm.runInNewContext(match[1]);assert.ok(Object.hasOwn(context.translations.fr,key),file+': '+key);count++}
 for(const match of code.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g))assert.ok(Object.hasOwn(context.translations.fr,match[1]),file+': '+match[1]);
}
console.log(`PASS: ${keys.length} unique keys, FR/EN parity, ${count} translated expressions`);
for(const [file,name,labels]of [
 ['js/features/video-forge.js','FORGE_LINKS',rows=>rows.map(row=>row[2])],
 ['js/features/video-forge.js','FORGE_ACCENTS',rows=>Object.values(rows).map(row=>row[0])],
 ['js/features/profile.js','badgeData',rows=>rows.flatMap(row=>[row.name,row.desc])],
 ['js/features/activity.js','FORGE_ACTIVITY_FIELDS',rows=>rows.map(row=>row.label)],
 ['js/data/catalog.js','routineBlocks',rows=>rows.flatMap(row=>[row[1],row[3]])],
 ['js/data/catalog.js','mealPlans',rows=>rows.flatMap(row=>[row.name,row.note,...row.items])],
 ['js/features/food-library.js','FOOD_GROUPS',rows=>Object.values(rows)],
 ['js/features/food-library.js','FOOD_METRICS',rows=>Object.values(rows)],
 ['js/core/streak.js','STREAK_LABELS',rows=>Object.values(rows)]
]){
 const code=fs.readFileSync(file,'utf8'),match=code.match(new RegExp('const '+name+'\\s*=\\s*([\\s\\S]*?);'));
 assert.ok(match,name+' not found');for(const key of labels(vm.runInNewContext('('+match[1]+')')))assert.ok(Object.hasOwn(context.translations.fr,key),name+': '+key);
}
for(const file of ['index.html','preview/demo.html'])for(const match of fs.readFileSync(file,'utf8').matchAll(/data-i18n(?:-placeholder|-content)?="([^"]+)"/g))assert.ok(Object.hasOwn(context.translations.fr,match[1]),file+': '+match[1]);
console.log('PASS: dynamic navigation, accents, badges, activity, routine, meals, streaks and HTML keys');
