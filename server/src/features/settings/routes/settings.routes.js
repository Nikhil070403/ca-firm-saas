const { Router } = require('express');
const controller = require('../controllers/settings.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const { validateUpdateFirm, validateEmailTemplate } = require('../validators/settings.validator');

const router = Router();

router.use(requireAuth);

router.get('/firm', authorize('settings:read'), controller.getFirm);
router.patch('/firm', authorize('settings:update'), validate(validateUpdateFirm), controller.updateFirm);
router.get('/firm/branding', controller.getFirmBranding);

router.get('/email-templates', authorize('settings:read'), controller.listEmailTemplates);
router.put('/email-templates/:key', authorize('settings:update'), validate(validateEmailTemplate), controller.upsertEmailTemplate);

router.get('/backup', authorize('settings:read'), controller.backup);

module.exports = router;
