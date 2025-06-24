from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.orm import Session, joinedload
from app import models, database, checkhero, auth
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
from app import constants


load_dotenv()

router = APIRouter(
    dependencies=[Depends(auth.get_current_user)]
)

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
    report_type_id: int
    created_date: str
    review_date: Optional[str]
    status: str
    comment: Optional[str]
    reviewer: Optional[str]
    reviewer_id: Optional[int]
    form_data: Optional[dict]
    pdf_url: Optional[str]
    reward: Optional[float] = None
    agent_id: Optional[int] = None
    agent_is_affiliate: Optional[bool] = None
    class Config:
        orm_mode = True

class ReportCreate(BaseModel):
    form_data: dict
    address: str
    report_type_id: int

class ReportUpdate(BaseModel):
    form_data: Optional[dict] = None
    comment: Optional[str] = None

class ApproveReportRequest(BaseModel):
    comment: Optional[str]
    reward: Optional[float]

@router.get("/", response_model=List[ReportOut])
def get_reports(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    reports = []
    if current_user.user_type_id == 1:  # Admin
        reports = db.query(models.Report).options(joinedload(models.Report.publisher), joinedload(models.Report.reviewer)).all()
    elif current_user.user_type_id == 3:  # Agent
        # An agent sees reports they published
        reports = db.query(models.Report).filter(models.Report.publisher_id == current_user.id).options(joinedload(models.Report.publisher), joinedload(models.Report.reviewer)).all()
    elif current_user.user_type_id == 2: # User (assuming they can also be publishers)
        reports = db.query(models.Report).filter(models.Report.publisher_id == current_user.id).options(joinedload(models.Report.publisher), joinedload(models.Report.reviewer)).all()
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
            report_type_id=r.report_type_id,
            created_date=r.created_date, # Use the string directly
            review_date=review_date_str,
            status=r.status,
            comment=r.comment,
            reviewer=r.reviewer.username if r.reviewer else 'N/A',
            reviewer_id=r.reviewer_id,
            form_data=form_data,
            pdf_url=r.pdf_url,
            reward=r.reward
        ))

    return result

@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    report_query = db.query(models.Report).options(
        joinedload(models.Report.publisher).options(joinedload(models.User.agent_balance)),
        joinedload(models.Report.reviewer)
    )
    db_report = report_query.filter(models.Report.id == report_id).first()

    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Check authorization
    is_admin = current_user.user_type_id == 1
    is_publisher = db_report.publisher_id == current_user.id
    
    if not is_admin and not is_publisher:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")

    form_data = json.loads(db_report.form_data) if db_report.form_data else None
    
    agent_is_affiliate = None
    if db_report.publisher and db_report.publisher.user_type_id == 2: # AGENT
        agent_is_affiliate = db_report.publisher.is_affiliate

    return ReportOut(
        id=db_report.id,
        address=db_report.address,
        publisher=db_report.publisher.username if db_report.publisher else 'N/A',
        publisher_id=db_report.publisher_id,
        report_type_id=db_report.report_type_id,
        created_date=db_report.created_date.isoformat(),
        review_date=db_report.review_date.isoformat() if db_report.review_date else None,
        status=db_report.status,
        comment=db_report.comment,
        reviewer=db_report.reviewer.username if db_report.reviewer else 'N/A',
        reviewer_id=db_report.reviewer_id,
        form_data=form_data,
        pdf_url=db_report.pdf_url,
        reward=db_report.reward,
        agent_id=db_report.publisher_id if db_report.publisher.user_type_id == 2 else None,
        agent_is_affiliate=agent_is_affiliate
    )

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
def create_report(report_data: ReportCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Extract address, address_id, and agent_id from form_data
    form_data = report_data.form_data
    address = form_data.get("propertyAddress") or report_data.address
    address_id = form_data.get("address_id")
    agent_id = form_data.get("agent_id")

    # If address_id is missing but address is present, insert or get address
    if address and not address_id:
        # Try to find existing address
        address_obj = db.query(models.Address).filter(models.Address.address == address).first()
        if not address_obj:
            # Insert new address
            address_obj = models.Address(address=address)
            db.add(address_obj)
            db.commit()
            db.refresh(address_obj)
        address_id = address_obj.address_id
        form_data["address_id"] = address_id

    # If agent_id is present and address_id is missing (i.e., new address), link agent and address
    if agent_id and address_id:
        # Check if link already exists
        link = db.query(models.AddressAgent).filter_by(address_id=address_id, agent_id=agent_id).first()
        if not link:
            db.add(models.AddressAgent(address_id=address_id, agent_id=agent_id))
            db.commit()

    temp_filename = f"/tmp/{uuid.uuid4()}.pdf"
    checkhero.generate_pdf_dispatcher(form_data, report_data.report_type_id, temp_filename)
    
    s3_filename = f"reports/{uuid.uuid4()}.pdf"
    pdf_url = upload_to_s3(temp_filename, s3_filename)

    os.remove(temp_filename)

    new_report = models.Report(
        form_data=json.dumps(form_data),
        publisher_id=current_user.id,
        address=address,
        address_id=address_id,
        report_type_id=report_data.report_type_id,
        status="draft",
        pdf_url=pdf_url,
        created_date=datetime.now(datetime.UTC)
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@router.put("/update/{report_id}", response_model=ReportOut)
def update_report(report_id: int, update_data: ReportUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    if update_data.form_data:
        db_report.form_data = json.dumps(update_data.form_data)
        # Also regenerate PDF
        temp_filename = f"/tmp/{uuid.uuid4()}.pdf"
        checkhero.generate_pdf_dispatcher(update_data.form_data, db_report.report_type_id, temp_filename)
        s3_filename = f"reports/{uuid.uuid4()}.pdf"
        pdf_url = upload_to_s3(temp_filename, s3_filename)
        os.remove(temp_filename)
        db_report.pdf_url = pdf_url

    if update_data.comment:
        db_report.comment = update_data.comment
    
    db.commit()
    db.refresh(db_report)
    
    # Reload relationships to return full data
    return get_report(report_id, db, current_user)

@router.put("/approve/{report_id}", response_model=ReportOut)
def approve_report(report_id: int, request_data: ApproveReportRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.user_type_id != 1: # ADMIN
        raise HTTPException(status_code=403, detail="Only admins can approve reports.")

    db_report = db.query(models.Report).options(joinedload(models.Report.publisher)).filter(models.Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    db_report.status = "approved"
    db_report.review_date = datetime.utcnow()
    db_report.reviewer_id = current_user.id
    if request_data.comment:
        db_report.comment = request_data.comment

    # Handle reward for affiliated agents
    agent = db_report.publisher
    if agent and agent.user_type_id == 2 and agent.is_affiliate: # AGENT
        if request_data.reward is None or request_data.reward <= 0:
            raise HTTPException(status_code=400, detail="A positive reward is required for an affiliated agent.")
        
        db_report.reward = request_data.reward
        
        # Update agent balance
        agent_balance = db.query(models.AgentBalance).filter(models.AgentBalance.user_id == agent.id).first()
        if agent_balance:
            agent_balance.balance += request_data.reward
        else:
            # Create a balance record if it doesn't exist
            new_balance = models.AgentBalance(user_id=agent.id, balance=request_data.reward)
            db.add(new_balance)

    db.commit()
    db.refresh(db_report)
    return get_report(report_id, db, current_user)

@router.delete("/delete/{report_id}")
def delete_report(report_id: int, db: Session = Depends(database.get_db)):
    db_report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db.delete(db_report)
    db.commit()
    return {"detail": "Report deleted successfully"} 