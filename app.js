/* =========================================================
   JACKY AI - Smart PA
   app.js v7
   Tamil Smart Personal Assistant
   ========================================================= */

"use strict";

/* =========================================================
   DATABASE
   ========================================================= */

const DB_KEY = "jacky_ai_db_v7";

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


let db = cloneDB(DEFAULT_DB);


/* =========================================================
   DATABASE HELPERS
   ========================================================= */

function cloneDB(obj) {

  return JSON.parse(JSON.stringify(obj));

}


function mergeDB(saved) {

  const base = cloneDB(DEFAULT_DB);

  if (!saved || typeof saved !== "object") {
    return base;
  }

  base.salary = Object.assign(
    base.salary,
    saved.salary || {}
  );

  base.home = Object.assign(
    base.home,
    saved.home || {}
  );

  base.farm = Object.assign(
    base.farm,
    saved.farm || {}
  );

  base.salary.logs =
    Array.isArray(base.salary.logs)
      ? base.salary.logs
      : [];

  base.home.logs =
    Array.isArray(base.home.logs)
      ? base.home.logs
      : [];

  base.farm.logs =
    Array.isArray(base.farm.logs)
      ? base.farm.logs
      : [];

  base.expenses =
    Array.isArray(saved.expenses)
      ? saved.expenses
      : [];

  base.loans =
    Array.isArray(saved.loans)
      ? saved.loans
      : [];

  base.reminders =
    Array.isArray(saved.reminders)
      ? saved.reminders
      : [];

  base.notes = Object.assign(
    base.notes,
    saved.notes || {}
  );

  base.notes.temp =
    Array.isArray(base.notes.temp)
      ? base.notes.temp
      : [];

  base.notes.perm =
    Array.isArray(base.notes.perm)
      ? base.notes.perm
      : [];

  base.lastAction =
    saved.lastAction || null;

  return base;

}


/* =========================================================
   LOAD DATABASE
   ========================================================= */

function loadDB() {

  try {

    const saved =
      localStorage.getItem(DB_KEY);

    if (saved) {

      db =
        mergeDB(
          JSON.parse(saved)
        );

    }

  } catch (error) {

    console.error(
      "Jacky DB load error:",
      error
    );

    db =
      cloneDB(DEFAULT_DB);

  }

}


/* =========================================================
   SAVE DATABASE
   ========================================================= */

function saveDB() {

  try {

    localStorage.setItem(
      DB_KEY,
      JSON.stringify(db)
    );

  } catch (error) {

    console.error(
      "Jacky DB save error:",
      error
    );

  }

  renderAll();

}


/* =========================================================
   DATE / TIME
   ========================================================= */

function nowText() {

  return new Date().toLocaleString(
    "ta-IN",
    {
      dateStyle: "medium",
      timeStyle: "short"
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


function currentTime() {

  const d = new Date();

  return (
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );

}


/* =========================================================
   MONEY
   ========================================================= */

function money(value) {

  const n =
    Number(value) || 0;

  return (
    "₹" +
    n.toLocaleString(
      "en-IN"
    )
  );

}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(id) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.remove(
        "active"
      );

    });


  const page =
    document.getElementById(id);


  if (page) {

    page.classList.add(
      "active"
    );

  }


  document
    .querySelectorAll("nav button")
    .forEach(button => {

      button.classList.remove(
        "active"
      );

    });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   BALANCE
   ========================================================= */

function balance(account) {

  if (!db[account]) {
    return 0;
  }

  return (
    Number(
      db[account].income || 0
    ) -
    Number(
      db[account].expense || 0
    )
  );

}


/* =========================================================
   ACCOUNT MONEY
   ========================================================= */

function addAccountMoney(
  account,
  type,
  amount,
  note,
  source = "manual"
) {

  amount =
    Number(amount);


  if (
    !db[account] ||
    !amount ||
    amount <= 0
  ) {

    alert(
      "சரியான தொகையை கொடுக்கவும்"
    );

    return null;

  }


  const log = {

    id:
      Date.now() +
      Math.floor(
        Math.random() * 1000
      ),

    type,

    amount,

    note:
      note ||
      "நேரடி பதிவு",

    source,

    date:
      nowText()

  };


  if (type === "in") {

    db[account].income =
      Number(
        db[account].income || 0
      ) + amount;

  } else {

    db[account].expense =
      Number(
        db[account].expense || 0
      ) + amount;

  }


  db[account].logs.unshift(
    log
  );


  db.lastAction = {

    action: "account",

    account,

    type,

    amount,

    logId: log.id

  };


  saveDB();

  return log;

}


/* =========================================================
   SALARY
   ========================================================= */

function addSalary(type) {

  const amount =
    Number(
      document.getElementById(
        "salaryAmount"
      )?.value
    );


  const note =
    document.getElementById(
      "salaryNote"
    )?.value.trim() || "";


  const result =
    addAccountMoney(
      "salary",
      type,
      amount,
      note ||
        (
          type === "in"
            ? "சம்பள வரவு"
            : "சம்பள செலவு"
        )
    );


  if (result) {

    const amountEl =
      document.getElementById(
        "salaryAmount"
      );

    const noteEl =
      document.getElementById(
        "salaryNote"
      );


    if (amountEl)
      amountEl.value = "";

    if (noteEl)
      noteEl.value = "";

  }

}


/* =========================================================
   HOME
   ========================================================= */

function addHome(type) {

  const amount =
    Number(
      document.getElementById(
        "homeAmount"
      )?.value
    );


  const note =
    document.getElementById(
      "homeNote"
    )?.value.trim() || "";


  const result =
    addAccountMoney(
      "home",
      type,
      amount,
      note ||
        (
          type === "in"
            ? "வீட்டு வரவு"
            : "வீட்டு செலவு"
        )
    );


  if (result) {

    const amountEl =
      document.getElementById(
        "homeAmount"
      );

    const noteEl =
      document.getElementById(
        "homeNote"
      );


    if (amountEl)
      amountEl.value = "";

    if (noteEl)
      noteEl.value = "";

  }

}


/* =========================================================
   FARM
   ========================================================= */

function addFarm() {

  const amount =
    Number(
      document.getElementById(
        "farmAmount"
      )?.value
    );


  const note =
    document.getElementById(
      "farmNote"
    )?.value.trim() || "";


  const source =
    document.getElementById(
      "farmSource"
    )?.value ||
    "farm";


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "தொகை கொடுக்கவும்"
    );

    return;

  }


  const result =
    addAccountMoney(
      "farm",
      "out",
      amount,
      note ||
        "கொல்லை செலவு",
      source
    );


  if (result) {

    const amountEl =
      document.getElementById(
        "farmAmount"
      );

    const noteEl =
      document.getElementById(
        "farmNote"
      );


    if (amountEl)
      amountEl.value = "";

    if (noteEl)
      noteEl.value = "";

  }

}


