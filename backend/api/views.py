from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
import pandas as pd

@api_view(['GET'])
def status(request):
    return Response({"status": "OK"})

@api_view(['POST'])
def upload_file(request):
    file = request.FILES.get('file')
    if file:
        ext = file.name.split('.')[-1]  # Get the file extension
        if ext.lower() in ['xlsx', 'xls']:
            try:
                df = pd.read_excel(file)
            except Exception as e:
                return Response({"error": f"Error reading Excel file: {str(e)}"}, status=400)
        elif ext.lower() == 'csv':
            try:
                df = pd.read_csv(file)
            except Exception as e:
                return Response({"error": f"Error reading CSV file: {str(e)}"}, status=400)
        else:
            return Response({"error": "Wrong file format, please upload a CSV or Excel file."})
        
        rows = df.shape[0]
        columes = df.columns.tolist()
        first_rows = df.head(3).to_dict(orient='records')
        return Response({
            "filename": file.name,
            "rows": rows,
            "columns": columes,
            "preview": first_rows
        })
    else:
        return Response({"error": "No file provided"}, status=400)