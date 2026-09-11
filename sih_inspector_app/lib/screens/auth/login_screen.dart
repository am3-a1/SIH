import 'package:flutter/material.dart';
import '../../core/network/oauth2_client.dart';
import '../inspections/list_screen.dart';
import '../inspections/audit_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController(text: 'inspector_delhi');
  final _passwordController = TextEditingController(text: 'pass123');
  bool _isLoading = false;
  String _selectedRole = 'DISTRICT_INSPECTOR';

  final List<Map<String, dynamic>> _roleProfiles = [
    {
      'username': 'inspector_delhi',
      'role': 'DISTRICT_INSPECTOR',
      'label': 'Sunita Rao (Onsite Field Inspector - Delhi)',
      'has_assignment': true,
      'assignment': {
        'facility_id': 'DOSJE-DL-001',
        'name': 'Snehalaya Senior Citizens Home',
        'scheme': 'AVYAY (Atal Vayo Abhyuday Yojana)',
        'location': 'Sector 4, R.K. Puram, New Delhi',
        'lat': 28.5672,
        'lon': 77.1734,
        'enrolled': 88,
        'capacity': 100,
        'inspection_type': 'SURPRISE_AUDIT',
        'inspection_id': 'INSP-2026-001',
      }
    },
    {
      'username': 'auditor_flying_squad',
      'role': 'SURPRISE_AUDITOR',
      'label': 'Vikramaditya Roy (Flying Squad Auditor - HQ)',
      'has_assignment': true,
      'assignment': {
        'facility_id': 'DOSJE-PB-002',
        'name': 'Nasha Mukti Punarvas Kendra IRCA',
        'scheme': 'NAPDDR (Drug Demand Reduction)',
        'location': 'Circular Road, Amritsar, Punjab',
        'lat': 31.6340,
        'lon': 74.8723,
        'enrolled': 42,
        'capacity': 60,
        'inspection_type': 'SURPRISE_AUDIT',
        'inspection_id': 'INSP-2026-002',
      }
    },
    {
      'username': 'admin_director',
      'role': 'NATIONAL_ADMIN',
      'label': 'Dr. Rajesh Bhushan (MoSJE Central Director)',
      'has_assignment': false,
    },
    {
      'username': 'ngo_head_snehalaya',
      'role': 'FACILITY_HEAD',
      'label': 'Anil Verma (NGO Facility In-Charge)',
      'has_assignment': false,
    },
  ];

  Map<String, dynamic>? get _currentProfile {
    try {
      return _roleProfiles.firstWhere((p) => p['username'] == _usernameController.text);
    } catch (_) {
      return null;
    }
  }

  void _onRoleChanged(String? username) {
    if (username == null) return;
    final profile = _roleProfiles.firstWhere((p) => p['username'] == username);
    setState(() {
      _usernameController.text = username;
      _selectedRole = profile['role'] as String;
    });
  }

  Future<void> _handleLogin({bool directToHandheldAudit = true}) async {
    setState(() => _isLoading = true);
    final result = await OAuth2Client.login(_usernameController.text, _passwordController.text);
    setState(() => _isLoading = false);

    if (result['success'] && mounted) {
      final profile = _currentProfile;
      if (directToHandheldAudit && profile != null && profile['has_assignment'] == true && profile['assignment'] != null) {
        // Direct redirect to handheld inspection portal to conduct inspection
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => AuditScreen(facility: profile['assignment'] as Map<String, dynamic>),
          ),
        );
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const InspectionListScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: const BoxDecoration(
                        color: Color(0xFF1E3A8A),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.verified_user, color: Colors.white, size: 40),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Department of Social Justice & Empowerment',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1E3A8A)),
                    ),
                    const Text(
                      'Smart Real-Time Monitoring & Inspection (SIH26095)',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const Divider(height: 32),
                    DropdownButtonFormField<String>(
                      value: _usernameController.text,
                      decoration: const InputDecoration(
                        labelText: 'Select Officer Role Profile',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.badge),
                      ),
                      items: _roleProfiles.map((p) => DropdownMenuItem(
                        value: p['username'],
                        child: Text(p['label']!),
                      )).toList(),
                      onChanged: _onRoleChanged,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _usernameController,
                      decoration: const InputDecoration(
                        labelText: 'Officer Username / ID',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.person),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'GovCloud Password',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.lock),
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (_currentProfile != null && _currentProfile!['has_assignment'] == true) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          border: Border.all(color: const Color(0xFFF59E0B)),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.notification_important, color: Color(0xFFDC2626), size: 16),
                                SizedBox(width: 6),
                                Text(
                                  'ASSIGNED UNANNOUNCED AUDIT',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFB45309),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _currentProfile!['assignment']['name'] as String,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                            Text(
                              _currentProfile!['assignment']['scheme'] as String,
                              style: const TextStyle(fontSize: 10, color: Color(0xFF1E3A8A)),
                            ),
                            Text(
                              _currentProfile!['assignment']['location'] as String,
                              style: const TextStyle(fontSize: 10, color: Colors.black54),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E3A8A),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.handyman, size: 18),
                        onPressed: _isLoading ? null : () => _handleLogin(directToHandheldAudit: true),
                        label: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(
                                (_currentProfile != null && _currentProfile!['has_assignment'] == true)
                                    ? 'Login to Handheld Portal (Conduct Audit)'
                                    : 'Authenticate with OAuth2',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                      ),
                    ),
                    if (_currentProfile != null && _currentProfile!['has_assignment'] == true) ...[
                      const SizedBox(height: 8),
                      TextButton.icon(
                        icon: const Icon(Icons.format_list_bulleted, size: 16),
                        onPressed: _isLoading ? null : () => _handleLogin(directToHandheldAudit: false),
                        label: const Text('Or view all inspections list', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                    const SizedBox(height: 12),
                    const Text(
                      'Secured with AES-256-GCM & RBAC Multi-Tier Authorization',
                      style: TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
