const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const resumeSchema = new mongoose.Schema(
  {
    about: { type: String, default: "" },
    loveAboutJob: { type: String, default: "" },
    interests: { type: String, default: "" },
    skills: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
  },
  { _id: false }
);

const bankSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, default: "" },
    bankName: { type: String, default: "" },
    ifsc: { type: String, default: "" },
  },
  { _id: false }
);

const privateInfoSchema = new mongoose.Schema(
  {
    dob: Date,
    address: { type: String, default: "" },
    nationality: { type: String, default: "" },
    personalEmail: { type: String, default: "", lowercase: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    maritalStatus: { type: String, enum: ["single", "married", "divorced", "widowed"] },
    dateOfJoining: Date,
    bank: { type: bankSchema, default: () => ({}) },
    panNo: { type: String, default: "", uppercase: true, trim: true },
    uanNo: { type: String, default: "", trim: true },
    empCode: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    loginId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    workEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    mustChangePassword: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: "", trim: true },
    avatarUrl: { type: String, default: "" },
    jobPosition: { type: String, default: "" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    location: { type: String, default: "" },
    mobile: { type: String, default: "" },

    resume: { type: resumeSchema, default: () => ({}) },
    privateInfo: { type: privateInfoSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

employeeSchema.virtual("fullName").get(function () {
  return [this.firstName, this.lastName].filter(Boolean).join(" ");
});

employeeSchema.methods.setPassword = async function (plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, 10);
};

employeeSchema.methods.verifyPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

module.exports = mongoose.model("Employee", employeeSchema);
