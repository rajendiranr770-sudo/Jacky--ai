/* =========================================================
   JACKY SMART PA
   FULL APP.JS
   Tamil Smart Personal Assistant
   ========================================================= */

"use strict";


/* =========================================================
   DATABASE
   ========================================================= */

const DB_KEY = "balaji_pa_db_v12";


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

  /*
     கொல்லைக்கு income கிடையாது.
     Expense மட்டும்.
  */
  farm: {
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

  chat: [],

  lastAction: null

};


let db = cloneDB(DEFAULT_DB);


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function cloneDB(obj) {

  return JSON.parse(
    JSON.stringify(obj)
  );

}


function uid() {

  return (
    Date.now() +
    Math.floor(
      Math.random() * 100000
    )
  );

}


function getEl(...ids) {

  for (const id of ids) {

    const el =
      document.getElementById(id);

    if (el) {
      return el;
    }

  }

  return null;

}


function getValue(...ids) {

  const el =
    getEl(...ids);

  return el
    ? String(el.value || "").trim()
    : "";

}


function setValue(value, ...ids) {

  const el =
    getEl(...ids);

  if (el) {
    el.value = value;
  }

}


function money(value) {

  const n =
    Number(value || 0);

  return (
    "₹" +
    n.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2
      }
    )
  );

}


function todayISO() {

  const d =
    new Date();

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


function nowText() {

  return new Date().toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

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
   NORMALIZE DATABASE
   ========================================================= */

function normalizeDB(raw) {

  const out =
    cloneDB(DEFAULT_DB);


  if (
    !raw ||
    typeof raw !== "object"
  ) {

    return out;

  }


  /*
     SALARY
  */

  if (
    raw.salary &&
    typeof raw.salary === "object"
  ) {

    out.salary.logs =
      Array.isArray(
        raw.salary.logs
      )
        ? raw.salary.logs
        : [];

  }


  /*
     HOME
  */

  if (
    raw.home &&
    typeof raw.home === "object"
  ) {

    out.home.logs =
      Array.isArray(
        raw.home.logs
      )
        ? raw.home.logs
        : [];

  }


  /*
     FARM

     பழைய version-ல் farm income இருந்தாலும்
     அதை இங்கே எடுத்துக் கொள்ள மாட்டோம்.
  */

  if (
    raw.farm &&
    typeof raw.farm === "object"
  ) {

    let logs =
      Array.isArray(
        raw.farm.logs
      )
        ? raw.farm.logs
        : [];

    out.farm.logs =
      logs
        .filter(
          x =>
            x &&
            x.type !== "in"
        )
        .map(
          x => {

            const item = {
              id:
                Number(x.id) ||
                uid(),

              type:
                "expense",

              note:
                String(
                  x.note ||
                  x.category ||
                  "கொல்லை செலவு"
                ),

              amount:
                Number(
                  x.amount ??
                  x.amt ??
                  0
                ),

              source:
                x.source === "salary"
                  ? "salary"
                  : x.source === "home"
                    ? "home"
                    : null,

              category:
                String(
                  x.category ||
                  ""
                ),

              date:
                String(
                  x.date ||
                  nowText()
                )

            };

            return item;

          }
        );

  }


  /*
     GENERAL EXPENSES
  */

  if (
    Array.isArray(
      raw.expenses
    )
  ) {

    out.expenses =
      raw.expenses.map(
        x => ({

          id:
            Number(x.id) ||
            uid(),

          note:
            String(
              x.note ||
              "செலவு"
            ),

          amount:
            Number(
              x.amount ??
              x.amt ??
              0
            ),

          source:
            x.source === "salary"
              ? "salary"
              : "home",

          person:
            String(
              x.person ||
              ""
            ),

          date:
            String(
              x.date ||
              nowText()
            )

        })
      );

  }


  /*
     LOANS
  */

  if (
    Array.isArray(
      raw.loans
    )
  ) {

    out.loans =
      raw.loans.map(
        x => ({

          id:
            Number(x.id) ||
            uid(),

          name:
            String(
              x.name ||
              "பெயர் தெரியவில்லை"
            ),

          amount:
            Number(
              x.amount ??
              x.amt ??
              0
            ),

          rate:
            Number(
              x.rate ??
              2
            ),

          paid:
            Number(
              x.paid ||
              0
            ),

          payments:
            Array.isArray(
              x.payments
            )
              ? x.payments
              : [],

          date:
            String(
              x.date ||
              nowText()
            )

        })
      );

  }


  /*
     NOTES
  */

  if (
    raw.notes &&
    typeof raw.notes === "object"
  ) {

    if (
      Array.isArray(
        raw.notes.temp
      )
    ) {

      out.notes.temp =
        raw.notes.temp;

    }

    if (
      Array.isArray(
        raw.notes.perm
      )
    ) {

      out.notes.perm =
        raw.notes.perm;

    }

  }


  /*
     REMINDERS
  */

  if (
    Array.isArray(
      raw.reminders
    )
  ) {

    out.reminders =
      raw.reminders.map(
        x => ({

          id:
            Number(x.id) ||
            uid(),

          text:
            String(
              x.text ||
              ""
            ),

          date:
            String(
              x.date ||
              todayISO()
            ),

          time:
            String(
              x.time ||
              "08:00"
            ),

          early:
            Number(
              x.early ||
              0
            ),

          done:
            Boolean(
              x.done
            ),

          notified:
            Boolean(
              x.notified
            ),

          created:
            String(
              x.created ||
              nowText()
            )

        })
      );

  }


  /*
     CHAT
  */

  if (
    Array.isArray(
      raw.chat
    )
  ) {

    out.chat =
      raw.chat;

  }


  out.lastAction =
    raw.lastAction ||
    null;


  /*
     Old database compatibility.

     பழைய version-ல் direct totals மட்டும்
     இருந்தால் logs இல்லாமல் இருந்தாலும்
     data முழுவதும் அழியாமல் இருக்க முயற்சி.
  */

  if (
    !out.salary.logs.length &&
    (
      Number(raw.salIn || 0) ||
      Number(raw.salOut || 0)
    )
  ) {

    if (
      Number(raw.salIn || 0) > 0
    ) {

      out.salary.logs.push({

        id: uid(),

        type: "in",

        amount:
          Number(
            raw.salIn || 0
          ),

        note:
          "பழைய சம்பள வரவு",

        date:
          nowText(),

        kind:
          "direct"

      });

    }


    if (
      Number(raw.salOut || 0) > 0
    ) {

      out.salary.logs.push({

        id: uid(),

        type: "out",

        amount:
          Number(
            raw.salOut || 0
          ),

        note:
          "பழைய சம்பள செலவு",

        date:
          nowText(),

        kind:
          "direct"

      });

    }

  }


  if (
    !out.home.logs.length &&
    (
      Number(raw.homeIn || 0) ||
      Number(raw.homeOut || 0)
    )
  ) {

    if (
      Number(raw.homeIn || 0) > 0
    ) {

      out.home.logs.push({

        id: uid(),

        type: "in",

        amount:
          Number(
            raw.homeIn || 0
          ),

        note:
          "பழைய வீட்டு வரவு",

        date:
          nowText(),

        kind:
          "direct"

      });

    }


    if (
      Number(raw.homeOut || 0) > 0
    ) {

      out.home.logs.push({

        id: uid(),

        type: "out",

        amount:
          Number(
            raw.homeOut || 0
          ),

        note:
          "பழைய வீட்டு செலவு",

        date:
          nowText(),

        kind:
          "direct"

      });

    }

  }


  syncTotals(out);

  return out;

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

      db =
        normalizeDB(
          JSON.parse(raw)
        );

      return;

    }


    /*
       சில பழைய key-களில் data இருந்தால்
       அதை எடுத்துக் கொள்ளும்.
    */

    const oldKeys = [

      "jacky_pa_db_v7",

      "jacky_smart_pa_v7",

      "smart_pa_db",

      "balaji_smart_pa"

    ];


    for (
      const key of oldKeys
    ) {

      const old =
        localStorage.getItem(
          key
        );

      if (old) {

        db =
          normalizeDB(
            JSON.parse(old)
          );

        saveDB();

        return;

      }

    }


    db =
      cloneDB(
        DEFAULT_DB
      );

  } catch (error) {

    console.error(
      "loadDB error:",
      error
    );

    db =
      cloneDB(
        DEFAULT_DB
      );

  }

}


