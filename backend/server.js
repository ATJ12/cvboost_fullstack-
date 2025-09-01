const express = require("express");
const cors = require("cors");

const app = express(); // <-- app is defined here
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Analyze resume route (must come AFTER app is defined)
app.post("/api/analyze", (req, res) => {
  const { resume } = req.body;

  if (!resume) {
    return res.status(400).json({ error: "Resume is empty" });
  }

  const advice = [];

  if (resume.length < 200) {
    advice.push("Your resume is too short. Consider adding more details.");
  } else {
    advice.push("Your resume looks good. Consider highlighting achievements.");
  }

  if (!resume.toLowerCase().includes("experience")) {
    advice.push("Include a section about your professional experience.");
  }

  res.json({ advice });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
