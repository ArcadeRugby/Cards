/* ====== CARRIÈRE : club, boosters, collection ====== */
let MODE='direct',XV=null,COULEUR_ME='#2f6fe4',CAR=null,ROLES=null;
const CLE='rugby_carriere',tot=c=>Object.values(c.st).reduce((x,y)=>x+y,0);
const sauve=()=>{try{localStorage.setItem(CLE,JSON.stringify(CAR))}catch(e){}};
const charge=()=>{try{return JSON.parse(localStorage.getItem(CLE))}catch(e){return null}};
const collection=()=>CAR.cartes.map(id=>POOL.find(c=>c.id===id)).filter(Boolean).sort((a,b)=>a.num-b.num||tot(b)-tot(a));
const composerXV=()=>POSTES.map(([n])=>collection().filter(c=>c.num===n).sort((a,b)=>tot(b)-tot(a))[0]).filter(Boolean);
function tirer(n){const o=[];for(let i=0;i<n;i++){let t=Math.random()*100,r='commun';for(const q in RARETES)if((t-=RARETES[q].w)<0){r=q;break}const l=POOL.filter(c=>c.rar===r);o.push(l[R(0,l.length-1)])}return o}
function lotDepart(k){const per=15/BOOSTER.depart;return POSTES.slice(k*per,k*per+per).map(([n])=>{let l=POOL.filter(c=>c.num===n&&c.rar==='commun');if(!l.length)l=POOL.filter(c=>c.num===n);return l[R(0,l.length-1)]})}
const carteDe=id=>POOL.find(x=>x.id===id);
function idsXV(){const col=collection();if(!(CAR.xv&&CAR.xv.length===15&&CAR.xv.every(id=>col.some(x=>x.id===id)))){CAR.xv=composerXV().map(x=>x.id);sauve()}return CAR.xv}
function buildXV(){return idsXV().map((id,i)=>{const k=carteDe(id);return k.num===i+1?k:{...k,num:i+1,hors:true}})}
let sel=-1;
/* ====== RÔLES : lanceur, sauteurs, buteur (index de poste 0 à 14) ====== */
const ROLES_DEF=[['lanceur','Lanceur en touche','la'],['saut1','Sauteur de tête d\'alignement','de'],['saut2','Sauteur de fond d\'alignement','de'],['buteur','Buteur','tb']];
function rolesAuto(xv){const best=(k,ex=[])=>xv.map((p,i)=>i).filter(i=>!ex.includes(i)).sort((a,b)=>xv[b].st[k]-xv[a].st[k])[0];
  const l=best('la'),s1=best('de',[l]),s2=best('de',[l,s1]);return{lanceur:l,saut1:s1,saut2:s2,buteur:best('tb')}}
function getRoles(){const r=CAR.roles;if(!(r&&ROLES_DEF.every(([k])=>Number.isInteger(r[k])&&r[k]>=0&&r[k]<15))){CAR.roles=rolesAuto(buildXV());sauve()}return CAR.roles}
function setRole(k,v){const r=getRoles(),old=r[k],lin=['lanceur','saut1','saut2'];if(lin.includes(k))for(const o of lin)if(o!==k&&r[o]===v)r[o]=old;r[k]=v;CAR.roles=r;sauve();xvPage()}
function rolesUI(){const xv=buildXV(),r=getRoles();
  $('x-roles').innerHTML=ROLES_DEF.map(([k,l,s])=>`<label>${l}<select data-r="${k}">${xv.map((p,i)=>`<option value="${i}"${r[k]===i?' selected':''}>n°${i+1} ${p.nom} — ${STATS[s]} ${p.st[s]}</option>`).join('')}</select></label>`).join('');
  document.querySelectorAll('#x-roles select').forEach(s=>s.onchange=()=>setRole(s.dataset.r,+s.value))}
function xvPage(){const ids=idsXV();rolesUI();$('x-note').textContent='Aucun malus automatique : un joueur hors poste garde ses stats, c\'est à toi de juger s\'il convient.';
  $('x-grid').innerHTML=ids.map((id,i)=>{const k=carteDe(id);return `<button class="slot${i===sel?' sel':''}" data-i="${i}" style="--c:${RARETES[k.rar].c}"><b>n°${i+1} ${POSTES[i][1]}</b><br>${k.nom}<br><small>${RARETES[k.rar].n} · total ${tot(k)}${k.num!==i+1?' · <span class="hp">hors poste</span>':''}</small></button>`}).join('');
  document.querySelectorAll('.slot').forEach(b=>b.onclick=()=>{sel=+b.dataset.i;xvPage()});
  if(sel<0){$('x-pick').innerHTML='<p class="note">Clique sur un poste pour changer son titulaire.</p>';return}
  const n=sel+1,l=[...new Set(CAR.cartes)].map(carteDe).filter(Boolean).sort((a,b)=>(b.num===n)-(a.num===n)||tot(b)-tot(a));
  $('x-pick').innerHTML=`<h3>n°${n} ${POSTES[sel][1]} : choisis un joueur</h3>`+l.map(k=>{const q=ids.indexOf(k.id);return `<button class="opt" data-id="${k.id}" style="--c:${RARETES[k.rar].c}"><span>${k.nom} <small>n°${k.num} ${k.poste}${k.num!==n?' · hors poste':''}${q>=0&&q!==sel?' · titulaire n°'+(q+1):''}${q===sel?' · en place':''}</small></span><b>${RARETES[k.rar].n} · A ${k.st.pu}/${k.st.vi}/${k.st.te}/${k.st.pi} · D ${k.st.pl}/${k.st.mo}/${k.st.an}/${k.st.co}</b></button>`}).join('');
  document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>choisir(b.dataset.id))}
