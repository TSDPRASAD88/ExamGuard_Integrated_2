const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  startSession,
  endSession,
} = require("../controllers/sessionController");

router.post("/start", protect, startSession);
router.post("/end", protect, endSession);

module.exports = router;