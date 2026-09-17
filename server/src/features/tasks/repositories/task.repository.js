const mongoose = require('mongoose');
const BaseRepository = require('../../../repositories/BaseRepository');
const Task = require('../models/Task.model');

class TaskRepository extends BaseRepository {
  constructor() {
    super(Task);
  }

  pushChecklistItem(firmId, id, item) {
    return this.model.findOneAndUpdate(
      this.scoped(firmId, { _id: id }),
      { $push: { checklist: item } },
      { new: true }
    );
  }

  toggleChecklistItem(firmId, id, itemId, isDone) {
    return this.model.findOneAndUpdate(
      this.scoped(firmId, { _id: id, 'checklist._id': itemId }),
      { $set: { 'checklist.$.isDone': isDone } },
      { new: true }
    );
  }

  removeChecklistItem(firmId, id, itemId) {
    return this.model.findOneAndUpdate(
      this.scoped(firmId, { _id: id }),
      { $pull: { checklist: { _id: itemId } } },
      { new: true }
    );
  }

  pushComment(firmId, id, comment) {
    return this.model.findOneAndUpdate(
      this.scoped(firmId, { _id: id }),
      { $push: { comments: comment } },
      { new: true }
    );
  }

  pushTimeLog(firmId, id, timeLog) {
    return this.model.findOneAndUpdate(
      this.scoped(firmId, { _id: id }),
      { $push: { timeLogs: timeLog } },
      { new: true }
    );
  }

  countByStatus(firmId) {
    return this.model.aggregate([
      { $match: { firmId: new mongoose.Types.ObjectId(firmId), isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }
}

module.exports = new TaskRepository();
