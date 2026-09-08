import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { sendMail } from "../utils/mailer";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  lazyConnect: false,
});

export const emailQueue = new Queue("emailQueue", { connection });

export const setupEmailWorker = () => {
  const worker = new Worker(
    "emailQueue",
    async (job: Job) => {
      const { to, subject, text, html, attachments } = job.data;
      
      console.log(`[EmailWorker] Processing job ${job.id}: Sending email to ${to}...`);
      
      // attachments are serialized as JSON, we need to convert Buffer-like objects back to Buffer
      const parsedAttachments = attachments?.map((att: any) => {
        if (att.content && att.content.type === "Buffer") {
          return {
            ...att,
            content: Buffer.from(att.content.data),
          };
        }
        return att;
      });

      await sendMail({
        to,
        subject,
        text,
        html,
        attachments: parsedAttachments,
      });

      console.log(`[EmailWorker] Successfully sent email to ${to}`);
    },
    {
      connection,
      concurrency: 5, // Process up to 5 emails concurrently
    }
  );

  worker.on("completed", (job) => {
    console.log(`[EmailWorker] Job ${job.id} has completed!`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} has failed with ${err.message}`);
  });
  
  return worker;
};
