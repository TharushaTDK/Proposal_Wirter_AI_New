from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
import openai

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY in .env")
openai.api_key = OPENAI_API_KEY

app = FastAPI(title="Draft Generator Agent (GPT-4)")

# --- Request schema ---


class DraftRequest(BaseModel):
    title: str
    summary: str
    key_points: list

# --- Draft endpoint ---


@app.post("/draft")
def draft(req: DraftRequest):
    sections = []

    # --- Generate sections for each key point ---
    for idx, kp in enumerate(req.key_points):
        try:
            prompt = (
                f"You are a professional proposal writer.\n"
                f"Write a VERY DETAILED section for the key point {idx+1}: {kp}\n"
                f"Expand into multiple paragraphs with examples, benefits, challenges, and implementation details.\n"
                f"Return ONLY text, long enough for a full report section."
            )
            resp = openai.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=8000
            )
            sections.append({
                "title": kp,
                "content": resp.choices[0].message.content.strip()
            })
        except Exception as e:
            sections.append({
                "title": kp,
                "content": f"Section generation failed: {e}"
            })

    # --- Combine full draft ---
    full_draft = "\n\n".join([s["content"] for s in sections])

    # --- Optional: call proofreader ---
    feedback = ""
    try:
        proof_url = "http://127.0.0.1:8002/proofread"
        r = requests.post(proof_url, json={"draft": full_draft}, timeout=180)
        feedback = r.json().get("feedback", "No feedback")
    except:
        feedback = "Proofreader unavailable."

    return {
        "sections": sections,
        "full_draft": full_draft,
        "feedback": feedback
    }
