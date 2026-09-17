const firmRepository = require('../repositories/firm.repository');
const emailTemplateRepository = require('../repositories/emailTemplate.repository');
const AppError = require('../../../utils/AppError');
const Client = require('../../clients/models/Client.model');
const Lead = require('../../crm/models/Lead.model');
const Invoice = require('../../billing/models/Invoice.model');
const Receipt = require('../../billing/models/Receipt.model');
const Expense = require('../../billing/models/Expense.model');
const Task = require('../../tasks/models/Task.model');
const Reminder = require('../../reminders/models/Reminder.model');
const LedgerEntry = require('../../khatabook/models/LedgerEntry.model');

async function getFirmProfile(firmId) {
  const firm = await firmRepository.findById(firmId);
  if (!firm) throw AppError.notFound('Firm not found');
  return firm;
}

async function updateFirmProfile(firmId, updates) {
  const firm = await firmRepository.updateById(firmId, updates);
  if (!firm) throw AppError.notFound('Firm not found');
  return firm;
}

// Deliberately not gated by settings:read — every role (including clients
// in the Portal) needs this to render the branded shell, and it exposes
// nothing beyond what a logo/color already reveals publicly.
async function getFirmBranding(firmId) {
  const firm = await firmRepository.findById(firmId);
  if (!firm) throw AppError.notFound('Firm not found');
  return { name: firm.name, logoUrl: firm.logoUrl, primaryColor: firm.primaryColor };
}

async function listEmailTemplates(firmId) {
  return emailTemplateRepository.listForFirm(firmId);
}

async function upsertEmailTemplate(firmId, key, updates) {
  return emailTemplateRepository.upsert(firmId, key, updates);
}

// A lightweight "backup" — a JSON export of the firm's core data. Full
// binary/file backups (Cloudinary assets, DB snapshots) are an ops-level
// concern outside this app's scope; this covers the "Backup" settings item
// from the spec without standing up separate infrastructure.
async function exportBackup(firmId) {
  const [clients, leads, invoices, receipts, expenses, tasks, reminders, ledgerEntries] = await Promise.all([
    Client.find({ firmId, isDeleted: false }).lean(),
    Lead.find({ firmId, isDeleted: false }).lean(),
    Invoice.find({ firmId, isDeleted: false }).lean(),
    Receipt.find({ firmId, isDeleted: false }).lean(),
    Expense.find({ firmId, isDeleted: false }).lean(),
    Task.find({ firmId, isDeleted: false }).lean(),
    Reminder.find({ firmId, isDeleted: false }).lean(),
    LedgerEntry.find({ firmId, isDeleted: false }).lean(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    firmId,
    clients,
    leads,
    invoices,
    receipts,
    expenses,
    tasks,
    reminders,
    ledgerEntries,
  };
}

module.exports = {
  getFirmProfile, updateFirmProfile, getFirmBranding, listEmailTemplates, upsertEmailTemplate, exportBackup,
};
