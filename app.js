/* =========================================================
   🎙️ ஜாக்கி (SMART PA)
   FULL APP.JS
   VERSION: 8.0
   ========================================================= */

"use strict";

/* =========================================================
   STORAGE
   ========================================================= */

const DB_KEY = "balaji_pa_db_v12";


/* =========================================================
   DEFAULT DATABASE
   ========================================================= */

const DEFAULT_DB = {
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
    total: 0,
    logs: []
  },

  expenses: {
    logs: []
  },

  loans: [],

  notes: {
    temp: [],
    perm: []
  },

  reminders: [],

  chat: [],

  lastAction: null,

  nextId: 1
};


let db = null;


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function cloneDefaultDB() {
  return JSON.parse(
    JSON.stringify(DEFAULT_DB)
  );
}


function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}


function money(value) {
  return "₹" + Math.round(num(value)).toLocaleString("en-IN");
}


function makeId() {
  const id =
    Date.now() +
    Math.floor(Math.random() * 10000);

  if (!db.nextId) {
    db.nextId = id + 1;
  } else {
    db.nextId = Math.max(
      db.nextId + 1,
      id + 1
    );
  }

  return id;
}


function getDateTime() {

  const d = new Date();

  return d.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  ) +
  ", " +
  d.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }
  );
}


function todayISO() {

  const d = new Date();

  const y =
    d.getFullYear();

  const m =
    String(
      d.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      d.getDate()
    ).padStart(2, "0");

  return `${y}-${m}-${day}`;
}


function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   SAFE DOM
   ========================================================= */

function el(id) {
  return document.getElementById(id);
}


function setText(id, value) {

  const node = el(id);

  if (node) {
    node.textContent = value;
  }
}


function setHTML(id, value) {

  const node = el(id);

  if (node) {
    node.innerHTML = value;
  }
}


/* =========================================================
   DATABASE NORMALIZATION
   ========================================================= */

function normalizeDB(raw) {

  const fresh =
    cloneDefaultDB();

  if (
    !raw ||
    typeof raw !== "object"
  ) {
    return fresh;
  }


  /* -------------------------
     NEW FORMAT
     ------------------------- */

  if (raw.salary) {

    fresh.salary.income =
      num(raw.salary.income);

    fresh.salary.expense =
      num(raw.salary.expense);

    fresh.salary.logs =
      Array.isArray(
        raw.salary.logs
      )
        ? raw.salary.logs
        : [];
  }


  if (raw.home) {

    fresh.home.income =
      num(raw.home.income);

    fresh.home.expense =
      num(raw.home.expense);

    fresh.home.logs =
      Array.isArray(
        raw.home.logs
      )
        ? raw.home.logs
        : [];
  }


  if (raw.farm) {

    fresh.farm.total =
      num(raw.farm.total);

    fresh.farm.logs =
      Array.isArray(
        raw.farm.logs
      )
        ? raw.farm.logs
        : [];
  }


  if (raw.expenses) {

    fresh.expenses.logs =
      Array.isArray(
        raw.expenses.logs
      )
        ? raw.expenses.logs
        : [];
  }


  if (Array.isArray(raw.loans)) {
    fresh.loans = raw.loans;
  }


  if (raw.notes) {

    fresh.notes.temp =
      Array.isArray(
        raw.notes.temp
      )
        ? raw.notes.temp
        : [];

    fresh.notes.perm =
      Array.isArray(
        raw.notes.perm
      )
        ? raw.notes.perm
        : [];
  }


  if (Array.isArray(raw.reminders)) {
    fresh.reminders =
      raw.reminders;
  }


  if (Array.isArray(raw.chat)) {
    fresh.chat = raw.chat;
  }


  fresh.lastAction =
    raw.lastAction || null;

  fresh.nextId =
    num(raw.nextId) || 1;


  /* =====================================================
     OLD DATABASE MIGRATION
     ===================================================== */

  if (
    !raw.salary &&
    (
      raw.salIn !== undefined ||
      raw.salOut !== undefined
    )
  ) {

    fresh.salary.income =
      num(raw.salIn);

    fresh.salary.expense =
      num(raw.salOut);

    if (
      Array.isArray(
        raw.salLogs
      )
    ) {

      fresh.salary.logs =
        raw.salLogs.map(
          x => ({
            id:
              x.id ||
              makeId(),
            type:
              x.type ||
              x.t ||
              "expense",
            amount:
              num(
                x.amount ||
                x.amt
              ),
            note:
              x.note ||
              "நேரடி",
            date:
              x.date ||
              getDateTime()
          })
        );
    }
  }


  if (
    !raw.home &&
    (
      raw.homeIn !== undefined ||
      raw.homeOut !== undefined
    )
  ) {

    fresh.home.income =
      num(raw.homeIn);

    fresh.home.expense =
      num(raw.homeOut);

    if (
      Array.isArray(
        raw.homeLogs
      )
    ) {

      fresh.home.logs =
        raw.homeLogs.map(
          x => ({
            id:
              x.id ||
              makeId(),
            type:
              x.type ||
              x.t ||
              "expense",
            amount:
              num(
                x.amount ||
                x.amt
              ),
            note:
              x.note ||
              "நேரடி",
            date:
              x.date ||
              getDateTime()
          })
        );
    }
  }


  if (
    !raw.farm &&
    Array.isArray(
      raw.farmLogs
    )
  ) {

    fresh.farm.logs =
      raw.farmLogs.map(
        x => ({
          id:
            x.id ||
            makeId(),
          note:
            x.note ||
            "கொல்லை செலவு",
          amount:
            num(
              x.amount ||
              x.amt
            ),
          source:
            x.source ||
            "home",
          date:
            x.date ||
            getDateTime()
        })
      );

    fresh.farm.total =
      fresh.farm.logs.reduce(
        (
          total,
          item
        ) =>
          total +
          num(item.amount),
        0
      );
  }


  if (
    Array.isArray(
      raw.temps
    )
  ) {

    fresh.notes.temp =
      raw.temps.map(
        x => ({
          id:
            x.id ||
            makeId(),
          text:
            x.text ||
            x.note ||
            "",
          date:
            x.date ||
            getDateTime()
        })
      );
  }


  if (
    Array.isArray(
      raw.perms
    )
  ) {

    fresh.notes.perm =
      raw.perms.map(
        x => ({
          id:
            x.id ||
            makeId(),
          text:
            x.text ||
            x.note ||
            "",
          date:
            x.date ||
            getDateTime()
        })
      );
  }


  return fresh;
}


/* =========================================================
   LOAD DATABASE
   ========================================================= */

function loadDB() {

  try {

    const saved =
      localStorage.getItem(
        DB_KEY
      );

    if (!saved) {

      db =
        cloneDefaultDB();

      saveDB(false);

      return;

    }


    const parsed =
      JSON.parse(saved);

    db =
      normalizeDB(parsed);

    saveDB(false);

  } catch (error) {

    console.error(
      "Database load error:",
      error
    );

    db =
      cloneDefaultDB();

    try {
      saveDB(false);
    } catch (e) {
      console.error(e);
    }
  }
}


/* =========================================================
   SAVE DATABASE
   ========================================================= */

function saveDB(doRender = true) {

  try {

    localStorage.setItem(
      DB_KEY,
      JSON.stringify(db)
    );

  } catch (error) {

    console.error(
      "Database save error:",
      error
    );
  }


  if (doRender) {
    renderAll();
  }
}


/* compatibility */

function save() {
  saveDB(true);
}


/* =========================================================
   BALANCES
   ========================================================= */

function salaryBalance() {

  return (
    num(db.salary.income) -
    num(db.salary.expense)
  );
}


function homeBalance() {

  return (
    num(db.home.income) -
    num(db.home.expense)
  );
}


