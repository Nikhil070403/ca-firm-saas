const complianceReturnRepository = require('../repositories/complianceReturn.repository');
const Client = require('../../clients/models/Client.model');
const Notification = require('../../reminders/models/Notification.model');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { sendMail } = require('../../../config/mailer');
const { parseListQuery } = require('../../../utils/pagination');
const {
  gstPeriodFor, yearlyPeriodFor, RETURN_TYPE_LABELS, YEARLY_RULES,
} = require('../utils/complianceRules');
const {
  complianceReminderEmail, complianceFiledEmail, taxPayableEmail,
} = require('../../../utils/emailTemplates');
const { isAutomationEnabled } = require('../../../utils/firmAutomation');

const GST_RETURN_TYPES = new Set(['gstr1', 'gstr3b']);

/**
 * Sends to the client's registered email and logs one Notification row per
 * channel. SMS is "structure ready": the row is recorded but no gateway is
 * wired, so it stays pending until a provider is added.
 */
async function notifyClient(firmId, client, { type, title, message, sourceId, email }) {
  let emailStatus = 'pending';
  if (client.email && email) {
    const result = await sendMail({ to: client.email, subject: email.subject, html: email.html });
    emailStatus = result.sent || result.skipped ? 'sent' : 'failed';
  }
  await Notification.create([
    {
      firmId, clientId: client._id, channel: 'email', type, title, message,
      sourceId, sourceType: 'compliance_return',
      status: client.email ? emailStatus : 'failed', sentAt: new Date(),
    },
    {
      firmId, clientId: client._id, channel: 'sms', type, title, message,
      sourceId, sourceType: 'compliance_return', status: 'pending',
    },
  ]);
}

/** Create the current period's rows for every configured client. Idempotent. */
async function generateReturns(now = new Date()) {
  const clients = await Client.find({
    isDeleted: false,
    status: 'active',
    $or: [
      { 'compliance.gstFrequency': { $in: ['monthly', 'quarterly'] } },
      { 'compliance.itrForm': { $ne: null } },
      { 'compliance.gstr9c': true },
      { 'compliance.roc': true },
      { 'compliance.audit': true },
    ],
  });

  let created = 0;
  for (const client of clients) {
    const c = client.compliance || {};
    const jobs = [];

    if (c.gstFrequency === 'monthly' || c.gstFrequency === 'quarterly') {
      for (const returnType of ['gstr1', 'gstr3b']) {
        const period = gstPeriodFor(returnType, c.gstFrequency, now);
        jobs.push({ returnType, frequency: c.gstFrequency, ...period });
      }
    }
    if (c.itrForm) jobs.push({ returnType: 'itr', frequency: 'yearly', ...yearlyPeriodFor('itr', now) });
    for (const yearlyType of ['gstr9c', 'roc', 'audit']) {
      if (c[yearlyType]) jobs.push({ returnType: yearlyType, frequency: 'yearly', ...yearlyPeriodFor(yearlyType, now) });
    }

    for (const job of jobs) {
      const doc = await complianceReturnRepository.upsertPeriod(
        client.firmId, client._id, job.returnType,
        {
          frequency: job.frequency,
          periodKey: job.periodKey,
          periodLabel: job.periodLabel,
          dueDate: job.dueDate,
          remindFrom: job.remindFrom,
        }
      );
      if (doc.createdAt.getTime() === doc.updatedAt.getTime()) created += 1;
    }
  }
  return { clientsScanned: clients.length, created };
}

/** Daily reminder dispatch: everything pending inside its window, once a day. */
async function sendReminders(now = new Date()) {
  const due = await complianceReturnRepository.findDueForReminder(now);
  let sent = 0;
  for (const ret of due) {
    const client = ret.clientId;
    if (!client) continue;

    const automationKey = GST_RETURN_TYPES.has(ret.returnType) ? 'gstReminders' : 'yearlyReminders';
    // eslint-disable-next-line no-await-in-loop
    if (!(await isAutomationEnabled(ret.firmId, automationKey))) continue;

    const label = ret.returnType === 'itr' ? RETURN_TYPE_LABELS.itr : RETURN_TYPE_LABELS[ret.returnType];
    await notifyClient(ret.firmId, client, {
      type: 'compliance_reminder',
      title: `${label} due ${ret.dueDate.toLocaleDateString('en-IN')}`,
      message: `${label} for ${ret.periodLabel} is pending. Due ${ret.dueDate.toLocaleDateString('en-IN')}.`,
      sourceId: ret._id,
      email: complianceReminderEmail(client.displayName, label, ret.periodLabel, ret.dueDate),
    });
    ret.lastReminderAt = now;
    await ret.save();
    sent += 1;
  }
  if (sent > 0) logger.info(`Compliance reminders sent: ${sent}`);
  return { sent };
}

async function listReturns(firmId, query) {
  const { page, limit, skip, sort, filters } = parseListQuery(query, {
    searchableFields: [],
    allowedFilters: ['returnType', 'status', 'clientId', 'frequency', 'periodKey'],
  });
  const { items, total } = await complianceReturnRepository.paginate(firmId, {
    filter: filters,
    sort: Object.keys(sort || {}).length ? sort : { dueDate: 1 },
    skip,
    limit,
    populate: { path: 'clientId', select: 'displayName email gstNumber' },
  });
  return { items, page, limit, total };
}

async function markFiled(firmId, id, actorId) {
  const ret = await complianceReturnRepository.findById(firmId, id, {
    populate: { path: 'clientId', select: 'displayName email' },
  });
  if (!ret) throw AppError.notFound('Return not found');
  if (ret.status === 'filed') throw AppError.conflict('Return is already marked filed');

  ret.status = 'filed';
  ret.filedAt = new Date();
  ret.filedBy = actorId;
  ret.filedNotifiedAt = new Date();
  await ret.save();

  const label = RETURN_TYPE_LABELS[ret.returnType];
  await notifyClient(ret.firmId, ret.clientId, {
    type: 'compliance_filed',
    title: `${label} filed for ${ret.periodLabel}`,
    message: `${label} for ${ret.periodLabel} was filed on ${ret.filedAt.toLocaleDateString('en-IN')}.`,
    sourceId: ret._id,
    email: complianceFiledEmail(ret.clientId.displayName, label, ret.periodLabel, ret.filedAt),
  });
  return ret;
}

async function setTaxPayable(firmId, id, amount) {
  const ret = await complianceReturnRepository.findById(firmId, id, {
    populate: { path: 'clientId', select: 'displayName email' },
  });
  if (!ret) throw AppError.notFound('Return not found');
  if (ret.returnType !== 'gstr3b') throw AppError.badRequest('Tax payable applies to GSTR-3B returns');

  ret.taxPayable = amount;
  ret.taxNotifiedAt = new Date();
  await ret.save();

  const label = RETURN_TYPE_LABELS[ret.returnType];
  await notifyClient(ret.firmId, ret.clientId, {
    type: 'tax_payable',
    title: `Tax payable: ₹${Number(amount).toLocaleString('en-IN')} (${ret.periodLabel})`,
    message: `Tax payable for ${label} — ${ret.periodLabel} is ₹${Number(amount).toLocaleString('en-IN')}.`,
    sourceId: ret._id,
    email: taxPayableEmail(ret.clientId.displayName, label, ret.periodLabel, amount),
  });
  return ret;
}

module.exports = {
  generateReturns,
  sendReminders,
  listReturns,
  markFiled,
  setTaxPayable,
  notifyClient,
  YEARLY_RULES,
};
