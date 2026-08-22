require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employee.routes");
const companyRoutes = require("./routes/company.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const leaveRoutes = require("./routes/leave.routes");
const settingsRoutes = require("./routes/settings.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (req.body === undefined) {
    req.body = {};
  }

  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/departments", settingsRoutes.departments);
app.use("/api/leave-types", settingsRoutes.leaveTypes);
app.use("/api/allocations", settingsRoutes.allocations);
app.use("/api/holidays", settingsRoutes.holidays);

app.use((req, res) => {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
