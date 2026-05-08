import os
from groq import Groq
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_regex(user_prompt: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful regex generator.  \
                You will be given a user prompt describing a pattern to match, and you will respond with a regex that matches that pattern.\
                Only provide the regex in your response in json format, without any additional explanation or text.\
                response_format={'pattern': '<regex>'}"
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        temperature=0.0
    )
    return json.loads(response.choices[0].message.content)["pattern"]