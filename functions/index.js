const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const path = require("path");

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// API endpoint
app.post("/api/groq", async (req, res) => {
  const { messages, options } = req.body;

  // Use firebase functions:config to set groq.key
  const groqApiKey = functions.config().groq?.key;

  if (!groqApiKey) {
    functions.logger.warn("Warning: GROQ_API_KEY is not set. API calls to /api/groq will fail.");
    return res.status(500).json({ error: "Internal Server Error: API key not configured." });
  }

  const groq = new Groq({ apiKey: groqApiKey });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      ...options,
    });

    res.json({ response: chatCompletion.choices[0]?.message?.content || "" });
  } catch (error) {
    functions.logger.error("Error calling Groq API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Serve static files from the 'dist' directory
const staticPath = path.resolve(__dirname, "..", "dist");
app.use(express.static(staticPath));

// Catch-all to serve the main index.html for any other requests
app.get("*", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});


// Expose the Express app as a Firebase Function
exports.app = functions.https.onRequest(app);
