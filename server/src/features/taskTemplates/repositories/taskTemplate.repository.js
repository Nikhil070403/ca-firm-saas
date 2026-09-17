const BaseRepository = require('../../../repositories/BaseRepository');
const TaskTemplate = require('../models/TaskTemplate.model');

class TaskTemplateRepository extends BaseRepository {
  constructor() {
    super(TaskTemplate);
  }
}

module.exports = new TaskTemplateRepository();
