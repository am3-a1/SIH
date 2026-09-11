import 'package:flutter/material.dart';
import '../../core/network/oauth2_client.dart';
import '../../core/offline/sync_queue.dart';
import 'audit_screen.dart';
import '../vc/webrtc_call_screen.dart';
import '../cctv/feed_viewer_screen.dart';

class InspectionListScreen extends StatefulWidget {
  const InspectionListScreen({super.key});

  @override
  State<InspectionListScreen> createState() => _InspectionListScreenState();
}

class _InspectionListScreenState extends State<InspectionListScreen> {
  final OfflineSyncQueue _syncQueue = OfflineSyncQueue();

  final List<Map<String, dynamic>> _inspections = [
    {
      'id': 'INSP-2026-001',
      'facility_id': 'DOSJE-DL-001',
      'facility_name': 'Snehalaya Senior Citizens Home',
      'scheme': 'AVYAY (Atal Vayo Abhyuday Yojana)',
      'location': 'Sector 4, R.K. Puram, New Delhi',
      'lat': 28.5672,
      'lon': 77.1734,
      'type': 'SURPRISE_AUDIT',
      'status': 'ASSIGNED',
      'risk_level': 'HIGH',
      'enrolled': 88,
      'capacity': 100,
    },
    {
      'id': 'INSP-2026-002',
      'facility_id': 'DOSJE-PB-002',
      'facility_name': 'Nasha Mukti Punarvas Kendra (IRCA)',
      'scheme': 'NAPDDR (Drug Demand Reduction)',
      'location': 'Circular Road, Amritsar, Punjab',
      'lat': 31.6340,
      'lon': 74.8723,
      'type': 'SURPRISE_AUDIT',
      'status': 'ASSIGNED',
      'risk_level': 'CRITICAL',
      'enrolled': 42,
      'capacity': 60,
    },
    {
      'id': 'INSP-2026-003',
      'facility_id': 'DOSJE-MH-003',
      'facility_name': 'Savitribai Phule SC Girls Hostel',
      'scheme': 'PM-AJAY (SC Welfare)',
      'location': 'Ganeshkhind Road, Pune',
      'lat': 18.5204,
      'lon': 73.8567,
      'type': 'ROUTINE_PERIODIC',
      'status': 'COMPLETED',
      'risk_level': 'NORMAL',
      'enrolled': 142,
      'capacity': 150,
    }
  ];

  @override
  Widget build(BuildContext context) {
    final user = OAuth2Client.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('DoSJE Field Inspections'),
        actions: [
          IconButton(
            icon: const Icon(Icons.videocam),
            tooltip: 'Live CCTV Matrix',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const CCTVFeedViewerScreen()));
            },
          ),
          IconButton(
            icon: const Icon(Icons.phone_in_talk),
            tooltip: 'WebRTC Spot-Check Call',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const WebRTCCallScreen()));
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Officer Info Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: const Color(0xFFEFF6FF),
            child: Row(
              children: [
                const CircleAvatar(
                  backgroundColor: Color(0xFF1E3A8A),
                  radius: 18,
                  child: Icon(Icons.person, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?['name'] ?? 'Officer Sunita Rao',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text('${user?['designation'] ?? 'Field Inspector'} • ${user?['district'] ?? 'Delhi'}',
                          style: const TextStyle(color: Colors.grey, fontSize: 11)),
                    ],
                  ),
                ),
                AnimatedBuilder(
                  animation: _syncQueue,
                  builder: (context, _) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _syncQueue.pendingCount > 0 ? Colors.amber.shade100 : Colors.green.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _syncQueue.pendingCount > 0 ? Icons.cloud_queue : Icons.cloud_done,
                            size: 14,
                            color: _syncQueue.pendingCount > 0 ? Colors.amber.shade900 : Colors.green.shade900,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _syncQueue.pendingCount > 0 ? '${_syncQueue.pendingCount} Offline' : 'Online',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: _syncQueue.pendingCount > 0 ? Colors.amber.shade900 : Colors.green.shade900,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          // List of Inspections
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _inspections.length,
              itemBuilder: (context, index) {
                final item = _inspections[index];
                final isSurprise = item['type'] == 'SURPRISE_AUDIT';
                final isCompleted = item['status'] == 'COMPLETED';

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isSurprise ? Colors.red.shade100 : Colors.blue.shade100,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                isSurprise ? '🚨 UNANNOUNCED SURPRISE AUDIT' : 'ROUTINE INSPECTION',
                                style: TextStyle(
                                  color: isSurprise ? Colors.red.shade900 : Colors.blue.shade900,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Text(
                              item['status'],
                              style: TextStyle(
                                color: isCompleted ? Colors.green : Colors.orange,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(item['facility_name'],
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 2),
                        Text(item['scheme'], style: const TextStyle(color: Color(0xFF0D9488), fontSize: 11)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.location_on, size: 14, color: Colors.grey),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(item['location'],
                                  style: const TextStyle(color: Colors.grey, fontSize: 11)),
                            ),
                          ],
                        ),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Capacity: ${item['enrolled']}/${item['capacity']} Beneficiaries',
                                style: const TextStyle(fontSize: 11, color: Colors.grey)),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isCompleted ? Colors.grey.shade300 : const Color(0xFF1E3A8A),
                                foregroundColor: isCompleted ? Colors.black54 : Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              ),
                              icon: Icon(isCompleted ? Icons.visibility : Icons.qr_code_scanner, size: 16),
                              label: Text(isCompleted ? 'View Report' : 'Check-in & Audit',
                                  style: const TextStyle(fontSize: 12)),
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => AuditScreen(facility: item),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
