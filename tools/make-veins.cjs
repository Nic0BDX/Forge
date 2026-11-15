/* Offline, deterministic photo analysis. No hand-drawn vein paths or runtime processing. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require(process.env.FORGE_PLAYWRIGHT||'playwright');
const option=(name,fallback)=>Number(process.argv.find(arg=>arg.startsWith('--'+name+'='))?.split('=')[1]??fallback);
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.FORGE_BROWSER||process.platform==='win32'?{executablePath:process.env.FORGE_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
 const debug=process.env.FORGE_VISUAL_OUTPUT||path.join(os.tmpdir(),'forge-body-review');fs.mkdirSync(debug,{recursive:true});
 try{
  const page=await browser.newPage();
  for(const [type,file]of [['male','assets/images/forge-body.png'],['female','assets/body-female.png']]){
   const result=await page.evaluate(async({data,type,threshold,minLength})=>{
    const image=new Image();image.src=data;await image.decode();
    const full=document.createElement('canvas');full.width=1024;full.height=1536;const fullContext=full.getContext('2d',{willReadFrequently:true});fullContext.fillStyle='#090608';fullContext.fillRect(0,0,1024,1536);
    let trim=0;
    if(type==='female'&&image.naturalWidth/image.naturalHeight!==2/3){
     const probe=document.createElement('canvas');probe.width=image.naturalWidth;probe.height=image.naturalHeight;const ctx=probe.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,probe.width,probe.height).data;
     for(let y=0;y<probe.height;y++){let bright=0;for(let x=0;x<probe.width;x++){const i=(y*probe.width+x)*4;if(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722>45)bright++}if(bright>probe.width*.02){trim=Math.max(0,y-32);break}}
    }
    const scale=Math.min(1024/image.naturalWidth,1536/(image.naturalHeight-trim)),drawWidth=image.naturalWidth*scale,drawHeight=(image.naturalHeight-trim)*scale;
    fullContext.drawImage(image,0,trim,image.naturalWidth,image.naturalHeight-trim,(1024-drawWidth)/2,0,drawWidth,drawHeight);
    if(type==='female'&&drawHeight<full.height){const fade=fullContext.createLinearGradient(0,drawHeight-48,0,drawHeight);fade.addColorStop(0,'rgba(9,6,8,0)');fade.addColorStop(1,'#090608');fullContext.fillStyle=fade;fullContext.fillRect(0,drawHeight-48,full.width,48)}
    const w=512,h=768,n=w*h,small=document.createElement('canvas');small.width=w;small.height=h;const ctx=small.getContext('2d',{willReadFrequently:true});ctx.drawImage(full,0,0,w,h);const pixels=ctx.getImageData(0,0,w,h).data,gray=new Float32Array(n);
    for(let i=0;i<n;i++)gray[i]=pixels[i*4]*.2126+pixels[i*4+1]*.7152+pixels[i*4+2]*.0722;
    function gaussian(input,sigma){const radius=Math.ceil(sigma*3),kernel=[];let sum=0;for(let k=-radius;k<=radius;k++){const v=Math.exp(-k*k/(2*sigma*sigma));kernel.push(v);sum+=v}for(let k=0;k<kernel.length;k++)kernel[k]/=sum;const temp=new Float32Array(n),out=new Float32Array(n);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=0;for(let k=-radius;k<=radius;k++)v+=input[y*w+Math.max(0,Math.min(w-1,x+k))]*kernel[k+radius];temp[y*w+x]=v}for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=0;for(let k=-radius;k<=radius;k++)v+=temp[Math.max(0,Math.min(h-1,y+k))*w+x]*kernel[k+radius];out[y*w+x]=v}return out}
    function integral(input){const out=new Uint32Array((w+1)*(h+1));for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){row+=input[y*w+x];out[(y+1)*(w+1)+x+1]=out[y*(w+1)+x+1]+row}}return out}
    function count(table,x,y,r){const a=Math.max(0,x-r),b=Math.min(w,x+r+1),c=Math.max(0,y-r),d=Math.min(h,y+r+1);return table[d*(w+1)+b]-table[c*(w+1)+b]-table[d*(w+1)+a]+table[c*(w+1)+a]}
    const fine=gaussian(gray,1.6),blur=gaussian(gray,4),broad=gaussian(gray,7),skin=new Uint8Array(n),edges=new Uint8Array(n),dog=new Float32Array(n);
    for(let y=1;y<h-1;y++){
     let background=0;for(let x=0;x<16;x++)background+=gray[y*w+x]+gray[y*w+w-1-x];const floor=Math.max(44,background/32+12);
     for(let x=1;x<w-1;x++){const i=y*w+x;skin[i]=blur[i]>floor&&broad[i]>floor&&gray[i]>25?1:0;const gx=(fine[i+1]-fine[i-1])/2,gy=(fine[i+w]-fine[i-w])/2;edges[i]=Math.hypot(gx,gy)>12?1:0;dog[i]=fine[i]-blur[i]}
    }
    const skinArea=integral(skin),edgeArea=integral(edges),ridge=new Uint8Array(n),interior=new Uint8Array(n);
    for(let y=4;y<h-4;y++)for(let x=4;x<w-4;x++){
     const i=y*w+x;if(count(skinArea,x,y,3)<49||count(edgeArea,x,y,3)>0)continue;interior[i]=1;if(dog[i]<threshold)continue;
     const xx=fine[i+1]+fine[i-1]-2*fine[i],yy=fine[i+w]+fine[i-w]-2*fine[i],xy=(fine[i+w+1]-fine[i+w-1]-fine[i-w+1]+fine[i-w-1])/4,delta=Math.hypot(xx-yy,2*xy),lo=(xx+yy-delta)/2,hi=(xx+yy+delta)/2;
     if(lo<-.15&&Math.abs(hi)<-lo*.35)ridge[i]=1;
    }
    const skinVisited=new Uint8Array(n),skinQueue=new Int32Array(n);
    for(let seed=0;seed<n;seed++)if(interior[seed]&&!skinVisited[seed]){let head=0,tail=1,top=h;skinQueue[0]=seed;skinVisited[seed]=1;while(head<tail){const i=skinQueue[head++],x=i%w,y=Math.floor(i/w);top=Math.min(top,y);for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const j=i+dy*w+dx;if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&interior[j]&&!skinVisited[j]){skinVisited[j]=1;skinQueue[tail++]=j}}}if(top>h*.55||tail<100)for(let j=0;j<tail;j++)interior[skinQueue[j]]=ridge[skinQueue[j]]=0}
    function morph(input,dilate){const out=new Uint8Array(n);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let total=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)total+=input[(y+dy)*w+x+dx];out[y*w+x]=dilate?Number(total>0):Number(total===9)}return out}
    const lines=morph(morph(ridge,true),false);for(let i=0;i<n;i++)if(!interior[i])lines[i]=0;
    const neighbors=i=>[lines[i-w],lines[i-w+1],lines[i+1],lines[i+w+1],lines[i+w],lines[i+w-1],lines[i-1],lines[i-w-1]];
    for(let iteration=0;iteration<40;iteration++){
     let removed=0;for(let phase=0;phase<2;phase++){const erase=[];for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(!lines[i])continue;const p=neighbors(i),total=p.reduce((a,b)=>a+b,0);if(total<2||total>6)continue;let transitions=0;for(let j=0;j<8;j++)if(!p[j]&&p[(j+1)%8])transitions++;if(transitions!==1)continue;const a=phase?p[0]*p[2]*p[6]:p[0]*p[2]*p[4],b=phase?p[0]*p[4]*p[6]:p[2]*p[4]*p[6];if(!a&&!b)erase.push(i)}for(const i of erase)lines[i]=0;removed+=erase.length}if(!removed)break;
    }
    const visited=new Uint8Array(n),queue=new Int32Array(n),components=[];
    for(let seed=0;seed<n;seed++)if(lines[seed]&&!visited[seed]){
     let head=0,tail=1,minX=w,maxX=0,minY=h,maxY=0,endpoints=0,degreeSum=0,response=0;queue[0]=seed;visited[seed]=1;const points=[];
     while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);points.push(i);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);response+=dog[i];let degree=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const j=i+dy*w+dx;if(x+dx<0||x+dx>=w||y+dy<0||y+dy>=h||!lines[j])continue;degree++;if(!visited[j]){visited[j]=1;queue[tail++]=j}}degreeSum+=degree;if(degree===1)endpoints++}
     const diagonal=Math.hypot(maxX-minX,maxY-minY),density=points.length/Math.max(1,diagonal);let sx=0,sy=0,sxx=0,syy=0,sxy=0;for(const i of points){const x=i%w,y=Math.floor(i/w);sx+=x;sy+=y;sxx+=x*x;syy+=y*y;sxy+=x*y}const a=sxx/points.length-(sx/points.length)**2,b=syy/points.length-(sy/points.length)**2,c=sxy/points.length-sx*sy/points.length**2,delta=Math.hypot(a-b,2*c),elongation=(a+b+delta)/Math.max(.01,a+b-delta);
     if(points.length>=minLength&&diagonal>=minLength*.8&&endpoints>=2&&degreeSum/points.length<2.9&&density<2&&elongation>12)components.push({points,bounds:[minX*2,minY*2,(maxX+1)*2,(maxY+1)*2],score:response/points.length*Math.sqrt(diagonal)});
    }
    components.sort((a,b)=>b.score-a.score);const selected=components.slice(0,28),mask=document.createElement('canvas');mask.width=w;mask.height=h;const mctx=mask.getContext('2d'),output=mctx.createImageData(w,h);let kept=0;
    for(const component of selected)for(const i of component.points){output.data[i*4]=output.data[i*4+1]=output.data[i*4+2]=255;output.data[i*4+3]=230;kept++}mctx.putImageData(output,0,0);
    const final=document.createElement('canvas');final.width=1024;final.height=1536;final.getContext('2d').drawImage(mask,0,0,1024,1536);
    const preview=document.createElement('canvas');preview.width=512;preview.height=768;const pctx=preview.getContext('2d');pctx.drawImage(mask,0,0);pctx.globalCompositeOperation='source-in';pctx.fillStyle='#e11d2a';pctx.fillRect(0,0,w,h);pctx.globalCompositeOperation='destination-over';pctx.drawImage(full,0,0,w,h);
    return {image:full.toDataURL('image/png'),mask:final.toDataURL('image/png'),preview:preview.toDataURL('image/png'),stats:{type,width:1024,height:1536,trim,components:selected.length,pixels:kept,coverage:kept/n,bounds:selected.map(c=>c.bounds)}};
   },{data:'data:image/png;base64,'+fs.readFileSync(file).toString('base64'),type,threshold:option('threshold',2.5),minLength:option('min-length',34)});
   const write=(target,data)=>fs.writeFileSync(target,Buffer.from(data.split(',')[1],'base64'));
   if(type==='female')write(file,result.image);write('assets/veins-'+type+'.png',result.mask);write(path.join(debug,type+'-extraction.png'),result.preview);console.log(JSON.stringify(result.stats));
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error.message);process.exitCode=1});
