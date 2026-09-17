const mongoose = require('mongoose');
const BaseRepository = require('../../../repositories/BaseRepository');
const Expense = require('../models/Expense.model');

class ExpenseRepository extends BaseRepository {
  constructor() {
    super(Expense);
  }

  totalByCategory(firmId) {
    return this.model.aggregate([
      { $match: { firmId: new mongoose.Types.ObjectId(firmId), isDeleted: false } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
  }
}

module.exports = new ExpenseRepository();
