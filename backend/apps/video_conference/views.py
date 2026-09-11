from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from video_engine.webrtc_signaling import webrtc_coordinator

@csrf_exempt
def initiate_vc_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    try:
        body = json.loads(request.body.decode('utf-8'))
        facility_id = body.get('facility_id', 'DOSJE-DL-001')
        auditor_name = body.get('auditor_name', 'Vikramaditya Roy')
    except Exception:
        facility_id = 'DOSJE-DL-001'
        auditor_name = 'Vikramaditya Roy'

    room = webrtc_coordinator.initiate_vc_spot_check(facility_id, auditor_name)
    return JsonResponse(room)


@csrf_exempt
def capture_snapshot_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        body = json.loads(request.body.decode('utf-8'))
        room_id = body.get('room_id', 'VC-DEFAULT')
    except Exception:
        room_id = 'VC-DEFAULT'

    snap = webrtc_coordinator.capture_vc_snapshot(room_id)
    return JsonResponse(snap)


@csrf_exempt
def complete_vc_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        body = json.loads(request.body.decode('utf-8'))
        room_id = body.get('room_id')
        headcount = int(body.get('headcount_verified', 0))
        notes = body.get('notes', 'Routine unannounced spot check conducted successfully.')
    except Exception:
        return JsonResponse({'error': 'Invalid request parameters'}, status=400)

    result = webrtc_coordinator.complete_vc_spot_check(room_id, headcount, notes)
    return JsonResponse(result)
