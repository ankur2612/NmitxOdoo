const LeaveType = require("../models/LeaveType");
const LeaveAllocation = require("../models/LeaveAllocation");
const Holiday = require("../models/Holiday");

const DEFAULT_LEAVE_TYPES = [
  {
    name: "Paid Time Off",
    isPaid: true,
    defaultDays: 24,
    requiresAttachment: false,
    color: "#7c5cff",
  },
  {
    name: "Sick Leave",
    isPaid: true,
    defaultDays: 7,
    requiresAttachment: true,
    color: "#f2b53c",
  },
  {
    name: "Unpaid Leave",
    isPaid: false,
    defaultDays: 0,
    requiresAttachment: false,
    color: "#8a8f98",
  },
];

const DEFAULT_HOLIDAYS = [
  { name: "Pongal", month: 1, day: 14 },
  { name: "Republic Day", month: 1, day: 26 },
  { name: "Dhuleti", month: 3, day: 4 },
  { name: "Independence Day", month: 8, day: 15 },
  { name: "Rakhi", month: 8, day: 28 },
  { name: "Gandhi Jayanti", month: 10, day: 2 },
  { name: "Diwali", month: 11, day: 8 },
  { name: "New Year", month: 11, day: 10 },
  { name: "Bhai Duj", month: 11, day: 11 },
];

function pad(value) {
  return String(value).padStart(2, "0");
}

async function seedLeaveTypes(companyId) {
  const existing = await LeaveType.countDocuments({ company: companyId });

  if (existing > 0) {
    return LeaveType.find({ company: companyId });
  }

  return LeaveType.insertMany(
    DEFAULT_LEAVE_TYPES.map((type) => ({ ...type, company: companyId }))
  );
}

async function seedHolidays(companyId, year) {
  const documents = DEFAULT_HOLIDAYS.map((holiday) => ({
    company: companyId,
    name: holiday.name,
    date: `${year}-${pad(holiday.month)}-${pad(holiday.day)}`,
  }));

  await Holiday.bulkWrite(
    documents.map((document) => ({
      updateOne: {
        filter: { company: companyId, date: document.date },
        update: { $setOnInsert: document },
        upsert: true,
      },
    }))
  );
}

async function ensureAllocations(companyId, employeeId, year) {
  const leaveTypes = await LeaveType.find({ company: companyId, isActive: true });

  if (leaveTypes.length === 0) {
    return [];
  }

  await LeaveAllocation.bulkWrite(
    leaveTypes.map((leaveType) => ({
      updateOne: {
        filter: { employee: employeeId, leaveType: leaveType._id, year },
        update: {
          $setOnInsert: {
            company: companyId,
            employee: employeeId,
            leaveType: leaveType._id,
            year,
            allocatedDays: leaveType.defaultDays,
            usedDays: 0,
          },
        },
        upsert: true,
      },
    }))
  );

  return LeaveAllocation.find({ employee: employeeId, year }).populate("leaveType");
}

async function seedCompanyDefaults(companyId, year) {
  await seedLeaveTypes(companyId);
  await seedHolidays(companyId, year);
}

module.exports = {
  seedCompanyDefaults,
  seedLeaveTypes,
  seedHolidays,
  ensureAllocations,
  DEFAULT_LEAVE_TYPES,
  DEFAULT_HOLIDAYS,
};
