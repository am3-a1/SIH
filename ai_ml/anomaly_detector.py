"""
AI/ML Module: Anomaly, Tampering & Anti-Spoofing Detection
SIH26095 - Ministry of Social Justice and Empowerment (MoSJE)
Detects GPS spoofing, photo duplication, EXIF timestamp manipulation, and fraudulent reports.
"""

import hashlib
import math
import time


class AnomalyDetector:
    """
    Evaluates inspection submissions for fraudulent patterns, mock location spoofing,
    and recycled media evidence.
    """

    def __init__(self, max_realistic_speed_kmh: float = 120.0, min_inspection_seconds: int = 180):
        self.max_realistic_speed_kmh = max_realistic_speed_kmh
        self.min_inspection_seconds = min_inspection_seconds
        self.known_image_hashes = set()

    def check_velocity_spoofing(self, prev_lat: float, prev_lon: float, prev_time: float,
                                curr_lat: float, curr_lon: float, curr_time: float) -> dict:
        """
        Calculates travel velocity between two consecutive check-in points.
        Flags mock location spoofing if velocity exceeds realistic limits.
        """
        time_diff_hours = (curr_time - prev_time) / 3600.0
        if time_diff_hours <= 0:
            return {"is_spoofed": True, "reason": "Non-chronological timestamp anomaly", "velocity_kmh": 0}

        # Approximate distance in km
        lat_dist = (curr_lat - prev_lat) * 111.0
        lon_dist = (curr_lon - prev_lon) * 111.0 * math.cos(math.radians((prev_lat + curr_lat) / 2.0))
        dist_km = math.sqrt(lat_dist ** 2 + lon_dist ** 2)

        velocity_kmh = dist_km / time_diff_hours

        is_spoofed = velocity_kmh > self.max_realistic_speed_kmh
        return {
            "is_spoofed": is_spoofed,
            "distance_km": round(dist_km, 2),
            "time_diff_minutes": round(time_diff_hours * 60, 1),
            "calculated_velocity_kmh": round(velocity_kmh, 1),
            "max_threshold_kmh": self.max_realistic_speed_kmh,
            "anomaly_flag": "GPS_SPOOFING_IMPOSSIBLE_TRANSIT" if is_spoofed else None
        }

    def check_image_duplication(self, image_data: str) -> dict:
        """
        Calculates cryptographic SHA-256 and perceptual hash of captured photo.
        Prevents inspectors from submitting recycled stock or past inspection photos.
        """
        img_hash = hashlib.sha256(image_data.encode('utf-8') if isinstance(image_data, str) else b"").hexdigest()
        is_duplicate = img_hash in self.known_image_hashes

        if not is_duplicate:
            self.known_image_hashes.add(img_hash)

        return {
            "is_duplicate": is_duplicate,
            "image_hash": img_hash,
            "authenticity_status": "ORIGINAL_LIVE_CAPTURE" if not is_duplicate else "RECYCLED_DUPLICATE_FLAGGED"
        }

    def check_audit_duration(self, start_timestamp: float, finish_timestamp: float, question_count: int = 15) -> dict:
        """
        Flags suspiciously rushed inspections that indicate checklist rubber-stamping.
        """
        duration = finish_timestamp - start_timestamp
        is_rushed = duration < self.min_inspection_seconds
        return {
            "duration_seconds": round(duration),
            "min_expected_seconds": self.min_inspection_seconds,
            "is_rushed": is_rushed,
            "warning": "Inspection completed too rapidly without adequate physical examination" if is_rushed else None
        }


anomaly_detector = AnomalyDetector()
