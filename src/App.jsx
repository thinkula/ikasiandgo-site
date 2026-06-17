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
// ── Sound engine (Web Audio, no files, offline) ──
var _AC=null;          // shared AudioContext
var _SFX_ON=true;      // mute flag, synced from storage
function _ctx(){
  try{
    if(!_AC){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;_AC=new AC();}
    if(_AC.state==="suspended"){_AC.resume().catch(function(){});}
    return _AC;
  }catch(e){return null;}
}
// Play a single tone. freq in Hz, dur in seconds, type osc shape, vol 0-1, delay seconds
function _tone(freq,dur,type,vol,delay){
  var ctx=_ctx();if(!ctx)return;
  try{
    var t0=ctx.currentTime+(delay||0);
    var osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=type||"sine";
    osc.frequency.setValueAtTime(freq,t0);
    gain.gain.setValueAtTime(0,t0);
    gain.gain.linearRampToValueAtTime(vol||0.18,t0+0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(t0);osc.stop(t0+dur+0.02);
  }catch(e){}
}
// Slide a tone from f1 to f2 (for swoops)
function _slide(f1,f2,dur,type,vol,delay){
  var ctx=_ctx();if(!ctx)return;
  try{
    var t0=ctx.currentTime+(delay||0);
    var osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=type||"sine";
    osc.frequency.setValueAtTime(f1,t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1,f2),t0+dur);
    gain.gain.setValueAtTime(0,t0);
    gain.gain.linearRampToValueAtTime(vol||0.18,t0+0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(t0);osc.stop(t0+dur+0.02);
  }catch(e){}
}
function sfx(name){
  if(!_SFX_ON)return;
  try{
    if(name==="correct"){_tone(660,0.11,"sine",0.16,0);_tone(880,0.16,"sine",0.16,0.07);}
    else if(name==="wrong"){_tone(196,0.16,"sine",0.14,0);_tone(155,0.2,"sine",0.13,0.07);}
    else if(name==="tap"){_tone(520,0.05,"sine",0.09,0);}
    else if(name==="flip"){_tone(440,0.06,"triangle",0.1,0);}
    else if(name==="streak"){_tone(660,0.09,"sine",0.15,0);_tone(880,0.09,"sine",0.15,0.06);_tone(1175,0.16,"sine",0.16,0.12);}
    else if(name==="complete"){_tone(523,0.12,"sine",0.16,0);_tone(659,0.12,"sine",0.16,0.1);_tone(784,0.12,"sine",0.16,0.2);_tone(1047,0.28,"sine",0.18,0.3);}
    else if(name==="fail"){_slide(330,110,0.5,"sawtooth",0.12,0);}
    else if(name==="life"){_tone(294,0.14,"triangle",0.13,0);}
    else if(name==="start"){_tone(440,0.08,"sine",0.13,0);_tone(587,0.14,"sine",0.14,0.08);}
  }catch(e){}
}
function setSfxOn(on){_SFX_ON=!!on;try{window.storage.set("sfx_on",on?"1":"0").catch(function(){});}catch(e){}}
function getSfxOn(){return _SFX_ON;}
if(!window.storage){window.storage={get:function(k){return Promise.resolve(localStorage.getItem(k)?{key:k,value:localStorage.getItem(k)}:null);},set:function(k,v){try{localStorage.setItem(k,v);return Promise.resolve({key:k,value:v});}catch(e){return Promise.resolve(null);}},delete:function(k){localStorage.removeItem(k);return Promise.resolve({key:k,deleted:true});},list:function(prefix){var keys=Object.keys(localStorage).filter(function(k){return !prefix||k.startsWith(prefix);});return Promise.resolve({keys:keys});}};}
// Load mute preference at startup (after storage polyfill is guaranteed)
try{window.storage.get("sfx_on").then(function(r){if(r&&r.value==="0")_SFX_ON=false;}).catch(function(){});}catch(e){}
const STYLE=document.createElement("style");STYLE.textContent=":root{--sat:env(safe-area-inset-top,44px);}@font-face{font-family:'Nunito';font-style:normal;font-weight:400 900;font-display:swap;src:url('fonts/Nunito.woff2') format('woff2');}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}body{margin:0;background:#F6F6F6;font-family:Nunito,-apple-system,BlinkMacSystemFont,'SF Pro Rounded',sans-serif;}input,textarea{font-size:16px!important;}@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1;}100%{transform:translateY(100vh) rotate(720deg);opacity:0;}}@keyframes popIn{0%{transform:scale(0.5);opacity:0;}70%{transform:scale(1.1);}100%{transform:scale(1);opacity:1;}}@keyframes slideUp{0%{transform:translateY(12px);opacity:0;}100%{transform:translateY(0);opacity:1;}}@keyframes fadeIn{0%{opacity:0;transform:translateY(6px);}100%{opacity:1;transform:translateY(0);}}button:active{transform:scale(0.97)!important;opacity:0.9!important;}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}@keyframes cardIn{from{opacity:0;transform:scale(0.85) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes waitingPulse{0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0.4)}50%{box-shadow:0 0 0 6px rgba(249,115,22,0)}}@keyframes waitingDot{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes correctPop{0%{transform:scale(0.7);opacity:0}50%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}@keyframes badgeBounce{0%{transform:scale(0) rotate(-12deg);opacity:0}60%{transform:scale(1.2) rotate(4deg)}100%{transform:scale(1) rotate(0);opacity:1}}@keyframes correctGlow{0%{box-shadow:0 0 0 0 rgba(25,168,90,0)}40%{box-shadow:0 0 0 5px rgba(25,168,90,0.18)}100%{box-shadow:0 0 0 0 rgba(25,168,90,0)}}@keyframes wrongGlow{0%{box-shadow:0 0 0 0 rgba(239,68,68,0)}40%{box-shadow:0 0 0 5px rgba(239,68,68,0.18)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}}@keyframes streakPop{0%{transform:scale(0) translateY(8px);opacity:0}55%{transform:scale(1.25) translateY(0)}100%{transform:scale(1);opacity:1}}@keyframes risePop{0%{transform:translateY(14px) scale(0.9);opacity:0}60%{transform:translateY(-3px) scale(1.04)}100%{transform:translateY(0) scale(1);opacity:1}}@keyframes sparkle{0%{transform:scale(0) rotate(0);opacity:0}50%{transform:scale(1.3) rotate(180deg);opacity:1}100%{transform:scale(0) rotate(360deg);opacity:0}}";var VP=document.querySelector('meta[name=viewport]');if(VP)VP.content="width=device-width,initial-scale=1,viewport-fit=cover";else{var VM=document.createElement("meta");VM.name="viewport";VM.content="width=device-width,initial-scale=1,viewport-fit=cover";document.head.appendChild(VM);};document.head.appendChild(STYLE);
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
  {id:"eskerrik_asko",basque:"Eskerrik asko",english:"Thank you",cefr:"A1",topic:"greetings",pronunciation:"es-KER-ik AS-ko",notes:"Eskerrik asko = many thanks. Esker = thanks + -rik (partitive suffix) + asko = much/many. The partitive -rik expresses an indefinite quantity of thanks. A beautiful construction: indefinitely many thanks.",example:{basque:"Eskerrik asko laguntzeagatik.",english:"Thank you for helping."}},
  {id:"mesedez",basque:"Mesedez",english:"Please",cefr:"A1",topic:"greetings",pronunciation:"meh-SEH-dez",notes:"Mesedez comes from Spanish por favor. Common in both formal requests and everyday politeness.",example:{basque:"Mesedez ekarri ura.",english:"Please bring water."}},
  {id:"barkatu",basque:"Barkatu",english:"Sorry / Excuse me",cefr:"A1",topic:"greetings",pronunciation:"bar-KAH-too",notes:"Barkatu = sorry or excuse me. Used both for apologies (Barkatu, oker nengoen = Sorry, I was wrong) and to get attention (Barkatu, non dago...? = Excuse me, where is...?). From Spanish perdonar via barka.",example:{basque:"Barkatu non dago trena?",english:"Excuse me where is the train?"}},
  {id:"zer_moduz",basque:"Zer moduz?",english:"How are you?",cefr:"A1",topic:"greetings",pronunciation:"ZER MO-dooz",notes:"Zer moduz? = How are you? (literally how is the manner?). The standard everyday greeting after kaixo. Zer moduz zaude? is a slightly more emphatic form. Ondo = fine. Primeran = great. Txarto = badly.",example:{basque:"Kaixo! Zer moduz?",english:"Hello! How are you?"}},
  {id:"ondo",basque:"Ondo",english:"Fine / Well",cefr:"A1",topic:"greetings",pronunciation:"ON-do",notes:"Ondo = well or fine (adverb, not adjective). Ondo nago = I am well. Ondo egin = to do well. Ondo etorri = welcome (come well). Ongi = also means well (slightly more formal). Opposite: gaizki (badly).",example:{basque:"Ondo nago eskerrik asko.",english:"I am fine thank you."}},
  {id:"egun_on",basque:"Egun on",english:"Good morning",cefr:"A1",topic:"greetings",pronunciation:"EH-goon ON",notes:"Egun on literally means good day. Egun = day (same root as eguna). Used until around noon.",example:{basque:"Egun on, zer moduz zaude?",english:"Good morning, how are you?"}},
  {id:"gabon",basque:"Gabon",english:"Good night",cefr:"A1",topic:"greetings",pronunciation:"gah-BON",notes:"Gabon = good night (said when parting for the evening or bed). Also the Basque word for Christmas! Eguberri is another word for Christmas. Do not confuse with Gau on (good evening, used as a greeting when arriving somewhere).",example:{basque:"Gabon lagun.",english:"Good night friend."}},
  {id:"gau_on",basque:"Gau on",english:"Good evening",cefr:"A1",topic:"greetings",pronunciation:"GOW ON",notes:"Good evening. Gau (night) + on (good). Used when meeting someone in the evening, before the night begins. Gabon means good night (when parting for sleep) and also Christmas. Gau on is unambiguous for good evening.",example:{basque:"Gau on denoi.",english:"Good evening everyone."}},
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
  {id:"lau",basque:"Lau",english:"Four",cefr:"A1",topic:"numbers",pronunciation:"LOW (rhymes with now)",notes:"Lau sounds like the English word low. Four floors down = lau solairutan behera.",example:{basque:"Lau urteko umea.",english:"A four year old child."}},
  {id:"bost",basque:"Bost",english:"Five",cefr:"A1",topic:"numbers",pronunciation:"BOST",notes:"Bost is one of the most distinct Basque numbers - no relation to any other language.",example:{basque:"Bost minutu.",english:"Five minutes."}},
  {id:"sei",basque:"Sei",english:"Six",cefr:"A1",topic:"numbers",pronunciation:"SAY",notes:"Sei = six. Seina = six each. Seigarrena = sixth. Basque numbers: bat=1, bi=2, hiru=3, lau=4, bost=5, sei=6. Sei sounds like English \"say\" - helpful memory aid.",example:{basque:"Sei ordu.",english:"Six hours."}},
  {id:"zazpi",basque:"Zazpi",english:"Seven",cefr:"A1",topic:"numbers",pronunciation:"ZAZ-pee",notes:"Zazpi - the double z is pronounced like English th (voiced). Practice: THATH-pee.",example:{basque:"Zazpi egun.",english:"Seven days."}},
  {id:"zortzi",basque:"Zortzi",english:"Eight",cefr:"A1",topic:"numbers",pronunciation:"ZOR-tsee",notes:"Zortzi contains the suffix -tzi which appears in 18 (hamazortzi) too. Pattern: learn it once.",example:{basque:"Zortzi ordu lo egin.",english:"Sleep eight hours."}},
  {id:"bederatzi",basque:"Bederatzi",english:"Nine",cefr:"A1",topic:"numbers",pronunciation:"beh-deh-RAT-see",notes:"Bederatzi is the longest single-digit number in Basque. Break it: beder + atzi.",example:{basque:"Bederatzi euro.",english:"Nine euros."}},
  {id:"hamar",basque:"Hamar",english:"Ten",cefr:"A1",topic:"numbers",pronunciation:"hah-MAR",notes:"Hamar = 10. Basque counts in 20s: hogei=20, hogeita hamar=30 (twenty and ten).",example:{basque:"Hamar urte.",english:"Ten years."}},
  {id:"hogei",basque:"Hogei",english:"Twenty",cefr:"A1",topic:"numbers",pronunciation:"HOH-gay",notes:"Hogei = 20. The base of the Basque vigesimal counting system. All round numbers are multiples of hogei: berrogei=40, hirurogei=60, laurogei=80. Hogeiren bat = about twenty. Hogei urte = twenty years.",example:{basque:"Hogei lagun.",english:"Twenty people."}},
  {id:"ehun",basque:"Ehun",english:"One hundred",cefr:"A1",topic:"numbers",pronunciation:"EH-hoon",notes:"Ehun = 100. Ehun eta bat = 101. Bi ehun = 200. Note: Basque uses base-20 so 400 is hogei ehun (twenty hundreds).",example:{basque:"Ehun euro.",english:"One hundred euros."}},
  {id:"mila",basque:"Mila",english:"One thousand",cefr:"A1",topic:"numbers",pronunciation:"MEE-lah",notes:"Mila = one thousand. Mila esker = a thousand thanks. Mila bider = a thousand times. Milioika = millions (of). Mila is also used as an intensifier: mila aldiz = countless times. Bi mila = 2000.",example:{basque:"Mila esker.",english:"A thousand thanks."}},
  {id:"ama",basque:"Ama",english:"Mother",cefr:"A1",topic:"family",pronunciation:"AH-mah",notes:"Ama is also used as a suffix: Euskal Ama = Mother Basque. Very commonly used in songs and poetry.",example:{basque:"Nire ama medikua da.",english:"My mother is a doctor."}},
  {id:"aita",basque:"Aita",english:"Father",cefr:"A1",topic:"family",pronunciation:"AI-tah",notes:"Aita is also used in religious contexts. Aita Gurea = Our Father (the Lords Prayer in Basque).",example:{basque:"Nire aita Bilbon bizi da.",english:"My father lives in Bilbo."}},
  {id:"anaia",basque:"Anaia",english:"Brother",cefr:"A1",topic:"family",pronunciation:"ah-NAI-ah",notes:"Anaia = brother (used by both men and women). Note: in some dialects women use neba for brother and anaia only for a female speaker's male sibling. Basque has distinct sibling terms by speaker gender.",example:{basque:"Anaia gaztea da.",english:"The brother is young."}},
  {id:"ahizpa",basque:"Ahizpa",english:"Sister",cefr:"A1",topic:"family",pronunciation:"ah-EETH-pah",notes:"Ahizpa = sister as used by a female speaker. A male speaker uses arreba for his sister. Basque uniquely distinguishes sibling terms by the gender of the speaker, not the sibling.",example:{basque:"Nire ahizpa eta anaia Donostian bizi dira.",english:"My sister and brother live in Donostia."}},
  {id:"semea",basque:"Semea",english:"Son",cefr:"A1",topic:"family",pronunciation:"SEH-meh-ah",notes:"The -a at the end is the definite article. Seme = son (indefinite), semea = the son.",example:{basque:"Semea eskolan dago.",english:"The son is at school."}},
  {id:"alaba",basque:"Alaba",english:"Daughter",cefr:"A1",topic:"family",pronunciation:"ah-LAH-bah",notes:"Alaba is also a province in the Basque Country (spelled Araba in Basque).",example:{basque:"Alaba etxean dago.",english:"The daughter is at home."}},
  {id:"amona",basque:"Amona",english:"Grandmother",cefr:"A1",topic:"family",pronunciation:"ah-MOH-nah",notes:"Amona combines ama (mother) + ona (good). Literally good mother - a lovely construction.",example:{basque:"Amona zaharra da.",english:"The grandmother is old."}},
  {id:"aitona",basque:"Aitona",english:"Grandfather",cefr:"A1",topic:"family",pronunciation:"ai-TOH-nah",notes:"Aitona combines aita (father) + ona (good). Literally good father.",example:{basque:"Aitona mendian dago.",english:"The grandfather is on the mountain."}},
  {id:"familia",basque:"Familia",english:"Family",cefr:"A1",topic:"family",pronunciation:"fah-MEE-lee-ah",notes:"Familia comes from Latin/Spanish. The more traditional Basque word for family is etxea (house/home) - reflecting how family centred on the household.",example:{basque:"Familia handia dut.",english:"I have a big family."}},
  {id:"laguna",basque:"Laguna",english:"Friend",cefr:"A1",topic:"family",pronunciation:"lah-GOON-ah",notes:"Laguna = close friend or companion. Adiskidea is also used for friend. Lagunartea = circle of friends. Lagundu = to help or accompany (same root). Nire laguna = my friend.",example:{basque:"Laguna etorri da.",english:"The friend has come."}},
  {id:"osaba",basque:"Osaba",english:"Uncle",cefr:"A1",topic:"family",pronunciation:"oh-SAH-bah",notes:"Osaba = uncle. Izeba = aunt. These are the same word in many languages but Basque distinguishes them clearly.",example:{basque:"Osaba adeitsua da.",english:"The uncle is friendly."}},
  {id:"izeba",basque:"Izeba",english:"Aunt",cefr:"A1",topic:"family",pronunciation:"ee-ZEH-bah",notes:"Izeba = aunt (mothers or fathers sister). Do not confuse with osaba (uncle). Both are important in tight-knit Basque families.",example:{basque:"Izeba bizkorra da.",english:"The aunt is clever."}},
  {id:"gorria",basque:"Gorria",english:"Red",cefr:"A1",topic:"colors",pronunciation:"GOR-ree-ah",notes:"All Basque colors end in -a (the definite article). Gorri = red, gorria = the red one.",example:{basque:"Sagarra gorria da.",english:"The apple is red."}},
  {id:"urdina",basque:"Urdina",english:"Blue",cefr:"A1",topic:"colors",pronunciation:"oor-DEE-nah",notes:"Urdina is also used for green in some dialects. The sea (itsasoa) is described as urdina in poetry.",example:{basque:"Zerua urdina da.",english:"The sky is blue."}},
  {id:"berdea",basque:"Berdea",english:"Green",cefr:"A1",topic:"colors",pronunciation:"BER-deh-ah",notes:"Berde comes from Latin viridis. Also used for traffic lights: berdea = go!",example:{basque:"Belarra berdea da.",english:"The grass is green."}},
  {id:"zuria",basque:"Zuria",english:"White",cefr:"A1",topic:"colors",pronunciation:"ZOO-ree-ah",notes:"Zuri also means clean or pure. Ardi zuria = white sheep - a common Basque image.",example:{basque:"Elurra zuria da.",english:"The snow is white."}},
  {id:"beltza",basque:"Beltza",english:"Black",cefr:"A1",topic:"colors",pronunciation:"BEL-tsah",notes:"Beltza is also a surname. The Basque flag (ikurrina) uses red, green and white - no black.",example:{basque:"Gaua beltza da.",english:"The night is black."}},
  {id:"horia",basque:"Horia",english:"Yellow",cefr:"A1",topic:"colors",pronunciation:"HOR-ree-ah",notes:"Hori also means that in Basque (hori da = that is it). Context makes the difference.",example:{basque:"Eguzkia horia da.",english:"The sun is yellow."}},
  {id:"laranja",basque:"Laranja",english:"Orange",cefr:"A1",topic:"colors",pronunciation:"lah-RAN-yah",notes:"Same word as the fruit. Laranja comes from Arabic naranj via Spanish naranja.",example:{basque:"Laranjak fruta goxoak dira.",english:"Oranges are tasty fruit."}},
  {id:"morea",basque:"Morea",english:"Purple",cefr:"A1",topic:"colors",pronunciation:"moh-REH-ah",notes:"Morea comes from Spanish morado. Also used for bruises - kolpe morea = a bruise.",example:{basque:"Lorea morea da.",english:"The flower is purple."}},
  {id:"arrosa",basque:"Arrosa",english:"Pink",cefr:"A1",topic:"colors",pronunciation:"ar-ROH-sah",notes:"Arrosa also means rose (the flower). A lovely double meaning - the color named after the flower. Arrosa bat = a rose.",example:{basque:"Kamiseta arrosa daramat.",english:"I am wearing a pink shirt."}},
  {id:"mendia",basque:"Mendia",english:"Mountain",cefr:"A1",topic:"nature",pronunciation:"MEN-dee-ah",notes:"Mendia is everywhere in Basque culture - the word Basque itself may derive from a root meaning mountains.",example:{basque:"Mendia ederra da.",english:"The mountain is beautiful."}},
  {id:"itsasoa",basque:"Itsasoa",english:"Sea / Ocean",cefr:"A1",topic:"nature",pronunciation:"it-SAH-soh-ah",notes:"Basques have been master sailors for centuries. They fished cod in Newfoundland before Columbus arrived.",example:{basque:"Itsasoa handia da.",english:"The sea is vast."}},
  {id:"ibaia",basque:"Ibaia",english:"River",cefr:"A1",topic:"nature",pronunciation:"ee-BAI-ah",notes:"Ibaia is the river - critical in Basque geography. Bilbo (Bilbao) sits on the Ibaizabal river. Ibarra = valley (literally river-land).",example:{basque:"Ibaia luzea da.",english:"The river is long."}},
  {id:"euria",basque:"Euria",english:"Rain",cefr:"A1",topic:"nature",pronunciation:"EH-ree-ah",notes:"The Basque Country (especially Bilbo (Bilbao)) is famous for rain. Euria egiten du = it is raining (literally rain does).",example:{basque:"Euria egiten du.",english:"It is raining."}},
  {id:"eguzkia",basque:"Eguzkia",english:"Sun",cefr:"A1",topic:"nature",pronunciation:"eh-GOOS-kee-ah",notes:"Eguzkia = the sun. Etymology debated - possibly from egun (day) + -zki, or possibly pre-Indo-European with no known root. The Basque sun deity was also called Eguzki - a female deity, unlike most solar gods.",example:{basque:"Euria gelditu da eta eguzkia ateratzen da.",english:"The rain stopped and the sun is coming out."}},
  {id:"elurra",basque:"Elurra",english:"Snow",cefr:"A1",topic:"nature",pronunciation:"eh-LOOR-rah",notes:"Elurra is important in Basque Country - the Pyrenees get heavy snow. Elurra egiten du = it is snowing.",example:{basque:"Elurra ederra da.",english:"The snow is beautiful."}},
  {id:"basoa",basque:"Basoa",english:"Forest",cefr:"A1",topic:"nature",pronunciation:"BAH-soh-ah",notes:"Basoa means forest or wild. Basa-jaun (lord of the forest) is a famous Basque mythological figure - possibly the origin of the Basque surname Basajuan.",example:{basque:"Basoa handia da.",english:"The forest is large."}},
  {id:"haizea",basque:"Haizea",english:"Wind",cefr:"A1",topic:"nature",pronunciation:"hai-ZEH-ah",notes:"Haizea = the wind. Haize = wind (root). Haizearen = of the wind. The Basque Country coast is famous for strong Atlantic winds.",example:{basque:"Haizea gogorra da.",english:"The wind is strong."}},
  {id:"lurra",basque:"Lurra",english:"Earth / Ground",cefr:"A1",topic:"nature",pronunciation:"LOOR-rah",notes:"Lurra = the earth or ground. Lur = earth (root). Lurra jo = to hit the ground/fall. Lurra jan = to eat dirt (to fail badly).",example:{basque:"Lurra bustia dago.",english:"The ground is wet."}},
  {id:"zuhaitza",basque:"Zuhaitza",english:"Tree",cefr:"A1",topic:"nature",pronunciation:"soo-HAI-tsah",notes:"Zuhaitza = tree. Zuhaitz = tree (root). The Gernikako Arbola (Tree of Gernika) is a sacred oak - symbol of Basque democracy.",example:{basque:"Zuhaitza altua da.",english:"The tree is tall."}},
  {id:"lorea",basque:"Lorea",english:"Flower",cefr:"A1",topic:"nature",pronunciation:"LOH-reh-ah",notes:"Lorea = flower. Lore = flower (root). Lorategia = garden (flower-place). Loredun = flowery. Common in place names.",example:{basque:"Lorea ederra da.",english:"The flower is beautiful."}},
  {id:"burua",basque:"Burua",english:"Head",cefr:"A1",topic:"body",pronunciation:"BOO-roo-ah",notes:"Buru also means mind or intelligence. Burutsua = clever (full of head). Buru onekoa = sensible.",example:{basque:"Burua min dut.",english:"My head hurts."}},
  {id:"eskua",basque:"Eskua",english:"Hand",cefr:"A1",topic:"body",pronunciation:"ES-koo-ah",notes:"Esku is the root. Eskua = the hand. Eskuak = hands. Eskubidea = right (literally hand-road)!",example:{basque:"Eskua garbi dago.",english:"The hand is clean."}},
  {id:"oina",basque:"Oina",english:"Foot",cefr:"A1",topic:"body",pronunciation:"OY-nah",notes:"Oina = foot (specifically the foot, not the leg). Hanka = leg or foot more generally. Oinez = on foot/walking. Oinazea = pain/suffering. Oinetakoak = shoes (foot-things).",example:{basque:"Oina min dut.",english:"My foot hurts."}},
  {id:"bihotza",basque:"Bihotza",english:"Heart",cefr:"A1",topic:"body",pronunciation:"bee-HOT-sah",notes:"Bihotz is used in many expressions. Bihotz oneko = kind-hearted. Bihotzez = heartfully/sincerely.",example:{basque:"Bihotza ona du.",english:"He has a good heart."}},
  {id:"ahoa",basque:"Ahoa",english:"Mouth",cefr:"A1",topic:"body",pronunciation:"AH-oh-ah",notes:"Ahoa = the mouth. Aho = mouth (root). Ahoa bete = a mouthful. Aho batez = unanimously (with one mouth). Ahoz = orally.",example:{basque:"Ahoa itxi.",english:"Close your mouth."}},
  {id:"sudurra",basque:"Sudurra",english:"Nose",cefr:"A1",topic:"body",pronunciation:"soo-DOOR-rah",notes:"Sudurra = the nose. Sudur = nose (root). Sudur-zapi = handkerchief (nose-cloth). Sudurra sartu = to poke your nose in (to meddle).",example:{basque:"Sudurra handia du.",english:"He has a big nose."}},
  {id:"belarria",basque:"Belarria",english:"Ear",cefr:"A1",topic:"body",pronunciation:"beh-LAR-ree-ah",notes:"Belarria = ear. Belarri = ear (root). Do not confuse with urtea (year) - similar sound! Belarria eman = to lend an ear.",example:{basque:"Belarria min dut.",english:"My ear hurts."}},
  {id:"gaur",basque:"Gaur",english:"Today",cefr:"A1",topic:"time",pronunciation:"GOWR",notes:"Gaur is often the first time word learners pick up. Gaur goizean = this morning. Gaur arratsaldean = this afternoon.",example:{basque:"Gaur eguraldia ona dago.",english:"Today the weather is good."}},
  {id:"bihar",basque:"Bihar",english:"Tomorrow",cefr:"A1",topic:"time",pronunciation:"BEE-har",notes:"Bihar also means need/necessity in some compound words. Biharko = for tomorrow.",example:{basque:"Bihar ikusiko dugu.",english:"We will see tomorrow."}},
  {id:"atzo",basque:"Atzo",english:"Yesterday",cefr:"A1",topic:"time",pronunciation:"AT-so",notes:"Atzo is one of the more distinctive Basque words. Atzo arratsaldean = yesterday afternoon.",example:{basque:"Atzo etorri zen.",english:"He came yesterday."}},
  {id:"orain",basque:"Orain",english:"Now",cefr:"A1",topic:"time",pronunciation:"OH-rain",notes:"Orain often appears in political slogans. Orain Euskara! = Basque now! is a common language rights phrase.",example:{basque:"Orain joango naiz.",english:"I will go now."}},
  {id:"gero",basque:"Gero",english:"Later / Then",cefr:"A1",topic:"time",pronunciation:"GEH-ro",notes:"Gero = later, then, or after. Gero eta gehiago = more and more. Eta gero? = And then? Gerora = for later. Lehenago = earlier. Geroago = later on. Uste gero = sooner or later.",example:{basque:"Gero hitz egingo dugu.",english:"We will talk later."}},
  {id:"hilabetea",basque:"Hilabetea",english:"Month",cefr:"A1",topic:"time",pronunciation:"hee-lah-BEH-teh-ah",notes:"Hilabetea = month. Hil = moon/death + bete = full. Literally a full moon cycle. Old Basque calendar was lunar.",example:{basque:"Hilabetea igaro da.",english:"A month has passed."}},
  {id:"urtea",basque:"Urtea",english:"Year",cefr:"A1",topic:"time",pronunciation:"OOR-teh-ah",notes:"Urtea = the year. Urte = year (root). Urteberri = New Year. Urtebete = one full year. Urtemuga = anniversary (year-limit).",example:{basque:"Urtea luzea da.",english:"The year is long."}},
  {id:"eguna",basque:"Eguna",english:"Day",cefr:"A1",topic:"time",pronunciation:"EH-goon-ah",notes:"Eguna = the day. Egun = day (root). Egunero = every day. Eguneroko = daily. Egunsentian = at dawn (day-birth).",example:{basque:"Eguna ederra da.",english:"The day is beautiful."}},
  {id:"gaua",basque:"Gaua",english:"Night",cefr:"A1",topic:"time",pronunciation:"GOW-ah",notes:"Gaua = the night. Gau = night (root). Gauean = at night. Gaueko = of the night. Gauerdia = midnight (night-half).",example:{basque:"Gaua luzea da.",english:"The night is long."}},
  {id:"etxea",basque:"Etxea",english:"Home / House",cefr:"A1",topic:"travel",pronunciation:"ET-cheh-ah",notes:"Etxea = house or home. In Basque culture the etxe (family homestead) is central to identity - Basque surnames often derive from the family house name. Etxera = home (going home). Etxean = at home. Baserria = farmhouse.",example:{basque:"Etxea ederra da.",english:"The house is beautiful."}},
  {id:"kalea",basque:"Kalea",english:"Street",cefr:"A1",topic:"travel",pronunciation:"KAH-leh-ah",notes:"Kalea = the street. Kale = street (root). Kalera = to the street. Kaletar = city-dweller. Bilbo (Bilbao)'s old town is full of narrow kaleak.",example:{basque:"Kalea luzea da.",english:"The street is long."}},
  {id:"hiria",basque:"Hiria",english:"City / Town",cefr:"A1",topic:"travel",pronunciation:"HEE-ree-ah",notes:"Hiria = city. Hiri = city (root). Hiritarra = city-dweller/urban. Hiriburua = capital city (city-head). Hiri handia = big city.",example:{basque:"Hiria handia da.",english:"The city is large."}},
  {id:"trena",basque:"Trena",english:"Train",cefr:"A1",topic:"travel",pronunciation:"TREH-nah",notes:"Trena = train. From Spanish tren. Euskotren is the Basque regional train network. Trena gelditzen da = the train stops.",example:{basque:"Trena berantzen da.",english:"The train is late."}},
  {id:"autobusa",basque:"Autobusa",english:"Bus",cefr:"A1",topic:"travel",pronunciation:"ow-toh-BOO-sah",notes:"Autobusa = bus. From Spanish autobús. Autobusera igo = to get on the bus. Pesa is the main Basque inter-city bus company.",example:{basque:"Autobusa etorri da.",english:"The bus has arrived."}},
  {id:"aireportua",basque:"Aireportua",english:"Airport",cefr:"A1",topic:"travel",pronunciation:"ai-reh-por-TOO-ah",notes:"Aireportua = airport. Aire = air + portu = port. Bilbo (Bilbao) airport is called Loiu. Donostia (San Sebastián) also has an airport.",example:{basque:"Aireportua urrun dago.",english:"The airport is far."}},
  {id:"ostatua",basque:"Ostatua",english:"Hotel",cefr:"A1",topic:"travel",pronunciation:"os-TAH-too-ah",notes:"Ostatua = hotel or inn. Ostat comes from old Basque meaning shelter. Also used for traditional rural guesthouses (casas rurales).",example:{basque:"Ostatua erosoa da.",english:"The hotel is comfortable."}},
  {id:"jatetxea",basque:"Jatetxea",english:"Restaurant",cefr:"A1",topic:"travel",pronunciation:"yah-TET-cheh-ah",notes:"Jatetxea = restaurant. Jan = to eat + etxe = house. Eating house! Basque restaurants (jatetxeak) are world-renowned for their cuisine.",example:{basque:"Jatetxea beteta dago.",english:"The restaurant is full."}},
  {id:"poza",basque:"Poza",english:"Joy / Happiness",cefr:"A1",topic:"emotions",pronunciation:"POH-sah",notes:"Poza = joy (noun). Pozik = happy (adjective). Poztu = to make happy. Zer poza! = What joy! One of the most positive Basque words.",example:{basque:"Poza sentitzen dut.",english:"I feel joy."}},
  {id:"tristura",basque:"Tristura",english:"Sadness",cefr:"A1",topic:"emotions",pronunciation:"tris-TOO-rah",notes:"Tristura is the noun form. Triste is the adjective (borrowed from Spanish/Latin). Tristura dut = I have sadness - note Basque uses have not am for emotions.",example:{basque:"Tristura dut.",english:"I have sadness."}},
  {id:"beldurra",basque:"Beldurra",english:"Fear",cefr:"A1",topic:"emotions",pronunciation:"bel-DOOR-rah",notes:"Beldurra dut = I am afraid (literally I have fear). Basque uses have (du) not be (naiz) for emotions. Beldurtu = to frighten.",example:{basque:"Beldurra dut.",english:"I am afraid."}},
  {id:"haserrea",basque:"Haserrea",english:"Anger",cefr:"A1",topic:"emotions",pronunciation:"hah-ser-REH-ah",notes:"Haserrea is the noun. Haserre is the adjective. Haserre nago = I am angry. Haserretu = to get angry. Very common emotional vocabulary.",example:{basque:"Haserrea sentitzen dut.",english:"I feel anger."}},
  {id:"lana",basque:"Lana",english:"Work / Job",cefr:"A1",topic:"work",pronunciation:"LAH-nah",notes:"Lana is one of the most common Basque words. Lan egin = to work. Langile = worker. Lantegia = factory/workplace.",example:{basque:"Lana gogorra da baina asebetetzea ematen du.",english:"Work is hard but it is rewarding."}},
  {id:"eskola",basque:"Eskola",english:"School",cefr:"A1",topic:"society",pronunciation:"es-KOH-lah",notes:"Eskola comes from Greek via Latin schola. Ikastola is the Basque-language school - a key institution in language revival.",example:{basque:"Eskola hurbil dago.",english:"The school is nearby."}},
  {id:"liburua",basque:"Liburua",english:"Book",cefr:"A1",topic:"culture",pronunciation:"lee-BOO-roo-ah",notes:"Liburua comes from Latin liber. Liburutegia = library (literally book-place). Books are central to Basque cultural identity.",example:{basque:"Liburua interesgarria da.",english:"The book is interesting."}},
  {id:"unibertsitatea",basque:"Unibertsitatea",english:"University",cefr:"A1",topic:"society",pronunciation:"oo-nee-ber-tsee-TAH-teh-ah",notes:"Unibertsitatea = university. The University of the Basque Country (UPV/EHU) has over 45,000 students and teaches in both Basque and Spanish.",example:{basque:"Unibertsitatea handia da.",english:"The university is large."}},
  {id:"euskara",basque:"Euskara",english:"Basque language",cefr:"A1",topic:"culture",pronunciation:"eus-KAH-rah",notes:"Euskara is the official name. The origin is mysterious - possibly from eus (hear/understand) + -kara (manner of).",example:{basque:"Euskara ederra da.",english:"Basque is beautiful."}},
  {id:"euskalduna",basque:"Euskalduna",english:"Basque speaker",cefr:"A1",topic:"culture",pronunciation:"eus-kal-DOON-ah",notes:"Euskalduna defines identity through language, not blood. Anyone who speaks Basque is Euskaldun.",example:{basque:"Euskalduna naiz.",english:"I am a Basque speaker."}},
  {id:"euskal_herria",basque:"Euskal Herria",english:"Basque Country",cefr:"A1",topic:"culture",pronunciation:"EUS-kal HER-ree-ah",notes:"Euskal Herria = the Basque Country. Literally the Basque people's land (Euskal = Basque + Herria = people/land). Encompasses 7 territories across Spain and France. More than a geographic term - a statement of identity.",example:{basque:"Euskal Herria ederra da.",english:"The Basque Country is beautiful."}},
  {id:"ona",basque:"Ona",english:"Good",cefr:"A1",topic:"adjectives",pronunciation:"OH-nah",notes:"Ona = good. Hobea = better. Onena = best. Ondo = well (adverb). Ongi etorri = welcome (come well). Essential adjective.",example:{basque:"Janaria ona da.",english:"The food is good."}},
  {id:"txarra",basque:"Txarra",english:"Bad",cefr:"A1",topic:"adjectives",pronunciation:"CHAR-rah",notes:"Txarra = bad. Txarrena = worst. Txarto = badly (adverb). Do not confuse with gaizki (badly/wrongly). Txar = bad (root).",example:{basque:"Eguraldia txarra da.",english:"The weather is bad."}},
  {id:"handia",basque:"Handia",english:"Big / Large",cefr:"A1",topic:"adjectives",pronunciation:"HAN-dee-ah",notes:"Handia is one of the most useful adjectives. Oso handia = very big. Handitu = to grow/enlarge. Handikeria = arrogance (being too big).",example:{basque:"Etxea handia da.",english:"The house is big."}},
  {id:"txikia",basque:"Txikia",english:"Small / Little",cefr:"A1",topic:"adjectives",pronunciation:"CHEE-kee-ah",notes:"Txikia is the opposite of handia. Txikitu = to shrink/reduce. Txikitatik = from childhood (from being small). Very common word.",example:{basque:"Katua txikia da.",english:"The cat is small."}},
  {id:"zaharra",basque:"Zaharra",english:"Old",cefr:"A1",topic:"adjectives",pronunciation:"sah-HAR-rah",notes:"Zaharra = old (for things and people). Zahartze = aging. Do not confuse with antzinateko (ancient). Zahar = elder/old person (respected term).",example:{basque:"Etxea zaharra da.",english:"The house is old."}},
  {id:"berria",basque:"Berria",english:"New",cefr:"A1",topic:"adjectives",pronunciation:"BER-ree-ah",notes:"Berria also means news! Berria is the name of the main Basque-language newspaper. Zer berri? = What is new? (What is the news?)",example:{basque:"Autoa berria da.",english:"The car is new."}},
  {id:"ederra",basque:"Ederra",english:"Beautiful",cefr:"A1",topic:"adjectives",pronunciation:"eh-DER-rah",notes:"Ederra is the standard word for beautiful. Eder = beauty (root). Edertasun = beauty. Bai ederra! = How beautiful! Common exclamation.",example:{basque:"Mendia ederra da.",english:"The mountain is beautiful."}},
  {id:"interesgarria",basque:"Interesgarria",english:"Interesting",cefr:"A2",topic:"adjectives",pronunciation:"in-teh-res-GAR-ree-ah",notes:"Interesgarria = literally interest-having. The suffix -garri means causing/having. Interesting: interesa + garri. Harrigarri = amazing.",example:{basque:"Liburua interesgarria da.",english:"The book is interesting."}},
  {id:"pozik",basque:"Pozik",english:"Happy",cefr:"A1",topic:"adjectives",pronunciation:"POH-seek",notes:"Pozik is the state of being happy. Poza = joy (noun). Poztu = to become happy. Oso pozik = very happy. Common everyday word.",example:{basque:"Pozik nago.",english:"I am happy."}},
  {id:"maite",basque:"Maite",english:"Love / Beloved",cefr:"A2",topic:"emotions",pronunciation:"MAI-teh",notes:"Maite = love/beloved. Maite zaitut = I love you (the most important phrase!). Maitea = beloved/sweetheart. Maite izatea = to love someone.",example:{basque:"Maite dut euskara.",english:"I love Basque."}},
  {id:"lasaia",basque:"Lasaia",english:"Calm",cefr:"A2",topic:"emotions",pronunciation:"lah-SAI-ah",notes:"Lasaia = calm. Lasaitu = to calm down. Lasai egon = stay calm. Lasaitasuna = calmness. Opposite of urduri (nervous).",example:{basque:"Lasaia nago.",english:"I am calm."}},
  {id:"haserre",basque:"Haserre",english:"Angry",cefr:"A2",topic:"emotions",pronunciation:"hah-SER-reh",notes:"Haserre = angry (adjective). Haserrea = anger (noun). Haserre nago = I am angry. Do not confuse with haserre (noun form).",example:{basque:"Haserre nago.",english:"I am angry."}},
  {id:"urduri",basque:"Urduri",english:"Nervous",cefr:"A2",topic:"emotions",pronunciation:"oor-DOO-ree",notes:"Urduri = nervous/anxious. Urduritu = to become nervous. Urduria = nervousness. Very useful for expressing anxiety.",example:{basque:"Urduri nago.",english:"I am nervous."}},
  {id:"harritu",basque:"Harritu",english:"Surprised",cefr:"A2",topic:"emotions",pronunciation:"har-REE-too",notes:"Harritu = to surprise or to be surprised (verb). Harrituta nago = I am surprised (literally I am astonished). Harrigarria = amazing/astonishing. Harri = stone - as if turned to stone with surprise.",example:{basque:"Harrituta nago.",english:"I am surprised."}},
  {id:"ilusioa",basque:"Ilusioa",english:"Excitement",cefr:"A2",topic:"emotions",pronunciation:"ee-loo-SEE-oh-ah",notes:"Ilusioa = excited anticipation or enthusiasm (from Spanish ilusión). FALSE FRIEND: does not mean illusion in English. Ilusioa daukat = I am excited/I am looking forward to it. Very common in everyday speech.",example:{basque:"Ilusioa daukat.",english:"I am excited."}},
  {id:"lotsa",basque:"Lotsa",english:"Shame / Embarrassment",cefr:"A2",topic:"emotions",pronunciation:"LOT-sah",notes:"Lotsa = shame or embarrassment. Lotsatu = to be embarrassed. Lotsagarria = shameful. Lotsagabea = shameless (without shame).",example:{basque:"Lotsa ematen dit.",english:"It embarrasses me."}},
  {id:"zer_berri",basque:"Zer berri?",english:"What is new?",cefr:"A2",topic:"greetings",pronunciation:"ZER BER-ree",notes:"Zer berri? = What is new? Berri = news/new. The same word means both. Berria = the news/something new.",example:{basque:"Zer berri? Dena ondo?",english:"What is new? All good?"}},
  {id:"mila_esker",basque:"Mila esker",english:"Many thanks",cefr:"A2",topic:"greetings",pronunciation:"MEE-lah ES-ker",notes:"Mila esker = a thousand thanks. Mila = thousand. Much more emphatic than eskerrik asko. Used for genuine gratitude.",example:{basque:"Mila esker zure laguntzagatik.",english:"Many thanks for your help."}},
  {id:"saltsa",basque:"Saltsa",english:"Sauce",cefr:"A2",topic:"food",pronunciation:"SAL-tsah",notes:"Saltsa = sauce. Basque sauces are legendary: salsa verde (green sauce with parsley), pil-pil (emulsified cod sauce), bizkaina. From Spanish salsa.",example:{basque:"Saltsa goxoa da.",english:"The sauce is tasty."}},
  {id:"txakolina",basque:"Txakolina",english:"Txakoli wine",cefr:"A2",topic:"food",pronunciation:"chah-koh-LEE-nah",notes:"Txakolina = txakoli wine. A light, slightly sparkling, very dry white wine made from unripe grapes. Poured from height to aerate it. Produced in Gipuzkoa, Bizkaia and Araba. Perfect with pintxos.",example:{basque:"Txakolina freskoa da.",english:"The txakoli is fresh."}},
  {id:"bacalaoa",basque:"Bakailaoa",english:"Salted cod",cefr:"A2",topic:"food",pronunciation:"bah-kah-LAH-oh-ah",notes:"Bakailaoa = salted cod, the cornerstone of Basque cuisine. Pil-pil sauce, al pil-pil, bakailao a la vizcaina - all famous dishes. Euskara Batua spelling is bakailaoa, from Spanish bakailao.",example:{basque:"Bakailaoa ohikoa da.",english:"Salted cod is traditional."}},
  {id:"goxoa",basque:"Goxoa",english:"Tasty / Sweet",cefr:"A2",topic:"food",pronunciation:"goh-SHOH-ah",notes:"Goxoa = delicious or sweet. The x sounds like sh (go-SHO-ah). Goxoki = candy/sweet. Goxotasuna = sweetness. Oso goxoa! = So delicious! Used constantly in Basque food culture.",example:{basque:"Tarta goxoa da.",english:"The cake is delicious."}},
  {id:"musika",basque:"Musika",english:"Music",cefr:"A2",topic:"culture",pronunciation:"MOO-see-kah",notes:"Musika = music. Musikaria = musician. Musikal = musical. Basque traditional music uses the txalaparta (wooden percussion) and trikitixa (accordion).",example:{basque:"Musika entzutea gustatzen zait.",english:"I like listening to music."}},
  {id:"dantza",basque:"Dantza",english:"Dance",cefr:"A2",topic:"culture",pronunciation:"DAN-tsah",notes:"Dantza = dance. Dantzaria = dancer. Aurresku is the most famous traditional Basque dance - performed at festivals and weddings.",example:{basque:"Dantza egiten dut.",english:"I dance."}},
  {id:"festa",basque:"Festa",english:"Festival / Party",cefr:"A2",topic:"culture",pronunciation:"FES-tah",notes:"Festa = festival or party. Every Basque town has its annual festak. The most famous is San Fermin in Iruña (Iruña (Pamplona)) with the running of the bulls. Aste Nagusia in Bilbo (Bilbao) is another huge celebration.",example:{basque:"Urtero festa handia egiten dugu herrian.",english:"Every year we hold a big festival in town."}},
  {id:"pilota",basque:"Pilota",english:"Pelota / Jai alai",cefr:"A2",topic:"culture",pronunciation:"pee-LOH-tah",notes:"Pilota = pelota or jai alai. One of the fastest ball sports in the world. Pilotaria = player. Frontoia = court. Played with bare hand, bat or basket.",example:{basque:"Pilota jokatzen dut.",english:"I play pelota."}},
  {id:"bertsoa",basque:"Bertsoa",english:"Improvised verse",cefr:"A2",topic:"culture",pronunciation:"ber-TSOH-ah",notes:"Improvised sung verse in strict metre and rhyme. Bertsolaritza is the art of improvising these verses - competitions (txapelketak) fill sports arenas. A living oral tradition unique to Basque culture.",example:{basque:"Bertsoa ederra da.",english:"The verse is beautiful."}},
  {id:"sukaldaritza",basque:"Sukaldaritza",english:"Cuisine",cefr:"B1",topic:"culture",pronunciation:"soo-kal-dah-REET-sah",notes:"Sukaldaritza = cuisine or the art of cooking. Sukaldaria = chef. Sukaldea = kitchen. Basque cuisine is world-renowned with more Michelin stars per capita than anywhere on earth. Arzak, Berasategui, and Mugaritz lead globally.",example:{basque:"Sukaldaritza bikaina da.",english:"The cuisine is excellent."}},
  {id:"txapela",basque:"Txapela",english:"Basque beret",cefr:"A2",topic:"culture",pronunciation:"chah-PEH-lah",notes:"The Basque beret - a symbol of cultural identity worn by men and women. Txapelketa = championship (literally beret-contest - the winner receives a txapela). Comes in many colors though black is traditional.",example:{basque:"Txapela janztea ohikoa da.",english:"Wearing the beret is traditional."}},
  {id:"errialdea",basque:"Errialdea",english:"Territory / Region",cefr:"B1",topic:"culture",pronunciation:"er-ree-AL-deh-ah",notes:"Errialdea = territory or region. Euskal Herria has 7 historical territories (herrialeak) - 4 in Spain, 3 in France.",example:{basque:"Errialdea ederra da.",english:"The region is beautiful."}},
  {id:"bidea",basque:"Bidea",english:"Road / Path",cefr:"A2",topic:"travel",pronunciation:"BEE-deh-ah",notes:"Bidea = path, way, road, or method/means. Bide eman = to allow/give way. Bidegabea = unjust (without a way). Autobidea = motorway. Burubidea = idea/concept (head-way).",example:{basque:"Bidea luzea da.",english:"The road is long."}},
  {id:"mapa",basque:"Mapa",english:"Map",cefr:"A2",topic:"travel",pronunciation:"MAH-pah",notes:"Mapa = map. From Spanish mapa. Euskal Herriko mapa = map of the Basque Country. Mapagilea = cartographer.",example:{basque:"Mapa behar dut.",english:"I need a map."}},
  {id:"geltokia",basque:"Geltokia",english:"Station",cefr:"A2",topic:"travel",pronunciation:"gel-TOH-kee-ah",notes:"Geltokia = station. Gelditu = to stop - so geltokia is literally the stopping place. Autobus geltokia = bus station.",example:{basque:"Geltokia hurbil dago.",english:"The station is nearby."}},
  {id:"kotxea",basque:"Kotxea",english:"Car",cefr:"A2",topic:"travel",pronunciation:"KOT-cheh-ah",notes:"Kotxea comes from Spanish coche. Kotxea aparkatu = to park the car. Garaje = garage. Auto is also used in informal speech.",example:{basque:"Kotxea parkatu dut.",english:"I parked the car."}},
  {id:"itsasontzia",basque:"Itsasontzia",english:"Ship / Boat",cefr:"A2",topic:"travel",pronunciation:"it-sah-SON-tsee-ah",notes:"Itsasontzia = ship (itsaso=sea + ontzia=vessel). Basque sailors were among the first to fish Newfoundland cod before Columbus reached America.",example:{basque:"Itsasontzia handia da.",english:"The ship is large."}},
  {id:"bidaia",basque:"Bidaia",english:"Journey / Trip",cefr:"A2",topic:"travel",pronunciation:"bee-DAI-ah",notes:"Bidaia = journey or trip. Bidaiari = traveller. Bidaiatu = to travel. Bide = road/way - so bidaia is literally a going on the road.",example:{basque:"Bidaia luzea da baina merezi du.",english:"The journey is long but it is worth it."}},
  {id:"osasuna",basque:"Osasuna",english:"Health",cefr:"A2",topic:"body",pronunciation:"oh-sah-SOO-nah",notes:"Osasuna = health. Also the name of the Iruña (Pamplona) football club - a healthy team! Osasun ona = good health. Osasuntsu = healthy.",example:{basque:"Osasuna zaindu behar duzu.",english:"You need to take care of your health."}},
  {id:"sendagilea",basque:"Sendagilea",english:"Doctor",cefr:"A2",topic:"body",pronunciation:"sen-dah-ghee-LEH-ah",notes:"Sendagilea = doctor. Sendatu = to heal. Sendabidea = remedy/cure (healing-path). Sendagile is a beautiful word: the one who heals.",example:{basque:"Sendagilea etorri da.",english:"The doctor has come."}},
  {id:"ospitalea",basque:"Ospitalea",english:"Hospital",cefr:"A2",topic:"body",pronunciation:"os-pee-TAH-leh-ah",notes:"Ospitalea = hospital. From Latin hospitale. Basque public healthcare (Osakidetza) is among the best in Europe.",example:{basque:"Ospitalea hurbil dago.",english:"The hospital is nearby."}},
  {id:"arnasa",basque:"Arnasa",english:"Breath",cefr:"A2",topic:"body",pronunciation:"ar-NAH-sah",notes:"Arnasa = breath. Arnasa hartu = to take a breath/breathe in. Arnasgune = breathing space. Arnastu = to breathe. Used in meditation.",example:{basque:"Arnasa hartu.",english:"Take a breath."}},
  {id:"irakaslea",basque:"Irakaslea",english:"Teacher",cefr:"A2",topic:"work",pronunciation:"ee-rah-kas-LEH-ah",notes:"Irakaslea = teacher. Irakatsi = to teach. Irakaskuntza = education/teaching. Ikastola teachers helped revive Basque in the 20th century.",example:{basque:"Irakaslea ona da.",english:"The teacher is good."}},
  {id:"ikaslea",basque:"Ikaslea",english:"Student",cefr:"A2",topic:"work",pronunciation:"ee-kas-LEH-ah",notes:"Ikaslea = student. Ikasi = to learn. Ikasgela = classroom (learning-room). Ikastola = Basque-language school. All from root ika- (to learn).",example:{basque:"Ikaslea langilea da.",english:"The student is hardworking."}},
  {id:"bulegoa",basque:"Bulegoa",english:"Office",cefr:"A2",topic:"work",pronunciation:"boo-LEH-goh-ah",notes:"Bulegoa = office. From Spanish bufete/despacho via French bureau. Bulegokidea = office colleague. Bulegolana = office work.",example:{basque:"Bulegoa garbia da.",english:"The office is clean."}},
  {id:"bilera",basque:"Bilera",english:"Meeting",cefr:"A2",topic:"work",pronunciation:"bee-LEH-rah",notes:"Bilera = meeting. Bileratu = to meet/gather. Bilera batzordea = committee meeting. Bilerara joan = to go to a meeting.",example:{basque:"Bilera luze bat dago.",english:"There is a long meeting."}},
  {id:"langilea",basque:"Langilea",english:"Worker / Hardworking",cefr:"A2",topic:"work",pronunciation:"lan-ghee-LEH-ah",notes:"Langilea = worker. Lan = work + -gile = maker/doer. Langilegoa = the working class. Langile mugimendu = labor movement. Central to Basque industrial history.",example:{basque:"Ikaslea langilea da.",english:"The student is hardworking."}},
  {id:"astelehenea",basque:"Astelehenea",english:"Monday",cefr:"A2",topic:"time",pronunciation:"as-teh-leh-HEH-neh-ah",notes:"Astelehenea = Monday. Aste = week + lehena = first. Literally the first of the week. Work starts here for most Basques.",example:{basque:"Astelehenean lan egin.",english:"Work on Monday."}},
  {id:"asteartea",basque:"Asteartea",english:"Tuesday",cefr:"A2",topic:"time",pronunciation:"as-teh-AR-teh-ah",notes:"Asteartea = Tuesday. Aste = week + artea = middle/between. Literally between-the-week. The second day.",example:{basque:"Asteartea dator.",english:"Tuesday is coming."}},
  {id:"asteazkena",basque:"Asteazkena",english:"Wednesday",cefr:"A2",topic:"time",pronunciation:"as-teh-az-KEH-nah",notes:"Asteazkena = Wednesday. Aste = week. The second element is debated - possibly from Latin origins or aste erdi (mid-week) rather than azkena (last). Asteazkenean = on Wednesday. The hardest day name to remember.",example:{basque:"Asteazkena erdian dago.",english:"Wednesday is in the middle."}},
  {id:"osteguna",basque:"Osteguna",english:"Thursday",cefr:"A2",topic:"time",pronunciation:"os-teh-GOO-nah",notes:"Osteguna - the days of the week are among the hardest Basque words to remember. Try: Aste (week) + lehena=Monday, artea=Tuesday, azkena=Wednesday...",example:{basque:"Osteguna dator.",english:"Thursday is coming."}},
  {id:"ostirala",basque:"Ostirala",english:"Friday",cefr:"A2",topic:"time",pronunciation:"os-tee-RAH-lah",notes:"Ostirala = Friday. Origin uncertain - possibly from Latin. TGIF in Basque: Ostirala da! Ostiraleko = of Friday.",example:{basque:"Ostiralean aske naiz.",english:"I am free on Friday."}},
  {id:"larunbata",basque:"Larunbata",english:"Saturday",cefr:"A2",topic:"time",pronunciation:"lah-roon-BAH-tah",notes:"Larunbata = Saturday. Etymology uncertain - possibly from Latin Saturni dies (day of Saturn) like English Saturday. Larunbatean = on Saturday. Larunbatero = every Saturday.",example:{basque:"Larunbata alaia da.",english:"Saturday is fun."}},
  {id:"igandea",basque:"Igandea",english:"Sunday",cefr:"A2",topic:"time",pronunciation:"ee-gan-DEH-ah",notes:"Igandea = Sunday. Igan = to ascend/rise. The day of rising - reflecting its religious significance. Igandero = every Sunday.",example:{basque:"Igandean atseden hartu.",english:"Rest on Sunday."}},
  {id:"goizean",basque:"Goizean",english:"In the morning",cefr:"A2",topic:"time",pronunciation:"GOI-zeh-an",notes:"Goizean = in the morning. Goiz = morning (root). Goizeko = of the morning. Goizero = every morning. Goiz jaiki = to get up early.",example:{basque:"Goizean jaiki naiz.",english:"I woke up in the morning."}},
  {id:"arratsaldean",basque:"Arratsaldean",english:"In the afternoon",cefr:"A2",topic:"time",pronunciation:"ar-rat-sal-DEH-an",notes:"Arratsaldean = in the afternoon. Arratsalde = afternoon/evening. Arratsaldeko = of the afternoon. Arratsaldero = every afternoon.",example:{basque:"Arratsaldean etorri da.",english:"He came in the afternoon."}},
  {id:"senarra",basque:"Senarra",english:"Husband",cefr:"A2",topic:"family",pronunciation:"seh-NAR-rah",notes:"Senarra = husband. Senar = husband (root). Senarreba = in-laws. Bizilagun eta senarra = neighbor and husband (sometimes the same).",example:{basque:"Senarra etxean dago.",english:"The husband is at home."}},
  {id:"emaztea",basque:"Emaztea",english:"Wife",cefr:"A2",topic:"family",pronunciation:"eh-maz-TEH-ah",notes:"Emaztea = wife. Emazte = wife (root). Emaztearen = wife's. An old word - modern Basque also uses bikotekidea (partner) more neutrally.",example:{basque:"Emaztea langilea da.",english:"The wife is hardworking."}},
  {id:"bikotea",basque:"Bikotea",english:"Couple / Partner",cefr:"A2",topic:"family",pronunciation:"bee-KOH-teh-ah",notes:"Bikotea = couple or partner. Bikote = pair (root). Bikotekidea = partner/member of a couple. Bikotean = as a couple.",example:{basque:"Bikotea iristen da.",english:"The couple is arriving."}},
  {id:"bizilaguna",basque:"Bizilaguna",english:"Neighbor",cefr:"A2",topic:"family",pronunciation:"bee-see-lah-GOON-ah",notes:"Bizilaguna = neighbor. Bizi = to live + laguna = friend. Literally living-friend - what a lovely way to describe a neighbor!",example:{basque:"Bizilaguna adeitsua da.",english:"The neighbor is friendly."}},
  {id:"herria",basque:"Herria",english:"Town / People / Nation",cefr:"A2",topic:"society",pronunciation:"HER-ree-ah",notes:"Herria = town, people, or nation. Herri = people/nation (root). Euskal Herria = the Basque homeland. Herritar = citizen. Herrialde = country/territory. One of the most powerful words in Basque political discourse.",example:{basque:"Herria altxatzen da.",english:"The people rise up."}},
  {id:"hizkuntza",basque:"Hizkuntza",english:"Language",cefr:"A2",topic:"society",pronunciation:"heez-KOON-tsah",notes:"Hizkuntza = language. Hizkuntzalari = linguist. Hizkuntza politika = language policy. Euskara is the hizkuntza of the Basques.",example:{basque:"Hizkuntza ederra da.",english:"The language is beautiful."}},
  {id:"kultura",basque:"Kultura",english:"Culture",cefr:"A2",topic:"society",pronunciation:"kool-TOO-rah",notes:"Kultura = culture. Kulturala = cultural. Kultura etxea = cultural center. Basque culture (euskal kultura) is distinct and ancient.",example:{basque:"Kultura bizirik dago.",english:"Culture is alive."}},
  {id:"historia",basque:"Historia",english:"History",cefr:"A2",topic:"society",pronunciation:"hees-TOH-ree-ah",notes:"Historia = history. Historikoa = historic. Historiagilea = historian. Basque history stretches back thousands of years.",example:{basque:"Historia luzea da.",english:"The history is long."}},
  {id:"askatasuna",basque:"Askatasuna",english:"Freedom / Liberty",cefr:"A2",topic:"society",pronunciation:"as-kah-tah-SOO-nah",notes:"Askatasuna = freedom or liberty. Aske = free (root). Askatu = to free/liberate. Askatasunez = freely. Askatasunaren aldeko = in favour of freedom. A central concept in Basque political and cultural life.",example:{basque:"Askatasuna nahi dugu.",english:"We want freedom."}},
  {id:"elkartasuna",basque:"Elkartasuna",english:"Solidarity",cefr:"A2",topic:"society",pronunciation:"el-kar-tah-SOO-nah",notes:"Elkartasuna = solidarity. Elkartu = to unite/join together. Elkar = each other. Elkartasunez = with solidarity. Key Basque labor movement word.",example:{basque:"Elkartasuna garrantzitsua da.",english:"Solidarity is important."}},
  {id:"argia",basque:"Argia",english:"Light / Bright",cefr:"A2",topic:"adjectives",pronunciation:"AR-ghee-ah",notes:"Argia = light or bright. Also means clever/smart! Oso argia = very clever. Argi = light (root). Argitu = to enlighten. Argipen = explanation.",example:{basque:"Gela argia da.",english:"The room is bright."}},
  {id:"iluna",basque:"Iluna",english:"Dark",cefr:"A2",topic:"adjectives",pronunciation:"ee-LOON-ah",notes:"Iluna = dark. Ilundu = to get dark. Ilunabar = dusk/twilight (dark-edge). Iluntasun = darkness. Ilunpean = in the dark/in secret.",example:{basque:"Gaua iluna da.",english:"The night is dark."}},
  {id:"azkarra",basque:"Azkarra",english:"Fast / Sharp",cefr:"A2",topic:"adjectives",pronunciation:"az-KAR-rah",notes:"Azkarra = fast or sharp. Azkar ibili = to move fast. Oso azkarra = very sharp/clever. Also means quick-witted. A compliment in Basque culture.",example:{basque:"Ikaslea azkarra da.",english:"The student is sharp."}},
  {id:"motela",basque:"Motela",english:"Slow",cefr:"A2",topic:"adjectives",pronunciation:"moh-TEH-lah",notes:"Motela = slow. Motel = slowly (adverb). Moteldu = to slow down. Also used for dull/boring people: oso motela = very boring.",example:{basque:"Trena motela da.",english:"The train is slow."}},
  {id:"garestia",basque:"Garestia",english:"Expensive",cefr:"A2",topic:"adjectives",pronunciation:"gah-res-TEE-ah",notes:"Garestia = expensive. Garesti = expensively. Do not confuse with aberatsa (rich/wealthy). Garestitu = to become expensive.",example:{basque:"Kotxea garestia da.",english:"The car is expensive."}},
  {id:"merkea",basque:"Merkea",english:"Cheap",cefr:"A2",topic:"adjectives",pronunciation:"mer-KEH-ah",notes:"Merkea = cheap or affordable. Merke = cheaply. Merkatua = market (from Latin mercatus, same root as English merchant). Merketu = to become cheaper. Opposite: garestia (expensive).",example:{basque:"Janaria merkea da.",english:"The food is cheap."}},
  {id:"erraza",basque:"Erraza",english:"Easy",cefr:"A2",topic:"adjectives",pronunciation:"er-RAH-sah",notes:"Erraza = easy. Erraz = easily (adverb). Erraztasuna = ease/facility. Erraztu = to make easier. Opposite of zaila (difficult).",example:{basque:"Ariketa erraza da.",english:"The exercise is easy."}},
  {id:"zaila",basque:"Zaila",english:"Difficult",cefr:"A2",topic:"adjectives",pronunciation:"ZAI-lah",notes:"Zaila = difficult. Zaildu = to become harder. Zailtasuna = difficulty. Zailtasunak gainditu = to overcome difficulties.",example:{basque:"Euskara zaila da.",english:"Basque is difficult."}},
  {id:"ozena",basque:"Ozena",english:"Loud",cefr:"A2",topic:"adjectives",pronunciation:"oh-ZEH-nah",notes:"Ozena = loud. Ozen = loudly. Ozendu = to get louder. Ozentasuna = loudness. Do not confuse with garrantzitsua (important).",example:{basque:"Musika ozena da.",english:"The music is loud."}},
  {id:"isila",basque:"Isila",english:"Quiet / Silent",cefr:"A2",topic:"adjectives",pronunciation:"ee-SEE-lah",notes:"Isila = quiet or silent. Isilik = quietly. Isildu = to go silent. Isilpean = in secret (under silence). Isiltasuna = silence.",example:{basque:"Gaua isila da.",english:"The night is quiet."}},
  {id:"zakurra",basque:"Zakurra",english:"Dog",cefr:"A2",topic:"nature",pronunciation:"sah-KOOR-rah",notes:"Zakurra = dog. Zakur = dog (root). Zakurtegi = kennel. The Basque Country has its own dog breeds including the Basque Shepherd (Euskal Artzain Txakurra).",example:{basque:"Zakurra leiala da.",english:"The dog is loyal."}},
  {id:"katua",basque:"Katua",english:"Cat",cefr:"A2",topic:"nature",pronunciation:"KAH-too-ah",notes:"Katua = cat. Katu = cat (root). From Latin cattus. Katuak bederatzi bizia ditu = cats have nine lives (same saying in Basque!).",example:{basque:"Katua lasaia da.",english:"The cat is calm."}},
  {id:"iragana",basque:"Iragana",english:"The past",cefr:"B1",topic:"time",pronunciation:"ee-rah-GAH-nah",notes:"Iragana = the past. Iraganeko = of the past. Iragana ezin da aldatu = the past cannot be changed. Key word in Basque history discussions.",example:{basque:"Iragana aldaezina da.",english:"The past is unchangeable."}},
  {id:"etorkizuna",basque:"Etorkizuna",english:"The future",cefr:"B1",topic:"time",pronunciation:"eh-tor-kee-ZOO-nah",notes:"The future. Etorkizuneko = future (adjective). Etorkizunean = in the future. Key word in Basque language planning - etorkizuna and the survival of Euskara is a constant political discussion. From etorri (to come) + -kizun (that which will).",example:{basque:"Etorkizuna argitsua da.",english:"The future is bright."}},
  {id:"aldia",basque:"Aldia",english:"Time / Period / Turn",cefr:"B1",topic:"time",pronunciation:"AL-dee-ah",notes:"Aldia = a period or turn. Nire aldia da = it is my turn. Aldi berean = at the same time. Noizean behin = from time to time (literally at some period).",example:{basque:"Nire aldia da.",english:"It is my turn."}},
  {id:"ezkontza",basque:"Ezkontza",english:"Wedding",cefr:"B1",topic:"family",pronunciation:"eth-KON-tsah",notes:"Ezkontza = wedding. Ezkondu = to marry. Ezkontide = spouse. Ezkongai = engaged person. Basque weddings are famous multi-day celebrations.",example:{basque:"Ezkontza ederra zen.",english:"The wedding was beautiful."}},
  {id:"mugaldea",basque:"Mugaldea",english:"Border area",cefr:"B1",topic:"travel",pronunciation:"moo-GAHL-deh-ah",notes:"Border area or frontier zone. Muga = border + aldea = side/area. The French-Spanish border runs through the Basque Country - the Basque people straddle it. Mugakide = border neighbor. A politically sensitive concept.",example:{basque:"Mugaldea interesgarria da.",english:"The border area is interesting."}},
  {id:"ibilbidea",basque:"Ibilbidea",english:"Route / Itinerary",cefr:"B1",topic:"travel",pronunciation:"ee-beel-BEE-deh-ah",notes:"Route or itinerary. Ibil = walk/travel + bidea = path. Literally the traveling-path. The Camino de Santiago (Santiago Bidea) passes through the Basque Country via Donostia. GR11 and GR10 are famous Basque hiking routes.",example:{basque:"Ibilbidea luzea da.",english:"The route is long."}},
  {id:"natura",basque:"Natura",english:"Nature",cefr:"B1",topic:"nature",pronunciation:"nah-TOO-rah",notes:"Natura = nature. Natural = natural. Naturatik = from nature. Basques have a deep connection to natura - mountains, sea, and forests are central to identity.",example:{basque:"Natura ederra da.",english:"Nature is beautiful."}},
  {id:"ingurumena",basque:"Ingurumena",english:"Environment",cefr:"B1",topic:"nature",pronunciation:"in-goo-ROO-meh-nah",notes:"Ingurumena = environment. Inguru = surroundings (root). Ingurumen politika = environmental policy. Ingurugiroa = natural environment (more specific).",example:{basque:"Ingurumena babestu behar dugu.",english:"We must protect the environment."}},
  {id:"lanbidea",basque:"Lanbidea",english:"Profession",cefr:"B1",topic:"work",pronunciation:"lan-BEE-deh-ah",notes:"Lanbidea = profession. Lan = work + bide = path. Literally the work-path. What is your profession? = Zein da zure lanbidea?",example:{basque:"Lanbidea ona da.",english:"The profession is good."}},
  {id:"soldata",basque:"Soldata",english:"Salary",cefr:"B1",topic:"work",pronunciation:"sol-DAH-tah",notes:"Soldata = salary or wage. From Spanish sueldo. Soldata igokera = pay rise. Gutxieneko soldata = minimum wage.",example:{basque:"Soldata txikia da.",english:"The salary is small."}},
  {id:"enpresa",basque:"Enpresa",english:"Company",cefr:"B1",topic:"work",pronunciation:"en-PREH-sah",notes:"Enpresa = company. Enpresaria = entrepreneur. Enpresa txikia = small business. Basque Country has a strong tradition of cooperatives (Mondragon).",example:{basque:"Enpresa txikia da.",english:"The company is small."}},
  {id:"erakundea",basque:"Erakundea",english:"Organization",cefr:"B1",topic:"work",pronunciation:"eh-rah-KOON-deh-ah",notes:"Erakundea = organization. Eratu = to form/organize (root). Erakunde publikoa = public institution. Erakunde soziala = social organization.",example:{basque:"Erakundea handia da.",english:"The organization is large."}},
  {id:"industria",basque:"Industria",english:"Industry",cefr:"B1",topic:"work",pronunciation:"in-DOOS-tree-ah",notes:"Industria = industry. Industriala = industrial. Bilbo (Bilbao) was once a major steel and shipbuilding center - industry shaped modern Basque identity.",example:{basque:"Industria handia da.",english:"The industry is large."}},
  {id:"txapelketa",basque:"Txapelketa",english:"Championship",cefr:"B1",topic:"culture",pronunciation:"chah-pel-KEH-tah",notes:"Championship. Txapela = beret + -keta = contest. The Bertsolari Championship (Bertsolari Txapelketa) held every 4 years fills the BEC arena in Bilbo (Bilbao) with 15,000 fans watching improvised verse. A unique Basque institution.",example:{basque:"Txapelketa ederra da.",english:"The championship is great."}},
  {id:"bertsolaria",basque:"Bertsolaria",english:"Verse singer",cefr:"B1",topic:"culture",pronunciation:"ber-tsoh-LAH-ree-ah",notes:"Bertsolaria = verse singer (bertsolaritza practitioner). Improvises in strict metre and rhyme on given themes. National championships fill the BEC arena in Bilbo (Bilbao) with 15,000 spectators. A uniquely Basque art form.",example:{basque:"Bertsolaria bikaina da.",english:"The verse singer is excellent."}},
  {id:"ohitura",basque:"Ohitura",english:"Custom / Tradition",cefr:"B1",topic:"culture",pronunciation:"oh-EE-too-rah",notes:"Ohitura = custom or habit. Ohitu = to get used to. Ohitura onez = by good custom. Ohiturak eta balioak = customs and values.",example:{basque:"Ohiturak onak dira.",english:"Customs are good."}},
  {id:"erritu",basque:"Erritu",english:"Ritual / Ceremony",cefr:"B1",topic:"culture",pronunciation:"er-REE-too",notes:"Erritu = ritual. Errituzko = ritual/ceremonial. Basque culture has many ancient rituals tied to seasons, agriculture and community life.",example:{basque:"Erritua garrantzitsua da.",english:"The ritual is important."}},
  {id:"kezkatu",basque:"Kezkatu",english:"Worried",cefr:"B1",topic:"emotions",pronunciation:"kez-KAH-too",notes:"Kezkatu = worried. Kezka = worry/concern (root). Kezkatzea = worrying. Kezkagarria = worrying/concerning. Kezkatu naiz = I am worried.",example:{basque:"Kezkatu nago.",english:"I am worried."}},
  {id:"harro",basque:"Harro",english:"Proud",cefr:"B1",topic:"emotions",pronunciation:"HAR-roh",notes:"Harro = proud. Harrotasun = pride. Harrotu = to become proud. Harro egon = to be proud of. Oso harro nago = I am very proud.",example:{basque:"Harro nago.",english:"I am proud."}},
  {id:"esperantza",basque:"Esperantza",english:"Hope",cefr:"B1",topic:"emotions",pronunciation:"es-peh-RAN-tsah",notes:"Esperantza = hope. From Spanish esperanza. The Basque word itxaropena is also used (from itxaron = to wait). Esperantza dugu = we have hope.",example:{basque:"Esperantza dut.",english:"I have hope."}},
  {id:"adorea",basque:"Adorea",english:"Courage",cefr:"B1",topic:"emotions",pronunciation:"ah-DOH-reh-ah",notes:"Adorea = courage. Adoretsu = courageous. Adoretu = to encourage. Adorea hartu = take courage. From Spanish adorar via ador = honor.",example:{basque:"Adorea hartu.",english:"Take courage."}},
  {id:"larrituta",basque:"Larrituta",english:"Stressed",cefr:"B1",topic:"emotions",pronunciation:"lar-ree-TOO-tah",notes:"Larrituta = stressed or upset. Larritu = to become worried/stressed. Larritasuna = anxiety/distress. Larria = serious/grave (root).",example:{basque:"Larrituta nago.",english:"I am stressed."}},
  {id:"beroa",basque:"Beroa",english:"Hot / Warm",cefr:"A2",topic:"adjectives",pronunciation:"BEH-roh-ah",notes:"Beroa = hot or warm. Bero = heat (root). Berotasuna = warmth. Berokia = coat/jacket (literally the warming thing). Berogailua = heater.",example:{basque:"Ura beroa da.",english:"The water is hot."}},
  {id:"hotza",basque:"Hotza",english:"Cold",cefr:"A2",topic:"adjectives",pronunciation:"HOT-sah",notes:"Hotza = cold. Hotz = cold (root). Hotzikara = shiver (cold-shake). Hotzikaraz = with shivers. Hotz egin = to feel cold. Opposite: beroa.",example:{basque:"Negua hotza da.",english:"Winter is cold."}},
  {id:"garbia",basque:"Garbia",english:"Clean",cefr:"A2",topic:"adjectives",pronunciation:"GAR-bee-ah",notes:"Garbia = clean or pure. Garbitu = to clean. Garbitasuna = cleanliness/purity. Garbiketa = cleaning. Garbi hitz egin = to speak clearly.",example:{basque:"Ura garbia da.",english:"The water is clean."}},
  {id:"gozoa",basque:"Gozoa",english:"Sweet / Delicious",cefr:"B1",topic:"adjectives",pronunciation:"goh-ZOH-ah",notes:"Gozoa = sweet or delicious. Gozoki = candy/sweet treat. Gozotasuna = sweetness. Gozatu = to enjoy. Gozamenak = pleasures.",example:{basque:"Fruta gozoa da.",english:"The fruit is sweet."}},
  {id:"gazia",basque:"Gazia",english:"Salty",cefr:"B1",topic:"adjectives",pronunciation:"GAH-see-ah",notes:"Gazia = salty. Gatz = salt (root). Gatzontzi = salt cellar. Gazta = cheese (literally salted thing!). Itsasoa gazia da = the sea is salty.",example:{basque:"Itsasoa gazia da.",english:"The sea is salty."}},
  {id:"osoa",basque:"Osoa",english:"Whole / Complete",cefr:"B1",topic:"adjectives",pronunciation:"OH-soh-ah",notes:"Osoa = whole or complete. Osotasuna = wholeness/completeness. Osotu = to complete. Oro = all + -soa. Oso = very (adverb from same root).",example:{basque:"Astea osoa.",english:"The whole week."}},
  {id:"normala",basque:"Normala",english:"Normal",cefr:"A2",topic:"adjectives",pronunciation:"nor-MAH-lah",notes:"Normala = normal. Normalean = normally/usually. Normalizazioa = normalization (of Basque language use). Key political term.",example:{basque:"Egoera normala da.",english:"The situation is normal."}},
  {id:"indartsu",basque:"Indartsu",english:"Strong",cefr:"B1",topic:"adjectives",pronunciation:"in-DART-soo",notes:"Indartsu = strong. Indar = strength/force (root). Indarra = the force. Indartu = to strengthen. Indar handia = great strength.",example:{basque:"Gizona indartsu da.",english:"The man is strong."}},
  {id:"hizkuntza_politika",basque:"Hizkuntza politika",english:"Language policy",cefr:"B1",topic:"society",pronunciation:"heez-KOON-tsah poh-LEE-tee-kah",notes:"Hizkuntza politika = language policy - central to Basque politics. Official language status, education medium, and public signage are all debated.",example:{basque:"Hizkuntza politika ezinbestekoa da.",english:"Language policy is essential."}},
  {id:"normalizazioa",basque:"Normalizazioa",english:"Normalization",cefr:"B1",topic:"society",pronunciation:"nor-mah-lee-sah-TSEE-oh-ah",notes:"Normalizazioa = normalization - specifically the process of making Basque normal in daily life. A key political and cultural concept.",example:{basque:"Normalizazioa prozesua da.",english:"Normalization is a process."}},
  {id:"gizarte_mugimendua",basque:"Gizarte mugimendua",english:"Social movement",cefr:"B1",topic:"society",pronunciation:"ghee-ZAR-teh moo-ghee-MEN-doo-ah",notes:"Gizarte mugimendua = social movement. Gizarte = society + mugimendua = movement. Basque Country has a rich history of social movements.",example:{basque:"Gizarte mugimendua indartsua da.",english:"The social movement is strong."}},
  {id:"gizartea",basque:"Gizartea",english:"Society",cefr:"B2",topic:"society",pronunciation:"ghee-ZAR-teh-ah",notes:"Gizartea = society. Gizon = man/human + -arte = between. Literally between-humans. Gizarteratu = to socialize. Gizarte zerbitzuak = social services.",example:{basque:"Gizartea aldatzen da.",english:"Society is changing."}},
  {id:"ekonomia",basque:"Ekonomia",english:"Economy",cefr:"B2",topic:"society",pronunciation:"eh-koh-NOH-mee-ah",notes:"Ekonomia = economy. Ekonomikoa = economic. The Basque Country has one of the highest GDPs per capita in Spain - a strong industrial economy.",example:{basque:"Ekonomia hazten da.",english:"The economy is growing."}},
  {id:"boterea",basque:"Boterea",english:"Power / Authority",cefr:"B2",topic:"society",pronunciation:"boh-TEH-reh-ah",notes:"Boterea = power or authority. Boteretsu = powerful. Boteredun = powerful person. Botere = power (root). Central to Basque political vocabulary.",example:{basque:"Boterea arduraz erabili behar da.",english:"Power must be used responsibly."}},
  {id:"justizia",basque:"Justizia",english:"Justice",cefr:"B2",topic:"society",pronunciation:"yoos-TEET-see-ah",notes:"Justizia = justice. Justiziazkoa = just/fair. Injustizia = injustice. From Latin justitia. Basque legal system (foral law) has ancient roots.",example:{basque:"Justizia lortu behar dugu.",english:"We must achieve justice."}},
  {id:"abertzalea",basque:"Abertzalea",english:"Patriot",cefr:"B2",topic:"society",pronunciation:"ah-ber-TSAH-leh-ah",notes:"Abertzalea = patriot (from aberri=homeland + -zalea=lover of). Aberri Eguna = Basque Homeland Day. Can be political - use contextually.",example:{basque:"Abertzalea da.",english:"He/she is a patriot."}},
  {id:"herritartasuna",basque:"Herritartasuna",english:"Citizenship",cefr:"B2",topic:"society",pronunciation:"her-ree-tar-tah-SOO-nah",notes:"Herritartasuna = citizenship. Herritar = citizen/townsperson. Herri = town/people. Herritartasun agiria = citizenship document.",example:{basque:"Herritartasuna eskuratu dut.",english:"I obtained citizenship."}},
  {id:"nazionalismoa",basque:"Nazionalismoa",english:"Nationalism",cefr:"B2",topic:"society",pronunciation:"nah-tsee-oh-nah-lees-MOH-ah",notes:"Nazionalismoa = nationalism. A central concept in Basque politics. Abertzaletasuna is the specifically Basque nationalist term. Nazionalismo euskalduna = Basque nationalism. Ranges from cultural to independence-seeking.",example:{basque:"Nazionalismoa indartsua da.",english:"Nationalism is strong."}},
  {id:"autodeterminazioa",basque:"Autodeterminazioa",english:"Self-determination",cefr:"B2",topic:"society",pronunciation:"ow-toh-deh-ter-mee-nah-TSEE-oh-ah",notes:"Autodeterminazioa = self-determination. A core concept in Basque politics. The right of Basques to decide their own political future.",example:{basque:"Autodeterminazioa oinarrizko eskubidea da.",english:"Self-determination is a basic right."}},
  {id:"giza_eskubideak",basque:"Giza eskubideak",english:"Human rights",cefr:"B2",topic:"society",pronunciation:"GHEE-sah es-koo-BEE-deh-ak",notes:"Giza eskubideak = human rights. Giza = human + eskubideak = rights (literally hand-paths). Giza eskubideen adierazpena = Declaration of Human Rights.",example:{basque:"Giza eskubideak babestu behar dira.",english:"Human rights must be protected."}},
  {id:"ondarea",basque:"Ondarea",english:"Heritage / Legacy",cefr:"B2",topic:"culture",pronunciation:"on-DAH-reh-ah",notes:"Ondarea = heritage or legacy. Ondare = inheritance (root). Kultura ondarea = cultural heritage. Basque heritage includes language, sport, music and food.",example:{basque:"Ondarea babestu behar dugu.",english:"We must protect our heritage."}},
  {id:"identitatea",basque:"Identitatea",english:"Identity",cefr:"B2",topic:"culture",pronunciation:"ee-den-tee-TAH-teh-ah",notes:"Identity - central to Basque cultural and political life. Euskal identitatea = Basque identity. The question of who is Basque (language-based vs blood-based) is actively debated. Basque identity is largely defined through language use.",example:{basque:"Identitatea garrantzitsua da.",english:"Identity is important."}},
  {id:"tradizioa",basque:"Tradizioa",english:"Tradition",cefr:"B2",topic:"culture",pronunciation:"trah-dee-TSEE-oh-ah",notes:"Tradizioa = tradition. Tradizional = traditional. Tradizioak gorde = to preserve traditions. Basque traditions are unusually well-preserved.",example:{basque:"Gure tradizioak bizirik daude belaunaldiz belaunaldi.",english:"Our traditions are alive from generation to generation."}},
  {id:"modernitatea",basque:"Modernitatea",english:"Modernity",cefr:"B2",topic:"culture",pronunciation:"moh-der-nee-TAH-teh-ah",notes:"Modernitatea = modernity. Moderno = modern. The tension between modernitatea and tradizioa is a constant theme in Basque cultural debate.",example:{basque:"Modernitatea eta tradizioa.",english:"Modernity and tradition."}},
  {id:"euskara_batua",basque:"Euskara Batua",english:"Unified Basque",cefr:"B2",topic:"culture",pronunciation:"eus-KAH-rah bah-TOO-ah",notes:"Euskara Batua = Unified Basque. Standardised form created by the Academy (Euskaltzaindia) in 1968 at Arantzazu. Before this, Basque had no standard written form. Batua = unified (from batu = to unite). Now taught in all schools.",example:{basque:"Euskara Batua ikasi dut.",english:"I learned Unified Basque."}},
  {id:"euskalkia",basque:"Euskalkia",english:"Basque dialect",cefr:"B2",topic:"culture",pronunciation:"eus-KAL-kee-ah",notes:"Euskalkia = dialect. Basque has 5-7 main dialects: Bizkaiera, Gipuzkera, Lapurtera, Zuberera, Nafarrera. Unified Basque (Euskara Batua) was standardised in 1968.",example:{basque:"Euskalkia ederra da.",english:"The dialect is beautiful."}},
  {id:"klima_aldaketa",basque:"Klima aldaketa",english:"Climate change",cefr:"B2",topic:"nature",pronunciation:"KLEE-mah ahl-dah-KEH-tah",notes:"Klima aldaketa = climate change. Klima = climate + aldaketa = change. Aldatu = to change. Urgent issue given Basque Country's coastal geography.",example:{basque:"Klima aldaketa arazo larria da.",english:"Climate change is a serious problem."}},
  {id:"enpresaria",basque:"Enpresaria",english:"Entrepreneur",cefr:"B2",topic:"work",pronunciation:"en-preh-SAH-ree-ah",notes:"Enpresaria = entrepreneur. Basque Country has the Mondragon Cooperative Corporation - one of the world's largest worker-owned cooperatives. Entrepreneurship is valued.",example:{basque:"Enpresaria da.",english:"He/she is an entrepreneur."}},
  {id:"greba",basque:"Greba",english:"Strike (labor)",cefr:"B2",topic:"work",pronunciation:"GREH-bah",notes:"Greba = labor strike. Grebara joan = to go on strike. Greba orokorra = general strike. The Basque Country has a strong union tradition - the metalworkers of Bilbo (Bilbao) were historically militant.",example:{basque:"Greba dago.",english:"There is a strike."}},
  {id:"produktibitatea",basque:"Produktibitatea",english:"Productivity",cefr:"B2",topic:"work",pronunciation:"pro-dook-tee-bee-TAH-teh-ah",notes:"Produktibitatea = productivity. Produktibo = productive. The Basque economy is known for high productivity, especially in manufacturing and industry.",example:{basque:"Produktibitatea handitzen da.",english:"Productivity is increasing."}},
  {id:"epea",basque:"Epea",english:"Period / Timeframe",cefr:"B2",topic:"time",pronunciation:"EH-peh-ah",notes:"Period or timeframe. Epe = period (root). Epe laburrean = in the short term. Epe luzera = long-term. Epe batean = within a period. Broader than muga-epea which is a specific deadline.",example:{basque:"Epe laburrean konponduko da.",english:"It will be resolved in the short term."}},
  {id:"iraungitzea",basque:"Iraungitzea",english:"Expiry",cefr:"B2",topic:"time",pronunciation:"ee-row-NGEE-tseh-ah",notes:"Iraungitzea = expiry or expiration. Iraungitu = to expire. Iraungitze data = expiry date. Used for passports, contracts, food, medicine. Iraungi da = it has expired. Iraungitu gabe = not yet expired. From iraun (to last) + -gitu.",example:{basque:"Iraungitzea hurbil dago.",english:"The expiry is near."}},
  {id:"estatistika",basque:"Estatistika",english:"Statistics",cefr:"B2",topic:"work",pronunciation:"es-tah-TEES-tee-kah",notes:"Estatistika = statistics. Estatistikoa = statistical. Eustat is the official Basque statistics agency. Data-driven governance is common in the region.",example:{basque:"Estatistika interesgarria da.",english:"Statistics are interesting."}},
  {id:"mintzatu",basque:"Mintzatu",english:"To speak / To talk",cefr:"B1",topic:"greetings",pronunciation:"min-TSAH-too",notes:"Mintzatu and hitz egin both mean to speak, but mintzatu is more formal/literary. Hitz egin is everyday speech.",example:{basque:"Euskaraz mintzatzen naiz.",english:"I speak in Basque."}},
  {id:"ulertu",basque:"Ulertu",english:"To understand",cefr:"B1",topic:"greetings",pronunciation:"oo-LER-too",notes:"Ulertu = to understand. Ulertzen dut = I understand. Ulertu al duzu? = Did you understand? Ulertzeko erraza = easy to understand. Ulerterraz = comprehensible. Ulertezina = incomprehensible.",example:{basque:"Ulertzen duzu?",english:"Do you understand?"}},
  {id:"ikasi",basque:"Ikasi",english:"To learn / To study",cefr:"B1",topic:"culture",pronunciation:"ee-KAH-see",notes:"Ikasi = to learn or study. Ikasten ari naiz = I am studying. Ikasle = student (one who learns). Ikasketa = study/studies. Ikasgela = classroom (study room). Ikastola = Basque-medium school. This app is named Ikasi & Go!",example:{basque:"Ikasi nahi dut euskara.",english:"I want to learn Basque."}},
  {id:"lagundu",basque:"Lagundu",english:"To help",cefr:"B1",topic:"greetings",pronunciation:"lah-GOON-doo",notes:"Lagundu = to help or accompany. Laguna = friend (root). So to befriend someone is to help them. Lagunduko dizut = I will help you.",example:{basque:"Lagunduko dizut.",english:"I will help you."}},
  {id:"aukeratu",basque:"Aukeratu",english:"To choose / To select",cefr:"B1",topic:"society",pronunciation:"ow-keh-RAH-too",notes:"Aukeratu = to choose. Aukera = option/opportunity (root). Aukeratze = choosing. Zein aukeratzen duzu? = Which do you choose?",example:{basque:"Aukeratu ezazu.",english:"Please choose."}},
  {id:"aldatu",basque:"Aldatu",english:"To change",cefr:"B1",topic:"society",pronunciation:"al-DAH-too",notes:"Aldatu = to change. Aldaketa = change (noun). Aldakorra = changeable. Dena aldatu da = everything has changed. Very common verb.",example:{basque:"Hiriak asko aldatu da azken urteetan.",english:"The city has changed a lot in recent years."}},
  {id:"jarraitu",basque:"Jarraitu",english:"To continue / To follow",cefr:"B1",topic:"travel",pronunciation:"yar-RAI-too",notes:"Jarraitu = to continue or follow. Jarraipen = continuation. Jarraikia = follower. Jarraitu ezazu = please continue. Also used for following someone.",example:{basque:"Jarraitu ezazu.",english:"Please continue."}},
  {id:"saiatu",basque:"Saiatu",english:"To try",cefr:"B1",topic:"emotions",pronunciation:"sai-AH-too",notes:"Saiatu = to try. Saiakera = attempt/essay. Saialdia = try/attempt. Saiatu naiz = I tried. Very encouraging word - keep trying!",example:{basque:"Saiatzen ari naiz.",english:"I am trying."}},
  {id:"pentsatu",basque:"Pentsatu",english:"To think",cefr:"B1",topic:"greetings",pronunciation:"pen-TSAH-too",notes:"Pentsatu = to think. Pentsamendu = thought/idea. Pentsalari = thinker/philosopher. Zer pentsatzen duzu? = What do you think?",example:{basque:"Zer pentsatzen duzu?",english:"What do you think?"}},
  {id:"sentitu",basque:"Sentitu",english:"To feel",cefr:"B1",topic:"emotions",pronunciation:"sen-TEE-too",notes:"Sentitu = to feel. Sentimendu = feeling/emotion. Sentikorra = sensitive. Sentitzen dut = I feel / I am sorry. Dual meaning!",example:{basque:"Pozik sentitzen naiz.",english:"I feel happy."}},
  {id:"lortu",basque:"Lortu",english:"To achieve / To get",cefr:"B1",topic:"society",pronunciation:"LOR-too",notes:"Lortu = to achieve or get. Lortu dut! = I did it! / I got it! Lortu ezin = cannot be achieved. Lorpen = achievement. Very satisfying word to use.",example:{basque:"Gogorra zen baina lortu duzu!",english:"It was hard but you achieved it!"}},
  {id:"eman",basque:"Eman",english:"To give",cefr:"B1",topic:"greetings",pronunciation:"EH-man",notes:"Eman = to give. Eman iezadazu = give it to me. Esku eman = to shake hands (give hand). Adore eman = to encourage (give courage). Beldurra eman = to frighten (give fear). One of the most idiomatic Basque verbs.",example:{basque:"Eman iezadazu.",english:"Give it to me."}},
  {id:"hartu",basque:"Hartu",english:"To take / To receive",cefr:"B1",topic:"greetings",pronunciation:"HAR-too",notes:"Hartu = to take or receive. Hartzaile = receiver. Harrera = reception/welcome. Hartu-eman = give and take. One of the most common Basque verbs.",example:{basque:"Hartu ezazu.",english:"Take it."}},
  {id:"etorri",basque:"Etorri",english:"To come",cefr:"B1",topic:"travel",pronunciation:"eh-TOR-ree",notes:"Etorri = to come. Etorri naiz = I have come. Etorriko naiz = I will come. Etorri zara? = Have you come? / Did you come? Ongi etorri = welcome!",example:{basque:"Noiz etorriko zara?",english:"When will you come?"}},
  {id:"joan",basque:"Joan",english:"To go",cefr:"B1",topic:"travel",pronunciation:"YOHN",notes:"Joan = to go. Nora joaten zara? = Where are you going? Joango naiz = I will go. Joan-etorri = return trip (go-come). Essential verb.",example:{basque:"Joango naiz.",english:"I will go."}},
  {id:"ikusi",basque:"Ikusi",english:"To see",cefr:"B1",topic:"travel",pronunciation:"ee-KOO-see",notes:"Ikusi = to see. Ikusle = spectator/viewer. Ikusgarria = spectacular (worth seeing). Ikusiko dugu = we will see. Ikusi arte = see you later!",example:{basque:"Ikusiko dugu.",english:"We will see."}},
  {id:"esan",basque:"Esan",english:"To say / To tell",cefr:"B1",topic:"greetings",pronunciation:"EH-san",notes:"Esan vs mintzatu: esan = to say something specific (esan dit = he told me), mintzatu = to speak in general.",example:{basque:"Zer esan nahi duzu?",english:"What do you want to say?"}},
  {id:"jakin",basque:"Jakin",english:"To know",cefr:"B1",topic:"greetings",pronunciation:"YAH-keen",notes:"Jakin = to know. Jakintsu = wise/knowledgeable. Jakinduria = wisdom/knowledge. Ez dakit = I do not know. Jakinarazi = to inform/notify.",example:{basque:"Ez dakit.",english:"I do not know."}},
  {id:"nahi",basque:"Nahi",english:"To want",cefr:"A2",topic:"work",pronunciation:"NAH-ee",notes:"Nahi = to want/will. Nahi dut = I want. Nahi gabe = unwillingly. Nahikoa = enough (as much as wanted). Nahi eta nahi ez = whether you want or not.",example:{basque:"Nahi dut etxera joan.",english:"I want to go home."}},
  {id:"behar",basque:"Behar",english:"To need / Must",cefr:"B1",topic:"greetings",pronunciation:"BEH-har",notes:"Behar = need/must. Behar dut = I need/I must. Zer behar duzu? = What do you need? Beharrezkoa = necessary. One of the most used words in Basque.",example:{basque:"Berandutu da, behar dut joan.",english:"It is late, I must go."}},
  {id:"aberatsa",basque:"Aberatsa",english:"Rich / Wealthy",cefr:"B2",topic:"adjectives",pronunciation:"ah-beh-RAT-sah",notes:"Aberatsa = rich or wealthy. Aberastasuna = wealth. Aberastu = to become rich. Aberats = wealthy (root). Do not confuse with nagusia (boss/employer).",example:{basque:"Herria aberatsa da.",english:"The country is wealthy."}},
  {id:"pobrea",basque:"Pobrea",english:"Poor",cefr:"B2",topic:"adjectives",pronunciation:"POH-breh-ah",notes:"Pobrea = poor. From Spanish pobre/Latin pauper. The Basque word txiroa is also used. Pobrezia = poverty. Pobretu = to become poor.",example:{basque:"Familia pobrea da.",english:"The family is poor."}},
  {id:"zuzena",basque:"Zuzena",english:"Correct / Just / Direct",cefr:"B2",topic:"adjectives",pronunciation:"soo-ZEH-nah",notes:"Zuzena = correct, just, or straight. Zuzendu = to correct/direct. Zuzentasuna = justice/correctness. Zuzenean = directly/live (as in live broadcast).",example:{basque:"Erantzuna zuzena da.",english:"The answer is correct."}},
  {id:"okerra",basque:"Okerra",english:"Wrong / Crooked",cefr:"B2",topic:"adjectives",pronunciation:"oh-KER-rah",notes:"Okerra = wrong or crooked. Oker = wrong/crooked (root). Okertzen = going wrong. Do not confuse with gaizki (badly). Okerrena = the worst.",example:{basque:"Bidea okerra da.",english:"The path is wrong."}},
  {id:"garrantzia",basque:"Garrantzia",english:"Importance",cefr:"B2",topic:"society",pronunciation:"gar-rant-TSEE-ah",notes:"Garrantzia = importance. Garrantzitsua = important. Garrantzitsuena = the most important. Very commonly heard in news and formal speech.",example:{basque:"Garrantzia handia du.",english:"It has great importance."}},
  {id:"eragina",basque:"Eragina",english:"Influence / Effect",cefr:"B2",topic:"society",pronunciation:"eh-RAH-ghee-nah",notes:"Eragina = influence or effect. Eragin = to cause/influence (root). Eraginkorra = effective. Eragingarria = influential. Zer eragin du? = What effect did it have?",example:{basque:"Eragina nabarmena da.",english:"The influence is notable."}},
  {id:"helburua",basque:"Helburua",english:"Goal / Objective",cefr:"B2",topic:"work",pronunciation:"hel-BOO-roo-ah",notes:"Helburua = goal or objective. Heldu = to arrive/reach + buru = head. Literally the head you are heading to. Helburua lortu = to achieve the goal.",example:{basque:"Helburua lortu dugu.",english:"We achieved our goal."}},
  {id:"aukera",basque:"Aukera",english:"Opportunity / Option",cefr:"B2",topic:"work",pronunciation:"OW-keh-rah",notes:"Aukera = opportunity or option. Aukeratu = to choose (verb from this root). Aukera ona = good opportunity. Aukerak eta baliabideak = opportunities and resources.",example:{basque:"Aukera ona da.",english:"It is a good opportunity."}},
  {id:"arazo",basque:"Arazoa",english:"Problem",cefr:"B2",topic:"society",pronunciation:"ah-RAH-soh-ah",notes:"Arazoa = problem. Arazo = problem (root). Arazotsua = problematic. Arazoak konpondu = to solve problems. Arazorik ez = no problem!",example:{basque:"Arazoa konpondu dugu.",english:"We solved the problem."}},
  {id:"konponbidea",basque:"Konponbidea",english:"Solution",cefr:"B2",topic:"society",pronunciation:"kon-pon-BEE-deh-ah",notes:"Konponbidea = solution. Konpondu = to fix/solve (root) + bide = path. Literally the fixing-path. Konponbide egokia = appropriate solution.",example:{basque:"Konponbidea aurkitu dugu.",english:"We found a solution."}},
  {id:"baldintza",basque:"Baldintza",english:"Condition / Requirement",cefr:"B2",topic:"work",pronunciation:"bal-DEEN-tsah",notes:"Baldintza = condition or requirement. Baldintzatu = to condition/restrict. Baldintzarik gabe = unconditionally. Lan baldintzak = working conditions.",example:{basque:"Baldintzak onak dira.",english:"The conditions are good."}},
  {id:"ondorioa",basque:"Ondorioa",english:"Consequence / Conclusion",cefr:"B2",topic:"society",pronunciation:"on-doh-REE-oh-ah",notes:"Ondorioa = consequence or conclusion. Ondorio = consequence (root). Ondoriozta = to conclude. Hortaz ondoriozta dezakegu = from this we can conclude.",example:{basque:"Ondorioak larriak dira.",english:"The consequences are serious."}},
  {id:"nola",basque:"Nola?",english:"How?",cefr:"A1",topic:"greetings",pronunciation:"NOH-lah",notes:"Nola? = How? One of the most essential question words. Nola duzu izena? = What is your name? (literally how do you have your name?) Nola joan? = How to go? Nola esaten da? = How do you say it?",example:{basque:"Nola duzu izena?",english:"What is your name?"}},
  {id:"non",basque:"Non?",english:"Where?",cefr:"A1",topic:"travel",pronunciation:"NON",notes:"Non? = Where? Essential for navigation. Non dago? = Where is it? Non bizi zara? = Where do you live? Non jaio zinen? = Where were you born? Nondik = from where? Nora = to where? Basque distinguishes location (non) from direction (nora).",example:{basque:"Non dago trena?",english:"Where is the train?"}},
  {id:"noiz",basque:"Noiz?",english:"When?",cefr:"A1",topic:"time",pronunciation:"NOYZ",notes:"Noiz? = When? Noiz etorriko zara? = When will you come? Noiz arte? = Until when? Noizbehinka = occasionally (sometimes-when). Noizean behin = from time to time. Noiznahi = whenever.",example:{basque:"Noiz etorriko zara?",english:"When will you come?"}},
  {id:"zer",basque:"Zer?",english:"What?",cefr:"A1",topic:"greetings",pronunciation:"ZER",notes:"Zer? = What? The most common question word in Basque. Zer da hori? = What is that? Zer nahi duzu? = What do you want? Zer moduz? = How are you? (what is the manner?). Zer berri? = What's new?",example:{basque:"Zer nahi duzu?",english:"What do you want?"}},
  {id:"nor",basque:"Nor?",english:"Who?",cefr:"A1",topic:"greetings",pronunciation:"NOR",notes:"Nor? = Who? Nor zara zu? = Who are you? Nor da? = Who is it? Nork = by whom (ergative case). Nori = to whom. Basque has 4 cases for who!",example:{basque:"Nor da hori?",english:"Who is that?"}},
  {id:"zergatik",basque:"Zergatik?",english:"Why?",cefr:"A2",topic:"greetings",pronunciation:"zer-GAH-teek",notes:"Zergatik = why. Zergati = reason (root). Zergatik ez? = Why not? One of the most useful question words for understanding explanations.",example:{basque:"Zergatik etorri zara?",english:"Why did you come?"}},
  {id:"zenbat",basque:"Zenbat?",english:"How many / How much?",cefr:"A1",topic:"numbers",pronunciation:"ZEN-bat",notes:"Zenbat? = How many? / How much? Zenbat da? = How much does it cost? Zenbat urte dituzu? = How old are you? Zenbat denbora? = How long? Zenbat eta gehiago... = The more...",example:{basque:"Zenbat da?",english:"How much is it?"}},
  {id:"egon",basque:"Egon",english:"To be / To stay",cefr:"B1",topic:"travel",pronunciation:"EH-gon",notes:"To be (location/state) or to stay. Dago = he/she is. Nago = I am.",example:{basque:"Gaur etxean nago.",english:"I am at home today."}},
  {id:"ibili",basque:"Ibili",english:"To walk / To go around",cefr:"B1",topic:"travel",pronunciation:"ee-BEE-lee",notes:"Ibili = to walk or go around. Ibiltzen naiz = I am walking. Nora zoaz ibiltzen? = Where are you going for a walk? Ibilaldi = walk/outing. Ibilgailua = vehicle (a walking thing). Ibili is also in this app's name: Ikasi (learn) and go (ibili)!",example:{basque:"Mendian ibiltzen naiz.",english:"I walk in the mountains."}},
  {id:"egin",basque:"Egin",english:"To do / To make",cefr:"A2",topic:"greetings",pronunciation:"EH-gheen",notes:"Egin = to do or make. One of the most versatile Basque verbs - used in hundreds of compounds. Lan egin = to work. Hitz egin = to speak. Barre egin = to laugh. Negar egin = to cry. Egin dezagun = let's do it!",example:{basque:"Zer egiten duzu?",english:"What do you do?"}},
  {id:"eraman",basque:"Eraman",english:"To carry / To take (somewhere)",cefr:"B1",topic:"travel",pronunciation:"eh-RAH-man",notes:"Eraman = to carry or take somewhere. Eramango dut = I will take it. Eramaile = carrier/bearer. Do not confuse with hartu (to take/receive).",example:{basque:"Eraman iezadazu.",english:"Take me there."}},
  {id:"hitz_egin",basque:"Hitz egin",english:"To talk / To have a conversation",cefr:"A1",topic:"greetings",pronunciation:"HEETZ EH-gheen",notes:"Hitz egin (to speak) vs mintzatu (to speak formally). Hitz literally means word - so hitz egin = to do words!",example:{basque:"Euskaraz hitz egiten duzu?",english:"Do you speak Basque?"}},
  {id:"bizi_izan",basque:"Bizi",english:"To live",cefr:"A2",topic:"travel",pronunciation:"BEE-see",notes:"Bizi = to live. Bizi naiz = I am alive / I live. Non bizi zara? = Where do you live? Bizirik = alive. Bizitza = life/livelihood.",example:{basque:"Non bizi zara?",english:"Where do you live?"}},
  {id:"pozgarria",basque:"Pozgarria",english:"Joyful / Pleasing",cefr:"B1",topic:"emotions",pronunciation:"poz-GAR-ree-ah",notes:"Pozgarria = joyful or pleasing. Poz = joy + -garri (causing). Literally joy-causing. Similar formation: harrigarria (astonishing), nekagarria (tiring).",example:{basque:"Albiste pozgarria da.",english:"It is joyful news."}},
  {id:"harrigarria",basque:"Harrigarria",english:"Amazing / Surprising",cefr:"B1",topic:"adjectives",pronunciation:"har-ree-GAR-ree-ah",notes:"Harrigarria = amazing or astonishing. Harri = stone + -garri. Turned to stone with amazement. Zer harrigarria! = How amazing!",example:{basque:"Harrigarria da!",english:"It is amazing!"}},
  {id:"gogorra",basque:"Gogorra",english:"Hard / Tough / Difficult",cefr:"B1",topic:"adjectives",pronunciation:"goh-GOR-rah",notes:"Gogorra = hard or tough, physically or emotionally. Lan gogorra = hard work. Bizia gogorra da = life is tough. Do not confuse with zaila (difficult/hard in terms of complexity). Gogortasuna = hardness/toughness.",example:{basque:"Lana gogorra da.",english:"Work is hard."}},
  {id:"alaia",basque:"Alaia",english:"Cheerful / Joyful",cefr:"A2",topic:"adjectives",pronunciation:"ah-LAI-ah",notes:"Alaia = cheerful or joyful. Alaitasuna = cheerfulness/joy. Alaigarri = cheering/uplifting. Alai ibili = to go about cheerfully. A lovely warm word.",example:{basque:"Neska alaia da.",english:"The girl is cheerful."}},
  {id:"hemen",basque:"Hemen",english:"Here",cefr:"A1",topic:"travel",pronunciation:"HEH-men",notes:"Hemen = near speaker. Hor = near listener. Han = away from both. This 3-way distinction is unique among European languages.",example:{basque:"Hemen nago.",english:"I am here."}},
  {id:"han",basque:"Han",english:"There",cefr:"A1",topic:"travel",pronunciation:"HAN",notes:"Han is used for things far from both speakers. Hango = from there. Haraino = up to there. The root appears in many place names.",example:{basque:"Han dago.",english:"It is there."}},
  {id:"hor",basque:"Hor",english:"There (nearby)",cefr:"A1",topic:"travel",pronunciation:"HOR",notes:"Basque has 3 heres/theres based on distance: hemen (near me), hor (near you), han (away from both). Like Japanese ko/so/a!",example:{basque:"Hor dago.",english:"It is there (near you)."}},
  {id:"beti",basque:"Beti",english:"Always",cefr:"A2",topic:"time",pronunciation:"BEH-tee",notes:"Beti = always. Betiere = always/forever. Betiko = eternal/permanent. Beti bezala = as always. Beti maite = always beloved.",example:{basque:"Beti pozik dago.",english:"He is always happy."}},
  {id:"inoiz",basque:"Inoiz",english:"Ever / Never",cefr:"A2",topic:"time",pronunciation:"ee-NOYTS",notes:"Inoiz = ever (questions/conditionals) or never (with ez). Inoiz joan zara? = Have you ever gone? Inoiz ez = never. Also used before superlatives: inoiz egin den film onena = the best film ever made. Do not confuse with sekula (never, emphatic).",example:{basque:"Inoiz joan zara Bilbora?",english:"Have you ever been to Bilbo?"}},
  {id:"sekula",basque:"Sekula",english:"Never",cefr:"A2",topic:"time",pronunciation:"SEH-koo-lah",notes:"Sekula = never (emphatic). Sekula ez dut ikusi = I have never ever seen it. More emphatic than inoiz ez. From Latin saecula (ages/forever).",example:{basque:"Sekula ez dut ikusi.",english:"I have never seen it."}},
  {id:"komunak",basque:"Komunak",english:"Toilet / Bathroom",cefr:"A1",topic:"travel",pronunciation:"koh-MOO-nak",notes:"Essential word for any traveller. Komunak non daude? = Where are the toilets?",example:{basque:"Komunak non daude?",english:"Where are the toilets?"}},
  {id:"taxia",basque:"Taxia",english:"Taxi",cefr:"A1",topic:"travel",pronunciation:"TAH-shee-ah",notes:"Taxi. In Basque x = sh sound, so taxia sounds like TAH-shee-ah not \"taxi\". Taxi bat nahi dut = I want a taxi. Taxis are widely available in Basque cities.",example:{basque:"Taxi bat nahi dut.",english:"I want a taxi."}},
  {id:"garagardoa",basque:"Garagardoa",english:"Beer",cefr:"A1",topic:"food",pronunciation:"gah-rah-GAR-doh-ah",notes:"Beer. Garagar (barley) + ardoa (wine) = literally barley-wine. The Basque brewing tradition is ancient. Garagardo bat mesedez = one beer please. Very popular in pintxo bars alongside txakoli.",example:{basque:"Garagardo bat mesedez.",english:"One beer please."}},
  {id:"menua",basque:"Menua",english:"Menu",cefr:"A1",topic:"food",pronunciation:"MEH-noo-ah",notes:"The menu, but also refers to the set lunch menu (menua) which is excellent value in Basque restaurants.",example:{basque:"Menua ekar iezadazu.",english:"Bring me the menu."}},
  {id:"faktura",basque:"Faktura",english:"Bill / Invoice",cefr:"A2",topic:"travel",pronunciation:"fak-TOO-rah",notes:"The bill. Faktura mesedez = The bill please. Also used for invoices in business.",example:{basque:"Faktura mesedez.",english:"The bill please."}},
  {id:"ezkerra",basque:"Ezkerra",english:"Left",cefr:"A1",topic:"travel",pronunciation:"ez-KER-rah",notes:"Left direction. Ezkerrera = to the left. Ezkerra also means left-wing in politics.",example:{basque:"Ezkerrera joan.",english:"Go left."}},
  {id:"eskuina",basque:"Eskuina",english:"Right",cefr:"A1",topic:"travel",pronunciation:"es-KWEE-nah",notes:"Right direction. Eskuinera = to the right. Eskuina also means right-wing in politics.",example:{basque:"Eskuinera joan.",english:"Go right."}},
  {id:"zuzen",basque:"Zuzen",english:"Straight / Direct / Correct",cefr:"A1",topic:"travel",pronunciation:"SOO-zen",notes:"Straight ahead or correct. Zuzen-zuzen = perfectly straight. Also means just/fair.",example:{basque:"Zuzen jarraitu.",english:"Go straight ahead."}},
  {id:"irekia",basque:"Irekia",english:"Open",cefr:"A1",topic:"travel",pronunciation:"ee-REH-kee-ah",notes:"Open. Irekita dago = it is open. Do not confuse with itxita (closed).",example:{basque:"Denda irekia dago?",english:"Is the shop open?"}},
  {id:"itxia",basque:"Itxia",english:"Closed",cefr:"A1",topic:"travel",pronunciation:"EET-chee-ah",notes:"Closed. Itxita dago = it is closed. Do not confuse with irekia (open).",example:{basque:"Denda itxita dago.",english:"The shop is closed."}},
  {id:"laguntza",basque:"Laguntza",english:"Help",cefr:"A1",topic:"greetings",pronunciation:"lah-GOON-tsah",notes:"Help or assistance. Laguntza! = Help! Laguntza behar dut = I need help.",example:{basque:"Laguntza behar dut.",english:"I need help."}},
  {id:"polizia",basque:"Polizia",english:"Police",cefr:"A1",topic:"travel",pronunciation:"poh-lee-TSEE-ah",notes:"Police. In the Basque Country the local police are called Ertzaintza.",example:{basque:"Polizia deitu behar dut.",english:"I need to call the police."}},
  {id:"bizkarra",basque:"Bizkarra",english:"Back",cefr:"A1",topic:"body",pronunciation:"beez-KAR-rah",notes:"The back. Bizkar min dut = I have back pain - a very common phrase.",example:{basque:"Bizkarra min dut.",english:"My back hurts."}},
  {id:"sabela",basque:"Sabela",english:"Stomach / Belly",cefr:"A1",topic:"body",pronunciation:"sah-BEH-lah",notes:"Sabela = stomach or belly. Sabel min dut = I have a stomach ache. Sabelalde = abdominal area. Sabelaldi = stomachful. Do not confuse with maskuria (bladder). Sabela bete = full stomach.",example:{basque:"Sabela min dut.",english:"My stomach hurts."}},
  {id:"hortzak",basque:"Hortzak",english:"Teeth",cefr:"A1",topic:"body",pronunciation:"HOR-tsak",notes:"Teeth (plural). Singular: hortza. Hortz min dut = I have toothache.",example:{basque:"Hortzak garbitu.",english:"Brush your teeth."}},
  {id:"zilarra",basque:"Zilarra",english:"Silver",cefr:"A2",topic:"colors",pronunciation:"see-LAR-rah",notes:"Silver color. Zilar also means silver the metal. Zilarrezko = made of silver.",example:{basque:"Autoa zilarra da.",english:"The car is silver."}},
  {id:"hamabi",basque:"Hamabi",english:"Twelve",cefr:"A1",topic:"numbers",pronunciation:"hah-MAH-bee",notes:"Hamar (10) + bi (2) = 12. Basque builds teen numbers as ten+number. Hamahiru=13, hamalau=14, hamabost=15.",example:{basque:"Hamabi hilabete urtean.",english:"Twelve months in a year."}},
  {id:"hamabost",basque:"Hamabost",english:"Fifteen",cefr:"A1",topic:"numbers",pronunciation:"hah-mah-BOST",notes:"Hamar (10) + bost (5) = 15. A key number - used in telling time (quarter past/to).",example:{basque:"Hamabost minutu.",english:"Fifteen minutes."}},
  {id:"hogeitahamar",basque:"Hogeita hamar",english:"Thirty",cefr:"A2",topic:"numbers",pronunciation:"HOH-gay-tah AH-mar",notes:"Hogei (20) + ta (and) + hamar (10) = 30. Basque is vigesimal - all numbers built from 20s.",example:{basque:"Hogeita hamar urte.",english:"Thirty years."}},
  {id:"lehena",basque:"Lehena",english:"First",cefr:"A2",topic:"numbers",pronunciation:"LEH-heh-nah",notes:"Lehena = first. Bigarrena = second. Hirugarrena = third. Ordinals use -garren suffix after 1st.",example:{basque:"Lehena naiz.",english:"I am first."}},
  {id:"ordu_batean",basque:"Ordu batean",english:"At one o'clock",cefr:"A2",topic:"time",pronunciation:"OR-doo bah-TEH-an",notes:"One o'clock. Ordu bietan = at two o'clock. Zer ordu da? = What time is it? Ordu also means appointment: ordu bat hartu = to make an appointment. Ordu erdia = half past. Ordutegia = timetable/schedule.",example:{basque:"Ordu batean elkartuko gara.",english:"We will meet at one o'clock."}},
  {id:"eta_erdia",basque:"Eta erdia",english:"Half past",cefr:"A2",topic:"time",pronunciation:"EH-tah ER-dee-ah",notes:"Erdia = half. Ordu bata eta erdia = half past one (literally one and a half). Ordu biak eta erdia = half past two. Eta = and links the hour and erdia (half).",example:{basque:"Ordu bata eta erdia da.",english:"It is half past one."}},
  {id:"pozten_nau",basque:"Pozten nau zu ezagutzeak",english:"Nice to meet you",cefr:"A1",topic:"greetings",pronunciation:"POZ-ten NOW soo eh-zah-GOO-tsee-ak",notes:"A full phrase: Pozten nau zu ezagutzeak = Knowing you pleases me = Nice to meet you. Poztu = to please. Nau = me (it pleases me). Zu = you. Ezagutzeak = knowing (verbal noun). This grammatically complex phrase is worth memorising whole as an essential social expression.",example:{basque:"Pozten nau zurekin hitz egiteak.",english:"Talking with you makes me happy."}},
  {id:"nongoa",basque:"Nongoa zara?",english:"Where are you from?",cefr:"A1",topic:"greetings",pronunciation:"NON-goh-ah ZAH-rah",notes:"Nongo = of where + -a (article) = where-from-person. Nongoa naiz = I am from...",example:{basque:"Nongoa zara zu?",english:"Where are you from?"}},
  {id:"zenbat_urte",basque:"Zenbat urte dituzu?",english:"How old are you?",cefr:"A1",topic:"greetings",pronunciation:"ZEN-bat OOR-teh dee-TOO-zoo",notes:"Literally how many years do you have? Basque uses have not be for age - Hogei urte ditut = I am twenty.",example:{basque:"Zenbat urte dituzu orain?",english:"How old are you now?"}},
  {id:"negozioa",basque:"Negozioa",english:"Business / Deal",cefr:"B1",topic:"work",pronunciation:"neh-goh-TSEE-oh-ah",notes:"Business or a deal. Negozio ona = good business. Negozioak egin = to do business. From Spanish negocio.",example:{basque:"Negozioa ona da.",english:"It is good business."}},
  {id:"konpetentzia",basque:"Konpetentzia",english:"Competition / Competence",cefr:"B2",topic:"work",pronunciation:"kon-peh-TEN-tsee-ah",notes:"Competition (between businesses) or competence (skill). Context determines meaning.",example:{basque:"Konpetentzia gogorra da.",english:"The competition is tough."}},
  {id:"aurrekontua",basque:"Aurrekontua",english:"Budget",cefr:"B2",topic:"work",pronunciation:"ow-reh-KON-too-ah",notes:"Budget or budget allocation. Aurrekontu mugatua = limited budget. Key in business and government.",example:{basque:"Aurrekontua txikia da.",english:"The budget is small."}},
  {id:"inbertsioa",basque:"Inbertsioa",english:"Investment",cefr:"B2",topic:"work",pronunciation:"in-ber-TSEE-oh-ah",notes:"Investment. Inbertitu = to invest. Inbertitzaile = investor. The Basque Country attracts significant foreign investment.",example:{basque:"Inbertsioa garrantzitsua da.",english:"Investment is important."}},
  {id:"arrautza",basque:"Arrautza",english:"Egg",cefr:"A1",topic:"food",pronunciation:"ar-ROW-tsah",notes:"Egg. Arrautzak = eggs (plural). Arrautza frijitua = fried egg. Arrautza opila = omelette. Essential in Basque cooking.",example:{basque:"Arrautza bat nahi dut.",english:"I want an egg."}},
  {id:"esnea",basque:"Esnea",english:"Milk",cefr:"A1",topic:"food",pronunciation:"ES-neh-ah",notes:"Milk. Esne = milk (root). Esne-beltza = black coffee with a drop of milk. Esne-gaina = cream. Common in traditional Basque breakfasts.",example:{basque:"Esnea edan dut.",english:"I drank milk."}},
  {id:"kafea",basque:"Kafea",english:"Coffee",cefr:"A1",topic:"food",pronunciation:"KAH-feh-ah",notes:"Coffee. The Basque word for a coffee with milk is 'esne-kafea' or 'cortado'. Kafea hartu = to have a coffee.",example:{basque:"Kafea hartu nahi dut.",english:"I want to have a coffee."}},
  {id:"tea",basque:"Tea",english:"Tea",cefr:"A1",topic:"food",pronunciation:"TEH-ah",notes:"Tea. Also written tee. Less common than coffee in the Basque Country but widely available.",example:{basque:"Tea beroa da.",english:"The tea is hot."}},
  {id:"opila",basque:"Opila",english:"Cake / Flatbread",cefr:"A2",topic:"food",pronunciation:"oh-PEE-lah",notes:"Opila is a traditional Basque sweet bread eaten at Easter. Tarta = cake in general usage.",example:{basque:"Opila gozoa da.",english:"The cake is delicious."}},
  {id:"fruta",basque:"Fruta",english:"Fruit",cefr:"A1",topic:"food",pronunciation:"FROO-tah",notes:"Fruit. Frutak = fruits (plural). The Basque Country is known for its apples (sagarrak) used to make sagardoa (cider).",example:{basque:"Fruta freskoa da.",english:"The fruit is fresh."}},
  {id:"besoa",basque:"Besoa",english:"Arm",cefr:"A1",topic:"body",pronunciation:"BEH-soh-ah",notes:"Arm. Beso = arm (root). Besarkada = hug (arm-full). Besoa luzatu = to extend the arm.",example:{basque:"Besoa min dut.",english:"My arm hurts."}},
  {id:"hanka",basque:"Hanka",english:"Leg",cefr:"A1",topic:"body",pronunciation:"HAN-kah",notes:"Leg or foot. Hanka = leg/foot (root). Hankak = legs. Do not confuse with oina (foot specifically). Hanka sartu = to put your foot in it (to blunder).",example:{basque:"Hanka min dut.",english:"My leg hurts."}},
  {id:"sorbalda",basque:"Sorbalda",english:"Shoulder",cefr:"A2",topic:"body",pronunciation:"sor-BAL-dah",notes:"Shoulder. Sorbaldak = shoulders. Sorbalda zabal = broad-shouldered. Used in expressions about responsibility.",example:{basque:"Sorbaldak min ditut.",english:"My shoulders hurt."}},
  {id:"hamaika",basque:"Hamaika",english:"Eleven",cefr:"A1",topic:"numbers",pronunciation:"hah-MAI-kah",notes:"Hamar (10) + ika. Hamaika also means countless/many in colloquial Basque: hamaika aldiz = countless times!",example:{basque:"Hamaika ordu da.",english:"It is eleven o'clock."}},
  {id:"ez_dut_ulertzen",basque:"Ez dut ulertzen",english:"I don't understand",cefr:"A1",topic:"greetings",pronunciation:"EZ doot oo-LER-tzen",notes:"The single most useful phrase for a language learner. Mesedez errepikatu = please repeat. Poliki esaidazu = say it slowly.",example:{basque:"Ez dut ulertzen. Mesedez errepikatu.",english:"I don't understand. Please repeat."}},
  {id:"ingelesez",basque:"Ingelesez hitz egiten duzu?",english:"Do you speak English?",cefr:"A1",topic:"greetings",pronunciation:"in-geh-LEH-sez HITS eh-GEE-ten DOO-zoo",notes:"Essential emergency phrase. Euskaraz hitz egiten duzu? = Do you speak Basque? The -z suffix means in that language.",example:{basque:"Ingelesez hitz egiten al duzu?",english:"Do you speak English?"}},
  {id:"non_dago",basque:"Non dago...?",english:"Where is...?",cefr:"A1",topic:"travel",pronunciation:"NON DAH-go",notes:"The most useful tourist phrase. Non dago geltokia? = Where is the station? Non daude komunak? = Where are the toilets?",example:{basque:"Non dago jatetxea?",english:"Where is the restaurant?"}},
  {id:"urdina_iluna",basque:"Urdina iluna",english:"Dark blue",cefr:"A2",topic:"colors",pronunciation:"oor-DEE-nah ee-LOO-nah",notes:"Dark blue. Itsas urdina = sea blue. The Basque flag (ikurrina) uses a vivid green cross on white diagonal bands on red - no dark blue, but urdina iluna appears in Basque clothing.",example:{basque:"Alkandora urdina iluna daramat.",english:"I am wearing a dark blue shirt."}},
  {id:"urdin_argia",basque:"Urdin argia",english:"Light blue / Sky blue",cefr:"A2",topic:"colors",pronunciation:"oor-DIN AR-ghee-ah",notes:"Sky blue. Argi = light as a modifier. Basque builds color shades with argia (light) or iluna (dark). Zeruko urdina = sky blue (literally sky's blue).",example:{basque:"Zerua urdin argia da gaur.",english:"The sky is light blue today."}},
  {id:"hori_iluna",basque:"Hori iluna",english:"Golden / Dark yellow",cefr:"A2",topic:"colors",pronunciation:"HOR-ee ee-LOO-nah",notes:"Dark yellow or gold. Urre kolorea = gold color (from urre = gold). Used for describing autumn leaves in the Basque mountains in October.",example:{basque:"Hostoak hori iluna dira udazkenean.",english:"The leaves are golden in autumn."}},
  {id:"berdexka",basque:"Berdexka",english:"Greenish",cefr:"A2",topic:"colors",pronunciation:"ber-DESH-kah",notes:"Greenish or olive. The -xka suffix means somewhat/a bit - a very productive Basque diminutive used to describe approximate colors and sizes.",example:{basque:"Kolore berdexka du.",english:"It has a greenish color."}},
  {id:"zuri_horia",basque:"Zuri-horia",english:"Cream / Off-white",cefr:"A2",topic:"colors",pronunciation:"ZOO-ree HOR-ee-ah",notes:"Cream or off-white. Compound colors in Basque are formed by combining two colour words. Zuri = white + horia = yellow = cream. Very common for describing walls and fabrics.",example:{basque:"Pareta zuri-horia da.",english:"The wall is cream colored."}},
  {id:"pagoa",basque:"Pagoa",english:"Beech tree",cefr:"A2",topic:"nature",pronunciation:"PAH-goh-ah",notes:"Beech tree - the most iconic tree of the Basque Country. Pago forests (pagadiak) cover the mountains. Many place names include Pago-: Pagasarri, Pagoeta. The autumn colors are spectacular.",example:{basque:"Pagoa oso ohikoa da Euskal Herrian.",english:"The beech tree is very common in the Basque Country."}},
  {id:"haritza",basque:"Haritza",english:"Oak tree",cefr:"A2",topic:"nature",pronunciation:"hah-REET-sah",notes:"Oak - sacred in Basque culture. The Gernikako Arbola (Tree of Gernika) is an ancient oak under which Basque assemblies met. Haritz = oak root. Symbol of Basque democracy and identity.",example:{basque:"Haritza Euskal Herriaren sinboloa da.",english:"The oak is a symbol of the Basque Country."}},
  {id:"aintzira",basque:"Aintzira",english:"Lake",cefr:"A2",topic:"nature",pronunciation:"ain-TSEE-rah",notes:"Lake. Aintzira is the standard literary word. The Basque Country has several mountain lakes including Urkulu and Gorbeia lakes. Different from itsasoa (the sea).",example:{basque:"Aintzira lasaia dago.",english:"The lake is calm."}},
  {id:"mendilerroa",basque:"Mendilerroa",english:"Mountain range",cefr:"A2",topic:"nature",pronunciation:"men-dee-ler-ROH-ah",notes:"Mountain range. Mendi = mountain + lerroa = row/line. The Pyrenees (Pirinioak) form the natural border. The Cantabrian range (Kantauri mendilerroa) runs along the coast.",example:{basque:"Mendilerroa ederra da.",english:"The mountain range is beautiful."}},
  {id:"ekosistema",basque:"Ekosistema",english:"Ecosystem",cefr:"B1",topic:"nature",pronunciation:"eh-koh-sis-TEH-mah",notes:"Ecosystem. Ekologia = ecology. The Basque Country spans Atlantic, mountain, and near-Mediterranean ecosystems in a small area. Biodiversity protection is a key political issue.",example:{basque:"Ekosistema babestu behar dugu.",english:"We must protect the ecosystem."}},
  {id:"biodibertsitatea",basque:"Biodibertsitatea",english:"Biodiversity",cefr:"B2",topic:"nature",pronunciation:"bee-oh-dee-ber-tsee-TAH-teh-ah",notes:"Biodiversity. The Basque Pyrenees host brown bears (hartzak), griffon vultures, and rare orchids. Biodiversity loss is a major concern in Basque environmental politics.",example:{basque:"Biodibertsitatea galtzear dago.",english:"Biodiversity is being lost."}},
  {id:"berrogeita_hamar",basque:"Berrogeita hamar",english:"Fifty",cefr:"A2",topic:"numbers",pronunciation:"ber-ROH-gay-tah AH-mar",notes:"50 = two-twenties + ten. Berrogei = 40 (two twenties) + ta (and) + hamar (10) = 50. The vigesimal system: 20, 40, 60, 80 are the key round numbers in Basque.",example:{basque:"Berrogeita hamar euro balio du.",english:"It costs fifty euros."}},
  {id:"hirurogei",basque:"Hirurogei",english:"Sixty",cefr:"A2",topic:"numbers",pronunciation:"hee-roo-ROH-gay",notes:"60 = three twenties (hiru=3 + hogei=20). The vigesimal system: laurogei=80 (four twenties). French also uses this system: soixante (60) = six-tens, quatre-vingts (80) = four-twenties.",example:{basque:"Hirurogei minutu = ordubete.",english:"Sixty minutes equals one hour."}},
  {id:"laurogeita_hamar",basque:"Laurogeita hamar",english:"Ninety",cefr:"A2",topic:"numbers",pronunciation:"low-ROH-gay-tah AH-mar",notes:"90 = four-twenties + ten. Laurogei=80, laurogeita hamar=90. The complete round numbers: hogei=20, berrogei=40, hirurogei=60, laurogei=80, ehun=100.",example:{basque:"Laurogeita hamar urte ditu.",english:"She is ninety years old."}},
  {id:"bigarrena",basque:"Bigarrena",english:"Second",cefr:"A2",topic:"numbers",pronunciation:"bee-GAR-reh-nah",notes:"Second (ordinal). The -garren suffix makes ordinals: bigarrena=2nd, hirugarrena=3rd, laurgarrena=4th. Exception: lehena (not batgarrena) for first. Bigarren postua = second place.",example:{basque:"Bigarrena naiz.",english:"I am second."}},
  {id:"hirugarrena",basque:"Hirugarrena",english:"Third",cefr:"A2",topic:"numbers",pronunciation:"hee-roo-GAR-reh-nah",notes:"Third (ordinal). Hirugarren aldiz = for the third time. Hirugarren mailan = at the third level. The -garren suffix is very regular making Basque ordinals easy once you know the cardinals.",example:{basque:"Hirugarrena da.",english:"It is third."}},
  {id:"iloba",basque:"Iloba",english:"Nephew / Niece",cefr:"A2",topic:"family",pronunciation:"ee-LOH-bah",notes:"Nephew or niece - same word for both genders in Basque. Context clarifies. Ilobak = nephews/nieces. Another example of Basque gender-neutrality in family terms.",example:{basque:"Nire iloba oso polita da.",english:"My niece is very sweet."}},
  {id:"lehengusua",basque:"Lehengusua",english:"Cousin",cefr:"A2",topic:"family",pronunciation:"leh-en-GOO-soo-ah",notes:"Cousin. Lehen = first. A common word in extended Basque families. Lehengusina = female cousin in some dialects. Basque family networks (senitartea) are traditionally very close.",example:{basque:"Nire lehengusua Bilbon bizi da.",english:"My cousin lives in Bilbo."}},
  {id:"senitartea",basque:"Senitartea",english:"Relatives / Extended family",cefr:"A2",topic:"family",pronunciation:"seh-nee-TAR-teh-ah",notes:"Relatives or extended family. Senide = relative/sibling. Basque families (etxeak) traditionally had strong clan identities tied to the family house. Senitartekoak = family members.",example:{basque:"Senitartea bildu da gaur.",english:"The family has gathered today."}},
  {id:"alargun",basque:"Alargun",english:"Widow / Widower",cefr:"B1",topic:"family",pronunciation:"ah-LAR-goon",notes:"Widow or widower - same word for both genders. Alarguna geratu = to be widowed. Another example of Basque gender-neutral vocabulary. Alarguntasuna = widowhood.",example:{basque:"Alarguna da aspaldidanik.",english:"She has been a widow for a long time."}},
  {id:"adopzioa",basque:"Adopzioa",english:"Adoption",cefr:"B1",topic:"family",pronunciation:"ah-dop-TSEE-oh-ah",notes:"Adoption. Adoptatu = to adopt. Seme-alaba adoptatu = adopted child. Basque law has progressive adoption rules. The concept of chosen family (aukeratutako familia) is valued.",example:{basque:"Adopzioa aukera ederra da.",english:"Adoption is a wonderful option."}},
  {id:"ados",basque:"Ados",english:"OK / Agreed",cefr:"A2",topic:"greetings",pronunciation:"AH-dos",notes:"OK or agreed. From Spanish de acuerdo. Ados nago = I agree. Ados gaude = we are agreed. One of the most used words in everyday Basque conversation across all age groups.",example:{basque:"Ados, bihar ikusiko dugu.",english:"OK, we will see tomorrow."}},
  {id:"agian",basque:"Agian",english:"Maybe / Perhaps",cefr:"A2",topic:"greetings",pronunciation:"AH-ghee-an",notes:"Maybe or perhaps. Agian etorriko naiz = maybe I will come. More hopeful than beharbada. Used constantly in everyday speech - a very characteristic Basque filler word.",example:{basque:"Agian bihar eguraldi ona izango da.",english:"Maybe tomorrow the weather will be good."}},
  {id:"zorionak",basque:"Zorionak",english:"Congratulations",cefr:"A2",topic:"greetings",pronunciation:"zoh-ree-OH-nak",notes:"Congratulations or happy birthday! Zorion = happiness/felicity (a single root, not zori+on). Zorioneko = lucky/happy. Zorionez = luckily/fortunately. One of the most joyful Basque words to say and hear.",example:{basque:"Zorionak zure urtebetetzeagatik!",english:"Happy birthday!"}},
  {id:"ondo_ibili",basque:"Ondo ibili",english:"Take care / Goodbye",cefr:"A2",topic:"greetings",pronunciation:"ON-do ee-BEE-lee",notes:"Take care - a warm farewell. Ondo = well + ibili = walk/go around. Literally walk well. More affectionate than agur. Used among friends. Often said when parting for a while.",example:{basque:"Ondo ibili lagun!",english:"Take care friend!"}},
  {id:"ikurrina",basque:"Ikurrina",english:"Basque flag",cefr:"A1",topic:"culture",pronunciation:"ee-koor-REE-nah",notes:"The Basque flag - green cross on white diagonal on red background. Designed in 1894 by the Arana brothers. Ikur = symbol. One of the most recognised regional flags in Europe.",example:{basque:"Ikurrina etxean daukagu.",english:"We have the Basque flag at home."}},
  {id:"sagardotegia",basque:"Sagardotegia",english:"Cider house",cefr:"A2",topic:"culture",pronunciation:"sah-gar-doh-TEH-ghee-ah",notes:"Cider house - a Basque institution. Open January-April. You eat bacalao omelette and txuleta (steak) and drink cider straight from the barrel when Txotx! is called. A must-do experience.",example:{basque:"Sagardotegira goaz!",english:"We are going to the cider house!"}},
  {id:"pintxo_pote",basque:"Pintxo-pote",english:"Bar crawl with pintxos",cefr:"A2",topic:"culture",pronunciation:"PEEN-cho POH-teh",notes:"The Basque tradition of going bar to bar eating pintxos and drinking. Common on Thursday and Friday evenings in many towns. Pote = drink. A cornerstone of Basque social life that brings communities together.",example:{basque:"Osteguna gauean pintxo-pote egingo dugu.",english:"We will do pintxo-pote on Thursday evening."}},
  {id:"txalaparta",basque:"Txalaparta",english:"Txalaparta (Basque percussion)",cefr:"B1",topic:"culture",pronunciation:"chah-lah-PAR-tah",notes:"Ancient Basque percussion instrument - two players beat wooden planks together in complex rhythms. Used at cider pressings and festivals. A unique sound found nowhere else in the world.",example:{basque:"Txalapartariak jotzea ederra da.",english:"The txalaparta players are wonderful to watch."}},
  {id:"aberri_eguna",basque:"Aberri Eguna",english:"Basque Homeland Day",cefr:"B1",topic:"culture",pronunciation:"ah-BER-ree EH-goon-ah",notes:"Basque Homeland Day - celebrated on Easter Sunday. Aberri = homeland + eguna = day. Major political and cultural celebration with demonstrations across the Basque Country and diaspora.",example:{basque:"Aberri Egunean manifestazioa dago.",english:"There is a demonstration on Basque Homeland Day."}},
  {id:"harrotasuna",basque:"Harrotasuna",english:"Pride",cefr:"B1",topic:"emotions",pronunciation:"har-roh-TAH-soo-nah",notes:"Pride (noun). Harro = proud (adjective). Harrotasunez = with pride. Do not confuse with harrokeria (arrogance/vanity) which is negative. Healthy pride in identity is central to Basque culture.",example:{basque:"Harrotasunez bizi gara.",english:"We live with pride."}},
  {id:"bakardadea",basque:"Bakardadea",english:"Loneliness / Solitude",cefr:"B1",topic:"emotions",pronunciation:"bah-kar-DAH-deh-ah",notes:"Loneliness or solitude. Bakar = alone (root). In Basque culture, solitude in nature (mendian bakarrik) is often valued positively. Bakardadean = in solitude. A contemplative word.",example:{basque:"Bakardadea sentitzen dut batzuetan.",english:"I sometimes feel loneliness."}},
  {id:"malkoak",basque:"Malkoak",english:"Tears",cefr:"B1",topic:"emotions",pronunciation:"MAL-koh-ak",notes:"Tears (plural). Malko = tear (singular). Malkoak isuri = to shed tears. Malkotan = in tears. Basque poetry and song have beautiful expressions involving tears and longing.",example:{basque:"Malkoak irteten zaizkio.",english:"Tears come from her eyes."}},
  {id:"poza_betea",basque:"Poz-betea",english:"Full of joy / Overjoyed",cefr:"B1",topic:"emotions",pronunciation:"POZ beh-TEH-ah",notes:"Overjoyed or full of joy. Poz = joy + betea = full/filled. Literally joy-filled. A more intense form of pozik (happy). Poz-betean = overjoyed. Basque can compound emotions this way.",example:{basque:"Poz-betea nago albiste honekin.",english:"I am overjoyed with this news."}},
  {id:"demokrazia",basque:"Demokrazia",english:"Democracy",cefr:"B1",topic:"society",pronunciation:"deh-moh-KRAH-tsee-ah",notes:"Democracy. Demokratikoa = democratic. Basque foral democracy under the Tree of Gernika is one of Europe's oldest traditions. The Basque Parliament has its seat in Gasteiz (Gasteiz (Vitoria)).",example:{basque:"Demokrazia garrantzitsua da.",english:"Democracy is important."}},
  {id:"hauteskundeak",basque:"Hauteskundeak",english:"Elections",cefr:"B1",topic:"society",pronunciation:"how-tes-KOON-deh-ak",notes:"Elections (plural). Hautatu = to choose. Hauteskunde orokorrak = general elections. The Basque Country holds its own elections for the Basque Parliament, separate from Spanish national elections.",example:{basque:"Hauteskundeak hurbil daude.",english:"The elections are approaching."}},
  {id:"berdintasuna",basque:"Berdintasuna",english:"Equality",cefr:"B1",topic:"society",pronunciation:"ber-din-TAH-soo-nah",notes:"Equality. Berdin = equal/same. Genero-berdintasuna = gender equality (major topic in Basque politics). Berdintasunezko = egalitarian. The Basque Country has progressive equality legislation.",example:{basque:"Berdintasuna lortu nahi dugu.",english:"We want to achieve equality."}},
  {id:"eskubideak",basque:"Eskubideak",english:"Rights",cefr:"B1",topic:"society",pronunciation:"es-koo-BEE-deh-ak",notes:"Rights (plural). Esku = hand + bide = path = rights! Oinarrizko eskubideak = fundamental rights. Hizkuntza eskubideak = language rights - a central issue in Basque politics and daily life.",example:{basque:"Eskubideak babestu behar dira.",english:"Rights must be protected."}},
  {id:"egutegia",basque:"Egutegia",english:"Calendar",cefr:"B1",topic:"time",pronunciation:"eh-goo-TEH-ghee-ah",notes:"Calendar. Egun = day + -tegi = place. Literally day-holder. Egutegian markatu = to mark on the calendar. Euskal egutegia includes traditional Basque festivals and celebrations.",example:{basque:"Egutegia ikusi behar dut.",english:"I need to look at the calendar."}},
  {id:"urtaroak",basque:"Urtaroak",english:"Seasons of the year",cefr:"B1",topic:"time",pronunciation:"oor-TAH-roh-ak",notes:"Urtaroak = seasons (plural). Urtaroa = season (singular). Udaberria=spring, Uda=summer, Udazkena=autumn, Negua=winter. The Basque Country is known for changeable weather - four seasons sometimes in one day.",example:{basque:"Lau urtaroak daude.",english:"There are four seasons."}},
  {id:"udaberria",basque:"Udaberria",english:"Spring",cefr:"A2",topic:"time",pronunciation:"oo-dah-BER-ree-ah",notes:"Spring. Uda = summer + berria = new. Literally new summer. Spring arrives later in the Basque mountains. Udaberrian = in spring. Flowers (loreak) bloom in the valleys from March.",example:{basque:"Udaberrian loreak agertzen dira.",english:"In spring the flowers appear."}},
  {id:"uda",basque:"Uda",english:"Summer",cefr:"A2",topic:"time",pronunciation:"OO-dah",notes:"Summer. Udan = in summer. Uda-oporretan = on summer holidays. Basque summers are mild - rarely very hot due to Atlantic influence. Donostia (San Sebastián)'s beaches are packed in July and August.",example:{basque:"Udan itsasora joaten gara.",english:"In summer we go to the sea."}},
  {id:"udazkena",basque:"Udazkena",english:"Autumn / Fall",cefr:"A2",topic:"time",pronunciation:"oo-daz-KEH-nah",notes:"Autumn. Uda = summer + azkena = last. Literally last summer. Udazkenean = in autumn. The beech forests turn golden. Mushroom season (perretxiko garaia) begins in October.",example:{basque:"Udazkena ederrena da.",english:"Autumn is the most beautiful."}},
  {id:"negua",basque:"Negua",english:"Winter",cefr:"A2",topic:"time",pronunciation:"NEH-goo-ah",notes:"Winter. Neguan = in winter. Neguak = winters. Snow (elurra) in the mountains, rain on the coast. Ski resorts operate in the Pyrenees. Neguko jaiak = winter festivals.",example:{basque:"Neguan hotza egiten du.",english:"In winter it is cold."}},
  {id:"lankidea",basque:"Lankidea",english:"Colleague",cefr:"A2",topic:"work",pronunciation:"lan-KEE-deh-ah",notes:"Colleague or coworker. Lan = work + kidea = companion. Lankide ona = good colleague. Lankidego = staff/team. Essential word for anyone working in a Basque-speaking environment.",example:{basque:"Nire lankideak oso onak dira.",english:"My colleagues are very good."}},
  {id:"hitzordua",basque:"Hitzordua",english:"Appointment",cefr:"A2",topic:"work",pronunciation:"hits-OR-doo-ah",notes:"Appointment or meeting. Hitz = word + ordua = hour. Literally word-time - a time to keep your word. Hitzordua eman = to give an appointment. Also used for doctor appointments.",example:{basque:"Bihar hitzordua daukat.",english:"I have an appointment tomorrow."}},
  {id:"txostena",basque:"Txostena",english:"Report",cefr:"B1",topic:"work",pronunciation:"choh-STEH-nah",notes:"Report or document. Txostena idatzi = to write a report. Urteko txostena = annual report. Very common in professional Basque - government and business documents are required in Basque.",example:{basque:"Txostena prestatu behar dut.",english:"I need to prepare the report."}},
  {id:"kontratua",basque:"Kontratua",english:"Contract",cefr:"B1",topic:"work",pronunciation:"kon-TRAH-too-ah",notes:"Contract. Kontratua sinatu = to sign a contract. Lan-kontratua = work contract. Aldi baterako kontratua = temporary contract. Key vocabulary for job seekers and HR professionals.",example:{basque:"Kontratua sinatu dut.",english:"I have signed the contract."}},
  {id:"arraroa",basque:"Arraroa",english:"Strange / Unusual",cefr:"B1",topic:"adjectives",pronunciation:"ar-RAH-roh-ah",notes:"Strange or unusual. Arraro = strangely. Arraroa iruditzen zait = it seems strange to me. More negative than bitxia (curious/interesting). Arrotasuna = strangeness.",example:{basque:"Arraroa da hori.",english:"That is strange."}},
  {id:"bitxia",basque:"Bitxia",english:"Curious / Interesting",cefr:"B1",topic:"adjectives",pronunciation:"BEET-chee-ah",notes:"Curious, interesting or slightly odd - in a positive way. Bitxi = jewel (also!). Bitxikeriak = curiosities. More positive than arraroa. Zer bitxia! = How interesting! Common in conversation.",example:{basque:"Zer bitxia den hori!",english:"How curious that is!"}},
  {id:"nekagarria",basque:"Nekagarria",english:"Tiring / Exhausting",cefr:"B1",topic:"adjectives",pronunciation:"neh-kah-GAR-ree-ah",notes:"Tiring or exhausting. Neka + -garri (causing). The -garri suffix: interesgarria=interesting, harrigarria=amazing, nekagarria=tiring. Once you know -garri you can understand many adjectives.",example:{basque:"Lan hori oso nekagarria da.",english:"That work is very tiring."}},
  {id:"jasanezina",basque:"Jasanezina",english:"Unbearable",cefr:"B2",topic:"adjectives",pronunciation:"yah-sah-NEH-tsee-nah",notes:"Unbearable. Jasan = to bear/endure + ezin = cannot. Literally cannot-be-endured. Jasangarria = bearable (opposite). Shows how Basque systematically builds complex meanings from roots.",example:{basque:"Mina jasanezina da.",english:"The pain is unbearable."}},
  {id:"ezinbestekoa",basque:"Ezinbestekoa",english:"Essential / Indispensable",cefr:"B2",topic:"adjectives",pronunciation:"eh-tseen-bes-TEH-koh-ah",notes:"Essential or indispensable. Ezin = cannot + beste = other. Literally cannot-be-otherwise. A key word in formal writing, speeches, and political discourse in the Basque Country.",example:{basque:"Euskara ezinbestekoa da.",english:"Basque is essential."}},
  {id:"pasaportea",basque:"Pasaportea",english:"Passport",cefr:"A2",topic:"travel",pronunciation:"pah-sah-POR-teh-ah",notes:"Passport. Pasaportea galdu dut = I have lost my passport. Pasaportea berritu = to renew a passport. Spain is in the Schengen Area - EU visitors do not need a visa.",example:{basque:"Pasaportea non dago?",english:"Where is the passport?"}},
  {id:"turismoa",basque:"Turismoa",english:"Tourism",cefr:"A2",topic:"travel",pronunciation:"too-REEZ-moh-ah",notes:"Tourism. Turista = tourist. Turismo bulegoa = tourist office. The Basque Country receives millions of tourists for food culture, the Guggenheim Bilbo (Bilbao), and the Camino de Santiago.",example:{basque:"Turismoa oso garrantzitsua da hemen.",english:"Tourism is very important here."}},
  {id:"aterpea",basque:"Aterpea",english:"Shelter / Refuge",cefr:"B1",topic:"travel",pronunciation:"ah-TER-peh-ah",notes:"Shelter or refuge. Mountain shelters (mendiko aterpeak) are essential for hikers. The GR11 and GR10 long-distance paths cross the Basque Pyrenees with huts every few hours.",example:{basque:"Aterpea bilatzen ari naiz.",english:"I am looking for shelter."}},
  {id:"hamahiru",basque:"Hamahiru",english:"Thirteen",cefr:"A2",topic:"numbers",pronunciation:"hah-mah-EE-roo",notes:"Hamar (10) + hiru (3) = 13. The teen numbers follow this pattern: hamabi=12, hamahiru=13, hamalau=14, hamabost=15, hamasei=16, hamazazpi=17, hamazortzi=18, hemeretzi=19.",example:{basque:"Hamahiru urte ditu.",english:"He is thirteen years old."}},
  {id:"hamalau",basque:"Hamalau",english:"Fourteen",cefr:"A2",topic:"numbers",pronunciation:"hah-mah-LOW",notes:"Hamar (10) + lau (4) = 14. Once you know the single digits and hamar, all Basque teen numbers follow perfectly: hamar + digit.",example:{basque:"Hamalau egun barru.",english:"In fourteen days."}},
  {id:"berrogei",basque:"Berrogei",english:"Forty",cefr:"A2",topic:"numbers",pronunciation:"ber-ROH-gay",notes:"40 = two twenties (bi + hogei). The vigesimal system: hogei=20, berrogei=40, hirurogei=60, laurogei=80. French also counts this way: quatre-vingts = 80.",example:{basque:"Berrogei urte ditu.",english:"She is forty years old."}},
  {id:"hirurogeita_hamar",basque:"Hirurogeita hamar",english:"Seventy",cefr:"A2",topic:"numbers",pronunciation:"hee-roo-ROH-gay-tah hah-MAR",notes:"70 = three-twenties + ten. Hirurogei (60) + ta (and) + hamar (10) = 70. The complete round numbers in Basque vigesimal: 20,40,60,80,100.",example:{basque:"Hirurogeita hamar euro.",english:"Seventy euros."}},
  {id:"laurogei",basque:"Laurogei",english:"Eighty",cefr:"A2",topic:"numbers",pronunciation:"low-ROH-gay",notes:"80 = four twenties (lau=4 + hogei=20). Compare: French quatre-vingts = 80. The Basque and Breton vigesimal systems may share ancient roots.",example:{basque:"Laurogei kilogramo.",english:"Eighty kilograms."}},
  {id:"hamasei",basque:"Hamasei",english:"Sixteen",cefr:"A2",topic:"numbers",pronunciation:"hah-mah-SAY",notes:"Hamar (10) + sei (6) = 16. Hamasei sounds like 'hammer-say'. The teen series: hamabi=12, hamahiru=13, hamalau=14, hamabost=15, hamasei=16.",example:{basque:"Hamasei urte ditu.",english:"She is sixteen years old."}},
  {id:"hamazazpi",basque:"Hamazazpi",english:"Seventeen",cefr:"A2",topic:"numbers",pronunciation:"hah-mah-ZAZ-pee",notes:"Hamar (10) + zazpi (7) = 17. Note the zz = th sound (like English 'this'). Hamazazpi is one of the harder teen numbers to pronounce.",example:{basque:"Hamazazpi egun barru.",english:"In seventeen days."}},
  {id:"hamazortzi",basque:"Hamazortzi",english:"Eighteen",cefr:"A2",topic:"numbers",pronunciation:"hah-mah-ZOR-tsee",notes:"Hamar (10) + zortzi (8) = 18. Hamazortzi is the longest teen number. The -zortzi ending has the same -tzi you see in zortzi (8).",example:{basque:"Hamazortzi urte ditut.",english:"I am eighteen years old."}},
  {id:"hemeretzi",basque:"Hemeretzi",english:"Nineteen",cefr:"A2",topic:"numbers",pronunciation:"heh-meh-RET-see",notes:"19 = hemeretzi. Note: this does NOT follow the hamar+digit pattern! Hemeretzi is an irregular form. Compare French dix-neuf (10+9) vs Basque irregular hemeretzi.",example:{basque:"Hemeretzi euro kostatzen da.",english:"It costs nineteen euros."}},
  {id:"barazkia",basque:"Barazkia",english:"Vegetable",cefr:"A1",topic:"food",pronunciation:"bah-RASK-ee-ah",notes:"Vegetable. Barazki = vegetable (root). Barazkiak = vegetables (plural). Barazki salda = vegetable broth. The Basque markets (merkatuak) are famous for fresh local vegetables, especially peppers and tomatoes.",example:{basque:"Barazkiak osasuntsuak dira.",english:"Vegetables are healthy."}},
  {id:"haragia",basque:"Haragia",english:"Meat",cefr:"A1",topic:"food",pronunciation:"hah-RAH-ghee-ah",notes:"Meat. Haragi = meat (root). Txuleta = steak (a Basque speciality). Txerri haragia = pork. Behi haragia = beef. Haragia erretzea = grilling meat. The txuleta at a sagardotegi is legendary.",example:{basque:"Haragia gustatzen zait.",english:"I like meat."}},
  {id:"txerria",basque:"Txerria",english:"Pig / Pork",cefr:"A2",topic:"food",pronunciation:"cheh-REE-ah",notes:"Pig or pork. Txerri haragia = pork. Txistorra = Basque spicy sausage made from pork and paprika - eaten at every festival. Txerri-festa = pig festival, a traditional winter celebration in rural areas.",example:{basque:"Txistorra txerriarekin egiten da.",english:"Txistorra is made from pork."}},
  {id:"olioa",basque:"Olioa",english:"Oil",cefr:"A1",topic:"food",pronunciation:"oh-LEE-oh-ah",notes:"Oil. Oliba olioa = olive oil - essential in Basque cooking. Olioa berotzea = to heat the oil. Olio = oil root. Used in pil-pil sauce, the famous Basque emulsified cod dish.",example:{basque:"Oliba olioa erabiltzen dut.",english:"I use olive oil."}},
  {id:"baratxuria",basque:"Baratxuria",english:"Garlic",cefr:"A1",topic:"food",pronunciation:"bah-ratch-OO-ree-ah",notes:"Garlic. Baratxuri = garlic (root). Indispensable in Basque cooking - in salsa verde, pil-pil, and almost every sauce. Baratxuri ale bat = one clove of garlic. Often fried in oil first to flavor a dish.",example:{basque:"Baratxuria gehitu dut saltsan.",english:"I have added garlic to the sauce."}},
  {id:"piperra",basque:"Piperra",english:"Pepper",cefr:"A1",topic:"food",pronunciation:"pee-PER-rah",notes:"Pepper. Piperrak = peppers (plural). Piper gorria = red pepper. Piper berdea = green pepper. The piperada (Basque pepper and tomato stew) is a classic dish. Gernikako piperrak = Gernika peppers, small green peppers unique to the Basque Country.",example:{basque:"Piperra gustuko dut.",english:"I like pepper."}},
  {id:"patata",basque:"Patata",english:"Potato",cefr:"A1",topic:"food",pronunciation:"pah-TAH-tah",notes:"Potato. The same word as Spanish patata. Patata tortilla = potato omelette, ubiquitous in Basque bars. Patata frijituak = fried potatoes. The Basque Country grows distinctive small potatoes in the interior valleys.",example:{basque:"Tortilla patatakin egiten da.",english:"The omelette is made with potato."}},
  {id:"arroza",basque:"Arroza",english:"Rice",cefr:"A1",topic:"food",pronunciation:"ah-ROH-sah",notes:"Rice. From Spanish arroz via Arabic ar-ruzz. Arrozarekin = with rice. Arroz con leche (arrozesnea) = rice pudding. Less central than in Spanish cuisine but used in Basque seafood dishes.",example:{basque:"Arrozarekin jan dut.",english:"I ate with rice."}},
  {id:"prestatu",basque:"Prestatu",english:"To prepare / To cook",cefr:"A2",topic:"food",pronunciation:"pres-TAH-too",notes:"Prestatu = to prepare or get ready. Afaria prestatu = to prepare dinner. Janaria prestatu = to prepare food. Also used outside cooking: bidaia prestatu = to prepare a trip. Very common verb in everyday Basque.",example:{basque:"Afaria prestatzen ari naiz.",english:"I am preparing dinner."}},
  {id:"jan",basque:"Jan",english:"To eat",cefr:"A1",topic:"food",pronunciation:"YAN",notes:"To eat - one of the most essential verbs. Jan = eat (also used as noun: janaria = food). Zer jan duzu? = What did you eat? Jaten ari naiz = I am eating. Jan eta edan = eat and drink. The j is a y sound.",example:{basque:"Zer jan nahi duzu?",english:"What do you want to eat?"}},
  {id:"edan",basque:"Edan",english:"To drink",cefr:"A1",topic:"food",pronunciation:"EH-dan",notes:"To drink. Zer edan nahi duzu? = What do you want to drink? Edaten ari naiz = I am drinking. Jan eta edan = eat and drink. Edaria = drink (noun). Edateko ura = drinking water.",example:{basque:"Zer edan nahi duzu?",english:"What do you want to drink?"}},
  {id:"begia",basque:"Begia",english:"Eye",cefr:"A1",topic:"body",pronunciation:"BEH-ghee-ah",notes:"Eye (singular). Begiak = eyes (plural). Begi urdin = blue eye. Begi on = good eye / lucky charm. Begiratu = to look. Begikoa = attractive/pleasing. Begi onez ikusi = to look favourably on something.",example:{basque:"Begia min dut.",english:"My eye hurts."}},
  {id:"lepoa",basque:"Lepoa",english:"Neck",cefr:"A1",topic:"body",pronunciation:"LEH-poh-ah",notes:"Neck. Lepo = neck (root). Lepokoa = necklace (neck-thing). Lepoa mindu = stiff neck. Lepora hartu = to put on one's shoulders (to take responsibility). Lepo arte! = up to the neck = very busy.",example:{basque:"Lepoa min dut.",english:"My neck hurts."}},
  {id:"belaunak",basque:"Belaunak",english:"Knees",cefr:"A2",topic:"body",pronunciation:"beh-LOW-nak",notes:"Knees (plural). Belaun = knee (singular). Belaunetan = on one's knees. Belaunikatu = to kneel. Belaunaldi = generation (knee-age = a kneeling span of time - a lovely etymology).",example:{basque:"Belaunak min ditut.",english:"My knees hurt."}},
  {id:"hatzak",basque:"Hatzak",english:"Fingers",cefr:"A2",topic:"body",pronunciation:"HAH-tsak",notes:"Fingers (plural). Hatz = finger (singular). Oinhatza = toe (foot-finger). Hatz erakuslea = index finger (pointing finger). Hatz txikia = little finger. Hatzaz erakutsi = to point at.",example:{basque:"Hatzak garbitu behar ditut.",english:"I need to clean my fingers."}},
  {id:"maskuria",basque:"Maskuria",english:"Bladder",cefr:"A2",topic:"body",pronunciation:"mas-KOO-ree-ah",notes:"Maskuria = bladder (gernu-maskuria = urinary bladder). Also in traditional culture: maskuri dantza = bladder dance, a Basque carnival tradition. Do not confuse with sabela (stomach/belly) or sabelaldea (abdominal area).",example:{basque:"Gernu-maskurian arazoak ditut.",english:"I have problems with my bladder."}},
  {id:"gibela",basque:"Gibela",english:"Liver",cefr:"B1",topic:"body",pronunciation:"ghee-BEH-lah",notes:"Liver. Gibel = liver (root). Medically important and culturally interesting - gibela atzetik = from behind/at the back (gibelera = backwards). Basque cuisine features foie gras (pato gibela) in fine dining.",example:{basque:"Gibela aztertu behar dut.",english:"I need to get my liver checked."}},
  {id:"birika",basque:"Birika",english:"Lung",cefr:"B1",topic:"body",pronunciation:"bee-REE-kah",notes:"Lung. Birikak = lungs (plural). Biriketako gaixotasuna = lung disease. Birika osasuntsuak = healthy lungs. Birika beteak = full lungs. Important medical vocabulary for healthcare settings.",example:{basque:"Birikak garbi ditu.",english:"Her lungs are clear."}},
  {id:"txoria",basque:"Txoria",english:"Bird",cefr:"A1",topic:"nature",pronunciation:"CHOH-ree-ah",notes:"Bird. Txori = bird (root). Txoria kaiolan = the bird in a cage - the title of the famous Basque song by Mikel Laboa, iconic in Basque culture. Txoritegi = aviary. Txori kantua = birdsong.",example:{basque:"Txoria zuhaitzean dago.",english:"The bird is in the tree."}},
  {id:"ardia",basque:"Ardia",english:"Sheep",cefr:"A1",topic:"nature",pronunciation:"AR-dee-ah",notes:"Sheep. Ardi = sheep (root). Central to Basque rural life - Idiazabal cheese (Idiazabal gazta) is made from sheep's milk. Artzaina = shepherd. The Basque shepherd tradition is ancient and still alive in the Pyrenees.",example:{basque:"Ardiak mendian daude.",english:"The sheep are in the mountains."}},
  {id:"behia",basque:"Behia",english:"Cow",cefr:"A1",topic:"nature",pronunciation:"BEH-ee-ah",notes:"Cow. Behi = cow (root). Behi esnea = cow's milk. Behi haragia = beef. Behiak Basque farms are typical in the green valleys. Behiaren = of the cow.",example:{basque:"Behiak belardian daude.",english:"The cows are in the meadow."}},
  {id:"otsoa",basque:"Otsoa",english:"Wolf",cefr:"A2",topic:"nature",pronunciation:"OT-soh-ah",notes:"Wolf. Otso = wolf (root). Wolves returned to the Basque Pyrenees in recent decades - a controversial topic. In Basque mythology the wolf (otso) appears in many legends. Otsaila = February (wolf-month - when wolves were most active).",example:{basque:"Otsoa basoan bizi da.",english:"The wolf lives in the forest."}},
  {id:"hartza",basque:"Hartza",english:"Bear",cefr:"A2",topic:"nature",pronunciation:"HAR-tsah",notes:"Bear. Hartz = bear (root). Brown bears (hartz arrea) survive in the Pyrenees near the Basque Country. Highly protected and controversial with farmers. Hartzak = bears (plural). Hartzgune = bear territory.",example:{basque:"Hartza Pirinioetan bizi da.",english:"The bear lives in the Pyrenees."}},
  {id:"saguzarra",basque:"Saguzarra",english:"Bat",cefr:"A2",topic:"nature",pronunciation:"sah-goo-ZAR-rah",notes:"Bat. Sagu = mouse + zar(ra) = old = old mouse! One of the most charming Basque etymologies. Saguzarrak = bats (plural). Gaueko hegaztia = night flyer. Saguzarrek intsektuak jaten dituzte = bats eat insects.",example:{basque:"Saguzarrak gauez hegan egiten dute.",english:"Bats fly at night."}},
  {id:"igela",basque:"Igela",english:"Frog",cefr:"A2",topic:"nature",pronunciation:"ee-GEH-lah",notes:"Frog. Igel = frog (root). Common in Basque streams and wetlands. Igela uretatik kanpo = out of water (like a fish out of water). Igelaren saltoa = the frog's jump.",example:{basque:"Igela ibaiaren ondoan dago.",english:"The frog is near the river."}},
  {id:"dibortzioa",basque:"Dibortzioa",english:"Divorce",cefr:"B1",topic:"family",pronunciation:"dee-bor-TSEE-oh-ah",notes:"Divorce. Dibortziatu = to divorce. Dibortziatua = divorced. From Spanish divorcio. Spain legalised divorce in 1981 - relatively recent. Basque divorce rates are similar to European averages.",example:{basque:"Dibortzioa eskaera egin dute.",english:"They have filed for divorce."}},
  {id:"gurasoak",basque:"Gurasoak",english:"Parents",cefr:"A1",topic:"family",pronunciation:"goo-RAH-soh-ak",notes:"Parents (plural). Guraso = parent (singular). Gurasoek = by the parents. Guraso ezkondugabeak = unmarried parents. Gurasoen etxea = the parents' house. One of the most important family words.",example:{basque:"Nire gurasoak Gasteizen bizi dira.",english:"My parents live in Gasteiz (Vitoria)."}},
  {id:"haurra",basque:"Haurra",english:"Child / Baby",cefr:"A1",topic:"family",pronunciation:"HOW-rah",notes:"Child or baby. Haur = child (root). Haurtzaro = childhood. Haurra zaintzea = to look after a child. Haur eskola = nursery school. Haurrak = children (plural). Haurrak behar ditu = she needs children.",example:{basque:"Haurra lo dago.",english:"The child is sleeping."}},
  {id:"gaztea",basque:"Gaztea",english:"Young / Youth",cefr:"A1",topic:"adjectives",pronunciation:"gaz-TEH-ah",notes:"Young or a young person. Gazte = young (root). Gazteak = young people. Gazteria = youth (collective). Gaztetxea = youth center (young-house). Gazteakuasoa = when they were young. Gaztetasuna = youth/youthfulness.",example:{basque:"Nire anaia gaztea da.",english:"My brother is young."}},
  {id:"sumindura",basque:"Sumindura",english:"Frustration / Resentment",cefr:"B2",topic:"emotions",pronunciation:"soo-min-DOO-rah",notes:"Frustration or deep resentment. Sumitu = to be offended or irritated. Sumin = irritation. Sumigarria = irritating/infuriating. A stronger word than haserre (anger) - suggests a simmering resentment rather than acute anger.",example:{basque:"Sumindura handia sentitzen dut.",english:"I feel great frustration."}},
  {id:"damua",basque:"Damua",english:"Regret / Remorse",cefr:"B2",topic:"emotions",pronunciation:"DAH-moo-ah",notes:"Regret or remorse. Damutu = to regret. Damuz = with regret. Damua sentitu = to feel remorse. Damu naiz = I am sorry/I regret it. More profound than barkatu (excuse me) - damua involves genuine remorse.",example:{basque:"Damua sentitzen dut.",english:"I feel regret."}},
  {id:"maitasuna",basque:"Maitasuna",english:"Love (noun)",cefr:"B1",topic:"emotions",pronunciation:"mai-tah-SOO-nah",notes:"Love (noun). Maitatu = to love. Maitea = loved one/beloved. Maite zaitut = I love you. Maitasunezko = of love/loving. Maitasuna is the abstract noun - compare with maite (the adjective/verb). Central to Basque poetry and song.",example:{basque:"Maitasuna indartsua da.",english:"Love is powerful."}},
  {id:"epela",basque:"Epela",english:"Warm / Lukewarm",cefr:"A2",topic:"adjectives",pronunciation:"EH-peh-lah",notes:"Warm or lukewarm. Epel = lukewarm (root). Between beroa (hot) and hotza (cold). Epelak = mild weather. Ura epela = lukewarm water. Epeltasuna = warmth. Basque weather is often described as epela - mild and Atlantic.",example:{basque:"Ura epela da.",english:"The water is lukewarm."}},
  {id:"biluzia",basque:"Biluzia",english:"Naked / Bare",cefr:"B1",topic:"adjectives",pronunciation:"bee-LOO-tsee-ah",notes:"Naked or bare. Biluz = naked (root). Biluzi = to undress. Biluzirik = naked (adverb). Mendi biluzia = bare mountain. Used both literally and figuratively - egia biluzia = the naked truth.",example:{basque:"Zuhaitza biluzia dago neguan.",english:"The tree is bare in winter."}},
  {id:"bizia",basque:"Bizia",english:"Lively / Vivid / Intense",cefr:"B1",topic:"adjectives",pronunciation:"BEE-tsee-ah",notes:"Lively, vivid, or intense (adjective). Do not confuse with bizi (to live, verb). Bizi-bizia = very lively. Kolore bizia = vivid color. Musika bizia = lively music. Bizitasuna = liveliness. The same root gives us bizitza (life) and bizirik (alive).",example:{basque:"Kolore bizia du.",english:"It has a vivid color."}},
  {id:"antzinatekoa",basque:"Antzinatekoa",english:"Ancient / From long ago",cefr:"B2",topic:"adjectives",pronunciation:"ant-tsee-nah-TEH-koh-ah",notes:"Ancient or from ancient times. Antzina = long ago. Antzinatekoa = of antiquity. The Basque language itself is often described as antzinatekoa - one of the oldest languages in Europe with no known relatives.",example:{basque:"Euskara hizkuntza antzinatekoa da.",english:"Basque is an ancient language."}},
  {id:"pixka_bat",basque:"Pixka bat",english:"A little / A bit",cefr:"A1",topic:"greetings",pronunciation:"PEESH-kah bat",notes:"A little or a bit. Pixka = small amount. Pixka bat gehiago = a little more. Euskara pixka bat badakit = I know a little Basque. The most useful phrase for a beginner - shows humility and willingness to try.",example:{basque:"Euskara pixka bat badakit.",english:"I know a little Basque."}},
  {id:"poliki",basque:"Poliki",english:"Slowly / Gently",cefr:"A1",topic:"greetings",pronunciation:"POH-lee-kee",notes:"Slowly or gently. Poliki hitz egin = speak slowly please. Poliki-poliki = very slowly/little by little. Also means nicely or gently. Poliki esaidazu = say it slowly to me. Essential for learners asking native speakers to slow down.",example:{basque:"Poliki hitz egin mesedez.",english:"Please speak slowly."}},
  {id:"berriz",basque:"Berriz",english:"Again / Once more",cefr:"A1",topic:"greetings",pronunciation:"BER-ees",notes:"Again or once more. Berriz esan = say again. Berriz etorri = come again. Berriz ere = once again/yet again. Berriro = again (variant). Essential for language learners who need things repeated.",example:{basque:"Berriz esan mesedez.",english:"Please say it again."}},
  {id:"badakit",basque:"Badakit",english:"I know",cefr:"A1",topic:"greetings",pronunciation:"bah-DAH-keet",notes:"I know. Ba- is an affirmative prefix + dakit (I know, from jakin). Ez dakit = I don't know. Badakizu? = Do you know? Bai, badakit = Yes, I know. The ba- prefix adds affirmation and is very characteristic of Basque.",example:{basque:"Badakit non dagoen.",english:"I know where it is."}},
  {id:"erre",basque:"Erre",english:"To grill / To roast / To smoke",cefr:"B1",topic:"food",pronunciation:"ER-reh",notes:"Erre = to grill, roast, or smoke. Txuleta errea = grilled steak. Erretegia = grill restaurant. Erre also means to burn or to smoke cigarettes. Egurra erre = to burn wood. The rr = rolled r.",example:{basque:"Haragia erretzen dut.",english:"I am grilling the meat."}},
  {id:"egosi",basque:"Egosi",english:"To boil / To cook",cefr:"B1",topic:"food",pronunciation:"eh-GOH-see",notes:"Egosi = to boil or cook. Arrautza egosia = boiled egg. Barazkiak egosi = boil the vegetables. Egosi ongi = cook well. A fundamental cooking verb alongside erre (grill) and frijitu (fry).",example:{basque:"Patatak egosi ditut.",english:"I have boiled the potatoes."}},
  {id:"frijitu",basque:"Frijitu",english:"To fry",cefr:"B1",topic:"food",pronunciation:"free-YEET-too",notes:"Frijitu = to fry. Arrautza frijitua = fried egg. Frijitua = fried (adjective). Patata frijituak = chips/fries. From Spanish freír. Frijitegian = in the fryer. Very common in Basque bar cooking.",example:{basque:"Arrautza bat frijitu nahi dut.",english:"I want to fry an egg."}},
  {id:"gatz",basque:"Gatza",english:"Salt",cefr:"A1",topic:"food",pronunciation:"GAT-sah",notes:"Gatza = salt. Gatz = salt (root). Gazia = salty. Gazta = cheese literally means salted thing! Gatzontzia = salt cellar. Salt was historically precious - Basque salt trade routes were important in medieval times.",example:{basque:"Gatza gehitu behar diozu.",english:"You need to add salt to it."}},
  {id:"azukrea",basque:"Azukrea",english:"Sugar",cefr:"A1",topic:"food",pronunciation:"ah-SOO-kreh-ah",notes:"Azukrea = sugar. From Arabic as-sukkar via Spanish azúcar. Azukre = sugar (root). Azukre gehiegi = too much sugar. Gozoa = sweet - a word often associated with azukrea.",example:{basque:"Kafean azukrea nahi duzu?",english:"Do you want sugar in your coffee?"}},
  {id:"merluzea",basque:"Merluzea",english:"Hake",cefr:"A2",topic:"food",pronunciation:"mer-LOO-tseh-ah",notes:"Merluzea = hake, the most popular fish in Basque cooking. Merluza salda = hake broth. Merluzea salsa berdean = hake in green sauce (salsa verde) - a classic Basque dish. From Spanish merluza.",example:{basque:"Merluzea salsa berdean jan dut.",english:"I ate hake in green sauce."}},
  {id:"txuleta",basque:"Txuleta",english:"Steak / Chop",cefr:"A2",topic:"food",pronunciation:"choo-LEH-tah",notes:"Txuleta = steak or chop. The txuleta de vaca (beef txuleta) is legendary in Basque cuisine - a thick bone-in ribeye from old dairy cows, grilled over charcoal. A centrepiece of sagardotegi meals.",example:{basque:"Txuleta erreak ongi eginda nahi dut.",english:"I want the steak well done."}},
  {id:"esnegaina",basque:"Esnegaina",english:"Cream",cefr:"A2",topic:"food",pronunciation:"es-neh-GAI-nah",notes:"Esnegaina = cream (also written esne-gaina). Esne = milk + gaina = top. Literally the top of the milk. Confirmed by Elhuyar corpus. Esnegain urtu = melted cream. Used in Basque desserts including goxua and intxaursaltsa. Krema is also used in modern Basque.",example:{basque:"Esnegaina gehitu dut.",english:"I added cream."}},
  {id:"intxaursaltsa",basque:"Intxaursaltsa",english:"Walnut cream sauce",cefr:"B1",topic:"food",pronunciation:"een-chow-SALT-sah",notes:"Intxaursaltsa = traditional Basque walnut dessert sauce. Intxaur = walnut + saltsa = sauce. Made from walnuts, milk, sugar, and cinnamon (kanela). Eaten warm at Christmas Eve dinner - over 150 years old. One of the oldest Basque desserts, from Gipuzkoa.",example:{basque:"Intxaursaltsa gozoa da.",english:"The walnut sauce is delicious."}},
  {id:"ukondoa",basque:"Ukondoa",english:"Elbow",cefr:"A2",topic:"body",pronunciation:"oo-KON-doh-ah",notes:"Ukondoa = elbow. Ukondo = elbow (root). Ukondoaz jo = to elbow/nudge. Ukondo min dut = my elbow hurts. In Basque ukondoa is also used metaphorically - ukondoka = by elbowing through.",example:{basque:"Ukondoa min dut.",english:"My elbow hurts."}},
  {id:"eskumuturra",basque:"Eskumuturra",english:"Wrist",cefr:"A2",topic:"body",pronunciation:"es-koo-moo-TOOR-rah",notes:"Eskumuturra = wrist. Esku = hand + mutur = snout/tip. Literally the tip of the hand - a vivid description. Eskumutur min = wrist pain. Erlojua eskumuturran = watch on the wrist.",example:{basque:"Eskumuturra apurtu dut.",english:"I broke my wrist."}},
  {id:"bularraldea",basque:"Bularraldea",english:"Chest",cefr:"A2",topic:"body",pronunciation:"boo-lar-AL-deh-ah",notes:"Bularraldea = chest. Bular = chest/breast (root). Bularra = chest. Bularreko min = chest pain. Bularreko hezurra = rib. Bularkoi = brave (chest-strong). Bularrez = face to face.",example:{basque:"Bularraldea min dut.",english:"I have chest pain."}},
  {id:"azala",basque:"Azala",english:"Skin / Cover",cefr:"A2",topic:"body",pronunciation:"ah-SAH-lah",notes:"Azala = skin or cover/surface. Azal = skin/peel/bark/cover (root). Fruitaren azala = fruit skin/peel. Liburuaren azala = book cover. Azaleko = superficial/surface-level. A very versatile root word.",example:{basque:"Azala leuna du.",english:"He has smooth skin."}},
  {id:"odola",basque:"Odola",english:"Blood",cefr:"A2",topic:"body",pronunciation:"oh-DOH-lah",notes:"Odola = blood. Odol = blood (root). Odoltsu = bloody. Odol taldea = blood type. Odol-emaile = blood donor. Odol beroa = hot-blooded/passionate. Odolkia = blood sausage (a Basque delicacy).",example:{basque:"Odola hartzen didate.",english:"They are taking my blood."}},
  {id:"hezurra",basque:"Hezurra",english:"Bone",cefr:"A2",topic:"body",pronunciation:"heh-SOOR-rah",notes:"Hezurra = bone. Hezur = bone (root). Hezurra hautsi = to break a bone. Hezurdura = skeleton. Hezurretaraino = to the bone. Gazta ondua = aged cheese (to the bone = very aged). Common in medical contexts.",example:{basque:"Hezurra hautsi dut.",english:"I have broken a bone."}},
  {id:"giltzurrunak",basque:"Giltzurrunak",english:"Kidneys",cefr:"B1",topic:"body",pronunciation:"geel-tsoo-ROON-ak",notes:"Giltzurrunak = kidneys (plural). Giltzurrun = kidney (singular). Taught as plural since kidneys always come in pairs. Giltzurruneko harriak = kidney stones. Gernu-giltzurrunak = renal/urinary kidneys. Key medical vocabulary.",example:{basque:"Giltzurrunak ondo daude.",english:"The kidneys are fine."}},
  {id:"suhia",basque:"Suhia",english:"Son-in-law",cefr:"B2",topic:"family",pronunciation:"SOO-ee-ah",notes:"Suhia = son-in-law. Suhi = son-in-law (root). Confirmed by Elhuyar: suhi-errain = son-in-law and daughter-in-law collectively. Suhia etxera etorri da = the son-in-law has come home.",example:{basque:"Nire suhia langilea da.",english:"My son-in-law is hardworking."}},
  {id:"erraina",basque:"Erraina",english:"Daughter-in-law",cefr:"B2",topic:"family",pronunciation:"er-RAI-nah",notes:"Erraina = daughter-in-law. Errain = daughter-in-law (root). Confirmed by Elhuyar: suhi-errain = son-in-law and daughter-in-law pair. Senarreba = in-laws collectively. Erraina etxean bizi da = the daughter-in-law lives at home.",example:{basque:"Erraina ama berria da.",english:"The daughter-in-law is a new mother."}},
  {id:"bortxa",basque:"Bortxa",english:"Violence / Force",cefr:"B2",topic:"society",pronunciation:"BOR-chah",notes:"Bortxa = violence or force. Bortxakeria = violence (repeated). Etxeko bortxa = domestic violence. Bortxatu = to force/violate. An important word in social contexts, especially domestic abuse awareness campaigns.",example:{basque:"Bortxarik gabe bizi behar dugu.",english:"We must live without violence."}},
  {id:"bakea",basque:"Bakea",english:"Peace",cefr:"A2",topic:"society",pronunciation:"BAH-keh-ah",notes:"Bakea = peace. Bake = peace (root). Bakean bizi = to live in peace. Bake hitzarmena = peace agreement. Bake prozesua = peace process (very relevant to Basque history post-ETA). Baketsu = peaceful.",example:{basque:"Bakean bizi nahi dugu.",english:"We want to live in peace."}},
  {id:"alaitasuna",basque:"Alaitasuna",english:"Happiness / Cheerfulness",cefr:"A2",topic:"emotions",pronunciation:"ah-lai-tah-SOO-nah",notes:"Alaitasuna = happiness or cheerfulness (noun). Alai = cheerful (adjective). Alaigarri = cheering. Zer alaitasun! = What happiness! A warm, active form of happiness - more about being lively than content.",example:{basque:"Alaitasuna zabaltzen du.",english:"He spreads happiness."}},
  {id:"kezka",basque:"Kezka",english:"Worry / Concern",cefr:"A2",topic:"emotions",pronunciation:"KEZ-kah",notes:"Kezka = worry or concern (noun). Kezkatu = to worry (verb). Kezkagarria = worrying. Kezkaz = with worry. Kezka nagusia = main concern. One of the most common emotion words in everyday Basque speech.",example:{basque:"Kezka handia dut.",english:"I have a big worry."}},
  {id:"nahigabea",basque:"Nahigabea",english:"Disappointment / Sadness",cefr:"B1",topic:"emotions",pronunciation:"nah-ee-GAH-beh-ah",notes:"Nahigabea = disappointment or grief. Nahi = want + gabe = without = wanting-without = lacking what you want. Nahigabeturiko = disappointed/grieved. A more literary sadness than tristura.",example:{basque:"Nahigabea sentitzen dut.",english:"I feel disappointment."}},
  {id:"poztu",basque:"Poztu",english:"To cheer up / To make happy",cefr:"A2",topic:"emotions",pronunciation:"POZ-too",notes:"Poztu = to cheer up or make happy. Pozten naiz = I am glad/pleased. Pozten nau = it pleases me. Poztu naiz zure berria entzutean = I was delighted to hear your news. From poz (joy).",example:{basque:"Poztu naiz zu ikusita.",english:"I am happy to see you."}},
  {id:"urrea",basque:"Urrea",english:"Gold (color)",cefr:"B1",topic:"colors",pronunciation:"OOR-reh-ah",notes:"Urrea = gold (color and metal). Urrezko = golden. Urre kolorea = gold color. Urregorria = golden-red. Basque gold craftsmanship (urregintza) has ancient roots - gold torques from pre-Roman times found in the Basque region.",example:{basque:"Urrea distiratsu da.",english:"Gold is shiny."}},
  {id:"urdinaxka",basque:"Urdinaxka",english:"Bluish / Blue-gray",cefr:"B1",topic:"colors",pronunciation:"oor-dee-NASH-kah",notes:"Urdinaxka = bluish or blue-gray. The -xka suffix makes approximate colors: berdexka=greenish, urdinaxka=bluish. The Basque sky in autumn is often described as urdinaxka - a misty blue-gray.",example:{basque:"Zerua urdinaxka dago.",english:"The sky is bluish."}},
  {id:"gorrigorria",basque:"Gorrigorria",english:"Bright red / Scarlet",cefr:"B1",topic:"colors",pronunciation:"gor-ree-GOR-ree-ah",notes:"Gorrigorria = bright red or scarlet. Reduplication intensifies color in Basque: gorri=red, gorrigorri=very red. Same pattern: zuri-zuria=pure white, beltz-beltza=jet black. A very expressive feature of the language.",example:{basque:"Aurpegia gorrigorria jarri zitzaion.",english:"His face turned bright red."}},
  {id:"zerumuga",basque:"Zerumuga",english:"Horizon",cefr:"B1",topic:"nature",pronunciation:"zeh-roo-MOO-gah",notes:"Zerumuga = horizon. Zeru = sky + muga = border/limit. Literally the sky-border. A beautiful compound. Zerumuga urrunean = on the far horizon. Common in Basque poetry and descriptions of the sea coast.",example:{basque:"Zerumuga ikusten da.",english:"The horizon is visible."}},
  {id:"itsasertza",basque:"Itsasertza",english:"Coastline",cefr:"B1",topic:"nature",pronunciation:"it-sah-SER-tsah",notes:"Itsasertza = coastline. Itsas = sea + ertz = edge. The Basque coastline is dramatic - rocky cliffs (labarrak), sandy beaches (hondartzak), and fishing harbours (portuan). Itsasertzeko = coastal.",example:{basque:"Itsasertza ederra da.",english:"The coastline is beautiful."}},
  {id:"haitzak",basque:"Haitzak",english:"Cliffs / Rocks",cefr:"B1",topic:"nature",pronunciation:"HAITS-ak",notes:"Haitzak = cliffs or rocks (plural). Haitz = rock/cliff (singular). Haitzulo = cave (cliff-hole). The Basque coast is famous for its haitzak - dramatic limestone cliffs. Haitz-arte = between the rocks.",example:{basque:"Haitzak altuak dira.",english:"The cliffs are tall."}},
  {id:"larrea",basque:"Larrea",english:"Meadow / Pasture",cefr:"A2",topic:"nature",pronunciation:"lar-REH-ah",notes:"Larrea = meadow or pasture. Larre = pasture (root). Larre = to pasture animals. The Basque interior is covered in green meadows (larreak) where sheep and cattle graze. Many place names include -larre.",example:{basque:"Ardiak larrean daude.",english:"The sheep are in the meadow."}},
  {id:"labarrak",basque:"Labarrak",english:"Sea cliffs",cefr:"B1",topic:"nature",pronunciation:"LAH-bar-rak",notes:"Labarrak = sea cliffs (plural). Labar = cliff (singular). The Basque coastline has spectacular labarrak, especially around Zumaia with its flysch geological formations - millions of years of earth history visible in the cliff faces.",example:{basque:"Labarrak ikusgarriak dira.",english:"The sea cliffs are spectacular."}},
  {id:"egia_esan",basque:"Egia esan",english:"To tell the truth / Honestly",cefr:"B1",topic:"greetings",pronunciation:"EH-ghee-ah EH-san",notes:"Egia esan = to tell the truth, or as a filler: honestly/frankly. Egia esan, ez dakit = honestly, I don't know. Egia = truth. Esan = to say. Egiazki = truly/indeed. Very common in Basque conversation.",example:{basque:"Egia esan ez dakit zer egin.",english:"Honestly I don't know what to do."}},
  {id:"hala_ere",basque:"Hala ere",english:"Nevertheless / Even so",cefr:"B1",topic:"greetings",pronunciation:"HAH-lah EH-reh",notes:"Hala ere = nevertheless or even so. Hala = so/thus + ere = also/even. Essential for expressing concession. Zaila da hala ere saiatuko naiz = It is hard but I will try anyway. Very common connector in speech.",example:{basque:"Hala ere joango naiz.",english:"Even so I will go."}},
  {id:"hori_da",basque:"Hori da!",english:"That's it! / Exactly!",cefr:"A2",topic:"greetings",pronunciation:"HOR-ee dah",notes:"Hori da! = That's it! / Exactly! / That's right! A very common affirmation. Hori da! Ongi etorri! = That's it! Welcome! Also: Hori bai! = Now that's something! Hori ez = That's not it.",example:{basque:"Hori da, oso ondo!",english:"That's it, very good!"}},
  {id:"gizena",basque:"Gizena",english:"Fat / Thick",cefr:"B1",topic:"adjectives",pronunciation:"ghee-ZEH-nah",notes:"Gizena = fat or thick. Gizen = fat (root). Gizendu = to fatten/get fat. Gizeneria = obesity. Gizen-gizena = very fat. Used for people, animals, and objects (liburu gizena = thick book). Be tactful!",example:{basque:"Liburua gizena da.",english:"The book is thick."}},
  {id:"argala",basque:"Argala",english:"Thin / Slim",cefr:"B1",topic:"adjectives",pronunciation:"ar-GAH-lah",notes:"Argala = thin or slim. Argal = thin (root). Argaldu = to lose weight/become thin. Argaltasuna = thinness. Do not confuse with argia (bright/clever). Oso argala = very thin.",example:{basque:"Katu argala da.",english:"The cat is thin."}},
  {id:"osasuntsua",basque:"Osasuntsua",english:"Healthy",cefr:"A2",topic:"adjectives",pronunciation:"oh-sah-SOON-tsoo-ah",notes:"Osasuntsua = healthy. Osasun = health + -tsu (full of) + -a (article). Literally full of health. Elikagai osasuntsuak = healthy foods. Osasuntsuki = healthily. The opposite is gaixoa (sick/ill).",example:{basque:"Janaria osasuntsua da.",english:"The food is healthy."}},
  {id:"gaixoa",basque:"Gaixoa",english:"Sick / Ill",cefr:"A2",topic:"adjectives",pronunciation:"gai-SHOH-ah",notes:"Gaixoa = sick, ill, or poor thing. Gaixotu = to fall ill. Gaixotasuna = illness. Gaixorik nago = I am ill. But gaixoa also expresses sympathy: gaixoa! = poor thing! A word with two very different uses.",example:{basque:"Gaixoa nago gaur.",english:"I am sick today."}},
  {id:"nagi",basque:"Nagi",english:"Lazy",cefr:"B1",topic:"adjectives",pronunciation:"NAH-ghee",notes:"Lazy. Nagi = lazy (adjective). Nagikeria = laziness (noun). Nagi egon = to be lazy. Nagi da = he/she is lazy. The adjective form is more useful in everyday speech.",example:{basque:"Ez izan nagi, lan egin!",english:"Do not be lazy, get to work!"}},
  {id:"bihotzbera",basque:"Bihotzbera",english:"Kind-hearted / Tender",cefr:"B1",topic:"adjectives",pronunciation:"bee-hots-BEH-rah",notes:"Bihotzbera = kind-hearted or tender-hearted. Bihotz = heart + bera = soft/tender. Literally soft-hearted. Bihotzbera da = he/she is kind-hearted. A lovely compound showing Basque expressiveness.",example:{basque:"Oso bihotzbera da.",english:"She is very kind-hearted."}},
  {id:"laurgarrena",basque:"Laurgarrena",english:"Fourth",cefr:"A2",topic:"numbers",pronunciation:"low-GAR-reh-nah",notes:"Fourth (ordinal). Lau (4) + -garren + -a. Laurgarren aldia = the fourth time. Ordinals in Basque: lehena=1st, bigarrena=2nd, hirugarrena=3rd, laurgarrena=4th, bosgarrena=5th.",example:{basque:"Laurgarrena naiz.",english:"I am fourth."}},
  {id:"bosgarrena",basque:"Bosgarrena",english:"Fifth",cefr:"A2",topic:"numbers",pronunciation:"bos-GAR-reh-nah",notes:"Fifth (ordinal). Bost (5) + -garren + -a. Bosgarren solairua = the fifth floor. The -garren suffix makes any Basque number into an ordinal. Exception: lehena (not batgarrena) for first.",example:{basque:"Bosgarren solairuan bizi naiz.",english:"I live on the fifth floor."}},
  {id:"erdia",basque:"Erdia",english:"Half",cefr:"A2",topic:"numbers",pronunciation:"ER-dee-ah",notes:"Erdia = half. Erdi = half (root). Ordu erdia = half an hour. Erdiak = half past (telling time). Erdibitu = to halve. Erditik = from the middle. A very useful word - appears constantly in time expressions.",example:{basque:"Ordu erdia pasa da.",english:"Half an hour has passed."}},
  {id:"bikoitza",basque:"Bikoitza",english:"Double / Twice",cefr:"B1",topic:"numbers",pronunciation:"bee-KOITS-ah",notes:"Bikoitza = double. Bi = two + -koitz (fold). Hirukoitza = triple. Bikoiztatu = to double. Bikoitza ordaindu = to pay double. The -koitz suffix: bikoitz=double, hirukoitz=triple, laukoitz=quadruple.",example:{basque:"Prezioa bikoitza da.",english:"The price is double."}},
  {id:"gehiago",basque:"Gehiago",english:"More",cefr:"A1",topic:"adjectives",pronunciation:"geh-YAH-go",notes:"Gehiago = more. Geh = more (root). Gehiegi = too much. Gehiago nahi dut = I want more. Gehiago ez = no more. Pixka bat gehiago = a little more. One of the most used words in everyday Basque.",example:{basque:"Gehiago nahi dut.",english:"I want more."}},
  {id:"gutxiago",basque:"Gutxiago",english:"Less / Fewer",cefr:"A2",topic:"adjectives",pronunciation:"goo-CHAH-go",notes:"Gutxiago = less or fewer. Gutxi = few/little (root). Gutxienez = at least. Gutxi gora-behera = more or less/approximately. Gutxiegi = too little. Opposite of gehiago (more).",example:{basque:"Gutxiago jan behar dut.",english:"I need to eat less."}},
  {id:"nahikoa",basque:"Nahikoa",english:"Enough",cefr:"A2",topic:"adjectives",pronunciation:"nah-EE-koh-ah",notes:"Nahikoa = enough. Nahi = want + -koa = as much as. Literally as much as you want = enough. Nahikoa da = that is enough. Ez da nahikoa = it is not enough. Nahiko = quite/fairly (also common).",example:{basque:"Nahikoa da, eskerrik asko.",english:"That is enough, thank you."}},
  {id:"jendea",basque:"Jendea",english:"People",cefr:"A1",topic:"society",pronunciation:"yen-DEH-ah",notes:"Jendea = people (collective noun). Jende = people (root). Jende asko = many people. Jende gutxi = few people. Jendartea = the public/society. Jendetza = crowd. Jendaurrean = in public (before people).",example:{basque:"Jende asko dago hemen.",english:"There are many people here."}},
  {id:"herrialdea",basque:"Herrialdea",english:"Country / Nation",cefr:"A2",topic:"society",pronunciation:"her-ree-AL-deh-ah",notes:"Herrialdea = country or nation-state. Different from herria (town/people/nation in a cultural sense). Herrialde batua = united country. Herrialde independentea = independent country. Herria is more emotional; herrialdea is more political/geographic.",example:{basque:"Zein herrialdetan bizi zara?",english:"In which country do you live?"}},
  {id:"mundua",basque:"Mundua",english:"World",cefr:"A1",topic:"society",pronunciation:"moon-DOO-ah",notes:"Mundua = the world. Mundu = world (root). Mundu osoan = all over the world. Mundu mailako = world-class. Lehen mundua = first world. Munduko = of the world. Essential A1 word in any language.",example:{basque:"Mundua ederra da.",english:"The world is beautiful."}},
  {id:"legea",basque:"Legea",english:"Law",cefr:"B1",topic:"society",pronunciation:"leh-GEH-ah",notes:"Legea = law. Lege = law (root). Legezko = lawful/legal. Legea hautsi = to break the law. Legelaria = lawyer. Lege organikoa = organic law. Basque foral law (forua) is an ancient legal tradition predating Spain.",example:{basque:"Legea errespetatu behar da.",english:"The law must be respected."}},
  {id:"gobernua",basque:"Gobernua",english:"Government",cefr:"A2",topic:"society",pronunciation:"goh-BER-noo-ah",notes:"Gobernua = government. From Spanish gobierno. Gobernu = govern (root). Eusko Jaurlaritza = the Basque Government (not gobernua - uses the native term). Gobernuko = governmental.",example:{basque:"Gobernua aldatu da.",english:"The government has changed."}},
  {id:"politika",basque:"Politika",english:"Politics",cefr:"A2",topic:"society",pronunciation:"poh-LEE-tee-kah",notes:"Politika = politics or policy. Politikaria = politician. Politiko = political. Euskal politika = Basque politics. A highly charged word in the Basque Country with its complex political history.",example:{basque:"Politika zaila da.",english:"Politics is difficult."}},
  {id:"alderdia",basque:"Alderdia",english:"Political party",cefr:"B1",topic:"society",pronunciation:"al-DER-dee-ah",notes:"Alderdia = political party. Alderdi = party/side (root). EAJ-PNV (Basque Nationalist Party) and EH Bildu are the main Basque parties. Alderdikeria = partisanship. Alderdi politikoa = political party.",example:{basque:"Alderdi politikoa hautatu dut.",english:"I have chosen a political party."}},
  {id:"gizakia",basque:"Gizakia",english:"Human being / Person",cefr:"B1",topic:"society",pronunciation:"ghee-ZAH-kee-ah",notes:"Gizakia = human being. Gizon = man + -aki (being). Gizaki = human (root). Giza = human (prefix). Gizakiak = humans. Giza eskubideak = human rights. Gizatasuna = humanity/humanness.",example:{basque:"Gizaki guztiak berdinak dira.",english:"All human beings are equal."}},
  {id:"beltz_beltza",basque:"Beltz-beltza",english:"Jet black",cefr:"B1",topic:"colors",pronunciation:"belts BEL-tsah",notes:"Beltz-beltza = jet black. Reduplication intensifies: beltz=black, beltz-beltza=completely black. Same pattern as gorrigorria (scarlet). Gau beltz-beltza = pitch-black night. Very expressive Basque color intensification.",example:{basque:"Gaua beltz-beltza dago.",english:"The night is pitch black."}},
  {id:"zuri_zuria",basque:"Zuri-zuria",english:"Pure white / Snow white",cefr:"B1",topic:"colors",pronunciation:"ZOO-ree ZOO-ree-ah",notes:"Zuri-zuria = pure white or snow white. Reduplication for intensity: zuri=white, zuri-zuria=pure white. Elurra zuri-zuria = the snow is pure white. This pattern works for all Basque colors.",example:{basque:"Elurra zuri-zuria da.",english:"The snow is pure white."}},
  {id:"kolore",basque:"Kolorea",english:"Color",cefr:"A1",topic:"colors",pronunciation:"koh-LOH-reh-ah",notes:"Kolorea = color. Kolore = color (root). Zer kolore da? = What color is it? Koloretsu = colorful. Koloregabea = colorless. Koloretan = in color (vs black and white). Essential word for the colors topic.",example:{basque:"Zer kolore da?",english:"What color is it?"}},
  {id:"kirolak",basque:"Kirolak",english:"Sports",cefr:"A1",topic:"culture",pronunciation:"kee-ROH-lak",notes:"Kirolak = sports (plural). Kirola = sport (singular). Kirolaria = athlete/sportsperson. Kirol eguna = sports day. Basque rural sports (herri kirolak) include log-splitting, stone-lifting, and tug of war. Unique to Basque culture.",example:{basque:"Kirolak gustatzen zaizkit.",english:"I like sports."}},
  {id:"futbola",basque:"Futbola",english:"Football / Soccer",cefr:"A1",topic:"culture",pronunciation:"foot-BOH-lah",notes:"Futbola = football. Athletic Club de Bilbo (Bilbao) is unique - it only signs players of Basque origin. La Real (Real Sociedad) is the other major Basque club. Futbol-zelaia = football pitch. Basques are passionate fans.",example:{basque:"Futbola ikusten dut.",english:"I watch football."}},
  {id:"liburutegia",basque:"Liburutegia",english:"Library",cefr:"A1",topic:"culture",pronunciation:"lee-boo-roo-TEH-ghee-ah",notes:"Liburutegia = library. Liburua = book + -tegi = place. Literally book-place. Basque public libraries (liburutegiak) are important centers of Basque culture. Koldo Mitxelena liburutegia in Donostia is famous.",example:{basque:"Liburutegia hurbil dago.",english:"The library is nearby."}},
  {id:"antzerkia",basque:"Antzerkia",english:"Theater / Play",cefr:"A2",topic:"culture",pronunciation:"an-TER-kee-ah",notes:"Antzerkia = theater or theatrical play. Antzerkigilea = playwright. Antzezlea = actor. Antzeztu = to perform/act. Basque theater has ancient roots in pastoral plays (pastorales) and mystery plays.",example:{basque:"Antzerkia ikustera joango naiz.",english:"I will go to see the theater."}},
  {id:"zinema",basque:"Zinema",english:"Cinema / Film",cefr:"A1",topic:"culture",pronunciation:"see-NEH-mah",notes:"Zinema = cinema or film. Zinema-aretoa = cinema (hall). Zinemara joan = to go to the cinema. San Sebastián International Film Festival (Donostia Zinemaldia) is one of Europe's most prestigious film festivals.",example:{basque:"Zinema gustatzen zait.",english:"I like cinema."}},
  {id:"garraio_publikoa",basque:"Garraio publikoa",english:"Public transport",cefr:"A2",topic:"travel",pronunciation:"gar-RAI-oh poo-BLEE-koh-ah",notes:"Garraio publikoa = public transport. Garraio = transport + publikoa = public. Metro, autobus, trena = metro, bus, train. Euskotren and EuskoTren connect most Basque cities. Very efficient in the Basque Country.",example:{basque:"Garraio publikoa erabiltzen dut.",english:"I use public transport."}},
  {id:"sarrera",basque:"Sarrera",english:"Entrance / Ticket / Entry",cefr:"A2",topic:"travel",pronunciation:"sar-REH-rah",notes:"Sarrera = entrance, entry, or ticket. Sartu = to enter (root). Sarrera librea = free entry. Sarrera erosi = to buy a ticket. Sarrera nagusia = main entrance. Irteeara = exit (opposite). Very common travel word.",example:{basque:"Sarrera bi erosi ditut.",english:"I have bought two tickets."}},
  {id:"irteera",basque:"Irteera",english:"Exit / Departure",cefr:"A2",topic:"travel",pronunciation:"eer-TEH-rah",notes:"Irteera = exit or departure. Irten = to leave/exit (root). Irteera larria = emergency exit. Irteearen ordua = departure time. Sarrera (entry) and irteera (exit) are a natural pair.",example:{basque:"Non dago irteera?",english:"Where is the exit?"}},
  {id:"bidegurutzea",basque:"Bidegurutzea",english:"Crossroads / Junction",cefr:"B1",topic:"travel",pronunciation:"bee-deh-goo-ROO-tseh-ah",notes:"Bidegurutzea = crossroads or junction. Bide = road + gurutzea = cross. Literally the road-cross. Bidegurutzean = at the crossroads. Used both literally and metaphorically - bizitzaren bidegurutzean = at life's crossroads.",example:{basque:"Bidegurutzean ezkerrera joan.",english:"At the crossroads go left."}},
  {id:"autopista",basque:"Autopista",english:"Motorway / Highway",cefr:"A2",topic:"travel",pronunciation:"ow-toh-PEES-tah",notes:"Autopista = motorway. From Spanish autopista. Autobidea is the Basque compound word (auto=car + bide=road). AP-8 is the main Basque motorway running along the coast. Peajea = toll.",example:{basque:"Autopistaz joan nintzen.",english:"I went by motorway."}},
  {id:"helmuga",basque:"Helmuga",english:"Destination",cefr:"B1",topic:"travel",pronunciation:"hel-MOO-gah",notes:"Helmuga = destination. Heldu = to arrive + muga = limit/border. Literally the arrival-point. Helmugara iritsi = to reach the destination. Also used in sport: helmuga = finishing line.",example:{basque:"Helmugara iritsi gara.",english:"We have reached our destination."}},
  {id:"bidaiari",basque:"Bidaiari",english:"Traveller / Passenger",cefr:"A2",topic:"travel",pronunciation:"bee-dai-AH-ree",notes:"Bidaiari = traveller or passenger. Bidaia = journey + -ari (one who does). Like all -ari occupation words in Basque, used without the -a article when referring to the role. Bidaiariak = travellers. Compare: abeslaria (singer), sendagilea (doctor).",example:{basque:"Bidaiari asko daude geltokian.",english:"There are many travellers at the station."}},
  {id:"aspertuta",basque:"Aspertuta",english:"Bored",cefr:"A2",topic:"emotions",pronunciation:"as-per-TOO-tah",notes:"Aspertuta = bored. Aspertu = to bore/get bored (verb). Aspergarria = boring. Aspertu egin naiz = I got bored. Aspergarria = boring (thing). Zer aspergarria! = How boring! Very useful everyday expression.",example:{basque:"Aspertuta nago.",english:"I am bored."}},
  {id:"hunkituta",basque:"Hunkituta",english:"Moved / Touched (emotionally)",cefr:"B1",topic:"emotions",pronunciation:"hoon-kee-TOO-tah",notes:"Hunkituta = emotionally moved or touched. Hunkitu = to move/touch emotionally. Hunkigarria = moving/touching. Hunkituta nago = I am moved. Used when something beautiful or sad affects you deeply.",example:{basque:"Hunkituta nago.",english:"I am deeply moved."}},
  {id:"lotsatuta",basque:"Lotsatuta",english:"Embarrassed / Ashamed",cefr:"A2",topic:"emotions",pronunciation:"lot-sah-TOO-tah",notes:"Lotsatuta = embarrassed or ashamed. Lotsatu = to embarrass/be ashamed (verb). Lotsagarria = shameful. Gorri jarri = to go red (with embarrassment). Lotsatuta nago = I am embarrassed.",example:{basque:"Lotsatuta nago.",english:"I am embarrassed."}},
  {id:"sugea",basque:"Sugea",english:"Snake",cefr:"A2",topic:"nature",pronunciation:"soo-GEH-ah",notes:"Sugea = snake. Suge = snake (root). Sugegorria = red snake/adder. Sugeak arraroak dira Euskal Herrian = snakes are uncommon in the Basque Country - only a few species. Suge sorgina = witch-snake in Basque mythology.",example:{basque:"Sugea ikusten dut.",english:"I see a snake."}},
  {id:"txerri_basatia",basque:"Txerri basatia",english:"Wild boar",cefr:"B1",topic:"nature",pronunciation:"CHER-ree bah-SAH-tee-ah",notes:"Txerri basatia = wild boar. Txerri = pig + basatia = wild. Common in Basque forests and mountains. Hunted in autumn. Txerri basatiaren haragia = wild boar meat, a delicacy in Basque cuisine.",example:{basque:"Txerri basatiak basoan bizi dira.",english:"Wild boars live in the forest."}},
  {id:"sasia",basque:"Sasia",english:"Bushes / Scrubland",cefr:"B1",topic:"nature",pronunciation:"SAH-see-ah",notes:"Sasia = bushes or scrubland. Sasi = bush/bramble (root). Sasiaskatzea = blackberrying. Sasitzea = to overgrow. Common Basque surname element: Sasiburu, Sasiain. Sasi-jakile = know-it-all (bush-knower - pretends to know everything).",example:{basque:"Sasia bide ondoan dago.",english:"The bushes are alongside the path."}},
  {id:"irakurri",basque:"Irakurri",english:"To read",cefr:"A1",topic:"culture",pronunciation:"ee-rah-KOOR-ree",notes:"Irakurri = to read. Irakurtzen dut = I am reading. Irakurketa = reading (noun). Irakurle = reader. Irakurgarria = readable/worth reading. One of the most essential verbs - reading Basque is the foundation of learning it.",example:{basque:"Liburua irakurtzen dut.",english:"I am reading the book."}},
  {id:"idatzi",basque:"Idatzi",english:"To write",cefr:"A1",topic:"culture",pronunciation:"ee-DAT-see",notes:"Idatzi = to write. Idazten dut = I am writing. Idazlea = writer/author. Idazketa = writing (noun). Idazki = written document. Idatzia = written (adjective). Fundamental verb alongside irakurri (to read).",example:{basque:"Gutun bat idazten dut.",english:"I am writing a letter."}},
  {id:"entzun",basque:"Entzun",english:"To listen / To hear",cefr:"A1",topic:"culture",pronunciation:"en-TSOON",notes:"Entzun = to listen or hear. Entzuten dut = I hear/I am listening. Entzule = listener. Entzungarria = audible. Entzun! = Listen! Entzun al duzu? = Did you hear? The root may relate to the name Euskara itself.",example:{basque:"Musika entzuten dut.",english:"I am listening to music."}},
  {id:"galdera",basque:"Galdera",english:"Question",cefr:"A2",topic:"greetings",pronunciation:"gal-DEH-rah",notes:"Galdera = question (noun). Galdetu = to ask (verb). Galdegin = to ask (more formal). Galdera bat dut = I have a question. Galderak egin = to ask questions. Galdetegi = questionnaire.",example:{basque:"Galdera bat daukat.",english:"I have a question."}},
  {id:"erantzuna",basque:"Erantzuna",english:"Answer / Response",cefr:"A2",topic:"greetings",pronunciation:"eh-RAN-tsoo-nah",notes:"Erantzuna = answer or response (noun). Erantzun = to answer (verb). Erantzulea = respondent. Erantzuna eman = to give an answer. Erantzukizuna = responsibility (the answer/accountability).",example:{basque:"Erantzuna badakit.",english:"I know the answer."}},
  {id:"akatsa",basque:"Akatsa",english:"Mistake / Error",cefr:"A2",topic:"greetings",pronunciation:"ah-KAT-sah",notes:"Akatsa = mistake or error. Akats = fault/flaw (root). Akatsik gabe = without errors. Akatsez ikasi = to learn from mistakes. Akats hau = this mistake. Essential word for language learners - everyone makes akatsen!",example:{basque:"Akats bat egin dut.",english:"I made a mistake."}},
  {id:"hegaztia",basque:"Hegaztia",english:"Bird (formal)",cefr:"B1",topic:"nature",pronunciation:"heh-GAHZ-tee-ah",notes:"Hegaztia = bird (more formal/scientific term). Hegan egin = to fly (literally to do wing). Hegazkin = aircraft (flying machine). Txoria is the everyday word for bird; hegaztia appears in nature writing, biology, and formal contexts.",example:{basque:"Hegaztiak hegan egiten dute.",english:"Birds fly."}},
  {id:"begiratu",basque:"Begiratu",english:"To look / To watch",cefr:"A1",topic:"greetings",pronunciation:"beh-ghee-RAH-too",notes:"Begiratu = to look at or watch (intentional). Begiratzen dut = I am looking. Begiratu! = Look! Do not confuse with ikusi (to see - perception) vs begiratu (to look - deliberate act). Begirale = observer/watcher. Begi = eye (root).",example:{basque:"Begiratu ezazu.",english:"Look at it."}},
  {id:"gosaria",basque:"Gosaria",english:"Breakfast",cefr:"A1",topic:"food",pronunciation:"goh-SAH-ree-ah",notes:"Gosaria = breakfast. Goiz = morning + -ari (meal). Literally morning-meal. Gosaldu = to have breakfast. Gosaria egin = to make breakfast. The three meals: gosaria (breakfast), bazkaria (lunch), afaria (dinner).",example:{basque:"Gosaria jan dut.",english:"I have had breakfast."}},
  {id:"sagarra",basque:"Sagarra",english:"Apple",cefr:"A1",topic:"food",pronunciation:"sah-GAR-rah",notes:"Sagarra = apple. Sagar = apple (root). Sagardoa = cider (apple+wine). Sagarrondoa = apple tree. Apples are central to Basque culture - cider making is a centuries-old tradition. Sagarrondoak = apple orchards cover the Basque hillsides in autumn.",example:{basque:"Sagarra jan dut.",english:"I ate an apple."}},
  {id:"banana",basque:"Banana",english:"Banana",cefr:"A1",topic:"food",pronunciation:"bah-NAH-nah",notes:"Banana - same word as Spanish/English. Bananondoa = banana tree. Fruta tropikala = tropical fruit. Bananas are popular in Basque supermarkets and pintxo bars, often in dessert pintxos.",example:{basque:"Banana jan nahi dut.",english:"I want to eat a banana."}},
  {id:"tipula",basque:"Tipula",english:"Onion",cefr:"A1",topic:"food",pronunciation:"tee-POO-lah",notes:"Tipula = onion. From Latin/Spanish cebolla via tipula. Tipula betea = stuffed onion. Tipula-saltsa = onion sauce. Onions are fundamental in Basque cooking - the sofrito base of most dishes starts with tipula.",example:{basque:"Tipula txikitu behar dut.",english:"I need to chop the onion."}},
  {id:"azenarioa",basque:"Azenarioa",english:"Carrot",cefr:"A1",topic:"food",pronunciation:"ah-tseh-nah-REE-oh-ah",notes:"Azenarioa = carrot. From Spanish zanahoria via azenario. Azenarioak = carrots (plural). Common in Basque vegetable soups and stews. Azenario salda = carrot broth. Azenario tortilla = carrot omelette.",example:{basque:"Azenarioak osasuntsuak dira.",english:"Carrots are healthy."}},
  {id:"letxuga",basque:"Letxuga",english:"Lettuce",cefr:"A1",topic:"food",pronunciation:"leh-CHOO-gah",notes:"Letxuga = lettuce. From Spanish lechuga. Letxuga entsalada = lettuce salad. Basque cuisine uses fresh letxuga in salads. The Basque Country grows excellent letxuga in the Araba flatlands.",example:{basque:"Letxuga entsaladan dago.",english:"The lettuce is in the salad."}},
  {id:"oliba",basque:"Oliba",english:"Olive",cefr:"A2",topic:"food",pronunciation:"oh-LEE-bah",notes:"Oliba = olive. Olibondoa = olive tree. Oliba olioa = olive oil. Gilda = the iconic Basque pintxo of olive, anchovy and pickled pepper. Olibak pintxoetan = olives in pintxos. Common in Basque bar snacks.",example:{basque:"Olibak gustatzen zaizkit.",english:"I like olives."}},
  {id:"antxoa",basque:"Antxoa",english:"Anchovy",cefr:"A2",topic:"food",pronunciation:"an-CHOH-ah",notes:"Antxoa = anchovy. The Cantabrian anchovy (antxoa) is world-renowned - Getaria and Ondarroa are famous anchovy ports. The Gilda pintxo is built around antxoa, olive and pickled pepper. Antxoa olioan = anchovy in oil. Note: antzua means sterile/infertile, a completely different word.",example:{basque:"Antxoa Gildaren osagaia da.",english:"Anchovy is an ingredient of the Gilda pintxo."}},
  {id:"gaztaina",basque:"Gaztaina",english:"Chestnut",cefr:"A2",topic:"food",pronunciation:"gaz-TAI-nah",notes:"Gaztaina = chestnut. Gaztainondo = chestnut tree. Gaztaina erreak = roasted chestnuts, sold at markets in autumn. Gaztainak batu = to gather chestnuts. Chestnuts were a staple food in the Basque mountains before potatoes arrived.",example:{basque:"Gaztaina erreak nahi ditut.",english:"I want roasted chestnuts."}},
  {id:"intxaurra",basque:"Intxaurra",english:"Walnut",cefr:"A2",topic:"food",pronunciation:"een-CHOW-rah",notes:"Intxaurra = walnut. Intxaur = walnut (root). Intxaursaltsa = walnut cream sauce (Christmas dessert). Intxaurrondoa = walnut tree. Rich in omega-3. Intxaurrak biltzea = gathering walnuts in autumn.",example:{basque:"Intxaurretan aberatsa da.",english:"It is rich in walnuts."}},
  {id:"txokolatea",basque:"Txokolatea",english:"Chocolate",cefr:"A1",topic:"food",pronunciation:"choh-koh-LAH-teh-ah",notes:"Txokolatea = chocolate. The Basque Country has a strong chocolate tradition - especially in Tolosa and Donostia (San Sebastián). Txokolate beltza = dark chocolate. Txokolatezko pastela = chocolate cake.",example:{basque:"Txokolatea gustatzen zait.",english:"I like chocolate."}},
  {id:"triste",basque:"Triste",english:"Sad",cefr:"A1",topic:"emotions",pronunciation:"TRIS-teh",notes:"Triste = sad (from Spanish/Latin tristis). Triste nago = I am sad. Tristura = sadness (noun). In Euskara Batua both triste (adj) and tristura (noun) are used. More informal than tristuratsu.",example:{basque:"Triste nago gaur.",english:"I am sad today."}},
  {id:"nekatua",basque:"Lasai",english:"Calm / Relaxed (state)",cefr:"A1",topic:"emotions",pronunciation:"lah-SAI",notes:"Calm or relaxed as a state. Lasai egon = to be calm. Lasai ibili = take it easy. Lasai! = Calm down! / Relax! Very common in everyday speech. Lasaia is the adjective form.",example:{basque:"Lasai, dena ondo dago.",english:"Calm down, everything is fine."}},
  {id:"gaixorik",basque:"Gaixorik",english:"Ill / Unwell",cefr:"A1",topic:"emotions",pronunciation:"gai-SHOR-eek",notes:"Gaixorik = ill or unwell (adverb form). Gaixorik nago = I am ill/unwell. Different from gaixoa (the poor thing - sympathetic). Gaixotu = to fall ill. Gaixotasuna = illness. Ez nago ondo, gaixorik nago = I am not well, I am ill.",example:{basque:"Gaixorik nago.",english:"I am ill."}},
  {id:"hortaz",basque:"Hortaz",english:"Therefore / So / Thus",cefr:"B1",topic:"greetings",pronunciation:"HOR-taz",notes:"Hortaz = therefore, so, or thus. Hortaz, joan behar dut = therefore I have to go. Beraz is a synonym also meaning therefore. Hortaz ez dakit = so I don't know. A connector linking cause and consequence.",example:{basque:"Hortaz, etxera joango naiz.",english:"Therefore I will go home."}},
  {id:"beraz",basque:"Beraz",english:"So / Therefore / Then",cefr:"B1",topic:"greetings",pronunciation:"BEH-raz",notes:"Beraz = so, therefore, or then. Beraz, zer egin dezakegu? = So what can we do? Very common in Basque conversation - used to draw conclusions or transitions. Synonymous with hortaz but more colloquial.",example:{basque:"Beraz, ados gaude.",english:"So we are agreed."}},
  {id:"gainera",basque:"Gainera",english:"Moreover / Besides / Also",cefr:"B1",topic:"greetings",pronunciation:"gai-NEH-rah",notes:"Gainera = moreover, besides, or in addition. Gain = top/above + -era. Gainera, merkeagoa da = moreover it is cheaper. One of the most useful discourse connectors in Basque writing and speech.",example:{basque:"Gainera, oso polita da.",english:"Moreover it is very nice."}},
  {id:"aldiz",basque:"Aldiz",english:"On the other hand / However",cefr:"B1",topic:"greetings",pronunciation:"AL-dees",notes:"Aldiz = on the other hand, however, or in contrast. Aldi = time/turn + -z. Ni aldiz ez noa = I on the other hand am not going. Essential for contrast in Basque argumentation. Baina (but) is simpler; aldiz is more emphatic.",example:{basque:"Ni aldiz etxean geratuko naiz.",english:"I on the other hand will stay at home."}},
  {id:"musika_tresna",basque:"Musika tresna",english:"Musical instrument",cefr:"A2",topic:"culture",pronunciation:"MOO-see-kah TRES-nah",notes:"Musika tresna = musical instrument. Tresna = tool/instrument. Musika tresnak jotzea = to play musical instruments. Basque instruments include txalaparta, trikitixa, txirula (flute), and alboka (horn). Tresna = tool is also used for any tool.",example:{basque:"Musika tresna bat jotzen duzu?",english:"Do you play a musical instrument?"}},
  {id:"abeslaria",basque:"Abeslaria",english:"Singer",cefr:"A2",topic:"culture",pronunciation:"ah-bes-LAH-ree-ah",notes:"Abeslaria = singer. Abestu = to sing (verb). Abestia = song. Abeslari ospetsua = famous singer. Mikel Laboa, Benito Lertxundi, and Oskorri are beloved Basque singers. Abeslari talde = singing group.",example:{basque:"Abeslari ona da.",english:"She is a good singer."}},
  {id:"abestia",basque:"Abestia",english:"Song",cefr:"A1",topic:"culture",pronunciation:"ah-BES-tee-ah",notes:"Abestia = song. Abestu = to sing (root). Abestiak = songs (plural). Txoria Kantari = famous Basque song by Mikel Laboa. Abesti herrikoiak = folk songs. Basque singing culture is very rich - bertso, koral, and folk traditions all strong.",example:{basque:"Abesti eder bat da.",english:"It is a beautiful song."}},
  {id:"margolana",basque:"Margolana",english:"Painting",cefr:"A2",topic:"culture",pronunciation:"mar-GOH-lah-nah",notes:"Margolana = painting (artwork). Margotu = to paint. Margolaria = painter/artist. Margo = paint/color (root). Eduardo Chillida and Jorge Oteiza are the most famous Basque visual artists, though primarily sculptors.",example:{basque:"Margolana ederra da.",english:"The painting is beautiful."}},
  {id:"eskultura",basque:"Eskultura",english:"Sculpture",cefr:"B1",topic:"culture",pronunciation:"es-kool-TOO-rah",notes:"Eskultura = sculpture. Eskultore = sculptor. Eduardo Chillida and Jorge Oteiza are world-renowned Basque sculptors. Chillida Leku museum near Donostia (San Sebastián) displays Chillida's monumental works in a forest setting.",example:{basque:"Eskultura bikaina da.",english:"The sculpture is magnificent."}},
  {id:"hodeia",basque:"Hodeia",english:"Cloud",cefr:"A1",topic:"nature",pronunciation:"hoh-DEH-ee-ah",notes:"Hodeia = cloud. Hodei = cloud (root). Hodeitsu = cloudy. Hodeiek zerua estaltzen dute = the clouds cover the sky. Basque weather is famously changeable - Bilbo (Bilbao) can have four seasons in one day.",example:{basque:"Hodei asko dago zeruan.",english:"There are many clouds in the sky."}},
  {id:"lainoa",basque:"Lainoa",english:"Fog / Mist",cefr:"A2",topic:"nature",pronunciation:"lai-NOH-ah",notes:"Lainoa = fog or mist. Laino = fog (root). Lainotsu = foggy/misty. Laino artean = in the fog. The Basque mountains are often shrouded in lainoa - a characteristic of the Atlantic climate. Laino mehe = light mist.",example:{basque:"Lainoa dago mendian.",english:"There is fog in the mountains."}},
  {id:"tximista",basque:"Tximista",english:"Lightning",cefr:"A2",topic:"nature",pronunciation:"chee-MEES-tah",notes:"Tximista = lightning. Tximist = lightning bolt (root). Trumoiak = thunder (different word). Tximistargia = lightning flash. The Basque word for lightning contains the tx (ch) sound - tximista sounds almost like a flash itself.",example:{basque:"Tximistak jotzen du.",english:"Lightning strikes."}},
  {id:"tripak",basque:"Tripak",english:"Guts / Bowels / Intestines",cefr:"B1",topic:"body",pronunciation:"TREE-pak",notes:"Tripak = guts or intestines (plural). Tripa = gut (singular). Tripa min dut = I have a stomach ache. Tripakiak = Basque tripe stew (a traditional dish). Tripategi = tripe restaurant. Also colloquially: tripa bete = full belly.",example:{basque:"Tripa min dut.",english:"I have a stomach ache."}},
  {id:"minutua",basque:"Minutua",english:"Minute",cefr:"A1",topic:"time",pronunciation:"mee-NOO-too-ah",notes:"Minutua = minute. Minutu = minute (root). Bost minutu = five minutes. Minutu bat = one minute. Minutuero = every minute. Ordubete = one hour (hour-full). Segundoa = second. Essential for telling time precisely.",example:{basque:"Bost minutu barru.",english:"In five minutes."}},
  {id:"segundoa",basque:"Segundoa",english:"Second (time)",cefr:"A1",topic:"time",pronunciation:"seh-GOON-doh-ah",notes:"Segundoa = second (unit of time). From Spanish segundo. Segundo bat = one second. Segundoak igarotzen dira = seconds pass. Segundoak minututan = seconds into minutes. Erlojua segundotan = clock in seconds.",example:{basque:"Segundo bat itxaron.",english:"Wait one second."}},
  {id:"asteburua",basque:"Asteburua",english:"Weekend",cefr:"A1",topic:"time",pronunciation:"as-teh-BOO-roo-ah",notes:"Asteburua = weekend. Aste = week + burua = head/end. Literally week-end. Asteburuan = at the weekend. Asteburuko planak = weekend plans. Larunbata eta igandea = Saturday and Sunday.",example:{basque:"Asteburuan zer egingo duzu?",english:"What will you do at the weekend?"}},
  {id:"etzi",basque:"Etzi",english:"The day after tomorrow",cefr:"A2",topic:"time",pronunciation:"ET-see",notes:"Etzi = the day after tomorrow. Herenegun = the day before yesterday. These short words show how Basque efficiently expresses relative time. Etzi joango naiz = I will go the day after tomorrow. Very useful for planning conversations.",example:{basque:"Etzi ikusiko dugu.",english:"We will see the day after tomorrow."}},
  {id:"herenegun",basque:"Herenegun",english:"The day before yesterday",cefr:"A2",topic:"time",pronunciation:"heh-reh-neh-GOON",notes:"Herenegun = the day before yesterday. Atzo = yesterday, herenegun = two days ago. Herenegungoa = of the day before yesterday. Basque has elegant words for relative days: etzi (day after tomorrow), etziherenegun (3 days ago).",example:{basque:"Herenegun ikusi nuen.",english:"I saw it the day before yesterday."}},
  {id:"astea",basque:"Astea",english:"Week",cefr:"A1",topic:"time",pronunciation:"AS-teh-ah",notes:"Astea = week. Aste = week (root). Aste honetan = this week. Astero = every week. Astebete = one week (week-full). Asteburua = weekend (week-end). Astelehenean = on Monday. The word for week gives all the day names.",example:{basque:"Astebete barru.",english:"In one week."}},
  {id:"lagunartea",basque:"Lagunartea",english:"Community / Circle of friends",cefr:"A1",topic:"society",pronunciation:"lah-goon-AR-teh-ah",notes:"Lagunartea = circle of friends or community. Lagun = friend + artea = space between. Can refer to a close friend group or a broader community. Lagunartean = among friends/community. Auzolana is the related concept of community work. Very Basque concept of collective belonging.",example:{basque:"Lagunartean ondo sentitzen naiz.",english:"I feel good among friends."}},
  {id:"hizkuntz_komunitatea",basque:"Hizkuntz komunitatea",english:"Language community",cefr:"A2",topic:"society",pronunciation:"hees-KOONTS koh-moo-nee-TAH-teh-ah",notes:"Hizkuntz komunitatea = language community. Hizkuntz is the bound form of hizkuntza (language) used before nouns - correct Basque grammar. The Basque-speaking community numbers around 750,000 speakers. Language community rights and revival are ongoing political issues.",example:{basque:"Hizkuntz komunitatea indartzen ari da.",english:"The language community is growing stronger."}},
  {id:"auzoa",basque:"Auzoa",english:"Neighbourhood / Village",cefr:"A1",topic:"society",pronunciation:"ow-SOH-ah",notes:"Auzoa = neighbourhood or small village. Auzo = neighbourhood (root). Auzokoa = neighbor. Auzolan = community work (neighbourhood work) - the Basque tradition of collective voluntary labor. A beautiful concept: neighbours working together for the common good.",example:{basque:"Nire auzoa txikia da.",english:"My neighbourhood is small."}},
  {id:"biztanleak",basque:"Biztanleak",english:"Inhabitants / Population",cefr:"A2",topic:"society",pronunciation:"beez-TAN-leh-ak",notes:"Biztanleak = inhabitants or population (plural). Biztanle = inhabitant (singular). Biztanleria = population. Bilboko biztanleak = inhabitants of Bilbo. The Basque Country has about 3 million inhabitants across the 7 territories.",example:{basque:"Biztanle asko dago hirian.",english:"There are many inhabitants in the city."}},
  {id:"elkartea",basque:"Elkartea",english:"Association / Club",cefr:"A2",topic:"society",pronunciation:"el-KAR-teh-ah",notes:"Elkartea = association, club, or society. Elkar = each other/together. Elkartu = to unite/join together. Basque civil society is built on elkarteen - sports clubs, cultural societies, choral groups. Gazte elkartea = youth association.",example:{basque:"Elkarte bateko kide naiz.",english:"I am a member of an association."}},
  {id:"mamia",basque:"Mamia",english:"Curd / Junket",cefr:"B1",topic:"food",pronunciation:"MAH-mee-ah",notes:"Mamia = curd or junket - a traditional Basque dessert made from sheep's milk, rennet, and honey. One of the oldest Basque foods. Served in a wooden bowl (kaiku). Pastoralism is ancient in the Basque Country and mamia reflects this.",example:{basque:"Mamia gozoa da.",english:"The curd is delicious."}},
  {id:"piperrada",basque:"Piperrada",english:"Piperade / Pepper stew",cefr:"B1",topic:"food",pronunciation:"pee-per-RAH-dah",notes:"Piperrada = piperade, the classic Basque pepper and tomato stew. Piper = pepper + -ada (collective). Eaten with eggs (arrautzekin), with cod, or as a side. One of the most emblematic Basque dishes, also popular across southwest France.",example:{basque:"Piperrada prestatzen dut.",english:"I am preparing piperade."}},
  {id:"babarrunak",basque:"Babarrunak",english:"Beans",cefr:"A2",topic:"food",pronunciation:"bah-bar-ROON-ak (rolled rr)",notes:"Babarrunak = beans (plural). Babarrun = bean (singular). Tolosa beans (Tolosako babarrunak) are world-renowned - a dark, creamy black bean grown near Tolosa. Babarrun saltsa = bean stew. One of the most important ingredients in Basque cuisine.",example:{basque:"Tolosako babarrunak ezagunak dira.",english:"Tolosa beans are famous."}},
  {id:"onddo",basque:"Onddoak",english:"Mushrooms",cefr:"A2",topic:"food",pronunciation:"on-DOH-ak (dd = palatal d)",notes:"Onddoak = mushrooms (plural). Onddo = mushroom (singular). Perretxikoak is the more colloquial everyday Basque word for edible wild mushrooms. Onddo is more formal/general. Mushroom foraging (onddo biltzea) in October is a Basque institution. Ziza, txantxangorri, and ezpata-onddo are prized varieties.",example:{basque:"Onddoak biltzera joaten naiz udazkenean.",english:"I go mushroom picking in autumn."}},
  {id:"urdaia",basque:"Urdaia",english:"Bacon / Cured pork fat",cefr:"B1",topic:"food",pronunciation:"oor-DAI-ah",notes:"Urdaia = cured pork fat, lard, or bacon. Confirmed by Elhuyar: urdaia appears in food contexts alongside odolkiak (blood sausage) and txoixoak (chorizo). Urdai egosi = boiled pork. Urdaiazpikoa = ham (pig's thigh). Do not confuse: urdaia is fat/lard, urdaiazpikoa is cured ham.",example:{basque:"Urdaiazpikoa pintxoan dago.",english:"The ham is in the pintxo."}},
  {id:"tortilla",basque:"Tortilla",english:"Omelette / Tortilla",cefr:"A2",topic:"food",pronunciation:"tor-TEE-lyah",notes:"Tortilla = omelette or Spanish tortilla. Patata tortilla = potato omelette, ubiquitous in Basque bars. Bakailaotortilla = salt cod omelette, served at sagardotegi meals. Tortilla zaharra = old tortilla (a compliment - well-cooked). Very central to Basque bar culture.",example:{basque:"Tortilla bat eskatuko dut.",english:"I will order an omelette."}},
  {id:"txotx",basque:"Txotx",english:"Txotx (cider barrel signal)",cefr:"B1",topic:"food",pronunciation:"CHOHTCH",notes:"Txotx = the call shouted in a sagardotegi (cider house) when the barrel tap is opened and everyone rushes to fill their glass. The word itself is the name of the wooden peg (txotx) that plugs the barrel. Saying Txotx! is one of the most joyful Basque experiences.",example:{basque:"Txotx! deitzen dutenean, korrika joaten gara.",english:"When they shout Txotx we run to the barrel."}},
  {id:"giltzadura",basque:"Giltzadura",english:"Joint (body)",cefr:"B1",topic:"body",pronunciation:"geel-tsah-DOO-rah",notes:"Giltzadura = joint (body). Confirmed by Elhuyar in fitness/medical contexts: giltzadura-tartea = joint range, giltzadurak zaintzea = to care for joints. Giltza = key/lock. Giltzadurako mina = joint pain. Belaungiltzadura = knee joint.",example:{basque:"Giltzadurako mina dut.",english:"I have joint pain."}},
  {id:"zauria",basque:"Zauria",english:"Wound / Injury",cefr:"B1",topic:"body",pronunciation:"zow-REE-ah",notes:"Zauria = wound or injury. Zauri = wound (root). Zauritua = injured/wounded. Zauria sendatu = to heal a wound. Zauritu = to injure/wound. An important word for medical and emergency contexts. Zauririk gabe = unharmed.",example:{basque:"Zauria sendatzen ari da.",english:"The wound is healing."}},
  {id:"sukarra",basque:"Sukarra",english:"Fever",cefr:"B1",topic:"body",pronunciation:"soo-KAR-rah (rolled rr)",notes:"Sukarra = fever. Su = fire + -karra (intense). Literally fire-intensity. Sukarra daukat = I have a fever. Sukarra jaitsi = fever has gone down. Sukar handia = high fever. One of the most useful medical words - the connection to su (fire) makes it memorable.",example:{basque:"Sukarra daukat.",english:"I have a fever."}},
  {id:"sendagaia",basque:"Sendagaia",english:"Medicine / Remedy",cefr:"B1",topic:"body",pronunciation:"sen-dah-GAI-ah",notes:"Sendagaia = medicine or remedy. Sendatu = to heal/cure (root). Sendagile = doctor (healer). Sendakuntza = healing/medicine (field). Sendagai naturalak = natural remedies. Botika = pharmacy. Sendagaitegia = pharmacy/medicine cabinet.",example:{basque:"Sendagaia hartu behar dut.",english:"I need to take medicine."}},
  {id:"osasun_zentroa",basque:"Osasun zentroa",english:"Health center",cefr:"A2",topic:"body",pronunciation:"oh-SAH-soon ZEN-troh-ah",notes:"Osasun zentroa = health center or clinic. Osasun = health + zentroa = center. The primary healthcare system in the Basque Country (Osakidetza) is highly rated. Anbulatorioa is also used. Hitzordua eskatu = to make an appointment.",example:{basque:"Osasun zentrora joan behar dut.",english:"I need to go to the health center."}},
  {id:"ebakuntza",basque:"Ebakuntza",english:"Surgery / Operation",cefr:"B2",topic:"body",pronunciation:"eh-bah-KOON-tsah",notes:"Ebakuntza = surgery or surgical operation. Ebaki = to cut (root). Ebakuntza egin = to perform surgery. Ebakuntza gela = operating theater. Ebakuntzapea = under surgery. Important medical vocabulary for hospital contexts.",example:{basque:"Biharko ebakuntzarako prestatu behar naiz.",english:"I need to prepare for tomorrow's surgery."}},
  {id:"ehunekoa",basque:"Ehunekoa",english:"Percentage",cefr:"B1",topic:"numbers",pronunciation:"eh-HOO-neh-koh-ah",notes:"Ehunekoa = percentage. Ehun = hundred + -eko (of) + -a. Literally of-a-hundred. %50 = berrogeita hamar ehuneko. Ehuneko berrogeita hamar = fifty percent. Essential for news, statistics, and financial conversations.",example:{basque:"Ehuneko berrogeita hamar ados daude.",english:"Fifty percent are in agreement."}},
  {id:"laurdena",basque:"Laurdena",english:"Quarter / One fourth",cefr:"B1",topic:"numbers",pronunciation:"low-DER-nah",notes:"Laurdena = quarter or one fourth. Lau = four + -den (of) + -a. Ordu laurdena = quarter of an hour. Ordu t'erdi eta laurdena = quarter past one thirty. Laurdena = a fourth. Hiruren bat = a third. Useful for telling time and fractions.",example:{basque:"Ordu laurdena pasa da.",english:"A quarter of an hour has passed."}},
  {id:"birritan",basque:"Birritan",english:"Twice / Two times",cefr:"A2",topic:"numbers",pronunciation:"beer-REE-tan (rolled rr)",notes:"Birritan = twice or two times. Birri = twice (root). Hirugarrenez = for the third time. Behin = once. Behin eta berriz = once and again = repeatedly. Birritan pentsatu = to think twice. Very common in everyday Basque speech.",example:{basque:"Birritan esan dizut.",english:"I told you twice."}},
  {id:"milioiak",basque:"Milioiak",english:"Millions",cefr:"B1",topic:"numbers",pronunciation:"mee-lee-OH-ee-ak",notes:"Milioiak = millions (plural). Milioi = million (singular). Bi milioi = two million. Milioika = in their millions. Millaka = in thousands. The Basque Country GDP is around 35 billion euros. Milioi bat lagun = a million people.",example:{basque:"Milioika pertsona bizi da munduan.",english:"Millions of people live in the world."}},
  {id:"enbaxada",basque:"Enbaxada",english:"Embassy",cefr:"B2",topic:"travel",pronunciation:"en-bah-SHAH-dah",notes:"Enbaxada = embassy. From Spanish embajada. Enbaxadorea = ambassador. Kontsulatua = consulate. Enbaxadan erregistratu = to register at the embassy. Essential for travellers needing documentation or emergency assistance abroad.",example:{basque:"Enbaxadara joan behar dut.",english:"I need to go to the embassy."}},
  {id:"asegurua",basque:"Asegurua",english:"Insurance",cefr:"B1",topic:"travel",pronunciation:"ah-seh-GOO-roo-ah",notes:"Asegurua = insurance. From Spanish seguro. Bidaia asegurua = travel insurance. Aseguru medikoa = medical insurance. Asegurua egin = to take out insurance. Aseguratua = insured. Essential vocabulary for international travel.",example:{basque:"Bidaia asegurua daukat.",english:"I have travel insurance."}},
  {id:"zerbitzu_ordua",basque:"Zerbitzu ordua",english:"Service time / Opening hours",cefr:"B1",topic:"travel",pronunciation:"zer-BEET-soo OR-doo-ah",notes:"Zerbitzu ordua = service time or opening hours. Zerbitzu = service + ordua = time/hour. Harrera = check-in (hotel reception). Sarrera ordua = check-in time. Irteera ordua = check-out time. Zerbitzu ordutegia = service schedule.",example:{basque:"Zerbitzu ordua goizeko bederatzietatik arratsaldeko seietara da.",english:"The service hours are from nine in the morning to six in the afternoon."}},
  {id:"galdu",basque:"Galdu",english:"To lose / To miss",cefr:"A2",topic:"travel",pronunciation:"GAL-doo",notes:"Galdu = to lose or to miss. Galduta nago = I am lost. Pasaportea galdu dut = I lost my passport. Trena galdu dut = I missed the train. Galdera (question) shares the gal root. Galdu ezazu = don't lose it!",example:{basque:"Galduta nago.",english:"I am lost."}},
  {id:"bidaia_egitea",basque:"Bidaia egitea",english:"Traveling / To travel",cefr:"A2",topic:"travel",pronunciation:"bee-DAI-ah eh-GHEE-teh-ah",notes:"Bidaia egitea = to travel (the activity). Bidaia = journey + egin = to do. Bidaiatzen dut = I travel. Bidaiak egitea = to go on trips. Maiz bidaiatzen duzu? = Do you travel often? Bidaiari = traveller.",example:{basque:"Bidaia egitea gustatzen zait oso.",english:"I like traveling very much."}},
  {id:"esan_nahi_dut",basque:"Esan nahi dut",english:"I mean / What I mean is",cefr:"B1",topic:"greetings",pronunciation:"EH-san NAI doot",notes:"Esan nahi dut = I mean, or what I mean is. Esan = to say + nahi = want + dut = I have/do. Literally I want to say. Zer esan nahi duzu? = What do you mean? Hori esan nahi dut = That is what I mean. Essential for clarification in conversation.",example:{basque:"Esan nahi dut, ez dakit ziur.",english:"What I mean is I am not sure."}},
  {id:"nola_esaten_da",basque:"Nola esaten da?",english:"How do you say...?",cefr:"A2",topic:"greetings",pronunciation:"NOH-lah EH-sah-ten dah",notes:"Nola esaten da...? = How do you say...? The single most useful phrase for language learners. Nola esaten da euskaraz? = How do you say it in Basque? Nola idazten da? = How do you write it? Essential for expanding vocabulary in conversation.",example:{basque:"Nola esaten da hori euskaraz?",english:"How do you say that in Basque?"}},
  {id:"esaldi",basque:"Esaldia",english:"Phrase / Sentence",cefr:"B1",topic:"greetings",pronunciation:"eh-SAL-dee-ah",notes:"Esaldia = phrase or sentence. Esan = to say + -aldi (instance) + -a. Literally a saying-instance. Esaldi bat = one sentence. Esaldi laburra = short phrase. Egiturazko esaldia = set phrase. Hitzaldi = speech (word-instance). Useful metalanguage for language learners.",example:{basque:"Esaldi hori ikasi dut.",english:"I have learned that phrase."}},
  {id:"arrazoia_duzu",basque:"Arrazoia duzu",english:"You are right",cefr:"B1",topic:"greetings",pronunciation:"ar-rah-SOI-ah DOO-soo",notes:"Arrazoia duzu = you are right (literally you have the reason). Arrazoirik ez duzu = you are wrong. Arrazoi = reason + duzu = you have. Arrazoi osoa = completely right. Egia da = it is true. A very common social phrase in Basque conversation.",example:{basque:"Arrazoia duzu, barkatu.",english:"You are right, I am sorry."}},
  {id:"ziur_ez_nago",basque:"Ziur ez nago",english:"I am not sure",cefr:"A2",topic:"greetings",pronunciation:"zee-OOR ez NAH-go",notes:"Ziur ez nago = I am not sure. Ziur = sure/certain. Ez nago ziur ere = I am not sure either. Agian = perhaps (related expression). Seguruenik = probably. Ziurtasuna = certainty. Very commonly used to soften statements.",example:{basque:"Ziur ez nago erantzunaz.",english:"I am not sure about the answer."}},
  {id:"zabala",basque:"Zabala",english:"Wide / Broad",cefr:"A2",topic:"adjectives",pronunciation:"sah-BAH-lah",notes:"Zabala = wide or broad. Zabal = wide (root). Zabaldu = to widen/open. Zabalera = width. Euskal Herri Zabala = Greater Basque Country. Zabalgunea = widening/expansion. Common in place names: Zabalondo, Zabalgana.",example:{basque:"Kalea zabala da.",english:"The street is wide."}},
  {id:"estua",basque:"Estua",english:"Narrow / Tight",cefr:"A2",topic:"adjectives",pronunciation:"es-TOO-ah",notes:"Estua = narrow or tight. Estu = narrow (root). Estuasun = tightness/narrowness. Estu egon = to be in a tight spot/stressed. Estualdi = tight moment/crisis. Zabala (wide) and estua (narrow) are a natural pair.",example:{basque:"Bide estua da.",english:"The road is narrow."}},
  {id:"leuna",basque:"Leuna",english:"Smooth / Gentle / Soft",cefr:"A2",topic:"adjectives",pronunciation:"leh-OO-nah",notes:"Leuna = smooth, gentle, or soft to the touch. Leun = smooth (root). Leundu = to smooth/soften. Leuntasuna = smoothness. Azala leuna = smooth skin. Doinua leuna = gentle melody. Haizea leuna = gentle breeze. Often used for textures and manner.",example:{basque:"Azala leuna du.",english:"She has smooth skin."}},
  {id:"zurruna",basque:"Zurruna",english:"Stiff / Rigid",cefr:"B1",topic:"adjectives",pronunciation:"SOOR-roo-nah",notes:"Zurruna = stiff, rigid, or inflexible. Zurrun = stiff (root). Zurrundu = to stiffen. Muskulu zurrunak = stiff muscles. Jarrera zurruna = rigid attitude. Do not confuse with gogorra (hard/tough). Zurrun egon = to be stiff.",example:{basque:"Lepoa zurruna daukat.",english:"I have a stiff neck."}},
  {id:"urtarrila",basque:"Urtarrila",english:"January",cefr:"A1",topic:"time",pronunciation:"oor-TAR-ree-lah",notes:"January. Urte (year) + arril - the month that starts the year. The coldest month in the Basque Country.",example:{basque:"Urtarrilan jaio nintzen.",english:"I was born in January."}},
  {id:"otsaila",basque:"Otsaila",english:"February",cefr:"A1",topic:"time",pronunciation:"ot-SAI-lah",notes:"February. Otso (wolf) is in the root - the wolf month, when wolves were hungriest in winter.",example:{basque:"Otsailean hotz egiten du.",english:"It is cold in February."}},
  {id:"martxoa",basque:"Martxoa",english:"March",cefr:"A1",topic:"time",pronunciation:"mar-CHOH-ah",notes:"March. From Latin Martius. Spring begins in the Basque Country with wildflowers blooming.",example:{basque:"Martxoan udaberria hasten da.",english:"Spring begins in March."}},
  {id:"apirila",basque:"Apirila",english:"April",cefr:"A1",topic:"time",pronunciation:"ah-pee-REE-lah",notes:"April. From Latin Aprilis. Famous Basque festivals like Aberri Eguna (Basque Homeland Day) fall in April.",example:{basque:"Apirilan euria egiten du.",english:"It rains in April."}},
  {id:"maiatza",basque:"Maiatza",english:"May",cefr:"A1",topic:"time",pronunciation:"mai-ATS-ah",notes:"May. From Latin Maius. The Basque countryside is at its most beautiful in May - green hills and mild weather.",example:{basque:"Maiatzean eguzkia egiten du.",english:"It is sunny in May."}},
  {id:"ekaina",basque:"Ekaina",english:"June",cefr:"A1",topic:"time",pronunciation:"eh-KAI-nah",notes:"June. Eki (sun) is in the root - the sunny month. The famous San Fermin festival begins in nearby Pamplona in July.",example:{basque:"Ekainean uda hasten da.",english:"Summer begins in June."}},
  {id:"uztaila",basque:"Uztaila",english:"July",cefr:"A1",topic:"time",pronunciation:"ooz-TAI-lah",notes:"July. Uzta (harvest) is in the root. The hottest month. Aste Nagusia (Great Week) in Bilbo is in August.",example:{basque:"Uztailean bero handia dago.",english:"It is very hot in July."}},
  {id:"abuztua",basque:"Abuztua",english:"August",cefr:"A1",topic:"time",pronunciation:"ah-BOOS-too-ah",notes:"August. From Latin Augustus. Aste Nagusia in Bilbao and La Semana Grande in Donostia are in August - the biggest festivals.",example:{basque:"Abuztuan Aste Nagusia da.",english:"The Great Week is in August."}},
  {id:"iraila",basque:"Iraila",english:"September",cefr:"A1",topic:"time",pronunciation:"ee-RAI-lah",notes:"September. Irail possibly from ira (fern) - when ferns turn golden. The sagardotegi (cider houses) season begins.",example:{basque:"Irailean eskola hasten da.",english:"School starts in September."}},
  {id:"urria",basque:"Urria",english:"October",cefr:"A1",topic:"time",pronunciation:"OOR-ree-ah",notes:"October. Urri means scarce - the month when summer abundance ends. Autumn colors in the Basque hills are spectacular.",example:{basque:"Urrian hostoak erortzen dira.",english:"Leaves fall in October."}},
  {id:"azaroa",basque:"Azaroa",english:"November",cefr:"A1",topic:"time",pronunciation:"ah-zah-ROH-ah",notes:"November. Aza (cabbage) is in the root - the cabbage month, when winter vegetables were harvested. Cider season is in full swing.",example:{basque:"Azaroan sagardoa edaten dugu.",english:"We drink cider in November."}},
  {id:"abendua",basque:"Abendua",english:"December",cefr:"A1",topic:"time",pronunciation:"ah-BEN-doo-ah",notes:"December. Aben possibly from Latin adventus. Also called Gabon-hilabetea (Christmas month). Gabon (Christmas) is a major celebration.",example:{basque:"Abenduan Gabonak ospatzen ditugu.",english:"We celebrate Christmas in December."}},
  {id:"burujabetza",basque:"Burujabetza",english:"Sovereignty",cefr:"B2",topic:"society",pronunciation:"boo-roo-yah-BET-sah",notes:"Sovereignty or self-rule. Buru (head) + jabetza (ownership). Central concept in Basque political discourse.",example:{basque:"Burujabetzaren aldeko mugimendua indartsua da.",english:"The movement for sovereignty is strong."}},
  {id:"gutxiengoa",basque:"Gutxiengoa",english:"Minority",cefr:"B2",topic:"society",pronunciation:"goo-chee-EN-goh-ah",notes:"Minority. Gutxi (few) + -engoa (suffix). Gutxiengo hizkuntzak = minority languages. Important in the context of language rights.",example:{basque:"Gutxiengoen eskubideak babestu behar dira.",english:"The rights of minorities must be protected."}},
  {id:"abertzaletasuna",basque:"Abertzaletasuna",english:"Basque patriotism",cefr:"B2",topic:"society",pronunciation:"ah-ber-tsah-leh-tah-SOO-nah",notes:"Basque patriotism or nationalism. Aberri (homeland) + -zaletasuna (love of). A defining concept in Basque political identity.",example:{basque:"Abertzaletasuna kultura eta hizkuntzarekin lotuta dago.",english:"Basque patriotism is linked to culture and language."}},
  {id:"eztabaida",basque:"Eztabaida",english:"Debate / Argument",cefr:"B2",topic:"society",pronunciation:"ez-tah-BAI-dah",notes:"Debate or argument. Eztabaidatu = to debate. Used for both political debate and personal argument. Eztabaida publikoa = public debate.",example:{basque:"Eztabaida politikoa bizia da.",english:"The political debate is lively."}},
  {id:"negoziaketa",basque:"Negoziaketa",english:"Negotiation",cefr:"B2",topic:"work",pronunciation:"neh-go-tsee-ah-KEH-tah",notes:"Negotiation. From Spanish negociación. Negoziatu = to negotiate. Essential in business and labor relations.",example:{basque:"Negoziaketa luzea izan zen.",english:"The negotiation was long."}},
  {id:"estrategia",basque:"Estrategia",english:"Strategy",cefr:"B2",topic:"work",pronunciation:"es-trah-TEH-ghee-ah",notes:"Strategy. Borrowed from Spanish/Greek. Estrategia komertzial = commercial strategy. Used in business, politics and sport.",example:{basque:"Estrategia berri bat behar dugu.",english:"We need a new strategy."}},
  {id:"lehiakortasuna",basque:"Lehiakortasuna",english:"Competitiveness",cefr:"B2",topic:"work",pronunciation:"leh-ee-ah-kor-tah-SOO-nah",notes:"Competitiveness. Lehia (competition) + -kortasuna. Important in Basque industrial and business culture. The Basque economy is known for its cooperatives.",example:{basque:"Lehiakortasuna hobetzeko inbertitu behar dugu.",english:"We need to invest to improve competitiveness."}},
  {id:"sindikalismoa",basque:"Sindikalismoa",english:"Trade unionism",cefr:"B2",topic:"work",pronunciation:"seen-dee-kah-lees-MOH-ah",notes:"Trade unionism. ELA and LAB are the main Basque trade unions. Strong tradition of worker solidarity in the Basque Country.",example:{basque:"Sindikalismoa indartsua da Euskal Herrian.",english:"Trade unionism is strong in the Basque Country."}},
  {id:"kooperatiba",basque:"Kooperatiba",english:"Cooperative",cefr:"B2",topic:"work",pronunciation:"koh-oh-peh-rah-TEE-bah",notes:"Cooperative. The Mondragon Corporation is the world's largest worker cooperative, founded in the Basque Country in 1956.",example:{basque:"Mondragon kooperatiba handiena da munduan.",english:"Mondragon is the largest cooperative in the world."}},
  {id:"lauburu",basque:"Lauburu",english:"Basque cross / symbol",cefr:"B2",topic:"culture",pronunciation:"LOW-boo-roo",notes:"The Basque cross - a swastika-like symbol with curved arms. Lau (four) + buru (heads). Ancient symbol of the Basque people representing the four provinces or the four elements.",example:{basque:"Lauburua Euskal Herriko sinboloa da.",english:"The lauburu is a symbol of the Basque Country."}},
  {id:"aste_nagusia",basque:"Aste Nagusia",english:"Great Week (Bilbao festival)",cefr:"B2",topic:"culture",pronunciation:"AS-teh nah-GOO-see-ah",notes:"The Great Week - Bilbao's biggest annual festival in August. Nine days of concerts, street parties, and events. Attracts over a million visitors.",example:{basque:"Aste Nagusia abuztuan ospatzen da Bilbon.",english:"The Great Week is celebrated in Bilbao in August."}},
  {id:"nostalgia",basque:"Nostalgia",english:"Nostalgia",cefr:"B2",topic:"emotions",pronunciation:"nos-TAL-ghee-ah",notes:"Nostalgia. Same as English/Spanish. Nostalgikoa = nostalgic. Often felt by the Basque diaspora - a strong community exists in the Americas.",example:{basque:"Nostalgia sentitzen dut herriaren berri entzutean.",english:"I feel nostalgia when I hear news of the village."}},
  {id:"mina",basque:"Bihotz-mina",english:"Heartache / Heartbreak",cefr:"B2",topic:"emotions",pronunciation:"bee-HOTS MEE-nah",notes:"Heartache or heartbreak. Bihotz (heart) + mina (pain). Bihotz-mina daukat = I have heartache. A poetic and very Basque way of expressing emotional pain. Appears frequently in Basque song and literature.",example:{basque:"Bihotz-mina sentitzen dut zu gabe.",english:"I feel heartache without you."}},
  {id:"konplexua",basque:"Konplexua",english:"Complex",cefr:"B2",topic:"adjectives",pronunciation:"kon-PLEH-shoo-ah",notes:"Complex or complicated. From Spanish/Latin. Konplexutasuna = complexity. Egoera konplexua = complex situation. Used in academic and professional contexts.",example:{basque:"Egoera politikoa oso konplexua da.",english:"The political situation is very complex."}},
  {id:"eztabaidagarria",basque:"Eztabaidagarria",english:"Controversial / Debatable",cefr:"B2",topic:"adjectives",pronunciation:"ez-tah-bai-dah-GAR-ree-ah",notes:"Controversial or debatable. Eztabaida (debate) + -garria (worthy of). Used for topics that spark debate. Gai eztabaidagarria = controversial topic.",example:{basque:"Gai hori oso eztabaidagarria da.",english:"That topic is very controversial."}},
  {id:"iraunkorra",basque:"Iraunkorra",english:"Sustainable / Lasting",cefr:"B2",topic:"adjectives",pronunciation:"ee-rown-KOR-rah",notes:"Sustainable or lasting. Iraunkor = lasting/durable. Garapen iraunkorra = sustainable development. Key term in environmental and economic policy.",example:{basque:"Ekonomia iraunkorra behar dugu.",english:"We need a sustainable economy."}},
  {id:"ahula",basque:"Ahula",english:"Weak / Fragile",cefr:"B2",topic:"adjectives",pronunciation:"ah-HOO-lah",notes:"Weak or fragile. Ahultasuna = weakness. Ahuldu = to weaken. Opposite: sendoa (strong). Used for physical and abstract weakness.",example:{basque:"Posizioa ahula da negoziaketan.",english:"The position is weak in the negotiation."}},
  {id:"sendoa",basque:"Sendoa",english:"Strong / Robust",cefr:"B2",topic:"adjectives",pronunciation:"SEN-doh-ah",notes:"Strong or robust. Sendotu = to strengthen. Osasun sendoa = robust health. Opposite: ahula (weak). Also means healthy/solid.",example:{basque:"Ekonomia sendoa daukagu.",english:"We have a strong economy."}},
  {id:"zehatza",basque:"Zehatza",english:"Precise / Exact",cefr:"B2",topic:"adjectives",pronunciation:"zeh-HAT-sah",notes:"Precise or exact. Zehatz-mehatz = precisely/exactly. Zehaztu = to specify. Important in academic, legal and scientific discourse.",example:{basque:"Datu zehatzak behar ditugu.",english:"We need precise data."}},
  {id:"kontraesankorra",basque:"Kontraesankorra",english:"Contradictory",cefr:"B2",topic:"adjectives",pronunciation:"kon-trah-eh-san-KOR-rah",notes:"Contradictory. Kontraesan (contradiction) + -korra. Mezua kontraesankorra da = the message is contradictory. Used in logical and political debate.",example:{basque:"Bere argudioak kontraesankorrak dira.",english:"His arguments are contradictory."}},
  {id:"immunitate_sistema",basque:"Immunitate sistema",english:"Immune system",cefr:"B2",topic:"body",pronunciation:"ee-moo-nee-TAH-teh sees-TEH-mah",notes:"Immune system. International terms adopted into Basque. Immunitatea = immunity. Increasingly important vocabulary for health discussions.",example:{basque:"Immunitate sistemak gorputza babesten du.",english:"The immune system protects the body."}},
  {id:"odol_presioa",basque:"Odol-presioa",english:"Blood pressure",cefr:"B2",topic:"body",pronunciation:"OH-dol preh-SYOH-ah",notes:"Blood pressure. Odol (blood) + presioa (pressure). Odol-presio altua = high blood pressure. Odol-presio baxua = low blood pressure. Common medical term.",example:{basque:"Odol-presioa neurtu behar dut.",english:"I need to measure my blood pressure."}},
  {id:"bisa",basque:"Bisa",english:"Visa",cefr:"B2",topic:"travel",pronunciation:"BEE-sah",notes:"Visa. International term. Bisa eskatu = to apply for a visa. Schengen area means EU travel is visa-free for most Europeans.",example:{basque:"Bisa behar dut herrialde horretara joateko.",english:"I need a visa to travel to that country."}},
  {id:"aduana",basque:"Aduana",english:"Customs",cefr:"B2",topic:"travel",pronunciation:"ah-doo-AH-nah",notes:"Customs. From Spanish aduana. Aduana kontrola = customs control. The Franco-Spanish border through the Basque Country was historically significant.",example:{basque:"Aduanan gelditu ninduten.",english:"They stopped me at customs."}},
  {id:"ondorengoa",basque:"Ondorengoa",english:"Descendant / Heir",cefr:"B2",topic:"family",pronunciation:"on-doh-REN-goh-ah",notes:"Descendant or heir. Ondoren (after/following) + -goa. Ondorengo = successor. The Basque diaspora maintains strong connections to their ondorengoak worldwide.",example:{basque:"Euskal diasporaren ondorengoak mundu osoan daude.",english:"The descendants of the Basque diaspora are all over the world."}},
  {id:"arbola",basque:"Arbola",english:"Family tree / Lineage",cefr:"B2",topic:"family",pronunciation:"ar-BOH-lah",notes:"Tree, but also used for family tree. Familiaren arbola = family tree. Gernikako Arbola (Tree of Gernika) is the sacred oak symbol of Basque democracy and rights.",example:{basque:"Gure familiaren arbola luzea da.",english:"Our family tree is long."}},
  {id:"nekea",basque:"Nekea",english:"Tiredness / Fatigue",cefr:"A1",topic:"emotions",pronunciation:"NEH-keh-ah",notes:"Tiredness or fatigue. Neke = tiredness (root). Nekatuta nago = I am tired. Nekagarria = tiring. Very common in everyday conversation.",example:{basque:"Nekea sentitzen dut gauero lanaren ondoren.",english:"I feel tiredness every evening after work."}},
  {id:"lantegia",basque:"Lantegia",english:"Workplace / Factory",cefr:"A1",topic:"work",pronunciation:"lan-TEH-ghee-ah",notes:"Workplace or factory. Lan (work) + tegi (place). The Basque Country has a strong industrial tradition - steel, shipbuilding and machine tools.",example:{basque:"Lantegian lan egiten dut.",english:"I work in the factory."}},
  {id:"nagusia",basque:"Nagusia",english:"Boss / Manager",cefr:"A1",topic:"work",pronunciation:"nah-GOO-see-ah",notes:"Boss or manager. Nagusi = main/chief (root). Also means the main one or the important one. Aste Nagusia = Great Week (main week).",example:{basque:"Nire nagusia ona da.",english:"My boss is good."}},
  {id:"lobak",basque:"Lobak",english:"Nieces and nephews",cefr:"A2",topic:"family",pronunciation:"LOH-bak",notes:"Nieces and nephews (plural). Loba = niece/nephew (singular). Basque uses the same word for both - no gender distinction. Lobatxoa = little niece/nephew.",example:{basque:"Nire lobak maitatzen ditut.",english:"I love my nieces and nephews."}},
  {id:"bikotekidea",basque:"Bikotekidea",english:"Partner / Significant other",cefr:"A2",topic:"family",pronunciation:"bee-koh-teh-KEE-deh-ah",notes:"Partner or significant other. Bikote (couple) + kidea (member). Gender-neutral term for a romantic partner. More neutral than senarra (husband) or emaztea (wife).",example:{basque:"Nire bikotekidearekin bizi naiz.",english:"I live with my partner."}},
  {id:"ehun_mila",basque:"Ehun mila",english:"One hundred thousand",cefr:"B1",topic:"numbers",pronunciation:"EH-hoon MEE-lah",notes:"One hundred thousand. Ehun (100) + mila (1000) = 100,000. Bi ehun mila = 200,000. The Basque Country has a population of about bi milioi (two million).",example:{basque:"Ehun mila lagun bizi dira hemen.",english:"One hundred thousand people live here."}},
  {id:"milioia",basque:"Milioia",english:"Million",cefr:"B1",topic:"numbers",pronunciation:"mee-LEE-oh-ee-ah",notes:"Million. From Spanish millón. Bi milioi = two million. Milioika = millions of. Used in economic and demographic contexts.",example:{basque:"Bi milioi lagun bizi dira Euskal Herrian.",english:"Two million people live in the Basque Country."}},
  {id:"ezkongabea",basque:"Ezkongabea",english:"Single / Unmarried",cefr:"B1",topic:"family",pronunciation:"ez-kon-GAH-beh-ah",notes:"Single or unmarried. Ez (not) + kontu (married) + gabea (without). Ezkongabe bizi = to live single. Increasingly common as marriage rates change.",example:{basque:"Oraindik ezkongabea naiz.",english:"I am still single."}},
  {id:"dibortziatua",basque:"Dibortziatua",english:"Divorced",cefr:"B1",topic:"family",pronunciation:"dee-bor-tsee-ah-TOO-ah",notes:"Divorced. From Spanish divorciado. Dibortziatu = to divorce. Dibortzioa = divorce. Family structures in the Basque Country have changed significantly.",example:{basque:"Nire gurasoak dibortziatu ziren.",english:"My parents got divorced."}},
  {id:"familia_zabala",basque:"Familia zabala",english:"Extended family",cefr:"B1",topic:"family",pronunciation:"fah-MEE-lee-ah zah-BAH-lah",notes:"Extended family. Familia (family) + zabala (wide/broad). Traditional Basque culture placed great importance on the extended family unit - the etxea (house/family).",example:{basque:"Familia zabalarekin biltzen gara Gabonak.",english:"We gather with the extended family at Christmas."}},
  {id:"haurtzaroa",basque:"Haurtzaroa",english:"Childhood",cefr:"B1",topic:"family",pronunciation:"howr-TSAH-roh-ah",notes:"Childhood. Haur (child) + -tzaroa (period of). Haurtzaroko oroimenak = childhood memories. Haurtzaro zoriontsu = happy childhood.",example:{basque:"Haurtzaroan mendian jolasten nuen.",english:"In childhood I played in the mountains."}},
  {id:"marroia",basque:"Marroia",english:"Brown",cefr:"A2",topic:"colors",pronunciation:"mar-ROH-ee-ah",notes:"Brown. From Spanish marrón. Marroi iluna = dark brown. The color of Basque wooden furniture and traditional farmhouses (baserri).",example:{basque:"Aulkia marroia da.",english:"The chair is brown."}},
  {id:"gris",basque:"Gris",english:"Gray",cefr:"A2",topic:"colors",pronunciation:"GREES",notes:"Gray. From Spanish gris. Gris argia = light gray. Gris iluna = dark gray. The color of the famous Basque pintxo bar counters and the winter sky.",example:{basque:"Zerua grisa dago gaur.",english:"The sky is gray today."}},
  {id:"iraganeko",basque:"Iraganeko",english:"Past (adjective)",cefr:"B1",topic:"time",pronunciation:"ee-rah-GAH-neh-koh",notes:"Past (as adjective). Iragana = the past (noun). Iraganeko gertaerak = past events. Understanding past/present/future is essential for intermediate speakers.",example:{basque:"Iraganeko akatsak ez ditut ahaztu.",english:"I have not forgotten the mistakes of the past."}},
  {id:"aldi_berean",basque:"Aldi berean",english:"At the same time / Meanwhile",cefr:"B1",topic:"time",pronunciation:"AL-dee beh-REH-an",notes:"At the same time or meanwhile. Aldi (time/period) + berean (in the same). Useful for describing simultaneous events. Bitartean is a common synonym.",example:{basque:"Aldi berean bi gauza egin ditzaket.",english:"I can do two things at the same time."}},
  {id:"noizbehinka",basque:"Noizbehinka",english:"Occasionally / From time to time",cefr:"B1",topic:"time",pronunciation:"noiz-beh-HIN-kah",notes:"Occasionally or from time to time. Noiz (when) + behinka (sometimes). Noizbehinka joaten naiz = I go occasionally. Very useful adverb of frequency.",example:{basque:"Noizbehinka mendira joaten gara.",english:"We occasionally go to the mountains."}},
  {id:"harrera_ona",basque:"Harrera ona egin",english:"To welcome / To give a warm reception",cefr:"B2",topic:"greetings",pronunciation:"har-REH-rah OH-nah eh-GHEEN",notes:"To welcome or give a warm reception. Harrera = reception. Harrera ona egin zioten = they gave him a warm welcome. Used in formal and informal contexts.",example:{basque:"Harrera ona egin ziguten etxean.",english:"They gave us a warm welcome at home."}},
  {id:"agurra",basque:"Agurra",english:"Greeting / Farewell (formal)",cefr:"B2",topic:"greetings",pronunciation:"ah-GOOR-rah",notes:"Formal greeting or farewell. Agur is the basic word but agurra (with article) is used in more formal contexts. Agurrak bidali = to send greetings. Agur eta ohore = farewell and honor (formal closing).",example:{basque:"Agur bero bat bidaltzen dizuet denei.",english:"I send warm greetings to everyone."}},
  {id:"adeitasuna",basque:"Adeitasuna",english:"Courtesy / Politeness",cefr:"B2",topic:"greetings",pronunciation:"ah-day-tah-SOO-nah",notes:"Courtesy or politeness. Adeitsua = courteous. Adeitasunez = politely. Important in formal Basque communication. Adeitasun handiz = with great courtesy.",example:{basque:"Adeitasunez hitz egin behar dugu.",english:"We must speak with courtesy."}},
  {id:"gastronomia",basque:"Gastronomia",english:"Gastronomy",cefr:"B2",topic:"food",pronunciation:"gas-troh-noh-MEE-ah",notes:"Gastronomy. The Basque Country has more Michelin stars per capita than anywhere on earth. San Sebastián is considered the world capital of gastronomy.",example:{basque:"Euskal gastronomia munduan ospetsua da.",english:"Basque gastronomy is famous in the world."}},
  {id:"txoko",basque:"Txokoa",english:"Gastronomic society",cefr:"B2",topic:"food",pronunciation:"CHOH-koh-ah",notes:"A txoko is a private gastronomic society where members cook and eat together. A uniquely Basque institution - historically male-only but now more inclusive. Hundreds exist across the Basque Country.",example:{basque:"Txokoan bazkaltzen dugu larunbatetan.",english:"We have lunch in the gastronomic society on Saturdays."}},
  {id:"errezeta",basque:"Errezeta",english:"Recipe",cefr:"B2",topic:"food",pronunciation:"er-reh-ZEH-tah",notes:"Recipe. From Spanish receta. Errezeta jarraitu = to follow a recipe. Traditional Basque recipes are passed down through generations.",example:{basque:"Amaren errezeta jarraituko dut.",english:"I will follow my mother's recipe."}},
  {id:"zenbakia",basque:"Zenbakia",english:"Number (mathematical)",cefr:"B2",topic:"numbers",pronunciation:"zen-BAH-kee-ah",notes:"Number (mathematical). Zenb (how many) root. Zenbaki bikoitiak = even numbers. Zenbaki bakoitiak = odd numbers. Zenbaki lehenak = prime numbers.",example:{basque:"Zenbaki lehenak ikertzen ditut.",english:"I study prime numbers."}},
  {id:"kolorea_galdu",basque:"Kolorea galdu",english:"To fade (color)",cefr:"B2",topic:"colors",pronunciation:"koh-LOH-reh-ah GAL-doo",notes:"To fade (of color). Kolorea (color) + galdu (to lose). Arropak kolorea galdu du = the clothes have faded. Used in both literal and figurative senses.",example:{basque:"Eguzkiaren ondorioz kolorea galdu du.",english:"It has faded due to the sun."}},
  {id:"ñabardura",basque:"Ñabardura",english:"Nuance / Shade (of color)",cefr:"B2",topic:"colors",pronunciation:"nyah-bar-DOO-rah",notes:"Nuance or shade of color. From Spanish ñabardura. Kolore ñabardura = shade of color. Also used figuratively for subtle differences in meaning or opinion.",example:{basque:"Kolore horren ñabardura polita da.",english:"The shade of that color is beautiful."}},
  {id:"garaian",basque:"Garaian",english:"On time / In due time",cefr:"B2",topic:"time",pronunciation:"gah-RAI-an",notes:"On time or in due time. Garai (era/time) + -an (in). Garaian iritsi = to arrive on time. Garaiz = in time/on time. Garaipen = victory (from the same root).",example:{basque:"Garaian iritsi naiz bilera.",english:"I have arrived on time for the meeting."}},
  {id:"iraupena",basque:"Iraupena",english:"Duration / Lifespan",cefr:"B2",topic:"time",pronunciation:"ee-row-PEH-nah",notes:"Duration or lifespan. Iraun (to last) + -pena. Iraupen luzea = long duration. Hizkuntzaren iraupena = the survival/duration of the language. Important in linguistic and historical contexts.",example:{basque:"Proiektuaren iraupena bi urte da.",english:"The duration of the project is two years."}},
  {id:"digestioa",basque:"Digestioa",english:"Digestion",cefr:"B2",topic:"body",pronunciation:"dee-ges-TYOH-ah",notes:"Digestion. International term. Digestio ona = good digestion. Digestio arazoak = digestive problems. The rich Basque diet makes this a common topic.",example:{basque:"Digestio ona izateko ondo jan behar duzu.",english:"You need to eat well to have good digestion."}},
  {id:"arnasaketa",basque:"Arnasaketa",english:"Breathing / Respiration",cefr:"B2",topic:"body",pronunciation:"ar-nah-sah-KEH-tah",notes:"Breathing or respiration. Arnasa (breath) + -keta. Arnasa hartu = to breathe in. Arnasa bota = to breathe out. Arnasaren erritmoa = breathing rhythm.",example:{basque:"Arnasaketa sakon bat hartu.",english:"Take a deep breath."}},
  {id:"kultura_aniztasuna",basque:"Kultura aniztasuna",english:"Cultural diversity",cefr:"B2",topic:"travel",pronunciation:"kool-TOO-rah ah-nees-tah-SOO-nah",notes:"Cultural diversity. Kultura (culture) + aniztasuna (diversity). Important concept when discussing the Basque Country's unique position within Spain and France.",example:{basque:"Kultura aniztasuna aberastasuna da.",english:"Cultural diversity is a richness."}},
  {id:"medikua",basque:"Medikua",english:"Doctor / Physician",cefr:"A1",topic:"work",pronunciation:"meh-DEE-koo-ah",notes:"Doctor or physician. From Latin medicus. Medikuarengana joan = to go to the doctor. Medikua naiz = I am a doctor. Essential vocabulary for introductions.",example:{basque:"Medikua naiz eta ospitalean lan egiten dut.",english:"I am a doctor and I work in the hospital."}},
  {id:"erizaina",basque:"Erizaina",english:"Nurse",cefr:"A1",topic:"work",pronunciation:"eh-ree-ZAI-nah",notes:"Nurse. Erizain = nurse (root). One of the most common professions. Erizain ona = good nurse. The Basque health system (Osakidetza) is well regarded.",example:{basque:"Erizaina ospitalean lan egiten du.",english:"The nurse works in the hospital."}},
  {id:"sukaldaria",basque:"Sukaldaria",english:"Cook / Chef",cefr:"A1",topic:"work",pronunciation:"soo-kal-DAH-ree-ah",notes:"Cook or chef. Sukalde (kitchen) + -aria (person who does). The Basque Country is world famous for its chefs - Arzak, Berasategui, Aduriz. Sukaldari handia = great chef.",example:{basque:"Sukaldaria jatetxean lan egiten du.",english:"The chef works in the restaurant."}},
  {id:"abokatu",basque:"Abokatu",english:"Lawyer",cefr:"A1",topic:"work",pronunciation:"ah-boh-KAH-too",notes:"Lawyer. From Spanish abogado. Abokatu ona = good lawyer. Abokatuarengana joan = to go to a lawyer. Common profession word needed for introductions.",example:{basque:"Nire laguna abokatu da.",english:"My friend is a lawyer."}},
  {id:"idazkaria",basque:"Idazkaria",english:"Secretary / Administrator",cefr:"A1",topic:"work",pronunciation:"ee-daz-KAH-ree-ah",notes:"Secretary or administrator. Idatz (write) + -karia. Idazkari nagusia = head secretary. Common in office and government contexts.",example:{basque:"Idazkaria bulegoan dago.",english:"The secretary is in the office."}},
  {id:"nekazaria",basque:"Nekazaria",english:"Farmer",cefr:"A1",topic:"work",pronunciation:"neh-kah-ZAH-ree-ah",notes:"Farmer. Neka (toil) + -zaria. The baserri (farmhouse) and its farmer are central to Basque rural identity. Many Basque surnames come from farmhouse names.",example:{basque:"Nekazariak baserrian lan egiten du.",english:"The farmer works on the farmhouse."}},
  {id:"auzapeza",basque:"Auzapeza",english:"Mayor",cefr:"A1",topic:"society",pronunciation:"ow-zah-PEH-sah",notes:"Mayor. Auzo (neighbourhood) + peza. The local mayor (alkatea in Spanish Basque) is a key figure in Basque civic life. Auzapeza da = he/she is the mayor.",example:{basque:"Auzapeza herriko bileran dago.",english:"The mayor is at the town meeting."}},
  {id:"alkatea",basque:"Alkatea",english:"Mayor (alternate)",cefr:"A2",topic:"society",pronunciation:"al-KAH-teh-ah",notes:"Mayor - the more commonly used term in everyday Basque. From Spanish alcalde. Alkate berria = new mayor. Used in both formal and informal contexts alongside auzapeza.",example:{basque:"Alkate berria hautatu dute.",english:"They have elected a new mayor."}},
  {id:"bilioia",basque:"Bilioia",english:"Billion",cefr:"B2",topic:"numbers",pronunciation:"bee-LEE-oh-ee-ah",notes:"Billion (10^9). From Spanish billón. Note: in some European countries billón = trillion - context matters. Bilioi bat euro = one billion euros. Used in macroeconomic contexts.",example:{basque:"Estatuaren aurrekontua bilioi bat eurokoa da.",english:"The state budget is one billion euros."}},
  {id:"zerozero",basque:"Zero",english:"Zero",cefr:"B2",topic:"numbers",pronunciation:"ZEH-roh",notes:"Zero. International term. Zerora iritsi = to reach zero. Zero tolerantzia = zero tolerance. Also written zerotan (in zeros). Essential for mathematics and statistics.",example:{basque:"Tenperatura zeroan dago.",english:"The temperature is at zero."}},
  {id:"zenbaki_osoa",basque:"Zenbaki osoa",english:"Whole number / Integer",cefr:"B2",topic:"numbers",pronunciation:"zen-BAH-kee oh-SOH-ah",notes:"Whole number or integer. Zenbaki (number) + osoa (whole). Zenbaki positiboak = positive numbers. Zenbaki negatiboak = negative numbers. Used in mathematics and science.",example:{basque:"Zenbaki osoak dira 1, 2, 3 eta abar.",english:"Whole numbers are 1, 2, 3 and so on."}},
  {id:"kalkulua",basque:"Kalkulua",english:"Calculation / Calculus",cefr:"B2",topic:"numbers",pronunciation:"kal-KOO-loo-ah",notes:"Calculation or calculus. Kalkulu egin = to calculate. Kalkulagailua = calculator. Used in academic, financial and scientific contexts.",example:{basque:"Kalkulu hori egiteko denbora behar dut.",english:"I need time to make that calculation."}},
  {id:"formula",basque:"Formula",english:"Formula",cefr:"B2",topic:"numbers",pronunciation:"for-MOO-lah",notes:"Formula. International term used in mathematics and science. Formula matematikoa = mathematical formula. Formularen arabera = according to the formula.",example:{basque:"Formula hau ezagutu behar duzu azterketan.",english:"You need to know this formula for the exam."}},
  {id:"proportzioa",basque:"Proportzioa",english:"Proportion / Ratio",cefr:"B2",topic:"numbers",pronunciation:"pro-por-TSEE-oh-ah",notes:"Proportion or ratio. From Spanish proporción. Proportzioan = in proportion. Proportzio handian = in large proportion. Important in statistics and social science.",example:{basque:"Euskaldun proportzioa gora doa.",english:"The proportion of Basque speakers is rising."}},
  {id:"gutxi_gora_behera",basque:"Gutxi gora-behera",english:"Approximately / Roughly",cefr:"B2",topic:"numbers",pronunciation:"GOO-chee GOH-rah beh-HEH-rah",notes:"Approximately or roughly. Gutxi (little) + gora-behera (up-down). Gutxi gora-behera ehun = approximately one hundred. Very common in spoken Basque for estimates.",example:{basque:"Gutxi gora-behera berrehun lagun zeuden.",english:"There were approximately two hundred people."}},
  {id:"indigo",basque:"Indigo",english:"Indigo",cefr:"B2",topic:"colors",pronunciation:"IN-dee-goh",notes:"Indigo. International term. The deep blue-purple color. Indigo kolorea = indigo color. Used in art, fashion and design contexts.",example:{basque:"Indigo kolorea zeruko izarren artean bezala da.",english:"Indigo color is like among the stars in the sky."}},
  {id:"turkoisa",basque:"Turkoisa",english:"Turquoise",cefr:"B2",topic:"colors",pronunciation:"toor-KOI-sah",notes:"Turquoise. From French turquoise. The color of the Bay of Biscay on a clear day. Turkoisa kolorea = turquoise color. Used in art, jewelry and design.",example:{basque:"Itsasoa turkoisa dago udaran.",english:"The sea is turquoise in summer."}},
  {id:"granatea",basque:"Granatea",english:"Garnet / Dark red",cefr:"B2",topic:"colors",pronunciation:"grah-NAH-teh-ah",notes:"Garnet or dark red. From Spanish granate. The deep red of Athletic Bilbao's home kit. Used in fashion, art and wine description.",example:{basque:"Ardoa granate kolorekoa da.",english:"The wine is garnet colored."}},
  {id:"oliba_berdea",basque:"Oliba berdea",english:"Olive green",cefr:"B2",topic:"colors",pronunciation:"oh-LEE-bah BER-deh-ah",notes:"Olive green. Oliba (olive) + berdea (green). The color of Basque hills in autumn and of traditional military uniforms. Common in nature and fashion descriptions.",example:{basque:"Mendia oliba berdea da udazkenean.",english:"The mountain is olive green in autumn."}},
  {id:"beixa",basque:"Beixa",english:"Beige",cefr:"B2",topic:"colors",pronunciation:"BEI-shah",notes:"Beige. From French beige via Spanish. Used in interior design and fashion. Beixa kolorekoa = beige colored. Common in describing stone buildings and natural materials.",example:{basque:"Horma beixa kolorekoa da.",english:"The wall is beige colored."}},
  {id:"kolore_biziak",basque:"Kolore biziak",english:"Bright / Vivid colors",cefr:"B2",topic:"colors",pronunciation:"koh-LOH-reh BEE-tsee-ak",notes:"Bright or vivid colors. Kolore (color) + biziak (lively/vivid). Kolore bizia = a vivid color. Used in art criticism and description. Bizia also means alive - vivid colors are living colors.",example:{basque:"Kolore biziak erabiltzen ditu margolanak egiteko.",english:"He uses vivid colors to make paintings."}},
  {id:"koloregabea",basque:"Koloregabea",english:"Colorless / Pale",cefr:"B2",topic:"colors",pronunciation:"koh-loh-reh-GAH-beh-ah",notes:"Colorless or pale. Kolore (color) + gabea (without). Koloregabetu = to become pale/colorless. Used both literally and figuratively - a koloregabea description can mean bland or characterless.",example:{basque:"Gaixorik dagoenean aurpegia koloregabea egoten zaio.",english:"When he is ill his face becomes pale."}},
  {id:"distiratsua",basque:"Distiratsua",english:"Shiny / Glossy",cefr:"B2",topic:"colors",pronunciation:"dees-tee-RAT-soo-ah",notes:"Shiny or glossy. Distira (shine/gloss) + -tsua. Distiratsua da = it is shiny. Distira eman = to make shine. Used in art, design and describing materials.",example:{basque:"Pintura distiratsua erabili dut hormarako.",english:"I used glossy paint for the wall."}},
  {id:"habitat",basque:"Habitata",english:"Habitat",cefr:"B2",topic:"nature",pronunciation:"hah-bee-TAH-tah",notes:"Habitat. International term. Habitata galdu = to lose habitat. Habitataren suntsipena = habitat destruction. Key term in conservation biology and environmental policy.",example:{basque:"Animalien habitata babesten dugu.",english:"We protect the habitat of animals."}},
  {id:"espazio_naturala",basque:"Espazio naturala",english:"Nature reserve / Natural space",cefr:"B2",topic:"nature",pronunciation:"es-PAH-tsee-oh nah-too-RAH-lah",notes:"Nature reserve or natural space. Urdaibai is the Basque Country's most important biosphere reserve - a UNESCO site protecting the Oka river estuary and surrounding wetlands.",example:{basque:"Urdaibai espazio natural garrantzitsua da.",english:"Urdaibai is an important natural space."}},
  {id:"basabizitza",basque:"Basabizitza",english:"Wildlife",cefr:"B2",topic:"nature",pronunciation:"bah-sah-bee-TSETS-ah",notes:"Wildlife. Basa (wild) + bizitza (life). Basabizitzaren babesa = wildlife protection. The Pyrenean brown bear (hartza) has been reintroduced to the Basque mountains.",example:{basque:"Basabizitza aberatsa dago Pirinio inguruan.",english:"There is rich wildlife around the Pyrenees."}},
  {id:"lurrikara",basque:"Lurrikara",english:"Earthquake",cefr:"B2",topic:"nature",pronunciation:"loor-ree-KAH-rah",notes:"Earthquake. Lurra (earth) + ikara (trembling). Lurrikara txikiak = small earthquakes. The Pyrenees experience occasional seismic activity. Lurrikararen ondorioak = earthquake consequences.",example:{basque:"Lurrikara txiki bat sentitu genuen atzo.",english:"We felt a small earthquake yesterday."}},
  {id:"uholdeak",basque:"Uholdeak",english:"Floods",cefr:"B2",topic:"nature",pronunciation:"oo-hol-DEH-ak",notes:"Floods (plural). Uholde = flood (singular). The Basque rivers (Oka, Nerbioi, Urola) have historically caused flooding. Climate change is increasing flood risk. Uholdeen arriskua = flood risk.",example:{basque:"Uholdeak eragin handia izan du herrian.",english:"The floods have had a big impact on the town."}},
  {id:"lehortea",basque:"Lehortea",english:"Drought",cefr:"B2",topic:"nature",pronunciation:"leh-HOR-teh-ah",notes:"Drought. Lehor (dry) + -tea. Lehortearen ondorioak = drought consequences. Although the Basque Country is generally wet, droughts are increasing with climate change. Lehorte larria = severe drought.",example:{basque:"Lehortea dela eta urak murriztu dira.",english:"Due to the drought the water levels have decreased."}},
  {id:"klima_epela",basque:"Klima epela",english:"Temperate climate",cefr:"B2",topic:"nature",pronunciation:"KLEE-mah eh-PEH-lah",notes:"Temperate climate. Klima (climate) + epela (warm/temperate). The Basque Country has an oceanic climate - mild winters, cool summers, frequent rain. Klima epela eta hezea = temperate and humid climate.",example:{basque:"Klima epelak landareen hazkundea errazten du.",english:"The temperate climate facilitates plant growth."}},
  {id:"itsas_maila",basque:"Itsas maila",english:"Sea level",cefr:"B2",topic:"nature",pronunciation:"IT-sas MAI-lah",notes:"Sea level. Itsas (sea) + maila (level). Itsas mailaren igoera = sea level rise. Critical concept in climate change discussions. Itsas mailatik gorago = above sea level.",example:{basque:"Itsas mailak gora egin du azken hamarkadetan.",english:"Sea level has risen in recent decades."}},
  {id:"pil_pil",basque:"Pil-pil saltsa",english:"Pil-pil sauce",cefr:"B2",topic:"food",pronunciation:"PEEL PEEL SAL-tsah",notes:"Pil-pil is the iconic Basque emulsified sauce made by slowly swirling salted cod in olive oil and garlic until it emulsifies. The name comes from the sound of the gentle bubbling. A masterpiece of Basque technique.",example:{basque:"Bakailaoa pil-pil saltsan prestatzen jakitea garrantzitsua da.",english:"Knowing how to prepare cod in pil-pil sauce is important."}},
  {id:"mahaia_erreserbatu",basque:"Mahaia erreserbatu",english:"To reserve a table",cefr:"B2",topic:"food",pronunciation:"mah-HAI-ah er-reh-ser-BAH-too",notes:"To reserve a table. Mahai (table) + erreserbatu (to reserve). Essential phrase for Basque restaurant culture. Txoko reservations and Michelin-starred restaurants require advance booking.",example:{basque:"Gaueko zortzietarako mahaia erreserbatu dut.",english:"I have reserved a table for eight in the evening."}},
  {id:"dastaketa",basque:"Dastaketa",english:"Tasting / Degustation",cefr:"B2",topic:"food",pronunciation:"das-tah-KEH-tah",notes:"Tasting or degustation. Dastatu (to taste) + -keta. Dastaketa menua = tasting menu. San Sebastián's world-famous restaurants are known for their elaborate tasting menus. Ardo dastaketa = wine tasting.",example:{basque:"Dastaketa menua hartu genuen jatetxe horretan.",english:"We had the tasting menu at that restaurant."}},
  {id:"osagai",basque:"Osagaia",english:"Ingredient",cefr:"B2",topic:"food",pronunciation:"oh-sah-GAI-ah",notes:"Ingredient. Osa (compose) + -gaia. Osagai freskoak = fresh ingredients. Osagaien kalitatea funtsezkoa da sukaldaritzan = ingredient quality is essential in cooking. Key vocabulary for recipes and cooking.",example:{basque:"Osagai freskoak erabiltzea garrantzitsua da.",english:"Using fresh ingredients is important."}},
  {id:"sukalde_teknika",basque:"Sukalde teknika",english:"Cooking technique",cefr:"B2",topic:"food",pronunciation:"soo-KAL-deh tek-NEE-kah",notes:"Cooking technique. Sukalde (kitchen) + teknika. Basque nouvelle cuisine revolutionized European cooking in the 1970s with new techniques. Teknika berriak = new techniques. Key term in culinary education.",example:{basque:"Sukalde teknika berriak ikasten ari naiz.",english:"I am learning new cooking techniques."}},
  {id:"bertako_produktua",basque:"Bertako produktua",english:"Local product",cefr:"B2",topic:"food",pronunciation:"ber-TAH-koh pro-DOOK-too-ah",notes:"Local product. Bertako (local/from here) + produktua (product). The Basque food movement strongly values bertako produktuak - local ingredients from Basque farms and waters. Slow food philosophy.",example:{basque:"Bertako produktuak erabiltzen ditugu beti.",english:"We always use local products."}},
  {id:"ardandegi",basque:"Ardandegi",english:"Wine cellar / Winery",cefr:"B2",topic:"food",pronunciation:"ar-dan-DEH-ghee",notes:"Wine cellar or winery. Ardo (wine) + -tegi (place). The Rioja Alavesa wine region in the Basque Country produces world-class wines. Famous wineries include Marqués de Riscal and Bodegas Ysios.",example:{basque:"Ardandegian Rioja Arabako ardoak ikusten ditugu.",english:"We see Rioja Alavesa wines in the winery."}},
  {id:"agur_eta_ohore",basque:"Agur eta ohore",english:"Farewell and honor (formal closing)",cefr:"B2",topic:"greetings",pronunciation:"ah-GOOR EH-tah oh-HOH-reh",notes:"A traditional formal closing phrase meaning farewell and honor. Used to close formal speeches, letters and official communications. Reflects the Basque tradition of honor and respect in formal discourse.",example:{basque:"Agur eta ohore esanez amaitu zuen bere hitzaldia.",english:"He ended his speech saying farewell and honor."}},
  {id:"ongi_etorri",basque:"Ongi etorri",english:"Welcome",cefr:"B2",topic:"greetings",pronunciation:"ON-ghee eh-TOR-ree",notes:"Welcome. Ongi (well) + etorri (come) = come well. The standard welcome greeting. Ongi etorri Euskal Herrira = welcome to the Basque Country. Seen on signs and used at events and gatherings.",example:{basque:"Ongi etorri gure etxera!",english:"Welcome to our house!"}},
  {id:"zorte_on",basque:"Zorte on",english:"Good luck",cefr:"B2",topic:"greetings",pronunciation:"ZOR-teh ON",notes:"Good luck. Zorte (luck/fate) + on (good). Zorte oneko = lucky. Zorte txarra = bad luck. Used before exams, competitions, journeys. Zorte on denoi = good luck to everyone.",example:{basque:"Zorte on azterketan!",english:"Good luck in the exam!"}},
  {id:"osasun",basque:"Osasun!",english:"Cheers! / To your health!",cefr:"B2",topic:"greetings",pronunciation:"oh-sah-SOON",notes:"Cheers or to your health - the Basque toast. Osasun = health. Said when raising a glass. Topa! is also used. Osasunaren alde = for health. Athletic Bilbao fans shout Osasun! as a battle cry.",example:{basque:"Osasun! Gure osasunaren alde.",english:"Cheers! For our health."}},
  {id:"barkamen_eske",basque:"Barkamen eske",english:"Asking for forgiveness / Apologizing formally",cefr:"B2",topic:"greetings",pronunciation:"bar-KAH-men ES-keh",notes:"Asking for forgiveness or formal apology. Barkamen (forgiveness) + eske (asking for). More formal and serious than barkatu (excuse me). Used in written apologies and formal contexts.",example:{basque:"Barkamen eske nator nire portaeragatik.",english:"I come asking for forgiveness for my behavior."}},
  {id:"atsegin_dut",basque:"Atsegin dut",english:"I like it / I enjoy it",cefr:"B2",topic:"greetings",pronunciation:"at-SEH-gheen doot",notes:"I like it or I enjoy it. Atsegin (pleasure) + dut (I have). More formal and literary than gustatu. Atsegin dut zure laguntza = I appreciate your help. Used in polite and formal expressions of appreciation.",example:{basque:"Oso atsegin dut zurekin hitz egitea.",english:"I very much enjoy talking with you."}},
  {id:"errukia",basque:"Errukia",english:"Compassion / Pity",cefr:"B2",topic:"emotions",pronunciation:"er-ROO-kee-ah",notes:"Compassion or pity. Erruki = compassion (root). Errukia sentitu = to feel compassion. Errukizkoa = compassionate. Erruki gabea = merciless. A deep human quality celebrated in Basque culture.",example:{basque:"Errukia sentitzen dut bere egoera ikusten dudanean.",english:"I feel compassion when I see his situation."}},
  {id:"gorrotoa",basque:"Gorrotoa",english:"Hatred / Hate",cefr:"B2",topic:"emotions",pronunciation:"gor-ROH-toh-ah",notes:"Hatred or hate. Gorroto = hate (root). Gorroto dut = I hate it. Gorrotoz betea = full of hate. Important for discussing conflict, discrimination and reconciliation in Basque political history.",example:{basque:"Gorrotoa ez da konponbidea.",english:"Hatred is not the solution."}},
  {id:"etsipena",basque:"Etsipena",english:"Despair / Hopelessness",cefr:"B2",topic:"emotions",pronunciation:"et-see-PEH-nah",notes:"Despair or hopelessness. Etsi (to give up hope) + -pena. Etsita egon = to be in despair. Etsipen handian dago = he is in great despair. The opposite of esperantza (hope).",example:{basque:"Etsipenak ez du lagundu behar.",english:"Despair should not hinder us."}},
  {id:"jelosia",basque:"Jelosia",english:"Jealousy",cefr:"B2",topic:"emotions",pronunciation:"yeh-loh-SEE-ah",notes:"Jealousy. From Spanish celos via jelosia. Jeloskorra = jealous person. Jeloskor egon = to be jealous. Used in both romantic and competitive contexts.",example:{basque:"Jelosia ez da sentimendu ona.",english:"Jealousy is not a good feeling."}},
  {id:"haserrealdi",basque:"Haserrealdi",english:"Fit of anger / Tantrum",cefr:"B2",topic:"emotions",pronunciation:"hah-ser-reh-AL-dee",notes:"Fit of anger or tantrum. Haserre (anger) + aldi (period/episode). Haserrealdi batean = in a fit of anger. Haserrealdi handia = big tantrum. Used for uncontrolled emotional outbursts.",example:{basque:"Haserrealdi batean esan zuen hori.",english:"He said that in a fit of anger."}},
  {id:"melankoliia",basque:"Melankolia",english:"Melancholy",cefr:"B2",topic:"emotions",pronunciation:"meh-lan-koh-LEE-ah",notes:"Melancholy. From Greek via Spanish. Melankoliko = melancholic. A reflective sadness distinct from active grief. The Basque landscape and its mists inspire a particular kind of melancholy in literature.",example:{basque:"Melankolia sentitzen dut neguan.",english:"I feel melancholy in winter."}},
  {id:"garaia",basque:"Garaia",english:"Era / Age / Period",cefr:"B2",topic:"time",pronunciation:"gah-RAI-ah",notes:"Era, age or period. Garai (time/era) + -a. Industrializazio garaia = industrialization era. Garai batean = in a certain era. The Basque Country's industrial transformation from rural to urban in the 19th-20th century was a defining era.",example:{basque:"Garai hartan Bilbo hiri industrial handia zen.",english:"In that era Bilbao was a great industrial city."}},
  {id:"mendea",basque:"Mendea",english:"Century",cefr:"B2",topic:"time",pronunciation:"men-DEH-ah",notes:"Century. Mende = century (root). Hogeita batgarren mendea = the 21st century. Ehun urte. Mendearen hasieran = at the start of the century. The 20th century was defining for Basque political identity.",example:{basque:"Hogeita batgarren mendean bizi gara.",english:"We live in the 21st century."}},
  {id:"hamarkada",basque:"Hamarkada",english:"Decade",cefr:"B2",topic:"time",pronunciation:"hah-mar-KAH-dah",notes:"Decade. Hamar (ten) + -kada. Azken hamarkadan = in the last decade. Hamarkada batean = in a decade. Used in journalism, history and social analysis. Key for discussing Basque political and social evolution.",example:{basque:"Azken hamarkadan asko aldatu da gizartea.",english:"Society has changed a lot in the last decade."}},
  {id:"ordutegia",basque:"Ordutegia",english:"Timetable / Schedule",cefr:"B2",topic:"time",pronunciation:"or-doo-TEH-ghee-ah",notes:"Timetable or schedule. Ordu (hour) + -tegia. Ordutegi estua = tight schedule. Ordutegi malgu = flexible schedule. Garraio publikoaren ordutegia = public transport timetable. Essential for professional contexts.",example:{basque:"Ordutegia aldatu behar dugu bilera egiteko.",english:"We need to change the schedule to have the meeting."}},
  {id:"muga_epea",basque:"Muga-epea",english:"Deadline",cefr:"B2",topic:"time",pronunciation:"MOO-gah EH-peh-ah",notes:"Deadline. Muga (limit/border) + epea (period). Muga-epera iritsi = to reach the deadline. Muga-epea gainditu = to miss the deadline. Essential in professional and academic contexts.",example:{basque:"Muga-epea bihar da eta ez nago prest.",english:"The deadline is tomorrow and I am not ready."}},
  {id:"kronologia",basque:"Kronologia",english:"Chronology",cefr:"B2",topic:"time",pronunciation:"kroh-noh-loh-GHEE-ah",notes:"Chronology. International term. Kronologikoki = chronologically. Gertaeren kronologia = chronology of events. Used in historical, scientific and journalistic contexts.",example:{basque:"Gertaeren kronologia ezagutzea garrantzitsua da.",english:"It is important to know the chronology of events."}},
  {id:"iraganeko_geroa",basque:"Iraganeko geroa",english:"Historical future / What was to come",cefr:"B2",topic:"time",pronunciation:"ee-rah-GAH-neh-koh GEH-roh-ah",notes:"The future as seen from the past - what was to come. Iragana (past) + geroa (future). A philosophical time concept used in literature and historical analysis. Rare but useful for advanced discourse.",example:{basque:"Iraganeko geroa ezin zuten aurreikusi.",english:"They could not foresee what was to come."}},
  {id:"diaspora",basque:"Diaspora",english:"Diaspora",cefr:"B2",topic:"travel",pronunciation:"dee-AS-poh-rah",notes:"Diaspora. International term. The Basque diaspora is one of the most cohesive in the world - significant communities exist in Argentina, USA (Idaho, Nevada), Uruguay, Mexico and Australia. Euskal diaspora = Basque diaspora.",example:{basque:"Euskal diaspora mundu osoan sakabanatuta dago.",english:"The Basque diaspora is scattered all over the world."}},
  {id:"mugitzea",basque:"Mugitzea",english:"To move / Migration",cefr:"B2",topic:"travel",pronunciation:"moo-GHEE-tseh-ah",notes:"To move or migration. Mugitu (to move) + -tzea (verbal noun). Mugitzeko askatasuna = freedom of movement. Biztanleriaren mugitzea = population movement. Key in discussions of mobility and migration.",example:{basque:"Mugitzeko askatasuna eskubide bat da.",english:"Freedom of movement is a right."}},
  {id:"erbesteratua",basque:"Erbesteratua",english:"Exile / Exiled person",cefr:"B2",topic:"travel",pronunciation:"er-bes-teh-RAH-too-ah",notes:"Exile or exiled person. Erbestea = exile. Erbesteratu = to go into exile. During the Franco dictatorship many Basques were erbesteratua in France, Mexico and elsewhere. A historically charged word.",example:{basque:"Frankismo garaian euskaldun asko erbesteratu ziren.",english:"During the Franco era many Basques went into exile."}},
  {id:"mugarik_gabe",basque:"Mugarik gabe",english:"Without borders / Borderless",cefr:"B2",topic:"travel",pronunciation:"moo-GAH-reek GAH-beh",notes:"Without borders or borderless. Muga (border) + -rik gabe (without). Mugarik gabeko mundua = a borderless world. Schengen area made the French-Spanish Basque border invisible. Politically significant phrase.",example:{basque:"Mugarik gabeko Europa batean bizi gara.",english:"We live in a borderless Europe."}},
  {id:"aberriratze",basque:"Aberriratze",english:"Repatriation / Return to homeland",cefr:"B2",topic:"travel",pronunciation:"ah-ber-ree-RAH-tseh",notes:"Repatriation or return to the homeland. Aberri (homeland) + -ratze (return). Aberriratzeko gogoa = desire to return to the homeland. Important for the Basque diaspora. Aberri Eguna celebrates the homeland.",example:{basque:"Aberriratze programak laguntzen die emigranteei.",english:"Repatriation programs help emigrants."}},
  {id:"bide_luzea",basque:"Bide luzea",english:"Long road / Long journey",cefr:"B2",topic:"travel",pronunciation:"BEE-deh LOO-zeh-ah",notes:"Long road or long journey. Bide (road/path) + luzea (long). Both literal and metaphorical. Bide luzea dago oraindik = there is still a long road ahead. Used in discussions of political, social and personal journeys.",example:{basque:"Bide luzea dago helmugaraino.",english:"There is a long road to the destination."}},
  {id:"bidezidor",basque:"Bidezidorra",english:"Path / Trail / Shortcut",cefr:"B2",topic:"travel",pronunciation:"bee-deh-SEE-dor-rah",notes:"Path, trail or shortcut. Bide (road) + zidor (narrow path). The Basque mountains are crossed by ancient bidezidorrak used by shepherds and pilgrims. The Camino de Santiago passes through the Basque Country.",example:{basque:"Bidezidor zahar bat hartu genuen mendira igotzeko.",english:"We took an old path to climb the mountain."}},
  {id:"nerbio_sistema",basque:"Nerbio sistema",english:"Nervous system",cefr:"B2",topic:"body",pronunciation:"ner-BEE-oh sees-TEH-mah",notes:"Nervous system. Nerbio (nerve) + sistema. Nerbio sistema zentrala = central nervous system. Nerbio sistema periferikoa = peripheral nervous system. Essential medical vocabulary.",example:{basque:"Nerbio sistemak gorputzaren mugimenduak kontrolatzen ditu.",english:"The nervous system controls the body's movements."}},
  {id:"minbizia",basque:"Minbizia",english:"Cancer",cefr:"B2",topic:"body",pronunciation:"min-BEE-tsee-ah",notes:"Cancer. Min (pain) + bizia (life). Minbizi mota asko daude = there are many types of cancer. Minbiziaren aurkako borroka = the fight against cancer. A sadly common and important medical term.",example:{basque:"Minbiziaren aurkako ikerketa garrantzitsua da.",english:"Research against cancer is important."}},
  {id:"diabetesa",basque:"Diabetesa",english:"Diabetes",cefr:"B2",topic:"body",pronunciation:"dee-ah-beh-TEH-sah",notes:"Diabetes. International term. Diabetesa daukagu = we have diabetes. Diabetesa kontrolatu = to control diabetes. Type 1 and Type 2. Common chronic condition requiring vocabulary for medical contexts.",example:{basque:"Diabetesa daukanak elikadura kontrolatu behar du.",english:"Someone who has diabetes must control their diet."}},
  {id:"erietxea",basque:"Erietxea",english:"Clinic / Medical center",cefr:"B2",topic:"body",pronunciation:"eh-ree-ET-cheh-ah",notes:"Clinic or medical center. Eri (sick person) + etxea (house). Literally sick-house. More specific than ospitalea - a smaller medical facility. Osakidetza (Basque health service) runs many erietxeak.",example:{basque:"Erietxean hitzordua hartu dut.",english:"I have made an appointment at the clinic."}},
  {id:"etxea_ondarea",basque:"Etxe-ondarea",english:"Family homestead / Ancestral home",cefr:"B2",topic:"family",pronunciation:"ET-cheh on-DAH-reh-ah",notes:"Family homestead or ancestral property. Etxe (house) + ondarea (heritage/legacy). In Basque culture the family home has its own name and is passed down through generations. Surnames like Etxeberria, Etxebarria come from homestead names.",example:{basque:"Gure etxeak mendeetan iraun du.",english:"Our family homestead has lasted for centuries."}},
  {id:"belaunaldia",basque:"Belaunaldia",english:"Generation",cefr:"B2",topic:"family",pronunciation:"beh-low-NAL-dee-ah",notes:"Generation. Belaun (knee/generation) + -aldia. Belaunaldi berriak = new generations. Belaunaldiz belaunaldi = from generation to generation. The transmission of Basque language across belaunaldiak is a central cultural concern.",example:{basque:"Belaunaldiz belaunaldi transmititu da euskara.",english:"Basque has been transmitted from generation to generation."}},
  {id:"ahaidetasuna",basque:"Ahaidetasuna",english:"Kinship / Family relationship",cefr:"B2",topic:"family",pronunciation:"ah-hai-deh-tah-SOO-nah",notes:"Kinship or family relationship. Ahaide (relative/kin) + -tasuna. Ahaide hurbilak = close relatives. Ahaidetasun loturak = kinship ties. In traditional Basque society ahaidetasuna extended to the whole community.",example:{basque:"Ahaidetasun lotura estua daukagu familia guztiarekin.",english:"We have close kinship ties with the whole family."}},
  {id:"heredentzia",basque:"Heredentzia",english:"Inheritance",cefr:"B2",topic:"family",pronunciation:"heh-reh-DEN-tsee-ah",notes:"Inheritance. From Spanish herencia. Heredentzia jaso = to receive an inheritance. Testamentua = will/testament. In traditional Basque law the baserri was passed down to one heir to keep the farmstead intact.",example:{basque:"Heredentzia jaso zuen aitaren etxetik.",english:"He received an inheritance from his father's house."}},
  {id:"more_iluna",basque:"More iluna",english:"Dark purple / Violet",cefr:"B1",topic:"colors",pronunciation:"moh-REH ee-LOO-nah",notes:"Dark purple or violet. More (purple) + iluna (dark). The color of Gernika's jacaranda trees in spring. Morea is already A1 - this teaches color modification with iluna/argia.",example:{basque:"More iluneko arropa darama.",english:"She wears dark purple clothing."}},
  {id:"hori_argia",basque:"Hori argia",english:"Light yellow / Pale yellow",cefr:"B1",topic:"colors",pronunciation:"HOR-ee AR-ghee-ah",notes:"Light yellow or pale yellow. Hori (yellow) + argia (light/bright). Learning color modification - adding argia (light) or iluna (dark) to any basic color creates new shades. A pattern worth learning once.",example:{basque:"Hori argia gustuko dut eguzki koloreagatik.",english:"I like light yellow because of the sun color."}},
  {id:"berde_iluna",basque:"Berde iluna",english:"Dark green / Forest green",cefr:"B1",topic:"colors",pronunciation:"BER-deh ee-LOO-nah",notes:"Dark green or forest green. Berde (green) + iluna (dark). The color of the Basque forests (basoak) and the ikurriña. Berde ilun kolorea = dark green color. Pinua berde iluna da = the pine is dark green.",example:{basque:"Basoa berde iluna da udazken hasieran.",english:"The forest is dark green at the start of autumn."}},
  {id:"zilarra_kolorea",basque:"Zilar kolorea",english:"Silver color",cefr:"B1",topic:"colors",pronunciation:"SEE-lar koh-LOH-reh-ah",notes:"Silver color. Zilar (silver) + kolorea. Zilarrezko = made of silver. The color of the Bay of Biscay in winter and of traditional Basque silverware. Zilar kolorekoa = silver colored.",example:{basque:"Itsasoa zilar kolorekoa da gauean.",english:"The sea is silver colored at night."}},
  {id:"neurria",basque:"Neurria",english:"Measure / Measurement",cefr:"B1",topic:"numbers",pronunciation:"neu-REE-ah",notes:"Measure or measurement. Neurtu = to measure. Neurria hartu = to take a measure. Neurri batean = to some extent. Also used figuratively: neurria gainditu = to exceed the limit/measure.",example:{basque:"Neurri zehatzak hartu behar ditugu.",english:"We need to take precise measurements."}},
  {id:"kopurua",basque:"Kopurua",english:"Amount / Quantity",cefr:"B1",topic:"numbers",pronunciation:"koh-POO-roo-ah",notes:"Amount or quantity. Kopuru handian = in large quantities. Kopurua handitu = to increase the amount. Zenbat kopuru? = What amount? Very useful in commercial and everyday contexts.",example:{basque:"Kopuru nahikoa badaukagu.",english:"We have enough quantity."}},
  {id:"maite_izatea",basque:"Maite izatea",english:"Being loved / Love (feeling)",cefr:"A1",topic:"emotions",pronunciation:"MAI-teh ee-ZAH-teh-ah",notes:"The feeling of being loved or loving someone. Maite = dear/beloved. Maite zaitut = I love you. One of the most important emotional expressions in any language.",example:{basque:"Maite izatea zoragarria da.",english:"Being loved is wonderful."}},
  {id:"alaitasun",basque:"Atsegin",english:"Pleasure / Liking",cefr:"A1",topic:"emotions",pronunciation:"at-SEH-gheen",notes:"Pleasure or liking. Atsegin dut = I like it. Atsegin handiz = with great pleasure. More formal than gustatu. Atsegingarria = pleasant. Essential A1 emotion vocabulary.",example:{basque:"Atsegin dut euskara ikastea.",english:"I like learning Basque."}},
  {id:"arkitektoa",basque:"Arkitektoa",english:"Architect",cefr:"A1",topic:"work",pronunciation:"ar-kee-TEK-toh-ah",notes:"Architect. From Greek via Spanish arquitecto. The Basque Country has world-famous architects - Frank Gehry designed the Guggenheim Bilbao. Arkitektura = architecture.",example:{basque:"Arkitektoa etxeak diseinatzen ditu.",english:"The architect designs houses."}},
  {id:"gizadia",basque:"Gizadia",english:"Humanity / Mankind",cefr:"A1",topic:"society",pronunciation:"ghee-ZAH-dee-ah",notes:"Humanity or mankind. Giza (human) + -dia. Gizadiaren historia = the history of humanity. Gizadiari lagundu = to help humanity. A fundamental concept in society.",example:{basque:"Gizadia planeta honetan bizi da.",english:"Humanity lives on this planet."}},
  {id:"biztanle",basque:"Komunitatea",english:"Community",cefr:"A1",topic:"society",pronunciation:"koh-moo-nee-TAH-teh-ah",notes:"Community. From Spanish comunidad. Komunitate txikia = small community. Euskal komunitatea = the Basque community. Very relevant for discussing Basque society and diaspora.",example:{basque:"Gure komunitatea indartsua da.",english:"Our community is strong."}},
  {id:"elkarbizitza",basque:"Elkarbizitza",english:"Coexistence",cefr:"A1",topic:"society",pronunciation:"el-kar-bee-TSETS-ah",notes:"Coexistence. Elkar (each other) + bizitza (life). Elkarbizitza baketsua = peaceful coexistence. A key concept in Basque society given its complex political history and diverse communities.",example:{basque:"Elkarbizitza baketsua nahi dugu.",english:"We want peaceful coexistence."}},
  {id:"ezkontidea",basque:"Ezkontidea",english:"Spouse",cefr:"A2",topic:"family",pronunciation:"ez-kon-TEE-deh-ah",notes:"Spouse. Ezkon (married) + kidea (companion). Gender-neutral term for husband or wife. More formal than senarra/emaztea. Ezkontide onena = best spouse. Used in official and legal contexts.",example:{basque:"Nire ezkontidea medikua da.",english:"My spouse is a doctor."}},
  {id:"kolore_argia",basque:"Kolore argia",english:"Light color / Pale color",cefr:"A2",topic:"colors",pronunciation:"koh-LOH-reh AR-ghee-ah",notes:"Light color or pale color. Kolore (color) + argia (light). Kolore argiak = light colors. Teaching the argia/iluna (light/dark) modifier system which applies to all colors. Very useful for describing things.",example:{basque:"Kolore argiak gustuko ditut udaran.",english:"I like light colors in summer."}},
  {id:"kolore_iluna",basque:"Kolore iluna",english:"Dark color",cefr:"A2",topic:"colors",pronunciation:"koh-LOH-reh ee-LOO-nah",notes:"Dark color. Kolore (color) + iluna (dark). Kolore ilunak = dark colors. The paired concept with kolore argia. Knowing argia and iluna lets you describe any color's shade.",example:{basque:"Neguan kolore ilunak erabiltzen ditut.",english:"In winter I use dark colors."}},
  {id:"enplegua",basque:"Enplegua",english:"Employment / Job",cefr:"A2",topic:"work",pronunciation:"en-PLEH-goo-ah",notes:"Employment or job. From Spanish empleo. Enplegu bila = job hunting. Langabezia = unemployment. Enplegu aukera = job opportunity. Key vocabulary for discussing work situations.",example:{basque:"Enplegu bila ari naiz.",english:"I am looking for employment."}},
  {id:"baja",basque:"Baja",english:"Sick leave",cefr:"A2",topic:"work",pronunciation:"BAH-hah",notes:"Sick leave. From Spanish baja (medical leave). Bajatan egon = to be on sick leave. Bajara joan = to go on sick leave. Very common in Basque workplace vocabulary, used daily.",example:{basque:"Bajatan nago astebetez.",english:"I am on sick leave for a week."}},
  {id:"labean_egina",basque:"Labean egina",english:"Baked / Oven-cooked",cefr:"B1",topic:"food",pronunciation:"LAH-beh-an EH-ghee-nah",notes:"Baked or oven-cooked. Labe (oven) + -an egina (made in). Labean egindako ogia = oven-baked bread. Essential cooking vocabulary. Labea = oven. The wood-fired oven is traditional in Basque cooking.",example:{basque:"Labean egindako arraina oso goxoa da.",english:"Oven-baked fish is very delicious."}},
  {id:"gatz_gutxiko",basque:"Gatz gutxiko",english:"Low-salt / Low-sodium",cefr:"B1",topic:"food",pronunciation:"GATS GOO-chee-koh",notes:"Low-salt or low-sodium. Gatz (salt) + gutxi (little) + -ko. Health-conscious food vocabulary. Gatz gutxiko dieta = low-salt diet. Increasingly relevant given Basque cuisine's richness.",example:{basque:"Gatz gutxiko elikadura gomendatzen dut.",english:"I recommend a low-salt diet."}},
  {id:"zenbakiketa",basque:"Zenbakiketa",english:"Counting / Arithmetic",cefr:"B1",topic:"numbers",pronunciation:"zen-bah-kee-KEH-tah",notes:"Counting or arithmetic. Zenbaki (number) + -keta. Zenbakiketa sinplea = simple arithmetic. Used in education and mathematics. Oinarrizko zenbakiketa = basic arithmetic.",example:{basque:"Zenbakiketa ikasi behar dute haurrek.",english:"Children need to learn arithmetic."}},
  {id:"batuketak",basque:"Batuketak",english:"Addition (maths)",cefr:"B1",topic:"numbers",pronunciation:"bah-too-KEH-tak",notes:"Addition in mathematics. Batu (to add/join) + -keta. Batuketa egin = to do addition. Ken = subtraction. Biderketa = multiplication. Zatiketa = division. Key mathematical operations vocabulary.",example:{basque:"Batuketa sinplea da matematikan.",english:"Addition is simple in mathematics."}},
  {id:"guraso_bakarra",basque:"Guraso bakarra",english:"Single parent",cefr:"B1",topic:"family",pronunciation:"goo-RAH-soh bah-KAR-rah",notes:"Single parent. Guraso (parent) + bakarra (alone/single). Guraso bakarreko familia = single-parent family. Increasingly common family structure discussed in modern Basque society.",example:{basque:"Guraso bakarreko familiak asko daude.",english:"There are many single-parent families."}},
  {id:"seme_alaba_adoptatu",basque:"Seme-alaba adoptatu",english:"Adopted child",cefr:"B1",topic:"family",pronunciation:"SEH-meh ah-LAH-bah ah-dop-TAH-too",notes:"Adopted child. Seme-alaba (son/daughter) + adoptatu (adopted). Adopzioa = adoption. Seme-alaba adoptatu bat daukagu = we have an adopted child. Important vocabulary for modern family discussions.",example:{basque:"Seme-alaba adoptatu bat daukate.",english:"They have an adopted child."}},
  {id:"krema_kolorea",basque:"Krema kolorea",english:"Cream color",cefr:"B1",topic:"colors",pronunciation:"KREH-mah koh-LOH-reh-ah",notes:"Cream color. Krema (cream) + kolorea (color). The color of Basque farmhouse walls and fresh sheep's cheese. Krema kolorekoa = cream colored. Used in interior design and fashion.",example:{basque:"Hormak krema kolorekoak dira.",english:"The walls are cream colored."}},
  {id:"muskulu",basque:"Muskulua",english:"Muscle",cefr:"B1",topic:"body",pronunciation:"moos-KOO-loo-ah",notes:"Muscle. From Spanish músculo. Muskulu-mina = muscle pain. Muskuluak landu = to work the muscles. Muskulu-lesio = muscle injury. Essential for sports, health and fitness vocabulary.",example:{basque:"Muskuluak entrenatu behar ditut.",english:"I need to train my muscles."}},
  {id:"tendoia",basque:"Tendoia",english:"Tendon",cefr:"B1",topic:"body",pronunciation:"ten-DOH-ee-ah",notes:"Tendon. From Spanish tendón. Tendoi-lesio = tendon injury. Akilesen tendoia = Achilles tendon. Common sports injury vocabulary. Basque mountain sports make tendon injuries frequent.",example:{basque:"Tendoi-lesio bat daukat belaunean.",english:"I have a tendon injury in my knee."}},
  {id:"ordu_erdia",basque:"Ordu erdia",english:"Half an hour",cefr:"B1",topic:"time",pronunciation:"OR-doo ER-dee-ah",notes:"Half an hour. Ordu (hour) + erdia (half). Ordu erdi barru = in half an hour. Ordu erdian = in half an hour. Essential for making appointments and time expressions.",example:{basque:"Ordu erdi barru iritsiko naiz.",english:"I will arrive in half an hour."}},
  {id:"hilabete_bat_barru",basque:"Hilabete bat barru",english:"In one month / Within a month",cefr:"B1",topic:"time",pronunciation:"hee-lah-BEH-teh bat BAR-roo",notes:"In one month or within a month. Hilabete (month) + bat (one) + barru (within/inside). Barru = within/inside. This pattern works with any time: aste bat barru = in a week, urte bat barru = in a year.",example:{basque:"Hilabete bat barru itzuliko naiz.",english:"I will return within a month."}},
  {id:"lan_eskaintza",basque:"Lan eskaintza",english:"Job offer",cefr:"B1",topic:"work",pronunciation:"LAN es-KAIN-tsah",notes:"Job offer. Lan (work) + eskaintza (offer). Lan eskaintza bat jaso = to receive a job offer. Lan eskaintzak bilatu = to look for job offers. Common in professional and career discussions.",example:{basque:"Lan eskaintza on bat jaso dut.",english:"I have received a good job offer."}},
  {id:"curriculum",basque:"Curriculum",english:"CV / Resume",cefr:"B1",topic:"work",pronunciation:"koo-ree-KOO-loom",notes:"CV or resume. International term also written as curriculum vitae. Curriculuma bidali = to send a CV. Curriculuma eguneratu = to update the CV. Essential professional vocabulary.",example:{basque:"Nire curriculuma bidali dut.",english:"I have sent my CV."}},
  {id:"mila_esker_denagatik",basque:"Mila esker denagatik",english:"Thank you for everything",cefr:"B2",topic:"greetings",pronunciation:"MEE-lah ES-ker DEH-nah-gah-teek",notes:"Thank you for everything. Mila esker (a thousand thanks) + denagatik (for everything). A warm closing phrase used at the end of events, emails or when parting from someone after a long time.",example:{basque:"Mila esker denagatik lagun.",english:"Thank you for everything friend."}},
  {id:"datuak",basque:"Datuak",english:"Data / Statistics",cefr:"B2",topic:"numbers",pronunciation:"DAH-too-ak",notes:"Data or statistics (plural). Datu = datum/data point (singular). Datuen arabera = according to the data. Datuak bildu = to collect data. Essential for academic, journalistic and scientific discourse.",example:{basque:"Datuek erakusten dute euskaldunak gehiagotzen ari direla.",english:"The data show that Basque speakers are increasing."}},
  {id:"indizea",basque:"Indizea",english:"Index / Rate",cefr:"B2",topic:"numbers",pronunciation:"in-DEE-zeh-ah",notes:"Index or rate. From Spanish índice. Langabezia indizea = unemployment rate. Prezio indizea = price index. Jaiotza tasa = birth rate. Used in economic and social statistics.",example:{basque:"Langabezia indizea jaitsi da.",english:"The unemployment rate has fallen."}},
  {id:"arbasoak",basque:"Arbasoak",english:"Ancestors",cefr:"B2",topic:"family",pronunciation:"ar-BAH-soh-ak",notes:"Ancestors. Arbaso = ancestor (singular). Arbasoak = ancestors (plural). The Basque tradition of honoring ancestors is strong - the etxea (family home) connects the living to their arbasoak across generations. Arbasoen lurra = the land of our ancestors.",example:{basque:"Gure arbasoek euskara hitz egiten zuten.",english:"Our ancestors spoke Basque."}},
  {id:"jarduera_fisikoa",basque:"Jarduera fisikoa",english:"Physical activity",cefr:"B2",topic:"body",pronunciation:"yar-doo-EH-rah fee-SEE-koh-ah",notes:"Physical activity. Jarduera (activity) + fisikoa (physical). Jarduera fisiko nahikoa ez egitea = not doing enough physical activity. The Basque Country has a strong outdoor sports culture.",example:{basque:"Jarduera fisikoa egitea garrantzitsua da osasunerako.",english:"Doing physical activity is important for health."}},
  {id:"euskal_literatura",basque:"Euskal literatura",english:"Basque literature",cefr:"B2",topic:"culture",pronunciation:"EUS-kal lee-teh-rah-TOO-rah",notes:"Basque literature. Bernat Etxepare wrote the first book ever printed in Basque in 1545. Modern authors include Bernardo Atxaga (Obabakoak) and Kirmen Uribe. Euskal literatura has a rich oral tradition via bertsolaritza.",example:{basque:"Euskal literatura aberatsa da.",english:"Basque literature is rich."}},
  {id:"euskal_zinema",basque:"Euskal zinema",english:"Basque cinema",cefr:"B2",topic:"culture",pronunciation:"EUS-kal see-NEH-mah",notes:"Basque cinema. Directors like Julio Medem and Alex de la Iglesia have Basque roots. The San Sebastián International Film Festival (Donostiako Nazioarteko Zinema Jaialdia) is one of Europe's most prestigious.",example:{basque:"Euskal zinemak nazioarteko saria irabazi du.",english:"Basque cinema has won an international award."}},
  {id:"ordu_bat",basque:"Ordu bat da",english:"It is one o'clock",cefr:"A1",topic:"numbers",pronunciation:"OR-doo BAT dah",notes:"It is one o'clock. Ordu = hour/clock. Ordu bat = one hour/one o'clock. Da = it is. Ordu biak = two o'clock. Ordu hirua = three o'clock. Telling time is essential for beginners.",example:{basque:"Ordu bat da orain.",english:"It is one o'clock now."}},
  {id:"ordu_biak",basque:"Ordu biak",english:"Two o'clock",cefr:"A1",topic:"numbers",pronunciation:"OR-doo BEE-ak",notes:"Two o'clock. Ordu (hour) + biak (the twos). Basque uses the definite plural for telling time: biak = the twos = two o'clock. Ordu biak dira = it is two o'clock.",example:{basque:"Ordu biak dira.",english:"It is two o'clock."}},
  {id:"laurden_gutxi",basque:"Laurden gutxi",english:"Quarter to (the hour)",cefr:"A1",topic:"numbers",pronunciation:"LOW-den GOO-chee",notes:"Quarter to the hour. Laurdena (quarter) + gutxi (less/to). Laurden gutxi hirua = quarter to three. The system: eta laurdena = quarter past, eta erdia = half past, laurden gutxi = quarter to.",example:{basque:"Hiruen laurden gutxi da.",english:"It is quarter to three."}},
  {id:"eta_laurdena",basque:"Eta laurdena",english:"Quarter past (the hour)",cefr:"A1",topic:"numbers",pronunciation:"EH-tah LOW-der-nah",notes:"Quarter past the hour. Eta (and/plus) + laurdena (the quarter). Baten eta laurdena = quarter past one. Part of the essential Basque time-telling system.",example:{basque:"Baten eta laurdena da.",english:"It is quarter past one."}},
  {id:"seigarrena",basque:"Seigarrena",english:"Sixth",cefr:"A2",topic:"numbers",pronunciation:"say-GAR-reh-nah",notes:"Sixth. Sei (six) + -garrena (ordinal suffix). The ordinal suffix -garren/-garrena applies to all numbers. Learning the pattern: lehena=1st, bigarrena=2nd, hirugarrena=3rd, laugarrena=4th, bosgarrena=5th, seigarrena=6th.",example:{basque:"Seigarrena iritsi zen lasterketan.",english:"He arrived sixth in the race."}},
  {id:"zazpigarrena",basque:"Zazpigarrena",english:"Seventh",cefr:"A2",topic:"numbers",pronunciation:"zaz-pee-GAR-reh-nah",notes:"Seventh. Zazpi (seven) + -garrena. Zazpigarren zeruan = in seventh heaven. The ordinal suffix pattern is consistent and learnable once understood.",example:{basque:"Zazpigarren solairuan bizi naiz.",english:"I live on the seventh floor."}},
  {id:"zortzigarrena",basque:"Zortzigarrena",english:"Eighth",cefr:"A2",topic:"numbers",pronunciation:"zor-tsee-GAR-reh-nah",notes:"Eighth. Zortzi (eight) + -garrena. Zortzigarren postua = eighth place. Used for floors, positions, dates and rankings.",example:{basque:"Abuztuaren zortzigarrena da.",english:"It is the eighth of August."}},
  {id:"bederatzigarrena",basque:"Bederatzigarrena",english:"Ninth",cefr:"A2",topic:"numbers",pronunciation:"beh-deh-rat-see-GAR-reh-nah",notes:"Ninth. Bederatzi (nine) + -garrena. Bederatzigarren postuan = in ninth place. The longest ordinal for single digits - learning it completes the set.",example:{basque:"Bederatzigarrena naiz zerrendan.",english:"I am ninth on the list."}},
  {id:"hamargarrena",basque:"Hamargarrena",english:"Tenth",cefr:"A2",topic:"numbers",pronunciation:"hah-mar-GAR-reh-nah",notes:"Tenth. Hamar (ten) + -garrena. Hamargarren postuan = in tenth place. Hamargarrena = the tenth. Completes the basic ordinal number set.",example:{basque:"Hamargarren solairuan lan egiten dut.",english:"I work on the tenth floor."}},
  {id:"ken",basque:"Kenketa",english:"Subtraction",cefr:"A2",topic:"numbers",pronunciation:"ken-KEH-tah",notes:"Subtraction. Ken = subtract/minus. Kenketa egin = to do subtraction. Five minus three: bost ken hiru = bi. The four operations: batuketa (addition), kenketa (subtraction), biderketa (multiplication), zatiketa (division).",example:{basque:"Bost ken hiru bi da.",english:"Five minus three is two."}},
  {id:"biderketa",basque:"Biderketa",english:"Multiplication",cefr:"A2",topic:"numbers",pronunciation:"bee-der-KEH-tah",notes:"Multiplication. Bider = times/multiplied by. Biderketa taula = multiplication table. Bi bider hiru sei da = two times three is six. Essential school mathematics vocabulary.",example:{basque:"Biderketa taula ikasi behar duzu.",english:"You need to learn the multiplication table."}},
  {id:"zatiketa",basque:"Zatiketa",english:"Division",cefr:"A2",topic:"numbers",pronunciation:"zah-tee-KEH-tah",notes:"Division. Zati = part/divided by. Zatiketa egin = to do division. Hamar zati bi bost da = ten divided by two is five. Zati = fraction as well as division.",example:{basque:"Zatiketa matematikako oinarria da.",english:"Division is a foundation of mathematics."}},
  {id:"herena",basque:"Herena",english:"One third",cefr:"B1",topic:"numbers",pronunciation:"HEH-reh-nah",notes:"One third. Heren = third (as a fraction). Bi heren = two thirds. Hiruren heren = three thirds = a whole. Paired with erdia (half) and laurdena (quarter) to complete basic fractions.",example:{basque:"Lurren herena oihanez estalia dago.",english:"A third of the land is covered by forest."}},
  {id:"ehuneko_berrogeita_hamar",basque:"Ehuneko berrogeita hamar",english:"Fifty percent",cefr:"B1",topic:"numbers",pronunciation:"eh-HOO-neh-koh ber-ROH-gay-tah AH-mar",notes:"Fifty percent. Ehuneko (percentage) + berrogeita hamar (fifty). Learning to combine ehuneko with numbers gives you all percentages. Ehuneko hogei = 20%. Ehuneko ehun = 100%.",example:{basque:"Ehuneko berrogeita hamarrek euskara dakite.",english:"Fifty percent know Basque."}},
  {id:"azken_urtean",basque:"Azken urtean",english:"In the last year / Year-on-year",cefr:"B1",topic:"numbers",pronunciation:"AZ-ken OOR-teh-an",notes:"In the last year or year-on-year. Azken (last/final) + urtean (in the year). Azken urtean igoera = increase in the last year. Used constantly in statistics, news and reports.",example:{basque:"Azken urtean prezioek gora egin dute.",english:"Prices have risen in the last year."}},
  {id:"aldaketa_ehunekoa",basque:"Aldaketa ehunekoa",english:"Percentage change",cefr:"B1",topic:"numbers",pronunciation:"al-dah-KEH-tah eh-HOO-neh-koh-ah",notes:"Percentage change. Aldaketa (change) + ehunekoa (percentage). Aldaketa ehuneko positiboa = positive percentage change. Essential for understanding economic and statistical reporting.",example:{basque:"Aldaketa ehunekoa positiboa da aurten.",english:"The percentage change is positive this year."}},
  {id:"aldagai",basque:"Aldagaia",english:"Variable",cefr:"B2",topic:"numbers",pronunciation:"al-dah-GAI-ah",notes:"Variable (in mathematics or statistics). Aldagai askea = independent variable. Aldagai mendekoa = dependent variable. Aldagaiak = variables. Essential in science, statistics and programming.",example:{basque:"Aldagai bat baino gehiago dago formulan.",english:"There is more than one variable in the formula."}},
  {id:"batez_bestekoa",basque:"Batez bestekoa",english:"Average / Mean",cefr:"B2",topic:"numbers",pronunciation:"bah-tez bes-TEH-koh-ah",notes:"Average or mean. Batez (on average) + bestekoa (the other/middle). Batez besteko soldata = average salary. Batez bestekotik gora = above average. One of the most used statistical terms.",example:{basque:"Batez besteko tenperatura igoera dago.",english:"There is an average temperature increase."}},
  {id:"desbideratze_estandarra",basque:"Desbideratze estandarra",english:"Standard deviation",cefr:"B2",topic:"numbers",pronunciation:"des-bee-deh-RAT-seh es-tan-DAR-rah",notes:"Standard deviation. Desbideratu (to deviate) + estandarra (standard). Key statistical concept used in research, quality control and data science. Desbideratze txikia = small standard deviation.",example:{basque:"Desbideratze estandarra txikia da lagin honetan.",english:"The standard deviation is small in this sample."}},
  {id:"mina_a2",basque:"Mina",english:"Pain",cefr:"A2",topic:"body",pronunciation:"MEE-nah",notes:"Pain (physical). Min egin = to hurt. Non mina duzu? = Where does it hurt? Buruko mina = headache. Sabeleko mina = stomachache. Hortzetako mina = toothache. The root min appears in many compounds.",example:{basque:"Mina daukat hanketan.",english:"I have pain in my legs."}},
  {id:"gaixotasuna",basque:"Gaixotasuna",english:"Illness / Disease",cefr:"A2",topic:"body",pronunciation:"gai-sho-tah-SOO-nah",notes:"Illness or disease. Gaixo (sick) + -tasuna. Gaixotasun larria = serious illness. Gaixotasun kronikoa = chronic disease. Gaixotzea = to fall ill. Essential health vocabulary.",example:{basque:"Gaixotasun bat daukat eta medikuarengana joan behar dut.",english:"I have an illness and I need to go to the doctor."}},
  {id:"eztula",basque:"Eztula",english:"Cough",cefr:"A2",topic:"body",pronunciation:"ez-TOO-lah",notes:"Cough. Eztul egin = to cough. Eztul lehorra = dry cough. Eztul hezea = wet cough. One of the most common symptoms vocabulary learners need when visiting a doctor or pharmacy.",example:{basque:"Eztul asko egiten dut.",english:"I cough a lot."}},
  {id:"buruko_mina",basque:"Buruko mina",english:"Headache",cefr:"A2",topic:"body",pronunciation:"BOO-roo-koh MEE-nah",notes:"Headache. Buru (head) + -ko (of) + mina (pain). Buruko min handia = bad headache. Migraina = migraine. The most common pain complaint - essential vocabulary for any context.",example:{basque:"Buruko mina daukat eta etzanda egon behar dut.",english:"I have a headache and I need to lie down."}},
  {id:"sumina",basque:"Sumina",english:"Itch / Irritation",cefr:"B1",topic:"body",pronunciation:"soo-MEE-nah",notes:"Itch or irritation. Sumin egin = to itch. Azala sumintsu dago = the skin is irritated. Alergia = allergy. Common medical vocabulary for skin conditions and allergies.",example:{basque:"Azalak sumina egiten dit.",english:"My skin itches."}},
  {id:"hegazkina",basque:"Hegazkina",english:"Aeroplane / Flight",cefr:"A1",topic:"travel",pronunciation:"heh-gaz-KEE-nah",notes:"Aeroplane or flight. Hegaz (flying) + -kina (machine). Hegazkin txartela = plane ticket. Hegazkin konpainia = airline. Bilbao Airport (Loiu) and San Sebastián Airport serve the Basque Country.",example:{basque:"Hegazkinez joango naiz Madrilera.",english:"I will go to Madrid by plane."}},
  {id:"ostatua_erreserbatu",basque:"Ostatua erreserbatu",english:"To book a hotel",cefr:"A2",topic:"travel",pronunciation:"os-TAH-too-ah er-reh-ser-BAH-too",notes:"To book a hotel. Ostatua (hotel) + erreserbatu (to reserve). Gela bat erreserbatu = to book a room. Online erreserbaketa = online booking. Essential practical travel vocabulary.",example:{basque:"Bi gauetarako ostatua erreserbatu dut.",english:"I have booked a hotel for two nights."}},
  {id:"gela",basque:"Gela",english:"Room",cefr:"A1",topic:"travel",pronunciation:"GEH-lah",notes:"Room. Logela = bedroom (lo=sleep + gela). Sukaldea = kitchen. Egongela = living room. Komunak = bathroom. Gela bikoitza = double room. Gela bakarreko = single room. Essential hotel vocabulary.",example:{basque:"Gela bat nahi dut bi gauetarako.",english:"I want a room for two nights."}},
  {id:"hegazkin_txartela",basque:"Hegazkin txartela",english:"Plane ticket",cefr:"A2",topic:"travel",pronunciation:"heh-gaz-KEEN CHAR-teh-lah",notes:"Plane ticket. Hegazkin (plane) + txartela (ticket/card). Joateko txartela = one-way ticket. Joan-etorriko txartela = return ticket. Txartela erosi = to buy a ticket.",example:{basque:"Hegazkin txartela erosi behar dut.",english:"I need to buy a plane ticket."}},
  {id:"langabezia",basque:"Langabezia",english:"Unemployment",cefr:"A2",topic:"work",pronunciation:"lan-gah-BEH-tsee-ah",notes:"Unemployment. Lan (work) + gabezia (lack of). Langabezian egon = to be unemployed. Langabezia tasa = unemployment rate. Langabeziagatiko laguntza = unemployment benefit.",example:{basque:"Langabezian nago hilabete bat baino gehiago.",english:"I have been unemployed for more than a month."}},
  {id:"erretiroa",basque:"Erretiroa",english:"Retirement",cefr:"B1",topic:"work",pronunciation:"er-reh-TEE-roh-ah",notes:"Retirement. From Spanish retiro. Erretirora joan = to retire. Erretiro adina = retirement age. Erretiro pentsioa = retirement pension. The Basque Social Security system is managed separately from Spain.",example:{basque:"Erretirora joango naiz hurrengo urtean.",english:"I will retire next year."}},
  {id:"sindikatu",basque:"Sindikatua",english:"Trade union",cefr:"B1",topic:"work",pronunciation:"seen-dee-KAH-too-ah",notes:"Trade union. ELA and LAB are the main Basque trade unions. Sindikatuan sartu = to join a union. Sindikatu kidea = union member. Strong tradition of trade unionism in the Basque industrial sector.",example:{basque:"Sindikatuan nago nire eskubideak babesteko.",english:"I am in the trade union to protect my rights."}},
  {id:"harridura",basque:"Harridura",english:"Surprise / Astonishment",cefr:"A2",topic:"emotions",pronunciation:"har-ree-DOO-rah",notes:"Surprise or astonishment (noun). Harritu = to surprise (verb). Harridura handiz = with great surprise. Harrigarria = surprising. Zer harridura! = What a surprise! The noun form for harritu.",example:{basque:"Harridura handiz jaso zuen albistea.",english:"He received the news with great surprise."}},
  {id:"pena",basque:"Pena",english:"Pity / Shame / Sorrow",cefr:"A2",topic:"emotions",pronunciation:"PEH-nah",notes:"Pity, shame or sorrow. Ze pena! = What a shame! Pena handia = great sorrow. From Spanish pena. Penazko = pitiful/sad. Very commonly used in everyday conversation.",example:{basque:"Ze pena etorri ez izana.",english:"What a shame you didn't come."}},
  {id:"atsekabea",basque:"Atsekabea",english:"Grief / Sorrow",cefr:"B1",topic:"emotions",pronunciation:"at-seh-KAH-beh-ah",notes:"Grief or deep sorrow. Atsekabe = grief (root). Atsekabetu = to grieve. Atsekabea sentitu = to feel grief. More intense than tristura (sadness). Used for loss and mourning.",example:{basque:"Atsekabe handia sentitzen dut zure galera jakitean.",english:"I feel great grief on hearing of your loss."}},
  {id:"gosaldu",basque:"Gosaldu",english:"To have breakfast",cefr:"A1",topic:"food",pronunciation:"goh-SAL-doo",notes:"To have breakfast. Gosal (morning meal) + -du (verb suffix). Goizean gosaltzen dut = I have breakfast in the morning. Gosaria = breakfast (noun). The three meal verbs: gosaldu, bazkaldu, afaldu.",example:{basque:"Goizean zazpietan gosaltzen dut.",english:"I have breakfast at seven in the morning."}},
  {id:"bazkaldu",basque:"Bazkaldu",english:"To have lunch",cefr:"A1",topic:"food",pronunciation:"baz-KAL-doo",notes:"To have lunch. Bazkal (lunch) + -du. Eguerdian bazkaldu = to have lunch at midday. Bazkaria = lunch (noun). Lunch is the main meal in Basque culture - often a three-course menua.",example:{basque:"Jatetxean bazkaldu dugu.",english:"We had lunch at the restaurant."}},
  {id:"afaldu",basque:"Afaldu",english:"To have dinner",cefr:"A1",topic:"food",pronunciation:"ah-FAL-doo",notes:"To have dinner. Afal (dinner) + -du. Gauean afaldu = to have dinner in the evening. Afaria = dinner (noun). Three essential meal verbs in one: gosaldu, bazkaldu, afaldu. Mirror the nouns gosaria, bazkaria, afaria.",example:{basque:"Gaueko zortziretan afaltzen dugu.",english:"We have dinner at eight in the evening."}},
  {id:"gosea",basque:"Gosea",english:"Hungry",cefr:"A1",topic:"adjectives",pronunciation:"GOH-seh-ah",notes:"Hungry. Gose = hunger (root). Gose naiz = I am hungry. Gose handia daukat = I am very hungry. Gose-egarria = hunger and thirst. One of the most basic body state adjectives.",example:{basque:"Gose naiz, zer jan dezakegu?",english:"I am hungry, what can we eat?"}},
  {id:"egarria",basque:"Egarria",english:"Thirsty",cefr:"A1",topic:"adjectives",pronunciation:"eh-GAR-ree-ah",notes:"Thirsty. Egarri = thirst (root). Egarri naiz = I am thirsty. Egarri handia daukat = I am very thirsty. Gose-egarria = hunger and thirst (paired expression). Essential basic vocabulary.",example:{basque:"Egarri naiz, ur pixka bat mesedez.",english:"I am thirsty, a little water please."}},
  {id:"nekatuta",basque:"Nekatuta",english:"Tired / Exhausted",cefr:"A1",topic:"adjectives",pronunciation:"neh-kah-TOO-tah",notes:"Tired or exhausted. Neka (tiredness) + -tuta (state suffix). Oso nekatuta nago = I am very tired. Nekatuta egon = to be tired. One of the most used everyday adjectives.",example:{basque:"Oso nekatuta nago gaur.",english:"I am very tired today."}},
  {id:"beterik",basque:"Beterik",english:"Full (after eating)",cefr:"A2",topic:"adjectives",pronunciation:"beh-TEH-reek",notes:"Full after eating. Bete (full) + -rik (state). Beterik nago = I am full. Jan ondoren beterik nago = I am full after eating. The natural companion to gosea (hungry). Essential for meals.",example:{basque:"Beterik nago, ezin dut gehiago jan.",english:"I am full, I cannot eat any more."}},
  {id:"eguraldi",basque:"Eguraldi",english:"Weather",cefr:"A1",topic:"nature",pronunciation:"eh-goo-RAL-dee",notes:"Weather. Egur (wood/fuel) + aldi (period/time). The Basque Country is famous for its unpredictable weather - four seasons in one day is common. Eguraldia txarra da = the weather is bad. Eguraldiaren iragarpena = weather forecast.",example:{basque:"Eguraldia ona da gaur.",english:"The weather is good today."}},
  {id:"hodeitsu",basque:"Hodeitsu",english:"Cloudy",cefr:"A2",topic:"nature",pronunciation:"hoh-day-TOO",notes:"Cloudy. Hodei (cloud) + -tsu (full of). Hodeitsu dago = it is cloudy. The Basque Country has an oceanic climate - clouds and rain are frequent. Hodei iluna = dark cloud.",example:{basque:"Hodeitsu dago gaur, beharbada euria egingo du.",english:"It is cloudy today, maybe it will rain."}},
  {id:"tenperatura",basque:"Tenperatura",english:"Temperature",cefr:"A2",topic:"nature",pronunciation:"ten-peh-rah-TOO-rah",notes:"Temperature. From Spanish temperatura. Tenperatura altua = high temperature. Tenperatura baxua = low temperature. Zenbat gradu daude? = How many degrees is it? Essential for weather and science.",example:{basque:"Gaur tenperatura altua dago.",english:"Today the temperature is high."}},
  {id:"eguzkitsua",basque:"Eguzkitsua",english:"Sunny",cefr:"A1",topic:"nature",pronunciation:"eh-goos-KEET-soo-ah",notes:"Sunny. Eguzki (sun) + -tsua (full of). Eguzkitsua dago = it is sunny. Eguzki argitsua = bright sunshine. A welcome sight in the often-cloudy Basque Country. The sun features in many Basque symbols.",example:{basque:"Eguzkitsua dago gaur eta parkera joango gara.",english:"It is sunny today and we will go to the park."}},
  {id:"kiroldegi",basque:"Kiroldegi",english:"Sports center / Gym",cefr:"A2",topic:"culture",pronunciation:"kee-rol-DEH-ghee",notes:"Sports center or gym. Kirol (sport) + -tegi (place). The Basque Country has excellent public sports facilities. Kiroldegian joan = to go to the sports center. Igerileku = swimming pool.",example:{basque:"Astelehen eta asteazkenetan kiroldegira joaten naiz.",english:"I go to the sports center on Mondays and Wednesdays."}},
  {id:"literatura",basque:"Literatura",english:"Literature",cefr:"A2",topic:"culture",pronunciation:"lee-teh-rah-TOO-rah",notes:"Literature. International term. Euskal literatura = Basque literature. Literatur saria = literary prize. Bernardo Atxagaren Obabakoak is the most internationally known work of Basque literature.",example:{basque:"Literatura irakurtzea gustuko dut.",english:"I like reading literature."}},
  {id:"senide_hurbilak",basque:"Senide hurbilak",english:"Close relatives / Next of kin",cefr:"B2",topic:"family",pronunciation:"SEH-nee-deh hoor-BEE-lak",notes:"Close relatives or next of kin. Senide (relative/family member) + hurbilak (close ones). Legal and medical contexts require identifying senide hurbilak. Nire senide hurbilena = my closest relative.",example:{basque:"Senide hurbilei jakinarazi behar diegu.",english:"We need to inform the close relatives."}}
];
const CEFR_ORDER=["A1","A2","B1","B2"];
var _VOCAB=SEED_VOCAB;
function getWC(){var o={};["A1","A2","B1","B2"].forEach(function(l){o[l]=_VOCAB.filter(function(w){return w.cefr===l;}).length;});return o;}
var _WC=getWC();
const ANT={gorria:"beltza",beltza:"gorria",handia:"txikia",txikia:"handia",zaharra:"berria",berria:"zaharra",ona:"txarra",txarra:"ona",argia:"iluna",iluna:"argia",beroa:"hotza",hotza:"beroa",garestia:"merkea",merkea:"garestia",erraza:"zaila",zaila:"erraza",ama:"aita",aita:"ama",amona:"aitona",aitona:"amona",semea:"alaba",alaba:"semea",anaia:"ahizpa",ahizpa:"anaia",senarra:"emaztea",emaztea:"senarra",mintzatu:"esan",esan:"mintzatu",belarria:"urtea",urtea:"belarria",ahoa:"hilabetea",hilabetea:"ahoa",ezkerra:"eskuina",eskuina:"ezkerra",irekia:"itxia",itxia:"irekia",burua:"eskua",eskua:"burua",iragana:"etorkizuna",etorkizuna:"iragana",ardoa:"esnea",esnea:"ardoa",kafea:"tea",tea:"kafea",gaua:"eguna",eguna:"gaua"};
function getPool(vocab,cefr,topic,cumul,isPro){var pro=isPro===true;var idx=CEFR_ORDER.indexOf(cefr);var lvls=cumul?CEFR_ORDER.slice(0,idx+1):[cefr];return vocab.filter(function(w){if(lvls.indexOf(w.cefr)===-1)return false;if(topic!=="all"&&w.topic!==topic)return false;if(!pro&&w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)===-1)return false;if(!pro&&w.cefr!=="A1")return false;return true;});}
function shuffled(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function spaced(base,n){if(!base.length)return[];var gap=Math.min(3,base.length-1);var out=[],last={};while(out.length<n){var added=false;for(var i=0;i<base.length;i++){var w=base[i],li=last[w.id]!=null?last[w.id]:-99;if(out.length-li>gap||out.length<=gap){out.push(w);last[w.id]=out.length-1;added=true;if(out.length>=n)break;}}if(!added)break;}return out;}
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
function Confetti(){
  var colors=["#19A85A","#FF6B35","#00B4D8","#F72585","#FFD700","#9B5DE5"];
  var pieces=[];
  for(var i=0;i<30;i++){
    var left=(Math.random()*90+5);
    var delay=(Math.random()*1.5);
    var dur=1.5+(Math.random()*1);
    var color=colors[i%colors.length];
    var size=6+(i%4)*2;
    var isCircle=(i%3===0);
    pieces.push(React.createElement("div",{key:i,style:{position:"fixed",top:0,left:left+"%",width:size,height:size,backgroundColor:color,borderRadius:isCircle?"50%":"2px",animation:"confettiFall "+dur+"s "+delay+"s ease-in forwards",pointerEvents:"none",zIndex:999}}));
  }
  return React.createElement("div",{style:{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:998}},pieces);
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
  var srsStats=useMemo(function(){var words=isProOrTrial?VOCABULARY:VOCABULARY.filter(function(w){return w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)!==-1;});var now=new Date();var due=0,mastered=0,learning=0,unseen=0;for(var i=0;i<words.length;i++){var d=srsData[words[i].id];if(!d){unseen++;continue;}if((d.score||0)>=4){mastered++;continue;}var nr=new Date(d.nextReview);if(nr<=now)due++;else if(nr<=new Date(now.getTime()+86400000))due++;else learning++;}return{due:due,mastered:mastered,learning:learning,unseen:unseen,total:words.length};},[srsData,isPro,isProOrTrial,vocabVersion,trialUntil]);
  useEffect(function(){async function load(){try{var rs=await Promise.all([window.storage.get("streak_data"),window.storage.get("srs_data")]);if(rs[0]&&rs[0].value){var d=JSON.parse(rs[0].value),today=new Date().toDateString(),yest=new Date(Date.now()-86400000).toDateString();setStreak((d.lastDay===today||d.lastDay===yest)?(d.streak||0):0);setLongest(d.longest||0);setTotalSess(d.totalSessions||0);}if(rs[1]&&rs[1].value){try{var parsed=JSON.parse(rs[1].value);if(typeof parsed==="object"&&parsed!==null)setSrsData(parsed);}catch(e){console.warn("SRS data corrupted, resetting");}}
        try{var ph=await window.storage.get("session_history");if(ph&&ph.value){var hist=JSON.parse(ph.value);setSessionHistory(hist);}}catch(e){}
        try{var pr=await window.storage.get("pro_status");if(pr&&pr.value==="1")setIsPro(true);}catch(e){}
        try{var dg=await window.storage.get("daily_goal");if(dg&&dg.value)setDailyGoal(parseInt(dg.value)||10);}catch(e){}
        try{var sf=await window.storage.get("streak_freeze");if(sf&&sf.value){var sfv=JSON.parse(sf.value);if(sfv.until&&new Date(sfv.until)>new Date()){setStreakFrozen(true);}else{window.storage.set("streak_freeze","").catch(function(){});}}}catch(e){}
        try{var lo=await window.storage.get("last_opened");var today2=new Date().toISOString().slice(0,10);setLastOpened(lo&&lo.value?lo.value:null);window.storage.set("last_opened",today2).catch(function(){});}catch(e){}
        try{var tc=await window.storage.get("today_count_"+new Date().toISOString().slice(0,10));if(tc&&tc.value)setTodayCount(parseInt(tc.value)||0);}catch(e){}
        try{var tr=await window.storage.get("trial_until");if(tr&&tr.value){var td=new Date(tr.value);if(td>new Date())setTrialUntil(td);}}catch(e){}try{var ob=await window.storage.get("onboarding_done");if(!ob||!ob.value)setShowOnb(true);}catch(e){setShowOnb(true);}}catch(e){}setStreakLoaded(true);setSrsLoaded(true);
        // Fetch vocabulary
        (async function(){
          try{
            var cached=await window.storage.get("vocab_cache");
            if(cached&&cached.value){try{var cv=JSON.parse(cached.value);if(cv&&cv.vocabulary){_VOCAB=cv.vocabulary;_WC=getWC();setVocabVersion(function(v){return v+1;});}}catch(e){}}
            var res=await fetch(VOCAB_URL);
            if(res.ok){var vj=await res.json();if(vj&&vj.vocabulary){var prevLen=_VOCAB.length;_VOCAB=vj.vocabulary;_WC=getWC();setVocabVersion(function(v){return v+1;});if(vj.vocabulary.length!==prevLen){setToast("vocabulary_loaded");setTimeout(function(){setToast(null);},2500);}window.storage.set("vocab_cache",JSON.stringify(vj)).catch(function(){});}}
          }catch(e){setToast("offline");setTimeout(function(){setToast(null);},3000);}
        })();
      }load();},[]);
  async function updateSRS(res){var nd=Object.assign({},srsData),now=new Date();
  // Only apply results that haven't already been written to SRS.
  // Auto-save passes the cumulative results array at each checkpoint, so without
  // this guard a single answer would be scored multiple times.
  var fresh=res.filter(function(r){return r&&!r._srsApplied;});
  if(!fresh.length)return nd;
  var bestByWord={};
  for(var i=0;i<fresh.length;i++){var r=fresh[i],id=r.question&&r.question.word?r.question.word.id:null;if(!id)continue;var prev=bestByWord[id];if(!prev||(!prev.correct&&(r.correct||(!r.wasClose&&prev.wasClose)))){bestByWord[id]=r;}}
  var changed=Object.keys(bestByWord);
  for(var ci=0;ci<changed.length;ci++){var id2=changed[ci];var r2=bestByWord[id2];var cur=nd[id2]||{score:0};var ns=r2.correct?Math.min(cur.score+1,4):r2.wasClose?cur.score:Math.max(cur.score-1,0);var reviewDays=r2.wasClose?1:SRS_I[ns];nd[id2]={score:ns,nextReview:new Date(now.getTime()+reviewDays*86400000).toISOString(),lastSeen:now.toISOString()};}
  // Mark every fresh result as applied so later checkpoints skip them.
  for(var fi=0;fi<fresh.length;fi++){fresh[fi]._srsApplied=true;}
  setSrsData(function(){return nd;});try{await window.storage.set("srs_data",JSON.stringify(nd)).catch(function(){});}catch(e){}return nd;}
  async function saveSessionHistory(accuracy,level,topic){
  try{
    var r=await window.storage.get("session_history");
    var hist=r&&r.value?JSON.parse(r.value):[];
    hist.push({date:new Date().toISOString().slice(0,10),acc:accuracy,lvl:level,topic:topic});
    if(hist.length>90)hist=hist.slice(-90);
    await window.storage.set("session_history",JSON.stringify(hist)).catch(function(){});
    setSessionHistory(hist);
  }catch(e){}
}
async function recordSession(){var today=new Date().toDateString(),yest=new Date(Date.now()-86400000).toDateString(),ns=streak;try{var r=await window.storage.get("streak_data");var d=r&&r.value?JSON.parse(r.value):{};if(d.lastDay===today)ns=d.streak||0;else if(d.lastDay===yest)ns=(d.streak||0)+1;else ns=streakFrozen?(d.streak||0):1;var nl=Math.max(ns,d.longest||0);var newTotal=(d.totalSessions||0)+1;await window.storage.set("streak_data",JSON.stringify({streak:ns,longest:nl,lastDay:today,totalSessions:newTotal})).catch(function(){});setStreak(ns);setLongest(nl);setTotalSess(newTotal);}catch(e){setStreak(streak+1);}return ns;}
  function startQuiz(config,missedIds){if(!srsLoaded){setToast("loading");setTimeout(function(){setToast(null);},1500);return;}if(!missedIds)missedIds=[];if(!isProOrTrial&&FREE.indexOf(config.cefr)===-1){setCfg(config);setScreen("paywall");return;}var qs=buildSession(VOCABULARY,config.cefr,config.topic,config.cumulative,config.count||20,missedIds,srsData,isProOrTrial);if(!qs.length)return;setCfg(config);setQs(qs);setResults([]);setScreen("quiz");}
  async function finishQuiz(res){if(!res||res.length===0){setScreen("home");return;}var today3=new Date().toISOString().slice(0,10);var newTodayCount=todayCount+res.filter(function(r){return r.correct;}).length;setTodayCount(newTodayCount);window.storage.set("today_count_"+today3,String(newTodayCount)).catch(function(){});var sc=scoreSession(res);var worthStreak=res.length>=5;await Promise.all([worthStreak?recordSession():Promise.resolve(),updateSRS(res),saveSessionHistory(sc.accuracy,cfg?cfg.cefr:"A1",cfg?cfg.topic:"all")]);setResults(res);setScreen("results");}
  var isBooting=!streakLoaded&&screen==="home";
  var isLoadingVocab=!isBooting&&vocabVersion===0&&screen==="home";
return(<div style={{fontFamily:"Nunito,system-ui,-apple-system,sans-serif",backgroundColor:"#F8F7F5",minHeight:"100vh"}}>
    {isLoadingVocab&&<div style={{position:"fixed",top:0,left:0,right:0,height:3,zIndex:9998,background:"linear-gradient(90deg,#19A85A,#22C070,#19A85A)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}}/>}
    {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9999,backgroundColor:toast==="offline"?"#555":toast==="loading"?"#888":"#19A85A",color:"#fff",fontSize:13,fontWeight:700,padding:"10px 20px",borderRadius:24,boxShadow:"0 4px 16px rgba(0,0,0,0.2)",whiteSpace:"nowrap",pointerEvents:"none"}}>{toast==="offline"?"Offline. Showing saved words.":toast==="loading"?"Loading...":"Vocabulary updated!"}</div>}
    {isBooting&&(
      <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",backgroundColor:"#F8F7F5"}}>
        {/* Header skeleton */}
        <div style={{background:"linear-gradient(160deg,#093D24 0%,#0E7A40 40%,#19A85A 100%)",paddingTop:56,paddingLeft:16,paddingRight:16,paddingBottom:0}}>
          <div style={{display:"flex",alignItems:"center",gap:12,paddingBottom:20}}>
            <Logo size={32}/>
            <div style={{flex:1}}>
              <div style={{height:22,width:120,backgroundColor:"rgba(255,255,255,0.2)",borderRadius:8,marginBottom:6,animation:"pulse 1.4s ease-in-out infinite"}}/>
              <div style={{height:12,width:80,backgroundColor:"rgba(255,255,255,0.12)",borderRadius:6,animation:"pulse 1.4s ease-in-out infinite"}}/>
            </div>
            <div style={{width:44,height:44,backgroundColor:"rgba(255,255,255,0.15)",borderRadius:14,animation:"pulse 1.4s ease-in-out infinite"}}/>
          </div>
          <svg viewBox="0 0 420 40" style={{display:"block",width:"100%",height:40,marginTop:-1}} preserveAspectRatio="none">
            <path d="M0,40 C140,0 280,0 420,40 L420,40 L0,40 Z" fill="#F6F6F6"/>
          </svg>
        </div>
        {/* Content skeleton */}
        <div style={{padding:"16px 16px"}}>
          {/* Browse + Games row */}
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {[1,2].map(function(i){return(
              <div key={i} style={{flex:1,height:62,backgroundColor:"#fff",borderRadius:14,border:"1px solid #F0F0F0",animation:"pulse 1.4s ease-in-out infinite"}}/>
            );})}
          </div>
          {/* Daily goal card */}
          <div style={{height:90,backgroundColor:"#fff",borderRadius:18,border:"1px solid #F0F0F0",marginBottom:16,animation:"pulse 1.4s ease-in-out infinite"}}/>
          {/* SRS card */}
          <div style={{height:80,backgroundColor:"#fff",borderRadius:18,border:"1px solid #F0F0F0",marginBottom:16,animation:"pulse 1.4s ease-in-out infinite"}}/>
          {/* Level cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[1,2,3,4].map(function(i){return(
              <div key={i} style={{height:88,backgroundColor:"#fff",borderRadius:18,border:"1px solid #F0F0F0",animation:"pulse 1.4s ease-in-out infinite",animationDelay:(i*0.1)+"s"}}/>
            );})}
          </div>
          {/* Start button */}
          <div style={{height:56,backgroundColor:"#E0F0E8",borderRadius:18,animation:"pulse 1.4s ease-in-out infinite"}}/>
        </div>
      </div>
    )}
  {!isBooting&&screen==="home"&&<HomeScreen onStart={startQuiz} isPro={isProOrTrial} isTrialActive={isTrialActive} trialUntil={trialUntil} streak={streak} longest={longest} streakLoaded={streakLoaded} dailyGoal={dailyGoal} todayCount={todayCount} streakFrozen={streakFrozen} lastOpened={lastOpened} onSetDailyGoal={function(g){setDailyGoal(g);window.storage.set("daily_goal",String(g)).catch(function(){});}} onUseStreakFreeze={function(){setStreakFrozen(true);var until=new Date(Date.now()+86400000).toISOString();window.storage.set("streak_freeze",JSON.stringify({until:until})).catch(function(){});}} srsStats={srsStats} srsLoaded={srsLoaded} onBrowse={function(){setScreen("browse");}} onGames={function(){setScreen("games");}} onStories={function(){setScreen("story");}} onUpgrade={function(){setScreen("paywall");}} onReplayIntro={function(){setShowOnb(true);}} totalSessions={totalSess} srsData={srsData} vocabVersion={vocabVersion}/>}
    {screen==="quiz"&&<QuizScreen questions={questions} onFinish={finishQuiz} onExit={function(){setScreen("home");}} srsData={srsData} quizTopic={cfg?cfg.topic:"all"} onAutoSave={function(res){updateSRS(res).catch(function(){});}}/>}
    {screen==="results"&&<ResultsScreen results={results} streak={streak} longest={longest} totalSessions={totalSess} srsStats={srsStats} isPro={isProOrTrial} sessionHistory={sessionHistory} onRetry={function(ids){if(cfg)startQuiz(cfg,ids||[]);else setScreen("home");}} onHome={function(){setScreen("home");}} onUpgrade={function(){setScreen("paywall");}} streakFrozen={streakFrozen} onUseStreakFreeze={function(){setStreakFrozen(true);var until=new Date(Date.now()+86400000).toISOString();window.storage.set("streak_freeze",JSON.stringify({until:until})).catch(function(){});}}/>}
    {screen==="paywall"&&<PaywallScreen
    trialAvailable={!trialUntil&&!isPro}
    trialDays={7}
    vocabCount={VOCABULARY.length}
    onTrial={function(){var until=new Date(Date.now()+7*86400000);setTrialUntil(until);window.storage.set("trial_until",until.toISOString()).catch(function(){});setScreen("home");}}
    onSubscribe={function(){setIsPro(true);window.storage.set("pro_status","1").catch(function(){});setScreen("home");}}
    onContinueFree={function(){setScreen("home");}}
    onStart={function(){setIsPro(true);window.storage.set("pro_status","1").catch(function(){});if(cfg){var qs=buildSession(VOCABULARY,cfg.cefr,cfg.topic,cfg.cumulative,20,[],srsData,true);if(qs.length){setQs(qs);setResults([]);setScreen("quiz");return;}}setScreen("home");}}
  />}
    {screen==="games"&&<GamesScreen onBack={function(){setScreen("home");}} onPairs={function(){setScreen("pairs");}} onTap={function(){setScreen("tap");}} onTxoko={function(){setScreen("txoko");}} onOrdutegi={function(){setScreen("ordutegi");}} onKoloreak={function(){setScreen("koloreak");}} onArbola={function(){setScreen("arbola");}} isPro={isProOrTrial}/>}
    {screen==="pairs"&&<PairsScreen onBack={function(){setScreen("games");}} isPro={isProOrTrial} onUpgrade={function(){setScreen("paywall");}}/>}
    {screen==="tap"&&<TapScreen onBack={function(){setScreen("games");}} isPro={isProOrTrial} onUpgrade={function(){setScreen("paywall");}}/>}
    {screen==="txoko"&&<BasqueKitchenScreen onBack={function(){setScreen("games");}} isPro={isProOrTrial} onUpgrade={function(){setScreen("paywall");}}/>}
    {screen==="ordutegi"&&<OrduegiScreen onBack={function(){setScreen("games");}} isPro={isProOrTrial} onUpgrade={function(){setScreen("paywall");}}/>}
    {screen==="koloreak"&&<KoloreakScreen onBack={function(){setScreen("games");}} isPro={isProOrTrial} onUpgrade={function(){setScreen("paywall");}}/>}
    {screen==="arbola"&&<ArbolaScreen onBack={function(){setScreen("games");}} isPro={isProOrTrial} onUpgrade={function(){setScreen("paywall");}}/>}
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
    {screen==="story"&&<StoryScreen isPro={isProOrTrial} onBack={function(){setScreen("home");}} onUpgrade={function(){setScreen("paywall");}}/>}
    {showOnb&&<OnboardingScreen onDone={function(){window.storage.set("onboarding_done","1").catch(function(){});setShowOnb(false);}} onUpgrade={function(){window.storage.set("onboarding_done","1").catch(function(){});setShowOnb(false);setScreen("paywall");}}/>}
  </div>);}
function HomeScreen(props){
  var VOCABULARY=_VOCAB;
  var WC=_WC;
  var onStart=props.onStart,isPro=props.isPro,streak=props.streak,longest=props.longest||0,dailyGoal=props.dailyGoal||10,todayCount=props.todayCount||0,streakFrozen=props.streakFrozen||false,lastOpened=props.lastOpened,onSetDailyGoal=props.onSetDailyGoal,onUseStreakFreeze=props.onUseStreakFreeze,streakLoaded=props.streakLoaded,srsStats=props.srsStats,srsLoaded=props.srsLoaded,onBrowse=props.onBrowse,onGames=props.onGames,onStories=props.onStories,onUpgrade=props.onUpgrade,onReplayIntro=props.onReplayIntro;var totalSessions=props.totalSessions||0;var srsData=props.srsData||{};var isTrialActive=props.isTrialActive;var trialUntil=props.trialUntil;var vocabVersion=props.vocabVersion||0;
  var _s0=useState("A1");var lvl=_s0[0];var setLvlRaw=_s0[1];
  var _s1=useState("all");var topic=_s1[0];var setTopicRaw=_s1[1];
  var _s2=useState(false);var cumul=_s2[0];var setCumulRaw=_s2[1];
  var _s3=useState(null);var modal=_s3[0];var setModal=_s3[1];
  var _s4=useState(20);var sessionLen=_s4[0];var setSessionLen=_s4[1];
  var _sfx=useState(getSfxOn());var sfxOn=_sfx[0];var setSfxOnState=_sfx[1];
  useEffect(function(){try{window.storage.get("sfx_on").then(function(r){if(r&&r.value==="0"){setSfxOnState(false);}else{setSfxOnState(true);}}).catch(function(){});}catch(e){}},[]);
  function setLvl(v){setLvlRaw(v);setTopicRaw(function(t){setCumulRaw(function(c){window.storage.set("last_config",JSON.stringify({lvl:v,topic:t,cumul:c})).catch(function(){});return c;});return t;});}
  function setTopic(v){setTopicRaw(v);setLvlRaw(function(l){setCumulRaw(function(c){window.storage.set("last_config",JSON.stringify({lvl:l,topic:v,cumul:c})).catch(function(){});return c;});return l;});}
  function setCumul(fn){var nv=typeof fn==="function"?fn(cumul):fn;setCumulRaw(nv);setLvlRaw(function(l){setTopicRaw(function(t){window.storage.set("last_config",JSON.stringify({lvl:l,topic:t,cumul:nv})).catch(function(){});return t;});return l;});}
  useEffect(function(){window.storage.get("last_config").then(function(r){if(r&&r.value){try{var d=JSON.parse(r.value);if(d.lvl)setLvlRaw(d.lvl);if(d.topic){var safeTopic=(isPro||FREE_TOPICS.indexOf(d.topic)!==-1||d.topic==="all")?d.topic:"all";setTopicRaw(safeTopic);}if(d.cumul)setCumulRaw(d.cumul);}catch(e){}}}).catch(function(){});},[]);
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
  var daysSinceOpened=0;if(lastOpened&&lastOpened!==today4){var diff=Math.round((new Date(today4)-new Date(lastOpened))/86400000);daysSinceOpened=isNaN(diff)?0:diff;}
  var goalPct=Math.min(Math.round(todayCount/(dailyGoal||10)*100),100);
  var goalDone=todayCount>=(dailyGoal||10);
  var dayNum=Math.floor(Date.now()/86400000);
  var freeWords=VOCABULARY.filter(function(w){return w.cefr==="A1"&&(isPro||FREE_TOPICS.indexOf(w.topic)!==-1);});
  var wotd=freeWords.length>0?freeWords[dayNum%freeWords.length]:null;
  var _ml=modal&&CL[modal]?CL[modal]:null;
  function onClose(){setModal(null);}
  var modalJSX=_ml?(<div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={function(){onClose();}}><div style={{backgroundColor:"#fff",borderTopLeftRadius:28,borderTopRightRadius:28,width:"100%",maxWidth:420,margin:"0 auto",overflow:"hidden"}} onClick={function(e){e.stopPropagation();}}><div style={{backgroundColor:_ml.color,padding:"20px 20px 16px"}}><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:28,fontWeight:900,color:"rgba(255,255,255,0.9)"}}>{modal}</span><div style={{flex:1}}><p style={{margin:0,fontSize:18,fontWeight:900,color:"#fff"}}>{_ml.title}</p><p style={{margin:"2px 0 0",fontSize:12,color:"rgba(255,255,255,0.8)"}}>{_ml.tagline}</p></div><button style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:14,fontFamily:"inherit"}} onClick={function(){onClose();}}>✕</button></div></div><div style={{padding:"16px 20px 32px",maxHeight:"70vh",overflowY:"auto"}}><p style={{margin:"0 0 10px",fontSize:11,fontWeight:800,color:"#888",textTransform:"uppercase",letterSpacing:0.8}}>At this level you can...</p>{_ml.canDo.map(function(c,i){return(<div key={i} style={{display:"flex",gap:10,marginBottom:8}}><span style={{fontSize:12,fontWeight:800,color:"#fff",backgroundColor:_ml.color,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>✓</span><p style={{margin:0,fontSize:13,color:"#1A1A1A",fontWeight:500,lineHeight:1.4}}>{c}</p></div>);})}<div style={{backgroundColor:_ml.bg,borderRadius:12,padding:"12px 14px",marginTop:12,border:"1.5px solid rgba(0,0,0,0.1)"}}><p style={{margin:0,fontSize:13,color:"#555",lineHeight:1.55,fontWeight:500}}>Tip: {_ml.tip}</p></div><div style={{display:"flex",gap:8,marginTop:12}}><div style={{flex:1,backgroundColor:"#F6F6F6",borderRadius:10,padding:"10px",textAlign:"center"}}><p style={{margin:0,fontSize:16,fontWeight:900,color:_ml.color}}>{WC[modal]}</p><p style={{margin:0,fontSize:10,color:"#888",fontWeight:600}}>WORDS</p></div><div style={{flex:1,backgroundColor:"#F6F6F6",borderRadius:10,padding:"10px",textAlign:"center"}}><p style={{margin:0,fontSize:12,fontWeight:800,color:"#1A1A1A"}}>{_ml.studyHours}</p><p style={{margin:0,fontSize:10,color:"#888",fontWeight:600}}>GUIDED STUDY</p></div></div><button style={{width:"100%",marginTop:14,border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:800,color:"#fff",cursor:"pointer",backgroundColor:_ml.color,boxShadow:"0 4px 0 "+_ml.dark,fontFamily:"inherit"}} onClick={function(){if(!isPro&&modal!=="A1"){onClose();onUpgrade();return;}setLvl(modal);onClose();}}>{!isPro&&modal!=="A1"?"Unlock "+modal+" words":"Study "+modal+" words"}</button></div></div></div>):null;
  return(<div style={{maxWidth:420,margin:"0 auto",display:"flex",flexDirection:"column",minHeight:"100vh",backgroundColor:"#F2F2F7"}}>

    {/* ── Header ── */}
    <div style={{background:"linear-gradient(160deg,#093D24 0%,#0E7A40 45%,#19A85A 100%)",paddingTop:56,paddingLeft:16,paddingRight:16,paddingBottom:0,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:14}}>
        <Logo size={30}/>
        <div style={{flex:1}}>
          <h1 style={{margin:0,fontSize:19,fontWeight:900,color:"#fff",letterSpacing:-0.5,lineHeight:1}}>Ikasi & Go™</h1>
          <p style={{margin:"2px 0 0",fontSize:10,color:"rgba(255,255,255,0.55)",fontWeight:600}}>Learn Basque · Euskara{vocabVersion===0&&<span style={{fontSize:9,backgroundColor:"rgba(0,0,0,0.2)",padding:"1px 5px",borderRadius:6,marginLeft:5}}>OFFLINE</span>}</p>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {streakLoaded&&streak>0&&(
            <div style={{display:"flex",alignItems:"center",gap:4,backgroundColor:"rgba(0,0,0,0.2)",borderRadius:20,padding:"5px 10px",border:"1px solid rgba(255,255,255,0.1)"}}>
              <span style={{fontSize:13}}>🔥</span>
              <div>
                <p style={{margin:0,fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{streak}</p>
                <p style={{margin:0,fontSize:8,color:"rgba(255,255,255,0.5)",fontWeight:600}}>DAY{streak!==1?"S":""}</p>
              </div>
            </div>
          )}
          {!isPro&&!isTrialActive&&(
            <button onClick={onUpgrade} style={{backgroundColor:"rgba(255,255,255,0.15)",borderRadius:20,padding:"6px 11px",border:"1px solid rgba(255,255,255,0.2)",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
              <p style={{margin:0,fontSize:10,fontWeight:900,color:"#fff",lineHeight:1.1}}>PRO</p>
              <p style={{margin:0,fontSize:8,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>unlock</p>
            </button>
          )}
          {isTrialActive&&(
            <div style={{backgroundColor:"rgba(255,200,0,0.15)",borderRadius:20,padding:"6px 11px",border:"1px solid rgba(255,200,0,0.3)",textAlign:"center"}}>
              <p style={{margin:0,fontSize:11,fontWeight:900,color:"#FFE066",lineHeight:1.1}}>{Math.max(0,Math.ceil((new Date(trialUntil)-new Date())/86400000))}d</p>
              <p style={{margin:0,fontSize:8,fontWeight:600,color:"rgba(255,220,0,0.7)"}}>trial</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ── Start card — seamlessly below header ── */}
    <div style={{backgroundColor:"#fff",boxShadow:"0 4px 24px rgba(0,0,0,0.1)"}}>
      {/* Level selector */}
      <div style={{display:"flex",borderBottom:"1px solid #F2F2F7"}}>
        {["A1","A2","B1","B2"].map(function(key){
          var active=lvl===key;var locked=!isPro&&key!=="A1";var L2=CL[key];
          return(
            <button key={key} onClick={function(){if(locked){setModal(key);return;}setLvl(key);}}
              style={{flex:1,padding:"12px 4px",border:"none",borderBottom:active?"3px solid "+L2.color:"3px solid transparent",backgroundColor:active?L2.bg+"80":"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.15s"}}>
              <p style={{margin:0,fontSize:14,fontWeight:900,color:active?L2.color:locked?"#C7C7CC":"#8E8E93",lineHeight:1}}>{key}</p>
              <p style={{margin:0,fontSize:8,color:active?L2.color:"#C7C7CC",fontWeight:600,marginTop:1}}>{locked?"🔒":active?"●":"·"}</p>
            </button>
          );
        })}
      </div>

      {/* Topic chips */}
      <div style={{display:"flex",gap:5,overflowX:"auto",padding:"10px 14px",WebkitOverflowScrolling:"touch",borderBottom:"1px solid #F2F2F7"}}>
        {TOPICS.map(function(t){
          var active=topic===t.key;var cnt=topicCounts[t.key]||0;var bad=t.key!=="all"&&cnt===0;var tk=t.key;
          var locked=!isPro&&lvl==="A1"&&t.key!=="all"&&FREE_TOPICS.indexOf(t.key)===-1;
          return(
            <button key={t.key} onClick={function(){if(!bad){if(locked){onUpgrade();}else{setTopic(tk);}}}}
              style={{flexShrink:0,padding:"6px 12px",borderRadius:20,border:"1.5px solid "+(active?L.dark:"#E8E8E8"),backgroundColor:active?L.color:"#F2F2F7",cursor:bad?"default":"pointer",fontFamily:"inherit",opacity:bad?0.4:1,transition:"all 0.12s"}}>
              <span style={{fontSize:12,fontWeight:active?800:500,color:active?"#fff":locked?"#C7C7CC":"#555",whiteSpace:"nowrap"}}>{locked?"🔒 ":""}{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Controls + Start */}
      <div style={{padding:"12px 14px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
          <div style={{display:"flex",gap:4,flex:1}}>
            {[10,20,30].map(function(n){var active=sessionLen===n;var nn=n;return(
              <button key={n} onClick={function(){setSessionLen(nn);}} style={{flex:1,padding:"7px 4px",borderRadius:10,border:"1.5px solid "+(active?L.dark:"#E8E8E8"),backgroundColor:active?L.color:"#F2F2F7",color:active?"#fff":"#8E8E93",fontSize:12,fontWeight:active?800:500,cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}}>
                {n}<span style={{fontSize:9,opacity:0.6}}> q</span>
              </button>
            );})}
          </div>
          {lvl!=="A1"&&(
            <button onClick={function(){setCumul(function(c){return !c;});}} style={{padding:"7px 10px",borderRadius:10,border:"1.5px solid "+(cumul?L.dark:"#E8E8E8"),backgroundColor:cumul?L.bg:"#F2F2F7",color:cumul?L.color:"#8E8E93",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
              {cumul?"✓":"+"} all levels
            </button>
          )}
        </div>
        {pw&&<div style={{backgroundColor:pw.bg,border:"1.5px solid "+pw.b,borderRadius:12,padding:"9px 12px",marginBottom:10}}><p style={{margin:"0 0 "+(pw.cta?"6px":"0"),fontSize:12,color:pw.c,fontWeight:600}}>{pw.msg}</p>{pw.cta&&<button onClick={onUpgrade} style={{width:"100%",backgroundColor:"#19A85A",border:"none",borderRadius:8,padding:"8px",fontSize:12,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Unlock with Pro</button>}</div>}
        {props.totalSessions===0&&lvl==="A1"&&topic==="all"&&<p style={{margin:"0 0 8px",fontSize:12,color:"#8E8E93",textAlign:"center"}}>Tip: start with <button onClick={function(){setTopic("greetings");}} style={{background:"none",border:"none",color:"#19A85A",fontWeight:800,cursor:"pointer",fontSize:12,padding:0,fontFamily:"inherit"}}>Greetings</button>!</p>}
        <button style={{width:"100%",border:"none",borderRadius:16,padding:"17px",fontSize:17,fontWeight:900,color:"#fff",cursor:poolSize===0?"not-allowed":"pointer",backgroundColor:poolSize===0?"#C7C7CC":L.color,boxShadow:poolSize===0?"none":"0 5px 0 "+L.dark,fontFamily:"inherit",letterSpacing:-0.3,transition:"all 0.15s"}} onClick={function(){if(poolSize>0)onStart({cefr:lvl,topic:topic,cumulative:cumul,count:sessionLen});}} disabled={poolSize===0}>
          {poolSize>0?"Start · "+effectiveCount+" questions":"No words available"}
        </button>
      </div>
    </div>

    <div style={{padding:"10px 14px calc(72px + env(safe-area-inset-bottom, 0px))",display:"flex",flexDirection:"column",gap:10,flex:1}}>

      {/* ── Expired trial ── */}
      {trialUntil&&!isTrialActive&&!isPro&&(
        <div style={{backgroundColor:"#fff",border:"1.5px solid #F59E0B",borderRadius:16,padding:"13px 14px"}}>
          <p style={{margin:"0 0 4px",fontSize:13,fontWeight:800,color:"#D97706"}}>Your free trial has ended</p>
          <p style={{margin:"0 0 8px",fontSize:12,color:"#8E8E93"}}>Subscribe to keep access to all words.</p>
          <button onClick={onUpgrade} style={{width:"100%",backgroundColor:"#19A85A",border:"none",borderRadius:12,padding:"10px",fontSize:13,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 3px 0 #0E7A40"}}>Subscribe now</button>
        </div>
      )}

      {/* ── Quick actions ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <button onClick={onBrowse} style={{backgroundColor:"#fff",border:"none",borderRadius:16,padding:"14px 10px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",boxShadow:"0 1px 3px rgba(0,0,0,0.07)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,backgroundColor:"#19A85A",borderRadius:"16px 16px 0 0"}}/>
          <span style={{fontSize:20,display:"block",marginBottom:6,marginTop:4}}>📖</span>
          <p style={{margin:0,fontSize:13,fontWeight:800,color:"#1A1A1A"}}>Browse</p>
          <p style={{margin:0,fontSize:11,color:"#8E8E93",fontWeight:500}}>{browseCount} words</p>
        </button>
        <button onClick={onStories} style={{backgroundColor:"#fff",border:"none",borderRadius:16,padding:"14px 10px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",boxShadow:"0 1px 3px rgba(0,0,0,0.07)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,backgroundColor:"#0D9488",borderRadius:"16px 16px 0 0"}}/>
          <span style={{fontSize:20,display:"block",marginBottom:6,marginTop:4}}>📚</span>
          <p style={{margin:0,fontSize:13,fontWeight:800,color:"#1A1A1A"}}>Read</p>
          <p style={{margin:0,fontSize:11,color:"#8E8E93",fontWeight:500}}>Stories</p>
        </button>
        <button onClick={onGames} style={{backgroundColor:"#fff",border:"none",borderRadius:16,padding:"14px 10px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",boxShadow:"0 1px 3px rgba(0,0,0,0.07)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,backgroundColor:"#F97316",borderRadius:"16px 16px 0 0"}}/>
          <span style={{fontSize:20,display:"block",marginBottom:6,marginTop:4}}>🎮</span>
          <p style={{margin:0,fontSize:13,fontWeight:800,color:"#1A1A1A"}}>Games</p>
          <p style={{margin:0,fontSize:11,color:"#8E8E93",fontWeight:500}}>6 games</p>
        </button>
      </div>

      {/* ── Daily goal + Word of the day ── */}
      <div style={{display:"grid",gridTemplateColumns:wotd?"1fr 1fr":"1fr",gap:8}}>
        <div style={{backgroundColor:"#fff",borderRadius:16,padding:"13px",boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <p style={{margin:0,fontSize:12,fontWeight:800,color:"#1A1A1A"}}>{goalDone?"🎯":"📅"} Today</p>
            <p style={{margin:0,fontSize:11,color:goalDone?"#19A85A":"#8E8E93",fontWeight:700}}>{todayCount}/{dailyGoal}</p>
          </div>
          <div style={{height:5,backgroundColor:"#F2F2F7",borderRadius:3,overflow:"hidden",marginBottom:7}}>
            <div style={{height:"100%",backgroundColor:goalDone?"#19A85A":"#F59E0B",borderRadius:3,width:goalPct+"%",transition:"width 0.5s ease"}}/>
          </div>
          {goalDone?(
            <p style={{margin:0,fontSize:11,color:"#19A85A",fontWeight:700}}>✓ Goal complete!</p>
          ):(
            <div style={{display:"flex",gap:4}}>
              {[5,10,20].map(function(g){return(
                <button key={g} onClick={function(){onSetDailyGoal(g);}} style={{flex:1,padding:"4px 0",borderRadius:7,border:"1px solid "+(dailyGoal===g?"#19A85A":"#E8E8E8"),backgroundColor:dailyGoal===g?"#EDFAF3":"#F2F2F7",color:dailyGoal===g?"#19A85A":"#8E8E93",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{g}</button>
              );})}
            </div>
          )}
          {daysSinceOpened>=2&&<p style={{margin:"5px 0 0",fontSize:10,color:"#8E8E93"}}>Back after {daysSinceOpened} days!</p>}
        </div>
        {wotd&&(
          <div style={{backgroundColor:"#fff",borderRadius:16,padding:"13px",boxShadow:"0 1px 3px rgba(0,0,0,0.07)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#19A85A,#22C55E)",borderRadius:"16px 16px 0 0"}}/>
            <p style={{margin:"4px 0 5px",fontSize:9,fontWeight:800,color:"#19A85A",textTransform:"uppercase",letterSpacing:0.8}}>✨ Today's word</p>
            <p style={{margin:"0 0 2px",fontSize:18,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.3,lineHeight:1.1}}>{wotd.basque}</p>
            <p style={{margin:"0 0 3px",fontSize:12,color:"#555",fontWeight:600}}>{wotd.english}</p>
            <p style={{margin:0,fontSize:9,color:"#AAA",fontWeight:600,letterSpacing:0.2}}>{wotd.pronunciation}</p>
          </div>
        )}
      </div>

      {/* ── SRS / Word memory ── */}
      {srsCard}

      {/* ── Level cards (for info/unlock) ── */}
      {!isPro&&(
        <div style={{backgroundColor:"#fff",borderRadius:16,padding:"14px",boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
          <p style={{margin:"0 0 10px",fontSize:12,fontWeight:800,color:"#1A1A1A"}}>Your progress</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {levelCards}
          </div>
          <button onClick={onUpgrade} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:10,width:"100%",backgroundColor:"#FFF8F0",border:"1.5px solid #FED7AA",borderRadius:12,padding:"10px",fontSize:12,fontWeight:800,color:"#D97706",cursor:"pointer",fontFamily:"inherit"}}>
            ✦ Unlock A2, B1 &amp; B2: 500+ more words
          </button>
        </div>
      )}
      {isPro&&(
        <div style={{backgroundColor:"#fff",borderRadius:16,padding:"14px",boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
          <p style={{margin:"0 0 10px",fontSize:12,fontWeight:800,color:"#1A1A1A"}}>Your progress</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {levelCards}
          </div>
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14}}>
        <button onClick={onReplayIntro} style={{background:"none",border:"none",color:"#C7C7CC",fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:"6px",textDecoration:"underline"}}>About this app &amp; Basque</button>
        <button onClick={function(){var nv=!sfxOn;setSfxOnState(nv);setSfxOn(nv);if(nv)sfx("correct");}} style={{background:"none",border:"none",color:"#C7C7CC",fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:"6px",display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:13}}>{sfxOn?"🔊":"🔇"}</span>
          <span style={{textDecoration:"underline"}}>Sound {sfxOn?"on":"off"}</span>
        </button>
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
  var _s9=useState(0);var correctStreak=_s9[0];var setCorrectStreak=_s9[1];
  var _s10=useState(null);var burst=_s10[0];var setBurst=_s10[1];
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
  function submit(ans){if(result)return;if(ans==="_SKIP_"){haptic("error");sfx("wrong");setResult({correct:false,wasClose:false,skipped:true});setWrongCount(function(n){return n+1;});setCorrectStreak(0);setBurst("wrong");setTimeout(function(){setBurst(null);},700);var newLatest2=latest.current.concat([{question:q,correct:false,wasClose:false,skipped:true}]);latest.current=newLatest2;return;}var qForCheck=isSnoozed&&origType==="typing"?Object.assign({},q,{correct:snoozeCorrect,mode:"multipleChoice"}):q;var r=checkAnswer(qForCheck,ans);setResult(r);if(r.correct){var ns=correctStreak+1;setCorrectStreak(ns);haptic("success");sfx(ns>0&&ns%5===0?"streak":"correct");setBurst(ns>=3?"streak":"correct");}else{setWrongCount(function(n){return n+1;});setCorrectStreak(0);haptic("error");sfx("wrong");setBurst(r.wasClose?"close":"wrong");}setTimeout(function(){setBurst(null);},900);var newLatest=latest.current.concat([Object.assign({},r,{question:q})]);latest.current=newLatest;}
  var advancing=React.useRef(false);function advance(){if(advancing.current)return;advancing.current=true;setTimeout(function(){advancing.current=false;},2000);var delay=result&&result.correct?180:0;var currentLatest=latest.current;var nextIdx=idx+1;if(nextIdx>=questions.length){advancing.current=false;onFinish(currentLatest);}else{setTimeout(function(){setIdx(function(i){return i+1;});setSel(null);setTyped("");setResult(null);setShowNote(false);setWrongCount(0);advancing.current=false;if(nextIdx%5===0&&nextIdx<questions.length){try{if(props.onAutoSave)props.onAutoSave(currentLatest);}catch(e){}}},delay);}}
  var snoozeMin=Math.floor(snoozeLeft/60);
  var snoozeSec=("0"+(snoozeLeft%60)).slice(-2);
  var snoozeDisplay=snoozeMin+":"+snoozeSec;
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
  var opts=q.options||snoozeOpts;
  return(<div style={{maxWidth:420,margin:"0 auto",display:"flex",flexDirection:"column",minHeight:"100vh",backgroundColor:"#F2F2F7",fontFamily:"Nunito,system-ui,sans-serif"}}>

    {/* ── Header ── */}
    <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:56,paddingLeft:14,paddingRight:14,paddingBottom:12,backgroundColor:"#fff",flexShrink:0}}>
      <button style={{background:"#F2F2F7",border:"none",color:"#555",fontSize:14,cursor:"pointer",padding:0,fontFamily:"inherit",width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}} onClick={function(){if(idx>0)setConfirmExit(true);else onExit();}}>✕</button>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
        <div style={{height:6,backgroundColor:"#E8E8EE",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,"+ld+","+lc+")",width:(((idx+(result?1:0))/questions.length)*100)+"%",transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:10,fontWeight:700,color:lc}}>{questions[0].word.cefr} · {TL[props.quizTopic]||props.quizTopic||""}</span>
          <span style={{fontSize:10,fontWeight:800,color:"#1A1A1A"}}>{idx+1}<span style={{color:"#C7C7CC"}}>/{questions.length}</span></span>
        </div>
      </div>
      {correctStreak>=2&&(
        <div key={"streak-"+correctStreak} style={{display:"flex",alignItems:"center",gap:3,backgroundColor:correctStreak>=5?"#FEF3C7":"#EDFAF3",borderRadius:14,padding:"5px 9px",flexShrink:0,animation:"streakPop 0.4s cubic-bezier(0.34,1.56,0.64,1)",border:"1px solid "+(correctStreak>=5?"#FCD34D":"#A7F3D0")}}>
          <span style={{fontSize:13,lineHeight:1}}>{correctStreak>=5?"🔥":"⚡"}</span>
          <span style={{fontSize:13,fontWeight:900,color:correctStreak>=5?"#D97706":"#19A85A",lineHeight:1}}>{correctStreak}</span>
        </div>
      )}
    </div>

    {isSnoozed&&(
      <div style={{backgroundColor:"#FFF8F0",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,borderBottom:"1px solid #FCD34D"}}>
        <span style={{fontSize:12,fontWeight:600,color:"#D97706"}}>⏱️ Typing snoozed ({snoozeDisplay} left)</span>
        <button onClick={function(){setSnoozeUntil(null);}} style={{background:"none",border:"none",color:"#D97706",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Resume</button>
      </div>
    )}

    {/* ── Main content ── */}
    <div style={{flex:1,overflowY:"auto",padding:"14px 14px calc(120px + env(safe-area-inset-bottom, 0px))",display:"flex",flexDirection:"column",gap:10}}>

      {/* Mode chip */}
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:11,fontWeight:800,padding:"4px 12px",borderRadius:20,color:isFB?"#7C3AED":isMC?"#B45309":"#0D9488",backgroundColor:isFB?"#EDE9FE":isMC?"#FEF3C7":"#CCFBF1",letterSpacing:0.2}}>{isFB?"Complete the sentence":isMC?"Choose the meaning":"Type in Basque"}</span>
        {isNewWord&&<span style={{fontSize:10,fontWeight:800,color:"#fff",backgroundColor:"#F59E0B",padding:"3px 8px",borderRadius:12}}>NEW</span>}
      </div>

      {/* ── Question card ── */}
      <div key={"card-"+idx} style={{backgroundColor:"#fff",borderRadius:22,overflow:"hidden",boxShadow:result?"none":"0 2px 16px rgba(0,0,0,0.07)",border:"2px solid "+(result?(result.correct?"#19A85A":result.wasClose?"#F59E0B":"#EF4444"):"transparent"),transition:"border-color 0.2s, box-shadow 0.2s",animation:burst==="wrong"?"shake 0.4s ease":"slideUp 0.2s ease"}}>

        {/* Coloured accent strip at top */}
        <div style={{height:4,background:"linear-gradient(90deg,"+ld+","+lc+")"}}/>

        <div style={{padding:"18px 18px 16px"}}>

          {/* MC / Typing question */}
          {(isMC||isType||result)&&!isFB&&(
            <div style={{textAlign:"center"}}>
              <h2 style={{margin:"0 0 6px",fontSize:isMC?(q.word.basque.length>14?24:q.word.basque.length>10?30:38):28,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5,wordBreak:"break-word",lineHeight:1.15}}>{isMC?q.word.basque:q.prompt}</h2>
              {isMC&&!result&&<p style={{margin:0,fontSize:12,color:"#C7C7CC",fontWeight:600}}>What does this mean in English?</p>}
              {isType&&!result&&<p style={{margin:"4px 0 0",fontSize:11,color:lc,fontWeight:800,letterSpacing:0.5,textTransform:"uppercase"}}>→ type in Basque</p>}
              {result&&isMC&&<p style={{margin:"4px 0 0",fontSize:13,color:"#8E8E93",fontWeight:600,fontStyle:"italic"}}>{q.word.pronunciation}</p>}
              {result&&isType&&<p style={{margin:"6px 0 0",fontSize:24,fontWeight:900,color:lc,letterSpacing:-0.3}}>{q.word.basque}</p>}
            </div>
          )}

          {/* Fill-in-blank */}
          {isFB&&(
            <p style={{fontSize:15,lineHeight:2,fontWeight:500,color:"#1A1A1A",textAlign:"center",margin:"4px 0 8px"}}>
              {q.prompt.split("___").map(function(part,pi,arr){return(
                <span key={pi}>{part}{pi<arr.length-1&&(<span style={{display:"inline-block",minWidth:80,borderBottom:result?"none":"2.5px solid "+lc,color:result?(result.correct?"#19A85A":"#EF4444"):"transparent",fontWeight:900,textAlign:"center",padding:"0 6px",fontSize:16}}>{result?q.correct:"___"}</span>)}</span>
              );})}
            </p>
          )}

          {/* Typing input */}
          {isType&&!result&&(
            <div style={{marginTop:12}}>
              <input style={{width:"100%",border:"2px solid #E8E8E8",borderRadius:16,padding:"15px 18px",fontSize:18,fontWeight:600,color:"#1A1A1A",outline:"none",boxSizing:"border-box",fontFamily:"inherit",backgroundColor:"#F9F9F9"}} placeholder="Type in Basque…" value={typed} onChange={function(e){if(!result)setTyped(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&typed.trim()&&!result)submit(typed);}} autoFocus autoComplete="off" spellCheck={false}/>
              {wrongCount>0&&!isSnoozed&&snoozeCorrect&&snoozeCorrect.length>0&&(
                <p style={{margin:"8px 0 0",fontSize:12,color:"#C7C7CC",textAlign:"center"}}>
                  Hint: starts with <strong style={{color:"#888",fontSize:14}}>{snoozeCorrect[0].toUpperCase()}</strong>
                  {wrongCount>1&&<span> · {snoozeCorrect.length} letters</span>}
                </p>
              )}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:10,alignItems:"center"}}>
                <button onClick={function(){haptic("light");submit("_SKIP_");}} style={{background:"none",border:"1px solid #E8E8E8",color:"#C7C7CC",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",padding:"6px 14px",borderRadius:20}}>I don't know</button>
                <button onClick={function(){setSnoozeUntil(new Date(Date.now()+15*60*1000));}} style={{background:"none",border:"none",color:"#C7C7CC",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,textDecoration:"underline",padding:0}}>Switch to MC</button>
              </div>
            </div>
          )}

          {/* Result feedback */}
          {result&&(
            <div style={{marginTop:14}}>
              {/* Result banner with animated icon */}
              <div style={{borderRadius:14,padding:"12px 14px",marginBottom:10,backgroundColor:result.correct?"#EDFAF3":result.wasClose?"#FFFBF0":"#FFF1F2",border:"1.5px solid "+(result.correct?"#6EE7B7":result.wasClose?"#FCD34D":"#FECACA"),display:"flex",alignItems:"center",gap:12,animation:(result.correct?"correctGlow":"wrongGlow")+" 0.7s ease, risePop 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}>
                <div style={{width:38,height:38,borderRadius:"50%",backgroundColor:result.correct?"#19A85A":result.wasClose?"#F59E0B":"#EF4444",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,animation:"badgeBounce 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.05s both"}}>
                  <span style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1}}>{result.correct?"✓":result.wasClose?"≈":"✕"}</span>
                </div>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontSize:16,fontWeight:900,color:result.correct?"#19A85A":result.wasClose?"#D97706":"#EF4444",letterSpacing:-0.2}}>{resLabel}</p>
                  {isType&&result.userAnswer&&<p style={{margin:"2px 0 0",fontSize:12,color:"#8E8E93"}}>You typed: "{result.userAnswer}"</p>}
                </div>
                {result.correct&&correctStreak>=3&&(
                  <div style={{flexShrink:0,backgroundColor:"#19A85A",borderRadius:14,padding:"4px 10px",animation:"streakPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.15s both"}}>
                    <p style={{margin:0,fontSize:13,fontWeight:900,color:"#fff",lineHeight:1}}>🔥{correctStreak}</p>
                  </div>
                )}
              </div>
              {/* Pronunciation */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:q.word.notes||q.word.example?8:0}}>
                <span style={{fontSize:12,fontWeight:700,color:"#8E8E93",backgroundColor:"#F2F2F7",padding:"4px 12px",borderRadius:20}}>{q.word.pronunciation}</span>
                {q.word.notes&&<button onClick={function(){setShowNote(function(n){return !n;});}} style={{background:showNote?"#EDFAF3":"#F2F2F7",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,color:showNote?"#19A85A":"#8E8E93",padding:"4px 12px",borderRadius:20,fontFamily:"inherit"}}>ⓘ Note</button>}
              </div>
              {showNote&&q.word.notes&&<p style={{margin:"0 0 8px",fontSize:12,color:"#555",lineHeight:1.65,backgroundColor:"#F9F9F9",borderRadius:10,padding:"8px 12px"}}>{q.word.notes}</p>}
              {q.word.example&&q.word.example.basque&&(
                <div style={{backgroundColor:"#F2F2F7",borderRadius:12,padding:"10px 12px",borderLeft:"3px solid "+lc}}>
                  <p style={{margin:0,fontSize:13,fontWeight:800,color:"#1A1A1A"}}>{q.word.example.basque}</p>
                  <p style={{margin:"3px 0 0",fontSize:12,color:"#8E8E93",fontStyle:"italic"}}>{q.word.example.english}</p>
                </div>
              )}
              {isFB&&<p style={{margin:"8px 0 0",fontSize:13,fontWeight:700,color:"#1A1A1A"}}>{q.word.english}</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── MC options (before answer) ── */}
      {isAnyMC&&!result&&opts.map(function(opt,i){var s=sel===opt;return(
        <button key={i} style={{display:"flex",alignItems:"center",gap:12,border:"2px solid "+(s?lc:"#E8E8E8"),borderRadius:16,padding:"15px 16px",cursor:"pointer",backgroundColor:s?"#fff":"#fff",width:"100%",textAlign:"left",fontFamily:"inherit",boxShadow:s?"0 3px 0 "+ld:"0 2px 0 #E0E0E0",transition:"all 0.12s",transform:s?"translateY(-1px)":"none"}} onClick={function(){if(!result){haptic("light");setSel(opt);submit(opt);}}}>
          <span style={{fontSize:12,fontWeight:900,color:s?"#fff":"#C7C7CC",width:28,height:28,borderRadius:"50%",backgroundColor:s?lc:"#F2F2F7",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.12s"}}>{String.fromCharCode(65+i)}</span>
          <span style={{flex:1,fontSize:15,fontWeight:s?800:500,color:"#1A1A1A",wordBreak:"break-word",lineHeight:1.3}}>{opt}</span>
        </button>
      );})}

      {/* ── MC options (after answer) ── */}
      {isAnyMC&&result&&opts.map(function(opt,i){var isC=opt===snoozeCorrect,isW=opt===sel&&!result.correct;return(
        <div key={i} style={{display:"flex",alignItems:"center",gap:12,border:"2px solid "+(isC?"#19A85A":isW?"#EF4444":"#E8E8E8"),borderRadius:14,padding:"13px 16px",backgroundColor:isC?"#EDFAF3":isW?"#FFF1F2":"#F9FAFB",transition:"all 0.2s",transform:isC?"scale(1.015)":"scale(1)"}}>
          <span style={{fontSize:12,fontWeight:900,color:isC?"#fff":isW?"#EF4444":"#D1D1D6",width:28,height:28,borderRadius:"50%",backgroundColor:isC?"#19A85A":"transparent",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{String.fromCharCode(65+i)}</span>
          <span style={{flex:1,fontSize:15,color:isC?"#19A85A":isW?"#EF4444":"#C7C7CC",fontWeight:isC||isW?800:400}}>{opt}</span>
          {isC&&<span style={{color:"#19A85A",fontWeight:900,fontSize:20,animation:"badgeBounce 0.4s cubic-bezier(0.34,1.56,0.64,1) both"}}>✓</span>}
          {isW&&<span style={{color:"#EF4444",fontWeight:900,fontSize:20,animation:"badgeBounce 0.4s cubic-bezier(0.34,1.56,0.64,1) both"}}>✗</span>}
        </div>
      );})}

      {/* Running score */}
      {!result&&isAnyMC&&doneCount>0&&(
        <p style={{textAlign:"center",fontSize:12,color:"#C7C7CC",fontWeight:700,margin:0}}>{correctCount} of {doneCount} correct so far</p>
      )}

    </div>

    {/* ── Streak milestone burst ── */}
    {burst==="streak"&&correctStreak>0&&correctStreak%5===0&&(
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:90,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{animation:"streakPop 0.5s cubic-bezier(0.34,1.56,0.64,1)",backgroundColor:"rgba(25,168,90,0.95)",borderRadius:24,padding:"18px 28px",boxShadow:"0 12px 40px rgba(25,168,90,0.4)",textAlign:"center"}}>
          <p style={{margin:0,fontSize:40,lineHeight:1}}>🔥</p>
          <p style={{margin:"6px 0 0",fontSize:22,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>{correctStreak} in a row!</p>
          <p style={{margin:"2px 0 0",fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.85)"}}>You're on fire</p>
        </div>
        {[0,1,2,3,4,5].map(function(si){var angle=si*60;var dist=90;var x=Math.cos(angle*Math.PI/180)*dist;var y=Math.sin(angle*Math.PI/180)*dist;return(
          <span key={si} style={{position:"absolute",left:"calc(50% + "+x+"px)",top:"calc(50% + "+y+"px)",fontSize:24,animation:"sparkle 0.7s ease "+(si*0.05)+"s both"}}>✨</span>
        );})}
      </div>
    )}

    {/* ── Bottom action bar ── */}
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,backgroundColor:"#fff",borderTop:"1px solid #E8E8EE",padding:"12px 14px calc(20px + env(safe-area-inset-bottom, 0px))",boxShadow:"0 -4px 20px rgba(0,0,0,0.07)"}}>
      {!result?(
        isAnyMC?(
          <p style={{textAlign:"center",fontSize:12,color:"#C7C7CC",fontWeight:700,margin:0}}>
            {doneCount>0?correctCount+" of "+doneCount+" correct":"Tap an answer above"}
          </p>
        ):(
          <button style={{width:"100%",border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:900,cursor:ready?"pointer":"default",background:ready?"linear-gradient(135deg,"+ld+","+lc+")":"#F2F2F7",color:ready?"#fff":"#C7C7CC",fontFamily:"inherit",boxShadow:ready?"0 4px 0 "+ld:"none",transition:"all 0.15s",letterSpacing:-0.2}} onClick={function(){if(typed.trim())submit(typed);}}>Check</button>
        )
      ):(
        <button style={{width:"100%",border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:900,cursor:"pointer",background:result.correct?"linear-gradient(135deg,#0E7A40,#19A85A)":result.wasClose?"linear-gradient(135deg,#B45309,#F59E0B)":"linear-gradient(135deg,"+ld+","+lc+")",color:"#fff",fontFamily:"inherit",boxShadow:"0 4px 0 "+(result.correct?"#0B5C30":result.wasClose?"#92400E":ld),letterSpacing:-0.2,animation:"risePop 0.3s cubic-bezier(0.34,1.56,0.64,1)"}} onClick={function(){advance();}}>
          {idx+1>=questions.length?"See results 🎉":result.correct?"Nice! Continue →":"Continue →"}
        </button>
      )}
    </div>

    {/* ── Exit confirm ── */}
    {confirmExit&&(
      <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"0 24px"}}>
        <div style={{backgroundColor:"#fff",borderRadius:24,padding:"28px 24px",width:"100%",maxWidth:360,textAlign:"center"}}>
          <p style={{margin:"0 0 6px",fontSize:16,fontWeight:800,color:"#1A1A1A"}}>Leave this quiz?</p>
          <p style={{margin:"0 0 20px",fontSize:13,color:"#8E8E93"}}>{latest.current.length} of {questions.length} answered</p>
          <button style={{width:"100%",border:"none",borderRadius:14,padding:"14px",fontSize:14,fontWeight:900,cursor:"pointer",background:"linear-gradient(135deg,"+ld+","+lc+")",color:"#fff",fontFamily:"inherit",boxShadow:"0 4px 0 "+ld,marginBottom:10}} onClick={function(){setConfirmExit(false);}}>Keep going →</button>
          <button style={{width:"100%",backgroundColor:"#fff",color:"#EF4444",border:"1.5px solid #FECACA",borderRadius:14,padding:"13px",fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700,marginBottom:latest.current.length>0?8:0}} onClick={function(){onExit();}}>Leave quiz</button>
          {latest.current.length>0&&<button style={{width:"100%",backgroundColor:"transparent",border:"none",color:lc,borderRadius:14,padding:"8px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}} onClick={function(){onFinish(latest.current);}}>See score so far →</button>}
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
  var trendChart=sessionHistory.length>2&&last7.length>0?React.createElement("div",{style:{backgroundColor:"#fff",borderRadius:14,padding:"12px 14px",border:"1px solid #F0F0F0",marginBottom:10}},React.createElement("p",{style:{margin:"0 0 8px",fontSize:11,fontWeight:800,color:"#888",textTransform:"uppercase",letterSpacing:0.5}},"Last "+last7.length+" sessions"),React.createElement("div",{style:{display:"flex",alignItems:"flex-end",gap:4,height:56}},last7.map(function(s,i){var h=Math.max(4,Math.round(((s.acc||0)/100)*56));var isLast=i===last7.length-1;return React.createElement("div",{key:i,style:{flex:1,height:h,borderRadius:3,backgroundColor:isLast?"#19A85A":(s.acc||0)>=80?"#74C69D":(s.acc||0)>=60?"#F59E0B":"#FFAAB4",transition:"height 0.5s ease",transitionDelay:(i*50)+"ms"}});})),React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginTop:4}},React.createElement("p",{style:{margin:0,fontSize:10,color:"#BBB"}},"Oldest"),React.createElement("p",{style:{margin:0,fontSize:10,color:"#19A85A",fontWeight:700}},"Today "+(last7[last7.length-1]?last7[last7.length-1].acc:0)+"%"))):null;
  var masteredCount=srsStats?srsStats.mastered:0;
  var milestones=[25,50,100,200,500];
  var hitMilestone=milestones.find(function(m){return masteredCount>=m&&masteredCount-score.correct<m;});
  var bestAcc=sessionHistory.length>1?Math.max.apply(null,sessionHistory.slice(0,sessionHistory.length-1).map(function(s){return s.acc||s.accuracy||0;})):0;
  var isPersonalBest=acc>0&&acc>=80&&acc>bestAcc&&sessionHistory.length>1;
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
      {hitMilestone&&(
        <div style={{backgroundColor:"#EDFAF3",borderRadius:14,padding:"12px 16px",marginBottom:12,border:"1px solid #C6EFD8",textAlign:"center"}}>
          <p style={{margin:"0 0 2px",fontSize:20}}>🏆</p>
          <p style={{margin:"0 0 2px",fontSize:15,fontWeight:900,color:"#19A85A"}}>{hitMilestone} words mastered!</p>
          <p style={{margin:0,fontSize:12,color:"#3D9970"}}>Amazing milestone. Keep it up!</p>
        </div>
      )}
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
      <div style={{display:"flex",gap:10,marginTop:16}}>
        {isPro&&(score.genuinelyWrong>0||score.closeButWrong>0)?(
          <button style={{flex:2,backgroundColor:"#19A85A",color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 0 #0E7A40"}} onClick={function(){onRetry(score.missedWords.concat(score.closeWords).map(function(w){return w.id;}).filter(function(v,i,a){return a.indexOf(v)===i;}));}}>
            Try again ({score.missedWords.length+score.closeWords.length})
          </button>
        ):(!isPro&&(score.genuinelyWrong>0||score.closeButWrong>0))?(
          <button style={{flex:1,backgroundColor:"#fff",color:"#333",border:"1.5px solid #E8E8E8",borderRadius:14,padding:"14px",fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 3px 0 #CCC"}} onClick={function(){onUpgrade&&onUpgrade();}}>Upgrade</button>
        ):null}
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
    window.storage.set("today_count_"+new Date().toISOString().slice(0,10),"0").catch(function(){});
    window.storage.set("streak_freeze","").catch(function(){});
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
  },[query,filterLvl,filterTopic,isPro,sortBy,srsData,_VOCAB.length]);
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
  var onSubscribe=props.onSubscribe,onContinueFree=props.onContinueFree,onStart=props.onStart,onTrial=props.onTrial,trialAvailable=props.trialAvailable,trialDays=props.trialDays||7,vocabCount=props.vocabCount||816;
  var _s0=useState("annual");var sel=_s0[0];var setSel=_s0[1];
  var plans={
    lifetime:{price:"$49.99",period:"one-time",perMonth:"Best value",save:"Pay once, own forever"},
    annual:{price:"$29.99",period:"/year",perMonth:"$2.50/mo",save:"Save 50%"},
    monthly:{price:"$4.99",period:"/month",perMonth:null,save:null}
  };
  var features=[
    {label:"Full A1 plus A2, B1 and B2 levels",sub:"500+ more words across all topics and levels"},
    {label:"Retry Missed Words",sub:"Drill your weakest words until they stick"},
    {label:"Cumulative mode",sub:"Mix lower levels into any session"},
    {label:"All levels SRS tracking",sub:"Word memory across A2, B1 and B2 words too"},
    {label:"Memory Pairs game, all topics",sub:"Play all 14 topic categories"},
    {label:"No ads, ever",sub:"Clean focused learning with no interruptions"},
  ];
  return(
    <div style={{maxWidth:420,margin:"0 auto",backgroundColor:"#F8F7F5",minHeight:"100vh",display:"flex",flexDirection:"column",animation:"fadeIn 0.2s ease"}}>
      <div style={{background:"linear-gradient(160deg,#064E3B 0%,#065F46 30%,#19A85A 100%)",padding:"36px 24px 0",textAlign:"center",flexShrink:0,position:"relative"}}>
        <button onClick={onContinueFree} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:16,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>x</button>
        <Logo size={44}/>
        <h1 style={{margin:"14px 0 4px",fontSize:30,fontWeight:900,color:"#fff",letterSpacing:-0.8,lineHeight:1.1}}>Ikasi Pro</h1>
        <p style={{margin:"0 0 0",fontSize:14,color:"rgba(255,255,255,0.85)",fontWeight:500}}>Unlock the full Basque experience</p><div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:12,flexWrap:"wrap"}}>
          {[vocabCount+" words","14 topics","A1 to B2","Spaced repetition"].map(function(s){return(
            <span key={s} style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.9)",backgroundColor:"rgba(255,255,255,0.15)",padding:"4px 10px",borderRadius:20}}>{s}</span>
          );})}
        </div>
        <svg viewBox="0 0 420 40" style={{display:"block",width:"calc(100% + 48px)",height:32,marginTop:20,marginLeft:-24}} preserveAspectRatio="none">
          <path d="M0,20 C80,40 200,0 300,25 C370,40 400,15 420,20 L420,40 L0,40 Z" fill="#F6F6F6"/>
        </svg>
      </div>
      <div style={{flex:1,padding:"4px 20px calc(40px + env(safe-area-inset-bottom, 0px))",overflowY:"auto"}}>

        {/* ── Plan selector ── */}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {Object.keys(plans).map(function(key){var p=plans[key];var active=sel===key;var k=key;return(
            <button key={key} onClick={function(){setSel(k);}}
              style={{flex:key==="monthly"?0.7:1,padding:"14px 8px",borderRadius:18,border:"2px solid",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.15s",borderColor:active?"#19A85A":"#E8E8E8",backgroundColor:active?"#F0FBF4":"#fff",boxShadow:active?"0 0 0 3px rgba(25,168,90,0.15)":"none",position:"relative"}}>
              {key==="lifetime"&&<span style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",fontSize:9,fontWeight:900,color:"#fff",backgroundColor:"#F97316",padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap",letterSpacing:0.3}}>⭐ BEST VALUE</span>}
              {key==="annual"&&<span style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",fontSize:9,fontWeight:800,color:"#fff",backgroundColor:"#19A85A",padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap",letterSpacing:0.3}}>POPULAR</span>}
              <p style={{margin:"0 0 1px",fontSize:key==="lifetime"?20:20,fontWeight:900,color:active?"#19A85A":"#1A1A1A"}}>{p.price}</p>
              <p style={{margin:"0 0 2px",fontSize:10,color:"#888",fontWeight:600}}>{p.period}</p>
              {p.perMonth&&<p style={{margin:0,fontSize:9,color:active?"#19A85A":"#AAA",fontWeight:700}}>{p.perMonth}</p>}
            </button>
          );})}
        </div>

        {/* ── Lifetime callout ── */}
        {sel==="lifetime"&&(
          <div style={{backgroundColor:"#FFF7ED",borderRadius:14,padding:"12px 14px",marginBottom:16,border:"1.5px solid #FED7AA",display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:20,flexShrink:0}}>⭐</span>
            <div>
              <p style={{margin:"0 0 2px",fontSize:13,fontWeight:800,color:"#92400E"}}>Pay once, use forever</p>
              <p style={{margin:0,fontSize:11,color:"#B45309",fontWeight:500}}>All future vocabulary updates included. No subscription, no recurring charges.</p>
            </div>
          </div>
        )}

        {/* ── Feature list ── */}
        <div style={{backgroundColor:"#fff",borderRadius:18,border:"1px solid #E8E8E8",marginBottom:20,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
          {features.map(function(f,i){return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderBottom:i<features.length-1?"1px solid #F4F4F4":"none"}}>
              <span style={{fontSize:13,fontWeight:900,color:"#fff",backgroundColor:"#19A85A",width:20,height:20,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</span>
              <div>
                <p style={{margin:0,fontSize:14,fontWeight:700,color:"#1A1A1A"}}>{f.label}</p>
                <p style={{margin:0,fontSize:12,color:"#888",fontWeight:500}}>{f.sub}</p>
              </div>
            </div>
          );})}
        </div>

        {/* ── CTA buttons ── */}
        {trialAvailable&&sel!=="lifetime"&&(
          <button style={{width:"100%",border:"none",borderRadius:18,padding:"17px",fontSize:17,fontWeight:900,color:"#fff",cursor:"pointer",backgroundColor:"#19A85A",boxShadow:"0 5px 0 #0E7A40",fontFamily:"inherit",marginBottom:10}} onClick={onTrial}>
            Try Pro free for {trialDays} days
          </button>
        )}
        <button style={{width:"100%",border:"none",borderRadius:18,padding:trialAvailable&&sel!=="lifetime"?"13px":"17px",fontSize:trialAvailable&&sel!=="lifetime"?14:17,fontWeight:900,color:"#fff",cursor:"pointer",backgroundColor:sel==="lifetime"?"#F97316":trialAvailable?"#0E7A40":"#19A85A",boxShadow:sel==="lifetime"?"0 5px 0 #C2510E":trialAvailable?"0 3px 0 #0A5C30":"0 5px 0 #0E7A40",fontFamily:"inherit",marginBottom:12}} onClick={onStart}>
          {sel==="lifetime"?"Buy Lifetime: $49.99":trialAvailable?"Then ":""}
          {sel!=="lifetime"&&("Subscribe: "+plans[sel].price+plans[sel].period)}
        </button>
        <button style={{width:"100%",backgroundColor:"transparent",border:"none",color:"#888",fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:"10px",fontWeight:500}} onClick={onContinueFree}>
          Continue with free A1 words
        </button>
        <button style={{width:"100%",backgroundColor:"transparent",border:"none",color:"#BBB",fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:"6px"}} onClick={onSubscribe}>
          Restore purchases
        </button>
        <p style={{textAlign:"center",fontSize:11,color:"#BBB",margin:"8px 0 0",lineHeight:1.5}}>
          {sel==="lifetime"?"One-time purchase. All future content included.":"49 words always free. Pro unlocks everything. Cancel anytime."}
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
function PairsScreen(props){
  var VOCABULARY=_VOCAB;
  var onBack=props.onBack,isPro=props.isPro,onUpgrade=props.onUpgrade;
  var TOPICS_LIST=['greetings','food','numbers','family','colors','nature','body','time','travel','emotions','work','culture','society','adjectives'];
  var SIZES=[{key:'small',label:'Easy',pairs:4,timedSecs:90},{key:'medium',label:'Medium',pairs:6,timedSecs:60},{key:'large',label:'Hard',pairs:8,timedSecs:45}];
  var _t=useState('greetings');var topic=_t[0];var setTopic=_t[1];
  var _sz=useState('medium');var size=_sz[0];var setSize=_sz[1];
  var _mode=useState('classic');var mode=_mode[0];var setMode=_mode[1];
  var _f=useState([]);var flipped=_f[0];var setFlipped=_f[1];
  var _m=useState([]);var matched=_m[0];var setMatched=_m[1];
  var _mv=useState(0);var moves=_mv[0];var setMoves=_mv[1];
  var _cards=useState([]);var cards=_cards[0];var setCards=_cards[1];
  var _locked=useState(false);var locked=_locked[0];var setLocked=_locked[1];
  var _won=useState(false);var won=_won[0];var setWon=_won[1];
  var _failed=useState(false);var failed=_failed[0];var setFailed=_failed[1];
  var _secs=useState(0);var secs=_secs[0];var setSecs=_secs[1];
  var _started=useState(false);var started=_started[0];var setStarted=_started[1];
  var _pc=useState(6);var pairCount=_pc[0];var setPairCount=_pc[1];
  var _finalSecs=useState(0);var finalSecs=_finalSecs[0];var setFinalSecs=_finalSecs[1];
  var _bestMoves=useState(0);var bestMoves=_bestMoves[0];var setBestMoves=_bestMoves[1];
  var _bestTime=useState(0);var bestTime=_bestTime[0];var setBestTime=_bestTime[1];
  var _mismatch=useState(false);var mismatch=_mismatch[0];var setMismatch=_mismatch[1];
  var _newBest=useState(false);var newBest=_newBest[0];var setNewBest=_newBest[1];
  var _penalty=useState(false);var penalty=_penalty[0];var setPenalty=_penalty[1];
  var timerRef=React.useRef(null);
  var chipRowRef=React.useRef(null);
  var boardKey=React.useRef(0);
  var secsRef=React.useRef(0); // track secs without stale closure in timed mode

  var sizeCfg=SIZES.find(function(s){return s.key===size;})||SIZES[1];
  var isTimed=mode==='timed';

  React.useEffect(function(){
    var key='pairs_best_'+topic+'_'+size+(isTimed?'_timed':'');
    try{window.storage.get(key).then(function(r){
      if(r&&r.value){var d=JSON.parse(r.value);setBestMoves(d.moves||0);setBestTime(d.time||0);}
      else{setBestMoves(0);setBestTime(0);}
    }).catch(function(){});}catch(e){}
  },[topic,size,mode]);

  React.useEffect(function(){
    if(chipRowRef.current){
      var active=chipRowRef.current.querySelector('[data-active="true"]');
      if(active)active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    }
  },[topic]);

  function buildGame(){
    clearInterval(timerRef.current);
    var pool=VOCABULARY.filter(function(w){
      if(w.topic!==topic)return false;
      if(!isPro&&!(w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)!==-1))return false;
      return true;
    });
    if(pool.length<4){pool=VOCABULARY.filter(function(w){return w.topic===topic&&w.cefr==="A1";});}
    var n=Math.min(sizeCfg.pairs,pool.length);
    var chosen=shuffled(pool).slice(0,n);
    var pc=chosen.length;
    var pairs=shuffled(
      chosen.map(function(w,i){return{uid:i,type:'basque',text:w.basque,pair:i};}).concat(
      chosen.map(function(w,i){return{uid:i+pc,type:'english',text:w.english,pair:i};}))
    );
    var initSecs=isTimed?sizeCfg.timedSecs:0;
    secsRef.current=initSecs;
    setCards(pairs);setFlipped([]);setMatched([]);setMoves(0);setLocked(false);
    setWon(false);setFailed(false);setSecs(initSecs);setFinalSecs(0);setStarted(false);
    setPairCount(pc);setMismatch(false);setNewBest(false);setPenalty(false);
    boardKey.current=boardKey.current+1;
  }

  var vocabVer=_VOCAB.length;
  React.useEffect(function(){buildGame();},[topic,size,mode,vocabVer]);

  function startTimer(){
    clearInterval(timerRef.current);
    if(isTimed){
      timerRef.current=setInterval(function(){
        secsRef.current=secsRef.current-1;
        setSecs(secsRef.current);
        if(secsRef.current<=0){
          clearInterval(timerRef.current);
          setFailed(true);sfx("fail");
        }
      },1000);
    }else{
      timerRef.current=setInterval(function(){
        secsRef.current=secsRef.current+1;
        setSecs(secsRef.current);
      },1000);
    }
  }

  function onFlip(idx){
    if(locked||won||failed)return;
    var card=cards[idx];
    if(matched.indexOf(card.pair)!==-1)return;
    if(flipped.length===1&&flipped[0]===idx)return;
    if(flipped.length===2)return;
    if(!started){
      setStarted(true);
      startTimer();
    }
    var newFlipped=flipped.concat([idx]);
    setFlipped(newFlipped);
    sfx("flip");
    if(newFlipped.length===2){
      var a=cards[newFlipped[0]],b=cards[newFlipped[1]];
      setMoves(function(m){return m+1;});
      setLocked(true);
      if(a.pair===b.pair&&a.type!==b.type){
        haptic("success");sfx("correct");
        setTimeout(function(){
          setMatched(function(prev){
            var newMatched=prev.concat([a.pair]);
            if(newMatched.length===pairCount){
              clearInterval(timerRef.current);
              var elapsed=isTimed?sizeCfg.timedSecs-secsRef.current:secsRef.current;
              setFinalSecs(elapsed);setWon(true);
              haptic("success");sfx("complete");
              setMoves(function(mv){
                setBestMoves(function(bm){
                  setBestTime(function(bt){
                    var isFirst=bm===0&&bt===0;
                    var betterMoves=bm===0||mv<bm;
                    var betterTime=bt===0||elapsed<bt;
                    if(isFirst||betterMoves||betterTime){
                      var newBm=betterMoves?mv:(bm||mv);
                      var newBt=betterTime?elapsed:(bt||elapsed);
                      var key='pairs_best_'+topic+'_'+size+(isTimed?'_timed':'');
                      try{window.storage.set(key,JSON.stringify({moves:newBm,time:newBt})).catch(function(){});}catch(e){}
                      setBestMoves(newBm);setNewBest(true);return newBt;
                    }
                    return bt;
                  });
                  return bm;
                });
                return mv;
              });
            }
            return newMatched;
          });
          setFlipped([]);setLocked(false);
        },400);
      }else{
        haptic("error");sfx("wrong");
        setMismatch(true);
        // Timed mode penalty: -5 seconds
        if(isTimed){
          setPenalty(true);
          secsRef.current=Math.max(1,secsRef.current-5);
          setSecs(secsRef.current);
          setTimeout(function(){setPenalty(false);},600);
        }
        setTimeout(function(){setMismatch(false);setFlipped([]);setLocked(false);},600);
      }
    }
  }

  React.useEffect(function(){return function(){clearInterval(timerRef.current);};},[]);

  var _showSettings=useState(false);var showSettings=_showSettings[0];var setShowSettings=_showSettings[1];

  // Display values
  var displaySecs=isTimed?secs:secs;
  var mins=Math.floor(displaySecs/60);var ss=('0'+(displaySecs%60)).slice(-2);
  var timeStr=mins>0?mins+'m '+ss+'s':displaySecs+'s';
  var fmins=Math.floor(finalSecs/60);var fss=('0'+(finalSecs%60)).slice(-2);
  var finalTimeStr=fmins>0?fmins+'m '+fss+'s':finalSecs+'s';
  var cols=sizeCfg.pairs<=4?'repeat(2,1fr)':sizeCfg.pairs<=6?'repeat(3,1fr)':'repeat(4,1fr)';
  var accuracy=moves>0?Math.round((matched.length/moves)*100):100;
  var waitingForSecond=flipped.length===1&&!locked;
  var timerDanger=isTimed&&secs<=10&&started;
  var timerColor=timerDanger?"#EF4444":"#19A85A";
  var timerPct=isTimed?(secs/sizeCfg.timedSecs*100):100;

  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",backgroundColor:"#F2F2F7",fontFamily:"Nunito,system-ui,sans-serif"}}>

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:56,paddingLeft:14,paddingRight:14,paddingBottom:10,backgroundColor:"#fff",borderBottom:"1px solid "+("#F0F0F0"),}}>
        <button onClick={onBack} style={{background:"#F2F2F7",border:"none",color:"#555",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
        <div style={{flex:1}}>
          <p style={{margin:0,fontSize:15,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.3}}>🃏 Memory Pairs</p>
          <p style={{margin:0,fontSize:10,color:"#AAA",fontWeight:600,textTransform:"capitalize"}}>
            {started&&moves>0?accuracy+"% · "+matched.length+"/"+pairCount+" matched":topic+" · "+sizeCfg.label}
          </p>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          <div style={{backgroundColor:"#F2F2F7",borderRadius:12,padding:"4px 10px",textAlign:"center"}}>
            <p style={{margin:0,fontSize:15,fontWeight:900,color:"#1A1A1A",lineHeight:1}}>{moves}</p>
            <p style={{margin:0,fontSize:8,color:"#AAA",fontWeight:700}}>MOVES</p>
          </div>
          <div style={{backgroundColor:timerDanger?"#FEF2F2":started?"#EDFAF3":"#F2F2F7",borderRadius:12,padding:"4px 10px",textAlign:"center",border:timerDanger?"1px solid #FCA5A5":started?"1px solid #BBF7D0":"none",transition:"all 0.3s"}}>
            <p style={{margin:0,fontSize:15,fontWeight:900,color:timerDanger?"#EF4444":started?"#19A85A":"#CCC",lineHeight:1,animation:timerDanger?"waitingDot 0.5s ease-in-out infinite":"none"}}>{started?timeStr:(isTimed?sizeCfg.timedSecs+"s":"--")}</p>
            <p style={{margin:0,fontSize:8,color:"#AAA",fontWeight:700}}>{isTimed?"LEFT":"TIME"}</p>
          </div>
          <button onClick={function(){setShowSettings(true);}} style={{background:"#F2F2F7",border:"none",color:"#888",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⚙️</button>
        </div>
      </div>

      {/* ── Progress / Timer bar ── */}
      {isTimed&&started?(
        <div style={{height:4,backgroundColor:"#F0F0F0"}}>
          <div style={{height:"100%",backgroundColor:timerColor,width:timerPct+"%",transition:"width 1s linear, background-color 0.3s",borderRadius:"0 2px 2px 0",boxShadow:timerDanger?"0 0 8px rgba(239,68,68,0.5)":"none"}}/>
        </div>
      ):(
        <div style={{height:3,backgroundColor:"#E8E8EE"}}>
          <div style={{height:"100%",backgroundColor:"#19A85A",width:(matched.length/pairCount*100)+"%",transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)",borderRadius:"0 2px 2px 0"}}/>
        </div>
      )}

      {/* ── Topic scroll — hide during active game ── */}
      {!started&&(
        <div ref={chipRowRef} style={{display:"flex",gap:5,overflowX:"auto",padding:"8px 14px",WebkitOverflowScrolling:"touch",backgroundColor:"#fff",borderBottom:"1px solid #F0F0F0"}}>
          {TOPICS_LIST.map(function(t){
            var active=t===topic;var isFree=isPro||(FREE_TOPICS.indexOf(t)!==-1);
            return(
              <button key={t} data-active={active?"true":"false"} onClick={function(){if(!isFree){onUpgrade();return;}setTopic(t);}}
                style={{flexShrink:0,fontSize:11,padding:"4px 11px",borderRadius:20,border:"1.5px solid "+(active?"#19A85A":"#E8E8E8"),backgroundColor:active?"#19A85A":"#fff",color:active?"#fff":isFree?"#555":"#CCC",cursor:"pointer",fontWeight:700,fontFamily:"inherit",transition:"all 0.15s"}}>
                {!isFree?"🔒 ":""}{t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            );
          })}
        </div>
      )}

      <div style={{padding:"10px 12px 0",backgroundColor:"transparent"}}>
        {/* Timed mode penalty flash */}
        {penalty&&(
          <div style={{textAlign:"center",marginBottom:8,animation:"popIn 0.2s ease"}}>
            <span style={{fontSize:13,fontWeight:900,color:"#EF4444",backgroundColor:"#FEF2F2",padding:"4px 14px",borderRadius:20,border:"1px solid #FECACA"}}>⏱️ -5 seconds!</span>
          </div>
        )}
        {/* Timed mode badge */}
        {isTimed&&!started&&(
          <div style={{textAlign:"center",marginBottom:8}}>
            <span style={{fontSize:11,fontWeight:800,color:"#EF4444",backgroundColor:"#FEF2F2",padding:"4px 14px",borderRadius:20,border:"1px solid #FECACA"}}>⏱️ Timed · {sizeCfg.timedSecs}s · -5s per mismatch</span>
          </div>
        )}

        {/* ── Card grid ── */}
        <div key={boardKey.current} style={{display:"grid",gridTemplateColumns:cols,gap:sizeCfg.pairs<=4?12:sizeCfg.pairs<=6?9:7,paddingBottom:10}}>
          {cards.map(function(card,idx){
            var isFlipped=flipped.indexOf(idx)!==-1;
            var isMatched=matched.indexOf(card.pair)!==-1;
            var isMismatched=mismatch&&flipped.indexOf(idx)!==-1&&!isMatched;
            var isWaiting=waitingForSecond&&isFlipped;
            var show=isFlipped||isMatched;
            // Navy back, white front
            var bg=isMatched?"#EDFAF3":isMismatched?"#FEF2F2":show?"#fff":"#1E3A5F";
            var border=isMatched?"#19A85A":isWaiting?"#F97316":isMismatched?"#EF4444":show?"#E0E0E0":"#162D4A";
            var shadow=isMatched?"inset 0 0 0 1px rgba(25,168,90,0.2)":isMismatched?"0 0 0 3px rgba(239,68,68,0.15)":isWaiting?"0 0 0 3px rgba(249,115,22,0.2), 0 8px 20px rgba(30,58,95,0.3)":isFlipped?"0 8px 20px rgba(0,0,0,0.15)":"0 3px 10px rgba(30,58,95,0.25)";
            var fz=sizeCfg.pairs<=4?16:sizeCfg.pairs<=6?(card.text.length>14?8:card.text.length>10?10:card.text.length>7?12:14):(card.text.length>12?7:card.text.length>8?9:card.text.length>6?10:12);
            return(
              <div key={card.uid} onClick={function(){onFlip(idx);}}
                style={{
                  aspectRatio:sizeCfg.pairs<=4?"5/3":"1",
                  borderRadius:18,
                  cursor:isMatched?"default":show?"default":"pointer",
                  transition:"transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background-color 0.15s, box-shadow 0.2s, border-color 0.2s",
                  transform:isMatched?"scale(0.93)":isFlipped?"scale(1.06)":isMismatched?"scale(0.92)":"scale(1)",
                  backgroundColor:bg,border:"1.5px solid "+border,boxShadow:shadow,
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  padding:6,userSelect:"none",WebkitUserSelect:"none",position:"relative",overflow:"hidden",
                  animation:isWaiting?"waitingPulse 1.4s ease-in-out infinite":(!show&&!isMatched?("cardIn 0.3s cubic-bezier(0.34,1.56,0.64,1) "+(idx*0.04)+"s both"):undefined)
                }}>
                {/* Face-down: subtle card pattern */}
                {!show&&(
                  <React.Fragment>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,0.06) 0%,transparent 60%)"}}/>
                    <div style={{position:"absolute",inset:4,border:"1px solid rgba(255,255,255,0.15)",borderRadius:14}}/>
                  </React.Fragment>
                )}
                {isMatched&&<div style={{position:"absolute",top:5,right:6,width:16,height:16,borderRadius:"50%",backgroundColor:"#19A85A",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:9,color:"#fff",fontWeight:900,lineHeight:1}}>✓</span></div>}
                {isMismatched&&<div style={{position:"absolute",top:5,right:6,fontSize:12,color:"#EF4444",fontWeight:900}}>✗</div>}
                {isWaiting&&<div style={{position:"absolute",top:6,left:6,width:6,height:6,borderRadius:"50%",backgroundColor:"#F97316",animation:"waitingDot 1s ease-in-out infinite"}}/>}
                {show?(
                  <div style={{textAlign:"center",width:"100%",padding:"0 4px"}}>
                    <p style={{margin:0,fontSize:fz,fontWeight:800,color:isMatched?"#19A85A":isMismatched?"#EF4444":"#1A1A1A",lineHeight:1.3,wordBreak:"break-word"}}>{card.text}</p>
                    <div style={{marginTop:4,fontSize:7,fontWeight:900,letterSpacing:0.5,color:isMatched?"#19A85A":isMismatched?"#EF4444":card.type==='basque'?"#19A85A":"#888",backgroundColor:isMatched?"rgba(25,168,90,0.12)":isMismatched?"rgba(239,68,68,0.1)":card.type==='basque'?"#EDFAF3":"#F0F0F0",borderRadius:5,padding:"2px 5px",display:"inline-block"}}>{card.type==='basque'?'BASQUE':'ENGLISH'}</div>
                  </div>
                ):(
                  <p style={{margin:0,fontSize:sizeCfg.pairs<=4?36:sizeCfg.pairs<=6?28:22,fontWeight:900,color:"rgba(255,255,255,0.4)",position:"relative",zIndex:1}}>?</p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:28}}>
          {/* Pill track */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{display:"flex",gap:3}}>
              {Array.from({length:pairCount}).map(function(_,i){
                var done=i<matched.length;
                return <div key={i} style={{width:done?18:6,height:6,borderRadius:3,backgroundColor:done?"#19A85A":"#D1D1D6",transition:"all 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}/>;
              })}
            </div>
            <span style={{fontSize:11,fontWeight:700,color:"#8E8E93"}}>{matched.length}/{pairCount}</span>
          </div>
          <button onClick={function(){buildGame();}} style={{fontSize:12,color:"#8E8E93",fontWeight:700,background:"none",border:"1.5px solid "+("#D1D1D6"),borderRadius:20,padding:"5px 14px",cursor:"pointer",fontFamily:"inherit"}}>Shuffle ↺</button>
        </div>
      </div>

      {/* ── Failed overlay (timed mode) ── */}
      {failed&&(
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
          <div style={{backgroundColor:"#fff",borderTopLeftRadius:32,borderTopRightRadius:32,width:"100%",maxWidth:420,margin:"0 auto",paddingBottom:40}}>
            <div style={{width:36,height:4,backgroundColor:"#E0E0E0",borderRadius:2,margin:"12px auto 0"}}/>
            <div style={{padding:"20px 24px 0",textAlign:"center"}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#991B1B,#EF4444)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:34,boxShadow:"0 8px 24px rgba(239,68,68,0.3)"}}>⏰</div>
              <p style={{margin:"0 0 2px",fontSize:24,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5}}>Time's up!</p>
              <p style={{margin:"0 0 20px",fontSize:13,color:"#8E8E93"}}>{matched.length} of {pairCount} pairs matched · {sizeCfg.label}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                {[{v:matched.length+"/"+pairCount,l:"Matched",c:"#1A1A1A"},{v:moves,l:"Moves",c:"#F97316"}].map(function(s){return(
                  <div key={s.l} style={{backgroundColor:"#F2F2F7",borderRadius:14,padding:"12px 6px"}}>
                    <p style={{margin:0,fontSize:22,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</p>
                    <p style={{margin:"3px 0 0",fontSize:10,color:"#8E8E93",fontWeight:700}}>{s.l}</p>
                  </div>
                );})}
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={function(){buildGame();}} style={{flex:1,padding:"15px",borderRadius:18,border:"none",backgroundColor:"#EF4444",color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 0 #991B1B"}}>Try again</button>
                <button onClick={function(){setMode('classic');buildGame();}} style={{flex:1,padding:"15px",borderRadius:18,border:"2px solid #E8E8E8",backgroundColor:"#fff",color:"#555",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Classic mode</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Win overlay ── */}
      {won&&(
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={function(){buildGame();}}>
          <div style={{backgroundColor:"#fff",borderTopLeftRadius:32,borderTopRightRadius:32,width:"100%",maxWidth:420,margin:"0 auto",paddingBottom:40}} onClick={function(e){e.stopPropagation();}}>
            {/* Drag handle */}
            <div style={{width:36,height:4,backgroundColor:"#E0E0E0",borderRadius:2,margin:"12px auto 0"}}/>
            <div style={{padding:"20px 24px 0",textAlign:"center"}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:newBest?"linear-gradient(135deg,#F97316,#FBBF24)":"linear-gradient(135deg,#19A85A,#22C070)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:34,boxShadow:newBest?"0 8px 24px rgba(249,115,22,0.35)":"0 8px 24px rgba(25,168,90,0.3)"}}>{newBest?"⭐":"🎉"}</div>
              <p style={{margin:"0 0 2px",fontSize:24,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5}}>{newBest?"New personal best!":"All matched!"}</p>
              <p style={{margin:"0 0 20px",fontSize:13,color:"#8E8E93",fontWeight:600,textTransform:"capitalize"}}>{topic} · {sizeCfg.label}{isTimed?" · ⏱️ Timed":""}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
                {[{v:moves,l:"Moves",c:"#1A1A1A"},{v:finalTimeStr,l:isTimed?"Used":"Time",c:"#19A85A"},{v:accuracy+"%",l:"Accuracy",c:"#F97316"}].map(function(s){return(
                  <div key={s.l} style={{backgroundColor:"#F2F2F7",borderRadius:14,padding:"12px 8px"}}>
                    <p style={{margin:0,fontSize:22,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</p>
                    <p style={{margin:"3px 0 0",fontSize:10,color:"#8E8E93",fontWeight:700}}>{s.l}</p>
                  </div>
                );})}
              </div>
              {isTimed&&secs>0&&<div style={{backgroundColor:"#EDFAF3",borderRadius:12,padding:"9px 12px",marginBottom:12}}>
                <p style={{margin:0,fontSize:13,fontWeight:800,color:"#19A85A"}}>⏱️ {secs}s to spare!</p>
              </div>}
              {bestMoves>0&&<p style={{margin:"0 0 16px",fontSize:12,color:"#C7C7CC",fontWeight:600}}>Previous best: {bestMoves} moves · {bestTime}s</p>}
              <div style={{display:"flex",gap:10}}>
                <button onClick={function(){buildGame();}} style={{flex:1,padding:"15px",borderRadius:18,border:"none",backgroundColor:"#19A85A",color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 0 #0E7A40"}}>Play again</button>
                <button onClick={function(){var next=TOPICS_LIST[(TOPICS_LIST.indexOf(topic)+1)%TOPICS_LIST.length];var isFree=isPro||(FREE_TOPICS.indexOf(next)!==-1);if(isFree){setTopic(next);}else{onUpgrade();}}} style={{flex:1,padding:"15px",borderRadius:18,border:"2px solid #E8E8E8",backgroundColor:"#fff",color:"#555",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Next topic</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings sheet ── */}
      {showSettings&&(
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.4)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={function(){setShowSettings(false);}}>
          <div style={{backgroundColor:"#fff",borderTopLeftRadius:28,borderTopRightRadius:28,width:"100%",maxWidth:420,margin:"0 auto",paddingBottom:40}} onClick={function(e){e.stopPropagation();}}>
            <div style={{width:36,height:4,backgroundColor:"#E0E0E0",borderRadius:2,margin:"12px auto 16px"}}/>
            <div style={{padding:"0 20px"}}>
              <p style={{margin:"0 0 10px",fontSize:16,fontWeight:900,color:"#1A1A1A"}}>Mode</p>
              <div style={{display:"flex",gap:8,marginBottom:20}}>
                <button onClick={function(){setMode('classic');setShowSettings(false);}}
                  style={{flex:1,padding:"12px 8px",borderRadius:14,border:"2px solid "+(mode==='classic'?"#19A85A":"#E8E8E8"),backgroundColor:mode==='classic'?"#EDFAF3":"#F2F2F7",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                  <p style={{margin:0,fontSize:18}}>🃏</p>
                  <p style={{margin:"4px 0 0",fontSize:12,fontWeight:900,color:mode==='classic'?"#19A85A":"#555"}}>Classic</p>
                  <p style={{margin:"1px 0 0",fontSize:9,color:"#8E8E93"}}>No time limit</p>
                </button>
                <button onClick={function(){setMode('timed');setShowSettings(false);}}
                  style={{flex:1,padding:"12px 8px",borderRadius:14,border:"2px solid "+(mode==='timed'?"#EF4444":"#E8E8E8"),backgroundColor:mode==='timed'?"#FEF2F2":"#F2F2F7",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                  <p style={{margin:0,fontSize:18}}>⏱️</p>
                  <p style={{margin:"4px 0 0",fontSize:12,fontWeight:900,color:mode==='timed'?"#EF4444":"#555"}}>Timed</p>
                  <p style={{margin:"1px 0 0",fontSize:9,color:"#8E8E93"}}>Race the clock</p>
                </button>
              </div>
              <p style={{margin:"0 0 10px",fontSize:16,fontWeight:900,color:"#1A1A1A"}}>Difficulty</p>
              <div style={{display:"flex",gap:10,marginBottom:20}}>
                {SIZES.map(function(s){var act=s.key===size;return(
                  <button key={s.key} onClick={function(){setSize(s.key);setShowSettings(false);}}
                    style={{flex:1,padding:"14px 8px",borderRadius:16,border:"2px solid "+(act?"#19A85A":"#E8E8E8"),backgroundColor:act?"#EDFAF3":"#F2F2F7",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.15s"}}>
                    <p style={{margin:0,fontSize:20,fontWeight:900,color:act?"#19A85A":"#1A1A1A"}}>{s.pairs}</p>
                    <p style={{margin:"2px 0 0",fontSize:11,color:act?"#19A85A":"#8E8E93",fontWeight:700}}>{s.label}</p>
                    <p style={{margin:"1px 0 0",fontSize:9,color:"#C7C7CC",fontWeight:600}}>{isTimed?s.timedSecs+"s limit":"pairs"}</p>
                  </button>
                );})}
              </div>
              {bestMoves>0&&(
                <div style={{backgroundColor:"#F2F2F7",borderRadius:14,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:"#8E8E93",fontWeight:600,textTransform:"capitalize"}}>{topic} · {sizeCfg.label}</span>
                  <span style={{fontSize:12,color:"#19A85A",fontWeight:800}}>{bestMoves} moves · {bestTime}s</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function GamesScreen(props){
  var onBack=props.onBack,onPairs=props.onPairs,onTap=props.onTap,onTxoko=props.onTxoko,onOrdutegi=props.onOrdutegi,onKoloreak=props.onKoloreak,onArbola=props.onArbola,isPro=props.isPro;
  var _pairsBest=useState(null);var pairsBest=_pairsBest[0];var setPairsBest=_pairsBest[1];
  var _tapBest=useState(null);var tapBest=_tapBest[0];var setTapBest=_tapBest[1];
  var _txokoBest=useState(null);var txokoBest=_txokoBest[0];var setTxokoBest=_txokoBest[1];
  var _ordBest=useState(null);var ordBest=_ordBest[0];var setOrdBest=_ordBest[1];
  var _kolBest=useState(null);var kolBest=_kolBest[0];var setKolBest=_kolBest[1];
  var _arbolaBest=useState(null);var arbolaBest=_arbolaBest[0];var setArbolaBest=_arbolaBest[1];

  React.useEffect(function(){
    try{window.storage.get('pairs_best_greetings_medium').then(function(r){if(r&&r.value){var d=JSON.parse(r.value);setPairsBest(d.moves+"mv · "+d.time+"s");}}).catch(function(){});}catch(e){}
    try{window.storage.get('tap_best_greetings_easy').then(function(r){if(r&&r.value)setTapBest(r.value+" pts");}).catch(function(){});}catch(e){}
    try{window.storage.get('kitchen_best').then(function(r){if(r&&r.value)setTxokoBest(r.value+" pts");}).catch(function(){});}catch(e){}
    try{window.storage.get('ordutegi_best').then(function(r){if(r&&r.value)setOrdBest(r.value+" pts");}).catch(function(){});}catch(e){}
    try{window.storage.get('koloreak_best').then(function(r){if(r&&r.value)setKolBest(r.value+" pts");}).catch(function(){});}catch(e){}
    try{window.storage.get('arbola_best').then(function(r){if(r&&r.value)setArbolaBest(r.value+" pts");}).catch(function(){});}catch(e){}
  },[]);

  var games=[
    {id:"koloreak",emoji:"🎨",title:"Koloreak",desc:"Match Basque color words to real color swatches, and guess the color from the word",tag:"Colors",color:"#7C3AED",dark:"#4C1D95",fn:onKoloreak,best:kolBest,stats:["32 colors","A1–B2","Two modes"]},
    {id:"txoko",emoji:"👨‍🍳",title:"Basque Kitchen",desc:"Cook 28 classic Basque dishes by choosing the right Basque ingredients",tag:"Story",color:"#C2510E",dark:"#92400E",fn:onTxoko,best:txokoBest,stats:["28 dishes","5 steps each","3 lives"]},
    {id:"arbola",emoji:"🌳",title:"Arbola Familiarra",desc:"Build six Basque family portraits by adding the right family members one by one",tag:"Family",color:"#0D9488",dark:"#134E4A",fn:onArbola,best:arbolaBest,stats:["6 families","5 members each","A1–B2"]},
    {id:"tap",emoji:"⚡",title:"Tap the Word",desc:"Tap the right translation before the timer runs out. Speed increases every 3 rounds",tag:"Speed",color:"#F97316",dark:"#C2510E",fn:onTap,best:tapBest,stats:["10 rounds","Gets faster","Combo points"]},
    {id:"ordutegi",emoji:"🕐",title:"Ordutegi",desc:"Plan your day in Basque, use numbers and times to navigate real-life scenarios",tag:"Numbers",color:"#0369A1",dark:"#0C4A6E",fn:onOrdutegi,best:ordBest,stats:["12 scenarios","Numbers & time","A1–B1"]},
    {id:"pairs",emoji:"🃏",title:"Memory Pairs",desc:"Flip cards to match Basque words with their English translations",tag:"Memory",color:"#19A85A",dark:"#0E7A40",fn:onPairs,best:pairsBest,stats:["4–8 pairs","Timed","All topics"]},
  ];

  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",backgroundColor:"#F2F2F7",fontFamily:"Nunito,system-ui,sans-serif"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(160deg,#1A1A2E,#16213E,#0F3460)",paddingTop:56,paddingLeft:16,paddingRight:16,paddingBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:20,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>Games</p>
            <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.55)",fontWeight:600}}>Learn Basque through play</p>
          </div>
        </div>
        {/* Quick stats row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr",gap:4}}>
          {[
            {emoji:"🎨",label:"Koloreak",sub:kolBest||"·"},
            {emoji:"👨‍🍳",label:"Kitchen",sub:txokoBest||"·"},
            {emoji:"🌳",label:"Arbola",sub:arbolaBest||"·"},
            {emoji:"⚡",label:"Tap",sub:tapBest||"·"},
            {emoji:"🕐",label:"Ordutegi",sub:ordBest||"·"},
            {emoji:"🃏",label:"Pairs",sub:pairsBest||"·"},
          ].map(function(s){return(
            <div key={s.label} style={{backgroundColor:"rgba(255,255,255,0.08)",borderRadius:10,padding:"7px 3px",textAlign:"center",border:"1px solid rgba(255,255,255,0.1)"}}>
              <p style={{margin:0,fontSize:14,lineHeight:1}}>{s.emoji}</p>
              <p style={{margin:"3px 0 1px",fontSize:9,fontWeight:800,color:"#fff"}}>{s.label}</p>
              <p style={{margin:0,fontSize:7,color:"rgba(255,255,255,0.4)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.sub}</p>
            </div>
          );})}
        </div>
      </div>

      <div style={{padding:"14px"}}>
        {games.map(function(g){return(
          <button key={g.id} onClick={g.fn} style={{width:"100%",marginBottom:10,borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left",overflow:"hidden",padding:0,boxShadow:"0 2px 12px rgba(0,0,0,0.09)",display:"block"}}>
            {/* Gradient hero */}
            <div style={{background:"linear-gradient(135deg,"+g.dark+" 0%,"+g.color+" 100%)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,opacity:0.05,backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"16px 16px"}}/>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10,position:"relative"}}>
                <span style={{fontSize:38,lineHeight:1}}>{g.emoji}</span>
                <span style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,0.95)",backgroundColor:"rgba(255,255,255,0.18)",padding:"3px 10px",borderRadius:20,letterSpacing:0.5,marginTop:4}}>{g.tag}</span>
              </div>
              <p style={{margin:"0 0 4px",fontSize:18,fontWeight:900,color:"#fff",letterSpacing:-0.3,position:"relative"}}>{g.title}</p>
              <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.75)",fontWeight:500,lineHeight:1.4,position:"relative"}}>{g.desc}</p>
            </div>
            {/* Footer */}
            <div style={{backgroundColor:"#fff",padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",gap:8}}>
                {g.stats.map(function(s){return(
                  <span key={s} style={{fontSize:10,fontWeight:700,color:"#8E8E93",backgroundColor:"#F2F2F7",borderRadius:8,padding:"3px 7px"}}>{s}</span>
                );})}
              </div>
              <span style={{fontSize:16,color:g.color,fontWeight:700,flexShrink:0}}>{"›"}</span>
            </div>
            {/* Best score strip */}
            {g.best&&(
              <div style={{backgroundColor:g.color+"18",padding:"6px 18px",borderTop:"1px solid "+g.color+"22",display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10}}>⭐</span>
                <p style={{margin:0,fontSize:10,fontWeight:800,color:g.dark}}>Personal best: {g.best}</p>
              </div>
            )}
          </button>
        );})}

        <p style={{textAlign:"center",fontSize:12,color:"#C7C7CC",fontWeight:600,marginTop:6}}>More games coming soon</p>
      </div>
    </div>
  );
}
function TapScreen(props){
  var VOCABULARY=_VOCAB;
  var onBack=props.onBack,isPro=props.isPro,onUpgrade=props.onUpgrade;
  var TOPICS_LIST=['greetings','food','numbers','family','colors','nature','body','time','travel','emotions','work','culture','society','adjectives'];
  var DIFFICULTIES=[
    {key:'easy',label:'Easy',secs:6,levels:['A1'],color:'#19A85A'},
    {key:'medium',label:'Medium',secs:4,levels:['A1','A2'],color:'#F97316'},
    {key:'hard',label:'Hard',secs:3,levels:['A1','A2','B1','B2'],color:'#EF4444'},
  ];
  var _t=useState('greetings');var topic=_t[0];var setTopic=_t[1];
  var _d=useState('easy');var diff=_d[0];var setDiff=_d[1];
  var _q=useState(null);var question=_q[0];var setQuestion=_q[1];
  var _dir=useState('en');var dir=_dir[0];var setDir=_dir[1]; // user-controlled toggle
  var _opts=useState([]);var opts=_opts[0];var setOpts=_opts[1];
  var _sel=useState(null);var sel=_sel[0];var setSel=_sel[1];
  var _score=useState(0);var score=_score[0];var setScore=_score[1];
  var _correct=useState(0);var correct=_correct[0];var setCorrect=_correct[1];
  var _total=useState(0);var total=_total[0];var setTotal=_total[1];
  var _secs=useState(5);var secs=_secs[0];var setSecs=_secs[1];
  var _maxSecs=useState(5);var maxSecs=_maxSecs[0];var setMaxSecs=_maxSecs[1];
  var _active=useState(false);var active=_active[0];var setActive=_active[1];
  var _won=useState(false);var won=_won[0];var setWon=_won[1];
  var _streak=useState(0);var streak=_streak[0];var setStreak=_streak[1];
  var _best=useState(0);var best=_best[0];var setBest=_best[1];
  var _shake=useState(false);var shake=_shake[0];var setShake=_shake[1];
  var _combo=useState(null);var combo=_combo[0];var setCombo=_combo[1];
  var timerRef=React.useRef(null);
  var ROUNDS=10;

  var diffCfg=DIFFICULTIES.find(function(d){return d.key===diff;})||DIFFICULTIES[0];

  // Load best score from storage
  React.useEffect(function(){
    try{window.storage.get('tap_best_'+topic+'_'+diff).then(function(r){if(r&&r.value)setBest(parseInt(r.value)||0);}).catch(function(){});}catch(e){}
  },[topic,diff]);

  function getPool(){
    var pool=VOCABULARY.filter(function(w){
      if(w.topic!==topic)return false;
      if(diffCfg.levels.indexOf(w.cefr)===-1)return false;
      if(!isPro&&!(w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)!==-1))return false;
      return true;
    });
    if(pool.length<4)pool=VOCABULARY.filter(function(w){return w.topic===topic&&w.cefr==="A1";});
    return pool;
  }

  function getTimerSecs(roundIdx){
    // Adaptive: starts at diffCfg.secs, speeds up after round 5
    if(roundIdx>=7)return Math.max(2,diffCfg.secs-2);
    if(roundIdx>=4)return Math.max(3,diffCfg.secs-1);
    return diffCfg.secs;
  }

  function nextQuestion(currentTotal,currentScore,currentStreak,currentCorrect){
    clearInterval(timerRef.current);
    if(currentTotal>=ROUNDS){
      setActive(false);setWon(true);
      setBest(function(b){
        var newBest=Math.max(b,currentScore);
        try{window.storage.set('tap_best_'+topic+'_'+diff,String(newBest)).catch(function(){});}catch(e){}
        return newBest;
      });      setQuestion(null);return;
    }
    var pool=getPool();
    if(pool.length<4){setWon(true);setQuestion(null);return;}
    var word=shuffled(pool)[0];
    var distractors=shuffled(pool.filter(function(w){return w.id!==word.id;})).slice(0,3);
    var options=shuffled([word].concat(distractors));
    // Direction is user-controlled toggle, not random
    var t=getTimerSecs(currentTotal);
    setQuestion(word);setOpts(options);setSel(null);setSecs(t);setMaxSecs(t);setCombo(null);
    timerRef.current=setInterval(function(){
      setSecs(function(s){
        if(s<=1){
          clearInterval(timerRef.current);
          setSel("__timeout__");
          setStreak(0);setShake(true);setTimeout(function(){setShake(false);},500);
          setTotal(function(t2){var nt=t2+1;setTimeout(function(){nextQuestion(nt,currentScore,0,currentCorrect);},950);return nt;});
          return 0;
        }
        return s-1;
      });
    },1000);
  }

  function start(){
    setScore(0);setTotal(0);setStreak(0);setCorrect(0);setWon(false);setActive(true);
    setQuestion(null);setCombo(null);setShake(false);
    setTimeout(function(){nextQuestion(0,0,0,0);},50);
  }

  function pick(word){
    if(sel||!question)return;
    clearInterval(timerRef.current);
    var isCorrect=word.id===question.id;
    setSel(word.id);
    var currentCorrect=correct; // capture at call time
    var currentScore=score;     // capture at call time
    if(isCorrect){
      haptic("light");sfx("correct");
      var ns=streak+1;
      var pts=ns>=5?3:ns>=3?2:1;
      var sc=score+pts;
      var nc=currentCorrect+1;
      setScore(sc);setStreak(ns);setCorrect(nc);
      if(ns>=3)setCombo("+"+pts+"  🔥"+ns);
      setTotal(function(t2){var nt=t2+1;setTimeout(function(){nextQuestion(nt,sc,ns,nc);},600);return nt;});
    }else{
      haptic("error");sfx("wrong");
      setStreak(0);setShake(true);setTimeout(function(){setShake(false);},500);
      setTotal(function(t2){var nt=t2+1;setTimeout(function(){nextQuestion(nt,currentScore,0,currentCorrect);},900);return nt;});
    }
  }

  React.useEffect(function(){return function(){clearInterval(timerRef.current);};},[]);

  var timerPct=maxSecs>0?secs/maxSecs*100:100;
  var timerColor=secs<=1?"#EF4444":secs<=2?"#F97316":"#4ADE80";
  var isFlipped=dir==='eu';
  

  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",backgroundColor:"#F2F2F7",fontFamily:"Nunito,system-ui,sans-serif"}}>

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:56,paddingLeft:14,paddingRight:14,paddingBottom:12,backgroundColor:"#fff",borderBottom:"1px solid "+("#F0F0F0")}}>
        <button onClick={onBack} style={{background:"#F2F2F7",border:"none",color:"#555",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
        <div style={{flex:1}}>
          <p style={{margin:0,fontSize:15,fontWeight:900,color:active?"#fff":"#1A1A1A",letterSpacing:-0.3}}>⚡ Tap the Word</p>
          <p style={{margin:0,fontSize:10,color:active?"rgba(255,255,255,0.4)":"#AAA",fontWeight:600,textTransform:"capitalize"}}>{topic} · {diffCfg.label}</p>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {active&&(
            <div style={{backgroundColor:"#FFF7ED",borderRadius:12,padding:"4px 10px",textAlign:"center",border:"1px solid rgba(249,115,22,0.3)"}}>
              <p style={{margin:0,fontSize:15,fontWeight:900,color:"#F97316",lineHeight:1}}>{score}</p>
              <p style={{margin:0,fontSize:8,color:"#AAA",fontWeight:700}}>PTS</p>
            </div>
          )}
          <button onClick={function(){setDir(function(d){return d==='en'?'eu':'en';});}} style={{fontSize:10,fontWeight:800,color:"#888",backgroundColor:"#F2F2F7",border:"1px solid "+("#E8E8E8"),borderRadius:16,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit"}}>
            {dir==='en'?"EN→EU":"EU→EN"}
          </button>
        </div>
      </div>

      {/* ── Topic + difficulty — hide during active play ── */}
      {!active&&(
        <div style={{backgroundColor:"#fff",borderBottom:"1px solid #F0F0F0"}}>
          <div style={{display:"flex",gap:5,overflowX:"auto",padding:"7px 14px 4px",WebkitOverflowScrolling:"touch"}}>
            {TOPICS_LIST.map(function(t){
              var act=t===topic;var free=isPro||(FREE_TOPICS.indexOf(t)!==-1);
              return(<button key={t} onClick={function(){if(!free){onUpgrade();return;}setTopic(t);setWon(false);clearInterval(timerRef.current);}}
                style={{flexShrink:0,fontSize:11,padding:"4px 11px",borderRadius:20,border:"1.5px solid "+(act?"#F97316":"#E8E8E8"),backgroundColor:act?"#F97316":"#fff",color:act?"#fff":free?"#555":"#CCC",cursor:"pointer",fontWeight:700,fontFamily:"inherit",transition:"all 0.15s"}}>
                {!free?"🔒 ":""}{t.charAt(0).toUpperCase()+t.slice(1)}
              </button>);
            })}
          </div>
          <div style={{display:"flex",gap:5,padding:"4px 14px 7px"}}>
            {DIFFICULTIES.map(function(d){
              var act=d.key===diff;
              return(<button key={d.key} onClick={function(){setDiff(d.key);setWon(false);clearInterval(timerRef.current);}}
                style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:"1.5px solid "+(act?d.color:"#E8E8E8"),backgroundColor:act?d.color:"#F2F2F7",color:act?"#fff":"#888",cursor:"pointer",fontWeight:800,fontFamily:"inherit",transition:"all 0.15s"}}>
                {d.label} {d.secs}s
              </button>);
            })}
          </div>
        </div>
      )}

      <div style={{padding:"14px 14px"}}>

        {/* ── Start screen ── */}
        {!active&&!won&&(
          <div style={{textAlign:"center",paddingTop:24}}>
            <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#C2510E,#F97316)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:36,boxShadow:"0 8px 24px rgba(249,115,22,0.35)"}}>⚡</div>
            <p style={{fontSize:22,fontWeight:900,color:"#1A1A1A",margin:"0 0 6px",letterSpacing:-0.5}}>Tap the Word</p>
            <p style={{fontSize:13,color:"#8E8E93",margin:"0 0 28px",lineHeight:1.6}}>Tap the correct translation<br/>before the timer runs out.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:28,maxWidth:280,margin:"0 auto 28px"}}>
              {[{l:"10",s:"rounds"},{l:diffCfg.secs+"s",s:"per round"},{l:"+3",s:"combo bonus"},{l:"↔",s:"both directions"}].map(function(p){return(
                <div key={p.l} style={{backgroundColor:"#fff",borderRadius:14,padding:"12px 8px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)",textAlign:"center"}}>
                  <p style={{margin:0,fontSize:20,fontWeight:900,color:"#F97316"}}>{p.l}</p>
                  <p style={{margin:0,fontSize:10,color:"#8E8E93",fontWeight:700}}>{p.s}</p>
                </div>
              );})}
            </div>
            {best>0&&<p style={{fontSize:12,color:"#8E8E93",fontWeight:700,marginBottom:20}}>Personal best: {best} pts · {diffCfg.label}</p>}
            <button onClick={start} style={{padding:"17px 56px",borderRadius:20,border:"none",backgroundColor:"#F97316",color:"#fff",fontSize:18,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 5px 0 #C2510E",letterSpacing:-0.3}}>Start</button>
          </div>
        )}

        {/* ── Active question ── */}
        {active&&question&&(
          <div>
            {/* Big timer bar */}
            <div style={{height:8,backgroundColor:"#F0F0F0",borderRadius:4,marginBottom:20,overflow:"hidden"}}>
              <div style={{height:"100%",backgroundColor:timerColor,width:timerPct+"%",transition:"width 1s linear, background-color 0.3s",borderRadius:4,boxShadow:"0 0 8px "+timerColor+"88"}}/>
            </div>

            {/* Combo badge */}
            {combo&&(
              <div style={{textAlign:"center",marginBottom:12,animation:"popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)"}}>
                <span style={{fontSize:15,fontWeight:900,color:"#F97316",backgroundColor:"rgba(249,115,22,0.15)",padding:"5px 18px",borderRadius:20,border:"1px solid rgba(249,115,22,0.3)"}}>{combo}</span>
              </div>
            )}

            {/* Prompt card */}
            <div style={{backgroundColor:"#fff",borderRadius:22,padding:"24px 20px",marginBottom:14,textAlign:"center",border:"1px solid #E8E8E8",animation:shake?"shake 0.4s ease":"none"}}>
              <p style={{margin:"0 0 6px",fontSize:10,fontWeight:800,color:isFlipped?"#19A85A":"#888",textTransform:"uppercase",letterSpacing:1}}>
                {isFlipped?"Basque → tap English":"English → tap Basque"}
              </p>
              <p style={{margin:0,fontSize:(isFlipped?question.basque:question.english).length>18?20:(isFlipped?question.basque:question.english).length>12?24:28,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5,lineHeight:1.2}}>
                {isFlipped?question.basque:question.english}
              </p>
              {sel&&(
                <p style={{margin:"10px 0 0",fontSize:11,color:"#AAA",fontWeight:600}}>
                  {question.pronunciation}
                  {sel==="__timeout__"&&<span style={{color:"#EF4444",fontWeight:800,marginLeft:6}}>time's up</span>}
                </p>
              )}
            </div>

            {/* Options — big tap targets */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {opts.map(function(word){
                var isCorrectOpt=word.id===question.id;
                var isPicked=sel===word.id;
                var isTimeout=sel==="__timeout__";
                var showResult=sel!==null;
                var bg=showResult?(isCorrectOpt?"#22C55E":isPicked?"#EF4444":"#F6F6F6"):"#fff";
                var border=showResult?(isCorrectOpt?"#22C55E":isPicked?"#EF4444":"#E8E8E8"):"#E8E8E8";
                var textColor=showResult?(isCorrectOpt?"#fff":isPicked?"#fff":"#CCC"):"#1A1A1A";
                var displayText=isFlipped?word.english:word.basque;
                var sc=isPicked&&isCorrectOpt?"scale(1.04)":isPicked&&!isCorrectOpt?"scale(0.96)":isCorrectOpt&&showResult?"scale(1.02)":"scale(1)";
                return(
                  <button key={word.id} onClick={function(){pick(word);}}
                    style={{padding:"18px 12px",borderRadius:18,border:"1.5px solid "+border,backgroundColor:bg,cursor:showResult?"default":"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.18s cubic-bezier(0.34,1.56,0.64,1)",transform:sc,minHeight:72,boxShadow:!showResult?"0 2px 8px rgba(0,0,0,0.06)":isCorrectOpt?"0 0 20px rgba(34,197,94,0.4)":isPicked?"0 0 20px rgba(239,68,68,0.3)":"none"}}>
                    <p style={{margin:0,fontSize:displayText.length>14?11:displayText.length>9?13:16,fontWeight:900,color:textColor,lineHeight:1.3,wordBreak:"break-word"}}>{displayText}</p>
                    {isCorrectOpt&&showResult&&!isPicked&&<p style={{margin:"4px 0 0",fontSize:9,color:"rgba(255,255,255,0.7)",fontWeight:800}}>✓ CORRECT</p>}
                    {isTimeout&&isCorrectOpt&&<p style={{margin:"4px 0 0",fontSize:9,color:"rgba(255,255,255,0.7)",fontWeight:800}}>✓ WAS THIS</p>}
                  </button>
                );
              })}
            </div>

            {/* Progress + speed indicator */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18}}>
              <div style={{display:"flex",gap:4}}>
                {Array.from({length:ROUNDS}).map(function(_,i){
                  var done=i<total;var isCur=i===total;
                  return <div key={i} style={{width:isCur?12:6,height:6,borderRadius:3,backgroundColor:done?"#F97316":isCur?"rgba(249,115,22,0.4)":"#F0F0F0",transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)"}}/>;
                })}
              </div>
              <span style={{fontSize:11,fontWeight:700,color:total>=7?"#EF4444":total>=4?"#F97316":"#D1D1D6",transition:"color 0.3s"}}>{total>=7?"⚡ Max speed!":total>=4?"Getting faster…":""}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Win overlay (bottom sheet) ── */}
      {won&&(
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={start}>
          <div style={{backgroundColor:"#fff",borderTopLeftRadius:32,borderTopRightRadius:32,width:"100%",maxWidth:420,margin:"0 auto",paddingBottom:40}} onClick={function(e){e.stopPropagation();}}>
            <div style={{width:36,height:4,backgroundColor:"#E0E0E0",borderRadius:2,margin:"12px auto 0"}}/>
            <div style={{padding:"20px 24px 0",textAlign:"center"}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:score>best&&score>0?"linear-gradient(135deg,#C2510E,#F97316)":correct===ROUNDS?"linear-gradient(135deg,#059669,#22C55E)":"linear-gradient(135deg,#475569,#94A3B8)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:34,boxShadow:score>best?"0 8px 24px rgba(249,115,22,0.35)":correct===ROUNDS?"0 8px 24px rgba(34,197,94,0.3)":"none"}}>
                {correct===ROUNDS?"🏆":score>best&&score>0?"⭐":"⚡"}
              </div>
              <p style={{margin:"0 0 2px",fontSize:24,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5}}>{correct===ROUNDS?"Perfect!":score>best&&score>0?"New best!":"Round done"}</p>
              <p style={{margin:"0 0 20px",fontSize:13,color:"#8E8E93",fontWeight:600,textTransform:"capitalize"}}>{topic} · {diffCfg.label}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:16}}>
                {[{v:score,l:"Points",c:"#F97316"},{v:correct+"/"+ROUNDS,l:"Correct",c:"#1A1A1A"},{v:Math.round(correct/ROUNDS*100)+"%",l:"Accuracy",c:"#19A85A"},{v:best,l:"Best",c:"#8E8E93"}].map(function(s){return(
                  <div key={s.l} style={{backgroundColor:"#F2F2F7",borderRadius:14,padding:"10px 6px"}}>
                    <p style={{margin:0,fontSize:18,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</p>
                    <p style={{margin:"3px 0 0",fontSize:9,color:"#8E8E93",fontWeight:700}}>{s.l}</p>
                  </div>
                );})}
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={start} style={{flex:1,padding:"15px",borderRadius:18,border:"none",backgroundColor:"#F97316",color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 0 #C2510E"}}>Play again</button>
                <button onClick={function(){var next=TOPICS_LIST[(TOPICS_LIST.indexOf(topic)+1)%TOPICS_LIST.length];var free=isPro||(FREE_TOPICS.indexOf(next)!==-1);if(free){setTopic(next);setWon(false);}else{onUpgrade();}}} style={{flex:1,padding:"15px",borderRadius:18,border:"2px solid #E8E8E8",backgroundColor:"#fff",color:"#555",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Next topic</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function BasqueKitchenScreen(props){
  var VOCABULARY=_VOCAB;
  var onBack=props.onBack,isPro=props.isPro,onUpgrade=props.onUpgrade;

  var DISHES=[
    {name:"Pintxoak",emoji:"🥖",desc:"Classic Basque bar snacks",color:"#C2510E",dark:"#92400E",bg:"#FFF7ED",stages:[
      {instruction:"Start with a base of bread",keyword:"ogia",hint:"The base of every pintxo: baked, not fried"},
      {instruction:"Season it with salt",keyword:"gatz",hint:"Essential: just a pinch"},
      {instruction:"Lay on a ripe tomato",keyword:"tomatea",hint:"Red, juicy, sliced thin"},
      {instruction:"Finish with a drizzle of oil",keyword:"olioa",hint:"Olive oil, always"},
      {instruction:"Welcome your guests",keyword:"ongi_etorri",hint:"A Basque greeting for arrivals"},
    ]},
    {name:"Marmitakoa",emoji:"🐟",desc:"Tuna and potato stew",color:"#0E7A40",dark:"#065F46",bg:"#EDFAF3",stages:[
      {instruction:"Choose the fish",keyword:"arraina",hint:"The star of the stew"},
      {instruction:"Peel and chop the potato",keyword:"patata",hint:"Starchy and filling"},
      {instruction:"Slice in a red pepper",keyword:"piperra",hint:"Adds color and warmth"},
      {instruction:"Fill the pot with water",keyword:"ura",hint:"The stew base"},
      {instruction:"Season with salt",keyword:"gatz",hint:"Don't forget to taste!"},
    ]},
    {name:"Pastel Vasco",emoji:"🥧",desc:"Basque cream cake",color:"#7C3AED",dark:"#5B21B6",bg:"#F5F3FF",stages:[
      {instruction:"Weigh out the sugar",keyword:"azukrea",hint:"Makes it sweet: don't skimp"},
      {instruction:"Crack in the eggs",keyword:"arrautza",hint:"Binds the batter together"},
      {instruction:"Drizzle in some oil",keyword:"olioa",hint:"Keeps it moist"},
      {instruction:"Pour the milk",keyword:"esnea",hint:"Gives it its creamy texture"},
      {instruction:"Bake until golden",keyword:"beroa",hint:"It needs heat to set"},
    ]},
    {name:"Bacalao Pil Pil",emoji:"🧄",desc:"Salted cod in garlic sauce",color:"#1D4ED8",dark:"#1E3A8A",bg:"#EFF6FF",stages:[
      {instruction:"Soak the salted cod overnight",keyword:"bacalaoa",hint:"The Basque classic fish"},
      {instruction:"Peel and slice the garlic",keyword:"baratxuria",hint:"Pungent and aromatic"},
      {instruction:"Pour in olive oil",keyword:"olioa",hint:"Cold-pressed is best"},
      {instruction:"Add a splash of water",keyword:"ura",hint:"Helps emulsify the sauce"},
      {instruction:"Season to taste",keyword:"gatz",hint:"Go easy: the cod is already salty"},
    ]},
    {name:"Tortilla Española",emoji:"🍳",desc:"Spanish-style potato omelette",color:"#B45309",dark:"#78350F",bg:"#FFFBEB",stages:[
      {instruction:"Slice the potatoes thinly",keyword:"patata",hint:"The heart of the tortilla"},
      {instruction:"Beat the eggs",keyword:"arrautza",hint:"Use plenty: 4 to 6"},
      {instruction:"Season with salt",keyword:"gatz",hint:"Salt the potatoes and eggs"},
      {instruction:"Fry in plenty of oil",keyword:"olioa",hint:"Submerge the potatoes"},
      {instruction:"Flip onto a plate",keyword:"jan",hint:"Time to eat!"},
    ]},
    {name:"Piperrada",emoji:"🌶️",desc:"Basque pepper and tomato stew",color:"#DC2626",dark:"#991B1B",bg:"#FFF1F2",stages:[
      {instruction:"Chop the peppers",keyword:"piperra",hint:"Red and green both work"},
      {instruction:"Add ripe tomatoes",keyword:"tomatea",hint:"Sweet and juicy"},
      {instruction:"Slice the onion",keyword:"tipula",hint:"Softens and sweetens with heat"},
      {instruction:"Pour in the oil",keyword:"olioa",hint:"Enough to coat the pan"},
      {instruction:"Season with salt",keyword:"gatz",hint:"Taste as you go"},
    ]},
    {name:"Ensalada Vasca",emoji:"🥗",desc:"Fresh Basque salad",color:"#16A34A",dark:"#14532D",bg:"#F0FDF4",stages:[
      {instruction:"Tear the lettuce",keyword:"letxuga",hint:"Use your hands, not a knife"},
      {instruction:"Slice the tomato",keyword:"tomatea",hint:"Ripe and red"},
      {instruction:"Grate the carrot",keyword:"azenarioa",hint:"Adds color and sweetness"},
      {instruction:"Drizzle with oil",keyword:"olioa",hint:"Olive oil always"},
      {instruction:"Finish with salt",keyword:"gatz",hint:"Just a pinch"},
    ]},
    {name:"Txakolina & Pintxo",emoji:"🍷",desc:"Wine pairing experience",color:"#9333EA",dark:"#6B21A8",bg:"#FAF5FF",stages:[
      {instruction:"Pour the Txakoli wine",keyword:"txakolina",hint:"Basque white wine: poured from a height"},
      {instruction:"Lay out the bread",keyword:"ogia",hint:"Fresh bread is essential"},
      {instruction:"Add anchovy on top",keyword:"antxoa",hint:"The classic pintxo topping"},
      {instruction:"Serve with cheese",keyword:"gazta",hint:"Idiazabal is the Basque choice"},
      {instruction:"Toast to good food",keyword:"ardoa",hint:"Wine makes everything better"},
    ]},
    {name:"Pollo al Txakoli",emoji:"🍗",desc:"Chicken in Txakoli wine sauce",color:"#D97706",dark:"#92400E",bg:"#FFFBEB",stages:[
      {instruction:"Season the chicken",keyword:"oilaskoa",hint:"The main protein: use a whole bird"},
      {instruction:"Add the sauce",keyword:"saltsa",hint:"Txakoli reduces into a rich sauce"},
      {instruction:"Slice in garlic",keyword:"baratxuria",hint:"Several cloves: don't hold back"},
      {instruction:"Season with salt",keyword:"gatz",hint:"Season every layer"},
      {instruction:"Prepare the dish",keyword:"prestatu",hint:"Get everything ready before cooking"},
    ]},
    {name:"Alubias de Tolosa",emoji:"🫘",desc:"Famous Tolosa black beans",color:"#7F1D1D",dark:"#450A0A",bg:"#FFF1F2",stages:[
      {instruction:"Soak the beans overnight",keyword:"babarrunak",hint:"Tolosa beans are dark and earthy"},
      {instruction:"Add the meat",keyword:"haragia",hint:"Pork belly or chorizo"},
      {instruction:"Pour in the water",keyword:"ura",hint:"Enough to cover the beans"},
      {instruction:"Add the bacon",keyword:"urdaia",hint:"Cured pork fat adds richness"},
      {instruction:"Season to taste",keyword:"gatz",hint:"Add salt at the end, not the beginning"},
    ]},
    {name:"Merluza en Salsa Verde",emoji:"🐠",desc:"Hake in green parsley sauce",color:"#065F46",dark:"#022C22",bg:"#ECFDF5",stages:[
      {instruction:"Prepare the hake fillets",keyword:"merluzea",hint:"The most prized fish in Basque cooking"},
      {instruction:"Make the sauce",keyword:"saltsa",hint:"Parsley, oil and garlic blended"},
      {instruction:"Add the garlic",keyword:"baratxuria",hint:"Finely chopped, not crushed"},
      {instruction:"Pour in the oil",keyword:"olioa",hint:"Good olive oil is the base"},
      {instruction:"Season with salt",keyword:"gatz",hint:"Taste before serving"},
    ]},
    {name:"Revuelto de Hongos",emoji:"🍄",desc:"Wild mushroom scramble",color:"#78350F",dark:"#431407",bg:"#FFF7ED",stages:[
      {instruction:"Pick the mushrooms",keyword:"onddo",hint:"Wild mushrooms from the Basque hills"},
      {instruction:"Beat the eggs",keyword:"arrautza",hint:"3 eggs per person"},
      {instruction:"Heat the oil",keyword:"olioa",hint:"A generous splash in the pan"},
      {instruction:"Add the garlic",keyword:"baratxuria",hint:"Just one clove, sliced thin"},
      {instruction:"Season with salt",keyword:"gatz",hint:"Mushrooms need more salt than you think"},
    ]},
    {name:"Mamia",emoji:"🍮",desc:"Traditional Basque curd dessert",color:"#0F766E",dark:"#134E4A",bg:"#F0FDFA",stages:[
      {instruction:"Warm the milk gently",keyword:"esnea",hint:"Sheep's milk if you can find it"},
      {instruction:"Add the sugar",keyword:"azukrea",hint:"Just a little: it should be subtle"},
      {instruction:"Pour into bowls",keyword:"jan",hint:"Traditional clay bowls work best"},
      {instruction:"Serve with walnuts",keyword:"intxaurra",hint:"Crushed walnuts on top is traditional"},
      {instruction:"Taste for sweetness",keyword:"goxoa",hint:"It should be delicately sweet"},
    ]},
    {name:"Gaztaopila",emoji:"🧀",desc:"Basque cheese flatbread",color:"#CA8A04",dark:"#713F12",bg:"#FEFCE8",stages:[
      {instruction:"Mix the flour",keyword:"ogia",hint:"Use the bread dough as a base"},
      {instruction:"Grate the cheese",keyword:"gazta",hint:"Idiazabal: smoky and salty"},
      {instruction:"Crack in the eggs",keyword:"arrautza",hint:"Binds the filling"},
      {instruction:"Drizzle with oil",keyword:"olioa",hint:"Olive oil on top before baking"},
      {instruction:"Bake until hot",keyword:"beroa",hint:"A hot oven gives a golden crust"},
    ]},
    {name:"Txuleta a la Parrilla",emoji:"🥩",desc:"Basque grilled ribeye steak",color:"#991B1B",dark:"#450A0A",bg:"#FFF1F2",stages:[
      {instruction:"Choose a thick steak",keyword:"txuleta",hint:"Basque txuleton: aged and enormous"},
      {instruction:"Grill over hot coals",keyword:"erre",hint:"High heat, short time: never well done"},
      {instruction:"Season with salt",keyword:"gatz",hint:"Coarse salt only, after cooking"},
      {instruction:"Rest the meat",keyword:"haragia",hint:"Let it rest before cutting"},
      {instruction:"Serve at the table",keyword:"jan",hint:"Everyone eats together"},
    ]},
    {name:"Sagardotegi Plater",emoji:"🍶",desc:"Traditional cider house menu",color:"#166534",dark:"#14532D",bg:"#F0FDF4",stages:[
      {instruction:"Pour the cider",keyword:"sagardoa",hint:"Poured from height to aerate it"},
      {instruction:"Serve the omelette",keyword:"tortilla",hint:"Cod omelette is the traditional starter"},
      {instruction:"Bring out the steak",keyword:"txuleta",hint:"Enormous: for the whole table"},
      {instruction:"Add walnuts for dessert",keyword:"intxaurra",hint:"With Idiazabal cheese and quince"},
      {instruction:"Call txotx!",keyword:"txotx",hint:"The signal to fill your glass at the barrel"},
    ]},
    {name:"Arroz con Leche",emoji:"🍚",desc:"Basque rice pudding",color:"#0369A1",dark:"#0C4A6E",bg:"#EFF6FF",stages:[
      {instruction:"Measure the rice",keyword:"arroza",hint:"Short grain rice absorbs milk best"},
      {instruction:"Warm the milk",keyword:"esnea",hint:"Whole milk, slowly heated"},
      {instruction:"Stir in the sugar",keyword:"azukrea",hint:"Add to taste: some like it sweet"},
      {instruction:"Add cream on top",keyword:"esnegaina",hint:"A spoonful of cream to finish"},
      {instruction:"Boil gently",keyword:"egosi",hint:"Low heat, constant stirring"},
    ]},
    {name:"Patatas Fritas Caseras",emoji:"🍟",desc:"Homemade Basque fried potatoes",color:"#CA8A04",dark:"#78350F",bg:"#FFFBEB",stages:[
      {instruction:"Peel the potatoes",keyword:"patata",hint:"Thick cut: these are proper chips"},
      {instruction:"Heat plenty of oil",keyword:"olioa",hint:"Sunflower or olive: enough to submerge"},
      {instruction:"Fry until golden",keyword:"frijitu",hint:"Twice-fried for extra crunch"},
      {instruction:"Season with salt",keyword:"gatz",hint:"Salt immediately while still hot"},
      {instruction:"Serve with vegetables",keyword:"barazkia",hint:"A simple green salad on the side"},
    ]},
    {name:"Menú del Día",emoji:"📋",desc:"The classic Basque set lunch",color:"#7C3AED",dark:"#4C1D95",bg:"#F5F3FF",stages:[
      {instruction:"Read the menu",keyword:"menua",hint:"Three courses, wine included"},
      {instruction:"Order the salad",keyword:"letxuga",hint:"Always a simple green salad to start"},
      {instruction:"Choose the fish",keyword:"arraina",hint:"Basques always have fish on the menu"},
      {instruction:"Finish with fruit",keyword:"fruta",hint:"Seasonal fruit or a small dessert"},
      {instruction:"Order coffee",keyword:"kafea",hint:"A cortado to finish: always"},
    ]},
    {name:"Gosaria Euskalduna",emoji:"🌅",desc:"Traditional Basque breakfast",color:"#C2410C",dark:"#7C2D12",bg:"#FFF7ED",stages:[
      {instruction:"Start the morning",keyword:"gosaria",hint:"Breakfast in Basque is a ritual"},
      {instruction:"Brew the coffee",keyword:"kafea",hint:"Strong and black or with milk"},
      {instruction:"Toast the bread",keyword:"ogia",hint:"Rubbed with tomato in the Basque way"},
      {instruction:"Pour a glass of milk",keyword:"esnea",hint:"For the children: or the coffee"},
      {instruction:"Sit down to eat",keyword:"gosaldu",hint:"To have breakfast: take your time"},
    ]},
    {name:"Intxaursaltsa",emoji:"🌰",desc:"Walnut cream, Christmas dessert",color:"#92400E",dark:"#451A03",bg:"#FFF7ED",stages:[
      {instruction:"Gather the walnuts",keyword:"intxaurra",hint:"Freshly shelled are best"},
      {instruction:"Warm the milk",keyword:"esnea",hint:"Whole milk, never skimmed"},
      {instruction:"Add the sugar",keyword:"azukrea",hint:"Sweeten generously"},
      {instruction:"Make the walnut sauce",keyword:"intxaursaltsa",hint:"Blend until silky smooth"},
      {instruction:"Boil to thicken",keyword:"egosi",hint:"Stir constantly to avoid burning"},
    ]},
    {name:"Txokolatea eta Sagarra",emoji:"🍫",desc:"Chocolate and apple dessert",color:"#7C2D12",dark:"#431407",bg:"#FFF7ED",stages:[
      {instruction:"Slice the apple",keyword:"sagarra",hint:"Basque apples are tart and crisp"},
      {instruction:"Melt the chocolate",keyword:"txokolatea",hint:"Dark chocolate, minimum 70%"},
      {instruction:"Warm the milk",keyword:"esnea",hint:"For a smooth ganache"},
      {instruction:"Add a pinch of salt",keyword:"gatz",hint:"Salt makes chocolate taste more chocolatey"},
      {instruction:"Serve as dessert",keyword:"afaria",hint:"A sweet end to dinner"},
    ]},
    {name:"Mamia",emoji:"🍮",desc:"Traditional Basque curd dessert",color:"#0F766E",dark:"#134E4A",bg:"#F0FDFA",stages:[
      {instruction:"Warm the sheep's milk",keyword:"esnea",hint:"Sheep's milk gives the richest result"},
      {instruction:"Add the rennet",keyword:"mamia",hint:"The ingredient that sets the curd"},
      {instruction:"Sweeten to taste",keyword:"azukrea",hint:"Just a little: it should be subtle"},
      {instruction:"Serve with walnuts",keyword:"intxaurra",hint:"Crushed walnuts on top is traditional"},
      {instruction:"Taste for sweetness",keyword:"goxoa",hint:"It should be delicately sweet"},
    ]},
    {name:"Pintxo Bar Crawl",emoji:"🍺",desc:"An evening in the Old Town",color:"#1E40AF",dark:"#1E3A8A",bg:"#EFF6FF",stages:[
      {instruction:"Order a pintxo",keyword:"pintxoa",hint:"One bite, one drink: that's the rule"},
      {instruction:"Pour a cold beer",keyword:"garagardoa",hint:"Cerveza or Txakoli: your choice"},
      {instruction:"Find the food",keyword:"janaria",hint:"Every bar has its speciality"},
      {instruction:"Call it dinner",keyword:"afaria",hint:"Pintxos are dinner in the Basque Country"},
      {instruction:"Move to the next bar",keyword:"edan",hint:"To drink: and then repeat"},
    ]},
    {name:"Piperrada Euskalduna",emoji:"🌶️",desc:"The original Basque pepper stew",color:"#B91C1C",dark:"#7F1D1D",bg:"#FFF1F2",stages:[
      {instruction:"This dish is the recipe",keyword:"errezeta",hint:"Piperrada is a B2 word: so is this!"},
      {instruction:"List the ingredients",keyword:"osagai",hint:"Pepper, tomato, onion, oil, egg"},
      {instruction:"Use local produce",keyword:"bertako_produktua",hint:"Basque vegetables are world-class"},
      {instruction:"Apply cooking technique",keyword:"sukalde_teknika",hint:"Low and slow: don't rush it"},
      {instruction:"It is a traditional dish",keyword:"piperrada",hint:"The Basque word for piperade"},
    ]},
    {name:"Ardandegi Bisita",emoji:"🍷",desc:"A visit to a Basque winery",color:"#6B21A8",dark:"#3B0764",bg:"#FAF5FF",stages:[
      {instruction:"Visit the wine cellar",keyword:"ardandegi",hint:"Rioja Alavesa is just south of Bilbao"},
      {instruction:"Taste the wines",keyword:"dastaketa",hint:"A guided tasting: sip, swirl, spit"},
      {instruction:"Learn about gastronomy",keyword:"gastronomia",hint:"Basques take food as seriously as wine"},
      {instruction:"Pour the wine",keyword:"ardoa",hint:"Red Rioja or white Txakoli"},
      {instruction:"Reserve a table",keyword:"mahaia_erreserbatu",hint:"The restaurant is attached to the winery"},
    ]},
    {name:"Bazkaria Etxean",emoji:"🏡",desc:"Sunday lunch at home",color:"#15803D",dark:"#14532D",bg:"#F0FDF4",stages:[
      {instruction:"Prepare Sunday lunch",keyword:"bazkaria",hint:"The most important meal of the week"},
      {instruction:"Sit down to eat",keyword:"bazkaldu",hint:"To have lunch: together, always"},
      {instruction:"Serve the food",keyword:"janaria",hint:"Whatever Ama has cooked"},
      {instruction:"Pour some tea",keyword:"tea",hint:"For those who don't drink wine"},
      {instruction:"Enjoy the meal",keyword:"jan",hint:"Eat well, eat slowly"},
    ]},
  ];

  var _dish=useState(null);var dish=_dish[0];var setDish=_dish[1];
  var _stage=useState(0);var stage=_stage[0];var setStage=_stage[1];
  var _opts=useState([]);var opts=_opts[0];var setOpts=_opts[1];
  var _sel=useState(null);var sel=_sel[0];var setSel=_sel[1];
  var _score=useState(0);var score=_score[0];var setScore=_score[1];
  var _lives=useState(3);var lives=_lives[0];var setLives=_lives[1];
  var _done=useState(false);var done=_done[0];var setDone=_done[1];
  var _streak=useState(0);var streak=_streak[0];var setStreak=_streak[1];
  var _best=useState(0);var best=_best[0];var setBest=_best[1];
  var _dishIdx=useState(0);var dishIdx=_dishIdx[0];var setDishIdx=_dishIdx[1];
  var _showHint=useState(false);var showHint=_showHint[0];var setShowHint=_showHint[1];
  var _completedDishes=useState([]);var completedDishes=_completedDishes[0];var setCompletedDishes=_completedDishes[1];
  var _flash=useState(null);var flash=_flash[0];var setFlash=_flash[1]; // 'correct'|'wrong'
  var scoreRef=React.useRef(0);

  React.useEffect(function(){
    try{window.storage.get('kitchen_best').then(function(r){if(r&&r.value)setBest(parseInt(r.value)||0);}).catch(function(){});}catch(e){}
  },[]);

  function findWord(keyword){
    // Exact id match first, then basque match
    var w=VOCABULARY.find(function(w){return w.id===keyword;});
    if(!w)w=VOCABULARY.find(function(w){return w.basque.toLowerCase()===keyword.toLowerCase();});
    return w||null;
  }

  function buildOptions(currentDish,currentStageIdx){
    var correct=currentDish.stages[currentStageIdx];
    var correctWord=findWord(correct.keyword);
    if(!correctWord)return [];
    // Mix distractors: mostly food A1 but some from other topics for variety
    var foodPool=VOCABULARY.filter(function(w){return w.topic==="food"&&w.id!==correctWord.id&&w.cefr==="A1";});
    var otherPool=VOCABULARY.filter(function(w){return w.topic!=="food"&&w.id!==correctWord.id&&w.cefr==="A1"&&FREE_TOPICS.indexOf(w.topic)!==-1;});
    var distractors=shuffled(foodPool).slice(0,2).concat(shuffled(otherPool).slice(0,1));
    if(distractors.length<3)distractors=shuffled(foodPool).slice(0,3);
    return shuffled([correctWord].concat(distractors.slice(0,3)));
  }

  function startDish(idx){
    var d=DISHES[idx];
    scoreRef.current=0;
    setDish(d);setDishIdx(idx);setStage(0);setSel(null);setDone(false);
    setShowHint(false);setScore(0);setLives(3);setStreak(0);setFlash(null);
    setOpts(buildOptions(d,0));
  }

  function pick(word){
    if(sel)return;
    var correct=dish.stages[stage];
    var correctWord2=findWord(correct.keyword);
    var isCorrect=correctWord2&&word.id===correctWord2.id;
    setSel(word.id);
    if(isCorrect){
      haptic("light");sfx("correct");
      var ns=streak+1;
      var pts=ns>=3?2:1;
      scoreRef.current=scoreRef.current+pts;
      setStreak(ns);
      setScore(scoreRef.current);
      setFlash('correct');
      setTimeout(function(){
        setFlash(null);
        var nextStage=stage+1;
        if(nextStage>=dish.stages.length){
          haptic("success");sfx("complete");
          setCompletedDishes(function(prev){
            if(prev.indexOf(dish.name)===-1)return prev.concat([dish.name]);
            return prev;
          });
          setBest(function(b){
            var nb=Math.max(b,scoreRef.current);
            try{window.storage.set('kitchen_best',String(nb)).catch(function(){});}catch(e){}
            return nb;
          });
          setDone(true);
        }else{
          setStage(nextStage);setSel(null);setShowHint(false);
          setOpts(buildOptions(dish,nextStage));
        }
      },750);
    }else{
      haptic("error");sfx("wrong");
      setStreak(0);
      setFlash('wrong');
      setTimeout(function(){setFlash(null);},500);
      setLives(function(l){
        var nl=l-1;
        if(nl<=0){setTimeout(function(){setDone(true);},700);}
        return nl;
      });
      setTimeout(function(){setSel(null);setShowHint(true);},950);
    }
  }

  var currentStage=dish&&dish.stages[stage];
  var stageProgress=dish?((stage+1)/dish.stages.length*100):0;
  var COLOR=dish?dish.color:"#C2510E";
  var DARK=dish?dish.dark:"#92400E";
  var BG=dish?dish.bg:"#FFF7ED";

  var WORD_EMOJI={
    // Numbers
    "bat":"1️⃣",
    "bi":"2️⃣",
    "hiru":"3️⃣",
    "lau":"4️⃣",
    "bost":"5️⃣",
    "sei":"6️⃣",
    "zazpi":"7️⃣",
    "zortzi":"8️⃣",
    "bederatzi":"9️⃣",
    "hamar":"🔟",
    "hamaika":"1️⃣1️⃣",
    "hamabi":"🕛",
    "hamabost":"🕒",
    "hogei":"🎲",
    "ehun":"💯",
    "mila":"🔢",
    "zenbat":"❓",
    "ordu_bat":"🕐",
    "ordu_biak":"🕑",
    "laurden_gutxi":"⏰",
    "eta_laurdena":"⌚",
    // Question words
    "nola":"🤔",           // how?
    "zer":"❓",            // what?
    "non":"📍",            // where?
    "noiz":"🕐",           // when?
    "nor":"👤",            // who?
    "zergatik":"💭",       // why?
    "zenbat":"🔢",         // how many/much?
    "zer_moduz":"😊",      // how are you?
    "nola_esaten_da":"💬",  // how do you say?
    "zenbat_urte":"🎂",    // how old are you?
    "nongoa":"🌍",         // where are you from?
    "non_dago":"📍",       // where is?
    "zer_berri":"📰",      // what's new?
    // Greetings
    "kaixo":"👋",
    "agur":"👋",
    "egun_on":"🌅",
    "gabon":"🌙",
    "ondo_ibili":"🚶",
    "bai":"✅",
    "ez":"❌",
    "mesedez":"🙏",
    "eskerrik_asko":"🙏",
    "mila_esker":"🙏",
    "barkatu":"😅",
    "ongi_etorri":"🙌",
    "ulertu":"💡",
    "jakin":"🧠",
    "ez_dut_ulertzen":"🤷",
    "badakit":"👍",
    "ogia":"🍞",          // bread
    "gatz":"🧂",           // salt (correct id)
    "gatza":"🧂",          // fallback basque match
    "tomatea":"🍅",        // tomato
    "olioa":"🫒",          // olive oil
    "ongi_etorri":"🙌",    // welcome (id uses underscore)
    "arraina":"🐠",        // fish
    "patata":"🥔",         // potato
    "piperra":"🌶️",        // pepper
    "ura":"💧",            // water
    "jan":"🍽️",            // to eat
    "edan":"🥤",           // to drink
    "azukrea":"🍬",        // sugar — sweet/candy is more recognisable than rice
    "arrautzak":"🥚",      // eggs (plural keyword)
    "arrautza":"🥚",       // egg (id)
    "gurina":"🧈",         // butter
    "esnea":"🥛",          // milk
    "beroa":"🔥",          // hot
    "bacalaoa":"🐡",      // salted cod
    "baratxuria":"🧄",     // garlic
    // Distractors
    "ardoa":"🍷",          // wine
    "sagardoa":"🍶",       // cider
    "janaria":"🍱",        // food
    "pintxoa":"🥖",        // pintxo
    "bazkaria":"☀️",       // lunch
    "afaria":"🌙",         // dinner
    "gosaria":"🌅",        // breakfast
    "oilaskoa":"🍗",       // chicken
    "gazta":"🧀",          // cheese
    "garagardoa":"🍻",     // beer
    "menua":"📋",          // menu
    "kafea":"☕",          // coffee
    "tea":"🍵",            // tea
    "fruta":"🍎",          // fruit
    "barazkia":"🥦",       // vegetable
    "haragia":"🥩",        // meat
    "arroza":"🍚",         // rice
    "sagarra":"🍏",        // apple
    "banana":"🍌",         // banana
    "txokolatea":"🍫",     // chocolate
    "mamia":"🍮",          // curd/junket
    "pintxoa":"🥖",        // pintxo
    "garagardoa":"🍺",     // beer
    "janaria":"🍱",        // food
    "afaria":"🌙",         // dinner
    "edan":"🥤",           // to drink
    "errezeta":"📖",       // recipe
    "osagai":"🧪",         // ingredient
    "bertako_produktua":"🌱", // local produce
    "sukalde_teknika":"👨‍🍳",  // cooking technique
    "piperrada":"🌶️",      // piperade
    "ardandegi":"🍷",      // winery
    "dastaketa":"👅",      // tasting
    "gastronomia":"🍽️",    // gastronomy
    "mahaia_erreserbatu":"📅", // reserve a table
    "bazkaria":"☀️",       // lunch
    "bazkaldu":"🍜",       // to have lunch
    "tea":"🍵",            // tea
    "opila":"🫓",          // flatbread
    "azenarioa":"🥕",      // carrot
    "letxuga":"🥬",        // lettuce
    "txokolatea":"🍫",     // chocolate
    "laranja":"🍊",        // orange
    "gosaldu":"🍳",        // to have breakfast
    "bazkaldu":"🍜",       // to have lunch
    "afaldu":"🍝",         // to have dinner
    // A2 ingredients
    "txakolina":"🍾",      // txakoli wine
    "antxoa":"🐟",         // anchovy
    "gazta":"🧀",          // cheese
    "tortilla":"🍳",       // omelette
    "txerria":"🐷",        // pork
    "merluzea":"🐠",       // hake
    "txuleta":"🥩",        // steak
    "erre":"🔥",           // to grill/roast
    "tortilla":"🍳",       // omelette
    "txotx":"🛢️",          // txotx (cider barrel signal)
    "arroza":"🍚",         // rice
    "esnegaina":"🥛",      // cream
    "egosi":"♨️",          // to boil
    "frijitu":"🫕",        // to fry
    "barazkia":"🥦",       // vegetable
    "menua":"📋",          // menu
    "fruta":"🍎",          // fruit
    "kafea":"☕",          // coffee
    "gosaria":"🌅",        // breakfast
    "gosaldu":"🍳",        // to have breakfast
    "intxaursaltsa":"🥛",  // walnut cream sauce
    "opila":"🫓",          // flatbread
    "babarrunak":"🫘",     // beans
    "onddo":"🍄",          // mushrooms
    "gaztaina":"🌰",       // chestnut
    "intxaurra":"🌰",      // walnut
    "saltsa":"🥫",         // sauce
    "prestatu":"👨‍🍳",      // to prepare
    "oilaskoa":"🍗",       // chicken
    "haragia":"🥩",        // meat
    "urdaia":"🥓",         // bacon
    "merluzea":"🐠",       // hake
    "onddo":"🍄",          // mushrooms
    "intxaurra":"🌰",      // walnut
    "goxoa":"😋",          // tasty/sweet
    "babarrunak":"🫘",     // beans
    // B1 cooking words
    "erre":"🔥",           // to grill/roast
    "egosi":"♨️",          // to boil
    "frijitu":"🫕",        // to fry
    "urdaia":"🥓",         // bacon
    "piperrada":"🌶️",      // piperade
  };
  function getEmoji(word){return WORD_EMOJI[word.id]||WORD_EMOJI[word.basque.toLowerCase()]||"🥘";}

  // ── Menu screen ──
  if(!dish){return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",backgroundColor:"#F2F2F7",fontFamily:"Nunito,system-ui,sans-serif"}}>

      {/* Warm kitchen header */}
      <div style={{background:"linear-gradient(160deg,#92400E,#C2510E,#F97316)",paddingTop:56,paddingLeft:16,paddingRight:16,paddingBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:20,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>Basque Kitchen</p>
            <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:600}}>Cook classic Basque dishes</p>
          </div>
          {best>0&&(
            <div style={{backgroundColor:"rgba(255,255,255,0.2)",borderRadius:12,padding:"5px 11px",border:"1px solid rgba(255,255,255,0.3)",textAlign:"center"}}>
              <p style={{margin:0,fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{best}</p>
              <p style={{margin:0,fontSize:8,color:"rgba(255,255,255,0.7)",fontWeight:700}}>BEST</p>
            </div>
          )}
        </div>
        {completedDishes.length>0?(
          <div style={{backgroundColor:"rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 12px",marginTop:8,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{"\u{1F37D}\uFE0F"}</span>
            <p style={{margin:0,fontSize:12,fontWeight:700,color:"#fff"}}>Served {completedDishes.length} of {DISHES.length} dishes</p>
            <div style={{display:"flex",gap:3,marginLeft:"auto"}}>
              {DISHES.map(function(d,i){return <div key={i} style={{width:8,height:8,borderRadius:"50%",backgroundColor:completedDishes.indexOf(d.name)!==-1?"#fff":"rgba(255,255,255,0.3)"}}/>;  })}
            </div>
          </div>
        ):(
          <p style={{margin:"8px 0 0",fontSize:12,color:"rgba(255,255,255,0.6)",fontWeight:500}}>5 steps per dish · 3 lives · tap to start cooking</p>
        )}
      </div>

      <div style={{padding:"14px"}}>
        {DISHES.map(function(d,i){
          var isDone=completedDishes.indexOf(d.name)!==-1;
          return(
            <button key={i} onClick={function(){startDish(i);}}
              style={{width:"100%",marginBottom:10,borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left",padding:0,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",display:"block"}}>
              <div style={{background:"linear-gradient(135deg,"+d.dark+","+d.color+")",padding:"16px 16px 12px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"16px 16px"}}/>
                {isDone&&(
                  <div style={{position:"absolute",top:10,right:10,backgroundColor:"rgba(255,255,255,0.9)",borderRadius:20,padding:"3px 10px",display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:9}}>✓</span>
                    <span style={{fontSize:10,fontWeight:800,color:d.color}}>Cooked!</span>
                  </div>
                )}
                <div style={{display:"flex",alignItems:"center",gap:12,position:"relative"}}>
                  <div style={{width:56,height:56,borderRadius:16,backgroundColor:"rgba(255,255,255,0.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>{d.emoji}</div>
                  <div style={{flex:1}}>
                    <p style={{margin:0,fontSize:17,fontWeight:900,color:"#fff",letterSpacing:-0.3}}>{d.name}</p>
                    <p style={{margin:"1px 0 0",fontSize:12,color:"rgba(255,255,255,0.75)",fontWeight:500,fontStyle:"italic"}}>{d.desc}</p>
                  </div>
                </div>
                <div style={{display:"flex",gap:4,marginTop:12,position:"relative"}}>
                  {d.stages.map(function(_,si){return <div key={si} style={{flex:1,height:4,borderRadius:2,backgroundColor:"rgba(255,255,255,0.3)"}}/>;  })}
                </div>
              </div>
              <div style={{backgroundColor:isDone?d.bg:"#fff",padding:"9px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <p style={{margin:0,fontSize:11,color:isDone?d.color:"#8E8E93",fontWeight:isDone?700:500}}>{isDone?"✓ Cooked. Cook again?":d.stages.length+" steps to complete"}</p>
                <span style={{fontSize:15,color:d.color,fontWeight:700}}>{"›"}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );}

  // ── Game screen ──
  var correctWord=currentStage?findWord(currentStage.keyword):null;
  var nextDishIdx=(dishIdx+1)%DISHES.length;
  var nextDish=DISHES[nextDishIdx];
  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",fontFamily:"Nunito,system-ui,sans-serif",backgroundColor:BG,transition:"background-color 0.4s ease"}}>

      {/* ── Dish header — tall, immersive ── */}
      <div style={{background:"linear-gradient(160deg,"+DARK+" 0%,"+COLOR+" 100%)",paddingTop:56,paddingLeft:14,paddingRight:14,paddingBottom:18,position:"relative",overflow:"hidden"}}>
        {/* Subtle dot texture */}
        <div style={{position:"absolute",inset:0,opacity:0.06,backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"18px 18px",pointerEvents:"none"}}/>
        {/* Nav row */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,position:"relative"}}>
          <button onClick={function(){setDish(null);}} style={{background:"rgba(255,255,255,0.18)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:16,fontWeight:900,color:"#fff",letterSpacing:-0.3}}>{dish.emoji} {dish.name}</p>
            <p style={{margin:0,fontSize:10,color:"rgba(255,255,255,0.6)",fontWeight:600,fontStyle:"italic"}}>{dish.desc}</p>
          </div>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            {score>0&&(
              <div style={{backgroundColor:"rgba(255,255,255,0.22)",borderRadius:12,padding:"4px 10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.3)"}}>
                <p style={{margin:0,fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{score}</p>
                <p style={{margin:0,fontSize:8,color:"rgba(255,255,255,0.6)",fontWeight:700}}>PTS</p>
              </div>
            )}
            {/* Lives */}
            <div style={{display:"flex",gap:1}}>
              {Array.from({length:3}).map(function(_,i){return(
                <span key={i} style={{fontSize:18,transition:"transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s",transform:i<lives?"scale(1)":"scale(0.45)",opacity:i<lives?1:0.15,display:"block"}}>❤️</span>
              );})}
            </div>
          </div>
        </div>
        {/* Step progress pills */}
        <div style={{display:"flex",gap:5,position:"relative"}}>
          {dish.stages.map(function(s,i){return(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:"100%",height:4,borderRadius:2,backgroundColor:i<stage?"#fff":i===stage?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.22)",transition:"background-color 0.4s ease"}}/>
            </div>
          );})}
        </div>
        <p style={{margin:"8px 0 0",fontSize:10,color:"rgba(255,255,255,0.55)",fontWeight:700,position:"relative"}}>STEP {stage+1} OF {dish.stages.length}</p>
      </div>

      <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>

        {/* ── Done overlay ── */}
        {done&&(
          <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.65)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
            <div style={{backgroundColor:"#fff",borderTopLeftRadius:32,borderTopRightRadius:32,width:"100%",maxWidth:420,margin:"0 auto",paddingBottom:40}}>
              <div style={{width:36,height:4,backgroundColor:"#E0E0E0",borderRadius:2,margin:"12px auto 0"}}/>
              <div style={{padding:"20px 24px 0",textAlign:"center"}}>
                <div style={{width:76,height:76,borderRadius:"50%",background:"linear-gradient(135deg,"+DARK+","+COLOR+")",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:38,boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>{lives>0?dish.emoji:"💔"}</div>
                <p style={{margin:"0 0 2px",fontSize:24,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5}}>{lives>0?"Dish served!":"Dish ruined!"}</p>
                <p style={{margin:"0 0 18px",fontSize:13,color:"#8E8E93"}}>{lives>0?dish.name+", perfection!":"Out of lives. Give it another go"}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                  {[{v:scoreRef.current,l:"Points",c:COLOR},{v:(lives>0?dish.stages.length:stage)+"/"+dish.stages.length,l:"Steps",c:"#1A1A1A"},{v:completedDishes.length+"/"+DISHES.length,l:"Dishes",c:"#19A85A"}].map(function(s){return(
                    <div key={s.l} style={{backgroundColor:"#F2F2F7",borderRadius:14,padding:"12px 6px"}}>
                      <p style={{margin:0,fontSize:20,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</p>
                      <p style={{margin:"3px 0 0",fontSize:10,color:"#8E8E93",fontWeight:700}}>{s.l}</p>
                    </div>
                  );})}
                </div>
                <div style={{display:"flex",gap:8,marginBottom:lives>0?10:0}}>
                  <button onClick={function(){startDish(dishIdx);}} style={{flex:1,padding:"14px",borderRadius:16,border:"2px solid #E8E8E8",backgroundColor:"#fff",color:"#555",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Cook again</button>
                  <button onClick={function(){setDish(null);setDone(false);}} style={{flex:1,padding:"14px",borderRadius:16,border:"none",backgroundColor:COLOR,color:"#fff",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 0 "+DARK}}>Menu</button>
                </div>
                {lives>0&&(
                  <button onClick={function(){startDish(nextDishIdx);}} style={{width:"100%",padding:"13px",borderRadius:16,border:"1.5px solid "+nextDish.color,backgroundColor:nextDish.bg,color:nextDish.color,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                    Next: {nextDish.emoji} {nextDish.name} →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Recipe instruction ── */}
        <div style={{backgroundColor:"#fff",borderRadius:20,padding:"18px 18px 14px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",animation:flash==="wrong"?"shake 0.4s ease":"none",overflow:"hidden",position:"relative"}}>
          {/* Dish color strip at top */}
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+DARK+","+COLOR+")"}}/>
          <p style={{margin:"4px 0 10px",fontSize:20,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.4,lineHeight:1.3}}>{currentStage&&currentStage.instruction}</p>
          {showHint?(
            <div style={{backgroundColor:BG,borderRadius:10,padding:"8px 12px"}}>
              <p style={{margin:0,fontSize:12,color:DARK,fontWeight:700}}>💡 {currentStage&&currentStage.hint}</p>
            </div>
          ):(
            <button onClick={function(){setShowHint(true);}} style={{background:"none",border:"1.5px solid #E8E8E8",borderRadius:20,padding:"4px 14px",fontSize:11,fontWeight:700,color:"#AAA",cursor:"pointer",fontFamily:"inherit"}}>💡 Hint</button>
          )}
        </div>

        {/* ── Streak badge ── */}
        {streak>=3&&flash==="correct"&&(
          <div style={{textAlign:"center",animation:"popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)"}}>
            <span style={{fontSize:13,fontWeight:900,color:DARK,backgroundColor:"#fff",padding:"5px 18px",borderRadius:20,border:"1.5px solid "+COLOR,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>🔥 {streak} in a row! +2 pts</span>
          </div>
        )}

        {/* ── Ingredient options ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {opts.map(function(word,wi){
            var isCorrectOpt=correctWord&&word.id===correctWord.id;
            var isPicked=sel===word.id;
            var showResult=sel!==null;
            var bg=showResult?(isCorrectOpt?"#EDFAF3":isPicked?"#FEF2F2":"#F9FAFB"):"#fff";
            var borderCol=showResult?(isCorrectOpt?"#19A85A":isPicked?"#EF4444":"#E8E8E8"):"#E8E8E8";
            var txtC=showResult?(isCorrectOpt?"#19A85A":isPicked?"#EF4444":"#BBB"):"#1A1A1A";
            var subC=showResult?(isCorrectOpt?"#059669":isPicked?"#EF4444":"#D1D1D6"):"#8E8E93";
            var sc=isPicked&&isCorrectOpt?"scale(1.05)":isPicked?"scale(0.94)":isCorrectOpt&&showResult?"scale(1.02)":"scale(1)";
            var pron=isCorrectOpt&&showResult&&correctWord&&correctWord.pronunciation;
            return(
              <button key={word.id} onClick={function(){pick(word);}}
                style={{padding:"16px 8px 14px",borderRadius:18,border:"2px solid "+borderCol,backgroundColor:bg,cursor:showResult?"default":"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",transform:sc,boxShadow:showResult?"none":"0 2px 12px rgba(0,0,0,0.08)",minHeight:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,animation:"cardIn 0.25s ease "+(wi*0.06)+"s both",position:"relative",overflow:"hidden"}}>
                {/* Subtle tint strip at bottom on result */}
                {showResult&&isCorrectOpt&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,backgroundColor:"#19A85A"}}/>}
                {showResult&&isPicked&&!isCorrectOpt&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,backgroundColor:"#EF4444"}}/>}
                <span style={{fontSize:28,lineHeight:1}}>{getNumEmoji(word)}</span>
                <p style={{margin:"6px 0 0",fontSize:word.basque.length>10?12:15,fontWeight:900,color:txtC,lineHeight:1.2,letterSpacing:-0.2,padding:"0 4px"}}>{word.basque}</p>
                <p style={{margin:"2px 0 0",fontSize:11,color:subC,fontWeight:600}}>{word.english}</p>
                {pron&&<p style={{margin:"3px 0 0",fontSize:9,fontWeight:700,color:"#19A85A",fontStyle:"italic",opacity:0.8}}>{correctWord.pronunciation}</p>}
                {isPicked&&!isCorrectOpt&&showResult&&<span style={{fontSize:16,marginTop:2}}>✗</span>}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
function OrduegiScreen(props){
  var VOCABULARY=_VOCAB;
  var onBack=props.onBack,isPro=props.isPro,onUpgrade=props.onUpgrade;

  var SCENARIOS=[
    {name:"Goizeko Iratzargailua",emoji:"⏰",desc:"Setting the morning alarm",color:"#1D4ED8",dark:"#1E3A8A",bg:"#EFF6FF",stages:[
      {instruction:"Your alarm is set for 7am. Say the number seven",keyword:"zazpi",hint:"Zazpi: seven"},
      {instruction:"You need to be ready in 15 minutes. Say fifteen",keyword:"hamabost",hint:"Hamabost: fifteen"},
      {instruction:"The bus comes every 10 minutes. Say ten",keyword:"hamar",hint:"Hamar: ten"},
      {instruction:"You only have 1 euro for the bus. Say one",keyword:"bat",hint:"Bat: one"},
      {instruction:"You set 2 alarms to be safe. Say two",keyword:"bi",hint:"Bi: two"},
    ]},
    {name:"Merkatuan",emoji:"🛒",desc:"Shopping at the market",color:"#065F46",dark:"#022C22",bg:"#ECFDF5",stages:[
      {instruction:"You want 3 apples. Say three",keyword:"hiru",hint:"Hiru: three"},
      {instruction:"They cost 5 euros each. Say five",keyword:"bost",hint:"Bost: five"},
      {instruction:"You pick up 6 tomatoes. Say six",keyword:"sei",hint:"Sei: six"},
      {instruction:"The vendor asks: how much do you want? Say 'how much'",keyword:"zenbat",hint:"Zenbat: how many / how much"},
      {instruction:"You pay 20 euros. Say twenty",keyword:"hogei",hint:"Hogei: twenty"},
    ]},
    {name:"Autobus Geltokian",emoji:"🚌",desc:"At the bus station",color:"#7C3AED",dark:"#4C1D95",bg:"#F5F3FF",stages:[
      {instruction:"The bus leaves at 7. Say seven",keyword:"zazpi",hint:"Zazpi: seven"},
      {instruction:"You need platform 4. Say four",keyword:"lau",hint:"Lau: four"},
      {instruction:"The journey takes 8 hours. Say eight",keyword:"zortzi",hint:"Zortzi: eight"},
      {instruction:"Your ticket costs 9 euros. Say nine",keyword:"bederatzi",hint:"Bederatzi: nine"},
      {instruction:"It's quarter past the hour. How do you say that?",keyword:"eta_laurdena",hint:"Eta laurdena: quarter past"},
    ]},
    {name:"Jatetxean",emoji:"🍽️",desc:"At the restaurant",color:"#B45309",dark:"#78350F",bg:"#FFFBEB",stages:[
      {instruction:"Book a table for 2. Say two",keyword:"bi",hint:"Bi: two"},
      {instruction:"The menú del día costs 12 euros. Say twelve",keyword:"hamabi",hint:"Hamabi: twelve"},
      {instruction:"You want to leave a tip. Ask for the percentage",keyword:"ehunekoa",hint:"Ehunekoa: percentage"},
      {instruction:"You split the bill in half. Say half",keyword:"erdia",hint:"Erdia: half"},
      {instruction:"The waiter says it's quarter to the hour. How do you say that?",keyword:"laurden_gutxi",hint:"Laurden gutxi: quarter to"},
    ]},
    {name:"Eskolan",emoji:"📚",desc:"At school",color:"#0F766E",dark:"#134E4A",bg:"#F0FDFA",stages:[
      {instruction:"Class starts at 9. Say nine",keyword:"bederatzi",hint:"Bederatzi: nine"},
      {instruction:"You're in classroom 11. Say eleven",keyword:"hamaika",hint:"Hamaika: eleven"},
      {instruction:"There are 20 students. Say twenty",keyword:"hogei",hint:"Hogei: twenty"},
      {instruction:"The test has 15 questions. Say fifteen",keyword:"hamabost",hint:"Hamabost: fifteen"},
      {instruction:"You score 100! Say one hundred",keyword:"ehun",hint:"Ehun: one hundred"},
    ]},
    {name:"Futbol Partida",emoji:"⚽",desc:"Watching a football match",color:"#991B1B",dark:"#7F1D1D",bg:"#FFF1F2",stages:[
      {instruction:"Kick-off is at 6pm. Say six",keyword:"sei",hint:"Sei: six"},
      {instruction:"Athletic Bilbao scores first. Say 'first'",keyword:"lehena",hint:"Lehena: first"},
      {instruction:"Half-time: it's 2-0. Say two",keyword:"bi",hint:"Bi: two"},
      {instruction:"Final whistle: 3 goals scored. Say three",keyword:"hiru",hint:"Hiru: three"},
      {instruction:"1,000 fans are celebrating. Say one thousand",keyword:"mila",hint:"Mila: one thousand"},
    ]},
    {name:"Bankuan",emoji:"🏦",desc:"At the bank",color:"#1E40AF",dark:"#1E3A8A",bg:"#EFF6FF",stages:[
      {instruction:"You deposit 100 euros. Say one hundred",keyword:"ehun",hint:"Ehun: one hundred"},
      {instruction:"The cashier asks for half the form. Say half",keyword:"erdia",hint:"Erdia: half"},
      {instruction:"You withdraw 40 euros. Say forty",keyword:"berrogei",hint:"Berrogei: forty"},
      {instruction:"The fee is 50 cents. Say fifty",keyword:"berrogeita_hamar",hint:"Berrogeita hamar: fifty"},
      {instruction:"Your new balance: 1,000 euros. Say one thousand",keyword:"mila",hint:"Mila: one thousand"},
    ]},
    {name:"Eguraldia",emoji:"🌡️",desc:"Checking the weather forecast",color:"#0369A1",dark:"#0C4A6E",bg:"#EFF6FF",stages:[
      {instruction:"Temperature: 12 degrees. Say twelve",keyword:"hamabi",hint:"Hamabi: twelve"},
      {instruction:"Rain chance: 50%. Say fifty percent",keyword:"ehuneko_berrogeita_hamar",hint:"Ehuneko berrogeita hamar: fifty percent"},
      {instruction:"Wind: 30 km/h. Say thirty",keyword:"hogeitahamar",hint:"Hogeita hamar: thirty"},
      {instruction:"UV index: 11. Say eleven",keyword:"hamaika",hint:"Hamaika: eleven"},
      {instruction:"Rain for half the day. Say half",keyword:"erdia",hint:"Erdia: half"},
    ]},
    {name:"Telefonoz",emoji:"📱",desc:"On the phone",color:"#0891B2",dark:"#155E75",bg:"#ECFEFF",stages:[
      {instruction:"Your phone number starts with 6. Say six",keyword:"sei",hint:"Sei: six"},
      {instruction:"The area code is 9 digits. Say nine",keyword:"bederatzi",hint:"Bederatzi: nine"},
      {instruction:"You wait on hold for 8 minutes. Say eight",keyword:"zortzi",hint:"Zortzi: eight"},
      {instruction:"Press option 1 for Basque. Say one",keyword:"bat",hint:"Bat: one"},
      {instruction:"They call back in 20 minutes. Say twenty",keyword:"hogei",hint:"Hogei: twenty"},
    ]},
    {name:"Kiroldegian",emoji:"🏊",desc:"At the sports center",color:"#0D9488",dark:"#134E4A",bg:"#F0FDFA",stages:[
      {instruction:"The pool opens at 7am. Say seven",keyword:"zazpi",hint:"Zazpi: seven"},
      {instruction:"You swim 10 lengths. Say ten",keyword:"hamar",hint:"Hamar: ten"},
      {instruction:"Membership costs 30 euros. Say thirty",keyword:"hogeitahamar",hint:"Hogeita hamar: thirty"},
      {instruction:"The gym has 5 treadmills. Say five",keyword:"bost",hint:"Bost: five"},
      {instruction:"Your heart rate is 100bpm. Say one hundred",keyword:"ehun",hint:"Ehun: one hundred"},
    ]},
    {name:"Jaiegunean",emoji:"🎉",desc:"Planning a celebration",color:"#7C3AED",dark:"#4C1D95",bg:"#F5F3FF",stages:[
      {instruction:"The party starts at 9pm. Say nine",keyword:"bederatzi",hint:"Bederatzi: nine"},
      {instruction:"You invite 12 friends. Say twelve",keyword:"hamabi",hint:"Hamabi: twelve"},
      {instruction:"Buy 2 bottles of wine. Say two",keyword:"bi",hint:"Bi: two"},
      {instruction:"The birthday cake has 40 candles. Say forty",keyword:"berrogei",hint:"Berrogei: forty"},
      {instruction:"You toast at midnight, it's 12 o'clock!",keyword:"hamabi",hint:"Hamabi: twelve o'clock, midnight!"},
    ]},
    {name:"Ospitalean",emoji:"🏥",desc:"At the hospital",color:"#DC2626",dark:"#991B1B",bg:"#FFF1F2",stages:[
      {instruction:"Your appointment is at 11am. Say eleven",keyword:"hamaika",hint:"Hamaika: eleven"},
      {instruction:"Ward number 4. Say four",keyword:"lau",hint:"Lau: four"},
      {instruction:"The doctor asks your age. You're 30. Say thirty",keyword:"hogeitahamar",hint:"Hogeita hamar: thirty"},
      {instruction:"Take the medicine 3 times a day. Say three",keyword:"hiru",hint:"Hiru: three"},
      {instruction:"Come back in 15 days. Say fifteen",keyword:"hamabost",hint:"Hamabost: fifteen"},
    ]},
  ];

  var _scenario=useState(null);var scenario=_scenario[0];var setScenario=_scenario[1];
  var _scenIdx=useState(0);var scenIdx=_scenIdx[0];var setScenIdx=_scenIdx[1];
  var _stage=useState(0);var stage=_stage[0];var setStage=_stage[1];
  var _opts=useState([]);var opts=_opts[0];var setOpts=_opts[1];
  var _sel=useState(null);var sel=_sel[0];var setSel=_sel[1];
  var _score=useState(0);var score=_score[0];var setScore=_score[1];
  var _lives=useState(3);var lives=_lives[0];var setLives=_lives[1];
  var _done=useState(false);var done=_done[0];var setDone=_done[1];
  var _timerSecs=useState(8);var timerSecs=_timerSecs[0];var setTimerSecs=_timerSecs[1];
  var _streak=useState(0);var streak=_streak[0];var setStreak=_streak[1];
  var _best=useState(0);var best=_best[0];var setBest=_best[1];
  var _completed=useState([]);var completed=_completed[0];var setCompleted=_completed[1];
  var _showHint=useState(false);var showHint=_showHint[0];var setShowHint=_showHint[1];
  var _flash=useState(null);var flash=_flash[0];var setFlash=_flash[1];
  var scoreRef=React.useRef(0);
  var timerRef=React.useRef(null);
  var MAX_SECS=8;

  // Map keyword → display numeral for big visual
  var NUMERAL={bat:"1",bi:"2",hiru:"3",lau:"4",bost:"5",sei:"6",zazpi:"7",zortzi:"8",
    bederatzi:"9",hamar:"10",hamaika:"11",hamabi:"12",hamabost:"15",hogei:"20",
    hogeitahamar:"30",berrogei:"40",berrogeita_hamar:"50",ehun:"100",mila:"1,000",
    erdia:"½",ehunekoa:"%",ehuneko_berrogeita_hamar:"50%",ordu_bat:"1:00",
    ordu_biak:"2:00",laurden_gutxi:"¼ to",eta_laurdena:"¼ past",zenbat:"?",
    lehena:"1st",bigarrena:"2nd",hirugarrena:"3rd"};

  // Smart distractors: nearby numbers for each keyword
  var NEARBY={
    bat:["bi","hiru","lau"],bi:["bat","hiru","lau"],hiru:["bi","lau","bost"],
    lau:["hiru","bost","sei"],bost:["lau","sei","zazpi"],sei:["bost","zazpi","zortzi"],
    zazpi:["sei","zortzi","bederatzi"],zortzi:["zazpi","bederatzi","hamar"],
    bederatzi:["zortzi","hamar","hamaika"],hamar:["bederatzi","hamaika","hamabi"],
    hamaika:["hamar","hamabi","hamabost"],hamabi:["hamaika","hamabost","hogei"],
    hamabost:["hamabi","hogei","hogeitahamar"],hogei:["hamabost","hogeitahamar","berrogei"],
    hogeitahamar:["hogei","berrogei","berrogeita_hamar"],berrogei:["hogeitahamar","berrogeita_hamar","ehun"],
    berrogeita_hamar:["berrogei","ehun","mila"],ehun:["berrogeita_hamar","mila","hogei"],
    mila:["ehun","berrogeita_hamar","hogei"],erdia:["ehunekoa","zenbat","bat"],
    ehunekoa:["ehuneko_berrogeita_hamar","erdia","hamar"],
    ehuneko_berrogeita_hamar:["ehunekoa","erdia","hogei"],
    ordu_bat:["ordu_biak","eta_laurdena","laurden_gutxi"],
    ordu_biak:["ordu_bat","eta_laurdena","laurden_gutxi"],
    eta_laurdena:["laurden_gutxi","ordu_bat","ordu_biak"],
    laurden_gutxi:["eta_laurdena","ordu_bat","ordu_biak"],
    zenbat:["bat","bi","hiru"],lehena:["bigarrena","hirugarrena","lau"],
    bigarrena:["lehena","hirugarrena","lau"],hirugarrena:["lehena","bigarrena","lau"],
  };

  React.useEffect(function(){
    try{window.storage.get('ordutegi_best').then(function(r){if(r&&r.value)setBest(parseInt(r.value)||0);}).catch(function(){});}catch(e){}
    return function(){clearInterval(timerRef.current);};
  },[]);

  function findWord(keyword){
    var w=VOCABULARY.find(function(w){return w.id===keyword;});
    if(!w)w=VOCABULARY.find(function(w){return w.basque.toLowerCase()===keyword.toLowerCase();});
    return w||null;
  }

  function buildOptions(scen,stageIdx){
    var correctWord=findWord(scen.stages[stageIdx].keyword);
    if(!correctWord)return [];
    var nearby=(NEARBY[correctWord.id]||[]).map(function(id){return findWord(id);}).filter(Boolean);
    if(nearby.length<3){
      var extra=shuffled(VOCABULARY.filter(function(w){
        return w.topic==="numbers"&&w.id!==correctWord.id&&w.cefr==="A1"&&nearby.indexOf(w)===-1;
      })).slice(0,3-nearby.length);
      nearby=nearby.concat(extra);
    }
    return shuffled([correctWord].concat(nearby.slice(0,3)));
  }

  function startTimer(){
    clearInterval(timerRef.current);
    setTimerSecs(MAX_SECS);
    timerRef.current=setInterval(function(){
      setTimerSecs(function(t){
        if(t<=1){
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t-1;
      });
    },1000);
  }

  function handleTimeout(){
    // Time's up — lose a life, show the hint, let them retry the same step
    haptic("error");sfx("wrong");
    setStreak(0);setFlash('wrong');
    setTimeout(function(){setFlash(null);},500);
    setLives(function(l){
      var nl=l-1;
      if(nl<=0){
        sfx("fail");setTimeout(function(){setDone(true);},700);
      }else{
        // Restart the timer for a retry, with the hint now visible
        setTimeout(function(){setShowHint(true);startTimer();},400);
      }
      return nl;
    });
  }

  function startScenario(idx){
    var s=SCENARIOS[idx];
    scoreRef.current=0;
    clearInterval(timerRef.current);
    setScenario(s);setScenIdx(idx);setStage(0);setSel(null);setDone(false);
    setShowHint(false);setScore(0);setLives(3);setStreak(0);setFlash(null);
    setOpts(buildOptions(s,0));
    startTimer();
  }

  function pick(word){
    if(sel||timerSecs===0)return;
    clearInterval(timerRef.current);
    var correctWord=findWord(scenario.stages[stage].keyword);
    var isCorrect=correctWord&&word.id===correctWord.id;
    setSel(word.id);
    if(isCorrect){
      haptic("light");sfx("correct");
      var ns=streak+1;var pts=ns>=3?2:1;
      scoreRef.current=scoreRef.current+pts;
      setStreak(ns);setScore(scoreRef.current);setFlash('correct');
      setTimeout(function(){
        setFlash(null);
        var next=stage+1;
        if(next>=scenario.stages.length){
          haptic("success");sfx("complete");
          clearInterval(timerRef.current);
          setCompleted(function(prev){return prev.indexOf(scenario.name)===-1?prev.concat([scenario.name]):prev;});
          setBest(function(b){
            var nb=Math.max(b,scoreRef.current);
            try{window.storage.set('ordutegi_best',String(nb)).catch(function(){});}catch(e){}
            return nb;
          });
          setDone(true);
        }else{
          setStage(next);setSel(null);setShowHint(false);
          setOpts(buildOptions(scenario,next));
          startTimer();
        }
      },750);
    }else{
      haptic("error");sfx("wrong");
      setStreak(0);setFlash('wrong');
      setTimeout(function(){setFlash(null);},500);
      var willDie=lives-1<=0;
      setLives(function(l){var nl=l-1;if(nl<=0){sfx("fail");setTimeout(function(){setDone(true);},700);}return nl;});
      if(!willDie){
        setTimeout(function(){setSel(null);setShowHint(true);startTimer();},950);
      }
    }
  }

  var currentStage=scenario&&scenario.stages[stage];
  var correctWord=currentStage?findWord(currentStage.keyword):null;
  var COLOR=scenario?scenario.color:"#0369A1";
  var DARK=scenario?scenario.dark:"#0C4A6E";
  var BG=scenario?scenario.bg:"#EFF6FF";
  var nextIdx=(scenIdx+1)%SCENARIOS.length;
  var nextScen=SCENARIOS[nextIdx];
  var timerPct=timerSecs/MAX_SECS*100;
  var timerColor=timerSecs<=2?"#EF4444":timerSecs<=4?"#F97316":COLOR;

  // Number emoji map
  var NUM_EMOJI={"bat":"1️⃣","bi":"2️⃣","hiru":"3️⃣","lau":"4️⃣","bost":"5️⃣","sei":"6️⃣","zazpi":"7️⃣","zortzi":"8️⃣","bederatzi":"9️⃣","hamar":"🔟","hamaika":"🔢","hamabi":"🕛","hamabost":"🕒","hogei":"🎲","ehun":"💯","mila":"🏦","zenbat":"❓","ordu_bat":"🕐","ordu_biak":"🕑","laurden_gutxi":"⏰","eta_laurdena":"⌚","erdia":"½","ehunekoa":"📊","ehuneko_berrogeita_hamar":"50%","berrogei":"4️⃣0️⃣","berrogeita_hamar":"5️⃣0️⃣","hogeitahamar":"3️⃣0️⃣","lehena":"🥇","bigarrena":"🥈","hirugarrena":"🥉",
    "urdina":"🔵","berdea":"🟢","horia":"🟡","gorria":"🔴","zuria":"⚪","beltza":"⚫","morea":"🟣","laranja":"🟠","arrosa":"🩷","marroia":"🟤","gris":"⬛","urrea":"🥇","zilarra":"🥈","kolore":"🎨","berdexka":"💚","urdina_iluna":"💙","urdin_argia":"🩵","zuri_horia":"🤍","hori_iluna":"✨","gorrigorria":"❤️‍🔥","beltz_beltza":"🖤","zuri_zuria":"🤍","berde_iluna":"🌲","more_iluna":"💜","turkoisa":"🩵","indigo":"🌊","granatea":"❤️","oliba_berdea":"🫒","beixa":"🏜️"
  };
  function getNumEmoji(word){return NUM_EMOJI[word.id]||"🔢";}

  // ── Menu screen ──
  if(!scenario){return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",backgroundColor:"#F2F2F7",fontFamily:"Nunito,system-ui,sans-serif"}}>
      <div style={{background:"linear-gradient(160deg,#0C4A6E,#0369A1,#0EA5E9)",paddingTop:56,paddingLeft:16,paddingRight:16,paddingBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:20,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>🕐 Ordutegi</p>
            <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.65)",fontWeight:600}}>Numbers & time in real life</p>
          </div>
          {best>0&&<div style={{backgroundColor:"rgba(255,255,255,0.2)",borderRadius:12,padding:"5px 11px",border:"1px solid rgba(255,255,255,0.3)",textAlign:"center"}}>
            <p style={{margin:0,fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{best}</p>
            <p style={{margin:0,fontSize:8,color:"rgba(255,255,255,0.65)",fontWeight:700}}>BEST</p>
          </div>}
        </div>
        {completed.length>0?(
          <div style={{backgroundColor:"rgba(255,255,255,0.12)",borderRadius:12,padding:"8px 12px",marginTop:8,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>✅</span>
            <p style={{margin:0,fontSize:12,fontWeight:700,color:"#fff"}}>Completed {completed.length} of {SCENARIOS.length} scenarios</p>
            <div style={{display:"flex",gap:3,marginLeft:"auto"}}>
              {SCENARIOS.map(function(s,i){return <div key={i} style={{width:8,height:8,borderRadius:"50%",backgroundColor:completed.indexOf(s.name)!==-1?"#fff":"rgba(255,255,255,0.25)"}}/>;  })}
            </div>
          </div>
        ):(
          <p style={{margin:"8px 0 0",fontSize:12,color:"rgba(255,255,255,0.55)",fontWeight:500}}>5 steps per scenario · 3 lives · tap to begin</p>
        )}
      </div>

      <div style={{padding:"14px"}}>
        {SCENARIOS.map(function(s,i){
          var isDone=completed.indexOf(s.name)!==-1;
          return(
            <button key={i} onClick={function(){startScenario(i);}}
              style={{width:"100%",marginBottom:10,borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left",padding:0,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",display:"block"}}>
              <div style={{background:"linear-gradient(135deg,"+s.dark+","+s.color+")",padding:"15px 16px 12px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"16px 16px"}}/>
                {isDone&&<div style={{position:"absolute",top:10,right:10,backgroundColor:"rgba(255,255,255,0.9)",borderRadius:20,padding:"3px 10px"}}><span style={{fontSize:10,fontWeight:800,color:s.color}}>✓ Done</span></div>}
                <div style={{display:"flex",alignItems:"center",gap:12,position:"relative"}}>
                  <div style={{width:50,height:50,borderRadius:14,backgroundColor:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{s.emoji}</div>
                  <div style={{flex:1}}>
                    <p style={{margin:0,fontSize:15,fontWeight:900,color:"#fff",letterSpacing:-0.3}}>{s.name}</p>
                    <p style={{margin:"1px 0 0",fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:500,fontStyle:"italic"}}>{s.desc}</p>
                  </div>
                </div>
                <div style={{display:"flex",gap:4,marginTop:10,position:"relative"}}>
                  {s.stages.map(function(_,si){return <div key={si} style={{flex:1,height:3,borderRadius:2,backgroundColor:"rgba(255,255,255,0.3)"}}/>;  })}
                </div>
              </div>
              <div style={{backgroundColor:isDone?s.bg:"#fff",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <p style={{margin:0,fontSize:11,color:isDone?s.color:"#8E8E93",fontWeight:isDone?700:500}}>{isDone?"✓ Complete. Try again?":s.stages.length+" steps"}</p>
                <span style={{fontSize:15,color:s.color,fontWeight:700}}>{"›"}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );}

  // ── Game screen ──
  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",fontFamily:"Nunito,system-ui,sans-serif",backgroundColor:BG,transition:"background-color 0.4s ease"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(160deg,"+DARK+" 0%,"+COLOR+" 100%)",paddingTop:56,paddingLeft:14,paddingRight:14,paddingBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:0.05,backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"18px 18px",pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,position:"relative"}}>
          <button onClick={function(){setScenario(null);}} style={{background:"rgba(255,255,255,0.18)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:15,fontWeight:900,color:"#fff",letterSpacing:-0.3}}>{scenario.emoji} {scenario.name}</p>
            <p style={{margin:0,fontSize:10,color:"rgba(255,255,255,0.6)",fontStyle:"italic"}}>{scenario.desc}</p>
          </div>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            {score>0&&<div style={{backgroundColor:"rgba(255,255,255,0.2)",borderRadius:12,padding:"4px 10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.3)"}}>
              <p style={{margin:0,fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{score}</p>
              <p style={{margin:0,fontSize:8,color:"rgba(255,255,255,0.6)",fontWeight:700}}>PTS</p>
            </div>}
            <div style={{display:"flex",gap:1}}>
              {Array.from({length:3}).map(function(_,i){return(
                <span key={i} style={{fontSize:16,transition:"transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s",transform:i<lives?"scale(1)":"scale(0.45)",opacity:i<lives?1:0.15}}>❤️</span>
              );})}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:5,position:"relative"}}>
          {scenario.stages.map(function(_,i){return(
            <div key={i} style={{flex:1,height:4,borderRadius:2,backgroundColor:i<stage?"rgba(255,255,255,0.9)":i===stage?"#fff":"rgba(255,255,255,0.22)",transition:"background-color 0.4s ease"}}/>
          );})}
        </div>
        <p style={{margin:"6px 0 0",fontSize:10,color:"rgba(255,255,255,0.5)",fontWeight:700,position:"relative"}}>STEP {stage+1} OF {scenario.stages.length}</p>
      </div>

      {/* Timer bar */}
      <div style={{height:5,backgroundColor:"rgba(0,0,0,0.08)"}}>
        <div style={{height:"100%",backgroundColor:timerColor,width:timerPct+"%",transition:"width 1s linear, background-color 0.3s",borderRadius:"0 3px 3px 0",boxShadow:timerSecs<=3?"0 0 8px "+timerColor+"88":"none"}}/>
      </div>

      <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>

        {/* Done overlay */}
        {done&&(
          <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.65)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
            <div style={{backgroundColor:"#fff",borderTopLeftRadius:32,borderTopRightRadius:32,width:"100%",maxWidth:420,margin:"0 auto",paddingBottom:40}}>
              <div style={{width:36,height:4,backgroundColor:"#E0E0E0",borderRadius:2,margin:"12px auto 0"}}/>
              <div style={{padding:"20px 24px 0",textAlign:"center"}}>
                <div style={{width:76,height:76,borderRadius:"50%",background:"linear-gradient(135deg,"+DARK+","+COLOR+")",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:38,boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>{lives>0?scenario.emoji:"💔"}</div>
                <p style={{margin:"0 0 2px",fontSize:24,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5}}>{lives>0?"Scenario complete!":"Out of lives!"}</p>
                <p style={{margin:"0 0 18px",fontSize:13,color:"#8E8E93"}}>{lives>0?scenario.name+", well done!":"Give it another go"}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                  {[{v:scoreRef.current,l:"Points",c:COLOR},{v:(lives>0?scenario.stages.length:stage)+"/"+scenario.stages.length,l:"Steps",c:"#1A1A1A"},{v:completed.length+"/"+SCENARIOS.length,l:"Done",c:"#19A85A"}].map(function(s){return(
                    <div key={s.l} style={{backgroundColor:"#F2F2F7",borderRadius:14,padding:"12px 6px"}}>
                      <p style={{margin:0,fontSize:20,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</p>
                      <p style={{margin:"3px 0 0",fontSize:10,color:"#8E8E93",fontWeight:700}}>{s.l}</p>
                    </div>
                  );})}
                </div>
                <div style={{display:"flex",gap:8,marginBottom:lives>0?10:0}}>
                  <button onClick={function(){startScenario(scenIdx);}} style={{flex:1,padding:"14px",borderRadius:16,border:"2px solid #E8E8E8",backgroundColor:"#fff",color:"#555",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Play again</button>
                  <button onClick={function(){setScenario(null);setDone(false);}} style={{flex:1,padding:"14px",borderRadius:16,border:"none",backgroundColor:COLOR,color:"#fff",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 0 "+DARK}}>Menu</button>
                </div>
                {lives>0&&<button onClick={function(){startScenario(nextIdx);}} style={{width:"100%",padding:"13px",borderRadius:16,border:"1.5px solid "+nextScen.color,backgroundColor:nextScen.bg,color:nextScen.color,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                  Next: {nextScen.emoji} {nextScen.name} →
                </button>}
              </div>
            </div>
          </div>
        )}

        {/* Situation card */}
        <div style={{backgroundColor:"#fff",borderRadius:20,padding:"18px 18px 14px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",animation:flash==="wrong"?"shake 0.4s ease":"none",overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+DARK+","+COLOR+")"}}/>
          <p style={{margin:"4px 0 10px",fontSize:19,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.4,lineHeight:1.3}}>{currentStage&&currentStage.instruction}</p>
          {showHint?(
            <div style={{backgroundColor:BG,borderRadius:10,padding:"8px 12px"}}>
              <p style={{margin:0,fontSize:12,color:DARK,fontWeight:700}}>💡 {currentStage&&currentStage.hint}</p>
            </div>
          ):(
            <button onClick={function(){setShowHint(true);}} style={{background:"none",border:"1.5px solid #E8E8E8",borderRadius:20,padding:"4px 14px",fontSize:11,fontWeight:700,color:"#AAA",cursor:"pointer",fontFamily:"inherit"}}>💡 Hint</button>
          )}
        </div>

        {/* Streak */}
        {streak>=3&&flash==="correct"&&(
          <div style={{textAlign:"center",animation:"popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)"}}>
            <span style={{fontSize:13,fontWeight:900,color:DARK,backgroundColor:"#fff",padding:"5px 18px",borderRadius:20,border:"1.5px solid "+COLOR,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>🔥 {streak} in a row! +2 pts</span>
          </div>
        )}

        {/* Number options */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {opts.map(function(word,wi){
            var isCorrectOpt=correctWord&&word.id===correctWord.id;
            var isPicked=sel===word.id;
            var showResult=sel!==null||timerSecs===0;
            var bg=showResult?(isCorrectOpt?"#EDFAF3":isPicked?"#FEF2F2":"#F9FAFB"):"#fff";
            var borderCol=showResult?(isCorrectOpt?"#19A85A":isPicked?"#EF4444":"#E8E8E8"):"#E8E8E8";
            var txtC=showResult?(isCorrectOpt?"#19A85A":isPicked?"#EF4444":"#BBB"):"#1A1A1A";
            var subC=showResult?(isCorrectOpt?"#059669":isPicked?"#EF4444":"#D1D1D6"):"#8E8E93";
            var numC=showResult?(isCorrectOpt?COLOR:isPicked?"#EF4444":"#D1D1D6"):COLOR;
            var sc=isPicked&&isCorrectOpt?"scale(1.05)":isPicked?"scale(0.94)":isCorrectOpt&&showResult?"scale(1.02)":"scale(1)";
            var numeral=NUMERAL[word.id]||word.english;
            return(
              <button key={word.id} onClick={function(){pick(word);}}
                style={{padding:"14px 8px 12px",borderRadius:18,border:"2px solid "+borderCol,backgroundColor:bg,cursor:showResult?"default":"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",transform:sc,boxShadow:showResult?"none":"0 2px 12px rgba(0,0,0,0.08)",minHeight:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,animation:"cardIn 0.25s ease "+(wi*0.06)+"s both",position:"relative",overflow:"hidden"}}>
                {showResult&&isCorrectOpt&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,backgroundColor:"#19A85A"}}/>}
                {showResult&&isPicked&&!isCorrectOpt&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,backgroundColor:"#EF4444"}}/>}
                {/* Big numeral */}
                <p style={{margin:0,fontSize:numeral.length>4?18:numeral.length>2?24:28,fontWeight:900,color:numC,lineHeight:1,letterSpacing:-1}}>{numeral}</p>
                {/* Basque word */}
                <p style={{margin:"6px 0 0",fontSize:word.basque.length>12?11:13,fontWeight:900,color:txtC,lineHeight:1.2,letterSpacing:-0.2}}>{word.basque}</p>
                <p style={{margin:"2px 0 0",fontSize:9,color:subC,fontWeight:600}}>{word.english}</p>
                {isCorrectOpt&&showResult&&sel&&<p style={{margin:"2px 0 0",fontSize:9,fontWeight:700,color:"#19A85A"}}>✓</p>}
                {isPicked&&!isCorrectOpt&&showResult&&<p style={{margin:"2px 0 0",fontSize:9,fontWeight:700,color:"#EF4444"}}>✗</p>}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
function KoloreakScreen(props){
  var VOCABULARY=_VOCAB;
  var onBack=props.onBack,isPro=props.isPro,onUpgrade=props.onUpgrade;

  // Color map: vocabulary id → hex color
  // Abstract concept words excluded (no visual swatch possible)
  var COLOR_HEX={
    // A1 basics
    "beltza":"#2D2D2D",        // black — slightly off-black so visible on dark bg
    "urdina":"#3B82F6",        // blue
    "berdea":"#22C55E",        // green
    "laranja":"#F97316",       // orange
    "arrosa":"#F472B6",        // pink
    "morea":"#A855F7",         // purple
    "gorria":"#EF4444",        // red
    "zuria":"#E5E5E5",         // white — off-white so visible on white bg
    "horia":"#EAB308",         // yellow
    // A2 shades
    "marroia":"#92400E",       // brown
    "gris":"#9CA3AF",          // gray
    "zilarra":"#C0C0C0",       // silver
    "urdina_iluna":"#1E3A8A",  // dark blue — much darker than urdina
    "urdin_argia":"#BAE6FD",   // light blue / sky blue — very light
    "hori_iluna":"#B45309",    // golden / dark yellow
    "berdexka":"#86EFAC",      // greenish — lighter than berdea
    "zuri_horia":"#FEF08A",    // cream/off-white — more yellow than zuria
    // B1 shades
    "urrea":"#F59E0B",         // gold
    "gorrigorria":"#991B1B",   // scarlet — much darker than gorria
    "berde_iluna":"#14532D",   // forest green — much darker than berdea
    "more_iluna":"#581C87",    // dark purple — much darker than morea
    "beltz_beltza":"#000000",  // jet black — pure vs beltza which is dark gray
    "zuri_zuria":"#FFFFFF",    // pure white — vs zuria which is off-white
    "hori_argia":"#FEF9C3",    // pale yellow
    "urdinaxka":"#93C5FD",     // blue-gray
    "krema_kolorea":"#FEF3C7", // cream
    "zilarra_kolorea":"#D1D5DB", // silver gray
    // B2
    "turkoisa":"#06B6D4",      // turquoise
    "indigo":"#4338CA",        // indigo
    "granatea":"#9F1239",      // garnet dark red
    "oliba_berdea":"#65A30D",  // olive green
    "beixa":"#D4B896",         // beige
  };

  // Words that can't be a swatch (abstract concepts) — excluded from pool
  var ABSTRACT_IDS=["kolore","kolorea_galdu","ñabardura","kolore_biziak","koloregabea","distiratsua","kolore_argia","kolore_iluna"];

  // Similar-looking color pairs — never show together as distractors
  var SIMILAR_PAIRS=[
    ["gorria","gorrigorria"],
    ["beltza","beltz_beltza"],
    ["zuria","zuri_zuria"],
    ["zilarra","zilarra_kolorea"],
    ["urdina","urdina_iluna"],
    ["urdin_argia","urdinaxka"],
    ["hori_argia","zuri_horia","krema_kolorea"],
  ];

  // Two modes: SEE color → tap word | SEE word → tap color swatch
  var _mode=useState("swatch_to_word");var mode=_mode[0];var setMode=_mode[1];
  var _question=useState(null);var question=_question[0];var setQuestion=_question[1];
  var _opts=useState([]);var opts=_opts[0];var setOpts=_opts[1];
  var _sel=useState(null);var sel=_sel[0];var setSel=_sel[1];
  var _score=useState(0);var score=_score[0];var setScore=_score[1];
  var _total=useState(0);var total=_total[0];var setTotal=_total[1];
  var _streak=useState(0);var streak=_streak[0];var setStreak=_streak[1];
  var _best=useState(0);var best=_best[0];var setBest=_best[1];
  var _active=useState(false);var active=_active[0];var setActive=_active[1];
  var _won=useState(false);var won=_won[0];var setWon=_won[1];
  var _level=useState("A1");var level=_level[0];var setLevel=_level[1];
  var _rounds=useState(10);var rounds=_rounds[0];var setRounds=_rounds[1];
  var _showResult=useState(false);var showResult=_showResult[0];var setShowResult=_showResult[1];
  var scoreRef=React.useRef(0);
  var lastQuestionId=React.useRef(null);

  React.useEffect(function(){
    try{window.storage.get('koloreak_best').then(function(r){if(r&&r.value)setBest(parseInt(r.value)||0);}).catch(function(){});}catch(e){}
  },[]);

  function getPool(){
    var levels=level==="A1"?["A1"]:level==="A2"?["A1","A2"]:["A1","A2","B1","B2"];
    return VOCABULARY.filter(function(w){
      return w.topic==="colors"
        &&levels.indexOf(w.cefr)!==-1
        &&COLOR_HEX[w.id]
        &&ABSTRACT_IDS.indexOf(w.id)===-1;
    });
  }

  function getSimilarGroup(id){
    for(var i=0;i<SIMILAR_PAIRS.length;i++){
      if(SIMILAR_PAIRS[i].indexOf(id)!==-1)return SIMILAR_PAIRS[i];
    }
    return [];
  }

  function nextQuestion(pool,currentTotal){
    if(currentTotal>=rounds){
      var final=scoreRef.current;
      setBest(function(b){
        var nb=Math.max(b,final);
        try{window.storage.set('koloreak_best',String(nb)).catch(function(){});}catch(e){}
        return nb;
      });
      setWon(true);setActive(false);return;
    }
    // Exclude last question to prevent repeats
    var available=pool.filter(function(w){return w.id!==lastQuestionId.current;});
    if(!available.length)available=pool;
    var q=available[Math.floor(Math.random()*available.length)];
    lastQuestionId.current=q.id;
    var similarGroup=getSimilarGroup(q.id);
    var safePool=pool.filter(function(w){
      return w.id!==q.id&&similarGroup.indexOf(w.id)===-1;
    });
    var distractors=shuffled(safePool).slice(0,3);
    setQuestion(q);
    setOpts(shuffled([q].concat(distractors)));
    setSel(null);setShowResult(false);
  }

  function start(){
    scoreRef.current=0;
    lastQuestionId.current=null;
    setScore(0);setTotal(0);setStreak(0);setWon(false);setActive(true);setSel(null);setShowResult(false);
    var pool=getPool();
    nextQuestion(pool,0);
  }

  function pick(word){
    if(sel||showResult||!question)return;
    var isCorrect=word.id===question.id;
    setSel(word.id);setShowResult(true);
    if(isCorrect){
      haptic("light");sfx("correct");
      var ns=streak+1;var pts=ns>=3?2:1;
      scoreRef.current=scoreRef.current+pts;
      setStreak(ns);setScore(scoreRef.current);
    }else{
      haptic("error");sfx("wrong");
      setStreak(0);
    }
    setTimeout(function(){
      var nt=total+1;
      setTotal(nt);
      nextQuestion(getPool(),nt);
    },900);
  }

  var isSwatchMode=mode==="swatch_to_word";
  var qColor=question&&COLOR_HEX[question.id];
  var previewColors=Object.values(COLOR_HEX).slice(0,9);
  var activeBg="#F5F3FF";
  if(active&&qColor&&qColor!=="#FFFFFF"&&qColor!=="#E5E5E5"&&qColor!=="#F5F5F5"){
    var r2=parseInt(qColor.slice(1,3),16),g2=parseInt(qColor.slice(3,5),16),b2=parseInt(qColor.slice(5,7),16);
    activeBg="rgb("+(Math.round(r2*0.08+240))+","+(Math.round(g2*0.08+240))+","+(Math.round(b2*0.08+240))+")";
  }

  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",fontFamily:"Nunito,system-ui,sans-serif",backgroundColor:!active&&!won?"#F5F3FF":won?"#F5F3FF":activeBg,transition:"background-color 0.5s ease"}}>

    {/* ── START SCREEN ── */}
    {(!active&&!won)&&(
      <div>
      <div style={{background:"linear-gradient(160deg,#4C1D95,#6D28D9,#7C3AED)",paddingTop:56,paddingLeft:16,paddingRight:16,paddingBottom:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:16}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:20,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>Koloreak</p>
            <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.6)",fontWeight:600}}>Colors in Basque</p>
          </div>
          {best>0&&<div style={{backgroundColor:"rgba(255,255,255,0.2)",borderRadius:12,padding:"5px 11px",border:"1px solid rgba(255,255,255,0.3)",textAlign:"center"}}>
            <p style={{margin:0,fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{best}</p>
            <p style={{margin:0,fontSize:8,color:"rgba(255,255,255,0.65)",fontWeight:700}}>BEST</p>
          </div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(9,1fr)",gap:0,height:48,borderRadius:"12px 12px 0 0",overflow:"hidden",marginLeft:-16,marginRight:-16}}>
          {previewColors.map(function(c){return <div key={c} style={{backgroundColor:c,height:"100%"}}/>;})}
        </div>
      </div>
      <div style={{padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
        <div style={{backgroundColor:"#fff",borderRadius:18,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
          <p style={{margin:0,padding:"12px 14px 8px",fontSize:12,fontWeight:800,color:"#8E8E93",textTransform:"uppercase",letterSpacing:0.5}}>Mode</p>
          <div style={{display:"flex",borderTop:"1px solid #F2F2F7"}}>
            <button onClick={function(){setMode("swatch_to_word");}} style={{flex:1,padding:"14px 8px",border:"none",borderRight:"1px solid #F2F2F7",backgroundColor:mode==="swatch_to_word"?"#F5F3FF":"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"background-color 0.15s"}}>
              <div style={{width:36,height:36,borderRadius:10,backgroundColor:"#3B82F6",margin:"0 auto 8px",boxShadow:"0 2px 8px rgba(59,130,246,0.4)"}}/>
              <p style={{margin:0,fontSize:12,fontWeight:800,color:mode==="swatch_to_word"?"#7C3AED":"#555"}}>See color</p>
              <p style={{margin:"2px 0 0",fontSize:10,color:"#8E8E93"}}>Tap the word</p>
            </button>
            <button onClick={function(){setMode("word_to_swatch");}} style={{flex:1,padding:"14px 8px",border:"none",backgroundColor:mode==="word_to_swatch"?"#F5F3FF":"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"background-color 0.15s"}}>
              <div style={{display:"flex",gap:3,justifyContent:"center",marginBottom:8}}>
                {["#EF4444","#3B82F6","#22C55E","#EAB308"].map(function(c){return <div key={c} style={{width:9,height:9,borderRadius:"50%",backgroundColor:c}}/>;})}
              </div>
              <p style={{margin:0,fontSize:12,fontWeight:800,color:mode==="word_to_swatch"?"#7C3AED":"#555"}}>See word</p>
              <p style={{margin:"2px 0 0",fontSize:10,color:"#8E8E93"}}>Tap the color</p>
            </button>
          </div>
        </div>
        <div style={{backgroundColor:"#fff",borderRadius:18,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
          <p style={{margin:0,padding:"12px 14px 8px",fontSize:12,fontWeight:800,color:"#8E8E93",textTransform:"uppercase",letterSpacing:0.5}}>Level</p>
          <div style={{display:"flex",borderTop:"1px solid #F2F2F7"}}>
            {[{k:"A1",l:"Basic",sub:"9 colors",colors:["#EF4444","#3B82F6","#22C55E","#EAB308","#A855F7"]},{k:"A2",l:"Extended",sub:"17 colors",colors:["#92400E","#9CA3AF","#C0C0C0","#1E3A8A","#86EFAC"]},{k:"B1+",l:"All",sub:"32 colors",colors:["#14532D","#06B6D4","#4338CA","#65A30D","#9F1239"]}].map(function(lv,li){
              var act=level===lv.k;
              return(
                <button key={lv.k} onClick={function(){setLevel(lv.k);}} style={{flex:1,padding:"12px 6px",border:"none",borderRight:li<2?"1px solid #F2F2F7":"none",backgroundColor:act?"#F5F3FF":"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"background-color 0.15s"}}>
                  <div style={{display:"flex",gap:2,justifyContent:"center",marginBottom:6}}>
                    {lv.colors.map(function(c){return <div key={c} style={{width:8,height:8,borderRadius:2,backgroundColor:c}}/>;})}
                  </div>
                  <p style={{margin:0,fontSize:12,fontWeight:900,color:act?"#7C3AED":"#555"}}>{lv.l}</p>
                  <p style={{margin:"2px 0 0",fontSize:10,color:act?"#7C3AED":"#8E8E93",fontWeight:600}}>{lv.sub}</p>
                </button>
              );
            })}
          </div>
        </div>
        {best>0&&<p style={{textAlign:"center",fontSize:12,color:"#8E8E93",fontWeight:700}}>Personal best: {best} pts</p>}
        <div style={{backgroundColor:"#fff",borderRadius:16,padding:"12px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
          <p style={{margin:"0 0 8px",fontSize:12,fontWeight:800,color:"#8E8E93",textTransform:"uppercase",letterSpacing:0.5}}>Questions</p>
          <div style={{display:"flex",gap:8}}>
            {[10,20,30].map(function(n){var act=rounds===n;return(
              <button key={n} onClick={function(){setRounds(n);}} style={{flex:1,padding:"9px",borderRadius:12,border:"2px solid "+(act?"#7C3AED":"#E8E8E8"),backgroundColor:act?"#F5F3FF":"#F9FAFB",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.12s"}}>
                <p style={{margin:0,fontSize:14,fontWeight:900,color:act?"#7C3AED":"#555"}}>{n}</p>
                <p style={{margin:0,fontSize:9,color:act?"#7C3AED":"#8E8E93",fontWeight:600}}>rounds</p>
              </button>
            );})}
          </div>
        </div>
        <button onClick={start} style={{width:"100%",padding:"17px",borderRadius:18,border:"none",backgroundColor:"#7C3AED",color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 5px 0 #4C1D95",letterSpacing:-0.3}}>Start: {rounds} rounds</button>
      </div>
      </div>
    )}

    {/* ── WIN SCREEN ── */}
    {won&&(
      <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end",minHeight:"100vh"}}>
        <div style={{backgroundColor:"#fff",borderTopLeftRadius:32,borderTopRightRadius:32,paddingBottom:40,boxShadow:"0 -4px 32px rgba(0,0,0,0.1)"}}>
          <div style={{display:"flex",height:6,borderRadius:"32px 32px 0 0",overflow:"hidden"}}>
            {["#EF4444","#F97316","#EAB308","#22C55E","#3B82F6","#A855F7","#EC4899"].map(function(c){return <div key={c} style={{flex:1,backgroundColor:c}}/>;})}
          </div>
          <div style={{width:36,height:4,backgroundColor:"#E0E0E0",borderRadius:2,margin:"10px auto 0"}}/>
          <div style={{padding:"20px 24px 0",textAlign:"center"}}>
            <div style={{width:76,height:76,borderRadius:"50%",background:"linear-gradient(135deg,#4C1D95,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:38,boxShadow:"0 8px 24px rgba(124,58,237,0.3)"}}>🎨</div>
            <p style={{margin:"0 0 2px",fontSize:24,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5}}>{score>best?"New best!":"Finished!"}</p>
            <p style={{margin:"0 0 20px",fontSize:13,color:"#8E8E93"}}>{level} · {isSwatchMode?"See color":"See word"}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
              {[{v:score,l:"Points",c:"#7C3AED"},{v:total,l:"Rounds",c:"#1A1A1A"},{v:best,l:"Best",c:"#8E8E93"}].map(function(s){return(
                <div key={s.l} style={{backgroundColor:"#F2F2F7",borderRadius:14,padding:"12px 6px"}}>
                  <p style={{margin:0,fontSize:20,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</p>
                  <p style={{margin:"3px 0 0",fontSize:10,color:"#8E8E93",fontWeight:700}}>{s.l}</p>
                </div>
              );})}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={start} style={{flex:1,padding:"15px",borderRadius:18,border:"none",backgroundColor:"#7C3AED",color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 0 #4C1D95"}}>Play again</button>
              <button onClick={function(){setWon(false);setActive(false);}} style={{flex:1,padding:"15px",borderRadius:18,border:"2px solid #E8E8E8",backgroundColor:"#fff",color:"#555",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Menu</button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── ACTIVE GAME ── */}
    {active&&question&&(
      <div>
      <div style={{background:"linear-gradient(135deg,#4C1D95,#7C3AED)",paddingTop:56,paddingLeft:14,paddingRight:14,paddingBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <button onClick={function(){setActive(false);setWon(false);}} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:14,fontWeight:900,color:"#fff"}}>🎨 Koloreak</p>
            <p style={{margin:0,fontSize:10,color:"rgba(255,255,255,0.6)"}}>{isSwatchMode?"See color, tap the word":"See word, tap the color"} · {level}</p>
          </div>
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            {score>0&&<div style={{backgroundColor:"rgba(255,255,255,0.2)",borderRadius:12,padding:"4px 10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.3)"}}>
              <p style={{margin:0,fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{score}</p>
              <p style={{margin:0,fontSize:8,color:"rgba(255,255,255,0.6)",fontWeight:700}}>PTS</p>
            </div>}
            <div style={{backgroundColor:"rgba(255,255,255,0.15)",borderRadius:12,padding:"4px 10px",textAlign:"center"}}>
              <p style={{margin:0,fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{total+1}/{rounds}</p>
              <p style={{margin:0,fontSize:8,color:"rgba(255,255,255,0.6)",fontWeight:700}}>ROUND</p>
            </div>
          </div>
        </div>
        <div style={{height:4,backgroundColor:"rgba(255,255,255,0.15)",borderRadius:2}}>
          <div style={{height:"100%",backgroundColor:"#fff",width:(total/rounds*100)+"%",borderRadius:2,transition:"width 0.4s ease"}}/>
        </div>
      </div>
      <div style={{padding:"14px",display:"flex",flexDirection:"column",gap:12}}>
        {isSwatchMode?(
          <div style={{borderRadius:24,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.15)",height:140,backgroundColor:qColor||"#888",display:"flex",alignItems:"flex-end",justifyContent:"center",position:"relative",transition:"background-color 0.3s ease"}}>
            <div style={{position:"absolute",inset:0,boxShadow:"inset 0 0 60px rgba(0,0,0,0.12)"}}/>
            {streak>=3&&(
              <div style={{position:"absolute",top:12,right:12,animation:"popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)"}}>
                <span style={{fontSize:12,fontWeight:900,color:"#fff",backgroundColor:"rgba(0,0,0,0.35)",padding:"4px 12px",borderRadius:20}}>🔥 {streak} in a row! +2 pts</span>
              </div>
            )}
            {showResult&&(
              <div style={{position:"relative",backgroundColor:"rgba(0,0,0,0.35)",borderRadius:"0 0 24px 24px",width:"100%",padding:"10px",textAlign:"center"}}>
                <p style={{margin:0,fontSize:16,fontWeight:900,color:"#fff",letterSpacing:-0.3}}>{question.basque}</p>
                <p style={{margin:"1px 0 0",fontSize:11,color:"rgba(255,255,255,0.75)",fontWeight:600}}>{question.english}</p>
              </div>
            )}
          </div>
        ):(
          <div style={{backgroundColor:"#fff",borderRadius:24,padding:"28px 20px",textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.08)",position:"relative",overflow:"hidden"}}>
            {qColor&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:5,backgroundColor:qColor}}/>}
            {streak>=3&&(
              <div style={{marginBottom:10,animation:"popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)"}}>
                <span style={{fontSize:12,fontWeight:900,color:"#7C3AED",backgroundColor:"#F5F3FF",padding:"4px 12px",borderRadius:20,border:"1px solid #DDD6FE"}}>🔥 {streak} in a row! +2 pts</span>
              </div>
            )}
            <p style={{margin:0,fontSize:30,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5}}>{question.basque}</p>
            <p style={{margin:"6px 0 0",fontSize:13,color:"#8E8E93",fontWeight:600}}>{question.english}</p>
          </div>
        )}
        {isSwatchMode?(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {opts.map(function(word,wi){
              var isCorrectOpt=word.id===question.id;
              var isPicked=sel===word.id;
              var bg=showResult?(isCorrectOpt?"#EDFAF3":isPicked?"#FEF2F2":"#F9FAFB"):"#fff";
              var border=showResult?(isCorrectOpt?"#19A85A":isPicked?"#EF4444":"#E8E8E8"):"#E8E8E8";
              var txtC=showResult?(isCorrectOpt?"#19A85A":isPicked?"#EF4444":"#BBB"):"#1A1A1A";
              var sc=isPicked&&isCorrectOpt?"scale(1.04)":isPicked?"scale(0.95)":isCorrectOpt&&showResult?"scale(1.02)":"scale(1)";
              return(
                <button key={word.id} onClick={function(){pick(word);}}
                  style={{padding:"14px 10px",borderRadius:18,border:"2px solid "+border,backgroundColor:bg,cursor:showResult?"default":"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",transform:sc,boxShadow:showResult?"none":"0 2px 10px rgba(0,0,0,0.07)",minHeight:68,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,animation:"cardIn 0.2s ease "+(wi*0.05)+"s both",position:"relative",overflow:"hidden"}}>
                  {showResult&&isCorrectOpt&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,backgroundColor:"#19A85A"}}/>}
                  {showResult&&isPicked&&!isCorrectOpt&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,backgroundColor:"#EF4444"}}/>}
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:12,height:12,borderRadius:"50%",backgroundColor:COLOR_HEX[word.id]||"#888",flexShrink:0,border:"1px solid rgba(0,0,0,0.1)"}}/>
                    <p style={{margin:0,fontSize:word.basque.length>12?11:14,fontWeight:900,color:txtC,letterSpacing:-0.2}}>{word.basque}</p>
                  </div>
                  <p style={{margin:0,fontSize:10,color:showResult?(isCorrectOpt?"#059669":isPicked?"#EF4444":"#D1D1D6"):"#8E8E93",fontWeight:600}}>{word.english}</p>
                </button>
              );
            })}
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {opts.map(function(word,wi){
              var isCorrectOpt=word.id===question.id;
              var isPicked=sel===word.id;
              var hex=COLOR_HEX[word.id]||"#888";
              var border=showResult?(isCorrectOpt?"#19A85A":isPicked?"#EF4444":"transparent"):"transparent";
              var sc=isPicked&&isCorrectOpt?"scale(1.05)":isPicked?"scale(0.95)":isCorrectOpt&&showResult?"scale(1.02)":"scale(1)";
              return(
                <button key={word.id} onClick={function(){pick(word);}}
                  style={{borderRadius:20,border:"4px solid "+border,cursor:showResult?"default":"pointer",transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",transform:sc,boxShadow:showResult?"none":"0 4px 16px rgba(0,0,0,0.12)",height:100,backgroundColor:hex,position:"relative",overflow:"hidden",animation:"cardIn 0.2s ease "+(wi*0.05)+"s both"}}>
                  <div style={{position:"absolute",inset:0,boxShadow:"inset 0 0 20px rgba(0,0,0,0.1)"}}/>
                  {showResult&&isCorrectOpt&&(
                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",backgroundColor:"rgba(0,0,0,0.25)"}}>
                      <span style={{fontSize:22,color:"#fff"}}>✓</span>
                      <p style={{margin:"2px 0 0",fontSize:10,fontWeight:800,color:"#fff"}}>{word.basque}</p>
                    </div>
                  )}
                  {showResult&&isPicked&&!isCorrectOpt&&(
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",backgroundColor:"rgba(0,0,0,0.3)"}}>
                      <span style={{fontSize:22,color:"#fff"}}>✗</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      </div>
    )}

    </div>
  );
}
function ArbolaScreen(props){
  var VOCABULARY=_VOCAB;
  var onBack=props.onBack,isPro=props.isPro,onUpgrade=props.onUpgrade;

  // 6 families, each with 5 members to place
  var FAMILIES=[
    {name:"Etxeberria",emoji:"🏡",desc:"A traditional Basque farmhouse family",color:"#0D9488",dark:"#134E4A",bg:"#F0FDFA",members:[
      {instruction:"She's been cooking since dawn, the mother of the house",keyword:"ama",emoji:"👩",hint:"Ama: mother"},
      {instruction:"The children's father comes home just before dinner",keyword:"aita",emoji:"👨",hint:"Aita: father"},
      {instruction:"Their baby is the last through the door",keyword:"haurra",emoji:"👶",hint:"Haurra: child or baby"},
      {instruction:"Who sits at the head of the Basque table? The grandmother",keyword:"amona",emoji:"👵",hint:"Amona: grandmother, the heart of every Basque home"},
      {instruction:"Her husband has been out in the fields all day",keyword:"aitona",emoji:"👴",hint:"Aitona: grandfather"},
    ]},
    {name:"Mendizabal",emoji:"⛰️",desc:"Brothers and sisters in the mountain village",color:"#15803D",dark:"#14532D",bg:"#F0FDF4",members:[
      {instruction:"The eldest boy plays outside, he's the son",keyword:"semea",emoji:"👦",hint:"Semea: son"},
      {instruction:"His little sister follows him everywhere",keyword:"alaba",emoji:"👧",hint:"Alaba: daughter"},
      {instruction:"Their mother's brother visits for the weekend",keyword:"osaba",emoji:"👴",hint:"Osaba: uncle"},
      {instruction:"Her sister comes with him, the children's aunt",keyword:"izeba",emoji:"👵",hint:"Izeba: aunt"},
      {instruction:"A childhood friend completes the gathering",keyword:"laguna",emoji:"😊",hint:"Laguna: friend"},
    ]},
    {name:"Aizpurua",emoji:"🌊",desc:"Siblings growing up by the sea",color:"#0369A1",dark:"#0C4A6E",bg:"#EFF6FF",members:[
      {instruction:"The older brother is first to arrive",keyword:"anaia",emoji:"👦",hint:"Anaia: brother"},
      {instruction:"His younger sister is right behind him",keyword:"ahizpa",emoji:"👧",hint:"Ahizpa: sister"},
      {instruction:"Both of them together, the parents",keyword:"gurasoak",emoji:"👫",hint:"Gurasoak: parents"},
      {instruction:"A cousin arrives from Bilbao",keyword:"lehengusua",emoji:"🧑",hint:"Lehengusua: cousin"},
      {instruction:"The nephew tags along too",keyword:"iloba",emoji:"🧒",hint:"Iloba: niece or nephew"},
    ]},
    {name:"Urrutia",emoji:"🍷",desc:"A modern Basque couple and their extended family",color:"#9333EA",dark:"#6B21A8",bg:"#FAF5FF",members:[
      {instruction:"Two people building a life together, a couple",keyword:"bikotea",emoji:"💑",hint:"Bikotea: couple or partner"},
      {instruction:"She married into the family",keyword:"emaztea",emoji:"👩",hint:"Emaztea: wife"},
      {instruction:"He took her name when they wed",keyword:"senarra",emoji:"👨",hint:"Senarra: husband"},
      {instruction:"The wedding brought everyone together",keyword:"ezkontza",emoji:"💍",hint:"Ezkontza: wedding"},
      {instruction:"Their partner in everything, closest companion",keyword:"bikotekidea",emoji:"🤝",hint:"Bikotekidea: partner or significant other"},
    ]},
    {name:"Goikoetxea",emoji:"🎭",desc:"A family that has seen it all",color:"#DC2626",dark:"#991B1B",bg:"#FFF1F2",members:[
      {instruction:"She raises the children on her own now",keyword:"guraso_bakarra",emoji:"💪",hint:"Guraso bakarra: single parent"},
      {instruction:"Her son is all grown up",keyword:"semea",emoji:"👦",hint:"Semea: son"},
      {instruction:"Her sister is always there to help",keyword:"ahizpa",emoji:"👧",hint:"Ahizpa: sister"},
      {instruction:"Her husband's family are still close relatives",keyword:"senitartea",emoji:"👨‍👩‍👧‍👦",hint:"Senitartea: relatives, extended family"},
      {instruction:"She considers herself single now, unmarried",keyword:"ezkongabea",emoji:"🙋",hint:"Ezkongabea: single or unmarried"},
    ]},
    {name:"Zubiaurre",emoji:"🌳",desc:"Four generations of a Basque family",color:"#B45309",dark:"#78350F",bg:"#FFFBEB",members:[
      {instruction:"The great-grandparents, all those who came before",keyword:"arbasoak",emoji:"🌿",hint:"Arbasoak: ancestors"},
      {instruction:"Each new era of the family, a generation",keyword:"belaunaldia",emoji:"👨‍👩‍👧",hint:"Belaunaldia: generation"},
      {instruction:"The era of childhood, growing up Basque",keyword:"haurtzaroa",emoji:"🧸",hint:"Haurtzaroa: childhood"},
      {instruction:"What the grandparents leave behind, their legacy",keyword:"heredentzia",emoji:"🏠",hint:"Heredentzia: inheritance"},
      {instruction:"All of it traced on a single page, the family tree",keyword:"arbola",emoji:"🌳",hint:"Arbola: family tree or lineage"},
    ]},
  ];

  // DISTRACTORS per generation — similar roles to make it tricky
  var DISTRACTORS={
    "amona":["ama","alaba","izeba"],
    "aitona":["aita","semea","osaba"],
    "ama":["amona","alaba","ahizpa"],
    "aita":["aitona","semea","anaia"],
    "haurra":["semea","alaba","iloba"],
    "semea":["anaia","haurra","aitona"],
    "alaba":["ahizpa","haurra","amona"],
    "anaia":["semea","osaba","aita"],
    "ahizpa":["alaba","izeba","ama"],
    "osaba":["aitona","anaia","senarra"],
    "izeba":["amona","ahizpa","emaztea"],
    "laguna":["lehengusua","iloba","anaia"],
    "lehengusua":["iloba","anaia","ahizpa"],
    "iloba":["haurra","alaba","semea"],
    "gurasoak":["familia","bikotea","senitartea"],
    "bikotea":["gurasoak","emaztea","senarra"],
    "emaztea":["ama","izeba","ahizpa"],
    "senarra":["aita","osaba","anaia"],
    "ezkontza":["familia","bikotea","senitartea"],
    "bikotekidea":["emaztea","senarra","laguna"],
    "guraso_bakarra":["gurasoak","ama","aita"],
    "senitartea":["familia","gurasoak","arbasoak"],
    "ezkongabea":["bikotekidea","bikotea","alargun"],
    "arbasoak":["belaunaldia","senitartea","familia"],
    "belaunaldia":["arbasoak","haurtzaroa","senitartea"],
    "haurtzaroa":["haurra","belaunaldia","familia"],
    "heredentzia":["arbasoak","belaunaldia","familia"],
    "arbola":["belaunaldia","arbasoak","familia"],
  };

  var _family=useState(null);var family=_family[0];var setFamily=_family[1];
  var _famIdx=useState(0);var famIdx=_famIdx[0];var setFamIdx=_famIdx[1];
  var _step=useState(0);var step=_step[0];var setStep=_step[1];
  var _opts=useState([]);var opts=_opts[0];var setOpts=_opts[1];
  var _sel=useState(null);var sel=_sel[0];var setSel=_sel[1];
  var _score=useState(0);var score=_score[0];var setScore=_score[1];
  var _lives=useState(3);var lives=_lives[0];var setLives=_lives[1];
  var _done=useState(false);var done=_done[0];var setDone=_done[1];
  var _streak=useState(0);var streak=_streak[0];var setStreak=_streak[1];
  var _best=useState(0);var best=_best[0];var setBest=_best[1];
  var _completed=useState([]);var completed=_completed[0];var setCompleted=_completed[1];
  var _showHint=useState(false);var showHint=_showHint[0];var setShowHint=_showHint[1];
  var _flash=useState(null);var flash=_flash[0];var setFlash=_flash[1];
  // Portrait slots — tracks which members have been placed
  var _portrait=useState([]);var portrait=_portrait[0];var setPortrait=_portrait[1];
  var scoreRef=React.useRef(0);

  React.useEffect(function(){
    try{window.storage.get('arbola_best').then(function(r){if(r&&r.value)setBest(parseInt(r.value)||0);}).catch(function(){});}catch(e){}
  },[]);

  function findWord(keyword){
    return VOCABULARY.find(function(w){return w.id===keyword;})||null;
  }

  function buildOptions(fam,stepIdx){
    var keyword=fam.members[stepIdx].keyword;
    var correctWord=findWord(keyword);
    if(!correctWord)return [];
    var distIds=DISTRACTORS[keyword]||["ama","aita","anaia"];
    var distractors=distIds.map(function(id){return findWord(id);}).filter(Boolean);
    if(distractors.length<3){
      var extra=shuffled(VOCABULARY.filter(function(w){
        return w.topic==="family"&&w.id!==keyword&&distIds.indexOf(w.id)===-1&&w.cefr==="A1";
      })).slice(0,3-distractors.length);
      distractors=distractors.concat(extra);
    }
    return shuffled([correctWord].concat(distractors.slice(0,3)));
  }

  function startFamily(idx){
    var f=FAMILIES[idx];
    scoreRef.current=0;
    setFamily(f);setFamIdx(idx);setStep(0);setSel(null);setDone(false);
    setShowHint(false);setScore(0);setLives(3);setStreak(0);setFlash(null);
    setPortrait([]);
    setOpts(buildOptions(f,0));
  }

  function pick(word){
    if(sel)return;
    var keyword=family.members[step].keyword;
    var isCorrect=word.id===keyword;
    setSel(word.id);
    if(isCorrect){
      haptic("light");sfx("correct");
      var ns=streak+1;var pts=ns>=3?2:1;
      scoreRef.current=scoreRef.current+pts;
      setStreak(ns);setScore(scoreRef.current);setFlash('correct');
      // Add member to portrait
      setPortrait(function(prev){return prev.concat([family.members[step]]);});
      setTimeout(function(){
        setFlash(null);
        var next=step+1;
        if(next>=family.members.length){
          haptic("success");sfx("complete");
          setCompleted(function(prev){return prev.indexOf(family.name)===-1?prev.concat([family.name]):prev;});
          setBest(function(b){
            var nb=Math.max(b,scoreRef.current);
            try{window.storage.set('arbola_best',String(nb)).catch(function(){});}catch(e){}
            return nb;
          });
          setDone(true);
        }else{
          setStep(next);setSel(null);setShowHint(false);
          setOpts(buildOptions(family,next));
        }
      },700);
    }else{
      haptic("error");sfx("wrong");
      setStreak(0);setFlash('wrong');
      setTimeout(function(){setFlash(null);},500);
      setLives(function(l){var nl=l-1;if(nl<=0){sfx("fail");setTimeout(function(){setDone(true);},700);}return nl;});
      setTimeout(function(){setSel(null);setShowHint(true);},900);
    }
  }

  var currentMember=family&&family.members[step];
  var correctWord=currentMember?findWord(currentMember.keyword):null;
  var COLOR=family?family.color:"#0D9488";
  var DARK=family?family.dark:"#134E4A";
  var BG=family?family.bg:"#F0FDFA";
  var nextIdx=(famIdx+1)%FAMILIES.length;
  var nextFam=FAMILIES[nextIdx];

  // ── Menu screen ──
  if(!family){return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",backgroundColor:"#F2F2F7",fontFamily:"Nunito,system-ui,sans-serif"}}>
      <div style={{background:"linear-gradient(160deg,#134E4A,#0D9488,#14B8A6)",paddingTop:56,paddingLeft:16,paddingRight:16,paddingBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:20,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>🌳 Arbola Familiarra</p>
            <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.65)",fontWeight:600}}>Build your Basque family tree</p>
          </div>
          {best>0&&<div style={{backgroundColor:"rgba(255,255,255,0.2)",borderRadius:12,padding:"5px 11px",border:"1px solid rgba(255,255,255,0.3)",textAlign:"center"}}>
            <p style={{margin:0,fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{best}</p>
            <p style={{margin:0,fontSize:8,color:"rgba(255,255,255,0.65)",fontWeight:700}}>BEST</p>
          </div>}
        </div>
        {completed.length>0?(
          <div style={{backgroundColor:"rgba(255,255,255,0.12)",borderRadius:12,padding:"8px 12px",marginTop:8,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>🌳</span>
            <p style={{margin:0,fontSize:12,fontWeight:700,color:"#fff"}}>Built {completed.length} of {FAMILIES.length} family portraits</p>
            <div style={{display:"flex",gap:3,marginLeft:"auto"}}>
              {FAMILIES.map(function(f,i){return <div key={i} style={{width:8,height:8,borderRadius:"50%",backgroundColor:completed.indexOf(f.name)!==-1?"#fff":"rgba(255,255,255,0.25)"}}/>;  })}
            </div>
          </div>
        ):(
          <p style={{margin:"8px 0 0",fontSize:12,color:"rgba(255,255,255,0.55)",fontWeight:500}}>5 members per family · 3 lives · place each member correctly</p>
        )}
      </div>

      <div style={{padding:"14px"}}>
        {FAMILIES.map(function(f,i){
          var isDone=completed.indexOf(f.name)!==-1;
          return(
            <button key={i} onClick={function(){startFamily(i);}}
              style={{width:"100%",marginBottom:10,borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left",padding:0,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",display:"block"}}>
              <div style={{background:"linear-gradient(135deg,"+f.dark+","+f.color+")",padding:"15px 16px 12px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"16px 16px"}}/>
                {isDone&&<div style={{position:"absolute",top:10,right:10,backgroundColor:"rgba(255,255,255,0.9)",borderRadius:20,padding:"3px 10px"}}><span style={{fontSize:10,fontWeight:800,color:f.color}}>✓ Complete</span></div>}
                <div style={{display:"flex",alignItems:"center",gap:12,position:"relative"}}>
                  <div style={{width:52,height:52,borderRadius:14,backgroundColor:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{f.emoji}</div>
                  <div style={{flex:1}}>
                    <p style={{margin:0,fontSize:16,fontWeight:900,color:"#fff",letterSpacing:-0.3}}>{f.name}</p>
                    <p style={{margin:"2px 0 0",fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:500,fontStyle:"italic"}}>{f.desc}</p>
                  </div>
                </div>
                {/* Portrait preview */}
                <div style={{display:"flex",gap:4,marginTop:10,position:"relative",alignItems:"center"}}>
                  {f.members.map(function(m,mi){return(
                    <div key={mi} style={{width:34,height:34,borderRadius:"50%",backgroundColor:"rgba(255,255,255,0.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,border:"1.5px solid rgba(255,255,255,0.3)"}}>{m.emoji}</div>
                  );})}
                </div>
              </div>
              <div style={{backgroundColor:isDone?f.bg:"#fff",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <p style={{margin:0,fontSize:11,color:isDone?f.color:"#8E8E93",fontWeight:isDone?700:500}}>{isDone?"✓ Complete. Try again?":"Tap to meet the family"}</p>
                <span style={{fontSize:15,color:f.color,fontWeight:700}}>›</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );}

  // ── Game screen ──
  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",fontFamily:"Nunito,system-ui,sans-serif",backgroundColor:BG,transition:"background-color 0.4s ease"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(160deg,"+DARK+","+COLOR+")",paddingTop:56,paddingLeft:14,paddingRight:14,paddingBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"18px 18px",pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,position:"relative"}}>
          <button onClick={function(){setFamily(null);}} style={{background:"rgba(255,255,255,0.18)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:15,fontWeight:900,color:"#fff",letterSpacing:-0.3}}>{family.emoji} Familia {family.name}</p>
            <p style={{margin:0,fontSize:10,color:"rgba(255,255,255,0.6)",fontStyle:"italic"}}>{family.desc}</p>
          </div>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            {score>0&&<div style={{backgroundColor:"rgba(255,255,255,0.2)",borderRadius:12,padding:"4px 10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.3)"}}>
              <p style={{margin:0,fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{score}</p>
              <p style={{margin:0,fontSize:8,color:"rgba(255,255,255,0.6)",fontWeight:700}}>PTS</p>
            </div>}
            <div style={{display:"flex",gap:1}}>
              {Array.from({length:3}).map(function(_,i){return(
                <span key={i} style={{fontSize:16,transition:"transform 0.35s cubic-bezier(0.34,1.56,0.64,1),opacity 0.3s",transform:i<lives?"scale(1)":"scale(0.45)",opacity:i<lives?1:0.15}}>❤️</span>
              );})}
            </div>
          </div>
        </div>

        {/* Portrait being built — hero of the game */}
        <div style={{display:"flex",gap:6,position:"relative",justifyContent:"center",marginBottom:12}}>
          {family.members.map(function(m,i){
            var placed=portrait.some(function(p){return p.keyword===m.keyword;});
            var isCurrent=i===step&&!done;
            var correctW=placed?findWord(m.keyword):null;
            return(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{width:46,height:46,borderRadius:"50%",backgroundColor:placed?"rgba(255,255,255,0.95)":isCurrent?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:placed?24:isCurrent?20:16,transition:"all 0.4s cubic-bezier(0.34,1.56,0.64,1)",border:isCurrent?"2.5px solid rgba(255,255,255,0.85)":placed?"2px solid rgba(255,255,255,0.6)":"2px solid rgba(255,255,255,0.15)",boxShadow:placed?"0 3px 12px rgba(0,0,0,0.2)":isCurrent?"0 0 0 4px rgba(255,255,255,0.15)":"none",transform:placed?"scale(1.08)":"scale(1)"}}>
                  {placed?m.emoji:isCurrent?"❓":""}
                </div>
                {placed&&correctW&&<p style={{margin:0,fontSize:8,color:"rgba(255,255,255,0.8)",fontWeight:700,maxWidth:48,textAlign:"center",lineHeight:1.1}}>{correctW.basque}</p>}
              </div>
            );
          })}
        </div>

        {/* Step progress */}
        <div style={{display:"flex",gap:5,position:"relative"}}>
          {family.members.map(function(_,i){return(
            <div key={i} style={{flex:1,height:4,borderRadius:2,backgroundColor:i<step?"rgba(255,255,255,0.9)":i===step?"#fff":"rgba(255,255,255,0.22)",transition:"background-color 0.4s ease"}}/>
          );})}
        </div>
        <p style={{margin:"6px 0 0",fontSize:10,color:"rgba(255,255,255,0.5)",fontWeight:700,position:"relative"}}>MEMBER {step+1} OF {family.members.length}</p>
      </div>

      <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>

        {/* Done overlay */}
        {done&&(
          <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.65)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
            <div style={{backgroundColor:"#fff",borderTopLeftRadius:32,borderTopRightRadius:32,width:"100%",maxWidth:420,margin:"0 auto",paddingBottom:40}}>
              <div style={{width:36,height:4,backgroundColor:"#E0E0E0",borderRadius:2,margin:"12px auto 0"}}/>
              <div style={{padding:"20px 24px 0",textAlign:"center"}}>
                {/* Show portrait of placed members */}
                <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:14}}>
                  {lives>0?portrait.map(function(m,i){return(
                    <div key={i} style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,"+DARK+","+COLOR+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 2px 8px rgba(0,0,0,0.15)",animation:"popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) "+(i*0.08)+"s both"}}>{m.emoji}</div>
                  );}):(<span style={{fontSize:40}}>💔</span>)}
                </div>
                <p style={{margin:"0 0 2px",fontSize:24,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5}}>{lives>0?"Portrait complete!":"Out of lives!"}</p>
                <p style={{margin:"0 0 18px",fontSize:13,color:"#8E8E93"}}>{lives>0?"Familia "+family.name+", all together!":"Give it another go"}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                  {[{v:scoreRef.current,l:"Points",c:COLOR},{v:(lives>0?family.members.length:step)+"/"+family.members.length,l:"Members",c:"#1A1A1A"},{v:completed.length+"/"+FAMILIES.length,l:"Families",c:"#0D9488"}].map(function(s){return(
                    <div key={s.l} style={{backgroundColor:"#F2F2F7",borderRadius:14,padding:"12px 6px"}}>
                      <p style={{margin:0,fontSize:20,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</p>
                      <p style={{margin:"3px 0 0",fontSize:10,color:"#8E8E93",fontWeight:700}}>{s.l}</p>
                    </div>
                  );})}
                </div>
                <div style={{display:"flex",gap:8,marginBottom:lives>0?10:0}}>
                  <button onClick={function(){startFamily(famIdx);}} style={{flex:1,padding:"14px",borderRadius:16,border:"2px solid #E8E8E8",backgroundColor:"#fff",color:"#555",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Play again</button>
                  <button onClick={function(){setFamily(null);setDone(false);}} style={{flex:1,padding:"14px",borderRadius:16,border:"none",backgroundColor:COLOR,color:"#fff",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 0 "+DARK}}>Menu</button>
                </div>
                {lives>0&&<button onClick={function(){startFamily(nextIdx);}} style={{width:"100%",padding:"13px",borderRadius:16,border:"1.5px solid "+nextFam.color,backgroundColor:nextFam.bg,color:nextFam.color,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                  Next: {nextFam.emoji} {nextFam.name} →
                </button>}
              </div>
            </div>
          </div>
        )}

        {/* Instruction card */}
        <div style={{backgroundColor:"#fff",borderRadius:20,padding:"16px 18px 14px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",animation:flash==="wrong"?"shake 0.4s ease":"none",overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+DARK+","+COLOR+")"}}/>
          <p style={{margin:"4px 0 10px",fontSize:17,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.3,lineHeight:1.4,textAlign:"center"}}>{currentMember&&currentMember.instruction}</p>
          {showHint?(
            <div style={{backgroundColor:BG,borderRadius:10,padding:"8px 12px"}}>
              <p style={{margin:0,fontSize:12,color:DARK,fontWeight:700}}>💡 {currentMember&&currentMember.hint}</p>
            </div>
          ):(
            <button onClick={function(){setShowHint(true);}} style={{display:"block",margin:"0 auto",background:"none",border:"1.5px solid #E8E8E8",borderRadius:20,padding:"4px 14px",fontSize:11,fontWeight:700,color:"#AAA",cursor:"pointer",fontFamily:"inherit"}}>💡 Hint</button>
          )}
        </div>

        {/* Streak */}
        {streak>=3&&flash==="correct"&&(
          <div style={{textAlign:"center",animation:"popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)"}}>
            <span style={{fontSize:13,fontWeight:900,color:DARK,backgroundColor:"#fff",padding:"5px 18px",borderRadius:20,border:"1.5px solid "+COLOR,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>🔥 {streak} in a row! +2 pts</span>
          </div>
        )}

        {/* Family word options — with emoji */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {opts.map(function(word,wi){
            var isCorrectOpt=correctWord&&word.id===correctWord.id;
            var isPicked=sel===word.id;
            var showResult=sel!==null;
            var bg=showResult?(isCorrectOpt?"#EDFAF3":isPicked?"#FEF2F2":"#F9FAFB"):"#fff";
            var borderCol=showResult?(isCorrectOpt?"#19A85A":isPicked?"#EF4444":"#E8E8E8"):"#E8E8E8";
            var txtC=showResult?(isCorrectOpt?"#19A85A":isPicked?"#EF4444":"#BBB"):"#1A1A1A";
            var subC=showResult?(isCorrectOpt?"#059669":isPicked?"#EF4444":"#D1D1D6"):"#8E8E93";
            var sc=isPicked&&isCorrectOpt?"scale(1.05)":isPicked?"scale(0.94)":isCorrectOpt&&showResult?"scale(1.02)":"scale(1)";
            // Find emoji for this word from any family
            var wordEmoji="👤";
            for(var fi=0;fi<FAMILIES.length;fi++){
              var found=FAMILIES[fi].members.find(function(m){return m.keyword===word.id;});
              if(found){wordEmoji=found.emoji;break;}
            }
            return(
              <button key={word.id} onClick={function(){pick(word);}}
                style={{padding:"16px 10px 14px",borderRadius:18,border:"2px solid "+borderCol,backgroundColor:bg,cursor:showResult?"default":"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",transform:sc,boxShadow:showResult?"none":"0 2px 12px rgba(0,0,0,0.08)",minHeight:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,animation:"cardIn 0.2s ease "+(wi*0.06)+"s both",position:"relative",overflow:"hidden"}}>
                {showResult&&isCorrectOpt&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,backgroundColor:"#19A85A"}}/>}
                {showResult&&isPicked&&!isCorrectOpt&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,backgroundColor:"#EF4444"}}/>}
                <span style={{fontSize:30,lineHeight:1}}>{wordEmoji}</span>
                <p style={{margin:"6px 0 0",fontSize:word.basque.length>12?12:15,fontWeight:900,color:txtC,lineHeight:1.2,letterSpacing:-0.2}}>{word.basque}</p>
                <p style={{margin:"2px 0 0",fontSize:10,color:subC,fontWeight:600}}>{word.english}</p>
                {isCorrectOpt&&showResult&&word.pronunciation&&<p style={{margin:"2px 0 0",fontSize:9,fontWeight:700,color:"#19A85A",fontStyle:"italic"}}>{word.pronunciation}</p>}
                {isPicked&&!isCorrectOpt&&showResult&&<span style={{fontSize:14,marginTop:2}}>✗</span>}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  STORY READING SECTION (Irakurri)
// ════════════════════════════════════════════
var STORIES=[
  {id:"goiza",title:"Goizean",titleEn:"In the Morning",level:"A1",cat:"story",emoji:"☀️",intro:"A simple morning at home. Meet a family waking up.",lines:[
    {w:[["Egun","Day"],["on!","good!"]],tr:"Good morning! (lit. good day)"},
    {w:[["Eguzkia","The sun"],["hor","there"],["dago.","is."]],tr:"The sun is there."},
    {w:[["Ama","Mother"],["eta","and"],["aita","father"],["etxean","at home"],["daude.","are."]],tr:"Mother and father are at home."},
    {w:[["Haurra","The child"],["pozik","happy"],["dago.","is."]],tr:"The child is happy."},
    {w:[["Gosaria","Breakfast"],["prest","ready"],["dago.","is."]],tr:"Breakfast is ready."},
    {w:[["Ogia,","Bread,"],["gazta","cheese"],["eta","and"],["esnea.","milk."]],tr:"Bread, cheese and milk."},
    {w:[["Kaixo,","Hello,"],["ama!","mother!"]],tr:"Hello, mother!"},
    {w:[["Gose","Hungry"],["naiz.","I am."]],tr:"I am hungry."},
    {w:[["Jan","Eat"],["eta","and"],["edan.","drink."]],tr:"Eat and drink."},
    {w:[["Egun","Day"],["ona","good"],["izan!","have!"]],tr:"Have a good day!"},
  ]},
  {id:"azoka",title:"Azokan",titleEn:"At the Market",level:"A1",cat:"dialogue",emoji:"🧺",intro:"Buying fruit at a Basque market. Practice numbers and food words.",lines:[
    {w:[["Kaixo!","Hello!"],["Zer","What"],["nahi","want"],["duzu?","do you?"]],tr:"Hello! What do you want?"},
    {w:[["Sagarrak,","Apples,"],["mesedez.","please."]],tr:"Apples, please."},
    {w:[["Zenbat","How many"],["nahi","want"],["dituzu?","do you?"]],tr:"How many do you want?"},
    {w:[["Bost","Five"],["sagar.","apples."]],tr:"Five apples."},
    {w:[["Hemen","Here"],["daude.","they are."]],tr:"Here they are."},
    {w:[["Eta","And"],["tomateak?","tomatoes?"]],tr:"And tomatoes?"},
    {w:[["Bai,","Yes,"],["hiru","three"],["tomate","tomato"],["gorri.","red."]],tr:"Yes, three red tomatoes."},
    {w:[["Eskerrik","Thank"],["asko!","you!"]],tr:"Thank you!"},
    {w:[["Ez","Not"],["horregatik.","at all."]],tr:"You're welcome."},
    {w:[["Agur!","Goodbye!"]],tr:"Goodbye!"},
  ]},
  {id:"mendia",title:"Mendian",titleEn:"In the Mountains",level:"A2",cat:"story",emoji:"⛰️",intro:"A walk in the Basque mountains with a friend and a dog.",lines:[
    {w:[["Gaur","Today"],["mendira","to the mountain"],["goaz.","we go."]],tr:"Today we go to the mountain."},
    {w:[["Nire","My"],["laguna","friend"],["eta","and"],["biok","the two of us"],["goaz.","go."]],tr:"My friend and I go together."},
    {w:[["Zakurra","The dog"],["ere","also"],["dator.","comes."]],tr:"The dog comes too."},
    {w:[["Eguzkia","The sun"],["atera","come out"],["da","has"],["eta","and"],["beroa","hot"],["da.","it is."]],tr:"The sun is out and it is hot."},
    {w:[["Mendia","The mountain"],["handia","big"],["eta","and"],["berdea","green"],["da.","is."]],tr:"The mountain is big and green."},
    {w:[["Goian","At the top"],["itsasoa","the sea"],["ikusten","seeing"],["dugu.","we are."]],tr:"At the top we see the sea."},
    {w:[["Ura","Water"],["edaten","drinking"],["dugu.","we are."]],tr:"We drink water."},
    {w:[["Zakurra","The dog"],["nekatuta","tired"],["dago.","is."]],tr:"The dog is tired."},
    {w:[["Oso","Very"],["egun","day"],["polita","nice"],["da.","it is."]],tr:"It is a very nice day."},
    {w:[["Etxera","Home"],["itzultzen","returning"],["gara.","we are."]],tr:"We return home."},
  ]},
  {id:"jatetxe",title:"Jatetxean",titleEn:"At the Restaurant",level:"A2",cat:"dialogue",emoji:"🍽️",intro:"Ordering dinner at a Basque restaurant.",lines:[
    {w:[["Arratsalde","Afternoon"],["on!","good!"]],tr:"Good afternoon!"},
    {w:[["Bi","Two"],["lagunentzako","for people"],["mahaia,","table,"],["mesedez.","please."]],tr:"A table for two, please."},
    {w:[["Hemen,","Here,"],["mesedez.","please."]],tr:"Here, please."},
    {w:[["Zer","What"],["dago","is there"],["jateko?","to eat?"]],tr:"What is there to eat?"},
    {w:[["Arraina,","Fish,"],["oilaskoa","chicken"],["edo","or"],["txuleta.","steak."]],tr:"Fish, chicken or steak."},
    {w:[["Nik","I"],["arraina","fish"],["nahi","want"],["dut.","do."]],tr:"I want fish."},
    {w:[["Eta","And"],["edateko?","to drink?"]],tr:"And to drink?"},
    {w:[["Ardo","Wine"],["gorria","red"],["eta","and"],["ura.","water."]],tr:"Red wine and water."},
    {w:[["Oso","Very"],["ondo.","good."]],tr:"Very good."},
    {w:[["Eskerrik","Thank"],["asko!","you!"]],tr:"Thank you!"},
  ]},
  {id:"tartalo",title:"Tartalo",titleEn:"The Giant Tartalo",level:"B1",cat:"folktale",emoji:"👁️",intro:"A famous Basque legend about a one-eyed giant, retold simply. (Like the Cyclops.)",lines:[
    {w:[["Mendian","In the mountain"],["erraldoi","giant"],["bat","a"],["bizi","lived"],["zen.","was."]],tr:"In the mountain lived a giant."},
    {w:[["Bere","His"],["izena","name"],["Tartalo","Tartalo"],["zen.","was."]],tr:"His name was Tartalo."},
    {w:[["Begi","Eye"],["bakarra","single"],["zuen.","he had."]],tr:"He had a single eye."},
    {w:[["Oso","Very"],["handia","big"],["eta","and"],["indartsua","strong"],["zen.","he was."]],tr:"He was very big and strong."},
    {w:[["Mutil","Boy"],["bat","a"],["harrapatu","caught"],["zuen.","he did."]],tr:"He caught a boy."},
    {w:[["Baina","But"],["mutila","the boy"],["azkarra","clever"],["zen.","was."]],tr:"But the boy was clever."},
    {w:[["Gauean,","At night,"],["Tartalo","Tartalo"],["lo","asleep"],["zegoen.","was."]],tr:"At night, Tartalo was asleep."},
    {w:[["Mutilak","The boy"],["begia","the eye"],["erre","burned"],["zion.","did to him."]],tr:"The boy burned his eye."},
    {w:[["Eta","And"],["ihes","escape"],["egin","did"],["zuen.","he."]],tr:"And he escaped."},
    {w:[["Horrela","Thus"],["amaitzen","ends"],["da","is"],["ipuina.","the tale."]],tr:"And so the tale ends."},
  ]},
  {id:"festak",title:"Herriko Festak",titleEn:"The Town Festival",level:"B2",cat:"story",emoji:"🎉",intro:"The summer festivals that bring a Basque town to life.",lines:[
    {w:[["Udan,","In summer,"],["herriak","the town"],["festak","festivals"],["ospatzen","celebrates"],["ditu.","does."]],tr:"In summer, the town celebrates its festivals."},
    {w:[["Jende","People"],["asko","many"],["kalera","to the street"],["ateratzen","come out"],["da.","do."]],tr:"Many people come out to the street."},
    {w:[["Musika,","Music,"],["dantza","dance"],["eta","and"],["barreak","laughter"],["entzuten","heard"],["dira.","are."]],tr:"Music, dancing and laughter are heard."},
    {w:[["Txapela","The beret"],["buruan,","on the head,"],["denak","everyone"],["pozik","happy"],["daude.","are."]],tr:"Beret on head, everyone is happy."},
    {w:[["Sagardoa","Cider"],["eta","and"],["pintxoak","pintxos"],["nonahi","everywhere"],["daude.","are."]],tr:"Cider and pintxos are everywhere."},
    {w:[["Gazteak","The young people"],["gau","night"],["osoan","all"],["dantzatzen","dance"],["dute.","do."]],tr:"The young people dance all night."},
    {w:[["Bertsolariak","The verse-singers"],["kantatzen","sing"],["dute.","do."]],tr:"The verse-singers sing."},
    {w:[["Euskara","The Basque language"],["kale","street"],["guztietan","in all"],["entzuten","heard"],["da.","is."]],tr:"Basque is heard in every street."},
    {w:[["Festa","The festival"],["egunak","days"],["laburrak","short"],["dira,","are,"],["baina","but"],["ederrak.","beautiful."]],tr:"The festival days are short, but beautiful."},
    {w:[["Hurrengo","Next"],["urtera","to the year"],["arte!","until!"]],tr:"Until next year!"},
  ]},
];

var STORY_CATS={story:{label:"Story",color:"#0D9488",emoji:"📖"},folktale:{label:"Legend",color:"#9B5DE5",emoji:"🏔️"},dialogue:{label:"Dialogue",color:"#F97316",emoji:"💬"}};
var STORY_LEVEL_C={A1:"#F97316",A2:"#0891B2",B1:"#9B5DE5",B2:"#F72585"};

function StoryScreen(props){
  var onBack=props.onBack,isPro=props.isPro,onUpgrade=props.onUpgrade;
  var _sel=useState(null);var selStory=_sel[0];var setSelStory=_sel[1];
  var _showTr=useState(false);var showTr=_showTr[0];var setShowTr=_showTr[1];
  var _tappedWord=useState(null);var tappedWord=_tappedWord[0];var setTappedWord=_tappedWord[1];
  var _done=useState([]);var doneStories=_done[0];var setDoneStories=_done[1];

  React.useEffect(function(){
    try{window.storage.get("stories_done").then(function(r){if(r&&r.value){try{setDoneStories(JSON.parse(r.value));}catch(e){}}}).catch(function(){});}catch(e){}
  },[]);

  function markDone(id){
    setDoneStories(function(prev){
      if(prev.indexOf(id)!==-1)return prev;
      var next=prev.concat([id]);
      try{window.storage.set("stories_done",JSON.stringify(next)).catch(function(){});}catch(e){}
      return next;
    });
  }

  // Free users get A1 stories only
  function isLocked(st){return !isPro&&st.level!=="A1";}

  // ── Word tap popup ──
  var wordPopup=tappedWord?React.createElement("div",{onClick:function(){setTappedWord(null);},style:{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",backgroundColor:"rgba(0,0,0,0.2)"}},
    React.createElement("div",{onClick:function(e){e.stopPropagation();},style:{backgroundColor:"#1A1A1A",borderRadius:18,padding:"16px 22px",marginBottom:"calc(40px + env(safe-area-inset-bottom,0px))",boxShadow:"0 8px 30px rgba(0,0,0,0.3)",animation:"risePop 0.25s cubic-bezier(0.34,1.56,0.64,1)",maxWidth:320,textAlign:"center"}},
      React.createElement("p",{style:{margin:0,fontSize:22,fontWeight:900,color:"#fff",letterSpacing:-0.3}},tappedWord.eu.replace(/[.,!?]$/,"")),
      React.createElement("p",{style:{margin:"4px 0 0",fontSize:15,color:"#7DD3C0",fontWeight:700}},tappedWord.en.replace(/[.,!?]$/,""))
    )
  ):null;

  // ════ STORY LIST ════
  if(!selStory){
    var byLevel={A1:[],A2:[],B1:[],B2:[]};
    STORIES.forEach(function(s){if(byLevel[s.level])byLevel[s.level].push(s);});
    return React.createElement("div",{style:{maxWidth:480,margin:"0 auto",minHeight:"100vh",backgroundColor:"#F2F2F7",fontFamily:"Nunito,system-ui,sans-serif"}},
      // Header
      React.createElement("div",{style:{background:"linear-gradient(135deg,#0D9488,#134E4A)",paddingTop:"calc(44px + env(safe-area-inset-top,0px))",paddingBottom:24,paddingLeft:18,paddingRight:18,position:"relative"}},
        React.createElement("button",{onClick:onBack,style:{background:"rgba(255,255,255,0.18)",border:"none",color:"#fff",width:34,height:34,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}},"\u2190"),
        React.createElement("h1",{style:{margin:0,fontSize:30,fontWeight:900,color:"#fff",letterSpacing:-0.5}},"Irakurri"),
        React.createElement("p",{style:{margin:"4px 0 0",fontSize:14,color:"rgba(255,255,255,0.85)",fontWeight:600}},"Read short stories in Basque. Tap any word for its meaning.")
      ),
      // Story cards by level
      React.createElement("div",{style:{padding:"18px 16px calc(40px + env(safe-area-inset-bottom,0px))"}},
        ["A1","A2","B1","B2"].map(function(lvl){
          if(!byLevel[lvl].length)return null;
          return React.createElement("div",{key:lvl,style:{marginBottom:22}},
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:10}},
              React.createElement("span",{style:{fontSize:12,fontWeight:900,color:"#fff",backgroundColor:STORY_LEVEL_C[lvl],padding:"3px 11px",borderRadius:12,letterSpacing:0.3}},lvl),
              React.createElement("span",{style:{fontSize:13,fontWeight:700,color:"#8E8E93"}},(CL[lvl]||{}).title||"")
            ),
            byLevel[lvl].map(function(st){
              var locked=isLocked(st);
              var cat=STORY_CATS[st.cat]||STORY_CATS.story;
              var isDone=doneStories.indexOf(st.id)!==-1;
              return React.createElement("button",{key:st.id,onClick:function(){if(locked){onUpgrade();}else{setSelStory(st);setShowTr(false);window.scrollTo(0,0);}},style:{display:"block",width:"100%",textAlign:"left",backgroundColor:"#fff",border:"none",borderRadius:18,padding:"15px 16px",marginBottom:10,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",position:"relative",overflow:"hidden",opacity:locked?0.65:1}},
                React.createElement("div",{style:{position:"absolute",top:0,left:0,bottom:0,width:4,backgroundColor:cat.color}}),
                React.createElement("div",{style:{display:"flex",alignItems:"center",gap:13}},
                  React.createElement("span",{style:{fontSize:30,flexShrink:0}},st.emoji),
                  React.createElement("div",{style:{flex:1,minWidth:0}},
                    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:7}},
                      React.createElement("p",{style:{margin:0,fontSize:16,fontWeight:900,color:"#1A1A1A"}},st.title),
                      isDone&&React.createElement("span",{style:{fontSize:11,color:"#19A85A",fontWeight:900}},"\u2713")
                    ),
                    React.createElement("p",{style:{margin:"1px 0 0",fontSize:13,color:"#8E8E93",fontWeight:600}},st.titleEn),
                    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginTop:5}},
                      React.createElement("span",{style:{fontSize:10,fontWeight:800,color:cat.color,backgroundColor:cat.color+"18",padding:"2px 8px",borderRadius:10}},cat.emoji+" "+cat.label),
                      React.createElement("span",{style:{fontSize:11,color:"#C7C7CC",fontWeight:600}},st.lines.length+" lines")
                    )
                  ),
                  locked?React.createElement("span",{style:{fontSize:16,flexShrink:0}},"\uD83D\uDD12"):React.createElement("span",{style:{fontSize:18,color:"#D1D1D6",flexShrink:0}},"\u2192")
                )
              );
            })
          );
        })
      )
    );
  }

  // ════ STORY READER ════
  var st=selStory;
  var cat=STORY_CATS[st.cat]||STORY_CATS.story;
  var lvlColor=STORY_LEVEL_C[st.level];
  return React.createElement("div",{style:{maxWidth:480,margin:"0 auto",minHeight:"100vh",backgroundColor:"#FBFBFD",fontFamily:"Nunito,system-ui,sans-serif"}},
    wordPopup,
    // Reader header
    React.createElement("div",{style:{background:"linear-gradient(135deg,"+cat.color+","+(cat.color==="#0D9488"?"#134E4A":cat.color==="#9B5DE5"?"#5B21B6":"#C2510E")+")",paddingTop:"calc(44px + env(safe-area-inset-top,0px))",paddingBottom:20,paddingLeft:18,paddingRight:18}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}},
        React.createElement("button",{onClick:function(){setSelStory(null);setTappedWord(null);},style:{background:"rgba(255,255,255,0.18)",border:"none",color:"#fff",width:34,height:34,borderRadius:"50%",cursor:"pointer",fontFamily:"inherit",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}},"\u2190"),
        React.createElement("span",{style:{fontSize:11,fontWeight:900,color:"#fff",backgroundColor:"rgba(255,255,255,0.22)",padding:"4px 11px",borderRadius:12}},st.level+" \u00B7 "+cat.label)
      ),
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:11}},
        React.createElement("span",{style:{fontSize:34}},st.emoji),
        React.createElement("div",null,
          React.createElement("h1",{style:{margin:0,fontSize:24,fontWeight:900,color:"#fff",letterSpacing:-0.4}},st.title),
          React.createElement("p",{style:{margin:"1px 0 0",fontSize:13,color:"rgba(255,255,255,0.85)",fontWeight:600}},st.titleEn)
        )
      )
    ),
    // Intro + translation toggle
    React.createElement("div",{style:{padding:"16px 18px 0"}},
      React.createElement("p",{style:{margin:"0 0 14px",fontSize:13,color:"#8E8E93",fontWeight:600,lineHeight:1.5,fontStyle:"italic"}},st.intro),
      React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",backgroundColor:"#F2F2F7",borderRadius:14,padding:"10px 14px",marginBottom:18}},
        React.createElement("span",{style:{fontSize:13,fontWeight:700,color:"#1A1A1A"}},"\uD83D\uDCAC Show English translation"),
        React.createElement("button",{onClick:function(){setShowTr(function(v){return !v;});haptic("light");},style:{position:"relative",width:48,height:28,borderRadius:14,border:"none",cursor:"pointer",backgroundColor:showTr?cat.color:"#D1D1D6",transition:"background-color 0.2s",flexShrink:0}},
          React.createElement("div",{style:{position:"absolute",top:3,left:showTr?23:3,width:22,height:22,borderRadius:"50%",backgroundColor:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}})
        )
      )
    ),
    // Story body
    React.createElement("div",{style:{padding:"0 18px"}},
      st.lines.map(function(line,li){
        return React.createElement("div",{key:li,style:{marginBottom:showTr?16:13}},
          React.createElement("p",{style:{margin:0,fontSize:19,lineHeight:1.7,fontWeight:600,color:"#1A1A1A"}},
            line.w.map(function(tok,ti){
              return React.createElement("span",{key:ti,onClick:function(){setTappedWord({eu:tok[0],en:tok[1]});},style:{cursor:"pointer",borderBottom:"1.5px dotted "+cat.color+"66",paddingBottom:1,marginRight:5,display:"inline-block"}},tok[0]);
            })
          ),
          showTr&&React.createElement("p",{style:{margin:"4px 0 0",fontSize:14,color:"#8E8E93",fontWeight:500,fontStyle:"italic",lineHeight:1.4,animation:"fadeIn 0.3s ease"}},line.tr)
        );
      })
    ),
    // Finish button
    React.createElement("div",{style:{padding:"20px 18px calc(40px + env(safe-area-inset-bottom,0px))"}},
      React.createElement("button",{onClick:function(){markDone(st.id);sfx("complete");haptic("success");setSelStory(null);setTappedWord(null);},style:{width:"100%",border:"none",borderRadius:18,padding:"16px",fontSize:16,fontWeight:900,cursor:"pointer",background:"linear-gradient(135deg,"+cat.color+","+(cat.color==="#0D9488"?"#134E4A":cat.color==="#9B5DE5"?"#5B21B6":"#C2510E")+")",color:"#fff",fontFamily:"inherit",boxShadow:"0 4px 0 "+(cat.color==="#0D9488"?"#0B3D38":cat.color==="#9B5DE5"?"#4C1D95":"#92400E"),letterSpacing:-0.2}},
        (doneStories.indexOf(st.id)!==-1?"\u2713 Read again":"Mark as read")+" \u2192"
      )
    )
  );
}

export default App;

