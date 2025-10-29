"""
Minimal Solution Service for testing without loading heavy models
"""
import asyncio
import httpx
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from loguru import logger
from app.core.config import settings

class MinimalSolutionMatcher:
    def __init__(self):
        self.embedding_model = None
        self.solution_database = []
        logger.info("Minimal Solution Matcher initialized (models not loaded)")
        self._load_mock_solutions()

    def _load_mock_solutions(self):
        """Load mock solutions for testing"""
        self.solution_database = [
            {
                'id': '1',
                'title': 'API Integration Guide',
                'description': 'Step-by-step guide for integrating with our API',
                'category': 'technical',
                'difficulty': 'easy',
                'tags': ['api', 'integration', 'technical'],
                'embedding': [0.1] * 384
            },
            {
                'id': '2',
                'title': 'Troubleshooting Common Issues',
                'description': 'Solutions for frequently encountered problems',
                'category': 'technical',
                'difficulty': 'medium', 
                'tags': ['troubleshooting', 'problems', 'support'],
                'embedding': [0.2] * 384
            },
            {
                'id': '3',
                'title': 'Performance Optimization Tips',
                'description': 'Best practices for optimizing system performance',
                'category': 'performance',
                'difficulty': 'medium',
                'tags': ['performance', 'optimization', 'speed'],
                'embedding': [0.3] * 384
            }
        ]

    async def find_matching_solutions(self, pain_point: Dict[str, Any], db, top_k: int = 3) -> List[Dict[str, Any]]:
        """Generate solutions using OpenAI API based on pain points"""
        
        try:
            # Extract pain point description
            pain_point_desc = pain_point.get('description', '')
            if not pain_point_desc:
                logger.warning("No pain point description provided")
                return []
            
            # Generate solutions using OpenAI
            solutions = await self._generate_solutions_with_openai(pain_point_desc)
            
            logger.info(f"Generated {len(solutions)} solutions using OpenAI")
            return solutions
            
        except Exception as e:
            logger.error(f"Error generating solutions: {e}")
            # Fallback to mock solutions
            return await self._get_fallback_solutions(pain_point)
    
    async def _generate_solutions_with_openai(self, pain_point_desc: str) -> List[Dict[str, Any]]:
        """Generate solutions using OpenAI API"""
        
        if not settings.OPENAI_API_KEY:
            logger.warning("OpenAI API key not configured, using fallback solutions")
            return await self._get_fallback_solutions({'description': pain_point_desc})
        
        try:
            # Create prompt for OpenAI
            prompt = f"""
Based on the following pain point from a vendor-distributor conversation, generate 3 specific, actionable solutions:

Pain Point: "{pain_point_desc}"

Please provide solutions that are:
1. Specific and actionable
2. Relevant to the business context
3. Include implementation steps
4. Consider both short-term and long-term approaches

Format your response as a JSON array with the following structure:
[
  {{
    "title": "Solution Title",
    "description": "Detailed solution description with implementation steps",
    "category": "technical|training|process|communication",
    "difficulty": "easy|medium|hard",
    "priority": "high|medium|low",
    "implementation_steps": ["Step 1", "Step 2", "Step 3"],
    "expected_outcome": "What success looks like"
  }}
]

Generate exactly 3 solutions that directly address this pain point.
"""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a business consultant specializing in vendor-distributor relationships. Provide practical, actionable solutions."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "max_tokens": 1500,
                        "temperature": 0.7
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result['choices'][0]['message']['content']
                    
                    # Parse JSON response
                    try:
                        solutions_data = json.loads(content)
                        solutions = []
                        
                        for i, sol in enumerate(solutions_data):
                            solution = {
                                'id': f'openai_{i+1}',
                                'title': sol.get('title', f'Solution {i+1}'),
                                'description': sol.get('description', 'No description provided'),
                                'category': sol.get('category', 'general'),
                                'difficulty': sol.get('difficulty', 'medium'),
                                'priority': sol.get('priority', 'medium'),
                                'implementation_steps': sol.get('implementation_steps', [
                                    'Analyze current situation',
                                    'Develop implementation plan',
                                    'Execute solution'
                                ]),
                                'expected_outcome': sol.get('expected_outcome', 'Improved performance and efficiency'),
                                'relevance_score': 0.9,  # High relevance for AI-generated solutions
                                'source': 'openai'
                            }
                            solutions.append(solution)
                            logger.info(f"Added solution {i+1}: {solution['title']}")
                        
                        return solutions
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse OpenAI JSON response: {e}")
                        logger.error(f"Response content: {content}")
                        return await self._get_fallback_solutions({'description': pain_point_desc})
                        
                else:
                    logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                    return await self._get_fallback_solutions({'description': pain_point_desc})
                    
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")
            return await self._get_fallback_solutions({'description': pain_point_desc})
    
    async def _get_fallback_solutions(self, pain_point: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fallback solutions when OpenAI is not available"""
        
        pain_point_desc = pain_point.get('description', '').lower()
        
        # Generate contextual fallback solutions based on keywords
        fallback_solutions = []
        
        if 'training' in pain_point_desc or 'team' in pain_point_desc:
            fallback_solutions.append({
                'id': 'fallback_1',
                'title': 'Comprehensive Training Program',
                'description': 'Develop a structured training program covering technical aspects, sales techniques, and product knowledge. Include hands-on workshops, certification programs, and ongoing mentorship to build team confidence and improve performance.',
                'category': 'training',
                'difficulty': 'medium',
                'priority': 'high',
                'implementation_steps': [
                    'Assess current team knowledge gaps',
                    'Design curriculum with technical and sales components',
                    'Schedule regular training sessions',
                    'Implement certification process',
                    'Monitor progress and adjust program'
                ],
                'expected_outcome': 'Improved team confidence and conversion rates',
                'relevance_score': 0.8,
                'source': 'fallback'
            })
        
        if 'support' in pain_point_desc or 'response' in pain_point_desc:
            fallback_solutions.append({
                'id': 'fallback_2',
                'title': 'Enhanced Support Response System',
                'description': 'Implement a tiered support system with defined response times, escalation procedures, and customer communication protocols to improve support quality and speed.',
                'category': 'process',
                'difficulty': 'medium',
                'priority': 'high',
                'implementation_steps': [
                    'Define support tiers and response time SLAs',
                    'Implement ticketing system with priority levels',
                    'Train support team on escalation procedures',
                    'Set up automated customer notifications',
                    'Monitor and optimize response times'
                ],
                'expected_outcome': 'Faster response times and improved customer satisfaction',
                'relevance_score': 0.8,
                'source': 'fallback'
            })
        
        if 'pricing' in pain_point_desc or 'discount' in pain_point_desc:
            fallback_solutions.append({
                'id': 'fallback_3',
                'title': 'Transparent Pricing Structure',
                'description': 'Create a clear, standardized pricing model with transparent discount tiers, documented criteria, and consistent application across all customer segments.',
                'category': 'process',
                'difficulty': 'easy',
                'priority': 'medium',
                'implementation_steps': [
                    'Document current pricing structure',
                    'Define clear discount criteria',
                    'Create pricing guidelines document',
                    'Train sales team on pricing rules',
                    'Implement approval process for exceptions'
                ],
                'expected_outcome': 'Clear pricing expectations and reduced customer confusion',
                'relevance_score': 0.8,
                'source': 'fallback'
            })
        
        # If no specific keywords match, provide general solutions
        if not fallback_solutions:
            fallback_solutions = [
                {
                    'id': 'fallback_general_1',
                    'title': 'Process Improvement Initiative',
                    'description': 'Conduct a comprehensive review of current processes and implement improvements to address the identified pain point through systematic analysis and optimization.',
                    'category': 'process',
                    'difficulty': 'medium',
                    'priority': 'medium',
                    'implementation_steps': [
                        'Analyze current process',
                        'Identify improvement opportunities',
                        'Design new process flow',
                        'Implement changes gradually',
                        'Monitor and measure results'
                    ],
                    'expected_outcome': 'Improved efficiency and reduced friction',
                    'relevance_score': 0.6,
                    'source': 'fallback'
                }
            ]
        
        return fallback_solutions[:3]  # Return up to 3 solutions

    async def create_solution_mappings(self, call_id: str, pain_point_id: str, solutions: List[Dict[str, Any]], db):
        """Mock solution mapping creation"""
        logger.info(f"Mock created solution mappings for pain point {pain_point_id}")
        return True

# Global instance
solution_matcher = MinimalSolutionMatcher()
