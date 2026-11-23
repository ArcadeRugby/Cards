/* ====== CARTE JOUEUR : dessinée sur un canvas à partir de la photo et des informations ====== */
const CARTE_L=600,CARTE_H=736,FONT="'Oswald','Bebas Neue','Arial Narrow','Impact',sans-serif";
const FLAG_URL='https://flagcdn.com/w160/{code}.png';   // drapeaux (modifiable)
const ABREV={'Pilier':'PIL','Talonneur':'TAL','Deuxième ligne':'2L','Troisième ligne aile':'3LA','Troisième ligne centre':'3LC','Demi de mêlée':'DM',"Demi d'ouverture":'DO','Ailier':'AIL','Centre':'CEN','Arrière':'ARR'};
/* un thème de couleurs par profil (à ajuster) : fond, trait, cadre */
const THEMES={'International élite':{bg:['#0b1f4d','#173f94'],accent:'#ecca6b',frame:['#f8e19a','#b58a2c']},
 'International':{bg:['#16213d','#34496f'],accent:'#e8ecf2',frame:['#ffffff','#8b96a8']},
 'Première division':{bg:['#2b1a11','#62402a'],accent:'#e8ae7c',frame:['#f3c9a2','#9b6035']},
 'Deuxième division':{bg:['#0b3a2d','#1f6f55'],accent:'#c7ecdb',frame:['#dcf4e8','#4f917a']},
 'Troisième division':{bg:['#35103f','#6a2c83'],accent:'#ead0f4',frame:['#f2dffa','#8d5aa5']},
 'Amateur / régional':{bg:['#272b32','#4b525d'],accent:'#d9dde3',frame:['#eef0f3','#7c8491']},
 defaut:{bg:['#20262c','#3a424b'],accent:'#cfd5dc',frame:['#e6eaee','#7a838e']}};
