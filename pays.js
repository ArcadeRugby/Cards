/* ====== PAYS : noms français, alias anglais, code du drapeau ====== */
const LISTE_PAYS=`fr|France|france
gb-eng|Angleterre|england|angleterre
gb-sct|Écosse|scotland|ecosse
gb-wls|Pays de Galles|wales|galles
gb-nir|Irlande du Nord|northern ireland
ie|Irlande|ireland|eire
it|Italie|italy
nz|Nouvelle-Zélande|new zealand
za|Afrique du Sud|south africa
au|Australie|australia
ar|Argentine|argentina
fj|Fidji|fiji
ws|Samoa|samoa|samoa occidental|western samoa
to|Tonga
ge|Géorgie|georgia
jp|Japon|japan
es|Espagne|spain
ro|Roumanie|romania
na|Namibie|namibia
pt|Portugal
zw|Zimbabwe
cd|RD Congo|d.r. of the congo|dr congo|democratic republic of the congo|rd congo|republique democratique du congo
cg|Congo|congo|republic of the congo
gb|Royaume-Uni|united kingdom|grande-bretagne|great britain|uk
nl|Pays-Bas|netherlands|holland
de|Allemagne|germany
us|États-Unis|united states|etats-unis|usa|united states of america|u.s.a.
be|Belgique|belgium
ca|Canada
uy|Uruguay
cl|Chili|chile
br|Brésil|brazil
ru|Russie|russia
ci|Côte d'Ivoire|ivory coast|cote d'ivoire
mg|Madagascar
sn|Sénégal|senegal
ma|Maroc|morocco
tn|Tunisie|tunisia
dz|Algérie|algeria
cm|Cameroun|cameroon
ga|Gabon
ml|Mali
bf|Burkina Faso
tg|Togo
bj|Bénin|benin
gn|Guinée|guinea
mu|Maurice|mauritius
ke|Kenya
gh|Ghana
ng|Nigéria|nigeria
ug|Ouganda|uganda
zm|Zambie|zambia
bw|Botswana
eg|Égypte|egypt
pg|Papouasie-Nouvelle-Guinée|papua new guinea
ck|Îles Cook|cook islands
nu|Niue
vu|Vanuatu
sb|Îles Salomon|solomon islands
as|Samoa américaines|american samoa
pf|Polynésie française|french polynesia
nc|Nouvelle-Calédonie|new caledonia
wf|Wallis-et-Futuna|wallis and futuna|wallis et futuna
pl|Pologne|poland
ch|Suisse|switzerland
cz|Tchéquie|czech republic|republique tcheque
hu|Hongrie|hungary
gr|Grèce|greece
se|Suède|sweden
no|Norvège|norway
dk|Danemark|denmark
fi|Finlande|finland
at|Autriche|austria
rs|Serbie|serbia
hr|Croatie|croatia
si|Slovénie|slovenia
bg|Bulgarie|bulgaria
lv|Lettonie|latvia
lt|Lituanie|lithuania
lu|Luxembourg
mt|Malte|malta
md|Moldavie|moldova
ua|Ukraine
mx|Mexique|mexico
co|Colombie|colombia
pe|Pérou|peru
ve|Venezuela
py|Paraguay
jm|Jamaïque|jamaica
tt|Trinité-et-Tobago|trinidad and tobago
bb|Barbade|barbados
bm|Bermudes|bermuda
hk|Hong Kong
cn|Chine|china
kr|Corée du Sud|south korea
ph|Philippines
my|Malaisie|malaysia
sg|Singapour|singapore
in|Inde|india
il|Israël|israel
kz|Kazakhstan
uz|Ouzbékistan|uzbekistan
cu|Cuba
ht|Haïti|haiti
pa|Panama
ec|Équateur|ecuador
bo|Bolivie|bolivia
do|République dominicaine|dominican republic
cr|Costa Rica
mc|Monaco
ad|Andorre|andorra
im|Île de Man|isle of man
ky|Îles Caïmans|cayman islands
bs|Bahamas
gy|Guyana
tr|Turquie|turkey
lb|Liban|lebanon
sk|Slovaquie|slovakia
al|Albanie|albania
cy|Chypre|cyprus
is|Islande|iceland
ee|Estonie|estonia
by|Biélorussie|belarus
am|Arménie|armenia
az|Azerbaïdjan|azerbaijan`.split('\n').map(l=>l.split('|'));
const _np=s=>String(s==null?'':s).replace(/[’‘]/g,"'").normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const _PAYS={};LISTE_PAYS.forEach(([code,nom,...al])=>{const e={code,nom};_PAYS[_np(nom)]=e;al.forEach(a=>_PAYS[_np(a)]=e)});
/* analyse une nationalité saisie en français ou en anglais, éventuellement multiple (« England; Scotland ») */
function pays(txt){const s=String(txt==null?'':txt).trim();if(!s||/^(n\/?d|nd|-|\?|inconnu|inconnue)$/i.test(s))return{nom:'',code:'',vide:true,reconnu:false,multiple:false};
  const parts=s.split(/\s*(?:;|,|\/|\bet\b|\band\b)\s*/i).filter(Boolean),e=_PAYS[_np(parts[0])];
  return e?{nom:e.nom,code:e.code,reconnu:true,multiple:parts.length>1,tous:parts}:{nom:parts[0]||s,code:'',reconnu:false,multiple:parts.length>1,tous:parts}}
