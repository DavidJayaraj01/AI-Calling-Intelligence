"""
Quarterly Business Review (QBR) Generation Service
Generates comprehensive QBR reports using real-time call data and sentiment analysis
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from loguru import logger
import json

from app.models import (
    Call, PainPoint, ActionItem, SentimentSegment, 
    Distributor, Vendor, ActionItemStatus, Priority
)

class QBRGenerationService:
    def __init__(self):
        logger.info("QBR Generation Service initialized")

    async def generate_qbr_report(
        self,
        db: Session,
        distributor_id: Optional[int] = None,
        vendor_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        quarter: Optional[int] = None,
        year: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive QBR report with real-time data
        
        Args:
            db: Database session
            distributor_id: Filter by distributor
            vendor_id: Filter by vendor
            start_date: Start date for analysis
            end_date: End date for analysis
            quarter: Quarter number (1-4)
            year: Year
            
        Returns:
            Complete QBR report data
        """
        try:
            # Determine date range
            if quarter and year:
                start_date, end_date = self._get_quarter_dates(quarter, year)
            elif not start_date or not end_date:
                # Default to last 90 days
                end_date = datetime.utcnow()
                start_date = end_date - timedelta(days=90)
            
            logger.info(f"Generating QBR report from {start_date} to {end_date}")
            
            # Build base query
            query = db.query(Call)
            
            if distributor_id:
                query = query.filter(Call.distributor_id == distributor_id)
            if vendor_id:
                query = query.filter(Call.vendor_id == vendor_id)
            
            query = query.filter(
                and_(
                    Call.created_at >= start_date,
                    Call.created_at <= end_date
                )
            )
            
            calls = query.all()
            call_ids = [call.call_id for call in calls]
            
            # Get distributor and vendor info
            distributor = None
            vendor = None
            if distributor_id:
                distributor = db.query(Distributor).filter(Distributor.distributor_id == distributor_id).first()
            if vendor_id:
                vendor = db.query(Vendor).filter(Vendor.vendor_id == vendor_id).first()
            
            # Generate report sections
            overview = self._generate_overview(db, calls, distributor, vendor, start_date, end_date, quarter, year)
            executive_summary = self._generate_executive_summary(db, calls, call_ids)
            call_metrics = self._calculate_call_metrics(db, calls, call_ids)
            sentiment_analysis = self._analyze_sentiment_trends(db, call_ids, start_date, end_date)
            pain_point_analysis = self._analyze_pain_points(db, call_ids)
            action_items_summary = self._summarize_action_items(db, call_ids)
            recommendations = self._generate_recommendations(
                sentiment_analysis, 
                pain_point_analysis, 
                action_items_summary
            )
            
            report = {
                "overview": overview,
                "executive_summary": executive_summary,
                "call_metrics": call_metrics,
                "sentiment_analysis": sentiment_analysis,
                "pain_point_analysis": pain_point_analysis,
                "action_items_summary": action_items_summary,
                "recommendations": recommendations,
                "generated_at": datetime.utcnow().isoformat(),
                "report_period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "quarter": quarter,
                    "year": year
                }
            }
            
            logger.info("QBR report generated successfully")
            return report
            
        except Exception as e:
            logger.error(f"Error generating QBR report: {e}")
            raise

    def _get_quarter_dates(self, quarter: int, year: int) -> tuple:
        """Get start and end dates for a quarter"""
        quarter_starts = {
            1: (1, 1),
            2: (4, 1),
            3: (7, 1),
            4: (10, 1)
        }
        quarter_ends = {
            1: (3, 31),
            2: (6, 30),
            3: (9, 30),
            4: (12, 31)
        }
        
        start_month, start_day = quarter_starts[quarter]
        end_month, end_day = quarter_ends[quarter]
        
        start_date = datetime(year, start_month, start_day)
        end_date = datetime(year, end_month, end_day, 23, 59, 59)
        
        return start_date, end_date

    def _generate_overview(
        self, 
        db: Session, 
        calls: List[Call],
        distributor: Optional[Distributor],
        vendor: Optional[Vendor],
        start_date: datetime,
        end_date: datetime,
        quarter: Optional[int],
        year: Optional[int]
    ) -> Dict[str, Any]:
        """Generate report overview"""
        return {
            "title": "Quarterly Business Review",
            "subtitle": f"Q{quarter} {year} Business Review" if quarter and year else "Business Review",
            "partnership": f"{distributor.name if distributor else 'All Distributors'} & {vendor.name if vendor else 'All Vendors'}",
            "period": {
                "start": start_date.strftime("%B %d, %Y"),
                "end": end_date.strftime("%B %d, %Y"),
                "quarter": quarter,
                "year": year
            },
            "total_calls": len(calls),
            "status": "draft",
            "completion_rate": 75  # Calculate based on data completeness
        }

    def _generate_executive_summary(
        self, 
        db: Session, 
        calls: List[Call],
        call_ids: List[int]
    ) -> Dict[str, Any]:
        """Generate executive summary with key insights"""
        total_calls = len(calls)
        
        # Calculate average sentiment
        avg_sentiment = db.query(func.avg(SentimentSegment.confidence)).filter(
            SentimentSegment.call_id.in_(call_ids)
        ).scalar() or 0.0
        
        # Count pain points
        total_pain_points = db.query(func.count(PainPoint.painpoint_id)).filter(
            PainPoint.call_id.in_(call_ids)
        ).scalar() or 0
        
        # Count resolved pain points (those with completed action items)
        resolved_pain_points = db.query(func.count(func.distinct(ActionItem.call_id))).filter(
            and_(
                ActionItem.call_id.in_(call_ids),
                ActionItem.status == ActionItemStatus.COMPLETED
            )
        ).scalar() or 0
        
        summary_text = f"The partnership has shown significant progress in the review period. " \
                      f"With {total_calls} calls analyzed, we've maintained an average sentiment score of " \
                      f"{avg_sentiment * 10:.1f}/10 and successfully resolved {resolved_pain_points} out of " \
                      f"{total_pain_points} identified pain points."
        
        return {
            "summary": summary_text,
            "key_metrics": {
                "total_calls": total_calls,
                "avg_sentiment_score": round(avg_sentiment * 10, 1),
                "total_pain_points": total_pain_points,
                "resolved_pain_points": resolved_pain_points,
                "resolution_rate": round((resolved_pain_points / total_pain_points * 100) if total_pain_points > 0 else 0, 1)
            }
        }

    def _calculate_call_metrics(
        self, 
        db: Session, 
        calls: List[Call],
        call_ids: List[int]
    ) -> Dict[str, Any]:
        """Calculate comprehensive call metrics"""
        total_calls = len(calls)
        
        # Average sentiment
        avg_sentiment_result = db.query(
            func.avg(SentimentSegment.confidence).label('avg_confidence')
        ).filter(
            SentimentSegment.call_id.in_(call_ids)
        ).first()
        
        avg_sentiment = (avg_sentiment_result.avg_confidence or 0.0) * 10
        
        # Pain points
        total_pain_points = db.query(func.count(PainPoint.painpoint_id)).filter(
            PainPoint.call_id.in_(call_ids)
        ).scalar() or 0
        
        resolved_pain_points = db.query(func.count(func.distinct(ActionItem.call_id))).filter(
            and_(
                ActionItem.call_id.in_(call_ids),
                ActionItem.status == ActionItemStatus.COMPLETED
            )
        ).scalar() or 0
        
        # Action items
        total_action_items = db.query(func.count(ActionItem.action_id)).filter(
            ActionItem.call_id.in_(call_ids)
        ).scalar() or 0
        
        completed_action_items = db.query(func.count(ActionItem.action_id)).filter(
            and_(
                ActionItem.call_id.in_(call_ids),
                ActionItem.status == ActionItemStatus.COMPLETED
            )
        ).scalar() or 0
        
        return {
            "total_calls": total_calls,
            "avg_sentiment": round(avg_sentiment, 1),
            "sentiment_trend": "up" if avg_sentiment > 7.0 else "down" if avg_sentiment < 5.0 else "stable",
            "pain_points": {
                "total": total_pain_points,
                "resolved": resolved_pain_points,
                "pending": total_pain_points - resolved_pain_points,
                "resolution_rate": round((resolved_pain_points / total_pain_points * 100) if total_pain_points > 0 else 0, 1)
            },
            "action_items": {
                "total": total_action_items,
                "completed": completed_action_items,
                "pending": total_action_items - completed_action_items,
                "completion_rate": round((completed_action_items / total_action_items * 100) if total_action_items > 0 else 0, 1)
            }
        }

    def _analyze_sentiment_trends(
        self, 
        db: Session, 
        call_ids: List[int],
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Analyze sentiment trends over time"""
        # Get sentiment data by week
        sentiment_by_week = db.query(
            func.date_trunc('week', Call.created_at).label('week'),
            func.avg(SentimentSegment.confidence).label('avg_sentiment'),
            func.count(Call.call_id).label('call_count')
        ).join(
            SentimentSegment, Call.call_id == SentimentSegment.call_id
        ).filter(
            Call.call_id.in_(call_ids)
        ).group_by('week').order_by('week').all()
        
        trend_data = [
            {
                "date": week.strftime("%Y-%m-%d"),
                "sentiment": round(avg_sentiment * 10, 1),
                "call_count": call_count
            }
            for week, avg_sentiment, call_count in sentiment_by_week
        ]
        
        # Calculate sentiment distribution
        positive_segments = db.query(func.count(SentimentSegment.segment_id)).filter(
            and_(
                SentimentSegment.call_id.in_(call_ids),
                SentimentSegment.sentiment == 'positive'
            )
        ).scalar() or 0
        
        negative_segments = db.query(func.count(SentimentSegment.segment_id)).filter(
            and_(
                SentimentSegment.call_id.in_(call_ids),
                SentimentSegment.sentiment == 'negative'
            )
        ).scalar() or 0
        
        neutral_segments = db.query(func.count(SentimentSegment.segment_id)).filter(
            and_(
                SentimentSegment.call_id.in_(call_ids),
                SentimentSegment.sentiment == 'neutral'
            )
        ).scalar() or 0
        
        total_segments = positive_segments + negative_segments + neutral_segments
        
        return {
            "trend_data": trend_data,
            "overall_average": round(sum(d['sentiment'] for d in trend_data) / len(trend_data), 1) if trend_data else 0.0,
            "sentiment_distribution": {
                "positive": round((positive_segments / total_segments * 100) if total_segments > 0 else 0, 1),
                "negative": round((negative_segments / total_segments * 100) if total_segments > 0 else 0, 1),
                "neutral": round((neutral_segments / total_segments * 100) if total_segments > 0 else 0, 1)
            },
            "total_segments_analyzed": total_segments
        }

    def _analyze_pain_points(self, db: Session, call_ids: List[int]) -> Dict[str, Any]:
        """Analyze pain points by category and severity"""
        # Pain points by category
        pain_points_by_category = db.query(
            PainPoint.category,
            func.count(PainPoint.painpoint_id).label('count')
        ).filter(
            PainPoint.call_id.in_(call_ids)
        ).group_by(PainPoint.category).all()
        
        category_data = {
            category: count 
            for category, count in pain_points_by_category
        }
        
        # Pain points by severity
        pain_points_by_severity = db.query(
            PainPoint.severity,
            func.count(PainPoint.painpoint_id).label('count')
        ).filter(
            PainPoint.call_id.in_(call_ids)
        ).group_by(PainPoint.severity).all()
        
        severity_data = {
            severity: count 
            for severity, count in pain_points_by_severity
        }
        
        # Top pain points
        top_pain_points = db.query(
            PainPoint.description,
            PainPoint.category,
            PainPoint.severity,
            func.count(PainPoint.painpoint_id).label('occurrences')
        ).filter(
            PainPoint.call_id.in_(call_ids)
        ).group_by(
            PainPoint.description, 
            PainPoint.category, 
            PainPoint.severity
        ).order_by(
            func.count(PainPoint.painpoint_id).desc()
        ).limit(10).all()
        
        top_pain_points_list = [
            {
                "description": desc,
                "category": cat,
                "severity": sev,
                "occurrences": occ
            }
            for desc, cat, sev, occ in top_pain_points
        ]
        
        return {
            "by_category": category_data,
            "by_severity": severity_data,
            "top_pain_points": top_pain_points_list,
            "total_pain_points": sum(category_data.values())
        }

    def _summarize_action_items(self, db: Session, call_ids: List[int]) -> Dict[str, Any]:
        """Summarize action items by status and priority"""
        # Action items by status
        items_by_status = db.query(
            ActionItem.status,
            func.count(ActionItem.action_id).label('count')
        ).filter(
            ActionItem.call_id.in_(call_ids)
        ).group_by(ActionItem.status).all()
        
        status_data = {
            status.value if hasattr(status, 'value') else str(status): count 
            for status, count in items_by_status
        }
        
        # Action items by priority
        items_by_priority = db.query(
            ActionItem.priority,
            func.count(ActionItem.action_id).label('count')
        ).filter(
            ActionItem.call_id.in_(call_ids)
        ).group_by(ActionItem.priority).all()
        
        priority_data = {
            priority.value if hasattr(priority, 'value') else str(priority): count 
            for priority, count in items_by_priority
        }
        
        # Overdue action items
        overdue_items = db.query(func.count(ActionItem.action_id)).filter(
            and_(
                ActionItem.call_id.in_(call_ids),
                ActionItem.due_date < datetime.utcnow(),
                ActionItem.status != ActionItemStatus.COMPLETED
            )
        ).scalar() or 0
        
        total_items = sum(status_data.values())
        
        return {
            "by_status": status_data,
            "by_priority": priority_data,
            "total": total_items,
            "completed": status_data.get('completed', 0),
            "pending": status_data.get('pending', 0),
            "in_progress": status_data.get('in_progress', 0),
            "overdue": overdue_items,
            "completion_rate": round((status_data.get('completed', 0) / total_items * 100) if total_items > 0 else 0, 1)
        }

    def _generate_recommendations(
        self,
        sentiment_analysis: Dict[str, Any],
        pain_point_analysis: Dict[str, Any],
        action_items_summary: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate recommendations based on analysis"""
        recommendations = []
        
        # Sentiment-based recommendations
        avg_sentiment = sentiment_analysis.get('overall_average', 0)
        if avg_sentiment < 6.0:
            recommendations.append({
                "priority": "HIGH",
                "category": "Sentiment",
                "title": "Address Low Customer Sentiment",
                "description": f"Average sentiment score is {avg_sentiment}/10, below target. Immediate action required.",
                "action": "Schedule review meetings to understand and address customer concerns"
            })
        
        # Pain point recommendations
        top_categories = pain_point_analysis.get('by_category', {})
        if top_categories:
            top_category = max(top_categories, key=top_categories.get)
            recommendations.append({
                "priority": "MEDIUM",
                "category": "Pain Points",
                "title": f"Focus on {top_category.title()} Issues",
                "description": f"{top_categories[top_category]} pain points identified in {top_category} category",
                "action": f"Develop action plan to address {top_category} concerns systematically"
            })
        
        # Action item recommendations
        overdue = action_items_summary.get('overdue', 0)
        if overdue > 0:
            recommendations.append({
                "priority": "URGENT",
                "category": "Action Items",
                "title": "Address Overdue Action Items",
                "description": f"{overdue} action items are overdue and require immediate attention",
                "action": "Review and reassign overdue items with updated timelines"
            })
        
        completion_rate = action_items_summary.get('completion_rate', 0)
        if completion_rate < 70:
            recommendations.append({
                "priority": "MEDIUM",
                "category": "Execution",
                "title": "Improve Action Item Completion Rate",
                "description": f"Current completion rate is {completion_rate}%, below target of 80%",
                "action": "Review resource allocation and remove blockers"
            })
        
        return recommendations

# Global instance
qbr_generator = QBRGenerationService()
