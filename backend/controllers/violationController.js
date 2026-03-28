const Violation = require("../models/Violation");
const Session = require("../models/Session");
const mongoose = require("mongoose");

// LOG VIOLATION
exports.logViolation = async (req, res) => {
  try {
    const { sessionId, type, severity } = req.body;

    // 1. Validate sessionId
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    // 2. Validate type
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Violation type required",
      });
    }

    // 3. Check session
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // 4. Check ownership
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // 5. Check if session active
    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Session is not active",
      });
    }

    // 6. Create violation
    const violation = await Violation.create({
      session: sessionId,
      type,
      severity: severity || 1,
    });

    // 🧠 7. UPDATE SESSION SCORE
    session.totalScore += violation.severity;

    // 🧠 8. FLAG IF THRESHOLD REACHED
    if (session.totalScore >= 10) {
      session.isFlagged = true;
    }

    await session.save();

    res.status(201).json({
      success: true,
      message: "Violation logged",
      violation,
      totalScore: session.totalScore,
      isFlagged: session.isFlagged,
    });

  } catch (error) {
    console.error("Violation Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};