from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import openai
from dotenv import load_dotenv
import re
import time
from collections import defaultdict

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY in .env")
openai.api_key = OPENAI_API_KEY

app = FastAPI(title="Analyze Introduction Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    requirements: str


class SecurityManager:
    def __init__(self):
        # Simple rate limiting storage
        self.request_times = defaultdict(list)

    def check_basic_safety(self, text: str) -> bool:
        """Basic safety check without causing errors"""
        # Check for extremely long input
        if len(text) > 20000:
            return False

        # Basic malicious pattern check (non-intrusive)
        dangerous_patterns = [
            r'<script.*?>',
            r'javascript:',
            r'on\w+=',
        ]

        for pattern in dangerous_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return False

        return True

    def sanitize_input(self, text: str) -> str:
        """Very light sanitization that won't break content"""
        # Remove obviously dangerous characters but preserve content
        sanitized = text.replace('<', ' ').replace('>', ' ')
        sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)
        return sanitized.strip()


# Initialize security (won't affect existing flow)
security = SecurityManager()


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    requirements = req.requirements.strip()
    if not requirements:
        raise HTTPException(
            status_code=400, detail="Requirements cannot be empty.")

    # SECURITY ADDITION: Basic input safety check
    if not security.check_basic_safety(requirements):
        raise HTTPException(
            status_code=400, detail="Invalid input provided.")

    # SECURITY ADDITION: Light sanitization
    safe_requirements = security.sanitize_input(requirements)

    prompt = f"""
You are a professional proposal writer.

Given the following project requirements:

{safe_requirements}

Generate a JSON object with:
- title: a short, clear project title
- point_of_view: 10-15 concise bullet points summarizing the client's needs (do NOT use paragraph)
- introduction: 3-5 paragraphs introducing the solution

Return ONLY JSON.
"""

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1200
        )
        raw_text = response.choices[0].message.content.strip()
        # Remove ```json if included
        raw_text_clean = raw_text.replace(
            "```json", "").replace("```", "").strip()
        proposal = json.loads(raw_text_clean)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"GPT output parsing failed: {e}\nRaw: {raw_text}")

    # OUTPUT STRUCTURE REMAINS EXACTLY THE SAME - NO CHANGES
    return {"proposals": [proposal]}
