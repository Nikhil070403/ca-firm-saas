const Invoice = require('../features/billing/models/Invoice.model');
const Notification = require('../features/reminders/models/Notification.model');
const { sendMail } = require('../config/mailer');
const { invoiceFollowUpEmail } = require('../utils/emailTemplates');
const { isAutomationEnabled } = require('../utils/firmAutomation');
const logger = require('../utils/logger');

/**
 * Daily: 10 days after an invoice was issued, if it still isn't fully paid
 * (or cancelled), send the client one payment follow-up. `followUpSentAt`
 * guarantees a single nag per invoice.
 */
module.exports = {
  async run() {
    const cutoff = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const invoices = await Invoice.find({
      isDeleted: false,
      status: { $in: ['sent', 'partially_paid', 'overdue'] },
      issueDate: { $lte: cutoff },
      followUpSentAt: null,
    }).populate('clientId', 'displayName email phone');

    let sent = 0;
    for (const invoice of invoices) {
      const client = invoice.clientId;
      if (!client) continue;
      const due = invoice.grandTotal - invoice.amountPaid;
      if (due <= 0) continue;
      // eslint-disable-next-line no-await-in-loop
      if (!(await isAutomationEnabled(invoice.firmId, 'invoiceFollowUps'))) continue;

      const email = invoiceFollowUpEmail(client.displayName, invoice.invoiceNumber, due, invoice.issueDate);
      let emailStatus = 'failed';
      if (client.email) {
        const result = await sendMail({ to: client.email, subject: email.subject, html: email.html });
        emailStatus = result.sent || result.skipped ? 'sent' : 'failed';
      }

      await Notification.create([
        {
          firmId: invoice.firmId, clientId: client._id, channel: 'email',
          type: 'invoice_followup',
          title: `Payment reminder — ${invoice.invoiceNumber}`,
          message: `₹${due.toLocaleString('en-IN')} outstanding on ${invoice.invoiceNumber} (issued ${invoice.issueDate.toLocaleDateString('en-IN')}).`,
          sourceId: invoice._id, sourceType: 'invoice',
          status: emailStatus, sentAt: new Date(),
        },
        {
          firmId: invoice.firmId, clientId: client._id, channel: 'sms',
          type: 'invoice_followup',
          title: `Payment reminder — ${invoice.invoiceNumber}`,
          message: `₹${due.toLocaleString('en-IN')} outstanding on ${invoice.invoiceNumber}.`,
          sourceId: invoice._id, sourceType: 'invoice', status: 'pending',
        },
      ]);

      invoice.followUpSentAt = new Date();
      await invoice.save();
      sent += 1;
    }
    if (sent > 0) logger.info(`Invoice follow-ups sent: ${sent}`);
  },
};
