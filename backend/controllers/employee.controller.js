const Company = require("../models/Company");
const Department = require("../models/Department");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const { generateLoginId } = require("../utils/loginId");
const { generateTempPassword } = require("../utils/password");
const { toDateKey } = require("../utils/dateKey");
const { ensureAllocations } = require("../seed/companyDefaults");
const { uploadBuffer, isCloudinaryConfigured } = require("../config/cloudinary");
const httpError = require("../utils/httpError");

const SELF_EDITABLE = [
  "mobile",
  "avatarUrl",
  "resume.about",
  "resume.loveAboutJob",
  "resume.interests",
  "resume.skills",
  "resume.certifications",
  "privateInfo.dob",
  "privateInfo.address",
  "privateInfo.nationality",
  "privateInfo.personalEmail",
  "privateInfo.gender",
  "privateInfo.maritalStatus",
  "privateInfo.bank.accountNumber",
  "privateInfo.bank.bankName",
  "privateInfo.bank.ifsc",
  "privateInfo.panNo",
  "privateInfo.uanNo",
];

const ADMIN_EDITABLE = [
  ...SELF_EDITABLE,
  "firstName",
  "lastName",
  "workEmail",
  "jobPosition",
  "department",
  "manager",
  "location",
  "role",
  "isActive",
  "privateInfo.dateOfJoining",
  "privateInfo.empCode",
];

const IGNORED_ON_UPDATE = [
  "_id",
  "id",
  "__v",
  "company",
  "loginId",
  "fullName",
  "createdAt",
  "updatedAt",
];

const CARD_FIELDS =
  "firstName lastName avatarUrl jobPosition loginId workEmail role isActive department";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function flattenPaths(value, prefix = "", out = {}) {
  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const isPlainObject =
      entry && typeof entry === "object" && !Array.isArray(entry) && !(entry instanceof Date);

    if (isPlainObject) {
      flattenPaths(entry, path, out);
    } else {
      out[path] = entry;
    }
  }

  return out;
}

async function listEmployees(req, res) {
  const filter = { company: req.user.company };
  const search = String(req.query.q || "").trim();

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { firstName: pattern },
      { lastName: pattern },
      { loginId: pattern },
      { workEmail: pattern },
      { jobPosition: pattern },
    ];
  }

  const employees = await Employee.find(filter)
    .select(CARD_FIELDS)
    .populate("department", "name")
    .sort({ firstName: 1, lastName: 1 })
    .lean();

  const today = toDateKey();
  const employeeIds = employees.map((employee) => employee._id);

  const [attendanceToday, leavesToday] = await Promise.all([
    Attendance.find({
      company: req.user.company,
      dateKey: today,
      employee: { $in: employeeIds },
    }).lean(),
    LeaveRequest.find({
      company: req.user.company,
      status: "approved",
      employee: { $in: employeeIds },
      startDate: { $lte: today },
      endDate: { $gte: today },
    })
      .select("employee")
      .lean(),
  ]);

  const attendanceByEmployee = new Map(
    attendanceToday.map((record) => [String(record.employee), record])
  );
  const onLeave = new Set(leavesToday.map((leave) => String(leave.employee)));

  const cards = employees.map((employee) => {
    const key = String(employee._id);
    const record = attendanceByEmployee.get(key);

    let todayStatus = "absent";

    if (onLeave.has(key)) {
      todayStatus = "leave";
    } else if (record && record.checkIn) {
      todayStatus = "present";
    }

    return {
      ...employee,
      fullName: [employee.firstName, employee.lastName].filter(Boolean).join(" "),
      todayStatus,
      checkedIn: Boolean(record && record.checkIn && !record.checkOut),
      checkIn: (record && record.checkIn) || null,
      checkOut: (record && record.checkOut) || null,
    };
  });

  res.json({ date: today, count: cards.length, employees: cards });
}

async function getEmployee(req, res) {
  const employee = await Employee.findOne({
    _id: req.params.id,
    company: req.user.company,
  })
    .populate("department", "name")
    .populate("manager", "firstName lastName avatarUrl jobPosition");

  if (!employee) {
    throw httpError(404, "Employee not found");
  }

  res.json({ employee });
}

