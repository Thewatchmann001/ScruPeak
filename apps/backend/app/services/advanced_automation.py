"""
Advanced Automation & AI Features
Automated compliance workflows, intelligent chatbot, workflow automation
"""

import json
import logging
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timedelta, timezone
import asyncio
import httpx
import os
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship

logger = logging.getLogger(__name__)
Base = declarative_base()
AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL")

# Secure Admin Bootstrapping (Removing hardcoded josephemsamah@gmail.com)
BOOTSTRAP_ADMIN_EMAIL = os.environ.get("BOOTSTRAP_ADMIN_EMAIL")

# Ensure we use the async driver
# Update: Connect to PgBouncer port (typically 6432) instead of direct PG port
DB_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:6432/scrupeak")

# Optimized domain instructions to improve LLM entity extraction and intent classification for Sierra Leone
LAND_DOMAIN_SYSTEM_PROMPT = """
You are an expert land administrator in Sierra Leone. Identify and extract entities based on these local standards:
- 'OARG': The Office of the Administrator and Registrar General (the primary Land Registry).
- 'GIS_TASK': Geospatial calculation task offloaded to worker queue.
- 'Bootstrap': Initialization of secure RBAC.
- 'Survey Plan': Official boundary maps signed by a Sierra Leone licensed surveyor.
- 'Deed of Conveyance': The primary legal instrument for transferring freehold land title.
- 'Town Lot': The local unit of area measurement (~0.1 acre or 5,000 sq ft). 
- 'Stamp Duty' and 'Ground Rent': Core government land taxes.
- 'Statutory Declaration': A document type frequently used for traditional land claims.
- 'SL-ID': Parcel codes formatted as 'SL-GRID-X-Y-SEQ' (e.g., SL-00100-01-02-0001).
"""

@dataclass
class WorkflowStep:
    """Defines a single step within a compliance workflow."""
    step_id: str
    name: str
    description: str
    required_inputs: List[str]
    actions: List[Callable] # Placeholder for actual action functions
    expected_duration_minutes: int
    auto_proceed: bool = False

# ============================================================================
# DATABASE MODELS FOR WORKFLOW PERSISTENCE
# ============================================================================

class WorkflowExecutionDB(Base):
    __tablename__ = "workflow_executions"
    workflow_id = Column(String, primary_key=True)
    workflow_type = Column(String, index=True)
    entity_type = Column(String)
    entity_id = Column(String, index=True)
    status = Column(String, default="in_progress") # in_progress, completed, failed, pending_review
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    progress = Column(Integer, default=0)
    metadata_json = Column(JSON, default={})
    
    steps = relationship("WorkflowStepExecutionDB", back_populates="execution", cascade="all, delete-orphan")

class WorkflowStepExecutionDB(Base):
    __tablename__ = "workflow_step_executions"
    id = Column(Integer, primary_key=True)
    workflow_id = Column(String, ForeignKey("workflow_executions.workflow_id"))
    step_id = Column(String)
    name = Column(String)
    status = Column(String)
    result = Column(String)
    executed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    duration_seconds = Column(Integer)
    
    execution = relationship("WorkflowExecutionDB", back_populates="steps")

class ChatSessionDB(Base):
    __tablename__ = "chat_sessions"
    session_id = Column(String, primary_key=True)
    user_id = Column(String, index=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    context_json = Column(JSON, default={})
    is_active = Column(String, default="true")
    
    messages = relationship("ChatMessageDB", back_populates="session", cascade="all, delete-orphan")

class ChatMessageDB(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    session_id = Column(String, ForeignKey("chat_sessions.session_id"))
    role = Column(String)
    content = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    session = relationship("ChatSessionDB", back_populates="messages")


# ============================================================================
# INTELLIGENT CHATBOT SERVICE
# ============================================================================

class ChatbotIntent(str, Enum):
    """Chatbot intent classification"""
    PROPERTY_SEARCH = "property_search"
    PRICE_INQUIRY = "price_inquiry"
    TITLE_VERIFICATION = "title_verification"
    DISPUTE_RESOLUTION = "dispute_resolution"
    DOCUMENT_HELP = "document_help"
    TRANSACTION_STATUS = "transaction_status"
    REGULATORY_QUESTION = "regulatory_question"
    FRAUD_REPORT = "fraud_report"
    GENERAL_INFO = "general_info"
    ESCALATE = "escalate_to_human"


class ConversationContext:
    """Maintain conversation context"""
    
    def __init__(self, user_id: str, session_id: str):
        self.user_id = user_id
        self.session_id = session_id
        self.messages = []
        self.context_data = {}
        self.intent_history = []
        self.started_at = datetime.now(timezone.utc)
    
    def add_message(self, role: str, content: str):
        """Add message to conversation"""
        self.messages.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "role": role,
            "content": content
        })
    
    def set_context(self, key: str, value: Any):
        """Store context variable"""
        self.context_data[key] = value
    
    def get_context(self, key: str) -> Optional[Any]:
        """Retrieve context variable"""
        return self.context_data.get(key)


