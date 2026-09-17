const BaseRepository = require('../../../repositories/BaseRepository');
const Receipt = require('../models/Receipt.model');

class ReceiptRepository extends BaseRepository {
  constructor() {
    super(Receipt);
  }

  countForFirm(firmId) {
    return this.model.countDocuments({ firmId });
  }
}

module.exports = new ReceiptRepository();
