const mongoose = require("mongoose");
const { DATE_KEY_PATTERN } = require("../utils/dateKey");

const LEAVE_STATUSES = ["pending", "approved", "rejected"];

const leaveRequestSchema = new mongoose.Schema(
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
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    startDate: {
      type: String,
      required: true,
      match: [DATE_KEY_PATTERN, "startDate must be in YYYY-MM-DD format"],
    },
    endDate: {
      type: String,
      required: true,
      match: [DATE_KEY_PATTERN, "endDate must be in YYYY-MM-DD format"],
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "endDate cannot be before startDate",
      },
    },
    days: { type: Number, required: true, min: 0.5 },
    remarks: { type: String, default: "" },
    attachmentUrl: { type: String, default: "" },
    status: { type: String, enum: LEAVE_STATUSES, default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    reviewComment: { type: String, default: "" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

leaveRequestSchema.index({ company: 1, status: 1 });
leaveRequestSchema.index({ employee: 1, startDate: 1 });

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
module.exports.LEAVE_STATUSES = LEAVE_STATUSES;
