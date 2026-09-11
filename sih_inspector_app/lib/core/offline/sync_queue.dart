import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../security/aes_crypto.dart';

/// Manages offline-first storage and automatic synchronization
/// of inspection records when network connectivity returns.
class OfflineSyncQueue extends ChangeNotifier {
  static final OfflineSyncQueue _instance = OfflineSyncQueue._internal();
  factory OfflineSyncQueue() => _instance;
  OfflineSyncQueue._internal();

  final List<Map<String, dynamic>> _pendingSyncItems = [];
  bool _isSyncing = false;

  List<Map<String, dynamic>> get pendingItems => List.unmodifiable(_pendingSyncItems);
  int get pendingCount => _pendingSyncItems.length;
  bool get isSyncing => _isSyncing;

  /// Saves an inspection locally with AES-256 encryption
  void queueInspection(Map<String, dynamic> inspectionData) {
    final encryptedPackage = AESCryptoService.encryptPayload(jsonEncode(inspectionData));
    
    _pendingSyncItems.add({
      'local_id': 'OFFLINE-${DateTime.now().millisecondsSinceEpoch}',
      'facility_id': inspectionData['facility_id'],
      'facility_name': inspectionData['facility_name'],
      'saved_at': DateTime.now().toIso8601String(),
      'encrypted_package': encryptedPackage,
      'status': 'PENDING_UPLOAD',
    });
    notifyListeners();
  }

  /// Triggers 1-click cloud synchronization
  Future<int> syncAllWithServer() async {
    if (_pendingSyncItems.isEmpty || _isSyncing) return 0;

    _isSyncing = true;
    notifyListeners();

    int syncedCount = 0;
    try {
      // Simulate network transmission to DoSJE REST API
      await Future.delayed(const Duration(seconds: 2));
      syncedCount = _pendingSyncItems.length;
      _pendingSyncItems.clear();
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
    return syncedCount;
  }
}
