from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import openai
import requests
import json

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

app = FastAPI(title="Draft Generator Agent")


class DraftRequest(BaseModel):
    title: str
    summary: str
    key_points: list


@app.post("/draft")
def draft(req: DraftRequest):
    """
    Generate a very long, detailed multi-paragraph proposal draft,
    ensuring each key point is expanded into multiple paragraphs.
    """

    full_draft = ""

    # Step 1: Write the introduction
    intro_prompt = (
        f"You are a professional proposal writer.\n"
        f"Write a VERY DETAILED introduction paragraph for a proposal.\n"
        f"Title: {req.title}\nSummary: {req.summary}\n\n"
        f"Introduction should be 4-6 long paragraphs explaining context, purpose, and importance.\n"
        f"Return ONLY text (no JSON)."
    )
    try:
        intro_resp = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": intro_prompt}],
            temperature=0.7,
            max_tokens=2000,
        )
        full_draft += intro_resp.choices[0].message.content.strip() + "\n\n"
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Introduction generation failed: {e}")

    # Step 2: Write detailed sections for each key point
    for idx, kp in enumerate(req.key_points):
        point_prompt = (
            f"Write a VERY DETAILED section for the key point {idx+1}: {kp}\n"
            f"Expand this into multiple paragraphs (3-5 paragraphs) with examples, benefits, challenges, and implementation details.\n"
            f"Return ONLY text (no JSON)."
        )
        try:
            point_resp = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": point_prompt}],
                temperature=0.7,
                max_tokens=2000,
            )
            full_draft += point_resp.choices[0].message.content.strip() + \
                "\n\n"
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Key point {idx+1} generation failed: {e}")

    # Step 3: Write conclusion
    conclusion_prompt = (
        f"Write a VERY DETAILED conclusion for a proposal titled '{req.title}'.\n"
        f"Summarize all key points and emphasize impact. Include 3-4 long paragraphs.\n"
        f"Return ONLY text."
    )
    try:
        concl_resp = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": conclusion_prompt}],
            temperature=0.7,
            max_tokens=2000
        )
        full_draft += concl_resp.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Conclusion generation failed: {e}")

    # Optional: Proofreader
    proof_url = "http://127.0.0.1:8002/proofread"
    feedback = ""
    try:
        r = requests.post(proof_url, json={"draft": full_draft}, timeout=30)
        feedback = r.json().get("feedback", "")
    except:
        feedback = "Proofreader unavailable."

    return {"full_draft": full_draft, "feedback": feedback}