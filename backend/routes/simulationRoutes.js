const express = require("express");
const router = express.Router();
const simulationController = require("../controllers/simulationController");

router.post("/simulation/start", simulationController.startSimulation);
router.post("/simulation/pause", simulationController.pauseSimulation);
router.post("/simulation/resume", simulationController.resumeSimulation);
router.post("/simulation/stop", simulationController.stopSimulation);
router.post("/simulation/reset", simulationController.resetSimulation);
router.post("/simulation/source", simulationController.setBatterySource);
router.post("/simulation/speed", simulationController.setSpeed);
router.get("/simulation/status", simulationController.getStatus);
router.post("/simulation/config", simulationController.updateConfig);

router.get("/simulation/loads", simulationController.getLoadPriorityConfigurations);
router.put("/loads/:id/priority", simulationController.updateLoadPriority);
router.post("/loads/:id/priority", simulationController.updateLoadPriority);

module.exports = router;
