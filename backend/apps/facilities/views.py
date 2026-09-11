from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from database.db_adapter import db_adapter, haversine_distance_meters

@csrf_exempt
def facility_list_view(request):
    """Returns list of DoSJE institutions with optional scheme & risk filters."""
    scheme = request.GET.get('scheme')
    state = request.GET.get('state')
    min_risk = request.GET.get('min_risk')

    conn = db_adapter.get_connection()
    cur = conn.cursor()

    query = "SELECT * FROM facilities WHERE is_active = 1"
    params = []

    if scheme:
        query += " AND scheme_code = ?"
        params.append(scheme)
    if state:
        query += " AND state = ?"
        params.append(state)
    if min_risk:
        query += " AND risk_score >= ?"
        params.append(int(min_risk))

    query += " ORDER BY risk_score DESC"
    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()

    return JsonResponse({'count': len(rows), 'facilities': rows})


@csrf_exempt
def facility_detail_view(request, facility_id):
    """Returns detailed profile, enrolled beneficiary roster, and attached CCTV cameras."""
    conn = db_adapter.get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM facilities WHERE id = ?", (facility_id,))
    fac = cur.fetchone()
    if not fac:
        conn.close()
        return JsonResponse({'error': 'Facility not found'}, status=404)

    cur.execute("SELECT * FROM cctv_cameras WHERE facility_id = ?", (facility_id,))
    cameras = [dict(row) for row in cur.fetchall()]

    cur.execute("SELECT * FROM inspections WHERE facility_id = ? ORDER BY scheduled_date DESC LIMIT 5", (facility_id,))
    inspections = [dict(row) for row in cur.fetchall()]

    conn.close()
    return JsonResponse({
        'facility': dict(fac),
        'cameras': cameras,
        'recent_inspections': inspections
    })


@csrf_exempt
def verify_geofence_view(request, facility_id):
    """Verifies if inspector coordinates are within allowable geofence radius."""
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    if not lat or not lon:
        return JsonResponse({'error': 'Missing lat or lon query parameter'}, status=400)

    conn = db_adapter.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT latitude, longitude, geofence_radius_meters FROM facilities WHERE id = ?", (facility_id,))
    fac = cur.fetchone()
    conn.close()

    if not fac:
        return JsonResponse({'error': 'Facility not found'}, status=404)

    fac_lat, fac_lon, radius = fac['latitude'], fac['longitude'], fac['geofence_radius_meters']
    dist = haversine_distance_meters(float(lat), float(lon), fac_lat, fac_lon)
    is_within = dist <= radius

    return JsonResponse({
        'facility_id': facility_id,
        'inspector_lat': float(lat),
        'inspector_lon': float(lon),
        'facility_lat': fac_lat,
        'facility_lon': fac_lon,
        'distance_meters': round(dist, 1),
        'geofence_radius_meters': radius,
        'is_within_geofence': is_within,
        'status': 'VERIFIED' if is_within else 'PERIMETER_BREACH_DETECTED'
    })
