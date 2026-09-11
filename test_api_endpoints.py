#!/usr/bin/env python3
"""
HTTP API Integration Test for SIH26095 Backend Server
"""

import urllib.request
import json
import threading
import time
import os

from run_prototype import run_server

# Start server in background thread
server_thread = threading.Thread(target=run_server, args=(8088,), daemon=True)
server_thread.start()
time.sleep(1)

base_url = "http://127.0.0.1:8088"

def test_endpoint(name, path, method="GET", data=None):
    url = base_url + path
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8') if data else None, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode('utf-8'))
            print(f"✅ [{resp.status}] {name} ({path}): Success")
            return body
    except Exception as e:
        print(f"❌ {name} ({path}) Failed: {e}")
        raise e

print("\n--- RUNNING API INTEGRATION TESTS ---")
# 1. Auth Login
login_data = test_endpoint("OAuth2 Login", "/api/v1/auth/login", method="POST", data={"username": "inspector_delhi"})
assert "access_token" in login_data

# 2. National Stats
stats_data = test_endpoint("National Stats", "/api/v1/ai/national-stats")
assert stats_data["national_metrics"]["total_institutions"] >= 12

# 3. Facilities
facs_data = test_endpoint("Facility List", "/api/v1/facilities")
assert facs_data["count"] >= 12

# 4. Geofence Check
geo_data = test_endpoint("Geofence Check", "/api/v1/facilities/DOSJE-DL-001/verify-geofence?lat=28.5675&lon=77.1735")
assert geo_data["is_within_geofence"] is True

# 5. Submit Field Inspection
sub_data = test_endpoint("Submit Inspection", "/api/v1/inspections/submit", method="POST", data={
    "facility_id": "DOSJE-DL-001",
    "inspector_latitude": 28.5675,
    "inspector_longitude": 77.1735,
    "scores": {"infrastructure": 90, "hygiene": 92, "food": 85, "medical": 88, "attendance": 90}
})
assert sub_data["status"] == "SUCCESS"
assert sub_data["total_compliance_score"] == 89

# 6. CCTV Streams
cctv_data = test_endpoint("CCTV Streams", "/api/v1/cctv/streams?facility_id=DOSJE-DL-001")
assert cctv_data["count"] >= 3

# 7. ONVIF PTZ
ptz_data = test_endpoint("ONVIF PTZ", "/api/v1/cctv/ptz/command", method="POST", data={"camera_id": "CAM-DL01-1", "action": "PAN_LEFT"})
assert ptz_data["status"] == "SUCCESS"

# 8. WebRTC Spot Check Initiate
vc_data = test_endpoint("WebRTC Initiate", "/api/v1/vc/initiate", method="POST", data={"facility_id": "DOSJE-DL-001"})
assert "room_id" in vc_data

# 9. AI Headcount Scan
ai_scan = test_endpoint("AI Headcount Scan", "/api/v1/ai/headcount-scan", method="POST", data={"facility_id": "DOSJE-DL-001"})
assert ai_scan["detected_count"] > 0

# 10. AI Random Dispatch
dispatch_data = test_endpoint("AI Random Dispatch", "/api/v1/ai/dispatch-random", method="POST")
assert dispatch_data["status"] == "SUCCESS"

print("\n🎉 ALL 10 API INTEGRATION TESTS PASSED SUCCESSFULLY!\n")
