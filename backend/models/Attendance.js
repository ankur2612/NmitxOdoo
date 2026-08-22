const mongoose = require("mongoose");
const { DATE_KEY_PATTERN } = require("../utils/dateKey");

const ATTENDANCE_STATUSES = ["present", "absent", "half-day", "leave"];

const attendanceSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
      match: [DATE_KEY_PATTERN, "dateKey must be in YYYY-MM-DD format"],
    },
    checkIn: Date,
    checkOut: Date,
    workHours: { type: Number, default: 0, min: 0 },
    extraHours: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: "present" },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, dateKey: 1 }, { unique: true });
attendanceSchema.index({ company: 1, dateKey: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
module.exports.ATTENDANCE_STATUSES = ATTENDANCE_STATUSES;
