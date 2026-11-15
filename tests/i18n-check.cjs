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
