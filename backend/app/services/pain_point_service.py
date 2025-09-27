"""
Pain Point Extraction Service using OpenAI API
"""
from openai import AsyncOpenAI
from loguru import logger
from app.core.config import settings
import json
from typing import List, Dict, Any

class PainPointExtractor:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        logger.info("Pain point extraction service initialized with OpenAI API")

    async def extract_pain_points(self, transcript: str, call_context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        try:
            prompt = f"Analyze this call transcript and identify pain points. Return as JSON array: {transcript}"
            
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a business analyst expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            try:
                json_start = content.find('[')
                json_end = content.rfind(']') + 1
                if json_start >= 0 and json_end > json_start:
                    pain_points_data = json.loads(content[json_start:json_end])
                else:
                    pain_points_data = []
            except:
                pain_points_data = []
            
            pain_points = []
            for i, pain_point in enumerate(pain_points_data):
                enhanced_pain_point = {
                    'id': f'pain_point_{i+1}',
                    'description': pain_point.get('description', ''),
                    'category': pain_point.get('category', 'OTHER').upper(),
                    'severity': pain_point.get('severity', 'MEDIUM').upper(),
                    'confidence': 0.8,
                    'text_segment': pain_point.get('text_segment', ''),
                    'reasoning': pain_point.get('reasoning', ''),
                    'is_resolved': False
                }
                pain_points.append(enhanced_pain_point)
            
            return pain_points
        except Exception as e:
            logger.error(f"Error extracting pain points: {e}")
            return []

    async def get_pain_point_embedding(self, text: str) -> List[float]:
        try:
            response = await self.client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return []

pain_point_extractor = PainPointExtractor()