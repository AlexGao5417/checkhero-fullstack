from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from datetime import datetime
import json

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    phone = Column(String, nullable=True)
    user_type = Column(String, nullable=False, default='agent')

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)
    publisher_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    publisher = Column(String, nullable=False)
    created_date = Column(String, nullable=False)
    review_date = Column(String, nullable=True)
    status = Column(String, nullable=False, default='draft')
    comment = Column(String, nullable=True)
    reviewer = Column(String, nullable=True)
    form_data = Column(Text, nullable=True)  # Store all form fields as JSON string 

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