class LoadItem {
  final String id;
  final String name;
  final double powerRating;
  final String priority; // 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  final bool state;
  final String shedReason;

  const LoadItem({
    required this.id,
    required this.name,
    required this.powerRating,
    required this.priority,
    required this.state,
    this.shedReason = '',
  });

  factory LoadItem.fromJson(Map<String, dynamic> json) {
    return LoadItem(
      id: json['id'] as String? ?? 'load',
      name: json['name'] as String? ?? 'Load',
      powerRating: (json['powerRating'] as num?)?.toDouble() ?? 50.0,
      priority: (json['priority'] as String?)?.toUpperCase() ?? 'MEDIUM',
      state: json['state'] == true,
      shedReason: json['shedReason'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'powerRating': powerRating,
        'priority': priority,
        'state': state,
        'shedReason': shedReason,
      };

  LoadItem copyWith({
    String? id,
    String? name,
    double? powerRating,
    String? priority,
    bool? state,
    String? shedReason,
  }) {
    return LoadItem(
      id: id ?? this.id,
      name: name ?? this.name,
      powerRating: powerRating ?? this.powerRating,
      priority: priority ?? this.priority,
      state: state ?? this.state,
      shedReason: shedReason ?? this.shedReason,
    );
  }
}

class SimulationLogEntry {
  final String id;
  final String timestamp;
  final String message;
  final String type; // 'info', 'warn', 'crit', 'ok'
  final double soc;

  const SimulationLogEntry({
    required this.id,
    required this.timestamp,
    required this.message,
    required this.type,
    required this.soc,
  });

  factory SimulationLogEntry.fromJson(Map<String, dynamic> json) {
    return SimulationLogEntry(
      id: json['id'] as String? ?? '',
      timestamp: json['timestamp'] as String? ?? '',
      message: json['message'] as String? ?? '',
      type: json['type'] as String? ?? 'info',
      soc: (json['soc'] as num?)?.toDouble() ?? 100.0,
    );
  }
}

class SimulationStatus {
  final String batterySource; // 'REAL' or 'SIMULATION'
  final String status; // 'IDLE', 'RUNNING', 'PAUSED', 'STOPPED', 'COMPLETED'
  final double soc;
  final int speed;
  final double voltage;
  final double current;
  final double power;
  final double temperature;
  final double remainingEnergyWh;
  final double activePower;
  final int activeLoadsCount;
  final int shedLoadsCount;
  final int totalLoadsCount;
  final List<LoadItem> loads;
  final List<SimulationLogEntry> logs;

  const SimulationStatus({
    required this.batterySource,
    required this.status,
    required this.soc,
    required this.speed,
    required this.voltage,
    required this.current,
    required this.power,
    required this.temperature,
    required this.remainingEnergyWh,
    required this.activePower,
    required this.activeLoadsCount,
    required this.shedLoadsCount,
    required this.totalLoadsCount,
    required this.loads,
    required this.logs,
  });

  factory SimulationStatus.initial() {
    return const SimulationStatus(
      batterySource: 'REAL',
      status: 'IDLE',
      soc: 100.0,
      speed: 1,
      voltage: 12.6,
      current: 0.0,
      power: 0.0,
      temperature: 28.5,
      remainingEnergyWh: 100.0,
      activePower: 0.0,
      activeLoadsCount: 2,
      shedLoadsCount: 0,
      totalLoadsCount: 2,
      loads: [
        LoadItem(
          id: 'load1',
          name: 'WiFi Router & Primary Load',
          powerRating: 65.0,
          priority: 'HIGH',
          state: true,
        ),
        LoadItem(
          id: 'load2',
          name: 'Lighting & Secondary Load',
          powerRating: 45.0,
          priority: 'LOW',
          state: true,
        ),
      ],
      logs: [],
    );
  }

  factory SimulationStatus.fromJson(Map<String, dynamic> json) {
    final rawLoads = json['loads'] as List<dynamic>? ?? [];
    final rawLogs = json['logs'] as List<dynamic>? ?? [];

    return SimulationStatus(
      batterySource: json['batterySource'] as String? ?? 'REAL',
      status: json['status'] as String? ?? 'IDLE',
      soc: (json['soc'] as num?)?.toDouble() ?? 100.0,
      speed: (json['speed'] as num?)?.toInt() ?? 1,
      voltage: (json['voltage'] as num?)?.toDouble() ?? 12.6,
      current: (json['current'] as num?)?.toDouble() ?? 0.0,
      power: (json['power'] as num?)?.toDouble() ?? 0.0,
      temperature: (json['temperature'] as num?)?.toDouble() ?? 28.5,
      remainingEnergyWh: (json['remainingEnergyWh'] as num?)?.toDouble() ?? 100.0,
      activePower: (json['activePower'] as num?)?.toDouble() ?? 0.0,
      activeLoadsCount: (json['activeLoadsCount'] as num?)?.toInt() ?? 0,
      shedLoadsCount: (json['shedLoadsCount'] as num?)?.toInt() ?? 0,
      totalLoadsCount: (json['totalLoadsCount'] as num?)?.toInt() ?? 0,
      loads: rawLoads.map((item) => LoadItem.fromJson(item as Map<String, dynamic>)).toList(),
      logs: rawLogs.map((item) => SimulationLogEntry.fromJson(item as Map<String, dynamic>)).toList(),
    );
  }
}
