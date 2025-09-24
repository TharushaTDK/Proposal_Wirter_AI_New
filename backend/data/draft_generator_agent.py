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
    prompt = (
        f"You are a professional proposal writer. Generate a detailed multi-paragraph draft "
        f"for the proposal. Use the following:\n"
        f"Title: {req.title}\nSummary: {req.summary}\nKey Points:\n"
        f"{json.dumps(req.key_points, indent=2)}\n\n"
        f"Instructions:\n"
        f"1. Write an introductory paragraph summarizing the proposal.\n"
        f"2. Write one paragraph for each key point explaining it in detail.\n"
        f"3. Write a concluding paragraph.\n"
        f"Return ONLY a JSON object with one field: 'full_draft'."
    )

    try:
        resp = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2500
        )
        draft_text = resp.choices[0].message.content.strip()
        # Ensure valid JSON
        draft_json = json.loads(draft_text)
        full_draft = draft_json.get("full_draft", "")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Draft generation failed: {e}")

    # Optional: send draft to Proofreader Agent
    proof_url = "http://127.0.0.1:8002/proofread"
    feedback = ""
    try:
        r = requests.post(proof_url, json={"draft": full_draft}, timeout=10)
        feedback = r.json().get("feedback", "")
    except:
        feedback = "Proofreader unavailable."

    return {"full_draft": full_draft, "feedback": feedback}
