const { Router } = require('express');
const controller = require('../controllers/invoice.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const { validateCreateInvoice, validateUpdateInvoiceStatus } = require('../validators/invoice.validator');

const router = Router();

router.use(requireAuth);

router.get('/', authorize('invoice:read'), controller.list);
router.post('/', authorize('invoice:create'), validate(validateCreateInvoice), controller.create);
router.get('/:id', authorize('invoice:read'), controller.getOne);
router.patch('/:id/status', authorize('invoice:update'), validate(validateUpdateInvoiceStatus), controller.updateStatus);
router.delete('/:id', authorize('invoice:delete'), controller.remove);

module.exports = router;
