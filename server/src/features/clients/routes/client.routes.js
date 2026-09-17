const { Router } = require('express');
const controller = require('../controllers/client.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const {
  validateCreateClient, validateUpdateClient, validateContactPerson, validateCommunicationLog, validateSendMessage,
  validateBulkAssign,
} = require('../validators/client.validator');

const router = Router();

router.use(requireAuth);

router.get('/', authorize('client:read'), controller.list);
router.get('/risk-overview', authorize('client:read'), controller.riskOverview);
router.patch('/bulk-assign', authorize('client:update'), validate(validateBulkAssign), controller.bulkAssign);
router.post('/', authorize('client:create'), validate(validateCreateClient), controller.create);
router.get('/:id', authorize('client:read'), controller.getOne);
router.get('/:id/risk', authorize('client:read'), controller.risk);
router.patch('/:id', authorize('client:update'), validate(validateUpdateClient), controller.update);
router.delete('/:id', authorize('client:delete'), controller.remove);
router.get('/:id/timeline', authorize('client:read'), controller.timeline);
router.post('/:id/contacts', authorize('client:update'), validate(validateContactPerson), controller.addContact);
router.delete('/:id/contacts/:contactId', authorize('client:update'), controller.removeContact);
router.get('/:id/communications', authorize('client:read'), controller.listCommunications);
router.post('/:id/communications', authorize('client:update'), validate(validateCommunicationLog), controller.logCommunication);
router.get('/:id/messages', authorize('client:read'), controller.listMessages);
router.post('/:id/messages', authorize('client:update'), validate(validateSendMessage), controller.sendMessage);
router.patch('/:id/messages/read', authorize('client:read'), controller.markMessagesRead);

module.exports = router;
