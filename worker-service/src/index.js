const amqp = require("amqplib");
require("dotenv").config();

// 🔐 Idempotency store (demo purpose)
const processedJobs = new Set();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";

const JOB_QUEUE = "jobs";
const RETRY_QUEUE = "jobs_retry";
const DLQ_QUEUE = "jobs_dlq";

const MAX_RETRIES = 3;

let connection;
let channel;

async function startWorker() {
  console.log("[WORKER] Starting worker with retry support...");

  connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();

  // ⚖️ Fair dispatch — one job at a time per worker
  channel.prefetch(1);

  console.log("[WORKER] Connected to RabbitMQ. Waiting for jobs...");

  channel.consume(
    JOB_QUEUE,
    async (msg) => {
      if (!msg) return;

      const job = JSON.parse(msg.content.toString());
      job.retryCount = job.retryCount || 0;

      // 🔁 Idempotency check
      if (processedJobs.has(job.id)) {
        console.log(`[WORKER] Duplicate job ${job.id} ignored`);
        channel.ack(msg);
        return;
      }

      try {
        console.log(`[WORKER] Processing job ${job.id}`);

        // ❌ Simulated failure (for demo)
        if (job.retryCount < 2) {
          throw new Error("Simulated failure");
        }

        // ✅ Job processed successfully
        console.log(`[WORKER] Job ${job.id} processed successfully`);
        processedJobs.add(job.id);
        channel.ack(msg);

      } catch (err) {
        job.retryCount += 1;

        if (job.retryCount <= MAX_RETRIES) {
          console.log(
            `[WORKER] Retrying job ${job.id} (attempt ${job.retryCount})`
          );

          channel.sendToQueue(
            RETRY_QUEUE,
            Buffer.from(JSON.stringify(job)),
            { persistent: true }
          );
        } else {
          console.log(`[WORKER] Job ${job.id} moved to DLQ`);

          channel.sendToQueue(
            DLQ_QUEUE,
            Buffer.from(JSON.stringify(job)),
            { persistent: true }
          );
        }

        // ACK original message (important)
        channel.ack(msg);
      }
    },
    { noAck: false }
  );
}

/**
 * 🧹 Graceful shutdown
 */
process.on("SIGINT", async () => {
  console.log("\n[WORKER] Gracefully shutting down...");
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (err) {
    console.error("[WORKER] Error during shutdown", err);
  } finally {
    process.exit(0);
  }
});

startWorker().catch((err) => {
  console.error("[WORKER] Failed to start", err);
  process.exit(1);
});