class ScruPeakAIChatbot:
    """AI-powered conversational assistant"""
    
    def __init__(self):
        self.conversations = {}  # session_id -> ConversationContext
        self.ai_client = httpx.AsyncClient(timeout=30.0)
    
    async def process_message(
        self,
        user_id: str,
        session_id: str,
        message: str
    ) -> Dict:
        """Process user message and return AI response"""
        
        # Get or create conversation context
        if session_id not in self.conversations:
            self.conversations[session_id] = ConversationContext(user_id, session_id)
        
        context = self.conversations[session_id]
        context.add_message("user", message)
        
        # Intent classification
        intent = await self._classify_intent(message)
        context.intent_history.append(intent)
        
        # Extract entities
        entities = await self._extract_entities(message, intent)
        
        # Generate response
        response = await self._generate_response(intent, entities, context)
        
        context.add_message("assistant", response["text"])
        
        return {
            "session_id": session_id,
            "message": response["text"],
            "intent": intent.value,
            "entities": entities,
            "suggestions": response.get("suggestions", []),
            "requires_escalation": response.get("requires_escalation", False),
            "metadata": {
                "response_time_ms": response.get("response_time_ms", 245),
                "confidence": response.get("confidence", 0.87)
            }
        }
    
    async def _classify_intent(self, message: str) -> ChatbotIntent:
        """Classify user intent using NLP"""
        try:
            # Real LLM Classification via internal Mistral Service
            response = await self.ai_client.post(
                f"{AI_SERVICE_URL}/ai/classify-intent",
                json={
                    "text": message, 
                    "allowed_intents": [i.value for i in ChatbotIntent],
                    "system_prompt": LAND_DOMAIN_SYSTEM_PROMPT
                }
            )
            if response.status_code == 200:
                intent_val = response.json().get("intent")
                try:
                    return ChatbotIntent(intent_val)
                except ValueError:
                    logger.warning(f"Unknown intent received: {intent_val}")
        except Exception as e:
            logger.error(f"LLM Intent classification failed: {e}")
            
        return ChatbotIntent.GENERAL_INFO
    
    async def _extract_entities(self, message: str, intent: ChatbotIntent) -> Dict:
        """Extract relevant entities from message"""
        try:
            # Real LLM Entity Extraction
            response = await self.ai_client.post(
                f"{AI_SERVICE_URL}/ai/extract-entities",
                json={
                    "text": message, 
                    "intent": intent.value,
                    "domain_instructions": LAND_DOMAIN_SYSTEM_PROMPT,
                    "terminology_hints": ["OARG", "Town Lot", "Conveyance", "Statutory Declaration", "Survey Plan"]
                }
            )
            return response.json().get("entities", {})
        except Exception as e:
            logger.error(f"LLM Entity extraction failed: {e}")
            return {}
    
    async def _generate_response(
        self,
        intent: ChatbotIntent,
        entities: Dict,
        context: ConversationContext
    ) -> Dict:
        """Generate contextual response"""
        # TODO: Replace static templates with LLM-generated responses, potentially using RAG with a Vector DB.
        
        templates = {
            ChatbotIntent.PROPERTY_SEARCH: [
                "I'd be happy to help you find property. Can you tell me your budget and preferred location?",
                "Let me search our database for properties matching your criteria.",
                "I found {count} properties in your area. Would you like details?"
            ],
            ChatbotIntent.PRICE_INQUIRY: [
                "Based on current market data, properties in this area typically range from ${min} to ${max}.",
                "Let me get you an accurate price estimate for {property_id}.",
                "The estimated value is ${price}. This is based on recent comparable sales."
            ],
            ChatbotIntent.TITLE_VERIFICATION: [
                "Let me verify the title for {property_id}.",
                "Title verification complete. The property has clear ownership.",
                "I found {issues} potential issues with the title. Escalating to specialist."
            ],
            ChatbotIntent.DISPUTE_RESOLUTION: [
                "I'm sorry to hear about the dispute. Let me connect you with our mediation team.",
                "I can help initiate the dispute resolution process.",
                "The resolution process typically takes {days} days."
            ],
            ChatbotIntent.ESCALATE: [
                "I'm connecting you with a human specialist now.",
                "A support agent will be with you shortly."
            ]
        }
        
        # Select template based on intent
        template_list = templates.get(intent, templates[ChatbotIntent.GENERAL_INFO])
        response_text = template_list[0]  # Simplified - in production, use ML to select
        
        # Format template with entities
        for key, value in entities.items():
            response_text = response_text.replace(f"{{{key}}}", str(value))
        
        # Generate suggestions
        suggestions = await self._generate_suggestions(intent, entities)
        
        return {
            "text": response_text,
            "suggestions": suggestions,
            "requires_escalation": intent == ChatbotIntent.ESCALATE,
            "response_time_ms": 245,
            "confidence": 0.87
        }
    
    async def _generate_suggestions(
        self,
        intent: ChatbotIntent,
        entities: Dict
    ) -> List[str]:
        """Generate follow-up suggestions"""
        
        suggestion_map = {
            ChatbotIntent.PROPERTY_SEARCH: [
                "Refine search by price",
                "View similar properties",
                "Schedule property tour",
                "Request valuation"
            ],
            ChatbotIntent.PRICE_INQUIRY: [
                "View price trends",
                "Compare with similar properties",
                "Get detailed valuation",
                "Contact agent"
            ],
            ChatbotIntent.TITLE_VERIFICATION: [
                "View full title document",
                "Check lien status",
                "Request verification certificate",
                "Escalate to legal team"
            ],
            ChatbotIntent.GENERAL_INFO: [
                "Browse FAQs",
                "Contact support",
                "Schedule consultation",
                "View documentation"
            ]
        }
        
        return suggestion_map.get(intent, [])
    
    def _load_knowledge_base(self) -> Dict:
        """Load knowledge base for Q&A"""
        # TODO: Replace in-memory knowledge base with a Vector DB for scalable knowledge retrieval.
        return {
            "property_search": "How to find and search for properties on ScruPeak",
            "title_verification": "Understanding property title verification and ownership",
            "fraud_protection": "ScruPeak fraud detection and protection measures",
            "dispute_resolution": "How to resolve property disputes",
            "regulations": "Local and national property regulations",
            "pricing": "How property valuation and pricing works"
        }
    
    def _load_response_templates(self) -> Dict:
        """Load response templates"""
        # TODO: These templates can be used as prompts for an LLM, but direct usage should be replaced.
        return {
            "property_found": "I found {count} properties matching your criteria.",
            "title_verified": "Title verification for {property_id} is complete and clear.",
            "price_estimated": "Estimated price for {property_id}: ${price}",
            "escalation": "I'm connecting you with a specialist for {issue_type}."
        }
    
    async def close_conversation(self, session_id: str) -> Dict:
        """Close conversation and generate summary"""
        if session_id not in self.conversations:
            return {"error": "Session not found"}
        
        context = self.conversations[session_id]
        duration = (datetime.now(timezone.utc) - context.started_at).total_seconds()
        
        summary = {
            "session_id": session_id,
            "duration_seconds": int(duration),
            "message_count": len(context.messages),
            "intents_discussed": [intent.value for intent in context.intent_history],
            "resolved": len(context.intent_history) > 0
        }
        
        # Clean up
        del self.conversations[session_id]
        
        return summary


