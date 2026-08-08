/* =========================================================
   🎙️ ஜாக்கி - SMART PA
   APP.JS - FULL VERSION
   =========================================================

   முக்கிய கணக்கு விதிகள்:

   💵 சம்பளம்
      - வரவு
      - செலவு
      - மீதி

   🏠 வீடு
      - வரவு
      - செலவு
      - மீதி

   🌾 கொல்லை
      - வரவு இல்லை
      - balance இல்லை
      - செலவு tracking மட்டும்
      - செலவு எந்த source-லிருந்து வந்தது
        என்பதும் சேமிக்கப்படும்

   Example:
   "சம்பள பணத்தில் இருந்து கொல்லைக்கு மருந்து 500"

   💵 சம்பளம் -> செலவு 500
   🌾 கொல்லை -> மருந்து செலவு 500

   ஒரே ₹500 தான் பணத்திலிருந்து கழிக்கப்படும்.

   ========================================================= */


/* =========================================================
   DATABASE
   ========================================================= */

const DB_KEY = "balaji_pa_db_v13";

let db = {
  version: 13,

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
     FARM HAS NO INCOME.
     FARM IS EXPENSE TRACKING ONLY.
  */
  farm: {
    logs: []
  },

  /*
     Every expense is stored here.

     source:
       salary
       home
       cash

     category:
       farm
       general

     If category = farm,
     it is a farm expense.
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


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function money(value) {

  const n =
    Number(value || 0);

  return (
    "₹" +
    n.toLocaleString("en-IN", {
      maximumFractionDigits: 2
    })
  );

}


function nowText() {

  return new Date().toLocaleString(
    "en-IN",
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

  return (
    y +
    "-" +
    m +
    "-" +
    day
  );

}


function currentTime() {

  const d = new Date();

  return (
    String(
      d.getHours()
    ).padStart(2, "0") +
    ":" +
    String(
      d.getMinutes()
    ).padStart(2, "0")
  );

}


function escapeHTML(value) {

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
   ID
   ========================================================= */

function newId() {

  return (
    Date.now() +
    Math.floor(
      Math.random() * 100000
    )
  );

}


/* =========================================================
   LOAD DATABASE
   ========================================================= */

function loadDB() {

  try {

    const raw =
      localStorage.getItem(
        DB_KEY
      );

    if (raw) {

      const saved =
        JSON.parse(raw);

      db = normalizeDB(
        saved
      );

      return;

    }


    /*
       OLD DATABASE COMPATIBILITY
    */

    const oldKeys = [
      "balaji_pa_db_v12",
      "balaji_pa_db_v11",
      "balaji_pa_db_v10"
    ];


    for (
      const key of oldKeys
    ) {

      try {

        const oldRaw =
          localStorage.getItem(
            key
          );

        if (!oldRaw) {
          continue;
        }

        const oldDB =
          JSON.parse(
            oldRaw
          );

        db =
          migrateOldDB(
            oldDB
          );

        saveDB();

        return;

      } catch (e) {

        console.log(
          "Old DB migration error:",
          e
        );

      }

    }

  } catch (error) {

    console.error(
      "loadDB:",
      error
    );

  }

}


/* =========================================================
   NORMALIZE DATABASE
   ========================================================= */

function normalizeDB(data) {

  const base = {
    version: 13,

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


  if (
    data &&
    typeof data === "object"
  ) {

    Object.assign(
      base,
      data
    );

  }


  if (
    !base.salary ||
    typeof base.salary !== "object"
  ) {

    base.salary = {
      income: 0,
      expense: 0,
      logs: []
    };

  }


  if (
    !base.home ||
    typeof base.home !== "object"
  ) {

    base.home = {
      income: 0,
      expense: 0,
      logs: []
    };

  }


  if (
    !base.farm ||
    typeof base.farm !== "object"
  ) {

    base.farm = {
      logs: []
    };

  }


  if (
    !Array.isArray(
      base.salary.logs
    )
  ) {

    base.salary.logs = [];

  }


  if (
    !Array.isArray(
      base.home.logs
    )
  ) {

    base.home.logs = [];

  }


  if (
    !Array.isArray(
      base.farm.logs
    )
  ) {

    base.farm.logs = [];

  }


  if (
    !Array.isArray(
      base.expenses
    )
  ) {

    base.expenses = [];

  }


  if (
    !Array.isArray(
      base.loans
    )
  ) {

    base.loans = [];

  }


  if (
    !base.notes ||
    typeof base.notes !== "object"
  ) {

    base.notes = {
      temp: [],
      perm: []
    };

  }


  if (
    !Array.isArray(
      base.notes.temp
    )
  ) {

    base.notes.temp = [];

  }


  if (
    !Array.isArray(
      base.notes.perm
    )
  ) {

    base.notes.perm = [];

  }


  if (
    !Array.isArray(
      base.reminders
    )
  ) {

    base.reminders = [];

  }


  /*
     FARM INCOME IS NEVER USED.
  */

  delete base.farm.income;

  delete base.farm.balance;


  /*
     Ensure numbers.
  */

  base.salary.income =
    Number(
      base.salary.income || 0
    );

  base.salary.expense =
    Number(
      base.salary.expense || 0
    );

  base.home.income =
    Number(
      base.home.income || 0
    );

  base.home.expense =
    Number(
      base.home.expense || 0
    );


  /*
     Ensure IDs.
  */

  base.salary.logs.forEach(
    x => {

      if (!x.id) {
        x.id = newId();
      }

      x.amount =
        Number(
          x.amount || 0
        );

    }
  );


  base.home.logs.forEach(
    x => {

      if (!x.id) {
        x.id = newId();
      }

      x.amount =
        Number(
          x.amount || 0
        );

    }
  );


  base.expenses.forEach(
    x => {

      if (!x.id) {
        x.id = newId();
      }

      x.amount =
        Number(
          x.amount || 0
        );

      if (
        !x.source
      ) {

        x.source =
          "home";

      }

      if (
        !x.category
      ) {

        x.category =
          "general";

      }

    }
  );


  base.loans.forEach(
    x => {

      if (!x.id) {
        x.id = newId();
      }

      x.amount =
        Number(
          x.amount || 0
        );

      x.rate =
        Number(
          x.rate || 0
        );

      x.paid =
        Number(
          x.paid || 0
        );

      if (
        !Array.isArray(
          x.payments
        )
      ) {

        x.payments = [];

      }

    }
  );


  return base;

}


/* =========================================================
   OLD DATABASE MIGRATION
   ========================================================= */

function migrateOldDB(old) {

  const fresh = {
    version: 13,

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


  if (!old) {
    return fresh;
  }


  /*
     New-style old DB
  */

  if (
    old.salary &&
    typeof old.salary === "object"
  ) {

    fresh.salary =
      old.salary;

  }


  if (
    old.home &&
    typeof old.home === "object"
  ) {

    fresh.home =
      old.home;

  }


  if (
    Array.isArray(
      old.loans
    )
  ) {

    fresh.loans =
      old.loans;

  }


  if (
    old.notes
  ) {

    fresh.notes =
      old.notes;

  }


  if (
    Array.isArray(
      old.reminders
    )
  ) {

    fresh.reminders =
      old.reminders;

  }


  /*
     Old farm logs:
     Convert only expense entries.
  */

  if (
    Array.isArray(
      old.farmLogs
    )
  ) {

    old.farmLogs.forEach(
      item => {

        const amount =
          Number(
            item.amount ??
            item.amt ??
            0
          );

        if (
          amount <= 0
        ) {
          return;
        }


        const expense = {

          id:
            item.id ||
            newId(),

          note:
            item.note ||
            "கொல்லை செலவு",

          amount,

          source:
            item.source ||
            "home",

          category:
            "farm",

          person:
            item.person ||
            "",

          date:
            item.date ||
            nowText()

        };


        fresh.expenses.push(
          expense
        );


        fresh.farm.logs.push(
          {
            ...expense
          }
        );

      }
    );

  }


  /*
     Old expenses
  */

  if (
    Array.isArray(
      old.expenses
    )
  ) {

    old.expenses.forEach(
      item => {

        const expense = {
          ...item,

          id:
            item.id ||
            newId(),

          amount:
            Number(
              item.amount || 0
            ),

          source:
            item.source ||
            "home",

          category:
            item.category ||
            (
              item.farm
                ? "farm"
                : "general"
            )

        };


        fresh.expenses.push(
          expense
        );


        if (
          expense.category ===
          "farm"
        ) {

          fresh.farm.logs.push(
            {
              ...expense
            }
          );

        }

      }
    );

  }


  /*
     Old top-level salary fields
  */

  if (
    old.salIn !== undefined
  ) {

    fresh.salary.income =
      Number(
        old.salIn || 0
      );

  }


  if (
    old.salOut !== undefined
  ) {

    fresh.salary.expense =
      Number(
        old.salOut || 0
      );

  }


  /*
     Old top-level home fields
  */

  if (
    old.homeIn !== undefined
  ) {

    fresh.home.income =
      Number(
        old.homeIn || 0
      );

  }


  if (
    old.homeOut !== undefined
  ) {

    fresh.home.expense =
      Number(
        old.homeOut || 0
      );

  }


  return normalizeDB(
    fresh
  );

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
      "saveDB:",
      error
    );

  }


  renderAll();

}


/* =========================================================
   ACCOUNT BALANCE
   ========================================================= */

function balance(account) {

  if (
    account === "salary"
  ) {

    return Math.max(
      0,
      Number(
        db.salary.income || 0
      ) -
      Number(
        db.salary.expense || 0
      )
    );

  }


  if (
    account === "home"
  ) {

    return Math.max(
      0,
      Number(
        db.home.income || 0
      ) -
      Number(
        db.home.expense || 0
      )
    );

  }


  /*
     FARM HAS NO BALANCE.
  */

  return 0;

}


/* =========================================================
   SOURCE BALANCE
   ========================================================= */

function sourceBalance(source) {

  if (
    source === "salary"
  ) {

    return balance(
      "salary"
    );

  }


  if (
    source === "home"
  ) {

    return balance(
      "home"
    );

  }


  /*
     Cash is not maintained
     as a separate account unless
     manually enabled later.
  */

  return Infinity;

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


  if (
    source === "farm"
  ) {

    return "🌾 கொல்லை";

  }


  if (
    source === "cash"
  ) {

    return "💰 கை காசு";

  }


  return "🏠 வீட்டு பணம்";

}


/* =========================================================
   ACCOUNT MONEY
   ========================================================= */

function addAccountMoney(
  account,
  type,
  amount,
  note,
  mode = "manual"
) {

  amount =
    Number(amount || 0);


  if (
    amount <= 0
  ) {

    return false;

  }


  if (
    !["salary", "home"]
      .includes(account)
  ) {

    return false;

  }


  const obj =
    db[account];


  const log = {

    id:
      newId(),

    type,

    amount,

    note:
      note ||
      (
        type === "in"
          ? "வரவு"
          : "செலவு"
      ),

    date:
      nowText(),

    mode

  };


  if (
    type === "in"
  ) {

    obj.income =
      Number(
        obj.income || 0
      ) +
      amount;

  } else {

    obj.expense =
      Number(
        obj.expense || 0
      ) +
      amount;

  }


  obj.logs.unshift(
    log
  );


  db.lastAction = {

    action:
      "account",

    account,

    type,

    amount,

    logId:
      log.id

  };


  saveDB();

  return true;

}


/* =========================================================
   SALARY MANUAL
   ========================================================= */

function addSalary(type) {

  const input =
    document.getElementById(
      "salaryAmount"
    ) ||
    document.getElementById(
      "salAmt"
    ) ||
    document.getElementById(
      "salaryAmt"
    );


  const noteInput =
    document.getElementById(
      "salaryNote"
    );


  const amount =
    Number(
      input?.value || 0
    );


  const note =
    noteInput?.value.trim() ||
    (
      type === "in"
        ? "சம்பள வரவு"
        : "சம்பள செலவு"
    );


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "தொகையை கொடுக்கவும்"
    );

    return;

  }


  if (
    type === "out" &&
    amount >
      balance("salary")
  ) {

    alert(
      "சம்பள கணக்கில் போதுமான பணம் இல்லை."
    );

    return;

  }


  addAccountMoney(
    "salary",
    type,
    amount,
    note,
    "manual"
  );


  if (input) {
    input.value = "";
  }

  if (noteInput) {
    noteInput.value = "";
  }

}


