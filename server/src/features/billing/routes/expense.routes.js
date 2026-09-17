const { Router } = require('express');
const controller = require('../controllers/expense.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize, requireAdminRole } = require('../../../middlewares/rbac.middleware');
const { validateCreateExpense, validateReviewExpense } = require('../validators/expense.validator');

const router = Router();

router.use(requireAuth);

router.get('/', authorize('expense:read'), controller.list);
router.get('/totals-by-category', authorize('expense:read'), controller.totalsByCategory);
router.post('/', authorize('expense:create'), validate(validateCreateExpense), controller.create);
router.get('/:id', authorize('expense:read'), controller.getOne);
router.patch('/:id', authorize('expense:update'), controller.update);
router.patch('/:id/review', requireAdminRole, validate(validateReviewExpense), controller.review);
router.delete('/:id', authorize('expense:delete'), controller.remove);

module.exports = router;
