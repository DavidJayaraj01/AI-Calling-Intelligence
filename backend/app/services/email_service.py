"""
Email Notification Service
Handles sending email notifications for overdue action items and other alerts
"""

import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from datetime import datetime
from loguru import logger
from app.core.config import settings


class EmailService:
    def __init__(self):
        self.smtp_server = getattr(settings, 'SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_username = getattr(settings, 'SMTP_USERNAME', '')
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        self.from_email = getattr(settings, 'FROM_EMAIL', 'noreply@aicallintelligence.com')
        self.from_name = getattr(settings, 'FROM_NAME', 'AI Call Intelligence Platform')

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send an email notification
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text email content (optional)
            
        Returns:
            Dict with success status and message
        """
        try:
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured, using mock email service")
                return await self._mock_send_email(to_email, subject, html_content)
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Add text content if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return {
                'success': True,
                'message': 'Email sent successfully',
                'email_id': f"email_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            }
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return {
                'success': False,
                'message': f'Failed to send email: {str(e)}',
                'error': str(e)
            }

    async def _mock_send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str
    ) -> Dict[str, Any]:
        """
        Mock email service for development/testing
        """
        logger.info(f"Mock email sent to {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Content preview: {html_content[:200]}...")
        
        return {
            'success': True,
            'message': 'Mock email sent successfully (SMTP not configured)',
            'email_id': f"mock_email_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }

    async def send_overdue_action_item_notification(
        self,
        action_item: Dict[str, Any],
        assignee_email: str,
        days_overdue: int
    ) -> Dict[str, Any]:
        """
        Send notification for overdue action item
        
        Args:
            action_item: Action item data
            assignee_email: Assignee's email address
            days_overdue: Number of days overdue
            
        Returns:
            Dict with success status and message
        """
        subject = f"URGENT: Overdue Action Item - {action_item.get('title', 'Unknown Task')}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Overdue Action Item</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #dc3545; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f8f9fa; padding: 20px; }}
                .action-item {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc3545; }}
                .footer {{ background-color: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px; }}
                .urgent {{ color: #dc3545; font-weight: bold; }}
                .button {{ display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ URGENT: Overdue Action Item</h1>
                </div>
                
                <div class="content">
                    <p>Hello,</p>
                    
                    <p>This is an urgent notification regarding an overdue action item that requires your immediate attention.</p>
                    
                    <div class="action-item">
                        <h3>Action Item Details</h3>
                        <p><strong>Task:</strong> {action_item.get('title', 'Unknown Task')}</p>
                        <p><strong>Description:</strong> {action_item.get('description', 'No description available')}</p>
                        <p><strong>Due Date:</strong> {action_item.get('due_date', 'Unknown')}</p>
                        <p><strong>Priority:</strong> <span class="urgent">{action_item.get('priority', 'Unknown')}</span></p>
                        <p><strong>Days Overdue:</strong> <span class="urgent">{days_overdue} day{'s' if days_overdue != 1 else ''}</span></p>
                        <p><strong>Status:</strong> {action_item.get('status', 'Unknown')}</p>
                    </div>
                    
                    <p><strong>Action Required:</strong> Please complete this task as soon as possible to avoid further delays.</p>
                    
                    <p>If you have any questions or need assistance, please contact your manager or the project team.</p>
                    
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
        
        text_content = f"""
        URGENT: Overdue Action Item - {action_item.get('title', 'Unknown Task')}
        
        This action item is {days_overdue} day{'s' if days_overdue != 1 else ''} overdue and requires immediate attention.
        
        Task: {action_item.get('title', 'Unknown Task')}
        Description: {action_item.get('description', 'No description available')}
        Due Date: {action_item.get('due_date', 'Unknown')}
        Priority: {action_item.get('priority', 'Unknown')}
        Status: {action_item.get('status', 'Unknown')}
        
        Please complete this task as soon as possible.
        
        Best regards,
        AI Call Intelligence Platform
        """
        
        return await self.send_email(assignee_email, subject, html_content, text_content)

    async def send_due_reminder_notification(
        self,
        action_item: Dict[str, Any],
        assignee_email: str,
        days_remaining: int
    ) -> Dict[str, Any]:
        """
        Send reminder for action item due soon
        
        Args:
            action_item: Action item data
            assignee_email: Assignee's email address
            days_remaining: Number of days remaining
            
        Returns:
            Dict with success status and message
        """
        subject = f"Reminder: Action Item Due in {days_remaining} Day{'s' if days_remaining != 1 else ''}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Action Item Reminder</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #ffc107; color: #212529; padding: 20px; text-align: center; }}
                .content {{ background-color: #f8f9fa; padding: 20px; }}
                .action-item {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; }}
                .footer {{ background-color: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px; }}
                .warning {{ color: #856404; font-weight: bold; }}
                .button {{ display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Action Item Reminder</h1>
                </div>
                
                <div class="content">
                    <p>Hello,</p>
                    
                    <p>This is a friendly reminder about an action item that is due soon.</p>
                    
                    <div class="action-item">
                        <h3>Action Item Details</h3>
                        <p><strong>Task:</strong> {action_item.get('title', 'Unknown Task')}</p>
                        <p><strong>Description:</strong> {action_item.get('description', 'No description available')}</p>
                        <p><strong>Due Date:</strong> {action_item.get('due_date', 'Unknown')}</p>
                        <p><strong>Priority:</strong> {action_item.get('priority', 'Unknown')}</p>
                        <p><strong>Days Remaining:</strong> <span class="warning">{days_remaining} day{'s' if days_remaining != 1 else ''}</span></p>
                        <p><strong>Status:</strong> {action_item.get('status', 'Unknown')}</p>
                    </div>
                    
                    <p>Please ensure this task is completed before the due date.</p>
                    
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
        
        return await self.send_email(assignee_email, subject, html_content)


# Global email service instance
email_service = EmailService()