/* =========================================================
   UNIFIED EXPENSE
   ========================================================= */

function addExpense(
  note,
  amount,
  person = "",
  source = "home"
) {

  amount =
    Number(amount);


  if (
    !amount ||
    amount <= 0
  ) {

    return false;

  }


  if (
    !["salary", "home", "farm"]
      .includes(source)
  ) {

    source = "home";

  }


  const expense = {

    id:
      Date.now() +
      Math.floor(
        Math.random() * 1000
      ),

    note:
      note ||
      "செலவு",

    amount,

    person:
      person || "",

    source,

    date:
      nowText()

  };


  db.expenses.unshift(
    expense
  );


  /*
     இங்கே addAccountMoney()
     பயன்படுத்தாமல் நேரடியாக account
     update செய்கிறோம்.

     இதனால் saveDB() இரண்டு முறை
     நடக்காது.
  */

  const log = {

    id:
      Date.now() +
      Math.floor(
        Math.random() * 1000
      ),

    type: "out",

    amount,

    note:
      note ||
      "செலவு",

    source: "expense",

    date:
      nowText()

  };


  db[source].expense =
    Number(
      db[source].expense || 0
    ) + amount;


  db[source].logs.unshift(
    log
  );


  db.lastAction = {

    action: "expense",

    expenseId:
      expense.id,

    logId:
      log.id,

    account:
      source,

    amount

  };


  saveDB();

  return true;

}


/* =========================================================
   MANUAL EXPENSE
   ========================================================= */

function addExpenseManual() {

  const note =
    document.getElementById(
      "expenseNote"
    )?.value.trim() || "";


  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      )?.value
    );


  const person =
    document.getElementById(
      "expensePerson"
    )?.value.trim() || "";


  const source =
    document.getElementById(
      "expenseSource"
    )?.value ||
    "home";


  if (
    addExpense(
      note,
      amount,
      person,
      source
    )
  ) {

    const a =
      document.getElementById(
        "expenseNote"
      );

    const b =
      document.getElementById(
        "expenseAmount"
      );

    const c =
      document.getElementById(
        "expensePerson"
      );


    if (a) a.value = "";
    if (b) b.value = "";
    if (c) c.value = "";

  }

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


  if (index < 0) {
    return;
  }


  const item =
    db.expenses[index];


  const account =
    db[item.source];


  if (account) {

    account.expense =
      Math.max(
        0,
        Number(
          account.expense || 0
        ) -
        Number(
          item.amount || 0
        )
      );


    const logIndex =
      account.logs.findIndex(
        log =>
          Number(log.id) ===
          Number(item.logId)
      );


    if (logIndex >= 0) {

      account.logs.splice(
        logIndex,
        1
      );

    } else {

      /*
        பழைய data-வில் logId
        இல்லாவிட்டால் note + amount
        வைத்து தேடுகிறோம்.
      */

      const oldIndex =
        account.logs.findIndex(
          log =>
            log.type === "out" &&
            Number(log.amount) ===
              Number(item.amount) &&
            log.note ===
              item.note
        );


      if (oldIndex >= 0) {

        account.logs.splice(
          oldIndex,
          1
        );

      }

    }

  }


  db.expenses.splice(
    index,
    1
  );


  db.lastAction = null;

  saveDB();

}


