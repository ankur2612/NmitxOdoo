const express = require("express");
const { auth, requireAdmin } = require("../middleware/auth");
const { imageUpload } = require("../middleware/upload");
const { getCompany, uploadLogo } = require("../controllers/company.controller");

const router = express.Router();

router.use(auth);

router.get("/", getCompany);
router.post("/logo", requireAdmin, imageUpload("logo"), uploadLogo);

module.exports = router;
