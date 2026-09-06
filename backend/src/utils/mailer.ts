import nodemailer from "nodemailer";

// Falls back to nodemailer's built-in jsonTransport (no network calls, just returns the
// composed message) when no SMTP_HOST is configured — so "bulk email delivery" is fully
// wired and demoable without requiring real SMTP credentials during dev/hackathon judging.
// Set SMTP_HOST/PORT/USER/PASS in .env to send real email through any provider.
function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return nodemailer.createTransport({ jsonTransport: true });
}

const transporter = createTransport();

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
}) {
  const from = process.env.SMTP_FROM ?? "payroll@peoplepay360.local";
  const info = await transporter.sendMail({ from, ...options });

  if (!process.env.SMTP_HOST) {
    console.log(`[mailer:jsonTransport] would send to ${options.to}: "${options.subject}"\n${options.text}`);
  }
  return info;
}
