"""
Master URL Configuration for SIH26095 DoSJE Backend
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.authentication_rbac.urls')),
    path('api/v1/facilities/', include('apps.facilities.urls')),
    path('api/v1/inspections/', include('apps.inspections.urls')),
    path('api/v1/cctv/', include('apps.cctv_onvif.urls')),
    path('api/v1/vc/', include('apps.video_conference.urls')),
    path('api/v1/ai/', include('apps.ai_services.urls')),
]
