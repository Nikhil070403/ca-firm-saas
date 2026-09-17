const { Router } = require('express');
const controller = require('../controllers/ledger.controller');
const validate = require('../../../middlewares/validate.middleware');
const upload = require('../../../middlewares/upload.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const { validateCreateEntry } = require('../validators/ledger.validator');

const router = Router();

router.use(requireAuth);

router.post('/entries', authorize('ledger:create'), validate(validateCreateEntry), controller.addEntry);
router.post('/clients/:clientId/import', authorize('ledger:create'), upload.single('file'), controller.importEntries);
router.get('/clients/:clientId/statement', authorize('ledger:read'), controller.statement);
router.get('/clients/:clientId/balance', authorize('ledger:read'), controller.balance);
// Tally-style firm books: daybook | cashbook | bankbook | sales | expenses
router.get('/books/:book', authorize('ledger:read'), controller.book);

module.exports = router;
