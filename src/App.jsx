import React,{useState,useEffect,useRef,useMemo} from "react";
// Haptics helper
function haptic(type){
  try{
    if(window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Haptics){
      var H=window.Capacitor.Plugins.Haptics;
      if(type==="success")H.notification({type:"SUCCESS"});
      else if(type==="error")H.notification({type:"ERROR"});
      else if(type==="light")H.impact({style:"LIGHT"});
      else if(type==="medium")H.impact({style:"MEDIUM"});
    } else if(navigator.vibrate){
      if(type==="error")navigator.vibrate([10,50,10]);
      else navigator.vibrate(10);
    }
  }catch(e){}
}
if(!window.storage){window.storage={get:function(k){return Promise.resolve(localStorage.getItem(k)?{key:k,value:localStorage.getItem(k)}:null);},set:function(k,v){try{localStorage.setItem(k,v);return Promise.resolve({key:k,value:v});}catch(e){return Promise.resolve(null);}},delete:function(k){localStorage.removeItem(k);return Promise.resolve({key:k,deleted:true});},list:function(prefix){var keys=Object.keys(localStorage).filter(function(k){return !prefix||k.startsWith(prefix);});return Promise.resolve({keys:keys});}};}
const STYLE=document.createElement("style");STYLE.textContent=":root{--sat:env(safe-area-inset-top,44px);}@font-face{font-family:'Nunito';font-style:normal;font-weight:400 900;font-display:swap;src:url('fonts/Nunito.woff2') format('woff2');}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}body{margin:0;background:#F6F6F6;font-family:Nunito,-apple-system,BlinkMacSystemFont,'SF Pro Rounded',sans-serif;}input,textarea{font-size:16px!important;}@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1;}100%{transform:translateY(100vh) rotate(720deg);opacity:0;}}@keyframes popIn{0%{transform:scale(0.5);opacity:0;}70%{transform:scale(1.1);}100%{transform:scale(1);opacity:1;}}@keyframes slideUp{0%{transform:translateY(12px);opacity:0;}100%{transform:translateY(0);opacity:1;}}@keyframes fadeIn{0%{opacity:0;transform:translateY(6px);}100%{opacity:1;transform:translateY(0);}}button:active{transform:scale(0.97)!important;opacity:0.9!important;}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}";var VP=document.querySelector('meta[name=viewport]');if(VP)VP.content="width=device-width,initial-scale=1,viewport-fit=cover";else{var VM=document.createElement("meta");VM.name="viewport";VM.content="width=device-width,initial-scale=1,viewport-fit=cover";document.head.appendChild(VM);};document.head.appendChild(STYLE);
const VERSION="1.0.0";
const CORRECT_MSGS=["Correct!","Nice one!","Well done!","Nailed it!","Excellent!","Perfect!","Spot on!","Great!"];