/* nationalité (en anglais, comme dans la base) -> code du drapeau */
const PAYS={'France':'fr','England':'gb-eng','Scotland':'gb-sct','Wales':'gb-wls','Northern Ireland':'gb-nir','Ireland':'ie','Italy':'it','New Zealand':'nz','South Africa':'za','Australia':'au','Argentina':'ar','Fiji':'fj','Samoa':'ws','Tonga':'to','Georgia':'ge','Japan':'jp','Spain':'es','Romania':'ro','Namibia':'na','Portugal':'pt','Uruguay':'uy','Canada':'ca','United States':'us','United States of America':'us','Russia':'ru','Germany':'de','Belgium':'be','Netherlands':'nl','Chile':'cl','Brazil':'br','Zimbabwe':'zw','Kenya':'ke','Hong Kong':'hk','South Korea':'kr','Paraguay':'py','Poland':'pl','Czech Republic':'cz','Switzerland':'ch','Sweden':'se','Morocco':'ma','Tunisia':'tn',"Côte d'Ivoire":'ci','Ivory Coast':'ci','Senegal':'sn','Madagascar':'mg','Cook Islands':'ck','Papua New Guinea':'pg','Lithuania':'lt','Ukraine':'ua','United Kingdom':'gb','Malta':'mt','Colombia':'co','Peru':'pe','Venezuela':'ve','Mexico':'mx','Jamaica':'jm','Trinidad and Tobago':'tt','Barbados':'bb','Cayman Islands':'ky','Bermuda':'bm','China':'cn','Philippines':'ph','Malaysia':'my','Singapore':'sg','Sri Lanka':'lk','India':'in','Thailand':'th','Kazakhstan':'kz','Uzbekistan':'uz','Israel':'il','Austria':'at','Denmark':'dk','Norway':'no','Finland':'fi','Greece':'gr','Croatia':'hr','Serbia':'rs','Slovenia':'si','Bulgaria':'bg','Hungary':'hu','Moldova':'md','Latvia':'lv','Luxembourg':'lu','Monaco':'mc','Andorra':'ad','Isle of Man':'im','Niue':'nu','French Polynesia':'pf','New Caledonia':'nc','Wallis and Futuna':'wf','Vanuatu':'vu','Solomon Islands':'sb','American Samoa':'as','Cameroon':'cm','Ghana':'gh','Nigeria':'ng','Uganda':'ug','Botswana':'bw','Zambia':'zm','Mauritius':'mu','Algeria':'dz','Egypt':'eg','Dominican Republic':'do','Costa Rica':'cr','Bahamas':'bs','Guyana':'gy','Haiti':'ht','Cuba':'cu','Panama':'pa','Ecuador':'ec','Bolivia':'bo'};
const sbBase=()=>{const S=typeof SUPABASE!=='undefined'?SUPABASE:null;return S&&S.url?String(S.url).trim().replace(/\/+$/,'').replace(/\/rest\/v1$/,'').replace(/\/+$/,''):''};
/* essaie plusieurs adresses d'image à la suite ; renvoie null si aucune ne charge */
function chargerImage(urls){return new Promise(res=>{const l=[].concat(urls).filter(Boolean);let i=0;const essai=()=>{if(i>=l.length)return res(null);const im=new Image();im.crossOrigin='anonymous';im.onload=()=>res(im);im.onerror=()=>{i++;essai()};im.src=l[i]};essai()})}
const urlsPhoto=j=>[j.photo,sbBase()&&`${sbBase()}/storage/v1/object/public/photos/${encodeURIComponent(j.id)}.jpg`,`photos/${encodeURIComponent(j.id)}.jpg`];
const urlsLogo=c=>[sbBase()&&`${sbBase()}/storage/v1/object/public/logos/${c}.png`,`logos/${c}.png`];
function contour(g){g.beginPath();g.moveTo(44,70);g.quadraticCurveTo(44,44,70,40);g.lineTo(250,16);g.quadraticCurveTo(278,12,288,22);g.lineTo(300,10);g.lineTo(312,22);g.quadraticCurveTo(322,12,350,16);g.lineTo(530,40);g.quadraticCurveTo(556,44,556,70);g.lineTo(556,630);g.quadraticCurveTo(556,660,528,676);g.lineTo(330,722);g.quadraticCurveTo(300,730,270,722);g.lineTo(72,676);g.quadraticCurveTo(44,660,44,630);g.closePath()}
function contenir(g,im,x,y,w,h){const k=Math.min(w/im.width,h/im.height),a=im.width*k,b=im.height*k;g.drawImage(im,x+(w-a)/2,y+(h-b)/2,a,b)}
function ajuster(g,txt,max,taille,min,poids){let fs=taille;do{g.font=`${poids||700} ${fs}px ${FONT}`;fs-=2}while(g.measureText(txt).width>max&&fs>min)}
/* dessine la carte du joueur j sur le canvas cv ; renvoie ce qui a été trouvé (photo, drapeau, logo) */
async function dessinerCarte(cv,j){
  const S=2;cv.width=CARTE_L*S;cv.height=CARTE_H*S;const g=cv.getContext('2d');g.setTransform(S,0,0,S,0,0);
  const th=THEMES[j.profil]||THEMES.defaut,code=PAYS[j.nat];
  try{await document.fonts.load('700 100px Oswald')}catch(e){}
  const [photo,flag,logo]=await Promise.all([chargerImage(urlsPhoto(j)),code?chargerImage(FLAG_URL.replace('{code}',code)):null,code?chargerImage(urlsLogo(code)):null]);
  g.save();contour(g);g.clip();
  let d=g.createLinearGradient(0,0,CARTE_L,CARTE_H);d.addColorStop(0,th.bg[0]);d.addColorStop(1,th.bg[1]);g.fillStyle=d;g.fillRect(0,0,CARTE_L,CARTE_H);
  g.fillStyle=th.accent;[[360,0,80,.2],[440,0,36,.32],[478,70,70,.16],[540,140,26,.28]].forEach(([x,y,w,a])=>{g.globalAlpha=a;g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y);g.lineTo(x+w-250,y+340);g.lineTo(x-250,y+340);g.closePath();g.fill()});g.globalAlpha=1;
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
  if(logo)contenir(g,logo,54,320,94,94);
  g.fillStyle=th.accent;g.textAlign='center';const nom=String(j.nom||'').toUpperCase();ajuster(g,nom,450,76,28);g.fillText(nom,300,552);
  g.fillRect(70,568,460,2);
  g.fillRect(300,590,2,100);
  [[190,'POIDS',j.poids?Math.round(j.poids)+' kg':'—',0],[190,'TAILLE',j.taille?Math.round(j.taille)+' cm':'—',1],[412,'POSTE',j.poste||'—',0],[412,'SPÉCIALITÉ',j.spec||'—',1]].forEach(([x,lab,val,r])=>{
    const y=r?650:594;g.fillStyle='rgba(255,255,255,.55)';g.font=`500 14px ${FONT}`;g.fillText(lab,x,y);g.fillStyle=th.accent;ajuster(g,val,180,30,15,600);g.fillText(val,x,y+27)});
  g.restore();
  const fr=g.createLinearGradient(0,0,CARTE_L,CARTE_H);fr.addColorStop(0,th.frame[0]);fr.addColorStop(.5,th.frame[1]);fr.addColorStop(1,th.frame[0]);
  contour(g);g.lineWidth=9;g.strokeStyle=fr;g.lineJoin='round';g.stroke();contour(g);g.lineWidth=1.5;g.strokeStyle='rgba(255,255,255,.35)';g.stroke();
  return{photo:!!photo,flag:!!flag,logo:!!logo,code};
}
