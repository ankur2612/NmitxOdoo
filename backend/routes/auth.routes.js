const express = require("express");
const { registerCompany, login } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register-company", registerCompany);
router.post("/login", login);

module.exports = router;
