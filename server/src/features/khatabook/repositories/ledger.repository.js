const BaseRepository = require('../../../repositories/BaseRepository');
const LedgerEntry = require('../models/LedgerEntry.model');

class LedgerRepository extends BaseRepository {
  constructor() {
    super(LedgerEntry);
  }

  async findLastEntryForClient(firmId, clientId) {
    return this.model
      .findOne(this.scoped(firmId, { clientId }))
      .sort({ entryDate: -1, createdAt: -1 });
  }

  listForClient(firmId, clientId, { from, to } = {}) {
    const filter = { clientId };
    if (from || to) {
      filter.entryDate = {};
      if (from) filter.entryDate.$gte = new Date(from);
      if (to) filter.entryDate.$lte = new Date(to);
    }
    return this.model
      .find(this.scoped(firmId, filter))
      .sort({ entryDate: 1, createdAt: 1 })
      .populate('recordedBy', 'name email');
  }

  bulkInsert(firmId, entries) {
    return this.model.insertMany(entries.map((e) => ({ ...e, firmId })));
  }

  // All of a client's entries in chronological order, used to rewrite running
  // balances after a bulk import (no populate — this is a compute pass).
  allForClient(firmId, clientId) {
    return this.model
      .find(this.scoped(firmId, { clientId }))
      .sort({ entryDate: 1, createdAt: 1 });
  }

  applyBalances(updates) {
    if (updates.length === 0) return Promise.resolve();
    return this.model.bulkWrite(updates.map((u) => ({
      updateOne: { filter: { _id: u.id }, update: { $set: { runningBalance: u.runningBalance } } },
    })));
  }
}

module.exports = new LedgerRepository();
