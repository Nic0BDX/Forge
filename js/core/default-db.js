/* FORGE — Schéma de données par défaut */
const defaultDB=()=>({
  profile:{setup:false,name:'',goal:'Recomposition',level:'Intermédiaire',perWeek:4,avatar:'🏋️',bio:'',accent:'lime',bodyType:'male'},
  xp:0, xpLog:[],sessions:[],programs:[],activeProgram:null,lastSets:{},prs:{},
  meals:[],photos:[],whey:{enabled:false,dose:30,times:['10:00','16:00'],lastTaken:{}},foods:[],nutrition:{favorites:[],recent:[]},
  steps:{},activity:{},health:{pulse:[]},water:{},sleep:{},weights:[],measurements:[],goals:[],habits:[
    {id:'h1',name:'Séance',xp:40},{id:'h2',name:'Protéines',xp:25},{id:'h3',name:'Eau',xp:20},{id:'h4',name:'Sommeil',xp:20}
  ],habitLog:{},goals:[],notes:[],notifications:[],badges:[],settings:{theme:'dark',bodyMotion:true,calories:2800,protein:180,carbs:320,fat:80,water:2500,steps:8000,activityCalories:1000,exerciseMinutes:90,standHours:12},
  visits:[],visitBest:0,visitMilestones:[],
  demo:false
});
