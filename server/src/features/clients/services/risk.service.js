const mongoose = require('mongoose');
const Client = require('../models/Client.model');
const ComplianceReturn = require('../../compliance/models/ComplianceReturn.model');
const Invoice = require('../../billing/models/Invoice.model');
const Task = require('../../tasks/models/Task.model');

/**
 * Deterministic risk scoring — every factor is visible to the user, so a
 * score is always explainable ("2 overdue returns, ₹40k outstanding").
 *
 * Weights (capped so one runaway factor can't bury the others):
 *   overdue compliance returns  25 pts each, max 50
 *   overdue invoices            15 pts each, max 30
 *   outstanding amount          +10 when anything is outstanding, +10 more past ₹50,000
 *   overdue open tasks           5 pts each, max 10
 * Levels: 0–29 low · 30–59 medium · 60+ high.
 */
async function computeFactors(firmId, clientId) {
  const now = new Date();
  const scope = { firmId: new mongoose.Types.ObjectId(firmId), clientId: new mongoose.Types.ObjectId(clientId), isDeleted: false };

  const [overdueReturns, overdueInvoices, outstandingAgg, overdueTasks] = await Promise.all([
    ComplianceReturn.countDocuments({ ...scope, status: 'pending', dueDate: { $lt: now } }),
    Invoice.countDocuments({ ...scope, status: { $in: ['sent', 'partially_paid', 'overdue'] }, dueDate: { $lt: now } }),
    Invoice.aggregate([
      { $match: { ...scope, status: { $in: ['sent', 'partially_paid', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$grandTotal', '$amountPaid'] } } } },
    ]),
    Task.countDocuments({ ...scope, status: { $ne: 'done' }, dueDate: { $lt: now, $ne: null } }),
  ]);

  const outstanding = outstandingAgg[0]?.total || 0;
  return { overdueReturns, overdueInvoices, outstanding, overdueTasks };
}

function scoreFactors({ overdueReturns, overdueInvoices, outstanding, overdueTasks }) {
  let score = 0;
  score += Math.min(overdueReturns * 25, 50);
  score += Math.min(overdueInvoices * 15, 30);
  if (outstanding > 0) score += 10;
  if (outstanding > 50000) score += 10;
  score += Math.min(overdueTasks * 5, 10);
  score = Math.min(score, 100);

  let level = 'low';
  if (score >= 60) level = 'high';
  else if (score >= 30) level = 'medium';
  return { score, level };
}

async function getClientRisk(firmId, clientId) {
  const factors = await computeFactors(firmId, clientId);
  return { ...scoreFactors(factors), factors };
}

/** Every active client scored, riskiest first — feeds the dashboard alerts. */
async function getRiskOverview(firmId, { limit = 8 } = {}) {
  const clients = await Client.find({ firmId, isDeleted: false, status: 'active' }).select('displayName');
  const scored = await Promise.all(clients.map(async (client) => {
    const factors = await computeFactors(firmId, client._id);
    return { clientId: client._id, displayName: client.displayName, ...scoreFactors(factors), factors };
  }));
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = { getClientRisk, getRiskOverview };
