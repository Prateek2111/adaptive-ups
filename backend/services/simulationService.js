/**
 * Simulation Service & Adaptive Load Management Architecture
 *
 * Structure:
 *  - BatteryDataSource (RealBatterySource & SimulatedBatterySource)
 *  - AdaptiveLoadManager
 *  - LoadPriorityManager
 *  - LoadController
 */

const { isDbConnected } = require("../config/db");
const Relay = require("../models/Relay");
const Settings = require("../models/Settings");

// Priority levels enum
const PRIORITY_LEVELS = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
};

// Default project loads
let loadConfigurations = [
  {
    id: "load1",
    name: "WiFi Router & Primary Load",
    powerRating: 65, // Watts
    priority: PRIORITY_LEVELS.HIGH,
    state: true,
    shedReason: "",
    relayKey: "load1"
  },
  {
    id: "load2",
    name: "Lighting & Secondary Load",
    powerRating: 45, // Watts
    priority: PRIORITY_LEVELS.LOW,
    state: true,
    shedReason: "",
    relayKey: "load2"
  }
];

// Battery Specifications (Matching ESP32 project specs)
const BATTERY_SPECS = {
  maxVoltage: 12.6,
  nominalVoltage: 12.0,
  minVoltage: 9.0,
  capacityWh: 100.0, // 100 Watt-hours
  ambientTemp: 28.5 // °C
};

// Simulation state
let simulationState = {
  batterySource: "REAL", // "REAL" or "SIMULATION"
  status: "IDLE", // "IDLE", "RUNNING", "PAUSED", "STOPPED", "COMPLETED"
  soc: 100.0,
  speed: 1, // 1x, 5x, 10x, 25x, 50x, 100x
  initialSoc: 100.0,
  minSoc: 0.0,
  batteryCapacityWh: BATTERY_SPECS.capacityWh,
  voltage: BATTERY_SPECS.maxVoltage,
  current: 0.0,
  power: 0.0,
  temperature: BATTERY_SPECS.ambientTemp,
  remainingEnergyWh: BATTERY_SPECS.capacityWh,
  lastUpdated: Date.now()
};

let simulationLogs = [];
let simulationInterval = null;

// Helper to get formatted timestamp
function getFormattedTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// Log event helper
function addLog(message, type = "info") {
  const logEntry = {
    id: Date.now() + Math.random().toString(36).substr(2, 4),
    timestamp: getFormattedTime(),
    message,
    type, // "info", "warn", "crit", "ok"
    soc: Number(simulationState.soc.toFixed(1))
  };
  simulationLogs.unshift(logEntry);
  if (simulationLogs.length > 100) {
    simulationLogs.pop();
  }
  console.log(`🔋 [SIMULATION LOG ${logEntry.timestamp}] (${type.toUpperCase()}) ${message}`);
  return logEntry;
}

/**
 * Calculates battery voltage from SOC % based on project's non-linear discharge curve
 * Formula matches ESP32 upscode.ino: soc = pow((v - 9.0) / 3.6, 1.3) * 100
 */
function socToVoltage(soc) {
  const clampedSoc = Math.max(0, Math.min(100, soc));
  if (clampedSoc <= 0) return BATTERY_SPECS.minVoltage;
  if (clampedSoc >= 100) return BATTERY_SPECS.maxVoltage;

  // Inverse equation: v = 9.0 + 3.6 * pow(soc / 100, 1.0 / 1.3)
  const ratio = Math.pow(clampedSoc / 100.0, 1.0 / 1.3);
  const v = BATTERY_SPECS.minVoltage + (BATTERY_SPECS.maxVoltage - BATTERY_SPECS.minVoltage) * ratio;
  return Number(v.toFixed(2));
}

/**
 * Calculates total active load power draw in Watts
 */
function calculateActivePower() {
  let totalWatts = 0;
  for (const load of loadConfigurations) {
    if (load.state) {
      totalWatts += load.powerRating;
    }
  }
  return totalWatts;
}

/**
 * Adaptive Load Manager Core Engine
 * Runs priority evaluation against current SOC and battery state.
 * Shared by both Real Battery and Simulation mode!
 */
