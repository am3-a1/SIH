import 'package:flutter/material.dart';
import 'screens/auth/login_screen.dart';
import 'screens/inspections/list_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DoSJEInspectorApp());
}

class DoSJEInspectorApp extends StatelessWidget {
  const DoSJEInspectorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DoSJE Mobile Inspector',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A8A), // Government Navy Blue
          primary: const Color(0xFF1E3A8A),
          secondary: const Color(0xFF0D9488), // Teal accent
          background: const Color(0xFFF8FAFC),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E3A8A),
          foregroundColor: Colors.white,
          elevation: 2,
        ),
        cardTheme: CardTheme(
          elevation: 1.5,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      home: const LoginScreen(),
      routes: {
        '/inspections': (context) => const InspectionListScreen(),
      },
    );
  }
}
