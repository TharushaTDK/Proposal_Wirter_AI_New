from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import re
from dotenv import load_dotenv
import openai
import requests

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY in .env")
openai.api_key = OPENAI_API_KEY

app = FastAPI(title="Requirement Analyzer Agent")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = "data/requirement_corpus.json"
corpus, vectorizer, doc_vectors = [], None, None

# Load corpus


def load_corpus():
    global corpus, vectorizer, doc_vectors
    if os.path.exists(DATA_PATH):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            corpus = json.load(f)
        texts = [d["text"] for d in corpus] if corpus else []
        if texts:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            vectorizer = TfidfVectorizer(
                stop_words="english", ngram_range=(1, 2), max_features=5000)
            doc_vectors = vectorizer.fit_transform(texts)
        else:
            vectorizer, doc_vectors = None, None


load_corpus()


def simple_search(query, top_k=5):
    if not vectorizer or doc_vectors is None:
        return []
    qv = vectorizer.transform([query])
    from sklearn.metrics.pairwise import cosine_similarity
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


class AnalyzeRequest(BaseModel):
    requirements: str
    num_proposals: int = 1


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    requirements = req.requirements.strip()
    if not requirements:
        raise HTTPException(status_code=400, detail="requirements required")

    hits = simple_search(requirements)
    evidence_text = "\n\n".join(
        [f"[{h['id']}] {h['title']}: {h['snippet']}" for h in hits])

    prompt = (
        f"You are a proposal requirement analyzer. Given these requirements:\n'{requirements}'\n"
        f"Use the following evidence snippets:\n{evidence_text}\n"
        f"Produce {req.num_proposals} proposal drafts with fields: "
        "title, summary, key_points (3-5), full_draft. Return ONLY JSON array."
    )

    try:
        resp = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1500
        )
        text = resp.choices[0].message.content.strip()
        text = re.sub(r"```(json)?", "", text, flags=re.IGNORECASE).strip()
        text = text.replace('“', '"').replace('”', '"')
        start = text.find('[')
        end = text.rfind(']') + 1
        if start == -1 or end == -1:
            raise HTTPException(
                status_code=500, detail=f"Invalid GPT output: {text}")
        proposals = json.loads(text[start:end])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GPT parse error: {e}")

    # --- Call Draft Generator and get full_draft ---
    draft_url = "http://127.0.0.1:8001/draft"
    for proposal in proposals:
        try:
            r = requests.post(draft_url, json={
                "title": proposal["title"],
                "summary": proposal["summary"],
                "key_points": proposal["key_points"]
            }, timeout=30)
            if r.ok:
                draft_data = r.json()
                proposal["full_draft"] = draft_data.get(
                    "full_draft", "Draft not generated yet.")
                proposal["feedback"] = draft_data.get(
                    "feedback", "No feedback.")
            else:
                proposal["full_draft"] = "Draft generation failed."
                proposal["feedback"] = "No feedback."
        except Exception as e:
            proposal["full_draft"] = f"Draft generation failed: {e}"
            proposal["feedback"] = "No feedback."

    return {"proposals": proposals}
