// app.js

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const dialogflow = require("@google-cloud/dialogflow");

// Load environment variables from .env file
dotenv.config({ path: "./config/config.env" });

const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files from the 'public' and 'views' directories
app.use(express.static(path.join(__dirname, "public")));
//app.use(express.static(path.join(__dirname, "views")));

// Create an HTTP server and pass it to Socket.IO
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*", // Allow all origins for testing (restrict in production)
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Handle socket connection
io.on("connection", (socket) => {
    console.log("A user connected");

    // Generate a sessionId for the user to maintain context with Dialogflow
    const sessionId = uuidv4();

    // Listen for 'chat message' event from the client
    socket.on("chat message", (message) => {
        console.log("Received message from client:", message);

        // Call Dialogflow to handle the bot response
        const callapibot = async (projectId = process.env.PROJECT_ID) => {
            try {
                const sessionClient = new dialogflow.SessionsClient({
                    keyFilename: "./dialogflow-key.json", // Ensure this path is correct
                });
                const sessionPath = sessionClient.projectAgentSessionPath(
                    projectId,
                    sessionId
                );
                const request = {
                    session: sessionPath,
                    queryInput: {
                        text: {
                            text: message,
                            languageCode: "en-US",
                        },
                    },
                };
                const responses = await sessionClient.detectIntent(request);
                const result = responses[0].queryResult;
                const fulfillmentText = result.fulfillmentText;
                console.log("Bot reply from Dialogflow:", fulfillmentText);

                // Emit bot reply to the client
                socket.emit("bot reply", fulfillmentText);

                if (result.intent) {
                    console.log(`Intent: ${result.intent.displayName}`);
                } else {
                    console.log("No intent matched.");
                }
            } catch (error) {
                console.error("Error calling Dialogflow:", error);
                // Emit an error message back to the client
                socket.emit(
                    "bot reply",
                    "Sorry, I am having trouble understanding you."
                );
            }
        };

        callapibot();
    });

    // Handle socket disconnect
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
