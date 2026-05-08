from django.contrib import admin
from django.urls import path
from api.views import status,upload_file

urlpatterns = [
    path('api/health/', status),
    path('api/upload/', upload_file)
]
