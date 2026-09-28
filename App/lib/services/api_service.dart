import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/sensor_data.dart';
import '../models/settings_data.dart';
import '../models/simulation_data.dart';

class ApiService {
  ApiService(this.baseUrl);

  final String baseUrl;

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  Future<SensorData> fetchSensorData() async {
    final response = await http.get(_uri('/data')).timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
    return SensorData.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> fetchLoads() async {
    final response = await http.get(_uri('/loads')).timeout(const Duration(seconds: 5));
    _throwIfFailed(response);

    final map = jsonDecode(response.body) as Map<String, dynamic>;
    return {
      'load1': map['load1'] == true,
      'load2': map['load2'] == true,
      'supply': map['supply'] == true || map['source'] == true,
      'source': map['source'] == true || map['supply'] == true,
      'espOnline': map['espOnline'] == true,
      'lastEspSeen': map['lastEspSeen'],
    };
  }

  /// Sets or toggles a relay state.
  /// If [targetState] is provided, sets explicit ON (`true`) or OFF (`false`).
  /// If [targetState] is null, inverts (toggles) current relay state.
  Future<bool> setLoadState(dynamic id, {bool? targetState}) async {
    final String target = (id == 3 || id == '3' || id == 'supply' || id == 'source')
        ? 'supply'
        : (id is int ? 'load$id' : '$id');

    http.Response response;
    if (targetState != null) {
      response = await http
          .post(
            _uri('/load/$target'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'state': targetState}),
          )
          .timeout(const Duration(seconds: 6));
    } else {
      response = await http.post(_uri('/load/$target')).timeout(const Duration(seconds: 6));
    }

    _throwIfFailed(response);
    final map = jsonDecode(response.body) as Map<String, dynamic>;
    return map['state'] == true;
  }

  Future<bool> toggleLoad(dynamic id) async {
    return setLoadState(id);
  }

  Future<void> batchSetLoads({
    bool? load1,
    bool? load2,
    bool? supply,
  }) async {
    final Map<String, dynamic> body = {};
    if (load1 != null) body['load1'] = load1;
    if (load2 != null) body['load2'] = load2;
    if (supply != null) {
      body['supply'] = supply;
      body['source'] = supply;
    }

    final response = await http
        .post(
          _uri('/loads/set'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 6));
    _throwIfFailed(response);
  }

  Future<SettingsData> fetchSettings() async {
    final response = await http.get(_uri('/api/settings')).timeout(const Duration(seconds: 5));
    _throwIfFailed(response);

    final body = jsonDecode(response.body);
    if (body is Map<String, dynamic>) {
      return SettingsData.fromJson(body);
    }
    return const SettingsData(
      lowBatteryThreshold: 20,
      criticalThreshold: 10,
      priorityLoad: 'load1',
    );
  }

  Future<void> upsertSettings(SettingsData settings) async {
    final response = await http.post(
      _uri('/api/settings'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(settings.toJson()),
    ).timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
  }

  Future<void> updateEnvironment({
    required double temperature,
    required double humidity,
    required double distance,
    required double battery,
    required double inputVoltage,
    double current = 0.0,
  }) async {
    final response = await http.post(
      _uri('/data'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'temperature': temperature,
        'humidity': humidity,
        'distance': distance,
        'battery': battery,
        'inputVoltage': inputVoltage,
        'current': current,
      }),
    ).timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
  }

  // --- SIMULATION API ENDPOINTS ---

  Future<SimulationStatus> fetchSimulationStatus() async {
    final response = await http.get(_uri('/simulation/status')).timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
    final map = jsonDecode(response.body) as Map<String, dynamic>;
    return SimulationStatus.fromJson(map);
  }

  Future<SimulationStatus> startSimulation() async {
    final response = await http.post(_uri('/simulation/start')).timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
    final map = jsonDecode(response.body) as Map<String, dynamic>;
    return SimulationStatus.fromJson(map['status'] as Map<String, dynamic>);
  }

  Future<SimulationStatus> pauseSimulation() async {
    final response = await http.post(_uri('/simulation/pause')).timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
    final map = jsonDecode(response.body) as Map<String, dynamic>;
    return SimulationStatus.fromJson(map['status'] as Map<String, dynamic>);
  }

  Future<SimulationStatus> resumeSimulation() async {
    final response = await http.post(_uri('/simulation/resume')).timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
    final map = jsonDecode(response.body) as Map<String, dynamic>;
    return SimulationStatus.fromJson(map['status'] as Map<String, dynamic>);
  }

  Future<SimulationStatus> stopSimulation() async {
    final response = await http.post(_uri('/simulation/stop')).timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
    final map = jsonDecode(response.body) as Map<String, dynamic>;
    return SimulationStatus.fromJson(map['status'] as Map<String, dynamic>);
  }

  Future<SimulationStatus> resetSimulation() async {
    final response = await http.post(_uri('/simulation/reset')).timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
    final map = jsonDecode(response.body) as Map<String, dynamic>;
    return SimulationStatus.fromJson(map['status'] as Map<String, dynamic>);
  }

  Future<SimulationStatus> setBatterySource(String source) async {
    final response = await http
        .post(
          _uri('/simulation/source'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'source': source}),
        )
        .timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
    final map = jsonDecode(response.body) as Map<String, dynamic>;
    return SimulationStatus.fromJson(map['status'] as Map<String, dynamic>);
  }

  Future<SimulationStatus> setSimulationSpeed(int speed) async {
    final response = await http
        .post(
          _uri('/simulation/speed'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'speed': speed}),
        )
        .timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
    final map = jsonDecode(response.body) as Map<String, dynamic>;
    return SimulationStatus.fromJson(map['status'] as Map<String, dynamic>);
  }

  Future<void> updateLoadPriority(
    String id, {
    String? priority,
    double? powerRating,
    String? name,
  }) async {
    final Map<String, dynamic> body = {};
    if (priority != null) body['priority'] = priority;
    if (powerRating != null) body['powerRating'] = powerRating;
    if (name != null) body['name'] = name;

    final response = await http
        .put(
          _uri('/loads/$id/priority'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 5));
    _throwIfFailed(response);
  }

  void _throwIfFailed(http.Response response) {
    if (response.statusCode >= 400) {
      throw Exception('API call failed: ${response.statusCode} ${response.body}');
    }
  }
}
