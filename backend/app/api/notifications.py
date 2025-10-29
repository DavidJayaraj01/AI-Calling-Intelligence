"""
Notifications API endpoints
Handle email notifications and notification management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from loguru import logger
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, ActionItem
from app.services.email_service import email_service
from app.schemas import APIResponse

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class EmailNotificationRequest(BaseModel):
    actionItemId: str
    recipientEmail: EmailStr
    type: str  # 'overdue_reminder', 'due_reminder', 'assignment'
    subject: Optional[str] = None
    message: Optional[str] = None


class EmailNotificationResponse(BaseModel):
    message: str
    emailId: str


@router.post("/email", response_model=APIResponse)
async def send_email_notification(
    request: EmailNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send email notification for action items
    """
    try:
        # Get the action item
        action_item = db.query(ActionItem).filter(
            ActionItem.action_id == request.actionItemId
        ).first()
        
        if not action_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Action item not found"
            )
        
        # Prepare action item data
        action_item_data = {
            'title': action_item.description,  # Using description as title
            'description': action_item.description,
            'due_date': action_item.due_date.isoformat() if action_item.due_date else None,
            'priority': 'medium',  # Default priority
            'status': action_item.status
        }
        
        # Calculate days overdue or remaining
        now = datetime.now()
        if action_item.due_date:
            time_diff = action_item.due_date - now
            days_diff = time_diff.days
            
            if days_diff < 0:
                # Overdue
                days_overdue = abs(days_diff)
                result = await email_service.send_overdue_action_item_notification(
                    action_item_data,
                    request.recipientEmail,
                    days_overdue
                )
            else:
                # Due soon
                result = await email_service.send_due_reminder_notification(
                    action_item_data,
                    request.recipientEmail,
                    days_diff
                )
        else:
            # No due date, send general notification
            subject = request.subject or f"Action Item: {action_item.description}"
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Action Item Notification</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #007bff; color: white; padding: 20px; text-align: center; }}
                    .content {{ background-color: #f8f9fa; padding: 20px; }}
                    .action-item {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; }}
                    .footer {{ background-color: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📋 Action Item Notification</h1>
                    </div>
                    
                    <div class="content">
                        <p>Hello,</p>
                        
                        <p>You have a new action item that requires your attention.</p>
                        
                        <div class="action-item">
                            <h3>Action Item Details</h3>
                            <p><strong>Task:</strong> {action_item.description}</p>
                            <p><strong>Status:</strong> {action_item.status}</p>
                        </div>
                        
                        <p>Please review and complete this task as needed.</p>
                        
                        <p>Best regards,<br>
                        AI Call Intelligence Platform</p>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated notification. Please do not reply to this email.</p>
                        <p>© 2024 AI Call Intelligence Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            result = await email_service.send_email(
                request.recipientEmail,
                subject,
                html_content
            )
        
        if result['success']:
            logger.info(f"Email notification sent successfully to {request.recipientEmail}")
            return {
                "success": True,
                "message": "Email notification sent successfully",
                "data": {
                    "message": result['message'],
                    "emailId": result['email_id']
                }
            }
        else:
            logger.error(f"Failed to send email notification: {result['message']}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send email: {result['message']}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending email notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while sending email notification"
        )


@router.get("/email")
async def get_email_notifications(
    page: int = 1,
    limit: int = 20,
    type: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get email notification history (mock implementation)
    """
    try:
        # This is a mock implementation since we don't have email history storage yet
        # In a real implementation, you would store email notifications in a database
        
        mock_notifications = [
            {
                "id": f"email_{i}",
                "recipientEmail": current_user.email,
                "subject": f"Test Email {i}",
                "type": "overdue_reminder" if i % 2 == 0 else "due_reminder",
                "status": "sent",
                "sentAt": (datetime.now() - timedelta(days=i)).isoformat(),
                "actionItemId": f"action_{i}"
            }
            for i in range(1, 6)
        ]
        
        # Apply filters
        filtered_notifications = mock_notifications
        if type:
            filtered_notifications = [n for n in filtered_notifications if n["type"] == type]
        if status:
            filtered_notifications = [n for n in filtered_notifications if n["status"] == status]
        
        # Apply pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_notifications = filtered_notifications[start_idx:end_idx]
        
        return {
            "data": paginated_notifications,
            "total": len(filtered_notifications),
            "page": page,
            "limit": limit,
            "hasNext": end_idx < len(filtered_notifications),
            "hasPrev": page > 1
        }
        
    except Exception as e:
        logger.error(f"Error getting email notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while getting email notifications"
        )


@router.post("/check-overdue")
async def check_overdue_action_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check for overdue action items and send notifications
    """
    try:
        now = datetime.now()
        
        # Find overdue action items
        overdue_items = db.query(ActionItem).filter(
            ActionItem.due_date < now,
            ActionItem.status.in_(['pending', 'in_progress'])
        ).all()
        
        notifications_sent = 0
        
        for item in overdue_items:
            # Calculate days overdue
            days_overdue = (now - item.due_date).days
            
            # Prepare action item data
            action_item_data = {
                'title': item.description,
                'description': item.description,
                'due_date': item.due_date.isoformat(),
                'priority': 'high',
                'status': item.status
            }
            
            # Send email notification (mock email for now)
            result = await email_service.send_overdue_action_item_notification(
                action_item_data,
                current_user.email,  # In real implementation, get assignee email
                days_overdue
            )
            
            if result['success']:
                notifications_sent += 1
                logger.info(f"Overdue notification sent for action item {item.action_id}")
        
        return {
            "success": True,
            "message": f"Checked {len(overdue_items)} overdue items, sent {notifications_sent} notifications",
            "data": {
                "overdue_count": len(overdue_items),
                "notifications_sent": notifications_sent
            }
        }
        
    except Exception as e:
        logger.error(f"Error checking overdue action items: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while checking overdue items"
        )
