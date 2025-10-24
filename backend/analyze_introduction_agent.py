from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import openai
from dotenv import load_dotenv
import re
from collections import defaultdict

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    print("❌ ERROR: OPENAI_API_KEY not found in .env file")
    print("💡 Please create a .env file with: OPENAI_API_KEY=your-actual-api-key")
    # Don't raise error yet, allow server to start for testing
else:
    print(f"✅ OpenAI API Key found (starts with): {OPENAI_API_KEY[:20]}...")

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
        self.request_times = defaultdict(list)

    def check_basic_safety(self, text: str) -> bool:
        if len(text) > 20000:
            return False
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
        sanitized = text.replace('<', ' ').replace('>', ' ')
        sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)
        return sanitized.strip()


security = SecurityManager()


@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "service": "analyze-agent",
        "openai_configured": bool(OPENAI_API_KEY)
    }


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    requirements = req.requirements.strip()
    if not requirements:
        raise HTTPException(
            status_code=400, detail="Requirements cannot be empty.")

    if not security.check_basic_safety(requirements):
        raise HTTPException(status_code=400, detail="Invalid input provided.")

    safe_requirements = security.sanitize_input(requirements)

    # Check if OpenAI API key is available
    if not OPENAI_API_KEY:
        # Return mock response for testing
        mock_proposal = {
            "title": f"Project: {requirements[:30]}...",
            "point_of_view": [
                "• Client requires a comprehensive solution",
                "• System should be user-friendly and scalable",
                "• Integration with existing systems is important",
                "• Security and performance are key considerations",
                "• Mobile and desktop compatibility required",
                "• Real-time data processing capabilities",
                "• Cloud-based infrastructure preferred",
                "• Automated reporting and analytics",
                "• Multi-user collaboration features",
                "• Regular maintenance and support"
            ],
            "introduction": f"This proposal addresses your requirements for: {requirements[:100]}...\n\nOur solution is designed to provide a comprehensive approach that meets all your business needs. We leverage cutting-edge technology and industry best practices to deliver a robust, scalable, and user-friendly system.\n\nThe implementation will follow agile methodology with regular feedback cycles to ensure the final product exceeds your expectations. Our team of experts will work closely with you throughout the development process."
        }
        return {"proposals": [mock_proposal]}

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
        # Initialize OpenAI client with the new SDK style
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1200
        )

        raw_text = response.choices[0].message.content.strip()
        raw_text_clean = raw_text.replace(
            "```json", "").replace("```", "").strip()
        proposal = json.loads(raw_text_clean)

    except json.JSONDecodeError as e:
        error_detail = f"GPT returned invalid JSON: {e}"
        if 'raw_text' in locals():
            error_detail += f"\nRaw response: {raw_text[:500]}..."
        raise HTTPException(status_code=500, detail=error_detail)

    except openai.AuthenticationError as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid OpenAI API key. Please check your API key in the .env file."
        )

    except openai.RateLimitError as e:
        raise HTTPException(
            status_code=429,
            detail="OpenAI API rate limit exceeded. Please try again later."
        )

    except openai.APIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(e)}"
        )

    except Exception as e:
        error_detail = f"Unexpected error: {str(e)}"
        if 'raw_text' in locals():
            error_detail += f"\nRaw response: {raw_text[:500]}..."
        raise HTTPException(status_code=500, detail=error_detail)

    return {"proposals": [proposal]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
