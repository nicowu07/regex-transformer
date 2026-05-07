from django.contrib import admin
from django.urls import path
from api.views import status

urlpatterns = [
    path('api/health/', status),
]
