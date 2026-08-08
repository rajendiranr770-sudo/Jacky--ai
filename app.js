/* =========================================================
   JACKY AI - Smart PA
   app.js v6
   ========================================================= */

const DB_KEY = "jacky_ai_db_v6";

let db = {
  salary: {
    income: 0,
    expense: 0,
    logs: []
  },

  home: {
    income: 0,
    expense: 0,
    logs: []
  },

  farm: {
    income: 0,
    expense: 0,
    logs: []
  },

  expenses: [],

  loans: [],

  notes: {
    temp: [],
    perm: []
  },

  reminders: [],

  lastAction: null
};


/* =========================================================
   LOAD / SAVE
   ========================================================= */

function loadDB(){

  try{

    const saved = localStorage.getItem(DB_KEY);

    if(saved){

      const old = JSON.parse(saved);

      db = Object.assign(db, old);

      db.salary = Object.assign({
        income:0,
        expense:0,
        logs:[]
      }, db.salary || {});

      db.home = Object.assign({
        income:0,
        expense:0,
        logs:[]
      }, db.home || {});

      db.farm = Object.assign({
        income:0,
        expense:0,
        logs:[]
      }, db.farm || {});

      db.expenses = Array.isArray(db.expenses)
        ? db.expenses
        : [];

      db.loans = Array.isArray(db.loans)
        ? db.loans
        : [];

      db.notes = Object.assign({
        temp:[],
        perm:[]
      }, db.notes || {});

      db.reminders = Array.isArray(db.reminders)
        ? db.reminders
        : [];

    }

  }catch(e){

    console.log("DB load error",e);

  }

}


function saveDB(){

  localStorage.setItem(
    DB_KEY,
    JSON.stringify(db)
  );

  renderAll();

}


/* =========================================================
   DATE / MONEY
   ========================================================= */

function nowText(){

  return new Date().toLocaleString(
    "ta-IN",
    {
      dateStyle:"medium",
      timeStyle:"short"
    }
  );

}


function todayISO(){

  const d = new Date();

  const y = d.getFullYear();

  const m = String(d.getMonth()+1)
    .padStart(2,"0");

  const day = String(d.getDate())
    .padStart(2,"0");

  return `${y}-${m}-${day}`;

}


function money(n){

  n = Number(n) || 0;

  return "₹" + n.toLocaleString("en-IN");

}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(id){

  document.querySelectorAll(".page")
    .forEach(p => {

      p.classList.remove("active");

    });

  const page =
    document.getElementById(id);

  if(page){

    page.classList.add("active");

  }

  document.querySelectorAll("nav button")
    .forEach(btn => {

      btn.classList.remove("active");

    });

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

}


/* =========================================================
   BALANCE
   ========================================================= */

function balance(account){

  return (
    Number(db[account].income || 0) -
    Number(db[account].expense || 0)
  );

}


/* =========================================================
   ADD ACCOUNT MONEY
   ========================================================= */

function addAccountMoney(
  account,
  type,
  amount,
  note,
  source = "manual"
){

  amount = Number(amount);

  if(!amount || amount <= 0){

    alert("சரியான தொகையை கொடுக்கவும்");

    return false;

  }

  const log = {

    id:Date.now(),

    type,

    amount,

    note:note || "நேரடி பதிவு",

    source,

    date:nowText()

  };


  if(type === "in"){

    db[account].income += amount;

  }else{

    db[account].expense += amount;

  }


  db[account].logs.unshift(log);


  db.lastAction = {

    action:"account",

    account,

    type,

    amount,

    logId:log.id

  };


  saveDB();

  return true;

}


/* =========================================================
   SALARY
   ========================================================= */

function addSalary(type){

  const amount =
    Number(
      document.getElementById(
        "salaryAmount"
      ).value
    );

  const note =
    document.getElementById(
      "salaryNote"
    ).value.trim();

  if(addAccountMoney(
    "salary",
    type,
    amount,
    note || (
      type === "in"
        ? "சம்பள வரவு"
        : "சம்பள செலவு"
    )
  )){

    document.getElementById(
      "salaryAmount"
    ).value = "";

    document.getElementById(
      "salaryNote"
    ).value = "";

  }

}


/* =========================================================
   HOME
   ========================================================= */

function addHome(type){

  const amount =
    Number(
      document.getElementById(
        "homeAmount"
      ).value
    );

  const note =
    document.getElementById(
      "homeNote"
    ).value.trim();

  if(addAccountMoney(
    "home",
    type,
    amount,
    note || (
      type === "in"
        ? "வீட்டு வரவு"
        : "வீட்டு செலவு"
    )
  )){

    document.getElementById(
      "homeAmount"
    ).value = "";

    document.getElementById(
      "homeNote"
    ).value = "";

  }

}


/* =========================================================
   FARM
   ========================================================= */

function addFarm(){

  const amount =
    Number(
      document.getElementById(
        "farmAmount"
      ).value
    );

  const note =
    document.getElementById(
      "farmNote"
    ).value.trim();

  const source =
    document.getElementById(
      "farmSource"
    ).value;

  if(!amount || amount <= 0){

    alert("தொகை கொடுக்கவும்");

    return;

  }


  addAccountMoney(
    "farm",
    "out",
    amount,
    note || "கொல்லை செலவு",
    source
  );


  document.getElementById(
    "farmAmount"
  ).value = "";

  document.getElementById(
    "farmNote"
  ).value = "";

}


/* =========================================================
   UNIFIED EXPENSE
   ========================================================= */

function addExpense(
  note,
  amount,
  person,
  source
){

  amount = Number(amount);

  if(!amount || amount <= 0){

    return false;

  }


  const expense = {

    id:Date.now(),

    note:note || "செலவு",

    amount,

    person:person || "",

    source:source || "home",

    date:nowText()

  };


  db.expenses.unshift(expense);


  addAccountMoney(
    source,
    "out",
    amount,
    note || "செலவு",
    "expense"
  );


  db.lastAction = {

    action:"expense",

    expenseId:expense.id,

    account:source,

    amount

  };


  saveDB();

  return true;

}


