from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from . import models, database, auth, constants
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.constants import AGENT, DRAFT, PENDING, DENIED, APPROVED

router = APIRouter(
    dependencies=[Depends(auth.get_current_user)]
)

# Pydantic Schemas
class AddressOut(BaseModel):
    address_id: int
    full_address: str
    class Config:
        orm_mode = True

class AddressAgentCreate(BaseModel):
    address_id: int
    agent_id: int

class AddressAgentUpdate(BaseModel):
    address_id: int

class AffiliateCreate(BaseModel):
    agent_id: int

class AffiliateOut(BaseModel):
    id: int
    agent_id: int
    class Config:
        orm_mode = True

class WithdrawRewardOut(BaseModel):
    id: int
    amount: float
    status: str
    agent_name: str
    submit_datetime: datetime
    review_datetime: Optional[datetime] = None
    invoice_pdf: Optional[str] = None

    class Config:
        orm_mode = True

class AgentRewardOut(BaseModel):
    agent_id: int
    agent_name: str
    balance: float
    class Config:
        orm_mode = True

class AgentStatusOut(BaseModel):
    is_affiliate: bool
    balance: float
    approved_withdraw: float
    pending_withdrawal: float
    class Config:
        orm_mode = True

# Helper function to calculate balance
def get_agent_balance(db: Session, agent_id: int):
    total_rewards = db.query(func.sum(models.Report.reward)) \
        .filter(models.Report.agent_id == agent_id) \
        .scalar() or 0
    
    total_withdrawn = db.query(func.sum(models.WithdrawReward.amount)) \
        .filter(models.WithdrawReward.agent_id == agent_id, models.WithdrawReward.status == 'approved') \
        .scalar() or 0
        
    return float(total_rewards) - float(total_withdrawn)

@router.get("/addresses", response_model=List[AddressOut])
def search_addresses(search: str = Query(None, min_length=2), db: Session = Depends(database.get_db)):
    if not search:
        return []
    
    addresses = db.query(models.Address).filter(models.Address.address.ilike(f"%{search}%")).limit(10).all()
    
    return [
        AddressOut(address_id=addr.id, full_address=addr.address)
        for addr in addresses
    ]

