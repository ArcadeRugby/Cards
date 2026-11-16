/* DONNÉES DU JEU : à modifier pour régler le gameplay, les raretés, les boosters */
const PRE=['Léo','Hugo','Théo','Noé','Lucas','Maël','Yanis','Paul','Enzo','Axel','Tom','Jules','Nino','Rémi','Sacha','Ethan','Marius','Gaël','Loïc','Nils'];
const NOM=['Dupont','Marty','Roux','Faure','Ducasse','Lasserre','Cazaux','Pujol','Barrère','Soulé','Laborde','Camy','Dufau','Larrieu','Sempé','Castex','Lamour','Vidal','Mourgues','Peyret'];
/* ====== DONNÉES (modifie ici pour changer le gameplay) ====== */
const STATS={f:'Force',v:'Vitesse',p:'Passe',k:'Pied',d:'Défense'};
const POSTES=[ // n°, poste, stats, spécialité
[1,'Pilier',{f:8,v:3,p:3,k:2,d:7},'Percuter'],[2,'Talonneur',{f:7,v:4,p:4,k:2,d:7},'Percuter'],
[3,'Pilier',{f:8,v:3,p:3,k:2,d:7},'Plaquer'],[4,'Deuxième ligne',{f:7,v:4,p:3,k:2,d:7},'Monter'],
[5,'Deuxième ligne',{f:7,v:4,p:3,k:2,d:7},'Plaquer'],[6,'Troisième ligne',{f:7,v:5,p:4,k:2,d:7},'Plaquer'],
[7,'Troisième ligne',{f:6,v:6,p:4,k:2,d:8},'Gratter'],[8,'Numéro 8',{f:8,v:5,p:4,k:2,d:6},'Percuter'],
[9,'Demi de mêlée',{f:4,v:6,p:9,k:5,d:5},'Passer'],[10,'Ouvreur',{f:4,v:6,p:8,k:9,d:5},'Botter'],
[11,'Ailier',{f:4,v:9,p:5,k:4,d:5},'Éviter'],[12,'Centre',{f:6,v:7,p:7,k:3,d:7},'Passer'],
[13,'Centre',{f:6,v:7,p:6,k:3,d:7},'Éviter'],[14,'Ailier',{f:4,v:9,p:5,k:4,d:5},'Éviter'],
[15,'Arrière',{f:5,v:7,p:6,k:8,d:6},'Botter']];
const ATT={Percuter:{s:'f',b:55,g:[3,8]},Éviter:{s:'v',b:45,g:[8,20]},Passer:{s:'p',b:70,g:[5,12]},Botter:{s:'k',b:75,g:[25,40]}};
const DEF=['Plaquer','Gratter','Monter','Couvrir'];
const M={Plaquer:{Percuter:-10,Éviter:0,Passer:0,Botter:5},Gratter:{Percuter:-5,Éviter:10,Passer:5,Botter:5},
Monter:{Percuter:0,Éviter:-10,Passer:-15,Botter:10},Couvrir:{Percuter:5,Éviter:5,Passer:5,Botter:-15}};
let PAR_MI_TEMPS=20;const HOLE_BONUS=15, SPEC_BONUS=12, ECART=4, OPT={pct:true};
const DEPLACEMENT_MAX=.25, SEUIL_PLACE=.12, MIN_EN_PLACE=10; // déplacement max d'un joueur par action, distance « en place », défenseurs minimum en place
const ZONES=[[22,'Tes 22 m'],[50,'Ton camp'],[78,'Camp adverse'],[100,'22 m adverses']];

/* ====== CARRIÈRE : raretés, boosters, récompenses, pool de joueurs ====== */
const RARETES={commun:{n:'Commun',b:0,sp:.1,c:'#9aa5a1',w:55},rare:{n:'Rare',b:1,sp:.4,c:'#3f8ed8',w:28},epique:{n:'Épique',b:2,sp:.7,c:'#9b59d0',w:14},legendaire:{n:'Légendaire',b:3,sp:1,c:'#e6b422',w:3}}; // b = bonus de stats, sp = chance de spécialité aléatoire, w = poids de tirage
const BOOSTER={cartes:5,depart:3}; // cartes par booster ; boosters de départ (3 x 5 = les 15 postes)
const RECOMPENSES={victoire:2,nul:1,defaite:1}; // boosters gagnés après un match de carrière
const COULEURS=['#2f6fe4','#e0a526','#8e44ad','#1fa38a','#e8e8e8','#e4572e'];
const TOUS=['Percuter','Éviter','Passer','Botter','Plaquer','Gratter','Monter','Couvrir'];
const POOL=(()=>{let a=20260101;const r=()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const ri=(x,y)=>x+Math.floor(r()*(y-x+1)),pk=l=>l[Math.floor(r()*l.length)],out=[];let id=0;
 POSTES.forEach(([num,poste,st,sp])=>{for(let k=0;k<20;k++){let t=r()*100,rar='commun';for(const q in RARETES)if((t-=RARETES[q].w)<0){rar=q;break}
  const s={};for(const x in st)s[x]=Math.max(1,Math.min(10,st[x]+ri(-1,1)+RARETES[rar].b));
  out.push({id:'j'+(++id),nom:pk(PRE)+' '+pk(NOM),num,poste,st:s,sp:r()<RARETES[rar].sp?pk(TOUS):sp,rar})}});return out})(); // 300 joueurs, toujours les mêmes