/* =========================================================
   SYNC TOTALS
   ========================================================= */

function syncTotals(targetDB = db) {

  if (
    !targetDB.salary
  ) {

    targetDB.salary = {

      income: 0,
      expense: 0,
      logs: []

    };

  }


  if (
    !targetDB.home
  ) {

    targetDB.home = {

      income: 0,
      expense: 0,
      logs: []

    };

  }


  if (
    !Array.isArray(
      targetDB.salary.logs
    )
  ) {

    targetDB.salary.logs = [];

  }


  if (
    !Array.isArray(
      targetDB.home.logs
    )
  ) {

    targetDB.home.logs = [];

  }


  targetDB.salary.income =
    targetDB.salary.logs
      .filter(
        x =>
          x.type === "in"
      )
      .reduce(
        (sum, x) =>
          sum +
          Number(
            x.amount || 0
          ),
        0
      );


  targetDB.salary.expense =
    targetDB.salary.logs
      .filter(
        x =>
          x.type === "out"
      )
      .reduce(
        (sum, x) =>
          sum +
          Number(
            x.amount || 0
          ),
        0
      );


  targetDB.home.income =
    targetDB.home.logs
      .filter(
        x =>
          x.type === "in"
      )
      .reduce(
        (sum, x) =>
          sum +
          Number(
            x.amount || 0
          ),
        0
      );


  targetDB.home.expense =
    targetDB.home.logs
      .filter(
        x =>
          x.type === "out"
      )
      .reduce(
        (sum, x) =>
          sum +
          Number(
            x.amount || 0
          ),
        0
      );

}


function saveDB() {

  try {

    syncTotals();

    localStorage.setItem(
      DB_KEY,
      JSON.stringify(db)
    );

    renderAll();

  } catch (error) {

    console.error(
      "saveDB error:",
      error
    );

  }

}


/* =========================================================
   BALANCE
   ========================================================= */

function balance(type) {

  syncTotals();


  if (
    type === "salary"
  ) {

    return (
      Number(
        db.salary.income
      ) -
      Number(
        db.salary.expense
      )
    );

  }


  if (
    type === "home"
  ) {

    return (
      Number(
        db.home.income
      ) -
      Number(
        db.home.expense
      )
    );

  }


  return 0;

}


/* =========================================================
   AMOUNT PARSER
   ========================================================= */

function parseAmount(text) {

  const value =
    String(
      text || ""
    )
      .replace(
        /,/g,
        ""
      )
      .trim();


  /*
     Explicit numeric amount.

     500
     2,500
     ₹500
     500 ரூபாய்
  */

  const numericMatches =
    value.match(
      /(?:₹\s*)?(\d+(?:\.\d+)?)/g
    );


  let best =
    0;


  if (
    numericMatches
  ) {

    for (
      const m of numericMatches
    ) {

      const n =
        Number(
          m.replace(
            /[^\d.]/g,
            ""
          )
        );

      if (
        Number.isFinite(n) &&
        n > best
      ) {

        best = n;

      }

    }

  }


  /*
     Tamil amount words
  */

  const t =
    value.toLowerCase();


  const special = [

    [
      "ஐம்பதாயிரம்",
      50000
    ],

    [
      "நாற்பதாயிரம்",
      40000
    ],

    [
      "முப்பதாயிரம்",
      30000
    ],

    [
      "இருபதாயிரம்",
      20000
    ],

    [
      "பத்தாயிரம்",
      10000
    ],

    [
      "ஒரு லட்சம்",
      100000
    ],

    [
      "ஒரு லட்ச ரூபாய்",
      100000
    ],

    [
      "லட்சம்",
      100000
    ]

  ];


  let wordAmount =
    0;


  for (
    const [word, amount]
    of special
  ) {

    if (
      t.includes(word)
    ) {

      wordAmount =
        Math.max(
          wordAmount,
          amount
        );

    }

  }


  /*
     30 ஆயிரம்
     20 ஆயிரம்
     5 ஆயிரம்
  */

  const thousand =
    t.match(
      /(\d+(?:\.\d+)?)\s*ஆயிரம்/
    );


  if (
    thousand
  ) {

    wordAmount =
      Math.max(
        wordAmount,
        Number(
          thousand[1]
        ) * 1000
      );

  }


  /*
     2 லட்சம்
  */

  const lakh =
    t.match(
      /(\d+(?:\.\d+)?)\s*லட்ச/
    );


  if (
    lakh
  ) {

    wordAmount =
      Math.max(
        wordAmount,
        Number(
          lakh[1]
        ) * 100000
      );

  }


  return Math.max(
    best,
    wordAmount
  );

}


/* =========================================================
   TAMIL NUMBER PARSER
   ========================================================= */

function tamilNumber(text) {

  const t =
    String(
      text || ""
    ).toLowerCase();


  const map = {

    "ஒன்று": 1,
    "ஒரு": 1,
    "ரெண்டு": 2,
    "இரண்டு": 2,
    "மூணு": 3,
    "மூன்று": 3,
    "நாலு": 4,
    "நான்கு": 4,
    "அஞ்சு": 5,
    "ஐந்து": 5,
    "ஆறு": 6,
    "ஏழு": 7,
    "எட்டு": 8,
    "ஒன்பது": 9,
    "பத்து": 10

  };


  for (
    const key in map
  ) {

    if (
      t.includes(key)
    ) {

      return map[key];

    }

  }


  return null;

}


/* =========================================================
   SOURCE DETECTION
   ========================================================= */

function detectSource(text) {

  const t =
    String(
      text || ""
    ).toLowerCase();


  /*
     Salary
  */

  if (
    t.includes(
      "சம்பள பணம்"
    ) ||
    t.includes(
      "சம்பளத்தில் இருந்து"
    ) ||
    t.includes(
      "சம்பளத்திலிருந்து"
    ) ||
    t.includes(
      "சம்பளத்துல இருந்து"
    ) ||
    t.includes(
      "சம்பளத்துலிருந்து"
    ) ||
    t.includes(
      "salary"
    )
  ) {

    return "salary";

  }


  /*
     Home
  */

  if (
    t.includes(
      "வீட்டு பணம்"
    ) ||
    t.includes(
      "வீட்டில் இருந்து"
    ) ||
    t.includes(
      "வீட்டிலிருந்து"
    ) ||
    t.includes(
      "வீட்டு பணத்தில் இருந்து"
    ) ||
    t.includes(
      "வீட்டு பணத்திலிருந்து"
    ) ||
    t.includes(
      "வீட்டு பணத்துல இருந்து"
    ) ||
    t.includes(
      "வீட்டு பணத்துலிருந்து"
    ) ||
    t.includes(
      "home"
    )
  ) {

    return "home";

  }


  return null;

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

    return "🌾 கொல்லை பணம்";

  }


  return "🏠 வீட்டு பணம்";

}


/* =========================================================
   FARM CATEGORY
   ========================================================= */

function farmCategory(text) {

  const t =
    String(
      text || ""
    ).toLowerCase();


  if (
    t.includes("மருந்து")
  ) {

    return "மருந்து";

  }


  if (
    t.includes("உரம்")
  ) {

    return "உரம்";

  }


  if (
    t.includes("களை") ||
    t.includes("களையெ")
  ) {

    return "களை எடுத்தது";

  }


  if (
    t.includes("ஆள் கூலி") ||
    t.includes("ஆள்கூலி") ||
    t.includes("கூலி")
  ) {

    return "ஆள் கூலி";

  }


  if (
    t.includes("டீசல்")
  ) {

    return "டீசல்";

  }


  if (
    t.includes("வண்டி")
  ) {

    return "வண்டி செலவு";

  }


  if (
    t.includes("விதை")
  ) {

    return "விதை";

  }


  if (
    t.includes("தண்ணீர்") ||
    t.includes("தண்ணி")
  ) {

    return "தண்ணீர்";

  }


  if (
    t.includes("மின்சாரம்")
  ) {

    return "மின்சாரம்";

  }


  return "மற்ற கொல்லை செலவு";

}