/* =========================================================
   LOANS
   ========================================================= */

function addLoan() {

  const name =
    document.getElementById(
      "loanName"
    )?.value.trim() || "";


  const amount =
    Number(
      document.getElementById(
        "loanAmount"
      )?.value
    );


  const rate =
    Number(
      document.getElementById(
        "loanRate"
      )?.value
    ) || 0;


  const date =
    document.getElementById(
      "loanDate"
    )?.value ||
    todayISO();


  if (!name) {

    alert(
      "பெயர் கொடுக்கவும்"
    );

    return;

  }


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "அசல் தொகை கொடுக்கவும்"
    );

    return;

  }


  const loan = {

    id:
      Date.now() +
      Math.floor(
        Math.random() * 1000
      ),

    name,

    amount,

    rate,

    date,

    paid: 0,

    payments: []

  };


  db.loans.push(
    loan
  );


  db.lastAction = {

    action: "loan",

    loanId:
      loan.id

  };


  saveDB();


  [
    "loanName",
    "loanAmount",
    "loanRate"
  ].forEach(id => {

    const el =
      document.getElementById(id);

    if (el)
      el.value = "";

  });

}


/* =========================================================
   LOAN INTEREST
   ========================================================= */

function loanInterest(loan) {

  return (
    Number(loan.amount || 0) *
    Number(loan.rate || 0) /
    100
  );

}


function loanRemaining(loan) {

  return Math.max(
    0,
    Number(loan.amount || 0) -
    Number(loan.paid || 0)
  );

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


  const amount =
    Number(
      prompt(
        `${loan.name} கணக்கில் எவ்வளவு திருப்பி கொடுத்தார்?`
      )
    );


  if (
    !amount ||
    amount <= 0
  ) {

    return;

  }


  loan.paid =
    Number(
      loan.paid || 0
    ) + amount;


  if (
    !Array.isArray(
      loan.payments
    )
  ) {

    loan.payments = [];

  }


  loan.payments.unshift({

    amount,

    date:
      nowText()

  });


  saveDB();

}


/* =========================================================
   DELETE LOAN
   ========================================================= */

function deleteLoan(id) {

  if (
    !confirm(
      "இந்த Loan Account-ஐ அழிக்கவா?"
    )
  ) {

    return;

  }


  db.loans =
    db.loans.filter(
      x =>
        Number(x.id) !==
        Number(id)
    );


  db.lastAction = null;

  saveDB();

}


/* =========================================================
   NOTES
   ========================================================= */