@router.post("/address", status_code=status.HTTP_201_CREATED)
def add_address_to_agent(request: AddressAgentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Check if user is admin or the agent themselves
    if current_user.user_type_id != constants.ADMIN and current_user.id != request.agent_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform this action")

    # Check if agent and address exist
    agent = db.query(models.User).filter(models.User.id == request.agent_id).first()
    if not agent or agent.user_type_id != constants.AGENT: # Agent user_type_id is 2
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    
    address = db.query(models.Address).filter(models.Address.id == request.address_id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
        
    # Check if association already exists
    existing_link = db.query(models.AddressAgent).filter_by(agent_id=request.agent_id, address_id=request.address_id).first()
    if existing_link:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This address is already assigned to the agent")

    new_address_agent = models.AddressAgent(**request.dict())
    db.add(new_address_agent)
    db.commit()
    db.refresh(new_address_agent)
    return new_address_agent

@router.delete("/address/{address_agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent_address(address_agent_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    link = db.query(models.AddressAgent).filter(models.AddressAgent.id == address_agent_id).first()
    
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address-agent link not found")

    # Check if user is admin or the agent themselves
    if current_user.user_type_id != constants.ADMIN and current_user.id != link.agent_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform this action")

    db.delete(link)
    db.commit()
    return

@router.put("/address/{address_agent_id}")
def edit_agent_address(address_agent_id: int, request: AddressAgentUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    link = db.query(models.AddressAgent).filter(models.AddressAgent.id == address_agent_id).first()
    
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address-agent link not found")

    if current_user.user_type_id != constants.ADMIN and current_user.id != link.agent_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform this action")

    address = db.query(models.Address).filter(models.Address.address_id == request.address_id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="New address not found")
        
    link.address_id = request.address_id
    db.commit()
    db.refresh(link)
    return link

@router.get("/withdrawals")
def get_withdrawals(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    agent_name: str = Query(None, min_length=1)
):
    query = db.query(models.WithdrawReward).options(joinedload(models.WithdrawReward.agent))
    if current_user.user_type_id == AGENT:
        query = query.filter(models.WithdrawReward.agent_id == current_user.id)
    elif current_user.user_type_id == constants.ADMIN:
        if agent_name:
            query = query.join(models.User, models.WithdrawReward.agent_id == models.User.id)
            query = query.filter(models.User.username.ilike(f"%{agent_name}%"))
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    total = query.count()
    withdrawals = query.order_by(models.WithdrawReward.submit_datetime.desc()) \
        .offset((page - 1) * page_size).limit(page_size).all()
    results = [WithdrawRewardOut(id=wr.id, amount=wr.amount, status=wr.status, agent_name=wr.agent.username if wr.agent else '', submit_datetime=wr.submit_datetime, review_datetime=wr.review_datetime, invoice_pdf=wr.invoice_pdf) for wr in withdrawals]
    return {"total": total, "results": results}

@router.post("/withdraw")
def request_withdrawal(amount: float = Body(..., gt=0), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.user_type_id != AGENT:
        raise HTTPException(status_code=403, detail="User is not an agent")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")

    balance_record = db.query(models.AgentBalance).filter(models.AgentBalance.agent_id == current_user.id).first()
    current_balance = balance_record.balance if balance_record else 0
    
    if amount > current_balance:
        raise HTTPException(status_code=400, detail=f"Withdrawal amount exceeds current balance of {current_balance}")

    new_withdrawal = models.WithdrawReward(
        agent_id=current_user.id,
        amount=amount,
        status=PENDING,
        submit_datetime=datetime.utcnow()
    )
    db.add(new_withdrawal)
    db.commit()
    db.refresh(new_withdrawal)
    return new_withdrawal

@router.get("/status", response_model=AgentStatusOut)
def get_agent_status(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.user_type_id != AGENT:
        raise HTTPException(status_code=403, detail="User is not an agent")

    if not current_user.is_affiliate:
        return AgentStatusOut(
            is_affiliate=False,
            balance=0.0,
            approved_withdraw=0.0,
            pending_withdrawal=0.0
        )

    balance_record = db.query(models.AgentBalance).filter(models.AgentBalance.agent_id == current_user.id).first()
    balance = float(balance_record.balance) if balance_record else 0.0

    approved_withdraw = db.query(func.sum(models.WithdrawReward.amount)).filter(
        models.WithdrawReward.agent_id == current_user.id,
        models.WithdrawReward.status == 'approved'
    ).scalar() or 0.0

    pending_withdrawal = db.query(func.sum(models.WithdrawReward.amount)).filter(
        models.WithdrawReward.agent_id == current_user.id,
        models.WithdrawReward.status == 'pending'
    ).scalar() or 0.0

    return AgentStatusOut(
        is_affiliate=True,
        balance=balance,
        approved_withdraw=approved_withdraw,
        pending_withdrawal=pending_withdrawal
    )

@router.get("/rewards")
def get_agent_rewards(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    agent_name: str = Query(None, min_length=1)
):
    if current_user.user_type_id != constants.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    query = db.query(models.AgentBalance).options(joinedload(models.AgentBalance.agent))
    if agent_name:
        query = query.join(models.User, models.AgentBalance.agent_id == models.User.id)
        query = query.filter(models.User.username.ilike(f"%{agent_name}%"))
    total = query.count()
    results = query.order_by(models.AgentBalance.agent_id) \
        .offset((page - 1) * page_size).limit(page_size).all()
    rewards = [
        AgentRewardOut(agent_id=ab.agent_id, agent_name=ab.agent.username if ab.agent else '', balance=ab.balance)
        for ab in results
    ]
    return {"total": total, "results": rewards}