function evaluateAdaptiveLoadShedding(currentSoc, isSimulation = false) {
  let actionsTaken = [];

  for (const load of loadConfigurations) {
    const priority = (load.priority || PRIORITY_LEVELS.LOW).toUpperCase();
    let shouldBeOn = true;
    let reason = "";

    if (currentSoc <= 0) {
      shouldBeOn = false;
      reason = "Battery completely depleted (0% SOC)";
    } else if (currentSoc < 5) {
      if (priority !== PRIORITY_LEVELS.CRITICAL) {
        shouldBeOn = false;
        reason = `Battery SOC (${currentSoc.toFixed(1)}%) below 5% critical cutoff. Priority '${priority}' shed.`;
      }
    } else if (currentSoc < 15) {
      if (priority === PRIORITY_LEVELS.LOW || priority === PRIORITY_LEVELS.MEDIUM) {
        shouldBeOn = false;
        reason = `Battery SOC (${currentSoc.toFixed(1)}%) below 15% threshold. Priority '${priority}' shed.`;
      }
    } else if (currentSoc < 30) {
      if (priority === PRIORITY_LEVELS.LOW) {
        shouldBeOn = false;
        reason = `Battery SOC (${currentSoc.toFixed(1)}%) below 30% threshold. Priority '${priority}' shed.`;
      }
    }

    if (load.state !== shouldBeOn) {
      load.state = shouldBeOn;
      load.shedReason = shouldBeOn ? "" : reason;

      const actionMsg = shouldBeOn
        ? `Load '${load.name}' (${load.id.toUpperCase()}) RESTORED ON. Battery SOC: ${currentSoc.toFixed(1)}%`
        : `Load '${load.name}' (${load.id.toUpperCase()}) SWITCHED OFF. ${reason}`;

      addLog(actionMsg, shouldBeOn ? "ok" : "warn");
      actionsTaken.push({ loadId: load.id, state: shouldBeOn, reason });

      // Sync load state with backend fallbackService
      const { setLoad } = require("./fallbackService");
      setLoad(load.id, shouldBeOn);
    } else if (!shouldBeOn && !load.shedReason) {
      load.shedReason = reason;
    }
  }

  return actionsTaken;
}

/**
 * Real-Time Time-Based Simulation Engine Tick
 */
function runSimulationTick() {
  if (simulationState.status !== "RUNNING") return;

  const now = Date.now();
  const dtSeconds = (now - simulationState.lastUpdated) / 1000.0;
  simulationState.lastUpdated = now;

  if (dtSeconds <= 0) return;

  // Calculate active power draw
  const activePower = calculateActivePower();
  // Include 5W idle UPS self-consumption
  const totalPowerDraw = activePower + 5.0;

  // Energy consumed in Wh = Power (W) * (Time in hours) * speed multiplier
  const effectiveHours = (dtSeconds / 3600.0) * simulationState.speed;
  const energyConsumedWh = totalPowerDraw * effectiveHours;

  // Calculate new SOC
  const socDropPercent = (energyConsumedWh / simulationState.batteryCapacityWh) * 100.0;
  let newSoc = simulationState.soc - socDropPercent;

  if (newSoc <= simulationState.minSoc) {
    newSoc = simulationState.minSoc;
    simulationState.status = "COMPLETED";
    addLog(`Simulation Complete! Battery reached minimum SOC (${newSoc.toFixed(1)}%).`, "crit");
    stopSimulationTick();
  }

  simulationState.soc = Math.max(0, Math.min(100, newSoc));
  simulationState.voltage = socToVoltage(simulationState.soc);
  simulationState.power = activePower;
  simulationState.current = Number((activePower / (simulationState.voltage || 12.0)).toFixed(2));
  simulationState.remainingEnergyWh = Number(((simulationState.soc / 100.0) * simulationState.batteryCapacityWh).toFixed(1));

  // Temperature simulation: rises slightly with load current
  const tempRise = (simulationState.current / 10.0) * 4.0;
  simulationState.temperature = Number((BATTERY_SPECS.ambientTemp + tempRise + (Math.random() * 0.4 - 0.2)).toFixed(1));

  // Update backend fallback sensor data so dashboard APIs seamlessly read simulated battery values
  const { setLatestSensorData } = require("./fallbackService");
  setLatestSensorData({
    battery: Number(simulationState.soc.toFixed(1)),
    dcVoltage: simulationState.voltage,
    dcCurrent: simulationState.current,
    current: Number((simulationState.current * (simulationState.voltage / 220.0)).toFixed(2)),
    inputVoltage: 0, // Battery mode (grid outage simulated)
    temperature: simulationState.temperature
  });

  // Evaluate Adaptive Load Shedding Algorithm on new simulated battery state!
  evaluateAdaptiveLoadShedding(simulationState.soc, true);
}

function startSimulationTick() {
  if (simulationInterval) clearInterval(simulationInterval);
  simulationState.lastUpdated = Date.now();
  simulationInterval = setInterval(runSimulationTick, 500);
}

function stopSimulationTick() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

// Service API Methods

function setBatterySource(source) {
  if (source !== "REAL" && source !== "SIMULATION") {
    throw new Error("Invalid battery source. Expected 'REAL' or 'SIMULATION'");
  }
  simulationState.batterySource = source;
  if (source === "REAL") {
    if (simulationState.status === "RUNNING") {
      pauseSimulation();
    }
    addLog("Switched battery source to REAL BATTERY.", "info");
  } else {
    addLog("Switched battery source to SIMULATION MODE.", "info");
  }
  return getSimulationStatus();
}

