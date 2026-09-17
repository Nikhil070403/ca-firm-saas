const { Router } = require('express');
const controller = require('../controllers/task.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const {
  validateCreateTask,
  validateUpdateTask,
  validateChecklistItem,
  validateComment,
  validateTimeLog,
} = require('../validators/task.validator');

const router = Router();

router.use(requireAuth);

router.get('/', authorize('task:read'), controller.list);
router.get('/status-counts', authorize('task:read'), controller.statusCounts);
router.post('/', authorize('task:create'), validate(validateCreateTask), controller.create);
router.get('/:id', authorize('task:read'), controller.getOne);
router.patch('/:id', authorize('task:update'), validate(validateUpdateTask), controller.update);
router.delete('/:id', authorize('task:delete'), controller.remove);

router.post('/:id/checklist', authorize('task:update'), validate(validateChecklistItem), controller.addChecklistItem);
router.patch('/:id/checklist/:itemId', authorize('task:update'), controller.toggleChecklistItem);
router.delete('/:id/checklist/:itemId', authorize('task:update'), controller.removeChecklistItem);

router.post('/:id/comments', authorize('task:update'), validate(validateComment), controller.addComment);
router.post('/:id/time-logs', authorize('task:update'), validate(validateTimeLog), controller.logTime);

module.exports = router;
