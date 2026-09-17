const { Router } = require('express');
const controller = require('../controllers/portal.controller');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const requirePortalUser = require('../middlewares/requirePortalUser');

const router = Router();

router.use(requireAuth);
// Loads the live User row (role + linkedClientId) — the portal must react
// to an admin re-linking a client immediately, not wait for token refresh.
router.use(requirePortalUser);

router.get('/overview', controller.overview);
router.get('/compliance', controller.compliance);
router.get('/invoices', controller.invoices);
router.get('/documents', controller.documents);
router.get('/ledger', controller.ledger);
router.get('/tasks', controller.tasks);
router.get('/messages', controller.messages);
router.post('/messages', controller.sendMessage);
router.patch('/messages/read', controller.markMessagesRead);

module.exports = router;
