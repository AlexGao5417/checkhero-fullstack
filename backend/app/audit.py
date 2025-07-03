from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app import models, database, auth, constants
from typing import List, Optional
from datetime import datetime
from uuid import UUID

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditLogOut:
    def __init__(self, id: UUID, user_id: UUID, username, action, target_type, target_id: UUID, timestamp):
        self.id = id
        self.user_id = user_id
        self.username = username
        self.action = action
        self.target_type = target_type
        self.target_id = target_id
        self.timestamp = timestamp

@router.get("/", response_model=List[dict])
def list_audit_logs(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
    user_id: Optional[UUID] = Query(None),
    action: Optional[str] = Query(None),
    target_type: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50
):
    if current_user.user_type_id != constants.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can view audit logs.")
    query = db.query(models.AuditLog).options(joinedload(models.AuditLog.user))
    if user_id:
        query = query.filter(models.AuditLog.user_id == user_id)
    if action:
        query = query.filter(models.AuditLog.action == action)
    if target_type:
        query = query.filter(models.AuditLog.target_type == target_type)
    logs = query.order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "username": log.user.username if log.user else None,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "timestamp": log.timestamp
        }
        for log in logs
    ] 