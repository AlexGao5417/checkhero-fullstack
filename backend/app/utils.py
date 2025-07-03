from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def log_audit(db, user_id, action, target_type=None, target_id=None):
    from app import models
    from datetime import datetime
    log = models.AuditLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit() 