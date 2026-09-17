const { Router } = require('express');
const controller = require('../controllers/taskTemplate.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize, requireAdminRole } = require('../../../middlewares/rbac.middleware');
const { validateCreateTemplate, validateApplyTemplate } = require('../validators/taskTemplate.validator');

const router = Router();

router.use(requireAuth);

// Any staff member who can see tasks can browse/apply templates; only an
// admin/superadmin may define or change the firm's workflow templates.
router.get('/', authorize('task:read'), controller.list);
router.post('/', requireAdminRole, validate(validateCreateTemplate), controller.create);
router.patch('/:id', requireAdminRole, controller.update);
router.delete('/:id', requireAdminRole, controller.remove);
router.post('/:id/apply', authorize('task:create'), validate(validateApplyTemplate), controller.apply);

module.exports = router;
