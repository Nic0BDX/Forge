/* These three greetings always play in this order, independently of app language. */
const FORGE_WELCOME_SCENES=[
 {start:.4,end:4.4,lang:'fr',prefix:'Bonjour ',suffix:',',subtitle:'Bonne séance à toi !'},
 {start:4.9,end:8.9,lang:'en',prefix:'Welcome ',suffix:',',subtitle:'Have a great workout!'},
 {start:9.4,end:13.4,lang:'es',prefix:'¡Hola, ',suffix:'!',subtitle:'¡Que tengas una buena sesión!'}
];
function playWelcomeVideo(onDone){
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 if(motion.matches||currentStorageIssue()){onDone();return}
 try{if(sessionStorage.getItem('forge_welcome_seen_v1')){onDone();return}sessionStorage.setItem('forge_welcome_seen_v1','1')}
 catch{onDone();return}
 const name=Array.from(String(DB.profile.name||'').trim()||'Champion').slice(0,20).join('');
 const overlay=document.createElement('section');overlay.className='forge-welcome';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',t('Vidéo d’accueil'));
 const frame=document.createElement('div');frame.className='forge-welcome-frame';
 const video=document.createElement('video');video.autoplay=true;video.muted=true;video.defaultMuted=true;video.volume=0;video.playsInline=true;video.preload='auto';video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');
 const title=document.createElement('h1');title.className='forge-welcome-title';
 const prefix=document.createElement('span'),person=document.createElement('span'),suffix=document.createElement('span');person.className='forge-welcome-name';
 for(const span of [prefix,person,suffix])span.setAttribute('aria-hidden','true');
 title.append(prefix,person,suffix);
 const subtitle=document.createElement('p');subtitle.className='forge-welcome-subtitle';
 overlay.tabIndex=-1;
 frame.append(video,title,subtitle);overlay.append(frame);document.body.append(overlay);
 const inertStates=[document.getElementById('root'),document.getElementById('modal')].filter(Boolean).map(el=>({el,inert:el.inert}));
 inertStates.forEach(({el})=>el.inert=true);const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
 let closed=false,cleaned=false,frameId=0,watchdog=0,fadeTimer=0,lastScene=null,lastCount=-1;
 function cleanup(){
  if(cleaned)return;cleaned=true;clearTimeout(fadeTimer);video.pause();video.removeAttribute('src');video.load();overlay.remove();
  window.removeEventListener('keydown',keyboard,true);window.removeEventListener('resize',fitText);motion.removeEventListener?.('change',reduceMotion);
  inertStates.forEach(({el,inert})=>el.inert=inert);document.body.style.overflow=overflow;onDone();
  (document.querySelector('#modal.show button')||document.querySelector('#root input,#root button'))?.focus({preventScroll:true});
 }
 function finish(fade=false){
  if(closed)return;closed=true;clearTimeout(watchdog);cancelAnimationFrame(frameId);video.pause();
  if(fade&&!motion.matches){overlay.classList.add('is-leaving');overlay.addEventListener('transitionend',cleanup,{once:true});fadeTimer=setTimeout(cleanup,320)}else cleanup();
 }
 function keyboard(event){if(event.key==='Tab'){event.preventDefault();overlay.focus()}}
 function reduceMotion(){if(motion.matches)finish()}
 function fitText(){
  const ctx=document.createElement('canvas').getContext('2d');
  const width=Math.max(...FORGE_WELCOME_SCENES.map(scene=>{ctx.font='500 34px Arial';const outer=ctx.measureText(scene.prefix+scene.suffix).width;ctx.font='800 34px Arial';return outer+ctx.measureText(name).width}));
  title.style.fontSize=Math.min(34,frame.clientWidth*.88/Math.max(1,width)*34)+'px';
 }
 function update(){
  const scene=FORGE_WELCOME_SCENES.find(scene=>video.currentTime>=scene.start&&video.currentTime<scene.end);
  if(!scene){prefix.textContent=person.textContent=suffix.textContent=subtitle.textContent='';title.removeAttribute('aria-label');lastScene=null;lastCount=-1;return}
  const count=Math.floor((video.currentTime-scene.start)/.06);
  if(scene===lastScene&&count===lastCount)return;
  if(scene!==lastScene){title.lang=subtitle.lang=scene.lang;title.setAttribute('aria-label',scene.prefix+name+scene.suffix)}
  lastScene=scene;lastCount=count;
  const a=Array.from(scene.prefix),b=Array.from(name),c=Array.from(scene.suffix);
  prefix.textContent=a.slice(0,count).join('');person.textContent=b.slice(0,Math.max(0,count-a.length)).join('');suffix.textContent=c.slice(0,Math.max(0,count-a.length-b.length)).join('');
  subtitle.textContent=Array.from(scene.subtitle).slice(0,Math.max(0,count-a.length-b.length-c.length)).join('');
 }
 function tick(){if(closed)return;update();frameId=requestAnimationFrame(tick)}
 video.addEventListener('ended',()=>finish(true));video.addEventListener('error',()=>finish());
 video.addEventListener('playing',()=>{clearTimeout(watchdog);if(!frameId&&!closed)tick()});video.addEventListener('timeupdate',update);
 video.addEventListener('volumechange',()=>{if(!video.muted||video.volume!==0){video.muted=true;video.volume=0}});
 window.addEventListener('keydown',keyboard,true);window.addEventListener('resize',fitText);motion.addEventListener?.('change',reduceMotion);
 fitText();overlay.focus();watchdog=setTimeout(()=>finish(),2000);video.src='assets/forge_welcome_clean.mp4';
 try{video.play()?.catch(()=>finish())}catch{finish()}
}
