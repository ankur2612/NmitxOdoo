const express = require("express");
const { auth, requireAdmin } = require("../middleware/auth");
const { documentUpload } = require("../middleware/upload");
const {
  applyLeave,
  myLeaves,
  listLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  myBalance,
} = require("../controllers/leave.controller");

const router = express.Router();

router.use(auth);

router.get("/me", myLeaves);
router.get("/balance", myBalance);
router.post("/", documentUpload("attachment"), applyLeave);
router.get("/", requireAdmin, listLeaves);
router.patch("/:id/approve", requireAdmin, approveLeave);
router.patch("/:id/reject", requireAdmin, rejectLeave);
router.delete("/:id", cancelLeave);

module.exports = router;
