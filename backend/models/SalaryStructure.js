const mongoose = require("mongoose");

const COMPUTATION_TYPES = ["percentOfWage", "percentOfBasic", "fixed", "balance"];

const componentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    computationType: { type: String, enum: COMPUTATION_TYPES, required: true },
    value: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const pfSchema = new mongoose.Schema(
  {
    employeePercent: { type: Number, default: 12, min: 0 },
    employerPercent: { type: Number, default: 12, min: 0 },
    employeeAmount: { type: Number, default: 0, min: 0 },
    employerAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const salaryStructureSchema = new mongoose.Schema(
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
      unique: true,
    },
    wageType: { type: String, enum: ["fixed"], default: "fixed" },
    monthlyWage: { type: Number, required: true, min: 0 },
    yearlyWage: { type: Number, default: 0, min: 0 },
    workingDaysPerWeek: { type: Number, default: 5, min: 1, max: 7 },
    breakHours: { type: Number, default: 1, min: 0 },
    components: { type: [componentSchema], default: [] },
    pf: { type: pfSchema, default: () => ({}) },
    professionalTax: { type: Number, default: 200, min: 0 },
    effectiveFrom: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

salaryStructureSchema.virtual("componentTotal").get(function () {
  return this.components.reduce((total, component) => total + component.amount, 0);
});

salaryStructureSchema.path("components").validate(function (components) {
  const total = components.reduce((sum, component) => sum + component.amount, 0);

  return total <= this.monthlyWage + 0.01;
}, "Salary components cannot exceed the monthly wage");

module.exports = mongoose.model("SalaryStructure", salaryStructureSchema);
module.exports.COMPUTATION_TYPES = COMPUTATION_TYPES;