function addNote(type) {

  if (
    !["temp", "perm"]
      .includes(type)
  ) {

    return;

  }


  const inputId =
    type === "temp"
      ? "tempText"
      : "permText";


  const input =
    document.getElementById(
      inputId
    );


  const text =
    input?.value.trim() || "";


  if (!text) {
    return;
  }


  const item = {

    id:
      Date.now() +
      Math.floor(
        Math.random() * 1000
      ),

    text,

    date:
      nowText()

  };


  db.notes[type].unshift(
    item
  );


  db.lastAction = {

    action: "note",

    type,

    id:
      item.id

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


  saveDB();

}


/* =========================================================
   CLEAR TEMP NOTES
   ========================================================= */

function clearTemporary() {

  if (
    !confirm(
      "அனைத்து தற்காலிக குறிப்புகளையும் அழிக்கவா?"
    )
  ) {

    return;

  }


  db.notes.temp = [];

  saveDB();

}


/* =========================================================
   REMINDER DATE/TIME PARSER
   ========================================================= */

function reminderTarget(reminder) {

  if (
    !reminder ||
    !reminder.date ||
    !reminder.time
  ) {

    return null;

  }


  const target =
    new Date(
      `${reminder.date}T${reminder.time}:00`
    );


  if (
    Number.isNaN(
      target.getTime()
    )
  ) {

    return null;

  }


  return target;

}


/* =========================================================
   ADD REMINDER
   ========================================================= */

function addReminder() {

  const text =
    document.getElementById(
      "reminderText"
    )?.value.trim() || "";


  const date =
    document.getElementById(
      "reminderDate"
    )?.value || "";


  const time =
    document.getElementById(
      "reminderTime"
    )?.value || "";


  const early =
    Number(
      document.getElementById(
        "reminderEarly"
      )?.value
    ) || 0;


  if (
    !text ||
    !date ||
    !time
  ) {

    alert(
      "நினைவூட்டல், தேதி, நேரம் கொடுக்கவும்"
    );

    return;

  }


  const target =
    new Date(
      `${date}T${time}:00`
    );


  if (
    Number.isNaN(
      target.getTime()
    )
  ) {

    alert(
      "தேதி அல்லது நேரம் சரியாக இல்லை"
    );

    return;

  }


  const reminder = {

    id:
      Date.now() +
      Math.floor(
        Math.random() * 1000
      ),

    text,

    date,

    time,

    early:
      Math.max(
        0,
        early
      ),

    done: false,

    notified: false,

    created:
      nowText()

  };


  db.reminders.push(
    reminder
  );


  db.lastAction = {

    action:
      "reminder",

    id:
      reminder.id

  };


  saveDB();


  const input =
    document.getElementById(
      "reminderText"
    );

  if (input) {
    input.value = "";
  }


  /*
     Notification permission கேட்கிறோம்.
  */

  ensureNotificationPermission();


  /*
     Reminder உடனடியாக schedule
     செய்ய முயற்சி.
  */

  scheduleReminderTimer(
    reminder
  );


  const reply =
    `⏰ ${reminder.text} - ${date} ${time} நினைவூட்டலாக வைத்துவிட்டேன்.`;

  addAIMessage(reply);

  speakText(reply);

}


/* =========================================================
   DELETE REMINDER
   ========================================================= */

function deleteReminder(id) {

  db.reminders =
    db.reminders.filter(
      x =>
        Number(x.id) !==
        Number(id)
    );


  saveDB();

}


/* =========================================================
   MARK REMINDER DONE
   ========================================================= */

function completeReminder(id) {

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

  saveDB();

}


/* =========================================================
   RESET REMINDER
   ========================================================= */

function resetReminder(id) {

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

  saveDB();

  scheduleReminderTimer(
    reminder
  );

}


/* =========================================================
   NOTIFICATION PERMISSION
   ========================================================= */

async function ensureNotificationPermission() {

  if (
    !("Notification" in window)
  ) {

    return false;

  }


  if (
    Notification.permission ===
    "granted"
  ) {

    return true;

  }


  if (
    Notification.permission ===
    "denied"
  ) {

    return false;

  }


  try {

    const permission =
      await Notification.requestPermission();

    return (
      permission ===
      "granted"
    );

  } catch (error) {

    console.error(
      "Notification permission:",
      error
    );

    return false;

  }

}


/* =========================================================
   SEND BROWSER NOTIFICATION
   ========================================================= */

function sendBrowserNotification(
  reminder
) {

  const title =
    "🎙️ ஜாக்கி நினைவூட்டல்";


  const body =
    reminder.text;


  if (
    "Notification" in window &&
    Notification.permission ===
      "granted"
  ) {

    try {

      const notification =
        new Notification(
          title,
          {
            body,
            tag:
              "jacky-reminder-" +
              reminder.id,
            renotify: true
          }
        );


      notification.onclick =
        function() {

          try {

            window.focus();

          } catch (e) {}

          notification.close();

        };

    } catch (error) {

      console.log(
        "Browser notification error:",
        error
      );

    }

  }


  speakText(
    `நினைவூட்டல். ${reminder.text}`
  );

}


/* =========================================================
   CHECK ONE REMINDER
   ========================================================= */

function checkOneReminder(
  reminder,
  now = new Date()
) {

  if (
    !reminder ||
    reminder.done ||
    reminder.notified
  ) {

    return false;

  }


  const target =
    reminderTarget(
      reminder
    );


  if (!target) {
    return false;
  }


  const earlyMs =
    Number(
      reminder.early || 0
    ) *
    60 *
    1000;


  const notifyAt =
    new Date(
      target.getTime() -
      earlyMs
    );


  /*
     Notification window:

     notifyAt முதல் target வரை.
     Page background-ல் இருந்துவிட்டு
     பின்னர் திறந்தாலும் missed reminder
     இருந்தால் அதை notify செய்யும்.
  */

  if (
    now.getTime() >=
      notifyAt.getTime() &&
    now.getTime() <=
      target.getTime() +
        5 * 60 * 1000
  ) {

    sendBrowserNotification(
      reminder
    );


    reminder.notified = true;


    return true;

  }


  return false;

}


/* =========================================================
   CHECK ALL REMINDERS
   ========================================================= */

function checkReminders() {

  const now =
    new Date();


  let changed =
    false;


  db.reminders.forEach(
    reminder => {

      if (
        checkOneReminder(
          reminder,
          now
        )
      ) {

        changed = true;

      }

    }
  );


  if (changed) {

    saveDB();

  }

}


/* =========================================================
   REMINDER TIMER
   ========================================================= */

const reminderTimers =
  new Map();


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


  const earlyMs =
    Number(
      reminder.early || 0
    ) *
    60 *
    1000;


  const notifyAt =
    target.getTime() -
    earlyMs;


  const delay =
    notifyAt -
    Date.now();


  if (delay <= 0) {

    /*
       ஏற்கனவே notification time
       கடந்திருந்தால் உடனே check.
    */

    setTimeout(
      () => {
        checkReminders();
      },
      500
    );

    return;

  }


  if (
    reminderTimers.has(
      reminder.id
    )
  ) {

    clearTimeout(
      reminderTimers.get(
        reminder.id
      )
    );

  }


  /*
     setTimeout maximum limit.
     மிக நீண்ட reminder என்றால்
     24 மணி நேரத்துக்கு ஒருமுறை
     மீண்டும் schedule செய்கிறோம்.
  */

  const MAX_DELAY =
    24 * 60 * 60 * 1000;


  const actualDelay =
    Math.min(
      delay,
      MAX_DELAY
    );


  const timer =
    setTimeout(
      () => {

        const fresh =
          db.reminders.find(
            x =>
              Number(x.id) ===
              Number(reminder.id)
          );


        if (!fresh) {
          return;
        }


        if (
          actualDelay <
          delay
        ) {

          scheduleReminderTimer(
            fresh
          );

          return;

        }


        checkReminders();

      },
      actualDelay
    );


  reminderTimers.set(
    reminder.id,
    timer
  );

}


