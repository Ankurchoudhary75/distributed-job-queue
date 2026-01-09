console.log("worker index.js loaded");

const amqp = require("amqplib");
require("dotenv").config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const QUEUE_NAME = "jobs";

async function startWorker() {
  console.log("Starting worker...");

  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log("Worker connected. Waiting for jobs...");

  channel.consume(
    QUEUE_NAME,
    (msg) => {
      if (!msg) return;

      const job = JSON.parse(msg.content.toString());
      console.log("Job received by worker:", job);

      setTimeout(() => {
        console.log(`Job ${job.id} processed`);
        channel.ack(msg);
      }, 1000);
    },
    { noAck: false }
  );
}

startWorker()
  .then(() => console.log("startWorker() running"))
  .catch((err) => {
    console.error("Worker failed to start", err);
    process.exit(1);
  });
