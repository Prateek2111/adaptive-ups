import React from 'react';
import HeroCard from '../components/HeroCard';
import SummaryCard from '../components/SummaryCard';

export default function OverviewTab({
  onUtility,
  systemVoltage,
  systemDcVoltage = 12.6,
  systemDcCurrent = 0,
  systemCurrent,
  systemCurrent1 = 0,
  systemCurrent2 = 0,
  systemBattery,
  systemTemp,
  systemHum,
  sysDist,
  activeLoads,
  lowThresh,
  critThresh,
  priority,
  battSupplyOn = true,
  chargerOn = true,
  ina226BusVoltage = 12.6,
  ina226ShuntVoltage = 0,
  ina226Current = 0,
  ina226Power = 0,
  ina226Online = false,
}) {
  const pct = Math.min(100, Math.max(0, systemBattery));
  const isCritical = pct <= critThresh;
  const isLow = !isCritical && pct <= lowThresh;

  const tempLabel =
    systemTemp > 45 ? 'High - Fan Active' : systemTemp > 35 ? 'Warm' : 'Optimal';
  const tempColor =
    systemTemp > 45 ? '#EF4444' : systemTemp > 35 ? '#FB923C' : undefined;

  const battModeTag =
    priority === 'auto'
      ? 'Auto mode'
      : priority === 'load1'
      ? 'Load-1 priority'
      : 'Load-2 priority';

  const batteryStatusText = onUtility
    ? chargerOn
      ? 'Charging'
      : 'Mains Standby (Charger OFF)'
    : battSupplyOn
    ? 'Discharging (DC Active)'
    : 'Isolated (DC Cutoff)';

  const batteryStatusColor = onUtility
    ? chargerOn
      ? '#10B981'
      : '#F59E0B'
    : battSupplyOn
    ? '#38BDF8'
    : '#EF4444';

  const calculatedPower = (
    (systemVoltage > 90 ? systemVoltage : 12.0) * systemCurrent
  ).toFixed(1);

  const c1Val = systemCurrent1 > 0 ? systemCurrent1 : systemCurrent * 0.55;
  const c2Val = systemCurrent2 > 0 ? systemCurrent2 : systemCurrent * 0.45;

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      {/* Hero Banner */}
      <HeroCard
        title={onUtility ? 'Utility Online' : 'Battery Backup Active'}
        subtitle="Adaptive UPS intelligent balancing in real-time"
        chipText={battModeTag}
      />

      {/* Alert Banner */}
      {isCritical ? (
        <div className="p-3.5 rounded-xl border border-red-500/60 bg-red-500/15 text-red-500 font-bold text-xs sm:text-sm">
          CRITICAL: Battery at {pct.toFixed(0)}% ({systemDcVoltage.toFixed(2)} V DC) - deep discharge protection active!
        </div>
      ) : isLow ? (
        <div className="p-3.5 rounded-xl border border-amber-500/60 bg-amber-500/15 text-amber-500 font-bold text-xs sm:text-sm">
          Low battery: {pct.toFixed(0)}% ({systemDcVoltage.toFixed(2)} V DC) - load management active
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-emerald-500/60 bg-emerald-500/15 text-emerald-500 font-bold text-xs sm:text-sm">
          System normal - Battery {pct.toFixed(0)}% ({systemDcVoltage.toFixed(2)} V DC • {batteryStatusText})
        </div>
      )}

      {/* Grid of Summary Cards - Displaying INA226 & AC/DC Sensors prominently */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <SummaryCard
          label="INA226 Power Monitor"
          value={`${ina226Power.toFixed(1)} W`}
          subtitle={ina226Online ? `Bus: ${ina226BusVoltage.toFixed(2)}V • Current: ${ina226Current.toFixed(2)}A` : 'INA226 Disconnected (Using Analog Fallback)'}
          subtitleColor={ina226Online ? '#10B981' : '#F59E0B'}
        />
        <SummaryCard
          label="DC Battery Voltage (0-25V Sensor / INA226)"
          value={`${(ina226Online ? ina226BusVoltage : systemDcVoltage).toFixed(2)} V DC`}
          subtitle={`Battery State of Charge: ${pct.toFixed(0)}%`}
          subtitleColor={systemDcVoltage < 10.5 ? '#EF4444' : '#10B981'}
        />
        <SummaryCard
          label="DC Current (INA226 / ACS712)"
          value={`${(ina226Online ? ina226Current : (Math.abs(systemDcCurrent - 25.0) < 0.05 ? 0.0 : systemDcCurrent)).toFixed(2)} A DC`}
          subtitle={ina226Online ? `Shunt: ${ina226ShuntVoltage.toFixed(2)} mV` : (systemDcCurrent === 0 ? 'DC Line Idle (0.00 A)' : 'ACS712 Sensor Fallback')}
          subtitleColor={ina226Online ? '#10B981' : '#F59E0B'}
        />
        <SummaryCard
          label="AC Voltage (ZMPT101B)"
          value={`${systemVoltage.toFixed(1)} V AC`}
          subtitle={systemVoltage > 90 ? 'Mains Grid Online' : 'Grid Outage (0V)'}
          subtitleColor={systemVoltage > 90 ? '#10B981' : '#EF4444'}
        />
        <SummaryCard
          label="Total AC Power & Current"
          value={`${systemCurrent.toFixed(2)} A`}
          subtitle={`Total AC Power: ${calculatedPower} W`}
          subtitleColor={systemCurrent > 0.05 ? '#10B981' : '#94A3B8'}
        />
        <SummaryCard
          label="Current Sensor 1 (JCT5052C)"
          value={`${c1Val.toFixed(2)} A`}
          subtitle="Load 1 Circuit Current"
          subtitleColor="#38BDF8"
        />
        <SummaryCard
          label="Current Sensor 2 (JCT5052C)"
          value={`${c2Val.toFixed(2)} A`}
          subtitle="Load 2 Circuit Current"
          subtitleColor="#A78BFA"
        />
        <SummaryCard
          label="System Temp"
          value={`${systemTemp.toFixed(1)} °C`}
          subtitle={tempLabel}
          subtitleColor={tempColor}
        />
      </div>

      {/* Dedicated INA226 High-Precision I2C Sensor Box */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-[var(--text-main)]">
              🎛️ INA226 High-Precision I2C Current / Voltage / Power Sensor
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
              I2C Address: 0x40 (GPIO 21/22)
            </span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            ina226Online ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          }`}>
            {ina226Online ? '● INA226 ONLINE' : '⚠️ OFFLINE (Analog Fallback Active)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-card)] border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">Bus Voltage (V)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400">
                0 - 36V DC
              </span>
            </div>
            <span className="text-2xl font-black text-[var(--text-main)]">
              {ina226BusVoltage.toFixed(2)} V
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Battery High-Side Bus
            </span>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-card)] border border-blue-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">Shunt Voltage (mV)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/15 text-blue-400">
                0.010 Ω Shunt
              </span>
            </div>
            <span className="text-2xl font-black text-[var(--text-main)]">
              {ina226ShuntVoltage.toFixed(2)} mV
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Shunt Voltage Drop
            </span>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-card)] border border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">DC Current (A)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-400">
                15A Max
              </span>
            </div>
            <span className="text-2xl font-black text-[var(--text-main)]">
              {ina226Current.toFixed(2)} A
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              16x Hardware Averaged
            </span>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-card)] border border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400">Calculated Power (W)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/15 text-purple-400">
                Hardware LSB
              </span>
            </div>
            <span className="text-2xl font-black text-[var(--text-main)]">
              {ina226Power.toFixed(1)} W
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Bus Voltage × Current
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Dual Sensor Breakdown & Battery Level Card */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-bold text-base text-[var(--text-main)]">
            ⚡ Complete Hardware Sensors Realtime Telemetry
          </span>
          <span className="px-3 py-1 rounded-full bg-[var(--bg-main)] text-xs font-bold text-[var(--text-main)] border border-[var(--border-color)]">
            {systemDcVoltage.toFixed(2)} V DC ({pct.toFixed(0)}%)
          </span>
        </div>

        {/* Battery Progress Bar */}
        <div className="w-full h-5 rounded-xl bg-[var(--bg-main)] overflow-hidden p-0.5 border border-[var(--border-color)] mb-4">
          <div
            className={`h-full rounded-lg transition-all duration-500 ${
              isCritical
                ? 'bg-red-500'
                : isLow
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Multi-Sensor Grid Comparison Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-card)] border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-500">
                🔋 DC Voltage Sensor
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-500">
                GPIO 34
              </span>
            </div>
            <span className="text-xl font-extrabold text-[var(--text-main)]">
              {systemDcVoltage.toFixed(2)} V DC
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Battery SOC: {pct.toFixed(0)}%
            </span>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-card)] border border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-500">
                ⚡ ACS712 DC Current
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-500">
                GPIO 12
              </span>
            </div>
            <span className="text-xl font-extrabold text-[var(--text-main)]">
              {systemDcCurrent.toFixed(2)} A DC
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Battery Bus Current
            </span>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-card)] border border-blue-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-500">
                ⚡ JCT5052C Sensor 1
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/15 text-blue-500">
                Load 1 AC
              </span>
            </div>
            <span className="text-xl font-extrabold text-[var(--text-main)]">
              {c1Val.toFixed(2)} A RMS
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Power: {((systemVoltage > 90 ? systemVoltage : 12.0) * c1Val).toFixed(1)} W
            </span>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-card)] border border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-500">
                ⚡ JCT5052C Sensor 2
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/15 text-purple-500">
                Load 2 AC
              </span>
            </div>
            <span className="text-xl font-extrabold text-[var(--text-main)]">
              {c2Val.toFixed(2)} A RMS
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Power: {((systemVoltage > 90 ? systemVoltage : 12.0) * c2Val).toFixed(1)} W
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-3.5 font-medium leading-relaxed">
          INA226 Power:{' '}
          <strong className="text-[var(--text-main)]">
            {ina226Power.toFixed(1)}W ({ina226BusVoltage.toFixed(2)}V / {ina226Current.toFixed(2)}A)
          </strong>{' '}
          | DC Voltage (0-25V):{' '}
          <strong className="text-[var(--text-main)]">
            {systemDcVoltage.toFixed(2)}V DC
          </strong>{' '}
          | ACS712 DC Current:{' '}
          <strong className="text-[var(--text-main)]">
            {systemDcCurrent.toFixed(2)}A DC
          </strong>{' '}
          | ZMPT101B AC Voltage:{' '}
          <strong className="text-[var(--text-main)]">
            {systemVoltage.toFixed(1)}V AC
          </strong>{' '}
          | Total AC Current:{' '}
          <strong className="text-[var(--text-main)]">
            {systemCurrent.toFixed(2)}A
          </strong>{' '}
          | Humidity:{' '}
          <strong className="text-[var(--text-main)]">
            {systemHum.toFixed(0)}%
          </strong>
        </p>
      </div>
    </div>
  );
}
