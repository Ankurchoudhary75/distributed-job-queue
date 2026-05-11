A production-grade distributed background job processing system built with Node.js and RabbitMQ.
This project demonstrates real-world backend engineering concepts such as asynchronous processing, retries, dead-letter queues, idempotent workers, horizontal scaling, and graceful shutdown.

🚀 Why This Project Matters

Most applications cannot process heavy tasks synchronously. This system solves that by:

Decoupling API requests from long-running jobs

Ensuring reliability with retries and dead-letter queues

Preventing duplicate job execution (idempotency)

Supporting multiple workers (horizontal scaling)

This architecture is commonly used in payment systems, email services, video processing, and notification pipelines.

🧱 System Architecture

Client

  │
  
  ▼

Job Producer (API)

  │
  
  ▼

RabbitMQ (Message Broker)

  ├── jobs        (main queue)
  
  ├── jobs_retry  (delayed retries)
  
  └── jobs_dlq    (dead letter queue)
  
  │
  
  ▼

Worker Service(s)

✨ Key Features

1. Job Producer API

REST API built with Express

Accepts background job requests

Publishes jobs to RabbitMQ

Owns queue topology (best practice)

2. RabbitMQ Queues

jobs – main processing queue (durable)

jobs_retry – TTL-based retry queue

jobs_dlq – permanently failed jobs

3. Worker Service

Consumes jobs asynchronously

Manual acknowledgements (ack)

Retry mechanism with retry count

Dead Letter Queue routing

4. Reliability & Safety

Idempotent job processing (prevents duplicates)

Manual ACK ensures no job loss

Graceful shutdown on process termination

5. Scalability

Multiple workers can run in parallel

Fair dispatch using prefetch(1)

Horizontal scaling without code changes

🛠 Tech Stack

Node.js (Job Producer & Worker)

RabbitMQ (Message Broker)

Docker & Docker Compose (Infrastructure)

Express.js (REST API)


📂 Project Structure

distributed-job-queue/

├── docker-compose.yml

├── job-producer/

│   ├── src/

│   │   ├── index.js        # API entry point

│   │   └── rabbitmq.js     # Queue setup & publishing

│   └── .env

├── worker-service/

│   ├── src/

│   │   └── index.js        # Worker with retry & DLQ logic

│   └── .env

└── README.md


⚙️ Setup & Run

1. Start RabbitMQ
2. 
docker compose up -d

RabbitMQ dashboard:

http://localhost:15672

username: guest

password: guest

2. Start Job Producer

cd job-producer

npm install

node src/index.js

3. Start Worker Service
   
cd worker-service

npm install

node src/index.js


(Optional) Start multiple workers for scaling:

node src/index.js

4. Submit a Job

curl -X POST http://localhost:3000/jobs \
-H "Content-Type: application/json" \
-d '{"type":"EMAIL","payload":{"to":"user@test.com"}}'

🔁 Retry & Dead Letter Logic

Failed jobs are retried automatically

Retry delay is handled using TTL-based retry queue

Jobs exceeding retry limit are moved to jobs_dlq

DLQ helps inspect and debug failed jobs safely

🧠 Engineering Concepts Demonstrated

Asynchronous message-driven architecture

At-least-once delivery handling

Idempotent consumers

Queue immutability and topology ownership

Graceful shutdown and fault tolerance



👨‍💻 Author

Ankur Choudhary
GitHub: https://github.com/Ankurchoudhary75

⭐ If you found this project useful, feel free to star the repository!
