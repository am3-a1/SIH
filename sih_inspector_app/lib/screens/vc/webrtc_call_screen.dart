import 'package:flutter/material.dart';

class WebRTCCallScreen extends StatefulWidget {
  const WebRTCCallScreen({super.key});

  @override
  State<WebRTCCallScreen> createState() => _WebRTCCallScreenState();
}

class _WebRTCCallScreenState extends State<WebRTCCallScreen> {
  bool _isMicMuted = false;
  bool _isVideoOff = false;
  bool _isConnected = true;
  int _snapshotsCaptured = 0;

  void _captureSnapshot() {
    setState(() => _snapshotsCaptured++);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Live Snapshot #$_snapshotsCaptured Stamped with SHA-256 Watermark & Geotag'),
        backgroundColor: Colors.teal,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black87,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Remote Spot-Check Video Call', style: TextStyle(fontSize: 14, color: Colors.white)),
            Text('MoSJE Vigilance Auditor ⇄ Snehalaya Senior Home',
                style: TextStyle(fontSize: 10, color: Colors.greenAccent)),
          ],
        ),
      ),
      body: Column(
        children: [
          // Remote Video Frame (Beneficiary & Staff)
          Expanded(
            child: Stack(
              children: [
                Container(
                  color: Colors.grey.shade900,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.account_balance, size: 64, color: Colors.white24),
                        const SizedBox(height: 12),
                        const Text('Live Stream: Dining & Community Hall',
                            style: TextStyle(color: Colors.white70, fontSize: 13)),
                        const SizedBox(height: 4),
                        Text(
                          _isConnected ? '🟢 WebRTC P2P Connected (Latency: 48ms)' : 'Connecting...',
                          style: const TextStyle(color: Colors.greenAccent, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ),
                // PIP Local Camera Preview (Inspector)
                Positioned(
                  top: 16,
                  right: 16,
                  width: 100,
                  height: 140,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black,
                      border: Border.all(color: Colors.white38, width: 2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: _isVideoOff
                          ? const Icon(Icons.videocam_off, color: Colors.white54)
                          : const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.person, color: Colors.white, size: 32),
                                SizedBox(height: 4),
                                Text('Auditor (You)', style: TextStyle(color: Colors.white70, fontSize: 9)),
                              ],
                            ),
                    ),
                  ),
                ),
                // Cryptographic Watermark Overlay
                Positioned(
                  bottom: 16,
                  left: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    color: Colors.black54,
                    child: const Text(
                      'MoSJE VC AUDIT | 28.5672 N, 77.1734 E | AES-256 ENCRYPTED',
                      style: TextStyle(color: Colors.white70, fontSize: 9, fontFamily: 'monospace'),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Call Control Action Bar
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
            color: Colors.black,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  icon: Icon(_isMicMuted ? Icons.mic_off : Icons.mic),
                  color: _isMicMuted ? Colors.red : Colors.white,
                  onPressed: () => setState(() => _isMicMuted = !_isMicMuted),
                ),
                IconButton(
                  icon: Icon(_isVideoOff ? Icons.videocam_off : Icons.videocam),
                  color: _isVideoOff ? Colors.red : Colors.white,
                  onPressed: () => setState(() => _isVideoOff = !_isVideoOff),
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  icon: const Icon(Icons.camera_alt, size: 18),
                  label: const Text('Capture Snapshot', style: TextStyle(fontSize: 11)),
                  onPressed: _captureSnapshot,
                ),
                IconButton(
                  icon: const Icon(Icons.call_end),
                  color: Colors.red,
                  style: IconButton.styleFrom(backgroundColor: Colors.red.shade900),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
