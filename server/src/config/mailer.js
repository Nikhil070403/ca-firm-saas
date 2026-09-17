const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
});

async function sendMail({ to, subject, html }) {
  if (!env.smtp.host || env.smtp.host === 'smtp.example.com') {
    logger.warn(`SMTP not configured — skipping email to ${to}: "${subject}"`);
    return { skipped: true };
  }
  // Email is best-effort everywhere in this app: a mail outage must never
  // fail the business operation that triggered it (registration, invite,
  // reminder). Callers that need delivery status can inspect `sent`.
  try {
    const info = await transporter.sendMail({ from: env.smtp.from, to, subject, html });
    return { sent: true, info };
  } catch (err) {
    logger.error(`Email to ${to} failed ("${subject}"): ${err.message}`);
    return { sent: false, error: err.message };
  }
}

module.exports = { transporter, sendMail };
