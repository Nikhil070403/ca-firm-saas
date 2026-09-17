const multer = require('multer');

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

// Memory storage: the buffer is streamed straight to Cloudinary in the
// document service, never written to local disk.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

module.exports = upload;
