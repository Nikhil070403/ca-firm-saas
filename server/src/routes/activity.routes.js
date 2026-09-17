const { Router } = require('express');
const controller = require('../controllers/activity.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = Router();

// Firm-wide audit trail — admin surface (Accounts > Activity Log), so it
// rides on settings:read which only admins hold today.
router.get('/', requireAuth, authorize('settings:read'), controller.list);

module.exports = router;
