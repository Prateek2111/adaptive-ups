import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/app_config.dart';
import 'models/log_entry.dart';
import 'models/sensor_data.dart';
import 'models/settings_data.dart';
import 'services/api_service.dart';
import 'theme/app_theme.dart';
import 'widgets/summary_card.dart';
import 'widgets/simulation_dashboard_panel.dart';

void main() {
  runApp(const AdaptiveUpsApp());
}

class AdaptiveUpsApp extends StatefulWidget {
  const AdaptiveUpsApp({super.key});

  @override
  State<AdaptiveUpsApp> createState() => _AdaptiveUpsAppState();
}

class _AdaptiveUpsAppState extends State<AdaptiveUpsApp> {
  bool _isDark = true;

  @override
  void initState() {
    super.initState();
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final theme = prefs.getString('ups-theme') ?? 'dark';
    setState(() {
      _isDark = theme == 'dark';
    });
  }

  Future<void> _toggleTheme() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _isDark = !_isDark;
    });
    await prefs.setString('ups-theme', _isDark ? 'dark' : 'light');
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'A-UPS Smart Dashboard',
      theme: AppTheme.lightTheme(),
      darkTheme: AppTheme.darkTheme(),
      themeMode: _isDark ? ThemeMode.dark : ThemeMode.light,
      home: SplashScreen(
        child: FacultyIntroScreen(
          child: UpsDashboard(
            isDark: _isDark,
            onThemeToggle: _toggleTheme,
          ),
        ),
      ),
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(seconds: 2), () {
      if (!mounted) {
        return;
      }
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => widget.child,
        ),
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            'assets/icon/splashScreen.png',
            fit: BoxFit.cover,
          ),
          Container(color: Colors.black.withValues(alpha: 0.18)),
          const Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: EdgeInsets.only(bottom: 44),
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.6,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class FacultyIntroScreen extends StatefulWidget {
  const FacultyIntroScreen({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  State<FacultyIntroScreen> createState() => _FacultyIntroScreenState();
}

class _FacultyIntroScreenState extends State<FacultyIntroScreen> {
  static const List<String> _students = <String>[
    'Ayush Sachan',
    'Prakhar Srivastaav',
    'Praveen Kumar',
    'Prateek Khare',
    'Ayush Maurya',
  ];

  Widget _animatedIn({required int order, required Widget child}) {
    final durationMs = 420 + (order * 120);
    return TweenAnimationBuilder<double>(
      duration: Duration(milliseconds: durationMs),
      curve: Curves.easeOutCubic,
      tween: Tween<double>(begin: 0, end: 1),
      child: child,
      builder: (context, value, innerChild) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, (1 - value) * 28),
            child: innerChild,
          ),
        );
      },
    );
  }

  Widget _glassCard({
    required ThemeData theme,
    required bool isDark,
    required Widget child,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: Container(
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF152238).withValues(alpha: 0.55)
                : Colors.white.withValues(alpha: 0.72),
            border: Border.all(
              color: theme.colorScheme.onSurface.withValues(alpha: isDark ? 0.12 : 0.08),
            ),
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.30 : 0.08),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }

  void _goToHome() {
    if (!mounted) {
      return;
    }
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => widget.child,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? const [Color(0xFF050A12), Color(0xFF0D1A2E), Color(0xFF07111D)]
                : const [Color(0xFFEAF4FF), Color(0xFFF7FCFF), Color(0xFFEEF7FF)],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              top: -90,
              right: -60,
              child: Container(
                width: 210,
                height: 210,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withValues(alpha: 0.22),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Positioned(
              bottom: -60,
              left: -40,
              child: Container(
                width: 190,
                height: 190,
                decoration: BoxDecoration(
                  color: theme.colorScheme.secondary.withValues(alpha: 0.18),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            SafeArea(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(18, 18, 18, 22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _animatedIn(
                          order: 1,
                          child: Text(
                            'Adaptive UPS',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.6,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        _animatedIn(
                          order: 2,
                          child: Text(
                            'Smart Backup Power Management System',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodyLarge?.copyWith(
                              color: theme.colorScheme.onSurface.withValues(alpha: 0.72),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        _animatedIn(
                          order: 3,
                          child: _glassCard(
                            theme: theme,
                            isDark: isDark,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(18),
                                    child: AspectRatio(
                                      aspectRatio: 16 / 10,
                                      child: Image.asset(
                                        'assets/icon/logo.jpeg',
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  Container(
                                    padding:
                                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: theme.colorScheme.primary.withValues(alpha: 0.16),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      'Faculty Mentor',
                                      style: theme.textTheme.labelLarge?.copyWith(
                                        color: theme.colorScheme.primary,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    'Dr Navdeep Singh',
                                    textAlign: TextAlign.center,
                                    style: theme.textTheme.headlineSmall?.copyWith(
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        _animatedIn(
                          order: 4,
                          child: _glassCard(
                            theme: theme,
                            isDark: isDark,
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Group Students',
                                    style: theme.textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  ..._students.asMap().entries.map((entry) {
                                    final index = entry.key + 1;
                                    final name = entry.value;
                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 10,
                                        ),
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(14),
                                          color: theme.colorScheme.secondary.withValues(alpha: 0.13),
                                        ),
                                        child: Row(
                                          children: [
                                            CircleAvatar(
                                              radius: 12,
                                              backgroundColor: theme.colorScheme.primary
                                                  .withValues(alpha: 0.22),
                                              child: Text(
                                                '$index',
                                                style: theme.textTheme.labelSmall?.copyWith(
                                                  fontWeight: FontWeight.w800,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Text(
                                                name,
                                                style: theme.textTheme.bodyLarge?.copyWith(
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  }),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),
                        _animatedIn(
                          order: 5,
                          child: FilledButton.icon(
                            onPressed: _goToHome,
                            icon: const Icon(Icons.arrow_forward_rounded),
                            label: const Text('Continue To Dashboard'),
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 15),
                              textStyle: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
class UpsDashboard extends StatefulWidget {
  const UpsDashboard({
    super.key,
    required this.isDark,
    required this.onThemeToggle,
  });

  final bool isDark;
  final Future<void> Function() onThemeToggle;

  @override
  State<UpsDashboard> createState() => _UpsDashboardState();
}

class _UpsDashboardState extends State<UpsDashboard> {
  late final ApiService _api;
  late final ApiService _fallbackApi;
  Timer? _clockTimer;
  Timer? _pollTimer;
  int _tabIndex = 0;

  double _battPct = 78;
  bool _onUtility = true;
  String _priority = 'load1';

  bool _manualL1 = true;
  bool _manualL2 = true;
  bool _manualSupply = true;
  bool _load1On = true;
  bool _load2On = true;
  bool _supplyOn = true;

  double _systemTemp = 0;
  double _systemHum = 0;
  double _sysDist = 0;
  double _systemBattery = 78;
  double _systemVoltage = 224;
  double _systemCurrent = 0.0;

  double _lowThresh = 20;
  double _critThresh = 10;

  String _clock = '';
  String _espMessage = '';
  final List<LogEntry> _logs = <LogEntry>[];

  String _prevBatteryMode = 'normal';
  bool _busySync = false;
  bool _isToggling = false;
  bool _espOnline = false;
  bool _autoLoadSheddingEnabled = false;
  String? _pendingRelayId;

  @override
  void initState() {
    super.initState();
    _api = ApiService(AppConfig.apiBase);
    _fallbackApi = ApiService(AppConfig.fallbackApiBase);
    _clock = _timeNow();
    _initialize();
  }

  Future<void> _initialize() async {
    _addLog('System initialised - Flutter frontend connected', 'ok');
    await _pollAll();

    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _clock = _timeNow();
      });
    });

    _pollTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      _pollAll();
    });
  }

  Future<void> _pollAll() async {
    await Future.wait(<Future<void>>[
      _fetchFromBackend(),
      _fetchLoads(),
    ]);
    _applyAutomationLogic();
  }

  Future<void> _fetchLoads() async {
    if (_isToggling) {
      return;
    }
    try {
      Map<String, dynamic> loads;
      try {
        loads = await _api.fetchLoads();
      } catch (_) {
        loads = await _fallbackApi.fetchLoads();
      }
      if (!mounted || _isToggling) {
        return;
      }
      setState(() {
        _manualL1 = (loads['load1'] == true);
        _manualL2 = (loads['load2'] == true);
        _manualSupply = (loads['supply'] == true || loads['source'] == true);
        _supplyOn = _manualSupply;
        _load1On = _manualL1;
        _load2On = _manualL2;
        _espOnline = (loads['espOnline'] == true);
      });
    } catch (_) {
      // Ignore transient polling errors.
    }
  }

  Future<void> _fetchFromBackend() async {
    try {
      SensorData sensor;
      SettingsData settings;
      try {
        sensor = await _api.fetchSensorData();
        settings = await _api.fetchSettings();
      } catch (_) {
        sensor = await _fallbackApi.fetchSensorData();
        settings = await _fallbackApi.fetchSettings();
      }

      if (!mounted) {
        return;
      }

      setState(() {
        _systemTemp = sensor.temperature;
        _systemHum = sensor.humidity;
        _sysDist = sensor.distance;
        _systemBattery = sensor.battery;
        _systemVoltage = sensor.inputVoltage;
        _systemCurrent = sensor.current;
        _battPct = sensor.battery;

        _onUtility = _supplyOn && _systemVoltage > 50;

        _lowThresh = settings.lowBatteryThreshold;
        _critThresh = settings.criticalThreshold;
        _priority = settings.priorityLoad;
        _espMessage = 'Realtime sync at ${_timeNow()} • ${_espOnline ? "ESP32 Online" : "Cloud Active"}';
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _espMessage = 'Backend offline (Check network/server)';
      });
    }
  }

  Future<void> _setRelayState(dynamic id, {bool? targetState}) async {
    if (_isToggling) {
      return;
    }
    _isToggling = true;

    final isSource = (id == 3 || id == '3' || id == 'supply' || id == 'source');
    final isL1 = (id == 1 || id == '1' || id == 'load1');
    final isL2 = (id == 2 || id == '2' || id == 'load2');
    final relayTag = isSource ? 'source' : (isL1 ? 'load1' : 'load2');

    final bool prevL1 = _load1On;
    final bool prevL2 = _load2On;
    final bool prevSupply = _supplyOn;

    final bool desired = targetState ?? (isSource ? !_supplyOn : (isL1 ? !_load1On : !_load2On));

    // Optimistic UI state update for immediate feedback
    setState(() {
      _pendingRelayId = relayTag;
      if (isL1) {
        _manualL1 = desired;
        _load1On = desired;
      } else if (isL2) {
        _manualL2 = desired;
        _load2On = desired;
      } else {
        _manualSupply = desired;
        _supplyOn = desired;
      }
    });

    try {
      bool state;
      try {
        state = await _api.setLoadState(id, targetState: desired);
      } catch (_) {
        state = await _fallbackApi.setLoadState(id, targetState: desired);
      }

      if (!mounted) {
        return;
      }
      setState(() {
        if (isL1) {
          _manualL1 = state;
          _load1On = state;
        } else if (isL2) {
          _manualL2 = state;
          _load2On = state;
        } else {
          _manualSupply = state;
          _supplyOn = state;
        }
      });
      final label = isSource ? 'Source Relay (GPIO 18)' : (isL1 ? 'Load 1 (GPIO 5)' : 'Load 2 (GPIO 15)');
      final statusStr = isSource
          ? (state ? 'MAINS GRID' : 'INVERTER BACKUP')
          : (state ? 'CONNECTED (ON)' : 'ISOLATED (OFF)');
      _addLog('$label switched to $statusStr', 'ok');
    } catch (e) {
      // Revert optimistic change on network failure
      if (mounted) {
        setState(() {
          _load1On = prevL1;
          _load2On = prevL2;
          _supplyOn = prevSupply;
          _manualL1 = prevL1;
          _manualL2 = prevL2;
          _manualSupply = prevSupply;
        });
        final label = isSource ? 'Source Relay' : (isL1 ? 'Load 1' : 'Load 2');
        _addLog('Failed to switch $label: Network error', 'crit');
      }
    } finally {
      if (mounted) {
        setState(() {
          _pendingRelayId = null;
        });
      }
      await Future.delayed(const Duration(milliseconds: 600));
      _isToggling = false;
    }
  }

  Future<void> _batchSetLoads({required bool state}) async {
    try {
      setState(() {
        _load1On = state;
        _load2On = state;
        _manualL1 = state;
        _manualL2 = state;
      });
      await _api.batchSetLoads(load1: state, load2: state);
      _addLog('All loads set to ${state ? "CONNECTED" : "ISOLATED"}', 'ok');
    } catch (_) {
      _addLog('Batch command failed: Network error', 'crit');
    }
  }

  Future<void> _syncSettingsToDb() async {
    if (_busySync) {
      return;
    }
    _busySync = true;

    try {
      final settings = SettingsData(
        priorityLoad: _priority,
        lowBatteryThreshold: _lowThresh,
        criticalThreshold: _critThresh,
      );
      await _api.upsertSettings(settings);
      if (!mounted) {
        return;
      }
      setState(() {
        _espMessage = 'Settings synced to MongoDB';
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _espMessage = 'Failed to sync settings to DB';
      });
    } finally {
      _busySync = false;
    }
  }

  Future<void> _setPriorityAndSync(String next) async {
    if (!mounted) {
      return;
    }
    setState(() {
      _priority = next;
    });

    final label = next == 'auto'
        ? 'Auto (default Load-1)'
        : next == 'load1'
            ? 'Load-1'
            : 'Load-2';
    _addLog('Priority set to: $label', 'ok');

    await _syncSettingsToDb();
    _applyAutomationLogic();
  }

  Future<void> _simEnvUpdate(double temp, double hum, double dist) async {
    try {
      await _api.updateEnvironment(
        temperature: temp,
        humidity: hum,
        distance: dist,
        battery: _systemBattery,
        inputVoltage: _systemVoltage,
        current: _systemCurrent,
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _espMessage = 'Failed to send environment update';
      });
    }
  }

  void _applyAutomationLogic() {
    final low = _lowThresh;
    final crit = _critThresh;
    var mode = 'normal';

    final bool currentlyOnUtility = _supplyOn && _systemVoltage > 50;

    // Only apply automated battery load shedding if user enabled Auto Shedding Mode AND running on battery/inverter
    if (_autoLoadSheddingEnabled && !currentlyOnUtility && _battPct > 0) {
      if (_battPct <= crit && _load2On && !_isToggling) {
        mode = 'critical';
        _setRelayState(2, targetState: false);
      } else if (_battPct <= low && !_isToggling) {
        mode = 'low';
        if (_priority == 'load2' && _load1On) {
          _setRelayState(1, targetState: false);
        } else if (_priority != 'load2' && _load2On) {
          _setRelayState(2, targetState: false);
        }
      }
    }

    if (!mounted) {
      return;
    }

    setState(() {
      _onUtility = currentlyOnUtility;
    });

    if (_prevBatteryMode != mode) {
      if (mode == 'critical') {
        _addLog('CRITICAL: Auto-shedding engaged - Load-2 OFF', 'crit');
      } else if (mode == 'low') {
        final active = _priority == 'load2' ? 'Load-2' : 'Load-1';
        _addLog('Low battery - Auto shedding $active priority', 'warn');
      }
      _prevBatteryMode = mode;
    }
  }

  String _batteryStatusText() => _onUtility ? 'Charging' : 'Discharging';

  String _timeNow() {
    final d = DateTime.now();
    final hh = d.hour.toString().padLeft(2, '0');
    final mm = d.minute.toString().padLeft(2, '0');
    final ss = d.second.toString().padLeft(2, '0');
    return '$hh:$mm:$ss';
  }

  void _addLog(String message, String type) {
    if (!mounted) {
      return;
    }
    setState(() {
      _logs.insert(
        0,
        LogEntry(
          time: _timeNow(),
          message: message,
          type: type,
        ),
      );
      if (_logs.length > 40) {
        _logs.removeRange(40, _logs.length);
      }
    });
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final pct = _battPct.clamp(0, 100).toDouble();
    final isCritical = pct <= _critThresh;
    final isLow = !isCritical && pct <= _lowThresh;
    final activeLoads = (_load1On ? 1 : 0) + (_load2On ? 1 : 0);

    final tempLabel = _systemTemp > 45
        ? 'High - Fan Active'
        : _systemTemp > 35
            ? 'Warm'
            : 'Optimal';

    final tempColor = _systemTemp > 45
        ? const Color(0xFFEF4444)
        : _systemTemp > 35
            ? const Color(0xFFFB923C)
            : theme.textTheme.bodySmall?.color;

    final battModeTag = _priority == 'auto'
        ? 'Auto mode'
        : _priority == 'load1'
            ? 'Load-1 priority'
            : 'Load-2 priority';

    return Scaffold(
      extendBody: true,
      appBar: AppBar(
        title: const Text('A-UPS Smart Dashboard'),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Text(
                _clock,
                style: theme.textTheme.labelLarge,
              ),
            ),
          ),
          IconButton(
            tooltip: 'Toggle theme',
            onPressed: widget.onThemeToggle,
            icon: Icon(widget.isDark ? Icons.dark_mode : Icons.light_mode),
          ),
        ],
      ),
      body: SafeArea(
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                theme.colorScheme.primary.withValues(alpha: 0.08),
                theme.scaffoldBackgroundColor,
                theme.scaffoldBackgroundColor,
              ],
            ),
          ),
          child: RefreshIndicator(
            onRefresh: _pollAll,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 280),
              child: _buildTabPage(
                key: ValueKey<int>(_tabIndex),
                tabIndex: _tabIndex,
                pct: pct,
                isCritical: isCritical,
                isLow: isLow,
                activeLoads: activeLoads,
                tempLabel: tempLabel,
                tempColor: tempColor,
                battModeTag: battModeTag,
              ),
            ),
          ),
        ),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: NavigationBar(
            height: 72,
            selectedIndex: _tabIndex,
            onDestinationSelected: (index) {
              setState(() {
                _tabIndex = index;
              });
            },
            destinations: const [
              NavigationDestination(icon: Icon(Icons.space_dashboard_outlined), label: 'Overview'),
              NavigationDestination(icon: Icon(Icons.power_outlined), label: 'Loads'),
              NavigationDestination(icon: Icon(Icons.tune_outlined), label: 'Controls'),
              NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Logs'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabPage({
    required Key key,
    required int tabIndex,
    required double pct,
    required bool isCritical,
    required bool isLow,
    required int activeLoads,
    required String tempLabel,
    required Color? tempColor,
    required String battModeTag,
  }) {
    switch (tabIndex) {
      case 1:
        return _buildLoadsPage(key: key);
      case 2:
        return _buildControlsPage(key: key);
      case 3:
        return _buildLogsPage(key: key);
      case 0:
      default:
        return _buildOverviewPage(
          key: key,
          pct: pct,
          isCritical: isCritical,
          isLow: isLow,
          activeLoads: activeLoads,
          tempLabel: tempLabel,
          tempColor: tempColor,
          battModeTag: battModeTag,
        );
    }
  }

  Widget _buildOverviewPage({
    required Key key,
    required double pct,
    required bool isCritical,
    required bool isLow,
    required int activeLoads,
    required String tempLabel,
    required Color? tempColor,
    required String battModeTag,
  }) {
    final theme = Theme.of(context);

    return ListView(
      key: key,
      padding: const EdgeInsets.all(16),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        _buildHeroCard(
          title: _onUtility ? 'Utility Online' : 'Battery Backup Active',
          subtitle: 'Adaptive UPS intelligent balancing in real-time',
          chipText: battModeTag,
        ),
        const SizedBox(height: 12),
        _buildAlertBanner(isCritical, isLow, pct),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            final width = constraints.maxWidth;
            final columns = width > 1100 ? 5 : width > 640 ? 3 : 1;
            return Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                SizedBox(
                  width: (width - (columns - 1) * 12) / columns,
                  child: SummaryCard(
                    label: 'AC Input Voltage',
                    value: '${_systemVoltage.toStringAsFixed(1)} V AC',
                    subtitle: _systemVoltage > 90 ? 'Mains Power Online' : 'Grid Outage (0V)',
                    subtitleColor: _systemVoltage > 90 ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                  ),
                ),
                SizedBox(
                  width: (width - (columns - 1) * 12) / columns,
                  child: SummaryCard(
                    label: 'Load Current',
                    value: '${_systemCurrent.toStringAsFixed(2)} A',
                    subtitle: 'Power: ${((_systemVoltage > 90 ? _systemVoltage : 12.0) * _systemCurrent).toStringAsFixed(1)} W',
                    subtitleColor: _systemCurrent > 0.05 ? const Color(0xFF38BDF8) : const Color(0xFF94A3B8),
                  ),
                ),
                SizedBox(
                  width: (width - (columns - 1) * 12) / columns,
                  child: SummaryCard(
                    label: 'Battery',
                    value: '${_systemBattery.toStringAsFixed(0)}%',
                    subtitle: _batteryStatusText(),
                  ),
                ),
                SizedBox(
                  width: (width - (columns - 1) * 12) / columns,
                  child: SummaryCard(
                    label: 'System Temp',
                    value: '${_systemTemp.toStringAsFixed(1)} C',
                    subtitle: tempLabel,
                    subtitleColor: tempColor,
                  ),
                ),
                SizedBox(
                  width: (width - (columns - 1) * 12) / columns,
                  child: SummaryCard(
                    label: 'Active Loads',
                    value: '$activeLoads / 2',
                    subtitle: 'Load-1 + Load-2',
                  ),
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Battery Level', style: TextStyle(fontWeight: FontWeight.w700)),
                    Chip(label: Text('${pct.toStringAsFixed(0)}%')),
                  ],
                ),
                const SizedBox(height: 12),
                LinearProgressIndicator(
                  value: pct / 100,
                  minHeight: 22,
                  borderRadius: BorderRadius.circular(12),
                  color: isCritical
                      ? const Color(0xFFEF4444)
                      : isLow
                          ? const Color(0xFFFB923C)
                          : const Color(0xFF10B981),
                ),
                const SizedBox(height: 12),
                Text(
                  'AC Input (ZMPT101B): ${_systemVoltage.toStringAsFixed(1)}V AC  |  Current (ACS712): ${_systemCurrent.toStringAsFixed(2)}A  |  Humidity ${_systemHum.toStringAsFixed(0)}%  |  Distance ${_sysDist.toStringAsFixed(0)}cm',
                  style: theme.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoadsPage({required Key key}) {
    return ListView(
      key: key,
      padding: const EdgeInsets.all(16),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        _buildHeroCard(
          title: 'Load & Supply Center',
          subtitle: 'Direct control over Load-1, Load-2, and Mains Supply Relay',
          chipText: '${_load1On ? 'L1 ON' : 'L1 OFF'} / ${_load2On ? 'L2 ON' : 'L2 OFF'} / ${_supplyOn ? 'Grid Active' : 'Supply Isolated'}',
        ),
        const SizedBox(height: 12),
        _buildLoadsCard(),
        const SizedBox(height: 12),
        _buildPriorityCard(),
      ],
    );
  }

  Widget _buildControlsPage({required Key key}) {
    return ListView(
      key: key,
      padding: const EdgeInsets.all(16),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        _buildHeroCard(
          title: 'Battery Simulation & Adaptive Shedding Lab',
          subtitle: 'Real-time software-in-the-loop battery simulation driving load management',
          chipText: _onUtility ? 'Utility Mode' : 'Simulation Active',
        ),
        const SizedBox(height: 12),
        SimulationDashboardPanel(
          api: _api,
          fallbackApi: _fallbackApi,
          isDark: widget.isDark,
          onLogAdded: _addLog,
        ),
        const SizedBox(height: 12),
        _buildSimulationCard(),
      ],
    );
  }

  Widget _buildLogsPage({required Key key}) {
    final theme = Theme.of(context);
    return ListView(
      key: key,
      padding: const EdgeInsets.all(16),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        _buildHeroCard(
          title: 'System History',
          subtitle: 'Realtime event trail and backend communication state',
          chipText: _logs.isEmpty ? 'No events' : '${_logs.length} events',
        ),
        const SizedBox(height: 12),
        _buildLogsCard(),
        const SizedBox(height: 8),
        Text(
          'Backend: ${AppConfig.apiBase}',
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildHeroCard({required String title, required String subtitle, required String chipText}) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            theme.colorScheme.primary.withValues(alpha: 0.22),
            theme.colorScheme.secondary.withValues(alpha: 0.20),
          ],
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.bolt, size: 34),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text(subtitle),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Chip(label: Text(chipText)),
        ],
      ),
    );
  }

  Widget _buildAlertBanner(bool isCritical, bool isLow, double pct) {
    if (isCritical) {
      return _alertBox(
        color: const Color(0xFF7F1D1D),
        text: 'CRITICAL: Battery at ${pct.toStringAsFixed(0)}% - deep discharge protection active!',
      );
    }

    if (isLow) {
      return _alertBox(
        color: const Color(0xFFB45309),
        text: 'Low battery: ${pct.toStringAsFixed(0)}% - load management active',
      );
    }

    return _alertBox(
      color: const Color(0xFF15803D),
      text:
          'System normal - Battery ${pct.toStringAsFixed(0)}% ${_onUtility ? 'charging' : 'on backup'}',
    );
  }

  Widget _alertBox({required Color color, required String text}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontWeight: FontWeight.w700),
      ),
    );
  }

  Widget _buildLoadsCard() {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Expanded(
                  child: Text(
                    'Relay Control Center',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _espOnline
                        ? const Color(0xFF10B981).withValues(alpha: 0.15)
                        : const Color(0xFFF59E0B).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _espOnline ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _espOnline ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _espOnline ? 'ESP32 Online' : 'ESP32 Offline',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: _espOnline ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Direct bidirectional hardware control over Relays 1, 2 & 3 via Cloud & ESP32.',
              style: theme.textTheme.bodySmall,
            ),
            const SizedBox(height: 14),

            // Automation mode switch
            Container(
              decoration: BoxDecoration(
                color: theme.colorScheme.surface.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: theme.dividerColor.withValues(alpha: 0.2)),
              ),
              child: SwitchListTile(
                secondary: Icon(
                  Icons.auto_mode_rounded,
                  color: _autoLoadSheddingEnabled ? const Color(0xFF10B981) : Colors.grey,
                ),
                title: const Text(
                  'Automated Load Shedding',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                ),
                subtitle: Text(
                  _autoLoadSheddingEnabled
                      ? 'Enabled: Auto-sheds Load 2 when on battery'
                      : 'Disabled: 100% manual control over all relays',
                  style: const TextStyle(fontSize: 12),
                ),
                value: _autoLoadSheddingEnabled,
                onChanged: (val) {
                  setState(() {
                    _autoLoadSheddingEnabled = val;
                  });
                  _addLog('Auto Load Shedding ${val ? "ENABLED" : "DISABLED"}', 'ok');
                },
              ),
            ),
            const SizedBox(height: 16),

            // RELAY 1: SOURCE SELECTOR (GPIO 18)
            _buildRelayTile(
              title: 'Relay 1: Source Selector (GPIO 18)',
              subtitle: _supplyOn
                  ? 'Active: MAINS GRID (230V AC Bypass)'
                  : 'Active: INVERTER BACKUP (Battery Power)',
              icon: _supplyOn ? Icons.power_rounded : Icons.electric_bolt_rounded,
              iconColor: _supplyOn ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
              stateText: _supplyOn ? 'MAINS' : 'INVERTER',
              stateColor: _supplyOn ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
              value: _supplyOn,
              isPending: _pendingRelayId == 'source',
              onChanged: (val) => _setRelayState('source', targetState: val),
              actions: [
                OutlinedButton.icon(
                  icon: const Icon(Icons.electrical_services, size: 16),
                  label: const Text('Set Mains'),
                  style: OutlinedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    foregroundColor: _supplyOn ? const Color(0xFF10B981) : null,
                  ),
                  onPressed: _supplyOn ? null : () => _setRelayState('source', targetState: true),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  icon: const Icon(Icons.battery_charging_full, size: 16),
                  label: const Text('Set Inverter'),
                  style: OutlinedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    foregroundColor: !_supplyOn ? const Color(0xFFF59E0B) : null,
                  ),
                  onPressed: !_supplyOn ? null : () => _setRelayState('source', targetState: false),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // RELAY 2: LOAD 1 (GPIO 5)
            _buildRelayTile(
              title: 'Relay 2: Load 1 (GPIO 5)',
              subtitle: 'Critical / Primary Circuit • Priority Load',
              icon: Icons.lightbulb_rounded,
              iconColor: _load1On ? const Color(0xFF38BDF8) : Colors.grey,
              stateText: _load1On ? 'CONNECTED (ON)' : 'ISOLATED (OFF)',
              stateColor: _load1On ? const Color(0xFF38BDF8) : Colors.grey,
              value: _load1On,
              isPending: _pendingRelayId == 'load1',
              onChanged: (val) => _setRelayState(1, targetState: val),
            ),
            const SizedBox(height: 12),

            // RELAY 3: LOAD 2 (GPIO 15)
            _buildRelayTile(
              title: 'Relay 3: Load 2 (GPIO 15)',
              subtitle: 'Secondary Circuit • Non-Critical Load',
              icon: Icons.devices_other_rounded,
              iconColor: _load2On ? const Color(0xFFA78BFA) : Colors.grey,
              stateText: _load2On ? 'CONNECTED (ON)' : 'ISOLATED (OFF)',
              stateColor: _load2On ? const Color(0xFFA78BFA) : Colors.grey,
              value: _load2On,
              isPending: _pendingRelayId == 'load2',
              onChanged: (val) => _setRelayState(2, targetState: val),
            ),
            const SizedBox(height: 16),

            // BATCH ACTION ROW
            Row(
              children: [
                Expanded(
                  child: FilledButton.tonalIcon(
                    icon: const Icon(Icons.done_all_rounded, size: 18),
                    label: const Text('All Loads ON'),
                    onPressed: () => _batchSetLoads(state: true),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton.tonalIcon(
                    icon: const Icon(Icons.power_off_rounded, size: 18),
                    label: const Text('All Loads OFF'),
                    style: FilledButton.styleFrom(
                      foregroundColor: const Color(0xFFEF4444),
                    ),
                    onPressed: () => _batchSetLoads(state: false),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRelayTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required String stateText,
    required Color stateColor,
    required bool value,
    required bool isPending,
    required ValueChanged<bool> onChanged,
    List<Widget>? actions,
  }) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: value ? stateColor.withValues(alpha: 0.4) : theme.dividerColor.withValues(alpha: 0.2),
          width: value ? 1.5 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodySmall?.copyWith(fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (isPending)
                const SizedBox(
                  width: 28,
                  height: 28,
                  child: Padding(
                    padding: EdgeInsets.all(4),
                    child: CircularProgressIndicator(strokeWidth: 2.5),
                  ),
                )
              else
                Switch(
                  value: value,
                  activeThumbColor: stateColor,
                  onChanged: onChanged,
                ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: stateColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  stateText,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: stateColor,
                  ),
                ),
              ),
              if (actions != null)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: actions,
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPriorityCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Battery Mode - Priority Selection',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ChoiceChip(
                  label: const Text('Auto (Load-1 default)'),
                  selected: _priority == 'auto',
                  onSelected: (_) => _setPriorityAndSync('auto'),
                ),
                ChoiceChip(
                  label: const Text('Load-1 Priority'),
                  selected: _priority == 'load1',
                  onSelected: (_) => _setPriorityAndSync('load1'),
                ),
                ChoiceChip(
                  label: const Text('Load-2 Priority'),
                  selected: _priority == 'load2',
                  onSelected: (_) => _setPriorityAndSync('load2'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSimulationCard() {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Simulation Controls', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text('Low threshold: ${_lowThresh.toStringAsFixed(0)}%'),
                ),
                TextButton(
                  onPressed: _syncSettingsToDb,
                  child: const Text('Save'),
                ),
              ],
            ),
            Slider(
              value: _lowThresh,
              min: 5,
              max: 50,
              divisions: 45,
              label: _lowThresh.toStringAsFixed(0),
              onChanged: (value) {
                setState(() {
                  _lowThresh = value;
                });
              },
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Text('Critical threshold: ${_critThresh.toStringAsFixed(0)}%'),
                ),
                FilledButton.tonal(
                  onPressed: _syncSettingsToDb,
                  child: const Text('Apply Thresholds'),
                ),
              ],
            ),
            Slider(
              value: _critThresh,
              min: 2,
              max: 30,
              divisions: 28,
              label: _critThresh.toStringAsFixed(0),
              onChanged: (value) {
                setState(() {
                  _critThresh = value;
                });
              },
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton(
                  onPressed: () {
                    setState(() {
                      _onUtility = false;
                      _systemVoltage = 0.0;
                    });
                    _simEnvUpdate(_systemTemp, _systemHum, _sysDist);
                    _applyAutomationLogic();
                  },
                  child: const Text('Simulate Power Failure (0V AC)'),
                ),
                OutlinedButton(
                  onPressed: () {
                    setState(() {
                      _onUtility = true;
                      _systemVoltage = 220.0;
                    });
                    _simEnvUpdate(_systemTemp, _systemHum, _sysDist);
                    _applyAutomationLogic();
                  },
                  child: const Text('Restore Utility (220V AC)'),
                ),
                OutlinedButton(
                  onPressed: () {
                    setState(() {
                      _battPct = (_battPct - 10).clamp(0, 100);
                      _systemBattery = _battPct;
                    });
                    _applyAutomationLogic();
                  },
                  child: const Text('Drain Battery (-10%)'),
                ),
                OutlinedButton(
                  onPressed: () {
                    setState(() {
                      _battPct = (_battPct + 10).clamp(0, 100);
                      _systemBattery = _battPct;
                    });
                    _applyAutomationLogic();
                  },
                  child: const Text('Charge Battery (+10%)'),
                ),
                OutlinedButton(
                  onPressed: () {
                    final next = _systemTemp + 1;
                    setState(() {
                      _systemTemp = next;
                    });
                    _simEnvUpdate(_systemTemp, _systemHum, _sysDist);
                  },
                  child: const Text('Temp Up (+1C)'),
                ),
                OutlinedButton(
                  onPressed: () {
                    final next = _systemTemp - 1;
                    setState(() {
                      _systemTemp = next;
                    });
                    _simEnvUpdate(_systemTemp, _systemHum, _sysDist);
                  },
                  child: const Text('Temp Down (-1C)'),
                ),
                OutlinedButton(
                  onPressed: () {
                    final next = (_systemHum + 5) % 105;
                    setState(() {
                      _systemHum = next;
                    });
                    _simEnvUpdate(_systemTemp, _systemHum, _sysDist);
                  },
                  child: const Text('Humidity Up (+5%)'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.4)),
              ),
              child: Text(_espMessage, style: theme.textTheme.bodySmall),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Event Log', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _logs.clear();
                    });
                  },
                  child: const Text('Clear Log'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (_logs.isEmpty)
              const Text('No events yet.')
            else
              SizedBox(
                height: 220,
                child: ListView.separated(
                  itemCount: _logs.length,
                  separatorBuilder: (_, index) => const Divider(height: 8),
                  itemBuilder: (context, index) {
                    final item = _logs[index];
                    final color = item.type == 'crit'
                        ? const Color(0xFFEF4444)
                        : item.type == 'warn'
                            ? const Color(0xFFFB923C)
                            : item.type == 'ok'
                                ? const Color(0xFF10B981)
                                : Theme.of(context).textTheme.bodyMedium?.color;

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(width: 80, child: Text(item.time, style: const TextStyle(fontFamily: 'monospace'))),
                        Expanded(
                          child: Text(
                            item.message,
                            style: TextStyle(color: color, fontWeight: FontWeight.w600),
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
    );
  }
}
