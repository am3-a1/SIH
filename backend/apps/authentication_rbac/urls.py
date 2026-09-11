from django.urls import path
from . import views

urlpatterns = [
    path('login', views.login_view, name='oauth2_login'),
    path('profile', views.user_profile_view, name='user_profile'),
]
