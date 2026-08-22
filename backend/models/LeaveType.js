const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    isPaid: { type: Boolean, default: true },
    defaultDays: { type: Number, default: 0, min: 0 },
    requiresAttachment: { type: Boolean, default: false },
    color: { type: String, default: "#7c5cff" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

leaveTypeSchema.index({ company: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
