/**
 * Every feature repository extends this. It's the ONLY place `isDeleted`
 * and `firmId` scoping are enforced — controllers/services never build raw
 * Mongo queries, they call repository methods, so tenant isolation and soft
 * delete can't be forgotten module-by-module.
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  scoped(firmId, extra = {}) {
    return { firmId, isDeleted: false, ...extra };
  }

  async create(firmId, data) {
    return this.model.create({ ...data, firmId });
  }

  async findById(firmId, id, { populate } = {}) {
    let query = this.model.findOne(this.scoped(firmId, { _id: id }));
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async findOne(firmId, filter, { populate } = {}) {
    let query = this.model.findOne(this.scoped(firmId, filter));
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async find(firmId, filter = {}, { populate, sort } = {}) {
    let query = this.model.find(this.scoped(firmId, filter));
    if (sort) query = query.sort(sort);
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async paginate(firmId, { filter = {}, sort = { createdAt: -1 }, skip = 0, limit = 20, populate } = {}) {
    const finalFilter = this.scoped(firmId, filter);
    let query = this.model.find(finalFilter).sort(sort).skip(skip).limit(limit);
    if (populate) query = query.populate(populate);

    const [items, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(finalFilter),
    ]);

    return { items, total };
  }

  async updateById(firmId, id, updates, { updatedBy } = {}) {
    const payload = updatedBy ? { ...updates, updatedBy } : updates;
    return this.model.findOneAndUpdate(
      this.scoped(firmId, { _id: id }),
      { $set: payload },
      { new: true, runValidators: true }
    );
  }

  async softDelete(firmId, id, { deletedBy } = {}) {
    return this.model.findOneAndUpdate(
      this.scoped(firmId, { _id: id }),
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy } },
      { new: true }
    );
  }

  async countByFilter(firmId, filter = {}) {
    return this.model.countDocuments(this.scoped(firmId, filter));
  }

  // Shared by bulk-action toolbars (e.g. "assign selected to…") — scoped to
  // firm + non-deleted exactly like every other method here, so a bulk
  // action can never reach into another firm's or a soft-deleted record.
  async bulkUpdate(firmId, ids, updates) {
    const result = await this.model.updateMany(
      this.scoped(firmId, { _id: { $in: ids } }),
      { $set: updates }
    );
    return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
  }
}

module.exports = BaseRepository;