function farmTotal() {

  return db.farm.logs.reduce(
    (
      total,
      item
    ) =>
      total +
      num(item.amount),
    0
  );
}


/* =========================================================
   SOURCE NAME
   ========================================================= */

function sourceName(source) {

  if (
    source === "salary"
  ) {
    return "💵 சம்பள பணம்";
  }


  if (
    source === "farm"
  ) {
    return "🌾 கொல்லை";
  }


  return "🏠 வீட்டு பணம்";
}


/* =========================================================
   PARSE AMOUNT
   ========================================================= */

function parseAmount(text) {

  const s =
    String(
      text || ""
    )
      .replace(/,/g, "")
      .replace(/₹/g, "")
      .trim();


  let result = 0;


  const direct =
    s.match(
      /(\d+(?:\.\d+)?)/
    );


  if (direct) {
    result =
      Number(
        direct[1]
      );
  }


  const lower =
    s.toLowerCase();


  const wordMap = [

    [
      /ஐம்பதாயிரம்/,
      50000
    ],

    [
      /நாற்பதாயிரம்/,
      40000
    ],

    [
      /முப்பதாயிரம்/,
      30000
    ],

    [
      /இருபதாயிரம்/,
      20000
    ],

    [
      /பத்தாயிரம்/,
      10000
    ],

    [
      /ஐயாயிரம்/,
      5000
    ],

    [
      /ஆயிரம்/,
      1000
    ],

    [
      /லட்சம்|லட்ச/,
      100000
    ]
  ];


  for (
    const pair of wordMap
  ) {

    if (
      pair[0].test(s)
    ) {

      if (
        /ஆயிரம்/.test(s) &&
        result > 0
      ) {

        return result * 1000;

      }


      if (
        /லட்சம்|லட்ச/.test(s) &&
        result > 0
      ) {

        return result * 100000;

      }


      result =
        Math.max(
          result,
          pair[1]
        );
    }
  }


  return result;
}


/* =========================================================
   SOURCE PARSER
   ========================================================= */

function detectSource(text) {

  const s =
    String(
      text || ""
    );


  if (
    /சம்பள|சம்பளப்|சம்பள பணம்/.test(
      s
    )
  ) {

    return "salary";
  }


  if (
    /வீட்டு பணம்|வீட்டுப் பணம்|வீட்டில் இருந்து|வீட்டிலிருந்து|வீடு இருந்து|வீடு பணம்/.test(
      s
    )
  ) {

    return "home";
  }


  return null;
}


/* =========================================================
   SALARY ACCOUNT
   ========================================================= */

function addSalary(type) {

  const amountInput =
    el("salaryAmount") ||
    el("salAmt") ||
    el("salaryAmt");


  const noteInput =
    el("salaryNote") ||
    el("salNote");


  const amount =
    parseAmount(
      amountInput
        ? amountInput.value
        : ""
    );


  const note =
    noteInput
      ? noteInput.value.trim()
      : "நேரடி";


  if (
    amount <= 0
  ) {

    alert(
      "தயவுசெய்து தொகையை உள்ளிடுங்கள்."
    );

    return;
  }


  const item = {

    id: makeId(),

    type:
      type === "in"
        ? "income"
        : "expense",

    amount,

    note:
      note ||
      "நேரடி",

    date:
      getDateTime()
  };


  db.salary.logs.push(
    item
  );


  if (
    type === "in"
  ) {

    db.salary.income +=
      amount;

  } else {

    db.salary.expense +=
      amount;
  }


  db.lastAction = {

    target:
      "salary",

    id:
      item.id,

    type:
      item.type,

    amount
  };


  if (amountInput) {
    amountInput.value = "";
  }

  if (noteInput) {
    noteInput.value = "";
  }


  saveDB(true);
}


function deleteSalary(id) {

  const index =
    db.salary.logs.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (index < 0) {
    return;
  }


  const item =
    db.salary.logs[index];


  if (
    item.type === "income"
  ) {

    db.salary.income -=
      num(item.amount);

  } else {

    db.salary.expense -=
      num(item.amount);
  }


  db.salary.logs.splice(
    index,
    1
  );


  saveDB(true);
}


/* =========================================================
   HOME ACCOUNT
   ========================================================= */

function addHome(type) {

  const amountInput =
    el("homeAmount") ||
    el("homeAmt");


  const noteInput =
    el("homeNote");


  const amount =
    parseAmount(
      amountInput
        ? amountInput.value
        : ""
    );


  const note =
    noteInput
      ? noteInput.value.trim()
      : "";


  if (
    amount <= 0
  ) {

    alert(
      "தயவுசெய்து தொகையை உள்ளிடுங்கள்."
    );

    return;
  }


  const item = {

    id: makeId(),

    type:
      type === "in"
        ? "income"
        : "expense",

    amount,

    note:
      note ||
      (
        type === "in"
          ? "வீட்டிலிருந்து பணம் வரவு"
          : "வீட்டு செலவு"
      ),

    date:
      getDateTime()
  };


  db.home.logs.push(
    item
  );


  if (
    type === "in"
  ) {

    db.home.income +=
      amount;

  } else {

    db.home.expense +=
      amount;
  }


  db.lastAction = {

    target:
      "home",

    id:
      item.id,

    type:
      item.type,

    amount
  };


  if (amountInput) {
    amountInput.value = "";
  }

  if (noteInput) {
    noteInput.value = "";
  }


  saveDB(true);
}


function deleteHome(id) {

  const index =
    db.home.logs.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (index < 0) {
    return;
  }


  const item =
    db.home.logs[index];


  if (
    item.type === "income"
  ) {

    db.home.income -=
      num(item.amount);

  } else {

    db.home.expense -=
      num(item.amount);
  }


  db.home.logs.splice(
    index,
    1
  );


  saveDB(true);
}


/* =========================================================
   FARM EXPENSE
   IMPORTANT:
   FARM HAS NO INCOME.
   ONLY EXPENSE.
   SOURCE = SALARY / HOME
   ========================================================= */

function addFarm() {

  const noteInput =
    el("farmNote") ||
    el("farmCategory") ||
    el("farmText");


  const amountInput =
    el("farmAmount") ||
    el("farmAmt");


  const sourceInput =
    el("farmSource");


  const note =
    noteInput
      ? noteInput.value.trim()
      : "கொல்லை செலவு";


  const amount =
    parseAmount(
      amountInput
        ? amountInput.value
        : ""
    );


  let source =
    sourceInput
      ? sourceInput.value
      : detectSource(
          note
        );


  if (
    source !== "salary" &&
    source !== "home"
  ) {

    source = "home";
  }


  if (
    amount <= 0
  ) {

    alert(
      "கொல்லை செலவுத் தொகையை உள்ளிடுங்கள்."
    );

    return;
  }


  /*
     IMPORTANT:

     கொல்லை வரவு இல்லை.

     உதாரணம்:

     "சம்பள பணத்தில் இருந்து
      மருந்து ₹500"

     Salary expense = ₹500
     Farm expense = ₹500

     Home money என்றால்
     Home expense = ₹500
     Farm expense = ₹500
  */


  const item = {

    id: makeId(),

    note:
      note ||
      "கொல்லை செலவு",

    amount,

    source,

    date:
      getDateTime()
  };


  db.farm.logs.push(
    item
  );


  /*
     Deduct source money.
  */

  if (
    source === "salary"
  ) {

    db.salary.expense +=
      amount;

    db.salary.logs.push({

      id: makeId(),

      type:
        "expense",

      amount,

      note:
        "🌾 கொல்லை • " +
        item.note,

      farmId:
        item.id,

      date:
        item.date
    });

  } else {

    db.home.expense +=
      amount;

    db.home.logs.push({

      id: makeId(),

      type:
        "expense",

      amount,

      note:
        "🌾 கொல்லை • " +
        item.note,

      farmId:
        item.id,

      date:
        item.date
    });
  }


  db.farm.total =
    farmTotal();


  db.lastAction = {

    target:
      "farm",

    id:
      item.id,

    source,

    amount
  };


  if (noteInput) {
    noteInput.value = "";
  }

  if (amountInput) {
    amountInput.value = "";
  }


  saveDB(true);
}


