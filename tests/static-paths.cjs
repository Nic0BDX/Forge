const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let checked=0;
function asset(file,ref){
 if(/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(ref))return;
 assert.ok(!ref.startsWith('/'),file+': absolute local path '+ref);
 const target=path.resolve(path.dirname(file),ref.split(/[?#]/)[0]);assert.ok(fs.existsSync(target),file+': missing '+ref);checked++;
}
for(const file of ['index.html','preview/demo.html']){
 const html=fs.readFileSync(file,'utf8'),base=html.match(/<base\s+href="([^"]+)"/i),resolved=base?path.join(path.dirname(file),base[1],'index.html'):file;
 for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))if(match[1]!==base?.[1])asset(resolved,match[1]);
}
for(const name of fs.readdirSync('css').filter(name=>name.endsWith('.css'))){const file='css/'+name;for(const match of fs.readFileSync(file,'utf8').matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g))asset(file,match[1])}
for(const dir of ['js/core','js/features'])for(const name of fs.readdirSync(dir).filter(name=>name.endsWith('.js'))){const file=dir+'/'+name;for(const match of fs.readFileSync(file,'utf8').matchAll(/\bphoto\(['"]([^'"]+)['"]\)/g))asset('index.html','assets/images/'+match[1]+'.svg')}
const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));assert.equal(config.framework,null);assert.equal(config.buildCommand,'');assert.equal(config.outputDirectory,'.');assert.ok(fs.existsSync('index.html'));
asset('index.html','assets/forge_welcome_clean.mp4');
console.log(`PASS: ${checked} relative local assets exist; static root, no build`);