function addExpenseManual(){

  const note =
    document.getElementById(
      "expenseNote"
    ).value.trim();

  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      ).value
    );

  const person =
    document.getElementById(
      "expensePerson"
    ).value.trim();

  const source =
    document.getElementById(
      "expenseSource"
    ).value;


  if(addExpense(
    note,
    amount,
    person,
    source
  )){

    document.getElementById(
      "expenseNote"
    ).value = "";

    document.getElementById(
      "expenseAmount"
    ).value = "";

    document.getElementById(
      "expensePerson"
    ).value = "";

  }

}


/* =========================================================
   DELETE EXPENSE
   ========================================================= */

function deleteExpense(id){

  const index =
    db.expenses.findIndex(
      x => x.id === id
    );

  if(index < 0) return;


  const item =
    db.expenses[index];

  const account =
    item.source;


  db[account].expense -=
    item.amount;


  const logIndex =
    db[account].logs.findIndex(
      x =>
        x.amount === item.amount &&
        x.note === item.note
    );


  if(logIndex >= 0){

    db[account].logs.splice(
      logIndex,
      1
    );

  }


  db.expenses.splice(
    index,
    1
  );

  saveDB();

}


/* =========================================================
   LOANS / INTEREST
   ========================================================= */

function addLoan(){

  const name =
    document.getElementById(
      "loanName"
    ).value.trim();

  const amount =
    Number(
      document.getElementById(
        "loanAmount"
      ).value
    );

  const rate =
    Number(
      document.getElementById(
        "loanRate"
      ).value
    );

  const date =
    document.getElementById(
      "loanDate"
    ).value ||
    todayISO();


  if(!name){

    alert("பெயர் கொடுக்கவும்");

    return;

  }


  if(!amount || amount <= 0){

    alert("அசல் தொகை கொடுக்கவும்");

    return;

  }


  const loan = {

    id:Date.now(),

    name,

    amount,

    rate:Number(rate || 0),

    date,

    paid:0,

    payments:[]

  };


  db.loans.push(loan);


  db.lastAction = {

    action:"loan",

    loanId:loan.id

  };


  saveDB();


  document.getElementById(
    "loanName"
  ).value = "";

  document.getElementById(
    "loanAmount"
  ).value = "";

  document.getElementById(
    "loanRate"
  ).value = "";

}


function loanInterest(loan){

  return (
    Number(loan.amount || 0) *
    Number(loan.rate || 0) /
    100
  );

}


function loanRemaining(loan){

  return Math.max(
    0,
    Number(loan.amount || 0) -
    Number(loan.paid || 0)
  );

}


function addLoanPayment(id){

  const loan =
    db.loans.find(
      x => x.id === id
    );

  if(!loan) return;


  const amount =
    Number(
      prompt(
        `${loan.name} கணக்கில் எவ்வளவு திருப்பி கொடுத்தார்?`
      )
    );


  if(!amount || amount <= 0){

    return;

  }


  loan.paid =
    Number(loan.paid || 0) +
    amount;


  loan.payments =
    Array.isArray(loan.payments)
      ? loan.payments
      : [];


  loan.payments.unshift({

    amount,

    date:nowText()

  });


  saveDB();

}


function deleteLoan(id){

  if(!confirm(
    "இந்த Loan Account-ஐ அழிக்கவா?"
  )){

    return;

  }


  db.loans =
    db.loans.filter(
      x => x.id !== id
    );

  saveDB();

}


/* =========================================================
   NOTES
   ========================================================= */

function addNote(type){

  const id =
    type === "temp"
      ? "tempText"
      : "permText";

  const text =
    document.getElementById(
      id
    ).value.trim();


  if(!text){

    return;

  }


  db.notes[type].unshift({

    id:Date.now(),

    text,

    date:nowText()

  });


  db.lastAction = {

    action:"note",

    type,

    id:db.notes[type][0].id

  };


  document.getElementById(
    id
  ).value = "";

  saveDB();

}


function deleteNote(type,id){

  db.notes[type] =
    db.notes[type].filter(
      x => x.id !== id
    );

  saveDB();

}


function clearTemporary(){

  if(!confirm(
    "அனைத்து தற்காலிக குறிப்புகளையும் அழிக்கவா?"
  )){

    return;

  }


  db.notes.temp = [];

  saveDB();

}


/* =========================================================
   REMINDERS
   ========================================================= */

function addReminder(){

  const text =
    document.getElementById(
      "reminderText"
    ).value.trim();

  const date =
    document.getElementById(
      "reminderDate"
    ).value;

  const time =
    document.getElementById(
      "reminderTime"
    ).value;

  const early =
    Number(
      document.getElementById(
        "reminderEarly"
      ).value
    ) || 0;


  if(!text || !date || !time){

    alert(
      "நினைவூட்டல், தேதி, நேரம் கொடுக்கவும்"
    );

    return;

  }


  const reminder = {

    id:Date.now(),

    text,

    date,

    time,

    early,

    done:false,

    notified:false,

    created:nowText()

  };


  db.reminders.push(reminder);


  db.lastAction = {

    action:"reminder",

    id:reminder.id

  };


  saveDB();


  document.getElementById(
    "reminderText"
  ).value = "";

}


function deleteReminder(id){

  db.reminders =
    db.reminders.filter(
      x => x.id !== id
    );

  saveDB();

}


/* =========================================================
   NOTIFICATION
   ========================================================= */

async function requestNotifications(){

  if(!("Notification" in window)){

    alert(
      "இந்த browser Notification-ஐ support செய்யவில்லை"
    );

    return;

  }


  const permission =
    await Notification.requestPermission();


  if(permission === "granted"){

    alert(
      "🔔 Notification அனுமதி கிடைத்துவிட்டது"
    );

  }

}


