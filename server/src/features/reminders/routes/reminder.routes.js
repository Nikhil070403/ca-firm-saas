const { Router } = require('express');
const controller = require('../controllers/reminder.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const { validateCreateReminder, validateUpdateReminder } = require('../validators/reminder.validator');

const router = Router();

router.use(requireAuth);

router.get('/', authorize('reminder:read'), controller.list);
router.get('/calendar', authorize('reminder:read'), controller.calendar);
router.post('/', authorize('reminder:create'), validate(validateCreateReminder), controller.create);
router.get('/:id', authorize('reminder:read'), controller.getOne);
router.patch('/:id', authorize('reminder:update'), validate(validateUpdateReminder), controller.update);
router.patch('/:id/complete', authorize('reminder:update'), controller.complete);
router.delete('/:id', authorize('reminder:delete'), controller.remove);

module.exports = router;
