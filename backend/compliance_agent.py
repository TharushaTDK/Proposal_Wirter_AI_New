from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
import os

app = FastAPI(title="Compliance Agent")

# --- CORS setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load corpus.json at startup ---
CORPUS_PATH = "corpus.json"

if os.path.exists(CORPUS_PATH):
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        corpus = json.load(f)
else:
    corpus = []


class ComplianceRequest(BaseModel):
    draft: str


@app.post("/compliance")
def compliance_check(req: ComplianceRequest):
    draft = req.draft.strip()
    if not draft:
        raise HTTPException(status_code=400, detail="Empty draft")

    compliance = []

    # --- Existing simple checks ---
    if "password" in draft.lower():
        compliance.append({"rule": "Security", "status": "warning",
                           "message": "Ensure strong password policies."})
    if len(draft.split()) < 10:
        compliance.append({"rule": "Clarity", "status": "fail",
                           "message": "Draft too short."})

    # --- New: Check against corpus.json dynamically ---
    for doc in corpus:
        text_lower = doc["text"].lower()
        title_lower = doc["title"].lower()
        if "password" in text_lower and "password" in draft.lower():
            compliance.append({
                "rule": "Policy Check",
                "status": "info",
                "message": f"Draft mentions password. Refer to policy: {doc['title']} ({doc['id']})."
            })
        if "sdlc" in title_lower and "phase" in draft.lower():
            compliance.append({
                "rule": "Policy Check",
                "status": "info",
                "message": f"Draft references SDLC phases. Refer to: {doc['title']} ({doc['id']})."
            })
        if "cloud" in title_lower and "deployment" in draft.lower():
            compliance.append({
                "rule": "Policy Check",
                "status": "info",
                "message": f"Draft mentions deployment. Refer to: {doc['title']} ({doc['id']})."
            })

    # --- Default pass if no issues ---
    if not compliance:
        compliance.append({"rule": "General", "status": "pass",
                           "message": "No compliance issues found."})

    # --- Save to history (existing code) ---
    try:
        requests.post("http://127.0.0.1:8004/history",
                      json={"draft": draft, "compliance": compliance})
    except:
        pass

    return {"compliance": compliance}
