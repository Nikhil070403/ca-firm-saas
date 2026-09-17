const { Router } = require('express');
const controller = require('../controllers/user.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const { validateCreateUser, validateUpdateUser } = require('../validators/user.validator');

const router = Router();

router.use(requireAuth);

router.get('/', authorize('user:read'), controller.list);
router.post('/', authorize('user:create'), validate(validateCreateUser), controller.create);
router.get('/:id', authorize('user:read'), controller.getOne);
router.patch('/:id', authorize('user:update'), validate(validateUpdateUser), controller.update);
router.patch('/:id/status', authorize('user:update'), controller.setActive);
router.delete('/:id', authorize('user:delete'), controller.remove);

module.exports = router;
