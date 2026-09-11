from django.urls import path
from . import views

urlpatterns = [
    path('initiate', views.initiate_vc_view, name='initiate_vc'),
    path('snapshot', views.capture_snapshot_view, name='vc_snapshot'),
    path('complete', views.complete_vc_view, name='complete_vc'),
]
