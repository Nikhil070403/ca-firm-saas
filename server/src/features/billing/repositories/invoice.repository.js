const mongoose = require('mongoose');
const BaseRepository = require('../../../repositories/BaseRepository');
const Invoice = require('../models/Invoice.model');

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice);
  }

  async countForFirm(firmId) {
    return this.model.countDocuments({ firmId });
  }

  listOverdue(firmId, asOf = new Date()) {
    return this.model.find(
      this.scoped(firmId, { dueDate: { $lt: asOf }, status: { $in: ['sent', 'partially_paid'] } })
    );
  }

  revenueByMonth(firmId, monthsBack = 6) {
    const from = new Date();
    from.setMonth(from.getMonth() - monthsBack);
    return this.model.aggregate([
      { $match: { firmId: new mongoose.Types.ObjectId(firmId), isDeleted: false, issueDate: { $gte: from } } },
      {
        $group: {
          _id: { year: { $year: '$issueDate' }, month: { $month: '$issueDate' } },
          revenue: { $sum: '$grandTotal' },
          collected: { $sum: '$amountPaid' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  }

  outstandingTotal(firmId) {
    return this.model.aggregate([
      { $match: { firmId: new mongoose.Types.ObjectId(firmId), isDeleted: false, status: { $nin: ['paid', 'cancelled', 'draft'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$grandTotal', '$amountPaid'] } } } },
    ]);
  }
}

module.exports = new InvoiceRepository();
