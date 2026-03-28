const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Student + Teacher
router.get("/profile", protect, (req, res) => {
  res.json({
    success: true,
    message: "Protected route accessed",
    user: req.user,
  });
});

// Teacher only
router.get("/teacher", protect, authorizeRoles("teacher"), (req, res) => {
  res.json({
    success: true,
    message: "Welcome Teacher 👨‍🏫",
  });
});

module.exports = router;