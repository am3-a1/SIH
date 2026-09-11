"""
Video Engine: ONVIF Camera Discovery & PTZ Control Service
SIH26095 - Ministry of Social Justice and Empowerment (MoSJE)
Complies with ONVIF Profile S (Streaming) and Profile G (Storage & PTZ).
"""

import time
import json


class ONVIFPTZService:
    """
    ONVIF Camera Device Management and PTZ (Pan-Tilt-Zoom) controller.
    Provides standardized control over facility surveillance cameras.
    """

    def __init__(self):
        self.camera_profiles = {}

    def discover_cameras(self, subnet: str = "192.168.1.0/24") -> list:
        """
        Simulates WS-Discovery probe across facility local area network.
        Returns list of discovered ONVIF compliant camera nodes.
        """
        return [
            {
                "device_id": "ONVIF-NODE-01",
                "ip": "192.168.10.101",
                "port": 80,
                "hardware": "Hikvision / CP Plus DoSJE Gov Spec",
                "onvif_version": "v2.60 Profile S/G",
                "ptz_capable": True,
                "stream_uri": "rtsp://192.168.10.101:554/onvif1"
            },
            {
                "device_id": "ONVIF-NODE-02",
                "ip": "192.168.10.102",
                "port": 80,
                "hardware": "Dahua High-Res Night Vision PTZ",
                "onvif_version": "v2.50 Profile S",
                "ptz_capable": True,
                "stream_uri": "rtsp://192.168.10.102:554/onvif1"
            }
        ]

    def send_ptz_command(self, camera_id: str, action: str, velocity: float = 0.5) -> dict:
        """
        Executes continuous or relative PTZ movement command.
        Actions: 'PAN_LEFT', 'PAN_RIGHT', 'TILT_UP', 'TILT_DOWN', 'ZOOM_IN', 'ZOOM_OUT', 'STOP'
        """
        allowed_actions = {'PAN_LEFT', 'PAN_RIGHT', 'TILT_UP', 'TILT_DOWN', 'ZOOM_IN', 'ZOOM_OUT', 'STOP'}
        action_clean = action.upper()

        if action_clean not in allowed_actions:
            raise ValueError(f"Invalid ONVIF PTZ command: {action}. Must be one of {allowed_actions}")

        ptz_vectors = {
            'PAN_LEFT': {"pan": -velocity, "tilt": 0.0, "zoom": 0.0},
            'PAN_RIGHT': {"pan": velocity, "tilt": 0.0, "zoom": 0.0},
            'TILT_UP': {"pan": 0.0, "tilt": velocity, "zoom": 0.0},
            'TILT_DOWN': {"pan": 0.0, "tilt": -velocity, "zoom": 0.0},
            'ZOOM_IN': {"pan": 0.0, "tilt": 0.0, "zoom": velocity},
            'ZOOM_OUT': {"pan": 0.0, "tilt": 0.0, "zoom": -velocity},
            'STOP': {"pan": 0.0, "tilt": 0.0, "zoom": 0.0}
        }

        # Simulated ONVIF SOAP Envelope execution
        return {
            "status": "SUCCESS",
            "camera_id": camera_id,
            "action": action_clean,
            "vector": ptz_vectors[action_clean],
            "execution_protocol": "ONVIF_SOAP_PTZ_SERVICE_v2",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

    def recall_preset(self, camera_id: str, preset_name: str) -> dict:
        """Positions camera to predefined preset (e.g. 'Dormitory_Beds', 'Kitchen_Stove', 'Main_Gate')."""
        return {
            "status": "SUCCESS",
            "camera_id": camera_id,
            "preset_recalled": preset_name,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }


onvif_ptz_service = ONVIFPTZService()
