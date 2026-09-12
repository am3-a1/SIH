#!/usr/bin/env python3
"""
Comprehensive Test Suite for SIH26095 Working Prototype
Validates all layers: AES-256, OAuth2, RBAC, PostGIS Geofence, AI Models, ONVIF/WebRTC
"""

import unittest
import json
import time
import os

from security.aes256_cipher import default_cipher
from security.oauth2_provider import oauth2_provider
from security.rbac_permissions import check_permission, Permission, Role, can_inspect_facility
from database.db_adapter import db_adapter, haversine_distance_meters
from ai_ml.headcount_detector import headcount_detector
from ai_ml.privacy_masker import privacy_masker
from ai_ml.anomaly_detector import anomaly_detector
from ai_ml.random_dispatch_ai import random_dispatch_ai
from video_engine.onvif_ptz_service import onvif_ptz_service
from video_engine.rtsp_stream_gateway import rtsp_gateway
from video_engine.webrtc_signaling import webrtc_coordinator


class TestSIH26095Prototype(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        db_adapter.reset_to_default_seed()

    def test_01_aes256_encryption_decryption(self):
        """Test AES-256-GCM encryption and decryption round-trip."""
        secret_inspection_payload = {
            "facility_id": "DOSJE-DL-001",
            "inspector_id": "OFFICER-333",
            "findings": "All beneficiaries accounted for. Kitchen clean.",
            "scores": {"total": 92}
        }
        encrypted = default_cipher.encrypt_json(secret_inspection_payload, associated_data="INSP_001")
        self.assertEqual(encrypted["algorithm"], "AES-256-GCM")
        self.assertIn("nonce", encrypted)
        self.assertIn("ciphertext", encrypted)
        self.assertIn("tag", encrypted)

        # Decrypt and verify
        decrypted = default_cipher.decrypt_json(encrypted)
        self.assertEqual(decrypted["facility_id"], "DOSJE-DL-001")
        self.assertEqual(decrypted["scores"]["total"], 92)

    def test_02_oauth2_jwt_generation_and_verification(self):
        """Test OAuth2 token generation, claims verification, and expiration."""
        user_info = {
            "id": "33333333-3333-3333-3333-333333333333",
            "username": "inspector_delhi",
            "name": "Sunita Rao",
            "role": "DISTRICT_INSPECTOR",
            "district": "New Delhi",
            "state": "Delhi"
        }
        token_resp = oauth2_provider.create_token_response(user_info)
        self.assertEqual(token_resp["token_type"], "Bearer")
        self.assertIn("access_token", token_resp)
        self.assertIn("refresh_token", token_resp)

        # Verify JWT
        claims = oauth2_provider.verify_jwt(token_resp["access_token"])
        self.assertEqual(claims["sub"], "inspector_delhi")
        self.assertEqual(claims["role"], "DISTRICT_INSPECTOR")

    def test_03_rbac_permissions_enforcement(self):
        """Test 5-tier Role-Based Access Control matrix."""
        # National Admin has all privileges
        self.assertTrue(check_permission(Role.NATIONAL_ADMIN, Permission.TRIGGER_AI_DISPATCH))
        self.assertTrue(check_permission(Role.NATIONAL_ADMIN, Permission.CONTROL_PTZ))

        # Field Inspector can execute inspections but CANNOT issue sanctions or trigger national dispatch
        self.assertTrue(check_permission(Role.DISTRICT_INSPECTOR, Permission.EXECUTE_FIELD_INSPECTION))
        self.assertFalse(check_permission(Role.DISTRICT_INSPECTOR, Permission.TRIGGER_AI_DISPATCH))
        self.assertFalse(check_permission(Role.DISTRICT_INSPECTOR, Permission.ISSUE_SANCTION_NOTICE))

        # NGO Head can only view profile and submit corrective action
        self.assertTrue(check_permission(Role.FACILITY_HEAD, Permission.SUBMIT_CORRECTIVE_ACTION))
        self.assertFalse(check_permission(Role.FACILITY_HEAD, Permission.VIEW_CCTV_FEEDS))

    def test_04_spatial_geofencing_calculation(self):
        """Test PostGIS ST_DWithin / Haversine spatial distance calculations."""
        # Facility: Snehalaya Delhi at (28.5672, 77.1734) with radius 150m
        fac_lat, fac_lon = 28.5672, 77.1734

        # Point A: 35 meters away (VALID inside geofence)
        lat_inside, lon_inside = 28.5675, 77.1735
        dist_inside = haversine_distance_meters(lat_inside, lon_inside, fac_lat, fac_lon)
        self.assertLessEqual(dist_inside, 150.0)

        # Point B: 600 meters away (INVALID outside geofence)
        lat_outside, lon_outside = 28.5720, 77.1780
        dist_outside = haversine_distance_meters(lat_outside, lon_outside, fac_lat, fac_lon)
        self.assertGreater(dist_outside, 150.0)

    def test_05_tensorflow_headcount_discrepancy(self):
        """Test TensorFlow / TFLite headcount verification model."""
        enrolled = 60
        result = headcount_detector.detect_headcount_from_image("sample_frame_binary", enrolled)
        self.assertEqual(result["facility_registered_count"], 60)
        self.assertGreater(result["detected_count"], 0)
        self.assertIn("discrepancy_percentage", result)
        self.assertIn("is_anomaly", result)
        self.assertIn("detected_boxes", result)

    def test_06_privacy_face_blurring_engine(self):
        """Test DPDP Act 2023 beneficiary privacy face-anonymization."""
        result = privacy_masker.apply_privacy_mask("test_beneficiary_photo_data")
        self.assertEqual(result["privacy_mode"], "ACTIVE_PROTECTED")
        self.assertTrue(result["audit_trail_preserved"])
        self.assertIn("anonymized_media_hash", result)

    def test_07_anomaly_velocity_and_duplicate_check(self):
        """Test GPS velocity spoofing and duplicate image detection."""
        t1 = time.time()
        # Case 1: Realistic travel (10 km in 30 mins = 20 km/h)
        res_real = anomaly_detector.check_velocity_spoofing(28.56, 77.17, t1, 28.65, 77.17, t1 + 1800)
        self.assertFalse(res_real["is_spoofed"])

        # Case 2: Spoofed teleportation (Delhi to Mumbai 1,400 km in 5 mins)
        res_fake = anomaly_detector.check_velocity_spoofing(28.56, 77.17, t1, 19.07, 72.87, t1 + 300)
        self.assertTrue(res_fake["is_spoofed"])

    def test_08_risk_weighted_random_surprise_dispatch(self):
        """Test automated surprise audit dispatcher algorithm."""
        dispatches = random_dispatch_ai.trigger_automated_surprise_dispatch(max_assignments=2)
        self.assertIsInstance(dispatches, list)
        self.assertGreaterEqual(len(dispatches), 1)
        self.assertEqual(dispatches[0]["notice_mode"], "IMMEDIATE_UNANNOUNCED_SURPRISE")

    def test_09_onvif_ptz_service_commands(self):
        """Test ONVIF Profile S PTZ command generation."""
        res_pan = onvif_ptz_service.send_ptz_command("CAM-DL01-1", "PAN_RIGHT", velocity=0.7)
        self.assertEqual(res_pan["status"], "SUCCESS")
        self.assertEqual(res_pan["action"], "PAN_RIGHT")
        self.assertEqual(res_pan["vector"]["pan"], 0.7)

    def test_10_webrtc_signaling_and_snapshots(self):
        """Test WebRTC signaling room creation and snapshot stamping."""
        room = webrtc_coordinator.initiate_vc_spot_check("DOSJE-DL-001", "Vikramaditya Roy")
        self.assertTrue(room["room_id"].startswith("VC-SPOT-"))
        self.assertEqual(len(room["ice_servers"]), 3)

        # Capture in-call snapshot
        snap = webrtc_coordinator.capture_vc_snapshot(room["room_id"])
        self.assertTrue(snap["watermark"]["verified"])
        self.assertIn("sha256_hash", snap)

    def test_11_latest_completed_audit_details(self):
        """Test retrieval of latest completed audit with facility, officer, and watermarked photo evidence."""
        latest = db_adapter.get_latest_completed_audit()
        self.assertIsNotNone(latest)
        self.assertEqual(latest["status"], "COMPLETED")
        self.assertIn("facility_name", latest)
        self.assertIn("inspector_name", latest)
        self.assertIn("total_compliance_score", latest)
        self.assertTrue(latest["geofence_verified"])

        # Validate photos and watermarks
        photos = latest.get("photos_evidence", [])
        self.assertIsInstance(photos, list)
        self.assertGreater(len(photos), 0)
        self.assertIn("watermark_text", photos[0])
        self.assertIn("sha256_hash", photos[0])
        self.assertIn("latitude", photos[0])
        self.assertIn("longitude", photos[0])

    def test_12_admin_database_operations(self):
        """Test Admin DB overview stats, clearing audits, and resetting seed data."""
        overview = db_adapter.get_database_overview()
        self.assertIn("counts", overview)
        self.assertGreaterEqual(overview["counts"]["total_facilities"], 12)
        self.assertGreaterEqual(overview["counts"]["total_officers"], 4)

        # Clear audits
        cleared = db_adapter.clear_audits()
        self.assertTrue(cleared)
        after_clear = db_adapter.get_latest_completed_audit()
        self.assertIsNone(after_clear)

        # Reset to default seed
        reset_ok = db_adapter.reset_to_default_seed()
        self.assertTrue(reset_ok)
        after_reset = db_adapter.get_latest_completed_audit()
        self.assertIsNotNone(after_reset)

    def test_13_fifty_officers_database_pool(self):
        """Test existence, attributes, and retrieval of the 50 onsite field officers."""
        officers = db_adapter.get_officers_with_assignments()
        self.assertGreaterEqual(len(officers), 50)
        
        # Verify onsite inspectors are properly seeded
        onsite_officers = [o for o in officers if o.get("role") == "DISTRICT_INSPECTOR"]
        self.assertGreaterEqual(len(onsite_officers), 50)
        
        sample_officer = onsite_officers[0]
        self.assertIn("id", sample_officer)
        self.assertIn("username", sample_officer)
        self.assertIn("full_name", sample_officer)
        self.assertIn("designation", sample_officer)
        self.assertIn("state", sample_officer)
        self.assertIn("phone", sample_officer)
        self.assertIn("email", sample_officer)

    def test_14_true_random_dispatch_engine(self):
        """Test true random dispatch engine assigning an officer randomly from 50 officers."""
        dispatch = random_dispatch_ai.trigger_true_random_dispatch()
        self.assertIsNotNone(dispatch)
        self.assertEqual(dispatch["notice_mode"], "TRUE_RANDOM_UNANNOUNCED_SURPRISE")
        self.assertIn("inspection_id", dispatch)
        self.assertIn("facility", dispatch)
        self.assertIn("id", dispatch["facility"])
        self.assertIn("name", dispatch["facility"])
        self.assertIn("assigned_officer", dispatch)
        
        assigned_officer = dispatch["assigned_officer"]
        self.assertIn("full_name", assigned_officer)
        self.assertIn("username", assigned_officer)
        self.assertTrue(assigned_officer["username"].startswith("insp_") or assigned_officer["username"].startswith("inspector_") or assigned_officer.get("role") == "DISTRICT_INSPECTOR")

    def test_15_dynamic_inspection_scoring_and_audit(self):
        """Test that checklist scoring dynamically computes score rather than hardcoded 86/100."""
        sample_photos = [
            {"category": "Dining Hall", "watermark_text": "MoSJE AUDIT", "sha256_hash": "hash123", "latitude": 28.5672, "longitude": 77.1734}
        ]
        # Case A: Perfect scores -> 100
        scores_100 = {"infrastructure": 100, "hygiene": 100, "food": 100, "medical": 100, "attendance": 100}
        res_100 = db_adapter.submit_audit_report(
            facility_id="DOSJE-DL-001",
            inspector_id="OFFICER-ONSITE-001",
            inspector_lat=28.5672,
            inspector_lon=77.1734,
            scores=scores_100,
            photos_evidence=sample_photos,
            inspector_signature="sig_test_100",
            head_signature="sig_head_100"
        )
        self.assertEqual(res_100["total_compliance_score"], 100)
        self.assertNotEqual(res_100["total_compliance_score"], 86)

        # Case B: Custom scores -> 66
        scores_68 = {"infrastructure": 60, "hygiene": 70, "food": 65, "medical": 65, "attendance": 70}
        res_68 = db_adapter.submit_audit_report(
            facility_id="DOSJE-DL-001",
            inspector_id="OFFICER-ONSITE-002",
            inspector_lat=28.5672,
            inspector_lon=77.1734,
            scores=scores_68,
            photos_evidence=sample_photos,
            inspector_signature="sig_test_68",
            head_signature="sig_head_68"
        )
        self.assertEqual(res_68["total_compliance_score"], 66)
        self.assertNotEqual(res_68["total_compliance_score"], 86)

    def test_16_aes256_package_hash_uniqueness(self):
        """Test that every AES-256 encrypted submission produces a unique cryptographic package hash."""
        payload1 = {"facility_id": "DOSJE-DL-001", "timestamp": time.time(), "score": 90}
        payload2 = {"facility_id": "DOSJE-DL-001", "timestamp": time.time() + 1, "score": 90}

        enc1 = default_cipher.encrypt_json(payload1)
        enc2 = default_cipher.encrypt_json(payload2)

        self.assertIn("sha256_hash", enc1)
        self.assertIn("sha256_hash", enc2)
        # Verify hashes are distinct and not equal to the previous static hash
        self.assertNotEqual(enc1["sha256_hash"], enc2["sha256_hash"])
        self.assertNotEqual(enc1["sha256_hash"], "7639be42fbdbb1c5a92a18eb79e2e666a4f22495b41097e335805548074d4734")

    def test_17_assigned_audit_completion_updates_record_and_facility(self):
        """Test that completing an assigned audit updates the pending database record rather than creating a duplicate, and updates facility risk/alerts."""
        conn = db_adapter.get_connection()
        cur = conn.cursor()

        # 1. Assign a surprise audit to DOSJE-PB-002
        dispatches = random_dispatch_ai.trigger_automated_surprise_dispatch(max_assignments=1, force=True)
        self.assertGreaterEqual(len(dispatches), 1)
        disp = dispatches[0]
        disp_fac_id = disp["facility_id"]
        disp_insp_id = disp["inspection_id"]

        # Verify it is in database as ASSIGNED
        cur.execute("SELECT id, status FROM inspections WHERE id = ?", (disp_insp_id,))
        assigned_row = cur.fetchone()
        self.assertIsNotNone(assigned_row)
        self.assertEqual(assigned_row["status"], "ASSIGNED")

        # 2. Complete the audit for that facility with onsite coordinates
        cur.execute("SELECT latitude, longitude FROM facilities WHERE id = ?", (disp_fac_id,))
        fac_coords = cur.fetchone()
        scores = {"infrastructure": 90, "hygiene": 85, "food": 90, "medical": 85, "attendance": 90}
        res = db_adapter.submit_audit_report(
            facility_id=disp_fac_id,
            inspector_name=disp["assigned_officer"],
            inspector_lat=fac_coords["latitude"] + 0.0002,
            inspector_lon=fac_coords["longitude"] + 0.0001,
            scores=scores,
            inspection_id=disp_insp_id
        )

        self.assertEqual(res["inspection_id"], disp_insp_id)
        self.assertEqual(res["total_compliance_score"], 88)

        # 3. Verify the pending status was updated to COMPLETED in the database
        cur.execute("SELECT id, status, total_compliance_score FROM inspections WHERE id = ?", (disp_insp_id,))
        updated_row = cur.fetchone()
        self.assertEqual(updated_row["status"], "COMPLETED")
        self.assertEqual(updated_row["total_compliance_score"], 88)

        # Verify NO duplicate ASSIGNED row exists for this inspection
        cur.execute("SELECT COUNT(*) FROM inspections WHERE id = ?", (disp_insp_id,))
        count = cur.fetchone()[0]
        self.assertEqual(count, 1)

        # 4. Verify facility was updated in registered facilities table
        cur.execute("SELECT compliance_grade, risk_score, last_inspected_at FROM facilities WHERE id = ?", (disp_fac_id,))
        fac_row = cur.fetchone()
        self.assertEqual(fac_row["compliance_grade"], "A")
        self.assertLessEqual(fac_row["risk_score"], 20)
        self.assertIsNotNone(fac_row["last_inspected_at"])

        # 5. Verify pending dispatch alert was resolved
        cur.execute("SELECT COUNT(*) FROM system_alerts WHERE facility_id = ? AND alert_type = 'SURPRISE_AUDIT_TRIGGERED' AND is_resolved = 0", (disp_fac_id,))
        unresolved_alerts = cur.fetchone()[0]
        self.assertEqual(unresolved_alerts, 0)
        conn.close()

    def test_18_random_dispatch_does_not_insert_critical_anomaly(self):
        """Test that random dispatch does NOT insert critical anomaly flags into system_alerts."""
        conn = db_adapter.get_connection()
        cur = conn.cursor()
        
        # Count critical alerts before dispatch
        cur.execute("SELECT COUNT(*) FROM system_alerts WHERE alert_type = 'SURPRISE_AUDIT_TRIGGERED'")
        count_before = cur.fetchone()[0]

        # Trigger true random dispatch
        res = random_dispatch_ai.trigger_true_random_dispatch()
        self.assertIn("assigned_officer", res)
        self.assertIn("facility", res)
        self.assertIn("id", res["facility"])

        # Count critical alerts after dispatch - must NOT increase
        cur.execute("SELECT COUNT(*) FROM system_alerts WHERE alert_type = 'SURPRISE_AUDIT_TRIGGERED'")
        count_after = cur.fetchone()[0]
        self.assertEqual(count_before, count_after)

        conn.close()

    def test_19_live_officer_feed_format_and_successful_audit_flag(self):
        """Test that get_live_officer_feed returns rows matching <Time><Timezone> <Action> <Officer Name> <Facility Audited> <Location/City> and tags successful audits."""
        feed = db_adapter.get_live_officer_feed(limit=10)
        self.assertIsInstance(feed, list)
        self.assertGreater(len(feed), 0)

        for item in feed:
            self.assertIn("timestamp", item)
            self.assertIn("timezone", item)
            self.assertEqual(item["timezone"], "IST")
            self.assertTrue(item["timestamp"].endswith("IST"))
            self.assertIn("action", item)
            self.assertIn("officer_name", item)
            self.assertIn("facility_name", item)
            self.assertIn("location", item)
            self.assertIn("is_successful_audit", item)
            self.assertIn("inspection_id", item)

            # Check that only completed audits with score >= 60 are tagged as successful
            if item["is_successful_audit"]:
                self.assertEqual(item["status"], "COMPLETED")
                self.assertIsNotNone(item["score"])
                self.assertGreaterEqual(item["score"], 60)

    def test_20_officers_assigned_facilities_locking_and_inspection_detail(self):
        """Test that get_officers_with_assignments maps assigned facilities for locked dropdown and get_inspection_by_id loads full audit."""
        officers = db_adapter.get_officers_with_assignments()
        self.assertGreater(len(officers), 0)

        # Verify structure for locking
        for off in officers:
            self.assertIn("assigned_inspections", off)
            self.assertIn("assigned_facility_ids", off)
            self.assertIn("has_pending_assignment", off)
            self.assertIsInstance(off["assigned_facility_ids"], list)

        # Verify get_inspection_by_id
        latest = db_adapter.get_latest_completed_audit()
        if latest:
            insp_id = latest["id"]
            loaded = db_adapter.get_inspection_by_id(insp_id)
            self.assertIsNotNone(loaded)
            self.assertEqual(loaded["id"], insp_id)
            self.assertEqual(loaded["facility_name"], latest["facility_name"])

    def test_20_native_android_project_structure(self):
        """Verify Native Android project structure, CameraX, watermarking, and Web folder."""
        # Check Web/ folder (supports modern Next.js App Router or legacy)
        web_dir = os.path.join(os.path.dirname(__file__), "Web")
        self.assertTrue(os.path.exists(web_dir), "Web/ directory must exist")
        is_next_app = os.path.isfile(os.path.join(web_dir, "package.json"))
        if is_next_app:
            self.assertTrue(os.path.isfile(os.path.join(web_dir, "src", "app", "page.tsx")))
            self.assertTrue(os.path.isfile(os.path.join(web_dir, "src", "app", "layout.tsx")))
        else:
            self.assertTrue(os.path.isfile(os.path.join(web_dir, "index.html")))
            self.assertTrue(os.path.isfile(os.path.join(web_dir, "app.js")))

        # Check android/ project
        android_dir = os.path.join(os.path.dirname(__file__), "android")
        self.assertTrue(os.path.exists(android_dir), "android/ directory must exist")
        self.assertTrue(os.path.isfile(os.path.join(android_dir, "build.gradle")))
        self.assertTrue(os.path.isfile(os.path.join(android_dir, "settings.gradle")))
        self.assertTrue(os.path.isfile(os.path.join(android_dir, "app", "build.gradle")))

        # Check AndroidManifest.xml
        manifest = os.path.join(android_dir, "app", "src", "main", "AndroidManifest.xml")
        self.assertTrue(os.path.isfile(manifest))
        with open(manifest, 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn("android.permission.CAMERA", content)
            self.assertIn("android.permission.ACCESS_FINE_LOCATION", content)
            self.assertIn("gov.mosje.sih26095.fileprovider", content)
            self.assertIn("NativeCameraCaptureActivity", content)

        # Check Key Kotlin Source Files
        java_base = os.path.join(android_dir, "app", "src", "main", "java", "gov", "mosje", "sih26095")
        self.assertTrue(os.path.isfile(os.path.join(java_base, "camera", "NativeCameraCaptureActivity.kt")))
        self.assertTrue(os.path.isfile(os.path.join(java_base, "camera", "CameraWatermarkProcessor.kt")))
        self.assertTrue(os.path.isfile(os.path.join(java_base, "util", "GeofenceCalculator.kt")))
        self.assertTrue(os.path.isfile(os.path.join(java_base, "security", "HashUtil.kt")))
        self.assertTrue(os.path.isfile(os.path.join(java_base, "security", "AesCipherUtil.kt")))
        self.assertTrue(os.path.isfile(os.path.join(java_base, "ui", "audit", "AuditActivity.kt")))
        self.assertTrue(os.path.isfile(os.path.join(java_base, "ui", "login", "LoginActivity.kt")))

        # Check Android Unit Tests
        test_base = os.path.join(android_dir, "app", "src", "test", "java", "gov", "mosje", "sih26095")
        self.assertTrue(os.path.isfile(os.path.join(test_base, "GeofenceCalculatorTest.kt")))
        self.assertTrue(os.path.isfile(os.path.join(test_base, "ScoringTest.kt")))
        self.assertTrue(os.path.isfile(os.path.join(test_base, "HashUtilTest.kt")))

    @classmethod
    def tearDownClass(cls):
        db_adapter.reset_to_default_seed()


if __name__ == '__main__':
    unittest.main()

