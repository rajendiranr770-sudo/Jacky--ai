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
      இந்த மாத செலவு|
      இந்த மாசம் செலவு/x
      .test(t)
  ){
    return null;
  }


  let d=new Date();

  let f=
    new Date(
      d.getFullYear(),
      d.getMonth(),
      1
    );

  let to=
    new Date(
      d.getFullYear(),
      d.getMonth()+1,
      1
    );


  let r=
    DB.expense.filter(
      x=>
        new Date(x.date)>=f &&
        new Date(x.date)<to
    );


  let g={};

  r.forEach(x=>{

    g[x.note]=
      (g[x.note]||0)
      +
      x.amt;

  });


  let total=
    r.reduce(
      (a,x)=>a+x.amt,
      0
    );


  return `
இந்த மாத மொத்த செலவு ₹${money(total)}

${
  Object.entries(g)
    .map(
      ([k,v])=>
        `• ${k}: ₹${money(v)}`
    )
    .join("\n")
}
  `.trim();

}


/* =========================================================
   BALANCE
   ========================================================= */

function balance(t){

  if(
    /சம்பள.*மீதி|
      salary.*balance/i
      .test(t)
  ){

    const n=
      DB.salary.reduce(
        (a,x)=>
          a+
          (
            x.type==="in"
              ?x.amt
              :-x.amt
          ),
        0
      );

    return `
சம்பள மீதி ₹${money(n)}
    `.trim();

  }


  if(
    /வீட்டு.*மீதி|
      home.*balance/i
      .test(t)
  ){

    const n=
      DB.home.reduce(
        (a,x)=>
          a+
          (
            x.type==="in"
              ?x.amt
              :-x.amt
          ),
        0
      );

    return `
வீட்டு மீதி ₹${money(n)}
    `.trim();

  }


  return null;

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

window.sendMessage=()=>{

  const i=$("textInput");

  const t=
    i.value.trim();

  if(!t)return;

  msg(t,"user");

  i.value="";


  let r=
    reminder(t)
    ||
    interest(t)
    ||
    allExp(t)
    ||
    expQuery(t)
    ||
    balance(t);


  /*
    Expense voice/text
  */

  if(
    !r &&
    /பெட்ரோல்|
      மருந்து|
      உரம்|
      சாப்பாடு|
      காய்கறி|
      உடை|
      செலவு|
      வாங்கினேன்/x
      .test(t)
  ){

    const a=amt(t);

    const s=src(t);

    const p=person(t);

    const c=cat(t);


    if(a&&s){

      addExpense(
        c,
        a,
        s,
        p
      );


      r=
        `சரி. ${
          p?p+"க்கு ":""
        }${c} ₹${money(a)} பதிவு செய்தேன். ${
          s==="home"
            ?"வீட்டு"
            :s==="salary"
              ?"சம்பள"
              :"கொல்லை"
        } பணத்திலிருந்து குறைத்தேன்.`;

    }
    else if(a){

      r=
        "செலவு எந்த பணத்தில் இருந்து? வீட்டு பணமா, சம்பள பணமா, கொல்லை பணமா?";

    }

  }


  if(!r){

    r=
      "இந்த கேள்விக்கான செயலை இன்னும் அமைக்கவில்லை. கணக்கு, செலவு, வட்டி அல்லது நினைவூட்டல் என்று தெளிவாகச் சொல்லுங்கள்.";

  }


  msg(r,"ai");

  speak(r);

};


/* =========================================================
   SPEECH RECOGNITION
   ========================================================= */

function setup(){

  const SR=
    window.SpeechRecognition
    ||
    window.webkitSpeechRecognition;


  if(!SR){

    $("status").textContent=
      "Voice ஆதரவு இல்லை";

    return;

  }


  rec=new SR();

  rec.lang="ta-IN";

  rec.continuous=false;

  rec.interimResults=false;


  rec.onstart=()=>{

    $("status").textContent=
      "🎙️ கேட்கிறேன்...";

  };


  rec.onresult=e=>{

    $("textInput").value=
      e.results[0][0]
        .transcript
        .trim();

    sendMessage();

  };


  rec.onend=()=>{

    $("status").textContent=
      "🎤 தயார்";

  };


  rec.onerror=e=>{

    $("status").textContent=
      "Voice error: "+e.error;

  };

}


window.startListening=()=>{

  try{

    rec?.start();

  }catch(e){}

};


window.stopListening=()=>{

  rec?.stop();

};


/* =========================================================
   REMINDER ENGINE
   ========================================================= */

function reminders(){

  const n=Date.now();

  let ch=false;


  DB.reminders.forEach(r=>{

    if(r.done)return;


    const t=
      new Date(r.target)
        .getTime();

    const e=
      t-
      (r.early||0)
      *60000;


    /*
      Early notification
    */

    if(
      !r.earlyDone &&
      r.early>0 &&
      n>=e &&
      n<t
    ){

      const m=
        `⏰ ${r.text} — இன்னும் ${r.early} நிமிடம்.`;

      msg(m,"ai");

      speak(m);


      if(
        "Notification" in window &&
        Notification.permission==="granted"
      ){

        new Notification(
          "Jacky AI",
          {
            body:m
          }
        );

      }


      r.earlyDone=true;

      ch=true;

    }


    /*
      Exact notification
    */

    if(n>=t){

      const m=
        `🔔 இப்போது: ${r.text}`;

      msg(m,"ai");

      speak(m);


      if(
        "Notification" in window &&
        Notification.permission==="granted"
      ){

        new Notification(
          "Jacky AI",
          {
            body:m
          }
        );

      }


      r.done=true;

      ch=true;

    }

  });


  if(ch){

    save();

  }

}


/* =========================================================
   LOAN HTML
   ========================================================= */

function loanHtml(){

  const groups=
    groupLoans();


  if(!groups.length){

    return `
      <div class="empty">
        வட்டி பதிவு இல்லை
      </div>
    `;

  }


  return groups
    .map(g=>{

      const principal=
        g.accounts.reduce(
          (a,x)=>a+x.amt,
          0
        );


      const monthly=
        g.accounts.reduce(
          (a,x)=>
            a+
            (
              x.amt*x.rate/100
            ),
          0
        );


      return `
        <div class="loan-person">

          <div class="loan-person-header">

            <h3>
              👤 ${escapeHtml(g.name)}
            </h3>

            <div class="loan-person-summary">

              ${g.accounts.length} Loan Account
              • மொத்த அசல் ₹${money(principal)}
              • மாத வட்டி ₹${money(monthly)}

            </div>

          </div>


          ${
            g.accounts
              .map(x=>{

                const monthlyInterest=
                  x.amt*x.rate/100;


                const st=
                  new Date(x.startDate);

                const n=
                  new Date();


                const months=
                  Math.max(
                    0,
                    (
                      n.getFullYear()
                      -
                      st.getFullYear()
                    )*12
                    +
                    (
                      n.getMonth()
                      -
                      st.getMonth()
                    )
                    +1
                  );


                const totalInterest=
                  monthlyInterest*months;


                const paid=
                  (x.interestPaid||[])
                    .reduce(
                      (a,z)=>
                        a+z.amt,
                      0
                    );


                const due=
                  Math.max(
                    0,
                    totalInterest-paid
                  );


                return `
                  <div class="loan-account">

                    <div class="loan-account-header">

                      <b>
                        💰 Loan Account ${x.accountNo}
                      </b>

                      <button
                        class="danger"
                        onclick="deleteById(
                          'loans',
                          '${x.id}'
                        )">
                        🗑️
                      </button>

                    </div>


                    <div class="loan-account-body">

                      <div class="loan-row">
                        <span>அசல்</span>
                        <b>₹${money(x.amt)}</b>
                      </div>

                      <div class="loan-row">
                        <span>மாத வட்டி</span>
                        <b>${x.rate}%</b>
                      </div>

                      <div class="loan-row">
                        <span>மாத வட்டி தொகை</span>
                        <b>₹${money(monthlyInterest)}</b>
                      </div>

                      <div class="loan-row">
                        <span>மாதங்கள்</span>
                        <b>${months}</b>
                      </div>

                      <div class="loan-row">
                        <span>மொத்த வட்டி</span>
                        <b>₹${money(totalInterest)}</b>
                      </div>

                      <div class="loan-row">
                        <span>செலுத்திய வட்டி</span>
                        <b>₹${money(paid)}</b>
                      </div>

                      <div class="loan-row">
                        <span>மீதமுள்ள வட்டி</span>
                        <b>₹${money(due)}</b>
                      </div>

                      <div class="loan-row">
                        <span>மொத்தம் தர வேண்டியது</span>
                        <b>
                          ₹${money(x.amt+due)}
                        </b>
                      </div>

                      <div class="loan-row">
                        <span>தொடக்கம்</span>
                        <b>${escapeHtml(x.startDate)}</b>
                      </div>

                    </div>

                  </div>
                `;

              })
              .join("")
          }

        </div>
      `;

    })
    .join("");

}


