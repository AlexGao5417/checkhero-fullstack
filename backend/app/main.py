from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models, database, auth, reports, user_management, agent, checkhero, constants
from app.database import SessionLocal
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="CheckHero Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

create_initial_user_types()

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(user_management.router, prefix="/users", tags=["users"]) # This now includes the admin routes
app.include_router(agent.router, prefix="/agent", tags=["agent"])


@app.get("/")
def root():
    return {"message": "CheckHero backend is running!"}