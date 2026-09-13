#!/usr/bin/env python3
"""
In-Memory HTTP Handler Test for DoSJEUnifiedHandler
Verifies all REST API routes and JSON responses without network socket calls.
"""

import io
import json
import unittest
from run_prototype import DoSJEUnifiedHandler
from database.db_adapter import db_adapter


class MockSocket:
    def __init__(self, data_bytes=b""):
        self.rfile = io.BytesIO(data_bytes)
        self.wfile = io.BytesIO()

    def makefile(self, mode, *args, **kwargs):
        if 'r' in mode:
            return self.rfile
        elif 'w' in mode:
            return self.wfile

    def sendall(self, data):
        self.wfile.write(data)


class MockServer:
    def __init__(self):
        self.server_name = "localhost"
        self.server_port = 8000


def call_handler(method, path, body_dict=None, headers=None):
    headers = headers or {}
    body_bytes = json.dumps(body_dict).encode('utf-8') if body_dict else b""
    req_lines = [f"{method} {path} HTTP/1.1", f"Host: localhost:8000"]
    if body_bytes:
        req_lines.append(f"Content-Length: {len(body_bytes)}")
        req_lines.append("Content-Type: application/json")
    for k, v in headers.items():
        req_lines.append(f"{k}: {v}")
    raw_req = "\r\n".join(req_lines).encode('utf-8') + b"\r\n\r\n" + body_bytes

    sock = MockSocket(raw_req)
    handler = DoSJEUnifiedHandler(sock, ("127.0.0.1", 12345), MockServer())

    raw_response = sock.wfile.getvalue().decode('utf-8')
    parts = raw_response.split("\r\n\r\n", 1)
    header_part = parts[0]
    body_part = parts[1] if len(parts) > 1 else ""

    status_line = header_part.splitlines()[0]
    status_code = int(status_line.split(" ")[1])
    try:
        json_data = json.loads(body_part)
    except Exception:
        json_data = body_part

    return status_code, json_data


