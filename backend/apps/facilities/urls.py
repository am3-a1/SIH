from django.urls import path
from . import views

urlpatterns = [
    path('', views.facility_list_view, name='facility_list'),
    path('<str:facility_id>/', views.facility_detail_view, name='facility_detail'),
    path('<str:facility_id>/verify-geofence', views.verify_geofence_view, name='verify_geofence'),
]
