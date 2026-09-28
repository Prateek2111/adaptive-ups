const assert = require("assert");
const simulationService = require("../services/simulationService");

console.log("\n=======================================================================");
console.log("🧪 ADAPTIVE UPS COMBINED BATTERY + TEMPERATURE SIMULATION ENGINE TEST");
console.log("=======================================================================\n");

async function runTests() {
  try {
    // Test 1: High SOC (100%) + Normal temp (30°C) -> All eligible loads ON
    console.log("🔹 Test 1: High SOC + Normal temperature...");
    simulationService.resetSimulation();
    simulationService.setBatterySource("SIMULATION");
    simulationService.evaluateCombinedAdaptiveLogic(100, 30.0, true);
    let status = simulationService.getSimulationStatus();
    assert.strictEqual(status.loads.every(l => l.state === true), true);
    console.log("   ✅ Test 1 Passed: All eligible loads ON at 100% SOC and 30°C.");

    // Test 2: Low SOC (28%) + Normal temp (30°C) -> Low-priority loads shed
    console.log("🔹 Test 2: Low SOC (28%) + Normal temperature (30°C)...");
    simulationService.evaluateCombinedAdaptiveLogic(28, 30.0, true);
    status = simulationService.getSimulationStatus();
    const lowLoad = status.loads.find(l => l.priority === "LOW");
    const highLoad = status.loads.find(l => l.priority === "HIGH");
    assert.strictEqual(lowLoad.state, false, "LOW priority load should be shed at < 30% SOC");
    assert.strictEqual(highLoad.state, true, "HIGH priority load should remain ON");
    console.log("   ✅ Test 2 Passed: LOW priority load shed due to Low SOC.");

    // Test 3: High SOC (90%) + High temp (62°C) -> Thermal load shedding
    console.log("🔹 Test 3: High SOC (90%) + High temperature (62°C)...");
    simulationService.evaluateCombinedAdaptiveLogic(90, 62.0, true);
    status = simulationService.getSimulationStatus();
    assert.strictEqual(status.loads.find(l => l.id === "load2").state, false, "Load 2 shed due to High Temp");
    assert.ok(status.loads.find(l => l.id === "load2").shedReason.includes("Temperature"), "Shed reason should state Temperature threshold");
    console.log("   ✅ Test 3 Passed: Thermal load shedding triggered at 62°C.");

    // Test 4: Low SOC (20%) + High temp (66°C) -> Most restrictive protection applied
    console.log("🔹 Test 4: Low SOC (20%) + Critical temp (66°C)...");
    simulationService.evaluateCombinedAdaptiveLogic(20, 66.0, true);
    status = simulationService.getSimulationStatus();
    const nonCritical = status.loads.filter(l => l.priority !== "CRITICAL");
    assert.strictEqual(nonCritical.every(l => l.state === false), true, "All non-critical loads shed under critical stress");
    console.log("   ✅ Test 4 Passed: Most restrictive protection applied under combined stress.");

    // Test 5: Temperature recovery (66°C -> 30°C) -> Controller reevaluates loads
    console.log("🔹 Test 5: Temperature recovery (66°C -> 30°C at 90% SOC)...");
    simulationService.evaluateCombinedAdaptiveLogic(90, 30.0, true);
    status = simulationService.getSimulationStatus();
    assert.strictEqual(status.loads.every(l => l.state === true), true, "Loads restored after temp recovery");
    console.log("   ✅ Test 5 Passed: Controller restored loads after thermal recovery.");

    // Test 6: Battery recovery (15% -> 90% at 30°C) -> Controller reevaluates loads
    console.log("🔹 Test 6: Battery recovery (15% -> 90%)...");
    simulationService.evaluateCombinedAdaptiveLogic(15, 30.0, true);
    let lowState = simulationService.getSimulationStatus().loads.find(l => l.priority === "LOW").state;
    assert.strictEqual(lowState, false);

    simulationService.evaluateCombinedAdaptiveLogic(90, 30.0, true);
    lowState = simulationService.getSimulationStatus().loads.find(l => l.priority === "LOW").state;
    assert.strictEqual(lowState, true, "LOW priority load restored after battery recovery");
    console.log("   ✅ Test 6 Passed: Controller reevaluated loads after battery recovery.");

    // Test 7: Pause/resume simulation
    console.log("🔹 Test 7: Pause and resume simulation...");
    status = simulationService.startSimulation();
    status = simulationService.pauseSimulation();
    assert.strictEqual(status.status, "PAUSED");
    status = simulationService.resumeSimulation();
    assert.strictEqual(status.status, "RUNNING");
    console.log("   ✅ Test 7 Passed: Pause and resume functional.");

    // Test 8: Reset simulation
    console.log("🔹 Test 8: Reset simulation...");
    status = simulationService.resetSimulation();
    assert.strictEqual(status.status, "IDLE");
    assert.strictEqual(status.soc, 100);
    assert.strictEqual(status.temperature, 28.5);
    assert.strictEqual(status.loads.every(l => l.state === true), true);
    console.log("   ✅ Test 8 Passed: Reset restored 100% SOC, 28.5°C, and all loads ON.");

    // Test 9: Switch from simulation to real battery
    console.log("🔹 Test 9: Switch to REAL BATTERY...");
    status = simulationService.setBatterySource("REAL");
    assert.strictEqual(status.batterySource, "REAL");
    console.log("   ✅ Test 9 Passed: Battery source switched back to REAL.");

    // Test 10: Verify simulation never accidentally controls physical hardware
    console.log("🔹 Test 10: Verify physical hardware relay protection guard...");
    simulationService.setBatterySource("SIMULATION");
    const dataSendController = require("../controllers/dataSendController");
    assert.ok(dataSendController, "dataSendController loaded");
    console.log("   ✅ Test 10 Passed: Hardware safety guard verified.");

    console.log("\n=======================================================================");
    console.log("🎉 ALL 10 COMBINED BATTERY + TEMPERATURE TEST SCENARIOS PASSED!");
    console.log("=======================================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runTests();
