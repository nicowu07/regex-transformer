from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
import pandas as pd
from api.services.llm import generate_regex
from api.services.regex_validation import validate_regex

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
        columns = df.columns.tolist()
        first_rows = df.head(3).to_dict(orient='records')
        return Response({
            "filename": file.name,
            "rows": rows,
            "columns": columns,
            "preview": first_rows
        })
    else:
        return Response({"error": "No file provided"}, status=400)

@api_view(["POST"])
def generate_regex_view(request):
    user_prompt = request.data.get("prompt", "").strip()
    if not user_prompt:
        return Response({"error": "Prompt is required"}, status=500)
    else:
        try:
            regex = generate_regex(user_prompt)
        except Exception as e:
            return Response({"error": f"Upstream service failed with error: {str(e)}"}, status=502)
        if not validate_regex(regex):
            return Response({"error": "Regex invalid"}, status=400)
        return Response({"regex": regex})
