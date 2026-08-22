const Company = require("../models/Company");
const Holiday = require("../models/Holiday");
const LeaveType = require("../models/LeaveType");
const LeaveAllocation = require("../models/LeaveAllocation");
const LeaveRequest = require("../models/LeaveRequest");
const { toDateKey, isDateKey, eachDateKey } = require("../utils/dateKey");
const { isWeekend } = require("../utils/attendance");
const { uploadBuffer, isCloudinaryConfigured } = require("../config/cloudinary");
const { ensureAllocations } = require("../seed/companyDefaults");
const httpError = require("../utils/httpError");

const OPEN_STATUSES = ["pending", "approved"];

function yearOf(dateKey) {
  return Number(dateKey.slice(0, 4));
}

async function countLeaveDays(companyId, startDate, endDate, workingDaysPerWeek) {
  const holidays = await Holiday.find({
    company: companyId,
    date: { $gte: startDate, $lte: endDate },
  })
    .select("date")
    .lean();

  const holidayKeys = new Set(holidays.map((holiday) => holiday.date));

  return eachDateKey(startDate, endDate).filter(
    (key) => !isWeekend(key, workingDaysPerWeek) && !holidayKeys.has(key)
  ).length;
}

async function applyLeave(req, res) {
  const { leaveType, startDate, endDate, remarks, halfDay } = req.body;

  if (!leaveType || !startDate || !endDate) {
    throw httpError(400, "leaveType, startDate and endDate are required");
  }

  if (!isDateKey(startDate) || !isDateKey(endDate)) {
    throw httpError(400, "startDate and endDate must be in YYYY-MM-DD format");
  }

  if (endDate < startDate) {
    throw httpError(400, "endDate cannot be before startDate");
  }

  const type = await LeaveType.findOne({ _id: leaveType, company: req.user.company });

  if (!type) {
    throw httpError(404, "Leave type not found");
  }

  const overlapping = await LeaveRequest.findOne({
    employee: req.user.id,
    status: { $in: OPEN_STATUSES },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });

  if (overlapping) {
    throw httpError(
      409,
      `You already have a ${overlapping.status} request from ${overlapping.startDate} to ${overlapping.endDate}`
    );
  }

  const company = await Company.findById(req.user.company).select("settings");
  const isHalfDay = Boolean(halfDay) && startDate === endDate;
  const workingDays = await countLeaveDays(
    req.user.company,
    startDate,
    endDate,
    company.settings.workingDaysPerWeek
  );

  if (workingDays === 0) {
    throw httpError(400, "That range has no working days, it is all weekend or holiday");
  }

  const days = isHalfDay ? 0.5 : workingDays;

  let attachmentUrl = "";

  if (req.file) {
    if (!isCloudinaryConfigured()) {
      throw httpError(503, "Cloudinary is not configured, set CLOUDINARY_* in .env");
    }

    const result = await uploadBuffer(req.file.buffer, {
      folder: `dayflow/${req.user.company}/leave-attachments`,
      resource_type: "auto",
    });

    attachmentUrl = result.secure_url;
  }

  if (type.requiresAttachment && !attachmentUrl) {
    throw httpError(400, `${type.name} requires a supporting document`);
  }

  const year = yearOf(startDate);

  if (type.isPaid) {
    await ensureAllocations(req.user.company, req.user.id, year);

    const allocation = await LeaveAllocation.findOne({
      employee: req.user.id,
      leaveType: type._id,
      year,
    });

    const remaining = allocation ? allocation.allocatedDays - allocation.usedDays : 0;

    if (days > remaining) {
      throw httpError(400, `Not enough balance, ${remaining} day(s) of ${type.name} left`);
    }
  }

  const request = await LeaveRequest.create({
    company: req.user.company,
    employee: req.user.id,
    leaveType: type._id,
    startDate,
    endDate,
    days,
    remarks: remarks || "",
    attachmentUrl,
  });

  await request.populate("leaveType", "name isPaid color");

  res.status(201).json({ leave: request });
}

async function myLeaves(req, res) {
  const year = Number(req.query.year) || yearOf(toDateKey());
  const filter = {
    employee: req.user.id,
    startDate: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
  };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const leaves = await LeaveRequest.find(filter)
    .populate("leaveType", "name isPaid color")
    .populate("reviewedBy", "firstName lastName")
    .sort({ startDate: -1 });

  res.json({ year, count: leaves.length, leaves });
}