function checkReminders(){

  const now =
    new Date();

  let changed = false;


  db.reminders.forEach(
    rem => {

      if(
        rem.done ||
        rem.notified
      ){

        return;

      }


      const target =
        new Date(
          `${rem.date}T${rem.time}:00`
        );


      const earlyMs =
        Number(rem.early || 0) *
        60 *
        1000;


      const notifyTime =
        new Date(
          target.getTime() -
          earlyMs
        );


      if(
        now >= notifyTime &&
        now <=
          target.getTime() + 60000
      ){

        sendReminderNotification(rem);

        rem.notified = true;

        changed = true;

      }

    }
  );


  if(changed){

    saveDB();

  }

}


function sendReminderNotification(rem){

  const text =
    `⏰ நினைவூட்டல்\n${rem.text}`;


  if(
    "Notification" in window &&
    Notification.permission === "granted"
  ){

    try{

      new Notification(
        "🎙️ ஜாக்கி",
        {
          body:rem.text
        }
      );

    }catch(e){

      console.log(e);

    }

  }


  speakText(text);

}


/* =========================================================
   AMOUNT PARSER
   ========================================================= */

function parseAmount(text){

  if(!text) return 0;


  let clean =
    text
      .replace(/,/g,"")
      .replace(/₹/g,"");


  const numberMatches =
    clean.match(
      /\d+(?:\.\d+)?/g
    );


  let numberAmount = 0;


  if(numberMatches){

    numberAmount =
      Number(
        numberMatches[
          numberMatches.length - 1
        ]
      ) || 0;

  }


  const t =
    clean.toLowerCase();


  let wordAmount = 0;


  const special = [

    ["ஐம்பதாயிரம்",50000],
    ["நாற்பதாயிரம்",40000],
    ["முப்பதாயிரம்",30000],
    ["இருபதாயிரம்",20000],
    ["பத்தாயிரம்",10000],

    ["ஐம்பதாயிர",50000],
    ["நாற்பதாயிர",40000],
    ["முப்பதாயிர",30000],
    ["இருபதாயிர",20000],
    ["பத்தாயிர",10000],

    ["ஐம்பது ஆயிரம்",50000],
    ["நாற்பது ஆயிரம்",40000],
    ["முப்பது ஆயிரம்",30000],
    ["இருபது ஆயிரம்",20000],
    ["பத்து ஆயிரம்",10000],

    ["ஒரு லட்சம்",100000],
    ["ஒரு லட்ச",100000],
    ["இரண்டு லட்சம்",200000],
    ["மூன்று லட்சம்",300000]

  ];


  for(
    const [word,val]
    of special
  ){

    if(t.includes(word)){

      wordAmount = val;

      break;

    }

  }


  if(
    t.includes("ஆயிரம்") ||
    t.includes("ஆயிர")
  ){

    if(!wordAmount){

      const m =
        t.match(
          /(\d+(?:\.\d+)?)\s*ஆயிர/
        );


      if(m){

        wordAmount =
          Number(m[1]) * 1000;

      }else{

        const tamilThousands = {

          "ஒரு":1,
          "ஒன்று":1,
          "இரண்டு":2,
          "ரெண்டு":2,
          "மூன்று":3,
          "மூணு":3,
          "நான்கு":4,
          "நாலு":4,
          "ஐந்து":5,
          "அஞ்சு":5,
          "ஆறு":6,
          "ஏழு":7,
          "எட்டு":8,
          "ஒன்பது":9,
          "பத்து":10

        };


        for(
          const k in tamilThousands
        ){

          if(
            t.includes(
              k + " ஆயிர"
            )
          ){

            wordAmount =
              tamilThousands[k] *
              1000;

            break;

          }

        }

      }

    }

  }


  if(
    t.includes("லட்சம்") ||
    t.includes("லட்ச")
  ){

    if(!wordAmount){

      const m =
        t.match(
          /(\d+(?:\.\d+)?)\s*லட்ச/
        );


      if(m){

        wordAmount =
          Number(m[1]) * 100000;

      }else{

        wordAmount = 100000;

      }

    }

  }


  return Math.max(
    numberAmount,
    wordAmount
  );

}


/* =========================================================
   RATE PARSER
   ========================================================= */

function parseRate(text){

  const m =
    text.match(
      /(\d+(?:\.\d+)?)\s*%/
    );


  if(m){

    return Number(m[1]);

  }


  if(
    text.includes("3%") ||
    text.includes("மூன்று சதவீதம்") ||
    text.includes("மூணு சதவீதம்")
  ){

    return 3;

  }


  if(
    text.includes("2%") ||
    text.includes("இரண்டு சதவீதம்") ||
    text.includes("ரெண்டு சதவீதம்")
  ){

    return 2;

  }


  if(
    text.includes("1%") ||
    text.includes("ஒரு சதவீதம்")
  ){

    return 1;

  }


  return 2;

}


/* =========================================================
   SOURCE DETECTION
   ========================================================= */

function detectSource(text){

  const t =
    text.toLowerCase();


  /* SALARY */

  if(
    t.includes("சம்பளத்தில்") ||
    t.includes("சம்பளத்தில") ||
    t.includes("சம்பள பணத்தில்") ||
    t.includes("சம்பள பணத்தில") ||
    t.includes("சம்பள பணம்") ||
    t.includes("சம்பளத்துல") ||
    t.includes("சம்பள பணத்துல") ||
    t.includes("சம்பளத்திலிருந்து") ||
    t.includes("சம்பளத்தில் இருந்து") ||
    t.includes("salary")
  ){

    return "salary";

  }


  /* HOME */

  if(
    t.includes("வீட்டு பணத்தில்") ||
    t.includes("வீட்டு பணத்தில") ||
    t.includes("வீட்டு பணத்துல") ||
    t.includes("வீட்டுப் பணத்தில்") ||
    t.includes("வீட்டுப் பணத்துல") ||
    t.includes("வீட்டில் இருந்து") ||
    t.includes("வீட்டிலிருந்து") ||
    t.includes("வீட்டு பணம்") ||
    t.includes("வீட்டுப் பணம்") ||
    t.includes("வீட்டுல") ||
    t.includes("வீட்டு")
  ){

    return "home";

  }


  /* FARM */

  if(
    t.includes("கொல்லை பணத்தில்") ||
    t.includes("கொல்லை பணத்தில") ||
    t.includes("கொல்லை பணத்துல") ||
    t.includes("கொல்லை பணம்") ||
    t.includes("கொல்லைல") ||
    t.includes("farm")
  ){

    return "farm";

  }


  return "home";

}


