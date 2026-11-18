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
/* transforme le texte CSV en joueurs valides + liste d'erreurs lisibles */
function lireJoueurs(txt){
  const rows=parseCSV(txt),erreurs=[],joueurs=[];if(!rows.length)return{joueurs,erreurs:['Fichier vide.']};
  const head=rows[0].map(norm),idx=k=>head.indexOf(k),manq=COLS.filter(k=>k!=='photo'&&idx(k)<0);
  if(manq.length)return{joueurs,erreurs:['Colonnes manquantes : '+manq.join(', ')+'. Première ligne attendue : '+COLS.join(';')]};
  const ids=new Set(),rmap={},smap={};Object.keys(RARETES).forEach(k=>{rmap[norm(k)]=k;rmap[norm(RARETES[k].n)]=k});Object.keys(SPEC).forEach(k=>smap[norm(k)]=k);
  rows.slice(1).forEach((r,n)=>{const L=n+2,g=k=>idx(k)<0?'':(r[idx(k)]||'').trim(),err=m=>{erreurs.push(`Ligne ${L} : ${m}`);ok=false};let ok=true;
    const id=g('id'),nom=g('nom'),num=parseInt(g('poste'),10),rar=rmap[norm(g('rarete'))],po=POSTES.find(p=>p[0]===num);
    if(!id)err('identifiant vide');else if(ids.has(id))err('identifiant en double ('+id+')');
    if(!nom)err('nom vide');if(!po)err('poste invalide « '+g('poste')+' » (1 à 15)');if(!rar)err('rareté inconnue « '+g('rarete')+' »');
    const st={};CLES.forEach(k=>{const v=parseInt(g(k),10);if(!(v>=1&&v<=10))err(`stat « ${k} » invalide « ${g(k)} » (1 à 10)`);st[k]=v});
    const sp=smap[norm(g('specialite'))];if(g('specialite')&&!sp)err('spécialité inconnue « '+g('specialite')+' »');
    if(!ok)return;ids.add(id);
    joueurs.push({id,nom,num,poste:po[1],st,sp:sp||po[3],rar,age:parseInt(g('age'),10)||null,poids:parseInt(g('poids'),10)||null,taille:parseInt(g('taille'),10)||null,nat:g('nationalite'),photo:g('photo')})});
  return{joueurs,erreurs}}
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
const avatar=(p,cls)=>`<img class="${cls}" src="${escH(p.photo||ph(p))}" alt="${escH(p.nom)}" title="${escH(p.nom)}" onerror="this.onerror=null;this.src='${ph(p)}'">`;
/* chargement au démarrage : joueurs.csv à côté de index.html, sinon base générée automatiquement */
let SOURCE_BASE='génération automatique',ERREURS_BASE=[];
const PRET=(async()=>{try{const r=await fetch('joueurs.csv',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
  const {joueurs,erreurs}=lireJoueurs(decoder(await r.arrayBuffer()));ERREURS_BASE=erreurs;if(erreurs.length)console.warn('joueurs.csv : '+erreurs.length+' problème(s)',erreurs.slice(0,10));
  if(POSTES.every(p=>joueurs.some(j=>j.num===p[0]))){POOL.splice(0,POOL.length,...joueurs);SOURCE_BASE='joueurs.csv'}else console.warn('joueurs.csv ignoré : il faut au moins un joueur valide par poste.')}
 catch(e){console.info('joueurs.csv non chargé, base générée automatiquement ('+(e.message||e)+')')}})();
