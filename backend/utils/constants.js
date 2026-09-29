const DEFAULT_SENSOR_DATA = {
  temperature: 25,
  humidity: 50,
  distance: 100,
  battery: 100,
  inputVoltage: 220,
  dcVoltage: 12.6,
  dcCurrent: 0,
  current: 0,
  ina226BusVoltage: 0,
  ina226ShuntVoltage: 0,
  ina226Current: 0,
  ina226Power: 0,
  ina226Online: false
};
const DEFAULT_SETTINGS = {
  lowBatteryThreshold: 25,
  criticalThreshold: 5,
  priorityLoad: "load1"
};

module.exports = {
  DEFAULT_SENSOR_DATA,
  DEFAULT_SETTINGS
};
