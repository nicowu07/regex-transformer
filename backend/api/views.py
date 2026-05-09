from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
import pandas as pd
from api.services.llm import generate_regex
from api.services.regex import validate_regex, regex_apply
from api.services.file_storage import save_dataframe, load_dataframe, valid_id
import io
from django.http import FileResponse, Http404

@api_view(['GET'])
def status(request):
    return Response({"status": "OK"})

@api_view(['POST'])
def upload_file_view(request):
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
        
        file_id = save_dataframe(df)
        rows = df.shape[0]
        columns = df.columns.tolist()
        first_rows = df.head(3).to_dict(orient='records')
        return Response({
            "filename": file.name,
            "file_id": file_id,
            "rows": rows,
            "columns": columns,
            "preview": first_rows
        })
    else:
        return Response({"error": "No file provided"}, status=400)

@api_view(["POST"])
def generate_regex_view(request):
    user_prompt = request.data.get("prompt", "").strip()
    columns = request.data.get("columns", [])
    if not user_prompt:
        return Response({"error": "Prompt is required"}, status=500)
    elif not columns or not isinstance(columns, list):
        return Response({"error": "Invalid columns format"}, status=500)
    else:
        try:
            regex, matched_columns = generate_regex(user_prompt, columns)
        except Exception as e:
            return Response({"error": f"Upstream service failed with error: {str(e)}"}, status=502)
        if not validate_regex(regex):
            return Response({"error": "Regex invalid"}, status=400)
        return Response({"regex": regex, "columns": matched_columns})

@api_view(["POST"])
def apply_regex_view(request):
    file_id = request.data.get("file_id")
    regex = request.data.get("regex")
    columns = request.data.get("columns", [])
    replacement = request.data.get("replacement", "")
    if not file_id or not regex or not columns:
        return Response({"error": "file_id, regex, and columns are required"}, status=400)
    elif not isinstance(columns, list):
        return Response({"error": "Invalid columns format"}, status=400)
    elif not validate_regex(regex):
        return Response({"error": "Regex invalid"}, status=400)
    elif replacement is None or not isinstance(replacement, str):
        return Response({"error": "Invalid replacement format"}, status=400)

    try:
        df = load_dataframe(file_id)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    
    result_df, counts = regex_apply(df, regex, columns, replacement)
    result_file_id = save_dataframe(result_df)
    return Response({"result_file_id": result_file_id, "counts": counts})

@api_view(["GET"])
def download_file_view(request, file_id):
    if not valid_id(file_id):
        return Response({"error": "Invalid file ID"}, status=400)
    try:
        df = load_dataframe(file_id)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    response = FileResponse(buffer, as_attachment=True, filename=f"transformed.csv")
    return response