/* =========================================================
   DELETE FARM EXPENSE
   ========================================================= */

function deleteFarm(id) {

  const index =
    db.farm.logs.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (index < 0) {
    return;
  }


  const item =
    db.farm.logs[index];


  /*
     Remove farm expense.
  */

  if (
    item.source === "salary"
  ) {

    db.salary.expense =
      Math.max(
        0,
        db.salary.expense -
        num(item.amount)
      );


    const i =
      db.salary.logs.findIndex(
        x =>
          Number(
            x.farmId
          ) ===
          Number(
            item.id
          )
      );


    if (i >= 0) {
      db.salary.logs.splice(
        i,
        1
      );
    }

  } else {

    db.home.expense =
      Math.max(
        0,
        db.home.expense -
        num(item.amount)
      );


    const i =
      db.home.logs.findIndex(
        x =>
          Number(
            x.farmId
          ) ===
          Number(
            item.id
          )
      );


    if (i >= 0) {
      db.home.logs.splice(
        i,
        1
      );
    }
  }


  db.farm.logs.splice(
    index,
    1
  );


  db.farm.total =
    farmTotal();


  saveDB(true);
}


/* =========================================================
   MANUAL EXPENSE
   ========================================================= */

function addExpenseManual() {

  const amountInput =
    el("expenseAmount") ||
    el("expenseAmt");


  const noteInput =
    el("expenseNote") ||
    el("expenseText");


  const sourceInput =
    el("expenseSource");


  const amount =
    parseAmount(
      amountInput
        ? amountInput.value
        : ""
    );


  const note =
    noteInput
      ? noteInput.value.trim()
      : "செலவு";


  let source =
    sourceInput
      ? sourceInput.value
      : detectSource(note);


  if (
    source !== "salary" &&
    source !== "home"
  ) {

    source = "home";
  }


  if (
    amount <= 0
  ) {

    alert(
      "தொகையை உள்ளிடுங்கள்."
    );

    return;
  }


  const item = {

    id: makeId(),

    amount,

    note:
      note ||
      "செலவு",

    source,

    date:
      getDateTime()
  };


  db.expenses.logs.push(
    item
  );


  if (
    source === "salary"
  ) {

    db.salary.expense +=
      amount;

  } else {

    db.home.expense +=
      amount;
  }


  db.lastAction = {

    target:
      "expense",

    id:
      item.id
  };


  if (amountInput) {
    amountInput.value = "";
  }

  if (noteInput) {
    noteInput.value = "";
  }


  saveDB(true);
}


/* =========================================================
   DELETE MANUAL EXPENSE
   ========================================================= */

function deleteExpense(id) {

  const index =
    db.expenses.logs.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (index < 0) {
    return;
  }


  const item =
    db.expenses.logs[index];


  if (
    item.source ===
    "salary"
  ) {

    db.salary.expense =
      Math.max(
        0,
        db.salary.expense -
        num(item.amount)
      );

  } else {

    db.home.expense =
      Math.max(
        0,
        db.home.expense -
        num(item.amount)
      );
  }


  db.expenses.logs.splice(
    index,
    1
  );


  saveDB(true);
}


/* =========================================================
   LOAN / INTEREST
   ========================================================= */

function loanRemaining(loan) {

  return Math.max(
    0,
    num(loan.amount) -
    num(loan.paid)
  );
}


function loanInterest(loan) {

  return (
    loanRemaining(loan) *
    num(loan.rate)
  ) / 100;
}


/* =========================================================
   ADD LOAN
   ========================================================= */

function addLoan() {

  const nameInput =
    el("loanName");


  const amountInput =
    el("loanAmount") ||
    el("loanAmt");


  const rateInput =
    el("loanRate");


  const name =
    nameInput
      ? nameInput.value.trim()
      : "";


  const amount =
    parseAmount(
      amountInput
        ? amountInput.value
        : ""
    );


  let rate =
    rateInput
      ? Number(
          rateInput.value
        )
      : 0;


  /*
     2 பைசா = 2%
     3 பைசா = 3%

     Rate is NOT treated as amount.
  */


  if (
    !rate ||
    rate <= 0
  ) {

    rate =
      2;
  }


  if (
    name === ""
  ) {

    alert(
      "யாருடைய வட்டி கணக்கு என்று பெயர் கொடுக்கவும்."
    );

    return;
  }


  if (
    amount <= 0
  ) {

    alert(
      "அசல் தொகையை உள்ளிடவும்."
    );

    return;
  }


  if (
    rate !== 1 &&
    rate !== 2 &&
    rate !== 3
  ) {

    /*
       Other rates are allowed too,
       but 1/2/3 are common.
    */

    rate =
      Number(rate);
  }


  const loan = {

    id: makeId(),

    name,

    amount,

    paid: 0,

    rate,

    payments: [],

    date:
      getDateTime()
  };


  db.loans.push(
    loan
  );


  db.lastAction = {

    target:
      "loan",

    id:
      loan.id
  };


  if (nameInput) {
    nameInput.value = "";
  }

  if (amountInput) {
    amountInput.value = "";
  }

  if (rateInput) {
    rateInput.value = "";
  }


  saveDB(true);
}


/* =========================================================
   LOAN PAYMENT
   ========================================================= */

