const Company = require("../models/Company");
const Employee = require("../models/Employee");
const SalaryStructure = require("../models/SalaryStructure");
const { computeSalary, DEFAULT_COMPONENTS } = require("../utils/salaryEngine");
const httpError = require("../utils/httpError");

async function loadEmployee(req) {
  const employee = await Employee.findOne({
    _id: req.params.id,
    company: req.user.company,
  }).select("firstName lastName loginId jobPosition");

  if (!employee) {
    throw httpError(404, "Employee not found");
  }

  return employee;
}

async function getSalary(req, res) {
  const employee = await loadEmployee(req);
  const structure = await SalaryStructure.findOne({ employee: employee._id });

  res.json({
    employee,
    salary: structure,
    defaultComponents: structure ? undefined : DEFAULT_COMPONENTS,
  });
}

async function upsertSalary(req, res) {
  const employee = await loadEmployee(req);
  const { monthlyWage, components, workingDaysPerWeek, breakHours } = req.body;

  if (monthlyWage === undefined) {
    throw httpError(400, "monthlyWage is required");
  }

  const wage = Number(monthlyWage);

  if (Number.isNaN(wage) || wage < 0) {
    throw httpError(400, "monthlyWage must be a positive number");
  }

  const company = await Company.findById(req.user.company).select("settings");
  const template =
    Array.isArray(components) && components.length ? components : DEFAULT_COMPONENTS;

  const computed = computeSalary(wage, template, {
    pfPercent: company.settings.pfPercent,
    professionalTax: company.settings.professionalTax,
  });

  if (computed.componentTotal > computed.monthlyWage + 0.01) {
    throw httpError(
      400,
      `Components total ${computed.componentTotal} which exceeds the monthly wage ${computed.monthlyWage}`
    );
  }

  const structure =
    (await SalaryStructure.findOne({ employee: employee._id })) ||
    new SalaryStructure({ employee: employee._id, effectiveFrom: new Date() });

  structure.company = req.user.company;
  structure.monthlyWage = computed.monthlyWage;
  structure.yearlyWage = computed.yearlyWage;
  structure.components = computed.components;
  structure.pf = computed.pf;
  structure.professionalTax = computed.professionalTax;
  structure.workingDaysPerWeek =
    workingDaysPerWeek === undefined
      ? company.settings.workingDaysPerWeek
      : Number(workingDaysPerWeek);
  structure.breakHours =
    breakHours === undefined ? company.settings.breakHours : Number(breakHours);

  await structure.save();

  res.json({
    employee,
    salary: structure,
    breakdown: {
      basic: computed.basic,
      grossMonthly: computed.grossMonthly,
      netMonthly: computed.netMonthly,
    },
  });
}

async function previewSalary(req, res) {
  const wage = Number(req.query.wage);

  if (Number.isNaN(wage) || wage < 0) {
    throw httpError(400, "wage must be a positive number");
  }

  const company = await Company.findById(req.user.company).select("settings");

  res.json({
    preview: computeSalary(wage, DEFAULT_COMPONENTS, {
      pfPercent: company.settings.pfPercent,
      professionalTax: company.settings.professionalTax,
    }),
  });
}

module.exports = { getSalary, upsertSalary, previewSalary };
