#!/usr/bin/env python3
"""
Create basic demo data for the AI Call Intelligence Platform
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import User, Call, PainPoint, ActionItem, PainPointSeverity, ActionItemPriority, ActionItemStatus, ActionItemCategory
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import random

def create_basic_demo_data():
    """Create basic demo data"""
    db = SessionLocal()
    
    try:
        print("🚀 Creating basic demo data...")
        
        # 1. Create Users
        users = []
        user_data = [
            {"email": "admin@demo.com", "username": "admin", "full_name": "Admin User"},
            {"email": "manager@techcorp.com", "username": "manager", "full_name": "John Manager"},
            {"email": "analyst@global.com", "username": "analyst", "full_name": "Sarah Analyst"}
        ]
        
        for user_data_item in user_data:
            user = db.query(User).filter(User.email == user_data_item["email"]).first()
            if not user:
                # Use a simple placeholder password hash for demo purposes
                simple_hash = f"demo_hash_{user_data_item['username']}"
                user = User(
                    email=user_data_item["email"],
                    username=user_data_item["username"],
                    full_name=user_data_item["full_name"],
                    hashed_password=simple_hash,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            users.append(user)
            print(f"✅ Created user: {user.email} (ID: {user.id})")

        # 2. Create Calls with realistic business scenarios
        calls = []
        call_templates = [
            {
                "title": "Q3 Business Review - CloudTech Partnership",
                "description": "Quarterly review of cloud infrastructure deployment and performance metrics",
                "transcript": "Good morning, thank you for joining our Q3 business review. We've seen significant growth in our partnership this quarter. The new cloud infrastructure deployment has been successful, with 99.9% uptime achieved. However, we've encountered some challenges with the data migration process that we need to address. The pricing structure is working well, but we need to discuss scaling options for next quarter."
            },
            {
                "title": "Technical Support Escalation - Database Issues",
                "description": "Emergency call regarding production database outage",
                "transcript": "Hi, I'm calling about the critical system outage we experienced last week. Our production environment was down for approximately 4 hours, which caused significant business impact to our customers. The root cause appears to be related to the database connection pooling configuration. We need immediate action to prevent this from happening again."
            },
            {
                "title": "Product Roadmap Discussion - Analytics Dashboard",
                "description": "Planning session for upcoming analytics features",
                "transcript": "Thanks for the call today. We're excited about the upcoming product releases. The new analytics dashboard looks very promising, and our team is particularly interested in the real-time reporting features. However, we have concerns about the integration complexity with our existing systems."
            },
            {
                "title": "Pricing Negotiation - Enterprise Package",
                "description": "Discussion about enterprise pricing and service levels",
                "transcript": "We appreciate the detailed proposal you sent. The enterprise package features look comprehensive. However, we need to discuss the pricing structure. The current pricing is above our budget expectations. We're looking for a more flexible payment plan that aligns with our quarterly billing cycles."
            },
            {
                "title": "Training Session Follow-up",
                "description": "Post-training feedback and support discussion",
                "transcript": "The training session yesterday was helpful, but our team still has questions about the advanced features. We need additional documentation and perhaps some hands-on workshop sessions. The user interface is intuitive, but the reporting module needs more detailed explanations."
            }
        ]
        
        for i, template in enumerate(call_templates):
            # Create each call template once
            call = Call(
                title=template["title"],
                description=template["description"],
                transcript=template["transcript"],
                duration_seconds=random.randint(1200, 3600),
                overall_sentiment=random.choice(["positive", "negative", "neutral"]),
                sentiment_confidence=random.uniform(0.75, 0.95),
                positive_percentage=random.uniform(20, 80),
                negative_percentage=random.uniform(10, 30),
                neutral_percentage=random.uniform(10, 50),
                ai_summary=f"Summary of {template['title']}: Key discussion points and outcomes.",
                key_topics=["partnership", "infrastructure", "pricing", "support"],
                recommendations=["Schedule follow-up meeting", "Provide additional documentation", "Review pricing structure"],
                tokens_used=random.randint(500, 1500),
                openai_model_used="gpt-4o-mini",
                whisper_model_used="whisper-1"
            )
            db.add(call)
            db.commit()
            db.refresh(call)
            calls.append(call)
            print(f"✅ Created call: {call.title}")

        # 3. Create Pain Points for each call
        pain_point_templates = [
            {"description": "System performance issues affecting user experience", "category": "technical", "severity": PainPointSeverity.HIGH},
            {"description": "Pricing concerns for enterprise customers", "category": "pricing", "severity": PainPointSeverity.MEDIUM},
            {"description": "Limited training resources for new features", "category": "service", "severity": PainPointSeverity.MEDIUM},
            {"description": "Integration challenges with existing systems", "category": "technical", "severity": PainPointSeverity.HIGH},
            {"description": "Database connection timeout issues", "category": "technical", "severity": PainPointSeverity.CRITICAL},
            {"description": "Delayed response time for support tickets", "category": "service", "severity": PainPointSeverity.MEDIUM},
            {"description": "Complex user interface in reporting module", "category": "product", "severity": PainPointSeverity.LOW}
        ]
        
        for call in calls:
            # Add 2-3 pain points per call
            num_pain_points = random.randint(2, 3)
            selected_pain_points = random.sample(pain_point_templates, num_pain_points)
            
            for pain_point_data in selected_pain_points:
                pain_point = PainPoint(
                    call_id=call.id,
                    description=pain_point_data["description"],
                    category=pain_point_data["category"],
                    severity=pain_point_data["severity"],
                    confidence_score=random.uniform(0.7, 0.95),
                    transcript_segment=call.transcript[:200] + "..."  # First 200 chars as sample
                )
                db.add(pain_point)
                print(f"✅ Created pain point: {pain_point.description[:50]}...")

        # 4. Create Action Items for each call
        action_item_templates = [
            {"title": "Schedule technical review meeting", "description": "Organize meeting with technical teams to address system issues", "priority": ActionItemPriority.HIGH, "category": "follow_up"},
            {"title": "Prepare pricing proposal", "description": "Create detailed pricing proposal with flexible payment options", "priority": ActionItemPriority.MEDIUM, "category": "research"},
            {"title": "Update user documentation", "description": "Enhance user documentation with detailed feature explanations", "priority": ActionItemPriority.MEDIUM, "category": "documentation"},
            {"title": "Conduct training workshop", "description": "Organize hands-on training workshop for advanced features", "priority": ActionItemPriority.HIGH, "category": "training"},
            {"title": "Investigate database issues", "description": "Perform detailed analysis of database connection problems", "priority": ActionItemPriority.URGENT, "category": "escalation"},
            {"title": "Improve system monitoring", "description": "Implement better monitoring and alerting systems", "priority": ActionItemPriority.HIGH, "category": "research"}
        ]
        
        for call in calls:
            # Add 2-3 action items per call
            num_action_items = random.randint(2, 3)
            selected_action_items = random.sample(action_item_templates, num_action_items)
            
            for action_item_data in selected_action_items:
                due_date = datetime.now() + timedelta(days=random.randint(3, 21))
                action_item = ActionItem(
                    call_id=call.id,
                    title=action_item_data["title"],
                    description=action_item_data["description"],
                    priority=action_item_data["priority"],
                    status=random.choice([ActionItemStatus.PENDING, ActionItemStatus.IN_PROGRESS, ActionItemStatus.COMPLETED]),
                    category=action_item_data["category"],
                    estimated_days=random.randint(3, 14),
                    assigned_to=random.choice(users).full_name,
                    due_date=due_date.date()
                )
                db.add(action_item)
                print(f"✅ Created action item: {action_item.title}")

        db.commit()
        
        print("\n🎉 Demo data created successfully!")
        print(f"📊 Summary:")
        print(f"   Users: {len(users)}")
        print(f"   Calls: {len(calls)}")
        print(f"   Pain Points: {len(db.query(PainPoint).all())}")
        print(f"   Action Items: {len(db.query(ActionItem).all())}")
        
        print("\n🔑 Login Credentials:")
        print("   Note: Demo users created with placeholder passwords")
        for user in users:
            print(f"   {user.email} (username: {user.username})")

    except Exception as e:
        print(f"❌ Error creating demo data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_basic_demo_data()