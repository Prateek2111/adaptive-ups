class SensorData {
  final double temperature;
  final double humidity;
  final double distance;
  final double battery;
  final double inputVoltage;
  final double current;
  final double dcVoltage;
  final double dcCurrent;

  const SensorData({
    required this.temperature,
    required this.humidity,
    required this.distance,
    required this.battery,
    required this.inputVoltage,
    required this.current,
    this.dcVoltage = 12.6,
    this.dcCurrent = 0.0,
  });

  factory SensorData.fromJson(Map<String, dynamic> json) {
    final batt = _toDouble(json['battery']);
    final defaultDcV = 9.0 + (batt / 100.0) * 3.6;
    return SensorData(
      temperature: _toDouble(json['temperature']),
      humidity: _toDouble(json['humidity']),
      distance: _toDouble(json['distance']),
      battery: batt,
      inputVoltage: _toDouble(json['inputVoltage']),
      current: _toDouble(json['current']),
      dcVoltage: json['dcVoltage'] != null ? _toDouble(json['dcVoltage']) : defaultDcV,
      dcCurrent: _toDouble(json['dcCurrent']),
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }
}
