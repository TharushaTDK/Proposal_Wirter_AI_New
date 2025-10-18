from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import openai
from dotenv import load_dotenv
import re
from typing import Dict
from collections import Counter

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY in .env")
openai.api_key = OPENAI_API_KEY

app = FastAPI(title="First Part Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PointExplainRequest(BaseModel):
    title: str
    introduction: str
    point: str  # single point from frontend


class ExplanationIRAnalyzer:
    def _init_(self):
        # Common technical terms for analysis
        self.technical_terms = {
            'development': ['api', 'database', 'framework', 'integration', 'deployment', 'backend', 'frontend'],
            'design': ['ui', 'ux', 'interface', 'wireframe', 'prototype', 'user experience'],
            'business': ['roi', 'kpi', 'metrics', 'conversion', 'retention', 'revenue', 'cost'],
            'security': ['authentication', 'encryption', 'security', 'privacy', 'firewall']
        }

        # Simple stop words list
        self.stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can'
        }

    def analyze_explanation(self, explanation: str, original_point: str) -> Dict:
        """IR: Analyze explanation without changing output structure"""
        # Simple tokenization
        words = self._simple_tokenize(explanation.lower())
        original_words = self._simple_tokenize(original_point.lower())

        # Remove stop words
        filtered_words = [
            word for word in words if word not in self.stop_words]
        filtered_original = [
            word for word in original_words if word not in self.stop_words]

        # Calculate metrics
        common_words = set(filtered_words).intersection(set(filtered_original))

        # Count paragraphs
        paragraphs = [p.strip()
                      for p in explanation.split('\n\n') if p.strip()]

        return {
            "word_count": len(filtered_words),
            "paragraph_count": len(paragraphs),
            "relevance_score": len(common_words) / len(set(filtered_original)) if filtered_original else 0,#on-topic overlap with the original point
            "technical_terms": self._count_technical_terms(explanation),
            "explanation_quality": self._calculate_quality_metrics(explanation, original_point),
            "structure_analysis": {
                "has_multiple_paragraphs": len(paragraphs) >= 2,
                "avg_paragraph_length": sum(len(p.split()) for p in paragraphs) / len(paragraphs) if paragraphs else 0
            }
        }

    def _simple_tokenize(self, text: str) -> list:
        """Simple tokenization without external libraries"""
        # Remove punctuation and split
        text = re.sub(r'[^\w\s]', ' ', text)
        return [word for word in text.split() if word.strip()]

    def _count_technical_terms(self, text: str) -> Dict:
        """IR: Count technical terms by category"""
        text_lower = text.lower()
        words = self._simple_tokenize(text_lower)
        word_freq = Counter(words)

        counts = {}
        for category, terms in self.technical_terms.items():
            category_count = sum(word_freq[term]
                                 for term in terms if term in word_freq)
            counts[category] = category_count
        return counts

    def _calculate_quality_metrics(self, explanation: str, original_point: str) -> Dict:
        """IR: Calculate quality metrics for the explanation"""
        explanation_words = self._simple_tokenize(explanation)
        original_words = self._simple_tokenize(original_point)

        # Check if explanation covers key terms from original point
        original_key_terms = [word for word in original_words if len(
            word) > 3 and word not in self.stop_words]
        covered_terms = sum(
            1 for term in original_key_terms if term in explanation.lower())

        return {
            "key_terms_coverage": covered_terms / len(original_key_terms) if original_key_terms else 0,#how many key terms from the point appear in the explanation
            "explanation_to_point_ratio": len(explanation_words) / len(original_words) if original_words else 0,#length ratio
            "unique_concepts": len(set(explanation_words)) / len(explanation_words) if explanation_words else 0#type/token ratio
        }


@app.post("/explain_point")
async def explain_point(req: PointExplainRequest):
    if not req.point.strip():
        raise HTTPException(status_code=422, detail="Point is empty")

    # Step 1: Instructions text
    instructions = (
        "You are a professional proposal writer. "
        "Explain the given point in exactly *two separate paragraphs*. "
        "Paragraph 1 should describe the main idea and approach. "
        "Paragraph 2 should describe implementation details and benefits. "
        "Separate the paragraphs with a blank line."
    )

    # Step 2: Generate explanation
    prompt = f"""
Title: {req.title}
Introduction: {req.introduction}

Point: {req.point}

Explain this point according to the instructions above. Return only the explanation text in two paragraphs.
"""

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",  # or gpt-4-mini for faster generation
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500,  # one paragraph
        )
        explanation = response.choices[0].message.content.strip()

        # IR: Analyze the explanation (added functionality)
        ir_analyzer = ExplanationIRAnalyzer()
        ir_analysis = ir_analyzer.analyze_explanation(explanation, req.point)

        return {
            "instructions": instructions,
            "explanation": explanation,
            # IR data added as extra field - doesn't affect frontend
            "ir_analysis": ir_analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))