/* =========================================================
   IS FARM EXPENSE
   ========================================================= */

function isFarmExpense(text) {

  const t =
    String(
      text || ""
    ).toLowerCase();


  if (
    t.includes("கொல்லை")
  ) {

    return true;

  }


  if (
    t.includes("வயல்")
  ) {

    return true;

  }


  if (
    t.includes("பண்ணை")
  ) {

    return true;

  }


  /*
     இந்த வார்த்தைகள் மட்டும் இருந்தால்
     general expense ஆக இருக்கலாம்.

     எனவே கொல்லை keyword இல்லாமல்
     இவற்றை automatic farm ஆக மாற்ற மாட்டோம்.
  */

  return false;

}


/* =========================================================
   ADD SALARY
   ========================================================= */

function addSalary(type) {

  const amount =
    parseAmount(
      getValue(
        "salaryAmount",
        "salaryAmt",
        "salAmt"
      )
    );


  const note =
    getValue(
      "salaryNote",
      "salaryText",
      "salNote"
    ) ||
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
      "தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  const item = {

    id: uid(),

    type:
      type === "in"
        ? "in"
        : "out",

    amount,

    note,

    date:
      nowText(),

    kind:
      "direct"

  };


  db.salary.logs.push(
    item
  );


  db.lastAction = {

    type:
      "salary",

    id:
      item.id

  };


  setValue(
    "",
    "salaryAmount",
    "salaryAmt",
    "salAmt"
  );


  setValue(
    "",
    "salaryNote",
    "salaryText",
    "salNote"
  );


  saveDB();

}


/* =========================================================
   ADD HOME
   ========================================================= */

function addHome(type) {

  const amount =
    parseAmount(
      getValue(
        "homeAmount",
        "homeAmt"
      )
    );


  const note =
    getValue(
      "homeNote",
      "homeText"
    ) ||
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
      "தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  const item = {

    id: uid(),

    type:
      type === "in"
        ? "in"
        : "out",

    amount,

    note,

    date:
      nowText(),

    kind:
      "direct"

  };


  db.home.logs.push(
    item
  );


  db.lastAction = {

    type:
      "home",

    id:
      item.id

  };


  setValue(
    "",
    "homeAmount",
    "homeAmt"
  );


  setValue(
    "",
    "homeNote",
    "homeText"
  );


  saveDB();

}


/* =========================================================
   ADD FARM EXPENSE
   ========================================================= */

function addFarm() {

  const amount =
    parseAmount(
      getValue(
        "farmAmount",
        "farmAmt"
      )
    );


  const note =
    getValue(
      "farmNote",
      "farmText"
    ) ||
    "கொல்லை செலவு";


  let source =
    getValue(
      "farmSource"
    );


  if (
    source !== "salary" &&
    source !== "home"
  ) {

    /*
       HTML-ல் source selector இல்லாவிட்டால்
       கேட்டு பெறும்.
    */

    const answer =
      prompt(
        "இந்த கொல்லை செலவு எந்த பணத்திலிருந்து?\n\n1 = சம்பள பணம்\n2 = வீட்டு பணம்"
      );


    if (
      answer === "1" ||
      String(
        answer || ""
      ).includes(
        "சம்பள"
      )
    ) {

      source = "salary";

    } else if (
      answer === "2" ||
      String(
        answer || ""
      ).includes(
        "வீட்டு"
      )
    ) {

      source = "home";

    } else {

      alert(
        "சம்பள பணம் அல்லது வீட்டு பணம் தேர்வு செய்ய வேண்டும்."
      );

      return;

    }

  }


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "கொல்லை செலவு தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  const farm = {

    id: uid(),

    type:
      "expense",

    note,

    amount,

    source,

    category:
      farmCategory(note),

    date:
      nowText()

  };


  /*
     கொல்லை expense மட்டும்.

     Source account-ல் அதற்கான செலவு
     automatic-ஆக பதிவு செய்யப்படும்.
  */

  db.farm.logs.push(
    farm
  );


  const accountLog = {

    id: uid(),

    type:
      "out",

    amount,

    note:
      "🌾 கொல்லை • " +
      note,

    date:
      farm.date,

    kind:
      "farm",

    farmId:
      farm.id

  };


  if (
    source === "salary"
  ) {

    db.salary.logs.push(
      accountLog
    );

  } else {

    db.home.logs.push(
      accountLog
    );

  }


  db.lastAction = {

    type:
      "farm",

    id:
      farm.id

  };


  setValue(
    "",
    "farmAmount",
    "farmAmt"
  );


  setValue(
    "",
    "farmNote",
    "farmText"
  );


  saveDB();

}


/* =========================================================
   ADD GENERAL EXPENSE
   ========================================================= */

function addExpenseManual() {

  const amount =
    parseAmount(
      getValue(
        "expenseAmount",
        "expenseAmt"
      )
    );


  const note =
    getValue(
      "expenseNote",
      "expenseText"
    ) ||
    "செலவு";


  let source =
    getValue(
      "expenseSource",
      "source"
    );


  if (
    source !== "salary" &&
    source !== "home"
  ) {

    source =
      "home";

  }


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "செலவு தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  const person =
    getValue(
      "expensePerson",
      "person"
    );


  const item = {

    id: uid(),

    note,

    amount,

    source,

    person,

    date:
      nowText()

  };


  db.expenses.push(
    item
  );


  /*
     General expense account-ல்
     source deduction.
  */

  const accountLog = {

    id: uid(),

    type:
      "out",

    amount,

    note:
      "🧾 " +
      note,

    date:
      item.date,

    kind:
      "general",

    expenseId:
      item.id

  };


  if (
    source === "salary"
  ) {

    db.salary.logs.push(
      accountLog
    );

  } else {

    db.home.logs.push(
      accountLog
    );

  }


  db.lastAction = {

    type:
      "expense",

    id:
      item.id

  };


  setValue(
    "",
    "expenseAmount",
    "expenseAmt"
  );


  setValue(
    "",
    "expenseNote",
    "expenseText"
  );


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


  /*
     இது farm expense source log என்றால்
     farm record-யும் அழிக்க வேண்டும்.
  */

  if (
    item.kind === "farm" &&
    item.farmId
  ) {

    const farmIndex =
      db.farm.logs.findIndex(
        x =>
          Number(x.id) ===
          Number(item.farmId)
      );


    if (
      farmIndex >= 0
    ) {

      db.farm.logs.splice(
        farmIndex,
        1
      );

    }

  }


  /*
     General expense linked என்றால்
     அதைவும் அழிக்க வேண்டும்.
  */

  if (
    item.kind === "general" &&
    item.expenseId
  ) {

    const expenseIndex =
      db.expenses.findIndex(
        x =>
          Number(x.id) ===
          Number(item.expenseId)
      );


    if (
      expenseIndex >= 0
    ) {

      db.expenses.splice(
        expenseIndex,
        1
      );

    }

  }


  db.salary.logs.splice(
    index,
    1
  );


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
    item.kind === "farm" &&
    item.farmId
  ) {

    const farmIndex =
      db.farm.logs.findIndex(
        x =>
          Number(x.id) ===
          Number(item.farmId)
      );


    if (
      farmIndex >= 0
    ) {

      db.farm.logs.splice(
        farmIndex,
        1
      );

    }

  }


  if (
    item.kind === "general" &&
    item.expenseId
  ) {

    const expenseIndex =
      db.expenses.findIndex(
        x =>
          Number(x.id) ===
          Number(item.expenseId)
      );


    if (
      expenseIndex >= 0
    ) {

      db.expenses.splice(
        expenseIndex,
        1
      );

    }

  }


  db.home.logs.splice(
    index,
    1
  );


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
     Source account-ல் இருந்த
     linked transaction-ஐ reverse/remove.
  */

  if (
    item.source === "salary"
  ) {

    db.salary.logs =
      db.salary.logs.filter(
        x =>
          Number(
            x.farmId
          ) !==
          Number(
            item.id
          )
      );

  }


  if (
    item.source === "home"
  ) {

    db.home.logs =
      db.home.logs.filter(
        x =>
          Number(
            x.farmId
          ) !==
          Number(
            item.id
          )
      );

  }


  db.farm.logs.splice(
    index,
    1
  );


  saveDB();

}


