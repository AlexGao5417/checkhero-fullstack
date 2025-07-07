import debugpy
# Start debugpy for remote debugging
# Listen on all interfaces, port 5678
# Uncomment the next line to pause until debugger attaches
# debugpy.wait_for_client()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models, database, auth, reports, user_management, agent, constants, audit
from app.database import SessionLocal
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
load_dotenv()

if os.environ.get("DEBUGPY_ENABLED"):
    debugpy.listen(("0.0.0.0", 5678))
    print("⏳ Waiting for debugger attach on 0.0.0.0:5678...")

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="CheckHero Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://aiosafetycheck.com.au"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_initial_user_types():
    db: Session = SessionLocal()
    try:
        if db.query(models.UserType).count() == 0:
            types = [
                models.UserType(id=constants.ADMIN, type="admin"),
                models.UserType(id=constants.AGENT, type="agent"),
                models.UserType(id=constants.USER, type="user")
            ]
            db.add_all(types)
            db.commit()
    finally:
        db.close()


def create_initial_report_types():
    db: Session = SessionLocal()
    try:
        if db.query(models.ReportType).count() == 0:
            types = [
                models.ReportType(id=constants.ELECTRICITY_AND_SMOKE_REPORT_TYPE, type="ELECTRICITY_AND_SMOKE"),
                models.ReportType(id=constants.GAS_REPORT_TYPE, type="GAS"),
                models.ReportType(id=constants.SMOKE_REPORT_TYPE, type="SMOKE")
            ]
            db.add_all(types)
            db.commit()
    finally:
        db.close()

create_initial_user_types()
create_initial_report_types()

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(user_management.router, prefix="/users", tags=["users"]) # This now includes the admin routes
app.include_router(agent.router, prefix="/agent", tags=["agent"])
app.include_router(audit.router)


@app.get("/")
def root():
    return {"message": "CheckHero backend is running!"}