from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric, Boolean
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

class ReportType(Base):
    __tablename__ = "report_types"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, unique=True, nullable=False) # smoke, electricityAndSmoke, gas

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    phone = Column(String, nullable=True)
    user_type_id = Column(Integer, ForeignKey('user_types.id'), nullable=True)
    is_affiliate = Column(Boolean, nullable=True, default=False)

    user_type = relationship("UserType")
    published_reports = relationship("Report", foreign_keys='Report.publisher_id', back_populates="publisher")
    reviewed_reports = relationship("Report", foreign_keys='Report.reviewer_id', back_populates="reviewer")
    agent_reports = relationship("Report", foreign_keys='Report.agent_id', back_populates="agent")
    withdraw_rewards = relationship("WithdrawReward", back_populates="agent")
    agent_balance = relationship("AgentBalance", uselist=False, back_populates="agent")

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)
    publisher_id = Column(Integer, ForeignKey("users.id"))
    publisher = relationship("User", foreign_keys=[publisher_id], back_populates="published_reports")
    created_date = Column(String, nullable=False)
    review_date = Column(DateTime, nullable=True)
    status = Column(String, default='draft')
    comment = Column(String, nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviewed_reports")
    form_data = Column(SQLiteJSON)
    pdf_url = Column(String, nullable=True)
    report_type_id = Column(Integer, ForeignKey("report_types.id"))
    report_type = relationship("ReportType")
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    agent = relationship("User", foreign_keys=[agent_id], back_populates="agent_reports")
    reward = Column(Numeric, nullable=True)

class Address(Base):
    __tablename__ = "addresses"
    address_id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)

class AddressAgent(Base):
    __tablename__ = "address_agent"
    id = Column(Integer, primary_key=True, index=True)
    address_id = Column(Integer, ForeignKey('addresses.address_id'), nullable=False)
    agent_id = Column(Integer, ForeignKey('users.id'), nullable=False)

class AgentBalance(Base):
    __tablename__ = "agent_balances"
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True)
    balance = Column(Numeric, nullable=False, default=0)
    agent = relationship("User", back_populates="agent_balance")

class WithdrawReward(Base):
    __tablename__ = 'withdraw_rewards'

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey('users.id'))
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String, default='pending')  # e.g., pending, approved, denied
    submit_datetime = Column(DateTime, default=datetime.utcnow)
    review_datetime = Column(DateTime, nullable=True)
    invoice_pdf = Column(String, nullable=True)

    agent = relationship("User", back_populates="withdraw_rewards")