/* =========================================================
   SCHEDULE ALL REMINDERS
   ========================================================= */

function scheduleAllReminders() {

  db.reminders.forEach(
    reminder => {

      scheduleReminderTimer(
        reminder
      );

    }
  );

}


/* =========================================================
   TEST REMINDER
   ========================================================= */

function testReminder() {

  const reminder = {

    id:
      "test-" +
      Date.now(),

    text:
      "இது ஜாக்கியின் சோதனை நினைவூட்டல்",

    date:
      todayISO(),

    time:
      currentTime(),

    early: 0,

    done: false,

    notified: false

  };


  ensureNotificationPermission()
    .then(() => {

      sendBrowserNotification(
        reminder
      );

    });

}


/* =========================================================
   PARSE AMOUNT
   ========================================================= */

function parseAmount(text) {

  if (!text) {
    return 0;
  }


  let clean =
    String(text)
      .replace(/,/g, "")
      .replace(/₹/g, "")
      .toLowerCase();


  const numberMatches =
    clean.match(
      /\d+(?:\.\d+)?/g
    );


  let numberAmount =
    0;


  if (numberMatches) {

    numberAmount =
      Number(
        numberMatches[
          numberMatches.length - 1
        ]
      ) || 0;

  }


  let wordAmount =
    0;


  const special = [

    ["ஐம்பதாயிரம்", 50000],
    ["நாற்பதாயிரம்", 40000],
    ["முப்பதாயிரம்", 30000],
    ["இருபதாயிரம்", 20000],
    ["பத்தாயிரம்", 10000],

    ["ஐம்பதாயிர", 50000],
    ["நாற்பதாயிர", 40000],
    ["முப்பதாயிர", 30000],
    ["இருபதாயிர", 20000],
    ["பத்தாயிர", 10000],

    ["ஐம்பது ஆயிரம்", 50000],
    ["நாற்பது ஆயிரம்", 40000],
    ["முப்பது ஆயிரம்", 30000],
    ["இருபது ஆயிரம்", 20000],
    ["பத்து ஆயிரம்", 10000],

    ["ஒரு லட்சம்", 100000],
    ["ஒரு லட்ச", 100000],

    ["இரண்டு லட்சம்", 200000],
    ["இரண்டு லட்ச", 200000],

    ["மூன்று லட்சம்", 300000],
    ["மூன்று லட்ச", 300000]

  ];


  for (
    const [
      word,
      value
    ] of special
  ) {

    if (
      clean.includes(
        word
      )
    ) {

      wordAmount =
        value;

      break;

    }

  }


  /*
     20 ஆயிரம்
     5 ஆயிரம்
     2.5 ஆயிரம்
  */

  if (
    clean.includes(
      "ஆயிரம்"
    ) ||
    clean.includes(
      "ஆயிர"
    )
  ) {

    if (!wordAmount) {

      const match =
        clean.match(
          /(\d+(?:\.\d+)?)\s*ஆயிர/
        );


      if (match) {

        wordAmount =
          Number(
            match[1]
          ) * 1000;

      }

    }

  }


  /*
     Tamil number + ஆயிரம்
  */

  if (
    !wordAmount &&
    (
      clean.includes(
        "ஆயிரம்"
      ) ||
      clean.includes(
        "ஆயிர"
      )
    )
  ) {

    const tamilNumbers = {

      "ஒரு": 1,
      "ஒன்று": 1,

      "இரண்டு": 2,
      "ரெண்டு": 2,

      "மூன்று": 3,
      "மூணு": 3,

      "நான்கு": 4,
      "நாலு": 4,

      "ஐந்து": 5,
      "அஞ்சு": 5,

      "ஆறு": 6,

      "ஏழு": 7,

      "எட்டு": 8,

      "ஒன்பது": 9,

      "பத்து": 10

    };


    for (
      const key in
      tamilNumbers
    ) {

      if (
        clean.includes(
          key +
          " ஆயிர"
        )
      ) {

        wordAmount =
          tamilNumbers[key] *
          1000;

        break;

      }

    }

  }


  /*
     1 லட்சம்
     2 லட்சம்
  */

  if (
    clean.includes("லட்சம்") ||
    clean.includes("லட்ச")
  ) {

    const match =
      clean.match(
        /(\d+(?:\.\d+)?)\s*லட்ச/
      );


    if (match) {

      wordAmount =
        Number(
          match[1]
        ) * 100000;

    } else if (!wordAmount) {

      wordAmount =
        100000;

    }

  }


  return Math.max(
    numberAmount,
    wordAmount
  );

}


/* =========================================================
   RATE
   ========================================================= */