/* =========================================================
   DELETE GENERAL EXPENSE
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


  if (
    item.source === "salary"
  ) {

    db.salary.logs =
      db.salary.logs.filter(
        x =>
          Number(
            x.expenseId
          ) !==
          Number(
            item.id
          )
      );

  } else {

    db.home.logs =
      db.home.logs.filter(
        x =>
          Number(
            x.expenseId
          ) !==
          Number(
            item.id
          )
      );

  }


  db.expenses.splice(
    index,
    1
  );


  saveDB();

}


/* =========================================================
   LOAN RATE PARSER
   ========================================================= */

function parseLoanRate(text) {

  const t =
    String(
      text || ""
    ).toLowerCase();


  /*
     முதலில் explicit "பைசா"
     அல்லது "%" மட்டும் பார்க்க வேண்டும்.

     இதனால் amount-ல் உள்ள 3,
     date-ல் உள்ள 3 போன்றவை rate ஆகாது.
  */

  const explicit =
    t.match(
      /(\d+(?:\.\d+)?)\s*(?:பைசா|%|சதவீதம்)/
    );


  if (
    explicit
  ) {

    return Number(
      explicit[1]
    );

  }


  if (
    t.includes("மூணு பைசா") ||
    t.includes("மூன்று பைசா")
  ) {

    return 3;

  }


  if (
    t.includes("ரெண்டு பைசா") ||
    t.includes("இரண்டு பைசா")
  ) {

    return 2;

  }


  if (
    t.includes("ஒரு பைசா")
  ) {

    return 1;

  }


  /*
     "3% வட்டி"
  */

  const percent =
    t.match(
      /(\d+(?:\.\d+)?)\s*%/
    );


  if (
    percent
  ) {

    return Number(
      percent[1]
    );

  }


  /*
     Default = 2 பைசா
  */

  return 2;

}


/* =========================================================
   LOAN HELPERS
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


function loanInterest(loan) {

  return (
    loanRemaining(
      loan
    ) *
    Number(
      loan.rate || 0
    )
  ) /
  100;

}


/* =========================================================
   ADD LOAN
   ========================================================= */

function addLoan() {

  const name =
    getValue(
      "loanName"
    );


  const amount =
    parseAmount(
      getValue(
        "loanAmount",
        "loanAmt"
      )
    );


  const rateText =
    getValue(
      "loanRate"
    );


  let rate =
    Number(
      rateText
    );


  if (
    !rate
  ) {

    rate = 2;

  }


  if (
    !name
  ) {

    alert(
      "பெயரை உள்ளிடுங்கள்."
    );

    return;

  }


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "வட்டி கணக்கு தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  const loan = {

    id: uid(),

    name,

    amount,

    rate,

    paid: 0,

    payments: [],

    date:
      nowText()

  };


  db.loans.push(
    loan
  );


  db.lastAction = {

    type:
      "loan",

    id:
      loan.id

  };


  setValue(
    "",
    "loanName"
  );


  setValue(
    "",
    "loanAmount",
    "loanAmt"
  );


  setValue(
    "",
    "loanRate"
  );


  saveDB();

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


  if (
    !loan
  ) {

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
      "இந்த கடன் ஏற்கனவே முழுவதும் திருப்பப்பட்டுள்ளது."
    );

    return;

  }


  const answer =
    prompt(
      `${loan.name}\nமீதி: ${money(remaining)}\n\nதிருப்பி கொடுத்த தொகை?`
    );


  if (
    answer === null
  ) {

    return;

  }


  const amount =
    parseAmount(
      answer
    );


  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "சரியான தொகையை உள்ளிடுங்கள்."
    );

    return;

  }


  const actual =
    Math.min(
      amount,
      remaining
    );


  loan.paid =
    Number(
      loan.paid || 0
    ) +
    actual;


  if (
    !Array.isArray(
      loan.payments
    )
  ) {

    loan.payments = [];

  }


  loan.payments.push({

    id: uid(),

    amount:
      actual,

    date:
      nowText()

  });


  db.lastAction = {

    type:
      "loanPayment",

    id:
      loan.id,

    amount:
      actual

  };


  saveDB();

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


  saveDB();

}


/* =========================================================
   ADD NOTE
   ========================================================= */

function addNote(type) {

  let text =
    "";


  if (
    type === "perm"
  ) {

    text =
      getValue(
        "permText",
        "noteText"
      );

  } else {

    text =
      getValue(
        "tempText",
        "noteText"
      );

  }


  if (
    !text
  ) {

    alert(
      "குறிப்பை எழுதுங்கள்."
    );

    return;

  }


  const item = {

    id: uid(),

    text,

    date:
      nowText()

  };


  if (
    type === "perm"
  ) {

    db.notes.perm.push(
      item
    );

  } else {

    db.notes.temp.push(
      item
    );

  }


  db.lastAction = {

    type:
      "note",

    noteType:
      type,

    id:
      item.id

  };


  setValue(
    "",
    type === "perm"
      ? "permText"
      : "tempText"
  );


  saveDB();

}


/* =========================================================
   DELETE NOTE
   ========================================================= */

function deleteNote(type, id) {

  const list =
    type === "perm"
      ? db.notes.perm
      : db.notes.temp;


  const index =
    list.findIndex(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (
    index < 0
  ) {

    return;

  }


  list.splice(
    index,
    1
  );


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
      "தற்காலிக குறிப்புகள் அனைத்தையும் அழிக்கவா?"
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

function parseReminderDate(text) {

  const t =
    String(
      text || ""
    ).toLowerCase();


  const d =
    new Date();


  if (
    t.includes(
      "நாளைக்கு"
    ) ||
    t.includes(
      "நாளை"
    )
  ) {

    d.setDate(
      d.getDate() + 1
    );

  }


  if (
    t.includes(
      "நேற்று"
    )
  ) {

    d.setDate(
      d.getDate() - 1
    );

  }


  return (
    d.getFullYear() +
    "-" +
    String(
      d.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      d.getDate()
    ).padStart(2, "0")
  );

}


/* =========================================================
   REMINDER TIME PARSER
   ========================================================= */

function parseReminderTime(text) {

  const t =
    String(
      text || ""
    ).toLowerCase();


  /*
     8:30
     08:30
  */

  const colon =
    t.match(
      /(\d{1,2})\s*[:.]\s*(\d{1,2})/
    );


  if (
    colon
  ) {

    let h =
      Number(
        colon[1]
      );

    const m =
      Number(
        colon[2]
      );


    if (
      t.includes("மாலை") ||
      t.includes("சாயங்காலம்") ||
      t.includes("இரவு")
    ) {

      if (
        h < 12
      ) {

        h += 12;

      }

    }


    return {

      hour:
        h,

      minute:
        m

    };

  }


  /*
     8 மணிக்கு
     8 மணி
  */

  const hourMatch =
    t.match(
      /(\d{1,2})\s*மணி/
    );


  if (
    hourMatch
  ) {

    let h =
      Number(
        hourMatch[1]
      );


    if (
      (
        t.includes("மாலை") ||
        t.includes("சாயங்காலம்") ||
        t.includes("இரவு")
      ) &&
      h < 12
    ) {

      h += 12;

    }


    /*
       "காலை 8"
    */

    return {

      hour:
        h,

      minute:
        0

    };

  }


  /*
     "காலையில்" மட்டும் சொன்னால் 8 AM
  */

  if (
    t.includes("காலை") ||
    t.includes("காலையில்") ||
    t.includes("காலையில")
  ) {

    return {

      hour: 8,

      minute: 0

    };

  }


  /*
     "மதியம்"
  */

  if (
    t.includes("மதியம்")
  ) {

    return {

      hour: 12,

      minute: 0

    };

  }


  /*
     "மாலை"
  */

  if (
    t.includes("மாலை") ||
    t.includes("சாயங்காலம்")
  ) {

    return {

      hour: 18,

      minute: 0

    };

  }


  return null;

}


/* =========================================================
   ADD REMINDER
   ========================================================= */

function addReminder() {

  const text =
    getValue(
      "reminderText"
    );


  let date =
    getValue(
      "reminderDate"
    );


  let time =
    getValue(
      "reminderTime"
    );


  const early =
    Number(
      getValue(
        "reminderEarly"
      ) ||
      0
    );


  if (
    !text
  ) {

    alert(
      "நினைவூட்டல் என்ன என்பதை எழுதுங்கள்."
    );

    return;

  }


  if (
    !date
  ) {

    date =
      todayISO();

  }


  if (
    !time
  ) {

    time =
      "08:00";

  }


  const reminder = {

    id: uid(),

    text,

    date,

    time,

    early,

    done: false,

    notified: false,

    created:
      nowText()

  };


  db.reminders.push(
    reminder
  );


  db.lastAction = {

    type:
      "reminder",

    id:
      reminder.id

  };


  setValue(
    "",
    "reminderText"
  );


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
   REMINDER TARGET
   ========================================================= */

function reminderTarget(reminder) {

  if (
    !reminder ||
    !reminder.date ||
    !reminder.time
  ) {

    return null;

  }


  const parts =
    String(
      reminder.date
    ).split("-");


  const tp =
    String(
      reminder.time
    ).split(":");


  if (
    parts.length !== 3
  ) {

    return null;

  }


  const d =
    new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2]),
      Number(tp[0] || 0),
      Number(tp[1] || 0),
      0,
      0
    );


  return d;

}


