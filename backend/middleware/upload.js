const multer = require("multer");
const httpError = require("../utils/httpError");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];

function singleFile(field, { allowedTypes, maxBytes, label }) {
  const handler = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (req, file, callback) => {
      if (!allowedTypes.includes(file.mimetype)) {
        return callback(httpError(400, `Unsupported ${label} type: ${file.mimetype}`));
      }

      callback(null, true);
    },
  }).single(field);

  return (req, res, next) => {
    handler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? `${label} must be ${Math.round(maxBytes / 1024 / 1024)}MB or smaller`
            : err.message;

        return next(httpError(400, message));
      }

      next(err);
    });
  };
}

function imageUpload(field) {
  return singleFile(field, {
    allowedTypes: IMAGE_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    label: "image",
  });
}

function documentUpload(field) {
  return singleFile(field, {
    allowedTypes: DOCUMENT_TYPES,
    maxBytes: MAX_DOCUMENT_BYTES,
    label: "document",
  });
}

module.exports = { imageUpload, documentUpload, IMAGE_TYPES, DOCUMENT_TYPES };
