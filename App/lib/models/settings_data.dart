class SettingsData {
  final double lowBatteryThreshold;
  final double criticalThreshold;
  final String priorityLoad;

  const SettingsData({
    required this.lowBatteryThreshold,
    required this.criticalThreshold,
    required this.priorityLoad,
  });

  factory SettingsData.fromJson(Map<String, dynamic> json) {
    return SettingsData(
      lowBatteryThreshold: _toDouble(json['lowBatteryThreshold'], 20),
      criticalThreshold: _toDouble(json['criticalThreshold'], 10),
      priorityLoad: (json['priorityLoad']?.toString() ?? 'load1'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lowBatteryThreshold': lowBatteryThreshold,
      'criticalThreshold': criticalThreshold,
      'priorityLoad': priorityLoad,
    };
  }

  static double _toDouble(dynamic value, double fallback) {
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse(value?.toString() ?? '') ?? fallback;
  }
}
