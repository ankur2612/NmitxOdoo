const express = require("express");
const { auth, requireAdmin } = require("../middleware/auth");
const {
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
} = require("../controllers/settings.controller");

const departments = express.Router();
departments.use(auth);
departments.get("/", listDepartments);
departments.post("/", requireAdmin, createDepartment);

const leaveTypes = express.Router();
leaveTypes.use(auth);
leaveTypes.get("/", listLeaveTypes);
leaveTypes.post("/", requireAdmin, createLeaveType);
leaveTypes.patch("/:id", requireAdmin, updateLeaveType);

const allocations = express.Router();
allocations.use(auth);
allocations.get("/", requireAdmin, listAllocations);
allocations.post("/", requireAdmin, upsertAllocation);

const holidays = express.Router();
holidays.use(auth);
holidays.get("/", listHolidays);
holidays.post("/", requireAdmin, createHoliday);
holidays.delete("/:id", requireAdmin, deleteHoliday);

module.exports = { departments, leaveTypes, allocations, holidays };
