const fs=require('node:fs'),assert=require('node:assert/strict');
const foods=new Map(JSON.parse(fs.readFileSync('assets/foods.json','utf8')).map(food=>[food.id,food]));
// Gram weights are recipe portions, not nutritional claims. All values come from foods.json.
const base=[
 ['Porridge pomme et lait','breakfast',true,[[9313,200],[19033,150],[13039,120]]],
 ['Tartines aux œufs et tomate','breakfast',true,[[7001,80],[22010,100],[20385,100]]],
 ['Fromage blanc, pomme et amandes','breakfast',true,[[19644,200],[13039,150],[15000,20]]],
 ['Yaourt, pain et compote','breakfast',true,[[19600,180],[7007,70],[13151,100]]],
 ['Poulet, riz et brocoli','lunch',false,[[36018,140],[9104,180],[20350,180],[17270,8]]],
 ['Saumon, pommes de terre et carottes','lunch',false,[[26038,140],[4003,220],[20353,160]]],
 ['Lentilles, riz et tomate','lunch',true,[[20360,180],[9104,160],[20385,150],[17270,8]]],
 ['Pois chiches, brocoli et riz','lunch',true,[[20507,180],[20350,180],[9104,130]]],
 ['Poulet, pommes de terre et carottes','dinner',false,[[36018,140],[4003,220],[20353,180],[17270,8]]],
 ['Saumon, riz et brocoli','dinner',false,[[26038,140],[9104,180],[20350,180]]],
 ['Œufs, lentilles et tomate','dinner',true,[[22010,100],[20360,200],[20385,150]]],
 ['Pâtes de lentilles et pois chiches','dinner',true,[[9876,180],[20507,120],[20353,150],[17270,8]]],
 ['Compote et tartines','snack',true,[[13151,150],[7001,70]]],
 ['Yaourt et pomme','snack',true,[[19600,200],[13039,150]]],
 ['Fromage blanc et pain','snack',true,[[19644,200],[7007,80]]],
 ['Œuf, pain et tomate','snack',true,[[22010,50],[7001,60],[20385,100]]]
];
function recipeIngredients(items,moment,variant){const result=items.map(([code,grams])=>({foodId:'ciqual-'+code,grams:Math.round(grams*[.85,1,1.2][variant])})),has=code=>items.some(item=>item[0]===code);if(variant===0){const sweet=['breakfast','snack'].includes(moment),side=sweet?(has(13039)?13151:13039):(has(20353)?20350:20353);result.push({foodId:'ciqual-'+side,grams:50})}else if(variant===2)result.push({foodId:'ciqual-'+(has(15000)?19033:15000),grams:has(15000)?100:15});return result}
const recipes=base.flatMap(([name,moment,vegetarian,ingredients],index)=>['loss','maintain','mass'].map((goal,variant)=>({id:'recipe-'+(index+1)+'-'+goal,name,moments:moment==='snack'?['snack',...(index===12||index===13?['before']:['after'])]:[moment],goal,diet:vegetarian?'vegetarian':'omnivore',ingredients:recipeIngredients(ingredients,moment,variant)})));
for(const recipe of recipes)for(const ingredient of recipe.ingredients)assert.ok(foods.has(ingredient.foodId),recipe.id+' missing '+ingredient.foodId);
assert.ok(recipes.length>=40&&recipes.length<=60);fs.writeFileSync('assets/recipes.json',JSON.stringify(recipes)+'\n');console.log('Generated '+recipes.length+' recipes; all ingredients reference CIQUAL.');
