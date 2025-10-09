from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import re
import requests
import asyncio
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import openai

# --- Load environment ---
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY in .env")
openai.api_key = OPENAI_API_KEY

# --- App ---
app = FastAPI(title="Requirement Analyzer + Draft Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = "data/requirement_corpus.json"
corpus, vectorizer, doc_vectors = [], None, None

# --- Load corpus ---


def load_corpus():
    global corpus, vectorizer, doc_vectors
    if os.path.exists(DATA_PATH):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            corpus = json.load(f)
        texts = [d["text"] for d in corpus] if corpus else []
        if texts:
            vectorizer = TfidfVectorizer(
                stop_words="english", ngram_range=(1, 2), max_features=5000)
            doc_vectors = vectorizer.fit_transform(texts)
        else:
            vectorizer, doc_vectors = None, None


load_corpus()

# --- Simple search ---


def simple_search(query, top_k=5):
    if not vectorizer or doc_vectors is None:
        return []
    qv = vectorizer.transform([query])
    sims = cosine_similarity(qv, doc_vectors)[0]
    idxs = sims.argsort()[::-1][:top_k]
    results = []
    for i in idxs:
        results.append({
            "id": corpus[i]["id"],
            "title": corpus[i]["title"],
            "snippet": corpus[i]["text"][:500],
            "score": float(sims[i])
        })
    return results

# --- Request schema ---


class AnalyzeRequest(BaseModel):
    requirements: str
    num_proposals: int = 1

# --- Async Draft Generator Call ---


async def call_draft_agent(title, summary, key_points):
    draft_url = "http://127.0.0.1:8001/draft"
    try:
        import httpx
        async with httpx.AsyncClient(timeout=600) as client:
            resp = await client.post(draft_url, json={
                "title": title,
                "summary": summary,
                "key_points": key_points
            })
            return resp.json()
    except Exception as e:
        return {
            "sections": [],
            "full_draft": "",
            "feedback": f"Draft Agent unavailable: {e}"
        }

# --- Analyze Endpoint ---


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    requirements = req.requirements.strip()
    if not requirements:
        raise HTTPException(status_code=400, detail="requirements required")

    # --- Search for evidence ---
    hits = simple_search(requirements)
    evidence_text = "\n\n".join(
        [f"[{h['id']}] {h['title']}: {h['snippet']}" for h in hits])

    proposals = []

    for _ in range(req.num_proposals):
        # --- Generate key points using GPT ---
        prompt = (
            f"You are a professional proposal analyzer.\n"
            f"Using these requirements:\n'{requirements}'\n"
            f"Evidence snippets:\n{evidence_text}\n"
            "Generate a JSON object with fields: "
            "title, summary, key_points (10-12 items). "
            "Do NOT include sections. Return ONLY JSON."
        )
        try:
            resp = openai.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500
            )
            raw_text = resp.choices[0].message.content.strip()
            raw_text = re.sub(r"```(json)?", "", raw_text, flags=re.IGNORECASE)
            raw_text = raw_text.replace('“', '"').replace('”', '"').strip()
            proposal = json.loads(raw_text)
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"GPT parse error: {e}")

        # --- Call Draft Generator Agent asynchronously ---
        draft_response = await call_draft_agent(
            proposal.get("title", "Untitled Proposal"),
            proposal.get("summary", ""),
            proposal.get("key_points", [])
        )
        proposal["sections"] = draft_response.get("sections", [])
        proposal["full_draft"] = draft_response.get("full_draft", "")
        proposal["feedback"] = draft_response.get("feedback", "")

        proposals.append(proposal)

    return {"proposals": proposals}
