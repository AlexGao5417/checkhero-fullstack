from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from . import models, database, auth, constants
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.utils import log_audit
from uuid import UUID

router = APIRouter(
    dependencies=[Depends(auth.get_current_user)]
)

# Pydantic Schemas
class AddressOut(BaseModel):
    address_id: UUID
    full_address: str
    class Config:
        orm_mode = True

class AddressAgentCreate(BaseModel):
    agent_id: UUID
    address: str
    address_id: Optional[UUID]


class AddressAgentUpdate(BaseModel):
    address_id: UUID

class AffiliateCreate(BaseModel):
    agent_id: UUID

class AffiliateOut(BaseModel):
    id: UUID
    agent_id: UUID
    class Config:
        orm_mode = True

class WithdrawRewardOut(BaseModel):
    id: UUID
    amount: float
    status: str
    agent_name: str
    submit_datetime: datetime
    review_datetime: Optional[datetime] = None
    invoice_pdf: Optional[str] = None

    class Config:
        orm_mode = True

class AgentRewardOut(BaseModel):
    agent_id: UUID
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

class AgentAddressOut(BaseModel):
    id: UUID
    address_id: UUID
    address: str
    agent_username: str
    last_inspect_time: Optional[datetime] = None
    last_inspect_type_id: Optional[int] = None
    last_report_id: Optional[UUID] = None
    class Config:
        orm_mode = True

class WithdrawRequest(BaseModel):
    amount: float
    invoice_pdf: str

# Helper function to calculate balance
def get_agent_balance(db: Session, agent_id: UUID):
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
    # If no address_id, create the address first
    if not getattr(request, 'address_id', None):
        # Create new address
        new_address = models.Address(address=request.address)
        db.add(new_address)
        db.commit()
        db.refresh(new_address)
        log_audit(db, user_id=current_user.id, action=constants.actionTypes['create'], target_type=constants.targetTypes['address'], target_id=new_address.id)
        # Now create AddressAgent link
        new_address_agent = models.AddressAgent(address_id=new_address.id, agent_id=request.agent_id, active=True)
        db.add(new_address_agent)
        db.commit()
        db.refresh(new_address_agent)
        log_audit(db, user_id=current_user.id, action=constants.actionTypes['assign_address'], target_type=constants.targetTypes['address_agent'], target_id=new_address_agent.id)
        return new_address_agent

    # Check if agent and address exist
    agent = db.query(models.User).filter(models.User.id == request.agent_id).first()
    if not agent or agent.user_type_id != constants.AGENT: # Agent user_type_id is 2
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    address = db.query(models.Address).filter(models.Address.id == request.address_id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    # Check if association already exists for this address
    existing_link = db.query(models.AddressAgent).filter_by(address_id=request.address_id).first()
    if existing_link:
        if existing_link.agent_id == request.agent_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This address is already assigned to the agent")
        else:
            other_agent = db.query(models.User).filter(models.User.id == existing_link.agent_id).first()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={
                "message": "This address is already assigned to another agent, please remove the existing association first",
                "agent_id": str(other_agent.id) if other_agent else None,
                "agent_username": other_agent.username if other_agent else None
            })

    new_address_agent = models.AddressAgent(**request.dict())
    db.add(new_address_agent)
    db.commit()
    db.refresh(new_address_agent)
    log_audit(db, user_id=current_user.id, action=constants.actionTypes['assign_address'], target_type=constants.targetTypes['address_agent'], target_id=new_address_agent.id)
    return new_address_agent

@router.delete("/address/{address_agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent_address(address_agent_id: UUID, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    link = db.query(models.AddressAgent).filter(models.AddressAgent.id == address_agent_id, models.AddressAgent.active == True).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address-agent link not found")
    link.active = False
    db.commit()
    log_audit(db, user_id=current_user.id, action=constants.actionTypes['remove_address'], target_type=constants.targetTypes['address_agent'], target_id=address_agent_id)
    return

@router.put("/address/{address_agent_id}")
def edit_agent_address(address_agent_id: UUID, request: AddressAgentUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
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
    log_audit(db, user_id=current_user.id, action=constants.actionTypes['edit_address'], target_type=constants.targetTypes['address_agent'], target_id=address_agent_id)
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
    if current_user.user_type_id == constants.AGENT:
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
def request_withdrawal(request: WithdrawRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.user_type_id != constants.AGENT:
        raise HTTPException(status_code=403, detail="User is not an agent")

    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")

    balance_record = db.query(models.AgentBalance).filter(models.AgentBalance.agent_id == current_user.id).first()
    current_balance = balance_record.balance if balance_record else 0
    
    if request.amount > current_balance:
        raise HTTPException(status_code=400, detail=f"Withdrawal amount exceeds current balance of {current_balance}")

    new_withdrawal = models.WithdrawReward(
        agent_id=current_user.id,
        amount=request.amount,
        status=constants.PENDING,
        submit_datetime=datetime.utcnow(),
        invoice_pdf=request.invoice_pdf
    )
    db.add(new_withdrawal)
    db.commit()
    db.refresh(new_withdrawal)
    log_audit(db, user_id=current_user.id, action=constants.actionTypes['withdraw'], target_type=constants.targetTypes['withdraw'], target_id=new_withdrawal.id)
    return new_withdrawal

@router.get("/status", response_model=AgentStatusOut)
def get_agent_status(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.user_type_id != constants.AGENT:
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

@router.get("/{agent_id}/addresses", response_model=List[AgentAddressOut])
def get_agent_addresses(agent_id: UUID, db: Session = Depends(database.get_db)):
    # Get agent
    agent = db.query(models.User).filter(models.User.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    # Get all address-agent links for this agent, eager load address and agent, only active
    links = db.query(models.AddressAgent).options(
        joinedload(models.AddressAgent.address),
        joinedload(models.AddressAgent.agent)
    ).filter(models.AddressAgent.agent_id == agent_id, models.AddressAgent.active == True).all()
    address_ids = [link.address_id for link in links]
    if not address_ids:
        return []
    # Get address reports for these addresses
    address_reports = db.query(models.AddressReport).filter(models.AddressReport.address_id.in_(address_ids)).all()
    report_map = {ar.address_id: ar for ar in address_reports}
    # Get report type names
    report_type_ids = [ar.last_inspect_type_id for ar in address_reports if ar.last_inspect_type_id]
    report_types = db.query(models.ReportType).filter(models.ReportType.id.in_(report_type_ids)).all()
    report_type_map = {rt.id: rt.type for rt in report_types}
    # Build result
    result = []
    for link in links:
        addr = link.address
        ar = report_map.get(link.address_id)
        result.append(AgentAddressOut(
            id=link.id,
            address_id=addr.id,
            address=addr.address,
            agent_username=agent.username,
            last_inspect_time=ar.last_inspect_time if ar else None,
            last_inspect_type_id=report_type_map.get(ar.last_inspect_type_id) if ar and ar.last_inspect_type_id else None,
            last_report_id=ar.last_report_id if ar else None
        ))
    return result
