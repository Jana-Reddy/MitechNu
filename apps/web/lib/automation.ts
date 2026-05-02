/**
 * Course Publish Automation Engine
 * Fires whenever an admin publishes a course.
 *
 * Sends a branded email to ALL registered learners at once using BCC.
 * Gmail allows up to 500 recipients per message.
 * For larger lists it automatically splits into batches of 490.
 */

import nodemailer from "nodemailer";
import { logInfo, logError } from "./error-logger";

export interface CoursePublishPayload {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseExcerpt: string;
  priceInr: number;
  level?: string;
  durationHours?: number;
  publishedByEmail: string;
  learnerEmails: string[];
}

const GMAIL_BCC_BATCH_SIZE = 490; // Gmail's safe BCC limit per message

// ─────────────────────────────────────────────────────────────────────────────
// SMTP transporter
// ─────────────────────────────────────────────────────────────────────────────

function buildTransporter() {
  const host = process.env.EMAIL_SMTP_HOST;
  const port = Number(process.env.EMAIL_SMTP_PORT ?? 587);
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Email HTML template
// ─────────────────────────────────────────────────────────────────────────────

function buildEmailHtml(payload: CoursePublishPayload): string {
  const courseUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/courses/${payload.courseSlug}`;
  const priceFormatted = `₹${payload.priceInr.toLocaleString("en-IN")}`;
  const level = payload.level
    ? ` • ${payload.level.charAt(0).toUpperCase() + payload.level.slice(1)}`
    : "";
  const duration = payload.durationHours ? ` • ${payload.durationHours}h` : "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>New Course: ${payload.courseTitle}</title>
<style>
  body { margin:0; padding:0; background:#f5f5ef; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#080808; }
  .outer { padding:40px 16px; }
  .card { max-width:560px; margin:0 auto; border-radius:0; overflow:hidden; }
  .header { background:#080808; padding:24px 32px; }
  .logo { color:#fff; font-family:monospace; font-size:15px; font-weight:700; letter-spacing:-0.5px; }
  .logo-slash { color:#E63946; }
  .body { background:#ffffff; padding:40px 32px 32px; }
  .badge { display:inline-block; background:#E63946; color:#fff; font-size:10px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; padding:5px 12px; margin-bottom:20px; }
  h1 { font-size:28px; font-weight:800; margin:0 0 10px; line-height:1.2; color:#080808; }
  .meta { font-size:12px; color:#9b9b95; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:24px; }
  .excerpt { font-size:15px; color:#4b4b45; line-height:1.7; margin:0 0 32px; }
  .cta { display:inline-block; background:#080808; color:#ffffff !important; padding:15px 32px; text-decoration:none; font-weight:700; font-size:14px; letter-spacing:0.3px; }
  .divider { height:1px; background:#f0f0ea; margin:32px 0; }
  .footer { background:#f5f5ef; padding:20px 32px; font-size:11px; color:#9b9b95; text-align:center; line-height:1.6; }
  .footer a { color:#9b9b95; }
</style>
</head>
<body>
<div class="outer">
  <div class="card">
    <div class="header">
      <div class="logo"><span class="logo-slash">// </span>Mi.Tech.Nu</div>
    </div>
    <div class="body">
      <div class="badge">New Course</div>
      <h1>${payload.courseTitle}</h1>
      <div class="meta">${priceFormatted}${level}${duration}</div>
      <p class="excerpt">${payload.courseExcerpt}</p>
      <a href="${courseUrl}" class="cta">View Course &rarr;</a>
      <div class="divider"></div>
      <p style="font-size:13px;color:#9b9b95;margin:0;">
        You're receiving this because you have an account on Mi.Tech.Nu.<br/>
        <a href="${appUrl}/courses" style="color:#080808;font-weight:700;">Browse all courses</a>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Mi.Tech.Nu &nbsp;&middot;&nbsp;
      <a href="${appUrl}">Visit Platform</a>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Send email blast to ALL learners via BCC (batched for Gmail limits)
// ─────────────────────────────────────────────────────────────────────────────

async function sendLearnerEmails(payload: CoursePublishPayload): Promise<void> {
  const transporter = buildTransporter();
  if (!transporter) {
    logInfo("[Automation] Email skipped — SMTP not configured. Add EMAIL_SMTP_* vars to .env.local", {
      courseId: payload.courseId,
    });
    return;
  }

  if (payload.learnerEmails.length === 0) {
    logInfo("[Automation] No learners to notify", { courseId: payload.courseId });
    return;
  }

  const fromEmail = process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER;
  const html = buildEmailHtml(payload);
  const subject = `🚀 New course just launched: ${payload.courseTitle}`;

  // Split into batches to respect Gmail's BCC limit
  const batches: string[][] = [];
  for (let i = 0; i < payload.learnerEmails.length; i += GMAIL_BCC_BATCH_SIZE) {
    batches.push(payload.learnerEmails.slice(i, i + GMAIL_BCC_BATCH_SIZE));
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (const [batchIndex, batch] of batches.entries()) {
    try {
      // Send one email with all learners in BCC — no one sees others' addresses
      await transporter.sendMail({
        from: `"Mi.Tech.Nu" <${fromEmail}>`,
        to: fromEmail,        // "To" is the sender (standard BCC blast practice)
        bcc: batch.join(", "), // All learners in BCC
        subject,
        html,
      });
      totalSent += batch.length;
      logInfo(`[Automation] Email batch ${batchIndex + 1}/${batches.length} sent`, {
        recipients: batch.length,
        courseId: payload.courseId,
      });
    } catch (err) {
      totalFailed += batch.length;
      logError(err, {
        action: "sendLearnerEmails",
        batch: batchIndex + 1,
        courseId: payload.courseId,
      });
    }
  }

  logInfo("[Automation] ✅ Email blast complete", {
    courseTitle: payload.courseTitle,
    totalLearners: payload.learnerEmails.length,
    sent: totalSent,
    failed: totalFailed,
    batches: batches.length,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main automation trigger
// ─────────────────────────────────────────────────────────────────────────────

export async function onCoursePublished(payload: CoursePublishPayload): Promise<void> {
  logInfo("[Automation] Course published — triggering email blast", {
    courseId: payload.courseId,
    courseTitle: payload.courseTitle,
    learnersToNotify: payload.learnerEmails.length,
  });

  await sendLearnerEmails(payload);
}
