from django.urls import path
from . import views

urlpatterns = [
    path('headcount-scan', views.headcount_scan_view, name='ai_headcount_scan'),
    path('privacy-mask', views.privacy_mask_view, name='ai_privacy_mask'),
    path('anomaly-check', views.anomaly_check_view, name='ai_anomaly_check'),
    path('dispatch-random', views.dispatch_random_view, name='ai_dispatch_random'),
    path('national-stats', views.national_stats_view, name='ai_national_stats'),
]
