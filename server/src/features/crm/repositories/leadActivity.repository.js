const LeadActivity = require('../models/LeadActivity.model');

const leadActivityRepository = {
  create(firmId, data) {
    return LeadActivity.create({ ...data, firmId });
  },

  listForLead(firmId, leadId) {
    return LeadActivity.find({ firmId, leadId })
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name email avatarUrl');
  },

  // Scheduled follow-ups/calls/meetings that haven't been completed yet,
  // across every lead — powers the CRM "Follow-ups" workboard.
  listUpcoming(firmId, { includeOverdue = true } = {}) {
    const dateClause = includeOverdue ? { $ne: null } : { $gte: new Date() };
    return LeadActivity.find({
      firmId,
      type: { $in: ['follow_up', 'call', 'meeting'] },
      scheduledAt: dateClause,
      completedAt: null,
    })
      .sort({ scheduledAt: 1 })
      .limit(200)
      .populate('performedBy', 'name email')
      .populate('leadId', 'name company phone status');
  },

  markCompleted(firmId, activityId) {
    return LeadActivity.findOneAndUpdate(
      { _id: activityId, firmId },
      { $set: { completedAt: new Date() } },
      { new: true }
    );
  },
};

module.exports = leadActivityRepository;
