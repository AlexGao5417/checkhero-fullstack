from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router
from app.user_management import router as user_management_router
from app.reports import router as reports_router
import os
import tempfile
import uuid
import json
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.checkhero import generate_report
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app import auth, user_management, reports, checkhero, models
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="CheckHero Backend API")

# Allow CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_initial_user_types():
    db: Session = SessionLocal()
    try:
        if db.query(models.UserType).count() == 0:
            types = [
                models.UserType(id=1, type="admin"),
                models.UserType(id=2, type="agent"),
                models.UserType(id=3, type="electrician")
            ]
            db.add_all(types)
            db.commit()
    finally:
        db.close()

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(user_management_router, prefix="/users", tags=["users"])
app.include_router(reports_router, prefix="/reports", tags=["reports"])
create_initial_user_types()
@app.get("/")
def root():
    return {"message": "CheckHero backend is running!"}