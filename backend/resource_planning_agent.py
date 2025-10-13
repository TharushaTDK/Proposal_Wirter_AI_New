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

app = FastAPI(title="Budget & Resource Planning Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- Data Model --------


class BudgetRequest(BaseModel):
    title: str
    table_of_contents: list[str]
    explanations: list[str] = []  # Optional: point explanations
    timeline: str = ""  # Optional: output from guidance_agent

# -------- Endpoint --------


@app.post("/generate_budget")
async def generate_budget(req: BudgetRequest):
    if not req.table_of_contents:
        raise HTTPException(
            status_code=422, detail="Table of contents cannot be empty")

    prompt = f"""
You are a professional project manager and financial planner.

Project Title: {req.title}
Sections: {', '.join(req.table_of_contents)}
Timeline: {req.timeline}

Tasks:
- Generate a **Budget & Resource Plan** for **at least 10 weeks**, with **3 or more tasks per week**.
- For each task, provide:
    - Task description
    - Roles (Developer, Designer, Tester, etc.)
    - Estimated hours
    - Approximate cost in USD
- Ensure tasks are realistic, distributed across weeks, and cover all project sections.

Final Conclusion:
- Provide a **professional, multi-paragraph conclusion** summarizing the project outcomes, feasibility, and deliverables.
- Use clear line breaks for paragraphs.

Format strictly like this:

Budget & Resource Plan:
Week 1:
- Task: ...
- Roles: ...
- Hours: ...
- Cost: ...

Week 2:
- Task: ...
- Roles: ...
- Hours: ...
- Cost: ...

...(continue up to at least Week 10)...

Final Conclusion:
Paragraph 1: ...
Paragraph 2: ...
Paragraph 3: ...
"""

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=1500,
        )

        result = response.choices[0].message.content.strip()
        return {"budget_plan": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
