const mongoose = require("mongoose");

const SensorSchema = new mongoose.Schema({
  temperature: { type: Number, default: 0 },
  humidity: { type: Number, default: 0 },
  distance: { type: Number, default: 0 },
  battery: { type: Number, default: 0 },
  inputVoltage: { type: Number, default: 0 },
  dcVoltage: { type: Number, default: 12.6 },
  dcCurrent: { type: Number, default: 0 },
  current: { type: Number, default: 0 },
  current1: { type: Number, default: 0 },
  current2: { type: Number, default: 0 },
  ina226BusVoltage: { type: Number, default: 0 },
  ina226ShuntVoltage: { type: Number, default: 0 },
  ina226Current: { type: Number, default: 0 },
  ina226Power: { type: Number, default: 0 },
  ina226Online: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Sensor", SensorSchema);
