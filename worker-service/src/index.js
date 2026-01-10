const amqp = require("amqplib");
require("dotenv").config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const JOB_QUEUE = "jobs";
const RETRY_QUEUE = "jobs_retry";
const DLQ_QUEUE = "jobs_dlq";
const MAX_RETRIES = 3;

async function startWorker() {
  console.log("Starting worker with retry support...");

  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  channel.consume(JOB_QUEUE, async (msg) => {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString());
    job.retryCount = job.retryCount || 0;

    try {
      console.log("Processing job:", job.id);

      if (job.retryCount < 2) {
        throw new Error("Simulated failure");
      }

      console.log(`Job ${job.id} processed successfully`);
      channel.ack(msg);

    } catch (err) {
      job.retryCount += 1;

      if (job.retryCount <= MAX_RETRIES) {
        console.log(`Retrying job ${job.id}`);
        channel.sendToQueue(RETRY_QUEUE, Buffer.from(JSON.stringify(job)), {
          persistent: true,
        });
      } else {
        console.log(`Job ${job.id} moved to DLQ`);
        channel.sendToQueue(DLQ_QUEUE, Buffer.from(JSON.stringify(job)), {
          persistent: true,
        });
      }

      channel.ack(msg);
    }
  });
}

startWorker().catch(console.error);
