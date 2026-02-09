"""
Decision & Classification Engine

Interprets spatial events and produces decisions with three mandatory sections:
1. Classification (single, clear category)
2. Decision Explanation (human-readable)
3. Technical Justification (based on spatial + regulatory logic)

Enforces OARG authority and flags fraud/ambiguity.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict, List
from csi_model import CompositeSpatialIdentity, ParcelEvent, EventType
from spatial_detector import SpatialRelationshipDetector


class DecisionClassification(Enum):
    """Allowed decision classifications"""
    LEGITIMATE_SUBDIVISION = "legitimate_subdivision"
    PARCEL_SPLIT = "parcel_split"
    PARCEL_MERGE = "parcel_merge"
    CONFLICTING_CLAIM = "conflicting_claim"
    FRAUD_RISK = "fraud_risk"
    REQUIRES_MANUAL_REVIEW = "requires_manual_review"


@dataclass
class SpatialDecision:
    """
    Decision with three mandatory sections.
    
    All decisions for every parcel event MUST have:
    1. classification
    2. decision_explanation (human-readable)
    3. technical_justification (spatial + regulatory reasoning)
    """
    
    decision_id: str
    classification: DecisionClassification
    
    # SECTION 1: Classification (implicit from enum)
    
    # SECTION 2: Decision Explanation (human-readable)
    decision_explanation: str
    
    # SECTION 3: Technical Justification
    technical_justification: str
    
    # Supporting data
    parcel_code: str
    related_parcels: List[str]
    spatial_relationship: Optional[str] = None
    overlap_area_sqm: Optional[float] = None
    
    # Regulatory flags
    oarg_authority_invoked: bool = False
    flags: List[str] = None
    
    def __post_init__(self):
        if self.flags is None:
            self.flags = []
    
    def __repr__(self):
        return f"""
================================
SPATIAL DECISION REPORT
================================

1. CLASSIFICATION
   {self.classification.value}

2. DECISION EXPLANATION
   {self.decision_explanation}

3. TECHNICAL JUSTIFICATION
   {self.technical_justification}

DETAILS:
   Parcel: {self.parcel_code}
   Related: {self.related_parcels}
   Relationship: {self.spatial_relationship}
   Overlap: {self.overlap_area_sqm} sqm
   OARG Review: {self.oarg_authority_invoked}
   Flags: {', '.join(self.flags) if self.flags else 'None'}
