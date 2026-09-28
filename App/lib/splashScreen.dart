import 'package:flutter/material.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {

  @override
  void initState() {
    super.initState();

    // Timer(Duration(seconds: 3), () {
    //   Navigator.pushReplacementNamed(context, '/home');});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SizedBox.expand(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Image.asset(
              'assets/icon/splashScreen.png',
              fit: BoxFit.contain,
            ),
          ),
        ),
      ),
    );
  }
}