async function createEmployee(req, res) {
  const {
    firstName,
    lastName,
    workEmail,
    jobPosition,
    department,
    manager,
    location,
    mobile,
    role,
    dateOfJoining,
  } = req.body;

  if (!firstName || !workEmail) {
    throw httpError(400, "firstName and workEmail are required");
  }

  const company = await Company.findById(req.user.company);

  if (!company) {
    throw httpError(404, "Company not found");
  }

  const email = String(workEmail).trim().toLowerCase();

  if (await Employee.exists({ workEmail: email })) {
    throw httpError(409, "An account with this email already exists");
  }

  if (department && !(await Department.exists({ _id: department, company: company._id }))) {
    throw httpError(400, "department does not belong to your company");
  }

  if (manager && !(await Employee.exists({ _id: manager, company: company._id }))) {
    throw httpError(400, "manager does not belong to your company");
  }

  const joiningDate = dateOfJoining ? new Date(dateOfJoining) : new Date();

  if (Number.isNaN(joiningDate.getTime())) {
    throw httpError(400, "dateOfJoining is not a valid date");
  }

  const tempPassword = generateTempPassword();

  const employee = new Employee({
    company: company._id,
    loginId: await generateLoginId({
      companyId: company._id,
      companyCode: company.code,
      firstName,
      lastName,
      joiningDate,
    }),
    workEmail: email,
    role: role === "admin" ? "admin" : "employee",
    mustChangePassword: true,
    firstName,
    lastName: lastName || "",
    jobPosition: jobPosition || "",
    department: department || undefined,
    manager: manager || undefined,
    location: location || "",
    mobile: mobile || "",
    privateInfo: { dateOfJoining: joiningDate },
  });

  await employee.setPassword(tempPassword);
  await employee.save();

  await ensureAllocations(company._id, employee._id, new Date().getFullYear());

  res.status(201).json({
    employee,
    credentials: { loginId: employee.loginId, tempPassword },
  });
}

async function updateEmployee(req, res) {
  const isSelf = String(req.params.id) === String(req.user.id);
  const isAdmin = req.user.role === "admin";

  if (!isSelf && !isAdmin) {
    throw httpError(403, "You can only edit your own profile");
  }

  const employee = await Employee.findOne({
    _id: req.params.id,
    company: req.user.company,
  });

  if (!employee) {
    throw httpError(404, "Employee not found");
  }

  const updates = flattenPaths(req.body);
  const allowed = isAdmin ? ADMIN_EDITABLE : SELF_EDITABLE;
  const rejected = Object.keys(updates).filter(
    (path) => !allowed.includes(path) && !IGNORED_ON_UPDATE.includes(path)
  );

  if (rejected.length) {
    throw httpError(403, `You are not allowed to edit: ${rejected.join(", ")}`);
  }

  for (const path of Object.keys(updates)) {
    if (allowed.includes(path)) {
      employee.set(path, updates[path]);
    }
  }

  await employee.save();

  res.json({ employee });
}

async function uploadAvatar(req, res) {
  const isSelf = String(req.params.id) === String(req.user.id);

  if (!isSelf && req.user.role !== "admin") {
    throw httpError(403, "You can only change your own profile picture");
  }

  if (!req.file) {
    throw httpError(400, "No image uploaded, send it as the form field 'avatar'");
  }

  if (!isCloudinaryConfigured()) {
    throw httpError(503, "Cloudinary is not configured, set CLOUDINARY_* in .env");
  }

  const employee = await Employee.findOne({
    _id: req.params.id,
    company: req.user.company,
  });

  if (!employee) {
    throw httpError(404, "Employee not found");
  }

  const result = await uploadBuffer(req.file.buffer, {
    public_id: `dayflow/${employee.company}/avatars/${employee._id}`,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
    transformation: [{ width: 512, height: 512, crop: "fill", gravity: "face" }],
  });

  employee.avatarUrl = result.secure_url;
  await employee.save();

  res.json({ employee, avatarUrl: employee.avatarUrl });
}

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, uploadAvatar };
