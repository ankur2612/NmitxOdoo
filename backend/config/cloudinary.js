const { v2: cloudinary } = require("cloudinary");

const CLOUD_NAME = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });

    stream.end(buffer);
  });
}

function destroy(publicId, options = {}) {
  return cloudinary.uploader.destroy(publicId, options);
}

module.exports = { cloudinary, uploadBuffer, destroy, isCloudinaryConfigured };
