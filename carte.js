/* ====== CARTE JOUEUR : dessinée sur un canvas à partir de la photo et des informations ====== */
const CARTE_L=600,CARTE_H=736,FONT="'Oswald','Bebas Neue','Arial Narrow','Impact',sans-serif";
const FLAG_URL='https://flagcdn.com/w160/{code}.png';   // drapeaux (modifiable)
const ABREV={'Pilier':'PIL','Talonneur':'TAL','Deuxième ligne':'2L','Troisième ligne aile':'3LA','Troisième ligne centre':'3LC','Demi de mêlée':'DM',"Demi d'ouverture":'DO','Ailier':'AIL','Centre':'CEN','Arrière':'ARR'};
/* un thème par rareté : couleurs, brillance, halo, éclats, rayons, effet holographique (à ajuster) */
const THEMES={
 commun:{n:'Commune',bg:['#1c2530','#3b4858'],accent:'#dcc7a6',frame:['#ead9bf','#8c6c46']},
 rare:{n:'Rare',bg:['#0e2a5c','#2b5fb3'],accent:'#dbe9ff',frame:['#f4f8ff','#7f9bc9'],gloss:.16},
 epique:{n:'Épique',bg:['#2a0f4b','#6a2eb2'],accent:'#f1ddff',frame:['#fff0ff','#a56ad6'],gloss:.22,glow:'#b57bff',eclats:14},
 legendaire:{n:'Légendaire',bg:['#0b1f4d','#1b49a4'],accent:'#f4d57e',frame:['#fff2b8','#b8892a'],gloss:.26,glow:'#ffd34d',eclats:30,rayons:1,holo:1}};
