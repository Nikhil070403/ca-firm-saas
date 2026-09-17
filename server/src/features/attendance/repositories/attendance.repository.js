const BaseRepository = require('../../../repositories/BaseRepository');
const Attendance = require('../models/Attendance.model');

class AttendanceRepository extends BaseRepository {
  constructor() {
    super(Attendance);
  }
}

module.exports = new AttendanceRepository();
