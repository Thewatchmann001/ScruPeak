"""
Routers package initialization
"""
from . import auth
from . import users
from . import land
from . import agents
from . import escrow
from . import chat
from . import blockchain
from . import admin
from . import documents
from . import payments
from . import title_verification
from . import fraud_detection
from . import dispute_resolution
from . import compliance
from . import digital_signatures
from . import blockchain_contracts
from . import multi_stakeholder_roles
from . import ml_services
from . import ai
from . import tasks
from . import payments_monime
from . import kyc
from . import registry
from . import taxation

__all__ = [
    "auth",
    "users",
    "land",
    "agents",
    "escrow",
    "chat",
    "blockchain",
    "admin",
    "payments_monime"
]
