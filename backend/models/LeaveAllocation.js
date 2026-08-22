const mongoose = require("mongoose");

const leaveAllocationSchema = new mongoose.Schema(
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
    year: { type: Number, required: true },
    allocatedDays: { type: Number, default: 0, min: 0 },
    usedDays: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

leaveAllocationSchema.index({ employee: 1, leaveType: 1, year: 1 }, { unique: true });

leaveAllocationSchema.virtual("remainingDays").get(function () {
  return Math.max(0, this.allocatedDays - this.usedDays);
});

module.exports = mongoose.model("LeaveAllocation", leaveAllocationSchema);
