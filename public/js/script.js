// public/js/script.js

const btn = document.querySelector("button");
const outputme = document.querySelector(".output-you");
const outputbot = document.querySelector(".output-bot");

// Connect to the server using Socket.IO
const socket = io();

// Initialize SpeechRecognition
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;
recognition.recognizing = false;

// Start speech recognition when the button is clicked
btn.addEventListener("click", () => {
    if (!recognition.recognizing) {
        recognition.start();
        recognition.recognizing = true;
    }
});

// Handle the result from speech recognition
recognition.onresult = function (event) {
    const last = event.results.length - 1;
    const text = event.results[last][0].transcript;
    console.log("User said:", text);

    // Display user input on the screen
    outputme.textContent = text;

    // Emit the user's message to the server
    socket.emit("chat message", text);
    console.log("Sent message to server:", text);
};

// Listen for the bot reply (moved outside recognition.onresult)
socket.on("bot reply", (reply) => {
    console.log("Received bot reply from server:", reply);
    outputbot.textContent = reply; // Display bot reply on the screen
    botReply(reply); // Use speech synthesis to speak the bot's reply
});

// Function to make the bot speak
const botReply = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = text;
    utterance.pitch = 1;
    utterance.volume = 1;
    synth.speak(utterance);
};

// Reset recognizing state when recognition ends
recognition.onend = function () {
    recognition.recognizing = false;
};

// Error handler for speech recognition
recognition.onerror = function (event) {
    console.error("Speech recognition error:", event.error);
    if (event.error === 'no-speech') {
        alert('No speech was detected. Please try again.');
    }
};

// Socket.IO connection event handlers for debugging
socket.on("connect", () => {
    console.log("Connected to server via Socket.IO");
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});
