from django.urls import path
from . import views

urlpatterns = [
    path('streams', views.stream_list_view, name='cctv_streams'),
    path('ptz/command', views.ptz_control_view, name='cctv_ptz_command'),
    path('snapshot/<str:camera_id>', views.capture_snapshot_view, name='cctv_snapshot'),
]
