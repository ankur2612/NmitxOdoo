const express = require("express");
const { auth, requireAdmin } = require("../middleware/auth");
const { imageUpload } = require("../middleware/upload");
const {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  uploadAvatar,
} = require("../controllers/employee.controller");
const {
  getSalary,
  upsertSalary,
  previewSalary,
} = require("../controllers/salary.controller");

const router = express.Router();

router.use(auth);

router.get("/", listEmployees);
router.post("/", requireAdmin, createEmployee);
router.get("/:id", getEmployee);
router.patch("/:id", updateEmployee);
router.post("/:id/avatar", imageUpload("avatar"), uploadAvatar);

router.get("/salary/preview", requireAdmin, previewSalary);
router.get("/:id/salary", requireAdmin, getSalary);
router.put("/:id/salary", requireAdmin, upsertSalary);

module.exports = router;
