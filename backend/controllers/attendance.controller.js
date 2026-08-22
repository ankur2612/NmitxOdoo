const Company = require("../models/Company");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Holiday = require("../models/Holiday");
const LeaveRequest = require("../models/LeaveRequest");
const { toDateKey, isDateKey, eachDateKey } = require("../utils/dateKey");
const {
  computeWorkHours,
  computeExtraHours,
  deriveStatus,
  isWeekend,
  monthRange,
  round2,
} = require("../utils/attendance");
const httpError = require("../utils/httpError");

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

async function loadSettings(companyId) {
  const company = await Company.findById(companyId).select("settings");

  if (!company) {
    throw httpError(404, "Company not found");
  }

  return company.settings;
}

async function checkIn(req, res) {
  const dateKey = toDateKey();
  const existing = await Attendance.findOne({ employee: req.user.id, dateKey });

  if (existing && existing.checkIn) {
    throw httpError(409, "You have already checked in today");
  }

  const record =
    existing ||
    new Attendance({ company: req.user.company, employee: req.user.id, dateKey });

  record.checkIn = new Date();
  record.checkOut = undefined;
  record.workHours = 0;
  record.extraHours = 0;
  record.status = "present";

  await record.save();

  res.status(201).json({ attendance: record });
}

async function checkOut(req, res) {
  const dateKey = toDateKey();
  const record = await Attendance.findOne({ employee: req.user.id, dateKey });

  if (!record || !record.checkIn) {
    throw httpError(409, "You have not checked in today");
  }

  if (record.checkOut) {
    throw httpError(409, "You have already checked out today");
  }

  const settings = await loadSettings(req.user.company);

  record.checkOut = new Date();
  record.workHours = computeWorkHours(record.checkIn, record.checkOut);
  record.extraHours = computeExtraHours(record.workHours, settings.standardHoursPerDay);
  record.status = deriveStatus(record.workHours, settings.halfDayThresholdHours);

  await record.save();

  res.json({ attendance: record });
}

async function todayAttendance(req, res) {
  const dateKey = toDateKey();
  const record = await Attendance.findOne({ employee: req.user.id, dateKey });

  res.json({
    date: dateKey,
    attendance: record,
    checkedIn: Boolean(record && record.checkIn && !record.checkOut),
    since: record && record.checkIn ? record.checkIn : null,
  });
}

async function myAttendance(req, res) {
  const month = String(req.query.month || toDateKey().slice(0, 7));

  if (!MONTH_PATTERN.test(month)) {
    throw httpError(400, "month must be in YYYY-MM format");
  }

  const employeeId = req.query.employee || req.user.id;

  if (String(employeeId) !== String(req.user.id) && req.user.role !== "admin") {
    throw httpError(403, "You can only view your own attendance");
  }

  const { start, end } = monthRange(month);
  const settings = await loadSettings(req.user.company);
  const today = toDateKey();

  const [records, holidays, leaves] = await Promise.all([
    Attendance.find({ employee: employeeId, dateKey: { $gte: start, $lte: end } }).lean(),
    Holiday.find({ company: req.user.company, date: { $gte: start, $lte: end } }).lean(),
    LeaveRequest.find({
      employee: employeeId,
      status: "approved",
      startDate: { $lte: end },
      endDate: { $gte: start },
    })
      .populate("leaveType", "name isPaid")
      .lean(),
  ]);

  const recordByDate = new Map(records.map((record) => [record.dateKey, record]));
  const holidayByDate = new Map(holidays.map((holiday) => [holiday.date, holiday.name]));

  const leaveByDate = new Map();

  for (const leave of leaves) {
    for (const key of eachDateKey(leave.startDate, leave.endDate)) {
      if (key >= start && key <= end) {
        leaveByDate.set(key, leave.leaveType);
      }
    }
  }

  const days = eachDateKey(start, end).map((dateKey) => {
    const record = recordByDate.get(dateKey);
    const holiday = holidayByDate.get(dateKey);
    const leave = leaveByDate.get(dateKey);

    let status;

    if (record) {
      status = record.status;
    } else if (leave) {
      status = "leave";
    } else if (holiday) {
      status = "holiday";
    } else if (isWeekend(dateKey, settings.workingDaysPerWeek)) {
      status = "weekend";
    } else if (dateKey > today) {
      status = "upcoming";
    } else {
      status = "absent";
    }

    return {
      dateKey,
      checkIn: (record && record.checkIn) || null,
      checkOut: (record && record.checkOut) || null,
      workHours: (record && record.workHours) || 0,
      extraHours: (record && record.extraHours) || 0,
      status,
      holiday: holiday || null,
      leaveType: leave ? leave.name : null,
    };
  });

  const summary = {
    daysPresent: days.filter((day) => day.status === "present").length,
    halfDays: days.filter((day) => day.status === "half-day").length,
    leavesCount: days.filter((day) => day.status === "leave").length,
    absentDays: days.filter((day) => day.status === "absent").length,
    holidays: days.filter((day) => day.status === "holiday").length,
    totalWorkingDays: days.filter(
      (day) => !["weekend", "holiday"].includes(day.status)
    ).length,
    totalWorkHours: round2(days.reduce((total, day) => total + day.workHours, 0)),
    totalExtraHours: round2(days.reduce((total, day) => total + day.extraHours, 0)),
  };

  res.json({ month, employee: employeeId, summary, days });
}