/* =========================================================
   INCOME SOURCE DETECTION
   ========================================================= */

function detectIncomeAccount(text){

  const t =
    text.toLowerCase();


  if(
    t.includes("சம்பளம்") ||
    t.includes("சம்பள பணம்") ||
    t.includes("சம்பளம் வந்த") ||
    t.includes("சம்பளம் வாங்க") ||
    t.includes("சம்பளம் வாங்கிய") ||
    t.includes("salary")
  ){

    return "salary";

  }


  if(
    t.includes("வீட்டு பணம்") ||
    t.includes("வீட்டில் பணம்") ||
    t.includes("வீட்டுக்கு பணம்") ||
    t.includes("வீட்டு வரவு") ||
    t.includes("வீட்டில் வரவு") ||
    t.includes("home")
  ){

    return "home";

  }


  if(
    t.includes("கொல்லை பணம்") ||
    t.includes("கொல்லை வரவு") ||
    t.includes("farm")
  ){

    return "farm";

  }


  return null;

}


/* =========================================================
   NATURAL LANGUAGE CLASSIFICATION
   ========================================================= */

function isIncomeMessage(text){

  const t =
    text.toLowerCase();


  const words = [

    "வரவு",
    "வந்தது",
    "வந்தாச்சு",
    "வந்தாச்ச",
    "வந்துடுச்சு",
    "கிடைத்தது",
    "கிடைச்சது",
    "கொடுத்தார்கள்",
    "கொடுத்தாங்க",
    "கொடுத்தார்",
    "கொடுத்தாச்சு",
    "வாங்கியாச்சு",
    "வாங்கிட்டேன்",
    "வாங்கினேன்",
    "சம்பளம் வந்தது",
    "சம்பளம் வாங்கியாச்சு",
    "பணம் வந்தது",
    "பணம் கிடைத்தது",
    "பெற்றேன்"

  ];


  return words.some(
    w => t.includes(w)
  );

}


function isExpenseMessage(text){

  const t =
    text.toLowerCase();


  const words = [

    "செலவு",
    "செலவானது",
    "செலவு செய்தேன்",
    "செலவு பண்ணினேன்",
    "செலவு பண்ணேன்",
    "வாங்கினேன்",
    "வாங்கிட்டேன்",
    "போட்டேன்",
    "கொடுத்தேன்",
    "கொடுத்தாச்சு",
    "குடித்தேன்",
    "சாப்பிட்டேன்",
    "பெட்ரோல்",
    "டீ",
    "தேநீர்",
    "காபி",
    "சாப்பாடு",
    "சாப்பிட்ட",
    "டிபன்",
    "காய்கறி",
    "மருந்து",
    "உரம்",
    "விதை",
    "டீசல்",
    "பஸ்",
    "ஆட்டோ",
    "பால்",
    "மளிகை",
    "பில்",
    "மின்சாரம்",
    "தண்ணீர்"

  ];


  return words.some(
    w => t.includes(w)
  );

}


/* =========================================================
   PERSON EXTRACTION
   ========================================================= */

function extractPerson(text){

  let m =
    text.match(
      /([A-Za-z\u0B80-\u0BFF]{2,})\s*(?:க்கு|கிட்ட|கணக்கில்|கணக்குல)/
    );


  if(m){

    return m[1];

  }


  m =
    text.match(
      /(?:க்கு|கிட்ட)\s*([A-Za-z\u0B80-\u0BFF]{2,})/
    );


  if(m){

    return m[1];

  }


  return "";

}


/* =========================================================
   EXPENSE NOTE EXTRACTION
   ========================================================= */

function detectExpenseNote(text){

  const t =
    text.toLowerCase();


  const items = [

    "பெட்ரோல்",
    "டீசல்",
    "டீ",
    "காபி",
    "தேநீர்",
    "சாப்பாடு",
    "டிபன்",
    "காய்கறி",
    "மருந்து",
    "உரம்",
    "விதை",
    "பால்",
    "மளிகை",
    "மின்சாரம்",
    "தண்ணீர்",
    "பில்",
    "பஸ்",
    "ஆட்டோ"

  ];


  for(
    const item of items
  ){

    if(t.includes(item)){

      return item;

    }

  }


  return "செலவு";

}


/* =========================================================
   INCOME HANDLER
   ========================================================= */

function handleIncome(text){

  const account =
    detectIncomeAccount(text);


  const amount =
    parseAmount(text);


  if(!account){

    return false;

  }


  if(!amount){

    speakText(
      "எவ்வளவு பணம் வந்தது என்று சொல்லுங்கள்."
    );

    return true;

  }


  let note =
    "வரவு";


  if(account === "salary"){

    note =
      "சம்பள வரவு";

  }


  if(account === "home"){

    note =
      "வீட்டு வரவு";

  }


  if(account === "farm"){

    note =
      "கொல்லை வரவு";

  }


  addAccountMoney(
    account,
    "in",
    amount,
    note,
    "voice"
  );


  const names = {

    salary:"சம்பள கணக்கில்",

    home:"வீட்டு கணக்கில்",

    farm:"கொல்லை கணக்கில்"

  };


  const reply =
    `${names[account]} ${money(amount)} வரவு சேர்த்துவிட்டேன்.`;


  addAIMessage(reply);

  speakText(reply);

  return true;

}


/* =========================================================
   EXPENSE HANDLER
   ========================================================= */

function handleExpense(text){

  const amount =
    parseAmount(text);


  if(!amount){

    speakText(
      "செலவு தொகையை சொல்லுங்கள்."
    );

    return true;

  }


  const source =
    detectSource(text);


  const note =
    detectExpenseNote(text);


  const person =
    extractPerson(text);


  addExpense(
    note,
    amount,
    person,
    source
  );


  const sourceName = {

    salary:"சம்பள பணத்தில் இருந்து",

    home:"வீட்டு பணத்தில் இருந்து",

    farm:"கொல்லை பணத்தில் இருந்து"

  };


  let reply =
    `${sourceName[source]} ${money(amount)} ${note} செலவு சேர்த்துவிட்டேன்.`;


  if(person){

    reply +=
      ` (${person})`;

  }


  addAIMessage(reply);

  speakText(reply);

  return true;

}


