from django.urls import path
from . import views

urlpatterns = [
    path('', views.inspection_list_view, name='inspection_list'),
    path('latest', views.latest_inspection_view, name='latest_inspection'),
    path('submit', views.submit_inspection_view, name='submit_inspection'),
]
