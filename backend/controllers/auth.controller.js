const jwt = require("jsonwebtoken");
const Company = require("../models/Company");
const Employee = require("../models/Employee");
const { generateLoginId, companyCodeFrom } = require("../utils/loginId");
const { seedCompanyDefaults, ensureAllocations } = require("../seed/companyDefaults");
const httpError = require("../utils/httpError");

const PASSWORD_MIN_LENGTH = 8;

function signToken(employee) {
  return jwt.sign(
    {
      sub: employee._id.toString(),
      company: employee.company.toString(),
      role: employee.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function splitName(fullName) {
  const parts = String(fullName).trim().split(/\s+/);
  const firstName = parts.shift();

  return { firstName, lastName: parts.join(" ") };
}

async function registerCompany(req, res) {
  const { companyName, companyCode, name, email, phone, password, confirmPassword } = req.body;

  if (!companyName || !name || !email || !password) {
    throw httpError(400, "companyName, name, email and password are required");
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw httpError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw httpError(400, "Passwords do not match");
  }

  const workEmail = String(email).trim().toLowerCase();

  if (await Employee.exists({ workEmail })) {
    throw httpError(409, "An account with this email already exists");
  }

  const code = String(companyCode || companyCodeFrom(companyName)).toUpperCase();

  if (!/^[A-Z]{2}$/.test(code)) {
    throw httpError(400, "Company code must be exactly 2 letters");
  }

  if (await Company.exists({ code })) {
    throw httpError(409, `Company code ${code} is already taken, send a different companyCode`);
  }

  const company = await Company.create({ name: String(companyName).trim(), code });

  try {
    const { firstName, lastName } = splitName(name);
    const joiningDate = new Date();

    const admin = new Employee({
      company: company._id,
      loginId: await generateLoginId({
        companyId: company._id,
        companyCode: code,
        firstName,
        lastName,
        joiningDate,
      }),
      workEmail,
      role: "admin",
      mustChangePassword: false,
      firstName,
      lastName,
      mobile: phone || "",
      privateInfo: { dateOfJoining: joiningDate },
    });

    await admin.setPassword(password);
    await admin.save();

    await seedCompanyDefaults(company._id, joiningDate.getFullYear());
    await ensureAllocations(company._id, admin._id, joiningDate.getFullYear());

    res.status(201).json({ token: signToken(admin), company, user: admin });
  } catch (err) {
    await Company.deleteOne({ _id: company._id });
    throw err;
  }
}

async function login(req, res) {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw httpError(400, "identifier and password are required");
  }

  const value = String(identifier).trim();
  const employee = await Employee.findOne({
    $or: [{ loginId: value.toUpperCase() }, { workEmail: value.toLowerCase() }],
  }).select("+passwordHash");

  if (!employee || !(await employee.verifyPassword(password))) {
    throw httpError(401, "Invalid credentials");
  }

  if (!employee.isActive) {
    throw httpError(403, "This account has been deactivated");
  }

  res.json({
    token: signToken(employee),
    user: employee,
    mustChangePassword: employee.mustChangePassword,
  });
}

async function me(req, res) {
  const employee = await Employee.findById(req.user.id)
    .populate("company", "name code logoUrl settings")
    .populate("department", "name")
    .populate("manager", "firstName lastName avatarUrl");

  if (!employee) {
    throw httpError(404, "Account not found");
  }

  res.json({ user: employee });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw httpError(400, "currentPassword and newPassword are required");
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    throw httpError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    throw httpError(400, "Passwords do not match");
  }

  if (currentPassword === newPassword) {
    throw httpError(400, "New password must be different from the current password");
  }

  const employee = await Employee.findById(req.user.id).select("+passwordHash");

  if (!employee) {
    throw httpError(404, "Account not found");
  }

  if (!(await employee.verifyPassword(currentPassword))) {
    throw httpError(401, "Current password is incorrect");
  }

  await employee.setPassword(newPassword);
  employee.mustChangePassword = false;
  await employee.save();

  res.json({ message: "Password updated", user: employee });
}

module.exports = { registerCompany, login, me, changePassword };