# ============================================================================
# AUTOMATED COMPLIANCE WORKFLOWS
# ============================================================================

class ComplianceWorkflow(str, Enum):
    """Single workflow step"""
    KYC_VERIFICATION = "kyc_verification"
    PROPERTY_COMPLIANCE = "property_compliance"
    AML_SCREENING = "aml_screening"
    DOCUMENT_VERIFICATION = "document_verification"
    GIS_CALCULATION = "gis_calculation"
    REGULATORY_REPORTING = "regulatory_reporting"

class AutomatedComplianceOrchestrator:
    """Orchestrate automated compliance workflows"""
    
    def __init__(self):
        # Transaction-mode pooling safety:
        # We must disable prepared statements (statement_cache_size=0) 
        # because PgBouncer in transaction mode cycles connections between requests.
        self.engine = create_async_engine(
            DB_URL, 
            pool_pre_ping=True,
            statement_cache_size=0
        )
        self.AsyncSessionLocal = async_sessionmaker(
            bind=self.engine, 
            class_=AsyncSession, 
            expire_on_commit=False
        )
        self.workflows = {}
        self._initialize_workflows()
    
    def _initialize_workflows(self):
        """Initialize standard compliance workflows"""
        
        # KYC Verification Workflow
        kyc_steps = [
            WorkflowStep(
                "kyc_001",
                "Identity Verification",
                "Verify user identity through documents",
                ["id_document", "selfie"],
                [],
                5,
                True
            ),
            WorkflowStep(
                "kyc_002",
                "Address Verification",
                "Verify current address",
                ["address_proof"],
                [],
                3,
                True
            ),
            WorkflowStep(
                "kyc_003",
                "Background Check",
                "Automated background verification",
                ["user_id"],
                [],
                10,
                True
            ),
            WorkflowStep(
                "kyc_004",
                "Final Approval",
                "Manual review and approval",
                ["kyc_results"],
                [],
                30,
                False
            )
        ]
        
        self.workflows[ComplianceWorkflow.KYC_VERIFICATION] = kyc_steps
        
        # Property Compliance Workflow
        property_steps = [
            WorkflowStep(
                "prop_001",
                "Title Search",
                "Verify property ownership and liens",
                ["property_id"],
                [],
                15,
                True
            ),
            WorkflowStep(
                "prop_002",
                "Zoning Verification",
                "Check zoning compliance",
                ["property_id", "location"],
                [],
                5,
                True
            ),
            WorkflowStep(
                "prop_003",
                "Environmental Check",
                "Environmental compliance review",
                ["property_id"],
                [],
                20,
                False
            ),
            WorkflowStep(
                "prop_004",
                "Tax Status Verification",
                "Verify tax payment status",
                ["property_id"],
                [],
                5,
                True
            )
        ]
        
        self.workflows[ComplianceWorkflow.PROPERTY_COMPLIANCE] = property_steps

        # GIS Offloading Workflow (Decoupled from DB Triggers)
        gis_steps = [
            WorkflowStep(
                "gis_001",
                "Area Calculation",
                "Compute parcel area using worker-side PostGIS/Python",
                ["geometry"],
                [],
                2,
                True
            ),
            WorkflowStep(
                "gis_002",
                "Boundary Validation",
                "Verify boundary integrity and topology",
                ["geometry"],
                [],
                2,
                True
            )
        ]
        self.workflows[ComplianceWorkflow.GIS_CALCULATION] = gis_steps

        # AML Screening Workflow
        aml_steps = [
            WorkflowStep(
                "aml_001",
                "Sanctions List Check",
                "Check user/entity against global sanctions lists (OFAC, UN, etc.)",
                ["user_id", "entity_name"],
                [],
                5,
                True
            ),
            WorkflowStep(
                "aml_002",
                "PEP (Politically Exposed Person) Check",
                "Identify if user/entity is a Politically Exposed Person",
                ["user_id", "entity_name"],
                [],
                5,
                True
            ),
            WorkflowStep(
                "aml_003",
                "Adverse Media Search",
                "Search for negative news or adverse media related to user/entity",
                ["user_id", "entity_name"],
                [],
                10,
                True
            ),
            WorkflowStep(
                "aml_004",
                "AML Risk Scoring & Review",
                "Consolidate AML checks into a risk score and flag for manual review if high risk",
                ["aml_results"],
                [],
                15,
                False # Requires manual review if high risk
            )
        ]
        self.workflows[ComplianceWorkflow.AML_SCREENING] = aml_steps

        # Document Verification Workflow
        document_verification_steps = [
            WorkflowStep(
                "doc_001",
                "Document Authenticity Check",
                "Verify the authenticity and integrity of uploaded documents (e.g., using DocumentExtractor)",
                ["document_id", "document_type", "file_path"],
                [],
                10,
                True
            ),
            WorkflowStep(
                "doc_002",
                "Data Extraction & Cross-Verification",
                "Extract key data points from documents and cross-verify with other sources (e.g., blockchain)",
                ["document_id", "extracted_data"],
                [],
                15,
                True
            ),
            WorkflowStep(
                "doc_003",
                "Signature Verification",
                "Verify digital signatures on documents (e.g., using UnifiedSignatureService)",
                ["document_id", "signature_data"],
                [],
                5,
                True
            ),
            WorkflowStep(
                "doc_004",
                "Document Review & Approval",
                "Final review of document verification results, flag for manual if discrepancies found",
                ["verification_results"],
                [],
                20,
                False # Requires manual review if discrepancies
            )
        ]
        self.workflows[ComplianceWorkflow.DOCUMENT_VERIFICATION] = document_verification_steps
    
    async def start_workflow(
        self,
        workflow_type: ComplianceWorkflow,
        entity_id: str,
        entity_type: str,
        initial_data: Dict
    ) -> Dict:
        """Start automated workflow execution"""
        
        workflow_id = f"{workflow_type.value}_{entity_id}_{datetime.now(timezone.utc).timestamp()}"
        
        logger.info(f"Starting workflow: {workflow_type.value} for {entity_type}:{entity_id}")
        
        async with self.AsyncSessionLocal() as session:
            db_exec = WorkflowExecutionDB(
                workflow_id=workflow_id,
                workflow_type=workflow_type.value,
                entity_type=entity_type,
                entity_id=entity_id,
            )
            session.add(db_exec)
            await session.commit()
        
        steps = self.workflows.get(workflow_type, [])
        
        for step in steps:
            step_result = await self._execute_step(workflow_id, step, initial_data)
            
            async with self.AsyncSessionLocal() as session:
                db_step = WorkflowStepExecutionDB(
                    workflow_id=workflow_id,
                    step_id=step_result["step_id"],
                    name=step_result["name"],
                    status=step_result["status"],
                    result=step_result["result"],
                    duration_seconds=step_result["duration_seconds"]
                )
                session.add(db_step)
                
                # Update progress
                result = await session.execute(select(WorkflowExecutionDB).where(WorkflowExecutionDB.workflow_id == workflow_id))
                db_exec = result.scalars().first()
                if db_exec:
                    db_exec.progress += int(100 / len(steps))
                await session.commit()
        
        async with self.AsyncSessionLocal() as session:
            result = await session.execute(select(WorkflowExecutionDB).where(WorkflowExecutionDB.workflow_id == workflow_id))
            db_exec = result.scalars().first()
            if db_exec:
                db_exec.status = "completed"
                db_exec.completed_at = datetime.now(timezone.utc)
                db_exec.progress = 100
            await session.commit()
            
        return {"workflow_id": workflow_id, "status": "completed"}
    
    async def _execute_step(self, workflow_id: str, step: WorkflowStep, data: Dict) -> Dict:
        """Execute single workflow step"""

        logger.info(f"Executing step: {step.name} for workflow {workflow_id}")

        status = "completed"
        result = "success"

        if step.step_id.startswith("gis_"):
            logger.info(f"Offloading heavy GIS calculation for {workflow_id} to worker queue")
            # Integration with Celery/RabbitMQ would go here
            result = "gis_processed_async"
        if step.step_id == "kyc_001":
            # Example: Check if a user's identity is verified in the DB
            # from app.models import User  # Hypothetical import
            # with self.Session() as session:
            #     user = session.query(User).filter(User.id == workflow_id.split('_')[1]).first()
            #     status = "completed" if user and user.kyc_verified else "pending_review"
            #     result = "verified_in_db" if user and user.kyc_verified else "awaiting_manual_upload"
            logger.info(f"KYC Identity Verification simulated for {workflow_id}")
            status = "completed"
            result = "identity_verified"
        elif step.step_id.startswith("aml_"):
            logger.info(f"Simulating AML check: {step.name}")
            if step.step_id == "aml_004":
                # Simulate some risk that requires review
                if "high_risk_entity" in data.get("entity_name", "").lower():
                    status = "pending_review"
                    result = "high_aml_risk_detected"
                else:
                    result = "aml_passed"
        elif step.step_id.startswith("doc_"):
            logger.info(f"Simulating Document Verification check: {step.name}")
            if step.step_id == "doc_001":
                # Potentially integrate with DocumentExtractor here
                # from app.services.document_extractor import DocumentExtractor
                # extracted = await DocumentExtractor.extract_details(data.get("file_path"))
                # if not extracted["success"]:
                #     status = "pending_review"
                #     result = "document_extraction_failed"
                result = "document_authenticity_checked"
            elif step.step_id == "doc_002":
                # Potentially integrate with BlockchainService for cross-verification
                result = "data_cross_verified"
            elif step.step_id == "doc_003":
                # Potentially integrate with UnifiedSignatureService
                result = "signatures_verified"
            elif step.step_id == "doc_004":
                if "discrepancy" in data.get("verification_results", "").lower():
                    status = "pending_review"
                    result = "document_discrepancy_found"
                else:
                    result = "document_approved"
        else:
            # Default to manual review if logic isn't defined for a step
            status = "pending_review"
            result = "requires_human_verification"

        return {
            "step_id": step.step_id,
            "name": step.name,
            "status": status,
            "result": result,
            "executed_at": datetime.now(timezone.utc).isoformat(),
            "duration_seconds": step.expected_duration_minutes * 60
        }
    
    async def get_workflow_status(self, workflow_id: str) -> Optional[Dict]:
        """Get workflow execution status"""
        async with self.AsyncSessionLocal() as session:
            result = await session.execute(select(WorkflowExecutionDB).where(WorkflowExecutionDB.workflow_id == workflow_id))
            db_exec = result.scalars().first()
            return {"workflow_id": db_exec.workflow_id, "status": db_exec.status, "progress": db_exec.progress} if db_exec else None
    
    async def get_pending_workflows(self) -> List[Dict]:
        """Get workflows awaiting human review"""
        async with self.AsyncSessionLocal() as session:
            result = await session.execute(select(WorkflowExecutionDB).where(WorkflowExecutionDB.status == "pending_review"))
            results = result.scalars().all()
            return [{"workflow_id": r.workflow_id, "entity": f"{r.entity_type}:{r.entity_id}"} for r in results]


