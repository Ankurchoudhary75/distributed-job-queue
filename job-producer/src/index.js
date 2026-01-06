const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({ status: "Job Producer is running" });
});

app.post("/jobs", (req, res) => {
  res.json({
    message: "Job received (queue integration next)",
  });
});

app.listen(PORT, () => {
  console.log(`Job Producer running on port ${PORT}`);
});
