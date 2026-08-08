/* =========================================================
   🎙️ JACKY SMART PA
   APP.JS - COMPLETE VERSION
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const DB_KEY = "balaji_pa_db_v12";


/* =========================================================
   DEFAULT DATABASE
========================================================= */

function defaultDB() {

  return {

    version: 12,

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

    /*
       கொல்லைக்கு INCOME கிடையாது.
       EXPENSE மட்டும்.
       ஒவ்வொரு செலவும் salary/home source-ல் இருந்து.
    */

    farm: {
      expense: 0,
      logs: []
    },

    /*
       பொதுவான செலவுகள்.
       கொல்லை செலவு இதில் சேராது.
    */

    expenses: [],

    loans: [],

    notes: {
      temp: [],
      perm: []
    },

    reminders: [],

    lastAction: null

  };

}


let db = defaultDB();


/* =========================================================
   SAFE NUMBER
========================================================= */

function num(value) {

  const n = Number(value);

  return Number.isFinite(n) ? n : 0;

}


/* =========================================================
   MONEY
========================================================= */

function money(value) {

  return "₹" +
    Math.round(num(value))
      .toLocaleString("en-IN");

}


/* =========================================================
   ID
========================================================= */

function makeId() {

  return Date.now() +
    Math.floor(
      Math.random() * 100000
    );

}


/* =========================================================
   DATE / TIME
========================================================= */

function todayISO() {

  const d = new Date();

  const y = d.getFullYear();

  const m = String(
    d.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    d.getDate()
  ).padStart(2, "0");

  return `${y}-${m}-${day}`;

}


function tomorrowISO() {

  const d = new Date();

  d.setDate(
    d.getDate() + 1
  );

  const y = d.getFullYear();

  const m = String(
    d.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    d.getDate()
  ).padStart(2, "0");

  return `${y}-${m}-${day}`;

}


