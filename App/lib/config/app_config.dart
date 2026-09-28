class AppConfig {
  static const String _apiBaseFromEnv = String.fromEnvironment(
    'API_BASE',
    defaultValue: '',
  );

  static String get apiBase {
    if (_apiBaseFromEnv.isNotEmpty) {
      return _apiBaseFromEnv;
    }

    return 'https://final-ups-code-final.onrender.com/health';
  }

  static const String fallbackApiBase = 'http://10.0.2.2:5000';
}
