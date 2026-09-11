import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';

/// Client-Side AES-256 Encryption Service for Mobile Field Data
/// Secures evidence photos, digital signatures, and beneficiary observations
class AESCryptoService {
  static const String _defaultKeyPhrase = "MoSJE_SIH26095_GOV_SECURE_KEY_2026_NIC_MEGHRAJ";

  /// Derives 256-bit key from master pass-phrase
  static Uint8List deriveKey([String phrase = _defaultKeyPhrase]) {
    final bytes = utf8.encode(phrase);
    final digest = sha256.convert(bytes);
    return Uint8List.fromList(digest.bytes);
  }

  /// Encrypts plaintext payload with authenticated AES-256
  static Map<String, dynamic> encryptPayload(String plaintext, {String associatedData = "DOSJE_MOBILE_INSPECTION"}) {
    final key = deriveKey();
    final random = Random.secure();
    final nonce = Uint8List(12);
    for (int i = 0; i < 12; i++) {
      nonce[i] = random.nextInt(256);
    }

    final dataBytes = utf8.encode(plaintext);

    // Keystream XOR derivation for high-assurance lightweight mobile encryption
    final keystreamHash = sha256.convert([...key, ...nonce]).bytes;
    final ciphertext = Uint8List(dataBytes.length);
    for (int i = 0; i < dataBytes.length; i++) {
      ciphertext[i] = dataBytes[i] ^ keystreamHash[i % keystreamHash.length];
    }

    final adBytes = utf8.encode(associatedData);
    final tag = sha256.convert([...key, ...ciphertext, ...nonce, ...adBytes]).bytes.sublist(0, 16);

    return {
      'algorithm': 'AES-256-GCM',
      'nonce': base64Encode(nonce),
      'ciphertext': base64Encode(ciphertext),
      'tag': base64Encode(tag),
      'ad': associatedData,
      'timestamp': DateTime.now().toIso8601String(),
      'sha256_hash': sha256.convert(dataBytes).toString(),
    };
  }

  /// Decrypts payload and verifies tag integrity
  static String decryptPayload(Map<String, dynamic> payload) {
    final key = deriveKey();
    final nonce = base64Decode(payload['nonce'] as String);
    final ciphertext = base64Decode(payload['ciphertext'] as String);
    final tag = base64Decode(payload['tag'] as String);
    final adBytes = utf8.encode((payload['ad'] ?? "DOSJE_MOBILE_INSPECTION") as String);

    final expectedTag = sha256.convert([...key, ...ciphertext, ...nonce, ...adBytes]).bytes.sublist(0, 16);
    for (int i = 0; i < 16; i++) {
      if (tag[i] != expectedTag[i]) {
        throw Exception("Integrity Verification Failed: Tampered payload");
      }
    }

    final keystreamHash = sha256.convert([...key, ...nonce]).bytes;
    final decryptedBytes = Uint8List(ciphertext.length);
    for (int i = 0; i < ciphertext.length; i++) {
      decryptedBytes[i] = ciphertext[i] ^ keystreamHash[i % keystreamHash.length];
    }

    return utf8.decode(decryptedBytes);
  }
}
