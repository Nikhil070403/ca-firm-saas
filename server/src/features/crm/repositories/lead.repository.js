const mongoose = require('mongoose');
const BaseRepository = require('../../../repositories/BaseRepository');
const Lead = require('../models/Lead.model');

class LeadRepository extends BaseRepository {
  constructor() {
    super(Lead);
  }

  countByStatus(firmId) {
    return this.model.aggregate([
      { $match: { firmId: new mongoose.Types.ObjectId(firmId), isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$estimatedValue' } } },
    ]);
  }

  countBySource(firmId) {
    return this.model.aggregate([
      { $match: { firmId: new mongoose.Types.ObjectId(firmId), isDeleted: false } },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          value: { $sum: '$estimatedValue' },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  countByOwner(firmId) {
    return this.model.aggregate([
      { $match: { firmId: new mongoose.Types.ObjectId(firmId), isDeleted: false } },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'users', localField: '_id', foreignField: '_id', as: 'owner',
          pipeline: [{ $project: { name: 1, email: 1 } }],
        },
      },
      { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
      { $sort: { count: -1 } },
    ]);
  }
}

module.exports = new LeadRepository();
