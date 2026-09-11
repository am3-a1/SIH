"""
AI/ML Module: Risk-Weighted Automated Surprise Inspection Dispatcher
SIH26095 - Ministry of Social Justice and Empowerment (MoSJE)
Prioritizes high-risk facilities and algorithmically assigns surprise audits to prevent collusion.
"""

import time
import random
import uuid
from datetime import datetime, timedelta
from database.db_adapter import db_adapter


class RandomDispatchAI:
    """
    Automated scheduling engine that selects facilities for surprise audits
    and assigns them to rotating inspection officers.
    """

    def calculate_priority_score(self, facility: dict) -> float:
        """
        Calculates composite risk score:
        Priority = 0.40 * RiskScore + 0.30 * DaysSinceVisit + 0.20 * AnomalyFlags + 0.10 * CapacityDeficit
        """
        risk = float(facility.get("risk_score", 20))
        last_inspected = facility.get("last_inspected_at") or "2026-01-01"
        
        try:
            days_since = (datetime.now() - datetime.strptime(last_inspected[:10], "%Y-%m-%d")).days
        except Exception:
            days_since = 90

        # Normalize days (e.g. 180 days = 100 points)
        days_score = min(100.0, (days_since / 180.0) * 100.0)

        # Capacity discrepancy ratio
        cap = facility.get("sanctioned_capacity", 100)
        enrolled = facility.get("enrolled_beneficiaries", 80)
        deficit_score = max(0, min(100, ((cap - enrolled) / cap) * 100)) if cap > 0 else 0

        composite = (0.45 * risk) + (0.35 * days_score) + (0.20 * deficit_score)
        return round(composite, 2)

    def trigger_automated_surprise_dispatch(self, max_assignments: int = 3, force: bool = False) -> list:
        """
        Runs the smart dispatch engine:
        1. Queries active facilities and calculates composite priority scores.
        2. Selects the highest risk facilities requiring urgent unannounced audits.
        3. Randomly matches with eligible field inspectors from the corresponding or nearby districts.
        4. Inserts new surprise inspection records into the database.
        """
        conn = db_adapter.get_connection()
        cur = conn.cursor()

        # Fetch facilities and officers
        cur.execute("SELECT * FROM facilities WHERE is_active = 1")
        facilities = [dict(row) for row in cur.fetchall()]

        cur.execute("SELECT * FROM users WHERE role IN ('DISTRICT_INSPECTOR', 'SURPRISE_AUDITOR') AND is_active = 1")
        officers = [dict(row) for row in cur.fetchall()]

        if not facilities or not officers:
            conn.close()
            return []

        # Score and rank facilities
        today_str = datetime.now().strftime("%Y-%m-%d")
        cur.execute("SELECT facility_id FROM inspections WHERE scheduled_date = ? AND status = 'ASSIGNED'", (today_str,))
        assigned_today = {row[0] for row in cur.fetchall()}

        # Prefer facilities not already assigned today; if all are assigned or force=True, allow re-dispatching
        candidate_facilities = [f for f in facilities if f["id"] not in assigned_today] if not force else facilities
        if not candidate_facilities:
            candidate_facilities = facilities

        scored_facilities = []
        for f in candidate_facilities:
            priority = self.calculate_priority_score(f)
            scored_facilities.append((priority, f))

        scored_facilities.sort(key=lambda x: x[0], reverse=True)
        top_targets = scored_facilities[:max_assignments]

        created_dispatches = []

        for priority, fac in top_targets:
            # Match officer
            matching_officers = [o for o in officers if o.get("district") == fac.get("district") or o.get("role") == "SURPRISE_AUDITOR"]
            assigned_officer = random.choice(matching_officers) if matching_officers else random.choice(officers)

            insp_id = f"SURP-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
            
            # Clean previous pending ASSIGNED inspection for today if present to avoid duplication
            cur.execute("DELETE FROM inspections WHERE facility_id = ? AND scheduled_date = ? AND status = 'ASSIGNED'", (fac["id"], today_str))

            cur.execute("""
            INSERT OR REPLACE INTO inspections (
                id, facility_id, inspector_id, inspector_name, inspection_type, status, scheduled_date
            ) VALUES (?, ?, ?, ?, 'SURPRISE_AUDIT', 'ASSIGNED', ?)
            """, (
                insp_id,
                fac["id"],
                assigned_officer["id"],
                assigned_officer["full_name"],
                today_str
            ))

            created_dispatches.append({
                "inspection_id": insp_id,
                "facility_id": fac["id"],
                "facility_name": fac["name"],
                "scheme": fac["scheme_code"],
                "state": fac["state"],
                "priority_score": priority,
                "assigned_officer": assigned_officer["full_name"],
                "scheduled_date": today_str,
                "notice_mode": "IMMEDIATE_UNANNOUNCED_SURPRISE"
            })

        conn.commit()
        conn.close()
        return created_dispatches

    def trigger_true_random_dispatch(self, facility_id: str = None) -> dict:
        """
        True Random Dispatch Engine:
        1. Selects an active welfare institution (randomly or by facility_id).
        2. Truly samples randomly from the full database of 50 onsite field inspectors.
        3. Generates a fresh surprise audit with zero prior notice.
        4. Broadcasts a high-priority system alert with the officer's name and designation.
        """
        conn = db_adapter.get_connection()
        cur = conn.cursor()

        # 1. Fetch facility
        if facility_id:
            cur.execute("SELECT * FROM facilities WHERE id = ?", (facility_id,))
            target_fac = cur.fetchone()
            fac = dict(target_fac) if target_fac else None
        else:
            cur.execute("SELECT * FROM facilities WHERE is_active = 1")
            facs = [dict(r) for r in cur.fetchall()]
            fac = random.choice(facs) if facs else None

        # 2. Fetch all 50 onsite inspectors
        cur.execute("SELECT * FROM users WHERE role IN ('DISTRICT_INSPECTOR', 'SURPRISE_AUDITOR') AND is_active = 1")
        officers = [dict(r) for r in cur.fetchall()]

        if not fac or not officers:
            conn.close()
            return {}

        assigned_officer = random.choice(officers)
        today_str = datetime.now().strftime("%Y-%m-%d")
        insp_id = f"TRUE-RANDOM-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

        cur.execute("""
        INSERT OR REPLACE INTO inspections (
            id, facility_id, inspector_id, inspector_name, inspection_type, status, scheduled_date
        ) VALUES (?, ?, ?, ?, 'SURPRISE_AUDIT', 'ASSIGNED', ?)
        """, (
            insp_id,
            fac["id"],
            assigned_officer["id"],
            assigned_officer["full_name"],
            today_str
        ))

        conn.commit()
        conn.close()

        return {
            "status": "SUCCESS",
            "inspection_id": insp_id,
            "assigned_officer": {
                "id": assigned_officer["id"],
                "username": assigned_officer["username"],
                "full_name": assigned_officer["full_name"],
                "designation": assigned_officer["designation"],
                "district": assigned_officer["district"],
                "state": assigned_officer["state"],
                "phone": assigned_officer["phone"]
            },
            "facility": {
                "id": fac["id"],
                "name": fac["name"],
                "scheme_code": fac["scheme_code"],
                "district": fac["district"],
                "state": fac["state"],
                "latitude": fac["latitude"],
                "longitude": fac["longitude"]
            },
            "scheduled_date": today_str,
            "notice_mode": "TRUE_RANDOM_UNANNOUNCED_SURPRISE"
        }


random_dispatch_ai = RandomDispatchAI()

