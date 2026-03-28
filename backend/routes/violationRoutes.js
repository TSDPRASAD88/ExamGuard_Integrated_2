const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { logViolation } = require("../controllers/violationController");

router.post("/log", protect, logViolation);

module.exports = router;