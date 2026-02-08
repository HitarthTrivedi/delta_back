from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize client
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# Try to generate content
model_names = ['gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-1.5-flash', 'models/gemini-2.0-flash-exp']
for model_name in model_names:
    try:
        print(f"Trying {model_name}...")
        response = client.models.generate_content(
            model=model_name,
            contents='Say hello!'
        )
        print(f"Success with {model_name}!")
        print(response.text)
        break
    except Exception as e:
        print(f"Failed with {model_name}: {e}")
