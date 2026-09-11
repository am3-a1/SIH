import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/location_service.dart';
import '../../services/camera_watermark_service.dart';
import '../../core/security/aes_crypto.dart';
import '../../core/offline/sync_queue.dart';

class AuditScreen extends StatefulWidget {
  final Map<String, dynamic> facility;

  const AuditScreen({super.key, required this.facility});

  @override
  State<AuditScreen> createState() => _AuditScreenState();
}

class _AuditScreenState extends State<AuditScreen> {
  late Map<String, dynamic> _selectedFacility;
  final List<Map<String, dynamic>> _assignedFacilities = [
    {
      'facility_id': 'DOSJE-DL-001',
      'facility_name': 'Snehalaya Senior Citizens Home',
      'scheme': 'AVYAY (Atal Vayo Abhyuday Yojana)',
      'location': 'Sector 4, R.K. Puram, New Delhi',
      'lat': 28.5672,
      'lon': 77.1734,
      'type': 'SURPRISE_AUDIT',
      'capacity': 100,
      'enrolled': 88,
    },
    {
      'facility_id': 'DOSJE-PB-002',
      'facility_name': 'Nasha Mukti Punarvas Kendra (IRCA)',
      'scheme': 'NAPDDR (Drug Demand Reduction)',
      'location': 'Circular Road, Amritsar, Punjab',
      'lat': 31.6340,
      'lon': 74.8723,
      'type': 'SURPRISE_AUDIT',
      'capacity': 60,
      'enrolled': 42,
    },
    {
      'facility_id': 'DOSJE-MH-003',
      'facility_name': 'Savitribai Phule SC Girls Hostel',
      'scheme': 'PM-AJAY (SC Welfare)',
      'location': 'Ganeshkhind Road, Pune',
      'lat': 18.5204,
      'lon': 73.8567,
      'type': 'ROUTINE_PERIODIC',
      'capacity': 150,
      'enrolled': 142,
    },
  ];

  // Dynamic Inspector GPS (snapped 35m from target facility by default)
  double _inspectorLat = 28.5675;
  double _inspectorLon = 77.1736;
  bool _isGeofenceVerified = false;
  double _distanceMeters = 0.0;
  bool _simulateOnsite = true;

  // Checklist ratings (0 to 100)
  int _infraScore = 85;
  int _hygieneScore = 90;
  int _foodScore = 80;
  int _medicalScore = 85;
  int _attendanceScore = 90;

  // Captured evidence photos
  final List<Map<String, dynamic>> _capturedPhotos = [];
  bool _inspectorSigned = false;
  bool _facilityHeadSigned = false;

  @override
  void initState() {
    super.initState();
    _selectedFacility = Map<String, dynamic>.from(widget.facility);
    _syncInspectorLocationToFacility();
  }

  void _syncInspectorLocationToFacility() {
    final fLat = (_selectedFacility['lat'] as num).toDouble();
    final fLon = (_selectedFacility['lon'] as num).toDouble();
    if (_simulateOnsite) {
      _inspectorLat = fLat + 0.00028;
      _inspectorLon = fLon + 0.00015;
    } else {
      _inspectorLat = fLat + 0.045;
      _inspectorLon = fLon + 0.040;
    }
    _evaluateGeofence();
  }

  void _evaluateGeofence() {
    final res = LocationService.checkGeofence(
      inspectorLat: _inspectorLat,
      inspectorLon: _inspectorLon,
      facilityLat: (_selectedFacility['lat'] as num).toDouble(),
      facilityLon: (_selectedFacility['lon'] as num).toDouble(),
      allowedRadiusMeters: 150,
    );
    setState(() {
      _isGeofenceVerified = res['is_within_geofence'];
      _distanceMeters = res['distance_meters'];
    });
  }

