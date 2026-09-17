const { Router } = require('express');
const controller = require('../controllers/receipt.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const { validateCreateReceipt } = require('../validators/receipt.validator');

const router = Router();

router.use(requireAuth);

router.get('/', authorize('invoice:read'), controller.list);
router.post('/', authorize('invoice:update'), validate(validateCreateReceipt), controller.create);
router.get('/:id', authorize('invoice:read'), controller.getOne);

module.exports = router;
