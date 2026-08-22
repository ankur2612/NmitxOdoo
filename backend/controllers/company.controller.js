const Company = require("../models/Company");
const { uploadBuffer, isCloudinaryConfigured } = require("../config/cloudinary");
const httpError = require("../utils/httpError");

async function getCompany(req, res) {
  const company = await Company.findById(req.user.company);

  if (!company) {
    throw httpError(404, "Company not found");
  }

  res.json({ company });
}

async function uploadLogo(req, res) {
  if (!req.file) {
    throw httpError(400, "No image uploaded, send it as the form field 'logo'");
  }

  if (!isCloudinaryConfigured()) {
    throw httpError(503, "Cloudinary is not configured, set CLOUDINARY_* in .env");
  }

  const company = await Company.findById(req.user.company);

  if (!company) {
    throw httpError(404, "Company not found");
  }

  const result = await uploadBuffer(req.file.buffer, {
    public_id: `dayflow/${company._id}/logo`,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
    transformation: [{ width: 512, height: 512, crop: "limit" }],
  });

  company.logoUrl = result.secure_url;
  await company.save();

  res.json({ company, logoUrl: company.logoUrl });
}

module.exports = { getCompany, uploadLogo };
