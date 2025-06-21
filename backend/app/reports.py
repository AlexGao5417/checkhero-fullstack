from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.orm import Session, joinedload
from app import models, database, checkhero
import boto3
from botocore.exceptions import NoCredentialsError
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from botocore.client import Config


load_dotenv()

router = APIRouter()

# --- S3 Configuration ---
S3_BUCKET = os.environ.get("S3_BUCKET_NAME")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.environ.get("AWS_REGION")

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
    config=Config(s3={'addressing_style': 'virtual'})
)

def upload_to_s3(file_path, object_name=None):
    if object_name is None:
        object_name = os.path.basename(file_path)
    try:
        s3_client.upload_file(file_path, S3_BUCKET, object_name)
        return f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{object_name}"
    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="AWS credentials not available.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {e}")

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
    reviewer_id: Optional[int]
    form_data: Optional[dict]
    pdf_url: Optional[str]
    class Config:
        orm_mode = True

class ReportCreate(BaseModel):
    form_data: dict
    publisher_id: int
    address: str

class ReportUpdate(BaseModel):
    form_data: Optional[dict] = None
    is_approved: Optional[bool] = None
    reviewer_id: Optional[int] = None
    comment: Optional[str] = None

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
    user_type_id: int = Query(...),
    user_id: int = Query(...),
    db: Session = Depends(database.get_db)
):
    # Try to fetch from DB, fallback to dummy if empty
    reports = []
    if user_type_id == 1:
        reports = db.query(models.Report).options(joinedload(models.Report.publisher)).all()
    elif user_type_id == 3:
        reports = db.query(models.Report).filter(models.Report.publisher_id == user_id).options(joinedload(models.Report.publisher)).all()
    else:
        reports = []
    result = []
    for r in reports:
        form_data = None
        if r.form_data:
            try:
                form_data = json.loads(r.form_data)
            except Exception:
                form_data = "" if not r.form_data else r.form_data
        
        # Pass the date strings directly
        review_date_str = r.review_date.isoformat() if r.review_date else None
        
        result.append(ReportOut(
            id=r.id,
            address=r.address,
            publisher=r.publisher.username if r.publisher else 'N/A',
            publisher_id=r.publisher_id,
            created_date=r.created_date, # Use the string directly
            review_date=review_date_str,
            status=r.status,
            comment=r.comment,
            reviewer=r.reviewer.username if r.reviewer else 'N/A',
            reviewer_id=r.reviewer_id,
            form_data=form_data,
            pdf_url=r.pdf_url
        ))

    return result

@router.get("/presigned-url/")
def get_presigned_url(
    content_type: str = Query(...),
):
    """
    Generates a presigned URL for uploading a file to S3.
    """
    file_key = f"images/{uuid.uuid4()}"
    
    try:
        url = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': S3_BUCKET, 'Key': file_key, 'ContentType': content_type}, # You might want to make ContentType dynamic
            ExpiresIn=3600  # URL expires in 1 hour
        )
        public_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{file_key}"
        return {"upload_url": url, "public_url": public_url}
    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="AWS credentials not available.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {e}")

@router.post("/create")
def create_report(report_data: ReportCreate, db: Session = Depends(database.get_db)):
    temp_filename = f"/tmp/{uuid.uuid4()}.pdf"
    checkhero.generate_report(report_data.form_data, filename=temp_filename)
    
    s3_filename = f"reports/{uuid.uuid4()}.pdf"
    pdf_url = upload_to_s3(temp_filename, s3_filename)

    os.remove(temp_filename)

    new_report = models.Report(
        form_data=report_data.form_data,
        publisher_id=report_data.publisher_id,
        address=report_data.address,
        status="draft",
        pdf_url=pdf_url,
        created_date=datetime.utcnow()
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@router.put("/update/{report_id}")
def update_report(report_id: int, update_data: ReportUpdate, db: Session = Depends(database.get_db)):
    db_report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    if update_data.form_data:
        db_report.form_data = update_data.form_data

    if update_data.is_approved is not None:
        db_report.status = "approved" if update_data.is_approved else "denied"
        db_report.review_date = datetime.utcnow()
        if update_data.comment:
            db_report.comment = update_data.comment
        if update_data.reviewer_id:
            db_report.reviewer_id = update_data.reviewer_id

    db.commit()
    db.refresh(db_report)
    return db_report

@router.delete("/delete/{report_id}")
def delete_report(report_id: int, db: Session = Depends(database.get_db)):
    db_report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db.delete(db_report)
    db.commit()
    return {"detail": "Report deleted successfully"} 