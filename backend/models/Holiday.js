const mongoose = require("mongoose");
const { DATE_KEY_PATTERN } = require("../utils/dateKey");

const holidaySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    date: {
      type: String,
      required: true,
      match: [DATE_KEY_PATTERN, "date must be in YYYY-MM-DD format"],
    },
  },
  { timestamps: true }
);

holidaySchema.index({ company: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Holiday", holidaySchema);
