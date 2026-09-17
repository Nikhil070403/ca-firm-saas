const { Router } = require('express');
const controller = require('../controllers/report.controller');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');

const router = Router();

router.use(requireAuth, authorize('report:read'));

router.get('/revenue', controller.revenue);
router.get('/outstanding', controller.outstanding);
router.get('/client-wise', controller.clientWise);
router.get('/employee-wise', controller.employeeWise);
router.get('/reminder-wise', controller.reminderWise);
router.get('/gst', controller.gst);
router.get('/ledger/:clientId', controller.ledger);

module.exports = router;
