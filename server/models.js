const mongoose = require("mongoose");

// 1. Code Snippet Schema - for saving user templates
const CodeSnippetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
    default: "javascript",
  },
  description: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 2. Run History Schema - for tracking code execution history
const RunHistorySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
    default: "javascript",
  },
  output: {
    type: String,
    required: true,
  },
  success: {
    type: Boolean,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const CodeSnippet = mongoose.model("CodeSnippet", CodeSnippetSchema);
const RunHistory = mongoose.model("RunHistory", RunHistorySchema);

module.exports = {
  CodeSnippet,
  RunHistory,
};