async function listLeaves(req, res) {
  const year = Number(req.query.year) || yearOf(toDateKey());
  const filter = {
    company: req.user.company,
    startDate: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
  };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.employee) {
    filter.employee = req.query.employee;
  }

  const leaves = await LeaveRequest.find(filter)
    .populate("leaveType", "name isPaid color")
    .populate("employee", "firstName lastName avatarUrl loginId jobPosition")
    .populate("reviewedBy", "firstName lastName")
    .sort({ status: 1, startDate: -1 });

  res.json({ year, count: leaves.length, leaves });
}

async function reviewLeave(req, res, decision) {
  const request = await LeaveRequest.findOne({
    _id: req.params.id,
    company: req.user.company,
  }).populate("leaveType", "name isPaid");

  if (!request) {
    throw httpError(404, "Leave request not found");
  }

  if (request.status === decision) {
    throw httpError(409, `This request is already ${decision}`);
  }

  const wasApproved = request.status === "approved";
  const previousStatus = request.status;
  const year = yearOf(request.startDate);

  let allocation = null;
  let usedDaysDelta = 0;

  if (request.leaveType.isPaid) {
    allocation = await LeaveAllocation.findOne({
      employee: request.employee,
      leaveType: request.leaveType._id,
      year,
    });

    if (allocation) {
      if (decision === "approved" && !wasApproved) {
        const remaining = allocation.allocatedDays - allocation.usedDays;

        if (request.days > remaining) {
          throw httpError(
            400,
            `Not enough balance, ${remaining} day(s) of ${request.leaveType.name} left`
          );
        }

        usedDaysDelta = request.days;
      } else if (decision === "rejected" && wasApproved) {
        usedDaysDelta = -request.days;
      }
    }
  }

  request.status = decision;
  request.reviewedBy = req.user.id;
  request.reviewComment = req.body.comment || "";
  request.reviewedAt = new Date();

  await request.save();

  if (allocation && usedDaysDelta !== 0) {
    try {
      allocation.usedDays = Math.max(0, allocation.usedDays + usedDaysDelta);
      await allocation.save();
    } catch (err) {
      request.status = previousStatus;
      await request.save();
      throw err;
    }
  }

  await request.populate("employee", "firstName lastName loginId");

  res.json({ leave: request });
}

async function approveLeave(req, res) {
  return reviewLeave(req, res, "approved");
}

async function rejectLeave(req, res) {
  return reviewLeave(req, res, "rejected");
}

async function cancelLeave(req, res) {
  const request = await LeaveRequest.findOne({
    _id: req.params.id,
    company: req.user.company,
  });

  if (!request) {
    throw httpError(404, "Leave request not found");
  }

  const isOwner = String(request.employee) === String(req.user.id);

  if (!isOwner && req.user.role !== "admin") {
    throw httpError(403, "You can only cancel your own requests");
  }

  if (request.status !== "pending") {
    throw httpError(409, `Only pending requests can be cancelled, this one is ${request.status}`);
  }

  await request.deleteOne();

  res.json({ message: "Leave request cancelled" });
}

async function myBalance(req, res) {
  const year = Number(req.query.year) || yearOf(toDateKey());
  const employeeId = req.query.employee || req.user.id;

  if (String(employeeId) !== String(req.user.id) && req.user.role !== "admin") {
    throw httpError(403, "You can only view your own balance");
  }

  await ensureAllocations(req.user.company, employeeId, year);

  const allocations = await LeaveAllocation.find({ employee: employeeId, year })
    .populate("leaveType", "name isPaid color requiresAttachment")
    .sort({ createdAt: 1 });

  const pending = await LeaveRequest.aggregate([
    {
      $match: {
        employee: allocations.length ? allocations[0].employee : null,
        status: "pending",
        startDate: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
      },
    },
    { $group: { _id: "$leaveType", days: { $sum: "$days" } } },
  ]);

  const pendingByType = new Map(pending.map((entry) => [String(entry._id), entry.days]));

  res.json({
    year,
    balances: allocations.map((allocation) => ({
      leaveType: allocation.leaveType,
      allocatedDays: allocation.allocatedDays,
      usedDays: allocation.usedDays,
      pendingDays: pendingByType.get(String(allocation.leaveType._id)) || 0,
      remainingDays: allocation.remainingDays,
    })),
  });
}

module.exports = {
  applyLeave,
  myLeaves,
  listLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  myBalance,
};
