from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from datetime import datetime
import json
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional

Base = declarative_base()
class UserType(Base):
    __tablename__ = "user_types"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, unique=True, nullable=False)  # admin, electrician, agent

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    phone = Column(String, nullable=True)
    user_type_id = Column(Integer, ForeignKey('user_types.id'), nullable=True)
    reports = relationship("Report", foreign_keys='[Report.publisher_id]', back_populates="publisher")

class Report(Base):
    __tablename__ = "reports"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    address = Column(String, nullable=False)
    publisher_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    publisher: Mapped["User"] = relationship(foreign_keys=[publisher_id], back_populates="reports")
    created_date = Column(String, nullable=False)
    review_date: Mapped[Optional[datetime]]
    status: Mapped[str] = mapped_column(String, default='draft')
    comment: Mapped[Optional[str]]
    reviewer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewer: Mapped["User"] = relationship(foreign_keys=[reviewer_id])
    form_data: Mapped[dict] = mapped_column(SQLiteJSON)
    pdf_url: Mapped[Optional[str]]

class InspectionItem(Base):
    __tablename__ = "inspection_items"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, nullable=False)
    inspect_id = Column(String, unique=True, nullable=False)

class Address(Base):
    __tablename__ = "addresses"
    address_id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)

class AddressAgent(Base):
    __tablename__ = "address_agent"
    id = Column(Integer, primary_key=True, index=True)
    address_id = Column(Integer, ForeignKey('addresses.address_id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False) 