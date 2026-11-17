/* ====== OUTILS ====== */
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick=w=>{let t=Object.values(w).reduce((a,b)=>a+b,0),r=Math.random()*t;for(const k in w)if((r-=w[k])<0)return k;return Object.keys(w)[0]};
const shuf=a=>a.map(x=>[Math.random(),x]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function team(){const p=shuf(PRE),n=shuf(NOM);return POSTES.map(([num,poste,st,sp],i)=>{const s={};for(const k in st)s[k]=cl(st[k]+R(-1,1),1,10);return{num,poste,st:s,sp,nom:p[i]+' '+n[i]}})}
const MON_EQUIPE=team();
/* ====== RÈGLE DE RÉSOLUTION ====== */
const has=(p,c)=>(SPEC[p.sp]||[]).includes(c);
const POST=Object.keys(MATRICE.pu);
function pAtt(A,D,a,po){const x=ATT[a];return cl(x.b+ECART*(A.st[x.s]-D.st[po])+MATRICE[x.s][po]+(dis()?HOLE_BONUS:0)-(S.press?PRESS_MALUS:0)+(has(A,a)?SPEC_BONUS:0)-(has(D,po)?8:0),5,95)}
/* ====== ÉTAT ====== */
let S;
function init(){S={eq:{me:(MODE==='carriere'&&XV)?XV:MON_EQUIPE,ai:team()},sc:{me:0,ai:0},ball:'me',pos:40,hole:false,n:0,busy:false,end:false,ci:8,di:0,ax:.5,late:false,reset:true};draw();dots.forEach(p=>{const t=slot(p);p.lx=p.x=p.tx=t.x;p.ly=p.y=p.ty=t.y});choose();log('Coup d\'envoi : tu as le ballon.');turn()}
const other=b=>b==='me'?'ai':'me';
const dis=()=>S.hole||S.late; // défense désorganisée : trou laissé par une action OU joueurs hors de position
function choose(passed){
  const bx=S.ax,by=S.ball==='me'?1-S.pos/100:S.pos/100;
  const near=(s,ok)=>{const w={};dots.filter(p=>p.s===s&&ok(p.i)).forEach(p=>{const q=S.reset?slot(p):{x:p.lx,y:p.ly};w[p.i]=1/Math.pow(Math.hypot(q.x-bx,q.y-by)+.08,2)});return +pick(w)};
  const old=S.ci;S.ci=near(S.ball,i=>passed?(i>=8&&i!==old):true);S.di=near(other(S.ball),()=>true)}
const C=()=>S.eq[S.ball][S.ci],D=()=>S.eq[other(S.ball)][S.di];
/* ====== AFFICHAGE ====== */
const $=id=>document.getElementById(id);
function card(p,side){return `<div class="card ${side}"><h2>${p.nom}</h2><small>n°${p.num} · ${p.poste}</small><div class="st">${Object.keys(STATS).map(k=>`<span>${STATS[k]}</span><div class="bar"><i style="width:${p.st[k]*10}%"></i></div>`).join('')}</div><div class="sp">Spécialité : ${p.sp}</div></div>`}
function log(t){$('log').textContent=t}
function turn(){
  retarget();
  const me=S.ball==='me',c=C(),d=D(),zp=ZONES.find(z=>S.pos<=z[0])[1];
  $('c1').innerHTML=card(c,S.ball);$('c2').innerHTML=card(d,other(S.ball));
  $('t-half').textContent=(S.n<PAR_MI_TEMPS?'1re':'2e')+' mi-temps · action '+(S.n%PAR_MI_TEMPS+1)+'/'+PAR_MI_TEMPS;
  $('t-zone').textContent=(me?'Tu attaques':'Tu défends')+' · '+zp+' · '+(100-S.pos)+' m de l\'en-but';
  $('t-state').textContent=dis()?'Défense désorganisée':'Défense organisée';$('t-state').className='tag'+(dis()?' warn':'');
  $('hint').textContent=me?'Tu as le ballon : choisis une action (le % est une moyenne selon la défense adverse).':'L\'adversaire a le ballon : choisis ta défense (le % est l\'efficacité moyenne selon son attaque).';
  if(!OPT.pct)$('hint').textContent=me?'Tu as le ballon : choisis une action.':'L\'adversaire a le ballon : choisis ta défense.';
  const a=$('acts');a.innerHTML='';
  if(me)Object.keys(ATT).forEach(k=>add(k,Math.round(POST.reduce((s,po)=>s+pAtt(c,d,k,po),0)/POST.length),LIB[k],has(c,k)));
  else POST.forEach(po=>add(po,100-Math.round(Object.keys(ATT).reduce((s,a)=>s+pAtt(c,d,a,po),0)/Object.keys(ATT).length),STATS[po],has(d,po)));
  function add(k,pct,lab,star){const b=document.createElement('button');b.innerHTML=`<span>${lab}${star?' ★':''}</span><b>${OPT.pct?pct+' %':''}</b>`;b.onclick=()=>play(k);a.appendChild(b)}
}
/* ====== TOUR DE JEU ====== */
function play(choice){
  if(S.busy||S.end)return;S.busy=true;document.querySelectorAll('#acts button').forEach(b=>b.disabled=true);
  const me=S.ball==='me',c=C(),d=D();
  const a=me?choice:aiAtt(),po=me?aiDef():choice,X=ATT[a];
  const prev={s:S.ball,i:S.ci},pd=S.ball==='me'?-1:1,cx=slot(prev).x;
  const ok=R(1,100)<=pAtt(c,d,a,po);
  let msg=`${c.nom} : ${LIB[a]} — la défense choisit « ${STATS[po]} ». `,flip=false,pass=false;
  let nx=cx;if(X.kick)nx=R(15,85)/100;else if(ok)nx=cx+(a==='Percussion'?R(-4,4):(Math.random()<.5?-1:1)*R(10,20))/100;S.ax=cl(nx,.06,.94);
  S.press=false;
  if(X.kick){const gain=ok?R(...X.g):R(5,10);S.pos=Math.min(S.pos+gain,97);msg+=ok?`Réussi : ${gain} m gagnés au pied.`:`Coup de pied court (${gain} m).`;flip=true;if(ok&&X.press){S.press=true;msg+=' Pression sur le receveur !'}}
  else if(ok){const gain=R(...X.g);S.pos+=gain;msg+=`Réussi : +${gain} m.`;S.hole=(po==='co'||po==='an');if(S.hole)msg+=' La défense est désorganisée !';if(a==='Conservation')S.hole=false;pass=a==='Passe'}
  else{S.hole=false;
    if(a==='Passe'){flip=true;msg+=(po==='an'&&R(1,100)<=INT_BASE+INT_K*d.st.an+(has(d,'an')?15:0))?'Interception !':'En-avant, ballon perdu.'}
    else{const g=R(0,2);S.pos+=g;msg+=`Plaqué (+${g} m).`;
      if(po==='co'&&R(1,100)<=REC_BASE+REC_K*d.st.co+(has(d,'co')?15:0)){flip=true;msg+=' Ballon récupéré au sol, turnover !'}}}
  const tryNow=!flip&&S.pos>=100,ey=tryNow?(pd<0?.02:.98):(S.ball==='me'?1-S.pos/100:S.pos/100);moveBall(prev,a,S.ax,ey);
  if(tryNow){S.ax=.5;S.reset=true;const kp=R(1,100)<=40+5*c.st.pi;S.sc[S.ball]+=5+(kp?2:0);msg=`${c.nom} : ESSAI ! ${kp?'Transformé (+7).':'Transformation ratée (+5).'}`;S.ball=other(S.ball);S.pos=50;S.hole=false;pass=false;choose()}
  else if(flip){S.ball=other(S.ball);S.pos=100-S.pos;S.hole=false;choose()}
  else choose(pass);
  S.n++;$('sm').textContent=S.sc.me;$('sa').textContent=S.sc.ai;log(msg);
  if(S.n===PAR_MI_TEMPS){S.ball=other(S.ball);S.pos=50;S.hole=false;S.ax=.5;S.reset=true;choose();log(msg+' — MI-TEMPS : coup d\'envoi pour l\'autre équipe.')}
  if(S.n>=2*PAR_MI_TEMPS){S.end=true;const r=S.sc.me>S.sc.ai?'Victoire !':S.sc.me<S.sc.ai?'Défaite.':'Match nul.';log(msg+' — FIN DU MATCH : '+r+(MODE==='carriere'?finMatch(S.sc.me>S.sc.ai?'victoire':S.sc.me<S.sc.ai?'defaite':'nul'):''));const b=document.createElement('button');b.textContent=MODE==='carriere'?'Retour à la carrière':'Rejouer';b.onclick=MODE==='carriere'?()=>go('car'):init;$('acts').innerHTML='';$('acts').appendChild(b);return}
  const gm=S;setTimeout(()=>{if(S!==gm)return;S.busy=false;turn()},1300);
}
function aiAtt(){const w={Percussion:30,Duel:15,Passe:25,Conservation:10,PiedTactique:10,PiedPression:10};if(S.pos<25){w.PiedTactique+=30;w.PiedPression+=15}if(S.pos>75){w.Percussion+=25;w.PiedTactique=0;w.PiedPression=0}return pick(w)}
function aiDef(){return pick({pl:40,mo:25,an:20,co:15})}
/* ====== TERRAIN (points sur un carré vert) ====== */
const cv=$('cv'),g=cv.getContext('2d');let dots=[],ball={x:.5,y:.5,tx:.5,ty:.5},ring={c:null,d:null};
function draw(){dots=[];for(const s of['me','ai'])for(let i=0;i<15;i++)dots.push({s,i,x:.5,y:.5,tx:.5,ty:.5,lx:.5,ly:.5,pl:true})}
/* place « naturelle » de chaque joueur autour du point de jeu (ax = côté du terrain, S.pos = avancée) */
function slot(p){
  const att=p.s===S.ball,dA=S.ball==='me'?-1:1,bY=S.ball==='me'?1-S.pos/100:S.pos/100,ax=S.ax,side=ax<.5?1:-1,i=p.i;let x,o;
  if(i<8){x=ax+((i%4)-1.5)*(att?.07:.08);o=att?-(.02+(i>>2)*.03):.035+(i>>2)*.03}
  else if(att){const T=[[.04,.025],[.14,.07],[0,.11],[.26,.10],[.38,.13],[0,.11],[0,.25]][i-8];
    x=i===10?.07:i===13?.93:i===14?.5:ax+T[0]*side;o=-T[1]}
  else{x=.1+(i-8)/6*.8;o=.07+(i===14?.14:0)}
  return{x:cl(x,.04,.96),y:cl(bY+dA*o,.02,.98)}}
/* début de tour : l'équipe se replace, et le ballon va vers le porteur */
function retarget(){
  const dA=S.ball==='me'?-1:1,cs=slot({s:S.ball,i:S.ci});
  dots.forEach(p=>{const t=slot(p);if(p.s!==S.ball&&p.i===S.di){t.x=cs.x;t.y=cs.y+dA*.04}
    let dx=t.x-p.lx,dy=t.y-p.ly;const d=Math.hypot(dx,dy);
    if(!S.reset&&d>DEPLACEMENT_MAX){dx*=DEPLACEMENT_MAX/d;dy*=DEPLACEMENT_MAX/d}
    p.lx+=dx;p.ly+=dy;p.tx=p.lx;p.ty=p.ly;p.pl=S.reset||d-DEPLACEMENT_MAX<SEUIL_PLACE});
  S.late=dots.filter(p=>p.s!==S.ball&&p.pl).length<MIN_EN_PLACE;S.reset=false;
  const cd=dots.find(p=>p.s===S.ball&&p.i===S.ci);ball.tx=cd.lx;ball.ty=cd.ly;
  ring={c:{s:S.ball,i:S.ci},d:{s:other(S.ball),i:S.di}}}
/* fin d'action : le ballon (et le porteur s'il court) se déplacent vers le nouvel endroit */
function moveBall(prev,a,x,y){
  const d=dots.find(p=>p.s===prev.s&&p.i===prev.i);
  if(d&&(a==='Percussion'||a==='Duel')){d.tx=d.lx=x;d.ty=d.ly=y}
  ball.tx=x;ball.ty=y}
function frame(){
  if(!S){requestAnimationFrame(frame);return}
  const W=cv.width,H=cv.height;g.fillStyle='#3d8c4b';g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=2;
  [.05,.22,.5,.78,.95].forEach(y=>{g.beginPath();g.moveTo(0,y*H);g.lineTo(W,y*H);g.stroke()});
  dots.forEach(p=>{p.x+=(p.tx-p.x)*.1;p.y+=(p.ty-p.y)*.1;
    g.beginPath();g.arc(p.x*W,p.y*H,7,0,7);g.fillStyle=p.s==='me'?COULEUR_ME:'#d9473b';g.fill();
    const car=ring.c&&p.s===ring.c.s&&p.i===ring.c.i,def=ring.d&&p.s===ring.d.s&&p.i===ring.d.i;
    if(car||def){g.lineWidth=3;g.strokeStyle=car?'#fff':'#ffd166';g.beginPath();g.arc(p.x*W,p.y*H,11,0,7);g.stroke()}});
  ball.x+=(ball.tx-ball.x)*.12;ball.y+=(ball.ty-ball.y)*.12;
  g.beginPath();g.ellipse(ball.x*W,ball.y*H,6,4,.5,0,7);g.fillStyle='#fff3c4';g.fill();g.lineWidth=1.5;g.strokeStyle='#5a3b1a';g.stroke();
  requestAnimationFrame(frame)}
/* ====== NAVIGATION : accueil, menu, équipe, options ====== */
const go=n=>{document.querySelectorAll('.screen').forEach(e=>e.classList.toggle('on',e.id==='s-'+n));if(n==='team')roster();if(n==='car')hub();if(n==='xv')xvPage();window.scrollTo(0,0)};
function roster(){$('roster').innerHTML='<table><thead><tr><th>N°</th><th>Nom</th><th>Poste</th>'+Object.values(STATS).map(x=>`<th>${x}</th>`).join('')+'<th>Spécialité</th></tr></thead><tbody>'+
 (CAR?collection():MON_EQUIPE).map(p=>`<tr><td>${p.num}</td><td>${p.nom}</td><td>${p.poste}</td>${Object.keys(STATS).map(k=>`<td>${p.st[k]}</td>`).join('')}<td>${p.sp}</td></tr>`).join('')+'</tbody></table>'}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
$('b-match').onclick=()=>{MODE='direct';COULEUR_ME='#2f6fe4';go('match');init()};
$('b-quit').onclick=()=>{if(S&&!S.end&&!confirm('Quitter le match en cours ?'))return;if(S)S.end=true;go(MODE==='carriere'?'car':'menu')};
$('o-dur').onchange=e=>{PAR_MI_TEMPS=+e.target.value};
$('o-pct').onchange=e=>{OPT.pct=e.target.checked};
frame();
