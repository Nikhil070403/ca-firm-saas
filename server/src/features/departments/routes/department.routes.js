const { Router } = require('express');
const controller = require('../controllers/department.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize, requireAdminRole } = require('../../../middlewares/rbac.middleware');
const { validateCreateDepartment } = require('../validators/department.validator');

const router = Router();

router.use(requireAuth);

router.get('/', authorize('user:read'), controller.list);
router.post('/', requireAdminRole, validate(validateCreateDepartment), controller.create);
router.patch('/:id', requireAdminRole, controller.update);
router.delete('/:id', requireAdminRole, controller.remove);

module.exports = router;
