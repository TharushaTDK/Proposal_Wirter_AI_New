from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="History Agent")

# --- CORS setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

history = []


class HistoryEntry(BaseModel):
    draft: str
    compliance: list


@app.post("/history")
def save_history(entry: HistoryEntry):
    record = {"timestamp": datetime.now().isoformat(),
              "draft": entry.draft, "compliance": entry.compliance}
    history.append(record)
    return {"status": "saved", "entry": record}


@app.get("/history")
def get_history():
    return {"count": len(history), "history": history}
