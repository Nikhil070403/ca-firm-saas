const { Router } = require('express');
const controller = require('../controllers/lead.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const { validateCreateLead, validateUpdateLead, validateLeadActivity, validateBulkAssign } = require('../validators/lead.validator');

const router = Router();

router.use(requireAuth);

router.get('/', authorize('lead:read'), controller.list);
router.get('/pipeline-summary', authorize('lead:read'), controller.pipeline);
router.get('/source-summary', authorize('lead:read'), controller.sourceSummary);
router.get('/owner-summary', authorize('lead:read'), controller.ownerSummary);
router.get('/followups/upcoming', authorize('lead:read'), controller.upcomingFollowUps);
router.patch('/followups/:activityId/complete', authorize('lead:update'), controller.completeFollowUp);
router.patch('/bulk-assign', authorize('lead:update'), validate(validateBulkAssign), controller.bulkAssign);
router.post('/', authorize('lead:create'), validate(validateCreateLead), controller.create);
router.get('/:id', authorize('lead:read'), controller.getOne);
router.patch('/:id', authorize('lead:update'), validate(validateUpdateLead), controller.update);
router.delete('/:id', authorize('lead:delete'), controller.remove);
router.get('/:id/activities', authorize('lead:read'), controller.listActivities);
router.post('/:id/activities', authorize('lead:update'), validate(validateLeadActivity), controller.addActivity);
router.post('/:id/convert', authorize('lead:update', 'client:create'), controller.convert);

module.exports = router;
