require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { runJavaScript } = require("./codeRunner");
const { CodeSnippet, RunHistory } = require("./models");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/codeeditor";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🔥 Successfully connected to MongoDB database!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("👉 Please make sure MongoDB is installed and running locally, or update MONGO_URI in server/.env");
  });

// --- API ROUTES ---

// 1. Run JavaScript Code (Backend Execution)
app.post("/api/run", (req, res) => {
  const { code, input } = req.body;

  if (typeof code !== "string") {
    return res.status(400).json({ error: "Code must be a string." });
  }

  const result = runJavaScript(code, input);
  res.json(result);
});

// 2. Get Run History (Latest 50 Runs)
app.get("/api/history", async (req, res) => {
  try {
    const history = await RunHistory.find().sort({ timestamp: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history: " + err.message });
  }
});

// 3. Save a Run to History
app.post("/api/history", async (req, res) => {
  const { code, language, output, success } = req.body;

  try {
    const newRun = new RunHistory({
      code,
      language: language || "javascript",
      output,
      success: success !== false,
    });
    const savedRun = await newRun.save();
    res.status(201).json(savedRun);
  } catch (err) {
    res.status(500).json({ error: "Failed to save history: " + err.message });
  }
});

// 4. Delete a History Item
app.delete("/api/history/:id", async (req, res) => {
  try {
    await RunHistory.findByIdAndDelete(req.params.id);
    res.json({ message: "History item deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete history: " + err.message });
  }
});

// 5. Get Saved Code Snippets
app.get("/api/snippets", async (req, res) => {
  try {
    const snippets = await CodeSnippet.find().sort({ createdAt: -1 });
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch snippets: " + err.message });
  }
});

// 6. Save/Create a Code Snippet
app.post("/api/snippets", async (req, res) => {
  const { title, code, language, description } = req.body;

  if (!title || !code) {
    return res.status(400).json({ error: "Title and code are required." });
  }

  try {
    const newSnippet = new CodeSnippet({
      title,
      code,
      language: language || "javascript",
      description: description || "",
    });
    const savedSnippet = await newSnippet.save();
    res.status(201).json(savedSnippet);
  } catch (err) {
    res.status(500).json({ error: "Failed to save snippet: " + err.message });
  }
});

// 7. Delete a Code Snippet
app.delete("/api/snippets/:id", async (req, res) => {
  try {
    await CodeSnippet.findByIdAndDelete(req.params.id);
    res.json({ message: "Snippet deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete snippet: " + err.message });
  }
});

// Root check endpoint
app.get("/", (req, res) => {
  res.json({ status: "online", service: "Code Editor Backend" });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 Code Editor Backend running at http://localhost:${PORT}`);
});
