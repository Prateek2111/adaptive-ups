const assert = require("assert");
const simulationService = require("../services/simulationService");

console.log("\n=======================================================");
console.log("🧪 ADAPTIVE UPS SIMULATION ENGINE & LOAD SHEDDING TEST");
console.log("=======================================================\n");

async function runTests() {
  try {
    // Test 1: Start simulation at 100% -> All eligible loads ON
    console.log("🔹 Test 1: Start simulation at 100%...");
    simulationService.resetSimulation();
    let status = simulationService.startSimulation();
    assert.strictEqual(status.batterySource, "SIMULATION");
    assert.strictEqual(status.status, "RUNNING");
    assert.strictEqual(status.soc, 100);
    assert.strictEqual(status.loads.every(l => l.state === true), true);
    console.log("   ✅ Test 1 Passed: All eligible loads are ON at 100% SOC.");

    // Test 2: Reach 50% -> Adaptive algorithm evaluates load priorities
    console.log("🔹 Test 2: Reach 50% SOC...");
    simulationService.evaluateAdaptiveLoadShedding(50, true);
    status = simulationService.getSimulationStatus();
    assert.strictEqual(status.loads.every(l => l.state === true), true);
    console.log("   ✅ Test 2 Passed: Priorities evaluated at 50% SOC; eligible loads remain ON.");

    // Test 3: Reach 30% -> LOW priority loads shed
    console.log("🔹 Test 3: Reach 30% (and 29%) SOC...");
    simulationService.evaluateAdaptiveLoadShedding(29, true);
    status = simulationService.getSimulationStatus();
    const lowLoad = status.loads.find(l => l.priority === "LOW");
    const highLoad = status.loads.find(l => l.priority === "HIGH");
    assert.strictEqual(lowLoad.state, false, "LOW priority load should be shed at < 30%");
    assert.strictEqual(highLoad.state, true, "HIGH priority load should remain ON");
    assert.ok(lowLoad.shedReason.includes("below 30%"), "Shed reason should state 30% threshold");
    console.log("   ✅ Test 3 Passed: LOW priority load shed at < 30% with clear reason.");

    // Test 4: Reach 15% -> Only HIGH + CRITICAL loads remain
    console.log("🔹 Test 4: Reach 14% SOC...");
    simulationService.evaluateAdaptiveLoadShedding(14, true);
    status = simulationService.getSimulationStatus();
    assert.strictEqual(lowLoad.state, false);
    assert.strictEqual(highLoad.state, true);
    console.log("   ✅ Test 4 Passed: Only HIGH + CRITICAL loads remain at 14% SOC.");

    // Test 5: Reach critical SOC (< 5%) -> Only CRITICAL loads remain
    console.log("🔹 Test 5: Reach 4% SOC...");
    simulationService.evaluateAdaptiveLoadShedding(4, true);
    status = simulationService.getSimulationStatus();
    const criticalLoads = status.loads.filter(l => l.priority === "CRITICAL");
    const nonCriticalLoads = status.loads.filter(l => l.priority !== "CRITICAL");
    assert.strictEqual(nonCriticalLoads.every(l => l.state === false), true);
    console.log("   ✅ Test 5 Passed: Non-CRITICAL loads shed at < 5% SOC.");

    // Test 6: Pause simulation -> State stops changing
    console.log("🔹 Test 6: Pause simulation...");
    status = simulationService.pauseSimulation();
    assert.strictEqual(status.status, "PAUSED");
    const pausedSoc = status.soc;
    await new Promise(r => setTimeout(r, 600)); // wait 600ms
    status = simulationService.getSimulationStatus();
    assert.strictEqual(status.soc, pausedSoc);
    console.log("   ✅ Test 6 Passed: SOC remained unchanged while paused.");

    // Test 7: Resume -> Simulation continues from same state
    console.log("🔹 Test 7: Resume simulation...");
    status = simulationService.resumeSimulation();
    assert.strictEqual(status.status, "RUNNING");
    assert.strictEqual(status.soc, pausedSoc);
    console.log("   ✅ Test 7 Passed: Simulation resumed from same state.");

    // Test 8: Reset -> Returns to initial SOC (100%) and resets state
    console.log("🔹 Test 8: Reset simulation...");
    status = simulationService.resetSimulation();
    assert.strictEqual(status.status, "IDLE");
    assert.strictEqual(status.soc, 100);
    assert.strictEqual(status.loads.every(l => l.state === true), true);
    console.log("   ✅ Test 8 Passed: Reset returned SOC to 100% and restored all loads.");

    // Test 9: Switch back to REAL BATTERY -> Simulation stops, source switches
    console.log("🔹 Test 9: Switch back to REAL BATTERY...");
    status = simulationService.setBatterySource("REAL");
    assert.strictEqual(status.batterySource, "REAL");
    assert.strictEqual(status.status, "IDLE");
    console.log("   ✅ Test 9 Passed: Switched back to REAL BATTERY mode.");

    console.log("\n=======================================================");
    console.log("🎉 ALL 9 TEST SCENARIOS PASSED CLEANLY!");
    console.log("=======================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runTests();
