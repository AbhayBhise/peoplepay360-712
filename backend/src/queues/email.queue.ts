import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { sendMail } from "../utils/mailer";
import { env } from "../config/env";

type EmailJob = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
};

const connection = env.emailQueueEnabled && env.redisUrl
  ? new IORedis(env.redisUrl, { maxRetriesPerRequest: null, lazyConnect: false })
  : null;

const queue = connection ? new Queue("emailQueue", { connection }) : null;

// A Redis-free fallback keeps password reset, emergency alerts, and payslip
// delivery functional on free web services. It is intentionally best-effort;
// configure REDIS_URL for durable jobs and retries.
export const emailQueue = {
  async add(_name: string, data: EmailJob) {
    if (queue) return queue.add(_name, data);
    return sendMail({ ...data, text: data.text ?? "" });
  },
};

export const setupEmailWorker = () => {
  if (!connection || !queue) {
    return { close: async () => undefined };
  }

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
        text: text ?? "",
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
