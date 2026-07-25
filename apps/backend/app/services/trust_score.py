"""
Trust Score Engine for ScruPeak
Calculates a dynamic trust score for land parcels based on multiple verification factors.
Refined for West Africa production level (0-10 scale).
"""
from typing import Dict, Any, Optional

def calculate_trust_score(
    has_buyer_seller_doc: bool = False,  # Previous & Current owner names (Score: 3)
    has_surveyor_doc: bool = False,      # Name of surveyor included (Score: 3)
    has_chief_attestation: bool = False, # Chief/traditional ruler (Score: 2.5)
    has_gov_doc: bool = False,           # Ministry/OARG document (Score: 1.5)
    dispute_history: bool = False        # Penalty factor
) -> Dict[str, Any]:
    """
    Calculate trust score (0-10) based on specific West African verification factors.
    Total possible: 10.0
    
    Criteria:
    1. Buyer-seller/Land owner document: 3.0
    2. Surveyor document (Name important): 3.0
    3. Chief/traditional ruler attestation: 2.5
    4. Government (Ministry, OARG) document: 1.5
    """
    score = 0.0

    # 1. Buyer-seller document (3.0)
    if has_buyer_seller_doc:
        score += 3.0

    # 2. Surveyor document (3.0)
    if has_surveyor_doc:
        score += 3.0

    # 3. Chief/traditional ruler attestation (2.5)
    if has_chief_attestation:
        score += 2.5

    # 4. Government (Ministry, OARG) document (1.5)
    if has_gov_doc:
        score += 1.5

    # 5. Penalty for dispute history
    if dispute_history:
        score = max(0.0, score - 5.0)

    # Normalize score between 0 and 10
    final_score = round(max(0.0, min(10.0, score)), 1)

    # Determine rating category
    if final_score >= 8.5:
        rating = "Premium"
        color = "text-green-600"
    elif final_score >= 6.0:
        rating = "Standard"
        color = "text-blue-600"
    elif final_score >= 4.0:
        rating = "Basic"
        color = "text-amber-600"
    else:
        rating = "High Risk"
        color = "text-red-600"

    return {
        "score": final_score,
        "max_score": 10.0,
        "rating": rating,
        "color": color,
        "factors": {
            "has_buyer_seller_doc": has_buyer_seller_doc,
            "has_surveyor_doc": has_surveyor_doc,
            "has_chief_attestation": has_chief_attestation,
            "has_gov_doc": has_gov_doc,
            "dispute_history": dispute_history
        }
    }
