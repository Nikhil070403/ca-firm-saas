const { Router } = require('express');
const controller = require('../controllers/notification.controller');
const { requireAuth } = require('../../../middlewares/auth.middleware');

const router = Router();

router.use(requireAuth);

router.get('/', controller.list);
router.patch('/:id/read', controller.markRead);
router.patch('/read-all', controller.markAllRead);

module.exports = router;
