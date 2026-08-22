const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    workingDaysPerWeek: { type: Number, default: 5 },
    standardHoursPerDay: { type: Number, default: 8 },
    breakHours: { type: Number, default: 1 },
    halfDayThresholdHours: { type: Number, default: 4 },
    pfPercent: { type: Number, default: 12 },
    professionalTax: { type: Number, default: 200 },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 2,
    },
    logoUrl: { type: String, default: "" },
    address: { type: String, default: "" },
    settings: { type: settingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
