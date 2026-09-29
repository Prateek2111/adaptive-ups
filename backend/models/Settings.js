const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    lowBatteryThreshold: { type: Number, default: 25 },
    criticalThreshold: { type: Number, default: 5 },
    priorityLoad: { type: String, default: "load1" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", SettingsSchema);