/* =========================================================
   RENDER
   ========================================================= */

function render(){

  /*
    Salary balance
  */

  const sb=
    DB.salary.reduce(
      (a,x)=>
        a+
        (
          x.type==="in"
            ?x.amt
            :-x.amt
        ),
      0
    );


  /*
    Home balance
  */

  const hb=
    DB.home.reduce(
      (a,x)=>
        a+
        (
          x.type==="in"
            ?x.amt
            :-x.amt
        ),
      0
    );


  /*
    This month expense
  */

  const d=new Date();

  const f=
    new Date(
      d.getFullYear(),
      d.getMonth(),
      1
    );

  const to=
    new Date(
      d.getFullYear(),
      d.getMonth()+1,
      1
    );


  const me=
    DB.expense
      .filter(
        x=>
          new Date(x.date)>=f &&
          new Date(x.date)<to
      )
      .reduce(
        (a,x)=>a+x.amt,
        0
      );


  /*
    Summary
  */

  $("salaryBalance")
    .textContent=
      money(sb);

  $("homeBalance")
    .textContent=
      money(hb);

  $("summarySalary")
    .textContent=
      "₹"+money(sb);

  $("summaryHome")
    .textContent=
      "₹"+money(hb);

  $("summaryExpense")
    .textContent=
      "₹"+money(me);

  $("summaryRem")
    .textContent=
      DB.reminders
        .filter(x=>!x.done)
        .length;


  /*
    Salary
  */

  $("salaryList")
    .innerHTML=
      DB.salary
        .slice()
        .reverse()
        .map(
          x=>
            rh(
              "salary",
              x,
              (
                x.type==="in"
                  ?"+ "
                  :"− "
              )+
              "₹"+
              money(x.amt),
              x.note+
              " • "+
              dt(x.date)
            )
        )
        .join("")
      ||
      `<div class="empty">பதிவு இல்லை</div>`;


  /*
    Home
  */

  $("homeList")
    .innerHTML=
      DB.home
        .slice()
        .reverse()
        .map(
          x=>
            rh(
              "home",
              x,
              (
                x.type==="in"
                  ?"+ "
                  :"− "
              )+
              "₹"+
              money(x.amt),
              x.note+
              " • "+
              dt(x.date)
            )
        )
        .join("")
      ||
      `<div class="empty">பதிவு இல்லை</div>`;


  /*
    Expense
  */

  $("expenseList")
    .innerHTML=
      DB.expense
        .slice()
        .reverse()
        .map(
          x=>
            rh(
              "expense",
              x,
              "₹"+
              money(x.amt)+
              " • "+
              x.note,
              (
                x.person||
                "பொது"
              )+
              " • "+
              (
                x.source==="home"
                  ?"வீடு"
                  :x.source==="salary"
                    ?"சம்பளம்"
                    :"கொல்லை"
              )+
              " • "+
              dt(x.date)
            )
        )
        .join("")
      ||
      `<div class="empty">பதிவு இல்லை</div>`;


  /*
    Farm
  */

  $("farmList")
    .innerHTML=
      DB.farm
        .slice()
        .reverse()
        .map(
          x=>
            rh(
              "farm",
              x,
              "₹"+
              money(x.amt),
              x.note+
              " • "+
              dt(x.date)
            )
        )
        .join("")
      ||
      `<div class="empty">பதிவு இல்லை</div>`;


  /*
    IMPORTANT:
    Loan list இப்போது person-wise
    grouped account view.
  */

  $("loanList")
    .innerHTML=
      loanHtml();


  /*
    Temporary notes
  */

  $("tempList")
    .innerHTML=
      DB.temp
        .slice()
        .reverse()
        .map(
          x=>
            rh(
              "temp",
              x,
              x.text,
              dt(x.date)
            )
        )
        .join("")
      ||
      `<div class="empty">குறிப்பு இல்லை</div>`;


  /*
    Permanent notes
  */

  $("permList")
    .innerHTML=
      DB.perm
        .slice()
        .reverse()
        .map(
          x=>
            rh(
              "perm",
              x,
              x.text,
              dt(x.date)
            )
        )
        .join("")
      ||
      `<div class="empty">குறிப்பு இல்லை</div>`;


  /*
    Reminders
  */

  $("reminderList")
    .innerHTML=
      DB.reminders
        .slice()
        .reverse()
        .map(
          x=>
            rh(
              "reminders",
              x,
              "⏰ "+x.text,
              dt(x.target)+
              " • "+
              x.early+
              " நிமிடம் முன்"
            )
        )
        .join("")
      ||
      `<div class="empty">நினைவூட்டல் இல்லை</div>`;

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  ()=>{

    setup();

    render();


    /*
      Reminder default = நாளை
    */

    let d=new Date();

    d.setDate(
      d.getDate()+1
    );

    $("reminderDate").value=
      d.toISOString()
       .slice(0,10);


    /*
      Service Worker
    */

    if(
      "serviceWorker"
      in navigator
    ){

      navigator.serviceWorker
        .register(
          "sw.js?v=4"
        )
        .catch(
          ()=>{}
        );

    }


    /*
      Reminder check
      every 30 seconds
    */

    setInterval(
      reminders,
      30000
    );


    reminders();

  }
);

})();