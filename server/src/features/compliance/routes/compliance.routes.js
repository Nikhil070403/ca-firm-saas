const { Router } = require('express');
const controller = require('../controllers/compliance.controller');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');

const router = Router();

router.use(requireAuth);

// Rides reminder capabilities: compliance tracking is the reminder system's
// statutory sibling, so any role that can work reminders can work returns.
router.get('/', authorize('reminder:read'), controller.list);
router.post('/generate', authorize('reminder:create'), controller.generate);
router.patch('/:id/file', authorize('reminder:update'), controller.markFiled);
router.patch('/:id/tax-payable', authorize('reminder:update'), controller.setTaxPayable);

module.exports = router;
