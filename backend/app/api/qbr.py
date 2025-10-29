"""
QBR (Quarterly Business Review) API routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from loguru import logger

from app.core.database import get_db
from app.services.qbr_generation_service import qbr_generator
from app.schemas import APIResponse

router = APIRouter()

@router.get("/generate")
async def generate_qbr_report(
    distributor_id: Optional[int] = Query(None, description="Filter by distributor ID"),
    vendor_id: Optional[int] = Query(None, description="Filter by vendor ID"),
    quarter: Optional[int] = Query(None, ge=1, le=4, description="Quarter number (1-4)"),
    year: Optional[int] = Query(None, description="Year"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    db: Session = Depends(get_db)
):
    """
    Generate a comprehensive QBR report with real-time data
    
    Parameters:
    - distributor_id: Optional distributor filter
    - vendor_id: Optional vendor filter
    - quarter: Quarter number (1-4)
    - year: Year for the quarter
    - start_date: Custom start date (ISO format)
    - end_date: Custom end date (ISO format)
    
    Returns comprehensive QBR report with:
    - Executive summary
    - Call metrics
    - Sentiment analysis and trends
    - Pain point analysis
    - Action items summary
    - Recommendations
    """
    try:
        logger.info(f"Generating QBR report - Q{quarter} {year} - Distributor: {distributor_id}, Vendor: {vendor_id}")
        
        # Parse dates if provided
        start_dt = datetime.fromisoformat(start_date) if start_date else None
        end_dt = datetime.fromisoformat(end_date) if end_date else None
        
        # Generate report
        report = await qbr_generator.generate_qbr_report(
            db=db,
            distributor_id=distributor_id,
            vendor_id=vendor_id,
            start_date=start_dt,
            end_date=end_dt,
            quarter=quarter,
            year=year
        )
        
        return APIResponse(
            success=True,
            message="QBR report generated successfully",
            data=report
        )
        
    except Exception as e:
        logger.error(f"Error generating QBR report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate QBR report: {str(e)}"
        )

@router.get("/metrics/real-time")
async def get_real_time_metrics(
    distributor_id: Optional[int] = Query(None),
    vendor_id: Optional[int] = Query(None),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """
    Get real-time metrics for live dashboard updates
    
    Returns:
    - Current period metrics
    - Sentiment trends
    - Pain point summary
    - Action item status
    """
    try:
        from datetime import timedelta
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Generate quick metrics report
        report = await qbr_generator.generate_qbr_report(
            db=db,
            distributor_id=distributor_id,
            vendor_id=vendor_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Extract key metrics for real-time display
        real_time_data = {
            "period": f"Last {days} days",
            "total_calls": report['call_metrics']['total_calls'],
            "avg_sentiment": report['call_metrics']['avg_sentiment'],
            "sentiment_trend": report['sentiment_analysis']['trend_data'][-5:],  # Last 5 data points
            "pain_points": {
                "total": report['pain_point_analysis']['total_pain_points'],
                "by_category": report['pain_point_analysis']['by_category'],
                "top_issues": report['pain_point_analysis']['top_pain_points'][:5]
            },
            "action_items": {
                "total": report['action_items_summary']['total'],
                "completed": report['action_items_summary']['completed'],
                "pending": report['action_items_summary']['pending'],
                "overdue": report['action_items_summary']['overdue'],
                "completion_rate": report['action_items_summary']['completion_rate']
            },
            "recommendations": report['recommendations'][:3],  # Top 3 recommendations
            "last_updated": datetime.utcnow().isoformat()
        }
        
        return APIResponse(
            success=True,
            message="Real-time metrics retrieved successfully",
            data=real_time_data
        )
        
    except Exception as e:
        logger.error(f"Error getting real-time metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get real-time metrics: {str(e)}"
        )

@router.get("/sentiment-timeline")
async def get_sentiment_timeline(
    distributor_id: Optional[int] = Query(None),
    vendor_id: Optional[int] = Query(None),
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db)
):
    """
    Get detailed sentiment timeline for visualization
    
    Returns sentiment data points over time for charting
    """
    try:
        from datetime import timedelta
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Generate report focusing on sentiment
        report = await qbr_generator.generate_qbr_report(
            db=db,
            distributor_id=distributor_id,
            vendor_id=vendor_id,
            start_date=start_date,
            end_date=end_date
        )
        
        timeline_data = {
            "timeline": report['sentiment_analysis']['trend_data'],
            "overall_average": report['sentiment_analysis']['overall_average'],
            "distribution": report['sentiment_analysis']['sentiment_distribution'],
            "total_segments": report['sentiment_analysis']['total_segments_analyzed'],
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "days": days
            }
        }
        
        return APIResponse(
            success=True,
            message="Sentiment timeline retrieved successfully",
            data=timeline_data
        )
        
    except Exception as e:
        logger.error(f"Error getting sentiment timeline: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get sentiment timeline: {str(e)}"
        )
