"""
Action Items API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime
from loguru import logger

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, ActionItem, Call
from app.schemas import (
    ActionItemCreate, ActionItemUpdate, ActionItemResponse,
    PaginationParams, PaginatedResponse, ActionItemFilters, APIResponse
)

router = APIRouter()

@router.post("/", response_model=ActionItemResponse)
async def create_action_item(
    action_item_data: ActionItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new action item"""
    try:
        # Verify call exists
        call = db.query(Call).filter(Call.id == action_item_data.call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        
        # Verify assignee exists
        assignee = db.query(User).filter(User.id == action_item_data.assignee_id).first()
        if not assignee:
            raise HTTPException(status_code=404, detail="Assignee not found")
        
        # Create action item
        action_item = ActionItem(
            call_id=action_item_data.call_id,
            title=action_item_data.title,
            description=action_item_data.description,
            assignee_id=action_item_data.assignee_id,
            priority=action_item_data.priority,
            status=action_item_data.status,
            category=action_item_data.category,
            due_date=action_item_data.due_date,
            notes=action_item_data.notes
        )
        
        db.add(action_item)
        db.commit()
        db.refresh(action_item)
        
        logger.info(f"Created action item: {action_item.id}")
        return action_item
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating action item: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create action item")

@router.get("/", response_model=PaginatedResponse)
async def get_action_items(
    pagination: PaginationParams = Depends(),
    filters: ActionItemFilters = Depends(),
    db: Session = Depends(get_db)
):
    """Get paginated list of action items with filters"""
    try:
        query = db.query(ActionItem)
        
        # Apply filters
        if filters.assignee_id:
            query = query.filter(ActionItem.assignee_id == filters.assignee_id)
        if filters.status:
            query = query.filter(ActionItem.status == filters.status)
        if filters.priority:
            query = query.filter(ActionItem.priority == filters.priority)
        if filters.category:
            query = query.filter(ActionItem.category == filters.category)
        if filters.overdue:
            query = query.filter(
                ActionItem.due_date < datetime.utcnow(),
                ActionItem.status.notin_(['completed', 'cancelled'])
            )
        
        # Filter by user permissions
        if current_user.role == 'distributor_user':
            # Show items related to user's distributor calls
            query = query.join(Call).filter(Call.distributor_id == current_user.distributor_id)
        elif current_user.role == 'vendor_user':
            # Show items related to user's vendor calls or assigned to user
            query = query.filter(
                (ActionItem.assignee_id == current_user.id) |
                (ActionItem.call.has(Call.vendor_id == current_user.vendor_id))
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (pagination.page - 1) * pagination.limit
        action_items = query.offset(offset).limit(pagination.limit).all()
        
        return PaginatedResponse(
            items=[ActionItemResponse.from_orm(item) for item in action_items],
            total=total,
            page=pagination.page,
            limit=pagination.limit,
            has_next=offset + pagination.limit < total,
            has_prev=pagination.page > 1
        )
        
    except Exception as e:
        logger.error(f"Error getting action items: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve action items")

@router.get("/{action_item_id}", response_model=ActionItemResponse)
async def get_action_item(
    action_item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get action item by ID"""
    try:
        action_item = db.query(ActionItem).filter(ActionItem.id == action_item_id).first()
        if not action_item:
            raise HTTPException(status_code=404, detail="Action item not found")
        
        # Check permissions
        if (current_user.role not in ['admin', 'distributor_admin', 'vendor_admin'] and
            action_item.assignee_id != current_user.id):
            # Additional permission check for related call
            call = db.query(Call).filter(Call.id == action_item.call_id).first()
            if (current_user.distributor_id != call.distributor_id and
                current_user.vendor_id != call.vendor_id):
                raise HTTPException(status_code=403, detail="Not authorized to view this action item")
        
        return action_item
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting action item: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve action item")

@router.put("/{action_item_id}", response_model=ActionItemResponse)
async def update_action_item(
    action_item_id: uuid.UUID,
    update_data: ActionItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update action item"""
    try:
        action_item = db.query(ActionItem).filter(ActionItem.id == action_item_id).first()
        if not action_item:
            raise HTTPException(status_code=404, detail="Action item not found")
        
        # Check permissions
        if (current_user.role not in ['admin', 'distributor_admin', 'vendor_admin'] and
            action_item.assignee_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to update this action item")
        
        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(action_item, field, value)
        
        # Set completed_at if status changed to completed
        if update_data.status == 'completed' and not action_item.completed_at:
            action_item.completed_at = datetime.utcnow()
        elif update_data.status != 'completed' and action_item.completed_at:
            action_item.completed_at = None
        
        db.commit()
        db.refresh(action_item)
        
        logger.info(f"Updated action item: {action_item_id}")
        return action_item
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating action item: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update action item")

@router.delete("/{action_item_id}")
async def delete_action_item(
    action_item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete action item"""
    try:
        action_item = db.query(ActionItem).filter(ActionItem.id == action_item_id).first()
        if not action_item:
            raise HTTPException(status_code=404, detail="Action item not found")
        
        # Check permissions (only admins and assignee)
        if (current_user.role not in ['admin', 'distributor_admin', 'vendor_admin'] and
            action_item.assignee_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this action item")
        
        db.delete(action_item)
        db.commit()
        
        logger.info(f"Deleted action item: {action_item_id}")
        return {"message": "Action item deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting action item: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete action item")

@router.get("/assignee/{user_id}", response_model=List[ActionItemResponse])
async def get_action_items_by_assignee(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get action items assigned to a specific user"""
    try:
        # Check permissions
        if (current_user.role not in ['admin', 'distributor_admin', 'vendor_admin'] and
            current_user.id != user_id):
            raise HTTPException(status_code=403, detail="Not authorized to view these action items")
        
        action_items = db.query(ActionItem).filter(ActionItem.assignee_id == user_id).all()
        return [ActionItemResponse.from_orm(item) for item in action_items]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting action items by assignee: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve action items")

@router.get("/call/{call_id}", response_model=List[ActionItemResponse])
async def get_action_items_by_call(
    call_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get action items for a specific call"""
    try:
        # Verify call exists and user has access
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        
        # Check permissions
        if (current_user.role not in ['admin', 'distributor_admin', 'vendor_admin'] and
            current_user.distributor_id != call.distributor_id and
            current_user.vendor_id != call.vendor_id):
            raise HTTPException(status_code=403, detail="Not authorized to view these action items")
        
        action_items = db.query(ActionItem).filter(ActionItem.call_id == call_id).all()
        return [ActionItemResponse.from_orm(item) for item in action_items]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting action items by call: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve action items")

@router.post("/{action_item_id}/complete", response_model=ActionItemResponse)
async def complete_action_item(
    action_item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark action item as completed"""
    try:
        action_item = db.query(ActionItem).filter(ActionItem.id == action_item_id).first()
        if not action_item:
            raise HTTPException(status_code=404, detail="Action item not found")
        
        # Check permissions
        if (current_user.role not in ['admin', 'distributor_admin', 'vendor_admin'] and
            action_item.assignee_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to complete this action item")
        
        action_item.status = 'completed'
        action_item.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(action_item)
        
        logger.info(f"Completed action item: {action_item_id}")
        return action_item
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing action item: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to complete action item")
