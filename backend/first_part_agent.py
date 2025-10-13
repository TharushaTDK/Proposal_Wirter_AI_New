from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY in .env")
openai.api_key = OPENAI_API_KEY

app = FastAPI(title="First Part Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PointExplainRequest(BaseModel):
    title: str
    introduction: str
    point: str  # single point from frontend


@app.post("/explain_point")
async def explain_point(req: PointExplainRequest):
    if not req.point.strip():
        raise HTTPException(status_code=422, detail="Point is empty")

    # Step 1: Instructions text
    instructions = (
        "You are a professional proposal writer. "
        "Explain the given point in exactly **two separate paragraphs**. "
        "Paragraph 1 should describe the main idea and approach. "
        "Paragraph 2 should describe implementation details and benefits. "
        "Separate the paragraphs with a blank line."
    )

    # Step 2: Generate explanation
    prompt = f"""
Title: {req.title}
Introduction: {req.introduction}

Point: {req.point}

Explain this point according to the instructions above. Return only the explanation text in two paragraphs.
"""

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",  # or gpt-4-mini for faster generation
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500,  # one paragraph
        )
        explanation = response.choices[0].message.content.strip()

        return {
            "instructions": instructions,
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
