from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from video_engine.onvif_ptz_service import onvif_ptz_service
from video_engine.rtsp_stream_gateway import rtsp_gateway

@csrf_exempt
def stream_list_view(request):
    facility_id = request.GET.get('facility_id', 'DOSJE-DL-001')
    streams = rtsp_gateway.get_facility_streams(facility_id)
    return JsonResponse({'facility_id': facility_id, 'count': len(streams), 'streams': streams})


@csrf_exempt
def ptz_control_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        body = json.loads(request.body.decode('utf-8'))
        camera_id = body.get('camera_id', 'CAM-DL01-1')
        action = body.get('action', 'PAN_LEFT')
        velocity = float(body.get('velocity', 0.5))
    except Exception:
        return JsonResponse({'error': 'Invalid request body'}, status=400)

    try:
        result = onvif_ptz_service.send_ptz_command(camera_id, action, velocity)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def capture_snapshot_view(request, camera_id):
    result = rtsp_gateway.capture_live_frame(camera_id)
    return JsonResponse(result)
