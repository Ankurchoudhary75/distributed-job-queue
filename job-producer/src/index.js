const express = require("express");
require("dotenv").config();

//console.log("index.js loaded");

const { connectQueue, publishToQueue, JOB_QUEUE, } = require("./rabbitmq");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

//console.log("Trying to connect to RabbitMQ...");

connectQueue()
  .then(() => {
    console.log("connectQueue() resolved");
  })
  .catch((err) => {
    console.error("RabbitMQ connection failed", err);
    process.exit(1);
  });

app.get("/health", (req, res) => {
  res.json({ status: "Job Producer is running" });
});

app.post("/jobs", (req, res) => {
  const { type, payload } = req.body;

  if (!type || !payload) {
    return res.status(400).json({ error: "Invalid job payload" });
  }

  const job = {
    id: uuidv4(),
    type,
    payload,
    createdAt: new Date().toISOString(),
  };

publishToQueue(JOB_QUEUE, job);


  res.status(202).json({
    message: "Job queued successfully",
    jobId: job.id,
  });
});

app.listen(PORT, () => {
  console.log(`Job Producer running on port ${PORT}`);
});
