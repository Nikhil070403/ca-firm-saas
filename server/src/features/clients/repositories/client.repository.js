const BaseRepository = require('../../../repositories/BaseRepository');
const Client = require('../models/Client.model');

class ClientRepository extends BaseRepository {
  constructor() {
    super(Client);
  }

  addContactPerson(firmId, clientId, contact) {
    return this.model.findOneAndUpdate(
      this.scoped(firmId, { _id: clientId }),
      { $push: { contactPersons: contact } },
      { new: true, runValidators: true }
    );
  }

  removeContactPerson(firmId, clientId, contactId) {
    return this.model.findOneAndUpdate(
      this.scoped(firmId, { _id: clientId }),
      { $pull: { contactPersons: { _id: contactId } } },
      { new: true }
    );
  }
}

module.exports = new ClientRepository();