function parseRate(text) {

  const t =
    String(text)
      .toLowerCase();


  const match =
    t.match(
      /(\d+(?:\.\d+)?)\s*%/
    );


  if (match) {

    return Number(
      match[1]
    );

  }


  if (
    t.includes(
      "மூன்று சதவீதம்"
    ) ||
    t.includes(
      "மூணு சதவீதம்"
    )
  ) {

    return 3;

  }


  if (
    t.includes(
      "இரண்டு சதவீதம்"
    ) ||
    t.includes(
      "ரெண்டு சதவீதம்"
    )
  ) {

    return 2;

  }


  if (
    t.includes(
      "ஒரு சதவீதம்"
    )
  ) {

    return 1;

  }


  return 2;

}


/* =========================================================
   SOURCE DETECTION
   ========================================================= */

function detectSource(text) {

  const t =
    String(text)
      .toLowerCase();


  if (
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
  ) {

    return "salary";

  }


  if (
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
  ) {

    return "home";

  }


  if (
    t.includes("கொல்லை பணத்தில்") ||
    t.includes("கொல்லை பணத்தில") ||
    t.includes("கொல்லை பணத்துல") ||
    t.includes("கொல்லை பணம்") ||
    t.includes("கொல்லைல") ||
    t.includes("farm")
  ) {

    return "farm";

  }


  return "home";

}


/* =========================================================
   INCOME ACCOUNT
   ========================================================= */

function detectIncomeAccount(text) {

  const t =
    String(text)
      .toLowerCase();


  if (
    t.includes("சம்பளம்") ||
    t.includes("சம்பள பணம்") ||
    t.includes("சம்பளம் வந்த") ||
    t.includes("சம்பளம் வாங்க") ||
    t.includes("சம்பளம் வாங்கிய") ||
    t.includes("salary")
  ) {

    return "salary";

  }


  if (
    t.includes("வீட்டு பணம்") ||
    t.includes("வீட்டில் பணம்") ||
    t.includes("வீட்டுக்கு பணம்") ||
    t.includes("வீட்டு வரவு") ||
    t.includes("வீட்டில் வரவு") ||
    t.includes("home")
  ) {

    return "home";

  }


  if (
    t.includes("கொல்லை பணம்") ||
    t.includes("கொல்லை வரவு") ||
    t.includes("farm")
  ) {

    return "farm";

  }


  return null;

}


/* =========================================================
   INCOME DETECTION
   ========================================================= */

function isIncomeMessage(text) {

  const t =
    String(text)
      .toLowerCase();


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
    word =>
      t.includes(word)
  );

}


/* =========================================================
   EXPENSE DETECTION
   ========================================================= */

function isExpenseMessage(text) {

  const t =
    String(text)
      .toLowerCase();


  const words = [

    "செலவு",
    "செலவானது",
    "செலவு செய்தேன்",
    "செலவு பண்ணினேன்",
    "செலவு பண்ணேன்",

    "வாங்கினேன்",
    "வாங்கிட்டேன்",
    "வாங்குனேன்",

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
    word =>
      t.includes(word)
  );

}


/* =========================================================
   PERSON EXTRACTION
   ========================================================= */

function extractPerson(text) {

  let match =
    String(text).match(
      /([A-Za-z\u0B80-\u0BFF]{2,})\s*(?:க்கு|கிட்ட|கணக்கில்|கணக்குல)/
    );


  if (match) {

    return match[1];

  }


  match =
    String(text).match(
      /(?:க்கு|கிட்ட)\s*([A-Za-z\u0B80-\u0BFF]{2,})/
    );


  if (match) {

    return match[1];

  }


  return "";

}


/* =========================================================
   EXPENSE NOTE
   ========================================================= */

function detectExpenseNote(text) {

  const t =
    String(text)
      .toLowerCase();


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


  for (
    const item of items
  ) {

    if (
      t.includes(item)
    ) {

      return item;

    }

  }


  return "செலவு";

}


/* =========================================================
   INCOME HANDLER
   ========================================================= */

