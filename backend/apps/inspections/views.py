from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import time
import uuid
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from database.db_adapter import db_adapter, haversine_distance_meters
from security.aes256_cipher import default_cipher

@csrf_exempt
def inspection_list_view(request):
    """Returns inspections filtered by status, inspector, or facility."""
    status = request.GET.get('status')
    inspector_id = request.GET.get('inspector_id')

    conn = db_adapter.get_connection()
    cur = conn.cursor()

    query = """
    SELECT i.*, f.name as facility_name, f.scheme_code, f.state, f.district, f.latitude as facility_lat, f.longitude as facility_lon
    FROM inspections i
    JOIN facilities f ON i.facility_id = f.id
    WHERE 1=1
    """
    params = []

    if status:
        query += " AND i.status = ?"
        params.append(status)
    if inspector_id:
        query += " AND i.inspector_id = ?"
        params.append(inspector_id)

    query += " ORDER BY i.scheduled_date DESC"
    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()

    return JsonResponse({'count': len(rows), 'inspections': rows})


@csrf_exempt
def submit_inspection_view(request):
    """Submits and finalizes a field inspection record."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    insp_id = body.get('inspection_id') or f"INSP-{int(time.time())}"
    facility_id = body.get('facility_id')
    inspector_lat = float(body.get('inspector_latitude', 0))
    inspector_lon = float(body.get('inspector_longitude', 0))
    scores = body.get('scores', {})
    
    score_infra = int(scores.get('infrastructure', 80))
    score_hygiene = int(scores.get('hygiene', 80))
    score_food = int(scores.get('food', 80))
    score_medical = int(scores.get('medical', 80))
    score_attendance = int(scores.get('attendance', 80))
    total_score = round((score_infra + score_hygiene + score_food + score_medical + score_attendance) / 5)

    # Check geofence
    conn = db_adapter.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT latitude, longitude, geofence_radius_meters FROM facilities WHERE id = ?", (facility_id,))
    fac = cur.fetchone()

    geofence_verified = 0
    distance = 0.0
    if fac:
        distance = haversine_distance_meters(inspector_lat, inspector_lon, fac['latitude'], fac['longitude'])
        geofence_verified = 1 if distance <= fac['geofence_radius_meters'] else 0

    now_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

    # Encrypt submission package with AES-256 (unique dynamic envelope)
    body_to_encrypt = dict(body)
    body_to_encrypt['encrypted_at'] = now_str
    body_to_encrypt['audit_nonce'] = os.urandom(16).hex()
    encrypted_pkg = default_cipher.encrypt_json(body_to_encrypt, associated_data=f"INSP_{insp_id}")

    cur.execute("""
    INSERT OR REPLACE INTO inspections (
        id, facility_id, inspector_name, inspection_type, status, scheduled_date, completed_at,
        inspector_latitude, inspector_longitude, geofence_verified, distance_to_facility_meters,
        score_infrastructure, score_hygiene, score_food_nutrition, score_medical_care, score_attendance,
        total_compliance_score, checklist_data, photos_evidence, inspector_signature_hash,
        facility_head_signature_hash, aes256_package_hash, synced_from_offline
    ) VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        insp_id,
        facility_id,
        body.get('inspector_name', 'Sunita Rao'),
        body.get('inspection_type', 'SURPRISE_AUDIT'),
        body.get('scheduled_date', time.strftime("%Y-%m-%d")),
        now_str,
        inspector_lat,
        inspector_lon,
        geofence_verified,
        distance,
        score_infra,
        score_hygiene,
        score_food,
        score_medical,
        score_attendance,
        total_score,
        json.dumps(body.get('checklist_data', {})),
        json.dumps(body.get('photos_evidence', [])),
        body.get('inspector_signature_hash', 'sig_insp_verified'),
        body.get('facility_head_signature_hash', 'sig_head_verified'),
        encrypted_pkg['sha256_hash'],
        1 if body.get('synced_from_offline') else 0
    ))

    # Update facility last inspected date
    cur.execute("UPDATE facilities SET last_inspected_at = ? WHERE id = ?", (now_str, facility_id))

    conn.commit()
    conn.close()

    return JsonResponse({
        'status': 'SUCCESS',
        'inspection_id': insp_id,
        'total_compliance_score': total_score,
        'geofence_verified': bool(geofence_verified),
        'distance_to_facility_meters': round(distance, 1),
        'aes256_package_hash': encrypted_pkg['sha256_hash'],
        'submitted_at': now_str
    })


@csrf_exempt
def latest_inspection_view(request):
    """Returns the latest completed inspection with full audit details and photos."""
    latest = db_adapter.get_latest_completed_audit()
    if not latest:
        return JsonResponse({'error': 'No completed audits found'}, status=404)
    return JsonResponse({'status': 'SUCCESS', 'latest_audit': latest})

