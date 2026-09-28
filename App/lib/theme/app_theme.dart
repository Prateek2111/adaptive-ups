import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData darkTheme() {
    const bg = Color(0xFF0F1117);
    const card = Color(0xFF1A1D27);
    const accent = Color(0xFF3B82F6);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bg,
      colorScheme: const ColorScheme.dark(
        primary: accent,
        secondary: Color(0xFF34D399),
        surface: card,
      ),
      cardTheme: CardThemeData(
        color: card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF0F1117),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF3D4160)),
        ),
      ),
    );
  }

  static ThemeData lightTheme() {
    const bg = Color(0xFFF0F2F5);
    const card = Color(0xFFFFFFFF);
    const accent = Color(0xFF2563EB);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: bg,
      colorScheme: const ColorScheme.light(
        primary: accent,
        secondary: Color(0xFF15803D),
        surface: card,
      ),
      cardTheme: CardThemeData(
        color: card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFFB8BDD0)),
        ),
      ),
    );
  }
}