function handleIncome(text) {

  const account =
    detectIncomeAccount(text);


  const amount =
    parseAmount(text);


  if (!account) {

    return false;

  }


  if (!amount) {

    const reply =
      "எவ்வளவு பணம் வந்தது என்று சொல்லுங்கள்.";

    addAIMessage(reply);

    speakText(reply);

    return true;

  }


  let note =
    "வரவு";


  if (
    account ===
    "salary"
  ) {

    note =
      "சம்பள வரவு";

  }


  if (
    account ===
    "home"
  ) {

    note =
      "வீட்டு வரவு";

  }


  if (
    account ===
    "farm"
  ) {

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

    salary:
      "சம்பள கணக்கில்",

    home:
      "வீட்டு கணக்கில்",

    farm:
      "கொல்லை கணக்கில்"

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

function handleExpense(text) {

  const amount =
    parseAmount(text);


  if (!amount) {

    const reply =
      "செலவு தொகையை சொல்லுங்கள்.";

    addAIMessage(reply);

    speakText(reply);

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

    salary:
      "சம்பள பணத்தில் இருந்து",

    home:
      "வீட்டு பணத்தில் இருந்து",

    farm:
      "கொல்லை பணத்தில் இருந்து"

  };


  let reply =
    `${sourceName[source]} ${money(amount)} ${note} செலவு சேர்த்துவிட்டேன்.`;


  if (person) {

    reply +=
      ` (${person})`;

  }


  addAIMessage(reply);

  speakText(reply);

  return true;

}


/* =========================================================
   CHAT UI
   ========================================================= */

function addUserMessage(text) {

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
    text;


  box.appendChild(
    div
  );


  box.scrollTop =
    box.scrollHeight;

}


function addAIMessage(text) {

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
    text;


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


  box.innerHTML = `

    <div class="message ai">
      வணக்கம்! நான் ஜாக்கி.
      பணம், செலவு, சம்பளம், வட்டி,
      குறிப்பு, நினைவூட்டல் போன்றவற்றை
      சொல்லுங்கள்.
    </div>

  `;

}


/* =========================================================
   QUERY HANDLER
   ========================================================= */

function handleQuery(text) {

  const t =
    String(text)
      .toLowerCase();


  /* -----------------------------------------
     SALARY TOTAL
  ----------------------------------------- */

  if (
    t.includes("சம்பள வரவு") &&
    (
      t.includes("எவ்வளவு") ||
      t.includes("மொத்தம்")
    )
  ) {

    const reply =
      `சம்பள வரவு மொத்தம் ${money(
        db.salary.income
      )}.`;


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
      t.includes("சம்பள கணக்கு")
    ) &&
    (
      t.includes("எவ்வளவு") ||
      t.includes("மீதி")
    )
  ) {

    const reply =
      `சம்பள பணம் மீதி ${money(
        balance("salary")
      )}.`;


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
      t.includes("மீதி")
    )
  ) {

    const reply =
      `வீட்டு பணம் மீதி ${money(
        balance("home")
      )}.`;


    addAIMessage(reply);

    speakText(reply);

    return true;

  }


  /* -----------------------------------------
     FARM BALANCE
  ----------------------------------------- */

  if (
    (
      t.includes("கொல்லை பணம்") ||
      t.includes("கொல்லை கணக்கு") ||
      t.includes("கொல்லை மீதி")
    ) &&
    (
      t.includes("எவ்வளவு") ||
      t.includes("மீதி")
    )
  ) {

    const reply =
      `கொல்லை பணம் மீதி ${money(
        balance("farm")
      )}.`;


    addAIMessage(reply);

    speakText(reply);

    return true;

  }


  /* -----------------------------------------
     TOTAL EXPENSE
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
          Number(
            item.amount || 0
          ),
        0
      );


    const reply =
      `மொத்த செலவு ${money(total)}.`;


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
        x => !x.done
      );


    if (!active.length) {

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
      ).join("\n");


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
    t.includes("யாருக்கெல்லாம்") &&
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
            `${x.name} - ${money(
              loanRemaining(x)
            )} - ${x.rate}%`
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
            x.name
              .toLowerCase()
              .includes(
                person.toLowerCase()
              )
        );


      if (
        loans.length
      ) {

        let total =
          0;

        let interest =
          0;


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

  if (!db.lastAction) {

    const reply =
      "நீக்குவதற்கு சமீபத்திய பதிவு இல்லை.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }


  const action =
    db.lastAction;


  /* ACCOUNT */

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
        Number(
          account[field] || 0
        ) -
        Number(
          action.amount || 0
        )
      );


    const index =
      account.logs.findIndex(
        log =>
          Number(log.id) ===
          Number(action.logId)
      );


    if (index >= 0) {

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


  /* EXPENSE */

  if (
    action.action ===
    "expense"
  ) {

    const index =
      db.expenses.findIndex(
        x =>
          Number(x.id) ===
          Number(
            action.expenseId
          )
      );


    if (index >= 0) {

      const item =
        db.expenses[index];


      const account =
        db[action.account];


      if (account) {

        account.expense =
          Math.max(
            0,
            Number(
              account.expense || 0
            ) -
            Number(
              action.amount || 0
            )
          );


        const logIndex =
          account.logs.findIndex(
            log =>
              Number(log.id) ===
              Number(
                action.logId
              )
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


  /* LOAN */

  if (
    action.action ===
    "loan"
  ) {

    db.loans =
      db.loans.filter(
        x =>
          Number(x.id) !==
          Number(
            action.loanId
          )
      );


    db.lastAction = null;

    saveDB();


    const reply =
      "கடைசி வட்டி கணக்கு நீக்கிவிட்டேன்.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }


  /* NOTE */

  if (
    action.action ===
    "note"
  ) {

    if (
      db.notes[action.type]
    ) {

      db.notes[action.type] =
        db.notes[
          action.type
        ].filter(
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


  /* REMINDER */

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
    text.toLowerCase();


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
     REMINDER - NATURAL LANGUAGE
  ----------------------------------------- */

  if (
    t.includes("நினைவூட்டு") ||
    t.includes("நினைவூட்டல்") ||
    t.includes("ஞாபகப்படுத்து")
  ) {

    const amount =
      parseAmount(text);


    /*
       Voice reminder-க்கு
       basic text reminder மட்டும்
       இங்கே note ஆக வைத்திருக்கிறோம்.

       Date/time form மூலம் exact
       reminder சேர்க்கலாம்.
    */

    if (
      t.includes("இன்று") &&
      (
        t.includes("மணி") ||
        t.match(/\d{1,2}:\d{2}/)
      )
    ) {

      createNaturalReminder(
        text
      );

      return;

    }

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

      id:
        Date.now() +
        Math.floor(
          Math.random() * 1000
        ),

      name,

      amount,

      rate,

      date:
        todayISO(),

      paid: 0,

      payments: []

    };


    db.loans.push(
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

      id:
        Date.now() +
        Math.floor(
          Math.random() * 1000
        ),

      text,

      date:
        nowText()

    };


    db.notes.temp.unshift(
      item
    );


    db.lastAction = {

      action:
        "note",

      type:
        "temp",

      id:
        item.id

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
    "புரிந்துகொண்டேன். " +
    "பணம் அல்லது செலவு என்றால் தொகையுடன் சொல்லுங்கள். " +
    "உதாரணம்: “சம்பளம் வந்தது 20000”, " +
    "“சம்பள பணத்தில் இருந்து பெட்ரோல் 300”, " +
    "“வீட்டு பணத்தில் டீ 200”.";


  addAIMessage(reply);

  speakText(reply);

}


/* =========================================================
   NATURAL REMINDER CREATION
   ========================================================= */

function createNaturalReminder(text) {

  const t =
    text.toLowerCase();


  /*
     நேரத்தை கண்டுபிடிக்க:
     5:30
     05:30
  */

  let hour = null;
  let minute = 0;


  const timeMatch =
    t.match(
      /(\d{1,2})[:.](\d{2})/
    );


  if (timeMatch) {

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


    if (hourMatch) {

      hour =
        Number(
          hourMatch[1]
        );

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
      "நினைவூட்ட நேரத்தை 24 மணி முறையில் 17:30 போல சொல்லுங்கள்.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }


  const date =
    todayISO();


  const time =
    String(hour)
      .padStart(2, "0") +
    ":" +
    String(minute)
      .padStart(2, "0");


  const reminder = {

    id:
      Date.now() +
      Math.floor(
        Math.random() * 1000
      ),

    text,

    date,

    time,

    early: 0,

    done: false,

    notified: false,

    created:
      nowText()

  };


  db.reminders.push(
    reminder
  );


  db.lastAction = {

    action:
      "reminder",

    id:
      reminder.id

  };


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

let recognition =
  null;


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


  if (recognition) {

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

      let finalText =
        "";

      let interimText =
        "";


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


      if (finalText) {

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

  if (recognition) {

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
          Number(
            item.amount || 0
          ),
        0
      );


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
   DELETE SALARY LOG
   ========================================================= */

function deleteSalaryLog(id) {

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
    item.type === "in"
  ) {

    db.salary.income =
      Math.max(
        0,
        db.salary.income -
        item.amount
      );

  } else {

    db.salary.expense =
      Math.max(
        0,
        db.salary.expense -
        item.amount
      );

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
   DELETE HOME LOG
   ========================================================= */

function deleteHomeLog(id) {

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
    item.type === "in"
  ) {

    db.home.income =
      Math.max(
        0,
        db.home.income -
        item.amount
      );

  } else {

    db.home.expense =
      Math.max(
        0,
        db.home.expense -
        item.amount
      );

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


  list.innerHTML =
    db.farm.logs
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
            onclick="deleteFarmLog(${item.id})">
            அழி
          </button>

        </div>

      `
      )
      .join("");

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


  if (index < 0) {
    return;
  }


  const item =
    db.farm.logs[index];


  if (
    item.type === "in"
  ) {

    db.farm.income =
      Math.max(
        0,
        db.farm.income -
        item.amount
      );

  } else {

    db.farm.expense =
      Math.max(
        0,
        db.farm.expense -
        item.amount
      );

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

              ${sourceTamil(
                item.source
              )}

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
   SOURCE TAMIL
   ========================================================= */

function sourceTamil(
  source
) {

  if (
    source === "salary"
  ) {

    return "💵 சம்பள பணம்";

  }


  if (
    source === "farm"
  ) {

    return "🌾 கொல்லை பணம்";

  }


  return "🏠 வீட்டு பணம்";

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
                      @ ${loan.rate}%
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

  /*
     முதல் check உடனே.
  */

  checkReminders();


  /*
     15 seconds polling.
     பழைய 30 seconds-ஐ விட வேகமாக.
  */

  setInterval(
    checkReminders,
    15000
  );


  setInterval(
    renderReminders,
    15000
  );


  /*
     Page மீண்டும் foreground-க்கு
     வந்தவுடன் missed reminder check.
  */

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


  /*
     Default reminder date.
  */

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


  /*
     Notification permission கேட்க
     button இல்லாவிட்டாலும் browser
     permission state மட்டும் பார்க்கிறோம்.
  */

  console.log(
    "🎙️ JACKY AI v7 READY"
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
   EXPORT GLOBAL FUNCTIONS
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