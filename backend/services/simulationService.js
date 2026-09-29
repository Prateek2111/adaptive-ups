/**
 * Simulation Service & Combined Adaptive Energy & Thermal Management Engine
 *
 * Unified System Architecture:
 *  - BatteryDataSource (Real & Simulated)
 *  - TemperatureDataSource (Real & Simulated)
 *  - Combined Adaptive Energy & Thermal Manager
 *  - LoadPriority & ThermalSensitivity Manager
 *  - Most Restrictive Safety Principle Engine
 */

const { isDbConnected } = require("../config/db");

// Priority levels enum
const PRIORITY_LEVELS = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
};

// Thermal sensitivity enum
const THERMAL_SENSITIVITY = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
};

// Thermal thresholds (°C)
const THERMAL_THRESHOLDS = {
  NORMAL_MAX: 40.0,
  WARNING_MAX: 50.0,
  HIGH_MAX: 60.0,
  CRITICAL_MAX: 65.0
};

// Default project loads
let loadConfigurations = [
  {
    id: "load1",
    name: "Primary Load (D5 / GPIO 5)",
    powerRating: 65, // Watts
    priority: PRIORITY_LEVELS.HIGH,
    thermalSensitivity: THERMAL_SENSITIVITY.LOW,
    state: true,
    shedReason: "",
    relayKey: "load1"
  },
  {
    id: "load2",
    name: "Secondary Load (GPIO 15)",
    powerRating: 45, // Watts
    priority: PRIORITY_LEVELS.LOW,
    thermalSensitivity: THERMAL_SENSITIVITY.HIGH,
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
  capacityWh: 100.0,
  ambientTemp: 28.5
};

// Unified Simulation State
let simulationState = {
  batterySource: "REAL", // "REAL" or "SIMULATION"
  status: "IDLE", // "IDLE", "RUNNING", "PAUSED", "STOPPED", "COMPLETED"

  // Battery State
  soc: 100.0,
  speed: 1, // 1x, 5x, 10x, 25x, 50x, 100x
  initialSoc: 100.0,
  minSoc: 0.0,
  batteryCapacityWh: BATTERY_SPECS.capacityWh,
  voltage: BATTERY_SPECS.maxVoltage,
  current: 0.0,
  power: 0.0,
  remainingEnergyWh: BATTERY_SPECS.capacityWh,

  // Temperature Simulation State
  temperature: 28.5,
  tempTarget: 28.5,
  tempMode: "STABLE", // "HEATING", "COOLING", "STABLE"
  tempSpeed: 1, // 1x, 5x, 10x, 25x, 50x, 100x
  tempProfile: "NORMAL", // "NORMAL", "WARM", "HIGH", "OVERHEATING", "RECOVERY", "CUSTOM"
  tempStatus: "NORMAL", // "NORMAL", "WARNING", "HIGH", "CRITICAL"
  minTemp: 15.0,
  maxTemp: 80.0,
  heatingRate: 0.8, // °C per second at 1x
  coolingRate: 0.8, // °C per second at 1x

  // Combined System State
  systemMode: "NORMAL",
  systemWarning: "NORMAL", // "NORMAL", "BATTERY WARNING", "THERMAL WARNING", "CRITICAL COMBINED STRESS"

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
    soc: Number(simulationState.soc.toFixed(1)),
    temp: Number(simulationState.temperature.toFixed(1))
  };
  simulationLogs.unshift(logEntry);
  if (simulationLogs.length > 100) {
    simulationLogs.pop();
  }
  console.log(`🔋 [SIMULATION LOG ${logEntry.timestamp}] (${type.toUpperCase()}) ${message}`);
  return logEntry;
}

/**
 * Calculates battery voltage from SOC %
 */
