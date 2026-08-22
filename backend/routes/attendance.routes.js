const express = require("express");
const { auth, requireAdmin } = require("../middleware/auth");
const {
  checkIn,
  checkOut,
  todayAttendance,
  myAttendance,
  dayAttendance,
} = require("../controllers/attendance.controller");

const router = express.Router();

router.use(auth);

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/today", todayAttendance);
router.get("/me", myAttendance);
router.get("/", requireAdmin, dayAttendance);

module.exports = router;
