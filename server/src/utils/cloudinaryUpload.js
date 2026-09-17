const cloudinary = require('../config/cloudinary');

function uploadBuffer(buffer, { folder = 'ca-firm-saas', resourceType = 'auto' } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

function destroyAsset(publicId, { resourceType = 'auto' } = {}) {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { uploadBuffer, destroyAsset };