function startSimulation() {
  simulationState.batterySource = "SIMULATION";
  simulationState.status = "RUNNING";
  simulationState.lastUpdated = Date.now();
  startSimulationTick();
  addLog(`Simulation started at ${simulationState.soc.toFixed(0)}% SOC (${simulationState.speed}x speed)`, "ok");
  
  // Trigger immediate load evaluation
  evaluateAdaptiveLoadShedding(simulationState.soc, true);
  return getSimulationStatus();
}

function pauseSimulation() {
  if (simulationState.status === "RUNNING") {
    simulationState.status = "PAUSED";
    stopSimulationTick();
    addLog(`Simulation paused at ${simulationState.soc.toFixed(1)}% SOC.`, "warn");
  }
  return getSimulationStatus();
}

function resumeSimulation() {
  if (simulationState.status === "PAUSED" || simulationState.status === "STOPPED") {
    simulationState.batterySource = "SIMULATION";
    simulationState.status = "RUNNING";
    simulationState.lastUpdated = Date.now();
    startSimulationTick();
    addLog(`Simulation resumed at ${simulationState.soc.toFixed(1)}% SOC (${simulationState.speed}x speed)`, "ok");
  }
  return getSimulationStatus();
}

function stopSimulation() {
  simulationState.status = "STOPPED";
  stopSimulationTick();
  addLog("Simulation stopped.", "info");
  return getSimulationStatus();
}

function resetSimulation() {
  stopSimulationTick();
  simulationState.soc = simulationState.initialSoc;
  simulationState.voltage = socToVoltage(simulationState.soc);
  simulationState.current = 0;
  simulationState.power = 0;
  simulationState.remainingEnergyWh = simulationState.batteryCapacityWh;
  simulationState.temperature = BATTERY_SPECS.ambientTemp;
  simulationState.status = "IDLE";

  // Reset all loads to ON state
  for (const load of loadConfigurations) {
    load.state = true;
    load.shedReason = "";
    const { setLoad } = require("./fallbackService");
    setLoad(load.id, true);
  }

  addLog(`Simulation reset to initial state (${simulationState.initialSoc}% SOC). All loads ON.`, "ok");
  return getSimulationStatus();
}

function setSimulationSpeed(speed) {
  const numericSpeed = Number(speed);
  if ([1, 5, 10, 25, 50, 100].includes(numericSpeed)) {
    simulationState.speed = numericSpeed;
    addLog(`Simulation speed changed to ${numericSpeed}x`, "info");
  }
  return getSimulationStatus();
}

function getSimulationStatus() {
  const activePower = calculateActivePower();
  const activeLoadsCount = loadConfigurations.filter(l => l.state).length;
  const shedLoadsCount = loadConfigurations.filter(l => !l.state).length;

  return {
    ...simulationState,
    activePower,
    activeLoadsCount,
    shedLoadsCount,
    totalLoadsCount: loadConfigurations.length,
    loads: getLoadConfigurations(),
    logs: simulationLogs.slice(0, 50)
  };
}

function getLoadConfigurations() {
  // Sync state with fallbackService
  const { getLoads } = require("./fallbackService");
  const currentLoads = getLoads();
  return loadConfigurations.map(l => ({
    ...l,
    state: currentLoads[l.id] !== undefined ? currentLoads[l.id] : l.state
  }));
}

function updateLoadPriority(id, priority, powerRating, name) {
  const load = loadConfigurations.find(l => l.id === id || l.relayKey === id);
  if (!load) {
    throw new Error(`Load with id '${id}' not found.`);
  }

  if (priority && PRIORITY_LEVELS[priority.toUpperCase()]) {
    load.priority = priority.toUpperCase();
  }
  if (powerRating && !isNaN(Number(powerRating))) {
    load.powerRating = Number(powerRating);
  }
  if (name) {
    load.name = name;
  }

  addLog(`Updated config for Load '${load.name}': Priority=${load.priority}, Power=${load.powerRating}W`, "info");

  // Run load shedding evaluation immediately with updated priorities!
  evaluateAdaptiveLoadShedding(simulationState.soc, simulationState.batterySource === "SIMULATION");

  return getLoadConfigurations();
}

function configureSimulation(config) {
  if (config.initialSoc !== undefined) simulationState.initialSoc = Math.max(0, Math.min(100, Number(config.initialSoc)));
  if (config.minSoc !== undefined) simulationState.minSoc = Math.max(0, Math.min(100, Number(config.minSoc)));
  if (config.batteryCapacityWh !== undefined) simulationState.batteryCapacityWh = Number(config.batteryCapacityWh);
  if (config.speed !== undefined) setSimulationSpeed(config.speed);
  return getSimulationStatus();
}

module.exports = {
  PRIORITY_LEVELS,
  setBatterySource,
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  resetSimulation,
  setSimulationSpeed,
  getSimulationStatus,
  getLoadConfigurations,
  updateLoadPriority,
  configureSimulation,
  evaluateAdaptiveLoadShedding,
  addLog
};
