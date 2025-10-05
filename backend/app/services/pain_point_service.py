"""
Pain Point Extraction Service using Google Gemini API
"""
import google.generativeai as genai
from loguru import logger
from app.core.config import settings
import json
from typing import List, Dict, Any

class PainPointExtractor:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        logger.info("Pain point extraction service initialized with Gemini API")

    def extract_pain_points(self, transcript: str, call_context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        try:
            prompt = f"""You are a business analyst expert. Analyze this call transcript and identify pain points. 

Return ONLY a JSON array with this exact format:
[
  {{
    "description": "Clear description of the pain point",
    "severity": "low|medium|high|critical",
    "category": "technical|business|communication|other",
    "impact": "Description of business impact"
  }}
]

Transcript: {transcript}"""
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=2000,
                )
            )
            
            content = response.text
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

    def get_pain_point_embedding(self, text: str) -> List[float]:
        try:
            # Note: Gemini doesn't have embedding API like OpenAI
            # For production, you would use Google's embedding models
            # For now, returning a placeholder embedding
            logger.warning("Embedding functionality not implemented with Gemini API")
            # Return a simple hash-based pseudo-embedding for demo purposes
            import hashlib
            hash_obj = hashlib.md5(text.encode())
            hash_hex = hash_obj.hexdigest()
            # Convert hex to list of floats (normalized)
            embedding = [int(hash_hex[i:i+2], 16) / 255.0 for i in range(0, min(32, len(hash_hex)), 2)]
            return embedding[:16]  # Return 16-dimensional vector
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return []

pain_point_extractor = PainPointExtractor()