# ============================================================================
# EVENT-DRIVEN WORKFLOW TRIGGERS
# ============================================================================

class WorkflowTrigger(str, Enum):
    """Events that trigger workflows"""
    USER_REGISTRATION = "user_registration"
    PROPERTY_LISTED = "property_listed"
    TRANSACTION_INITIATED = "transaction_initiated"
    DISPUTE_CREATED = "dispute_created"
    FRAUD_DETECTED = "fraud_detected"
    DOCUMENT_UPLOADED = "document_uploaded"
    LARGE_TRANSACTION = "large_transaction"
    REGULATORY_FLAG = "regulatory_flag"


class WorkflowTriggerEngine:
    """Automatically trigger workflows based on events"""
    
    def __init__(self, orchestrator: AutomatedComplianceOrchestrator):
        self.orchestrator = orchestrator
        self.trigger_rules = self._define_trigger_rules()
        self.triggered_count = {}
    
    def _define_trigger_rules(self) -> Dict:
        """Define workflow trigger rules"""
        return {
            WorkflowTrigger.USER_REGISTRATION: {
                "workflows": [ComplianceWorkflow.KYC_VERIFICATION, ComplianceWorkflow.AML_SCREENING],
                "immediate": True
            },
            WorkflowTrigger.PROPERTY_LISTED: {
                "workflows": [ComplianceWorkflow.PROPERTY_COMPLIANCE],
                "immediate": True
            },
            WorkflowTrigger.TRANSACTION_INITIATED: {
                "workflows": [ComplianceWorkflow.DOCUMENT_VERIFICATION, ComplianceWorkflow.AML_SCREENING], # Added AML here too
                "immediate": False  # Async
            },
            WorkflowTrigger.FRAUD_DETECTED: {
                "workflows": [ComplianceWorkflow.AML_SCREENING],
                "immediate": True,
                "priority": "high"
            },
            WorkflowTrigger.REGULATORY_FLAG: {
                "workflows": [ComplianceWorkflow.REGULATORY_REPORTING],
                "immediate": True,
                "priority": "critical"
            }
        }
    
    async def trigger_workflows(
        self,
        trigger_event: WorkflowTrigger,
        entity_id: str,
        entity_type: str,
        data: Dict
    ) -> List[Dict]:
        """Trigger workflows based on event"""
        
        if trigger_event not in self.trigger_rules:
            return []
        
        rules = self.trigger_rules[trigger_event]
        triggered_workflows = []
        
        for workflow_type in rules["workflows"]:
            logger.info(f"Triggering {workflow_type.value} for {trigger_event.value}")
            
            execution = await self.orchestrator.start_workflow(
                workflow_type=workflow_type,
                entity_id=entity_id,
                entity_type=entity_type,
                initial_data=data
            )
            
            triggered_workflows.append(execution)
            
            self.triggered_count[trigger_event.value] = self.triggered_count.get(trigger_event.value, 0) + 1
        
        return triggered_workflows
    
    def get_trigger_statistics(self) -> Dict:
        """Get trigger execution statistics"""
        return {
            "total_triggered": sum(self.triggered_count.values()),
            "by_trigger": self.triggered_count
        }


