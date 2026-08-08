(()=>{
"use strict";

/* =========================================================
   JACKY AI - FINAL V4
   Multiple Loan Accounts Per Person
   ========================================================= */

const KEY="jacky_ai_final_v4";

const D={
  salary:[],
  farm:[],
  expense:[],
  home:[],
  loans:[],
  temp:[],
  perm:[],
  reminders:[]
};

let DB=load();
let rec=null;


/* =========================================================
   BASIC HELPERS
   ========================================================= */

const $=x=>document.getElementById(x);

const uid=()=>{
  return Date.now().toString(36)+
    Math.random().toString(36).slice(2);
};

const now=()=>{
  return new Date().toISOString();
};

const money=x=>{
  return Number(x||0).toLocaleString("en-IN");
};

const dt=x=>{
  return new Date(x).toLocaleString(
    "ta-IN",
    {
      dateStyle:"short",
      timeStyle:"short"
    }
  );
};


/* =========================================================
   LOAD / SAVE
   ========================================================= */

function load(){

  try{

    const old=JSON.parse(
      localStorage.getItem(KEY)||"{}"
    );

    const db={
      ...D,
      ...old
    };

    /*
      பழைய loan data இருந்தாலும் accountNo
      தானாக அமைக்கப்படும்.
    */

    let groups={};

    db.loans.forEach(x=>{

      if(!x.id){
        x.id=uid();
      }

      if(!x.date){
        x.date=now();
      }

      if(!x.startDate){
        x.startDate=
          new Date(x.date)
          .toISOString()
          .slice(0,10);
      }

      if(!Array.isArray(x.interestPaid)){
        x.interestPaid=[];
      }

      const key=loanPersonKey(x.name);

      if(!groups[key]){
        groups[key]=0;
      }

      if(!x.accountNo){
        groups[key]++;
        x.accountNo=groups[key];
      }else{
        groups[key]=Math.max(
          groups[key],
          Number(x.accountNo)||0
        );
      }

    });

    return db;

  }catch(e){

    return {
      ...D
    };

  }

}


function save(){

  localStorage.setItem(
    KEY,
    JSON.stringify(DB)
  );

  render();
}


/* =========================================================
   PAGE
   ========================================================= */

function show(n){

  document
    .querySelectorAll(".page")
    .forEach(x=>{
      x.classList.remove("active");
    });

  $(n)?.classList.add("active");

}

window.showPage=show;


/* =========================================================
   GENERIC ADD / DELETE
   ========================================================= */

function add(bucket,data){

  DB[bucket].push({
    id:uid(),
    date:now(),
    ...data
  });

  save();

}


function del(bucket,id){

  DB[bucket]=DB[bucket].filter(
    x=>x.id!==id
  );

  save();

}


/*
  Expense delete செய்தால் அதனுடன்
  இணைக்கப்பட்ட salary/home/farm entry
  கூட delete ஆக வேண்டும்.
*/

function deleteExpenseCascade(id){

  const e=DB.expense.find(
    x=>x.id===id
  );

  if(!e)return;

  DB.expense=
    DB.expense.filter(
      x=>x.id!==id
    );

  if(e.source==="home"){

    DB.home=
      DB.home.filter(
        x=>x.linked!==id
      );

  }

  if(e.source==="salary"){

    DB.salary=
      DB.salary.filter(
        x=>x.linked!==id
      );

  }

  if(e.source==="farm"){

    DB.farm=
      DB.farm.filter(
        x=>x.linked!==id
      );

  }

  save();

}


function deleteRecord(bucket,id){

  if(bucket==="expense"){

    deleteExpenseCascade(id);
    return;

  }

  del(bucket,id);

}

window.deleteById=deleteRecord;


/* =========================================================
   RECORD UI
   ========================================================= */

function rh(bucket,x,a,s){

  return `
    <div class="record">

      <div>
        <b>${escapeHtml(a)}</b>
        <small>${escapeHtml(s)}</small>
      </div>

      <button
        class="danger"
        onclick="deleteById(
          '${bucket}',
          '${x.id}'
        )">
        🗑️
      </button>

    </div>
  `;

}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHtml(v){

  return String(v??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


/* =========================================================
   PERSON
   ========================================================= */

function person(t){

  if(
    /மணிமேகலை|\bmm\b/i.test(t)
  ){
    return "மணிமேகலை (MM)";
  }

  if(
    /கலைசெந்தாமரை|\bks\b/i.test(t)
  ){
    return "கலைசெந்தாமரை (KS)";
  }

  return String(t||"").trim();

}


/*
  ஒரே நபரை கண்டுபிடிக்க
  normalized key.
*/

function loanPersonKey(name){

  return String(name||"")
    .trim()
    .toLowerCase()
    .replace(/\s+/g," ");

}


/* =========================================================
   AMOUNT
   ========================================================= */

function amt(t){

  let m=t.match(
    /[\d,]+(?:\.\d+)?/
  );

  let n=m
    ? +m[0].replace(/,/g,"")
    : 0;

  if(/லட்சம்/.test(t)){

    n=(n||1)*100000;

  }else if(/ஆயிரம்/.test(t)){

    n=(n||1)*1000;

  }

  return n;

}


/* =========================================================
   SOURCE
   ========================================================= */

function src(t){

  if(
    /வீட்டு பணம்|
      வீட்டு கணக்கு|
      வீட்டிலிருந்து|
      வீட்டு பணத்தில்/x.test(t)
  ){
    return "home";
  }

  if(
    /சம்பள பணம்|
      சம்பள கணக்கு|
      சம்பளத்தில்|
      சம்பளத்திலிருந்து/x.test(t)
  ){
    return "salary";
  }

  if(
    /கொல்லை பணம்|
      கொல்லை கணக்கு|
      கொல்லையில்/x.test(t)
  ){
    return "farm";
  }

  return null;

}


/* =========================================================
   CATEGORY
   ========================================================= */

function cat(t){

  if(
    /பெட்ரோல்|petrol|டீசல்|diesel/i.test(t)
  ){
    return "பெட்ரோல்";
  }

  if(/மருந்து/.test(t)){
    return "மருந்து";
  }

  if(/உரம்/.test(t)){
    return "உரம்";
  }

  if(/சாப்பாடு|உணவு/.test(t)){
    return "சாப்பாடு";
  }

  if(/காய்கறி/.test(t)){
    return "காய்கறி";
  }

  if(/உடை|துணி|dress/i.test(t)){
    return "உடை";
  }

  return "மற்ற செலவு";

}


/* =========================================================
   EXPENSE
   ========================================================= */

function addExpense(
  n,
  a,
  s,
  p
){

  const e={
    id:uid(),
    date:now(),
    note:n,
    amt:a,
    source:s,
    person:p
  };

  DB.expense.push(e);


  /*
    வீட்டு பணத்தில் இருந்து செலவு
  */

  if(s==="home"){

    DB.home.push({
      id:uid(),
      date:e.date,
      type:"out",
      amt:a,
      note:n+(p?" — "+p:""),
      linked:e.id
    });

  }


  /*
    சம்பள பணத்தில் இருந்து செலவு
  */

  if(s==="salary"){

    DB.salary.push({
      id:uid(),
      date:e.date,
      type:"out",
      amt:a,
      note:n+(p?" — "+p:""),
      linked:e.id
    });

  }


  /*
    கொல்லை பணத்தில் இருந்து செலவு
  */

  if(s==="farm"){

    DB.farm.push({
      id:uid(),
      date:e.date,
      amt:a,
      note:n,
      linked:e.id
    });

  }

  save();

}


/* =========================================================
   SALARY
   ========================================================= */

window.addSalary=t=>{

  const a=+$("salaryAmount").value;

  if(a>0){

    add(
      "salary",
      {
        type:t,
        amt:a,
        note:
          $("salaryNote").value.trim()
          ||"நேரடி"
      }
    );

  }

  $("salaryAmount").value="";
  $("salaryNote").value="";

};


/* =========================================================
   HOME
   ========================================================= */

window.addHome=t=>{

  const a=+$("homeAmount").value;

  if(a>0){

    add(
      "home",
      {
        type:t,
        amt:a,
        note:
          $("homeNote").value.trim()
          ||"நேரடி"
      }
    );

  }

  $("homeAmount").value="";
  $("homeNote").value="";

};


/* =========================================================
   MANUAL EXPENSE
   ========================================================= */

window.addExpenseManual=()=>{

  const n=
    $("expenseNote")
    .value
    .trim();

  const a=
    +$("expenseAmount").value;

  const p=
    person(
      $("expensePerson").value
    );

  const s=
    $("expenseSource").value;

  if(n&&a>0){

    addExpense(
      n,
      a,
      s,
      p
    );

  }

  $("expenseNote").value="";
  $("expenseAmount").value="";
  $("expensePerson").value="";

};


/* =========================================================
   FARM
   ========================================================= */

window.addFarm=()=>{

  const a=
    +$("farmAmount").value;

  const n=
    $("farmNote").value.trim()
    ||"கொல்லை செலவு";

  const s=
    $("farmSource").value;

  if(a>0){

    addExpense(
      n,
      a,
      s,
      ""
    );

  }

  $("farmAmount").value="";
  $("farmNote").value="";

};


/* =========================================================
   LOAN ACCOUNT
   ========================================================= */

/*
  IMPORTANT:

  ஒரே நபர் மீண்டும் loan எடுத்தாலும்
  பழைய account-ஐ overwrite செய்யாது.

  புதிய accountNo உருவாகும்.
*/

function nextLoanAccountNo(name){

  const key=
    loanPersonKey(name);

  const accounts=
    DB.loans.filter(
      x=>
        loanPersonKey(x.name)===key
    );

  if(!accounts.length){
    return 1;
  }

  return Math.max(
    ...accounts.map(
      x=>Number(x.accountNo)||0
    )
  )+1;

}


window.addLoan=()=>{

  const n=
    $("loanName")
    .value
    .trim();

  const a=
    +$("loanAmount").value;

  const r=
    +$("loanRate").value;

  const d=
    $("loanDate").value
    ||
    new Date()
      .toISOString()
      .slice(0,10);

  if(!n||a<=0){

    alert(
      "பெயரும் அசல் தொகையும் கொடுக்கவும்."
    );

    return;

  }

  const accountNo=
    nextLoanAccountNo(n);

  add(
    "loans",
    {
      name:n,
      accountNo,
      amt:a,
      rate:r,
      startDate:d,
      interestPaid:[]
    }
  );


  /*
    ஒரே நபரின் அடுத்த loan
    account number ஆக காட்டப்படும்.
  */

  const count=
    DB.loans.filter(
      x=>
        loanPersonKey(x.name)
        ===loanPersonKey(n)
    ).length;

  if(count>1){

    const text=
      `${n} — புதிய Loan Account ${accountNo} உருவாக்கப்பட்டது.`;

    msg(text,"ai");
    speak(text);

  }


  $("loanName").value="";
  $("loanAmount").value="";
  $("loanRate").value="";

};


/* =========================================================
   NOTES
   ========================================================= */

window.addNote=t=>{

  const e=
    t==="temp"
      ?$("tempText")
      :$("permText");

  const v=
    e.value.trim();

  if(v){

    add(
      t==="temp"
        ?"temp"
        :"perm",
      {
        text:v
      }
    );

  }

  e.value="";

};


window.clearTemporary=()=>{

  if(
    confirm(
      "அனைத்து தற்காலிக குறிப்புகளையும் அழிக்கவா?"
    )
  ){

    DB.temp=[];
    save();

  }

};


/* =========================================================
   REMINDER
   ========================================================= */

window.addReminder=()=>{

  const text=
    $("reminderText")
    .value
    .trim();

  const d=
    $("reminderDate").value;

  const time=
    $("reminderTime").value;

  const early=
    +$("reminderEarly").value
    ||60;

  if(!text||!d||!time){

    alert(
      "நினைவூட்டல் விவரங்களை முழுமையாக கொடுக்கவும்."
    );

    return;

  }

  add(
    "reminders",
    {
      text,
      target:
        new Date(
          d+"T"+time
        ).toISOString(),
      early,
      earlyDone:false,
      done:false
    }
  );

  $("reminderText").value="";

};


/* =========================================================
   NOTIFICATION
   ========================================================= */

window.requestNotifications=async()=>{

  if(!("Notification" in window)){

    return alert(
      "Notification ஆதரவு இல்லை"
    );

  }

  const p=
    await Notification.requestPermission();

  alert(
    p==="granted"
      ?"அனுமதி கிடைத்தது"
      :"அனுமதி இல்லை"
  );

};


/* =========================================================
   SPEECH
   ========================================================= */

function speak(t){

  if(
    "speechSynthesis"
    in window
  ){

    speechSynthesis.cancel();

    const u=
      new SpeechSynthesisUtterance(t);

    u.lang="ta-IN";
    u.rate=.95;

    speechSynthesis.speak(u);

  }

}


/* =========================================================
   CHAT
   ========================================================= */

function msg(t,k){

  const e=
    document.createElement("div");

  e.className=
    "message "+k;

  e.textContent=t;

  $("chatBox")
    .appendChild(e);

  $("chatBox")
    .scrollTop=
      $("chatBox").scrollHeight;

}


window.clearChat=()=>{

  $("chatBox").innerHTML=
    '<div class="message ai">Chat அழிக்கப்பட்டது.</div>';

};


/* =========================================================
   REMINDER PARSER
   ========================================================= */

function reminder(t){

  if(
    !/(ஞாபகப்படுத்து|நினைவூட்டு|நினைவில் வை|remind)/i
      .test(t)
  ){
    return null;
  }

  let d=new Date();

  if(/நாளை|நாளைக்கு/.test(t)){

    d.setDate(
      d.getDate()+1
    );

  }


  let m=
    t.match(
      /(\d{1,2})(?:[:.](\d{1,2}))?\s*(மணி|am|pm)?/i
    );


  if(m){

    let h=+m[1];

    let mi=
      +(m[2]||0);

    let ap=
      (m[3]||"")
      .toLowerCase();

    if(
      ap==="pm" &&
      h<12
    ){
      h+=12;
    }

    if(
      ap==="am" &&
      h===12
    ){
      h=0;
    }

    d.setHours(
      h,
      mi,
      0,
      0
    );

  }


  let em=
    t.match(
      /(\d+)\s*நிமிடம்/
    );

  let early=
    em
      ?+em[1]
      :60;


  let clean=
    t
      .replace(
        /ஞாபகப்படுத்து|நினைவூட்டு|நினைவில் வை|remind/gi,
        ""
      )
      .replace(
        /நாளை|நாளைக்கு/gi,
        ""
      )
      .replace(
        /(\d{1,2})(?:[:.](\d{1,2}))?\s*(மணி|am|pm)?/i,
        ""
      )
      .replace(
        /(\d+)\s*நிமிடம்/,
        ""
      )
      .trim()
      ||
      "நினைவூட்டல்";


  add(
    "reminders",
    {
      text:clean,
      target:d.toISOString(),
      early,
      earlyDone:false,
      done:false
    }
  );


  return `
சரி. “${clean}” — ${dt(d)}.
${early} நிமிடம் முன்பும் நினைவூட்டுவேன்.
  `.trim();

}


/* =========================================================
   LOAN INTEREST
   ========================================================= */

/*
  ஒரே நபருக்கு பல loan accounts இருந்தால்
  எல்லா accounts-ஐயும் காட்டும்.
*/

function interest(t){

  if(
    !/வட்டி|அசல்|தரணும்|கடன்/.test(t)
  ){
    return null;
  }


  /*
    எல்லா loan accounts list
  */

  if(
    /எல்லா|யார்|பட்டியல்/.test(t)
  ){

    if(!DB.loans.length){

      return "வட்டி கணக்கு எதுவும் இல்லை.";

    }

    return `
வட்டி கணக்கு பட்டியல்:

${
  groupLoans()
    .map(g=>{

      const principal=
        g.accounts
          .reduce(
            (a,x)=>a+x.amt,
            0
          );

      return `
👤 ${g.name}
${g.accounts.map(
  x=>
    `• கணக்கு ${x.accountNo} — ₹${money(x.amt)} — ${x.rate}%`
).join("\n")}
மொத்த அசல்: ₹${money(principal)}
      `.trim();

    })
    .join("\n\n")
}
    `.trim();

  }


  /*
    பெயர் கண்டுபிடி
  */

  const l=
    DB.loans.filter(x=>
      t
        .toLowerCase()
        .includes(
          String(x.name)
            .toLowerCase()
        )
    );


  /*
    MM / KS போன்ற short name
  */

  let targetPerson="";

  if(/\bmm\b/i.test(t)){
    targetPerson="மணிமேகலை (MM)";
  }

  if(/\bks\b/i.test(t)){
    targetPerson="கலைசெந்தாமரை (KS)";
  }


  let accounts=l;

  if(
    !accounts.length &&
    targetPerson
  ){

    accounts=
      DB.loans.filter(
        x=>
          loanPersonKey(x.name)
          ===loanPersonKey(targetPerson)
      );

  }


  if(!accounts.length){

    return "யாருடைய வட்டி கணக்கு வேண்டும்? பெயரைச் சொல்லுங்கள்.";

  }


  /*
    Account number குறிப்பிட்டிருந்தால்
    அந்த account மட்டும்.
  */

  const noMatch=
    t.match(
      /(?:கணக்கு|account)\s*(\d+)/i
    );

  if(noMatch){

    const no=
      +noMatch[1];

    const one=
      accounts.find(
        x=>
          Number(x.accountNo)===no
      );

    if(one){

      accounts=[one];

    }

  }


  return accounts
    .map(
      x=>loanSummary(x)
    )
    .join("\n\n");

}


/* =========================================================
   LOAN SUMMARY
   ========================================================= */

function loanSummary(l){

  const st=
    new Date(l.startDate);

  const n=
    new Date();

  const m=
    Math.max(
      0,
      (
        (n.getFullYear()-st.getFullYear())
        *12
      )
      +
      (
        n.getMonth()-st.getMonth()
      )
      +1
    );


  const mi=
    l.amt*l.rate/100;

  const ti=
    mi*m;

  const paid=
    (l.interestPaid||[])
      .reduce(
        (a,x)=>a+x.amt,
        0
      );

  const due=
    Math.max(
      0,
      ti-paid
    );


  return `
${l.name} — Loan Account ${l.accountNo}

அசல் ₹${money(l.amt)}
மாத வட்டி ${l.rate}% = ₹${money(mi)}
மாதங்கள் ${m}
மொத்த வட்டி ₹${money(ti)}
செலுத்திய வட்டி ₹${money(paid)}
மீதமுள்ள வட்டி ₹${money(due)}
மொத்தம் தர வேண்டியது ₹${money(l.amt+due)}
தொடக்கம் ${l.startDate}
  `.trim();

}


/* =========================================================
   GROUP LOANS BY PERSON
   ========================================================= */

function groupLoans(){

  const map={};

  DB.loans.forEach(l=>{

    const key=
      loanPersonKey(l.name);

    if(!map[key]){

      map[key]={
        name:l.name,
        accounts:[]
      };

    }

    map[key]
      .accounts
      .push(l);

  });


  return Object.values(map)
    .sort(
      (a,b)=>
        a.name.localeCompare(
          b.name
        )
    )
    .map(g=>{

      g.accounts.sort(
        (a,b)=>
          Number(a.accountNo||0)
          -
          Number(b.accountNo||0)
      );

      return g;

    });

}


/* =========================================================
   EXPENSE QUERY
   ========================================================= */

function expQuery(t){

  if(
    !/(எவ்வளவு|என்னென்ன|மொத்தம்)/
      .test(t)
  ){
    return null;
  }


  let c=cat(t);
  let p=person(t);
  let s=src(t);

  let d=new Date();

  let n=
    /இந்த மாதம்|இந்த மாசம்/
      .test(t);

  let from=
    n
      ?new Date(
        d.getFullYear(),
        d.getMonth(),
        1
      )
      :null;

  let to=
    n
      ?new Date(
        d.getFullYear(),
        d.getMonth()+1,
        1
      )
      :null;


  let r=
    DB.expense.filter(
      x=>
        (
          c==="மற்ற செலவு"
          ||
          x.note===c
        )
        &&
        (
          !p
          ||
          !x.person
          ||
          x.person===p
        )
        &&
        (
          !s
          ||
          x.source===s
        )
        &&
        (
          !from
          ||
          new Date(x.date)>=from
        )
        &&
        (
          !to
          ||
          new Date(x.date)<to
        )
    );


  if(!r.length){

    return "அந்த நிபந்தனைக்கு செலவு பதிவு இல்லை.";

  }


  let total=
    r.reduce(
      (a,x)=>a+x.amt,
      0
    );


  return `
${p?p+" — ":""}${c} செலவு மொத்தம் ₹${money(total)}

${
  r.map(
    x=>
      `• ${x.note} ₹${money(x.amt)} • ${x.person||"பொது"} • ${
        x.source==="home"
          ?"வீடு"
          :x.source==="salary"
            ?"சம்பளம்"
            :"கொல்லை"
      }`
  ).join("\n")
}
  `.trim();

}


/* =========================================================
   ALL EXPENSE
   ========================================================= */

function allExp(t){

  if(
    !/என்னென்ன செலவு|
      மொத்த செலவு|
      இந்த மாத 