/* =========================================================
   NOTIFICATION PERMISSION
   ========================================================= */

function ensureNotificationPermission() {

  try {

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

  } catch (e) {}

}


/* =========================================================
   SHOW NOTIFICATION
   ========================================================= */

function notifyReminder(reminder) {

  const text =
    `⏰ நினைவூட்டல்: ${reminder.text}`;


  try {

    if (
      "Notification" in window &&
      Notification.permission ===
      "granted"
    ) {

      new Notification(
        "🎙️ ஜாக்கி Smart PA",
        {
          body:
            text
        }
      );

    }

  } catch (e) {}


  addAIMessage(
    text
  );


  speakText(
    `நினைவூட்டல். ${reminder.text}`
  );

}


/* =========================================================
   SCHEDULE ONE REMINDER
   ========================================================= */

function scheduleReminderTimer(reminder) {

  const target =
    reminderTarget(
      reminder
    );


  if (
    !target
  ) {

    return;

  }


  const early =
    Number(
      reminder.early ||
      0
    );


  const notifyAt =
    target.getTime() -
    early * 60000;


  const delay =
    notifyAt -
    Date.now();


  if (
    delay <= 0
  ) {

    return;

  }


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
   SCHEDULE ALL
   ========================================================= */

function scheduleAllReminders() {

  db.reminders.forEach(
    reminder => {

      if (
        !reminder.done &&
        !reminder.notified
      ) {

        scheduleReminderTimer(
          reminder
        );

      }

    }
  );

}


/* =========================================================
   CHECK REMINDERS
   ========================================================= */

function checkReminders() {

  const now =
    new Date();


  let changed =
    false;


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


      const notifyAt =
        new Date(
          target.getTime() -
          Number(
            reminder.early ||
            0
          ) *
          60000
        );


      if (
        now >= notifyAt
      ) {

        reminder.notified =
          true;

        changed =
          true;

        notifyReminder(
          reminder
        );

      }

    }
  );


  if (
    changed
  ) {

    saveDB();

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


  if (
    !item
  ) {

    return;

  }


  item.done =
    true;


  saveDB();

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


  if (
    !item
  ) {

    return;

  }


  item.done =
    false;

  item.notified =
    false;


  saveDB();


  scheduleReminderTimer(
    item
  );

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


  if (
    index < 0
  ) {

    return;

  }


  db.reminders.splice(
    index,
    1
  );


  saveDB();

}


/* =========================================================
   TEST REMINDER
   ========================================================= */

function testReminder() {

  const reminder = {

    text:
      "இது ஜாக்கி நினைவூட்டல் சோதனை.",

    date:
      todayISO(),

    time:
      new Date().toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      ),

    early: 0

  };


  notifyReminder(
    reminder
  );

}


/* =========================================================
   SPEECH SYNTHESIS
   ========================================================= */