function socToVoltage(soc) {
  const clampedSoc = Math.max(0, Math.min(100, soc));
  if (clampedSoc <= 0) return BATTERY_SPECS.minVoltage;
  if (clampedSoc >= 100) return BATTERY_SPECS.maxVoltage;

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
 * Determines Thermal Status Level
 */
function getThermalStatus(temp) {
  if (temp >= THERMAL_THRESHOLDS.CRITICAL_MAX) return "CRITICAL";
  if (temp >= THERMAL_THRESHOLDS.HIGH_MAX) return "HIGH";
  if (temp >= THERMAL_THRESHOLDS.WARNING_MAX) return "WARNING";
  return "NORMAL";
}

/**
 * Unified Combined Adaptive Energy & Thermal Management Engine
 * Implements the MOST RESTRICTIVE SAFETY PRINCIPLE combining SOC and Temperature!
 */
function evaluateCombinedAdaptiveLogic(currentSoc, currentTemp, isSimulation = false) {
  const actionsTaken = [];
  const tempStatus = getThermalStatus(currentTemp);
  simulationState.tempStatus = tempStatus;

  // Determine combined system warning status
  let systemWarning = "NORMAL";
  const isBatteryLow = currentSoc <= 30;
  const isThermalHigh = currentTemp >= 50;

  if (currentSoc <= 5 || currentTemp >= 65) {
    systemWarning = "CRITICAL EMERGENCY";
  } else if (isBatteryLow && isThermalHigh) {
    systemWarning = "CRITICAL COMBINED STRESS";
  } else if (isThermalHigh) {
    systemWarning = "THERMAL WARNING";
  } else if (isBatteryLow) {
    systemWarning = "BATTERY WARNING";
  }
  simulationState.systemWarning = systemWarning;

  // Sync priority with global settings fallback if available
  try {
    const { getSettingsFallback } = require("./fallbackService");
    const settings = getSettingsFallback();
    if (settings && settings.priorityLoad) {
      const pLoad = String(settings.priorityLoad).toLowerCase();
      for (const load of loadConfigurations) {
        if (pLoad === "load1") {
          if (load.id === "load1") load.priority = PRIORITY_LEVELS.HIGH;
          if (load.id === "load2") load.priority = PRIORITY_LEVELS.LOW;
        } else if (pLoad === "load2") {
          if (load.id === "load2") load.priority = PRIORITY_LEVELS.HIGH;
          if (load.id === "load1") load.priority = PRIORITY_LEVELS.LOW;
        }
      }
    }
  } catch (err) {
    // Ignore setting sync errors
  }

  for (const load of loadConfigurations) {
    const priority = (load.priority || PRIORITY_LEVELS.LOW).toUpperCase();
    const tSens = (load.thermalSensitivity || THERMAL_SENSITIVITY.LOW).toUpperCase();

    let socAllows = true;
    let socReason = "";

    // 1. Evaluate Battery SOC Rules
    if (currentSoc <= 0) {
      socAllows = false;
      socReason = "Battery completely depleted (0% SOC)";
    } else if (currentSoc <= 5) {
      if (priority !== PRIORITY_LEVELS.CRITICAL) {
        socAllows = false;
        socReason = `Battery SOC (${currentSoc.toFixed(1)}%) at/below 5% critical cutoff. Priority '${priority}' shed.`;
      }
    } else if (currentSoc < 15) {
      if (priority === PRIORITY_LEVELS.LOW || priority === PRIORITY_LEVELS.MEDIUM) {
        socAllows = false;
        socReason = `Battery SOC (${currentSoc.toFixed(1)}%) below 15% threshold. Priority '${priority}' shed.`;
      }
    } else if (currentSoc <= 25) {
      if (priority === PRIORITY_LEVELS.LOW) {
        socAllows = false;
        socReason = `Battery SOC (${currentSoc.toFixed(1)}%) at/below 25% threshold. Priority '${priority}' shed.`;
      }
    }

    // 2. Evaluate Thermal Rules
    let tempAllows = true;
    let tempReason = "";

    if (currentTemp >= 65.0) {
      if (priority !== PRIORITY_LEVELS.CRITICAL) {
        tempAllows = false;
        tempReason = `Temperature (${currentTemp.toFixed(1)}°C) reached CRITICAL OVERHEATING limit (>65°C). Priority '${priority}' shed.`;
      }
    } else if (currentTemp >= 60.0) {
      if (priority === PRIORITY_LEVELS.LOW || priority === PRIORITY_LEVELS.MEDIUM || tSens === THERMAL_SENSITIVITY.HIGH) {
        tempAllows = false;
        tempReason = `Temperature (${currentTemp.toFixed(1)}°C) in HIGH TEMP range (60-65°C). Priority '${priority}' / Sensitivity '${tSens}' shed.`;
      }
    } else if (currentTemp >= 50.0) {
      if (priority === PRIORITY_LEVELS.LOW || (priority === PRIORITY_LEVELS.MEDIUM && tSens === THERMAL_SENSITIVITY.HIGH)) {
        tempAllows = false;
        tempReason = `Temperature (${currentTemp.toFixed(1)}°C) in WARM/HIGH range (50-60°C). Priority '${priority}' shed.`;
      }
    }

    // 3. Apply Most Restrictive Safety Principle: Load is ON only if BOTH SOC and Temp allow it!
    const shouldBeOn = socAllows && tempAllows;
    const finalReason = !socAllows ? socReason : (!tempAllows ? tempReason : "");

    if (load.state !== shouldBeOn) {
      load.state = shouldBeOn;
      load.shedReason = shouldBeOn ? "" : finalReason;

      const actionMsg = shouldBeOn
        ? `Load '${load.name}' (${load.id.toUpperCase()}) RESTORED ON. [SOC: ${currentSoc.toFixed(1)}%, Temp: ${currentTemp.toFixed(1)}°C]`
        : `Load '${load.name}' (${load.id.toUpperCase()}) SWITCHED OFF. ${finalReason}`;

      addLog(actionMsg, shouldBeOn ? "ok" : "warn");
      actionsTaken.push({ loadId: load.id, state: shouldBeOn, reason: finalReason });
    } else if (!shouldBeOn) {
      load.shedReason = finalReason;
    }

    // Always sync load state with backend fallbackService
    const { setLoad } = require("./fallbackService");
    setLoad(load.id, shouldBeOn);
  }

  return actionsTaken;
}

/**
 * Real-Time Simulation Engine Tick (Battery SOC + Temperature)
 */
function runSimulationTick() {
  if (simulationState.status !== "RUNNING") return;

  const now = Date.now();
  const dtSeconds = (now - simulationState.lastUpdated) / 1000.0;
  simulationState.lastUpdated = now;

  if (dtSeconds <= 0) return;

  // 1. BATTERY DISCHARGE SIMULATION
  const activePower = calculateActivePower();
  const totalPowerDraw = activePower + 5.0; // 5W idle consumption

  const effectiveHours = (dtSeconds / 3600.0) * simulationState.speed;
  const energyConsumedWh = totalPowerDraw * effectiveHours;
  const socDropPercent = (energyConsumedWh / simulationState.batteryCapacityWh) * 100.0;

  let newSoc = simulationState.soc - socDropPercent;
  if (newSoc <= simulationState.minSoc) {
    newSoc = simulationState.minSoc;
    if (simulationState.status === "RUNNING" && simulationState.tempMode === "STABLE") {
      simulationState.status = "COMPLETED";
      addLog(`Simulation Complete! Battery reached minimum SOC (${newSoc.toFixed(1)}%).`, "crit");
      stopSimulationTick();
    }
  }

  simulationState.soc = Math.max(0, Math.min(100, newSoc));
  simulationState.voltage = socToVoltage(simulationState.soc);
  simulationState.power = activePower;
  simulationState.current = Number((activePower / (simulationState.voltage || 12.0)).toFixed(2));
  simulationState.remainingEnergyWh = Number(((simulationState.soc / 100.0) * simulationState.batteryCapacityWh).toFixed(1));

  // 2. TEMPERATURE SIMULATION
  let currentTemp = simulationState.temperature;

  if (simulationState.tempMode === "HEATING") {
    const rate = simulationState.heatingRate * dtSeconds * simulationState.tempSpeed;
    if (currentTemp < simulationState.tempTarget) {
      currentTemp = Math.min(simulationState.tempTarget, currentTemp + rate);
    } else {
      simulationState.tempMode = "STABLE";
      addLog(`Temperature reached target (${currentTemp.toFixed(1)}°C).`, "info");
    }
  } else if (simulationState.tempMode === "COOLING") {
    const rate = simulationState.coolingRate * dtSeconds * simulationState.tempSpeed;
    if (currentTemp > simulationState.tempTarget) {
      currentTemp = Math.max(simulationState.tempTarget, currentTemp - rate);
    } else {
      simulationState.tempMode = "STABLE";
      addLog(`Cooling complete. Temperature restored to (${currentTemp.toFixed(1)}°C).`, "ok");
    }
  } else {
    // Slight load-dependent ambient fluctuation in STABLE mode
    const loadHeating = (simulationState.current / 10.0) * 0.1;
    currentTemp = Number((currentTemp + loadHeating + (Math.random() * 0.05 - 0.025)).toFixed(1));
  }

  simulationState.temperature = Math.max(simulationState.minTemp, Math.min(simulationState.maxTemp, currentTemp));

  // Update fallback sensor data
  const { setLatestSensorData } = require("./fallbackService");
  setLatestSensorData({
    battery: Number(simulationState.soc.toFixed(1)),
    dcVoltage: simulationState.voltage,
    dcCurrent: simulationState.current,
    current: Number((simulationState.current * (simulationState.voltage / 220.0)).toFixed(2)),
    inputVoltage: 0,
    temperature: Number(simulationState.temperature.toFixed(1))
  });

  // Evaluate Combined Energy & Thermal Management Algorithm!
  evaluateCombinedAdaptiveLogic(simulationState.soc, simulationState.temperature, true);
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
  addLog(`Simulation started (SOC: ${simulationState.soc.toFixed(0)}%, Temp: ${simulationState.temperature.toFixed(1)}°C)`, "ok");

  evaluateCombinedAdaptiveLogic(simulationState.soc, simulationState.temperature, true);
  return getSimulationStatus();
}

function pauseSimulation() {
  if (simulationState.status === "RUNNING") {
    simulationState.status = "PAUSED";
    stopSimulationTick();
    addLog(`Simulation paused (SOC: ${simulationState.soc.toFixed(1)}%, Temp: ${simulationState.temperature.toFixed(1)}°C).`, "warn");
  }
  return getSimulationStatus();
}

function resumeSimulation() {
  if (simulationState.status === "PAUSED" || simulationState.status === "STOPPED") {
    simulationState.batterySource = "SIMULATION";
    simulationState.status = "RUNNING";
    simulationState.lastUpdated = Date.now();
    startSimulationTick();
    addLog(`Simulation resumed (SOC: ${simulationState.soc.toFixed(1)}%, Temp: ${simulationState.temperature.toFixed(1)}°C)`, "ok");
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
  simulationState.tempTarget = BATTERY_SPECS.ambientTemp;
  simulationState.tempMode = "STABLE";
  simulationState.status = "IDLE";
  simulationState.systemWarning = "NORMAL";

  // Reset all loads to ON state
  for (const load of loadConfigurations) {
    load.state = true;
    load.shedReason = "";
    const { setLoad } = require("./fallbackService");
    setLoad(load.id, true);
  }

  addLog(`Simulation reset to initial state (${simulationState.initialSoc}% SOC, ${BATTERY_SPECS.ambientTemp}°C). All loads ON.`, "ok");
  return getSimulationStatus();
}

function setSimulationSpeed(speed) {
  const numericSpeed = Number(speed);
  if ([1, 5, 10, 25, 50, 100].includes(numericSpeed)) {
    simulationState.speed = numericSpeed;
    addLog(`Battery simulation speed changed to ${numericSpeed}x`, "info");
  }
  return getSimulationStatus();
}

function setTempSpeed(speed) {
  const numericSpeed = Number(speed);
  if ([1, 5, 10, 25, 50, 100].includes(numericSpeed)) {
    simulationState.tempSpeed = numericSpeed;
    addLog(`Temperature simulation speed changed to ${numericSpeed}x`, "info");
  }
  return getSimulationStatus();
}

function setTempMode(mode, target = null) {
  if (["HEATING", "COOLING", "STABLE"].includes(mode)) {
    simulationState.tempMode = mode;
    if (target !== null && !isNaN(Number(target))) {
      simulationState.tempTarget = Number(target);
    }
    simulationState.batterySource = "SIMULATION";
    if (simulationState.status !== "RUNNING") {
      startSimulation();
    }
    addLog(`Temperature simulation set to ${mode} (Target: ${simulationState.tempTarget}°C)`, "info");
  }
  return getSimulationStatus();
}

function setTempProfile(profile) {
  simulationState.tempProfile = profile;
  simulationState.batterySource = "SIMULATION";

  let startT = simulationState.temperature;
  let targetT = 30;

  switch (profile) {
    case "NORMAL":
      startT = 25;
      targetT = 30;
      simulationState.tempMode = "HEATING";
      break;
    case "WARM":
      startT = 30;
      targetT = 40;
      simulationState.tempMode = "HEATING";
      break;
    case "HIGH":
      startT = 40;
      targetT = 50;
      simulationState.tempMode = "HEATING";
      break;
    case "OVERHEATING":
      startT = 45;
      targetT = 65;
      simulationState.tempMode = "HEATING";
      simulationState.tempSpeed = 5;
      simulationState.speed = 1;
      break;
    case "RECOVERY":
      startT = 60;
      targetT = 30;
      simulationState.tempMode = "COOLING";
      break;
    default:
      break;
  }

  simulationState.temperature = startT;
  simulationState.tempTarget = targetT;
  if (simulationState.status !== "RUNNING") {
    startSimulation();
  } else {
    evaluateCombinedAdaptiveLogic(simulationState.soc, simulationState.temperature, true);
  }

  addLog(`Temperature profile set to '${profile}' (${startT}°C -> ${targetT}°C)`, "info");
  return getSimulationStatus();
}

function triggerScenario(scenario) {
  simulationState.batterySource = "SIMULATION";

  if (scenario === "batteryDrain") {
    // Scenario 1: Battery Drain (SOC 100% -> 0%, Temp constant 30°C)
    resetSimulation();
    simulationState.soc = 100;
    simulationState.temperature = 30.0;
    simulationState.tempTarget = 30.0;
    simulationState.tempMode = "STABLE";
    simulationState.speed = 10;
    startSimulation();
    addLog("⚡ Demo Scenario 1 Triggered: Battery Drain (100% -> 0%, 10x Speed)", "ok");
  } else if (scenario === "overheating") {
    // Scenario 2: Overheating (SOC 80%, Temp 30°C -> 65°C, 5x Temp Speed, 1x Battery Speed)
    resetSimulation();
    simulationState.soc = 80;
    simulationState.temperature = 30.0;
    simulationState.tempTarget = 65.0;
    simulationState.tempMode = "HEATING";
    simulationState.tempSpeed = 5;
    simulationState.speed = 1;
    startSimulation();
    addLog("🔥 Demo Scenario 2 Triggered: Overheating (30°C -> 65°C, 5x Temp Speed, 1x Battery Speed)", "warn");
  } else if (scenario === "combinedStress") {
    // Scenario 3: Combined Stress (SOC 100% -> 10%, Temp 30°C -> 65°C)
    resetSimulation();
    simulationState.soc = 100;
    simulationState.temperature = 30.0;
    simulationState.tempTarget = 65.0;
    simulationState.tempMode = "HEATING";
    simulationState.speed = 10;
    simulationState.tempSpeed = 10;
    startSimulation();
    addLog("🚨 Demo Scenario 3 Triggered: Combined Stress (SOC 100%->10%, Temp 30°C->65°C)", "crit");
  } else if (scenario === "recovery") {
    // Scenario 4: Recovery (SOC 15%, Temp 65°C -> 30°C)
    resetSimulation();
    simulationState.soc = 15;
    simulationState.temperature = 65.0;
    simulationState.tempTarget = 30.0;
    simulationState.tempMode = "COOLING";
    simulationState.tempSpeed = 10;
    startSimulation();
    addLog("❄️ Demo Scenario 4 Triggered: Thermal Recovery (65°C -> 30°C, 10x Speed)", "ok");
  }

  return getSimulationStatus();
}

function getSimulationStatus() {
  const activePower = calculateActivePower();
  const activeLoadsCount = loadConfigurations.filter(l => l.state).length;
  const shedLoadsCount = loadConfigurations.filter(l => !l.state).length;

  let ina226Data = {
    ina226BusVoltage: Number(simulationState.voltage.toFixed(2)),
    ina226ShuntVoltage: Number((simulationState.current * 0.010 * 1000).toFixed(2)),
    ina226Current: Number(simulationState.current.toFixed(2)),
    ina226Power: Number(simulationState.power.toFixed(1)),
    ina226Online: true
  };

  if (simulationState.batterySource === "REAL") {
    const { getLatestSensorData } = require("./fallbackService");
    const realSensors = getLatestSensorData();
    ina226Data = {
      ina226BusVoltage: Number((realSensors.ina226BusVoltage || realSensors.dcVoltage || 0).toFixed(2)),
      ina226ShuntVoltage: Number((realSensors.ina226ShuntVoltage || 0).toFixed(2)),
      ina226Current: Number((realSensors.ina226Current || realSensors.dcCurrent || 0).toFixed(2)),
      ina226Power: Number((realSensors.ina226Power || 0).toFixed(1)),
      ina226Online: Boolean(realSensors.ina226Online)
    };
  }

  return {
    ...simulationState,
    ...ina226Data,
    activePower,
    activeLoadsCount,
    shedLoadsCount,
    totalLoadsCount: loadConfigurations.length,
    loads: getLoadConfigurations(),
    logs: simulationLogs.slice(0, 50)
  };
}

function getLoadConfigurations() {
  const { getLoads } = require("./fallbackService");
  const currentLoads = getLoads();
  return loadConfigurations.map(l => ({
    ...l,
    state: l.state !== undefined ? Boolean(l.state) : (currentLoads[l.id] !== undefined ? currentLoads[l.id] : true)
  }));
}

function updateLoadPriority(id, priority, powerRating, name, thermalSensitivity) {
  const load = loadConfigurations.find(l => l.id === id || l.relayKey === id);
  if (!load) {
    throw new Error(`Load with id '${id}' not found.`);
  }

  if (priority && PRIORITY_LEVELS[priority.toUpperCase()]) {
    load.priority = priority.toUpperCase();
  }
  if (thermalSensitivity && THERMAL_SENSITIVITY[thermalSensitivity.toUpperCase()]) {
    load.thermalSensitivity = thermalSensitivity.toUpperCase();
  }
  if (powerRating && !isNaN(Number(powerRating))) {
    load.powerRating = Number(powerRating);
  }
  if (name) {
    load.name = name;
  }

  addLog(`Updated Load '${load.name}': Priority=${load.priority}, ThermalSens=${load.thermalSensitivity}, Power=${load.powerRating}W`, "info");

  evaluateCombinedAdaptiveLogic(simulationState.soc, simulationState.temperature, simulationState.batterySource === "SIMULATION");

  return getLoadConfigurations();
}

function configureSimulation(config) {
  if (config.initialSoc !== undefined) simulationState.initialSoc = Math.max(0, Math.min(100, Number(config.initialSoc)));
  if (config.minSoc !== undefined) simulationState.minSoc = Math.max(0, Math.min(100, Number(config.minSoc)));
  if (config.batteryCapacityWh !== undefined) simulationState.batteryCapacityWh = Number(config.batteryCapacityWh);
  if (config.speed !== undefined) setSimulationSpeed(config.speed);
  if (config.tempSpeed !== undefined) setTempSpeed(config.tempSpeed);
  if (config.tempTarget !== undefined) simulationState.tempTarget = Number(config.tempTarget);
  return getSimulationStatus();
}

module.exports = {
  PRIORITY_LEVELS,
  THERMAL_SENSITIVITY,
  THERMAL_THRESHOLDS,
  setBatterySource,
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  resetSimulation,
  setSimulationSpeed,
  setTempSpeed,
  setTempMode,
  setTempProfile,
  triggerScenario,
  getSimulationStatus,
  getLoadConfigurations,
  updateLoadPriority,
  configureSimulation,
  evaluateCombinedAdaptiveLogic,
  addLog
};
