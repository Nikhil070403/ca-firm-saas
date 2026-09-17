const { Router } = require('express');
const controller = require('../controllers/document.controller');
const validate = require('../../../middlewares/validate.middleware');
const upload = require('../../../middlewares/upload.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authorize, requireAdminRole } = require('../../../middlewares/rbac.middleware');
const { validateUploadMeta, validateCreateFolder, validateReview } = require('../validators/document.validator');

const router = Router();

router.use(requireAuth);

router.get('/', authorize('document:read'), controller.list);
router.post('/', authorize('document:create'), upload.single('file'), validate(validateUploadMeta), controller.upload);
router.post('/:id/versions', authorize('document:update'), upload.single('file'), controller.uploadNewVersion);
router.patch('/:id/review', requireAdminRole, validate(validateReview), controller.review);
router.delete('/:id', authorize('document:delete'), controller.remove);

router.get('/folders', authorize('document:read'), controller.listFolders);
router.post('/folders', authorize('document:create'), validate(validateCreateFolder), controller.createFolder);

module.exports = router;