class TestUnifiedAPIHandler(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        db_adapter.reset_to_default_seed()

    def test_01_oauth2_login(self):
        status, data = call_handler("POST", "/api/v1/auth/login", {"username": "inspector_delhi"})
        self.assertEqual(status, 200)
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "DISTRICT_INSPECTOR")

    def test_02_facilities_list(self):
        status, data = call_handler("GET", "/api/v1/facilities")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(data["count"], 12)
        self.assertIn("facilities", data)

    def test_03_geofence_verification(self):
        # Inside geofence
        status, data = call_handler("GET", "/api/v1/facilities/DOSJE-DL-001/verify-geofence?lat=28.5675&lon=77.1735")
        self.assertEqual(status, 200)
        self.assertTrue(data["is_within_geofence"])

        # Outside geofence
        status2, data2 = call_handler("GET", "/api/v1/facilities/DOSJE-DL-001/verify-geofence?lat=28.6000&lon=77.2000")
        self.assertEqual(status2, 200)
        self.assertFalse(data2["is_within_geofence"])

    def test_04_submit_inspection(self):
        payload = {
            "facility_id": "DOSJE-DL-001",
            "inspector_latitude": 28.5675,
            "inspector_longitude": 77.1735,
            "scores": {"infrastructure": 90, "hygiene": 95, "food": 85, "medical": 90, "attendance": 90},
            "photos_evidence": [
                {
                    "category": "Main Gate & Geofence Verification",
                    "description": "Inspector verified at entry point within 35m of boundary.",
                    "url": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='600' height='400' fill='%230f172a'/><text x='300' y='200' fill='%23ffffff'>Main Gate Evidence</text></svg>",
                    "data_url": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='600' height='400' fill='%230f172a'/><text x='300' y='200' fill='%23ffffff'>Main Gate Evidence</text></svg>",
                    "captured_at": "2026-09-11 12:00:00 UTC",
                    "latitude": 28.5675,
                    "longitude": 77.1735,
                    "sha256_hash": "a1b2c3d4e5f60718293a4b5c6d7e8f90",
                    "watermark_text": "MoSJE FIELD AUDIT | 2026-09-11 | 28.5675° N, 77.1735° E"
                }
            ]
        }
        status, data = call_handler("POST", "/api/v1/inspections/submit", payload)
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["total_compliance_score"], 90)
        self.assertTrue(data["geofence_verified"])

    def test_05_cctv_streams(self):
        status, data = call_handler("GET", "/api/v1/cctv/streams?facility_id=DOSJE-DL-001")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(data["count"], 3)

    def test_06_onvif_ptz(self):
        status, data = call_handler("POST", "/api/v1/cctv/ptz/command", {"camera_id": "CAM-DL01-1", "action": "PAN_LEFT"})
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["action"], "PAN_LEFT")

    def test_07_vc_initiate(self):
        status, data = call_handler("POST", "/api/v1/vc/initiate", {"facility_id": "DOSJE-DL-001"})
        self.assertEqual(status, 200)
        self.assertTrue(data["room_id"].startswith("VC-SPOT-"))

    def test_08_ai_headcount_scan(self):
        status, data = call_handler("POST", "/api/v1/ai/headcount-scan", {"facility_id": "DOSJE-DL-001"})
        self.assertEqual(status, 200)
        self.assertGreater(data["detected_count"], 0)

    def test_09_ai_random_dispatch(self):
        status, data = call_handler("POST", "/api/v1/ai/dispatch-random", {})
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "SUCCESS")

    def test_10_national_stats(self):
        status, data = call_handler("GET", "/api/v1/ai/national-stats")
        self.assertEqual(status, 200)
        self.assertIn("national_metrics", data)
        self.assertGreaterEqual(data["national_metrics"]["total_institutions"], 12)

    def test_11_latest_audit_endpoint(self):
        status, data = call_handler("GET", "/api/v1/inspections/latest")
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "SUCCESS")
        audit = data["latest_audit"]
        self.assertIn("facility_name", audit)
        self.assertIn("inspector_name", audit)
        self.assertIn("photos_evidence", audit)
        self.assertGreater(len(audit["photos_evidence"]), 0)

    def test_12_admin_console_endpoints(self):
        # 1. Check DB overview
        status, data = call_handler("GET", "/api/v1/admin/db-overview")
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "SUCCESS")
        self.assertIn("overview", data)
        self.assertGreaterEqual(data["overview"]["counts"]["total_facilities"], 12)

        # 2. Clear audits endpoint
        status_clr, data_clr = call_handler("POST", "/api/v1/admin/clear-audits")
        self.assertEqual(status_clr, 200)
        self.assertEqual(data_clr["status"], "SUCCESS")

        # 3. Reset database endpoint
        status_rst, data_rst = call_handler("POST", "/api/v1/admin/reset-database")
        self.assertEqual(status_rst, 200)
        self.assertEqual(data_rst["status"], "SUCCESS")

    def test_13_officers_endpoint(self):
        status, data = call_handler("GET", "/api/v1/officers")
        self.assertEqual(status, 200)
        self.assertIn("officers", data)
        self.assertGreaterEqual(len(data["officers"]), 50)
        self.assertIn("full_name", data["officers"][0])
        self.assertIn("designation", data["officers"][0])

    def test_14_true_random_dispatch_endpoint(self):
        status, data = call_handler("POST", "/api/v1/ai/true-random-dispatch", {})
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "SUCCESS")
        self.assertIn("dispatch", data)
        dispatch = data["dispatch"]
        self.assertIn("assigned_officer", dispatch)
        self.assertIn("full_name", dispatch["assigned_officer"])
        self.assertIn("facility", dispatch)
        self.assertIn("name", dispatch["facility"])
        self.assertIn("inspection_id", dispatch)

    def test_15_dynamic_scoring_via_submit_endpoint(self):
        # 1. Custom scores yielding 75
        payload = {
            "facility_id": "DOSJE-DL-001",
            "inspector_latitude": 28.5672,
            "inspector_longitude": 77.1734,
            "scores": {"infrastructure": 70, "hygiene": 75, "food": 75, "medical": 75, "attendance": 80},
            "inspector_name": "Kalyan Ram",
            "inspection_type": "SURPRISE_AUDIT"
        }
        status, data = call_handler("POST", "/api/v1/inspections/submit", payload)
        self.assertEqual(status, 200)
        self.assertEqual(data["total_compliance_score"], 75)
        self.assertNotEqual(data["total_compliance_score"], 86)
        self.assertIn("aes256_package_hash", data)
        self.assertNotEqual(data["aes256_package_hash"], "7639be42fbdbb1c5a92a18eb79e2e666a4f22495b41097e335805548074d4734")

        # 2. Second submission should have different hash
        status2, data2 = call_handler("POST", "/api/v1/inspections/submit", payload)
        self.assertEqual(status2, 200)
        self.assertNotEqual(data["aes256_package_hash"], data2["aes256_package_hash"])

    def test_16_pending_inspection_update_via_submit_endpoint(self):
        # 1. Trigger random dispatch to create an ASSIGNED inspection
        status_disp, disp_data = call_handler("POST", "/api/v1/ai/true-random-dispatch")
        self.assertEqual(status_disp, 200)
        disp = disp_data["dispatch"]
        insp_id = disp["inspection_id"]
        fac_id = disp["facility"]["id"]

        # 2. Submit the completed audit for this inspection
        payload = {
            "inspection_id": insp_id,
            "facility_id": fac_id,
            "inspector_name": disp["assigned_officer"]["full_name"],
            "inspector_latitude": disp["facility"]["latitude"] + 0.0001,
            "inspector_longitude": disp["facility"]["longitude"] + 0.0001,
            "scores": {"infrastructure": 85, "hygiene": 90, "food": 80, "medical": 85, "attendance": 90}
        }
        status_sub, sub_data = call_handler("POST", "/api/v1/inspections/submit", payload)
        self.assertEqual(status_sub, 200)
        self.assertEqual(sub_data["inspection_id"], insp_id)

        # 3. Check database overview - verify inspection is COMPLETED and not duplicated
        status_ov, ov_data = call_handler("GET", "/api/v1/admin/db-overview")
        self.assertEqual(status_ov, 200)
        completed_insp = next((i for i in ov_data["overview"]["inspections"] if i["id"] == insp_id), None)
        self.assertIsNotNone(completed_insp)
        self.assertEqual(completed_insp["status"], "COMPLETED")
        self.assertEqual(completed_insp["total_compliance_score"], 86)

    def test_17_live_feed_endpoint(self):
        status, data = call_handler("GET", "/api/v1/live-feed")
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "SUCCESS")
        self.assertIn("feed", data)
        self.assertIsInstance(data["feed"], list)
        if len(data["feed"]) > 0:
            first = data["feed"][0]
            self.assertIn("timestamp", first)
            self.assertIn("action", first)
            self.assertIn("officer_name", first)
            self.assertIn("facility_name", first)
            self.assertIn("location", first)
            self.assertIn("is_successful_audit", first)

    def test_18_inspection_detail_endpoint(self):
        status_lat, data_lat = call_handler("GET", "/api/v1/inspections/latest")
        self.assertEqual(status_lat, 200)
        insp_id = data_lat["latest_audit"]["id"]

        status_det, data_det = call_handler("GET", f"/api/v1/inspections/detail/{insp_id}")
        self.assertEqual(status_det, 200)
        self.assertEqual(data_det["status"], "SUCCESS")
        self.assertEqual(data_det["audit"]["id"], insp_id)

    def test_19_geofence_breach_rejection_at_submit(self):
        # Coordinates 50+ km away from Delhi (28.5672, 77.1734) -> Mumbai (19.0760, 72.8777)
        payload = {
            "facility_id": "DOSJE-DL-001",
            "inspector_name": "Offsite Tester",
            "inspector_latitude": 19.0760,
            "inspector_longitude": 72.8777,
            "scores": {"infrastructure": 85, "hygiene": 90, "food": 80, "medical": 85, "attendance": 90}
        }
        status, data = call_handler("POST", "/api/v1/inspections/submit", payload)
        self.assertEqual(status, 400)
        self.assertEqual(data["status"], "ERROR")
        self.assertEqual(data["error"], "GEOFENCE_BREACH")
        self.assertIn("Geofence Breach Error", data["message"])

    def test_20_android_apk_info_endpoint(self):
        status, data = call_handler("GET", "/api/v1/android/apk-info")
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["package_name"], "gov.mosje.sih26095")
        self.assertEqual(data["language"], "Kotlin")
        self.assertEqual(data["min_sdk"], 26)
        self.assertEqual(data["target_sdk"], 34)
        self.assertIn("CameraX", data["camera_subsystem"])
        self.assertIn("AES-256", data["encryption"])


if __name__ == '__main__':
    unittest.main()


