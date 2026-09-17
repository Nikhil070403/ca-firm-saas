const Firm = require('../models/Firm.model');

const firmRepository = {
  findById(firmId) {
    return Firm.findById(firmId);
  },

  updateById(firmId, updates) {
    return Firm.findByIdAndUpdate(firmId, { $set: updates }, { new: true, runValidators: true });
  },
};

module.exports = firmRepository;
