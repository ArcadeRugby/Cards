/* DONNÉES DU JEU : à modifier pour régler le gameplay, les raretés, les boosters */
const PRE=['Léo','Hugo','Théo','Noé','Lucas','Maël','Yanis','Paul','Enzo','Axel','Tom','Jules','Nino','Rémi','Sacha','Ethan','Marius','Gaël','Loïc','Nils'];
const NOM=['Dupont','Marty','Roux','Faure','Ducasse','Lasserre','Cazaux','Pujol','Barrère','Soulé','Laborde','Camy','Dufau','Larrieu','Sempé','Castex','Lamour','Vidal','Mourgues','Peyret'];
/* ====== STATS ====== */
const CLES=['pu','vi','te','pi','pl','mo','an','co','me','la','de','tb'];
const STATS={pu:'Puissance',vi:'Vitesse',te:'Technique',pi:'Jeu au pied',pl:'Plaquage',mo:'Mobilité',an:'Anticipation',co:'Contest',me:'Mêlée',la:'Lancer',de:'Détente',tb:'Tir au but'};
const GROUPES={Attaque:['pu','vi','te','pi'],Défense:['pl','mo','an','co'],Phases:['me','la','de','tb']};
const POSTES=[ // n°, poste, stats dans l'ordre pu vi te pi pl mo an co me la de tb, spécialité
[1,'Pilier',[8,3,3,2,7,3,3,5,9,1,2,1],'Pilier de mêlée'],[2,'Talonneur',[7,4,5,2,7,4,4,5,8,9,4,1],'Briseur'],
[3,'Pilier',[8,3,3,2,7,3,3,5,9,1,2,1],'Pilier de mêlée'],[4,'Deuxième ligne',[7,4,3,2,7,4,4,5,7,2,9,1],'Sauteur'],
[5,'Deuxième ligne',[7,4,3,2,7,4,4,5,7,2,9,1],'Sauteur'],[6,'Troisième ligne',[7,5,4,2,8,6,5,6,5,2,6,1],'Mur'],
[7,'Troisième ligne',[6,6,4,3,8,7,6,9,5,2,5,1],'Gratteur'],[8,'Numéro 8',[8,5,4,3,7,5,5,6,6,2,6,1],'Briseur'],
[9,'Demi de mêlée',[4,6,9,5,5,6,7,4,1,2,2,3],"Chef d'orchestre"],[10,'Ouvreur',[4,6,8,9,5,6,7,3,1,2,2,9],'Botteur'],
[11,'Ailier',[4,9,5,4,5,7,6,3,1,1,5,2],'Feu follet'],[12,'Centre',[6,7,7,3,7,7,6,4,1,1,3,3],"Chef d'orchestre"],
[13,'Centre',[6,7,6,3,7,7,6,4,1,1,3,3],'Intercepteur'],[14,'Ailier',[4,9,5,4,5,7,6,3,1,1,5,2],'Feu follet'],
[15,'Arrière',[5,7,6,8,6,7,7,3,1,1,6,6],'Botteur']].map(([n,p,v,s])=>[n,p,Object.fromEntries(CLES.map((k,i)=>[k,v[i]])),s]);
/* spécialité -> actions (ou stats de défense, ou phases) qu'elle renforce */
const SPEC={Briseur:['Percussion'],'Feu follet':['Duel'],"Chef d'orchestre":['Passe'],Gardien:['Conservation'],Botteur:['PiedTactique','PiedPression'],Mur:['pl'],Rideau:['mo'],Intercepteur:['an'],Gratteur:['co'],'Pilier de mêlée':['me'],Sauteur:['de'],Tireur:['tb']};
/* ====== ACTIONS ET MATRICE ====== */
const LIB={Percussion:'Percussion',Duel:'Duel 1 contre 1',Passe:'Passe / combinaison',Conservation:'Conservation du ballon',PiedTactique:'Coup de pied tactique',PiedPression:'Jeu au pied de pression'};
const ATT={ // s = stat offensive, b = réussite de base (%), g = gain en mètres, kick = coup de pied
Percussion:{s:'pu',b:55,g:[3,8]},Duel:{s:'vi',b:45,g:[8,20]},Passe:{s:'te',b:70,g:[5,12]},Conservation:{s:'te',b:80,g:[1,3]},
PiedTactique:{s:'pi',b:75,g:[25,40],kick:1},PiedPression:{s:'pi',b:65,g:[15,28],kick:1,press:1}};
const MATRICE={pu:{pl:-10,mo:5,an:0,co:0},vi:{pl:0,mo:-10,an:-5,co:0},te:{pl:0,mo:0,an:-10,co:-5},pi:{pl:0,mo:-10,an:-5,co:0}}; // stat offensive x posture défensive
let PAR_MI_TEMPS=20,HOLE_BONUS=15,SPEC_BONUS=12,ECART=4,REC_BASE=8,REC_K=4,INT_BASE=10,INT_K=4,PRESS_MALUS=10;
const OPT={pct:true};
let DEPLACEMENT_MAX=.25, SEUIL_PLACE=.12, MIN_EN_PLACE=10; // déplacement max d'un joueur par action, distance « en place », défenseurs minimum en place
const ZONES=[[22,'Tes 22 m'],[50,'Ton camp'],[78,'Camp adverse'],[100,'22 m adverses']];
/* ====== CARRIÈRE : raretés, boosters, récompenses, pool de joueurs ====== */
const RARETES={commun:{n:'Commun',b:0,sp:.1,c:'#9aa5a1',w:55},rare:{n:'Rare',b:1,sp:.4,c:'#3f8ed8',w:28},epique:{n:'Épique',b:2,sp:.7,c:'#9b59d0',w:14},legendaire:{n:'Légendaire',b:3,sp:1,c:'#e6b422',w:3}}; // b = bonus de stats, sp = chance de spécialité aléatoire, w = poids de tirage
const BOOSTER={cartes:5,depart:3}; // cartes par booster ; boosters de départ (3 x 5 = les 15 postes)
const RECOMPENSES={victoire:2,nul:1,defaite:1}; // boosters gagnés après un match de carrière
const COULEURS=['#2f6fe4','#e0a526','#8e44ad','#1fa38a','#e8e8e8','#e4572e'];
const TOUS=Object.keys(SPEC); // toutes les spécialités possibles
const POOL=(()=>{let a=20260101;const r=()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const ri=(x,y)=>x+Math.floor(r()*(y-x+1)),pk=l=>l[Math.floor(r()*l.length)],out=[];let id=0;
 POSTES.forEach(([num,poste,st,sp])=>{for(let k=0;k<20;k++){let t=r()*100,rar='commun';for(const q in RARETES)if((t-=RARETES[q].w)<0){rar=q;break}
  const s={};for(const x in st)s[x]=Math.max(1,Math.min(10,st[x]+ri(-1,1)+RARETES[rar].b));
  out.push({id:'j'+(++id),nom:pk(PRE)+' '+pk(NOM),num,poste,st:s,sp:r()<RARETES[rar].sp?pk(TOUS):sp,rar})}});return out})(); // 300 joueurs, toujours les mêmes
let TIR_BASE=25,TIR_K=7,DIST_FREE=20,DIST_K=1.2,DIST_MAX=55,PEN_CHANCE=30,MEL_SENS=2; // tir au but, pénalités, mêlée
