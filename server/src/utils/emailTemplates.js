const env = require('../config/env');

function wrapper(bodyHtml) {
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0f172a;">
    <h2 style="margin:0 0 16px;color:#2563eb;">CA Firm SaaS</h2>
    ${bodyHtml}
    <p style="margin-top:32px;font-size:12px;color:#64748b;">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
}

function verificationEmail(name, token) {
  const link = `${env.clientUrl}/verify-email?token=${token}`;
  return {
    subject: 'Verify your email',
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>Please verify your email address to activate your account.</p>
      <p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Verify Email</a></p>
    `),
  };
}

function passwordResetEmail(name, token) {
  const link = `${env.clientUrl}/reset-password?token=${token}`;
  return {
    subject: 'Reset your password',
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. This link expires in 1 hour.</p>
      <p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Reset Password</a></p>
    `),
  };
}

function welcomeEmail(name, firmName) {
  return {
    subject: `Welcome to ${firmName}`,
    html: wrapper(`<p>Hi ${name},</p><p>Your account for <strong>${firmName}</strong> is ready to use.</p>`),
  };
}

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const dateStr = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function complianceReminderEmail(clientName, returnLabel, periodLabel, dueDate) {
  return {
    subject: `Reminder: ${returnLabel} for ${periodLabel} is due ${dateStr(dueDate)}`,
    html: wrapper(`
      <p>Dear ${clientName},</p>
      <p>This is a reminder that your <strong>${returnLabel}</strong> for <strong>${periodLabel}</strong>
      is due on <strong>${dateStr(dueDate)}</strong>.</p>
      <p>Please share the required data/documents with us at the earliest so we can file on time.</p>
      <p>You will keep receiving this reminder until the return is filed.</p>
    `),
  };
}

function complianceFiledEmail(clientName, returnLabel, periodLabel, filedAt) {
  return {
    subject: `${returnLabel} for ${periodLabel} has been filed`,
    html: wrapper(`
      <p>Dear ${clientName},</p>
      <p>Good news — your <strong>${returnLabel}</strong> for <strong>${periodLabel}</strong>
      was filed on <strong>${dateStr(filedAt)}</strong>.</p>
      <p>No further action is needed for this period.</p>
    `),
  };
}

function taxPayableEmail(clientName, returnLabel, periodLabel, amount) {
  return {
    subject: `Tax payable for ${returnLabel} (${periodLabel}): ${inr(amount)}`,
    html: wrapper(`
      <p>Dear ${clientName},</p>
      <p>The tax computed for your <strong>${returnLabel}</strong> — <strong>${periodLabel}</strong> is:</p>
      <p style="font-size:22px;font-weight:700;margin:12px 0;">${inr(amount)}</p>
      <p>Kindly arrange the payment before the due date to avoid interest and late fees.</p>
    `),
  };
}

function invoiceFollowUpEmail(clientName, invoiceNumber, amountDue, issueDate) {
  return {
    subject: `Payment reminder — Invoice ${invoiceNumber}`,
    html: wrapper(`
      <p>Dear ${clientName},</p>
      <p>A gentle reminder that invoice <strong>${invoiceNumber}</strong> issued on
      <strong>${dateStr(issueDate)}</strong> has an outstanding amount of
      <strong>${inr(amountDue)}</strong>.</p>
      <p>Kindly arrange the payment at your earliest convenience. If it is already on its way, please ignore this email.</p>
    `),
  };
}

module.exports = {
  verificationEmail,
  passwordResetEmail,
  welcomeEmail,
  complianceReminderEmail,
  complianceFiledEmail,
  taxPayableEmail,
  invoiceFollowUpEmail,
};