================================
"""


class DecisionEngine:
    """Interprets spatial events and produces decisions"""
    
    def __init__(self, registry=None):
        self.registry = registry
    
    def classify_parcel_event(
        self,
        event: ParcelEvent,
        subject_csi: CompositeSpatialIdentity
    ) -> SpatialDecision:
        """
        Classify a parcel event and produce a three-section decision.
        
        Input: ParcelEvent with spatial relationship detected
        Output: SpatialDecision with classification, explanation, justification
        """
        
        import uuid
        decision_id = str(uuid.uuid4())
        
        # Extract spatial info
        relationship = event.spatial_relationship
        overlap_area = event.overlap_area_sqm or 0
        other_codes = [c.parcel_code for c in event.other_csis]
        
        # ========== CLASSIFICATION LOGIC ==========
        
        # Case 1: Identical geometry = conflicting claim (multiple ownership)
        if relationship == "identical":
            return SpatialDecision(
                decision_id=decision_id,
                classification=DecisionClassification.CONFLICTING_CLAIM,
                decision_explanation=(
                    f"Parcel {subject_csi.parcel_code} has identical geometry to {other_codes[0]}. "
                    "This indicates either duplicate registration (fraud) or overlapping ownership claims. "
                    "OARG must resolve which parcel code is authoritative."
                ),
                technical_justification=(
                    f"Spatial test: polygon_a.equals(polygon_b) = True. "
                    f"CSI lineage check: {subject_csi.parcel_code} parent = {subject_csi.parent_lineage}. "
                    f"Grid rule: {subject_csi.grid_ref.canonical_key()} vs {event.other_csis[0].grid_ref.canonical_key()}. "
                    "Verdict: Multiple authorities claiming same land. Fraud risk or registration error."
                ),
                parcel_code=subject_csi.parcel_code,
                related_parcels=other_codes,
                spatial_relationship=relationship,
                overlap_area_sqm=overlap_area,
                oarg_authority_invoked=True,
                flags=["DUPLICATE_GEOMETRY", "OWNERSHIP_CONFLICT"]
            )
        
        # Case 2: Contained = legitimate subdivision or illegal encroachment
        if relationship == "contained":
            other_csi = event.other_csis[0]
            
            # Check if other is parent (lineage)
            if (subject_csi.parent_lineage and 
                subject_csi.parent_lineage.parent_parcel_code == other_csi.parcel_code):
                
                # Legitimate: child is contained in parent
                return SpatialDecision(
                    decision_id=decision_id,
                    classification=DecisionClassification.LEGITIMATE_SUBDIVISION,
                    decision_explanation=(
                        f"Parcel {subject_csi.parcel_code} is a legitimate child of parent "
                        f"{other_csi.parcel_code}. Geometry is fully contained within parent. "
                        "Lineage verified. This is a valid subdivision."
                    ),
                    technical_justification=(
                        f"Containment test: parent.contains(child) = True. "
                        f"Lineage test: parent_lineage link exists. "
                        f"Parent CSI: {other_csi.csi_id}. "
                        f"Relationship type: {subject_csi.parent_lineage.relationship_type}. "
                        f"Grid rule maintained: child grid {subject_csi.grid_ref.canonical_key()} "
                        f"references first vertex of child polygon. "
                        "Verdict: Valid subdivision. Parent remains intact; child inherits from parent."
                    ),
                    parcel_code=subject_csi.parcel_code,
                    related_parcels=[other_csi.parcel_code],
                    spatial_relationship=relationship,
                    overlap_area_sqm=overlap_area,
                    flags=["VALID_LINEAGE"]
                )
            else:
                # Potential fraud: contained in unrelated parcel
                return SpatialDecision(
                    decision_id=decision_id,
                    classification=DecisionClassification.FRAUD_RISK,
                    decision_explanation=(
                        f"Parcel {subject_csi.parcel_code} is spatially contained within "
                        f"{other_csi.parcel_code}, but no lineage link exists. "
                        "This suggests either an invalid claim or registration fraud."
                    ),
                    technical_justification=(
                        f"Containment test: other.contains(subject) = True. "
                        f"Lineage test: NO parent_lineage link to {other_csi.parcel_code}. "
                        f"Owner match: subject={subject_csi.owner}, other={other_csi.owner}. "
                        "Grid reference rule: child must be born from parent with formal lineage. "
                        "Verdict: Fraudulent or erroneous containment. Requires OARG intervention."
                    ),
                    parcel_code=subject_csi.parcel_code,
                    related_parcels=[other_csi.parcel_code],
                    spatial_relationship=relationship,
                    overlap_area_sqm=overlap_area,
                    oarg_authority_invoked=True,
                    flags=["ORPHAN_CONTAINMENT", "LINEAGE_MISSING"]
                )
        
        # Case 3: Partial overlap = ambiguous; requires manual review
        if relationship == "overlap":
            return SpatialDecision(
                decision_id=decision_id,
                classification=DecisionClassification.REQUIRES_MANUAL_REVIEW,
                decision_explanation=(
                    f"Parcel {subject_csi.parcel_code} has a partial spatial overlap "
                    f"({overlap_area:.0f} sqm) with {other_codes[0]}. "
                    "The overlapping area cannot be owned by both parties. "
                    "A human OARG officer must determine which parcel holds title to the overlap."
                ),
                technical_justification=(
                    f"Intersection test: area(poly_a ∩ poly_b) = {overlap_area:.0f} sqm. "
                    f"Disjoint test: False. Containment test: False. "
                    f"Lineage: {subject_csi.parcel_code} parent={subject_csi.parent_lineage}. "
                    f"No automated rule can resolve partial overlaps without legal authority. "
                    "Requires OARG judgment to establish rightful owner and resolve boundary."
                ),
                parcel_code=subject_csi.parcel_code,
                related_parcels=other_codes,
                spatial_relationship=relationship,
                overlap_area_sqm=overlap_area,
                oarg_authority_invoked=True,
                flags=["PARTIAL_OVERLAP", "AMBIGUOUS"]
            )
        
        # Case 4: Contains (subject contains other)
        if relationship == "contains":
            # If other is a registered child, this is okay (parent > child area)
            other_csi = event.other_csis[0]
            if (other_csi.parent_lineage and 
                other_csi.parent_lineage.parent_parcel_code == subject_csi.parcel_code):
                
                return SpatialDecision(
                    decision_id=decision_id,
                    classification=DecisionClassification.LEGITIMATE_SUBDIVISION,
                    decision_explanation=(
                        f"Parcel {subject_csi.parcel_code} is the parent; it contains "
                        f"child {other_csi.parcel_code}. This is a valid subdivision "
                        "where parent remains intact and children are registered."
                    ),
                    technical_justification=(
                        f"Containment test: parent.contains(child) = True. "
                        f"Lineage test: child parent_lineage points to this parent. "
                        f"Parent metadata: transferable_area tracks original extent. "
                        "Verdict: Valid subdivision. No property violation."
                    ),
                    parcel_code=subject_csi.parcel_code,
                    related_parcels=[other_csi.parcel_code],
                    spatial_relationship=relationship,
                    overlap_area_sqm=overlap_area,
                    flags=["VALID_PARENT"]
                )
            else:
                # Ambiguous: containment without lineage
                return SpatialDecision(
                    decision_id=decision_id,
                    classification=DecisionClassification.REQUIRES_MANUAL_REVIEW,
                    decision_explanation=(
                        f"Parcel {subject_csi.parcel_code} spatially contains {other_csi.parcel_code}, "
                        "but no formal parent-child lineage link exists. "
                        "This could indicate an unregistered subdivision or overlapping claims."
                    ),
                    technical_justification=(
                        f"Containment test: subject.contains(other) = True. "
                        f"Lineage: other.parent_lineage points to {other_csi.parent_lineage}. "
                        "Grid rule and lineage are the only valid basis for subdivision. "
                        "Verdict: Ambiguous spatial relationship. Requires OARG clarification."
                    ),
                    parcel_code=subject_csi.parcel_code,
                    related_parcels=[other_csi.parcel_code],
                    spatial_relationship=relationship,
                    overlap_area_sqm=overlap_area,
                    oarg_authority_invoked=True,
                    flags=["CONTAINMENT_AMBIGUOUS"]
                )
        
        # Default: uncertain
        return SpatialDecision(
            decision_id=decision_id,
            classification=DecisionClassification.REQUIRES_MANUAL_REVIEW,
            decision_explanation=(
                f"Parcel {subject_csi.parcel_code} event could not be automatically classified. "
                "Manual OARG review required."
            ),
            technical_justification=(
                f"Spatial relationship: {relationship}. "
                "No deterministic rule matches this case. "
                "Recommend human review by OARG."
            ),
            parcel_code=subject_csi.parcel_code,
            related_parcels=other_codes,
            spatial_relationship=relationship,
            overlap_area_sqm=overlap_area,
            oarg_authority_invoked=True,
            flags=["UNCERTAIN"]
        )