function speakText(text) {

  if (
    !(
      "speechSynthesis"
      in window
    )
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


  if (
    !SpeechRecognition
  ) {

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
    getEl(
      "status"
    );


  if (
    status
  ) {

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
        getEl(
          "textInput"
        );


      if (
        !input
      ) {

        return;

      }


      if (
        finalText
      ) {

        input.value =
          finalText;


        if (
          status
        ) {

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

      if (
        status
      ) {

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
    getEl(
      "status"
    );


  if (
    status
  ) {

    status.textContent =
      "🎤 தயார்";

  }

}


/* =========================================================
   CHAT MESSAGE
   ========================================================= */

function addUserMessage(text) {

  const box =
    getEl(
      "chatBox",
      "chatMessages"
    );


  if (
    !box
  ) {

    return;

  }


  const div =
    document.createElement(
      "div"
    );


  div.className =
    "msg user-msg";


  div.textContent =
    text;


  box.appendChild(
    div
  );


  box.scrollTop =
    box.scrollHeight;


  db.chat.push({

    type:
      "user",

    text,

    date:
      nowText()

  });

}


function addAIMessage(text) {

  const box =
    getEl(
      "chatBox",
      "chatMessages"
    );


  if (
    box
  ) {

    const div =
      document.createElement(
        "div"
      );


    div.className =
      "msg pa-msg";


    div.textContent =
      text;


    box.appendChild(
      div
    );


    box.scrollTop =
      box.scrollHeight;

  }


  db.chat.push({

    type:
      "ai",

    text,

    date:
      nowText()

  });


  try {

    localStorage.setItem(
      DB_KEY,
      JSON.stringify(db)
    );

  } catch (e) {}

}


/* =========================================================
   CHAT CLEAR
   ========================================================= */

function clearChat() {

  const box =
    getEl(
      "chatBox",
      "chatMessages"
    );


  if (
    box
  ) {

    box.innerHTML =
      "";

  }


  db.chat =
    [];

  saveDB();

}


/* =========================================================
   CHAT AMOUNT / INTENT HELPERS
   ========================================================= */

function hasAny(text, words) {

  const t =
    String(
      text || ""
    ).toLowerCase();


  return words.some(
    word =>
      t.includes(
        word
      )
  );

}


/* =========================================================
   REMINDER INTENT
   ========================================================= */

function isReminderCommand(text) {

  return hasAny(
    text,
    [

      "நினைவூட்டு",

      "நினைவூட்டல்",

      "நினைவில் வை",

      "நினைவு வை",

      "கால் பண்ணு",

      "கால் பண்ணணும்",

      "கூப்பிடு",

      "செய்ய நினைவூட்டு",

      "remind",

      "reminder"

    ]
  );

}


/* =========================================================
   CREATE REMINDER FROM NATURAL LANGUAGE
   ========================================================= */

function createReminderFromText(text) {

  const date =
    parseReminderDate(
      text
    );


  const parsedTime =
    parseReminderTime(
      text
    );


  let hour =
    parsedTime
      ? parsedTime.hour
      : 8;


  let minute =
    parsedTime
      ? parsedTime.minute
      : 0;


  /*
     24-hour correction
  */

  if (
    hour > 23
  ) {

    hour =
      23;

  }


  if (
    minute > 59
  ) {

    minute =
      59;

  }


  const time =
    String(
      hour
    ).padStart(
      2,
      "0"
    ) +
    ":" +
    String(
      minute
    ).padStart(
      2,
      "0"
    );


  /*
     Reminder text-ல் date/time
     words வேண்டாம்.

     "நாளைக்கு காலையில் 8 மணிக்கு
      கார்த்திக்கு கால் பண்ணு"

     -> "கார்த்திக்கு கால் பண்ணு"
  */

  let clean =
    String(
      text
    );


  clean =
    clean
      .replace(
        /நாளைக்கு|நாளை/g,
        ""
      )
      .replace(
        /காலையில்|காலையில|காலை/g,
        ""
      )
      .replace(
        /மாலையில்|மாலையில|மாலை/g,
        ""
      )
      .replace(
        /சாயங்காலம்/g,
        ""
      )
      .replace(
        /\d{1,2}\s*[:.]\s*\d{1,2}/g,
        ""
      )
      .replace(
        /\d{1,2}\s*மணிக்கு?/g,
        ""
      )
      .replace(
        /\d{1,2}\s*மணி/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  if (
    !clean
  ) {

    clean =
      "நினைவூட்டல்";

  }


  const reminder = {

    id: uid(),

    text:
      clean,

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

    type:
      "reminder",

    id:
      reminder.id

  };


  saveDB();


  ensureNotificationPermission();

  scheduleReminderTimer(
    reminder
  );


  return reminder;

}


/* =========================================================
   LOAN INTENT
   ========================================================= */

function isLoanCommand(text) {

  return hasAny(
    text,
    [

      "வட்டி",

      "கடன்",

      "வட்டிக்கு",

      "வட்டி கணக்கு",

      "வாங்கி இருக்கிறார்",

      "வாங்கியிருக்கிறார்",

      "கொடுத்திருக்கிறேன்",

      "கொடுத்தேன்"

    ]
  );

}


/* =========================================================
   EXTRACT LOAN NAME
   ========================================================= */

function extractLoanName(text) {

  let t =
    String(
      text || ""
    ).trim();


  /*
     "ராஜா என்பவர்..."
  */

  const m1 =
    t.match(
      /^(.+?)\s+என்பவர்/
    );


  if (
    m1
  ) {

    return (
      m1[1]
        .replace(
          /^(நான்|அவர்|அவங்க)\s+/,
          ""
        )
        .trim()
    );

  }


  /*
     "ராஜா 100000 2 பைசா"
  */

  const words =
    t.split(
      /\s+/
    );


  const ignored = [

    "வட்டி",

    "கடன்",

    "கணக்கு",

    "ரூபாய்",

    "ரூபா",

    "வாங்கி",

    "இருக்கிறார்",

    "என்னிடம்",

    "கொடுத்தேன்",

    "கொடுத்திருக்கிறார்"

  ];


  for (
    const word of words
  ) {

    if (
      word.length >= 2 &&
      !ignored.includes(
        word
      ) &&
      !/\d/.test(
        word
      )
    ) {

      return word;

    }

  }


  return "பெயர் தெரியவில்லை";

}


/* =========================================================
   ADD LOAN FROM CHAT
   ========================================================= */

function addLoanFromChat(text) {

  const amount =
    parseAmount(
      text
    );


  if (
    !amount ||
    amount <= 0
  ) {

    return null;

  }


  const rate =
    parseLoanRate(
      text
    );


  const name =
    extractLoanName(
      text
    );


  const loan = {

    id: uid(),

    name,

    amount,

    rate,

    paid: 0,

    payments: [],

    date:
      nowText()

  };


  db.loans.push(
    loan
  );


  db.lastAction = {

    type:
      "loan",

    id:
      loan.id

  };


  saveDB();


  return loan;

}


/* =========================================================
   FARM CHAT COMMAND
   ========================================================= */

function addFarmFromChat(text) {

  const amount =
    parseAmount(
      text
    );


  if (
    !amount ||
    amount <= 0
  ) {

    return null;

  }


  const source =
    detectSource(
      text
    );


  /*
     Source இல்லாமல் farm expense save
     செய்யக்கூடாது.
  */

  if (
    source !== "salary" &&
    source !== "home"
  ) {

    return null;

  }


  let note =
    String(
      text
    )
      .replace(
        /சம்பள பணத்திலிருந்து|சம்பளத்தில் இருந்து|சம்பளத்துலிருந்து|சம்பளத்துல இருந்து/g,
        ""
      )
      .replace(
        /வீட்டு பணத்திலிருந்து|வீட்டு பணத்தில் இருந்து|வீட்டிலிருந்து|வீட்டில் இருந்து/g,
        ""
      )
      .replace(
        /\d[\d,]*/g,
        ""
      )
      .replace(
        /₹/g,
        ""
      )
      .replace(
        /ரூபாய்|ரூபா/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  if (
    note.length < 2
  ) {

    note =
      farmCategory(
        text
      );

  }


  const farm = {

    id: uid(),

    type:
      "expense",

    note,

    amount,

    source,

    category:
      farmCategory(
        text
      ),

    date:
      nowText()

  };


  db.farm.logs.push(
    farm
  );


  const accountLog = {

    id: uid(),

    type:
      "out",

    amount,

    note:
      "🌾 கொல்லை • " +
      note,

    date:
      farm.date,

    kind:
      "farm",

    farmId:
      farm.id

  };


  if (
    source === "salary"
  ) {

    db.salary.logs.push(
      accountLog
    );

  } else {

    db.home.logs.push(
      accountLog
    );

  }


  db.lastAction = {

    type:
      "farm",

    id:
      farm.id

  };


  saveDB();


  return farm;

}


/* =========================================================
   GENERAL EXPENSE CHAT
   ========================================================= */

function addExpenseFromChat(text) {

  const amount =
    parseAmount(
      text
    );


  if (
    !amount ||
    amount <= 0
  ) {

    return null;

  }


  const source =
    detectSource(
      text
    );


  if (
    source !== "salary" &&
    source !== "home"
  ) {

    return null;

  }


  let note =
    String(
      text
    )
      .replace(
        /சம்பள பணத்திலிருந்து|சம்பளத்தில் இருந்து|சம்பளத்துலிருந்து|சம்பளத்துல இருந்து/g,
        ""
      )
      .replace(
        /வீட்டு பணத்திலிருந்து|வீட்டு பணத்தில் இருந்து|வீட்டிலிருந்து|வீட்டில் இருந்து/g,
        ""
      )
      .replace(
        /\d[\d,]*/g,
        ""
      )
      .replace(
        /₹/g,
        ""
      )
      .replace(
        /ரூபாய்|ரூபா/g,
        ""
      )
      .replace(
        /செலவு/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  if (
    note.length < 2
  ) {

    note =
      "பொதுவான செலவு";

  }


  const item = {

    id: uid(),

    note,

    amount,

    source,

    person: "",

    date:
      nowText()

  };


  db.expenses.push(
    item
  );


  const accountLog = {

    id: uid(),

    type:
      "out",

    amount,

    note:
      "🧾 " +
      note,

    date:
      item.date,

    kind:
      "general",

    expenseId:
      item.id

  };


  if (
    source === "salary"
  ) {

    db.salary.logs.push(
      accountLog
    );

  } else {

    db.home.logs.push(
      accountLog
    );

  }


  db.lastAction = {

    type:
      "expense",

    id:
      item.id

  };


  saveDB();


  return item;

}


/* =========================================================
   HOME INCOME FROM CHAT
   ========================================================= */

function addHomeIncomeFromChat(text) {

  const amount =
    parseAmount(
      text
    );


  if (
    !amount ||
    amount <= 0
  ) {

    return null;

  }


  const item = {

    id: uid(),

    type:
      "in",

    amount,

    note:
      "வீட்டிலிருந்து பணம் வந்தது",

    date:
      nowText(),

    kind:
      "direct"

  };


  db.home.logs.push(
    item
  );


  db.lastAction = {

    type:
      "home",

    id:
      item.id

  };


  saveDB();


  return item;

}


/* =========================================================
   SALARY INCOME FROM CHAT
   ========================================================= */

function addSalaryIncomeFromChat(text) {

  const amount =
    parseAmount(
      text
    );


  if (
    !amount ||
    amount <= 0
  ) {

    return null;

  }


  const item = {

    id: uid(),

    type:
      "in",

    amount,

    note:
      "சம்பளம் வந்தது",

    date:
      nowText(),

    kind:
      "direct"

  };


  db.salary.logs.push(
    item
  );


  db.lastAction = {

    type:
      "salary",

    id:
      item.id

  };


  saveDB();


  return item;

}


/* =========================================================
   UNDO
   ========================================================= */

function undoLast() {

  const action =
    db.lastAction;


  if (
    !action
  ) {

    addAIMessage(
      "❌ நீக்குவதற்கு சமீபத்திய பதிவு இல்லை."
    );

    speakText(
      "நீக்குவதற்கு சமீபத்திய பதிவு இல்லை"
    );

    return;

  }


  if (
    action.type ===
    "salary"
  ) {

    const index =
      db.salary.logs.findIndex(
        x =>
          Number(x.id) ===
          Number(action.id)
      );


    if (
      index >= 0
    ) {

      const item =
        db.salary.logs[index];


      if (
        item.kind === "farm" &&
        item.farmId
      ) {

        db.farm.logs =
          db.farm.logs.filter(
            x =>
              Number(x.id) !==
              Number(item.farmId)
          );

      }


      if (
        item.kind === "general" &&
        item.expenseId
      ) {

        db.expenses =
          db.expenses.filter(
            x =>
              Number(x.id) !==
              Number(item.expenseId)
          );

      }


      db.salary.logs.splice(
        index,
        1
      );

    }

  }


  else if (
    action.type ===
    "home"
  ) {

    const index =
      db.home.logs.findIndex(
        x =>
          Number(x.id) ===
          Number(action.id)
      );


    if (
      index >= 0
    ) {

      const item =
        db.home.logs[index];


      if (
        item.kind === "farm" &&
        item.farmId
      ) {

        db.farm.logs =
          db.farm.logs.filter(
            x =>
              Number(x.id) !==
              Number(item.farmId)
          );

      }


      if (
        item.kind === "general" &&
        item.expenseId
      ) {

        db.expenses =
          db.expenses.filter(
            x =>
              Number(x.id) !==
              Number(item.expenseId)
          );

      }


      db.home.logs.splice(
        index,
        1
      );

    }

  }


  else if (
    action.type ===
    "farm"
  ) {

    const index =
      db.farm.logs.findIndex(
        x =>
          Number(x.id) ===
          Number(action.id)
      );


    if (
      index >= 0
    ) {

      const farm =
        db.farm.logs[index];


      if (
        farm.source ===
        "salary"
      ) {

        db.salary.logs =
          db.salary.logs.filter(
            x =>
              Number(
                x.farmId
              ) !==
              Number(
                farm.id
              )
          );

      } else {

        db.home.logs =
          db.home.logs.filter(
            x =>
              Number(
                x.farmId
              ) !==
              Number(
                farm.id
              )
          );

      }


      db.farm.logs.splice(
        index,
        1
      );

    }

  }


  else if (
    action.type ===
    "expense"
  ) {

    const index =
      db.expenses.findIndex(
        x =>
          Number(x.id) ===
          Number(action.id)
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

        db.salary.logs =
          db.salary.logs.filter(
            x =>
              Number(
                x.expenseId
              ) !==
              Number(
                item.id
              )
          );

      } else {

        db.home.logs =
          db.home.logs.filter(
            x =>
              Number(
                x.expenseId
              ) !==
              Number(
                item.id
              )
          );

      }


      db.expenses.splice(
        index,
        1
      );

    }

  }


  else if (
    action.type ===
    "loan"
  ) {

    db.loans =
      db.loans.filter(
        x =>
          Number(x.id) !==
          Number(action.id)
      );

  }


  else if (
    action.type ===
    "reminder"
  ) {

    db.reminders =
      db.reminders.filter(
        x =>
          Number(x.id) !==
          Number(action.id)
      );

  }


  db.lastAction =
    null;


  saveDB();


  addAIMessage(
    "↩️ கடைசி பதிவை நீக்கிவிட்டேன்."
  );

  speakText(
    "கடைசி பதிவை நீக்கிவிட்டேன்"
  );

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

function sendMessage() {

  const input =
    getEl(
      "textInput"
    );


  if (
    !input
  ) {

    return;

  }


  const text =
    String(
      input.value || ""
    ).trim();


  if (
    !text
  ) {

    return;

  }


  input.value =
    "";


  addUserMessage(
    text
  );


  const t =
    text.toLowerCase();


  /*
     UNDO
  */

  if (
    hasAny(
      t,
      [
        "தப்பா",
        "தப்பு",
        "நீக்கு",
        "அழி",
        "undo",
        "wrong"
      ]
    )
  ) {

    undoLast();

    return;

  }


  /*
     BALANCE QUESTIONS
  */

  if (
    hasAny(
      t,
      [
        "சம்பள பணம் எவ்வளவு",
        "சம்பளத்தில் எவ்வளவு",
        "சம்பள மீதி",
        "சம்பள பாக்கி",
        "சம்பளம் எவ்வளவு",
        "salary balance"
      ]
    )
  ) {

    const bal =
      balance(
        "salary"
      );


    const reply =
      `💵 சம்பள பணத்தில் மீதி ${money(bal)}.`;


    addAIMessage(
      reply
    );

    speakText(
      reply
    );

    return;

  }


  if (
    hasAny(
      t,
      [
        "வீட்டு பணம் எவ்வளவு",
        "வீட்டு மீதி",
        "வீட்டு பாக்கி",
        "வீட்டில் எவ்வளவு",
        "வீட்டு கணக்கு",
        "home balance"
      ]
    )
  ) {

    const bal =
      balance(
        "home"
      );


    const reply =
      `🏠 வீட்டு பணத்தில் மீதி ${money(bal)}.`;


    addAIMessage(
      reply
    );

    speakText(
      reply
    );

    return;

  }


  /*
     FARM TOTAL
  */

  if (
    hasAny(
      t,
      [
        "கொல்லை மொத்த செலவு",
        "கொல்லை செலவு எவ்வளவு",
        "கொல்லைக்கு எவ்வளவு செலவு",
        "farm total"
      ]
    )
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
      `🌾 மொத்த கொல்லை செலவு ${money(total)}.`;


    addAIMessage(
      reply
    );

    speakText(
      reply
    );

    return;

  }


  /*
     REMINDER

     இது expense/loan parser-க்கு
     முன்னால் இருக்க வேண்டும்.
  */

  if (
    isReminderCommand(
      t
    )
  ) {

    const reminder =
      createReminderFromText(
        text
      );


    const reply =
      `⏰ ${reminder.date} ${reminder.time} மணிக்கு "${reminder.text}" நினைவூட்டல் வைத்துவிட்டேன்.`;


    addAIMessage(
      reply
    );

    speakText(
      reply
    );

    return;

  }


  /*
     LOAN

     Reminder அல்ல என்றால் மட்டும்.
  */

  if (
    isLoanCommand(
      t
    )
  ) {

    const amount =
      parseAmount(
        text
      );


    if (
      amount > 0
    ) {

      const loan =
        addLoanFromChat(
          text
        );


      const reply =
        `📊 ${loan.name} பெயரில் ${money(loan.amount)} அசல், ${loan.rate} பைசா மாத வட்டி கணக்கில் சேர்த்துவிட்டேன்.`;


      addAIMessage(
        reply
      );

      speakText(
        reply
      );

      return;

    }

  }


  /*
     HOME INCOME

     முக்கியம்:

     "வீட்டிலிருந்து 30000 பணம்
      கொடுத்திருக்காங்க"

     -> HOME INCOME

     இது வீட்டுச் செலவு அல்ல.
  */

  const homeFrom =
    (
      t.includes(
        "வீட்டிலிருந்து"
      ) ||
      t.includes(
        "வீட்டில் இருந்து"
      ) ||
      t.includes(
        "வீட்டு பணம் வந்தது"
      ) ||
      t.includes(
        "வீட்டிலிருந்து பணம்"
      )
    );


  if (
    homeFrom &&
    parseAmount(text) > 0 &&
    !hasAny(
      t,
      [
        "செலவு",
        "வாங்கினேன்",
        "வாங்குனேன்",
        "போட்டேன்",
        "கொடுத்தேன்"
      ]
    )
  ) {

    const item =
      addHomeIncomeFromChat(
        text
      );


    const reply =
      `🏠 வீட்டிலிருந்து ${money(item.amount)} வரவு சேமித்துவிட்டேன். வீட்டு கணக்கு மீதி ${money(balance("home"))}.`;


    addAIMessage(
      reply
    );

    speakText(
      reply
    );

    return;

  }


  /*
     SALARY INCOME
  */

  if (
    (
      t.includes(
        "சம்பளம் வந்தது"
      ) ||
      t.includes(
        "சம்பளம் வந்துச்சு"
      ) ||
      t.includes(
        "சம்பள வரவு"
      ) ||
      t.includes(
        "சம்பளம் கிடைத்தது"
      )
    ) &&
    parseAmount(text) > 0
  ) {

    const item =
      addSalaryIncomeFromChat(
        text
      );


    const reply =
      `💵 சம்பள வரவு ${money(item.amount)} சேமித்துவிட்டேன். சம்பள மீதி ${money(balance("salary"))}.`;


    addAIMessage(
      reply
    );

    speakText(
      reply
    );

    return;

  }


  /*
     FARM EXPENSE

     Source கட்டாயம்.
  */

  if (
    isFarmExpense(
      t
    ) &&
    hasAny(
      t,
      [
        "செலவு",
        "வாங்கி",
        "வாங்குனேன்",
        "வாங்கினேன்",
        "போட்டேன்",
        "கூலி",
        "மருந்து",
        "உரம்",
        "டீசல்"
      ]
    )
  ) {

    const amount =
      parseAmount(
        text
      );


    if (
      amount > 0
    ) {

      const source =
        detectSource(
          text
        );


      if (
        !source
      ) {

        const reply =
          "🌾 கொல்லை செலவு தொகை புரிந்தது. ஆனால் எந்த பணத்திலிருந்து செலவு செய்தீர்கள்? சம்பள பணமா அல்லது வீட்டு பணமா என்று சொல்லுங்கள்.";

        addAIMessage(
          reply
        );

        speakText(
          reply
        );

        return;

      }


      const item =
        addFarmFromChat(
          text
        );


      const reply =
        `🌾 ${item.note} ${money(item.amount)} கொல்லை செலவாக பதிவு செய்துவிட்டேன். ${sourceTamil(item.source)}-லிருந்து கழித்துவிட்டேன். மொத்த கொல்லை செலவு ${money(
          db.farm.logs.reduce(
            (s, x) =>
              s +
              Number(
                x.amount || 0
              ),
            0
          )
        )}.`;


      addAIMessage(
        reply
      );

      speakText(
        reply
      );

      return;

    }

  }


  /*
     DIRECT EXPENSE

     Source இல்லாமல் save செய்யக் கூடாது.
  */

  const expenseIntent =
    hasAny(
      t,
      [
        "செலவு",
        "வாங்கினேன்",
        "வாங்குனேன்",
        "போட்டேன்",
        "குடித்தேன்",
        "சாப்பிட்டேன்",
        "பெட்ரோல்",
        "டீ",
        "காபி",
        "டிபன்",
        "காய்கறி",
        "மருந்து"
      ]
    );


  if (
    expenseIntent &&
    parseAmount(text) > 0
  ) {

    const source =
      detectSource(
        text
      );


    if (
      !source
    ) {

      const reply =
        "💰 செலவு தொகை புரிந்தது. ஆனால் எந்த பணத்திலிருந்து செலவு செய்தீர்கள்? சம்பள பணமா அல்லது வீட்டு பணமா என்று சொல்லுங்கள்.";

      addAIMessage(
        reply
      );

      speakText(
        reply
      );

      return;

    }


    const item =
      addExpenseFromChat(
        text
      );


    const reply =
      `🔴 ${money(item.amount)} செலவு பதிவு. ${sourceTamil(item.source)}-லிருந்து கழித்துவிட்டேன். ${source === "salary" ? "சம்பள" : "வீட்டு"} மீதி ${money(balance(source))}.`;


    addAIMessage(
      reply
    );

    speakText(
      reply
    );

    return;

  }


  /*
     BALANCE SIMPLE QUESTIONS
  */

  if (
    t.includes("சம்பளம்")
  ) {

    const reply =
      `💵 சம்பள பணத்தில் மீதி ${money(balance("salary"))}.`;

    addAIMessage(
      reply
    );

    speakText(
      reply
    );

    return;

  }


  if (
    t.includes("வீடு")
  ) {

    const reply =
      `🏠 வீட்டு பணத்தில் மீதி ${money(balance("home"))}.`;

    addAIMessage(
      reply
    );

    speakText(
      reply
    );

    return;

  }


  /*
     DEFAULT
  */

  const reply =
    "புரிந்துகொண்டேன். பணம்/செலவு பதிவு செய்ய வேண்டுமெனில் தொகையுடன் சம்பள பணமா அல்லது வீட்டு பணமா என்பதையும் சொல்லுங்கள்.";


  addAIMessage(
    reply
  );

  speakText(
    reply
  );

}


/* =========================================================
   RENDER HOME SUMMARY
   ========================================================= */

function renderHome() {

  const salary =
    getEl(
      "summarySalary"
    );


  const home =
    getEl(
      "summaryHome"
    );


  const expense =
    getEl(
      "summaryExpense"
    );


  const rem =
    getEl(
      "summaryRem"
    );


  if (
    salary
  ) {

    salary.textContent =
      money(
        balance(
          "salary"
        )
      );

  }


  if (
    home
  ) {

    home.textContent =
      money(
        balance(
          "home"
        )
      );

  }


  if (
    expense
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


    expense.textContent =
      money(
        total
      );

  }


  if (
    rem
  ) {

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
    getEl(
      "salaryBalance",
      "salBal"
    );


  if (
    bal
  ) {

    bal.textContent =
      Number(
        balance(
          "salary"
        )
      ).toLocaleString(
        "en-IN"
      );

  }


  const list =
    getEl(
      "salaryList"
    );


  if (
    !list
  ) {

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
      .slice()
      .reverse()
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
    getEl(
      "homeBalance",
      "homeBal"
    );


  if (
    bal
  ) {

    bal.textContent =
      Number(
        balance(
          "home"
        )
      ).toLocaleString(
        "en-IN"
      );

  }


  const list =
    getEl(
      "homeList"
    );


  if (
    !list
  ) {

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
      .slice()
      .reverse()
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
    getEl(
      "farmList"
    );


  if (
    !list
  ) {

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
        Number(
          item.amount || 0
        ),
      0
    );


  const totalEl =
    getEl(
      "farmTotal"
    );


  if (
    totalEl
  ) {

    totalEl.textContent =
      Number(
        total
      ).toLocaleString(
        "en-IN"
      );

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
                item.category
                  ? " • " +
                    escapeHTML(
                      item.category
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
    getEl(
      "expenseList"
    );


  if (
    !list
  ) {

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
      .slice()
      .reverse()
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
    getEl(
      "loanList"
    );


  if (
    !list
  ) {

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
                ${escapeHTML(
                  name
                )}
              </h3>

              <div class="loan-person-summary">

                அசல் மீதி:
                <b>
                  ${money(
                    total
                  )}
                </b>

                <br>

                மாத வட்டி:
                <b>
                  ${money(
                    interest
                  )}
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
                      ${loan.rate}
                      பைசா
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
                          loan.paid ||
                          0
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
    getEl(
      "tempList"
    );


  const perm =
    getEl(
      "permList"
    );


  if (
    temp
  ) {

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


  if (
    perm
  ) {

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
    getEl(
      "reminderList"
    );


  if (
    !list
  ) {

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
            reminderTarget(
              a
            );

          const tb =
            reminderTarget(
              b
            );


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

                📅
                ${escapeHTML(
                  item.date
                )}

                ⏰
                ${escapeHTML(
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
   PAGE NAVIGATION
   ========================================================= */

function showPage(index) {

  /*
     பல HTML structure-களையும் support செய்யும்.
  */

  const pages =
    document.querySelectorAll(
      ".page, .app-page, .tab-page"
    );


  const buttons =
    document.querySelectorAll(
      ".tab-btn"
    );


  if (
    pages.length
  ) {

    pages.forEach(
      (page, i) => {

        page.classList.toggle(
          "active",
          i === Number(index)
        );

      }
    );

  }


  if (
    buttons.length
  ) {

    buttons.forEach(
      (button, i) => {

        button.classList.toggle(
          "active",
          i === Number(index)
        );

      }
    );

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
      event.target &&
      event.target.id ===
      "textInput" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeJacky() {

  loadDB();

  renderAll();

  scheduleAllReminders();

  checkReminders();


  /*
     15 second reminder checking
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
     Foreground
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
     Default reminder date
  */

  const date =
    getEl(
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
    "🎙️ JACKY AI v8 READY"
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

window.deleteSalaryLog =
  deleteSalaryLog;

window.deleteHomeLog =
  deleteHomeLog;

window.deleteFarmLog =
  deleteFarmLog;

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

window.renderAll =
  renderAll;