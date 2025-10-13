from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="History Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory history storage
history = []


class HistoryEntry(BaseModel):
    title: str
    requirements: str
    proposal: dict = None
    explanations: list = None
    guidance: str = None
    budget_plan: str = None

# Save a new history entry


@app.post("/history")
def save_history(entry: HistoryEntry):
    record = {
        "id": len(history) + 1,
        "timestamp": datetime.now().isoformat(),
        "title": entry.title,
        "requirements": entry.requirements,
        "proposal": entry.proposal,
        "explanations": entry.explanations,
        "guidance": entry.guidance,
        "budget_plan": entry.budget_plan
    }
    history.append(record)
    return {"status": "saved", "entry": record}

# Get all history entries


@app.get("/history")
def get_history():
    return {"count": len(history), "history": history}

# Optional: get a single history entry by ID


@app.get("/history/{entry_id}")
def get_history_entry(entry_id: int):
    entry = next((h for h in history if h["id"] == entry_id), None)
    if not entry:
        return {"error": "Entry not found"}
    return entry
