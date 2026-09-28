import React, { useState, useEffect, useCallback } from 'react';
import { safeApiCall } from '../services/apiService';
import {
  Battery,
  Flame,
  Snowflake,
  Play,
  Pause,
  Square,
  RotateCcw,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sliders,
  CheckCircle2,
  Award,
  Thermometer,
  Sparkles,
} from 'lucide-react';

export default function SimulationDashboardPanel({ addLog }) {
  const [sim, setSim] = useState({
    batterySource: 'REAL',
    status: 'IDLE',
    soc: 100,
    speed: 1,
    voltage: 12.6,
    current: 0.0,
    power: 0.0,
    temperature: 28.5,
    tempTarget: 28.5,
    tempMode: 'STABLE',
    tempSpeed: 1,
    tempProfile: 'NORMAL',
    tempStatus: 'NORMAL',
    systemWarning: 'NORMAL',
    remainingEnergyWh: 100,
    activePower: 0,
    activeLoadsCount: 2,
    shedLoadsCount: 0,
    totalLoadsCount: 2,
    loads: [
      {
        id: 'load1',
        name: 'WiFi Router & Primary Load',
        powerRating: 65,
        priority: 'HIGH',
        thermalSensitivity: 'LOW',
        state: true,
        shedReason: '',
      },
      {
        id: 'load2',
        name: 'Lighting & Secondary Load',
        powerRating: 45,
        priority: 'LOW',
        thermalSensitivity: 'HIGH',
        state: true,
        shedReason: '',
      },
    ],
    logs: [],
  });

  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await safeApiCall((api) => api.fetchSimulationStatus());
      if (status) {
        setSim(status);
      }
    } catch {
      // Ignore polling errors
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 800);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const handleSourceChange = async (source) => {
    setLoading(true);
    try {
      const res = await safeApiCall((api) => api.setBatterySource(source));
      if (res) setSim(res);
      addLog(`Switched battery source to: ${source}`, 'ok');
    } catch {
      addLog('Failed to set battery source', 'crit');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await safeApiCall((api) => api.startSimulation());
      if (res) setSim(res);
      addLog(`Simulation started (SOC: ${res?.soc?.toFixed(0) || 100}%, Temp: ${res?.temperature?.toFixed(1) || 28.5}°C)`, 'ok');
    } catch {
      addLog('Failed to start simulation', 'crit');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      const res = await safeApiCall((api) => api.pauseSimulation());
      if (res) setSim(res);
      addLog(`Simulation paused (SOC: ${res?.soc?.toFixed(1)}%, Temp: ${res?.temperature?.toFixed(1)}°C)`, 'warn');
    } catch {
      addLog('Failed to pause simulation', 'crit');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      const res = await safeApiCall((api) => api.resumeSimulation());
      if (res) setSim(res);
      addLog('Simulation resumed', 'ok');
    } catch {
      addLog('Failed to resume simulation', 'crit');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const res = await safeApiCall((api) => api.stopSimulation());
      if (res) setSim(res);
      addLog('Simulation stopped', 'info');
    } catch {
      addLog('Failed to stop simulation', 'crit');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await safeApiCall((api) => api.resetSimulation());
      if (res) setSim(res);
      addLog('Simulation reset to 100% SOC and 28.5°C. Loads restored.', 'ok');
    } catch {
      addLog('Failed to reset simulation', 'crit');
    } finally {
      setLoading(false);
    }
  };

  const handleSetSpeed = async (sp) => {
    try {
      const res = await safeApiCall((api) => api.setSimulationSpeed(sp));
      if (res) setSim(res);
      addLog(`Battery simulation speed set to ${sp}x`, 'info');
    } catch {
      addLog('Failed to set battery speed', 'crit');
    }
  };

  const handleSetTempSpeed = async (sp) => {
    try {
      const res = await safeApiCall((api) => api.setTempSpeed(sp));
      if (res) setSim(res);
      addLog(`Temperature simulation speed set to ${sp}x`, 'info');
    } catch {
      addLog('Failed to set temp speed', 'crit');
    }
  };

  const handleSetTempMode = async (mode, target = null) => {
    try {
      const res = await safeApiCall((api) => api.setTempMode(mode, target));
      if (res) setSim(res);
      addLog(`Temperature mode set to ${mode} (Target: ${target || res?.tempTarget}°C)`, 'info');
    } catch {
      addLog('Failed to set temp mode', 'crit');
    }
  };

  const handleSetTempProfile = async (profile) => {
    try {
      const res = await safeApiCall((api) => api.setTempProfile(profile));
      if (res) setSim(res);
      addLog(`Temperature profile set to '${profile}'`, 'info');
    } catch {
      addLog('Failed to set temp profile', 'crit');
    }
  };

  const handleTriggerScenario = async (scenario) => {
    setLoading(true);
    try {
      const res = await safeApiCall((api) => api.triggerScenario(scenario));
      if (res) setSim(res);
      addLog(`Triggered Scenario '${scenario}'`, 'ok');
    } catch {
      addLog('Failed to trigger scenario', 'crit');
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = async (id, priority) => {
    try {
      await safeApiCall((api) => api.updateLoadPriority(id, { priority }));
      await fetchStatus();
      addLog(`Load ${id} priority updated to ${priority}`, 'ok');
    } catch {
      addLog('Failed to update load priority', 'crit');
    }
  };

  const handleThermalSensitivityChange = async (id, thermalSensitivity) => {
    try {
      await safeApiCall((api) => api.updateLoadPriority(id, { thermalSensitivity }));
      await fetchStatus();
      addLog(`Load ${id} thermal sensitivity updated to ${thermalSensitivity}`, 'ok');
    } catch {
      addLog('Failed to update load thermal sensitivity', 'crit');
    }
  };

  const getSocColor = (soc) => {
    if (soc <= 15) return 'bg-red-500 text-red-500 border-red-500';
    if (soc <= 30) return 'bg-orange-500 text-orange-500 border-orange-500';
    if (soc <= 50) return 'bg-amber-500 text-amber-500 border-amber-500';
    return 'bg-emerald-500 text-emerald-500 border-emerald-500';
  };

  const getTempColor = (temp) => {
    if (temp >= 65) return 'bg-red-500 text-red-500 border-red-500';
    if (temp >= 60) return 'bg-red-500 text-red-500 border-red-500';
    if (temp >= 50) return 'bg-orange-500 text-orange-500 border-orange-500';
    if (temp >= 40) return 'bg-amber-500 text-amber-500 border-amber-500';
    return 'bg-emerald-500 text-emerald-500 border-emerald-500';
  };

  const getTempStatusBadge = (temp) => {
    if (temp >= 65) return { label: 'CRITICAL / OVERHEATING 🚨', color: 'bg-red-500/15 text-red-500 border-red-500/40' };
    if (temp >= 60) return { label: 'HIGH TEMP ⚠', color: 'bg-red-500/15 text-red-500 border-red-500/40' };
    if (temp >= 50) return { label: 'HIGH TEMP', color: 'bg-orange-500/15 text-orange-500 border-orange-500/40' };
    if (temp >= 40) return { label: 'WARNING', color: 'bg-amber-500/15 text-amber-500 border-amber-500/40' };
    return { label: 'NORMAL', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40' };
  };

  const isSimMode = sim.batterySource === 'SIMULATION';
  const socColorClass = getSocColor(sim.soc);
  const tempColorClass = getTempColor(sim.temperature);
  const tempBadge = getTempStatusBadge(sim.temperature);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. BATTERY SOURCE CONTROLLER & COMBINED SYSTEM WARNING HEADER */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-blue-500" />
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
              Digital Twin Simulation Center
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* System Status Warning Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                sim.systemWarning.includes('CRITICAL')
                  ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse'
                  : sim.systemWarning.includes('WARNING')
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50'
                  : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/40'
              }`}
            >
              {sim.systemWarning}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isSimMode
                  ? 'bg-blue-500/15 text-blue-500 border border-blue-500/40'
                  : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/40'
              }`}
            >
              {isSimMode ? 'SIMULATION MODE' : 'REAL BATTERY'}
            </span>
          </div>
        </div>

        {/* Source Toggle Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <button
            onClick={() => handleSourceChange('REAL')}
            disabled={loading}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center justify-center gap-2 border ${
              !isSimMode
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
            }`}
          >
            <Battery className="w-4 h-4" />
            <span>REAL HARDWARE MODE</span>
          </button>
          <button
            onClick={() => handleSourceChange('SIMULATION')}
            disabled={loading}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center justify-center gap-2 border ${
              isSimMode
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>SIMULATION MODE</span>
          </button>
        </div>

        {/* Safety Guard Notice */}
        {isSimMode && (
          <div className="p-3 rounded-xl border border-blue-500/40 bg-blue-500/10 text-xs font-bold text-blue-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              SAFETY GUARD ACTIVE: Physical hardware relays are isolated during simulation mode. Adaptive algorithms operate on simulated state.
            </span>
          </div>
        )}
      </div>

      {/* 2. ONE-CLICK DEMO SIMULATION SCENARIOS */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[var(--text-main)]">
            One-Click Demonstration Scenarios
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleTriggerScenario('batteryDrain')}
            disabled={loading}
            className="p-3 rounded-xl bg-[var(--bg-main)] hover:bg-blue-500/10 border border-[var(--border-color)] hover:border-blue-500/50 transition cursor-pointer text-left flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-500">
              <Battery className="w-4 h-4" />
              <span>1. Battery Drain</span>
            </div>
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">
              SOC: 100% → 0% (Temp 30°C)
            </span>
          </button>

          <button
            onClick={() => handleTriggerScenario('overheating')}
            disabled={loading}
            className="p-3 rounded-xl bg-[var(--bg-main)] hover:bg-orange-500/10 border border-[var(--border-color)] hover:border-orange-500/50 transition cursor-pointer text-left flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-orange-500">
              <Flame className="w-4 h-4" />
              <span>2. Overheating</span>
            </div>
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">
              Temp: 30°C → 65°C (SOC 80%)
            </span>
          </button>

          <button
            onClick={() => handleTriggerScenario('combinedStress')}
            disabled={loading}
            className="p-3 rounded-xl bg-[var(--bg-main)] hover:bg-red-500/10 border border-[var(--border-color)] hover:border-red-500/50 transition cursor-pointer text-left flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-500">
              <Zap className="w-4 h-4" />
              <span>3. Combined Stress</span>
            </div>
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">
              SOC 100%→10% & Temp 30→65°C
            </span>
          </button>

          <button
            onClick={() => handleTriggerScenario('recovery')}
            disabled={loading}
            className="p-3 rounded-xl bg-[var(--bg-main)] hover:bg-emerald-500/10 border border-[var(--border-color)] hover:border-emerald-500/50 transition cursor-pointer text-left flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-500">
              <Snowflake className="w-4 h-4" />
              <span>4. Recovery</span>
            </div>
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">
              Temp: 65°C → 30°C (Cooling)
            </span>
          </button>
        </div>
      </div>

      {/* 3. BATTERY SOC SIMULATION CARD */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
            <Battery className="w-4 h-4 text-blue-500" />
            <span>Battery SOC Simulation</span>
          </h3>
          <span className={`text-lg sm:text-xl font-black ${socColorClass.split(' ')[1]}`}>
            {sim.soc.toFixed(1)}%
          </span>
        </div>

        {/* Visual SOC Progress Bar */}
        <div className="w-full bg-[var(--bg-main)] h-5 rounded-xl overflow-hidden border border-[var(--border-color)] p-0.5 mb-3">
          <div
            className={`h-full rounded-lg transition-all duration-300 ${socColorClass.split(' ')[0]}`}
            style={{ width: `${Math.max(0, Math.min(100, sim.soc))}%` }}
          />
        </div>

        {/* Electrical Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Voltage</span>
            <span className="text-sm font-black text-[var(--text-main)]">{sim.voltage.toFixed(2)} V</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Current</span>
            <span className="text-sm font-black text-blue-500">{sim.current.toFixed(2)} A</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Power</span>
            <span className="text-sm font-black text-amber-500">{sim.power.toFixed(1)} W</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Remaining</span>
            <span className="text-sm font-black text-emerald-500">{sim.remainingEnergyWh.toFixed(0)} Wh</span>
          </div>
        </div>

        {/* Battery Speed Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Battery Speed:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[1, 5, 10, 25, 50, 100].map((sp) => {
              const active = sim.speed === sp;
              return (
                <button
                  key={sp}
                  onClick={() => handleSetSpeed(sp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {sp}x
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. TEMPERATURE SIMULATION CARD & GAUGE */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-orange-500" />
            <span>Temperature Simulation (DS18B20 Digital Twin)</span>
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase border ${tempBadge.color}`}>
            {tempBadge.label}
          </span>
        </div>

        {/* Visual Temperature Display Gauge */}
        <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col items-center gap-2 mb-4">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Current Temperature
          </span>
          <span className={`text-3xl sm:text-4xl font-black ${tempColorClass.split(' ')[1]}`}>
            {sim.temperature.toFixed(1)} °C
          </span>
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            Mode: {sim.tempMode} (Target: {sim.tempTarget}°C)
          </span>

          {/* Thermal Scale Bar */}
          <div className="w-full max-w-md bg-gray-200 dark:bg-gray-800 h-3 rounded-full overflow-hidden mt-1 relative">
            <div
              className={`h-full transition-all duration-300 ${tempColorClass.split(' ')[0]}`}
              style={{ width: `${Math.min(100, Math.max(0, ((sim.temperature - 15) / 65) * 100))}%` }}
            />
          </div>
          <div className="w-full max-w-md flex justify-between text-[10px] font-bold text-[var(--text-muted)] px-1">
            <span>15°C (Normal)</span>
            <span>40°C (Warn)</span>
            <span>50°C (High)</span>
            <span>65°C+ (Critical)</span>
          </div>
        </div>

        {/* Heating / Cooling Mode Controls */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => handleSetTempMode('HEATING', 65)}
            className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 border ${
              sim.tempMode === 'HEATING'
                ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-orange-500'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>[ 🔥 HEATING ]</span>
          </button>
          <button
            onClick={() => handleSetTempMode('COOLING', 30)}
            className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 border ${
              sim.tempMode === 'COOLING'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-emerald-500'
            }`}
          >
            <Snowflake className="w-4 h-4" />
            <span>[ ❄️ COOLING ]</span>
          </button>
        </div>

        {/* Predefined Profiles */}
        <div className="flex flex-col gap-1.5 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Predefined Thermal Profiles:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'NORMAL', label: 'Normal (25→30°C)' },
              { id: 'WARM', label: 'Warm Env (30→40°C)' },
              { id: 'HIGH', label: 'High Temp (40→50°C)' },
              { id: 'OVERHEATING', label: 'Overheating (45→65°C)' },
              { id: 'RECOVERY', label: 'Cooling Recovery (60→30°C)' },
            ].map((prof) => {
              const active = sim.tempProfile === prof.id;
              return (
                <button
                  key={prof.id}
                  onClick={() => handleSetTempProfile(prof.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    active
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {prof.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Temperature Speed Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Temp Speed:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[1, 5, 10, 25, 50].map((sp) => {
              const active = sim.tempSpeed === sp;
              return (
                <button
                  key={sp}
                  onClick={() => handleSetTempSpeed(sp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer border ${
                    active
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {sp}x
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. PRIMARY MASTER CONTROLS (START, PAUSE, RESUME, STOP, RESET) */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-wrap gap-2.5 justify-center sm:justify-start">
        {sim.status !== 'RUNNING' ? (
          <button
            onClick={sim.status === 'PAUSED' ? handleResume : handleStart}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{sim.status === 'PAUSED' ? '▶ RESUME SIMULATION' : '▶ START SIMULATION'}</span>
          </button>
        ) : (
          <button
            onClick={handlePause}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-amber-500 hover:bg-amber-600 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Ⅱ PAUSE</span>
          </button>
        )}

        <button
          onClick={handleStop}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border border-[var(--border-color)] text-[var(--text-main)] hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition cursor-pointer flex items-center gap-1.5"
        >
          <Square className="w-4 h-4 fill-current" />
          <span>■ STOP</span>
        </button>

        <button
          onClick={handleReset}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border border-[var(--border-color)] text-[var(--text-main)] hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-500 transition cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>↻ RESET ALL</span>
        </button>
      </div>

      {/* 6. COMBINED ADAPTIVE LOAD SHEDDING & PRIORITY / THERMAL SENSITIVITY TABLE */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
              Combined Energy & Thermal Load Management
            </h3>
          </div>
          <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-main)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
            {sim.activeLoadsCount} Active / {sim.shedLoadsCount} Shed
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {(sim.loads || []).map((load) => {
            const isOn = load.state;
            return (
              <div
                key={load.id}
                className={`p-4 rounded-xl bg-[var(--bg-main)] border transition ${
                  isOn ? 'border-emerald-500/40' : 'border-red-500/40 bg-red-500/5'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isOn ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-[var(--text-main)]">
                        {load.name}
                      </h4>
                      <span className="text-[11px] font-bold text-[var(--text-muted)]">
                        Power: {load.powerRating}W
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Priority Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">Priority:</span>
                      <select
                        value={load.priority}
                        onChange={(e) => handlePriorityChange(load.id, e.target.value)}
                        className="px-2 py-1 rounded-lg text-xs font-extrabold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>

                    {/* Thermal Sensitivity Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">Thermal Sens:</span>
                      <select
                        value={load.thermalSensitivity || 'LOW'}
                        onChange={(e) => handleThermalSensitivityChange(load.id, e.target.value)}
                        className="px-2 py-1 rounded-lg text-xs font-extrabold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] cursor-pointer focus:outline-none focus:border-orange-500"
                      >
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        isOn ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
                      }`}
                    >
                      {isOn ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>

                {/* Load Shed Reason */}
                {!isOn && load.shedReason && (
                  <div className="mt-2.5 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Reason: {load.shedReason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. SIMULATION EVENT LOG */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Combined Simulation Event Log
        </h3>

        <div className="bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)] h-44 overflow-y-auto font-mono text-xs flex flex-col gap-1.5">
          {(!sim.logs || sim.logs.length === 0) ? (
            <span className="text-[var(--text-muted)] italic">No simulation events recorded yet.</span>
          ) : (
            sim.logs.map((log, idx) => {
              const typeColor =
                log.type === 'crit'
                  ? 'text-red-500 font-bold'
                  : log.type === 'warn'
                  ? 'text-orange-500 font-bold'
                  : log.type === 'ok'
                  ? 'text-emerald-500 font-bold'
                  : 'text-[var(--text-main)]';

              return (
                <div key={log.id || idx} className="flex gap-2">
                  <span className="text-[var(--text-muted)] font-bold shrink-0">{log.timestamp}</span>
                  <span className={typeColor}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 8. SIMULATION COMPLETION BANNER */}
      {sim.status === 'COMPLETED' && (
        <div className="p-5 rounded-2xl bg-red-500/15 border-2 border-red-500 shadow-lg flex flex-col items-center gap-3 text-center animate-slide-up">
          <Award className="w-10 h-10 text-red-500" />
          <h3 className="text-xl font-black text-red-500">Simulation Complete</h3>
          <p className="text-xs sm:text-sm font-semibold text-[var(--text-main)] max-w-md">
            Battery / Temperature simulation reached emergency threshold limits. Protection active.
          </p>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-red-600 hover:bg-red-700 text-white shadow-md transition cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Simulation</span>
          </button>
        </div>
      )}
    </div>
  );
}
