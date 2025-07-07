from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric, Boolean
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from datetime import datetime
import json
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
import uuid
from sqlalchemy.dialects.postgresql import UUID

Base = declarative_base()
class UserType(Base):
    __tablename__ = "user_types"
    id = Column(Integer, primary_key=True, unique=True, index=True, nullable=False)
    type = Column(String, unique=True, nullable=False)  # admin, user, agent

class ReportType(Base):
    __tablename__ = "report_types"
    id = Column(Integer, primary_key=True, unique=True, index=True, nullable=False)
    type = Column(String, unique=True, nullable=False) # smoke, electricityAndSmoke, gas

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True, nullable=False)
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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True, nullable=False)
    address = relationship("Address")
    address_id = Column(UUID(as_uuid=True), ForeignKey("addresses.id"), nullable=True)
    publisher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    publisher = relationship("User", foreign_keys=[publisher_id], back_populates="published_reports")
    created_date = Column(DateTime, nullable=False)
    review_date = Column(DateTime, nullable=True)
    status = Column(String, default='draft')
    comment = Column(String, nullable=True)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviewed_reports")
    form_data = Column(SQLiteJSON)
    pdf_url = Column(String, nullable=True)
    report_type_id = Column(Integer, ForeignKey("report_types.id"))
    report_type = relationship("ReportType")
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    agent = relationship("User", foreign_keys=[agent_id], back_populates="agent_reports")
    reward = Column(Numeric, nullable=True)

class Address(Base):
    __tablename__ = "addresses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True, nullable=False)
    address = Column(String, nullable=False)

class AddressAgent(Base):
    __tablename__ = "address_agent"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True, nullable=False)
    address_id = Column(UUID(as_uuid=True), ForeignKey('addresses.id'), nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    address = relationship("Address")
    agent = relationship("User")
    active = Column(Boolean, default=True, nullable=False)

class AgentBalance(Base):
    __tablename__ = "agent_balances"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True, nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, unique=True)
    balance = Column(Numeric, nullable=False, default=0)
    agent = relationship("User", back_populates="agent_balance")

class WithdrawReward(Base):
    __tablename__ = 'withdraw_rewards'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True, nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String, default='pending')  # e.g., pending, approved, denied
    submit_datetime = Column(DateTime, default=datetime.utcnow)
    review_datetime = Column(DateTime, nullable=True)
    invoice_pdf = Column(String, nullable=True)

    agent = relationship("User", back_populates="withdraw_rewards")

class AddressReport(Base):
    __tablename__ = "address_reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True, nullable=False)
    address_id = Column(UUID(as_uuid=True), ForeignKey('addresses.id'), nullable=False)
    last_report_id = Column(UUID(as_uuid=True), ForeignKey('reports.id'), nullable=True)
    last_inspect_type_id = Column(Integer, ForeignKey('report_types.id'), nullable=True)
    last_inspect_time = Column(DateTime, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=True)
    target_id = Column(UUID(as_uuid=True), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
