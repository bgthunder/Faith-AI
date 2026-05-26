const express = require("express");
const cors = require("cors");
const axios = require("axios");

const detectMood = require("./moodDetector");
const { recordMoodEvent, getAnalyticsSummary } = require("./emotionalAnalytics");

const {
    saveMemory,
    getMemory,
    saveDailyCheckIn,
    getDailyCheckIn
} = require("./memoryStore");

const {
    addPost,
    getPosts
} = require("./communityPosts");
const { getWellnessActivity } = require("./wellnessActivities");

const app = express();

app.use(cors());
app.use(express.json());

/*
=====================================
CHAT ROUTE
=====================================
*/

// Temporary test endpoint to check mood detection (POST JSON)
app.post('/_test_mood', (req, res) => {
    const msg = req.body && req.body.message;
    const detected = detectMood(msg);
    res.json({ received: msg, mood: detected });
});

// Temporary GET endpoint to test mood detection without JSON body
app.get('/_test_mood_get', (req, res) => {
    const msg = req.query.msg;
    const detected = detectMood(msg);
    res.json({ received: msg, mood: detected });
});

app.post("/chat", async (req, res) => {

    const userMessage = String(req.body.message || "");
    const dailyMood = req.body.dailyMood || req.body.mood || null;

    const userId = "demo-user";

    console.log('CHAT RECEIVED BODY:', JSON.stringify(req.body));
    console.log('EXTRACTED USER MESSAGE:', userMessage);

    try {
        // prefer an explicitly provided mood, otherwise detect from message
        let mood = dailyMood || detectMood(userMessage);

        // Extra safety: simple substring check for high-priority crisis phrases
        try {
            const raw = String(userMessage || "").toLowerCase();
            const crisisKeywords = [
                "suicide",
                "kill myself",
                "hurt myself",
                "self-harm",
                "end my life",
                "want to die",
                "i want to die",
                "i'm going to end",
                "no reason to live",
                "i don't want to live",
                "kill me"
            ];
            if (!mood || mood !== "crisis") {
                for (const kw of crisisKeywords) {
                    if (raw.includes(kw)) {
                        mood = "crisis";
                        break;
                    }
                }
            }
        } catch (e) {
            // ignore parsing errors
        }

        console.log('DETECTED MOOD:', mood);

        // Record mood event for analytics
        recordMoodEvent(mood, "chat");

        // Only return wellness activity for moods that benefit from it, not every reply
        const shouldShowWellness = ["stressed", "sad", "tired", "lonely"].includes(mood);
        const wellnessActivity = shouldShowWellness ? getWellnessActivity(mood) : null;

        // Handle simple greetings without emotional context
        const greetingKeywords = ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening", "howdy"];
        const isGreeting = greetingKeywords.some(kw => userMessage.toLowerCase().includes(kw)) && userMessage.toLowerCase().trim().split(/\s+/).length <= 3;

        if (isGreeting && mood === "neutral") {
            const greetingReplies = [
                "Hello! I'm Faith, your AI emotional companion. How are you feeling today?",
                "Hi there! 👋 It's great to connect with you. What's on your mind?",
                "Hey! I'm here to listen and support you. How can I help you today?",
                "Greetings! I'm Faith. Tell me, how are you doing right now?",
                "Hello! I'm so glad you're here. What would you like to talk about?"
            ];
            const randomReply = greetingReplies[Math.floor(Math.random() * greetingReplies.length)];
            saveMemory(userId, userMessage);
            return res.json({
                mood: "neutral",
                reply: randomReply,
                wellnessActivity: null
            });
        }

        // short-circuit for crisis / emergency messages
        if (mood === "crisis") {
            const safeReply = "I'm really sorry you're feeling this way — I'm here with you. If you are in immediate danger, please call your local emergency services right now. If you're in the United States, you can call or text 988 to reach the Suicide & Crisis Lifeline. If you're elsewhere, please contact your local emergency number or a crisis hotline. Would you like to tell me more about what's happening, or should I help find local resources or a trusted person to contact?";

            saveMemory(userId, userMessage);

            return res.json({
                mood,
                emergency: true,
                reply: safeReply
            });
        }

        // Build previous chats from memory (simple join)
        const previousChats = getMemory(userId).join("\n");

        // Call AI backend (may fail if AI server is not running)
        const response = await axios.post(
            "http://localhost:11434/api/generate",
            {
                model: "vortex/helpingai-9b",
                prompt: `
You are Faith, a realistic AI emotional companion.

User emotional state: ${mood}

If appropriate, briefly encourage one practical wellness activity that matches the user's emotional state.

Previous conversation:
${previousChats}

User: ${userMessage}

Faith:
                `,
                stream: false,
                options: {
                    temperature: 0.85,
                    num_predict: 180,
                    top_p: 0.92
                }
            }
        );

        let reply = (response.data && response.data.response) ? response.data.response.trim() : null;

        if (!reply) {
            // fallback reply if AI failed to generate text
            reply = "Thanks for sharing. I'm here to listen — tell me more about how you're feeling.";
        }

        // Clean formatting
        reply = reply.replace(/\n+/g, " ").replace(/\s+/g, " ");

        // save user message to memory
        saveMemory(userId, userMessage);

        res.json({
            mood,
            reply,
            wellnessActivity
        });

    } catch (error) {
        console.log("CHAT ERROR:", error.message || error);

        // On error, return a safe generic reply (do not expose internal error details)
        return res.status(200).json({
            mood: "unknown",
            reply: "Thanks for telling me — I'm here with you. Could you tell me a bit more about what's going on?",
            emergency: false,
            wellnessActivity: getWellnessActivity("neutral")
        });
    }
});

/*
=====================================
COMMUNITY ROUTES
=====================================
*/

// Add community post
app.post("/community", (req, res) => {

    const text = req.body.text;

    if (!text) {
        return res.status(400).json({
            error: "Post cannot be empty"
        });
    }

    const post = addPost(text);

    res.json(post);
});

// Get all community posts
app.get("/community", (req, res) => {

    const posts = getPosts();

    res.json(posts);
});

// Add daily check-in
app.post("/daily-checkin", (req, res) => {
    const { mood } = req.body;
    const userId = "demo-user";

    if (!mood) {
        return res.status(400).json({ error: "Mood is required" });
    }

    saveDailyCheckIn(userId, mood);
    recordMoodEvent(mood, "daily-checkin");

    res.json({ success: true, mood, userId });
});

// Get daily check-in
app.get("/daily-checkin", (req, res) => {
    const userId = "demo-user";
    const todayMood = getDailyCheckIn(userId);
    res.json({ mood: todayMood });
});

/*
=====================================
ANALYTICS ROUTE
=====================================
*/

// Get emotional analytics summary
app.get("/analytics", (req, res) => {
    const summary = getAnalyticsSummary();
    res.json(summary);
});

/*
=====================================
HOME ROUTE
=====================================
*/

app.get("/", (req, res) => {
    res.send("Faith AI Backend Running");
});

/*
=====================================
START SERVER
=====================================
*/

app.listen(5000, () => {
    console.log("Server running on port 5000");
});