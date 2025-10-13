from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY in .env")
openai.api_key = OPENAI_API_KEY

app = FastAPI(title="Guidance Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------- Data Model ------------


class GuidanceRequest(BaseModel):
    title: str
    table_of_contents: list[str]

# ----------- Endpoint --------------


@app.post("/generate_guidance")
async def generate_guidance(req: GuidanceRequest):
    if not req.table_of_contents:
        raise HTTPException(
            status_code=422, detail="Table of contents cannot be empty")

    prompt = f"""
You are an experienced project planner. The following is the title and key sections (table of contents) of a project proposal.

Title: {req.title}
Sections: {", ".join(req.table_of_contents)}

Based on this, create a **realistic 10+ week project timeline** showing weekly progress.

Each week must include **at least three detailed and realistic tasks** directly related to the project sections.
Be specific about what should happen each week (e.g., research, design, implementation, testing, feedback, etc.).

⚠️ The output must strictly follow this structure and formatting:

Week 1:
- Task 1
- Task 2
- Task 3

Week 2:
- Task 1
- Task 2
- Task 3

...
Week 10:
- Task 1
- Task 2
- Task 3

If the project logically extends beyond 10 weeks, continue until all major tasks are covered.
"""

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=1200,  # increased for longer output
        )

        guidance = response.choices[0].message.content.strip()
        return {"guidance": guidance}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
