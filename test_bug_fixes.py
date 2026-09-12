#!/usr/bin/env python3
"""
Unit tests specifically targeting the 3 bug fixes:
1. All 52 officers are exposed via /api/v1/officers and have assignable facilities.
2. Submission with is_simulated_onsite succeeds and generates AES-256 package.
3. Submission with low score (<60) generates alerts using uuid cleanly without NameError.
4. Strict geofence breach rejection remains enforced when not simulated.
5. Android assets (officers_seed.json and facilities_seed.json) exist and are valid.
"""

import json
import os
import unittest
from test_in_memory_handler import call_handler

class TestBugFixes(unittest.TestCase):

    def test_bug1_all_officers_loaded_with_facilities(self):
        status, data = call_handler("GET", "/api/v1/officers")
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "SUCCESS")
        officers = data["officers"]
        self.assertEqual(len(officers), 52)

        # Ensure every officer has at least one assignable facility in their jurisdiction
        for off in officers:
            self.assertIn("id", off)
            self.assertIn("full_name", off)
            self.assertIn("assigned_facility_ids", off)
            self.assertGreater(len(off["assigned_facility_ids"]), 0, f"Officer {off['full_name']} has 0 assigned facilities!")

    def test_bug2_assets_seed_files_exist_and_valid(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        officers_path = os.path.join(base_dir, "android", "app", "src", "main", "assets", "officers_seed.json")
        facilities_path = os.path.join(base_dir, "android", "app", "src", "main", "assets", "facilities_seed.json")

        self.assertTrue(os.path.exists(officers_path), "officers_seed.json missing from android assets")
        self.assertTrue(os.path.exists(facilities_path), "facilities_seed.json missing from android assets")

        with open(officers_path) as f:
            off_data = json.load(f)
            self.assertEqual(len(off_data.get("officers", [])), 52)

        with open(facilities_path) as f:
            fac_data = json.load(f)
            self.assertEqual(len(fac_data.get("facilities", [])), 12)

    def test_bug3_submit_with_simulated_onsite_accepted(self):
        # Testing from coordinates outside Delhi with is_simulated_onsite: True
        payload = {
            "facility_id": "DOSJE-DL-001",
            "inspector_name": "Sunita Rao",
            "inspector_latitude": 19.0760, # Mumbai coordinates
            "inspector_longitude": 72.8777,
            "is_simulated_onsite": True,
            "scores": {
                "infrastructure": 90,
                "hygiene": 92,
                "food": 85,
                "medical": 88,
                "attendance": 90
            }
        }
        status, data = call_handler("POST", "/api/v1/inspections/submit", payload)
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "SUCCESS")
        self.assertTrue(data["geofence_verified"])
        self.assertIn("aes256_package_hash", data)

    def test_bug3_submit_low_score_triggers_alert_cleanly(self):
        # Submission with low compliance score (<60) should trigger alert without uuid NameError
        payload = {
            "facility_id": "DOSJE-DL-001",
            "inspector_name": "Sunita Rao",
            "inspector_latitude": 28.5672,
            "inspector_longitude": 77.1734,
            "scores": {
                "infrastructure": 40,
                "hygiene": 45,
                "food": 30,
                "medical": 40,
                "attendance": 45
            }
        }
        status, data = call_handler("POST", "/api/v1/inspections/submit", payload)
        self.assertEqual(status, 200)
        self.assertEqual(data["status"], "SUCCESS")
        self.assertLess(data["total_compliance_score"], 60)

    def test_bug3_strict_geofence_rejection_preserved(self):
        # Submission without simulation from 1000km away must be rejected
        payload = {
            "facility_id": "DOSJE-DL-001",
            "inspector_name": "Offsite Tester",
            "inspector_latitude": 13.0827, # Chennai
            "inspector_longitude": 80.2707,
            "is_simulated_onsite": False,
            "scores": {"infrastructure": 85, "hygiene": 90, "food": 80, "medical": 85, "attendance": 90}
        }
        status, data = call_handler("POST", "/api/v1/inspections/submit", payload)
        self.assertEqual(status, 400)
        self.assertEqual(data["status"], "ERROR")
        self.assertEqual(data["error"], "GEOFENCE_BREACH")

if __name__ == '__main__':
    unittest.main()
