import React, { useState, useEffect, useCallback } from 'react';
import { safeApiCall } from '../services/apiService';
import {
  Battery,
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
  XCircle,
  Activity,
  Flame,
  Award,
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
        state: true,
        shedReason: '',
      },
      {
        id: 'load2',
        name: 'Lighting & Secondary Load',
        powerRating: 45,
        priority: 'LOW',
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
      addLog(`Simulation started at ${res?.soc?.toFixed(0) || 100}% SOC (${res?.speed || 1}x speed)`, 'ok');
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
      addLog(`Simulation paused at ${res?.soc?.toFixed(1)}% SOC`, 'warn');
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
      addLog('Simulation reset to 100% SOC. Loads restored.', 'ok');
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
      addLog(`Simulation speed updated to ${sp}x`, 'info');
    } catch {
      addLog('Failed to set speed', 'crit');
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

  const getSocColor = (soc) => {
    if (soc <= 15) return 'bg-red-500 text-red-500 border-red-500';
    if (soc <= 30) return 'bg-orange-500 text-orange-500 border-orange-500';
    if (soc <= 50) return 'bg-amber-500 text-amber-500 border-amber-500';
    return 'bg-emerald-500 text-emerald-500 border-emerald-500';
  };

  const isSimMode = sim.batterySource === 'SIMULATION';
  const socColorClass = getSocColor(sim.soc);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. BATTERY SOURCE CONTROLLER & SAFETY GUARD */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-blue-500" />
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
              Battery Source Control
            </h3>
          </div>
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
            <span>REAL BATTERY</span>
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
            <span>SIMULATION</span>
          </button>
        </div>

        {/* Safety Guard Notice */}
        {isSimMode && (
          <div className="p-3 rounded-xl border border-blue-500/40 bg-blue-500/10 text-xs font-bold text-blue-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              SAFETY GUARD ACTIVE: Physical hardware relays are isolated during simulation mode. No physical relay switching will occur.
            </span>
          </div>
        )}
      </div>

      {/* 2. BATTERY SIMULATION DASHBOARD GAUGE */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[var(--text-main)]">
            Battery Simulation Gauge
          </h3>
          <span className={`text-xl sm:text-2xl font-black ${socColorClass.split(' ')[1]}`}>
            {sim.soc.toFixed(1)}%
          </span>
        </div>

        {/* Visual SOC Progress Bar */}
        <div className="w-full bg-[var(--bg-main)] h-6 rounded-xl overflow-hidden border border-[var(--border-color)] p-0.5 mb-4">
          <div
            className={`h-full rounded-lg transition-all duration-300 ${socColorClass.split(' ')[0]}`}
            style={{ width: `${Math.max(0, Math.min(100, sim.soc))}%` }}
          />
        </div>

        {/* Correlated Electrical Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Voltage</span>
            <span className="text-base font-black text-[var(--text-main)]">{sim.voltage.toFixed(2)} V</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Current</span>
            <span className="text-base font-black text-blue-500">{sim.current.toFixed(2)} A</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Power</span>
            <span className="text-base font-black text-amber-500">{sim.power.toFixed(1)} W</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Remaining</span>
            <span className="text-base font-black text-emerald-500">{sim.remainingEnergyWh.toFixed(0)} Wh</span>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex flex-col gap-2 mb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Simulation Speed:
          </span>
          <div className="flex flex-wrap gap-2">
            {[1, 5, 10, 25, 50, 100].map((sp) => {
              const active = sim.speed === sp;
              return (
                <button
                  key={sp}
                  onClick={() => handleSetSpeed(sp)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {sp}x
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Controls (Start, Pause, Resume, Stop, Reset) */}
        <div className="flex flex-wrap gap-2.5">
          {sim.status !== 'RUNNING' ? (
            <button
              onClick={sim.status === 'PAUSED' ? handleResume : handleStart}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{sim.status === 'PAUSED' ? '▶ RESUME' : '▶ START SIMULATION'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-amber-500 hover:bg-amber-600 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
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
            <span>↻ RESET</span>
          </button>
        </div>
      </div>

      {/* 3. ADAPTIVE LOAD SHEDDING & PRIORITY CONFIGURATION */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
              Adaptive Load Shedding & Priorities
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
                <div className="flex items-center justify-between gap-3">
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

                  <div className="flex items-center gap-2">
                    {/* Priority Selector Dropdown */}
                    <select
                      value={load.priority}
                      onChange={(e) => handlePriorityChange(load.id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>

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

      {/* 4. SIMULATION EVENT LOG */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Simulation Event Log
        </h3>

        <div className="bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)] h-40 overflow-y-auto font-mono text-xs flex flex-col gap-1.5">
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

      {/* 5. SIMULATION COMPLETION BANNER */}
      {sim.status === 'COMPLETED' && (
        <div className="p-5 rounded-2xl bg-red-500/15 border-2 border-red-500 shadow-lg flex flex-col items-center gap-3 text-center animate-slide-up">
          <Award className="w-10 h-10 text-red-500" />
          <h3 className="text-xl font-black text-red-500">Simulation Complete</h3>
          <p className="text-xs sm:text-sm font-semibold text-[var(--text-main)] max-w-md">
            Battery reached critical minimum SOC level (0%). Deep discharge protection engaged.
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