/* =========================================================
   HOME MANUAL
   ========================================================= */

function addHome(type) {

  const input =
    document.getElementById(
      "homeAmount"
    ) ||
    document.getElementById(
      "homeAmt"
    );


  const noteInput =
    document.getElementById(
      "homeNote"
    );


  const amount =
    Number(
      input?.value || 0
    );


  const note =
    noteInput?.value.trim() ||
    (
      type === "in"
        ? "வீட்டு வரவு"
        : "வீட்டு செலவு"
    );


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "தொகையை கொடுக்கவும்"
    );

    return;

  }


  if (
    type === "out" &&
    amount >
      balance("home")
  ) {

    alert(
      "வீட்டு கணக்கில் போதுமான பணம் இல்லை."
    );

    return;

  }


  addAccountMoney(
    "home",
    type,
    amount,
    note,
    "manual"
  );


  if (input) {
    input.value = "";
  }

  if (noteInput) {
    noteInput.value = "";
  }

}


/* =========================================================
   FARM EXPENSE
   =========================================================

   IMPORTANT:

   Farm does NOT have income.

   Every farm expense:
      1. Goes into db.expenses
      2. Goes into db.farm.logs
      3. Reduces selected source account

   ========================================================= */

function addExpense(
  note,
  amount,
  person = "",
  source = "home"
) {

  amount =
    Number(amount || 0);


  if (
    amount <= 0
  ) {

    return false;

  }


  source =
    source === "salary"
      ? "salary"
      : source === "cash"
        ? "cash"
        : "home";


  /*
     Cash is allowed as a source
     without changing salary/home.
  */

  if (
    source !== "cash" &&
    amount >
      balance(source)
  ) {

    const sourceName =
      source === "salary"
        ? "சம்பள"
        : "வீட்டு";


    const reply =
      `${sourceName} கணக்கில் போதுமான பணம் இல்லை.`;

    addAIMessage(reply);

    speakText(reply);

    return false;

  }


  /*
     Reduce source account.
  */

  if (
    source === "salary"
  ) {

    db.salary.expense =
      Number(
        db.salary.expense || 0
      ) +
      amount;

  }


  if (
    source === "home"
  ) {

    db.home.expense =
      Number(
        db.home.expense || 0
      ) +
      amount;

  }


  const id =
    newId();


  const expense = {

    id,

    note:
      note ||
      "கொல்லை செலவு",

    amount,

    source,

    category:
      "farm",

    person:
      person || "",

    date:
      nowText()

  };


  /*
     Master expense list.
  */

  db.expenses.unshift(
    expense
  );


  /*
     Farm detail list.
  */

  db.farm.logs.unshift(
    {
      ...expense
    }
  );


  db.lastAction = {

    action:
      "expense",

    expenseId:
      id,

    account:
      source,

    amount,

    logId:
      id

  };


  saveDB();

  return true;

}


