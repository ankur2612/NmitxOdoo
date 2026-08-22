require("dotenv").config({ quiet: true });

const connectDB = require("../config/db");
const Company = require("../models/Company");
const Employee = require("../models/Employee");
const Department = require("../models/Department");
const SalaryStructure = require("../models/SalaryStructure");
const Attendance = require("../models/Attendance");
const LeaveType = require("../models/LeaveType");
const LeaveAllocation = require("../models/LeaveAllocation");
const LeaveRequest = require("../models/LeaveRequest");
const Holiday = require("../models/Holiday");
const Counter = require("../models/Counter");

const { generateLoginId } = require("../utils/loginId");
const { computeSalary, DEFAULT_COMPONENTS } = require("../utils/salaryEngine");
const { toDateKey } = require("../utils/dateKey");
const { seedCompanyDefaults, ensureAllocations } = require("./companyDefaults");

const CODE = "DF";
const PASSWORD = "Dayflow123";

const PEOPLE = [
  {
    firstName: "Asha",
    lastName: "Menon",
    workEmail: "asha@dayflow.app",
    role: "admin",
    jobPosition: "HR Director",
    mobile: "9876543210",
    location: "Bengaluru",
  },
  {
    firstName: "Ravi",
    lastName: "Kumar",
    workEmail: "ravi@dayflow.app",
    role: "employee",
    jobPosition: "Backend Developer",
    mobile: "9812345678",
    location: "Bengaluru",
    wage: 50000,
  },
  {
    firstName: "Priya",
    lastName: "Nair",
    workEmail: "priya@dayflow.app",
    role: "employee",
    jobPosition: "Product Designer",
    mobile: "9845001122",
    location: "Kochi",
    wage: 62000,
  },
  {
    firstName: "Imran",
    lastName: "Sheikh",
    workEmail: "imran@dayflow.app",
    role: "employee",
    jobPosition: "QA Engineer",
    mobile: "9900112233",
    location: "Pune",
    wage: 44000,
  },
];

async function wipeExisting() {
  const existing = await Company.find({ code: CODE }).select("_id").lean();

  if (existing.length === 0) {
    return 0;
  }

  const ids = existing.map((company) => company._id);
  const models = [
    Employee,
    Department,
    SalaryStructure,
    Attendance,
    LeaveType,
    LeaveAllocation,
    LeaveRequest,
    Holiday,
  ];

  let removed = 0;

  for (const model of models) {
    const result = await model.deleteMany({ company: { $in: ids } });
    removed += result.deletedCount;
  }

  await Counter.deleteMany({ _id: { $regex: `^(${ids.join("|")})` } });
  await Company.deleteMany({ _id: { $in: ids } });

  return removed;
}

async function run() {
  await connectDB();

  const removed = await wipeExisting();

  if (removed) {
    console.log(`cleared ${removed} documents from the previous demo company`);
  }

  const company = await Company.create({ name: "Dayflow", code: CODE });
  const year = new Date().getFullYear();

  await seedCompanyDefaults(company._id, year);

  const engineering = await Department.create({
    company: company._id,
    name: "Engineering",
  });
  const design = await Department.create({ company: company._id, name: "Design" });

  const joiningDate = new Date(`${year}-01-06T09:00:00+05:30`);
  const created = [];

  for (const person of PEOPLE) {
    const employee = new Employee({
      company: company._id,
      loginId: await generateLoginId({
        companyId: company._id,
        companyCode: CODE,
        firstName: person.firstName,
        lastName: person.lastName,
        joiningDate,
      }),
      workEmail: person.workEmail,
      role: person.role,
      mustChangePassword: false,
      firstName: person.firstName,
      lastName: person.lastName,
      jobPosition: person.jobPosition,
      mobile: person.mobile,
      location: person.location,
      department: person.jobPosition.includes("Designer") ? design._id : engineering._id,
      privateInfo: { dateOfJoining: joiningDate },
    });

    await employee.setPassword(PASSWORD);
    await employee.save();
    await ensureAllocations(company._id, employee._id, year);

    if (person.wage) {
      const computed = computeSalary(person.wage, DEFAULT_COMPONENTS, {
        pfPercent: company.settings.pfPercent,
        professionalTax: company.settings.professionalTax,
      });

      await SalaryStructure.create({
        company: company._id,
        employee: employee._id,
        monthlyWage: computed.monthlyWage,
        yearlyWage: computed.yearlyWage,
        components: computed.components,
        pf: computed.pf,
        professionalTax: computed.professionalTax,
        workingDaysPerWeek: company.settings.workingDaysPerWeek,
        breakHours: company.settings.breakHours,
      });
    }

    created.push(employee);
  }

  const [, ravi, priya, imran] = created;
  const today = toDateKey();

  await Attendance.create({
    company: company._id,
    employee: ravi._id,
    dateKey: today,
    checkIn: new Date(`${today}T09:42:00+05:30`),
    status: "present",
  });

  const paidTimeOff = await LeaveType.findOne({
    company: company._id,
    name: "Paid Time Off",
  });
  const sickLeave = await LeaveType.findOne({ company: company._id, name: "Sick Leave" });

  await LeaveRequest.create({
    company: company._id,
    employee: priya._id,
    leaveType: paidTimeOff._id,
    startDate: today,
    endDate: today,
    days: 1,
    remarks: "Family function",
    status: "approved",
  });

  await LeaveAllocation.updateOne(
    { employee: priya._id, leaveType: paidTimeOff._id, year },
    { $inc: { usedDays: 1 } }
  );

  await LeaveRequest.create({
    company: company._id,
    employee: imran._id,
    leaveType: sickLeave._id,
    startDate: `${year}-09-14`,
    endDate: `${year}-09-15`,
    days: 2,
    remarks: "Dental surgery",
    attachmentUrl: "",
    status: "pending",
  });

  console.log("");
  console.log(`company   Dayflow (${CODE})`);
  console.log(`password  ${PASSWORD}   (same for everyone)`);
  console.log("");
  console.log("  role      login id           work email");
  console.log("  " + "-".repeat(56));

  for (const employee of created) {
    console.log(
      `  ${employee.role.padEnd(9)} ${employee.loginId.padEnd(18)} ${employee.workEmail}`
    );
  }

  console.log("");
  console.log(`today (${today}): Ravi checked in, Priya on approved leave, Imran absent`);
  console.log("1 pending sick leave waiting in the admin approval queue");
  console.log("");

  process.exit(0);
}

run().catch((err) => {
  console.error("demo seed failed:", err.message);
  process.exit(1);
});
