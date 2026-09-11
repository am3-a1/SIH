"""
OAuth2 & JWT Authentication Provider
SIH26095 - Ministry of Social Justice and Empowerment (MoSJE)
Supports OAuth2 Password Grant, Refresh Tokens, and PKCE verification for Mobile Clients.
"""

import time
import json
import base64
import hashlib
import hmac
import secrets

SECRET_KEY = "MoSJE_OAUTH2_SECRET_KEY_GOV_IN_2026_SECURE"


def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')


def b64url_decode(s: str) -> bytes:
    padding = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + padding)


class OAuth2Provider:
    """
    OAuth2 / JWT Token management provider with PKCE support.
    """

    def __init__(self, secret_key: str = SECRET_KEY):
        self.secret_key = secret_key.encode('utf-8')
        self.refresh_tokens = {}  # token -> user_data

    def generate_jwt(self, payload: dict, expires_in: int = 3600) -> str:
        """Generates an HMAC-SHA256 signed JWT token."""
        header = {"alg": "HS256", "typ": "JWT"}
        now = int(time.time())
        token_payload = {
            **payload,
            "iat": now,
            "exp": now + expires_in,
            "iss": "https://sih26095.dosje.gov.in"
        }

        header_b64 = b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
        payload_b64 = b64url_encode(json.dumps(token_payload, separators=(',', ':')).encode('utf-8'))
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')

        signature = hmac.new(self.secret_key, signing_input, hashlib.sha256).digest()
        sig_b64 = b64url_encode(signature)

        return f"{header_b64}.{payload_b64}.{sig_b64}"

    def verify_jwt(self, token: str) -> dict:
        """Verifies JWT signature and expiry. Returns decoded claims or raises ValueError."""
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError("Malformed JWT token format")

        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(self.secret_key, signing_input, hashlib.sha256).digest()

        if not hmac.compare_digest(b64url_decode(sig_b64), expected_sig):
            raise ValueError("Invalid cryptographic token signature")

        claims = json.loads(b64url_decode(payload_b64).decode('utf-8'))
        if claims.get("exp", 0) < time.time():
            raise ValueError("Token has expired")

        return claims

    def create_token_response(self, user_info: dict) -> dict:
        """Issues OAuth2 access_token and refresh_token pair."""
        access_token = self.generate_jwt({
            "sub": user_info["username"],
            "user_id": user_info["id"],
            "role": user_info["role"],
            "name": user_info["name"],
            "district": user_info.get("district", "ALL"),
            "state": user_info.get("state", "ALL")
        }, expires_in=7200)

        refresh_token = secrets.token_urlsafe(48)
        self.refresh_tokens[refresh_token] = {
            "user_info": user_info,
            "expires_at": time.time() + (86400 * 30)
        }

        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 7200,
            "refresh_token": refresh_token,
            "user": {
                "id": user_info["id"],
                "username": user_info["username"],
                "name": user_info["name"],
                "role": user_info["role"],
                "designation": user_info.get("designation", "Officer"),
                "state": user_info.get("state", "ALL"),
                "district": user_info.get("district", "ALL")
            }
        }

    def verify_pkce(self, code_verifier: str, code_challenge: str, method: str = "S256") -> bool:
        """Validates OAuth2 PKCE (Proof Key for Code Exchange) for mobile Flutter clients."""
        if method == "S256":
            computed_challenge = b64url_encode(hashlib.sha256(code_verifier.encode('ascii')).digest())
            return hmac.compare_digest(computed_challenge, code_challenge)
        elif method == "plain":
            return hmac.compare_digest(code_verifier, code_challenge)
        return False


oauth2_provider = OAuth2Provider()
