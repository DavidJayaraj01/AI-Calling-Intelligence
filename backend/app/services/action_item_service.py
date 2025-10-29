"""
Action Item Generation Service using Local Ollama Llama3 Model
"""
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import httpx
import json
from loguru import logger
from app.core.config import settings
from app.models import Priority, ActionItemCategory, ActionItemStatus

class ActionItemGenerator:
    def __init__(self):
        self.ollama_base_url = "http://localhost:11434"
        self.model_name = "llama3:8b"
        self._load_model()

    def _load_model(self):
        """Initialize Ollama connection"""
        try:
            logger.info(f"Action item generator initialized with Ollama {self.model_name}")
        except Exception as e:
            logger.error(f"Error initializing Ollama connection: {e}")

    def _determine_priority(self, context: Dict[str, Any]) -> Priority:
        """Determine priority based on pain point severity and urgency keywords"""
        severity = context.get('severity', 'low')
        description = context.get('description', '').lower()
        
        urgent_keywords = ['urgent', 'critical', 'emergency', 'asap', 'immediately']
        high_keywords = ['important', 'major', 'significant', 'priority']
        
        if any(keyword in description for keyword in urgent_keywords) or severity == 'critical':
            return Priority.URGENT
        elif any(keyword in description for keyword in high_keywords) or severity == 'high':
            return Priority.HIGH
        elif severity == 'medium':
            return Priority.MEDIUM
        else:
            return Priority.LOW

    def _determine_category(self, description: str, pain_point_category: str) -> ActionItemCategory:
        """Determine action item category based on description and pain point"""
        description_lower = description.lower()
        
        # Map pain point categories to action item categories
        category_mapping = {
            'technical': ActionItemCategory.ESCALATION,
            'pricing': ActionItemCategory.FOLLOW_UP,
            'product': ActionItemCategory.RESEARCH,
            'service': ActionItemCategory.COMMUNICATION,
            'delivery': ActionItemCategory.FOLLOW_UP,
            'communication': ActionItemCategory.COMMUNICATION,
        }
        
        # Check for specific keywords
        if any(word in description_lower for word in ['research', 'investigate', 'study']):
            return ActionItemCategory.RESEARCH
        elif any(word in description_lower for word in ['document', 'record', 'note']):
            return ActionItemCategory.DOCUMENTATION
        elif any(word in description_lower for word in ['train', 'teach', 'educate']):
            return ActionItemCategory.TRAINING
        elif any(word in description_lower for word in ['escalate', 'urgent', 'critical']):
            return ActionItemCategory.ESCALATION
        elif any(word in description_lower for word in ['follow', 'check', 'verify']):
            return ActionItemCategory.FOLLOW_UP
        
        # Use mapping from pain point category
        return category_mapping.get(pain_point_category, ActionItemCategory.FOLLOW_UP)

    def _calculate_due_date(self, priority: Priority) -> datetime:
        """Calculate due date based on priority"""
        now = datetime.utcnow()
        
        if priority == Priority.URGENT:
            return now + timedelta(days=1)
        elif priority == Priority.HIGH:
            return now + timedelta(days=3)
        elif priority == Priority.MEDIUM:
            return now + timedelta(weeks=1)
        else:
            return now + timedelta(weeks=2)

    async def _generate_with_ollama(
        self,
        transcript: str,
        pain_points: List[Dict[str, Any]],
        solutions: List[Dict[str, Any]],
        call_context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate action items using local Ollama Llama3 model"""
        try:
            # Prepare context for the model
            pain_points_text = "\n".join([
                f"- {pp.get('description', 'N/A')} (Category: {pp.get('category', 'N/A')}, Severity: {pp.get('severity', 'N/A')})"
                for pp in pain_points
            ])
            
            solutions_text = "\n".join([
                f"- {sol.get('title', 'N/A')}: {sol.get('description', 'N/A')}"
                for sol in solutions[:3]  # Limit to top 3 solutions
            ])
            
            prompt = f"""Based on the following sales call transcript and identified issues, generate specific action items.

Call Transcript:
{transcript[:1000]}...

Identified Pain Points:
{pain_points_text}

Suggested Solutions:
{solutions_text}

Generate 2-4 actionable tasks that should be completed as follow-up to this call. For each action item, provide:
1. A clear, specific title (max 100 characters)
2. A detailed description of what needs to be done
3. Who should be assigned (use 'Sales Team', 'Support Team', or 'Management')

Format your response as a JSON array of objects with fields: title, description, assignee.
"""

            # Call Ollama API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.ollama_base_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    response_text = result.get('response', '')
                    
                    # Parse the JSON response
                    try:
                        action_items_data = json.loads(response_text)
                        if not isinstance(action_items_data, list):
                            action_items_data = [action_items_data]
                    except json.JSONDecodeError:
                        logger.warning("Failed to parse Ollama response as JSON, using fallback")
                        return self._generate_fallback_action_items(pain_points, call_context)
                    
                    # Format action items
                    action_items = []
                    for idx, item in enumerate(action_items_data[:4]):  # Max 4 items
                        title = item.get('title', f"Action Item {idx + 1}")[:100]
                        description = item.get('description', item.get('title', 'Follow up required'))
                        
                        # Determine priority and category from pain points
                        priority = self._determine_priority({
                            'severity': pain_points[0].get('severity', 'medium') if pain_points else 'medium',
                            'description': description
                        })
                        
                        category = self._determine_category(
                            description,
                            pain_points[0].get('category', 'other') if pain_points else 'other'
                        )
                        
                        action_items.append({
                            'title': title,
                            'description': description,
                            'priority': priority.value,
                            'category': category.value,
                            'status': ActionItemStatus.PENDING.value,
                            'due_date': self._calculate_due_date(priority).isoformat(),
                            'assignee': item.get('assignee', 'Sales Team')
                        })
                    
                    logger.info(f"Generated {len(action_items)} action items using Ollama")
                    return action_items
                else:
                    logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                    return self._generate_fallback_action_items(pain_points, call_context)
                    
        except Exception as e:
            logger.error(f"Error generating action items with Ollama: {e}")
            return self._generate_fallback_action_items(pain_points, call_context)

    def _generate_fallback_action_items(
        self,
        pain_points: List[Dict[str, Any]],
        call_context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate basic action items without AI when API fails"""
        logger.info("Using fallback action item generation")
        
        action_items = []
        
        # Generate action items based on pain points
        for idx, pain_point in enumerate(pain_points[:3]):  # Max 3 pain points
            severity = pain_point.get('severity', 'medium')
            category = pain_point.get('category', 'other')
            description = pain_point.get('description', 'Issue identified')
            
            priority = self._determine_priority({
                'severity': severity,
                'description': description
            })
            
            action_category = self._determine_category(description, category)
            
            action_items.append({
                'title': f"Address {category} issue: {description[:50]}...",
                'description': f"Follow up on: {description}",
                'priority': priority.value,
                'category': action_category.value,
                'status': ActionItemStatus.PENDING.value,
                'due_date': self._calculate_due_date(priority).isoformat(),
                'assignee': 'Sales Team'
            })
        
        # Add a general follow-up action if we have pain points
        if pain_points:
            action_items.append({
                'title': 'Follow up with customer on discussed issues',
                'description': 'Schedule a follow-up call to address the concerns raised during this conversation',
                'priority': Priority.MEDIUM.value,
                'category': ActionItemCategory.FOLLOW_UP.value,
                'status': ActionItemStatus.PENDING.value,
                'due_date': self._calculate_due_date(Priority.MEDIUM).isoformat(),
                'assignee': 'Sales Team'
            })
        
        logger.info(f"Generated {len(action_items)} fallback action items")
        return action_items

    async def generate_action_items(
        self,
        transcript: str,
        pain_points: List[Dict[str, Any]],
        solutions: List[Dict[str, Any]],
        call_context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate actionable items from call analysis
        
        Args:
            transcript: Full call transcript
            pain_points: List of extracted pain points
            solutions: List of matched solutions
            call_context: Additional context about the call
            
        Returns:
            List of action items with priorities and due dates
        """
        try:
            # Always try Ollama first
            action_items = await self._generate_with_ollama(
                transcript, pain_points, solutions, call_context
            )
            
            logger.info(f"Generated {len(action_items)} action items")
            return action_items
            
        except Exception as e:
            logger.error(f"Error in action item generation: {e}")
            return self._generate_fallback_action_items(pain_points, call_context)

# Global instance
action_item_generator = ActionItemGenerator()
