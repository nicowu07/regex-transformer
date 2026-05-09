from django.contrib import admin
from django.urls import path
from api.views import status, upload_file_view, generate_regex_view, apply_regex_view, download_file_view

urlpatterns = [
    path('api/health/', status),
    path('api/upload/', upload_file_view),
    path('api/generate-regex/', generate_regex_view),
    path('api/apply-regex/', apply_regex_view),
    path('api/download/<str:file_id>/', download_file_view),
]
