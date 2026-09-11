import 'dart:convert';
import 'package:crypto/crypto.dart';

class CameraWatermarkService {
  /// Simulates camera image capture with anti-tamper watermark metadata
  static Map<String, dynamic> captureWithWatermark({
    required String facilityId,
    required String inspectorId,
    required double lat,
    required double lon,
    required String categoryTag,
  }) {
    final String timestamp = DateTime.now().toUtc().toIso8601String();
    final String rawSignatureString = "$facilityId|$inspectorId|$lat|$lon|$timestamp|$categoryTag";
    final String shaHash = sha256.convert(utf8.encode(rawSignatureString)).toString();

    return {
      'image_id': 'IMG-${DateTime.now().millisecondsSinceEpoch}',
      'category': categoryTag,
      'captured_at': timestamp,
      'latitude': lat,
      'longitude': lon,
      'inspector_id': inspectorId,
      'facility_id': facilityId,
      'watermark_text': "MoSJE AUDIT | $timestamp | $lat, $lon | HASH: ${shaHash.substring(0, 12)}...",
      'sha256_hash': shaHash,
      'is_verified': true,
    };
  }
}
