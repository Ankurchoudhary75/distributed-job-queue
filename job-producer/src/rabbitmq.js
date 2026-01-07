const amqp = require("amqplib");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const QUEUE_NAME = "jobs";

let channel; // 🔴 GLOBAL CHANNEL (IMPORTANT)

async function connectQueue() {
  console.log("Connecting to RabbitMQ...");

  const connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log("RabbitMQ connected, queue ready");
}

function publishToQueue(message) {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }

  channel.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
}

module.exports = {
  connectQueue,
  publishToQueue,
};
