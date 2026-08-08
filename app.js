/* =========================================================
   JACKY AI - SMART PA
   Full Application JavaScript
   ========================================================= */

"use strict";

/* =========================================================
   DATABASE
   ========================================================= */

const DB_KEY = "balaji_pa_db_v12";

let db = {
  salaryIn: 0,
  salaryOut: 0,
  salaryLogs: [],

  homeIn: 0,
  homeOut: 0,
  homeLogs: [],

  farmLogs: [],

  expenseLogs: [],

  loans: [],

  temps: [],
  perms: [],

  reminders: [],

  chat: [],

  lastAction: null
};


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function money(n){

  n = Number(n) || 0;

  return n.toLocaleString("en-IN",{
    maximumFractionDigits:2
  });

}


function nowText(){

  return new Date().toLocaleString("en-IN",{
    day:"2-digit",
    month:"2-digit",
    year:"numeric",
    hour:"numeric",
    minute:"2-digit"
  });

}


function todayDate(){

  const d = new Date();

  const y = d.getFullYear();

  const m = String(d.getMonth()+1).padStart(2,"0");

  const day = String(d.getDate()).padStart(2,"0");

  return `${y}-${m}-${day}`;

}


function escapeHTML(text){

  return String(text ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


/* =========================================================
   SAVE / LOAD
   ========================================================= */

function saveDB(){

  try{

    localStorage.setItem(
      DB_KEY,
      JSON.stringify(db)
    );

  }catch(e){

    console.error("Save error:",e);

  }

}


function loadDB(){

  try{

    const saved = localStorage.getItem(DB_KEY);

    if(saved){

      const parsed = JSON.parse(saved);

      db = normalizeDB(parsed);

      return;

    }

    /*
      பழைய version data இருந்தால் எடுத்துக்கொள்ள முயற்சி.
    */

    const old = localStorage.getItem("balaji_pa_db_v12");

    if(old){

      const parsed = JSON.parse(old);

      db = normalizeDB(parsed);

      saveDB();

      return;

    }

  }catch(e){

    console.error("Load error:",e);

  }

  db = normalizeDB(db);

}


function normalizeDB(x){

  x = x || {};

  const out = {

    salaryIn:
      Number(x.salaryIn ?? x.salIn ?? 0),

    salaryOut:
      Number(x.salaryOut ?? x.salOut ?? 0),

    salaryLogs:
      Array.isArray(x.salaryLogs)
        ? x.salaryLogs
        : Array.isArray(x.salLogs)
          ? x.salLogs.map(v=>({
              type:v.type || "out",
              amount:Number(v.amount ?? v.amt ?? 0),
              note:v.note || "",
              date:v.date || nowText()
            }))
          : [],

    homeIn:
      Number(x.homeIn ?? 0),

    homeOut:
      Number(x.homeOut ?? 0),

    homeLogs:
      Array.isArray(x.homeLogs)
        ? x.homeLogs
        : [],

    farmLogs:
      Array.isArray(x.farmLogs)
        ? x.farmLogs
        : [],

    expenseLogs:
      Array.isArray(x.expenseLogs)
        ? x.expenseLogs
        : [],

    loans:
      Array.isArray(x.loans)
        ? x.loans
        : [],

    temps:
      Array.isArray(x.temps)
        ? x.temps
        : [],

    perms:
      Array.isArray(x.perms)
        ? x.perms
        : [],

    reminders:
      Array.isArray(x.reminders)
        ? x.reminders
        : [],

    chat:
      Array.isArray(x.chat)
        ? x.chat
        : [],

    lastAction:
      x.lastAction || null

  };

  return out;

}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(id){

  document.querySelectorAll(".page")
    .forEach(p=>{
      p.classList.remove("active");
    });

  const page = document.getElementById(id);

  if(page){

    page.classList.add("active");

  }

  document.querySelectorAll("nav button")
    .forEach(btn=>{
      btn.classList.remove("active");
    });

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderAll(){

  renderHome();

  renderSalary();

  renderExpense();

  renderFarm();

  renderHomeAccount();

  renderLoans();

  renderNotes();

  renderReminders();

}


/* =========================================================
   HOME SUMMARY
   ========================================================= */

function getSalaryBalance(){

  return db.salaryIn - db.salaryOut;

}


function getHomeBalance(){

  return db.homeIn - db.homeOut;

}


function getExpenseTotalThisMonth(){

  const d = new Date();

  const month = d.getMonth();

  const year = d.getFullYear();

  return db.expenseLogs
    .filter(x=>{

      const date = new Date(x.isoDate || x.dateRaw || 0);

      return (
        date.getMonth() === month &&
        date.getFullYear() === year
      );

    })
    .reduce((sum,x)=>sum + Number(x.amount || 0),0);

}


function renderHome(){

  const s = document.getElementById("summarySalary");

  const h = document.getElementById("summaryHome");

  const e = document.getElementById("summaryExpense");

  const r = document.getElementById("summaryRem");

  if(s){

    s.textContent =
      "₹" + money(getSalaryBalance());

  }

  if(h){

    h.textContent =
      "₹" + money(getHomeBalance());

  }

  if(e){

    e.textContent =
      "₹" + money(getExpenseTotalThisMonth());

  }

  if(r){

    r.textContent =
      db.reminders.filter(x=>!x.done).length;

  }

}


/* =========================================================
   SALARY
   ========================================================= */

function addSalary(type){

  const amount =
    Number(document.getElementById("salaryAmount").value);

  const note =
    document.getElementById("salaryNote").value.trim();

  if(!amount || amount <= 0){

    alert("தொகையை சரியாக கொடுக்கவும்.");

    return;

  }

  const item = {

    id:Date.now(),

    type,

    amount,

    note:note || (type==="in" ? "நேரடி வரவு" : "நேரடி செலவு"),

    date:nowText(),

    isoDate:new Date().toISOString()

  };

  db.salaryLogs.unshift(item);

  if(type==="in"){

    db.salaryIn += amount;

  }else{

    db.salaryOut += amount;

  }

  db.lastAction = {

    target:"salaryLog",

    id:item.id

  };

  document.getElementById("salaryAmount").value="";

  document.getElementById("salaryNote").value="";

  saveDB();

  renderAll();

}


function renderSalary(){

  const balance =
    document.getElementById("salaryBalance");

  const list =
    document.getElementById("salaryList");

  if(balance){

    balance.textContent =
      money(getSalaryBalance());

  }

  if(!list) return;

  if(db.salaryLogs.length===0){

    list.innerHTML =
      `<div class="empty">சம்பள பதிவுகள் இல்லை.</div>`;

    return;

  }

  list.innerHTML =
    db.salaryLogs.map(x=>{

      const sign =
        x.type==="in" ? "+" : "−";

      return `

        <div class="record">

          <div>

            <b>${sign} ₹${money(x.amount)}</b>

            <small>
              ${escapeHTML(x.note)}
              • ${escapeHTML(x.date)}
            </small>

          </div>

          <button
            class="delete"
            onclick="deleteSalary(${x.id})">
            🗑️
          </button>

        </div>

      `;

    }).join("");

}


function deleteSalary(id){

  const index =
    db.salaryLogs.findIndex(x=>x.id===id);

  if(index<0) return;

  const item =
    db.salaryLogs[index];

  if(item.type==="in"){

    db.salaryIn -= Number(item.amount);

  }else{

    db.salaryOut -= Number(item.amount);

  }

  db.salaryLogs.splice(index,1);

  saveDB();

  renderAll();

}


/* =========================================================
   HOME ACCOUNT
   ========================================================= */

function addHome(type){

  const amount =
    Number(document.getElementById("homeAmount").value);

  const note =
    document.getElementById("homeNote").value.trim();

  if(!amount || amount<=0){

    alert("தொகையை சரியாக கொடுக்கவும்.");

    return;

  }

  const item = {

    id:Date.now(),

    type,

    amount,

    note:note || "நேரடி",

    date:nowText(),

    isoDate:new Date().toISOString()

  };

  db.homeLogs.unshift(item);

  if(type==="in"){

    db.homeIn += amount;

  }else{

    db.homeOut += amount;

  }

  db.lastAction = {

    target:"homeLog",

    id:item.id

  };

  document.getElementById("homeAmount").value="";

  document.getElementById("homeNote").value="";

  saveDB();

  renderAll();

}


function renderHomeAccount(){

  const balance =
    document.getElementById("homeBalance");

  const list =
    document.getElementById("homeList");

  if(balance){

    balance.textContent =
      money(getHomeBalance());

  }

  if(!list) return;

  if(db.homeLogs.length===0){

    list.innerHTML =
      `<div class="empty">வீட்டு பதிவுகள் இல்லை.</div>`;

    return;

  }

  list.innerHTML =
    db.homeLogs.map(x=>{

      const sign =
        x.type==="in" ? "+" : "−";

      return `

        <div class="record">

          <div>

            <b>${sign} ₹${money(x.amount)}</b>

            <small>
              ${escapeHTML(x.note)}
              • ${escapeHTML(x.date)}
            </small>

          </div>

          <button
            class="delete"
            onclick="deleteHome(${x.id})">
            🗑️
          </button>

        </div>

      `;

    }).join("");

}


function deleteHome(id){

  const index =
    db.homeLogs.findIndex(x=>x.id===id);

  if(index<0) return;

  const item =
    db.homeLogs[index];

  if(item.type==="in"){

    db.homeIn -= Number(item.amount);

  }else{

    db.homeOut -= Number(item.amount);

  }

  db.homeLogs.splice(index,1);

  saveDB();

  renderAll();

}


/* =========================================================
   EXPENSE
   ========================================================= */

function addExpenseManual(){

  const note =
    document.getElementById("expenseNote").value.trim();

  const amount =
    Number(document.getElementById("expenseAmount").value);

  const person =
    document.getElementById("expensePerson").value.trim();

  const source =
    document.getElementById("expenseSource").value;

  if(!amount || amount<=0){

    alert("தொகையை சரியாக கொடுக்கவும்.");

    return;

  }

  addExpense({

    note:note || "பொது செலவு",

    amount,

    person,

    source,

    silent:false

  });

}


function addExpense(data){

  const amount =
    Number(data.amount)||0;

  if(amount<=0) return null;

  const item = {

    id:Date.now()+Math.floor(Math.random()*1000),

    note:data.note || "செலவு",

    amount,

    person:data.person || "",

    source:data.source || "home",

    date:nowText(),

    isoDate:new Date().toISOString()

  };

  db.expenseLogs.unshift(item);

  /*
    செலவு எந்த account-ல் இருந்து வந்தது
  */

  if(item.source==="salary"){

    db.salaryOut += amount;

    db.salaryLogs.unshift({

      id:item.id,

      type:"out",

      amount,

      note:item.note,

      date:item.date,

      isoDate:item.isoDate,

      linkedExpense:true

    });

  }

  else if(item.source==="home"){

    db.homeOut += amount;

    db.homeLogs.unshift({

      id:item.id,

      type:"out",

      amount,

      note:item.note,

      date:item.date,

      isoDate:item.isoDate,

      linkedExpense:true

    });

  }

  else if(item.source==="farm"){

    /*
      Farm account தனி balance இல்லை.
      Farm expense மட்டும் பதிவு.
    */

  }

  db.lastAction = {

    target:"expense",

    id:item.id

  };

  saveDB();

  renderAll();

  return item;

}


function renderExpense(){

  const list =
    document.getElementById("expenseList");

  if(!list) return;

  if(db.expenseLogs.length===0){

    list.innerHTML =
      `<div class="empty">செலவு பதிவுகள் இல்லை.</div>`;

    return;

  }

  list.innerHTML =
    db.expenseLogs.map(x=>{

      const sourceName =
        x.source==="salary"
          ? "சம்பளம்"
          : x.source==="home"
            ? "வீடு"
            : "கொல்லை";

      return `

        <div class="record">

          <div>

            <b>
              ₹${money(x.amount)} •
              ${escapeHTML(x.note)}
            </b>

            <small>
              ${x.person
                ? escapeHTML(x.person)+" • "
                : ""}
              ${sourceName}
              • ${escapeHTML(x.date)}
            </small>

          </div>

          <button
            class="delete"
            onclick="deleteExpense(${x.id})">
            🗑️
          </button>

        </div>

      `;

    }).join("");

}


function deleteExpense(id){

  const index =
    db.expenseLogs.findIndex(x=>x.id===id);

  if(index<0) return;

  const item =
    db.expenseLogs[index];

  if(item.source==="salary"){

    db.salaryOut -= Number(item.amount);

    const sIndex =
      db.salaryLogs.findIndex(x=>x.id===id);

    if(sIndex>=0){

      db.salaryLogs.splice(sIndex,1);

    }

  }

  if(item.source==="home"){

    db.homeOut -= Number(item.amount);

    const hIndex =
      db.homeLogs.findIndex(x=>x.id===id);

    if(hIndex>=0){

      db.homeLogs.splice(hIndex,1);

    }

  }

  db.expenseLogs.splice(index,1);

  saveDB();

  renderAll();

}


/* =========================================================
   FARM
   ========================================================= */

function addFarm(){

  const amount =
    Number(document.getElementById("farmAmount").value);

  const note =
    document.getElementById("farmNote").value.trim();

  const source =
    document.getElementById("farmSource").value;

  if(!amount || amount<=0){

    alert("தொகையை சரியாக கொடுக்கவும்.");

    return;

  }

  const item = {

    id:Date.now(),

    amount,

    note:note || "கொல்லை செலவு",

    source,

    date:nowText(),

    isoDate:new Date().toISOString()

  };

  db.farmLogs.unshift(item);

  /*
    Farm expense என்றாலும் எந்த account-ல்
    பணம் எடுத்தோம் என்பதை கணக்கில் காட்டுகிறோம்.
  */

  if(source==="salary"){

    db.salaryOut += amount;

    db.salaryLogs.unshift({

      id:item.id,

      type:"out",

      amount,

      note:item.note,

      date:item.date,

      isoDate:item.isoDate,

      linkedFarm:true

    });

  }

  if(source==="home"){

    db.homeOut += amount;

    db.homeLogs.unshift({

      id:item.id,

      type:"out",

      amount,

      note:item.note,

      date:item.date,

      isoDate:item.isoDate,

      linkedFarm:true

    });

  }

  saveDB();

  renderAll();

  document.getElementById("farmAmount").value="";

  document.getElementById("farmNote").value="";

}


function renderFarm(){

  const list =
    document.getElementById("farmList");

  if(!list) return;

  if(db.farmLogs.length===0){

    list.innerHTML =
      `<div class="empty">கொல்லை பதிவுகள் இல்லை.</div>`;

    return;

  }

  list.innerHTML =
    db.farmLogs.map(x=>{

      const sourceName =
        x.source==="salary"
          ? "சம்பளம்"
          : x.source==="home"
            ? "வீடு"
            : "கொல்லை";

      return `

        <div class="record">

          <div>

            <b>
              ₹${money(x.amount)} •
              ${escapeHTML(x.note)}
            </b>

            <small>
              ${sourceName}
              • ${escapeHTML(x.date)}
            </small>

          </div>

          <button
            class="delete"
            onclick="deleteFarm(${x.id})">
            🗑️
          </button>

        </div>

      `;

    }).join("");

}


function deleteFarm(id){

  const index =
    db.farmLogs.findIndex(x=>x.id===id);

  if(index<0) return;

  const item =
    db.farmLogs[index];

  if(item.source==="salary"){

    db.salaryOut -= Number(item.amount);

    const i =
      db.salaryLogs.findIndex(x=>x.id===id);

    if(i>=0){

      db.salaryLogs.splice(i,1);

    }

  }

  if(item.source==="home"){

    db.homeOut -= Number(item.amount);

    const i =
      db.homeLogs.findIndex(x=>x.id===id);

    if(i>=0){

      db.homeLogs.splice(i,1);

    }

  }

  db.farmLogs.splice(index,1);

  saveDB();

  renderAll();

}


/* =========================================================
   LOAN / INTEREST
   ========================================================= */

function addLoan(){

  const name =
    document.getElementById("loanName").value.trim();

  const amount =
    Number(document.getElementById("loanAmount").value);

  const rate =
    Number(document.getElementById("loanRate").value);

  const date =
    document.getElementById("loanDate").value ||
    todayDate();

  if(!name){

    alert("பெயரை கொடுக்கவும்.");

    return;

  }

  if(!amount || amount<=0){

    alert("அசல் தொகையை கொடுக்கவும்.");

    return;

  }

  if(rate<0){

    alert("வட்டி சதவீதம் சரியாக கொடுக்கவும்.");

    return;

  }

  const loan = {

    id:Date.now(),

    name,

    amount,

    rate,

    startDate:date,

    payments:[],

    created:nowText()

  };

  db.loans.unshift(loan);

  saveDB();

  renderAll();

  document.getElementById("loanName").value="";

  document.getElementById("loanAmount").value="";

  document.getElementById("loanRate").value="";

}


function loanInterest(loan){

  return Number(loan.amount) *
         Number(loan.rate) / 100;

}


function loanElapsedMonths(loan){

  const start =
    new Date(loan.startDate || todayDate());

  const now =
    new Date();

  let months =
    (now.getFullYear()-start.getFullYear())*12 +
    (now.getMonth()-start.getMonth());

  if(now.getDate() < start.getDate()){

    months--;

  }

  return Math.max(0,months);

}


function loanTotalInterest(loan){

  return loanInterest(loan) *
         loanElapsedMonths(loan);

}


function loanPaidAmount(loan){

  return (loan.payments || [])
    .reduce((sum,p)=>
      sum + Number(p.amount||0),0);

}


function loanBalance(loan){

  return Math.max(
    0,
    Number(loan.amount) -
    loanPaidAmount(loan)
  );

}


function loanTotalDue(loan){

  return loanBalance(loan) +
         loanTotalInterest(loan);

}


function renderLoans(){

  const list =
    document.getElementById("loanList");

  if(!list) return;

  if(db.loans.length===0){

    list.innerHTML =
      `<div class="empty">
        இன்னும் Loan Account இல்லை.
      </div>`;

    return;

  }

  /*
    ஒரே பெயர் இருந்தாலும் ஒவ்வொரு account
    தனித்தனி account ஆக காட்டப்படும்.
  */

  list.innerHTML =
    db.loans.map((loan,index)=>{

      const monthly =
        loanInterest(loan);

      const months =
        loanElapsedMonths(loan);

      const interest =
        loanTotalInterest(loan);

      const paid =
        loanPaidAmount(loan);

      const balance =
        loanBalance(loan);

      const total =
        loanTotalDue(loan);

      return `

        <div class="loan-person">

          <div class="loan-person-header">

            <h3>
              👤 ${escapeHTML(loan.name)}
            </h3>

            <div class="loan-person-summary">

              Account #${index+1}
              •
              அசல் ₹${money(loan.amount)}

            </div>

          </div>


          <div class="loan-account">

            <div class="loan-account-header">

              <b>
                💰 Loan Account
              </b>

              <span>
                ${escapeHTML(loan.startDate)}
              </span>

            </div>


            <div class="loan-account-body">

              <div class="loan-row">

                <span>அசல்</span>

                <b>
                  ₹${money(loan.amount)}
                </b>

              </div>


              <div class="loan-row">

                <span>மாத வட்டி</span>

                <b>
                  ${money(loan.rate)}%
                </b>

              </div>


              <div class="loan-row">

                <span>ஒரு மாத வட்டி</span>

                <b>
                  ₹${money(monthly)}
                </b>

              </div>


              <div class="loan-row">

                <span>கடந்த மாதங்கள்</span>

                <b>
                  ${months}
                </b>

              </div>


              <div class="loan-row">

                <span>இதுவரை வட்டி</span>

                <b>
                  ₹${money(interest)}
                </b>

              </div>


              <div class="loan-row">

                <span>திருப்பி கொடுத்தது</span>

                <b>
                  ₹${money(paid)}
                </b>

              </div>


              <div class="loan-row">

                <span>மீதமுள்ள அசல்</span>

                <b>
                  ₹${money(balance)}
                </b>

              </div>


              <div class="loan-row">

                <span>மொத்த நிலுவை</span>

                <b>
                  ₹${money(total)}
                </b>

              </div>


              <div class="loan-actions">

                <button
                  onclick="addLoanPayment(${loan.id})">
                  💵 திருப்பி கொடுத்த தொகை
                </button>

                <button
                  class="danger"
                  onclick="deleteLoan(${loan.id})">
                  🗑️ Account அழி
                </button>

              </div>


              ${
                (loan.payments || []).length
                ? `

                  <hr>

                  <b>திருப்பி கொடுத்த பதிவுகள்</b>

                  ${
                    loan.payments.map(p=>`

                      <div class="loan-row">

                        <span>
                          ₹${money(p.amount)}
                          •
                          ${escapeHTML(p.date)}
                        </span>

                        <button
                          class="danger"
                          onclick="deleteLoanPayment(
                            ${loan.id},
                            ${p.id}
                          )">
                          🗑️
                        </button>

                      </div>

                    `).join("")
                  }

                `
                : ""
              }

            </div>

          </div>

        </div>

      `;

    }).join("");

}


function addLoanPayment(loanId){

  const loan =
    db.loans.find(x=>x.id===loanId);

  if(!loan) return;

  const value =
    prompt(
      `${loan.name} - திருப்பி கொடுத்த தொகை?`
    );

  if(value===null) return;

  const amount =
    Number(
      String(value).replace(/,/g,"")
    );

  if(!amount || amount<=0){

    alert("தொகை சரியாக இல்லை.");

    return;

  }

  if(!loan.payments){

    loan.payments=[];

  }

  loan.payments.push({

    id:Date.now(),

    amount,

    date:nowText()

  });

  saveDB();

  renderAll();

}


function deleteLoanPayment(loanId,paymentId){

  const loan =
    db.loans.find(x=>x.id===loanId);

  if(!loan) return;

  loan.payments =
    (loan.payments || [])
      .filter(p=>p.id!==paymentId);

  saveDB();

  renderAll();

}


function deleteLoan(id){

  if(!confirm("இந்த Loan Account-ஐ அழிக்கவா?")){

    return;

  }

  db.loans =
    db.loans.filter(x=>x.id!==id);

  saveDB();

  renderAll();

}


/* =========================================================
   NOTES
   ========================================================= */

function addNote(type){

  const id =
    type==="temp"
      ? "tempText"
      : "permText";

  const input =
    document.getElementById(id);

  const text =
    input.value.trim();

  if(!text){

    alert("குறிப்பை எழுதவும்.");

    return;

  }

  const item = {

    id:Date.now(),

    text,

    date:nowText()

  };

  if(type==="temp"){

    db.temps.unshift(item);

  }else{

    db.perms.unshift(item);

  }

  input.value="";

  saveDB();

  renderNotes();

}


function renderNotes(){

  const temp =
    document.getElementById("tempList");

  const perm =
    document.getElementById("permList");

  if(temp){

    temp.innerHTML =
      db.temps.length
      ? db.temps.map(x=>`

          <div class="record">

            <div>

              <b>
                ${escapeHTML(x.text)}
              </b>

              <small>
                ${escapeHTML(x.date)}
              </small>

            </div>

            <button
              class="delete"
              onclick="deleteNote('temp',${x.id})">
              🗑️
            </button>

          </div>

        `).join("")
      : `<div class="empty">
          தற்காலிக குறிப்புகள் இல்லை.
        </div>`;

  }


  if(perm){

    perm.innerHTML =
      db.perms.length
      ? db.perms.map(x=>`

          <div class="record">

            <div>

              <b>
                ${escapeHTML(x.text)}
              </b>

              <small>
                ${escapeHTML(x.date)}
              </small>

            </div>

            <button
              class="delete"
              onclick="deleteNote('perm',${x.id})">
              🗑️
            </button>

          </div>

        `).join("")
      : `<div class="empty">
          நிரந்தர குறிப்புகள் இல்லை.
        </div>`;

  }

}


function deleteNote(type,id){

  if(type==="temp"){

    db.temps =
      db.temps.filter(x=>x.id!==id);

  }else{

    db.perms =
      db.perms.filter(x=>x.id!==id);

  }

  saveDB();

  renderNotes();

}


function clearTemporary(){

  if(!db.temps.length) return;

  if(!confirm(
    "அனைத்து தற்காலிக குறிப்புகளையும் அழிக்கவா?"
  )){

    return;

  }

  db.temps=[];

  saveDB();

  renderNotes();

}


/* =========================================================
   REMINDERS
   ========================================================= */

function addReminder(){

  const text =
    document.getElementById("reminderText").value.trim();

  const date =
    document.getElementById("reminderDate").value;

  const time =
    document.getElementById("reminderTime").value;

  const early =
    Number(
      document.getElementById("reminderEarly").value
    ) || 0;

  if(!text){

    alert("எதை நினைவூட்ட வேண்டும் என்பதை எழுதவும்.");

    return;

  }

  if(!date || !time){

    alert("தேதி மற்றும் நேரம் கொடுக்கவும்.");

    return;

  }

  const item = {

    id:Date.now(),

    text,

    date,

    time,

    early,

    done:false,

    notified:false

  };

  db.reminders.unshift(item);

  saveDB();

  renderAll();

  document.getElementById("reminderText").value="";

}


function reminderDateTime(r){

  return new Date(
    `${r.date}T${r.time}:00`
  );

}


function renderReminders(){

  const list =
    document.getElementById("reminderList");

  if(!list) return;

  if(db.reminders.length===0){

    list.innerHTML =
      `<div class="empty">
        நினைவூட்டல்கள் இல்லை.
      </div>`;

    return;

  }

  const now =
    new Date();

  list.innerHTML =
    db.reminders.map(r=>{

      const target =
        reminderDateTime(r);

      const notifyAt =
        new Date(
          target.getTime() -
          Number(r.early||0)*60000
        );

      const due =
        now >= notifyAt &&
        !r.done;

      return `

        <div class="record ${
          due
            ? "reminder-due"
            : "reminder-ok"
        }">

          <div>

            <b>
              ⏰ ${escapeHTML(r.text)}
            </b>

            <small>

              ${escapeHTML(r.date)}
              •
              ${escapeHTML(r.time)}
              •
              ${r.early} நிமிடம் முன்

            </small>

          </div>


          <div>

            ${
              !r.done
              ? `
                <button
                  class="green"
                  onclick="completeReminder(${r.id})">
                  ✓
                </button>
              `
              : `
                <button class="gray">
                  முடிந்தது
                </button>
              `
            }

            <button
              class="delete"
              onclick="deleteReminder(${r.id})">
              🗑️
            </button>

          </div>

        </div>

      `;

    }).join("");

}


function completeReminder(id){

  const r =
    db.reminders.find(x=>x.id===id);

  if(!r) return;

  r.done=true;

  saveDB();

  renderAll();

}


function deleteReminder(id){

  db.reminders =
    db.reminders.filter(x=>x.id!==id);

  saveDB();

  renderAll();

}


/* =========================================================
   NOTIFICATION
   ========================================================= */

async function requestNotifications(){

  if(!("Notification" in window)){

    alert(
      "இந்த browser Notification-ஐ support செய்யவில்லை."
    );

    return;

  }

  try{

    const permission =
      await Notification.requestPermission();

    if(permission==="granted"){

      new Notification(
        "🎙️ ஜாக்கி",
        {
          body:"Notification வேலை செய்கிறது!"
        }
      );

    }

  }catch(e){

    console.error(e);

  }

}


function checkReminders(){

  const now =
    new Date();

  let changed=false;

  db.reminders.forEach(r=>{

    if(r.done || r.notified) return;

    const target =
      reminderDateTime(r);

    const notifyAt =
      new Date(
        target.getTime() -
        Number(r.early||0)*60000
      );

    if(now>=notifyAt){

      r.notified=true;

      changed=true;

      if(
        "Notification" in window &&
        Notification.permission==="granted"
      ){

        try{

          new Notification(
            "⏰ ஜாக்கி நினைவூட்டல்",
            {
              body:r.text
            }
          );

        }catch(e){}

      }

    }

  });

  if(changed){

    saveDB();

    renderReminders();

  }

}


/* =========================================================
   AMOUNT PARSER
   ========================================================= */

function parseAmount(text){

  if(!text) return 0;

  let s =
    String(text)
      .toLowerCase()
      .replace(/,/g,"")
      .replace(/₹/g," ")
      .replace(/ரூபாய்/g," ")
      .replace(/ரூபா/g," ")
      .replace(/ரூ/g," ");

  /*
    Direct numeric amount
  */

  const nums =
    s.match(/\d+(?:\.\d+)?/g);

  let numeric=0;

  if(nums && nums.length){

    /*
      பொதுவாக முதல் பெரிய numeric amount.
    */

    numeric =
      Number(nums[0]);

  }

  /*
    Tamil amount words
  */

  const words = {

    "பத்தாயிரம்":10000,
    "பதினாயிரம்":10000,

    "இருபதாயிரம்":20000,

    "முப்பதாயிரம்":30000,

    "நாற்பதாயிரம்":40000,

    "ஐம்பதாயிரம்":50000,

    "அறுபதாயிரம்":60000,

    "எழுபதாயிரம்":70000,

    "எண்பதாயிரம்":80000,

    "தொண்ணூறாயிரம்":90000,

    "ஒரு லட்சம்":100000,
    "ஒருலட்சம்":100000,

    "இரண்டு லட்சம்":200000,
    "மூன்று லட்சம்":300000

  };

  let wordAmount=0;

  for(const key in words){

    if(s.includes(key)){

      wordAmount =
        words[key];

      break;

    }

  }

  /*
    "20 ஆயிரம்"
    "5 ஆயிரம்"
    "2 லட்சம்"
  */

  const thousand =
    s.match(
      /(\d+(?:\.\d+)?)\s*ஆயிரம்/
    );

  if(thousand){

    wordAmount =
      Number(thousand[1])*1000;

  }

  const lakh =
    s.match(
      /(\d+(?:\.\d+)?)\s*லட்சம்/
    );

  if(lakh){

    wordAmount =
      Number(lakh[1])*100000;

  }

  return Math.max(
    numeric || 0,
    wordAmount || 0
  );

}


/* =========================================================
   RATE PARSER
   ========================================================= */

function parseRate(text){

  if(!text) return 0;

  const s =
    text.toLowerCase();

  const numeric =
    s.match(
      /(\d+(?:\.\d+)?)\s*(?:%|சதவீதம்|வட்டி)/
    );

  if(numeric){

    return Number(numeric[1]);

  }

  if(
    s.includes("மூன்று") ||
    s.includes("மூணு")
  ){

    return 3;

  }

  if(
    s.includes("இரண்டு") ||
    s.includes("ரெண்டு") ||
    s.includes("2")
  ){

    return 2;

  }

  if(
    s.includes("ஒன்று") ||
    s.includes("ஒரு சதவீத")
  ){

    return 1;

  }

  return 0;

}


/* =========================================================
   PERSON PARSER
   ========================================================= */

function parsePerson(text){

  /*
    "MMக்கு"
    "MM க்கு"
    "ராஜாவுக்கு"
    போன்றவற்றை பிடிக்கும்.
  */

  let m =
    text.match(
      /([A-Za-z\u0B80-\u0BFF]{2,})\s*(?:க்கு|கிட்ட|விடம்|இடம்|க்கு)/i
    );

  if(m){

    return m[1];

  }

  /*
    "ராஜா 50000 2% வட்டி"
  */

  const words =
    text.trim().split(/\s+/);

  if(words.length){

    const first =
      words[0]
        .replace(/[^\u0B80-\u0BFFA-Za-z]/g,"");

    if(
      first &&
      !/^\d+$/.test(first) &&
      ![
        "வட்டி",
        "கணக்கு",
        "சம்பளம்",
        "வரவு",
        "செலவு"
      ].includes(first)
    ){

      return first;

    }

  }

  return "";

}


/* =========================================================
   SOURCE PARSER
   ========================================================= */

function parseSource(text){

  const s =
    text.toLowerCase();

  if(
    s.includes("சம்பளத்தில்") ||
    s.includes("சம்பள பணம்") ||
    s.includes("சம்பளத்திலிருந்து") ||
    s.includes("salary")
  ){

    return "salary";

  }

  if(
    s.includes("வீட்டு") ||
    s.includes("வீடு") ||
    s.includes("வீட்டு பணம்")
  ){

    return "home";

  }

  if(
    s.includes("கொல்லை") ||
    s.includes("farm")
  ){

    return "farm";

  }

  /*
    Default:
    screenshot logic போல வீட்டு பணம்.
  */

  return "home";

}


/* =========================================================
   EXPENSE KEYWORDS
   ========================================================= */

function isExpenseMessage(text){

  const s =
    text.toLowerCase();

  const keys = [

    "செலவு",
    "பெட்ரோல்",
    "டீ",
    "காபி",
    "சாப்பாடு",
    "டிபன்",
    "காய்கறி",
    "மருந்து",
    "உரம்",
    "வாங்கிய",
    "வாங்குனேன்",
    "வாங்கினேன்",
    "போட்டேன்",
    "குடித்தேன்",
    "பில்",
    "மருத்துவம்"

  ];

  return keys.some(k=>s.includes(k));

}


/* =========================================================
   LOAN MESSAGE DETECTION
   ========================================================= */

function isLoanMessage(text){

  const s =
    text.toLowerCase();

  return (
    s.includes("வட்டி") &&
    (
      s.includes("கொடுத்தேன்") ||
      s.includes("கொடுத்திருக்க") ||
      s.includes("கொடுத்திருக்கோம்") ||
      s.includes("கடன்") ||
      s.includes("loan") ||
      parseRate(s)>0
    )
  );

}


/* =========================================================
   AI RESPONSE
   ========================================================= */

function sendMessage(){

  const input =
    document.getElementById("textInput");

  const text =
    input.value.trim();

  if(!text) return;

  addChat("user",text);

  input.value="";

  const response =
    processAI(text);

  setTimeout(()=>{

    addChat("ai",response);

  },150);

}


function addChat(type,text){

  const box =
    document.getElementById("chatBox");

  if(!box) return;

  const div =
    document.createElement("div");

  div.className =
    `message ${type}`;

  div.textContent=text;

  box.appendChild(div);

  box.scrollTop =
    box.scrollHeight;

  db.chat.push({

    type,

    text,

    date:nowText()

  });

  /*
    chat அதிகமாக வளராமல் வைத்துக்கொள்வோம்
  */

  if(db.chat.length>200){

    db.chat =
      db.chat.slice(-200);

  }

  saveDB();

}


/* =========================================================
   AI CORE
   ========================================================= */

function processAI(text){

  const s =
    text.toLowerCase().trim();


  /* -----------------------------------------
     UNDO
  ----------------------------------------- */

  if(
    s.includes("தப்பா") ||
    s.includes("தப்பு") ||
    s.includes("நீக்கு") ||
    s.includes("அழி") ||
    s.includes("undo")
  ){

    return undoLast();

  }


  /* -----------------------------------------
     LOAN QUERY
  ----------------------------------------- */

  if(
    (
      s.includes("யாருக்கெல்லாம்") ||
      s.includes("யாருக்கு") ||
      s.includes("loan list") ||
      s.includes("வட்டி கணக்கு")
    ) &&
    (
      s.includes("வட்டி") ||
      s.includes("கடன்") ||
      s.includes("பணம்")
    )
  ){

    return loanSummary();

  }


  /* -----------------------------------------
     PARTICULAR PERSON LOAN QUERY
  ----------------------------------------- */

  if(
    s.includes("கணக்கில்") ||
    s.includes("கணக்கு எவ்வளவு") ||
    s.includes("மீதம் எவ்வளவு") ||
    s.includes("இன்னும் எவ்வளவு")
  ){

    const person =
      findPersonInText(text);

    if(person){

      const result =
        personLoanSummary(person);

      if(result){

        return result;

      }

    }

  }


  /* -----------------------------------------
     SALARY QUERY
  ----------------------------------------- */

  if(
    s.includes("சம்பளம் வரவு") ||
    s.includes("சம்பள வரவு")
  ){

    return `
💵 சம்பள வரவு

மொத்த வரவு:
₹${money(db.salaryIn)}

மொத்த செலவு:
₹${money(db.salaryOut)}

மீதி:
₹${money(getSalaryBalance())}
`;

  }


  if(
    s.includes("சம்பளம் மீதி") ||
    s.includes("சம்பள மீதி") ||
    s.includes("சம்பளம் எவ்வளவு")
  ){

    return `
💵 சம்பள கணக்கு

வரவு:
₹${money(db.salaryIn)}

செலவு:
₹${money(db.salaryOut)}

மீதி:
₹${money(getSalaryBalance())}
`;

  }


  /* -----------------------------------------
     HOME QUERY
  ----------------------------------------- */

  if(
    s.includes("வீட்டு மீதி") ||
    s.includes("வீடு மீதி")
  ){

    return `
🏠 வீட்டு கணக்கு

வரவு:
₹${money(db.homeIn)}

செலவு:
₹${money(db.homeOut)}

மீதி:
₹${money(getHomeBalance())}
`;

  }


  /* -----------------------------------------
     EXPENSE QUERY
  ----------------------------------------- */

  if(
    s.includes("இந்த மாத செலவு") ||
    s.includes("மாத செலவு")
  ){

    return `
🧾 இந்த மாத செலவு

₹${money(getExpenseTotalThisMonth())}
`;

  }


  /* -----------------------------------------
     LOAN ADD
  ----------------------------------------- */

  if(isLoanMessage(text)){

    return processLoanAI(text);

  }


  /* -----------------------------------------
     EXPENSE ADD
  ----------------------------------------- */

  if(isExpenseMessage(text)){

    return processExpenseAI(text);

  }


  /* -----------------------------------------
     SALARY IN
  ----------------------------------------- */

  if(
    s.includes("சம்பள வரவு") ||
    (
      s.includes("சம்பளம்") &&
      s.includes("வரவு")
    )
  ){

    const amount =
      parseAmount(text);

    if(amount>0){

      addSalaryAI(
        "in",
        amount,
        "AI சம்பள வரவு"
      );

      return `
💵 சம்பள வரவு பதிவு செய்துவிட்டேன்.

வரவு:
₹${money(amount)}

சம்பள மீதி:
₹${money(getSalaryBalance())}
`;

    }

  }


  /* -----------------------------------------
     SALARY OUT
  ----------------------------------------- */

  if(
    s.includes("சம்பள செலவு")
  ){

    const amount =
      parseAmount(text);

    if(amount>0){

      addSalaryAI(
        "out",
        amount,
        "AI சம்பள செலவு"
      );

      return `
💵 சம்பள செலவு பதிவு செய்துவிட்டேன்.

செலவு:
₹${money(amount)}

சம்பள மீதி:
₹${money(getSalaryBalance())}
`;

    }

  }


  /* -----------------------------------------
     SIMPLE BALANCE
  ----------------------------------------- */

  if(
    s.includes("மொத்தம்") ||
    s.includes("நிலைமை") ||
    s.includes("balance")
  ){

    return `
📊 கணக்கு நிலைமை

💵 சம்பள மீதி:
₹${money(getSalaryBalance())}

🏠 வீட்டு மீதி:
₹${money(getHomeBalance())}

🧾 இந்த மாத செலவு:
₹${money(getExpenseTotalThisMonth())}

💰 Loan Accounts:
${db.loans.length}
`;

  }


  /* -----------------------------------------
     DEFAULT
  ----------------------------------------- */

  return `
இந்த கேள்விக்கான செயலை இன்னும் அமைக்கவில்லை.

நீங்கள் இப்படிச் சொல்லலாம்:

• சம்பள வரவு 20000
• MMக்கு 500 ரூபாய் மருந்து செலவு செய்தேன்
• பெட்ரோல் 300 சம்பளத்தில் இருந்து செலவு
• வீட்டு செலவு 600
• ராஜாவுக்கு 50000 ரூபாய் 2% வட்டி கொடுத்தேன்
• யாருக்கெல்லாம் வட்டி பணம் கொடுத்திருக்கோம்?
• ராஜா கணக்கில் இன்னும் எவ்வளவு இருக்கு?
• சம்பள மீதி எவ்வளவு?
• தப்பு
`;

}


/* =========================================================
   AI SALARY ADD
   ========================================================= */

function addSalaryAI(type,amount,note){

  const item = {

    id:Date.now(),

    type,

    amount,

    note,

    date:nowText(),

    isoDate:new Date().toISOString()

  };

  db.salaryLogs.unshift(item);

  if(type==="in"){

    db.salaryIn += amount;

  }else{

    db.salaryOut += amount;

  }

  db.lastAction = {

    target:"salaryLog",

    id:item.id

  };

  saveDB();

  renderAll();

}


/* =========================================================
   AI EXPENSE
   ========================================================= */

function processExpenseAI(text){

  const amount =
    parseAmount(text);

  if(!amount){

    return `
செலவு தொகை புரியவில்லை.

உதாரணம்:
MMக்கு 500 ரூபாய் மருந்து செலவு செய்தேன்
`;

  }

  const person =
    parsePerson(text);

  const source =
    parseSource(text);

  let note =
    cleanExpenseNote(text);

  if(!note){

    note="AI செலவு";

  }

  const item =
    addExpense({

      note,

      amount,

      person,

      source,

      silent:true

    });

  return `
🧾 செலவு பதிவு செய்துவிட்டேன்.

தொகை:
₹${money(amount)}

குறிப்பு:
${note}

${
  person
    ? `நபர்: ${person}\n`
    : ""
}

பணம்:
${
  source==="salary"
    ? "சம்பளம்"
    : source==="home"
      ? "வீடு"
      : "கொல்லை"
}

${
  source==="salary"
    ? `சம்பள மீதி: ₹${money(getSalaryBalance())}`
    : source==="home"
      ? `வீட்டு மீதி: ₹${money(getHomeBalance())}`
      : "கொல்லை செலவில் பதிவு."
}
`;

}


function cleanExpenseNote(text){

  let s =
    text.trim();

  s =
    s.replace(
      /(\d+(?:\.\d+)?)\s*(ரூபாய்|ரூபா|ரூ|₹)/gi,
      ""
    );

  s =
    s.replace(
      /(\d+(?:\.\d+)?)\s*(ஆயிரம்|லட்சம்)/gi,
      ""
    );

  s =
    s.replace(
      /செலவு\s*செய்தேன்/gi,
      ""
    );

  s =
    s.replace(
      /செலவு\s*செய்தது/gi,
      ""
    );

  s =
    s.replace(
      /வாங்கியேன்|வாங்கினேன்|வாங்குனேன்/gi,
      ""
    );

  s =
    s.replace(
      /சம்பளத்தில்\s*இருந்து/gi,
      ""
    );

  s =
    s.replace(
      /வீட்டு\s*பணத்தில்\s*இருந்து/gi,
      ""
    );

  s =
    s.replace(
      /MMக்கு|KSக்கு/gi,
      ""
    );

  return s
    .replace(/\s+/g," ")
    .trim();

}


/* =========================================================
   AI LOAN
   ========================================================= */

function processLoanAI(text){

  const amount =
    parseAmount(text);

  if(!amount){

    return `
வட்டி கணக்கிற்கு அசல் தொகை தேவை.

உதாரணம்:

ராஜாவுக்கு 50000 ரூபாய் 2% வட்டி கொடுத்தேன்
`;

  }

  const rate =
    parseRate(text) || 2;

  const person =
    parsePerson(text) || "பெயர் தெரியவில்லை";

  const date =
    todayDate();

  const loan = {

    id:Date.now(),

    name:person,

    amount,

    rate,

    startDate:date,

    payments:[],

    created:nowText()

  };

  db.loans.unshift(loan);

  db.lastAction = {

    target:"loan",

    id:loan.id

  };

  saveDB();

  renderAll();

  return `
💰 Loan Account உருவாக்கிவிட்டேன்.

👤 பெயர்:
${person}

💵 அசல்:
₹${money(amount)}

📈 மாத வட்டி:
${money(rate)}%

🧮 ஒரு மாத வட்டி:
₹${money(amount*rate/100)}

📅 தொடக்கம்:
${date}

Loan Account தனியாக சேமிக்கப்பட்டுள்ளது.
`;

}


/* =========================================================
   PERSON SEARCH
   ========================================================= */

function findPersonInText(text){

  for(const loan of db.loans){

    if(
      text.toLowerCase()
        .includes(
          loan.name.toLowerCase()
        )
    ){

      return loan.name;

    }

  }

  /*
    "ராஜா கணக்கு"
    போன்ற input-ல் first meaningful word.
  */

  const words =
    text
      .replace(
        /கணக்கில்|கணக்கு|எவ்வளவு|மீதம்|இன்னும்|இருக்கு|உள்ளது/g,
        ""
      )
      .trim()
      .split(/\s+/);

  if(words[0]){

    return words[0];

  }

  return "";

}


function personLoanSummary(person){

  const loans =
    db.loans.filter(
      x =>
        x.name.toLowerCase() ===
        person.toLowerCase()
    );

  if(!loans.length){

    return null;

  }

  let original=0;

  let interest=0;

  let paid=0;

  let balance=0;

  loans.forEach(x=>{

    original += Number(x.amount);

    interest += loanTotalInterest(x);

    paid += loanPaidAmount(x);

    balance += loanBalance(x);

  });

  return `
👤 ${person} கணக்கு

📌 Loan Accounts:
${loans.length}

💵 மொத்த அசல்:
₹${money(original)}

📈 இதுவரை வட்டி:
₹${money(interest)}

💰 திருப்பி கொடுத்தது:
₹${money(paid)}

🧾 மீதமுள்ள அசல்:
₹${money(balance)}

🔴 மொத்த நிலுவை:
₹${money(balance+interest)}
`;

}


/* =========================================================
   ALL LOANS SUMMARY
   ========================================================= */

function loanSummary(){

  if(!db.loans.length){

    return `
💰 Loan Account எதுவும் இல்லை.
`;

  }

  let totalOriginal=0;

  let totalInterest=0;

  let totalPaid=0;

  let totalBalance=0;

  const lines =
    db.loans.map((loan,i)=>{

      const original =
        Number(loan.amount);

      const interest =
        loanTotalInterest(loan);

      const paid =
        loanPaidAmount(loan);

      const balance =
        loanBalance(loan);

      totalOriginal += original;

      totalInterest += interest;

      totalPaid += paid;

      totalBalance += balance;

      return `
${i+1}. ${loan.name}
   அசல் ₹${money(original)}
   ${loan.rate}% / மாதம்
   வட்டி ₹${money(interest)}
   மீதி ₹${money(balance)}
`;

    }).join("\n");

  return `
💰 யாருக்கெல்லாம் Loan / வட்டி கணக்கு

${lines}

--------------------

மொத்த அசல்:
₹${money(totalOriginal)}

மொத்த வட்டி:
₹${money(totalInterest)}

மொத்தம் திருப்பி கொடுத்தது:
₹${money(totalPaid)}

மீதமுள்ள அசல்:
₹${money(totalBalance)}
`;

}


/* =========================================================
   UNDO
   ========================================================= */

function undoLast(){

  const action =
    db.lastAction;

  if(!action){

    return "↩️ Undo செய்ய சமீபத்திய செயல் இல்லை.";

  }


  if(
    action.target==="salaryLog"
  ){

    const i =
      db.salaryLogs.findIndex(
        x=>x.id===action.id
      );

    if(i>=0){

      const item =
        db.salaryLogs[i];

      if(item.type==="in"){

        db.salaryIn -= item.amount;

      }else{

        db.salaryOut -= item.amount;

      }

      db.salaryLogs.splice(i,1);

    }

  }


  else if(
    action.target==="expense"
  ){

    const i =
      db.expenseLogs.findIndex(
        x=>x.id===action.id
      );

    if(i>=0){

      const item =
        db.expenseLogs[i];

      if(item.source==="salary"){

        db.salaryOut -= item.amount;

        db.salaryLogs =
          db.salaryLogs.filter(
            x=>x.id!==item.id
          );

      }

      if(item.source==="home"){

        db.homeOut -= item.amount;

        db.homeLogs =
          db.homeLogs.filter(
            x=>x.id!==item.id
          );

      }

      db.expenseLogs.splice(i,1);

    }

  }


  else if(
    action.target==="loan"
  ){

    db.loans =
      db.loans.filter(
        x=>x.id!==action.id
      );

  }


  else if(
    action.target==="homeLog"
  ){

    const i =
      db.homeLogs.findIndex(
        x=>x.id===action.id
      );

    if(i>=0){

      const item =
        db.homeLogs[i];

      if(item.type==="in"){

        db.homeIn -= item.amount;

      }else{

        db.homeOut -= item.amount;

      }

      db.homeLogs.splice(i,1);

    }

  }


  db.lastAction=null;

  saveDB();

  renderAll();

  return "↩️ கடைசி செயலை நீக்கிவிட்டேன்.";


}


/* =========================================================
   VOICE RECOGNITION
   ========================================================= */

let recognition = null;

function setupRecognition(){

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if(!SpeechRecognition){

    return;

  }

  recognition =
    new SpeechRecognition();

  recognition.lang="ta-IN";

  recognition.continuous=false;

  recognition.interimResults=true;

  recognition.onstart=()=>{

    setStatus("🎤 கேட்கிறேன்...");

  };

  recognition.onresult=(event)=>{

    let finalText="";

    for(
      let i=event.resultIndex;
      i<event.results.length;
      i++
    ){

      finalText +=
        event.results[i][0].transcript;

    }

    document.getElementById(
      "textInput"
    ).value=finalText;

  };

  recognition.onerror=(event)=>{

    setStatus(
      "🎤 Voice error: " +
      event.error
    );

  };

  recognition.onend=()=>{

    setStatus("🎤 தயார்");

  };

}


function startListening(){

  if(!recognition){

    setupRecognition();

  }

  if(!recognition){

    alert(
      "இந்த browser voice input-ஐ support செய்யவில்லை."
    );

    return;

  }

  try{

    recognition.start();

  }catch(e){

    console.log(e);

  }

}


function stopListening(){

  if(recognition){

    try{

      recognition.stop();

    }catch(e){}

  }

}


function setStatus(text){

  const el =
    document.getElementById("status");

  if(el){

    el.textContent=text;

  }

}


/* =========================================================
   CLEAR CHAT
   ========================================================= */

function clearChat(){

  const box =
    document.getElementById("chatBox");

  if(!box) return;

  box.innerHTML=`

    <div class="message ai">
      வணக்கம்! என்ன செய்ய வேண்டும்?
    </div>

  `;

  db.chat=[];

  saveDB();

}


/* =========================================================
   LOAD OLD CHAT
   ========================================================= */

function renderChat(){

  const box =
    document.getElementById("chatBox");

  if(!box) return;

  if(!db.chat.length){

    return;

  }

  box.innerHTML="";

  db.chat.forEach(x=>{

    const div =
      document.createElement("div");

    div.className =
      `message ${x.type}`;

    div.textContent=x.text;

    box.appendChild(div);

  });

  box.scrollTop =
    box.scrollHeight;

}


/* =========================================================
   ENTER KEY
   ========================================================= */

function setupEnterKey(){

  const input =
    document.getElementById("textInput");

  if(!input) return;

  input.addEventListener(
    "keydown",
    function(e){

      if(
        e.key==="Enter" &&
        !e.shiftKey
      ){

        e.preventDefault();

        sendMessage();

      }

    }
  );

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  ()=>{

    loadDB();

    renderAll();

    renderChat();

    setupRecognition();

    setupEnterKey();

    /*
      Reminder checker
    */

    checkReminders();

    setInterval(
      checkReminders,
      30000
    );

  }
);


/* =========================================================
   GLOBAL EXPORTS
   HTML onclick-க்கு functions கிடைக்க வேண்டும்.
   ========================================================= */

window.showPage=showPage;

window.sendMessage=sendMessage;

window.startListening=startListening;

window.stopListening=stopListening;

window.clearChat=clearChat;

window.requestNotifications=requestNotifications;

window.addSalary=addSalary;

window.deleteSalary=deleteSalary;

window.addExpenseManual=addExpenseManual;

window.deleteExpense=deleteExpense;

window.addFarm=addFarm;

window.deleteFarm=deleteFarm;

window.addHome=addHome;

window.deleteHome=deleteHome;

window.addLoan=addLoan;

window.deleteLoan=deleteLoan;

window.addLoanPayment=addLoanPayment;

window.deleteLoanPayment=deleteLoanPayment;

window.addNote=addNote;

window.deleteNote=deleteNote;

window.clearTemporary=clearTemporary;

window.addReminder=addReminder;

window.completeReminder=completeReminder;

window.deleteReminder=deleteReminder;