from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app import models, database
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()

class ReportOut(BaseModel):
    id: int
    address: str
    publisher: str
    publisher_id: int
    created_date: str
    review_date: Optional[str]
    status: str
    comment: Optional[str]
    reviewer: Optional[str]
    form_data: Optional[dict]
    class Config:
        orm_mode = True

def get_dummy_reports(user_type, user_id):
    dummy = [
        models.Report(
            id=1,
            address='123 Main St',
            publisher='Alice',
            publisher_id=101,
            created_date='2024-06-01',
            review_date='2024-06-10',
            status='draft',
            comment='Needs more info',
            reviewer='Bob',
            form_data=json.dumps({"electricalSafetyCheck": True})
        ),
        models.Report(
            id=2,
            address='456 Oak Ave',
            publisher='Charlie',
            publisher_id=102,
            created_date='2024-06-02',
            review_date='2024-06-11',
            status='approved',
            comment='All good',
            reviewer='Dana',
            form_data=json.dumps({"electricalSafetyCheck": False})
        ),
    ]
    if user_type == 'admin':
        return dummy
    elif user_type == 'electrician':
        return [r for r in dummy if r.publisher_id == user_id]
    return []

@router.get("/", response_model=List[ReportOut])
def get_reports(
    user_type: str = Query(...),
    user_id: int = Query(...),
    db: Session = Depends(database.get_db)
):
    # Try to fetch from DB, fallback to dummy if empty
    reports = db.query(models.Report).all()
    if not reports:
        reports = get_dummy_reports(user_type, user_id)
    result = []
    for r in reports:
        form_data = None
        if r.form_data:
            try:
                form_data = json.loads(r.form_data)
            except Exception:
                form_data = None
        result.append(ReportOut(
            id=r.id,
            address=r.address,
            publisher=r.publisher,
            publisher_id=r.publisher_id,
            created_date=r.created_date,
            review_date=r.review_date,
            status=r.status,
            comment=r.comment,
            reviewer=r.reviewer,
            form_data=form_data
        ))
    if user_type == 'admin':
        return result
    elif user_type == 'electrician':
        return [r for r in result if r.publisher_id == user_id]
    return [] 