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

CRITICAL REQUIREMENTS:
- Generate EXACTLY 10 weeks of Budget & Resource Plan
- Each week must have 3 tasks
- Each task must include:
  - Task description
  - Roles (Developer, Designer, Tester, etc.)
  - Estimated hours
  - Approximate cost in USD

Format strictly like this - DO NOT SKIP ANY WEEKS:

Budget & Resource Plan:
Week 1:
- Task: [task description]
- Roles: [roles]
- Hours: [hours]
- Cost: [cost]
- Task: [task description]
- Roles: [roles]
- Hours: [hours]
- Cost: [cost]
- Task: [task description]
- Roles: [roles]
- Hours: [hours]
- Cost: [cost]

Week 2:
- Task: [task description]
- Roles: [roles]
- Hours: [hours]
- Cost: [cost]
- Task: [task description]
- Roles: [roles]
- Hours: [hours]
- Cost: [cost]
- Task: [task description]
- Roles: [roles]
- Hours: [hours]
- Cost: [cost]

Week 3:
[continue with 3 tasks...]

Week 4:
[continue with 3 tasks...]

Week 5:
[continue with 3 tasks...]

Week 6:
[continue with 3 tasks...]

Week 7:
[continue with 3 tasks...]

Week 8:
[continue with 3 tasks...]

Week 9:
[continue with 3 tasks...]

Week 10:
[continue with 3 tasks...]

Final Conclusion:
[Provide a professional, multi-paragraph conclusion summarizing the project outcomes, feasibility, and deliverables. Use clear line breaks between paragraphs.]
"""

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=4000,  # Increased from 1500 to 4000
        )

        result = response.choices[0].message.content.strip()
        return {"budget_plan": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
