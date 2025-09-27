"""
Calls API routes - Real data from OpenAI analysis
No mock data - all content comes from actual call transcriptions and AI analysis
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from loguru import logger

from app.core.database import get_db
from app.models import Call, PainPoint, ActionItem, CallSentiment, PainPointSeverity, ActionItemPriority, ActionItemStatus

router = APIRouter()

@router.get("/")
async def get_calls(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    sentiment: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """
    Get all calls with real data from database
    No mock data - returns actual transcribed and analyzed calls
    """
    try:
        query = db.query(Call)
        
        # Filter by sentiment if provided
        if sentiment and sentiment in ['positive', 'negative', 'neutral', 'mixed']:
            query = query.filter(Call.overall_sentiment == sentiment)
        
        # Search in title, description, or transcript
        if search:
            search_term = f"%{search}%"
            query = query.filter(or_(
                Call.title.ilike(search_term),
                Call.description.ilike(search_term),
                Call.transcript.ilike(search_term)
            ))
        
        # Get total count for pagination
        total = query.count()
        
        # Get calls with pagination
        calls = query.order_by(desc(Call.created_at)).offset(skip).limit(limit).all()
        
        # Format response with real data
        calls_data = []
        for call in calls:
            calls_data.append({
                "id": call.id,
                "title": call.title,
                "description": call.description,
                "transcript_preview": call.transcript[:200] + "..." if len(call.transcript) > 200 else call.transcript,
                "audio_filename": call.audio_filename,
                "duration_seconds": call.duration_seconds,
                "overall_sentiment": call.overall_sentiment.value if call.overall_sentiment else "neutral",
                "sentiment_confidence": call.sentiment_confidence,
                "positive_percentage": call.positive_percentage,
                "negative_percentage": call.negative_percentage,
                "neutral_percentage": call.neutral_percentage,
                "key_topics": call.key_topics or [],
                "pain_points_count": len(call.pain_points),
                "action_items_count": len(call.action_items),
                "tokens_used": call.tokens_used,
                "created_at": call.created_at.isoformat() if call.created_at else None,
                "updated_at": call.updated_at.isoformat() if call.updated_at else None
            })
        
        return {
            "success": True,
            "data": calls_data,
            "pagination": {
                "total": total,
                "skip": skip,
                "limit": limit,
                "has_more": skip + limit < total
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching calls: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching calls: {str(e)}")

@router.get("/{call_id}")
async def get_call_detail(call_id: int, db: Session = Depends(get_db)):
    """
    Get detailed call information with real analysis data
    """
    try:
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        
        # Get related pain points and action items
        pain_points = db.query(PainPoint).filter(PainPoint.call_id == call_id).all()
        action_items = db.query(ActionItem).filter(ActionItem.call_id == call_id).all()
        
        # Format pain points with real AI analysis
        pain_points_data = []
        for pp in pain_points:
            pain_points_data.append({
                "id": pp.id,
                "description": pp.description,
                "category": pp.category,
                "severity": pp.severity.value if pp.severity else "medium",
                "confidence_score": pp.confidence_score,
                "transcript_segment": pp.transcript_segment,
                "created_at": pp.created_at.isoformat() if pp.created_at else None
            })
        
        # Format action items with real AI recommendations
        action_items_data = []
        for ai in action_items:
            action_items_data.append({
                "id": ai.id,
                "title": ai.title,
                "description": ai.description,
                "priority": ai.priority.value if ai.priority else "medium",
                "status": ai.status.value if ai.status else "pending",
                "category": ai.category,
                "estimated_days": ai.estimated_days,
                "assigned_to": ai.assigned_to,
                "due_date": ai.due_date.isoformat() if ai.due_date else None,
                "created_at": ai.created_at.isoformat() if ai.created_at else None,
                "updated_at": ai.updated_at.isoformat() if ai.updated_at else None
            })
        
        return {
            "success": True,
            "data": {
                "id": call.id,
                "title": call.title,
                "description": call.description,
                "transcript": call.transcript,  # Full transcript
                "audio_filename": call.audio_filename,
                "duration_seconds": call.duration_seconds,
                
                # Real sentiment analysis from OpenAI
                "sentiment_analysis": {
                    "overall_sentiment": call.overall_sentiment.value if call.overall_sentiment else "neutral",
                    "confidence_score": call.sentiment_confidence,
                    "breakdown": {
                        "positive_percentage": call.positive_percentage,
                        "negative_percentage": call.negative_percentage,
                        "neutral_percentage": call.neutral_percentage
                    }
                },
                
                # AI generated content
                "ai_summary": call.ai_summary,
                "key_topics": call.key_topics or [],
                "recommendations": call.recommendations or [],
                
                # Real extracted data
                "pain_points": pain_points_data,
                "action_items": action_items_data,
                
                # Metadata
                "tokens_used": call.tokens_used,
                "openai_model_used": call.openai_model_used,
                "whisper_model_used": call.whisper_model_used,
                "created_at": call.created_at.isoformat() if call.created_at else None,
                "updated_at": call.updated_at.isoformat() if call.updated_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching call detail: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching call: {str(e)}")

@router.get("/analytics/dashboard")
async def get_dashboard_analytics(db: Session = Depends(get_db)):
    """
    Real dashboard analytics from actual call data
    No mock data - calculated from real OpenAI analysis results
    """
    try:
        # Get date ranges
        today = date.today()
        last_30_days = today - timedelta(days=30)
        last_7_days = today - timedelta(days=7)
        
        # Total calls from real data
        total_calls = db.query(Call).count()
        calls_last_30_days = db.query(Call).filter(Call.created_at >= last_30_days).count()
        calls_last_7_days = db.query(Call).filter(Call.created_at >= last_7_days).count()
        
        # Sentiment distribution from real AI analysis
        sentiment_stats = db.query(
            Call.overall_sentiment,
            func.count(Call.id).label('count')
        ).group_by(Call.overall_sentiment).all()
        
        sentiment_distribution = {}
        for sentiment, count in sentiment_stats:
            sentiment_key = sentiment.value if sentiment else 'neutral'
            sentiment_distribution[sentiment_key] = count
        
        # Pain points by category from real analysis
        pain_point_categories = db.query(
            PainPoint.category,
            func.count(PainPoint.id).label('count')
        ).group_by(PainPoint.category).order_by(func.count(PainPoint.id).desc()).limit(5).all()
        
        # Action items by priority from real data
        action_item_priorities = db.query(
            ActionItem.priority,
            func.count(ActionItem.id).label('count')
        ).group_by(ActionItem.priority).all()
        
        # Recent calls for timeline
        recent_calls = db.query(Call).order_by(desc(Call.created_at)).limit(10).all()
        
        recent_calls_data = []
        for call in recent_calls:
            recent_calls_data.append({
                "id": call.id,
                "title": call.title,
                "sentiment": call.overall_sentiment.value if call.overall_sentiment else "neutral",
                "pain_points": len(call.pain_points),
                "action_items": len(call.action_items),
                "created_at": call.created_at.isoformat() if call.created_at else None
            })
        
        # Monthly trend data from real calls
        monthly_data = db.query(
            func.date_trunc('month', Call.created_at).label('month'),
            func.count(Call.id).label('calls'),
            func.count(PainPoint.id).label('pain_points'),
            func.count(ActionItem.id).label('action_items')
        ).outerjoin(PainPoint, Call.id == PainPoint.call_id)\
         .outerjoin(ActionItem, Call.id == ActionItem.call_id)\
         .filter(Call.created_at >= last_30_days)\
         .group_by(func.date_trunc('month', Call.created_at))\
         .order_by(func.date_trunc('month', Call.created_at))\
         .all()
        
        return {
            "success": True,
            "data": {
                "overview": {
                    "total_calls": total_calls,
                    "calls_last_30_days": calls_last_30_days,
                    "calls_last_7_days": calls_last_7_days,
                    "total_pain_points": db.query(PainPoint).count(),
                    "total_action_items": db.query(ActionItem).count(),
                    "avg_sentiment_confidence": db.query(func.avg(Call.sentiment_confidence)).scalar() or 0.0
                },
                "sentiment_distribution": sentiment_distribution,
                "pain_point_categories": [{"category": cat, "count": count} for cat, count in pain_point_categories],
                "action_item_priorities": [{"priority": priority.value if priority else "medium", "count": count} for priority, count in action_item_priorities],
                "recent_calls": recent_calls_data,
                "monthly_trends": [
                    {
                        "month": month.isoformat() if month else None,
                        "calls": calls,
                        "pain_points": pain_points,
                        "action_items": action_items
                    }
                    for month, calls, pain_points, action_items in monthly_data
                ],
                "generated_at": datetime.now().isoformat(),
                "data_source": "real_openai_analysis"
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating dashboard analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating analytics: {str(e)}")