/* =========================================================
   MANUAL FARM EXPENSE
   ========================================================= */

function addFarm() {

  const noteInput =
    document.getElementById(
      "farmNote"
    );


  const amountInput =
    document.getElementById(
      "farmAmount"
    ) ||
    document.getElementById(
      "farmAmt"
    );


  const sourceInput =
    document.getElementById(
      "farmSource"
    );


  const note =
    noteInput?.value.trim() ||
    "கொல்லை செலவு";


  const amount =
    Number(
      amountInput?.value || 0
    );


  const source =
    sourceInput?.value ||
    "home";


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "கொல்லை செலவு தொகையை கொடுக்கவும்."
    );

    return;

  }


  if (
    addExpense(
      note,
      amount,
      "",
      source
    )
  ) {

    if (noteInput) {
      noteInput.value = "";
    }

    if (amountInput) {
      amountInput.value = "";
    }

  }

}


/* =========================================================
   GENERAL EXPENSE
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


  const sourceInput =
    document.getElementById(
      "expenseSource"
    );


  const categoryInput =
    document.getElementById(
      "expenseCategory"
    );


  const note =
    noteInput?.value.trim() ||
    "செலவு";


  const amount =
    Number(
      amountInput?.value || 0
    );


  const source =
    sourceInput?.value ||
    "home";


  const category =
    categoryInput?.value ||
    "general";


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "செலவு தொகையை கொடுக்கவும்."
    );

    return;

  }


  /*
     General expense.
     Farm expense should use addFarm().
  */

  if (
    category === "farm"
  ) {

    addExpense(
      note,
      amount,
      "",
      source
    );

  } else {

    if (
      source !== "cash" &&
      amount >
        balance(source)
    ) {

      alert(
        "தேர்ந்தெடுத்த கணக்கில் போதுமான பணம் இல்லை."
      );

      return;

    }


    if (
      source === "salary"
    ) {

      db.salary.expense +=
        amount;

    }


    if (
      source === "home"
    ) {

      db.home.expense +=
        amount;

    }


    const item = {

      id:
        newId(),

      note,

      amount,

      source,

      category:
        "general",

      person:
        "",

      date:
        nowText()

    };


    db.expenses.unshift(
      item
    );


    db.lastAction = {

      action:
        "expense",

      expenseId:
        item.id,

      account:
        source,

      amount,

      logId:
        item.id

    };


    saveDB();

  }


  if (noteInput) {
    noteInput.value = "";
  }

  if (amountInput) {
    amountInput.value = "";
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


  if (
    !confirm(
      `${item.note} ${money(item.amount)} செலவை அழிக்கவா?`
    )
  ) {

    return;

  }


  /*
     Reverse source account.
  */

  if (
    item.source === "salary"
  ) {

    db.salary.expense =
      Math.max(
        0,
        Number(
          db.salary.expense || 0
        ) -
        Number(
          item.amount || 0
        )
      );

  }


  if (
    item.source === "home"
  ) {

    db.home.expense =
      Math.max(
        0,
        Number(
          db.home.expense || 0
        ) -
        Number(
          item.amount || 0
        )
      );

  }


  /*
     Remove master expense.
  */

  db.expenses.splice(
    index,
    1
  );


  /*
     Remove farm copy.
  */

  db.farm.logs =
    db.farm.logs.filter(
      x =>
        Number(x.id) !==
        Number(item.id)
    );


  db.lastAction = null;

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
    !confirm(
      `${money(item.amount)} பதிவை அழிக்கவா?`
    )
  ) {

    return;

  }


  if (
    item.type === "in"
  ) {

    db.salary.income =
      Math.max(
        0,
        db.salary.income -
        Number(item.amount || 0)
      );

  } else {

    db.salary.expense =
      Math.max(
        0,
        db.salary.expense -
        Number(item.amount || 0)
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
    !confirm(
      `${money(item.amount)} பதிவை அழிக்கவா?`
    )
  ) {

    return;

  }


  if (
    item.type === "in"
  ) {

    db.home.income =
      Math.max(
        0,
        db.home.income -
        Number(item.amount || 0)
      );

  } else {

    db.home.expense =
      Math.max(
        0,
        db.home.expense -
        Number(item.amount || 0)
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

  /*
     Farm log is a mirror of expense.
     Delete through master expense.
  */

  deleteExpense(id);

}


/* =========================================================
   LOAN
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


  const name =
    nameInput?.value.trim() ||
    "";


  const amount =
    Number(
      amountInput?.value || 0
    );


  const rate =
    Number(
      rateInput?.value || 0
    );


  if (!name) {

    alert(
      "பெயரை கொடுக்கவும்."
    );

    return;

  }


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "அசல் தொகையை கொடுக்கவும்."
    );

    return;

  }


  const loan = {

    id:
      newId(),

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

    action:
      "loan",

    loanId:
      loan.id

  };


  saveDB();


  if (nameInput) {
    nameInput.value = "";
  }

  if (amountInput) {
    amountInput.value = "";
  }

  if (rateInput) {
    rateInput.value = "";
  }

}


/* =========================================================
   LOAN INTEREST
   ========================================================= */

function loanInterest(loan) {

  return (
    Number(
      loan.amount || 0
    ) *
    Number(
      loan.rate || 0
    ) /
    100
  );

}


/* =========================================================
   LOAN REMAINING
   ========================================================= */

function loanRemaining(loan) {

  return Math.max(
    0,
    Number(
      loan.amount || 0
    ) -
    Number(
      loan.paid || 0
    )
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


  const remaining =
    loanRemaining(
      loan
    );


  if (
    amount > remaining
  ) {

    alert(
      `மீதம் ${money(remaining)} மட்டுமே உள்ளது.`
    );

    return;

  }


  loan.paid =
    Number(
      loan.paid || 0
    ) +
    amount;


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
    input?.value.trim() ||
    "";


  if (!text) {
    return;
  }


  const item = {

    id:
      newId(),

    text,

    date:
      nowText()

  };


  db.notes[type].unshift(
    item
  );


  db.lastAction = {

    action:
      "note",

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
      newId(),

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


  ensureNotificationPermission();

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

  const timer =
    reminderTimers.get(
      id
    );


  if (timer) {

    clearTimeout(
      timer
    );

    reminderTimers.delete(
      id
    );

  }


  db.reminders =
    db.reminders.filter(
      x =>
        Number(x.id) !==
        Number(id)
    );


  saveDB();

}


/* =========================================================
   COMPLETE REMINDER
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

  const timer =
    reminderTimers.get(
      reminder.id
    );


  if (timer) {

    clearTimeout(
      timer
    );

    reminderTimers.delete(
      reminder.id
    );

  }


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

            renotify:
              true
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


    reminder.notified =
      true;


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


  if (
    reminder.done ||
    reminder.notified
  ) {

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


  const MAX_DELAY =
    24 *
    60 *
    60 *
    1000;


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
    .then(
      () => {

        sendBrowserNotification(
          reminder
        );

      }
    );

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


  if (
    clean.includes("ஆயிரம்") ||
    clean.includes("ஆயிர")
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
          ) *
          1000;

      }

    }

  }


  if (
    !wordAmount &&
    (
      clean.includes("ஆயிரம்") ||
      clean.includes("ஆயிர")
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
        ) *
        100000;

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
    t.includes("மூன்று சதவீதம்") ||
    t.includes("மூணு சதவீதம்")
  ) {

    return 3;

  }


  if (
    t.includes("இரண்டு சதவீதம்") ||
    t.includes("ரெண்டு சதவீதம்")
  ) {

    return 2;

  }


  if (
    t.includes("ஒரு சதவீதம்")
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
    t.includes("கையில் இருந்து") ||
    t.includes("கையிலிருந்து") ||
    t.includes("கை காசு") ||
    t.includes("கைக்காசு") ||
    t.includes("cash")
  ) {

    return "cash";

  }


  /*
     IMPORTANT:
     Default is HOME for normal expenses.
     Farm is NOT a money source.
  */

  return "home";

}


/* =========================================================
   INCOME ACCOUNT DETECTION
   ========================================================= */

function detectIncomeAccount(
  text
) {

  const t =
    String(text)
      .toLowerCase();


  /*
     Salary income
  */

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


  /*
     Home income means:
     money came FROM HOME / family gave money.
  */

  if (
    t.includes("வீட்டில் இருந்து") ||
    t.includes("வீட்டிலிருந்து") ||
    t.includes("வீட்டில் பணம்") ||
    t.includes("வீட்டில பணம்") ||
    t.includes("வீட்டிலிருந்து பணம்") ||
    t.includes("வீட்டில் இருந்து பணம்") ||
    t.includes("வீட்டுப் பணம்") ||
    t.includes("வீட்டு பணம்") ||
    t.includes("வீட்டுக்கு பணம்")
  ) {

    return "home";

  }


  return null;

}


/* =========================================================
   INCOME DETECTION
   ========================================================= */

function isIncomeMessage(
  text
) {

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
    "பெற்றேன்",
    "கொடுத்திருக்காங்க",
    "கொடுத்திருக்கிறார்",
    "கொடுத்திருக்கிறார்கள்"

  ];


  return words.some(
    word =>
      t.includes(word)
  );

}


/* =========================================================
   EXPENSE DETECTION
   ========================================================= */

function isExpenseMessage(
  text
) {

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

    "குடித்தேன்",
    "சாப்பிட்டேன்",

    "பெட்ரோல்",
    "டீசல்",
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
    "பஸ்",
    "ஆட்டோ",
    "பால்",
    "மளிகை",
    "பில்",
    "மின்சாரம்",
    "தண்ணீர்",

    /*
       Farm-specific words
    */

    "கொல்லை",
    "ஆள் கூலி",
    "ஆள்கூலி",
    "களை",
    "களை எடுத்தது",
    "வண்டி ஓட்டிய",
    "வண்டி செலவு",
    "வண்டி வாடகை",
    "இயந்திரம்",
    "விதை",
    "உரம்"

  ];


  return words.some(
    word =>
      t.includes(word)
  );

}


/* =========================================================
   FARM DETECTION
   ========================================================= */

function isFarmExpense(
  text
) {

  const t =
    String(text)
      .toLowerCase();


  const words = [

    "கொல்லை",
    "கொல்லைக்கு",
    "கொல்லையில",
    "கொல்லையில்",
    "மருந்து",
    "உரம்",
    "விதை",
    "ஆள் கூலி",
    "ஆள்கூலி",
    "களை எடுத்தது",
    "களை",
    "வண்டி ஓட்டிய",
    "வண்டி செலவு",
    "வண்டி வாடகை",
    "டீசல்"

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

function detectExpenseNote(
  text
) {

  const t =
    String(text)
      .toLowerCase();


  const items = [

    /*
       Farm first
    */

    "ஆள் கூலி",
    "ஆள்கூலி",
    "களை எடுத்தது",
    "வண்டி ஓட்டிய செலவு",
    "வண்டி செலவு",
    "வண்டி வாடகை",
    "மருந்து",
    "உரம்",
    "விதை",
    "டீசல்",

    /*
       General
    */

    "பெட்ரோல்",
    "டீ",
    "காபி",
    "தேநீர்",
    "சாப்பாடு",
    "டிபன்",
    "காய்கறி",
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


  return isFarmExpense(text)
    ? "கொல்லை செலவு"
    : "செலவு";

}


/* =========================================================
   INCOME HANDLER
   ========================================================= */

function handleIncome(
  text
) {

  const account =
    detectIncomeAccount(
      text
    );


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
    account === "salary"
  ) {

    note =
      "சம்பள வரவு";

  }


  if (
    account === "home"
  ) {

    note =
      "வீட்டிலிருந்து பணம் வரவு";

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
      "வீட்டு கணக்கில்"

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

function handleExpense(
  text
) {

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
    detectSource(
      text
    );


  const farm =
    isFarmExpense(
      text
    );


  const note =
    detectExpenseNote(
      text
    );


  const person =
    extractPerson(
      text
    );


  /*
     Farm expense:
     source must be salary/home/cash.
  */

  if (farm) {

    const success =
      addExpense(
        note,
        amount,
        person,
        source
      );


    if (!success) {
      return true;
    }


    const sourceName = {

      salary:
        "சம்பள பணத்தில் இருந்து",

      home:
        "வீட்டு பணத்தில் இருந்து",

      cash:
        "கை காசில் இருந்து"

    };


    let reply =
      `🌾 கொல்லை ${note} ${money(amount)} செலவு சேர்த்துவிட்டேன். ` +
      `${sourceName[source]}.`;


    if (person) {

      reply +=
        ` (${person})`;

    }


    addAIMessage(reply);

    speakText(reply);

    return true;

  }


  /*
     Normal expense.
  */

  if (
    source !== "cash" &&
    amount >
      balance(source)
  ) {

    const sourceName =
      source === "salary"
        ? "சம்பள"
        : "வீட்டு";


    const reply =
      `${sourceName} கணக்கில் போதுமான பணம் இல்லை.`;

    addAIMessage(reply);

    speakText(reply);

    return true;

  }


  if (
    source === "salary"
  ) {

    db.salary.expense +=
      amount;

  }


  if (
    source === "home"
  ) {

    db.home.expense +=
      amount;

  }


  const item = {

    id:
      newId(),

    note,

    amount,

    source,

    category:
      "general",

    person,

    date:
      nowText()

  };


  db.expenses.unshift(
    item
  );


  db.lastAction = {

    action:
      "expense",

    expenseId:
      item.id,

    account:
      source,

    amount,

    logId:
      item.id

  };


  saveDB();


  const sourceName = {

    salary:
      "சம்பள பணத்தில் இருந்து",

    home:
      "வீட்டு பணத்தில் இருந்து",

    cash:
      "கை காசில் இருந்து"

  };


  const reply =
    `${sourceName[source]} ${money(amount)} ${note} செலவு சேர்த்துவிட்டேன்.`;


  addAIMessage(reply);

  speakText(reply);

  return true;

}


/* =========================================================
   CHAT UI
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
    text;


  box.appendChild(
    div
  );


  box.scrollTop =
    box.scrollHeight;

}


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

      பணம், செலவு, சம்பளம்,
      கொல்லை செலவு, வட்டி,
      குறிப்பு, நினைவூட்டல்
      போன்றவற்றை சொல்லுங்கள்.

    </div>

  `;

}


/* =========================================================
   QUERY HANDLER
   ========================================================= */

function handleQuery(
  text
) {

  const t =
    String(text)
      .toLowerCase();


  /* -----------------------------------------
     SALARY TOTAL
  ----------------------------------------- */

  if (
    (
      t.includes("சம்பள வரவு") ||
      t.includes("சம்பளம் வந்தது")
    ) &&
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
     FARM TOTAL
  ----------------------------------------- */

  if (
    t.includes("கொல்லை மொத்த செலவு") ||
    t.includes("கொல்லை செலவு எவ்வளவு") ||
    t.includes("மொத்த கொல்லை செலவு") ||
    t.includes("கொல்லைக்கு எவ்வளவு செலவு")
  ) {

    const total =
      db.farm.logs.reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      );


    const reply =
      `🌾 கொல்லை மொத்த செலவு ${money(total)}.`;

    addAIMessage(reply);

    speakText(reply);

    return true;

  }


  /* -----------------------------------------
     FARM DETAIL
  ----------------------------------------- */

  if (
    (
      t.includes("கொல்லை விவரம்") ||
      t.includes("கொல்லை செலவு விவரம்") ||
      t.includes("எதற்கு செலவு") ||
      t.includes("எதற்கெல்லாம் செலவு")
    )
  ) {

    if (
      !db.farm.logs.length
    ) {

      const reply =
        "இப்போது கொல்லை செலவு பதிவு இல்லை.";

      addAIMessage(reply);

      speakText(reply);

      return true;

    }


    const list =
      db.farm.logs
        .map(
          x =>
            `${x.note} ${money(x.amount)} - ${sourceTamil(x.source)}`
        )
        .join("\n");


    const reply =
      `🌾 கொல்லை செலவு விவரம்:\n${list}`;


    addAIMessage(reply);

    speakText(
      `கொல்லையில் ${db.farm.logs.length} செலவு பதிவுகள் உள்ளன.`
    );

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
            String(
              x.name || ""
            )
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
   UNDO LAST
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


    if (
      index >= 0
    ) {

      account.logs.splice(
        index,
        1
      );

    }


    db.lastAction =
      null;

    saveDB();


    const reply =
      "கடைசி கணக்கு பதிவு நீக்கிவிட்டேன்.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }


  /* -----------------------------------------
     EXPENSE
  ----------------------------------------- */

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


    if (
      index >= 0
    ) {

      const item =
        db.expenses[index];


      if (
        item.source ===
        "salary"
      ) {

        db.salary.expense =
          Math.max(
            0,
            Number(
              db.salary.expense || 0
            ) -
            Number(
              item.amount || 0
            )
          );

      }


      if (
        item.source ===
        "home"
      ) {

        db.home.expense =
          Math.max(
            0,
            Number(
              db.home.expense || 0
            ) -
            Number(
              item.amount || 0
            )
          );

      }


      db.expenses.splice(
        index,
        1
      );


      db.farm.logs =
        db.farm.logs.filter(
          x =>
            Number(x.id) !==
            Number(item.id)
        );

    }


    db.lastAction =
      null;

    saveDB();


    const reply =
      "கடைசி செலவு நீக்கிவிட்டேன்.";

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
          Number(
            action.loanId
          )
      );


    db.lastAction =
      null;

    saveDB();


    const reply =
      "கடைசி வட்டி கணக்கு நீக்கிவிட்டேன்.";

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
        db.notes[
          action.type
        ].filter(
          x =>
            Number(x.id) !==
            Number(
              action.id
            )
        );

    }


    db.lastAction =
      null;

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
          Number(
            action.id
          )
      );


    db.lastAction =
      null;

    saveDB();


    const reply =
      "கடைசி நினைவூட்டல் நீக்கிவிட்டேன்.";

    addAIMessage(reply);

    speakText(reply);

    return;

  }

}


/* =========================================================
   MAIN MESSAGE
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
     REMINDER
  ----------------------------------------- */

  if (
    t.includes("நினைவூட்டு") ||
    t.includes("நினைவூட்டல்") ||
    t.includes("ஞாபகப்படுத்து")
  ) {

    if (
      t.includes("இன்று") &&
      (
        t.includes("மணி") ||
        t.match(
          /\d{1,2}[:.]\d{2}/
        )
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
        newId(),

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

      action:
        "loan",

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
        newId(),

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
    "“வீட்டில் இருந்து 30000 பணம் கொடுத்திருக்காங்க”, " +
    "“சம்பள பணத்தில் இருந்து கொல்லைக்கு மருந்து 500”, " +
    "“வீட்டு பணத்தில் இருந்து கொல்லைக்கு உரம் 2000”.";

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
    text.toLowerCase();


  let hour =
    null;

  let minute =
    0;


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
      newId(),

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

function speakText(
  text
) {

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


  /*
     Calculate total.
  */

  const total =
    db.farm.logs.reduce(
      (sum, item) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );


  /*
     Optional total element.
  */

  const totalElement =
    document.getElementById(
      "farmTotal"
    );


  if (totalElement) {

    totalElement.textContent =
      Number(total)
        .toLocaleString(
          "en-IN"
        );

  }


  if (
    !db.farm.logs.length
  ) {

    list.innerHTML =
      `<div class="empty">கொல்லை செலவு பதிவு இல்லை</div>`;

    return;

  }


  list.innerHTML =
    db.farm.logs
      .map(
        item => `

        <div class="record">

          <div>

            <b>
              🌾
              ${escapeHTML(
                item.note
              )}
              ${money(
                item.amount
              )}
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
            onclick="deleteFarmLog(${item.id})">

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

              ${escapeHTML(
                item.note
              )}

              ${money(
                item.amount
              )}

            </b>

            <small>

              ${sourceTamil(
                item.source
              )}

              ${
                item.category ===
                "farm"
                  ? " • 🌾 கொல்லை"
                  : ""
              }

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
   PAGE / TAB
   ========================================================= */

function showPage(
  page
) {

  /*
     Supports both:
       showPage("home")
       showPage(0)
  */

  const cards =
    document.querySelectorAll(
      ".page, .card, .tab-content"
    );


  const buttons =
    document.querySelectorAll(
      ".tab-btn"
    );


  if (
    typeof page ===
    "number"
  ) {

    cards.forEach(
      (card, index) => {

        card.classList.toggle(
          "active",
          index === page
        );

      }
    );


    buttons.forEach(
      (button, index) => {

        button.classList.toggle(
          "active",
          index === page
        );

      }
    );

    return;

  }


  const target =
    String(page)
      .toLowerCase();


  cards.forEach(
    card => {

      const id =
        String(
          card.id || ""
        )
        .toLowerCase();


      const dataPage =
        String(
          card.dataset?.page ||
          ""
        )
        .toLowerCase();


      card.classList.toggle(
        "active",
        id === target ||
        dataPage === target
      );

    }
  );

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


  console.log(
    "🎙️ JACKY AI v13 READY"
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

window.deleteSalaryLog =
  deleteSalaryLog;

window.deleteHomeLog =
  deleteHomeLog;

window.deleteFarmLog =
  deleteFarmLog;

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

window.renderAll =
  renderAll;

window.parseAmount =
  parseAmount;

window.detectSource =
  detectSource;

window.addExpense =
  addExpense;