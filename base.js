/* ====== BASE DE DONNÉES JOUEURS : lecture, vérification et export de joueurs.csv ====== */
const COLS=['id','nom','poste','rarete',...CLES,'specialite','age','poids','taille','nationalite','photo'];
const norm=s=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const escH=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
/* lit un CSV (séparateur « ; » ou « , », guillemets, UTF-8 ou Excel) */
function parseCSV(txt){
  txt=txt.replace(/^\uFEFF/,'');const l1=txt.split('\n')[0],sep=(l1.match(/;/g)||[]).length>=(l1.match(/,/g)||[]).length?';':',';
  const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<txt.length;i++){const ch=txt[i];
    if(q){if(ch==='"'){if(txt[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
    else if(ch==='"')q=true;else if(ch===sep){row.push(cur);cur=''}
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&txt[i+1]==='\n')i++;row.push(cur);cur='';if(row.some(x=>x!==''))rows.push(row);row=[]}else cur+=ch}
  row.push(cur);if(row.some(x=>x!==''))rows.push(row);return rows}
const decoder=buf=>{try{return new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch(e){return new TextDecoder('windows-1252').decode(buf)}};
/* vérifie des lignes (objets avec les colonnes COLS) : renvoie les joueurs valides + les erreurs lisibles */
function validerLignes(lignes,debut){
  const erreurs=[],joueurs=[],ids=new Set(),rmap={},smap={};Object.keys(RARETES).forEach(k=>{rmap[norm(k)]=k;rmap[norm(RARETES[k].n)]=k});Object.keys(SPEC).forEach(k=>smap[norm(k)]=k);
  lignes.forEach((r,n)=>{const L=n+debut,g=k=>String(r[k]==null?'':r[k]).trim(),err=m=>{erreurs.push(`Ligne ${L} : ${m}`);ok=false};let ok=true;
    const id=g('id'),nom=g('nom'),num=parseInt(g('poste'),10),rar=rmap[norm(g('rarete'))],po=POSTES.find(p=>p[0]===num);
    if(!id)err('identifiant vide');else if(ids.has(id))err('identifiant en double ('+id+')');
    if(!nom)err('nom vide');if(!po)err('poste invalide « '+g('poste')+' » (1 à 15)');if(!rar)err('rareté inconnue « '+g('rarete')+' »');
    const st={};CLES.forEach(k=>{const v=parseInt(g(k),10);if(!(v>=1&&v<=10))err(`stat « ${k} » invalide « ${g(k)} » (1 à 10)`);st[k]=v});
    const sp=smap[norm(g('specialite'))];if(g('specialite')&&!sp)err('spécialité inconnue « '+g('specialite')+' »');
    if(!ok)return;ids.add(id);
    joueurs.push({id,nom,num,poste:po[1],st,sp:sp||po[3],rar,age:parseInt(g('age'),10)||null,poids:parseInt(g('poids'),10)||null,taille:parseInt(g('taille'),10)||null,nat:g('nationalite'),photo:g('photo')})});
  return{joueurs,erreurs}}
/* transforme le texte CSV en joueurs valides + liste d'erreurs lisibles */
function lireJoueurs(txt){
  const rows=parseCSV(txt);if(!rows.length)return{joueurs:[],erreurs:['Fichier vide.']};
  const head=rows[0].map(norm),idx=k=>head.indexOf(k),manq=COLS.filter(k=>k!=='photo'&&idx(k)<0);
  if(manq.length)return{joueurs:[],erreurs:['Colonnes manquantes : '+manq.join(', ')+'. Première ligne attendue : '+COLS.join(';')]};
  return validerLignes(rows.slice(1).map(r=>Object.fromEntries(COLS.map(k=>[k,idx(k)<0?'':r[idx(k)]]))),2)}
/* exporte en CSV (ouvrable dans Excel / Google Sheets) */
function versCSV(pool){const q=v=>{v=v==null?'':String(v);return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  return '\uFEFF'+[COLS.join(';')].concat(pool.map(p=>[p.id,p.nom,p.num,RARETES[p.rar].n,...CLES.map(k=>p.st[k]),p.sp,p.age,p.poids,p.taille,p.nat,p.photo].map(q).join(';'))).join('\r\n')+'\r\n'}
/* tableau poste x rareté (alerte si un poste n'a aucun joueur commun) */
function tableBilan(pool){const RK=Object.keys(RARETES);
  return '<div class="wrap"><table><tr><th>Poste</th>'+RK.map(k=>`<th>${RARETES[k].n}</th>`).join('')+'<th>Total</th></tr>'+POSTES.map(([n,p])=>{const l=pool.filter(j=>j.num===n);
   return `<tr><td>${n} ${p}</td>`+RK.map(k=>{const c=l.filter(j=>j.rar===k).length;return `<td${k==='commun'&&!c?' style="color:#ff8a7e;font-weight:700"':''}>${c}</td>`}).join('')+`<td>${l.length}</td></tr>`}).join('')+'</table></div>'}
/* photo du joueur, ou silhouette avec initiales si l'image est absente */
function ph(p){const ini=String(p.nom||'?').split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase(),col=(RARETES[p.rar]||{c:'#9aa5a1'}).c;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#2a4a44"/><circle cx="100" cy="78" r="36" fill="${col}" opacity=".55"/><ellipse cx="100" cy="190" rx="68" ry="58" fill="${col}" opacity=".55"/><text x="100" y="118" font-family="Georgia,serif" font-size="46" font-weight="700" fill="#fff" text-anchor="middle">${ini.replace(/[<&]/g,'')}</text></svg>`;
  return 'data:image/svg+xml,'+encodeURIComponent(svg).replace(/'/g,'%27')}
/* adresse de base du projet Supabase : tolère un « / » final ou un « /rest/v1 » collé par erreur */
const baseSupabase=()=>{const S=typeof SUPABASE!=='undefined'?SUPABASE:null;return S&&S.url?String(S.url).trim().replace(/\/+$/,'').replace(/\/rest\/v1$/,'').replace(/\/+$/,''):''};
const photoDef=p=>baseSupabase()?baseSupabase()+'/storage/v1/object/public/photos/'+encodeURIComponent(p.id)+'.jpg':ph(p);
const avatar=(p,cls)=>`<img class="${cls}" src="${escH(p.photo||photoDef(p))}" alt="${escH(p.nom)}" title="${escH(p.nom)}" onerror="this.onerror=null;this.src='${ph(p)}'">`;
/* chargement au démarrage : Supabase si configuré, sinon joueurs.csv, sinon base générée automatiquement */
let SOURCE_BASE='génération automatique',ERREURS_BASE=[],ERREUR_SUPABASE='';
async function depuisSupabase(){const U=baseSupabase(),K=(typeof SUPABASE!=='undefined'&&SUPABASE.key?String(SUPABASE.key).trim():'');if(!U||!K)return null;
  const h={apikey:K};if(!K.startsWith('sb_'))h.Authorization='Bearer '+K;let tout=[];
  for(let off=0;;off+=1000){const r=await fetch(`${U}/rest/v1/joueurs?select=*&order=id&limit=1000&offset=${off}`,{headers:h});
    if(!r.ok){let d='';try{d=(await r.text()).slice(0,300)}catch(e){}throw new Error('HTTP '+r.status+(d?' — '+d:''))}const p=await r.json();tout=tout.concat(p);if(p.length<1000)break}
  return validerLignes(tout,1)}
async function depuisCSV(){const r=await fetch('joueurs.csv',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);return lireJoueurs(decoder(await r.arrayBuffer()))}
const complet=res=>res&&POSTES.every(p=>res.joueurs.some(j=>j.num===p[0]));
const PRET=(async()=>{let res=null,src='';
  try{res=await depuisSupabase();src='Supabase';if(!res)ERREUR_SUPABASE='Le fichier supabase-config.js est vide ou introuvable : adresse ou clé manquante.'}catch(e){ERREUR_SUPABASE=String(e.message||e);console.warn('Supabase indisponible :',ERREUR_SUPABASE);res=null}
  if(!complet(res)){if(res){ERREUR_SUPABASE='La table « joueurs » a été lue mais ne contient pas au moins un joueur valide par poste ('+res.joueurs.length+' valide(s), '+res.erreurs.length+' problème(s)).'+(res.joueurs.length+res.erreurs.length===0?' Elle est vide, ou la règle de lecture publique manque.':' Premier problème : '+(res.erreurs[0]||''));console.warn('Supabase :',ERREUR_SUPABASE)}res=null;
    try{res=await depuisCSV();src='joueurs.csv'}catch(e){console.info('joueurs.csv non chargé ('+(e.message||e)+')');res=null}}
  if(res){ERREURS_BASE=res.erreurs;if(res.erreurs.length)console.warn(src+' : '+res.erreurs.length+' problème(s)',res.erreurs.slice(0,10));
    if(complet(res)){POOL.splice(0,POOL.length,...res.joueurs);SOURCE_BASE=src}else console.warn(src+' ignoré : il faut au moins un joueur valide par poste.')}})();