# ============================================================================
# INTELLIGENT NOTIFICATIONS
# ============================================================================

class NotificationIntelligence:
    """Intelligent notification routing and optimization"""
    
    def __init__(self):
        self.notification_queue = []
        self.user_preferences = {}
        self.notification_history = []
    
    async def schedule_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str,
        priority: str = "normal",
        channels: List[str] = None
    ) -> Dict:
        """Schedule intelligent notification"""
        
        # Get user preferences
        preferences = self.user_preferences.get(user_id, {})
        
        # Determine optimal channels
        channels = channels or await self._select_optimal_channels(user_id, priority)
        
        # Schedule based on user's optimal time
        optimal_time = await self._get_optimal_time(user_id, notification_type)
        
        notification = {
            "notification_id": f"notif_{datetime.now().timestamp()}",
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "priority": priority,
            "channels": channels,
            "scheduled_time": optimal_time,
            "status": "queued",
            "created_at": datetime.now().isoformat()
        }
        
        self.notification_queue.append(notification)
        
        return notification
    
    async def _select_optimal_channels(self, user_id: str, priority: str) -> List[str]:
        """Select best notification channels for user"""
        
        # Default channels based on priority
        if priority == "critical":
            return ["email", "sms", "push"]
        elif priority == "high":
            return ["email", "push"]
        else:
            return ["push"]
    
    async def _get_optimal_time(self, user_id: str, notification_type: str) -> str:
        """Get optimal time to send notification"""
        
        # In production: analyze user activity patterns
        # For now, schedule for next business hour
        return (datetime.now() + timedelta(hours=1)).isoformat()
    
    async def send_bulk_notifications(self, user_ids: List[str], message_template: Dict) -> int:
        """Send notifications to multiple users"""
        
        count = 0
        for user_id in user_ids:
            await self.schedule_notification(
                user_id=user_id,
                title=message_template.get("title", ""),
                message=message_template.get("message", ""),
                notification_type=message_template.get("type", "general"),
                channels=message_template.get("channels", [])
            )
            count += 1
        
        logger.info(f"Queued {count} notifications")
        return count
