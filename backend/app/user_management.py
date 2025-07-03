from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app import models, database, auth, constants
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from app.utils import get_password_hash, log_audit
from app.constants import PENDING, APPROVED, DENIED, AGENT
from uuid import UUID

router = APIRouter(
    dependencies=[Depends(auth.get_current_user)]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserOut(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    phone: Optional[str]
    user_type_id: Optional[UUID]
    user_type: Optional[str] = None  # For display
    is_affiliate: Optional[bool] = None
    balance: Optional[float] = None
    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    user_type_id: UUID

class UserUpdate(BaseModel):
    username: Optional[str]
    email: Optional[EmailStr]
    password: Optional[str]
    phone: Optional[str]
    is_affiliate: Optional[bool] = None

class AdminUserUpdate(BaseModel):
    username: Optional[str]
    email: Optional[EmailStr]
    phone: Optional[str]
    user_type_id: Optional[UUID]
    is_affiliate: Optional[bool] = None

class WithdrawRewardAdminOut(BaseModel):
    id: UUID
    amount: float
    status: str
    submit_datetime: datetime
    review_datetime: Optional[datetime] = None
    invoice_pdf: Optional[str] = None
    agent_id: UUID
    agent_username: str

    class Config:
        orm_mode = True

class ApproveWithdrawalRequest(BaseModel):
    is_approved: bool
    invoice_pdf: Optional[str] = None

class SetAffiliateStatusRequest(BaseModel):
    is_affiliate: bool


@router.get("/", response_model=List[UserOut])
def list_users(
    skip: int = 0,
    limit: int = 10,
    username: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    user_type_id: Optional[UUID] = Query(None),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.User)
    if username:
        query = query.filter(models.User.username.ilike(f"%{username}%"))
    if email:
        query = query.filter(models.User.email.ilike(f"%{email}%"))
    if user_type_id:
        query = query.filter(models.User.user_type_id == user_type_id)
    
    users = query.options(
        joinedload(models.User.user_type),
        joinedload(models.User.agent_balance)
    ).offset(skip).limit(limit).all()
    
    result = [UserOut(
        id=u.id,
        username=u.username,
        email=u.email,
        phone=u.phone,
        user_type_id=u.user_type_id,
        user_type=u.user_type.type if u.user_type else None,
        is_affiliate=u.is_affiliate,
        balance=u.agent_balance.balance if u.agent_balance else None
    ) for u in users]
    return result

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.user_type_id != constants.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create users.")

    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        phone=user.phone,
        user_type_id=user.user_type_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    log_audit(db, user_id=current_user.id, action=constants.actionTypes['create'], target_type=constants.targetTypes['user'], target_id=db_user.id)
    user_type_str = None
    if db_user.user_type_id:
        ut = db.query(models.UserType).filter(models.UserType.id == db_user.user_type_id).first()
        if ut:
            user_type_str = ut.type
    return UserOut(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        phone=db_user.phone,
        user_type_id=db_user.user_type_id,
        user_type=user_type_str,
        is_affiliate=db_user.is_affiliate,
        balance=db_user.agent_balance.balance if db_user.agent_balance else None
    )

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: UUID, user_update_data: UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if current_user.id != user_id and current_user.user_type_id != constants.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    update_data = user_update_data.dict(exclude_unset=True)

    if 'password' in update_data:
        update_data['hashed_password'] = get_password_hash(update_data.pop('password'))

    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    log_audit(db, user_id=current_user.id, action=constants.actionTypes['update'], target_type=constants.targetTypes['user'], target_id=user_id)
    
    user_type_str = db.query(models.UserType.type).filter(models.UserType.id == db_user.user_type_id).scalar()
    return UserOut(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        phone=db_user.phone,
        user_type_id=db_user.user_type_id,
        user_type=user_type_str,
        is_affiliate=db_user.is_affiliate,
        balance=db_user.agent_balance.balance if db_user.agent_balance else None
    )

@router.put("/admin/{user_id}", response_model=UserOut)
def update_user_admin(user_id: UUID, user_update_data: AdminUserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.user_type_id != constants.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can perform this action.")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update_data.dict(exclude_unset=True)

    if 'is_affiliate' in update_data and update_data['is_affiliate'] is not None and db_user.user_type_id != constants.AGENT:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only agents can have affiliate status.")

    if 'password' in update_data:
        update_data['hashed_password'] = get_password_hash(update_data.pop('password'))

    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    log_audit(db, user_id=current_user.id, action=constants.actionTypes['update'], target_type=constants.targetTypes['user'], target_id=user_id)
    
    user_type_str = db.query(models.UserType.type).filter(models.UserType.id == db_user.user_type_id).scalar()
    return UserOut(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        phone=db_user.phone,
        user_type_id=db_user.user_type_id,
        user_type=user_type_str,
        is_affiliate=db_user.is_affiliate,
        balance=db_user.agent_balance.balance if db_user.agent_balance else None
    )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: UUID, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.user_type_id != constants.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete users.")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    log_audit(db, user_id=current_user.id, action=constants.actionTypes['delete'], target_type=constants.targetTypes['user'], target_id=user_id)
    return {"detail": "User deleted"}

@router.put("/{user_id}/affiliate-status")
def set_affiliate_status(user_id: UUID, request: SetAffiliateStatusRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.user_type_id != constants.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    
    user_to_update = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    if user_to_update.user_type_id != AGENT:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only agents can have affiliate status.")

    user_to_update.is_affiliate = request.is_affiliate
    db.commit()
    db.refresh(user_to_update)
    log_audit(db, user_id=current_user.id, action=constants.actionTypes['set_affiliate'], target_type=constants.targetTypes['user'], target_id=user_id)
    
    return {"message": f"User {user_to_update.username}'s affiliate status set to {request.is_affiliate}"}

@router.put("/withdrawals/{request_id}/approve")
def approve_withdrawal(request_id: UUID, request: ApproveWithdrawalRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.user_type_id != constants.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform this action")

    withdrawal = db.query(models.WithdrawReward).filter(models.WithdrawReward.id == request_id).first()
    if not withdrawal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Withdrawal request not found")

    if withdrawal.status != PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Withdrawal has already been processed with status: {withdrawal.status}")

    withdrawal.review_datetime = datetime.utcnow()
    
    if request.is_approved:
        if not request.invoice_pdf:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invoice PDF URL is required for approval.")
        
        withdrawal.status = APPROVED
        withdrawal.invoice_pdf = request.invoice_pdf
        
        agent_balance = db.query(models.AgentBalance).filter(models.AgentBalance.agent_id == withdrawal.agent_id).first()
        if agent_balance:
            agent_balance.balance -= withdrawal.amount
    else:
        withdrawal.status = DENIED
        withdrawal.invoice_pdf = None

    db.commit()
    db.refresh(withdrawal)
    log_audit(db, user_id=current_user.id, action=constants.actionTypes['approve'], target_type=constants.targetTypes['withdraw'], target_id=request_id)
    return withdrawal

# Reports API will be implemented in a new file: reports.py 