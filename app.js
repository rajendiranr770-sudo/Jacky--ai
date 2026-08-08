(()=>{
"use strict";

/* =========================================================
   JACKY SMART PA
   COMPLETE APP.JS v5
   ========================================================= */

const KEY = "jacky_ai_final_v3";

const DEFAULT_DB = {
    salary: [],
    farm: [],
    expense: [],
    home: [],
    loans: [],
    temp: [],
    perm: [],
    reminders: []
};

let DB = loadDB();
let recognition = null;


/* =========================================================
   BASIC HELPERS
========================================================= */

const $ = id =>
    document.getElementById(id);


const uid = () =>
    Date.now().toString(36) +
    Math.random().toString(36).slice(2);


const now = () =>
    new Date().toISOString();


const money = value =>
    Number(value || 0).toLocaleString("en-IN",{
        maximumFractionDigits:2
    });


const dateTime = value => {

    try{

        return new Date(value).toLocaleString(
            "ta-IN",
            {
                dateStyle:"short",
                timeStyle:"short"
            }
        );

    }catch(e){

        return String(value || "");
    }
};


/* =========================================================
   LOAD / SAVE
========================================================= */

function loadDB(){

    try{

        const saved =
            JSON.parse(
                localStorage.getItem(KEY) || "{}"
            );

        return {

            ...DEFAULT_DB,

            ...saved,

            salary:
                Array.isArray(saved.salary)
                ? saved.salary
                : [],

            farm:
                Array.isArray(saved.farm)
                ? saved.farm
                : [],

            expense:
                Array.isArray(saved.expense)
                ? saved.expense
                : [],

            home:
                Array.isArray(saved.home)
                ? saved.home
                : [],

            loans:
                Array.isArray(saved.loans)
                ? saved.loans
                : [],

            temp:
                Array.isArray(saved.temp)
                ? saved.temp
                : [],

            perm:
                Array.isArray(saved.perm)
                ? saved.perm
                : [],

            reminders:
                Array.isArray(saved.reminders)
                ? saved.reminders
                : []

        };

    }catch(error){

        console.error(
            "DB load error:",
            error
        );

        return {
            ...DEFAULT_DB
        };
    }
}


function saveDB(){

    try{

        localStorage.setItem(
            KEY,
            JSON.stringify(DB)
        );

    }catch(error){

        console.error(
            "DB save error:",
            error
        );
    }

    render();
}


/* =========================================================
   PAGE NAVIGATION — FIX
========================================================= */

function showPage(page){

    console.log(
        "Jacky navigation:",
        page
    );


    /* Hide every page */

    document
        .querySelectorAll(".page")
        .forEach(section => {

            section.classList.remove("active");

        });


    /* Find requested page */

    const target =
        document.getElementById(page);


    if(!target){

        console.error(
            "Jacky page not found:",
            page
        );

        return;
    }


    /* Show selected page */

    target.classList.add("active");


    /* Go to top */

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
}


/* Make available to HTML onclick */

window.showPage =
    showPage;


/* =========================================================
   GENERIC ADD / DELETE
========================================================= */

function addRecord(bucket,data){

    if(!Array.isArray(DB[bucket])){

        DB[bucket] = [];
    }


    DB[bucket].push({

        id:uid(),

        date:now(),

        ...data

    });


    saveDB();
}


function deleteRecord(bucket,id){

    if(!Array.isArray(DB[bucket]))
        return;


    DB[bucket] =
        DB[bucket].filter(
            item =>
                item.id !== id
        );


    saveDB();
}


window.deleteById =
    deleteRecord;


function deleteButton(bucket,id){

    return `

        <button
            type="button"
            class="danger"
            onclick="deleteById('${bucket}','${id}')">

            🗑️

        </button>

    `;
}


function recordHTML(
    bucket,
    item,
    title,
    sub
){

    return `

        <div class="record">

            <div>

                <b>
                    ${escapeHTML(title)}
                </b>

                <small>
                    ${escapeHTML(sub)}
                </small>

            </div>

            ${deleteButton(
                bucket,
                item.id
            )}

        </div>

    `;
}


/* =========================================================
   HTML SAFETY
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
   PERSON
========================================================= */

function normalizePerson(text){

    const t =
        String(text || "")
            .trim();


    if(
        /மணிமேகலை/i.test(t) ||
        /\bmm\b/i.test(t)
    ){

        return "மணிமேகலை (MM)";
    }


    if(
        /கலைசெந்தாமரை/i.test(t) ||
        /\bks\b/i.test(t)
    ){

        return "கலைசெந்தாமரை (KS)";
    }


    return t;
}


function personFromText(text){

    return normalizePerson(text);
}


/* =========================================================
   AMOUNT PARSER
========================================================= */

function parseAmount(text){

    const t =
        String(text || "")
            .replace(/,/g,"");


    let number = 0;


    const match =
        t.match(/\d+(?:\.\d+)?/);


    if(match){

        number =
            Number(match[0]);
    }


    const tamilAmounts = {

        "ஐம்பதாயிரம்":50000,

        "நாற்பதாயிரம்":40000,

        "முப்பதாயிரம்":30000,

        "இருபதாயிரம்":20000,

        "பத்தாயிரம்":10000,

        "ஐந்தாயிரம்":5000,

        "நான்காயிரம்":4000,

        "மூன்றாயிரம்":3000,

        "இரண்டாயிரம்":2000,

        "ஆயிரம்":1000

    };


    for(
        const word in tamilAmounts
    ){

        if(t.includes(word)){

            return tamilAmounts[word];
        }
    }


    if(/லட்சம்/i.test(t)){

        return (
            number || 1
        ) * 100000;
    }


    if(/ஆயிரம்/i.test(t)){

        return (
            number || 1
        ) * 1000;
    }


    return number;
}


/* =========================================================
   SOURCE
========================================================= */

function detectSource(text){

    const t =
        String(text || "");


    if(
        /வீட்டு பணம்|வீட்டு கணக்கு|வீட்டிலிருந்து|வீட்டு பணத்தில்|வீட்டில் இருந்து/i.test(t)
    ){

        return "home";
    }


    if(
        /சம்பள பணம்|சம்பள கணக்கு|சம்பளத்தில்|சம்பளத்திலிருந்து/i.test(t)
    ){

        return "salary";
    }


    if(
        /கொல்லை பணம்|கொல்லை கணக்கு|கொல்லையில்|கொல்லையிலிருந்து/i.test(t)
    ){

        return "farm";
    }


    return null;
}


/* =========================================================
   EXPENSE CATEGORY
========================================================= */

function detectCategory(text){

    const t =
        String(text || "");


    if(/பெட்ரோல்|petrol/i.test(t))
        return "பெட்ரோல்";


    if(/டீசல்|diesel/i.test(t))
        return "டீசல்";


    if(/மருந்து/i.test(t))
        return "மருந்து";


    if(/உரம்/i.test(t))
        return "உரம்";


    if(
        /சாப்பாடு|உணவு|டிபன்|காபி|டீ/i.test(t)
    )
        return "சாப்பாடு";


    if(/காய்கறி/i.test(t))
        return "காய்கறி";


    if(
        /உடை|துணி|dress/i.test(t)
    )
        return "உடை";


    return "மற்ற செலவு";
}


/* =========================================================
   SALARY
========================================================= */

window.addSalary = function(type){

    const amount =
        Number(
            $("salaryAmount")?.value || 0
        );


    const note =
        $("salaryNote")?.value.trim() ||
        "நேரடி";


    if(amount <= 0){

        alert(
            "தொகையை உள்ளிடுங்கள்."
        );

        return;
    }


    addRecord(
        "salary",
        {
            type,
            amt:amount,
            note
        }
    );


    if($("salaryAmount"))
        $("salaryAmount").value = "";


    if($("salaryNote"))
        $("salaryNote").value = "";
};


/* =========================================================
   HOME ACCOUNT
========================================================= */

window.addHome = function(type){

    const amount =
        Number(
            $("homeAmount")?.value || 0
        );


    const note =
        $("homeNote")?.value.trim() ||
        "நேரடி";


    if(amount <= 0){

        alert(
            "தொகையை உள்ளிடுங்கள்."
        );

        return;
    }


    addRecord(
        "home",
        {
            type,
            amt:amount,
            note
        }
    );


    if($("homeAmount"))
        $("homeAmount").value = "";


    if($("homeNote"))
        $("homeNote").value = "";
};


/* =========================================================
   EXPENSE TRANSACTION
========================================================= */

function addExpenseTransaction(
    note,
    amount,
    source,
    person
){

    const expenseId =
        uid();


    const expense = {

        id:expenseId,

        date:now(),

        note,

        amt:Number(amount),

        source,

        person:person || ""

    };


    DB.expense.push(
        expense
    );


    /*
       Home money
    */

    if(source === "home"){

        DB.home.push({

            id:uid(),

            date:expense.date,

            type:"out",

            amt:Number(amount),

            note:
                note +
                (
                    person
                    ? " — " + person
                    : ""
                ),

            linked:expenseId

        });
    }


    /*
       Salary money
    */

    if(source === "salary"){

        DB.salary.push({

            id:uid(),

            date:expense.date,

            type:"out",

            amt:Number(amount),

            note:
                note +
                (
                    person
                    ? " — " + person
                    : ""
                ),

            linked:expenseId

        });
    }


    /*
       Farm money
    */

    if(source === "farm"){

        DB.farm.push({

            id:uid(),

            date:expense.date,

            amt:Number(amount),

            note,

            linked:expenseId

        });
    }


    saveDB();
}


/* =========================================================
   MANUAL EXPENSE
========================================================= */

window.addExpenseManual = function(){

    const note =
        $("expenseNote")
        ?.value
        .trim() || "";


    const amount =
        Number(
            $("expenseAmount")
            ?.value || 0
        );


    const person =
        personFromText(
            $("expensePerson")
            ?.value || ""
        );


    const source =
        $("expenseSource")
        ?.value || "home";


    if(!note){

        alert(
            "செலவு விவரத்தை உள்ளிடுங்கள்."
        );

        return;
    }


    if(amount <= 0){

        alert(
            "தொகையை உள்ளிடுங்கள்."
        );

        return;
    }


    addExpenseTransaction(
        note,
        amount,
        source,
        person
    );


    if($("expenseNote"))
        $("expenseNote").value = "";


    if($("expenseAmount"))
        $("expenseAmount").value = "";


    if($("expensePerson"))
        $("expensePerson").value = "";
};


/* =========================================================
   FARM
========================================================= */

window.addFarm = function(){

    const amount =
        Number(
            $("farmAmount")
            ?.value || 0
        );


    const note =
        $("farmNote")
        ?.value.trim() ||
        "கொல்லை செலவு";


    const source =
        $("farmSource")
        ?.value || "farm";


    if(amount <= 0){

        alert(
            "தொகையை உள்ளிடுங்கள்."
        );

        return;
    }


    addExpenseTransaction(
        note,
        amount,
        source,
        ""
    );


    if($("farmAmount"))
        $("farmAmount").value = "";


    if($("farmNote"))
        $("farmNote").value = "";
};


/* =========================================================
   LOANS
========================================================= */

function nextLoanNumber(person){

    const same =
        DB.loans.filter(
            x =>
                String(x.name || "")
                    .toLowerCase() ===
                String(person || "")
                    .toLowerCase()
        );


    return same.length + 1;
}


window.addLoan = function(){

    const name =
        $("loanName")
        ?.value.trim() || "";


    const amount =
        Number(
            $("loanAmount")
            ?.value || 0
        );


    const rate =
        Number(
            $("loanRate")
            ?.value || 0
        );


    const startDate =
        $("loanDate")
        ?.value ||
        new Date()
            .toISOString()
            .slice(0,10);


    if(!name){

        alert(
            "பெயரை உள்ளிடுங்கள்."
        );

        return;
    }


    if(amount <= 0){

        alert(
            "அசல் தொகையை உள்ளிடுங்கள்."
        );

        return;
    }


    const person =
        normalizePerson(name);


    const accountNo =
        nextLoanNumber(person);


    addRecord(
        "loans",
        {

            name:person,

            accountNo,

            amt:amount,

            rate,

            startDate,

            interestPaid:[]

        }
    );


    if($("loanName"))
        $("loanName").value = "";


    if($("loanAmount"))
        $("loanAmount").value = "";


    if($("loanRate"))
        $("loanRate").value = "";


    if($("loanDate"))
        $("loanDate").value = "";


    alert(
        `${person}\nAccount #${accountNo} உருவாக்கப்பட்டது.`
    );
};


/* =========================================================
   LOAN CALCULATION
========================================================= */

function calculateLoan(loan){

    const start =
        new Date(
            loan.startDate ||
            loan.date ||
            now()
        );


    const current =
        new Date();


    let months =
        (
            current.getFullYear() -
            start.getFullYear()
        ) * 12 +
        (
            current.getMonth() -
            start.getMonth()
        ) + 1;


    if(months < 1)
        months = 1;


    const monthlyInterest =
        Number(loan.amt || 0) *
        Number(loan.rate || 0) /
        100;


    const totalInterest =
        monthlyInterest *
        months;


    const paidInterest =
        Array.isArray(
            loan.interestPaid
        )
        ? loan.interestPaid.reduce(
            (sum,item) =>
                sum +
                Number(item.amt || 0),
            0
        )
        : 0;


    const balanceInterest =
        Math.max(
            0,
            totalInterest -
            paidInterest
        );


    return {

        months,

        monthlyInterest,

        totalInterest,

        paidInterest,

        balanceInterest,

        totalDue:
            Number(loan.amt || 0) +
            balanceInterest

    };
}


/* =========================================================
   INTEREST QUERY
========================================================= */

function interestQuery(text){

    if(
        !/வட்டி|அசல்|கடன்|தரணும்|லோன்|loan/i.test(text)
    ){

        return null;
    }


    const person =
        personFromText(text);


    if(
        /எல்லா|யார்|பட்டியல்|அனைத்து/i.test(text)
    ){

        if(!DB.loans.length){

            return "வட்டி கணக்கு எதுவும் இல்லை.";
        }


        return (

            "📋 வட்டி கணக்கு பட்டியல்:\n\n" +

            DB.loans
                .map(loan => {

                    const c =
                        calculateLoan(loan);


                    return (

                        `${loan.name} — Account #${loan.accountNo || 1}\n` +

                        `அசல் ₹${money(loan.amt)}\n` +

                        `வட்டி ${loan.rate}% / மாதம்\n` +

                        `மீதமுள்ள வட்டி ₹${money(c.balanceInterest)}`
                    );

                })
                .join("\n\n")
        );
    }


    let matches = [];


    if(person){

        matches =
            DB.loans.filter(
                loan =>
                    String(loan.name || "")
                        .toLowerCase() ===
                    String(person || "")
                        .toLowerCase()
            );
    }


    if(matches.length > 1){

        return (

            `${person} — ${matches.length} Loan Accounts:\n\n` +

            matches
                .map(loan => {

                    const c =
                        calculateLoan(loan);


                    return (

                        `📁 Account #${loan.accountNo || 1}\n` +

                        `அசல் ₹${money(loan.amt)}\n` +

                        `மாத வட்டி ${loan.rate}% = ₹${money(c.monthlyInterest)}\n` +

                        `மாதங்கள் ${c.months}\n` +

                        `மொத்த வட்டி ₹${money(c.totalInterest)}\n` +

                        `செலுத்தியது ₹${money(c.paidInterest)}\n` +

                        `மீதமுள்ள வட்டி ₹${money(c.balanceInterest)}\n` +

                        `மொத்தம் ₹${money(c.totalDue)}\n` +

                        `தொடக்கம் ${loan.startDate}`

                    );

                })
                .join("\n\n")
        );
    }


    let loan =
        matches[0];


    if(!loan){

        const accountMatch =
            text.match(
                /(?:account|அக்கவுண்ட்|கணக்கு)\s*#?\s*(\d+)/i
            );


        if(
            person &&
            accountMatch
        ){

            const number =
                Number(
                    accountMatch[1]
                );


            loan =
                DB.loans.find(
                    x =>
                        String(x.name || "")
                            .toLowerCase() ===
                        String(person || "")
                            .toLowerCase() &&
                        Number(x.accountNo || 1) ===
                        number
                );
        }
    }


    if(!loan){

        if(!person){

            return (
                "யாருடைய வட்டி கணக்கு வேண்டும்? பெயரைச் சொல்லுங்கள்."
            );
        }


        return (
            `${person} பெயரில் Loan Account இல்லை.`
        );
    }


    const c =
        calculateLoan(loan);


    return (

        `${loan.name} — Account #${loan.accountNo || 1}\n` +

        `அசல் ₹${money(loan.amt)}\n` +

        `மாத வட்டி ${loan.rate}% = ₹${money(c.monthlyInterest)}\n` +

        `மாதங்கள் ${c.months}\n` +

        `மொத்த வட்டி ₹${money(c.totalInterest)}\n` +

        `செலுத்திய வட்டி ₹${money(c.paidInterest)}\n` +

        `மீதமுள்ள வட்டி ₹${money(c.balanceInterest)}\n` +

        `மொத்தம் தர வேண்டியது ₹${money(c.totalDue)}\n` +

        `தொடக்கம் ${loan.startDate}`

    );
}


/* =========================================================
   NOTES
========================================================= */

window.addNote = function(type){

    const input =
        type === "temp"
        ? $("tempText")
        : $("permText");


    if(!input)
        return;


    const text =
        input.value.trim();


    if(!text)
        return;


    addRecord(
        type === "temp"
        ? "temp"
        : "perm",
        {
            text
        }
    );


    input.value = "";
};


window.clearTemporary = function(){

    if(
        confirm(
            "அனைத்து தற்காலிக குறிப்புகளையும் அழிக்கவா?"
        )
    ){

        DB.temp = [];

        saveDB();
    }
};


/* =========================================================
   REMINDERS
========================================================= */

window.addReminder = function(){

    const text =
        $("reminderText")
        ?.value.trim() || "";


    const date =
        $("reminderDate")
        ?.value || "";


    const time =
        $("reminderTime")
        ?.value || "";


    const early =
        Number(
            $("reminderEarly")
            ?.value || 60
        );


    if(
        !text ||
        !date ||
        !time
    ){

        alert(
            "நினைவூட்டல், தேதி, நேரம் ஆகியவற்றை உள்ளிடுங்கள்."
        );

        return;
    }


    addRecord(
        "reminders",
        {

            text,

            target:
                new Date(
                    `${date}T${time}`
                ).toISOString(),

            early,

            earlyDone:false,

            done:false

        }
    );


    if($("reminderText"))
        $("reminderText").value = "";
};


/* =========================================================
   REMINDER CHAT PARSER
========================================================= */

function parseReminderText(text){

    if(
        !/ஞாபகப்படுத்து|நினைவூட்டு|நினைவில் வை|remind/i.test(text)
    ){

        return null;
    }


    const target =
        new Date();


    if(
        /நாளை|நாளைக்கு/i.test(text)
    ){

        target.setDate(
            target.getDate() + 1
        );
    }


    const timeMatch =
        text.match(
            /(\d{1,2})(?:[:.](\d{1,2}))?\s*(மணி|am|pm)?/i
        );


    if(timeMatch){

        let hour =
            Number(
                timeMatch[1]
            );


        const minute =
            Number(
                timeMatch[2] || 0
            );


        const ampm =
            String(
                timeMatch[3] || ""
            )
            .toLowerCase();


        if(
            ampm === "pm" &&
            hour < 12
        ){

            hour += 12;
        }


        if(
            ampm === "am" &&
            hour === 12
        ){

            hour = 0;
        }


        target.setHours(
            hour,
            minute,
            0,
            0
        );
    }


    const earlyMatch =
        text.match(
            /(\d+)\s*நிமிடம்/i
        );


    const early =
        earlyMatch
        ? Number(earlyMatch[1])
        : 60;


    const clean =
        text

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
                /(\d+)\s*நிமிடம்/i,
                ""
            )

            .trim() ||

        "நினைவூட்டல்";


    addRecord(
        "reminders",
        {

            text:clean,

            target:
                target.toISOString(),

            early,

            earlyDone:false,

            done:false

        }
    );


    return (

        `சரி. “${clean}” — ${dateTime(target)}. ` +

        `${early} நிமிடம் முன்பும் நினைவூட்டுவேன்.`

    );
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

window.requestNotifications =
async function(){

    if(
        !("Notification" in window)
    ){

        alert(
            "இந்த browser Notification ஆதரிக்கவில்லை."
        );

        return;
    }


    try{

        const permission =
            await Notification.requestPermission();


        if(permission === "granted"){

            alert(
                "🔔 Notification அனுமதி கிடைத்தது."
            );

        }else{

            alert(
                "Notification அனுமதி கிடைக்கவில்லை."
            );
        }

    }catch(error){

        console.error(error);

        alert(
            "Notification அனுமதி பெற முடியவில்லை."
        );
    }
};


/* =========================================================
   SPEECH
========================================================= */

function speak(text){

    if(
        !("speechSynthesis" in window)
    )
        return;


    try{

        speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                text
            );


        utterance.lang =
            "ta-IN";


        utterance.rate =
            0.95;


        speechSynthesis.speak(
            utterance
        );

    }catch(error){

        console.error(
            "Speech error:",
            error
        );
    }
}


/* =========================================================
   CHAT
========================================================= */

function addChatMessage(
    text,
    type
){

    const box =
        $("chatBox");


    if(!box)
        return;


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "message " + type;


    div.textContent =
        text;


    box.appendChild(
        div
    );


    box.scrollTop =
        box.scrollHeight;
}


window.clearChat = function(){

    const box =
        $("chatBox");


    if(!box)
        return;


    box.innerHTML = `

        <div class="message ai">
            Chat அழிக்கப்பட்டது.
        </div>

    `;
};


/* =========================================================
   EXPENSE QUERY
========================================================= */

function expenseQuery(text){

    if(
        !/எவ்வளவு|என்னென்ன|மொத்தம்/i.test(text)
    ){

        return null;
    }


    const category =
        detectCategory(text);


    const person =
        personFromText(text);


    const source =
        detectSource(text);


    const current =
        new Date();


    const thisMonth =
        /இந்த மாதம்|இந்த மாசம்/i.test(text);


    let from = null;
    let to = null;


    if(thisMonth){

        from =
            new Date(
                current.getFullYear(),
                current.getMonth(),
                1
            );


        to =
            new Date(
                current.getFullYear(),
                current.getMonth() + 1,
                1
            );
    }


    const result =
        DB.expense.filter(item => {

            const categoryOK =
                category === "மற்ற செலவு" ||
                item.note === category;


            const personOK =
                !person ||
                item.person === person;


            const sourceOK =
                !source ||
                item.source === source;


            const dateOK =
                !from ||
                (
                    new Date(item.date) >= from &&
                    new Date(item.date) < to
                );


            return (
                categoryOK &&
                personOK &&
                sourceOK &&
                dateOK
            );

        });


    if(!result.length){

        return (
            "அந்த நிபந்தனைக்கு செலவு பதிவு இல்லை."
        );
    }


    const total =
        result.reduce(
            (sum,item) =>
                sum +
                Number(item.amt || 0),
            0
        );


    return (

        `${person ? person + " — " : ""}` +

        `${category} செலவு மொத்தம் ₹${money(total)}\n\n` +

        result
            .map(item => {

                const sourceName =
                    item.source === "home"
                    ? "வீடு"
                    : item.source === "salary"
                    ? "சம்பளம்"
                    : "கொல்லை";


                return (

                    `• ${item.note} ₹${money(item.amt)} ` +

                    `• ${item.person || "பொது"} ` +

                    `• ${sourceName}`

                );

            })
            .join("\n")
    );
}


/* =========================================================
   ALL EXPENSES
========================================================= */

function allExpenses(text){

    if(
        !/என்னென்ன செலவு|மொத்த செலவு|இந்த மாத செலவு|இந்த மாசம் செலவு/i.test(text)
    ){

        return null;
    }


    const current =
        new Date();


    const from =
        new Date(
            current.getFullYear(),
            current.getMonth(),
            1
        );


    const to =
        new Date(
            current.getFullYear(),
            current.getMonth() + 1,
            1
        );


    const result =
        DB.expense.filter(
            item =>
                new Date(item.date) >= from &&
                new Date(item.date) < to
        );


    if(!result.length){

        return (
            "இந்த மாதம் செலவு பதிவு இல்லை."
        );
    }


    const grouped = {};


    result.forEach(item => {

        const key =
            item.note ||
            "மற்ற செலவு";


        grouped[key] =
            (
                grouped[key] || 0
            ) +
            Number(item.amt || 0);

    });


    const total =
        result.reduce(
            (sum,item) =>
                sum +
                Number(item.amt || 0),
            0
        );


    return (

        `இந்த மாத மொத்த செலவு ₹${money(total)}\n\n` +

        Object.entries(grouped)
            .map(
                ([name,value]) =>
                    `• ${name}: ₹${money(value)}`
            )
            .join("\n")

    );
}


/* =========================================================
   BALANCE QUERY
========================================================= */

function balanceQuery(text){

    if(
        /சம்பள.*மீதி|salary.*balance/i.test(text)
    ){

        const balance =
            DB.salary.reduce(
                (sum,item) =>
                    sum +
                    (
                        item.type === "in"
                        ? Number(item.amt || 0)
                        : -Number(item.amt || 0)
                    ),
                0
            );


        return (
            `சம்பள மீதி ₹${money(balance)}`
        );
    }


    if(
        /வீட்டு.*மீதி|home.*balance/i.test(text)
    ){

        const balance =
            DB.home.reduce(
                (sum,item) =>
                    sum +
                    (
                        item.type === "in"
                        ? Number(item.amt || 0)
                        : -Number(item.amt || 0)
                    ),
                0
            );


        return (
            `வீட்டு மீதி ₹${money(balance)}`
        );
    }


    return null;
}


/* =========================================================
   EXPENSE MESSAGE
========================================================= */

function processExpenseMessage(text){

    if(
        !/பெட்ரோல்|மருந்து|உரம்|சாப்பாடு|காய்கறி|உடை|செலவு|வாங்கினேன்|வாங்கினோம்/i.test(text)
    ){

        return null;
    }


    const amount =
        parseAmount(text);


    const source =
        detectSource(text);


    const person =
        personFromText(text);


    const category =
        detectCategory(text);


    if(
        amount &&
        source
    ){

        addExpenseTransaction(
            category,
            amount,
            source,
            person
        );


        const sourceName =
            source === "home"
            ? "வீட்டு"
            : source === "salary"
            ? "சம்பள"
            : "கொல்லை";


        return (

            `சரி. ` +

            `${person ? person + "க்கு " : ""}` +

            `${category} ₹${money(amount)} பதிவு செய்தேன்.\n` +

            `${sourceName} பணத்திலிருந்து குறைத்தேன்.`

        );
    }


    if(amount){

        return (

            "செலவு எந்த பணத்தில் இருந்து?\n" +

            "வீட்டு பணமா, சம்பள பணமா, கொல்லை பணமா?"

        );
    }


    return null;
}


/* =========================================================
   MAIN AI
========================================================= */

window.sendMessage = function(){

    const input =
        $("textInput");


    if(!input)
        return;


    const text =
        input.value.trim();


    if(!text)
        return;


    addChatMessage(
        text,
        "user"
    );


    input.value = "";


    let response = null;


    response =
        parseReminderText(text);


    if(!response)
        response =
            interestQuery(text);


    if(!response)
        response =
            allExpenses(text);


    if(!response)
        response =
            expenseQuery(text);


    if(!response)
        response =
            balanceQuery(text);


    if(!response)
        response =
            processExpenseMessage(text);


    if(!response){

        response =
            "இந்த கேள்விக்கான செயலை இன்னும் அமைக்கவில்லை. " +

            "கணக்கு, செலவு, வட்டி அல்லது நினைவூட்டல் " +

            "என்று தெளிவாகச் சொல்லுங்கள்.";
    }


    addChatMessage(
        response,
        "ai"
    );


    speak(response);
};


/* =========================================================
   VOICE
========================================================= */

function setupVoice(){

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if(!SpeechRecognition){

        if($("status")){

            $("status").textContent =
                "🎤 Voice ஆதரவு இல்லை";
        }

        return;
    }


    recognition =
        new SpeechRecognition();


    recognition.lang =
        "ta-IN";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.onstart =
        function(){

            if($("status")){

                $("status").textContent =
                    "🎙️ கேட்கிறேன்...";
            }
        };


    recognition.onresult =
        function(event){

            const result =
                event.results?.[0]?.[0]?.transcript ||
                "";


            if($("textInput")){

                $("textInput").value =
                    result.trim();
            }


            if(result.trim()){

                window.sendMessage();
            }
        };


    recognition.onend =
        function(){

            if($("status")){

                $("status").textContent =
                    "🎤 தயார்";
            }
        };


    recognition.onerror =
        function(event){

            if($("status")){

                $("status").textContent =
                    "Voice error: " +
                    event.error;
            }
        };
}


window.startListening =
function(){

    if(!recognition){

        setupVoice();
    }


    try{

        recognition?.start();

    }catch(error){

        console.log(
            "Voice already started"
        );
    }
};


window.stopListening =
function(){

    try{

        recognition?.stop();

    }catch(error){

        console.log(error);
    }
};


/* =========================================================
   REMINDER CHECKER
========================================================= */

function checkReminders(){

    const current =
        Date.now();


    let changed =
        false;


    DB.reminders.forEach(
        reminder => {

            if(reminder.done)
                return;


            const target =
                new Date(
                    reminder.target
                ).getTime();


            const earlyMinutes =
                Number(
                    reminder.early || 0
                );


            const earlyTime =
                target -
                earlyMinutes * 60000;


            /* Early */

            if(
                !reminder.earlyDone &&
                earlyMinutes > 0 &&
                current >= earlyTime &&
                current < target
            ){

                const message =
                    `⏰ ${reminder.text} — இன்னும் ${earlyMinutes} நிமிடம்.`;


                addChatMessage(
                    message,
                    "ai"
                );


                speak(message);


                if(
                    "Notification" in window &&
                    Notification.permission ===
                    "granted"
                ){

                    try{

                        new Notification(
                            "Jacky AI",
                            {
                                body:message
                            }
                        );

                    }catch(error){}
                }


                reminder.earlyDone =
                    true;


                changed =
                    true;
            }


            /* Exact */

            if(current >= target){

                const message =
                    `🔔 இப்போது: ${reminder.text}`;


                addChatMessage(
                    message,
                    "ai"
                );


                speak(message);


                if(
                    "Notification" in window &&
                    Notification.permission ===
                    "granted"
                ){

                    try{

                        new Notification(
                            "Jacky AI",
                            {
                                body:message
                            }
                        );

                    }catch(error){}
                }


                reminder.done =
                    true;


                changed =
                    true;
            }

        }
    );


    if(changed){

        saveDB();
    }
}


/* =========================================================
   RENDER
========================================================= */

function render(){

    /* Salary */

    const salaryBalance =
        DB.salary.reduce(
            (sum,item) =>
                sum +
                (
                    item.type === "in"
                    ? Number(item.amt || 0)
                    : -Number(item.amt || 0)
                ),
            0
        );


    /* Home */

    const homeBalance =
        DB.home.reduce(
            (sum,item) =>
                sum +
                (
                    item.type === "in"
                    ? Number(item.amt || 0)
                    : -Number(item.amt || 0)
                ),
            0
        );


    /* Current month */

    const current =
        new Date();


    const from =
        new Date(
            current.getFullYear(),
            current.getMonth(),
            1
        );


    const to =
        new Date(
            current.getFullYear(),
            current.getMonth() + 1,
            1
        );


    const monthlyExpense =
        DB.expense
            .filter(
                item =>
                    new Date(item.date) >= from &&
                    new Date(item.date) < to
            )
            .reduce(
                (sum,item) =>
                    sum +
                    Number(item.amt || 0),
                0
            );


    /* Summary */

    if($("salaryBalance")){

        $("salaryBalance").textContent =
            money(salaryBalance);
    }


    if($("homeBalance")){

        $("homeBalance").textContent =
            money(homeBalance);
    }


    if($("summarySalary")){

        $("summarySalary").textContent =
            "₹" +
            money(salaryBalance);
    }


    if($("summaryHome")){

        $("summaryHome").textContent =
            "₹" +
            money(homeBalance);
    }


    if($("summaryExpense")){

        $("summaryExpense").textContent =
            "₹" +
            money(monthlyExpense);
    }


    if($("summaryRem")){

        $("summaryRem").textContent =
            DB.reminders.filter(
                item => !item.done
            ).length;
    }


    /* Salary list */

    if($("salaryList")){

        $("salaryList").innerHTML =

            DB.salary
                .slice()
                .reverse()
                .map(item =>

                    recordHTML(

                        "salary",

                        item,

                        (
                            item.type === "in"
                            ? "+ ₹"
                            : "− ₹"
                        ) +
                        money(item.amt),

                        (
                            item.note +
                            " • " +
                            dateTime(item.date)
                        )

                    )

                )
                .join("") ||

            '<div class="empty">பதிவு இல்லை</div>';
    }


    /* Home list */

    if($("homeList")){

        $("homeList").innerHTML =

            DB.home
                .slice()
                .reverse()
                .map(item =>

                    recordHTML(

                        "home",

                        item,

                        (
                            item.type === "in"
                            ? "+ ₹"
                            : "− ₹"
                        ) +
                        money(item.amt),

                        (
                            item.note +
                            " • " +
                            dateTime(item.date)
                        )

                    )

                )
                .join("") ||

            '<div class="empty">பதிவு இல்லை</div>';
    }


    /* Expense */

    if($("expenseList")){

        $("expenseList").innerHTML =

            DB.expense
                .slice()
                .reverse()
                .map(item => {

                    const source =
                        item.source === "home"
                        ? "வீடு"
                        : item.source === "salary"
                        ? "சம்பளம்"
                        : "கொல்லை";


                    return recordHTML(

                        "expense",

                        item,

                        `₹${money(item.amt)} • ${item.note}`,

                        (
                            `${item.person || "பொது"} • ` +
                            `${source} • ` +
                            `${dateTime(item.date)}`
                        )

                    );

                })
                .join("") ||

            '<div class="empty">பதிவு இல்லை</div>';
    }


    /* Farm */

    if($("farmList")){

        $("farmList").innerHTML =

            DB.farm
                .slice()
                .reverse()
                .map(item =>

                    recordHTML(

                        "farm",

                        item,

                        `₹${money(item.amt)}`,

                        `${item.note} • ${dateTime(item.date)}`

                    )

                )
                .join("") ||

            '<div class="empty">பதிவு இல்லை</div>';
    }


    /* Loans */

    if($("loanList")){

        $("loanList").innerHTML =

            DB.loans
                .slice()
                .reverse()
                .map(loan => {

                    const c =
                        calculateLoan(loan);


                    return `

                        <div class="record">

                            <div>

                                <b>

                                    ${escapeHTML(loan.name)}

                                    — Account #

                                    ${loan.accountNo || 1}

                                </b>

                                <small>

                                    அசல் ₹${money(loan.amt)}

                                    • ${loan.rate}% / மாதம்

                                    • மாத வட்டி ₹${money(c.monthlyInterest)}

                                    • ${loan.startDate}

                                </small>

                                <small>

                                    மீதமுள்ள வட்டி:

                                    ₹${money(c.balanceInterest)}

                                </small>

                            </div>

                            ${deleteButton(
                                "loans",
                                loan.id
                            )}

                        </div>

                    `;

                })
                .join("") ||

            '<div class="empty">வட்டி பதிவு இல்லை</div>';
    }


    /* Temporary */

    if($("tempList")){

        $("tempList").innerHTML =

            DB.temp
                .slice()
                .reverse()
                .map(item =>

                    recordHTML(

                        "temp",

                        item,

                        item.text,

                        dateTime(item.date)

                    )

                )
                .join("") ||

            '<div class="empty">குறிப்பு இல்லை</div>';
    }


    /* Permanent */

    if($("permList")){

        $("permList").innerHTML =

            DB.perm
                .slice()
                .reverse()
                .map(item =>

                    recordHTML(

                        "perm",

                        item,

                        item.text,

                        dateTime(item.date)

                    )

                )
                .join("") ||

            '<div class="empty">குறிப்பு இல்லை</div>';
    }


    /* Reminders */

    if($("reminderList")){

        $("reminderList").innerHTML =

            DB.reminders
                .slice()
                .reverse()
                .map(item =>

                    recordHTML(

                        "reminders",

                        item,

                        "⏰ " + item.text,

                        (
                            dateTime(item.target) +
                            " • " +
                            Number(item.early || 0) +
                            " நிமிடம் முன்"
                        )

                    )

                )
                .join("") ||

            '<div class="empty">நினைவூட்டல் இல்லை</div>';
    }
}


/* =========================================================
   ENTER KEY
========================================================= */

document.addEventListener(
    "keydown",
    function(event){

        if(
            event.key === "Enter" &&
            event.target?.id === "textInput" &&
            !event.shiftKey
        ){

            event.preventDefault();

            window.sendMessage();
        }
    }
);


/* =========================================================
   START APP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        try{

            setupVoice();

            render();


            /* Tomorrow */

            if($("reminderDate")){

                const tomorrow =
                    new Date();


                tomorrow.setDate(
                    tomorrow.getDate() + 1
                );


                $("reminderDate").value =
                    tomorrow
                        .toISOString()
                        .slice(0,10);
            }


            /* Service worker */

            if(
                "serviceWorker" in navigator
            ){

                navigator.serviceWorker
                    .register(
                        "sw.js?v=5"
                    )
                    .catch(
                        error =>
                            console.log(
                                "Service worker:",
                                error
                            )
                    );
            }


            /* Reminder checker */

            setInterval(
                checkReminders,
                30000
            );


            checkReminders();


            console.log(
                "✅ Jacky Smart PA v5 loaded successfully."
            );

        }catch(error){

            console.error(
                "Jacky startup error:",
                error
            );


            alert(
                "Jacky app தொடங்குவதில் பிழை உள்ளது.\n" +
                "Browser console பார்க்கவும்."
            );
        }

    }
);

})();