const { Router } = require('express');
const controller = require('../controllers/attendance.controller');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { requireAdminRole } = require('../../../middlewares/rbac.middleware');
const AppError = require('../../../utils/AppError');

const router = Router();

router.use(requireAuth);

// Attendance is a staff concept — clients never check in/out.
function blockClients(req, res, next) {
  if (req.user.role === 'client') return next(AppError.forbidden('Not available for client accounts'));
  next();
}

router.post('/check-in', blockClients, controller.checkIn);
router.post('/check-out', blockClients, controller.checkOut);
router.get('/me', blockClients, controller.myHistory);
router.get('/team', requireAdminRole, controller.teamByDate);
router.get('/summary', requireAdminRole, controller.monthlySummary);

module.exports = router;
