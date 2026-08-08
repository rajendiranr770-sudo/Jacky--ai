(() => {
"use strict";

const KEY = "jacky_ai_final_v1";
const defaultDB = {salary:[],farm:[],purchase:[],home:[],loans:[],temp:[],perm:[],reminders:[]};
let DB = loadDB();
let recognition = null;

const $ = id => document.getElementById(id);
const nowISO = () => new Date().toISOString();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const money = n => Number(n || 0).toLocaleString("en-IN");
const tamilDate = iso => new Date(iso).toLocaleString("ta-IN");

function loadDB(){
  try { return {...defaultDB,...JSON.parse(localStorage.getItem(KEY)||"{}")}; }
  catch(e){ return {...defaultDB}; }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(DB)); render(); }
function escapeHTML(v){ return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }

window.showPage = function(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const p=$(name); if(p) p.classList.add("active");
};

function addRecord(bucket,data){ DB[bucket].push({id:uid(),date:nowISO(),...data}); save(); }
function deleteRecord(bucket,id){ DB[bucket]=DB[bucket].filter(x=>x.id!==id); save(); }

function recordHTML(bucket,x,title,sub){
  return `<div class="record"><div><b>${escapeHTML(title)}</b><small>${escapeHTML(sub)}</small></div><button class="danger" onclick="deleteById('${bucket}','${x.id}')">🗑️</button></div>`;
}
window.deleteById=(bucket,id)=>{const item=DB[bucket].find(x=>x.id===id); if(item&&item.linked) deleteLinkedRecord(bucket,id); else deleteRecord(bucket,id);};


function addLinkedExpense(category,note,amt,source){
  // The expense is recorded in its category, while the actual money
  // is deducted exactly once from the chosen source account.
  const sourceLabel = source==="home" ? "வீட்டு பணம்" : source==="salary" ? "சம்பள பணம்" : "கொல்லை பணம்";
  const record={id:uid(),date:nowISO(),amt,note,source,sourceLabel,linked:true};
  DB[category].push(record);

  if(source==="home"){
    DB.home.push({id:uid(),date:record.date,type:"out",amt,note:`${note} — கொல்லை/கொள்முதல்`,linkedTo:record.id,source:"home"});
  }else if(source==="salary"){
    DB.salary.push({id:uid(),date:record.date,type:"out",amt,note:`${note} — கொல்லை/கொள்முதல்`,linkedTo:record.id,source:"salary"});
  }else if(source==="farm" && category!=="farm"){
    DB.farm.push({id:uid(),date:record.date,amt,note,source:"farm",linkedTo:record.id,linked:true});
  }
  save();
}

function deleteLinkedRecord(bucket,id){
  const item=DB[bucket].find(x=>x.id===id);
  if(!item){return;}
  if(item.linked){
    // Remove the linked source-account entry created by this expense.
    if(item.source==="home"){
      DB.home=DB.home.filter(x=>x.linkedTo!==id);
    }else if(item.source==="salary"){
      DB.salary=DB.salary.filter(x=>x.linkedTo!==id);
    }else if(item.source==="farm" && bucket!=="farm"){
      DB.farm=DB.farm.filter(x=>x.linkedTo!==id);
    }
  }
  DB[bucket]=DB[bucket].filter(x=>x.id!==id);
  save();
}

window.addSalary = function(type){
  const amt=Number($("salaryAmount").value);
  if(amt<=0) return alert("தொகையை உள்ளிடுங்கள்.");
  addRecord("salary",{type,amt,note:$("salaryNote").value.trim()||"நேரடி"});
  $("salaryAmount").value=""; $("salaryNote").value="";
};
window.addFarm=function(){
  const amt=Number($("farmAmount").value), note=$("farmNote").value.trim();
  const source=$("farmSource").value;
  if(amt<=0) return alert("தொகையை உள்ளிடுங்கள்.");
  addLinkedExpense("farm", note||"கொல்லை செலவு", amt, source);
  $("farmAmount").value="";$("farmNote").value="";
};
window.addPurchase=function(){
  const name=$("purchaseName").value.trim(),amt=Number($("purchaseAmount").value);
  const source=$("purchaseSource").value;
  if(!name||amt<=0) return alert("பொருள் மற்றும் விலையை உள்ளிடுங்கள்.");
  addLinkedExpense("purchase", name, amt, source);
  $("purchaseName").value="";$("purchaseAmount").value="";
};
window.addHome=function(type){
  const amt=Number($("homeAmount").value);
  if(amt<=0) return alert("தொகையை உள்ளிடுங்கள்.");
  addRecord("home",{type,amt,note:$("homeNote").value.trim()||"நேரடி"});
  $("homeAmount").value="";$("homeNote").value="";
};
window.addLoan=function(){
  const name=$("loanName").value.trim(),amt=Number($("loanAmount").value),rate=Number($("loanRate").value);
  if(!name||amt<=0) return alert("பெயர் மற்றும் தொகையை உள்ளிடுங்கள்.");
  addRecord("loans",{name,amt,rate});
  $("loanName").value="";$("loanAmount").value="";$("loanRate").value="";
};
window.addNote=function(type){
  const el=type==="temp"?$("tempText"):$("permText"),text=el.value.trim();
  if(!text) return;
  addRecord(type==="temp"?"temp":"perm",{text});
  el.value="";
};
window.clearTemporary=function(){
  if(confirm("அனைத்து தற்காலிக நோட்களையும் அழிக்கவா?")){DB.temp=[];save();}
};

window.clearAllData=function(){
  if(confirm("Jacky AI-யின் அனைத்து data-வையும் நிரந்தரமாக அழிக்கவா?")){
    localStorage.removeItem(KEY); location.reload();
  }
};

window.addReminder=function(){
  const text=$("reminderText").value.trim(),date=$("reminderDate").value,time=$("reminderTime").value;
  const early=Math.max(0,Number($("reminderEarly").value)||0);
  if(!text||!date||!time) return alert("விவரங்களை முழுமையாக உள்ளிடுங்கள்.");
  const target=new Date(`${date}T${time}:00`);
  if(Number.isNaN(target.getTime())) return alert("தேதி/நேரம் சரியாக இல்லை.");
  addRecord("reminders",{text,target:target.toISOString(),early,earlyDone:false,done:false});
  $("reminderText").value="";
};

window.requestNotifications=async function(){
  if(!("Notification" in window)) return alert("இந்த browser Notification ஆதரவு இல்லை.");
  const p=await Notification.requestPermission();
  alert(p==="granted"?"Notification அனுமதி கிடைத்தது.":"Notification அனுமதி வழங்கப்படவில்லை.");
};

function speak(text){
  if(!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang="ta-IN";u.rate=.95;u.pitch=1;u.volume=1;speechSynthesis.speak(u);
}
function chatMessage(text,type){
  const box=$("chatBox");
  const el=document.createElement("div");
  el.className="message "+type;el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight;
}
window.clearChat=function(){
  $("chatBox").innerHTML='<div class="message ai">Chat அழிக்கப்பட்டது.</div>';
};

function parseTamilNumber(t){
  const n=t.match(/[\d,]+/); let num=n?Number(n[0].replace(/,/g,"")):0;
  if(/லட்சம்/.test(t)) return (num||1)*100000;
  if(/ஆயிரம்/.test(t)) return (num||1)*1000;
  return num;
}

function parseReminderCommand(text){
  if(!/(ஞாபகப்படுத்து|நினைவூட்டு|நினைவில் வை|remind)/i.test(text)) return false;
  const target=new Date();
  if(/நாளை|நாளைக்கு/.test(text)) target.setDate(target.getDate()+1);

  const tm=text.match(/(\d{1,2})(?:[:.](\d{1,2}))?\s*(மணி|am|pm)?/i);
  if(tm){
    let h=Number(tm[1]),m=Number(tm[2]||0),ap=(tm[3]||"").toLowerCase();
    if(ap==="pm"&&h<12)h+=12;if(ap==="am"&&h===12)h=0;
    target.setHours(h,m,0,0);
    if(target<=new Date() && !/நாளை|நாளைக்கு/.test(text)) target.setDate(target.getDate()+1);
  } else {
    target.setMinutes(target.getMinutes()+60);
  }

  let clean=text.replace(/நாளை|நாளைக்கு|ஞாபகப்படுத்து|நினைவூட்டு|நினைவில் வை|remind/gi,"")
    .replace(/\d{1,2}(?:[:.]\d{1,2})?\s*(மணி|am|pm)?/i,"").trim();
  clean=clean.replace(/^.*?போகணும்\s*/,"போக வேண்டும் ").trim()||"நினைவூட்டல்";

  DB.reminders.push({id:uid(),date:nowISO(),text:clean,target:target.toISOString(),early:60,earlyDone:false,done:false});
  save();
  return `சரி. “${clean}” — ${tamilDate(target.toISOString())}. இலக்கு நேரத்திற்கு 60 நிமிடம் முன்பும் நினைவூட்டுவேன்.`;
}

function parseDeleteCommand(text){
  if(!/(நீக்கு|அழி|delete|remove)/i.test(text)) return false;

  if(/அனைத்து|எல்லா|all/i.test(text)){
    if(/தற்காலிக|temporary|temp/i.test(text)){DB.temp=[];save();return "அனைத்து தற்காலிக நோட்களும் அழிக்கப்பட்டன.";}
    if(/நினைவூட்டல்|reminder/i.test(text)){DB.reminders=[];save();return "அனைத்து நினைவூட்டல்களும் அழிக்கப்பட்டன.";}
  }

  const nameMatch=text.match(/(?:பெயர்|name)\s*[:\-]?\s*([A-Za-z\u0B80-\u0BFF0-9]+)/i);
  if(nameMatch){
    const name=nameMatch[1].toLowerCase();let count=0;
    for(const bucket of ["salary","farm","purchase","home","loans","temp","perm","reminders"]){
      const before=DB[bucket].length;
      DB[bucket]=DB[bucket].filter(x=>!Object.values(x).some(v=>String(v).toLowerCase().includes(name)));
      count+=before-DB[bucket].length;
    }
    if(count){save();return `${nameMatch[1]} தொடர்பான ${count} பதிவு அழிக்கப்பட்டது.`;}
  }

  const timeMatch=text.match(/(\d{1,2})(?:[:.](\d{1,2}))?\s*(மணி|am|pm)?/i);
  if(timeMatch && /நினைவூட்டல்|reminder|நோட்|note|பதிவு|data/i.test(text)){
    const h=Number(timeMatch[1]),m=Number(timeMatch[2]||0);
    const before=DB.reminders.length;
    DB.reminders=DB.reminders.filter(r=>{const d=new Date(r.target);return !(d.getHours()===h&&d.getMinutes()===m);});
    const count=before-DB.reminders.length;if(count){save();return `${h}:${String(m).padStart(2,"0")} நேரத்திலிருந்த நினைவூட்டல் அழிக்கப்பட்டது.`;}
  }

  return "எதை நீக்க வேண்டும் என்று பெயர், நேரம் அல்லது வகையை சொல்லுங்கள். உதா: “ரமேஷ் பெயரில் உள்ளதை நீக்கு” அல்லது “10 மணிக்கான நினைவூட்டலை நீக்கு”.";
}


function parseLinkedExpenseCommand(text){
  const amount=parseTamilNumber(text);
  if(!amount) return false;

  const isExpense=/(செலவு|வாங்கினேன்|வாங்கினோம்|வாங்கியது|வாங்குனேன்|மருந்து|உரம்|பொருள்|கொல்லைக்கு)/.test(text);
  if(!isExpense) return false;

  let source=null;
  if(/வீட்டு|வீட்டுப்|வீட்டில்|வீட்டு பணம்|வீட்டு பணத்திலிருந்து/.test(text)) source="home";
  else if(/சம்பள|சம்பளப்|சம்பளத்தில்|சம்பள பணம்|சம்பள பணத்திலிருந்து/.test(text)) source="salary";
  else if(/கொல்லை பணம்|கொல்லையில்|கொல்லை கணக்கில்/.test(text)) source="farm";

  // If a category is clear but source is not, ask rather than guessing.
  const category=/கொல்லை|மருந்து|உரம்/.test(text) ? "farm" : "purchase";
  const note=/மருந்து/.test(text) ? "மருந்து" : /உரம்/.test(text) ? "உரம்" : "செலவு";

  if(!source){
    return "இந்த செலவு எந்த பணத்தில் இருந்து? “வீட்டு பணத்தில் இருந்து” அல்லது “சம்பள பணத்தில் இருந்து” என்று சொல்லுங்கள்.";
  }

  addLinkedExpense(category,note,amount,source);
  const label=source==="home"?"வீட்டு கணக்கு":source==="salary"?"சம்பள கணக்கு":"கொல்லை கணக்கு";
  return `சரி. ${note} ₹${money(amount)} கொல்லை/செலவு கணக்கில் பதிவு செய்தேன். ${label} கணக்கில் இருந்து ₹${money(amount)} மட்டும் குறைத்தேன்.`;
}

window.sendMessage=function(){
  const input=$("textInput"),text=input.value.trim();if(!text)return;
  chatMessage(text,"user");input.value="";
  let result=parseDeleteCommand(text);
  if(result){chatMessage(result,"ai");speak(result);return;}
  result=parseReminderCommand(text);
  if(result){chatMessage(result,"ai");speak(result);return;}

  result=parseLinkedExpenseCommand(text);
  if(result){chatMessage(result,"ai");speak(result);return;}

  if(/அழி|நீக்கு|delete/i.test(text)){result="நீக்க வேண்டிய பெயர் அல்லது நேரத்தை சொல்லுங்கள்.";chatMessage(result,"ai");speak(result);return;}
  result="சரி. கணக்கு, கொள்முதல், நோட்பேட், நினைவூட்டல் போன்றவற்றை நான் நிர்வகிக்க முடியும்.";
  chatMessage(result,"ai");speak(result);
};

function setupRecognition(){
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){$("status").textContent="🎤 Voice ஆதரவு இல்லை";return;}
  recognition=new SpeechRecognition();
  recognition.lang="ta-IN";recognition.continuous=false;recognition.interimResults=false;
  recognition.onstart=()=>$("status").textContent="🎙️ கேட்கிறேன்...";
  recognition.onresult=e=>{$("textInput").value=e.results[0][0].transcript.trim();sendMessage();};
  recognition.onerror=e=>$("status").textContent="🎙️ Voice error: "+e.error;
  recognition.onend=()=>$("status").textContent="தயார்";
}
window.startListening=function(){if(recognition)recognition.start();else alert("இந்த browser voice recognition ஆதரிக்கவில்லை.");};
window.stopListening=function(){if(recognition)recognition.stop();};

function checkReminders(){
  const n=Date.now();let changed=false;
  DB.reminders.forEach(r=>{
    if(r.done)return;
    const target=new Date(r.target).getTime(),early=target-(Number(r.early)||0)*60000;
    if(!r.earlyDone && r.early>0 && n>=early && n<target){
      const msg=`⏰ நினைவூட்டல்: ${r.text}. இன்னும் ${r.early} நிமிடங்களில் நேரம்.`;
      chatMessage(msg,"ai");speak(msg);
      if("Notification"in window && Notification.permission==="granted") new Notification("Jacky AI",{body:msg});
      r.earlyDone=true;changed=true;
    }
    if(n>=target){
      const msg=`🔔 இப்போது: ${r.text}`;
      chatMessage(msg,"ai");speak(msg);
      if("Notification"in window && Notification.permission==="granted") new Notification("Jacky AI",{body:msg});
      r.done=true;changed=true;
    }
  });
  if(changed)save();
}

function render(){
  const si=DB.salary.filter(x=>x.type==="in").reduce((a,x)=>a+x.amt,0);
  const so=DB.salary.filter(x=>x.type==="out").reduce((a,x)=>a+x.amt,0);
  const hi=DB.home.filter(x=>x.type==="in").reduce((a,x)=>a+x.amt,0);
  const ho=DB.home.filter(x=>x.type==="out").reduce((a,x)=>a+x.amt,0);
  $("salaryBalance").textContent=money(si-so);$("homeBalance").textContent=money(hi-ho);
  $("summarySalary").textContent=money(si-so);$("summaryHome").textContent=money(hi-ho);
  $("summaryRem").textContent=DB.reminders.filter(x=>!x.done).length;

  $("salaryList").innerHTML=DB.salary.slice().reverse().map(x=>recordHTML("salary",x,(x.type==="in"?"+ வரவு ":"- செலவு ")+"₹"+money(x.amt),x.note+" • "+tamilDate(x.date))).join("")||"<p class='muted'>பதிவு இல்லை</p>";
  $("farmList").innerHTML=DB.farm.slice().reverse().map(x=>recordHTML("farm",x,"₹"+money(x.amt),x.note+" • "+(x.sourceLabel||"கொல்லை கணக்கு")+" • "+tamilDate(x.date))).join("")||"<p class='muted'>பதிவு இல்லை</p>";
  $("purchaseList").innerHTML=DB.purchase.slice().reverse().map(x=>recordHTML("purchase",x,x.name+" • ₹"+money(x.amt),(x.sourceLabel||"கொள்முதல்")+" • "+tamilDate(x.date))).join("")||"<p class='muted'>பதிவு இல்லை</p>";
  $("homeList").innerHTML=DB.home.slice().reverse().map(x=>recordHTML("home",x,(x.type==="in"?"+ வரவு ":"- செலவு ")+"₹"+money(x.amt),x.note+" • "+tamilDate(x.date))).join("")||"<p class='muted'>பதிவு இல்லை</p>";
  $("loanList").innerHTML=DB.loans.slice().reverse().map(x=>recordHTML("loans",x,x.name+" • ₹"+money(x.amt),"மாத வட்டி ₹"+money(x.amt*x.rate/100))).join("")||"<p class='muted'>பதிவு இல்லை</p>";
  $("tempList").innerHTML=DB.temp.slice().reverse().map(x=>recordHTML("temp",x,x.text,tamilDate(x.date))).join("")||"<p class='muted'>பதிவு இல்லை</p>";
  $("permList").innerHTML=DB.perm.slice().reverse().map(x=>recordHTML("perm",x,x.text,tamilDate(x.date))).join("")||"<p class='muted'>பதிவு இல்லை</p>";
  $("reminderList").innerHTML=DB.reminders.slice().reverse().map(x=>recordHTML("reminders",x,"⏰ "+x.text,tamilDate(x.target)+" • "+x.early+" நிமிடம் முன்")).join("")||"<p class='muted'>நினைவூட்டல் இல்லை</p>";
}

document.addEventListener("DOMContentLoaded",()=>{
  setupRecognition();render();
  const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
  $("reminderDate").value=tomorrow.toISOString().slice(0,10);
  if("serviceWorker"in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
  setInterval(checkReminders,30000);
  checkReminders();
});
})();