/* =========================================================
   CHAT
   ========================================================= */

function addUserMessage(text){

  const box =
    document.getElementById(
      "chatBox"
    );

  if(!box) return;


  const div =
    document.createElement(
      "div"
    );

  div.className =
    "message user";

  div.textContent =
    text;


  box.appendChild(div);

  box.scrollTop =
    box.scrollHeight;

}


function addAIMessage(text){

  const box =
    document.getElementById(
      "chatBox"
    );

  if(!box) return;


  const div =
    document.createElement(
      "div"
    );

  div.className =
    "message ai";

  div.textContent =
    text;


  box.appendChild(div);

  box.scrollTop =
    box.scrollHeight;

}


function clearChat(){

  const box =
    document.getElementById(
      "chatBox"
    );

  if(!box) return;


  box.innerHTML = `

    <div class="message ai">
      வணக்கம்! என்ன செய்ய வேண்டும்?
    </div>

  `;

}


/* =========================================================
   QUERY HANDLER
   ========================================================= */

function handleQuery(text){

  const t =
    text.toLowerCase();


  /* SALARY BALANCE */

  if(
    t.includes("சம்பள வரவு") &&
    (
      t.includes("எவ்வளவு") ||
      t.includes("மொத்தம்")
    )
  ){

    const reply =
      `சம்பள வரவு மொத்தம் ${money(
        db.salary.income
      )}.`;

    addAIMessage(reply);

    speakText(reply);

    return true;

  }


  if(
    (
      t.includes("சம்பள மீதி") ||
      t.includes("சம்பள கணக்கில்") ||
      t.includes("சம்பள பணம் எவ்வளவு")
    ) &&
    t.includes("எவ்வளவு")
  ){

    const reply =
      `சம்பள பணம் மீதி ${money(
        balance("salary")
      )}.`;

    addAIMessage(reply);

    speakText(reply);

    return true;

  }


  /* HOME BALANCE */

  if(
    (
      t.includes("வீட்டு பணம்") ||
      t.includes("வீட்டு கணக்கு") ||
      t.includes("வீட்டு மீதி")
    ) &&
    t.includes("எவ்வளவு")
  ){

    const reply =
      `வீட்டு பணம் மீதி ${money(
        balance("home")
      )}.`;

    addAIMessage(reply);

    speakText(reply);

    return true;

  }


  /* FARM BALANCE */

  if(
    (
      t.includes("கொல்லை பணம்") ||
      t.includes("கொல்லை கணக்கு") ||
      t.includes("கொல்லை மீதி")
    ) &&
    t.includes("எவ்வளவு")
  ){

    const reply =
      `கொல்லை பணம் மீதி ${money(
        balance("farm")
      )}.`;

    addAIMessage(reply);

    speakText(reply);

    return true;

  }


  /* TOTAL EXPENSE */

  if(
    t.includes("மொத்த செலவு") ||
    t.includes("மொத்த செலவுகள்") ||
    t.includes("இந்த மாத செலவு")
  ){

    const total =
      db.expenses.reduce(
        (sum,x) =>
          sum + Number(x.amount || 0),
        0
      );


    const reply =
      `மொத்த செலவு ${money(total)}.`;

    addAIMessage(reply);

    speakText(reply);

    return true;

  }


  /* WHO LOANS */

  if(
    t.includes("யாருக்கெல்லாம்") &&
    (
      t.includes("வட்டி") ||
      t.includes("கடன்")
    )
  ){

    if(!db.loans.length){

      const reply =
        "இப்போது யாருடைய வட்டி கணக்கும் இல்லை.";

      addAIMessage(reply);

      speakText(reply);

      return true;

    }


    const names =
      db.loans.map(
        x =>
          `${x.name} - ${money(x.amount)} - ${x.rate}%`
      ).join("\n");


    const reply =
      `வட்டி கணக்குகள்:\n${names}`;

    addAIMessage(reply);

    speakText(
      `மொத்தம் ${db.loans.length} வட்டி கணக்குகள் உள்ளன.`
    );

    return true;

  }


  /* PERSON LOAN BALANCE */

  if(
    t.includes("கணக்கில்") &&
    (
      t.includes("எவ்வளவு") ||
      t.includes("இருக்கு")
    )
  ){

    const person =
      extractPerson(text);


    if(person){

      const loans =
        db.loans.filter(
          x =>
            x.name
              .toLowerCase()
              .includes(
                person.toLowerCase()
              )
        );


      if(loans.length){

        let total = 0;

        let interest = 0;


        loans.forEach(x => {

          total +=
            loanRemaining(x);

          interest +=
            loanInterest(x);

        });


        const reply =
          `${person} கணக்கில் அசல் மீதி ${money(total)}.\n` +
          `மாத வட்டி ${money(interest)}.`;

        addAIMessage(reply);

        speakText(
          `${person} கணக்கில் அசல் மீதி ${money(total)}`
        );

        return true;

      }

    }

  }


  return false;

}


/* =========================================================
   UNDO
   ========================================================= */

