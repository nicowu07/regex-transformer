import os
from groq import Groq
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_regex(user_prompt: str, columns: list) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful regex generator.  \
                You will be given a user prompt describing a pattern to match and a list of column names. You will respond with a regex that matches that pattern\
                and a list of columns from the available set that the user most likely wants this pattern applied to.\
                Only provide the regex and a list of matched columns in your response in json format, without any additional explanation or text.\
                response_format={'pattern': '<regex>', 'columns': ['<column1>', '<column2>', ...]}"
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
    if "pattern" not in result or "columns" not in result:
        raise ValueError("Invalid response format from LLM")
    elif not isinstance(result["pattern"], str) or not isinstance(result["columns"], list):
        raise ValueError("Invalid types in response from LLM")
    result["columns"] = [col for col in result["columns"] if col in columns]

    return result["pattern"], result["columns"]