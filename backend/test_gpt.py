import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

print("พบ API Key:", bool(api_key))

if not api_key:
    raise ValueError("ไม่พบ OPENAI_API_KEY ในไฟล์ .env")

client = OpenAI(api_key=api_key)

response = client.responses.create(
    model="gpt-6-luna",
    input="สวัสดี ตอบกลับเป็นภาษาไทยสั้น ๆ"
)

print(response.output_text)