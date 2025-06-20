from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app import models, database
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from app.utils import get_password_hash

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    phone: Optional[str]
    user_type_id: Optional[int]
    user_type: Optional[str] = None  # For display
    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    user_type_id: int

class UserUpdate(BaseModel):
    username: Optional[str]
    email: Optional[EmailStr]
    password: Optional[str]
    phone: Optional[str]
    user_type_id: Optional[int]

@router.get("/", response_model=List[UserOut])
def list_users(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.User)
    users = query.offset(skip).limit(limit).all()
    result = []
    for u in users:
        user_type_str = None
        if u.user_type_id:
            ut = db.query(models.UserType).filter(models.UserType.id == u.user_type_id).first()
            if ut:
                user_type_str = ut.type
        result.append(UserOut(
            id=u.id,
            username=u.username,
            email=u.email,
            phone=u.phone,
            user_type_id=u.user_type_id,
            user_type=user_type_str
        ))
    return result

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(database.get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        phone=user.phone,
        user_type_id=user.user_type_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
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
        user_type=user_type_str
    )

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.username:
        db_user.username = user.username
    if user.email:
        db_user.email = user.email
    if user.password:
        db_user.password_hash = get_password_hash(user.password)
    if user.phone is not None:
        db_user.phone = user.phone
    if user.user_type_id is not None:
        db_user.user_type_id = user.user_type_id
    db.commit()
    db.refresh(db_user)
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
        user_type=user_type_str
    )

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return {"detail": "User deleted"}

# Reports API will be implemented in a new file: reports.py 