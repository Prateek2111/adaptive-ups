import 'package:flutter/material.dart';
import '../models/simulation_data.dart';
import '../services/api_service.dart';

class SimulationDashboardPanel extends StatefulWidget {
  const SimulationDashboardPanel({
    super.key,
    required this.api,
    required this.fallbackApi,
    required this.isDark,
    required this.onLogAdded,
  });

  final ApiService api;
  final ApiService fallbackApi;
  final bool isDark;
  final void Function(String message, String type) onLogAdded;

  @override
  State<SimulationDashboardPanel> createState() => _SimulationDashboardPanelState();
}

class _SimulationDashboardPanelState extends State<SimulationDashboardPanel> {
  SimulationStatus _sim = SimulationStatus.initial();
  bool _isLoading = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchStatus();
  }

  Future<void> _fetchStatus() async {
    try {
      SimulationStatus status;
      try {
        status = await widget.api.fetchSimulationStatus();
      } catch (_) {
        status = await widget.fallbackApi.fetchSimulationStatus();
      }
      if (!mounted) return;
      setState(() {
        _sim = status;
        _errorMessage = '';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Simulation API sync error';
      });
    }
  }

  Future<void> _changeSource(String source) async {
    setState(() => _isLoading = true);
    try {
      SimulationStatus res;
      try {
        res = await widget.api.setBatterySource(source);
      } catch (_) {
        res = await widget.fallbackApi.setBatterySource(source);
      }
      if (!mounted) return;
      setState(() => _sim = res);
      widget.onLogAdded('Battery source changed to: $source', 'ok');
    } catch (e) {
      widget.onLogAdded('Failed to set battery source', 'crit');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _startSim() async {
    setState(() => _isLoading = true);
    try {
      SimulationStatus res;
      try {
        res = await widget.api.startSimulation();
      } catch (_) {
        res = await widget.fallbackApi.startSimulation();
      }
      if (!mounted) return;
      setState(() => _sim = res);
      widget.onLogAdded('Simulation started at ${_sim.soc.toStringAsFixed(0)}% SOC (${_sim.speed}x)', 'ok');
    } catch (e) {
      widget.onLogAdded('Failed to start simulation', 'crit');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pauseSim() async {
    setState(() => _isLoading = true);
    try {
      SimulationStatus res;
      try {
        res = await widget.api.pauseSimulation();
      } catch (_) {
        res = await widget.fallbackApi.pauseSimulation();
      }
      if (!mounted) return;
      setState(() => _sim = res);
      widget.onLogAdded('Simulation paused at ${_sim.soc.toStringAsFixed(1)}% SOC', 'warn');
    } catch (e) {
      widget.onLogAdded('Failed to pause simulation', 'crit');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resumeSim() async {
    setState(() => _isLoading = true);
    try {
      SimulationStatus res;
      try {
        res = await widget.api.resumeSimulation();
      } catch (_) {
        res = await widget.fallbackApi.resumeSimulation();
      }
      if (!mounted) return;
      setState(() => _sim = res);
      widget.onLogAdded('Simulation resumed', 'ok');
    } catch (e) {
      widget.onLogAdded('Failed to resume simulation', 'crit');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _stopSim() async {
    setState(() => _isLoading = true);
    try {
      SimulationStatus res;
      try {
        res = await widget.api.stopSimulation();
      } catch (_) {
        res = await widget.fallbackApi.stopSimulation();
      }
      if (!mounted) return;
      setState(() => _sim = res);
      widget.onLogAdded('Simulation stopped', 'info');
    } catch (e) {
      widget.onLogAdded('Failed to stop simulation', 'crit');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resetSim() async {
    setState(() => _isLoading = true);
    try {
      SimulationStatus res;
      try {
        res = await widget.api.resetSimulation();
      } catch (_) {
        res = await widget.fallbackApi.resetSimulation();
      }
      if (!mounted) return;
      setState(() => _sim = res);
      widget.onLogAdded('Simulation reset to 100% SOC. Loads restored.', 'ok');
    } catch (e) {
      widget.onLogAdded('Failed to reset simulation', 'crit');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _setSpeed(int speed) async {
    try {
      SimulationStatus res;
      try {
        res = await widget.api.setSimulationSpeed(speed);
      } catch (_) {
        res = await widget.fallbackApi.setSimulationSpeed(speed);
      }
      if (!mounted) return;
      setState(() => _sim = res);
      widget.onLogAdded('Simulation speed updated to ${speed}x', 'info');
    } catch (e) {
      widget.onLogAdded('Failed to set simulation speed', 'crit');
    }
  }

  Future<void> _updatePriority(String id, String priority) async {
    try {
      try {
        await widget.api.updateLoadPriority(id, priority: priority);
      } catch (_) {
        await widget.fallbackApi.updateLoadPriority(id, priority: priority);
      }
      await _fetchStatus();
      widget.onLogAdded('Load $id priority set to $priority', 'ok');
    } catch (e) {
      widget.onLogAdded('Failed to update load priority', 'crit');
    }
  }

  Color _getSocColor(double soc) {
    if (soc <= 15) return const Color(0xFFEF4444); // Red Critical
    if (soc <= 30) return const Color(0xFFF97316); // Orange Low
    if (soc <= 50) return const Color(0xFFF59E0B); // Yellow Warning
    return const Color(0xFF10B981); // Green Healthy
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isSim = _sim.batterySource == 'SIMULATION';
    final socColor = _getSocColor(_sim.soc);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_errorMessage.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(10),
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFEF4444).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFEF4444)),
            ),
            child: Text(
              _errorMessage,
              style: const TextStyle(color: Color(0xFFEF4444), fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
        ],
        // 1. BATTERY SOURCE SELECTOR & SAFETY GUARD BANNER
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Battery Source Mode',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                    ),
                    Chip(
                      avatar: CircleAvatar(
                        backgroundColor: isSim ? const Color(0xFF38BDF8) : const Color(0xFF10B981),
                        radius: 5,
                      ),
                      label: Text(
                        isSim ? 'SIMULATION MODE' : 'REAL BATTERY',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment<String>(
                      value: 'REAL',
                      label: Text('REAL BATTERY'),
                      icon: Icon(Icons.battery_charging_full_rounded),
                    ),
                    ButtonSegment<String>(
                      value: 'SIMULATION',
                      label: Text('SIMULATION'),
                      icon: Icon(Icons.science_rounded),
                    ),
                  ],
                  selected: {_sim.batterySource},
                  onSelectionChanged: (Set<String> selection) {
                    if (selection.isNotEmpty) {
                      _changeSource(selection.first);
                    }
                  },
                ),
                if (isSim) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0284C7).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF0284C7), width: 0.8),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.shield_outlined, color: Color(0xFF0284C7), size: 20),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'SAFETY GUARD: Physical hardware relays are isolated during simulation mode.',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0284C7),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // 2. BATTERY SIMULATION DASHBOARD DISPLAY & METRICS
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'BATTERY SIMULATION GAUGE',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: socColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${_sim.soc.toStringAsFixed(1)}%',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: socColor),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Visual Battery Discharge Progress Bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: (_sim.soc / 100.0).clamp(0.0, 1.0),
                    minHeight: 24,
                    color: socColor,
                    backgroundColor: theme.dividerColor.withValues(alpha: 0.2),
                  ),
                ),
                const SizedBox(height: 16),

                // Electrical Parameters Grid
                LayoutBuilder(
                  builder: (context, constraints) {
                    final width = constraints.maxWidth;
                    final cols = width > 500 ? 4 : 2;
                    return Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        _metricTile(width, cols, 'Voltage', '${_sim.voltage.toStringAsFixed(2)} V', Icons.electric_bolt),
                        _metricTile(width, cols, 'Current', '${_sim.current.toStringAsFixed(2)} A', Icons.bolt),
                        _metricTile(width, cols, 'Power', '${_sim.power.toStringAsFixed(1)} W', Icons.power),
                        _metricTile(width, cols, 'Remaining', '${_sim.remainingEnergyWh.toStringAsFixed(0)} Wh', Icons.battery_charging_full),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 16),

                // 3. SIMULATION SPEED CONTROLS
                const Text('Simulation Speed:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [1, 5, 10, 25, 50, 100].map((sp) {
                      final isSel = _sim.speed == sp;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text('${sp}x'),
                          selected: isSel,
                          onSelected: (_) => _setSpeed(sp),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 16),

                // 4. PRIMARY CONTROLS (START, PAUSE, RESUME, STOP, RESET)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (_sim.status != 'RUNNING')
                      FilledButton.icon(
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: Text(_sim.status == 'PAUSED' ? '▶ RESUME' : '▶ START SIMULATION'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.white,
                        ),
                        onPressed: _isLoading ? null : (_sim.status == 'PAUSED' ? _resumeSim : _startSim),
                      )
                    else
                      FilledButton.icon(
                        icon: const Icon(Icons.pause_rounded),
                        label: const Text('Ⅱ PAUSE'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFFF59E0B),
                          foregroundColor: Colors.white,
                        ),
                        onPressed: _isLoading ? null : _pauseSim,
                      ),
                    OutlinedButton.icon(
                      icon: const Icon(Icons.stop_rounded),
                      label: const Text('■ STOP'),
                      onPressed: _isLoading ? null : _stopSim,
                    ),
                    OutlinedButton.icon(
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('↻ RESET'),
                      onPressed: _isLoading ? null : _resetSim,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // 5. LOAD PRIORITY MANAGEMENT UI
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'ADAPTIVE LOAD SHEDDING & PRIORITIES',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                    ),
                    Text(
                      '${_sim.activeLoadsCount} Active / ${_sim.shedLoadsCount} Shed',
                      style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ..._sim.loads.map((load) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: load.state
                            ? const Color(0xFF10B981).withValues(alpha: 0.4)
                            : const Color(0xFFEF4444).withValues(alpha: 0.4),
                        width: 1.2,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              load.state ? Icons.check_circle_rounded : Icons.warning_amber_rounded,
                              color: load.state ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                              size: 22,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    load.name,
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                                  ),
                                  Text(
                                    'Power: ${load.powerRating.toStringAsFixed(0)}W',
                                    style: theme.textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Priority Selector Dropdown
                            DropdownButton<String>(
                              value: load.priority,
                              isDense: true,
                              underline: const SizedBox.shrink(),
                              items: const [
                                DropdownMenuItem(value: 'CRITICAL', child: Text('CRITICAL', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold))),
                                DropdownMenuItem(value: 'HIGH', child: Text('HIGH', style: TextStyle(color: Color(0xFFF97316), fontWeight: FontWeight.bold))),
                                DropdownMenuItem(value: 'MEDIUM', child: Text('MEDIUM', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold))),
                                DropdownMenuItem(value: 'LOW', child: Text('LOW', style: TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold))),
                              ],
                              onChanged: (val) {
                                if (val != null) {
                                  _updatePriority(load.id, val);
                                }
                              },
                            ),
                            const SizedBox(width: 8),
                            Chip(
                              labelStyle: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: load.state ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                              ),
                              backgroundColor: load.state
                                  ? const Color(0xFF10B981).withValues(alpha: 0.12)
                                  : const Color(0xFFEF4444).withValues(alpha: 0.12),
                              label: Text(load.state ? 'ON' : 'OFF'),
                            ),
                          ],
                        ),
                        if (!load.state && load.shedReason.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.info_outline, size: 14, color: Color(0xFFEF4444)),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    'Reason: ${load.shedReason}',
                                    style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444), fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // 6. SIMULATION LOG & ACTIVITY TRAIL
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('SIMULATION EVENT LOG', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900)),
                const SizedBox(height: 10),
                if (_sim.logs.isEmpty)
                  const Text('No simulation events recorded yet.')
                else
                  SizedBox(
                    height: 180,
                    child: ListView.separated(
                      itemCount: _sim.logs.length,
                      separatorBuilder: (_, index) => const Divider(height: 6),
                      itemBuilder: (context, idx) {
                        final log = _sim.logs[idx];
                        final color = log.type == 'crit'
                            ? const Color(0xFFEF4444)
                            : log.type == 'warn'
                                ? const Color(0xFFF97316)
                                : log.type == 'ok'
                                    ? const Color(0xFF10B981)
                                    : theme.textTheme.bodyMedium?.color;

                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${log.timestamp}  ',
                              style: const TextStyle(fontFamily: 'monospace', fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            Expanded(
                              child: Text(
                                log.message,
                                style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        ),

        // 7. SIMULATION COMPLETION BANNER
        if (_sim.status == 'COMPLETED') ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFEF4444).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFEF4444), width: 1.5),
            ),
            child: Column(
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.sports_score_rounded, color: Color(0xFFEF4444), size: 28),
                    SizedBox(width: 8),
                    Text(
                      'Simulation Complete',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFFEF4444)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Battery reached critical minimum level. Deep discharge protection engaged.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  icon: const Icon(Icons.replay_rounded),
                  label: const Text('Restart Simulation'),
                  style: FilledButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
                  onPressed: _resetSim,
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _metricTile(double parentWidth, int cols, String label, String value, IconData icon) {
    final theme = Theme.of(context);
    final tileWidth = (parentWidth - (cols - 1) * 10) / cols;

    return Container(
      width: tileWidth,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: theme.dividerColor.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: theme.colorScheme.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: theme.textTheme.bodySmall?.copyWith(fontSize: 11)),
                Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
