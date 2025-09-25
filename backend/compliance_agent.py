from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI(title="Compliance Agent")

# --- CORS setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ComplianceRequest(BaseModel):
    draft: str


@app.post("/compliance")
def compliance_check(req: ComplianceRequest):
    draft = req.draft.strip()
    if not draft:
        raise HTTPException(status_code=400, detail="Empty draft")

    compliance = []
    if "password" in draft.lower():
        compliance.append({"rule": "Security", "status": "warning",
                           "message": "Ensure strong password policies."})
    if len(draft.split()) < 10:
        compliance.append({"rule": "Clarity", "status": "fail",
                           "message": "Draft too short."})
    if not compliance:
        compliance.append({"rule": "General", "status": "pass",
                           "message": "No compliance issues found."})

    # Save to history
    try:
        requests.post("http://127.0.0.1:8004/history",
                      json={"draft": draft, "compliance": compliance})
    except:
        pass

    return {"compliance": compliance}
