const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "tab_switch",
        "copy_paste",
        "no_face",
        "multiple_faces",
        "window_blur",
        "fullscreen_exit",   // ✅ NEW — fired when user exits fullscreen
      ],
      required: true,
    },
    severity: {
      type: Number,
      default: 1,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Violation", violationSchema);