  void _capturePhoto(String category) {
    final photo = CameraWatermarkService.captureWithWatermark(
      facilityId: _selectedFacility['facility_id'],
      inspectorId: 'OFFICER-333',
      lat: _inspectorLat,
      lon: _inspectorLon,
      categoryTag: category,
    );
    setState(() {
      _capturedPhotos.add(photo);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Watermarked evidence recorded for $category (SHA-256 Hash Verified)')),
    );
  }

  void _saveOffline() {
    final payload = {
      'facility_id': _selectedFacility['facility_id'],
      'facility_name': _selectedFacility['facility_name'],
      'inspector_lat': _inspectorLat,
      'inspector_lon': _inspectorLon,
      'geofence_verified': _isGeofenceVerified,
      'scores': {
        'infrastructure': _infraScore,
        'hygiene': _hygieneScore,
        'food': _foodScore,
        'medical': _medicalScore,
        'attendance': _attendanceScore,
        'total': ((_infraScore + _hygieneScore + _foodScore + _medicalScore + _attendanceScore) / 5).round(),
      },
      'evidence_photos': _capturedPhotos,
      'inspector_signed': _inspectorSigned,
      'facility_head_signed': _facilityHeadSigned,
      'timestamp': DateTime.now().toIso8601String(),
    };

    OfflineSyncQueue().queueInspection(payload);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Colors.teal,
        content: Text('Inspection Package Encrypted (AES-256-GCM) & Saved in Offline Queue!'),
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final totalCompliance = ((_infraScore + _hygieneScore + _foodScore + _medicalScore + _attendanceScore) / 5).round();

    return Scaffold(
      appBar: AppBar(
        title: Text(_selectedFacility['facility_name']),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Facility Selector Dropdown
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Assigned Facility to Audit:',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black54)),
                    DropdownButton<String>(
                      isExpanded: true,
                      underline: const SizedBox(),
                      value: _selectedFacility['facility_id'],
                      items: _assignedFacilities.map((f) {
                        return DropdownMenuItem<String>(
                          value: f['facility_id'],
                          child: Text('${f['facility_name']} (${f['location']})',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          final match = _assignedFacilities.firstWhere((f) => f['facility_id'] == val);
                          setState(() {
                            _selectedFacility = Map<String, dynamic>.from(match);
                            _syncInspectorLocationToFacility();
                          });
                        }
                      },
                    ),
                  ],
                ),
              ),
            ),
            // Geofencing Perimeter Status Card
            Card(
              color: _isGeofenceVerified ? Colors.green.shade50 : Colors.red.shade50,
              shape: RoundedRectangleBorder(
                side: BorderSide(color: _isGeofenceVerified ? Colors.green : Colors.red, width: 1.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Icon(
                      _isGeofenceVerified ? Icons.verified_outlined : Icons.warning_amber_rounded,
                      color: _isGeofenceVerified ? Colors.green.shade800 : Colors.red.shade800,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _isGeofenceVerified ? 'GPS GEOFENCE VALIDATED' : 'GEOFENCE PERIMETER BREACH',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: _isGeofenceVerified ? Colors.green.shade900 : Colors.red.shade900,
                            ),
                          ),
                          Text(
                            'Inspector is ${_distanceMeters.round()}m from facility entrance (Allowed: 150m)',
                            style: const TextStyle(fontSize: 11, color: Colors.black87),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Overall Score Meter
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Calculated Compliance', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        Text('$totalCompliance / 100',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Color(0xFF1E3A8A))),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: totalCompliance >= 80 ? Colors.green.shade100 : Colors.amber.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        totalCompliance >= 80 ? 'GRADE A' : (totalCompliance >= 60 ? 'GRADE B' : 'GRADE C'),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: totalCompliance >= 80 ? Colors.green.shade900 : Colors.amber.shade900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Checklist Scoring Rubrics
            const Text('Statutory Inspection Rubrics', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),

            _buildScoreSlider('1. Infrastructure & Fire Safety', _infraScore, (v) => setState(() => _infraScore = v)),
            _buildScoreSlider('2. Hygiene & Cleanliness', _hygieneScore, (v) => setState(() => _hygieneScore = v)),
            _buildScoreSlider('3. Food Quality & Nutrition', _foodScore, (v) => setState(() => _foodScore = v)),
            _buildScoreSlider('4. Medical Ward & Healthcare', _medicalScore, (v) => setState(() => _medicalScore = v)),
            _buildScoreSlider('5. Staff Attendance & Records', _attendanceScore, (v) => setState(() => _attendanceScore = v)),

            const SizedBox(height: 16),

            // Evidence Photos with Auto-Watermark
            const Text('Geo-Tagged Watermarked Evidence Photos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  avatar: const Icon(Icons.camera_alt, size: 16),
                  label: const Text('Capture Dining Hall'),
                  onPressed: () => _capturePhoto('Dining & Food Prep'),
                ),
                ActionChip(
                  avatar: const Icon(Icons.camera_alt, size: 16),
                  label: const Text('Capture Dormitory Beds'),
                  onPressed: () => _capturePhoto('Dormitory Living Space'),
                ),
                ActionChip(
                  avatar: const Icon(Icons.camera_alt, size: 16),
                  label: const Text('Capture Medical Dispensary'),
                  onPressed: () => _capturePhoto('Medical Dispensary'),
                ),
              ],
            ),
            if (_capturedPhotos.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text('${_capturedPhotos.length} watermarked evidence packages attached',
                  style: const TextStyle(fontSize: 11, color: Colors.teal, fontWeight: FontWeight.bold)),
            ],

            const SizedBox(height: 20),

            // Dual Digital Signatures
            const Text('Dual Digital Signatures', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      backgroundColor: _inspectorSigned ? Colors.green.shade50 : null,
                    ),
                    icon: Icon(_inspectorSigned ? Icons.check_circle : Icons.draw, size: 16, color: _inspectorSigned ? Colors.green : null),
                    label: Text(_inspectorSigned ? 'Inspector Signed' : 'Sign as Inspector', style: const TextStyle(fontSize: 11)),
                    onPressed: () => setState(() => _inspectorSigned = !_inspectorSigned),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      backgroundColor: _facilityHeadSigned ? Colors.green.shade50 : null,
                    ),
                    icon: Icon(_facilityHeadSigned ? Icons.check_circle : Icons.draw, size: 16, color: _facilityHeadSigned ? Colors.green : null),
                    label: Text(_facilityHeadSigned ? 'Head Signed' : 'Sign as NGO Head', style: const TextStyle(fontSize: 11)),
                    onPressed: () => setState(() => _facilityHeadSigned = !_facilityHeadSigned),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.save_alt),
                    label: const Text('Save Offline (AES-256)'),
                    onPressed: _saveOffline,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1E3A8A),
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.cloud_upload),
                    label: const Text('Submit Audit'),
                    onPressed: !_isGeofenceVerified ? null : _saveOffline,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreSlider(String label, int value, ValueChanged<int> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
            Text('$value%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          ],
        ),
        Slider(
          value: value.toDouble(),
          min: 0,
          max: 100,
          divisions: 20,
          activeColor: const Color(0xFF1E3A8A),
          onChanged: (v) => onChanged(v.round()),
        ),
      ],
    );
  }
}