function nowText() {

  const d = new Date();

  return d.toLocaleString(
    "ta-IN",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


/* =========================================================
   SAVE DB
========================================================= */

function saveDB() {

  try {

    localStorage.setItem(
      DB_KEY,
      JSON.stringify(db)
    );

  } catch (e) {

    console.error(
      "Save DB error:",
      e
    );

  }

  renderAll();

}


/* =========================================================
   LOAD DB
========================================================= */

function loadDB() {

  try {

    const raw =
      localStorage.getItem(
        DB_KEY
      );

    if (!raw) {

      db = defaultDB();

      return;

    }

    const saved =
      JSON.parse(raw);


    /*
       Old database இருந்தாலும்
       missing fields சேர்க்கப்படும்.
    */

    const base =
      defaultDB();


    db = {

      ...base,
      ...saved,

      salary: {
        ...base.salary,
        ...(saved.salary || {})
      },

      home: {
        ...base.home,
        ...(saved.home || {})
      },

      farm: {
        ...base.farm,
        ...(saved.farm || {})
      },

      notes: {
        ...base.notes,
        ...(saved.notes || {})
      },

      expenses:
        Array.isArray(saved.expenses)
          ? saved.expenses
          : [],

      loans:
        Array.isArray(saved.loans)
          ? saved.loans
          : [],

      reminders:
        Array.isArray(saved.reminders)
          ? saved.reminders
          : []

    };


    migrateOldData();


    saveRawOnly();

  } catch (e) {

    console.error(
      "Load DB error:",
      e
    );

    db = defaultDB();

  }

}


/* =========================================================
   RAW SAVE
========================================================= */

function saveRawOnly() {

  try {

    localStorage.setItem(
      DB_KEY,
      JSON.stringify(db)
    );

  } catch (e) {}

}


/* =========================================================
   OLD DATA MIGRATION
========================================================= */

function migrateOldData() {

  /*
     Farm old version-ல் income இருந்தால்
     அது பயன்படுத்தப்படாது.
  */

  if (!db.farm) {

    db.farm = {
      expense: 0,
      logs: []
    };

  }


  /*
     பழைய farm logs இருந்தால்
     amount சரி செய்யவும்.
  */

  if (
    !Array.isArray(
      db.farm.logs
    )
  ) {

    db.farm.logs = [];

  }


  db.farm.logs =
    db.farm.logs.map(
      item => ({

        ...item,

        id:
          item.id ||
          makeId(),

        amount:
          num(
            item.amount ??
            item.amt
          ),

        source:
          item.source === "salary"
            ? "salary"
            : "home",

        type: "expense"

      })
    );


  db.farm.expense =
    db.farm.logs.reduce(
      (sum, item) =>
        sum + num(item.amount),
      0
    );


  /*
     Salary
  */

  db.salary.income =
    num(db.salary.income);

  db.salary.expense =
    num(db.salary.expense);

  db.salary.logs =
    Array.isArray(db.salary.logs)
      ? db.salary.logs
      : [];


  /*
     Home
  */

  db.home.income =
    num(db.home.income);

  db.home.expense =
    num(db.home.expense);

  db.home.logs =
    Array.isArray(db.home.logs)
      ? db.home.logs
      : [];


  /*
     Loans
  */

  db.loans =
    Array.isArray(db.loans)
      ? db.loans
      : [];


  db.loans =
    db.loans.map(
      loan => ({

        ...loan,

        id:
          loan.id ||
          makeId(),

        name:
          loan.name ||
          "பெயர் தெரியவில்லை",

        amount:
          num(
            loan.amount ??
            loan.amt
          ),

        rate:
          parseRateValue(
            loan.rate
          ),

        paid:
          num(loan.paid),

        payments:
          Array.isArray(
            loan.payments
          )
            ? loan.payments
            : [],

        date:
          loan.date ||
          todayISO()

      })
    );


  /*
     Notes
  */

  if (!db.notes) {

    db.notes = {
      temp: [],
      perm: []
    };

  }

  db.notes.temp =
    Array.isArray(db.notes.temp)
      ? db.notes.temp
      : [];

  db.notes.perm =
    Array.isArray(db.notes.perm)
      ? db.notes.perm
      : [];


  /*
     Reminders
  */

  db.reminders =
    Array.isArray(
      db.reminders
    )
      ? db.reminders
      : [];

}


/* =========================================================
   BALANCE
========================================================= */

function balance(account) {

  if (
    account === "salary"
  ) {

    return Math.max(
      0,
      num(db.salary.income) -
      num(db.salary.expense)
    );

  }


  if (
    account === "home"
  ) {

    return Math.max(
      0,
      num(db.home.income) -
      num(db.home.expense)
    );

  }


  /*
     Farm-க்கு balance இல்லை.
     Farm = expense tracking மட்டும்.
  */

  if (
    account === "farm"
  ) {

    return 0;

  }


  return 0;

}


/* =========================================================
   SOURCE TAMIL
========================================================= */

function sourceTamil(source) {

  if (
    source === "salary"
  ) {

    return "💵 சம்பள பணம்";

  }

  return "🏠 வீட்டு பணம்";

}


/* =========================================================
   TEXT NORMALIZE
========================================================= */

function normalizeTamil(text) {

  return String(text || "")
    .toLowerCase()
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}


/* =========================================================
   AMOUNT PARSER
========================================================= */

function parseAmount(text) {

  const original =
    String(text || "");

  const t =
    normalizeTamil(original);


  /*
     50,000 / 50000 / ₹50000
  */

  const commaMatch =
    original.match(
      /(?:₹\s*)?(\d[\d,]*)/
    );


  let numeric = 0;


  if (commaMatch) {

    numeric =
      Number(
        commaMatch[1]
          .replace(/,/g, "")
      );

  }


  /*
     தமிழ் எண் சொற்கள்
  */

  const wordAmounts = [

    {
      words: [
        "ஐம்பதாயிரம்",
        "ஐம்பதாயிர",
        "50 ஆயிரம்"
      ],
      value: 50000
    },

    {
      words: [
        "நாற்பதாயிரம்",
        "நாற்பதாயிர",
        "40 ஆயிரம்"
      ],
      value: 40000
    },

    {
      words: [
        "முப்பதாயிரம்",
        "முப்பதாயிர",
        "30 ஆயிரம்"
      ],
      value: 30000
    },

    {
      words: [
        "இருபதாயிரம்",
        "இருபதாயிர",
        "20 ஆயிரம்"
      ],
      value: 20000
    },

    {
      words: [
        "பத்தாயிரம்",
        "பத்தாயிர",
        "10 ஆயிரம்"
      ],
      value: 10000
    },

    {
      words: [
        "ஐந்தாயிரம்",
        "ஐந்தாயிர",
        "5 ஆயிரம்"
      ],
      value: 5000
    },

    {
      words: [
        "ஆயிரம்"
      ],
      value: 1000
    },

    {
      words: [
        "லட்சம்",
        "லட்ச"
      ],
      value: 100000

    }

  ];


  let wordAmount = 0;


  for (
    const item of wordAmounts
  ) {

    for (
      const word of item.words
    ) {

      if (
        t.includes(
          word.toLowerCase()
        )
      ) {

        /*
           "2 ஆயிரம்" போன்றது
        */

        const before =
          t.match(
            /(\d+(?:\.\d+)?)\s*(?:ஆயிரம்|லட்சம்|லட்ச)/
          );


        if (
          before
        ) {

          const n =
            Number(
              before[1]
            );


          if (
            t.includes("லட்ச")
          ) {

            wordAmount =
              n * 100000;

          } else {

            wordAmount =
              n * 1000;

          }

        } else {

          wordAmount =
            item.value;

        }

        break;

      }

    }

    if (
      wordAmount > 0
    ) {

      break;

    }

  }


  return Math.max(
    numeric,
    wordAmount
  );

}


/* =========================================================
   RATE PARSER
========================================================= */

function parseRateValue(value) {

  const n =
    Number(value);

  if (
    Number.isFinite(n) &&
    n > 0
  ) {

    return n;

  }

  return 2;

}


function parseRate(text) {

  const original =
    String(text || "");

  const t =
    normalizeTamil(original);


  /*
     2.5%
     2.5 சதவீதம்
     2.5 பைசா
  */

  const decimal =
    t.match(
      /(\d+(?:\.\d+)?)\s*(?:%|சதவீதம்|சதவீத|பைசா)/
    );


  if (decimal) {

    const n =
      Number(
        decimal[1]
      );

    if (
      n > 0 &&
      n <= 100
    ) {

      return n;

    }

  }


  /*
     தமிழ்:
     ஒரு பைசா = 1
     இரண்டு பைசா = 2
     மூன்று பைசா = 3
  */

  if (
    t.includes("மூன்று பைசா") ||
    t.includes("மூணு பைசா") ||
    t.includes("மூன்று சதவீத")
  ) {

    return 3;

  }


  if (
    t.includes("இரண்டு பைசா") ||
    t.includes("ரெண்டு பைசா") ||
    t.includes("இரண்டு சதவீத")
  ) {

    return 2;

  }


  if (
    t.includes("ஒரு பைசா") ||
    t.includes("ஒன்று பைசா") ||
    t.includes("ஒரு சதவீத")
  ) {

    return 1;

  }


  /*
     "3 வட்டி", "2 வட்டி"
  */

  const rateNumber =
    t.match(
      /(\d+(?:\.\d+)?)\s*(?:வட்டி|interest)/
    );


  if (rateNumber) {

    const n =
      Number(
        rateNumber[1]
      );

    if (
      n > 0 &&
      n <= 100
    ) {

      return n;

    }

  }


  /*
     Explicit % இல்லாமல்
     loan message-ல் 1 / 2 / 3
  */

  if (
    /\b3\b/.test(t)
  ) {

    return 3;

  }

  if (
    /\b2\b/.test(t)
  ) {

    return 2;

  }

  if (
    /\b1\b/.test(t)
  ) {

    return 1;

  }


  /*
     Default
  */

  return 2;

}


/* =========================================================
   LOAN CALCULATIONS
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
    parseRateValue(loan.rate)
  ) / 100;

}


/* =========================================================
   PERSON EXTRACTION
========================================================= */

function extractPerson(text) {

  let t =
    String(text || "")
      .trim();


  /*
     "முருகன் கிட்ட 10000 வட்டி"
  */

  const patterns = [

    /(.+?)\s+(?:கிட்ட|கிட்டே|கையில்|கிட்ட இருந்து|இடம்|அவரிடம்)\s+/i,

    /(.+?)\s+(?:வட்டி|கடன்)/i

  ];


  for (
    const pattern of patterns
  ) {

    const match =
      t.match(pattern);

    if (match) {

      let name =
        match[1]
          .trim()
          .replace(
            /^(எனக்கு|நான்|அவருக்கு|அவனுக்கு)\s+/,
            ""
          );


      /*
         Amount before person வராமல் இருக்க
      */

      name =
        name.replace(
          /\d[\d,]*/g,
          ""
        ).trim();


      if (
        name.length >= 1
      ) {

        return name;

      }

    }

  }


  /*
     Loan name input-க்கு first text word
  */

  const cleaned =
    t
      .replace(
        /\d[\d,]*/g,
        " "
      )
      .replace(
        /வட்டி|கடன்|பைசா|சதவீதம்|interest|₹/g,
        " "
      )
      .trim();


  if (
    cleaned
  ) {

    const words =
      cleaned.split(/\s+/);

    if (
      words.length
    ) {

      return words[0];

    }

  }


  return null;

}


/* =========================================================
   INCOME DETECTION
========================================================= */

function isIncomeMessage(text) {

  const t =
    normalizeTamil(text);


  return (

    t.includes("வரவு") ||

    t.includes("வந்தது") ||

    t.includes("வந்துருக்கு") ||

    t.includes("வந்துருச்சு") ||

    t.includes("வந்திருக்கிறது") ||

    t.includes("கொடுத்திருக்காங்க") ||

    t.includes("கொடுத்தாங்க") ||

    t.includes("கொடுத்தார்") ||

    t.includes("கொடுத்தது") ||

    t.includes("பணம் கொடுத்த") ||

    t.includes("பணம் வந்த") ||

    t.includes("சம்பளம் வந்த") ||

    t.includes("சம்பளம் கிடைத்த") ||

    t.includes("சம்பளம் போட்ட") ||

    t.includes("வீட்டிலிருந்து பணம்")

  );

}


/* =========================================================
   EXPENSE DETECTION
========================================================= */

function isExpenseMessage(text) {

  const t =
    normalizeTamil(text);


  const words = [

    "செலவு",

    "வாங்கினேன்",

    "வாங்குனேன்",

    "வாங்கியது",

    "வாங்கிய",

    "போட்டேன்",

    "கொடுத்தேன்",

    "கொடுத்தது",

    "செலவானது",

    "பெட்ரோல்",

    "டீசல்",

    "டீ",

    "காபி",

    "சாப்பாடு",

    "டிபன்",

    "காய்கறி",

    "மருந்து",

    "உரம்",

    "களை",

    "களை எடுத்தது",

    "ஆள் கூலி",

    "கூலி",

    "வண்டி ஓட்டிய",

    "வண்டி",

    "பால்",

    "பணம் கொடுத்தேன்"

  ];


  return words.some(
    word =>
      t.includes(word)
  );

}


/* =========================================================
   SOURCE DETECTION
========================================================= */

function detectSource(text) {

  const t =
    normalizeTamil(text);


  /*
     Salary
  */

  if (
    t.includes("சம்பள பணம்") ||
    t.includes("சம்பளத்தில் இருந்து") ||
    t.includes("சம்பளத்திலிருந்து") ||
    t.includes("சம்பள பணத்தில் இருந்து") ||
    t.includes("சம்பள பணத்திலிருந்து") ||
    t.includes("சம்பளம் பணத்தில்")
  ) {

    return "salary";

  }


  /*
     Home
  */

  if (
    t.includes("வீட்டு பணம்") ||
    t.includes("வீட்டுப் பணம்") ||
    t.includes("வீட்டு பணத்தில்") ||
    t.includes("வீட்டுப் பணத்தில்") ||
    t.includes("வீட்டிலிருந்து")
  ) {

    return "home";

  }


  /*
     Default expense source:
     home
  */

  return "home";

}


/* =========================================================
   EXPENSE NOTE CLEANING
========================================================= */

function cleanExpenseNote(
  text
) {

  let t =
    String(text || "")
      .trim();


  t =
    t.replace(
      /சம்பள பணத்தில் இருந்து/gi,
      ""
    );

  t =
    t.replace(
      /சம்பள பணத்திலிருந்து/gi,
      ""
    );

  t =
    t.replace(
      /சம்பளத்திலிருந்து/gi,
      ""
    );

  t =
    t.replace(
      /வீட்டு பணத்தில் இருந்து/gi,
      ""
    );

  t =
    t.replace(
      /வீட்டுப் பணத்தில் இருந்து/gi,
      ""
    );

  t =
    t.replace(
      /வீட்டு பணத்திலிருந்து/gi,
      ""
    );

  t =
    t.replace(
      /வீட்டிலிருந்து/gi,
      ""
    );


  t =
    t.replace(
      /\d[\d,]*/g,
      ""
    );


  t =
    t.replace(
      /₹/g,
      ""
    );


  t =
    t.replace(
      /\s+/g,
      " "
    )
    .trim();


  /*
     "500 செலவு" போன்ற trailing words
  */

  t =
    t.replace(
      /^(செலவு|செலவுக்கு)\s*/i,
      ""
    );


  return t ||
    "பொதுச் செலவு";

}


/* =========================================================
   ADD SALARY
========================================================= */

function addSalary(type) {

  const amountInput =
    document.getElementById(
      "salaryAmount"
    );

  const noteInput =
    document.getElementById(
      "salaryNote"
    );


  const amount =
    num(
      amountInput?.value
    );


  if (
    amount <= 0
  ) {

    alert(
      "தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  const note =
    noteInput?.value.trim() ||
    (
      type === "in"
        ? "சம்பள வரவு"
        : "சம்பள செலவு"
    );


  const log = {

    id: makeId(),

    type:
      type === "in"
        ? "in"
        : "out",

    amount,

    note,

    date: nowText()

  };


  if (
    type === "in"
  ) {

    db.salary.income +=
      amount;

  } else {

    if (
      amount >
      balance("salary")
    ) {

      alert(
        `சம்பள பணம் போதவில்லை.\nமீதி: ${money(balance("salary"))}`
      );

      return;

    }

    db.salary.expense +=
      amount;

  }


  db.salary.logs.unshift(
    log
  );


  db.lastAction = {

    action: "account",

    account: "salary",

    type:
      type === "in"
        ? "in"
        : "out",

    amount,

    logId: log.id

  };


  if (amountInput) {
    amountInput.value = "";
  }

  if (noteInput) {
    noteInput.value = "";
  }


  saveDB();

}


/* =========================================================
   ADD HOME
========================================================= */

function addHome(type) {

  const amountInput =
    document.getElementById(
      "homeAmount"
    );

  const noteInput =
    document.getElementById(
      "homeNote"
    );


  const amount =
    num(
      amountInput?.value
    );


  if (
    amount <= 0
  ) {

    alert(
      "தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  const note =
    noteInput?.value.trim() ||
    (
      type === "in"
        ? "வீட்டு வரவு"
        : "வீட்டு செலவு"
    );


  const log = {

    id: makeId(),

    type:
      type === "in"
        ? "in"
        : "out",

    amount,

    note,

    date: nowText()

  };


  if (
    type === "in"
  ) {

    /*
       வீட்டு பணம் கொடுத்தால்
       Home income.
    */

    db.home.income +=
      amount;

  } else {

    if (
      amount >
      balance("home")
    ) {

      alert(
        `வீட்டு பணம் போதவில்லை.\nமீதி: ${money(balance("home"))}`
      );

      return;

    }

    db.home.expense +=
      amount;

  }


  db.home.logs.unshift(
    log
  );


  db.lastAction = {

    action: "account",

    account: "home",

    type:
      type === "in"
        ? "in"
        : "out",

    amount,

    logId: log.id

  };


  if (amountInput) {
    amountInput.value = "";
  }

  if (noteInput) {
    noteInput.value = "";
  }


  saveDB();

}


/* =========================================================
   HANDLE NATURAL INCOME
========================================================= */

function handleIncome(text) {

  const t =
    normalizeTamil(text);


  const amount =
    parseAmount(text);


  if (
    amount <= 0
  ) {

    return false;

  }


  /*
     Salary income
  */

  if (
    t.includes("சம்பளம்") ||
    t.includes("சம்பள பணம்")
  ) {

    const log = {

      id: makeId(),

      type: "in",

      amount,

      note: "சம்பள வரவு",

      date: nowText()

    };


    db.salary.income +=
      amount;


    db.salary.logs.unshift(
      log
    );


    db.lastAction = {

      action: "account",

      account: "salary",

      type: "in",

      amount,

      logId: log.id

    };


    saveDB();


    const reply =
      `சம்பள வரவாக ${money(amount)} பதிவு செய்துவிட்டேன். சம்பள மீதி ${money(balance("salary))}.`;

    addAIMessage(reply);
    speakText(reply);

    return true;

  }


  /*
     Home income:
     "வீட்டிலிருந்து 30000 கொடுத்திருக்காங்க"
  */

  if (
    t.includes("வீட்டிலிருந்து") ||
    t.includes("வீட்டில் இருந்து") ||
    t.includes("வீட்டு பணம் வந்த") ||
    t.includes("வீட்டு வரவு") ||
    t.includes("வீட்டிலிருந்து பணம்")
  ) {

    const log = {

      id: makeId(),

      type: "in",

      amount,

      note: "வீட்டிலிருந்து பணம்",

      date: nowText()

    };


    db.home.income +=
      amount;


    db.home.logs.unshift(
      log
    );


    db.lastAction = {

      action: "account",

      account: "home",

      type: "in",

      amount,

      logId: log.id

    };


    saveDB();


    const reply =
      `வீட்டிலிருந்து வந்த ${money(amount)} வீட்டு வரவாக பதிவு செய்துவிட்டேன். வீட்டு மீதி ${money(balance("home"))}.`;

    addAIMessage(reply);
    speakText(reply);

    return true;

  }


  return false;

}


/* =========================================================
   HANDLE EXPENSE
========================================================= */

function handleExpense(text) {

  const t =
    normalizeTamil(text);


  const amount =
    parseAmount(text);


  if (
    amount <= 0
  ) {

    return false;

  }


  /*
     கொல்லை expense
  */

  const isFarm =
    t.includes("கொல்லை") ||
    t.includes("கொள்ளை") ||
    t.includes("வயல்") ||
    t.includes("விவசாய");


  if (
    isFarm
  ) {

    return addFarmNatural(
      text,
      amount
    );

  }


  /*
     General expense
  */

  const source =
    detectSource(text);


  return addExpenseNatural(
    text,
    amount,
    source
  );

}


/* =========================================================
   ADD GENERAL EXPENSE NATURAL
========================================================= */

function addExpenseNatural(
  text,
  amount,
  source
) {

  source =
    source === "salary"
      ? "salary"
      : "home";


  const available =
    balance(source);


  if (
    amount >
    available
  ) {

    const accountName =
      source === "salary"
        ? "சம்பள"
        : "வீட்டு";


    const reply =
      `${accountName} பணம் போதவில்லை. ${accountName} பணம் மீதி ${money(available)}.`;

    addAIMessage(reply);
    speakText(reply);

    return true;

  }


  const item = {

    id: makeId(),

    note:
      cleanExpenseNote(text),

    amount,

    source,

    person: "",

    date: nowText()

  };


  db.expenses.unshift(
    item
  );


  const log = {

    id: makeId(),

    type: "out",

    amount,

    note: item.note,

    date: nowText()

  };


  db[source].expense +=
    amount;


  db[source].logs.unshift(
    log
  );


  db.lastAction = {

    action: "expense",

    expenseId: item.id,

    account: source,

    amount,

    logId: log.id

  };


  saveDB();


  const reply =
    `${sourceTamil(source)}-ல் இருந்து ${money(amount)} ${item.note} செலவு பதிவு செய்துவிட்டேன். ${sourceTamil(source)} மீதி ${money(balance(source))}.`;

  addAIMessage(reply);
  speakText(reply);

  return true;

}


/* =========================================================
   ADD FARM NATURAL
========================================================= */

function addFarmNatural(
  text,
  amount
) {

  /*
     IMPORTANT:
     Farm source = salary/home only.
     Farm balance/income இல்லை.
  */

  const source =
    detectSource(text);


  const available =
    balance(source);


  if (
    amount >
    available
  ) {

    const reply =
      `${sourceTamil(source)} போதவில்லை. மீதி ${money(available)}.`;

    addAIMessage(reply);
    speakText(reply);

    return true;

  }


  const item = {

    id: makeId(),

    type: "expense",

    note:
      cleanFarmNote(text),

    amount,

    source,

    date: nowText()

  };


  db.farm.logs.unshift(
    item
  );


  db.farm.expense +=
    amount;


  /*
     Source account-ல் மட்டுமே expense.
     General expenses-ல் சேர்க்கக்கூடாது.
  */

  const log = {

    id: makeId(),

    type: "out",

    amount,

    note:
      "கொல்லை - " +
      item.note,

    date: nowText()

  };


  db[source].expense +=
    amount;


  db[source].logs.unshift(
    log
  );


  db.lastAction = {

    action: "farmExpense",

    farmId: item.id,

    account: source,

    amount,

    logId: log.id

  };


  saveDB();


  const reply =
    `🌾 கொல்லை செலவு ${money(amount)} - ${item.note}. ${sourceTamil(source)}-ல் இருந்து எடுத்தேன். ${sourceTamil(source)} மீதி ${money(balance(source))}.`;

  addAIMessage(reply);
  speakText(reply);

  return true;

}


/* =========================================================
   FARM NOTE CLEAN
========================================================= */

function cleanFarmNote(
  text
) {

  let t =
    String(text || "")
      .trim();


  t =
    t.replace(
      /கொல்லை பணத்தில் இருந்து/gi,
      ""
    );

  t =
    t.replace(
      /கொல்லை பணத்திலிருந்து/gi,
      ""
    );

  t =
    t.replace(
      /சம்பள பணத்தில் இருந்து/gi,
      ""
    );

  t =
    t.replace(
      /சம்பள பணத்திலிருந்து/gi,
      ""
    );

  t =
    t.replace(
      /வீட்டு பணத்தில் இருந்து/gi,
      ""
    );

  t =
    t.replace(
      /வீட்டுப் பணத்தில் இருந்து/gi,
      ""
    );

  t =
    t.replace(
      /வீட்டிலிருந்து/gi,
      ""
    );

  t =
    t.replace(
      /\d[\d,]*/g,
      ""
    );

  t =
    t.replace(
      /₹/g,
      ""
    );

  t =
    t.replace(
      /கொல்லைக்கு/gi,
      ""
    );

  t =
    t.replace(
      /கொல்லை/gi,
      ""
    );

  t =
    t.replace(
      /\s+/g,
      " "
    )
    .trim();


  return t ||
    "கொல்லை செலவு";

}


/* =========================================================
   MANUAL GENERAL EXPENSE
========================================================= */

function addExpenseManual() {

  const noteInput =
    document.getElementById(
      "expenseNote"
    );

  const amountInput =
    document.getElementById(
      "expenseAmount"
    );

  const personInput =
    document.getElementById(
      "expensePerson"
    );

  const sourceInput =
    document.getElementById(
      "expenseSource"
    );


  const note =
    noteInput?.value.trim() ||
    "பொதுச் செலவு";


  const amount =
    num(
      amountInput?.value
    );


  /*
     HTML-ல் farm option இருந்தாலும்
     farm expense தனி கணக்கில் மட்டுமே.
  */

  let source =
    sourceInput?.value ||
    "home";


  if (
    source === "farm"
  ) {

    alert(
      "கொல்லை செலவை 🌾 கொல்லை பக்கத்தில் பதிவு செய்யுங்கள்.\nகொல்லைக்கு சம்பள பணம் அல்லது வீட்டு பணம் மட்டும் தேர்வு செய்யலாம்."
    );

    return;

  }


  source =
    source === "salary"
      ? "salary"
      : "home";


  if (
    amount <= 0
  ) {

    alert(
      "தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  if (
    amount >
    balance(source)
  ) {

    alert(
      `${sourceTamil(source)} போதவில்லை.\nமீதி: ${money(balance(source))}`
    );

    return;

  }


  const item = {

    id: makeId(),

    note,

    amount,

    person:
      personInput?.value.trim() ||
      "",

    source,

    date: nowText()

  };


  db.expenses.unshift(
    item
  );


  const log = {

    id: makeId(),

    type: "out",

    amount,

    note,

    date: nowText()

  };


  db[source].expense +=
    amount;


  db[source].logs.unshift(
    log
  );


  db.lastAction = {

    action: "expense",

    expenseId: item.id,

    account: source,

    amount,

    logId: log.id

  };


  if (noteInput) {
    noteInput.value = "";
  }

  if (amountInput) {
    amountInput.value = "";
  }

  if (personInput) {
    personInput.value = "";
  }


  saveDB();

}


/* =========================================================
   ADD FARM MANUAL
========================================================= */

function addFarm() {

  const noteInput =
    document.getElementById(
      "farmNote"
    );

  const amountInput =
    document.getElementById(
      "farmAmount"
    );

  const sourceInput =
    document.getElementById(
      "farmSource"
    );


  const note =
    noteInput?.value.trim() ||
    "கொல்லை செலவு";


  const amount =
    num(
      amountInput?.value
    );


  let source =
    sourceInput?.value ||
    "home";


  /*
     Farm income/source = NEVER farm.
  */

  if (
    source === "farm"
  ) {

    alert(
      "கொல்லைக்கு சம்பள பணம் அல்லது வீட்டு பணம் மட்டும் தேர்வு செய்ய வேண்டும்."
    );

    return;

  }


  source =
    source === "salary"
      ? "salary"
      : "home";


  if (
    amount <= 0
  ) {

    alert(
      "தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  if (
    amount >
    balance(source)
  ) {

    alert(
      `${sourceTamil(source)} போதவில்லை.\nமீதி: ${money(balance(source))}`
    );

    return;

  }


  const item = {

    id: makeId(),

    type: "expense",

    note,

    amount,

    source,

    date: nowText()

  };


  db.farm.logs.unshift(
    item
  );


  db.farm.expense +=
    amount;


  const log = {

    id: makeId(),

    type: "out",

    amount,

    note:
      "கொல்லை - " +
      note,

    date: nowText()

  };


  db[source].expense +=
    amount;


  db[source].logs.unshift(
    log
  );


  db.lastAction = {

    action: "farmExpense",

    farmId: item.id,

    account: source,

    amount,

    logId: log.id

  };


  if (noteInput) {
    noteInput.value = "";
  }

  if (amountInput) {
    amountInput.value = "";
  }


  saveDB();

}


/* =========================================================
   DELETE SALARY LOG
========================================================= */

function deleteSalaryLog(id) {

  const index =
    db.salary.logs.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (
    index < 0
  ) {

    return;

  }


  const item =
    db.salary.logs[index];


  if (
    item.type === "in"
  ) {

    db.salary.income =
      Math.max(
        0,
        num(db.salary.income) -
        num(item.amount)
      );

  } else {

    db.salary.expense =
      Math.max(
        0,
        num(db.salary.expense) -
        num(item.amount)
      );

  }


  db.salary.logs.splice(
    index,
    1
  );


  db.lastAction = null;

  saveDB();

}


/* =========================================================
   DELETE HOME LOG
========================================================= */

function deleteHomeLog(id) {

  const index =
    db.home.logs.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (
    index < 0
  ) {

    return;

  }


  const item =
    db.home.logs[index];


  if (
    item.type === "in"
  ) {

    db.home.income =
      Math.max(
        0,
        num(db.home.income) -
        num(item.amount)
      );

  } else {

    db.home.expense =
      Math.max(
        0,
        num(db.home.expense) -
        num(item.amount)
      );

  }


  db.home.logs.splice(
    index,
    1
  );


  db.lastAction = null;

  saveDB();

}


/* =========================================================
   DELETE FARM LOG
========================================================= */

function deleteFarmLog(id) {

  const index =
    db.farm.logs.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (
    index < 0
  ) {

    return;

  }


  const item =
    db.farm.logs[index];


  /*
     Farm total
  */

  db.farm.expense =
    Math.max(
      0,
      num(db.farm.expense) -
      num(item.amount)
    );


  /*
     Source account reverse
  */

  const source =
    item.source === "salary"
      ? "salary"
      : "home";


  const logIndex =
    db[source].logs.findIndex(
      x =>
        x.type === "out" &&
        num(x.amount) ===
          num(item.amount) &&
        String(x.note || "")
          .includes(
            "கொல்லை"
          )
    );


  if (
    logIndex >= 0
  ) {

    db[source].expense =
      Math.max(
        0,
        num(db[source].expense) -
        num(item.amount)
      );

    db[source].logs.splice(
      logIndex,
      1
    );

  }


  db.farm.logs.splice(
    index,
    1
  );


  db.lastAction = null;

  saveDB();

}


/* =========================================================
   DELETE EXPENSE
========================================================= */

function deleteExpense(id) {

  const index =
    db.expenses.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (
    index < 0
  ) {

    return;

  }


  const item =
    db.expenses[index];


  const source =
    item.source === "salary"
      ? "salary"
      : "home";


  db[source].expense =
    Math.max(
      0,
      num(db[source].expense) -
      num(item.amount)
    );


  /*
     Corresponding log
  */

  const logIndex =
    db[source].logs.findIndex(
      x =>
        x.type === "out" &&
        num(x.amount) ===
          num(item.amount) &&
        String(x.note || "") ===
          String(item.note || "")
    );


  if (
    logIndex >= 0
  ) {

    db[source].logs.splice(
      logIndex,
      1
    );

  }


  db.expenses.splice(
    index,
    1
  );


  db.lastAction = null;

  saveDB();

}


/* =========================================================
   ADD LOAN
========================================================= */

function addLoan() {

  const nameInput =
    document.getElementById(
      "loanName"
    );

  const amountInput =
    document.getElementById(
      "loanAmount"
    );

  const rateInput =
    document.getElementById(
      "loanRate"
    );

  const dateInput =
    document.getElementById(
      "loanDate"
    );


  const name =
    nameInput?.value.trim();


  const amount =
    num(
      amountInput?.value
    );


  const rate =
    num(
      rateInput?.value
    );


  const date =
    dateInput?.value ||
    todayISO();


  if (
    !name
  ) {

    alert(
      "பெயரை உள்ளிடுங்கள்."
    );

    return;

  }


  if (
    amount <= 0
  ) {

    alert(
      "அசல் தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  if (
    rate <= 0
  ) {

    alert(
      "வட்டி விகிதத்தை உள்ளிடுங்கள்.\nஉதாரணம்: 2"
    );

    return;

  }


  const loan = {

    id: makeId(),

    name,

    amount,

    rate,

    date,

    paid: 0,

    payments: []

  };


  db.loans.unshift(
    loan
  );


  db.lastAction = {

    action: "loan",

    loanId: loan.id

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


  saveDB();


  const reply =
    `${name} பெயரில் ${money(amount)} அசல், ${rate}% மாத வட்டி கணக்கு சேர்த்துவிட்டேன்.`;

  addAIMessage(reply);
  speakText(reply);

}


/* =========================================================
   ADD LOAN PAYMENT
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
    loanRemaining(loan);


  if (
    remaining <= 0
  ) {

    alert(
      "இந்த கணக்கில் அசல் மீதி இல்லை."
    );

    return;

  }


  const input =
    prompt(
      `எவ்வளவு பணம் வந்தது?\nமீதம்: ${money(remaining)}`
    );


  if (
    input === null
  ) {

    return;

  }


  const amount =
    num(
      input.replace(/,/g, "")
    );


  if (
    amount <= 0
  ) {

    alert(
      "சரியான தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  if (
    amount > remaining
  ) {

    alert(
      `மீதியை விட அதிகமாக பதிவு செய்ய முடியாது.\nமீதி: ${money(remaining)}`
    );

    return;

  }


  loan.paid =
    num(loan.paid) +
    amount;


  loan.payments =
    Array.isArray(
      loan.payments
    )
      ? loan.payments
      : [];


  loan.payments.unshift({

    id: makeId(),

    amount,

    date: nowText()

  });


  db.lastAction = {

    action: "loanPayment",

    loanId: loan.id,

    amount

  };


  saveDB();


  const reply =
    `${loan.name} கணக்கில் ${money(amount)} திருப்பி வந்தது. அசல் மீதி ${money(loanRemaining(loan))}.`;

  addAIMessage(reply);
  speakText(reply);

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


  if (
    index < 0
  ) {

    return;

  }


  db.loans.splice(
    index,
    1
  );


  db.lastAction = null;

  saveDB();

}


/* =========================================================
   ADD NOTE
========================================================= */

function addNote(type) {

  const id =
    type === "perm"
      ? "permText"
      : "tempText";


  const input =
    document.getElementById(
      id
    );


  const text =
    input?.value.trim();


  if (
    !text
  ) {

    alert(
      "குறிப்பை எழுதுங்கள்."
    );

    return;

  }


  const item = {

    id: makeId(),

    text,

    date: nowText()

  };


  if (
    type === "perm"
  ) {

    db.notes.perm.unshift(
      item
    );

  } else {

    db.notes.temp.unshift(
      item
    );

  }


  db.lastAction = {

    action: "note",

    type,

    id: item.id

  };


  if (input) {
    input.value = "";
  }


  saveDB();

}


/* =========================================================
   DELETE NOTE
========================================================= */

function deleteNote(
  type,
  id
) {

  if (
    !db.notes[type]
  ) {

    return;

  }


  db.notes[type] =
    db.notes[type].filter(
      x =>
        Number(x.id) !==
        Number(id)
    );


  db.lastAction = null;

  saveDB();

}


/* =========================================================
   CLEAR TEMPORARY
========================================================= */

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

  db.lastAction = null;

  saveDB();

}


/* =========================================================
   REMINDER ADD MANUAL
========================================================= */

function addReminder() {

  const textInput =
    document.getElementById(
      "reminderText"
    );

  const dateInput =
    document.getElementById(
      "reminderDate"
    );

  const timeInput =
    document.getElementById(
      "reminderTime"
    );

  const earlyInput =
    document.getElementById(
      "reminderEarly"
    );


  const text =
    textInput?.value.trim();


  const date =
    dateInput?.value ||
    todayISO();


  const time =
    timeInput?.value ||
    "";


  const early =
    num(
      earlyInput?.value
    );


  if (
    !text
  ) {

    alert(
      "எதை நினைவூட்ட வேண்டும் என்று எழுதுங்கள்."
    );

    return;

  }


  if (
    !time
  ) {

    alert(
      "நேரத்தை தேர்வு செய்யுங்கள்."
    );

    return;

  }


  const reminder = {

    id: makeId(),

    text,

    date,

    time,

    early,

    done: false,

    notified: false,

    created: nowText()

  };


  db.reminders.push(
    reminder
  );


  db.lastAction = {

    action: "reminder",

    id: reminder.id

  };


  if (textInput) {
    textInput.value = "";
  }


  saveDB();


  ensureNotificationPermission();

  scheduleReminderTimer(
    reminder
  );


  const reply =
    `⏰ ${time} மணிக்கு நினைவூட்டல் வைத்துவிட்டேன்.`;

  addAIMessage(reply);
  speakText(reply);

}


/* =========================================================
   NATURAL REMINDER
========================================================= */

function createNaturalReminder(
  text
) {

  const t =
    normalizeTamil(text);


  let hour = null;

  let minute = 0;


  /*
     8:00
     08:00
  */

  const timeMatch =
    t.match(
      /(\d{1,2})\s*[:.]\s*(\d{2})/
    );


  if (
    timeMatch
  ) {

    hour =
      Number(
        timeMatch[1]
      );

    minute =
      Number(
        timeMatch[2]
      );

  } else {

    const hourMatch =
      t.match(
        /(\d{1,2})\s*மணி/
      );


    if (
      hourMatch
    ) {

      hour =
        Number(
          hourMatch[1]
        );

    }

  }


  /*
     காலை / மாலை / இரவு
  */

  if (
    hour !== null
  ) {

    if (
      t.includes("மாலை") ||
      t.includes("இரவு")
    ) {

      if (
        hour < 12
      ) {

        hour += 12;

      }

    }

    if (
      t.includes("காலை")
    ) {

      if (
        hour === 12
      ) {

        hour = 0;

      }

    }

  }


  if (
    hour === null ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {

    const reply =
      "நினைவூட்ட நேரத்தை 24 மணி முறையில் 08:00 அல்லது 17:30 போல சொல்லுங்கள்.";

    addAIMessage(reply);
    speakText(reply);

    return;

  }


  /*
     Date:
     நாளைக்கு = tomorrow
     இன்று = today
  */

  let date =
    todayISO();


  if (
    t.includes("நாளைக்கு") ||
    t.includes("நாளை")
  ) {

    date =
      tomorrowISO();

  }


  /*
     காலை 8 என்றால்
     text-ல் இருந்த natural reminder முழுவதும் save.
  */

  const time =
    String(hour)
      .padStart(2, "0") +
    ":" +
    String(minute)
      .padStart(2, "0");


  const reminder = {

    id: makeId(),

    text,

    date,

    time,

    early: 0,

    done: false,

    notified: false,

    created: nowText()

  };


  db.reminders.push(
    reminder
  );


  db.lastAction = {

    action: "reminder",

    id: reminder.id

  };


  saveDB();


  ensureNotificationPermission();

  scheduleReminderTimer(
    reminder
  );


  const dateText =
    date === tomorrowISO()
      ? "நாளை"
      : "இன்று";


  const reply =
    `⏰ ${dateText} ${time} மணிக்கு நினைவூட்டல் வைத்துவிட்டேன்.`;

  addAIMessage(reply);
  speakText(reply);

}


/* =========================================================
   REMINDER TARGET
========================================================= */

function reminderTarget(
  reminder
) {

  if (
    !reminder ||
    !reminder.date ||
    !reminder.time
  ) {

    return null;

  }


  const d =
    new Date(
      `${reminder.date}T${reminder.time}:00`
    );


  if (
    Number.isNaN(
      d.getTime()
    )
  ) {

    return null;

  }


  const early =
    num(
      reminder.early
    );


  d.setMinutes(
    d.getMinutes() -
    early
  );


  return d;

}


/* =========================================================
   REMINDER TIMER
========================================================= */

const reminderTimers = {};


function scheduleReminderTimer(
  reminder
) {

  if (!reminder) {
    return;
  }


  const target =
    reminderTarget(
      reminder
    );


  if (!target) {
    return;
  }


  const delay =
    target.getTime() -
    Date.now();


  if (
    delay <= 0
  ) {

    return;

  }


  if (
    reminderTimers[
      reminder.id
    ]
  ) {

    clearTimeout(
      reminderTimers[
        reminder.id
      ]
    );

  }


  reminderTimers[
    reminder.id
  ] =
    setTimeout(
      () => {

        checkReminders();

      },
      Math.min(
        delay,
        2147483647
      )
    );

}


/* =========================================================
   SCHEDULE ALL REMINDERS
========================================================= */

function scheduleAllReminders() {

  db.reminders.forEach(
    reminder => {

      if (
        !reminder.done
      ) {

        scheduleReminderTimer(
          reminder
        );

      }

    }
  );

}


/* =========================================================
   NOTIFICATION PERMISSION
========================================================= */

function ensureNotificationPermission() {

  if (
    "Notification" in window
  ) {

    if (
      Notification.permission ===
      "default"
    ) {

      Notification.requestPermission()
        .catch(
          () => {}
        );

    }

  }

}


function requestNotifications() {

  if (
    !("Notification" in window)
  ) {

    alert(
      "இந்த browser-ல் Notification வசதி இல்லை."
    );

    return;

  }


  Notification.requestPermission()
    .then(
      permission => {

        if (
          permission ===
          "granted"
        ) {

          alert(
            "🔔 Notification அனுமதி வழங்கப்பட்டது."
          );

        } else {

          alert(
            "Notification அனுமதி வழங்கப்படவில்லை."
          );

        }

      }
    )
    .catch(
      () => {}
    );

}


/* =========================================================
   CHECK REMINDERS
========================================================= */

function checkReminders() {

  const now =
    new Date();


  let changed = false;


  db.reminders.forEach(
    reminder => {

      if (
        reminder.done ||
        reminder.notified
      ) {

        return;

      }


      const target =
        reminderTarget(
          reminder
        );


      if (
        !target
      ) {

        return;

      }


      if (
        now >= target
      ) {

        reminder.notified =
          true;


        changed = true;


        const message =
          `⏰ நினைவூட்டல்: ${reminder.text}`;


        /*
           Browser notification
        */

        if (
          "Notification" in window &&
          Notification.permission ===
            "granted"
        ) {

          try {

            new Notification(
              "🎙️ ஜாக்கி Smart PA",
              {
                body:
                  reminder.text
              }
            );

          } catch (e) {}

        }


        /*
           Voice
        */

        speakText(
          `நினைவூட்டல். ${reminder.text}`
        );


        /*
           Chat
        */

        addAIMessage(
          message
        );

      }

    }
  );


  if (
    changed
  ) {

    saveRawOnly();

    renderAll();

  }

}


/* =========================================================
   COMPLETE REMINDER
========================================================= */

function completeReminder(
  id
) {

  const reminder =
    db.reminders.find(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (!reminder) {
    return;
  }


  reminder.done = true;

  reminder.notified = true;


  db.lastAction = null;

  saveDB();

}


/* =========================================================
   RESET REMINDER
========================================================= */

function resetReminder(
  id
) {

  const reminder =
    db.reminders.find(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (!reminder) {
    return;
  }


  reminder.done = false;

  reminder.notified = false;


  db.lastAction = {

    action: "reminderReset",

    id

  };


  saveDB();


  scheduleReminderTimer(
    reminder
  );

}


/* =========================================================
   DELETE REMINDER
========================================================= */

function deleteReminder(
  id
) {

  db.reminders =
    db.reminders.filter(
      x =>
        Number(x.id) !==
        Number(id)
    );


  db.lastAction = null;

  saveDB();

}


/* =========================================================
   TEST REMINDER
========================================================= */

function testReminder() {

  const message =
    "⏰ இது ஜாக்கி நினைவூட்டல் சோதனை.";

  addAIMessage(message);

  speakText(message);


  if (
    "Notification" in window &&
    Notification.permission ===
      "granted"
  ) {

    try {

      new Notification(
        "🎙️ ஜாக்கி Smart PA",
        {
          body:
            "நினைவூட்டல் சோதனை"
        }
      );

    } catch (e) {}

  }

}


/* =========================================================
   AI MESSAGE
========================================================= */

function addAIMessage(
  text
) {

  const box =
    document.getElementById(
      "chatBox"
    );


  if (!box) {
    return;
  }


  const div =
    document.createElement(
      "div"
    );


  div.className =
    "message ai";


  div.textContent =
    String(text);


  box.appendChild(
    div
  );


  box.scrollTop =
    box.scrollHeight;

}


/* =========================================================
   USER MESSAGE
========================================================= */

function addUserMessage(
  text
) {

  const box =
    document.getElementById(
      "chatBox"
    );


  if (!box) {
    return;
  }


  const div =
    document.createElement(
      "div"
    );


  div.className =
    "message user";


  div.textContent =
    String(text);


  box.appendChild(
    div
  );


  box.scrollTop =
    box.scrollHeight;

}


/* =========================================================
   CLEAR CHAT
========================================================= */

function clearChat() {

  const box =
    document.getElementById(
      "chatBox"
    );


  if (!box) {
    return;
  }


  box.innerHTML = "";


  addAIMessage(
    "வணக்கம் பாலாஜி சார்! என்ன செய்ய வேண்டும்?"
  );

}


/* =========================================================
   QUERY HANDLER
========================================================= */

function handleQuery(
  text
) {

  const t =
    normalizeTamil(text);


  /* -----------------------------------------
     SALARY TOTAL INCOME
  ----------------------------------------- */

  if (
    (
      t.includes("சம்பள வரவு") ||
      t.includes("சம்பளம் வரவு")
    ) &&
    (
      t.includes("எவ்வளவு") ||
      t.includes("மொத்தம்")
    )
  ) {

    const reply =
      `சம்பள வரவு மொத்தம் ${money(db.salary.income)}.`;

    addAIMessage(reply);
    speakText(reply);

    return true;

  }


  /* -----------------------------------------
     SALARY BALANCE
  ----------------------------------------- */

  if (
    (
      t.includes("சம்பள மீதி") ||
      t.includes("சம்பள பணம்") ||
      t.includes("சம்பள கணக்கு") ||
      t.includes("சம்பளத்தில் எவ்வளவு")
    ) &&
    (
      t.includes("எவ்வளவு") ||
      t.includes("மீதி") ||
      t.includes("இருக்கு")
    )
  ) {

    const reply =
      `சம்பள பணம் மீதி ${money(balance("salary"))}.`;

    addAIMessage(reply);
    speakText(reply);

    return true;

  }


  /* -----------------------------------------
     HOME BALANCE
  ----------------------------------------- */

  if (
    (
      t.includes("வீட்டு பணம்") ||
      t.includes("வீட்டு கணக்கு") ||
      t.includes("வீட்டு மீதி")
    ) &&
    (
      t.includes("எவ்வளவு") ||
      t.includes("மீதி") ||
      t.includes("இருக்கு")
    )
  ) {

    const reply =
      `வீட்டு பணம் மீதி ${money(balance("home"))}.`;

    addAIMessage(reply);
    speakText(reply);

    return true;

  }


  /* -----------------------------------------
     FARM TOTAL EXPENSE
  ----------------------------------------- */

  if (
    (
      t.includes("கொல்லை") ||
      t.includes("கொள்ளை")
    ) &&
    (
      t.includes("மொத்த") ||
      t.includes("செலவு")
    )
  ) {

    const total =
      db.farm.logs.reduce(
        (sum, item) =>
          sum + num(item.amount),
        0
      );


    const reply =
      `🌾 கொல்லைக்கான மொத்த செலவு ${money(total)}.`;

    addAIMessage(reply);
    speakText(reply);

    return true;

  }


  /* -----------------------------------------
     TOTAL GENERAL EXPENSE
  ----------------------------------------- */

  if (
    t.includes("மொத்த செலவு") ||
    t.includes("மொத்த செலவுகள்") ||
    t.includes("இந்த மாத செலவு")
  ) {

    const total =
      db.expenses.reduce(
        (sum, item) =>
          sum +
          num(item.amount),
        0
      );


    const reply =
      `மொத்த பொதுச் செலவு ${money(total)}.`;

    addAIMessage(reply);
    speakText(reply);

    return true;

  }


  /* -----------------------------------------
     REMINDER QUERY
  ----------------------------------------- */

  if (
    t.includes("நினைவூட்டல்") ||
    t.includes("நினைவூட்டல்கள்")
  ) {

    const active =
      db.reminders.filter(
        x =>
          !x.done
      );


    if (
      !active.length
    ) {

      const reply =
        "இப்போது எந்த நினைவூட்டலும் இல்லை.";

      addAIMessage(reply);
      speakText(reply);

      return true;

    }


    const textList =
      active.map(
        x =>
          `⏰ ${x.text} - ${x.date} ${x.time}`
      )
      .join("\n");


    const reply =
      `உள்ள நினைவூட்டல்கள்:\n${textList}`;

    addAIMessage(reply);

    speakText(
      `உங்களிடம் ${active.length} நினைவூட்டல்கள் உள்ளன.`
    );

    return true;

  }


  /* -----------------------------------------
     LOAN LIST
  ----------------------------------------- */

  if (
    (
      t.includes("யாருக்கெல்லாம்") ||
      t.includes("யாருக்கு")
    ) &&
    (
      t.includes("வட்டி") ||
      t.includes("கடன்")
    )
  ) {

    if (
      !db.loans.length
    ) {

      const reply =
        "இப்போது யாருடைய வட்டி கணக்கும் இல்லை.";

      addAIMessage(reply);
      speakText(reply);

      return true;

    }


    const names =
      db.loans
        .map(
          x =>
            `${x.name} - ${money(loanRemaining(x))} - ${parseRateValue(x.rate)}%`
        )
        .join("\n");


    const reply =
      `வட்டி கணக்குகள்:\n${names}`;

    addAIMessage(reply);

    speakText(
      `மொத்தம் ${db.loans.length} வட்டி கணக்குகள் உள்ளன.`
    );

    return true;

  }


  /* -----------------------------------------
     PERSON LOAN
  ----------------------------------------- */

  if (
    t.includes("கணக்கில்") &&
    (
      t.includes("எவ்வளவு") ||
      t.includes("இருக்கு") ||
      t.includes("மீதி")
    )
  ) {

    const person =
      extractPerson(text);


    if (person) {

      const loans =
        db.loans.filter(
          x =>
            String(x.name)
              .toLowerCase()
              .includes(
                person.toLowerCase()
              )
        );


      if (
        loans.length
      ) {

        let total = 0;

        let interest = 0;


        loans.forEach(
          loan => {

            total +=
              loanRemaining(
                loan
              );

            interest +=
              loanInterest(
                loan
              );

          }
        );


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

function undoLast() {

  if (
    !db.lastAction
  ) {

    const reply =
      "நீக்குவதற்கு சமீபத்திய பதிவு இல்லை.";

    addAIMessage(reply);
    speakText(reply);

    return;

  }


  const action =
    db.lastAction;


  /* -----------------------------------------
     ACCOUNT
  ----------------------------------------- */

  if (
    action.action ===
    "account"
  ) {

    const account =
      db[action.account];


    if (!account) {
      return;
    }


    const field =
      action.type === "in"
        ? "income"
        : "expense";


    account[field] =
      Math.max(
        0,
        num(account[field]) -
        num(action.amount)
      );


    const index =
      account.logs.findIndex(
        log =>
          Number(log.id) ===
          Number(action.logId)
      );


    if (
      index >= 0
    ) {

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


  /* -----------------------------------------
     GENERAL EXPENSE
  ----------------------------------------- */

  if (
    action.action ===
    "expense"
  ) {

    const index =
      db.expenses.findIndex(
        x =>
          Number(x.id) ===
          Number(action.expenseId)
      );


    if (
      index >= 0
    ) {

      const item =
        db.expenses[index];


      const account =
        db[action.account];


      if (
        account
      ) {

        account.expense =
          Math.max(
            0,
            num(account.expense) -
            num(action.amount)
          );


        const logIndex =
          account.logs.findIndex(
            log =>
              Number(log.id) ===
              Number(action.logId)
          );


        if (
          logIndex >= 0
        ) {

          account.logs.splice(
            logIndex,
            1
          );

        }

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


  /* -----------------------------------------
     FARM EXPENSE
  ----------------------------------------- */

  if (
    action.action ===
    "farmExpense"
  ) {

    const index =
      db.farm.logs.findIndex(
        x =>
          Number(x.id) ===
          Number(action.farmId)
      );


    if (
      index >= 0
    ) {

      db.farm.logs.splice(
        index,
        1
      );


      db.farm.expense =
        Math.max(
          0,
          num(db.farm.expense) -
          num(action.amount)
        );


      const account =
        db[action.account];


      if (
        account
      ) {

        account.expense =
          Math.max(
            0,
            num(account.expense) -
            num(action.amount)
          );


        const logIndex =
          account.logs.findIndex(
            log =>
              Number(log.id) ===
              Number(action.logId)
          );


        if (
          logIndex >= 0
        ) {

          account.logs.splice(
            logIndex,
            1
          );

        }

      }

    }


    db.lastAction = null;

    saveDB();


    const reply =
      "கடைசி கொல்லை செலவு நீக்கிவிட்டேன்.";

    addAIMessage(reply);
    speakText(reply);

    return;

  }


  /* -----------------------------------------
     LOAN
  ----------------------------------------- */

  if (
    action.action ===
    "loan"
  ) {

    db.loans =
      db.loans.filter(
        x =>
          Number(x.id) !==
          Number(action.loanId)
      );


    db.lastAction = null;

    saveDB();


    const reply =
      "கடைசி வட்டி கணக்கு நீக்கிவிட்டேன்.";

    addAIMessage(reply);
    speakText(reply);

    return;

  }


  /* -----------------------------------------
     LOAN PAYMENT
  ----------------------------------------- */

  if (
    action.action ===
    "loanPayment"
  ) {

    const loan =
      db.loans.find(
        x =>
          Number(x.id) ===
          Number(action.loanId)
      );


    if (
      loan
    ) {

      loan.paid =
        Math.max(
          0,
          num(loan.paid) -
          num(action.amount)
        );


      if (
        Array.isArray(
          loan.payments
        )
      ) {

        const index =
          loan.payments.findIndex(
            x =>
              num(x.amount) ===
              num(action.amount)
          );


        if (
          index >= 0
        ) {

          loan.payments.splice(
            index,
            1
          );

        }

      }

    }


    db.lastAction = null;

    saveDB();


    const reply =
      "கடைசி வட்டி பண வரவு நீக்கிவிட்டேன்.";

    addAIMessage(reply);
    speakText(reply);

    return;

  }


  /* -----------------------------------------
     NOTE
  ----------------------------------------- */

  if (
    action.action ===
    "note"
  ) {

    if (
      db.notes[action.type]
    ) {

      db.notes[action.type] =
        db.notes[action.type].filter(
          x =>
            Number(x.id) !==
            Number(action.id)
        );

    }


    db.lastAction = null;

    saveDB();


    const reply =
      "கடைசி குறிப்பு நீக்கிவிட்டேன்.";

    addAIMessage(reply);
    speakText(reply);

    return;

  }


  /* -----------------------------------------
     REMINDER
  ----------------------------------------- */

  if (
    action.action ===
    "reminder"
  ) {

    db.reminders =
      db.reminders.filter(
        x =>
          Number(x.id) !==
          Number(action.id)
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

function sendMessage() {

  const input =
    document.getElementById(
      "textInput"
    );


  if (!input) {
    return;
  }


  const text =
    input.value.trim();


  if (!text) {
    return;
  }


  addUserMessage(
    text
  );


  input.value = "";


  const t =
    normalizeTamil(text);


  /* -----------------------------------------
     UNDO
  ----------------------------------------- */

  if (
    t.includes("தப்பு") ||
    t.includes("தப்பா") ||
    t.includes("நீக்கு") ||
    t.includes("அழி") ||
    t.includes("delete") ||
    t.includes("undo")
  ) {

    undoLast();

    return;

  }


  /* -----------------------------------------
     QUERY
  ----------------------------------------- */

  if (
    handleQuery(text)
  ) {

    return;

  }


  /* -----------------------------------------
     NATURAL REMINDER
  ----------------------------------------- */

  if (
    t.includes("நினைவூட்டு") ||
    t.includes("நினைவூட்டல்") ||
    t.includes("ஞாபகப்படுத்து")
  ) {

    createNaturalReminder(
      text
    );

    return;

  }


  /* -----------------------------------------
     INCOME
  ----------------------------------------- */

  if (
    isIncomeMessage(text)
  ) {

    if (
      handleIncome(text)
    ) {

      return;

    }

  }


  /* -----------------------------------------
     EXPENSE
  ----------------------------------------- */

  if (
    isExpenseMessage(text)
  ) {

    if (
      handleExpense(text)
    ) {

      return;

    }

  }


  /* -----------------------------------------
     LOAN
  ----------------------------------------- */

  if (
    (
      t.includes("வட்டி") ||
      t.includes("கடன்")
    ) &&
    parseAmount(text) > 0
  ) {

    const name =
      extractPerson(text) ||
      "பெயர் தெரியவில்லை";


    const amount =
      parseAmount(text);


    const rate =
      parseRate(text);


    const loan = {

      id: makeId(),

      name,

      amount,

      rate,

      date: todayISO(),

      paid: 0,

      payments: []

    };


    db.loans.unshift(
      loan
    );


    db.lastAction = {

      action: "loan",

      loanId:
        loan.id

    };


    saveDB();


    const reply =
      `${name} பெயரில் ${money(amount)} அசல், ${rate}% மாத வட்டி கணக்கு சேர்த்துவிட்டேன்.`;

    addAIMessage(reply);
    speakText(reply);

    return;

  }


  /* -----------------------------------------
     NOTE
  ----------------------------------------- */

  if (
    t.includes("நினைவில் வை") ||
    t.includes("நோட்டில் எழுது") ||
    t.includes("குறிப்பு")
  ) {

    const item = {

      id: makeId(),

      text,

      date: nowText()

    };


    db.notes.temp.unshift(
      item
    );


    db.lastAction = {

      action: "note",

      type: "temp",

      id: item.id

    };


    saveDB();


    const reply =
      "தற்காலிக குறிப்பில் வைத்துவிட்டேன்.";

    addAIMessage(reply);
    speakText(reply);

    return;

  }


  /* -----------------------------------------
     DEFAULT
  ----------------------------------------- */

  const reply =
    "புரிந்துகொண்டேன். பணம் அல்லது செலவு என்றால் தொகையுடன் சொல்லுங்கள்.\n\nஉதாரணம்:\n“சம்பளம் வந்தது 20000”\n“சம்பள பணத்தில் இருந்து பெட்ரோல் 300”\n“வீட்டு பணத்தில் இருந்து டீ 200”\n“கொல்லைக்கு சம்பள பணத்தில் இருந்து மருந்து 500”\n“கொல்லைக்கு வீட்டு பணத்தில் இருந்து உரம் 1500”";

  addAIMessage(reply);
  speakText(reply);

}


/* =========================================================
   SPEECH SYNTHESIS
========================================================= */

function speakText(text) {

  if (
    !("speechSynthesis" in window)
  ) {

    return;

  }


  try {

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


    utter.volume =
      1;


    window.speechSynthesis.speak(
      utter
    );

  } catch (error) {

    console.log(
      "Speech error:",
      error
    );

  }

}


/* =========================================================
   SPEECH RECOGNITION
========================================================= */

let recognition = null;


function startListening() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    alert(
      "இந்த browser-ல் தமிழ் Voice Recognition இல்லை."
    );

    return;

  }


  if (
    recognition
  ) {

    try {
      recognition.stop();
    } catch (e) {}

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


  if (status) {

    status.textContent =
      "🎤 கேட்கிறேன்... பேசுங்கள்";

  }


  recognition.onresult =
    function(event) {

      let finalText = "";

      let interimText = "";


      for (
        let i =
          event.resultIndex;
        i <
          event.results.length;
        i++
      ) {

        const transcript =
          event.results[i][0]
            .transcript;


        if (
          event.results[i]
            .isFinal
        ) {

          finalText +=
            transcript;

        } else {

          interimText +=
            transcript;

        }

      }


      const input =
        document.getElementById(
          "textInput"
        );


      if (!input) {
        return;
      }


      if (
        finalText
      ) {

        input.value =
          finalText;


        if (status) {

          status.textContent =
            "✅ புரிந்தது";

        }


        setTimeout(
          () => {
            sendMessage();
          },
          300
        );

      } else {

        input.value =
          interimText;

      }

    };


  recognition.onerror =
    function(event) {

      if (status) {

        status.textContent =
          "❌ Voice Error: " +
          event.error;

      }

    };


  recognition.onend =
    function() {

      if (
        status &&
        status.textContent.includes(
          "கேட்கிறேன்"
        )
      ) {

        status.textContent =
          "🎤 தயார்";

      }

    };


  try {

    recognition.start();

  } catch (error) {

    console.log(
      "Recognition start:",
      error
    );

  }

}


/* =========================================================
   STOP LISTENING
========================================================= */

function stopListening() {

  if (
    recognition
  ) {

    try {

      recognition.stop();

    } catch (e) {}

  }


  const status =
    document.getElementById(
      "status"
    );


  if (status) {

    status.textContent =
      "🎤 தயார்";

  }

}


/* =========================================================
   ENTER KEY
========================================================= */

document.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key === "Enter" &&
      event.target?.id ===
        "textInput" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


/* =========================================================
   RENDER HOME
========================================================= */

function renderHome() {

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


  if (salary) {

    salary.textContent =
      money(
        balance("salary")
      );

  }


  if (home) {

    home.textContent =
      money(
        balance("home")
      );

  }


  if (expense) {

    const total =
      db.expenses.reduce(
        (sum, item) =>
          sum +
          num(item.amount),
        0
      );


    /*
       Home/SALARY farm expense
       general total-ல் சேராது.
    */

    expense.textContent =
      money(total);

  }


  if (rem) {

    rem.textContent =
      db.reminders.filter(
        x =>
          !x.done
      ).length;

  }

}


/* =========================================================
   RENDER SALARY
========================================================= */

function renderSalary() {

  const bal =
    document.getElementById(
      "salaryBalance"
    );


  if (bal) {

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


  if (!list) {
    return;
  }


  if (
    !db.salary.logs.length
  ) {

    list.innerHTML =
      `<div class="empty">சம்பள பதிவு இல்லை</div>`;

    return;

  }


  list.innerHTML =
    db.salary.logs
      .map(
        item => `

        <div class="record">

          <div>

            <b>
              ${
                item.type === "in"
                  ? "🟢 வரவு"
                  : "🔴 செலவு"
              }

              ${money(item.amount)}
            </b>

            <small>
              ${escapeHTML(item.note)}
              <br>
              ${escapeHTML(item.date)}
            </small>

          </div>

          <button
            class="delete"
            onclick="deleteSalaryLog(${item.id})">
            அழி
          </button>

        </div>

      `
      )
      .join("");

}


/* =========================================================
   RENDER HOME ACCOUNT
========================================================= */

function renderHomeAccount() {

  const bal =
    document.getElementById(
      "homeBalance"
    );


  if (bal) {

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


  if (!list) {
    return;
  }


  if (
    !db.home.logs.length
  ) {

    list.innerHTML =
      `<div class="empty">வீட்டு பதிவு இல்லை</div>`;

    return;

  }


  list.innerHTML =
    db.home.logs
      .map(
        item => `

        <div class="record">

          <div>

            <b>
              ${
                item.type === "in"
                  ? "🟢 வரவு"
                  : "🔴 செலவு"
              }

              ${money(item.amount)}
            </b>

            <small>
              ${escapeHTML(item.note)}
              <br>
              ${escapeHTML(item.date)}
            </small>

          </div>

          <button
            class="delete"
            onclick="deleteHomeLog(${item.id})">
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

  const list =
    document.getElementById(
      "farmList"
    );


  if (!list) {
    return;
  }


  if (
    !db.farm.logs.length
  ) {

    list.innerHTML =
      `<div class="empty">கொல்லை பதிவு இல்லை</div>`;

    return;

  }


  const total =
    db.farm.logs.reduce(
      (sum, item) =>
        sum +
        num(item.amount),
      0
    );


  list.innerHTML = `

    <div class="summary-card" style="margin-bottom:12px;">

      <div class="label">
        🌾 கொல்லைக்கான மொத்த செலவு
      </div>

      <div class="value">
        ${money(total)}
      </div>

    </div>

    ${db.farm.logs
      .map(
        item => `

        <div class="record">

          <div>

            <b>
              🌾
              ${escapeHTML(item.note)}
              ${money(item.amount)}
            </b>

            <small>

              ${sourceTamil(item.source)}

              <br>

              ${escapeHTML(item.date)}

            </small>

          </div>

          <button
            class="delete"
            onclick="deleteFarmLog(${item.id})">
            அழி
          </button>

        </div>

      `
      )
      .join("")}

  `;

}


/* =========================================================
   RENDER EXPENSES
========================================================= */

function renderExpenses() {

  const list =
    document.getElementById(
      "expenseList"
    );


  if (!list) {
    return;
  }


  if (
    !db.expenses.length
  ) {

    list.innerHTML =
      `<div class="empty">செலவு பதிவு இல்லை</div>`;

    return;

  }


  list.innerHTML =
    db.expenses
      .map(
        item => `

        <div class="record">

          <div>

            <b>
              🔴
              ${escapeHTML(item.note)}
              ${money(item.amount)}
            </b>

            <small>

              ${sourceTamil(item.source)}

              ${
                item.person
                  ? " • " +
                    escapeHTML(
                      item.person
                    )
                  : ""
              }

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
    document.getElementById(
      "loanList"
    );


  if (!list) {
    return;
  }


  if (
    !db.loans.length
  ) {

    list.innerHTML =
      `<div class="empty">Loan Account இல்லை</div>`;

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
              (sum, loan) =>
                sum +
                loanRemaining(
                  loan
                ),
              0
            );


          const interest =
            loans.reduce(
              (sum, loan) =>
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
                ${escapeHTML(name)}
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
                      @ ${parseRateValue(loan.rate)}%
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
    document.getElementById(
      "tempList"
    );


  const perm =
    document.getElementById(
      "permList"
    );


  if (temp) {

    temp.innerHTML =
      db.notes.temp.length
        ? db.notes.temp
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
        ? db.notes.perm
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
    document.getElementById(
      "reminderList"
    );


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
        (a, b) => {

          const ta =
            reminderTarget(a);

          const tb =
            reminderTarget(b);

          if (!ta || !tb) {
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
                    item.early || 0
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

                  ? `

                    <button
                      class="green"
                      onclick="resetReminder(${item.id})">
                      மீண்டும்
                    </button>

                  `

                  : `

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
   ESCAPE HTML
========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   SHOW PAGE
========================================================= */

function showPage(
  pageId
) {

  document
    .querySelectorAll(
      ".page"
    )
    .forEach(
      page => {

        page.classList.toggle(
          "active",
          page.id === pageId
        );

      }
    );


  const buttons =
    document.querySelectorAll(
      "nav button"
    );


  buttons.forEach(
    button => {

      const onclick =
        button.getAttribute(
          "onclick"
        ) || "";


      button.classList.toggle(
        "active",
        onclick.includes(
          `'${pageId}'`
        ) ||
        onclick.includes(
          `"${pageId}"`
        )
      );

    }
  );


  window.scrollTo(
    {
      top: 0,
      behavior: "smooth"
    }
  );


  /*
     Page render refresh
  */

  renderAll();

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  try {
    renderHome();
  } catch (e) {
    console.log(
      "renderHome:",
      e
    );
  }


  try {
    renderSalary();
  } catch (e) {
    console.log(
      "renderSalary:",
      e
    );
  }


  try {
    renderHomeAccount();
  } catch (e) {
    console.log(
      "renderHomeAccount:",
      e
    );
  }


  try {
    renderFarm();
  } catch (e) {
    console.log(
      "renderFarm:",
      e
    );
  }


  try {
    renderExpenses();
  } catch (e) {
    console.log(
      "renderExpenses:",
      e
    );
  }


  try {
    renderLoans();
  } catch (e) {
    console.log(
      "renderLoans:",
      e
    );
  }


  try {
    renderNotes();
  } catch (e) {
    console.log(
      "renderNotes:",
      e
    );
  }


  try {
    renderReminders();
  } catch (e) {
    console.log(
      "renderReminders:",
      e
    );
  }

}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeJacky() {

  loadDB();

  renderAll();

  scheduleAllReminders();

  checkReminders();


  setInterval(
    checkReminders,
    15000
  );


  setInterval(
    renderReminders,
    15000
  );


  document.addEventListener(
    "visibilitychange",
    function() {

      if (
        document.visibilityState ===
        "visible"
      ) {

        checkReminders();

        renderReminders();

      }

    }
  );


  window.addEventListener(
    "focus",
    function() {

      checkReminders();

      renderReminders();

    }
  );


  const date =
    document.getElementById(
      "reminderDate"
    );


  if (
    date &&
    !date.value
  ) {

    date.value =
      todayISO();

  }


  const loanDate =
    document.getElementById(
      "loanDate"
    );


  if (
    loanDate &&
    !loanDate.value
  ) {

    loanDate.value =
      todayISO();

  }


  console.log(
    "🎙️ JACKY AI READY"
  );

}


/* =========================================================
   PAGE LOAD
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


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.showPage =
  showPage;

window.addSalary =
  addSalary;

window.addHome =
  addHome;

window.addFarm =
  addFarm;

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

window.testReminder =
  testReminder;

window.requestNotifications =
  requestNotifications;

window.sendMessage =
  sendMessage;

window.clearChat =
  clearChat;

window.startListening =
  startListening;

window.stopListening =
  stopListening;

window.undoLast =
  undoLast;

window.deleteSalaryLog =
  deleteSalaryLog;

window.deleteHomeLog =
  deleteHomeLog;

window.deleteFarmLog =
  deleteFarmLog;

window.parseAmount =
  parseAmount;

window.parseRate =
  parseRate;