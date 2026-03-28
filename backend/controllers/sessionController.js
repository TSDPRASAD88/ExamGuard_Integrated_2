const Session = require("../models/Session");
const mongoose = require("mongoose");

// START SESSION
exports.startSession = async (req, res) => {
  try {
    const { examId } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID required",
      });
    }

    const session = await Session.create({
      user: req.user.id,
      examId,
    });

    res.status(201).json({
      success: true,
      message: "Session started",
      session,
    });

  } catch (error) {
    console.error("Start Session Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// END SESSION
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // 1. Validate sessionId format
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    // 2. Find session
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // 3. Check ownership (VERY IMPORTANT)
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to end this session",
      });
    }

    // 4. Prevent double ending
    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Session already ended",
      });
    }

    // 5. End session
    session.status = "completed";
    session.endTime = new Date();

    await session.save();

    res.status(200).json({
      success: true,
      message: "Session ended",
      session,
    });

  } catch (error) {
    console.error("End Session Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};