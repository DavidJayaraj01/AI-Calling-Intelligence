"""
Minimal Pain Point Service for testing without loading heavy models
"""
import asyncio
from typing import List, Dict, Any
from loguru import logger

class MinimalPainPointExtractor:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.embedding_model = None
        logger.info("Minimal Pain Point Extractor initialized (models not loaded)")

    async def extract_pain_points(self, transcript: str, call_id: str) -> List[Dict[str, Any]]:
        """Mock pain point extraction for testing"""
        # Simple keyword-based pain point detection
        pain_keywords = ['problem', 'issue', 'bug', 'error', 'trouble', 'concern', 'frustrated']
        
        sentences = transcript.split('.')
        pain_points = []
        
        for i, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if any(keyword in sentence.lower() for keyword in pain_keywords):
                pain_point = {
                    "description": sentence,
                    "category": "technical",
                    "severity": "medium",
                    "confidence": 0.8,
                    "vector_embedding": [0.1] * 384,  # Mock embedding
                    "start_time": i * 10,
                    "end_time": (i + 1) * 10,
                    "call_id": call_id
                }
                pain_points.append(pain_point)
        
        logger.info(f"Mock extracted {len(pain_points)} pain points from call {call_id}")
        return pain_points

    async def get_pain_point_embedding(self, text: str) -> List[float]:
        """Mock embedding generation"""
        return [0.1] * 384

# Global instance
pain_point_extractor = MinimalPainPointExtractor()
