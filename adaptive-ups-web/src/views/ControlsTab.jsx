import React from 'react';
import SimulationDashboardPanel from '../components/SimulationDashboardPanel';
import { Sliders } from 'lucide-react';

export default function ControlsTab({ addLog = () => {} }) {
  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      {/* Clean & Minimal Heading */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-main)] flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-blue-500" />
          <span>Simulation Mode</span>
        </h2>
      </div>

      {/* Primary Battery Simulation Dashboard Panel */}
      <SimulationDashboardPanel addLog={addLog} />
    </div>
  );
}