function choisir(id){const ids=idsXV(),q=ids.indexOf(id),old=ids[sel];
  if(q!==sel){const used=ids.filter(x=>x===id).length,own=CAR.cartes.filter(x=>x===id).length;if(q>=0&&used>=own)ids[q]=old;ids[sel]=id}
  CAR.xv=ids;sauve();sel=-1;xvPage()}
const GR=['pu','vi','te','pi','pl','mo','an','co','me','la','de','tb'];
const fiche=c=>`${avatar(c,'photo')}<b>${escH(c.nom)}</b><span class="sub">n°${c.num} ${c.poste} · <span style="color:${RARETES[c.rar].c};font-weight:700">${RARETES[c.rar].n}</span></span><div class="sts">${GR.map(k=>`<span><i>${k}</i>${c.st[k]}</span>`).join('')}</div><div>★ ${c.sp}</div><div class="bio">${[c.age&&c.age+' ans',c.poids&&c.poids+' kg',c.taille&&c.taille+' cm',c.nat].filter(Boolean).map(escH).join(' · ')}</div>`;
const faceCarte=c=>`<div class="carte" style="--c:${RARETES[c.rar].c}"><i><div class="dos"></div><div class="face fiche">${fiche(c)}</div></i></div>`;
function ouvrir(cartes,titre){
  go('boost');$('b-titre').textContent=titre;$('b-cards').innerHTML=cartes.map(faceCarte).join('');
  CAR.cartes.push(...cartes.map(c=>c.id));sauve();const b=$('b-btn'),els=[...document.querySelectorAll('#b-cards .carte')];
  b.textContent='Révéler les cartes';b.disabled=false;
  b.onclick=()=>{b.disabled=true;els.forEach((e,i)=>setTimeout(()=>e.classList.add('on'),i*500));setTimeout(()=>{b.textContent='Continuer';b.disabled=false;b.onclick=()=>go('car')},els.length*500+400)}}
function hub(){
  $('c-titre').innerHTML=`<span class="pastille" style="background:${CAR.club.couleur}"></span>${CAR.club.nom}`;
  const dep=CAR.depart>0;$('c-info').textContent=dep?`Ouvre tes ${CAR.depart} boosters de départ pour recevoir tes 15 premiers joueurs.`:`${CAR.cartes.length} cartes · ${CAR.boosters} booster${CAR.boosters>1?'s':''} disponible${CAR.boosters>1?'s':''}`;
  const o=$('c-open');o.textContent=dep?`Ouvrir un booster de départ (${CAR.depart})`:`Ouvrir un booster (${CAR.boosters})`;o.disabled=!dep&&CAR.boosters<1;
  $('c-play').disabled=dep;
  const xv=dep?[]:idsXV();$('c-xv').disabled=dep;
  $('c-col').innerHTML=dep?'':'<div class="cards" style="justify-content:flex-start">'+collection().map(c=>{const q=xv.indexOf(c.id);return `<div class="carteF fiche" style="--c:${RARETES[c.rar].c}">${q>=0?`<span class="badge">XV n°${q+1}</span>`:''}${fiche(c)}</div>`}).join('')+'</div>'}
function finMatch(res){const n=RECOMPENSES[res];CAR.boosters+=n;sauve();return ` · +${n} booster${n>1?'s':''} gagné${n>1?'s':''} !`}
/* ---- branchements ---- */
let coul=COULEURS[0];
$('sw').innerHTML=COULEURS.map((c,i)=>`<button class="sw${i?'':' on'}" data-c="${c}" style="background:${c}" aria-label="Couleur ${i+1}"></button>`).join('');
document.querySelectorAll('.sw').forEach(b=>b.onclick=()=>{coul=b.dataset.c;document.querySelectorAll('.sw').forEach(x=>x.classList.toggle('on',x===b))});
$('b-car').onclick=()=>{CAR=charge();if(CAR){COULEUR_ME=CAR.club.couleur;go('car')}else go('club')};
$('k-ok').onclick=()=>{CAR={club:{nom:($('k-nom').value.trim()||'Mon club').slice(0,20),couleur:coul},cartes:[],depart:BOOSTER.depart,boosters:0};COULEUR_ME=coul;sauve();go('car')};
$('c-open').onclick=()=>{if(CAR.depart>0){const k=BOOSTER.depart-CAR.depart;CAR.depart--;ouvrir(lotDepart(k),'Booster de départ '+(k+1)+'/'+BOOSTER.depart)}else if(CAR.boosters>0){CAR.boosters--;ouvrir(tirer(BOOSTER.cartes),'Nouveau booster')}};
$('c-play').onclick=()=>{MODE='carriere';COULEUR_ME=CAR.club.couleur;XV=buildXV();ROLES=getRoles();go('match');init()};
$('c-reset').onclick=()=>{if(confirm('Effacer cette carrière et recommencer ?')){try{localStorage.removeItem(CLE)}catch(e){}CAR=null;go('club')}};
$('c-xv').onclick=()=>{sel=-1;go('xv')};
$('x-auto').onclick=()=>{CAR.xv=composerXV().map(x=>x.id);CAR.roles=null;sauve();sel=-1;xvPage()};
