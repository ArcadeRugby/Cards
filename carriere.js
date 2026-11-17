/* ====== CARRIÈRE : club, boosters, collection ====== */
let MODE='direct',XV=null,COULEUR_ME='#2f6fe4',CAR=null;
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
function xvPage(){const ids=idsXV();$('x-note').textContent='Aucun malus automatique : un joueur hors poste garde ses stats, c\'est à toi de juger s\'il convient.';
  $('x-grid').innerHTML=ids.map((id,i)=>{const k=carteDe(id);return `<button class="slot${i===sel?' sel':''}" data-i="${i}" style="--c:${RARETES[k.rar].c}"><b>n°${i+1} ${POSTES[i][1]}</b><br>${k.nom}<br><small>${RARETES[k.rar].n} · total ${tot(k)}${k.num!==i+1?' · <span class="hp">hors poste</span>':''}</small></button>`}).join('');
  document.querySelectorAll('.slot').forEach(b=>b.onclick=()=>{sel=+b.dataset.i;xvPage()});
  if(sel<0){$('x-pick').innerHTML='<p class="note">Clique sur un poste pour changer son titulaire.</p>';return}
  const n=sel+1,l=[...new Set(CAR.cartes)].map(carteDe).filter(Boolean).sort((a,b)=>(b.num===n)-(a.num===n)||tot(b)-tot(a));
  $('x-pick').innerHTML=`<h3>n°${n} ${POSTES[sel][1]} : choisis un joueur</h3>`+l.map(k=>{const q=ids.indexOf(k.id);return `<button class="opt" data-id="${k.id}" style="--c:${RARETES[k.rar].c}"><span>${k.nom} <small>n°${k.num} ${k.poste}${k.num!==n?' · hors poste':''}${q>=0&&q!==sel?' · titulaire n°'+(q+1):''}${q===sel?' · en place':''}</small></span><b>${RARETES[k.rar].n} · A ${k.st.pu}/${k.st.vi}/${k.st.te}/${k.st.pi} · D ${k.st.pl}/${k.st.mo}/${k.st.an}/${k.st.co}</b></button>`}).join('');
  document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>choisir(b.dataset.id))}
function choisir(id){const ids=idsXV(),q=ids.indexOf(id),old=ids[sel];
  if(q!==sel){const used=ids.filter(x=>x===id).length,own=CAR.cartes.filter(x=>x===id).length;if(q>=0&&used>=own)ids[q]=old;ids[sel]=id}
  CAR.xv=ids;sauve();sel=-1;xvPage()}
const resume=c=>`Att ${c.st.pu}·${c.st.vi}·${c.st.te}·${c.st.pi}<br>Déf ${c.st.pl}·${c.st.mo}·${c.st.an}·${c.st.co}<br>Ph ${c.st.me}·${c.st.la}·${c.st.de}·${c.st.tb}`;
const faceCarte=c=>`<div class="carte" style="--c:${RARETES[c.rar].c}"><i><div class="dos"></div><div class="face"><b>${c.nom}</b><br>n°${c.num} · ${c.poste}<br><span style="color:${RARETES[c.rar].c};font-weight:700">${RARETES[c.rar].n}</span><br>${resume(c)}<br>★ ${c.sp}</div></i></div>`;
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
  $('c-col').innerHTML=dep?'':'<table><thead><tr><th>XV</th><th>N°</th><th>Nom</th><th>Poste</th><th>Rareté</th>'+Object.values(STATS).map(x=>`<th>${x}</th>`).join('')+'<th>Spécialité</th></tr></thead><tbody>'+
   collection().map(c=>`<tr><td>${xv.includes(c.id)?'✔':''}</td><td>${c.num}</td><td>${c.nom}</td><td>${c.poste}</td><td style="color:${RARETES[c.rar].c}">${RARETES[c.rar].n}</td>${Object.keys(STATS).map(k=>`<td>${c.st[k]}</td>`).join('')}<td>${c.sp}</td></tr>`).join('')+'</tbody></table>'}
function finMatch(res){const n=RECOMPENSES[res];CAR.boosters+=n;sauve();return ` · +${n} booster${n>1?'s':''} gagné${n>1?'s':''} !`}
/* ---- branchements ---- */
let coul=COULEURS[0];
$('sw').innerHTML=COULEURS.map((c,i)=>`<button class="sw${i?'':' on'}" data-c="${c}" style="background:${c}" aria-label="Couleur ${i+1}"></button>`).join('');
document.querySelectorAll('.sw').forEach(b=>b.onclick=()=>{coul=b.dataset.c;document.querySelectorAll('.sw').forEach(x=>x.classList.toggle('on',x===b))});
$('b-car').onclick=()=>{CAR=charge();if(CAR){COULEUR_ME=CAR.club.couleur;go('car')}else go('club')};
$('k-ok').onclick=()=>{CAR={club:{nom:($('k-nom').value.trim()||'Mon club').slice(0,20),couleur:coul},cartes:[],depart:BOOSTER.depart,boosters:0};COULEUR_ME=coul;sauve();go('car')};
$('c-open').onclick=()=>{if(CAR.depart>0){const k=BOOSTER.depart-CAR.depart;CAR.depart--;ouvrir(lotDepart(k),'Booster de départ '+(k+1)+'/'+BOOSTER.depart)}else if(CAR.boosters>0){CAR.boosters--;ouvrir(tirer(BOOSTER.cartes),'Nouveau booster')}};
$('c-play').onclick=()=>{MODE='carriere';COULEUR_ME=CAR.club.couleur;XV=buildXV();go('match');init()};
$('c-reset').onclick=()=>{if(confirm('Effacer cette carrière et recommencer ?')){try{localStorage.removeItem(CLE)}catch(e){}CAR=null;go('club')}};
$('c-xv').onclick=()=>{sel=-1;go('xv')};
$('x-auto').onclick=()=>{CAR.xv=composerXV().map(x=>x.id);sauve();sel=-1;xvPage()};
