import os
from groq import Groq
import json
import pandas as pd

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_regex(user_prompt: str, columns: list) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful regex generator.  \
                You will be given a user prompt describing a pattern to match and a list of column names. \
                1. You will respond with a regex that matches that pattern\
                2. Provide a list of columns from the available set that the user most likely wants this pattern applied to.\
                3. The replacement string that user wants to use, if mentioned in the prompt. If no replacement is mentioned, return an empty string as the replacement.\
                Only provide the regex, a list of matched columns, and the replacement string in your response in json format, without any additional explanation or text.\
                response_format={'pattern': '<regex>', 'columns': ['<column1>', '<column2>', ...], 'replacement': '<replacement>'}"
            },
            {
                "role": "user",
                "content": f"""Description: {user_prompt}
                Available columns: {columns or []}"""
            }
        ],
        temperature=0.0
    )
    result = json.loads(response.choices[0].message.content)
    if "pattern" not in result or "columns" not in result or "replacement" not in result:
        raise ValueError("Invalid response format from LLM")
    elif not isinstance(result["pattern"], str) or not isinstance(result["columns"], list) or not isinstance(result["replacement"], str):
        raise ValueError("Invalid types in response from LLM")
    result["columns"] = [col for col in result["columns"] if col in columns]

    return result["pattern"], result["columns"], result["replacement"]

def generate_filter(user_prompt: str, df: pd.DataFrame) -> str:
    columns_description = "\n".join(f"- {col} ({dtype})" for col, dtype in df.dtypes.items())
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a data-filtering assistant. \
                Given a natural language description of which rows to keep, and a list of available columns with their data types, output a pandas-compatible query expression.\
                Respond with a JSON object of exactly this shape:{\"query\": \"<pandas query expression>\"}\
                Rules for the query expression: \
                - Use pandas DataFrame.query() syntax — column names referenced directly, operators ==, !=, <, <=, >, >=, and, or, not.\
                - For string operations, use .str.startswith(), .str.endswith(), .str.contains(), .str.lower(), etc.\
                - For null checks, use .isna() or .notna().\
                - Only reference columns that appear in the available columns list. Use them with their exact case and spelling.\
                - Wrap string literals in single or double quotes.\
                - Do not call arbitrary Python functions — only pandas string accessors and built-in operators.\
                - If the description is ambiguous or cannot be expressed as a filter, return an empty query string and explain why in the explanation field."
            },
            {
                "role": "user",
                "content": f"""Description: {user_prompt}
                Available columns: {columns_description}"""
            }
        ],
        temperature=0.0
    )
    result = json.loads(response.choices[0].message.content)
    if "query" not in result:
        raise ValueError("Invalid response format from LLM")
    elif not isinstance(result["query"], str):
        raise ValueError("Invalid types in response from LLM")
    return result