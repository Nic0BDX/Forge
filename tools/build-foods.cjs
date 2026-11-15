/* Reproducible subset of the official ANSES CIQUAL 2025 export; no imputation. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const cache=path.join(__dirname,'.ciqual-cache');
const sources=[['alim',666252,'8e1171d63cee4b6010cfce25dd29243d'],['alim_grp',666250,'c31aeea90349c3aab86f98ef5f4f10da'],['const',666246,'d8f2f25fdacb887bc993a6eeaf80f203'],['compo',666249,'2da725585946434df320d8041631998b']];
const nutrients={328:'kcal',25000:'protein',31000:'carbs',32000:'sugars',40000:'fat',40302:'saturates',34100:'fiber',10004:'salt'};
const quotas={poultry:36,meat:45,fish:50,egg:12,dairy:60,starch:75,legume:28,vegetable:70,fruit:55,nut:25,oil:15,sweet:35,drink:30};
const decode=s=>s.replace(/&#x([\da-f]+);|&#(\d+);|&(amp|lt|gt|quot|apos);/gi,(_,hex,num,key)=>hex?String.fromCodePoint(parseInt(hex,16)):num?String.fromCodePoint(+num):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"})[key]);
const tag=(s,key)=>decode(s.match(new RegExp('<'+key+'>([\\s\\S]*?)</'+key+'>'))?.[1].trim()||'');
const records=(xml,key)=>xml.matchAll(new RegExp('<'+key+'>([\\s\\S]*?)</'+key+'>','g'));
function number(value){return /^\d+(?:[.,]\d+)?$/.test(value)?Number(value.replace(',','.')):null}
function group(code,name){if(/^040[12]$/.test(code))return /poulet|dinde|canard|pintade|caille|oie|volaille/i.test(name)?'poultry':'meat';if(/^040[5-9]$/.test(code))return 'fish';if(code==='0410')return 'egg';if(/^050[1-4]$/.test(code))return 'dairy';if(/^030[124]$/.test(code)||code==='0202')return 'starch';return ({'0201':'vegetable','0203':'legume','0204':'fruit','0205':'nut','0902':'oil','0601':'drink','0602':'drink'})[code]||(/^070[1-9]$/.test(code)?'sweet':null)}
function state(name){const food=/^lait\b/i.test(name)?name:name.replace(/lait[^,;]*?\bcru\b/gi,'lait');if(/\bcru(?:e|s|es)?\b/i.test(food))return 'raw';if(/cuit|bouilli|grill|rôti|poêl|poché|vapeur|frit/i.test(food))return 'cooked';return null}
// Select recognizable staples first, then diversify deterministically. Rankings never alter nutrients.
function rank(food){return (/poulet, (?:filet|cuisse|haut de cuisse)|riz (?:blanc|complet|basmati)|pâtes alimentaires|lentille|pois chiche|haricot|pomme,|banane,|brocoli|saumon|lait (?:demi|entier|écrémé)|yaourt|oeuf de poule|œuf de poule|amande|huile d'olive|flocons d'avoine|pain baguette|avocat|fromage blanc/i.test(food.nameFr)?-100:0)+(/aliment moyen|sans sel ajouté/i.test(food.nameFr)?-10:0)+(/conserve|surgelé|déshydraté|fumé|aromatisé|fourré|préemballé/i.test(food.nameFr)?15:0)}
async function build(){
 fs.mkdirSync(cache,{recursive:true});const xml={};
 for(const [key,id,md5]of sources){const file=path.join(cache,key+'_2025_11_03.xml');if(!fs.existsSync(file)){const response=await fetch('https://entrepot.recherche.data.gouv.fr/api/access/datafile/'+id);if(!response.ok)throw Error('Official export HTTP '+response.status);fs.writeFileSync(file,Buffer.from(await response.arrayBuffer()))}const buffer=fs.readFileSync(file);assert.equal(crypto.createHash('md5').update(buffer).digest('hex'),md5,key+' official checksum');xml[key]=buffer.toString('utf8')}
 const officialNutrients=new Map([...records(xml.const,'CONST')].map(([,row])=>[tag(row,'const_code'),tag(row,'const_nom_fr')]));for(const key of Object.keys(nutrients))assert.ok(officialNutrients.has(key));
 const groups=new Map([...records(xml.alim_grp,'ALIM_GRP')].map(([,row])=>[tag(row,'alim_ssgrp_code'),tag(row,'alim_ssgrp_nom_fr')]));
 const foods=[...records(xml.alim,'ALIM')].map(([,row])=>{const nameFr=tag(row,'alim_nom_fr'),code=tag(row,'alim_ssgrp_code');return {id:'ciqual-'+tag(row,'alim_code'),nameFr,nameEn:tag(row,'alim_nom_eng')||null,group:group(code,nameFr),sourceGroup:groups.get(code)||null,state:state(nameFr),selectionBucket:code+':'+tag(row,'alim_ssssgrp_code'),...Object.fromEntries(Object.values(nutrients).map(key=>[key,null]))}}).filter(food=>food.group);
 // Round-robin official subgroups: avoid filling a whole category with one species or cheese family.
 const selected=[];for(const [category,count]of Object.entries(quotas)){const buckets=new Map();for(const food of foods.filter(food=>food.group===category).sort((a,b)=>rank(a)-rank(b)||Number(a.id.slice(7))-Number(b.id.slice(7)))){if(!buckets.has(food.selectionBucket))buckets.set(food.selectionBucket,[]);buckets.get(food.selectionBucket).push(food)}let remaining=count;while(remaining&&[...buckets.values()].some(bucket=>bucket.length)){for(const bucket of buckets.values()){if(!remaining)break;if(bucket.length){selected.push(bucket.shift());remaining--}}}}
 for(const food of selected)delete food.selectionBucket;
 const lookup=new Map(selected.map(food=>[food.id.slice(7),food]));
 for(const [,row]of records(xml.compo,'COMPO')){const key=nutrients[tag(row,'const_code')];if(!key)continue;const food=lookup.get(tag(row,'alim_code'));if(food)food[key]=number(tag(row,'teneur'))}
 selected.sort((a,b)=>a.group.localeCompare(b.group)||a.nameFr.localeCompare(b.nameFr,'fr'));assert.ok(selected.length>=400&&selected.length<=600);assert.equal(new Set(selected.map(food=>food.id)).size,selected.length);
 for(const pattern of [/poulet, filet.*cru/i,/poulet, filet.*(?:grillé|cuit)/i,/poulet, cuisse.*crue/i,/poulet, cuisse.*(?:rôtie|cuite)/i])assert.ok(selected.some(food=>pattern.test(food.nameFr)),String(pattern));
 const output=JSON.stringify(selected)+'\n';assert.ok(Buffer.byteLength(output)<500000);fs.writeFileSync(path.join(__dirname,'../assets/foods.json'),output);console.log('CIQUAL 2025: '+selected.length+' foods, '+Buffer.byteLength(output)+' bytes; official checksums verified; unknown/trace/below-limit values stay null.');
}
if(require.main===module)build().catch(error=>{console.error(error);process.exitCode=1});
module.exports={number,state,nutrients};
