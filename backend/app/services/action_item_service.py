"""
Action Item Generation Service using local Ollama Llama3 model
"""
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import httpx
from loguru import logger
from app.core.config import settings
from app.models import Priority, ActionItemCategory, ActionItemStatus

class ActionItemGenerator:
    def __init__(self):
        self.ollama_base_url = settings.OLLAMA_BASE_URL
        self.ollama_model = settings.OLLAMA_MODEL
        self._load_model()

    def _load_model(self):
        """Initialize Ollama connection"""
        try:
            logger.info(f"Action item generator initialized with Ollama model: {self.ollama_model}")
        except Exception as e:
            logger.error(f"Error initializing Ollama connection: {e}")
            logger.info("Ollama connection will be established on first use")

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
            'technical': ActionItemCategory.RESEARCH,
            'product': ActionItemCategory.RESEARCH,
            'pricing': ActionItemCategory.DOCUMENTATION,
            'service': ActionItemCategory.FOLLOW_UP,
            'delivery': ActionItemCategory.ESCALATION,
            'communication': ActionItemCategory.COMMUNICATION
        }
        
        # Check for specific action keywords
        if any(keyword in description_lower for keyword in ['follow up', 'contact', 'call', 'reach out']):
            return ActionItemCategory.FOLLOW_UP
        elif any(keyword in description_lower for keyword in ['research', 'investigate', 'analyze']):
            return ActionItemCategory.RESEARCH
        elif any(keyword in description_lower for keyword in ['document', 'create', 'write', 'prepare']):
            return ActionItemCategory.DOCUMENTATION
        elif any(keyword in description_lower for keyword in ['train', 'educate', 'show', 'demo']):
            return ActionItemCategory.TRAINING
        elif any(keyword in description_lower for keyword in ['escalate', 'manager', 'supervisor']):
            return ActionItemCategory.ESCALATION
        
        # Use pain point category mapping as fallback
        return category_mapping.get(pain_point_category.lower(), ActionItemCategory.OTHER)

    def _calculate_due_date(self, priority: Priority, category: ActionItemCategory) -> datetime:
        """Calculate due date based on priority and category"""
        base_date = datetime.utcnow()
        
        if priority == Priority.URGENT:
            return base_date + timedelta(days=1)
        elif priority == Priority.HIGH:
            return base_date + timedelta(days=3)
        elif priority == Priority.MEDIUM:
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
        
        Args:
            call_transcript: Full call transcript
            pain_points: List of identified pain points
            solutions: List of matched solutions
            call_context: Additional context (participants, call metadata)
            
        Returns:
            List of generated action items
        """
        try:
            # Prepare context for action item generation
            context = self._prepare_context(call_transcript, pain_points, solutions, call_context)
            
            # Generate action items using Ollama
            action_items = await self._generate_with_ollama(context)
            
            # Post-process and enhance action items
            enhanced_items = []
            for item in action_items:
                enhanced_item = self._enhance_action_item(item, pain_points)
                enhanced_items.append(enhanced_item)
            
            logger.info(f"Generated {len(enhanced_items)} action items")
            return enhanced_items
            
        except Exception as e:
            logger.error(f"Error generating action items: {e}")
            raise

    def _prepare_context(
        self,
        transcript: str,
        pain_points: List[Dict[str, Any]],
        solutions: List[Dict[str, Any]],
        call_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Prepare context for action item generation"""
        
        # Summarize pain points
        pain_point_summary = "\n".join([
            f"- {pp['description']} (Severity: {pp['severity']}, Category: {pp['category']})"
            for pp in pain_points
        ])
        
        # Summarize solutions
        solution_summary = "\n".join([
            f"- {sol['title']}: {sol['description']}"
            for sol in solutions
        ])
        
        return {
            'transcript_excerpt': transcript[:1000] + "..." if len(transcript) > 1000 else transcript,
            'pain_points': pain_point_summary,
            'solutions': solution_summary,
            'participants': call_context.get('participants', []),
            'call_date': call_context.get('call_date', datetime.utcnow().isoformat()),
            'distributor': call_context.get('distributor_name', 'Customer'),
            'vendor': call_context.get('vendor_name', 'Vendor')
        }

    async def _generate_with_ollama(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Use Ollama to generate action items"""
        try:
            prompt = f"""
            Based on the following call transcript analysis, generate specific, actionable follow-up tasks.

            Call Context:
            - Distributor: {context['distributor']}
            - Vendor: {context['vendor']}
            - Participants: {', '.join(context['participants'])}
            - Date: {context['call_date']}

            Identified Pain Points:
            {context['pain_points']}

            Available Solutions:
            {context['solutions']}

            Transcript Excerpt:
            {context['transcript_excerpt']}

            Generate 3-6 specific action items that should be followed up on. For each action item, provide:
            1. Clear, actionable title (max 100 characters)
            2. Detailed description of what needs to be done
            3. Suggested assignee role (vendor_user, distributor_user, vendor_admin, etc.)
            4. Estimated completion timeframe
            5. Success criteria

            Format as JSON:
            {{
                "action_items": [
                    {{
                        "title": "Follow up on integration issue",
                        "description": "Contact customer to check on API integration progress and provide additional documentation if needed",
                        "assignee_role": "vendor_user",
                        "timeframe": "3 days",
                        "success_criteria": "Customer confirms integration is working properly"
                    }}
                ]
            }}
            """

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.ollama_base_url}/api/generate",
                    json={
                        "model": self.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.2,
                            "num_predict": 1500
                        }
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get('response', '').strip()
                    
                    # Parse the response
                    import json
                    try:
                        # Try to parse the entire response as JSON
                        parsed_result = json.loads(content)
                        return parsed_result.get('action_items', [])
                    except json.JSONDecodeError:
                        # If that fails, try to extract JSON from the response
                        import re
                        json_match = re.search(r'\{.*\}', content, re.DOTALL)
                        if json_match:
                            parsed_result = json.loads(json_match.group())
                            return parsed_result.get('action_items', [])
                        else:
                            logger.warning("Could not parse Ollama response as JSON")
                            return self._generate_fallback_action_items(context)
                else:
                    logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                    return self._generate_fallback_action_items(context)

        except Exception as e:
            logger.error(f"Error generating action items with Ollama: {e}")
            return self._generate_fallback_action_items(context)

    def _generate_fallback_action_items(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate basic action items if AI generation fails"""
        fallback_items = []
        
        # Always create a follow-up item
        fallback_items.append({
            "title": "Follow up on call discussion",
            "description": f"Follow up with {context['distributor']} regarding the discussion points from the call",
            "assignee_role": "vendor_user",
            "timeframe": "7 days",
            "success_criteria": "Customer acknowledges follow-up and confirms next steps"
        })
        
        # If there are pain points, create action items for each
        pain_points_text = context.get('pain_points', '')
        if pain_points_text:
            fallback_items.append({
                "title": "Address customer concerns",
                "description": "Review and address the concerns raised during the call",
                "assignee_role": "vendor_admin",
                "timeframe": "5 days",
                "success_criteria": "Customer concerns are resolved or mitigation plan is provided"
            })
        
        return fallback_items

    def _enhance_action_item(self, item: Dict[str, Any], pain_points: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Enhance action item with priority, category, and due date"""
        
        # Determine priority based on description and pain points
        max_severity = 'low'
        for pp in pain_points:
            if pp['severity'] in ['critical', 'high'] and max_severity in ['low', 'medium']:
                max_severity = pp['severity']
        
        context = {
            'description': item['description'],
            'severity': max_severity
        }
        
        priority = self._determine_priority(context)
        category = self._determine_category(item['description'], pain_points[0]['category'] if pain_points else 'other')
        due_date = self._calculate_due_date(priority, category)
        
        enhanced_item = {
            'title': item['title'][:200],  # Ensure max length
            'description': item['description'],
            'priority': priority.value,
            'category': category.value,
            'status': ActionItemStatus.PENDING.value,
            'due_date': due_date.isoformat(),
            'assignee_role': item.get('assignee_role', 'vendor_user'),
            'success_criteria': item.get('success_criteria', ''),
            'estimated_hours': self._estimate_hours(category, priority),
            'metadata': {
                'timeframe': item.get('timeframe', ''),
                'generated_by': 'ai_system',
                'generation_timestamp': datetime.utcnow().isoformat()
            }
        }
        
        return enhanced_item

    def _estimate_hours(self, category: ActionItemCategory, priority: Priority) -> int:
        """Estimate hours needed for completion"""
        base_hours = {
            ActionItemCategory.FOLLOW_UP: 1,
            ActionItemCategory.RESEARCH: 4,
            ActionItemCategory.DOCUMENTATION: 3,
            ActionItemCategory.TRAINING: 2,
            ActionItemCategory.ESCALATION: 1,
            ActionItemCategory.COMMUNICATION: 1,
            ActionItemCategory.OTHER: 2
        }
        
        multiplier = {
            Priority.URGENT: 1.0,
            Priority.HIGH: 1.2,
            Priority.MEDIUM: 1.0,
            Priority.LOW: 0.8
        }
        
        base = base_hours.get(category, 2)
        return max(1, int(base * multiplier.get(priority, 1.0)))

# Global instance
action_item_generator = ActionItemGenerator()
