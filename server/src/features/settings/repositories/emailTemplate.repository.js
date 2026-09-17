const EmailTemplate = require('../models/EmailTemplate.model');

const emailTemplateRepository = {
  listForFirm(firmId) {
    return EmailTemplate.find({ firmId }).sort({ key: 1 });
  },

  upsert(firmId, key, updates) {
    return EmailTemplate.findOneAndUpdate(
      { firmId, key },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );
  },
};

module.exports = emailTemplateRepository;
