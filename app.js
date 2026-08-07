const API_URL="http://localhost:8000";
let recognition=null,listening=false;
const DB_KEY="jacky_ai_db_v1";
let db={salaryIn:0,salaryOut:0,salaryLogs:[],farmLogs:[],homeIn:0,homeOut:0,homeLogs:[],loans:[],temps:[],perms:[]};

try{const s=localStorage.getItem(DB_KEY);if(s)db={...db,...JSON.parse(s)}}catch(e){}
function saveDB(){localStorage.setItem(DB_KEY,JSON.stringify(db));render()}
function now(){return new Date().toLocaleString("ta-IN",{dateStyle:"short",timeStyle:"short"})}
function showPage(n){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));const p=document.getElementById(n);if(p)p.classList.add("active")}
function addChatMessage(t,type){const b=document.getElementById("chatBox");if(!b)return;const m=document.createElement("div");m.className="message "+type;m.textContent=t;b.appendChild(m);b.scrollTop=b.scrollHeight}
async function sendMessage(){
 const input=document.getElementById("textInput"),status=document.getElementById("status");if(!input)return;
 const text=input.value.trim();if(!text)return;addChatMessage(text,"user");input.value="";if(status)status.textContent="ஜாக்கி யோசிக்கிறது...";
 try{const r=await fetch(API_URL+"/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text})});if(!r.ok)throw Error("server");
 const d=await r.json(),reply=d.reply||d.message||d.response||"பதில் கிடைக்கவில்லை.";addChatMessage(reply,"ai");speakText(reply);if(status)status.textContent="தயார்";
 }catch(e){addChatMessage("ஜாக்கி AI backend தற்போது இணைக்கப்படவில்லை. Termux-ல் backend இயக்கப்பட்டுள்ளதா என்று பார்க்கவும்.","ai");if(status)status.textContent="Server இணைக்கப்படவில்லை"}
}
function speakText(t){if(!("speechSynthesis"in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="ta-IN";u.rate=.95;speechSynthesis.speak(u)}
function setupRecognition(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
 recognition=new SR();recognition.lang="ta-IN";recognition.continuous=false;recognition.interimResults=false;
 recognition.onstart=()=>{listening=true;const s=document.getElementById("status");if(s)s.textContent="🎙️ கேட்கிறேன்..."};
 recognition.onresult=e=>{const t=e.results[0][0].transcript.trim(),i=document.getElementById("textInput");if(i)i.value=t;if(t)sendMessage()};
 recognition.onerror=e=>{listening=false;const s=document.getElementById("status");if(s)s.textContent="🎙️ Voice error: "+e.error};
 recognition.onend=()=>{listening=false;const s=document.getElementById("status");if(s)s.textContent="தயார்"}
}
function startListening(){if(!recognition)setupRecognition();if(recognition)try{recognition.start()}catch(e){}}
function stopListening(){if(recognition)try{recognition.stop()}catch(e){};listening=false;const s=document.getElementById("status");if(s)s.textContent="🎤 மைக் ஆஃப்"}
function clearChat(){const b=document.getElementById("chatBox");if(b)b.innerHTML='<div class="message ai">வணக்கம்! உங்கள் கேள்வியை உள்ளிடுங்கள்.</div>'}
function amount(id){const n=Number(document.getElementById(id).value);return Number.isFinite(n)&&n>0?n:0}
function addSalary(t){const a=amount("salaryAmount"),n=document.getElementById("salaryNote").value.trim()||"நேரடி";if(!a)return alert("தொகையை உள்ளிடுங்கள்.");t==="in"?db.salaryIn+=a:db.salaryOut+=a;db.salaryLogs.unshift({type:t,amt:a,note:n,date:now()});document.getElementById("salaryAmount").value="";document.getElementById("salaryNote").value="";saveDB()}
function addFarm(){const a=amount("farmAmount"),n=document.getElementById("farmNote").value.trim()||"செலவு";if(!a)return alert("தொகையை உள்ளிடுங்கள்.");db.farmLogs.unshift({amt:a,note:n,date:now()});document.getElementById("farmAmount").value="";document.getElementById("farmNote").value="";saveDB()}
function addHome(t){const a=amount("homeAmount"),n=document.getElementById("homeNote").value.trim()||"நேரடி";if(!a)return alert("தொகையை உள்ளிடுங்கள்.");t==="in"?db.homeIn+=a:db.homeOut+=a;db.homeLogs.unshift({type:t,amt:a,note:n,date:now()});document.getElementById("homeAmount").value="";document.getElementById("homeNote").value="";saveDB()}
function addLoan(){const name=document.getElementById("loanName").value.trim(),a=amount("loanAmount"),r=Number(document.getElementById("loanRate").value);if(!name||!a||!Number.isFinite(r))return alert("பெயர், முதல்தொகை, வட்டி % அனைத்தையும் உள்ளிடுங்கள்.");db.loans.unshift({name,amt:a,rate:r,date:now()});document.getElementById("loanName").value="";document.getElementById("loanAmount").value="";document.getElementById("loanRate").value="";saveDB()}
function addTemp(){const e=document.getElementById("tempText"),t=e.value.trim();if(!t)return;db.temps.unshift({text:t,date:now()});e.value="";saveDB()}
function addPerm(){const e=document.getElementById("permText"),t=e.value.trim();if(!t)return;db.perms.unshift({text:t,date:now()});e.value="";saveDB()}
function delSalary(i){const x=db.salaryLogs[i];if(!x)return;x.type==="in"?db.salaryIn-=x.amt:db.salaryOut-=x.amt;db.salaryLogs.splice(i,1);saveDB()}
function delFarm(i){db.farmLogs.splice(i,1);saveDB()}
function delHome(i){const x=db.homeLogs[i];if(!x)return;x.type==="in"?db.homeIn-=x.amt:db.homeOut-=x.amt;db.homeLogs.splice(i,1);saveDB()}
function delLoan(i){db.loans.splice(i,1);saveDB()}function delTemp(i){db.temps.splice(i,1);saveDB()}function delPerm(i){db.perms.splice(i,1);saveDB()}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function render(){
 document.getElementById("salaryBalance").textContent=(db.salaryIn-db.salaryOut).toLocaleString("en-IN");
 document.getElementById("farmTotal").textContent=db.farmLogs.reduce((s,x)=>s+x.amt,0).toLocaleString("en-IN");
 document.getElementById("homeBalance").textContent=(db.homeIn-db.homeOut).toLocaleString("en-IN");
 document.getElementById("homeIn").textContent=db.homeIn.toLocaleString("en-IN");document.getElementById("homeOut").textContent=db.homeOut.toLocaleString("en-IN");
 document.getElementById("salaryList").innerHTML=db.salaryLogs.map((x,i)=>'<div class="item"><button class="delete" onclick="delSalary('+i+')">அழி</button><b>'+(x.type==="in"?"➕ வரவு":"➖ செலவு")+' ₹'+x.amt.toLocaleString("en-IN")+'</b><div>'+esc(x.note)+'</div><div class="date">'+x.date+'</div></div>').join("");
 document.getElementById("farmList").innerHTML=db.farmLogs.map((x,i)=>'<div class="item"><button class="delete" onclick="delFarm('+i+')">அழி</button><b>₹'+x.amt.toLocaleString("en-IN")+'</b><div>'+esc(x.note)+'</div><div class="date">'+x.date+'</div></div>').join("");
 document.getElementById("homeList").innerHTML=db.homeLogs.map((x,i)=>'<div class="item"><button class="delete" onclick="delHome('+i+')">அழி</button><b>'+(x.type==="in"?"➕ வரவு":"➖ செலவு")+' ₹'+x.amt.toLocaleString("en-IN")+'</b><div>'+esc(x.note)+'</div><div class="date">'+x.date+'</div></div>').join("");
 document.getElementById("loanList").innerHTML=db.loans.map((x,i)=>'<div class="item"><button class="delete" onclick="delLoan('+i+')">அழி</button><b>'+esc(x.name)+'</b><div>முதல்தொகை: ₹'+x.amt.toLocaleString("en-IN")+'</div><div>மாத வட்டி: '+x.rate+'% = ₹'+(x.amt*x.rate/100).toLocaleString("en-IN",{maximumFractionDigits:2})+'</div><div class="date">'+x.date+'</div></div>').join("");
 document.getElementById("tempList").innerHTML=db.temps.map((x,i)=>'<div class="item"><button class="delete" onclick="delTemp('+i+')">அழி</button><div>'+esc(x.text)+'</div><div class="date">'+x.date+'</div></div>').join("");
 document.getElementById("permList").innerHTML=db.perms.map((x,i)=>'<div class="item"><button class="delete" onclick="delPerm('+i+')">அழி</button><div>'+esc(x.text)+'</div><div class="date">'+x.date+'</div></div>').join("");
}
document.addEventListener("DOMContentLoaded",()=>{setupRecognition();render()});