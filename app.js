// ===============================
// Jacky AI - app.js
// ===============================

"use strict";

// Local Jacky AI backend
const API_URL = "http://localhost:8000";

let recognition = null;
let listening = false;

// ===============================
// PAGE NAVIGATION
// ===============================

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const page = document.getElementById(pageName);

    if (page) {
        page.classList.add("active");
    }
}

// ===============================
// CHAT
// ===============================

function addChatMessage(text, type) {
    const chatBox = document.getElementById("chatBox");

    if (!chatBox) return;

    const message = document.createElement("div");
    message.className = "message " + type;
    message.textContent = text;

    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById("textInput");
    const status = document.getElementById("status");

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    addChatMessage(text, "user");
    input.value = "";

    if (status) {
        status.textContent = "ஜாக்கி யோசிக்கிறது...";
    }

    try {
        const response = await fetch(API_URL + "/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: text
            })
        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        const data = await response.json();

        const reply =
            data.reply ||
            data.message ||
            data.response ||
            "ஜாக்கியிடம் இருந்து பதில் கிடைக்கவில்லை.";

        addChatMessage(reply, "ai");
        speakText(reply);

        if (status) {
            status.textContent = "தயார்";
        }

    } catch (error) {

        console.log("Jacky AI:", error);

        const reply =
            "ஜாக்கி AI server தற்போது இணைக்கப்படவில்லை. " +
            "Termux-ல் backend இயக்கப்பட்டுள்ளதா என்று பார்க்கவும்.";

        addChatMessage(reply, "ai");

        if (status) {
            status.textContent = "Server இணைக்கப்படவில்லை";
        }
    }
}

// ===============================
// TEXT TO SPEECH - TAMIL
// ===============================

function speakText(text) {
    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "ta-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
}

// ===============================
// VOICE RECOGNITION
// ===============================

function setupRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.log("Speech recognition not supported");
        return;
    }

    recognition = new SpeechRecognition();

    recognition.lang = "ta-IN";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = function () {
        listening = true;

        const status = document.getElementById("status");

        if (status) {
            status.textContent = "🎙️ கேட்கிறேன்...";
        }
    };

    recognition.onresult = function (event) {

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            if (!event.results[i].isFinal) {
                continue;
            }

            const text =
                event.results[i][0].transcript.trim();

            const input =
                document.getElementById("textInput");

            if (input) {
                input.value = text;
            }

            if (text) {
                sendMessage();
            }
        }
    };

    recognition.onerror = function (event) {

        console.log(
            "Speech recognition error:",
            event.error
        );

        listening = false;

        const status =
            document.getElementById("status");

        if (status) {
            status.textContent =
                "🎙️ Voice error: " + event.error;
        }
    };

    recognition.onend = function () {

        listening = false;

        const status =
            document.getElementById("status");

        if (status) {
            status.textContent = "தயார்";
        }
    };
}

// ===============================
//
