from django.contrib import admin
from django.urls import path
from api.views import status, upload_file, generate_regex_view

urlpatterns = [
    path('api/health/', status),
    path('api/upload/', upload_file),
    path('api/generate-regex/', generate_regex_view)
]
