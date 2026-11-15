const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let checked=0;
function asset(file,ref){
 if(/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(ref))return;
 const local=ref.split(/[?#]/)[0],target=path.resolve(ref.startsWith('/')?process.cwd():path.dirname(file),local.replace(/^\//,''));
 assert.ok(target===process.cwd()||target.startsWith(process.cwd()+path.sep),file+': path outside site '+ref);assert.ok(fs.existsSync(target),file+': missing '+ref);checked++;
}
for(const file of ['index.html','preview/demo.html']){
 const html=fs.readFileSync(file,'utf8'),base=html.match(/<base\s+href="([^"]+)"/i),resolved=base?path.join(path.dirname(file),base[1],'index.html'):file;
 for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))if(match[1]!==base?.[1])asset(resolved,match[1]);
}
for(const name of fs.readdirSync('css').filter(name=>name.endsWith('.css'))){const file='css/'+name;for(const match of fs.readFileSync(file,'utf8').matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g))asset(file,match[1])}
for(const dir of ['js/core','js/features'])for(const name of fs.readdirSync(dir).filter(name=>name.endsWith('.js'))){const file=dir+'/'+name;for(const match of fs.readFileSync(file,'utf8').matchAll(/\bphoto\(['"]([^'"]+)['"]\)/g))asset('index.html','assets/images/'+match[1]+'.svg')}
const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));assert.equal(config.framework,null);assert.equal(config.buildCommand,'');assert.equal(config.outputDirectory,'.');assert.ok(fs.existsSync('index.html'));
asset('index.html','assets/forge_welcome_clean.mp4');
asset('index.html','assets/icons/lang.png');
for(const [file,width,height]of [
 ['assets/icons/icon-192.png',192,192],['assets/icons/icon-512.png',512,512],['assets/icons/icon-maskable-512.png',512,512],
 ['assets/icons/apple-touch-icon.png',180,180],['assets/icons/favicon-32.png',32,32],['assets/icons/favicon-48.png',48,48],['assets/og-image.png',1200,630],
 ['assets/images/forge-body.png',1024,1536],['assets/body-female.png',1024,1536],['assets/veins-male.png',1024,1536],['assets/veins-female.png',1024,1536]
]){
 asset('index.html','/'+file);const fd=fs.openSync(file,'r'),header=Buffer.alloc(24);try{assert.equal(fs.readSync(fd,header,0,24,0),24)}finally{fs.closeSync(fd)}
 assert.equal(header.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file+' PNG signature');assert.equal(header.readUInt32BE(16),width,file+' width');assert.equal(header.readUInt32BE(20),height,file+' height');
}
asset('index.html','/favicon.ico');asset('index.html','/manifest.webmanifest');
asset('index.html','assets/body-neutral.svg');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8')),origin='https://forge-livid-nine.vercel.app';
for(const ref of [manifest.start_url,manifest.scope,...manifest.icons.map(icon=>icon.src)]){assert.ok(typeof ref==='string'&&ref.length);const url=new URL(ref,origin+'/manifest.webmanifest');assert.equal(url.origin,origin);asset('manifest.webmanifest',decodeURIComponent(url.pathname)==='/'?'/index.html':decodeURIComponent(url.pathname))}
for(const [file,size,purpose]of [['icon-192.png','192x192','any'],['icon-512.png','512x512','any'],['icon-maskable-512.png','512x512','maskable']])assert.ok(manifest.icons.some(icon=>icon.src==='/assets/icons/'+file&&icon.sizes===size&&icon.type==='image/png'&&icon.purpose.split(/\s+/).includes(purpose)),file+' manifest entry');
assert.ok(!config.routes,'Static assets must stay directly accessible');
assert.deepEqual(config.rewrites,[{source:'/assets/body-female.png',destination:'/assets/body-neutral.svg'}],'Only the missing female image may fall back to the neutral silhouette');
assert.ok(config.headers?.some(rule=>rule.source==='/manifest.webmanifest'&&rule.headers.some(header=>header.key.toLowerCase()==='content-type'&&/^application\/manifest\+json(?:;|$)/.test(header.value))),'Manifest MIME header');
console.log(`PASS: ${checked} local assets and manifest paths exist; PNG dimensions and manifest MIME valid; static root, no build`);
