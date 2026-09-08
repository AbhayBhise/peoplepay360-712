import { emailQueue, setupEmailWorker } from "../src/queues/email.queue";

async function main() {
  console.log("Starting email worker for testing...");
  const worker = setupEmailWorker();

  console.log("Queuing a test email...");
  await emailQueue.add("sendEmail", {
    to: "test@example.com",
    subject: "Test Email from PeoplePay360",
    text: "This is a test email.",
    html: "<p>This is a test email.</p>",
  });

  console.log("Test email queued. Waiting for worker to process...");
  
  // Wait a few seconds
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("Closing worker...");
  await worker.close();
  process.exit(0);
}

main().catch(console.error);
