const Department = require("../models/Department");
const Employee = require("../models/Employee");
const LeaveType = require("../models/LeaveType");
const LeaveAllocation = require("../models/LeaveAllocation");
const Holiday = require("../models/Holiday");
const { toDateKey, isDateKey } = require("../utils/dateKey");
const httpError = require("../utils/httpError");

async function listDepartments(req, res) {
  const departments = await Department.find({ company: req.user.company })
    .populate("manager", "firstName lastName avatarUrl")
    .sort({ name: 1 });

  res.json({ departments });
}

async function createDepartment(req, res) {
  const { name, manager } = req.body;

  if (!name) {
    throw httpError(400, "name is required");
  }

  if (manager && !(await Employee.exists({ _id: manager, company: req.user.company }))) {
    throw httpError(400, "manager does not belong to your company");
  }

  const department = await Department.create({
    company: req.user.company,
    name: String(name).trim(),
    manager: manager || undefined,
  });

  res.status(201).json({ department });
}

async function listLeaveTypes(req, res) {
  const leaveTypes = await LeaveType.find({ company: req.user.company }).sort({ createdAt: 1 });

  res.json({ leaveTypes });
}

async function createLeaveType(req, res) {
  const { name, isPaid, defaultDays, requiresAttachment, color } = req.body;

  if (!name) {
    throw httpError(400, "name is required");
  }

  const leaveType = await LeaveType.create({
    company: req.user.company,
    name: String(name).trim(),
    isPaid: isPaid === undefined ? true : Boolean(isPaid),
    defaultDays: Number(defaultDays) || 0,
    requiresAttachment: Boolean(requiresAttachment),
    color: color || undefined,
  });

  res.status(201).json({ leaveType });
}

async function updateLeaveType(req, res) {
  const leaveType = await LeaveType.findOne({
    _id: req.params.id,
    company: req.user.company,
  });

  if (!leaveType) {
    throw httpError(404, "Leave type not found");
  }

  for (const field of ["name", "isPaid", "defaultDays", "requiresAttachment", "color", "isActive"]) {
    if (req.body[field] !== undefined) {
      leaveType[field] = req.body[field];
    }
  }

  await leaveType.save();

  res.json({ leaveType });
}

async function listAllocations(req, res) {
  const year = Number(req.query.year) || Number(toDateKey().slice(0, 4));
  const filter = { company: req.user.company, year };

  if (req.query.employee) {
    filter.employee = req.query.employee;
  }

  const allocations = await LeaveAllocation.find(filter)
    .populate("employee", "firstName lastName avatarUrl loginId")
    .populate("leaveType", "name isPaid color")
    .sort({ createdAt: 1 });

  res.json({ year, count: allocations.length, allocations });
}

async function upsertAllocation(req, res) {
  const { employee, leaveType, year, allocatedDays } = req.body;

  if (!employee || !leaveType || allocatedDays === undefined) {
    throw httpError(400, "employee, leaveType and allocatedDays are required");
  }

  if (!(await Employee.exists({ _id: employee, company: req.user.company }))) {
    throw httpError(400, "employee does not belong to your company");
  }

  if (!(await LeaveType.exists({ _id: leaveType, company: req.user.company }))) {
    throw httpError(400, "leaveType does not belong to your company");
  }

  const targetYear = Number(year) || Number(toDateKey().slice(0, 4));
  const days = Number(allocatedDays);

  if (Number.isNaN(days) || days < 0) {
    throw httpError(400, "allocatedDays must be a positive number");
  }

  const existing = await LeaveAllocation.findOne({ employee, leaveType, year: targetYear });

  if (existing && existing.usedDays > days) {
    throw httpError(
      400,
      `${existing.usedDays} day(s) already used, allocation cannot be lower than that`
    );
  }

  const allocation =
    existing ||
    new LeaveAllocation({
      company: req.user.company,
      employee,
      leaveType,
      year: targetYear,
      usedDays: 0,
    });

  allocation.allocatedDays = days;
  await allocation.save();
  await allocation.populate("leaveType", "name isPaid color");

  res.json({ allocation });
}

async function listHolidays(req, res) {
  const year = Number(req.query.year) || Number(toDateKey().slice(0, 4));

  const holidays = await Holiday.find({
    company: req.user.company,
    date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
  }).sort({ date: 1 });

  res.json({ year, count: holidays.length, holidays });
}

async function createHoliday(req, res) {
  const { name, date } = req.body;

  if (!name || !date) {
    throw httpError(400, "name and date are required");
  }

  if (!isDateKey(date)) {
    throw httpError(400, "date must be in YYYY-MM-DD format");
  }

  const holiday = await Holiday.create({
    company: req.user.company,
    name: String(name).trim(),
    date,
  });

  res.status(201).json({ holiday });
}

async function deleteHoliday(req, res) {
  const holiday = await Holiday.findOneAndDelete({
    _id: req.params.id,
    company: req.user.company,
  });

  if (!holiday) {
    throw httpError(404, "Holiday not found");
  }

  res.json({ message: "Holiday removed" });
}

module.exports = {
  listDepartments,
  createDepartment,
  listLeaveTypes,
  createLeaveType,
  updateLeaveType,
  listAllocations,
  upsertAllocation,
  listHolidays,
  createHoliday,
  deleteHoliday,
};
