from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI(title="Proofreader Agent")

# --- CORS setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProofRequest(BaseModel):
    draft: str


@app.post("/proofread")
def proofread(req: ProofRequest):
    draft = req.draft.strip()
    if not draft:
        raise HTTPException(status_code=400, detail="Empty draft")

    suggestions = []
    if "  " in draft:
        suggestions.append("Remove extra spaces.")
    if not draft.endswith("."):
        suggestions.append("Ensure draft ends with a period.")

    result = {"draft": draft,
              "suggestions": suggestions or ["No issues found."]}

    # Send to compliance agent
    try:
        requests.post("http://127.0.0.1:8003/compliance",
                      json={"draft": draft})
    except:
        pass

    return result