function undoLast(){

  if(!db.lastAction){

    const reply =
      "நீக்குவதற்கு சமீபத்திய பதிவு இல்லை.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }


  const action =
    db.lastAction;


  if(action.action === "account"){

    const account =
      db[action.account];


    account[
      action.type === "in"
        ? "income"
        : "expense"
    ] -= action.amount;


    const index =
      account.logs.findIndex(
        x => x.id === action.logId
      );


    if(index >= 0){

      account.logs.splice(
        index,
        1
      );

    }


    db.lastAction = null;

    saveDB();


    const reply =
      "கடைசி கணக்கு பதிவு நீக்கிவிட்டேன்.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }


  if(action.action === "expense"){

    const index =
      db.expenses.findIndex(
        x =>
          x.id === action.expenseId
      );


    if(index >= 0){

      const item =
        db.expenses[index];


      db[action.account].expense -=
        action.amount;


      const li =
        db[action.account].logs.findIndex(
          x =>
            x.amount === item.amount &&
            x.note === item.note
        );


      if(li >= 0){

        db[action.account].logs.splice(
          li,
          1
        );

      }


      db.expenses.splice(
        index,
        1
      );

    }


    db.lastAction = null;

    saveDB();


    const reply =
      "கடைசி செலவு நீக்கிவிட்டேன்.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }


  if(action.action === "loan"){

    db.loans =
      db.loans.filter(
        x =>
          x.id !== action.loanId
      );


    db.lastAction = null;

    saveDB();


    const reply =
      "கடைசி வட்டி கணக்கு நீக்கிவிட்டேன்.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }


  if(action.action === "note"){

    db.notes[action.type] =
      db.notes[action.type].filter(
        x =>
          x.id !== action.id
      );


    db.lastAction = null;

    saveDB();


    const reply =
      "கடைசி குறிப்பு நீக்கிவிட்டேன்.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }


  if(action.action === "reminder"){

    db.reminders =
      db.reminders.filter(
        x =>
          x.id !== action.id
      );


    db.lastAction = null;

    saveDB();


    const reply =
      "கடைசி நினைவூட்டல் நீக்கிவிட்டேன்.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }

}


/* =========================================================
   MAIN AI
   ========================================================= */

function sendMessage(){

  const input =
    document.getElementById(
      "textInput"
    );


  const text =
    input.value.trim();


  if(!text){

    return;

  }


  addUserMessage(text);

  input.value = "";


  const t =
    text.toLowerCase();


  /* UNDO */

  if(
    t.includes("தப்பு") ||
    t.includes("தப்பா") ||
    t.includes("நீக்கு") ||
    t.includes("அழி") ||
    t.includes("delete") ||
    t.includes("undo")
  ){

    undoLast();

    return;

  }


  /* QUERY */

  if(handleQuery(text)){

    return;

  }


  /* INCOME */

  if(isIncomeMessage(text)){

    if(handleIncome(text)){

      return;

    }

  }


  /* EXPENSE */

  if(isExpenseMessage(text)){

    if(handleExpense(text)){

      return;

    }

  }


  /* LOAN */

  if(
    (
      t.includes("வட்டி") ||
      t.includes("கடன்")
    ) &&
    parseAmount(text) > 0
  ){

    const name =
      extractPerson(text) ||
      "பெயர் தெரியவில்லை";


    const amount =
      parseAmount(text);


    const rate =
      parseRate(text);


    const loan = {

      id:Date.now(),

      name,

      amount,

      rate,

      date:todayISO(),

      paid:0,

      payments:[]

    };


    db.loans.push(loan);


    db.lastAction = {

      action:"loan",

      loanId:loan.id

    };


    saveDB();


    const reply =
      `${name} பெயரில் ${money(amount)} அசல், ${rate}% மாத வட்டி கணக்கு சேர்த்துவிட்டேன்.`;

    addAIMessage(reply);

    speakText(reply);

    return;

  }


  /* NOTE */

  if(
    t.includes("நினைவில் வை") ||
    t.includes("நோட்டில் எழுது") ||
    t.includes("குறிப்பு")
  ){

    db.notes.temp.unshift({

      id:Date.now(),

      text,

      date:nowText()

    });


    db.lastAction = {

      action:"note",

      type:"temp",

      id:db.notes.temp[0].id

    };


    saveDB();


    const reply =
      "தற்காலிக குறிப்பில் வைத்துவிட்டேன்.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }


  /* DEFAULT */

  const reply =
    "புரிந்துகொள்ள முயற்சி செய்கிறேன். " +
    "உதாரணமாக, “சம்பளம் வந்தது 20000”, " +
    "“சம்பள பணத்தில் இருந்து பெட்ரோல் 300”, " +
    "“வீட்டு பணத்தில் டீ 200” என்று சொல்லலாம்.";


  addAIMessage(reply);

  speakText(reply);

}


/* =========================================================
   SPEECH SYNTHESIS
   ========================================================= */

function speakText(text){

  if(!("speechSynthesis" in window)){

    return;

  }


  try{

    window.speechSynthesis.cancel();


    const utter =
      new SpeechSynthesisUtterance(
        text
      );


    utter.lang =
      "ta-IN";

    utter.rate =
      0.95;

    utter.pitch =
      1;

    utter.volume =
      1;


    window.speechSynthesis.speak(
      utter
    );

  }catch(e){

    console.log(e);

  }

}


/* =========================================================
   SPEECH RECOGNITION
   ========================================================= */

let recognition = null;


function startListening(){

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if(!SpeechRecognition){

    alert(
      "இந்த browser-ல் தமிழ் Voice Recognition இல்லை."
    );

    return;

  }


  if(recognition){

    try{

      recognition.stop();

    }catch(e){}

  }


  recognition =
    new SpeechRecognition();


  recognition.lang =
    "ta-IN";


  recognition.continuous =
    false;


  recognition.interimResults =
    true;


  recognition.maxAlternatives =
    3;


  const status =
    document.getElementById(
      "status"
    );


  status.textContent =
    "🎤 கேட்கிறேன்... பேசுங்கள்";


  recognition.onresult =
    function(event){

      let finalText = "";

      let interimText = "";


      for(
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ){

        const transcript =
          event.results[i][0]
            .transcript;


        if(
          event.results[i].isFinal
        ){

          finalText +=
            transcript;

        }else{

          interimText +=
            transcript;

        }

      }


      const input =
        document.getElementById(
          "textInput"
        );


      if(finalText){

        input.value =
          finalText;


        status.textContent =
          "✅ புரிந்தது";


        setTimeout(
          () => sendMessage(),
          300
        );

      }else{

        input.value =
          interimText;

      }

    };


  recognition.onerror =
    function(event){

      status.textContent =
        "❌ Voice Error: " +
        event.error;

    };


  recognition.onend =
    function(){

      if(
        status.textContent.includes(
          "கேட்கிறேன்"
        )
      ){

        status.textContent =
          "🎤 தயார்";

      }

    };


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


  const status =
    document.getElementById(
      "status"
    );


  status.textContent =
    "🎤 தயார்";

}


/* =========================================================
   ENTER KEY
   ========================================================= */

document.addEventListener(
  "keydown",
  function(e){

    if(
      e.key === "Enter" &&
      e.target.id === "textInput" &&
      !e.shiftKey
    ){

      e.preventDefault();

      sendMessage();

    }

  }
);


/* =========================================================
   RENDER HOME
   ========================================================= */

function renderHome(){

  const salary =
    document.getElementById(
      "summarySalary"
    );

  const home =
    document.getElementById(
      "summaryHome"
    );

  const expense =
    document.getElementById(
      "summaryExpense"
    );

  const rem =
    document.getElementById(
      "summaryRem"
    );


  if(salary){

    salary.textContent =
      money(balance("salary"));

  }


  if(home){

    home.textContent =
      money(balance("home"));

  }


  if(expense){

    const total =
      db.expenses.reduce(
        (s,x) =>
          s + Number(x.amount || 0),
        0
      );


    expense.textContent =
      money(total);

  }


  if(rem){

    rem.textContent =
      db.reminders.filter(
        x => !x.done
      ).length;

  }

}


/* =========================================================
   RENDER SALARY
   ========================================================= */

function renderSalary(){

  const bal =
    document.getElementById(
      "salaryBalance"
    );


  if(bal){

    bal.textContent =
      Number(
        balance("salary")
      ).toLocaleString(
        "en-IN"
      );

  }


  const list =
    document.getElementById(
      "salaryList"
    );


  if(!list) return;


  if(!db.salary.logs.length){

    list.innerHTML =
      `<div class="empty">சம்பள பதிவு இல்லை</div>`;

    return;

  }


  list.innerHTML =
    db.salary.logs.map(
      x => `

      <div class="record">

        <div>

          <b>
            ${
              x.type === "in"
                ? "🟢 வரவு"
                : "🔴 செலவு"
            }
            ${money(x.amount)}
          </b>

          <small>
            ${escapeHTML(x.note)}
            <br>
            ${escapeHTML(x.date)}
          </small>

        </div>

        <button
          class="delete"
          onclick="deleteSalaryLog(${x.id})">
          அழி
        </button>

      </div>

      `
    ).join("");

}


function deleteSalaryLog(id){

  const index =
    db.salary.logs.findIndex(
      x => x.id === id
    );


  if(index < 0) return;


  const item =
    db.salary.logs[index];


  if(item.type === "in"){

    db.salary.income -=
      item.amount;

  }else{

    db.salary.expense -=
      item.amount;

  }


  db.salary.logs.splice(
    index,
    1
  );


  saveDB();

}


/* =========================================================
   RENDER HOME ACCOUNT
   ========================================================= */

function renderHomeAccount(){

  const bal =
    document.getElementById(
      "homeBalance"
    );


  if(bal){

    bal.textContent =
      Number(
        balance("home")
      ).toLocaleString(
        "en-IN"
      );

  }


  const list =
    document.getElementById(
      "homeList"
    );


  if(!list) return;


  if(!db.home.logs.length){

    list.innerHTML =
      `<div class="empty">வீட்டு பதிவு இல்லை</div>`;

    return;

  }


  list.innerHTML =
    db.home.logs.map(
      x => `

      <div class="record">

        <div>

          <b>
            ${
              x.type === "in"
                ? "🟢 வரவு"
                : "🔴 செலவு"
            }
            ${money(x.amount)}
          </b>

          <small>
            ${escapeHTML(x.note)}
            <br>
            ${escapeHTML(x.date)}
          </small>

        </div>

        <button
          class="delete"
          onclick="deleteHomeLog(${x.id})">
          அழி
        </button>

      </div>

      `
    ).join("");

}


function deleteHomeLog(id){

  const index =
    db.home.logs.findIndex(
      x => x.id === id
    );


  if(index < 0) return;


  const item =
    db.home.logs[index];


  if(item.type === "in"){

    db.home.income -=
      item.amount;

  }else{

    db.home.expense -=
      item.amount;

  }


  db.home.logs.splice(
    index,
    1
  );


  saveDB();

}


/* =========================================================
   RENDER FARM
   ========================================================= */

function renderFarm(){

  const list =
    document.getElementById(
      "farmList"
    );


  if(!list) return;


  if(!db.farm.logs.length){

    list.innerHTML =
      `<div class="empty">கொல்லை பதிவு இல்லை</div>`;

    return;

  }


  list.innerHTML =
    db.farm.logs.map(
      x => `

      <div class="record">

        <div>

          <b>
            ${
              x.type === "in"
                ? "🟢 வரவு"
                : "🔴 செலவு"
            }
            ${money(x.amount)}
          </b>

          <small>
            ${escapeHTML(x.note)}
            <br>
            ${escapeHTML(x.date)}
          </small>

        </div>

        <button
          class="delete"
          onclick="deleteFarmLog(${x.id})">
          அழி
        </button>

      </div>

      `
    ).join("");

}


function deleteFarmLog(id){

  const index =
    db.farm.logs.findIndex(
      x => x.id === id
    );


  if(index < 0) return;


  const item =
    db.farm.logs[index];


  if(item.type === "in"){

    db.farm.income -=
      item.amount;

  }else{

    db.farm.expense -=
      item.amount;

  }


  db.farm.logs.splice(
    index,
    1
  );


  saveDB();

}


/* =========================================================
   RENDER EXPENSES
   ========================================================= */

function renderExpenses(){

  const list =
    document.getElementById(
      "expenseList"
    );


  if(!list) return;


  if(!db.expenses.length){

    list.innerHTML =
      `<div class="empty">செலவு பதிவு இல்லை</div>`;

    return;

  }


  list.innerHTML =
    db.expenses.map(
      x => `

      <div class="record">

        <div>

          <b>
            🔴 ${escapeHTML(x.note)}
            ${money(x.amount)}
          </b>

          <small>

            ${sourceTamil(x.source)}

            ${
              x.person
                ? " • " +
                  escapeHTML(x.person)
                : ""
            }

            <br>

            ${escapeHTML(x.date)}

          </small>

        </div>

        <button
          class="delete"
          onclick="deleteExpense(${x.id})">
          அழி
        </button>

      </div>

      `
    ).join("");

}


function sourceTamil(source){

  if(source === "salary")
    return "💵 சம்பள பணம்";

  if(source === "farm")
    return "🌾 கொல்லை பணம்";

  return "🏠 வீட்டு பணம்";

}


/* =========================================================
   RENDER LOANS
   ========================================================= */

function renderLoans(){

  const list =
    document.getElementById(
      "loanList"
    );


  if(!list) return;


  if(!db.loans.length){

    list.innerHTML =
      `<div class="empty">Loan Account இல்லை</div>`;

    return;

  }


  const grouped = {};


  db.loans.forEach(
    loan => {

      const key =
        loan.name.trim();


      if(!grouped[key]){

        grouped[key] = [];

      }


      grouped[key].push(loan);

    }
  );


  list.innerHTML =
    Object.keys(grouped).map(
      name => {

        const loans =
          grouped[name];


        const total =
          loans.reduce(
            (s,x) =>
              s + loanRemaining(x),
            0
          );


        const interest =
          loans.reduce(
            (s,x) =>
              s + loanInterest(x),
            0
          );


        return `

        <div class="loan-person">

          <div class="loan-person-header">

            <h3>
              ${escapeHTML(name)}
            </h3>

            <div class="loan-person-summary">

              அசல் மீதி:
              <b>${money(total)}</b>

              <br>

              மாத வட்டி:
              <b>${money(interest)}</b>

            </div>

          </div>


          ${loans.map(
            loan => `

            <div class="loan-account">

              <div class="loan-account-header">

                <b>
                  ${money(loan.amount)}
                  @ ${loan.rate}%
                </b>

                <span>
                  ${loan.date}
                </span>

              </div>


              <div class="loan-account-body">

                <div class="loan-row">

                  <span>அசல்</span>

                  <b>
                    ${money(loan.amount)}
                  </b>

                </div>


                <div class="loan-row">

                  <span>திருப்பியது</span>

                  <b>
                    ${money(loan.paid || 0)}
                  </b>

                </div>


                <div class="loan-row">

                  <span>மீதி</span>

                  <b>
                    ${money(
                      loanRemaining(loan)
                    )}
                  </b>

                </div>


                <div class="loan-row">

                  <span>மாத வட்டி</span>

                  <b>
                    ${money(
                      loanInterest(loan)
                    )}
                  </b>

                </div>


                <div class="loan-actions">

                  <button
                    class="green"
                    onclick="addLoanPayment(${loan.id})">
                    பணம் வந்தது
                  </button>

                  <button
                    class="danger"
                    onclick="deleteLoan(${loan.id})">
                    அழி
                  </button>

                </div>

              </div>

            </div>

            `
          ).join("")}

        </div>

        `;

      }
    ).join("");

}


/* =========================================================
   RENDER NOTES
   ========================================================= */

function renderNotes(){

  const temp =
    document.getElementById(
      "tempList"
    );

  const perm =
    document.getElementById(
      "permList"
    );


  if(temp){

    temp.innerHTML =
      db.notes.temp.length
        ? db.notes.temp.map(
            x => `

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
                அழி
              </button>

            </div>

            `
          ).join("")
        : `<div class="empty">
             தற்காலிக குறிப்பு இல்லை
           </div>`;

  }


  if(perm){

    perm.innerHTML =
      db.notes.perm.length
        ? db.notes.perm.map(
            x => `

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
                அழி
              </button>

            </div>

            `
          ).join("")
        : `<div class="empty">
             நிரந்தர குறிப்பு இல்லை
           </div>`;

  }

}


/* =========================================================
   RENDER REMINDERS
   ========================================================= */

function renderReminders(){

  const list =
    document.getElementById(
      "reminderList"
    );


  if(!list) return;


  if(!db.reminders.length){

    list.innerHTML =
      `<div class="empty">நினைவூட்டல் இல்லை</div>`;

    return;

  }


  const now =
    new Date();


  list.innerHTML =
    db.reminders.map(
      x => {

        const target =
          new Date(
            `${x.date}T${x.time}:00`
          );


        const due =
          target <= now &&
          !x.done;


        return `

        <div class="record ${
          due
            ? "reminder-due"
            : "reminder-ok"
        }">

          <div>

            <b>
              ⏰ ${escapeHTML(x.text)}
            </b>

            <small>

              ${x.date}
              ${x.time}

              <br>

              ${x.early} நிமிடம் முன்

              ${
                x.notified
                  ? " • 🔔 அறிவிக்கப்பட்டது"
                  : ""
              }

            </small>

          </div>


          <button
            class="delete"
            onclick="deleteReminder(${x.id})">
            அழி
          </button>

        </div>

        `;

      }
    ).join("");

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value){

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll(){

  renderHome();

  renderSalary();

  renderHomeAccount();

  renderFarm();

  renderExpenses();

  renderLoans();

  renderNotes();

  renderReminders();

}


/* =========================================================
   INITIALIZE
   ========================================================= */

loadDB();

renderAll();


setInterval(
  checkReminders,
  30000
);


setInterval(
  renderReminders,
  30000
);


/* =========================================================
   DEFAULT REMINDER DATE
   ========================================================= */

window.addEventListener(
  "load",
  function(){

    const date =
      document.getElementById(
        "reminderDate"
      );


    if(
      date &&
      !date.value
    ){

      date.value =
        todayISO();

    }

  }
);


/* =========================================================
   GLOBAL ERROR PROTECTION
   ========================================================= */

window.addEventListener(
  "error",
  function(e){

    console.log(
      "Jacky error:",
      e.message
    );

  }
);