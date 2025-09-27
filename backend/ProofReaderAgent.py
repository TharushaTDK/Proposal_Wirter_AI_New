from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import language_tool_python
import re

# Initialize FastAPI app
app = FastAPI(title="Proofreader Agent")

# --- CORS setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow requests from any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LanguageTool for grammar/spelling checks
tool = language_tool_python.LanguageTool('en-US')


# Define request model
class ProofRequest(BaseModel):
    draft: str


@app.post("/proofread")
def proofread(req: ProofRequest):
    """
    Proofreads a draft using formatting checks and basic NLP techniques:
    - Removes extra spaces
    - Ensures draft ends with a period
    - Checks draft length
    - Grammar and spelling check using LanguageTool
    - Detects very long or very short sentences
    - Detects frequently repeated words
    """

    draft = req.draft.strip()
    if not draft:
        raise HTTPException(status_code=400, detail="Empty draft")

    suggestions = []

    # --- Basic formatting checks ---
    if "  " in draft:
        suggestions.append("Remove extra spaces.")
    if not draft.endswith("."):
        suggestions.append("Ensure draft ends with a period.")
    if len(draft.split()) < 300:  # warning if draft too short
        suggestions.append(
            "Draft seems too short; consider adding more details.")

    # --- NLP: Grammar/Spelling check ---
    matches = tool.check(draft)
    if matches:
        # Limit feedback to first 5 suggestions for brevity
        for m in matches[:5]:
            suggestions.append(f"Grammar/Spelling: {m.message}")

    # --- NLP: Sentence length checks ---
    sentences = re.split(r'[.!?]', draft)  # split draft into sentences

    # Detect very long sentences (>40 words)
    long_sentences = [s for s in sentences if len(s.split()) > 40]
    if long_sentences:
        suggestions.append(
            f"{len(long_sentences)} sentences are very long; consider breaking them up.")

    # Detect very short sentences (<5 words)
    short_sentences = [s for s in sentences if len(
        s.split()) < 5 and len(s.strip()) > 0]
    if short_sentences:
        suggestions.append(
            f"{len(short_sentences)} sentences are very short; consider expanding them.")

    # --- NLP: Repetition detection ---
    words = draft.lower().split()
    word_freq = {}
    for w in words:
        word_freq[w] = word_freq.get(w, 0) + 1
    repeated_words = [w for w, count in word_freq.items() if count > 10]
    if repeated_words:
        suggestions.append(
            f"Repeated words detected: {', '.join(repeated_words[:5])}...")

    # Construct result
    result = {
        "draft": draft,
        "feedback": suggestions if suggestions else ["No issues found."]
    }

    # --- Optional: send draft to Compliance Agent ---
    try:
        requests.post("http://127.0.0.1:8003/compliance",
                      json={"draft": draft}, timeout=5)
    except:
        pass  # Ignore if compliance agent is down

    # Convert feedback to string for frontend
    if isinstance(result["feedback"], list):
        result["feedback"] = "\n".join(result["feedback"])

    return result