/* si la colonne « rareté » est vide, on déduit une rareté du profil (à modifier ou à supprimer) */
const RARETE_PAR_PROFIL={'International élite':'legendaire','International':'epique','Première division':'rare'};
const _RK={commun:'commun',commune:'commun',rare:'rare',epique:'epique',legendaire:'legendaire'};
const rareteDe=j=>_RK[String(j.rarete||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()]||RARETE_PAR_PROFIL[j.profil]||'commun';
/* nationalité (en anglais, comme dans la base) -> code du drapeau */
const PAYS={'France':'fr','England':'gb-eng','Scotland':'gb-sct','Wales':'gb-wls','Northern Ireland':'gb-nir','Ireland':'ie','Italy':'it','New Zealand':'nz','South Africa':'za','Australia':'au','Argentina':'ar','Fiji':'fj','Samoa':'ws','Tonga':'to','Georgia':'ge','Japan':'jp','Spain':'es','Romania':'ro','Namibia':'na','Portugal':'pt','Uruguay':'uy','Canada':'ca','United States':'us','United States of America':'us','Russia':'ru','Germany':'de','Belgium':'be','Netherlands':'nl','Chile':'cl','Brazil':'br','Zimbabwe':'zw','Kenya':'ke','Hong Kong':'hk','South Korea':'kr','Paraguay':'py','Poland':'pl','Czech Republic':'cz','Switzerland':'ch','Sweden':'se','Morocco':'ma','Tunisia':'tn',"Côte d'Ivoire":'ci','Ivory Coast':'ci','Senegal':'sn','Madagascar':'mg','Cook Islands':'ck','Papua New Guinea':'pg','Lithuania':'lt','Ukraine':'ua','United Kingdom':'gb','Malta':'mt','Colombia':'co','Peru':'pe','Venezuela':'ve','Mexico':'mx','Jamaica':'jm','Trinidad and Tobago':'tt','Barbados':'bb','Cayman Islands':'ky','Bermuda':'bm','China':'cn','Philippines':'ph','Malaysia':'my','Singapore':'sg','Sri Lanka':'lk','India':'in','Thailand':'th','Kazakhstan':'kz','Uzbekistan':'uz','Israel':'il','Austria':'at','Denmark':'dk','Norway':'no','Finland':'fi','Greece':'gr','Croatia':'hr','Serbia':'rs','Slovenia':'si','Bulgaria':'bg','Hungary':'hu','Moldova':'md','Latvia':'lv','Luxembourg':'lu','Monaco':'mc','Andorra':'ad','Isle of Man':'im','Niue':'nu','French Polynesia':'pf','New Caledonia':'nc','Wallis and Futuna':'wf','Vanuatu':'vu','Solomon Islands':'sb','American Samoa':'as','Cameroon':'cm','Ghana':'gh','Nigeria':'ng','Uganda':'ug','Botswana':'bw','Zambia':'zm','Mauritius':'mu','Algeria':'dz','Egypt':'eg','Dominican Republic':'do','Costa Rica':'cr','Bahamas':'bs','Guyana':'gy','Haiti':'ht','Cuba':'cu','Panama':'pa','Ecuador':'ec','Bolivia':'bo'};
const sbBase=()=>{const S=typeof SUPABASE!=='undefined'?SUPABASE:null;return S&&S.url?String(S.url).trim().replace(/\/+$/,'').replace(/\/rest\/v1$/,'').replace(/\/+$/,''):''};
/* essaie plusieurs adresses d'image à la suite ; renvoie null si aucune ne charge */
/* essaie d'abord avec autorisation d'export ; si le site ne l'autorise pas, l'image s'affiche quand même (mais le PNG ne pourra pas être téléchargé) */
function chargerImage(urls){return new Promise(res=>{const l=[].concat(urls).filter(Boolean);let i=0,cors=true;const essai=()=>{if(i>=l.length)return res(null);const im=new Image();if(cors)im.crossOrigin='anonymous';im.onload=()=>{im.sansCors=!cors;res(im)};im.onerror=()=>{if(cors&&/^https?:/.test(l[i]))cors=false;else{cors=true;i++}essai()};im.src=l[i]};essai()})}
const urlsPhoto=j=>[j.photo,sbBase()&&`${sbBase()}/storage/v1/object/public/photos/${encodeURIComponent(j.id)}.jpg`,`photos/${encodeURIComponent(j.id)}.jpg`];
/* logos des clubs : fichier logos/clubs/<nom-du-club>.png ; adresses web possibles, par exemple LOGOS_CLUBS['stade-toulousain']='https://…/logo.png' */
const LOGOS_CLUBS={};
const slugClub=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const urlsLogoClub=club=>{const s=slugClub(club);return s?[LOGOS_CLUBS[s],sbBase()&&`${sbBase()}/storage/v1/object/public/logos/clubs/${s}.png`,`logos/clubs/${s}.png`]:[]};
/* étoile à 4 branches */
function etoile(g,x,y,r,a){g.save();g.globalAlpha=a;g.beginPath();for(let i=0;i<8;i++){const R=i%2?r*.28:r,t=i*Math.PI/4;g.lineTo(x+Math.cos(t)*R,y+Math.sin(t)*R)}g.closePath();g.fill();g.restore()}
/* rayons derrière la photo (rareté la plus haute) */
function rayons(g,th){g.save();g.translate(320,250);g.fillStyle=th.accent;for(let i=0;i<24;i++){g.globalAlpha=i%2?.0:.09;g.beginPath();g.moveTo(0,0);g.arc(0,0,620,i*Math.PI/12,(i+1)*Math.PI/12);g.closePath();g.fill()}g.restore()}
/* effets par-dessus la carte : brillance, reflets holographiques, éclats (positions fixes pour un même joueur) */
function effets(g,th,j){
  if(th.gloss){const gl=g.createLinearGradient(0,0,CARTE_L,CARTE_H);gl.addColorStop(.28,'rgba(255,255,255,0)');gl.addColorStop(.42,`rgba(255,255,255,${th.gloss})`);gl.addColorStop(.52,'rgba(255,255,255,0)');gl.addColorStop(.7,`rgba(255,255,255,${th.gloss*.5})`);gl.addColorStop(.78,'rgba(255,255,255,0)');g.fillStyle=gl;g.fillRect(0,0,CARTE_L,CARTE_H)}
  if(th.holo){const h=g.createLinearGradient(40,40,560,720);['#ff6ec7','#ffd36e','#7dff9b','#6ee0ff','#a98bff','#ff6ec7'].forEach((col,i)=>h.addColorStop(i/5,col));g.save();g.globalCompositeOperation='overlay';g.globalAlpha=.34;g.fillStyle=h;g.fillRect(0,0,CARTE_L,CARTE_H);g.restore()}
  if(th.eclats){let s=[...String(j.id||j.nom)].reduce((a,ch)=>(a*31+ch.charCodeAt(0))|0,7);const r=()=>{s=(s*1664525+1013904223)|0;return(s>>>0)/4294967296};g.fillStyle='#fff';
    for(let i=0;i<th.eclats;i++)etoile(g,60+r()*480,40+r()*520,3+r()*8,.35+r()*.6)}}
function contour(g){g.beginPath();g.moveTo(44,70);g.quadraticCurveTo(44,44,70,40);g.lineTo(250,16);g.quadraticCurveTo(278,12,288,22);g.lineTo(300,10);g.lineTo(312,22);g.quadraticCurveTo(322,12,350,16);g.lineTo(530,40);g.quadraticCurveTo(556,44,556,70);g.lineTo(556,630);g.quadraticCurveTo(556,660,528,676);g.lineTo(330,722);g.quadraticCurveTo(300,730,270,722);g.lineTo(72,676);g.quadraticCurveTo(44,660,44,630);g.closePath()}
function contenir(g,im,x,y,w,h){const k=Math.min(w/im.width,h/im.height),a=im.width*k,b=im.height*k;g.drawImage(im,x+(w-a)/2,y+(h-b)/2,a,b)}
function ajuster(g,txt,max,taille,min,poids){let fs=taille;do{g.font=`${poids||700} ${fs}px ${FONT}`;fs-=2}while(g.measureText(txt).width>max&&fs>min)}
/* dessine la carte du joueur j sur le canvas cv ; renvoie ce qui a été trouvé (photo, drapeau, logo) */
async function dessinerCarte(cv,j){
  const S=2;cv.width=CARTE_L*S;cv.height=CARTE_H*S;const g=cv.getContext('2d');g.setTransform(S,0,0,S,0,0);
  const rk=rareteDe(j),th=THEMES[rk],code=(typeof pays==='function'?pays(j.nat).code:PAYS[j.nat]);
  try{await document.fonts.load('700 100px Oswald')}catch(e){}
  const [photo,flag,logo]=await Promise.all([chargerImage(urlsPhoto(j)),code?chargerImage(FLAG_URL.replace('{code}',code)):null,j.club?chargerImage(urlsLogoClub(j.club)):null]);
  g.save();contour(g);g.clip();
  let d=g.createLinearGradient(0,0,CARTE_L,CARTE_H);d.addColorStop(0,th.bg[0]);d.addColorStop(1,th.bg[1]);g.fillStyle=d;g.fillRect(0,0,CARTE_L,CARTE_H);
  g.fillStyle=th.accent;[[360,0,80,.2],[440,0,36,.32],[478,70,70,.16],[540,140,26,.28]].forEach(([x,y,w,a])=>{g.globalAlpha=a;g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y);g.lineTo(x+w-250,y+340);g.lineTo(x-250,y+340);g.closePath();g.fill()});g.globalAlpha=1;
  if(th.rayons)rayons(g,th);
  const o=document.createElement('canvas');o.width=CARTE_L*S;o.height=CARTE_H*S;const og=o.getContext('2d');og.setTransform(S,0,0,S,0,0);
  if(photo){const bx=90,by=34,bw=460,bh=480,k=Math.max(bw/photo.width,bh/photo.height),w=photo.width*k,h=photo.height*k;og.drawImage(photo,bx+(bw-w)/2,by-(h-bh)*.2,w,h)}
  else{og.fillStyle=th.accent;og.globalAlpha=.28;og.beginPath();og.arc(320,215,78,0,7);og.fill();og.beginPath();og.ellipse(320,430,150,120,0,0,7);og.fill();og.globalAlpha=1}
  og.globalCompositeOperation='destination-in';const m=og.createRadialGradient(322,250,130,322,262,285);m.addColorStop(0,'#000');m.addColorStop(.7,'#000');m.addColorStop(1,'rgba(0,0,0,0)');og.fillStyle=m;og.fillRect(0,0,CARTE_L,CARTE_H);
  g.drawImage(o,0,0,CARTE_L,CARTE_H);
  d=g.createLinearGradient(0,420,0,520);d.addColorStop(0,'rgba(5,10,25,0)');d.addColorStop(1,'rgba(5,10,25,.93)');g.fillStyle=d;g.fillRect(0,420,CARTE_L,CARTE_H-420);
  g.fillStyle='rgba(5,10,25,.93)';g.fillRect(0,520,CARTE_L,CARTE_H-520);
  g.fillStyle=th.accent;g.textAlign='left';g.textBaseline='alphabetic';
  g.font=`700 118px ${FONT}`;g.fillText(j.note==null?'—':String(j.note),56,160);
  g.font=`600 48px ${FONT}`;g.fillText(ABREV[j.poste]||'',60,212);
  g.fillRect(58,226,70,3);
  if(flag){g.save();g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=6;contenir(g,flag,58,246,86,58);g.restore()}
  else if(code){g.fillStyle='rgba(255,255,255,.18)';g.fillRect(58,250,86,50);g.fillStyle=th.accent;g.font=`600 26px ${FONT}`;g.textAlign='center';g.fillText(code.slice(-2).toUpperCase(),101,284);g.textAlign='left'}
  if(logo)contenir(g,logo,54,316,92,92);
  g.fillStyle=th.accent;g.textAlign='center';const nom=String(j.nom||'').toUpperCase();ajuster(g,nom,450,76,28);g.fillText(nom,300,552);
  g.fillRect(70,568,460,2);
  g.fillRect(300,590,2,100);
  [[190,'POIDS',j.poids?Math.round(j.poids)+' kg':'—',0],[190,'TAILLE',j.taille?Math.round(j.taille)+' cm':'—',1],[412,'POSTE',j.poste||'—',0],[412,'SPÉCIALITÉ',j.spec||'—',1]].forEach(([x,lab,val,r])=>{
    const y=r?650:594;g.fillStyle='rgba(255,255,255,.55)';g.font=`500 14px ${FONT}`;g.fillText(lab,x,y);g.fillStyle=th.accent;ajuster(g,val,180,30,15,600);g.fillText(val,x,y+27)});
  effets(g,th,j);
  g.restore();
  const fr=g.createLinearGradient(0,0,CARTE_L,CARTE_H);fr.addColorStop(0,th.frame[0]);fr.addColorStop(.5,th.frame[1]);fr.addColorStop(1,th.frame[0]);
  if(th.glow){g.shadowColor=th.glow;g.shadowBlur=30}
  contour(g);g.lineWidth=9;g.strokeStyle=fr;g.lineJoin='round';g.stroke();g.shadowBlur=0;g.shadowColor='transparent';contour(g);g.lineWidth=1.5;g.strokeStyle='rgba(255,255,255,.35)';g.stroke();
  return{photo:!!photo,flag:!!flag,logo:!!logo,code,rarete:rk,exportable:![photo,flag,logo].some(im=>im&&im.sansCors)};
}
