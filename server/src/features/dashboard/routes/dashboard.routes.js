const { Router } = require('express');
const controller = require('../controllers/dashboard.controller');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');

const router = Router();

router.get('/overview', requireAuth, authorize('dashboard:read'), controller.overview);

module.exports = router;
