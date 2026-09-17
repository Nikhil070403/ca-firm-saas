const BaseRepository = require('../../../repositories/BaseRepository');
const User = require('../../auth/models/User.model');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findByEmailInFirm(firmId, email) {
    return this.model.findOne({ firmId, email: email.toLowerCase(), isDeleted: false });
  }

  // Email is globally unique (login identity), so conflict checks must look
  // across firms — not just inside one.
  findByEmailAnywhere(email) {
    return this.model.findOne({ email: email.toLowerCase() });
  }
}

module.exports = new UserRepository();
