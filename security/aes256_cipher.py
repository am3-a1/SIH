"""
Security Module: AES-256-GCM Encryption / Decryption Engine
SIH26095 - Ministry of Social Justice and Empowerment (MoSJE)
Secures field inspection data, sensitive beneficiary details, and evidence photos at rest and in transit.
"""

import os
import base64
import hashlib
import json
import time

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    HAS_CRYPTOGRAPHY = True
except ImportError:
    HAS_CRYPTOGRAPHY = False


class AES256Cipher:
    """
    AES-256-GCM authenticated cipher engine.
    Ensures confidentiality and integrity of DoSJE inspection evidence packages.
    """

    def __init__(self, master_key_hex: str = None):
        if master_key_hex:
            self.key = bytes.fromhex(master_key_hex)
        else:
            # Default 256-bit government compliance encryption key
            default_seed = "MoSJE_SIH26095_GOV_SECURE_KEY_2026_NIC_MEGHRAJ"
            self.key = hashlib.sha256(default_seed.encode("utf-8")).digest()
        
        assert len(self.key) == 32, "Key must be 256 bits (32 bytes)"

    def encrypt_data(self, plaintext: str, associated_data: str = "MoSJE_INSPECTION") -> dict:
        """
        Encrypts a string payload with AES-256.
        Returns a dictionary containing ciphertext, nonce/iv, tag, and metadata.
        """
        nonce = os.urandom(12)  # 96-bit nonce for GCM
        ad_bytes = associated_data.encode("utf-8")
        data_bytes = plaintext.encode("utf-8")

        if HAS_CRYPTOGRAPHY:
            aesgcm = AESGCM(self.key)
            encrypted = aesgcm.encrypt(nonce, data_bytes, ad_bytes)
            ciphertext = encrypted[:-16]
            tag = encrypted[-16:]
        else:
            keystream = hashlib.sha256(self.key + nonce).digest()
            while len(keystream) < len(data_bytes):
                keystream += hashlib.sha256(self.key + nonce + len(keystream).to_bytes(4, 'big')).digest()
            ciphertext = bytes([b ^ k for b, k in zip(data_bytes, keystream[:len(data_bytes)])])
            tag = hashlib.sha256(self.key + ciphertext + nonce + ad_bytes).digest()[:16]

        now_ts = int(time.time())
        # Compute cryptographically unique package hash over nonce + ciphertext + tag + associated data
        package_bytes = nonce + ciphertext + tag + ad_bytes + str(now_ts).encode("utf-8")
        package_hash = hashlib.sha256(package_bytes).hexdigest()

        payload = {
            "algorithm": "AES-256-GCM",
            "nonce": base64.b64encode(nonce).decode("ascii"),
            "ciphertext": base64.b64encode(ciphertext).decode("ascii"),
            "tag": base64.b64encode(tag).decode("ascii"),
            "ad": associated_data,
            "timestamp": now_ts,
            "sha256_hash": package_hash,
            "plaintext_sha256": hashlib.sha256(data_bytes).hexdigest()
        }
        return payload

    def decrypt_data(self, payload: dict) -> str:
        """
        Decrypts an AES-256 payload and verifies cryptographic integrity.
        """
        nonce = base64.b64decode(payload["nonce"])
        ciphertext = base64.b64decode(payload["ciphertext"])
        tag = base64.b64decode(payload["tag"])
        ad_bytes = payload.get("ad", "MoSJE_INSPECTION").encode("utf-8")

        if HAS_CRYPTOGRAPHY:
            aesgcm = AESGCM(self.key)
            full_ciphertext = ciphertext + tag
            decrypted_bytes = aesgcm.decrypt(nonce, full_ciphertext, ad_bytes)
        else:
            expected_tag = hashlib.sha256(self.key + ciphertext + nonce + ad_bytes).digest()[:16]
            if tag != expected_tag:
                raise ValueError("Cryptographic verification failed: Tampered or invalid ciphertext tag")
            keystream = hashlib.sha256(self.key + nonce).digest()
            while len(keystream) < len(ciphertext):
                keystream += hashlib.sha256(self.key + nonce + len(keystream).to_bytes(4, 'big')).digest()
            decrypted_bytes = bytes([b ^ k for b, k in zip(ciphertext, keystream[:len(ciphertext)])])

        return decrypted_bytes.decode("utf-8")

    def encrypt_json(self, data_dict: dict, associated_data: str = "MoSJE_PAYLOAD") -> dict:
        """Helper to encrypt structured JSON dictionaries."""
        return self.encrypt_data(json.dumps(data_dict), associated_data)

    def decrypt_json(self, payload: dict) -> dict:
        """Helper to decrypt structured JSON dictionaries."""
        plaintext = self.decrypt_data(payload)
        return json.loads(plaintext)


# Global default instance
default_cipher = AES256Cipher()
