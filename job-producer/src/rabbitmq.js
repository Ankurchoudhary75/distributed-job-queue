const amqp = require("amqplib");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";

const JOB_QUEUE = "jobs";
const RETRY_QUEUE = "jobs_retry";
const DLQ_QUEUE = "jobs_dlq";

const RETRY_DELAY_MS = 5000;

let channel;

async function connectQueue() {
  const connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();

  // Dead Letter Queue
  await channel.assertQueue(DLQ_QUEUE, { durable: true });

  // Retry Queue
  await channel.assertQueue(RETRY_QUEUE, {
    durable: true,
    arguments: {
      "x-message-ttl": RETRY_DELAY_MS,
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": JOB_QUEUE,
    },
  });

  // Main Job Queue
  await channel.assertQueue(JOB_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": DLQ_QUEUE,
    },
  });

  console.log("Queues ready: jobs, jobs_retry, jobs_dlq");
}

function publishToQueue(queue, message) {
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
}

module.exports = {
  connectQueue,
  publishToQueue,
  JOB_QUEUE,
  RETRY_QUEUE,
  DLQ_QUEUE,
};
