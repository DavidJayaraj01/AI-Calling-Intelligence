"""
Solution Matching Service using Google Gemini API
"""
import asyncio
from typing import List, Dict, Any, Optional
import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from loguru import logger
from app.core.config import settings
from app.core.database import get_db

class SolutionMatcher:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        logger.info("Solution matching service initialized with Gemini API")
        
    def find_matching_solutions(
        self, 
        pain_point: Dict[str, Any], 
        db: Session,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Find matching solutions for a pain point using Gemini API
        """
        try:
            # First, try to get solutions from database
            # For now, we'll use Gemini to generate relevant solutions
            
            pain_point_desc = pain_point.get('description', '')
            pain_point_category = pain_point.get('category', 'OTHER')
            pain_point_severity = pain_point.get('severity', 'MEDIUM')
            
            prompt = f"""
You are a business solutions expert specializing in vendor-distributor relationships. 

A pain point has been identified:
- Description: {pain_point_desc}
- Category: {pain_point_category}
- Severity: {pain_point_severity}

Suggest {top_k} practical solutions or resources that could address this pain point. For each solution, provide:

1. A clear title
2. Detailed description of the solution
3. Resource type (DOCUMENTATION, TRAINING, TOOL, PROCESS, CONTACT, OTHER)
4. Implementation difficulty (LOW, MEDIUM, HIGH)
5. Expected impact (LOW, MEDIUM, HIGH)
6. Specific next steps

Return as JSON array:
[
  {{
    "title": "Solution title",
    "description": "Detailed description of the solution",
    "resource_type": "RESOURCE_TYPE",
    "difficulty": "DIFFICULTY_LEVEL",
    "impact": "IMPACT_LEVEL",
    "next_steps": "Specific actions to implement this solution",
    "tags": ["tag1", "tag2", "tag3"],
    "similarity_score": 0.85
  }}
]

Focus on actionable, realistic solutions that address the root cause of the pain point.
"""

            response = self.model.generate_content(
                f"You are a business solutions expert with deep knowledge of vendor-distributor relationships and business process optimization.\n\n{prompt}",
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
                    solutions_data = json.loads(content[json_start:json_end])
                else:
                    solutions_data = []
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing solutions response: {e}")
                solutions_data = []
            
            # Process and enhance solutions
            solutions = []
            for i, solution in enumerate(solutions_data):
                try:
                    # Validate resource type
                    resource_type = solution.get('resource_type', 'OTHER').upper()
                    valid_types = ['DOCUMENTATION', 'TRAINING', 'TOOL', 'PROCESS', 'CONTACT', 'OTHER']
                    if resource_type not in valid_types:
                        resource_type = 'OTHER'
                    
                    enhanced_solution = {
                        'resource_id': f"solution_{i+1}",
                        'title': solution.get('title', 'Untitled Solution'),
                        'description': solution.get('description', ''),
                        'resource_type': resource_type,
                        'difficulty': solution.get('difficulty', 'MEDIUM'),
                        'impact': solution.get('impact', 'MEDIUM'),
                        'next_steps': solution.get('next_steps', ''),
                        'tags': solution.get('tags', []),
                        'similarity_score': solution.get('similarity_score', 0.8),
                        'uri': f"#generated_solution_{i+1}",
                        'content': solution.get('description', '')
                    }
                    
                    solutions.append(enhanced_solution)
                    
                except Exception as e:
                    logger.error(f"Error processing solution {i}: {e}")
                    continue
            
            logger.info(f"Found {len(solutions)} solutions for pain point")
            return solutions
            
        except Exception as e:
            logger.error(f"Error finding solutions: {e}")
            return self._fallback_solutions(pain_point)

    def _fallback_solutions(self, pain_point: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate basic solutions based on pain point category"""
        logger.info("Using fallback solution generation")
        
        category = pain_point.get('category', 'OTHER')
        
        fallback_solutions = {
            'TECHNICAL': [
                {
                    'resource_id': 'tech_solution_1',
                    'title': 'Technical Support Documentation',
                    'description': 'Provide comprehensive technical documentation and troubleshooting guides',
                    'resource_type': 'DOCUMENTATION',
                    'difficulty': 'LOW',
                    'impact': 'HIGH',
                    'next_steps': 'Create or share existing technical documentation',
                    'tags': ['technical', 'documentation', 'support'],
                    'similarity_score': 0.7,
                    'uri': '#tech_docs',
                    'content': 'Technical support resources and documentation'
                }
            ],
            'PRICING': [
                {
                    'resource_id': 'pricing_solution_1',
                    'title': 'Pricing Review Meeting',
                    'description': 'Schedule a meeting to review current pricing structure and discuss alternatives',
                    'resource_type': 'PROCESS',
                    'difficulty': 'MEDIUM',
                    'impact': 'HIGH',
                    'next_steps': 'Schedule meeting with pricing team',
                    'tags': ['pricing', 'meeting', 'negotiation'],
                    'similarity_score': 0.8,
                    'uri': '#pricing_meeting',
                    'content': 'Pricing review and negotiation process'
                }
            ],
            'SERVICE': [
                {
                    'resource_id': 'service_solution_1',
                    'title': 'Service Level Agreement Review',
                    'description': 'Review and potentially update service level agreements to better meet expectations',
                    'resource_type': 'DOCUMENTATION',
                    'difficulty': 'MEDIUM',
                    'impact': 'HIGH',
                    'next_steps': 'Review current SLA and schedule discussion',
                    'tags': ['service', 'sla', 'agreement'],
                    'similarity_score': 0.75,
                    'uri': '#sla_review',
                    'content': 'Service level agreement documentation and review process'
                }
            ]
        }
        
        # Return category-specific solutions or generic ones
        solutions = fallback_solutions.get(category, [
            {
                'resource_id': 'generic_solution_1',
                'title': 'Schedule Follow-up Discussion',
                'description': 'Schedule a dedicated discussion to address this concern in detail',
                'resource_type': 'PROCESS',
                'difficulty': 'LOW',
                'impact': 'MEDIUM',
                'next_steps': 'Set up meeting to discuss the issue',
                'tags': ['follow-up', 'discussion', 'resolution'],
                'similarity_score': 0.6,
                'uri': '#follow_up',
                'content': 'Follow-up discussion process'
            }
        ])
        
        return solutions

    def generate_solution_embedding(self, text: str) -> List[float]:
        """Generate embedding for solution text using simple hash method (Gemini doesn't have embedding API)"""
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
            logger.error(f"Error generating solution embedding: {e}")
            return []

# Global instance
solution_matcher = SolutionMatcher()