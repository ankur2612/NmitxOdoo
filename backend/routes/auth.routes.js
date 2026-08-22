const express = require("express");
const { auth } = require("../middleware/auth");
const {
  registerCompany,
  login,
  me,
  changePassword,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register-company", registerCompany);
router.post("/login", login);
router.get("/me", auth, me);
router.post("/change-password", auth, changePassword);

module.exports = router;