function addLoanPayment(id) {

  const loan =
    db.loans.find(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (!loan) {
    return;
  }


  const remaining =
    loanRemaining(
      loan
    );


  if (
    remaining <= 0
  ) {

    alert(
      "இந்த கணக்கின் அசல் ஏற்கனவே முழுவதும் வந்துவிட்டது."
    );

    return;
  }


  const input =
    prompt(
      "வந்த பணம் எவ்வளவு?"
    );


  if (
    input === null
  ) {
    return;
  }


  const amount =
    parseAmount(
      input
    );


  if (
    amount <= 0
  ) {

    alert(
      "சரியான தொகையை கொடுக்கவும்."
    );

    return;
  }


  const actual =
    Math.min(
      amount,
      remaining
    );


  loan.paid =
    num(loan.paid) +
    actual;


  if (
    !Array.isArray(
      loan.payments
    )
  ) {

    loan.payments = [];
  }


  loan.payments.push({

    id: makeId(),

    amount: actual,

    date:
      getDateTime()
  });


  saveDB(true);
}


/* =========================================================
   DELETE LOAN
   ========================================================= */

function deleteLoan(id) {

  const index =
    db.loans.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (index < 0) {
    return;
  }


  if (
    !confirm(
      "இந்த வட்டி கணக்கை அழிக்கவா?"
    )
  ) {
    return;
  }


  db.loans.splice(
    index,
    1
  );


  saveDB(true);
}


/* =========================================================
   NOTES
   ========================================================= */

function addNote(type) {

  const input =
    type === "temp"
      ? (
          el("tempText") ||
          el("noteText")
        )
      : (
          el("permText") ||
          el("noteText")
        );


  const text =
    input
      ? input.value.trim()
      : "";


  if (!text) {

    alert(
      "குறிப்பை எழுதுங்கள்."
    );

    return;
  }


  const item = {

    id: makeId(),

    text,

    date:
      getDateTime()
  };


  if (
    type === "temp"
  ) {

    db.notes.temp.push(
      item
    );

  } else {

    db.notes.perm.push(
      item
    );
  }


  if (input) {
    input.value = "";
  }


  saveDB(true);
}


function deleteNote(
  type,
  id
) {

  const list =
    type === "temp"
      ? db.notes.temp
      : db.notes.perm;


  const index =
    list.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (index >= 0) {

    list.splice(
      index,
      1
    );

    saveDB(true);
  }
}


function clearTemporary() {

  if (
    !db.notes.temp.length
  ) {
    return;
  }


  if (
    !confirm(
      "அனைத்து தற்காலிக குறிப்புகளையும் அழிக்கவா?"
    )
  ) {
    return;
  }


  db.notes.temp = [];

  saveDB(true);
}


/* =========================================================
   REMINDER PARSING
   ========================================================= */

function reminderTarget(item) {

  if (
    !item ||
    !item.date
  ) {
    return null;
  }


  const date =
    new Date(
      item.date +
      "T" +
      (
        item.time ||
        "00:00"
      )
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }


  return date;
}


/* =========================================================
   ADD REMINDER
   ========================================================= */

function addReminder() {

  const textInput =
    el("reminderText");


  const dateInput =
    el("reminderDate");


  const timeInput =
    el("reminderTime");


  const earlyInput =
    el("reminderEarly");


  const text =
    textInput
      ? textInput.value.trim()
      : "";


  const date =
    dateInput
      ? dateInput.value
      : todayISO();


  const time =
    timeInput
      ? timeInput.value
      : "08:00";


  const early =
    earlyInput
      ? Number(
          earlyInput.value
        ) || 0
      : 0;


  if (!text) {

    alert(
      "நினைவூட்டல் என்ன என்பதை எழுதுங்கள்."
    );

    return;
  }


  const item = {

    id: makeId(),

    text,

    date,

    time,

    early,

    notified: false,

    done: false,

    created:
      getDateTime()
  };


  db.reminders.push(
    item
  );


  if (textInput) {
    textInput.value = "";
  }


  saveDB(true);

  scheduleAllReminders();

  checkReminders();
}


/* =========================================================
   DELETE REMINDER
   ========================================================= */

function deleteReminder(id) {

  const index =
    db.reminders.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (index >= 0) {

    db.reminders.splice(
      index,
      1
    );

    saveDB(true);
  }
}


/* =========================================================
   COMPLETE REMINDER
   ========================================================= */

function completeReminder(id) {

  const item =
    db.reminders.find(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (!item) {
    return;
  }


  item.done = true;

  saveDB(true);
}


/* =========================================================
   RESET REMINDER
   ========================================================= */

function resetReminder(id) {

  const item =
    db.reminders.find(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (!item) {
    return;
  }


  item.done = false;

  item.notified = false;

  saveDB(true);

  scheduleAllReminders();
}


/* =========================================================
   NOTIFICATION
   ========================================================= */

function notifyReminder(item) {

  const message =
    "⏰ " +
    item.text;


  try {

    if (
      "Notification" in
      window
    ) {

      if (
        Notification.permission ===
        "granted"
      ) {

        new Notification(
          "🎙️ ஜாக்கி நினைவூட்டல்",
          {
            body:
              message
          }
        );

      } else if (
        Notification.permission ===
        "default"
      ) {

        Notification.requestPermission()
          .catch(
            () => {}
          );
      }
    }

  } catch (e) {

    console.log(
      "Notification error:",
      e
    );
  }


  speakText(
    message
  );
}


/* =========================================================
   CHECK REMINDERS
   ========================================================= */

function checkReminders() {

  if (!db) {
    return;
  }


  const now =
    new Date();


  db.reminders.forEach(
    item => {

      if (
        item.done ||
        item.notified
      ) {
        return;
      }


      const target =
        reminderTarget(
          item
        );


      if (!target) {
        return;
      }


      const early =
        num(
          item.early
        );


      const notifyAt =
        new Date(
          target.getTime() -
          early * 60000
        );


      if (
        now >= notifyAt
      ) {

        item.notified =
          true;

        notifyReminder(
          item
        );

        saveDB(
          false
        );
      }
    }
  );
}


/* =========================================================
   SCHEDULE REMINDERS
   ========================================================= */

function scheduleAllReminders() {

  /*
     Polling is used instead of
     hundreds of setTimeout calls.
     This survives page reload better.
  */

  checkReminders();
}


/* =========================================================
   VOICE
   ========================================================= */

let recognition =
  null;


function startListening() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    alert(
      "இந்த browser-ல் voice input support இல்லை."
    );

    return;
  }


  try {

    recognition =
      new SpeechRecognition();

    recognition.lang =
      "ta-IN";

    recognition.continuous =
      false;

    recognition.interimResults =
      false;


    recognition.onresult =
      function(event) {

        const text =
          event.results[0][0].transcript;


        const input =
          el("chatInput") ||
          el("prompt");


        if (input) {

          input.value =
            text;
        }


        sendMessage(
          text
        );
      };


    recognition.onerror =
      function(error) {

        console.log(
          "Voice error:",
          error
        );
      };


    recognition.start();

  } catch (error) {

    console.error(
      error
    );
  }
}


function stopListening() {

  try {

    if (recognition) {

      recognition.stop();

      recognition =
        null;
    }

  } catch (e) {

    console.log(e);
  }
}


/* =========================================================
   SPEECH
   ========================================================= */

function speakText(text) {

  try {

    if (
      !window.speechSynthesis
    ) {
      return;
    }


    window.speechSynthesis.cancel();


    const utter =
      new SpeechSynthesisUtterance(
        String(text)
      );


    utter.lang =
      "ta-IN";

    utter.rate =
      0.95;

    utter.pitch =
      1;


    window.speechSynthesis.speak(
      utter
    );

  } catch (e) {

    console.log(
      "Speech error:",
      e
    );
  }
}


/* =========================================================
   AI CHAT STORAGE
   ========================================================= */

function addChat(
  role,
  text
) {

  db.chat.push({

    id: makeId(),

    role,

    text,

    date:
      getDateTime()
  });


  if (
    db.chat.length >
    100
  ) {

    db.chat =
      db.chat.slice(-100);
  }
}


/* =========================================================
   CHAT RENDER
   ========================================================= */

function renderChat() {

  const box =
    el("chatBox") ||
    el("chatMessages");


  if (!box) {
    return;
  }


  box.innerHTML =
    db.chat
      .map(
        item => {

          const cls =
            item.role ===
            "user"
              ? "user-msg"
              : "pa-msg";


          return `

            <div class="msg ${cls}">

              ${escapeHTML(
                item.text
              )}

              <small>
                ${escapeHTML(
                  item.date
                )}
              </small>

            </div>

          `;
        }
      )
      .join("");


  box.scrollTop =
    box.scrollHeight;
}


/* =========================================================
   CHAT CLEAR
   ========================================================= */

function clearChat() {

  db.chat = [];

  saveDB(true);

  renderChat();
}


/* =========================================================
   AI RESPONSE
   ========================================================= */

function sendMessage(
  suppliedText
) {

  const input =
    el("chatInput") ||
    el("prompt");


  const text =
    suppliedText !== undefined
      ? String(
          suppliedText
        ).trim()
      : (
          input
            ? input.value.trim()
            : ""
        );


  if (!text) {
    return;
  }


  addChat(
    "user",
    text
  );


  if (input) {
    input.value = "";
  }


  const reply =
    processCommand(
      text
    );


  addChat(
    "assistant",
    reply
  );


  saveDB(false);

  renderChat();


  speakText(
    reply
  );
}


/* compatibility */

function sendPrompt() {
  sendMessage();
}


/* =========================================================
   COMMAND PROCESSOR
   ========================================================= */

function processCommand(
  text
) {

  const s =
    String(
      text || ""
    ).trim();


  const amount =
    parseAmount(
      s
    );


  /* -------------------------
     UNDO
     ------------------------- */

  if (
    /தப்பா|தப்பு|நீக்கு|அழி|undo|cancel/i.test(
      s
    )
  ) {

    if (
      db.lastAction
    ) {

      undoLast();

      return "சரி. கடைசி செயலை நீக்கிவிட்டேன்.";
    }

    return "நீக்குவதற்கு கடைசி செயல் இல்லை.";
  }


  /* -------------------------
     BALANCE
     ------------------------- */

  if (
    /சம்பள.*பாக்கி|சம்பள.*மீதி|சம்பளம்.*எவ்வளவு|சம்பள பணம்.*எவ்வளவு/.test(
      s
    )
  ) {

    return (
      "💵 சம்பள பணம் மீதி " +
      money(
        salaryBalance()
      ) +
      "."
    );
  }


  if (
    /வீட்டு.*பாக்கி|வீட்டு.*மீதி|வீட்டு பணம்.*எவ்வளவு|வீட்டில்.*எவ்வளவு/.test(
      s
    )
  ) {

    return (
      "🏠 வீட்டு பணம் மீதி " +
      money(
        homeBalance()
      ) +
      "."
    );
  }


  if (
    /கொல்லை.*மொத்த|கொல்லை.*செலவு.*எவ்வளவு|கொள்ளை.*செலவு/.test(
      s
    )
  ) {

    return (
      "🌾 மொத்தக் கொல்லை செலவு " +
      money(
        farmTotal()
      ) +
      "."
    );
  }


  /* -------------------------
     HOME INCOME
     ------------------------- */

  if (
    amount > 0 &&
    /வீட்டிலிருந்து.*பணம்|வீட்டில் இருந்து.*பணம்|வீடு.*பணம்.*கொடுத்த|வீட்டு.*வரவு/.test(
      s
    ) &&
    !/கொல்லை/.test(s)
  ) {

    const note =
      "வீட்டிலிருந்து பணம் வரவு";


    const item = {

      id: makeId(),

      type:
        "income",

      amount,

      note,

      date:
        getDateTime()
    };


    db.home.logs.push(
      item
    );

    db.home.income +=
      amount;


    db.lastAction = {

      target:
        "home",

      id:
        item.id,

      type:
        "income",

      amount
    };


    saveDB(true);


    return (
      "🏠 வீட்டிலிருந்து " +
      money(amount) +
      " வரவு பதிவு செய்துவிட்டேன். " +
      "வீட்டு பணம் மீதி " +
      money(
        homeBalance()
      ) +
      "."
    );
  }


  /* -------------------------
     FARM EXPENSE
     ------------------------- */

  const farmWords =
    /கொல்லை|மருந்து|உரம்|களை|ஆள் கூலி|கூலி|வண்டி|டீசல்|வண்டி ஓட்டிய/;


  if (
    amount > 0 &&
    farmWords.test(s) &&
    /செலவு|வாங்க|வாங்கின|வாங்கிய|போட்டேன்|கொடுத்தேன்|சென்றது|செலவான/.test(
      s
    )
  ) {

    let source =
      detectSource(
        s
      );


    if (!source) {
      source = "home";
    }


    let note =
      "கொல்லை செலவு";


    if (
      /மருந்து/.test(s)
    ) {

      note = "மருந்து";

    } else if (
      /உரம்/.test(s)
    ) {

      note = "உரம்";

    } else if (
      /களை/.test(s)
    ) {

      note = "களை எடுத்தது";

    } else if (
      /ஆள் கூலி|கூலி/.test(s)
    ) {

      note = "ஆள் கூலி";

    } else if (
      /டீசல்/.test(s)
    ) {

      note = "டீசல்";

    } else if (
      /வண்டி/.test(s)
    ) {

      note = "வண்டி செலவு";
    }


    const item = {

      id: makeId(),

      note,

      amount,

      source,

      date:
        getDateTime()
    };


    db.farm.logs.push(
      item
    );


    if (
      source === "salary"
    ) {

      db.salary.expense +=
        amount;

      db.salary.logs.push({

        id: makeId(),

        type:
          "expense",

        amount,

        note:
          "🌾 கொல்லை • " +
          note,

        farmId:
          item.id,

        date:
          item.date
      });

    } else {

      db.home.expense +=
        amount;

      db.home.logs.push({

        id: makeId(),

        type:
          "expense",

        amount,

        note:
          "🌾 கொல்லை • " +
          note,

        farmId:
          item.id,

        date:
          item.date
      });
    }


    db.farm.total =
      farmTotal();


    db.lastAction = {

      target:
        "farm",

      id:
        item.id,

      source,

      amount
    };


    saveDB(true);


    return (
      "🌾 " +
      note +
      " " +
      money(amount) +
      " கொல்லை செலவாக பதிவு செய்துவிட்டேன். " +
      sourceName(source) +
      " கணக்கிலிருந்து கழித்துவிட்டேன். " +
      "மொத்த கொல்லை செலவு " +
      money(
        farmTotal()
      ) +
      "."
    );
  }


  /* -------------------------
     SALARY INCOME
     ------------------------- */

  if (
    amount > 0 &&
    /சம்பளம் வந்தது|சம்பளம் வந்த|சம்பளம் வரவு|சம்பள பணம் வந்த/.test(
      s
    )
  ) {

    const item = {

      id: makeId(),

      type:
        "income",

      amount,

      note:
        "சம்பளம் வந்தது",

      date:
        getDateTime()
    };


    db.salary.logs.push(
      item
    );

    db.salary.income +=
      amount;


    db.lastAction = {

      target:
        "salary",

      id:
        item.id,

      type:
        "income",

      amount
    };


    saveDB(true);


    return (
      "💵 சம்பள வரவு " +
      money(amount) +
      " பதிவு செய்துவிட்டேன். " +
      "சம்பள பணம் மீதி " +
      money(
        salaryBalance()
      ) +
      "."
    );
  }


  /* -------------------------
     INTEREST / LOAN
     ------------------------- */

  if (
    /வட்டி|கடன்|அசல்/.test(s) &&
    amount > 0
  ) {

    let rate = 2;


    if (
      /3\s*பைசா|3\s*%|மூன்று\s*பைசா|மூணு\s*பைசா/.test(
        s
      )
    ) {

      rate = 3;

    } else if (
      /2\s*பைசா|2\s*%|இரண்டு\s*பைசா|ரெண்டு\s*பைசா/.test(
        s
      )
    ) {

      rate = 2;

    } else if (
      /1\s*பைசா|1\s*%|ஒரு\s*பைசா/.test(
        s
      )
    ) {

      rate = 1;
    }


    const cleaned =
      s
        .replace(
          /வட்டி|கடன்|அசல்|கணக்கு|சேர்|சேர்த்து|வாங்கி|இருக்கிறார்|இருக்கிறான்/g,
          ""
        )
        .trim();


    const words =
      cleaned
        .split(/\s+/)
        .filter(Boolean);


    let name =
      words[0] ||
      "பெயர் தெரியவில்லை";


    if (
      /^\d/.test(name)
    ) {

      name =
        "பெயர் தெரியவில்லை";
    }


    const loan = {

      id: makeId(),

      name,

      amount,

      paid: 0,

      rate,

      payments: [],

      date:
        getDateTime()
    };


    db.loans.push(
      loan
    );


    db.lastAction = {

      target:
        "loan",

      id:
        loan.id
    };


    saveDB(true);


    return (
      name +
      " பெயரில் " +
      money(amount) +
      " அசல், " +
      rate +
      "% மாத வட்டி கணக்கில் சேர்த்துவிட்டேன். " +
      "மாத வட்டி " +
      money(
        loanInterest(loan)
      ) +
      "."
    );
  }


  /* -------------------------
     REMINDER
     ------------------------- */

  if (
    /நாளைக்கு|இன்று|நினைவூட்டு|கால் பண்ணு|கால் பண்ண|ஞாபகப்படுத்து|நினைவூட்டல்/.test(
      s
    )
  ) {

    return createReminderFromText(
      s
    );
  }


  /* -------------------------
     GENERAL EXPENSE
     ------------------------- */

  if (
    amount > 0 &&
    /செலவு|செலவானது|செலவாச்சு|வாங்கினேன்|வாங்குனேன்|போட்டேன்|கொடுத்தேன்/.test(
      s
    )
  ) {

    let source =
      detectSource(
        s
      );


    if (!source) {
      source = "home";
    }


    const note =
      s
        .replace(
          /\d[\d,]*/g,
          ""
        )
        .replace(
          /செலவு|செலவானது|செலவாச்சு|ரூபாய்|ரூ|₹/g,
          ""
        )
        .trim() ||
      "செலவு";


    const item = {

      id: makeId(),

      amount,

      note,

      source,

      date:
        getDateTime()
    };


    db.expenses.logs.push(
      item
    );


    if (
      source === "salary"
    ) {

      db.salary.expense +=
        amount;

    } else {

      db.home.expense +=
        amount;
    }


    db.lastAction = {

      target:
        "expense",

      id:
        item.id
    };


    saveDB(true);


    return (
      money(amount) +
      " செலவு பதிவு செய்துவிட்டேன். " +
      sourceName(source) +
      " கணக்கிலிருந்து கழித்துவிட்டேன்."
    );
  }


  /* -------------------------
     BALANCE SUMMARY
     ------------------------- */

  if (
    /கணக்கு|balance|மொத்தம்|மீதி/.test(
      s
    )
  ) {

    return (
      "📊 கணக்கு நிலவரம்:\n\n" +
      "💵 சம்பள பணம்: " +
      money(
        salaryBalance()
      ) +
      "\n" +
      "🏠 வீட்டு பணம்: " +
      money(
        homeBalance()
      ) +
      "\n" +
      "🌾 மொத்த கொல்லை செலவு: " +
      money(
        farmTotal()
      )
    );
  }


  return (
    "புரிந்துகொண்டேன். " +
    "பணம் அல்லது செலவு என்றால் தொகையுடன் சொல்லுங்கள்.\n\n" +
    "உதாரணம்:\n" +
    "• சம்பளம் வந்தது 20000\n" +
    "• வீட்டிலிருந்து பணம் 30000\n" +
    "• சம்பள பணத்தில் இருந்து கொல்லைக்கு மருந்து 500\n" +
    "• வீட்டு பணத்தில் இருந்து கொல்லைக்கு உரம் 2000\n" +
    "• நாளைக்கு காலை 8 மணிக்கு கார்த்திக்கு கால் பண்ணு"
  );
}


/* =========================================================
   REMINDER FROM NATURAL LANGUAGE
   ========================================================= */

function createReminderFromText(
  text
) {

  let date =
    todayISO();


  if (
    /நாளைக்கு/.test(text)
  ) {

    const d =
      new Date();

    d.setDate(
      d.getDate() + 1
    );

    const y =
      d.getFullYear();

    const m =
      String(
        d.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        d.getDate()
      ).padStart(2, "0");

    date =
      `${y}-${m}-${day}`;
  }


  let hour =
    8;

  let minute =
    0;


  const timeMatch =
    text.match(
      /(\d{1,2})(?::(\d{1,2}))?\s*மணி/
    );


  if (timeMatch) {

    hour =
      Number(
        timeMatch[1]
      );

    minute =
      Number(
        timeMatch[2] ||
        0
      );
  }


  if (
    /மாலை|இரவு/.test(text) &&
    hour < 12
  ) {

    hour += 12;
  }


  if (
    /காலை/.test(text) &&
    hour === 12
  ) {

    hour = 0;
  }


  const time =
    String(hour).padStart(2, "0") +
    ":" +
    String(minute).padStart(2, "0");


  let reminderText =
    text
      .replace(
        /நாளைக்கு|இன்று|காலை|மாலை|இரவு/g,
        ""
      )
      .replace(
        /\d{1,2}(?::\d{1,2})?\s*மணி/g,
        ""
      )
      .trim();


  if (
    reminderText === ""
  ) {

    reminderText =
      "குறிப்பிட்ட வேலை";
  }


  const item = {

    id: makeId(),

    text:
      reminderText,

    date,

    time,

    early: 0,

    notified: false,

    done: false,

    created:
      getDateTime()
  };


  db.reminders.push(
    item
  );


  saveDB(true);

  scheduleAllReminders();


  return (
    "⏰ சரி. " +
    date +
    " " +
    time +
    " மணிக்கு " +
    reminderText +
    " என்று நினைவூட்டல் பதிவு செய்துவிட்டேன்."
  );
}


/* =========================================================
   UNDO
   ========================================================= */

function undoLast() {

  const action =
    db.lastAction;


  if (!action) {
    return;
  }


  if (
    action.target ===
    "salary"
  ) {

    const index =
      db.salary.logs.findIndex(
        x =>
          Number(x.id) ===
          Number(action.id)
      );


    if (index >= 0) {

      const item =
        db.salary.logs[index];


      if (
        item.type ===
        "income"
      ) {

        db.salary.income -=
          num(item.amount);

      } else {

        db.salary.expense -=
          num(item.amount);
      }


      db.salary.logs.splice(
        index,
        1
      );
    }

  } else if (
    action.target ===
    "home"
  ) {

    const index =
      db.home.logs.findIndex(
        x =>
          Number(x.id) ===
          Number(action.id)
      );


    if (index >= 0) {

      const item =
        db.home.logs[index];


      if (
        item.type ===
        "income"
      ) {

        db.home.income -=
          num(item.amount);

      } else {

        db.home.expense -=
          num(item.amount);
      }


      db.home.logs.splice(
        index,
        1
      );
    }

  } else if (
    action.target ===
    "farm"
  ) {

    deleteFarm(
      action.id
    );

    db.lastAction =
      null;

    return;

  } else if (
    action.target ===
    "expense"
  ) {

    deleteExpense(
      action.id
    );

    db.lastAction =
      null;

    return;

  } else if (
    action.target ===
    "loan"
  ) {

    const index =
      db.loans.findIndex(
        x =>
          Number(x.id) ===
          Number(action.id)
      );


    if (index >= 0) {

      db.loans.splice(
        index,
        1
      );
    }
  }


  db.lastAction =
    null;


  saveDB(true);
}


/* =========================================================
   RENDER SALARY
   ========================================================= */

function renderSalary() {

  const balance =
    salaryBalance();


  setText(
    "salBal",
    Math.round(
      balance
    ).toLocaleString(
      "en-IN"
    )
  );


  setText(
    "salaryBalance",
    money(balance)
  );


  const list =
    el("salaryList") ||
    el("salList");


  if (!list) {
    return;
  }


  if (
    !db.salary.logs.length
  ) {

    list.innerHTML =
      `<div class="empty">
        சம்பள பதிவு இல்லை
      </div>`;

    return;
  }


  list.innerHTML =
    db.salary.logs
      .slice()
      .reverse()
      .map(
        item => `

          <div class="record">

            <div>

              <b>
                ${
                  item.type ===
                  "income"
                    ? "🟢 வரவு "
                    : "🔴 செலவு "
                }

                ${money(
                  item.amount
                )}
              </b>

              <small>
                ${escapeHTML(
                  item.note
                )}
                <br>
                ${escapeHTML(
                  item.date
                )}
              </small>

            </div>

            <button
              class="delete"
              onclick="deleteSalary(${item.id})">
              அழி
            </button>

          </div>

        `
      )
      .join("");
}


/* =========================================================
   RENDER HOME
   ========================================================= */

function renderHomeAccount() {

  const balance =
    homeBalance();


  setText(
    "homeBal",
    Math.round(
      balance
    ).toLocaleString(
      "en-IN"
    )
  );


  setText(
    "homeIn",
    Math.round(
      db.home.income
    ).toLocaleString(
      "en-IN"
    )
  );


  setText(
    "homeOut",
    Math.round(
      db.home.expense
    ).toLocaleString(
      "en-IN"
    )
  );


  setText(
    "homeBalance",
    money(balance)
  );


  const list =
    el("homeList") ||
    el("homeLogs");


  if (!list) {
    return;
  }


  if (
    !db.home.logs.length
  ) {

    list.innerHTML =
      `<div class="empty">
        வீட்டு பதிவு இல்லை
      </div>`;

    return;
  }


  list.innerHTML =
    db.home.logs
      .slice()
      .reverse()
      .map(
        item => `

          <div class="record">

            <div>

              <b>
                ${
                  item.type ===
                  "income"
                    ? "🟢 வரவு "
                    : "🔴 செலவு "
                }

                ${money(
                  item.amount
                )}
              </b>

              <small>
                ${escapeHTML(
                  item.note
                )}
                <br>
                ${escapeHTML(
                  item.date
                )}
              </small>

            </div>

            <button
              class="delete"
              onclick="deleteHome(${item.id})">
              அழி
            </button>

          </div>

        `
      )
      .join("");
}


/* =========================================================
   RENDER FARM
   ========================================================= */

function renderFarm() {

  setText(
    "farmTotal",
    Math.round(
      farmTotal()
    ).toLocaleString(
      "en-IN"
    )
  );


  const list =
    el("farmList") ||
    el("farmLogs");


  if (!list) {
    return;
  }


  if (
    !db.farm.logs.length
  ) {

    list.innerHTML =
      `<div class="empty">
        கொல்லை செலவு இல்லை
      </div>`;

    return;
  }


  list.innerHTML =
    db.farm.logs
      .slice()
      .reverse()
      .map(
        item => `

          <div class="record">

            <div>

              <b>
                🌾 ${escapeHTML(
                  item.note
                )}
                ₹${Math.round(
                  item.amount
                ).toLocaleString(
                  "en-IN"
                )}
              </b>

              <small>
                ${
                  sourceName(
                    item.source
                  )
                }

                <br>

                ${escapeHTML(
                  item.date
                )}
              </small>

            </div>

            <button
              class="delete"
              onclick="deleteFarm(${item.id})">
              அழி
            </button>

          </div>

        `
      )
      .join("");
}


/* =========================================================
   RENDER EXPENSES
   ========================================================= */

function renderExpenses() {

  const list =
    el("expenseList") ||
    el("expensesList");


  if (!list) {
    return;
  }


  if (
    !db.expenses.logs.length
  ) {

    list.innerHTML =
      `<div class="empty">
        செலவு பதிவு இல்லை
      </div>`;

    return;
  }


  list.innerHTML =
    db.expenses.logs
      .slice()
      .reverse()
      .map(
        item => `

          <div class="record">

            <div>

              <b>
                🔴 ${escapeHTML(
                  item.note
                )}
                ${money(
                  item.amount
                )}
              </b>

              <small>
                ${sourceName(
                  item.source
                )}
                <br>
                ${escapeHTML(
                  item.date
                )}
              </small>

            </div>

            <button
              class="delete"
              onclick="deleteExpense(${item.id})">
              அழி
            </button>

          </div>

        `
      )
      .join("");
}


/* =========================================================
   RENDER LOANS
   ========================================================= */

function renderLoans() {

  const list =
    el("loanList");


  if (!list) {
    return;
  }


  if (
    !db.loans.length
  ) {

    list.innerHTML =
      `<div class="empty">
        Loan Account இல்லை
      </div>`;

    return;
  }


  const grouped = {};


  db.loans.forEach(
    loan => {

      const key =
        String(
          loan.name ||
          "பெயர் தெரியவில்லை"
        ).trim();


      if (
        !grouped[key]
      ) {

        grouped[key] = [];
      }


      grouped[key].push(
        loan
      );
    }
  );


  list.innerHTML =
    Object.keys(grouped)
      .map(
        name => {

          const loans =
            grouped[name];


          const total =
            loans.reduce(
              (
                sum,
                loan
              ) =>
                sum +
                loanRemaining(
                  loan
                ),
              0
            );


          const interest =
            loans.reduce(
              (
                sum,
                loan
              ) =>
                sum +
                loanInterest(
                  loan
                ),
              0
            );


          return `

            <div class="loan-person">

              <div class="loan-person-header">

                <h3>
                  ${escapeHTML(
                    name
                  )}
                </h3>

                <div class="loan-person-summary">

                  அசல் மீதி:
                  <b>
                    ${money(total)}
                  </b>

                  <br>

                  மாத வட்டி:
                  <b>
                    ${money(interest)}
                  </b>

                </div>

              </div>


              ${loans
                .map(
                  loan => `

                    <div class="loan-account">

                      <div class="loan-account-header">

                        <b>
                          ${money(
                            loan.amount
                          )}
                          @
                          ${loan.rate}%
                        </b>

                        <span>
                          ${escapeHTML(
                            loan.date
                          )}
                        </span>

                      </div>


                      <div class="loan-account-body">

                        <div class="loan-row">

                          <span>
                            அசல்
                          </span>

                          <b>
                            ${money(
                              loan.amount
                            )}
                          </b>

                        </div>


                        <div class="loan-row">

                          <span>
                            திருப்பியது
                          </span>

                          <b>
                            ${money(
                              loan.paid || 0
                            )}
                          </b>

                        </div>


                        <div class="loan-row">

                          <span>
                            மீதி
                          </span>

                          <b>
                            ${money(
                              loanRemaining(
                                loan
                              )
                            )}
                          </b>

                        </div>


                        <div class="loan-row">

                          <span>
                            மாத வட்டி
                          </span>

                          <b>
                            ${money(
                              loanInterest(
                                loan
                              )
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
                )
                .join("")}

            </div>

          `;
        }
      )
      .join("");
}


/* =========================================================
   RENDER NOTES
   ========================================================= */

function renderNotes() {

  const temp =
    el("tempList");


  const perm =
    el("permList");


  if (temp) {

    temp.innerHTML =
      db.notes.temp.length
        ?

        db.notes.temp
          .map(
            item => `

              <div class="record">

                <div>

                  <b>
                    ${escapeHTML(
                      item.text
                    )}
                  </b>

                  <small>
                    ${escapeHTML(
                      item.date
                    )}
                  </small>

                </div>

                <button
                  class="delete"
                  onclick="deleteNote('temp',${item.id})">
                  அழி
                </button>

              </div>

            `
          )
          .join("")

        :

        `<div class="empty">
          தற்காலிக குறிப்பு இல்லை
        </div>`;
  }


  if (perm) {

    perm.innerHTML =
      db.notes.perm.length
        ?

        db.notes.perm
          .map(
            item => `

              <div class="record">

                <div>

                  <b>
                    ${escapeHTML(
                      item.text
                    )}
                  </b>

                  <small>
                    ${escapeHTML(
                      item.date
                    )}
                  </small>

                </div>

                <button
                  class="delete"
                  onclick="deleteNote('perm',${item.id})">
                  அழி
                </button>

              </div>

            `
          )
          .join("")

        :

        `<div class="empty">
          நிரந்தர குறிப்பு இல்லை
        </div>`;
  }
}


/* =========================================================
   RENDER REMINDERS
   ========================================================= */

function renderReminders() {

  const list =
    el("reminderList");


  if (!list) {
    return;
  }


  if (
    !db.reminders.length
  ) {

    list.innerHTML =
      `<div class="empty">
        நினைவூட்டல் இல்லை
      </div>`;

    return;
  }


  const now =
    new Date();


  list.innerHTML =
    db.reminders
      .slice()
      .sort(
        (
          a,
          b
        ) => {

          const ta =
            reminderTarget(a);

          const tb =
            reminderTarget(b);


          if (
            !ta ||
            !tb
          ) {
            return 0;
          }


          return (
            ta.getTime() -
            tb.getTime()
          );
        }
      )
      .map(
        item => {

          const target =
            reminderTarget(
              item
            );


          const due =
            target &&
            target <= now &&
            !item.done;


          const completed =
            item.done;


          return `

            <div class="record ${
              completed
                ? "reminder-done"
                : due
                  ? "reminder-due"
                  : "reminder-ok"
            }">

              <div>

                <b>

                  ${
                    completed
                      ? "✅"
                      : due
                        ? "🔴"
                        : "⏰"
                  }

                  ${escapeHTML(
                    item.text
                  )}

                </b>

                <small>

                  📅 ${escapeHTML(
                    item.date
                  )}

                  ⏰ ${escapeHTML(
                    item.time
                  )}

                  <br>

                  ${
                    Number(
                      item.early ||
                      0
                    )
                  }
                  நிமிடம் முன்

                  ${
                    item.notified
                      ? " • 🔔 அறிவிக்கப்பட்டது"
                      : ""
                  }

                </small>

              </div>


              <div
                style="
                  display:flex;
                  gap:6px;
                  flex-wrap:wrap;
                "
              >

                ${
                  completed

                    ?

                    `

                      <button
                        class="green"
                        onclick="resetReminder(${item.id})">
                        மீண்டும்
                      </button>

                    `

                    :

                    `

                      <button
                        class="green"
                        onclick="completeReminder(${item.id})">
                        முடிந்தது
                      </button>

                    `
                }


                <button
                  class="delete"
                  onclick="deleteReminder(${item.id})">
                  அழி
                </button>

              </div>

            </div>

          `;
        }
      )
      .join("");
}


/* =========================================================
   RENDER HOME / DASHBOARD
   ========================================================= */

function renderHome() {

  /*
     Some HTML versions use
     dashboard balance IDs.
  */

  setText(
    "dashboardSalary",
    money(
      salaryBalance()
    )
  );


  setText(
    "dashboardHome",
    money(
      homeBalance()
    )
  );


  setText(
    "dashboardFarm",
    money(
      farmTotal()
    )
  );
}


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {

  if (!db) {
    return;
  }


  try {
    renderHome();
  } catch (e) {
    console.error(
      "renderHome:",
      e
    );
  }


  try {
    renderSalary();
  } catch (e) {
    console.error(
      "renderSalary:",
      e
    );
  }


  try {
    renderHomeAccount();
  } catch (e) {
    console.error(
      "renderHomeAccount:",
      e
    );
  }


  try {
    renderFarm();
  } catch (e) {
    console.error(
      "renderFarm:",
      e
    );
  }


  try {
    renderExpenses();
  } catch (e) {
    console.error(
      "renderExpenses:",
      e
    );
  }


  try {
    renderLoans();
  } catch (e) {
    console.error(
      "renderLoans:",
      e
    );
  }


  try {
    renderNotes();
  } catch (e) {
    console.error(
      "renderNotes:",
      e
    );
  }


  try {
    renderReminders();
  } catch (e) {
    console.error(
      "renderReminders:",
      e
    );
  }


  try {
    renderChat();
  } catch (e) {
    console.error(
      "renderChat:",
      e
    );
  }
}


/* =========================================================
   PAGE / TAB
   ========================================================= */

function showPage(
  page
) {

  /*
     Support several possible
     HTML naming styles.
  */

  const cards =
    document.querySelectorAll(
      "[data-page]"
    );


  cards.forEach(
    card => {

      card.classList.toggle(
        "active",
        card.dataset.page ===
        page
      );
    }
  );


  const sections =
    document.querySelectorAll(
      ".page, .app-page, .tab-card"
    );


  sections.forEach(
    section => {

      const id =
        section.id ||
        "";


      if (
        id
      ) {

        const clean =
          id
            .replace(
              /^page-/,
              ""
            )
            .replace(
              /^tab-/,
              ""
            );


        if (
          clean
        ) {

          section.style.display =
            (
              clean ===
              page
            )
              ? ""
              : "none";
        }
      }
    }
  );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeJacky() {

  try {

    loadDB();

  } catch (error) {

    console.error(
      "loadDB failed:",
      error
    );

    db =
      cloneDefaultDB();
  }


  try {

    renderAll();

  } catch (error) {

    console.error(
      "renderAll failed:",
      error
    );
  }


  try {

    scheduleAllReminders();

  } catch (error) {

    console.error(
      "schedule reminders failed:",
      error
    );
  }


  try {

    checkReminders();

  } catch (error) {

    console.error(
      "check reminders failed:",
      error
    );
  }


  /*
     IMPORTANT:
     Never allow one failed function
     to stop the entire app.
  */

  setInterval(
    function() {

      try {
        checkReminders();
      } catch (e) {
        console.error(e);
      }

    },
    15000
  );


  setInterval(
    function() {

      try {
        renderReminders();
      } catch (e) {
        console.error(e);
      }

    },
    15000
  );


  document.addEventListener(
    "visibilitychange",
    function() {

      if (
        document.visibilityState ===
        "visible"
      ) {

        try {
          checkReminders();
          renderReminders();
        } catch (e) {
          console.error(e);
        }
      }
    }
  );


  window.addEventListener(
    "focus",
    function() {

      try {
        checkReminders();
        renderReminders();
      } catch (e) {
        console.error(e);
      }
    }
  );


  const reminderDate =
    el("reminderDate");


  if (
    reminderDate &&
    !reminderDate.value
  ) {

    reminderDate.value =
      todayISO();
  }


  console.log(
    "🎙️ JACKY SMART PA READY"
  );
}


/* =========================================================
   GLOBAL ERROR PROTECTION
   ========================================================= */

window.addEventListener(
  "error",
  function(event) {

    console.error(
      "Jacky runtime error:",
      event.message,
      event.filename,
      event.lineno
    );

  }
);


window.addEventListener(
  "unhandledrejection",
  function(event) {

    console.error(
      "Jacky promise error:",
      event.reason
    );

  }
);


/* =========================================================
   EXPORT GLOBAL FUNCTIONS
   ========================================================= */

window.showPage =
  showPage;

window.addSalary =
  addSalary;

window.deleteSalary =
  deleteSalary;

window.addHome =
  addHome;

window.deleteHome =
  deleteHome;

window.addFarm =
  addFarm;

window.deleteFarm =
  deleteFarm;

window.addExpenseManual =
  addExpenseManual;

window.deleteExpense =
  deleteExpense;

window.addLoan =
  addLoan;

window.addLoanPayment =
  addLoanPayment;

window.deleteLoan =
  deleteLoan;

window.addNote =
  addNote;

window.deleteNote =
  deleteNote;

window.clearTemporary =
  clearTemporary;

window.addReminder =
  addReminder;

window.deleteReminder =
  deleteReminder;

window.completeReminder =
  completeReminder;

window.resetReminder =
  resetReminder;

window.sendMessage =
  sendMessage;

window.sendPrompt =
  sendPrompt;

window.clearChat =
  clearChat;

window.startListening =
  startListening;

window.stopListening =
  stopListening;

window.undoLast =
  undoLast;

window.checkReminders =
  checkReminders;

window.testReminder =
  function() {

    const item = {

      id: makeId(),

      text:
        "இது சோதனை நினைவூட்டல்",

      date:
        todayISO(),

      time:
        new Date()
          .toTimeString()
          .slice(0, 5),

      early: 0,

      notified: false,

      done: false
    };


    notifyReminder(
      item
    );
  };


/* =========================================================
   START
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeJacky
  );

} else {

  initializeJacky();
}
