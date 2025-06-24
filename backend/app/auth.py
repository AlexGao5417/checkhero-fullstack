from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import models, database, utils
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
from app.utils import get_password_hash, verify_password
from typing import Optional
from . import constants

SECRET_KEY = "supersecretkey"  # In production, use env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 1

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    phone: Optional[str]
    user_type_id: int

    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    phone: str = None
    user_type_id: int

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenAndUser(Token):
    user: UserOut

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(datetime.UTC) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(datetime.UTC) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=TokenAndUser)
def register(user: UserCreate, db: Session = Depends(database.get_db), response: Response = None):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        phone=user.phone,
        user_type_id=user.user_type_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token_data = {
        "sub": new_user.email,
        "user_id": new_user.id,
        "user_type_id": new_user.user_type_id
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    if response:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@router.post("/login", response_model=TokenAndUser)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db), response: Response = None):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token_data = {
        "sub": user.email,
        "user_id": user.id,
        "user_type_id": user.user_type_id
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    if response:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/refresh")
def refresh_token(request: Request, response: Response, refresh_token: str = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        email = payload.get("sub")
        user_id = payload.get("user_id")
        user_type_id = payload.get("user_type_id")
        if not email or not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token payload")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    # Issue new access token
    token_data = {"sub": email, "user_id": user_id, "user_type_id": user_type_id}
    access_token = create_access_token(data=token_data)
    return {"access_token": access_token, "user": {"id": user_id, "email": email, "user_type_id": user_type_id}} 