async function dayAttendance(req, res) {
  const dateKey = String(req.query.date || toDateKey());

  if (!isDateKey(dateKey)) {
    throw httpError(400, "date must be in YYYY-MM-DD format");
  }

  const employees = await Employee.find({ company: req.user.company, isActive: true })
    .select("firstName lastName avatarUrl loginId jobPosition")
    .sort({ firstName: 1, lastName: 1 })
    .lean();

  const employeeIds = employees.map((employee) => employee._id);

  const [records, leaves, holiday] = await Promise.all([
    Attendance.find({ dateKey, employee: { $in: employeeIds } }).lean(),
    LeaveRequest.find({
      status: "approved",
      employee: { $in: employeeIds },
      startDate: { $lte: dateKey },
      endDate: { $gte: dateKey },
    })
      .populate("leaveType", "name")
      .lean(),
    Holiday.findOne({ company: req.user.company, date: dateKey }).lean(),
  ]);

  const recordByEmployee = new Map(records.map((record) => [String(record.employee), record]));
  const leaveByEmployee = new Map(leaves.map((leave) => [String(leave.employee), leave]));

  const rows = employees.map((employee) => {
    const key = String(employee._id);
    const record = recordByEmployee.get(key);
    const leave = leaveByEmployee.get(key);

    let status = "absent";

    if (record) {
      status = record.status;
    } else if (leave) {
      status = "leave";
    } else if (holiday) {
      status = "holiday";
    }

    return {
      employee: {
        _id: employee._id,
        fullName: [employee.firstName, employee.lastName].filter(Boolean).join(" "),
        avatarUrl: employee.avatarUrl,
        loginId: employee.loginId,
        jobPosition: employee.jobPosition,
      },
      checkIn: (record && record.checkIn) || null,
      checkOut: (record && record.checkOut) || null,
      workHours: (record && record.workHours) || 0,
      extraHours: (record && record.extraHours) || 0,
      status,
      leaveType: leave ? leave.leaveType.name : null,
    };
  });

  res.json({
    date: dateKey,
    holiday: holiday ? holiday.name : null,
    summary: {
      present: rows.filter((row) => row.status === "present").length,
      halfDay: rows.filter((row) => row.status === "half-day").length,
      onLeave: rows.filter((row) => row.status === "leave").length,
      absent: rows.filter((row) => row.status === "absent").length,
      total: rows.length,
    },
    records: rows,
  });
}

module.exports = { checkIn, checkOut, todayAttendance, myAttendance, dayAttendance };
