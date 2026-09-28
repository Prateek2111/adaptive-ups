const simulationService = require("../services/simulationService");

async function startSimulation(req, res) {
  try {
    const status = simulationService.startSimulation();
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function pauseSimulation(req, res) {
  try {
    const status = simulationService.pauseSimulation();
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function resumeSimulation(req, res) {
  try {
    const status = simulationService.resumeSimulation();
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function stopSimulation(req, res) {
  try {
    const status = simulationService.stopSimulation();
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function resetSimulation(req, res) {
  try {
    const status = simulationService.resetSimulation();
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function setBatterySource(req, res) {
  try {
    const { source } = req.body;
    const status = simulationService.setBatterySource(source);
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function setSpeed(req, res) {
  try {
    const { speed } = req.body;
    const status = simulationService.setSimulationSpeed(speed);
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function getStatus(req, res) {
  try {
    const status = simulationService.getSimulationStatus();
    return res.json(status);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateConfig(req, res) {
  try {
    const status = simulationService.configureSimulation(req.body);
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function getLoadPriorityConfigurations(req, res) {
  try {
    const loads = simulationService.getLoadConfigurations();
    return res.json(loads);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateLoadPriority(req, res) {
  try {
    const { id } = req.params;
    const { priority, powerRating, name } = req.body;
    const loads = simulationService.updateLoadPriority(id, priority, powerRating, name);
    return res.json({ success: true, loads });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  resetSimulation,
  setBatterySource,
  setSpeed,
  getStatus,
  updateConfig,
  getLoadPriorityConfigurations,
  updateLoadPriority
};
