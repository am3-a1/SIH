import 'package:flutter/material.dart';

class CCTVFeedViewerScreen extends StatefulWidget {
  const CCTVFeedViewerScreen({super.key});

  @override
  State<CCTVFeedViewerScreen> createState() => _CCTVFeedViewerScreenState();
}

class _CCTVFeedViewerScreenState extends State<CCTVFeedViewerScreen> {
  int _selectedCameraIndex = 0;

  final List<Map<String, dynamic>> _cameras = [
    {
      'id': 'CAM-DL01-1',
      'name': 'Entrance Main Gate',
      'location': 'Gate 1, Snehalaya Delhi',
      'status': 'ONLINE',
      'protocol': 'ONVIF Profile S (RTSP)',
      'fps': 25,
      'resolution': '1080p',
    },
    {
      'id': 'CAM-DL01-2',
      'name': 'Dining Hall & Kitchen',
      'location': 'Ground Floor Snehalaya',
      'status': 'ONLINE',
      'protocol': 'ONVIF Profile S (RTSP)',
      'fps': 25,
      'resolution': '1080p',
    },
    {
      'id': 'CAM-DL01-3',
      'name': 'Common Recreation Hall',
      'location': 'East Wing',
      'status': 'ONLINE',
      'protocol': 'RTSP Direct',
      'fps': 20,
      'resolution': '720p',
    },
    {
      'id': 'CAM-PB02-2',
      'name': 'Detox Medical Ward',
      'location': 'IRCA Amritsar',
      'status': 'TAMPERED',
      'protocol': 'ONVIF Profile S',
      'fps': 0,
      'resolution': 'OFFLINE',
    },
  ];

  void _sendPTZCommand(String action) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('ONVIF PTZ Command: $action sent to ${_cameras[_selectedCameraIndex]['id']}'),
        duration: const Duration(milliseconds: 900),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeCam = _cameras[_selectedCameraIndex];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live CCTV Surveillance Matrix'),
      ),
      body: Column(
        children: [
          // Active Camera Stream Player
          Container(
            height: 240,
            color: Colors.black,
            child: Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        activeCam['status'] == 'ONLINE' ? Icons.videocam : Icons.videocam_off,
                        size: 48,
                        color: activeCam['status'] == 'ONLINE' ? Colors.teal : Colors.red,
                      ),
                      const SizedBox(height: 8),
                      Text(activeCam['name'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      Text(
                        activeCam['status'] == 'ONLINE' ? '🟢 LIVE RTSP STREAM (25 FPS)' : '🔴 FEED TAMPERED / OFFLINE',
                        style: TextStyle(
                          color: activeCam['status'] == 'ONLINE' ? Colors.greenAccent : Colors.redAccent,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    color: Colors.black54,
                    child: Text(
                      'REC | ${DateTime.now().toUtc().toIso8601String().substring(0, 19)} UTC',
                      style: const TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ONVIF PTZ Controls
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.grey.shade200,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('ONVIF PTZ Controls:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_left),
                      tooltip: 'Pan Left',
                      onPressed: () => _sendPTZCommand('PAN_LEFT'),
                    ),
                    IconButton(
                      icon: const Icon(Icons.arrow_upward),
                      tooltip: 'Tilt Up',
                      onPressed: () => _sendPTZCommand('TILT_UP'),
                    ),
                    IconButton(
                      icon: const Icon(Icons.arrow_downward),
                      tooltip: 'Tilt Down',
                      onPressed: () => _sendPTZCommand('TILT_DOWN'),
                    ),
                    IconButton(
                      icon: const Icon(Icons.arrow_right),
                      tooltip: 'Pan Right',
                      onPressed: () => _sendPTZCommand('PAN_RIGHT'),
                    ),
                    const VerticalDivider(width: 16),
                    IconButton(
                      icon: const Icon(Icons.zoom_in),
                      tooltip: 'Zoom In',
                      onPressed: () => _sendPTZCommand('ZOOM_IN'),
                    ),
                    IconButton(
                      icon: const Icon(Icons.zoom_out),
                      tooltip: 'Zoom Out',
                      onPressed: () => _sendPTZCommand('ZOOM_OUT'),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Multi-Camera Selection Grid
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _cameras.length,
              itemBuilder: (context, index) {
                final cam = _cameras[index];
                final isSelected = index == _selectedCameraIndex;

                return Card(
                  color: isSelected ? Colors.blue.shade50 : null,
                  shape: RoundedRectangleBorder(
                    side: BorderSide(
                      color: isSelected ? const Color(0xFF1E3A8A) : Colors.transparent,
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: cam['status'] == 'ONLINE' ? Colors.green.shade100 : Colors.red.shade100,
                      child: Icon(
                        cam['status'] == 'ONLINE' ? Icons.videocam : Icons.warning,
                        color: cam['status'] == 'ONLINE' ? Colors.green.shade800 : Colors.red.shade800,
                        size: 20,
                      ),
                    ),
                    title: Text(cam['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    subtitle: Text('${cam['location']} • ${cam['protocol']}', style: const TextStyle(fontSize: 11)),
                    trailing: Text(cam['status'],
                        style: TextStyle(
                          color: cam['status'] == 'ONLINE' ? Colors.green : Colors.red,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        )),
                    onTap: () => setState(() => _selectedCameraIndex = index),
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
