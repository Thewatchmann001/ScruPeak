"""
Trust Score Engine for ScruPeak
Calculates a dynamic trust score for land parcels based on multiple verification factors.
"""
from typing import Dict, Any, Optional

def calculate_trust_score(
    mandatory_docs_provided: int = 0,  # Number of mandatory docs (Max 4: Survey, Deed, Consent, Photo)
    admin_verified: bool = False,
    document_chain_depth: int = 0,    # Spec: Tracing back two ownership generations
    satellite_boundary_match: bool = False,
    land_type: str = "traditional",  # formal or traditional
    dispute_history: bool = False,
    kyc_completeness: float = 0.0,    # 0.0 to 1.0
    verified_by_surveyor: bool = False,
    is_internal_listing: bool = True  # Platform vs external listing
) -> Dict[str, Any]:
    """
    Calculate trust score (0-100) based on verification factors.
    Priority given to mandatory documents and admin verification as requested.

    Factors:
    - Mandatory Documents (Max 50): +12.5 per doc (Survey, Deed, Consent, Photo)
    - Admin Verification (Max 30): +30 if verified
    - Document chain depth (Max 10): +5 per generation (max 2)
    - Satellite boundary match (Max 5): +5
    - KYC completeness (Max 5): +5 * completeness
    - Dispute history (Negative): -50
    """
    score = 0

    # 1. Mandatory Documents (Max 50) - Core requirement
    score += min(mandatory_docs_provided * 12.5, 50)

    # 2. Admin Verification (Max 30) - Core requirement
    if admin_verified:
        score += 30

    # 3. Document chain depth (Max 10)
    score += min(document_chain_depth * 5, 10)

    # 4. Satellite boundary match (Max 5)
    if satellite_boundary_match:
        score += 5

    # 5. KYC completeness (Max 5)
    score += int(kyc_completeness * 5)

    # 6. Dispute history (Penalty)
    if dispute_history:
        score -= 50

    # Normalize score between 0 and 100
    final_score = max(0, min(100, score))

    # Determine rating category
    if final_score >= 85:
        rating = "Premium"
        color = "text-green-600"
    elif final_score >= 60:
        rating = "Standard"
        color = "text-blue-600"
    elif final_score >= 30:
        rating = "Basic"
        color = "text-amber-600"
    else:
        rating = "High Risk"
        color = "text-red-600"

    return {
        "score": final_score,
        "rating": rating,
        "color": color,
        "factors": {
            "mandatory_docs_count": mandatory_docs_provided,
            "admin_verified": admin_verified,
            "document_chain_depth": document_chain_depth,
            "satellite_match": satellite_boundary_match,
            "land_type": land_type,
            "dispute_history": dispute_history,
            "kyc_completeness": kyc_completeness,
            "is_internal": is_internal_listing
        }
    }
