"""
Action Item Generation Service using OpenAI API
"""
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
from openai import AsyncOpenAI
from loguru import logger
from app.core.config import settings
from app.models import ActionItemPriority, ActionItemCategory, ActionItemStatus

class ActionItemGenerator:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        logger.info("Action item generator initialized with OpenAI API")

    def _determine_priority(self, context: Dict[str, Any]) -> ActionItemPriority:
        """Determine priority based on pain point severity and urgency keywords"""
        severity = context.get('severity', 'low')
        description = context.get('description', '').lower()
        
        urgent_keywords = ['urgent', 'critical', 'emergency', 'asap', 'immediately']
        high_keywords = ['important', 'major', 'significant', 'priority']
        
        if any(keyword in description for keyword in urgent_keywords) or severity == 'critical':
            return ActionItemPriority.URGENT
        elif any(keyword in description for keyword in high_keywords) or severity == 'high':
            return ActionItemPriority.HIGH
        elif severity == 'medium':
            return ActionItemPriority.MEDIUM
        else:
            return ActionItemPriority.LOW

    def _calculate_due_date(self, priority: ActionItemPriority, category: ActionItemCategory) -> datetime:
        """Calculate due date based on priority and category"""
        base_date = datetime.utcnow()
        
        if priority == ActionItemPriority.URGENT:
            return base_date + timedelta(days=1)
        elif priority == ActionItemPriority.HIGH:
            return base_date + timedelta(days=3)
        elif priority == ActionItemPriority.MEDIUM:
            return base_date + timedelta(days=7)
        else:
            return base_date + timedelta(days=14)

    async def generate_action_items(
        self,
        call_transcript: str,
        pain_points: List[Dict[str, Any]],
        solutions: List[Dict[str, Any]],
        call_context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate action items based on call transcript, pain points, and solutions
        """
        try:
            # Prepare context for the AI
            context_info = f"Call Date: {call_context.get('call_date', 'Unknown')}\n"
            context_info += f"Participants: {', '.join(call_context.get('participants', []))}\n"
            
            # Summarize pain points
            pain_points_summary = ""
            for pp in pain_points:
                pain_points_summary += f"- {pp.get('description', '')} (Severity: {pp.get('severity', 'MEDIUM')})\n"
            
            # Summarize solutions
            solutions_summary = ""
            for sol in solutions:
                solutions_summary += f"- {sol.get('title', '')}: {sol.get('description', '')}\n"

            prompt = f"""
You are a business relationship manager. Based on this vendor-distributor call, generate specific, actionable follow-up items.

Context:
{context_info}

Identified Pain Points:
{pain_points_summary}

Available Solutions:
{solutions_summary}

Call Transcript:
{call_transcript}

Generate action items that address the pain points and move the business relationship forward. For each action item, provide:

1. A clear, specific title
2. Detailed description of what needs to be done
3. Category (FOLLOW_UP, RESEARCH, DOCUMENTATION, TRAINING, ESCALATION, COMMUNICATION, OTHER)
4. Priority (LOW, MEDIUM, HIGH, URGENT)
5. Who should be responsible (distributor, vendor, or both)
6. Expected timeline

Return as JSON array:
[
  {{
    "title": "Action item title",
    "description": "Detailed description of the action",
    "category": "CATEGORY_NAME", 
    "priority": "PRIORITY_LEVEL",
    "assigned_to": "distributor|vendor|both",
    "timeline": "1-3 days|1 week|2 weeks|1 month",
    "reasoning": "Why this action is needed"
  }}
]

Focus on concrete, measurable actions that can realistically be completed.
"""

            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert business relationship manager specializing in vendor-distributor partnerships."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            
            try:
                json_start = content.find('[')
                json_end = content.rfind(']') + 1
                if json_start >= 0 and json_end > json_start:
                    action_items_data = json.loads(content[json_start:json_end])
                else:
                    action_items_data = []
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing action items response: {e}")
                action_items_data = []
            
            # Process and enhance action items
            action_items = []
            for i, item in enumerate(action_items_data):
                try:
                    # Validate category
                    category = item.get('category', 'OTHER').upper()
                    if category not in [cat.value.upper() for cat in ActionItemCategory]:
                        category = 'OTHER'
                    
                    # Validate priority
                    priority = item.get('priority', 'MEDIUM').upper()
                    if priority not in [p.value.upper() for p in ActionItemPriority]:
                        priority = 'MEDIUM'
                    
                    # Calculate due date based on timeline
                    timeline = item.get('timeline', '1 week').lower()
                    if 'day' in timeline:
                        days = 3
                    elif 'week' in timeline:
                        days = 7
                    elif 'month' in timeline:
                        days = 30
                    else:
                        days = 7
                    
                    due_date = datetime.utcnow() + timedelta(days=days)
                    
                    enhanced_item = {
                        'id': f"action_item_{i+1}",
                        'title': item.get('title', 'Untitled Action'),
                        'description': item.get('description', ''),
                        'category': category,
                        'priority': priority,
                        'status': ActionItemStatus.PENDING.value.upper(),
                        'assigned_to': item.get('assigned_to', 'distributor'),
                        'due_date': due_date.isoformat(),
                        'reasoning': item.get('reasoning', ''),
                        'created_at': datetime.utcnow().isoformat(),
                        'is_completed': False
                    }
                    
                    action_items.append(enhanced_item)
                    
                except Exception as e:
                    logger.error(f"Error processing action item {i}: {e}")
                    continue
            
            logger.info(f"Generated {len(action_items)} action items")
            return action_items
            
        except Exception as e:
            logger.error(f"Error generating action items: {e}")
            return self._fallback_action_items(pain_points, call_context)

    def _fallback_action_items(self, pain_points: List[Dict[str, Any]], call_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate basic action items from pain points"""
        logger.info("Using fallback action item generation")
        
        action_items = []
        
        for i, pain_point in enumerate(pain_points):
            action_item = {
                'id': f"action_item_{i+1}",
                'title': f"Address {pain_point.get('category', 'General')} Issue",
                'description': f"Follow up on: {pain_point.get('description', 'Issue identified in call')}",
                'category': 'FOLLOW_UP',
                'priority': pain_point.get('severity', 'MEDIUM'),
                'status': ActionItemStatus.PENDING.value.upper(),
                'assigned_to': 'distributor',
                'due_date': (datetime.utcnow() + timedelta(days=7)).isoformat(),
                'reasoning': 'Generated from identified pain point',
                'created_at': datetime.utcnow().isoformat(),
                'is_completed': False
            }
            action_items.append(action_item)
        
        # Add a general follow-up if no pain points
        if not pain_points:
            action_items.append({
                'id': 'action_item_1',
                'title': 'Schedule Follow-up Call',
                'description': 'Schedule a follow-up call to discuss next steps and address any additional concerns',
                'category': 'FOLLOW_UP',
                'priority': 'MEDIUM',
                'status': ActionItemStatus.PENDING.value.upper(),
                'assigned_to': 'distributor',
                'due_date': (datetime.utcnow() + timedelta(days=3)).isoformat(),
                'reasoning': 'Standard follow-up for business relationship management',
                'created_at': datetime.utcnow().isoformat(),
                'is_completed': False
            })
        
        return action_items

# Global instance
action_item_generator = ActionItemGenerator()