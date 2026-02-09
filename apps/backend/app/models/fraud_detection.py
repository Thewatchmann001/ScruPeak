"""
Fraud Detection AI Service
Machine learning-based fraud detection for land transactions
"""

from sqlalchemy import Column, String, DateTime, Float, Boolean, Integer, ForeignKey, Enum, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class FraudRiskLevel(str, enum.Enum):
    """Fraud risk assessment levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FraudPattern(str, enum.Enum):
    """Types of fraud patterns detected"""
    PRICE_ANOMALY = "price_anomaly"  # Price far above/below market
    RAPID_RESALE = "rapid_resale"  # Property quickly resold
    IDENTITY_MISMATCH = "identity_mismatch"  # Owner ID doesn't match
    DOCUMENT_FORGERY = "document_forgery"  # Forged documents
    TITLE_JUMPING = "title_jumping"  # Skipped sellers in chain
    BOUNDARY_MANIPULATION = "boundary_manipulation"  # Altered boundaries
    SHELL_COMPANY = "shell_company"  # Unknown buyer/seller
    COLLUSIVE_PRICING = "collusive_pricing"  # Fake pricing with family
    ENVIRONMENTAL_FRAUD = "environmental_fraud"  # Hidden environmental issues
    TAX_EVASION = "tax_evasion"  # Undervalued for tax purposes
    MONEY_LAUNDERING = "money_laundering"  # Suspicious funds pattern
    REGULATORY_VIOLATION = "regulatory_violation"  # Regulatory breaches


class FraudAnalysis(Base):
    """Machine learning fraud detection analysis"""
    __tablename__ = "fraud_analyses"
    __table_args__ = (
        Index("idx_fa_transaction_id", "transaction_id"),
        Index("idx_fa_risk_level", "risk_level"),
        Index("idx_fa_created_at", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("escrow.id"), nullable=False)
    
    # Risk assessment
    risk_level = Column(Enum(FraudRiskLevel), default=FraudRiskLevel.LOW)
    fraud_probability = Column(Float, default=0.0)  # 0.0-1.0
    confidence_score = Column(Float, default=0.0)
    
    # Detected patterns
    detected_patterns = Column(JSON, nullable=True)  # List of FraudPattern
    pattern_details = Column(JSON, nullable=True)
    
    # Feature analysis
    features_analyzed = Column(JSON, nullable=True)  # Features used in ML model
    feature_scores = Column(JSON, nullable=True)  # Individual feature risk scores
    
    # Comparative analysis
    is_price_anomaly = Column(Boolean, default=False)
    price_percentile = Column(Float, nullable=True)  # Position in market distribution
    similar_transactions_count = Column(Integer, default=0)
    
    # Party analysis
    buyer_risk_score = Column(Float, default=0.0)
    seller_risk_score = Column(Float, default=0.0)
    agent_risk_score = Column(Float, default=0.0)
    
    # Document analysis
    document_authenticity_score = Column(Float, default=0.0)
    suspicious_documents = Column(JSON, nullable=True)
    
    # Historical data
    buyer_transaction_history = Column(JSON, nullable=True)
    seller_transaction_history = Column(JSON, nullable=True)
    
    # Recommendation
    recommendation = Column(String(100), nullable=True)  # "approve", "review", "block", "escalate"
    reviewer_notes = Column(String(500), nullable=True)
    
    # Status
    is_reviewed = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)
    reviewed_by_id = Column(UUID(as_uuid=True), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FraudFlag(Base):
    """Individual fraud flags and alerts"""
    __tablename__ = "fraud_flags"
    __table_args__ = (
        Index("idx_ff_analysis_id", "analysis_id"),
        Index("idx_ff_flag_type", "flag_type"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("fraud_analyses.id"), nullable=False)
    
    # Flag details
    flag_type = Column(String(100), nullable=False)  # Type of fraud indicator
    severity = Column(String(50), nullable=False)  # "warning", "high", "critical"
    
    # Description and evidence
    description = Column(String(500), nullable=False)
    evidence = Column(JSON, nullable=True)  # Supporting data
    
    # Status
    is_resolved = Column(Boolean, default=False)
    resolution_date = Column(DateTime, nullable=True)
    resolution_action = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class PartyRiskProfile(Base):
    """Risk profile for buyers, sellers, and agents"""
    __tablename__ = "party_risk_profiles"
    __table_args__ = (
        Index("idx_prp_user_id", "user_id"),
        Index("idx_prp_risk_level", "risk_level"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Risk metrics
    overall_risk_score = Column(Float, default=0.0)
    risk_level = Column(Enum(FraudRiskLevel), default=FraudRiskLevel.LOW)
    
    # History
    total_transactions = Column(Integer, default=0)
    completed_transactions = Column(Integer, default=0)
    failed_transactions = Column(Integer, default=0)
    flagged_transactions = Column(Integer, default=0)
    
    # Compliance
    complaints_filed = Column(Integer, default=0)
    disputes_resolved = Column(Integer, default=0)
    regulatory_violations = Column(Integer, default=0)
    
    # Transaction patterns
    average_transaction_value = Column(Float, nullable=True)
    average_time_to_close = Column(Integer, nullable=True)  # days
    transaction_frequency = Column(Float, nullable=True)  # per month
    
    # KYC/AML
    kyc_verified = Column(Boolean, default=False)
    kyc_verification_date = Column(DateTime, nullable=True)
    aml_screened = Column(Boolean, default=False)
    aml_screening_date = Column(DateTime, nullable=True)
    
    # Relationships
    peer_comparison_percentile = Column(Float, nullable=True)  # 0-100
    similar_parties_risk = Column(Float, nullable=True)
    
    # Notes
    risk_notes = Column(String(500), nullable=True)
    
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FraudDetectionModel(Base):
    """Metadata for fraud detection ML model"""
    __tablename__ = "fraud_detection_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Model info
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(20), nullable=False)
    model_type = Column(String(50), nullable=False)  # "random_forest", "xgboost", "neural_network", etc.
    
    # Performance metrics
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    auc_roc = Column(Float, nullable=True)
    
    # Training data
    training_samples = Column(Integer, default=0)
    features_used = Column(JSON, nullable=True)  # List of features
    feature_importance = Column(JSON, nullable=True)  # Importance scores
    
    # Deployment
    is_active = Column(Boolean, default=False)
    deployed_at = Column(DateTime, nullable=True)
    deployed_by = Column(String(255), nullable=True)
    
    # Status
    status = Column(String(50), default="development")  # "development", "testing", "production", "archived"
    
    # Model files
    model_file_path = Column(String(500), nullable=True)
    model_hash = Column(String(256), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FraudDetectionLog(Base):
    """Audit log of fraud detection runs"""
    __tablename__ = "fraud_detection_logs"
    __table_args__ = (
        Index("idx_fdl_transaction_id", "transaction_id"),
        Index("idx_fdl_run_date", "run_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("escrow.id"), nullable=False)
    
    # Model used
    model_id = Column(UUID(as_uuid=True), ForeignKey("fraud_detection_models.id"), nullable=True)
    model_version = Column(String(20), nullable=True)
    
    # Execution
    risk_score_before = Column(Float, nullable=True)
    risk_score_after = Column(Float, nullable=True)
    detected_patterns = Column(JSON, nullable=True)
    
    # Performance
    processing_time_ms = Column(Integer, nullable=True)
    features_extracted = Column(Integer, default=0)
    
    run_date = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String(50), default="success")  # "success", "partial", "failed"