const CL={A1:{title:"Beginner",color:"#F97316",bg:"#FFF4F0",dark:"#C2510E",icon:"A1",tagline:"Say hello, count to ten, introduce yourself.",canDo:["Greet people and say goodbye","Introduce yourself by name","Count from 1 to 100","Name foods, colors, and family members","Use basic time words"],tip:"Start with greetings - you will use them every single day.",studyHours:"0-125 hrs"},A2:{title:"Elementary",color:"#0891B2",bg:"#EAF8FC",dark:"#0077A0",icon:"A2",tagline:"Shop, travel, describe your daily life.",canDo:["Describe your daily routine","Shop and order food confidently","Talk about the past and future","Express how you feel","Give and follow directions"],tip:"Learn the days of the week and you can talk about almost anything.",studyHours:"125-300 hrs"},B1:{title:"Intermediate",color:"#9B5DE5",bg:"#F3EEFB",dark:"#6B3DAF",icon:"B1",tagline:"Express opinions, discuss culture and society.",canDo:["Express opinions clearly","Discuss Basque culture and traditions","Talk about work and study","Describe complex emotions","Follow conversations on familiar topics"],tip:"Try watching Basque TV with subtitles - you will be surprised how much you catch.",studyHours:"300-500 hrs"},B2:{title:"Upper-Intermediate",color:"#F72585",bg:"#FEEAF3",dark:"#B01060",icon:"B2",tagline:"Discuss politics, society, identity, and current affairs.",canDo:["Discuss politics and society fluently","Argue a position with nuance","Understand authentic Basque media","Talk about abstract concepts","Engage in real debate"],tip:"Read Basque newspapers online - EITB and Berria are great resources.",studyHours:"500-800 hrs"}};
const TOPICS=[{key:"all",label:"All Topics"},{key:"greetings",label:"Greetings"},{key:"food",label:"Food & Drink"},{key:"numbers",label:"Numbers"},{key:"family",label:"Family"},{key:"colors",label:"Colors"},{key:"nature",label:"Nature"},{key:"body",label:"Body"},{key:"time",label:"Time"},{key:"travel",label:"Travel"},{key:"emotions",label:"Emotions"},{key:"work",label:"Work & Study"},{key:"culture",label:"Culture"},{key:"society",label:"Society"},{key:"adjectives",label:"Adjectives"}];
const TL=(function(){var o={};TOPICS.forEach(function(t){o[t.key]=t.label;});return o;})();
const FREE=["A1"];
var TOPIC_COLORS={"greetings":"#19A85A","food":"#E8513A","numbers":"#0891B2","family":"#C026D3","colors":"#7C3AED","nature":"#15803D","body":"#DC2626","time":"#2563EB","travel":"#0369A1","emotions":"#DB2777","work":"#475569","culture":"#9D7437","society":"#1D4ED8","adjectives":"#7C3AED"};
const FREE_TOPICS=["greetings","food","numbers"];
const SRS_I=[1,3,7,21,60];
const SRS_L=["Struggling","Learning","Practising","Solid","Mastered"];
const SRS_C=["#FF8C94","#F59E0B","#F59E0B","#00B4D8","#19A85A"];
const VOCAB_URL="https://ikasiandgo.com/vocabulary.json";
const SEED_VOCAB=[
  {id:"kaixo",basque:"Kaixo",english:"Hello",cefr:"A1",topic:"greetings",pronunciation:"KAI-sho",notes:"Kaixo is universal - used with friends, strangers, shopkeepers, anyone. More casual than egun on. Often followed by Zer moduz? (How are you?)",example:{basque:"Kaixo! Zer moduz?",english:"Hello! How are you?"}},
  {id:"agur",basque:"Agur",english:"Goodbye",cefr:"A1",topic:"greetings",pronunciation:"AH-goor",notes:"Agur sounds like the French bonjour but means goodbye. Do not confuse with the French greeting!",example:{basque:"Agur lagun!",english:"Goodbye friend!"}},
  {id:"bai",basque:"Bai",english:"Yes",cefr:"A1",topic:"greetings",pronunciation:"BYE",notes:"Bai is one of the first words visitors learn. Unlike Spanish si, it sounds like English bye!",example:{basque:"Bai ondo dago.",english:"Yes that is fine."}},
  {id:"ez",basque:"Ez",english:"No",cefr:"A1",topic:"greetings",pronunciation:"EZ",notes:"Ez is also used as a prefix meaning not/un-: ezagutu=to know, ezezagun=unknown.",example:{basque:"Ez eskerrik asko.",english:"No thank you."}},
  {id:"eskerrik_asko",basque:"Eskerrik asko",english:"Thank you",cefr:"A1",topic:"greetings",pronunciation:"es-KER-ik AS-ko",notes:"Eskerrik asko = many thanks. Esker = thanks + -rik (partitive suffix) + asko = much/many. The partitive -rik expresses an indefinite quantity of thanks. A beautiful construction: indefinitely many thanks.",example:{basque:"Eskerrik asko!",english:"Thank you!"}},
  {id:"mesedez",basque:"Mesedez",english:"Please",cefr:"A1",topic:"greetings",pronunciation:"meh-SEH-dez",notes:"Mesedez comes from Spanish por favor. Common in both formal requests and everyday politeness.",example:{basque:"Mesedez ekarri ura.",english:"Please bring water."}},
  {id:"barkatu",basque:"Barkatu",english:"Sorry / Excuse me",cefr:"A1",topic:"greetings",pronunciation:"bar-KAH-too",notes:"Barkatu = sorry or excuse me. Used both for apologies (Barkatu, oker nengoen = Sorry, I was wrong) and to get attention (Barkatu, non dago...? = Excuse me, where is...?). From Spanish perdonar via barka.",example:{basque:"Barkatu non dago trena?",english:"Excuse me where is the train?"}},
  {id:"zer_moduz",basque:"Zer moduz?",english:"How are you?",cefr:"A1",topic:"greetings",pronunciation:"ZER MO-dooz",notes:"Zer moduz? = How are you? (literally how is the manner?). The standard everyday greeting after kaixo. Zer moduz zaude? is a slightly more emphatic form. Ondo = fine. Primeran = great. Txarto = badly.",example:{basque:"Kaixo! Zer moduz?",english:"Hello! How are you?"}},
  {id:"ondo",basque:"Ondo",english:"Fine / Well",cefr:"A1",topic:"greetings",pronunciation:"ON-do",notes:"Ondo = well or fine (adverb, not adjective). Ondo nago = I am well. Ondo egin = to do well. Ondo etorri = welcome (come well). Ongi = also means well (slightly more formal). Opposite: gaizki (badly).",example:{basque:"Ondo nago eskerrik asko.",english:"I am fine thank you."}},
  {id:"egun_on",basque:"Egun on",english:"Good morning",cefr:"A1",topic:"greetings",pronunciation:"EH-goon ON",notes:"Egun on literally means good day. Egun = day (same root as eguna). Used until around noon.",example:{basque:"Egun on!",english:"Good morning!"}},
  {id:"gabon",basque:"Gabon",english:"Good night",cefr:"A1",topic:"greetings",pronunciation:"gah-BON",notes:"Gabon = good night (said when parting for the evening or bed). Also the Basque word for Christmas! Eguberri is another word for Christmas. Do not confuse with Gau on (good evening, used as a greeting when arriving somewhere).",example:{basque:"Gabon lagun.",english:"Good night friend."}},
  {id:"gau_on",basque:"Gau on",english:"Good evening",cefr:"A1",topic:"greetings",pronunciation:"GAU ON",notes:"Gau on = good evening (used as a greeting when arriving somewhere in the evening). Different from Gabon which is said when parting at night. Gau ona = good night (wishing someone a good night's sleep).",example:{basque:"Gau on denoi.",english:"Good evening everyone."}},
  {id:"ogia",basque:"Ogia",english:"Bread",cefr:"A1",topic:"food",pronunciation:"OH-ghee-ah",notes:"Ogia = bread, the staple of Basque meals. Ogia eta gazta = bread and cheese is a classic combination. Ogitegi = bakery (bread-place).",example:{basque:"Ogia gozo dago.",english:"The bread is delicious."}},
  {id:"ura",basque:"Ura",english:"Water",cefr:"A1",topic:"food",pronunciation:"OO-rah",notes:"Ura is one of the shortest Basque words. Ur (water, no article) vs ura (the water).",example:{basque:"Ura edan nahi dut.",english:"I want to drink water."}},
  {id:"ardoa",basque:"Ardoa",english:"Wine",cefr:"A1",topic:"food",pronunciation:"ar-DOH-ah",notes:"Ardoa = wine, but the Basque Country is famous for Txakoli - a light sparkling white. Ardo beltza = red wine. Ardo zuria = white wine.",example:{basque:"Ardoa ona da.",english:"The wine is good."}},
  {id:"sagardoa",basque:"Sagardoa",english:"Cider",cefr:"A1",topic:"food",pronunciation:"sah-gar-DOH-ah",notes:"Sagardoa = cider (from sagar=apple + ardoa=wine). Basque cider houses (sagardotegi) are a winter tradition. Txotx! is the call to pour.",example:{basque:"Sagardoa edaten dugu.",english:"We drink cider."}},
  {id:"arraina",basque:"Arraina",english:"Fish",cefr:"A1",topic:"food",pronunciation:"ar-RAI-nah",notes:"Arraina = fish. Central to Basque cuisine. Bakailaoa (salted cod), merluzea (hake) and besugoa (sea bream) are the most prized. The Basque fishing fleet was legendary - reaching Newfoundland centuries ago.",example:{basque:"Arraina freskoa da.",english:"The fish is fresh."}},
  {id:"janaria",basque:"Janaria",english:"Food",cefr:"A1",topic:"food",pronunciation:"yah-NAH-ree-ah",notes:"Jan = to eat, janari = food, jatekoa = something to eat. All from the same root jan.",example:{basque:"Janaria goxoa da.",english:"The food is tasty."}},
  {id:"pintxoa",basque:"Pintxoa",english:"Pintxo (bar snack)",cefr:"A1",topic:"food",pronunciation:"PEEN-choh-ah",notes:"Pintxoa = pintxo (plural: pintxoak). A small snack served on bread, skewered with a toothpick (pintxo). Similar to tapas but distinct - Basque pintxos are often elaborate works of art. Donostia is the pintxo capital.",example:{basque:"Pintxoak jaten ditut.",english:"I eat pintxos."}},
  {id:"bazkaria",basque:"Bazkaria",english:"Lunch",cefr:"A1",topic:"food",pronunciation:"baz-KAH-ree-ah",notes:"Lunch is the main meal. Basque restaurants serve a menua (set lunch menu) - excellent value and quality.",example:{basque:"Bazkaria egiten dugu.",english:"We are making lunch."}},
  {id:"afaria",basque:"Afaria",english:"Dinner",cefr:"A1",topic:"food",pronunciation:"ah-FAH-ree-ah",notes:"Dinner in Basque culture is typically lighter than lunch. Afa comes from the verb afaldetu = to dine.",example:{basque:"Gauean afaria prestatuko dut etxean.",english:"I will prepare dinner at home tonight."}},
  {id:"tomatea",basque:"Tomatea",english:"Tomato",cefr:"A1",topic:"food",pronunciation:"toh-MAH-teh-ah",notes:"Tomatea in Basque cooking is everywhere - in pintxos, sauces, and the famous piperada (tomato and pepper stew). From Spanish tomate.",example:{basque:"Tomatea gorria da.",english:"The tomato is red."}},
  {id:"oilaskoa",basque:"Oilaskoa",english:"Chicken",cefr:"A1",topic:"food",pronunciation:"oy-LAS-koh-ah",notes:"Oilaskoa = chicken. Oilasko errean = roast chicken. Oilasko saltsan = chicken in sauce. Oilasko salda = chicken broth. Very common on menus.",example:{basque:"Oilaskoa errean dago.",english:"The chicken is roasting."}},
  {id:"gazta",basque:"Gazta",english:"Cheese",cefr:"A1",topic:"food",pronunciation:"GAZ-tah",notes:"Gazta = cheese. Gatz = salt, so gazta literally means salted thing! Idiazabal is the famous smoked sheep's milk cheese from the Basque Country - PDO protected. Gazta freskoa = fresh cheese. Gaztagintza = cheesemaking.",example:{basque:"Gazta ona da.",english:"The cheese is good."}},
  {id:"bat",basque:"Bat",english:"One",cefr:"A1",topic:"numbers",pronunciation:"BAT",notes:"Bat means one and also serves as the indefinite article. Etxe bat = a house. Bat, bi, hiru = one, two, three.",example:{basque:"Bat bi hiru.",english:"One two three."}},
  {id:"bi",basque:"Bi",english:"Two",cefr:"A1",topic:"numbers",pronunciation:"BEE",notes:"Bi also means both. Bietan = in both. Basque numbers are base-20: hogei=20, berrogei=40 (two twenties).",example:{basque:"Bi lagun daude.",english:"There are two friends."}},
  {id:"hiru",basque:"Hiru",english:"Three",cefr:"A1",topic:"numbers",pronunciation:"HEE-roo",notes:"Hiru sounds like the English word ear. Hiru belarri = three ears - odd but memorable!",example:{basque:"Hiru katu ditut.",english:"I have three cats."}},
  {id:"lau",basque:"Lau",english:"Four",cefr:"A1",topic:"numbers",pronunciation:"LAU",notes:"Lau sounds like the English word low. Four floors down = lau solairutan behera.",example:{basque:"Lau urteko umea.",english:"A four year old child."}},
  {id:"bost",basque:"Bost",english:"Five",cefr:"A1",topic:"numbers",pronunciation:"BOST",notes:"Bost is one of the most distinct Basque numbers - no relation to any other language.",example:{basque:"Bost minutu.",english:"Five minutes."}},
  {id:"sei",basque:"Sei",english:"Six",cefr:"A1",topic:"numbers",pronunciation:"SAY",notes:"Sei = six. Seina = six each. Seigarrena = sixth. Basque numbers: bat=1, bi=2, hiru=3, lau=4, bost=5, sei=6. Sei sounds like English \"say\" - helpful memory aid.",example:{basque:"Sei ordu.",english:"Six hours."}},
  {id:"zazpi",basque:"Zazpi",english:"Seven",cefr:"A1",topic:"numbers",pronunciation:"THATH-pee",notes:"Zazpi - the double z is pronounced like English th (voiced). Practice: THATH-pee.",example:{basque:"Zazpi egun.",english:"Seven days."}},
  {id:"zortzi",basque:"Zortzi",english:"Eight",cefr:"A1",topic:"numbers",pronunciation:"ZOR-tsee",notes:"Zortzi contains the suffix -tzi which appears in 18 (hamazortzi) too. Pattern: learn it once.",example:{basque:"Zortzi ordu lo egin.",english:"Sleep eight hours."}},
  {id:"bederatzi",basque:"Bederatzi",english:"Nine",cefr:"A1",topic:"numbers",pronunciation:"beh-deh-RAT-see",notes:"Bederatzi is the longest single-digit number in Basque. Break it: beder + atzi.",example:{basque:"Bederatzi euro.",english:"Nine euros."}},
  {id:"hamar",basque:"Hamar",english:"Ten",cefr:"A1",topic:"numbers",pronunciation:"hah-MAR",notes:"Hamar = 10. Basque counts in 20s: hogei=20, hogeita hamar=30 (twenty and ten).",example:{basque:"Hamar urte.",english:"Ten years."}},
  {id:"hogei",basque:"Hogei",english:"Twenty",cefr:"A1",topic:"numbers",pronunciation:"HOH-gay",notes:"Hogei = 20. The base of the Basque vigesimal counting system. All round numbers are multiples of hogei: berrogei=40, hirurogei=60, laurogei=80. Hogeiren bat = about twenty. Hogei urte = twenty years.",example:{basque:"Hogei lagun.",english:"Twenty people."}},
  {id:"ehun",basque:"Ehun",english:"One hundred",cefr:"A1",topic:"numbers",pronunciation:"EH-hoon",notes:"Ehun = 100. Ehun eta bat = 101. Bi ehun = 200. Note: Basque uses base-20 so 400 is hogei ehun (twenty hundreds).",example:{basque:"Ehun euro.",english:"One hundred euros."}},
  {id:"mila",basque:"Mila",english:"One thousand",cefr:"A1",topic:"numbers",pronunciation:"MEE-lah",notes:"Mila = one thousand. Mila esker = a thousand thanks. Mila bider = a thousand times. Milioika = millions (of). Mila is also used as an intensifier: mila aldiz = countless times. Bi mila = 2000.",example:{basque:"Mila esker.",english:"A thousand thanks."}},
  {id:"nola",basque:"Nola?",english:"How?",cefr:"A1",topic:"greetings",pronunciation:"NOH-lah",notes:"Nola? = How? One of the most essential question words. Nola duzu izena? = What is your name? (literally how do you have your name?) Nola joan? = How to go? Nola esaten da? = How do you say it?",example:{basque:"Nola duzu izena?",english:"What is your name?"}},
  {id:"zer",basque:"Zer?",english:"What?",cefr:"A1",topic:"greetings",pronunciation:"ZER",notes:"Zer? = What? The most common question word in Basque. Zer da hori? = What is that? Zer nahi duzu? = What do you want? Zer moduz? = How are you? (what is the manner?). Zer berri? = What's new?",example:{basque:"Zer nahi duzu?",english:"What do you want?"}},
  {id:"nor",basque:"Nor?",english:"Who?",cefr:"A1",topic:"greetings",pronunciation:"NOR",notes:"Nor? = Who? Nor zara zu? = Who are you? Nor da? = Who is it? Nork = by whom (ergative case). Nori = to whom. Basque has 4 cases for who!",example:{basque:"Nor da hori?",english:"Who is that?"}},
  {id:"zenbat",basque:"Zenbat?",english:"How many / How much?",cefr:"A1",topic:"numbers",pronunciation:"ZEN-bat",notes:"Zenbat? = How many? / How much? Zenbat da? = How much does it cost? Zenbat urte dituzu? = How old are you? Zenbat denbora? = How long? Zenbat eta gehiago... = The more...",example:{basque:"Zenbat da?",english:"How much is it?"}},
  {id:"hitz_egin",basque:"Hitz egin",english:"To talk / To have a conversation",cefr:"A1",topic:"greetings",pronunciation:"HEETZ EH-gheen",notes:"Hitz egin (to speak) vs mintzatu (to speak formally). Hitz literally means word - so hitz egin = to do words!",example:{basque:"Euskaraz hitz egiten duzu?",english:"Do you speak Basque?"}},
  {id:"garagardoa",basque:"Garagardoa",english:"Beer",cefr:"A1",topic:"food",pronunciation:"gah-rah-GAR-doh-ah",notes:"Beer. Garagar (barley) + ardoa (wine) = literally barley-wine. The Basque brewing tradition is ancient. Garagardo bat mesedez = one beer please. Very popular in pintxo bars alongside txakoli.",example:{basque:"Garagardo bat mesedez.",english:"One beer please."}},
  {id:"menua",basque:"Menua",english:"Menu",cefr:"A1",topic:"food",pronunciation:"MEH-noo-ah",notes:"The menu, but also refers to the set lunch menu (menua) which is excellent value in Basque restaurants.",example:{basque:"Menua ekar iezadazu.",english:"Bring me the menu."}},
  {id:"laguntza",basque:"Laguntza",english:"Help",cefr:"A1",topic:"greetings",pronunciation:"lah-GOON-tsah",notes:"Help or assistance. Laguntza! = Help! Laguntza behar dut = I need help.",example:{basque:"Laguntza behar dut.",english:"I need help."}},
  {id:"hamabi",basque:"Hamabi",english:"Twelve",cefr:"A1",topic:"numbers",pronunciation:"hah-MAH-bee",notes:"Hamar (10) + bi (2) = 12. Basque builds teen numbers as ten+number. Hamahiru=13, hamalau=14, hamabost=15.",example:{basque:"Hamabi hilabete urtean.",english:"Twelve months in a year."}},
  {id:"hamabost",basque:"Hamabost",english:"Fifteen",cefr:"A1",topic:"numbers",pronunciation:"hah-mah-BOST",notes:"Hamar (10) + bost (5) = 15. A key number - used in telling time (quarter past/to).",example:{basque:"Hamabost minutu.",english:"Fifteen minutes."}},
  {id:"pozten_nau",basque:"Pozten nau zu ezagutzeak",english:"Nice to meet you",cefr:"A1",topic:"greetings",pronunciation:"POZ-ten NAU soo eh-zah-GOO-tsee-ak",notes:"A full phrase: Pozten nau zu ezagutzeak = Knowing you pleases me = Nice to meet you. Poztu = to please. Nau = me (it pleases me). Zu = you. Ezagutzeak = knowing (verbal noun). This grammatically complex phrase is worth memorising whole as an essential social expression.",example:{basque:"Pozten nau zu ezagutzeak.",english:"Nice to meet you."},mcOnly:true},
  {id:"nongoa",basque:"Nongoa zara?",english:"Where are you from?",cefr:"A1",topic:"greetings",pronunciation:"NON-goh-ah ZAH-rah",notes:"Nongo = of where + -a (article) = where-from-person. Nongoa naiz = I am from...",example:{basque:"Nongoa zara zu?",english:"Where are you from?"}},
  {id:"zenbat_urte",basque:"Zenbat urte dituzu?",english:"How old are you?",cefr:"A1",topic:"greetings",pronunciation:"ZEN-bat OOR-teh dee-TOO-zoo",notes:"Literally how many years do you have? Basque uses have not be for age - Hogei urte ditut = I am twenty.",example:{basque:"Zenbat urte dituzu?",english:"How old are you?"},mcOnly:true},
  {id:"arrautza",basque:"Arrautza",english:"Egg",cefr:"A1",topic:"food",pronunciation:"ar-RAU-tsah",notes:"Egg. Arrautzak = eggs (plural). Arrautza frijitua = fried egg. Arrautza opila = omelette. Essential in Basque cooking.",example:{basque:"Arrautza bat nahi dut.",english:"I want an egg."}},
  {id:"esnea",basque:"Esnea",english:"Milk",cefr:"A1",topic:"food",pronunciation:"ES-neh-ah",notes:"Milk. Esne = milk (root). Esne-beltza = black coffee with a drop of milk. Esne-gaina = cream. Common in traditional Basque breakfasts.",example:{basque:"Esnea edan dut.",english:"I drank milk."}},
  {id:"kafea",basque:"Kafea",english:"Coffee",cefr:"A1",topic:"food",pronunciation:"KAH-feh-ah",notes:"Coffee. The Basque word for a coffee with milk is 'esne-kafea' or 'cortado'. Kafea hartu = to have a coffee.",example:{basque:"Kafea hartu nahi dut.",english:"I want to have a coffee."}},
  {id:"tea",basque:"Tea",english:"Tea",cefr:"A1",topic:"food",pronunciation:"TEH-ah",notes:"Tea. Also written tee. Less common than coffee in the Basque Country but widely available.",example:{basque:"Tea beroa da.",english:"The tea is hot."}},
  {id:"fruta",basque:"Fruta",english:"Fruit",cefr:"A1",topic:"food",pronunciation:"FROO-tah",notes:"Fruit. Frutak = fruits (plural). The Basque Country is known for its apples (sagarrak) used to make sagardoa (cider).",example:{basque:"Fruta freskoa da.",english:"The fruit is fresh."}},
  {id:"hamaika",basque:"Hamaika",english:"Eleven",cefr:"A1",topic:"numbers",pronunciation:"hah-MAI-kah",notes:"Hamar (10) + ika. Hamaika also means countless/many in colloquial Basque: hamaika aldiz = countless times!",example:{basque:"Hamaika ordu da.",english:"It is eleven o'clock."}},
  {id:"ez_dut_ulertzen",basque:"Ez dut ulertzen",english:"I don't understand",cefr:"A1",topic:"greetings",pronunciation:"EZ doot oo-LER-tzen",notes:"The single most useful phrase for a language learner. Mesedez errepikatu = please repeat. Poliki esaidazu = say it slowly.",example:{basque:"Ez dut ulertzen. Mesedez errepikatu.",english:"I don't understand. Please repeat."},mcOnly:true},
  {id:"ingelesez",basque:"Ingelesez hitz egiten duzu?",english:"Do you speak English?",cefr:"A1",topic:"greetings",pronunciation:"in-geh-LEH-sez HITS eh-GEE-ten DOO-zoo",notes:"Essential emergency phrase. Euskaraz hitz egiten duzu? = Do you speak Basque? The -z suffix means in that language.",example:{basque:"Ingelesez hitz egiten duzu?",english:"Do you speak English?"},mcOnly:true},
  {id:"barazkia",basque:"Barazkia",english:"Vegetable",cefr:"A1",topic:"food",pronunciation:"bah-RASK-ee-ah",notes:"Vegetable. Barazki = vegetable (root). Barazkiak = vegetables (plural). Barazki salda = vegetable broth. The Basque markets (merkatuak) are famous for fresh local vegetables, especially peppers and tomatoes.",example:{basque:"Barazkiak osasuntsuak dira.",english:"Vegetables are healthy."}},
  {id:"haragia",basque:"Haragia",english:"Meat",cefr:"A1",topic:"food",pronunciation:"hah-RAH-ghee-ah",notes:"Meat. Haragi = meat (root). Txuleta = steak (a Basque speciality). Txerri haragia = pork. Behi haragia = beef. Haragia erretzea = grilling meat. The txuleta at a sagardotegi is legendary.",example:{basque:"Haragia gustatzen zait.",english:"I like meat."}},
  {id:"olioa",basque:"Olioa",english:"Oil",cefr:"A1",topic:"food",pronunciation:"oh-LEE-oh-ah",notes:"Oil. Oliba olioa = olive oil - essential in Basque cooking. Olioa berotzea = to heat the oil. Olio = oil root. Used in pil-pil sauce, the famous Basque emulsified cod dish.",example:{basque:"Oliba olioa erabiltzen dut.",english:"I use olive oil."}},
  {id:"baratxuria",basque:"Baratxuria",english:"Garlic",cefr:"A1",topic:"food",pronunciation:"bah-ratch-OO-ree-ah",notes:"Garlic. Baratxuri = garlic (root). Indispensable in Basque cooking - in salsa verde, pil-pil, and almost every sauce. Baratxuri ale bat = one clove of garlic. Often fried in oil first to flavour a dish.",example:{basque:"Baratxuria gehitu dut saltsan.",english:"I have added garlic to the sauce."}},
  {id:"piperra",basque:"Piperra",english:"Pepper",cefr:"A1",topic:"food",pronunciation:"pee-PER-rah",notes:"Pepper. Piperrak = peppers (plural). Piper gorria = red pepper. Piper berdea = green pepper. The piperada (Basque pepper and tomato stew) is a classic dish. Gernikako piperrak = Gernika peppers, small green peppers unique to the Basque Country.",example:{basque:"Piperra gustuko dut.",english:"I like pepper."}},
  {id:"patata",basque:"Patata",english:"Potato",cefr:"A1",topic:"food",pronunciation:"pah-TAH-tah",notes:"Potato. The same word as Spanish patata. Patata tortilla = potato omelette, ubiquitous in Basque bars. Patata frijituak = fried potatoes. The Basque Country grows distinctive small potatoes in the interior valleys.",example:{basque:"Tortilla patatakin egiten da.",english:"The omelette is made with potato."}},
  {id:"arroza",basque:"Arroza",english:"Rice",cefr:"A1",topic:"food",pronunciation:"ah-ROH-sah",notes:"Rice. From Spanish arroz via Arabic ar-ruzz. Arrozarekin = with rice. Arroz con leche (arrozesnea) = rice pudding. Less central than in Spanish cuisine but used in Basque seafood dishes.",example:{basque:"Arrozarekin jan dut.",english:"I ate with rice."}},
  {id:"jan",basque:"Jan",english:"To eat",cefr:"A1",topic:"food",pronunciation:"YAN",notes:"To eat - one of the most essential verbs. Jan = eat (also used as noun: janaria = food). Zer jan duzu? = What did you eat? Jaten ari naiz = I am eating. Jan eta edan = eat and drink. The j is a y sound.",example:{basque:"Zer jan nahi duzu?",english:"What do you want to eat?"}},
  {id:"edan",basque:"Edan",english:"To drink",cefr:"A1",topic:"food",pronunciation:"EH-dan",notes:"To drink. Zer edan nahi duzu? = What do you want to drink? Edaten ari naiz = I am drinking. Jan eta edan = eat and drink. Edaria = drink (noun). Edateko ura = drinking water.",example:{basque:"Zer edan nahi duzu?",english:"What do you want to drink?"}},
  {id:"pixka_bat",basque:"Pixka bat",english:"A little / A bit",cefr:"A1",topic:"greetings",pronunciation:"PEESH-kah bat",notes:"A little or a bit. Pixka = small amount. Pixka bat gehiago = a little more. Euskara pixka bat badakit = I know a little Basque. The most useful phrase for a beginner - shows humility and willingness to try.",example:{basque:"Euskara pixka bat badakit.",english:"I know a little Basque."}},
  {id:"poliki",basque:"Poliki",english:"Slowly / Gently",cefr:"A1",topic:"greetings",pronunciation:"POH-lee-kee",notes:"Slowly or gently. Poliki hitz egin = speak slowly please. Poliki-poliki = very slowly/little by little. Also means nicely or gently. Poliki esaidazu = say it slowly to me. Essential for learners asking native speakers to slow down.",example:{basque:"Poliki hitz egin mesedez.",english:"Please speak slowly."}},
  {id:"berriz",basque:"Berriz",english:"Again / Once more",cefr:"A1",topic:"greetings",pronunciation:"BER-ees",notes:"Again or once more. Berriz esan = say again. Berriz etorri = come again. Berriz ere = once again/yet again. Berriro = again (variant). Essential for language learners who need things repeated.",example:{basque:"Berriz esan mesedez.",english:"Please say it again."}},
  {id:"badakit",basque:"Badakit",english:"I know",cefr:"A1",topic:"greetings",pronunciation:"bah-DAH-keet",notes:"I know. Ba- is an affirmative prefix + dakit (I know, from jakin). Ez dakit = I don't know. Badakizu? = Do you know? Bai, badakit = Yes, I know. The ba- prefix adds affirmation and is very characteristic of Basque.",example:{basque:"Badakit non dagoen.",english:"I know where it is."}},
  {id:"gatz",basque:"Gatza",english:"Salt",cefr:"A1",topic:"food",pronunciation:"GAT-sah",notes:"Gatza = salt. Gatz = salt (root). Gazia = salty. Gazta = cheese literally means salted thing! Gatzontzia = salt cellar. Salt was historically precious - Basque salt trade routes were important in medieval times.",example:{basque:"Gatza gehitu behar diozu.",english:"You need to add salt to it."}},
  {id:"azukrea",basque:"Azukrea",english:"Sugar",cefr:"A1",topic:"food",pronunciation:"ah-SOO-kreh-ah",notes:"Azukrea = sugar. From Arabic as-sukkar via Spanish azúcar. Azukre = sugar (root). Azukre gehiegi = too much sugar. Gozoa = sweet - a word often associated with azukrea.",example:{basque:"Kafean azukrea nahi duzu?",english:"Do you want sugar in your coffee?"}},
  {id:"begiratu",basque:"Begiratu",english:"To look / To watch",cefr:"A1",topic:"greetings",pronunciation:"beh-ghee-RAH-too",notes:"Begiratu = to look at or watch (intentional). Begiratzen dut = I am looking. Begiratu! = Look! Do not confuse with ikusi (to see - perception) vs begiratu (to look - deliberate act). Begirale = observer/watcher. Begi = eye (root).",example:{basque:"Begiratu ezazu.",english:"Look at it."}},
  {id:"gosaria",basque:"Gosaria",english:"Breakfast",cefr:"A1",topic:"food",pronunciation:"goh-SAH-ree-ah",notes:"Gosaria = breakfast. Goiz = morning + -ari (meal). Literally morning-meal. Gosaldu = to have breakfast. Gosaria egin = to make breakfast. The three meals: gosaria (breakfast), bazkaria (lunch), afaria (dinner).",example:{basque:"Gosaria jan dut.",english:"I have had breakfast."}},
  {id:"sagarra",basque:"Sagarra",english:"Apple",cefr:"A1",topic:"food",pronunciation:"sah-GAR-rah",notes:"Sagarra = apple. Sagar = apple (root). Sagardoa = cider (apple+wine). Sagarrondoa = apple tree. Apples are central to Basque culture - cider making is a centuries-old tradition. Sagarrondoak = apple orchards cover the Basque hillsides in autumn.",example:{basque:"Sagarra jan dut.",english:"I ate an apple."}},
  {id:"banana",basque:"Banana",english:"Banana",cefr:"A1",topic:"food",pronunciation:"bah-NAH-nah",notes:"Banana - same word as Spanish/English. Bananondoa = banana tree. Fruta tropikala = tropical fruit. Bananas are popular in Basque supermarkets and pintxo bars, often in dessert pintxos.",example:{basque:"Banana jan nahi dut.",english:"I want to eat a banana."}},
  {id:"tipula",basque:"Tipula",english:"Onion",cefr:"A1",topic:"food",pronunciation:"tee-POO-lah",notes:"Tipula = onion. From Latin/Spanish cebolla via tipula. Tipula betea = stuffed onion. Tipula-saltsa = onion sauce. Onions are fundamental in Basque cooking - the sofrito base of most dishes starts with tipula.",example:{basque:"Tipula txikitu behar dut.",english:"I need to chop the onion."}},
  {id:"azenarioa",basque:"Azenarioa",english:"Carrot",cefr:"A1",topic:"food",pronunciation:"ah-tseh-nah-REE-oh-ah",notes:"Azenarioa = carrot. From Spanish zanahoria via azenario. Azenarioak = carrots (plural). Common in Basque vegetable soups and stews. Azenario salda = carrot broth. Azenario tortilla = carrot omelette.",example:{basque:"Azenarioak osasuntsuak dira.",english:"Carrots are healthy."}},
  {id:"letxuga",basque:"Letxuga",english:"Lettuce",cefr:"A1",topic:"food",pronunciation:"leh-CHOO-gah",notes:"Letxuga = lettuce. From Spanish lechuga. Letxuga entsalada = lettuce salad. Basque cuisine uses fresh letxuga in salads. The Basque Country grows excellent letxuga in the Araba flatlands.",example:{basque:"Letxuga entsaladan dago.",english:"The lettuce is in the salad."}},
  {id:"txokolatea",basque:"Txokolatea",english:"Chocolate",cefr:"A1",topic:"food",pronunciation:"choh-koh-LAH-teh-ah",notes:"Txokolatea = chocolate. The Basque Country has a strong chocolate tradition - especially in Tolosa and Donostia (San Sebastián). Txokolate beltza = dark chocolate. Txokolatezko pastela = chocolate cake.",example:{basque:"Txokolatea gustatzen zait.",english:"I like chocolate."}}
];
const CEFR_ORDER=["A1","A2","B1","B2"];
var _VOCAB=SEED_VOCAB;
function getWC(){var o={};["A1","A2","B1","B2"].forEach(function(l){o[l]=_VOCAB.filter(function(w){return w.cefr===l;}).length;});return o;}
var _WC=getWC();
const ANT={gorria:"beltza",beltza:"gorria",handia:"txikia",txikia:"handia",zaharra:"berria",berria:"zaharra",ona:"txarra",txarra:"ona",argia:"iluna",iluna:"argia",beroa:"hotza",hotza:"beroa",garestia:"merkea",merkea:"garestia",erraza:"zaila",zaila:"erraza",ama:"aita",aita:"ama",amona:"aitona",aitona:"amona",semea:"alaba",alaba:"semea",anaia:"ahizpa",ahizpa:"anaia",senarra:"emaztea",emaztea:"senarra",mintzatu:"esan",esan:"mintzatu",belarria:"urtea",urtea:"belarria",ahoa:"hilabetea",hilabetea:"ahoa",ezkerra:"eskuina",eskuina:"ezkerra",irekia:"itxia",itxia:"irekia",beroa:"hotza",hotza:"beroa",burua:"eskua",eskua:"burua",iragana:"etorkizuna",etorkizuna:"iragana",ardoa:"esnea",esnea:"ardoa",kafea:"tea",tea:"kafea",gaua:"eguna",eguna:"gaua"};
function getPool(vocab,cefr,topic,cumul,isPro){var idx=CEFR_ORDER.indexOf(cefr);var lvls=cumul?CEFR_ORDER.slice(0,idx+1):[cefr];return vocab.filter(function(w){if(lvls.indexOf(w.cefr)===-1)return false;if(topic!=="all"&&w.topic!==topic)return false;if(!isPro&&w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)===-1)return false;if(!isPro&&w.cefr!=="A1")return false;return true;});}
function shuffled(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function spaced(base,n){if(!base.length)return[];var out=[],last={};while(out.length<n){var added=false;for(var i=0;i<base.length;i++){var w=base[i],li=last[w.id]!=null?last[w.id]:-99;if(out.length-li>=3||out.length<3){out.push(w);last[w.id]=out.length-1;added=true;if(out.length>=n)break;}}if(!added)break;}return out;}
function buildSession(vocab,cefr,topic,cumul,n,missedIds,srs,isPro){if(!n)n=20;if(!missedIds)missedIds=[];if(!srs)srs={};var pool=getPool(vocab,cefr,topic,cumul,isPro!==false);if(!pool.length)return[];var now=new Date();var f=function(fn){return shuffled(pool.filter(fn));};var missed=pool.filter(function(w){return missedIds.indexOf(w.id)!==-1;});var due=f(function(w){return missedIds.indexOf(w.id)===-1&&srs[w.id]&&new Date(srs[w.id].nextReview)<=new Date(now.getTime()+12*3600000)&&(srs[w.id].score||0)<4;});var unseen=f(function(w){return missedIds.indexOf(w.id)===-1&&!srs[w.id];});var learning=f(function(w){return missedIds.indexOf(w.id)===-1&&srs[w.id]&&new Date(srs[w.id].nextReview)>now&&(srs[w.id].score||0)<4;});var mastered=f(function(w){return missedIds.indexOf(w.id)===-1&&srs[w.id]&&(srs[w.id].score||0)>=4;});var active=due.concat(missed).concat(learning).concat(unseen);var base=active.length>=n?active:active.concat(mastered);var words=spaced(base,n);var sid=Math.random().toString(36).slice(2,8);var canFB=function(w){if(!w.example||!w.example.basque)return false;var ex=w.example.basque.toLowerCase(),root=w.basque.toLowerCase().replace(/[?!]$/,"").trim();var stems=[root];if(root.endsWith("tu")||root.endsWith("du")){var stem=root.slice(0,-2);stems.push(stem+"tzen",stem+"ten",stem+"dakit",stem+"t");}if(root.endsWith("i")&&root.length>=5){stems.push(root.slice(0,-1),root.slice(0,-1)+"tzen",root.slice(0,-1)+"ten");}if(root.length>=6&&root.endsWith("a"))stems.push(root.slice(0,-1));if(root.indexOf(" ")!==-1){var parts=root.split(" ");parts.forEach(function(p){if(p.length>=3)stems.push(p);});}return stems.some(function(s){return s.length>=3&&ex.indexOf(s)!==-1;});};var modes=shuffled(Array(Math.ceil(words.length/2)).fill("multipleChoice").concat(Array(Math.floor(words.length/2)).fill("typing"))).slice(0,words.length);return words.map(function(word,i){var mode=modes[i];if(word.mcOnly&&mode==="typing")mode="multipleChoice";if(!word.mcOnly&&mode==="typing"&&canFB(word)&&i%3===0)mode="fillBlank";var dp=vocab.filter(function(w2){return w2.id!==word.id&&w2.id!==ANT[word.id];});var sl=dp.filter(function(w2){return w2.cefr===word.cefr&&w2.topic===word.topic;});var slLevel=dp.filter(function(w2){return w2.cefr===word.cefr;});var dist=shuffled(sl.length>=3?sl:slLevel.length>=3?slLevel:dp).slice(0,3);if(mode==="fillBlank"){var wb=word.basque.replace(/[?!]$/,"");var escaped=wb.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");var blanked=word.example.basque.replace(new RegExp("\\b"+escaped+"\\w*","i"),"___").replace(new RegExp(escaped,"i"),"___").trim();if(blanked.indexOf("___")===-1){mode="multipleChoice";var opts2b=shuffled([word.english].concat(dist.map(function(w2){return w2.english;})));return{id:"q_"+sid+"_"+i,mode:mode,word:word,prompt:word.basque,promptLabel:"What does this mean?",options:opts2b,correct:word.english};}var opts=shuffled([word.basque].concat(dist.map(function(w2){return w2.basque;})));return{id:"q_"+sid+"_"+i,mode:mode,word:word,prompt:blanked,promptLabel:"Fill in the blank",options:opts,correct:word.basque};}if(mode==="multipleChoice"){var opts2=shuffled([word.english].concat(dist.map(function(w2){return w2.english;})));return{id:"q_"+sid+"_"+i,mode:mode,word:word,prompt:word.basque,promptLabel:"What does this mean?",options:opts2,correct:word.english};}return{id:"q_"+sid+"_"+i,mode:mode,word:word,prompt:word.english,promptLabel:"Translate to Basque",options:null,correct:word.basque};});}
function norm(s){
  s=s.trim().toLowerCase();
  var suffixes=["ak","an","ra","ko","ren","ri","rekin","tik","rako","ean"];
  for(var si=0;si<suffixes.length;si++){
    var suf=suffixes[si];
    if(s.length>suf.length+3&&s.endsWith(suf))return s.slice(0,-(suf.length));
  }
  if(s.length>=5&&s.endsWith("rra"))return s.slice(0,-3)+"r";
  if(s.length>=5&&s.endsWith("lla"))return s.slice(0,-3)+"l";
  if(s.length>=5&&s.endsWith("nna"))return s.slice(0,-3)+"n";
  if(s.length>=5&&s.endsWith("tta"))return s.slice(0,-3)+"t";
  if(s.length>=4&&s.endsWith("a"))return s.slice(0,-1);
  return s;
}
function normBasque(s){
  s=norm(s);
  s=s.replace(/ch/g,"tx").replace(/sh/g,"x").replace(/tz$/,"ts");
  s=s.replace(/ss/g,"s").replace(/ll/g,"l");
  return s;
}
function lev(a,b){var m=a.length,n=b.length,prev=[];for(var p=0;p<=n;p++)prev.push(p);for(var i=1;i<=m;i++){var cur=[i];for(var j=1;j<=n;j++){var c=a[i-1]===b[j-1]?0:1;cur.push(Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+c));}prev=cur;}return prev[n];}
function checkAnswer(q,raw){var ua=(raw||"").trim();if(q.mode!=="typing"){return{correct:ua===q.correct,wasClose:false,userAnswer:ua};}var n1=normBasque(ua),n2=normBasque(q.correct),exact=ua.toLowerCase()===q.correct.toLowerCase();var d=lev(n1,n2);var tol=n2.length<=4?1:n2.length<=7?2:2;return{correct:exact||n1===n2,wasClose:!exact&&n1!==n2&&d<=tol&&n1.length>=3,userAnswer:ua};}
function scoreSession(results){var total=results.length,correct=0,close=0,wrong=0;for(var i=0;i<results.length;i++){var r=results[i];if(r.correct)correct++;else if(r.wasClose)close++;else wrong++;}var acc=total>0?Math.round(correct/total*100):0;var grade=acc===100?{label:"Perfect!",sub:"Flawless!",emoji:"*"}:acc>=80?{label:"Excellent",sub:"Great work!",emoji:"*"}:acc>=60?{label:"Good",sub:"Keep going!",emoji:"!"}:{label:"Keep trying",sub:"Practice makes perfect",emoji:"~"};var mw=[],cw=[],mid={};for(var j=0;j<results.length;j++){var r2=results[j];if(!r2.correct&&r2.question&&r2.question.word){var w=r2.question.word;if(!r2.wasClose&&!mid[w.id]){mw.push(w);mid[w.id]=1;}else if(r2.wasClose&&!mid[w.id]){cw.push(w);mid[w.id]=1;}}}return{total:total,correct:correct,closeButWrong:close,genuinelyWrong:wrong,accuracy:acc,grade:grade,missedWords:mw,closeWords:cw};}
function Logo(props){var s=props.size||32;return(<svg width={s} height={s} viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#19A85A"/><circle cx="32" cy="16" r="6" fill="white"/><rect x="26" y="26" width="12" height="32" rx="4" fill="white"/><rect x="20" y="26" width="24" height="8" rx="4" fill="white"/></svg>);}
var CONFETTI_PIECES=(function(){
  var colors=["#19A85A","#FF6B35","#00B4D8","#F72585","#FFD700","#9B5DE5"];
  var pieces=[];
  for(var i=0;i<30;i++){
    var left=(i*3.4+Math.sin(i*1.7)*20+50)%100;
    var delay=(i*0.05)%1.5;
    var dur=1.5+(i%3)*0.5;
    var color=colors[i%colors.length];
    var size=6+(i%4)*2;
    var isCircle=(i%3===0);
    pieces.push(React.createElement("div",{key:i,style:{position:"fixed",top:0,left:left+"%",width:size,height:size,backgroundColor:color,borderRadius:isCircle?"50%":"2px",animation:"confettiFall "+dur+"s "+delay+"s ease-in forwards",pointerEvents:"none",zIndex:999}}));
  }
  return pieces;
})();
function Confetti(){
  return React.createElement("div",{style:{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:998}},CONFETTI_PIECES);
}
function App(){
  useEffect(function(){document.title="Ikasi & Go™";},[]);
  var _s0=useState("home");var screen=_s0[0];var setScreen=_s0[1];
  var _s1=useState(null);var cfg=_s1[0];var setCfg=_s1[1];
  var _s2=useState([]);var questions=_s2[0];var setQs=_s2[1];
  var _s3=useState([]);var results=_s3[0];var setResults=_s3[1];
  var _s4=useState(false);var isPro=_s4[0];var setIsPro=_s4[1];
  var _s5=useState(false);var showOnb=_s5[0];var setShowOnb=_s5[1];
  var _s6=useState(0);var streak=_s6[0];var setStreak=_s6[1];
  var _s7=useState(0);var longest=_s7[0];var setLongest=_s7[1];
  var _s8=useState(0);var totalSess=_s8[0];var setTotalSess=_s8[1];
  var _s9=useState(false);var streakLoaded=_s9[0];var setStreakLoaded=_s9[1];
  var _s10=useState({});var srsData=_s10[0];var setSrsData=_s10[1];
  var _s11=useState(false);var srsLoaded=_s11[0];var setSrsLoaded=_s11[1];
  var _s12=useState([]);var sessionHistory=_s12[0];var setSessionHistory=_s12[1];
  var _s13=useState(null);var trialUntil=_s13[0];var setTrialUntil=_s13[1];
  var _s14=useState(0);var vocabVersion=_s14[0];var setVocabVersion=_s14[1];
  var _s15=useState(null);var toast=_s15[0];var setToast=_s15[1];
  var _s16=useState(10);var dailyGoal=_s16[0];var setDailyGoal=_s16[1];
  var _s17=useState(0);var todayCount=_s17[0];var setTodayCount=_s17[1];
  var _s18=useState(false);var streakFrozen=_s18[0];var setStreakFrozen=_s18[1];
  var _s19=useState(null);var lastOpened=_s19[0];var setLastOpened=_s19[1];
  var VOCABULARY=_VOCAB;
  var WC=_WC;
  var isTrialActive=trialUntil&&new Date()<trialUntil;
  var isProOrTrial=isPro||isTrialActive;
  var srsStats=useMemo(function(){var words=isProOrTrial?VOCABULARY:VOCABULARY.filter(function(w){return w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)!==-1;});var now=new Date();var due=0,mastered=0,learning=0,unseen=0;for(var i=0;i<words.length;i++){var d=srsData[words[i].id];if(!d){unseen++;continue;}if((d.score||0)>=4){mastered++;continue;}var nr=new Date(d.nextReview);if(nr<=now)due++;else if(nr<=new Date(now.getTime()+86400000))due++;else learning++;}return{due:due,mastered:mastered,learning:learning,unseen:unseen,total:words.length};},[srsData,isPro,isProOrTrial,vocabVersion]);
  useEffect(function(){async function load(){try{var rs=await Promise.all([window.storage.get("streak_data"),window.storage.get("srs_data")]);if(rs[0]&&rs[0].value){var d=JSON.parse(rs[0].value),today=new Date().toDateString(),yest=new Date(Date.now()-86400000).toDateString();setStreak((d.lastDay===today||d.lastDay===yest)?(d.streak||0):0);setLongest(d.longest||0);setTotalSess(d.totalSessions||0);}if(rs[1]&&rs[1].value){try{var parsed=JSON.parse(rs[1].value);if(typeof parsed==="object"&&parsed!==null)setSrsData(parsed);}catch(e){console.warn("SRS data corrupted, resetting");}}
        try{var ph=await window.storage.get("session_history");if(ph&&ph.value){var hist=JSON.parse(ph.value);setSessionHistory(hist);}}catch(e){}
        try{var pr=await window.storage.get("pro_status");if(pr&&pr.value==="1")setIsPro(true);}catch(e){}
        try{var dg=await window.storage.get("daily_goal");if(dg&&dg.value)setDailyGoal(parseInt(dg.value)||10);}catch(e){}
        try{var sf=await window.storage.get("streak_freeze");if(sf&&sf.value){var sfv=JSON.parse(sf.value);if(sfv.until&&new Date(sfv.until)>new Date())setStreakFrozen(true);}}catch(e){}
        try{var lo=await window.storage.get("last_opened");var today2=new Date().toISOString().slice(0,10);setLastOpened(lo&&lo.value?lo.value:null);window.storage.set("last_opened",today2).catch(function(){});}catch(e){}
        try{var tc=await window.storage.get("today_count_"+new Date().toISOString().slice(0,10));if(tc&&tc.value)setTodayCount(parseInt(tc.value)||0);}catch(e){}
        try{var tr=await window.storage.get("trial_until");if(tr&&tr.value){var td=new Date(tr.value);if(td>new Date())setTrialUntil(td);}}catch(e){}try{var ob=await window.storage.get("onboarding_done");if(!ob||!ob.value)setShowOnb(true);}catch(e){setShowOnb(true);}}catch(e){}setStreakLoaded(true);setSrsLoaded(true);
        // Fetch vocabulary
        (async function(){
          try{
            var cached=await window.storage.get("vocab_cache");
            if(cached&&cached.value){try{var cv=JSON.parse(cached.value);if(cv&&cv.vocabulary){_VOCAB=cv.vocabulary;_WC=getWC();setVocabVersion(function(v){return v+1;});}}catch(e){}}
            var res=await fetch(VOCAB_URL);
            if(res.ok){var vj=await res.json();if(vj&&vj.vocabulary){_VOCAB=vj.vocabulary;_WC=getWC();setVocabVersion(function(v){return v+1;});setToast("vocabulary_loaded");setTimeout(function(){setToast(null);},2500);window.storage.set("vocab_cache",JSON.stringify(vj)).catch(function(){});}}
          }catch(e){setToast("offline");setTimeout(function(){setToast(null);},3000);}
        })();
      }load();},[]);
  async function updateSRS(res){var nd=Object.assign({},srsData),now=new Date();
  var bestByWord={};
  for(var i=0;i<res.length;i++){var r=res[i],id=r.question&&r.question.word?r.question.word.id:null;if(!id)continue;var prev=bestByWord[id];if(!prev||(!prev.correct&&(r.correct||(!r.wasClose&&prev.wasClose)))){bestByWord[id]=r;}}
  var changed=Object.keys(bestByWord);
  for(var ci=0;ci<changed.length;ci++){var id2=changed[ci];var r2=bestByWord[id2];var cur=nd[id2]||{score:0};var ns=r2.correct?Math.min(cur.score+1,4):r2.wasClose?cur.score:Math.max(cur.score-1,0);var reviewDays=r2.wasClose?1:SRS_I[ns];nd[id2]={score:ns,nextReview:new Date(now.getTime()+reviewDays*86400000).toISOString(),lastSeen:now.toISOString()};}
  setSrsData(function(){return nd;});try{await window.storage.set("srs_data",JSON.stringify(nd)).catch(function(){});}catch(e){}return nd;}
  async function saveSessionHistory(accuracy,level,topic){
  try{
    var r=await window.storage.get("session_history");
    var hist=r&&r.value?JSON.parse(r.value):[];
    hist.push({date:new Date().toISOString().slice(0,10),acc:accuracy,lvl:level,topic:topic});
    if(hist.length>90)hist=hist.slice(-90);  // keep 90 days
    await window.storage.set("session_history",JSON.stringify(hist)).catch(function(){});
  }catch(e){}
}
async function recordSession(){var today=new Date().toDateString(),yest=new Date(Date.now()-86400000).toDateString(),ns=streak;try{var r=await window.storage.get("streak_data");var d=r&&r.value?JSON.parse(r.value):{};var sf=await window.storage.get("streak_freeze");var freezeActive=sf&&sf.value&&JSON.parse(sf.value).until&&new Date(JSON.parse(sf.value).until)>new Date();if(d.lastDay===today)ns=d.streak||streak;else if(d.lastDay===yest)ns=(d.streak||0)+1;else ns=freezeActive?(d.streak||streak):1;var nl=Math.max(ns,d.longest||0);await window.storage.set("streak_data",JSON.stringify({streak:ns,longest:nl,lastDay:today,totalSessions:(d.totalSessions||0)+1})).catch(function(){});setStreak(ns);setLongest(nl);setTotalSess((totalSess||0)+1);}catch(e){setStreak(streak+1);}return ns;}
  function startQuiz(config,missedIds){if(!srsLoaded)return;if(!missedIds)missedIds=[];if(!isProOrTrial&&FREE.indexOf(config.cefr)===-1){setCfg(config);setScreen("paywall");return;}var qs=buildSession(VOCABULARY,config.cefr,config.topic,config.cumulative,config.count||20,missedIds,srsData,isProOrTrial);if(!qs.length)return;setCfg(config);setQs(qs);setResults([]);setScreen("quiz");}
  async function finishQuiz(res){var today3=new Date().toISOString().slice(0,10);var newTodayCount=todayCount+res.filter(function(r){return r.correct;}).length;setTodayCount(newTodayCount);window.storage.set("today_count_"+today3,String(newTodayCount)).catch(function(){});var sc=scoreSession(res);var worthStreak=res.length>=5;await Promise.all([worthStreak?recordSession():Promise.resolve(),updateSRS(res),saveSessionHistory(sc.accuracy,cfg?cfg.cefr:"A1",cfg?cfg.topic:"all")]);setResults(res);setScreen("results");}
  var isLoadingVocab=_VOCAB.length<=90&&screen==="home";
return(<div style={{fontFamily:"Nunito,system-ui,-apple-system,sans-serif",backgroundColor:"#F8F7F5",minHeight:"100vh"}}>
    {isLoadingVocab&&<div style={{position:"fixed",top:0,left:0,right:0,height:3,zIndex:9998,background:"linear-gradient(90deg,#19A85A,#22C070,#19A85A)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}}/>}
    {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9999,backgroundColor:toast==="offline"?"#555":"#19A85A",color:"#fff",fontSize:13,fontWeight:700,padding:"10px 20px",borderRadius:24,boxShadow:"0 4px 16px rgba(0,0,0,0.2)",whiteSpace:"nowrap",pointerEvents:"none"}}>{toast==="offline"?"Offline. Showing saved words.":"Vocabulary updated!"}</div>}
  {screen==="home"&&<HomeScreen onStart={startQuiz} isPro={isProOrTrial} isTrialActive={isTrialActive} trialUntil={trialUntil} streak={streak} longest={longest} streakLoaded={streakLoaded} dailyGoal={dailyGoal} todayCount={todayCount} streakFrozen={streakFrozen} lastOpened={lastOpened} onSetDailyGoal={function(g){setDailyGoal(g);window.storage.set("daily_goal",String(g)).catch(function(){});}} onUseStreakFreeze={function(){setStreakFrozen(true);var until=new Date(Date.now()+86400000).toISOString();window.storage.set("streak_freeze",JSON.stringify({until:until})).catch(function(){});}} srsStats={srsStats} srsLoaded={srsLoaded} onBrowse={function(){setScreen("browse");}} onUpgrade={function(){setScreen("paywall");}} onReplayIntro={function(){setShowOnb(true);}} totalSessions={totalSess} srsData={srsData}/>}
    {screen==="quiz"&&<QuizScreen questions={questions} onFinish={finishQuiz} onExit={function(){setScreen("home");}} srsData={srsData} quizTopic={cfg?cfg.topic:"all"} onAutoSave={function(res){updateSRS(res).catch(function(){});}}/>}
    {screen==="results"&&<ResultsScreen results={results} streak={streak} longest={longest} totalSessions={totalSess} srsStats={srsStats} isPro={isProOrTrial} sessionHistory={sessionHistory} onRetry={function(ids){if(cfg)startQuiz(cfg,ids||[]);else setScreen("home");}} onHome={function(){setScreen("home");}} onUpgrade={function(){setScreen("paywall");}} streakFrozen={streakFrozen} onUseStreakFreeze={function(){setStreakFrozen(true);var until=new Date(Date.now()+86400000).toISOString();window.storage.set("streak_freeze",JSON.stringify({until:until})).catch(function(){});}}/>}
    {screen==="paywall"&&<PaywallScreen
    trialAvailable={!trialUntil&&!isPro}
    trialDays={7}
    onTrial={function(){var until=new Date(Date.now()+7*86400000);setTrialUntil(until);window.storage.set("trial_until",until.toISOString()).catch(function(){});setScreen("home");}}
    onSubscribe={function(){setIsPro(true);window.storage.set("pro_status","1").catch(function(){});setScreen("home");}}
    onContinueFree={function(){setScreen("home");}}
    onStart={function(){setIsPro(true);window.storage.set("pro_status","1").catch(function(){});if(cfg){var qs=buildSession(VOCABULARY,cfg.cefr,cfg.topic,cfg.cumulative,20,[],srsData,true);if(qs.length){setQs(qs);setResults([]);setScreen("quiz");return;}}setScreen("home");}}
  />}
    {screen==="browse"&&<BrowseScreen isPro={isProOrTrial} srsData={srsData} onBack={function(){setScreen("home");}} onUpgrade={function(){setScreen("paywall");}} onQuiz={function(words){
      var sid=Math.random().toString(36).slice(2,8);
      var pool=shuffled(words).slice(0,20);
      var sessData=srsData;
      var sess=pool.map(function(word,i){
        var dp=VOCABULARY.filter(function(w2){return w2.id!==word.id;});
        var sameBoth2=dp.filter(function(w2){return w2.cefr===word.cefr&&w2.topic===word.topic;});
        var sameLevel2=dp.filter(function(w2){return w2.cefr===word.cefr;});
        var distPool2=sameBoth2.length>=3?sameBoth2:sameLevel2.length>=3?sameLevel2:dp;
        var dist=shuffled(distPool2).slice(0,3);
        var opts=shuffled([word.english].concat(dist.map(function(w2){return w2.english;})));
        return{id:"q_"+sid+"_"+i,mode:"multipleChoice",word:word,prompt:word.basque,promptLabel:"What does this mean?",options:opts,correct:word.english};
      });
      if(sess.length){setQs(sess);setResults([]);setScreen("quiz");}
    }}/>}
    {showOnb&&<OnboardingScreen onDone={function(){window.storage.set("onboarding_done","1").catch(function(){});setShowOnb(false);}} onUpgrade={function(){window.storage.set("onboarding_done","1").catch(function(){});setShowOnb(false);setScreen("paywall");}}/>}
  </div>);}
function HomeScreen(props){
  var VOCABULARY=_VOCAB;
  var WC=_WC;
  var onStart=props.onStart,isPro=props.isPro,streak=props.streak,longest=props.longest||0,dailyGoal=props.dailyGoal||10,todayCount=props.todayCount||0,streakFrozen=props.streakFrozen||false,lastOpened=props.lastOpened,onSetDailyGoal=props.onSetDailyGoal,onUseStreakFreeze=props.onUseStreakFreeze,streakLoaded=props.streakLoaded,srsStats=props.srsStats,srsLoaded=props.srsLoaded,onBrowse=props.onBrowse,onUpgrade=props.onUpgrade,onReplayIntro=props.onReplayIntro;var totalSessions=props.totalSessions||0;var srsData=props.srsData||{};var isTrialActive=props.isTrialActive;var trialUntil=props.trialUntil;
  var _s0=useState("A1");var lvl=_s0[0];var setLvlRaw=_s0[1];
  var _s1=useState("all");var topic=_s1[0];var setTopicRaw=_s1[1];
  var _s2=useState(false);var cumul=_s2[0];var setCumulRaw=_s2[1];
  var _s3=useState(null);var modal=_s3[0];var setModal=_s3[1];
  var _s4=useState(20);var sessionLen=_s4[0];var setSessionLen=_s4[1];
  function setLvl(v){setLvlRaw(v);window.storage.set("last_config",JSON.stringify({lvl:v,topic:topic,cumul:cumul})).catch(function(){});}
  function setTopic(v){setTopicRaw(v);window.storage.set("last_config",JSON.stringify({lvl:lvl,topic:v,cumul:cumul})).catch(function(){});}
  function setCumul(fn){var nv=typeof fn==="function"?fn(cumul):fn;setCumulRaw(nv);window.storage.set("last_config",JSON.stringify({lvl:lvl,topic:topic,cumul:nv})).catch(function(){});}
  useEffect(function(){window.storage.get("last_config").then(function(r){if(r&&r.value){var d=JSON.parse(r.value);if(d.lvl)setLvlRaw(d.lvl);if(d.topic)setTopicRaw(d.topic);if(d.cumul)setCumulRaw(d.cumul);}}).catch(function(){});},[]);
  var L=CL[lvl];
  var topicCounts=useMemo(function(){var o={};var allPool=getPool(VOCABULARY,lvl,"all",cumul,isPro);o.all=allPool.length;for(var i=0;i<TOPICS.length;i++){var t=TOPICS[i];if(t.key==="all")continue;var p=getPool(VOCABULARY,lvl,t.key,cumul,isPro);o[t.key]=p.length;}return o;},[lvl,cumul,isPro,_VOCAB.length]);
  var poolSize=topic==="all"?topicCounts.all:(topicCounts[topic]||0);
  var effectiveCount=Math.min(poolSize,sessionLen);var isLockedLevel=!isPro&&lvl!=="A1"&&totalSessions>=1;var isLockedTopic=!isPro&&lvl==="A1"&&topic!=="all"&&FREE_TOPICS.indexOf(topic)===-1;var pw=poolSize===0?(isLockedLevel?{msg:"Upgrade to Pro to access "+lvl+" words.",c:"#D97706",bg:"#FFF8F0",b:"#F59E0B",cta:true}:isLockedTopic?{msg:"The "+TL[topic]+" topic requires Pro.",c:"#D97706",bg:"#FFF8F0",b:"#F59E0B",cta:true}:{msg:"No words match - try a different filter.",c:"#C85070",bg:"#FFFAFA",b:"#FF7B89"}):effectiveCount<5?{msg:"Only "+effectiveCount+" words - questions will repeat.",c:"#D97706",bg:"#FFF8F0",b:"#F59E0B"}:null;
  var browseCount=useMemo(function(){return VOCABULARY.filter(function(w){return isPro||(w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)!==-1);}).length;},[isPro,_VOCAB.length]);
  var srsCard=null;
  if(srsLoaded&&totalSessions===0){
    srsCard=React.createElement("div",{style:{backgroundColor:"#fff",borderRadius:14,padding:"16px",border:"1px solid #F0F0F0",textAlign:"center"}},
      React.createElement("p",{style:{margin:"0 0 4px",fontSize:14,fontWeight:800,color:"#1A1A1A"}},"Ready to start learning?"),
      React.createElement("p",{style:{margin:0,fontSize:13,color:"#888"}},"Your first session will set up your personal memory tracker.")
    );
  } else if(srsLoaded&&(srsStats.mastered>0||srsStats.due>0||srsStats.learning>0)){
    var pct=srsStats.total>0?Math.round(srsStats.mastered/srsStats.total*100):0;
    var tiles=[{n:srsStats.due,l:"Due",c:srsStats.due>0?"#D97706":"#BBB",bg:srsStats.due>0?"#FFF8F0":"#F6F6F6"},{n:srsStats.mastered,l:"Mastered",c:"#19A85A",bg:"#F0FBF4"},{n:srsStats.learning,l:"Learning",c:"#888",bg:"#F6F6F6"},{n:srsStats.unseen,l:"New",c:"#BBB",bg:"#F6F6F6"}];
    srsCard=React.createElement("div",{style:{backgroundColor:"#fff",borderRadius:18,padding:"14px 16px",border:"1px solid #E8E8E8",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}},React.createElement("p",{style:{margin:0,fontSize:13,fontWeight:800,color:"#1A1A1A"}},"Word Memory"),React.createElement("p",{style:{margin:0,fontSize:11,color:"#888",fontWeight:600}},srsStats.mastered+"/"+srsStats.total)),
      React.createElement("div",{style:{height:8,backgroundColor:"#F0F0F0",borderRadius:4,overflow:"hidden",marginBottom:10}},React.createElement("div",{style:{height:"100%",backgroundColor:"#19A85A",borderRadius:3,width:pct+"%"}})),
      React.createElement("p",{style:{margin:"0 0 6px",fontSize:11,color:"#888",fontWeight:500}},srsStats.mastered+" of "+(isPro?VOCABULARY.length:VOCABULARY.filter(function(w){return w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)!==-1;}).length)+" words learned"),
          React.createElement("div",{style:{display:"flex",gap:8}},tiles.map(function(s,i){return React.createElement("div",{key:i,style:{flex:1,backgroundColor:s.bg,borderRadius:10,padding:"8px 4px",textAlign:"center"}},React.createElement("p",{style:{margin:0,fontSize:16,fontWeight:900,color:s.c}},s.n),React.createElement("p",{style:{margin:0,fontSize:10,fontWeight:700,color:s.c,textTransform:"uppercase"}},s.l));})),
      (!isPro&&srsStats.mastered>0&&srsStats.mastered===srsStats.total)?React.createElement("div",{style:{marginTop:10,backgroundColor:"#FFF8F0",border:"1.5px solid #F59E0B",borderRadius:10,padding:"10px 12px"}},React.createElement("p",{style:{margin:0,fontSize:12,fontWeight:800,color:"#D97706"}},"A1 complete! Unlock A2, B1 and B2 to keep going."),React.createElement("button",{onClick:onUpgrade,style:{marginTop:8,backgroundColor:"#F59E0B",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}},"Upgrade to Pro")):srsStats.due>0?React.createElement("button",{onClick:function(){var dueLvl=isPro?"B2":"A1";onStart({cefr:dueLvl,topic:"all",cumulative:true});},style:{width:"100%",marginTop:10,backgroundColor:"#FFF8F0",border:"1.5px solid #F59E0B",borderRadius:10,padding:"9px",fontSize:12,fontWeight:800,color:"#D97706",cursor:"pointer",fontFamily:"inherit"}},srsStats.due+" words due - Review now"):null
    );
  }
  var masteredByLevel=useMemo(function(){var o={};["A1","A2","B1","B2"].forEach(function(lv){var lvlWords=VOCABULARY.filter(function(w){return w.cefr===lv;});o[lv]=lvlWords.filter(function(w){return srsData[w.id]&&(srsData[w.id].score||0)>=4;}).length;o[lv+"_total"]=lvlWords.length;});return o;},[srsData,_VOCAB.length]);
  var levelCards=["A1","A2","B1","B2"].map(function(key){var L2=CL[key];var active=lvl===key;var k=key;
    return React.createElement("button",{key:key,onClick:function(){if(!isPro&&k!=="A1"){setModal(k);return;}setLvl(k);},style:{borderRadius:16,padding:"14px 12px",display:"flex",flexDirection:"column",gap:5,cursor:"pointer",border:"2px solid "+(active?L2.dark:(!isPro&&k!=="A1")?"#F0F0F0":"#E8E8E8"),backgroundColor:active?L2.color:(!isPro&&k!=="A1")?"#FAFAFA":"#fff",boxShadow:active?"0 6px 0 "+L2.dark:"0 2px 8px rgba(0,0,0,0.06)",transform:active?"translateY(-2px)":"none",textAlign:"left",fontFamily:"inherit",transition:"all 0.18s ease",opacity:(!isPro&&k!=="A1")?0.75:1}},
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}},
        React.createElement("span",{style:{fontSize:10,fontWeight:800,color:active?"rgba(255,255,255,0.9)":L2.color,backgroundColor:active?"rgba(255,255,255,0.25)":L2.bg,padding:"2px 8px",borderRadius:12,border:"1px solid "+(active?"rgba(255,255,255,0.3)":"rgba(0,0,0,0.1)")}},key),
        (!isPro&&key!=="A1")?React.createElement("span",{style:{fontSize:10,fontWeight:800,color:active?"rgba(255,255,255,0.8)":"#F59E0B",backgroundColor:active?"rgba(255,255,255,0.2)":"#FFF8F0",padding:"2px 6px",borderRadius:10}},"PRO"):null
      ),
      React.createElement("p",{style:{margin:0,fontSize:13,fontWeight:800,color:active?"#fff":"#1A1A1A",letterSpacing:-0.2}},L2.title),
      React.createElement("div",{style:{marginTop:4}},
  React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}},
    React.createElement("p",{style:{margin:0,fontSize:11,color:active?"rgba(255,255,255,0.75)":"#888"}},(!isPro&&key==="A1"?VOCABULARY.filter(function(w){return w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)!==-1;}).length:WC[key])+" words"+((!isPro&&key==="A1")?" free":"")),
    React.createElement("p",{style:{margin:0,fontSize:10,color:active?"rgba(255,255,255,0.6)":key==="A1"&&totalSessions===0?"#19A85A":"#BBB",fontWeight:700}},(!isPro&&key!=="A1"?"🔒 ":"")+(WC[key]>0&&masteredByLevel[key]>=WC[key]?"✓ Complete":masteredByLevel[key]>0?masteredByLevel[key]+" mastered":""))
  ),
  React.createElement("div",{style:{height:3,backgroundColor:active?"rgba(255,255,255,0.25)":"#F0F0F0",borderRadius:2,overflow:"hidden"}},
    React.createElement("div",{style:{height:"100%",borderRadius:2,backgroundColor:active?"rgba(255,255,255,0.7)":L2.color,width:(masteredByLevel[key+"_total"]>0?Math.round(masteredByLevel[key]/masteredByLevel[key+"_total"]*100):0)+"%" }})
  )
),
      active?React.createElement("button",{onClick:function(e){e.stopPropagation();setModal(k);},style:{marginTop:4,background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",borderRadius:8,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit",alignSelf:"flex-start"}},"ⓘ Level info"):null
    );
  });
  var today4=new Date().toISOString().slice(0,10);
  var daysSinceOpened=lastOpened&&lastOpened!==today4?Math.round((new Date(today4)-new Date(lastOpened))/86400000):0;
  var goalPct=Math.min(Math.round(todayCount/(dailyGoal||10)*100),100);
  var goalDone=todayCount>=(dailyGoal||10);
  var dayNum=Math.floor(Date.now()/86400000);
  var freeWords=VOCABULARY.filter(function(w){return w.cefr==="A1";});
  var wotd=freeWords.length>0?freeWords[dayNum%freeWords.length]:null;
  var _ml=modal&&CL[modal]?CL[modal]:null;
  var modalJSX=_ml?(<div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={function(){onClose();}}><div style={{backgroundColor:"#fff",borderTopLeftRadius:28,borderTopRightRadius:28,width:"100%",maxWidth:420,margin:"0 auto",overflow:"hidden"}} onClick={function(e){e.stopPropagation();}}><div style={{backgroundColor:_ml.color,padding:"20px 20px 16px"}}><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:28,fontWeight:900,color:"rgba(255,255,255,0.9)"}}>{modal}</span><div style={{flex:1}}><p style={{margin:0,fontSize:18,fontWeight:900,color:"#fff"}}>{_ml.title}</p><p style={{margin:"2px 0 0",fontSize:12,color:"rgba(255,255,255,0.8)"}}>{_ml.tagline}</p></div><button style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:14,fontFamily:"inherit"}} onClick={function(){onClose();}}>✕</button></div></div><div style={{padding:"16px 20px 32px",maxHeight:"70vh",overflowY:"auto"}}><p style={{margin:"0 0 10px",fontSize:11,fontWeight:800,color:"#888",textTransform:"uppercase",letterSpacing:0.8}}>At this level you can...</p>{_ml.canDo.map(function(c,i){return(<div key={i} style={{display:"flex",gap:10,marginBottom:8}}><span style={{fontSize:12,fontWeight:800,color:"#fff",backgroundColor:_ml.color,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>✓</span><p style={{margin:0,fontSize:13,color:"#1A1A1A",fontWeight:500,lineHeight:1.4}}>{c}</p></div>);})}<div style={{backgroundColor:_ml.bg,borderRadius:12,padding:"12px 14px",marginTop:12,border:"1.5px solid rgba(0,0,0,0.1)"}}><p style={{margin:0,fontSize:13,color:"#555",lineHeight:1.55,fontWeight:500}}>Tip: {_ml.tip}</p></div><div style={{display:"flex",gap:8,marginTop:12}}><div style={{flex:1,backgroundColor:"#F6F6F6",borderRadius:10,padding:"10px",textAlign:"center"}}><p style={{margin:0,fontSize:16,fontWeight:900,color:_ml.color}}>{WC[modal]}</p><p style={{margin:0,fontSize:10,color:"#888",fontWeight:600}}>WORDS</p></div><div style={{flex:1,backgroundColor:"#F6F6F6",borderRadius:10,padding:"10px",textAlign:"center"}}><p style={{margin:0,fontSize:12,fontWeight:800,color:"#1A1A1A"}}>{_ml.studyHours}</p><p style={{margin:0,fontSize:10,color:"#888",fontWeight:600}}>GUIDED STUDY</p></div></div><button style={{width:"100%",marginTop:14,border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:800,color:"#fff",cursor:"pointer",backgroundColor:_ml.color,boxShadow:"0 4px 0 "+_ml.dark,fontFamily:"inherit"}} onClick={function(){if(!isPro&&modal!=="A1"){onClose();onUpgrade();return;}setLvl(modal);onClose();}}>{!isPro&&modal!=="A1"?"Unlock "+modal+" words":"Study "+modal+" words"}</button></div></div></div>):null;
  return(<div style={{maxWidth:420,margin:"0 auto",display:"flex",flexDirection:"column",minHeight:"100vh"}}>
    <div style={{background:"linear-gradient(160deg,#093D24 0%,#0E7A40 40%,#19A85A 100%)",paddingTop:56,paddingLeft:16,paddingRight:16,paddingBottom:0,flexShrink:0,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,paddingBottom:16}}>
        <Logo size={32}/>{_VOCAB.length<=90&&<span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.7)",backgroundColor:"rgba(0,0,0,0.15)",padding:"2px 8px",borderRadius:10,marginLeft:4}}>OFFLINE</span>}
        <div style={{flex:1}}>
          <h1 style={{margin:0,fontSize:24,fontWeight:900,color:"#fff",letterSpacing:-0.8,lineHeight:1.1}}>Ikasi & Go™</h1>
          <p style={{margin:"2px 0 0",fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:600,letterSpacing:0.2}}>Learn Basque • Euskara</p>
        </div>
        {isTrialActive&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",backgroundColor:"rgba(255,215,0,0.25)",borderRadius:14,padding:"6px 10px",border:"1.5px solid rgba(255,215,0,0.5)"}}>
            <span style={{fontSize:11,fontWeight:900,color:"#fff",lineHeight:1}}>{Math.ceil((trialUntil-new Date())/86400000)}d</span>
            <span style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.85)",textTransform:"uppercase",letterSpacing:0.3}}>trial</span>
          </div>
        )}
        {streakLoaded&&streak>0&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",backgroundColor:"rgba(255,255,255,0.18)",borderRadius:14,padding:"8px 12px",border:"1.5px solid rgba(255,255,255,0.28)"}}>
            <span style={{fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{streak}</span>
            <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.75)",textTransform:"uppercase",letterSpacing:0.5}}>day{streak!==1?"s":""}</span>
          </div>
        )}
      </div>
      <svg viewBox="0 0 420 40" style={{display:"block",width:"100%",height:40,marginTop:-1}} preserveAspectRatio="none">
        <path d="M0,40 C140,0 280,0 420,40 L420,40 L0,40 Z" fill="#F6F6F6"/>
      </svg>
    </div>
    <div style={{padding:"8px 16px calc(72px + env(safe-area-inset-bottom, 0px))",display:"flex",flexDirection:"column",gap:16,flex:1,overflowY:"auto"}}>
      {trialUntil&&!isTrialActive&&!isPro&&(
        <div style={{backgroundColor:"#FFF8F0",border:"1.5px solid #F59E0B",borderRadius:16,padding:"13px 16px",marginBottom:0}}>
          <p style={{margin:"0 0 6px",fontSize:14,fontWeight:800,color:"#D97706"}}>Your free trial has ended</p>
          <p style={{margin:"0 0 10px",fontSize:13,color:"#888"}}>Subscribe to keep access to all words and topics.</p>
          <button onClick={onUpgrade} style={{width:"100%",backgroundColor:"#19A85A",border:"none",borderRadius:12,padding:"11px",fontSize:14,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 3px 0 #0E7A40"}}>Subscribe now</button>
        </div>
      )}
      <button onClick={onBrowse} style={{display:"flex",alignItems:"center",gap:12,backgroundColor:"#fff",border:"1px solid #E8E8E8",borderRadius:14,padding:"11px 14px",cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
        <div style={{flex:1,textAlign:"left"}}>
          <p style={{margin:0,fontSize:13,fontWeight:700,color:"#555"}}>📖 Browse {browseCount} words</p>
          <p style={{margin:0,fontSize:11,color:"#888",fontWeight:500}}>Search the full dictionary</p>
        </div>
        <span style={{color:"#BBB",fontWeight:700,fontSize:14}}>{"›"}</span>
      </button>

      <div style={{backgroundColor:"#fff",borderRadius:18,padding:"14px 16px",border:"1px solid #E8E8E8",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>{goalDone?"🎯":"📅"}</span>
            <p style={{margin:0,fontSize:13,fontWeight:800,color:"#1A1A1A"}}>Daily goal</p>
          </div>
          <p style={{margin:0,fontSize:12,color:goalDone?"#19A85A":"#888",fontWeight:700}}>{todayCount}/{dailyGoal} words</p>
        </div>
        <div style={{height:6,backgroundColor:"#F0F0F0",borderRadius:3,overflow:"hidden",marginBottom:8}}>
          <div style={{height:"100%",background:goalDone?"linear-gradient(90deg,#19A85A,#22C070)":"linear-gradient(90deg,#F59E0B,#FBBF24)",borderRadius:3,width:goalPct+"%",transition:"width 0.4s ease"}}/>
        </div>
        {goalDone?<p style={{margin:0,fontSize:12,color:"#19A85A",fontWeight:700}}>Goal complete! Great work today.</p>:
        <div style={{display:"flex",gap:6}}>
          {[5,10,20].map(function(g){return(
            <button key={g} onClick={function(){onSetDailyGoal(g);}} style={{flex:1,padding:"5px",borderRadius:8,border:"1.5px solid "+(dailyGoal===g?"#19A85A":"#E8E8E8"),backgroundColor:dailyGoal===g?"#EDFAF3":"#fff",color:dailyGoal===g?"#19A85A":"#888",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{g} words</button>
          );})}
        </div>}
        {daysSinceOpened>=2&&<p style={{margin:"8px 0 0",fontSize:12,color:"#888"}}>{"Welcome back! You've been away "+daysSinceOpened+" days."}</p>}
      </div>
      {srsCard}
      {wotd&&(

          <div style={{background:"linear-gradient(135deg,#F0FBF4,#E8F8EE)",borderRadius:18,padding:"14px 16px",border:"1px solid #C6EFD8",boxShadow:"0 2px 12px rgba(25,168,90,0.1)",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:16}}>✨</span>
                <p style={{margin:0,fontSize:11,fontWeight:800,color:"#AAA",textTransform:"uppercase",letterSpacing:0.8}}>Word of the day</p>
              </div>
            </div>
            <p style={{margin:"0 0 2px",fontSize:20,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.3}}>{wotd.basque}</p>
            <p style={{margin:"0 0 4px",fontSize:14,color:"#888",fontWeight:500}}>{wotd.english}</p>
            <p style={{margin:0,fontSize:11,color:"#BBB",fontWeight:600,letterSpacing:0.3}}>{wotd.pronunciation}</p>
          </div>
        
      )}

      <section style={{backgroundColor:"#fff",borderRadius:20,padding:"16px",border:"1px solid #F0F0F0",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",borderTop:"3px solid #19A85A"}}>
        <h2 style={{margin:"0 0 12px",fontSize:15,fontWeight:800,color:"#1A1A1A",letterSpacing:-0.2}}>Choose your level</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{levelCards}</div>
        {lvl!=="A1"&&(
          <button style={{display:"flex",alignItems:"center",gap:8,marginTop:10,borderRadius:12,padding:"10px 14px",fontSize:13,fontWeight:600,cursor:"pointer",border:"1.5px solid "+(cumul?L.dark:"#E8E8E8"),backgroundColor:cumul?L.color:"#fff",color:cumul?"#fff":"#444",fontFamily:"inherit",width:"100%",transition:"all 0.15s ease"}} onClick={function(){setCumul(function(c){return !c;});}}>
            <span style={{fontSize:13}}>{cumul?"✓":"+"}</span> Include lower levels
          </button>
        )}
        {!isPro&&(
          <button onClick={onUpgrade} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:8,width:"100%",backgroundColor:"#FFF8F0",border:"1.5px solid #F59E0B",borderRadius:12,padding:"10px",fontSize:12,fontWeight:800,color:"#D97706",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 0 #F59E0B"}}>
            ✦ Unlock A2, B1 &amp; B2. 500+ more words
          </button>
        )}
      </section>
      <section style={{backgroundColor:"#fff",borderRadius:20,padding:"16px",border:"1px solid #F0F0F0",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",borderTop:"3px solid #19A85A"}}>
        <h2 style={{margin:"0 0 12px",fontSize:15,fontWeight:800,color:"#1A1A1A",letterSpacing:-0.2}}>Pick a topic <span style={{fontSize:11,fontWeight:500,color:"#AAA"}}>(optional)</span></h2>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {TOPICS.map(function(t){var active=topic===t.key;var cnt=topicCounts[t.key]||0;var bad=t.key!=="all"&&cnt===0;var tk=t.key;return(
            <button key={t.key} style={{borderRadius:20,padding:"10px 14px",fontSize:13,fontWeight:active?700:500,cursor:bad?"default":"pointer",border:"1.5px solid "+(active?L.dark:"#E8E8E8"),backgroundColor:active?L.color:bad?"#F8F8F8":(!isPro&&lvl==="A1"&&t.key!=="all"&&FREE_TOPICS.indexOf(t.key)===-1)?"#F8F8F8":"#fff",color:active?"#fff":bad?"#CCC":(!isPro&&lvl==="A1"&&t.key!=="all"&&FREE_TOPICS.indexOf(t.key)===-1)?"#BBB":"#333",fontFamily:"inherit",opacity:bad?0.5:1,transition:"all 0.12s"}} onClick={function(){if(!bad){if(!isPro&&lvl==="A1"&&tk!=="all"&&FREE_TOPICS.indexOf(tk)===-1){onUpgrade();}else{setTopic(tk);}}}}>
              {(!isPro&&lvl==="A1"&&t.key!=="all"&&FREE_TOPICS.indexOf(t.key)===-1)?"🔒 ":""}{t.label}{t.key!=="all"&&cnt>0&&!bad&&(isPro||FREE_TOPICS.indexOf(t.key)!==-1)?" · "+cnt:""}
            </button>
          );})}
        </div>
      </section>
      <section>
        {pw&&(<div style={{backgroundColor:pw.bg,border:"1.5px solid "+pw.b,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{margin:"0 0 "+(pw.cta?"8px":"0"),fontSize:13,color:pw.c,fontWeight:600}}>{pw.msg}</p>{pw.cta&&<button onClick={onUpgrade} style={{width:"100%",backgroundColor:"#19A85A",border:"none",borderRadius:8,padding:"9px",fontSize:13,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Unlock with Pro</button>}</div>)}
        {poolSize>0&&(
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <span style={{fontSize:11,color:"#AAA",fontWeight:700,alignSelf:"center",marginRight:4,textTransform:"uppercase",letterSpacing:0.5}}>Questions</span>
            {[10,20,30].map(function(n){var active=sessionLen===n;var nn=n;return(
              <button key={n} onClick={function(){setSessionLen(nn);}} style={{flex:1,padding:"7px",borderRadius:10,border:"1.5px solid "+(active?L.dark:"#E8E8E8"),backgroundColor:active?L.color:"#fff",color:active?"#fff":"#888",fontSize:13,fontWeight:active?800:500,cursor:"pointer",fontFamily:"inherit"}}>
                {n}
              </button>
            );})}
          </div>
        )}
        {props.totalSessions===0&&lvl==="A1"&&topic==="all"&&topic!=="greetings"&&(
          <p style={{margin:"0 0 10px",fontSize:12,color:"#888",textAlign:"center",lineHeight:1.5}}>
            Tip: Start with <button onClick={function(){setTopic("greetings");}} style={{background:"none",border:"none",color:"#19A85A",fontWeight:800,cursor:"pointer",fontSize:12,padding:0,fontFamily:"inherit"}}>Greetings</button> for your first session - you will use these words immediately!
          </p>
        )}
        <button style={{width:"100%",border:"none",borderRadius:20,padding:"19px",fontSize:18,fontWeight:900,color:"#fff",cursor:poolSize===0?"not-allowed":"pointer",backgroundColor:poolSize===0?"#CCC":L.color,boxShadow:poolSize===0?"none":"0 6px 0 "+L.dark,fontFamily:"inherit",opacity:poolSize===0?0.7:1,transition:"all 0.15s",letterSpacing:-0.3}} onClick={function(){if(poolSize>0)onStart({cefr:lvl,topic:topic,cumulative:cumul,count:sessionLen});}} disabled={poolSize===0}>
          {poolSize>0?"Start · "+effectiveCount+" questions":"No words available"}
        </button>
      </section>
      <div style={{textAlign:"center"}}>
        <button onClick={onReplayIntro} style={{background:"none",border:"none",color:"#AAA",fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:"8px",textDecoration:"underline"}}>About this app &amp; Basque language</button>
      </div>
    </div>
    {modalJSX}
  </div>);}
function QuizScreen(props){
  var VOCABULARY=_VOCAB;
  var WC=_WC;
  var questions=props.questions,onFinish=props.onFinish,onExit=props.onExit,srsData=props.srsData||{};
  var _s0=useState(0);var idx=_s0[0];var setIdx=_s0[1];
  var _s1=useState(null);var sel=_s1[0];var setSel=_s1[1];
  var _s2=useState("");var typed=_s2[0];var setTyped=_s2[1];
  var _s3=useState(null);var result=_s3[0];var setResult=_s3[1];
  var _s4=useState(false);var confirmExit=_s4[0];var setConfirmExit=_s4[1];
  var _s5=useState(false);var showNote=_s5[0];var setShowNote=_s5[1];
  var _s6=useState(null);var snoozeUntil=_s6[0];var setSnoozeUntil=_s6[1];
  var _s7=useState(0);var snoozeLeft=_s7[0];var setSnoozeLeft=_s7[1];
  var _s8=useState(0);var wrongCount=_s8[0];var setWrongCount=_s8[1];
  var latest=useRef([]);
  var timerRef=useRef(null);
  useEffect(function(){
    if(!snoozeUntil){clearInterval(timerRef.current);setSnoozeLeft(0);return;}
    var tick=function(){var s=Math.max(0,Math.ceil((snoozeUntil-new Date())/1000));setSnoozeLeft(s);if(s===0){setSnoozeUntil(null);clearInterval(timerRef.current);}};
    tick();timerRef.current=setInterval(tick,1000);
    return function(){clearInterval(timerRef.current);};
  },[snoozeUntil]);
  var q=questions[idx]||questions[0];
  if(!q)return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",padding:24,textAlign:"center"}}>
      <p style={{fontSize:32,marginBottom:12}}>🤔</p>
      <p style={{fontSize:18,fontWeight:800,color:"#1A1A1A",margin:"0 0 8px"}}>No words available</p>
      <p style={{fontSize:14,color:"#888",margin:"0 0 24px"}}>Try a different topic or level.</p>
      <button onClick={onExit} style={{border:"none",borderRadius:14,padding:"14px 28px",backgroundColor:"#19A85A",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Go back</button>
    </div>
  );
  var isSnoozed=snoozeUntil&&new Date()<snoozeUntil;
  var origType=q.mode;
  var effectiveType=isSnoozed&&origType==="typing"?"multipleChoice":origType;
  var isMC=effectiveType==="multipleChoice",isFB=effectiveType==="fillBlank",isType=effectiveType==="typing",isAnyMC=isMC||isFB;
  var lc=(CL[q.word.cefr]||CL.A1).color,ld=(CL[q.word.cefr]||CL.A1).dark;
  var ready=isAnyMC?!!sel:typed.trim().length>0;
  function submit(ans){if(result)return;if(ans==="_SKIP_"){haptic("error");setResult({correct:false,wasClose:false,skipped:true});setWrongCount(function(n){return n+1;});var newLatest2=latest.current.concat([{question:q,correct:false,wasClose:false,skipped:true}]);latest.current=newLatest2;return;}var qForCheck=isSnoozed&&origType==="typing"?Object.assign({},q,{correct:snoozeCorrect,mode:"multipleChoice"}):q;var r=checkAnswer(qForCheck,ans);setResult(r);if(!r.correct)setWrongCount(function(n){return n+1;});var newLatest=latest.current.concat([Object.assign({},r,{question:q})]);latest.current=newLatest;}
  var advancing=React.useRef(false);function advance(){if(advancing.current)return;advancing.current=true;setTimeout(function(){advancing.current=false;},2000);var delay=result&&result.correct?180:0;var currentLatest=latest.current;var nextIdx=idx+1;if(nextIdx>=questions.length){advancing.current=false;onFinish(currentLatest);}else{setTimeout(function(){setIdx(function(i){return i+1;});setSel(null);setTyped("");setResult(null);setShowNote(false);setWrongCount(0);advancing.current=false;if(nextIdx%5===0){try{updateSRS(currentLatest);}catch(e){}}},delay);}}
  var snoozeMin=Math.floor(snoozeLeft/60);
  var snoozeSec=("0"+(snoozeLeft%60)).slice(-2);
  var snoozeDisplay=snoozeMin+":"+snoozeSec;
  var resColor=result?(result.correct?"#19A85A":result.wasClose?"#F59E0B":"#FF7B89"):"#E8E8E8";
  var snoozeOpts=useMemo(function(){
    if(!snoozeUntil||q.mode!=="typing")return[];
    var dp2=VOCABULARY.filter(function(w){return w.id!==q.word.id;});
    var sl2=dp2.filter(function(w){return w.cefr===q.word.cefr&&w.topic===q.word.topic;});
    var sl2Level=dp2.filter(function(w){return w.cefr===q.word.cefr;});
    var dist2=shuffled(sl2.length>=3?sl2:sl2Level.length>=3?sl2Level:dp2).slice(0,3);
    return shuffled([q.word.english].concat(dist2.map(function(w){return w.english;})));
  },[idx,snoozeUntil?1:0,q.id]);
  var snoozeCorrect=isSnoozed&&origType==="typing"?q.word.english:q.correct;
  
  var correctMsg=result&&result.correct?CORRECT_MSGS[idx%CORRECT_MSGS.length]:"Correct!";
  var resLabel=result?(result.correct?correctMsg:result.wasClose?"Almost - "+snoozeCorrect:"Wrong - "+snoozeCorrect):null;
  var isNewWord=!srsData[q.word.id];
  var doneCount=latest.current.length;
  var correctCount=latest.current.filter(function(r){return r.correct;}).length;
  var runningScoreEl=doneCount>0?React.createElement("p",{style:{textAlign:"center",fontSize:12,color:"#888",margin:0,fontWeight:700}},correctCount+" of "+doneCount+" correct"):React.createElement("p",{style:{textAlign:"center",fontSize:12,color:"#CCC",margin:0}},"Tap an answer above");
  var opts=q.options||snoozeOpts;
  return(<div style={{maxWidth:420,margin:"0 auto",display:"flex",flexDirection:"column",minHeight:"100vh",backgroundColor:"#F6F6F6",animation:"fadeIn 0.2s ease"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:52,paddingLeft:16,paddingRight:16,paddingBottom:10,backgroundColor:"#fff",borderBottom:"1px solid #F0F0F0",flexShrink:0}}>
      <button style={{background:"#F0F0F0",border:"none",color:"#666",fontSize:14,cursor:"pointer",padding:0,fontFamily:"inherit",lineHeight:1,width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}} onClick={function(){if(idx>0)setConfirmExit(true);else onExit();}}>✕</button>
      <span style={{fontSize:10,fontWeight:800,color:lc,backgroundColor:"rgba(0,0,0,0.08)",padding:"3px 8px",borderRadius:20,flexShrink:0}}>{questions[0].word.cefr}</span>
      {result&&props.quizTopic&&props.quizTopic!=="all"&&<span style={{fontSize:10,fontWeight:600,color:"#888",flexShrink:0}}>{TL[props.quizTopic]||""}</span>}
      <div style={{flex:1,height:8,backgroundColor:"#F0F0F0",borderRadius:4,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:4,backgroundColor:lc,width:(((idx+(result?1:0))/questions.length)*100)+"%",transition:"width 0.4s ease"}}/>
      </div>
      <span style={{fontSize:13,fontWeight:800,color:"#1A1A1A",flexShrink:0}}>{idx+1}<span style={{color:"#CCC"}}>/{questions.length}</span></span>
    </div>
    {isSnoozed&&(
      <div style={{backgroundColor:"#FFF8F0",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,borderBottom:"1px solid #FCD34D"}}>
        <span style={{fontSize:12,fontWeight:600,color:"#D97706"}}>Typing snoozed - multiple choice ({snoozeDisplay} left)</span>
        <button onClick={function(){setSnoozeUntil(null);}} style={{background:"none",border:"none",color:"#D97706",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit",padding:"2px 6px"}}>Resume</button>
      </div>
    )}
    <div style={{flex:1,overflowY:"auto",padding:"12px 16px calc(160px + env(safe-area-inset-bottom, 0px))",display:"flex",flexDirection:"column",gap:12}}>
      <div key={"card-"+idx} style={{backgroundColor:result?(result.correct?"#F0FBF4":result.wasClose?"#FFFBF0":"#FFF5F5"):"#fff",borderRadius:22,padding:"20px",border:"2px solid "+resColor,boxShadow:"0 4px 0 "+(result?(result.correct?"#0E7A40":result.wasClose?"#D97706":"#D98080"):"#E8E8E8"),transition:"all 0.25s",animation:"slideUp 0.2s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <span style={{fontSize:11,fontWeight:800,padding:"4px 12px",borderRadius:20,color:isFB?"#7C3AED":isMC?"#D97706":"#19A85A",backgroundColor:isFB?"#EDE9FE":isMC?"#FEF3C7":"#D1FAE5",letterSpacing:0.2}}>{isFB?"Complete sentence":isMC?"Choose meaning":"Type in Basque"}</span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {isNewWord&&<span style={{fontSize:10,fontWeight:800,color:"#fff",backgroundColor:"#F59E0B",padding:"2px 8px",borderRadius:12,letterSpacing:0.3}}>NEW</span>}
            {result&&<span style={{fontSize:10,fontWeight:800,color:"#fff",backgroundColor:(CL[q.word.cefr]||CL.A1).color,padding:"2px 8px",borderRadius:12}}>{q.word.cefr} {TL[q.word.topic]||q.word.topic}</span>}
          </div>
        </div>
        {(isMC||isType||result)&&!isFB&&(
          <React.Fragment>
          <div style={{display:"flex",justifyContent:"center",marginBottom:8,marginTop:4}}><span style={{fontSize:11,fontWeight:700,color:TOPIC_COLORS[q.word.topic]||"#888",backgroundColor:(TOPIC_COLORS[q.word.topic]||"#888")+"18",padding:"3px 10px",borderRadius:20,letterSpacing:0.3,textTransform:"uppercase"}}>{q.word.topic}</span><span style={{fontSize:11,fontWeight:700,color:CL[q.word.cefr]?CL[q.word.cefr].color:"#888",backgroundColor:CL[q.word.cefr]?CL[q.word.cefr].bg:"#F0F0F0",padding:"3px 8px",borderRadius:20,marginLeft:6}}>{q.word.cefr}</span></div>
          <div style={{textAlign:"center",marginBottom:12,marginTop:0}}>
            <h2 style={{margin:0,fontSize:isMC?(q.word.basque.length>14?22:q.word.basque.length>10?28:34):26,fontWeight:900,color:isMC?"#1A1A1A":"#0E7A40",letterSpacing:-0.5,wordBreak:"break-word",overflowWrap:"break-word"}}>{isMC?q.word.basque:q.prompt}</h2>
            {isMC&&result&&<p style={{margin:"4px 0 0",fontSize:12,color:"#AAA"}}>{q.word.pronunciation}</p>}
            {isType&&!result&&<p style={{margin:"6px 0 0",fontSize:11,color:"#19A85A",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>→ type in Basque</p>}
            {isType&&result&&<p style={{margin:"6px 0 0",fontSize:22,fontWeight:900,color:"#19A85A",letterSpacing:-0.3}}>{q.word.basque}</p>}
            {result&&<div style={{display:"flex",justifyContent:"center",gap:8,marginTop:6}}>
              <span style={{fontSize:9,fontWeight:800,color:"#fff",backgroundColor:(CL[q.word.cefr]||CL.A1).color,padding:"2px 8px",borderRadius:12}}>{q.word.cefr}</span>
              <span style={{fontSize:9,fontWeight:700,color:"#AAA",backgroundColor:"#F6F6F6",padding:"2px 8px",borderRadius:12}}>{TL[q.word.topic]||q.word.topic}</span>
            </div>}
          </div>
          </React.Fragment>
        )}
        {isFB&&(
          <p style={{fontSize:15,lineHeight:1.9,fontWeight:500,color:"#1A1A1A",textAlign:"center",margin:"0 0 8px"}}>
            {q.prompt.split("___").map(function(part,pi,arr){return(
              <span key={pi}>{part}{pi<arr.length-1&&(<span style={{display:"inline-block",minWidth:80,borderBottom:result?"none":"2.5px solid #19A85A",color:result?(result.correct?"#19A85A":"#FF7B89"):"transparent",fontWeight:800,textAlign:"center",padding:"0 4px",minHeight:24}}>{result?q.correct:"___"}</span>)}</span>
            );})}
          </p>
        )}
        {isType&&!result&&(
          <div>
            <input style={{width:"100%",border:"2px solid #E8E8E8",borderRadius:16,padding:"15px 18px",fontSize:18,fontWeight:600,color:"#1A1A1A",outline:"none",boxSizing:"border-box",fontFamily:"inherit",backgroundColor:"#fff",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}} placeholder="Type in Basque" value={typed} onChange={function(e){if(!result)setTyped(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&typed.trim()&&!result)submit(typed);}} autoFocus autoComplete="off" spellCheck={false}/>

            {!result&&(
              <button onClick={function(){haptic("light");submit("_SKIP_");}} style={{display:"block",margin:"10px auto 0",background:"#F5F5F5",border:"none",color:"#888",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",padding:"8px 20px",borderRadius:20,letterSpacing:0}}>I don't know</button>
            )}

            {wrongCount>0&&!result&&!isSnoozed&&(
              <p style={{margin:"8px 0 0",fontSize:12,color:"#AAA",textAlign:"center"}}>
                Hint: starts with <strong style={{color:"#888",fontSize:14}}>{snoozeCorrect[0].toUpperCase()}</strong>
                {wrongCount>1&&<span> ({snoozeCorrect.length} letters)</span>}
              </p>
            )}
            <p style={{margin:"10px 0 0",textAlign:"center",fontSize:11}}><button onClick={function(){setSnoozeUntil(new Date(Date.now()+15*60*1000));}} style={{background:"none",border:"none",color:"#CCC",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,textDecoration:"underline",padding:0}}>Switch to multiple choice for 15 min</button></p>
          </div>
        )}
        {result&&(
          <div>
            
            <div style={{borderRadius:14,overflow:"hidden",border:"2px solid "+(result.correct?"#6EE7B7":result.wasClose?"#FCD34D":"#FFBBBB")}}>
              <div style={{padding:"12px 16px",backgroundColor:result.correct?"#EDFAF3":result.wasClose?"#FFF8F0":"#FFF0F0"}}>
                <p style={{margin:0,fontSize:15,fontWeight:800,color:result.correct?"#19A85A":result.wasClose?"#D97706":"#C85070",letterSpacing:-0.2}}>{resLabel}</p>
                {isType&&result.userAnswer&&<p style={{margin:"4px 0 0",fontSize:12,color:result.correct?"#74C69D":result.wasClose?"#F59E0B":"#FF8C94"}}>You typed: "{result.userAnswer}"</p>}
              </div>
              <div style={{padding:"10px 14px",backgroundColor:"#FAFAFA",borderTop:"1px solid "+(result.correct?"#D4F5E9":result.wasClose?"#FDE68A":"#FFD5D5")}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <p style={{margin:0,fontSize:12,color:"#555",fontWeight:700,letterSpacing:0.5,backgroundColor:"#EBEBEB",padding:"3px 10px",borderRadius:20,display:"inline-block"}}>{q.word.pronunciation}</p>
                  {q.word.notes&&<button onClick={function(){setShowNote(function(n){return !n;});}} style={{background:showNote?"#EDFAF3":"#F0F0F0",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,color:showNote?"#19A85A":"#666",padding:"4px 10px",borderRadius:20,lineHeight:1,fontFamily:"inherit",transition:"all 0.15s",flexShrink:0}}>ⓘ Note</button>}
                </div>
                {showNote&&q.word.notes&&<p style={{margin:"8px 0 0",fontSize:12,color:"#666",lineHeight:1.65}}>{q.word.notes}</p>}
                {q.word.example&&q.word.example.basque&&(
                  <div style={{marginTop:8,backgroundColor:"#F8F8F8",borderRadius:8,padding:"8px 10px",borderLeft:"3px solid #19A85A"}}>
                    <p style={{margin:0,fontSize:13,fontWeight:700,color:"#1A1A1A"}}>{q.word.example.basque}</p>
                    <p style={{margin:"2px 0 0",fontSize:12,color:"#888",fontStyle:"italic"}}>{q.word.example.english}</p>
                  </div>
                )}
                {isFB&&<p style={{margin:"4px 0 0",fontSize:13,fontWeight:700,color:"#1A1A1A"}}>{q.word.english}</p>}
              </div>
            </div>
            
          </div>
        )}
      </div>
      {isAnyMC&&!result&&opts.map(function(opt,i){var s=sel===opt;return(
        <button key={i} style={{display:"flex",alignItems:"center",gap:12,border:"2px solid "+(s?"#19A85A":"#E8E8E8"),borderRadius:16,padding:"15px 16px",cursor:"pointer",backgroundColor:s?"#ECFDF5":"#fff",transform:s?"scale(1.01)":"scale(1)",width:"100%",textAlign:"left",fontFamily:"inherit",boxShadow:s?"0 3px 0 #0E7A40":"0 3px 0 #E0E0E0",transition:"all 0.12s",transform:s?"translateY(-1px)":"none"}} onClick={function(){if(!result){haptic("light");setSel(opt);submit(opt);}}}>
          <span style={{fontSize:12,fontWeight:800,color:s?"#fff":"#AAA",width:26,height:26,borderRadius:"50%",backgroundColor:s?"#19A85A":"#F0F0F0",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.12s"}}>{String.fromCharCode(65+i)}</span>
          <span style={{flex:1,fontSize:14,fontWeight:s?700:500,color:s?"#19A85A":"#1A1A1A",wordBreak:"break-word",lineHeight:1.3}}>{opt}</span>
        </button>
      );})}
      {isAnyMC&&result&&opts.map(function(opt,i){var isC=opt===snoozeCorrect,isW=opt===sel&&!result.correct;return(
        <div key={i} style={{display:"flex",alignItems:"center",gap:12,border:"1.5px solid "+(isC?"#19A85A":isW?"#FF7B89":"#E8E8E8"),borderRadius:14,padding:"14px 16px",backgroundColor:isC?"#EDFAF3":isW?"#FFFAFA":"#F8F8F8"}}>
          <span style={{fontSize:12,fontWeight:800,color:isC?"#fff":isW?"#FF7B89":"#CCC",width:24,height:24,borderRadius:"50%",backgroundColor:isC?"#19A85A":"transparent",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{String.fromCharCode(65+i)}</span>
          <span style={{flex:1,fontSize:14,color:isC?"#19A85A":isW?"#C85070":"#AAA",fontWeight:isC||isW?700:400}}>{opt}</span>
          {isC&&<span style={{color:"#19A85A",fontWeight:900,fontSize:16}}>✓</span>}
          {isW&&<span style={{color:"#FF7B89",fontWeight:900,fontSize:16}}>✗</span>}
        </div>
      );})}
    </div>
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,backgroundColor:"#fff",borderTop:"1px solid #E8E8E8",padding:"14px 16px calc(24px + env(safe-area-inset-bottom, 0px))",boxShadow:"0 -4px 16px rgba(0,0,0,0.08)"}}>
      {!result?(
        isAnyMC?runningScoreEl
        :<button style={{width:"100%",border:"none",borderRadius:14,padding:"15px",fontSize:16,fontWeight:800,cursor:ready?"pointer":"default",backgroundColor:ready?lc:"#F0F0F0",color:ready?"#fff":"#AAA",fontFamily:"inherit",boxShadow:ready?"0 4px 0 "+ld:"none",transition:"all 0.15s"}} onClick={function(){if(typed.trim())submit(typed);}} disabled={!ready}>Check</button>
      ):(
        <button style={{width:"100%",border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:900,cursor:"pointer",backgroundColor:lc,color:"#fff",fontFamily:"inherit",boxShadow:"0 4px 0 "+ld,letterSpacing:-0.2}} onClick={function(){advance();}}>
          {idx+1>=questions.length?"Done!":"Continue →"}
        </button>
      )}
    </div>
    {confirmExit&&(
      <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"0 24px"}}>
        <div style={{backgroundColor:"#fff",borderRadius:24,padding:"28px 24px",width:"100%",maxWidth:360,textAlign:"center"}}>
          <p style={{margin:"0 0 6px",fontSize:16,fontWeight:800,color:"#1A1A1A"}}>Leave this quiz?</p>
          <p style={{margin:"0 0 18px",fontSize:13,color:"#888"}}>You have answered {latest.current.length} of {questions.length}.</p>
          <button style={{width:"100%",border:"none",borderRadius:14,padding:"13px",fontSize:14,fontWeight:800,cursor:"pointer",backgroundColor:"#19A85A",color:"#fff",fontFamily:"inherit",boxShadow:"0 4px 0 #0E7A40",marginBottom:8}} onClick={function(){setConfirmExit(false);}}>Keep going →</button>
          <button style={{width:"100%",backgroundColor:"#fff",color:"#C85070",border:"1.5px solid #FFBBBB",borderRadius:14,padding:"13px",fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700}} onClick={function(){onExit();}}>Leave quiz</button>
          {latest.current.length>0&&<button style={{width:"100%",backgroundColor:"transparent",border:"none",color:"#19A85A",borderRadius:14,padding:"8px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:4,textDecoration:"underline"}} onClick={function(){onFinish(latest.current);}}>See score so far →</button>}
        </div>
      </div>
    )}
  </div>);}
function Ring(props){var acc=props.acc||0;var _s0=useState(0);var d=_s0[0];var setD=_s0[1];useEffect(function(){if(acc===0){setD(0);return;}var st=null,fr=null;function step(ts){if(!st)st=ts;var p=Math.min((ts-st)/800,1);setD(Math.round(p*acc));if(p<1)fr=requestAnimationFrame(step);}fr=requestAnimationFrame(step);return function(){cancelAnimationFrame(fr);};},[acc]);var r=52,circ=2*Math.PI*r,off=circ-(d/100)*circ,rc=acc>=80?"#19A85A":acc>=50?"#F59E0B":"#FF7B89";return(<div style={{position:"relative",width:136,height:136,marginBottom:8}}><svg width="136" height="136" viewBox="0 0 110 110"><circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="9"/><circle cx="55" cy="55" r={r} fill="none" stroke={rc} strokeWidth="9" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 55 55)" style={{transition:"stroke-dashoffset 0.05s linear"}}/></svg><div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>{props.emoji&&<span style={{fontSize:18,lineHeight:1,marginBottom:1}}>{props.emoji}</span>}<span style={{fontSize:props.emoji?16:22,fontWeight:900,color:"#fff",lineHeight:1}}>{d}%</span><span style={{fontSize:10,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600}}>score</span></div></div>);}
function MCard(props){var word=props.word,result=props.result;var _s0=useState(false);var open=_s0[0];var setOpen=_s0[1];return(<div style={{backgroundColor:"#fff",borderRadius:14,marginBottom:8,border:"1px solid #F0F0F0",overflow:"hidden"}}><div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px"}}><div style={{flex:1,minWidth:0}}><p style={{margin:0,fontSize:15,fontWeight:800,color:"#1A1A1A"}}>{word.basque}</p><p style={{margin:"1px 0 0",fontSize:12,color:"#888"}}>{word.english}</p></div>{result&&result.userAnswer&&<span style={{fontSize:10,color:"#888",backgroundColor:"#F6F6F6",padding:"2px 8px",borderRadius:10,flexShrink:0,fontWeight:600}}>"{result.userAnswer}"</span>}{(word.notes||word.example)&&<button style={{padding:"9px 12px",borderRadius:8,backgroundColor:open?"#EDFAF3":"#F6F6F6",border:"none",color:open?"#19A85A":"#888",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}} onClick={function(){setOpen(function(o){return !o;});}}>{open?"▲":"▼"}</button>}</div>{open&&(<div style={{padding:"8px 14px 12px",borderTop:"1px solid #F4F4F4"}}>{word.example&&<div style={{backgroundColor:"#F0FBF4",borderRadius:8,padding:"8px 10px",marginBottom:6}}><p style={{margin:0,fontSize:13,fontWeight:700,color:"#1A1A1A"}}>{word.example.basque}</p><p style={{margin:"2px 0 0",fontSize:12,color:"#888",fontStyle:"italic"}}>{word.example.english}</p></div>}{word.notes&&<p style={{margin:0,fontSize:13,color:"#555",lineHeight:1.5}}>{word.notes}</p>}</div>)}</div>);}
function ResultsScreen(props){
  var VOCABULARY=_VOCAB;
  var WC=_WC;
  var results=props.results,streak=props.streak,longest=props.longest,totalSessions=props.totalSessions,srsStats=props.srsStats,isPro=props.isPro,sessionHistory=props.sessionHistory||[],onRetry=props.onRetry,onHome=props.onHome,onUpgrade=props.onUpgrade;
  var _s0=useState("summary");var tab=_s0[0];var setTab=_s0[1];
  var score=scoreSession(results);
  var acc=score.accuracy;
  var heroGrad=acc>=80?"linear-gradient(135deg,#0E7A40,#19A85A)":acc>=50?"linear-gradient(135deg,#2563EB,#60A5FA)":"linear-gradient(135deg,#C85070,#FF8C94)";
  var byTopic={};for(var i=0;i<results.length;i++){var r=results[i];var t=r.question&&r.question.word?r.question.word.topic:"other";if(!byTopic[t])byTopic[t]={c:0,tot:0};byTopic[t].tot++;if(r.correct)byTopic[t].c++;}
  var tRows=Object.keys(byTopic).map(function(t){var d=byTopic[t];return{t:t,c:d.c,tot:d.tot,pct:Math.round(d.c/d.tot*100)};}).sort(function(a,b){return b.pct-a.pct;});
  var mmap={};for(var j=0;j<results.length;j++){var r2=results[j];if(!r2.correct&&r2.question&&r2.question.word)mmap[r2.question.word.id]=r2;}
  var last7=sessionHistory.slice(-7);
  var nextMilestone=streak<3?3:streak<7?7:streak<14?14:streak<30?30:0;
  var milestoneDays=nextMilestone>0?(nextMilestone-streak):0;
  var milestoneEl=nextMilestone>0?React.createElement("p",{style:{margin:0,fontSize:11,color:"#BBB",fontWeight:600}},milestoneDays+" day"+(milestoneDays!==1?"s":"")+" to "+nextMilestone+"-day streak"):null;
  var trendChart=sessionHistory.length>2?React.createElement("div",{style:{backgroundColor:"#fff",borderRadius:14,padding:"12px 14px",border:"1px solid #F0F0F0",marginBottom:10}},React.createElement("p",{style:{margin:"0 0 8px",fontSize:11,fontWeight:800,color:"#888",textTransform:"uppercase",letterSpacing:0.5}},"Last "+last7.length+" sessions"),React.createElement("div",{style:{display:"flex",alignItems:"flex-end",gap:4,height:56}},last7.map(function(s,i){var h=Math.max(4,Math.round((s.acc/100)*56));var isLast=i===last7.length-1;return React.createElement("div",{key:i,style:{flex:1,height:h,borderRadius:3,backgroundColor:isLast?"#19A85A":s.acc>=80?"#74C69D":s.acc>=60?"#F59E0B":"#FFAAB4",transition:"height 0.5s ease",transitionDelay:(i*50)+"ms"}});})),React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginTop:4}},React.createElement("p",{style:{margin:0,fontSize:10,color:"#BBB"}},"Oldest"),React.createElement("p",{style:{margin:0,fontSize:10,color:"#19A85A",fontWeight:700}},"Today "+last7[last7.length-1].acc+"%"))):null;
  var masteredCount=srsStats?srsStats.mastered:0;
  var milestones=[25,50,100,200,500];
  var hitMilestone=milestones.find(function(m){return masteredCount>=m&&masteredCount-score.correct<m;});
  var bestAcc=sessionHistory.length>1?Math.max.apply(null,sessionHistory.slice(0,-1).map(function(s){return s.accuracy||0;})):0;
  var isPersonalBest=acc>0&&acc>bestAcc&&sessionHistory.length>1;
  var smsg=streak>=30?"You made it to 30 days! 🏆":streak>=14?"Two weeks strong 💪":streak>=7?"On fire! Keep it going 🔥":streak>=3?"Building a great habit!":streak===2?"Day 2, you're on a roll!":streak===1?"Great start! Come back tomorrow.":"Every session counts!";
  var tabs=[["summary","Summary"]];
  if(score.missedWords.length+score.closeWords.length>0)tabs.push(["missed","Missed"+(score.missedWords.length>0?" ("+score.missedWords.length+")":" ≈("+score.closeWords.length+")")]);
  tabs.push(["all","All ("+results.length+")"]);
  return(<div style={{maxWidth:420,margin:"0 auto",backgroundColor:"#F8F7F5",minHeight:"100vh",animation:"fadeIn 0.2s ease"}}>
    {acc===100&&<Confetti/>}
    <div style={{background:heroGrad,paddingTop:64,paddingLeft:20,paddingRight:20,paddingBottom:28,display:"flex",flexDirection:"column",alignItems:"center",borderBottomLeftRadius:32,borderBottomRightRadius:32}}>
      <Ring acc={acc} emoji={score.grade.emoji}/>
      <h1 style={{margin:"4px 0 3px",fontSize:26,fontWeight:900,color:"#fff",letterSpacing:-0.5,animation:acc===100?"popIn 0.5s 0.8s ease both":"none"}}>{score.grade.label}</h1>
      <p style={{margin:"0 0 20px",fontSize:14,color:"rgba(255,255,255,0.85)",fontWeight:600}}>{score.correct}/{score.total} correct - {isPersonalBest?"🌟 Personal best!":score.grade.sub}</p>
      <div style={{display:"flex",backgroundColor:"rgba(255,255,255,0.2)",borderRadius:18,overflow:"hidden",width:"100%"}}>
        {[{n:score.correct,l:"Correct"},{n:score.closeButWrong,l:"Almost"},{n:score.genuinelyWrong,l:"Missed"}].map(function(item,i){return(
          <div key={item.l} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 8px",borderLeft:i>0?"1px solid rgba(255,255,255,0.25)":"none"}}>
            <span style={{fontSize:22,fontWeight:900,color:"#fff"}}>{item.n}</span>
            <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.75)",textTransform:"uppercase",letterSpacing:0.5}}>{item.l}</span>
          </div>
        );})}
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",backgroundColor:"#fff",margin:"0 16px",borderRadius:"0 0 20px 20px",boxShadow:"0 6px 16px rgba(0,0,0,0.1)",marginTop:-2,position:"relative",zIndex:1}}>
      <span style={{fontSize:streak>=7?36:28,filter:streak>=7?"drop-shadow(0 0 8px rgba(255,140,0,0.6))":"none",transition:"all 0.3s"}}>{streak>=7?"🔥":streak>=3?"⚡":streak>=1?"⭐":"😴"}</span>
      <div style={{flex:1}}>
        <p style={{margin:0,fontSize:14,fontWeight:800,color:"#1A1A1A"}}>{streak} day streak {streak===longest&&streak>1?" ⭐ best!":""}</p>
        <p style={{margin:0,fontSize:12,color:"#888"}}>{totalSessions===1?"Welcome to Ikasi & Go! Great first session!":smsg}</p>
        {milestoneEl}
        {isPro&&streak>=3&&!props.streakFrozen&&(
          <button onClick={function(){if(props.onUseStreakFreeze)props.onUseStreakFreeze();}} style={{marginTop:6,background:"none",border:"1px solid #E8E8E8",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,color:"#888",cursor:"pointer",fontFamily:"inherit"}}>❄️ Use streak freeze</button>
        )}
        {props.streakFrozen&&<p style={{margin:"4px 0 0",fontSize:11,color:"#0891B2",fontWeight:700}}>❄️ Streak freeze active</p>}
        {totalSessions>0&&<p style={{margin:0,fontSize:11,color:"#BBB",fontWeight:600}}>Session {totalSessions} - {score.total} words practiced</p>}
      </div>
    </div>
    <div style={{padding:"14px 16px calc(100px + env(safe-area-inset-bottom, 0px))",minHeight:"50vh"}}>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {tabs.map(function(t){var key=t[0],label=t[1];return(
          <button key={key} style={{flex:1,border:"1.5px solid",borderRadius:12,padding:"9px 4px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:tab===key?"#19A85A":"#888",borderColor:tab===key?"#19A85A":"#E8E8E8",backgroundColor:tab===key?"#F0FBF4":"#fff"}} onClick={function(){setTab(key);}}>
            {label}
          </button>
        );})}
      </div>
      {tab==="summary"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {tRows.map(function(row,i){return(
            <div key={row.t} style={{display:"flex",alignItems:"center",gap:10,backgroundColor:"#fff",borderRadius:12,padding:"10px 14px",border:"1px solid #F0F0F0"}}>
              <span style={{fontSize:13,fontWeight:700,color:"#1A1A1A",width:88,flexShrink:0}}>{TL[row.t]||row.t}</span>
              <div style={{flex:1,height:8,backgroundColor:"#F0F0F0",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:4,width:row.pct+"%",backgroundColor:row.pct>=80?"#19A85A":row.pct>=50?"#74C69D":"#FFAAB4",transition:"width 0.8s ease",transitionDelay:(i*60+200)+"ms"}}/>
              </div>
              <span style={{fontSize:12,fontWeight:700,color:"#888",width:32,textAlign:"right"}}>{row.pct}%</span>
            </div>
          );})}
          {trendChart}
  {srsStats&&(srsStats.mastered>0||srsStats.learning>0)&&(
            <div style={{backgroundColor:"#F0FBF4",borderRadius:14,padding:"12px 14px",border:"1px solid #D4EDE0"}}>
              <p style={{margin:"0 0 8px",fontSize:11,fontWeight:800,color:"#19A85A",textTransform:"uppercase",letterSpacing:0.5}}>Word Memory Updated</p>
              <div style={{display:"flex",gap:6}}>
                {[{n:srsStats.mastered,l:"mastered",c:"#19A85A"},{n:srsStats.learning,l:"learning",c:"#888"},{n:srsStats.due,l:"due",c:"#D97706"},{n:srsStats.unseen,l:"new",c:"#BBB"}].filter(function(s){return s.n>0;}).map(function(s,i){return(
                  <div key={i} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:10,backgroundColor:"#fff"}}>
                    <p style={{margin:0,fontSize:18,fontWeight:900,color:s.c}}>{s.n}</p>
                    <p style={{margin:0,fontSize:10,color:s.c,fontWeight:600}}>{s.l}</p>
                  </div>
                );})}
              </div>
            </div>
          )}
          {!isPro&&(
            <button onClick={onUpgrade} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,backgroundColor:"#FFF8F0",border:"1.5px solid #F59E0B",borderRadius:14,padding:"12px 16px",cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
              <div style={{textAlign:"left"}}>
                <p style={{margin:0,fontSize:13,fontWeight:800,color:"#D97706"}}>Unlock A2, B1 and B2 words</p>
                <p style={{margin:0,fontSize:11,color:"#888"}}>Retry missed words and more with Pro</p>
              </div>
              <span style={{color:"#D97706",fontWeight:900,fontSize:16,flexShrink:0}}>{"›"}</span>
            </button>
          )}
        </div>
      )}
      {tab==="missed"&&(
        <div>
          {score.missedWords.length>0&&(<div><p style={{margin:"0 0 8px",fontSize:11,fontWeight:800,color:"#C85070",textTransform:"uppercase",letterSpacing:0.8}}>X Missed ({score.missedWords.length})</p>{score.missedWords.map(function(w,i){return <MCard key={"m"+i} word={w} result={mmap[w.id]}/>;})}</div>)}
          {score.closeWords.length>0&&(<div><p style={{margin:"10px 0 8px",fontSize:11,fontWeight:800,color:"#D97706",textTransform:"uppercase",letterSpacing:0.8}}>~ Almost ({score.closeWords.length})</p>{score.closeWords.map(function(w,i){return <MCard key={"c"+i} word={w} result={mmap[w.id]}/>;})}</div>)}
        </div>
      )}
      {tab==="all"&&(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {results.slice().sort(function(a,b){return(a.correct?2:a.wasClose?1:0)-(b.correct?2:b.wasClose?1:0);}).map(function(r,i){return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",backgroundColor:r.correct?"#EDFAF3":r.wasClose?"#FFF8F0":"#FFFAFA",borderRadius:12,border:"1.5px solid "+(r.correct?"#19A85A":r.wasClose?"#F59E0B":"#FF7B89")}}>
              <span style={{fontSize:14,fontWeight:800,color:r.correct?"#19A85A":r.wasClose?"#D97706":"#C85070"}}>{r.correct?"✓":r.wasClose?"≈":"✗"}</span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:13,fontWeight:700,color:"#1A1A1A"}}>{r.question&&r.question.word?r.question.word.basque:""}</p>
                <p style={{margin:0,fontSize:11,color:"#888"}}>{r.question&&r.question.word?r.question.word.english:""}</p>
              </div>
              {r.question&&<span style={{fontSize:10,fontWeight:700,color:"#BBB",backgroundColor:"#F6F6F6",padding:"2px 6px",borderRadius:8,flexShrink:0,marginRight:4}}>{r.question.mode==="multipleChoice"?"MC":r.question.mode==="fillBlank"?"FB":"Type"}</span>}
              {!r.correct&&r.userAnswer&&<span style={{fontSize:10,color:"#AAA",flexShrink:0}}>"{r.userAnswer}"</span>}
            </div>
          );})}
        </div>
      )}
      {hitMilestone&&(
          <div style={{backgroundColor:"rgba(255,255,255,0.15)",borderRadius:14,padding:"12px 16px",marginBottom:12,textAlign:"center"}}>
            <p style={{margin:"0 0 2px",fontSize:20}}>🏆</p>
            <p style={{margin:"0 0 2px",fontSize:15,fontWeight:900,color:"#fff"}}>{hitMilestone} words mastered!</p>
            <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.8)"}}>Amazing milestone. Keep it up!</p>
          </div>
        )}
        <div style={{display:"flex",gap:10,marginTop:16}}>
        {isPro&&(score.genuinelyWrong>0||score.closeButWrong>0)?(
          <button style={{flex:2,backgroundColor:"#19A85A",color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 0 #0E7A40"}} onClick={function(){onRetry(score.missedWords.concat(score.closeWords).map(function(w){return w.id;}).filter(function(v,i,a){return a.indexOf(v)===i;}));}}>
            Try again ({score.missedWords.length+score.closeWords.length})
          </button>
        ):(
          <button style={{flex:1,backgroundColor:"#fff",color:"#333",border:"1.5px solid #E8E8E8",borderRadius:14,padding:"14px",fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 3px 0 #CCC"}} onClick={function(){onUpgrade&&onUpgrade();}}>Upgrade</button>
        )}
        <button style={{flex:1,backgroundColor:"#fff",color:"#555",border:"1.5px solid #E8E8E8",borderRadius:14,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}} onClick={function(){onHome();}}>Home</button>
        <button style={{flex:2,backgroundColor:"#19A85A",color:"#fff",border:"none",borderRadius:16,padding:"14px",fontSize:16,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 0 #0E7A40",letterSpacing:-0.3}} onClick={function(){onRetry([]);}}>New session →</button>
      </div>
    </div>
  </div>);}
function OnboardingScreen(props){
  var VOCABULARY=_VOCAB;
  var WC=_WC;
  var onDone=props.onDone,onUpgrade=props.onUpgrade;
  var _s0=useState(0);var slide=_s0[0];var setSlide=_s0[1];
  var a1=VOCABULARY.filter(function(w){return w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)!==-1;}).length;
  var slides=[
    {
      emoji:"🌍",
      title:"Earth's Greatest Language Mystery",
      body:"Basque has been spoken in the Pyrenees for thousands of years, yet nobody knows where it came from. Unlike every other language in Europe, it has no known relatives. Linguists call it a language isolate. Completely, utterly unique.",
      cta:"Interesting! Tell me more →"
    },
    {
      emoji:"🧠",
      title:"Learning that actually sticks",
      body:"Ikasi & Go uses spaced repetition, a proven memory technique. Answer correctly and a word disappears for longer. The more you know it, the less we test it. Words you struggle with come back until they stick.",
      cta:"Got it →"
    },
    {
      emoji:"🎉",
      title:"You are ready to start",
      body:"Greetings, food, and numbers are free forever. That's "+a1+" words to begin your journey. Upgrade to Pro to unlock all "+_VOCAB.length+" words including family, travel, emotions, culture and more.",
      cta:"Start learning Basque!"
    }
  ];
  var s=slides[slide];
  var isLast=slide===slides.length-1;
  return(
    <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.65)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(e){if(e.target===e.currentTarget&&!isLast)setSlide(function(s){return s+1;});}}>
      <div style={{backgroundColor:"#fff",borderTopLeftRadius:32,borderTopRightRadius:32,width:"100%",maxWidth:420,padding:"32px 24px 48px",boxShadow:"0 -8px 40px rgba(0,0,0,0.25)"}}>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:28}}>
          {slides.map(function(_,i){return(<div key={i} style={{width:i===slide?32:8,height:8,borderRadius:4,backgroundColor:i===slide?"#19A85A":"#E8E8E8",transition:"all 0.3s ease"}}/>);})}
        </div>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48,marginBottom:16,lineHeight:1,width:80,height:80,borderRadius:"50%",backgroundColor:"#F0FBF4",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>{s.emoji}</div>
          <h2 style={{margin:"0 0 14px",fontSize:22,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5,lineHeight:1.25}}>{s.title}</h2>
          <p style={{margin:0,fontSize:15,color:"#555",lineHeight:1.7,fontWeight:500}}>{s.body}</p>
        </div>
        <button style={{width:"100%",border:"none",borderRadius:18,padding:"18px",fontSize:16,fontWeight:900,color:"#fff",cursor:"pointer",backgroundColor:"#19A85A",boxShadow:"0 5px 0 #0E7A40",fontFamily:"inherit",letterSpacing:-0.2}} onClick={function(){isLast?onDone():setSlide(function(s){return s+1;});}}>
          {s.cta}
        </button>
        {isLast&&onUpgrade&&(
          <button style={{display:"block",width:"100%",marginTop:10,background:"none",border:"1.5px solid #F59E0B",borderRadius:16,color:"#D97706",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",padding:"14px"}} onClick={onUpgrade}>
            Try Pro free for 7 days
          </button>
        )}
        {!isLast&&(
          <button style={{display:"block",margin:"14px auto 0",background:"none",border:"none",color:"#AAA",fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:"6px 16px"}} onClick={onDone}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
function relDate(iso){
  if(!iso)return"Never";var d=new Date(iso);var now=new Date();
  var days=Math.floor((now-d)/86400000);
  if(days===0)return"Today";
  if(days===1)return"Yesterday";
  if(days<7)return days+" days ago";
  if(days<30)return Math.floor(days/7)+" weeks ago";
  return d.toLocaleDateString();
}
function ResetButton(){
  var _s0=useState(false);var confirm=_s0[0];var setConfirm=_s0[1];
  function doReset(){
    window.storage.set("srs_data","{}").catch(function(){});
    window.storage.set("streak_data","{}").catch(function(){});
    window.storage.set("pro_status","").catch(function(){});
    window.storage.set("session_history","[]").catch(function(){});
    window.storage.set("last_config","{}").catch(function(){});
    window.storage.set("vocab_cache","").catch(function(){});
    window.storage.set("trial_until","").catch(function(){});
    setConfirm(false);
    window.location.reload();
  }
  return(
    <div style={{textAlign:"center",marginTop:24,paddingBottom:8}}>
      {!confirm&&(
        <button onClick={function(){setConfirm(true);}} style={{background:"none",border:"none",color:"#CCC",fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:"6px"}}>
          Reset all progress
        </button>
      )}
      {confirm&&(
        <div style={{backgroundColor:"#FFFAFA",border:"1px solid #FFBBBB",borderRadius:12,padding:"14px 16px"}}>
          <p style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"#C85070"}}>Reset all progress?</p>
          <p style={{margin:"0 0 12px",fontSize:12,color:"#888"}}>This clears your word memory, streak, and Pro status.</p>
          <div style={{display:"flex",gap:8}}>
            <button onClick={function(){setConfirm(false);}} style={{flex:1,backgroundColor:"#fff",border:"1px solid #E8E8E8",borderRadius:10,padding:"9px",fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"#888"}}>Cancel</button>
            <button onClick={doReset} style={{flex:1,backgroundColor:"#C85070",border:"none",borderRadius:10,padding:"9px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:"#fff"}}>Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}
function BrowseScreen(props){
  var VOCABULARY=_VOCAB;
  var WC=_WC;
  var isPro=props.isPro,srsData=props.srsData,onBack=props.onBack,onUpgrade=props.onUpgrade,onQuiz=props.onQuiz;
  var _s0=useState("");var query=_s0[0];var setQuery=_s0[1];
  var _s1=useState("all");var filterLvl=_s1[0];var setFilterLvl=_s1[1];
  var _s2=useState("all");var filterTopic=_s2[0];var setFilterTopic=_s2[1];
  var _s3=useState(null);var expanded=_s3[0];var setExpanded=_s3[1];
  var _s4=useState(false);var showAll=_s4[0];var setShowAll=_s4[1];
  var _s5b=useState(false);var groupByTopic=_s5b[0];var setGroupByTopic=_s5b[1];
  var _s5=useState("az");var sortBy=_s5[0];var setSortBy=_s5[1];
  var filtered=useMemo(function(){
    var q=query.toLowerCase().trim();
    var base=VOCABULARY.filter(function(w){
      if(filterLvl!=="all"&&w.cefr!==filterLvl)return false;
      if(filterTopic!=="all"&&w.topic!==filterTopic)return false;
      if(!isPro&&!(w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)!==-1))return false;
      if(q)return w.basque.toLowerCase().indexOf(q)!==-1||w.english.toLowerCase().indexOf(q)!==-1;
      return true;
    });
    if(sortBy==="status"){
      var now=new Date();
      return base.slice().sort(function(a,b){
        var rank=function(w){var d=srsData[w.id];if(!d)return 2;var sc=d.score||0;if(sc>=4)return 5;if(new Date(d.nextReview)<=now)return 0;return sc<=0?1:sc<=2?3:4;};
        return rank(a)-rank(b);
      });
    }
    return base.slice().sort(function(a,b){return a.basque.localeCompare(b.basque);});
  },[query,filterLvl,filterTopic,isPro,sortBy,srsData]);
  var visible=filtered.slice(0,showAll?filtered.length:60);
  return(
    <div style={{maxWidth:420,margin:"0 auto",display:"flex",flexDirection:"column",minHeight:"100vh",backgroundColor:"#F6F6F6",animation:"fadeIn 0.2s ease"}}>
      <div style={{background:"linear-gradient(155deg,#0E7A40 0%,#19A85A 100%)",padding:"20px 16px 16px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <button style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",width:34,height:34,borderRadius:"50%",cursor:"pointer",fontSize:18,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onBack}>{"<"}</button>
          <h1 style={{margin:0,fontSize:20,fontWeight:900,color:"#fff",flex:1,letterSpacing:-0.3}}>Word Browser</h1>
          <button onClick={function(){setSortBy(function(s){return s==="az"?"status":"az";});}} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
            {sortBy==="az"?"A-Z":"Status"}
          </button>
          <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.85)"}}>{filtered.length}</span>
        </div>
        <div style={{position:"relative"}}>
          <input style={{width:"100%",border:"none",borderRadius:12,padding:"11px 40px 11px 14px",fontSize:15,fontWeight:500,color:"#1A1A1A",outline:"none",boxSizing:"border-box",backgroundColor:"rgba(255,255,255,0.95)"}} placeholder="Search Basque or English..." value={query} onChange={function(e){setQuery(e.target.value);setExpanded(null);setShowAll(false);}} autoComplete="off" spellCheck={false}/>
          {query.length>0&&<button onClick={function(){setQuery("");}} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#AAA",fontSize:18,cursor:"pointer",padding:4,fontFamily:"inherit"}}>x</button>}
        </div>
      </div>
      <svg viewBox="0 0 420 40" style={{display:"block",width:"100%",height:30,marginTop:-1,flexShrink:0}} preserveAspectRatio="none">
        <path d="M0,20 C80,40 200,0 300,25 C370,40 400,15 420,20 L420,40 L0,40 Z" fill="#F6F6F6"/>
      </svg>
      <div style={{backgroundColor:"#fff",borderBottom:"1px solid #E8E8E8",padding:"10px 16px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,overflowX:"auto",WebkitMaskImage:"linear-gradient(to right,transparent 0,black 20px,black calc(100% - 20px),transparent 100%)"}}>
          <span style={{fontSize:10,fontWeight:800,color:"#AAA",textTransform:"uppercase",flexShrink:0}}>Level</span>
          {["all","A1","A2","B1","B2"].map(function(lv){var active=filterLvl===lv;var lk=lv;return(
            <button key={lv} onClick={function(){setFilterLvl(lk);setExpanded(null);setShowAll(false);}} style={{flexShrink:0,border:"1.5px solid",borderRadius:20,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",backgroundColor:active?(lv==="all"?"#19A85A":(CL[lv]?CL[lv].color:"#19A85A")):"#fff",color:active?"#fff":"#888",borderColor:active?(lv==="all"?"#0E7A40":(CL[lv]?CL[lv].dark:"#0E7A40")):"#E8E8E8"}}>
              {lv==="all"?"All":lv}
            </button>
          );})}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,overflowX:"auto",paddingBottom:2,WebkitMaskImage:"linear-gradient(to right,transparent 0,black 20px,black calc(100% - 20px),transparent 100%)"}}>
          <span style={{fontSize:10,fontWeight:800,color:"#AAA",textTransform:"uppercase",flexShrink:0}}>Topic</span>
          {[{key:"all",label:"All"}].concat(TOPICS.filter(function(t){return t.key!=="all";})).map(function(t){var active=filterTopic===t.key;var tk=t.key;return(
            <button key={t.key} onClick={function(){setFilterTopic(filterTopic===tk&&tk!=="all"?"all":tk);setExpanded(null);setShowAll(false);}} style={{flexShrink:0,border:"1.5px solid",borderRadius:20,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",backgroundColor:active?"#19A85A":"#fff",color:active?"#fff":"#888",borderColor:active?"#0E7A40":"#E8E8E8"}}>
              {t.key==="all"?"All":t.label.split(" ")[0]}
            </button>
          );})}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px 12px calc(32px + env(safe-area-inset-bottom, 0px))"}}>
        {visible.length===0&&(
          <div style={{textAlign:"center",padding:"48px 16px",color:"#AAA"}}>
            <p style={{fontSize:32,margin:"0 0 8px"}}>?</p>
            <p style={{fontSize:15,fontWeight:600,margin:0}}>No words found</p>
          </div>
        )}
        {filtered.length>0&&(filterLvl!=="all"||filterTopic!=="all"||query)&&(
          <div style={{marginBottom:8,padding:"10px 14px",backgroundColor:"#F0FBF4",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between",border:"1px solid #D4EDE0"}}>
            <span style={{fontSize:13,color:"#19A85A",fontWeight:600}}>{filtered.length} word{filtered.length!==1?"s":""} match</span>
            <button onClick={function(){if(onQuiz)onQuiz(filtered);}} style={{backgroundColor:"#19A85A",border:"none",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
              Quiz {Math.min(filtered.length,20)}
            </button>
          </div>
        )}
        {visible.map(function(word,wi){var prevTopic=wi>0?visible[wi-1].topic:null;var topicHeader=groupByTopic&&word.topic!==prevTopic?React.createElement("p",{key:"h"+word.topic,style:{margin:"14px 0 4px 2px",fontSize:11,fontWeight:800,color:"#AAA",textTransform:"uppercase",letterSpacing:0.8}},TOPICS.find(function(t){return t.key===word.topic;})?TOPICS.find(function(t){return t.key===word.topic;}).label:word.topic):null;var srs=srsData[word.id];var sc=srs&&srs.score!=null?srs.score:-1;
          var srsLabel=sc>=0?SRS_L[Math.min(sc,4)]:"Unseen";
          var srsColor=sc>=0?SRS_C[Math.min(sc,4)]:"#BBB";
          var lvl=CL[word.cefr];var isOpen=expanded===word.id;
          return React.createElement(React.Fragment,{key:word.id},topicHeader,(
            <div key={word.id} style={{backgroundColor:"#fff",borderRadius:14,marginBottom:8,border:"1px solid #E8E8E8",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)",borderLeft:"3px solid "+srsColor}}>
              <button style={{width:"100%",background:"none",border:"none",padding:"13px 14px",textAlign:"left",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:12}} onClick={function(){setExpanded(isOpen?null:word.id);}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <span style={{fontSize:16,fontWeight:800,color:"#1A1A1A"}}>{word.basque}</span>
                    <span style={{fontSize:10,fontWeight:800,color:"#fff",backgroundColor:lvl?lvl.color:"#888",padding:"2px 7px",borderRadius:20}}>{word.cefr}</span>
                  </div>
                  <span style={{fontSize:13,color:"#888",fontWeight:500}}>{word.english}</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:srsColor}}><span style={{width:6,height:6,borderRadius:"50%",backgroundColor:srsColor,display:"inline-block",flexShrink:0}}/>{srsLabel}</span>
                  <span style={{fontSize:13,color:"#CCC"}}>{isOpen?"▲":"▼"}</span>
                </div>
              </button>
              {isOpen&&(
                <div style={{padding:"10px 14px 14px",borderTop:"1px solid #F4F4F4"}}>
                  <p style={{margin:"0 0 8px",fontSize:12,color:"#888",fontWeight:600,letterSpacing:0.2}}>{word.pronunciation}</p>
                  {word.example&&(
                    <div style={{backgroundColor:"#F0FBF4",borderRadius:10,padding:"9px 12px",marginBottom:8,border:"1px solid #D4EDE0"}}>
                      <p style={{margin:0,fontSize:13,fontWeight:700,color:"#1A1A1A"}}>{word.example.basque}</p>
                      <p style={{margin:"2px 0 0",fontSize:12,color:"#888",fontStyle:"italic"}}>{word.example.english}</p>
                    </div>
                  )}
                  {word.notes&&<p style={{margin:0,fontSize:13,color:"#555",lineHeight:1.55,fontWeight:500}}>{word.notes}</p>}
                  {srs&&srs.lastSeen&&(
                    <p style={{margin:"8px 0 0",fontSize:11,color:srsColor,fontWeight:600}}>Last seen: {relDate(srs.lastSeen)}</p>
                  )}
                </div>
              )}
            </div>
          )
          );
        })}
        {!showAll&&filtered.length>60&&(
          <button onClick={function(){setShowAll(true);}} style={{width:"100%",margin:"4px 0 8px",backgroundColor:"#fff",border:"1px solid #E8E8E8",borderRadius:12,padding:"12px",fontSize:13,fontWeight:700,color:"#888",cursor:"pointer",fontFamily:"inherit"}}>
            Show all {filtered.length} words
          </button>
        )}
        {!isPro&&(
          <div style={{backgroundColor:"#fff",borderRadius:16,padding:"18px",border:"1.5px solid #F59E0B",marginTop:8,textAlign:"center"}}>
            <p style={{margin:"0 0 4px",fontSize:15,fontWeight:800,color:"#1A1A1A"}}>Unlock more words</p>
            <p style={{margin:"0 0 14px",fontSize:13,color:"#888"}}>A2, B1 and B2 levels with Pro</p>
            <button style={{border:"none",borderRadius:14,padding:"12px 28px",backgroundColor:"#19A85A",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 3px 0 #0E7A40"}} onClick={onUpgrade}>Upgrade to Pro</button>
          </div>
        )}
        <ResetButton/>
      </div>
    </div>
  );
}
function PaywallScreen(props){
  var onSubscribe=props.onSubscribe,onContinueFree=props.onContinueFree,onStart=props.onStart,onTrial=props.onTrial,trialAvailable=props.trialAvailable,trialDays=props.trialDays||7;
  var _s0=useState("annual");var sel=_s0[0];var setSel=_s0[1];
  var plans={
    annual:{price:"$29.99",period:"/year",perMonth:"$2.50/mo",save:"Save 50%"},
    monthly:{price:"$4.99",period:"/month",perMonth:null,save:null}
  };
  var features=[
    {label:"Full A1 plus A2, B1 and B2 levels",sub:"500+ more words across all topics and levels"},
    {label:"Retry Missed Words",sub:"Drill your weakest words until they stick"},
    {label:"Cumulative mode",sub:"Mix lower levels into any session"},
    {label:"All levels SRS tracking",sub:"Word memory across A2, B1 and B2 words too"},
    {label:"No ads, ever",sub:"Clean focused learning with no interruptions"},
  ];
  return(
    <div style={{maxWidth:420,margin:"0 auto",backgroundColor:"#F8F7F5",minHeight:"100vh",display:"flex",flexDirection:"column",animation:"fadeIn 0.2s ease"}}>
      <div style={{background:"linear-gradient(160deg,#064E3B 0%,#065F46 30%,#19A85A 100%)",padding:"36px 24px 0",textAlign:"center",flexShrink:0,position:"relative"}}>
        <button onClick={onContinueFree} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:16,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>x</button>
        <Logo size={44}/>
        <h1 style={{margin:"14px 0 4px",fontSize:30,fontWeight:900,color:"#fff",letterSpacing:-0.8,lineHeight:1.1}}>Ikasi Pro</h1>
        <p style={{margin:"0 0 0",fontSize:14,color:"rgba(255,255,255,0.85)",fontWeight:500}}>Unlock the full Basque experience</p><div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:12,flexWrap:"wrap"}}>
          {["596 words","14 topics","A1 to B2","Spaced repetition"].map(function(s){return(
            <span key={s} style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.9)",backgroundColor:"rgba(255,255,255,0.15)",padding:"4px 10px",borderRadius:20}}>{s}</span>
          );})}
        </div>
        
        <svg viewBox="0 0 420 40" style={{display:"block",width:"calc(100% + 48px)",height:32,marginTop:20,marginLeft:-24}} preserveAspectRatio="none">
          <path d="M0,20 C80,40 200,0 300,25 C370,40 400,15 420,20 L420,40 L0,40 Z" fill="#F6F6F6"/>
        </svg>
      </div>
      <div style={{flex:1,padding:"4px 20px calc(40px + env(safe-area-inset-bottom, 0px))",overflowY:"auto"}}>
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          {Object.keys(plans).map(function(key){var p=plans[key];var active=sel===key;var k=key;return(
            <button key={key} onClick={function(){setSel(k);}} style={{flex:1,padding:key==="annual"?"20px 12px":"14px 12px",borderRadius:18,border:"2px solid",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.15s",borderColor:active?"#19A85A":"#E8E8E8",backgroundColor:active?"#F0FBF4":"#fff",boxShadow:active?"0 0 0 3px rgba(25,168,90,0.15)":"none"}}>
              {p.save&&<span style={{fontSize:10,fontWeight:800,color:"#fff",backgroundColor:"#19A85A",padding:"3px 10px",borderRadius:20,display:"block",marginBottom:8,letterSpacing:0.3}}>{p.save} - Most popular</span>}
              <p style={{margin:"0 0 2px",fontSize:22,fontWeight:900,color:active?"#19A85A":"#1A1A1A"}}>{p.price}</p>
              <p style={{margin:"0 0 4px",fontSize:12,color:"#888",fontWeight:600}}>{p.period}</p>
              {p.perMonth&&<p style={{margin:0,fontSize:11,color:"#19A85A",fontWeight:700}}>{p.perMonth}</p>}
            </button>
          );})}
        </div>
        <div style={{backgroundColor:"#fff",borderRadius:18,border:"1px solid #E8E8E8",marginBottom:20,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
          {features.map(function(f,i){return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderBottom:i<features.length-1?"1px solid #F4F4F4":"none"}}>
              <span style={{fontSize:13,fontWeight:900,color:"#fff",backgroundColor:"#19A85A",width:20,height:20,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>v</span>
              <div>
                <p style={{margin:0,fontSize:14,fontWeight:700,color:"#1A1A1A"}}>{f.label}</p>
                <p style={{margin:0,fontSize:12,color:"#888",fontWeight:500}}>{f.sub}</p>
              </div>
            </div>
          );})}
        </div>
        {trialAvailable&&(
          <button style={{width:"100%",border:"none",borderRadius:18,padding:"17px",fontSize:17,fontWeight:900,color:"#fff",cursor:"pointer",backgroundColor:"#19A85A",boxShadow:"0 5px 0 #0E7A40",fontFamily:"inherit",marginBottom:10}} onClick={onTrial}>
            Try Pro free for {trialDays} days
          </button>
        )}
        <button style={{width:"100%",border:"none",borderRadius:18,padding:trialAvailable?"13px":"17px",fontSize:trialAvailable?14:17,fontWeight:900,color:trialAvailable?"#fff":"#fff",cursor:"pointer",backgroundColor:trialAvailable?"#0E7A40":"#19A85A",boxShadow:trialAvailable?"0 3px 0 #0A5C30":"0 5px 0 #0E7A40",fontFamily:"inherit",marginBottom:12,opacity:trialAvailable?0.85:1}} onClick={onStart}>
          {trialAvailable?"Then ":""}Subscribe - {plans[sel].price}{plans[sel].period}
        </button>
        <button style={{width:"100%",backgroundColor:"transparent",border:"none",color:"#888",fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:"10px",fontWeight:500}} onClick={onContinueFree}>
          Continue with free A1 words
        </button>
        <button style={{width:"100%",backgroundColor:"transparent",border:"none",color:"#BBB",fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:"6px"}} onClick={onSubscribe}>
          Restore purchases
        </button>
        <p style={{textAlign:"center",fontSize:11,color:"#BBB",margin:"8px 0 0",lineHeight:1.5}}>
          49 words always free. Pro unlocks everything - cancel anytime.
        </p>
        <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:16}}>
          <a href="https://ikasiandgo.com/privacy" target="_blank" style={{fontSize:11,color:"#CCC",textDecoration:"none",fontFamily:"inherit"}}>Privacy Policy</a>
          <a href="https://ikasiandgo.com/terms" target="_blank" style={{fontSize:11,color:"#CCC",textDecoration:"none",fontFamily:"inherit"}}>Terms of Use</a>
          <span style={{fontSize:11,color:"#DDD"}}>v{VERSION}</span>
        </div>
      </div>
    </div>
  );
}
export default App;
